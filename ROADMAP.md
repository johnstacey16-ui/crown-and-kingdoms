# Crown & Kingdoms — current completion roadmap

**Status: ACTIVE (31 October 2026).** Every task remains OPEN for final acceptance until a dated commit, test and (where applicable) physical Xbox or independent-network result is attached; existing partial implementations are preserved.

**Audited baseline:** `337974492df1ddfd5f9adb339b79855f005bd532`. This is a dated audit baseline, not a claim that the current tip or deployed build has passed tests. Read the [complete six-source audit](docs/audits/2026-10-31-consolidated-audit.md), [dated implementation register](MASTER_AUDIT_AND_DELIVERY_REGISTER.md), [historic roadmap journal](AOE2_PARITY_ROADMAP.md), [Xbox parity contract](XBOX_CONTROLLER_PARITY.md), [full product plan](XBOX_SERIES_X_FULL_PARITY_AND_MULTIPLAYER_PLAN.md), [free-only hosting policy](FREE_HOSTING.md) and [contributor workflow](AGENTS.md).


## Large-army chokepoint stress and corner-recovery fix — 31 October 2026 (`081f2d3`)

Implemented a reproducible `node scripts/stress-200.mjs --ticks=2400` stress command and `tests/large-army-chokepoint.test.mjs` against the canonical real browser-ordered production source. The 72×72 artificial grid has an edge-to-edge wall with only **two passable tiles**. It first verifies that sealing the gap makes A* return no route; then issues a formation move order for **200 soldiers**, reusing existing A* path and shared-formation diagnostics. The measured order planned 200/200 paths with 26,951 A* expansions. The simulation loop uses the production `walk` and `sep` primitives for 2,400 fixed ticks (80 simulated seconds).

The test initially exposed two concrete bugs: a soldier falsely completed movement next to the blocked corner, and two others crossed but followed obsolete left-side waypoints indefinitely after collision separation. `js/simulation.js` now provides `walkAxisSlide`, which tests legal single-axis displacement rather than abandoning a blocked diagonal; and `recoverMoveRoute`, which detects unusable ordinary-movement routes and replans from the current position toward the original final destination, without applying the rule to gather/attack orders. Sub-microscopic float changes cannot disguise a stopped movement attempt. The exact near-wall geometry was added to `tests/waypoint-collision-safety.test.mjs`, which now runs in fast CI. The service-worker shell revision became v62; no painted resource art, Xbox key bindings or hosting policies changed.

**Final hosted evidence:** [GitHub Actions 41246664294](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41246664294) on code commit [`081f2d3`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/081f2d376b98c65fe7451dde25e36617df7b66e3) passed **204/204 focused tests**, five quick validation gates and 39 production-script parses. Its extended 200-unit scenario had **200/200 gateway crossings and 200/200 completed movement orders**, with no blocked-cell occupation, invalid coordinates or pending soldiers. Current inventory **236 standalone regression files / 39 browser / 26 core / 24 headless scripts / 30 Markdown documents**. This does **not** establish Xbox Series S FPS, true multi-minute AI battles, arbitrary 200-unit chokepoint clearance, live-room networking or full 236-file regression acceptance.

## Seeded world checkpoint, save/reload and economy invariant acceptance — 31 October 2026 (`0c8e9be`)

Two new production-backed focused suites directly address independent audit verification requests. `tests/seeded-world-continuation.test.mjs` uses the real canonical headless source graph and `CK_SIM_SYNC.worldCheckpoint` to compare separately initialized same-seed game worlds after fixed simulation ticks, demonstrate distinct seeds produce different world hashes, and require **current-version save/load at tick 50** followed by identical resumed world hashes. This is **same Node engine** repeatability only: no cross-browser/RAF throttle, live Xbox, spectator or lockstep-network equivalence is implied.

`tests/economy-invariants.test.mjs` uses actual `train`, `trade` and `step(DT)` rules to test rejected unaffordable training, exact affordable queue payments, market buy/sell price progression, and nonnegative/finite kingdom treasuries and resource deposits through 150 live simulation ticks. No production economy or balance definitions were changed. These tests are wired into the centrally maintained fast hosted runner with corresponding runner-contract coverage and the README's machine-checked count.

