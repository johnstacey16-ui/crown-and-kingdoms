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

# Battlefield graphics acceptance

## Current painted raster presentation — 21 October 2026

The user rejected the pixel SVG icons. The default renderer now uses original
painted WebP artwork: 47 playable troop types, 22 building types, three building
combat proxies, forest clusters and six terrain materials. The pixel-icon
collection has been removed from `js/render.js`; old optional atlas files are
preserved for history but are no longer in the default asset manifest.

Both battlefield renderers use transparent sprites, cached team-cloth recolouring
and the same validated frame bounds. Missing assets retain procedural fallback.
Infantry, knights, villagers, archers, crossbowmen, spearmen, scouts, skirmishers, monks, longbowmen, throwing axemen, Woad Raiders, Berserks, Samurai Teutonic Knights, Huskarls, Jaguar Warriors, Kamayuks and Shotel Warriors now have
eight-frame walking/attack sequences;
villagers also have a shared pickaxe work cycle; monks have conversion gestures. Other units retain base poses
with subtle motion. Full roster and eight-direction animation remain unfinished.
See [current motion coverage](docs/PAINTED_WARRIORS.md). This is a graphics increment,
not a claim of complete AoE II DE fidelity or physical Xbox performance acceptance.

Native Canvas2D scenes verify solo/multiplayer rendering without world-checkpoint
changes or camera-generated orders. CI checks actual WebP dimensions, complete
catalogue coverage, HTTP MIME/security, controller contracts and Chromium rendering,
team colours, cache migration and failed-asset fallback. See
[art provenance](docs/PAINTED_ART.md) and [gameplay preview](docs/painted-gameplay-preview.webp).

## Superseded pixel-icon presentation — 21 October 2026

The user requested small, clean medieval pixel-art SVG icons in place of unit
and building placeholders, with all definitions grouped at the top of the
rendering file. `js/render.js` now starts with 69 named standalone SVGs, followed
by the unit/building lookup tables. All 50 runtime unit keys (47 playable units
plus three building attack proxies) and all 22 building definitions resolve.
Solo, campaign, farm tiles and multiplayer share this collection. Gameplay,
controllers, unit definitions and simulation rules are unchanged.

Each SVG uses a 32×32 integer rectangle grid. Its `currentColor` regions use
the actual owning kingdom's colour. Rasterising at native size before scaling
avoids the softened edges produced by drawing fractional rectangles directly.
The raster cache is shared across sizes and separated by icon and team colour;
no SVG image request or asynchronous decode is required for game rendering.
Selection, health, construction, damage and ownership indicators remain.

The updated browser graphics suite checks SVG parsing, pixel equivalence for
all four team palettes, sharp scaling, coverage, rendering precedence, fog and
world-checksum isolation. Its contact sheet contains all 69 icons at 16, 32 and
48 pixels for two teams. Legacy atlas animation is no longer the expected
appearance for these icons; old atlases remain available for future unmapped
types. The browser-foundation check also permits the required top-of-file
SVG section.

Local native Canvas2D checks matched all 276 icon/team combinations against
independent SVG rasterisation and checked hard edges at four play sizes.
Solo and multiplayer scene captures were visually inspected; multiplayer
rendering preserved the world checkpoint. Chromium and physical Xbox Edge
acceptance remain separate gates; native rendering does not establish either.
The broad campaign smoke test has a pre-existing mission 3 timeout, reproduced
on the unchanged baseline with identical state. Graphics work does not alter it.

At code commit `cb3f8c17db1a679590793cc8e237ba954d669739`, all 53 targeted
local regressions and game validation passed. The hosted
[Chromium graphics and room-layout run](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39607987905)
also passed, including the SVG pixel comparisons, team projections, unchanged
world checkpoints, cache upgrades and rendering with external atlases blocked.
Physical Xbox Edge acceptance is still outstanding.

The sections below record earlier atlas-based stages and their historical
acceptance evidence; they do not describe the current default icon presentation.

Verified code: [`f8eee4d`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/f8eee4dae8d725dafaf9965289b4919e8333912e).
Work continues directly on main.

## Implemented stage

Multiplayer now consumes the original local unit, ship and building SVG atlases.
The team-relative view copies idle, movement, attack and work poses. Shared world
time selects frames; rendering never changes simulation facing, paths or orders.
Heading lookup uses each animation's direction count, while existing solo
direction-index callers retain their behaviour.

