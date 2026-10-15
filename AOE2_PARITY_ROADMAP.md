# Crown & Kingdoms — implementation roadmap

**Audit date:** 15 October 2026  
**Source checkpoint reviewed for this continuation:** `ddf1b8c5d000af30cea93ea379407c590bd0d315` (main, 15 October 2026).  
**Target:** browser canvas RTS, with controller-first operation on Xbox Series S / Microsoft Edge.

This is a practical development roadmap, not a claim of full Age of Empires II: Definitive Edition parity. “Implemented” means relevant code exists; it does not automatically mean the feature is balanced, complete, or verified on an Xbox.

## Status key

- **Present in source** — implementation is identifiable in the current code.
- **Partial** — a simplified/subset implementation exists, or important edge cases remain.
- **Unverified** — needs running-game, browser, network or physical-controller testing.
- **Gap** — not implemented to the requested standard.

## Latest continuation work — 15 October 2026
- **Implemented:** extracted the optional sprite-atlas manager into `js/assets.js`; the main engine retains only atlas-pack startup and uses the same `ASSET` / `assetFrame` interfaces. The classic-script order, service-worker cache, and syntax/source checks include the new module. Atlas image loading remains asynchronous and procedural art remains the fallback.


- **Implemented:** moved the technology tree, objectives and controller help/About screens to `js/ui.js`; the classic-script load order and shared state are preserved.
- **Implemented:** moved the pause-menu model and drawing into the existing `js/ui.js`; `js/input.js` retains D-pad navigation and B/Menu-to-resume handling. Added focused regression coverage for single ownership and resume behaviour.
- **Implemented:** moved controller-remap labels and drawing into `js/ui.js`; button binding, reset, return behaviour and `ck_map` persistence remain in the existing input/runtime flow. Regression coverage protects module ownership and action wiring.
- **Implemented:** moved `ico()`, `topbar()` and `hud()` into `js/ui.js`; `engine.js` continues to call the same `hud()` entry point. HUD status labels and the three affected source bundles have regression coverage; no frame-rate gain is claimed.
- **Implemented:** added more saddle tack, stitched details and cavalry barding accents to the procedural mounted-unit art.
- **Implemented:** reuse the spatial separation grid for large armies to reduce repeated allocations. This is a targeted allocation reduction, not proof of 400-unit performance; Xbox Edge profiling remains unverified.
- **Implemented:** researched infantry and ranged armour upgrades now have a subtle metal-and-gold visual cue in the battlefield renderer; `drawUnit` explicitly keeps its team technology state available to the equipment passes.
- **Implemented:** the campaign HUD now lists up to five active objectives, so the five-objective opening tutorial no longer hides its last objective. A regression assertion covers the full list.
- **Regression harness maintenance:** tests that inspect pause-menu item composition now include `js/ui.js` alongside `engine.js`, so assertions continue checking the real combined runtime after extraction. The full suite is run in GitHub Actions.

## 1. Current implementation

### Core simulation and economy

