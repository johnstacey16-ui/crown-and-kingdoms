# Crown & Kingdoms — Gameplay and Content Roadmap

**Reviewed:** 15 October 2026  
**Target:** controller-first browser RTS, especially Xbox Series S / Microsoft Edge.

This roadmap tracks meaningful remaining work, not a claim of full Age of Empires II: Definitive Edition parity. “Present in source” means an implementation exists; it does not mean it is balanced, bug-free or validated on physical Xbox hardware.

## Status definitions

- **Present:** identifiable implementation exists.
- **Partial:** simplified implementation or known gaps remain.
- **Unverified:** requires a live browser, network, deployment or physical-controller test.
- **Gap:** the requested capability is not yet implemented to the intended standard.

## Current foundation
- **Farm reseeding — delayed-resource recovery improved:** exhausted farm plots are retained when wood is temporarily below 60, then automatically reseeded when the owning kingdom can pay. Each reseed costs 60 wood; farms with enough wood at depletion still reseed immediately. The complete standalone regression suite passed in workflow [#38779691859](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38779691859); worker assignment and economy balance still need in-game verification.
- **Campaign objective integrity:** ranged-army, land-army, war-galley and bombard-cannon objectives now use a guarded active-unit roster; dead, garrisoned, null and unknown-unit entries do not count. Source regression passed in workflow [#38779691859](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38779691859). Campaign balance and in-game validation remain outstanding.
- **AI enemy-composition safety:** counter-unit planning ignores malformed and garrisoned enemy records; naval threat and building-repair scans guard missing/unknown unit metadata. Automated source regression added; live strategic balance remains unverified.
- **AI production and naval scan hardening:** AI no longer attempts training at destroyed production buildings or technology research at destroyed research buildings; queue shape is checked before training decisions. Naval threat/target scans guard invalid unit records, and galley-cap calculations ignore malformed dock queues. Focused regression guards added; full-match balance and Xbox validation remain outstanding.
- **AI input safety — improved:** roster planning skips invalid unit records before unit metadata access and validates the Town Centre queue shape before production decisions. Regression guard added; full simulation and console validation remain outstanding.

- **AI roster correctness — improved, not complete:** AI strategic counts now use living units; garrisoned units are excluded from active worker and combat/naval pools. This prevents stale dead records and sheltered units from suppressing replacement production or inflating field strength. Regression test added; full skirmish balance and Xbox performance still require live testing.

- **Naval AI response — improved, not complete:** hostile combat ships can trigger dock construction even when no nearby fish node is present, and war-galley production cap scales from 4 to 12 by threat count. Source-level regression guards are in place; map-valid dock placement, actual ship production, combat tactics and Xbox performance remain unverified in live play.

- **AI naval production — improved:** war-galley cap scales from a four-ship baseline to a maximum of twelve based on hostile combat ships; fishing, transport and trade ships are excluded from the threat count. Regression guard added. Still unverified in a full naval match and on Xbox hardware.


The project already contains four-age progression; economy and trading; construction and repair; ground, siege and naval units; research and unit upgrades; rival AI; formations and stances; fog of war and minimap; procedural/fixed maps; campaign missions and timed events; multiple victory modes; local save/load; controller-oriented menus; procedural audio; local SVG sprite atlases with fallbacks; and a lightweight Supabase Realtime lobby.

The main runtime is split into classic scripts. `engine.js` remains responsible for top-level orchestration, frame scheduling, game state and controller command integration. `js/ui.js` owns screen presentation, `js/render.js` owns world drawing, `js/minimap.js` owns minimap rendering and fog-of-war visibility, and `js/campaign.js` now owns shared campaign helpers for Town Centre lookup, building/unit counts, military counts, initial unit groups and completed scenario buildings. Dedicated modules also own AI, simulation, maps, pathfinding, economy and related systems. Preserve the current script order and shared globals during further refactoring.

## Priority 1 — correctness and release confidence

### 1.1 Runtime stability
- **Automated smoke coverage passed:** the real-engine harness starts all 19 campaign missions and advances each for 10 simulated seconds, including early AI/event processing. **Still unverified:** full skirmish and campaign playthroughs from cold start through victory/defeat, plus real-browser pause/resume, save/load, age-up, queued production, garrison/unload, diplomacy and naval combat.
- Reproduce every newly reported runtime error, fix the underlying path and add a focused regression test. The campaign timed-raid helper now exits safely if the enemy Town Centre has already been destroyed, with a regression assertion in `tests/campaign-progression.test.mjs`. The shared campaign Town Centre lookup also ignores zero-health records, so enemy-TC objectives can complete after destruction. The Golden Coast and The Strait’s Last Relic no longer force an immediate win on Town Centre destruction; all mission objectives must be complete first. The Siege of Kronburg castle objective now checks for a living enemy Castle (`hp > 0`), so a retained zero-health building record cannot block completion; the same regression test checks all three castle-destruction objectives. Relic objectives now require the relic to be stored in a completed monastery; `tests/campaign-relic-objectives.test.mjs` guards all three relic-goal checks. The Watch Tower mission's ranged-soldier objective now counts living ranged combat units rather than any military unit, guarded by `tests/campaign-ranged-objective.test.mjs`. The naval campaign's land-army objective also excludes noncombat trade carts; `tests/campaign-land-army-objective.test.mjs` protects that rule.
- Check error-overlay recovery and ensure a caught frame error cannot leave the game silently half-running.
- **Acceptance:** automated checks pass and the critical flows above are exercised in a real browser. Xbox acceptance remains a separate gate.

### 1.2 Save and offline compatibility
- **Present:** localStorage compatibility and IndexedDB backup/restore.
- **Implemented in source:** `loadG()` rejects malformed JSON, invalid simulation time, unsupported map dimensions, missing or inconsistent team arrays, malformed player-statistics shape, invalid terrain encodings, invalid resource values, unknown unit/building/resource-node types, malformed entity coordinates, and out-of-range or malformed unit/building/relic relationship references before replacing the current game state. `tests/save-validation.test.mjs` covers malformed payload rejection and verifies the current state is left untouched.
- **Still required:** run the complete Node regression suite against the latest commit and exercise valid older saves; malformed-payload guards do not prove backward compatibility.
- **Partial/unverified:** exercise the new guard and older save payloads in the complete Node suite; test interrupted writes, quota/storage denial, campaign progression, diplomacy and mode-specific state through save/load; test service-worker updates from older cached versions.
- **Autosave implemented in source:** while a local game is actively playing, `engine.js` calls `saveG(true)` at 60-second intervals. `js/save.js` writes to the single rolling `ck_autosave` key, replacing the previous autosave rather than accumulating slots. Autosave is suppressed while the multiplayer runtime reports an active match; it does not claim to save a shared authoritative multiplayer state. The manual save slots remain separate.
- **Regression coverage added and executed:** `tests/autosave-policy.test.mjs` checks the 60-second trigger, stable single-slot key, save/load key and suppression during active multiplayer, including pause/blur autosave. `tests/autosave-recovery-ui.test.mjs` guards the Load Game recovery action and the documented verification boundary. `tests/save-validation.test.mjs` now also exercises both a throwing adapter and a rejected asynchronous mirror promise, asserting the primary autosave still succeeds and the rejection is handled. `tests/causeway-map.test.mjs` guards the named King's Causeway layout and crossing invariants. The latest full regression suite and sprite-atlas validation passed in GitHub Actions run [#38779691859](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38779691859). The preceding campaign save/load failure was caused by an over-escaped digit matcher in the indexed-reference validator. The matcher was corrected and the valid campaign round-trip now passes in CI. This is automated evidence only; live-browser and Xbox verification remain outstanding.
- **Still required:** run the complete check suite; test interrupted writes and storage quota denial in a real browser; verify valid older saves. Avoid incompatible schema changes without defaults/migration tests.

### 1.3 Controller and accessibility
- **Present:** controller navigation, command menus, pause/resume and remapping.
- **Unverified:** test focus/selection visibility, every menu's B/Back behaviour, repeated button presses, disconnect/reconnect, couch-distance readability and gamepad differences in Edge.
- Keep primary gameplay possible without mouse or keyboard; do not make a feature depend on hover-only interaction.

## Priority 2 — gameplay depth

### 2.1 Technologies and unit progression
- **Present:** age-gated research and shared effects for many upgrades, including infantry sword-line ranks, Pikeman/Halberdier, Cavalry Armour, Conscription and Husbandry. Husbandry increases mounted-unit movement by 10%; the implementation includes the mounted special-unit roster and AI research valuation.
- **Partial:** audit the complete technology list for correct prerequisites, costs, research duration, existing-unit effects, newly trained unit effects, AI valuation and visible battlefield feedback. AI applies a stronger penalty to advanced melee/ranged attack research when it has fewer than two matching troops; `tests/ai-research-priority.test.mjs` guards this. The real-engine simulation smoke test measures live damage deltas for Melee Attack +2/+5 and Ranged Attack +1/+3, and verifies Infantry Armour, Archer Armour and Cavalry Armour each reduce the appropriate incoming damage by one. The cavalry-armour regression was added in commit [`f66ffa2`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/f66ffa2036fb7ddba011900d835870628ff8cd2a), and the full configured suite passed in workflow [#38750282999](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38750282999). These tests validate isolated simulation effects, not full-match balance or Xbox performance.
- Ensure each technology has a real, testable gameplay effect rather than a UI-only entry. Check stacking, repeated research prevention and save/load persistence.
- Keep balance values labelled as project rules; do not imply exact official AoE2 values unless independently verified.

### 2.2 AI strategy and counterplay
- **Present:** economic expansion, composition-aware research, defensive response, grouped attacks, siege targeting, repairs and several naval behaviours.
- **Partial:** AI naval threat assessment distinguishes combat-capable warships from fishing ships, transports and trade cogs, so economic vessels do not trigger combat-ship counter priorities. Warship target scoring is extracted into a named helper that favours combat-capable enemy ships and coordinates focus fire, while retaining a fallback target if no warship is nearby. **Completed in code + regression guards:** hostile combat ships trigger dock construction without requiring a nearby fish node (with the existing age/villager gates retained); war-galley production cap scales from 4 to 12 based on hostile combat-ship count. The cap includes ships already queued at AI docks to prevent overproduction. Fishing, transport and trade ships are excluded from the threat count. Naval attack research is valued against any detected combat-ship class. **Still partial:** validate dock placement, sustained ship production and tactics in live island/coastal matches. Ground-unit counter production now evaluates cavalry, ranged, siege and infantry threats together, choosing a counter group based on threat size and the AI's existing counter numbers instead of ignoring all but the first matching threat category. Naval target selection also excludes garrisoned enemy ships. `tests/naval-ai-priority.test.mjs` and `tests/ai-naval-threat-classification.test.mjs` guard target scoring, threat classification and counter priorities. Longer matches are still needed to validate strategic quality.
- Add deterministic scenario tests for key decisions, then play longer matches to assess strategy quality. Static source assertions alone cannot establish competent AI.

### 2.3 Naval and map systems
- **Present:** docks, fishing, trade cogs, warships, ship repair/retreat logic, named layouts and connectivity diagnostics.
- **Partial:** map-connectivity diagnostics now reject diagonal corner cutting consistently with A*, A* rejects out-of-bounds start coordinates, and naval AI no longer targets garrisoned ships; these changes passed workflow [#38780927885](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38780927885). Still verify transport/loading/unloading, water access, land/water route failures, ship targeting, shore interactions and AI naval objectives on island, coastal and mixed maps.
- Ensure procedural map retries terminate safely and every generated starting position has valid routes and resources.

### 2.4 Campaign and scenarios
- **Present:** a 19-mission campaign structure, objective evaluation, timed events and progression/unlocks, including The Causeway Muster and The Siege of Tidewatch.
- **Partial:** automated real-engine boot coverage now runs all 19 missions for 10 simulated seconds each (workflow [#38780927885](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38780927885)); this catches startup and early-event regressions, but is not a full playthrough. Still play every mission through objective order, timers, victory/defeat, unlocks and save/resume before calling the campaign complete.
- Add automated checks for mission prerequisites and objective reachability; reserve actual mission completion for browser playtests.

### 2.5 Economy, diplomacy and match rules
- **Present:** gathering, farms and reseeding, market trading, relic income, trade routes, tribute, player-controlled Enemy/Neutral/Ally relationships, victory modes and population-limit options. Trader route resolution now rejects destroyed (`hp <= 0`) source and destination Markets/Docks, reselects a living source when possible, and falls back to the existing retry wait when no living destination exists. Regression guards are in `tests/trade-routes.test.mjs` (commits `407efc8` and `78954bd`).
- **Partial:** test economy pacing, inaccessible resources, failed trade routes, allied support, hostility transitions and each victory condition. Treaty duration, AI-negotiated diplomacy and comprehensive allied victory rules remain gaps. Controller-selectable tribute amounts now move in 50-resource increments from 50 to 5,000; regression coverage checks bounds and exact transfer selection.
- AI military research scores infantry, ranged and cavalry armour against the AI's own deployed army composition, and values melee/ranged attack upgrades when those classes are fielded. Enemy composition still influences defensive and counter-tech priorities; enemy ranged/infantry counts do not override the need for the AI's own units. Research scoring penalizes armour, Husbandry and standard attack upgrades when matching classes are absent. The latest change also penalizes advanced melee/ranged attack upgrades (`atkM2`/`atkR2`) by 28 priority points when fewer than two matching troops are fielded, with focused regression assertions. The complete standalone regression suite and sprite-atlas validation passed in workflow [#38779988675](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38779988675).
- Keep population settings distinct from actual housing capacity; the chosen ceiling is not a free grant of population slots.

## Priority 3 — visuals, audio and feedback

- **Present:** original SVG atlas assets, animation metadata, procedural fallbacks, team-colour cues, equipment/rank cues, terrain details and synthesised spatial/adaptive audio.
- **Partial:** units now gain a dark-outlined team-colour ground marker below strategic zoom (`zm < 0.8`), with a source regression guard. This is a readability aid, not a substitute for inspecting unit equipment, building silhouettes, animation and terrain contrast in a real browser/TV; that visual acceptance remains outstanding.
- **Unverified:** inspect real frames in a browser and on a TV at normal viewing distance. Atlas metadata validation does not confirm visual quality or correct animation playback.
- Verify audio autoplay/resume, mute/volume controls and graceful handling when browser audio is unavailable.

## Priority 4 — performance and scale

- **Present:** fixed-step simulation, terrain chunk rendering, spatial bucket targeting, pooled unit-separation buckets, and Town Bell shelter assignment that pre-counts garrison occupancy rather than rescanning all units for every villager/shelter pair. Real-engine tests cover Town Bell capacity reservations and simulation-only 100/200/400-unit timing. The benchmark now also measures 400 opposing units with attack orders for three 30-tick samples. The pooled separation grid activates above 64 units. Workflow [#38781245960](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38781245960) passed. Its Node-runner medians were 5.59/10.46/19.00 ms for 30 idle ticks at 100/200/400 units, and 259.03 ms for 30 ticks with 400 opposing units. These are a repeatable baseline, not Xbox frame-rate evidence; the combat result warrants profiling before any 400-unit target claim.
- **Unverified:** profile 200- and 400-unit matches with four kingdoms on Xbox Series S / Edge. Record frame time, simulation step cost, memory and input latency; compare quiet economy, dense combat, naval scenes and fog-of-war-heavy maps.
- Only add viewport culling, further spatial indexes or reduced update rates when measurements identify a bottleneck and tests preserve gameplay behaviour.
- Do not describe spatial indexing as a proven FPS improvement until measured on target hardware.

## Priority 5 — multiplayer boundary

- **Present:** Supabase Realtime lobby/player markers and presence integration.
- **Gap:** authoritative synchronization of a complete RTS match is not implemented. The current lobby is not online multiplayer gameplay.
- Improve reconnect behaviour, room-code normalization, stale-presence cleanup and duplicate-session handling within the current broadcast/presence design. Do not introduce Postgres Changes or database writes as an assumed fallback.
- Host migration is not part of the current plan; the intended rule is that host loss ends the match.

## Engine refactoring rules

Continue extracting only cohesive responsibilities from `engine.js`; avoid moving functions merely to reduce line count. For every extraction:

1. Preserve public function names, shared state and controller behaviour.
2. Keep classic-script dependency order valid.
3. Update `index.html`, `sw.js`, `scripts/check-game.mjs` and tests in the same commit when affected.
4. Add or update a focused ownership/integration test.
5. Run the full automated check set and report actual results.
6. Do not mix behaviour changes into a structural-only refactor unless the change has its own regression coverage.

## Definition of done

A feature is **implemented** only when its code path is present and reachable. It is **regression-checked** when the relevant automated tests pass. It is **playtested** only after the behaviour has been exercised in a live browser. It is **Xbox-verified** only after direct testing on the target console/browser. Deployment is confirmed only from the exact commit's deployment status.

## Automated checks

Run with Node.js 22 or a compatible current release:

```sh
node scripts/check-game.mjs
for test in tests/*.test.mjs; do node "$test" || exit 1; done
node tests/validate-atlas.mjs
```

GitHub Actions discovers all `tests/*.test.mjs` files. These checks cover source syntax, invariants, focused regression cases and atlas metadata; they do not replace complete-match, network, deployment or Xbox testing.

## Next work order

1. Continue substantive technology-effect, AI strategy/naval, and campaign objective/event work using the real-engine smoke harness where possible.
2. Fix the highest-impact reproducible behaviour revealed by runtime coverage; avoid adding duplicate source-only audits for already covered behaviour.
4. Exercise cold start, pause/resume, save/load, complete campaign missions and naval routes in a live browser.
5. Continue cohesive engine/UI extraction only when it preserves script order, shared state and controller behaviour, with focused integration coverage.
6. Confirm deployment and physically test controller-only play and 400-unit performance on Xbox Series S / Edge when hardware access is available.

## Latest implementation checkpoint — 15 October 2026
- Campaign objective regressions (dead Castle/Town Centre handling and multi-objective victory gating) pass the full configured suite and atlas validation in workflow [#38754834027](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38754834027), commit `3dfe8be83f97b517db5932fea1c34a87b0eb8564`. Live mission completion and Xbox behaviour remain unverified.

- Code commit: `94a22c18d363e49e3a54df892ba46fe49a957c9d` adds a real-engine boot-and-tick smoke test for all 19 defined campaign missions; the same tested branch contains the corrected benchmark for 100, 200 and 400 **total** live units rather than adding that many to the seeded army.
- The benchmark warms both sides of the current 64-unit separation fallback threshold and reports median/range across three simulation-only samples for each population.
- Workflow [#38747786721](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38747786721) completed successfully for the corrected campaign code/tests and ran the complete configured regression suite, including all 19 campaign startup checks and arc coverage validation.
- All 19 defined campaign missions each started with units/buildings and survived one simulated second; this is startup smoke coverage, not full mission completion.
- Fixed a progression defect where the campaign arc list referenced nonexistent ID 19. The defined campaign has 19 missions (IDs 0–18); Iron Pass is grouped under Northern March and the Causeway Campaign now references only its two defined missions. A regression test enforces that every mission is included exactly once with no invalid IDs.
- Latest simulation-only Node CI timings over 30 fixed steps and three repeats: 100 total units median **6.24 ms** (range 6.11–6.26); 200 total units median **10.97 ms** (10.94–11.16); 400 total units median **20.64 ms** (20.58–24.32). Earlier successful samples were faster, demonstrating that shared CI timing varies.
- These are Node simulation timings, not browser-render timings, Xbox frame-rate or physical console verification. Earlier 120/220/420 total-unit timings are superseded by this exact-population benchmark.
- Automated CI is not a full live browser playthrough, production deployment confirmation, multiplayer validation or physical Xbox verification.

### AI recovery after destroyed buildings — 15 October 2026

- AI building-count checks now ignore structures with `hp <= 0`, so destroyed production/economy buildings no longer permanently suppress replacement planning.
- Living foundations remain counted to avoid duplicate builds while construction is in progress.
- Regression guard: `tests/ai-rebuild-destroyed-buildings.test.mjs`. Treat this as implemented with a focused source regression guard; full-match recovery still needs playtesting.


### AI recovery after structure loss — expanded — 15 October 2026

- Extended the living-building filter beyond generic production counts: AI construction anchors now require a living Town Centre, dead walls/Barracks/Houses/Docks no longer suppress planning, dead structures do not block AI resource-site rebuilds, and trade planning ignores destroyed enemy Markets/Docks.
- Expanded the focused regression test at `tests/ai-rebuild-destroyed-buildings.test.mjs`. The full AI recovery behaviour still requires gameplay simulation/playtesting.


### AI age-up planning uses valid current-age buildings — 15 October 2026

- Aligned the AI's age-up decision gate with the actual age research rules: only completed, living structures eligible for the current age count toward the two-building requirement.
- This avoids dead or wrong-age buildings falsely satisfying the AI's age-up gate and affecting villager production. Regression assertion added to `tests/ai-rebuild-destroyed-buildings.test.mjs`.


### Destroyed buildings stop processing work — 15 October 2026

- `upB` now skips buildings with zero or negative health as well as unfinished buildings. A structure destroyed earlier in the current simulation tick cannot still finish research, spawn queued production, or fire a defensive weapon in that tick.
- Regression guard: `tests/destroyed-building-work.test.mjs`. Full runtime and gameplay verification remain required.


### Reject invalid production and research commands — 15 October 2026

- Production commands now validate that the building is alive, completed, supports the requested unit, and that the unit exists before charging resources.
- Research commands reject dead or unfinished buildings before charging resources.
- Regression guard: `tests/invalid-building-commands.test.mjs`. Runtime validation is still needed.


### Patrol command eligibility — 15 October 2026

- Patrol is restricted to living, ungarrisoned combat units and warships, excluding workers, fishing boats, traders, transports and monks.
- Invalid selections receive a clear message; eligible units have stale target/path state cleared before the patrol starts.
- Regression test: `tests/patrol-order-validation.test.mjs`. Runtime playtesting remains outstanding.


### Production cancellation validation — 15 October 2026

- Cancellation validates the building, owner, queue and queued unit before refunding resources.
- Prevents stale selections or malformed queue entries from triggering invalid refunds; valid cancellations preserve newest-item/full-refund behaviour.
- Regression test: `tests/production-cancellation-validation.test.mjs`. Runtime validation remains outstanding.


### Garrison unload validation — 15 October 2026

- Unload commands validate that the building is alive, completed, owned by a valid team, supports garrisoning and actually contains units.
- Safe-spawn failure leaves units inside; invalid commands provide feedback.
- Regression test: `tests/garrison-unload-validation.test.mjs`. Runtime testing remains outstanding.


### Town Bell capacity correction — 15 October 2026

- Shelter occupancy is derived from unique living units actually garrisoned in the shelter, so stale/dead references cannot make an available shelter appear full.
- Existing reservation and capacity checks remain in place.
- Regression test: `tests/town-bell-garrison-capacity.test.mjs`. Runtime validation remains outstanding.


### Building placement input validation — 15 October 2026

- Invalid building/team inputs and non-integer placement coordinates are rejected before map checks; existing boundary and terrain rules are preserved.
- Regression test: `tests/building-placement-input-validation.test.mjs`. Runtime validation remains outstanding.


### Production queue shape validation — 15 October 2026

- Training rejects buildings whose production queue is not an array before reading queue length or spending resources.
- Existing eligibility and capacity checks are preserved.
- Regression test: `tests/production-queue-shape-validation.test.mjs`. Runtime validation remains outstanding.


### Campaign objective count correctness — 15 October 2026

- Destroyed buildings no longer satisfy construction goals; dead units no longer satisfy villager or military force goals.
- Regression test: `tests/campaign-objective-live-counts.test.mjs`. Full mission playthrough validation remains outstanding.
