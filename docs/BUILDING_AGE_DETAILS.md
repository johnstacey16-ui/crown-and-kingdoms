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

Runtime `76143f03a06e6aae96b1a3c35c3c2e452bf18103` is live through the existing free Vercel Git integration at deployment `dpl_7iPcDDYfmRABE3YCAWqene7vNTDg`; all 64 production source/art SHA-256 comparisons match. Hosted GitHub runs 40989563544, 40989563590 and 40989563672 failed before exposing steps, so their cause remains unverified and local passes are not a hosted CI pass.

---

## Historical original-art checkpoints

The following entries preserve dated art-generation and verification instructions. Live acceptance is tracked in `graphics-inventory.json` and the roadmap.

---

## Archived checkpoint: painted-house-ages

*Originally documented in PAINTED_HOUSE_AGES.md; source notes retained.*

### Original house-age architecture — 29 October 2026

Houses now have four original designs for the game's existing Founding, Feudal, Castle and Imperial ages: a simple timber/wattle dwelling, a larger half-timber cottage, a stone-and-timber tiled home and a dressed-stone two-storey home. Their game footprint, cost, health, housing and construction rules are unchanged. The designs retain the existing isometric painted materials and recolourable blue cloth. They are a shared original architecture progression; faction-specific house sets and other building age sets remain unfinished.

Both solo and the team-relative map use `paintedBuildingFrame`. Missing new artwork falls through to the original painted house, then the existing procedural path. Solo keeps last observed house age in a presentation-only WeakMap. It records enemy/allied ages only under current sight, and reads the player's own age normally. An unknown hidden house retains the original artwork. The team-relative projection copies `architectureAge` only for owned or currently visible houses; hidden enemies never enter that projection. This does not change existing building fog/removal behavior, persist visual knowledge to saves or add a network gameplay field/protocol version. Fresh loaded objects remain unknown until observed.

The [built-in generation prompt](painted-house-age-prompts.json) references the original building sheet for materials and camera. The generated native source was 1254×1254, with four complete cells; the prompt's requested 1024 size was not used as a resampling instruction. The optional packer preserves source resolution and complete multipart details, pads cells and produces a separate 1510×1510 transparent WebP/manifest. The original building sheet and every earlier WebP remain unchanged. Age designs occupy the same rendered footprint width, with height following their actual silhouette. Team tinting uses the existing blue-pixel rule.

Eight authoring packers reproduce all 72 WebPs/manifests/revision catalogue/worker files byte-for-byte. The shared optional age-art merge retains the new atlas and v18 version through base/motion/resource/environment rebuilds. The active catalogue now contains 56 atlases, 1,832 animation entries and 4,562 frame references. Shell v40 adds the new image and regenerates verified content revisions for all 57 active images.

All 213 standalone regression files passed after correcting two former exact-selector/version expectations and rerunning those files. Source/atlas/inventory checks and the full real Chromium battlefield suite passed, after updating the expected nine non-motion atlases in its partial-image-failure fixture. New tests cover all four ages and four team colours, actual solo/map draw paths, hidden-age retention, visible/owned-only projection, original fallback and unchanged simulation checkpoints. Blue/red 1×/2× contact sheets were inspected. The browser cache update fixture also passed with the expanded 57-image set. [Production evidence](verification/house-ages-2026-10-29.json) is recorded separately.

This is the first building age-art increment, not complete architecture or game/DLC parity. Dedicated construction/damage sheets, every faction's building set, other building ages and physical Xbox Series S Edge readability/performance remain on the [whole-game checklist](GRAPHICS_OVERHAUL_CHECKLIST.md). The existing 50/75/100 picture presets and sharp HUD are unchanged.

House runtime `1486d0f8613b93ecd4e786571bdc2809970d9197` is verified live: all 62 production SHA-256 comparisons match (both renderers, worker, revision catalogue, atlas manifest and all 57 active images). Vercel reports success. Hosted runs 40952160693 / 40952160568 / 40952160546 failed before steps; cause unverified. Behavioral Chromium checks are local; production content matches do not establish Xbox hardware or actual-origin browser acceptance.

---

## Archived checkpoint: painted-town-centre-ages

*Originally documented in PAINTED_TOWN_CENTRE_AGES.md; source notes retained.*

### Original Town Centre age architecture — 29 October 2026

Town Centres now have four original civic designs for the existing Founding, Feudal, Castle and Imperial ages: a low timber communal hall, a larger half-timber hall with open veranda, a stone hall with arched loggia and modest civic belfry, and a richer dressed-stone civic hall. Blue entrance cloth/roof flags retain the existing team-colour rule. These are shared original designs; faction architecture is still unfinished. The previous Town Centre remains the missing-new-art fallback, followed by the procedural renderer if all painted art fails.

The common building-age selector and presentation-only observation WeakMap now support houses and Town Centres. Solo records non-player building ages only under current sight. Team-relative projection copies age appearance only for owned/visible buildings. Hidden advances do not select new art; unknown hidden buildings retain original art. Visual knowledge is not added to saves, and existing building fog/removal behavior is unchanged. No Town Centre footprint, health, costs, training, research, attacks, queue/rally commands, controller behavior or gameplay protocol changed.

The [exact built-in prompt](painted-town-centre-age-prompts.json) references only the original building sheet's material/camera style. Actual source PNG dimensions are 1254×1254, and the padded WebP is 1510×1510; no resampling to the prompt's requested dimensions occurred. Original source resolution, complete eaves/flags and multipart details are preserved. The new asset is separate; all earlier WebP hashes remain unchanged. The house documentation's formerly inferred 1280/1536 dimensions are corrected to these measured 1254/1510 dimensions as well.

A shared `scripts/building-age-art.mjs` replaces the house-only merge helper and retains both age atlases/version through all nine authoring packers. All 74 WebPs/manifests/content-catalogue/worker files rebuild byte-identically. Catalogue v19 contains 57 atlases, 1,896 entries and 4,626 frame references. Shell v41 includes 58 content-verified images.

All 214 standalone regression files, source/atlas/inventory checks and the full real Chromium graphics suite passed locally. The new fixture covers four ages/four palettes through both actual draw paths, visible-only observation, original fallback and unchanged simulation checkpoints. Blue/red 1×/2× contact sheets were inspected. Existing houses, resources, fish traps, wildlife, unit motion, cache upgrades and full/partial missing-image fallback remain covered. [Production verification](verification/town-centre-ages-2026-10-29.json) is tracked separately.

A catalogue dimension audit estimates 574.15 MiB of nominal RGBA atlas pixels and 520.65 MiB for one complete set of tintable atlas copies. These are theoretical pixel totals, not measured resident/GPU memory, actual cache occupancy or Xbox FPS. Team copies are lazy; browser image decoding has its own lifetime. Audit actual team-tint allocation and unused transparent padding before adding many more large sheets. Faction architecture, other building ages, dedicated construction/damage art, full interface/effects work and physical Xbox Series S Edge acceptance remain open.

Town Centre runtime `54e53ec1bb41f2625160463393275d324c00dc6e` is verified live: all 63 production SHA-256 comparisons match (both renderers, worker, catalogues and all 58 active images). Vercel reports success. Hosted runs 40953428382 / 40953428432 / 40953428253 fail before any steps, with cause unverified; this is not a hosted CI pass. Behavioral Chromium evidence remains local, and actual Xbox acceptance is open.
