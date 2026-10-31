# Crown & Kingdoms — active repository refactoring inventory

**Status: PARTIAL · source/tooling `addbce0` · graphics `aaeaf7e` · logistics `862d877` · 31 October 2026**

This is a live cleanup register, **not an assertion that every item is ready for deletion**. The owner requested architecture/code tidiness before further features. Do not mix old save migration with this: prerelease saved games may be invalidated, but current-build save/load, malformed-input rejection, multiplayer security and replay tests must remain.

## Established dependency footprint

| Area | Evidence | Decision |
|---|---|---|
| Browser entrypoint | 35 ordered classic scripts in `index.html`; `sw.js` precaches those paths; `scripts/audit-runtime-graph.mjs` checks offline/asset references | **ACTIVE** — never delete or reorder without tests/cache updates |
| Art and resources | `assets/atlas-manifest.json` and original WebP source/painted atlases; stone, gold, berry, terrain and fallback rendering require coverage | **ACTIVE** — no art removal; source-generator dependencies also count |
| Headless/CI | 235 standalone `tests/*.test.mjs` files at checkpoint; test helper intentionally omits canvas `js/ui.js` and atlas `js/assets.js` | **ACTIVE** — source loader consolidated in `scripts/runtime-sources.mjs` |
| Historical docs | Older checkpoints moved from active ROADMAP into `docs/audits/2026-10-31-gameplay-checkpoints.md`; delivery register/git history retained | **ARCHIVED** — retain for audit, not the active prioritization |
| Old multiplayer adapters | `multiplayer.js` and `js/network-*.js` may still be transitively active, even when named legacy; authenticated WebRTC and signaling must remain secure | **UNCERTAIN** — do not delete without a complete reachability and transport audit |
| Save-version migrations | Older development saves need not migrate; `js/save.js` still validates/loading current saves | **MIGRATION DEFERRED**, not save-system deletion |

**Local offline verification:** `scripts/run-checks.mjs` provides one cross-platform command for the same five source checks and optional complete regression/AI/campaign suite, without Bash-only loops. This does not fix or replace the externally failing hosted runners.

## Refactor queue (before adding features)

| Priority | Workstream | Exit criteria |
|---|---|---|
| 1 — in progress | **Single source for browser script ownership:** `index.html` -> runtime script loader -> game validation, headless and browser foundation | 35/22/20 entries agree, all referenced files present, dependency ordering tests and full standalone Node validation |
| 2 — next | **Separate overly dense runtime modules:** `js/render.js` (~87 KB), `engine.js` (~61 KB), `js/simulation.js` (~54 KB), `multiplayer.js` (~56 KB), `js/network-unit-map.js` (~51 KB), `js/ai.js` (~48 KB) | Each extracted responsibility has one owner; production script ordering, offline cache and headless tests updated; no gameplay/output changes |
| 3 — next | **Deduplicate repeated economy/placement/controller helpers, global state mutations and content tables** | Explicit dependency/behavior proof; no new Xbox shortcuts or resource changes; repeated source checks replaced by focused behavior tests |
| 4 — pending | **Unused/legacy file proof:** mark modules/doc/asset inputs as truly unused only after search across browser, offline cache, generator, tests and network/security paths | Evidence for each deletion; preserve historical `CK-###` and 48 `AUD-###` IDs |
| 5 — pending | **Verification and release hygiene:** stabilize GitHub Actions and audit actual Xbox Edge behavior | Recent commit passes all 235+ standalone files, seeded AI/campaigns and Chromium; performance and network gates separately recorded |

The earlier `check-game.mjs` compiled some modules from a handwritten roster while the browser had **33** scripts; that could skip syntax failures in WebRTC/Supabase integrations. The new checker discovers and parses all actual browser entries instead. The test harness keeps only the deliberately headless subset, in production order. This is an observable maintainability improvement, not an accepted whole-game refactor.

## Verified no-delete art inventory and current test tooling

