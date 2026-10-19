# Crown & Kingdoms — Authoritative Audit and Delivery Register

**Established:** 19 October 2026  
**Initial audited code:** main at 4130ad0d4974d2ce8f903ca1d59835ce121dff3a  
**Target:** browser game running in Microsoft Edge on Xbox Series S first, and Xbox Series X  
**Gameplay benchmark:** Age of Empires II: Definitive Edition, Xbox controller experience; base/included features tracked separately from paid DLC and native platform services.

This is the reconciled, evidence-based work register created from three independent audits and actual source/CI inspection. It supersedes unsupported conclusions in those audits; it does not replace the historical AOE2_PARITY_ROADMAP.md, which remains a technical change log. Updates must cite a specific commit, test run and environment.

## Current verified CI baseline — 19 October 2026

**Both GitHub Actions workflows are green at commit [8440b461712ae491499d8d08945d2b3b1c086885](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/8440b461712ae491499d8d08945d2b3b1c086885).**

- [Complete regression workflow, run 39205968121](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39205968121): **133/133 standalone test files passed** and **19/19 isolated automated campaign mission simulations passed**.
- [Source/atlas validation workflow, run 39205968115](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39205968115): **success**.
- There are **zero known failing automated regression files on that commit**. Future commits require their own matching CI verification. Earlier counts (38, 34, 29, 19, 1 failing) appearing below are dated historical checkpoints, not the current result.
- **This verifies only the existing automated coverage:** physical Xbox Series S/X Edge gameplay, complete human-controller match and mission sessions, reliable long-game saves, actual shared multiplayer and Xbox DE reference-feature fidelity still require dedicated acceptance evidence.

## Ground rules

- Two independent completion gates are required: **functional readiness** (the game works) and **reference fidelity** (the agreed Xbox reference mechanics and included base content match). A working prototype is not necessarily reference-equivalent.
- Classify each item as VERIFIED (named test or hardware session), IMPLEMENTED/UNVERIFIED, PARTIAL, MISSING, DIFFERENT, BROKEN, or INVESTIGATE. Never convert a source-file existence check into full gameplay acceptance.
- Every regression failure is classified as **runtime defect**, **obsolete source assertion**, **fixture/environment issue**, or **unresolved**. Fix the behaviour or modernise coverage; never merely delete assertions to make CI green.
- Prioritise a complete single-player skirmish, followed by real two-human shared matches, controller parity, campaign acceptance, base content, polish and performance. Independent workstreams may proceed where dependencies allow.
- Keep custom modes/presets distinguishable from Xbox DE-equivalent defaults. Do not silently add unrelated new mechanics.
- Reproduce observable gameplay and controller experience with original code, art, sounds, story and names as appropriate; do not redistribute proprietary reference-game assets or campaign scripts.
- Commit directly to main per existing owner development policy. Source changes require appropriately scoped regression coverage; full browser playthroughs and Xbox hardware acceptance remain separate gates.
- Preserve current-version save/load integrity; the owner has waived compatibility with old saves after major updates.
- The optional 8-human × 500-population aspiration is an **engineering stretch goal**, not current capability and not a base-game completion prerequisite.

## Audit corrections that must not be reintroduced

