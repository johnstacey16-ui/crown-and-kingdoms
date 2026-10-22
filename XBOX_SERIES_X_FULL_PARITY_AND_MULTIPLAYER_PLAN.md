<!-- Warrior artwork increment: 22 October 2026 -->
CK-032/041: added Huskarl, Jaguar Warrior, Kamayuk and Shotel Warrior walking,
melee attack and matching ready poses. Animation coverage is 19/47 playable
kinds; all 47 retain base painted art. Original painted references, blue team
cloth, complete weapon silhouettes and the existing reflow packer are retained.
Gameplay, controller mappings and camera controls are unchanged. Full directions,
remaining units and physical Xbox performance remain open.
See docs/PAINTED_WARRIORS.md for prompts and verification.

<!-- Special infantry artwork increment: 22 October 2026 -->
CK-032/041: added Woad Raider, Berserk, Samurai and Teutonic Knight walking,
melee attack and matching ready poses. Animation coverage is 15/47 playable
kinds; all 47 retain base painted art. Existing cooldown/game-time playback,
team colours and shared solo/multiplayer rendering are preserved. Gameplay,
controller bindings and camera controls are unchanged. Full directions,
remaining units and physical Xbox performance remain open.
See docs/PAINTED_INFANTRY.md.

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

# Crown & Kingdoms — synchronized multiplayer and Xbox Series X full-content delivery plan

**Scope decision:** 19 October 2026. **Target reference:** Age of Empires II: Definitive Edition **on Xbox Series X**, with all gameplay DLC available on Xbox as of the recorded reference date; the game's original code, artwork, audio, campaigns and identities must remain its own. Xbox Series S / Microsoft Edge remains a required lower-performance acceptance device. This expands the earlier base-game-only delivery scope.

**Evidence rule:** VERIFIED means an actual named test or hardware playthrough, not a source-code search. All features below remain OPEN/PARTIAL unless specifically verified in the master register. No performance, human full-match, live network or DLC parity acceptance is claimed by this document.

## A. P0: real synchronized two-player gameplay — CK-007, CK-008, CK-031

Current `multiplayer.js` shares lobby Presence, matching map signatures and 5 Hz **cursor markers**. Both clients independently run local games; there is no shared order, ownership or world simulation. Do not label that a multiplayer match.

**Simulation architecture decision:** a *host-authoritative frame and command model*, with deterministic replay tests and frame-numbered client commands. An authenticated host owns the authoritative game world and validates the session/team/controlled entity for every command. Clients must not claim ownership from an untrusted packet, mutate the world independently on receipt, or process arrival-order-dependent commands. A separate reliable match transport/server will be required if Supabase Realtime budget, security or lateness makes the accepted frame delay unachievable. The existing 1 KiB application packet budget is a starting constraint, not permission to send truncated game state.

**Delivery gates, in dependency order:**
1. Freeze a versioned session protocol, assign one immutable player/team slot per connected session and one persistent network ID per game entity (survives list compaction, production, combat, saving and loading). Reject impostor/duplicate teams and unknown entity IDs. [PERSISTENT ENTITY IDs IN UNIT/BUILDING FACTORIES AND SAVE/LOAD VERIFIED; AUTHENTICATED TEAM ALLOCATION STILL OPEN]
2. Route **all** gameplay-changing input through typed commands: movement, attack/attack-move, gather, build, train, queue cancel, tech research, rally, garrison/unload, trade, tribute, diplomacy, villager priority, formation and ability. Validate terrain, prerequisites, affordability, fog permissions and *authoritative* unit ownership on the host. Never trust a client's result or resource balance. [NOT DONE]
3. Number commands by session sequence and simulation frame; reject replay/gap/future/late commands, order all accepted commands deterministically and explicitly acknowledge delivery/application. A future client must not step past an unresolved frame. [PROTOCOL PRIMITIVES TESTED AT 6876db6; NOT LIVE]
4. Remove gameplay-affecting non-seeded randomness and frame-time dependence; keep simulation ticks independent of render frame rate and visibility throttling. Gate on multiple identical seeded AI-vs-AI runs comparing checkpoints and final results. [NOT DONE]
5. Design authoritative snapshots and late-join/resume baselines, including queues, AI, projectiles, resources, fog/team visibility, all object references and RNG state. Checkpoints must be versioned and validated. [NOT DONE]
6. Compare state checksums on **matching frame numbers**; distinguish differing frames from actual desync, freeze/recover or fail safely rather than silently splitting worlds. Add ACK timeout, bounded resend, guest disconnect, host loss and reconnect policies. [HASH/CHECK PRIMITIVES TESTED AT 6876db6; NOT LIVE]
7. Run a single 2-player land match in two real independent browsers to a normal victory/defeat, simultaneously issuing conflicting orders. Repeat save/load/late reconnect, then naval, garrison, campaign/co-op only if supported, and loss/failover. Record frame/hash logs. [NOT DONE]
8. Only after fully verified 1v1: explore team games, 3–4 humans, stress limits and then the separate 8×500 aspiration. Never claim Xbox Live integration or cross-platform matchmaking for a browser-only game. [NOT DONE]

