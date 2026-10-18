## Development workflow — standing owner instructions

- **Commit directly to `main` only.** Do not create feature branches or pull-request branches unless the owner explicitly requests them.
- **Prioritise meaningful gameplay implementation** (campaigns, AI, combat, economy, controller controls, visuals, performance and saves) over adding more tests or repeating source audits.
- **Work in the largest practical batches**, completing multiple related gameplay improvements before reporting back. Do not stop after one or two trivial commits.
- **Avoid test loops.** Add or run focused tests only when they meaningfully verify a changed feature, fix a demonstrated bug, or protect a critical save/gameplay path. Do not repeatedly audit unchanged systems.
- **Keep this roadmap current** with delivered gameplay work, remaining priorities and genuine verification gaps; avoid excessive documentation-only updates.
- **Be accurate about verification:** commits do not imply automated tests, browser playthroughs or Xbox hardware checks passed.

## AoE2 DE Xbox fidelity guardrails — owner requirement

**Reference target:** Age of Empires II: Definitive Edition on Xbox. Match its player-facing mechanics, controller automation, game modes and AI fairness; do not introduce extra player powers or independent gameplay systems merely because they are possible to code. Enemy AI may make tactical decisions, but it must obey the same game rules as the player. Before expanding automation, compare against the Xbox reference and record whether the feature is confirmed, an approximation, or a deviation.

**Confirmed development rule:** Do not silently expand AI abilities, resource cheats, autonomous player army management or non-AoE2 victory modes. For existing deviations, audit and either align, remove or clearly label them before treating parity as complete.

**Potential deviations found in current code (not yet removed):**
- **Fast Economy** is a custom match preset, not the standard AoE2 DE Xbox game-mode label. Compare with the reference's actual mode list.
- **Starting army presets** (scout patrol, field force, siege force) are custom presets. AoE2 DE has starting-age/resources settings, but these specific presets should not be presented as Xbox-equivalent features.
- **King of the Hill / Sudden Death / Score at time limit:** verify rule details and naming against AoE2 DE Xbox; avoid assuming this implementation matches the reference.
- **Automatic player trade routing, merchant fleeing and AI merchant escorts:** review individually; enemy AI logistics is not the same as an extra player command.
- **Allied unit/building repair, autonomous AI tribute and automatic defensive/retreat routines:** verify game-rule fairness and reference behaviour before expanding them.
- **400/500 population options:** review against AoE2 DE Xbox's supported population settings.


**Fidelity implementation update (17 October):** The setup UI explicitly labels Fast Economy and extra starting-army presets as custom rather than AoE2 DE Xbox modes. AI ally tribute now requires an active alliance and valid, sufficient resource balances; it does not mint resources. No gameplay features have been removed, and unverified reference differences remain open for deliberate review.

**Implemented parity correction (18 October):** Removed autonomous merchant threat detection and escape routing from trade simulation for both human and AI merchants. Merchants now follow their trade routes without an extra automatic flee command; old saves with an active flee state are normalized back into trade routing. Retained enemy AI escort decisions for now because these are strategic orders using ordinary military units, not an additional player-side automatic ability. Still requires comparison and live playtesting; no claim of complete AoE2 DE Xbox parity.

**Trade-route fidelity pass (18 October):** Human-owned trade carts and cogs now stop when their foreign trading destination is lost instead of autonomously selecting a replacement. A new explicit order resumes trading. Enemy merchants retain strategic destination selection but filter invalid team identifiers. Further playtesting is required, including saved trade routes and allied market destruction.

**Local automation correction (18 October):** Xbox-style player villager resource priority searches are now limited to an 18-tile radius (previously 36) and still require a reachable resource; this is a practical local-only approximation, not a verified Xbox engine distance. Human merchants now pause when their home market or dock is destroyed or missing, requiring a new player trade order. Verify behaviour with saved matches and on Xbox Edge before checking off parity.

**Follow-up correction (18 October):** Closed a remaining player trade loophole: if the assigned home depot becomes invalid, merchants pause rather than choosing a new one. Villager auto-resource selection now excludes animal and malformed resource nodes. Confirm these paths with restored saves and active matches before marking complete.

**AI retreat fidelity correction (18 October):** Removed non-reference passive healing for wounded AI military standing near Town Centres/Castles. They now briefly regroup without gaining HP; actual healing still depends on legitimate unit abilities/monks. Added a cooldown to avoid repeated retreat-to-shelter loops for low-HP units. Gameplay testing is still required for AI behaviour and retreat timing.