- **Present:** four broad ages; age-up costs, research times and building prerequisites; resource pools; villagers; construction and repair; production queues; research; population accounting; game-end handling.
- **Present:** population limit selector with 50, 100, 150, 200, 250, 300, 400 and 500 options. Houses add five capacity each, starting from a base capacity of ten, with the selected setting as the upper cap. This is a configurable limit, not an automatic grant of that many population slots.
- **Present:** Town Bell action on a player Town Centre sends available villagers toward completed Town Centres, Castles or Towers with room, counting both current garrisons and villagers already on the way. Villagers can be released using the normal unload action.
- **Present:** food, wood, gold and stone gathering; drop-off logic; farms with automatic reseeding for 60 wood; Horse Collar (+75 farm food), Heavy Plow (+125) and Crop Rotation (+175); ownership-aware farm upgrades.
- **Present:** market buy/sell trading with changing prices; Trade Carts from Markets and Trade Cogs from Docks; distance-based gold on completed deliveries; retry behaviour when a route endpoint is unavailable.
- **Present:** relic collection and income while a relic is stored in a monastery; Fishing Ships, renewable fish traps (100 wood, 900 food per trap) and AI fish-trap deployment.
- **Partial:** gathering/carry rates, trade values, repair/construction rates, farm economy recovery and upgrade balance need systematic gameplay review.
- **Present:** skirmish diplomacy controls in the pause menu can set each surviving rival to Enemy, Neutral or Ally. The relationship matrix is symmetric and saved/restored; missing diplomacy data in older saves defaults to enemies. Combat damage, manual attacks, automatic target acquisition, AI attack targets, naval target selection and defensive threat scans respect hostility.
- **Partial:** diplomacy is currently player-controlled against individual rivals and AI-to-AI relationships remain hostile. Player-selected allies now share live fog-of-war vision, can receive conditional surplus-resource tribute, and can trigger emergency defensive support near allied Town Centres/Castles. Regicide victory respects hostility, so allied Kings no longer block victory. Treaty duration, AI-negotiated diplomacy and fully developed allied-team victory rules remain gaps.
- **Present:** food, wood, gold and stone tribute from the pause menu to allied surviving kingdoms, with controller-selectable amounts of 100, 250, 500 or 1,000. The sender's balance is checked before the same amount is credited to the ally.
- **Partial:** player tribute amounts are selectable from 100, 250, 500 or 1,000; arbitrary custom amounts and negotiated tribute agreements are not implemented.
- **Present:** controller-adjustable worker targets for Food, Wood, Gold and Stone; newly created player villagers are assigned automatically while automation is enabled, idle automated workers retry after resources deplete, and settings are saved/restored. Manual orders and Stop disable reassignment for that villager.
- **Partial:** targets are per-resource desired counts with balanced overflow. Automatic villagers verify routes and skip repeated unreachable targets; the controller radial menu can send all selected villagers to the exact hovered land resource. Carried loads now seek reachable compatible drop-offs and avoid repeatedly pathfinding the same failed destinations; other direct site assignments remain manual, and the AI does not use the player's priority settings.

### Combat, units and buildings

- **Present:** melee, ranged, siege and naval units; monks and relic handling; formations; Aggressive, Defensive, Stand Ground, Passive and No Attack stances; patrol, attack-move, Guard and Follow commands; garrison/unload logic.
- **Present:** siege splash damage against nearby enemies; class-based armour upgrade rosters; selected unit attack bonuses; some technology effects applied to existing units/buildings and newly created units/buildings.
- **Present:** AI mixed attack groups, dedicated siege targets, siege-threat defensive priorities, critically wounded land-unit retreat/healing, hostile-kingdom-aware counter production and research, local anti-raid responses around economic sites, automatic safe-area repair of damaged AI buildings, evasive fishing-ship routing, wounded-warship disengagement, safe-area naval repair, limited emergency defence for allied bases, and purposeful War Galley target selection. Researched elite ranks and siege/naval upgrades now add battlefield-visible equipment details; fully unique rank-specific sprite sets remain incomplete.
- **Partial:** unit upgrade lines, armour classes, attack bonuses, unique units, building roster and research coverage are subsets of AoE2 DE. Exact balance and complete class interactions are not established.
- **Partial:** all 31 currently defined technologies are reachable from their listed buildings and define costs, ages and research times; research rejects unknown technologies and wrong-building requests. Data-driven checks now require every defined technology to have a recognized effect pathway, and the effect tests cover current/new units and buildings.
- **Present in UI / partial in art:** researched Man-at-Arms, Long Swordsman, Pikeman, Arbalester, Elite Skirmisher, Light Cavalry and Cavalier ranks now appear in selection HUDs, production menus, queue initials and training feedback. These are rank labels over the existing internal unit types; distinct upgraded sprites/equipment and exact upgrade balance remain gaps.
- **Gap:** the full regional and DLC unit roster; architecture-set variety; a verified attack projectile/accuracy model at full reference fidelity.

