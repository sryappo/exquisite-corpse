## Context

Build a creative writing web app inspired by the surrealist "Exquisite Corpse" game. A solo user and the app take turns writing 3-line stanzas. After each turn, the first two lines are "folded" away — only the last line (the "foundational") remains visible as a prompt for the next turn. After a minimum of 4 turns, the user can "Revive" to reveal the full collaborative poem and export it.

The existing repo is a vanilla HTML/CSS/JS historical map app. The Exquisite Corpse app will live in its own `exquisite-corpse/` subdirectory with no shared code.

## File Structure

```
exquisite-corpse/
  index.html
  css/
    corpse.css
  js/
    corpse-generator.js   # Word banks + creative text generation engine
    corpse-state.js       # Central state machine (turns, lines, phases)
    corpse-timer.js       # Optional timed/ballistic mode
    corpse-export.js      # Clipboard copy + text file download
    corpse-ui.js          # DOM rendering, inputs, fold/unfold animations
    corpse-app.js         # Entry point: wires all modules together
```

All JS modules use the IIFE pattern (matching existing codebase conventions), exposing global namespace objects.

---

## Implementation Steps

### Step 1: `index.html` — Scaffold

- Minimal HTML: viewport meta, charset, link to `corpse.css`
- Single `<div id="corpse-app">` container
- Script tags in dependency order: generator → state → timer → export → ui → app
- System font stack (Georgia for display, Courier New for body) — no external deps

### Step 2: `corpse-state.js` — State Machine

- **Phases:** `IDLE → USER_TURN → FOLDING → APP_TURN → FOLDING → USER_TURN → ... → REVEAL`
- **State:** `phase`, `turnNumber` (1-indexed, odd=user, even=app), `allLines[]` (full poem), `foundational` (visible line), `currentLines[]`, timer settings, `sessionActive`
- **Key API:** `startSession()`, `submitUserLines(lines)`, `fold()`, `submitAppLines(lines)`, `canRevive()`, `revive()`, `onStateChange(callback)`
- **Validation:** Turn 1 = 3 lines (min 2 words each, line 3 allows 1 word). Turn 3+ = 2 lines from user (same rules). Emoji and made-up words allowed.

### Step 3: `corpse-generator.js` — Hybrid Text Engine (Claude API + client-side fallback)

**Architecture:** Try Claude API first; if no key or request fails, fall back to client-side procedural generation. A settings toggle lets the user enter/remove their Anthropic API key (stored in `localStorage`).

**Claude API path:**

- Call `https://api.anthropic.com/v1/messages` directly from the browser (CORS-enabled)
- System prompt instructs Claude to act as a surrealist poet: given a foundational line, produce exactly 2 new lines of creative text (the foundational is line 1, Claude writes lines 2-3)
- Prompt emphasizes: automatic writing, free association, rhyme/assonance/semantic drift, made-up words welcome, surrealist ethos
- Parse the 2 lines from the response, validate, return

**Client-side fallback (procedural):**

- **Word banks** (~150-200 words per category): nouns (concrete, abstract, surreal, body, nature), verbs (action, surreal, quiet), adjectives (sensory, emotional, surreal), prepositions, conjunctions
- **Rhyme families** (~15+ groups) for rhyme-based strategies
- **30+ sentence templates** (surrealist Mad Libs)
- **Input analysis:** Extract key words, detect ending sound, identify semantic categories, estimate syllable count
- **5 generation strategies** (randomly weighted per line):
    1. **Template Fill (30%)** — fill a random template, biased toward detected categories
    2. **Rhyme Response (20%)** — end line with a word rhyming with the foundational's last word
    3. **Word Theft + Mutation (20%)** — take a keyword, mutate it (prefix swap, compound, phonetic neighbor)
    4. **Syntactic Echo (15%)** — mirror the grammatical structure with different content
    5. **Surrealist Non Sequitur (15%)** — deliberately jarring, automatic-writing style
- Line 2 biased toward connection; Line 3 biased toward drift (to keep the corpse evolving)
- Quality filters: no exact repeats, no >50% word overlap with foundational

