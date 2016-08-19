'use strict';
const transformSuperCalls = (j, node, name) => {
  // We only replace the super method calls if the Class
  // function has an argument
  if (name) {
    // otherwise, we return
    j(node).find(j.CallExpression, { callee: { name } })
    .map(path => {
      const args = path.value.arguments;
      const methodName = args[1].value;
      const appliedArgs = _.get(args, '[2].elements', []);

      if (args[0].type !== 'ThisExpression') {
        throw new Error('not allowed:\n' +
                        'you called super with something other than' +
                        'the `this` value')
      }


      if (typeof methodName !== 'string') {
        throw new Error('not allowed:\n' +
                       'method name can only be a string');
      }

      let superIdentifier = j.identifier('super');
      if (methodName !== 'init') {
        superIdentifier = j.memberExpression(
          superIdentifier,
          j.identifier(methodName)
        )
      }


      j(path).replaceWith(
        j.callExpression(
          superIdentifier,
          appliedArgs
        )
      );
    });
  }

  return node;
};

const _ = require('lodash');

const getSuperClass = (j, path) => {
  const superClass = path.value.arguments[0];
  if (superClass.type === 'Identifier') {
    return superClass;
  }
  return null;
};

const extractClassBody = (j, path) => {
  const classFunctions = path.value.arguments.filter(node => node.type === 'FunctionExpression');
  const classFunction = classFunctions[0];
  const superMethodName = _.get(classFunction, 'params[0].name');

  return classFunction.body.body.filter(node => (
    _.get(node, 'expression.type') === 'AssignmentExpression' ||
    _.get(node, 'expression.left.object.type') === 'ThisExpression'
  )).map(_node => {
    const node = _.get(_node, 'expression');
    let methodName = node.left.property.name;
    let methodType = 'method';

    if (methodName === 'init') {
      methodType = methodName = 'constructor';
    }

    return j.methodDefinition(
      methodType,
      j.identifier(methodName),
      transformSuperCalls(j, node.right, superMethodName)
    );
  });
};

const detectInvalidClassDefinition = (path) => {
  const args = path.value.arguments;
  const classFunctions = path.value.arguments.filter(node => node.type === 'FunctionExpression');
  const classFunction = classFunctions[0];

  if (classFunctions.length === 0) {
    throw new Error('Invalid jsio class definition,\n' +
                    ', Class(...) does not contain a function as an argument.' +
                    'Please fix and continue');
  }

  if (classFunctions.length > 1) {
    throw new Error('invalid jsio class definition, multiple class functions\n' +
                   'are not allowed.');
  }

  if (args.length > 1 && args[0].type !== 'Identifier') {
    throw new Error('Super class is not a variable and therefore not allowed.\n' +
                    'Please fix and continue');
  }

  if (args.length > 2) {
    throw new Error('You can only pass 2 arguments to `Super`.\n' +
                    'Please fix and continue');
  }

  classFunction.body.body.forEach(_node => {
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
          j.classBody(classBody),
          getSuperClass(j, path)
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
