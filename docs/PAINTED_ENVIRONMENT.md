# Painted environment and full graphics inventory — 29 October 2026

The original built-in image-generation sheet adds a deer, fishing shoal, gilded reliquary and three complete trees: pine, oak and birch. The image is packed as `assets/painted-environment.webp`; the exact prompt is in [painted-environment-prompt.json](painted-environment-prompt.json). No extracted game artwork was used. Antlers and crowns crossing nominal source-cell boundaries are retained by the existing sprite-grid reflow with extra environment padding. Its new optional multi-object mode keeps detached fish together; the default single-character mode is unchanged. All six source sprites remain static, so this does not claim wildlife animation.

Both battlefield views use the new resource imagery. Solo tree height is capped at 86 base pixels and multiplayer tree height follows its map scale, retaining distinct silhouettes without unbounded canopies. Coordinate hashes choose a stable tree type; team recolouring never affects these neutral materials. Existing stone/gold/berry art remains, as do the farm and fish-trap paths. Fixed-size small texture crops are reused when zooming.

Ground and carried relics use the gilded sprite with a procedural fallback. Solo carried art follows the carrier's actual position and current visibility instead of drawing at the original ground coordinates; this changes only drawing/depth/culling. Multiplayer projects copied relic coordinates only from current team sight, excludes garrisoned relics and hidden carriers, and draws a reduced raised sprite for visible carriers. No simulation fields, pickup/deposit commands, resource amounts, save fields or controller mappings change. This does not complete multiplayer relic command parity.

`node scripts/build-environment-atlas.mjs` rebuilds metadata from the committed WebP; an optional generated PNG argument packs new source. The development-only packer requires `sharp`. Both painted/motion packers retain the new atlas. The effective manifest has 23 atlases, 1,416 entries and 2,536 frame references. Shell v28 caches the environment image.

The entire implemented visual scope is tracked in [graphics-inventory.json](graphics-inventory.json): all 47 playable troop types, all 22 buildings and eleven graphics categories. `node scripts/audit-graphics.mjs --check` rejects a stale inventory. Complete base coverage is not full visual acceptance: 19 troops have painted walk/attack sequences, 28 still need them, and independent direction/death art remains unfinished. Faction/age architecture, progressive resources, fish traps, destruction/effects, full interface iconography and physical Xbox Series S Edge acceptance also remain open.

Local validation passed 211 standalone regression files, source/atlas checks and the complete Chromium battlefield graphics suite. New cases cover six distinct decoded transparent neutral silhouettes, height bounds, resource routing, complete multi-object packing, carried/hidden/garrisoned relic projection and unchanged world checkpoints. Both projections, original team palettes, asset failure, cache upgrades, terrain transitions and the existing nine viewport-cache comparisons remain covered. Contact sheets and the staged multiplayer capture were visually inspected. Desktop timings do not establish Xbox performance.

---

## Historical original-art checkpoints

The following entries preserve dated art-generation and verification instructions. Live acceptance is tracked in `graphics-inventory.json` and the roadmap.

---

## Archived checkpoint: painted-fishtraps

*Originally documented in PAINTED_FISHTRAPS.md; source notes retained.*

### Painted fish traps — 29 October 2026

Four original wicker-basket, timber-frame and net variants replace the procedural fish-trap marker when artwork loads. They share the existing environment selector in solo and the team-relative battlefield. Geographic hashing chooses one stable variant; owner, clock and remaining food do not change the image. The atlas is neutral and bypasses cloth recolouring. Farms and ordinary fish shoals retain their own artwork, and failed/missing fish-trap images fall back to the existing procedural trap.

The original built-in generated source is preserved at [fishtraps-original.png](art-sources/fishtraps-original.png), with its [exact prompt](painted-fishtrap-prompts.json). The optional `build-fishtrap-atlas.mjs` validates a transparent two-by-two grid, retains multipart baskets/net/frame/rope, removes tiny detached debris and checks complete per-cell margins. It writes `painted-fishtraps.webp` and a separate neutral manifest. Base and motion rebuilds preserve the new atlas/version; shell v36 includes the image. All previously committed WebP object hashes remain unchanged.

Solo uses a 38-pixel reference width and the shared small-texture cache. The team-relative view scales it with its existing resource projection and terrain viewport. No simulation, ownership, gathering, replenishment, fog, economy, command, controller or save behavior changes.

Manifest `painted-raster-v15-fishtraps` contains 52 atlases, 1,760 animation entries and 4,476 frame references. Source/atlas/inventory checks, all 211 standalone regression files and the complete Chromium battlefield suite pass locally. The browser fixture checks four distinct transparent neutral variants, calls both actual draw paths, exercises image failure fallback and preserves node/world checksums. Its 38/76/114-pixel comparison was visually inspected. Fish-trap/base/motion packer rebuilds reproduce all WebPs and manifests byte-for-byte; stone, gold and berry tests still pass. [Verification](verification/fishtraps-2026-10-29.json) tracks deployment separately.

This completes the dedicated painted trap sprite, while physical Xbox Series S Edge waterline/readability review remains open. The [whole-game checklist](GRAPHICS_OVERHAUL_CHECKLIST.md) still tracks directions, work/death art, architecture, effects, interface and hardware acceptance.

Fish-trap runtime `ce68cffdd3a8ce1b532ef7a13177381ce20640a3` is verified live: renderer, manifest, shell and image SHA-256 values match source. Vercel reports success. Hosted GitHub jobs again fail before any steps; this is not a hosted CI pass.