### Maps, campaigns and victory conditions

- **Present:** seeded/procedural map layouts and sizes, fog of war, explored areas, minimap, land/water terrain diagnostics, start-position land connectivity checks, dock-site diagnostics, seed retries and campaign objectives/events.
- **Present:** Wonder victory (five-minute hold), relic victory (four-minute hold), Regicide, standard Town Centre victory, score victory with selectable 10-, 15-, 20-, 25- or 30-minute limits, King of the Hill and Sudden Death. Score is a Crown & Kingdoms-specific formula based on held resources, surviving units/buildings, age, researched technologies and stored relics; it is not claimed to match AoE2's exact scoring formula.
- **Present:** *The Golden Coast*, *The Strait's Last Relic* and *The Siege of Tidewatch*, alongside earlier campaign scenarios. Tidewatch adds an Imperial Age coastal siege, artillery-production objective, fortified Castle/Town Centre targets and timed counter-raids.
- **Present / source-tested:** natural campaign completion now follows the displayed arc order: Ashford arc missions 0–5 then 8, Frontier Wars 6–7, Royal Campaign 9–11, and Coastal War 12–13. This fixes the previous raw-array progression mismatch; full mission runs remain unverified.
- **Partial:** map identities are procedural layouts rather than the complete hand-authored/random-map catalogue. Twin Rivers generates two winding waterways with three shallow ford crossings each; Golden Coast adds a variable northern coastline to resource-rich terrain; King's Causeway adds a diagonal navigable strait with three separated shallow crossings; Broken Isles adds another repeatable coastal seed for mixed naval and land matches. These are repeatable strategic layouts, while full live-game vessel navigation still needs runtime validation. Connectivity diagnostics are not proof that ships can navigate every route in a live game.
- **Present:** score/time-limit offers 10-, 15-, 20-, 25- and 30-minute durations. The selected duration drives the HUD countdown and winner/draw result and is preserved in settings and save slots.
- **Partial:** score calculation is a Crown & Kingdoms-specific formula, not AoE2 DE parity; score-mode duration and balance still need full-match testing.
- **Present / unverified:** King of the Hill has a carved land route from each starting position, a central landmark and minimap marker, AI hill targeting, and a five-minute uncontested military hold condition. End-to-end matches and route behaviour still need live gameplay validation.
- **Present / unverified:** Sudden Death ends a kingdom when its Town Centre is destroyed, blocks building another Town Centre, and awards victory when no hostile Town Centres remain. End-to-end play and all map types still require gameplay validation.
- **Gap:** a scenario editor; replay/spectator systems; broader campaigns, trigger tools and end-to-end mission validation; cheats, taunts and a complete chat system.

### Controller, graphics, audio and networking

- **Present:** controller-driven menus, contextual commands, radial menu, remappable gamepad controls, pause/resume, formations, minimap, selection UI, synthesised Web Audio and a performance overlay.
- **Present:** local SVG atlases for upright units, forces and buildings; four-direction animation metadata and team-colour variants; procedural fallbacks; original terrain/building drawing and local stone/wood textures.
- **Partial:** animation coverage and visual consistency still need in-game inspection. The atlas metadata check validates frame bounds, not whether a sprite is visually upright, correctly scaled or attractive at TV distance.
- **Partial / unverified:** `multiplayer.js` coordinates lobby/configuration, map-signature checks and lightweight player-marker updates (5 Hz). It does **not** synchronise the full RTS simulation or provide authoritative lockstep/rollback/host migration. Host/join, reconnect, host loss, match-end and controller-only multiplayer flows still need real network tests.
- **Gap:** physical Xbox checks for TV-safe layout, controller disconnect/focus recovery, large-army performance, pause/resume, save/load and campaign completion have not been replaced by static tests.

## 2. Highest-priority backlog

The game is being built feature-first for the single-page Xbox Edge target. The most useful remaining work is to close material gameplay and presentation gaps rather than grow the test checklist.

