# Full game completion — implementation reference

## Active gameplay-content register — 12 November 2026

**Scope supersedes the older expansion/save instructions below:** finish the existing
43-civilization production roster; do not add civilizations, deploy, discard old
saves, or reintroduce automatic low-detail troops. Artwork and the reported 5 FPS /
graphics-context loss require separate work. The starting production source is
`9d431c1a`; no claim is made that every existing mechanic matches modern AoE II.

[Machine-readable inventory](gameplay-content-register.json) records every live
civilization, all 217 technologies with civilization eligibility, all 87 unit
**definitions** (including building-attack proxies and special non-trained kinds),
all 28 buildings, costs, durations, prerequisites, declarative upgrade effects,
and reachable per-age training options. Generate it with
`node scripts/gameplay-content-inventory.mjs --write`. It is derived from runtime
rules; presence and reachability alone do not establish complete behavior.

### Implemented batches

- `9076cebe`: twelve unique technologies now grant HP to living existing units as
  well as the persistent ledger used by future units. El Dorado uses the same
  standard path without changing its already-correct effect. Regression checks
  wounded/garrisoned units, enemies, corpses, duplicate research, and in-flight /
  completed research save/reload.
- `ffc3d4e2`: construction and building upgrades share HP calculations. Masonry /
  Architecture no longer multiply Hoardings' flat HP based on research order.
  Great Wall consistently affects existing and future walls/gates/towers without
  silently consuming Fortified Wall research. Custom campaign HP is preserved.
- `a258ea5d`: Bloodlines covers later mounted troops, Husbandry covers mounted
  definitions and Cavalry Archers, and Magyar Huszars receive cavalry armour.
  Lithuanian Winged Hussars now have a reachable paid prerequisite; both eligible
  civilizations transform existing and queued scouts, retaining wounds and costs.

- `7168a45b`: twelve later cavalry/ranged/siege kinds receive the correct AI
  personality category instead of silently falling back to infantry; weighted
  choices retain exactly one seeded random draw.
- `8d4db12c`: generated content reachability/register and real paid queue matrix;
  removed duplicate Winged Hussar, Houfnice and Legionary production entries.
  Current matrix checks 3,273 research contexts and 2,456 training contexts.

- `52caa8c3`: Houfnice retains shared cannon HP/attack effects in either
  research order, including Chemistry, future production and save/reload.
  Gurjara Camel Scouts promote on Castle Age completion; live wounds and paid
  queue entries carry forward into Camels and later Heavy Camel research.
- `ca2bea08`: Blacksmith armour selects one line for mounted archers instead of
  adding both archer and cavalry upgrades. Both Ratha stances retain the archer
  armour line. Regression checks reproduce the former overlap and exercise real
  paid research followed by stance changes.

### 13 November follow-up — research decisions and infantry coverage

Implemented in `5d583574`; [verification evidence](verification/gameplay-content-2026-11-13.json).

AI armour research now shares the combat armour-family helper, so mounted
archers and both Ratha stances prefer archer armour. Mounted troops retain
Bloodlines/Husbandry priority independently of their armour family, including
Cavalry Archers, War Wagons, Kipchaks and Arambai. An end-to-end AI test confirms
real purchase, cost deduction, completion and the resulting defence increase.

Fereters uses the canonical infantry roster (excluding spearmen) for its +30 HP,
including Throwing Axemen and Chakram Throwers previously omitted by its manual
list. Tests cover wounded existing units, future units, dead units and enemies.
Armenian AI values the technology for affected infantry rather than Composite
Bowmen. Other unique-technology target scoring still needs a systematic review.
AI melee-attack priorities also still use overlapping infantry/cavalry counts,
including some mounted archers, while damage applies Forging/Iron Casting/Blast
Furnace only when `U[k].rng < 2`. This is a confirmed remaining scoring gap;
the armour fix does not claim to repair every research decision.

Today's verification: 5/5 quick gates, 80 targeted tests (including the paid
content matrix), 68 AI tests including real paid armour research, and 3/3 seeded
AI scenarios passed. All 290 regression files ran: 289 passed in the suite;
the remaining cavalry file hit fixture timeouts and then passed all five tests
in isolation without changing limits. Tidewatch's competing focused run timed
out, but its serial regression rerun passed with a scripted win. This is not a
clean single-run 290/290 result. The full 19-campaign and Xbox contract matrices
remain evidenced against the previous revision; Chromium/hardware remain open.

