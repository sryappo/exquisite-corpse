# Exquisite Corpse V2 — Design Spec

## Overview

V2 enhances the Exquisite Corpse collaborative writing app with three interconnected features: an evolving AI voice that adapts to the user's writing, a mood-reactive dreaming-machine atmosphere with modernist/constructivist aesthetics, and shareable poem artifacts. The mood engine is the architectural spine — it drives the AI voice, the visual atmosphere, and the contextual reveal.

V1 is preserved unchanged. V2 lives in a parallel `v2/` directory.

## Design Principles

- **The machine is a genuine creative partner.** The AI evolves its voice in response to what the user writes, building a collaborative mood rather than just reacting to the last line.
- **The experience is a ritual.** The folding, the atmosphere, the reveal — it should feel like a séance conducted by a constructivist machine.
- **Mood is the spine.** A single mood engine drives voice, visuals, audio, and reveal style. Everything reads from the same source of truth.
- **Three aesthetic layers:** dreamscape (mood/emotion), constructivist (structural geometry), mechanical (rhythm/precision). The constructivist elements are the skeleton the dream drapes over.
- **Static site stays static.** No backend, no accounts, no build tools. Vanilla HTML/CSS/JS with the IIFE global pattern.

## 1. Mood Engine (`CorpseMood`)

New central module that maintains a mood profile evolving across the session.

### Mood Dimensions

Four floats, each ranging from -1 to +1:

| Dimension     | -1 pole                          | +1 pole                          |
|---------------|----------------------------------|----------------------------------|
| **Valence**   | dark, ominous, mournful          | luminous, joyful, ecstatic       |
| **Energy**    | still, hushed, slow              | violent, explosive, frenetic     |
| **Texture**   | ethereal, abstract, dissolving   | visceral, bodily, concrete       |
| **Strangeness** | grounded, plain, familiar      | surreal, alien, impossible       |

### Analysis

