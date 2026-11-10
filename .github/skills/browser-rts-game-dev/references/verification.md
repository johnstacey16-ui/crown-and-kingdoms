# Tests, Xbox/multiplayer and controlled releases

## Gates — know what they prove

| Command | Proof |
| --- | --- |
| `node scripts/run-checks.mjs --quick` | 5 source, offline graph, civilization, atlas, graphics checks |
| `node scripts/run-checks.mjs --focused` | Broad fast focused contracts, **not full regression** |
| `node --test tests/NAME.test.mjs` | Targeted test file |
| `node scripts/run-checks.mjs --regression-files` | Every configured standalone file |
| `node scripts/run-checks.mjs --skirmishes` | 3 seeded production AI games on current SHA |
| `node scripts/run-checks.mjs --campaigns` | 19 isolated scripted missions on current SHA |
| `node scripts/run-checks.mjs --browser` | Chromium/browser, **not Xbox** |
| `node scripts/run-checks.mjs --xbox-contracts` | Controller software, **not Xbox hardware** |
| `node scripts/run-checks.mjs --stability` | Selected bounded long-match soak |
| In-game Series S FPS/controls test | Only real console FPS, focus and readability |

`scripts/run-checks.mjs` owns selections. [Game validation](../../../../.github/workflows/game-validation.yml) runs quick/focused on normal code pushes. [Full regression workflow](../../../../.github/workflows/game-regression.yml) is weekly/manual, protecting free minutes.

## A defensible feature gate

Test age/civ/resource/owner/busy queue, wrong target and no resources spent on failure; actual combat numbers, existing/new unit effects, AI/menu/host consistency, saves and malformed input, network sender/sequence/visibility, graphics manifest/offline/cold-warm rendering. Run longer AI/campaign/browser/hardware when behavior justifies it. A green focused run does not mean 19 campaigns or physical Xbox passed.

**Historical failure lesson:** 10 November Elite shared code initially failed isolated AI/combat tests that didn't load `CIV` and new helper globals; the follow-up preserved safe isolated execution and restored full focused green. Never delete failures or claim a test run on a later SHA from an older run.

## Debug and Xbox acceptance

Capture commit, seed/map, mode/game time, units/buildings total and rendered, canvas pixels, FPS/RAF/SIM/DRAW/WORLD/UNIT timing, stack, picture preset and controller focus/actions. Retest the **same real hardware scene**, long battles, A/minimap, Y/R3 wheels, pause and reconnect. Use [controller source of truth](../../../../XBOX_CONTROLLER_PARITY.md).

Current authenticated two-human WebRTC/Supabase multiplayer is a **preview**. Host validation via `js/network-commands.js` and `js/network-sync.js` must check sender team, orders, costs, visibility and bounds. It cannot make a malicious browser host trusted. WAN reconnect and broader lobbies require actual cross-network evidence.

## Controlled publishing

`vercel.json` runs `scripts/vercel-deployment-gate.mjs`. Exit **0** skips ordinary Git Vercel builds; exit **1** permits explicit standalone `[deploy]` releases. Don't put marker in routine docs/gameplay commits. Verify the tested SHA, live production SHA, free-tier transfer/storage and relevant tests before releasing. After release verify Vercel READY, alias/commit, bounded live smoke and rollback. Manual redeploy can bypass this gate.

The owner's 10 November retention choices (1-day canceled/errored, 7-day preview, 14-day production) are a **preference**, not universal new-game defaults. Follow [release playbook](../../../../docs/VERCEL_RELEASES.md) and [free-hosting policy](../../../../FREE_HOSTING.md).

Always report **GAMEPLAY / GRAPHICS / NETWORK / XBOX / PRODUCTION** statuses individually.
