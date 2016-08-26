var defaultExports = {};
defaultExports.now = 0;

defaultExports.tick = function (dt) {
  var now = +new Date();
  defaultExports.now = now;
};
export default defaultExports;