| Claim in supplied audits | Verified code/evidence | Correct classification |
|---|---|---|
| No controller radial menu | engine.js openRadial; js/ui.js drawRadial; js/input.js menu commands | IMPLEMENTED / Xbox acceptance unverified |
| No remap menu | js/ui.js drawRemap; js/input.js remap control path | IMPLEMENTED / coverage and hardware unverified |
| No villager priorities | js/state.js workerQuick; engine.js LT+D-pad/X/B/A shortcuts; UI help | IMPLEMENTED / behaviour fidelity unverified |
| No farm auto-reseeding | js/simulation.js tick checks exhausted farm nodes and spends 60 wood | IMPLEMENTED / needs economy playtest |
| No formations | js/formations.js names Box, Line, Column, Staggered, Wedge | IMPLEMENTED / dynamic movement unverified |
| Three or unknown civilisations | engine.js CIV contains 26 named civilisations with bonus hooks | IMPLEMENTED / exact civ roster and bonus fidelity incomplete |
| Flat population cap, no houses | engine.js capOf counts living completed houses (+5 each), bounded by selected popLimit | IMPLEMENTED / stress and edge cases unverified |
| Saves omit unit paths | js/save.js serializes units including movement paths and validates loaded paths | IMPLEMENTED / long-game round-trip unverified |
| Controller shortcut reaches every formation | Previously engine.js yShort used modulus 4 although five names exist | CONFIRMED BUG: corrected to FMN.length; new regression guard added |
| 38 failures is necessarily today's count | Historical roadmap says 95/133 passed and 38 failed; prior GitHub workflow quit on first failure | HISTORICAL count only; collect complete current list |
| All campaign missions failed or were untested | GitHub regression workflow for 4130ad0 (run 39186518410) reports 19 isolated campaign-simulation job success | AUTOMATED mission suite PASSED at baseline; controller/human full playthrough still unverified |
| Mission 4 assertion currently fails | Audit 3 reported this but the matched CI campaign-mission job succeeded | NOT REPRODUCED at audited CI baseline; require exact failing log/commit |
| Multiplayer is functioning multiplayer | multiplayer.js explicitly synchronises lobby/presence and 5 Hz player markers, not orders or world state | MISSING real shared match simulation |
| Project is 42% complete | Audit 2 provides no checklist denominator or reproducible method | REJECT percentage; use independent acceptance matrices |

## Verified baseline and current CI evidence

- Historical source snapshot: 4130ad0d4974d2ce8f903ca1d59835ce121dff3a.
- 19 individually launched campaign simulations **passed** on Linux/Node 22 in the 19 October 2026 workflow: https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39186518410
- Game source-check step **passed** at this snapshot. The complete standalone regression step **failed**; the previous workflow stopped on the first test failure (tests/ai-defence-priority.test.mjs), which used a stale exact-source pattern rather than exercising the newer shared-roster AI implementation.
- On 19 October, replaced that brittle AI assertion with runtime selection cases and factored its siege-weighted threat decision into a testable pure helper; repaired the missing Wedge selection from the Y shortcut and added a regression test.
- Updated .github/workflows/game-regression.yml to run **all** standalone tests and emit passed/failed file counts and individual failure names in the GitHub Actions job summary. Use the resulting run, not a remembered baseline, for the next CI triage.
- Physical Xbox Edge, TV interaction, complete user-controlled skirmishes, live two-human multiplayer, real performance metrics and full campaign playthroughs have **not** been performed in this work.
- Do not claim CI green until both workflows actually pass on the same commit.

## Task register — functional baseline and Xbox fidelity

Status denotes evidence as of the initial audit and this reconciliation, **not** a promise that the task is complete. IDs remain stable across future updates.

