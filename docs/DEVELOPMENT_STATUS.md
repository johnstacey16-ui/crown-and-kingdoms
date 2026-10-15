# Crown & Kingdoms — Development Status Ledger

**Last updated:** 15 October 2026  
**Repository:** https://github.com/johnstacey16-ui/crown-and-kingdoms  
**Branch:** `main`

## Why this file exists

This is the single handover checkpoint intended to stop repeated audits and repeated claims of progress. Update it when a meaningful implementation or verification result changes. Before starting work, compare the live HEAD and workflow to this ledger. Do not redo a resolved item unless new evidence reproduces it.

## Latest implementation checkpoint — 15 October 2026

- Latest `main` HEAD before this change: `9658f963af27edd9c181c24753c1d7f84e7c8724`; workflow [#930](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38744444974) completed successfully.
- New work in progress: Town Bell shelter assignment now builds the eligible shelter list once, pre-counts garrisoned and en-route occupancy in one pass, and updates reservations as villagers are assigned. This removes repeated full-unit-list scans from the inner assignment loop while preserving nearest-available-shelter selection and capacity reservations. Focused regression assertions and full CI are being added/run in this change.

## Last verified code checkpoint

- **Code commit:** `10a9a2f7209236385b57d31e7f71f1e844147d78` — `fix: accept indexed entity references in valid saves`.
- **Green workflow:** [#923](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38742305191), which passed the configured source checks, complete standalone regression suite, and sprite-atlas validation.
- The regression was an over-escaped digit matcher in the indexed entity-reference validator in `js/save.js`, causing valid indexed IDs to be rejected. The correction was followed by a passing full test workflow.
- Subsequent documentation-only commits were also checked by [workflow #926](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38744134109), which completed successfully for commit `488638d5593385382bbea4378973ef3fb67df441`.
- The documentation refresh commits after #926 must have their own CI result checked before claiming the latest HEAD is green.

## What the configured CI actually verifies

Workflow: `.github/workflows/game-regression.yml`

1. `node scripts/check-game.mjs` — script parsing and source invariants.
2. Every `tests/*.test.mjs` standalone regression test.
3. `node tests/validate-atlas.mjs` — local sprite atlas metadata and frame bounds.

This is automated source/regression/asset validation. It is **not** proof of complete gameplay, an end-to-end browser playthrough, successful deployment, 400-unit frame rate, robust multiplayer, or physical Xbox compatibility.

## Status snapshot

| Area | Current evidence-based status |
| --- | --- |
| Save validator indexed references | **Fixed; full regression suite passed** at code checkpoint above |
| Manual save/autosave and campaign save/load | Automated regression coverage exists; browser-level storage failure/recovery still requires verification |
| Engine and script loading | Source checks pass; cold-start and long-session browser runtime still require verification |
| AI, economy, combat and technology | Substantial implementation and focused regression tests exist; complete-match behaviour and balance are not established by CI |
| Campaign content/progression | Mission/objective regression tests exist; every mission has not been certified through a full real playthrough |
| Maps/pathfinding/naval | Static/connectivity/pathing tests exist; real unit/ship movement across representative maps requires runtime verification |
| Rendering/assets | Atlas metadata/frame validation passes; visual quality and performance require browser/hardware review |
| Controller-only UX | Input/UI regression tests exist; complete controller-only journey requires physical-controller validation |
| Large armies | A spatial separation reuse optimisation and a separation-pool test exist; repeatable 100/200/400-unit profiling is still required |
| Multiplayer | Lightweight Supabase Realtime lobby/session scope only; do not describe it as authoritative full RTS synchronization |
| Xbox Series S / Edge | **Not physically verified in this ledger** |

## Next work — do not loop

1. Check the current live `main` HEAD and latest workflow; do not assume the checkpoint above is still the latest.
2. Add behavioural runtime coverage that loads the actual classic scripts in a browser-like harness and exercises startup, new game, simulation stepping, pause/resume, save/load and campaign start. Prefer a shared harness over adding more brittle source-regex tests.
3. Run repeatable simulation benchmarks at small, medium and large populations (including a 400-unit target), capture elapsed time and exceptions, and optimise only measured bottlenecks.
4. Address the highest-impact reproducible gameplay/runtime gap revealed by those tests.
5. Update the relevant roadmap and this ledger in the same change as implementation; rerun the entire workflow and record the exact commit/run.
6. Continue through campaign coverage, map movement/naval behaviour, controller-only flows, and physical Xbox validation when hardware is available.

## Working rule

A passing assertion is not the same as a finished feature. A feature is complete only when implementation, meaningful behavioural coverage, integration and the relevant runtime verification agree. Never weaken a correct test to get a green build. Never claim physical Xbox testing without actually performing it.
