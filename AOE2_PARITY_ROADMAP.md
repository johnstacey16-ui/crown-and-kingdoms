# Crown & Kingdoms — AoE2: DE-style parity plan

This is a living implementation checklist for the Xbox Series S / Microsoft Edge target. The aim is a complete, controller-first RTS inspired by the broad systems of Age of Empires II: Definitive Edition, using original code and assets. This is not a claim of exact engine, art, balance, or content parity.

## Current implementation status (source audit, 2026-10-14)

Legend: **Present** = code exists; **Partial** = a simplified or incomplete implementation; **Unverified** = needs actual gameplay testing on Xbox Edge.

### Core match loop
- [x] Four broad ages, resources, villagers, buildings, military units, production queues and research.
- [x] Fog of war, minimap, pathfinding, combat, population limit, construction, repair, save/load and multiple victory modes.
- [x] 2–4 rival kingdoms with civilization selection and difficulty/personality options.
- [~] Economy and technology balance is simplified; technology effects must be audited one by one against the intended design.
- [~] Unit roster, armor classes, attack bonuses and civilization bonuses are a subset/simplification of AoE2 DE.
- [ ] Diplomacy, selectable teams/alliances, treaty states and allied victory.
- [ ] Full, systematic audit of death, retreat, target acquisition, stuck units, pathfinding edge cases and queue failure handling.
- [ ] Repeatable automated smoke tests for new game, each victory condition, save/load, and campaign transitions.

### Xbox controller and interface
- [x] Gamepad input, controller navigation, contextual commands, pause menu, formations, minimap and controller-first setup menus exist.
- [~] Multi-unit selection and command behavior needs systematic parity and accessibility testing.
- [ ] Verify every menu and command using only an Xbox controller at TV distance.
- [ ] Verify pause/resume, focus loss, disconnect/reconnect and browser refresh behavior on Xbox Edge.

### Economy, construction and technology
- [x] Food/wood/gold/stone gathering, drop-off buildings, farms with automatic reseeding, market trading and resource upgrades.
- [x] Farm capacity technology effects: Horse Collar adds 75 food, Heavy Plow adds 125, Crop Rotation adds 175; new and reseeded farms use the researched capacity. Auto-reseed costs 60 wood.
- [x] Building and unit production queues, age advancement, blacksmith and civilization research.
- [~] Research coverage/effects are incomplete or simplified compared with the full AoE2 technology tree.
- [~] Farm food capacity, trade prices, repair/build rates and several upgrades need an explicit effect audit.
- [ ] Verify economic loops for every resource, including depletion, no-route cases, farm reseeding and AI economy recovery.

### Military and AI
- [x] Melee/ranged units, siege, ships, monks/relics, formations, defensive structures and basic attack waves.
- [x] AI production adapts to some player army composition; multiple rival AI slots exist.
- [~] AI strategy, army composition, counter-unit logic, target priorities, retreat, naval play and siege use remain simplified.
- [ ] Systematically test each unit counter and technology interaction.
- [ ] Verify 2-, 3- and 4-kingdom games on every difficulty and confirm no rival becomes inert.

### Maps and scenarios
- [x] Random and seeded layout presets, four map sizes, terrain/resource generation, fog and campaign objectives/events.
- [~] Fixed layouts are seeded procedural maps, not hand-authored maps with the variety and generation rules of AoE2 DE.
- [~] Campaign paths and missions exist, but campaign breadth, scripted objectives, triggers and balance are far below a full DE campaign catalogue.
- [ ] Add proper scenario scripting primitives and validate every mission from start to victory/defeat.
- [ ] Add more distinct map-generation rules, starting-position fairness checks, terrain connectivity checks and naval map validation.

### Art, animation, audio and performance
- [x] Custom canvas/isometric renderer, original procedural building/terrain art, unit atlas, animation, effects and synthesized audio.
- [~] Visual variety and unit/building animation coverage remain below a shipped commercial RTS.
- [ ] Test worst-case unit counts, large maps, fog/minimap cost and long-running matches on Xbox Series S Edge.
- [ ] Verify asset loading and a graceful fallback if any optional asset fails.

### Online play
- [~] Multiplayer integration code is loaded separately; reliability and full feature coverage are unverified.
- [ ] Verify host/join, disconnect/rejoin, state synchronization, match end, and controller-only navigation in a real network test before calling online play complete.


- [x] Farm ownership is now recorded for player- and AI-built farms; Horse Collar, Heavy Plow and Crop Rotation capacity increases only affect farms owned by the researching kingdom. The reseed notification now matches the 60-wood cost. Source syntax check passed; live gameplay remains unverified.


- [x] Added a Node.js source-check script and GitHub Actions workflow to parse inline JavaScript and guard the farm-capacity/ownership/reseed fixes against regression. This is static validation, not a substitute for browser or Xbox gameplay testing.


- [x] Combat armour audit: Blacksmith infantry armour now applies through an explicit infantry roster, and archer armour through an explicit ranged roster, including selected unique units. Automated source checks cover both rosters and the damage formula. Exact AoE2 balance and in-match behaviour still require playtesting.

## Implementation order

1. **Stability and testability:** protect the last working build; syntax checks plus runtime smoke tests; resolve any black-screen or stuck-game regressions first.
2. **Core simulation parity:** economy/tech effects, unit stats and counters, production queues, pathfinding, construction/repair, save/load, victory conditions.
3. **Xbox control parity:** selection groups, reliable command context, rally/queue/formation flows, readable TV-scale UI, pause and focus recovery.
4. **AI and skirmish depth:** viable economy, age-up, counter production, coordinated attacks, defense, siege, naval behavior, and multi-opponent verification.
5. **Map and campaign depth:** fair map generation, meaningful scenarios, objective/trigger tooling, campaign progression and balance.
6. **Presentation and performance:** original detailed art/animation, readable effects, audio, profiling and real Xbox Edge validation.
7. **Online and finishing:** only after local simulation and controller flows are reliable.

## Recent implementation note

- Commit `ff0f677`: Treadmill Crane research now increases villager construction progress by 20%.
- Commit `d7900be`: Added Crop Rotation to the mill research list and implemented Horse Collar / Heavy Plow / Crop Rotation as farm food-capacity upgrades instead of harvest-rate multipliers.
- Commit `3c5cd9e`: Automatic farm reseeding now uses the researched farm capacity and costs 60 wood.
- Syntax validation passed for the inline JavaScript after this change. This is not a substitute for a live gameplay test.


- [x] Follow-up armour roster correction: added Longbowmen and Mangudai to ranged armour; kept Throwing Axemen and Gbeto under infantry armour and removed melee Mamelukes from the ranged list. Source-level roster checks updated; this corrects classification coverage but does not establish full AoE2 DE balance.

- [x] Siege splash fix: splash now damages nearby enemy units and buildings, not the target's own team; dead/loaded units are excluded. Source syntax and regression assertions added. Gameplay balance and impact radius still require live match testing.
