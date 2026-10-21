# Scout and skirmisher animation — 22 October 2026

Scouts now trot and swing their swords; skirmishers walk and throw javelins.
Each new kind has eight walk frames, eight attack frames and one matching
ready pose. The original painted references guide their equipment and colours.
Scouts remain lightly equipped chestnut cavalry, distinct from armoured knights;
skirmishers retain their round shield and throwing spear.

Current motion coverage is **8/47 playable kinds**: infantry, knights, villagers,
archers, crossbowmen, spearmen, scouts and skirmishers. Facing is mirrored.
The rest of the roster, full directional movement, specialised work and death
sheets and physical Xbox performance remain open.

The new original built-in image-generation sheets are saved as
`assets/painted-motion-scout.webp` and `assets/painted-motion-skirm.webp`.
[Exact prompts](painted-raider-prompts.json) record reference roles, grid layout,
equipment and action sequencing. Original base and earlier motion sheets are
preserved. The manifest prioritises eight motion atlases before the two base
atlases. The offline cache includes both new sheets.

The existing authoring packer accepts `--source scout PNG` and
`--source skirm PNG`, or rebuilds bounds from committed sheets with no arguments.
Scout body scale and gait timing follow the mounted knight; foot-unit scale
and timing apply to skirmishers. Bounds are isolated per cell with transparent
margins. Attack frames start at the strike/release, then recover and wind up
according to the existing cooldown. The game draws the thrown projectile;
the skirmisher release frame has an empty throwing hand.

Gameplay rules, projectile timing, damage, unit statistics, controller mappings
and camera controls are unchanged. Both renderers consume the same assets and
game-time pose logic. The preview uses the actual game simulation and renderer
in a staged scene; it is not physical Xbox capture.

Local verification passed 178 targeted checks covering atlas bounds, loading,
rendering, live authenticated multiplayer, controller contracts and extraction.
Native Canvas2D inspection found 32 visibly distinct action samples across the
two new kinds and a four-second actual in-engine preview. The atlas validator
accepts ten atlases, 1,268 animation entries and 1,744 frame references.

[In-engine preview](painted-raider-preview.webp)

## Recorded verification

Verified code: [2db6c30](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/2db6c30c13c31d349afa05b508d1df72f1c199b4).

- [Source/atlas validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39694009907): passed.
- [Full regressions](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39694009856): 163 standalone files, 19 campaign simulations and three seeded production-AI skirmishes passed.
- [Chromium graphics and responsive layouts](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39694010087): passed. Checks cover 68 action/team lookup combinations; actual raster checks cover eight scout/skirmisher action/team sequences with eight visibly distinct poses apiece. The scene checkpoint remains unchanged.
- Both authoring packers reproduce all committed image and manifest hashes unchanged.

These checks establish covered rendering and simulation scenarios. Independent
human multiplayer matches, physical Xbox performance, full directional animation
and all remaining troop sheets still require separate work and acceptance.
