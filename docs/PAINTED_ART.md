# Original painted medieval art

Created for Crown & Kingdoms with the built-in image-generation tool on
21 October 2026. No Age of Empires images or extracted game assets were used.

Prompt direction: original hand-painted pre-rendered medieval strategy art,
isometric view, upper-left lighting, realistic stone/timber/plaster, warm terracotta
and slate roofs, transparent object backgrounds, blue cloth and heraldry that can
be recoloured, distinct readable silhouettes; no pixel art, icons or text.

Three generated sheets were requested: 24 architectural/forest cells (6×4),
48 troop/vehicle cells (8×6), and six natural terrain materials (3×2). The shipped
WebPs retain their original 1536×1024 resolution. 47 troop and 22 building cells
are mapped to the game's existing definitions. Extra cells are reserved artwork.

`assets/atlas-manifest.json` is the authoritative named frame catalogue.
`node scripts/build-painted-atlas.mjs` rebuilds trimmed bounds from the shipped
images; this optional authoring tool requires `sharp`. Pass building, troop and
terrain PNG paths as three positional arguments to repack source images.
Runtime and CI validation require no native image libraries.

Art is a base-pose collection, with mirroring and small visual motion; it is not
a complete multi-frame directional animation set. Team recolouring is limited
to blue cloth/heraldry pixels and cached once per team and sheet.

The preview is a real Canvas2D game rendering of a staged village, not an
image-generation mockup. Simulation and controller bindings are unchanged.
