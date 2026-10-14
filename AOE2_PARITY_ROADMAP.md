# Crown & Kingdoms — implementation roadmap

**Audit date:** 14 October 2026  
**Current source checkpoint:** `main` — see repository history for the latest commit.  
**Target:** browser canvas RTS, with controller-first operation on Xbox Series S / Microsoft Edge.

This is a practical development roadmap, not a claim of full Age of Empires II: Definitive Edition parity. “Implemented” means relevant code exists; it does not automatically mean the feature is balanced, complete, or verified on an Xbox.

## Status key

- **Present in source** — implementation is identifiable in the current code.
- **Partial** — a simplified/subset implementation exists, or important edge cases remain.
- **Unverified** — needs running-game, browser, network or physical-controller testing.
- **Gap** — not implemented to the requested standard.

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
- **Partial:** diplomacy is currently player-controlled against individual rivals; AI-to-AI relationships stay hostile, and treaty duration, negotiated diplomacy, shared vision, tribute and fully developed allied-team victory rules are not implemented.
- **Present:** fixed 100-unit food/wood/gold/stone tribute transfers from the pause menu to allied surviving kingdoms. The sender's balance is checked and the same amount is credited to the ally.
- **Partial:** tribute amount is fixed at 100 per action; configurable quantities and AI-initiated tribute are not implemented.
- **Present:** controller-adjustable worker targets for Food, Wood, Gold and Stone; newly created player villagers are assigned automatically while automation is enabled, idle automated workers retry after resources deplete, and settings are saved/restored. Manual orders and Stop disable reassignment for that villager.
- **Partial:** targets are per-resource desired counts with balanced overflow; direct site-based assignment is still manual, and the AI does not use the player's priority settings.

### Combat, units and buildings

- **Present:** melee, ranged, siege and naval units; monks and relic handling; formations; Aggressive, Defensive, Stand Ground, Passive and No Attack stances; patrol, attack-move, Guard and Follow commands; garrison/unload logic.
- **Present:** siege splash damage against nearby enemies; class-based armour upgrade rosters; selected unit attack bonuses; some technology effects applied to existing units/buildings and newly created units/buildings.
- **Present:** AI mixed attack groups, dedicated siege targets, siege-threat defensive priorities, critically wounded land-unit retreat/healing, and more purposeful War Galley target selection.
- **Partial:** unit upgrade lines, armour classes, attack bonuses, unique units, building roster and research coverage are subsets of AoE2 DE. Exact balance and complete class interactions are not established.
- **Gap:** a systematic complete upgrade-line/technology-cost/prerequisite audit; the full regional and DLC unit roster; architecture-set variety; a verified attack projectile/accuracy model at full reference fidelity.

### Maps, campaigns and victory conditions

- **Present:** seeded/procedural map layouts and sizes, fog of war, explored areas, minimap, land/water terrain diagnostics, start-position land connectivity checks, dock-site diagnostics, seed retries and campaign objectives/events.
- **Present:** Wonder victory (five-minute hold), relic victory (four-minute hold), Regicide, standard Town Centre victory, score victory with selectable 10-, 15-, 20-, 25- or 30-minute limits, and King of the Hill. Score is a Crown & Kingdoms-specific formula based on held resources, surviving units/buildings, age, researched technologies and stored relics; it is not claimed to match AoE2's exact scoring formula.
- **Present:** *The Golden Coast* and *The Strait's Last Relic*, alongside earlier campaign scenarios.
- **Partial:** map identities are procedural layouts rather than the complete hand-authored/random-map catalogue. Connectivity diagnostics are not proof that ships can navigate every route in a live game.
- **Present:** score/time-limit offers 10-, 15-, 20-, 25- and 30-minute durations. The selected duration drives the HUD countdown and winner/draw result and is preserved in settings and save slots.
- **Partial:** score calculation is a Crown & Kingdoms-specific formula, not AoE2 DE parity; score-mode duration and balance still need full-match testing.
- **Present / unverified:** King of the Hill has a carved land route from each starting position, a central landmark and minimap marker, AI hill targeting, and a five-minute uncontested military hold condition. End-to-end matches and route behaviour still need live gameplay validation.
- **Gap:** Sudden Death; a scenario editor; replay/spectator systems; broader campaigns, trigger tools and end-to-end mission validation; cheats, taunts and a complete chat system.

### Controller, graphics, audio and networking

