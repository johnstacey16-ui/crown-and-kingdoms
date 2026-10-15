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
- `js/render.js`: world, building/resource-node/unit/relic/particle drawing, procedural sprite artists, terrain tile/detail/hill and cached terrain-chunk rendering; local atlas sprites remain backed by procedural drawing fallbacks.
- `js/assets.js`: optional sprite-atlas registration, metadata/frame validation, asynchronous image loading and animation-frame lookup, with procedural fallback preserved.
- `js/ui.js`: shared title-background/generic list rendering and framed panels, match-result/runtime-error overlays, campaign list/briefing/objective drawing, performance overlay, strategic overview, technology tree, controller help/About screens, pause-menu model/drawing, controller-remap labels/drawing, save-slot presentation, and in-match resource-bar/HUD drawing extracted without changing the classic-script shared-state model. Controller navigation and rebinding remain in `js/input.js`; campaign progression remains in `js/campaign.js`; save serialization remains in `js/save.js`.
- The renderer adds subtle armour highlights when infantry or ranged armour research is active; campaign objective HUD shows up to five active objectives. Keep these overlays low-cost and verify at gameplay zoom on target hardware.
- Large-army unit separation reuses its spatial bucket map across simulation steps, avoiding a fresh map allocation for each pass. The path still needs measured performance verification at 400 units on the target browser. Defeated units are excluded from both the small-army linear pass and the large-army grid pass; regression guards cover both paths. This correctness guard is not evidence of a measured frame-rate improvement. The nearest-foe spatial index also omits defeated and garrisoned units during rebuild, while lookups revalidate candidates that may have changed since indexing. `tests/foe-grid-live-units.test.mjs` covers this filter and the stale-candidate safety check.
- In-game About copy now describes the actual local SVG assets, synthesised Web Audio, lightweight multiplayer scope and unverified Xbox/deployment status.
- `persistence.js`: IndexedDB mirrors for the existing localStorage save slots; localStorage remains the compatibility source.
- `sw.js`: versioned same-origin offline shell cache, network-first code refresh, and cached fallbacks.
- Regression checks cover module syntax, load order, storage compatibility, audio resume rejection handling, cache policy, sprite atlas bounds and safe audio voice classification when an entity has no unit definition.
- The reported runtime error reading `mt` from an undefined unit definition was guarded in `js/audio.js` and covered by a focused regression test. This addresses that specific failure path; it is not a guarantee that all runtime errors are eliminated.

## Next implementation phases

### Phase 1 — finish safe engine separation
- Map generation/layout, simulation stepping and world rendering have been extracted to `js/mapgen.js`, `js/simulation.js` and `js/render.js`.
- **Completed this pass:** move the technology tree, objectives, controller help/About screens, pause-menu model/drawing, and controller-remap presentation into `js/ui.js`; preserve shared state and controller navigation.
- **Completed this pass:** moved `drawTitle()`, `drawSetup()` and `drawOpts()` into `js/ui.js`. `setRows()`, `optsItems()`, menu state, settings persistence and controller handlers remain in `js/menus.js`; the module boundary is now presentation versus menu model/actions.
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
- Keep IndexedDB backups for game slots; synchronous exceptions and rejected promises in the optional backup mirror must not block the primary localStorage save (guarded in `js/save.js`, with regression coverage in `tests/save-validation.test.mjs`).
- **Implemented, automated verification pending:** active local play attempts a save every 60 seconds into one rolling `ck_autosave` slot; load-menu recovery exposes that checkpoint separately from the three manual slots. Periodic and pause/blur-triggered autosaves are suppressed while multiplayer is running.
- **Still required:** verify storage-quota failures, interrupted writes, IndexedDB restore ordering and recovery through a live browser; a source-level test does not establish durable storage on Xbox Edge.
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
- The pause-menu, controller-remap, in-match HUD, save-slot presentation, shared title/list renderers and diagnostic/panel primitives now live in `js/ui.js`; controller input/rebinding remains in `js/input.js`, and save serialization remains in `js/save.js`. Next work should audit the remaining presentation logic already shared across `js/menus.js` and `js/campaign.js` rather than move gameplay state.


