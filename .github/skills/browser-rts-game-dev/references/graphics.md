# Original sprites, animation and Xbox rendering workflow

Build the visual identity **alongside** the mechanic. Ground the art style in [original painted sources](../../../../docs/PAINTED_ART.md), [motion history](../../../../docs/PAINTED_MOTION.md), [current graphics checklist](../../../../docs/GRAPHICS_OVERHAUL_CHECKLIST.md) and `docs/graphics-inventory.json`. Historical asset counts in old docs are not a fresh audit.

## A complete new unit or Elite appearance

1. **Art brief:** original silhouette, faction armour/weapons/shield, grounded isometric perspective, consistent lighting, feet anchor, shadow, team tint mask and readability at game scale. Keep source and rights/provenance; do not rip other games' art.
2. **States and facings:** design base and **distinct** Elite variation, idle/ready, walk, attack windup/strike/recovery, work where applicable, hit/damage/death and facing directions. Mirroring one pose does **not** prove 8-direction coverage.
3. **Author/review:** check source image visually, transparent background, no clipped feet/weapons or neighboring cells, consistent body sizes and anchor across frames.
4. **Pack/describe:** `assets/painted-*.webp`, `assets/atlas-manifest.json`, `assets/motion-manifest.json` and building-age manifests are packed/named assets. `scripts/build-painted-atlas.mjs`, `scripts/build-motion-atlas.mjs` and `scripts/sprite-grid.mjs` handle trimming/authoring; some packers need an optional local `sharp` installation.
5. **Integrate runtime:** `js/assets.js`, `js/render-troops.js` choose poses/team-tints; `js/render-buildings.js` draws age/construction/damage; `js/render-terrain.js` handles transitions; `js/render-effects.js` draws impacts. Preserve `js/render-procedural-units.js` fallback on missing images.
6. **Offline integrity:** after changing image bytes rebuild `assets/art-revisions.json` with `node scripts/build-art-revisions.mjs` and appropriate `sw.js` shell generation. Check `node scripts/build-art-revisions.mjs --check`, `node scripts/check-game.mjs`, `node tests/validate-atlas.mjs`, `node scripts/audit-graphics.mjs --check`; failed service-worker upgrades must keep a working cached game.
7. **Live browser acceptance:** check warm/cold/offline/update, alpha edges, team colour, pause timing, fog, selection, zoom, army overlaps and actual display of each new atlas frame.
8. **Physical Xbox:** run comparable 50/100/200-unit in-game performance scenes, log FPS/RAF/SIM/DRAW/UNIT, backing resolution, picture preset, visible vs total entities, focus and readability. Desktop/Node estimates are not a Series S test.

## How to retain quality and speed

Profile simulation time, world drawing and compositor gaps **separately** before optimizing. Bound caches for team-tinted frames and sprite warmup rather than precomputing every unit × frame × team × zoom; cull safely, preserve painted terrain, stone, gold, berry, wildlife and troop assets, and protect fog/target legality. Diagnose black terrain as potential transition/cache/image/canvas faults, not automatically AI performance.

**10 November art debt:** Goth Elite Huskarl, Briton Elite Longbowman and Mongol Elite Mangudai gameplay passed focused tests but still need distinct **verified Elite sprites**. Keep VISUAL PARTIAL until the real images are integrated and tested; don't call an entire civilization complete because the technology changes its label.

## Creative stack in the 10 November production plan

Connected **Canva, Adobe and Figma** support original concepts, image cleanup and editable game HUD/art-board review. They are not runtime dependencies or substitutes for game sprites. Use the [four-unit Elite sheet brief](../../../../docs/ELITE_ART_PRODUCTION.md), optional free frame editors, existing named WebP atlas scripts and verifiable cache/browser/physical Xbox checks. Stay within free features and verify usage/redistribution rights. Franks join Goths, Britons and Mongols as **gameplay-verified but dedicated-art partial**.
