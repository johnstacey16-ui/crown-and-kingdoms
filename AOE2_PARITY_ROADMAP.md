# Crown & Kingdoms — Main Development Goals

**Target:** Controller-first browser RTS for Xbox Series S / Microsoft Edge.

This is the single gameplay roadmap. The eight goals below define the work required to complete the game. Mark a goal complete only when its acceptance requirements have been tested; source code or a passing unit test alone is not proof of complete gameplay.

## 1. Campaigns — all 19 missions

- [ ] Play every mission from its briefing through a real victory or defeat.
- [ ] Verify every primary and secondary objective, including objectives that depend on living units or destroyed buildings.
- [ ] Verify timed events fire at the correct time and only as intended.
- [ ] Verify victory/defeat conditions, campaign saves, mission unlocking and next-mission progression.
- [ ] Fix softlocks, unreachable objectives, impossible scenarios and incorrect mission text.

## 2. AI strategy

- [ ] Build a sustainable economy and rebalance workers as resource needs change.
- [ ] Choose useful units and mixed armies based on enemy composition and available resources.
- [ ] Research appropriate technologies at sensible times.
- [ ] Improve scouting, defence, attack timing, target selection, retreats and siege use.
- [ ] Improve naval production, fleet composition, escorting, target choice and retreat/repair behaviour.
- [ ] Test multiple rival kingdoms in full-length matches without cheats or resource/damage bonuses.

## 3. Technology effects

- [ ] Audit every technology against its stated cost, age, prerequisites and intended effect.
- [ ] Verify effects during gameplay, including effects on existing units and newly created units where relevant.
- [ ] Check upgrade stacking, duplicate research prevention, UI state, AI valuation and save/load persistence.
- [ ] Correct technologies that are ineffective, incorrectly applied, or applied to the wrong unit/building classes.

## 4. Naval systems and maps

- [ ] Test land and naval pathfinding across narrow passages, islands, coastlines and blocked routes.
- [ ] Verify ships can reach valid shore targets, docks and repair locations.
- [ ] Test ship target acquisition, combat, retreat, repair and transport interactions.
- [ ] Validate generated and fixed maps for connected starts, reachable resources and usable shore access.
- [ ] Handle maps with isolated or inaccessible resources without stuck units or broken objectives.

## 5. Graphics and kingdom readability

- [ ] Improve unit silhouettes, weapons, armour, equipment and movement/attack/death animations.
- [ ] Make buildings distinct, properly scaled and recognisable by age and function.
- [ ] Improve terrain, coastlines, water, trees, resource nodes, shadows and visual layering.
- [ ] Keep kingdom colours and selected/hostile/allied states clear at normal gameplay zoom.
- [ ] Preserve procedural fallbacks when local art assets fail to load.

## 6. Performance — including Xbox Series S

- [ ] Benchmark quiet economy, pathfinding, large armies, dense combat, naval scenes and fog-of-war-heavy maps.
- [ ] Test 100-, 200- and 400-unit workloads, plus larger stress tests where useful.
- [ ] Measure simulation time, rendered frame time, memory and controller-input latency separately.
- [ ] Profile the real browser renderer, not only Node-based simulation tests.
- [ ] Test on a physical Xbox Series S in Microsoft Edge and record measured results. Do not infer console performance from desktop or CI timings.
- [ ] Fix measured bottlenecks without breaking simulation correctness or controller responsiveness.

## 7. Multiplayer reliability

- [ ] Ensure the host is the authority for shared match state.
- [ ] Test host and guest disconnects, reconnect attempts, stale presence and unexpected channel closure.
- [ ] Ensure match termination and results are consistent when the host or a participant leaves.
- [ ] Prevent clients from continuing a match with divergent state or reporting a false successful result.
- [ ] Clearly distinguish implemented networking from any still-prototype functionality.

## 8. Final verification and documentation

- [ ] Run the complete regression suite against the latest main-branch commit.
- [ ] Fix every reproducible failure and rerun the affected tests and full suite.
- [ ] Complete the 19-mission campaign playthrough and the AI, technology, map, naval and save/load checks.
- [ ] Verify multiplayer behaviour in live sessions.
- [ ] Complete browser testing and physical Xbox Series S / Edge performance testing.
- [ ] Update the README and this roadmap to describe actual results, remaining defects and verified limitations.
- [ ] Report the exact tested commit and distinguish automated results from live gameplay and hardware results.

## Audit findings and implementation status (16 October 2026)

This register consolidates the recent parity audit so findings do not keep cycling back into new checklists. A source-level correction is not a claim of verified match balance or Xbox performance.

