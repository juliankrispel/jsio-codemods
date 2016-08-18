'use strict';

module.exports = (fileInfo, api, options) => {
  const j = api.jscodeshift;
  // Transform source so that the AST can be built
  const exports = j(fileInfo.source)
  .find(j.Identifier, { name: 'exports' })
  .forEach(node => console.log(node));
};