The live manifest lists **58 active painted WebP image references**, and all 58 are present in the repository and cached by `sw.js`. A whole-repository `.webp` scan found **66 image files**: those 58 active assets plus one earlier `assets/painted-units.webp` still referenced by `scripts/build-painted-atlas.mjs`, and seven documentation preview images (several referenced by acceptance docs). **None of these eight extra files has been proven safely removable**, so no graphics were deleted. Stone, gold, berries, terrain and troop images remain in place.

The local test runner at `scripts/run-checks.mjs` supports `quick`, `--regressions` and `--full`. It mirrors the existing five hosted source/graphics gates and optionally executes **233 standalone tests**, three seeded AI matches and 19 isolated mission playthroughs without a Bash dependency. Its **plan/ordering/error aggregation fixture passed**, but a full run in a checkout is still required. All 33 individual production browser scripts and the concatenated 18-script headless source passed independent JavaScript syntax compilation. The current Actions jobs at `addbce0` stopped before any job step; the reason remains unverified.

**Next refactor priorities** are split ownership of oversized rendering/simulation/input modules and auditing genuinely obsolete files with full dependency proof. These have NOT yet been completed.

## Completed module extraction: procedural fallback graphics (`aaeaf7e`)

The production browser now loads **34 scripts**, with a dedicated `js/render-procedural-units.js` **immediately after `js/render.js`**. All original procedure art source bytes (`MP` palette definitions, infantry/mounted/siege/naval draw functions and `USZ` sizing) were moved verbatim. Shared sprite-cache, canvas shape primitives, terrain/world/building/resource rendering and painted atlas logic remain in `js/render.js`, which shrank from **103,961 to 86,867 bytes**. The extracted code is ~17 KB. Offline shell v55 includes the new script, without modifying artwork, map resources or original atlases.

Ownership and load order now have focused tests; the production/source/headless inventories are **34/21/19**. There are **234 standalone test files** at this commit. Independent module syntax/palette preflight passed; the three hosted Actions workflows failed **before any job step** at code commit `aaeaf7e`. Therefore neither the browser graphics nor the full simulation suite has passed on this refactor. Do not treat these as verified rendering-equivalence tests or Xbox hardware acceptance.

**Next:** identify a low-coupling subdomain in `engine.js` or `js/simulation.js`, and extend behavioral tests before a further move. Avoid moving the procedural pixel/canvas primitives until module ownership and actual pixel equivalence can be checked.

## Completed module extraction: trade and transport logistics (`862d877`)

`js/simulation.js` shrank from **59,324 to 53,701 bytes** by moving the existing `transportLandingRoute()` and `tickTrader()` functions into `js/simulation-logistics.js`. Their original 5,623 source bytes were independently compared to the old revision and verified **identical**, and the remainder of the source is also unchanged. Both logistics functions remain global classic-script declarations, loaded one slot before `simulation.js`, so the simulation continues calling their original implementations; the offline shell was incremented to v56. The move did not change the game, transport routes, trading economy or save data by design.

The six original trade-routing and four transport-landing tests, plus the naval water-grid tests, now read their source from the new module. Three new ownership/order/safe-rejection regressions protect this boundary. The active runtime is **35 browser scripts / 22 core game scripts / 20 headless source scripts**, with **235 standalone test files**. Source-level comparisons, invalid inputs and player-trade-depot safety passed. The corresponding hosted Actions validation, browser and regression jobs failed **before any steps**, so the move has not yet received a full live-game pass.

**Remaining refactor gate:** `engine.js`, dense AI, multiplayer `network-unit-map`, other simulation components, duplicated data/ownership, local full test execution and GitHub Actions account/runner diagnostics. Do not delete uncertain legacy or asset files without a complete reachability audit.

## Constraints during cleanup

- Work directly on main with expected-head non-force commits, and check new SHA before the next change.
- Do **not** change art scale, terrain, gold/stone/berry sprites, controller defaults, simulation outcomes, multiplayer authority, free-only hosting or save/load within the current build.
- Source and test naming alone are **not** evidence of obsolete code. Delete only with dependency proof; keep historical journals/delivery records discoverable.
- The last fully passing hosted source/campaign/graphics baseline is `d181720`; later workflow jobs did not run steps. Independent syntax/dependency fixtures are useful but not equivalent to full CI, Xbox hardware or 1v1 network acceptance.
