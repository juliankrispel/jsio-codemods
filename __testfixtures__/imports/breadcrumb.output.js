import PubSub from 'lib/PubSub';
var MyClass = Class(PubSub, function () {
  this.init = function () {};
});

import BackingExtension from './layout/BackingExtension';
exports.something = BackingExtension;

var uiKeyboardTypes = {};
import ...ui.keyboardTypes;
console.log(ui.keyboardTypes);