### Open implementation and verification work

- Every civilization remains **PARTIAL**. Queue tests establish real payment,
  timers and completion, not every economic/combat/team effect or reference parity.
- Reconcile each original unique technology's name/description with its intended
  C&K effect: for example Chivalry currently adds Knight attack, Nomads adds
  Mangudai HP/attack, Mahouts adds elephant HP, and Marauders adds Tarkan stats.
  Do not silently describe these as the AoE II mechanics or replace original
  design decisions without tracing the intended specification.
- Audit remaining class-wide effects and transformation lines, ability counters,
  naval bonuses, conversions,
  garrisons, formations, repair and placement. The production matrix exercises
  normal queues; it does not certify tactical behavior or every special spawn.
- AI personality classification is repaired for twelve newer military kinds
  (`7168a45b`). Deeper composition scoring, unique-tech priorities, counters,
  ability use and multi-seed recruitment across all 43 factions remain open.
- Old save schemas/IDs remain unchanged. Personal historical saves were not
  provided; automated save validation cannot certify every personal save.
- [Current verification evidence](verification/gameplay-content-2026-11-12.json):
  290/290 standalone files, 1,666 focused assertions, 5/5 quick gates,
  19/19 scripted campaigns, 3/3 seeded AI scenarios and 8/8 Xbox software
  contracts passed on code tree `4d9836fa` (`ca2bea08`). Chromium is **BLOCKED** by this
  environment's socket permission and failed browser download. Physical Series S
  play, performance, controls and graphics recovery require the owner's testing.
  The three standard seeded games only reached Feudal before natural victory;
  they do not prove all factions can reach Imperial in a natural full match.

### Civilization register

