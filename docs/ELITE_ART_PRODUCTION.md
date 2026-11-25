# Dedicated Elite sprite sheets — production brief

**25 November 2026: forty-four dedicated sheets, verified at `dc7ef968`; all 42 current main Elite kinds plus melee Ratha and dismounted Konnik have original walking/attack sheets.** Dismounted Konnik adds sixteen poses, for 704 authored Elite poses. [Original prompt](painted-elite-footkonnik-prompts.json) uses the repository-owned base infantry and approved mounted Elite as references, retaining its foot sword/kite shield and matching the mounted armour, crest and cloak. Final art is `assets/painted-elite-footkonnik.webp`, with infantry body height 46 and base walking cadence. A single read-only appearance helper maps the dismounted form to the owning team's Konnik research for solo drawing, supplied-world projection, warm-up and label. Combat upgrade eligibility and existing dismounted HP remain unchanged; this is visual coverage, not a balance/parity repair. The real-dismount contract confirms the spawned infantry uses the Elite sheet and label, retains 45 HP and leaves state unchanged while resolving artwork. Existing isolated consumers retain their old helper fallback. [Hosted acceptance](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/45534824709) passed quick 5/5, focused 1,760, Chromium 2/2 and Xbox software 8/8. All 352 action/team cases have eight distinct decoded poses, zero preview-edge pixels and unchanged world state. All 176 paired blue/red samples pass the contrast gate (minimum 222 changed pixels, floor 100). The final infantry PNG was inspected for complete sword, shield, crest, cloak and boots, clear blue/red ownership and natural neutral materials. Solo and supplied-world rendering select the owning researched appearance and retain visible painted/procedural fallback on image failure; all 1,500 reflections have zero delta. The accepted native transparent source passes the unchanged infantry authoring gate. All 141 earlier atlas definitions/positions survive, and no-source rebuilding preserves all 44 approved sheets, provenance, metadata and cache revisions byte-for-byte. Independent facings, work/hit/death, building states, physical Xbox and production acceptance remain open.

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
| Teutons `tk` | Crested faceted greathelm, fluted plate, blue-lined ivory cloak and reinforced kite shield | `assets/painted-motion-tk.webp` |
| Aztecs `jaguar` | Quilted armour, blue feather fan, gold sun shield and obsidian-edged club | `assets/painted-motion-jaguar.webp` |
| Incas `kamayuk` | Stepped bronze armour, rectangular blue/gold shield and complete long spear | `assets/painted-motion-kamayuk.webp` |
| Ethiopians `shotel` | Gold-banded mail coif, bronze armour, blue/gold oval shield and curved shotel | `assets/painted-motion-shotel.webp` |
| Malians `gbeto` | Gold-clasp headwrap, reinforced ivory/blue tunic and crescent throwing iron | `assets/painted-motion-gbeto.webp` |
| Poles `obuch` | Ridged kettle helm, fluted plate, blue mantle and faceted two-handed warhammer | `assets/painted-motion-obuch.webp` |
| Turks `jan` | Gold-fronted felt cap, blue/gold coat, reinforced breastplate and decorated matchlock | `assets/painted-motion-jan.webp` |
| Chinese `chuko` | Gold-ridged helmet, silver lamellar armour and bronze-fitted repeating crossbow | `assets/painted-motion-chuko.webp` |
| Italians `genoa` | Gold-clasp blue cap, fluted plate, reinforced pauldrons and steel-limbed crossbow | `assets/painted-motion-genoa.webp` |
| Mayans `plumed` | Gold/turquoise headband, blue feather fan, reinforced ivory cotton armour and decorated bow | `assets/painted-motion-plumed.webp` |
| Vietnamese `rattan` | Bronze-edged woven armour, reinforced conical hat, blue sleeves and recurved bow | `assets/painted-motion-rattan.webp` |
| Armenians `composite` | Gold-banded helmet, steel lamellar armour, blue cape and horn/wood composite bow | `assets/painted-motion-composite.webp` |
| Dravidians `urumi` | Gold-banded turban, bronze lamellar armour, blue waist panels and complete flexible ribbon sword | `assets/painted-motion-urumi.webp` |
| Gurjaras `chakram` | Gold-banded turban, scale armour, blue sash and open-centred steel throwing rings | `assets/painted-motion-chakram.webp` |
| Sicilians `serjeant` | Reinforced greathelm, fluted plate, blue diamond shield and broad straight sword | `assets/painted-motion-serjeant.webp` |
| Byzantines `cata` | Crested helm, gold-edged lamellar horse armour, blue caparison and complete lance | `assets/painted-motion-cata.webp` |
| Slavs `boyar` | Reinforced plate, fur collar, blue cloak/horse panels and flanged mace | `assets/painted-motion-boyar.webp` |
| Lithuanians `leitis` | Ridged helmet, lamellar armour, striped oval shield, short spear and grey horse | `assets/painted-motion-leitis.webp` |
| Huns `tarkan` | Blue-plumed helmet, reinforced raider armour, blue cloak and complete flaming torch | `assets/painted-motion-tarkan.webp` |
| Tatars `keshik` | Gold-banded helmet, reinforced lamellar armour, blue saddle cloth and curved sabre | `assets/painted-motion-keshik.webp` |
| Georgians `monaspa` | Reinforced plate, round blue/gold shield, blue caparison and complete lance | `assets/painted-motion-monaspa.webp` |
| Spanish `conq` | Gold-edged morion, reinforced plate, blue coat and complete mounted matchlock | `assets/painted-motion-conq.webp` |
| Magyars `huszar` | Tall blue crest, ivory-lined blue cloak, reinforced armour and lance | `assets/painted-motion-huszar.webp` |
| Burgundians `coust` | Fluted plate, gold-striped blue heater shield and complete couched lance | `assets/painted-motion-coust.webp` |
| Saracens `mamel` | Gold-banded ivory turban, lamellar armour, blue camel drape and complete curved blade | `assets/painted-motion-mamel.webp` |
| Cumans `kipchak` | Blue-crested helmet, reinforced lamellar coat and complete recurve bow/string | `assets/painted-motion-kipchak.webp` |
| Romans `centurion` | Blue transverse crest, reinforced segmented armour, oval sun shield and gladius | `assets/painted-motion-centurion.webp` |
| Burmese `arambai` | Gold-banded headwrap, reinforced lamellar vest, blue panels and complete dart basket | `assets/painted-motion-arambai.webp` |
| Bulgarians `konnik` | Silver/gold armour, blue crest/cloak, gold-chevron kite shield and full spear | `assets/painted-motion-konnik.webp` |
| Persians/Khmer `ele` | Reinforced elephant forehead/neck plates, blue caparison and single mahout | `assets/painted-motion-ele.webp` |
| Indians `eled` | Reinforced blue/gold howdah, silver-armoured bowman and complete bow/string | `assets/painted-motion-eled.webp` |
| Koreans `wagon` | Reinforced oak launcher cart, silver/gold rims/hubs and broad blue panels | `assets/painted-motion-wagon.webp` |
| Portuguese `orgun` | Reinforced oak gun carriage, silver/gold clamps, blue panels and complete barrel bank | `assets/painted-motion-orgun.webp` |
| Bohemians `husswagon` | Reinforced roofed oak wagon, silver/gold braces, blue panels and gun ports | `assets/painted-motion-husswagon.webp` |
| Bengalis `ratha` | Reinforced blue/gold two-horse chariot, matching crew and complete recurve bow | `assets/painted-motion-ratha.webp` |
| Bengalis `rathaM` | Same Elite chariot/crew/horses with complete melee spear | `assets/painted-motion-ratha-melee.webp` |
| Bulgarians `footkonnik` | Matching mounted Elite armour/crest/cloak, gold-chevron kite shield and full infantry sword | `assets/painted-motion-footkonnik.webp` |