### Next gameplay and content work

1. **Unit and technology depth:** expand the useful roster and counter relationships; add visibly distinct equipment/rank art rather than relying only on HUD rank labels; keep each new technology tied to real effects on existing and newly produced objects.
2. **Campaign depth:** continue adding missions with meaningfully different starts, timed events, multi-stage objectives and enemy plans. The progression now includes Ashford, Frontier Wars, Royal Campaign, Coastal War, Northern March and The Causeway Campaign. The Causeway Muster uses layout 12 and combines dock, galley, tower and fortress objectives. The follow-on *The Crown Holds the Crossing* adds an Imperial Age fortification challenge: build two completed Castles, withstand timed heavy-siege raids and destroy the enemy Town Centre. Both missions use layout 12 and are ordered in the Causeway Campaign. *The Siege of Tidewatch* is now part of Coastal War and requires a Siege Workshop, two living Bombard Cannons, destruction of the enemy Castle and destruction of the enemy Town Centre before the mission completes.
3. **Map identity and naval routes:** add distinct layouts with clear strategic choices; keep start fairness and land access in mind, and improve actual navigability for ships beyond terrain-only connectivity diagnostics.
4. **AI and diplomacy:** adaptive counter research/production and allied emergency defence are now present. Remaining gaps include AI-negotiated diplomacy, treaty duration, vision-sharing controls beyond player-selected allies, and a more complete allied victory model.
5. **Combat and economy balance:** review long matches, siege/ship counters, construction and repair rates, market value curves, farm recovery and resource demand at the higher population settings.
6. **Graphics and controller readability:** refine unit equipment and rank differentiation, building silhouettes and architecture, attack/death/walk animation coverage, TV-distance readability, menu focus, and pause/disconnect recovery.
7. **Multiplayer boundary:** the current network layer is lobby/configuration plus lightweight markers, not authoritative synchronization of the full RTS simulation. Keep the agreed host-authoritative direction separate from Xbox platform services; host loss ends the current match, and achievements, cloud saves, platform matchmaking and cross-play stay out of scope.
8. **Target-device performance:** maintain the 30 Hz simulation and spatial separation optimisations; check 400-unit matches, effects, camera/selection responsiveness and save/load on actual Xbox Edge before claiming device acceptance.

### Recently implemented in source

- AI counter production and research now account for every hostile kingdom, not just the human player's army; active technologies cannot be duplicated in multiple AI buildings.
- Player-selected AI allies can send capped surplus-resource tribute and dispatch a limited relief force when an ally's Town Centre or Castle is threatened.
- Friendly ships can repair other damaged ships; repair uses the researched hull maximum, AI fleets can help repair when safe, Reinforced Hulls applies to Trade Cogs, and Siege Engineers also improves Trebuchets and Bombard Cannons.
- The Coastal War campaign now contains *The Siege of Tidewatch*, with an Imperial Age siege, artillery production, a fortified Castle, a Town Centre target and timed counter-raids.

Static source checks remain useful for regressions, but they are not proof of complete match balance, visual quality, online reliability or physical Xbox acceptance.

### Maintenance audit — 14 October 2026

- **Fixed CI test discovery:** the workflow previously listed each test file explicitly, creating a risk that new tests would exist locally but never run in GitHub Actions. It now discovers all `tests/*.test.mjs` files and fails if none exist.
- **Aligned contributor instructions:** the README uses the same test-discovery approach, while keeping the game-script syntax/invariant check and atlas validation explicit.
- **Kept the canonical game untouched in this maintenance pass:** changes are limited to workflow and documentation; no gameplay feature is marked complete by these housekeeping edits.
- **Next engineering gates remain:** deeper technology/unit-line coverage, campaign/map end-to-end checks, and real browser/network/Xbox validation. Platform services explicitly excluded by the project remain out of scope.


### Gameplay follow-on — 14 October 2026