**AI regroup and villager priority follow-up (18 October):** AI retreat decisions now leave units resting at a reached shelter instead of issuing a new move order each decision tick; destroyed or missing shelters clear stale retreat orders. Player villager resource priority selection now accepts only recognised gatherable resource types. These are implementation fixes, not verified Xbox behaviour; run full-match tests before marking parity complete.

**AI and villager control maintenance (18 October):** Retreating AI units now repath from the narrow band just outside shelter arrival distance instead of remaining stranded. Villager priority rebalancing exits when automation is disabled, and target increments are clamped to finite supported values. These changes need gameplay verification before marking Xbox parity complete.

**Villager automation disable and save defaults (18 October):** Switching player villager automation off clears automation ownership flags without cancelling existing gathering orders. Applying priority assignments while disabled now does nothing; omitted resource targets in saved settings retain defaults rather than becoming zero. Verify toggle/re-enable and restored-save behaviour in gameplay.

**Disposition:** This is a fidelity review, not authorization to delete working features without assessing saves, campaigns and user expectations. Prioritize preserving core matches and recording differences before changing mechanics. Mark parity only after an actual Xbox comparison and gameplay verification.

# Crown & Kingdoms — Main Development Goals

**Target:** Controller-first browser RTS for Xbox Series S / Microsoft Edge.

This is the single gameplay roadmap. The eight goals below define the work required to complete the game. Mark a goal complete only when its acceptance requirements have been tested; source code or a passing unit test alone is not proof of complete gameplay.

## 1. Campaigns — all 19 missions

**Current development focus (17 October): campaign correctness and progression, then technology-effect audit.** Move between major roadmap areas after meaningful batches rather than repeatedly polishing the same merchant/controller systems.
- [x] Fix next-mission navigation to stay within the current campaign story arc.
- [x] Evaluate timed mission events every simulation tick instead of waiting for the objective polling interval.
- [x] Recheck live-unit and held-relic objectives at victory, so a previously achieved but subsequently lost army/relic cannot satisfy a live objective.
- [x] Sanitize persisted campaign completion flags and reject invalid mission launches.
- [ ] Add regression coverage for campaign arc boundaries, timed events, live objectives and save/load mission state; then playtest all 19 missions.
- [ ] Next major batch: audit technology effects and their AI/UI integration, then return to AI difficulty calibration and map/naval playability.

- [ ] Play every mission from its briefing through a real victory or defeat.
- [ ] Verify every primary and secondary objective, including objectives that depend on living units or destroyed buildings.
- [ ] Verify timed events fire at the correct time and only as intended.
- [ ] Verify victory/defeat conditions, campaign saves, mission unlocking and next-mission progression.
- [ ] Fix softlocks, unreachable objectives, impossible scenarios and incorrect mission text.

**Shoreline landing constraints (18 October):** Transport passengers now disembark only on free land tiles immediately adjacent to water and within four map units of their ship; candidate scoring favours the requested shore and proximity to the ship. Player unload orders check for an adjacent passable land tile before routing. Still to verify: complex coastline/island maps, blocked landing zones, navigation around docks and multi-passenger unloads.

**Unload state cleanup (18 October):** Disembarking and garrison-released units now clear stale patrol/attack-move and transport target state. Ship unloading rejects invalid ship coordinates, and post-unload manifests retain only recognised friendly land passengers. Verify restored saves, blocked shores and unit-order behaviour in live matches.

**Shore unload route validation (18 October):** Player unload orders and simulation re-pathing now reject empty sea routes. Unload completion requires an actual route and the already-sanitized passenger manifest, avoiding spurious unloading when a ship is stranded. Continue with reachable-coast selection and full blocked-landing gameplay verification.

**Garrison and transport landing pass (18 October):** Building garrisons now unload onto unique, free, passable land tiles, preserve passengers when no space is available, and report partial or blocked unloads. Invalid/dead/wrong-team passengers and unrecognised unit types are excluded from unload manifests; ship manifests are normalised before processing. Outstanding: coast/island gameplay checks, shoreline pathfinding and save/load regression verification.

**Transport passenger validity follow-up (18 October):** Ship unload commands, manifest cleanup and partial unloading now require living friendly land passengers whose loaded reference points to that ship. This hardens restored or stale transport state; blocked landing and coastal pathfinding still require live-match testing.

