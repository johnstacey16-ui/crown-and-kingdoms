# Repository workflow

## Active completion roadmap — 31 October 2026

**Read [ROADMAP.md](ROADMAP.md) first** for the complete 48 `AUD-###` task index and current development priorities. Then consult the [six-source consolidated audit](docs/audits/2026-10-31-consolidated-audit.md), [Xbox controller contract](XBOX_CONTROLLER_PARITY.md), [full Xbox DLC/product scope](XBOX_SERIES_X_FULL_PARITY_AND_MULTIPLAYER_PLAN.md), and [free-only hosting policy](FREE_HOSTING.md). The older `AOE2_PARITY_ROADMAP.md` is a historical journal; `MASTER_AUDIT_AND_DELIVERY_REGISTER.md` retains dated implementation checkpoints and existing `CK-###` identifiers. **Do not silently rename or erase CK tasks.**

## Active code cleanup gate — 31 October 2026

The owner explicitly wants **existing source, dependencies, tests and documentation tidied before more gameplay features or DLC work**. Prioritize low-risk refactoring, redundancy removal, dependency inventories and regression tests. Do not delete a file solely because its name looks historical. Check runtime, offline, test, build, art and deployment references first; keep uncertain files until verified. The live cleanup register is [docs/REFACTORING_INVENTORY.md](docs/REFACTORING_INVENTORY.md), with active 48-task acceptance in ROADMAP.md. Source-loader consolidation began at `2f42863`; browser fixtures and multiplayer harnesses now share the same HTML-ordered loader through `3e5d7a0`. A cross-platform local check runner landed at `addbce0`. Procedural fallback art was extracted unchanged at `aaeaf7e`. Transport landing and trade routes were split byte-for-byte into `js/simulation-logistics.js` at `862d877`. Subsequent cleanup isolated unchanged victory, graphics-benchmark and AI decision-policy modules; current inventory is **45 production / 32 core / 30 headless scripts and 241 standalone regression files** (focused validation green; full suite pending). Continue cleanup without weakening trade safety, authenticated networking or canonical runtime source lists. The latest hosted validation passed **332/332 focused assertions and all five quick gates** at `c8eea89` (Actions run `41272634666`); full hosted standalone, seeded AI, campaigns and Chromium remain **unverified** on the current tree.

Earlier GitHub-hosted jobs failed before runner assignment (runner ID 0, zero steps); lightweight hosted validation now executes successfully. The cause of the earlier allocation failures remains unknown; see [free-only Actions recovery](docs/GITHUB_ACTIONS_RUNNER_RECOVERY.md). High-cost hosted workflows are weekly/manual, and a private Windows self-hosted workflow is opt-in, requiring owner runner registration. Never enable paid usage or expose the private repository. Last fully passing complete hosted source, graphics and regression code revision is `d181720`. Earlier GitHub Actions jobs stopped before runner assignment; the later validation job ran successfully, but the reason for the earlier failures remains unverified. Preserve current-build save/load validation (old prerelease saves may be rejected), existing game state, network authority, Xbox inputs, original stone/gold/berry graphics and free-only hosting. No new gameplay systems during this cleanup phase unless necessary to fix a verified regression.



The owner requires all work directly on `main` (21 October 2026).
Do not create feature branches or pull requests unless the owner explicitly asks.
Run relevant checks before committing, preserve unrelated work and never force-push `main`.

## Research and trade source-ownership regression expansion — 1 November 2026 (`c8eea89`)

