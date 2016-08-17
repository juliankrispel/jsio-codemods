jest.dontMock('../importPatterns');
const importPatterns = require('../importPatterns');

describe('importPatterns', function() {
  describe('importPatterns.single', function() {
    describe('importPatterns.single regex', function() {
      it('matches "import .View;"', () => {
        const string = 'import .View;';
        expect(string.match(importPatterns.single.re)).not.toBeFalsy();
      });

      it('matches "import .View;"', () => {
        const string = 'import ...ui.keyboardTypes;';
        expect(string.match(importPatterns.single.re)).not.toBeFalsy();
      });

      it('matches "import .View;"', () => {
        const string = 'import ....ui.Something.boing;';
        expect(string.match(importPatterns.single.re)).not.toBeFalsy();
      });
    });
  });
});
