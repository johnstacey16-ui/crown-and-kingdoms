# Age of Empires II: Definitive Edition — reference and parity audit

**First pass:** 23 October 2026. **Platform benchmark:** Xbox Series X, controller input, core AoE2:DE gameplay. **Audit state: partial** — static source inspection and representative published facts, *not* an exhaustive 47-unit/technology/civilization comparison or live console certification.

## Source registry — requested sites

| Website | Correct address | Status / use |
| --- | --- | --- |
| AoE2 Database (requested) | https://aoe2database.com/ | Retrieval returned HTTP 530 in this audit. Record for revisit; **no balance claims derived from unavailable site**. |
| AoE2.net | https://aoe2.net/ | Site officially displays **sunset notice**: website and API no longer functional. Keep as **historical only**, not an ongoing data feed or gameplay benchmark. |
| aoe2de-api | https://github.com/gabrbfreire/age-of-empires-II-definitive-edition-api | Historical community-made Spring/MySQL data service, advertising old Heroku URL. Availability/update patch not verified. Never silently treat API as current. |
| AoE2 Tech Tree / Siege Engineers | https://aoe2techtree.net/ | Accessible, displays **AoE2:DE Update 185872** during this audit. Primary community tech-tree/data extraction view; verify patch and civ before comparing. |
| Age of Empires II: DE wiki | https://ageofempires.fandom.com/wiki/Age_of_Empires_II:_Definitive_Edition | User-requested game overview; direct retrieval blocked, but indexed detailed wiki subpages are useful **secondary** references. Validate patch notes and figures individually. |

## Official September 2026 DE patch baseline (Update 185872)

**Primary patch-note source:** https://www.ageofempires.com/news/age-of-empires-ii-definitive-edition-update-185872/

On this current reference update, AoE2:DE explicitly changed gathering and navigation. The official release notes mention improved lumberjack corner navigation, crowded-mine work positioning, villager collision recovery, drop-off site selection, paths around depots, movement through small gaps, regrouping/formation slot allocation, edge-of-map idle animation, and notification of stuck villagers. These are behavioural requirements **beyond raw gather-speed numbers**.

**New priority checks:** verify our lumberjacks can reach working faces of dense forests; crowded miners do not repeatedly walk to the opposite side of mines; workers pick their nearest *reachable* drop-off; workers aren't stuck in narrow passages or at building outlines; animation state resets when movement genuinely stops; group orders don't shuffle distant formation slots. Add focused reproducible tests before claiming current DE patch parity.

**Official Xbox tutorial** (linked below) also confirms seven villager priority presets, manual ratios, automatic farms around Mills/Town Centres and prioritizing Wood if auto-farm construction is unaffordable. The current custom numeric targets and lack of complete site-aware farm automation remain open.

## Additional verified sources for implementation

- https://www.ageofempires.com/learn-to-play/military-economy-xbox/ — **official Xbox Villager Priorities** tutorial: right stick opens menu; seven presets; manual *ratios*; assignment over time; workers do not independently build new resource drop-offs.
- https://www.ageofempires.com/learn-to-play/control-resources-aoe2/ — official resource and drop-off rules; Town Center/Lumber Camp/Mining Camp/Mill, farms and standard 200 max pop.
- https://ageofempires.fandom.com/wiki/Villager_(Age_of_Empires_II) — villager base movement 0.8, line of sight 4; wood 0.39/s, gold 0.38/s, stone 0.36/s, forage 0.31/s, effective farm ~0.32/s, hunting 0.41/s; standard 10 capacity for most land resources.
- https://ageofempires.fandom.com/wiki/Farm_(Age_of_Empires_II) — **one** active villager per farm; farm base stock 175 and reseeding.
- https://ageofempires.fandom.com/wiki/Wheelbarrow_(Age_of_Empires_II) and https://ageofempires.fandom.com/wiki/Hand_Cart — +10% speed each, normal carry progression 10→13→20, Wheelbarrow 75s/Hand Cart 55s.
- https://ageofempires.fandom.com/wiki/Militia_(Age_of_Empires_II) and https://ageofempires.fandom.com/wiki/Archer_(Age_of_Empires_II) — verified example trainable-unit baselines.
- https://aoe2db.com/ — accessible alternative *fan database*, rather than silently substituting it for the unavailable aoe2database.com.
- https://github.com/ustacode/aoe2-apis — living community **match-data API** ecosystem registry; don't use leaderboards/match endpoints as source of unit attack, HP, cost or economy simulation.

**Evidence policy:** save target **game build/patch, civilization, age, upgrade state, unit variant, research effects**, URL and fixture with every accepted value. Official pages have precedence for Xbox UI behaviour; dat-derived patch-specific metadata is preferred for exact base stats; third-party compendia need cross-checking. No wholesale scraping or copying other games' artwork, audio, UI code, descriptions, or copyrighted campaign content.

