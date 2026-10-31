Current animation coverage is 19 playable kinds. See [the latest artwork increment](PAINTED_ART.md#archived-checkpoint-painted-warriors). Coverage below records this document's earlier stage.

# Core painted unit motion — 21 October 2026

The [ranged and spear increment](PAINTED_ART.md#archived-checkpoint-painted-ranged) extends current coverage to
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

---

## Historical animation and motion checkpoints

Original animation production notes and validation records appear below in their original sequence. **These are dated snapshots**, not present-day coverage claims.

---

## Archived checkpoint: painted-secondary-motion

*Originally documented in PAINTED_SECONDARY_MOTION.md; preserved for artwork reconstruction and audit.*

### Painted secondary movement — 22 October 2026

The original **19/47 dedicated painted animation sheets remain unchanged**. The
other 28 unit kinds now receive an additional family-specific *presentation*
motion layer, using their existing painted base art. This is intentionally
not labelled as 28 new hand-painted sprite sheets: the distinction matters.

- Ships: `fish`, `gal`, `trn`, `cog` — waterline rocking and broadside recoil.
- Mounted: `mamel`, `mgd`, `cata`, `camel`, `conq`, `boyar`, `tarkan`, `huszar` — quicker weighted gait and impact.
- Elephants: `eled`, `ele` — heavier, slower planted movement.
- Siege/vehicles: `cart`, `ram`, `bomb`, `treb`, `mang`, `scor`, `wagon` — restrained wheel/chassis motion and launch recoil.
- Ranged foot troops: `jan`, `chuko`, `hcan`, `genoa`, `plumed` — quicker march and weapon recoil.
- Other foot troops: `king`, `gbeto` — footstep weight shifts and melee follow-through.

The new phase helper runs only where the atlas reports a **single static painted
frame**, leaving existing 16-pose units fully untouched. It uses existing game
time and cooldown progress; pausing freezes poses. No world state, combat,
travel speeds, controller input, sprites, base atlases or online packets change.
Solo and multiplayer projection share the same draw path. The source WebPs,
heraldry recolouring, proportions and fallbacks are preserved. The offline shell
cache version advances so updated render code is installed consistently.

**Coverage terminology:** All 47 playable kinds now have some movement/attack
presentation, but only **19/47** have individually painted eight-frame walk
plus eight-frame attack sprite sheets. Full hand-painted pose coverage of the
other 28, eight directions, specialised tools/death sheets and physical Xbox
visual/performance review are still open. These gentle transformations should
not be mistaken for newly generated poses or frame-by-frame art.

Regression checks exercise the complete 28-kind mapping, six families, paused
time, cooldown phase, unmodified entities, render-call parity and precedence
for the existing 19 dedicated sheets. CI and visual acceptance should be
reviewed before merging. No paid hosting or infrastructure changes are needed.

---

## Archived checkpoint: painted-horse-motion

*Originally documented in PAINTED_HORSE_MOTION.md; preserved for artwork reconstruction and audit.*

### Six horse-cavalry animation sets and terrain-cache improvement — 29 October 2026

Painted movement/action coverage is **33/47 playable types**, adding Mangudai (`mgd`), Cataphract (`cata`), Conquistador (`conq`), Boyar (`boyar`), Tarkan (`tarkan`) and Magyar Huszar (`huszar`). Fourteen types still need painted movement/action sheets. Directions, specialised work/death art, faction architecture, effects, interface work and hardware acceptance remain open in the [whole-game checklist](GRAPHICS_OVERHAUL_CHECKLIST.md).

Original built-in image generation produced six sixteen-pose sheets, with eight horse strides, eight weapon actions and matching ready poses. The original character references retain their faces, clothing and equipment: mounted archery, heavy-barded lance combat, matchlock fire, mace strikes, torch strikes and light-cavalry lance thrusts. The [exact prompts](painted-horse-prompts.json) record identity/reference roles. The Conquistador's former base portrait showed infantry despite existing mounted gameplay classifications; its new imagery adds a horse. Its overlay dimensions now match cavalry. No simulation classifications, speed, damage, commands or save fields change.

The new horse sheets use 128 horizontal pixels of source-cell padding, retaining full lances and tails. Conquistador and Tarkan authoring explicitly preserves disconnected hoof/shadow components of at least 64 pixels; a new optional extraction mode retains those parts while keeping tiny debris excluded. Default cleanup for all earlier sheets is unchanged. All previously committed WebP object hashes remain unchanged. Mounted scale is 60 reference pixels, matching existing cavalry; game time freezes strides and cooldown phase selects impact/release/recovery. Missing sheets retain the original base-art fallback.

#### Terrain cache

The team-relative map formerly retained at most 256 native 64-by-64 mixed-material textures. A fully explored Golden Coast diagnostic exceeds that working set, repeatedly evicting/rebuilding textures. The renderer now chooses cached blend resolution at least three times the actual displayed tile size, capped at the original 64-pixel source. Native solo chunks remain at 64 pixels. The shared LRU is bounded by the same 1,048,576 RGBA pixels (4 MiB) and 4,096 entries, and resets its pixel accounting when the image changes. Zoomed map terrain/resources outside a four-tile viewport margin are culled; terrain kinds still come only from the player's remembered tiles.

The controlled coastal fixture overrides sight only in an isolated test page to draw the entire map; normal game fog is unchanged. Over 20 measured refreshes, the native path allocated 34,240 temporary canvases while the new warmed path allocated zero. It retained 736 blends/753,664 pixels within the same budget. Mean RGB difference was 1.210/255; unmixed terrain tiles and all unit/HUD artwork retain their existing paths. The before/after coastal captures were visually inspected. A small ordinary scene fits the original cache too; its improvement is reduced texture sampling, not cache-churn elimination. Desktop timings are diagnostic and not Xbox frame budgets. Render-scale presets, canvas resolution, HUD, commands and camera controls are unchanged.

#### Verification

The effective manifest is `painted-raster-v12-motion`: 37 atlases, 1,584 animation entries and 3,488 references. Shell v33 includes all six sheets. The no-argument motion rebuild reproduces the new WebPs and manifests unchanged. Source/atlas/inventory checks, all 211 standalone regression files and the complete Chromium battlefield suite passed locally. Focused cavalry checks decode 384 samples across six kinds/four colours/two actions/eight frames, verify eight distinct poses in every sequence, 60-pixel cavalry scale, impact phase, pause determinism and unchanged actor/world checksums. The packed 96-pose contact sheet and coastal cache comparison were visually inspected. Existing palette, resource, fog, fallback, cache migration, terrain-viewport and controller regressions remain covered. Physical Xbox Series S Edge acceptance remains unverified.

Production verification: runtime `811938e2e2fa4dfcfad1102cf0ed80c88abbbc63` is live. Both renderer files, all six new sheets, the manifest and shell match their source SHA-256 values. Hosted GitHub jobs still fail before running steps; this is not a hosted CI pass.

---

## Archived checkpoint: painted-light-missile-motion

*Originally documented in PAINTED_LIGHT_MISSILE_MOTION.md; preserved for artwork reconstruction and audit.*

### Plumed Archer and Gbeto motion — 29 October 2026

Painted walking and attack coverage is now **23/47 playable types**, adding Plumed Archers (`plumed`) and Gbetos (`gbeto`). Twenty-four types still need painted walk/attack sequences. Independent directions, specialised work/death art and the wider graphics overhaul remain unfinished; the [whole-game checklist](GRAPHICS_OVERHAUL_CHECKLIST.md) records the remaining work.

Original built-in image generation produced two new sixteen-pose sheets, packed as `assets/painted-motion-plumed.webp` and `assets/painted-motion-gbeto.webp`. Each includes eight walking poses, eight weapon-action poses and a ready idle pose selected from that action sequence. The Plumed Archer retains blue feather headgear, gold/leather ornaments, waistcloth, bow and quiver. The Gbeto retains a white headwrap/tunic, blue sash and curved throwing blade. The original centered base character is an identity/style reference only; source-cell neighbor fragments are ignored. [Exact prompts and reference roles](painted-light-missile-prompts.json) record authoring.

The existing connected-character packer preserves headgear, weapons, hands and feet, reflowing source poses into padded 2048-by-1152 runtime sheets. The packed 32-pose contact sheet was visually inspected. All previously committed WebP hashes are unchanged. Both renderers use the existing foot-unit body scale and team-cloth recolouring. Game time drives stride and freezes on pause; cooldown phase starts with release/throw, then recovery and ready/preparation. The Gbeto release poses use an empty throwing hand; production projectiles remain separate. Missing sheets retain original painted base images and existing secondary fallback motion.

No combat stats, attack rate, projectile mechanics, controllers, simulation or save format change. The runtime manifest is `painted-raster-v9-motion`, with 27 atlases, 1,464 animation entries and 2,808 frame references. Shell v30 includes both images. Both authoring packers retain all 23 motion types; the no-argument motion rebuild reproduces the new images/manifests unchanged. The inventory and human checklist are generated together and checked in CI.

Local source, atlas and inventory checks passed. All 211 standalone regression files passed. The full Chromium battlefield suite passed: 192 motion action/team lookups and 70 established decoded action/team sequences contain eight distinct poses each. Focused Plumed/Gbeto checks decode another 128 samples across four colours, both actions and all eight frames, verify firing phase, pause determinism and unchanged actor/world checkpoints. Base-image fallback, HTTP MIME/security, original resources/environment/terrain, fog, both battlefield views and shell migration remain covered. Desktop staged timings do not establish physical Xbox Series S Edge performance or final animation quality.

The previous Janissary/Genoese release, initially rate-limited, was subsequently verified on production as `painted-raster-v8-motion` with 25 atlases before this increment. This new batch's production status requires its own deployment and source-fingerprint verification.

Production verification: runtime `718b29dc27ba2a329992d680081170f71f460842` is deployed on the existing Vercel game. Both new sheets, both previous Janissary/Genoese sheets, the manifest and shell matched local bytes. Hosted GitHub checks still fail before executing job steps; this is not a hosted CI pass.

---

## Archived checkpoint: painted-civic-naval-motion

*Originally documented in PAINTED_CIVIC_NAVAL_MOTION.md; preserved for artwork reconstruction and audit.*

### Naval and civilian motion artwork — 29 October 2026

The four ships, trade cart and King now have original sixteen-pose sheets: eight movement poses and eight activity poses, plus a matching single ready pose. This brings painted movement/activity **art coverage to 39/47 playable kinds**. This count describes artwork coverage, not completion of every activity event or the graphics overhaul.

Fishing Ship (`fish`) rows and raises a net while its existing gathering state is active. Galley (`gal`) rows and uses the existing cooldown-driven attack phase for its bolt-launcher sequence. Transport (`trn`) and Trade Cog (`cog`) show sail/hull movement; Trade Cart (`cart`) uses horse strides and wheel changes. King (`king`) has robe/foot movement. Boarding, cargo handling and royal greeting poses are authored in the shared activity slot; dedicated automatic boarding/trade/greeting event triggers remain open. These noncombat poses do not add attacks or orders. Game-time pause, facing, four-team cloth recolouring and original base-art fallback use the shared renderer. Simulation, cargo, passengers, economy, commands and save fields are unchanged.

Ship movement fits the existing 104-by-48 reference envelope, cart movement the 86-by-60 vehicle envelope, and King height matches 46-pixel foot troops. Scale is fixed per sheet using median movement height and the widest movement pose. Complete rigging, nets, waterline details and vehicle parts use the existing opt-in multipart extractor with 128-pixel horizontal/64-pixel vertical authoring padding. Dense vehicle sources permit up to 65 percent nonzero alpha; infantry retains its original limit. The transparent 4-by-4 source validator has an explicit `--vehicle` mode rather than weakening default character checks.

The first transport source was rejected because three poses touched vertically. A built-in image edit added separation; the corrected source passed the same component and frame checks before packing. [Exact original prompts and layout correction](painted-civic-prompts.json) record the built-in tool workflow and reference roles. Existing WebP files retain their committed hashes.

The effective manifest is `painted-raster-v13-motion`: 43 atlases, 1,660 animation entries and 3,928 frame references. Shell v34 includes all six new images. The no-argument packer reproduces all motion WebPs and both manifests byte-for-byte. Source authoring, source syntax, atlas and inventory checks pass. All 211 standalone files passed after correcting and rerunning two stale count/version expectations. The complete Chromium battlefield suite passed with 324 motion lookups and 136 decoded action/team sequences. Deployment identity is tracked separately in [verification](verification/civic-motion-2026-10-29.json).

The focused browser fixture checks 416 decoded frame samples across six kinds/four colours, including actual fishing work, all eight distinct frames in each sequence, pause determinism and unchanged actors/world checkpoints. Its 96-pose contact sheet includes movement and activity artwork; it does not establish automatic cargo/boarding event integration. The full battlefield suite retains stone, gold, berries, other resources, environment, fog, fallback, terrain-cache and controller coverage. Physical Xbox Series S Edge acceptance remains unverified.

The [whole-game checklist](GRAPHICS_OVERHAUL_CHECKLIST.md) tracks the remaining elephant/siege sheets, directional/death art, architecture, effects, interface and hardware review.

Production is verified live at runtime `902b80ff96176af454a49c2ab56ccee6d678cadf`: all six image SHA-256 values, the manifest and service worker match source. Vercel reports success. Hosted GitHub jobs fail before any steps; this is not a hosted CI pass.

---

## Archived checkpoint: painted-ranged-and-camel-motion

*Originally documented in PAINTED_RANGED_AND_CAMEL_MOTION.md; preserved for artwork reconstruction and audit.*

### Chu Ko Nu, Hand Cannoneer and camel cavalry motion — 29 October 2026

Painted walking and attack coverage is now **27/47 playable types**, adding Chu Ko Nu (`chuko`), Hand Cannoneer (`hcan`), Camel Rider (`camel`) and Mameluke (`mamel`). Twenty types still need painted walk/attack sequences. Independent directions, specialised work/death art, remaining troop motion and the wider graphics overhaul remain unfinished; see the [whole-game checklist](GRAPHICS_OVERHAUL_CHECKLIST.md).

Four original built-in image-generation sheets are packed as `assets/painted-motion-chuko.webp`, `painted-motion-hcan.webp`, `painted-motion-camel.webp` and `painted-motion-mamel.webp`. Each has eight walking poses, eight weapon-action poses and one matching ready pose selected for idle. Chu Ko Nu retain lamellar armour, blue cloth and a repeating crossbow; Hand Cannoneers retain steel helmets, blue sleeves, green skirt panels and long firearms. Camel Riders retain a spear, cap, blue cloak and camel; Mamelukes retain a white/red turban, blue saddle/cloth, camel and curved throwing blade. References use only the original centered character; neighboring base-sheet fragments are ignored. Exact prompts are recorded for [crossbow/gun troops](painted-crossbow-gun-prompts.json) and [camel cavalry](painted-camel-prompts.json).

The existing connected-character packer keeps complete figures, headgear, weapons and hooves. A Camel Rider's extended spear crossed its nominal source-cell boundary, so optional horizontal padding is now 96 pixels for these two mounted sheets. The spear is not cropped or shortened. Foot sheets remain 2048 by 1152; camel sheets use 2304 by 1152. The default 64-pixel packing and the environment multi-object mode remain unchanged. A regression checks a spear beyond default padding and invalid padding input. All earlier committed WebP object hashes remain unchanged.

The two foot troops retain the existing 46-pixel reference scale; camel units retain the 60-pixel cavalry reference scale and existing mounted walk timing. Cooldown phase starts with firing/impact/release, followed by recovery and preparation. Mameluke release frames use an empty throwing hand while projectiles stay separate. Game time freezes stride on pause. Both battlefield renderers share the existing pose and team-colour paths; failed motion sheets retain original base artwork and fallback motion. No damage, attack-rate, projectile, controller, simulation, save or ownership rules change.

The manifest is `painted-raster-v11-motion`: 31 atlases, 1,512 animation entries and 3,080 references. Shell v32 includes the four new sheets. Both authoring packers retain all 27 motion types, and the no-argument motion rebuild reproduces the four new WebPs/manifests unchanged. The generated inventory/checklist now records 20 remaining motion types.

Local validation passed all 211 standalone regression files, source/atlas/inventory checks and the full Chromium battlefield suite. Coverage includes 224 motion action/team lookups, 86 established decoded raster sequences with eight distinct poses each, plus 256 focused samples across the four new kinds, four colours, two actions and eight frames. Focused checks verify pause determinism, release phase and unchanged actor/world checkpoints. A cavalry scale regression checks all three states/four teams. Both packed 32-pose contact sheets were visually inspected, including the complete spear extension and camel silhouettes. Existing resources, terrain, wildlife, relics, fog, team colours, fallback and shell migration remain covered. Desktop staged timings do not establish physical Xbox Series S Edge frame budgets or final directional quality.

Production verification: runtime `2d37f78c135a2706a4892af006094706329fe0e2` is deployed on the existing Vercel game. All four new sheets, manifest and shell matched local bytes. Hosted GitHub checks still fail before any job steps execute; this is not a hosted CI pass.

---

## Archived checkpoint: painted-siege-elephant-motion

*Originally documented in PAINTED_SIEGE_ELEPHANT_MOTION.md; preserved for artwork reconstruction and audit.*

### Elephant and siege motion — 29 October 2026

Original painted motion sheets now cover all **47 current playable kinds**. The final eight are Elephant Archer (`eled`), War Elephant (`ele`), Battering Ram (`ram`), Bombard Cannon (`bomb`), Trebuchet (`treb`), Mangonel (`mang`), Scorpion (`scor`) and War Wagon (`wagon`). Each adds eight movement poses, eight action poses and a matching ready pose. These share existing solo/multiplayer rendering, heading/mirroring, four-team cloth recolouring and game-time pause. Existing base artwork remains the failed-image fallback.

The [exact prompts](painted-siege-elephant-prompts.json) document built-in image generation from the original centered identities, ignoring adjacent fragments in the old reference atlas. All eight source sheets passed the explicit multipart authoring check. Rigging, trunks, tusks, wheels and weapon parts are preserved with opt-in multipart extraction and wider padding; old/default packing behavior and all previously committed WebP hashes remain unchanged.

The attack cycle starts at the reviewed strike/release pose: original source cell 10 for War Elephant and 11 for the other seven. This aligns the visible muzzle flash/recoil, arm release or thrust with the existing cooldown reset. Source cell 8 remains the single ready pose. Elephant movement fits the original 76-by-74 reference envelope; siege movement fits 86-by-60, with fixed scale across each sheet. Cart and War Wagon health/selection/fallback overlays now use the existing 100-by-90 vehicle dimensions. Combat, projectiles, speed, pathing, economy, commands, controls and save fields are unchanged.

Manifest `painted-raster-v14-motion` contains 51 atlases, 1,756 animation entries and 4,472 frame references. Shell v35 caches all eight new sheets. A no-argument rebuild reproduces every motion WebP and both manifests byte-for-byte. Source/atlas/inventory checks, all 211 standalone regression files and the complete Chromium battlefield suite passed locally. Overall browser checks exercise 388 motion action/team lookups and 168 decoded raster sequences. Focused new coverage decodes 512 samples across eight kinds/four colours, checks eight distinct poses per sequence, source impact selection, pause, unchanged actor/world checksums and vehicle overlay sizes. The 128-pose packed contact sheet was visually inspected. Stone/gold/berry checks remain covered.

This is current-roster movement/activity artwork coverage, not complete graphics, eight independent facing directions, full skeletal/historical animation acceptance or DLC/game parity. Dedicated work/death states, boarding/trade/greeting event triggers, faction architecture, effects, interface and physical Xbox Series S Edge review remain open in the [whole-game checklist](GRAPHICS_OVERHAUL_CHECKLIST.md). Trebuchets currently use the game's existing mobile state; these sheets do not introduce packed/unpacked siege mechanics. Future catalogue additions need their own art. Deployment and hosted CI evidence are tracked separately in [verification](verification/siege-elephant-motion-2026-10-29.json).

Runtime `0af33396f6d42ca8319a939328b60337c793db4d` is committed and Vercel reports a successful deployment. Exact live-file comparison remains pending because the execution environment became unavailable. Hosted GitHub jobs again failed before any steps; the 211-file and full-browser passes are local evidence.

---

## Archived checkpoint: painted-wildlife-motion

*Originally documented in PAINTED_WILDLIFE_MOTION.md; preserved for artwork reconstruction and audit.*

### Deer and fish-shoal idle motion — 29 October 2026

Original eight-pose neutral atlases animate standing stag ears/head/grazing/tail and five-fish shoal fins/tails. They use the existing resource positions; these are idle visual cycles, not new roaming, hunting, reproduction or resource mechanics. Static environment artwork remains beneath the new atlases as failed-image fallback. Natural colours bypass team tinting.

The [prompt set](painted-wildlife-motion-prompts.json) records built-in generation from the existing painted identities and two corrections: full margins around stag antlers/hooves, and five complete fish in every shoal pose. The optional wildlife packer retains multipart fins/glints, validates complete four-by-two cells and writes a separate wildlife manifest. All previous WebP object hashes remain unchanged.

Solo passes `S.t`; the team-relative map passes its projected `field.time`. Stable coordinate offsets avoid synchronized animals. Pausing the match freezes the poses. Each animation carries a fixed positive `referenceWidth`; the shared small-texture cache and both draw paths use it, preserving body scale when the bounding box changes. Assets without this optional field retain their previous scale. Metadata validation rejects invalid widths. No simulation entities or save fields are written.

Manifest `painted-raster-v16-wildlife-motion` contains 54 atlases, 1,762 animation entries and 4,492 references. Shell v37 includes both images. Wildlife/fishtrap/base/motion rebuilds reproduce all WebPs and manifests byte-for-byte and preserve animation precedence. Source/atlas/inventory checks, all 211 standalone files and the complete Chromium battlefield suite pass locally. One old assertion assumed environmental atlases were always static; its updated eight-frame contract was rerun successfully.

The focused browser fixture decodes all sixteen poses, checks eight distinct images per species, calls both real render paths with the actual world clock, verifies pause/advance and constant scale, exercises static fallback and preserves node/world checkpoints. The one- and two-times-scale contact sheet was visually inspected. Stone, gold, berry and fish-trap checks still pass. [Verification](verification/wildlife-motion-2026-10-29.json) tracks production separately. Physical Xbox Series S Edge readability and large-scene performance remain unverified; [the complete checklist](GRAPHICS_OVERHAUL_CHECKLIST.md) tracks the broader unfinished overhaul.

Wildlife runtime `6b0298b07af8b8c24246bb1e5f375c9a727d179d` is verified live: all seven renderer/asset/manifest/shell SHA-256 values match source. Vercel reports success. Hosted GitHub jobs fail before any steps; this is not a hosted CI pass.
