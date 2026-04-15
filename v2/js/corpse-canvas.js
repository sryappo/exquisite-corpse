/* ===== CorpseCanvas — Background Geometric Particles ===== */
var CorpseCanvas = (function () {
  'use strict';

  var canvas, ctx;
  var particles = [];
  var animFrameId = null;
  var MAX_PARTICLES = 25;

  function init(canvasEl) {
    canvas = canvasEl;
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    seedParticles();
    start();
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function seedParticles() {
    particles = [];
    for (var i = 0; i < MAX_PARTICLES; i++) {
      particles.push(createParticle());
    }
  }

  function createParticle() {
    var shapes = ['circle', 'triangle', 'line', 'square'];
    return {
      x: Math.random() * (canvas ? canvas.width : 800),
      y: Math.random() * (canvas ? canvas.height : 600),
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2 - 0.1,
      size: 4 + Math.random() * 16,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.01,
      opacity: 0.1 + Math.random() * 0.3,
      life: 0,
      maxLife: 600 + Math.random() * 600
    };
  }

  function start() {
    if (animFrameId) return;
    tick();
  }

  function stop() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  function tick() {
    if (!ctx || !canvas) return;
    animFrameId = requestAnimationFrame(tick);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var mood = (typeof CorpseMood !== 'undefined') ? CorpseMood.getProfile() : { valence: 0, energy: 0, texture: 0, strangeness: 0 };

    var r = lerp(100, 200, (mood.valence + 1) / 2);
    var g = lerp(80, 160, (mood.valence + 1) / 2);
    var b = lerp(160, 80, (mood.valence + 1) / 2);
    var speedMult = lerp(0.3, 1.5, (mood.energy + 1) / 2);
    var skewAmount = lerp(0, 0.05, (mood.strangeness + 1) / 2);

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.life++;

      if (p.life > p.maxLife || p.y < -50 || p.y > canvas.height + 50 || p.x < -50 || p.x > canvas.width + 50) {
        particles[i] = createParticle();
        continue;
      }

      p.x += p.vx * speedMult;
      p.y += p.vy * speedMult;
      p.rotation += p.rotationSpeed * speedMult;

      p.x += Math.sin(p.life * 0.02) * skewAmount * 2;

      var fadeIn = Math.min(p.life / 60, 1);
      var fadeOut = Math.min((p.maxLife - p.life) / 60, 1);
      var alpha = p.opacity * fadeIn * fadeOut;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgb(' + Math.floor(r) + ',' + Math.floor(g) + ',' + Math.floor(b) + ')';
      ctx.lineWidth = lerp(0.5, 2, (mood.texture + 1) / 2);

      drawShape(p.shape, p.size);

      ctx.restore();
    }
  }

  function drawShape(shape, size) {
    var half = size / 2;
    switch (shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, half, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -half);
        ctx.lineTo(-half, half);
        ctx.lineTo(half, half);
        ctx.closePath();
        ctx.stroke();
        break;
      case 'square':
        ctx.strokeRect(-half, -half, size, size);
        break;
      case 'line':
        ctx.beginPath();
        ctx.moveTo(-half, 0);
        ctx.lineTo(half, 0);
        ctx.stroke();
        break;
    }
  }

  function lerp(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    return a + (b - a) * t;
  }

  return {
    init: init,
    start: start,
    stop: stop
  };
})();
