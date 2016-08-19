exports.now = 0;
exports.frames = 0;

exports.tick = function (dt) {
  exports.now += dt;
  exports.frames++;
  exports.onTick(dt);
};

exports.onTick = function (dt) {};