### Engine refactor update

`js/kingdom.js` now owns diplomacy, tribute, and automated villager-priority logic. It loads before `engine.js`, remains available offline through the service-worker cache, and is covered by the standalone regression suite. The refactor preserves the existing shared classic-script state and controller-first interface.


### Campaign module

Campaign scenarios, mission progression, objectives, briefing flow and raid-event dispatch now live in `js/campaign.js`, loaded before the core engine and included in offline caching and regression harnesses.


### Economy module

Market trade-row generation and buy/sell transaction logic now live in `js/economy.js`; current pricing, price drift and resource validation are preserved. The module is included in the service-worker cache and simulation harness.


### Controller menus module

The new-game setup menu, options menu, title menu, controller handlers and score-limit options now live in `js/menus.js`. The engine still owns shared state and menu drawing primitives; the new module loads before the engine and is cached offline.


### Minimap module

Minimap terrain refresh, world/minimap coordinate transforms, entity filters and minimap drawing now live in `js/minimap.js`, with viewport and objective markers preserved and offline caching enabled.


### Pathfinding module

A* route search, diagonal corner checks, path reconstruction and route-target helpers now live in `js/pathfinding.js`. The module loads before kingdom automation, is cached offline and is covered by pathing and simulation regression harnesses.

- Campaign arc ordering, mission selection, briefing layout and campaign controller handlers are grouped in `js/campaign.js`; shared title-background rendering remains in the core UI.


### In-match HUD extraction follow-on — 15 October 2026

- Moved `ico()`, `topbar()` and `hud()` from `engine.js` into the existing `js/ui.js`, preserving function names and bodies.
- The main draw loop still invokes `hud()` in play mode; `panel()`, quick-bar logic, minimap logic, selection state and command input remain owned by their existing modules/core code.
- Score mode, King of the Hill and Sudden Death source tests now compose `js/ui.js` into their source bundle so HUD assertions inspect the real combined runtime. `tests/hud-ui-extraction.test.mjs` protects the new function ownership and victory-mode status labels.
- This is a maintainability extraction, not a measured performance improvement. Continue to validate the canvas and controller experience in a real browser and on Xbox hardware.


### Save-slot presentation extraction follow-on — 15 October 2026

- Moved the `slotItems()` menu model and `drawSlots()` presentation into `js/ui.js`, preserving the current three-slot labels, save overwrite/load callbacks, unreadable-slot message and controller-facing help text.
- `refreshSlots()`, `openSlots()`, `slotsCtl()`, the save payload format, localStorage compatibility and IndexedDB backup path remain in their previous owners. The extraction changes presentation ownership only.
- `tests/save-slot-ui-extraction.test.mjs` guards the separation between slot labels/drawing and existing save/load orchestration.


### Shared menu-rendering extraction follow-on — 15 October 2026

- Moved `titleBg()` and `drawList()` to `js/ui.js`, preserving both bodies and function names. The title menu, new-game/options lists, campaign list/briefing and save-slot screen continue to call the same global helpers.
- `panel()` remains in `engine.js` as the reusable panel primitive used across gameplay and menu screens.
- Added `tests/shared-menu-rendering-ui-extraction.test.mjs` to protect single ownership and all current caller groups.


### Shared panel and diagnostic overlay extraction — 15 October 2026

- Moved `panel()`, `shade()` and `drawError()` into `js/ui.js` with their bodies preserved. The end-of-match renderer and runtime exception handler still call the same functions by name.
- `CK_ERR`, the `try/catch` frame boundary and the simulation halt-on-runtime-exception behaviour remain in `engine.js`; only drawing moved.
- `tests/core-ui-primitives-extraction.test.mjs` protects the rendering function ownership and both existing runtime call paths.


### Campaign presentation separation — 15 October 2026

