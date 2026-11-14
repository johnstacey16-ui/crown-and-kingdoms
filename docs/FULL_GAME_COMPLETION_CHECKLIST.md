# Full game completion — implementation reference

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

## Current source audit and execution checklist — 14 November 2026

**Baseline:** `175714d8` on `development`, plus the tested five-technology completion batch recorded in the journal. This is the detailed completion reference requested by the owner; **ROADMAP.md remains the execution order** and its AUD/CK identifiers are retained. Historical “26 civilizations” paragraphs above describe earlier milestones, not the current count.

**Status meanings:** MISSING = no corresponding active catalogue/ruleset implementation found. PARTIAL = a working implementation exists but has an identified gap. VERIFY = implemented or plausible, but the version-specific rule or full acceptance has not been proven. A row saying VERIFY is not evidence that its feature is absent. This is the current known backlog, not a claim that an audit can prove there are no undiscovered bugs.

### Source census and shared definition of done

- [x] Count actual `CIV`, `U` and `B`: **43 civilizations, 84 unit definitions, 28 building definitions**. Unit definitions include the three building-attack proxies and both Ratha stances; this is not 84 distinct recruitable military units.
- [x] All 43 civilizations have first/second unique-technology and Elite entries. This proves registered entries, **not correct effects or faction completion**.
- [x] Shared training/research/building unlocks, technology-tree model, host commands, age rules and current-build saves exist; 430 restriction rows and 14 regional-unit entries pass catalogue validation.
- [ ] Pin a single current Xbox DE reference build and reconcile every existing restriction table and value against it. Current code mixes older tables, approximated stats and newer content. Do not label a whole faction complete after one technology repair.
- [ ] For **every** civilization verify starting resources/units, age-scaled bonuses, free technologies, economy, army, team effects, both unique technologies, Elite units, core/regional access, costs/times/prerequisites, armour classes/counters, AI use and human/controller readability.
- [ ] For each repaired rule prove existing and future entities, wrong-civ/wrong-age/insufficient-resource rejection, authoritative host order, hypothetical-world isolation, current-build save/reload and no duplicate application.
- [ ] Replace generic or misleading technology help with descriptions of actual implemented effects. Newly repaired Marauders, Corvinian Army, Sipahi, Detinets, Chivalry and Yeomen now have help text.
- [ ] Complete multi-seed matchup/balance coverage, human skirmishes and dedicated original art separately from code acceptance.

### Every active civilization: specific remaining work

The source owners are `js/civilizations.js` (definitions), `js/kingdom.js` (eligibility/costs), `js/simulation-*` (effects) and the matching `tests/civilization-*` regressions. **Every row remains PARTIAL**; the shared contract above applies to all rows. Observations below describe inspected code, while “verify/reconcile” explicitly leaves external-version adjudication open.

