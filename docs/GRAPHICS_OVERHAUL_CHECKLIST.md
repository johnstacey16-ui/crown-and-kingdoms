# Complete graphics overhaul checklist

Tracks every current visual category, including unfinished art. Source catalogue: [graphics-inventory.json](graphics-inventory.json). Regenerate with `node scripts/audit-graphics.mjs`; verify with `--check`.

| Category | Status | Remaining work |
|---|---|---|
| Unit base artwork | present | play-scale faction/direction review |
| Unit animation | partial | 21 kinds, independent directions, work variants and dedicated death sheets |
| Elite unit visuals | partial | remaining Elite lines, independent directions, death sheets and Xbox acceptance; [production detail](ELITE_ART_PRODUCTION.md) |
| Building artwork | partial | faction architecture and dedicated age/construction/damage sheets (shared age fittings, staged reveals/scaffolds and native damage overlays now implemented) |
| Terrain and coasts | partial | biome-specific integration and repetition review |
| Natural resources | partial | tree/death states and physical Xbox resource/wildlife readability |
| Fish traps | partial | waterline/readability review on Xbox |
| Relics | partial | hardware readability and animated pickup/deposit presentation |
| Combat and world effects | partial | dedicated destruction/impact art and full effects acceptance (shared projectile families and building fire/smoke now implemented) |
| HUD, menus and command wheels | partial | original Canvas2D icon artwork for 15 command categories now drawn in compact and radial menus; remaining unique unit/technology icons, scene backgrounds and physical Xbox readability review |
| Minimap and multiplayer presentation | partial | full match and large scene acceptance |
| Xbox Series S Edge image/performance | unverified | physical Xbox 50/75/100 percent picture presets and large land/naval benchmarks |

## Painted movement/activity roster

Turtle Ship, Organ Gun, Caravel, Arambai, Battle Elephant, Kipchak, Steppe Lancer, Flaming Camel, Coustillier, Winged Hussar, Hussite Wagon, Houfnice, Urumi Swordsman, Thirisadai, Ratha (Ranged), Ratha (Melee), Chakram Thrower, Shrivamsha Rider, Camel Scout, Centurion, Monaspa.

All 84 playable kinds have native painted or original procedural fallback artwork. Dedicated directional/work/death art still requires review across the full roster; an eight-frame sheet is not eight independent directions. New gameplay/DLC catalogue entries must also receive art and acceptance coverage.

## In-progress command icon art (17 November 2026)

The shared controller command renderer now paints distinct vector silhouettes for food, wood, stone, trade, houses, bows, cavalry, ships, towers, relics, siege, forges, infantry, construction, and generic commands. Glyphs use only Canvas2D paths: there are no new downloads or image caches, and gamepad selection/paging remains unchanged. A focused test checks category selection, finite geometry, balanced canvas state and integration in both wheel layouts. These are **original UI glyphs**, not the unfinished troop directional/death sheets or physical Xbox sign-off.
