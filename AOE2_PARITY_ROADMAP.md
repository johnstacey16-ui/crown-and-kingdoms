## Xbox Edge eight-player / 500-population scalability programme — 18 October 2026

**Owner target (not a current capability):** eight simultaneous human players with up to 500 population each (4,000 combined population) on Xbox Edge, without a dedicated game server. Preserve this as the ultimate goal; unlock only after performance and network acceptance gates. Population includes villagers, military and other population-consuming units; the simulation may also contain buildings, projectiles, wildlife and effects. Do not claim 4,000 active units or eight-player gameplay currently work.

**Verified code baseline:** `multiplayer.js` limits rooms to **four** participants and presently synchronises lobby/presence and **5 Hz player markers only**, not orders or world state. `js/menus.js` offers **2–4 kingdoms** and a selectable **500 population limit**, with housing still determining usable capacity. Supabase Realtime is already used for signalling/presence; its availability is not equivalent to a dedicated authoritative game server. Multiplayer gameplay, large battles and Xbox Edge performance are **not yet verified**.

**Trade and transport simulation batch (18 October):** AI trade-route searches now prefilter eligible hostile threats once per destination selection and compare squared point-to-route distance against the danger corridor; eligible trade sources are ordered by precomputed squared footprint distances. Transport beach searches use squared staging distances, build occupied-tile sets without intermediate filter/map arrays, and index eight neighbouring directions directly. Player trade destination assignment remains manual. These are simulation-side performance changes; real Xbox Edge timings remain unmeasured.

**PERF2 diagnostics extension:** distinguish invalid path requests from exhausted reachable-map searches, track total and maximum route waypoint counts, and expose valid-request success rate plus average expanded nodes and average waypoints via `CK_PATH_DIAGNOSTICS.snapshot()`. These counters are instrumentation only and still require real Xbox Edge benchmark collection. A* continues to use the same eight directions and corner rules.

**PERF2 profiling instrumentation:** A* now maintains aggregate path requests, successful routes, exhausted searches, total expanded nodes, maximum expanded nodes in one search and peak open-list size. `window.CK_PATH_DIAGNOSTICS.snapshot()` returns a copy of the counters and `.reset()` clears them for another measurement run. Invalid early-return requests are counted as requests but not exhausted searches. The counters are diagnostic instrumentation, not evidence of Xbox Edge acceptance; benchmark results still need collecting.

**Larger follow-on performance batch (18 October):** villager drop-off attempts now precompute building identity and squared footprint distance once per candidate instead of recomputing in sorting; projectile splash radius squared is reused for every impact candidate; A* expands neighbours using a cached current-node movement cost and caches static building goal bounds; off-camera multiplayer markers are excluded from depth sorting. These five implementation changes are unbenchmarked. No claim of full multiplayer synchronisation or 4,000-unit Xbox Edge readiness is implied.

**Further PERF2 A* optimisation:** neighbour expansion now indexes the existing eight-direction array and reuses each direction reference instead of destructuring an iterator on every expanded node. Neighbour order, movement costs and diagonal corner restrictions remain unchanged. Xbox Edge profiling and shared group-path routing remain open.

**Additional economy-routing optimisation:** drop-off candidate ordering now compares squared distances to building footprints and caches each compatible building's identity key for retry filtering and sorting. Route reachability checks and the six-failure cap are unchanged; this is not yet benchmarked at large populations.

**Villager drop-off routing optimisation:** remove the redundant first sort of compatible drop-off buildings (the candidate list is sorted after retry exclusions) and use a Set for excluded destination membership. This reduces repeated comparisons in economy routing while preserving existing retry limits and destination priority.

**Further combat-targeting CPU improvements:** hostile building selection now uses squared point-to-building-footprint distance while retaining siege building priority; nearest-hostile-unit queries no longer scan an extra ring of spatial buckets beyond the requested radius. These are unbenchmarked optimisations, not proof of Xbox Edge high-population capacity.

**Economy/support-unit CPU optimisation:** monk area healing now rejects out-of-range units before computing maximum health and uses squared radius checks; fishing-ship trap placement also avoids per-tile square roots. These are local simulation improvements and do not establish multiplayer or population-scale acceptance.