- **Score victory duration:** the New Game menu now offers 10, 15, 20, 25 or 30 game-minute limits using the same controller left/right interaction as the other setup options.
- **Consistency:** the HUD countdown and victory/draw messages derive from the selected duration instead of a hard-coded 20-minute threshold.
- **Persistence fix:** settings restore now permits victory mode index 4 (Score); both settings and saved games retain the chosen duration, while older settings/saves safely fall back to 20 minutes.
- **Campaign isolation:** campaign entry uses its 20-minute score-mode default and the prior New Game selection is restored when leaving back to the setup flow.
- **Regression coverage:** the score-mode source test now checks the supported options, controller-menu presence, duration-based ending/HUD and persistence compatibility. These are static source checks; full match timing still requires gameplay testing.


### Gameplay follow-on — 14 October 2026

- **King of the Hill:** added as a controller-selectable victory mode. It carves obstacle-free routes from each starting area to a central landmark for this mode, clears resource nodes from those routes, and places a visible landmark on the world map and minimap.
- **Capture rules:** living, ungarrisoned land combat units inside the hill radius count; villagers, trade carts, trade cogs and ships do not. Player allies can assist; neutral units are not treated as player allies. A sole holder must maintain control for five continuous game-minutes; no holder or contested control resets the timer.
- **AI:** attack groups route directly to the hill and use a compact formation so units can actually contest the capture radius.
- **Persistence:** capture progress is saved/restored, finite values are bounded to the valid timer range, and older saves default to zero progress.
- **Validation boundary:** new source regression tests cover these rules, but do not substitute for playing matches across multiple map types or testing on a physical Xbox.


### Gameplay follow-on — 14 October 2026

- **Sudden Death:** added as a controller-selectable victory mode. Destroying the player's starting Town Centre ends the match in defeat; destroying a rival Town Centre eliminates that rival kingdom's remaining buildings and units.
- **Build restriction:** the game rejects Town Centre placement while Sudden Death is selected. The mode remains isolated from campaign Town Centre victory rules.
- **Victory:** the player wins once no hostile Town Centres remain. The HUD and match-start messages explain the objective.
- **Regression coverage:** a dedicated test verifies selection, save/settings clamps, the Town Centre build prohibition, player defeat, rival elimination, projectile cleanup and victory once hostile Town Centres are gone.
- **Validation boundary:** source checks do not simulate live combat or a complete match; those remain deployment/browser/Xbox acceptance work.


### Maintenance / technology audit — 14 October 2026

- **Research request integrity:** the research function now validates the match, kingdom and building before work starts; refuses undefined technologies and research unavailable at that building; and allows age advancement only from a Town Centre. Invalid requests exit before costs are deducted.
- **Data-driven checks:** a new test parses the current technology and building definitions. It verifies that every defined technology appears in at least one building research list, each technology defines costs/research time/age, all prerequisite keys resolve, and prerequisites themselves are reachable. Current table count: 31 technology entries.
- **Effects remain partial:** generic hit-point and attack upgrades, construction speed, farm capacity, defensive attack effects and building health still have targeted checks. This does not establish complete AoE2 DE unit/technology parity or prove balance in live matches.
- **Rank presentation:** UI labels derive from the owning kingdom's completed technology ledger, so existing units and later-trained units show the same researched rank. Internal IDs and current sprite keys remain unchanged; no exact AoE2 DE appearance or complete roster is implied.

## 3. Platform-service exclusions

Per project direction, do not spend time implementing Xbox achievements, Xbox cloud saves, Xbox presence/clubs, Smart Delivery, Xbox Play Anywhere, Xbox Cloud Gaming integration, Xbox-native matchmaking/ranked ELO, or platform cross-play without the required supported infrastructure. Browser-side game modes and local simulation features remain in scope. Do not confuse these exclusions with the separate task of verifying the existing `multiplayer.js` integration.

## 4. Automated validation

