const named = require('named-regexp').named;
// const jsio = require('jsio');
// Prime jsio with some common paths
// jsio.addPath('./timestep/src');
// path: jsio/packages . lib timestep/src
// pathCache: devkit -> devkit-core/src/clientapi
// pathCache: squill -> squill/

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const impName = name => '(:<' + name + '>[a-zA-Z\\.\\$]+?)';
const modulePathRegex = '(:<dotPath>[.]+)?' + impName('module');

const getModulePath = (captures) => {
  var modulePath = captures.module[0].split('.');
  var dotPath = captures.dotPath[0].split('');

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

const getModuleName = (captures) => (
  captures.module[0].split('.')
  .map((fragment, index) => {
    if (index > 0) {
      return capitalizeFirstLetter(fragment);
    }
    return fragment;
  }).join('')
);

const importPatterns = {
  single: {
    re: named(new RegExp('^import ' + modulePathRegex + '$', 'm')),
    transform: (j, item, match) => (
      // if there is more than one dot, put the 
      //console.log('captures - ', match.captures);
      j.importDeclaration(
        [j.importDefaultSpecifier(j.identifier(getModuleName(match.captures)))],
        j.literal(getModulePath(match.captures))
      )
    )
  },
  binding: {
    re: named(new RegExp('^import ' + modulePathRegex + ' as ' + impName('binding') + '$', 'm')),
    transform: (j, item, match) => {}
  },
  from: {
    re: named(new RegExp('^from ' + modulePathRegex + ' import ' + impName('selection') + '$', 'm')),
    transform: (j, item, match) => {
      const modulePath = match.captures.module[0];
      const selection = match.captures.selection[0];

      const importDec = j.importDeclaration(
        [j.importSpecifier(j.identifier(selection), j.identifier(selection))],
        j.literal(modulePath)
      );

      return j(item).replaceWith(importDec);
    }
  },
  bindingFrom: {
    re: named(new RegExp('^from ' + modulePathRegex + ' import ' + impName('selection') + ' as ' + impName('binding') + '$', 'm')),
    transform: (j, item, match) => {}
  }
};

module.exports = importPatterns;