| ID | Prio | Track / task | Status | Implementation/evidence and acceptance requirement |
|---|---|---|---|---|
| CK-001 | P0 | Comprehensive CI failure inventory | VERIFIED (automated) | All 133 standalone files are run and reported; current 8440b461 regression CI is green. Preserve full failure summaries and classify any new issues by type. |
| CK-002 | P0 | Repair current regression failures | VERIFIED (current baseline) | All prior failures cleared at 8440b461, 133/133 standalone checks and 19/19 isolated missions pass; continuously revalidate after changes. Does not imply complete game readiness. |
| CK-003 | P0 | Basic complete land skirmish | UNVERIFIED | engine.js, simulation.js, ai.js, mapgen.js: match start → economy → ages → combat → win/lose → results. Record actual in-browser gameplay and controlled AI full-match simulation. |
| CK-004 | P0 | AI ability to finish matches | UNVERIFIED | ai.js has substantial economy/combat/recovery logic and focused tests. Run reproducible moderate/hard/late-game matches with clear winner and resource/accounting diagnostics. |
| CK-005 | P0 | Current-version save round-trip | PARTIAL | save.js and persistence.js support references, RNG state, localStorage/IndexedDB. Verify saves during economy, troop movement, research, transport/garrison, relics, campaigns; compare state before/after. |
| CK-006 | P0 | Population and production deadlocks | IMPLEMENTED/UNVERIFIED | Recent repairs in engine.js/simulation.js. Exercise queue reservations, house loss, caps, restored games and multiple concurrent buildings in full match. |
| CK-007 | P0 | Real two-human shared multiplayer | MISSING | multiplayer.js is lobby/presence only. Implement ownership, command replication, shared map/seed/RNG, deterministic or host-authoritative policy, synced win/lose; two browsers complete a real match. |
| CK-008 | P0 | Multiplayer desync detection and failure handling | MISSING | Sequence/order/dedup, frame acks, periodic state checksums, timeout/rejoin/disconnect strategy; expose desync rather than silently diverging. Dependent on CK-007. |
| CK-009 | P0 | Controller-only core game flow | IMPLEMENTED/UNVERIFIED | input.js, ui.js, menus.js, engine.js: prove controller-only setup, villagers, building, training, research, attack, save/pause and victory on Xbox Edge. |
| CK-010 | P1 | Correct RT contextual wheel and site commands | IMPLEMENTED/UNVERIFIED | openRadial/drawRadial exist. Compare target context, sectors/pages, prompts, focus, cancel and selection with official Xbox learning guide, then test hardware. |
| CK-011 | P1 | LB/RB, D-pad and control group parity | PARTIAL | In-game groups, minimap and quick-select exist but reference mappings are not identical. Compare each command without assuming missing implementation; controller integration acceptance. |
| CK-012 | P1 | Villager priority presets and auto economy | IMPLEMENTED/UNVERIFIED | Existing worker targets/automation toggle; test idle/queued villagers, starvation, depleted nodes, repair priorities and reference preset behaviour. |
| CK-013 | P1 | Economy completeness and balance | PARTIAL | Gather/dropoff, farms, market/trade, fishing, relics implemented; verify gathering/carry/technology maths, depletion, farm wood costs, housing and economy pacing against reference. |
| CK-014 | P1 | Technology catalogue and effect integration | PARTIAL | config.js TE, engine.js civilisation unique techs, unit stat/render/AI use; enumerate every base reference tech and test prerequisites, cost, correct runtime effect and UI availability. |
| CK-015 | P1 | Damage/armour/counters | PARTIAL | Config and engine contain class data and bonuses; verify attacks against infantry/cavalry/siege/ships/structures, minimum range, ballistics, projectiles and friendly fire case by case. |
| CK-016 | P1 | Movement, collisions and pathfinding | PARTIAL | pathfinding.js, input.js, simulation.js; run land/water/ford/gate/obstacle and large group tests, verify fallback and no stranded/oscillating units. Do not infer bugs from unaudited audit claims. |
| CK-017 | P1 | Formations, stances and combat orders | PARTIAL | Five formations; stance choices and attack move in input.js; Y shortcut now cycles all five. Test all shapes, patrol, attack move, guard/follow, rally and mixed naval/land selection. |
| CK-018 | P1 | Fair AI economy and tactical scaling | PARTIAL | ai.js advanced routines exist; compare Easiest–Extreme against observed reference, exclude unsupported claims of cheat multipliers, test raids/defence/attack waves and late-game rebuilds. |
| CK-019 | P1 | Land and naval map correctness | PARTIAL | mapgen.js map audit, transport landing, docks, ships; confirm starts, food/gold/stone/wood, viable shores, accessible enemies, correct terrain and match completion. |
| CK-020 | P1 | Diplomacy, alliances and victory rules | PARTIAL | kingdom.js and simulation.js support several modes and alliances; test win/lose precedence, simultaneous defeat, team relations, tribute, sudden death and scoring rules. |
| CK-021 | P1 | Save game deletion and recovery UX | PARTIAL | Manual slots, rolling autosave, IndexedDB mirrors and explicit delete UI exist; test corrupt-save delete, cancel, overwrite, restored-backup tombstones, offline quota exhaustion. |
| CK-022 | P1 | Full 19-mission campaign human acceptance | PARTIAL | 19 isolated Node campaign suites passed on baseline CI; complete all 19 with controller-only actual gameplay, triggers, defeat, save/reload, unlocks, no softlocks. |
| CK-023 | P1 | Xbox screen readability and accessibility | UNVERIFIED | ui.js and render.js: TV distance legibility, contrast, scaling, button prompts, focus, controller disconnect and button remapping; physical Xbox Edge required. |
| CK-024 | P2 | Reference civilisation table | PARTIAL | engine.js CIV has 26 entries, bonuses and unique units/techs; compare verified **included base** Xbox reference roster, bonuses, team bonuses, restrictions and architecture one by one. |
| CK-025 | P2 | Reference unit catalogue | PARTIAL | config.js U plus engine.js Object.assign(U). List effective runtime roster after extensions, distinguish unit upgrade labels from new unit keys, identify real missing lines/abilities. |
| CK-026 | P2 | Reference building catalogue | PARTIAL | config.js B contains core economic, military, religious, naval and defensive buildings. Verify wall/palisade/gate, towers, traps, docks and missing reference building functions. |
| CK-027 | P2 | Reference tech-tree UI and restrictions | PARTIAL | ui.js tech tree + config.js TE + unique technologies; cross-check civilisation availability and age/building requirements and live research effects. |
| CK-028 | P2 | Reference map and mode catalogue | PARTIAL | menus.js has 14 map-layout choices, custom presets, 7 victory conditions, 2–4 kingdoms. Enumerate base Xbox map types, mode rules, standard settings and clearly label custom additions. |
| CK-029 | P2 | Console tutorials and tooltips | PARTIAL | ui.js in-game control help and First Hearth training exist; assess guided teachability and missing accessibility assistance. |
| CK-030 | P2 | Post-match statistics and spectator/replay scope | INVESTIGATE | Verify actual end-screen stats against Xbox reference; decide whether replay/spectator are mandatory in agreed base, optional online capability or separate milestone. |
| CK-031 | P2 | Native 2–4 player multiplayer integration | MISSING | Following CK-007/008: two-player full sessions, host/guest ownership, garrison/transport/trade/research/siege, disconnect and reconnect; scale four only after correctness proven. |
| CK-032 | P3 | Original sprite/animation asset quality | PARTIAL | assets/ manifest and render.js fallback/procedural art. Improve original visual readability, motion and faction differentiation; no copyrighted assets. |
| CK-033 | P3 | Music, ambience and feedback | PARTIAL | audio.js procedural sound; audit actual audible events, prompt initiation/resume and production-ready original sound suite. |
| CK-034 | P3 | AI and civilisation balance | UNVERIFIED | Repeatable test batteries and human matches; record win rates and concrete deviations, avoid arbitrary 1:1 numerical approximations unsupported by reference evidence. |
| CK-035 | P3 | Canvas/game-loop rendering and input profiling | UNVERIFIED | Measure simulation/draw frame time, memory/GC, p95 input delay, sprite and A* counts on real Xbox Series S first. |
| CK-036 | P4 | Xbox Series S and X release acceptance | MISSING EVIDENCE | Test declared population/map/player limits with controller and Edge; record hardware/browser build, peak memory, frame time and full-match stability. |
| CK-037 | P4 | Eight humans × 500 pop stretch target | NOT IMPLEMENTED | Separate feasibility gates: 2×200 → 4×200 → 8×200 → 8×500 with shared pathfinding, network budgets, simulation checksums and measured physical Xbox performance. |
| CK-038 | P4 | DLC/native platform boundary | OUT OF CORE SCOPE | Document optional paid DLC civilizations/campaigns separately; Xbox-native achievements, cloud saves and platform matchmaking are not assumed available to an Edge browser game. |
| CK-039 | P4 | Final functional readiness sign-off | OPEN | All accepted required scenarios pass: deterministic tests + real browser 1v1/naval matches + saves + campaigns + real shared multiplayer + console controller hardware. |
| CK-040 | P4 | Final reference-fidelity sign-off | OPEN | Every required base Xbox feature in matrices CK-024–030 has explicit matched/intentional-difference/waived status supported by playable evidence. |

