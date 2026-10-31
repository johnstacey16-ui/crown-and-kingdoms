Current motion coverage is **33/47** playable kinds. See [the latest cavalry/cache increment](PAINTED_MOTION.md#archived-checkpoint-painted-horse-motion). Earlier counts below are historical stages.

Current motion coverage is **27/47** playable kinds, adding Chu Ko Nu, Hand Cannoneer, Camel Rider and Mameluke. See [the latest motion increment](PAINTED_MOTION.md#archived-checkpoint-painted-ranged-and-camel-motion). Earlier counts below record historical stages.

Current motion coverage is **23/47** playable kinds, adding Plumed Archers and Gbetos. See [the latest motion increment](PAINTED_MOTION.md#archived-checkpoint-painted-light-missile-motion). Earlier counts below record historical stages.

Current motion coverage is **21/47** playable kinds, adding Janissaries and Genoese Crossbowmen. See [the latest motion increment](PAINTED_ART.md#archived-checkpoint-painted-ranged-expansion). Earlier counts below record historical stages.

Current animation coverage is 19 playable kinds. See [the latest artwork increment](PAINTED_ART.md#archived-checkpoint-painted-warriors). Coverage below records this document's earlier stage.

Current coverage: eight playable kinds, including scouts and skirmishers. See [the latest animation increment](PAINTED_ART.md#archived-checkpoint-painted-raiders). The increment-specific coverage below records its original stage.

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

The original sheet is a base-pose collection. A new [core motion layer](PAINTED_MOTION.md)
adds articulated walking/attack frames for infantry, knights, villagers, archers,
crossbowmen and spearmen, plus villager work. [Current coverage](PAINTED_ART.md#archived-checkpoint-painted-ranged)
also records ready poses and the selective fallback-sheet cleanup. Full roster and multi-direction animation remain unfinished. Team recolouring is limited
to blue cloth/heraldry pixels and cached once per team and sheet.

The preview is a real Canvas2D game rendering of a staged village, not an
image-generation mockup. Simulation and controller bindings are unchanged.

---

## Historical character and army art checkpoints

These are preserved authoring and verification records, **not the current coverage inventory**. Consult `graphics-inventory.json` and the active graphics roadmap for live acceptance status.

---

## Archived checkpoint: painted-infantry

*Originally documented in PAINTED_INFANTRY.md; consolidated without removing artwork, prompts or verification evidence.*

Current animation coverage is 19 playable kinds. See [the latest artwork increment](PAINTED_ART.md#archived-checkpoint-painted-warriors). The infantry increment below records its earlier stage.

### Special infantry animation — 22 October 2026

Animation coverage is now **15/47 playable kinds**, adding Woad Raiders (`woad`),
Berserks (`bers`), Samurai (`saml`) and Teutonic Knights (`tk`). All 47 playable
kinds retain base painted artwork. Full roster animation, independent facing
directions, specialised work/death sheets and physical Xbox performance remain
open.

The four original built-in image-generation sheets are saved as
`assets/painted-motion-woad.webp`, `assets/painted-motion-bers.webp`,
`assets/painted-motion-saml.webp` and `assets/painted-motion-tk.webp`.
[Exact prompts and reference roles](painted-infantry-prompts.json) record their
authoring. The original character references, base artwork and eleven earlier
motion sheets are preserved.

The two sword sheets received targeted pose corrections. Source imports now
identify complete connected figures before isolating grid cells, then reflow
them into cells with extra transparent padding. This retains long blade tips
that extend beyond a generated source-cell edge. It changes packing, not the
painted weapon shape. Existing committed sheets are not reflowed on rebuild.
Missing or ambiguous source figures fail the import instead of publishing
partial art. Tests check cross-cell weapon retention, soft alpha, source
preservation and rejection paths.

Each new sheet supplies eight walk poses, eight melee attack poses and a
matching ready pose. Woad Raiders have a light bare-chested silhouette and
two-handed axe; Berserks have fur shoulders, a round shield and short axe;
Samurai have lamellar armour and a two-handed katana; Teutonic Knights have a
greathelm, white cape, kite shield and straight sword. Blue cloth/heraldry
supports all four kingdom palettes. White capes, metal and leather retain their
neutral colours.

Existing cooldown phase selects the strike, recovery and wind-up frames.
Walking follows game time and freezes on pause. Both renderers use the same
assets, stable body scale and facing logic. Facing is still mirrored rather
than independent directional artwork.

The authoring packer accepts `--source KIND PNG` for each new kind. Running
without arguments rebuilds bounds from committed WebPs. The manifest prioritises
15 motion sheets before the two base atlases. The offline cache includes the
four new sheets. Gameplay rules, statistics, controller bindings and camera
controls are unchanged. No promotional pictures or videos are included.

Local verification passed 184 targeted checks, including all motion kinds and
teams, ready-pose scale, extraction/reflow, controller contracts, HTTP image
loading, authenticated live play and castle production. Native Canvas2D
inspection checked 64 distinct new walk/attack samples and an actual staged
infantry battle; drawing preserved the world checkpoint. Atlas validation
accepts 17 atlases, 1,356 animation entries and 2,252 frame references.

---

## Archived checkpoint: painted-raiders

*Originally documented in PAINTED_RAIDERS.md; consolidated without removing artwork, prompts or verification evidence.*

Current animation coverage is 19 playable kinds. See [the latest artwork increment](PAINTED_ART.md#archived-checkpoint-painted-warriors). Coverage below records this document's earlier stage.

### Scout and skirmisher animation — 22 October 2026

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

#### Recorded verification

Verified code: [2db6c30](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/2db6c30c13c31d349afa05b508d1df72f1c199b4).

- [Source/atlas validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39694009907): passed.
- [Full regressions](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39694009856): 163 standalone files, 19 campaign simulations and three seeded production-AI skirmishes passed.
- [Chromium graphics and responsive layouts](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39694010087): passed. Checks cover 68 action/team lookup combinations; actual raster checks cover eight scout/skirmisher action/team sequences with eight visibly distinct poses apiece. The scene checkpoint remains unchanged.
- Both authoring packers reproduce all committed image and manifest hashes unchanged.

These checks establish covered rendering and simulation scenarios. Independent
human multiplayer matches, physical Xbox performance, full directional animation
and all remaining troop sheets still require separate work and acceptance.

---

## Archived checkpoint: painted-ranged

*Originally documented in PAINTED_RANGED.md; consolidated without removing artwork, prompts or verification evidence.*

Current animation coverage is 19 playable kinds. See [the latest artwork increment](PAINTED_ART.md#archived-checkpoint-painted-warriors). Coverage below records this document's earlier stage.

### Archer, crossbowman and spearman animation — 21 October 2026

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

#### Recorded verification

Verified code: [56336f7](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/56336f752f3637afbe73c41108b03f76d54ec0af).

- [Source/atlas validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39684857364): passed, eight atlases and 1,608 frame references.
- [Full regressions](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39684857410): 163 standalone files, 19 isolated campaign simulations and three seeded production-AI skirmishes passed.
- [Chromium graphics and responsive layouts](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39684857413): passed, including all 52 action/team combinations and actual visible spear pixels with its feet beyond the viewport.
- Local targeted checks: 178 passed. Native Canvas2D contact inspection covered 48 new action/team samples; the viewport probe found 323 changed spear pixels. Running both packers with committed sources left all image and manifest hashes unchanged.

[Four-second in-engine preview](painted-ranged-preview.webp) shows the actual
painted units using the game's movement, attacks and rendering. It is a staged
scene, not physical Xbox capture or evidence of full directional animation.

---

## Archived checkpoint: painted-ranged-expansion

*Originally documented in PAINTED_RANGED_EXPANSION.md; consolidated without removing artwork, prompts or verification evidence.*

### Janissary and Genoese Crossbowman motion — 29 October 2026

Painted walking and attack coverage is now **21/47 playable kinds**, adding Janissaries (`jan`) and Genoese Crossbowmen (`genoa`). Twenty-six kinds still need painted walk/attack sequences. All 47 retain original base art. Independent directional images, specialised work/death sheets, remaining troop animations, faction buildings, effects and interface artwork remain unfinished; see the [whole-game checklist](GRAPHICS_OVERHAUL_CHECKLIST.md).

Two original built-in image-generation sheets are packed in `assets/painted-motion-jan.webp` and `assets/painted-motion-genoa.webp`. Each has eight walking poses and eight action poses, with a ready idle pose from the same figure. The existing base character is used only as identity/style reference, ignoring neighboring source fragments and preview backgrounds. Janissaries retain their white felt cap, blue coat, red garments and matchlock musket; Genoese Crossbowmen retain their blue cap, leather/steel armour and wooden crossbow. The [exact prompts and reference roles](painted-ranged-expansion-prompts.json) record authoring.

The existing connected-component packer isolates the in-cell character from detached smoke/bolt fragments before padding these two source sheets. Attached muzzle smoke remains with the firing pose. Production projectiles are still drawn by the existing gameplay renderer. The complete bodies, headgear, weapons and boots were reviewed in the packed 32-pose contact sheet. Source sheet margins keep these characters/weapons within their cells; the padded runtime sheets are 2048 by 1152. No original unit/building/resource/environment images changed.

Cooldown phase selects the firing/release pose first, followed by recovery/loading and ready/aiming poses. Game time drives walking and freezes while paused. Both renderers use existing shared pose history outside simulation entities, the same 46-pixel foot-unit scale and existing team-cloth recolouring. Missing motion images fall back to original base artwork and its secondary movement/recoil. No damage, attack rate, weapon mechanics, controller bindings, simulation or save format changes.

Both authoring packers retain the 21 motion types. `node scripts/build-motion-atlas.mjs` reproduces the new WebPs and manifests unchanged. The manifest is now `painted-raster-v8-motion`: 25 atlases, 1,440 animation entries and 2,672 references. Offline shell v29 includes both new images. The audit script now generates and verifies both machine-readable inventory and the human checklist, keeping remaining-animation counts in sync.

Local source/atlas validation and all 211 standalone regression files passed. The full Chromium battlefield suite passed: 176 motion action/team lookups, 62 existing raster action/team sequences with eight distinct poses, and a focused 128-sample Janissary/Genoese raster check across four kingdom colours, both actions and all eight poses. Firing phase, pause determinism, unchanged actor/world checkpoints, base-image fallback, new-image HTTP MIME/security, terrain/resource/environment graphics, cache upgrade and both battlefield projections remain covered. The packed contact sheet was visually inspected. Desktop checks and staged timings do not establish physical Xbox Series S Edge performance or complete directional quality.

---

## Archived checkpoint: painted-support

*Originally documented in PAINTED_SUPPORT.md; consolidated without removing artwork, prompts or verification evidence.*

Current animation coverage is 19 playable kinds. See [the latest artwork increment](PAINTED_ART.md#archived-checkpoint-painted-warriors). The support increment below records its earlier stage.

### Monk, longbowman and throwing-axeman animation — 22 October 2026

The painted animation layer now covers **11/47 playable kinds**. This increment
adds monks (`mon`), longbowmen (`lbow`) and throwing axemen (`axe`) to the eight
earlier kinds. All 47 playable kinds retain base painted artwork. Full roster
animation, independent facing directions, specialised work/death sheets and
physical Xbox performance remain open.

Original built-in image-generation sheets are saved as
`assets/painted-motion-mon.webp`, `assets/painted-motion-lbow.webp` and
`assets/painted-motion-axe.webp`. The exact prompts and reference roles are in
[painted-support-prompts.json](painted-support-prompts.json). Original source
art and the earlier eight motion sheets are preserved.

Each new sheet has eight walk poses, eight action poses and a matching ready
pose. Monks use a planted staff and blessing gesture, with blue hood edging and
stole for team identification. Longbowmen retain a long wooden bow and steel
helmet. Throwing axemen keep their round shield and have an empty throwing hand
on release, because the game draws the projectile separately.

Monk conversion uses the existing `work` visual state while its conversion
progress is positive. Walking takes precedence, and conversion targets supply
facing. The gesture loops on game time, freezes on pause and does not predict
the random conversion result. It reads existing orders/progress without writing
simulation entities. Automatic healing retains its existing presentation; no
healing order or gameplay rule is added. Solo and multiplayer share the pose.

The packer accepts `--source mon PNG`, `--source axe PNG` and
`--source lbow PNG`; running it without arguments rebuilds from committed WebPs.
The manifest prioritises eleven motion sheets before the two base sheets.
The offline shell includes all three new assets.

Costs, damage, projectile timing, conversion chance/range, faith, research,
controller mappings and camera controls are unchanged. Facing remains mirrored.
No promotional pictures or videos are included in this increment.

Local validation passed 182 targeted checks, including all motion kinds/teams,
monk gesture state/paused time, multiplayer pose projection and unchanged world
checksums, controller contracts, authenticated live play and castle production.
Native Canvas2D inspection checked 48 distinct new action samples and a staged
production battle with an active conversion. Drawing left the world checkpoint
unchanged. Atlas validation accepts 13 atlases, 1,308 entries and 1,980 frame
references. Earlier motion/base art and gameplay/controller source files are
preserved; `js/render.js` only adds conversion-facing and casting-state selection.

#### Recorded verification

Verified code: [78f266a](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/78f266a2722b0d5c46e8cb62a2f16196c4d64e9b).

- [Source/atlas validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39699486866): passed.
- [Complete regressions](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39699486869): 164 standalone files, 19 campaign simulations and three seeded production-AI skirmishes passed.
- [Chromium graphics and responsive layouts](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39699486800): passed. Checks cover 96 action/team lookups and 22 actual decoded raster action/team sequences, each with eight distinct visible poses.
- Both authoring packers reproduce committed images and metadata unchanged. The eight earlier motion sheets and all base art preserve their Git blob hashes.

These are automated checks and staged rendering evidence. They do not establish
full directional animation, physical Xbox frame budgets or complete human
multiplayer acceptance. No gameplay, controller or hosting change is claimed.

---

## Archived checkpoint: painted-warriors

*Originally documented in PAINTED_WARRIORS.md; consolidated without removing artwork, prompts or verification evidence.*

### Huskarl, Jaguar, Kamayuk and Shotel animation — 22 October 2026

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

#### Verification

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
