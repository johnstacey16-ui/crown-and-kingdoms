Current animation coverage is 15 playable kinds. See [the latest artwork increment](PAINTED_INFANTRY.md). Coverage below records this document's earlier stage.

# Core painted unit motion — 21 October 2026

The [ranged and spear increment](PAINTED_RANGED.md) extends current coverage to
6/47 playable kinds and adds ready poses. The first-stage description and
verification below remain a record of the original three-type increment.

Infantry (`mil`), knights (`knight`) and villagers (`vil`) now have eight-frame
walking and attack sequences. Villagers also use the pickaxe sequence when
working. These 48 original poses were generated with the built-in image tool
using the game's existing painted troops as identity/style references.
[The full prompts](painted-motion-prompts.json) include the knight background
cleanup pass. Source PNGs are retained outside the runtime pack; the committed
assets are `assets/painted-motion-mil.webp`, `painted-motion-knight.webp` and
`painted-motion-vil.webp`.

`assets/motion-manifest.json` describes the added frames. The primary
`atlas-manifest.json` loads motion before base art, falling back per unit/state
when motion is unavailable. The optional `scripts/build-motion-atlas.mjs`
requires sharp; run it without arguments to rebuild frame bounds, or pass
infantry, knight and villager source PNGs in that order to repack artwork.
The base-art packer preserves this motion layer when rebuilding the base pack.
Frame trimming follows the main connected silhouette to exclude stray parts
of neighbouring generated cells. Body scale and cell-centred horizontal
anchors stay constant across an action; extended weapons do not shrink bodies.

Solo and multiplayer use the same visual pose calculation. Game time drives
walk/work loops; route retry timers do not reset the cycle. Cooldown progress
drives attack frames, with the strike first after a damage event, followed by
recovery and the next wind-up. Pausing game time freezes the pose. Facing
history is held in a weak presentation cache, without writes to world entities.
Fallen units retain their painted base artwork in the existing fall/fade effect.
Controller bindings, simulation, balance and damage calculation are unchanged.

Coverage remains **3 of 47 playable unit types**. This is a two-facing animation
stage through mirroring; eight-direction coverage, other troop types, specialised
villager tools and full death animation sheets remain unfinished. Pickaxe work
is a temporary shared working action for these villagers. The in-engine preview
is a staged animation check, not an Xbox performance capture.

Checks cover all four kingdom palettes, distinct frame lookup, bounded WebP
rectangles, stable scale, attack phase endpoints, game-time pause behaviour,
unchanged entity fields, fallback to base art, HTTP loading and current controller
contracts. Native Canvas2D inspection covers actual raster pose differences;
Chromium checks load the sheets and exercise multiplayer rendering and partial
motion-download failure. Physical Xbox performance remains a separate gate.

## Verification at code commit a5b1a71

- [Source and atlas validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39680953178): passed.
- [Full regressions](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39680953233): 162 standalone files, 19 isolated campaign missions and three seeded production-AI skirmishes passed.
- [Chromium graphics and layout](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39680953171): passed, including motion and partial-download fallback.
- Local: 175 targeted tests, source checks, WebP bounds, reproducible packing and native raster inspection passed.