**Projectile CPU optimisation:** impact detection compares squared travel distance against the step radius, calculating a square root only when a projectile actually advances; splash damage also uses squared-radius checks for units and buildings. This preserves existing hit radii and still requires Xbox Edge performance validation.

**Combat-index maintenance improvement:** the hostile-unit spatial grid already clears and rebuilds all buckets each refresh, so its redundant epoch stamps, stale-bucket scan and unused target-index tracking have been removed. This cuts bookkeeping per refresh but does not change the multiplayer readiness or Xbox Edge benchmark status.

**Further PERF1 implementation:** unit-separation collision buckets reject non-finite positions, and both small-army and spatial-bucket separation paths avoid square roots until two units are within the actual separation radius. This is a targeted CPU reduction, not a measured 4,000-population benchmark.

**Initial PERF2 implementation:** A* point-goal and building-adjacent goal predicates now compare squared distances rather than taking square roots for every expanded candidate. Goal radius boundaries remain strict for point goals and inclusive for building proximity. This is an unbenchmarked per-search CPU optimisation, not yet path sharing or flow-field routing.

**Further CPU/render improvements:** villager resource-node nearest searches use squared distances to avoid repeated square roots; expired/off-camera rubble is skipped before its multi-pass decorative Canvas drawing. Both changes are implemented on main, with real Xbox Edge timings still unmeasured.

**Additional PERF3 culling:** corpses are now camera-filtered before sprite-cache/canvas work; buildings are camera-filtered before visibility checks and projection; relics outside the camera no longer enter the depth-sort list. These optimisations preserve simulation state and remain unbenchmarked on Xbox Edge.

**Further PERF3 implementation:** selected-unit ring drawing now uses a per-frame Set lookup instead of scanning the entire selection for every visible unit. This removes a selection-size multiplier from large-army rendering; Xbox Edge benchmark results are still pending.

**Initial PERF3 implementation:** camera-bounded rendering now rejects off-screen units before visibility/projection checks and skips off-screen projectiles and effects. This reduces avoidable Canvas work but does not yet establish a safe Xbox Edge population ceiling; measure frame timings at benchmark population levels before raising live limits.

**Initial PERF1 implementation:** nearest-hostile-unit lookup now compares squared distances rather than invoking a square root per candidate, and spatial-index construction excludes non-finite positions. This is a small targeted optimisation, not proof of high-population performance; profiling and the wider hotspot audit remain open.

### Milestones, ordered by dependency

