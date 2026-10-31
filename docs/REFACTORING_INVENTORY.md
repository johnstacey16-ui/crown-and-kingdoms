# Crown & Kingdoms — active repository refactoring inventory

**Status: PARTIAL · logistics `862d877` · victory `f7610b3` · benchmark `fd1cdb3` · AI policy `0b7d0e1` · 31 October 2026**

This is a live cleanup register, **not an assertion that every item is ready for deletion**. The owner requested architecture/code tidiness before further features. Do not mix old save migration with this: prerelease saved games may be invalidated, but current-build save/load, malformed-input rejection, multiplayer security and replay tests must remain.

**Hosted CI:** Earlier validation, regression and Chromium jobs failed before step allocation (runner ID `0`); the cause is unknown. Latest hosted lightweight validation passed 88 focused tests and all source/offline/graphics checks at `c85efc9` (run `41206485365`); the full suite, seeded AI, campaigns and Chromium are unverified on the current source. See [free-only recovery](GITHUB_ACTIONS_RUNNER_RECOVERY.md). Full hosted suites now run weekly/on request; an owner-registered private Windows self-hosted runner can execute the same checks without GitHub-hosted minutes. Until a real run completes, full acceptance is blocked.

## Established dependency footprint

| Area | Evidence | Decision |
|---|---|---|
| Browser entrypoint | 38 ordered classic scripts in `index.html`; `sw.js` precaches those paths; `scripts/audit-runtime-graph.mjs` checks offline/asset references | **ACTIVE** — never delete or reorder without tests/cache updates |
| Art and resources | `assets/atlas-manifest.json` and original WebP source/painted atlases; stone, gold, berry, terrain and fallback rendering require coverage | **ACTIVE** — no art removal; source-generator dependencies also count |
| Headless/CI | 232 standalone `tests/*.test.mjs` files after the queue, map, population, siege, technology-catalogue and Town Bell fixture merges; test helper intentionally omits canvas `js/ui.js` and atlas `js/assets.js` | **ACTIVE** — source loader consolidated in `scripts/runtime-sources.mjs` |
| Historical docs | Older checkpoints moved from active ROADMAP into `docs/audits/2026-10-31-gameplay-checkpoints.md`; delivery register/git history retained | **ARCHIVED** — retain for audit, not the active prioritization |
| Old multiplayer adapters | `multiplayer.js` and `js/network-*.js` may still be transitively active, even when named legacy; authenticated WebRTC and signaling must remain secure | **UNCERTAIN** — do not delete without a complete reachability and transport audit |
| Save-version migrations | Older development saves need not migrate; `js/save.js` still validates/loading current saves | **MIGRATION DEFERRED**, not save-system deletion |

**Local offline verification:** `scripts/run-checks.mjs` provides one cross-platform command for the same five source checks and optional complete regression/AI/campaign suite, without Bash-only loops. This does not fix or replace the externally failing hosted runners.

## Refactor queue (before adding features)

| Priority | Workstream | Exit criteria |
|---|---|---|
| 1 — in progress | **Single source for browser script ownership:** `index.html` -> runtime script loader -> game validation, headless and browser foundation | 38/25/23 entries agree, all referenced files present, dependency ordering tests and full standalone Node validation |
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

## Victory and scoring rule extraction — 31 October 2026

The existing seven victory, elimination, score and hill functions were moved without changing their bodies from `js/simulation.js` into `js/simulation-victory.js`. Classic script declarations remain global and load before logistics and simulation. The service-worker shell moves to v57; source-order validation and a new isolated behavior/ownership regression guard results precedence, Sudden Death elimination and scoring. Four older score/diplomacy/hill tests now use the canonical HTML-ordered runtime source instead of maintaining their own manually concatenated file lists. The resulting inventory is **36 production / 23 core / 21 headless scripts, 236 standalone regression files**. All existing art, controller, network, current-build saves and simulation rules remain unchanged by design. Full hosted regression, Chromium, actual Xbox and gameplay acceptance must be independently verified.

**GitHub Actions update:** retried source-validation run [41199152874](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41199152874) successfully acquired a hosted runner and completed all source/art steps on the earlier `862d877` revision. This confirms recovery for that retried job, not the root cause of the preceding allocation failures nor the new victory refactor's acceptance. Avoid claiming hosted full-suite green until those suites execute.

**Final hosted evidence for victory extraction:** [Actions 41202652720](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41202652720) passed 23/23 focused tests (new victory ownership, old logistics, score, Sudden Death, hill, diplomacy and browser foundation), with successful source, offline graph, civilization, atlas and graphics checks. This is a lightweight validation pass only; full 236-file regression, 19 campaigns, seeded AI, Chromium and console acceptance remain open at `f7610b3`.

## Canonical source-loader cleanup — 31 October 2026

