## 29 October 2026 — Bounded native troop palettes

**CK-032 / CK-041 remain PARTIAL.** Animated troop tinting now retains only requested native frames in a global 128 MiB nominal RGBA pixel budget. Image/palette identity and LRU eviction prevent stale or unbounded retained troop copies, and prepared crops draw without a second texture copy. Buildings/base fallbacks keep their established sampling; neutral resources are unchanged. Canonical source rectangles remain available as `sourceFrame`, with original dimensions/anchors/scale intact. No art/manifest bytes, gameplay, controls, saves or protocol changed; shell v42 refreshes code.

All 215 standalone files and full Chromium passed. The comparison matches 824,729,056 native components across 3,320 frame/palette cases and all tested scaled/mirrored established draw cases. It verifies the retained budget, eviction, zero warm small-roster allocations and unchanged checkpoints. Source/atlas/inventory checks, resource/wildlife/architecture/terrain and missing-image fallbacks pass. Nominal full motion sheets previously totalled 491.25 MiB per complete palette; the new 128 MiB retained frame budget is not a measured process/GPU/Xbox saving, and exhaustive tests evict frames. Large-scene hit rates, corpse/effect/filter acceptance and physical Xbox remain open. See [scope and limits](docs/BOUNDED_TROOP_TINTS.md) and [verification](docs/verification/frame-tints-2026-10-29.json). Tint-cache runtime `582314faff054019156d00f7c19a1843f1f6c40f` is verified live: all 64 production SHA-256 comparisons match source, including both renderers, asset manager, worker, catalogues and all 58 active images. Vercel reports success. The three changed code files were rechecked after production became ready. Hosted runs 40956570706 / 40956570376 / 40956570469 fail before steps, with cause unverified; local passes are not a hosted CI pass. Actual-origin browser and Xbox hardware acceptance remain open.

## 29 October 2026 — Four original Town Centre age designs

**CK-032 / CK-041 remain PARTIAL.** Town Centres progress from a timber meeting hall to larger half-timber/stone civic halls, with open verandas/loggias and team cloth/flags. The shared age selector supports both houses and Town Centres, retains only observed non-player ages and falls back to original art. Visual observations are not saved; existing building fog/removal, controls, queues, training, research and attacks remain unchanged. This is shared architecture, not a complete faction set.

All 214 standalone files and the full Chromium graphics suite passed. Tests cover all ages/palettes in both actual draw paths, observation/fallback and unchanged checkpoints. Blue/red 1×/2× views were inspected. Nine packers reproduce 74 files; earlier WebPs are unchanged. Source/57-atlas/inventory checks pass; shell v41 verifies 58 images. See [scope](docs/PAINTED_TOWN_CENTRE_AGES.md), [built-in prompt](docs/painted-town-centre-age-prompts.json) and [verification](docs/verification/town-centre-ages-2026-10-29.json). Native/padded house dimensions are corrected to measured 1254/1510; no image changed. A nominal atlas/tint pixel audit motivates actual allocation/padding work before many further sheets, and does not establish resident/GPU memory or Xbox FPS. Town Centre runtime `54e53ec1bb41f2625160463393275d324c00dc6e` is verified live: all 63 production SHA-256 comparisons match (both renderers, worker, catalogues and all 58 active images). Vercel reports success. Hosted runs 40953428382 / 40953428432 / 40953428253 fail before any steps, with cause unverified; this is not a hosted CI pass. Behavioral Chromium evidence remains local, and actual Xbox acceptance is open.

## 29 October 2026 — Four original house-age designs

**CK-032 / CK-041 remain PARTIAL.** Houses now change from a simple thatched dwelling through half-timber/stone homes to a two-storey Imperial home. Both actual views use the same age selector, team palette and original-house fallback. Solo records enemy appearances only under current sight; team-relative projection includes age appearance only for owned/visible houses. Hidden advances do not select new art. A presentation WeakMap adds no save or simulation fields; original building fog/removal behavior remains unchanged.

All 213 regression files passed after updating and rerunning two old selector/version assumptions. Full Chromium passed after correcting the partial-image-failure atlas count. The new fixture checks all ages/teams, both actual draw paths, hidden-age retention, fallback and unchanged checkpoints. Blue/red 1×/2× contact sheets were inspected. Eight packers reproduce 72 files byte-for-byte; earlier WebPs are unchanged. Source/56-atlas/inventory checks pass. Shell v40 has 57 content-verified images. These shared house designs do not complete faction architecture or other building ages, dedicated construction/damage states, Xbox hardware or the broader overhaul. See [scope](docs/PAINTED_HOUSE_AGES.md), [exact built-in prompt](docs/painted-house-age-prompts.json) and [verification](docs/verification/house-ages-2026-10-29.json). House runtime `1486d0f8613b93ecd4e786571bdc2809970d9197` is verified live: all 62 production SHA-256 comparisons match (both renderers, worker, revision catalogue, atlas manifest and all 57 active images). Vercel reports success. Hosted runs 40952160693 / 40952160568 / 40952160546 failed before steps; cause unverified. Behavioral Chromium checks are local; production content matches do not establish Xbox hardware or actual-origin browser acceptance.

## 29 October 2026 — Verified offline artwork cache reuse

**CK-032 / CK-041 remain PARTIAL.** Shell v39 verifies content hashes before reusing the 56 active images from older shell caches. Changed or damaged art is fetched and verified; failed installation preserves the working cache. Code/metadata refresh, offline fallback and private-request exclusions are retained. All seven active art packers refresh the catalogue automatically, and source validation rejects stale hashes.

All 212 standalone files, the complete Chromium graphics suite and source/atlas/inventory checks passed locally. The isolated browser update fixture reduced artwork requests from 56 to two for one changed and one damaged image, verified all 56 cached bodies, preserved the working controller on failure, recovered with one request and reused every image on a code-only shell generation. Offline shell/code/art and private bypass passed. Seven packers reproduced 70 files byte-for-byte; all earlier asset WebPs are unchanged. These are controlled local request counts, not production byte savings or Xbox performance. See [implementation and limits](docs/VERIFIED_ART_CACHE.md) and [verification](docs/verification/art-cache-2026-10-29.json). Runtime `1192420eeee4ca9213d53d8107ca017ad406da96` is live: all 59 SHA-256 comparisons match (worker, catalogue, atlas manifest and every active image), and Vercel reports success. Hosted runs 40950216172 / 40950216101 / 40950216138 failed before any steps; cause unverified. Actual-origin browser installation was not accepted because this runtime browser rejected the required proxy certificate; TLS verification was not disabled. Local real-worker browser checks passed.

## 29 October 2026 — Observed low-supply stone, gold and berries

**CK-032 / CK-041 remain PARTIAL.** Stone/gold deposits now become lower piles, and berry bushes show fewer berries, for positive remaining quantities of 40 units or less. Two neutral geographic variants of each kind retain the original materials and smaller physical footprints. The threshold is literal quantity, not percentage. Solo uses only current sight or cached observations; the team-relative view uses projected/remembered amounts. Hidden ongoing consumption does not change these visual stages. Unknown observations and failed new images retain full original art. Quantities, gathering, removal, fog rules, controls and saves are unchanged.

All 211 standalone files, source/55-atlas/inventory checks and the complete Chromium battlefield suite passed. New actual-render tests cover full/hidden-low/observed-low/hidden-lower stages for all three resources in both views, a no-sight projection, six distinct neutral images, full-art fallback and unchanged node/world checkpoints. Full/scarce 1×/2× comparisons were inspected. Five authoring packers rebuild byte-identically; all earlier WebP hashes are unchanged. Shell v38 includes the new image. See [artwork and limits](docs/PAINTED_SCARCE_RESOURCES.md), [exact prompt](docs/painted-scarce-resource-prompts.json) and [verification](docs/verification/scarce-resources-2026-10-29.json).

The solo observation cache does not add persistent resource-memory fields to legacy saves, and existing depleted-node removal is unchanged. Physical Xbox review and broader directions/work/death, architecture, effects and interface work remain open in the [whole-game checklist](docs/GRAPHICS_OVERHAUL_CHECKLIST.md). Low-supply resource runtime `f8d81c9af80831b12f54d0459433232a5b8eb446` is verified live: all five renderer/manifest/shell/image SHA-256 values match source. Vercel reports success. Hosted GitHub jobs fail before any steps; local passes are not a hosted CI pass.

## 29 October 2026 — Neutral deer and fish idle motion

**CK-032 / CK-041 remain PARTIAL.** Deer now have eight standing ear/head/grazing/tail poses, and fish shoals have eight fin/tail poses. Both actual draw paths use paused game time with stable geographic phase offsets. A fixed reference width keeps pose-bound changes from rescaling the animals, and small cached textures remain shared. Neutral colours, original static fallback, resource mechanics, fog, commands, controls and saves are preserved. Previously committed WebP hashes are unchanged.

All 211 standalone files passed after updating and rerunning the former static-environment assumption. Source/54-atlas/inventory checks, byte-identical wildlife/fishtrap/base/motion rebuilds and the complete Chromium battlefield suite passed. Focused checks decode all 16 poses, confirm both draw paths receive the actual world clock, test pause/advance, neutral images, fixed scale and failed-image fallback, and preserve node/world checksums. The 1×/2× contact sheet was inspected. Stone, gold, berries and fish traps still pass their checks. Shell v37 includes the two new images. See [artwork and scope](docs/PAINTED_WILDLIFE_MOTION.md), [exact original/correction prompts](docs/painted-wildlife-motion-prompts.json) and [verification](docs/verification/wildlife-motion-2026-10-29.json).

Physical Xbox acceptance, depletion art, dedicated directions/work/death states, architecture, effects and interface work remain in the [whole-game checklist](docs/GRAPHICS_OVERHAUL_CHECKLIST.md). Wildlife runtime `6b0298b07af8b8c24246bb1e5f375c9a727d179d` is verified live: all seven renderer/asset/manifest/shell SHA-256 values match source. Vercel reports success. Hosted GitHub jobs fail before any steps; this is not a hosted CI pass.

## 29 October 2026 — Painted fish traps

**CK-032 / CK-041 remain PARTIAL.** Four original neutral wicker/net fish-trap variants now render in solo and team-relative multiplayer views. Variants depend only on position, retain natural colours and use small cached textures; missing images retain the procedural trap. Existing ownership, gathering, replenishment, fog, economy, commands and saves are unchanged. All previously committed WebP hashes remain unchanged.

Source/52-atlas/inventory checks, all 211 standalone files and the complete Chromium battlefield suite passed locally. New browser checks confirm four distinct transparent variants, actual drawing in both renderers, missing-image fallback and unchanged node/world state. The 38/76/114-pixel comparison was inspected. Fish-trap, base and motion rebuilds are byte-identical. Stone, gold and berry checks still pass. Shell v36 includes the new image. See [artwork and scope](docs/PAINTED_FISHTRAPS.md), [exact prompt](docs/painted-fishtrap-prompts.json) and [verification](docs/verification/fishtraps-2026-10-29.json). Physical Xbox review and the broader overhaul remain open.

After the environment returned, the prior 47-unit runtime was independently matched against its committed renderer, manifest, shell and all eight new elephant/siege images (11 exact Git blob comparisons). Fish-trap runtime `ce68cffdd3a8ce1b532ef7a13177381ce20640a3` is verified live: renderer, manifest, shell and image SHA-256 values match source. Vercel reports success. Hosted GitHub jobs again fail before any steps; this is not a hosted CI pass.

## 29 October 2026 — Complete current-roster motion artwork

**CK-032 / CK-041 remain PARTIAL; all 47 current playable kinds now have painted movement/activity sheets.** Elephant Archer, War Elephant, Battering Ram, Bombard Cannon, Trebuchet, Mangonel, Scorpion and War Wagon gain sixteen-pose sheets and matching ready poses. Reviewed strike/release cells start the cooldown-driven action cycle. Existing foot/cavalry/vehicle envelopes, four team colours, pause and original-art fallback remain; cart and war wagon overlays now use vehicle dimensions. Gameplay, commands, controller bindings and save fields are unchanged, as are all earlier WebP object hashes.

All 211 standalone files, source/51-atlas/inventory checks and the complete Chromium battlefield suite passed locally. The new helper decodes 512 samples across eight kinds/four colours, verifies eight distinct poses per sequence, selected impact cells, pause and actor/world checksum isolation. The 128-pose packed sheet was inspected. Both manifests and every motion WebP reproduce byte-for-byte on a no-argument rebuild. Stone, gold and berry resource checks still pass. Shell v35 includes all eight assets. See [artwork and scope](docs/PAINTED_SIEGE_ELEPHANT_MOTION.md), [exact prompts](docs/painted-siege-elephant-prompts.json) and [verification](docs/verification/siege-elephant-motion-2026-10-29.json).

47/47 is current-roster art coverage, not eight independent directions or a finished graphics overhaul. Work/death art, activity-event integration, faction/age architecture, effects, interface and physical Xbox Series S Edge acceptance remain in the [whole-game checklist](docs/GRAPHICS_OVERHAUL_CHECKLIST.md). New gameplay/DLC entries need their own artwork. Runtime `0af33396f6d42ca8319a939328b60337c793db4d` is committed and Vercel reports a successful deployment. Exact live-file comparison remains pending because the execution environment became unavailable. Hosted GitHub jobs again failed before any steps; the 211-file and full-browser passes are local evidence.

## 29 October 2026 — Naval and civilian motion artwork

**CK-032 / CK-041 remain PARTIAL; painted movement/activity art coverage is 39/47.** Fishing Ship, Galley, Transport, Trade Cog, Trade Cart and King gain sixteen-pose sheets and ready poses. Fishing work uses actual gathering state; boarding/cargo/greeting action art is prepared, with dedicated event triggers still open. Existing team colours, pause, vehicle scale and base-art fallback remain. Earlier WebP hashes are unchanged; simulation, economy, passengers, commands and controls are unchanged.

Source/43-atlas/inventory checks, all 211 standalone files (two stale count/version expectations corrected and rerun), and the complete Chromium battlefield suite passed locally. New checks decode 416 frame samples across four colours, verify all eight poses per sequence and preserve actor/world checksums. The packed 96-pose contact sheet was inspected, and a no-argument rebuild is byte-identical. Stone, gold and berry resource checks still pass. Shell v34 includes all six assets. See [authoring/event limits](docs/PAINTED_CIVIC_NAVAL_MOTION.md), [prompts](docs/painted-civic-prompts.json), [verification](docs/verification/civic-motion-2026-10-29.json) and the [whole-game checklist](docs/GRAPHICS_OVERHAUL_CHECKLIST.md). Eight elephant/siege motion types and the broader graphics/hardware acceptance work remain open. Runtime `902b80ff96176af454a49c2ab56ccee6d678cadf` is verified live: the manifest, shell and all six images match source SHA-256 values. Vercel reports success. Hosted GitHub jobs fail before any steps; local verification does not establish a hosted CI pass.

## 29 October 2026 — Six cavalry sets and bounded terrain blending

**CK-032 / CK-041 remain PARTIAL; motion coverage 33/47.** Mangudai, Cataphract, Conquistador, Boyar, Tarkan and Magyar Huszar gain eight strides and eight weapon-action poses with ready poses. Mounted scale, team cloth, paused stride, cooldown phase and original-art fallback are preserved. Conquistador imagery/overlays now depict its already-classified mounted role. Explicit authoring preserves disconnected hoof parts in two sheets and full long weapons. Earlier WebP object hashes are unchanged; gameplay, save fields, commands and controllers are unchanged.

The team-relative terrain cache now retains display-appropriate oversampled blends within the same 4 MiB pixel budget and culls off-viewport tiles/resources. In an isolated fully explored Golden Coast fixture, the old path creates 34,240 canvases over 20 refreshes; the warmed updated path creates zero and retains 736 blends/753,664 pixels. Native solo terrain remains 64 pixels. Mean RGB difference is 1.210/255 in the inspected coastal comparison. The ordinary fixture also fits the old cache; its smaller-texture benefit is not described as churn elimination. No picture preset, canvas resolution or HUD change is included.

All 211 standalone files, source/inventory/37-atlas checks and the complete Chromium graphics suite passed locally. New checks decode 384 cavalry action samples across four colours, preserve actor/world checksums and verify scale/pause/impact. The no-argument rebuild is byte-identical, and the packed 96-pose sheet was inspected. See [authoring and cache details](docs/PAINTED_HORSE_MOTION.md), [prompts](docs/painted-horse-prompts.json) and [verification](docs/verification/horse-motion-2026-10-29.json). Shell v33 includes the new assets. Fourteen motion types, directions/death art, faction architecture, effects/interface art and physical Xbox acceptance remain open in the [checklist](docs/GRAPHICS_OVERHAUL_CHECKLIST.md).

## 29 October 2026 — Four more painted troop animation sets

**CK-032 / CK-041 remain PARTIAL; motion coverage 27/47.** Chu Ko Nu, Hand Cannoneer, Camel Rider and Mameluke gain eight walking and eight weapon-action poses with matching ready poses in both renderers. Foot/cavalry reference scales, existing team recolouring, cooldown release timing, paused stride and original-art fallback remain. The Camel Rider's full spear uses wider authoring padding, preserving its tip without cropping. Default/earlier packing remains unchanged. Combat, projectiles, controllers, simulation and saves are unchanged; all earlier WebP Git hashes remain unchanged.

