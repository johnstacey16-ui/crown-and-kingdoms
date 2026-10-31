# Repository workflow

## Active completion roadmap — 31 October 2026

**Read [ROADMAP.md](ROADMAP.md) first** for the complete 48 `AUD-###` task index and current development priorities. Then consult the [six-source consolidated audit](docs/audits/2026-10-31-consolidated-audit.md), [Xbox controller contract](XBOX_CONTROLLER_PARITY.md), [full Xbox DLC/product scope](XBOX_SERIES_X_FULL_PARITY_AND_MULTIPLAYER_PLAN.md), and [free-only hosting policy](FREE_HOSTING.md). The older `AOE2_PARITY_ROADMAP.md` is a historical journal; `MASTER_AUDIT_AND_DELIVERY_REGISTER.md` retains dated implementation checkpoints and existing `CK-###` identifiers. **Do not silently rename or erase CK tasks.**

## Active code cleanup gate — 31 October 2026

The owner explicitly wants **existing source, dependencies, tests and documentation tidied before more gameplay features or DLC work**. Prioritize low-risk refactoring, redundancy removal, dependency inventories and regression tests. Do not delete a file solely because its name looks historical. Check runtime, offline, test, build, art and deployment references first; keep uncertain files until verified. The live cleanup register is [docs/REFACTORING_INVENTORY.md](docs/REFACTORING_INVENTORY.md), with active 48-task acceptance in ROADMAP.md. Source-loader consolidation began at `2f42863`; browser fixtures and multiplayer harnesses now share the same HTML-ordered loader through `3e5d7a0`. A cross-platform local check runner landed at `addbce0`. Procedural fallback art was extracted unchanged at `aaeaf7e`. Transport landing and trade routes were split byte-for-byte into `js/simulation-logistics.js` at `862d877`. Subsequent cleanup isolated unchanged victory, graphics-benchmark and AI decision-policy modules; current inventory is **38 production / 25 core / 23 headless scripts and 231 standalone regression files** (focused validation green; full suite pending). Continue cleanup without weakening trade safety, authenticated networking or canonical runtime source lists. The latest hosted source checks and **138/138 focused regression assertions** passed at `27b0bbf` (Actions run `41212115930`); full hosted standalone, seeded AI, campaigns and Chromium remain **unverified** on the current tree.

Earlier GitHub-hosted jobs failed before runner assignment (runner ID 0, zero steps); lightweight hosted validation now executes successfully. The cause of the earlier allocation failures remains unknown; see [free-only Actions recovery](docs/GITHUB_ACTIONS_RUNNER_RECOVERY.md). High-cost hosted workflows are weekly/manual, and a private Windows self-hosted workflow is opt-in, requiring owner runner registration. Never enable paid usage or expose the private repository. Last fully passing complete hosted source, graphics and regression code revision is `d181720`. Earlier GitHub Actions jobs stopped before runner assignment; the later validation job ran successfully, but the reason for the earlier failures remains unverified. Preserve current-build save/load validation (old prerelease saves may be rejected), existing game state, network authority, Xbox inputs, original stone/gold/berry graphics and free-only hosting. No new gameplay systems during this cleanup phase unless necessary to fix a verified regression.



The owner requires all work directly on `main` (21 October 2026).
Do not create feature branches or pull requests unless the owner explicitly asks.
Run relevant checks before committing, preserve unrelated work and never force-push `main`.

## Continued AI policy extraction — 31 October 2026 (`27b0bbf`)

Moved **3,725 bytes** of the existing `aiDockWaterReach`, `aiRebal` and `aiOpeningWaveNeed` functions from `js/ai.js` to the already loaded `js/ai-policy.js`, preserving their original implementations. Updated the source-excerpt test owners and extended the focused set with executable water, economy and opening-wave tests. Bumped the offline shell revision because an active script changed. GitHub Actions [run 41212115930](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41212115930) passed **138/138 focused assertions**, all five quick source/offline/civilization/atlas/graphics checks and syntax checks of 38 production browser scripts. The standalone file inventory stays at **231**. Complete regression, skirmishes, campaigns, Chromium and hardware remain separate pending gates.

## Completed branch consolidation — 31 October 2026

All **26 non-main branch tips are now ancestors of `main`** (GitHub compare ahead=0 on every branch); original branch references remain in place as historical references. Three were already merged, 21 historical diverged branches were reconciled using the newer `main` tree as their explicit conflict resolution in `170a2d2`, `477dbe1` and `9703e39`. The remaining feature branches were integrated with their actual missing code, tests and commit histories: Heavy Camel at `0ffde35`, villager economy at `d0a5e7b`. PR #37 is marked merged. The current controller/test follow-up is `74ff679`. Do not resurrect retired tests or overwrite current game code from historical branch snapshots. No branch deletion is implied.

## Acceptance runner — unified and free-only

Use `scripts/run-checks.mjs` as the single test-plan owner. `--focused` is the fast hosted selection; `--regression-files` tests all 231 standalone files; `--skirmishes` runs three seeded AI scenarios; `--campaigns` runs 19 isolated missions; `--browser` runs both Chromium fixtures after Playwright is installed; `--xbox-contracts` covers software/controller contracts only. `--regressions` and `--full` preserve the earlier local combined modes. Do not re-add separate GitHub Bash loops or duplicate the focused test-file list in workflow YAML. `game-regression.yml` and `battlefield-browser.yml` remain **manual/weekly** to conserve free minutes; private Windows self-hosted acceptance is opt-in. Focused hosted checks are **not** evidence that 231 standalone, campaigns, seeded AI, Chromium, physical Xbox or WAN multiplayer completed.


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


