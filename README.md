# Crown & Kingdoms

Crown & Kingdoms is an original, controller-first medieval real-time strategy game built for modern browsers, with Xbox Series S and Microsoft Edge as the primary target. It takes inspiration from the broad systems of Age of Empires II: Definitive Edition, but it is not an exact recreation of its complete roster, balance, campaign catalogue, artwork or platform features.

## Source of truth

- **`index.html`** — primary game page, canvas renderer, simulation and embedded local sprite-atlas manifest.
- **`assets/`** — original SVG unit/building atlases and local textures. The renderer keeps procedural drawing fallbacks.
- **`multiplayer.js`** — separate multiplayer integration code. Its presence is not proof that network play is reliable or fully tested.
- **`scripts/` and `tests/`** — source-level checks and regression guards.
- **`AOE2_PARITY_ROADMAP.md`** — current implementation status, known gaps and recommended development order.
- **`GRAPHICS_AUDIO_UPGRADE_PROMPT.md`** — detailed engineering brief for future art, animation, audio and performance work.

The root `index.html` is the canonical game entry point. Avoid maintaining competing standalone game builds in the repository root.

## Systems currently present in source

- Four-age progression, buildings, unit production, research, construction and repair.
- Resource gathering, farms with 60-wood automatic reseeding, farm-capacity upgrades, market trading, relic income, trade carts/cogs, renewable fish traps, ally-only tribute and configurable villager worker targets with new-worker auto-assignment.
- Ground, siege and naval combat; formations and Aggressive/Defensive/Stand Ground/Passive/No Attack stances; Guard and Follow commands; AI attack groups, defensive priorities, retreats and naval target selection.
- Fog of war, minimap, pathfinding, seeded/procedural maps, connectivity diagnostics, save/load flows and campaign objectives.
- Wonder, relic and Regicide victory options alongside the standard Town Centre victory; a score-at-20-minutes mode that compares surviving armies/buildings, held resources, age, technologies and stored relics.
- Original SVG sprite atlases, team-colour variants, animation metadata, procedural visual fallbacks and synthesised Web Audio.
- Controller-oriented menus and navigation, including Town Bell and pause-menu diplomacy controls for enemy, neutral and ally relationships. Population-limit settings now include 50, 100, 150, 200, 250, 300, 400 and 500; houses still determine the capacity actually available during a match.

These statements describe source-level presence, not guaranteed balance or acceptance on physical Xbox hardware. See the roadmap for partial systems and unverified behaviour.

## Run the checks

Use Node.js 22 or a compatible current Node release. No package installation is required for the repository's built-in checks.

```sh
node scripts/check-game.mjs
node tests/population-limits.test.mjs
node tests/town-bell.test.mjs
node tests/diplomacy.test.mjs
node tests/tribute.test.mjs
node tests/villager-priority.test.mjs
node tests/score-time-limit.test.mjs
node tests/no-attack-stance.test.mjs
node tests/guard-follow.test.mjs
node tests/trade-routes.test.mjs
node tests/fishing-economy.test.mjs
node tests/fish-traps.test.mjs
node tests/technology-effects.test.mjs
node tests/ai-retreat.test.mjs
node tests/ai-siege-support.test.mjs
node tests/ai-defence-priority.test.mjs
node tests/naval-ai-priority.test.mjs
node tests/campaign-content.test.mjs
node tests/map-connectivity.test.mjs
node tests/map-generation-static.test.mjs
node tests/validate-atlas.mjs
```

GitHub Actions runs these checks on pushes and pull requests to `main`. Most tests are static syntax, source-pattern or asset-metadata checks. They do **not** simulate complete matches and cannot replace browser, deployment, network or Xbox controller testing.

## Project boundaries

The goal is to build gameplay and content that can run in the browser: economy, combat, technologies, AI, maps, campaigns, controls, graphics and audio. Xbox achievements, Xbox cloud saves, Smart Delivery, Xbox Play Anywhere, Xbox-native presence/clubs, platform matchmaking and platform cross-play are outside the current implementation scope because they require supported platform services. Do not represent these as implemented.

## Deployment and verification

The repository is connected to Vercel. Check the Vercel status on the exact latest commit before assuming the hosted page includes a change. A successful deployment status confirms that Vercel completed that deployment; it does not prove that the correct public alias is open or that the build has been tested on Xbox.

For the authoritative current gaps and next steps, see [the parity roadmap](AOE2_PARITY_ROADMAP.md).
