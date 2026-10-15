# Crown & Kingdoms — Development Status Ledger

**Last updated:** 15 October 2026  
**Repository:** https://github.com/johnstacey16-ui/crown-and-kingdoms  
**Branch:** `main`

## Purpose

This is the single handover checkpoint. Continue from live code and current CI rather than repeating resolved audits. Record implementation, automated evidence, and outstanding runtime/hardware gates separately.

## Latest implementation checkpoint

- **Code commit:** `c64e353e0487c51c0d3922c2211bb74d32fd6556` — `test: benchmark exact large-army populations`.
- **CI status at this documentation edit:** workflow [#38746731612](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38746731612) was still running; do not treat this checkpoint as green until that workflow finishes successfully.
- Corrected the large-army smoke benchmark so 100, 200 and 400 mean **total live units**, including the seeded starting force, rather than adding 100/200/400 on top of it. Timing still covers simulation steps only, uses three samples per population and reports median/range.
- Corrected the benchmark warm-up comment to reflect the current 64-unit separation fallback threshold.
- Previously verified optimisation: the separation fallback is limited to 64 or fewer units; larger armies use pooled spatial-grid separation. The earlier 120/220/420-unit measurements demonstrated the benefit but are not exact 100/200/400 population results and must not be reported as such.
- Town Bell shelter assignment was optimised to build eligible shelters once, count existing/en-route occupancy in one pass, and update reservations as villagers are assigned. Behavioural coverage checks that assignment never overbooks shelter capacity.

## Last known successful workflow before the latest benchmark correction

- Code checkpoint `a2187d200dfcd6e2c75d339c5fda8fbd3fae8039`, workflow [#947](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38746092399), passed the configured source checks, standalone regression tests and atlas validation.
- Later documentation checkpoint `fe030d76ba8a9e5a8e055c6a5d4f0e7c8b51e323`, workflow [#949](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38746222015), also completed successfully.
- These historical green runs do not validate the new exact-population benchmark commit until its own workflow passes.

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
| Technology | Many researched effects have source guards and runtime smoke tests for Gather Rate, Man-at-Arms HP, Bloodlines, Chemistry and newly created units; not every technology is fully balance-tested |
| Campaign | Mission setup, objective-specific regressions and selected real objective completion are covered; every mission has not been completed in a full playthrough |
| AI | Growth, age progression, coordinated siege, defensive response, research priority, retreat and naval threat logic have focused coverage; complete-match strategy remains unverified |
| Maps/naval | Generated-map connectivity and selected real ship movement/combat/repair paths are covered; every layout and coastal edge case is not certified |
| Rendering/assets | Atlas metadata/frame validation is automated; graphics quality and performance require visual browser/hardware review |
| Controller-only UX | Controller-oriented input/menu checks exist; full controller-only journey still needs live browser and physical-controller validation |
| Large armies | Pooled separation path above 64 units; exact 100/200/400 total-population benchmark was corrected in commit above and awaits that commit's CI result |
| Multiplayer | Lightweight Supabase Realtime lobby/session only; not full authoritative RTS state synchronization |
| Xbox Series S / Edge | **Not physically verified** |

## Next implementation work — no repeat-audit loop

1. Confirm workflow for `c64e353` completes; inspect the test output and record exact 100/200/400 total-unit timings.
2. Continue the highest-impact gameplay work: close measurable technology-effect gaps, deepen AI/naval/campaign behavioural coverage, and fix reproducible defects rather than adding redundant source regexes.
3. Keep the development ledger and parity roadmap aligned with every meaningful implementation and exact CI result.
4. Run live browser playthroughs for cold start, pause/resume, save/load, campaign completion, naval routes and end conditions when a browser session is available.
5. Validate deployment and physical Xbox Series S / Edge controller/performance separately; never infer those results from Node CI.

## Working rule

A passing assertion is not the same as a finished feature. Mark work as implemented, regression-checked, browser-playtested or Xbox-verified only at the corresponding evidence level. Never weaken a correct test to obtain a green build, and never claim physical Xbox testing without actually performing it.