| ID | Civilization | Observed implementation and remaining work |
| --- | --- | --- |
| 0 | Franks | **Chivalry repaired in this batch:** Imperial technology speeds Stable training and research by 40%, replacing Knight attack. Bearded Axes remains registered despite the 2026 replacement: implement the appropriate Mounted Crossbowman line and Ordonnance Companies. Reconcile HP, resource and Castle/economy bonuses. |
| 1 | Britons | **Yeomen repaired in this batch:** foot archer/Skirmisher range and Tower damage replace generic archer attack. Complete age-dependent civilization range, shepherd and Town Centre bonuses. Warwolf exists; verify hit/splash and unit eligibility. |
| 2 | Mongols | **Nomads repaired in the following batch:** completed Houses destroyed after research retain capacity; foundations and prior losses do not. Drill exists. Verify hunting, scout/steppe HP, mounted-archer attack cadence and team sight. |
| 3 | Byzantines | Greek Fire/Logistica/Cataphract effects exist. Complete age-scaled building HP, age-up and counter-unit prices, healing/team effects; reconcile Dromon and Varangian Guard access and splash. |
| 4 | Persians | Legacy Mahouts HP effect and +150 food/wood start need replacement against current Persian rules. Missing Savar and newer unique-tech/unit access reconciliation; validate Town Centre/Dock work and HP, cavalry/gold and team bonuses. |
| 5 | Teutons | Ironclad and Crenellations range exist. Verify infantry garrison arrows, conversion resistance, farm discount, garrison/healing capacity and age-scaled cavalry/infantry armour. |
| 6 | Celts | Furor Celtica currently updates bonus ledger through `hpbF`; test/reconcile living siege HP on completion. Stronghold exists; verify exact siege eligibility, attack/work rates, woodcutting, infantry speed and sheep ownership. |
| 7 | Vikings | Chieftains currently adds generic infantry attack. Reconcile anti-cavalry/kill income and 2026 rework; missing Longship/Varangian Guard lines and current regional ranged access. Verify infantry HP, free economy research and naval/team prices. |
| 8 | Saracens | Zealotry adds flat HP through a legacy effect; verify correct values and living-unit application. Counterweights exists. Complete current market economics, camel/archer bonuses and team siege effects. |
| 9 | Turks | **Sipahi repaired in this batch**: +20 Cavalry Archer HP, replacing gunpowder attack placeholders. Artillery exists. Verify remaining gunpowder HP/work rate, gold mining, free Scout-line/Chemistry research and all building/naval range effects. |
| 10 | Chinese | Great Wall shares `fw` with other wall effects and scales existing structures separately; reconcile stacking and future construction. Rocketry exists but newer Fire Lancer/Rocket Cart access is missing. Verify starting villagers/resources, research discounts and team farms. |
| 11 | Japanese | Yasama/Kataparuto flags and effects exist; verify exact extra-arrow behaviour and Trebuchet packing/reload. Complete age-scaled infantry cadence, resource-building discounts, fishing and team naval sight. |
| 12 | Khmer | Uses the Persian War Elephant as its unique unit; missing Ballista Elephant identity and correct regional Battle Elephant integration. Tusk Swords targets `ele`; Double Crossbow only has a Scorpion path. Verify farm/no-drop-off, age/building exceptions and house garrison. |
| 13 | Indians (legacy Hindustani slot) | Resolve stable-ID naming/content to Hindustanis. Missing Ghulam/Imperial Camel/Caravanserai; Shatagni currently adds attack rather than the intended Hand Cannoneer range. Verify villager discounts, camel/gunpowder/team effects and Grand Trunk Road scope. |
| 14 | Spanish | Supremacy adds HP/attack but needs armour, age, cost and living-unit reconciliation. Inquisition exists. Verify construction, blacksmith, gunpowder, missionary and trade/team behaviour. |
| 15 | Italians | Pavise is still a Genoese HP/attack tech; reconcile its removal/passive armour and the current two-tech roster before repairing obsolete content. Pirotechnia exists. Missing Condottiero/team unlock; verify age/naval/gunpowder costs. |
| 16 | Slavs | **Detinets repaired in this batch**: Castle/Tower stone-to-wood construction/repair effect, replacing cavalry HP. Druzhina exists. Complete current farming, free infantry research, siege costs, monk speed and military-building population team bonus. |
| 17 | Huns | Marauders Stable unlock verified in `7a7a3cb`; Atheism has a relic-income path. Complete no-House/max-population start and wood adjustment; verify Cavalry Archer discounts, Trebuchet accuracy and Wonder/Relic timer changes. |
| 18 | Goths | Anarchy/Perfusion/Elite Huskarl exist. Replace approximate infantry HP/resource bonuses with version-correct costs, building damage, hunting, population and infantry research restrictions. |
| 19 | Aztecs | Garland Wars/Atlatl exist. Verify monk HP per technology, carry/start gold, military work rate and relic/team economics against reference values. |
| 20 | Mayans | Hulche Javelins currently adds attack instead of a second Skirmisher projectile. El Dorado exists. Verify extra villager/start resources, resource longevity, archer discounts and team walls; reconcile renamed/current techs. |
| 21 | Incas | Andean Sling currently buffs Kamayuks. Reconcile current Last Chieftains rework, Champi/Slinger access, Fabric Shields coverage, minimum range and economy/building/team rules. |
| 22 | Ethiopians | Royal Heirs currently gives Shotel HP/attack. Reconcile the current counter-resistance effect/eligible units. Verify age-up resources, free Pike, archer cadence and team outposts. Torsion Engines exists. |
| 23 | Malians | Tigui currently buffs Gbeto instead of Town Centre arrows. Farimba exists. Verify infantry pierce armour, building wood costs, gold economy and allied University work rate values. |
| 24 | Koreans | Shinkichon/Eupseong effects exist but need current Rocket Cart/naval rework reconciliation. Verify Tower upgrades, wood discounts, mining and team minimum-range effects. |
| 25 | Magyars | **Corvinian Army repaired in this batch**: 35f/45g becomes 80f, with original-price refunds. Recurve Bow exists. Verify full Huszar base/Elite stats/counters, free melee upgrades, scout discounts, hunting and mounted-archer team work rate. |
| 26 | Portuguese | Gold discounts, ship HP, Carrack, Arquebus, Caravel and Feitoria exist. Verify exact discount/armour/ballistics/berry-gold/team research values and Feitoria economy/population balance. Dedicated painted content incomplete. |
| 27 | Burmese | Manipur Cavalry/Howdah, Arambai and Battle Elephants exist. Verify tech ages/costs, elephant armour, infantry scaling, free wood research, monastery discounts and relic visibility. |
| 28 | Vietnamese | Chatras/Paper Money/Rattan exist. Verify regional Elite Imperial Skirmisher/team unlock, starting enemy discovery, economy discounts and ranged HP eligibility. |
| 29 | Bulgarians | Konnik dismount/Krepost/Stirrups/Bagains exist. Verify blacksmith food discount, free Militia progression, Town Centre stone price and exact Bagains armour. |
| 30 | Tatars | Keshik gold, Steppe Lancer, Flaming Camel and both techs exist. Verify food longevity/sheep spawning, free ranged research, elevation damage and mounted-archer/team vision. |
| 31 | Cumans | Both techs and Kipchak exist. Current mercenary allowance is five per allied team across Castles; reconcile per-Castle allowance/Elite entitlement. Verify second Feudal Town Centre, Feudal Siege Workshop, cavalry age speed and team palisades. |
| 32 | Lithuanians | Relic cavalry attack/Hill Forts/Tower Shields exist. Verify cap and eligibility, starting food/current economic bonus, mobility, team monasteries and Winged Hussar stats. |
| 33 | Burgundians | Early economy/Cavalier, Vineyards, Coustillier charge and Flemish conversion exist. Verify discounts, unit charge values, economic tech timing, relic food/team income, dynamic Revolution price and villager restoration path. |
| 34 | Sicilians | Donjon/Serjeant/First Crusade/Hauberk exist. Verify current costs, conversion resistance, bonus-damage reduction, construction speed, farm yield and team transport behaviour. |
| 35 | Poles | Folwark, Obuch armour stripping, Knight discount and light-cavalry trample exist. Verify stone-to-gold, villager healing, Folwark depletion accounting, Winged Hussar values and team counter damage. |
| 36 | Bohemians | Early Chemistry/Hand Cannoneers, mining, Hussite Reforms, Wagon cover and Houfnice exist. Verify free mining timing, current building discounts, Monk/villager effects, gunpowder balance and market/team bonus. |
| 37 | Dravidians | Urumi, Thirisadai, Medical Corps and Wootz Steel exist. Verify charge/trample, economic age bonuses, fishing/carry, ranged cadence, siege/infantry discounts and shared Dock population. |
| 38 | Bengalis | Ratha stance, elephant resistance, Paiks, Mahayana and age-up villagers exist. Verify exact population scope, trade-food, monk armour, mounted counters and conversion resistance. |
| 39 | Gurjaras | Camel Scout, Shrivamsha dodge, Chakram pass-through, livestock Mill, Kshatriyas and Frontier Guards exist. Verify starting livestock/berries, Mill yield, dodge timing, bonus-damage scale and team eligibility. |
| 40 | Romans | Legionary/Centurion aura, Ballistas/Comitatenses, villager and armour effects exist. Verify exact aura/charge/research/armour application and Scorpion/team range/economy; avoid double application. |
| 41 | Armenians | Composite Bowman, Warrior Priest, early infantry, Mule Cart, Church and both techs exist. Cilician Fleet currently lists Galley range; verify missing demolition blast/Dromon scope. Verify Fereters exact armour/HP/healing and all infantry/relic/team bonuses. |
| 42 | Georgians | Monaspa formation, regeneration, Church economy, Mule Cart, Svan Towers/Aznauri and repair/team effects exist. Verify current fortified damage scope, elevation reduction, mounted population, healing and start conditions. |