Promoted **16 existing standalone regression files** into the fast hosted validation selection (from 94 to **110 of 241**), covering occupied construction and palisades; spatial enemy targeting; pathfinding start/heap; trade, transports and market validation; save-unit orders; mounted/monk movement; regional research; network production commands; and naval campaign connectivity. Hosted CI exposed two previously hidden stale test assumptions: `technology-research-integrity.test.mjs` manually concatenated the old monolithic source list, and `trade-routes.test.mjs` looked for trade-unit origin assignment in `simulation.js` instead of `simulation-building-updates.js`. The technology test now uses `loadCoreGameSource` in actual browser script order; the trade test reads its true owner. Its hard-coded technology count was corrected from **67 to 68** to match the current distinct technology definitions. Code/test changes `1045909`, `977c5eb`, `c8eea89` made **no gameplay, art, Xbox controller, save format, network protocol or offline-cache changes**. [GitHub Actions 41272634666](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41272634666) **completed successfully** for `c8eea89` with **332/332 focused assertions**, five quick source/offline/civilization/atlas/graphics gates and all **45 production browser scripts parsed**. Inventory remains **241 standalone files, 45 browser, 32 core and 30 headless scripts**. The **entire 241-file isolated suite**, three seeded AI skirmishes, 19 campaign playthroughs, Chromium, physical Xbox Series S Edge and independent WAN multiplayer are **not yet accepted**. The costly workflow continues on its normal weekly/manual schedule to protect free-only hosting.

## Historical source-slicer regression recovery — 1 November 2026 (`15d91d4`)

The full regression gate is still outstanding: nine previously non-focused economy, capacity, population, movement and construction fixtures were added to hosted focused checks, and `tests/villager-movement-recovery.test.mjs` was repaired after it referenced `okPlace` in the old simulation file and omitted the extracted worksite/gathering helpers. The fixture now evaluates the real resource-routing functions and production gathering rate rather than stubbing them. The three test-only corrections (`437323a`, `bec50bf`, `15d91d4`) did **not** change gameplay, assets, controls, network or hosting. [GitHub Actions 41272223608](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41272223608) then **completed successfully** on `15d91d4` with **264/264 focused assertions**, all five quick validation gates, 45 production scripts parsed and clean job completion. The inventory remains **241 standalone test files, 45 browser / 32 core / 30 headless scripts**, but the full isolated 241-file suite, three AI skirmishes, 19 campaigns, Chromium, Xbox Series S Edge hardware and WAN remain **unverified** on this code. The existing full-regression workflow runs only weekly on Sunday 07:00 UTC or when manually dispatched; no extra full hosted run was launched in this task.

## Garrison logistics source ownership — 1 November 2026 (`15cc449`)

Relocated **3,265 original source characters**, unchanged, into the existing `js/simulation-logistics.js` owner: `healGarrison` (213), `unload` (1,715) and `townBell` (1,337). The main simulation no longer defines these functions; existing controller, authenticated network and building-tick callers still use their original global names. This avoids an extra browser module while consolidating garrison healing, unloading and shelter reservations with transport logistics. Both direct-source VM fixtures were retargeted to the new owner and the existing garrison unload suite was promoted to focused CI. Added executable regression coverage of Herbal Medicine's healing multiplier, maximum HP, defeated and unregistered passengers, enemy and unloaded occupants. The offline shell advances to **v70**. Changes landed as `32960be`, `6f5ae12`, `15cc449`; [GitHub Actions 41267717364](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41267717364) **completed successfully at `15cc449`** with **247/247 focused assertions**, all five source/offline/civilization/atlas/graphics gates and **45 production scripts** syntax-checked. Inventory remains **241 standalone regression files, 45 production / 32 core / 30 headless scripts**. This is not a full isolated suite, Chromium, seeded skirmish, 19-campaign, physical Xbox Series S or independent WAN acceptance.

## Placement and resource policy consolidation — 1 November 2026 (`5a8f702`)

Consolidated two remaining economy/construction responsibilities without changing their implementation: `okPlace` (**777 unchanged source characters**) moved from `js/simulation.js` to the existing `js/simulation-building-production.js`; `gm` and `farmFood` (**468 unchanged source characters**) moved into the existing `js/simulation-resource-routing.js`. A focused executable placement fixture now tests malformed and off-map coordinates, occupied foundations, terrain, fog of war and docks. Resource ownership now guards gathering-rate technology multipliers and stacked farm capacity upgrades. A Town Bell source-excerpt boundary was updated to reflect the moved helpers. Offline shell cache advanced from **v68 to v69** for the revised production bundle. Code commits `ac80bfe`, `51f90e4`, `bb87eb3` and `5a8f702` implement this checkpoint. [GitHub Actions 41267409770](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41267409770) completed **243/243 focused assertions**, all five quick source/offline/civilization/atlas/graphics gates, syntax parsing **45 production browser scripts**, and successful job cleanup on code `5a8f702`. Repository totals remain **241 standalone regression files, 45 browser / 32 core / 30 headless scripts**. The complete isolated regression run, three seeded AI skirmishes, 19 campaigns, Chromium, actual Xbox Series S Edge and independent WAN testing remain **unverified on this code**. Free-only hosting, original stone/gold/berry art, Xbox inputs, multiplayer authority and prerelease save policies are unchanged.