**Verified foundation evidence:** commit `6876db635dba7c5a0f887dec8e539b7af8de334a`, regression https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39221296969 (133/133 standalone files and 19/19 isolated missions) and validation https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39221296925 both succeeded. These prove guarded protocol primitives, persistent entity IDs and existing solo tests; they do not show real shared simulation or Xbox hardware functionality.

**Full-match acceptance evidence still required:** named commit, Ubuntu/Node protocol and deterministic simulation tests, two live browsers on separate clients, packet-loss/reordering/duplicate injection, end-of-match log, Xbox Edge two-controller sessions, and exact checked frames/hashes. A successful multiplayer lobby does **not** satisfy these.

## B. P1: Xbox Series X controller parity — CK-009–012, CK-023, CK-045

Use official Xbox control guides as the reference. First reproduce observable default mappings; optional remapping is supplementary, not a substitute for default fidelity.

| Control/interaction | Xbox DE documented behaviour | Crown & Kingdoms acceptance |
|---|---|---|
| A / hold A | Select unit/building; hold for area-selection box; contextual move/attack; double-A selects visible identical units | Compare short, hold, double and order context in a real controller session |
| RT | Command/building wheel and contextual training/research | All wheel sectors, submenus, selected building targets and cancel behaviour |
| D-pad Up / Right / Down / Left | Idle villager / support units / Town Centre / military quick selection | Match categories, focus, selected-group and camera behaviour |
| R3 | Villager priorities with presets, manual ratios and automated gathering/farm options | Match control entry, presets, budget/dropoff edge cases, controller help |
| LB/RB, LT and other chords | Quick-select pages, group/formation/building operations according to version-locked Xbox guide | Record exact observed controller mapping before changing anything; no guessed bindings |
| Start / menu | Pause/options/objectives/tech tree; in multiplayer opening menu does **not** pause shared simulation | Prove multiplayer tick policy with two clients and solo pause separately |
| View/camera/minimap | Readable at TV distance, radial prompts, minimap focus and UI navigation | 1080p and 4K captures, accessibility scale, focus and controller-only end-to-end match |
| Remapping | Explicit configurable remaps | Preserve current remap implementation and verify default + override consistency |

Source: https://www.ageofempires.com/learn-to-play/controlling-your-empire-gathering-resources-xbox/ and https://www.ageofempires.com/learn-to-play/military-economy-xbox/ and https://www.ageofempires.com/news/ageii-de-on-console-is-out-now/.

## C. P1/P2: original graphics overhaul — CK-032, CK-035, CK-041

- Asset inventory: every terrain type, unit facing, death, movement, projectile, building construction/damage, interface icon, faction architecture and minimap symbol. Track **missing / placeholder / needs redraw / validated** in the atlas manifest and screenshots.
- Replace inconsistent procedural placeholders with original, coherent high-resolution sprite/animation sets and faction silhouettes; consistent scale, shadows, outlines and selected-health/team indicators. Respect original game identity; do not copy Microsoft/World's Edge sprite sheets.
- Improve readable terrain/shorelines, vegetation, water, cliffs, fog of war, projectile visibility, attack/building feedback and animation timing. Add resolution-aware crisp UI, scalable HUD and consistent controller prompts at TV distance.
- Add adjustable visual effects/quality to protect frame time; regression captures at varied zoom, colour-blind checks, 1080p/4K, 2×200 units and performance profiling on Series S *before* claiming Series X polish.
- Keep art quality improvements separate from simulation/physics changes. Any atlas or animation change requires loading/asset checks and visual acceptance.

## D. P1/P2: full original sound and music — CK-033, CK-042, CK-043