- [ ] **MP1 — real two-human multiplayer:** define unique player/kingdom ownership, authoritative validation of legal orders, stable unit IDs, deterministic fixed-step scheduling, reproducible map/seed/RNG, and synchronised move/attack/build/train/research/economy commands. Do not broadcast every unit position. Choose and verify deterministic lockstep with delayed command frames and peer acknowledgements; assess a host-authoritative fallback if deterministic browser execution proves unreliable. Maintain a functioning lobby and clear disconnect behaviour.
- [ ] **MP2 — correctness and recovery:** periodic state checksums covering meaningful simulation state, bounded command logs, sequence numbers, ordering/deduplication, input-delay and timeout policy, mismatch detection and pause/rejoin/resynchronisation strategy. Prevent silent divergence; distinguish deterministic simulation from merely matching initial map signatures. Handle host departure and reconnection deliberately.
- [ ] **MP3 — relay and bandwidth:** evaluate Supabase Broadcast throughput, quotas, message-size limits, rate limits, delivery ordering, fan-out and latency with 2/4/8 peers. Batch commands, compress identifiers, cap packet sizes, coalesce safe transient inputs, throttle presence/markers, and instrument bytes/s, commands/s, latency, packet drops and backlog. Prefer no dedicated server; document the continuing dependency on hosted signalling/relay and whether WebRTC data channels are practical on Xbox Edge. Never assume 30 unit-position snapshots per second.
- [ ] **PERF1 — spatial queries:** inventory all unit-to-unit, unit-to-building and collision scans. Extend/reuse spatial bins for local combat, healing, targeting, avoidance and selection as appropriate; keep correctness across movement and death. Track query counts and worst-case bucket density to avoid hidden quadratic hotspots.
- [ ] **PERF2 — pathfinding and movement:** profile A* calls and node expansions; introduce bounded scheduling for non-urgent requests, group/shared destinations or flow fields where appropriate, path reuse/invalidation, and efficient formation movement. Preserve responsiveness and prevent starvation or pathfinding stalls in large engagements.
- [ ] **PERF3 — rendering on Xbox Edge:** retain viewport culling; measure visible sprites, draw calls and canvas time; cache reusable artwork, minimise allocations and expensive state changes, cull off-screen effects and distant detail, and use adaptive visual quality that never changes simulation outcomes. Include controller/zoom usability.
- [ ] **PERF4 — simulation/memory:** fixed-step frame pacing with catch-up limits, stagger noncritical AI work without changing multiplayer determinism, reuse temporary arrays/objects, pool effects/projectiles where beneficial, bound history/logs, and track memory/GC pauses and worst-case frame time. Keep gameplay logic independent of render frame rate.
- [ ] **PERF5 — profiling and benchmark fixtures:** reproducible local scenarios at 250, 500, 1,000, 1,500, 2,000, 3,000 and 4,000 combined population, including idle economy, movement, mass combat, siege and naval. Add counters for FPS, simulation ms/tick, rendering ms/frame, path calls/expansions, spatial checks, memory proxies, network bytes/s, command backlog and checksum divergence. Profile Xbox Edge specifically before claiming compatibility.
- [ ] **MP4 — scale-out gates:** complete and verify two-human games first, then four-player games, then 8-player rooms and 500-pop caps. Map size, spawn allocation, diplomacy, UI/controller selection, fog and AI slot allocation must scale beyond four kingdoms. Keep lower-pop presets available for weaker devices.
- [ ] **Acceptance:** Xbox Edge can complete long matches without tab crashes, unbounded memory growth, persistent simulation slowdowns, input lag or divergent world state. Set measurable tick/frame/latency thresholds after collecting baseline hardware measurements; avoid inventing performance guarantees. Include disconnect, reconnect, simultaneous commands, mass battles and late-game saves in testing.
- [ ] **Development workflow:** implement sizeable coherent changes directly on `main`, update this section as work lands, and defer owner Xbox/Vercel deployment or full-match acceptance until requested. Do not break existing solo gameplay while multiplayer remains incomplete.

**Priority decision:** make multiplayer correctness and scalable simulation/rendering a major parallel workstream alongside AoE2 DE AI baseline parity. Avoid increasing `MAX_PLAYERS` to eight until commands and world state are actually synchronised and scale tests pass.

## Development workflow — standing owner instructions

- **Commit directly to `main` only.** Do not create feature branches or pull-request branches unless the owner explicitly requests them.
- **Prioritise meaningful gameplay implementation** (campaigns, AI, combat, economy, controller controls, visuals, performance and saves) over adding more tests or repeating source audits.
- **Work in the largest practical batches**: aim for approximately **30 meaningful changes in a turn** when feasible, across several priority systems, and use as much practical execution time as available. The number is a target, not a quota: substantial integrated gameplay improvements matter more than splitting tiny edits into dozens of commits. Do not stop after four or five trivial commits or repeatedly ask the owner to say Continue.
- **Continue autonomously within each turn**: tackle related roadmap tasks, implement, integrate, commit directly to main and then proceed to the next priority without status-only interruptions. Only stop for a genuine blocker, execution limit, or required user decision; give a consolidated delivery report at the end.
- **Avoid test loops.** Add or run focused tests only when they meaningfully verify a changed feature, fix a demonstrated bug, or protect a critical save/gameplay path. Do not repeatedly audit unchanged systems.
- **Keep this roadmap current** with delivered gameplay work, remaining priorities and genuine verification gaps; avoid excessive documentation-only updates.
- **Be accurate about verification:** commits do not imply automated tests, browser playthroughs or Xbox hardware checks passed.

