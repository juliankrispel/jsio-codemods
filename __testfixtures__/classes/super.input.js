var MyClass = Class(function (supr) {
  this.init = function () {
    supr(this, 'init');
  };
  this.myFunction = function (arg1, arg2) {
    supr(this, 'myFunction', [arg1, arg2]);
  };
});