The GitHub Actions workflow `.github/workflows/game-regression.yml` runs `scripts/check-game.mjs`, discovers and executes **every** `tests/*.test.mjs` file automatically, then validates atlas metadata. This avoids a manually maintained list drifting out of sync when a new regression test is added. The checks cover:

- inline JavaScript syntax and key source invariants;
- population cap configuration;
- diplomacy relationship symmetry, hostility-aware target acquisition, AI targeting and save/load compatibility;
- allied tribute resource/amount selectors, eligibility checks, affordability validation and transfer integration;
- villager target selection, new-worker automation, manual overrides, route-aware resource fallback, group resource-site orders, reachable drop-off fallback and save/load persistence;
- score/time-limit victory calculation, selectable duration control, settings/save restoration, countdown and tie handling;
- King of the Hill route preparation, military presence rules, ally/neutral handling, contested resets, AI targeting, landmark/minimap visibility and save progress restoration;
- Sudden Death mode selection, no-new-Town-Centre rule, player loss, rival kingdom elimination, hostile-Town-Centre victory and save/settings compatibility;
- No Attack stance: autonomous targeting suppression, attack cancellation, direct-command rejection and feedback;
- Guard/Follow target validation, controller menus, simulation behaviour, post-combat return and manual-order overrides;
- trade routes and fishing economy;
- fish traps and technology effects;
- all current technology definitions exposed through building research lists, required cost/time/age metadata, prerequisite references, and research-request validation;
- AI retreats, siege support, defensive threat priorities and naval targeting with a focus-fire bias so nearby friendly galleys concentrate on a shared warship target;
- campaign content;
- map connectivity/generation diagnostics;
- sprite-atlas metadata and frame bounds.

These tests guard against known source regressions. They do not run a browser, simulate full battles, verify sound output, validate network sessions, or test an Xbox controller.

## 5. Release checklist

Before calling a feature complete:

- Confirm the source change and tests are committed to `main`.
- Confirm the latest GitHub Actions run succeeds.
- Confirm Vercel's status for that exact commit; do not infer deployment from the source alone.
- For gameplay/UI changes, verify the actual deployed page and record anything that has not been tested on Xbox Series S / Edge.
- Preserve procedural/visual fallbacks and existing controller mappings unless a deliberate, tested change is required.

The roadmap is intentionally consolidated: current state belongs in the sections above, not in an ever-growing series of duplicate dated notes.

### Gameplay consistency follow-on — 15 October 2026

- **Diplomacy persistence:** the pause menu continues to list a rival kingdom after its Town Centre falls if any units or buildings survive, so the player can still change its relationship.
- **Tribute consistency:** player and AI tribute-recipient eligibility both use the same surviving-force rule; losing a Town Centre no longer removes access while an allied kingdom still has any living unit or building.
- **Regression coverage:** the diplomacy source test checks the relationship-state matrix, surviving-force menu eligibility and matching tribute-recipient eligibility. These are static source assertions, not a substitute for playing through kingdom elimination and diplomacy changes.

### Engine modularisation and Xbox performance follow-on — 15 October 2026

