/* ===== CorpseState — Central State Machine ===== */
var CorpseState = (function () {
  'use strict';

  var PHASES = {
    IDLE: 'IDLE',
    USER_TURN: 'USER_TURN',
    APP_TURN: 'APP_TURN',
    FOLDING: 'FOLDING',
    REVEAL: 'REVEAL'
  };

  var MIN_TURNS_FOR_REVIVE = 4;

  /* ---- internal state ---- */
  var state = createFreshState();
  var listeners = [];

  function createFreshState() {
    return {
      phase: PHASES.IDLE,
      turnNumber: 0,
      /* allLines: [{ text, author:'user'|'app', turn }] */
      allLines: [],
      foundational: null,
      currentLines: [],
      timedMode: false,
      timerSeconds: 60,
      ballisticMode: false,
      sessionActive: false
    };
  }

  /* ---- helpers ---- */
  function snapshot() {
    return {
      phase: state.phase,
      turnNumber: state.turnNumber,
      turnType: state.turnNumber % 2 === 1 ? 'user' : 'app',
      allLines: state.allLines.slice(),
      foundational: state.foundational,
      currentLines: state.currentLines.slice(),
      timedMode: state.timedMode,
      timerSeconds: state.timerSeconds,
      ballisticMode: state.ballisticMode,
      sessionActive: state.sessionActive,
      canRevive: state.turnNumber >= MIN_TURNS_FOR_REVIVE && state.phase === PHASES.USER_TURN,
      moodProfile: (typeof CorpseMood !== 'undefined') ? CorpseMood.getProfile() : null
    };
  }

  function notify() {
    var s = snapshot();
    for (var i = 0; i < listeners.length; i++) {
      listeners[i](s);
    }
  }

  function countWords(text) {
    if (!text) return 0;
    /* split on whitespace, filter empties — emoji count as a word */
    return text.trim().split(/\s+/).filter(function (w) { return w.length > 0; }).length;
  }

  function validateLines(lines, isFirstTurn) {
    var errors = [];
    var count = isFirstTurn ? 3 : 2;
    if (lines.length !== count) {
      errors.push('Expected ' + count + ' lines.');
      return errors;
    }

    for (var i = 0; i < lines.length; i++) {
      var wc = countWords(lines[i]);
      /* last line (index count-1) allows 1 word; others need at least 2 */
      var isLastLine = i === count - 1;
      var minWords = isLastLine ? 1 : 2;
      if (wc < minWords) {
        var lineLabel = isFirstTurn ? (i + 1) : (i + 2); /* display-friendly */
        errors.push('Line ' + lineLabel + ' needs at least ' + minWords + ' word' + (minWords > 1 ? 's' : '') + '.');
      }
    }
    return errors;
  }

  /* ---- public API ---- */
  function init(options) {
    state = createFreshState();
    if (typeof CorpseMood !== 'undefined') {
      CorpseMood.init();
    }
    if (options) {
      if (options.timedMode !== undefined) state.timedMode = options.timedMode;
      if (options.timerSeconds !== undefined) state.timerSeconds = options.timerSeconds;
      if (options.ballisticMode !== undefined) state.ballisticMode = options.ballisticMode;
    }
    notify();
  }

  function startSession() {
    state.phase = PHASES.USER_TURN;
    state.turnNumber = 1;
    state.allLines = [];
    state.foundational = null;
    state.currentLines = [];
    state.sessionActive = true;
    notify();
  }

  function submitUserLines(lines) {
    var isFirst = state.turnNumber === 1;
    var errors = validateLines(lines, isFirst);
    if (errors.length > 0) return { ok: false, errors: errors };

    /* Update mood with user text */
    if (typeof CorpseMood !== 'undefined') {
      CorpseMood.update(lines.join(' '));
    }

    if (isFirst) {
      state.currentLines = lines.slice();
    } else {
      /* prepend the foundational as line 1 */
      state.currentLines = [state.foundational].concat(lines);
    }
    state.phase = PHASES.FOLDING;
    notify();
    return { ok: true, errors: [] };
  }

  function submitAppLines(lines) {
    /* lines should be [foundational, line2, line3] — 3 items */
    state.currentLines = lines.slice();

    /* Update mood with app-generated text (skip foundational, it was already counted) */
    if (typeof CorpseMood !== 'undefined') {
      CorpseMood.update(lines.slice(1).join(' '));
    }

    state.phase = PHASES.FOLDING;
    notify();
  }

  function fold() {
    /* commit currentLines to allLines */
    var author = state.turnNumber % 2 === 1 ? 'user' : 'app';
    /* For turns > 1, currentLines[0] is the foundational carried over from the
       previous turn — it was already committed then. Skip it to avoid duplicating
       each "last" line and mis-attributing it to the current turn's author. */
    var startIdx = state.turnNumber === 1 ? 0 : 1;
    for (var i = startIdx; i < state.currentLines.length; i++) {
      state.allLines.push({
        text: state.currentLines[i],
        author: author,
        turn: state.turnNumber
      });
    }

    /* last line becomes the foundational */
    state.foundational = state.currentLines[state.currentLines.length - 1];
    state.currentLines = [];
    state.turnNumber++;

    /* next phase */
    if (state.turnNumber % 2 === 1) {
      state.phase = PHASES.USER_TURN;
    } else {
      state.phase = PHASES.APP_TURN;
    }
    notify();
  }

  function revive() {
    state.phase = PHASES.REVEAL;
    state.sessionActive = false;
    notify();
  }

  function canRevive() {
    return state.turnNumber >= MIN_TURNS_FOR_REVIVE && state.phase === PHASES.USER_TURN;
  }

  function onStateChange(fn) {
    listeners.push(fn);
  }

  function getSnapshot() {
    return snapshot();
  }

  function updateSettings(opts) {
    if (opts.timedMode !== undefined) state.timedMode = opts.timedMode;
    if (opts.timerSeconds !== undefined) state.timerSeconds = opts.timerSeconds;
    if (opts.ballisticMode !== undefined) state.ballisticMode = opts.ballisticMode;
    notify();
  }

  return {
    PHASES: PHASES,
    init: init,
    startSession: startSession,
    submitUserLines: submitUserLines,
    submitAppLines: submitAppLines,
    fold: fold,
    revive: revive,
    canRevive: canRevive,
    onStateChange: onStateChange,
    getSnapshot: getSnapshot,
    updateSettings: updateSettings
  };
})();