[GitHub Actions 41217765163](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41217765163) passed **200/200 focused tests**, five quick source/offline/civilization/atlas/graphics checks, and the 39 production JavaScript syntax parses on code commit [`0c8e9be`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/0c8e9bef4641cf746a24a46681f4bc8936c08ccd). **Live current inventory:** 235 standalone regression files, 39 browser / 26 core / 24 headless scripts, 30 Markdown documents.

**Open acceptance:** isolated full 235-file test run, three AI seeds, 19 campaigns, Chromium, cross-browser deterministic equivalence, 200-unit chokepoint stress, real Xbox Series S Edge controller/FPS and remote-network multiplayer. High-cost workflows remain weekly/manual and free-only.

## Current external-audit reconciliation and evidence gate — 31 October 2026 (`9a7442c`)

Independent DeepSeek, Kimi and Gemini text reviews agree on the important unreleased scope: **26 partial civilizations, missing/unfinished DLC and ruleset parity, incomplete controller/multiplayer/campaign requirements, and no physical Xbox acceptance**. Their detailed snapshots are **not current source truth**: the Kimi/Gemini 14:30 audit was at `2ca216b` and the DeepSeek excerpts cite earlier 124-test/231-file checkpoints. GitHub comparisons confirm that `3379744` and `2ca216b` remain ancestors of `main`, contradicting the alleged unreachable historical baseline; this does not independently establish whether any unrelated force-push ever occurred. Current host [Actions 41214202628](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41214202628) ran all steps and passed **194/194 focused tests**, all five quick gates and the syntax parse of **39** browser scripts. Existing replay/authorization fixtures disprove "no network validation tests", but are not penetration testing or independent WAN acceptance.

To prevent another stale count from being presented as live evidence, `scripts/report-repository-inventory.mjs` now counts the actual checkout; a focused regression rejects disagreement between the current README inventory and **233 standalone test files, 39 production / 26 core / 24 headless scripts and 30 Markdown documents**. Four existing network authority/replay test files also run in the focused set. See [evidence reconciliation](docs/audits/2026-10-31-external-review-reconciliation.md).

**Priority remains verification without paid infrastructure:** keep full standalone regression and three seeded skirmishes + 19 campaigns as manually/weekly scheduled; run the Chromium art and room fixtures as separate browser acceptance. GitHub connector here does not expose a manual workflow-dispatch write operation; current local execution cannot clone GitHub due DNS/network restrictions. No full-suite or hardware-result claims are made. Continue module cleanup and save/load/congestion/invariant test hardening, preserving older `CK-###` identifiers and the 48 `AUD-###` roadmap tasks.

## Combat-bonus simulation extraction — 31 October 2026 (`2e4f819`)

Extracted **2,401 original source bytes** of existing spear-line, Camel/Heavy Camel, scout, skirmisher and melee Blacksmith research bonus definitions from `js/simulation.js` into `js/simulation-combat-bonuses.js`; left their bodies unchanged. Kept the simulation combat/damage entrypoint and movement delimiters intact, inserted the module before victory/logistics/core simulation in the canonical HTML and service-worker offline list, and incremented the offline shell cache to v61. Four isolated combat/technology fixtures and the runtime script-order regression were updated; a new owner/class-counter regression file enforces global script order and unique declarations.

Adding previously non-focused technology coverage revealed a stale Stable research source assertion from before Heavy Camel, which was corrected without changing gameplay. Then the real infantry/archer, three-tier melee research and Thumb Ring behaviour suites were added to the centralized `--focused` runner. [Hosted Actions 41213199014](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41213199014) passed **162/162 focused tests**, all five source/offline/civilization/atlas/graphics quick gates and syntax parses for **39 production browser scripts** on [`2e4f819`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/2e4f819937f9bef1e8c706d116074f25a0dc4a7e). The active inventory is **232 standalone test files, 39 browser / 26 core / 24 headless scripts, 29 Markdown documents**.

**Not accepted yet:** full 232-file isolated regression, three AI seeds, 19 campaigns, Chromium art/room, real Xbox Series S Edge, and independent-network multiplayer. Weekly/manual expensive-hosted and free-only CI policy unchanged.

## AI architecture cleanup and hosted verification — 31 October 2026 (`27b0bbf`)

Extracted three formerly inline AI helpers (`aiDockWaterReach`, `aiRebal` and `aiOpeningWaveNeed`) from `js/ai.js` into the pre-existing and browser-ordered `js/ai-policy.js`. Their **3,725 original source bytes** were moved unchanged. Dock connectivity and water-grid tests, the Feudal opening wave tests and Dark/Feudal villager economy rebalancing tests were retargeted to the new owner and added to `--focused`; module-ownership contracts now enforce unique declarations and correct offline load order. Offline shell name advanced to `ck-shell-v60-ai-policy-extraction` without modifying painted art or resource manifests.