Both kingdoms share stable screen-depth ordering. Kingdom palettes, relation
markers, health/selection, passenger counts and rally/path indicators remain
visible. Foundations have construction tint, scaffolding and progress; damaged
completed buildings emit smoke. Missing frames and failed or undrawable images
retain procedural fallback. The camera remains a top-down strategic map with
anchored sprites; the full isometric camera/terrain overhaul is unfinished.

Chromium found 48 malformed path tags in the original building atlas. Repairing
those tags makes the full atlas load in both game modes. The static validator
now rejects unclosed opening tags, and browser checks parse every SVG.

## Effective runtime inventory

Asset presence establishes coverage, not visual quality or distinct animation
for every action. The existing artwork was integrated; this stage does not
claim a newly produced complete art catalogue.

| Catalogue | Runtime kinds | Atlas kinds | Remaining |
|---|---:|---:|---|
| Units | 50 | 50 | All runtime keys resolve; includes castle combat proxy |
| Building definitions | 22 | 21 | Farms use crop/resource tiles |

Dedicated new original art now covers trade carts/cogs and the twelve missing
unique troops: Conquistador, Genoese Crossbowman, Boyar, Tarkan, Huskarl, Jaguar
Warrior, Plumed Archer, Kamayuk, Shotel Warrior, Gbeto, War Wagon and Magyar
Huszar. The `cs` key is a castle attack proxy rather than another playable
troop; it reuses the existing original castle frames. Palisades have their own
timber/flag atlas.

Trade and unique-force entries provide eight addressable directions and two
frames for idle, walk, attack and work, for each of four kingdom palettes.
This establishes coverage; perspective-specific facing quality, additional
motion frames and reference fidelity still require review. Atlas cells are
clipped to prevent adjacent-frame bleed. Some existing building entries are
static frames.

There are seven atlases and 1,172 animation entries: upright troops (48), legacy
troops (36), detailed forces (512), detailed buildings including proxy aliases
(336), trade (32), new unique forces (192) and palisades (16).

## Reproducible assets and update behaviour

`scripts/build-extended-atlas.mjs` generates the original trade, unique-force and
palisade SVG files and updates their manifest metadata. `--check` verifies the
committed outputs without writing them. The catalogue regression checks every
effective unit key/team/state and every sprite-backed building rather than
silently accepting newly introduced placeholders.

The manifest request now revalidates cached HTTP metadata (`cache: no-cache`).
Service-worker shell version `ck-shell-v10` retires old cached SVG artwork.
Chromium tests prime an obsolete long-lived HTTP manifest and an old shell
cache, activate the replacement worker, then verify all seven atlases load on
reload.

## Verification and captures

- [Source/atlas validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39514666040): passed.
- [Regression suite](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39514665643): 156 standalone files, 19 campaign
  simulations and three seeded production-AI skirmishes passed.
- [Chromium graphics suite](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39514665634): passed.
- [Rendered screenshots and metrics](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39514665634/artifacts/12307765695):
  `team-zero.png`, `team-one.png`, `fallback.png`, `extended-art.png`, `metrics.json`.

The browser suite serves actual production scripts and local assets through
`server/app.mjs`. It checks Chromium SVG parsing and loading, source-frame
changes, both team projections, a hidden opponent, checksum isolation and a
render with every atlas request deliberately failed. Captured views were also
visually inspected for basic asset, fog and indicator rendering.

The 60-refresh staged timing is recorded in the current browser artifact.
It is not an Xbox frame budget or a large-battle benchmark. These are staged
rendering scenes, not full two-human browser matches. Separate HTTP regressions
cover synchronized game commands.

Reproduce on supported Ubuntu 24.04 after installing the development tools:

```sh
npm install --no-save --package-lock=false playwright@1.56.1
npx playwright install --with-deps chromium
node tests/browser/battlefield-art.mjs
```

## Remaining acceptance

1. Improve the directional silhouettes, motion frame count, unit proportions and faction architecture beyond basic complete catalogue coverage.
2. Review each faction, state, direction and anchor at play scale; complete
   distinct construction/damage/action art and improve readability.
3. Complete isometric camera/terrain integration and benchmark large land/naval
   battles, memory and frame times on Xbox Series S/X Edge.
4. Run physical-controller solo/campaign and independent-browser multiplayer
   matches through fog, garrisons, transports and asset failure.

