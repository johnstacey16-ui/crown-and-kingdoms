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
- In-game About copy now describes the actual local SVG assets, synthesised Web Audio, lightweight multiplayer scope and unverified Xbox/deployment status.
- `persistence.js`: IndexedDB mirrors for the existing localStorage save slots; localStorage remains the compatibility source.
- `sw.js`: versioned same-origin offline shell cache, network-first code refresh, and cached fallbacks.
- Regression checks cover module syntax, load order, storage compatibility, audio resume rejection handling, cache policy and sprite atlas bounds.

## Next implementation phases

### Phase 1 — finish safe engine separation
- Map generation/layout and simulation stepping have been extracted to `js/mapgen.js` and `js/simulation.js`.
- Continue moving menu/HUD/overlay functions into `js/ui.js`, preserving shared global bindings and testing script order after each move.
- Preserve function names and behaviour during extraction; do not rewrite systems while moving them.
- Keep `multiplayer.js` as the separate Supabase Realtime integration.

### Phase 2 — Xbox Edge performance
- Keep simulation stepping at 30 Hz and rendering at the browser's animation cadence.
- Profile 4 kingdoms and large armies before introducing a spatial index.
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