**Economy implementation batch (18 October):** Auto-villager resource search now filters the desired resource kind before building candidate lists, cleans up expired resource exclusions, and rejects off-map/malformed worker or node coordinates. These are committed implementation improvements; no owner playthrough or Vercel deployment was requested. Further economy feature work remains open.

**AI naval expansion implementation (18 October):** Dock-site connectivity now counts only navigable, unoccupied water and performs the bounded water-reach search on the nearest shortlisted build locations rather than on every map candidate. These changes are committed; live naval AI match testing remains deferred under the owner's development-first preference.

**AI dock-placement follow-up (18 October):** Require a single connected navigable water component (not the combined area of isolated pools), search beyond the nearest 64 raw sites when necessary, and reject dry sites before expensive connectivity checks. Committed on main; no live match or Vercel test requested.

**AI construction reliability (18 October):** AI builder candidate selection now requires valid on-map villager positions, excludes non-villagers from construction assignment, and checks reachable building routes before assigning work. Changes committed on main; browser and full-match acceptance remains deferred.

**AI economic adaptation (18 October):** Resource rebalancing now searches multiple reachable deposits before reassigning a worker, excludes invalid/off-map targets and unavailable villagers, and tries a second worker group when emergency food or wood reassignment cannot succeed. Implementation committed to main; gameplay calibration remains deferred.

**AI resource-management batch (18 October):** Consolidated economic worker reassignment with current resource-assignment counts, valid on-map resource pools, reachable deposit selection, preferred donor-resource ordering, and fallback to another shortage when a transfer fails. Committed on main; balance and long-match gameplay verification remain open and do not block continued development.

**AI construction search follow-up (18 October):** When nearest villagers cannot path to a build site, AI now tries bounded farther-away candidates; resource-depot placement checks up to 32 candidate deposits rather than stopping at 12. Implemented on main; gameplay acceptance remains open.

**Villager gathering reliability:** Keep temporary unreachable-resource exclusions across resource types; validate worker positions before automatic orders. Implementation is on main; gameplay verification remains pending.

**Automatic villager search fallback:** Resource gathering now checks up to twelve unreachable candidates per search and widens its search radius from 18 to 30 tiles when no nearby reachable node exists. Implemented on main; match verification pending.

**Controls and save-integrity follow-up (18 October):** Player-side diplomacy is used for friendly-target order checks; save restoration now validates unit path-progress indices and nonnegative cooldowns. Implemented on main; in-game regression checks remain deferred.

**Save compatibility policy (owner instruction, 18 October 2026):** Do not spend development effort preserving compatibility with old save files after game updates. The owner will delete old saves and start fresh; prioritize gameplay improvements and reliable saves created by the current version. Preserve an obvious, confirmed **Delete Save** action for each manual slot (including unreadable files) and autosave. The load menu now has explicit deletion rows in addition to the controller X shortcut; selection is clamped after deletion, and X targets the correct selected save. Autosave remains one rolling checkpoint. Full-game testing deferred.

**AI economy continuation (18 October):** AI resource fallback respects stone/gold worker quotas, worker counts exclude invalid positions, builders reject off-map targets, and AI/player automatic land gathering skips submerged resource nodes. All implemented on main; match verification deferred. Continue prioritizing substantial gameplay batches over save backward compatibility.

**AI military support continuation (18 October):** Trade escorts now exclude retreating units and are released when active threats disappear or escorts become unavailable. Naval support excludes loaded ships and prioritizes damaged combat vessels over civilian ships. Implemented on main; long-match and naval verification deferred.

**AI baseline economy implementation (18 October):** Idle AI villagers can seek food, wood, gold or stone when their preferred resource is missing; alternative gathering targets are validated and ranked by proximity before bounded pathfinding; idle gathering and repair assignment reject invalid-position workers. These are implementation steps, not verified AoE2 DE AI parity. Full-match validation remains deferred.

**Baseline economy/raid continuation (18 October):** Shared resource-node selection now rejects invalid, occupied and submerged land nodes; AI workforce counts exclude unavailable gatherers; raid evacuation checks valid worker and hostile positions. Changes are implemented on main, with actual skirmish performance and AoE2 DE parity still unverified.

