<!-- Support and ranged artwork increment: 22 October 2026 -->
CK-032/041: added monk walking/conversion gestures, longbowman walking/firing
and throwing-axeman walking/throwing sequences, each with a matching ready pose.
Animation coverage is 11/47 playable kinds. Monk casting reads existing
conversion progress and shares paused game-time playback across renderers.
Gameplay and controller rules are unchanged. Original art remains preserved.
See docs/PAINTED_SUPPORT.md; full directions, remaining units and hardware
performance acceptance remain open.

<!-- Castle production increment: 22 October 2026 -->
CK-014/025/027: restored access to existing civilisation-specific castle units
and technologies. Shared catalogue checks now govern solo production,
authenticated multiplayer menus/commands and saved queues. Foreign entries
remain blocked; controller bindings, costs and population guards are unchanged.
All 26 implemented civilisations are exercised by production-script tests.
See docs/CASTLE_PRODUCTION.md. Reference balance/content acceptance remains open.

<!-- Raider animation increment: 22 October 2026 -->
CK-032: scouts now have horse-trot and mounted sword-attack frames; skirmishers
have walking and javelin-throw frames. Both have matching ready poses. Current
coverage is 8/47 playable kinds, with mirrored facing. Other troops, full
directions, specialised work/death sheets and physical Xbox acceptance remain
open. Gameplay, controller bindings and original assets are unchanged.
See docs/PAINTED_RAIDERS.md.

<!-- Ranged animation increment: 21 October 2026 -->
CK-032: added walking, firing and thrust frames for archers, crossbowmen and
spearmen. All six motion types now have matching ready poses. Coverage is 6/47
playable kinds; full directions, other troops and specialised work/death art
remain open. A shared extraction helper removes neighbouring fragments, with
selective cleanup of three fallback cells and the original sheet preserved.
Long weapons retain visibility at close-zoom viewport edges. Game rules and
Xbox bindings are unchanged. See docs/PAINTED_RANGED.md.

<!-- Core animation increment: 21 October 2026 -->
CK-032: added 48 original painted movement/attack poses for infantry, knights
and villagers, plus villager work playback. Shared game-time/cooldown pose
calculation now freezes on pause and retains facing without mutating simulation
entities. Fallen units keep painted artwork. Coverage is 3/47 playable kinds,
with mirrored facing; remaining roster, specialised tools, directional/death
sheets and physical Xbox performance are open. See docs/PAINTED_MOTION.md.
The previous broad CI run also exposed stale SVG-atlas and automatic-focus-zoom
assertions; these now test painted pack integration and explicit right-stick
zoom with focus preserving that zoom. Controller bindings are unchanged.

<!-- Graphics increment: 21 October 2026 -->
Painted raster artwork now replaces the rejected pixel SVG icon system in solo
and multiplayer. Textured terrain, original medieval sprites and cached team
heraldry are implemented. Full directional limb animation and physical Xbox
performance acceptance remain pending. Controller and simulation behavior are
unchanged. See GRAPHICS_ACCEPTANCE.md and docs/PAINTED_ART.md.

# Current hosting constraint — free only

The owner chose free-only hosting on 21 October 2026. This supersedes prior
Railway deployment instructions. [FREE_HOSTING.md](FREE_HOSTING.md) records the
current shutdown status, account-access gates and secure migration requirements.
The Railway service still exists: zero replicas was disallowed and automatic
approval review rejected permanent deletion without explicit deletion approval.
Sleep/no-restart/restricted-build settings were saved/read back; current compute
shutdown is not confirmed. Supabase is reachable but anonymous sign-ins are off;
its plugin/account connection and project-plan/schema inspection are pending.
No paid upgrade or completed Supabase multiplayer migration is claimed.

# Crown & Kingdoms — authoritative audit and delivery register

Updated 21 October 2026. Work continues directly on `main`.

This register tracks the 46 agreed delivery tasks. PARTIAL means implementation exists but the stated acceptance is still open. Automated checks establish only the covered scenarios. Staged Chromium rendering does not establish independent human matches, physical Xbox or deployed-service acceptance. Original code, artwork, music and campaigns remain required.

## Current verified code

