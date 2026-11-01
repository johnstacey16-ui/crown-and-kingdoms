# Crown & Kingdoms — active refactoring inventory

**Last green revision:** `2a71b4f` · [GitHub Actions 41360040612](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41360040612) · **913/913 focused**, **5/5 quick**, **0 failures** · live Vercel READY on the same SHA (1 November 2026).

## Current footprint and ownership

| Area | Current live owner and decision |
|---|---|
| Browser and headless runtime | `index.html` defines **47** production browser scripts, **34** core and **32** headless scripts. `scripts/runtime-sources.mjs` is the canonical ordered loader; `scripts/check-game.mjs` and `scripts/audit-runtime-graph.mjs` check all source/offline dependencies. |
| Offline/versioned artwork | `sw.js` shell **v85**, `assets/atlas-manifest.json`, painted WebP atlases and generator inputs are ACTIVE. Do not remove or degrade stone, gold, berry, Fish Trap, terrain, building, troop or procedural fallback resources. |
| Simulation and AI | `js/simulation*.js` own tick, combat, victory, logistics, production, research, unit state and separation. `js/ai.js` is strategic orchestration; `js/ai-policy.js` owns threat, retreat, builder, wave and **ally resource-sharing** policies; `js/ai-construction.js` owns placement, walls, docks and resource-site building orders. |
| Acceptance | **246 standalone `tests/*.test.mjs` files**, **242** selected for the fast hosted plan. Four network/simulation integration files remain weekly/manual. Campaign simulations (19), three seeded skirmishes, two Chromium checks and software Xbox contracts use the same check-runner plan. |
| Multiplayer | Authenticated two-human WebRTC preview and network adapter modules are ACTIVE; reconnect, fallback transport, party scale, WAN and hidden-state/security acceptance remain open. |
| Docs | `ROADMAP.md` retains the audited 48-task backlog, `AGENTS.md` the operating constraints, this file the current refactoring inventory. Existing audited snapshots, delivery register and Git history preserve dated evidence; avoid re-copying the same checkpoint prose across these files. |

## Latest verified incremental work

- `5e31b85` / `b1db1ce`: extracted idle-wave recovery policy and stopped two campaign tests building handwritten runtime-script lists. 
- `609a9c5`: moved the unchanged AI wounded-unit retreat policy to `ai-policy.js`, with safe-shelter and unreachable-route tests (**903/903 focused**).
- `43c8688`: made the three seeded skirmishes a weekly/manual CI **job independent** of the all-file regression job, keeping free-only runner limits.
- `ed85ad9`: extracted four AI construction actions verbatim into `ai-construction.js`; five placement, spending, reachable-builder and Dock tests (**908/908 focused**).
- `2a71b4f`: extracted **1,055 unchanged characters** of AI allied resource-sharing from `aiTeam` into `ai-policy.js`, preserving the 90-second cooldown, ally/alive gates, numeric checks and resource thresholds. Added five executable tests; **913/913 focused** passed and shell v85 deployed.

## Validation evidence and remaining blockers

- [Weekly Chromium 41286089497](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41286089497): **2/2 browser checks** on older `3841ec8`. Not Xbox hardware.
- [Weekly game suite 41286233568](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41286233568): **19 isolated missions passed**, **243/244 then-existing regressions**; the remaining trade smoke fixture was outdated. Its actual neutral-market cart order was repaired and separately confirmed delivering **54 gold** after **408.7 simulated seconds**, in [hosted 902/902 trial 41297863948](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41297863948). These were not 19 human wins.
- **OPEN:** full **246/246** latest isolated test run; the three independently scheduled seeded AI games; full human campaign wins; free-tier independent WAN multiplayer acceptance; physical Xbox Series S Edge behaviour, the reported radial crash retest, and 50/100/200-unit graphics/frame-time measurements.
- **Do not claim:** old local test counts, Chrome success, a readiness URL, or unchanged source extraction proves complete DLC, controller or Xbox parity.

## Refactoring queue, before broad new features

1. Keep gameplay decisions separated from overloaded engine, AI, renderer and transport files; perform small, byte/behaviour-preserving moves first and cover each by executable regressions. Refactor `js/ai.js`, `engine.js`, `js/render.js`, `multiplayer.js` and `js/network-unit-map.js` by responsibilities, **not bulk rewrites**.
2. Replace brittle source-string and duplicate test harnesses with canonical runtime-owner and behavioural checks. Remove redundant tests **only** when the retained suite proves equivalent coverage.
3. Audit any apparently unused scripts, templates, docs, atlas inputs or legacy adapters against **both** production and headless/offline/build/test graphs. Retain uncertain dependencies; never delete solely by file name or age.
4. Preserve exact Xbox controller defaults, original visual assets, deterministic simulation, current-build saves, authenticated ownership/replay guards, and free-only hosting.
5. Run `node scripts/run-checks.mjs --quick` and `--focused` after code refactors; use `--regression-files`, `--skirmishes`, `--campaigns`, `--browser` and Xbox hardware where available. Keep expensive GitHub workflows weekly/manual, separately gated. Label acceptance VERIFIED/PARTIAL/OPEN with exact SHA.
6. After consolidation, resume the actual 48-task product backlog and complete all gameplay, DLC, graphics, audio, controller, multiplayer and physical Xbox acceptance categories.

## Archived detailed change evidence

The previous ~68 KB `AGENTS.md`, ~101 KB `ROADMAP.md`, and ~91 KB refactoring inventory had extensive overlapping dated checkpoint paragraphs. Their **full original text has not been destroyed**: retrieve it at [the previous green-doc commit `ef2a635`](https://github.com/johnstacey16-ui/crown-and-kingdoms/tree/ef2a6356692626bd60900a60c9d3e42db94da694), or inspect the intervening Git history, existing consolidated audit and master delivery register. Do not add another document simply to duplicate these histories.