[GitHub Actions run 41212115930](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41212115930) passed **138/138 focused tests** plus all five quick checks and 38 production-script syntax parses on code revision [`27b0bbf`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/27b0bbfafe727784dd83aa27e48ed19b33331f6b). Still **231 standalone regression files**; full regression/seeded AI/19 campaigns/Chromium/physical Xbox and independent multiplayer hardware acceptance are **not proven** on this latest code. The weekly/manual free-only CI policy remains in place.

## Branch consolidation and controller/economy acceptance — 31 October 2026 (`74ff679`)

**All 26 non-main branches are merged by ancestry**: three already belonged to `main`; 21 old diverged histories were reconciled in three merge commits using the newer and focused-tested `main` tree as the explicit conflict resolution (`170a2d2`, `477dbe1`, `9703e39`). Two branches required actual forward-porting: `fix/aoe2-de-camel-heavy-camel-civilizations` was merged at [`0ffde35`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/0ffde35d51c7c9fec4df19cf14e5803596a745f8), including research gating, Heavy Camel combat and a current-version host/save fixture; `feat/aoe2-villager-economy-parity` was merged at [`d0a5e7b`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/d0a5e7b50d29d69395fe5d3de2942c92372a3f0d), preserving current farm/controller code and incorporating hunting carry, shared explored-site access, approach-space capacity, fishing rates and Villager line of sight. GitHub PR #37 is marked **merged**. Historical branch names remain available; no branch deletion was requested or performed.

After integration, `tests/villager-site-assignment.test.mjs` was converted from a handwritten source concat to the canonical loader, a new non-farm worksite-capacity assertion was added, and the previously stale radial-controller test extraction was corrected. [GitHub Actions run 41211276442](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41211276442) passed **124/124 focused assertions** plus source/offline/civilization/atlas/graphics validation on code commit `74ff679`. Current footprint: **38 production browser scripts, 25 core / 23 headless, 29 Markdown documents and 231 standalone regression test files**.

**Outstanding final acceptance**: all 231 standalone tests, three seeded AI games, 19 isolated campaigns, Chromium, independent-network multiplayer and physical Xbox Series S Edge checks remain unverified on the current tree. The costly workflows stay weekly/manual; no paid hosting or new CI workload on every push was introduced.

## Current AI and test cleanup — 31 October 2026 (`207d01f`)

**Current inventory: 29 Markdown documents, 229 standalone regression files, and 38 browser / 25 core / 23 headless scripts.** Consolidated naval input guards into enemy-composition checks and retry/seed guards into the map-generation suite; the map test now uses the canonical HTML-ordered source loader instead of an outdated manual file list. The training-cap and invalid-queue tests now share an executable fixture without losing their distinct assertions.

Moved 753 existing bytes, including `aiSavingAgeFood` and `aiTownTechReady` and the original policy comment, unchanged from `js/ai.js` to the already-loaded `js/ai-policy.js`. The ownership and age-budget behavior tests were updated and added to focused CI. [Run 41208600395](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41208600395) passed **109/109** after naval/map consolidation, [run 41208743092](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41208743092) passed **111/111** after the training fixture consolidation, and [run 41208907950](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41208907950) passed **113/113 focused tests** plus syntax, runtime, civilization, atlas and graphics checks on `207d01f`.

**Outstanding:** all 229 regression files together, the three seeded AI scenarios, 19 isolated campaigns, Chromium and physical Xbox Series S/network acceptance. The expensive hosted suites stay manual/weekly; no paid hosting was enabled.

## Town Bell fixture consolidation — 31 October 2026

The earlier `tests/town-bell.test.mjs` and `tests/town-bell-garrison-capacity.test.mjs` use the same simulation helper; the duplicate fixture was replaced by one shared setup, while all **seven** named Town Bell controller/routing/capacity assertions remain present. The active standalone suite drops from **233 to 232** test files. The merged suite now participates in fast GitHub validation. No garrison/gameplay rules were modified. [Hosted GitHub Actions run 41207740686](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41207740686) passed **107/107 focused assertions**, including all seven merged Town Bell cases, and all five source/offline/civilization/atlas/graphics checks. The complete 232-file regression suite, three seeded AI runs, 19 campaign missions, Chromium and physical Xbox remain **unverified** on this code revision.

