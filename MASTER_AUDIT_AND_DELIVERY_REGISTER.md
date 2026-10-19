# Crown & Kingdoms — Authoritative Audit and Delivery Register

**Established:** 19 October 2026  
**Initial audited code:** main at 4130ad0d4974d2ce8f903ca1d59835ce121dff3a  
**Target:** browser game running in Microsoft Edge on Xbox Series S first, and Xbox Series X  
**Gameplay benchmark:** Age of Empires II: Definitive Edition on Xbox Series X, including all Xbox-available gameplay DLC as of 19 October 2026 (new owner scope). Base, purchased DLC, Chronicles/antiquity modes and native platform services must still be separately identified; Xbox Series S Edge remains a required performance and controller acceptance environment.

This is the reconciled, evidence-based work register created from three independent audits and actual source/CI inspection. It supersedes unsupported conclusions in those audits; it does not replace the historical AOE2_PARITY_ROADMAP.md, which remains a technical change log. Updates must cite a specific commit, test run and environment.

## Current verified CI baseline — 19 October 2026

**Latest fully matched automated code baseline:** [`6876db635dba7c5a0f887dec8e539b7af8de334a`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/6876db635dba7c5a0f887dec8e539b7af8de334a). [Regression run 39221296969](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39221296969) and [validation run 39221296925](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39221296925) both succeeded on GitHub Ubuntu / Node 22. **133/133 standalone test files pass**, including two new multiplayer foundation test files; all **19/19 isolated campaign missions** and passive/active seeded land-skirmish checks passed, including 600s and 900s checkpoint reloads. This is *not* evidence of a live synchronized multiplayer match or any human/Xbox hardware acceptance.


**Most recent pre-multiplayer-code verified main:** `6efe1ca426b7a747cc0c93a86994fd2fdd392e71`. [Regression run 39218404521](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39218404521) and [validation run 39218404534](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39218404534) both succeeded on GitHub Ubuntu / Node 22. The newer active-skirmish/save checkpoint below was already present in this main revision; do not replace it with an older snapshot. Multiplayer and new parity planning commits after this baseline must obtain their own matching CI results before any green claim.

**Earlier seeded-skirmish verified development commit:** [`5f7b4622768a6a787e73e90ce9c031487d29b300`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/5f7b4622768a6a787e73e90ce9c031487d29b300). [Regression run 39217254199](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39217254199) and [validation run 39217254226](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39217254226) both succeeded on GitHub Ubuntu / Node 22. All 131 standalone files, 19 isolated campaign missions, and the two newly added full seeded skirmishes passed. Hard skirmish reload at 600 seconds passed persisted-state comparisons and continued to natural defeat. See the seeded-skirmish checkpoint below for scope and limitations. Earlier verified commits below are historical evidence.

**The streamlined GitHub Actions workflows both passed at code commit [`4a85bf73a1653d8502651d12f3d4eba19eb0ac2b`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/4a85bf73a1653d8502651d12f3d4eba19eb0ac2b).**

- [Regression workflow, run 39215994051](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39215994051): **131/131 standalone test files passed** plus **all 19 isolated campaign mission simulations passed**. The new single campaign-objective file preserves every assertion from three former small files.
- [Fast source/atlas validation, run 39215994025](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39215994025): **success**.
- `game-regression.yml` no longer repeats source-check and atlas-validation work already handled by `game-validation.yml`. Both workflows skip documentation-only pushes, superseded push runs are cancelled, and PR regression checks remain enabled even for documentation-only PRs. Both workflows remain manually runnable.
- Earlier run numbers and counts below are historical snapshots, **not** the current failure count. Documentation-only commits after the verified code commit may not launch CI by design.
- All these checks test the current automated coverage, **not** complete Xbox Edge/controller-only matches, live multiplayer, long-game storage durability, full human campaign playthroughs or reference-game parity.

## Work mode restart handoff — 19 October 2026

**For the existing ChatGPT Work conversation:** Always fetch the newest `main` branch of `https://github.com/johnstacey16-ui/crown-and-kingdoms` and read this register **before editing anything**. Prior Work mode chat context or an extracted ZIP from audit commit `4130ad0` may be stale. Do **not** write an older snapshot over newer GitHub work or redo the cleanup.