| ID | Civilization | Unique unit | Unique technologies | Gameplay status |
|---|---|---|---|---|
| 0 | Franks | Throwing Axeman | Chivalry; Bearded Axes | PARTIAL — production/research paths checked; full mechanics review open |
| 1 | Britons | Longbowman | Yeomen; Warwolf | PARTIAL — production/research paths checked; full mechanics review open |
| 2 | Mongols | Mangudai | Nomads; Drill | PARTIAL — production/research paths checked; full mechanics review open |
| 3 | Byzantines | Cataphract | Greek Fire; Logistica | PARTIAL — production/research paths checked; full mechanics review open |
| 4 | Persians | War Elephant | Mahouts; Citadels | PARTIAL — production/research paths checked; full mechanics review open |
| 5 | Teutons | Teutonic Knight | Crenellations; Ironclad | PARTIAL — production/research paths checked; full mechanics review open |
| 6 | Celts | Woad Raider | Furor Celtica; Stronghold | PARTIAL — production/research paths checked; full mechanics review open |
| 7 | Vikings | Berserk | Chieftains; Bogsveigar | PARTIAL — production/research paths checked; full mechanics review open |
| 8 | Saracens | Mameluke | Zealotry; Counterweights | PARTIAL — production/research paths checked; full mechanics review open |
| 9 | Turks | Janissary | Sipahi; Artillery | PARTIAL — production/research paths checked; full mechanics review open |
| 10 | Chinese | Chu Ko Nu | Great Wall; Rocketry | PARTIAL — production/research paths checked; full mechanics review open |
| 11 | Japanese | Samurai | Yasama; Kataparuto | PARTIAL — production/research paths checked; full mechanics review open |
| 12 | Khmer | War Elephant | Tusk Swords; Double Crossbow | PARTIAL — production/research paths checked; full mechanics review open |
| 13 | Indians | Elephant Archer | Shatagni; Grand Trunk Road | PARTIAL — production/research paths checked; full mechanics review open |
| 14 | Spanish | Conquistador | Supremacy; Inquisition | PARTIAL — production/research paths checked; full mechanics review open |
| 15 | Italians | Genoese Crossbowman | Pavise; Pirotechnia | PARTIAL — production/research paths checked; full mechanics review open |
| 16 | Slavs | Boyar | Detinets; Druzhina | PARTIAL — production/research paths checked; full mechanics review open |
| 17 | Huns | Tarkan | Marauders; Atheism | PARTIAL — production/research paths checked; full mechanics review open |
| 18 | Goths | Huskarl | Anarchy; Perfusion | PARTIAL — production/research paths checked; full mechanics review open |
| 19 | Aztecs | Jaguar Warrior | Garland Wars; Atlatl | PARTIAL — production/research paths checked; full mechanics review open |
| 20 | Mayans | Plumed Archer | Hulche Javelins; El Dorado | PARTIAL — production/research paths checked; full mechanics review open |
| 21 | Incas | Kamayuk | Andean Sling; Fabric Shields | PARTIAL — production/research paths checked; full mechanics review open |
| 22 | Ethiopians | Shotel Warrior | Royal Heirs; Torsion Engines | PARTIAL — production/research paths checked; full mechanics review open |
| 23 | Malians | Gbeto | Tigui; Farimba | PARTIAL — production/research paths checked; full mechanics review open |
| 24 | Koreans | War Wagon | Shinkichon; Eupseong | PARTIAL — production/research paths checked; full mechanics review open |
| 25 | Magyars | Magyar Huszar | Corvinian Army; Recurve Bow | PARTIAL — production/research paths checked; full mechanics review open |
| 26 | Portuguese | Organ Gun | Carrack; Arquebus | PARTIAL — production/research paths checked; full mechanics review open |
| 27 | Burmese | Arambai | Manipur Cavalry; Howdah | PARTIAL — production/research paths checked; full mechanics review open |
| 28 | Vietnamese | Rattan Archer | Chatras; Paper Money | PARTIAL — production/research paths checked; full mechanics review open |
| 29 | Bulgarians | Konnik | Stirrups; Bagains | PARTIAL — production/research paths checked; full mechanics review open |
| 30 | Tatars | Keshik | Silk Armor; Timurid Siegecraft | PARTIAL — production/research paths checked; full mechanics review open |
| 31 | Cumans | Kipchak | Steppe Husbandry; Cuman Mercenaries | PARTIAL — production/research paths checked; full mechanics review open |
| 32 | Lithuanians | Leitis | Hill Forts; Tower Shields | PARTIAL — production/research paths checked; full mechanics review open |
| 33 | Burgundians | Coustillier | Burgundian Vineyards; Flemish Revolution | PARTIAL — production/research paths checked; full mechanics review open |
| 34 | Sicilians | Serjeant | First Crusade; Hauberk | PARTIAL — production/research paths checked; full mechanics review open |
| 35 | Poles | Obuch | Szlachta Privileges; Lechitic Legacy | PARTIAL — production/research paths checked; full mechanics review open |
| 36 | Bohemians | Hussite Wagon | Wagenburg Tactics; Hussite Reforms | PARTIAL — production/research paths checked; full mechanics review open |
| 37 | Dravidians | Urumi Swordsman | Medical Corps; Wootz Steel | PARTIAL — production/research paths checked; full mechanics review open |
| 38 | Bengalis | Ratha (Ranged) | Paiks; Mahayana | PARTIAL — production/research paths checked; full mechanics review open |
| 39 | Gurjaras | Chakram Thrower | Kshatriyas; Frontier Guards | PARTIAL — production/research paths checked; full mechanics review open |
| 40 | Romans | Centurion | Ballistas; Comitatenses | PARTIAL — production/research paths checked; full mechanics review open |
| 41 | Armenians | Composite Bowman | Cilician Fleet; Fereters | PARTIAL — production/research paths checked; full mechanics review open |
| 42 | Georgians | Monaspa | Svan Towers; Aznauri Cavalry | PARTIAL — production/research paths checked; full mechanics review open |

### Historical completion guidance (superseded where stated above)


**Owner decision, 10 November 2026.** This document expands the content-completion workstream from [ROADMAP.md](../ROADMAP.md); it is a *supporting implementation checklist*, not a second live priority register. Keep the 48 AUD tasks, P0–P4 safety/acceptance rules and release gate in ROADMAP.md.

**Active goal: complete the entire intended game, not merely polish the current 26-civilization slice.** The owner explicitly chooses civilization/technology-tree expansion, remaining gameplay and Xbox feature parity as the priority for future autonomous work. Treat small refactors, tests and crash/performance fixes as enablers, not a permanent substitute for finishing content. The audited 48 AUD items and the P0–P4 technical and release requirements below still apply; this section controls **development priority**, not permission to skip safety, hosting or physical Xbox acceptance.

### Implementation batches — proceed autonomously