- **Completed foundation:** `index.html` is the canonical shell. Runtime modules include `js/config.js`, `js/state.js`, `js/mapgen.js`, `js/audio.js`, `js/save.js`, `js/input.js`, `js/render.js`, `js/simulation.js`, `persistence.js`, `engine.js` and `multiplayer.js`; atlas metadata is external JSON. Do not recreate modules that already exist.
- **Present:** the simulation uses a 30 Hz fixed-step accumulator while drawing each animation frame; resize handling is debounced; terrain tiles are bounded to the camera-visible tile range; unit separation switches from pairwise checks to half-tile spatial buckets above 128 units.
- **Next safe extraction:** move remaining save-slot and campaign presentation from `engine.js` into the existing `js/ui.js` as dependency-aware groups. The main HUD, pause-menu and controller-remap presentation are extracted; controller actions remain in `js/input.js`, and save-slot serialization stays in `js/save.js`. Preserve function names and the shared classic-script scope; if a new file is introduced, update `index.html`, source checks and `sw.js` together.
- **Extraction guardrails:** renderer entry points, unit/relic rendering, terrain tile/detail/hill helpers and cached terrain-chunk functions already live in `js/render.js`; map generation and simulation stepping live in `js/mapgen.js` and `js/simulation.js`. Keep input, save formats, campaign state and network message contracts unchanged during future UI extraction.
- **Performance backlog:** add visibility culling for units/buildings/effects only after confirming the world-to-screen bounds for isometric sprites and tall structures; profile combat/pathfinding at 200 and 400 population before changing update cadence. The existing viewport terrain bounds and spatial separation grid do not prove the whole renderer or simulation is within budget.
- **Persistence/audio follow-up:** IndexedDB is currently an asynchronous backup/restore path for the three compatible local slots, not a replacement save format. Keep localStorage as the synchronous compatibility source until migration and interrupted-write recovery are tested. Audio is synthesised and must remain lazy/resumable under browser autoplay and suspend policies.
- **Validation:** existing Node checks parse source and assert invariants. Each extraction should add script-order/syntax coverage and retain all current tests. Browser execution, network sessions, deployment status, and Xbox Series S / Edge performance remain explicitly unverified until actually run there.


## 15 October 2026 — renderer extraction continuation

- Extracted `drawWorld()`, `drawUnit()` and `drawRelic()` into `js/render.js`; their existing function names and drawing logic are preserved.
- `index.html` loads the renderer before `engine.js`; rendering functions resolve shared classic-script globals at runtime.
- The service worker core asset list includes the renderer, and source-composition checks include it in page load order.
- This is a maintainability change, not a claim of measured frame-rate improvement. Xbox Edge and live deployment still require a successful deployment and device validation.
- Continued the extraction with `paintTile()`, `paintTileDetail()` and `drawHill()` moved into `js/render.js`; added regression assertions that these helpers live in the renderer rather than `engine.js`. Existing global helper names and drawing bodies are preserved. This is structural cleanup only; no performance gain is claimed without runtime profiling.
- Extended the renderer extraction to `chunkOf()` and `drawChunks()` so terrain chunk caching and chunk drawing sit alongside tile, hill, world, unit and relic rendering. Regression assertions cover both helpers; function bodies and names are preserved.

## 15 October 2026 — graphics brief and project information

- Completed the applicable documentation brief against the current source: the main page remains the single canonical entry point, with map generation, simulation and rendering split into ordered classic-script modules.
- Refined the King of the Hill landmark's rock planes, ground shadow and flag highlights in `js/render.js`; its footprint, world position and procedural fallback remain intact.
- Updated the in-game About panel to describe local SVG atlases, team-colour/animation metadata, procedural fallback art, synthesised spatial/adaptive audio, the limited scope of the Realtime lobby, and the fact that browser/deployment/Xbox validation is not yet confirmed.
- Added a regression test for the accuracy of that About copy. Updated README and browser technology roadmap to match the current module layout and scope.
- Remaining graphics-brief gates: run the complete Node checks, inspect sprites/animations in a real browser, test audio autoplay/resume and controller navigation, and profile larger armies on the target Xbox. Metadata checks alone cannot establish visual quality or frame rate.


## Current continuation checkpoint — 15 October 2026

This checkpoint supersedes older dated notes where they conflict with the current source layout.

