# Crown & Kingdoms — active roadmap and new-chat handover

**Updated 2 November 2026 after the five-part engine/controller/rendering/gameplay/network audit review.** This is the **single active execution plan** for a new development conversation. The existing 48 numbered `AUD-###` tasks, their identifiers, and original acceptance requirements are retained **below**. [AGENTS.md](AGENTS.md) provides agent operating instructions; [docs/REFACTORING_INVENTORY.md](docs/REFACTORING_INVENTORY.md) records module ownership. The large [delivery register](MASTER_AUDIT_AND_DELIVERY_REGISTER.md) is historical, not a list of fresh bugs. For source/audit context, use [the 31 October consolidated audit](docs/audits/2026-10-31-consolidated-audit.md) and the [unabridged historical snapshot](https://github.com/johnstacey16-ui/crown-and-kingdoms/tree/ef2a6356692626bd60900a60c9d3e42db94da694).

## Starting position — verify again when beginning new work

- **Latest measured 3 November checkpoint:** [19 isolated campaign simulations](docs/verification/campaign-2026-11-03.json) yielded 13 genuine scripted wins, six player defeats and no timeouts. The public Vercel production alias remained READY at `6f083a4` while `main` had advanced to `f9bfa56`; the newer Vercel status failed with a free-plan build-rate-limit. No paid upgrade or Railway reactivation is authorised.

- **Previous production alignment checkpoint (early 3 November 2026):** The READY public alias previously matched `main` at [`f1ef5f5`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/f1ef5f5bac1667219a5191b928457ac79924ce0e). This is historical; always re-check the exact running SHA after later merges.
- **Merged fixes:** [#61](https://github.com/johnstacey16-ui/crown-and-kingdoms/pull/61) sanitized list/radial menu state and guarded `openRadial`; [#62](https://github.com/johnstacey16-ui/crown-and-kingdoms/pull/62) capped/expired cosmetic rubble; [#63](https://github.com/johnstacey16-ui/crown-and-kingdoms/pull/63) recorded global browser/Promise/audio-timer failures; [#64](https://github.com/johnstacey16-ui/crown-and-kingdoms/pull/64) persisted four missing AI tactical cooldowns through save/load. Do **not** reimplement these outdated audit findings without a newly reproduced bug.
- **Verified hosted checks:** [2 November full AI verification](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41459519687) passed **1,032/1,032 focused subtests** plus **3/3 seeded production-AI skirmishes** against the current game code, including an active player reloaded at 900 simulated seconds and a natural result at ~2,024 seconds. [Verification-only #65](https://github.com/johnstacey16-ui/crown-and-kingdoms/pull/65) was **closed, not merged**; its one-off workflow alteration was reverted. Earlier audit's failed active-player save/reload **did not reproduce** on this seed and revision; other seeds/maps remain unverified.
- **Production blocker resolved at the checked revision:** Vercel's production build `dpl_CL5FzsXjQb5A1WMLTqbkSRMqtLTm` was **READY** at `f1ef5f5`, and the public hostname appeared in that deployment's alias list. An earlier `19276cf` mismatch is historical, not a current failure. The live revision must be checked again after later merges, and current Series S performance is still not hardware-verified.
- **Physical Xbox Series S evidence:** owner measured approximately **12 FPS / 83.5 ms RAF** at **223 total units / 239 buildings** in one sustained scenario (SIM ~11.8 ms, DRAW ~5.3 ms), and other heavy-battle runs around 5–9 FPS. An earlier ~372-unit/238-building scene showed ~9 FPS and significant unit drawing. Different settings/scenes are not directly comparable. Node/Chromium tests and speculative 30–60 FPS estimates are **not** Series S performance evidence. The gap between RAF interval and game-loop time may involve scheduling, compositor/GPU or other costs; its cause is unproven.
- **Content baseline:** 26 partial civilizations; 19 original fictional missions; four basic naval ship classes; significant technology, team-bonus, unique-unit, art, controller, DLC and multiplayer gaps. These are **not** full AoE II DE parity. Exact late-2026 DLC/roster data must be refreshed against authoritative references.
- **Boundaries:** original art, audio, code and campaign writing (no copied commercial protected media/content); Xbox Series S Edge with AoE II DE Xbox **control semantics**; current-build saves; free-tier Vercel/GitHub/Supabase only, no paid upgrades/overages, no Railway reactivation; no destructive/force changes.

## Implementation order for the next conversation

The owner has approved autonomous incremental continuation. Make meaningful changes, verify in hosted CI, and merge focused PRs to `main` without routine approval prompts. **Prioritize cleanup and reliability before major feature expansion.** Maintain a single honest VERIFIED / PARTIAL / UNVERIFIED status, not a stream of duplicate audit notes.

### P0 — deployed revision, remaining correctness, and acceptance

1. **Resolve GitHub → Vercel production mismatch (UNVERIFIED for latest code).** As checked on 3 November, the live public alias serves `6f083a4`, behind `main` at `f9bfa56`; the latter's Vercel status failed because of the free-plan build-rate-limit. Do not purchase credits or force repeat deployments; verify the exact Git SHA and public alias after the quota permits another free deployment. Follow with revision-aware HTTP smoke, offline shell/WebP cache verification and `webrtc-live` checks. A preview is not production proof.
2. **Extend crash recovery coverage without repeating fixed defects.** Missing `TE[s[0].rs.k]` research HUD and the King-mode `tc` guard were addressed in [PR #67](https://github.com/johnstacey16-ui/crown-and-kingdoms/pull/67); the #61 menu normalizer and #63 failure capture also remain. Investigate any newly reproducible empty-selection dereference before changing input, and extend behavioural full-draw/error recovery tests rather than duplicate source-text assertions.
3. **Complete controller/menu help and physical checks without remapping gameplay.** The existing behavioural `menu-screen-ui-extraction` regression verifies Start/Menu back in setup/options/slots/campaign/briefing; check actual Xbox Edge behavior before claiming hardware acceptance. Still correct/verify initial left-stick guidance (LS pans camera, A selects at centre), clarify `Cursor speed`'s expanded-minimap role, and audit small-minimap A and objectives RB-close help.
4. **19 campaign simulations executed; victory acceptance PARTIAL.** [3 November seeded evidence](docs/verification/campaign-2026-11-03.json): 13 wins, six scripted-player defeats, zero timeouts, with real completed/unmet goals, seed and defeat reason per mission. The Iron Pass now wins; Greywatch, Golden Coast, Strait's Last Relic, Tidewatch, Causeway Muster and Crown Holds the Crossing remain unverified as simple-bot victories. The second relic mission has a distinct title. Track Greywatch at [issue #93](https://github.com/johnstacey16-ui/crown-and-kingdoms/issues/93), then investigate coastal Dock exploration and siege escort/production. **A bot defeat is not proof of impossible human completion.** Controller playthrough and physical Xbox acceptance remain open; never weaken objectives or invent kills for green tests.
5. **Long-match stability acceptance (PARTIAL):** `node scripts/run-checks.mjs --stability` now runs three deterministic 30-minute destruction/cache fixtures plus a 45-second quiet tail, reloads at 15/30 minutes, and checks dead-entity removal, rubble/effect/particle cleanup, corpse cap and sprite pixel-budget accounting. It uses production lifecycle code with AI disabled in the fixture; it is not a natural match, browser heap measurement or Xbox benchmark. The existing weekly/manual regression job runs it with a three-minute process deadline; fast per-push validation is unchanged. Alternate production-AI seeds, real browser memory growth and physical Xbox extended play remain open.

### P1 — measured Xbox rendering performance

1. **Confirm the frozen-canvas/RAF pacing diagnostic is live**, then run Full → Frozen full → Flat field → Frozen flat → Full repeat on actual Series S Edge. Also run the layer-isolation benchmark and reproducible 50/100/200-unit test scenes, with comparable camera/scale/picture settings. Record SIM, DRAW, unit/world/fog/FX/UI times, LOOP and residual RAF GAP, FPS, visible/total object counts, pixel scale, assets/cache counters and controller latency.
2. **Instrument before optimizing:** distinguish sustained ~5–12 FPS from one-off GC/autosave hitches. Investigate browser-side/compositor/vsync cost that falls outside game-loop timers. Test image quality at native and reduced scale, preserving full-detail art as the reference; never claim 30–60 FPS from Node estimates.
3. **Optimize isolated measured bottlenecks:** eliminate redundant `w2s` for units, prefer explicit per-call output buffers over a globally aliased scratch array, pool/reuse world depth-sort entries where proven, avoid unnecessary descriptor spreads in `assetFrame` with correct invalidation, reuse selection membership for buildings, consider safe particle batching that retains alpha/colour/size, and review per-frame canvas state setting. Recheck visuals and FPS after each small patch.
4. **Bound procedural sprite cache `SPC`** with a pixel-budgeted LRU; review tinted-frame, painted troop, building-damage, terrain and resource cache budgets/hit rates on Xbox without sacrificing stone/gold/berry art, construction or team readability. Keep art manifest and offline cache integrity checks.
5. **Measure autosave blocking:** `JSON.stringify`, `localStorage.setItem` and verification are currently synchronous in RAF about every 60 seconds. Instrument first, then schedule/serialize safely if necessary; `setTimeout(0)` alone does **not** run work off the main thread. Preserve reliable current-version saves and background/foreground handling.
6. **Do not blindly clamp fixed-step accumulator** or skip simulation to hide frame drops; protect 30 Hz deterministic gameplay, replays and network pacing. Any work budget requires dedicated behaviour and timing tests.

### P2 — architecture, testing and controller parity

1. Continue **incremental cleanup**, not a rewrite: extract the dense `CIV` definition and research availability data from `engine.js` into a clearly ordered module, keep `index.html`, `scripts/runtime-sources.mjs`, service-worker/offline graph and browser/headless checks synchronized. Simplify compact code in `render.js`, `js/ui.js`, `js/input*.js`, save and AI in small reviewable PRs.
2. Consolidate confusing ownership (e.g., minimal `js/economy.js`) where tests show a safe boundary. Maintain a **single** active roadmap, compact `AGENTS.md` and refactoring inventory; preserve the 48 `AUD-###` and `CK-###` history. Remove only proven redundant Markdown/tests; increase real runtime/behaviour assertions instead of inflating counts with regex ownership tests.
3. Preserve Xbox reference button behaviour: A/context/box selection, RT radial, LB groups, RB minimap, View objectives, R3 villager priorities, LT modifiers and Y shortcuts. Add **group rally** on multiple production buildings and **waypoint queues** with documented LT chords without conflicting with existing commands; finish multiplayer R3/in-match commands, quick chat, full remapping and options for colourblind/high contrast and hold-vs-toggle. Hardware-verify focus/blur/neutral-until-release, disconnect, controller rumble, sector choices and selection on Xbox Edge.
4. Keep fast PR CI `--quick`/`--focused`, expensive isolated regressions, 3 skirmishes, 19 campaigns and Chromium weekly/manual. Introduce bounded save/network input fuzzing, deterministic replay tests, network concurrency/load and cross-browser behaviour only where they give actual coverage. Do not add expensive new weekly runners for routine tests.

### P3 — full gameplay, AI, civilizations, campaigns, graphics, DLC

1. **Gameplay reference parity:** verify gathering/drop-off/farms/fish traps/trade/tribute/herdables, Town Centre population and age requirements against authoritative version-specific references. **Preserve the legitimate Imperial Castle alternative** (`AG[3].single='castle'`): do not remove based on the dated audit's incorrect suggestion. Verify combat armour/counters, siege upgrade lines (Onager/Heavy Onager, Siege Ram, Petard), elevation, charging, projectiles, formations, garrisons, monks, victory modes and additional maps (e.g., Arena/Islands) and start modes (Empire Wars/Turbo).
2. **AI:** add paid/legal Castle/Imperial-era *additional Town Centres* with builder, stone-cost, expansion and cap tests; **starting `B.tc` currently has no cost** so a naïve `aiBuild(vil,'tc')` could create free TCs. Extend build orders, late-game resource management, scouting, defensive support, siege/monk/naval micro and map-specific path retry. Keep deterministic multi-seed skirmish tests; do not force march blindly through walls or retune a non-reproducing stale AI failure.
3. **Civilizations:** start from 26 partial entries and verify official 2026 roster; implement remaining base/DLC civilizations and era-specific rulesets, second unique techs, Elite UU upgrades, team bonuses, full tech restrictions/armour, architecture regions, regional units (Eagles/elephants/etc.) and balance. Add per-civ research and visual tests. **Return of Rome and Chronicles content may require distinct rulesets, not just medieval additions.**
4. **Naval:** expand beyond fishing/galley/transport/trade cog to fire and demolition lines, cannon galleons, unique ships, naval armour/research, fleet AI, reliable landing/navigation and water-map campaigns; test Xbox commands and large-fleet FPS.
5. **Campaigns:** after baseline 19 mission verification, add more powerful trigger/event scripting (ownership changes, diplomacy, create-at-location, timers, optional goals), mission progression, historical-inspired **original** scenarios, more diverse AI and DLC-themed campaigns; do not copy protected dialogue/cutscenes.
6. **Art/audio:** multi-direction unit movement/attack, villager work, deaths, regional building architecture, damage/construction/destruction and biome/coasts, relic interactions, projectile impacts, HUD art and accessible visual feedback. Retain all painted resources, original sound and platform memory limits. Use visual browser and Xbox acceptance.
7. **End-goal release:** all intended 2026 Xbox-available DLC families, finished economy/combat/AI/campaign/controller/naval/multiplayer, reliable saves, physical Series S Edge performance and controller acceptance, and actual current production deployment. A partial roster or passing Node test is never a release claim.

### P4 — multiplayer reliability and free-tier security

1. The existing **legacy Supabase marker/presence stack is not full multiplayer**; the advanced authenticated host-authoritative WebRTC/relay two-human preview is opt-in and **not** complete public multiplayer. Verify live connectivity before enabling it by default.
2. Prioritize authenticated match **reconnect/resume** (token/identity lifecycle, bounded missed-frame journal/checkpoint recovery, exact sequence validation and replay rejection). Then address host loss/migration, fallback for restrictive NAT where a genuinely free solution is available, full match to victory, additional player counts, spectators, Xbox in-match commands and chat.
3. Preserve strict command-size/ownership/fog validation, sender SID/role, host authority, private tokens, input hardening and safe Supabase public-key usage; host-authoritative design is **not** server-authoritative anti-cheat. Add adversarial protocol tests and network congestion/packet-loss cases.
4. The documented 100,000-message monthly application relay budget supports roughly **28 minutes** of 30 Hz frame-and-ACK traffic if used continuously; never design mandatory per-frame polling through Supabase RPC. Monitor free-tier messages/egress/Auth and fail closed on limits, no billing or paid TURN. Check WebRTC STUN-only connectivity limits and any off-origin relay security.
5. Deployment/security housekeeping: revision-aware Vercel check, current-run integration tests, service-worker no-secret/no-relay caching rules and bounded job times. Railway and Docker deployment were retired by the owner on 3 November 2026; do not restore them. Retain the local Node HTTP test harness required by browser and security regressions. Any external account/service closure is separate from GitHub file cleanup.

## New-chat launch checklist

1. Read **this section**, `AGENTS.md`, the remaining 48-task register below, `docs/REFACTORING_INVENTORY.md`, `FREE_HOSTING.md`, and `XBOX_CONTROLLER_PARITY.md`; inspect actual current code and status.
2. Identify the **highest uncompleted small P0** task, unless another urgent physical Xbox crash/blocker has appeared. Recheck GitHub `main`, PRs, CI and Vercel production SHA.
3. Implement a coherent batch, add/adjust **behavioural** regressions (prefer editing existing test files), run appropriate checks, merge a passing focused PR into `main`, and report actual commits, tests, and live deployment **separately**.
4. Do not request approval for routine incremental implementation. Do not authorize payments, paid infrastructure, force-push, protected-content copying or destructive deployment changes without permission.
5. Run: `node scripts/run-checks.mjs --quick`, `--focused`, `--regression-files`, `--skirmishes`, `--campaigns`, `--browser`, `--xbox-contracts` or `--full` as relevant. Headless/browser tests do not substitute for real Series S acceptance.

---

## Non-negotiable end goal

Original browser RTS with **full functional-category parity** for Age of Empires II: Definitive Edition on Xbox Series X, including **all 11 Xbox gameplay DLC families in the 31 October 2026 baseline**; every default Xbox controller action must function on **Xbox Series S Edge** in solo, campaigns, menus and multiplayer. Preserve the existing engine, art and security safeguards. No copied commercial assets, music or protected scenarios. Only confirmed free hosting, no paid upgrades, credits, overages or Railway reactivation; fail closed on quotas.

## Historical 31 October audit baseline — do not treat as current hosted status

| Workstream | Established at audited SHA | Acceptance still open |
|---|---|---|
| Local tests | Claude reports 219/219 standalone regressions passed and atlas validation succeeded locally | Latest-commit hosted and Xbox tests |
| GitHub Actions | Recent runs reportedly failed before job steps | Root cause unknown, green hosted jobs required |
| Civilizations, units, ages | 26 listed civs, core RTS loop works | Complete reference roster, bonuses, unique techs, unit lines |
| Campaign | 19 original missions run, automated outcome 7 wins / 7 losses / 5 timeouts | Human controller win paths, full scenario engine |
| Xbox controls | LS pan, RS zoom, A, RT radial, LB groups and other core paths exist | R3, View, X, LT, sector and multiplayer parity; physical acceptance |
| Multiplayer | Authenticated two-human WebRTC/host-validated preview | Independent-network match to victory, reconnect, player scale |
| Graphics | 47/47 current-roster movement/activity art; resources **stone, gold, berry bushes**; construction, fire and projectiles | Directions/death/work, factions, DLC and console FPS |
| Audio | Procedural Web Audio engine, buses and spatial panning | Resume quality, production event/audio coverage |
| Xbox Edge | Not physically benchmarked after later rendering changes | Controller, HUD, FPS, memory, suspend/resume |
| Hosting | Vercel free-only deployment policy, Supabase admission, Railway legacy records | Actual free quotas, live transport policy and account verification |

The historical 25 October ~4 FPS/613ms draw capture predates renderer changes; do not claim current FPS. 47/47 means *current troop art coverage*, not finished animation, gameplay or DLC. Past green CI at older SHAs proves neither this commit nor on-console acceptance.

## Ordered milestones and gates

1. **P0: Evidence and correctness (AUD-001–007).** Diagnose hosted Actions pre-step failures. Correct the First Hearth X-versus-A gathering guidance, apply civilization starting HP bonuses correctly, reproduce/fix gamepad refocus edge cases, record the first physical Xbox Series S baseline and establish a current Xbox reference/status matrix.
2. **P1: Controllers, independent multiplayer and data core (AUD-008–021).** R3 priorities, X context, View, LT waypoints, RT/LB sectors, accessible invite UI; prove one normal 1v1 win across separate networks; define lockstep fog threat model, packet loss/rejoin, Auth and quota failures; build validated per-civ, per-tech and regional-unit content schemas. Profile 50/150/200 and 800 mixed-unit scenes *before* a renderer rewrite.
3. **P2: Complete base mechanics (AUD-022–033).** Base civilizations, two unique technologies and restrictions, unit/armor classes, naval/siege, farms/extra Town Centres, AI, elevation/maps, original scenario triggers, complete controller-first tutorial, scalable multiplayer only after stable 1v1.
4. **P2: All DLC mechanics (AUD-034–040).** Lords of the West; Dawn of the Dukes; Dynasties of India; Mountain Royals; Three Kingdoms; Last Chieftains; Viking Sagas; Victors and Vanquished; Return of Rome; Chronicles: Battle for Greece; Chronicles: Alexander the Great. Implement original mechanical equivalents and campaign stories; separate antiquity/Chronicles rulepacks and model regional units/civ reworks.
5. **P2/P3: Art, audio and whole-product acceptance (AUD-041–048).** Original directional/work/death assets, regional building styles, consistent UI and accessibility, new soundtrack, SW/live security, Xbox Series S hardware soak and sign-off. Performance and hardware checks run **continuously**, not only at the end.

## Full 48-task live backlog

`AUD-###` is a new set of audit IDs; existing `CK-###` milestones retain their original meaning. All items below are **OPEN** unless subsequently closed with exact code/test/hardware evidence, and "open" does not imply the underlying system has no implementation.

IDs `AUD-###` are suggestions for the existing master register; **do not overwrite or silently renumber** existing CK tasks.

| ID | Priority | Task and affected files | Acceptance / dependency |
|---|---|---|---|
| AUD-001 | P0 · PARTIAL | Hosted GitHub Actions validation and weekly/manual acceptance | Push validation is operational (latest 928/928 focused, 5/5 quick). Earlier Sunday runs checked 19 missions and Chromium 2/2 at older revisions; a current full 247-file run, 3 seeded skirmishes and fresh Chromium/browser proof remain OPEN. Original pre-step service cause was not independently confirmed |
| AUD-002 | P0 · VERIFIED SOURCE | First Hearth A-versus-X gathering tutorial and control handler | First Hearth says A to select and gather and RT for commands; `039221d` executable campaign/controller VM checks match the live A-release handler and reject an X-only substitute. Physical Xbox mission acceptance remains separately OPEN |
| AUD-003 | P0 · PARTIAL | Starting civilisation HP reconciliation: `js/mapgen.js`, `js/entities.js` | `0db7e2b` + 923/923 hosted and later 925/925; initial Indian villager / Byzantine TC HP, repeat application, future production and new-game isolation verified in Node. Full civilisation matrix, save/load and physical Xbox acceptance OPEN |
| AUD-004 | P0 · PARTIAL | Harden Gamepad API focus, blur, visibility and silent disconnects: `js/input.js`, `engine.js` | `2a0f567` and `2a304b5`; 925/925 hosted assertions verify neutral-until-release with focus/tab changes and missing/explicit disconnect events. Real Xbox Edge refocus, radial/menu/placement continuity and controls parity OPEN |
| AUD-005 | P0 | Establish physical Series S baseline, capture saved reproducible scene and HUD | Preset 50/75/100, measured FPS/draw/sim, Xbox build/Edge version/controller video, no invented performance claims |
| AUD-006 | P0 | Publish current status and replace obsolete Railway links in README/server README | Current browser URL/transport/code SHA/test count and superseded docs unmistakable |
| AUD-007 | P0 | Create official reference feature register: data + docs | Every base/DLC/category/console binding has VERIFIED/PARTIAL/MISSING/UNVERIFIED disposition and citation |
| AUD-008 | P1 · PARTIAL | Guard AudioContext resume and UI cue recovery: `js/audio.js` | `c444bdd` + 921/921 hosted focused assertions verify throttling, hidden-tab silence, fresh UI sound and resumed music scheduling; Chromium audible output and Xbox Edge hardware acceptance remain OPEN |
| AUD-009 | P1 | Correct campaign acceptance: `tests/simulation-smoke.test.mjs`, `js/campaign.js` | No timeout/defeat misreported as a human win; each mission has feasible documented controller win path |
| AUD-010 | P1 | R3 priorities UI + worker automation: `js/input.js`, `js/ui.js`, `js/kingdom.js` | Seven presets, manual ratios, farm behavior, cancellation and paid orders match captured reference; Xbox proof |
| AUD-011 | P1 | Contextual X and View notification: `engine.js`, `js/input.js`, `js/ui.js` | No conflict with LB X group assignment; complete context matrix with Xbox evidence |
| AUD-012 | P1 | LT-held categories and waypoint tools: input, minimap and MP map | Exact Xbox gestures and data limits; no incorrect shortcuts |
| AUD-013 | P1 | Exact RT/LB wheel comparison and multiplayer Y build/train: input and network UI | Each official sector/gesture/confirmation available and host-validated, hardware recorded |
| AUD-014 | P1 | Controller-only multiplayer invitation entry: `js/network-lobby.js` | Can create, join and play via Xbox controller with no external keyboard/mouse |
| AUD-015 | P1 | Stabilize 1v1 natural victory over independent networks | One full match to normal terminal result with frame/hash/ACK evidence, no local-loopback substitution |
| AUD-016 | P1 | Define multiplayer fog/anti-cheat threat model | Explicit choice between trust-based full-world peers vs trusted state redaction and free feasibility |
| AUD-017 | P1 | Disconnect/rejoin, timeout, hash mismatch and frame stall protocol | Reconnect if safe; otherwise both clients terminate visibly without divergence; loss injection tests |
| AUD-018 | P1 | Review Auth relay expiry, quotas and NAT failure policy | Proven effect of 2h session on already-connected peers; fail-closed UX; no paid TURN enabled |
| AUD-019 | P1 | Data-driven civ schema and validator: `engine.js`, `js/config.js`, new `data/` | Existing civs unaffected; upgrades, bonuses, unique techs, team/regional units fully expressible |
| AUD-020 | P1 | Current Xbox civ and DLC baseline diff harness | Machine-readable reference version; no false completeness from a name or icon |
| AUD-021 | P1 | Benchmark large-army actual device before renderer redesign | Profile same-kind/mixed scenes and identify CPU, GPU, atlas, GC and path bottlenecks |
| AUD-022 | P2 | Nine missing base civilizations + bonuses and unique units | Each civ can complete a full skirmish; availability, AI, controller and art checks |
| AUD-023 | P2 | Second unique techs and complete civ restrictions | All effective tech trees, bonuses and age rules reference-diffed |
| AUD-024 | P2 | Full unit and armor-class upgrade trees | Separate tactical behaviour and visuals where needed, tiered cost/effect tests |
| AUD-025 | P2 | Expand naval line and dock tech | Fire/demo/cannon etc, pathing, transport/shore, AI and controller-only victory |
| AUD-026 | P2 | Siege, defensive structures and gates | Ram/siege tower/petard/upgrades, packed trebuchet, gate interaction; tests |
| AUD-027 | P2 | Multiple TCs, boar/sheep, farming and civ economy exceptions | Costs, prerequisites, ownership, auto-economy, pathing and save/load tested |
| AUD-028 | P2 | AI strategy and long-game reliability | AI ages, builds, scouts, spends and attacks; reproducible anti-stall benchmarks |
| AUD-029 | P2 | Map sizes, cliff/elevation and complete fog semantics | Performance + map-validity tests at Xbox reference sizes |
| AUD-030 | P2 | Advanced original scenario engine | Multi-faction triggers, cinematics/event categories, mission choices, controller presentation |
| AUD-031 | P2 | Full controller-first tutorials and accessibility | Every reference control explained accurately; usability-tested TV distances |
| AUD-032 | P2 | 3–4 human rooms after 1v1 proven | Admission/host ordering, scalable architecture and quota stress tests |
| AUD-033 | P2 | More multiplayer settings, diplomacy, replay/spectator where Xbox-supported | Reference comparison; fully controller accessible |
| AUD-034 | P2 | DLC wave I: Lords of the West + Dawn of the Dukes | Civs, unique buildings/effects, tech trees, AI, original scenarios, Xbox tests |
| AUD-035 | P2 | DLC wave II: Dynasties of India + Mountain Royals | Correct civ split, elephant/regional lines, mountain abilities, architecture, original scenarios |
| AUD-036 | P2 | DLC wave III: The Three Kingdoms + Last Chieftains + Viking Sagas | Civs, reworks, regional-unit access, original campaigns and UI |
| AUD-037 | P2 | DLC scenarios: Victors and Vanquished | 19 original mechanically equivalent scenario categories with advanced triggers and accessibility |
| AUD-038 | P2 | Separate `Return of Rome` antiquity ruleset | Independent unit/building/age/economy data, AI and original scenarios |
| AUD-039 | P2 | Separate Chronicles pack 1: Battle for Greece | Dedicated systems and campaign, testing distinct from medieval core |
| AUD-040 | P2 | Separate Chronicles pack 2: Alexander the Great | Three civs + 18 original scenario equivalents and campaign progression |
| AUD-041 | P2 | Complete unit direction/work/death/boarding graphics | Consistent scale/anchors/performance, originals, visual acceptance incl. DLC units |
| AUD-042 | P2 | Finish faction/age architecture and building impact/destroy states | Source catalogue, full art and native fallback tests; preserve current resource art |
| AUD-043 | P2 | TV HUD, icons, contrast, graphics preset/performance acceptance | Physical 1080p/TV checks, UI not blurred at 50% field preset |
| AUD-044 | P2 | Original full audio/music production and accessibility | Event matrix completed, bus mixing, no duplicated/late sounds on resume |
| AUD-045 | P2 | Service-worker, actual-origin and offline-upgrade validation | Consistent versions, integrity tests, restore after interrupted installs |
| AUD-046 | P2 | Final security/operational/asset-provenance review | No credentials in logs, free quotas respected, licenses for original assets, no paid dependencies |
| AUD-047 | P3 | Physical Series S whole-game acceptance | Complete solo/skirmish/campaign and MP tests, no keyboard/mouse, long soak |
| AUD-048 | P3 | Whole-product parity sign-off | All official Xbox gameplay categories and DLC rows verified or specifically identified as true platform impossibilities |

## Safe repository cleanup and refactoring sequence

**Avoid bulk deletion and whole-engine rewrites.** The README is now a current-status guide rather than a stack of dated graphic milestones, obsolete Railway play links and old test counts. Historical implementation evidence stays available through the dated register and Git history.

1. Inventory *actual* runtime entries: `index.html` scripts, `sw.js` cache dependencies, art manifests/generator inputs, browser and Node tests, GitHub Actions, Supabase/Node transports and Vercel deployment. Mark each file **active**, **historical**, **unused proven** or **uncertain**.
2. Audit suspected redundant code such as `CIV0` and legacy lobby/transport adapters by searching all runtime/test references and reproducing behavior. `multiplayer.js` is still part of the game shell; do not delete it merely because it includes older room code.
3. Refactor in **small, testable patches**, starting with schema-validated civ/unit/tech definitions, stable module responsibilities, better-structured controller gestures and explicit network adapters. Preserve **current-build** save/load correctness and safe rejection of incompatible older saves, Xbox button defaults, simulation correctness, original assets and free quotas; historical pre-release save migration is not required.
4. Remove old files, script paths or art **only after** dependency proof, replacement/compatibility checks, and updated `index.html`, service worker, generator manifests and tests. Never weaken a test simply to make cleanup pass.
5. Record exact commit and local/hosted CI evidence for every change. Physical Xbox acceptance and complete network matches remain independent gates; pre-step CI failures cannot be called successful runs.

## Working instructions and next steps

- Always check the latest `main` against the dated baseline, follow `AGENTS.md`, work directly on `main` with no force push, and run relevant local checks for code changes. Documentation-only work does not establish game correctness.
- **Immediate engineering order:** AUD-001 CI; AUD-002 First Hearth prompt; AUD-003 starting civ bonuses; AUD-004 held-button refocus; AUD-006 accurate README and baseline; AUD-005 real Xbox measurements; AUD-007/019/020 data/register scaffolding; AUD-010–018 controller/1v1.
- Label findings **VERIFIED**, **PARTIAL**, **MISSING**, **UNVERIFIED** or **BLOCKED**, with test/commit/source evidence. Do not convert reported bugs into facts without reproduction. Never invent Xbox default bindings; no fixed-point or WebGL overhaul without evidence.
- Update task acceptance/evidence **here**, append dated implementation checkpoints in `MASTER_AUDIT_AND_DELIVERY_REGISTER.md`; keep the source audit frozen as a historical evidence snapshot. Keep Xbox/DLC/reference entitlement version pinned and updated when verified.
