class MyClass extends BClass {
  get state() { return this._states[this._stateIndex]; }

  set state(value) {
    return super.set(...arguments);
  }
}
