# Crown & Kingdoms — Development Status

The main roadmap is [AOE2_PARITY_ROADMAP.md](../AOE2_PARITY_ROADMAP.md). It contains the eight project goals and their acceptance checks.

## Current verification rule

Automated CI confirms only the checks actually run on the tested commit. It does not prove that all 19 campaigns have been played through, that every technology works in live gameplay, that multiplayer is resilient, or that the game meets its performance target on Xbox Series S / Microsoft Edge.

Record progress against the eight roadmap goals. Keep entries short and factual: what changed, which test or playthrough verified it, and what remains unverified. Do not create repeated handover sections or copy old workflow results forward as current results.

## Current known boundary

The repository contains automated source checks, regression tests, asset validation and simulation stress tests. Browser playthroughs, full campaign completion, multiplayer resilience and physical Xbox performance require separate direct verification.

## Automated checks

```sh
node scripts/check-game.mjs
for test in tests/*.test.mjs; do node "$test" || exit 1; done
node tests/validate-atlas.mjs
```

## Latest repository handoff — 2026-10-16

Repository head updated: [`b008bc5c1e0ac40cf77908bbd73da016b81daacb`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/b008bc5c1e0ac40cf77908bbd73da016b81daacb) — saved-game validation rejects invalid unit/building health and missing or malformed camera state before restoring the live state; regression cases cover malformed health and camera fields.

Recent committed work visible in history:
- AI retreat recovery and regression coverage.
- Save-load hardening: reject unit health that is missing, negative or non-finite; reject building health that is missing/negative and maximum health that is not positive/finite; reject absent, array-shaped or non-finite camera state before restoring. Regression cases cover malformed health and camera payloads.
- Naval threat filtering for loaded/garrisoned ships.
- Varied seeds on failed random-map generation retries.
- Controller-accessible attack-move orders for land units and warships.

Verification status for this handoff:
- The repository's documented automated commands remain the source-check script, every `tests/*.test.mjs` test, and sprite-atlas validation.
- The new save-validation regression cases (including malformed camera state) and full command set have not been successfully executed in this environment; do not mark them passed on the strength of source inspection.
- The Vercel check reports a build-rate-limit failure; this is an external deployment limit, not evidence that the game source failed its own regression suite, and it is not being treated as the main work queue.
- Full mission playthroughs, live multiplayer resilience, browser gameplay, and physical Xbox Series S / Edge performance remain unverified until directly exercised.

Next implementation work should continue against the eight goals in `AOE2_PARITY_ROADMAP.md`, prioritising reproducible gameplay defects and missing core mechanics. Do not restart this handoff or re-audit already documented facts unless new evidence changes them. Mark a roadmap item complete only after its stated acceptance checks are actually satisfied.

