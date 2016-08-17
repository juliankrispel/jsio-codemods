const named = require('named-regexp').named;
//
// const jsio = require('jsio');
// Prime jsio with some common paths
// jsio.addPath('./timestep/src');
// path: jsio/packages . lib timestep/src
// pathCache: devkit -> devkit-core/src/clientapi
// pathCache: squill -> squill/

const impName = name => '(:<' + name + '>[a-zA-Z\\.\\$]+?)';
const modulePathRegex = '(:<dotPath>[.]+)?' + impName('module');


const importPatterns = {
  single: {
    re: named(new RegExp('^import ' + modulePathRegex + '$', 'm')),
    transform: (j, item, match) => {
      const moduleName = match.captures.module[0];
      const dotPath = match.captures.dotPath[0];
      console.log('captures - ', match.captures);
      return j.importDeclaration(
        [j.importDefaultSpecifier(j.identifier(moduleName))],
        j.literal(moduleName)
      )
    }
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
