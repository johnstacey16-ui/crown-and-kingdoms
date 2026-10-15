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
- Resource gathering, farms with 60-wood automatic reseeding, farm-capacity upgrades, market trading, relic income, trade carts/cogs, renewable fish traps, player tribute and conditional AI-to-ally surplus tribute. Ships can repair friendly ships; AI fleets can dispatch an idle warship to repair badly damaged ships when the area is safe. Configurable villager worker targets include new-worker auto-assignment.
- Ground, siege and naval combat; formations and Aggressive/Defensive/Stand Ground/Passive/No Attack stances; Guard and Follow commands; coordinated AI attack groups, siege targeting, defensive priorities, remote-economy anti-raid responses, retreats, hostile-army-aware counter production and research, and allied-base relief detachments. AI Fishing Ships evade nearby hostile warships; damaged warships can seek repair when safe. Ship repair respects Reinforced Hulls. Researched Man-at-Arms/Long Swordsman, Pikeman, Arbalester, Elite Skirmisher, Light Cavalry and Cavalier ranks display consistently in selection and production UI, with additional battlefield-visible armour, weapon, hull and siege-equipment details; fully unique rank sprites remain a gap.
- Fog of war, minimap, pathfinding, seeded/procedural maps, connectivity diagnostics, save/load flows and multi-objective campaign progression. The Coastal War arc now includes *The Siege of Tidewatch*, an Imperial Age siege mission with artillery production, fortified targets and timed counter-raids.
- Wonder, relic and Regicide victory options alongside the standard Town Centre victory; a score-at-selectable-time-limit mode (10, 15, 20, 25 or 30 minutes); King of the Hill, where military land units contest a central landmark for five uninterrupted minutes; and Sudden Death, where losing your starting Town Centre eliminates your kingdom and building another is disabled.
- Original SVG sprite atlases, team-colour variants, animation metadata, procedural visual fallbacks and synthesised Web Audio.
- Controller-oriented menus and navigation, including Town Bell and pause-menu diplomacy controls for enemy, neutral and ally relationships. Regicide victory respects hostile relationships. Player-selected AI allies share live fog-of-war vision, can send capped surplus-resource tribute, and can react to attacks near allied Town Centres/Castles. AI-negotiated treaties and time-limited diplomatic agreements remain out of scope for the current diplomacy implementation. Population-limit settings now include 50, 100, 150, 200, 250, 300, 400 and 500; houses still determine the capacity actually available during a match.

These statements describe source-level presence, not guaranteed balance or acceptance on physical Xbox hardware. See the roadmap for partial systems and unverified behaviour.

## Run the checks

Use Node.js 22 or a compatible current Node release. No package installation is required for the repository's built-in checks.

```sh
node scripts/check-game.mjs
for test in tests/*.test.mjs; do node "$test" || exit 1; done
node tests/validate-atlas.mjs
```

The GitHub Actions workflow uses the same discovery rule: every `tests/*.test.mjs` file is run automatically, so newly added regression tests cannot silently be omitted from a manually maintained CI list. Most tests are static syntax, source-pattern or asset-metadata checks. They do **not** simulate complete matches and cannot replace browser, deployment, network or Xbox controller testing.

## Project boundaries

The goal is to build gameplay and content that can run in the browser: economy, combat, technologies, AI, maps, campaigns, controls, graphics and audio. Xbox achievements, Xbox cloud saves, Smart Delivery, Xbox Play Anywhere, Xbox-native presence/clubs, platform matchmaking and platform cross-play are outside the current implementation scope because they require supported platform services. Do not represent these as implemented.

## Deployment and verification

The repository is connected to Vercel. Check the Vercel status on the exact latest commit before assuming the hosted page includes a change. A successful deployment status confirms that Vercel completed that deployment; it does not prove that the correct public alias is open or that the build has been tested on Xbox.

For the authoritative current gaps and next steps, see [the parity roadmap](AOE2_PARITY_ROADMAP.md).