- Code commit: [`78f266a`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/78f266a2722b0d5c46e8cb62a2f16196c4d64e9b).
- [Source and atlas validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39699486866): passed on GitHub Ubuntu / Node 22; 13 atlases, 1,308 animation entries and 1,980 frame references.
- [Regression suite](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39699486869): all 164 standalone test files, all 19 isolated campaign simulations and all three seeded production-AI skirmishes passed.
- [Chromium graphics suite](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39699486800): all 13 painted atlases load; 96 motion action/team lookups and 22 decoded raster action/team sequences with eight distinct frames each pass. Rendering, team colours, fog, checksum isolation, viewport-edge weapons, cache upgrades, failed-image fallback and responsive layouts pass.
- Targeted local checks: 182 passed, covering monk gesture state/paused time, shared multiplayer projection, controller contracts, authenticated live play, castle production and asset loading. Native Canvas2D inspection checked 48 new action samples and an actual battle with monk conversion; drawing preserved the world checkpoint. Both packers reproduce all committed image/manifest hashes unchanged.
- Motion coverage is now 11/47 playable kinds: infantry, knights, villagers, archers, crossbowmen, spearmen, scouts, skirmishers, monks, throwing axemen and longbowmen. All 47 retain base painted art. Full roster/directional/death animation, reference balance/content fidelity, independent-network human matches and physical Xbox acceptance remain open. See [artwork coverage and provenance](docs/PAINTED_SUPPORT.md).
- The preceding civilisation-specific castle production repair remains covered by the full suite. See [castle production evidence](docs/CASTLE_PRODUCTION.md).

These are automated and staged-rendering results. Independent-network human
full matches and physical Xbox acceptance remain separate requirements. The
milestone descriptions below include earlier stages; the painted graphics and
motion sections above supersede their older SVG-art descriptions.

## Current multiplayer and visual milestone

The authenticated battlefield now admits owned move/stop, gather, build, train, cancel, research, rally, attack/attack-move, stance, garrison, repair, building unload and transport disembark commands. Resource targets have persistent IDs; the host rechecks current sight, resource identity, ownership, routes, costs, prerequisites and building sites before mutation. Rejected orders do not enter the replay journal.

The UI projects team-relative current sight rather than the solo team-zero fog array. It draws terrain, resources, explored fog, health, original animated unit/ship/building art, selected paths and visible projectiles. A on visible resources/opponents submits gathering/attack; RT opens contextual production or construction; RT+Y changes economic/military build pages; LT repeats placement or requests five trained units. Exact wheel sectors, all special actions and physical Xbox parity remain unverified.

The graphics stage integrates original animated atlases, copied poses, kingdom palettes and stable screen-depth ordering. Foundations show scaffolding/progress; damaged buildings show smoke. Missing/failed frames retain procedural fallback. Browser validation exposed and prompted repair of 48 malformed building-atlas tags, restoring that atlas in solo as well. The effective catalogue now resolves all 50 unit keys (including the castle combat proxy) and 21/22 building definitions; farms use resource/crop tiles. New original art covers trade carts/cogs, twelve unique troops and palisades. The generator is reproducible and frame cells are clipped. Manifest revalidation and shell-cache migration prevent returning players retaining obsolete artwork. Full directional quality, isometric integration and Xbox budgets remain open.

The shelter/naval milestone adds explicit RT target modes, cargo badges and authenticated garrison/boarding, unload, repair/finish-foundation and visible-shore landing. The host rejects invalid ownership, hidden targets, incompatible selections, bad manifests, insufficient capacity and unreachable routes before mutation. Normal simulation boards, restores health and places distinct passengers on free land tiles. Long-distance garrison approach now uses a route within actual entrance range; trade ships honor repair before trading. Allied garrison sharing, full formation/control-group menus, trade assignment, diplomacy and reconnect remain unfinished. Exact wheel layouts and physical Xbox parity remain unverified.

A natural result stops simulation only after the final frame is replayed and acknowledged. Victory/defeat is relative to each human team; it is not reported as a generic network failure.

The repository now includes a combined game-and-relay host (`server/app.mjs`), an unprivileged Node 22 container and a Railway service configured through the platform API with healthchecks and one replica. The new actual HTTP hosting regression passes alongside the existing suite. It verifies public game/assets, rejected private paths, readiness, uncached API responses, two-human room membership and authenticated message identity.

