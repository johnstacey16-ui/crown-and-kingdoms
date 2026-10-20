# Crown & Kingdoms — authoritative audit and delivery register

Updated 20 October 2026. Work continues directly on `main`.

This register tracks the 46 agreed delivery tasks. PARTIAL means implementation exists but the stated acceptance is still open. Automated checks do not establish real-browser, physical Xbox or deployed-service acceptance. Original code, artwork, music and campaigns remain required.

## Current verified code

- Code commit: [`13ec08c`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/13ec08c8606691b7dee2bf88ba2a718d1e4af30a).
- [Source and atlas validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39476141637): passed on GitHub Ubuntu / Node 22.
- [Regression suite](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39476141681): all 154 standalone test files, all 19 isolated campaign simulations and all three seeded production-AI skirmishes passed.
- New multiplayer scenarios use two independent production-game VM contexts and the real loopback HTTP relay. They issue gather/deposit, construction, military training and research through the actual battlefield UI, and exercise a combat kill through the final replay/hash acknowledgment. Fixture durations/positions are bounded for regression tests; these are not human browser matches.

## Current multiplayer and visual milestone

The authenticated battlefield now admits owned move/stop, gather, build, train, cancel, research, rally, attack/attack-move and stance commands. Resource targets have persistent IDs; the host rechecks current sight, resource identity, ownership, routes, costs, prerequisites and building sites before mutation. Rejected orders do not enter the replay journal.

The UI projects team-relative current sight rather than the solo team-zero fog array. It draws terrain, resources, explored fog, health, unit/ship/building silhouettes, selected paths and visible projectiles. A on visible resources/opponents submits gathering/attack; RT opens contextual production or construction; RT+Y changes economic/military build pages; LT repeats placement or requests five trained units. Exact wheel sectors, all special actions and physical Xbox parity remain unverified.

A natural result stops simulation only after the final frame is replayed and acknowledged. Victory/defeat is relative to each human team; it is not reported as a generic network failure.

The Node relay still requires a long-running same-origin HTTPS deployment. Static Vercel hosting does not supply this process. There is no reconnect/resume or server persistence yet. See [server/README.md](server/README.md) for the actual transport contract and deployment gates.

## Delivery order

1. Finish and deploy the synchronized 1v1 service: reconnect/snapshots, remaining command families, independent-browser full matches, disconnect recovery and measured network cadence.
2. Complete the original graphics overhaul: asset inventory, faction/directional animations, main-world presentation, visual captures and Xbox frame budgets. The new battlefield is a substantial rendering stage, not the finished art overhaul.
3. Close core missing gameplay/controller features: R3 priorities and ratios, multiplayer groups/minimap/formations, garrison/naval/trade/diplomacy commands, special abilities and content restrictions.
4. Finish original audio/music and reference-content matrices; complete Xbox Series S/X release acceptance.

## Task register

