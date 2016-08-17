const named = require('named-regexp').named;
const _ = require('lodash');

// Prime jsio with some common paths
// jsio.addPath('./timestep/src');
// path: jsio/packages . lib timestep/src
// pathCache: devkit -> devkit-core/src/clientapi
// pathCache: squill -> squill/

const impName = name => `(:<${name}>[a-zA-Z\\.\\$]+?)`;
const modulePathRegex = `(:<dotPath>[.]+)?${impName('module')}`;
const multipleModulesRegex = '(:<modules>[a-zA-Z\\.\\$]+[,]+[\s]*[a-zA-Z\\.\\$,\\s]+)';
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

const getModuleName = (modulePath, binding) => (
  binding || modulePath.split('.').slice(-1)[0]
)

const buildImport = (j, module, binding, dotPath) => (
  j.importDeclaration([
    j.importDefaultSpecifier(
      j.identifier(getModuleName(module, binding))
    )],
    j.literal(getModulePath(module, dotPath))
  )
);

const transformImport = (j, item, match) => {
  const module = _.get(match, 'captures.module[0]');
  const binding = _.get(match, 'captures.binding[0]');
  const dotPath = _.get(match, 'captures.dotPath[0]');

  return j(item).replaceWith(buildImport(j, module, binding, dotPath));
};

const importPatterns = {
  single: {
    re: named(new RegExp(`^import ${modulePathRegex}$`, 'm')),
    transform: transformImport
  },
  multiple: {
    re: named(new RegExp(`^import ${multipleModulesRegex}$`, 'm')),
    transform: (j, item, match) => {
      const modules =  match.captures.modules[0].split(',').map(item => item.trim());
      const parentStatement = j(item).closest(j.ExpressionStatement);
      modules.reverse().forEach(mod => {
        const subMatch = singleModulesRegex.exec(mod);
        const module = _.get(subMatch, 'captures.module[0]');
        const binding = _.get(subMatch, 'captures.binding[0]');
        const dotPath = _.get(subMatch, 'captures.dotPath[0]');

        parentStatement.insertAfter(
          buildImport(j, module, binding, dotPath)
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
      const selection = _.get(match, 'captures.selection[0]');
      const dotPath = _.get(match, 'captures.dotPath[0]');

      j(item).replaceWith(
        j.importDeclaration(
          [
            j.importSpecifier(
              j.identifier(selection),
              j.identifier(selection)
            )
          ],
          j.literal(getModulePath(module, dotPath))
        )
      )
    }
  },
  bindingFrom: {
    re: named(new RegExp('^from ' + modulePathRegex + ' import ' + impName('selection') + ' as ' + impName('binding') + '$', 'm')),
    transform: (j, item, match) => {}
  }
};

module.exports = importPatterns;