### Absent civilizations and separate rulesets

At least **13 named medieval-roster gaps** are confirmed by comparing the active roster with the established/DLC families below. These are absent, not “complete because a similar unit exists”. Resolve the legacy Indians/Hindustanis identity without changing stable IDs accidentally. Reconcile the complete current Xbox roster before claiming an exhaustive reference count.

| Existing AUD scope | Missing content | Acceptance |
| --- | --- | --- |
| AUD-022 | Berbers; Malay | Full unique/regional units, two technologies, bonuses, tree, AI, original art, save and host rules |
| AUD-036 | Shu, Wei, Wu, Jurchens, Khitans | Five separate factions, regional units, passive leaders/abilities as applicable, their mechanics and original scenarios |
| AUD-036 | Mapuche, Muisca, Tupi | Three factions, multiple unique units, South American regional mechanics, architecture and original scenarios |
| AUD-036 | Danes, Saxons, Varangians | Three factions, northern regional units/architecture, naval/economy mechanics and original scenarios |
| AUD-038 | Return of Rome ruleset | Entire separate antiquity ruleset: 17 reference civilizations, ages, unit/building/economy/research/AI data and original campaigns; medieval Romans are not this ruleset |
| AUD-039 | Chronicles: Battle for Greece | Separate rules for Achaemenids, Athenians, Spartans; naval/trade/political choices and original scenario equivalents |
| AUD-040 | Chronicles: Alexander the Great | Macedonians, Thracians, Puru; distinct units/armies/choices and original scenario equivalents |

