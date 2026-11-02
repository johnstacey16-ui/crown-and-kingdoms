# Crown & Kingdoms — contributor and agent workflow

## Current source of truth

- **Working branch:** `main` at [Crown & Kingdoms](https://github.com/johnstacey16-ui/crown-and-kingdoms). Read the current `main` and `README.md` before changing code; use expected-head, **non-force** commits.
- **Active product backlog:** [ROADMAP.md](ROADMAP.md) retains the audited 48 `AUD-###` tasks and milestones. [MASTER_AUDIT_AND_DELIVERY_REGISTER.md](MASTER_AUDIT_AND_DELIVERY_REGISTER.md) retains the original `CK-###` identifiers; do not replace or silently renumber them.
- **Architecture/cleanup status:** [docs/REFACTORING_INVENTORY.md](docs/REFACTORING_INVENTORY.md). Historical detail is available through Git history (including [the pre-consolidation snapshot](https://github.com/johnstacey16-ui/crown-and-kingdoms/tree/ef2a6356692626bd60900a60c9d3e42db94da694)) and existing dated audit files. Do not create more duplicate checkpoint logs in this file.
- **Audits and reference scope:** [docs/audits/2026-10-31-consolidated-audit.md](docs/audits/2026-10-31-consolidated-audit.md), [XBOX_SERIES_X_FULL_PARITY_AND_MULTIPLAYER_PLAN.md](XBOX_SERIES_X_FULL_PARITY_AND_MULTIPLAYER_PLAN.md), [XBOX_CONTROLLER_PARITY.md](XBOX_CONTROLLER_PARITY.md), and [FREE_HOSTING.md](FREE_HOSTING.md).

## Standing delivery instructions

The owner authorizes autonomous continuation and routine decisions on the roadmap. Work on `main`, make meaningful verified changes and continue without routine approval prompts. This is **not** authorization to spend money, activate paid tiers, change account billing, delete infrastructure, force-push, message others or break security boundaries.

The end goal is an original browser RTS with full *Age of Empires II: Definitive Edition* Xbox Series X functional-category parity including all Xbox-available gameplay DLC, operable on **physical Xbox Series S Edge** with the **same default controller actions and semantics**. Implement original art/audio; never copy commercial protected assets. Do not mistake partial content coverage or a browser screenshot for complete parity.

**Cleanup before additional gameplay features:** reduce duplicate source, misleading docs, tests and dependencies through small reversible, well-tested refactors. Investigate browser `index.html`, `sw.js`, source/test imports, generator manifests, artwork and deployment references before removing anything. In particular, preserve painted **stone, gold and berry** assets, existing original art, procedural fallback, movement/combat correctness, current-build saves, authenticated network authority and controller mapping.

## Reproducible tests and evidence

Use the central `scripts/run-checks.mjs` rather than new handwritten workflow test lists:

- `--quick`: five source, runtime/offline, civilization, atlas and graphics gates.
- `--focused`: currently **243 of 247** standalone files in fast hosted CI; never call this the full suite.
- `--regression-files`: **all 247 isolated standalone regressions**, including the four expensive network/simulation tests.
- `--skirmishes`: three seeded production-AI scenarios; `--campaigns`: 19 isolated campaign simulations.
- `--browser`: Chromium game/room checks after Playwright installation; `--xbox-contracts`: software/controller tests, **not physical Xbox results**. `--full` is the expensive local combined plan.

Per-push [game-validation](.github/workflows/game-validation.yml) runs quick and focused only. [game-regression](.github/workflows/game-regression.yml) and [battlefield-browser](.github/workflows/battlefield-browser.yml) remain weekly/manual **to preserve free GitHub Actions minutes**. Separate game-regression jobs let skirmishes run even if other tests fail.

**Latest verified code (2 November 2026):** `b4b14b4` added a controller-selectable 50/100/200-total-unit test scene using the existing `js/engine-graphics-benchmark.js` sample, `js/menus.js` D-pad Left/Right and `js/ui.js` title label. [Focused hosted CI](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41435088392) passed **1,017/1,017 focused assertions, 5/5 quick**, zero failures. The prior complete [247/247 regressions and 19/19 isolated campaign simulations](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41432394004), [2/2 Chromium](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41431724523) and [3/3 seeded AI](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41433080535) remain recorded on their verified source revisions; do not claim a new full-run for `b4b14b4`. The Xbox performance scene defaults to 50 units, cycles 50/100/200 in title via D-pad and writes only the existing reserved sample key. Preserve all normal saved games, controller mappings and native art. Shell remains **v136**, runtime **57 browser / 44 core / 42 headless scripts**. Vercel last served READY `541e17a` (feature implemented, test correction not deployed); the latest green `b4b14b4` was free-tier-rate-limited. Physical Series S Edge frame time, radial-menu crash retest, WAN, DLC and human-play campaign acceptance remain open; software tests are not hardware evidence.

## Controller, hosting, security and save policy

Read [XBOX_CONTROLLER_PARITY.md](XBOX_CONTROLLER_PARITY.md) before changing input. Keep context, tap/hold/release, modifiers, radial menus and help text aligned with the official Xbox controls. Never invent mappings or substitute PC/AoE IV buttons; test refocus behaviour. The owner-reported radial menu `undefined[0]` crash has a source fix, but repeated physical-hardware acceptance is outstanding.

**Free-only hosting is mandatory.** Read [FREE_HOSTING.md](FREE_HOSTING.md) before changes to Vercel/Supabase/WebRTC/Railway. Never turn on paid overages, trials or billing. The two-player authenticated WebRTC preview has unfinished reconnection, wider-party/fallback transport and WAN acceptance; the Supabase SQL relay is not established as the active gameplay fallback.

Pre-release **older-build** save compatibility is not required until final delivery. Current-build save/load, malformed-input rejection, deterministic simulation, controller UX, replay and multiplayer security tests remain required.

Keep code commits accompanied by accurate test and deployment results, distinguish **VERIFIED / PARTIAL / UNVERIFIED**, and record unresolved blockers in the current inventory rather than duplicating long status histories.
