'use strict';
jest.autoMockOff();

const testUtils = require('../testUtils');
const defineTest = testUtils.defineTest;
const defineTestWhichThrows = testUtils.defineTestWhichThrows;

describe('Exports Transform', () => {
  defineTest('exports/multipleAssignments', 'exports');
  defineTest('exports/normal', 'exports');
});
