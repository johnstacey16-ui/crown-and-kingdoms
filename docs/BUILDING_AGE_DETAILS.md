# Shared building age details

All 22 painted building kinds now present an observed Dark, Feudal, Castle or Imperial state in both the solo renderer and the team-relative battlefield view.

- Houses and Town Centres retain their four dedicated original raster designs.
- The other 20 kinds retain the exact native painted atlas frame and anchor, then receive original Canvas2D architectural fittings: lashed timber braces, a Feudal standard, Castle stone shields or an Imperial gilded standard and roof chain.
- The fittings use the actual kingdom palette and deterministic kind placement. They allocate no retained textures and do not alter the bounded troop or building-damage caches.
- Owned buildings use the current age. Enemy buildings update only in current sight and otherwise retain the last observed presentation. Unknown hidden ages are not exposed.
- Construction stages and placement ghosts do not show completed age fittings. Repairs, damage effects, controls, simulation entities, checkpoints and saves are unchanged.

## Acceptance

The browser check renders 20 kinds × 4 ages × 4 palettes = 320 non-house/Town-Centre cases. Every kind/palette produces four distinct pixel hashes while retaining the same native source frame across ages. Actual solo and team-relative callers each deliver ages 0–3, and the world checkpoint is unchanged.

The 219 standalone regression files and the full Chromium graphics suite passed locally. The full suite also retained the construction, damage, projectile, resource (stone, gold and berries), terrain, tint-cache, fog and external-art-failure checks.

This is shared age readability, not dedicated four-sheet art for the other 20 buildings and not faction architecture. Those remain roadmap gaps, as do physical Xbox Series S Edge acceptance and actual-origin browser acceptance.
