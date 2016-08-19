export let now = 0;
export let frames = 0;

export const tick = function (dt) {
  now += dt;
  frames++;
  onTick(dt);
};

export const onTick = function (dt) {};