### Units, buildings and shared systems

| AUD scope | State and remaining work | Source owner / completion evidence |
| --- | --- | --- |
| AUD-019/020/023 | PARTIAL: version-pinned complete unit/tech/building trees; new DLC exclusions and age rules; descriptions and full catalogue validation | `js/config.js`, `js/civilizations.js`, `js/kingdom.js`; test every actual order and projected world |
| AUD-024/025/026 | MISSING catalogue entries include Petard, Siege Tower, Ballista Elephant, Slinger, Condottiero, Genitour, Camel Archer, Karambit Warrior, Ghulam, Dromon, Longship, Fire Lancer, Rocket Cart, Mounted Crossbowman and Varangian Guard | Add only against verified current availability; implement movement, counter classes, special action, recruitment, AI, graphics and tests together |
| AUD-024 | VERIFY/EXTEND: Imperial Camel, Imperial Skirmisher, Savar and current regional upgrades; shared names must not substitute for distinct abilities/stats | Validate actual tier effect, type replacement, queued units and living/new units |
| AUD-024/026 | PARTIAL: Trebuchet deployment/packing, siege transport/garrison interaction, armour-class counter completeness, projectile accuracy/secondary-hit rules and full upgrade costs | Combat, building and order owners; real damage and motion tests, no tooltip-only changes |
| AUD-026/035 | MISSING catalogue entries include Caravanserai and Malay Harbour; later DLC buildings/fortifications need a reference inventory | Build prerequisites, placement, construction, repair, demolition, save, network and original art |
| AUD-027 | PARTIAL: existing hunting/livestock/fishing/farming/trade/market systems need full civ exceptions, costs, carrying/drop-off and renewal behaviour | `simulation-resource-routing`, `simulation-logistics`, `kingdom`, `mapgen`; no blanket claim that livestock or farming is missing |
| AUD-028 | PARTIAL: coherent build orders for all 43 plus future civs; intentional unique-tech choice, scouts, monks, siege, naval landings, late economy and retry/recovery | `js/ai*.js`; multi-seed full matches, resource conservation and observable strategy |
| AUD-025/029 | PARTIAL: water connectivity, shore landings, transport unload, naval counters, map sizes/elevation/fog and large-fleet performance | Existing naval/path/map tests plus real complete coastal matches and Xbox controls |
| AUD-029/033 | VERIFY: all intended starting-age/resource/army/victory/map/diplomacy/replay/spectator categories | Enumerate UI-to-simulation paths against the reference rather than assuming menu presence proves a mode |
| AUD-009/030/031/037 | PARTIAL: 19 original missions exist; full current-revision matrix and human/controller playthroughs; deepen escort/delivery, choices, story, tutorial and scenario variety | `js/campaign.js` and campaign tests; real required goals and natural victory, not scripted instant destruction |
| AUD-010/011/012/013 | PARTIAL: controller command coverage, notification/help parity, queue management, remap conflicts, focus recovery and couch readability | Existing controller remap and solo waypoints already exist; multiplayer waypoints explicitly report solo-only |
| AUD-014/015/017/018 | PARTIAL: real two-human preview exists; controller-only invitation entry, authenticated reconnect/resume, host loss, restrictive-NAT behaviour, long-match/WAN acceptance | `multiplayer.js`, `js/network-*`; diagnostic checkpoints are not reconnect snapshots; no paid TURN |
| AUD-016 | OPEN: complete fog/anti-cheat threat model | A browser-authoritative host and shared world are not trusted server anti-cheat; preserve command ownership/visibility validation |
| AUD-032/033 | MISSING/UNVERIFIED: 3–4 human roster, spectator/replay access, quick chat and wider multiplayer settings | Current locked authoritative roster is exactly two humans; test state/identity/sequence/resource bounds before expansion |
| AUD-031/043 | PARTIAL/VERIFY: high-contrast and non-colour team cues, remapping, text readability, hold/toggle behaviour, reduced effects and accessible tutorials | Some options already exist. Test actual screens and input paths rather than listing every accessibility feature as absent |
| AUD-005/021/043/047 | UNVERIFIED: Series S large-battle pacing, graphics-loss recovery, memory soak and controller latency | Physical same-scene 50/100/200-unit profiles; owner black/white-screen and slow-battle reports remain open |
| AUD-041/042/044 | PARTIAL: original art, regional architecture, animation and audio direction | Asset census below; retain painted resources and procedural fallback |
| AUD-001/045/046/048 | OPEN: one accepted release-candidate tree through isolated regressions, seeded AI, all 19 missions, Chromium/HUD and Xbox software contracts; source/security/asset licence review | Deliberate release only; live production SHA/readiness separately reported, billing/quota/rollback remain owner-managed |