- Moved `cmpHud()`, `cmpObj()`, `wrapT()`, `drawCamp()` and `drawBrief()` into `js/ui.js`. Campaign definitions, `CAMP_ARCS`, objective/event checks, mission start/completion and controller handlers remain in `js/campaign.js`.
- The campaign content source test now composes `js/ui.js` before `js/campaign.js`, matching the actual page script order. `tests/campaign-ui-extraction.test.mjs` guards the ownership boundary.


### Main menu/setup/options presentation separation — 15 October 2026

- Moved `drawTitle()`, `drawSetup()` and `drawOpts()` into `js/ui.js` with existing names and bodies preserved.
- `setRows()`, `optsItems()`, `titleCtl()`, `setupCtl()` and `optsCtl()` remain in `js/menus.js`, preserving setting values, wraparound navigation and `sset()` persistence calls.
- Added `tests/menu-screen-ui-extraction.test.mjs` to protect the split and verify the presentation still uses the existing menu models.


### In-game command overlay extraction — 15 October 2026

- Moved the `DS` description table, `stt()` stat label helper, `drawRadial()`, `drawCg()` and `quickBar()` into `js/ui.js`. All drawing remains on the existing canvas and function names are unchanged.
- The `draw()` loop still decides when the radial/control-group overlays appear; radial command state, group assignment/focus and controller processing remain in `engine.js`/`js/input.js` as before.
- Added `tests/command-overlay-ui-extraction.test.mjs` to guard the ownership boundary and ensure drawing calls still connect to the existing command state.


### Particle renderer separation — 15 October 2026

- Moved `drawP()` from `engine.js` into `js/render.js`, next to the existing `PMAX`/`PT` particle state and world draw path.
- Particle emission and simulation/lifetime updates (`emit()`, `updP()`) remain in `engine.js`. The renderer still calls `drawP()` in the same place before projectile strokes.
- Added `tests/particle-renderer-extraction.test.mjs` to guard the script ordering, renderer ownership and unchanged particle-update/draw connection. This is a structural change only; no performance improvement is claimed without profiling.


### World-object and sprite-art extraction — 15 October 2026

- Moved the building/node artwork data and painters (`BG`, `CK_TEX`, `BP`, `paintBld()`, `drawBld()`, `paintNode()`, `drawNode()`) and procedural unit/siege/ship artists (`SPC`, `spr()`, `blit()`, `MP`, `man()`, `mnt()`, `sgp()`, `shp()`, `paintUnit()`, `USZ`) from `engine.js` into `js/render.js` without changing function names or drawing bodies.
- `setZoom()`, particle emission/lifetime simulation, world state, game rules, selection and controller actions remain in their original owners. The renderer was already loaded before `engine.js`; no extra script was added.
- `tests/world-object-renderer-extraction.test.mjs` verifies single ownership and confirms world draw paths still call the moved painters. This is a structural refactor; visual quality and frame time still require real-browser/Xbox verification.


### Terrain palette ownership — 15 October 2026

- Moved the deterministic tile hash (`hsh()`), foliage colour/shading cache (`GC`, `SC`, `shd`, `GCd`, `GCl`) and `PALS` terrain palette definitions into `js/render.js`.
- Tile and detail painters already live in that module, so palette ownership is now adjacent to use. `engine.js` no longer declares renderer-only palette state.
- Added `tests/terrain-palette-renderer.test.mjs` to check single ownership and the palette call path. This is code organisation, not a measured frame-time gain.


### Shared canvas primitive ownership — 15 October 2026

- Moved the generic canvas shape/progress primitives `bar()`, `dia()` and `poly()` to `js/render.js` and the text helper `tx()` to `js/ui.js`.
- This preserves their global classic-script function names and existing callers. The renderer/UI scripts already load before `engine.js`; `js/minimap.js` continues to use `dia()` from the renderer.
- Added `tests/canvas-primitives-ownership.test.mjs` to protect one-owner declarations and the current load/caller order.


### Large-army hostile-target index — 15 October 2026

