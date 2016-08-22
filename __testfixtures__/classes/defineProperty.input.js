var MyClass = Class(['MyClass', BClass], function (supr) {
  Object.defineProperty(this, 'state', {
    get: function() { return this._states[this._stateIndex]; },
    set: function(value) {
      return supr(this, 'set', arguments);
    }
  });
});
