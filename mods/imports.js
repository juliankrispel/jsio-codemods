'use strict';
const _ = require('lodash');
const importPatterns = require('./lib/importPatterns');

// Stolen from: https://github.com/gameclosure/js.io/blob/bf8cdfa2c19fd610b179ce47ca7101f36988c7e9/packages/preprocessors/import.js //
var importExpr = /^(\s*)(import\s+[^=+*"'\r\n;\/]+|from\s+[^=+"'\r\n;\/ ]+\s+import\s+[^=+"'\r\n;\/]+)(;|\/|$)/gm;
var replaceFn = function (raw, p1, p2, p3) {
  if (!/\/\//.test(p1)) {
    return p1 + 'jsio(\'' + p2 + '\')' + p3;
  }
  return raw;
}

const transformImport = (j, item) => {
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

  if (importString.indexOf('*') > -1) {
    throw new Error('Wildcard imports are not allowed, please refactor this file before continuing.');
  }

  if (importString.indexOf('as exports') > -1) {
    throw new Error("The syntax 'import <your-module> as export' is not allowed, please refactor this file before continuing.");
  }

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

  return importPattern.transform(j, item, match);
};

const toSourceOpts = { quote: 'single' };

module.exports = (fileInfo, api, options) => {
  const j = api.jscodeshift;
  // Transform source so that the AST can be built
  fileInfo.source = fileInfo.source.replace(importExpr, replaceFn);
  const shifted = j(fileInfo.source);
  console.log('\ntransforming file - ', fileInfo.path);

  shifted.find(j.CallExpression, { callee: { name: 'jsio' } })
    .forEach(item => transformImport(j, item));
  return shifted.toSource(toSourceOpts).replace(/;;+/gi, ';');
};
