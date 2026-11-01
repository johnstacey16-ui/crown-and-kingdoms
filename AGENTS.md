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
- `--focused`: currently **242 of 246** standalone files in fast hosted CI; never call this the full suite.
- `--regression-files`: **all 246 isolated standalone regressions**, including the four expensive network/simulation tests.
- `--skirmishes`: three seeded production-AI scenarios; `--campaigns`: 19 isolated campaign simulations.
- `--browser`: Chromium game/room checks after Playwright installation; `--xbox-contracts`: software/controller tests, **not physical Xbox results**. `--full` is the expensive local combined plan.

Per-push [game-validation](.github/workflows/game-validation.yml) runs quick and focused only. [game-regression](.github/workflows/game-regression.yml) and [battlefield-browser](.github/workflows/battlefield-browser.yml) remain weekly/manual **to preserve free GitHub Actions minutes**. Separate game-regression jobs let skirmishes run even if other tests fail.

**Last green hosted code revision:** `2a71b4f`, [Actions 41360040612](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41360040612), **913/913 focused assertions, five quick gates, zero failures**. Vercel production was confirmed READY at the same SHA. The older scheduled Sunday run reached 243/244 then-existing regression files and 19 isolated campaign checks; its one stale trade fixture was repaired and independently passed. A fresh full 246-file pass, three seeded skirmishes, human campaign wins, independent WAN multiplayer and physical Xbox Series S Edge acceptance are still **OPEN**. Do not invent acceptance metrics or conflate Node/Chromium checks with Xbox hardware.

## Controller, hosting, security and save policy

Read [XBOX_CONTROLLER_PARITY.md](XBOX_CONTROLLER_PARITY.md) before changing input. Keep context, tap/hold/release, modifiers, radial menus and help text aligned with the official Xbox controls. Never invent mappings or substitute PC/AoE IV buttons; test refocus behaviour. The owner-reported radial menu `undefined[0]` crash has a source fix, but repeated physical-hardware acceptance is outstanding.

**Free-only hosting is mandatory.** Read [FREE_HOSTING.md](FREE_HOSTING.md) before changes to Vercel/Supabase/WebRTC/Railway. Never turn on paid overages, trials or billing. The two-player authenticated WebRTC preview has unfinished reconnection, wider-party/fallback transport and WAN acceptance; the Supabase SQL relay is not established as the active gameplay fallback.

Pre-release **older-build** save compatibility is not required until final delivery. Current-build save/load, malformed-input rejection, deterministic simulation, controller UX, replay and multiplayer security tests remain required.

Keep code commits accompanied by accurate test and deployment results, distinguish **VERIFIED / PARTIAL / UNVERIFIED**, and record unresolved blockers in the current inventory rather than duplicating long status histories.
