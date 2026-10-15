# Crown & Kingdoms

A controller-first medieval real-time strategy game for browsers, designed for Xbox Series S and Microsoft Edge.

## Main goals

These are the project's primary goals. Work through them in order of gameplay value, update this list when real progress is made, and do not call the game finished until the final verification is complete.

1. **Campaigns:** Play through all 19 missions and verify objectives, timed events, victories, defeats and progression.
2. **AI:** Improve economic decisions, army composition, technology research, sieges and naval tactics.
3. **Technology:** Verify every research upgrade has its intended gameplay effect.
4. **Naval and maps:** Fix pathfinding, shore access, ship combat, map connectivity and inaccessible-resource cases.
5. **Graphics:** Improve unit equipment, animations, buildings, terrain and kingdom identification.
6. **Performance:** Test large armies and combat workloads, then measure performance on Xbox Series S using Microsoft Edge.
7. **Multiplayer:** Verify host-authoritative state, disconnect handling and match termination.
8. **Final verification:** Run the full regression suite, fix failures, and update documentation to match actual results.

## Run the game

Serve `index.html` from a local static web server or open the configured deployment. Use a game controller; the game is designed around controller navigation.

## Run automated checks

Use Node.js 22 or a compatible current release. No package installation is required for the repository checks:

```sh
node scripts/check-game.mjs
for test in tests/*.test.mjs; do node "$test" || exit 1; done
node tests/validate-atlas.mjs
```

Automated tests are not a substitute for complete campaign playthroughs, browser gameplay, multiplayer tests or direct Xbox performance measurements.

## Technical overview

- `index.html`, `styles.css`: game entry point and presentation.
- `js/`, `engine.js`: simulation, AI, campaigns, controls, rendering and game systems.
- `multiplayer.js`: current multiplayer prototype.
- `assets/`: local art assets and metadata, with procedural fallbacks.
- `tests/`, `scripts/`, `.github/workflows/`: automated checks.

The game uses classic browser scripts with an intentional load order. Preserve working controller behaviour and save compatibility when changing the runtime.

## Scope

The goal is a complete, enjoyable browser RTS with strong controller support. Xbox-native achievements, cloud saves, platform matchmaking and cross-play services are outside the current project scope.
