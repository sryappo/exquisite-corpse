/* ===== CorpseAudio — Opt-in Web Audio Ambient Layer ===== */
var CorpseAudio = (function () {
  'use strict';

  var audioCtx = null;
  var masterGain = null;
  var oscillators = [];
  var noiseNode = null;
  var isPlaying = false;
  var updateInterval = null;

  var BASE_FREQS = [65.41, 77.78, 98.00, 130.81];

  function init() {
    /* Don't create context until user opts in */
  }

  function start() {
    if (isPlaying) return;

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return;
    }

    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.08;
    masterGain.connect(audioCtx.destination);

    oscillators = [];
    for (var i = 0; i < BASE_FREQS.length; i++) {
      var osc = audioCtx.createOscillator();
      var oscGain = audioCtx.createGain();
      oscGain.gain.value = 0.25;
      osc.type = 'sine';
      osc.frequency.value = BASE_FREQS[i];
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start();
      oscillators.push({ osc: osc, gain: oscGain, baseFreq: BASE_FREQS[i] });
    }

    createNoise();

    isPlaying = true;

    updateInterval = setInterval(updateFromMood, 2000);
    updateFromMood();
  }

  function stop() {
    if (!isPlaying) return;

    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }

    for (var i = 0; i < oscillators.length; i++) {
      try { oscillators[i].osc.stop(); } catch (e) { /* ignore */ }
    }
    oscillators = [];

    if (noiseNode) {
      try { noiseNode.source.stop(); } catch (e) { /* ignore */ }
      noiseNode = null;
    }

    if (audioCtx) {
      try { audioCtx.close(); } catch (e) { /* ignore */ }
      audioCtx = null;
    }

    isPlaying = false;
  }

  function createNoise() {
    if (!audioCtx) return;
    var bufferSize = audioCtx.sampleRate * 2;
    var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    var source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    var filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    var noiseGain = audioCtx.createGain();
    noiseGain.gain.value = 0.05;

    source.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain);
    source.start();

    noiseNode = { source: source, filter: filter, gain: noiseGain };
  }

  function updateFromMood() {
    if (!isPlaying || !audioCtx) return;

    var mood = (typeof CorpseMood !== 'undefined') ? CorpseMood.getProfile() : { valence: 0, energy: 0, texture: 0, strangeness: 0 };
    var now = audioCtx.currentTime;
    var rampTime = 2.0;

    var detuneAmount = lerp(-30, 30, (mood.valence + 1) / 2);
    for (var i = 0; i < oscillators.length; i++) {
      var detune = (i % 2 === 0) ? detuneAmount : -detuneAmount * 0.5;
      oscillators[i].osc.detune.linearRampToValueAtTime(detune, now + rampTime);
    }

    var oscLevel = lerp(0.1, 0.4, (mood.energy + 1) / 2);
    for (var j = 0; j < oscillators.length; j++) {
      oscillators[j].gain.gain.linearRampToValueAtTime(oscLevel, now + rampTime);
    }

    if (noiseNode) {
      var noiseFreq = lerp(100, 2000, (mood.texture + 1) / 2);
      var noiseLevel = lerp(0.08, 0.02, (mood.texture + 1) / 2);
      noiseNode.filter.frequency.linearRampToValueAtTime(noiseFreq, now + rampTime);
      noiseNode.gain.gain.linearRampToValueAtTime(noiseLevel, now + rampTime);
    }

    if (mood.strangeness > 0.2) {
      var drift = lerp(0, 15, (mood.strangeness + 1) / 2);
      for (var k = 0; k < oscillators.length; k++) {
        var randomDrift = (Math.random() - 0.5) * drift;
        var newFreq = oscillators[k].baseFreq + randomDrift;
        oscillators[k].osc.frequency.linearRampToValueAtTime(newFreq, now + rampTime);
      }
    }
  }

  function setVolume(level) {
    if (masterGain) {
      masterGain.gain.linearRampToValueAtTime(
        Math.max(0, Math.min(0.2, level)),
        audioCtx.currentTime + 0.5
      );
    }
  }

  function isActive() {
    return isPlaying;
  }

  function lerp(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    return a + (b - a) * t;
  }

  return {
    init: init,
    start: start,
    stop: stop,
    setVolume: setVolume,
    isActive: isActive
  };
})();
