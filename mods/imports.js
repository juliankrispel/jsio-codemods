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

const transformImport = (j, filePath, item) => {
  if (
    !item.parent ||
    !item.parent.parent ||
    item.parent.parent.name !== 'program'
  ) {
    error.error({
      node: item.value.arguments[0],
      message: 'Imports must be top level',
      filePath: filePath
    });
  }

  if (item.value.arguments.length !== 1) {
    error.error({
      node: item.value.arguments[0],
      message: 'Arguments length is not 1',
      filePath: filePath
    });
  }

  const argumentNode = item.value.arguments[0];
  if (argumentNode.type !== 'Literal') {
    error.error({
      node: item.value.arguments[0],
      message: 'Argument type not Literal',
      filePath: filePath
    });
  }

  const importString = argumentNode.value;

  if (importString.indexOf('*') > -1) {
    error.error({
      node: item.value.arguments[0],
      message: 'Wildcard imports are not allowed',
      filePath: filePath
    });
    return;
  }

  if (importString.indexOf('as exports') > -1) {
    error.error({
      node: item.value.arguments[0],
      message: "The syntax 'import <your-module> as export' is not allowed",
      filePath: filePath
    });
  }

  let match;
  let importPattern;
  _.forEach(importPatterns, (pattern, reName) => {
    const newMatch = pattern.re.exec(importString);
    if (newMatch) {
      if (match) {
        error.error({
          node: item.value.arguments[0],
          message: 'Ambiguous import match',
          filePath: filePath
        });
      }
      match = newMatch;
      importPattern = pattern;
    }
  });

  if (!match) {
    error.error({
      node: item.value.arguments[0],
      message: 'Could not match import signature',
      filePath: filePath
    });
  }

  return importPattern.transform(j, item, match);
};

const toSourceOpts = { quote: 'single' };

module.exports = (fileInfo, api, options) => {
  const j = api.jscodeshift;

  // Transform source so that the AST can be built
  fileInfo.source = fileInfo.source.replace(importExpr, replaceFn);
  const shifted = j(fileInfo.source);

  shifted.find(j.CallExpression, { callee: { name: 'jsio' } })
    .forEach(item => transformImport(j, fileInfo.path, item));
  return shifted.toSource(toSourceOpts).replace(/;;+/gi, ';');
};
