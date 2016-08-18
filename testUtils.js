'use strict';
const fs = require('fs');
const testUtils = require('jscodeshift/dist/testUtils');
const _defineTest = testUtils.defineTest;
const jscodeshift = require('jscodeshift');
const dirname = `${__dirname}/__tests__`;

const defineTest = (fixture, transform) => {
  _defineTest(dirname, `/mods/${transform}`, null, fixture);
}

const defineTestWhichThrows = (fixture, transform) => {
  it('throws an error', () => {
    const path = `${__dirname}/__testfixtures__/${fixture}.js`
    const source = fs.readFileSync(path, 'utf8');
    const transform = () => transform(
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

module.exports = {
  defineTest,
  defineTestWhichThrows
};
