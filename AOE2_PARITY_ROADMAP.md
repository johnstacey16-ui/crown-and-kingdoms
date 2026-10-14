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
- **Gap:** a complete tribute interface and rules; full villager resource-priority automation, auto-assignment and resource-site-specific commands.

### Combat, units and buildings

- **Present:** melee, ranged, siege and naval units; monks and relic handling; formations; Aggressive, Defensive, Stand Ground and Passive stances; patrol and attack-move commands; garrison/unload logic.
- **Present:** siege splash damage against nearby enemies; class-based armour upgrade rosters; selected unit attack bonuses; some technology effects applied to existing units/buildings and newly created units/buildings.
- **Present:** AI mixed attack groups, dedicated siege targets, siege-threat defensive priorities, critically wounded land-unit retreat/healing, and more purposeful War Galley target selection.
- **Partial:** unit upgrade lines, armour classes, attack bonuses, unique units, building roster and research coverage are subsets of AoE2 DE. Exact balance and complete class interactions are not established.
- **Gap:** a systematic complete upgrade-line/technology-cost/prerequisite audit; reliable Guard and Follow commands; No Attack as a distinct stance; the full regional and DLC unit roster; architecture-set variety; a verified attack projectile/accuracy model at full reference fidelity.

### Maps, campaigns and victory conditions

- **Present:** seeded/procedural map layouts and sizes, fog of war, explored areas, minimap, land/water terrain diagnostics, start-position land connectivity checks, dock-site diagnostics, seed retries and campaign objectives/events.
- **Present:** Wonder victory (five-minute hold), relic victory (four-minute hold), Regicide and the standard Town Centre victory. These conditions are separate from full AoE2 rulesets.
- **Present:** *The Golden Coast* and *The Strait's Last Relic*, alongside earlier campaign scenarios.
- **Partial:** map identities are procedural layouts rather than the complete hand-authored/random-map catalogue. Connectivity diagnostics are not proof that ships can navigate every route in a live game.
- **Gap:** Score victory, King of the Hill, Sudden Death and time-limit victory; a scenario editor; replay/spectator systems; broader campaigns, trigger tools and end-to-end mission validation; cheats, taunts and a complete chat system.

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
3. **Tribute and resource transfers:** add controller-friendly amount selection, affordability checks, clear notifications and AI-safe validation. Gate transfers by the implemented diplomacy relationship rules.
4. **Villager automation:** create a priority-setting system that affects idle villagers and newly trained villagers; show current assignments clearly and allow a manual override. Add resource-site orders without breaking standard gather/drop-off behaviour.
5. **Command coverage:** audit selection, group switching, formations, patrol, attack-move, guard/follow, garrison and passive/no-attack semantics; add controller regression coverage.
6. **Victory modes:** implement one mode at a time with explicit setup options, in-match state, AI participation, UI progress and tests for both player wins and losses.
7. **Technology and unit lines:** use data-driven checks to cover prerequisites, costs, research time, existing/new object effects, armor classes and counters. Add content only where its effects are implemented.
8. **Map and campaign reliability:** validate multiple seeds, player-start fairness, ship routes, dock construction, every campaign objective and every end condition.
9. **Art and performance:** visually inspect sprite anchors/orientation/layering and effects; test optional-asset fallbacks, pause behaviour and performance on target devices before claiming acceptance.

## 3. Platform-service exclusions

Per project direction, do not spend time implementing Xbox achievements, Xbox cloud saves, Xbox presence/clubs, Smart Delivery, Xbox Play Anywhere, Xbox Cloud Gaming integration, Xbox-native matchmaking/ranked ELO, or platform cross-play without the required supported infrastructure. Browser-side game modes and local simulation features remain in scope. Do not confuse these exclusions with the separate task of verifying the existing `multiplayer.js` integration.

## 4. Automated validation

The GitHub Actions workflow `.github/workflows/game-regression.yml` runs Node-based checks for:

- inline JavaScript syntax and key source invariants;
- population cap configuration and diplomacy state/targeting;
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
