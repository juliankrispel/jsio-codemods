/* eslint-env jest */
'use strict';
jest.autoMockOff();

const testUtils = require('../testUtils');
const defineTest = testUtils.defineTest;

describe('Exports Transform', () => {
  defineTest('exports/exportInAssignment', 'exports');
  defineTest('exports/exportInVariableAssignment', 'exports');
  defineTest('exports/normal', 'exports');
  defineTest('exports/normalNamed', 'exports');
  defineTest('exports/mixed', 'exports');
  defineTest('exports/noExports', 'exports');
  defineTest('exports/multipleAssignmentExport', 'exports');
  defineTest('exports/multipleDefaultExports', 'exports');
  defineTest('exports/nestedNamedAssignment', 'exports');
});