## Pooled movement separation owner — 1 November 2026 (`30176bf`)

Moved **1,596 unchanged source characters** of the large-army collision-separation implementation (`SEP_GRID`, pooled buckets and `sep`) from `js/simulation.js` into the new `js/simulation-separation.js` classic script. The movement primitive `mv` remains in `simulation.js`; the separation module loads directly afterward, before AI initialization and before the engine invokes `step`. Existing 64-or-fewer unit fallback, 65+ spatial bucket traversal, collision radius, and pool reuse stay unchanged. Offline shell advanced to **v68**, and browser/headless source order plus standalone source-slicing and AI ownership tests were updated. The movement checks include a 70-unit executable overlap fixture; both established separation tests were promoted into the hosted focused run. The first two staged CI runs exposed only obsolete source slice and script-order assumptions; those expectations were corrected without changing the moved game logic. [GitHub Actions 41267078207](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41267078207) **completed successfully on `30176bf` with 241/241 focused assertions**, all five quick source/offline/civilization/atlas/graphics gates and **45 production browser scripts parsed**. Inventory remains **241 standalone test files** with **45 production, 32 core and 30 headless scripts**. The complete isolated 241-file suite, three AI skirmishes, 19 campaigns, Chromium, real Xbox Series S Edge and independent WAN multiplayer remain **unverified**. No resource art, gameplay balances, save system, gamepad controls or hosting policy changed.

## Building tick extraction — 1 November 2026 (`5ef5b20`)

Moved the original **2,309 unchanged source characters** of `upB` from `js/simulation.js` to `js/simulation-building-updates.js`. The simulation still calls `upB` for each building, including defensive attacks, garrison healing, completed research/age effects, production population caps and rally orders. The existing `js/simulation-building-production.js` retains `spawnPos` and `trainRate`. Production HTML/headless ordering and offline shell **v67** load the new module before the main simulation. Retargeted source-excerpt VM tests and added a focused ownership/invalid-building regression. [GitHub Actions 41266720123](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41266720123) **completed successfully** with **239/239 focused assertions**, all five quick gates and **44 production browser scripts parsed**. Current inventory **241 standalone regression files / 44 browser / 31 core / 29 headless scripts / 30 Markdown documents**. Full 241-file isolated regression, three seeded AI skirmishes, 19 campaigns, Chromium, Xbox Series S Edge hardware and independent WAN remain unverified. No resource artwork, game balance, controller, save or network protocol changes were made.

## Building spawn and training-rate extraction — 1 November 2026 (`4dad3ac`)

On `main`, the 818 original classic-script source characters for `spawnPos`, `MILITARY_PRODUCTION_BUILDINGS` and `trainRate` moved unchanged out of `js/simulation.js` to `js/simulation-building-production.js` (`bfa7328`). `upB` and all research effects, training completion and defensive building attacks remain in the main simulation. `index.html`, shell cache **v66**, and the HTML-ordered headless source include the new owner before `simulation.js`. Source-slicing test fixtures and ordering contracts were retargeted; a new focused ownership/Conscription regression was added. An initial hosted attempt (`41263477936`) passed its five quick gates but failed three outdated source-order expectations; only those test fixtures were corrected at `4dad3ac`. [GitHub Actions 41263537863](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41263537863) then **completed successfully with 237/237 focused assertions**, all five quick gates and clean job completion. Inventory: **240 standalone test files, 43 production / 30 core / 28 headless scripts**. This is not a full regression/AI/campaign/Chromium, physical Xbox or WAN multiplayer pass. Continue cleanup without deleting still-referenced files or changing painted stone/gold/berry art.

## Training and research module boundaries — 1 November 2026 (`d0332cf`)

