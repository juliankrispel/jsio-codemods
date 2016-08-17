'use strict';
const named = require('named-regexp').named;
const _ = require('lodash');

// Stolen from: https://github.com/gameclosure/js.io/blob/bf8cdfa2c19fd610b179ce47ca7101f36988c7e9/packages/preprocessors/import.js //
var importExpr = /^(\s*)(import\s+[^=+*"'\r\n;\/]+|from\s+[^=+"'\r\n;\/ ]+\s+import\s+[^=+"'\r\n;\/]+)(;|\/|$)/gm;
var replaceFn = function (raw, p1, p2, p3) {
  if (!/\/\//.test(p1)) {
    return p1 + 'jsio(\'' + p2 + '\')' + p3;
  }
  return raw;
}
// ---- //


// const jsio = require('jsio');
// Prime jsio with some common paths
// jsio.addPath('./timestep/src');
// path: jsio/packages . lib timestep/src
// pathCache: devkit -> devkit-core/src/clientapi
// pathCache: squill -> squill/


const impName = name => '(:<' + name + '>[a-zA-Z\\.\\$]+?)';
const importPatterns = {
  single: {
    re: named(new RegExp('^import ' + impName('module') + '$', 'gm')),
    transform: (j, item, match) => {
      const moduleName = match.captures.module[0];
      return j.importDeclaration(
        [j.importDefaultSpecifier(j.identifier(moduleName))],
        j.literal(moduleName)
      )
    }
  },
  binding: {
    re: named(new RegExp('^import ' + impName('module') + ' as ' + impName('binding') + '$', 'gm')),
    transform: (j, item, match) => {}
  },
  from: {
    re: named(new RegExp('^from ' + impName('module') + ' import ' + impName('selection') + '$', 'gm')),
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
    re: named(new RegExp('^from ' + impName('module') + ' import ' + impName('selection') + ' as ' + impName('binding') + '$', 'gm')),
    transform: (j, item, match) => {}
  }
};


const transformImport = (j, item) => {
  console.log('\n');
  // console.log('item=', item);

  if (
    !item.parent ||
    !item.parent.parent ||
    item.parent.parent.name !== 'program'
  ) {
    throw new Error('Imports must be top level', item.parent.parent.type);
  }

  if (item.value.arguments.length !== 1) {
    throw new Error('Arguments length is not 1', item.value.arguments.length);
  }

  const argumentNode = item.value.arguments[0];
  if (argumentNode.type !== 'Literal') {
    throw new Error('Argument type not Literal', argumentNode.type);
  }

  const importString = argumentNode.value;
  console.log('importString=', importString);

  let match;
  let importPattern;
  _.forEach(importPatterns, (pattern, reName) => {
    const newMatch = pattern.re.exec(importString);
    if (newMatch) {
      if (match) {
        throw new Error('Ambiguous import match');
      }
      match = newMatch;
      importPattern = pattern;
    }
  });

  if (!match) {
    throw new Error('Could not match import signature');
  }

  console.log('match=', match);
  return importPattern.transform(j, item, match);
};


const toSourceOpts = { quote: 'single' };

module.exports = function(fileInfo, api, options) {
  const j = api.jscodeshift;
  // Transform source so that the AST can be built
  fileInfo.source = fileInfo.source.replace(importExpr, replaceFn);
  const shifted = j(fileInfo.source);

  shifted.find(j.CallExpression, { callee: { name: 'jsio' } })
    .forEach(item => j(item).replaceWith(transformImport(j, item)));
  return shifted.toSource(toSourceOpts).replace(/;;+/gi, ';');
};
