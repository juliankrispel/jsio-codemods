'use strict';
const _ = require('lodash');
const importPatterns = require('./lib/importPatterns');
const error = require('./lib/error');

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
    error(item.value.arguments[0], 'Imports must be top level');
  }

  if (item.value.arguments.length !== 1) {
    error(item.value.arguments[0], 'Arguments length is not 1');
  }

  const argumentNode = item.value.arguments[0];
  if (argumentNode.type !== 'Literal') {
    error(item.value.arguments[0], 'Argument type not Literal');
  }

  const importString = argumentNode.value;

  if (importString.indexOf('*') > -1) {
    error(item.value.arguments[0], 'Wildcard imports are not allowed, please refactor this file before continuing.');
  }

  if (importString.indexOf('as exports') > -1) {
    error(item.value.arguments[0], "The syntax 'import <your-module> as export' is not allowed, please refactor this file before continuing.");
  }

  let match;
  let importPattern;
  _.forEach(importPatterns, (pattern, reName) => {
    const newMatch = pattern.re.exec(importString);
    if (newMatch) {
      if (match) {
        error(item.value.arguments[0], 'Ambiguous import match');
      }
      match = newMatch;
      importPattern = pattern;
    }
  });

  if (!match) {
    error(item.value.arguments[0], 'Could not match import signature');
  }

  return importPattern.transform(j, item, match);
};

const toSourceOpts = { quote: 'single' };

module.exports = (fileInfo, api, options) => {
  const j = api.jscodeshift;
  error.fileName = fileInfo.path;

  // Transform source so that the AST can be built
  fileInfo.source = fileInfo.source.replace(importExpr, replaceFn);
  const shifted = j(fileInfo.source);

  shifted.find(j.CallExpression, { callee: { name: 'jsio' } })
    .forEach(item => transformImport(j, item));
  return shifted.toSource(toSourceOpts).replace(/;;+/gi, ';');
};