Eight more source-level regression files (tribute, map layout selection/content, guard/follow, villager priority, population controls, No Attack stance and fish traps) now use `loadCoreGameSource({includeUI:true,includeAssets:true})` instead of maintaining different ordered concatenations of the same classic game scripts. Their positive assertions and coverage are preserved; individual behavior-fixture tests that intentionally compile source fragments are untouched. The lightweight CI validation invokes these eight contracts as a focused check. This is **test harness refactoring, not a gameplay alteration**. Full regression/Chromium/AI/campaign acceptance still requires separate evidence. Do not blindly rewrite partial VM fixtures, source-boundary probes or negative source assertions into whole-runtime checks.

## Xbox graphics diagnostic module extraction — 31 October 2026

The original canvas layer/pixel benchmark constants, state and five functions have been moved byte-for-byte out of `engine.js` into `js/engine-graphics-benchmark.js`, a classic script loaded after the assets module and before `engine.js`. Runtime, offline shell v58, checker ordering and core/headless inventories are synchronized: **37 production / 24 core / 22 headless scripts, 237 standalone regression files**. Representative Series S benchmark/controller/HUD tests and a new ownership/median test are added to lightweight hosted CI; 10+ existing preview/controller/color tests are unchanged. The original renderer, canvas scale presets, graphics, resources, current-build saves, multiplayer and game simulation are not intentionally modified. Full source and browser acceptance require test evidence after this commit; no Xbox hardware FPS claim follows from this extraction.

## AI policy extraction — 31 October 2026

Seven previously global threat, age-saving, queue-counting, siege and builder-selection helpers (3,929 unchanged original source bytes) moved from `js/ai.js` to `js/ai-policy.js` in the same classic-script runtime order, immediately after simulation and before the AI loop. Offline shell v59 and source order validation follow the move. **38 browser / 25 core / 23 headless scripts, 238 standalone regression files.** Nine existing AI-source fixtures now include both source modules (including a previously stale absolute script-offset assertion), and a new isolated ownership/queue/saving-policy test covers the boundary. Relevant AI tests are in the lightweight hosted CI suite. This is not a new AI strategy: controller defaults, resource art, save/load, multiplayer authority and gameplay semantics are intended to remain unchanged. Full 238-test, campaign, AI, Chromium and physical Xbox acceptance remain separate gates.

**Latest source and focused CI verification — `0b7d0e1`:** [run 41203700936](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41203700936) passed all **79 focused checks**, plus production syntax, browser/offline graph, civilization, atlas and graphics inventory validations. Full 238 standalone regression files, all 19 campaign runs, seeded AI, Chromium and physical Xbox acceptance are **not yet confirmed on this head**. Do not infer a complete game or hardware certification from green focused tests.

## Documentation and test deduplication — 31 October 2026

Direct repository tree audit found **46 Markdown documents and 239 `tests/*.test.mjs` files** before this change; neither group contained exact byte-for-byte duplicates. Content overlap was confirmed in three AI queued-unit tests, so their distinct object-queue, malformed-input, dead-building, AI-cap, and Elite Skirmisher duration contracts were preserved in a single `tests/ai-queued-unit-limits.test.mjs`, retiring the two redundant AI queue filenames. Original full and scarce gold/stone/berry artwork documentation was combined into `docs/PAINTED_RESOURCES.md`, retaining both note bodies and correcting the two historical root-doc links. That checkpoint had **45 Markdown documents and 237 standalone test files**, and unchanged production code and active assets. The focused CI list references only the retained test file. Do not assume other tests/docs are redundant without comparing assertions and checking references; no general deletion of historical or security fixtures is authorized by this inventory.

## Artwork checkpoint consolidation — 31 October 2026

Consolidated **16 dated `PAINTED_*.md` checkpoint documents** into active thematic reference files: `PAINTED_ART.md` (six character and army increments), `PAINTED_MOTION.md` (seven motion increments), `PAINTED_ENVIRONMENT.md` (fish traps), and `BUILDING_AGE_DETAILS.md` (two building-age art increments). Every original note body was retained under a named archived-checkpoint heading, and references from active docs were redirected to the appropriate section. Current document count is **29 Markdown files**. The original WebP art, sources, prompts, manifests, verification JSONs, app scripts, controllers and runtime are unchanged. The current graphics truth remains `docs/graphics-inventory.json`; historical milestones should not be mistaken for current acceptance. Full suite and Xbox hardware verification stay open.

## Additional regression consolidation — 31 October 2026

Two small test files were merged without deleting their assertions: `tests/map-layouts.test.mjs` into `tests/map-layout-content.test.mjs` (all five Broken Isles selection/seed/controller assertions) and `tests/population-limit-controls.test.mjs` into `tests/population-limits.test.mjs` (both wraparound limit assertions). The population suite also now consumes the canonical HTML-ordered source loader. `tests/art-revisions.test.mjs` gained a Markdown-reference guard for all 16 moved art checkpoint anchors and retired links. The focused validation job now includes the retained tests and the documentation guard, with no retired test paths. **Current inventory: 29 Markdown files, 235 standalone regression files**; game production scripts remain 38 and graphics/assets are untouched.

