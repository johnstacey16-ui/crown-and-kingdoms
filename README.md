# Crown & Kingdoms

A controller-first medieval real-time strategy game for browsers, targeting Xbox Series S and Microsoft Edge.

## Run

Serve `index.html` from a static web server and play with a connected controller. The game uses classic browser scripts in a deliberate load order. Preserve working controller behaviour and correct saves for the current game version when editing it; compatibility with old pre-completion saves is not a release requirement.

## Checks

Requires Node.js 22 or a compatible current release. No package installation is required.

```sh
node scripts/check-game.mjs
for t in tests/*.test.mjs; do CK_SKIP_CAMPAIGN=1 node "$t" || exit 1; done
node tests/validate-atlas.mjs
# The isolated 19-mission suite (also exercised by GitHub Actions):
for mission in $(seq 0 18); do CK_MISSION="$mission" node tests/simulation-smoke.test.mjs || exit 1; done
```

GitHub Actions splits responsibilities between `game-validation.yml` (source and sprite atlas) and `game-regression.yml` (all standalone tests and 19 isolated mission simulations). The regression workflow lists every failing file, rather than stopping at the first failure. These automated checks do not replace controller-driven full campaign playthroughs, live multiplayer testing, browser verification or measurements on physical Xbox hardware.

## Architecture constraints

- Preserve classic browser-script load order, controller behaviour, simulation correctness and current-version save/load integrity.
- When adding or renaming runtime files, update `index.html`, the service-worker cache in `sw.js`, source checks and regression tests together.
- Keep system ownership clear: simulation updates in `js/simulation.js`, AI decisions in `js/ai.js`, campaign objectives/events in `js/campaign.js`, rendering/UI in `js/render.js` and `js/ui.js`, and controller input in `js/input.js`.

## Verification policy

- Report the exact commit tested. A passing CI run proves only the automated checks that actually ran on that commit.
- Browser gameplay, all 19 campaign playthroughs, live multiplayer resilience and physical Xbox Series S / Edge performance require separate direct verification.
- Keep status concise and evidence-based; do not copy old workflow results forward or mark untested roadmap items complete.

## Project structure

- `index.html`, `styles.css`: browser entry point and presentation.
- `js/`, `engine.js`: game systems and runtime.
- `multiplayer.js`: lobby/presence and player markers; not full authoritative simulation synchronisation.
- `assets/`: local art assets and metadata, with procedural fallbacks.
- `tests/`, `scripts/`, `.github/workflows/`: automated verification.

## Roadmap and scope

Use [MASTER_AUDIT_AND_DELIVERY_REGISTER.md](MASTER_AUDIT_AND_DELIVERY_REGISTER.md) as the **current, authoritative audit and 40-task delivery checklist**. [AOE2_PARITY_ROADMAP.md](AOE2_PARITY_ROADMAP.md) is the historical engineering change log; earlier figures and reported failures are not current evidence. Work is not considered complete until the relevant gameplay checks have actually been performed and recorded. Xbox-native achievements, cloud saves, platform matchmaking and cross-play services are outside the current scope.
