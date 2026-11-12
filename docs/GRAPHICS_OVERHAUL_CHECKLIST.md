# Complete graphics overhaul checklist

Tracks every current visual category, including unfinished art. Source catalogue: [graphics-inventory.json](graphics-inventory.json). Regenerate with `node scripts/audit-graphics.mjs`; verify with `--check`.

| Category | Status | Remaining work |
|---|---|---|
| Unit base artwork | present | play-scale faction/direction review |
| Unit animation | partial | 34 kinds, independent directions, work variants and dedicated death sheets |
| Elite unit visuals | partial | four researched Elite lines have interim equipment overlays; [dedicated painted frames still needed](ELITE_ART_PRODUCTION.md) |
| Building artwork | partial | faction architecture and dedicated age/construction/damage sheets (shared age fittings, staged reveals/scaffolds and native damage overlays now implemented) |
| Terrain and coasts | partial | biome-specific integration and repetition review |
| Natural resources | partial | tree/death states and physical Xbox resource/wildlife readability |
| Fish traps | partial | waterline/readability review on Xbox |
| Relics | partial | hardware readability and animated pickup/deposit presentation |
| Combat and world effects | partial | dedicated destruction/impact art and full effects acceptance (shared projectile families and building fire/smoke now implemented) |
| HUD, menus and command wheels | partial | complete icon set, scene backgrounds and Xbox readability review |
| Minimap and multiplayer presentation | partial | full match and large scene acceptance |
| Xbox Series S Edge image/performance | unverified | physical Xbox 50/75/100 percent picture presets and large land/naval benchmarks |

## Painted movement/activity roster

Eagle Warrior, Cavalry Archer, Turtle Ship, Organ Gun, Caravel, Arambai, Rattan Archer, Battle Elephant, Konnik, Dismounted Konnik, Keshik, Kipchak, Steppe Lancer, Flaming Camel, Leitis, Coustillier, Flemish Militia, Serjeant, Obuch, Winged Hussar, Hussite Wagon, Houfnice, Urumi Swordsman, Thirisadai, Ratha (Ranged), Ratha (Melee), Chakram Thrower, Shrivamsha Rider, Camel Scout, Centurion, Legionary, Composite Bowman, Warrior Priest, Monaspa.

All 84 playable kinds have native painted or original procedural fallback artwork. Dedicated directional/work/death art still requires review across the full roster; an eight-frame sheet is not eight independent directions. New gameplay/DLC catalogue entries must also receive art and acceptance coverage.
