'use strict';

const _ = require('lodash');
const extractClassBody = (j, path) => (
  j(path).find(j.AssignmentExpression, { left: { object: j.ThisExpression } }).paths().map(path => {
    let methodName = path.value.left.property.name;
    let methodType = 'method';

    if (methodName === 'init') {
      methodType = methodName = 'constructor';
    }

    return j.methodDefinition(
      methodType,
      j.identifier(methodName),
      path.value.right
    )
  })
);

const detectInvalidClassDefinition = (path) => {
  const firstArg = _.get(path, 'value.arguments[0]');
  if (!firstArg ||
      firstArg.type !== 'FunctionExpression') {
    throw new Error("invalid jsio class definition, Class(...) does not contain a function as it's first argument. Please fix and continue");
  }

  firstArg.body.body.forEach(_node => {
    const node = _node.expression;
    if (node.type !== 'AssignmentExpression' ||
       node.left.object.type !== 'ThisExpression') {
      throw new Error(`error on line ${node.loc.start.line}\n` +
                      'Only `this` assignments are allowed in class definitions. like so\n' +
                      'this.fooMethod = function() {...}'
                     );
    }
  });
};

module.exports = (fileInfo, api, options) => {
  const j = api.jscodeshift;

  // Transform source so that the AST can be built
  const ast = j(fileInfo.source);

  ast.find(j.CallExpression, { callee: { name: 'Class' } })
  .forEach(path => {
    const parent = path.parent.value;

    // throw errors when the class has private variables
    detectInvalidClassDefinition(path);

    const classBody = extractClassBody(j, path);

    if (parent.type === 'VariableDeclarator') {
      const className = parent.id.name;
      j(path.parent.parent).replaceWith(
        j.classDeclaration(
          j.identifier(className),
          j.classBody(classBody)
        )
      )
    } else {
      j(path).replaceWith(
        j.classExpression(
          null,
          j.classBody(classBody)
        )
      );
    }
  });

  return ast.toSource({ quote: 'single' });
};