### Exact current art gaps

`docs/graphics-inventory.json` reports 50/84 unit definitions with painted bases and multi-frame movement/attack, 22/28 building bases, **0 independently verified directional-art sets**, **0 verified dedicated death-art sets**, and **0 verified faction-architecture entries**. Zero verified does not mean no rendered graphics: procedural sprites, mirrored/transformed frames and regional fallback already work.

**34 unit definitions without painted bases:** Eagle Warrior, Cavalry Archer, Turtle Ship, Organ Gun, Caravel, Arambai, Rattan Archer, Battle Elephant, Konnik, Dismounted Konnik, Keshik, Kipchak, Steppe Lancer, Flaming Camel, Leitis, Coustillier, Flemish Militia, Serjeant, Obuch, Winged Hussar, Hussite Wagon, Houfnice, Urumi Swordsman, Thirisadai, Ratha (Ranged), Ratha (Melee), Chakram Thrower, Shrivamsha Rider, Camel Scout, Centurion, Legionary, Composite Bowman, Warrior Priest, Monaspa.

**6 buildings without painted bases:** Feitoria, Krepost, Donjon, Folwark, Fortified Church, Mule Cart.

- [ ] Distinct original base/Elite appearances and independent facings; idle/walk/attack/work/death/boarding as applicable.
- [ ] Faction/age architecture, readable construction/damage/destruction states and appropriate biomes.
- [ ] Unit selection silhouettes, team markings, effects, audio cues and original music consistency.
- [ ] Cold/warm/offline atlas integrity and pixel-budget checks after additions; preserve painted stone, gold and berries.
- [ ] Human and physical Series S visual/performance acceptance before the final graphics overhaul is called complete.

