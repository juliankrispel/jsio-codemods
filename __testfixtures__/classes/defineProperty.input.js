var MyClass = Class(function () {
  Object.defineProperty(this, 'state', {
    get: function() { return this._states[this._stateIndex]; },
    set: function(value) { return; }
  });
});
