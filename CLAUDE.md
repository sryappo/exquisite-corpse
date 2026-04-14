# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A surrealist "Exquisite Corpse" collaborative writing web app. A solo user and the app take turns writing 3-line stanzas. After each turn, the first two lines are "folded" away — only the last line (the "foundational") remains visible as a prompt for the next turn. After 4+ turns, the user can "Revive" to reveal the full poem and export it.

## Development

Static vanilla HTML/CSS/JS — no build tools, no bundler, no package manager. Open `index.html` directly in a browser to run.

## Architecture

All JS uses the IIFE pattern exposing global namespace objects. Script load order matters (set in `index.html`):

1. **`corpse-generator.js`** (`CorpseGenerator`) — Hybrid text engine. Tries Claude API first (key in localStorage), falls back to procedural generation with word banks, rhyme families, 30+ sentence templates, and 5 weighted generation strategies (template fill, rhyme, word mutation, syntactic echo, non sequitur).
2. **`corpse-state.js`** (`CorpseState`) — Central state machine. Phases: `IDLE → USER_TURN → FOLDING → APP_TURN → FOLDING → ... → REVEAL`. Observer pattern via `onStateChange(callback)`. Odd turns = user, even turns = app.
3. **`corpse-timer.js`** (`CorpseTimer`) — `setInterval`-based countdown (30-90s). Supports normal (auto-fold) and ballistic (dissolve) expiry modes.
4. **`corpse-export.js`** (`CorpseExport`) — Formats poem text (annotated or clean), clipboard copy, and `.txt` download via Blob URL.
5. **`corpse-ui.js`** (`CorpseUI`) — Builds entire DOM on `init()`. Handles fold/unfold CSS animations (`perspective + rotateX`), typewriter line reveals, ballistic dissolve, staggered poem reveal on Revive.
6. **`corpse-app.js`** — Orchestrator (anonymous IIFE). Wires state changes to UI, handles fold/revive/export/settings/keyboard events, manages app turn generation flow with thinking delay.

## Key Design Details

- **Turn 1 validation:** 3 lines, min 2 words each (line 3 allows 1 word). **Turn 3+:** 2 lines from user (same rules). Emoji counts as a word.
- **App turn flow:** thinking delay (1.5-2.5s) → `CorpseGenerator.generate(foundational)` → typewriter reveal → auto-fold.
- **Claude API:** Direct browser fetch to `api.anthropic.com/v1/messages` with `anthropic-dangerous-direct-browser-access` header. Key stored in localStorage under `exquisite_corpse_api_key`.
- **CSS palette:** `#0a0a0f` bg, `#e8dcc8` parchment text, `#c9a84c` gold accents, `#8b6abf` violet for app lines, `#8b1a1a` red for errors/ballistic. Georgia serif for display, Courier New mono for body.
- **Fold animation:** `perspective(800px) rotateX(-90deg)` with 800ms transition. Unfold/reveal uses staggered `translateY` per line.
