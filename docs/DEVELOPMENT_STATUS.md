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
