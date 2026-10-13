# Crown & Kingdoms — V3 Master Upgrade Prompt
## For Claude — Xbox Series S / Microsoft Edge — Existing Single-File HTML RTS

**Repository:** https://github.com/johnstacey16-ui/crown-and-kingdoms  
**Current entry point:** `index.html`  
**Purpose:** Upgrade the existing game in place. This is an engineering brief, not permission to throw away the game and start over.

---

## 1. Your role and operating rules

Act as a senior browser-game engineer, RTS systems architect, rendering engineer, performance specialist, and QA reviewer.

Before changing code:
1. Read the entire current `index.html`, not just the opening section.
2. Map the current architecture: game loop, world/map, rendering, units, buildings, economy, combat, AI, pathfinding, input/gamepad, menus, pause/resume, save state (if present), audio, and UI.
3. Identify actual bugs and dependencies from the code. Do not invent mechanics or claim a feature exists unless you find it.
4. Produce a concise audit grouped by **Critical / High / Medium / Low**, with file locations or function names and a reason for each finding.
5. Make changes in small, verifiable phases. Keep a working build after every phase.

**Do not rebuild from scratch. Do not replace the game with a demo, mock-up, static screenshot, framework migration, or unrelated new game.** Preserve and improve the existing game.

## 2. Hard platform constraints

The target is **Xbox Series S running the game in Microsoft Edge**.

- Single self-contained HTML file is the delivery format. Keep CSS and JavaScript embedded.
- Do not require a build step, package manager, server-side runtime, external JavaScript library, external asset download, WebGL, or mouse/keyboard to play.
- The game must be fully playable with an Xbox controller. Do not require mouse input or WASD.
- Keep gamepad support resilient to disconnect/reconnect and browser focus changes.
- Use large readable UI, safe margins, clear focus/selection feedback, and controller-friendly navigation.
- Avoid browser APIs or features that are unreliable in console Edge. Feature-detect optional capabilities and provide safe fallbacks.
- Keep the page responsive to resize and different display resolutions. Do not assume a desktop mouse exists.
- Do not claim that you physically tested on Xbox unless you actually did. Clearly distinguish code inspection, automated checks, and real-device testing.

## 3. Preserve existing working content

The current code is an existing 2D HTML Canvas RTS with game systems already implemented. Audit the live code and preserve working systems, including as applicable:
- Existing map/world and camera behaviour.
- Current unit and building definitions, combat, resources, production, construction, upgrades, and AI.
- Existing civilization and age content; preserve the current **14 civilizations and four ages** unless the code audit proves that this count was inaccurate.
- Existing naval units and water gameplay, trade/market, relics, farms, repairs, resource piles, and other implemented systems.
- Current UI, gamepad bindings, sound, pause/menu flow, minimap, fog of war, selection, and command logic.
- Existing balance values unless a change is necessary to fix a proven bug or is explicitly introduced as a documented balance change.

Do not silently remove, rename, simplify, or disable a working feature to make an upgrade easier. Maintain compatibility with existing state/data wherever applicable.

## 4. Reliability and correctness come first

Audit and repair:
- Runtime exceptions, undefined references, stale state, incorrect initialization, and event listeners that are registered repeatedly.
- Pause/resume and menu transitions. Pressing **B while paused should resume/unpause the game**, not unexpectedly return to the main menu. Keep a deliberate, consistent back/cancel action elsewhere.
- Gamepad button mapping, edge-triggered versus held input, button-repeat behaviour, focus loss, disconnect/reconnect, and accidental repeated actions.
- Unit selection, multi-selection, commands, production queues, resource gathering, building placement, combat targeting, and win/loss conditions.
- Pathfinding deadlocks, units stuck on obstacles, invalid destinations, movement jitter, and expensive recalculation.
- AI loops, runaway entity creation, duplicated orders, invalid economy states, and team/faction ownership errors.
- Canvas resizing, device pixel ratio, coordinate transforms, UI hit areas, camera bounds, and minimap interactions.
- Timer/delta-time stability, visibility changes, long frames, and pause-state correctness.
- Memory leaks, unbounded arrays, excessive particles, and unnecessary per-frame allocations.