- **Latest known runtime regression addressed in source:** audio voice classification now checks whether a unit definition exists before reading its `mt` field. This addresses the reported crash when a controller action requested audio for an unknown or non-unit entity key. Regression coverage was added. It does not prove that every runtime crash is fixed.
- **Deployment caveat:** the Vercel build-rate limit was reported during this continuation. A GitHub commit does not mean the public site has deployed it; confirm the status of the exact commit before relying on the hosted page.
- **Documentation inventory:** the maintained Markdown set is `README.md`, this roadmap, and `docs/BROWSER_TECH_ROADMAP.md`. The completed graphics/audio prompt was removed after its applicable work was incorporated. Keep the README and both roadmaps; do not recreate a prompt file as a substitute for updating these canonical documents.
- **Immediate engineering order:**
  1. Keep closing runtime regressions found during real play; add a focused regression test for each fixed failure.
  2. Continue dependency-aware extraction of the remaining save-slot/campaign presentation into the existing `js/ui.js`; preserve controller input in `js/input.js`, save formats and classic-script order, and update source checks/cache lists only when paths or files change.
  3. Improve visibly distinct unit ranks/equipment and building silhouettes without replacing the current art fallback path.
  4. Continue meaningful campaign and strategic-map variety, with objectives, prerequisites and mission ordering covered by checks.
  5. Profile 200- and 400-population matches and verify navigation, save/load, audio and controller focus in an actual browser/Xbox session when available.
- **Do not mark complete based only on static checks:** full-match balance, online resilience, animation quality, TV-distance readability, and Xbox Series S / Edge performance remain unverified until directly tested.


### UI modularisation follow-on — 15 October 2026

- **Implemented in source:** the performance overlay and strategic overview drawing functions now live in `js/ui.js`, loaded before `engine.js`. The extraction preserves the function names and bodies.
- **Regression protection:** script order, function ownership and inclusion in the source syntax checks and offline shell cache are covered by the updated checks.
- **Remaining:** the main HUD, pause/menu screens, campaign UI and save-slot UI remain in `engine.js`. Continue in small dependency-aware groups; avoid claiming that the entire UI has been modularised.


## Engine modularisation — kingdom systems

- Extracted diplomacy relationships, hostility helpers, the controller diplomacy menu, resource tribute transfers, and villager-priority automation from `engine.js` into `js/kingdom.js`.
- Loaded the module after `js/simulation.js` and before `engine.js`, preserving the classic-script shared scope and the existing controller commands.
- Added the module to the offline service-worker cache and regression harnesses. This is a structural refactor only: it does not change diplomacy rules, tribute amounts, worker priorities, or save fields.


## Campaign engine extraction

- Moved campaign scenario data, campaign progression, objective tracking/HUD, mission briefing flow and raid-event dispatch into `js/campaign.js`.
- Kept campaign helpers in the same shared classic-script scope, loaded after kingdom systems and before `engine.js`; campaign logic remains controller-driven.
- Updated offline caching and test harnesses. No mission goals, resource rules, or victory conditions were intentionally changed by this structural move.


## Economy module extraction

- Moved the market trade-row builder and buy/sell transaction handler into `js/economy.js`.
- Kept existing trade prices, price movement, resource checks and controller menu callbacks unchanged; the module is loaded before `engine.js` and included in offline caching and simulation regression setup.


## Controller menu module extraction

- Moved new-game setup rows, options rows, title/setup/options drawing and controller handlers, and score-limit choices into `js/menus.js`.
- Kept the current game-mode options, menu text, button navigation and setup restoration behavior intact. The module is loaded before the core engine and included in offline caching and source-level regression harnesses.


## Minimap module extraction

- Moved minimap terrain colour data, minimap texture refresh, world/minimap coordinate transforms, display filters and minimap drawing into `js/minimap.js`.
- Kept player viewport, explored-terrain, team markers, pings, flares and King of the Hill marker rendering in place. Added the module to script-order checks, offline cache and simulation/KOTH harnesses.


## Pathfinding module extraction

- Moved A* route search, diagonal corner-cut prevention, path reconstruction, target-distance helpers and point-goal construction into `js/pathfinding.js`.
- Preserved the shared reusable path workspace, route cost/heuristic, walkability checks and existing return format. Loaded before kingdom automation and included in offline caching, syntax checks and pathing/simulation regressions.

- Campaign module now also owns arc ordering, mission selection, briefing layout and campaign controller handlers, leaving the shared title background renderer in the core UI.
