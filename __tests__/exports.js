'use strict';
jest.autoMockOff();

const testUtils = require('../testUtils');
const defineTest = testUtils.defineTest;
const defineTestWhichThrows = testUtils.defineTestWhichThrows;

describe('Exports Transform', () => {
  defineTest('exports/exportInAssignment', 'exports');
  defineTest('exports/exportInVariableAssignment', 'exports');
  defineTest('exports/normal', 'exports');

  describe('when there multiple default exports', () => {
    defineTestWhichThrows('exports/multipleDefaultExports');
  });
});