All 211 standalone regression files, source/inventory checks, 31-atlas validation and the complete Chromium graphics suite passed locally. Focused new tests decode 256 samples across four kinds/four colours, verify pause and impact/release phase, preserve actor/world checksums and check cavalry body scale. Existing coverage now includes 224 motion lookups and 86 decoded action/team sequences with eight distinct poses. Both packed 32-pose contact sheets were visually inspected. The no-argument motion rebuild reproduces the four new sheets/manifests unchanged. Shell v32 includes all four assets.

See [artwork and authoring](docs/PAINTED_RANGED_AND_CAMEL_MOTION.md), [foot-troop prompts](docs/painted-crossbow-gun-prompts.json), [camel prompts](docs/painted-camel-prompts.json) and [verification evidence](docs/verification/ranged-camel-motion-2026-10-29.json). The [whole-game checklist](docs/GRAPHICS_OVERHAUL_CHECKLIST.md) now lists 20 remaining troop animation sets plus directional/death art, faction buildings, effects, interface graphics and physical Xbox acceptance. Production requires separate deployment verification; local tests do not establish hosted CI or Xbox acceptance.

## 29 October 2026 — Plumed Archer and Gbeto painted motion

**CK-032 / CK-041 remain PARTIAL; motion coverage 23/47.** Plumed Archers and Gbetos gain eight walking and eight firing/throwing poses, with matching ready poses in both renderers. Their blue-feather/archery and white-headwrap/throwing-blade identities, team colours and foot-unit scale remain coherent with existing art. Paused game time freezes movement; cooldown phase starts at release and follows through recovery. Missing motion sheets retain original base artwork. Combat, projectiles, controllers, simulation and saves are unchanged; all previous WebP Git hashes are unchanged.

Local validation passed all 211 standalone regression files, source/inventory checks, 27-atlas validation and the full Chromium battlefield suite. New four-colour tests decode 128 action samples, with eight distinct poses per sequence, and preserve actor/world checkpoints while verifying pause and release phase. The packed 32-pose contact sheet was visually inspected; the no-argument motion rebuild is byte-identical. Both packers retain all 23 motion kinds; shell v30 includes the new sheets.

See [artwork and authoring](docs/PAINTED_LIGHT_MISSILE_MOTION.md), [exact prompts](docs/painted-light-missile-prompts.json) and [verification results](docs/verification/light-motion-2026-10-29.json). The [whole-game checklist](docs/GRAPHICS_OVERHAUL_CHECKLIST.md) now lists 24 remaining troop motion sets plus directions/death art, faction buildings, effects, interface graphics and physical Xbox acceptance. The initially blocked Janissary/Genoese release was subsequently verified live as v8/25 atlases; this new increment requires its own production verification.

## 29 October 2026 — Janissary and Genoese Crossbowman painted motion

**CK-032 / CK-041 remain PARTIAL; motion coverage 21/47.** Janissaries and Genoese Crossbowmen gain eight walking and eight firing/loading poses, plus matching ready poses, in both renderers. Their original character identities, foot-unit scale, team colours and base-image fallback remain. Game time freezes stride while paused; existing cooldown phase starts at the firing/release pose. No combat stats, projectiles, simulation fields, save formats or controller mappings change. Original terrain, buildings, resources, environment and earlier motion WebPs are unchanged.

All 211 standalone regression files, source validation, 25-atlas validation and the complete Chromium graphics suite passed locally. New four-colour raster checks decode 128 action samples with eight distinct poses in each sequence, verify firing/paused presentation and preserve actor/world checkpoints. The 32-pose packed contact sheet was visually inspected. The no-argument motion rebuild reproduces the new images and manifests byte-for-byte. Both authoring packers retain all 21 motion kinds; the checklist/audit script now generates and validates both human and JSON inventories. Shell v29 refreshes the new assets.

[Artwork and authoring evidence](docs/PAINTED_RANGED_EXPANSION.md), [exact prompts](docs/painted-ranged-expansion-prompts.json) and [verification results](docs/verification/ranged-motion-2026-10-29.json) record the increment. The [whole-game checklist](docs/GRAPHICS_OVERHAUL_CHECKLIST.md) still tracks 26 troop animation sets, independent directions/death art, faction architecture, effects, interface graphics and physical Xbox Series S Edge acceptance. The full graphics overhaul is not complete.

## 29 October 2026 — Environment artwork and whole-game graphics checklist

**CK-032 / CK-041 remain PARTIAL.** Both battlefield renderers now use new original painted deer, fishing shoals, pine/oak/birch trees and relics. Stone, gold, berries and existing farm art are retained. Neutral colours, stable tree variants and bounded-height trees share the small resource texture cache. Relic drawing follows visible carrier coordinates without simulation writes; the multiplayer view excludes hidden/garrisoned relics and copies only current-sight coordinates. Assets failing to load retain procedural fallback. Fish traps still use their existing basket art.

The [complete graphics checklist](docs/GRAPHICS_OVERHAUL_CHECKLIST.md) tracks all current visual categories, including units, buildings, resources, terrain, effects, HUD/menus, multiplayer and Xbox acceptance. Its generated inventory enumerates all 47 playable troops and 22 buildings. Base art coverage does not establish completed motion: 19 troops have painted walking/attack sequences; 28 still need them, plus independent directions and dedicated death art. Faction architecture, effects, interface artwork and hardware acceptance remain open.

Local verification: 211 standalone files, source validation, 23-atlas validation and the complete Chromium battlefield suite passed. New coverage checks six distinct transparent neutral environment silhouettes, tree height bounds, wildlife/fish exclusions, complete multi-object sprite packing, current-sight relic projection and unchanged world checkpoints. The original palettes, fallback, cache upgrades, resource/terrain transitions and viewport checks remain green. [Authoring/provenance](docs/PAINTED_ENVIRONMENT.md) and [verification evidence](docs/verification/painted-environment-2026-10-29.json) record the increment. Shell advances to v28; no multiplayer command protocol, controller, simulation or hosting plan changes. Physical Xbox and full graphics-overhaul acceptance remain unfinished.

## 29 October 2026 — Painted stone, gold and berry bushes

**CK-032 / CK-041 remain PARTIAL.** New original painted resource artwork replaces the simple stone, gold and berry placeholders in both battlefield renderers, with two stable geographic variants per resource. Natural grey rock, gold ore veins and red fruit bypass team recolouring. The existing small texture cache is reused; zooming the multiplayer map reuses a fixed-size resource crop. Missing art retains procedural fallback. Farms, fish and hunted animals remain excluded from berry artwork; no resource amounts, gathering, placement, collision, commands or controller mappings change.

Local verification: all 210 standalone regression files passed, source validation and all 22 atlases passed, and the complete Chromium graphics suite passed. New checks cover six distinct transparent raster silhouettes, neutral palettes, stable variants, exclusions, absent asset-manager fallback and unchanged world checkpoints. HTTP coverage includes the new WebP; resource metadata rebuilds reproduce the manifest. The 54/108-pixel resource contact sheet was visually inspected. See [artwork, exact generation prompt and authoring](docs/PAINTED_RESOURCES.md) and [verification evidence](docs/verification/painted-resources-2026-10-29.json). Offline shell advances to v27. Physical Xbox image/performance, full directional motion and remaining overhaul acceptance stay open.

## 29 October 2026 — Textured terrain transitions

**CK-032 / CK-041 remain PARTIAL.** Original painted grass, soil, shore and water now blend across cardinal tile edges in the isometric battlefield and the team-relative multiplayer map. Narrow wet edges retain readable coastlines; wider soil blends soften the repeating tile diamonds. Tile interiors retain their original texture. The multiplayer view derives terrain and neighbors exclusively from that player's remembered terrain, leaving unknown neighbors unblended. No movement, water flags, fog rules, simulation state or controller behavior changes.

Blends are native 64-pixel texture composites reused by the existing solo terrain chunks and viewport cache. The texture LRU holds at most 256 tiles (4 MiB RGBA, excluding temporary generation surfaces); new terrain-image identity invalidates it. Missing canvases fall back to the original unblended artwork. Shell v26 refreshes returning clients.

**Local validation:** 208 existing standalone regression files plus the new two-case terrain test passed (209 files total). Source and all 21 atlases validated. The complete Chromium graphics suite passed, including synthetic raster samples for all four blend directions, unchanged tile centers/opposite edges, texture reuse/bounds/image replacement, unchanged world checkpoint and nine pixel-identical viewport-cache comparisons. The before/after contact sheet was visually inspected in both projections. [Machine-readable evidence](docs/verification/terrain-transitions-2026-10-29.json) records covered checks and source hashes. These checks do not establish physical Xbox frame budgets or completion of the graphics overhaul.

Next graphics priorities: expand the remaining 28 units beyond base-pose motion, improve directional silhouettes and faction architecture, and review large land/naval scenes on Xbox Series S Edge. Prior campaign and hosted-CI limitations below remain open.

## 29 October 2026 — Connected campaign fleets and working primary-sea dock exits

**Verified code: [`c2f68c46fbfcea08ee5e524aeb100436e54aff85`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/c2f68c46fbfcea08ee5e524aeb100436e54aff85).** The source fingerprints, 208-file regression run, focused checks, Chromium proof and 19 mission results below refer to this runtime.

**CK-019 / CK-022 remain PARTIAL; naval opening defect corrected.** Golden Coast's seeded starting navies previously occupied separate 36-tile ponds despite a 1,626-tile main navigable sea. Campaign starting fleets and naval raids now select positions in the largest currently ship-navigable water region. The placement-only flood fill matches actual ship routing: resources block water, shallow passages are usable, and blocked diagonal corners cannot be crossed. It recomputes on demand, so harvesting a fish obstacle can reopen a passage without a stale region cache or new saved state. It does not run in the frame loop or move already existing ships.

Scripted campaign docks use that sea, preferring shores with at least four navigable adjacent slots while retaining a narrow-shore fallback. Their old 16-tile placement radius could not reach the main sea; scripted dock search now selects the nearest valid site on the correct shore. The development-only campaign player also checks explored, buildable primary-sea shore and a real villager route when choosing a Dock. Valid dock candidates are collected once per decision and reused across workers, avoiding repeated full-map validation. Actual construction costs, production legality, mission objectives, starting budgets and assertions are retained.

Fresh Golden Coast and The Strait's Last Relic openings now retain their original Galley counts (2/3 player and 3 opponent respectively), place every Galley on the main sea and pass real ship path searches between all fleets. Both scripted enemy docks have primary-sea access and a free production exit after the starting fleet is placed. Regions and positions survive a current save/load round trip. Mixed land/naval raid checks confirm distinct new ship slots, actual paths and hostile attack orders. [Connectivity and save/browser evidence](docs/verification/naval-connectivity-2026-10-29.json) records positions, sizes, free exits and source fingerprints.

**Local verification:** all **208 standalone files** passed on the final source; source and 21-atlas checks passed; 15 focused naval/water/safety cases passed. The complete Chromium battlefield suite also passed, including actual Golden Coast setup/rendering, mutually reachable fleets, a free enemy Dock exit and unchanged simulation checksum after inspection/drawing. Existing terrain, original art, fog, team colour and fallback checks remain green. No physical Xbox performance or controller acceptance is inferred. Campaign-only spawn/setup changes do not change the multiplayer command protocol; the offline shell advances to v25.

**Production verification:** the existing Vercel game returned byte-identical `js/campaign.js` and `sw.js` for code `c2f68c46fbfcea08ee5e524aeb100436e54aff85`, and its deployment status is success. Hosted [source validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40830481650), [Chromium](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40830481649) and [regressions/campaigns](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40830481680) again failed before any test steps executed. The passing results above are local evidence; no hosted CI pass is claimed.

All **19 real scripted campaign runs** were repeated: **7 victories, 7 defeats, 5 timeouts and zero failing assertions**. Golden Coast now reaches a real defeat at **862.7 simulated seconds** instead of stalling at its 1,200-second test limit. Its existing assertion already accepted either victory or defeat and was not relaxed. This establishes removal of the tested connectivity/timeout defect, **not** Golden Coast victory acceptance or full campaign completion. [Per-mission results](docs/verification/campaign-2026-10-29.json) supersede the earlier current summary; older evidence is retained.

**Next campaign work:** win-capable coverage for the remaining missions, including Golden Coast's land army/housing/production plan, the five tolerated timeouts, and controller-driven naval production and combat. Map variants beyond the two coastal openings, naval balance, complete human campaign wins and console hardware gates remain open. Existing saved fleets keep their positions; start a new coastal mission to use the corrected opening.

---

## 28 October 2026 — Prevent construction from trapping units; Golden Coast naval diagnosis

**Verified code: [`c641c072d882f877daecdad8b8958b75f49faf7b`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/c641c072d882f877daecdad8b8958b75f49faf7b).** Local check evidence below applies to this exact runtime and unchanged campaign harness.

**CK-016 construction defect corrected, wider movement acceptance still PARTIAL.** A production reproduction placed a House on a living villager's tile: `okPlace` returned true, `addB` made that tile solid, and the worker's next path search returned null. The same problem affects farms. Shared placement validation now rejects footprints containing a living ungarrisoned unit of either kingdom. Dead units and loaded passengers do not block placement, and footprint boundaries follow tile ownership exactly. The existing solo A confirmation and authenticated construction both use this guard. Rejection spends no resources, allocates no entity and changes no orders; construction succeeds normally after the unit clears the footprint. This prevents new entrapment; it does not relocate units from already trapped saved worlds. No full reference-fidelity claim is made for this placement policy.

Four targeted production tests exercise farms/buildings, boundary positions, foreign/dead/garrisoned occupancy, actual solo confirmation, a remaining valid exit route and atomic paid multiplayer construction for both teams. All **207 standalone regression files** passed locally, plus source/21-atlas validation and the local Chromium battlefield suite, including nine unchanged-terrain pixel comparisons. A final focused run passed **41 placement/economy/session/WebRTC unit cases**. The real Chromium peer-transport fixture separately timed out during ICE gathering before an offer was recorded; no successful local live-WebRTC or independent-network acceptance is claimed. Hosted CI remains a separate gate.

Production source verification on 28 October returned byte-identical simulation/session/WebRTC files from the existing Vercel URL, and its deployment status is success for code `c641c072d882f877daecdad8b8958b75f49faf7b`. Hosted checks for this code again failed before test steps executed; local evidence is not a hosted CI pass.

Because shared placement legality changed, session and WebRTC channel compatibility advance to **ck-live-preview-13** and shell cache to v24. The former protocol 12 is explicitly tested as incompatible. Both humans must refresh before starting a new multiplayer room. Save formats, entity fields and controller bindings are unchanged.

All 19 actual scripted mission runs were repeated on the corrected runtime: **7 wins, 6 defeats, 6 timeouts, 1 strict failure**. Golden Coast still times out after its dock/fleet objectives, so it is **not accepted**. The final campaign test-player file remains exactly the previous main version; exploratory economy/army changes are not shipped. Current results and runtime SHA-256 fingerprints are in [campaign evidence](docs/verification/campaign-2026-10-28.json).

A fresh production Golden Coast opening (seed 913, 96×96 map) confirms both starting navies are placed in separate **36-tile** traversable water pockets; the map's largest navigable water component contains **1,626 tiles**. An actual production path search from the player's starting Galley to the enemy fleet fails. The naval spawn helper currently limits candidates to within 18 tiles of a Town Centre/Dock without checking shared water connectivity. [Naval diagnostic evidence](docs/verification/golden-coast-naval-diagnostic-2026-10-28.json) records exact positions, component IDs/sizes and path result. This does not establish that the mission is unwinnable by a human. **Next naval task: ensure campaign fleets and the scripted Dock site use the intended navigable water body, then revalidate paid production, army composition and all mission objectives.**

---

## 28 October 2026 — Standing approval and campaign scripted-economy corrections

The owner explicitly asks to keep building through the roadmap, treating routine follow-ups as “yes” and “continue”. This standing authorization is recorded in AGENTS.md; routine implementation, relevant validation, evidence updates and main commits do not need repeated confirmation. Existing free-only hosting, controller, simulation and asset constraints still apply.

Campaign verification improved from **4 wins / 7 defeats / 8 timeouts / 3 strict failures** to **7 wins / 4 defeats / 8 timeouts / 1 strict failure**, with all 19 missions actually rerun. Newly verified scripted victories: **The Feudal Frontier (744.5 simulated seconds), Crossing at Redwater (480 s), and The Bridge at Blackwood (480 s)**. The remaining strict failure is **The Golden Coast**, which times out at 1,200 simulated seconds after completing its dock and three-galley objectives. Other tolerated defeats/timeouts remain open acceptance work; 18 zero exit codes do not mean 18 campaign wins.

Corrections are to the development-only scripted player: repeated gather decisions retain live work, cargo and return trips; build-site search tries other available villagers when the nearest one has no route; construction is serial so simultaneous foundations do not block narrow approach routes; Feudal Frontier builds its paid second Feudal prerequisite and assigns wood/stone workers; bot decisions run once per simulated second while the real game still ticks at 30 Hz. The shared gathering helper includes normal stone-gather orders. Five targeted regressions check cargo, return-route and resource-order preservation.