**Resource delivery and villager automation continuation (18 October):** Resource carriers now try up to six viable drop-off routes before giving up, ignore invalid drop-off locations, and avoid routing from invalid worker coordinates. Player automatic gathering quotas count active on-map workers. These are implementation improvements, not complete-match verification; old-save migration remains out of scope.

**AI trade/naval baseline continuation (18 October):** AI merchant escorts immediately relinquish duty when the escort or merchant is unavailable, can be replaced if retreating, and react to active hostile warships. Damaged military ships retain repair priority, while fishing and trade vessels are no longer permanently excluded from repair targets. Escort automation remains an implementation detail, not an independent parity target; compare trade survival and military responsiveness in later skirmish testing.

**AI army composition and response continuation (18 October):** Attack waves now exclude units on follow/guard duty and units without combat damage; raiding parties, allied relief forces, local economic-site defenders and Town Centre emergency responders require armed units. These changes aim to prevent noncombat assignments and preserve trade defence while the army fights. Full-match AI effectiveness and AoE2 DE parity are not yet verified.

**AI offensive-state continuity (18 October):** New waves, active attack-wave strength, raiding detachments and staged siege assaults now count only on-map troops with valid coordinates. This avoids stalled offensive state caused by invalid-position units. Implemented on main; complete-match offensive pacing and difficulty parity remain unverified.

**AI age-progression baseline (18 October):** AI now explicitly seeks missing distinct current-age prerequisite buildings when advancing, rather than relying solely on generic building priorities. Once prerequisites are complete, optional research preserves the full next-age resource cost instead of 75%. Implementation committed on main; age-up timing and resource balance still require later match verification.

## AI baseline-first policy — 18 October 2026

**Owner decision:** Treat Age of Empires II: Definitive Edition's observable skirmish AI gameplay as the baseline acceptance target before introducing novel AI features. Aim for comparable behaviour, not copied implementation or identical hidden decision rules.

- **Economy and ages:** workers gather all four resources, construct appropriate buildings, maintain population space, recover from depleted/inaccessible resources, and advance ages without prolonged stalls.
- **Military and defence:** recruit suitable armies, respond to raids, protect vulnerable economy, assemble attacks, handle retreat/recovery, and sustain pressure into the late game.
- **Difficulty:** beginner/easy offers forgiving pressure and recoverable mistakes; normal maintains a balanced challenge; hard sustains stronger economy, expansion and coordinated attacks. Verify in complete skirmishes later.
- **Trade and naval:** establish usable trade routes and defend or redirect threatened merchants; fish, build docks and use fleets on water maps. Compare observable outcomes to AoE2 DE, not speculative internal mechanics.
- **Acceptance:** use scenario checks for idle economy, resource shortages, early raids, midgame expansion, naval maps, late-game rebuilding and full-match outcomes when the owner is ready to test. Mark features *implemented*, *partially implemented*, or *unverified*; never claim parity from code inspection alone.
- **Scope discipline:** prefer closing baseline gameplay gaps over adding special escort, economic, or tactical features that have no clear AoE2 DE counterpart. Existing extras may remain if harmless, but they are not parity milestones. Revisit custom AI enhancements after the baseline is playable.
- **Workflow:** continue substantive batches directly on main, update this roadmap periodically, do not prioritize old-save compatibility, and defer owner playtesting and Vercel usage as requested.

## Owner development-mode update — 18 October 2026

**Development first; player acceptance deferred.** The owner has already played several extended, unfinished skirmishes with base building and combat, observed autosaving and successfully loaded a saved game. They have not played on the latest updates and want to conserve Vercel's reported daily usage allowance. **Do not request fresh browser playthroughs, repeated deployments, or full-match completion as a prerequisite to continuing implementation.**