## Game-ready checklist

1. Inspect the **actual** atlas/animation metadata, painted source and source provenance. Do not invent frame sizes or crop rectangles.
2. Approve one original transparent base-to-Elite pose for each unit, then create aligned idle, walk, attack wind-up/contact/recovery, hit/death and facing frames as supported. Record directions or states that are still missing.
3. Check feet alignment, body scale, transparent alpha, colour tint and that weapons are not cropped. Mirroring is not independent directional artwork.
4. Use `scripts/build-motion-atlas.mjs`, `scripts/sprite-grid.mjs` and existing packers to create the WebP atlas. Update `assets/atlas-manifest.json` and `assets/motion-manifest.json` from the actual frames.
5. Update `js/assets.js` and `js/render-troops.js` so only the owning team's researched `eliteUniqueUnitUpgrade` selects the new frames. Keep the base art and procedural fallback.
6. Rebuild `assets/art-revisions.json` and review `sw.js` versioning. Run `node scripts/build-art-revisions.mjs --check`, `node scripts/check-game.mjs`, `node tests/validate-atlas.mjs`, `node scripts/audit-graphics.mjs --check` and focused tests.
7. Review in real Chromium: both teams, pause, fog, zoom, animation, cold/warm/offline and grouped army rendering. Require matched **physical Xbox Series S Edge** FPS/RAF/SIM/DRAW measurements before hardware acceptance.

A Canva concept, Adobe retouch or Figma art board is **not** a shipped sprite. Track visual work at [issue #97](https://github.com/johnstacey16-ui/crown-and-kingdoms/issues/97); record original asset rights and future tested results in [the game-building skill](../.github/skills/browser-rts-game-dev/SKILL.md).