- Added an 8-world-unit bucket grid for unit-to-unit target acquisition. The index rebuilds lazily on the first query after each simulation step invalidates it, then shares those buckets across combat, attack-move and patrol target queries for that step.
- Queries inspect nearby cells, perform the same exact Euclidean radius check, and keep the hostile/dead/garrisoned filters and original array-order tie-break. Siege units still prioritise buildings in range; other units still fall back to the existing building scan when no hostile unit is in range.
- Buckets reuse their arrays across rebuilds to limit per-tick garbage. `tests/simulation-smoke.test.mjs` compares indexed targets with the original linear reference over a 368-unit synthetic army, including ties, dead/garrisoned targets and an invalidated rebuild. `tests/spatial-target-index.test.mjs` protects index wiring.
- No frame-rate gain is claimed until the 100–400 unit workloads are profiled on the target browser/Xbox runtime.

### World entity creation extraction — 15 October 2026

- The three world entity factory functions (`addN`, `addB`, `addU`) now live in `js/entities.js`, separating placement/initialisation from the top-level engine.
- The module loads after shared state and kingdom automation helpers, before campaign and engine code. Existing global function names and shared state access are preserved for the classic-script architecture.
- Added ownership/load-order/offline-cache regression coverage and wired the module into `scripts/check-game.mjs`.
- This is a maintainability boundary, not a performance claim. Start-up, save/load, map generation and Xbox Edge still need full regression/runtime verification.

### Full new-game setup extraction — 15 October 2026

- `js/mapgen.js` now owns both terrain/connectivity helpers and the complete `newGame()` routine. Engine startup and controller/campaign entry points still call the same global function name.
- The extracted routine retains strict mode explicitly, because it previously inherited the `engine.js` strict directive.
- Added a focused ownership and runtime-wiring test. This makes map initialization easier to isolate from rendering, frame scheduling and controller orchestration without changing the classic-script model.
- Regression, save/load and physical Xbox startup are still required before this boundary should be treated as release-verified.

### Rival AI subsystem extraction — 15 October 2026

- Moved the rival AI subsystem from `js/simulation.js` into dedicated `js/ai.js`; core simulation remains responsible for fixed-step unit/building updates and calls the same `ai(dt)` entry point.
- Preserved shared global function names for the classic-script architecture. The AI script loads after simulation and before pathfinding-dependent runtime use, then is syntax-checked and cached for offline use.
- Updated source-regression bundles to include the extracted subsystem and added an ownership/load-order regression test. Physical Xbox runtime profiling remains a separate release gate.

### Save/load regression resolved — 15 October 2026

- Current `main` HEAD at the time of this checkpoint: `10a9a2f7209236385b57d31e7f71f1e844147d78` (`fix: accept indexed entity references in valid saves`). The subsequent commits in this documentation update do not change game runtime code.
- GitHub Actions run [#923](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38742305191) completed successfully. Its `node-checks` job passed script/source invariants, every standalone `tests/*.test.mjs` regression test, and sprite-atlas metadata/frame-bound validation.
- The preceding campaign save/load round-trip failure came from an over-escaped digit matcher in the indexed entity-reference validator. The current validator accepts valid references such as `u12` while retaining the range check, and the campaign round-trip passes in the full CI suite.
- This checkpoint is automated-test evidence only. Live browser, deployment, storage-quota/interrupted-write behaviour, and physical Xbox Series S / Edge performance remain unverified.

### Current CI checkpoint — 15 October 2026

- Latest completed green workflow at this checkpoint: [run #926](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38744134109), for commit `488638d5593385382bbea4378973ef3fb67df441`.
- All three configured stages passed: source parsing/invariants, all standalone regression tests, and local atlas metadata/frame-bound validation.
- The campaign save/load indexed-reference rejection is fixed and covered by the passing regression suite. Do not reopen it without a new failing reproduction.
- CI does not prove browser runtime correctness or Xbox hardware performance. The next technical step is behavioural runtime coverage and repeatable small/medium/large simulation profiling, not more documentation-only checkpoints.