Public hosting is now **DEPLOYED** at [Crown & Kingdoms](https://crown-and-kingdoms-production.up.railway.app). Railway deployment `18a93b9c-8b96-4714-aab3-e9f1443a33c8` reached SUCCESS on 21 October 2026 at `d3952c28e994c2dc11e877d7d84b8eb4c61a62fa`. The GitHub App access blocker was resolved and the existing service follows main. HTTPS game/health endpoints returned 200. Two anonymous sessions created and joined a private room with teams 0/1; test sessions were then revoked. This is hosting and room-membership evidence, not a full human-match acceptance claim.

Project ID: `c9182bd4-8f96-4f39-82f4-7e86756b5729`; environment ID: `cefb9e69-2d18-4760-bb2d-c461d940903e`; service ID: `5d37d197-7064-4a88-9ce7-39f8851f07d1`. The platform-configured Dockerfile host uses one in-memory relay process. The obsolete railway.json remains removed.

The reliability increment replaces the hard 30-minute session lifetime with a per-player idle lease renewed only by successful authenticated requests. An active player cannot keep an idle peer alive. Safe GETs and transport receipts retry HTTP 502/503/504 at most twice inside one request deadline; gameplay submissions never retry automatically. Targeted HTTP/live-session checks pass locally (42 checks). Full reconnect/resume and durable snapshots remain open.

Static Vercel hosting does not supply the Node relay process. There is no reconnect/resume or server persistence yet. See [server/README.md](server/README.md) for the actual transport contract and deployment gates.

## Delivery order

1. Finish and deploy the synchronized 1v1 service: reconnect/snapshots, remaining command families, independent-browser full matches, disconnect recovery and measured network cadence.
2. Complete the original graphics overhaul: asset inventory, faction/directional animations, main-world presentation, visual captures and Xbox frame budgets. The new battlefield is a substantial rendering stage, not the finished art overhaul.
3. Close core missing gameplay/controller features: R3 priorities and ratios, multiplayer groups/minimap/formations, remaining naval/trade/diplomacy commands, special abilities and content restrictions.
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
| CK-007 | P0 | Real two-human shared multiplayer | PARTIAL — integrated battlefield | Authenticated two-client HTTP tests exercise gather/deposit, paid construction, military training, research, combat, garrison/unload, repair, transport landings and final acknowledged victory. The public relay is deployed and HTTPS room membership is smoke-tested; independent browser/controller full matches and remaining commands are open. |
| CK-008 | P0 | Multiplayer desync detection and failure handling | PARTIAL | Live stop-and-wait frame replay, ownership/sequence guards, duplicate handling, hash checks, timeout/failure and final-frame ACK are tested. Reconnect/resume and recovery snapshots remain missing. |
| CK-009 | P0 | Controller-only core game flow | PARTIAL | Solo and authenticated battlefield provide many core controller functions; full controller-only flow and Xbox hardware acceptance remain open. |
| CK-010 | P1 | Correct RT contextual wheel and site commands | PARTIAL | Authenticated RT building pages, RT+Y switching, paid training/research, build previews and shelter/naval target actions now exist. Exact reference sectors/positions and full site-command coverage require comparison. |
| CK-011 | P1 | LB/RB, D-pad and control group parity | PARTIAL | Solo groups/quick-selection/minimap have corrected bindings and saved groups. Multiplayer LB assignment/recall/counts and Y camera focus now exist; RB provides expanded map/Y focus. Minimap flares, filters/modes, waypoints and exact wheel/hardware parity remain open; see XBOX_CONTROLLER_PARITY.md. |
| CK-012 | P1 | Villager priority presets and auto economy | PARTIAL | Legacy worker targets exist. The documented R3 priorities wheel, seven presets, manual ratios and automatic-farm toggle remain missing. |
| CK-013 | P1 | Economy completeness and balance | PARTIAL | Gather/dropoff, farms, market/trade, fishing, relics implemented; verify gathering/carry/technology maths, depletion, farm wood costs, housing and economy pacing against reference. |
| CK-014 | P1 | Technology catalogue and effect integration | PARTIAL | config.js TE, engine.js civilisation unique techs, unit stat/render/AI use; enumerate every base reference tech and test prerequisites, cost, correct runtime effect and UI availability. |
| CK-015 | P1 | Damage/armour/counters | PARTIAL | Config and engine contain class data and bonuses; verify attacks against infantry/cavalry/siege/ships/structures, minimum range, ballistics, projectiles and friendly fire case by case. |
| CK-016 | P1 | Movement, collisions and pathfinding | PARTIAL | pathfinding.js, input.js, simulation.js; run land/water/ford/gate/obstacle and large group tests, verify fallback and no stranded/oscillating units. Do not infer bugs from unaudited audit claims. |
| CK-017 | P1 | Formations, stances and combat orders | PARTIAL | Solo Y immediately switches Line/Split through normal movement planning. Six menu shapes, stances and combat orders exist; authenticated multiplayer Y now submits Line/Split reformation through shared-frame replay. Full formation menus, persistent group movement and exact reference behavior remain open. |
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
| CK-031 | P0 | Shared 2–4 human multiplayer integration | PARTIAL — two humans | Two authenticated human slots share a simulation and terminal result. Garrison/unload, trade, tribute/diplomacy, priorities/full formation menus, reconnect and 3–4 humans remain open. Browser play has no native Xbox matchmaking integration. |
| CK-032 | P1 | Original sprite/animation asset quality | PARTIAL — atlas integration | Original unit/ship/building atlases now render in multiplayer with copied poses and depth ordering. 50/50 unit keys and 21/22 building definitions have atlas entries; farms use crop tiles. New trade/unique-force/palisade assets, Chromium evidence and remaining quality gates are in GRAPHICS_ACCEPTANCE.md. |
| CK-033 | P1 | Music, ambience and feedback | PARTIAL | audio.js procedural sound; audit actual audible events, prompt initiation/resume and production-ready original sound suite. |
| CK-034 | P3 | AI and civilisation balance | UNVERIFIED | Repeatable test batteries and human matches; record win rates and concrete deviations, avoid arbitrary 1:1 numerical approximations unsupported by reference evidence. |
| CK-035 | P3 | Canvas/game-loop rendering and input profiling | UNVERIFIED | Measure simulation/draw frame time, memory/GC, p95 input delay, sprite and A* counts on real Xbox Series S first. |
| CK-036 | P4 | Xbox Series S and X release acceptance | MISSING EVIDENCE | Test declared population/map/player limits with controller and Edge; record hardware/browser build, peak memory, frame time and full-match stability. |
| CK-037 | P4 | Eight humans × 500 pop stretch target | NOT IMPLEMENTED | Separate feasibility gates: 2×200 → 4×200 → 8×200 → 8×500 with shared pathfinding, network budgets, simulation checksums and measured physical Xbox performance. |
| CK-038 | P1 | Full Xbox DLC entitlement/content scope | OPEN / REQUIRED | New owner request expands the target to all gameplay DLC available on Xbox as of 19 October 2026, including distinct Chronicles/Return of Rome variants. Catalogue editions, bonuses, units, research, scenarios and modes; verify original implementation per category. Native Xbox achievements/cloud saves/matchmaking still require separate platform architecture. |
| CK-039 | P4 | Final functional readiness sign-off | OPEN | All accepted required scenarios pass: deterministic tests + real browser 1v1/naval matches + saves + campaigns + real shared multiplayer + console controller hardware. |
| CK-040 | P4 | Final reference-fidelity sign-off | OPEN | Every required Xbox base + gameplay-DLC feature in CK-024–030, CK-038 and CK-044–046 has an explicit matched/intentional-difference/waived status supported by playable evidence. |
| CK-041 | P1 | Full original graphics overhaul | PARTIAL — animated battlefield | Original atlas animation, kingdom colours, depth ordering, construction/damage indicators and procedural fallback now render in multiplayer. Chromium captures/checksum/fog/failed-image checks pass. Full asset production, isometric camera/terrain, human match acceptance and Xbox budgets remain open. |
| CK-042 | P1 | Full original sound-effect overhaul | OPEN | Event coverage for construction, economy, combat, siege, naval, alerts and UI; audio ducking, voice caps, controller-friendly accessibility, user-gesture audio resume, performance and mix acceptance. |
| CK-043 | P1 | Original adaptive soundtrack | OPEN | Produce original menu/economy/tension/combat/victory/defeat music; loops, seamless transition, independent volume/mute/persistence, licensing and Xbox Edge tests. |
| CK-044 | P2 | All current Xbox gameplay DLC catalogue | OPEN | Enumerate and validate Lords of the West, Dawn of the Dukes, Dynasties of India, Return of Rome, The Mountain Royals, Victors and Vanquished, Chronicles: Battle for Greece, The Three Kingdoms, Chronicles: Alexander the Great, The Last Chieftains and The Viking Sagas against actual Xbox entitlements and feature matrices. No official copyrighted campaigns/assets may be copied. |
| CK-045 | P1 | Xbox Series X controller default mapping fidelity | PARTIAL | Several documented default inputs are implemented/corrected; no full Xbox parity claim. R3 priorities, remaining minimap tools/Y shortcuts, exact wheels and physical Edge/controller acceptance remain open. |
| CK-046 | P2 | Xbox DE feature-family gap closure | PARTIAL | Recent core work closes palisade, Line/Split and authenticated economic/combat gaps. Complete feature-family inventory still needs special abilities, remaining multiplayer types, replay/spectator/editor/co-op dispositions and DLC mechanics. |

## References and historical evidence

- [Full Xbox content, multiplayer and media scope](XBOX_SERIES_X_FULL_PARITY_AND_MULTIPLAYER_PLAN.md)
- [Current controller contract](XBOX_CONTROLLER_PARITY.md)
- [Historical engineering log](AOE2_PARITY_ROADMAP.md)
- [Historical register and prior evidence](https://github.com/johnstacey16-ui/crown-and-kingdoms/blob/e9c1b6c737821176469773773b1b649c7467b22b/MASTER_AUDIT_AND_DELIVERY_REGISTER.md)

The expanded register was recovered from repository history after its contents had been replaced by relay documentation. Historical CI figures remain historical evidence; the current code baseline is the one explicitly linked above. No completion percentage is inferred from file or test counts.

## Multiplayer Line/Split increment — 21 October 2026

Military Y now requests authenticated Line/Split reformation for groups of at least two owned military units. The host precomputes all routes before mutation, keeps land/naval centres separate, rejects invalid membership and unreachable groups, and replays accepted orders through the existing journal. Unit formation choice participates in checkpoints and current saves. Selection and solo formation preference remain local and unchanged. Pending actions, cancellation, menus and focus/controller gesture resets consume held shortcut input. Handshake `ck-live-preview-9` rejects older clients.

Targeted local checks cover both teams over real HTTP with per-frame production hash agreement, safe rejection, separate movement classes, save restoration and Y cancellation. These checks are not physical Xbox acceptance. Full formation wheels, persistent formation-aware group movement, remaining contextual Y shortcuts and reconnect remain open. The controller guide linked in XBOX_CONTROLLER_PARITY.md confirms military Y's Line/Split role; exact geometry and gestures remain provisional.

## Multiplayer control-group increment — 21 October 2026

The eight-slot LB wheel now assigns and recalls owned local selections with live availability counts. X copies eligible IDs; release after assignment does not recall another slot; ordinary release recalls the highlighted group. B cancels, and empty assignment clears a slot. Ownership changes, deaths and garrisoning remove availability without rewriting the stored group, so unloading restores surviving members. UI session/team changes isolate groups. Assignment/recall do not mutate simulation, solo groups or checkpoints; subsequent gameplay uses existing authenticated command validation.

Local unit tests cover all slots, snapshot isolation, pending-command local selection, invalid/unavailable membership, cancellation and completed town-group training requests. The real HTTP test recalls independent groups for both humans before synchronized Line/Split orders with per-frame production hash agreement. The Chromium suite captures the original group wheel and checks recall/checksum isolation. LB+Y camera focus, full camera/minimap integration, exact wheel parity, persistent multiplayer groups and physical Xbox acceptance remain open.

## Battlefield camera and map-focus increment — 21 October 2026

LB+Y now focuses an available group's first member in a clamped 2× local viewport. RB opens a full-map modal view with the existing team-relative observation data and current viewport outline; Y focuses its cursor. The normal cursor pans near view edges. Terrain, sprites, paths, construction previews and cursor use the same world transform; menus/instructions remain screen-sized. Pointer commands invert that transform, and focused double selection excludes offscreen entities. Closing/cancelling the minimap restores the prior camera/cursor and never issues an order. Camera changes remain outside simulation/checksums.

65 targeted local tests pass, including real HTTP group focus followed by shared formation execution with matching checkpoints. The Chromium suite captures focused battlefield and expanded-map views and checks fog/checksum isolation. Remaining map tools (flares, detail/economic/military filters, waypoint clearing), exact camera/zoom/edge settings, isometric presentation and physical Xbox acceptance are open. Earlier increment notes that called group focus unavailable are superseded by this section.

## Camera validation and deployment gate — 21 October 2026

Code `d7a169d999db4c18bc752aa43cec9ff81e080e24` passed [validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39532755525), [Chromium graphics/camera](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39532755526) and [full regressions](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39532755628), including all campaigns and AI skirmishes. Artifact `12316465728` contains the focused-world and expanded-minimap captures; both were downloaded and visually inspected. Focused rendering preserves hidden-enemy exclusion and the production checksum.

**Deployment note — 21 October 2026:** camera/group-focus/expanded-minimap code `d7a169d999db4c18bc752aa43cec9ff81e080e24` passed all CI, but is **not live yet**. Railway source-connect retries returned `Deploys have been paused temporarily`. The latest successful live release remains control-group code `f1240f8641cd66f677e848313017a9cfbf0c2aab` (deployment `e45c0f31-b149-4165-86ef-bb93abb5828b`). Reconnect the existing service to main when the platform accepts deployments again; no new project or service is needed.

The public status page reported Fully Operational during this check, so no cause or broad outage is inferred from the service API rejection. The exact Railway control-plane response above is the deployment blocker. No successful deployment of the camera code is claimed.


## Objectives and reachable Free multiplayer preview — 21 October 2026

Owner reaffirmed full Xbox Series X AoE II: DE functional/controller and
Xbox-available DLC coverage, optimized for Xbox Edge with Supabase multiplayer.
This target is now also explicit in AGENTS.md; the current subset is not complete.

Game commit `97ef6efc1e6227b47193edd6ce0689f0ba17fb7d` adds Objectives to the running
multiplayer menu. It reads verified shared settings for all seven currently
implemented victory modes, shows game time or score-limit time remaining, returns
to the parent menu on B/Escape, and resumes on Menu. It reveals no opponent state
and submits no orders. The game continues while either player reads Objectives.
Local startup/live/session/HTTP/Auth/peer checks passed 68 tests. Real production
browser run [39556611925](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39556611925)
also verified Objectives during peer gameplay. The official Xbox guide's Pause
Menu section confirms Objectives belongs there and multiplayer does not pause:
https://www.ageofempires.com/learn-to-play/controlling-your-empire-gathering-resources-xbox/ .
Exact Xbox menu presentation and physical input are still unverified.

Game commit `7ed3de058a1d950060bd86e819a2aecba3c53076` connects the existing
controller-accessible battlefield-preview entry to the authenticated Supabase peer
provider, loads it in the production shell and caches it in SW v11 without
connecting on load. [Production controller-path browser acceptance 39578735274](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39578735274)
passed 120 matching frames, both paid training orders, Objectives while running,
final ACK and Leave. It checks all 15 deployed source assets first. The static
validator was updated in `ed5ce19864f61dbe20345c361f88939c23053c1c` to require the
new dependency order. [Responsive browser run 39578735675](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39578735675)
verified the real menu entry at desktop/390/320 widths and selected the peer
factory without signing up. See FREE_HOSTING.md for measured traffic and limits.

Still open: independent-router/mobile connectivity, physical Xbox Edge complete
match and controller acceptance, sustained performance, anonymous-user retention,
reconnect, more humans, full menu/feature/content/DLC/graphics/audio coverage and
Railway shutdown. There is no full-game, full-DLC or universal-connectivity claim.


## Authenticated military Patrol and Attack Move — 21 October 2026

The multiplayer military RT menu now exposes Patrol and Attack Move. Both enter
local ground targeting and submit only when A chooses a destination; B, menus,
selection changes and suspension cancel targeting. No input changes simulation
before host execution. The host validates current ownership, living ungarrisoned
military membership, strict map coordinates and every outbound route before
replacing any selected unit's orders. Soldiers and warships use production
pathfinding. Patrol returns to its starting point and repeats; Attack Move ends
at the destination. Both retain the production combat interruption/resumption
policy and clear conflicting retreat/unload work. Unexplored ground is allowed;
entity-targeted attacks still require current sight. Handshake ck-live-preview-10
excludes older live clients; shell cache v12 updates the command modules.

Focused local tests cover both teams and movement classes, arrival behavior,
invalid inputs, atomic route rejection, RT confirmation/cancellation and pending
orders. A real authenticated HTTP pair exercises both RT actions with production
movement and matching checkpoints on every checked frame. Browser graphics CI
now captures the military menu and checks typed ground targeting without local
world mutation. Full regression/browser results are recorded in the change PR.

The official Xbox Controls guide documents Patrol and Attack Move under the RT
military command menu. Exact sectors, target gestures, formation spacing, combat
behavior fidelity and physical Xbox Edge acceptance remain unverified. Trade,
tribute/diplomacy, priorities, reconnect and additional humans remain open.

## User-reported feature gaps and first corrections — 21 October 2026

The owner identified projectile homing, missing monk/religious research, missing
ranged/naval/economic technologies, incorrect age prerequisites, incomplete
civilisation/naval catalogues and unfinished original audio/graphics. These are
accepted implementation work, not waived parity requirements.

| Feature family | Current disposition |
| --- | --- |
| Ballistics and dodgeable missiles | Implemented foundation: fixed launch-time aim for ranged shots; University Ballistics predicts constant path-segment movement for explicit arrow families and Scorpions. Later course changes can miss. No random accuracy spread, pass-through/secondary collisions, elevation or reference projectile-speed parity is claimed. Existing siege splash centres on the fixed impact point. |
| Fletching / Bodkin Arrow / Bracer | Implemented attack/range/sight chain for explicit arrow weapon families. Blacksmith costs, age/prerequisite checks, paid research, AI priorities, combat range/pathing and unit HUD are connected. Town Centres gain attack/sight without attack-range growth. Legacy atkR/atkR2 keys are retained for saved flags. Full per-civilisation availability/bonus auditing remains open. |
| Age advancement | Corrected to distinct eligible buildings: Founding uses lumber/mill/mine/Barracks/Dock; Feudal uses Range/Stable/Blacksmith/Market; Castle uses Siege Workshop/University/Monastery, or one completed Castle. Dead, unfinished and foreign structures do not count. Barracks/Dock and Militia/Fishing Ship become available in the starting age. Human research, solo menu, multiplayer menu and AI use the shared eligibility helper. A dock is never mandatory. AI caps starting-age Militia at three rather than spending its advancement food indefinitely. |
| Monk suite | OPEN: Faith, Heresy, Redemption, Atonement and remaining reference monastery technologies need individual mechanics, paid research, AI/UI/save/multiplayer and civilisation availability acceptance. Existing basic conversion/healing/relic behavior is not the full suite. |
| Murder Holes | OPEN: requires explicit defensive minimum-range behavior and research removal, including valid-target selection around fortifications. |
| Naval/economic technologies | OPEN: Careening, Dry Dock, Shipwright, Gillnets and the current naval technology families. The February 2026 official Xbox update moves the first three to the University, changes Dry Dock to pierce armour, and changes Gillnets to gathering/carrying with Fishing Lines as its precursor. Do not implement obsolete pre-update placements/effects as current Xbox parity. |
| Naval roster | OPEN: Fire/Demolition/Cannon Galleon and other required naval lines, their upgrades, abilities, counters, art/audio and AI. The 2026 naval update also adds new ship families and shared Medium/Heavy Warships upgrades; the existing Galley-only combat roster is not complete. |
| Civilisations | PARTIAL: existing 26 entries do not establish current Xbox base/DLC roster coverage. Complete functional per-civilisation restrictions, bonuses, units, technology trees and separate antiquity/Chronicles rules remain required. |
| Audio and graphics | PARTIAL: synthesised Web Audio and Canvas2D with original SVG atlases remain the current pipeline. Full original sound/music production, coherent terrain/camera/animation coverage and measured Xbox readability/performance acceptance remain open. |

Projectile impact coordinates are included in multiplayer checkpoints and current
saves. Missing legacy aim fields migrate once to a fixed aim; corrupt aims reject
before replacing a world. New launches snapshot the shooter's kind/team. Live and
WebRTC handshake ck-live-preview-11 reject incompatible simulation clients; shell
cache v13 refreshes changed scripts. No infrastructure/billing changes are made.

Named local evidence: tests/reference-age-projectiles.test.mjs exercises every
eligible two-building combination for both teams, the Castle exception and invalid
prerequisites; paid attack/range upgrades and excluded weapon classes; leading,
dodging, siege impact splash, save restoration/legacy migration and checkpoint aim
sensitivity. tests/network-battlefield-live.test.mjs adds real authenticated HTTP
research and moving-target fire with per-frame matching production hashes.
Full main CI and physical Xbox acceptance remain separate release evidence.

Official references checked 21 October 2026:
- https://www.ageofempires.com/learn-to-play/advancing-to-the-next-age-xbox/
- https://www.ageofempires.com/news/a-new-naval-warfare-in-age-of-empires-ii-definitive-edition/
- https://www.ageofempires.com/news/aoeii_de_update_56005/
- https://www.ageofempires.com/news/age-of-empires-ii-definitive-edition-update-preview-125283/

## Main validation for projectile/technology/age corrections

Code `e133a3dbaba8464ab2517d7f7b7a4a6f6f6de203` passed all main checks on 21 October 2026:
- [Regression 39583393316](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39583393316): 160 standalone files, all 19 isolated campaign missions and all three seeded production-AI skirmishes, including save/reload scenarios.
- [Source/atlas validation 39583393370](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39583393370).
- [Chromium graphics/menu/responsive checks 39583393348](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39583393348). Artifact 12338262137 was downloaded; ballistics-research-menu.png was visually inspected and shows the unlocked University entry, cost and RT+A prompt.
- [WebRTC browser transport 39583393367](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39583393367), including the new versioned channel.

These are named Node/Chromium checks, not physical Xbox or independent-network full-match acceptance. The remaining feature-family gaps listed above remain open. All changes were committed directly to main as requested.


## Monastery research, authenticated conversion and Murder Holes — 21 October 2026

Implemented eleven Monastery technologies: Devotion, Faith, Heresy, Redemption,
Atonement, Sanctity, Fervor, Block Printing, Illumination, Theocracy and Herbal
Medicine. Research uses the existing paid building queue, duplicate/age/budget
checks and selected-building RT controls in solo and authenticated multiplayer.
Faith requires Devotion. Sanctity upgrades living and future Monks without
removing prior damage; Fervor changes speed; Block Printing changes conversion
range and sight. Faith percentage/conversion range are shown for solo Monks and
faith is exposed in the owned multiplayer selection description.

Conversion now has target-class/research restrictions, seeded interval attempts,
per-target identity/owner binding, current hostility/ownership checks and a
normalised faith resource. Base unit attempts use seconds 5–9 with 40% interval
rolls and a forced maximum; Devotion/Faith add resistance time, with separate
Scout/ship windows. Illumination doubles faith regeneration. Heresy kills a
converted unit instead of transferring it. Theocracy preserves the other Monks'
faith when the same-target group succeeds. Without it, those casters recharge.
Redemption supports siege and adjacent eligible buildings; Atonement permits
Monks. Successful building capture cancels its old training/research/rally
without refunding its previous owner's budget. Stable entity IDs remain.

Authenticated contextual A and RT Convert send strict typed commands, with
current-team sight, owned eligible Monks and all-member route validation before
orders change. No optimistic conversion occurs. The host rechecks ownership for
subsequent commands. Existing fail-stop handling of unauthorised network packets
is preserved; this increment does not redesign rejection/reconnect receipts.
The bounded technology-ID validator now permits the catalogue's existing camel
case keys (e.g. murderHoles/atkR), while retaining exact fields and semantic
simulation validation. Conversion progress, interval, bound target/owner and
faith participate in checkpoints and validated saves. Protocol/channel 12 and
shell cache v14 exclude older simulation clients.

Murder Holes is University research. Towers/Castles skip targets less than one
tile from their footprint until researched, and continue looking for a farther
eligible enemy rather than being blocked by the nearer target. Town Centres
retain zero minimum range. Herbal Medicine adds the researched 6× garrison-heal
rate for current, living, correctly owned building passengers; transports do not
receive building healing. Monks no longer heal themselves.

**Acceptance limits:** this is feature coverage, not full version-locked Xbox
parity. Occupied buildings and loaded transports are deliberately unavailable
conversion targets pending verified passenger capture/ejection semantics. Exact
conversion-resistance chance modifiers, target-switch timing, group membership,
converted-unit stat inheritance, civilisation-specific restrictions/free techs,
full unit/DLC exception catalogues, visuals/audio feedback and physical Xbox
controller/performance acceptance remain open. No new bindings or infrastructure
were introduced. Remaining naval/civilisation/media work is still required.

Reference evidence:
- Official conversion/Devotion/Faith balance: https://www.ageofempires.com/news/age-of-empires-ii-definitive-edition-update-99311/
- Official group faith/Theocracy correction: https://www.ageofempires.com/news/age-of-empires-ii-definitive-edition-update-107882/
- Current extracted tech costs/times and descriptions: https://github.com/SiegeEngineers/aoe2techtree/blob/master/data/data.json and data/locales/en/strings.json, read 21 October 2026; data blob c4f7da961e82a8231b1ba49459949c4d6e479bc8, English descriptions blob c3db0331c195b389615f3353c76561f57556ec02. These are reference-data snapshots, not a recorded physical Xbox build. They include newer Devotion/Sanctity/Block Printing costs than older manuals.

Local tests: monk-technologies.test.mjs covers all twelve paid techs, real stat,
faith, resistance, Heresy/Theocracy, target-class/cargo/ownership/path validation,
Murder Holes target selection, garrison healing, save/checksum fields, RT and
contextual A. The authenticated HTTP pair researches Atonement and converts a
human-owned Monk with matching production hashes on every frame, then checks
that the former owner's production command is refused. All 19 isolated campaign
missions passed locally. Main CI results are recorded separately below.

## Main CI acceptance for Monastery/Murder Holes increment

Code `2ea9efa796f4ca306988a493c277348ddc93cda6` passed all named main checks on 21 October 2026:
- [Regression 39588987534](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39588987534): all 161 standalone files, all 19 isolated campaign missions and all three seeded production-AI skirmishes.
- [Source/atlas 39588987673](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39588987673).
- [WebRTC Chromium transport 39588987539](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39588987539).
- [Chromium graphics/controllers/responsive room 39588987417](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39588987417). Artifact 12339554329 was downloaded; monastery-research-menu.png and monk-convert-menu.png were visually inspected. Browser assertions verify Atonement's unlocked research entry/cost, RT Convert, the typed hostile target and unchanged simulation checksum before host execution.

All code and this evidence record were committed directly to main. These checks
are Node/Chromium acceptance; physical Xbox, full civilisation-specific parity
and the occupied-container conversion limitations above remain outstanding.


## Camera control correction — 21 October 2026

The owner reaffirmed matching AoE II: DE Xbox controls as the target. The official
[default-layout cards, updated 8 May 2026](https://support.ageofempires.com/hc/en-us/articles/37041870568468-Age-of-Empires-II-Definitive-Edition-Default-Controller-Layouts)
confirm LS camera pan and RS zoom in general gameplay. Implemented direct analog
zoom in solo/campaign and multiplayer, removed RS panning, preserved world-anchored
A boxes, and prevented LT/menu contexts from leaking camera zoom. Multiplayer
focus preserves the user's zoom; camera input never enters the command transport.
The optional solo slider is supplemental, rather than the normal zoom mechanism.

Status: PARTIAL parity. Current minimum, sensitivity, axis-direction convention,
reticle behavior and initial framing need Xbox build/hardware comparison. R3
priorities, View notification snapping, contextual X, LT Find/category/waypoint
controls and other previously recorded gaps still need implementation/acceptance.
Do not treat this camera increment as full game, full controller or DLC parity.

Camera validation at code commit `ad82b533fa740a8182fb000e9ffe75aa784a8c62`:
125 targeted Node checks and game validation passed. The hosted
[Chromium graphics and room-layout run 39657103778](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39657103778)
passed, including direct analog zoom, zoom preservation through group focus,
fog and unchanged game checkpoints. Physical Xbox acceptance remains open.