## Combat parity batch — 24 October 2026

**Reference baseline:** AoE2: DE standard units, no civilization bonuses, without researched damage/armor upgrades. Detailed unit pages: [Militia](https://ageofempires.fandom.com/wiki/Militia_(Age_of_Empires_II)), [Archer](https://ageofempires.fandom.com/wiki/Archer_(Age_of_Empires_II)), [Spearman](https://ageofempires.fandom.com/wiki/Spearman_(Age_of_Empires_II)), [upgrade table](https://ageofempires.fandom.com/wiki/Upgrade_(Age_of_Empires_II)). Cross-check subsequent official patches and faction restrictions before changing any values again.

| Line / reference property | Previous game | Reference baseline implemented on branch |
| --- | --- | --- |
| Dark Age Militia | 50 HP / 8 attack / speed 1.4 / reload 1.2 / train 10s | **40 HP / 4 attack / speed .9 / reload 2 / train 21s**, 50 food + 20 gold, **0 melee / 1 pierce armor** |
| Archer | 30 HP / 6 attack / range 5 / speed 1.4 / reload 1.4 / train 11s / 40W+30G | **30 HP / 4 attack / range 4 / speed .96 / reload 2 / train 35s / 25W+45G**, +3 against Spearmen; base 0/0 armor |
| Spearman | 45 HP / 5 attack / speed 1.4 / reload 1.4 / train 9s / melee armor 1 | **45 HP / 3 attack / speed 1 / reload 3 / train 22s / melee armor 0**; appropriate bonus ranges against cavalry, camels and elephants |
| Militia-line upgrade HP / attack | Incorrect cumulative +HP and +attack | **40/4 → 45/6 → 60/9 → 65/12 → 70/14** from Militia through Champion; Man-at-Arms changes movement to .96; Long Swordsman adds 1 melee armor |
| Spearman-line upgrade HP / attack | Incorrect +HP and generic late bonus | **45/3 → 55/4 → 60/6** from Spearman through Halberdier; cavalry bonus **+15/+22/+32**, camel **+12/+18/+26**, elephant **+15/+25/+28** |
| Research | Mixed legacy time and costs | Source-pinned Man-at-Arms, Long Swordsman, Two-Handed Swordsman, Champion, Pikeman, Halberdier upgrade time and cost (see config and executable tests) |

**Implementation notes:** `engine.js` initial melee-armor table and `js/simulation.js` damage model were changed as well as `js/config.js` so these numbers affect real hits and actual movement, not just UI stats. Source-checked tests execute real damage calculations and validate upgrade ladders. The game's generic `U.mil` and `U.spear` rows continue to represent the evolving upgrade *line* using `S.tech` modifiers; they are not additional trainable standalone rows.

**AI/battlefield pacing correction:** The base Militia, Archer and Spearman values increased the length of army engagements, exposing a seeded active skirmish that remained contested at 30 simulated minutes while still producing attacks on both sides. Production AI now reserves Feudal food/gold for Castle Age once it has enough workers, fighting units and researched prerequisite buildings; it redirects a bounded number of available workers toward food and abandons the saving constraint when hostiles threaten its home Town Centre. This is **our AI strategy**, not a claim that AoE2 has an exact fixed saving threshold. The active player-vs-AI automated test checks an actual natural match resolution within **45 simulated minutes**, with every passive-AI victory test still constrained to **30 minutes** and all three still requiring genuine Town Centre destruction and save/reload determinism.

**Still not AoE2:DE-exact:** armor-class bonuses for ships/other specialist regional units; archery accuracy (**80% baseline**), frame delay and projectile trajectory, garrison arrows; full distinct melee/pierce upgrade technology trees, elevation, target priority and town-centre/chateau defenses; faction-specific bonuses and missing unit types. These are **explicitly open** until tested. Core combat data parity also makes existing battle/AI pacing slower; campaign and seeded full-skirmish regressions are release gates, and hardware Xbox verification is still pending.

## Code audit — confirmed initial discrepancies

Current implementation was inspected in `js/config.js`, `js/simulation.js`, `js/kingdom.js`, `js/ai.js`, `js/mapgen.js`, `js/input.js`, `js/entities.js` and existing integration tests. Where the current code uses a purposefully simplified rule, it is still a parity gap if the target is exact DE simulation.

| System | Before this audit | Reference finding | Change/status |
| --- | --- | --- | --- |
| Villager movement | 1.5 tiles/s | base 0.8 | **Corrected** in first economy batch |
| Villager production | 8s per villager | 25s per villager, 50 food | **Corrected** |
| Wheelbarrow | 45s, +5% speed | 75s, +10% speed; carry capacity 13 | **Corrected** |
| Hand Cart | +5% speed | +10% speed, 55s and total 20 capacity | **Corrected** speed; duration/carry already matched |
| Land gathering | generic 0.8/s times multipliers | wood .39, gold .38, stone .36, berries .31, effective farm .32, animal .41 | **Corrected baseline** for villagers. Farm value is **effective approximation**, not AoE2's actual growing-food/farm-walking model. Ships retain existing rate awaiting audit. |
| Gathering/carry upgrades | extra global `gath` and `carry` and simplified resource techs | DE's technology-specific multipliers and eligibility | **Open**; don't break saves/UI or AI training before migration |
| Resource occupancy | nearest-node and automated routing without a universal exclusive farm reservation | one worker per farm; **no universal fixed 8/6/3 worker caps** on other resource kinds | **P0 open**: enforce farm exclusivity, no parking at occupied farm, nearest reachable alternative |
| Villager discovery | radius search (16/18/30 etc.) and shared map exploration | unit LOS and player visibility need separate verification; user-proposed permanent private resource memories are not established AoE2 rule | **P1 open**: visibility/fog tests and explicit-command constraints |
| Building priority | ordered building command; construction completion can trigger nearby resource lookup | not automatic assistance at every visible foundation | **P1 open**: resume explicit orders and auto economy coherently |
| Militia | 50 HP, 8 damage, 1.4 speed, 10s train | 40 HP, 4 damage, 0.9 speed, 21s train | **Implemented in combat batch** with correct line progression, melee and pierce armor; seeded battles and full faction parity remain gates |
| Archer | 6 damage, 5 range, 1.4 speed, 40W/30G, 11s train | 4 damage, 4 range, .96 speed, 25W/45G, 35s train | **Implemented in combat batch** with +3 vs Spearmen; **accuracy/attack delay still open** |
| Spearman | 5 damage, 1.4 speed, 9s train | 3 damage, 1.0 speed, 22s train (normal line) | **Implemented in combat batch** with evolving anti-cavalry/camel/elephant bonuses, more armor classes still open |
| Tech/age system | `AG`, `TE`, broad age eligibility and resource upgrade simplifications | DE era requirements, buildings, upgrade chain and civ restrictions differ | **P0 open** — full source/version matrix before replacements |
| Combat | simplified attack/armor `arm`, class bonuses, projectile and counter rules | DE distinguishes armor classes, melee/pierce armor, accuracy, projectile flight, splash and elevation | **P0 open**; stats alone do not fix damage parity |
| Xbox priorities | custom worker numerical targets under menu | R3 **seven presets**, configurable proportional ratios, automated rebalancing | **P0 open**: actual console UX and persistent allocation parity |
| Save/network | local saves and replay/relay exist; not production-certified on Xbox | full match determinism, command/visibility replication, join/reconnect | **P0 open** |
| Art/animation | 19/47 dedicated 16-pose units + secondary transforms | DE has many distinct unit/task/directional animations | **P1 open**; no unapproved new game sprites |

### Do *not* mistake these for AoE2 rules

- **Eight per tree, six per mine, three per berry bush:** not documented hard universal capacity limits. Improve visual/physical work-position contention without claiming fixed limits.
- **Every villager remembers individually everything ever seen forever:** player fog-of-war and shared exploration are distinct; not an AoE2:DE reference mechanic to copy blindly.
- **All foundations within four tiles automatically override assigned gathering:** not normal general-purpose villager logic.
- **Ten resources in 1.8–2.5 seconds:** not standard base gather timings (resource-specific baseline rates above).
- **All food gathering identical:** deer, livestock, forage, farms and fishing require distinct treatment.

## Farm occupancy parity implementation (follow-up)

**One active villager per farm** is an AoE2:DE farming rule. This batch checks a farm's living, ungarrisoned, currently assigned worker, with deterministic priority for the earliest already-assigned worker in the unit roster. Returning with a harvest still reserves the farm. Death, retasking, garrisoning and invalid orders release that assignment automatically; no permanent per-node lock survives incorrectly across save/load. Old saves with duplicate assignments are resolved on the next simulation tick.

**Affected surfaces:** normal resource retargeting in `js/simulation.js`; controller/direct orders in `js/input.js` and newly placed farms in `engine.js`; Xbox-style automated villager targets in `js/kingdom.js`; AI worker reassignment in `js/ai.js`; and authenticated multiplayer build/gather commands in `js/network-commands.js`. Extra workers seek another reachable food resource; if none can be reached, they remain idle rather than chopping the same farm together. A separate source test covers live-owner priority, death/garrison/unassignment recovery, farm ownership, nearest alternatives, and automatic assignment.

**Not included:** authentic farm footprints, placement animation, full AoE2 farming walking choreography/harvest pacing, periodic replant queues, Xbox's seven exact automatic worker presets, or an invented fixed quota on trees/berries/mines. These remain on the E1/E9 checklist.

## Full-system audit backlog (acceptance criteria)

| Workstream | Priority | Inspection target and acceptance before mark complete |
| --- | --- | --- |
| E1 — Economy | P0 | Per-source actual gathering and special modifiers; carrying/drop-offs; farm exclusivity, placement, reseed, interruptions, worker/tool animation and unreachable retargeting. Source-pinned runtime fixtures for 1, 10, 30 villagers, with Xbox priorities enabled/disabled. |
| E2 — Military catalogue | P0 | **Every one of the game's 47 playable unit kinds** plus research upgrades: hitpoints, speed, cost, training time, class armor, bonuses, projectile type, cooldown, ranges, civilization access and unique-unit training building; source/patch-indexed comparison table. |
| E3 — Buildings / ages | P0 | All configured building kinds, foundations, garrison, resource costs, prerequisites, all four Ages, population, builder multiplier, repair, damage and razing. Separate standard/nonstandard mode exceptions. |
| E4 — Research | P0 | All `TE` and civilization/unique techs: exact cost/time/age/building/preconditions, modifiers, on-existing and newly produced units, tech chain and denied research. |
| E5 — Command/action model | P0 | Explicit gather/build/repair orders, group selection, waypoint queue, contextual actions, attack-ground/stance/follow/guard/patrol, priority/automation override and idle retasking. |
| E6 — Unit vision and map | P1 | Explored vs visible, shared team vision, 4-tile **base villager** sight, line-of-sight rules, unit upgrades, stealth, terrain, passability, generated map resources and building footprints. |
| E7 — Factions / upgrades | P0 | For each civilization, unit availability, unique units, regional exceptions, economic/military bonuses and full age-dependent tech tree. No shared one-size-fits-all value where civ changes it. |
| E8 — AI | P0 | Fair economy, worker assignment with limited sources, building timing, rush/defense decisions, army groups, raids, retreat, age-up and noncheating difficulty; benchmark across seeds. |

**E8 diagnostic checkpoint:** After first DE villager speed/resource-rate corrections, a 12-minute seeded smoke found the AI failing to gather 500 food for Feudal Age. Age-food reservation and worker redistribution restored at least two age-ups by 720 seconds. By 20 minutes two rivals had 11 and 13 ready soldiers but the legacy minimum first-wave size was 14; the initial Feudal push now targets 70% of that threshold (minimum six), while later waves keep their difficulty-sized criteria. This is an **AI pacing repair**, not a claim AoE2:DE runs that exact percentage. Full seeded tests must pass before release.
| E9 — Xbox Series X controls | P0 | R3 economy radial seven presets and ratios, quick select, garrison, farm reseeding, radial building wheels, controller-only match flow, UI legibility; test on actual Xbox Edge. |
| E10 — Naval, trade and diplomacy | P1 | Ships, transport, fish traps, repair, trade route revenue, diplomacy/tribute, terrain routes, destinations, allied trade and naval battles. |
| E11 — Online determinism | P0 | 1v1 authoritative state, order validation, save/resume/reconnect, late join protocol, desync recovery, user-visible failure handling, anti-spoof, longer match. |
| E12 — Maps, campaigns and modes | P1 | Standard starts, population caps, win conditions, game modes, campaign rules and explicit exceptions. Preserve original Crown & Kingdoms content, don't import DE proprietary levels. |
| E13 — Presentation & perf | P1 | Resource tools, animation poses vs movement speed, selection feedback, sound, scalable sprite groups, frame budget and layout on desktop/mobile/Xbox browser. |

## Prioritized repair plan

1. **First implementation (this PR):** correct documented base villager speed/training, Wheelbarrow/Hand Cart movement bonuses, per-source land gather rates; add executable baseline regression; run all existing regression and browser workflows. Outcome may slow economy considerably and therefore needs playtesting, not just CI.
2. **Before adding new feature content:** exclusive farm working assignment and nearest reachable alternative with both player and AI workers, saved/dead/retasked worker cleanup.
3. **Combat vertical slices:** compare base militia/archer/spearman/knight then their upgrades in config, calculation and AI; never blindly substitute a displayed attack number without armor classes and hit mechanics.
4. **Tech and age audit:** remove or migrate synthetic research mechanics only after their save-state/UI/AI dependents and reference tech-tree mapping are accounted for.
5. **Xbox economy radial**, controller verification, fog/resource orders, then civ matrix, online full match, graphics and Xbox hardware.

**Status terms:** VERIFIED = code + source-specific tests and intended integration proven; IMPLEMENTED = code changed but broader checks pending; AUDITED = compared but unchanged; UNVERIFIED = no meaningful end-to-end evidence. Do not represent this initial inventory as a finished game-wide audit. If a source version changes, re-run and explicitly reclassify stale comparisons.
