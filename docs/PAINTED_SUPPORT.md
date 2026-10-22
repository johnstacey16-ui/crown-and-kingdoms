Current animation coverage is 19 playable kinds. See [the latest artwork increment](PAINTED_WARRIORS.md). The support increment below records its earlier stage.

# Monk, longbowman and throwing-axeman animation — 22 October 2026

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

## Recorded verification

Verified code: [78f266a](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/78f266a2722b0d5c46e8cb62a2f16196c4d64e9b).

- [Source/atlas validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39699486866): passed.
- [Complete regressions](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39699486869): 164 standalone files, 19 campaign simulations and three seeded production-AI skirmishes passed.
- [Chromium graphics and responsive layouts](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/39699486800): passed. Checks cover 96 action/team lookups and 22 actual decoded raster action/team sequences, each with eight distinct visible poses.
- Both authoring packers reproduce committed images and metadata unchanged. The eight earlier motion sheets and all base art preserve their Git blob hashes.

These are automated checks and staged rendering evidence. They do not establish
full directional animation, physical Xbox frame budgets or complete human
multiplayer acceptance. No gameplay, controller or hosting change is claimed.
