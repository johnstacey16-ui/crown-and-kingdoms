# Battlefield graphics acceptance

## Current painted raster presentation — 21 October 2026

The user rejected the pixel SVG icons. The default renderer now uses original
painted WebP artwork: 47 playable troop types, 22 building types, three building
combat proxies, forest clusters and six terrain materials. The pixel-icon
collection has been removed from `js/render.js`; old optional atlas files are
preserved for history but are no longer in the default asset manifest.

Both battlefield renderers use transparent sprites, cached team-cloth recolouring
and the same validated frame bounds. Missing assets retain procedural fallback.
Infantry, knights, villagers, archers, crossbowmen, spearmen, scouts and skirmishers now have
eight-frame walking/attack sequences;
villagers also have a shared pickaxe work cycle. Other units retain base poses
with subtle motion. Full roster and eight-direction animation remain unfinished.
See [current motion coverage](docs/PAINTED_RAIDERS.md). This is a graphics increment,
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
