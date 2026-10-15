# Crown & Kingdoms — Gameplay and Content Roadmap

**Reviewed:** 15 October 2026  
**Target:** controller-first browser RTS, especially Xbox Series S / Microsoft Edge.

This roadmap tracks meaningful remaining work, not a claim of full Age of Empires II: Definitive Edition parity. “Present in source” means an implementation exists; it does not mean it is balanced, bug-free or validated on physical Xbox hardware.

## Status definitions

- **Present:** identifiable implementation exists.
- **Partial:** simplified implementation or known gaps remain.
- **Unverified:** requires a live browser, network, deployment or physical-controller test.
- **Gap:** the requested capability is not yet implemented to the intended standard.

## Current foundation

The project already contains four-age progression; economy and trading; construction and repair; ground, siege and naval units; research and unit upgrades; rival AI; formations and stances; fog of war and minimap; procedural/fixed maps; campaign missions and timed events; multiple victory modes; local save/load; controller-oriented menus; procedural audio; local SVG sprite atlases with fallbacks; and a lightweight Supabase Realtime lobby.

The main runtime is split into classic scripts. `engine.js` remains responsible for top-level orchestration, frame scheduling, game state and controller command integration. `js/ui.js` owns screen presentation, `js/render.js` owns world drawing, `js/minimap.js` owns minimap rendering and fog-of-war visibility, and `js/campaign.js` now owns shared campaign helpers for Town Centre lookup, building/unit counts, military counts, initial unit groups and completed scenario buildings. Dedicated modules also own AI, simulation, maps, pathfinding, economy and related systems. Preserve the current script order and shared globals during further refactoring.

## Priority 1 — correctness and release confidence

### 1.1 Runtime stability
- **Unverified:** play complete skirmishes and campaign missions from cold start through victory/defeat, including pause/resume, save/load, age-up, queued production, garrison/unload, diplomacy and naval combat.
- Reproduce every newly reported runtime error, fix the underlying path and add a focused regression test. The campaign timed-raid helper now exits safely if the enemy Town Centre has already been destroyed, with a regression assertion in `tests/campaign-progression.test.mjs`. Relic objectives now require the relic to be stored in a completed monastery; `tests/campaign-relic-objectives.test.mjs` guards all three relic-goal checks.
- Check error-overlay recovery and ensure a caught frame error cannot leave the game silently half-running.
- **Acceptance:** automated checks pass and the critical flows above are exercised in a real browser. Xbox acceptance remains a separate gate.

### 1.2 Save and offline compatibility
- **Present:** localStorage compatibility and IndexedDB backup/restore.
- **Implemented in source:** `loadG()` rejects malformed JSON, invalid simulation time, unsupported map dimensions, missing or inconsistent team arrays, malformed player-statistics shape, invalid terrain encodings, invalid resource values, unknown unit/building/resource-node types, malformed entity coordinates, and out-of-range or malformed unit/building/relic relationship references before replacing the current game state. `tests/save-validation.test.mjs` covers malformed payload rejection and verifies the current state is left untouched.
- **Still required:** run the complete Node regression suite against the latest commit and exercise valid older saves; malformed-payload guards do not prove backward compatibility.
- **Partial/unverified:** exercise the new guard and older save payloads in the complete Node suite; test interrupted writes, quota/storage denial, campaign progression, diplomacy and mode-specific state through save/load; test service-worker updates from older cached versions.
- Add autosave only after save integrity and recovery paths are proven safe. Avoid incompatible schema changes without defaults/migration tests.

### 1.3 Controller and accessibility
- **Present:** controller navigation, command menus, pause/resume and remapping.
- **Unverified:** test focus/selection visibility, every menu's B/Back behaviour, repeated button presses, disconnect/reconnect, couch-distance readability and gamepad differences in Edge.
- Keep primary gameplay possible without mouse or keyboard; do not make a feature depend on hover-only interaction.

## Priority 2 — gameplay depth

### 2.1 Technologies and unit progression
- **Present:** age-gated research and shared effects for many upgrades, including infantry sword-line ranks, Pikeman/Halberdier, Cavalry Armour, Conscription and Husbandry. Husbandry increases mounted-unit movement by 10%; the implementation includes the mounted special-unit roster and AI research valuation.
- **Partial:** audit the complete technology list for correct prerequisites, costs, research duration, existing-unit effects, newly trained unit effects, AI valuation and visible battlefield feedback.
- Ensure each technology has a real, testable gameplay effect rather than a UI-only entry. Check stacking, repeated research prevention and save/load persistence.
- Keep balance values labelled as project rules; do not imply exact official AoE2 values unless independently verified.

### 2.2 AI strategy and counterplay
- **Present:** economic expansion, composition-aware research, defensive response, grouped attacks, siege targeting, repairs and several naval behaviours.
- **Partial:** AI naval threat assessment now distinguishes combat-capable warships from fishing ships, transports and trade cogs, so economic vessels do not trigger combat-ship counter priorities. `tests/ai-naval-threat-classification.test.mjs` guards this classification. Still improve strategy across all ages and map types; test whether AI gathers, advances, builds, produces counters, protects its economy and attacks with coherent mixed armies rather than oscillating or stalling.
- Add deterministic scenario tests for key decisions, then play longer matches to assess strategy quality. Static source assertions alone cannot establish competent AI.

