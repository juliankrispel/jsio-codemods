"use strict";
const jsc = require('jscodeshift');
const colors = require('colors');

const throwError = (node, message) => {
  const line = node.loc.start.line;
  let errorMessage =
    `Syntax not allowed on ${colors.white('line ' + line)}:\n` +
    `\n` +
    `  ${colors.white(jsc(node).toSource())}\n` +
    `\n` +
    `^^^^^ ${colors.red(message)}`
  if (module.exports.fileName) {
    errorMessage = `\n> ${module.exports.fileName}\n` + errorMessage;
  } else {
    errorMessage = '\n' + errorMessage;
  }

  throw new Error(errorMessage);
}

module.exports = throwError;
module.exports.fileName = null;;