## Immediate implementation batches

**Batch A — baseline and CI (completed for current commit):** Both CI workflows are green at 8440b461. Keep them green after every code change; any new failure must be diagnosed as a gameplay defect, obsolete source signature or fixture, with coverage preserved.

**Batch B — integrated solo game:** Use current simulation and tests to drive standard land matches through a winner/loser and late-game economy. Fix the first real blocker, verify save/load, then repeat on naval/island and harder AI. Do not expand the roster before the core mechanics are dependable.

**Batch C — Xbox controller fidelity:** Use official Xbox guide for observed A-selection, held-A box selection, RT commands, D-pad quick selections, site commands and villager priority behaviour. Compare existing implementation action by action, calibrate actual controller input and UI on target hardware.

**Batch D — synchronised multiplayer:** Define an explicit command protocol and stable object ownership, deterministic acceptance gate, checksums and resynchronisation policy before increasing participant limits. Lobby presence alone never clears CK-007.

**Batch E — reference content matrix and campaign acceptance:** Compare effective runtime definitions against verified base Xbox reference content and test each implemented effect. Execute 19 actual controller playthroughs and save/reload scenarios, distinct from scripted Node mission runs.

**Batch F — production and release:** Original assets/audio, TV accessibility, repeated games, Xbox performance and optional scaling. Keep 8×500 separate from main release sign-off.

