# Crown & Kingdoms — Development Status Ledger

**Last updated:** 15 October 2026  
**Repository:** https://github.com/johnstacey16-ui/crown-and-kingdoms  
**Branch:** `main`

## Purpose

This is the single handover checkpoint. Continue from live code and current CI rather than repeating resolved audits. Record implementation, automated evidence, and outstanding runtime/hardware gates separately.

## Latest implementation checkpoint

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
