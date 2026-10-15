# Crown & Kingdoms

Crown & Kingdoms is an original, controller-first medieval real-time strategy game built for modern browsers, with Xbox Series S and Microsoft Edge as the primary target. It takes inspiration from the broad systems of Age of Empires II: Definitive Edition, but it is not an exact recreation of its complete roster, balance, campaign catalogue, artwork or platform features.

## Source of truth

- **`index.html`** — minimal page shell that loads the stylesheet and runtime scripts in dependency order.
- **`index.html` and `styles.css`** — canonical page shell and full-screen, controller-first canvas styling.
- **`js/config.js` and `js/state.js`** — shared unit/building/technology definitions, runtime state, and core helpers.
- **`js/mapgen.js`** — seeded/procedural map generation and map-layout helpers.
- **`js/simulation.js`** — fixed-step world simulation, economy and combat rules.
- **`js/ai.js`** — rival-kingdom strategy, economic expansion, composition-aware technology selection, defensive response, coordinated attack waves and naval decision-making.
- **`js/entities.js`** — shared resource, building and unit creation with placement and technology-upgrade handling.
- **`js/input.js`** — gamepad polling, selection, orders and menu navigation.
- **`js/render.js`** — world, building, node, unit, relic, particle, terrain palettes/chunks and procedural sprite rendering; deterministic tile variation and team foliage palettes live beside the painters, with local sprite-atlas and procedural fallbacks.
- **Canvas primitives:** `js/render.js` owns shared shapes/progress drawing (`dia`, `poly`, `bar`); `js/ui.js` owns the common canvas text helper (`tx`). `engine.js` keeps orchestration and game/input state, not these primitive declarations.
- **`js/ui.js`** — shared menu renderers and framed panels, match-result/runtime-error overlays, campaign screens, radial command/control-group overlays, quick-select bar and unit tooltips, performance/overview screens, technology tree, help/About, pause-menu, controller-remap and save-slot presentation, plus the in-match resource bar and HUD; controller polling/rebinding remains in `js/input.js`, command state remains in the engine core, and save serialization remains in `js/save.js`.
- **`js/campaign.js`** — mission definitions, campaign arc order, objective validation, event scheduling, progression/unlock rules and controller action handlers; campaign view drawing is owned by `js/ui.js`.
- **`js/menus.js`** — new-game and options item models, selection state, settings persistence calls and controller navigation; main menu/setup/options screen drawing is owned by `js/ui.js`.
- **`js/audio.js`** — synthesised sound effects, spatial audio, ambience and adaptive music.
- **`js/save.js` and `persistence.js`** — compatible save serialization plus IndexedDB backup/restore; localStorage remains the primary compatibility path.
- **`assets/`** — external atlas manifest and original local SVG sprite atlases. `tests/validate-atlas.mjs` checks frame metadata and bounds.
- **`multiplayer.js`** — lightweight lobby/player-marker integration using Supabase Realtime; this is not authoritative synchronisation of complete RTS matches.
- **`scripts/`, `tests/` and `sw.js`** — syntax/invariant checks, regression tests, map-connectivity checks and same-origin offline-shell caching.
- **`AOE2_PARITY_ROADMAP.md` and `docs/BROWSER_TECH_ROADMAP.md`** — maintained roadmaps for gameplay/content gaps and browser architecture/performance.

These three Markdown files are the maintained project documentation. Completed one-off prompt documents are removed once their requirements have been transferred into the code, README or roadmaps; do not treat deleted prompts as missing game features.

The root `index.html` is the canonical entry point. Runtime files are classic scripts sharing globals, so preserve script order and avoid duplicate top-level `const`/`let` declarations. Keep the canvas renderer and all primary interactions controller-accessible; do not add mouse-only or keyboard-only dependencies.

## Systems currently present in source

