/* ===== CorpseGenerator — Hybrid Text Engine ===== */
var CorpseGenerator = (function () {
  'use strict';

  /* ================================================================
     WORD BANKS
     ================================================================ */
  var NOUNS = {
    concrete: [
      'moon','clock','mirror','skeleton','tongue','umbrella','staircase','window',
      'candle','river','bridge','feather','hammer','needle','bottle','curtain',
      'lantern','wheel','anchor','bell','ladder','envelope','compass','keyhole',
      'chimney','marble','telescope','hourglass','chandelier','typewriter',
      'doorknob','violin','fossil','lighthouse','cobweb','matchstick','windmill',
      'cathedral','photograph','carousel','pendulum','kaleidoscope','gramophone'
    ],
    abstract: [
      'memory','silence','gravity','dream','absence','longing','echo','dusk',
      'hunger','vertigo','oblivion','rapture','melancholy','reverie','solitude',
      'tremor','exile','riddle','paradox','threshold','fury','patience',
      'nostalgia','entropy','stillness','appetite','illusion','murmur'
    ],
    surreal: [
      'eye-clock','bone-flower','liquid piano','melting cathedral','glass tongue',
      'velvet engine','smoke ladder','iron dream','paper volcano','salt mirror',
      'wax compass','silk thunder','fog piano','moth engine','rust alphabet',
      'crystal scream','amber ghost','porcelain storm','mercury garden','ash violin'
    ],
    body: [
      'hand','eye','tooth','rib','spine','throat','finger','skull','lung',
      'shoulder','jaw','knuckle','pelvis','tendon','eyelid','collarbone',
      'wrist','ankle','marrow','cartilage','sternum','navel','temple'
    ],
    nature: [
      'river','stone','moth','root','tide','ash','thorn','ember','pollen',
      'glacier','canyon','coral','moss','dew','quartz','lichen','basalt',
      'silt','driftwood','stalactite','kelp','obsidian','loam','fern','spore'
    ]
  };

  var VERBS = {
    action: [
      'dissolves','unravels','swallows','fractures','ignites','devours','shatters',
      'blooms','collapses','erupts','peels','splits','crumbles','floods','spirals',
      'pierces','punctures','scatters','grinds','braids','stitches','carves'
    ],
    surreal: [
      'un-dreams','liquefies','alphabetizes','fossil-walks','mirror-eats',
      'clock-bleeds','ghost-writes','smoke-sings','rust-breathes','wax-remembers',
      'dust-conjugates','shadow-ferments','silk-evaporates','bone-translates',
      'glass-whispers','fog-calculates','ash-navigates','mercury-prays'
    ],
    quiet: [
      'whispers','drifts','folds','traces','hovers','settles','lingers',
      'breathes','trembles','hums','seeps','wilts','gathers','recedes',
      'unfurls','sways','dissolves','murmurs','grazes','bends','pools'
    ]
  };

  var ADJECTIVES = {
    sensory: [
      'velvet','phosphorescent','hollow','liquid','electric','brittle','molten',
      'translucent','pungent','glacial','scorching','gossamer','crystalline',
      'fibrous','incandescent','opaque','luminous','granular','iridescent'
    ],
    emotional: [
      'forgotten','furious','tender','impossible','reluctant','desperate',
      'bewildered','reckless','solemn','feverish','delirious','wistful',
      'inconsolable','exquisite','ravenous','mournful','ecstatic','penitent'
    ],
    surreal: [
      'backwards','upside-down','inside-out','translucent','inverted','nameless',
      'unborn','severed','liquefied','fossilized','alphabetical','recursive',
      'centrifugal','prismatic','nocturnal','subterranean','amphibious','gelatinous'
    ]
  };

  var PREPOSITIONS = [
    'beneath','inside','against','through','beyond','among','beside',
    'above','within','between','behind','around','across','toward','upon'
  ];

  var CONJUNCTIONS = [
    'while','until','because','although','as if','even when','before',
    'after','whenever','so that','unless','where','once','though'
  ];

  var ARTICLES = ['the','a','every','no','each','that','this'];

  var ADVERBS = [
    'slowly','backwards','silently','always','never','almost','suddenly',
    'softly','endlessly','blindly','gently','fiercely','tenderly','desperately'
  ];

  /* ---- Rhyme Families ---- */
  var RHYME_FAMILIES = {
    '-ight': ['night','light','flight','sight','blight','might','right','height','fright','plight'],
    '-oon': ['moon','spoon','balloon','cocoon','lagoon','afternoon','bassoon','platoon','maroon','monsoon'],
    '-ence': ['silence','absence','presence','violence','sentence','cadence','sequence','patience','essence'],
    '-ow': ['glow','flow','shadow','hollow','sorrow','pillow','arrow','marrow','sparrow','window'],
    '-ine': ['spine','vine','divine','shrine','crystalline','serpentine','medicine','figurine','valentine','machine'],
    '-ade': ['blade','shade','cascade','arcade','tirade','masquerade','barricade','lemonade','serenade','parade'],
    '-ust': ['dust','rust','trust','gust','must','crust','thrust','adjust','disgust','combust'],
    '-ream': ['dream','stream','scream','gleam','cream','steam','beam','seam','scheme','extreme'],
    '-one': ['bone','stone','throne','alone','cyclone','backbone','milestone','telephone','monotone','undertone'],
    '-ire': ['fire','wire','desire','expire','conspire','choir','empire','vampire','sapphire','entire'],
    '-all': ['fall','wall','crawl','rainfall','waterfall','nightfall','downfall','install','enthrall','overall'],
    '-aze': ['gaze','blaze','haze','maze','phase','raze','glaze','craze','amaze','malaise'],
    '-orn': ['thorn','born','torn','worn','forlorn','unicorn','acorn','scorn','adorn','stubborn'],
    '-ash': ['ash','crash','flash','splash','clash','eyelash','backlash','mustache','goulash','whiplash'],
    '-old': ['gold','cold','fold','bold','mold','behold','threshold','manifold','marigold','blindfold']
  };

  /* ---- Sentence Templates ---- */
  var TEMPLATES = [
    'the {adj} {noun} {verb} {prep} the {noun2}',
    '{noun} of {noun2}, {verb} like {adj} {noun3}',
    'every {noun} is a {adj} {noun2} {adv}',
    'in the {noun} of {adj} {noun2}, {noun3} {verb}',
    '{adj} as a {noun} that {verb}',
    'the {noun} {verb} its own {adj} {noun2}',
    'between {noun} and {noun2}, a {adj} {verb_gerund}',
    'we {verb_base} the {adj} {noun} {adv}',
    '{prep} the {adj} {noun}, something {verb}',
    'all the {noun_plural} {verb} {prep} {adj} {noun2}',
    'what {verb} the {noun} {verb2} the {adj} {noun2}',
    'the {noun} was {adj} and {adj2}, like {noun2}',
    'a {noun} {verb} where the {noun2} used to {verb_base}',
    'neither {noun} nor {noun2} can {verb_base} the {adj} {noun3}',
    '{adv} the {noun} {verb} into {adj} {noun2}',
    'if the {noun} could {verb_base}, it would {verb_base2} {adv}',
    'one {adj} {noun} {verb} another {adj2} {noun2}',
    'the last {noun} {verb} {prep} a {adj} {noun2}',
    'they say the {noun} {verb} when {noun2} {verb2}',
    'from the {noun} of {noun2}, a {adj} {noun3} {verb}',
    'do not {verb_base} the {adj} {noun}, it {verb}',
    '{noun}, {noun2}, and the {adj} {noun3} {verb}',
    'only the {adj} {noun} knows how to {verb_base}',
    'at the edge of {noun}, {adj} {noun2} {verb}',
    'the {noun} opens like a {adj} {noun2}',
    'to {verb_base} is to {verb_base2} the {adj} {noun}',
    'a thousand {noun_plural} {verb} {prep} the {noun2}',
    'here the {noun} {verb} with {adj} {noun2}',
    '{adj} {noun} after {adj2} {noun2} after {noun3}',
    'it was the {noun} that {verb} the {adj} {noun2}'
  ];

  /* ---- Stop words for analysis ---- */
  var STOP_WORDS = new Set([
    'the','a','an','and','or','but','in','on','at','to','for','of','with',
    'by','from','is','are','was','were','be','been','being','have','has',
    'had','do','does','did','will','would','could','should','may','might',
    'shall','can','it','its','i','my','me','we','us','our','you','your',
    'he','she','they','them','their','his','her','this','that','these',
    'those','not','no','so','if','then','than','as','up','out','just'
  ]);

  /* ---- All words as Sets for lookup ---- */
  var ALL_NOUNS, ALL_VERBS, ALL_ADJS;

  function init() {
    ALL_NOUNS = new Set();
    ALL_VERBS = new Set();
    ALL_ADJS = new Set();
    Object.keys(NOUNS).forEach(function (k) {
      NOUNS[k].forEach(function (w) { ALL_NOUNS.add(w.toLowerCase()); });
    });
    Object.keys(VERBS).forEach(function (k) {
      VERBS[k].forEach(function (w) { ALL_VERBS.add(w.toLowerCase()); });
    });
    Object.keys(ADJECTIVES).forEach(function (k) {
      ADJECTIVES[k].forEach(function (w) { ALL_ADJS.add(w.toLowerCase()); });
    });
  }

  /* ================================================================
     UTILITY HELPERS
     ================================================================ */
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

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

  function toGerund(verb) {
    var v = verb.replace(/s$/, '');
    if (v.endsWith('e')) return v.slice(0, -1) + 'ing';
    return v + 'ing';
  }

  function toBase(verb) {
    var v = verb;
    if (v.endsWith('es')) v = v.slice(0, -2);
    else if (v.endsWith('s')) v = v.slice(0, -1);
    return v;
  }

  function toPlural(noun) {
    if (noun.endsWith('s') || noun.endsWith('x') || noun.endsWith('ch') || noun.endsWith('sh')) {
      return noun + 'es';
    }
    if (noun.endsWith('y') && !'aeiou'.includes(noun[noun.length - 2])) {
      return noun.slice(0, -1) + 'ies';
    }
    return noun + 's';
  }

  function estimateSyllables(word) {
    var w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (w.length <= 2) return 1;
    w = w.replace(/e$/, '');
    var vowels = w.match(/[aeiouy]+/g);
    return vowels ? Math.max(1, vowels.length) : 1;
  }

  /* ================================================================
     INPUT ANALYSIS
     ================================================================ */
  function analyzeLine(line) {
    var words = line.toLowerCase().replace(/[^a-z0-9\s'-]/g, '').trim().split(/\s+/).filter(Boolean);
    var lastWord = words.length > 0 ? words[words.length - 1].replace(/[^a-z]/g, '') : '';

    return {
      words: words,
      length: words.length,
      keyWords: words.filter(function (w) { return !STOP_WORDS.has(w) && w.length > 2; }),
      lastWord: lastWord,
      endingSound: getEndingSound(lastWord),
      detectedNouns: words.filter(function (w) { return ALL_NOUNS && ALL_NOUNS.has(w); }),
      detectedCategories: detectCategories(words),
      syllableCount: words.reduce(function (s, w) { return s + estimateSyllables(w); }, 0)
    };
  }

  function getEndingSound(word) {
    var cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
    for (var ending in RHYME_FAMILIES) {
      if (RHYME_FAMILIES[ending].indexOf(cleaned) !== -1) return ending;
    }
    if (cleaned.length >= 3) return '-' + cleaned.slice(-3);
    return '-' + cleaned;
  }

  function findRhymes(word) {
    var sound = getEndingSound(word);
    var family = RHYME_FAMILIES[sound];
    if (!family) return [];
    return family.filter(function (w) { return w !== word.toLowerCase(); });
  }

  function detectCategories(words) {
    var cats = [];
    var nounCats = Object.keys(NOUNS);
    for (var c = 0; c < nounCats.length; c++) {
      for (var w = 0; w < words.length; w++) {
        if (NOUNS[nounCats[c]].indexOf(words[w]) !== -1) {
          cats.push(nounCats[c]);
          break;
        }
      }
    }
    return cats;
  }

  /* ================================================================
     TEMPLATE FILLER
     ================================================================ */
  function fillTemplate(template, biasCategories) {
    function biasedNoun() {
      if (biasCategories && biasCategories.length > 0 && Math.random() < 0.5) {
        var cat = pick(biasCategories);
        if (NOUNS[cat]) return pick(NOUNS[cat]);
      }
      return pickNoun();
    }

    var usedNouns = [];
    var usedAdjs = [];
    var usedVerbs = [];

    function uniqueNoun() {
      var n;
      var attempts = 0;
      do { n = biasedNoun(); attempts++; } while (usedNouns.indexOf(n) !== -1 && attempts < 10);
      usedNouns.push(n);
      return n;
    }
    function uniqueAdj() {
      var a;
      var attempts = 0;
      do { a = pickAdj(); attempts++; } while (usedAdjs.indexOf(a) !== -1 && attempts < 10);
      usedAdjs.push(a);
      return a;
    }
    function uniqueVerb() {
      var v;
      var attempts = 0;
      do { v = pickVerb(); attempts++; } while (usedVerbs.indexOf(v) !== -1 && attempts < 10);
      usedVerbs.push(v);
      return v;
    }

    return template.replace(/\{(\w+)\}/g, function (match, slot) {
      switch (slot) {
        case 'noun': case 'noun2': case 'noun3': return uniqueNoun();
        case 'noun_plural': return toPlural(uniqueNoun());
        case 'adj': case 'adj2': return uniqueAdj();
        case 'verb': case 'verb2': return uniqueVerb();
        case 'verb_base': case 'verb_base2': return toBase(uniqueVerb());
        case 'verb_gerund': return toGerund(uniqueVerb());
        case 'prep': return pick(PREPOSITIONS);
        case 'adv': return pick(ADVERBS);
        default: return match;
      }
    });
  }

  /* ================================================================
     GENERATION STRATEGIES
     ================================================================ */

  /* Strategy 1: Template Fill */
  function strategyTemplateFill(analysis) {
    return fillTemplate(pick(TEMPLATES), analysis.detectedCategories);
  }

  /* Strategy 2: Rhyme Response */
  function strategyRhyme(analysis) {
    var rhymes = findRhymes(analysis.lastWord);
    if (rhymes.length === 0) return strategyTemplateFill(analysis);

    var rhymeWord = pick(rhymes);
    var starters = [
      'the ' + pickAdj() + ' ' + pickNoun() + ' ' + pickVerb() + ' toward ' + rhymeWord,
      pickAdj() + ' as ' + rhymeWord + ', the ' + pickNoun() + ' ' + pickVerb(),
      'we found the ' + rhymeWord + ' ' + pick(PREPOSITIONS) + ' the ' + pickAdj() + ' ' + pickNoun(),
      pick(ADVERBS) + ' the ' + pickNoun() + ' becomes ' + rhymeWord,
      'from ' + pickNoun() + ' to ' + rhymeWord + ', the ' + pickAdj() + ' ' + pickNoun() + ' ' + pickVerb()
    ];
    return pick(starters);
  }

  /* Strategy 3: Word Theft + Mutation */
  function strategyMutation(analysis) {
    var keyWord = analysis.keyWords.length > 0 ? pick(analysis.keyWords) : pick(analysis.words);
    var mutated = mutateWord(keyWord);
    var frames = [
      'the ' + mutated + ' ' + pickVerb() + ' ' + pick(PREPOSITIONS) + ' ' + pickAdj() + ' ' + pickNoun(),
      pick(ADVERBS) + ' the ' + pickNoun() + ' ' + pickVerb() + ' into ' + mutated,
      mutated + ' and ' + pickNoun() + ' ' + pickVerb() + ' ' + pick(PREPOSITIONS) + ' the ' + pickAdj() + ' ' + pickNoun(),
      'what is ' + mutated + ' but a ' + pickAdj() + ' ' + pickNoun() + ' ' + pick(ADVERBS)
    ];
    return pick(frames);
  }

  function mutateWord(word) {
    var strategies = [
      function () { return pick(['un','re','dis','mis','over','under','de','anti']) + '-' + word; },
      function () { return word + '-' + pick(NOUNS.concrete); },
      function () { return word + '-' + pick(NOUNS.body); },
      function () { return inventWord(word); }
    ];
    return pick(strategies)();
  }

  function inventWord(seed) {
    var vowels = 'aeiou';
    if (seed.length < 3) return seed + pick(NOUNS.abstract).slice(-4);
    var prefix = seed.slice(0, Math.ceil(seed.length / 2));
    var donor = pickNoun();
    var suffix = donor.slice(Math.floor(donor.length / 2));
    return prefix + suffix;
  }

  /* Strategy 4: Syntactic Echo */
  function strategySyntacticEcho(analysis) {
    /* Mirror the rough word count and structure but replace all content */
    var len = Math.max(3, Math.min(analysis.length, 8));
    var parts = [];
    for (var i = 0; i < len; i++) {
      var roll = Math.random();
      if (roll < 0.25) parts.push(pickAdj());
      else if (roll < 0.55) parts.push(pickNoun());
      else if (roll < 0.75) parts.push(pickVerb());
      else if (roll < 0.85) parts.push(pick(PREPOSITIONS));
      else parts.push(pick(ARTICLES));
    }
    return parts.join(' ');
  }

  /* Strategy 5: Surrealist Non Sequitur */
  function strategyNonSequitur() {
    var forms = [
      pick(NOUNS.surreal) + ' ' + pick(VERBS.surreal) + ' ' + pick(PREPOSITIONS) + ' ' + pick(ADJECTIVES.surreal) + ' ' + pickNoun(),
      'the ' + pick(ADJECTIVES.surreal) + ' ' + pick(NOUNS.body) + ' ' + pick(VERBS.surreal) + ' ' + pick(ADVERBS),
      pick(ADVERBS) + ' a ' + pick(NOUNS.surreal) + ' ' + pick(VERBS.surreal),
      pick(ADJECTIVES.emotional) + ' ' + pick(NOUNS.surreal) + ' ' + pick(CONJUNCTIONS) + ' ' + pick(NOUNS.abstract) + ' ' + pick(VERBS.quiet),
      'the ' + pick(NOUNS.body) + ' of the ' + pick(NOUNS.surreal) + ' ' + pick(VERBS.action) + ' ' + pick(ADVERBS)
    ];
    return pick(forms);
  }

  /* ================================================================
     MAIN GENERATION — picks strategy by weighted random
     ================================================================ */
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

  function wordOverlap(a, b) {
    var wordsA = a.toLowerCase().split(/\s+/);
    var wordsB = new Set(b.toLowerCase().split(/\s+/));
    var overlap = 0;
    wordsA.forEach(function (w) { if (wordsB.has(w) && !STOP_WORDS.has(w)) overlap++; });
    var keyCount = wordsA.filter(function (w) { return !STOP_WORDS.has(w); }).length;
    return keyCount > 0 ? overlap / keyCount : 0;
  }

  function generateProcedural(foundational) {
    var analysis = analyzeLine(foundational);
    var line2, line3;
    var attempts;

    /* Line 2: connected to foundational */
    attempts = 0;
    do {
      line2 = generateLine(analysis, false);
      attempts++;
    } while (attempts < 10 && (line2 === foundational || wordOverlap(line2, foundational) > 0.5));

    /* Line 3: drifting — this becomes the next foundational */
    var analysis2 = analyzeLine(line2);
    attempts = 0;
    do {
      line3 = generateLine(analysis2, true);
      attempts++;
    } while (attempts < 10 && (line3 === foundational || line3 === line2 || wordOverlap(line3, foundational) > 0.5));

    return [line2, line3];
  }

  /* ================================================================
     CLAUDE API INTEGRATION
     ================================================================ */
  var API_KEY_STORAGE = 'exquisite_corpse_api_key';

  function getApiKey() {
    try { return localStorage.getItem(API_KEY_STORAGE) || ''; }
    catch (e) { return ''; }
  }

  function setApiKey(key) {
    try { localStorage.setItem(API_KEY_STORAGE, key); }
    catch (e) { /* ignore */ }
  }

  function removeApiKey() {
    try { localStorage.removeItem(API_KEY_STORAGE); }
    catch (e) { /* ignore */ }
  }

  function hasApiKey() {
    return getApiKey().length > 0;
  }

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

  /* ================================================================
     PUBLIC API
     ================================================================ */

  /**
   * generate(foundational) → Promise<[line2, line3]>
   * Tries Claude API first, falls back to procedural.
   */
  function generate(foundational) {
    if (hasApiKey()) {
      return generateWithClaude(foundational)
        .catch(function () {
          /* fallback to procedural on any API error */
          return generateProcedural(foundational);
        });
    }
    return Promise.resolve(generateProcedural(foundational));
  }

  return {
    init: init,
    generate: generate,
    generateProcedural: generateProcedural,
    getApiKey: getApiKey,
    setApiKey: setApiKey,
    removeApiKey: removeApiKey,
    hasApiKey: hasApiKey
  };
})();