### 2.3 Naval and map systems
- **Present:** docks, fishing, trade cogs, warships, ship repair/retreat logic, named layouts and connectivity diagnostics.
- **Partial:** verify transport/loading/unloading, water access, land/water route failures, ship targeting, shore interactions and AI naval objectives on island, coastal and mixed maps.
- Ensure procedural map retries terminate safely and every generated starting position has valid routes and resources.

### 2.4 Campaign and scenarios
- **Present:** an 18-mission campaign structure, objective evaluation, timed events and progression/unlocks, including The Causeway Muster and The Siege of Tidewatch.
- **Partial:** play every mission to verify briefing, objective order, timer/event scheduling, victory/defeat conditions, unlocks and save/resume. Expand variety only after existing missions are completable.
- Add automated checks for mission prerequisites and objective reachability; reserve actual mission completion for browser playtests.

### 2.5 Economy, diplomacy and match rules
- **Present:** gathering, farms and reseeding, market trading, relic income, trade routes, tribute, player-controlled Enemy/Neutral/Ally relationships, victory modes and population-limit options.
- **Partial:** test economy pacing, inaccessible resources, failed trade routes, allied support, hostility transitions and each victory condition. Treaty duration, AI-negotiated diplomacy, custom tribute amounts and comprehensive allied victory rules remain gaps.
- Keep population settings distinct from actual housing capacity; the chosen ceiling is not a free grant of population slots.

## Priority 3 — visuals, audio and feedback

- **Present:** original SVG atlas assets, animation metadata, procedural fallbacks, team-colour cues, equipment/rank cues, terrain details and synthesised spatial/adaptive audio.
- **Partial:** make unit ranks and equipment more distinct at gameplay zoom; improve building silhouettes, animation readability, terrain contrast and ownership cues without obscuring selection or health bars.
- **Unverified:** inspect real frames in a browser and on a TV at normal viewing distance. Atlas metadata validation does not confirm visual quality or correct animation playback.
- Verify audio autoplay/resume, mute/volume controls and graceful handling when browser audio is unavailable.

## Priority 4 — performance and scale

- **Present:** fixed-step simulation, terrain chunk rendering, spatial bucket targeting and pooled unit-separation buckets. The unit-separation grid is owned by `js/simulation.js`, beside the movement helper it uses, while preserving the existing `sep()` entry point.
- **Unverified:** profile 200- and 400-unit matches with four kingdoms on Xbox Series S / Edge. Record frame time, simulation step cost, memory and input latency; compare quiet economy, dense combat, naval scenes and fog-of-war-heavy maps.
- Only add viewport culling, further spatial indexes or reduced update rates when measurements identify a bottleneck and tests preserve gameplay behaviour.
- Do not describe spatial indexing as a proven FPS improvement until measured on target hardware.

## Priority 5 — multiplayer boundary

- **Present:** Supabase Realtime lobby/player markers and presence integration.
- **Gap:** authoritative synchronization of a complete RTS match is not implemented. The current lobby is not online multiplayer gameplay.
- Improve reconnect behaviour, room-code normalization, stale-presence cleanup and duplicate-session handling within the current broadcast/presence design. Do not introduce Postgres Changes or database writes as an assumed fallback.
- Host migration is not part of the current plan; the intended rule is that host loss ends the match.

## Engine refactoring rules

Continue extracting only cohesive responsibilities from `engine.js`; avoid moving functions merely to reduce line count. For every extraction:

1. Preserve public function names, shared state and controller behaviour.
2. Keep classic-script dependency order valid.
3. Update `index.html`, `sw.js`, `scripts/check-game.mjs` and tests in the same commit when affected.
4. Add or update a focused ownership/integration test.
5. Run the full automated check set and report actual results.
6. Do not mix behaviour changes into a structural-only refactor unless the change has its own regression coverage.

## Definition of done

A feature is **implemented** only when its code path is present and reachable. It is **regression-checked** when the relevant automated tests pass. It is **playtested** only after the behaviour has been exercised in a live browser. It is **Xbox-verified** only after direct testing on the target console/browser. Deployment is confirmed only from the exact commit's deployment status.

## Automated checks

Run with Node.js 22 or a compatible current release:

```sh
node scripts/check-game.mjs
for test in tests/*.test.mjs; do node "$test" || exit 1; done
node tests/validate-atlas.mjs
```

GitHub Actions discovers all `tests/*.test.mjs` files. These checks cover source syntax, invariants, focused regression cases and atlas metadata; they do not replace complete-match, network, deployment or Xbox testing.

## Next work order

1. Run the complete current check suite and fix any failures before additional refactors. Save validation, sprite-atlas validation, minimap/fog ownership and unit-separation ownership checks have passed in earlier runs. Campaign helpers have now moved out of `engine.js`; the latest full suite must confirm the new ownership and script order.
2. Exercise cold start, pause/resume, save/load and representative campaign/skirmish flows in a browser.
3. Audit technology effects and AI decisions with focused tests where gaps are found.
4. Test naval/map connectivity and campaign completion across scenarios.
5. Profile large armies and improve the most visible graphics defects based on live observation.
6. Validate the exact deployment and perform physical Xbox controller/performance testing when available.