- Four-age progression, buildings, unit production, research, construction and repair. The current research set includes Bloodlines (+20 HP for cavalry lines) and Chemistry (+1 attack for hand cannoneers, janissaries, bombard cannons and war galleys); both use the shared effects applied to existing units and newly created units.
- Resource gathering, farms with 60-wood automatic reseeding, farm-capacity upgrades, market trading, relic income, trade carts/cogs, renewable fish traps, player tribute and conditional AI-to-ally surplus tribute. Villagers can help repair allied buildings and ships; AI repairs damaged buildings when safe, repairs badly damaged ships with idle warships, and has wounded warships disengage from nearby fleets. Configurable villager worker targets include new-worker auto-assignment.
- Ground, siege and naval combat; formations and Aggressive/Defensive/Stand Ground/Passive/No Attack stances; Guard and Follow commands; coordinated AI attack groups, siege targeting, defensive priorities, remote-economy anti-raid responses, automatic building repair, evasive fishing-ship routes, wounded-warship disengagement, retreats, hostile-army-aware counter production and research, and allied-base relief detachments. AI Fishing Ships evade nearby hostile warships; damaged warships can seek repair when safe. Ship repair respects Reinforced Hulls. Researched Man-at-Arms/Long Swordsman, Pikeman, Arbalester, Elite Skirmisher, Light Cavalry and Cavalier ranks display consistently in selection and production UI, with additional battlefield-visible armour, weapon, hull and siege-equipment details; fully unique rank sprites remain a gap.
- Fog of war, minimap, pathfinding, seeded/procedural maps, named fixed layouts—including King's Causeway with its diagonal strait and three land crossings—connectivity diagnostics, save/load flows and an 18-mission campaign progression that includes The Causeway Muster. The Coastal War arc now includes *The Siege of Tidewatch*, an Imperial Age siege mission with artillery production, fortified targets and timed counter-raids.
- Wonder, relic and Regicide victory options alongside the standard Town Centre victory; a score-at-selectable-time-limit mode (10, 15, 20, 25 or 30 minutes); King of the Hill, where military land units contest a central landmark for five uninterrupted minutes; and Sudden Death, where losing your starting Town Centre eliminates your kingdom and building another is disabled.
- Original SVG sprite atlases, team-colour variants, animation metadata, procedural visual fallbacks and synthesised Web Audio.
- Controller-oriented menus and navigation, including Town Bell and pause-menu diplomacy controls for enemy, neutral and ally relationships. Regicide victory respects hostile relationships. Player-selected AI allies share live fog-of-war vision, can send capped surplus-resource tribute, and can react to attacks near allied Town Centres/Castles. AI-negotiated treaties and time-limited diplomatic agreements remain out of scope for the current diplomacy implementation. Population-limit settings now include 50, 100, 150, 200, 250, 300, 400 and 500; houses still determine the capacity actually available during a match.

These statements describe source-level presence, not guaranteed balance or acceptance on physical Xbox hardware. Sprite-atlas validation checks metadata and frame bounds; it does not prove that every animation looks correct. See the roadmaps for partial systems and unverified behaviour.

## Run the checks

Use Node.js 22 or a compatible current Node release. No package installation is required for the repository's built-in checks.

```sh
node scripts/check-game.mjs
for test in tests/*.test.mjs; do node "$test" || exit 1; done
node tests/validate-atlas.mjs
```

The GitHub Actions workflow uses the same discovery rule: every `tests/*.test.mjs` file is run automatically, so newly added regression tests cannot silently be omitted from a manually maintained CI list. Most tests are static syntax, source-pattern or asset-metadata checks. They do **not** simulate complete matches and cannot replace browser, deployment, network or Xbox controller testing. A regression test can confirm that a known crash path is guarded; it cannot prove that all runtime errors are gone.

## Project boundaries

The goal is to build gameplay and content that can run in the browser: economy, combat, technologies, AI, maps, campaigns, controls, graphics and audio. Xbox achievements, Xbox cloud saves, Smart Delivery, Xbox Play Anywhere, Xbox-native presence/clubs, platform matchmaking and platform cross-play are outside the current implementation scope because they require supported platform services. Do not represent these as implemented.

## Deployment and verification

The repository is connected to Vercel. Check the Vercel status on the exact latest commit before assuming the hosted page includes a change. A successful deployment status confirms that Vercel completed that deployment; it does not prove that the correct public alias is open or that the build has been tested on Xbox.

For the authoritative current gaps and next steps, see [the parity roadmap](AOE2_PARITY_ROADMAP.md).


- **Cavalry Armour +1:** available at the Blacksmith, reduces incoming damage for mounted units through class-specific combat logic, and adds a visible metallic barding cue. AI research priority rises when facing at least three hostile mounted units.


- **Large-army target search:** enemy-unit acquisition now uses an 8-world-unit spatial bucket index rebuilt lazily once per simulation step. It retains exact distance/hostility/dead/garrisoned filters and original tie-breaking, while siege/building target priority stays unchanged. This is an algorithmic optimization, not yet an Xbox FPS claim.


- **Infantry sword-line expansion:** Barracks research now progresses Man-at-Arms → Long Swordsman → Two-Handed Swordsman → Champion. Each tier updates existing and newly trained Militia-class units through the shared health/attack ledger, rank names across menus/HUD, AI research weighting and visible battlefield equipment cues.


- **Conscription:** Castle research (150 food, 150 gold; 60 seconds; Imperial Age) speeds military production queues by 33⅓%, including units already queued. It does not speed villagers, trade carts/cogs, fishing ships or transport ships.


- **Halberdier:** the Imperial Barracks upgrade follows Pikeman, adds health and attack to existing/new Spearmen, grants an additional +6 damage against the existing anti-cavalry target roster, and adds a larger gold polearm cue. AI prioritises the upgrade when enemy cavalry is present.
