# Crown & Kingdoms V3 — Phased Claude Prompts
## Run one prompt at a time against the existing `index.html`

**Repository:** https://github.com/johnstacey16-ui/crown-and-kingdoms  
**Platform:** Xbox Series S + Microsoft Edge  
**Rule:** Keep the game a self-contained single HTML file. Preserve the existing game; do not rebuild from scratch.

Paste each prompt into Claude separately, attaching/providing the current complete `index.html`. After a phase, review the result and use the latest verified HTML as the input for the next phase. Never run all phases as one uncontrolled rewrite.

---

## PROMPT 1 — Full audit only (no code edits yet)

You are the senior engineer auditing my existing Crown & Kingdoms browser RTS. Read the entire attached/current `index.html`. Do not rewrite it and do not make code changes in this phase.

Target: Xbox Series S running Microsoft Edge. The game must be controller-first; no mouse or WASD requirement. It must remain a self-contained HTML file with embedded CSS/JavaScript and no required build step or external libraries.

Return:
1. A map of the actual architecture: game loop, canvas renderer, map/camera, units/buildings, economy, combat, AI, pathfinding, controller input, UI, audio, pause/menu, persistence.
2. Inventory of existing features that must be preserved, including existing civilizations/ages and naval/economic systems actually found in the code.
3. Findings grouped Critical / High / Medium / Low, with exact function/section names and evidence.
4. Likely performance bottlenecks, distinguishing proven issues from hypotheses.
5. A regression test checklist.
6. A phased repair plan with the smallest safe changes first.

Do not invent features, claim tests were run when they were not, or start a rewrite. End by asking me to approve Phase 2.

---

## PROMPT 2 — Critical bug and controller repair

Using the latest complete HTML and the approved audit, fix only confirmed Critical/High reliability bugs. Preserve the existing design, game rules, unit definitions, civilizations, ages, and working features.

Priorities:
- Fix runtime errors and broken references.
- Fix pause/resume and menu navigation. In particular, pressing **B while paused must resume/unpause**, not unexpectedly send the player to the main menu. Keep back/cancel behaviour consistent in other contexts.
- Check gamepad input edge detection, held-button repeats, disconnect/reconnect, focus loss, menu focus, accidental double activation, and controller-only navigation.
- Check selection, commands, construction, production, combat, resources, and AI state transitions for bugs found in the audit.
- Ensure pause stops the intended simulation systems and resume does not cause a large delta-time jump.
- Keep all existing features unless a specific removal is approved.

Make minimal, local changes; do not redesign the renderer or introduce multi-team architecture yet. Return a complete runnable `index.html`, not a diff alone. Include a change log, tests actually run, and untested Xbox-specific risks. If the audit does not support a proposed fix, do not make it.

---

## PROMPT 3 — Performance foundation

Start from the latest verified Phase 2 HTML. Do not change game balance or remove features merely to improve FPS.

Measure or inspect the actual update/render loop and identify expensive work. Prioritise:
- Bounded delta time and safe catch-up after long frames.
- Avoiding unnecessary per-frame allocations and duplicate event listeners.
- Caching static terrain/layers where correct.
- Reducing redundant drawing/state changes.
- Staggering AI decision updates instead of running every expensive decision every frame.
- Avoiding repeated full-map/full-unit scans and repeated pathfinding when a safe cache/index is appropriate.
- Pooling/capping short-lived particles/projectiles if they are a demonstrated cost.
- Correct visibility-change and pause/resume behaviour.

Add an optional lightweight diagnostics overlay for FPS/frame time, unit count, and expensive AI/pathfinding work only if it can be implemented without disrupting play. Do not claim real Xbox FPS without actual device measurements. Report the test scenario, entity count, measurements, and limitations. Deliver the complete single-file HTML.

---

## PROMPT 4 — Graphics, animation and sound polish

Start from the latest verified HTML. Improve the existing Canvas renderer; do not migrate frameworks, add WebGL, require remote assets, or replace the game with a visual demo.

