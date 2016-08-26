var defaultExports = {};
defaultExports.now = 0;
defaultExports.frames = 0;

defaultExports.tick = function (dt) {
  defaultExports.now += dt;
  defaultExports.frames++;
  defaultExports.onTick(dt);
};

defaultExports.onTick = function (dt) {};
export default defaultExports;
