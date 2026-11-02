# Crown & Kingdoms — active refactoring inventory

**Last green code revision:** `adb0d17` · [GitHub Actions 41395460180](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41395460180) · **951/951 focused**, **5/5 quick**, **0 failures** · offline shell v97. Latest Vercel production remains unverified (older `8b262d4` was READY); full 247-file regressions, four expensive isolated integrations, seeded skirmishes, campaign play, multiplayer and Xbox hardware acceptance remain open.

## Current footprint and ownership

| Area | Current live owner and decision |
|---|---|
| Browser and headless runtime | `index.html` defines **47** production browser scripts, **34** core and **32** headless scripts. `scripts/runtime-sources.mjs` is the canonical ordered loader; `scripts/check-game.mjs` and `scripts/audit-runtime-graph.mjs` check all source/offline dependencies. |
| Offline/versioned artwork | `sw.js` shell **v97**, `assets/atlas-manifest.json`, painted WebP atlases and generator inputs are ACTIVE. Do not remove or degrade stone, gold, berry, Fish Trap, terrain, building, troop or procedural fallback resources. |
| Simulation and AI | `js/simulation*.js` own tick, combat, victory, logistics, production, research, unit state and separation. `js/ai.js` is strategic orchestration; `js/ai-policy.js` owns threat, retreat, builder, wave and **ally resource-sharing, trade escort and fishing vessel** policies; `js/ai-construction.js` owns placement, walls, docks and resource-site building orders. |
| Acceptance | **247 standalone `tests/*.test.mjs` files**, **243** selected for the fast hosted plan. Four network/simulation integration files remain weekly/manual. Campaign simulations (19), three seeded skirmishes, two Chromium checks and software Xbox contracts use the same check-runner plan. |
| Multiplayer | Authenticated two-human WebRTC preview and network adapter modules are ACTIVE; reconnect, fallback transport, party scale, WAN and hidden-state/security acceptance remain open. |
| Docs | `ROADMAP.md` retains the audited 48-task backlog, `AGENTS.md` the operating constraints, this file the current refactoring inventory. Existing audited snapshots, delivery register and Git history preserve dated evidence; avoid re-copying the same checkpoint prose across these files. |

## Latest verified incremental work

- `017af8f` / `adb0d17`: extracted **3,606 characters** of live, composition-sensitive technology scoring from the main AI loop into `aiTechnologyPriority` in `js/ai-policy.js`. Three executable cases cover naval threat research, infantry/cavalry/ranged armour, villager technology, monks and damaged-Town-Centre research. Two older source-location tests were corrected. Hosted game validation **951/951 focused**, **5/5 quick**, 0 failures; offline shell **v97**. Full regression and physical Xbox acceptance remain open.
- `436466e` / `ab17a04`: extracted the 1,374-character coordinated naval target/patrol block into `aiAssignWarshipTargets`, retained focus-fire priorities and cooldowns, and updated both older naval source-location checks; four behavioural tests cover reachable priority targets, stale targets, patrol and damaged-ship recovery. Hosted validation: **946/946 focused**, 5/5 quick.
- `d7d3b7f`: extracted the guarded 472-character single-pass hostile land/naval classification into `aiClassifyHostileForces` and updated dependent planning/diplomacy/AI contracts. Two behavioural tests cover garrison, hostility, malformed data, trade/fishing exclusions and threat counts. Hosted validation: **948/948 focused**, 5/5 quick; shell v96. Latest deployment, all-file and hardware checks remain outstanding.
- `f33665b` / `0d335d7`: moved the original 1,268-character damaged-warship retreat policy and 364-character idle-scout routing from `ai.js` into dedicated functions in `ai-policy.js`, with three behavioural tests for each policy covering warship thresholds/water/cooldowns and scout cooldowns/waypoint retries/blocked paths. Both hosted push validations passed, latest **942/942 focused**. Offline shell v94; no Xbox, campaign or full-suite acceptance implied.
- `76e1ca4` / `d534ef7` / `73425a3`: moved the unchanged 627-character damaged-fleet repair decision from `ai.js` into `ai-policy.js`, corrected an outdated naval source-owner contract, added two behavioural tests for warship priority, safe repairs and duplicate assignment, and advanced the offline cache to v92. Hosted quick/focused CI **936/936** passed; full simulations and production/Xbox acceptance are still open.
- `1dc781d` / `81f5e48`: extracted 2,173 characters of trade-cart and trade-cog escort planning into `aiTradeEscorts`; three focused regression cases cover guard assignment, risk/expiry, impassable routes, weak/reserved soldiers, and naval escort eligibility.
- `a4f6ee3` / `8b262d4`: extracted 1,928 characters of fishing-ship escape, fishing target and fish-trap policy into `aiManageFishingShips`; three added cases cover reachable safe water, cooldowns, reachable grounds and resource-gated traps. Latest CI **934/934**; offline cache v91.

