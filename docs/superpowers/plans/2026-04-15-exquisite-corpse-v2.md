# Exquisite Corpse V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build V2 of the Exquisite Corpse app with a mood engine that drives an evolving AI voice, mood-reactive dreaming-machine atmosphere with constructivist aesthetics, contextual reveal, and shareable poem artifacts — all as a parallel `v2/` directory alongside the unchanged V1.

**Architecture:** CorpseMood is the central hub. On every text submission (user or app), it analyzes text and blends a mood delta into a running 4-dimension profile (valence, energy, texture, strangeness). All other modules read from it: the generator builds mood-aware prompts, the UI applies mood-derived CSS custom properties, the canvas draws mood-reactive geometric particles, the audio synthesizes mood-driven ambient sound, the reveal selects an archetype, and the artifact exporter captures the mood palette in standalone HTML/PNG files.

**Tech Stack:** Vanilla HTML/CSS/JS. IIFE pattern with global namespaces. Web Audio API for sound. Canvas API for background particles. No build tools, no dependencies, no npm.

**Design spec:** `docs/superpowers/specs/2026-04-15-exquisite-corpse-v2-design.md`

---

## File Map

### New files (create from scratch)
| File | Responsibility |
|------|---------------|
| `v2/index.html` | V2 entry point, loads all scripts in order |
| `v2/css/corpse.css` | Mood-reactive styles with CSS custom properties, constructivist elements |
| `v2/js/corpse-mood.js` | Mood engine: analyze text, blend profile, emit CSS properties and prompt modifiers |
| `v2/js/corpse-canvas.js` | Background canvas with drifting geometric shapes driven by mood |
| `v2/js/corpse-audio.js` | Opt-in Web Audio ambient layer driven by mood |
| `v2/js/corpse-reveal.js` | Parametric contextual reveal with 5 archetypes |
| `v2/js/corpse-artifact.js` | Standalone HTML and PNG export generation |
| `v2/test-mood.html` | In-browser test page for CorpseMood |

### Forked files (copy from V1, then modify)
| File | Source | Changes |
|------|--------|---------|
| `v2/js/corpse-generator.js` | `js/corpse-generator.js` | Add mood-aware system prompt builder, mood-weighted word bank selection |
| `v2/js/corpse-state.js` | `js/corpse-state.js` | Call `CorpseMood.update()` on every submission, include mood profile in snapshot |
| `v2/js/corpse-timer.js` | `js/corpse-timer.js` | Direct copy, no changes |
| `v2/js/corpse-export.js` | `js/corpse-export.js` | Add HTML artifact and PNG export buttons/handlers |
| `v2/js/corpse-ui.js` | `js/corpse-ui.js` | Constructivist turn indicators, mood-reactive fold/typewriter/thinking, delegate reveal to CorpseReveal |
| `v2/js/corpse-app.js` | `js/corpse-app.js` | Initialize mood/canvas/audio, apply CSS properties on state change, wire new export buttons |

---

## Task 1: V2 Directory Structure + Entry Point

**Files:**
- Create: `v2/index.html`
- Create: `v2/css/` (directory)
- Create: `v2/js/` (directory)

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p v2/css v2/js
```

- [ ] **Step 2: Create v2/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exquisite Corpse — V2</title>
  <link rel="stylesheet" href="css/corpse.css">
</head>
<body>
  <canvas id="bg-canvas"></canvas>
  <div id="corpse-app"></div>

  <!-- Load order matters: mood first (hub), then consumers -->
  <script src="js/corpse-mood.js"></script>
  <script src="js/corpse-generator.js"></script>
  <script src="js/corpse-state.js"></script>
  <script src="js/corpse-timer.js"></script>
  <script src="js/corpse-canvas.js"></script>
  <script src="js/corpse-audio.js"></script>
  <script src="js/corpse-reveal.js"></script>
  <script src="js/corpse-artifact.js"></script>
  <script src="js/corpse-export.js"></script>
  <script src="js/corpse-ui.js"></script>
  <script src="js/corpse-app.js"></script>
</body>
</html>
```

- [ ] **Step 3: Copy timer (unchanged)**

```bash
cp js/corpse-timer.js v2/js/corpse-timer.js
```

- [ ] **Step 4: Commit**

```bash
git add v2/index.html v2/js/corpse-timer.js
git commit -m "feat(v2): scaffold directory structure and entry point"
```

---

## Task 2: Mood Engine — CorpseMood

The central hub. Must be fully working and testable before any other V2 module.

**Files:**
- Create: `v2/js/corpse-mood.js`

- [ ] **Step 1: Create v2/js/corpse-mood.js**

```javascript
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
```

- [ ] **Step 2: Commit**

```bash
git add v2/js/corpse-mood.js
git commit -m "feat(v2): add CorpseMood engine with analysis, blending, CSS properties, and reveal style"
```

---

## Task 3: Mood Engine Tests

In-browser test page to verify CorpseMood in isolation.

**Files:**
- Create: `v2/test-mood.html`