No mission objective, starting resource budget, difficulty, assertion or production gameplay rule was weakened. Source validation, the standalone simulation checks and the five bot-economy regressions pass. Exact harness SHA-256, all 19 outcomes/objective counts and the previous summary are in [current campaign evidence](docs/verification/campaign-2026-10-28.json); the previous full run remains in git history. Runtime remains the existing main gameplay code. Physical controller playthroughs and hosted CI acceptance remain separate gates. **Next priority: diagnose Golden Coast’s remaining economy, production and assault failures, then the tolerated non-victory missions.**

---

## 28 October 2026 — Campaign isolation runner corrected; real mission results

**CK-001/002/022: PARTIAL / failures now exposed.** The `CK_MISSION` blocks were nested inside a `requestedMission === null` guard, so all isolated CI mission commands previously exited successfully without running a mission. The guard now ends before the mission section. Every execution mode has an assertion outside all guards comparing requested mission IDs against actual playthrough IDs, preventing a green no-op or duplicate run. Contradictory `CK_SKIP_CAMPAIGN=1` plus `CK_MISSION` now fails explicitly. Each run reports executed count and separate victory, defeat and timeout counts.

All **19 missions actually executed** against runtime `c83ee5e1ce7175be15b4386e7b30d7e84a2646df`: **4 wins, 7 defeats, 8 timeouts**. Three existing strict assertions fail: mission 3 (The Feudal Frontier), mission 8 (Crossing at Redwater), and mission 13 (The Golden Coast). The other 16 exit successfully under their existing assertions, but this is **not** 16 victories or full campaign acceptance. No assertion, objective, difficulty, resource budget or simulation rule was weakened. Machine-readable per-mission objective counts, results, command and exact harness SHA-256 are in [the campaign evidence](docs/verification/campaign-2026-10-28.json).

The four scripted wins are First Hearth, Raiders at the Ford, and the two Relic Road missions. The unresolved runs require diagnosing scripted-player limitations versus production gameplay faults; a timeout/defeat alone does not prove a mission is unwinnable by a human. Initial diagnostics include Feudal Frontier's stalled wood/stone/age economy, Redwater's unfinished construction, and Golden Coast's incomplete naval/siege objectives. Do not restore old all-missions-passed claims from zero exit codes.

Verification: standalone `CK_SKIP_CAMPAIGN=1` simulation checks pass; source validation passes. A deliberately injected scope regression now fails the execution-count assertion, and conflicting mode flags fail. The initial 19 isolated runs and their actual outcomes are recorded above. Hosted CI startup remains a separate unverified gate. These changes affect development checks and documentation only; they do not change the shipped game. Next campaign work must address the three strict failures while preserving the real simulation and existing assertions.

---

## 28 October 2026 — Reuse static terrain pixels; bound Adaptive at 75%

**Verified code: [`bdce5269fac2b294adf5645bef51d5be56c98a70`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/bdce5269fac2b294adf5645bef51d5be56c98a70).** Full local Chromium 153 battlefield suite passes, including all nine actual painted-terrain pixel comparisons with **zero differing channel values**, team colours, fog, hidden-enemy exclusion, unchanged checkpoints, camera/menu rendering, stale-manifest migration and missing-image fallback. All 52 targeted picture/terrain/fog cases pass. The production Vercel URL returned byte-identical `engine.js` and `js/render.js` on 28 October; its GitHub deployment status is success.

Hosted checks did **not execute**: [validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40642337624), [regressions/campaigns](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40642337355) and [Chromium](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40642337428) all failed at startup with empty step lists. Job logs were unavailable and no cause is attributed. No hosting tier or budget was changed. The full hosted campaign/skirmish gate remains unverified.

A separate verification issue was discovered: isolated `CK_MISSION` invocations currently print their selected mission and exit without playthrough output because the mission blocks sit inside an outer `requestedMission === null` guard. Their zero exit codes must **not** be treated as 19 mission completions. Correcting that harness scope and rerunning the actual missions is a follow-up requirement; the standalone regression's direct goal-predicate checks do not substitute for playthroughs.

Roadmap CK-035 / CK-041 remains **PARTIAL, hardware acceptance open**. The local isometric terrain renderer now flattens visible explored chunks into one opaque viewport image at the selected backing resolution after the camera remains stable for two frames. Stationary frames copy physical pixels 1:1 with smoothing disabled on the copy, avoiding repeated transparent chunk resampling. Camera movement uses the original chunk path; camera/zoom/DPR/size changes, newly visible chunks and rebuilt terrain invalidate the image. Fog, water shimmer, objects, sprite motion and HUD continue to render live. The extra viewport is capped at 4 million RGBA pixels (16 MB); oversized views and unavailable contexts retain the original path. No unit art, simulation, save, network or controller fields change. Original 100%, Balanced 75%, Smooth 50% with Sharp HUD and optional Adaptive 50–75% remain.

The regression run also exposed a pre-existing Adaptive upper-bound bug left by removing 40%: after two additional fast windows at 75%, the old three-level index bound selected an undefined level. The bound now follows the actual two-element level list. The existing sustained-fast-window regression passes, including returning to 50% under slow frames.

Local evidence: all 205 standalone files were exercised, with three initial failures resolved and rerun (two required the original binary assets in this fresh checkout; the third was Adaptive). Source and 21-atlas validation pass. Terrain/fog/cache tests cover stationary reuse, panning fallback, exploration reset, zoom/DPR changes, texture invalidation, allocation failure and the pixel budget. Nine native-raster comparisons at 100/75/50% and three zooms match the original pixels exactly. Chromium also compares actual painted terrain pixels at these nine settings; the local browser and deployment verification above supersedes the initial pending status. Full hosted campaigns/skirmishes remain unverified.

No Series S FPS gain is asserted: actual Xbox Edge frame rate and image-quality acceptance are still required. The full 46-task delivery checklist remains open; this increment addresses rendering and a picture-mode defect only.

---

## 27 October 2026 — Physical Xbox Series S feedback rejects 40% image quality

The owner tested 40% battlefield scaling on a real Xbox Series S / Edge and reported **“40% is terrible looking.”** This fails the visual-quality acceptance requirement. As a result, the **Extra smooth 40%** preset is removed, and the optional **Adaptive** preset is restricted to **50% or 75%** only. When performance slows at 75%, Adaptive drops no lower than 50%; it starts at 50% and can raise detail to 75% after two sustained fast windows. 50% continues to use the Sharp HUD that the owner explicitly found clearer. Fixed Original 100%, Balanced 75%, and Smooth 50% remain available. The 100/75/50% diagnostic benchmark and original sprite artwork are retained. Neither old saves, game simulation, controller bindings nor free hosting are changed.

The original 50% performance measurements still show live game frame rates below the desired target, but dropping to rejected 40% is not an acceptable solution. Future work should optimise presentation/render workload while keeping 50% as the current minimum. Updated regressions verify Adaptive never renders below 50%, regardless of prolonged slow RAF timing, and the pause menu can no longer select the rejected 40% preset.

**CI and exact production deployment:** pending verification.

---

## 27 October 2026 — Optional adaptive Series S resolution with sharp controller HUD

The preceding static-picture preset commit c0c46c6 is fully verified: all four GitHub checks passed and Vercel is live at the same SHA. The user's Xbox Series S measured pixel-only median FPS of **100% 7, 75% 10 and 50% 30**, while ordinary live gameplay at 50% was ~13–14 FPS; the owner explicitly confirmed that the high-resolution Sharp HUD was clearer. Canvas compositor/surface work or RAF scheduling, not measured JavaScript unit drawing, remains the suspected dominant cost; exact GPU time cannot be attributed from this telemetry.

A new fifth, **explicitly optional and experimental Adaptive** Xbox picture preset starts at the previously preferred **50%** rendering and keeps the HUD/menus fully sharp. During continuous active play, after warmup (1.5 s), it measures median raw RAF intervals across 8-second windows with at least 16 samples; if frames are consistently slower than roughly 22 FPS it steps 75→50→40. If frames are consistently faster than ~42 FPS for two full windows it steps 40→50→75. These thresholds and minimum periods prevent per-frame resizing or uncontrolled flicker. It never sets 100% in adaptive mode and never goes below 40%. During tabs hidden, pauses, benchmarks and diagnostic layer modes it discards incomplete windows. The selected adaptive detail level survives full-screen objectives/tech tree/save dialogs until play resumes. Other manually selected presets are unchanged. No gameplay, assets, controller assignments, authority, hosting, saves or settings data are changed.

**Series S hardware acceptance still pending:** the owner hasn't yet measured 40% visual quality or FPS, so no gain is asserted for adaptive mode. All static picture settings remain available for users who dislike changing detail. **CI/production status:** pending.

---

## 26 October 2026 — Xbox picture mode regression and resume hygiene

The first opt-in normal-game picture preset build a59b6c9 was deployed and passed source validation and all 19 campaigns, but its new standalone test file had **two harness failures**: `pmItems` was not part of the test-only headless module bundle, and it attempted to begin a restricted automatic FPS benchmark from a non-fixture game. No rendering failure was indicated. The regression harness now loads the actual `js/ui.js` module and stubs only unrelated social menu providers; it enables the built-in fixture flag for that benchmark test, leaving the production-only restriction in place.

An adjacent real UX issue has also been addressed. The **Xbox picture preset** is remembered only for the active session even when entering Tech Tree, Objectives, or Save/Load screens. Those temporary full-screen views still render at **native resolution for crisp text**, but on returning to Pause/Play the selected lower-resolution world and full-resolution Sharp HUD are restored automatically. Manual Canvas pixel test or Sharp HUD test adjustments relinquish the remembered preset rather than being unexpectedly overridden. On starting another match, returning to Title, ending/error or entering multiplayer, the remembered preset is discarded and Original 100% restored. There is still no saved-profile field and no controller/gameplay/network changes. Added tests cover these screen transitions, normal pause menu choices, custom overrides and the original benchmark restrictions.

**CI/production:** pending full rerun. Hardware impact is not yet accepted at 40%; user-tested 50% Sharp HUD remains the reference option.

---

## 26 October 2026 — Opt-in Xbox picture presets for ordinary matches; readable HUD without repeat setup

Real Xbox Series S hardware established that canvas pixel workload matters: the frozen built-in sample rendered at **100% 7 median FPS**, **75% 10**, **50% 30** (repeat 100% 7). An independent ordinary active-play test at **50%** showed **Sharp HUD On 13 FPS** versus **Off 14 FPS**, with the owner explicitly confirming that **Sharp HUD text was clearer**. The full battlefield at 100% earlier remained 4–7 FPS despite unit CPU rendering reducing from 204.3 to about 1.0 ms for 26 visible units. The per-frame display scheduling/presentation gap remains substantial and is not fully attributed.

Previously, the second sharp canvas was only opt-in within the built-in FPS test save and required separately setting Canvas pixel test to 50%, leaving the proven readable/better-speed combination inaccessible as a simple option in actual gameplay. A new **Xbox picture preset** pause-menu item is now visible in **all** local matches: **Original 100% (unchanged)**, **Balanced 75% (sharp HUD)**, **Smooth 50% (sharp HUD)** and **Extra smooth 40% (sharp HUD, unmeasured; deliberately experimental)**. A/D-pad left and right cycle presets; A also advances. Only the world Canvas2D DPR is adjusted; the transparent HUD/pause menu retains the selected full graphics-quality DPR. At 100%, the second canvas is hidden and reduced to 1×1. Input projection, cursor/camera world coordinates, game simulation, original detailed sprite art, save files, and multiplayer authority are unchanged. The option is session-local, not part of `ck_set` and is reset on leaving the match; starting a new match explicitly resets to original mode. This is not an automatic default or a guarantee of frame-rate gain for the newly introduced 40% step. The separate developer benchmarking modes remain available, and preset selection disables Flat field / layer isolation so normal graphics are visible.

**Acceptance:** GitHub production headless tests check all four options, original drawing isolation, HUD sharpness, controller menu selection and game-start/reset behaviour; browser, missions and skirmishes pending. Physical hardware should compare **Smooth 50%** to **Extra smooth 40%** in an *ordinary non-test match* to see whether the extra softness is justified by meaningful RAF/FPS gains. No permanent reduced-quality default should be chosen without the user's feedback.

---

## 26 October 2026 — Real Series S benchmark: GPU-scale bottleneck confirmed; optional sharp-HUD experiment

User completed both automatic tests on a real Xbox Series S in Xbox Edge. **Pixel workload, same full-scene benchmark:** 100% **7 median FPS**, 75% **10**, 50% **30**, repeated 100% **7**. Actual full-resolution canvas in photo: **2160×1063 at DPR 1.20** (~2.30 million pixels); 50% cuts pixel count to one quarter (~0.57 million). This is stronger evidence that Canvas2D raster/compositor/pixel workload is crucial. **Layer comparison:** full **6 FPS**, terrain only **7**, objects only **7**, flat field **20**, full repeat **4**. The second test has possible warmup/time-drift (repeat is slower) and isolates graphics only imperfectly; do not claim flat=60 FPS at full canvas density. Separate runtime readings: **LOOP 8.7–11.1 ms**, **DRAW 5.6–6.1 ms**, **UNIT 0.4–0.5 ms for 26 visible**, **RAF 233.5–266.9 ms**, **GAP 224.8–255.8 ms**. This distinction proves improving just Javascript paint time will not deliver smooth high-res rendering. No benchmark result proves native GPU vs compositor vs Edge implementation as sole root cause.

New opt-in experimental **Sharp HUD test** appears *only in the built-in offline performance save*. When players manually select a 75% or 50% **Canvas pixel test** setting and switch Sharp HUD **On**, the battlefield canvas stays reduced-resolution but controller HUD/text is drawn on a second transparent Canvas2D layer at the original device/graphics-quality DPR. Input geometry, camera, sprite assets, game simulation and save data are unchanged. This is intentionally not an automatic default or a permanent game-quality concession: a full-resolution transparent overlay adds its own GPU/compositor cost and may lose the 30 FPS benefit, which has to be measured on the Series S. Sharp HUD turns itself off on leaving the match and never enters saved settings. Benchmark experiments temporarily disable the overlay so earlier 100/75/50% and layer results remain comparable, then restore the user's in-session preference. Tests cover canvas geometry, context restoration, no extra compositor surface at 100%, and menu/saves isolation.

**Rollout/CI:** pending automated checks and verified exact Vercel production SHA. Keep free-only hosting, no unrequested upgrade. Acceptable outcome requires both readable UI and measured 50% FPS on real Series S; otherwise revise strategy.

---

## 26 October 2026 — Bench camera/input isolation, controller cancellation and deployment status

Following the newly introduced **Run Xbox FPS comparison** (100/75/50/100 pixels) and **Run Xbox graphics comparison** (Normal / Terrain / Objects / Flat / Normal), GitHub's latest commit f90af932 passed all automated checks: Chromium, 19 campaigns, standalone regressions and seeded AI skirmishes. The previous standalone autosave test regression had already been fixed by def21e6c. Exact Vercel production at the last verification was **def21e6c**; Vercel rejected the newer deployment with its **Hobby free-plan daily deployment quota** (`api-deployments-free-per-day`, HTTP 402). Do **not** purchase credits or change hosting tier; the newer benchmarks are committed to main, but aren't yet on the public production URL.

A new guard prevents an opt-in benchmark from accidentally being spoiled by camera movement, gameplay orders, selections, mouse-gamepad axis jitter or default hotkeys. Only while a benchmark is active, the regular `playCtl()` gameplay path is suppressed. **Menu or B** cancels immediately, returns to the standard pause menu and resets game speed, full-resolution canvas, flat-field and terrain/object diagnostic layers. Controller disconnection cancels too. Outside this session-local benchmark, the exact default Xbox mappings and game actions are unchanged. Source tests verify no camera, cursor, selections or gameplay orders can change during active measurement; cancellation restores all original rendering and saved slots remain intact.

Physical Xbox Series S median FPS still needs acceptance after Vercel becomes deployable again; do not advertise performance gains merely from the CPU render speedup or Node tests.

---

## 26 October 2026 — Automatic Xbox layer comparison in the built-in save

The user's preceding screenshots demonstrated a Series S slowdown with full graphical presentation despite troop CPU draw reduction from 204.3 ms to 1.0 ms per 26 onscreen units. The already-installed **Run Xbox FPS comparison** samples median requestAnimationFrame delays at 100/75/50/100% resolution and restores original resolution. Its initially failing isolated autosave source test was corrected in commit def21e6c, with all four GitHub checks green. The identical commit was explicitly deployed as Vercel production after GitHub/Vercel automatic synchronization was found lagging.