**UI for API key:** A small gear icon in the header opens a settings panel. User can paste their Anthropic API key. A status indicator shows "Claude connected" or "Using local engine". Key is stored in `localStorage`, never transmitted except to the Anthropic API.

### Step 4: `corpse.css` — Surrealist Aesthetic

- **Palette:** deep black `#0a0a0f` bg, parchment off-white `#e8dcc8` text, gold `#c9a84c` accents, muted violet `#6a4c93` for app lines, blood red `#8b1a1a` for ballistic/errors
- **Typography:** Georgia serif for title (letterspaced small-caps), Courier New monospace for body/inputs
- **Layout:** Flexbox column, centered, max-width 640px
- **Fold animation:** `perspective(800px) rotateX(-90deg)` + opacity fade on lines 1-2, ~800ms transition — paper-folding illusion
- **Unfold/Revive animation:** Staggered line-by-line reveal (200ms per line), each line slides up from `rotateX(45deg)`
- **"App thinking" indicator:** foundational line pulses, "the machine is dreaming..." ellipsis animation
- **Timer bar:** horizontal progress bar, gold → red as time runs low
- **Inputs:** `<textarea>` with auto-expand, bottom-border styling, text wrapping

### Step 5: `corpse-timer.js` — Timed & Ballistic Modes

- `setInterval`-based countdown (30-90 seconds configurable)
- `onTick(remaining, total)` callback for UI bar updates
- `onExpire()` callback — in normal mode: auto-fold with current input; in ballistic mode: dramatic dissolve animation, lines lost
- Start on user turns only, pause during app turns

### Step 6: `corpse-export.js` — Save & Export

- `formatPoem(allLines)` — formatted text with turn markers and author attribution (user vs. app)
- `copyToClipboard()` — `navigator.clipboard.writeText()` with textarea fallback
- `downloadAsText()` — Blob + `URL.createObjectURL` + hidden `<a>` click

### Step 7: `corpse-ui.js` — DOM Rendering & Animations

- Build full DOM skeleton on init (header, stage with fold-area, controls footer, reveal overlay)
- `renderTurn(state)` — switches on phase, shows/hides elements, sets up correct number of inputs
- Turn 1: 3 empty textareas. Turn 3+: foundational (read-only) + 2 empty textareas
- Fold button: validate → lock inputs → animate fold → callback to state
- Revive button: appears after turn 4, triggers overlay with staggered poem reveal
- App turn: show thinking animation → delay 1.5-2.5s → typewriter-style line reveal → auto-fold
- Turn indicator: "Turn N · Your Turn" / "Turn N · The Machine Dreams"
- Settings bar: timed mode checkbox, timer slider (30-90s), ballistic mode checkbox

### Step 8: `corpse-app.js` — Orchestrator

- DOMContentLoaded boot: init all modules, register state change listener → UI render
- Wire Fold button → validation → `submitUserLines()` → fold animation → `fold()`
- Wire app turn: thinking delay → `CorpseGenerator.generate(foundational)` → `submitAppLines()` → auto-fold
- Wire Revive → overlay → unfold animation → export controls
- Wire settings panel to state
- Wire "New Session" button to full reset

### Step 9: Polish & Test

- Edge cases: emoji in word count, rapid button clicks (debounce), very long lines (text wrap)
- Keyboard: Tab between inputs, Enter as Fold shortcut
- Test full flow: Start → 3 lines → Fold → App generates → Fold → User 2 lines → Fold → App → Revive → Export
- Test timed mode and ballistic mode

## Verification

1. Open `exquisite-corpse/index.html` in browser
2. **Happy path:** Enter 3 lines → Fold → observe fold animation, app generates → auto-folds → enter 2 lines → Fold → repeat → after turn 4 press Revive → full poem unfolds → Copy to Clipboard / Download
3. **Timed mode:** Enable timer, verify countdown bar, let it expire in both normal and ballistic modes
4. **Validation:** Try submitting empty lines, single-word lines on line 1/2 — expect inline errors
5. **Export:** Verify clipboard copy and downloaded .txt file contain the complete formatted poem