- [ ] **Step 1: Create v2/test-mood.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CorpseMood — Tests</title>
  <style>
    body { font-family: monospace; background: #111; color: #ddd; padding: 20px; }
    .pass { color: #4a9; }
    .fail { color: #c44; font-weight: bold; }
    h2 { color: #c9a84c; margin-top: 24px; }
    pre { background: #1a1a1a; padding: 8px; border-radius: 4px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>CorpseMood Tests</h1>
  <div id="results"></div>
  <script src="js/corpse-mood.js"></script>
  <script>
  (function () {
    var results = document.getElementById('results');
    var passed = 0;
    var failed = 0;

    function assert(condition, msg) {
      if (condition) {
        passed++;
        results.innerHTML += '<div class="pass">✓ ' + msg + '</div>';
      } else {
        failed++;
        results.innerHTML += '<div class="fail">✗ ' + msg + '</div>';
      }
    }

    function assertInRange(val, min, max, msg) {
      assert(val >= min && val <= max, msg + ' (got ' + val.toFixed(3) + ', expected ' + min + ' to ' + max + ')');
    }

    function section(name) {
      results.innerHTML += '<h2>' + name + '</h2>';
    }

    /* ---- init ---- */
    section('init()');
    CorpseMood.init();
    var p = CorpseMood.getProfile();
    assert(p.valence === 0, 'Initial valence is 0');
    assert(p.energy === 0, 'Initial energy is 0');
    assert(p.texture === 0, 'Initial texture is 0');
    assert(p.strangeness === 0, 'Initial strangeness is 0');
    assert(p.phase === 'early', 'Initial phase is early');
    assert(p.turnCount === 0, 'Initial turnCount is 0');

    /* ---- analyze (read-only) ---- */
    section('analyze() — read-only');
    CorpseMood.init();
    var delta = CorpseMood.analyze('the skull bleeds darkness into the void');
    assert(delta.valence < 0, 'Dark text gives negative valence');
    var pAfter = CorpseMood.getProfile();
    assert(pAfter.valence === 0, 'analyze() does not mutate profile');

    /* ---- update (mutates) ---- */
    section('update() — mutates profile');
    CorpseMood.init();
    CorpseMood.update('the skull bleeds darkness into the void');
    var p2 = CorpseMood.getProfile();
    assert(p2.valence < 0, 'Dark text pushes valence negative');
    assert(p2.turnCount === 1, 'turnCount incremented');

    /* ---- dark text ---- */
    section('Dark text analysis');
    CorpseMood.init();
    var d = CorpseMood.analyze('death and shadow haunt the grave of sorrow');
    assert(d.valence < -0.2, 'Heavy dark words give strong negative valence: ' + d.valence.toFixed(3));

    /* ---- light text ---- */
    section('Light text analysis');
    CorpseMood.init();
    d = CorpseMood.analyze('golden light blooms in the warm garden of joy');
    assert(d.valence > 0.2, 'Light words give positive valence: ' + d.valence.toFixed(3));

    /* ---- energy: still ---- */
    section('Still energy');
    d = CorpseMood.analyze('silence drifts and settles in the quiet hush');
    assert(d.energy < -0.2, 'Quiet words give negative energy: ' + d.energy.toFixed(3));

    /* ---- energy: violent ---- */
    section('Violent energy');
    d = CorpseMood.analyze('the storm crashes and shatters EVERYTHING!!!');
    assert(d.energy > 0.2, 'Violent words + exclamation give positive energy: ' + d.energy.toFixed(3));

    /* ---- texture: visceral ---- */
    section('Visceral texture');
    d = CorpseMood.analyze('bone and blood and tooth and spine and stone');
    assert(d.texture > 0.2, 'Body words give positive texture: ' + d.texture.toFixed(3));

    /* ---- texture: ethereal ---- */
    section('Ethereal texture');
    d = CorpseMood.analyze('the dream fades like mist and memory dissolves into absence');
    assert(d.texture < -0.2, 'Ethereal words give negative texture: ' + d.texture.toFixed(3));

    /* ---- strangeness: surreal ---- */
    section('Surreal strangeness');
    d = CorpseMood.analyze('the eye-clock melts into kaleidoscope paradox');
    assert(d.strangeness > 0.2, 'Surreal words give positive strangeness: ' + d.strangeness.toFixed(3));

    /* ---- phase multiplier ---- */
    section('Phase multiplier');
    CorpseMood.init();
    CorpseMood.update('death death death dark shadow void');
    var earlyVal = CorpseMood.getProfile().valence;
    CorpseMood.init();
    /* Simulate 5 neutral turns then a dark turn */
    CorpseMood.update('word'); CorpseMood.update('word'); CorpseMood.update('word');
    CorpseMood.update('word'); CorpseMood.update('word');
    CorpseMood.update('death death death dark shadow void');
    var lateVal = CorpseMood.getProfile().valence;
    assert(Math.abs(lateVal) > Math.abs(earlyVal), 'Late-phase shift is stronger than early-phase (' + lateVal.toFixed(3) + ' vs ' + earlyVal.toFixed(3) + ')');

    /* ---- getCSSProperties ---- */
    section('getCSSProperties()');
    CorpseMood.init();
    CorpseMood.update('death and shadow');
    var css = CorpseMood.getCSSProperties();
    assert(typeof css['--mood-bg-hue'] === 'string', 'Returns --mood-bg-hue');
    assert(typeof css['--mood-transition-ms'] === 'string', 'Returns --mood-transition-ms');
    assert(typeof css['--mood-valence'] === 'string', 'Returns --mood-valence');

    /* ---- getPromptModifiers ---- */
    section('getPromptModifiers()');
    CorpseMood.init();
    CorpseMood.update('death shadow dark void');
    CorpseMood.update('death shadow dark void');
    CorpseMood.update('death shadow dark void');
    var mods = CorpseMood.getPromptModifiers();
    assert(mods.systemPromptSuffix.length > 0, 'Has system prompt suffix');
    assert(typeof mods.nounWeights === 'object', 'Has noun weights');
    assert(typeof mods.strategyWeights === 'object', 'Has strategy weights');

    /* ---- getRevealStyle ---- */
    section('getRevealStyle()');

    /* Séance: dark + still + ethereal */
    CorpseMood.init();
    for (var i = 0; i < 6; i++) CorpseMood.update('silence shadow ghost mist whisper death fade');
    var reveal = CorpseMood.getRevealStyle();
    assert(reveal.archetype === 'seance', 'Dark+still+ethereal → séance (got ' + reveal.archetype + ')');
    assert(reveal.title === 'The Corpse Whispers', 'Séance title');

    /* Eruption: dark + energetic + visceral */
    CorpseMood.init();
    for (var j = 0; j < 6; j++) CorpseMood.update('blood crash bone shatter skull thunder slash!!');
    reveal = CorpseMood.getRevealStyle();
    assert(reveal.archetype === 'eruption', 'Dark+energetic+visceral → eruption (got ' + reveal.archetype + ')');

    /* Illumination: light + still + ethereal */
    CorpseMood.init();
    for (var k = 0; k < 6; k++) CorpseMood.update('golden light gentle dream soft glow warm silence');
    reveal = CorpseMood.getRevealStyle();
    assert(reveal.archetype === 'illumination', 'Light+still+ethereal → illumination (got ' + reveal.archetype + ')');

    /* Manifesto: light + energetic + visceral */
    CorpseMood.init();
    for (var m = 0; m < 6; m++) CorpseMood.update('bright fire blaze stone iron thunder roar golden!');
    reveal = CorpseMood.getRevealStyle();
    assert(reveal.archetype === 'manifesto', 'Light+energetic+visceral → manifesto (got ' + reveal.archetype + ')');

    /* Delirium: high strangeness */
    CorpseMood.init();
    for (var n = 0; n < 6; n++) CorpseMood.update('eye-clock bone-flower kaleidoscope labyrinth un-dream paradox impossible');
    reveal = CorpseMood.getRevealStyle();
    assert(reveal.archetype === 'delirium', 'High strangeness → delirium (got ' + reveal.archetype + ')');

    /* ---- Summary ---- */
    results.innerHTML += '<h2>Summary: ' + passed + ' passed, ' + failed + ' failed</h2>';
    if (failed === 0) {
      results.innerHTML += '<div class="pass" style="font-size:18px;">All tests passed!</div>';
    }
  })();
  </script>
</body>
</html>
```

- [ ] **Step 2: Open test page and verify all tests pass**

Run: Open `v2/test-mood.html` in a browser.
Expected: All assertions pass. Green checkmarks for every test. "All tests passed!" at the bottom.

If any tests fail, adjust the mood word banks or delta values in `corpse-mood.js` until they pass. The word banks may need tuning to produce strong enough signals for the test inputs.

- [ ] **Step 3: Commit**

```bash
git add v2/test-mood.html
git commit -m "test(v2): add in-browser test page for CorpseMood engine"
```

---

## Task 4: Fork CorpseGenerator — Mood-Aware Voice

**Files:**
- Create: `v2/js/corpse-generator.js` (copy from `js/corpse-generator.js`, then modify)

- [ ] **Step 1: Copy V1 generator**

```bash
cp js/corpse-generator.js v2/js/corpse-generator.js
```

- [ ] **Step 2: Add mood-weighted word bank selection**

In `v2/js/corpse-generator.js`, replace the `pickFrom` function and add a new `pickFromWeighted` function. Find this code:

```javascript
  function pickFrom(category) {
    var keys = Object.keys(category);
    var pool = category[pick(keys)];
    return pick(pool);
  }

  function pickNoun() { return pickFrom(NOUNS); }
  function pickVerb() { return pickFrom(VERBS); }
  function pickAdj() { return pickFrom(ADJECTIVES); }
```

Replace with:

```javascript
  function pickFrom(category) {
    var keys = Object.keys(category);
    var pool = category[pick(keys)];
    return pick(pool);
  }

  function pickFromWeighted(category, weights) {
    if (!weights) return pickFrom(category);
    var keys = Object.keys(category);
    var totalWeight = 0;
    for (var i = 0; i < keys.length; i++) {
      totalWeight += (weights[keys[i]] || 1.0);
    }
    var roll = Math.random() * totalWeight;
    var cumulative = 0;
    for (var j = 0; j < keys.length; j++) {
      cumulative += (weights[keys[j]] || 1.0);
      if (roll <= cumulative) {
        return pick(category[keys[j]]);
      }
    }
    return pickFrom(category);
  }

  function pickNoun() {
    var mods = (typeof CorpseMood !== 'undefined') ? CorpseMood.getPromptModifiers() : null;
    return pickFromWeighted(NOUNS, mods ? mods.nounWeights : null);
  }
  function pickVerb() {
    var mods = (typeof CorpseMood !== 'undefined') ? CorpseMood.getPromptModifiers() : null;
    return pickFromWeighted(VERBS, mods ? mods.verbWeights : null);
  }
  function pickAdj() { return pickFrom(ADJECTIVES); }
```

- [ ] **Step 3: Add mood-weighted strategy selection**

In `v2/js/corpse-generator.js`, find the `generateLine` function and replace it:

```javascript
  function generateLine(analysis, driftBias) {
    var roll = Math.random();

    /* Get mood-driven strategy weights if available */
    var sw;
    if (typeof CorpseMood !== 'undefined') {
      sw = CorpseMood.getPromptModifiers().strategyWeights;
    } else {
      sw = { templateFill: 0.25, rhyme: 0.20, mutation: 0.20, echo: 0.15, nonSequitur: 0.20 };
    }

    /* Apply drift bias */
    if (driftBias) {
      sw = {
        templateFill: sw.templateFill * 0.5,
        rhyme: sw.rhyme * 0.5,
        mutation: sw.mutation,
        echo: sw.echo,
        nonSequitur: sw.nonSequitur * 1.5
      };
    }

    /* Normalize */
    var total = sw.templateFill + sw.rhyme + sw.mutation + sw.echo + sw.nonSequitur;

    var line;
    var cumulative = 0;
    cumulative += sw.templateFill / total;
    if (roll < cumulative) { line = strategyTemplateFill(analysis); }
    else { cumulative += sw.rhyme / total; }
    if (!line && roll < cumulative) { line = strategyRhyme(analysis); }
    else if (!line) { cumulative += sw.mutation / total; }
    if (!line && roll < cumulative) { line = strategyMutation(analysis); }
    else if (!line) { cumulative += sw.echo / total; }
    if (!line && roll < cumulative) { line = strategySyntacticEcho(analysis); }
    if (!line) { line = strategyNonSequitur(); }

    return line;
  }
```

- [ ] **Step 4: Add mood-aware Claude prompt**

In `v2/js/corpse-generator.js`, find the `generateWithClaude` function and replace the `system` string in the `body: JSON.stringify(...)` call:

```javascript
  function generateWithClaude(foundational) {
    var apiKey = getApiKey();
    if (!apiKey) return Promise.reject(new Error('No API key'));

    var baseSystemPrompt = 'You are a surrealist poet channeling automatic writing. You respond ONLY with exactly 2 lines of poetry, nothing else. No numbering, no labels, no explanation — just 2 lines separated by a newline. Your writing is free-associative, dreamlike, unexpected. You may use rhyme, assonance, semantic drift, made-up words, compound neologisms, sensory collisions. Stay true to the surrealist ethos: the flow of unconscious thought, startling juxtapositions, imagery that bypasses reason. Each line should be 3-12 words.';

    /* Append mood modifiers if available */
    var systemPrompt = baseSystemPrompt;
    if (typeof CorpseMood !== 'undefined') {
      systemPrompt += CorpseMood.getPromptModifiers().systemPromptSuffix;
    }

    return fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: 'Continue from this line (do NOT repeat it, just write the next 2 lines):\n\n"' + foundational + '"'
        }]
      })
    })
    .then(function (res) {
      if (!res.ok) throw new Error('API error: ' + res.status);
      return res.json();
    })
    .then(function (data) {
      var text = data.content && data.content[0] && data.content[0].text;
      if (!text) throw new Error('Empty response');
      var lines = text.trim().split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      if (lines.length < 2) throw new Error('Not enough lines');
      return [lines[0], lines[1]];
    });
  }
