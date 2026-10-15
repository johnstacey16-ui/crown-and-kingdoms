# Browser Technology Upgrade Roadmap

This roadmap tracks the controller-first Canvas 2D game runtime. Preserve the existing game and classic-script load order while modules are separated; shared top-level lexical bindings are intentional until a later, separately tested ES-module conversion.

## Completed

- `styles.css`: shared full-screen canvas presentation and controller-first browser behaviour.
- `assets/atlas-manifest.json`: external sprite atlas metadata loaded asynchronously with safe fallbacks.
- `js/config.js`: unit, building, age, technology and balance definitions.
- `js/state.js`: shared runtime state, map-size buffers and core helpers.
- `js/audio.js`: procedural SFX, spatial audio and adaptive music.
- `js/save.js`: save-slot serialisation and restoration functions.
- `js/input.js`: controller polling, selection, orders and menu navigation.
- `js/mapgen.js`: map generation/layout helpers extracted from the main engine.
- `js/simulation.js`: simulation stepping and related simulation systems extracted from the main engine.
- `js/render.js`: world, unit, relic, terrain tile, hill and cached terrain-chunk rendering; local atlas sprites remain backed by procedural drawing fallbacks.
- `js/ui.js`: performance overlay, strategic overview, technology tree, objectives and controller help/About screens extracted without changing the classic-script shared-state model.
- The renderer adds subtle armour highlights when infantry or ranged armour research is active; campaign objective HUD shows up to five active objectives. Keep these overlays low-cost and verify at gameplay zoom on target hardware.
- Large-army unit separation reuses its spatial bucket map across simulation steps, avoiding a fresh map allocation for each pass. The path still needs measured performance verification at 400 units on the target browser.
- In-game About copy now describes the actual local SVG assets, synthesised Web Audio, lightweight multiplayer scope and unverified Xbox/deployment status.
- `persistence.js`: IndexedDB mirrors for the existing localStorage save slots; localStorage remains the compatibility source.
- `sw.js`: versioned same-origin offline shell cache, network-first code refresh, and cached fallbacks.
- Regression checks cover module syntax, load order, storage compatibility, audio resume rejection handling, cache policy, sprite atlas bounds and safe audio voice classification when an entity has no unit definition.
- The reported runtime error reading `mt` from an undefined unit definition was guarded in `js/audio.js` and covered by a focused regression test. This addresses that specific failure path; it is not a guarantee that all runtime errors are eliminated.

## Next implementation phases

### Phase 1 — finish safe engine separation
- Map generation/layout, simulation stepping and world rendering have been extracted to `js/mapgen.js`, `js/simulation.js` and `js/render.js`.
- **Completed this pass:** move the technology tree, objectives and controller help/About screens into `js/ui.js`; preserve shared state and controller navigation.
- **Next structural task:** map dependencies before moving the remaining HUD, pause/menu, save-slot and campaign presentation code. Keep extraction behaviour-preserving; do not mix gameplay changes into the move.
- After extraction, update `index.html`, `sw.js`, `scripts/check-game.mjs` and the relevant tests in the same change. Check for duplicate top-level lexical declarations before committing.
- Preserve function names and behaviour during extraction; do not rewrite systems while moving them.
- Keep `multiplayer.js` as the separate Supabase Realtime integration.

### Phase 2 — Xbox Edge performance
- Keep simulation stepping at 30 Hz and rendering at the browser's animation cadence.
- A half-tile spatial bucket grid is already used for unit separation and its map allocation is now reused. Profile 4 kingdoms and large armies on target hardware before further tuning.
- Retain existing chunk rendering; add viewport culling only where it does not hide UI/world effects.
- Debounce resize recalculation (implemented).
- Reduce hot-loop allocations only when tests and profiling show the affected path.

### Phase 3 — persistence
- Keep localStorage for settings and legacy save compatibility.
- Keep IndexedDB backups for game slots.
- Add periodic autosave only after save payload integrity and pause/campaign edge cases are covered.
- Add save thumbnails only with size quotas and failure-safe fallbacks.

### Phase 4 — audio and immersion
- Procedural audio and resume-rejection handling are implemented.
- Keep master/music/SFX/ambient volume groups and lazy AudioContext creation.
- Verify suspension/resume behaviour in the target browser before changing the simulation clock.

### Phase 5 — graphics
- Keep Canvas 2D as the current renderer.
- Profile fog-of-war and visibility work before changing its data representation.
- Smooth camera interpolation, minimap enhancements and day/night themes are future improvements.
- WebGL 2 shaders remain deferred until Canvas performance demonstrates a sustained bottleneck.

### Phase 6 — multiplayer resilience
- Improve reconnect handling and room-code normalization.
- Add heartbeat-based stale presence cleanup and duplicate-session replacement.
- Do not invent a database-backed fallback transport: the current architecture avoids database writes and relies on Supabase Realtime broadcasts/presence.

### Phase 7 — explicitly deferred
- Web Workers: only after profiling proves map generation or pathfinding causes frame stalls.
- WebGL 2.0: only after measured Canvas 2D frame-rate limits.
- WebAssembly/AssemblyScript: not part of the current upgrade.
- Xbox achievements, cloud saves, matchmaking and cross-play: out of scope.

## Verification policy

A passing GitHub Actions run verifies source invariants and the automated regression suite, not Xbox hardware performance or a successful Vercel deployment. Record those separately when directly verified.


## Current continuation checkpoint — 15 October 2026

- Keep the three maintained Markdown files as the documentation source of truth: root README, parity roadmap and this browser roadmap. Do not recreate completed prompt documents.
- The current audio classifier guard is a small runtime-hardening fix, not a reason to change the audio architecture. Preserve lazy AudioContext creation, browser autoplay handling and graceful fallback.
- The next refactor is UI extraction, but gameplay stability takes precedence if a new runtime error is reported. Do not change save payloads, controller mappings, simulation tick order or multiplayer message contracts as part of a code-movement-only change.
- Before claiming release readiness, verify the exact latest commit's checks and deployment status. The public Vercel build was previously blocked by a build-rate limit; no Xbox or live-browser acceptance should be inferred from source checks alone.


### UI extraction follow-on — 15 October 2026

- Moved `drawPerfOverlay(dt)`, `ovr()` and `drawOv()` from `engine.js` into `js/ui.js` without rewriting their function bodies.
- Added `js/ui.js` to `index.html` before `engine.js` (and before simulation's script slot), the service-worker core cache, source syntax checks and browser-foundation regression checks.
- The module depends on shared classic-script globals at call time; no new duplicate state declarations were introduced. This is a maintainability extraction only and does not claim a performance improvement.
- Next extraction should target a cohesive UI group with minimal hidden dependencies; avoid moving save-slot UI or campaign controls until their shared state and action dependencies have been mapped.


### Engine refactor update

`js/kingdom.js` now owns diplomacy, tribute, and automated villager-priority logic. It loads before `engine.js`, remains available offline through the service-worker cache, and is covered by the standalone regression suite. The refactor preserves the existing shared classic-script state and controller-first interface.


### Campaign module

Campaign scenarios, mission progression, objectives, briefing flow and raid-event dispatch now live in `js/campaign.js`, loaded before the core engine and included in offline caching and regression harnesses.


### Economy module

Market trade-row generation and buy/sell transaction logic now live in `js/economy.js`; current pricing, price drift and resource validation are preserved. The module is included in the service-worker cache and simulation harness.
