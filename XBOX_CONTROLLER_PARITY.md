# Xbox controller parity contract

User requirement: the whole button system and its functions must mimic
**Age of Empires II: Definitive Edition on Xbox Series X**. This is a required
default, not an optional inspiration. No new project-specific gameplay bindings.

Reference checked 21 October 2026. These are the official published Xbox guides;
the exact installed Xbox build, advanced/default setting differences and full
wheel layouts still need direct comparison. Do not claim version-locked or
hardware-verified parity from these pages or Node tests.

## Official references

- [Default Controller Layouts, updated 8 May 2026](https://support.ageofempires.com/hc/en-us/articles/37041870568468-Age-of-Empires-II-Definitive-Edition-Default-Controller-Layouts): the Xbox General Gameplay and LT Held diagrams are the current binding authority. The General Gameplay card assigns left-stick movement to camera pan, right-stick movement to zoom, L3 to snap to selection, and R3 to villager priorities. The LT card assigns right-stick movement to navigation waypoints, not zoom.
- [Xbox General Gameplay diagram](https://support.ageofempires.com/hc/article_attachments/37041896814740) and [LT Held diagram](https://support.ageofempires.com/hc/article_attachments/37041870557972).
- [Controls, quick selection, command menu and minimap](https://www.ageofempires.com/learn-to-play/controlling-your-empire-gathering-resources-xbox/)
- [Control groups, Y shortcuts and site-based commands](https://www.ageofempires.com/learn-to-play/match-goals-advanced-controls-xbox/)
- [Villager priorities](https://www.ageofempires.com/learn-to-play/military-economy-xbox/)

## Verified reference and implementation audit

| Context | Xbox reference behaviour | Current implementation / remaining gap |
|---|---|---|
| A | Select; contextual orders; building rally point | Solo supports these; the authenticated battlefield now selects owned units and completed buildings, supports sight-checked contextual attack/gather, construction and single production-building rally. Group rally remains unavailable. |
| Hold / double A | Box selection / select visible entities of same type | Solo tap, double-A and box selection now filter living owned world entities, exclude garrisoned units and deduplicate LT additions. Menus, quick selection, B, focus loss and controller changes cancel unfinished A gestures and double-tap history; B takes priority over simultaneous A release. Preview now draws a hold-A box using the left stick and selects enclosed owned, living, ungarrisoned units on release; LT adds boxes. Ordinary A selection/orders wait for release, so beginning a box never sends an order. B, menus, focus changes, other controller contexts and pointer selection cancel unfinished gestures. The solo 14-pixel drag threshold is provisional. Unmodified double-A selects visible eligible units of the same type; its 350 ms window is provisional. LT/double-A remains unverified and does not expand a type. Double-A also selects visible completed owned town centres; completed production buildings are now selectable in the battlefield; non-production grouping still needs comparison. Timing and entity eligibility require Xbox comparison. |
| LT modifier | Add selection; repeat placement; train five with A | Solo LT+A selection works. Preview LT+A adds distinct owned units through individual taps and selection boxes; normal A replaces selection or orders the group. In the town-centre training wheel, RT+LT+A submits one five-villager batch; RT+A requests one. Each unit uses the existing simulation's costs, population reservations and queue capacity, stopping at the first rejection as in solo. Partial-batch limits still need Xbox comparison. Double-A selects town-centre groups for training distributed across their compatible shortest queues. LT repeat building placement is now available in the authenticated battlefield; LT addition of individual buildings remains unavailable. LT is not town selection. |
| Hold RT | Contextual radial commands; A confirms | Solo radial exists. The authenticated battlefield has villager construction pages and contextual standard building training/research; the left stick chooses, A confirms, LT+A requests five trained units. RT alone never trains. The authenticated RT menu now also offers eligible garrison/boarding, repair, building unload and transport shore-landing actions. Military selections offer Patrol and Attack Move, with ground targeting, B cancellation and host-validated ownership/routes; Patrol repeats the outbound/return legs and Attack Move stops at arrival. Targeted actions wait for release then A on a target; B, focus loss, selection changes and menus cancel targeting. Passenger counts and loaded-selection removal are projected from current ownership. Exact new sectors, entries, page layouts and release behaviour require comparison; this is implementation coverage, not verified Xbox layout or physical acceptance. |
| RT + Y, villager | Switch economic/military building page | Solo implements pages; the authenticated battlefield has economic/military build pages and LT repeat placement. Exact sector layout pending. |
| D-pad Up / Right / Down / Left | Idle villager / support / town centre / military | Solo selection and HUD counts share current eligibility: owned living ungarrisoned units, idle workers, support monks and completed living town centres. Trade carts/ships, transports and kings are excluded from military selection. Empty categories preserve the current selection and camera. Preview uses the same button roles instead of cursor movement but currently cycles individual entities. Livestock are not implemented. Group/count/camera parity still needs Xbox comparison. |
| Hold LB | Control-group radial; stick chooses; X assigns; Y focuses | Solo assignment, recall, camera focus and HUD counts now share eligibility rules: distinct living, ungarrisoned, currently owned world entities only. Recall filters availability without rewriting assigned groups, so unloading restores availability. Training from a selected building group distributes single orders and LT five-unit batches across compatible owned buildings; the HUD totals production queues. Manual saves and autosaves now restore all eight group slots, including garrisoned members. Preview now has an eight-slot LB wheel: left stick chooses, X assigns eligible owned selection, and release recalls. Counts/recall filter current eligibility while retaining stored cargo IDs. Assignment and recall are local and preserve checkpoints; later orders remain authenticated. B, blur, pointer changes, suspension and conflicting RT/RB contexts cancel the wheel. LB+Y selects eligible group members and focuses a clamped local camera on its first member, following the solo anchor choice. World rendering and pointer input share/invert the viewport transform; the camera never alters sight or simulation. Focus preserves the chosen zoom; framing, edge-follow settings and exact Xbox focus semantics remain provisional. Multiplayer groups are room-UI-local and are separate from saved solo groups. Full gesture/layout comparison and physical Xbox verification remain pending. |
| RB | Expanded minimap | Solo supports it. Preview RB now opens/closes an expanded full-map view with team-relative terrain/sight and a viewport outline. Selection and the prior camera/cursor are preserved; A does not issue orders. Flare/detail/mode/waypoint tools and physical Xbox acceptance remain open. |
| Expanded minimap: Y, D-pad | Y focuses view; Up flare, Right detail, Left mode; hold Down clears waypoints | Solo has Y and the first three D-pad functions. Removed the unverified A focus alias; overlay and help now say Y. Focusing consumes Y release so it cannot trigger a gameplay shortcut. D-pad actions stay in minimap context. Preview now has Y view focus and consumes its release; B/RB/blur/suspension cancel and restore the previous view/cursor. Preview D-pad tools remain unavailable and do not leak into selection/gameplay. Waypoint reset and exact focus behaviour pending. |
| Y shortcut | Context-specific build/train; hold Y + Left changes shortcut; military toggles Line/Split | Solo Y shortcuts require a fresh gameplay press: menus, quick selection, cancellation, focus/controller changes and successful loading clear pending Y input. Orphan releases cannot build/train, while hold-Y cycling consumes release and fresh LT+Y retains five-unit training. Farm shortcuts and the RT build menu now require a living completed owned Mill; menu locks update from current prerequisites and placement rechecks them before charging. Only living ungarrisoned owned world villagers can receive the build order, including automatic fallback selection. The villager shortcut cycle now exposes the four documented Xbox choices House, Palisade Wall, Stone Wall and Farm; obsolete choices reset to House before use. Palisade Wall is available in the Founding Age for wood and appears on the economic build page. It has original pointed-timber procedural art, ordinary construction/repair/destruction and blocking, LT repeat placement, stable entity IDs and current-version save/load support. Its balance values are project values; exact Xbox wheel sectors and hardware acceptance remain pending. Military Y now switches between Line and Split for selections containing at least two distinct living owned ungarrisoned military world units; other formations remain in the command menu. Hold-Y + Left does not change the military formation. Y now issues immediate formation movement around the selected units' centre, using production pathfinding and blocked-slot fallbacks; land and naval groups use separate centres. Orders go only to eligible current-world units and leave the player's selection intact. Centre-targeted formations have a deterministic facing instead of collapsing all slots to zero. Reformation replaces the affected units' previous movement/combat orders. Split spacing, orientation, order-resumption semantics and actual projectile-dodging effectiveness still require Xbox comparison. The battlefield does not treat Y as Stop. RT+Y switches construction pages; military Y press/release now submits an authenticated Line/Split order for at least two selected military units. The host rechecks every member and route before any mutation; both replicas use separate land/naval centres and include formation choice in their checksums. Menus, selection/pointer changes, cancellation, modifiers, focus/controller resets and pending commands cancel unfinished Y gestures. Full formation wheels, persistent group movement and ordinary Y build/train shortcuts remain open. |
| R3 | Villager-priorities radial; Y manual ratios; stick resource, A adds, B removes | **PARTIAL** on solo/campaign at `d8b0401`: R3 opens a seven-preset canvas radial, left stick chooses, A applies, Y switches to a four-resource manual wheel, A/B adjust the selected resource weight and R3 closes. X currently toggles existing automation. Worker reassignment and save persistence reuse the existing `S.vp` system. **Provisional project weights/labels do not establish the seven official preset values or true population-scaled ratio parity; automatic farm construction/toggle and multiplayer R3 are still missing.** Exact sectors, button nuances and real Xbox hardware remain unverified. |
| Menu | Pause/options; multiplayer simulation keeps running | Solo pauses. Running preview now opens a local menu without leaving or pausing either player. Menu/B/Resume returns focus; explicit Leave match exits. Objectives now shows the verified shared victory rule and game clock without stopping play. B/Escape returns to the parent menu; Menu resumes. Current skirmish objectives are covered; scenario secondary objectives, diplomacy, tech tree and options pages remain pending. Exact Xbox menu layout and hardware parity remain unverified. |
| Camera pan / zoom | General Gameplay card: LS pans, RS zooms. LT Held card: RS navigates waypoints. | Solo/campaign and multiplayer now have direct RS vertical zoom and LS camera pan. Solo A boxes retain their world anchor during camera movement. RS horizontal input no longer pans. LT, command/group wheels, expanded minimap and pause cannot leak gameplay zoom. Multiplayer receives all four axes; camera changes are local and send no commands. Focus preserves the chosen zoom instead of forcing 2×. The optional solo menu slider remains. Current range is 0.8×–3.0×; the official Update 78174 console note gives maximum 3. Minimum, sensitivity, axis-direction convention, reticle options and initial framing still need physical Xbox comparison. LT navigation waypoints remain unavailable. |
| X, B, View, L3 and stick gestures | Context-sensitive functions | Preview X no longer clears selection, B deselects/closes its wheel, and left stick moves cursor. Removed solo generic-X-order alias and unsupported LT economy/zoom chords. Remaining contexts and gesture timings require direct reference capture; do not invent replacements. |

## Control-group save/load checks

Control groups use validated references to the saved unit/building arrays and
restore references to the loaded world, preserving slot positions and garrisoned
members. Saving removes duplicates, dead/foreign entities and stale references
from the serialized groups without changing the in-memory assignments. Existing
current-version saves without this optional field restore eight empty slots.
Malformed group arrays or forged references are rejected before replacing the
current world. Loading also clears the old radial menu, selection gesture and pending Y shortcut so
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

## Direct camera correction — 21 October 2026

The previous Menu > Zoom workaround and fixed 2× multiplayer focus did not meet
the matching-controls target. Direct RS zoom and LS camera panning are now
implemented in both modes. Zoom is frame-rate independent and uses the existing
right-stick dead zone. Focus retains the selected scale. The published console
maximum is 3 in [Update 78174](https://www.ageofempires.com/news/age-of-empires-ii-definitive-edition-update-78174/).
The unchanged 0.8 minimum, response curve, axis-direction convention and reticle
behavior remain project choices pending physical comparison.

Production input tests cover stick separation, dead zones, modifier/menu
isolation, A boxes while panning, rate independence, limits and unchanged world
checkpoints. Multiplayer HTTP tests preserve zoom through group focus and then
verify synchronized subsequent orders. The May 2026 cards also establish
remaining mismatches: general View should snap to notifications, X provides
Attack Move/special actions, and LT provides Find/category/waypoint controls.
These and R3 priorities are still gaps, not implemented or verified parity.


## Monk conversion coverage — 21 October 2026

Solo contextual A now requests conversion for eligible hostile targets when a
Monk is selected, including researched Atonement/Redemption target classes.
Authenticated battlefield contextual A and RT → Convert use the same typed,
host-validated conversion path. RT target mode waits for a hostile target; B,
selection changes, menus and suspension cancel it. Faith recharge and carrying a
relic lock the menu entry. Research uses the existing selected-building RT menu.
No new button binding is introduced. Exact Xbox sector layout and hardware
acceptance remain unverified. Occupied containers and full civilisation-specific
availability/bonuses still require their own acceptance.