**Consolidation hosted acceptance — `b35466a`:** [run 41205502428](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41205502428) passed **81/81 focused tests** including art archive-link validation and the retained map/population assertions. All lightweight source/graphics/offline checks passed. All **235** standalone tests, campaigns, seeded AI, Chromium and Xbox hardware acceptance remain separately unverified. Local network DNS prevented fetching a full test checkout here; no claim of complete acceptance is made.

## Siege-policy regression fixture consolidation — 31 October 2026

Merged `tests/ai-siege-support.test.mjs` into `tests/ai-siege-target-runtime.test.mjs`. One isolated helper now exercises castle/tower/Town Centre target order, blocked objectives, destroyed/friendly/unfinished buildings, a strict 12-route search bound and null-leader fallback; both original staged-wave ownership/release assertions remain unchanged. Source slicing now fails clearly if the AI policy helper is missing. GitHub's lightweight focused suite retains the merged coverage, and full regression discovery automatically picks up **234 standalone test files**. Runtime AI decisions, unit rules and network gameplay code were not modified. This cleanup is provisional until hosted checks complete.

## Runtime inventory contract maintenance — 31 October 2026

The complete regression's `tests/runtime-script-order.test.mjs` was found still asserting obsolete **35 browser / 20 headless** script totals, even after the validated browser graph reached **38 / 23**. This wasn't in the fast selection, so the remaining complete-suite acceptance was at risk. The old absolute totals were replaced with ordered module-presence, full-vs-headless (exactly UI/atlas omissions), canonical browser/core-span and source-scanning checks. Four other ownership tests now verify their specific module contracts rather than independently repeating a total script count. The runtime-order test is included in the lightweight hosted validation. No production script or game behavior was altered. Full standalone regression and Chromium acceptance remain unverified until those suites execute.

## Technology catalogue and procedural art test consolidation — 31 October 2026

`c85efc9` removed the overlapping `tests/technology-catalogue-integrity.test.mjs` after merging its distinct trained-unit reference and dynamic `AG.length` age-bound assertions into `tests/technology-catalogue.test.mjs`. The retained test also covers offered/researchable technologies, positive durations, valid resource costs, finite upgrade bonuses, prerequisite age order and cycles. The previously stale **34-script** literal in `tests/procedural-unit-art-module.test.mjs` was replaced with an exactly-once module ownership contract. Both checks run in fast GitHub validation. **Current regression inventory: 233 standalone files.** [Run 41206485365](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41206485365) passed **88/88 focused assertions** alongside source syntax, offline graph, civilizations, atlas and graphics checks. The complete 233-file suite, campaign/AI runs, Chromium and actual Xbox remain unverified on this source revision. No production modules, save handling, control mappings, visuals or hosting were changed.

## Shared acceptance-runner consolidation — 31 October 2026

All weekly/manual acceptance jobs now use `scripts/run-checks.mjs` with explicit scope selectors: `--regression-files` (all 233 individually isolated standalone checks, preserving `CK_SKIP_CAMPAIGN=1`), `--skirmishes` (three original seeded AI scenarios and reload settings), `--campaigns` (exactly 19 isolated `CK_MISSION` runs), `--browser` (both Playwright art/room fixtures), and `--xbox-contracts` (software/controller checks, **not physical hardware acceptance**). `--full` keeps quick checks + full standalone + AI + campaigns. The fast hosted workflow selects 33 files once through `--focused`, using `node --test`, with no list duplication in workflow YAML. The runner continues after individual failures, writes grouped GitHub logs and job summaries, and preserves private Windows self-hosted opt-in. The full regression workflow YAML shrank from ~3.1 KB to ~1.0 KB and fast-validation YAML from ~3.2 KB to ~1.5 KB. Test counts and scenario depth are unchanged by this infrastructure refactor. All expensive hosted workflows remain manual/weekly; no paid infrastructure or automatic full-suite push trigger was introduced.

**Hosted evidence:** [run 41207175215](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41207175215) passed 98 focused tests after the cross-platform/CI unification; [run 41207392451](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41207392451) passed **100 focused assertions** after the final source-of-truth fast-test extraction, alongside source, offline, civilization, sprite and inventory checks. **No complete 233-file test suite, 19-mission campaign suite, seeded AI trilogy, Chromium run or physical Xbox test has been executed and certified on the latest source revision.**

## Town Bell test-fixture consolidation — 31 October 2026

Merged `tests/town-bell-garrison-capacity.test.mjs` into `tests/town-bell.test.mjs` by reusing its executable simulation fixture with optional single-Town-Centre ownership. Preserved the original three behaviour/controller tests plus four capacity/dead/unfinished/enemy-shelter cases, and included the surviving fixture in the fast hosted selection. Standalone regression inventory moves from **233 to 232 files**; isolated scenarios and assertions are not intentionally reduced. Runtime and all original graphics/controller/network code are untouched. Exact hosted acceptance must be checked after this commit.