Two incremental source-owner extractions preserve **2,889 unchanged runtime source bytes** formerly in `js/simulation.js`: `js/simulation-production-queues.js` owns `queuedPopulation`, `train` and `cancelQ` (934 bytes); `js/simulation-research.js` owns `ageRequirements`, `researchCost` and `research` (1,955 bytes). `upB` still applies completed research, heals garrisons, attacks and finishes queues; `spawnPos` still provides land/naval building spawn positions in the main simulation. New classic-script loading and offline shell cache **v65** preserve source order. All affected test source slices were retargeted, and new focused tests protect module ownership, exact research/civ costs, population caps, training refunds, duplicate-order rejection, naval production and research completion.

[Hosted Actions 41256614595](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41256614595) completed successfully with **228/228 focused assertions** for the first extraction. [Actions 41256972496](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41256972496) completed its five quick gates and focused test step after the second extraction, and the overall job has now **completed successfully** (including final cleanup). Current inventory **239 standalone regression files, 42 production / 29 core / 27 headless scripts, 30 Markdown files**. Neither focused result is full, Chromium, WAN or physical Xbox acceptance.

## Resource worksite and drop-off ownership cleanup — 1 November 2026 (`1fa7571`)

Moved exactly **4,222 original source bytes** of farm-owner and approach-space occupancy, known-resource routing, dropoff key/retry/route selection, fishing-trap placement and resource-node removal unchanged from `js/simulation.js` into `js/simulation-resource-routing.js`. Classic browser order places this module between `simulation-logistics.js` and `simulation.js`, as do the service-worker offline cache (v63) and the HTML-ordered headless loader. Retargeted source-isolated farm/fishing/depot/naval tests, added one module-ownership file and promoted three previously non-focused economy fixtures to fast hosted CI. A newly promoted farm test exposed stale source-pattern assertions that were corrected to test current worksite guards without changing gameplay. [GitHub Actions 41255906326](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41255906326) completed **217/217 focused tests**, five quick gates and syntax parsing of 40 production scripts.

**Current tree inventory:** 237 standalone `tests/*.test.mjs`, 40 browser, 27 core and 25 headless scripts, 30 Markdown files. Full isolated regression, AI, campaigns, Chromium, Xbox Series S Edge hardware and independent WAN remain **unverified**. Continue cleanup, but preserve painted resource sprites, authoritative multiplayer and current-build saves.

## Verified 200-unit narrow-passage movement recovery — 31 October 2026 (`081f2d3`)

Added `scripts/stress-200.mjs` and a focused 200-unit headless movement regression using real `orderSel`, A* `path`, `walk` and `sep` across a synthetic 72×72 map with a **two-tile-wide gateway**. The original probe found one soldier wrongly idle on the starting side and two soldiers indefinitely following obsolete waypoints on the far side. `walkAxisSlide` now avoids safe-axis corner blockages, and `recoverMoveRoute` recalculates a normal move order toward its **original final waypoint** after separation displaces a unit past an obsolete route segment. The standalone `tests/waypoint-collision-safety.test.mjs` is now focused. Offline shell revision advanced to v62; painted art and controller inputs were not altered.

[GitHub Actions run 41246664294](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41246664294) passed **204/204 focused assertions**, five quick gates and all 39 production script syntax checks. The 2,400-tick probe confirmed **200/200 crossed and 200/200 completed**, zero blocked wall positions/invalid coordinates; A* expanded 26,951 cells across the initial formation order. **This is fixed-seed Node headless movement correctness, not a physical Series S FPS test, all-map congestion proof or full AI/graphics run.** The complete 236-file regression and separate Xbox/WAN/Chromium acceptance remain open.

## Seeded simulation and economic invariants — 31 October 2026 (`0c8e9be`)

Added two source-backed standalone regression files to the fast hosted acceptance: `tests/seeded-world-continuation.test.mjs` checks matching production world hashes between independent VM seeds, distinct seeds, and current-version save/load checkpoint equivalence after 50 fixed ticks plus continued simulation; `tests/economy-invariants.test.mjs` checks exact training payments, market price/resource changes and finite nonnegative ledgers and deposits across 150 real AI simulation ticks. [Hosted run 41217765163](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41217765163) completed **200/200 focused tests**, five quick gates and all 39 classic production-script parses. **235** standalone files remain unverified as a complete isolated run; no cross-browser/physical Xbox determinism claim. The added fixtures leave game logic, free CI, network authority and original artwork untouched.

