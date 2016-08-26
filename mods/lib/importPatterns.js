const named = require('named-regexp').named;
const _ = require('lodash');

// Prime jsio with some common paths
// jsio.addPath('./timestep/src');
// path: jsio/packages . lib timestep/src
// pathCache: devkit -> devkit-core/src/clientapi
// pathCache: squill -> squill/

const impName = name => `(:<${name}>[a-zA-Z\\.\\$]+?)`;
const modulePathRegex = `(:<dotPath>[.]+)?${impName('module')}`;
const multipleModulesRegex = '(:<modules>[a-zA-Z\\.\\$]+[\\s]*[,]+[\\s]*[a-zA-Z\\.\\$,\\s]+)';
const singleModulesRegex = named(new RegExp(`^${modulePathRegex}$`, 'm'));

const getModulePath = (_module, _dotPath) => {
  const modulePath = (_module || '').split('.');
  var dotPath = (_dotPath || '').split('');

  // if there are more than two dots the first two will count as one
  // dot-path, the other dots will count as one dot-path each,
  // hence we remove one
  if (dotPath.length > 1) {
    dotPath.pop();
    dotPath = dotPath.map(() => '..');
  }

  // join dot-path and modulepath
  return dotPath.concat(modulePath).join('/');
}

const detectNamingCollision = (j, node, name) => {
  if (
    j(node)
    .closest(j.Program)
    .find(j.Identifier, { name })
    .filter(path => j(path).closest(j.MemberExpression).nodes().length < 1)
    .nodes()
    .length > 0
  ) {
    throw new Error(`The module with name '${name} collides with another variable in this file, please rename the file and try again`);
  }
}

const replaceBreadCrumbVariables = (j, node, names, moduleName) => {
  if (names.length > 1) {
    const needle = names.reduce((prev, next, index) => {
      if (typeof prev === 'string') {
        return {
          object: { name: prev },
          property: { name: next }
        };
      }
      return {
        object: prev,
        property: { name: next }
      };
    });

    j(node)
    .closest(j.Program)
    .find(j.MemberExpression, needle)
    .filter(path => j(path).closest(j.MemberExpression).nodes().length < 1)
    .replaceWith(j.identifier(moduleName));
  }
}

const getModuleName = (modulePath, binding) => (
  binding || modulePath.split('.').slice(-1)[0]
)

const buildDefaultImport = (j, moduleName, modulePath) => (
  j.importDeclaration([
    j.importDefaultSpecifier(
      j.identifier(moduleName)
    )],
    j.literal(modulePath)
  )
);

const buildImport = (j, moduleName, modulePath) => (
  j.importDeclaration(
    [
      j.importSpecifier(
        j.identifier(moduleName)
      )
    ],
    j.literal(modulePath)
  )
);

const buildAliasImport = (j, moduleName, modulePath, alias) => (
  j.importDeclaration(
    [
      j.importSpecifier(
        j.identifier(moduleName),
        j.identifier(alias)
      )
    ],
    j.literal(modulePath)
  )
);

const transformImport = (j, item, match) => {
  const module = _.get(match, 'captures.module[0]');
  const binding = _.get(match, 'captures.binding[0]');
  const dotPath = _.get(match, 'captures.dotPath[0]');

  const moduleName = getModuleName(module, binding);
  const modulePath = getModulePath(module, dotPath);

  detectNamingCollision(j, item, moduleName);
  replaceBreadCrumbVariables(j, item, module.split('.'), moduleName);

  const importNode = buildDefaultImport(j, moduleName, modulePath);
  return j(item).replaceWith(importNode);
};

const importPatterns = {
  single: {
    re: named(new RegExp(`^import ${modulePathRegex}$`, 'm')),
    transform: transformImport
  },

  multiple: {
    re: named(new RegExp(`^import ${multipleModulesRegex}$`, 'm')),
    transform: (j, item, match) => {
      const modules = match.captures.modules[0].split(',').map(item => item.trim());
      const parentStatement = j(item).closest(j.ExpressionStatement);
      modules.reverse().forEach(mod => {
        const subMatch = singleModulesRegex.exec(mod);
        const module = _.get(subMatch, 'captures.module[0]');
        const binding = _.get(subMatch, 'captures.binding[0]');
        const dotPath = _.get(subMatch, 'captures.dotPath[0]');

        const moduleName = getModuleName(module, binding);
        const modulePath = getModulePath(module, dotPath);

        detectNamingCollision(j, item, moduleName);
        replaceBreadCrumbVariables(j, item, module.split('.'), moduleName);

        parentStatement.insertAfter(
          buildDefaultImport(j, moduleName, modulePath)
        );
      })
      j(item).remove();
    }
  },

  binding: {
    re: named(new RegExp('^import ' + modulePathRegex + ' as ' + impName('binding') + '$', 'm')),
    transform: transformImport
  },

  from: {
    re: named(new RegExp('^from ' + modulePathRegex + ' import ' + impName('selection') + '$', 'm')),
    transform: (j, item, match) => {
      const module = _.get(match, 'captures.module[0]');
      const moduleName = _.get(match, 'captures.selection[0]');
      const dotPath = _.get(match, 'captures.dotPath[0]');
      const modulePath = getModulePath(module, dotPath);

      detectNamingCollision(j, item, moduleName);

      j(item).replaceWith(
        buildImport(j, moduleName, modulePath)
      )
    }
  },

  bindingFrom: {
    re: named(new RegExp('^from ' + modulePathRegex + ' import ' + impName('selection') + ' as ' + impName('binding') + '$', 'm')),
    transform: (j, item, match) => {
      const module = _.get(match, 'captures.module[0]');
      const moduleName = _.get(match, 'captures.selection[0]');
      const alias = _.get(match, 'captures.binding[0]');
      const dotPath = _.get(match, 'captures.dotPath[0]');
      const modulePath = getModulePath(module, dotPath);

      detectNamingCollision(j, item, module);
      detectNamingCollision(j, item, moduleName);
      detectNamingCollision(j, item, alias);

      j(item).replaceWith(
        buildDefaultImport(j, module, modulePath)
      );

      j(item).closest(j.Statement).insertAfter(
        j.variableDeclaration(
          'const',
          [j.variableDeclarator(
            j.objectPattern([
              j.property(
                'init',
                j.identifier(moduleName),
                j.identifier(alias)
              )
            ]),
            j.identifier(module)
          )]
        )
      );
    }
  }
};

module.exports = importPatterns;
