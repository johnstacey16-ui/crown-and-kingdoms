# Repository workflow

## Active completion roadmap — 31 October 2026

**Read [ROADMAP.md](ROADMAP.md) first** for the complete 48 `AUD-###` task index and current development priorities. Then consult the [six-source consolidated audit](docs/audits/2026-10-31-consolidated-audit.md), [Xbox controller contract](XBOX_CONTROLLER_PARITY.md), [full Xbox DLC/product scope](XBOX_SERIES_X_FULL_PARITY_AND_MULTIPLAYER_PLAN.md), and [free-only hosting policy](FREE_HOSTING.md). The older `AOE2_PARITY_ROADMAP.md` is a historical journal; `MASTER_AUDIT_AND_DELIVERY_REGISTER.md` retains dated implementation checkpoints and existing `CK-###` identifiers. **Do not silently rename or erase CK tasks.**

## Active code cleanup gate — 31 October 2026

The owner explicitly wants **existing source, dependencies, tests and documentation tidied before more gameplay features or DLC work**. Prioritize low-risk refactoring, redundancy removal, dependency inventories and regression tests. Do not delete a file solely because its name looks historical. Check runtime, offline, test, build, art and deployment references first; keep uncertain files until verified. The live cleanup register is [docs/REFACTORING_INVENTORY.md](docs/REFACTORING_INVENTORY.md), with active 48-task acceptance in ROADMAP.md. Source-loader consolidation began at `2f42863`; browser fixtures and multiplayer harnesses now share the same HTML-ordered loader through `3e5d7a0`. A cross-platform local check runner landed at `addbce0`. Procedural fallback art was extracted unchanged at `aaeaf7e`. Transport landing and trade routes were split byte-for-byte into `js/simulation-logistics.js` at `862d877`. Subsequent cleanup isolated unchanged victory, graphics-benchmark and AI decision-policy modules; current inventory is **40 production / 27 core / 25 headless scripts and 237 standalone regression files** (focused validation green; full suite pending). Continue cleanup without weakening trade safety, authenticated networking or canonical runtime source lists. The latest hosted source checks and **217/217 focused regression assertions** passed at `1fa7571` (Actions run `41255906326`); full hosted standalone, seeded AI, campaigns and Chromium remain **unverified** on the current tree.

Earlier GitHub-hosted jobs failed before runner assignment (runner ID 0, zero steps); lightweight hosted validation now executes successfully. The cause of the earlier allocation failures remains unknown; see [free-only Actions recovery](docs/GITHUB_ACTIONS_RUNNER_RECOVERY.md). High-cost hosted workflows are weekly/manual, and a private Windows self-hosted workflow is opt-in, requiring owner runner registration. Never enable paid usage or expose the private repository. Last fully passing complete hosted source, graphics and regression code revision is `d181720`. Earlier GitHub Actions jobs stopped before runner assignment; the later validation job ran successfully, but the reason for the earlier failures remains unverified. Preserve current-build save/load validation (old prerelease saves may be rejected), existing game state, network authority, Xbox inputs, original stone/gold/berry graphics and free-only hosting. No new gameplay systems during this cleanup phase unless necessary to fix a verified regression.



The owner requires all work directly on `main` (21 October 2026).
Do not create feature branches or pull requests unless the owner explicitly asks.
Run relevant checks before committing, preserve unrelated work and never force-push `main`.

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

Use `scripts/run-checks.mjs` as the single test-plan owner. `--focused` is the fast hosted selection; `--regression-files` tests all 237 standalone files; `--skirmishes` runs three seeded AI scenarios; `--campaigns` runs 19 isolated missions; `--browser` runs both Chromium fixtures after Playwright is installed; `--xbox-contracts` covers software/controller contracts only. `--regressions` and `--full` preserve the earlier local combined modes. Do not re-add separate GitHub Bash loops or duplicate the focused test-file list in workflow YAML. `game-regression.yml` and `battlefield-browser.yml` remain **manual/weekly** to conserve free minutes; private Windows self-hosted acceptance is opt-in. Focused hosted checks are **not** evidence that 237 standalone, campaigns, seeded AI, Chromium, physical Xbox or WAN multiplayer completed.


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


