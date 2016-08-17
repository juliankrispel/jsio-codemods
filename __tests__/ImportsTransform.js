'use strict';
jest.autoMockOff();
const fs = require('fs');
const testUtils = require('jscodeshift/dist/testUtils');
const _defineTest = testUtils.defineTest;
const runTest = testUtils.runTest;
const importsTransform = require('../mods/ImportsTransform');
const defineTest = prefix => {
  return _defineTest(__dirname, 'mods/ImportsTransform', null, prefix);
};
describe('Imports Transform', () => {

// Note: Some test fixtures suggest no change, these are cases that should throw
// a warning.

defineTest('imports/single');
defineTest('imports/singleRelative');

// Note: jsio compiler mixes in * imports to the module scope.
// An example of functional output would be:
//   import * as _base from 'base';
//   (function (modScope, mixin) { Object.keys(mixin).forEach(key => modScope[key] = mixin[key]); })(this, _base);
// However this does not look great, so instead we want to fail on any
// wildcards, telling the user to transform these files by hand.
  describe('when compiling wildcard imports', () => {
    it('throws an error', () => {
      const source = fs.readFileSync('__testfixtures__/imports/wildcards.input.js');
      const transform = () => importsTransform(source);
      expect(transform).toThrow();
    });
  });

// Note: Single imports are imported with breadcrumb:
// https://github.com/gameclosure/timestep/blob/664ac57cfede56923f8c2e181652a8f065059fff/src/platforms/browser/MobileBrowserAPI.js#L24
// This means these should warn (no transform).  A separate mod will be needed
// to convert all references to the full path
// defineTest('imports/breadcrumb');
// 
// // Note: redirected exports are now unavailable.  Fail on files with them.
// defineTest('imports/redirectExport');
// 
// defineTest('imports/binding');
// 
// defineTest('imports/member');
// 
// defineTest('imports/multipleInline');
});
