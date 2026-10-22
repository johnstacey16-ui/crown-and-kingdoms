# AoE II: Definitive Edition (Xbox) — villager economy audit

The requested **8 tree / 6 gold / 6 stone / 3 berries** values are not
documented Age of Empires II hard limits. The implemented assignment uses
reachable adjacent approach spaces, rather than those unverified constants.
**Farms are exclusive to one villager**, including while the first is
carrying food back to the drop-off point. Worker assignments choose nearby
non-full resources and do not stand in a queue at full sites.

Base villager movement changed from Crown & Kingdoms' 1.5 to AoE II's 0.8
tiles/second. Wheelbarrow adds 10% movement and 25% base carrying capacity;
Hand Cart adds a further 10% movement and 50% base carrying capacity.
Crown & Kingdoms' own separate generic Carry Capacity research remains.

| Source | Base units/second | Time for 10 (no travel) |
|---|---:|---:|
| Tree wood | .39 | 25.64 seconds |
| Gold | .38 | 26.32 seconds |
| Stone | .36 | 27.78 seconds |
| Berry bush | .31 | 32.26 seconds |
| Farm | .32 | 31.25 seconds |
| Hunting | .41 | 24.39 seconds |
| Fishing | .43 | 23.26 seconds |

These are continuous gather rates, NOT discrete 2-second bursts. They
receive existing game research modifiers and use deposit trips. No hardcoded
"work timer resets" was added because these do not reflect AoE II gathering.
Manual and automatic assignments enforce resource kinds; wood yields wood,
stone stone, gold gold and food food. Unit movement speed varies with upgrades.

AoE II base villager line of sight is **four tiles**, but the explored world is
owned by the **player**: other friendly scouts and units reveal resources too.
The existing player-shared `S.ex` explored grid therefore remains in place.
Automated player workers now select known explored nodes; per-villager private
resource memory was deliberately not introduced. Terrain/tree occlusion that
would make exploration private is likewise not part of the verified mechanic.

Construction is deliberately **not forced** on every nearby gathering
villager: AoE II requires player-issued build/site commands and has an
Xbox auto-economy Villager Priorities feature. Crown & Kingdoms retains
its existing explicit build orders, and the Xbox-style resource priority
system stays active.

**Visual limitation:** current painted Villager work artwork is a shared
pickaxe work sheet. Resource-specific unique painted axe/chopping and bare-hand
harvest cycles are not yet authored. This economy parity change does not claim
the missing frames; no new graphics are faked or substituted.

Sources:
- https://www.ageofempires.com/learn-to-play/military-economy-xbox/
- https://www.ageofempires.com/learn-to-play/controlling-your-empire-gathering-resources-xbox/
- https://ageofempires.fandom.com/wiki/Villager_(Age_of_Empires_II)
- https://ageofempires.fandom.com/wiki/Farm_(Age_of_Empires_II)