## Required acceptance evidence format

For each CK-ID, append a row in a future progress update using this schema:

| CK-ID | Commit SHA | Evidence type | Test or playthrough | Platform/build | Result | Open issue |
|---|---|---|---|---|---|---|
| Example | exact SHA | automated/runtime/controller/hardware | named test + scenario | Node 22 Linux / Chromium / Xbox Series S Edge | pass/fail/unverified | repro ID |

An automated component test verifies that exact component under test, not a complete skirmish. A GitHub job marked red due to one test does not prove every test failed. Tests from a previous commit do not transfer without fresh evidence.

## Reference sources and versioning

- Official Xbox launch and console design: https://www.ageofempires.com/news/ageii-de-on-console-is-out-now/
- Official Xbox learning guide (selection, RT, D-pad): https://www.ageofempires.com/learn-to-play/controlling-your-empire-gathering-resources-xbox/
- Official Xbox gameplay and UI accessibility support: https://support.ageofempires.com/hc/en-us/articles/9873053945492-Narration-options-Age-of-Empires-II-Definitive-Edition

These establish major console interaction principles but **not** complete versioned numerical balances, included-content membership or the newest Xbox patch. Before precise content parity sign-off, record exact reference version, Xbox edition/DLC entitlements and official patch/reference evidence. Do not invent a generic v100.* build as proof of version lock.

## Definition of done

**Functional base:** full land and naval skirmishes with fair competent AI and correct victory/defeat; dependable economy/combat/orders/maps; reliable current saves; real controller-only play; 19 complete campaign human playthroughs; 2-human shared gameplay and state consistency; all relevant regression/CI tests pass; measured performance at declared shipping limits.

**Xbox reference base:** the separately agreed base Xbox mechanics, controller functionality, included content and game modes are inventoried individually and implemented, verified, intentionally different with approval, or explicitly out of scope. A 26-civilisation list or 19 original missions does not itself establish full reference-content parity.

**Optional later:** DLC, original new gameplay systems, native Xbox Live services and 8×500 scalability. None may be quietly portrayed as already working.

**Current release decision:** NOT READY for reference-equivalent sign-off; significant tested foundations are present, and exact remaining work is tracked above.


## Repository hygiene checkpoint — 19 October 2026

This section records incremental cleanup rather than implying that every file has been exhaustively refactored.

