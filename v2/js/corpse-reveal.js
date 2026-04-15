/* ===== CorpseReveal — Parametric Contextual Reveal ===== */
var CorpseReveal = (function () {
  'use strict';

  function render(containerEl, allLines, revealStyle) {
    containerEl.innerHTML = '';

    var config = revealStyle.config;
    var archetype = revealStyle.archetype;

    var titleEl = document.createElement('div');
    titleEl.className = 'reveal-title reveal-title--' + archetype;
    titleEl.textContent = revealStyle.title;
    containerEl.appendChild(titleEl);

    var scrollEl = document.createElement('div');
    scrollEl.className = 'poem-scroll';
    containerEl.appendChild(scrollEl);

    var items = [];
    var currentTurn = 0;

    for (var i = 0; i < allLines.length; i++) {
      var line = allLines[i];

      if (line.turn !== currentTurn) {
        currentTurn = line.turn;
        var sep = document.createElement('div');
        sep.className = 'reveal-turn-separator';
        sep.textContent = (line.author === 'user' ? 'You' : 'The Machine') + ' \u2014 turn ' + line.turn;
        scrollEl.appendChild(sep);
        items.push({ el: sep, type: 'separator' });
      }

      var lineEl = document.createElement('div');
      lineEl.className = 'reveal-line author-' + line.author;

      var angle = config.entryAngle * (Math.random() > 0.5 ? 1 : -1);
      var distance = config.entryDistance;
      var blurStart = config.blurStart || 0;

      if (archetype === 'delirium') {
        angle = (Math.random() - 0.5) * config.entryAngle * 2;
        distance = config.entryDistance * (0.5 + Math.random());
        lineEl.style.fontSize = (14 + Math.random() * 4) + 'px';
      }

      lineEl.style.transform = 'translateY(' + distance + 'px) rotate(' + angle + 'deg)';
      lineEl.style.filter = blurStart > 0 ? 'blur(' + blurStart + 'px)' : '';
      lineEl.style.transition = 'all ' + config.lineDelayMs + 'ms ' + config.opacityEasing;
      lineEl.textContent = line.text;
      scrollEl.appendChild(lineEl);
      items.push({ el: lineEl, type: 'line' });
    }

    for (var k = 0; k < items.length; k++) {
      (function (item, delay) {
        setTimeout(function () {
          item.el.classList.add('visible');
          if (item.type === 'line') {
            item.el.style.transform = 'translateY(0) rotate(0deg)';
            item.el.style.filter = '';
          }
        }, delay);
      })(items[k], 200 + k * config.staggerMs);
    }

    return 200 + items.length * config.staggerMs + config.lineDelayMs;
  }

  function getThinkingText(mood) {
    if (!mood) return 'the machine is dreaming';

    if (mood.strangeness > 0.4) return 'the machine unravels';
    if (mood.energy > 0.3 && mood.valence < -0.2) return 'the machine convulses';
    if (mood.energy > 0.3) return 'the machine ignites';
    if (mood.energy < -0.3) return 'the machine breathes';
    if (mood.valence < -0.3) return 'the machine mourns';
    if (mood.valence > 0.3) return 'the machine glows';
    if (mood.texture < -0.3) return 'the machine dissolves';
    if (mood.texture > 0.3) return 'the machine grinds';

    return 'the machine is dreaming';
  }

  return {
    render: render,
    getThinkingText: getThinkingText
  };
})();
