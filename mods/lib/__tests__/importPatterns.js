jest.dontMock('../importPatterns');
const importPatterns = require('../importPatterns');

describe('importPatterns', () => {
  describe('importPatterns.single', () => {
    it('matches "import .View;"', () => {
      const string = 'import .View;';
      expect(string.match(importPatterns.single.re)).not.toBeFalsy();
    });

    it('matches "import ...ui.keyboardTypes;"', () => {
      const string = 'import ...ui.keyboardTypes;';
      expect(string.match(importPatterns.single.re)).not.toBeFalsy();
    });

    it('matches "import ....ui.Something.boing;"', () => {
      const string = 'import ....ui.Something.boing;';
      expect(string.match(importPatterns.single.re)).not.toBeFalsy();
    });
  });

  describe('importPatterns.multiple', () => {
    it('matches "import .Boom, .Bam;"', () => {
      const string = 'import .Boom, .Bam;';
      expect(string.match(importPatterns.multiple.re)).not.toBeFalsy();
    });
  });
});
