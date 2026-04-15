/* ===== CorpseMood — Mood Engine ===== */
var CorpseMood = (function () {
  'use strict';

  /* ================================================================
     MOOD WORD BANKS — words mapped to dimension deltas
     Each word maps to { valence, energy, texture, strangeness }
     Values are deltas: positive pushes toward +1 pole, negative toward -1
     ================================================================ */

  var MOOD_WORDS = {
    /* --- Valence: dark (-) vs luminous (+) --- */
    dark_valence: {
      words: [
        'death','dead','dark','darkness','shadow','night','blood','bone','skull',
        'grave','tomb','ghost','corpse','decay','rot','ruin','ash','dust',
        'void','abyss','doom','dread','grief','sorrow','mourning','loss',
        'wound','scar','black','bleed','poison','venom','curse','haunt',
        'scream','wail','agony','pain','suffer','torment','despair','gloom',
        'desolate','barren','forsaken','forgotten','abandoned','hollow','empty'
      ],
      delta: { valence: -0.3, energy: 0, texture: 0, strangeness: 0 }
    },
    light_valence: {
      words: [
        'light','sun','gold','golden','bright','glow','shine','radiant',
        'bloom','flower','blossom','garden','spring','dawn','morning','joy',
        'love','warm','warmth','gentle','tender','soft','sweet','honey',
        'silk','pearl','silver','star','crystal','clear','pure','hope',
        'dream','sing','dance','laugh','celebrate','wonder','beautiful',
        'luminous','incandescent','phosphorescent','iridescent','gleam'
      ],
      delta: { valence: 0.3, energy: 0, texture: 0, strangeness: 0 }
    },

    /* --- Energy: still (-) vs violent (+) --- */
    still_energy: {
      words: [
        'still','silence','quiet','hush','whisper','murmur','drift','float',
        'slow','gentle','soft','settle','linger','rest','sleep','calm',
        'peace','serene','tranquil','motionless','frozen','suspended','hover',
        'breathe','sigh','fade','dissolve','melt','seep','pool','gather'
      ],
      delta: { valence: 0, energy: -0.3, texture: 0, strangeness: 0 }
    },
    violent_energy: {
      words: [
        'crash','smash','shatter','explode','burst','erupt','tear','rip',
        'slash','strike','thunder','lightning','storm','rage','fury','violent',
        'fierce','wild','burn','blaze','fire','flame','scorch','devour',
        'scream','roar','howl','pound','hammer','grind','crush','collapse',
        'fracture','split','pierce','puncture','flood','torrent','avalanche'
      ],
      delta: { valence: 0, energy: 0.3, texture: 0, strangeness: 0 }
    },

    /* --- Texture: ethereal (-) vs visceral (+) --- */
    ethereal_texture: {
      words: [
        'dream','mist','fog','cloud','vapor','smoke','ghost','spirit',
        'echo','memory','thought','idea','absence','void','nothing','air',
        'wind','breath','whisper','shadow','reflection','illusion','mirage',
        'abstract','infinite','eternal','beyond','transcend','dissolve',
        'fade','vanish','evaporate','ethereal','gossamer','translucent'
      ],
      delta: { valence: 0, energy: 0, texture: -0.3, strangeness: 0 }
    },
    visceral_texture: {
      words: [
        'bone','blood','flesh','skin','tooth','tongue','eye','hand','finger',
        'skull','spine','rib','jaw','throat','lung','heart','gut','muscle',
        'tendon','marrow','cartilage','sinew','nail','hair','sweat','spit',
        'stone','iron','rust','dirt','mud','clay','root','bark','thorn',
        'salt','sand','gravel','concrete','brick','metal','wood','grain'
      ],
      delta: { valence: 0, energy: 0, texture: 0.3, strangeness: 0 }
    },

    /* --- Strangeness: grounded (-) vs surreal (+) --- */
    grounded_strangeness: {
      words: [
        'house','door','window','table','chair','floor','wall','road',
        'walk','sit','stand','eat','drink','work','day','year','morning',
        'water','bread','hand','face','name','town','garden','kitchen',
        'simple','plain','ordinary','common','familiar','usual','normal'
      ],
      delta: { valence: 0, energy: 0, texture: 0, strangeness: -0.2 }
    },
    surreal_strangeness: {
      words: [
        'clock-bleed','eye-clock','bone-flower','liquid','melting','glass',
        'velvet','smoke','wax','silk','fog','moth','rust','crystal','amber',
        'porcelain','mercury','impossible','inverted','backwards','upside-down',
        'inside-out','recursive','centrifugal','prismatic','gelatinous',
        'un-dream','liquefied','fossilized','alphabetical','subterranean',
        'kaleidoscope','labyrinth','paradox','riddle','enigma','chimera'
      ],
      delta: { valence: 0, energy: 0, texture: 0, strangeness: 0.3 }
    }
  };

  /* ================================================================
     HEURISTICS — punctuation, structure, patterns
     ================================================================ */

  function analyzeHeuristics(text) {
    var delta = { valence: 0, energy: 0, texture: 0, strangeness: 0 };
    var cleaned = text.toLowerCase();

    /* Punctuation density → energy */
    var exclamations = (cleaned.match(/!/g) || []).length;
    var questions = (cleaned.match(/\?/g) || []).length;
    var ellipses = (cleaned.match(/\.\.\./g) || []).length;
    var dashes = (cleaned.match(/—|--/g) || []).length;
    var caps = (text.match(/[A-Z]{2,}/g) || []).length;

    delta.energy += Math.min(exclamations * 0.15, 0.3);
    delta.energy += Math.min(caps * 0.1, 0.2);
    delta.energy -= Math.min(ellipses * 0.1, 0.2);
    delta.energy += Math.min(dashes * 0.05, 0.1);

    /* Compound words with hyphens → strangeness */
    var hyphenatedWords = (cleaned.match(/[a-z]+-[a-z]+/g) || []);
    delta.strangeness += Math.min(hyphenatedWords.length * 0.1, 0.3);

    /* Short lines → stillness; long lines → energy */
    var wordCount = cleaned.trim().split(/\s+/).length;
    if (wordCount <= 4) delta.energy -= 0.1;
    if (wordCount >= 10) delta.energy += 0.1;

    /* Questions → strangeness */
    delta.strangeness += Math.min(questions * 0.05, 0.1);

    return delta;
  }

  /* ================================================================
     TURN PHASE
     ================================================================ */
  var PHASE_MULTIPLIERS = {
    early: 0.3,   /* turns 1-2 */
    middle: 0.7,  /* turns 3-5 */
    late: 1.0     /* turns 6+ */
  };

  function getPhase(turnCount) {
    if (turnCount <= 2) return 'early';
    if (turnCount <= 5) return 'middle';
    return 'late';
  }

  function getPhaseMultiplier(turnCount) {
    return PHASE_MULTIPLIERS[getPhase(turnCount)];
  }

  /* ================================================================
     STATE
     ================================================================ */
  var profile = null;
  var turnCount = 0;

  /* Exponential smoothing alpha — how much new data influences the profile.
     Effective alpha = BASE_ALPHA * phaseMultiplier */
  var BASE_ALPHA = 0.4;

  function createNeutralProfile() {
    return { valence: 0, energy: 0, texture: 0, strangeness: 0 };
  }

  function clamp(val) {
    return Math.max(-1, Math.min(1, val));
  }

  /* ================================================================
     PUBLIC API
     ================================================================ */

  function init() {
    profile = createNeutralProfile();
    turnCount = 0;
  }

  /**
   * analyze(text) → mood delta object. Read-only, does not mutate profile.
   */
  function analyze(text) {
    var delta = { valence: 0, energy: 0, texture: 0, strangeness: 0 };
    var words = text.toLowerCase().replace(/[^a-z0-9\s'-]/g, '').trim().split(/\s+/).filter(Boolean);

    /* Word bank matching */
    var categories = Object.keys(MOOD_WORDS);
    for (var c = 0; c < categories.length; c++) {
      var cat = MOOD_WORDS[categories[c]];
      var matchCount = 0;
      for (var w = 0; w < words.length; w++) {
        if (cat.words.indexOf(words[w]) !== -1) {
          matchCount++;
        }
      }
      if (matchCount > 0) {
        /* Diminishing returns: first match counts full, subsequent less */
        var weight = 1 + (matchCount - 1) * 0.5;
        delta.valence += cat.delta.valence * weight;
        delta.energy += cat.delta.energy * weight;
        delta.texture += cat.delta.texture * weight;
        delta.strangeness += cat.delta.strangeness * weight;
      }
    }

    /* Also check for multi-word surreal compounds in the original text */
    var lowerText = text.toLowerCase();
    var surealPhrases = MOOD_WORDS.surreal_strangeness.words.filter(function (w) {
      return w.indexOf(' ') !== -1 || w.indexOf('-') !== -1;
    });
    for (var p = 0; p < surealPhrases.length; p++) {
      if (lowerText.indexOf(surealPhrases[p]) !== -1) {
        delta.strangeness += 0.15;
      }
    }

    /* Heuristic analysis */
    var hDelta = analyzeHeuristics(text);
    delta.valence += hDelta.valence;
    delta.energy += hDelta.energy;
    delta.texture += hDelta.texture;
    delta.strangeness += hDelta.strangeness;

    /* Clamp deltas to [-1, 1] */
    delta.valence = clamp(delta.valence);
    delta.energy = clamp(delta.energy);
    delta.texture = clamp(delta.texture);
    delta.strangeness = clamp(delta.strangeness);

    return delta;
  }

  /**
   * update(text) → analyzes text and blends into running profile.
   */
  function update(text) {
    turnCount++;
    var delta = analyze(text);
    var multiplier = getPhaseMultiplier(turnCount);
    var alpha = BASE_ALPHA * multiplier;

    profile.valence = clamp(profile.valence + delta.valence * alpha);
    profile.energy = clamp(profile.energy + delta.energy * alpha);
    profile.texture = clamp(profile.texture + delta.texture * alpha);
    profile.strangeness = clamp(profile.strangeness + delta.strangeness * alpha);

    return getProfile();
  }

  /**
   * getProfile() → current mood state snapshot.
   */
  function getProfile() {
    return {
      valence: profile.valence,
      energy: profile.energy,
      texture: profile.texture,
      strangeness: profile.strangeness,
      phase: getPhase(turnCount),
      turnCount: turnCount
    };
  }

  /**
   * getCSSProperties() → object of CSS custom property values.
   * Applied to document root to drive mood-reactive styles.
   */
  function getCSSProperties() {
    var p = profile;
    /* Map dimensions to visual properties */

    /* Valence → palette temperature */
    var bgHue = lerp(240, 35, (p.valence + 1) / 2);       /* 240 (cold blue) → 35 (warm gold) */
    var bgSat = lerp(30, 15, (p.valence + 1) / 2);         /* more saturated when dark */
    var accentR = lerp(60, 200, (p.valence + 1) / 2);      /* constructivist red intensity */
    var accentG = lerp(60, 80, (p.valence + 1) / 2);
    var accentB = lerp(100, 60, (p.valence + 1) / 2);
    var textGlow = lerp(0, 8, (p.valence + 1) / 2);        /* warm glow on text */

    /* Energy → transition speed and stroke weight */
    var transitionMs = lerp(1800, 350, (p.energy + 1) / 2); /* slow to fast */
    var strokeWidth = lerp(1, 4, (p.energy + 1) / 2);       /* thin to thick */
    var typewriterMs = lerp(55, 18, (p.energy + 1) / 2);    /* slow to fast per char */

    /* Texture → blur vs sharpness and grain */
    var blurAmount = lerp(2, 0, (p.texture + 1) / 2);      /* ethereal blur → sharp */
    var grainOpacity = lerp(0.02, 0.06, (p.texture + 1) / 2); /* light → heavy grain */
    var edgeSharpness = lerp(0, 1, (p.texture + 1) / 2);    /* 0=soft, 1=sharp */

    /* Strangeness → geometric distortion */
    var skewDeg = lerp(0, 3, (p.strangeness + 1) / 2);     /* rotation/skew */
    var spacingShift = lerp(0, 4, (p.strangeness + 1) / 2); /* letter-spacing drift */
    var diagonalAngle = lerp(0, 15, (p.strangeness + 1) / 2); /* constructivist diagonal angle */

    return {
      '--mood-bg-hue': bgHue.toFixed(0),
      '--mood-bg-sat': bgSat.toFixed(0) + '%',
      '--mood-accent-r': accentR.toFixed(0),
      '--mood-accent-g': accentG.toFixed(0),
      '--mood-accent-b': accentB.toFixed(0),
      '--mood-text-glow': textGlow.toFixed(1) + 'px',
      '--mood-transition-ms': transitionMs.toFixed(0) + 'ms',
      '--mood-stroke-width': strokeWidth.toFixed(1) + 'px',
      '--mood-typewriter-ms': typewriterMs.toFixed(0),
      '--mood-blur': blurAmount.toFixed(1) + 'px',
      '--mood-grain-opacity': grainOpacity.toFixed(3),
      '--mood-edge-sharpness': edgeSharpness.toFixed(2),
      '--mood-skew': skewDeg.toFixed(1) + 'deg',
      '--mood-spacing-shift': spacingShift.toFixed(1) + 'px',
      '--mood-diagonal': diagonalAngle.toFixed(1) + 'deg',
      '--mood-valence': p.valence.toFixed(2),
      '--mood-energy': p.energy.toFixed(2),
      '--mood-texture': p.texture.toFixed(2),
      '--mood-strangeness': p.strangeness.toFixed(2)
    };
  }

  /**
   * getPromptModifiers() → { systemPromptSuffix, wordBankWeights }
   */
  function getPromptModifiers() {
    var p = profile;

    /* Build tone descriptors */
    var tone = [];
    if (p.valence < -0.3) tone.push('dark', 'ominous');
    else if (p.valence > 0.3) tone.push('luminous', 'warm');

    if (p.energy < -0.3) tone.push('hushed', 'slow');
    else if (p.energy > 0.3) tone.push('fierce', 'explosive');

    if (p.texture < -0.3) tone.push('abstract', 'dissolving');
    else if (p.texture > 0.3) tone.push('bodily', 'concrete');

    if (p.strangeness > 0.3) tone.push('surreal', 'impossible');
    else if (p.strangeness < -0.3) tone.push('grounded', 'plain');

    /* Build vocabulary guidance */
    var vocab = [];
    if (p.texture > 0.2) vocab.push('Favor bodily, concrete imagery — bones, skin, teeth, roots, stone.');
    if (p.texture < -0.2) vocab.push('Favor abstract, ethereal imagery — mist, echoes, silence, absence.');
    if (p.energy < -0.2) vocab.push('Use short, quiet lines. Prefer stillness and pause.');
    if (p.energy > 0.2) vocab.push('Use dynamic, propulsive language. Favor action and impact.');
    if (p.strangeness > 0.3) vocab.push('Embrace surreal juxtapositions, compound neologisms, impossible imagery.');
    if (p.valence < -0.3) vocab.push('Lean into darkness — shadow, loss, void, decay.');
    if (p.valence > 0.3) vocab.push('Lean into warmth — light, bloom, radiance, tenderness.');

    var systemPromptSuffix = '';
    if (tone.length > 0) {
      systemPromptSuffix = '\n\nYour current tone is ' + tone.join(', ') + '.';
    }
    if (vocab.length > 0) {
      systemPromptSuffix += ' ' + vocab.join(' ');
    }

    /* Word bank weights for procedural fallback: { categoryName: weight } */
    var nounWeights = {
      concrete: 1.0,
      abstract: 1.0,
      surreal: 1.0,
      body: 1.0,
      nature: 1.0
    };
    var verbWeights = {
      action: 1.0,
      surreal: 1.0,
      quiet: 1.0
    };

    /* Adjust weights based on mood */
    if (p.texture > 0.2) { nounWeights.body += 1.5; nounWeights.nature += 1.0; }
    if (p.texture < -0.2) { nounWeights.abstract += 1.5; }
    if (p.strangeness > 0.2) { nounWeights.surreal += 2.0; verbWeights.surreal += 2.0; }
    if (p.strangeness < -0.2) { nounWeights.concrete += 1.5; }
    if (p.energy < -0.2) { verbWeights.quiet += 2.0; }
    if (p.energy > 0.2) { verbWeights.action += 2.0; }

    /* Strategy weights for procedural generation */
    var strategyWeights = {
      templateFill: 0.25,
      rhyme: 0.20,
      mutation: 0.20,
      echo: 0.15,
      nonSequitur: 0.20
    };
    if (p.strangeness > 0.3) {
      strategyWeights.nonSequitur += 0.15;
      strategyWeights.mutation += 0.10;
      strategyWeights.templateFill -= 0.15;
      strategyWeights.rhyme -= 0.10;
    } else if (p.strangeness < -0.3) {
      strategyWeights.templateFill += 0.15;
      strategyWeights.rhyme += 0.10;
      strategyWeights.nonSequitur -= 0.15;
      strategyWeights.mutation -= 0.10;
    }

    return {
      systemPromptSuffix: systemPromptSuffix,
      nounWeights: nounWeights,
      verbWeights: verbWeights,
      strategyWeights: strategyWeights
    };
  }

  /**
   * getRevealStyle() → { archetype, title, config }
   */
  function getRevealStyle() {
    var p = profile;

    /* Archetype selection decision tree */
    var archetype, title;
    if (p.strangeness > 0.5) {
      archetype = 'delirium';
      title = 'The Corpse Unravels';
    } else {
      var isDark = p.valence < 0;
      /* Combined energy+texture signal: average of both, < 0 = still/ethereal, >= 0 = energetic/visceral */
      var isStill = (p.energy + p.texture) / 2 < 0;

      if (isDark && isStill) {
        archetype = 'seance';
        title = 'The Corpse Whispers';
      } else if (isDark && !isStill) {
        archetype = 'eruption';
        title = 'The Corpse Screams';
      } else if (!isDark && isStill) {
        archetype = 'illumination';
        title = 'The Corpse Glows';
      } else {
        archetype = 'manifesto';
        title = 'The Corpse Declares';
      }
    }

    /* Parametric configuration interpolated from raw dimensions */
    /* All values 0-1 for easy use in CSS/JS */
    var config = {
      /* Timing */
      lineDelayMs: lerp(400, 80, (p.energy + 1) / 2),
      staggerMs: lerp(200, 50, (p.energy + 1) / 2),

      /* Motion */
      entryAngle: lerp(0, 25, (p.strangeness + 1) / 2),
      entryDistance: lerp(15, 60, (p.energy + 1) / 2),
      motionDirection: p.energy >= 0 ? 'diagonal' : 'vertical',

      /* Visual */
      blurStart: lerp(0, 8, Math.max(0, -p.texture)),
      opacityEasing: p.energy >= 0 ? 'ease-out' : 'ease-in-out',
      geometryIntensity: lerp(0.2, 1.0, (p.strangeness + 1) / 2),
      geometryAngle: lerp(0, 45, (p.strangeness + 1) / 2),

      /* Palette overrides for the reveal */
      warmth: (p.valence + 1) / 2,     /* 0=cold, 1=warm */
      intensity: (p.energy + 1) / 2,    /* 0=muted, 1=vivid */
      strangeness: p.strangeness         /* raw for cross-cutting modifier */
    };

    return {
      archetype: archetype,
      title: title,
      config: config
    };
  }

  /* ================================================================
     HELPERS
     ================================================================ */
  function lerp(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    return a + (b - a) * t;
  }

  /* Init on load */
  init();

  return {
    init: init,
    analyze: analyze,
    update: update,
    getProfile: getProfile,
    getCSSProperties: getCSSProperties,
    getPromptModifiers: getPromptModifiers,
    getRevealStyle: getRevealStyle
  };
})();
