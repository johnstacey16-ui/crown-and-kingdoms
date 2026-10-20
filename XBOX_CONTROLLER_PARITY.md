# Xbox controller parity contract

User requirement: the whole button system and its functions must mimic
**Age of Empires II: Definitive Edition on Xbox Series X**. This is a required
default, not an optional inspiration. No new project-specific gameplay bindings.

Reference checked 20 October 2026. These are the official published Xbox guides;
the exact installed Xbox build, advanced/default setting differences and full
wheel layouts still need direct comparison. Do not claim version-locked or
hardware-verified parity from these pages or Node tests.

## Official references

- [Controls, quick selection, command menu and minimap](https://www.ageofempires.com/learn-to-play/controlling-your-empire-gathering-resources-xbox/)
- [Control groups, Y shortcuts and site-based commands](https://www.ageofempires.com/learn-to-play/match-goals-advanced-controls-xbox/)
- [Villager priorities](https://www.ageofempires.com/learn-to-play/military-economy-xbox/)

## Verified reference and implementation audit

| Context | Xbox reference behaviour | Current implementation / remaining gap |
|---|---|---|
| A | Select; contextual orders; building rally point | Solo supports these; preview supports own units and completed town-centre rally only. Combat/build/resource orders remain unavailable there. |
| Hold / double A | Box selection / select visible entities of same type | Solo supports gestures. Preview supports additive individual unit selection with LT+A; box selection and double-A remain unavailable. Timing and entity eligibility require Xbox comparison. |
| LT modifier | Add selection; repeat placement; train five with A | Solo LT+A selection works. Preview LT+A now adds distinct owned units; normal A replaces selection or orders the group. Multiple-building selection and five-unit batches remain unavailable; LT is not town selection. |
| Hold RT | Contextual radial commands; A confirms | Solo radial exists. Preview opens a limited one-action wheel: town training or Stop for the selected units. RT alone never trains. Full entries, positions, page layouts and release behaviour need comparison. |
| RT + Y, villager | Switch economic/military building page | Solo implements pages; preview construction remains unavailable. Exact sector layout pending. |
| D-pad Up / Right / Down / Left | Idle villager / support / town centre / military | Solo categories exist; preview now uses the same button roles instead of cursor movement. Preview currently cycles individual entities. Livestock are not implemented. Group/count/camera parity pending. |
| Hold LB | Control-group radial; stick chooses; X assigns; Y focuses | Solo assignment, recall, camera focus and HUD counts now share eligibility rules: distinct living, ungarrisoned, currently owned world entities only. Recall filters availability without rewriting assigned groups, so unloading restores availability. Training from a selected building group distributes single orders and LT five-unit batches across compatible owned buildings; the HUD totals production queues. Manual saves and autosaves now restore all eight group slots, including garrisoned members. Preview has no group wheel. Full gesture/layout comparison and physical Xbox verification remain pending. |
| RB | Expanded minimap | Solo supports it. Preview minimap unavailable; RB is no longer next unit. |
| Expanded minimap: Y, D-pad | Y focuses view; Up flare, Right detail, Left mode; hold Down clears waypoints | Solo has Y and the first three D-pad functions, plus a legacy A alias. Waypoint reset and exact focus behaviour pending. |
| Y shortcut | Context-specific build/train; hold Y + Left changes shortcut; military toggles Line/Split | Solo shortcut exists but military currently cycles five project formations rather than Line/Split. Preview no longer treats Y as Stop; contextual Y actions remain unavailable. |
| R3 | Villager-priorities radial; Y manual ratios; stick resource, A adds, B removes | Wheel, seven presets, ratio semantics and automatic farm toggle pending. Removed incorrect subgroup-cycling R3 action. Existing pause-menu worker targets are not the Xbox priorities UI. |
| Menu | Pause/options; multiplayer simulation keeps running | Solo pauses. Running preview now opens a local menu without leaving or pausing either player. Menu/B/Resume returns focus; explicit Leave match exits. The full objectives, diplomacy, tech tree and options pages remain pending. |
| X, B, View, L3 and stick gestures | Context-sensitive functions | Preview X no longer clears selection, B deselects/closes its wheel, and left stick moves cursor. Removed solo generic-X-order alias and unsupported LT economy/zoom chords. Remaining contexts and gesture timings require direct reference capture; do not invent replacements. |

## Control-group save/load checks

Control groups use validated references to the saved unit/building arrays and
restore references to the loaded world, preserving slot positions and garrisoned
members. Saving removes duplicates, dead/foreign entities and stale references
from the serialized groups without changing the in-memory assignments. Existing
current-version saves without this optional field restore eight empty slots.
Malformed group arrays or forged references are rejected before replacing the
current world. Loading also clears the old radial menu and selection gesture so
unfinished input cannot act on the restored world.

The Node regressions cover manual/autosave round trips, entity compaction,
loaded cargo, legacy field absence and invalid-reference rejection. These checks
do not establish physical Xbox parity or multiplayer group support.

## Work order and acceptance

1. Correct conflicting bindings before extending the multiplayer controls.
2. Complete the shared input model for held buttons, release edges, selection
   gestures and analog navigation. Retain solo remapping support.
3. Compare the complete command, control-group, minimap, shortcut and priorities
   wheels against the same Xbox build. Record every sector and contextual prompt.
4. Implement missing functions, including ratios/presets/farms, Line/Split,
   multi-building production distribution, group selection and waypoint controls.
5. Route supported multiplayer actions through authenticated commands; unsupported
   actions stay unavailable. Never call team-zero local gameplay from preview UI.
6. Test an entire controller-only solo match and two-client multiplayer match on
   Xbox Edge, including disconnection, save/load, menus and all modifier contexts.

This is an audit and acceptance checklist, **not a claim of full parity**.
