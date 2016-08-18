'use strict';

module.exports = (fileInfo, api, options) => {
  const j = api.jscodeshift;
  // Transform source so that the AST can be built
  j(fileInfo.source)
    .find()
};
