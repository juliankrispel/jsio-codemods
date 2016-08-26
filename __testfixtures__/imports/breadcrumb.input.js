import lib.PubSub;
var MyClass = Class(lib.PubSub, function () {
  this.init = function () {};
});

import .layout.BackingExtension;
exports.something = layout.BackingExtension;

var uiKeyboardTypes = {};
import ...ui.keyboardTypes;
console.log(ui.keyboardTypes);

const boom = new lib.PubSub();
