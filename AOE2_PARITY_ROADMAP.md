# Crown & Kingdoms — Main Development Goals

**Target:** Controller-first browser RTS for Xbox Series S / Microsoft Edge.

This is the single gameplay roadmap. The eight goals below define the work required to complete the game. Mark a goal complete only when its acceptance requirements have been tested; source code or a passing unit test alone is not proof of complete gameplay.

## Prioritised implementation backlog — identified gaps

These are concrete code-level gaps to implement; they are not marked complete by being recorded here. Keep each change small, add a focused regression test, and wait for CI before starting the next change.

### P0 — core economy and progression
- [ ] **Farm lifecycle:** current config defines farms as `hp:1` and `bt:0`. Give farms sensible durability and a non-zero construction time; verify placement, construction progress, damage/destruction, food depletion and automatic reseeding.
- [ ] **Technology audit and effects:** implement and test missing core tech where absent: Loom, Wheelbarrow, Hand Cart, Ballistics, Squires, Arson, monk upgrades and naval upgrades. Check costs, age/building prerequisites, AI research choice, effects on existing/new units, stacking and save/load.
- [ ] **Building and unit progression:** audit age-up requirements, building prerequisites, population accounting, production queues and upgrade application against each unit/building class.
- [ ] **Combat parity:** test elevation advantage, friendly-fire rules, trebuchet packed/unpacked state and minimum range, and Town Center arrow damage scaling with garrison occupancy.

### P1 — strategy, naval and content
- [ ] **Civilisation bonuses and unique technologies:** audit each bonus/unique technology against its description and affected classes. Specifically verify the Spanish Supremacy/Inquisition effect and correct any Conquistador-only misapplication.
- [ ] **AI decision quality:** improve worker allocation, scouting, counter-unit composition, technology timing, siege use, retreating/repairing and coordinated attacks; test without hidden economy or combat bonuses.
- [ ] **Naval completeness:** validate fishing, trade, transport, ship repair, shore targeting, naval counters and island logistics end-to-end.
- [ ] **Map and content breadth:** audit map-size choices, connected starting areas, resource access, shore access, additional units/civilisations and campaign variety; prioritise broken or unreachable gameplay over adding content volume.

### P2 — presentation, scale and reliability
- [ ] **Visual clarity:** improve readable unit silhouettes/equipment/animations, distinct buildings, terrain and water layering, selection states and kingdom colours while retaining procedural fallbacks.
- [ ] **Scale/performance:** profile simulation, pathfinding and rendering separately at 100, 200 and 400 units; optimise measured bottlenecks and keep controller input responsive.
- [ ] **Multiplayer truthfulness:** distinguish lobby/presence markers from shared authoritative simulation; implement and test host-authoritative state, disconnect/reconnect handling and consistent match termination before calling multiplayer complete.

---

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

## Completion rule

The game is complete only when all eight goals have passed their relevant acceptance checks. If a test has not been run, a mission has not been played through, or Xbox hardware has not been measured, report it as unverified rather than complete.

## Automated test commands

```sh
node scripts/check-game.mjs
for test in tests/*.test.mjs; do node "$test" || exit 1; done
node tests/validate-atlas.mjs
```

These checks support the work; they do not replace the acceptance requirements above.
