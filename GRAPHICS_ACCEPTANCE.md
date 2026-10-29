## 29 October 2026 — Complete current-roster motion artwork

**CK-032 / CK-041 remain PARTIAL; all 47 current playable kinds now have painted movement/activity sheets.** Elephant Archer, War Elephant, Battering Ram, Bombard Cannon, Trebuchet, Mangonel, Scorpion and War Wagon gain sixteen-pose sheets and matching ready poses. Reviewed strike/release cells start the cooldown-driven action cycle. Existing foot/cavalry/vehicle envelopes, four team colours, pause and original-art fallback remain; cart and war wagon overlays now use vehicle dimensions. Gameplay, commands, controller bindings and save fields are unchanged, as are all earlier WebP object hashes.

All 211 standalone files, source/51-atlas/inventory checks and the complete Chromium battlefield suite passed locally. The new helper decodes 512 samples across eight kinds/four colours, verifies eight distinct poses per sequence, selected impact cells, pause and actor/world checksum isolation. The 128-pose packed sheet was inspected. Both manifests and every motion WebP reproduce byte-for-byte on a no-argument rebuild. Stone, gold and berry resource checks still pass. Shell v35 includes all eight assets. See [artwork and scope](docs/PAINTED_SIEGE_ELEPHANT_MOTION.md), [exact prompts](docs/painted-siege-elephant-prompts.json) and [verification](docs/verification/siege-elephant-motion-2026-10-29.json).

47/47 is current-roster art coverage, not eight independent directions or a finished graphics overhaul. Work/death art, activity-event integration, faction/age architecture, effects, interface and physical Xbox Series S Edge acceptance remain in the [whole-game checklist](docs/GRAPHICS_OVERHAUL_CHECKLIST.md). New gameplay/DLC entries need their own artwork. Production and hosted CI require separate verification.

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

