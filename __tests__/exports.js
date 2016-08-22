/* eslint-env jest */
'use strict';
jest.autoMockOff();

const exportsTransform = require('../mods/exports');
const testUtils = require('../testUtils');
const defineTest = testUtils.defineTest;
const defineTestWhichThrows = testUtils.defineTestWhichThrows;

describe('Exports Transform', () => {
  //  defineTest('exports/exportInAssignment', 'exports');
  //  defineTest('exports/exportInVariableAssignment', 'exports');
  //  defineTest('exports/normal', 'exports');
  //  defineTest('exports/normalNamed', 'exports');
  defineTest('exports/mixed', 'exports');
  //  defineTest('exports/multipleAssignmentExport', 'exports');

  //  describe('when there multiple default exports', () => {
  //    defineTestWhichThrows('exports/multipleDefaultExports', exportsTransform);
  //  });
});