## External-review evidence reconciliation — 31 October 2026 (`9a7442c`)

The independent-review claims were checked against current GitHub commit comparisons and hosted runs; see [review reconciliation](docs/audits/2026-10-31-external-review-reconciliation.md). Historical audit baseline `3379744` and reviewed `2ca216b` remain ancestors of `main`; there is no support for the asserted loss of those SHAs through a history rewrite. Hosted validation has working assigned runners. A live `node scripts/report-repository-inventory.mjs` command now reports current file and runtime-script totals; a focused test enforces the README headline inventory. Four existing authenticated command/replay fixture files joined the focused roster. [Actions 41214202628](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41214202628) passed **194/194 focused tests** with five quick gates and all **39** browser scripts parsed. The complete **233-file** isolated suite, all AI/campaign/browser/hardware/WAN acceptance still require separate tests. Never mistake source review or focused CI for final acceptance.

## Continued simulation combat extraction — 31 October 2026 (`2e4f819`)

New `js/simulation-combat-bonuses.js` owns the **2,401 source bytes** of unchanged spear/Camel/scout/skirmisher and Blacksmith melee-research bonus calculations. The canonical `index.html` ordering and offline `sw.js` assets were updated (shell cache v61), and all isolated combat suites were retargeted to the new module. Source/runtime/owner checks and dedicated damage-class tests now run in fast CI. [Hosted run 41213199014](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41213199014) passed **162/162 focused tests** and five quick gates, with all **39 production scripts** parsed; this includes the older technology-effect guard corrected after the Heavy Camel branch merge. The full **232-file** regression suite, AI seeds, 19 campaigns, Chromium and physical Series S/WAN multiplayer remain **unverified** on this revision.

## Continued AI policy extraction — 31 October 2026 (`27b0bbf`)

Moved **3,725 bytes** of the existing `aiDockWaterReach`, `aiRebal` and `aiOpeningWaveNeed` functions from `js/ai.js` to the already loaded `js/ai-policy.js`, preserving their original implementations. Updated the source-excerpt test owners and extended the focused set with executable water, economy and opening-wave tests. Bumped the offline shell revision because an active script changed. GitHub Actions [run 41212115930](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41212115930) passed **138/138 focused assertions**, all five quick source/offline/civilization/atlas/graphics checks and syntax checks of 38 production browser scripts. The standalone file inventory stays at **231**. Complete regression, skirmishes, campaigns, Chromium and hardware remain separate pending gates.

## Completed branch consolidation — 31 October 2026

All **26 non-main branch tips are now ancestors of `main`** (GitHub compare ahead=0 on every branch); original branch references remain in place as historical references. Three were already merged, 21 historical diverged branches were reconciled using the newer `main` tree as their explicit conflict resolution in `170a2d2`, `477dbe1` and `9703e39`. The remaining feature branches were integrated with their actual missing code, tests and commit histories: Heavy Camel at `0ffde35`, villager economy at `d0a5e7b`. PR #37 is marked merged. The current controller/test follow-up is `74ff679`. Do not resurrect retired tests or overwrite current game code from historical branch snapshots. No branch deletion is implied.

## Acceptance runner — unified and free-only

Use `scripts/run-checks.mjs` as the single test-plan owner. `--focused` is the fast hosted selection; `--regression-files` tests all 239 standalone files; `--skirmishes` runs three seeded AI scenarios; `--campaigns` runs 19 isolated missions; `--browser` runs both Chromium fixtures after Playwright is installed; `--xbox-contracts` covers software/controller contracts only. `--regressions` and `--full` preserve the earlier local combined modes. Do not re-add separate GitHub Bash loops or duplicate the focused test-file list in workflow YAML. `game-regression.yml` and `battlefield-browser.yml` remain **manual/weekly** to conserve free minutes; private Windows self-hosted acceptance is opt-in. Focused hosted checks are **not** evidence that 239 standalone, campaigns, seeded AI, Chromium, physical Xbox or WAN multiplayer completed.


