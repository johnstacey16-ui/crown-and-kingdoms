# Painted secondary movement — 22 October 2026

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
