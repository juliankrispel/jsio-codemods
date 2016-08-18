'use strict';
jest.autoMockOff();

const fs = require('fs');
const testUtils = require('jscodeshift/dist/testUtils');
const _defineTest = testUtils.defineTest;
const jscodeshift = require('jscodeshift');
const importsTransform = require('../mods/imports');

const defineTest = fixture => (
  _defineTest(__dirname, 'mods/imports', null, fixture)
)

const defineTestWhichThrows = fixture => {
  it('throws an error', () => {
    const path = `__testfixtures__/${fixture}.js`
    const source = fs.readFileSync(path, 'utf8');
    const transform = () => importsTransform(
      {path, source},
      {
        jscodeshift,
        stats: () => {},
      },
      {}
    );
    expect(transform).toThrow();
  });
}

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
