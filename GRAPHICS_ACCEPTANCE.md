# Battlefield graphics — current acceptance criteria

This file is the **short current gate**, not the old chronological rendering journal. The [complete original historical report](https://github.com/johnstacey16-ui/crown-and-kingdoms/blob/763caa425a2684f4d79de1b2c21f14639aefb6d8/GRAPHICS_ACCEPTANCE.md), including dated Xbox photographs/readings, Chromium probes, artwork increments and source/CI provenance, is preserved in Git history. See [the archive index](docs/HISTORY.md).

## Required acceptance (not yet fully achieved)

1. **Original and readable:** preserve existing painted stone, gold, berries, terrain and unit/building art, plus known procedural fallbacks. Review game-play scale, clarity, faction/style differences, construction, damage, projectile and FX rendering against [the graphics checklist](docs/GRAPHICS_OVERHAUL_CHECKLIST.md) and [painted-art source](docs/PAINTED_ART.md).
2. **Real motion coverage:** dedicated independent facings, work/death animations, Elites, regional architecture and coherent age upgrades need more than a base or tinted sprite. New roster items also need fallback art and acceptance checks. See [motion notes](docs/PAINTED_MOTION.md) and [Elite art brief](docs/ELITE_ART_PRODUCTION.md).
3. **Offline and recovery:** generated atlases, WebP/manifest and `sw.js` shell must work offline, recover lost canvas textures and avoid blank/black transition/fog regions. Preserve cached-art integrity and save data. See [historical recovery evidence](docs/verification/canvas-recovery-2026-11-05.json), [terrain blend](docs/verification/terrain-blend-recovery-2026-11-05.json) and [fog profile](docs/verification/browser-fog-profile-2026-11-05.json).
4. **Measured performance:** compare repeatable 50/100/200-unit and large-battle scenes on a stable game revision, zoom, graphics scale and camera. Record FPS, draw/sim/RAF/compositor costs, object counts, terrain/fog and memory bounds; never promote simulated Node performance to hardware FPS. Refer to [performance audit](docs/PERFORMANCE_RENDER_AUDIT.md) and [ROADMAP.md](ROADMAP.md).
5. **Separate sign-off:** quick/focused source checks, actual Chromium browser screenshots/layout/art probes and **physical Xbox Series S Edge** clarity/FPS/controller checks are different gates. Browser or contract success is **not** physical hardware acceptance. Record each test with the commit SHA and observable evidence; see [professional acceptance](docs/PROFESSIONAL_QUALITY.md).

## How to verify

Use `node scripts/run-checks.mjs --quick` and the appropriate focused graphics tests; after installing the repository's pinned Playwright version run `node scripts/run-checks.mjs --browser`. `node scripts/run-checks.mjs --xbox-contracts` checks software/controller contracts, not a console. The graphics inventory is generated from `docs/graphics-inventory.json` via `node scripts/audit-graphics.mjs --check` where supported. Keep slow/hosted checks within the manual CI and free-hosting rules in [AGENTS.md](AGENTS.md).

**Status:** source inventory and historical browser experiments exist, but full original art, consistent physical Xbox rendering and whole-game visual quality remain **PARTIAL/UNVERIFIED** until tested on the exact accepted build.