**Transport reliability pass (18 October):** Ship unloading now removes dead and stale passengers from manifests before and after unload attempts, ignores invalid occupied-unit positions, and validates manifest arrays before accepting controller/player shore orders. Still pending: coast/island pathing, blocked landings, partial unload and save/load gameplay tests.

## 2. AI strategy

**Current AI development pass (17 October): improve economic decision quality after introducing six difficulty tiers.**
- [x] Reserve a portion of age-up resources before spending on optional technologies once prerequisites are in place.
- [x] Filter AI military production by affordability before choosing counter-units, preventing repeated failed training decisions.
- [x] Add source-level regression tests for age-up savings, unit affordability and monotonic difficulty pacing.
- [ ] Measure AI age-up times, resource float, idle production, population cap stalls and first-attack timings in full land/coastal/island matches; tune each tier from evidence.
- [ ] Current workstream: naval transport reliability (manifest cleanup, unload validation and landing occupancy), followed by map/naval combat and campaign playthroughs; return to AI only for observed match issues.

- [ ] Build a sustainable economy and rebalance workers as resource needs change.
- [ ] Choose useful units and mixed armies based on enemy composition and available resources.
- [ ] Research appropriate technologies at sensible times.
- [ ] Improve scouting, defence, attack timing, target selection, retreats and siege use.
- [ ] Improve naval production, fleet composition, escorting, target choice and retreat/repair behaviour.
- [ ] Test multiple rival kingdoms in full-length matches without cheats or resource/damage bonuses.
- [ ] **Difficulty and playability parity with Age of Empires II: Definitive Edition:** make computer opponents enjoyable and consistently distinct from beginner-friendly through expert-level play. Treat this as a major AI milestone, not as complete merely because difficulty settings exist.
- [x] Wire six selectable AI tiers (Easiest, Easy, Moderate, Hard, Hardest, Extreme) through skirmish setup, save/load and preferences; add distinct decision, economy, raid and assault pacing without resource/damage cheats.
- [ ] Balance the six tiers in repeated complete matches; refine expansion, counter-units and coordination based on evidence rather than assuming AoE II: DE parity.
- [ ] Protect beginner experience: allow time to learn, recover and build; avoid overwhelming early rushes or punishing attacks on the easiest tiers while ensuring higher tiers remain genuinely challenging.
- [ ] Validate each tier with repeated full-length AI-vs-AI and player-style matches on land, coastal and island maps, from opening economy through late-game victory/defeat. Record win rates, age-up timings, idle economy, attack timing, unit composition, stalled games and performance.
- [ ] Calibrate difficulty progressively against the *experience* of AoE II: DE without claiming identical AI strength until comparative gameplay evidence supports it. Prioritize core AI stability and match completion first, then balance and polish the tiers before final release.

## 3. Technology effects

**Current focus: core economy and technology correctness (after save-management pass).**
- [x] Fix double-counting of queued population in unit training and AI house-building forecasts. Queued units already count toward the game's population total.
- [x] Extend Treadmill Crane to speed building repairs as well as construction.
- [x] Add focused population and Crane regression tests for the above gameplay behaviours.
- [ ] Run the full Node test suite, verify technology costs/prerequisites and existing/new unit effects, then test economy balance in actual matches.
- [ ] Continue with AI difficulty tiers and full-match outcomes after this technology audit; avoid returning to completed save/controller features without a concrete bug.

- [ ] Audit every technology against its stated cost, age, prerequisites and intended effect.
- [ ] Verify effects during gameplay, including effects on existing units and newly created units where relevant.
- [ ] Check upgrade stacking, duplicate research prevention, UI state, AI valuation and save/load persistence.
- [ ] Correct technologies that are ineffective, incorrectly applied, or applied to the wrong unit/building classes.

## 4. Naval systems and maps

**Naval development pass (17 October): dock placement, shoreline feedback and map auditing.**
- [x] Prevent AI dock placement beside tiny isolated ponds by checking for a substantial connected navigable water area.
- [x] Distinguish complete starting-kingdom naval access from partial access in generated-map diagnostics.
- [x] Report successfully unloaded transport passengers and warn when some remain aboard.
- [x] Add focused naval-access tests for small ponds, open water and map-audit flags.
- [ ] Test boarding and unloading on real coastlines, shallow-water crossings and islands, including blocked landing tiles and partial unloads.
- [ ] Next major workstream: campaign mission playthroughs and progression regression coverage; then revisit naval mechanics only for observed failures.

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

