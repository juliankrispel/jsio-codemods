/* eslint-env jest */
'use strict';
jest.disableAutomock();
const _ = require('lodash');

const importPatterns = require('../importPatterns');


// TODO: All cases here are expected to pass.  We should add some falsy tests,
// and also ensure that the single pattern will not match any other cases
// (single pattern will not match multiple cases, multiple pattern will not
// match single cases)
const cases = {
  single: [
    'import .View',
    'import ...ui.keyboardTypes',
    'import ....ui.Something.boing'
  ],
  multiple: [
    'import .Boom, .Bam'
  ]
};


describe('importPatterns', () => {
  _.forEach(cases, (caseStrings, caseName) => {
    describe(`importPatterns.${caseName}`, () => {
      const re = importPatterns[caseName].re;
      _.forEach(caseStrings, testString => {
        it(`matches "${testString}"`, () => {
          expect(testString.match(re)).toBeTruthy();
        });
      })
    });
  });
});