On each text submission, the engine:
- Matches keywords against categorized word lists (extending V1's existing word banks)
- Applies heuristics: punctuation density → energy, body-part nouns → texture, surreal compound words → strangeness, etc.
- Produces a "mood delta" — the shift this text implies

### Blending

- The delta is blended into the running profile using exponential smoothing — recent turns matter more, but early turns still echo
- Both user and machine text are fed through `update()`, so the mood profile reflects both participants

### Turn-Phase Multiplier

Borrowed from Approach C — scales how strongly mood shifts propagate:

| Phase   | Turns | Multiplier | Effect                                      |
|---------|-------|------------|---------------------------------------------|
| Early   | 1-2   | 0.3        | Atmosphere barely shifts; still exploring    |
| Middle  | 3-5   | 0.7        | Atmosphere responds noticeably               |
| Late    | 6+    | 1.0        | Fully committed; mood drives everything      |

### Public API

```
CorpseMood.init()                → initialize/reset to neutral profile (called on new session)
CorpseMood.analyze(text)         → mood delta object (read-only, does not mutate profile)
CorpseMood.update(text)          → analyzes + blends into running profile
CorpseMood.getProfile()          → {valence, energy, texture, strangeness, phase, turnCount}
CorpseMood.getCSSProperties()    → object of CSS custom property values
CorpseMood.getPromptModifiers()  → tone/vocabulary guidance for AI prompt
CorpseMood.getRevealStyle()      → reveal archetype + configuration object
```

## 2. Evolving AI Voice

The mood profile shapes how the machine writes. Affects both the Claude API path and the procedural fallback.

### Claude API Path

- System prompt becomes dynamic, incorporating `CorpseMood.getPromptModifiers()`
- Prompt modifiers translate mood dimensions into tone descriptors and vocabulary guidance
- Example: `{valence: -0.7, energy: 0.2, texture: 0.8, strangeness: 0.4}` → *"Your tone is dark and hushed. Favor bodily, concrete imagery — bones, skin, teeth, roots. Use short declarative sentences. Avoid abstraction."*
- The foundational line is still passed as context, but the system prompt now carries the session's accumulated mood

### Procedural Fallback Path

- `getPromptModifiers()` also returns weighted category preferences for word banks
- High texture → bias toward `NOUNS.body` and `NOUNS.nature`
- High strangeness → bias toward `NOUNS.surreal` and `VERBS.surreal`
- Low energy → bias toward `VERBS.quiet`
- The existing 5 generation strategies stay, but their weighting shifts based on mood:
  - High strangeness → increased non-sequitur weight
  - Low strangeness → increased template-fill and rhyme weights

### Continuity

- Machine output is also fed through `CorpseMood.update()`, so the mood profile reflects both participants
- The conversation is genuinely co-authored mood, not just the user imposing direction

## 3. Dreaming Machine Atmosphere

Mood becomes visible and audible through three aesthetic layers.

### Three-Layer Aesthetic Model

1. **Dreamscape layer** — soft gradients, dissolving edges, floating motion, ambient glow. The emotional, unconscious surface.
2. **Constructivist layer** — bold geometric accents, diagonal lines, asymmetric compositions, stark typography contrasts. The structural bones.
3. **Mechanical layer** — typewriter rhythm, grid snapping, clock-like timing, monospace precision. The machine's heartbeat.

The constructivist elements provide structure; the dreamscape provides mood. As strangeness increases, the constructivist geometry warps: straight lines bend, grids skew, the rational framework starts dreaming.

### Mood → Visual Mapping

All visual shifts happen through CSS custom properties set by `CorpseMood.getCSSProperties()` applied to the root element. CSS handles the rest via `var()` references and transitions.

**Valence:**
- -1: Deep indigo/black palette, cold tones, grain intensifies, geometric accents turn monochrome
- +1: Warm gold/amber, constructivist red accents emerge, soft radiance, parchment warmth

**Energy:**
- -1: Slow transitions (1.5-2s), gentle easing, thin geometric lines, generous whitespace
- +1: Quick transitions (0.3-0.5s), sharp easing, thick bold strokes, compressed composition

**Texture:**
- -1: Blurred edges, soft glows, geometry fades to watercolor washes, dreamy halos
- +1: Sharp edges, grain, hard-edge geometric cuts, paper texture, woodblock roughness

**Strangeness:**
- -1: Clean geometry, ordered grid, rational layout (Mondrian calm)
- +1: Warped geometry, skewed angles, broken grids, diagonals multiply (Lissitzky unhinged)

### Constructivist Visual Elements

- **Turn indicator** — angular badge with diagonal slash, bold uppercase. Color and angle shift with mood.
- **Fold dividers** — geometric marks (diagonal line, triangle, dot pattern) left behind after folds, accumulating as visual history.
- **Foundational line frame** — bold geometric bracket or angular frame instead of a simple underline. Poster-proclamation feel.
- **Reveal composition** — constructivist poster layout: stanzas as geometric blocks, angular author labels, diagonal accent lines.

### Key Animated Moments

**Fold animation:**
- Enhanced perspective fold + constructivist diagonal wipe
- Speed shifts with energy dimension
- High strangeness: fold axis tilts off-perpendicular

**Thinking state:**
- Rotating geometric shapes (circle → triangle → square) instead of bouncing dots
- Speed and complexity match mood
- Text adapts: "the machine considers..." → "the machine convulses..."

**Typewriter reveal:**
- Speed matches energy dimension
- Lines slide in from an angle determined by strangeness (low: horizontal, high: diagonal entry)

**Background canvas:**
- `<canvas>` element with drifting geometric shapes (circles, triangles, lines) at low opacity
- Density, angle, and color respond to mood dimensions
- Kandinsky's "Composition" series as ambient wallpaper

### Audio Layer (`CorpseAudio`)

Optional — only plays if user opts in via settings. Implemented with Web Audio API (no audio files).

| Dimension     | Audio Effect                                                |
|---------------|-------------------------------------------------------------|
| Valence       | Minor/dissonant intervals (-1) ↔ Major/consonant (+1)      |
| Energy        | Sparse, slow oscillation (-1) ↔ Denser layers, rhythm (+1) |
| Texture       | Reverb-heavy, washed (-1) ↔ Dry, mechanical clicks (+1)    |
| Strangeness   | Predictable patterns (-1) ↔ Detuned, aleatoric (+1)        |

## 4. Contextual Reveal

When the user hits "Revive," the machine chooses how to present the poem based on the final mood profile.

### Reveal Archetypes

| Mood Signature              | Archetype        | Description                                                                                    |
|-----------------------------|------------------|------------------------------------------------------------------------------------------------|
| Dark + still + ethereal     | **Séance**       | Lines materialize from fog/blur, slow fade, muted palette, ghostly geometric frames            |
| Dark + energetic + visceral | **Eruption**     | Lines slam in with diagonal motion, bold red/black accents, staccato timing, angular layout    |
| Light + still + ethereal    | **Illumination** | Soft gold radiance, lines appear like light through glass, warm palette, delicate geometry      |
| Light + energetic + visceral| **Manifesto**    | Bold poster layout, large type contrasts, mechanical confidence, strong constructivist grid     |
| High strangeness (any)      | **Delirium**     | Unpredictable angles/positions, warping geometry, varying text sizes, chaos settling into order |

### Archetype Selection Logic

The four dimensions map to archetypes through a simple decision tree:

1. If `strangeness > 0.5` → **Delirium** (regardless of other dimensions)
2. Otherwise, classify valence (dark if < 0, light if ≥ 0) and energy (still if < 0, energetic if ≥ 0) and texture (ethereal if < 0, visceral if ≥ 0):
   - Dark + still/ethereal-leaning → **Séance**
   - Dark + energetic/visceral-leaning → **Eruption**
   - Light + still/ethereal-leaning → **Illumination**
   - Light + energetic/visceral-leaning → **Manifesto**
3. Strangeness (when ≤ 0.5) still acts as a cross-cutting modifier — scaling distortion effects proportionally within the chosen archetype

### Implementation

- `CorpseMood.getRevealStyle()` returns an archetype name + configuration object (timing, motion direction, color overrides, geometry intensity)
- One parametric reveal system, not five separate code paths
- The configuration values are interpolated from the raw mood dimensions, not hard-switched — a poem right on the border between Séance and Eruption gets a blend of both timing/motion characteristics

### Adaptive Reveal Title

| Archetype    | Title                    |
|--------------|--------------------------|
| Séance       | "The Corpse Whispers"    |
| Eruption     | "The Corpse Screams"     |
| Illumination | "The Corpse Glows"       |
| Manifesto    | "The Corpse Declares"    |
| Delirium     | "The Corpse Unravels"    |

## 5. Shareable Artifacts

Poem export as beautiful standalone objects. Additive — new options alongside V1's existing text exports.

### Export Formats

**Standalone HTML:**
- Single self-contained `.html` file, opens in any browser
- Includes poem text, constructivist layout from the reveal, mood-derived color palette, lightweight CSS animations
- No external dependencies, no JavaScript required to read
- Captures the specific reveal archetype — a Séance poem looks different from a Manifesto poem
- Minimal reveal animation plays once on open
- Footer: *"Written by [human] and the machine · Exquisite Corpse"*
- No tracking, no external fetches

**PNG image:**
- Rendered via `html2canvas` or dedicated `<canvas>` render path
- 1200×630 for social sharing, plus taller format for full poem
- Includes geometric accents and mood-colored palette

**Plain text (unchanged from V1):**
- Annotated (with turn/author labels) or clean (just the poem)

### Unchanged from V1

- Clipboard copy works the same
- `.txt` download works the same
- New buttons appear alongside existing ones

## 6. File Architecture

V1 is preserved unchanged. V2 lives in `v2/`.

```
exquisite-corpse/
├── index.html                  # V1 (unchanged)
├── css/corpse.css              # V1 (unchanged)
├── js/                         # V1 (unchanged)
│   ├── corpse-generator.js
│   ├── corpse-state.js
│   ├── corpse-timer.js
│   ├── corpse-export.js
│   ├── corpse-ui.js
│   └── corpse-app.js
│
├── v2/
│   ├── index.html              # V2 entry point
│   ├── css/
│   │   └── corpse.css          # V2 styles (mood-reactive custom properties)
│   └── js/
│       ├── corpse-mood.js      # NEW — mood engine
│       ├── corpse-audio.js     # NEW — opt-in Web Audio ambient layer
│       ├── corpse-reveal.js    # NEW — parametric contextual reveal
│       ├── corpse-artifact.js  # NEW — HTML/PNG export generation
│       ├── corpse-canvas.js    # NEW — background geometric particles
│       ├── corpse-generator.js # FORKED — mood-aware prompts + weighted banks
│       ├── corpse-state.js     # FORKED — integrates mood updates
│       ├── corpse-timer.js     # COPIED — minimal changes
│       ├── corpse-export.js    # FORKED — adds HTML/PNG export
│       ├── corpse-ui.js        # FORKED — mood-reactive rendering
│       └── corpse-app.js       # FORKED — wires mood into lifecycle
```

### Script Load Order (v2/index.html)

1. `corpse-mood.js` — no dependencies
2. `corpse-generator.js` — depends on mood
3. `corpse-state.js` — depends on mood
4. `corpse-timer.js` — standalone
5. `corpse-canvas.js` — depends on mood
6. `corpse-audio.js` — depends on mood
7. `corpse-reveal.js` — depends on mood
8. `corpse-artifact.js` — depends on reveal
9. `corpse-export.js` — depends on artifact
10. `corpse-ui.js` — depends on mood, canvas, reveal
11. `corpse-app.js` — orchestrator, depends on everything

### Module Relationships

- `CorpseMood` is the hub — read by all other modules
- `CorpseState` calls `CorpseMood.update(text)` on every submission (user and app)
- `CorpseApp` calls `CorpseMood.getCSSProperties()` after every state change, applies to root element
- `CorpseAudio` subscribes to mood changes independently
- All modules use the same IIFE/global namespace pattern as V1

## Testing Strategy

- **Mood engine:** Unit-testable in isolation. Feed known text, verify mood deltas and profiles. Verify turn-phase multiplier scaling.
- **Visual:** Manual verification. Open V2 in browser, write lines with known mood characteristics, verify atmosphere shifts. Screenshot comparison across mood extremes.
- **AI voice:** Manual verification. Compare Claude API prompts at different mood profiles. Verify procedural fallback word bank weighting produces noticeably different output.
- **Reveal:** Manual verification across all five archetypes. Write sessions that target each mood signature and verify correct archetype selection and visual treatment.
- **Artifacts:** Verify standalone HTML opens correctly in multiple browsers with no external dependencies. Verify PNG renders at correct dimensions.
- **V1 regression:** Open original `index.html`, confirm it works identically to before.
