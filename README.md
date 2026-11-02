# Crown & Kingdoms

**[Play the game](https://crown-and-kingdoms.vercel.app/)** · **[Current roadmap](ROADMAP.md)** · **[Xbox controls](XBOX_CONTROLLER_PARITY.md)** · **[Independent audit](docs/audits/2026-10-31-consolidated-audit.md)**

An original, controller-first medieval real-time strategy game built for **Microsoft Edge on Xbox Series S**. Its end goal is complete functional-category parity with *Age of Empires II: Definitive Edition* on Xbox Series X, including all Xbox-available gameplay DLC. **The full game is not finished or accepted on Xbox hardware.**

**Acceptance status (2 November 2026):** Full baseline: [247/247 regression files and 19/19 mission simulations](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41432394004), [2/2 Chromium](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41431724523), [3/3 seeded AI](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41433080535), on their respective prior revisions. Latest `33323a4` passed [1,020/1,020 focused assertions and 5/5 quick checks](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41439352017); Vercel production is READY at the matching code SHA. The source now skips unnecessary high-quality painted troop canvas transforms and shows tint cache hits/new frames/evictions on the performance HUD. Offline shell **v137**; unchanged 57 browser / 44 core / 42 headless scripts. Owner-reported physical Series S 15-minute baseline is 9 FPS with 372 units and 238 buildings; improvements and complete hardware acceptance remain unverified. This new optimization has not received a repeat full 247-file suite.

**Current tree inventory:** 247 standalone regression files, 57 production browser scripts, 44 core scripts, 42 headless scripts and 30 Markdown documents.

**Series S sustained-battle evidence (2 Nov 2026, owner hardware):** After about 15 minutes without the previous crash, the 4-team battle was at **9 FPS / 116.8 ms RAF**, **372 total / 131 rendered units**, **238 total / 20 rendered buildings**, and **2160×1063 backing pixels at 100% scale**. Profiling showed **SIM 11.4 ms, DRAW 52.1 ms, WORLD 48.8 ms, UNIT 44.1 ms, LOOP 70.1 ms, GAP 46.7 ms**. This confirms a large visible-troop render bottleneck, not hardware acceptance. Latest fix retains native frame quality and uses a direct draw for forward-facing motion frames; the FPS HUD now exposes team-tint cache hit/create/evict counts and cropped-frame usage. **FPS improvement is unmeasured until the same Xbox scene is retested.**

**Xbox Series S test scene:** From the title screen, highlight **Xbox FPS Test**, use **D-pad Left/Right** to choose **50, 100 or 200 total units**, and press **A**. The same two-settlement scene uses original painted artwork, displays unit count/FPS and supports the pause-menu pixel and layer benchmarks. Only a separate reserved test-save key is used; normal manual/autosaves are untouched. Record actual Series S Edge FPS and frame time for all three loads; desktop Chromium or simulated Node results are not console evidence.

**Repeatable 200-unit movement probe:** `node scripts/stress-200.mjs --ticks=2400` prints route/pathfinding, wall-crossing, movement completion and Node timing metrics. The narrow artificial corridor is not an Xbox hardware benchmark.

**Live audit counts:** `node scripts/report-repository-inventory.mjs` generates current numbers from the checked-out tree. The focused regression validates the README snapshot whenever source or tests are added.

**Current engineering phase:** [refactoring and cleanup before new features](docs/REFACTORING_INVENTORY.md). Procedural fallback art, trade/transport logistics and AI policy selectors now have distinct modules (`js/render-procedural-units.js`, `js/simulation-logistics.js`, `js/ai-policy.js`, `js/simulation-combat-bonuses.js`, `js/simulation-resource-routing.js`, `js/simulation-production-queues.js`, `js/simulation-research.js`, `js/simulation-building-production.js`, `js/simulation-building-updates.js` and `js/simulation-separation.js`); the complete hosted regression/Chromium suites still require current-tree evidence. Gameplay development is temporarily secondary to consolidation of existing scripts, module responsibilities, tests and documentation.

## What exists

- **Solo RTS:** resource gathering, ages, buildings, troops, combat, AI skirmishes, naval units, monks/relics, formations, diplomacy, victory modes, manual saves and autosaves. Numeric and feature parity are incomplete.
- **Civilizations:** 26 playable entries with partial bonuses and technologies; the regional Camel Rider Stable line is now restricted to the eight eligible existing civilizations. Other regional units, the full base roster and all DLC rulesets remain unfinished.
- **Campaigns:** 19 original missions. A 29 October scripted run had **7 wins, 7 losses and 5 timeouts**; execution is not proof that every mission is human-completable.
- **Graphics:** original painted terrain, resources (including **stone, gold and berries**), buildings, construction/damage/fire/projectiles and movement/activity art for **47/47 current playable troops**. Independent directional/death/work frames, regional architecture and DLC art remain open. See [graphics checklist](docs/GRAPHICS_OVERHAUL_CHECKLIST.md).
- **Audio:** original procedural Web Audio sound/music with spatial effects. Complete audio quality and event coverage have not been accepted.
- **Controller:** existing A/RT/LB commands, left-stick pan and right-stick zoom; **solo R3 villager-priority presets/manual wheel is now partially implemented** (population-scaled ratios, seven reference-based presets and opt-in solo automatic farms implemented; multiplayer R3 and full hardware parity still missing). View, contextual X, LT waypoints, menu gestures and physical Xbox parity remain open in the [controller contract](XBOX_CONTROLLER_PARITY.md).
- **Multiplayer:** authenticated **two-human battlefield preview** with direct WebRTC and guarded commands. It is not a complete 1v1 product: independent-network full-match acceptance, reconnect, larger player counts, hidden-state security and fallback transport remain open.

These are status descriptions, **not release claims**. [ROADMAP.md](ROADMAP.md) is the active 48-task completion ledger. Earlier dated implementation milestones belong in the [delivery register](MASTER_AUDIT_AND_DELIVERY_REGISTER.md), not the current project status.

**Development saves:** Until the game reaches its completed release, a new update may make saves from earlier test builds incompatible. The game should still support saves created by its current version and safely reject incompatible files; long-term backward compatibility and migrations will be finalised at release. Start a new game or regenerate a test save after a breaking development change.

## Play and multiplayer preview

The existing public game is hosted on **Vercel under the free-only policy**, at the link above. Do not restart or redeploy the historical Railway service, or incur paid credits or overages. Read [FREE_HOSTING.md](FREE_HOSTING.md) before infrastructure changes.

For multiplayer, choose **Multiplayer → Two-player battlefield preview**; the host creates a private invitation, the guest pastes it to join, and the host verifies the map before starting. Menu opens local options without pausing the online game. LB gives eight local control-group slots and RB opens the expanded minimap. Invitation text entry still needs controller-only UX work. Not all networks can establish direct connections.

## Local development and checks

Serve the repository root using a static HTTP server and open `index.html` with a connected gamepad. The browser uses classic scripts in a deliberate load order: changing source paths requires coordinated `index.html`, `sw.js`, cache/asset manifest and regression updates.

Use **Node.js 22** for checks on Windows, macOS or Linux. These commands run locally and do not require GitHub Actions or paid infrastructure:

```sh
node scripts/run-checks.mjs                    # Five quick source/asset gates
node scripts/run-checks.mjs --focused          # The fast hosted Node --test selection
node scripts/run-checks.mjs --regression-files # All 247 standalone regression files
node scripts/run-checks.mjs --skirmishes       # Three seeded production-AI matches
node scripts/run-checks.mjs --campaigns        # 19 individually isolated missions
node scripts/run-checks.mjs --xbox-contracts   # Xbox controller/graphics software checks
node scripts/run-checks.mjs --regressions      # Quick gates + every standalone test
node scripts/run-checks.mjs --full             # Quick + all regressions + AI + campaigns
```

The single runner continues after individual failures, preserves isolated scenario processes, and writes grouped logs and a GitHub Actions summary. The full suite can take substantially longer. Chromium requires the workflow's pinned Playwright installation (`playwright@1.56.1` and Chromium); after installing it, use `node scripts/run-checks.mjs --browser` for both art and multiplayer-layout checks. The optional private Windows runner uses the same commands. **Xbox software contracts are not a physical Xbox Series S Edge FPS/controller test**, and these commands do not establish independent-network multiplayer acceptance.

**Latest documented hosted test evidence:** source commit [`8b262d4`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/8b262d4) passed [Game validation run 41364986053](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41364986053) with 934/934 focused assertions and five quick checks (243 of 247 standalone test files selected). This does **not** certify the remaining four standalone files, latest full suite, current documentation-only changes, independent WAN multiplayer, human campaign wins or physical Series S performance. The older 30 October pre-job Actions failures are superseded as the latest CI checkpoint, not proof that all future runs will pass.

## Where to work

| Files | Purpose |
|---|---|
| `index.html`, `styles.css`, `engine.js`, `js/` | Browser startup, gameplay, input, simulation, AI and rendering |
| `assets/` | Original art atlases, sources, manifests and revisions |
| `sw.js`, `persistence.js`, `js/save.js` | Offline shell/cache and save integrity |
| `multiplayer.js`, `js/network-*.js`, `server/` | Existing preview, compatibility paths, transport and verification — **not automatically obsolete** |
| `scripts/`, `tests/`, `.github/workflows/` | Generation, validation, game and browser tests |
| [AGENTS.md](AGENTS.md) | Development rules: work on `main`, preserve Xbox controls, safeguards and free hosting |
| [ROADMAP.md](ROADMAP.md) | **Current** tasks and acceptance criteria |
| [XBOX_SERIES_X_FULL_PARITY_AND_MULTIPLAYER_PLAN.md](XBOX_SERIES_X_FULL_PARITY_AND_MULTIPLAYER_PLAN.md) | Complete Xbox gameplay, DLC and multiplayer requirements |
| [MASTER_AUDIT_AND_DELIVERY_REGISTER.md](MASTER_AUDIT_AND_DELIVERY_REGISTER.md) | Dated implementation evidence and historic `CK-###` items |

The [older AoE II journal](AOE2_PARITY_ROADMAP.md), graphics history and prior CI/deployment notes are historical evidence, **not active instructions**. Git history retains superseded prose. Do not bulk-delete legacy-looking runtime, artwork, save, security, network or test files without proving them unused and running the relevant regression checks.


**Xbox large battle save:** Select **Large Battle Test Save** on the title screen and press **A**. It prepares a reproducible four-kingdom battlefield with **372 real units, 238 completed buildings** and opposing armies staged near the map centre with saved attack orders. The game opens **paused**, so choose **Resume** when you want the fighting to begin. Performance HUD is enabled and normal manual/autosave slots are not touched; the test uses the reserved `ck_series_s_prebattle_fixture_v1` key. The battle is regenerated from the same seed when selected again; it is not a replacement for your campaign or ordinary saves. Check sustained FPS/unit rendering after resuming on physical Xbox Series S Edge.
