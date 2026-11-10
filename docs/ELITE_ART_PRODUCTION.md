# Four Elite sprite sheets — production brief

**Status: artwork specification only.** Four civilizations now have researched Elite gameplay and temporary Canvas2D equipment accents. No dedicated Elite painted animation sheets have been approved or committed. Use this brief to create original artwork, not copyrighted assets from other games.


**Figma review boards (10 November 2026):** [Editable original Elite art specification](https://www.figma.com/design/xCa6EgkpRf0Y1zUxK1yRXD?node-id=8-2) and [Visual QA and Xbox acceptance guide](https://www.figma.com/design/xCa6EgkpRf0Y1zUxK1yRXD?node-id=8-66). These are editable planning references only; the four missing Elite sprite sheets and on-device approvals remain outstanding. Follow [the UI/Figma handoff](FIGMA_UI_WORKFLOW.md) for the separate design-to-runtime boundary.

## Our connected creative stack

| Tool | Role | Boundary |
| --- | --- | --- |
| **Canva** | Original concept art and side-by-side silhouettes, armour and colour boards | Generating a concept is not producing consistent frame-by-frame sprites; free AI credits may be limited |
| **Adobe** | Paint cleanup, background removal, colour/alpha adjustment where free tools allow | Subscription-only edits must not be used without approval |
| **Figma** | Editable Xbox menu/HUD design, icon system and art-review layouts | Figma images are not automatic game assets |
| **Original game scripts** | WebP motion atlases, JSON frame maps, cache digest and Canvas2D integration | Need browser and hardware inspection |
| **Krita or LibreSprite (optional free tools)** | Frame alignment and animation retouching | Not installed ChatGPT plugins or game runtime dependencies |

Keep the deployed site dependency-free, retain the free hosting budget, and do not add paid design services or unreviewed stock content.

## Source-art targets

Match the original painted isometric perspective, upper-left light, shadow/feet anchor, team-colour mask and play-scale proportions of the **existing** movement sheet. Every visual should remain obviously unique to Crown & Kingdoms.

| Faction and unit key | Distinct original Elite concept | Existing base sheet |
| --- | --- | --- |
| Goths `huskarl` | Steel crested helm, reinforced dark mail, deep red accents, embossed round shield | `assets/painted-motion-huskarl.webp` |
| Britons `lbow` | Silver sallet, pale trimmed tunic, tall decorated longbow, reinforced quiver | `assets/painted-motion-lbow.webp` |
| Mongols `mgd` | Lamellar steppe rider, red-gold plume, distinctive horse harness and bow outline | `assets/painted-motion-mgd.webp` |
| Franks `axe` | Bright steel sallet, crimson crest, broad gilded double-bearded axe, original surcoat | `assets/painted-motion-axe.webp` |

## Game-ready checklist

1. Inspect the **actual** atlas/animation metadata, painted source and source provenance. Do not invent frame sizes or crop rectangles.
2. Approve one original transparent base-to-Elite pose for each unit, then create aligned idle, walk, attack wind-up/contact/recovery, hit/death and facing frames as supported. Record directions or states that are still missing.
3. Check feet alignment, body scale, transparent alpha, colour tint and that weapons are not cropped. Mirroring is not independent directional artwork.
4. Use `scripts/build-motion-atlas.mjs`, `scripts/sprite-grid.mjs` and existing packers to create the WebP atlas. Update `assets/atlas-manifest.json` and `assets/motion-manifest.json` from the actual frames.
5. Update `js/assets.js` and `js/render-troops.js` so only the owning team's researched `eliteUniqueUnitUpgrade` selects the new frames. Keep the base art and procedural fallback.
6. Rebuild `assets/art-revisions.json` and review `sw.js` versioning. Run `node scripts/build-art-revisions.mjs --check`, `node scripts/check-game.mjs`, `node tests/validate-atlas.mjs`, `node scripts/audit-graphics.mjs --check` and focused tests.
7. Review in real Chromium: both teams, pause, fog, zoom, animation, cold/warm/offline and grouped army rendering. Require matched **physical Xbox Series S Edge** FPS/RAF/SIM/DRAW measurements before hardware acceptance.

A Canva concept, Adobe retouch or Figma art board is **not** a shipped sprite. Track visual work at [issue #97](https://github.com/johnstacey16-ui/crown-and-kingdoms/issues/97); record original asset rights and future tested results in [the game-building skill](../.github/skills/browser-rts-game-dev/SKILL.md).