**New addition:** In the same paused offline built-in **Xbox FPS Test Save**, there is also **Run Xbox graphics comparison**. This uses the existing deterministic frozen-scene RAF median mechanism to compare five passes at **100% pixel density**: full scene, terrain only, objects only, flat field, then full scene again. Every phase lasts 7 seconds with the first 1-second GPU warmup excluded; the ~35-second run reports all five **median FPS** together in the on-screen HUD so **one Xbox photo** covers the comparison. The final full-scene repeat reveals time-order drift; speeds, rendering modes, and original resolution are restored on completion or cancellation. The test is never available in multiplayer or normal matches, does not alter any saved games, and preserves original art without any production quality reduction. It supplements rather than replaces the 100/75/50% comparison.

**Status:** CI and Vercel exact-head production confirmation pending; actual Series S median FPS still required. Neither timed benchmark can directly reveal GPU-present duration or distinguish GPU driver stalling from OS scheduling without further evidence.

---

## 26 October 2026 — Automated Series S full-scene canvas comparison, no more repeated screenshots

The owner demonstrated **4 FPS on Xbox Series S** after animated troop frame caching despite measured unit drawing falling **204.3 ms → 1.0 ms** for **26 visible soldiers**, a ~99.5% improvement in the measured CPU unit painter. Latest scene: WORLD 2.3 ms, DRAW 4.8 ms, SIM 4.4 ms, LOOP 11.6 ms, RAF 266.9 ms, GAP 255.3 ms. The remaining delay is largely outside the JS callback, so the prior manually selectable 100/75/50% canvas resolution test was deployed. Its full regressions and skirmishes all passed.

Now in the **bundled offline Xbox FPS Test Save only**, the pause menu adds **Run Xbox FPS comparison**, a single-A-button benchmark: four phases **100%, 75%, 50%, 100%** of the original full scene, each **7 seconds** with the first **1 second disregarded as texture warmup**. The logic collects actual raw `requestAnimationFrame` callback intervals and reports **median frame rate** for each phase in the on-screen performance overlay, leaving a final screenshot-ready comparison. The repeated full-resolution phase gives a rudimentary check for time/order and thermal drift. To keep the scene and draw counts comparable, simulation speed is set to zero *only for the bundled offline fixture during the benchmark*, restoring the original speed and resolution automatically afterwards. The active canvas is still repainted, shaders/sprites and HUD remain enabled, and the normal game resumes afterward. All benchmark state is session-local, never written to save/config/storage, and the test cancels/restores normal rendering if interrupted (pause, tab background, title, new match). The individual resolution controls remain available for manual A/B.

The results distinguish **canvas pixel-count dependence** versus other browser compositor/texture bottlenecks; they are not a hardware GPU profiler and a large residual gap still cannot identify an exact driver cause. Compare 100/75/50/100 median FPS and, if needed, unit counts. No FPS improvement is claimed until the owner's Series S outputs are observed. The mode must never be accessible in authenticated multiplayer or ordinary player matches.

**CI + Vercel verification:** pending.

---

## 26 October 2026 — Series S troop draw CPU fixed, GPU/browser RAF gap still slow; test canvas pixel workload

On the Xbox Series S Edge, the owner supplied a new normal-graphics screenshot from the same test save with **4 FPS**, **250.0 ms on-screen FPS interval**, **60 units total / 56 buildings**, **26 visible soldiers**, and **UNIT 1.0 ms**. The preceding comparable screenshot had 26 visible soldiers with UNIT **204.3 ms**—approximately **99.5% lower measured soldier-drawing CPU time**, a strong result of per-team animated frame caching. NODE 0.3 ms (33), BLD 0.8 ms (28), WORLD 2.3 ms, DRAW 4.8 ms, SIM 4.4 ms, LOOP 11.6 ms, and **GAP 255.3 ms / RAF 266.9 ms**. The FPS did **not** improve despite major CPU drawing savings. We cannot infer the precise GPU or compositor cause from requestAnimationFrame and CPU timings.

To directly test whether Xbox Edge is bound by **presentation/backing-store pixel workload** rather than JavaScript, the pause menu now exposes an unsaved, reversible **Canvas pixel test**: **100% (unchanged original), 75% and 50%**. This controls only the canvas DPR/backing width and height; the CSS display dimensions, logical input coordinates, selection, camera, minimap, game state, original unit sprites, texture atlas animation, render depth and network commands are unchanged. Lower settings temporarily upscale a smaller rendered frame and will look softer. It is deliberately a *diagnostic*, not evidence that lower graphic quality is acceptable for production. Leaving a match automatically resets to 100%. HUD explicitly shows the actual canvas dimensions, selected scale and effective DPR so Series S screenshots can be compared correctly; the test turns on the FPS overlay automatically. It does not modify `ck_set`, game saves or autosaves. CI/headless checks test exact 100/75/50 backing pixels, stable CSS/input geometry, reset on title and safe coexistence with Flat field/Terrain only.

**Next hardware evidence:** In the **same built-in Xbox FPS Test Save**, use Normal scene and compare 100%, 75% and 50% **RAF/GAP/FPS** after about 10 seconds per setting. If 50% runs much faster, GPU fill/texture/present cost rises to the top. If it stays near 4 FPS, investigate texture upload/surface complexity and scheduling rather than canvas pixel count. No FPS claim until actual Series S test.

**CI and production acceptance:** pending.

---

## 26 October 2026 — Series S soldier sprite atlas bottleneck: bounded original-resolution frame crops

The latest Xbox Series S Edge owner screenshot confirms **4 FPS**, **300.3 ms RAF**, **220.6 ms previous JS callback**, **216.0 ms total draw**, **205.0 ms WORLD**, and the newly split breakdown **NODE 0.3 ms (22 resources)**, **BLD 0.3 ms (20 buildings)**, **UNIT 204.3 ms (26 on-screen soldiers)**. The game contains 60 total units and 56 buildings, but the renderer only drew 26 visible soldiers. Thus, approximately all measured WORLD time is in troop draw calls. The 704.2 ms peak is a historical peak and not the current draw duration. The 79.7 ms GAP is unattributed scheduling/compositor time, not proof of an intentional FPS cap.

The main unit painter used to issue `drawImage()` **from full painted animation atlases for every soldier on every frame**, including large full-colour recoloured atlas canvases. The new `troopFrameTexture(art)` makes an **original source-resolution frame crop** once per unique underlying image and source-rectangle; subsequent soldiers re-use the small ready-to-present frame. The existing `drawPaintedTroop()` bobbing, 8-frame action cycles, pose selection, mirroring, facing, foot anchor, custom palette, zoom, selection/shadows, and unit health bars are unchanged. The procedural and unavailable-asset fallback paths stay intact. A global LRU, limited to ~6M RGBA pixels (about 24 MiB) and 160 frames, prevents unbounded canvas texture growth while a WeakMap keyed by team-coloured image identity invalidates reloaded atlas contents. Canvas failure uses the unmodified large-atlas drawImage instead; no gameplay/simulation state changes.

New tests verify production frame cache reuse, per-team/per-image separation, frame changes, bounded eviction, failure fallback, and faithful renderer transform/depth behaviour. **Series S GPU/frame-time acceptance is still pending**: compare the one-click sample save in Normal graphics mode and report the RAF/FPS and UNIT ms/count. Code tests alone cannot verify actual Xbox graphics performance or quality. All hosting remains free-only.

**CI and production deployment:** pending.

---

## 26 October 2026 — Series S confirmed WORLD hotspot: static resource atlas crops + diagnostics

Three actual Xbox Series S Edge screenshots using the one-click sample save: full Normal **5 FPS / 216.9 ms RAF / 158.0 ms WORLD / 54 units / 56 buildings**; Terrain only **9 FPS / 106.8 ms RAF / 0 ms WORLD / 63 units**; Objects only **7 FPS / 133.5 ms RAF / 103.7 ms WORLD / 65 units**. Counts differ because AI advances; these are point measurements, not controlled benchmark runs. GPU/compositor and object painter contributions may differ across frames, but the CPU-renderer WORLD time remains large even with terrain suppressed.

This delivery adds an optional **NODE ms (on-screen count), BLD ms (count), UNIT ms (count)** profiler row to localize resource sprites versus buildings and troops, preserving existing depth sort and visual layers. It includes profiling overhead and does not directly show GPU present time. The renderer also now creates and reuses a small **2× resolution crop of each static painted resource frame**, keyed by the actual team-coloured atlas image (WeakMap) plus source frame coordinates/size. Each subsequent tree/farm draw uses that small Canvas2D texture instead of sampling the huge sprite atlas; the screen anchor, mirrored tree orientations, size, zoom, alpha and source artwork remain the same, and it falls back to original drawImage on canvas failure. Offscreen and unexplored resource culling, terrain chunks, unit sprites, buildings, multiplayer, AI, save slots and Xbox controller remain unchanged. The existing Flat field and Terrain only diagnostics clear the new counters rather than showing stale data.

**CI / Xbox acceptance:** pending. Do not claim faster Series S FPS until a Normal-mode photo of NODE/BLD/UNIT and RAF is observed. First compare the new normal-scene WORLD and actual FPS to earlier screenshots, then choose follow-on cost reductions for whichever painter dominates.

---

## 25 October 2026 — Xbox Series S: avoid uploading unexplored terrain chunks

Owner's paired Series S Edge screenshots showed 6 FPS for a normal early match versus 60 FPS with the world deliberately hidden: large RAF gaps appear associated with painting/presenting the battlefield, despite low measured JS draw time. A focused renderer change now **skips canvas chunk allocations and GPU drawImage calls for entirely unexplored 8×8 chunks**. Previously large 512×256 chunk textures were uploaded behind an opaque black fog mask. This live `S.ex` visibility check is evaluated each frame, allowing previously unknown chunks to draw immediately upon exploration; explored, coastal and water graphics are unchanged. The existing viewport bounds, palette, LRU, fog masking and all world entities remain intact. Animated water shimmer on completely unknown tiles is also skipped.

**Not a final Xbox performance acceptance:** benchmark actual Normal FPS/RAF/GAP in the built-in Xbox FPS Test Save. Terrain-only and Objects-only diagnostic settings remain available to isolate further. Native Xbox Edge GPU/compositor presentation time cannot be inferred from JS callbacks alone. The improvement requires hardware measurements; no FPS increase is claimed yet.

**CI and Vercel:** pending.

---

## 25 October 2026 — Built-in Series S FPS test save (user request)

Owner deleted their temporary local match and asked for a **saved game to test**, rather than repeatedly building a new kingdom. The main menu now includes **Xbox FPS Test Save**: a deterministic two-kingdom 96×96 Open Plains match seeded at 202697 with completed settlements (~56 buildings) and substantial original rendered units (~52), plus native terrain/fog, controller and AI simulation. Each invocation regenerates the same game state and saves/loads it through the *actual validated production serializer* using a reserved `ck_series_s_fps_fixture_v1` key. No manual save slots (`ck_save*`), recovery autosave (`ck_autosave`) or saved setup options (`ck_set`) are overwritten. If Edge disallows storage, the freshly generated in-memory sample remains playable. Automatic saving of this special fixture is disabled, including on pause and during play; manual "Save game" is still explicit. The sample is not a user's missing/deleted save and cannot recover it.

From **Home → Xbox FPS Test Save → Menu → Render layer diagnosis**, compare Normal, Terrain only, and Objects only in the *same* built-in scene. Green flat-field is intentionally blank and is a distinct existing mode. Normal restores all graphics. The test produces its own fixed starting population, placements and camera, but still runs live AI after loading, so later timestamps will naturally differ. The aim is to isolate the 6-to-60 FPS Series S GPU/render stall; this is not a final performance fix. No hosting-tier or network changes.

**Verification:** pending game regression suite, browser and exact production deployment.

---

## 25 October 2026 — Xbox Series S confirmed 6 → 60 FPS flat-field A/B; next stage isolation

Owner provided paired screenshots from their actual Series S running Edge at the **beginning of a game**, not a large battle. **Normal scene:** **6 FPS**, 166.8 ms RAF, 163.5 ms GAP, LOOP 3.3 ms, SIM 1.4 ms, DRAW 2.0 ms, about 30 units/54 buildings. **Flat field:** **60 FPS**, 16.7 ms RAF, 15.9 ms GAP, LOOP 1.8 ms, SIM 0.0 ms, DRAW 1.8 ms, about 30 units/56 buildings. Flat-field green background is expected and temporary: the live HUD, units in simulation, and control inputs continue while the battlefield is intentionally omitted. These counts vary slightly because the match is still running. The roughly **10×** frame rate change under the controlled setting strongly implicates drawing/presenting world graphics (including GPU/compositor effects), despite the small JavaScript draw duration. It does **not** identify which layer or prove a graphics-driver fault.

A second unsaved diagnostic, **Render layer diagnosis**, adds **Normal**, **Terrain only**, and **Objects only** in the pause menu. Terrain-only renders original cached terrain/water/fog but skips world entities/effects; Objects-only shows units/buildings/resource nodes over a blank field, skips terrain tiles/chunks/fog, but retains normal sight gates. These modes are explicitly for developer diagnosis, not playable render-quality options. Switching one on switches the existing Flat-field test off, and vice versa; leaving a match clears both. User should compare FPS/RAF/GAP on the Series S in the same match for Terrain only versus Objects only and restore Normal afterwards. No gameplay, AI, controller bindings, network authority, save format, sprite art, hosting tier or paid services are modified. Do not claim smooth full graphics until physical Series S measurements on a restored Normal scene.

**CI/deployment:** pending final post-commit checks.

---

## 25 October 2026 — Series S Edge: 5 FPS / 193 ms off-loop; renderer isolation acceptance pending

The owner confirmed the actual test machine is **Xbox Series S using Edge**, rather than Series X. The latest real-device screenshot reports **5 FPS**, 200.1 ms RAF, **36 units / 67 buildings**, 8.9 ms SIM, 5.7 ms DRAW, previous JS callback **LOOP 7.1 ms**, controller **PAD 0.2 ms**, controls **CTL 0.1 ms**, and **GAP 193.0 ms** while the document is **VISIBLE** and focused. The old 326.7 ms DRAW peak is not the current frame. Crucially, GAP is unmeasured time before the next animation callback: it may be compositor/GPU backpressure, browser scheduling, browser work elsewhere, or display policy. Current evidence does **not** prove a deliberate 5 FPS cap or a CPU bottleneck.

Two small isolated steps target the next diagnosis. At **exactly brightness 1.0**, the main canvas now uses `filter: none` instead of the visually identical `brightness(1)` (a possible avoidable compositing cost); non-default brightness remains unchanged. In the Xbox pause menu, **Render isolation test: Normal / Flat field** is an explicit, reversible, unsaved local diagnostic. In Flat field mode the game keeps running: controller input, simulation, sound, network and all UI/performance HUD work normally; only the battlefield graphics are replaced by a flat fill. The diagnostics mark `TEST: FLAT FIELD` and zero out unused world stages. Turning the menu option back to Normal immediately restores the rendered world; leaving a match clears the toggle. Do not confuse this opt-in visual diagnostic with a shippable graphics mode or recommend players use it for real gameplay.

To identify whether *scene raster/compositing* is the dominant issue, compare normal and Flat field RAF/FPS/GAP readings in the **same match on the same Series S**. A large increase in Flat field FPS suggests scene-rendering or GPU-related pressure; no increase suggests another source of scheduling delays (but still does not prove it). The visual test cannot measure present/display time directly. No measured FPS gain or physical Xbox acceptance is claimed until the owner retests. New production-game headless tests check brightness settings, render isolation/reversibility, HUD persistence and cleanup.

**Acceptance:** GitHub validation, regression, campaign and Chromium checks pending, then Vercel exact SHA verification.

---

## 25 October 2026 — 11 FPS on a fast frame: RAF scheduling diagnostics (screenshot)

In the user's new screenshot the game reports **11 FPS**, a **100.0 ms** frame interval with **30 units / 25 buildings**, while the measured **SIM 0.50 ms** and **DRAW 2.30 ms** are short. World objects are about **1.2 ms**, UI **1.3 ms**, and other stages round to zero. The displayed **672.10 ms DRAW peak** is historical, not the current frame. These measurements do not justify further unit-draw optimisation as the default diagnosis: the remaining interval may involve browser scheduling, compositor/GPU waiting, unrelated JavaScript, tab/window throttling, or sampling differences.

With the performance HUD on, the game now separately reports **LOOP** (duration of the *previous* complete JS game callback), **PAD** (controller polling), **CTL** (input/control), **GAP** (positive remainder of the new requestAnimationFrame interval after the previous callback), **RAF** (raw uncapped time between RAF callbacks), and browser **TAB visibility / FOCUS** status. GAP is explicitly **unattributed time**, *not* proof of idle or of a specific GPU/browser bug. The split separates slow game callbacks from delayed scheduling and avoids the 250 ms simulation-delta clamp hiding a large RAF interval. Profiling overhead is gated on the optional HUD; gameplay fixed-step calculation, error recovery, network command authority, audio, saves, controller mappings, graphics and hosting remain unchanged. New pure-budget and production-source tests cover the 100 ms scenario and wiring.

**Acceptance:** source regression/Chromium and same-device RAF/GAP reading required. No sustained FPS gain claimed from diagnostics alone.

---

## 25 October 2026 — Late-battle fog batching and per-stage draw timings (video evidence)

