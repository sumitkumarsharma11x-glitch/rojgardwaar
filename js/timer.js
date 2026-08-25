/**
 * Timer
 * -----------------------------------------------------------------------
 * Countdown timer. Time is tracked via an absolute end-timestamp (not a
 * decrementing counter), so it survives re-renders, tab switches, and
 * language toggles untouched — only a DOM text update happens on tick.
 * -----------------------------------------------------------------------
 */
function createTimer({ totalSeconds, onTick, onExpire }) {
  let endTime = Date.now() + totalSeconds * 1000;
  let intervalId = null;
  let expired = false;

  function remainingSeconds() {
    return Math.max(0, Math.round((endTime - Date.now()) / 1000));
  }

  function tick() {
    const remaining = remainingSeconds();
    if (onTick) onTick(remaining);
    if (remaining <= 0 && !expired) {
      expired = true;
      stop();
      if (onExpire) onExpire();
    }
  }

  function start() {
    tick();
    intervalId = setInterval(tick, 1000);
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  /** Restore a timer from a previously-saved absolute end time (survives page reload). */
  function restoreEndTime(savedEndTime) {
    endTime = savedEndTime;
  }

  function getEndTime() {
    return endTime;
  }

  function formatTime(totalSecs) {
    const m = Math.floor(totalSecs / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSecs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  return { start, stop, remainingSeconds, restoreEndTime, getEndTime, formatTime };
}