| ID | Prio | Track / task | Status | Implementation/evidence and acceptance requirement |
|---|---|---|---|---|
| CK-001 | P0 | Comprehensive CI failure inventory | VERIFIED (automated) | Current standalone files, isolated campaign suite and seeded AI skirmishes run in CI. Current evidence is recorded above; retain failure summaries. |
| CK-002 | P0 | Repair current regression failures | VERIFIED (automated) | Current matched source/atlas and regression runs pass. This is automated evidence, not release or hardware acceptance. |
| CK-003 | P0 | Basic complete land skirmish | PARTIAL | Three seeded passive/active production-AI land skirmishes finish naturally, including reloads. Real controller/browser matches and more seeds remain open. |
| CK-004 | P0 | AI ability to finish matches | PARTIAL | Production AI is covered by seeded active and passive skirmish results. Broader map/seed/late-game and human opposition acceptance remains open. |
| CK-005 | P0 | Current-version save round-trip | PARTIAL | Manual/autosave reference and counter validation now covers persistent resource IDs as well as units/buildings. Long browser/naval/garrison checkpoint coverage remains required. |
| CK-006 | P0 | Population and production deadlocks | IMPLEMENTED/UNVERIFIED | Recent repairs in engine.js/simulation.js. Exercise queue reservations, house loss, caps, restored games and multiple concurrent buildings in full match. |
| CK-007 | P0 | Real two-human shared multiplayer | PARTIAL — integrated battlefield | Authenticated two-client HTTP tests exercise gather/deposit, paid construction, military training, research, combat and final acknowledged victory. Public relay deployment, independent browser/controller matches and remaining commands are open. |
| CK-008 | P0 | Multiplayer desync detection and failure handling | PARTIAL | Live stop-and-wait frame replay, ownership/sequence guards, duplicate handling, hash checks, timeout/failure and final-frame ACK are tested. Reconnect/resume and recovery snapshots remain missing. |
| CK-009 | P0 | Controller-only core game flow | PARTIAL | Solo and authenticated battlefield provide many core controller functions; full controller-only flow and Xbox hardware acceptance remain open. |
| CK-010 | P1 | Correct RT contextual wheel and site commands | PARTIAL | Authenticated RT building pages, RT+Y switching, paid training/research and build previews now exist. Exact reference sectors/positions and full site-command coverage require comparison. |
| CK-011 | P1 | LB/RB, D-pad and control group parity | PARTIAL | Solo groups/quick-selection/minimap have corrected bindings and saved groups. Multiplayer LB groups and RB minimap remain missing; see XBOX_CONTROLLER_PARITY.md. |
| CK-012 | P1 | Villager priority presets and auto economy | PARTIAL | Legacy worker targets exist. The documented R3 priorities wheel, seven presets, manual ratios and automatic-farm toggle remain missing. |
| CK-013 | P1 | Economy completeness and balance | PARTIAL | Gather/dropoff, farms, market/trade, fishing, relics implemented; verify gathering/carry/technology maths, depletion, farm wood costs, housing and economy pacing against reference. |
| CK-014 | P1 | Technology catalogue and effect integration | PARTIAL | config.js TE, engine.js civilisation unique techs, unit stat/render/AI use; enumerate every base reference tech and test prerequisites, cost, correct runtime effect and UI availability. |
| CK-015 | P1 | Damage/armour/counters | PARTIAL | Config and engine contain class data and bonuses; verify attacks against infantry/cavalry/siege/ships/structures, minimum range, ballistics, projectiles and friendly fire case by case. |
| CK-016 | P1 | Movement, collisions and pathfinding | PARTIAL | pathfinding.js, input.js, simulation.js; run land/water/ford/gate/obstacle and large group tests, verify fallback and no stranded/oscillating units. Do not infer bugs from unaudited audit claims. |
| CK-017 | P1 | Formations, stances and combat orders | PARTIAL | Solo Y immediately switches Line/Split through normal movement planning. Six menu shapes, stances and combat orders exist; multiplayer formation commands and exact reference behavior remain open. |
| CK-018 | P1 | Fair AI economy and tactical scaling | PARTIAL | ai.js advanced routines exist; compare Easiest–Extreme against observed reference, exclude unsupported claims of cheat multipliers, test raids/defence/attack waves and late-game rebuilds. |
| CK-019 | P1 | Land and naval map correctness | PARTIAL | mapgen.js map audit, transport landing, docks, ships; confirm starts, food/gold/stone/wood, viable shores, accessible enemies, correct terrain and match completion. |
| CK-020 | P1 | Diplomacy, alliances and victory rules | PARTIAL | kingdom.js and simulation.js support several modes and alliances; test win/lose precedence, simultaneous defeat, team relations, tribute, sudden death and scoring rules. |
| CK-021 | P1 | Save game deletion and recovery UX | PARTIAL | Manual slots, rolling autosave, IndexedDB mirrors and explicit delete UI exist; test corrupt-save delete, cancel, overwrite, restored-backup tombstones, offline quota exhaustion. |
| CK-022 | P1 | Full 19-mission campaign human acceptance | PARTIAL | 19 isolated Node campaign suites passed on baseline CI; complete all 19 with controller-only actual gameplay, triggers, defeat, save/reload, unlocks, no softlocks. |
| CK-023 | P1 | Xbox screen readability and accessibility | UNVERIFIED | ui.js and render.js: TV distance legibility, contrast, scaling, button prompts, focus, controller disconnect and button remapping; physical Xbox Edge required. |
| CK-024 | P2 | Reference civilisation table | PARTIAL | engine.js CIV has 26 entries, bonuses and unique units/techs; compare verified **included base** Xbox reference roster, bonuses, team bonuses, restrictions and architecture one by one. |
| CK-025 | P2 | Reference unit catalogue | PARTIAL | config.js U plus engine.js Object.assign(U). List effective runtime roster after extensions, distinguish unit upgrade labels from new unit keys, identify real missing lines/abilities. |
| CK-026 | P2 | Reference building catalogue | PARTIAL | Palisades now have construction, repair, collision, destruction, procedural art and saves. Authenticated building orders cover implemented economic/military build pages; remaining catalogue functions require inventory. |
| CK-027 | P2 | Reference tech-tree UI and restrictions | PARTIAL | ui.js tech tree + config.js TE + unique technologies; cross-check civilisation availability and age/building requirements and live research effects. |
| CK-028 | P2 | Reference map and mode catalogue | PARTIAL | menus.js has 14 map-layout choices, custom presets, 7 victory conditions, 2–4 kingdoms. Enumerate base Xbox map types, mode rules, standard settings and clearly label custom additions. |
| CK-029 | P2 | Console tutorials and tooltips | PARTIAL | ui.js in-game control help and First Hearth training exist; assess guided teachability and missing accessibility assistance. |
| CK-030 | P2 | Post-match statistics and spectator/replay scope | INVESTIGATE | Verify actual end-screen stats against Xbox reference; decide whether replay/spectator are mandatory in agreed base, optional online capability or separate milestone. |
| CK-031 | P0 | Shared 2–4 human multiplayer integration | PARTIAL — two humans | Two authenticated human slots share a simulation and terminal result. Garrison/unload, trade, tribute/diplomacy, priorities/formations, reconnect and 3–4 humans remain open. Browser play has no native Xbox matchmaking integration. |
| CK-032 | P1 | Original sprite/animation asset quality | PARTIAL | Existing original atlases plus the new team-relative procedural battlefield art. High-resolution faction silhouettes, directional animation coverage and visual captures remain required. |
| CK-033 | P1 | Music, ambience and feedback | PARTIAL | audio.js procedural sound; audit actual audible events, prompt initiation/resume and production-ready original sound suite. |
| CK-034 | P3 | AI and civilisation balance | UNVERIFIED | Repeatable test batteries and human matches; record win rates and concrete deviations, avoid arbitrary 1:1 numerical approximations unsupported by reference evidence. |
| CK-035 | P3 | Canvas/game-loop rendering and input profiling | UNVERIFIED | Measure simulation/draw frame time, memory/GC, p95 input delay, sprite and A* counts on real Xbox Series S first. |
| CK-036 | P4 | Xbox Series S and X release acceptance | MISSING EVIDENCE | Test declared population/map/player limits with controller and Edge; record hardware/browser build, peak memory, frame time and full-match stability. |
| CK-037 | P4 | Eight humans × 500 pop stretch target | NOT IMPLEMENTED | Separate feasibility gates: 2×200 → 4×200 → 8×200 → 8×500 with shared pathfinding, network budgets, simulation checksums and measured physical Xbox performance. |
| CK-038 | P1 | Full Xbox DLC entitlement/content scope | OPEN / REQUIRED | New owner request expands the target to all gameplay DLC available on Xbox as of 19 October 2026, including distinct Chronicles/Return of Rome variants. Catalogue editions, bonuses, units, research, scenarios and modes; verify original implementation per category. Native Xbox achievements/cloud saves/matchmaking still require separate platform architecture. |
| CK-039 | P4 | Final functional readiness sign-off | OPEN | All accepted required scenarios pass: deterministic tests + real browser 1v1/naval matches + saves + campaigns + real shared multiplayer + console controller hardware. |
| CK-040 | P4 | Final reference-fidelity sign-off | OPEN | Every required Xbox base + gameplay-DLC feature in CK-024–030, CK-038 and CK-044–046 has an explicit matched/intentional-difference/waived status supported by playable evidence. |
| CK-041 | P1 | Full original graphics overhaul | PARTIAL — battlefield rendering | The authenticated battlefield now draws observed terrain/resources, water/shore tiles, explored fog, ships/units/buildings, health, selected paths and visible projectiles. Full original sprite/animation production, isometric integration, visual captures and measured Xbox budgets remain open. |
| CK-042 | P1 | Full original sound-effect overhaul | OPEN | Event coverage for construction, economy, combat, siege, naval, alerts and UI; audio ducking, voice caps, controller-friendly accessibility, user-gesture audio resume, performance and mix acceptance. |
| CK-043 | P1 | Original adaptive soundtrack | OPEN | Produce original menu/economy/tension/combat/victory/defeat music; loops, seamless transition, independent volume/mute/persistence, licensing and Xbox Edge tests. |
| CK-044 | P2 | All current Xbox gameplay DLC catalogue | OPEN | Enumerate and validate Lords of the West, Dawn of the Dukes, Dynasties of India, Return of Rome, The Mountain Royals, Victors and Vanquished, Chronicles: Battle for Greece, The Three Kingdoms, Chronicles: Alexander the Great, The Last Chieftains and The Viking Sagas against actual Xbox entitlements and feature matrices. No official copyrighted campaigns/assets may be copied. |
| CK-045 | P1 | Xbox Series X controller default mapping fidelity | PARTIAL | Several documented default inputs are implemented/corrected; no full Xbox parity claim. R3 priorities, multiplayer groups/minimap/Y shortcuts, exact wheels and physical Edge/controller acceptance remain open. |
| CK-046 | P2 | Xbox DE feature-family gap closure | PARTIAL | Recent core work closes palisade, Line/Split and authenticated economic/combat gaps. Complete feature-family inventory still needs special abilities, remaining multiplayer types, replay/spectator/editor/co-op dispositions and DLC mechanics. |

## References and historical evidence

- [Full Xbox content, multiplayer and media scope](XBOX_SERIES_X_FULL_PARITY_AND_MULTIPLAYER_PLAN.md)
- [Current controller contract](XBOX_CONTROLLER_PARITY.md)
- [Historical engineering log](AOE2_PARITY_ROADMAP.md)
- [Historical register and prior evidence](https://github.com/johnstacey16-ui/crown-and-kingdoms/blob/e9c1b6c737821176469773773b1b649c7467b22b/MASTER_AUDIT_AND_DELIVERY_REGISTER.md)

The expanded register was recovered from repository history after its contents had been replaced by relay documentation. Historical CI figures remain historical evidence; the current code baseline is the one explicitly linked above. No completion percentage is inferred from file or test counts.