## Controller-first match setup and in-game economy controls

- [x] Offer classic three-villager and expanded five-, ten- and fifteen-villager starting options for skirmishes.
- [x] Offer Low, Standard, Medium, High, Very High and Ultra High starting-resource presets for skirmishes.
- [x] Provide in-game controller zoom without requiring the pause/options menu (LT + D-pad Up/Down).
- [x] Provide in-game automatic villager resource selection and target adjustment (LT + D-pad Left/Right, X/B) and automation toggle (LT + A).
- [ ] Verify the new shortcuts on a physical Xbox controller in Edge, including interactions with selection, minimap and command menus.
- [ ] Playtest every starting-villager/resource preset across multiple map sizes and kingdoms, and balance economy pacing against AoE II: DE.

## Save-game management and rolling autosave — 17 October 2026

- [x] Add a controller-accessible delete action for manual save slots and the recovery autosave, with explicit A-confirm/B-cancel.
- [x] Delete IndexedDB backups alongside localStorage saves so the recovery adapter does not recreate deleted games.
- [x] Keep autosave in a **single dedicated rolling recovery slot** (`ck_autosave`) which is overwritten by the current match; do not silently overwrite player-selected manual saves.
- [x] Restart the autosave schedule on new matches and verify the stored payload after each write.
- [ ] Test save/delete/restart/recover sequences in Xbox Edge, including IndexedDB restoration, storage quotas, corrupted saves, and loss of power.
- [x] Add focused automated save-management regression tests for manual/auto deletion, persistent tombstones and autosave slot isolation; update the browser persistence contract.
- [x] Confirm before overwriting an occupied manual save slot, and preserve the previous save on cancellation or failed write.
- [ ] Extend integration tests for controller confirmation/cancellation, actual IndexedDB transactions and latest-match autosave recovery after browser restart. Move on to technology and AI after this save-management pass.

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

### Save integrity and navigation — 17 October 2026

- **Navigation:** A* now rejects malformed unit/goal inputs and starts on impassable tiles. Tests cover blocked land starts, dry-land ship starts and valid water routes.
- **Save compatibility:** the loader validates production queues and research timers before restoring a match, rejects invalid civilization ages and initializes missing legacy building queues to empty arrays.
- **Scope of verification:** source changes and regression fixtures are committed, but full CI, real save-slot round trips, extended matches and Xbox browser tests still need to be performed.

### Further reliability work — 17 October 2026

- **Save integrity:** restored training queues must belong to their production buildings; restored research must belong to its research site, including Town Centre-only age advancement.
- **Combat:** direct damage guards invalid target unit types, non-finite health and missing attacker technology state.
- **Movement and navigation:** unit movement rejects out-of-bounds/non-finite positions; land units cannot enter deep water. Shallow water (`wt=2`) remains a traversable ford for land units and navigable for ships, as intended by the map layouts. Pathfinding, movement and map auditing retain that distinction.
- **Testing:** added source regression tests for save production, movement bounds, ford traversal and combat validation. Live browser and Xbox acceptance remain pending.

### Movement, gates and save-path resilience — 17 October 2026

- **Waypoint execution:** walking now uses the same collision-checked movement primitive as other unit displacement, preventing paths from stepping through newly blocked tiles or directly into buildings. Invalid/off-map waypoints are discarded and blocked paths can be recalculated.
- **Gates and terrain:** friendly gates remain passable while enemy gates are blocked; deep water stops land units and shallow fords remain walkable.
- **Save-game movement:** serialized waypoint lists are validated for structure, finite in-bounds coordinates and reasonable length. Legacy saves without paths initialize them as empty lists.
- **Regression coverage:** added waypoint collision, gate ownership, paused-step and save-path tests. Full automated and live console-browser acceptance remain pending.

### Navigation and save-rally improvements — 17 October 2026

- **A* input safety:** pathfinding rejects fractional off-map unit coordinates, non-finite heuristic coordinates, incomplete coordinate pairs and negative heuristic radii.
- **Save-game rally fidelity:** resource-target rally references are serialized, validated and reconnected to live resource nodes on load, so newly trained villagers can resume resource-directed rally orders after restoration.
- **Save-game validation:** rally coordinates are checked for finite, in-bounds values; legacy saves without rally targets remain supported.
- **Verification:** source-level regression tests have been committed, but automated suite execution, save/load round trips in a browser, long-match playtests and Xbox validation remain outstanding.

