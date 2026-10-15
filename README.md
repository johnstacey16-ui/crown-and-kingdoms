# Crown & Kingdoms

Crown & Kingdoms is an original, controller-first medieval real-time strategy game for modern browsers, targeting Xbox Series S and Microsoft Edge. It takes inspiration from the broad systems of Age of Empires II: Definitive Edition; it is not a complete recreation of that game's content, balance, art or platform services.

## Start here

Open `index.html` through a local static web server or the configured deployment. The game uses classic browser scripts and a shared global runtime; script order in `index.html` is intentional. Do not convert files to ES modules or reorder scripts without updating the checks and testing startup.

### Main runtime files

| File | Responsibility |
| --- | --- |
| `index.html`, `styles.css` | Canonical page, canvas and controller-first layout |
| `js/config.js`, `js/state.js` | Definitions, shared state and core helpers |
| `js/mapgen.js`, `js/pathfinding.js` | New-game setup, procedural/fixed maps and route finding |
| `js/simulation.js`, `js/ai.js` | Fixed-step simulation, economy/combat integration and rival strategy |
| `js/entities.js`, `js/kingdom.js`, `js/economy.js`, `js/formations.js` | Entity creation, diplomacy/tribute/worker priorities, trading and formation commands |
| `js/input.js`, `js/menus.js`, `js/campaign.js` | Controller input, menu models/actions and campaign rules/events |
| `js/render.js`, `js/minimap.js`, `js/ui.js` | Canvas world art, minimap and screen/HUD presentation |
| `js/assets.js`, `assets/` | Optional local SVG atlas loading and procedural fallbacks |
| `js/audio.js` | Synthesised sound, ambience and adaptive music |
| `js/save.js`, `persistence.js` | Save compatibility and IndexedDB backup/restore |
| `multiplayer.js` | Supabase Realtime lobby/presence integration; not authoritative full-match networking |
| `sw.js` | Same-origin offline shell and asset cache |
| `scripts/`, `tests/`, `.github/workflows/` | Source checks, regression tests, asset checks and CI |

## Gameplay currently represented in source

- Four-age progression, buildings, unit production, research and upgrades.
- Resource gathering, construction/repair, farms with automatic reseeding, market trading, trade carts/cogs, relic income, fishing and fish traps.
- Ground, siege and naval combat; formations, stances, Guard/Follow and other controller-driven orders.
- Rival AI with economy expansion, technology priorities, defensive responses, grouped attacks, siege targeting and naval behaviours.
- Fog of war, minimap, seeded/procedural maps, named layouts and connectivity diagnostics.
- Campaign missions, objectives, timed events and progression.
- Multiple victory/match modes, configurable population ceilings, diplomacy/tribute, local save/load, procedural audio and original SVG/procedural visuals.

This list indicates source-level implementation, not guaranteed balance or end-to-end correctness. Consult [the parity roadmap](AOE2_PARITY_ROADMAP.md) for partial systems, remaining work and verification boundaries.

## Run automated checks

Use Node.js 22 or a compatible current Node release. The repository's checks do not require package installation:

```sh
node scripts/check-game.mjs
for test in tests/*.test.mjs; do node "$test" || exit 1; done
node tests/validate-atlas.mjs
```

GitHub Actions discovers and runs every `tests/*.test.mjs` test. The suite is primarily static syntax, source-invariant, regression and asset-metadata validation. It does not simulate complete matches or prove frame rate, visual quality, deployment correctness, networking resilience or physical Xbox compatibility.

## Latest automated verification

As of 15 October 2026, GitHub Actions run [#923](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/38742305191) passed on commit `10a9a2f7209236385b57d31e7f71f1e844147d78`. The workflow completed script/source checks, every `tests/*.test.mjs` regression test, and sprite-atlas metadata/frame-bound validation. This includes the campaign save/load round-trip that failed on the preceding commit; the underlying issue was an over-escaped digit matcher that rejected valid indexed entity references. This is automated CI evidence, not browser playtesting or Xbox verification.

## Local autosave

During active local play, the game attempts an autosave every 60 seconds into one rolling `ck_autosave` slot; each successful save replaces the previous autosave. The Load Game menu offers a separate **Recover Autosave** action, leaving the three manual slots untouched. Autosave is suppressed for active multiplayer sessions, including pause/blur-triggered saves, because the current lobby is not a complete authoritative multiplayer save system. The IndexedDB backup is best-effort: both synchronous adapter exceptions and rejected asynchronous mirror promises are ignored so they cannot block the primary localStorage write; browser storage failures can still prevent a save, so autosave is not a substitute for verified storage durability.

## Development rules

1. Preserve controller-only usability, existing save compatibility and the fixed-step simulation contract.
2. Keep shared classic-script globals and script order intact unless a tested migration explicitly updates all consumers.
3. When adding a script, update `index.html`, `sw.js`, `scripts/check-game.mjs` and relevant regression coverage in the same change.
4. Fixes should include focused regression tests. Run the full check set after meaningful changes; do not describe unrun tests as passing.
5. Keep original art and procedural fallbacks available when atlas assets fail to load.
6. Do not claim a deployment is live until the exact commit's deployment status is confirmed.

## Scope

The project focuses on browser-capable RTS gameplay, content, controls, graphics, audio and performance. Xbox achievements, Xbox cloud saves, Xbox-native matchmaking/presence/clubs, Smart Delivery and platform cross-play are out of scope without supported platform services.

## Roadmaps

- [Age of Empires II-inspired gameplay and content parity](AOE2_PARITY_ROADMAP.md)
- [Browser architecture, performance and platform roadmap](docs/BROWSER_TECH_ROADMAP.md)


- **Husbandry:** Stable research available in Castle Age increases movement speed for mounted units by 10%. Existing cavalry and mounted unique units use the same movement-speed helper; infantry and transport/economic ships retain their original speed. AI values the technology when it has a mounted force.
