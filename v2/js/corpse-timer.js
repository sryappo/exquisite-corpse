/* ===== CorpseTimer — Timed & Ballistic Modes ===== */
var CorpseTimer = (function () {
  'use strict';

  var intervalId = null;
  var remaining = 0;
  var total = 0;
  var onTickCb = null;
  var onExpireCb = null;
  var paused = false;

  function start(seconds, onTick, onExpire) {
    stop();
    remaining = seconds;
    total = seconds;
    onTickCb = onTick;
    onExpireCb = onExpire;
    paused = false;

    if (onTickCb) onTickCb(remaining, total);

    intervalId = setInterval(function () {
      if (paused) return;
      remaining--;
      if (onTickCb) onTickCb(remaining, total);
      if (remaining <= 0) {
        stop();
        if (onExpireCb) onExpireCb();
      }
    }, 1000);
  }

  function stop() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    remaining = 0;
    paused = false;
  }

  function pause() {
    paused = true;
  }

  function resume() {
    paused = false;
  }

  function getRemaining() {
    return remaining;
  }

  function isRunning() {
    return intervalId !== null && !paused;
  }

  return {
    start: start,
    stop: stop,
    pause: pause,
    resume: resume,
    getRemaining: getRemaining,
    isRunning: isRunning
  };
})();