- **Now:** build substantial gameplay improvements across economy, AI, combat, controller usability, save robustness, naval systems and campaigns; prefer cohesive batches that materially advance the game.
- **Lightweight developer checks only when valuable:** static reasoning and targeted tests that can be run without asking the owner to consume deployment or gameplay time. Do not repeat unchanged checks.
- **Later acceptance phase:** complete skirmish victories/defeats, difficulty calibration, Xbox controller/Edge validation, save/load round trips, all campaign playthroughs and measured performance. Keep these tasks open, not blocking.
- **Evidence already reported by owner:** extended base-building and fighting sessions, visible autosave, and a successful save load. This is useful preliminary gameplay evidence, **not** proof that recent commits or complete matches have been verified.
- **Work ordering:** P0–P4 remain feature priorities, but a missing player playthrough is no longer a stop condition for proceeding to P1/P2/P3/P4 implementation. Do not mark acceptance complete without later verification.
- **Deployment economy:** do not trigger or ask for repeated Vercel deployments for routine source edits. Any automatic deployments caused by main commits depend on the repository's hosting configuration and are not guaranteed to be avoidable.

---

## Delivery plan — playable-first milestones (owner-approved, 18 October 2026)

**North star:** Make a complete, enjoyable standard skirmish reliably playable from match setup through victory/defeat, then calibrate AI and Xbox controls against AoE2: DE Xbox. Prioritise integrated game behaviour over repeated small defensive fixes. Existing implemented code is **not** evidence of full-match acceptance.

**Status legend:** `[ ]` not yet accepted; `[~]` implemented in part, acceptance pending; `[x]` verified with recorded evidence. For each milestone distinguish (1) implementation committed, (2) focused automated checks run, and (3) complete in-browser/Xbox playthrough verified. Do not check a milestone off based solely on source inspection or commits. Record test date, environment and failure/reproduction details.

**First implementation under this plan (18 October):** Ship A* navigation now excludes occupied/blocked water tiles, and beach staging rejects diagonally adjacent water cells when the corner crossing is obstructed. Both changes are committed to main; no full-match or Xbox acceptance is claimed.

**Save restoration validation (18 October):** Added explicit bounds/type validation for transport unload beaches and retry timers, and for legacy or timed villager resource avoidance entries. Committed to main; actual browser save/load round trips remain unverified. This supports P0 and P3 without changing their acceptance status.

### P0 — Standard skirmish match end to end (next development priority)
- [~] Match setup and starting conditions: confirm standard resource, age, population, starting-unit and AI difficulty settings start a playable match; label custom presets as custom.
- [~] Core economy and progression: villagers gather/deposit each resource, construct and repair, produce units, research technologies, advance ages and respect population/resource costs.
- [~] Combat and match completion: move/path, select/order, attack, defend, siege, death cleanup, diplomacy and victory/defeat resolution all work together.
- [~] Land/naval maps: transports, garrisons, coast landing, trade and multi-unit orders function without stranded units or unresponsive commands.
- [ ] Acceptance: complete at least one standard land skirmish from start to victory and one to defeat, plus one naval/island match; capture any blocker and fix it before marking complete.
- [ ] Run focused simulation/startup regression checks after integrated changes; distinguish executable checks from browser acceptance.

### P1 — AI difficulty and fairness
- [~] Audit easy/standard/hard AI build orders, resource gathering, production, expansion, attack/defence, retreats, diplomacy and map navigation.
- [ ] Play complete matches against easy, standard and hard, documenting economy, military pressure, responsiveness and whether each difficulty is realistically beatable/challenging.
- [ ] Verify AI obeys the same economy, fog, unit production, movement, healing and combat rules as players; no hidden resource/HP bonuses unless the actual reference mode requires them.
- [ ] Adjust decision frequency and tactics based on observed playability, not merely unit stat boosts; repeat only targeted difficulty acceptance after fixes.

### P2 — Xbox controller and in-game experience
- [~] Verify all essential actions in gameplay: camera pan/zoom, cursor, unit/building selection, construction, production, group commands, attack, gather, garrison, unload, rally and pause.
- [~] Confirm villager resource priorities and automation can be changed during play; match AoE2 DE Xbox behaviour where confirmed.
- [ ] Test controller navigation and prompts in setup, pause, save/load, options and end-of-match screens; prevent focus traps and accidental orders.
- [ ] Run actual Xbox Edge/controller acceptance and performance checks; desktop browser/controller checks alone do not certify Xbox compatibility.

