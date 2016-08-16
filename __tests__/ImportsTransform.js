'use strict';
jest.autoMockOff();
const _defineTest = require('jscodeshift/dist/testUtils').defineTest;
const defineTest = prefix => {
  return _defineTest(__dirname, 'mods/ImportsTransform', null, prefix);
};

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
defineTest('imports/wildcards');

// Note: Single imports are imported with breadcrumb:
// https://github.com/gameclosure/timestep/blob/664ac57cfede56923f8c2e181652a8f065059fff/src/platforms/browser/MobileBrowserAPI.js#L24
// This means these should warn (no transform).  A separate mod will be needed
// to convert all references to the full path
defineTest('imports/breadcrumb');

// Note: redirected exports are now unavailable.  Fail on files with them.
defineTest('imports/redirectExport');

defineTest('imports/binding');

defineTest('imports/member');

defineTest('imports/multipleInline');
