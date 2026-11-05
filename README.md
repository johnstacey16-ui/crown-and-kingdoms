# Crown & Kingdoms

**[Play the game](https://crown-and-kingdoms.vercel.app/)** · **[Current roadmap + new-chat development handover](ROADMAP.md)** · **[Xbox controls](XBOX_CONTROLLER_PARITY.md)** · **[Independent audit](docs/audits/2026-10-31-consolidated-audit.md)**

An original, controller-first medieval real-time strategy game built for **Microsoft Edge on Xbox Series S**. Its end goal is complete functional-category parity with *Age of Empires II: Definitive Edition* on Xbox Series X, including all Xbox-available gameplay DLC. **The full game is not finished or accepted on Xbox hardware.**

**Development handover (2 November 2026):** The [**current roadmap and new-chat launch checklist**](ROADMAP.md) now consolidates the five independent audit reviews, what has **already been fixed**, and the ordered unresolved work across production deployment, Xbox performance, controller parity, engine cleanup, gameplay, AI, campaigns, civilizations/DLC and multiplayer. Read it with [AGENTS.md](AGENTS.md) and verify current GitHub/Vercel status before new changes; the unmodified 48 audited `AUD-###` tasks remain below its execution summary.

**Latest checked code before handover:** [`3c9cc10`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/3c9cc10c2655a7c1a9d78b19ce0a40c1297dea13) on `main`. [PRs #61–#64](https://github.com/johnstacey16-ui/crown-and-kingdoms/pulls?q=is%3Apr+is%3Amerged) fixed nonradial command-menu and null menu crashes, bounded rubble, added async/uncaught error capture, and persisted four AI timing fields through save/reload. [The hosted 2 November verification](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41459519687) passed **1,032/1,032 focused checks** and **3/3 seeded production skirmishes**, including active-player reload and a natural match result. The verification-only [PR #65](https://github.com/johnstacey16-ui/crown-and-kingdoms/pull/65) was **closed, not merged**, with no lasting CI schedule change. These are exact tested-revision results, not a claim of full 19-campaign acceptance or console parity.

**Production deployment status (verified 3 November 2026):** Vercel's READY public alias `crown-and-kingdoms.vercel.app` still serves [`6f083a4`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/6f083a4c613cedc275786aca81032aed0d4419c5), whereas GitHub `main` had reached [`f9bfa56`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/f9bfa56a5080e5f6f900ba5c290fe7e4b34816ea) when checked. Vercel's status for the later commit reported a **free-plan build-rate-limit failure**; newer code is not confirmed live. An earlier READY alignment at `f1ef5f5` was a historical checkpoint, not today's revision. Do not purchase credits, enable overages or reactivate Railway; verify the exact production alias/commit again before claiming a release. READY deployment is not Series S performance or console acceptance.

**Current tree inventory:** 247 standalone regression files, 60 production browser scripts, 47 core scripts, 43 headless scripts and 28 Markdown documents.

**Series S sustained-battle evidence (2 Nov 2026, owner hardware):** After about 15 minutes without the previous crash, the 4-team battle was at **9 FPS / 116.8 ms RAF**, **372 total / 131 rendered units**, **238 total / 20 rendered buildings**, and **2160×1063 backing pixels at 100% scale**. Profiling showed **SIM 11.4 ms, DRAW 52.1 ms, WORLD 48.8 ms, UNIT 44.1 ms, LOOP 70.1 ms, GAP 46.7 ms**. This confirms a large visible-troop render bottleneck, not hardware acceptance. Latest fix retains native frame quality and uses a direct draw for forward-facing motion frames; the FPS HUD now exposes team-tint cache hit/create/evict counts and cropped-frame usage. **FPS improvement is unmeasured until the same Xbox scene is retested.**

**Xbox Series S test scene:** From the title screen, highlight **Xbox FPS Test**, use **D-pad Left/Right** to choose **50, 100 or 200 total units**, and press **A**. The same two-settlement scene uses original painted artwork, displays unit count/FPS and supports the pause-menu pixel and layer benchmarks. Only a separate reserved test-save key is used; normal manual/autosaves are untouched. Record actual Series S Edge FPS and frame time for all three loads; desktop Chromium or simulated Node results are not console evidence.

**Repeatable 200-unit movement probe:** `node scripts/stress-200.mjs --ticks=2400` prints route/pathfinding, wall-crossing, movement completion and Node timing metrics. The narrow artificial corridor is not an Xbox hardware benchmark.

**Live audit counts:** `node scripts/report-repository-inventory.mjs` generates current numbers from the checked-out tree. The focused regression validates the README snapshot whenever source or tests are added.

**Documentation cleanup (3 November 2026):** Removed the obsolete `docs/NEXT_PAINTED_SHEETS.md` and `docs/GRAPHICS_CONTINUATION.md` plans. Their dated contents remain in Git history; current art and engineering work should follow [the graphics checklist](docs/GRAPHICS_OVERHAUL_CHECKLIST.md), [the active roadmap](ROADMAP.md), and original prompt JSON/manifests. No artwork, game code, tests or validation workflows were removed.

**Current engineering phase:** [refactoring and cleanup before new features](docs/REFACTORING_INVENTORY.md). Procedural fallback art, trade/transport logistics and AI policy selectors now have distinct modules (`js/render-procedural-units.js`, `js/simulation-logistics.js`, `js/ai-policy.js`, `js/simulation-combat-bonuses.js`, `js/simulation-resource-routing.js`, `js/simulation-production-queues.js`, `js/simulation-research.js`, `js/simulation-building-production.js`, `js/simulation-building-updates.js` and `js/simulation-separation.js`); the complete hosted regression/Chromium suites still require current-tree evidence. Gameplay development is temporarily secondary to consolidation of existing scripts, module responsibilities, tests and documentation.

## What exists

- **Solo RTS:** resource gathering, ages, buildings, troops, combat, AI skirmishes, naval units, monks/relics, formations, diplomacy, victory modes, manual saves and autosaves. Numeric and feature parity are incomplete.
- **Civilizations:** 26 playable entries with partial bonuses and technologies; the regional Camel Rider Stable line is now restricted to the eight eligible existing civilizations. Other regional units, the full base roster and all DLC rulesets remain unfinished.
- **Campaigns:** 19 original missions. The [3 November isolated playthrough record](docs/verification/campaign-2026-11-03.json) has **13 real scripted victories, 6 scripted-player defeats and 0 timeouts** with mission seeds, unfinished objectives and defeat causes. These are not 19 victories or proof of human/Xbox completion.
- **Graphics:** original painted terrain, resources (including **stone, gold and berries**), buildings, construction/damage/fire/projectiles and movement/activity art for **47/47 current playable troops**. Independent directional/death/work frames, regional architecture and DLC art remain open. See [graphics checklist](docs/GRAPHICS_OVERHAUL_CHECKLIST.md).
- **Audio:** original procedural Web Audio sound/music with spatial effects. Complete audio quality and event coverage have not been accepted.
- **Controller:** existing A/RT/LB commands, left-stick pan and right-stick zoom; **solo R3 villager-priority presets/manual wheel is now partially implemented** (population-scaled ratios, seven reference-based presets and opt-in solo automatic farms implemented; multiplayer R3 and full hardware parity still missing). View, contextual X, LT waypoints, menu gestures and physical Xbox parity remain open in the [controller contract](XBOX_CONTROLLER_PARITY.md).
- **Multiplayer:** authenticated **two-human battlefield preview** with direct WebRTC and guarded commands. It is not a complete 1v1 product: independent-network full-match acceptance, reconnect, larger player counts, hidden-state security and fallback transport remain open.

These are status descriptions, **not release claims**. [ROADMAP.md](ROADMAP.md) is the active 48-task completion ledger. Earlier dated implementation milestones belong in the [delivery register](MASTER_AUDIT_AND_DELIVERY_REGISTER.md), not the current project status.

**Development saves:** Until the game reaches its completed release, a new update may make saves from earlier test builds incompatible. The game should still support saves created by its current version and safely reject incompatible files; long-term backward compatibility and migrations will be finalised at release. Start a new game or regenerate a test save after a breaking development change.

## Play and multiplayer preview

The public game is hosted **only on Vercel** under the free-only policy. Railway and Docker are **not approved or needed for deployment**, and their retired setup must not be reactivated. The local Node relay remains solely as a browser/security test harness, not a production host. Removing deployment files does not terminate any historical external service or revoke account credentials. Read [FREE_HOSTING.md](FREE_HOSTING.md) before infrastructure changes.

For multiplayer, choose **Multiplayer → Two-player battlefield preview**; the host creates a private invitation, the guest pastes it to join, and the host verifies the map before starting. Menu opens local options without pausing the online game. LB gives eight local control-group slots and RB opens the expanded minimap. Invitation text entry still needs controller-only UX work. Not all networks can establish direct connections.

## Local development and checks

Serve the repository root using a static HTTP server and open `index.html` with a connected gamepad. The browser uses classic scripts in a deliberate load order: changing source paths requires coordinated `index.html`, `sw.js`, cache/asset manifest and regression updates.

Use **Node.js 22** for checks on Windows, macOS or Linux. These commands run locally and do not require GitHub Actions or paid infrastructure:

```sh
node scripts/run-checks.mjs                    # Five quick source/asset gates
node scripts/run-checks.mjs --focused          # The fast hosted Node --test selection
node scripts/run-checks.mjs --regression-files # All 247 standalone regression files
node scripts/run-checks.mjs --stability        # Bounded 30-minute lifecycle soak, three seeds/maps
node scripts/run-checks.mjs --skirmishes       # Three seeded production-AI matches
node scripts/run-checks.mjs --campaigns        # 19 individually isolated missions
node scripts/run-checks.mjs --xbox-contracts   # Xbox controller/graphics software checks
node scripts/run-checks.mjs --regressions      # Quick gates + every standalone test
node scripts/run-checks.mjs --full             # Quick + all regressions + AI + campaigns
```

The single runner continues after individual failures, preserves isolated scenario processes, and writes grouped logs and a GitHub Actions summary. The full suite can take substantially longer. Chromium requires the workflow's pinned Playwright installation (`playwright@1.56.1` and Chromium); after installing it, use `node scripts/run-checks.mjs --browser` for both art and multiplayer-layout checks. The optional private Windows runner uses the same commands. **Xbox software contracts are not a physical Xbox Series S Edge FPS/controller test**, and these commands do not establish independent-network multiplayer acceptance.

**Latest documented hosted validation:** [Game validation run 41571911670](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41571911670) passed the five quick gates and focused gameplay, graphics and controller regressions for the code subsequently squash-merged in [PR #77](https://github.com/johnstacey16-ui/crown-and-kingdoms/pull/77). The focused selection is **not** the complete 247-file standalone suite. Full current-tree standalone regressions, 19 campaigns, physical Xbox Series S FPS/controller acceptance, and independent-WAN multiplayer remain separate unverified gates.

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