### Execution sequence and completed increments

1. Repair named unique-tech placeholders and research/price/HP integration in existing civilizations. Prefer real player-visible batches over catalogue-only additions.
2. Finish each faction's start/economic/military/team rules and the shared unit/building/technology foundations they need. Update its row with precise evidence; do not mark the whole faction complete prematurely.
3. Add absent factions and regional units in coherent tested groups, preserving active IDs and a full current-build save/host path.
4. Finish AI, naval, original campaigns, multiplayer and controller systems using those rules. Continue performance verification throughout.
5. Complete original art/audio and full human/device/release acceptance. Separate ancient rulepacks have their own content and tests.

- [x] Marauders Stable unlock and saved-world queue validation — `7a7a3cb`, five quick gates and 1,641 focused tests.
- [x] Corvinian Army food-for-gold effect, actual payments/refunds and projected costs — this batch; detailed evidence in the commit-bound journal.
- [x] Sipahi +20 HP for living/future Turkish Cavalry Archers, no gunpowder attack placeholder — this batch.
- [x] Detinets stone-for-wood construction/repair prices across actual host building and projected trees — this batch.
- [x] Chivalry Stable training/research speed and Yeomen range/Tower attack — this batch.
- [x] Nomads retained housing, completion/ownership checks and saved-ledger validation — following batch.
- [ ] Next: Tigui, Hulche Javelins, the current Frankish regional line and remaining legacy unique technologies; then legacy faction effects above, with version reconciliation before obsolete technologies are repaired.

### References and limits

Reference lookup date: **14 November 2026**. Official patch/expansion sources are the reference game's requirements, not evidence that Crown & Kingdoms implements them. Use original assets and scenarios. Version-specific balance changes still require a pinned data comparison before a whole civilization can be signed off.

- [Official update 185872 / 2026 reworks](https://www.ageofempires.com/news/age-of-empires-ii-definitive-edition-update-185872/).
- [Official Corvinian Army change, build 95810 preview](https://www.ageofempires.com/news/preview-age-of-empires-ii-definitive-edition-update-95810/) and [current reference cross-check](https://ageofempires.fandom.com/wiki/Magyars).
- [Official Sipahi introduction/effect](https://www.forgottenempires.net/age-of-empires-2-hd/changelog) and [current duration/cost cross-check](https://ageofempires.fandom.com/wiki/Sipahi_(Age_of_Empires_II)).
- [Official Xbox Yeomen effect](https://www.ageofempires.com/learn-to-play/civilizations-game-modes-xbox/) and [Chivalry current age/cost/duration cross-check](https://ageofempires.fandom.com/wiki/Chivalry_(Age_of_Empires_II)).
- [Official Detinets introduction, build 61321](https://www.ageofempires.com/news/age-of-empires-ii-definitive-edition-update-61321/).
- [Three Kingdoms official release](https://www.ageofempires.com/news/new-dlc-available-now-the-three-kingdoms/), [Last Chieftains official FAQ](https://www.ageofempires.com/news/faq-the-last-chieftains/), [Viking Sagas official FAQ](https://www.ageofempires.com/news/faq-the-viking-sagas/).
- [Return of Rome official scope](https://www.ageofempires.com/games/aoeiide/return-of-rome/), [Battle for Greece release](https://www.ageofempires.com/news/new-dlc-available-now-chronicles-battle-for-greece/), [Alexander the Great official scope](https://www.ageofempires.com/games/aoeiide/chronicles-alexander-the-great/).

Nomads reference: [developer balance changelog](https://www.forgottenempires.net/age-of-empires-ii-definitive-edition/balance-changelog) confirms destroyed foundations must not grant capacity; [current cost/effect listing](https://liquipedia.net/ageofempires/Nomads), checked 14 November 2026.