## Unified acceptance runner checkpoint — 31 October 2026 (`1c46735`)

The owner-approved cleanup replaced duplicated shell loops for regression tests, three AI matches and 19 isolated campaign runs with a shared cross-platform `scripts/run-checks.mjs` plan. Chromium art/layout fixtures and the opt-in Windows workflow now reuse it. Fast hosted validation uses `--focused`, whose 33-file roster lives in the runner rather than 33 separately maintained workflow YAML entries. The runner also has `--regression-files`, `--skirmishes`, `--campaigns`, `--browser`, `--xbox-contracts`, `--regressions` and `--full` modes, grouped logs, failure aggregation and GitHub job summaries. The number of distinct tests and mission coverage was deliberately **not** cut just to improve a metric.

[Hosted validation 41207392451](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41207392451) passed **100/100 focused assertions**, plus syntax/offline/civilization/atlas/graphics checks, at source commit `1c46735`. The current inventory remains **233 standalone regression files and 19 separate campaign simulations**. **Full regression, seeded AI, all campaigns, Chromium, physical Series S performance/controller acceptance and independent multiplayer are unverified on the current tree.** Heavy hosted workflows remain manual or weekly, with free-only hosting unchanged.

## Latest cleanup acceptance — 31 October 2026 (`c85efc9`)

**Current source state:** 38 production browser scripts, 25 core and 23 headless; **29 Markdown documents and 233 standalone regression files**. Merged overlapping siege and technology-catalogue fixtures without removing their unique assertions, and eliminated obsolete fixed script totals from runtime-order, procedural-art and ownership tests. The canonical runtime graph tests are now included in the fast hosted checks.

[GitHub Actions validation 41206485365](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41206485365) **passed all 88 focused assertions**, syntax validation and browser/offline, civilization, sprite-atlas and graphics inventory checks on source commit `c85efc9`. The active roadmap is shorter because obsolete checkpoint narratives moved to the archived audit log, with no historical evidence deleted. **The full 233-file regression suite, seeded AI, all 19 campaigns, Chromium and physical Series S/network acceptance remain outstanding.** Full hosted workflows stay weekly/manual to preserve free-only hosting.

## Current cleanup and validation status — 31 October 2026

**Cleanup before new gameplay remains the owner's priority.** The current browser/offline/headless script inventory is **38 / 25 / 23**, with **29 Markdown documents and 235 standalone regression files** at [`b35466a`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/b35466a4773fb7773668f7f470724dbfe6468964). Key changes include canonical script loading, extracted simulation victory/logistics helpers, separated Xbox graphics benchmarking and AI decision policies, plus consolidated art checkpoints and overlapping tests. The original stone, gold and berry artwork, Xbox Series S Edge input behavior, current-build saves, multiplayer authority and free-only hosting policy remain required.

[Hosted validation 41205502428](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41205502428) passed **81/81 focused assertions** and source, offline, civilization, atlas and graphics checks on that source revision. **All 234 current standalone regressions after the siege-fixture consolidation, seeded AI, all 19 campaigns, Chromium and physical Xbox/network acceptance remain unverified on the latest tree.** The full hosted regression/Chromium workflows are weekly/manual to protect free usage. Earlier runner-allocation errors remain unexplained, but the latest lightweight hosted runner worked.

See [the active refactoring inventory](docs/REFACTORING_INVENTORY.md) for exact extraction/ownership history; [archived 31 October checkpoints](docs/audits/2026-10-31-gameplay-checkpoints.md) preserve the older CI claims and progressive code/test counts. Historical checkpoint totals are **not** current acceptance.

**Current test inventory after the latest siege-policy fixture merger: 234 standalone files.** The 81 focused assertions above were validated on the previous 235-file checkpoint and must be rerun on the updated tree.

## Pre-release save-game policy — 31 October 2026

**Decision:** Saves from unfinished development builds are **not guaranteed to load after subsequent updates**. Do not maintain historical save migrations or retain obsolete data structures solely for old test saves. Focus on completing game systems first; establish the stable, versioned save compatibility contract and required migration tests at the release/final acceptance phase. Continue to test creating, loading and validating saves made by the **same current game version**, and handle an obsolete/incompatible payload safely rather than corrupting the match or silently deleting the original save. Do not change authenticated multiplayer/network compatibility requirements under this exception.