**Earlier seeded-skirmish verified code:** `5f7b4622768a6a787e73e90ce9c031487d29b300` — [regression 39217254199](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39217254199) and [validation 39217254226](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39217254226), both passing. **131/131 standalone files, 19/19 isolated campaign simulations and two full passive-opponent skirmishes pass**, including the Hard 600-second save/reload. Next expand to active-player matches and the outstanding late-game save matrix; do not redo the completed passive cases without a relevant source change. The newer README/register-only commits do not alter executable game code; fetch latest `main` before editing.

**Recent workflow simplification:** Removed duplicate script/asset checks from the regression workflow; maintained a separate fast validator and full gameplay/campaign suite. Skipped docs-only pushes, cancelled superseded runs, and consolidated three tiny campaign objective tests into one file without losing their assertions. No game runtime scripts were removed; all existing Node test files remain development-only and do not ship into the browser. Read the README testing policy before deleting any further tests.

**Latest added hardening:**
- `js/save.js` verifies `localStorage.setItem()` via immediate readback **before** invoking the IndexedDB mirror. Quota errors/readback mismatch cannot send a newer backup for a save reported failed.
- `persistence.js` forgets a failed IndexedDB open, allowing retry during the same page session; it also closes and replaces connections invalidated by `onversionchange` (e.g. another tab upgrading IndexedDB).
- IndexedDB backup restoration now fails closed if local deletion-marker checks throw, avoiding accidental resurrection of previously deleted slots. A verified, present primary save remains authoritative.
- `tests/save-management.test.mjs` checks primary write/readback/backup ordering, primary failure rollback, transient IndexedDB opening recovery, version-change connection renewal, normal backup restoration, deleted-slot tombstones, and denied-storage-marker recovery. `tests/save-validation.test.mjs` and `tests/browser-foundation.test.mjs` enforce the primary-first invariant.
- These are **component-level save guarantees**, not a completed browser/Xbox full-match save round-trip acceptance.

**Earlier Work mode action sequence (partly advanced by the newer work below), in order:** (1) Run/fetch matching full CI on current `main`. (2) Make a reproducible end-to-end **single-player land skirmish** run through a real victory or defeat, including controlled enemy AI; log seed, difficulty, time and state diagnostics (CK-003/004). (3) Test save/reload in active late-game simulation, queues, moving troops, technologies, garrisons, naval routes and campaign objectives, including invariant comparisons (CK-005/006). (4) Verify controller-only Xbox Edge workflow and UI (CK-009–012). (5) Design/implement genuine **two-player synchronized simulation** and checksums/reconnect protection (CK-007/008), *not merely lobby presence*. (6) Then fill reference-content parity and polish tasks.

