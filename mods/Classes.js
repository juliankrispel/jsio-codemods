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
      let appliedArgs = _.get(args, '[2]');

      if (appliedArgs && appliedArgs.type === 'ArrayExpression') {
        appliedArgs = appliedArgs.elements;
      } else {
        appliedArgs = appliedArgs ? [j.spreadElement(appliedArgs)] : [];
      }

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

const extractMethod = (j, node, superMethodName) => {
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
}

const extractDefineProperty = (j, node, superMethodName) => {
  const methodName = node.arguments[1].value;
  return node.arguments[2].properties.map(prop => {
    return j.methodDefinition(
      prop.key.name,
      j.identifier(methodName),
      transformSuperCalls(j, prop.value, superMethodName)
    )
  });
}

const extractClassBody = (j, path) => {
  const classFunctions = path.value.arguments.filter(node => node.type === 'FunctionExpression');
  const classFunction = classFunctions[0];
  const superMethodName = _.get(classFunction, 'params[0].name');

  return _.flatten(classFunction.body.body.map(node => _.get(node, 'expression')).filter(node => (
    (
      _.get(node, 'type') === 'CallExpression' &&
      _.get(node, 'callee.object.name') === 'Object' &&
      _.get(node, 'callee.property.name') === 'defineProperty'
    ) || (
      _.get(node, 'type') === 'AssignmentExpression' &&
      _.get(node, 'left.object.type') === 'ThisExpression')
    )
  ).map(node => {
    if (node.type === 'AssignmentExpression') {
      return extractMethod(j, node, superMethodName);
    }
    return extractDefineProperty(j, node, superMethodName);
  }));
};

const getSuperClass = (args) => {
  let superClass = null;

  args.forEach(arg => {
    if (arg.type === 'ArrayExpression' && arg.type !== 'FunctionExpression') {
      superClass = getSuperClass(arg.elements);
    } else if (arg.type !== 'Literal' && arg.type !== 'FunctionExpression'){
      if (superClass) {
        throw new Error('not allowed:' +
                        'es6 does not allow multiple inheritance\n' +
                        'please fix and continue');
      }

      superClass = arg;
    }
  });
  return superClass;
}

const getClassName = (args) => {
  let className;
  args.forEach(arg => {
    if (clasName) {
      throw new Error('not allowed:\n' +
                      `class name defined more than once, first name is ${className}`);
    }
    if (arg.type === 'Literal') {
      className = arg.value;
    } else if (arg.type === 'ArrayExpression') {
      className = getClassName(arg.elements);
    }
  });
  return className;
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
    throw new Error('not allowed:\n' +
                    'invalid jsio class definition, multiple class functions\n' +
                   'are not allowed.');
  }

  if (args.length > 2) {
    throw new Error('not allowed:\n' +
                    'You can only pass 2 arguments to `Class`.\n' +
                    'Please fix and continue');
  }

  classFunction.body.body.forEach(_node => {
    const node = _node.expression;
    if ((
          node.type !== 'AssignmentExpression' ||
          node.left.object.type !== 'ThisExpression'
        ) && (
          node.type !== 'CallExpression' ||
          _.get(node, 'callee.object.name') !== 'Object' ||
          _.get(node, 'callee.property.name') !== 'defineProperty'
        )) {
      throw new Error(`error on line ${node.loc.start.line}\n` +
                      'Only the following operations are allowed in class definitions:\n' +
                      '---- this.fooMethod = function() {...}\n' +
                      '\n' +
                      'and use of Object.defineProperty\n' +
                      `--- Object.defineProperty(this, 'state', {\n` +
                      '---   get: function() {... },' +
                      '---   set: function() {... }' +
                      '--- })'
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
          getSuperClass(path.value.arguments)
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