This supersedes any earlier instructions saying to preserve *all old saves* across refactors. A clean new game or regenerated test save is acceptable after a schema change. Do not delete save functionality or compromise existing save validation.

## Latest feature checkpoint — 31 October 2026 (before cleanup)

**Last gameplay feature code commit:** [`083864a`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/083864a7f542f549141c7387ef958da9a6d0d076), with **231 standalone test files**. `f3519cc` replaced the seven provisional R3 presets with the reference-listed console ratios (Food and Wood, Basic, Militia Rush, Balanced, Economic, Defensive, Naval), added an **Auto Farms** eighth R3 sector, and saved `autoFarms` in the existing `S.vp` object with backward-compatible false default. The reference is a [community-reported table](https://ageofempires.fandom.com/wiki/Villager_Priority); sector and UI confirmation on physical Xbox are still required.

`083864a` wires actual opt-in **automatic Farm construction** into the existing solo/campaign worker path: only after no reachable food option, near a *completed* Mill or Town Centre, on an explored unoccupied square with a reachable route. The normal farm resource node is created, then the standard **60 wood** is charged; no failed placement is charged. If short on wood, an automated worker can harvest wood and retry after delivery. This is explicitly **disabled during live authenticated multiplayer** pending authoritative worker-priority commands. Existing farm reseeding behavior remains separate. Six focused source-behavior fixture checks passed; the full 231-file Node suite, seeded AI/campaign and Chromium have **not** run successfully on this SHA.

**Actions blocker:** all three hosted workflows on `083864a` failed before any job steps, as on multiple preceding commits. Root cause unverified. Last full passing GitHub source, 226-file, campaign, AI and Chromium baseline is [`d181720`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/d181720a74446bc1723c1d21581bb70b66f6f44f). Do not call the latest changes CI-green until jobs actually start and complete.

**AUD-010 is still PARTIAL**: physical Xbox Series S controls, exact preset radial positions, default Auto Farms setting in Options, multiplayer R3/priority commands, resource fallback/dropoff subtleties and late-game performance are not accepted. Keep stone/gold/berry artwork and all free-only hosting restrictions unchanged.

Previous gameplay and controller checkpoints have been moved to [the historical checkpoint archive](docs/audits/2026-10-31-gameplay-checkpoints.md). Refer to the dated delivery register for individual implementation details rather than repeating old “latest” statements here.

## Non-negotiable end goal

Original browser RTS with **full functional-category parity** for Age of Empires II: Definitive Edition on Xbox Series X, including **all 11 Xbox gameplay DLC families in the 31 October 2026 baseline**; every default Xbox controller action must function on **Xbox Series S Edge** in solo, campaigns, menus and multiplayer. Preserve the existing engine, art and security safeguards. No copied commercial assets, music or protected scenarios. Only confirmed free hosting, no paid upgrades, credits, overages or Railway reactivation; fail closed on quotas.

## Evidence baseline — do not overclaim

| Workstream | Established at audited SHA | Acceptance still open |
|---|---|---|
| Local tests | Claude reports 219/219 standalone regressions passed and atlas validation succeeded locally | Latest-commit hosted and Xbox tests |
| GitHub Actions | Recent runs reportedly failed before job steps | Root cause unknown, green hosted jobs required |
| Civilizations, units, ages | 26 listed civs, core RTS loop works | Complete reference roster, bonuses, unique techs, unit lines |
| Campaign | 19 original missions run, automated outcome 7 wins / 7 losses / 5 timeouts | Human controller win paths, full scenario engine |
| Xbox controls | LS pan, RS zoom, A, RT radial, LB groups and other core paths exist | R3, View, X, LT, sector and multiplayer parity; physical acceptance |
| Multiplayer | Authenticated two-human WebRTC/host-validated preview | Independent-network match to victory, reconnect, player scale |
| Graphics | 47/47 current-roster movement/activity art; resources **stone, gold, berry bushes**; construction, fire and projectiles | Directions/death/work, factions, DLC and console FPS |
| Audio | Procedural Web Audio engine, buses and spatial panning | Resume quality, production event/audio coverage |
| Xbox Edge | Not physically benchmarked after later rendering changes | Controller, HUD, FPS, memory, suspend/resume |
| Hosting | Vercel free-only deployment policy, Supabase admission, Railway legacy records | Actual free quotas, live transport policy and account verification |

The historical 25 October ~4 FPS/613ms draw capture predates renderer changes; do not claim current FPS. 47/47 means *current troop art coverage*, not finished animation, gameplay or DLC. Past green CI at older SHAs proves neither this commit nor on-console acceptance.

## Ordered milestones and gates

1. **P0: Evidence and correctness (AUD-001–007).** Diagnose hosted Actions pre-step failures. Correct the First Hearth X-versus-A gathering guidance, apply civilization starting HP bonuses correctly, reproduce/fix gamepad refocus edge cases, record the first physical Xbox Series S baseline and establish a current Xbox reference/status matrix.
2. **P1: Controllers, independent multiplayer and data core (AUD-008–021).** R3 priorities, X context, View, LT waypoints, RT/LB sectors, accessible invite UI; prove one normal 1v1 win across separate networks; define lockstep fog threat model, packet loss/rejoin, Auth and quota failures; build validated per-civ, per-tech and regional-unit content schemas. Profile 50/150/200 and 800 mixed-unit scenes *before* a renderer rewrite.
3. **P2: Complete base mechanics (AUD-022–033).** Base civilizations, two unique technologies and restrictions, unit/armor classes, naval/siege, farms/extra Town Centres, AI, elevation/maps, original scenario triggers, complete controller-first tutorial, scalable multiplayer only after stable 1v1.
4. **P2: All DLC mechanics (AUD-034–040).** Lords of the West; Dawn of the Dukes; Dynasties of India; Mountain Royals; Three Kingdoms; Last Chieftains; Viking Sagas; Victors and Vanquished; Return of Rome; Chronicles: Battle for Greece; Chronicles: Alexander the Great. Implement original mechanical equivalents and campaign stories; separate antiquity/Chronicles rulepacks and model regional units/civ reworks.
5. **P2/P3: Art, audio and whole-product acceptance (AUD-041–048).** Original directional/work/death assets, regional building styles, consistent UI and accessibility, new soundtrack, SW/live security, Xbox Series S hardware soak and sign-off. Performance and hardware checks run **continuously**, not only at the end.

## Full 48-task live backlog

`AUD-###` is a new set of audit IDs; existing `CK-###` milestones retain their original meaning. All items below are **OPEN** unless subsequently closed with exact code/test/hardware evidence, and "open" does not imply the underlying system has no implementation.

IDs `AUD-###` are suggestions for the existing master register; **do not overwrite or silently renumber** existing CK tasks.

| ID | Priority | Task and affected files | Acceptance / dependency |
|---|---|---|---|
| AUD-001 | P0 | Diagnose GitHub Actions pre-step failures: `.github/workflows/` and owner Actions settings | Exact failure cause and successful **hosted** validation/regression/browser runs; if service issue, record blocker |
| AUD-002 | P0 | Fix First Hearth X-versus-A tutorial: `js/campaign.js`; controller help tests | Scenario guidance matches actual contextual order; campaign regression + controller VM |
| AUD-003 | P0 | Fix starting civ HP bonuses: `js/mapgen.js`, `js/entities.js`, `engine.js` | Starting villagers/TC have appropriate civ-modified HP without double application on future spawns; seeded save/regressions |
| AUD-004 | P0 | Test and handle held-button refocus: `js/input.js`, `engine.js` | No synthetic A/RT/X order until release after browser refocus; menu/placement saved; tests in `xbox-controller-contract` |
| AUD-005 | P0 | Establish physical Series S baseline, capture saved reproducible scene and HUD | Preset 50/75/100, measured FPS/draw/sim, Xbox build/Edge version/controller video, no invented performance claims |
| AUD-006 | P0 | Publish current status and replace obsolete Railway links in README/server README | Current browser URL/transport/code SHA/test count and superseded docs unmistakable |
| AUD-007 | P0 | Create official reference feature register: data + docs | Every base/DLC/category/console binding has VERIFIED/PARTIAL/MISSING/UNVERIFIED disposition and citation |
| AUD-008 | P1 | Review audio suspend/resume: `js/audio.js` | First alert/mood restoration and rate limit verified in synthetic and browser tests |
| AUD-009 | P1 | Correct campaign acceptance: `tests/simulation-smoke.test.mjs`, `js/campaign.js` | No timeout/defeat misreported as a human win; each mission has feasible documented controller win path |
| AUD-010 | P1 | R3 priorities UI + worker automation: `js/input.js`, `js/ui.js`, `js/kingdom.js` | Seven presets, manual ratios, farm behavior, cancellation and paid orders match captured reference; Xbox proof |
| AUD-011 | P1 | Contextual X and View notification: `engine.js`, `js/input.js`, `js/ui.js` | No conflict with LB X group assignment; complete context matrix with Xbox evidence |
| AUD-012 | P1 | LT-held categories and waypoint tools: input, minimap and MP map | Exact Xbox gestures and data limits; no incorrect shortcuts |
| AUD-013 | P1 | Exact RT/LB wheel comparison and multiplayer Y build/train: input and network UI | Each official sector/gesture/confirmation available and host-validated, hardware recorded |
| AUD-014 | P1 | Controller-only multiplayer invitation entry: `js/network-lobby.js` | Can create, join and play via Xbox controller with no external keyboard/mouse |
| AUD-015 | P1 | Stabilize 1v1 natural victory over independent networks | One full match to normal terminal result with frame/hash/ACK evidence, no local-loopback substitution |
| AUD-016 | P1 | Define multiplayer fog/anti-cheat threat model | Explicit choice between trust-based full-world peers vs trusted state redaction and free feasibility |
| AUD-017 | P1 | Disconnect/rejoin, timeout, hash mismatch and frame stall protocol | Reconnect if safe; otherwise both clients terminate visibly without divergence; loss injection tests |
| AUD-018 | P1 | Review Auth relay expiry, quotas and NAT failure policy | Proven effect of 2h session on already-connected peers; fail-closed UX; no paid TURN enabled |
| AUD-019 | P1 | Data-driven civ schema and validator: `engine.js`, `js/config.js`, new `data/` | Existing civs unaffected; upgrades, bonuses, unique techs, team/regional units fully expressible |
| AUD-020 | P1 | Current Xbox civ and DLC baseline diff harness | Machine-readable reference version; no false completeness from a name or icon |
| AUD-021 | P1 | Benchmark large-army actual device before renderer redesign | Profile same-kind/mixed scenes and identify CPU, GPU, atlas, GC and path bottlenecks |
| AUD-022 | P2 | Nine missing base civilizations + bonuses and unique units | Each civ can complete a full skirmish; availability, AI, controller and art checks |
| AUD-023 | P2 | Second unique techs and complete civ restrictions | All effective tech trees, bonuses and age rules reference-diffed |
| AUD-024 | P2 | Full unit and armor-class upgrade trees | Separate tactical behaviour and visuals where needed, tiered cost/effect tests |
| AUD-025 | P2 | Expand naval line and dock tech | Fire/demo/cannon etc, pathing, transport/shore, AI and controller-only victory |
| AUD-026 | P2 | Siege, defensive structures and gates | Ram/siege tower/petard/upgrades, packed trebuchet, gate interaction; tests |
| AUD-027 | P2 | Multiple TCs, boar/sheep, farming and civ economy exceptions | Costs, prerequisites, ownership, auto-economy, pathing and save/load tested |
| AUD-028 | P2 | AI strategy and long-game reliability | AI ages, builds, scouts, spends and attacks; reproducible anti-stall benchmarks |
| AUD-029 | P2 | Map sizes, cliff/elevation and complete fog semantics | Performance + map-validity tests at Xbox reference sizes |
| AUD-030 | P2 | Advanced original scenario engine | Multi-faction triggers, cinematics/event categories, mission choices, controller presentation |
| AUD-031 | P2 | Full controller-first tutorials and accessibility | Every reference control explained accurately; usability-tested TV distances |
| AUD-032 | P2 | 3–4 human rooms after 1v1 proven | Admission/host ordering, scalable architecture and quota stress tests |
| AUD-033 | P2 | More multiplayer settings, diplomacy, replay/spectator where Xbox-supported | Reference comparison; fully controller accessible |
| AUD-034 | P2 | DLC wave I: Lords of the West + Dawn of the Dukes | Civs, unique buildings/effects, tech trees, AI, original scenarios, Xbox tests |
| AUD-035 | P2 | DLC wave II: Dynasties of India + Mountain Royals | Correct civ split, elephant/regional lines, mountain abilities, architecture, original scenarios |
| AUD-036 | P2 | DLC wave III: The Three Kingdoms + Last Chieftains + Viking Sagas | Civs, reworks, regional-unit access, original campaigns and UI |
| AUD-037 | P2 | DLC scenarios: Victors and Vanquished | 19 original mechanically equivalent scenario categories with advanced triggers and accessibility |
| AUD-038 | P2 | Separate `Return of Rome` antiquity ruleset | Independent unit/building/age/economy data, AI and original scenarios |
| AUD-039 | P2 | Separate Chronicles pack 1: Battle for Greece | Dedicated systems and campaign, testing distinct from medieval core |
| AUD-040 | P2 | Separate Chronicles pack 2: Alexander the Great | Three civs + 18 original scenario equivalents and campaign progression |
| AUD-041 | P2 | Complete unit direction/work/death/boarding graphics | Consistent scale/anchors/performance, originals, visual acceptance incl. DLC units |
| AUD-042 | P2 | Finish faction/age architecture and building impact/destroy states | Source catalogue, full art and native fallback tests; preserve current resource art |
| AUD-043 | P2 | TV HUD, icons, contrast, graphics preset/performance acceptance | Physical 1080p/TV checks, UI not blurred at 50% field preset |
| AUD-044 | P2 | Original full audio/music production and accessibility | Event matrix completed, bus mixing, no duplicated/late sounds on resume |
| AUD-045 | P2 | Service-worker, actual-origin and offline-upgrade validation | Consistent versions, integrity tests, restore after interrupted installs |
| AUD-046 | P2 | Final security/operational/asset-provenance review | No credentials in logs, free quotas respected, licenses for original assets, no paid dependencies |
| AUD-047 | P3 | Physical Series S whole-game acceptance | Complete solo/skirmish/campaign and MP tests, no keyboard/mouse, long soak |
| AUD-048 | P3 | Whole-product parity sign-off | All official Xbox gameplay categories and DLC rows verified or specifically identified as true platform impossibilities |

## Safe repository cleanup and refactoring sequence

**Avoid bulk deletion and whole-engine rewrites.** The README is now a current-status guide rather than a stack of dated graphic milestones, obsolete Railway play links and old test counts. Historical implementation evidence stays available through the dated register and Git history.

1. Inventory *actual* runtime entries: `index.html` scripts, `sw.js` cache dependencies, art manifests/generator inputs, browser and Node tests, GitHub Actions, Supabase/Node transports and Vercel deployment. Mark each file **active**, **historical**, **unused proven** or **uncertain**.
2. Audit suspected redundant code such as `CIV0` and legacy lobby/transport adapters by searching all runtime/test references and reproducing behavior. `multiplayer.js` is still part of the game shell; do not delete it merely because it includes older room code.
3. Refactor in **small, testable patches**, starting with schema-validated civ/unit/tech definitions, stable module responsibilities, better-structured controller gestures and explicit network adapters. Preserve **current-build** save/load correctness and safe rejection of incompatible older saves, Xbox button defaults, simulation correctness, original assets and free quotas; historical pre-release save migration is not required.
4. Remove old files, script paths or art **only after** dependency proof, replacement/compatibility checks, and updated `index.html`, service worker, generator manifests and tests. Never weaken a test simply to make cleanup pass.
5. Record exact commit and local/hosted CI evidence for every change. Physical Xbox acceptance and complete network matches remain independent gates; pre-step CI failures cannot be called successful runs.

## Working instructions and next steps

- Always check the latest `main` against the dated baseline, follow `AGENTS.md`, work directly on `main` with no force push, and run relevant local checks for code changes. Documentation-only work does not establish game correctness.
- **Immediate engineering order:** AUD-001 CI; AUD-002 First Hearth prompt; AUD-003 starting civ bonuses; AUD-004 held-button refocus; AUD-006 accurate README and baseline; AUD-005 real Xbox measurements; AUD-007/019/020 data/register scaffolding; AUD-010–018 controller/1v1.
- Label findings **VERIFIED**, **PARTIAL**, **MISSING**, **UNVERIFIED** or **BLOCKED**, with test/commit/source evidence. Do not convert reported bugs into facts without reproduction. Never invent Xbox default bindings; no fixed-point or WebGL overhaul without evidence.
- Update task acceptance/evidence **here**, append dated implementation checkpoints in `MASTER_AUDIT_AND_DELIVERY_REGISTER.md`; keep the source audit frozen as a historical evidence snapshot. Keep Xbox/DLC/reference entitlement version pinned and updated when verified.