### P3 — Saves and recovery
- [~] Manual save/list/load/delete and autosave slot overwrite exist or have implementation work recorded; verify actual behaviour instead of assuming correctness.
- [ ] Confirm autosave overwrites the intended last-played match slot without deleting unrelated manual saves; deletion only affects selected slot.
- [ ] Save during economy, combat, production, trade and loaded transport/garrison; reload and continue long enough to verify AI, paths, queues, diplomacy, resources and victory conditions.
- [ ] Validate corrupt/legacy save recovery and report user-facing failures without silently losing good slots.

### P4 — Campaigns, parity and polish
- [~] Play through and fix all 19 campaign missions, including progression, triggers, objectives, failure/retry and persistence.
- [ ] Review remaining AoE2 DE Xbox feature differences (starting presets, victory modes, population settings, diplomacy/trade automation and AI behaviour); mark verified reference matches separately from custom features.
- [ ] Profile sustained large-population games, naval pathfinding, effects, memory and input latency on target hardware; fix measured bottlenecks.
- [ ] Final acceptance: stable skirmishes, calibrated AI, usable Xbox controls, reliable saves and completed campaign playthroughs. No blanket 'complete' claim before evidence.

### Execution sequence for large batches
1. Start with the highest-impact **unaccepted P0 blocker**, not the most recently edited subsystem. Inspect relevant implementation, make cohesive fixes across files and perform one focused check where feasible.
2. Continue to the next blocker in the same turn; aim for roughly 30 **meaningful changes**, not 30 artificially split commits. Keep all commits on `main`; do not request repeated permission to continue.
3. After P0 is demonstrably stable, prioritise P1, then P2, P3 and P4. Critical save or controller blockers discovered during P0 may be fixed immediately.
4. Update this milestone status and record what was **committed**, what was **actually executed/tested**, and what **still needs a real match/Xbox session**. Avoid redundant test loops and documentation-only batches.

---

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

**Pathfinding and garrison performance (18 October):** Transport beach routing now performs one multi-goal A* search over valid water staging tiles instead of up to 96 separate route searches. Building garrisons collect distinct passable perimeter positions once and release passengers to unique tiles in nearest-first order. Live gameplay and save/load regression verification still required.

**Integrated transport and villager pass (18 October):** Transport unloading now precomputes unique, scored coastal landing tiles for its manifest, preserves aboard passengers when shore space is exhausted, and consolidates cancellation/retry state. Landing checks require clear adjacent navigable water. Villager auto-assignment respects the off toggle even when forced, validates worker positions and clears obsolete resource skip entries after successful routes. Focused in-browser and restored-save verification still pending.

**Larger-batch follow-up (18 October):** Coastal beach routing now retains multiple beach candidates sharing a staging tile, searches more irregular-coast alternatives, and forces a fresh landing plan for restored unload orders without valid beach coordinates. Owner's ~30 meaningful changes per turn preference is recorded above. Still pending live gameplay tests; do not treat commit count as parity proof.

**Villager automation recovery (18 October):** Unreachable resource nodes now use expiring 30-second exclusions rather than permanent blacklists, with legacy string exclusions discarded on access. Auto-assignment tries up to eight alternative deposits, prunes expired entries, and retains automated assignment ownership when automation is toggled off so subsequent rebalancing can work. Gameplay verification pending.

**Coastal route validation (18 October):** Landing search validates ship coordinates, verifies selected water routes terminate beside their chosen beach, and rejects diagonal approaches through blocked shoreline corners. Remaining: end-to-end shoreline unload testing and movement/path corner cases on procedurally generated maps.

**Beach target continuity (18 October):** Landing route selection now records the specific beach beside its reachable water staging tile. Player orders and simulation retries carry this beach target; unloading favours nearby tiles and clears the target after success or failure. This is implementation work, not verified full-match coastline parity.

**Reachable beach staging (18 October):** Added shared transportLandingRoute used by both player commands and simulation retries. It searches unoccupied, passable beaches and adjacent water staging tiles, tries actual water routes, deduplicates candidates and caps path attempts. This replaces broad radius-only approach routing; still needs in-match validation on islands, blocked beaches, docks and save restoration.

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