- Sound-event matrix: select, acknowledge, move, gather, train, build, tech complete, combat weapon types, siege impact, naval, alert, victory/defeat, ambience, navigation and errors. Track missing/collision/priority/quiet-vs-busy mix.
- Commission/create **original** multi-layer music: menu, calm economy, tension, siege/battle, victory/defeat, with transitions, cue cooldowns, looping and controlled crossfades. Never use the reference game's soundtrack or copyrighted samples.
- Add dedicated volume sliders for music, effects, ambience and UI, mute, controller accessibility, spatial/attenuated world effects and voice-free alternative cues; avoid autoplay failures by unlocking/resuming Web Audio on interaction.
- Acceptance: auditory playthrough from clean load, volume persistence, no doubled sources, no runaway voices/CPU, no clipped peaks, accessible alerts and stable browser suspend/resume behaviour. Xbox Edge latency and speakers/headphones need real testing.

## E. P2: complete *Xbox* feature and DLC parity — CK-024–030, CK-038, CK-044, CK-046

Parity is a **functional-category target** with original assets and original story content; do not copy official campaigns, voice acting, music, artwork, branding or proprietary files. All listed items need an explicit catalogued `MISSING / PARTIAL / MATCHED / VERIFIED DIFFERENCE` disposition, per DLC and game build. Historical base-only and DLC boundary statuses are superseded by this new *requested full-content scope*.

**Base and legacy content:** all Xbox-included civilisations and their bonuses, unique units and technologies; four ages; playable civilisations/architecture groups; complete unit/building/research trees and upgrades; trade, religion/relics, counter systems, naval/transport, siege, fortification, gates and walls, diplomacy, market and garrisons; standard map generation, terrain/map modes and victory variants; controller-first tutorial, replay/spectator/scenario support *where part of the version-locked Xbox feature set*. The current 26 civ list and 19 original missions are not evidence of completeness.

**Xbox game-content expansions to inventory separately** (entitlement and Xbox feature availability to verify for each; do not assume purchasing base game gives all paid DLC):

| Reference release / pack | Audit checklist |
|---|---|
| Lords of the West | New civilisations, unique units/tech, maps and original-equivalent scenario mechanic categories |
| Dawn of the Dukes | Same — changes to civ roster and campaigns |
| Dynasties of India | Same — new Indian civ lines, technologies and campaign mechanics |
| Return of Rome | Separate antiquity rules/civs/modes; not automatically compatible with medieval skirmish |
| The Mountain Royals | Civilisations, highland regional roster/missions, mechanics |
| Victors and Vanquished | Scenario/campaign mechanics and objectives |
| Chronicles: Battle for Greece | Separate Chronicles gameplay families, antiquity content and campaigns |
| The Three Kingdoms | East Asian/Chinese expansion roster, unique mechanics and campaign systems |
| Chronicles: Alexander the Great | Distinct Chronicles mechanics and campaigns |
| The Last Chieftains (February 2026) | Mapuche, Muisca and Tupi mechanics plus new campaign archetypes |
| The Viking Sagas (September 2026) | Danes, Saxons and Varangians, naval and mercenary systems, three-campaign/15-scenario feature families |

Cosmetic-only add-ons (e.g., animated profile icons) are inventoried as *platform/UI cosmetics*, not mandatory RTS mechanics. The inventory must be revalidated for future Xbox releases after 19 October 2026. DLC content cannot be marked matched by checking for a civilisation name alone: prove bonuses, technologies, prerequisites, UI, balance, unique abilities, AI, scenarios and Xbox input.

Official sources: https://www.xbox.com/en-GB/games/store/age-of-empires-ii-definitive-edition/9NJDD0JGPP2Q ; https://www.ageofempires.com/news/the-viking-sagas-available-now-for-age-of-empires-ii-definitive-edition/ ; https://store.steampowered.com/dlc/813780/Age_of_Empires_II_Definitive_Edition/ (cross-reference only; Xbox store is entitlement authority).

## Delivery ordering and practical definition of done

1. **Stabilize synchronization**, complete real two-browser 1v1 match and controller tick policy.
2. **Fix observed gameplay gaps** (skirmish, active AI, long-game save/naval/housing, no deadlocks) while keeping existing green regression suites.
3. **Xbox controller mapping and UI** validated on real Series S/Series X through Edge, with all key commands reachable.
4. **Visual and audio production overhaul** measured for legibility, ambience and performance.
5. **Base and all available Xbox gameplay DLC content matrices** filled and backed by actual gameplay tests; accept distinct Chronicles/antiquity rules only after dedicated architecture.
6. **Release acceptance** requires both independent functional and reference-fidelity sign-offs, not a completion percentage guessed from file counts.

Track every completed task in `MASTER_AUDIT_AND_DELIVERY_REGISTER.md` with exact commit, tests, tested environment and remaining risks. Keep reversible commits; preserve all current code, tests and original assets.


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
