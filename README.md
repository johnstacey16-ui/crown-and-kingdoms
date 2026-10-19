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
# Full seeded simulation: production AI versus a passive starting kingdom
node scripts/run-skirmish.mjs
CK_DIFFICULTY=3 CK_RELOAD_AT=600 node scripts/run-skirmish.mjs
# Scripted economy, paid production and normal combat orders against Hard AI
CK_PLAYER=active CK_DIFFICULTY=3 CK_RELOAD_AT=900 node scripts/run-skirmish.mjs
# The isolated 19-mission suite (also exercised by GitHub Actions):
for mission in $(seq 0 18); do CK_MISSION="$mission" node tests/simulation-smoke.test.mjs || exit 1; done
```

GitHub Actions splits responsibilities between `game-validation.yml` (quick script/asset checks) and `game-regression.yml` (the independent standalone tests and 19 isolated campaign simulations). The longer workflow does not rerun the quick validators. Documentation-only pushes skip automated checks, while pull requests are always checked; newer pushes cancel superseded runs. All checks can be started manually in GitHub Actions.

**Testing policy:** The `tests/` directory is development-only; its Node scripts are **not loaded by `index.html` or shipped as part of the browser game**. At the earlier 19 October baseline there were 131 standalone test files (the sync-protocol work adds another test file), after consolidating three small campaign objective checks into one file with the same assertions. Keep end-to-end smoke tests and bug-prevention checks, consolidate duplicated launch overhead or brittle source-pattern tests as they become relevant, and never delete a behavioural safeguard just to reduce the file count. The skirmish runner logs seed, difficulty, per-minute economy/population/AI/path diagnostics and a natural defeat; its optional checkpoint compares persisted gameplay fields before and after loading. The active variant uses a bounded scripted player (with knowledge of the opposing capital location), rather than human/controller input; it does not render the browser UI. All variants fail if their configured time limit expires without a natural result.

The success of automated tests does not prove full controller-driven matches, live multiplayer, real browser/Xbox playthroughs or acceptable console performance.

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
- `js/network-sync.js`: bounded game-command frames, ownership/replay/gap guards and checksum primitives; **not yet wired to live gameplay orders**.
- `assets/`: local art assets and metadata, with procedural fallbacks.
- `tests/`, `scripts/`, `.github/workflows/`: automated verification.

## Roadmap and scope

Use [MASTER_AUDIT_AND_DELIVERY_REGISTER.md](MASTER_AUDIT_AND_DELIVERY_REGISTER.md) as the **current, authoritative audit and expanded 46-task delivery checklist**. [AOE2_PARITY_ROADMAP.md](AOE2_PARITY_ROADMAP.md) is the historical engineering change log; earlier figures and reported failures are not current evidence. Work is not considered complete until the relevant gameplay checks have actually been performed and recorded. See the [Xbox Series X full-content and synchronized multiplayer plan](XBOX_SERIES_X_FULL_PARITY_AND_MULTIPLAYER_PLAN.md) for all current Xbox gameplay DLC, original graphics/audio/music overhauls and official Xbox-style controller mapping. Native Xbox achievements, cloud saves, platform matchmaking and cross-play services still require separate platform capabilities.
