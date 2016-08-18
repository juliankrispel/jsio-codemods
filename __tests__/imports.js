'use strict';
jest.autoMockOff();
const testUtils = require('../testUtils');
const defineTest = testUtils.defineTest;
const defineTestWhichThrows = testUtils.defineTestWhichThrows;

const importsTransform = require('../mods/imports');

describe('Imports Transform', () => {
  defineTest('imports/single');
  defineTest('imports/singleRelative');

  // Note: jsio compiler imports with * are hard to transform, hence
  // we throw
  describe('when compiling wildcard imports', () => {
    defineTestWhichThrows('imports/wildcards');
  });

  defineTest('imports/breadcrumb');

  // Note: redirected exports are deprecated. Hence we throw an error
  describe('when compiling redirected exports', () => {
    defineTestWhichThrows('imports/redirectExport');
  });

  describe('when there is a collision with a simple import', () => {
    defineTestWhichThrows('imports/simpleCollision');
  });

  defineTest('imports/binding');
  defineTest('imports/member');
  defineTest('imports/multipleInline');
  defineTest('imports/bindingFrom');
});