### Corrected in the current implementation batch
- **Farm durability and construction:** farms now have 480 HP, cost 60 wood and take 15 seconds to build; the former 1-HP, instant-build definition was not viable.
- **Castle Age prerequisites:** eligible Feudal buildings are the barracks, archery range, stable, blacksmith, market and dock. The existing age-research rule requires two distinct eligible buildings, rather than allowing walls, gates, towers and outposts to satisfy progression.
- **Trebuchet minimum range:** trebuchets now declare a 3-tile minimum firing range and the combat command moves them back out of minimum range instead of trying to fire point-blank.
- **Spanish Supremacy:** the effect now improves villagers (+40 HP and +6 attack) instead of incorrectly improving Conquistadors.
- **Offline cache:** the optional atlas manifest was already removed from the required install cache in an earlier commit; do not re-open this as an outstanding defect unless the cache implementation changes.

### Confirmed existing behaviour from source inspection
- Town Centre and Castle arrow output already scales with garrisoned military units (up to the current cap).
- Siege splash damage already filters secondary targets to hostile units/buildings, so it does not intentionally damage allies through that splash loop.
- The game already has 26 civ definitions and multiple map layouts; “missing civs/maps” should mean parity and quality gaps, not that those systems are wholly absent.
- Multiplayer currently provides lobby/presence/markers rather than authoritative synchronized simulation. Treat it as a prototype, not completed multiplayer.

### Still open — requires implementation and/or gameplay evidence
- **Combat:** elevation/high-ground modifiers; verify all projectile and splash edge cases; test siege minimum range/packing as a complete controller command flow; audit armour classes and counter bonuses against every unit.
- **Technology:** add and implement missing economic, military, monk and naval technologies (including Loom, Wheelbarrow, Hand Cart, Ballistics, Squires and Arson) only with real effects, UI availability, AI valuation and save/load coverage. Do not add placeholder entries that appear researched but do nothing.
- **AI:** test full-length no-cheat matches for economy sustainability, scouting, mixed armies, counter adaptation, technology timing, retreat/repair, siege and naval decisions. Existing heuristics are not proof of competitive behaviour.
- **Scale/content:** raise the current four-kingdom and 200-population limits only after measuring memory, simulation time, rendering and controller latency; expand map sizes beyond the current 72–176 range with connectivity/resource validation.
- **Naval/maps:** verify islands, shore access, narrow channels, transport loading/unloading, ship repair and unreachable resource handling across generated and fixed layouts.
- **Graphics:** improve unit silhouettes/equipment/animation, distinct age-appropriate buildings, terrain and water layering, and kingdom readability while preserving procedural fallbacks.
- **Campaigns:** the 19 mission CI isolation jobs are automated regression evidence only; they do not prove full mission playthroughs, objective balance or progression.
- **Multiplayer:** implement the authoritative simulation protocol and explicit disconnect/host-loss behaviour before describing matches as synchronized.
- **Hardware:** browser and desktop checks cannot establish Xbox Series S / Edge performance. Record real console measurements separately.

## Implementation updates — 17 October 2026

The following changes are committed to `main` and covered by source-level regression tests; **they are not a substitute for campaign playthroughs, live multiplayer sessions, browser profiling or Xbox hardware verification**.

- **Production capacity:** training reserves population slots across live buildings, and completed units wait rather than exceeding the cap if housing is lost before spawning. Destroyed buildings no longer reserve slots.
- **AI economy:** housing forecasts include queued units; worker targets count queued villagers specifically, avoiding unnecessary worker overproduction. When multiple Town Centres exist, AI strategy prefers a completed one for production decisions.
- **AI fleet and support units:** production limits include queued war galleys, fishing ships, scouts, trade carts and trade cogs, not only units already on the map.
- **Military research:** Bloodlines AI priority now responds to cavalry composition. Hit-point research no longer adds health to already defeated units; the existing Bloodlines and Reinforced Hulls effects have additional regression coverage.
- **Production terrain:** land units avoid water and resource nodes when spawned; dock-produced ships retain both supported water terrain types.
- **Catalogue checks:** automated integrity tests inspect technology research sites, prerequisites, effect target references, costs and production definitions.

These changes still require the full automated suite and live gameplay acceptance checks. The eight top-level goals remain open until their stated criteria are met.

### Further implementation — 17 October 2026

- **Combat robustness:** projectile impacts and direct damage now reject defeated, transported, invalid or no-longer-hostile targets. Dedicated tests exercise both impact and direct-hit paths.
- **Map auditing:** invalid/fractional spawn coordinates are rejected rather than silently clamped. Dock access now checks buildable land and unobstructed adjacent water, with regression coverage for blocked shores.
- **Verification status:** these commits are source changes with tests committed, not verified full-suite results. The map connectivity audit is an approximation and does not replace pathfinding or full match tests.

## Completion rule

The game is complete only when all eight goals have passed their relevant acceptance checks. If a test has not been run, a mission has not been played through, or Xbox hardware has not been measured, report it as unverified rather than complete.

## Automated test commands

```sh
node scripts/check-game.mjs
for test in tests/*.test.mjs; do node "$test" || exit 1; done
node tests/validate-atlas.mjs
```

These checks support the work; they do not replace the acceptance requirements above.
