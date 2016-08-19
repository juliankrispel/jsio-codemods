exports.now = 0;

exports.tick = function (dt) {
  var now = +new Date();
  exports.now = now;
};
