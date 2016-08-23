'use strict';
const jsc = require('jscodeshift');
const colors = require('colors');


/**
 * @param  {Object} opts
 * @param  {Node} node
 * @param  {String} message
 * @param  {String} [filePath]
 * @param  {Function} [colorMessage]
 * @return {String}
 */
const buildMessage = opts => {
  opts.colorMessage = opts.colorMessage || colors.red;

  const nodeStart = opts.node.loc.start;
  const locString = `${nodeStart.line}:${nodeStart.column}`;
  // TODO: get filePath from node... I couldnt find a nice way of doing this
  // with the jsc APIs

  let errorLocation;
  if (opts.filePath) {
    errorLocation = `${opts.filePath}:${locString}`;
  } else {
    errorLocation = `Line ${locString}`;
  }

  return `${opts.colorMessage(opts.message)}\n` +
    `At: ${errorLocation}\n` +
    `\n` +
    `  ${colors.white(jsc(opts.node).toSource())}\n`;
};


const error = opts => {
  opts.colorMessage = colors.red;
  throw new Error(buildMessage(opts));
};


const warn = opts => {
  opts.colorMessage = colors.yellow;
  console.warn('Warning: ', buildMessage(opts));
};


module.exports = {
  buildMessage: buildMessage,
  error: error,
  warn: warn
};