- **Tracked tree reviewed:** the repository contains the browser runtime, local atlas assets, documentation, scripts and 133 standalone `.test.mjs` files. Twenty-two production scripts load from `index.html`; all twenty-two are listed in the `sw.js` offline shell cache, as is `styles.css`. Do not delete tiny `js/` modules merely because they have few lines: several own real functions and are deliberately loaded.
- **Source comments screened:** checked major source files for obvious TODO/FIXME/legacy/stub markers. Replaced a misleading “PATHFINDING (BFS)” heading inside `js/minimap.js` with the correct minimap-description heading. A keyword scan is **not** a complete dead-code or correctness proof.
- **Unreachable compatibility path removed:** neither current AI nor player orders set the old trader fleeing flag to true. Removed the stale `tradeFleeing` / `tradeThreatCheckAt` resets and obsolete old-save repair branch from `js/simulation.js` and `js/input.js`. Current-version trading orders remain covered by the existing trade and movement tests. Compatibility with saves from superseded development builds is outside the agreed shipping requirement.
- **Central AI queue policy:** moved queued-unit counting into `aiQueuedUnits(buildings, kind)` and made the AI unit caps call that helper. Deleted the duplicate *test-only* galley counting implementation; queue tests now invoke the real helper with living, destroyed and malformed building fixtures.
- **Stale source tests modernised:** updated town-centre fallback selection, live-production-site guards, planning queue shape, destroyed-site accounting and queue tests to inspect the current validated implementation rather than asserting obsolete literal code patterns. These changes preserve the intended safety rules rather than deleting tests.
- **Duplicate CI work retired:** `game-validation.yml` now runs quick JavaScript source and atlas checks; `game-regression.yml` exclusively owns the exhaustive 133-file test suite and the 19 separately launched mission simulations. GitHub Actions now reports the complete failure list.
- **Outdated contributor guidance corrected:** `README.md` now points to this master register, labels `AOE2_PARITY_ROADMAP.md` as the historical engineering log, and documents the current-version save policy and distinct local test commands.
- **Regression checkpoint:** a completed GitHub Actions run on commit `f8c6b6e4d4db62920a835a9e0dc345b172883fb8` reported **103 passing and 30 failing of 133 standalone test files**, plus a successful isolated 19-mission campaign job. Source/atlas validation passed. This is a checkpoint, **not** evidence that the full suite is green or that physical Xbox acceptance is complete.

**Still required:** classify and fix the 30 unresolved failing tests; review each suspect unused function or module with reference/behaviour evidence; address remaining redundant data, stale comments, old compatibility-only branches and duplicated rendering logic case by case; verify after every set of changes. Do not perform wholesale deletion of campaign, art, AI, trading, save, input or engine paths without a reproducible reason and coverage.

## Continued cleanup checkpoint — 19 October 2026

This is another evidence-based repository hygiene and regression tranche, following the earlier 30-failure checkpoint.

**Baseline evidence:** At commit `aa323163ba16e4692d599337f0bf2ee707e6c9df`, GitHub Actions [regression run 39203118127](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39203118127) reported **114 of 133 standalone test files passing; 19 failing**. Its 19 isolated campaign-mission simulations passed; the independent source/atlas validation workflow also passed. Changes committed *after* this SHA need a fresh matching-run result before the count is promoted.

**Concrete work completed in this tranche:**