### Production rules and ford spawning — 17 October 2026

- **Production consistency:** training and research are now mutually exclusive within the same building, preventing simultaneous queue and research progress. Save validation rejects impossible overlapping production states.
- **Shallow-water production:** land units can spawn on traversable shallow fords when no dry spawn tile is available; deep water and resource nodes remain blocked.
- **Regression coverage:** added production/research exclusivity tests and extended save validation and terrain-spawn tests. Automated execution and full match acceptance remain outstanding.

### Save and production resilience — 17 October 2026

- **Unit-state validation:** loading a save now checks unit path retry timers, attack cooldowns and carried-resource quantities. Negative elapsed timers remain valid because the simulation naturally decrements them below zero.
- **Training recovery:** corrupt training queue heads are discarded safely, and invalid/nonpositive elapsed time cannot advance a production queue.
- **Tests:** added unit-order save validation and training-queue recovery regressions; retained source-level tests for shallow-ford spawning and mutually exclusive training/research.
- **Acceptance remains open:** CI execution, full gameplay verification, campaigns, multiplayer synchronization and Xbox hardware profiling are not claimed complete.

### Campaign defensive checks — 17 October 2026

- Mission entry rejects invalid, negative, fractional and out-of-range indices before indexing scenario definitions.
- Campaign completion writes ignore invalid mission indices.
- Campaign ticks safely handle missing campaign state and conditional event callbacks.
- Briefing confirm rechecks the prior mission's completion so stale or directly selected locked briefings cannot launch.
- **Verification pending:** execute the full Node test suite and all 19 campaign playthroughs; controller and Xbox browser checks remain open.

### Market and campaign robustness batch — 17 October 2026

- Market buy/sell actions validate player index, resource kind, action, price and resource quantities; rejected transactions return `false` without changing resources, successful transactions return `true`.
- Added executable market trade tests covering rejection, pricing, insufficient stock and insufficient gold.
- Campaign completion records normalize to a fixed 19-mission array; invalid completion indices are ignored.
- Naval reinforcement position selection rejects invalid spawn requests and skips malformed/dead ship entries.
- Campaign menu selection recovers from stale/out-of-range cursor indices.
- Added campaign safety runtime tests and corrected an outdated campaign-arc progression regression assertion.
- **Still to verify:** run Node test suite, full 19-mission playthrough, sustained AI difficulty calibration and Xbox Series S controller/browser testing.

### Gameplay and Xbox-input implementation batch — 17 October 2026

- **AI economy:** market-trade cooldown is consumed only when the transaction succeeds, allowing failed market orders to fall through to another useful resource trade.
- **Economy:** market prices must remain within the actual 25–400 range; transactions reject unsafe or overflowing resource amounts rather than corrupting player resources.
- **Controller/gameplay:** selection rejects off-map and non-finite cursor coordinates; unit orders skip dead/garrisoned selections, and rally placement checks for live production buildings.
- **Xbox controller resilience:** gamepad polling tolerates missing button records; analog sticks, deadzones and trigger values are clamped to valid ranges.
- **AI performance:** villager evacuation, base defence, allied assistance and economic raid responses share one filtered live-hostile roster per AI decision tick instead of rescanning every unit independently.
- **Save/load economy:** restored per-player market prices are normalized to valid bounded values, including malformed legacy prices.
- **Remaining:** full test-suite execution, physical Xbox controller acceptance, campaign playthroughs, deeper difficulty calibration and multiplayer synchronization.

### Controller and AI reliability — 17 October 2026

- AI structure rosters exclude destroyed buildings; merchant escorts stop following cargo that is embarked or destroyed.
- AI team decision ticks reject invalid team indices and missing team resources rather than running with corrupted state.
- Xbox/browser controller polling accepts array-like GamepadButtonList values and invalid stored button remappings fall back to original button indices.
- Campaign briefing rejects malformed mission identifiers before unlocking checks.
- Acceptance still pending: actual Xbox controller playtests, full campaign playthroughs and complete automated suite execution.

## Completion rule

The game is complete only when all eight goals have passed their relevant acceptance checks. If a test has not been run, a mission has not been played through, or Xbox hardware has not been measured, report it as unverified rather than complete.

## Automated test commands

```sh
node scripts/check-game.mjs
for test in tests/*.test.mjs; do node "$test" || exit 1; done
node tests/validate-atlas.mjs
```

These checks support the work; they do not replace the acceptance requirements above.
