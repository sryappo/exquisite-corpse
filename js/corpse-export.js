/* ===== CorpseExport — Save & Export ===== */
var CorpseExport = (function () {
  'use strict';

  function formatPoem(allLines) {
    var text = '';
    var currentTurn = 0;
    for (var i = 0; i < allLines.length; i++) {
      var line = allLines[i];
      if (line.turn !== currentTurn) {
        if (currentTurn > 0) text += '\n';
        currentTurn = line.turn;
        var label = line.author === 'user' ? 'You' : 'The Machine';
        text += '— ' + label + ' (turn ' + line.turn + ') —\n';
      }
      text += line.text + '\n';
    }
    return text;
  }

  function formatPoemClean(allLines) {
    var text = '';
    for (var i = 0; i < allLines.length; i++) {
      text += allLines[i].text + '\n';
    }
    return text;
  }

  function copyToClipboard(allLines, clean) {
    var text = clean ? formatPoemClean(allLines) : formatPoem(allLines);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; });
    }
    /* fallback */
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
    return Promise.resolve(true);
  }

  function downloadAsText(allLines, clean) {
    var text = clean ? formatPoemClean(allLines) : formatPoem(allLines);
    var filename = 'exquisite-corpse-' + new Date().toISOString().slice(0, 10) + '.txt';
    var blob = new Blob([text], { type: 'text/plain' });
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

  return {
    formatPoem: formatPoem,
    formatPoemClean: formatPoemClean,
    copyToClipboard: copyToClipboard,
    downloadAsText: downloadAsText
  };
})();
