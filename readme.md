A bunch of codemods to turn code reliant on the jsio compiler into es6 modules. (Work in Progress)

## Usage
To use these you need to have jscodeshift installed, then you can reference the codemods via a url like so:

jscodeshift -t https://raw.githubusercontent.com/...your-transform.js src/**/*.js

[ImportsTransform.js](ImportsTransform.js) turns js.io import statements into es6 import statements.
[ModuleExports.js](ModuleExports.js) turns js.io module exports into es6 module exports.
[Classes.js](Classes.js) turns js.io class definitions into es6 classes.

## Unit tests
Tests for each scripts are in the test folder. I'm using the convention described in the [jscodeshift readme](https://github.com/facebook/jscodeshift) and have two fixtures for each transform (one for input, one for the expected output), if you want to know more about this pleas look at the [jscodeshift documentation about unit testing](https://github.com/facebook/jscodeshift#unit-testing).

To run the unit tests locally you need to do the following:

- Clone the repository.
- install the npm modules `npm install`.
- run the tests `npm test`.

## Contributing
If you'd like to contribute to this repository please make sure to clearly outline why you're proposing this change and make sure that the change is unit tested. That's pretty much it. I'll try my best to review the code asap.
