exports.now = 0;

export const tick = function (dt) {
  const now = +new Date();
  exports.now = now;
};
