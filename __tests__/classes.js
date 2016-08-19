/* eslint-env jest */
'use strict';
jest.autoMockOff();

const testUtils = require('../testUtils');
const defineTest = testUtils.defineTest;
const runTest = testUtils.runTest;
const defineTestWhichThrows = testUtils.defineTestWhichThrows;
const classesTransform = require('../mods/classes');
const throwSource = (source) => {
  expect(() => {
    runTest(source, classesTransform, '')
  }).toThrow()

}

describe('classes transform', () => {
  describe('when class contains local variable', () => {
    defineTestWhichThrows('classes/classScopedVars', classesTransform);
  });

  describe('when class contains local operation', () => {
  });

  describe('when class definiton contains anything other' +
           'than a this assignment', () => {

    defineTestWhichThrows('classes/classScopedVars', classesTransform);

    it('throws an error for += operations', () => {
      throwSource('Class(function(){ b+= 1 })');
    });

    it('throws an error for -= operations', () => {
      throwSource('Class(function(){ b-= 1 })');
    });

    it('throws an error for normal assignments', () => {
      throwSource('Class(function(){ b = 1 })');
    });
  });

  defineTest('classes/normal', 'classes');
  defineTest('classes/extend', 'classes');
});

