Current animation coverage is 19 playable kinds. See [the latest artwork increment](PAINTED_WARRIORS.md). Coverage below records this document's earlier stage.

# Archer, crossbowman and spearman animation — 21 October 2026

The painted motion layer now covers six playable kinds: infantry, knights,
villagers, archers (`arc`), crossbowmen (`xbow`) and spearmen (`spear`). Each
has eight walking and eight attack frames, plus a single ready pose taken from
its own action sheet so it keeps the same appearance when stopping. Villagers
retain their shared pickaxe work cycle. Coverage is **6/47 playable kinds**;
full directional animation, other troops and specialised work/death sheets
remain unfinished.

The 48 added poses are original built-in image-generation outputs, based on
the existing painted unit references. [Full prompts](painted-ranged-prompts.json)
include the correction of a double-pointed spear in one wind-up frame.
The saved runtime assets are `assets/painted-motion-arc.webp`,
`assets/painted-motion-xbow.webp` and `assets/painted-motion-spear.webp`.
The primary manifest prioritises all six motion sheets before the base art.

The existing cooldown phase selects firing/thrust frames; projectiles, damage,
unit statistics and controller bindings are unchanged. Walk and work cycles
still follow game time, including pauses. Idle, movement and attack use a shared
body scale. Close-zoom rendering keeps a larger screen margin so long weapons
remain visible while a unit's feet are just outside the viewport.

`assets/painted-units-v2.webp` removes observed neighbouring fragments from
only the archer, spearman and crossbowman fallback cells. The original sheet
and earlier motion assets are preserved. Other base cells, including multi-part
ships and carts, retain their original silhouettes. `scripts/sprite-grid.mjs`
is the shared authoring helper for connected-silhouette extraction and soft
edge preservation. It supports selecting only affected cells.

Use `node scripts/build-motion-atlas.mjs` to rebuild bounds from committed
sheets. To replace one source, use `--source arc /absolute/archer.png`; repeat
`--source KIND PNG` for additional kinds. The first three positional arguments
still mean infantry, knight and villager, with the new kinds following them.
The optional packers require sharp; runtime and CI do not.

Validation covers six motion kinds and four palettes, single ready poses,
consistent scale, alpha isolation, uneven grid rows, selective cleanup,
reproducible packing, fallback art and HTTP image loading. Native Canvas2D
checks inspect the actual new raster frames and a spear at the viewport edge.
Chromium checks exercise changing frames, partial image-download failure and
visible spear pixels with the unit's feet outside the close-zoom viewport.
The in-engine preview is staged, not a physical Xbox performance capture.

## Recorded verification

Verified code: [56336f7](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/56336f752f3637afbe73c41108b03f76d54ec0af).

- [Source/atlas validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39684857364): passed, eight atlases and 1,608 frame references.
- [Full regressions](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39684857410): 163 standalone files, 19 isolated campaign simulations and three seeded production-AI skirmishes passed.
- [Chromium graphics and responsive layouts](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39684857413): passed, including all 52 action/team combinations and actual visible spear pixels with its feet beyond the viewport.
- Local targeted checks: 178 passed. Native Canvas2D contact inspection covered 48 new action/team samples; the viewport probe found 323 changed spear pixels. Running both packers with committed sources left all image and manifest hashes unchanged.

[Four-second in-engine preview](painted-ranged-preview.webp) shows the actual
painted units using the game's movement, attacks and rendering. It is a staged
scene, not physical Xbox capture or evidence of full directional animation.
