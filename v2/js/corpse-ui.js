/* ===== CorpseUI — DOM Rendering & Animations ===== */
var CorpseUI = (function () {
  'use strict';

  var container;
  var els = {};

  /* ================================================================
     DOM CONSTRUCTION
     ================================================================ */
  function init(containerEl) {
    container = containerEl;
    container.innerHTML = '';

    /* Header */
    var header = el('header', 'corpse-header');
    header.innerHTML =
      '<h1 class="corpse-title">Exquisite Corpse</h1>' +
      '<div class="corpse-subtitle">a surrealist writing machine</div>' +
      '<div class="turn-indicator" id="turn-indicator"></div>' +
      '<button class="settings-gear" id="settings-gear" title="Settings">&#9881;</button>';
    container.appendChild(header);

    /* Timer bar */
    var timerWrap = el('div', 'timer-bar-container');
    timerWrap.id = 'timer-bar-container';
    timerWrap.innerHTML = '<div class="timer-bar" id="timer-bar"></div>';
    header.appendChild(timerWrap);
    var timerLabel = el('div', 'timer-label');
    timerLabel.id = 'timer-label';
    header.appendChild(timerLabel);

    /* Stage */
    var stage = el('main', 'corpse-stage');
    stage.id = 'corpse-stage';
    var foldArea = el('div', 'fold-area');
    foldArea.id = 'fold-area';
    stage.appendChild(foldArea);
    container.appendChild(stage);

    /* Controls */
    var controls = el('footer', 'corpse-controls');
    controls.id = 'corpse-controls';
    controls.innerHTML =
      '<div class="button-row" id="button-row">' +
        '<button class="btn btn-fold hidden" id="fold-btn">Fold</button>' +
        '<button class="btn btn-revive hidden" id="revive-btn">Revive</button>' +
      '</div>' +
      '<div class="error-msg" id="error-msg"></div>';
    container.appendChild(controls);

    /* Settings overlay + panel */
    var overlay = el('div', 'settings-overlay');
    overlay.id = 'settings-overlay';
    container.appendChild(overlay);

    var panel = el('div', 'settings-panel');
    panel.id = 'settings-panel';
    panel.innerHTML = buildSettingsHTML();
    container.appendChild(panel);

    /* Reveal overlay */
    var reveal = el('div', 'reveal-overlay');
    reveal.id = 'reveal-overlay';
    reveal.innerHTML =
      '<div class="reveal-title">The Corpse Speaks</div>' +
      '<div class="poem-scroll" id="poem-scroll"></div>' +
      '<div class="export-controls" id="export-controls">' +
        '<button class="btn btn-secondary" id="copy-btn">Copy to Clipboard</button>' +
        '<button class="btn btn-secondary" id="copy-clean-btn">Copy (clean)</button>' +
        '<button class="btn btn-secondary" id="download-btn">Download .txt</button>' +
        '<button class="btn btn-secondary" id="download-html-btn">Download .html</button>' +
        '<button class="btn btn-secondary" id="download-png-btn">Download .png</button>' +
        '<button class="btn btn-start" id="new-session-btn">New Session</button>' +
      '</div>';
    container.appendChild(reveal);

    /* Cache refs */
    els.turnIndicator = document.getElementById('turn-indicator');
    els.foldArea = document.getElementById('fold-area');
    els.foldBtn = document.getElementById('fold-btn');
    els.reviveBtn = document.getElementById('revive-btn');
    els.errorMsg = document.getElementById('error-msg');
    els.stage = document.getElementById('corpse-stage');
    els.timerContainer = document.getElementById('timer-bar-container');
    els.timerBar = document.getElementById('timer-bar');
    els.timerLabel = document.getElementById('timer-label');
    els.settingsGear = document.getElementById('settings-gear');
    els.settingsPanel = document.getElementById('settings-panel');
    els.settingsOverlay = document.getElementById('settings-overlay');
    els.revealOverlay = document.getElementById('reveal-overlay');
    els.poemScroll = document.getElementById('poem-scroll');
    els.exportControls = document.getElementById('export-controls');
    els.copyBtn = document.getElementById('copy-btn');
    els.copyCleanBtn = document.getElementById('copy-clean-btn');
    els.downloadBtn = document.getElementById('download-btn');
    els.newSessionBtn = document.getElementById('new-session-btn');

    /* Settings panel events */
    els.settingsGear.addEventListener('click', openSettings);
    els.settingsOverlay.addEventListener('click', closeSettings);
    document.getElementById('settings-close').addEventListener('click', closeSettings);
  }

  function buildSettingsHTML() {
    return '<button class="settings-close" id="settings-close">&times;</button>' +
      '<h3>Settings</h3>' +
      '<div class="settings-group">' +
        '<label><input type="checkbox" id="timed-toggle"> Timed mode</label>' +
        '<input type="range" id="timer-range" min="30" max="90" value="60" step="5">' +
        '<div class="range-value" id="timer-range-value">60 seconds</div>' +
      '</div>' +
      '<div class="settings-group">' +
        '<label><input type="checkbox" id="ballistic-toggle"> Ballistic mode</label>' +
        '<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">If time runs out, everything vanishes</div>' +
      '</div>' +
      '<div class="api-key-section">' +
        '<h3>Claude API</h3>' +
        '<div style="font-size:11px;color:var(--text-secondary);margin-bottom:8px;">Enter your Anthropic API key for AI-powered generation. Without it, the local surrealist engine is used.</div>' +
        '<input type="password" class="api-key-input" id="api-key-input" placeholder="sk-ant-...">' +
        '<div style="display:flex;gap:8px;margin-top:8px;">' +
          '<button class="btn btn-secondary" id="api-key-save" style="font-size:11px;padding:5px 12px;">Save</button>' +
          '<button class="btn btn-secondary" id="api-key-clear" style="font-size:11px;padding:5px 12px;">Clear</button>' +
        '</div>' +
        '<div class="api-status" id="api-status"></div>' +
      '</div>' +
      '<div class="audio-section">' +
        '<h3>Atmosphere</h3>' +
        '<div class="settings-group">' +
          '<label><input type="checkbox" id="audio-toggle"> Ambient sound</label>' +
          '<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Generative audio that shifts with the mood of your writing</div>' +
        '</div>' +
      '</div>';
  }

  function el(tag, className) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    return e;
  }

  /* ================================================================
     SETTINGS PANEL
     ================================================================ */
  function openSettings() {
    els.settingsPanel.classList.add('open');
    els.settingsOverlay.classList.add('open');
    updateApiStatus();
  }

  function closeSettings() {
    els.settingsPanel.classList.remove('open');
    els.settingsOverlay.classList.remove('open');
  }

  function updateApiStatus() {
    var statusEl = document.getElementById('api-status');
    if (CorpseGenerator.hasApiKey()) {
      statusEl.textContent = 'Claude connected';
      statusEl.className = 'api-status connected';
    } else {
      statusEl.textContent = 'Using local engine';
      statusEl.className = 'api-status local';
    }
  }

  /* ================================================================
     RENDER — called on every state change
     ================================================================ */
  function renderTurn(state) {
    els.errorMsg.textContent = '';

    switch (state.phase) {
      case 'IDLE':
        renderIdle();
        break;
      case 'USER_TURN':
        renderUserTurn(state);
        break;
      case 'APP_TURN':
        renderAppTurn(state);
        break;
      case 'FOLDING':
        /* handled by animation callbacks */
        break;
      case 'REVEAL':
        renderReveal(state);
        break;
    }
  }

  /* ---- IDLE ---- */
  function renderIdle() {
    els.turnIndicator.textContent = '';
    els.foldBtn.classList.add('hidden');
    els.reviveBtn.classList.add('hidden');
    els.foldArea.innerHTML =
      '<div class="idle-screen">' +
        '<p>An exquisite corpse shall drink the new wine.<br>' +
        'Write three lines. Fold the paper. Pass it on.<br>' +
        'The machine dreams the rest.</p>' +
        '<button class="btn btn-start" id="start-btn">Begin</button>' +
      '</div>';

    document.getElementById('start-btn').addEventListener('click', function () {
      CorpseState.startSession();
    });
  }

  /* ---- USER TURN ---- */
  function renderUserTurn(state) {
    var isFirst = state.turnNumber === 1;
    els.turnIndicator.textContent = 'Turn ' + state.turnNumber + ' \u00b7 Your Turn';
    els.foldBtn.classList.remove('hidden');
    els.foldBtn.disabled = false;

    if (state.canRevive) {
      els.reviveBtn.classList.remove('hidden');
    } else {
      els.reviveBtn.classList.add('hidden');
    }

    els.foldArea.innerHTML = '';

    if (isFirst) {
      /* 3 empty inputs */
      for (var i = 0; i < 3; i++) {
        var slot = el('div', 'line-slot');
        var ta = createTextarea('Line ' + (i + 1) + '...');
        ta.dataset.lineIndex = i;
        slot.appendChild(ta);
        els.foldArea.appendChild(slot);
      }
    } else {
      /* Foundational (read-only) + 2 inputs */
      var fSlot = el('div', 'line-slot');
      var fDiv = el('div', 'line-foundational');
      fDiv.textContent = state.foundational;
      fSlot.appendChild(fDiv);
      els.foldArea.appendChild(fSlot);

      for (var j = 0; j < 2; j++) {
        var slot2 = el('div', 'line-slot');
        var ta2 = createTextarea('Line ' + (j + 2) + '...');
        ta2.dataset.lineIndex = j;
        slot2.appendChild(ta2);
        els.foldArea.appendChild(slot2);
      }
    }

    /* Focus first input */
    var firstInput = els.foldArea.querySelector('.line-input');
    if (firstInput) setTimeout(function () { firstInput.focus(); }, 100);
  }

  /* ---- APP TURN ---- */
  function renderAppTurn(state) {
    var mood = state.moodProfile;
    var thinkText = (typeof CorpseReveal !== 'undefined' && mood) ? CorpseReveal.getThinkingText(mood) : 'the machine is dreaming';

    els.turnIndicator.textContent = 'Turn ' + state.turnNumber + ' \u00b7 The Machine Dreams';
    els.foldBtn.classList.add('hidden');
    els.reviveBtn.classList.add('hidden');

    els.foldArea.innerHTML = '';

    var fSlot = el('div', 'line-slot');
    var fDiv = el('div', 'line-foundational foundational-pulse');
    fDiv.textContent = state.foundational;
    fSlot.appendChild(fDiv);
    els.foldArea.appendChild(fSlot);

    var thinkSlot = el('div', 'line-slot');
    thinkSlot.id = 'thinking-slot';
    thinkSlot.innerHTML =
      '<div class="thinking">' + thinkText +
      '<div class="thinking-shapes">' +
        '<div class="thinking-shape"></div>' +
        '<div class="thinking-shape"></div>' +
        '<div class="thinking-shape"></div>' +
      '</div></div>';
    els.foldArea.appendChild(thinkSlot);
  }

  /* ---- REVEAL ---- */
  function renderReveal(state) {
    els.turnIndicator.textContent = '';
    els.foldBtn.classList.add('hidden');
    els.reviveBtn.classList.add('hidden');
    els.revealOverlay.classList.add('active');
    els.timerContainer.classList.remove('active');

    var revealStyle;
    if (typeof CorpseMood !== 'undefined') {
      revealStyle = CorpseMood.getRevealStyle();
    } else {
      revealStyle = { archetype: 'seance', title: 'The Corpse Speaks', config: { lineDelayMs: 300, staggerMs: 150, entryAngle: 0, entryDistance: 15, blurStart: 0, opacityEasing: 'ease', geometryIntensity: 0.5, warmth: 0.5, intensity: 0.5, strangeness: 0 } };
    }

    var titleEl = els.revealOverlay.querySelector('.reveal-title');
    if (titleEl) titleEl.textContent = revealStyle.title;

    var totalDuration;
    if (typeof CorpseReveal !== 'undefined') {
      totalDuration = CorpseReveal.render(els.revealOverlay, state.allLines, revealStyle);
    } else {
      totalDuration = renderRevealFallback(state);
    }

    setTimeout(function () {
      els.exportControls.classList.add('visible');
    }, totalDuration + 300);

    els._lastRevealStyle = revealStyle;
  }

  /* ================================================================
     FOLD ANIMATION
     ================================================================ */
  function showFoldAnimation(callback) {
    var slots = els.foldArea.querySelectorAll('.line-slot');
    if (slots.length < 2) { callback(); return; }

    /* Lock inputs */
    var inputs = els.foldArea.querySelectorAll('.line-input');
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].classList.add('locked');
    }

    /* Fold all but last slot */
    var slotsToFold = [];
    for (var j = 0; j < slots.length - 1; j++) {
      slotsToFold.push(slots[j]);
    }

    /* Measure heights so transition is smooth */
    slotsToFold.forEach(function (slot) {
      slot.style.maxHeight = slot.offsetHeight + 'px';
      slot.offsetHeight; /* force reflow */
    });

    requestAnimationFrame(function () {
      slotsToFold.forEach(function (slot) {
        slot.classList.add('folding');
      });
    });

    /* After animation completes */
    setTimeout(function () {
      var divider = el('div', 'fold-divider');
      els.foldArea.insertBefore(divider, slots[slots.length - 1]);

      var lastSlot = slots[slots.length - 1];
      var lastInput = lastSlot.querySelector('.line-input');
      if (lastInput) {
        var fDiv = el('div', 'line-foundational');
        fDiv.textContent = lastInput.value;
        lastSlot.innerHTML = '';
        lastSlot.appendChild(fDiv);
      }

      setTimeout(callback, 300);
    }, 900);
  }

  /* ================================================================
     APP LINES REVEAL (typewriter-style)
     ================================================================ */
  function showAppLines(lines, callback) {
    var thinkSlot = document.getElementById('thinking-slot');
    if (thinkSlot) thinkSlot.remove();

    var delay = 0;
    lines.forEach(function (text, idx) {
      var slot = el('div', 'line-slot');
      var lineDiv = el('div', 'line-app');
      slot.appendChild(lineDiv);
      els.foldArea.appendChild(slot);

      delay += 400;
      setTimeout(function () {
        typewriterReveal(lineDiv, text, function () {
          lineDiv.classList.add('visible');
        });
      }, delay);
      delay += Math.max(400, text.length * 35);
    });

    /* After all lines revealed, trigger fold */
    setTimeout(callback, delay + 600);
  }

  function typewriterReveal(element, text, onDone) {
    element.classList.add('visible');
    element.textContent = '';
    var i = 0;

    var speed = 30;
    var css = (typeof CorpseMood !== 'undefined') ? CorpseMood.getCSSProperties() : null;
    if (css && css['--mood-typewriter-ms']) {
      speed = parseInt(css['--mood-typewriter-ms']) || 30;
    }

    var interval = setInterval(function () {
      if (i < text.length) {
        element.textContent += text[i];
        i++;
      } else {
        clearInterval(interval);
        if (onDone) onDone();
      }
    }, speed);
  }

  /* ================================================================
     BALLISTIC DISSOLVE
     ================================================================ */
  function showBallisticDissolve(callback) {
    els.foldArea.classList.add('ballistic-dissolve');
    setTimeout(function () {
      els.foldArea.classList.remove('ballistic-dissolve');
      els.foldArea.innerHTML = '';
      if (callback) callback();
    }, 1000);
  }

  /* ================================================================
     REVEAL FALLBACK
     ================================================================ */
  function renderRevealFallback(state) {
    els.poemScroll.innerHTML = '';
    var currentTurn = 0;
    var items = [];

    for (var i = 0; i < state.allLines.length; i++) {
      var line = state.allLines[i];
      if (line.turn !== currentTurn) {
        currentTurn = line.turn;
        var sep = el('div', 'reveal-turn-separator');
        sep.textContent = (line.author === 'user' ? 'You' : 'The Machine') + ' \u2014 turn ' + line.turn;
        els.poemScroll.appendChild(sep);
        items.push(sep);
      }
      var lineEl = el('div', 'reveal-line author-' + line.author);
      lineEl.textContent = line.text;
      els.poemScroll.appendChild(lineEl);
      items.push(lineEl);
    }

    for (var k = 0; k < items.length; k++) {
      (function (item, delay) {
        setTimeout(function () { item.classList.add('visible'); }, delay);
      })(items[k], 200 + k * 150);
    }

    return 200 + items.length * 150;
  }

  /* ================================================================
     HELPERS
     ================================================================ */
  function createTextarea(placeholder) {
    var ta = document.createElement('textarea');
    ta.className = 'line-input';
    ta.placeholder = placeholder;
    ta.rows = 1;
    ta.setAttribute('spellcheck', 'false');

    /* Auto-expand */
    ta.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
    });

    return ta;
  }

  function getInputValues() {
    var inputs = els.foldArea.querySelectorAll('.line-input');
    var values = [];
    for (var i = 0; i < inputs.length; i++) {
      values.push(inputs[i].value);
    }
    return values;
  }

  function showError(msg) {
    els.errorMsg.textContent = msg;
  }

  function showInputErrors(errors) {
    /* Shake inputs that have errors */
    var inputs = els.foldArea.querySelectorAll('.line-input');
    inputs.forEach(function (inp) {
      inp.classList.remove('error');
    });

    errors.forEach(function (err) {
      var match = err.match(/Line (\d+)/);
      if (match) {
        var lineNum = parseInt(match[1]);
        /* find the right input */
        inputs.forEach(function (inp) {
          var idx = parseInt(inp.dataset.lineIndex);
          if (idx === lineNum - 1 || idx === lineNum - 2) {
            inp.classList.add('error');
            setTimeout(function () { inp.classList.remove('error'); }, 500);
          }
        });
      }
    });

    showError(errors.join(' '));
  }

  function setTimerDisplay(remaining, total) {
    if (!els.timerContainer) return;
    els.timerContainer.classList.add('active');
    var pct = (remaining / total) * 100;
    els.timerBar.style.width = pct + '%';
    els.timerLabel.textContent = remaining + 's';

    if (remaining <= 10) {
      els.timerBar.classList.add('urgent');
    } else {
      els.timerBar.classList.remove('urgent');
    }
  }

  function hideTimer() {
    if (els.timerContainer) {
      els.timerContainer.classList.remove('active');
      els.timerLabel.textContent = '';
    }
  }

  function closeReveal() {
    els.revealOverlay.classList.remove('active');
    els.exportControls.classList.remove('visible');
    els.poemScroll.innerHTML = '';
  }

  /* ================================================================
     PUBLIC API
     ================================================================ */
  return {
    init: init,
    renderTurn: renderTurn,
    showFoldAnimation: showFoldAnimation,
    showAppLines: showAppLines,
    showBallisticDissolve: showBallisticDissolve,
    getInputValues: getInputValues,
    showError: showError,
    showInputErrors: showInputErrors,
    setTimerDisplay: setTimerDisplay,
    hideTimer: hideTimer,
    closeReveal: closeReveal,
    updateApiStatus: updateApiStatus,
    els: els
  };
})();
