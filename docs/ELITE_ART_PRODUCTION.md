# Dedicated Elite sprite sheets — production brief

**22 November 2026: seven dedicated sheets, verified at `a95e1471`.** Elite Woad Raider, Berserk and Samurai join the original four with distinct armour/equipment, eight walk and eight attack poses each. [New source prompts](painted-elite-infantry-prompts.json) record the original image-generation briefs. [Hosted acceptance](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/44980981304) passed quick 5/5, focused 1,754, Chromium 2/2 and Xbox software 8/8; all 56 action/team cases have eight distinct decoded poses, blue/red contact sheets were reviewed, and both renderers use the owning researched tier. Existing 102 atlas definitions and positions are preserved. Use `node scripts/build-elite-atlas.mjs --source KIND PNG` for incremental batches; no-source rebuilds preserve approved WebP bytes and provenance. The original four positional PNG arguments remain supported. Independent facings, work/hit/death and physical Xbox acceptance remain open.

**17 November 2026: four dedicated sheets implemented and browser-verified at `94170754`.** Goth Huskarl, Briton Longbowman, Mongol Mangudai and Frankish Throwing Axeman now have original painted Elite idle/walk/attack artwork (16 source poses each). The runtime selects these after the owning civilization completes research and preserves base-art fallback. Other Elite units retain temporary equipment accents. Independent facings, hit/death sheets and physical Xbox acceptance remain unfinished.

The four `assets/painted-elite-*.webp` files and `assets/elite-manifest.json` were authored with built-in image generation using this repository's own base sheets as references, followed by a padding correction. No commercial game artwork was used. [Prompts and provenance](painted-elite-prompts.json) retain the source brief; `scripts/build-elite-atlas.mjs` packs transparent 4×4 sheets, rejects clipped figures, retains original alpha and updates byte-bound offline revisions. Base-sheet rebuilders preserve the Elite manifest. Runtime and CI need no image-authoring dependency.

Solo research selection, wrong-team rejection, atlas-loss fallback, supplied-world multiplayer projection and bounded tint warm-up have targeted software coverage. Chromium checks the actual solo draw, all four palettes, eight walk/attack poses, mirrored views and simulation invariance; its contact sheet is retained in the explicitly requested graphics-review artifact. Do not infer dedicated death/eight-direction artwork or Xbox approval from this batch.

**Accepted evidence:** [Chromium, room and Xbox software run](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/44141722702) passed 2/2 browser checks and 8/8 software selections, with 612 strict reflection comparisons at maximum delta zero. The [rendered Elite review artifact](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/44141722702/artifacts/14354058464) records 32 action/team samples, each with eight distinct decoded poses, and unchanged world hashes. Both solo and supplied-world multiplayer draws were observed for all four units; blue/red contact-sheet armour, equipment and palette presentation was visually reviewed. Local focused tests passed 1,741/1,741; quick gates passed 5/5. The missing-motion browser scenario now blocks both base and Elite sheets and verifies base-art recovery. This batch is on development; it is not a new production release.


**Figma review boards (10 November 2026):** [Editable original Elite art specification](https://www.figma.com/design/xCa6EgkpRf0Y1zUxK1yRXD?node-id=8-2) and [Visual QA and Xbox acceptance guide](https://www.figma.com/design/xCa6EgkpRf0Y1zUxK1yRXD?node-id=8-66). These are historical editable planning references; independent-facing/state artwork and on-device approvals remain outstanding. Follow [the UI/Figma handoff](FIGMA_UI_WORKFLOW.md) for the separate design-to-runtime boundary.

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
| Celts `woad` | Steel shoulder guards, fur mantle, blue wrap and engraved crescent axe | `assets/painted-motion-woad.webp` |
| Vikings `bers` | Nasal helmet, mail, reinforced round blue shield and engraved axe | `assets/painted-motion-bers.webp` |
| Japanese `saml` | Wide gold crescent kabuto, reinforced blue-laced lamellar armour and katana | `assets/painted-motion-saml.webp` |

## Game-ready checklist

1. Inspect the **actual** atlas/animation metadata, painted source and source provenance. Do not invent frame sizes or crop rectangles.
2. Approve one original transparent base-to-Elite pose for each unit, then create aligned idle, walk, attack wind-up/contact/recovery, hit/death and facing frames as supported. Record directions or states that are still missing.
3. Check feet alignment, body scale, transparent alpha, colour tint and that weapons are not cropped. Mirroring is not independent directional artwork.
4. Use `scripts/build-motion-atlas.mjs`, `scripts/sprite-grid.mjs` and existing packers to create the WebP atlas. Update `assets/atlas-manifest.json` and `assets/motion-manifest.json` from the actual frames.
5. Update `js/assets.js` and `js/render-troops.js` so only the owning team's researched `eliteUniqueUnitUpgrade` selects the new frames. Keep the base art and procedural fallback.
6. Rebuild `assets/art-revisions.json` and review `sw.js` versioning. Run `node scripts/build-art-revisions.mjs --check`, `node scripts/check-game.mjs`, `node tests/validate-atlas.mjs`, `node scripts/audit-graphics.mjs --check` and focused tests.
7. Review in real Chromium: both teams, pause, fog, zoom, animation, cold/warm/offline and grouped army rendering. Require matched **physical Xbox Series S Edge** FPS/RAF/SIM/DRAW measurements before hardware acceptance.

A Canva concept, Adobe retouch or Figma art board is **not** a shipped sprite. Track visual work at [issue #97](https://github.com/johnstacey16-ui/crown-and-kingdoms/issues/97); record original asset rights and future tested results in [the game-building skill](../.github/skills/browser-rts-game-dev/SKILL.md).
