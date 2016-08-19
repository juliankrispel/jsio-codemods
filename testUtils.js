'use strict';
/* eslint-env jest */
const fs = require('fs');
const testUtils = require('jscodeshift/dist/testUtils');
const _defineTest = testUtils.defineTest;
const jscodeshift = require('jscodeshift');
const dirname = `${__dirname}/__tests__`;

const defineTest = (fixture, transform) => {
  _defineTest(dirname, `/mods/${transform}`, null, fixture);
}

const runTest = (source, transform, path) => (
  transform(
    {path, source},
    {
      jscodeshift,
      stats: () => {}
    },
    {}
  )
);

const defineTestWhichThrows = (fixture, _transform) => {
  it('throws an error', () => {
    const path = `${__dirname}/__testfixtures__/${fixture}.js`
    const source = fs.readFileSync(path, 'utf8');

    if (!_transform) {
      throw new Error('transform is undefined');
    }

    const transform = () => runTest(source, _transform, path);
    expect(transform).toThrow();
  });
}

module.exports = {
  defineTest,
  runTest,
  defineTestWhichThrows
};