Use defensive guards only where they solve a real failure. Do not hide errors with blanket try/catch blocks or silently ignore failures.

## 5. Visual upgrade — measurable improvement, not just more effects

The goal is a richer, clearer RTS presentation while preserving the current Canvas architecture and console performance.

Audit the renderer and improve it in controlled steps:
- Stronger terrain variation, readable biomes, coherent ground tiles, coastlines, cliffs/elevation cues where supported, and visually distinct water.
- More convincing buildings with silhouettes, layered shapes, roofs, shadows, faction/civilization colour accents, and age-appropriate visual differences where feasible.
- Better unit silhouettes, team-colour identification, facing/animation states, and visual distinction between civilian, infantry, ranged, cavalry, siege, and naval units.
- Smooth movement and animation that remain deterministic and inexpensive.
- Improved trees, mines, farms, shorelines, resource piles, projectiles, impacts, combat feedback, selection rings, health bars, construction progress, and destruction states.
- Better lighting/depth cues, restrained shadows, terrain detail, UI hierarchy, typography, icons, minimap legibility, and readable combat feedback.
- Avoid visual clutter. Gameplay readability and contrast beat decorative effects.
- Use procedural Canvas drawing or embedded lightweight assets where appropriate. Do not pretend procedural drawings are professionally authored sprite sheets.
- If adding sprites, pack them efficiently and keep assets embedded/self-contained. Do not introduce broken remote URLs or licensing uncertainty.
- Keep rendering separated from simulation logic so visual improvements do not destabilize game rules.

**Important honesty rule:** Do not promise “true 4K graphics” or AAA/AoE2-quality art merely by changing canvas resolution. Aim for crisp scaling, coherent art direction, better silhouettes, animation and detail within the actual Canvas constraints. Do not render the whole world at native 4K if it causes performance loss.

## 6. Sound and feedback

Inspect existing audio before changing it. Preserve working sounds. Improve audio feedback only where useful:
- Distinct, restrained cues for selection, command acknowledgement, construction, completion, combat, warnings, and important state changes.
- Respect browser audio activation restrictions; initialize audio after a valid user gesture.
- Add master/music/effects controls only if they can be integrated reliably.
- Avoid continuous loud loops, repeated sound creation, clipping, and excessive simultaneous voices.
- The game must remain playable if audio is blocked or unavailable.

## 7. RTS gameplay and AI roadmap

First stabilise the current player-versus-enemy experience. Then design an incremental path to **four teams/kingdoms with up to 100 units per team (400 total)**. This is a target to engineer and benchmark, not permission to set the unit cap blindly or claim performance without measurement.

For multiple kingdoms:
- Every entity must have explicit owner/team identity; never assume there are only two sides.
- Audit ally/enemy checks, target selection, damage, diplomacy/team relationships, fog of war, resource ownership, building ownership, AI threat evaluation, and win/loss rules for N-team correctness.
- Give each AI kingdom a stable economic and military loop, expansion priorities, defence, army composition, scouting, and attack/retreat decisions appropriate to the existing systems.
- Prevent allied units from attacking each other unless the game rules explicitly allow it.
- Avoid every AI performing expensive full-map/full-unit scans every frame. Use staggered thinking intervals, spatial buckets/grids, cached queries, and event-driven updates where beneficial.
- Ensure pathfinding and combat remain usable with hundreds of units. Use flow fields, shared path requests, waypoint reuse, or other measured optimisations where suitable; do not introduce a complex system without validating it.
- Add clear team colours and readable map/UI indicators for all four teams.
- Preserve existing gameplay while implementing multi-team support behind safe, testable milestones.

## 8. Performance budget and profiling

Xbox Series S Edge performance is the priority. Use the current code as a baseline and measure before/after using repeatable in-game scenarios.