```

- [ ] **Step 5: Commit**

```bash
git add v2/js/corpse-generator.js
git commit -m "feat(v2): fork generator with mood-weighted word banks and dynamic Claude prompts"
```

---

## Task 5: Fork CorpseState — Mood Integration

**Files:**
- Create: `v2/js/corpse-state.js` (copy from `js/corpse-state.js`, then modify)

- [ ] **Step 1: Copy V1 state**

```bash
cp js/corpse-state.js v2/js/corpse-state.js
```

- [ ] **Step 2: Add mood updates on submission**

In `v2/js/corpse-state.js`, find the `submitUserLines` function and add mood update after successful validation. Replace:

```javascript
  function submitUserLines(lines) {
    var isFirst = state.turnNumber === 1;
    var errors = validateLines(lines, isFirst);
    if (errors.length > 0) return { ok: false, errors: errors };

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
```

With:

```javascript
  function submitUserLines(lines) {
    var isFirst = state.turnNumber === 1;
    var errors = validateLines(lines, isFirst);
    if (errors.length > 0) return { ok: false, errors: errors };

    if (isFirst) {
      state.currentLines = lines.slice();
    } else {
      /* prepend the foundational as line 1 */
      state.currentLines = [state.foundational].concat(lines);
    }

    /* Update mood with user text */
    if (typeof CorpseMood !== 'undefined') {
      CorpseMood.update(lines.join(' '));
    }

    state.phase = PHASES.FOLDING;
    notify();
    return { ok: true, errors: [] };
  }
```

- [ ] **Step 3: Add mood update for app lines**

In `v2/js/corpse-state.js`, replace `submitAppLines`:

```javascript
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
```

- [ ] **Step 4: Add mood profile to snapshot**

In `v2/js/corpse-state.js`, add mood profile to the `snapshot()` function. Find the return statement in `snapshot()` and add the `moodProfile` field:

```javascript
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
```

- [ ] **Step 5: Reset mood on init**

In `v2/js/corpse-state.js`, add `CorpseMood.init()` to the `init` function. Find:

```javascript
  function init(options) {
    state = createFreshState();
```

Replace with:

```javascript
  function init(options) {
    state = createFreshState();
    if (typeof CorpseMood !== 'undefined') {
      CorpseMood.init();
    }
```

- [ ] **Step 6: Commit**

```bash
git add v2/js/corpse-state.js
git commit -m "feat(v2): fork state with mood updates on every submission"
```

---

## Task 6: V2 CSS — Mood-Reactive Styles

**Files:**
- Create: `v2/css/corpse.css`

- [ ] **Step 1: Copy V1 CSS as starting point, then heavily modify**

```bash
cp css/corpse.css v2/css/corpse.css
```

- [ ] **Step 2: Add mood CSS custom properties to :root**

In `v2/css/corpse.css`, replace the existing `:root` block with:

```css
:root {
  /* V1 base palette (defaults before mood kicks in) */
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-card: #16161f;
  --text-primary: #e8dcc8;
  --text-secondary: #9a8e7a;
  --text-muted: #5a5347;
  --accent-gold: #c9a84c;
  --accent-gold-dim: rgba(201, 168, 76, 0.15);
  --accent-violet: #8b6abf;
  --accent-violet-dim: rgba(139, 106, 191, 0.12);
  --accent-red: #8b1a1a;
  --accent-red-bright: #c44;
  --font-display: 'Georgia', 'Times New Roman', serif;
  --font-body: 'Courier New', 'Courier', monospace;
  --max-width: 640px;
  --fold-duration: 0.8s;
  --fold-ease: cubic-bezier(0.4, 0, 0.2, 1);

  /* Mood-driven properties (set by JS, CSS uses these) */
  --mood-bg-hue: 240;
  --mood-bg-sat: 20%;
  --mood-accent-r: 130;
  --mood-accent-g: 70;
  --mood-accent-b: 80;
  --mood-text-glow: 0px;
  --mood-transition-ms: 800ms;
  --mood-stroke-width: 1.5px;
  --mood-typewriter-ms: 30;
  --mood-blur: 0px;
  --mood-grain-opacity: 0.03;
  --mood-edge-sharpness: 0.5;
  --mood-skew: 0deg;
  --mood-spacing-shift: 0px;
  --mood-diagonal: 0deg;
  --mood-valence: 0;
  --mood-energy: 0;
  --mood-texture: 0;
  --mood-strangeness: 0;
}
```

- [ ] **Step 3: Add mood-reactive background**

In `v2/css/corpse.css`, replace the `body::after` grain overlay with:

```css
/* Mood-reactive background tint */
body {
  background: hsl(var(--mood-bg-hue), var(--mood-bg-sat), 5%);
  transition: background 2s ease;
}

/* Background grain — intensity driven by mood texture */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: var(--mood-grain-opacity);
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 256px 256px;
  transition: opacity 2s ease;
}
```

- [ ] **Step 4: Add background canvas styling**

In `v2/css/corpse.css`, add after the `body::after` block:

```css
/* Background canvas for geometric particles */
#bg-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  opacity: 0.08;
  transition: opacity 2s ease;
}

#corpse-app {
  position: relative;
  z-index: 1;
}
```

- [ ] **Step 5: Add constructivist turn indicator styles**

In `v2/css/corpse.css`, replace the `.turn-indicator` rule with:

```css
.turn-indicator {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-weight: 700;
  min-height: 24px;
  position: relative;
  display: inline-block;
  padding: 2px 12px;
  transform: skewX(calc(var(--mood-skew) * -1));
  transition: transform var(--mood-transition-ms) ease, color var(--mood-transition-ms) ease;
}
.turn-indicator::before {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: var(--mood-stroke-width);
  background: rgb(var(--mood-accent-r), var(--mood-accent-g), var(--mood-accent-b));
  transform: rotate(var(--mood-diagonal));
  transform-origin: left center;
  transition: height var(--mood-transition-ms) ease, background var(--mood-transition-ms) ease, transform var(--mood-transition-ms) ease;
}
```

- [ ] **Step 6: Add constructivist foundational line frame**

In `v2/css/corpse.css`, replace the `.line-foundational` rule with:

```css
.line-foundational {
  width: 100%;
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  padding: 12px 16px;
  color: var(--accent-gold);
  border: none;
  background: var(--accent-gold-dim);
  position: relative;
  word-wrap: break-word;
  text-shadow: 0 0 var(--mood-text-glow) rgba(201, 168, 76, 0.3);
  transition: text-shadow var(--mood-transition-ms) ease;
}
/* Constructivist bracket frame */
.line-foundational::before,
.line-foundational::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: rgb(var(--mood-accent-r), var(--mood-accent-g), var(--mood-accent-b));
  border-style: solid;
  transition: border-color var(--mood-transition-ms) ease, transform var(--mood-transition-ms) ease;
}
.line-foundational::before {
  top: -4px;
  left: -4px;
  border-width: var(--mood-stroke-width) 0 0 var(--mood-stroke-width);
  transform: rotate(calc(var(--mood-diagonal) * -0.5));
}
.line-foundational::after {
  bottom: -4px;
  right: -4px;
  border-width: 0 var(--mood-stroke-width) var(--mood-stroke-width) 0;
  transform: rotate(calc(var(--mood-diagonal) * 0.5));
}
```

- [ ] **Step 7: Add mood-reactive fold animation timing**

In `v2/css/corpse.css`, update the `.line-slot` transition to use mood timing:

```css
.line-slot {
  position: relative;
  transform-origin: bottom center;
  transition:
    transform var(--mood-transition-ms) var(--fold-ease),
    opacity calc(var(--mood-transition-ms) * 0.75) ease-out,
    max-height 0.4s ease-out calc(var(--mood-transition-ms) * 0.75),
    margin 0.4s ease-out calc(var(--mood-transition-ms) * 0.75),
    padding 0.4s ease-out calc(var(--mood-transition-ms) * 0.75);
  perspective: 800px;
}

