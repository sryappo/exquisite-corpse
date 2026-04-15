/* ===== CorpseArtifact — Standalone HTML & PNG Export ===== */
var CorpseArtifact = (function () {
  'use strict';

  function generateHTML(allLines, revealStyle) {
    var config = revealStyle.config;
    var archetype = revealStyle.archetype;

    var warmth = config.warmth;
    var bgHue = lerp(240, 35, warmth);
    var accentR = lerp(60, 200, warmth);
    var accentG = lerp(60, 80, warmth);
    var accentB = lerp(100, 60, warmth);
    var textGlow = lerp(0, 6, warmth);

    var poemHTML = '';
    var currentTurn = 0;
    var delay = 0;

    for (var i = 0; i < allLines.length; i++) {
      var line = allLines[i];
      if (line.turn !== currentTurn) {
        currentTurn = line.turn;
        var label = line.author === 'user' ? 'You' : 'The Machine';
        poemHTML += '<div class="sep" style="animation-delay:' + delay + 'ms">' + escapeHTML(label) + ' \u2014 turn ' + line.turn + '</div>';
        delay += config.staggerMs;
      }
      var authorClass = line.author === 'user' ? 'user' : 'app';
      poemHTML += '<div class="line ' + authorClass + '" style="animation-delay:' + delay + 'ms">' + escapeHTML(line.text) + '</div>';
      delay += config.staggerMs;
    }

    return '<!DOCTYPE html>\n' +
    '<html lang="en"><head><meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">\n' +
    '<title>' + escapeHTML(revealStyle.title) + ' — Exquisite Corpse</title>\n' +
    '<style>\n' +
    '*{margin:0;padding:0;box-sizing:border-box}\n' +
    'body{background:hsl(' + bgHue.toFixed(0) + ',20%,5%);color:#e8dcc8;' +
    'font-family:"Courier New",Courier,monospace;min-height:100vh;' +
    'display:flex;flex-direction:column;align-items:center;padding:40px 20px}\n' +
    'h1{font-family:Georgia,"Times New Roman",serif;font-size:22px;' +
    'letter-spacing:6px;text-transform:uppercase;margin-bottom:32px;' +
    'text-align:center;color:#e8dcc8}\n' +
    '.poem{max-width:640px;width:100%}\n' +
    '.sep{font-size:10px;color:rgb(' + accentR.toFixed(0) + ',' + accentG.toFixed(0) + ',' + accentB.toFixed(0) + ');' +
    'letter-spacing:3px;text-transform:uppercase;font-weight:700;' +
    'padding:16px 0 4px;opacity:0;animation:fadeIn 0.5s ease forwards}\n' +
    '.line{font-size:15px;line-height:1.7;padding:6px 0;opacity:0;' +
    'animation:slideIn 0.6s ease forwards}\n' +
    '.line.user{color:#e8dcc8;text-shadow:0 0 ' + textGlow.toFixed(1) + 'px rgba(232,220,200,0.2)}\n' +
    '.line.app{color:#8b6abf;text-shadow:0 0 ' + textGlow.toFixed(1) + 'px rgba(139,106,191,0.2)}\n' +
    '.footer{margin-top:40px;font-size:11px;color:#5a5347;letter-spacing:2px;text-align:center}\n' +
    '@keyframes fadeIn{to{opacity:1}}\n' +
    '@keyframes slideIn{to{opacity:1;transform:translateY(0)}}\n' +
    '.line{transform:translateY(12px)}\n' +
    '</style></head><body>\n' +
    '<h1>' + escapeHTML(revealStyle.title) + '</h1>\n' +
    '<div class="poem">' + poemHTML + '</div>\n' +
    '<div class="footer">Written by a human and the machine &middot; Exquisite Corpse</div>\n' +
    '</body></html>';
  }

  function downloadHTML(allLines, revealStyle) {
    var html = generateHTML(allLines, revealStyle);
    var filename = 'exquisite-corpse-' + revealStyle.archetype + '-' + new Date().toISOString().slice(0, 10) + '.html';
    var blob = new Blob([html], { type: 'text/html' });
    triggerDownload(blob, filename);
  }

  function downloadPNG(containerEl, revealStyle) {
    if (typeof html2canvas !== 'undefined') {
      return html2canvas(containerEl, {
        backgroundColor: '#0a0a0f',
        width: 1200,
        scale: 2
      }).then(function (canvas) {
        canvas.toBlob(function (blob) {
          var filename = 'exquisite-corpse-' + revealStyle.archetype + '-' + new Date().toISOString().slice(0, 10) + '.png';
          triggerDownload(blob, filename);
        });
      });
    }

    return new Promise(function (resolve) {
      var canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      var ctx = canvas.getContext('2d');

      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, 1200, 630);

      ctx.fillStyle = '#e8dcc8';
      ctx.font = '24px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(revealStyle.title, 600, 60);

      ctx.font = '16px "Courier New", monospace';
      ctx.textAlign = 'left';
      var y = 100;
      var allLineEls = containerEl.querySelectorAll('.reveal-line');
      for (var i = 0; i < allLineEls.length; i++) {
        var el = allLineEls[i];
        ctx.fillStyle = el.classList.contains('author-app') ? '#8b6abf' : '#e8dcc8';
        ctx.fillText(el.textContent, 60, y);
        y += 28;
        if (y > 590) break;
      }

      ctx.fillStyle = '#5a5347';
      ctx.font = '11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Written by a human and the machine \u00b7 Exquisite Corpse', 600, 610);

      canvas.toBlob(function (blob) {
        var filename = 'exquisite-corpse-' + revealStyle.archetype + '-' + new Date().toISOString().slice(0, 10) + '.png';
        triggerDownload(blob, filename);
        resolve();
      });
    });
  }

  function triggerDownload(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function lerp(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    return a + (b - a) * t;
  }

  return {
    generateHTML: generateHTML,
    downloadHTML: downloadHTML,
    downloadPNG: downloadPNG
  };
})();