## Pre-release save-game policy — 31 October 2026

The owner explicitly removed **backward compatibility with saves made by earlier development builds** as a requirement until the game is complete. Development saves/test saves are disposable; do **not** delay gameplay, data-schema, civilizations, DLC, simulation or multiplayer architecture improvements to keep historical save payloads readable. Versioned save migrations and long-term backward-compatibility guarantees belong to the stable/release phase, after gameplay/data models settle.

**Important distinction:** retain functional manual save/load and autosave **within the current build**, validate current-format payloads and refuse unsupported/invalid files safely with a clear message; never silently corrupt or spend resources due to a malformed save. Preserve reproducible testing and, where straightforward, explicit format version identification. Do not delete users' saved data proactively or remove save/security tests merely because historical migration is no longer a gate. Update/replace old-format compatibility assertions when they obstruct legitimate schema changes, while testing the current format and failure handling. This changes only the cross-build migration requirement, not multiplayer protocol integrity, authenticated replay guards, visual assets, Xbox controller behavior or the free-only hosting policy.

## Standing roadmap authorization — 28 October 2026

The owner asks to keep building the game through the roadmap and to treat routine
follow-up answers as “yes” and “continue”. Proceed autonomously with investigation,
implementation, relevant checks, roadmap evidence and commits directly to main.
Do not stop after a milestone merely to request permission for the next routine
roadmap task. Preserve the existing scope, controller contract, original assets,
simulation integrity and free-only hosting requirements. This does not authorize
spending, paid upgrades, destructive account/infrastructure actions or messaging
other people. Report actual results and remaining acceptance gaps accurately.

# Controller requirements

The user requires the entire default button system and its functions to mimic
Age of Empires II: Definitive Edition on Xbox Series X. This applies to solo,
campaign, multiplayer, menus, help text, modifiers and contextual actions.

- Read `XBOX_CONTROLLER_PARITY.md` before changing controller behaviour.
- Verify bindings and functions against the official Xbox guides linked there.
  Do not invent shortcuts or copy the PC or Age of Empires IV mappings.
- Unknown behaviour remains a documented gap until verified. An unavailable
  feature does not justify assigning its button to a different operation.
- Match tap/hold/release, modifiers, menu context and resulting action, not just
  the button label. Keep controller help consistent with implemented behaviour.
- Preserve authenticated ownership, pending-command and simulation guards.
- Passing Node tests does not establish physical Xbox control parity.

# Free-only hosting requirement

The owner explicitly requires free-only hosting. Read `FREE_HOSTING.md` before
hosting or multiplayer infrastructure work. Do not upgrade subscriptions, buy
credits, enable paid overages/add-ons, provision trial-dependent replacements or
restart/redeploy Railway without explicit owner approval. Verify the existing
Supabase project's Free plan before rollout. Reaching a free quota must restrict
service rather than enable billing. Preserve authenticated ownership and replay
guards when adapting the transport. The Supabase relay schema is installed, but the authenticated two-player
battlefield currently uses Supabase admission/signalling and direct WebRTC.
The SQL relay is not confirmed as the active gameplay fallback; reconnect and
independent-network match acceptance remain open. Read FREE_HOSTING.md for
the previously verified Free plan and remaining live transport/Auth gates.


# Product delivery target

The owner reaffirmed on 21 October 2026 that the target is full functional
Age of Empires II: Definitive Edition Xbox Series X parity, including all
Xbox-available gameplay DLC, with matching default controller behavior.
Optimize for Xbox Edge with an Xbox controller. Supabase-backed multiplayer,
the complete game feature set and coherent graphics/audio are core requirements.
Do not reduce this to a lobby demo, a base-only civilization subset or PC controls.

Use MASTER_AUDIT_AND_DELIVERY_REGISTER.md and
XBOX_SERIES_X_FULL_PARITY_AND_MULTIPLAYER_PLAN.md to select and record increments.
Keep missing/partial/verified distinctions; do not infer completeness from tests
or content names. Physical Xbox controls/performance and independent-network
multiplayer require their own acceptance evidence. Preserve original assets and
the existing free-only hosting rules.