A new 5.23-second 1080p user video shows **4–5 FPS**, frame intervals roughly **200–250 ms**, **176 units / 105 buildings**, simulation **approximately 18–48 ms**, and drawing **approximately 160–190 ms**; peak counters are historical and not attributable to these five seconds. The previous captured ~612 ms draw period had fewer units and different conditions, so this is not a controlled before/after result. The bottleneck remains primarily rendering in the new clip.

The solo isometric renderer formerly issued one Canvas2D `fill()` for *each* unexplored or explored-but-hidden diamond on every frame. It now collects those diamonds into **one black path and one translucent explored-fog path**, rendered together after the tile/animated water pass and before world objects; preserves exact original diamond points, colours, unexplored visibility, resource gating, world order, and team-relative multiplayer projection (unchanged). Skips redundant tile-hash calculation when textured terrain chunks are enabled.

When the optional performance HUD is enabled, a new line breaks measured draw time into `CHUNK` (terrain blits), `TILE` (dynamic tile effects/fog), `WORLD` (objects/units/sorting), `FX` (world overlays), and `UI` (interface). These *do not include* browser/GPU present time and are not per-unit timings. A production-backed test verifies path batching and mixed sight states. No frame-rate gain is claimed until the user's same late-battle device/save is retested. No gameplay/simulation, maps, saves, controller bindings, artwork, multiplayer authority or hosting plan changes.

**Acceptance evidence:** pending post-commit GitHub validation/regressions/Chromium and actual device metrics.

---

## 25 October 2026 — Lazy procedural sprite rendering (main change, acceptance pending)

Rendering now resolves original painted unit/building atlas frames **before** requesting the procedural fallback canvas. Successful painted or non-painted atlas frames no longer allocate/cache an unused 2× procedural sprite, or repeatedly perform its cache lookup per game frame. Missing, invalid or failed atlas frames still use exactly the previous procedural art, including when an atlas becomes unavailable after an earlier painted frame. This changes rendering allocation only: no simulation, unit/building balance, save, network, controller, UI position or art asset is changed.

New `tests/lazy-procedural-sprite.test.mjs` uses the production renderer, registered original unit/house atlas metadata, missing-atlas fallback and partial-atlas cases. The change is motivated by the reported **4 FPS** crowded battlefield and costly draw path, but **no improved FPS or Xbox performance is claimed** until the same real-device save and draw-time HUD are compared. Full main CI, Chromium capture and production alias verification remain separate acceptance evidence.

---

## 25 October 2026 — Terrain chunk cache performance work (PR #56, production verified)

A supplied battlefield screenshot and seven ~10–18-second 1080p gameplay clips show late Imperial Age fighting at **4 FPS** with **78 units and 94 buildings**. The visible diagnostic displays **SIM 15.70 ms** (peak 166.70) and **DRAW 612.80 ms** (peak 694.80). These readings point to an especially slow canvas draw in that captured scene; do not assume a per-device improvement without comparing on the same hardware.

Identified a deterministic performance bug in `js/render.js`: `drawChunks()` iterates every terrain chunk in the isometric viewport's *world-coordinate bounding rectangle*, painting many that are outside the visible screen. Meanwhile `chunkOf()` trims its LRU to **48 chunks on every cache miss**. Wide or zoomed-out views with more than 48 on-screen chunks can therefore repaint terrain continuously, even if the camera never moves. Change culls projected offscreen chunks **before** expensive canvas construction, retains all visible chunks plus a panning margin, and prunes after each render, retaining every visible chunk plus a capped panning margin (min 64; max 320 unless the viewport itself needs more). No changes to original art, combat, S.tech, saves, camera geometry, or multiplayer tick calculation.