.line-slot.folding {
  transform: perspective(800px) rotateX(-90deg) skewX(var(--mood-skew));
  opacity: 0;
  max-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden;
}
```

- [ ] **Step 8: Add fold divider marks**

In `v2/css/corpse.css`, add after the `.line-slot.folding` rule:

```css
/* Fold divider — geometric mark left behind after folding */
.fold-divider {
  height: 0;
  position: relative;
  margin: 4px 0;
}
.fold-divider::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  width: 40px;
  height: var(--mood-stroke-width);
  background: rgb(var(--mood-accent-r), var(--mood-accent-g), var(--mood-accent-b));
  opacity: 0.3;
  transform: translateX(-50%) rotate(var(--mood-diagonal));
  transition: all var(--mood-transition-ms) ease;
}
```

- [ ] **Step 9: Add mood-reactive thinking state**

In `v2/css/corpse.css`, replace the `.thinking` and `.thinking-dots` rules with:

```css
.thinking {
  text-align: center;
  padding: 30px 0;
  color: var(--text-muted);
  font-style: italic;
  font-size: 14px;
  letter-spacing: 2px;
  filter: blur(var(--mood-blur));
  transition: filter var(--mood-transition-ms) ease;
}
/* Geometric thinking shapes */
.thinking-shapes {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
}
.thinking-shape {
  width: 12px;
  height: 12px;
  border: var(--mood-stroke-width) solid rgb(var(--mood-accent-r), var(--mood-accent-g), var(--mood-accent-b));
  opacity: 0.5;
  animation: shapeRotate 2s ease-in-out infinite;
}
.thinking-shape:nth-child(1) { border-radius: 50%; }
.thinking-shape:nth-child(2) {
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  animation-delay: 0.3s;
}
.thinking-shape:nth-child(3) { animation-delay: 0.6s; }

