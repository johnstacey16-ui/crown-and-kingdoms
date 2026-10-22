# Huskarl, Jaguar, Kamayuk and Shotel animation — 22 October 2026

Animation coverage is **19/47 playable unit types**, adding Huskarls (`huskarl`),
Jaguar Warriors (`jaguar`), Kamayuks (`kamayuk`) and Shotel Warriors (`shotel`).
All 47 retain their base painted artwork. The fifteen earlier motion sheets,
original base art, gameplay, controller mappings and camera controls are preserved.
Independent directional artwork, the remaining 28 units, specialised work/death
sheets and physical Xbox performance remain open.

Four original built-in image-generation sheets are committed as
`assets/painted-motion-huskarl.webp`, `painted-motion-jaguar.webp`,
`painted-motion-kamayuk.webp` and `painted-motion-shotel.webp`.
[Exact prompts, reference roles and corrections](painted-warrior-prompts.json)
record their authoring. References are complete connected characters isolated
from the original 8-by-6 painted base sheet using its actual rounded row bounds.

Each sheet contains eight walking poses, eight melee action poses and a matching
ready pose, at the existing foot-unit body scale and gait timing. Huskarls retain
chainmail, a nasal helmet, axe and blue round shield. Jaguar Warriors retain
spotted pelt hoods, obsidian-edged clubs and feather-edged round shields. Kamayuks
retain long single-tip spears and geometric rectangular shields; their action is
a thrust. Shotel Warriors retain curved blades, oval hide shields and blue sashes.
Upper-left lighting, painted outlines and neutral material colours follow the
existing style. Blue cloth/heraldry supports all four kingdom palettes.

Two raised wind-up poses needed compact arm/weapon corrections. Only corrected
frame 10 is assembled into each original Jaguar/Shotel sheet; the other fifteen
original poses remain intact. Complete connected silhouettes and their soft-alpha
halos are selected globally, preserving blades crossing nominal source-cell edges.
The unchanged packer then reflows into 2048-by-1152 sheets with 64 horizontal and
16 vertical pixels of padding per cell side. No weapon is cropped or shortened.

Cooldown phase still selects strike, recovery, ready and wind-up; game time drives
walking and freezes on pause. Both renderers use existing shared visual poses,
stable body scale and facing history outside simulation entities. Missing motion
retains base-art/procedural fallback. No gameplay or hosting changes are included.

The primary manifest is `painted-raster-v7-motion`: 21 atlases, 1,404 animation
entries and 2,524 frame references. The offline shell is `ck-shell-v22-warriors`.
Both authoring packers retain the nineteen-unit motion layer on no-argument rebuilds.

## Verification

Native Canvas2D checks decoded 256 new walk/action samples across four kingdom
palettes, with eight distinct raster poses in every action/team sequence. An
internal contact inspection checked all 64 new poses and a staged in-engine
battle. Solo drawing and multiplayer projection preserved the world checkpoint.
Earlier artwork and all gameplay/controller/runtime JavaScript keep their hashes.

Source checks and atlas validation passed. All 118 targeted local checks passed,
covering frame lookup/scale, extraction/reflow, HTTP image loading, authenticated
live sessions, controller contracts, solo/multiplayer projection and castle
civilisation production. Both authoring packers reproduce all nineteen motion
images, the cleaned base sheet and both manifests unchanged.

Verified code: [3e2bac3](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/3e2bac3a88a706e2ef6d618fc62226eed3aeb7a3).

- [Source and atlas validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39721487499): passed.
- [Chromium graphics and responsive layouts](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39721487481): passed. Coverage includes 21 atlases, 160 action/team lookups and 54 decoded raster action/team sequences with eight distinct poses each, including the four new units, cache upgrades and failed-motion fallback.
- [Complete regressions](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39721487522): all 164 standalone test files, all 19 isolated campaign simulations and three seeded production-AI skirmishes passed.

These automated and staged rendering checks do not establish full directional
animation, physical Xbox frame budgets or independent human multiplayer acceptance.
No deployment was performed.