- **A* safety:** `tests/pathfinding-heap-reuse.test.mjs` now exercises actual invalid starts, checks invalid-request counters and retains heap-reuse invariants; the obsolete exact syntax assertion has been retired.
- **Save/order integrity:** `tests/save-path-validation.test.mjs` validates waypoints via the combined `validSavedUnitOrders` gate, checking invalid coordinates and timers. `tests/save-production-validation.test.mjs` rejects simultaneous training and research, while accepting legitimate zero-time queued work and single-operation research.
- **Destroyed structures:** `tests/destroyed-building-work.test.mjs` now calls the genuine building-update function and verifies that dead, missing and unfinished buildings cannot progress work. `tests/invalid-building-commands.test.mjs` verifies the newer “already researching” training guard.
- **Living campaign forces:** `tests/campaign-live-unit-guards.test.mjs` checks that garrisoned living units count as survivors, while dead/unknown/foreign units do not.
- **AI naval scaling:** `tests/ai-research-priority.test.mjs` now recognises the shared validated queue counter rather than the deleted inline galley reducer.
- **Tech roster and upgrades:** A complete current catalogue of **44** defined technologies was verified in `js/config.js`; obsolete assertions expecting 39 were corrected. Existing-unit health upgrades were checked against the living-unit-only rule. `tests/technology-effects.test.mjs` now exercises real gathering-capacity upgrades and accepts additional legitimate Barracks technologies.
- **Trade carts and cogs:** Replaced outdated source-fragment checks in `tests/trade-routes.test.mjs` with five runtime test scenarios, covering production definitions, outbound/return behaviour, distance-based payout, integer overflow/invalid cargo protection, naval trade and destroyed-destination pause semantics.
- **Worker routing:** `tests/villager-pathing.test.mjs` now exercises actual expiry of skipped unreachable resource nodes, the bounded retry budget, and retention of a confirmed route. `tests/villager-dropoff.test.mjs` exercises its separate six-attempt bound, precomputed drop-off distances and serializable retry fields.
- **Settings and UI source assertions:** Adjusted stale versioned AI-difficulty persistence and mixed-unit player-command source checks; preserved validations of actual behavior.

**Still open:** 19 failed regression files at the cited checkpoint, not all proven runtime bugs. Several still assert obsolete implementation layouts. Critical acceptance gaps remain: full skirmish end-to-end, robust current saves, controller-only hardware validation, competent match-winning AI, synced human multiplayer, and complete base Xbox content fidelity. Physical hardware acceptance and full human mission playthroughs remain unverified.

**Cleanup policy reaffirmed:** Track and test before deleting. Existing tiny modules may still own runtime functions; broad comment or file deletion is not equivalent to removing demonstrably unused code. Keep all current-version game behaviour and valid protections intact.

## Final regression cleanup checkpoint — 19 October 2026

Commit `8440b461712ae491499d8d08945d2b3b1c086885` has verified **133/133 standalone regression files passing**, **19/19 isolated campaign simulations passing**, and green independent source/atlas validation. This supersedes all earlier failing-file checkpoint counts listed above.

**Changes in the final cleanup tranche:**

- Retired obsolete AI retreat tests expecting automatic shelter healing. New runtime tests verify critically wounded-unit retreat, completed reachable shelter selection, 65% HP recovery release, and exclusion from coordinated attack waves, without reintroducing free healing.
- Replaced old siege-wave assertions with runtime testing of castle/tower/town-centre priority, reachability, dead/friendly target exclusions and retreat-safe release.
- Tested diplomacy damage and indexed target acquisition against actual enemy-only filtering, including non-hostile and garrisoned entities.
- Replaced obsolete transport, fishing, fish-trap, naval target ranking and dock connectivity assumptions with the current connected-water and occupied-tile fixtures, six-candidate reachable naval targeting, timed fishing routes and partial-unload notices.
- **Corrected a real simulation bug:** `townBell` now counts each genuine living, same-owner garrisoned passenger once instead of treating duplicate or stale references as occupied capacity. New executable tests verify available capacity, duplicate references, pre-existing reservations, no overfill, nearest valid shelter and actual controller-menu integration.
- Modernised save-slot confirmations, deletion hints, autosave validation fixtures, technology effects, King of the Hill AI pacing, spatial foe-grid tests and zero-distance-safe separation buffer checks. Existing invalid-save and failed-backup scenarios were retained; no smoke or regression tests were disabled to attain green.
- This is a **test-baseline and targeted housekeeping milestone**, not proof that every file is free of unused functions or that the game is Xbox or multiplayer complete. Continue with CK-003–040 acceptance gates. Do not restart an unnecessary wholesale cleanup of currently functioning systems.
