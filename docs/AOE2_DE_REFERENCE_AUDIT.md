## Spanish Blacksmith civilization cost exemption — 25 October 2026

**Authority:** [Forgotten Empires official Spanish civilization card](https://www.forgottenempires.net/age-of-empires-ii-definitive-edition/civilizations/spanish), which explicitly states **Blacksmith upgrades do not cost gold**. Applies to the 26-civ roster of this game's AoE2:DE build-185872 parity efforts.

The game now calculates a research-specific **effective price** through `researchCost(b,k,civs)`. Spanish-owned Blacksmith research has its gold component set to zero while retaining exactly the base wood/food/stone components and normal research time, age, prerequisite and restrictions. Non-Spanish prices are unchanged. Gold cost from research in any other building (e.g. Bloodlines at the Stable, Ballistics at the University) remains fully payable. This does **not** mutate the global technology catalogue `TE` and therefore cannot leak Spanish discounts to another team, AI, replay or command host.

**One-source-of-truth implementation:** gamepad research menu `js/input.js`, multiplayer offered commands/prices `js/network-commands.js`, autonomous `js/ai.js` resource eligibility and save-for-age logic, and actual `js/simulation.js` research payment all use the same effective price. In-progress paid orders, completed research, game saves and all unchanged unit and network IDs continue to work. Rejected purchases do not spend food or gold. Seven independent tests verify all 26 civs across every Blacksmith key, UI/AI source integration, menu prices per team, actual gold-free research timers, other-building exclusions, host authority and save reload.

**Scope deliberately limited:** Spanish other civilization bonuses (builders, gunpowder, trade, potential technology-completion income) are not implemented here. The official primary-source card grounds this change in **no gold cost**, not a blanket discount or unverified rebate. Other civ-specific research discounts and automatic free upgrades, regional armour class exceptions, Xbox hardware checks and Vercel production parity remain outstanding. Previous Vercel HTTP 402 daily build quota must be checked independently before calling any new code live.

---
## Real Forging → Iron Casting → Blast Furnace melee tiers — 25 October 2026

**Pinned source**: AoE2:DE build **185872**, [SiegeEngineers/aoe2techtree data/data.json (blob c4f7da9)](https://github.com/SiegeEngineers/aoe2techtree/blob/c4f7da961e82a8231b1ba49459949c4d6e479bc8/data/data.json); [AoE2 Forging](https://liquipedia.net/ageofempires/Forging), [Iron Casting](https://liquipedia.net/ageofempires/Iron_Casting), and [Blast Furnace](https://www.aoe2insights.com/civilization/britons/tech-tree/).

| New game tech | Source ID | Age | Prerequisite | Cost | Time | Added melee attack |
| --- | --- | --- | --- | --- | --- | --- |
| `forging` | 67 | Feudal | none | 150 food | 50s | +1 |
| `ironCasting` | 68 | Castle | Forging | 220 food, 120 gold | 75s | +1 |
| `blastFurnace` | 75 | Imperial | Iron Casting | 275 food, 225 gold | 100s | **+2** |

Together these confer **+4 melee attack**, not +3; the new `meleeResearchAttackBonus()` feeds the existing live combat `dmgT` resolver and does not buff standard ranged attacks. The 26-civilization `CIV_MELEE_RESEARCH` masks gate all three actual technologies using the shared `rsOf` production and multiplayer/AI authorisation path. **Byzantines, Malians and Koreans lack Blast Furnace**, and all original 26 have Forging and Iron Casting. The game key `Indians` still maps to source Hindustanis. The new AI scores military melee research against its actual army mix. Ordinary source-era civilization bonuses (e.g. Magyars' free upgrades, Spanish Iron Casting gold-cost reduction, Chinese Blacksmith discounts, Inca villager attack exceptions) still need separate work.

**Pre-release save policy (user-approved):** This game is still being tested by its only player. Backward compatibility with older test saves is **not required** until completion. The previous combined `atkM` (+2) and `atkM2` (+5) technologies and all their save-migration code have been removed. Fresh games use only the three source-backed tiers, while saves made with **this** tech model can save/load normally. No old-version save conversion is attempted. The new attack progression is independent of melee/pierce armour defense; infantry, ranged and cavalry armour tiers and all artwork/network entity IDs remain unchanged.

**Tests:** pinned 26×3 matrix, real combat +1/+1/+2 vs ranged isolation, exact costs/ages/prerequisites/timers, absent obsolete tech keys, authenticated host rejection and current-version save round-trip. No pre-release migration promises are made. Unit-specific attack bonuses, civ economic discounts and real Xbox hardware tests remain open.

**Release gate:** All PR and post-merge main standalone regressions, 19 campaigns, three seeded AI matches, Chromium and game validation must pass before merge/deployment claims. Vercel production must independently be READY on latest `main` SHA; previous HTTP 402 quota is tracked separately.


---
## Cavalry Barding research tiers — 25 October 2026

**Pinned reference:** AoE II: Definitive Edition update/build 185872, [SiegeEngineers `data/data.json` blob `c4f7da9`](https://github.com/SiegeEngineers/aoe2techtree/blob/c4f7da961e82a8231b1ba49459949c4d6e479bc8/data/data.json), and [the Blacksmith descriptions in AoE2 Companion](https://app.aoe2companion.com/explore/technologies?section=Blacksmith). The game's historical `Indians` civ key corresponds to source **Hindustanis**.

The old `armC` research is retained intact as a persistent flag for saved games, but is now named **Scale Barding Armor**. The genuine 3-tier Blacksmith cavalry armour progression is:

| Game flag | DE technology | Source ID | Available | Prerequisite | Resources | Time | Bonus (melee / pierce) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `armC` | Scale Barding Armor | 81 | Feudal | — | 150 food | 45 seconds | +1 / +1 |
| `armC2` | Chain Barding Armor | 82 | Castle | Scale Barding | 250 food, 150 gold | 60 seconds | +1 / +1 |
| `armC3` | Plate Barding Armor | 80 | Imperial | Chain Barding | 350 food, 200 gold | 75 seconds | +1 / **+2** |

Production combat `dmgT` sums the three flags by incoming attack class, with the Imperial tier specifically adding **two pierce armour**. This protects eligible `CAVARM` roster units already on the map and those recruited later, without rewriting saved units, network IDs or replacing original artwork. The existing first-tier cavalry barding sprite indicator remains. Generic infantry, archers and buildings do not gain the cavalry-only upgrade.

**Civilizations:** The pinned source matrix covers all 26 original C&K civ keys. Aztecs, Mayans and Incas have **none** of the three cavalry armour technologies. All other 23 have Scale and Chain. **Mongols, Celts, Vikings, Japanese, Goths, Ethiopians and Koreans** additionally lack Plate. The other **16** have all three. The shared `rsOf` catalogue filters gamepad/player menus, AI choices, multiplayer authorized host research commands and actual resource payment before queuing. A fully paid research queue from an old save remains valid even if its civilization is now restricted; newer attempted purchases follow the tree. Full 26-civ purchase/denial, proper age and prerequisites, physical/pierce damage, team isolation, authenticated host and saved paid research receive automated tests.

**Known limitations:** Unique mounted unit armour class assignments remain the game's simplified class masks (including some camel and mounted-ranged overlap), individual civilization discounts/free tech and speed bonuses are not fully modelled, and melee attack remains the game's compressed two-step `atkM` / `atkM2` system. Neither Xbox console controls nor Vercel production is asserted from this source change. Previous production deployment requests hit Vercel's 100-per-day API limit; production must be verified independently at the exact SHA before calling it live.

---
## Ranged armour three-tier Blacksmith progression — 25 October 2026

**Source pin:** Age of Empires II: Definitive Edition build **185872**, [SiegeEngineers technology dataset blob c4f7da9](https://github.com/SiegeEngineers/aoe2techtree/blob/c4f7da961e82a8231b1ba49459949c4d6e479bc8/data/data.json), and [Ring Archer Armor rules](https://liquipedia.net/ageofempires/Ring_Archer_Armor). Historical `Indians` faction maps to modern **Hindustanis**.

The previously existing `armR` (Padded Archer Armor, ID 211) remains compatible with all existing game saves. The production Blacksmith now offers actual successive Castle / Imperial ranged armour tiers:

| C&K key | Technology | Minimum age | Prerequisite | Price | Duration | Additional effect |
| --- | --- | --- | --- | --- | --- | --- |
| `armR` | Padded Archer Armor (211) | Feudal | None | 100 food | 40 sec | +1 melee, +1 pierce armour |
| `armR2` | Leather Archer Armor (212) | Castle | Padded Archer | 150 food, 150 gold | 55 sec | +1 melee, +1 pierce armour |
| `armR3` | Ring Archer Armor (219) | Imperial | Leather Archer | 250 food, 250 gold | 70 sec | +1 melee, **+2 pierce** armour |

The `dmgT` combat resolver sums these research flags **by the incoming attack class**, adding exactly +1/+1, +1/+1, and +1/+2 ranged-unit protection in sequence. This affects live and newly recruited `ARCHARM` roster units without changing unit IDs or save format, and does not add ranged armour to ordinary infantry, cavalry or buildings. The existing `armR` sprite indicator remains intact. `rsOf`, player controller, AI and host multiplayer use the same research gate, payment and technology ledger. Previously queued and completed research remains loadable even when current tech trees restrict new orders.

**Civ-tree matrix:** 26 represented civilizations all offer Leather Archer Armor; **Franks, Mongols, Huns and Aztecs** do **not** offer Ring Archer Armor. The others, including `Indians`→Hindustanis, can research Ring if in Imperial Age with Leather already researched. Source-pinned matrix tests verify 26×3 options, technology chains, cost/duration, real melee and pierce damage, unrelated-unit safety, independent team finances, host authorization and legacy saved queues.

**Still open:** Authentic three-tier cavalry barding and melee attack techs; civilization bonuses (including free/discounted Korean Blacksmith upgrades), detailed regional unit armour class exceptions, Xbox Series X hardware verification and complete network battle recovery. Padded's existing name has been clarified; no art asset is replaced and no undocumented retroactive research migration occurs. Vercel deploy quota blocking from Batch 51 is tracked separately; this branch is **not** automatically claimed deployed.

---
## Infantry armour three-tier Blacksmith progression — 25 October 2026

**Sources:** Age of Empires II: Definitive Edition build **185872** represented by [SiegeEngineers pinned tech-tree data](https://github.com/SiegeEngineers/aoe2techtree/blob/c4f7da961e82a8231b1ba49459949c4d6e479bc8/data/data.json); [AoE2 Companion tech descriptions](https://app.aoe2companion.com/explore/technologies?section=Blacksmith), including Plate Mail's +1 melee and +2 pierce effect. Historical `Indians` game key maps to source `Hindustanis`. Existing art/sprites, unit identities and old saves remain intact.

The existing `armI` represents **Scale Mail Armor** (source tech ID 74) and still confers +1 melee / +1 pierce armour on existing infantry. Two separately researched Blacksmith tiers have been added:

| Game research | Actual tech | Minimum age | Prerequisite | Price | Research duration | Additional protection |
| --- | --- | --- | --- | --- | --- | --- |
| `armI` | Scale Mail Armor (74) | Feudal | — | 100 food | 40s | +1 melee / +1 pierce |
| `armI2` | Chain Mail Armor (76) | Castle | Scale Mail | 200 food, 100 gold | 55s | +1 melee / +1 pierce |
| `armI3` | Plate Mail Armor (77) | Imperial | Chain Mail | 300 food, 150 gold | 70s | +1 melee / **+2 pierce** |

The three additive armour contributions apply in the real `dmgT` collision/damage resolver and take effect immediately for all eligible infantry owned by the researching team, both already present and later trained. They do **not** buff archers, cavalry, buildings or other types. The research/AI menus and authoritative multiplayer path share `rsOf`. No retroactive unit rewrite or new saved-unit schema is required: technology ledger flags identify the researched tiers. Completed flags and paid research already pending in old saves are preserved (even if a now-disallowed civilization has a pending Plate order).

All 26 represented civilizations have Chain Mail in the cited snapshot. **Khmer, Hindustanis, Huns, Goths, and Magyars lack Plate Mail**; the `CIV_INFANTRY_ARMOR_RESEARCH` matrix denies them a newly requested Imperial tier without charging resources. Full 26×2 source access and 26×3 research menus are tested, alongside actual melee/pierce damage differences, age/tech prerequisites, costs, timers, authoritative network rejection, AI priorities and save roundtrips.

**Remaining parity gaps:** ranged and cavalry armour lines still combine three AoE2 reference tiers into a single `armR` or `armC` flag; the melee attack line likewise remains compressed. Civilizational discounts/bonus armour classes (including Inca villager special cases), unit-specific armor class assignments, regional unit substitutions, actual Xbox device testing and broad multiplayer recovery remain separate work. This is genuine complete tier research for the generic **infantry-armour line only**, not full Blacksmith fidelity.

---
## Blacksmith technology availability and first armour-tier correction — 25 October 2026

**Reference:** [Official AoE2:DE 22 September 2026 update 185872](https://www.ageofempires.com/news/age-of-empires-ii-definitive-edition-update-185872/) and [SiegeEngineers snapshot, pinned blob `c4f7da9`](https://github.com/SiegeEngineers/aoe2techtree/blob/c4f7da961e82a8231b1ba49459949c4d6e479bc8/data/data.json). Historical `Indians` key uses the source **Hindustanis** base tree.

The `CIV_BLACKSMITH_RESEARCH` mask in `engine.js` covers **26 civilizations × five existing tech keys**, keyed against Forging (source ID 67), Blast Furnace (75), Scale Mail Armor (74), Padded Archer Armor (211), and Scale Barding Armor (81). All 26 have Forging, Scale Mail and Padded Archer Armor. Byzantines, Malians, and Koreans cannot access Blast Furnace; thus the game's existing combined end-tier melee research `atkM2` is disallowed for those factions. Aztecs, Mayans, and Incas cannot access Scale Barding; thus the game's first-tier cavalry armour `armC` is disallowed for those factions. Existing `atkR2` (Bracer) remains gated independently by the already-shipped `CIV_FIELD_RESEARCH` matrix. Unknown/mismatched team tech is never charged.

**Source first-tier technology values** (without inventing gold expenditure):

| Existing C&K technology key | DE reference tech | Corrected cost | Duration | Available age |
| --- | --- | --- | --- | --- |
| `armI` | Scale Mail Armor (74) | 100 food | 40s | Feudal |
| `armR` | Padded Archer Armor (211) | 100 food | 40s | Feudal |
| `armC` | Scale Barding Armor (81) | 150 food | 45s | Feudal |

**Scope boundary, explicitly important:** The game still has **one** armour tier per class and an amalgamated `atkM` melee tech and `atkM2` final tech; this change does **not** add Iron Casting (68), Chain/Plate Mail (76/77), Leather/Ring Archer Armour (212/219), Chain/Plate Barding (82/80) or their full prerequisites, additive effects and per-civilization exceptions. In particular, the existing `atkM2` numeric bonus and cost are not the independent AoE2 Blast Furnace effect. Only eligibility for the game's already-existing final composite tier is matched to the source's top-tier availability. No claim of complete Blacksmith numerical or tier fidelity is made. Existing paid research queues and finished flags remain loadable and retain their historic effects. The original art and network/save IDs remain untouched. On-console Xbox validation is still open.

**Runtime acceptance:** source-pinned matrix checks 130 eligibility decisions, checks authorized multiplayer command rejection, actual resource charge/no-charge, first armour costs and completion times, independent team arrays, and old-save paid-research recovery. Full PR and post-merge workflow gates required.

---

## Civilization-specific University research and researched-value corrections — 25 October 2026

**Verified source:** [Age of Empires II: DE official update 185872 (22 September 2026)](https://www.ageofempires.com/news/age-of-empires-ii-definitive-edition-update-185872/) and [SiegeEngineers tech-tree data, pinned blob c4f7da9](https://github.com/SiegeEngineers/aoe2techtree/blob/c4f7da961e82a8231b1ba49459949c4d6e479bc8/data/data.json). Game's legacy `Indians` label maps to the Hindustanis *base* tree.

Eight implemented University research entries have source Tech IDs: **Masonry 50, Arrowslits 608, Guard Tower 140, Keep 63, Fortified Wall 194, Chemistry 47, Ballistics 93, Murder Holes 322**. The `CIV_UNIVERSITY_RESEARCH` flag matrix in `engine.js` represents all **26 civilizations × 8 researched-access decisions**. Examples: Huns/Goths lack Guard Tower, Keep, Arrowslits and Fortified Wall; Byzantines and Aztecs lack Masonry; Franks lack Keep; Chemistry, Ballistics and Murder Holes remain available to all 26. The shared `rsOf` catalogue controls existing solo/controller, AI and authenticated multiplayer entries and the actual paid `research()` operation. Saved previously-paid unfinished research is preserved for historical compatibility; newly forbidden attempts spend nothing.

Reference-aligned values in `js/config.js`, in food/wood/gold/stone units and seconds:

| Technology | Cost | Time | Minimum age | Prerequisite |
| --- | --- | --- | --- | --- |
| Masonry | 150 food, 175 wood | 50s | Castle | — |
| Arrowslits | 250 food, 250 wood | 25s | Imperial | — |
| Guard Tower | 100 food, 250 wood | 30s | Castle | — |
| Keep | 500 food, 350 wood | 75s | Imperial | Guard Tower |
| Fortified Wall | 200 food, 100 wood | 50s | Castle | — |
| Chemistry | 300 food, 200 gold | 100s | Imperial | — |
| Ballistics | 300 wood, 175 gold | 60s | Castle | — |
| Murder Holes | 200 food, 100 stone | 35s | Castle | — |

**Corrected false prerequisites:** Guard Tower no longer requires Arrowslits (which is itself Imperial-only). Fortified Wall no longer requires Masonry. Keep retains Guard Tower as its prerequisite. These apply to newly requested research only, not completed flags in older saves.

**Deliberate exclusions:** Existing legacy Treadmill Crane (`crane`) remains available until its patch-specific per-civilization data can be verified independently; the source snapshot does not include a clear `data.Tech` record to build a safe eligibility matrix. Do not claim all University effects are DE-accurate: tower damage/upgrade representation, Siege Engineers building location, special stone defenses, town-specific tech pricing/discounts and missing units require dedicated runtime parity work. Research permission alone is not a fidelity claim. Physical Xbox Series X validation remains outstanding.
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

## Scout Cavalry, Knight and Skirmisher parity batch — 24 October 2026

**Reference baseline:** AoE2: Definitive Edition generic units without civilization-specific bonuses. Sources: [Scout Cavalry](https://ageofempires.fandom.com/wiki/Scout_Cavalry_(Age_of_Empires_II)), [Light Cavalry](https://ageofempires.fandom.com/wiki/Light_Cavalry_(Age_of_Empires_II)), [Knight](https://ageofempires.fandom.com/wiki/Knight_(Age_of_Empires_II)), [Cavalier](https://ageofempires.fandom.com/wiki/Cavalier), [Skirmisher](https://ageofempires.fandom.com/wiki/Skirmisher_(Age_of_Empires_II)), [Elite Skirmisher](https://ageofempires.fandom.com/wiki/Elite_Skirmisher_(Age_of_Empires_II)), and [upgrade table](https://ageofempires.fandom.com/wiki/Upgrade_(Age_of_Empires_II)). Patch-specific civ bonuses and unusual armor classes still require individual audit.

| Component | Old game values | Corrected baseline |
| --- | --- | --- |
| Scout Cavalry | 45 HP, speed 2.6, 4 damage, reload 1.6s, 9s training and bonus damage vs Archers/villagers | **45 HP, speed 1.55, 3 Dark-Age / 5 Feudal-Age attack, reload 2s, 30s train, +6 vs Monks**, no invented Archer/villager bonus |
| Light Cavalry | Scout +25 HP / +3 attack; upgrade 35s | **Scout +15 HP / +2 attack** (60 HP / 7 attack), speed **1.5**, +10 vs Monks, upgrade **150 food / 50 gold / 45s** |
| Knight | 100 HP, speed 2.1, attack 12, 14s train, invented bonuses vs Archer, villager and siege | **100 HP, speed 1.35, attack 10, 30s train, 2 melee / 2 pierce armor**, no invented class bonuses |
| Cavalier | +30 HP / +4 attack, upgrade 300 food / 200 gold / 45s | **+20 HP / +2 attack** (120 HP / 12 attack), upgrade **300 food / 300 gold / 80s** |
| Skirmisher | Speed 1.5, 3 attack, range 5, 1.6s reload, 9s train, +6 vs Archers | **Speed 0.96, 2 attack, range 4 (min. 1), 3s reload, 26s train**, +3 vs Archer and Spearman, +2 vs Mameluke; **3 pierce armor** |
| Elite Skirmisher | +10 HP / +2 attack, 35s upgrade costing food and wood | **+5 HP / +1 attack** (35 HP / 3 attack), **+1 range**, **+1 pierce armor** (4 total), **22s unit training**, **230 wood / 130 gold / 50s** research, +4 vs Archer/Spearman; +2 vs selected Cavalry Archer-line units |

**Implementation:** base training stats and line research values are in `js/config.js`. Age-dependent Scout attack, Light Cavalry speed, skirmisher counter/armor/range, and post-Elite production queue durations are applied to the live `js/simulation.js` combat, movement, and queue paths. The unit-key format (`scout`, `knight`, `skirm`) and paint atlases are deliberately unchanged, preserving existing save files, network IDs, team coloring and sprites. Regression tests verify live damage rather than simply asserting config values.

**Remaining audit discrepancies:** Skirmisher armor classes are partially modelled via explicit sets; cavalry archers/regional gunpowder equivalents and special unit armor rules need a full patch-version class matrix. Archer accuracy, missed arrows/secondary projectile collisions, anti-Monk conversion resistance, elevation/line-of-sight, exact attack animations, civilization-specific Scout bonuses and multiplayer hardware controller behavior are **not** established as DE-exact. Scout's Dark→Feudal damage increase is handled through the current research-age state; unusual civilization replacements and Dark-Age starting scout formation still need a separate review. Do not describe this as all-47-unit parity.

## Archer → Crossbowman → Arbalester parity slice — 24 October 2026

**Current-reference precedence:** the [official Age of Empires update preview 125283](https://www.ageofempires.com/news/age-of-empires-ii-definitive-edition-update-preview-125283/) explicitly reduced Crossbowman upgrade cost from 175 food/125 gold to **175 food/100 gold** and Arbalester from 450 food/400 gold to **450 food/350 gold**. These override old AoK/older fan databases. The [AoE2:DE Wiki upgrade table](https://ageofempires.fandom.com/wiki/Upgrade_(Age_of_Empires_II)), [Archer](https://ageofempires.fandom.com/wiki/Archer_(Age_of_Empires_II)), [Crossbowman](https://ageofempires.fandom.com/wiki/Crossbowman_(Age_of_Empires_II)) and [Arbalester](https://ageofempires.fandom.com/wiki/Arbalester) detail the line. General attack/reload/range information verified against the DE wiki. Patch 185872 remains the tracked target; future balance patches must be checked.

| Tier / research | Prior Crown & Kingdoms | Reference implementation in this PR |
| --- | --- | --- |
| Archer (Feudal) | 30 HP / 4 pierce / range 4 / 35s; separate direct Crossbow training also visible without upgrade | **30 HP / 4 pierce / range 4 / 35s**, 25 wood/45 gold. Archery Range offers Archer until Crossbowman research is complete |
| Crossbowman (Castle) | Standalone 35 HP / **9 attack** / range **5.5** / speed **1.4** / **12s training**, cost **45 wood + 45 gold**; no prior Archer tech | **35 HP / 5 attack / range 5 / speed .96 / 2s reload / 27s training**, 25 wood + 45 gold, +3 vs Spearmen; unlocked by research, existing fielded and queued Archers become Crossbowmen |
| Crossbowman upgrade | Missing | **175 food + 100 gold**, 35s, Castle Age, Archery Range; one research, shared across the owner's Range buildings |
| Arbalester (Imperial) | Existing Arbalester upgrade gave **+12 HP/+3 attack** and cost **250 food/150 gold**, 45s, with no prerequisite | Research **450 food + 350 gold**, **50s**, Imperial Age, requires Crossbowman; Crossbow line becomes **40 HP/6 attack** (retains range 5), +3 vs Spearmen |
| Fletching/Bodkin/Bracer | Existing Blacksmith chain affects arrow attack/range | Retained and verified at +1/+2/+3 cumulative damage/range, applying to promoted Crossbowman/Arbalester in real combat |
| Castle production | Legacy Castle roster includes Crossbowman | `trOf` hides independent Castle Crossbow recruitment. Castle's other legacy trainables are tracked for the separate building parity audit |

**Save/asset compatibility:** Runtime `U.xbow` remains the existing keyed model so the hand-painted Crossbowman sheet, existing mission scripted spawns, and older save/network entity IDs are preserved. On finishing Crossbowman research, **only that kingdom's** living `arc` instances mutate **in place** to `xbow` (same `netId`, selected objects, orders and targets); remaining hit points increase by the change in effective max HP, preserving prior damage, including civilization HP bonuses. Production queues in other Ranges change their `arc` items to `xbow` and cap remaining work at the shorter 27-second training duration. Direct selection/recruitment follows `trOf` in controller, UI, network validation and AI; unsupported direct `xbow` training is rejected prior to upgrade. Upgrading Arbalester keeps `xbow` key and existing unit render assets, with tech-led +5 HP/+1 attack.

**Important open differences:** exact 80%/85%/90% accuracy, missed arrows and stray projectile damage, 0.35s attack-frame delay, projectile speed 7, full sight calculations (Archer 6 / Crossbow and Arbalester 7), Thumb Ring firing speed/accuracy, Briton and other civ exceptions, unavailable Crossbow/Arbalester upgrade for some civilizations, and complete Castle/Archery Range production restrictions. These require their own source-based tests and Xbox controller/hardware acceptance. Passing this PR does *not* certify all AoE2 mechanics.

## Thumb Ring and deterministic ranged-accuracy parity — 24 October 2026

**Source version and interpretation:** [Thumb Ring — AoE2 Wiki](https://ageofempires.fandom.com/wiki/Thumb_Ring), [Archer-unit accuracy table](https://ageofempires.fandom.com/wiki/Archer_unit_(Age_of_Empires_II)), [AoE2 Tech Tree](https://aoe2techtree.net/), and [official published patch notes](https://www.ageofempires.com/news/age-of-empires-ii-definitive-edition-update-185872/). The standard Thumb Ring upgrade is researched at the Archery Range in Castle Age for **300 food / 250 wood / 45 seconds**. It makes covered archers **100% nominally accurate at stationary targets**; Ballistics is separate and movement after firing can still dodge an accurately aimed arrow. Reload is reduced by **15%** for foot Archers; by **10%** for the implemented mounted Archer group, **20%** for Chu Ko Nu, and **0%** for Skirmishers, whose rate correction cancels Thumb Ring's generic bonus. (This follows the wiki's listed exceptions and must be reevaluated for regional archers as their data is audited.)

| Unit or mechanic | Previously | Implemented and tested |
| --- | --- | --- |
| Archer | 100%-accurate direct arrow at fixed aim, no miss chance | **80%** aimed accuracy before Thumb Ring, **100%** afterward; reload **2.0s → 1.7s** |
| Crossbowman | Fixed aim without random inaccuracy | **85%** before Thumb Ring, **100%** afterward; reload **2.0s → 1.7s** |
| Arbalester | Crossbow accuracy persisted | **90%** after Arbalester research, **100%** if Thumb Ring researched |
| Skirmisher | 100%-accurate javelin | **90%** before Thumb Ring, **100%** afterward; reload stays **3.0s** |
| Mounted special archers (Mangudai/War Wagon) | Thumb Ring unavailable | Thumb Ring reduces reload to **90%** where researched; full baseline accuracy/unique armor class remain unverified |
| Chu Ko Nu | No Thumb Ring rate effect | Reload uses **80%** of its current defined baseline where researched (not a claim that its burst projectile model is fully authentic) |
| Ballistics | Fixed-aim interception with constant-velocity prediction | Preserved. Thumb Ring alone does **not** lead moving targets or cause arrows to track them |

**Implementation architecture:** `TE.thumb` is a real range research entry and `S.tech[t].thumb` is the owner-specific flag. `U.arc.acc=.8`, `U.xbow.acc=.85`, `U.skirm.acc=.9`; the Arbalester rank overrides Crossbow accuracy to .9. For a hit/miss roll, `launchProjectile()` samples the **same persisted, seeded `S.r` RNG used in gameplay**. Inaccurate arrows are launched toward a stable, bounded lateral deviation from the chosen aim point. An arrow never homes into the original target afterward. Shots against buildings, siege and unsupported weapon families retain existing behavior and **do not consume extra accuracy rolls**. AI may research Thumb Ring once enough ranged units are in its army. Tests validate actual research, shooting, hit/miss/armor, per-owner research, cooldown, and save/load RNG trajectory persistence. The authenticated multiplayer regression and seeded AI skirmishes remain release gates.

**Open for later fidelity batches (do not mark exact):** exact DE probability distribution for missed projectiles, short-range glancing hits and stray arrows striking *other* units; 0.35-second foot-archer animation/windup delay; true projectile speed versus the game's current 14 tiles/sec; unique-unit accuracy baselines and burst-arrow behavior; elevation, armor-class table, LOS/cover and fog; full Thumb Ring civilization tech-tree availability (e.g. Britons), civ-specific reload adjustments and special tech modifiers. The 100% accuracy designation means *nominal target accuracy*, not guaranteed hits against moving units or environmental obstruction. Xbox Series X controller acceptance remains pending.

## Archer release timing and projectile travel — 24 October 2026

**Reference:** DE [Archer](https://ageofempires.fandom.com/wiki/Archer_(Age_of_Empires_II)), [Crossbowman](https://ageofempires.fandom.com/wiki/Crossbowman_(Age_of_Empires_II)), [Arbalester](https://ageofempires.fandom.com/wiki/Arbalester), and [Attack Delay overview](https://ageofempires.fandom.com/wiki/Attack_delay). The current Archer line uses **0.35-second attack delay** between beginning the attack animation and releasing its arrow, and arrow travel speed **7 game tiles/sec**. Note the historical standalone Archer **0.525s HD** reference: do not silently substitute legacy patch/edition numbers. Reference values are scoped to the Archer→Crossbowman→Arbalester line, not the entire game's ranged unit roster.

| Mechanic | Previously | Implemented in this correction |
| --- | --- | --- |
| Archer-line shot release | Instantly launched on the first ready attack tick | Pending **0.35s** windup before launching the projectile; releases only while the target is still alive/in range and the Archer retains its attack order |
| Firing interval | Existing 2.0s base, 1.7s with Thumb Ring | Existing interval preserved by subtracting the elapsed 0.35s windup from the *post-release* cooldown. Avoid double-counting delay and artificially lowering Archer DPS |
| Archer-line projectile speed | 14 tiles/sec; Ballistics intercept assumed fixed 14 | **7 tiles/sec**, including Ballistics interception equation and actual projectile movement |
| Other weapon projectiles | 14 tiles/sec | **Unchanged** until separate unit-by-unit source audit |
| Pending shot save/load | None | `wind` elapsed-second countdown and `windTarget` immutable network unit/building ID serialized in existing save units; validated, restored without re-firing or converting the target reference |
| Multiplayer synchronization | Unit cooldown and existing projectile aim in checkpoint | Include `wind` countdown and `windTarget` in deterministic world checkpoint to detect a desynchronized bow-release phase |
| Orders & range | An archer could fire immediately on an issued order | Winding is cancelled on stop/move, changed target, or leaving range. Old saves without wind fields preserve preexisting orders and begin the new animation on their next ready attack |

**Tests:** `tests/aoe2-de-archer-windup-projectile.test.mjs` covers exact line configuration, real `upU()` first-shot release, reload pacing, target/order/range cancellation, 7-speed flight and actual damage, Ballistics lead, save/load restoration and checkpoint-hash sensitivity. Existing Thumb Ring and Ballistics tests also assert the necessary wait for Archer attack animation before any projectile exists. All long skirmish and multiplayer workflows must pass before a merge.

**Remaining differences:** attack animation frame quantization in AoE2 is roughly aligned to the simulation tick but may vary by patch/controller; region-specific delay values for Skirmisher, mounted archers, siege and ships need dedicated audits. Realistic terrain elevation, special projectiles and missed shots striking collateral units are still open. This is not Xbox hardware-certified fidelity.

## Civilization-specific Archer research — 24 October 2026

**Source-checked:** [Siege Engineers AoE2 Tech Tree](https://github.com/SiegeEngineers/aoe2techtree/blob/3bb43b1439eef88dfe7fe892d7f7dc41ac9dd76f/data/data.json) (data release committed **22 September 2026**). Crossbowman is source Unit ID **24**; Arbalester Unit ID **492**; Thumb Ring technology ID **437**. This is an in-game availability matrix derived from the DE tech-tree source, not a generic assertion that all combat/gameplay is edition-exact. Our `Indians` faction is historical, and maps to the source's **Hindustanis** tech tree for these three research decisions pending a broader naming/roster modernization.

**Before:** all 26 Crown & Kingdoms civilizations could research Crossbowman, Arbalester and Thumb Ring at the Archery Range, including unsupported tiers. **After:** all 26 have source-pinned permissions, enforced by the existing shared `rsOf()` policy used by Xbox menus, human input, AI research, authenticated multiplayer action menus and the underlying `research()` call; the Age and prerequisite checks are still mandatory and resources are never deducted for rejected research.

| Technology | Civilizations available | Civilizations missing it in our 26-civ roster |
| --- | ---: | --- |
| Crossbowman | **25 / 26** | Spanish |
| Arbalester | **16 / 26** | Franks, Persians, Teutons, Celts, Turks, Indians (Hindustanis), Spanish, Slavs, Huns, Goths |
| Thumb Ring | **17 / 26** | Franks, Britons, Teutons, Celts, Vikings, Khmer, Slavs, Goths, Aztecs |

**User-visible consequences:** Britons still reach Arbalester but cannot use Thumb Ring; Franks and Teutons still train Crossbowmen but cannot upgrade to Arbalester; Spanish keep basic Archer recruitment but have no Crossbowman (and therefore no Arbalester), while retaining Thumb Ring for other supported archer types. The production menu continues to display each civilization's own unique Castle technology and all otherwise supported Archery Range research, including Elite Skirmisher, without unintended removal.

**Save compatibility:** Existing saves can contain ongoing Archer-line research started before the restriction matrix existed. `validSavedProduction()` explicitly allows **only** those three previously legal, already-in-progress Archery Range research entries to load as legacy state. Such a pending upgrade may finish on resume as a grandfathered exception; no new forbidden research can be started. Existing completed research flags and fielded units remain intact, and unique-technology validation still rejects foreign Castle research. This trades strict retroactive enforcement for preserving players' saved campaigns, documented as intentional compatibility behavior.

**Regression gate:** `tests/aoe2-de-civilization-archery-tech.test.mjs` checks all 26 named factions and 78 availability combinations, normal paid research, unauthorised research charging zero resources, independent team catalogs, authenticated host rejection/application, and legacy save recovery. Generic Archer/Thumb Ring tests now explicitly select Mongols, a faction with both technologies, so tests do not bypass faction rules.

**Still open:** full unit roster accuracy, over 26 additional DE civilization identities, all other civilization-specific tech restrictions (e.g. Hand Cannoneer, Siege Onager, Halberdier), upgraded unique-unit lines, civ bonuses and unique regional buildings, balance patch differences, and Xbox Series X device acceptance. Do not assume that an unavailable faction-specific technology should appear as a disabled button; it is omitted from available technology choices, matching the current game's menu model.

## Civilization-specific core military units and upgrades — 24 October 2026

**Source and scope:** [SiegeEngineers/aoe2techtree `data/data.json`](https://github.com/SiegeEngineers/aoe2techtree/blob/master/data/data.json) and the [interactive AoE2 DE tech tree](https://aoe2techtree.net/), inspected 24 October 2026. This extension uses each civilization's standard Unit availability list. Source unit IDs: Man-at-Arms **75**, Long Swordsman **77**, Two-Handed Swordsman **473**, Champion **567**, Pikeman **358**, Halberdier **359**, Light Cavalry **546**, Cavalier **283**, Elite Skirmisher **6**, Scout Cavalry **448**, Knight **38**. Existing game keys and saved records are unchanged. The previous 26-civilization Crossbowman/Arbalester/Thumb Ring matrix remains in force.

**Implementation:** `CIV_CORE_MILITARY` lists source-backed unit and research eligibility for all 26 implemented kingdoms. The shared `rsOf` and `trOf` now filter unavailable research/recruitment; controllers, normal battles, AI, accessible UI, and the authenticated multiplayer host share those functions. Direct `research()` and `train()` reject the same forbidden operations *before* resource deduction. Existing saved soldiers, queues, completed technology flags and research already in progress are retained rather than silently deleted. The older Castle Knight recruitment is filtered for factions that cannot train Knights; the remaining Castle training model is a separate building-parity gap.

**Verified representative gaps fixed:**

| Civilization | Former C&K possibility | Current source-backed restriction |
| --- | --- | --- |
| Aztecs, Mayans, Incas | Generic Scout Cavalry and Knight recruitment | No Scout Cavalry/Knights; cavalry upgrades unavailable |
| Hindustanis (game's legacy `Indians` label) | Knights and Cavalier research | Cannot create Knights or research Cavalier; Scout/Light Cavalry retained |
| Teutons | Light Cavalry upgrade | No Light Cavalry upgrade (ordinary Scout recruits remain) |
| Turks | Pikeman and Elite Skirmisher upgrade | Neither upgrade; their base Spearman and Skirmisher remain |
| Mongols, Vikings | Halberdier research | No Halberdier, even after Pikeman |
| Persians | Two-Handed Swordsman or Champion | Their Militia upgrades stop at Long Swordsman |
| Franks, Byzantines, Japanese | Generic upgrade lines allowed | Keep legitimately available upgrade options |

**Documented regional exception:** the source's current Incas roster substitutes a **regional Champi Warrior infantry line** for conventional Militia tiers. Crown & Kingdoms still models Incas using its historical generic Militia actor and sprites, so **existing Inca Man-at-Arms through Champion upgrades intentionally remain enabled** until that regional replacement and migration are implemented. This is not full Inca AoE2 parity; it prevents breaking existing saved games and campaigns without offering the appropriate replacement. The other missing regional units and civilization bonuses, and the full roster of unique technologies/production buildings, remain open.

**Validation:** `tests/aoe2-de-civ-core-military-tech.test.mjs` pins all 26 civilization flags and tests UI/research visibility, affordability, direct recruitment, multiplayer rejection without losing resources, team isolation and old-save compatibility. The prior Archer tech-tree tests remain release gates. Source update or mod compatibility must be reevaluated if the AoE2 tech tree changes.

## Blacksmith/Stable civilization technology availability — 24 October 2026

**Source:** [SiegeEngineers/aoe2techtree `data/data.json`](https://github.com/SiegeEngineers/aoe2techtree/blob/master/data/data.json), source blob SHA `c4f7da961e82a8231b1ba49459949c4d6e479bc8`, cross-checked against the [Bracer](https://ageofempires.fandom.com/wiki/Bracer), [Bloodlines](https://ageofempires.fandom.com/wiki/Bloodlines) and [Husbandry](https://ageofempires.fandom.com/wiki/Husbandry_(Age_of_Empires_II)) availability charts. Tech IDs: Bracer **201**, Bloodlines **435**, Husbandry **39**. The game's inherited **Indians** civ label maps to contemporary **Hindustanis**. The complete 26-civilization bitmask is encoded as `CIV_FIELD_RESEARCH` in `engine.js` and pinned in `tests/aoe2-de-civilization-field-research.test.mjs`.

| Civilization | Bracer | Bloodlines | Husbandry |
| --- | :---: | :---: | :---: |
| Franks | No | No | Yes |
| Britons | Yes | No | Yes |
| Mongols | Yes | Yes | Yes |
| Byzantines | Yes | No | Yes |
| Persians | No | Yes | Yes |
| Teutons | No | Yes | No |
| Celts | No | No | Yes |
| Vikings | Yes | No | No |
| Saracens, Turks, Chinese, Japanese, Khmer | Yes | Yes | Yes |
| Indians (Hindustanis), Spanish, Italians | Yes | Yes | Yes |
| Slavs | No | Yes | Yes |
| Huns, Goths | Yes | Yes | Yes |
| Aztecs, Mayans, Incas | Yes | No | No |
| Ethiopians | Yes | No | Yes |
| Malians | No | Yes | Yes |
| Koreans | Yes | No | Yes |
| Magyars | Yes | Yes | Yes |

**The source also grants Fletching (199), Bodkin Arrow (200), and Ballistics (93) to every represented civilization.** Those technologies remain available; this batch does not invent restrictions on universal upgrades or reprice technologies.

**Enforcement:** the common `rsOf` research catalog filters `atkR2` (Bracer), `blood` (Bloodlines), and `husb` (Husbandry). This same catalog is used by controller and production menus, normal research validation, production AI, and authenticated multiplayer command execution. Forbidden new researches cannot enter a queue or spend resources. Other existing military/archery restrictions continue to be applied independently. A game saved before the restrictions with a **pending** otherwise-forbidden technology still loads and finishes that paid research—preserving backward compatibility rather than deleting user progress. Research that is permitted continues to modify existing soldiers and new production exactly as before.

**Acceptance:** Source-pinned tests examine the entire 26-civilization matrix, each building's options, forbidden research budget, authorized multiplayer host rejection, independent teams, real Bracer range, Bloodlines HP, Husbandry movement, and saved research migration. Full standalone, browser, campaign and seeded skirmish workflows remain mandatory before merge.

**Open:** Full civilization-level research availability for remaining Blacksmith armor lines and Monastery/University upgrades, region-specific unit substitutions, the actual AoE2 cost/research multipliers, and unique-tech mechanics. This is a **three-technology researched-access fix**, not completed parity for every tree. The live Vercel production alias also remains behind GitHub and requires separate deployment permissions/configuration.

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


## Civilization-specific Monastery research eligibility — 24 October 2026

**Version and source:** AoE2: Definitive Edition build **185872** (22 September 2026) and [SiegeEngineers/aoe2techtree data/data.json](https://github.com/SiegeEngineers/aoe2techtree/blob/c4f7da961e82a8231b1ba49459949c4d6e479bc8/data/data.json), exact blob `c4f7da961e82a8231b1ba49459949c4d6e479bc8`. The game's 26 civilizations are matched to the standard base tech-tree entries; legacy `Indians` uses Hindustanis. No inference about regional replacements, civ-specific free research, modified costs or nonstandard modes is made.

The game now filters all eleven **implemented** Monastery technologies by faction, rather than offering the complete catalogue to every civilization. Relevant tech IDs: Devotion **46**, Faith **45**, Heresy **439**, Redemption **316**, Atonement **319**, Sanctity **231**, Fervor **252**, Block Printing **230**, Illumination **233**, Theocracy **438**, Herbal Medicine **441**. Existing tech effects, costs, research timing, age/prerequisite checks, sprites and saved technology keys are unchanged. `CIV_MONASTERY_RESEARCH` and `MONASTERY_RESEARCH_KEYS` in `engine.js` are the versioned eligibility matrix; `rsOf()` applies it before both local and authenticated multiplayer menus, AI catalogue choices, and `research()` payment.

**Meaningful exceptions:** Franks have no Redemption or Atonement; Saracens and Teutons retain all eleven; Magyars lack Faith; Mongols lack Block Printing, Illumination and Theocracy. For consistency with older saves, a Monastery research entry paid and already in progress before these restrictions may still finish on load; no **new** unavailable research can be initiated. Tests pin all 26 × 11 availability decisions and exercise paid/denied research, per-team authorization and saved queues. These tests are not a claim that the entire Monastery, AI, or Xbox interface is reference-exact.

**Still open:** civilization bonuses, unique technologies, regional unit substitutions, additional Monastery technologies introduced in future DE updates, accurate conversion class/resistance details and console hardware acceptance. Full campaign, browser and seeded AI tests are release gates; final run IDs and results belong in the delivery report after they complete.
