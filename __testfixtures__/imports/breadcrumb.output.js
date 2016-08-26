import PubSub from 'lib/PubSub';
var MyClass = Class(PubSub, function () {
  this.init = function () {};
});

import BackingExtension from './layout/BackingExtension';
exports.something = BackingExtension;

var uiKeyboardTypes = {};
import keyboardTypes from '../../ui/keyboardTypes';
console.log(keyboardTypes);

const boom = new PubSub();