- **Present:** controller-driven menus, contextual commands, radial menu, remappable gamepad controls, pause/resume, formations, minimap, selection UI, synthesised Web Audio and a performance overlay.
- **Present:** local SVG atlases for upright units, forces and buildings; four-direction animation metadata and team-colour variants; procedural fallbacks; original terrain/building drawing and local stone/wood textures.
- **Partial:** animation coverage and visual consistency still need in-game inspection. The atlas metadata check validates frame bounds, not whether a sprite is visually upright, correctly scaled or attractive at TV distance.
- **Partial / unverified:** `multiplayer.js` exists, but host/join, state synchronisation, reconnect, match-end and controller-only multiplayer flows need real network tests.
- **Gap:** physical Xbox checks for TV-safe layout, controller disconnect/focus recovery, large-army performance, pause/resume, save/load and campaign completion have not been replaced by static tests.

## 2. Highest-priority backlog

Work in small, independently testable changes. Keep `index.html` as the canonical app and preserve existing controls, save/load, pathfinding, fog, combat and fallbacks.

1. **Regression protection:** maintain the syntax/source checks; add a targeted regression test whenever a user-facing setting or game rule changes. Static checks must be labelled as such.
2. **Finish diplomacy:** central Enemy/Neutral/Ally relationships now feed hostile targeting, damage, manual attacks, AI priorities, naval target selection and elimination checks. Next: decide how diplomacy affects shared vision, resource access and ally victory; keep trade route eligibility distinct from hostility.
3. **Extend tribute:** the first pass sends 100 units of a selected resource to an ally, with affordability validation and notifications. Next add selectable quantities and richer transfer feedback before considering AI-initiated tribute.
4. **Extend villager automation:** worker target controls now cover Food, Wood, Gold and Stone; new villagers follow targets and manual orders override automation. Next add direct resource-site command support and validate drop-off/pathing edge cases.
5. **Command coverage:** Guard and Follow commands are now present for compatible friendly/ally targets, with garrison-capable target validation, guard interception and return-to-post. Next audit selection, group switching, formations, patrol, attack-move and edge cases.
6. **Victory modes:** selectable score limits and King of the Hill now exist in source with regression checks. Next add Sudden Death and broaden end-to-end tests for objectives, ties, elimination and all victory conditions.
7. **Technology and unit lines:** use data-driven checks to cover prerequisites, costs, research time, existing/new object effects, armor classes and counters. Add content only where its effects are implemented.
8. **Map and campaign reliability:** validate multiple seeds, player-start fairness, ship routes, dock construction, every campaign objective and every end condition.
9. **Art and performance:** visually inspect sprite anchors/orientation/layering and effects; test optional-asset fallbacks, pause behaviour and performance on target devices before claiming acceptance.


### Maintenance audit — 14 October 2026

- **Fixed CI test discovery:** the workflow previously listed each test file explicitly, creating a risk that new tests would exist locally but never run in GitHub Actions. It now discovers all `tests/*.test.mjs` files and fails if none exist.
- **Aligned contributor instructions:** the README uses the same test-discovery approach, while keeping the game-script syntax/invariant check and atlas validation explicit.
- **Kept the canonical game untouched in this maintenance pass:** changes are limited to workflow and documentation; no gameplay feature is marked complete by these housekeeping edits.
- **Next engineering gates remain:** Sudden Death, deeper technology/unit-line coverage, campaign/map end-to-end checks, and real browser/network/Xbox validation. Platform services explicitly excluded by the project remain out of scope.


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

## 3. Platform-service exclusions

Per project direction, do not spend time implementing Xbox achievements, Xbox cloud saves, Xbox presence/clubs, Smart Delivery, Xbox Play Anywhere, Xbox Cloud Gaming integration, Xbox-native matchmaking/ranked ELO, or platform cross-play without the required supported infrastructure. Browser-side game modes and local simulation features remain in scope. Do not confuse these exclusions with the separate task of verifying the existing `multiplayer.js` integration.

## 4. Automated validation

The GitHub Actions workflow `.github/workflows/game-regression.yml` runs `scripts/check-game.mjs`, discovers and executes **every** `tests/*.test.mjs` file automatically, then validates atlas metadata. This avoids a manually maintained list drifting out of sync when a new regression test is added. The checks cover:

- inline JavaScript syntax and key source invariants;
- population cap configuration;
- diplomacy relationship symmetry, hostility-aware target acquisition, AI targeting and save/load compatibility;
- allied tribute resource validation and transfer integration;
- villager target selection, new-worker automation, manual overrides and save/load persistence;
- score/time-limit victory calculation, selectable duration control, settings/save restoration, countdown and tie handling;
- King of the Hill route preparation, military presence rules, ally/neutral handling, contested resets, AI targeting, landmark/minimap visibility and save progress restoration;
- No Attack stance: autonomous targeting suppression, attack cancellation, direct-command rejection and feedback;
- Guard/Follow target validation, controller menus, simulation behaviour, post-combat return and manual-order overrides;
- trade routes and fishing economy;
- fish traps and technology effects;
- AI retreats, siege support, defensive threat priorities and naval targeting;
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
