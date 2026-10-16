# Crown & Kingdoms

A controller-first medieval real-time strategy game for browsers, targeting Xbox Series S and Microsoft Edge.

## Run

Serve `index.html` from a static web server and play with a connected controller. The game uses classic browser scripts in a deliberate load order; preserve controller behaviour and save compatibility when editing it.

## Checks

Requires Node.js 22 or a compatible current release. No package installation is required.

```sh
node scripts/check-game.mjs
for t in tests/*.test.mjs; do node "$t" || exit 1; done
node tests/validate-atlas.mjs
```

These automated checks do not replace full campaign playthroughs, live multiplayer testing, browser verification or measurements on a physical Xbox Series S.

## Project structure

- `index.html`, `styles.css`: browser entry point and presentation.
- `js/`, `engine.js`: game systems and runtime.
- `multiplayer.js`: lobby/presence and player markers; not full authoritative simulation synchronisation.
- `assets/`: local art assets and metadata, with procedural fallbacks.
- `tests/`, `scripts/`, `.github/workflows/`: automated verification.

## Roadmap and scope

See [AOE2_PARITY_ROADMAP.md](AOE2_PARITY_ROADMAP.md) for the consolidated gameplay roadmap and acceptance criteria. Work is not considered complete until the relevant gameplay checks have actually been performed and recorded. Xbox-native achievements, cloud saves, platform matchmaking and cross-play services are outside the current scope.