## Multiplayer control-group wheel

The battlefield draws an original eight-slot wheel with group numbers, current available counts, highlighted slot and LB/X/B instructions. The Chromium suite performs local assignment/recall, verifies the gameplay checkpoint stays unchanged and writes `control-groups.png` alongside the existing art captures; `metrics.json` includes the group result. This covers browser drawing and basic local interaction, not Xbox readability, exact reference sectors or LB+Y camera focus.

## Focused battlefield camera

World layers now support a local focused 2× viewport; original SVG art scales with terrain, paths, foundations, health/cargo markers and cursor. Menus and instructions stay at screen size. `focused-world.png` and `expanded-minimap.png` are captured by Chromium after LB+Y focus. The suite verifies camera changes leave production hashes unchanged and do not expose the hidden opponent. Node tests cover inverse pointer mapping and current-viewport double selection. This is a top-down camera/presentation stage; isometric projection, zoom/edge tuning and Xbox image/performance acceptance remain open.

Camera evidence: [Chromium run 39532755526](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39532755526) passed at `d7a169d999db4c18bc752aa43cec9ff81e080e24`. Artifact `12316465728` includes `focused-world.png` and `expanded-minimap.png`; both were downloaded and visually inspected. Camera metrics report a 2× viewport, unchanged world hash and preserved hidden-enemy exclusion. This code is pending Railway deployment because the platform API temporarily rejected deploys; the live release remains `f1240f8`.


## Responsive multiplayer room presentation — 21 October 2026

The authenticated setup screen now groups private-room admission, shared-map
preparation and kingdom controls into responsive bordered panels. It uses the
existing navy/gold game palette, a serif title, a separate connection-status
banner, visible focus rings and distinct disabled controls. Panels stack at
600 CSS pixels and below. This changes presentation, not controller mappings,
room ownership, commands, fog, checksums or the selected transport.

Real Chromium exposed an existing global-input issue: the engine suppressed
native Tab/Enter and wheel behavior in the HTML room dialog. The engine now
preserves keyboard defaults, context menus and wheel scrolling inside
`.ck-room-overlay`; game-canvas handling outside the dialog is unchanged.

[Browser acceptance 39550895539](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39550895539)
passed on `7b9fa8a965c40f0124e614d5161a7bfd6204d528`. The production page was
checked at 1280×900, 390×844 and 320×640: no horizontal overflow, two desktop
columns, stacked phone panels, initial Create focus, native Tab to the invitation,
visible focus, wheel scrolling and Enter activation of Leave. Opening the screen
made zero Supabase or multiplayer API requests. The existing original-art, fog,
checksum-isolation and image-fallback browser checks also passed.

Artifact `12323766339` contains `room-1280.png`, `room-390.png`,
`room-320.png` and `room-layout.json`; all three captures were downloaded and
visually inspected. Phone captures may show a scrolled position while the
invitation has keyboard focus. The local startup/live-session suite passed 33
checks after regrouping the controls. The earlier full game regression run
[39550084577](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39550084577)
also completed successfully before this presentation update.

This is the room-screen portion of the graphics overhaul. Isometric rendering,
physical Xbox image/control acceptance, actual phone touch testing and the wider
graphics requirements above remain open. The faster peer provider remains opt-in;
Vercel team access/Free-plan verification, production-origin and separate-network
acceptance are still rollout gates. No Railway redeploy or paid feature was enabled.


## 30 October 2026 — construction reveal and large-army measurements

See docs/BUILDING_CONSTRUCTION.md and its verification files. All 22 building kinds/four palettes now share four construction reveals and original scaffold details in both views. The completed artwork is pixel-identical; hidden solo progress retains its last observation. All 216 standalone tests and complete Chromium graphics pass locally. Stone/gold/berries, artwork fallbacks and checkpoint isolation remain covered. No new texture memory is introduced.

Real-view 200/800-unit normal scenes reach 100% warm tint hits; the 800-unit all-roster stress case reaches 65.61% solo /49.29% team, peaking at 548/553 retained motion canvases within 128MiB nominal RGBA storage. An admission experiment regressed and is not shipped. These are synthetic desktop canvas-count/retained-pixel measurements, not Xbox performance or process/GPU memory. Dedicated construction/damage sheets, faction architecture, effects/interface work, diverse-scene cache optimization and physical Xbox acceptance remain open.
