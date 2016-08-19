'use strict';
const _ = require('lodash');

const moveDefaultExport = (j, path, exportName) => {
  j(path).closest(j.Statement)
  .insertAfter(j.exportDefaultDeclaration(
    j.identifier(exportName)
  ));
  j(path).replaceWith(path.value.right);
}

const transformDefaultExports = (j, ast) => {
  // find default exports
  const defaultExports = ast.find(j.AssignmentExpression, { left: { name: 'exports' } })
  if (defaultExports.nodes().length > 1) {
    throw new Error('there is more than one assignment for exports,' +
                    'this is not allowed, please reduce it to 1' +
                    'assignment and continue');
  }


  const defaultExport = defaultExports.paths()[0];

  // cancel transform if there is no default export
  if (!defaultExport) {
    return false;
  }

  // if the export is part of an variable assignment
  //
  //   var Alpha = export = ...
  //
  // or part of an assignment expression like
  //
  //   Alpha = export = ...
  //
  // extract it and insert an import statement after
  const parent = defaultExport.parent.value;
  if (parent.type === 'VariableDeclarator' ||
     parent.type === 'AssignmentExpression') {
    const exportName =
      _.get(parent, 'id.name') ||
      _.get(parent, 'left.name');
    moveDefaultExport(j, defaultExport, exportName);

  // If exports is the leftmost side in a multiple assignment
  // statement
  } else if (_.get(defaultExport, 'value.right.type') === 'AssignmentExpression') {
    const moduleReference = _.get(defaultExport, 'value.right.left.name');

    moveDefaultExport(j, defaultExport, moduleReference);
  } else {
    // for simple assignments which are all other than above
    // simply replace the assignment with the export
    // like this:
    //
    //   exports = ...
    //
    // declaration
    j(defaultExport).closest(j.Statement).replaceWith(
      j.exportDefaultDeclaration(
        defaultExport.value.right
      )
    )
  }
}

const transformNamedExports = (j, ast) => {
  // get an assignment expression with exports on the left
  ast
  .find(j.AssignmentExpression, { left: { object: { name: 'exports' }}})
  .forEach(path => {
    // if path is part of an assignment expression
    const parent = path.parent.value;
    const exportName = path.value.left.property.name;

    if (parent.type === 'VariableDeclarator' ||
        parent.type === 'AssignmentExpression') {
      const moduleReference =
        _.get(parent, 'id.name') ||
        _.get(parent, 'left.name');

      j(path).closest(j.Statement)
      .insertAfter(j.exportNamedDeclaration(
        j.variableDeclaration('const', [
          j.variableDeclarator(
            j.identifier(exportName),
            j.identifier(moduleReference)
          )
        ])
      , []));

      j(path).replaceWith(path.value.right);
    } else if (path.value.right.type === 'AssignmentExpression') {
      const moduleReference = _.get(path, 'value.right.left.name');

      j(path).closest(j.Statement)
      .insertAfter(j.exportNamedDeclaration(
        j.variableDeclaration('const', [
          j.variableDeclarator(
            j.identifier(exportName),
            j.identifier(moduleReference)
          )
        ])
      , []));

      j(path).replaceWith(path.value.right);
    } else {
      j(path).closest(j.Statement).replaceWith(
        j.exportNamedDeclaration(
          j.variableDeclaration('const', [
            j.variableDeclarator(
              j.identifier(exportName),
              path.value.right
            )
          ])
        , [])
      )
    }
  });
};

module.exports = (fileInfo, api, options) => {
  const j = api.jscodeshift;

  // Transform source so that the AST can be built
  const ast = j(fileInfo.source);

  transformDefaultExports(j, ast);
  transformNamedExports(j, ast);

  return ast.toSource({ quote: 'single' });
};
