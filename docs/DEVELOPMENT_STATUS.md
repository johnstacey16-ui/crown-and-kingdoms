# Crown & Kingdoms — Development Status Ledger

**Last updated:** 15 October 2026  
**Repository:** https://github.com/johnstacey16-ui/crown-and-kingdoms  
**Branch:** `main`

## Purpose

This is the single handover checkpoint. Continue from live code and current CI rather than repeating resolved audits. Record implementation, automated evidence, and outstanding runtime/hardware gates separately.

## Latest implementation checkpoint
- **Autosave policy regression (15 October):** added coverage for the engine's 60-second single-player checkpoint cadence, multiplayer suppression, single rolling `ck_autosave` slot, and preservation of the previous checkpoint when the primary storage write fails. Workflow [#38777012492](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38777012492) passed the source checks, every standalone regression test, and sprite-atlas validation on commit `39ba3fe037cc09d6d5a23a0b653e2990315d905f`. This is automated regression evidence, not a physical-browser storage-quota test.
- **Farm reseeding resilience (15 October):** a farm that expires while its owner has fewer than 60 wood now remains as an exhausted farm plot instead of being deleted. The simulation automatically reseeds exhausted plots when that kingdom later has 60 wood available, deducting the cost once per farm. Existing immediate reseeding remains intact. This closes the delayed-resource gap; in-match economy balance still needs playtesting.
- **Latest verified CI recovery (15 October):** workflow [#38769826384](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38769826384) passed after aligning the naval AI priority regression test with the guarded target filter. This confirms that run's configured checks only; subsequent changes must be checked independently.
- **Naval combat survival improvement (15 October):** low-health disengagement now applies to all living combat warship classes, including ships still advancing toward a target, while excluding fishing ships, transports and trade cogs. Regression coverage is in `tests/ai-naval-threat-classification.test.mjs`. Tactical balance and physical Xbox behavior remain unverified. CI passed in [workflow #38771788345](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38771788345); tactical balance and physical Xbox behavior remain unverified.
- **Naval repair-threat hardening (15 October):** the AI repair-site threat scan now validates unit records and integer team IDs before reading fields, avoiding a null/malformed roster entry crashing the AI decision tick. Regression guard added to `tests/ai-naval-threat-classification.test.mjs`. CI for this newest change is pending; no live Xbox test is implied.
- **Campaign objective integrity (15 October):** added a shared `aliveUnits` roster for combat/fleet objectives. It excludes null/unknown unit records, dead units, and garrisoned units, preventing invalid records from crashing objective evaluation and preventing garrisoned forces from falsely satisfying active-army goals. Focused regression: `tests/campaign-live-unit-guards.test.mjs`; existing ranged/land objective tests updated to the helper. CI pending.
- **AI enemy-composition guard (15 October):** counter-unit planning now excludes malformed, unknown-unit, and garrisoned enemy records; naval counter-planning and building-repair threat checks also guard invalid records. Regression coverage: `tests/ai-enemy-composition-guards.test.mjs`. CI status pending.
- **AI production-site correction (15 October):** unit training now requires a completed, living production building with a valid queue; technology selection now skips destroyed buildings. Naval threat/target scans skip null or malformed unit records, and queued-galley counts ignore docks with malformed queues. Focused guards: `tests/ai-live-production-sites.test.mjs` and `tests/ai-naval-input-guards.test.mjs`. CI is still running; no live Xbox match claim is made.
- **AI planning input hardening (15 October):** AI roster classification now skips null, defeated, and unknown-unit records before reading unit metadata, and villager production checks the Town Centre queue shape before reading its length. Regression guard: `tests/ai-planning-input-guards.test.mjs`. Automated workflow result pending; this is a source-level safety correction, not a claim of full match validation.
- **AI live-unit planning correction (15 October):** `aiTeam()` now excludes defeated units from the AI's working roster, and excludes garrisoned units from available villagers, active army counts, scouts, fishing ships and war galleys. This prevents dead records or sheltered units from falsely satisfying worker/army thresholds or being treated as active naval capacity. Regression guard: `tests/ai-live-active-roster.test.mjs`. Automated workflow validation pending; full AI skirmish behavior remains unverified in-browser/Xbox.
- **Foe spatial-index filtering (15 October):** `rebuildFoeGrid()` now omits missing, defeated (`hp <= 0`) and garrisoned units from the spatial buckets, while `nearestFoeUnit()` still revalidates candidates in case their state changes after a rebuild. Regression guard: `tests/foe-grid-live-units.test.mjs`. Source assertions have been added; execution in the full workflow is pending.
- **Simulation separation correctness (15 October):** `sep()` now ignores units with `hp <= 0` in both the small-army linear path and the large-army spatial-grid path, so defeated entities cannot receive or cause a final separation displacement before cleanup. `tests/large-army-separation-pool.test.mjs` guards both paths. This is source/regression coverage; the complete suite and 400-unit Xbox profile remain unverified for this latest commit.
- **Verified automated result:** workflow [#38754834027](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38754834027) passed the full configured regression suite and atlas validation on commit `3dfe8be83f97b517db5932fea1c34a87b0eb8564`, including campaign objective and helper-ownership checks. This does not replace live mission playtesting.
- **Campaign Town Centre correctness:** the shared campaign lookup now ignores Town Centres at zero health, so dead building records cannot keep enemy-TC objectives false or allow timed raids to target a destroyed base. Together with removing the two immediate-win overrides, naval campaign missions now rely on their full objective list for victory. Regression guards cover the lookup, raid shutdown, objective gate and dead-castle check; live campaign completion remains unverified.
- **Campaign victory gating:** removed the two `tcw:1` overrides from The Golden Coast and The Strait’s Last Relic. Destroying the enemy Town Centre no longer short-circuits those missions; `cmpTick` must complete every listed objective before awarding campaign victory. Regression coverage also checks the Kronburg dead-castle objective fix. Live mission completion remains unverified.
- **Campaign objective fix (15 October):** the Siege of Kronburg castle objective now treats an enemy Castle with `hp <= 0` as destroyed even when its dead building record remains in `S.bs`. A regression test checks all three castle-destruction campaign objectives use the live-health condition. This is code/test coverage, not a full mission playtest.
- **Naval production refinement:** fleet-cap enforcement now includes war galleys already queued at all AI docks, preventing repeated AI decision ticks from queuing past the 4–12 ship target. Regression guard updated. Code commit `12d803b`; test commit `9ba6c6d`; CI pending.

- **Naval AI follow-through (15 October):** AI dock construction no longer depends solely on a nearby fish node when hostile combat ships are present. It will attempt a dock if it has at least nine villagers and meets the existing age gate (`S.age[t]>=1`), with either six army units or an active naval threat. Combined with the adaptive 4–12 war-galley cap, this makes naval defence respond to enemy fleets rather than only economic fishing opportunities. Regression guards cover fleet sizing and dock-trigger conditions; a full water-map match remains to be played.

- **New gameplay change (15 October): adaptive AI naval force size.** Rival AI now targets a war-galley fleet cap of `min(12, max(4, 2 + 2 × hostile combat ships))`, instead of stopping at four galleys regardless of the player's fleet. Fishing, transport and trade ships do not inflate the threat count. Added a regression guard in `tests/ai-research-priority.test.mjs`; workflow result pending at this checkpoint. This changes the production cap only; tactical naval pathing and physical Xbox performance still need live playtesting.


- **Latest code/test checkpoint:** `f66ffa2036fb7ddba011900d835870628ff8cd2a` — real-engine combat checks verify attack-research bonuses and infantry, archer and cavalry armour reductions, following the AI research-priority fix.
- **Green code workflow:** [#38747786721](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38747786721) completed successfully for the corrected campaign progression/test commits, including source checks, all standalone regression tests and atlas validation.
- Corrected the large-army smoke benchmark so 100, 200 and 400 mean **total live units**, including the seeded starting force, rather than adding 100/200/400 on top of it. Timing still covers simulation steps only, uses three samples per population and reports median/range.
- Added real-engine campaign matrix coverage: all 19 defined missions initialise with units/buildings and advance for one simulated second without an exception. This verifies startup only, not mission completion or balance.
- Fixed a real campaign progression defect: the arc list referenced nonexistent mission ID 19, while the actual array contains 19 missions (IDs 0–18). Iron Pass (ID 18) now belongs to Northern March; Causeway Campaign contains IDs 16–17. Regression coverage proves every defined mission ID appears exactly once in the campaign arcs and no missing/out-of-range mission is referenced.
- AI research scoring applies a stronger penalty to advanced melee attack research (`atkM2`) when the AI has fewer than two melee troops, and advanced ranged attack research (`atkR2`) when it has fewer than two ranged troops. Added source-level regression guards in `tests/ai-research-priority.test.mjs`.
- Expanded the real-engine smoke harness to measure actual combat damage with attack research disabled/enabled. It asserts Melee Attack +2/+5 and Ranged Attack +1/+3 change damage by the stated amounts, and verifies Infantry Armour and Archer Armour each reduce the appropriate live incoming damage by one. Workflow [#38749358700](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38749358700) passed the full configured suite. These are runtime simulation checks, not full-match balance or Xbox tests.
- Corrected the benchmark warm-up comment to reflect the current 64-unit separation fallback threshold.
- **Latest simulation-only benchmark (Node CI runner; 30 steps, 3 repeats):** 100 total units median 6.24 ms (6.11–6.26); 200 total units median 10.97 ms (10.94–11.16); 400 total units median 20.64 ms (20.58–24.32). These timings cover simulation steps only and are not Xbox frame-rate or browser-render timings. An earlier passing run measured 4.99 / 8.94 / 15.89 ms respectively; CI runner load varies.
- The separation fallback is limited to 64 or fewer units; larger armies use pooled spatial-grid separation. Earlier 120/220/420-unit measurements motivated this threshold change but are superseded by the exact-total benchmark above.
- Town Bell shelter assignment was optimised to build eligible shelters once, count existing/en-route occupancy in one pass, and update reservations as villagers are assigned. Behavioural coverage checks that assignment never overbooks shelter capacity.

## Earlier successful workflow checkpoints

- Code checkpoint `a2187d200dfcd6e2c75d339c5fda8fbd3fae8039`, workflow [#947](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38746092399), passed the configured source checks, standalone regression tests and atlas validation.
- Later documentation checkpoint `fe030d76ba8a9e5a8e055c6a5d4f0e7c8b51e323`, workflow [#949](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38746222015), also completed successfully.
- The exact-population benchmark and 19-mission startup matrix passed workflow [#38747786721](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38747786721).

## What CI verifies

Workflow: `.github/workflows/game-regression.yml`

1. `node scripts/check-game.mjs` — script parsing and source invariants.
2. Every `tests/*.test.mjs` standalone regression test.
3. `node tests/validate-atlas.mjs` — sprite-atlas metadata and frame bounds.

The browser-like harness executes the real classic-script game engine for selected behaviours including research completion, construction, trade routes, naval movement/combat/repair, campaign objectives, save/load, AI growth and Town Bell assignments. These checks are stronger than source-only assertions, but still do not prove full-match balance, successful live deployment, or physical Xbox performance.

## Status snapshot

| Area | Evidence-based status |
| --- | --- |
| Save validation and indexed entity references | Fixed at the previously green code checkpoint; valid campaign save/load round-trip is covered |
| Local autosave | One rolling `ck_autosave` slot at 60-second intervals in active local play; multiplayer autosave suppressed; browser storage denial/recovery still needs live verification |
| Technology | Many researched effects have source guards and runtime smoke tests for Gather Rate, Man-at-Arms HP, Bloodlines, Chemistry and newly created units; AI now penalizes advanced attack upgrades without a matching army; full latest workflow pending; not every technology is fully balance-tested |
| Campaign | All 19 defined missions passed real-engine startup plus one simulated second; objective-specific regressions and selected real objective completion are covered; full playthroughs remain unverified |
| AI | Growth, age progression, coordinated siege, defensive response, research priority, retreat and naval threat logic have focused coverage; complete-match strategy remains unverified |
| Maps/naval | Generated-map connectivity and selected real ship movement/combat/repair paths are covered; every layout and coastal edge case is not certified |
| Rendering/assets | Atlas metadata/frame validation is automated; graphics quality and performance require visual browser/hardware review |
| Controller-only UX | Controller-oriented input/menu checks exist; full controller-only journey still needs live browser and physical-controller validation |
| Large armies | Pooled separation path above 64 units; exact 100/200/400 total-population simulation benchmark passed CI |
| Multiplayer | Lightweight Supabase Realtime lobby/session only; not full authoritative RTS state synchronization |
| Xbox Series S / Edge | **Not physically verified** |

## Next implementation work — no repeat-audit loop

1. Continue the highest-impact gameplay work: close measurable technology-effect gaps, deepen AI/naval/campaign completion coverage, and fix reproducible defects rather than adding redundant source regexes.
3. Keep the development ledger and parity roadmap aligned with every meaningful implementation and exact CI result.
4. Run live browser playthroughs for cold start, pause/resume, save/load, campaign completion, naval routes and end conditions when a browser session is available.
5. Validate deployment and physical Xbox Series S / Edge controller/performance separately; never infer those results from Node CI.

## Working rule

A passing assertion is not the same as a finished feature. Mark work as implemented, regression-checked, browser-playtested or Xbox-verified only at the corresponding evidence level. Never weaken a correct test to obtain a green build, and never claim physical Xbox testing without actually performing it.


## 15 October 2026 — AI replacement planning after structure loss

- Fixed AI building-count logic in `js/ai.js`: destroyed structures (`hp <= 0`) no longer count as existing production/economy buildings. The AI can therefore consider rebuilding lost Markets, Barracks, Docks and other structures instead of treating a destroyed shell as a permanent completed requirement.
- Living foundations still count, preventing duplicate construction while a replacement is already underway.
- Added `tests/ai-rebuild-destroyed-buildings.test.mjs` to guard the planning rule. This is source-level regression coverage; full AI match behaviour and Xbox performance are not claimed as tested.


## 15 October 2026 — AI recovery coverage expanded

- Extended the destroyed-structure recovery fix across AI planning: Town Centre lookups require a living Town Centre; destroyed walls, Barracks, Houses and Docks no longer count toward planning caps; destroyed structures no longer block resource-site construction; destroyed enemy Markets/Docks no longer qualify as trade destinations.
- Living structures and foundations still count where appropriate to prevent duplicate orders.
- Expanded `tests/ai-rebuild-destroyed-buildings.test.mjs` to cover these source-level rules. This is a focused regression guard, not a substitute for a full simulated AI recovery match.


## 15 October 2026 — AI age-up requirement consistency

- Corrected the AI's villager-production/age-up gate to count only completed, living buildings that qualify for the current age. It now matches the actual `research(b,'age')` requirement check, including the building's age.
- Prevents destroyed or wrong-age structures from falsely satisfying the AI's two-building age-up requirement and suppressing villager production.
- Added a focused assertion to `tests/ai-rebuild-destroyed-buildings.test.mjs`. Full match behaviour remains subject to the regression suite and gameplay testing.


## 15 October 2026 — Destroyed-building work cancellation

- Building updates now return immediately for destroyed structures, not just unfinished structures. This prevents a building killed earlier in the same simulation tick from completing research, finishing a queued unit, or firing its defensive attack during its final update.
- Added `tests/destroyed-building-work.test.mjs` to guard the update order and retain checks that living completed buildings still process research and queues.
- Focused source assertions are not a claim that the full Node suite or live browser/Xbox playtest has passed.


## 15 October 2026 — Production/research command validation

- `train` now rejects missing, destroyed, unfinished, invalid-owner, or incompatible buildings/units before charging resources or adding a queue item.
- `research` now rejects destroyed and unfinished buildings before spending resources. This closes stale-selection / same-tick command paths that could otherwise charge the player for work that cannot progress.
- Added `tests/invalid-building-commands.test.mjs` to guard validation ordering and ensure valid commands still reach the resource-payment/queue path.
- Source checks do not substitute for executing the Node suite or a live gameplay test.


## 15 October 2026 — Patrol command eligibility

- Patrol orders now apply only to living, ungarrisoned non-worker combat units and warships. Fishing boats, trade units, transports, monks and villagers keep their existing role instead of having work/orders overwritten.
- Patrol clears stale target/path state and reports when no eligible units were selected.
- Regression guard: `tests/patrol-order-validation.test.mjs`.
- Source assertions have been added; full test execution and controller/browser gameplay validation remain pending.


## 15 October 2026 — Production cancellation validation

- Queue cancellation now rejects destroyed/unfinished buildings, invalid owners, empty queues and malformed queue entries before issuing refunds.
- Valid cancellation still removes the newest queued unit and refunds its cost.
- Regression guard: `tests/production-cancellation-validation.test.mjs`.
- Source checks are not equivalent to running the Node suite or testing controller behaviour in a browser/Xbox.


## 15 October 2026 — Garrison unload command validation

- Unload now rejects missing, destroyed, unfinished, invalid-owner, non-garrison and empty buildings before changing unit state.
- A clear message is shown for invalid requests. Units that cannot find a safe, free tile remain garrisoned rather than being silently released into blocked terrain.
- Regression guard: `tests/garrison-unload-validation.test.mjs`.
- Source-level checks only; Node suite and controller/browser gameplay testing remain outstanding.


## 15 October 2026 — Town Bell shelter capacity

- Town Bell now counts unique, living units whose `ld` reference confirms they are actually inside each shelter, rather than trusting the raw garrison-array length.
- Dead or stale garrison references no longer falsely consume shelter capacity; valid shelter reservations and same-command capacity accounting are retained.
- Regression guard: `tests/town-bell-garrison-capacity.test.mjs`.
- Source-level checks only; Node test execution and Xbox/browser gameplay remain unverified.


## 15 October 2026 — Building placement input validation

- `okPlace` now rejects missing game state, unknown building definitions, invalid team indices and non-integer coordinates before reading building dimensions or checking map tiles.
- Existing map-edge, terrain, water and player-exploration checks remain intact.
- Regression guard: `tests/building-placement-input-validation.test.mjs`.
- Source-level checks only; Node execution and browser/controller testing remain outstanding.


## 15 October 2026 — Production queue shape validation

- `train` now rejects a missing or malformed production queue before checking queue length or spending resources.
- Existing owner/building/unit compatibility, age, resource, population-cap and queue-capacity checks remain in place.
- Regression guard: `tests/production-queue-shape-validation.test.mjs`.
- Source-level checks only; Node execution and browser/controller testing remain outstanding.


## 15 October 2026 — Campaign objective counts

- Campaign helpers now count only living units for villager and military-force objectives, and only surviving completed buildings for construction objectives.
- Unknown unit definitions are excluded safely from military counts.
- Regression guard: `tests/campaign-objective-live-counts.test.mjs`.
- Source-level validation only; the Node test and live campaign playthrough have not been run in this environment.


## 15 October 2026 — technology scope guard

- Updated [the browser technology roadmap](BROWSER_TECH_ROADMAP.md) with an explicit evidence-based rule: keep JavaScript, CSS, JSON and Canvas 2D as the current stack; treat SVG as optional UI art; defer Web Workers, GLSL/WebGL shaders and WebAssembly/Rust until a reproducible bottleneck or specific requirement justifies them.
- The 100/200/400 total-unit Node simulation benchmark remains the repeatable simulation baseline, not an Xbox frame-rate claim. Browser rendering/frame pacing and physical Xbox Series S / Edge verification remain separate gates.
- Documentation-only change; no game runtime files changed and no new test run is claimed. Next work should resume on a reproducible gameplay/runtime issue or a measured performance gap, not introduce optional technology pre-emptively.
