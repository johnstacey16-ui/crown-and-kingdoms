# Crown & Kingdoms — current completion roadmap

**Status: ACTIVE (31 October 2026).** Every task remains OPEN for final acceptance until a dated commit, test and (where applicable) physical Xbox or independent-network result is attached; existing partial implementations are preserved.

**Audited baseline:** `337974492df1ddfd5f9adb339b79855f005bd532`. This is a dated audit baseline, not a claim that the current tip or deployed build has passed tests. Read the [complete six-source audit](docs/audits/2026-10-31-consolidated-audit.md), [dated implementation register](MASTER_AUDIT_AND_DELIVERY_REGISTER.md), [historic roadmap journal](AOE2_PARITY_ROADMAP.md), [Xbox parity contract](XBOX_CONTROLLER_PARITY.md), [full product plan](XBOX_SERIES_X_FULL_PARITY_AND_MULTIPLAYER_PLAN.md), [free-only hosting policy](FREE_HOSTING.md) and [contributor workflow](AGENTS.md).


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