**Non-negotiables:** No deleting valid gameplay or simply disabling tests to get green; maintain original assets; no claims about measured Xbox performance, full playthroughs or live multiplayer without actual test results; make small reversible commits with regression coverage and update CK task evidence. Avoid two simultaneous agents writing to `main`.

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
| CK-001 | P0 | Comprehensive CI failure inventory | VERIFIED (automated) | All current standalone files (131 at verified 4a85bf73) are run and reported; current 8440b461 regression CI is green. Preserve full failure summaries and classify any new issues by type. |
| CK-002 | P0 | Repair current regression failures | VERIFIED (current baseline) | All prior failures cleared at 8440b461, 133/133 standalone checks and 19/19 isolated missions pass; continuously revalidate after changes. Does not imply complete game readiness. |
| CK-003 | P0 | Basic complete land skirmish | PARTIAL | At 5f7b4622, seeded Moderate/Hard production AI finishes passive-opponent land simulations through natural defeat/results. Active player victory and in-browser/controller full-match acceptance remain open. |
| CK-004 | P0 | AI ability to finish matches | PARTIAL | At 5f7b4622, seed 123456 Moderate/Hard AI grows, reaches Feudal, attacks and wins; scripts/run-skirmish.mjs logs resource/population/path diagnostics. Repeat against active opposition, other seeds and late-game states. |
| CK-005 | P0 | Current-version save round-trip | PARTIAL | save.js and persistence.js support references, RNG state and localStorage/IndexedDB. At c9f73ea2, save-order tests verify primary checkpoint before backup and recovery from transient IndexedDB open failures. Still verify true long-match save/reload during economy, movement, research, garrison/transport, relics and campaigns; compare live states. |
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
| CK-031 | P0 | Native 2–4 player multiplayer integration | MISSING | Following CK-007/008: two-player full sessions, host/guest ownership, garrison/transport/trade/research/siege, disconnect and reconnect; scale four only after correctness proven. |
| CK-032 | P1 | Original sprite/animation asset quality | PARTIAL | assets/ manifest and render.js fallback/procedural art. Improve original visual readability, motion and faction differentiation; no copyrighted assets. |
| CK-033 | P1 | Music, ambience and feedback | PARTIAL | audio.js procedural sound; audit actual audible events, prompt initiation/resume and production-ready original sound suite. |
| CK-034 | P3 | AI and civilisation balance | UNVERIFIED | Repeatable test batteries and human matches; record win rates and concrete deviations, avoid arbitrary 1:1 numerical approximations unsupported by reference evidence. |
| CK-035 | P3 | Canvas/game-loop rendering and input profiling | UNVERIFIED | Measure simulation/draw frame time, memory/GC, p95 input delay, sprite and A* counts on real Xbox Series S first. |
| CK-036 | P4 | Xbox Series S and X release acceptance | MISSING EVIDENCE | Test declared population/map/player limits with controller and Edge; record hardware/browser build, peak memory, frame time and full-match stability. |
| CK-037 | P4 | Eight humans × 500 pop stretch target | NOT IMPLEMENTED | Separate feasibility gates: 2×200 → 4×200 → 8×200 → 8×500 with shared pathfinding, network budgets, simulation checksums and measured physical Xbox performance. |
| CK-038 | P1 | Full Xbox DLC entitlement/content scope | OPEN / REQUIRED | New owner request expands the target to all gameplay DLC available on Xbox as of 19 October 2026, including distinct Chronicles/Return of Rome variants. Catalogue editions, bonuses, units, research, scenarios and modes; verify original implementation per category. Native Xbox achievements/cloud saves/matchmaking still require separate platform architecture. |
| CK-039 | P4 | Final functional readiness sign-off | OPEN | All accepted required scenarios pass: deterministic tests + real browser 1v1/naval matches + saves + campaigns + real shared multiplayer + console controller hardware. |
| CK-040 | P4 | Final reference-fidelity sign-off | OPEN | Every required Xbox base + gameplay-DLC feature in CK-024–030, CK-038 and CK-044–046 has an explicit matched/intentional-difference/waived status supported by playable evidence. |
| CK-041 | P1 | Full original graphics overhaul | OPEN | Inventory original art and procedural placeholders; overhaul terrain, high-resolution units/factions, buildings, animations, effects, fog/zoom, UI and TV readability; verify atlas loads, visual regression captures and Xbox frame budgets. |
| CK-042 | P1 | Full original sound-effect overhaul | OPEN | Event coverage for construction, economy, combat, siege, naval, alerts and UI; audio ducking, voice caps, controller-friendly accessibility, user-gesture audio resume, performance and mix acceptance. |
| CK-043 | P1 | Original adaptive soundtrack | OPEN | Produce original menu/economy/tension/combat/victory/defeat music; loops, seamless transition, independent volume/mute/persistence, licensing and Xbox Edge tests. |
| CK-044 | P2 | All current Xbox gameplay DLC catalogue | OPEN | Enumerate and validate Lords of the West, Dawn of the Dukes, Dynasties of India, Return of Rome, The Mountain Royals, Victors and Vanquished, Chronicles: Battle for Greece, The Three Kingdoms, Chronicles: Alexander the Great, The Last Chieftains and The Viking Sagas against actual Xbox entitlements and feature matrices. No official copyrighted campaigns/assets may be copied. |
| CK-045 | P1 | Xbox Series X controller default mapping fidelity | OPEN | Per-command comparison of Xbox documented A/hold/double-A, RT, D-pad quick select, R3 villager priority, control groups, site commands, pause, camera/minimap, UI prompts and remapping; physical Edge/controller verification. |
| CK-046 | P2 | Xbox DE feature-family gap closure | OPEN | Full missing-feature register for research, economy, civilisation effects, buildings, unit abilities, naval, alliances, maps, victory conditions, co-op/spectator/replay/editor where applicable; treat separately from media assets, not inferred complete from file names. |

