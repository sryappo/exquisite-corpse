/* ===== CorpseApp V2 — Orchestrator ===== */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    CorpseMood.init();
    CorpseGenerator.init();
    CorpseState.init();
    CorpseUI.init(document.getElementById('corpse-app'));
    CorpseCanvas.init(document.getElementById('bg-canvas'));

    CorpseState.onStateChange(function (state) {
      applyMoodCSS();

      CorpseUI.renderTurn(state);

      if (state.phase === 'APP_TURN') {
        handleAppTurn(state);
      }

      if (state.phase === 'USER_TURN' && state.timedMode) {
        startTimerForUser(state);
      } else if (state.phase !== 'USER_TURN') {
        CorpseTimer.stop();
        CorpseUI.hideTimer();
      }
    });

    document.addEventListener('click', function (e) {
      if (e.target.id === 'fold-btn' || e.target.closest('#fold-btn')) {
        handleFold();
      }
    });

    document.addEventListener('click', function (e) {
      if (e.target.id === 'revive-btn' || e.target.closest('#revive-btn')) {
        CorpseTimer.stop();
        CorpseUI.hideTimer();
        CorpseState.revive();
      }
    });

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
      if (e.target.id === 'download-html-btn') {
        var revealStyle = CorpseUI.els._lastRevealStyle || CorpseMood.getRevealStyle();
        CorpseExport.downloadAsHTML(state.allLines, revealStyle);
      }
      if (e.target.id === 'download-png-btn') {
        var revealOverlay = document.getElementById('reveal-overlay');
        var revealStyle2 = CorpseUI.els._lastRevealStyle || CorpseMood.getRevealStyle();
        CorpseExport.downloadAsPNG(revealOverlay, revealStyle2);
      }
    });

    document.addEventListener('click', function (e) {
      if (e.target.id === 'new-session-btn') {
        CorpseUI.closeReveal();
        CorpseMood.init();
        CorpseState.init();
        applyMoodCSS();
      }
    });

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
      if (e.target.id === 'audio-toggle') {
        if (e.target.checked) {
          CorpseAudio.start();
        } else {
          CorpseAudio.stop();
        }
      }
    });

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

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        var state = CorpseState.getSnapshot();
        if (state.phase === 'USER_TURN') {
          var active = document.activeElement;
          if (active && active.classList.contains('line-input')) {
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

    CorpseState.init();
  });

  function applyMoodCSS() {
    var props = CorpseMood.getCSSProperties();
    var root = document.documentElement;
    var keys = Object.keys(props);
    for (var i = 0; i < keys.length; i++) {
      root.style.setProperty(keys[i], props[keys[i]]);
    }
  }

  function handleFold() {
    var state = CorpseState.getSnapshot();
    if (state.phase !== 'USER_TURN') return;

    var values = CorpseUI.getInputValues();
    var result = CorpseState.submitUserLines(values);

    if (!result.ok) {
      CorpseUI.showInputErrors(result.errors);
      return;
    }

    var foldBtn = document.getElementById('fold-btn');
    if (foldBtn) foldBtn.disabled = true;

    CorpseUI.showFoldAnimation(function () {
      CorpseState.fold();
    });
  }

  function handleAppTurn(state) {
    var thinkDuration = 1500 + Math.random() * 1000;

    setTimeout(function () {
      CorpseGenerator.generate(state.foundational).then(function (lines) {
        var fullLines = [state.foundational, lines[0], lines[1]];

        CorpseUI.showAppLines(lines, function () {
          CorpseState.submitAppLines(fullLines);

          applyMoodCSS();

          setTimeout(function () {
            CorpseUI.showFoldAnimation(function () {
              CorpseState.fold();
            });
          }, 400);
        });
      });
    }, thinkDuration);
  }

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
          CorpseUI.showBallisticDissolve(function () {
            var values = CorpseUI.getInputValues();
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