@keyframes shapeRotate {
  0%, 100% { transform: rotate(0deg) scale(1); opacity: 0.3; }
  50% { transform: rotate(180deg) scale(1.2); opacity: 0.8; }
}
```

- [ ] **Step 10: Add reveal overlay mood-reactive styles**

In `v2/css/corpse.css`, keep the existing `.reveal-overlay` rules but add mood-reactive enhancements to the reveal lines:

```css
.reveal-line {
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.7;
  padding: 6px 0;
  opacity: 0;
  transform: translateY(15px) rotate(0deg);
  transition: all 0.5s var(--fold-ease);
  letter-spacing: calc(1px + var(--mood-spacing-shift));
}
.reveal-line.visible {
  opacity: 1;
  transform: translateY(0) rotate(0deg);
}
.reveal-line.author-user {
  color: var(--text-primary);
  text-shadow: 0 0 var(--mood-text-glow) rgba(232, 220, 200, 0.2);
}
.reveal-line.author-app {
  color: var(--accent-violet);
  text-shadow: 0 0 var(--mood-text-glow) rgba(139, 106, 191, 0.2);
}

/* Constructivist turn separator for reveal */
.reveal-turn-separator {
  font-size: 10px;
  color: rgb(var(--mood-accent-r), var(--mood-accent-g), var(--mood-accent-b));
  letter-spacing: 3px;
  text-transform: uppercase;
  font-weight: 700;
  padding: 16px 0 4px;
  opacity: 0;
  transition: opacity 0.5s ease;
  position: relative;
  padding-left: 24px;
}
.reveal-turn-separator::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 16px;
  height: var(--mood-stroke-width);
  background: rgb(var(--mood-accent-r), var(--mood-accent-g), var(--mood-accent-b));
  transform: rotate(var(--mood-diagonal));
}
.reveal-turn-separator.visible {
  opacity: 1;
}
```

- [ ] **Step 11: Add audio toggle to settings**

In `v2/css/corpse.css`, add at the end of the settings section:

```css
/* Audio toggle */
.audio-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--text-muted);
}
```

- [ ] **Step 12: Commit**

```bash
git add v2/css/corpse.css
git commit -m "feat(v2): mood-reactive CSS with constructivist elements and custom properties"
```

---

## Task 7: Background Canvas — CorpseCanvas

**Files:**
- Create: `v2/js/corpse-canvas.js`

- [ ] **Step 1: Create v2/js/corpse-canvas.js**

```javascript
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
      vy: (Math.random() - 0.5) * 0.2 - 0.1, /* slight upward drift */
      size: 4 + Math.random() * 16,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.01,
      opacity: 0.1 + Math.random() * 0.3,
      life: 0,
      maxLife: 600 + Math.random() * 600 /* frames */
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

    /* Get mood if available */
    var mood = (typeof CorpseMood !== 'undefined') ? CorpseMood.getProfile() : { valence: 0, energy: 0, texture: 0, strangeness: 0 };

    /* Mood affects color, speed, density */
    var r = lerp(100, 200, (mood.valence + 1) / 2);
    var g = lerp(80, 160, (mood.valence + 1) / 2);
    var b = lerp(160, 80, (mood.valence + 1) / 2);
    var speedMult = lerp(0.3, 1.5, (mood.energy + 1) / 2);
    var skewAmount = lerp(0, 0.05, (mood.strangeness + 1) / 2);

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.life++;

      /* Replace dead particles */
      if (p.life > p.maxLife || p.y < -50 || p.y > canvas.height + 50 || p.x < -50 || p.x > canvas.width + 50) {
        particles[i] = createParticle();
        continue;
      }

      /* Move */
      p.x += p.vx * speedMult;
      p.y += p.vy * speedMult;
      p.rotation += p.rotationSpeed * speedMult;

      /* Strangeness adds wobble */
      p.x += Math.sin(p.life * 0.02) * skewAmount * 2;

      /* Fade in/out at edges of life */
      var fadeIn = Math.min(p.life / 60, 1);
      var fadeOut = Math.min((p.maxLife - p.life) / 60, 1);
      var alpha = p.opacity * fadeIn * fadeOut;

      /* Draw */
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
```

- [ ] **Step 2: Commit**

```bash
git add v2/js/corpse-canvas.js
git commit -m "feat(v2): add CorpseCanvas with mood-reactive geometric particles"
```

---

## Task 8: Audio Layer — CorpseAudio

**Files:**
- Create: `v2/js/corpse-audio.js`

- [ ] **Step 1: Create v2/js/corpse-audio.js**

```javascript
/* ===== CorpseAudio — Opt-in Web Audio Ambient Layer ===== */
var CorpseAudio = (function () {
  'use strict';

  var audioCtx = null;
  var masterGain = null;
  var oscillators = [];
  var noiseNode = null;
  var isPlaying = false;
  var updateInterval = null;

  /* Base frequencies for ambient drone (C minor-ish) */
  var BASE_FREQS = [65.41, 77.78, 98.00, 130.81]; /* C2, Eb2, G2, C3 */

  function init() {
    /* Don't create context until user opts in */
  }

  function start() {
    if (isPlaying) return;

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return; /* Web Audio not supported */
    }

    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.08; /* Very quiet */
    masterGain.connect(audioCtx.destination);

    /* Create oscillators */
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

    /* Noise generator for texture */
    createNoise();

    isPlaying = true;

    /* Update audio parameters based on mood every 2 seconds */
    updateInterval = setInterval(updateFromMood, 2000);
    updateFromMood(); /* Initial update */
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
    var rampTime = 2.0; /* Smooth 2-second transitions */

    /* Valence → interval quality (detune oscillators) */
    /* Negative valence → minor/dissonant intervals */
    /* Positive valence → major/consonant intervals */
    var detuneAmount = lerp(-30, 30, (mood.valence + 1) / 2); /* cents */
    for (var i = 0; i < oscillators.length; i++) {
      var detune = (i % 2 === 0) ? detuneAmount : -detuneAmount * 0.5;
      oscillators[i].osc.detune.linearRampToValueAtTime(detune, now + rampTime);
    }

    /* Energy → density (oscillator gains) */
    var oscLevel = lerp(0.1, 0.4, (mood.energy + 1) / 2);
    for (var j = 0; j < oscillators.length; j++) {
      oscillators[j].gain.gain.linearRampToValueAtTime(oscLevel, now + rampTime);
    }

    /* Texture → noise filter (reverb-like wash vs dry clicks) */
    if (noiseNode) {
      var noiseFreq = lerp(100, 2000, (mood.texture + 1) / 2);
      var noiseLevel = lerp(0.08, 0.02, (mood.texture + 1) / 2);
      noiseNode.filter.frequency.linearRampToValueAtTime(noiseFreq, now + rampTime);
      noiseNode.gain.gain.linearRampToValueAtTime(noiseLevel, now + rampTime);
    }

    /* Strangeness → frequency drift */
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
```

- [ ] **Step 2: Commit**

```bash
git add v2/js/corpse-audio.js
git commit -m "feat(v2): add CorpseAudio with mood-reactive Web Audio ambient layer"
```

---

## Task 9: Contextual Reveal — CorpseReveal

**Files:**
- Create: `v2/js/corpse-reveal.js`

- [ ] **Step 1: Create v2/js/corpse-reveal.js**

```javascript
/* ===== CorpseReveal — Parametric Contextual Reveal ===== */
var CorpseReveal = (function () {
  'use strict';

  /**
   * render(containerEl, allLines, revealStyle) → void
   * Builds the reveal DOM and animates it according to the archetype config.
   *
   * revealStyle comes from CorpseMood.getRevealStyle():
   *   { archetype, title, config: { lineDelayMs, staggerMs, entryAngle, entryDistance, ... } }
   */
  function render(containerEl, allLines, revealStyle) {
    containerEl.innerHTML = '';

    var config = revealStyle.config;
    var archetype = revealStyle.archetype;

    /* Build title */
    var titleEl = document.createElement('div');
    titleEl.className = 'reveal-title reveal-title--' + archetype;
    titleEl.textContent = revealStyle.title;
    containerEl.appendChild(titleEl);

    /* Build poem scroll container */
    var scrollEl = document.createElement('div');
    scrollEl.className = 'poem-scroll';
    containerEl.appendChild(scrollEl);

    /* Build lines */
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

      /* Set initial transform based on archetype config */
      var angle = config.entryAngle * (Math.random() > 0.5 ? 1 : -1);
      var distance = config.entryDistance;
      var blurStart = config.blurStart || 0;

      /* Delirium: randomize per-line */
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

    /* Staggered reveal animation */
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

    /* Return total animation duration for caller to know when to show export controls */
    return 200 + items.length * config.staggerMs + config.lineDelayMs;
  }

  /**
   * getThinkingText(mood) → string
   * Returns mood-appropriate thinking state message.
   */
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
```

- [ ] **Step 2: Commit**

```bash
git add v2/js/corpse-reveal.js
git commit -m "feat(v2): add CorpseReveal with parametric contextual reveal and 5 archetypes"
```

---

## Task 10: Shareable Artifacts — CorpseArtifact

**Files:**
- Create: `v2/js/corpse-artifact.js`

- [ ] **Step 1: Create v2/js/corpse-artifact.js**

```javascript
/* ===== CorpseArtifact — Standalone HTML & PNG Export ===== */
var CorpseArtifact = (function () {
  'use strict';

  /**
   * generateHTML(allLines, revealStyle) → string
   * Returns a complete self-contained HTML document as a string.
   */
  function generateHTML(allLines, revealStyle) {
    var config = revealStyle.config;
    var archetype = revealStyle.archetype;

    /* Build mood-derived color palette */
    var warmth = config.warmth;
    var bgHue = lerp(240, 35, warmth);
    var accentR = lerp(60, 200, warmth);
    var accentG = lerp(60, 80, warmth);
    var accentB = lerp(100, 60, warmth);
    var textGlow = lerp(0, 6, warmth);

    /* Build poem HTML */
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

  /**
   * downloadHTML(allLines, revealStyle) → void
   * Triggers a download of the standalone HTML artifact.
   */
  function downloadHTML(allLines, revealStyle) {
    var html = generateHTML(allLines, revealStyle);
    var filename = 'exquisite-corpse-' + revealStyle.archetype + '-' + new Date().toISOString().slice(0, 10) + '.html';
    var blob = new Blob([html], { type: 'text/html' });
    triggerDownload(blob, filename);
  }

  /**
   * downloadPNG(containerEl, revealStyle) → Promise
   * Renders the reveal container to a PNG using Canvas API.
   */
  function downloadPNG(containerEl, revealStyle) {
    /* Use html2canvas if available, otherwise fallback to a simple canvas render */
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

    /* Fallback: simple canvas text render */
    return new Promise(function (resolve) {
      var canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      var ctx = canvas.getContext('2d');

      /* Background */
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, 1200, 630);

      /* Title */
      ctx.fillStyle = '#e8dcc8';
      ctx.font = '24px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(revealStyle.title, 600, 60);

      /* Lines */
      ctx.font = '16px "Courier New", monospace';
      ctx.textAlign = 'left';
      var y = 100;
      var allLines = containerEl.querySelectorAll('.reveal-line');
      for (var i = 0; i < allLines.length; i++) {
        var el = allLines[i];
        ctx.fillStyle = el.classList.contains('author-app') ? '#8b6abf' : '#e8dcc8';
        ctx.fillText(el.textContent, 60, y);
        y += 28;
        if (y > 590) break;
      }

      /* Footer */
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

  /* ---- Helpers ---- */

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
```

- [ ] **Step 2: Commit**

```bash
git add v2/js/corpse-artifact.js
git commit -m "feat(v2): add CorpseArtifact for standalone HTML and PNG poem export"
```

---

## Task 11: Fork CorpseExport — Integrate Artifacts

**Files:**
- Create: `v2/js/corpse-export.js` (copy from `js/corpse-export.js`, then modify)

- [ ] **Step 1: Copy V1 export**

```bash
cp js/corpse-export.js v2/js/corpse-export.js
```

- [ ] **Step 2: Add HTML and PNG export functions**

In `v2/js/corpse-export.js`, add before the final `return` statement:

```javascript
  function downloadAsHTML(allLines, revealStyle) {
    if (typeof CorpseArtifact !== 'undefined') {
      CorpseArtifact.downloadHTML(allLines, revealStyle);
    }
  }

  function downloadAsPNG(containerEl, revealStyle) {
    if (typeof CorpseArtifact !== 'undefined') {
      return CorpseArtifact.downloadPNG(containerEl, revealStyle);
    }
    return Promise.resolve();
  }
```

Then update the `return` statement to include the new functions:

```javascript
  return {
    formatPoem: formatPoem,
    formatPoemClean: formatPoemClean,
    copyToClipboard: copyToClipboard,
    downloadAsText: downloadAsText,
    downloadAsHTML: downloadAsHTML,
    downloadAsPNG: downloadAsPNG
  };
```

- [ ] **Step 3: Commit**

```bash
git add v2/js/corpse-export.js
git commit -m "feat(v2): fork export with HTML artifact and PNG download support"
```

---

## Task 12: Fork CorpseUI — Mood-Reactive Rendering

**Files:**
- Create: `v2/js/corpse-ui.js` (copy from `js/corpse-ui.js`, then modify)

- [ ] **Step 1: Copy V1 UI**

```bash
cp js/corpse-ui.js v2/js/corpse-ui.js
```

- [ ] **Step 2: Update thinking indicator to use geometric shapes**

In `v2/js/corpse-ui.js`, find the `renderAppTurn` function and replace the thinking dots HTML:

```javascript
  /* ---- APP TURN ---- */
  function renderAppTurn(state) {
    var mood = state.moodProfile;
    var thinkText = (typeof CorpseReveal !== 'undefined' && mood) ? CorpseReveal.getThinkingText(mood) : 'the machine is dreaming';

    els.turnIndicator.textContent = 'Turn ' + state.turnNumber + ' \u00b7 The Machine Dreams';
    els.foldBtn.classList.add('hidden');
    els.reviveBtn.classList.add('hidden');

    els.foldArea.innerHTML = '';

    /* Show foundational with pulse */
    var fSlot = el('div', 'line-slot');
    var fDiv = el('div', 'line-foundational foundational-pulse');
    fDiv.textContent = state.foundational;
    fSlot.appendChild(fDiv);
    els.foldArea.appendChild(fSlot);

    /* Thinking indicator with geometric shapes */
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
```

- [ ] **Step 3: Update reveal to use CorpseReveal**

In `v2/js/corpse-ui.js`, replace the `renderReveal` function:

```javascript
  /* ---- REVEAL ---- */
  function renderReveal(state) {
    els.turnIndicator.textContent = '';
    els.foldBtn.classList.add('hidden');
    els.reviveBtn.classList.add('hidden');
    els.revealOverlay.classList.add('active');
    els.timerContainer.classList.remove('active');

    /* Get mood-driven reveal style */
    var revealStyle;
    if (typeof CorpseMood !== 'undefined') {
      revealStyle = CorpseMood.getRevealStyle();
    } else {
      revealStyle = { archetype: 'seance', title: 'The Corpse Speaks', config: { lineDelayMs: 300, staggerMs: 150, entryAngle: 0, entryDistance: 15, blurStart: 0, opacityEasing: 'ease', geometryIntensity: 0.5, warmth: 0.5, intensity: 0.5, strangeness: 0 } };
    }

    /* Update title */
    var titleEl = els.revealOverlay.querySelector('.reveal-title');
    if (titleEl) titleEl.textContent = revealStyle.title;

    /* Use CorpseReveal if available */
    var totalDuration;
    if (typeof CorpseReveal !== 'undefined') {
      totalDuration = CorpseReveal.render(els.revealOverlay, state.allLines, revealStyle);
    } else {
      /* Fallback: simple reveal */
      totalDuration = renderRevealFallback(state);
    }

    /* Show export controls after reveal completes */
    setTimeout(function () {
      els.exportControls.classList.add('visible');
    }, totalDuration + 300);

    /* Store reveal style for export */
    els._lastRevealStyle = revealStyle;
  }
```

- [ ] **Step 4: Add fold divider insertion after fold animation**

In `v2/js/corpse-ui.js`, in the `showFoldAnimation` function, add fold divider creation. Find the callback timeout inside `showFoldAnimation` and update it:

```javascript
    /* After animation completes */
    setTimeout(function () {
      /* Insert fold divider before transforming last slot */
      var divider = el('div', 'fold-divider');
      els.foldArea.insertBefore(divider, slots[slots.length - 1]);

      /* Transform last slot to foundational style */
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
```

- [ ] **Step 5: Update typewriter speed to use mood**

In `v2/js/corpse-ui.js`, replace the `typewriterReveal` function:

```javascript
  function typewriterReveal(element, text, onDone) {
    element.classList.add('visible');
    element.textContent = '';
    var i = 0;

    /* Get mood-driven speed */
    var speed = 30; /* default */
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
```

- [ ] **Step 6: Update settings panel with audio toggle**

In `v2/js/corpse-ui.js`, find `buildSettingsHTML` and add the audio section before the closing of the API key section. Add after the API key section closing `'</div>'`:

```javascript
      '<div class="audio-section">' +
        '<h3>Atmosphere</h3>' +
        '<div class="settings-group">' +
          '<label><input type="checkbox" id="audio-toggle"> Ambient sound</label>' +
          '<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Generative audio that shifts with the mood of your writing</div>' +
        '</div>' +
      '</div>';
```

- [ ] **Step 7: Update export controls HTML**

In `v2/js/corpse-ui.js`, in the `init` function, find the reveal overlay HTML and add new export buttons. Replace the export-controls div:

```javascript
      '<div class="export-controls" id="export-controls">' +
        '<button class="btn btn-secondary" id="copy-btn">Copy to Clipboard</button>' +
        '<button class="btn btn-secondary" id="copy-clean-btn">Copy (clean)</button>' +
        '<button class="btn btn-secondary" id="download-btn">Download .txt</button>' +
        '<button class="btn btn-secondary" id="download-html-btn">Download .html</button>' +
        '<button class="btn btn-secondary" id="download-png-btn">Download .png</button>' +
        '<button class="btn btn-start" id="new-session-btn">New Session</button>' +
      '</div>';
```

- [ ] **Step 8: Add a simple renderRevealFallback function**

In `v2/js/corpse-ui.js`, add this fallback function (used when CorpseReveal is not loaded):

```javascript
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
```

- [ ] **Step 9: Commit**

```bash
git add v2/js/corpse-ui.js
git commit -m "feat(v2): fork UI with constructivist elements, mood-reactive animations, and contextual reveal"
```

---

## Task 13: Fork CorpseApp — Wire Everything Together

**Files:**
- Create: `v2/js/corpse-app.js` (copy from `js/corpse-app.js`, then modify)

- [ ] **Step 1: Copy V1 app**

```bash
cp js/corpse-app.js v2/js/corpse-app.js
```

- [ ] **Step 2: Replace entire file content with V2 orchestrator**

Replace the entire contents of `v2/js/corpse-app.js`:

```javascript
/* ===== CorpseApp V2 — Orchestrator ===== */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    /* Initialize modules */
    CorpseMood.init();
    CorpseGenerator.init();
    CorpseState.init();
    CorpseUI.init(document.getElementById('corpse-app'));
    CorpseCanvas.init(document.getElementById('bg-canvas'));

    /* Wire state changes to UI + mood CSS */
    CorpseState.onStateChange(function (state) {
      /* Apply mood CSS properties to root */
      applyMoodCSS();

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

    /* ---- New Session ---- */
    document.addEventListener('click', function (e) {
      if (e.target.id === 'new-session-btn') {
        CorpseUI.closeReveal();
        CorpseMood.init();
        CorpseState.init();
        applyMoodCSS(); /* Reset CSS to neutral */
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
      if (e.target.id === 'audio-toggle') {
        if (e.target.checked) {
          CorpseAudio.start();
        } else {
          CorpseAudio.stop();
        }
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
     MOOD CSS APPLICATION
     ================================================================ */
  function applyMoodCSS() {
    var props = CorpseMood.getCSSProperties();
    var root = document.documentElement;
    var keys = Object.keys(props);
    for (var i = 0; i < keys.length; i++) {
      root.style.setProperty(keys[i], props[keys[i]]);
    }
  }

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

        CorpseUI.showAppLines(lines, function () {
          CorpseState.submitAppLines(fullLines);

          /* Apply mood CSS after app lines update the mood */
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
```

- [ ] **Step 3: Commit**

```bash
git add v2/js/corpse-app.js
git commit -m "feat(v2): fork app orchestrator wiring mood, canvas, audio, and new export buttons"
```

---

## Task 14: Manual Verification

- [ ] **Step 1: Verify V1 is unchanged**

Open `index.html` in a browser. Confirm:
- Start button works
- Can write 3 lines and fold
- Machine generates lines and auto-folds
- Revive works after 4+ turns
- Export (copy, download) works
- Settings panel opens/closes

- [ ] **Step 2: Verify V2 basic flow**

Open `v2/index.html` in a browser. Confirm:
- Background canvas shows drifting geometric shapes
- Start button works
- Can write 3 lines and fold
- Turn indicator has constructivist styling (angular, diagonal underline)
- Foundational line has geometric bracket frame
- Fold animation works and leaves a fold divider mark
- Machine thinking shows geometric shapes instead of dots

- [ ] **Step 3: Verify mood shifts**

In V2, write deliberately dark text on turn 1: "the skull bleeds into darkness and shadow"
Write dark text on subsequent turns. After 3-4 turns, verify:
- Background color shifts toward cooler tones
- Geometric accents shift color
- Typewriter speed changes
- Thinking text changes (e.g., "the machine mourns")

Then start a new session with light text: "golden sunlight blooms in the warm garden"
After 3-4 turns, verify atmosphere shifts differently (warmer tones).

- [ ] **Step 4: Verify contextual reveal**

Play through a full session (4+ turns) with dark, quiet text. Hit Revive. Verify:
- Reveal title is NOT "The Corpse Speaks" — should be mood-appropriate (e.g., "The Corpse Whispers")
- Lines animate in according to the archetype (e.g., slow fade for séance)
- Constructivist turn separators have geometric marks

- [ ] **Step 5: Verify export**

In the reveal screen, test each export:
- "Copy to Clipboard" → paste into a text editor, verify poem text
- "Copy (clean)" → verify clean text without labels
- "Download .txt" → verify file downloads
- "Download .html" → open the downloaded HTML file in a browser, verify it's a self-contained styled poem with the mood palette baked in
- "Download .png" → verify image downloads (may be basic without html2canvas)

- [ ] **Step 6: Verify audio (optional)**

Open settings, enable "Ambient sound". Verify:
- A quiet ambient drone plays
- Writing dark text shifts the audio toward dissonant intervals
- Disabling the toggle stops the audio

- [ ] **Step 7: Commit .gitignore update**

```bash
echo ".superpowers/" >> .gitignore
git add .gitignore
git commit -m "chore: add .superpowers to gitignore"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Mood engine with 4 dimensions, analysis, blending, phase multiplier (Task 2)
- ✅ Evolving AI voice — Claude API path + procedural fallback (Task 4)
- ✅ Mood state integration + snapshot (Task 5)
- ✅ Dreaming machine atmosphere — CSS custom properties (Task 6)
- ✅ Constructivist visual elements — turn indicator, fold dividers, foundational frame (Tasks 6, 12)
- ✅ Key animated moments — fold, thinking, typewriter (Tasks 6, 12)
- ✅ Background canvas with geometric particles (Task 7)
- ✅ Audio layer opt-in (Task 8)
- ✅ Contextual reveal with 5 archetypes + adaptive titles (Task 9)
- ✅ Shareable HTML artifact (Task 10)
- ✅ PNG export (Task 10)
- ✅ Plain text export unchanged (Task 11)
- ✅ V2 file architecture matching spec (Task 1)
- ✅ V1 preserved unchanged (Task 14 step 1)
- ✅ Testing strategy covered (Tasks 3, 14)

**Type consistency check:**
- `CorpseMood.getProfile()` returns `{valence, energy, texture, strangeness, phase, turnCount}` — used consistently in mood.js, state.js snapshot, reveal.js, audio.js, canvas.js
- `CorpseMood.getCSSProperties()` returns object with `--mood-*` keys — used in app.js `applyMoodCSS()` and CSS `var()` references
- `CorpseMood.getPromptModifiers()` returns `{systemPromptSuffix, nounWeights, verbWeights, strategyWeights}` — used in generator.js
- `CorpseMood.getRevealStyle()` returns `{archetype, title, config}` — used in reveal.js, artifact.js, ui.js, app.js
- `CorpseReveal.render()` returns duration number — used in ui.js
- `CorpseReveal.getThinkingText()` takes mood object — called from ui.js with `state.moodProfile`
- `CorpseArtifact.downloadHTML()` takes `(allLines, revealStyle)` — called from export.js
- `CorpseArtifact.downloadPNG()` takes `(containerEl, revealStyle)` — called from export.js
- `CorpseUI.els._lastRevealStyle` set in ui.js renderReveal, read in app.js — consistent