1. **Shared technology-tree foundation (NOW).** Make unit and technology availability, age/production-building requirements, prerequisites, researched effects, icons/descriptions and research costs expressible per civilization from one validated rules source. Expose the same decisions to solo Xbox menus, tech-tree viewer, AI, production queues and authenticated host commands. Extend multiple unique technologies and Elite unique-unit upgrades without copying 26 ad hoc code paths. Keep current numbered civilization IDs stable within the active build for deterministic multiplayer and catalogue consistency.
2. **Finish the existing 26 civilizations.** Audit each civilization against an explicitly dated/reference version: starting and ongoing bonuses, both unique technologies, unique-unit Elite upgrade, regional units, research exclusions, team bonuses, correct counters, research/building age, unit stats and production mechanics. Add behavioral research/combat/AI and per-civ availability tests; count a civilization *complete* only when each audited rule works, not when its name is in a list. The current entries and research restrictions are **PARTIAL**, even where targeted tests pass.
3. **Add missing base/expansion civilizations and variant rulesets.** Use a current, versioned Xbox-available reference inventory, then implement missing civilizations in small tested groups, including DLC/architecture/unique units, gameplay systems, and appropriate Return of Rome/Chronicles-specific rulepacks where medieval rules do not fit. Do not claim full DLC parity from names alone. Use original artwork, scenarios and audio.
4. **Complete the missing RTS systems in parallel.** Units, armour/counters, projectiles, siege, elevation, formations, economy/trade, monks, naval fleets, landings, map types, start/victory modes, AI tactics/late-game management, campaign triggers and new original missions; then human multiplayer reconnect, more seats, network security, Xbox menus/controls/accessibility and visual/audio coverage.
5. **Acceptance after each content batch.** Confirm catalog validation and unit/tech cost/effect consistency across UI, AI, solo and authenticated commands; deterministic combat, legal research prerequisites, saved *current-build* states, and automated regressions. Run multi-seed AI, 19 existing campaign scripts and Chromium at substantial milestones, with separate physical Series S Edge checks for FPS, focus, complete controller operation and readability. Routine commits do not publish the live site.

**Owner's personal game-save decision (10 November):** The owner is explicitly happy for **their own old Crown & Kingdoms game saves** from earlier development versions to stop loading. Do not spend game-completion effort migrating or retaining compatibility with those old personal saves when civilizations, technologies and save schemas change. This is **not** a request to disable automated save tests: newly created saves from the same current build still must save, load, validate, and preserve the full technology/world state; untrusted or corrupt data and multiplayer identities still need safe handling. Do not silently delete older saves or deploy a breaking release without the normal release checks.

**Execution rule:** Prefer delivering a working civilization/technology/gameplay increment in every routine development session. Investigate bugs or performance blockers when they threaten the increment; avoid repeated micro-polish-only batches. No forced push, paid hosting, uncontrolled deployment or untested Xbox claims.



### Per-civilization completion contract

A civilization is **partial** until all of the following work in the live game: both unique technologies, Elite unique-unit upgrades, core/regional unit eligibility, research prerequisites, castle/barracks/stable/dock production as applicable, age gates, unit and building stats, economic/team bonuses, AI recruitment/research, host command validation, readable technology-tree display and current-build save/reload. Do not mark it complete based only on names or JSON metadata.

For each content batch, pin the external rules to the reference game **version and patch date**. In particular, the September 2026 Definitive Edition update replaced the Frankish Bearded Axe technology; do not add obsolete content from old guides. Maintain original content for Crown & Kingdoms' art, audio and campaigns.

**Owner's personal saved games:** migration of personal saves created on old development builds is *not required*. Keep tests proving a fresh save made in the current build loads, persists new technology effects, and rejects corrupted/network-invalid data.

### Shared technology-tree foundation increment — 10 November 2026

The read-only `technologyTreeModel(team,world)` in `js/kingdom.js` now packages **the actual `trOf/rsOf` eligibility rules** into explicit per-building units and technologies, with researched/locked/available status, age, prerequisite, research time and actual per-civilization cost (including Spanish Blacksmith gold removal). This is a presentation model, not a second gameplay rulebook. `trOf` also uses the **supplied** technology state for Archer/Crossbowman replacement instead of accidentally reading global `S.tech`, making authoritative projections and technology previews deterministic.

The Xbox technology-tree screen consumes the same model, presents the chosen building's first three units/technologies with locks and resource costs, and scrolls through the entire building roster via the existing D-pad Up/Down; A/B still return. All 26 existing civilizations' unique Castle options are covered by targeted tests. This does **not** complete missing civilizations, art, all tech exclusions, new rulesets or physical Xbox inspection.