- `69cc36d`: command-wheel page helper normalizes corrupt/stale item labels/costs into inert entries without changing menu indices; two runtime tests protect rendering and A/B handling.
- `039221d`: First Hearth scripted prompts checked against production controller A-release semantics, explicitly not X-only gathering; 928/928 hosted focused green.

- `2a304b5`: controller polling clears held A/LB/RT and release edges when an Xbox gamepad disappears silently or fires a real disconnect; reconnect requires neutral buttons; two runtime tests, no layout changes. **925/925 hosted focused**.
- `0db7e2b`: starting-civ HP reconciliation tracks each newly generated game/team outside serialised game state, so retries never double HP on initial villagers/Town Centres or later entities; two seeded tests. **923/923 hosted focused**.

- `c444bdd`: WebAudio resume attempts moved off the periodic audio tick; throttled resume and a short-lived first UI sound queue, with immediate `.catch()` rejection safety and five executable audio cases. [Hosted focused CI 41362026600](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41362026600) passed **921/921**; offline cache v87. Physical Xbox audio still unverified.

- `5e31b85` / `b1db1ce`: extracted idle-wave recovery policy and stopped two campaign tests building handwritten runtime-script lists. 
- `609a9c5`: moved the unchanged AI wounded-unit retreat policy to `ai-policy.js`, with safe-shelter and unreachable-route tests (**903/903 focused**).
- `43c8688`: made the three seeded skirmishes a weekly/manual CI **job independent** of the all-file regression job, keeping free-only runner limits.
- `ed85ad9`: extracted four AI construction actions verbatim into `ai-construction.js`; five placement, spending, reachable-builder and Dock tests (**908/908 focused**).
- `2a0f567`: normalized gamepad edge quarantine across window focus/blur and document tab-visibility changes; two live polling tests cover immediate stale-edge clearing and neutral-until-release; 916/916 focused, offline cache v86.
- `2a71b4f`: extracted **1,055 unchanged characters** of AI allied resource-sharing from `aiTeam` into `ai-policy.js`, preserving the 90-second cooldown, ally/alive gates, numeric checks and resource thresholds. Added five executable tests; **913/913 focused** passed and shell v85 deployed.

## Validation evidence and remaining blockers

- [Weekly Chromium 41286089497](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41286089497): **2/2 browser checks** on older `3841ec8`. Not Xbox hardware.
- [Weekly game suite 41286233568](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41286233568): **19 isolated missions passed**, **243/244 then-existing regressions**; the remaining trade smoke fixture was outdated. Its actual neutral-market cart order was repaired and separately confirmed delivering **54 gold** after **408.7 simulated seconds**, in [hosted 902/902 trial 41297863948](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41297863948). These were not 19 human wins.
- **OPEN:** full **247/247** latest isolated test run; the three independently scheduled seeded AI games; full human campaign wins; free-tier independent WAN multiplayer acceptance; physical Xbox Series S Edge behaviour, the reported radial crash retest, and 50/100/200-unit graphics/frame-time measurements.
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
