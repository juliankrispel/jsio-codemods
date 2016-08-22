'use strict';
const _ = require('lodash');

const isLeftMostInAssignment = (path) => {
  // if the parent is an assignment expression then
  // we're good
  if (path.parent.value.type === 'AssignmentExpression') {
    return true;
  }

  // if parent is a member assignment we recurse this function
  // with the parent
  if (_.get(path, 'parent.value.object') === path.value) {
    return isLeftMostInAssignment(path.parent);
  }

  return false;
};

const getParentAssignment = (path) => {
  if (_.get(path, 'parent.value.type') === 'AssignmentExpression') {
    return path.parent;
  }
  return getParentAssignment(path.parent);
};

const getAllExports = (j, ast) =>
  ast.find(j.Identifier, { name: 'exports' })
  .filter(path => isLeftMostInAssignment(path, path))
  .map(getParentAssignment);

module.exports = (fileInfo, api, options) => {
  const j = api.jscodeshift;

  // Transform source so that the AST can be built
  const ast = j(fileInfo.source);
  const exports = getAllExports(j, ast);

  // bail out early if there are no exports at all
  if (exports.paths().length < 1) {
    return fileInfo.source;
  };

  // get first export
  const firstExport = exports.paths()[0];

  // if first export is an assignment that can be turned into a
  // variable declaration, do it.
  if (
    firstExport.parent.value.type === 'ExpressionStatement' &&
    _.get(firstExport, 'value.left.name') === 'exports'
  ) {
    j(firstExport).replaceWith(
      j.variableDeclaration(
        'var',
        [j.variableDeclarator(
          firstExport.value.left,
          firstExport.value.right
        )]
      )
    );
  } else if (_.get(firstExport, 'value.left.name') === 'exports') {
    j(firstExport).closest(j.Statement).insertBefore(
      j.variableDeclaration(
        'var',
        [j.variableDeclarator(
          j.identifier('exports'),
          null
        )]
      )
    )
  } else {
    j(firstExport).closest(j.Statement).insertBefore(
      j.variableDeclaration(
        'var',
        [j.variableDeclarator(
          j.identifier('exports'),
          j.objectExpression([])
        )]
      )
    )
  }

  j(exports.paths()[exports.paths().length - 1])
    .closest(j.Statement)
    .insertAfter(
      j.exportDefaultDeclaration(
        j.identifier('exports')
      )
    );

  return ast.toSource({ quote: 'single' }).replace(/;+/gi, ';');
};
