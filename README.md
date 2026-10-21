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

GitHub Actions splits responsibilities between `game-validation.yml` (quick script/asset checks) and `game-regression.yml` (the independent standalone tests and 19 isolated campaign simulations). The longer workflow does not rerun the quick validators. A separate `battlefield-browser.yml` job renders actual local atlases in Chromium and saves screenshot evidence. Documentation-only pushes skip automated checks, while pull requests are always checked; newer pushes cancel superseded runs. All checks can be started manually in GitHub Actions.

**Current battlefield milestone:** code `f8eee4dae8d725dafaf9965289b4919e8333912e` passed [validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39514666040) and [regressions](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39514665643), including real loopback HTTP economic/military, garrison/unload, repairs, transport landings and terminal combat replay scenarios. Original trade, unique-troop and palisade atlases now cover the remaining runtime keys, with reproducible generation and stale-cache migration checks. [Chromium rendering checks](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39514665634) also passed, with screenshot evidence. Independent human browser matches, full Xbox controls, reconnect and the complete original graphics/audio overhaul remain open.

**Testing policy:** The `tests/` directory is development-only; its Node scripts are **not loaded by `index.html` or shipped as part of the browser game**. At verified code commit `f8eee4d` there are **156/156 passing standalone test files**, including the synchronized multiplayer command protocol and stable entity ID/save round-trip tests, following earlier test consolidation. Keep end-to-end smoke tests and bug-prevention checks, consolidate duplicated launch overhead or brittle source-pattern tests as they become relevant, and never delete a behavioural safeguard just to reduce the file count. The skirmish runner logs seed, difficulty, per-minute economy/population/AI/path diagnostics and a natural defeat; its optional checkpoint compares persisted gameplay fields before and after loading. The active variant uses a bounded scripted player (with knowledge of the opposing capital location), rather than human/controller input; it does not render the browser UI. All variants fail if their configured time limit expires without a natural result.

The success of automated tests does not prove full controller-driven matches, live multiplayer, real browser/Xbox playthroughs or acceptable console performance.

## Architecture constraints

The required controller target is the whole default button system and functions
of **Age of Empires II: Definitive Edition on Xbox Series X**. Follow
[XBOX_CONTROLLER_PARITY.md](XBOX_CONTROLLER_PARITY.md), which records official
references and remaining gaps. Do not invent alternative gameplay shortcuts.

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
- `multiplayer.js`: legacy lobby/presence and player markers. The opt-in authenticated battlefield is separate; run/deploy `server/transport.mjs` behind the same-origin HTTPS API described in [server/README.md](server/README.md).
- `js/network-sync.js`, `js/network-commands.js`, `js/network-session.js`: authenticated frame/replay and ownership guards wired to gathering, paid construction/production/research, movement/combat, Line/Split formations, garrison/unload, repairs, naval landings and a final acknowledged result. `js/network-unit-map.js` provides team-relative fog, terrain/resource art, original animated sprites, stable depth ordering, construction/damage indicators and contextual controls. The public relay is deployed; reconnect/resume and full human-match acceptance remain open.
- `js/entities.js` and `js/save.js`: persistent IDs for units, buildings and resource targets, with duplicate/counter validation and save round trips. Authenticated commands separately enforce current ownership, sight and resource identity.
- `assets/`: original local atlases and metadata, with procedural fallbacks. [GRAPHICS_ACCEPTANCE.md](GRAPHICS_ACCEPTANCE.md) records complete runtime atlas coverage, remaining quality work and Chromium evidence.
- `tests/`, `scripts/`, `.github/workflows/`: automated verification.

## Roadmap and scope

Use [MASTER_AUDIT_AND_DELIVERY_REGISTER.md](MASTER_AUDIT_AND_DELIVERY_REGISTER.md) as the **current, authoritative audit and expanded 46-task delivery checklist**. [AOE2_PARITY_ROADMAP.md](AOE2_PARITY_ROADMAP.md) is the historical engineering change log; earlier figures and reported failures are not current evidence. Work is not considered complete until the relevant gameplay checks have actually been performed and recorded. See the [Xbox Series X full-content and synchronized multiplayer plan](XBOX_SERIES_X_FULL_PARITY_AND_MULTIPLAYER_PLAN.md) for all current Xbox gameplay DLC, original graphics/audio/music overhauls and official Xbox-style controller mapping. Native Xbox achievements, cloud saves, platform matchmaking and cross-play services still require separate platform capabilities.

## Public game and multiplayer

[Play Crown & Kingdoms](https://crown-and-kingdoms-production.up.railway.app). The combined game/relay service runs from **main** with automatic Railway deployments. Deployment `18a93b9c-8b96-4714-aab3-e9f1443a33c8` reached SUCCESS on 21 October 2026 at code `d3952c28e994c2dc11e877d7d84b8eb4c61a62fa`. Public HTTPS game/health checks and a two-session private room join passed. A full independent human match and Xbox acceptance remain open.

Active authenticated requests now renew each player's 30-minute idle lease, allowing longer matches. Safe reads and transport receipts retry HTTP 502/503/504 at most twice within their original request deadline. Gameplay submissions are never automatically retried. This does not restore rooms after a page reload, disconnect or server restart. See [server/README.md](server/README.md) for the service contract and remaining gates.

## Multiplayer military formations

Select at least two owned military units, then press and release **Y** to switch between Line and Split. The request executes on the shared host frame; it never moves units optimistically. Land and naval groups reform around separate centres with the existing formation/pathfinding planners. Civilian, loaded, dead, foreign, duplicate and unreachable selections are rejected without partial changes. The live handshake is now `ck-live-preview-9`; both players must refresh after updating. Remaining Y build/train shortcuts, full formation wheels, reconnect and physical Xbox acceptance are open.

## Multiplayer control groups

Hold **LB**, choose one of eight slots with the left stick, then press **X** to assign the current selection. Hold LB, choose a stored slot and release LB to recall it. **B** cancels. The wheel shows each group's currently available count. Assignment/recall are local; gameplay still uses authenticated host commands. Dead, foreign and garrisoned members are unavailable, and garrisoned members return to availability after unloading. Empty X assignment clears a slot. Groups last for this room UI session and are separate from solo save groups.

In the LB wheel, **Y** focuses an available group's first member in the local battlefield camera. **RB** opens the expanded minimap; move its cursor and press **Y** to focus that location. B or RB cancels the minimap. Ordinary military Y remains Line/Split outside these contexts. Exact wheel geometry, Xbox hardware, multi-building addition and persistent multiplayer groups remain unfinished.

## Focused battlefield camera

Camera focus provides a 2× local battlefield view with fixed-size command/group menus. The cursor pans the camera near its edges; pointer selection and commands use the inverse viewport transform, and double A groups only eligible entities visible in the current view. RB's expanded minimap shows team-relative observed terrain and a viewport outline. A and D-pad do not issue gameplay commands there; Y alone focuses its cursor. Cancel restores the previous camera and cursor. Focus never changes sight, simulation state or checkpoints. The initial whole-map view is retained until focus is requested. The zoom ratio, edge speed, full minimap tools, isometric presentation and Xbox hardware acceptance remain open to refinement.