- Aim for stable 30 FPS minimum and preferably 60 FPS during normal play, while recognising actual results depend on the device and scene.
- Use a fixed or bounded simulation timestep with a capped catch-up step count. Avoid the “spiral of death” after a long frame.
- Separate simulation update and rendering when appropriate.
- Cache static terrain/layers and reusable drawing work where safe.
- Reduce object creation, repeated pathfinding, full-array scans, redundant canvas state changes, and overdraw.
- Use a spatial index for nearby-unit/target queries if profiling shows it is needed.
- Cap or pool particles/projectiles and clean up expired entities.
- Respect browser tab visibility and pause/resume without huge simulation jumps.
- Add an optional lightweight debug overlay for FPS, frame time, unit count, AI update time, and pathfinding activity; keep it off by default or easy to toggle.
- Do not reduce simulation correctness or silently lower unit counts just to improve the FPS figure.

## 9. Controller-first UX

Audit all actions and make the full game navigable with the Xbox controller:
- Title screen, settings, pause menu, confirmation dialogs, build/technology menus, production queues, unit selection, command choices, minimap/camera navigation, and end-game screens.
- Clear focus state, sensible navigation order, consistent confirm/cancel behaviour, and no mouse-only controls.
- Avoid requiring tiny precision targets. Provide dead zones, stick repeat timing, and button edge detection appropriate to menus versus gameplay.
- Explain controls in-game with a concise controller legend.
- Prevent accidental double activation and ensure pause truly pauses simulation, AI, animations where appropriate, and timers.

## 10. Save/load and persistence

Audit existing persistence before adding anything. If save/load is absent or broken, propose and implement it only after core stability:
- Use versioned, validated serialisable state.
- Handle storage quota, malformed/old saves, and unavailable storage safely.
- Do not serialise transient canvas objects, contexts, functions, or cyclic references.
- Preserve team, units, buildings, resources, age, queues, map seed/state, and other gameplay-critical data.
- Provide a clear error/recovery path. Never corrupt the only valid save because a new schema fails.

## 11. Required workflow and deliverables

Work in this order:

**Phase 0 — Baseline audit**
- Read all of `index.html`.
- Return architecture map, critical bugs, existing systems inventory, performance risks, and a regression checklist.
- Do not begin a large rewrite before reporting the audit.

**Phase 1 — Critical reliability**
- Fix crashes, input/menu/pause defects, ownership bugs, and other confirmed critical issues with minimal changes.
- Preserve gameplay and test each fix.

**Phase 2 — Performance foundation**
- Profile the existing loop and fix proven hot paths without changing game rules.
- Record scenario, unit count, approximate FPS/frame time, and device/testing limitations.

**Phase 3 — Visual and audio polish**
- Upgrade renderer and feedback in small layers. Include before/after descriptions and confirm no system was removed.

**Phase 4 — Multi-kingdom architecture**
- Refactor two-team assumptions into explicit team relationships, then introduce four-team AI in stages.
- Test ally/enemy logic and win/loss conditions before raising entity counts.

**Phase 5 — Scale and regression**
- Stress test progressively (for example 50, 100, 200, 300, then 400 units), recording results instead of guessing.
- Check selection, movement, combat, economy, naval systems, pause/resume, controller-only navigation, audio, and save/load.
- Fix the highest-impact bottleneck before adding more visual effects.

For every phase, provide:
1. What was inspected.
2. Exact defects found and evidence.
3. Minimal implementation plan.
4. Code changes made and why.
5. Tests actually run and results.
6. Known limitations and next phase.
7. A complete, runnable updated single-file `index.html` when code delivery is requested.

Do not output placeholders, omitted sections, “rest of code unchanged,” or pseudocode in place of the complete file. If the full file exceeds one response, split it into clearly numbered consecutive parts and ensure the combined result is complete and syntactically valid.

## 12. Definition of done

A phase is complete only when:
- The game starts without a new console/runtime error.
- Existing core gameplay remains available.
- Xbox controller-only play still works.
- Pause/resume and B-button behaviour are correct.
- No new unhandled exceptions or broken references are introduced.
- Relevant test scenarios are described honestly.
- Performance claims are tied to measurements or explicitly labelled as untested.
- The next step is clear and does not require rebuilding the project from scratch.

**Start now with Phase 0: inspect the actual repository `index.html` in full and return the baseline audit. Do not jump directly into a giant rewrite.**