Improve visual clarity and art direction in layers:
- Terrain/biome variety, water/coastlines, resource silhouettes and readable ground detail.
- Buildings with clearer silhouettes, layered roofs, depth cues, faction accents and useful age variation.
- Distinct silhouettes and team colours for villagers, infantry, ranged units, cavalry, siege, and ships.
- Smooth, low-cost movement/animation and clear facing/attack states where feasible.
- Better selection indicators, health/progress bars, projectiles, impacts, construction/destruction feedback, minimap and readable UI.
- Restrained shadows, lighting cues and particles; readability and performance take priority over decoration.
- Crisp canvas scaling and appropriate device-pixel-ratio handling without blindly rendering the full world at 4K.

Inspect and preserve existing audio. Add or improve useful sound feedback only where reliable, respecting browser audio activation restrictions and offering graceful silent fallback. Do not add broken remote asset links.

Do not describe procedural art as professional sprite art or promise AAA/AoE2 parity. Explain exactly what improved and what remains limited. Deliver complete HTML and regression results.

---

## PROMPT 5 — Four-kingdom architecture and AI

Start from the latest stable, tested HTML. First audit every two-team assumption before changing it. Do not raise the unit cap before ownership and combat logic are team-safe.

Introduce explicit team/faction identity and centralise ally/enemy relationship checks. Audit:
- Target acquisition, damage, friendly fire, selection, command ownership and AI threats.
- Resource/building ownership, fog of war, scouting and minimap indicators.
- Economy, production, expansion, defence, army composition, attack/retreat logic and team-specific victory conditions.
- Naval units and all existing systems for hidden two-side assumptions.
- Team colours and UI clarity for player plus three AI kingdoms.

Implement one controlled step at a time: first team-neutral logic, then three/four-team scenarios, then AI behaviour. Avoid expensive all-unit scans every frame; use staggered decisions and spatial indexing only where justified. Preserve the current player-versus-enemy game as a valid configuration.

Return the complete runnable HTML, a list of all two-team assumptions found and fixed, plus tests for allies, enemies, neutral entities (if supported), victory/defeat, and controller navigation. Do not claim all AI is complete if any kingdom is only decorative.

---

## PROMPT 6 — Scale test to 400 total units

Start only after four-team logic is stable. The target is four teams with up to 100 units each (400 total), not a guarantee that the current device will sustain any particular frame rate.

Stress-test incrementally at approximately 50, 100, 200, 300, and 400 units. For each run, record:
- Total units and distribution by team/type.
- Whether units move, pathfind, gather, fight, and respond to orders.
- FPS/frame time and test environment, when actually measurable.
- AI update and pathfinding bottlenecks.
- Memory growth, stuck units, command lag, and any exceptions.

Fix the largest measured bottleneck first. Do not fake benchmark numbers, silently reduce unit caps, disable meaningful AI, or sacrifice game rules to create an attractive FPS figure. Use spatial indexing, shared pathfinding, staggered AI ticks, bounded effects and other optimisations only when evidence supports them.

Keep a practical controller-friendly interface at high unit counts. Deliver the complete HTML and a truthful benchmark report; explicitly mark anything not tested on physical Xbox hardware.

---

## PROMPT 7 — Final regression and delivery

Audit the complete latest HTML against the original feature inventory and every approved phase. Do not add new features in this phase unless needed to fix a regression.

Verify or inspect:
- Game startup and restart.
- Xbox controller-only title/menu/gameplay/pause/settings/end screen.
- B while paused resumes the game.
- Camera, selection, multi-selection, commands, build placement, production and queues.
- Gathering, resource accounting, ages, technologies and market/trade if present.
- Combat, target ownership, allies/enemies, all four kingdoms and victory/defeat.
- Naval units, water interactions, repairs, relics, farms and other systems actually implemented.
- Fog of war, minimap, audio fallback, resize handling and save/load if present.
- Performance at progressively higher unit counts.

Return a severity-ranked issue list, a preserved-features checklist, test results separated into **actually tested / code-inspected / not tested**, known limitations, and the complete final single-file `index.html`. Never claim physical Xbox testing unless it occurred. No placeholders or omitted code.
