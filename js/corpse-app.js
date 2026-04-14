/* ===== CorpseApp — Orchestrator ===== */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    /* Initialize modules */
    CorpseGenerator.init();
    CorpseState.init();
    CorpseUI.init(document.getElementById('corpse-app'));

    /* Wire state changes to UI */
    CorpseState.onStateChange(function (state) {
      CorpseUI.renderTurn(state);

      /* Handle phase transitions */
      if (state.phase === 'APP_TURN') {
        handleAppTurn(state);
      }

      /* Timer management */
      if (state.phase === 'USER_TURN' && state.timedMode) {
        startTimerForUser(state);
      } else if (state.phase !== 'USER_TURN') {
        CorpseTimer.stop();
        CorpseUI.hideTimer();
      }
    });

    /* ---- Fold Button ---- */
    document.addEventListener('click', function (e) {
      if (e.target.id === 'fold-btn' || e.target.closest('#fold-btn')) {
        handleFold();
      }
    });

    /* ---- Revive Button ---- */
    document.addEventListener('click', function (e) {
      if (e.target.id === 'revive-btn' || e.target.closest('#revive-btn')) {
        CorpseTimer.stop();
        CorpseUI.hideTimer();
        CorpseState.revive();
      }
    });

    /* ---- Export Buttons ---- */
    document.addEventListener('click', function (e) {
      var state = CorpseState.getSnapshot();
      if (e.target.id === 'copy-btn') {
        CorpseExport.copyToClipboard(state.allLines, false).then(function () {
          e.target.textContent = 'Copied!';
          setTimeout(function () { e.target.textContent = 'Copy to Clipboard'; }, 2000);
        });
      }
      if (e.target.id === 'copy-clean-btn') {
        CorpseExport.copyToClipboard(state.allLines, true).then(function () {
          e.target.textContent = 'Copied!';
          setTimeout(function () { e.target.textContent = 'Copy (clean)'; }, 2000);
        });
      }
      if (e.target.id === 'download-btn') {
        CorpseExport.downloadAsText(state.allLines, false);
      }
    });

    /* ---- New Session ---- */
    document.addEventListener('click', function (e) {
      if (e.target.id === 'new-session-btn') {
        CorpseUI.closeReveal();
        CorpseState.init();
      }
    });

    /* ---- Settings Wiring ---- */
    document.addEventListener('change', function (e) {
      if (e.target.id === 'timed-toggle') {
        CorpseState.updateSettings({ timedMode: e.target.checked });
      }
      if (e.target.id === 'ballistic-toggle') {
        CorpseState.updateSettings({ ballisticMode: e.target.checked });
      }
      if (e.target.id === 'timer-range') {
        var val = parseInt(e.target.value);
        CorpseState.updateSettings({ timerSeconds: val });
        var label = document.getElementById('timer-range-value');
        if (label) label.textContent = val + ' seconds';
      }
    });

    /* ---- API Key Wiring ---- */
    document.addEventListener('click', function (e) {
      if (e.target.id === 'api-key-save') {
        var input = document.getElementById('api-key-input');
        if (input && input.value.trim()) {
          CorpseGenerator.setApiKey(input.value.trim());
          input.value = '';
          CorpseUI.updateApiStatus();
        }
      }
      if (e.target.id === 'api-key-clear') {
        CorpseGenerator.removeApiKey();
        CorpseUI.updateApiStatus();
      }
    });

    /* ---- Keyboard: Enter to Fold ---- */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        var state = CorpseState.getSnapshot();
        if (state.phase === 'USER_TURN') {
          var active = document.activeElement;
          if (active && active.classList.contains('line-input')) {
            /* Move to next input or fold */
            var inputs = document.querySelectorAll('.line-input');
            var idx = Array.prototype.indexOf.call(inputs, active);
            if (idx < inputs.length - 1) {
              e.preventDefault();
              inputs[idx + 1].focus();
            } else {
              e.preventDefault();
              handleFold();
            }
          }
        }
      }
    });

    /* Trigger initial render */
    CorpseState.init();
  });

  /* ================================================================
     FOLD HANDLER
     ================================================================ */
  function handleFold() {
    var state = CorpseState.getSnapshot();
    if (state.phase !== 'USER_TURN') return;

    var values = CorpseUI.getInputValues();
    var result = CorpseState.submitUserLines(values);

    if (!result.ok) {
      CorpseUI.showInputErrors(result.errors);
      return;
    }

    /* Disable fold button during animation */
    var foldBtn = document.getElementById('fold-btn');
    if (foldBtn) foldBtn.disabled = true;

    CorpseUI.showFoldAnimation(function () {
      CorpseState.fold();
    });
  }

  /* ================================================================
     APP TURN HANDLER
     ================================================================ */
  function handleAppTurn(state) {
    var thinkDuration = 1500 + Math.random() * 1000;

    setTimeout(function () {
      CorpseGenerator.generate(state.foundational).then(function (lines) {
        var fullLines = [state.foundational, lines[0], lines[1]];

        /* Show the generated lines with typewriter effect */
        CorpseUI.showAppLines(lines, function () {
          /* Submit and fold */
          CorpseState.submitAppLines(fullLines);

          /* Auto-fold after a brief pause */
          setTimeout(function () {
            CorpseUI.showFoldAnimation(function () {
              CorpseState.fold();
            });
          }, 400);
        });
      });
    }, thinkDuration);
  }

  /* ================================================================
     TIMER FOR USER TURNS
     ================================================================ */
  function startTimerForUser(state) {
    CorpseTimer.start(
      state.timerSeconds,
      function onTick(remaining, total) {
        CorpseUI.setTimerDisplay(remaining, total);
      },
      function onExpire() {
        var currentState = CorpseState.getSnapshot();
        if (currentState.phase !== 'USER_TURN') return;

        if (currentState.ballisticMode) {
          /* Ballistic: dissolve everything */
          CorpseUI.showBallisticDissolve(function () {
            /* Auto-fold with whatever is there (or empty) */
            var values = CorpseUI.getInputValues();
            /* Fill missing with placeholder */
            var isFirst = currentState.turnNumber === 1;
            var needed = isFirst ? 3 : 2;
            while (values.length < needed) values.push('...');
            for (var i = 0; i < values.length; i++) {
              if (!values[i].trim()) values[i] = '...';
            }
            var result = CorpseState.submitUserLines(values);
            if (result.ok) {
              CorpseState.fold();
            }
          });
        } else {
          /* Normal timed: auto-fold with current content */
          var values = CorpseUI.getInputValues();
          var isFirst = currentState.turnNumber === 1;
          var needed = isFirst ? 3 : 2;
          while (values.length < needed) values.push('time ran out');
          for (var i = 0; i < values.length; i++) {
            if (!values[i].trim()) values[i] = 'time ran out';
          }
          var result = CorpseState.submitUserLines(values);
          if (result.ok) {
            CorpseUI.showFoldAnimation(function () {
              CorpseState.fold();
            });
          }
        }
        CorpseUI.hideTimer();
      }
    );
  }
})();