## Immediate implementation batches

**Batch A — baseline and CI (completed for current commit):** Both CI workflows are green at 8440b461. Keep them green after every code change; any new failure must be diagnosed as a gameplay defect, obsolete source signature or fixture, with coverage preserved.

**Batch B — integrated solo game:** Use current simulation and tests to drive standard land matches through a winner/loser and late-game economy. Fix the first real blocker, verify save/load, then repeat on naval/island and harder AI. Do not expand the roster before the core mechanics are dependable.

**Batch C — Xbox controller fidelity:** Use official Xbox guide for observed A-selection, held-A box selection, RT commands, D-pad quick selections, site commands and villager priority behaviour. Compare existing implementation action by action, calibrate actual controller input and UI on target hardware.

**Batch D — synchronised multiplayer:** Define an explicit command protocol and stable object ownership, deterministic acceptance gate, checksums and resynchronisation policy before increasing participant limits. Lobby presence alone never clears CK-007.

**Batch E — full Xbox reference content matrix and campaign acceptance:** Compare effective runtime definitions against Xbox base plus every Xbox-available gameplay DLC pack as of the version lock; separately scope the Chronicles/Return of Rome modes and verify original mechanics (never copy proprietary reference stories/assets). Execute 19 existing original campaign controller playthroughs plus new validated original content acceptance, distinct from scripted Node mission runs.

**Batch F — full production overhaul and release:** Full original high-resolution graphics/animations/FX, complete original sound effects and adaptive music, TV accessibility, repeat matches, Xbox Series S/X performance and optional scaling. These are explicit CK-041–043 deliverables, not vaguely optional final polish. Keep 8×500 separate from main release sign-off.

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

**Xbox full-content reference:** Xbox Series X base mechanics plus gameplay DLC through 19 October 2026, controller functionality, all referenced feature families and game modes are inventoried individually and implemented, verified, intentionally different with approval, or explicitly documented as gaps. A 26-civilisation list or 19 original missions does not itself establish full reference-content parity.

**Optional / separate platform work:** Native Xbox Live achievements, cloud saves, platform matchmaking, any DLC released after the fixed 19 October 2026 reference date, and 8×500 scalability require distinct technical and release decisions. All then-current Xbox gameplay DLC is now in scope, not optional. None may be quietly portrayed as already working.

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

## Additional persistence reliability handoff — 19 October 2026

**Verified code commit:** [`e160ab81018b706a3fe737b4076e4a7e3e1963b8`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/e160ab81018b706a3fe737b4076e4a7e3e1963b8). GitHub Actions [regression run 39214542376](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39214542376) passed **133/133 standalone test files** and **all 19 separate automated campaign simulations**; [validation run 39214542399](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39214542399) passed source/atlas checks.

