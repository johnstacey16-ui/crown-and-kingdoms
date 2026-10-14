# Crown & Kingdoms — Graphics, Sprites & Audio Upgrade Prompt

Repository: https://github.com/johnstacey16-ui/crown-and-kingdoms  
Target: Xbox Series S running Microsoft Edge; controller-first; single HTML game with multiplayer.js.

Act as a senior browser RTS engineer, technical artist, animation specialist and audio designer. Upgrade the existing game in place on main. This is an implementation task: inspect current code, make targeted edits, run available checks and report only verified results.

## Rules
- Fetch the latest main before editing. Preserve game loop, isometric transforms, gameplay, economy, combat, pathfinding, fog of war, minimap, controller mappings, save/load and multiplayer.
- Do not rewrite the game from scratch or remove working systems.
- Prefer small, reviewable edits and keep procedural drawing as fallback.
- Use original or properly licensed artwork/audio; do not copy proprietary Age of Empires II assets.
- Do not introduce paid APIs, keys, tracking, mandatory external dependencies or mouse-only controls.
- Never claim deployment, browser or physical Xbox testing unless actually performed.

## Phase 0: Audit
Map the render pipeline, asset atlas schema, unit state/direction animation, building renderer, audio system, settings, performance overlay and deployment setup. Record baseline simulation/render timings and note testing limitations. Continue into implementation rather than stopping at a plan.

## Phase 1: Better polygons and materials
Improve existing terrain, building and object geometry with consistent light direction, bevel highlights, deeper shadows, layered roof planes, stone courses, timber grain, roof seams, doors, windows, battlements and recognisable silhouettes. Improve trees, rocks and resource piles. Maintain readability and preserve collision, footprint, placement and navigation. Cache static textures and geometry; avoid expensive per-frame effects.

## Phase 2: Real sprites and images
Build on the existing atlas loader. Start with a complete vertical slice: villager, infantry, archer, one economic building, one military building, tree and rock. Use a cohesive original hand-painted/isometric medieval style, transparent backgrounds, proper directional views, animation frames and correct feet anchors. Validate atlas dimensions and metadata instead of assuming a generated sheet is correctly sliced. Preserve team colours, selection rings, health bars, fog-of-war rules and procedural fallback. Prefer local repository assets with clear filenames and licensing notes.

## Phase 3: Effects
Add restrained, event-driven construction, gathering, projectile, impact and destruction effects only where the existing game has corresponding states. Bound particles, avoid visual clutter and hidden-enemy leaks, and freeze or stop effects appropriately when paused.

## Phase 4: Audio
Build on the current Web Audio engine. Provide distinct UI, selection, movement, gathering, construction, melee, bow, siege, damage, death, victory and defeat sounds where matching events exist. Use original/licensed assets or procedural synthesis. Reuse AudioContext, throttle repetitive sounds, limit voices, obey autoplay restrictions, preserve volume settings, and make music/ambience optional. Audio failures must never stop gameplay.

## Phase 5: Xbox performance
Preserve Gamepad API polling, reconnect handling, controller mappings and controller-only operation. Avoid per-frame allocations, repeated decoding, huge shadows, unbounded particles and audio voice storms. Use performance overlay measurements; do not promise 60 FPS without measurements from the target environment.

## Phase 6: Regression checks
Check syntax, asset metadata, missing-asset fallbacks, unit/building rendering, animations, gathering/combat sound triggers, pause/resume, settings, fog, minimap, save/load, multiplayer, controller navigation, console/network errors and before/after performance. Separate static checks from browser, deployment and physical Xbox testing.

## Order
1. Audit baseline.
2. Improve shared polygon/material helpers.
3. Polish representative buildings and environmental objects.
4. Validate and integrate the existing sprite atlas format.
5. Add a small complete sprite pack with fallbacks.
6. Integrate animations and event-driven effects.
7. Refine audio and volume behaviour.
8. Test regressions and performance.
9. Expand only after the vertical slice is stable.
10. Commit targeted changes to main and verify deployment if access permits.

## Definition of done
A visibly improved medieval presentation, validated image assets where integrated, safe fallbacks, event-driven sound, preserved controller/gameplay/save/multiplayer behaviour, measured performance and a truthful report with changed files, commit, tests and unresolved issues. Do not return only a plan.