Added `tests/terrain-chunk-visible-cache.test.mjs` to exercise realistic 1280/1920/2560/3840 viewports, full painted chunk placement, zero stationary redraws over 30 frames, panning reuse, explicit cache invalidation and bounded storage. **Tested and released:** [PR #56](https://github.com/johnstacey16-ui/crown-and-kingdoms/pull/56) merge gameplay SHA `242b66948193a46f697a8772baaea3f1201fa7ee` after [PR 189 standalone test files, 19 missions and three seeded AI skirmishes](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40170077859), [browser graphics](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40170077819) and [validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40170077875) were all successful. Post-merge [regression/AI/campaign](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40170408502), [Chromium](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40170408454) and [validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40170408451) all passed. Production Vercel deployment `dpl_As5NMW4ynB9qypiuaXPJkX3QnYam` was independently verified READY and active on `crown-and-kingdoms.vercel.app`, with exactly the merged gameplay SHA; prior Vercel HTTP 402 daily quota restriction cleared. After writing documentation commits, independently recheck production SHA parity. **Actual FPS improvement on the user's PC remains unmeasured** until the same crowded save is replayed and its draw/performance HUD compared.

---
## 25 October 2026 — Spanish Blacksmith gold exemption (Batch 55, PR/main tests all green; production READY)

Source verified against official [Forgotten Empires Spanish profile](https://www.forgottenempires.net/age-of-empires-ii-definitive-edition/civilizations/spanish). The Spanish-only zero-gold Blacksmith research discount is calculated per owning team, without global catalogue mutation or discount to Stable, University and other non-Blacksmith technologies. Same effective price reaches controller UI, network option quotes, AI affordability/savings and actual resource charge. All source-required research times, age and tech prereqs stay unchanged. Artwork and multiplayer entity IDs untouched; existing current-version technology queues and saves remain reliable. Other speculative civilization bonuses not invented.

Regression coverage includes all 26 civs × all Blacksmith tech keys, no cross-team leakage, actual food/gold charge with unaffordable foreign civs, host authorization and zero-gold research, exact completions, current-save roundtrips and UI/AI integration guards.

**Verified release evidence:** [PR #55](https://github.com/johnstacey16-ui/crown-and-kingdoms/pull/55) squash merged gameplay commit `c442eda4e90d38accd0a8d3e2524d2b4ad16737d`. [Final PR 188 standalone files, all 19 campaigns and three seeded production AI games](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40166096640), [Chromium](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40166096585), [validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40166096603) all succeeded. Exact gameplay SHA also passed [post-merge full regression/campaigns/AI](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40166295092), [post-merge Chromium](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40166295102), and [post-merge validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40166295142). Vercel resumed automated production deployments after earlier HTTP 402 quota; **READY** live alias `crown-and-kingdoms.vercel.app` confirmed on gameplay SHA, deployment `dpl_5V5TxJir3AFdyQjwBREjpYJkVcPQ`. Any later docs-only SHA requires a new exact production check. Historical earlier 402 blockers are superseded by new deployment evidence, not retroactively successful attempts.

---
## 25 October 2026 — Forging, Iron Casting and Blast Furnace (Batch 54, acceptance pending)

Pinned to AoE2:DE 185872 dataset blob `c4f7da961e82a8231b1ba49459949c4d6e479bc8`. Independent Blacksmith Forging (150f/50s, Feudal, +1), Iron Casting (220f/120g/75s, Castle, +1), Blast Furnace (275f/225g/100s, Imperial, +2) replace the former combined melee shortcuts. The 26-civ source matrix excludes Blast Furnace from Byzantines, Malians and Koreans. Damage resolution and AI use the actual additive melee attack bonuses without altering ordinary ranged combat or art.

**User explicitly waived pre-release backward save compatibility:** The prior `atkM` and `atkM2` keys and their migration logic are removed entirely, rather than retained solely for old test saves. Current-version saves still support their own completion and reload. No earlier game-version save is promised to work. All current multiplayer IDs stay unchanged.

Coverage: 26-civ technology tree, timing, price/age/preconditions, real combat, no obsolete tech keys, authenticated host budget isolation and current-version save roundtrips. **Merge and release require all CI checks.** Vercel previously blocked new production builds with HTTP 402 `api-deployments-free-per-day`; verify READY and exact latest production SHA before calling Batch 54 live. Unit-specific exceptions, discounts, Xbox device controls and advanced multiplayer audits are still open.


---
## 25 October 2026 — Cavalry Barding armour tiers (Batch 53; PR/main CI passed, Vercel quota blocked)

Source AoE II DE build 185872, [SiegeEngineers data blob `c4f7da9`](https://github.com/SiegeEngineers/aoe2techtree/blob/c4f7da961e82a8231b1ba49459949c4d6e479bc8/data/data.json): implemented source-accurate **Scale Barding** `armC` 150 food/45 sec, **Chain Barding** `armC2` 250 food + 150 gold/60 sec at Castle after Scale, and **Plate Barding** `armC3` 350 food + 200 gold/75 sec at Imperial after Chain. Damage calculation now stacks +1/+1, +1/+1 and +1/+2 melee/pierce protection for eligible mounted roster units, without touching original sprite art or network/save IDs. Original first-tier armor save flags preserve their old effect.

Pinned 26-civ gates prohibit all 3 for Aztecs/Mayans/Incas and final Plate for Mongols, Celts, Vikings, Japanese, Goths, Ethiopians and Koreans. Research menus, AI and authoritative multiplayer commands all pass through existing shared `rsOf`; forbidden orders never spend resources, old already-paid research may complete. New standalone regression tests verify source availability, actual combat melee and pierce protection, other-unit isolation, exact costs/timers and ages, party ownership, host command filtering and saves.

**Merged, CI complete:** [PR #53](https://github.com/johnstacey16-ui/crown-and-kingdoms/pull/53), merge gameplay SHA `ebbdf9ed7d17c53f96a723299d77dfa060827b28`. [PR checks](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40153961950) passed all **186 standalone regression files**, 19 campaigns and three seeded production AI skirmishes. [PR browser](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40153961847) and [validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40153961825) passed. [Post-merge full regressions/AI/campaigns](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40154278911), [post-merge Chromium](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40154278918) and [post-merge validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40154278905) all completed successfully at exact gameplay SHA.

**Deployment NOT live:** Vercel production was verified READY at old Batch 50 SHA `851278af65b899b2e06fc8bf639d4679a0fcdc80`; no new Git-backed deployment was present for Batch 53. An authenticated attempt to create a production deployment on the exact green main gameplay SHA failed with Vercel HTTP **402 payment_required**, `api-deployments-free-per-day` quota (more than 100 deployments in day), `retryAfter=86400` seconds. This is a Vercel service quota, not a game-test failure; no billing setting was changed and no alternate deployment was inferred. Batches 51, 52 and 53 remain **merged but NOT deployed**. Production must be verified READY at the latest `main` SHA after daily reset/user account remedy. Audit-only later commit(s) do not change gameplay but advance main SHA. Xbox hardware validation, detailed class/unique cavalry mechanics and authentic three-tier melee attack remain open.

---
## 25 October 2026 — Ranged armour tiers (Batch 52; PR/main all green, Vercel 402 deployment blocked)

Pinned to DE 185872, SiegeEngineers technology blob `c4f7da961e82a8231b1ba49459949c4d6e479bc8`. Implemented actual Feudal Padded Archer Armor `armR` (+1 melee/+1 pierce), Castle Leather `armR2` (+1/+1, 150f/150g, 55s after Padded), Imperial Ring `armR3` (+1/+2, 250f/250g, 70s after Leather) in the Blacksmith and cumulative `dmgT` class-aware combat. Source-pin 26 civilization research matrices; Franks, Mongols, Huns, Aztecs cannot newly research Ring. Preserved old `armR` effect, art and save/multiplayer identifiers. Shared permissions and costs cover human, AI and host multiplayer. Ranged-unit armour art indicator still works; higher-tier graphical distinction not yet implemented.

Tests include 26×3 menu permissions, direct costs and age/prerequisites, actual ranged-unit melee and pierce damage, rejection of unrelated-unit buffs, team authority/no-charge, and paid old-save survival. **Verified GitHub acceptance:** [PR #52](https://github.com/johnstacey16-ui/crown-and-kingdoms/pull/52) squash-merged into `main` gameplay commit `b5564aa72c47f2b6c1f8ee0c7f320858728aeefc` after [185 standalone tests, 19 campaign missions and three seeded AI games](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40152150243), [Chromium](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40152150051) and [validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40152150112) passed on PR head. [Post-merge regression / all campaigns / all AI seeds](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40152345449), [post-merge Chromium](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40152345552) and [validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40152345405) all passed at the merged gameplay SHA.

**Production delivery is BLOCKED and was not falsely declared:** As of 25 October 2026 `crown-and-kingdoms.vercel.app` still returned Vercel READY on previous Batch 50 commit `851278af65b899b2e06fc8bf639d4679a0fcdc80`. A verified production `gitSource` deploy attempt after all 3 main workflows succeeded failed at Vercel with HTTP **402 payment_required**, resource **`api-deployments-free-per-day`**, over 100 deployments per day, retry-after **86,400 seconds**. The authenticated environment has no Vercel CLI / linked local repo for a supported scoped CLI fallback. This is not a code-build test failure. **Do not claim Batch 51 or 52 is live.** Production must be independently redeployed and verified READY on the **latest** `main` commit after quota reset / user account plan action. Audit-note commits have further advanced the SHA without game-code changes. Cavalry and melee Blacksmith tier parity plus Xbox hardware remain open.

---
## 25 October 2026 — Infantry-armour line split (all CI passed; Vercel deployment quota blocked)

Implemented all three independent AoE2:DE Blacksmith infantry armour tiers: Feudal `armI` Scale Mail +1/+1, Castle `armI2` Chain Mail +1/+1, Imperial `armI3` Plate Mail +1 melee/+2 pierce. Source costs, research seconds, age/prerequisite gates and exact five civilizations without Plate Mail are pinned to SiegeEngineers game build 185872 blob `c4f7da9`. Live combat uses the cumulative class-based armor bonus on existing and future units; civilization restrictions cannot be bypassed by solo/AI/multiplayer research paths. Retrocompatible paid research and old-tech saves maintained. AI evaluates new research tiers.

Tests cover all 26 civilizations, source masks, paid/denied research, timing and affordable budgets, live melee versus pierce shots and no buff to unrelated classes, network host command authentication and save/load. **All mandatory PR and post-merge main CI have passed:** [PR #51](https://github.com/johnstacey16-ui/crown-and-kingdoms/pull/51) squash merged `829a65c25f44c478b4b277153b711c074d7b2dc8`; [184 standalone tests, 19 campaign missions and three seeded AI games](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40146019413), [Chromium](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40146019391), [validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40146019417) were green on the PR head; [full post-merge main regression](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40146361712), [browser](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40146361734), [validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40146361716) all green on the merged gameplay commit.

**Deployment BLOCKED — not live yet:** The Vercel production alias was still READY at previous commit `851278af65b899b2e06fc8bf639d4679a0fcdc80` when inspected. A GitHub-verified `main` production deployment request for exact merged commit failed with Vercel HTTP 402 `payment_required`, resource `api-deployments-free-per-day`, max 100/day and `retryAfter:86400` (24h). Vercel CLI was not available in the connected execution environment. This is a Vercel plan/daily quota limit, not a game validation/build failure. Recheck Git integration/daily reset or user billing and verify exact latest production SHA and READY status before marking released. Do not change billing settings, conceal the quota or report false deployment completion. Ranged/cavalry armour and melee attack are **not** yet fully three-tier research lines; the older simplified entries are intentionally unchanged, with no made-up migration. Artwork and network IDs untouched; Xbox console testing remains open.

---
## 25 October 2026 — Blacksmith source eligibility and armour-time corrections (verified release)

DE update 185872, SiegeEngineers pinned tech tree `c4f7da961e82a8231b1ba49459949c4d6e479bc8`: verified all 26-civ Blacksmith access for `atkM`, `atkM2`, `armI`, `armR` and `armC`. Disabled now-prohibited source final attack tier for Byzantines/Malians/Koreans and first cavalry armour for Aztecs/Mayans/Incas, via common research menu and host validation; corrected food-only first armor tiers and durations. Existing completed and paid in-flight work remains untouched in saves. Testing includes source matrix and actual runtime payment/timing, host rejection, team isolation and reload.

Do not mark full AoE2 Blacksmith parity: current game compresses up to three reference tiers into one armor key and two melee attack keys. Add real tech chains and combat modifiers separately. All painted artwork intact; Xbox hardware still unverified. **Released:** [PR #50](https://github.com/johnstacey16-ui/crown-and-kingdoms/pull/50), merge `e604d6c6ff1503534777ed0700e38e103857c1d6`. [All 183 PR regression files, all 19 campaigns, three production seeded AI matches](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40142666393), [PR Chromium](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40142666414), [PR validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40142666416) passed. The exact merge SHA also passed [main full regression](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40142925214), [main Chromium](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40142925206), and [main validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40142925226). Vercel production alias was VERIFIED READY at exactly the merged gameplay SHA on deployment `dpl_96AyUwocsJ8dqhrtkR4DsrZjPTJg` after Git-backed deployment, without art/source modifications or console-hardware claims. Latest documentation-only SHA parity must be checked separately.

---
## Verified release — University technology and civilization parity, 25 October 2026

**Merge:** [PR #49](https://github.com/johnstacey16-ui/crown-and-kingdoms/pull/49), code commit `3c39375f6486970446fe573ee2ce0adf1a0dcc70`. Eight University tech entries gated by versioned 26-civilization source matrix. Costs, ages, timing and tower/wall dependencies corrected where grounded in DE update 185872. No changes to source artwork, existing unit keys or save format. Saved already-paid forbidden research remains loadable and completable.

**PR CI all passed at `c2053b0ebe2c1a151a2652656336b107bc3df464`:** [182 standalone regression files, 19 isolated campaigns, three seeded AI skirmishes](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40141413981), [Chromium battlefield/art](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40141413790), [game validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40141413791). The first regression run found an outdated 60-second Chemistry timer expectation; the smoke test now explicitly verifies Chemistry is *not* complete at 61s and *is* complete after the sourced 100-second duration, preserving the actual gameplay rules.

**Production:** Vercel alias `crown-and-kingdoms.vercel.app` mapped to READY deployment `dpl_U8HZb8AHBHz5tVbHft63GbJprVZt` at exact merged code commit. Track subsequent documentation commits independently rather than assuming production matches forever. [Post-merge main validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40141695489), [Chromium](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40141695477), [full regression](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40141695474) must each reach their own conclusion; no unverified pass claim. Physical Xbox testing remains open.

---
## 25 October 2026 — University civilian technology audit (implementation, release checks pending)

Using the Sep 2026 official DE update 185872 and pinned SiegeEngineers data blob `c4f7da961e82a8231b1ba49459949c4d6e479bc8`, gated eight already-implemented University researches across each of the 26 civilizations through `rsOf`. Corrected six source-verified research cost/time records, made Arrowslits Imperial-only, and removed invalid dependence on Arrowslits/Masonry for Guard Tower/Fortified Wall respectively. Kept old saved paid research and unit/net IDs intact. Added a source-matrix test for 208 availability cases, actual queue/resource mutations, network command acceptance/rejection and save restoration.

This implementation is intentionally scoped. Treadmill Crane tech-tree permissions, regional swaps and full tower research **effects** still need source and gameplay parity; existing sprites and music unchanged. **Acceptance pending:** full PR/main GitHub Actions, production commit match and Xbox console testing.

---
## Verified release record — 24 October 2026, Monastery civilization eligibility

**Merged:** [PR #48](https://github.com/johnstacey16-ui/crown-and-kingdoms/pull/48), application commit `81e5e949b78fc740108a87b6819dc9205a669df1`. Added patch-185872 tech-tree gating for all 11 already-implemented Monastery technologies across the 26 supported civilizations. The implementation retains existing painted artwork, multiplayer IDs, campaigns, technology effects and already-paid older-save research.

**All PR release checks PASSED at test commit `67d02b1b4cd2c6746e7ed0e45fee6c27619e508f`:** [Game validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40136622476); [Chromium battlefield and original art](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40136622484); [Full regression](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40136622468) with **181 standalone regression files, 19 isolated campaigns and three seeded AI skirmishes**. Initial red checks on the branch were repaired by giving older behavioral tests verified eligible civilizations rather than bypassing faction restrictions. Post-merge `main` runs: [validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40137016412), [Chromium](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40137016377), [full regression](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40137016429); evaluate their final statuses independently.

**Production verification:** Vercel deployment `dpl_EnCS7BVHLa3TXxxWy83YwK8Vctea` was READY and assigned `crown-and-kingdoms.vercel.app` with exact Git commit `81e5e949b78fc740108a87b6819dc9205a669df1` after PR merge. The previous deployment lag behind `30fb23c` was not observed. Subsequent documentation-only commits must independently verify their deployed Git SHA; do not mistake this record for perpetual production health.

**Still open:** detailed University and Blacksmith armor civilization technology restrictions; regional unit replacements, unique technologies/bonuses, naval parity, full console/controller testing, multiplayer recovery and live Xbox Series X performance. The title below records the state **before** PR verification and is superseded by this release record.

---

## 24 October 2026 — Monastery civilization restrictions (CI and production acceptance pending)

AoE2:DE Update 185872 / SiegeEngineers data blob `c4f7da961e82a8231b1ba49459949c4d6e479bc8`: enforce faction availability for all 11 already-implemented Monastery technologies across the existing 26 civilizations, including the `Indians` → Hindustanis reference mapping. Shared research lists now prevent new forbidden purchases in local/controller, AI and authenticated network actions. Paid research in old saves is grandfathered, with unchanged on-map unit and artwork identities. Added an exhaustive 26 × 11 matrix fixture with payment, multiplayer and restored-queue checks. This is **not** an assertion that all Monastery mechanics or full game parity is finished.

**Pending release checks:** GitHub regression jobs (19 campaigns, seeded active/passive AI and unit tests), browser graphics/controller flow, source validation, and eventual Xbox Series X testing. Vercel remains unverified until production serves the same commit as GitHub `main`; Vercel deployment-list API returned 403 in the initial current-state inspection. Follow-up priorities are civ-specific University/Blacksmith research, unit roster/regional lines, and simulation-level age/economy discrepancies.

---
## Reference-first Age of Empires II: DE source audit — 23 October 2026

**Canonical source list and tracked discrepancies:** [AoE2: DE reference audit](docs/AOE2_DE_REFERENCE_AUDIT.md). Requested references include aoe2database.com (unreachable in this check), aoe2.net (sunset), the historical aoe2de-api project, aoe2techtree.net (currently identifies DE update 185872) and the Age of Empires II: DE Fandom wiki. Also includes official Xbox controller and economy lessons, source-linked discrepancy table, prioritized correction backlog and test acceptance conditions. Initial verified differences include base villager movement (1.5 vs 0.8), creation time (8 vs 25s), Wheelbarrow (45 vs 75s), cart movement upgrades, generic gathering 0.8 vs individual resource rates, and substantial base militia/archer differences. **This is a first-pass inspection, not a claim that all systems already match AoE2: DE or that Xbox hardware has been tested.**

---

<!-- Warrior artwork increment: 22 October 2026 -->
CK-032/041: added Huskarl, Jaguar Warrior, Kamayuk and Shotel Warrior walking,
melee attack and matching ready poses. Animation coverage is 19/47 playable
kinds; all 47 retain base painted art. Original painted references, blue team
cloth, complete weapon silhouettes and the existing reflow packer are retained.
Gameplay, controller mappings and camera controls are unchanged. Full directions,
remaining units and physical Xbox performance remain open.
See docs/PAINTED_WARRIORS.md for prompts and verification.
Code commit: 3e2bac3a88a706e2ef6d618fc62226eed3aeb7a3.
Local: 118 targeted checks, 256 decoded raster samples and reproducible packing passed.
[Source/atlas validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39721487499)
and [Chromium graphics/layout](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39721487481) passed.
[Full regressions](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39721487522) passed: 164 standalone files, all 19 campaigns and three seeded production-AI skirmishes.

<!-- Special infantry artwork increment: 22 October 2026 -->
CK-032/041: added Woad Raider, Berserk, Samurai and Teutonic Knight walking,
melee attack and matching ready poses. Animation coverage is 15/47 playable
kinds; all 47 retain base painted art. Existing cooldown/game-time playback,
team colours and shared solo/multiplayer rendering are preserved. Gameplay,
controller bindings and camera controls are unchanged. Full directions,
remaining units and physical Xbox performance remain open.
See docs/PAINTED_INFANTRY.md.

<!-- Support and ranged artwork increment: 22 October 2026 -->
CK-032/041: added monk walking/conversion gestures, longbowman walking/firing
and throwing-axeman walking/throwing sequences, each with a matching ready pose.
Animation coverage is 11/47 playable kinds. Monk casting reads existing
conversion progress and shares paused game-time playback across renderers.
Gameplay and controller rules are unchanged. Original art remains preserved.
See docs/PAINTED_SUPPORT.md; full directions, remaining units and hardware
performance acceptance remain open.

<!-- Castle production increment: 22 October 2026 -->
CK-014/025/027: restored access to existing civilisation-specific castle units
and technologies. Shared catalogue checks now govern solo production,
authenticated multiplayer menus/commands and saved queues. Foreign entries
remain blocked; controller bindings, costs and population guards are unchanged.
All 26 implemented civilisations are exercised by production-script tests.
See docs/CASTLE_PRODUCTION.md. Reference balance/content acceptance remains open.

<!-- Raider animation increment: 22 October 2026 -->
CK-032: scouts now have horse-trot and mounted sword-attack frames; skirmishers
have walking and javelin-throw frames. Both have matching ready poses. Current
coverage is 8/47 playable kinds, with mirrored facing. Other troops, full
directions, specialised work/death sheets and physical Xbox acceptance remain
open. Gameplay, controller bindings and original assets are unchanged.
See docs/PAINTED_RAIDERS.md.

<!-- Ranged animation increment: 21 October 2026 -->
CK-032: added walking, firing and thrust frames for archers, crossbowmen and
spearmen. All six motion types now have matching ready poses. Coverage is 6/47
playable kinds; full directions, other troops and specialised work/death art
remain open. A shared extraction helper removes neighbouring fragments, with
selective cleanup of three fallback cells and the original sheet preserved.
Long weapons retain visibility at close-zoom viewport edges. Game rules and
Xbox bindings are unchanged. See docs/PAINTED_RANGED.md.

<!-- Core animation increment: 21 October 2026 -->
CK-032: added 48 original painted movement/attack poses for infantry, knights
and villagers, plus villager work playback. Shared game-time/cooldown pose
calculation now freezes on pause and retains facing without mutating simulation
entities. Fallen units keep painted artwork. Coverage is 3/47 playable kinds,
with mirrored facing; remaining roster, specialised tools, directional/death
sheets and physical Xbox performance are open. See docs/PAINTED_MOTION.md.
The previous broad CI run also exposed stale SVG-atlas and automatic-focus-zoom
assertions; these now test painted pack integration and explicit right-stick
zoom with focus preserving that zoom. Controller bindings are unchanged.

<!-- Graphics increment: 21 October 2026 -->
Painted raster artwork now replaces the rejected pixel SVG icon system in solo
and multiplayer. Textured terrain, original medieval sprites and cached team
heraldry are implemented. Full directional limb animation and physical Xbox
performance acceptance remain pending. Controller and simulation behavior are
unchanged. See GRAPHICS_ACCEPTANCE.md and docs/PAINTED_ART.md.

# Current hosting constraint — free only

The owner chose free-only hosting on 21 October 2026. This supersedes prior
Railway deployment instructions. [FREE_HOSTING.md](FREE_HOSTING.md) records the
current shutdown status, account-access gates and secure migration requirements.
The Railway service still exists: zero replicas was disallowed and automatic
approval review rejected permanent deletion without explicit deletion approval.
Sleep/no-restart/restricted-build settings were saved/read back; current compute
shutdown is not confirmed. Supabase is reachable but anonymous sign-ins are off;
its plugin/account connection and project-plan/schema inspection are pending.
No paid upgrade or completed Supabase multiplayer migration is claimed.

# Crown & Kingdoms — authoritative audit and delivery register

Updated 21 October 2026. Work continues directly on `main`.

This register tracks the 46 agreed delivery tasks. PARTIAL means implementation exists but the stated acceptance is still open. Automated checks establish only the covered scenarios. Staged Chromium rendering does not establish independent human matches, physical Xbox or deployed-service acceptance. Original code, artwork, music and campaigns remain required.

## Current verified code

- Code commit: [`78f266a`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/78f266a2722b0d5c46e8cb62a2f16196c4d64e9b).
- [Source and atlas validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39699486866): passed on GitHub Ubuntu / Node 22; 13 atlases, 1,308 animation entries and 1,980 frame references.
- [Regression suite](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39699486869): all 164 standalone test files, all 19 isolated campaign simulations and all three seeded production-AI skirmishes passed.
- [Chromium graphics suite](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39699486800): all 13 painted atlases load; 96 motion action/team lookups and 22 decoded raster action/team sequences with eight distinct frames each pass. Rendering, team colours, fog, checksum isolation, viewport-edge weapons, cache upgrades, failed-image fallback and responsive layouts pass.
- Targeted local checks: 182 passed, covering monk gesture state/paused time, shared multiplayer projection, controller contracts, authenticated live play, castle production and asset loading. Native Canvas2D inspection checked 48 new action samples and an actual battle with monk conversion; drawing preserved the world checkpoint. Both packers reproduce all committed image/manifest hashes unchanged.
- Motion coverage is now 11/47 playable kinds: infantry, knights, villagers, archers, crossbowmen, spearmen, scouts, skirmishers, monks, throwing axemen and longbowmen. All 47 retain base painted art. Full roster/directional/death animation, reference balance/content fidelity, independent-network human matches and physical Xbox acceptance remain open. See [artwork coverage and provenance](docs/PAINTED_SUPPORT.md).
- The preceding civilisation-specific castle production repair remains covered by the full suite. See [castle production evidence](docs/CASTLE_PRODUCTION.md).

These are automated and staged-rendering results. Independent-network human
full matches and physical Xbox acceptance remain separate requirements. The
milestone descriptions below include earlier stages; the painted graphics and
motion sections above supersede their older SVG-art descriptions.

## Current multiplayer and visual milestone

The authenticated battlefield now admits owned move/stop, gather, build, train, cancel, research, rally, attack/attack-move, stance, garrison, repair, building unload and transport disembark commands. Resource targets have persistent IDs; the host rechecks current sight, resource identity, ownership, routes, costs, prerequisites and building sites before mutation. Rejected orders do not enter the replay journal.

The UI projects team-relative current sight rather than the solo team-zero fog array. It draws terrain, resources, explored fog, health, original animated unit/ship/building art, selected paths and visible projectiles. A on visible resources/opponents submits gathering/attack; RT opens contextual production or construction; RT+Y changes economic/military build pages; LT repeats placement or requests five trained units. Exact wheel sectors, all special actions and physical Xbox parity remain unverified.

The graphics stage integrates original animated atlases, copied poses, kingdom palettes and stable screen-depth ordering. Foundations show scaffolding/progress; damaged buildings show smoke. Missing/failed frames retain procedural fallback. Browser validation exposed and prompted repair of 48 malformed building-atlas tags, restoring that atlas in solo as well. The effective catalogue now resolves all 50 unit keys (including the castle combat proxy) and 21/22 building definitions; farms use resource/crop tiles. New original art covers trade carts/cogs, twelve unique troops and palisades. The generator is reproducible and frame cells are clipped. Manifest revalidation and shell-cache migration prevent returning players retaining obsolete artwork. Full directional quality, isometric integration and Xbox budgets remain open.

The shelter/naval milestone adds explicit RT target modes, cargo badges and authenticated garrison/boarding, unload, repair/finish-foundation and visible-shore landing. The host rejects invalid ownership, hidden targets, incompatible selections, bad manifests, insufficient capacity and unreachable routes before mutation. Normal simulation boards, restores health and places distinct passengers on free land tiles. Long-distance garrison approach now uses a route within actual entrance range; trade ships honor repair before trading. Allied garrison sharing, full formation/control-group menus, trade assignment, diplomacy and reconnect remain unfinished. Exact wheel layouts and physical Xbox parity remain unverified.

A natural result stops simulation only after the final frame is replayed and acknowledged. Victory/defeat is relative to each human team; it is not reported as a generic network failure.

The repository now includes a combined game-and-relay host (`server/app.mjs`), an unprivileged Node 22 container and a Railway service configured through the platform API with healthchecks and one replica. The new actual HTTP hosting regression passes alongside the existing suite. It verifies public game/assets, rejected private paths, readiness, uncached API responses, two-human room membership and authenticated message identity.

Public hosting is now **DEPLOYED** at [Crown & Kingdoms](https://crown-and-kingdoms-production.up.railway.app). Railway deployment `18a93b9c-8b96-4714-aab3-e9f1443a33c8` reached SUCCESS on 21 October 2026 at `d3952c28e994c2dc11e877d7d84b8eb4c61a62fa`. The GitHub App access blocker was resolved and the existing service follows main. HTTPS game/health endpoints returned 200. Two anonymous sessions created and joined a private room with teams 0/1; test sessions were then revoked. This is hosting and room-membership evidence, not a full human-match acceptance claim.

Project ID: `c9182bd4-8f96-4f39-82f4-7e86756b5729`; environment ID: `cefb9e69-2d18-4760-bb2d-c461d940903e`; service ID: `5d37d197-7064-4a88-9ce7-39f8851f07d1`. The platform-configured Dockerfile host uses one in-memory relay process. The obsolete railway.json remains removed.

The reliability increment replaces the hard 30-minute session lifetime with a per-player idle lease renewed only by successful authenticated requests. An active player cannot keep an idle peer alive. Safe GETs and transport receipts retry HTTP 502/503/504 at most twice inside one request deadline; gameplay submissions never retry automatically. Targeted HTTP/live-session checks pass locally (42 checks). Full reconnect/resume and durable snapshots remain open.

Static Vercel hosting does not supply the Node relay process. There is no reconnect/resume or server persistence yet. See [server/README.md](server/README.md) for the actual transport contract and deployment gates.

## Delivery order

1. Finish and deploy the synchronized 1v1 service: reconnect/snapshots, remaining command families, independent-browser full matches, disconnect recovery and measured network cadence.
2. Complete the original graphics overhaul: asset inventory, faction/directional animations, main-world presentation, visual captures and Xbox frame budgets. The new battlefield is a substantial rendering stage, not the finished art overhaul.
3. Close core missing gameplay/controller features: R3 priorities and ratios, multiplayer groups/minimap/formations, remaining naval/trade/diplomacy commands, special abilities and content restrictions.
4. Finish original audio/music and reference-content matrices; complete Xbox Series S/X release acceptance.

## Task register

| ID | Prio | Track / task | Status | Implementation/evidence and acceptance requirement |
|---|---|---|---|---|
| CK-001 | P0 | Comprehensive CI failure inventory | PARTIAL — campaign runner corrected | 29 October: all 19 execute; 7 victories, 7 defeats, 5 timeouts and zero assertion failures. Defeats/timeouts do not establish victories. Earlier isolated green runs were no-ops. Hosted startup remains unverified. |
| CK-002 | P0 | Repair current regression failures | PARTIAL — assertions pass, win coverage open | 29 October: 208 standalone files and existing 19-mission assertions pass. Golden Coast now reaches a real defeat; remaining defeats/timeouts are not campaign win acceptance. |
| CK-003 | P0 | Basic complete land skirmish | PARTIAL | Three seeded passive/active production-AI land skirmishes finish naturally, including reloads. Real controller/browser matches and more seeds remain open. |
| CK-004 | P0 | AI ability to finish matches | PARTIAL | Production AI is covered by seeded active and passive skirmish results. Broader map/seed/late-game and human opposition acceptance remains open. |
| CK-005 | P0 | Current-version save round-trip | PARTIAL | Manual/autosave reference and counter validation now covers persistent resource IDs as well as units/buildings. Long browser/naval/garrison checkpoint coverage remains required. |
| CK-006 | P0 | Population and production deadlocks | IMPLEMENTED/UNVERIFIED | Recent repairs in engine.js/simulation.js. Exercise queue reservations, house loss, caps, restored games and multiple concurrent buildings in full match. |
| CK-007 | P0 | Real two-human shared multiplayer | PARTIAL — integrated battlefield | Authenticated two-client HTTP tests exercise gather/deposit, paid construction, military training, research, combat, garrison/unload, repair, transport landings and final acknowledged victory. The public relay is deployed and HTTPS room membership is smoke-tested; independent browser/controller full matches and remaining commands are open. |
| CK-008 | P0 | Multiplayer desync detection and failure handling | PARTIAL | Live stop-and-wait frame replay, ownership/sequence guards, duplicate handling, hash checks, timeout/failure and final-frame ACK are tested. Reconnect/resume and recovery snapshots remain missing. |
| CK-009 | P0 | Controller-only core game flow | PARTIAL | Solo and authenticated battlefield provide many core controller functions; full controller-only flow and Xbox hardware acceptance remain open. |
| CK-010 | P1 | Correct RT contextual wheel and site commands | PARTIAL | Authenticated RT building pages, RT+Y switching, paid training/research, build previews and shelter/naval target actions now exist. Exact reference sectors/positions and full site-command coverage require comparison. |
| CK-011 | P1 | LB/RB, D-pad and control group parity | PARTIAL | Solo groups/quick-selection/minimap have corrected bindings and saved groups. Multiplayer LB assignment/recall/counts and Y camera focus now exist; RB provides expanded map/Y focus. Minimap flares, filters/modes, waypoints and exact wheel/hardware parity remain open; see XBOX_CONTROLLER_PARITY.md. |
| CK-012 | P1 | Villager priority presets and auto economy | PARTIAL | Legacy worker targets exist. The documented R3 priorities wheel, seven presets, manual ratios and automatic-farm toggle remain missing. |
| CK-013 | P1 | Economy completeness and balance | PARTIAL | Gather/dropoff, farms, market/trade, fishing, relics implemented; verify gathering/carry/technology maths, depletion, farm wood costs, housing and economy pacing against reference. |
| CK-014 | P1 | Technology catalogue and effect integration | PARTIAL | config.js TE, engine.js civilisation unique techs, unit stat/render/AI use; enumerate every base reference tech and test prerequisites, cost, correct runtime effect and UI availability. |
| CK-015 | P1 | Damage/armour/counters | PARTIAL | Config and engine contain class data and bonuses; verify attacks against infantry/cavalry/siege/ships/structures, minimum range, ballistics, projectiles and friendly fire case by case. |
| CK-016 | P1 | Movement, collisions and pathfinding | PARTIAL | pathfinding.js, input.js, simulation.js; run land/water/ford/gate/obstacle and large group tests, verify fallback and no stranded/oscillating units. Do not infer bugs from unaudited audit claims. |
| CK-017 | P1 | Formations, stances and combat orders | PARTIAL | Solo Y immediately switches Line/Split through normal movement planning. Six menu shapes, stances and combat orders exist; authenticated multiplayer Y now submits Line/Split reformation through shared-frame replay. Full formation menus, persistent group movement and exact reference behavior remain open. |
| CK-018 | P1 | Fair AI economy and tactical scaling | PARTIAL | ai.js advanced routines exist; compare Easiest–Extreme against observed reference, exclude unsupported claims of cheat multipliers, test raids/defence/attack waves and late-game rebuilds. |
| CK-019 | P1 | Land and naval map correctness | PARTIAL | 29 October coastal campaign fleets and scripted docks use the primary navigable sea; opening path, production-exit, save/load and Chromium checks pass. Other map variants, transports, economy access and complete human naval matches remain open. |
| CK-020 | P1 | Diplomacy, alliances and victory rules | PARTIAL | kingdom.js and simulation.js support several modes and alliances; test win/lose precedence, simultaneous defeat, team relations, tribute, sudden death and scoring rules. |
| CK-021 | P1 | Save game deletion and recovery UX | PARTIAL | Manual slots, rolling autosave, IndexedDB mirrors and explicit delete UI exist; test corrupt-save delete, cancel, overwrite, restored-backup tombstones, offline quota exhaustion. |
| CK-022 | P1 | Full 19-mission campaign human acceptance | PARTIAL | 29 October latest scripted runs: 7 victories, 7 defeats, 5 timeouts; old isolated CI commands were no-ops. All 19 still require controller gameplay, triggers, save/reload, unlock and softlock acceptance. |
| CK-023 | P1 | Xbox screen readability and accessibility | UNVERIFIED | ui.js and render.js: TV distance legibility, contrast, scaling, button prompts, focus, controller disconnect and button remapping; physical Xbox Edge required. |
| CK-024 | P2 | Reference civilisation table | PARTIAL | engine.js CIV has 26 entries, bonuses and unique units/techs; compare verified **included base** Xbox reference roster, bonuses, team bonuses, restrictions and architecture one by one. |
| CK-025 | P2 | Reference unit catalogue | PARTIAL | config.js U plus engine.js Object.assign(U). List effective runtime roster after extensions, distinguish unit upgrade labels from new unit keys, identify real missing lines/abilities. |
| CK-026 | P2 | Reference building catalogue | PARTIAL | Palisades now have construction, repair, collision, destruction, procedural art and saves. Authenticated building orders cover implemented economic/military build pages; remaining catalogue functions require inventory. |
| CK-027 | P2 | Reference tech-tree UI and restrictions | PARTIAL | ui.js tech tree + config.js TE + unique technologies; cross-check civilisation availability and age/building requirements and live research effects. |
| CK-028 | P2 | Reference map and mode catalogue | PARTIAL | menus.js has 14 map-layout choices, custom presets, 7 victory conditions, 2–4 kingdoms. Enumerate base Xbox map types, mode rules, standard settings and clearly label custom additions. |
| CK-029 | P2 | Console tutorials and tooltips | PARTIAL | ui.js in-game control help and First Hearth training exist; assess guided teachability and missing accessibility assistance. |
| CK-030 | P2 | Post-match statistics and spectator/replay scope | INVESTIGATE | Verify actual end-screen stats against Xbox reference; decide whether replay/spectator are mandatory in agreed base, optional online capability or separate milestone. |
| CK-031 | P0 | Shared 2–4 human multiplayer integration | PARTIAL — two humans | Two authenticated human slots share a simulation and terminal result. Garrison/unload, trade, tribute/diplomacy, priorities/full formation menus, reconnect and 3–4 humans remain open. Browser play has no native Xbox matchmaking integration. |
| CK-032 | P1 | Original sprite/animation asset quality | PARTIAL — painted raster motion | All 47 playable unit kinds and 22 buildings have base painted art; 15 unit kinds have walking/action sequences and matching ready poses. Full directional/death animation, remaining units and physical Xbox budgets remain open. See docs/PAINTED_INFANTRY.md. |
| CK-033 | P1 | Music, ambience and feedback | PARTIAL | audio.js procedural sound; audit actual audible events, prompt initiation/resume and production-ready original sound suite. |
| CK-034 | P3 | AI and civilisation balance | UNVERIFIED | Repeatable test batteries and human matches; record win rates and concrete deviations, avoid arbitrary 1:1 numerical approximations unsupported by reference evidence. |
| CK-035 | P3 | Canvas/game-loop rendering and input profiling | UNVERIFIED | Measure simulation/draw frame time, memory/GC, p95 input delay, sprite and A* counts on real Xbox Series S first. |
| CK-036 | P4 | Xbox Series S and X release acceptance | MISSING EVIDENCE | Test declared population/map/player limits with controller and Edge; record hardware/browser build, peak memory, frame time and full-match stability. |
| CK-037 | P4 | Eight humans × 500 pop stretch target | NOT IMPLEMENTED | Separate feasibility gates: 2×200 → 4×200 → 8×200 → 8×500 with shared pathfinding, network budgets, simulation checksums and measured physical Xbox performance. |
| CK-038 | P1 | Full Xbox DLC entitlement/content scope | OPEN / REQUIRED | New owner request expands the target to all gameplay DLC available on Xbox as of 19 October 2026, including distinct Chronicles/Return of Rome variants. Catalogue editions, bonuses, units, research, scenarios and modes; verify original implementation per category. Native Xbox achievements/cloud saves/matchmaking still require separate platform architecture. |
| CK-039 | P4 | Final functional readiness sign-off | OPEN | All accepted required scenarios pass: deterministic tests + real browser 1v1/naval matches + saves + campaigns + real shared multiplayer + console controller hardware. |
| CK-040 | P4 | Final reference-fidelity sign-off | OPEN | Every required Xbox base + gameplay-DLC feature in CK-024–030, CK-038 and CK-044–046 has an explicit matched/intentional-difference/waived status supported by playable evidence. |
| CK-041 | P1 | Full original graphics overhaul | PARTIAL — animated battlefield | Original atlas animation, kingdom colours, depth ordering, construction/damage indicators and procedural fallback now render in multiplayer. Chromium captures/checksum/fog/failed-image checks pass. Full asset production, isometric camera/terrain, human match acceptance and Xbox budgets remain open. |
| CK-042 | P1 | Full original sound-effect overhaul | OPEN | Event coverage for construction, economy, combat, siege, naval, alerts and UI; audio ducking, voice caps, controller-friendly accessibility, user-gesture audio resume, performance and mix acceptance. |
| CK-043 | P1 | Original adaptive soundtrack | OPEN | Produce original menu/economy/tension/combat/victory/defeat music; loops, seamless transition, independent volume/mute/persistence, licensing and Xbox Edge tests. |
| CK-044 | P2 | All current Xbox gameplay DLC catalogue | OPEN | Enumerate and validate Lords of the West, Dawn of the Dukes, Dynasties of India, Return of Rome, The Mountain Royals, Victors and Vanquished, Chronicles: Battle for Greece, The Three Kingdoms, Chronicles: Alexander the Great, The Last Chieftains and The Viking Sagas against actual Xbox entitlements and feature matrices. No official copyrighted campaigns/assets may be copied. |
| CK-045 | P1 | Xbox Series X controller default mapping fidelity | PARTIAL | Several documented default inputs are implemented/corrected; no full Xbox parity claim. R3 priorities, remaining minimap tools/Y shortcuts, exact wheels and physical Edge/controller acceptance remain open. |
| CK-046 | P2 | Xbox DE feature-family gap closure | PARTIAL | Recent core work closes palisade, Line/Split and authenticated economic/combat gaps. Complete feature-family inventory still needs special abilities, remaining multiplayer types, replay/spectator/editor/co-op dispositions and DLC mechanics. |

## References and historical evidence

- [Full Xbox content, multiplayer and media scope](XBOX_SERIES_X_FULL_PARITY_AND_MULTIPLAYER_PLAN.md)
- [Current controller contract](XBOX_CONTROLLER_PARITY.md)
- [Historical engineering log](AOE2_PARITY_ROADMAP.md)
- [Historical register and prior evidence](https://github.com/johnstacey16-ui/crown-and-kingdoms/blob/e9c1b6c737821176469773773b1b649c7467b22b/MASTER_AUDIT_AND_DELIVERY_REGISTER.md)

The expanded register was recovered from repository history after its contents had been replaced by relay documentation. Historical CI figures remain historical evidence; the current code baseline is the one explicitly linked above. No completion percentage is inferred from file or test counts.

## Multiplayer Line/Split increment — 21 October 2026

Military Y now requests authenticated Line/Split reformation for groups of at least two owned military units. The host precomputes all routes before mutation, keeps land/naval centres separate, rejects invalid membership and unreachable groups, and replays accepted orders through the existing journal. Unit formation choice participates in checkpoints and current saves. Selection and solo formation preference remain local and unchanged. Pending actions, cancellation, menus and focus/controller gesture resets consume held shortcut input. Handshake `ck-live-preview-9` rejects older clients.

Targeted local checks cover both teams over real HTTP with per-frame production hash agreement, safe rejection, separate movement classes, save restoration and Y cancellation. These checks are not physical Xbox acceptance. Full formation wheels, persistent formation-aware group movement, remaining contextual Y shortcuts and reconnect remain open. The controller guide linked in XBOX_CONTROLLER_PARITY.md confirms military Y's Line/Split role; exact geometry and gestures remain provisional.

## Multiplayer control-group increment — 21 October 2026

The eight-slot LB wheel now assigns and recalls owned local selections with live availability counts. X copies eligible IDs; release after assignment does not recall another slot; ordinary release recalls the highlighted group. B cancels, and empty assignment clears a slot. Ownership changes, deaths and garrisoning remove availability without rewriting the stored group, so unloading restores surviving members. UI session/team changes isolate groups. Assignment/recall do not mutate simulation, solo groups or checkpoints; subsequent gameplay uses existing authenticated command validation.

Local unit tests cover all slots, snapshot isolation, pending-command local selection, invalid/unavailable membership, cancellation and completed town-group training requests. The real HTTP test recalls independent groups for both humans before synchronized Line/Split orders with per-frame production hash agreement. The Chromium suite captures the original group wheel and checks recall/checksum isolation. LB+Y camera focus, full camera/minimap integration, exact wheel parity, persistent multiplayer groups and physical Xbox acceptance remain open.

## Battlefield camera and map-focus increment — 21 October 2026

LB+Y now focuses an available group's first member in a clamped 2× local viewport. RB opens a full-map modal view with the existing team-relative observation data and current viewport outline; Y focuses its cursor. The normal cursor pans near view edges. Terrain, sprites, paths, construction previews and cursor use the same world transform; menus/instructions remain screen-sized. Pointer commands invert that transform, and focused double selection excludes offscreen entities. Closing/cancelling the minimap restores the prior camera/cursor and never issues an order. Camera changes remain outside simulation/checksums.

65 targeted local tests pass, including real HTTP group focus followed by shared formation execution with matching checkpoints. The Chromium suite captures focused battlefield and expanded-map views and checks fog/checksum isolation. Remaining map tools (flares, detail/economic/military filters, waypoint clearing), exact camera/zoom/edge settings, isometric presentation and physical Xbox acceptance are open. Earlier increment notes that called group focus unavailable are superseded by this section.

## Camera validation and deployment gate — 21 October 2026

Code `d7a169d999db4c18bc752aa43cec9ff81e080e24` passed [validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39532755525), [Chromium graphics/camera](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39532755526) and [full regressions](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39532755628), including all campaigns and AI skirmishes. Artifact `12316465728` contains the focused-world and expanded-minimap captures; both were downloaded and visually inspected. Focused rendering preserves hidden-enemy exclusion and the production checksum.

**Deployment note — 21 October 2026:** camera/group-focus/expanded-minimap code `d7a169d999db4c18bc752aa43cec9ff81e080e24` passed all CI, but is **not live yet**. Railway source-connect retries returned `Deploys have been paused temporarily`. The latest successful live release remains control-group code `f1240f8641cd66f677e848313017a9cfbf0c2aab` (deployment `e45c0f31-b149-4165-86ef-bb93abb5828b`). Reconnect the existing service to main when the platform accepts deployments again; no new project or service is needed.

The public status page reported Fully Operational during this check, so no cause or broad outage is inferred from the service API rejection. The exact Railway control-plane response above is the deployment blocker. No successful deployment of the camera code is claimed.


## Objectives and reachable Free multiplayer preview — 21 October 2026

Owner reaffirmed full Xbox Series X AoE II: DE functional/controller and
Xbox-available DLC coverage, optimized for Xbox Edge with Supabase multiplayer.
This target is now also explicit in AGENTS.md; the current subset is not complete.

Game commit `97ef6efc1e6227b47193edd6ce0689f0ba17fb7d` adds Objectives to the running
multiplayer menu. It reads verified shared settings for all seven currently
implemented victory modes, shows game time or score-limit time remaining, returns
to the parent menu on B/Escape, and resumes on Menu. It reveals no opponent state
and submits no orders. The game continues while either player reads Objectives.
Local startup/live/session/HTTP/Auth/peer checks passed 68 tests. Real production
browser run [39556611925](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39556611925)
also verified Objectives during peer gameplay. The official Xbox guide's Pause
Menu section confirms Objectives belongs there and multiplayer does not pause:
https://www.ageofempires.com/learn-to-play/controlling-your-empire-gathering-resources-xbox/ .
Exact Xbox menu presentation and physical input are still unverified.

Game commit `7ed3de058a1d950060bd86e819a2aecba3c53076` connects the existing
controller-accessible battlefield-preview entry to the authenticated Supabase peer
provider, loads it in the production shell and caches it in SW v11 without
connecting on load. [Production controller-path browser acceptance 39578735274](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39578735274)
passed 120 matching frames, both paid training orders, Objectives while running,
final ACK and Leave. It checks all 15 deployed source assets first. The static
validator was updated in `ed5ce19864f61dbe20345c361f88939c23053c1c` to require the
new dependency order. [Responsive browser run 39578735675](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39578735675)
verified the real menu entry at desktop/390/320 widths and selected the peer
factory without signing up. See FREE_HOSTING.md for measured traffic and limits.

Still open: independent-router/mobile connectivity, physical Xbox Edge complete
match and controller acceptance, sustained performance, anonymous-user retention,
reconnect, more humans, full menu/feature/content/DLC/graphics/audio coverage and
Railway shutdown. There is no full-game, full-DLC or universal-connectivity claim.


## Authenticated military Patrol and Attack Move — 21 October 2026

The multiplayer military RT menu now exposes Patrol and Attack Move. Both enter
local ground targeting and submit only when A chooses a destination; B, menus,
selection changes and suspension cancel targeting. No input changes simulation
before host execution. The host validates current ownership, living ungarrisoned
military membership, strict map coordinates and every outbound route before
replacing any selected unit's orders. Soldiers and warships use production
pathfinding. Patrol returns to its starting point and repeats; Attack Move ends
at the destination. Both retain the production combat interruption/resumption
policy and clear conflicting retreat/unload work. Unexplored ground is allowed;
entity-targeted attacks still require current sight. Handshake ck-live-preview-10
excludes older live clients; shell cache v12 updates the command modules.

Focused local tests cover both teams and movement classes, arrival behavior,
invalid inputs, atomic route rejection, RT confirmation/cancellation and pending
orders. A real authenticated HTTP pair exercises both RT actions with production
movement and matching checkpoints on every checked frame. Browser graphics CI
now captures the military menu and checks typed ground targeting without local
world mutation. Full regression/browser results are recorded in the change PR.

The official Xbox Controls guide documents Patrol and Attack Move under the RT
military command menu. Exact sectors, target gestures, formation spacing, combat
behavior fidelity and physical Xbox Edge acceptance remain unverified. Trade,
tribute/diplomacy, priorities, reconnect and additional humans remain open.

## User-reported feature gaps and first corrections — 21 October 2026

The owner identified projectile homing, missing monk/religious research, missing
ranged/naval/economic technologies, incorrect age prerequisites, incomplete
civilisation/naval catalogues and unfinished original audio/graphics. These are
accepted implementation work, not waived parity requirements.

| Feature family | Current disposition |
| --- | --- |
| Ballistics and dodgeable missiles | Implemented foundation: fixed launch-time aim for ranged shots; University Ballistics predicts constant path-segment movement for explicit arrow families and Scorpions. Later course changes can miss. No random accuracy spread, pass-through/secondary collisions, elevation or reference projectile-speed parity is claimed. Existing siege splash centres on the fixed impact point. |
| Fletching / Bodkin Arrow / Bracer | Implemented attack/range/sight chain for explicit arrow weapon families. Blacksmith costs, age/prerequisite checks, paid research, AI priorities, combat range/pathing and unit HUD are connected. Town Centres gain attack/sight without attack-range growth. Legacy atkR/atkR2 keys are retained for saved flags. Full per-civilisation availability/bonus auditing remains open. |
| Age advancement | Corrected to distinct eligible buildings: Founding uses lumber/mill/mine/Barracks/Dock; Feudal uses Range/Stable/Blacksmith/Market; Castle uses Siege Workshop/University/Monastery, or one completed Castle. Dead, unfinished and foreign structures do not count. Barracks/Dock and Militia/Fishing Ship become available in the starting age. Human research, solo menu, multiplayer menu and AI use the shared eligibility helper. A dock is never mandatory. AI caps starting-age Militia at three rather than spending its advancement food indefinitely. |
| Monk suite | OPEN: Faith, Heresy, Redemption, Atonement and remaining reference monastery technologies need individual mechanics, paid research, AI/UI/save/multiplayer and civilisation availability acceptance. Existing basic conversion/healing/relic behavior is not the full suite. |
| Murder Holes | OPEN: requires explicit defensive minimum-range behavior and research removal, including valid-target selection around fortifications. |
| Naval/economic technologies | OPEN: Careening, Dry Dock, Shipwright, Gillnets and the current naval technology families. The February 2026 official Xbox update moves the first three to the University, changes Dry Dock to pierce armour, and changes Gillnets to gathering/carrying with Fishing Lines as its precursor. Do not implement obsolete pre-update placements/effects as current Xbox parity. |
| Naval roster | OPEN: Fire/Demolition/Cannon Galleon and other required naval lines, their upgrades, abilities, counters, art/audio and AI. The 2026 naval update also adds new ship families and shared Medium/Heavy Warships upgrades; the existing Galley-only combat roster is not complete. |
| Civilisations | PARTIAL: existing 26 entries do not establish current Xbox base/DLC roster coverage. Complete functional per-civilisation restrictions, bonuses, units, technology trees and separate antiquity/Chronicles rules remain required. |
| Audio and graphics | PARTIAL: synthesised Web Audio and Canvas2D with original SVG atlases remain the current pipeline. Full original sound/music production, coherent terrain/camera/animation coverage and measured Xbox readability/performance acceptance remain open. |

Projectile impact coordinates are included in multiplayer checkpoints and current
saves. Missing legacy aim fields migrate once to a fixed aim; corrupt aims reject
before replacing a world. New launches snapshot the shooter's kind/team. Live and
WebRTC handshake ck-live-preview-11 reject incompatible simulation clients; shell
cache v13 refreshes changed scripts. No infrastructure/billing changes are made.

Named local evidence: tests/reference-age-projectiles.test.mjs exercises every
eligible two-building combination for both teams, the Castle exception and invalid
prerequisites; paid attack/range upgrades and excluded weapon classes; leading,
dodging, siege impact splash, save restoration/legacy migration and checkpoint aim
sensitivity. tests/network-battlefield-live.test.mjs adds real authenticated HTTP
research and moving-target fire with per-frame matching production hashes.
Full main CI and physical Xbox acceptance remain separate release evidence.

Official references checked 21 October 2026:
- https://www.ageofempires.com/learn-to-play/advancing-to-the-next-age-xbox/
- https://www.ageofempires.com/news/a-new-naval-warfare-in-age-of-empires-ii-definitive-edition/
- https://www.ageofempires.com/news/aoeii_de_update_56005/
- https://www.ageofempires.com/news/age-of-empires-ii-definitive-edition-update-preview-125283/

## Main validation for projectile/technology/age corrections

Code `e133a3dbaba8464ab2517d7f7b7a4a6f6f6de203` passed all main checks on 21 October 2026:
- [Regression 39583393316](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39583393316): 160 standalone files, all 19 isolated campaign missions and all three seeded production-AI skirmishes, including save/reload scenarios.
- [Source/atlas validation 39583393370](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39583393370).
- [Chromium graphics/menu/responsive checks 39583393348](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39583393348). Artifact 12338262137 was downloaded; ballistics-research-menu.png was visually inspected and shows the unlocked University entry, cost and RT+A prompt.
- [WebRTC browser transport 39583393367](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39583393367), including the new versioned channel.

These are named Node/Chromium checks, not physical Xbox or independent-network full-match acceptance. The remaining feature-family gaps listed above remain open. All changes were committed directly to main as requested.


## Monastery research, authenticated conversion and Murder Holes — 21 October 2026

Implemented eleven Monastery technologies: Devotion, Faith, Heresy, Redemption,
Atonement, Sanctity, Fervor, Block Printing, Illumination, Theocracy and Herbal
Medicine. Research uses the existing paid building queue, duplicate/age/budget
checks and selected-building RT controls in solo and authenticated multiplayer.
Faith requires Devotion. Sanctity upgrades living and future Monks without
removing prior damage; Fervor changes speed; Block Printing changes conversion
range and sight. Faith percentage/conversion range are shown for solo Monks and
faith is exposed in the owned multiplayer selection description.

Conversion now has target-class/research restrictions, seeded interval attempts,
per-target identity/owner binding, current hostility/ownership checks and a
normalised faith resource. Base unit attempts use seconds 5–9 with 40% interval
rolls and a forced maximum; Devotion/Faith add resistance time, with separate
Scout/ship windows. Illumination doubles faith regeneration. Heresy kills a
converted unit instead of transferring it. Theocracy preserves the other Monks'
faith when the same-target group succeeds. Without it, those casters recharge.
Redemption supports siege and adjacent eligible buildings; Atonement permits
Monks. Successful building capture cancels its old training/research/rally
without refunding its previous owner's budget. Stable entity IDs remain.

Authenticated contextual A and RT Convert send strict typed commands, with
current-team sight, owned eligible Monks and all-member route validation before
orders change. No optimistic conversion occurs. The host rechecks ownership for
subsequent commands. Existing fail-stop handling of unauthorised network packets
is preserved; this increment does not redesign rejection/reconnect receipts.
The bounded technology-ID validator now permits the catalogue's existing camel
case keys (e.g. murderHoles/atkR), while retaining exact fields and semantic
simulation validation. Conversion progress, interval, bound target/owner and
faith participate in checkpoints and validated saves. Protocol/channel 12 and
shell cache v14 exclude older simulation clients.

Murder Holes is University research. Towers/Castles skip targets less than one
tile from their footprint until researched, and continue looking for a farther
eligible enemy rather than being blocked by the nearer target. Town Centres
retain zero minimum range. Herbal Medicine adds the researched 6× garrison-heal
rate for current, living, correctly owned building passengers; transports do not
receive building healing. Monks no longer heal themselves.

**Acceptance limits:** this is feature coverage, not full version-locked Xbox
parity. Occupied buildings and loaded transports are deliberately unavailable
conversion targets pending verified passenger capture/ejection semantics. Exact
conversion-resistance chance modifiers, target-switch timing, group membership,
converted-unit stat inheritance, civilisation-specific restrictions/free techs,
full unit/DLC exception catalogues, visuals/audio feedback and physical Xbox
controller/performance acceptance remain open. No new bindings or infrastructure
were introduced. Remaining naval/civilisation/media work is still required.

Reference evidence:
- Official conversion/Devotion/Faith balance: https://www.ageofempires.com/news/age-of-empires-ii-definitive-edition-update-99311/
- Official group faith/Theocracy correction: https://www.ageofempires.com/news/age-of-empires-ii-definitive-edition-update-107882/
- Current extracted tech costs/times and descriptions: https://github.com/SiegeEngineers/aoe2techtree/blob/master/data/data.json and data/locales/en/strings.json, read 21 October 2026; data blob c4f7da961e82a8231b1ba49459949c4d6e479bc8, English descriptions blob c3db0331c195b389615f3353c76561f57556ec02. These are reference-data snapshots, not a recorded physical Xbox build. They include newer Devotion/Sanctity/Block Printing costs than older manuals.

Local tests: monk-technologies.test.mjs covers all twelve paid techs, real stat,
faith, resistance, Heresy/Theocracy, target-class/cargo/ownership/path validation,
Murder Holes target selection, garrison healing, save/checksum fields, RT and
contextual A. The authenticated HTTP pair researches Atonement and converts a
human-owned Monk with matching production hashes on every frame, then checks
that the former owner's production command is refused. All 19 isolated campaign
missions passed locally. Main CI results are recorded separately below.

## Main CI acceptance for Monastery/Murder Holes increment

Code `2ea9efa796f4ca306988a493c277348ddc93cda6` passed all named main checks on 21 October 2026:
- [Regression 39588987534](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39588987534): all 161 standalone files, all 19 isolated campaign missions and all three seeded production-AI skirmishes.
- [Source/atlas 39588987673](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39588987673).
- [WebRTC Chromium transport 39588987539](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39588987539).
- [Chromium graphics/controllers/responsive room 39588987417](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39588987417). Artifact 12339554329 was downloaded; monastery-research-menu.png and monk-convert-menu.png were visually inspected. Browser assertions verify Atonement's unlocked research entry/cost, RT Convert, the typed hostile target and unchanged simulation checksum before host execution.

All code and this evidence record were committed directly to main. These checks
are Node/Chromium acceptance; physical Xbox, full civilisation-specific parity
and the occupied-container conversion limitations above remain outstanding.


## Camera control correction — 21 October 2026

The owner reaffirmed matching AoE II: DE Xbox controls as the target. The official
[default-layout cards, updated 8 May 2026](https://support.ageofempires.com/hc/en-us/articles/37041870568468-Age-of-Empires-II-Definitive-Edition-Default-Controller-Layouts)
confirm LS camera pan and RS zoom in general gameplay. Implemented direct analog
zoom in solo/campaign and multiplayer, removed RS panning, preserved world-anchored
A boxes, and prevented LT/menu contexts from leaking camera zoom. Multiplayer
focus preserves the user's zoom; camera input never enters the command transport.
The optional solo slider is supplemental, rather than the normal zoom mechanism.

Status: PARTIAL parity. Current minimum, sensitivity, axis-direction convention,
reticle behavior and initial framing need Xbox build/hardware comparison. R3
priorities, View notification snapping, contextual X, LT Find/category/waypoint
controls and other previously recorded gaps still need implementation/acceptance.
Do not treat this camera increment as full game, full controller or DLC parity.

Camera validation at code commit `ad82b533fa740a8182fb000e9ffe75aa784a8c62`:
125 targeted Node checks and game validation passed. The hosted
[Chromium graphics and room-layout run 39657103778](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39657103778)
passed, including direct analog zoom, zoom preservation through group focus,
fog and unchanged game checkpoints. Physical Xbox acceptance remains open.

## Villager movement, work-site routes and painted poses — 22 October 2026

Status: PARTIAL live-game acceptance; targeted implementation and automated coverage committed to main.

- Villagers discard obsolete queued travel waypoints and retry timers when gathering or constructing at a work site. Work proceeds without holding an old walking route.
- Solo and team-relative multiplayer pose projections share a presentation-only position cache. A queued waypoint alone does not sustain indefinite walking; actual displacement and a short initial-route grace window control walking poses. Gather/build work poses take precedence when in range. Monk movement continues to take precedence over conversion gestures, with attack/cast precedence otherwise unchanged.
- Regression scenarios cover travelling and arriving at resources, work-site path clearing, building progress, stationary-route animation stopping, resumed displacement, and rerouting after a waypoint becomes blocked. No new controller binding, paid hosting or simulation/network entity field was introduced.
- CI: [Game validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39732994776), [Chromium battlefield](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39732994819), [regression suite and 19 campaign missions](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39732994982). These are code/Chromium checks, not a claim of physical Xbox Edge or owner's live-save visual acceptance.
- The active skirmish regression separately accepts a scripted win before an AI coordinated raid; passive skirmishes still independently require an AI raid. This does not waive production AI behaviour in the passive skirmish.


## Shared construction stages and large-army tint measurements — 30 October 2026

Status: PARTIAL graphics overhaul. Main receives four shared native-art construction reveals and original timber scaffolds for all 22 building kinds/four palettes, with unchanged completed pixels and no additional textures. Both views use the same painter; visible-only solo observations retain hidden progress. This is not dedicated construction/damage sheets or faction architecture. See docs/BUILDING_CONSTRUCTION.md and docs/verification/construction-2026-10-30.json for the runtime commit and rollout evidence.

Local acceptance: 216 standalone regression files, complete Chromium graphics, source validation and inventory check pass. Chromium verifies 88 kind/palette combinations, distinct stages, zero completed-image differences, real caller integration, fog observation and unchanged checkpoints. Stone, gold and berries remain covered.

Large-army measurements cover both renderers at 200/800 normal units and 800 all-roster/four-palette units. Normal warm hit rates reach 100%; diverse warm rates remain 65.61% solo /49.29% team within the unchanged 128MiB retained motion pixel cap. The tested frequency-admission alternative regressed solo stress hits and was discarded. Retained counts/pixels are not process/GPU memory or Xbox FPS. Dedicated damage/effects/interface art, architecture variants, diverse cache churn, actual-origin browser installation and physical Xbox acceptance remain open. No controls, paid resources, hosting settings or simulation fields change.