**Changes:** `persistence.js` closes IndexedDB handles and allows reopening when their database version changes (for example, another browser tab's schema upgrade). Backup restoration checks the save slot's deletion marker inside a guarded localStorage read; if marker access is denied, it fails closed and does not restore potentially deleted saves. Added real mocked IndexedDB scenarios to `tests/save-management.test.mjs` for those cases, including successful restoration only of missing non-deleted saves while preserving a newer existing local copy.

**Unchanged acceptance boundary:** Storage failure tests and green automated CI do **not** prove Xbox Edge behaviour, physical storage durability, complete late-game save/reload, multiplayer correctness or full reference-game parity. Continue CK-003 through CK-040 without redoing the completed regression cleanup.

## Testing simplification checkpoint — 19 October 2026

The user asked whether a large quantity of automated tests and repeated regression checks are all necessary. Audit the **value** of each check, not just the file count.

**Changes saved:**

- One source-and-asset validation workflow performs the simple source/atlas checks. The regression workflow no longer duplicates those steps.
- Both workflows skip pure Markdown edits on `main`, cancel obsolete runs when newer pushes arrive, and retain manual execution. Regression checks still run for pull requests, including docs-only PRs, to avoid missing required status checks.
- Combined `tests/campaign-land-army-objective.test.mjs`, `tests/campaign-ranged-objective.test.mjs` and `tests/campaign-relic-objectives.test.mjs` into `tests/campaign-objective-guards.test.mjs`. Every former objective assertion is retained and three named Node subtests replace three independently launched scripts.
- The standalone test file count decreased **133 → 131**, avoiding two extra Node startups. This is a *small organizational saving*, not a significant source-size reduction and not an indicator of game completeness.

**Verification:** commit `4a85bf73a1653d8502651d12f3d4eba19eb0ac2b`, [regression 39215994051](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39215994051) successful with **131/131 standalone files and 19/19 mission simulations**, [validation 39215994025](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39215994025) successful.

**Next development priority:** CK-003/004 playable, reproducible *entire skirmish* from start to victory/defeat with real AI decisions and recorded seed/difficulty/time; then CK-005 late-game save/load round-trip, Xbox Edge controller acceptance, and real synchronous multiplayer. Continue merging redundant source-literal tests only when their protective assertions remain covered. Do not add large batches of new tests unless they exercise newly developed gameplay or catch reproduced defects.

## Seeded skirmish and fractional economy checkpoint — 19 October 2026

**Starting revision:** `bd483eb6fb9cb50c08d1834cacab156dac547b8c`, retrieved through GitHub and verified against every blob hash. Its only differences from the green `4a85bf73` code were README/register edits. No earlier snapshot was copied over newer source.

- Added `scripts/run-skirmish.mjs`: production simulation and enemy AI, seed `123456`, Open Plains (map 3), smallest map, two kingdoms, balanced AI, default resources/five starting villagers, Dark Age, 200 population limit, Town Centre victory rule, 30 simulation steps/second. Player remains passive with default gathering orders. No artificial damage, free resources, forced victory, AI replacement or time-limit score victory is used.
- Moderate reaches natural player defeat/results at **637.40 simulated seconds**, with enemy Feudal Age, 26 villagers and an attack wave. Hard reaches defeat at **918.13 seconds**, with enemy Feudal Age, 32 villagers and an attack wave. These prove that production AI can finish these passive-opponent cases, not competence against an active player or a complete browser/controller match.
- Hard checkpoint at **600 seconds** saves and reloads four queued enemy units, one active research operation and 28 moving units across both kingdoms. Exact persisted-field comparisons cover time, RNG, resources, ages, technologies, buildings/queues, units/orders, campaign state, relics, terrain, resource nodes, market prices, diplomacy, civilisations and victory mode. The match subsequently finishes. Empty campaign/relic fields in this land case do not establish campaign/relic/garrison/naval acceptance. Projectile preservation and exact post-load trajectory equivalence remain unverified.
- **Reproduced and fixed a gameplay defect (CK-013):** legitimate fractional resource totals from gathering/relic income were rejected by Market buy/sell guards; merchant return deliveries silently discarded gold when the owner's balance was fractional. Accept finite, non-negative balances within safe magnitude while keeping integer cargo, invalid-value and overflow protections. New cases in the existing economy/trade test files fail on the prior source and pass with the fix.
- Shared only browser mocks/source loading between the existing smoke suite and the skirmish runner in `tests/helpers/headless-game.mjs`; production game scripts/load order are unchanged. Updated two module-wiring assertions to follow the shared helper. No test files or behavioural checks were removed. Both full skirmishes now run in the existing regression workflow.
- **Local verification:** Linux/Node v24.19.0; source and atlas checks pass; 11 economy/trade subtests pass; full standalone sweep passed 129/131, with its two harness-location checks then updated and all five corresponding subtests passing on rerun. Simulation smoke completed. GitHub's matched full suite/19-mission outcome must be recorded separately after publication.

| CK-ID | Evidence type | Scenario/result | Remaining acceptance |
|---|---|---|---|
| CK-003/004 | Controlled production simulation | Moderate/Hard passive-opponent land matches finish via actual Town Centre destruction | Active opponent, human victory, other seeds/maps, late-game AI and browser/controller play |
| CK-005/006 | Integrated checkpoint | Hard match reload at 10:00 preserves compared state and proceeds to defeat | Longer games, cap/housing changes across reload, garrisons, transports, naval routes, relics and campaign objectives |
| CK-013 | Runtime defect reproduction | Fractional market balances and cart/cog payouts now pass, retaining overflow rejection | Broader economic balance and reference fidelity |

**Next:** active-player land skirmish and late-game checkpoint coverage, then naval/garrison/campaign save invariants. High invalid-path request counts in the Hard diagnostic (4,411 of 18,667) warrant profiling/reproduction; they did not prevent this match finishing. Xbox hardware, live browser UI, multiplayer and full human campaigns remain unverified. CK-003–006 remain PARTIAL rather than complete.

### Matched CI evidence for the seeded-skirmish batch

| CK-ID | Commit SHA | Evidence type | Test or playthrough | Platform/build | Result | Open issue |
|---|---|---|---|---|---|---|
| CK-001/002 | `5f7b4622768a6a787e73e90ce9c031487d29b300` | automated | Regression 39217254199; validation 39217254226 | GitHub Ubuntu / Node 22 | Both success; 131 files + 19 isolated missions | Hardware/gameplay acceptance distinct |
| CK-003/004 | `5f7b4622768a6a787e73e90ce9c031487d29b300` | production simulation | run-skirmish.mjs seed 123456, Moderate and Hard | GitHub Ubuntu / Node 22 | Natural defeat at 637.40s / 918.13s; matches local Node 24 run | Passive opposition only; active/human gameplay open |
| CK-005/006 | `5f7b4622768a6a787e73e90ce9c031487d29b300` | integrated save/load | Hard, CK_RELOAD_AT=600 | GitHub Ubuntu / Node 22 | Compared persisted fields identical, four queued units/active research/moving troops, match finishes | Full late-game, garrison, naval and campaign checkpoint matrix open |
| CK-013 | `5f7b4622768a6a787e73e90ce9c031487d29b300` | runtime | market-trade-validation and trade-routes | GitHub Ubuntu / Node 22 | Fractional balance cases and existing protections pass | AI tribute uses a similar integer-balance guard; inspect separately |

## Active skirmish and in-flight combat saves — 19 October 2026

**Base:** latest `main` verified as `be51036967cac634b353e1796c7a3026cacece6e` before changes. This batch extends the current runner and save system; it does not replace the newer baseline.

- **CK-003/004:** `CK_PLAYER=active CK_DIFFICULTY=3 CK_RELOAD_AT=900 node scripts/run-skirmish.mjs` finishes with scripted-player victory at **979.70 simulated seconds** (16:19.7), seed 123456, existing Open Plains/default start settings. The script issues paid construction, farming, training, age research and normal gathering/combat orders, defending and then attacking. It knows the enemy capital location, so this is not a fog-of-war fairness or controller test. Production enemy AI remains unchanged and launches an attack wave. At the end the player has 47 living units and an intact Town Centre; enemy Town Centre destruction triggers the actual win/results path.
- **Checkpoint:** the active scenario reloads at 900 seconds with 67 living units across both sides, moving troops and a queued player unit, then continues to victory. Added projectile payloads to persisted-state comparisons. There are no projectiles in flight at this particular checkpoint, so projectile acceptance comes from the combat fixture below, not this match.
- **CK-005 reproduced defect:** save/load previously discarded all in-flight projectiles (`pj:[]` on restore), cancelling attacks already launched. Saves now record projectile positions, unit/building target references, attacker kind/team and a live shooter reference when available. Restoring rebinds current world objects; shots from removed shooters and defensive buildings retain the attacker data needed to resolve damage. Already-dead projectiles and missing targets are excluded when saving.
- **Combat fixture:** existing `tests/save-management.test.mjs` now saves four in-flight shots (archer, siege splash, tower-fired and building-targeted), removes the siege shooter before saving, and compares post-impact HP with uninterrupted combat. All four shots survive loading, live shooter/target references reconnect, and direct/splash/building damage matches. Invalid projectile lists, coordinates, target kinds, attacker kinds/teams and out-of-range references are rejected before replacing the running world. Primary-first persistence and backup recovery protections remain intact.
- **Runner robustness:** bounded time checks prevent floating-point rounding at the configured horizon from repeating zero-step diagnostic snapshots indefinitely. A non-finishing scenario fails rather than forcing a result.
- **Open observation:** the first Moderate active-player run did not finish within 40 simulated minutes, with both sides reaching Castle Age. This remains a diagnostic result, not an accepted full match and not proof that the production AI alone is at fault; the bounded scripted economy also needs evaluation. Do not use the passing Hard case to erase this observation. High invalid-path request counts also remain an investigation item.
- **Local evidence:** Linux/Node v24.19.0, active Hard run completed at 979.70s; 10 save-management subtests and focused save validation/path/production checks pass, along with source validation. A fresh complete CI result is required before promoting this batch's automated baseline.

**Next:** diagnose the non-finishing active Moderate run and invalid paths; expand current-save invariants to late-game housing/cap changes, garrisons/transports, naval routes and campaign objectives. Human/browser/controller and Xbox hardware acceptance are still open. The passing scripted victory remains PARTIAL CK-003/004, not full game completion.

## Synchronized multiplayer, graphics/audio overhaul and all-DLC scope checkpoint — 19 October 2026

**Owner-requested target:** `XBOX_SERIES_X_FULL_PARITY_AND_MULTIPLAYER_PLAN.md` is the companion implementation specification for CK-007/008/031/038/041–046. It distinguishes base entitlements, paid game content, separate Chronicles/antiquity systems and platform-native services. The graphics/audio work is now an explicit high-priority deliverable while first focusing implementation on genuine synchronized multiplayer.

**Implemented protocol and persistent identity groundwork, NOT an online shared match:** `js/network-sync.js` defines versioned bounded typed orders, ownership/identity hooks, sequence/replay/gap/late/future rejection, deterministic frame consumption and canonical checksum/checkpoint comparison. `js/entities.js` assigns stable per-match network IDs (`u<number>`/`b<number>`) to created units/buildings, `js/mapgen.js` initializes the monotonic counter, and `js/save.js` persists and restores these identities while validating duplicates, wrong object prefixes and counter reuse; current-version older checkpoint data lacking IDs is assigned new IDs on load. `tests/network-sync-protocol.test.mjs` and `tests/network-entity-identity.test.mjs` exercise both foundations. Browser script order/service-worker caching and source-check parsing include the sync module. `multiplayer.js` extends its *opening map/economy/RNG-state* signature and reports `synchronizedWorld: false` explicitly. The current live transport still supports **markers only**; no valid gameplay command is yet sent, authorised or executed over the network. CK-007/008/031 remain MISSING as complete capabilities until integrated two-client live matches with matching frame/checkpoint evidence. Future work must bind stable IDs to immutable session/team ownership and add authoritative simulation clocks, command execution, ACKs and reconnection/resync transport.

**Matched verification:** Commit `6876db635dba7c5a0f887dec8e539b7af8de334a` passed regression 39221296969 (**133/133 standalone test files, 19/19 isolated missions, passive and active seeded skirmishes**) and validation 39221296925 (source syntax/load checks and atlas validation). Tests confirm protocol primitives and persistent ID round-trips but **not** live remote order replication, multiplayer host authority, shared frame advancing, resilience, real Xbox Edge, new sound/graphics quality or DLC gameplay parity. No such acceptance is claimed.

**Next technical work:** trustworthy session/team mapping to the newly stable entity IDs → ordered host command application at agreed frames → authoritative snapshots/checksums and reconnect policy → real browser vs browser match to victory → controller, media overhaul and detailed version-locked DLC gap implementation. Preserve the newer active Hard skirmish and projectile-save fixes already present on main.
