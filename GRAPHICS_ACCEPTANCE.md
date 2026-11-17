# Battlefield graphics — current acceptance criteria

## 17 November 2026 — Release browser correction

Candidate `82dbdfcf` passed hosted full standalone regressions, three seeded AI
scenarios and all nineteen campaigns, but Chromium rejected shared-source
reflection: 564 comparisons, maximum channel delta 255; the identity-copy
control was exact. Production was not changed. The release correction restores
baked mirrored source frames within the existing 6 Mi-pixel / 160-entry crop
cache, preserving zero-copy forward native frames, crop retirement and original
anchors. Diagnostic transient crops reflect their leased source and restore the
workspace transform even after failure. This trades additional bounded crop
work for the required original sampling; it is not an FPS improvement.

Quick gates pass 5/5 and targeted cache/workspace tests pass 71/71 locally.
Counting fixtures now explicitly pin mirrored crop costs; tint/readback counts
and memory limits remain checked. The browser comparison still requires a
maximum channel delta of one. The corrected candidate requires hosted browser
and release acceptance before publication; physical Xbox remains unverified.

Hosted Chromium on `462c5b24` passed all 564 reflection comparisons exactly
(maximum delta zero), plus native tint and surface-retirement checks. Its next
failure exposed age-art fixtures that retained old tint canvas identities:
the sixteen Town Centre samples occupy 5,062,620 pixels, exceeding the
3,145,728-pixel building pool, so demand creates replacement tint canvases.
The multiplayer map can also draw cached half-size building surfaces.
Town Centre and house fixtures now register demanded replacement sources and
trace each actual LOD draw back through
`buildingFrameTexture` to the original source rectangle, retaining all sixteen
age/team draw assertions, palette/hash checks and simulation invariance. They
restore the instrumented function on exit; no runtime behavior changes here.
Counting-canvas execution of both real fixtures confirmed sixteen solo and
sixteen map draws each under eviction pressure; this does not prove pixels.
Runtime candidate `b33c70c8` passed hosted full standalone regressions, nineteen
campaigns, seeded AI and quick/focused checks. The replacement-aware browser
fixtures require their own Chromium acceptance before publication.

## 17 November 2026 — Preserve pause-button intent and release stale recovery jobs

Implementation: local `6c4f8f5965f16dfc06216bd61680b88f77892642`.

**PARTIAL recovery, normal controller paths.** B and Menu now consult the same
recovery retry operation as A on Resume. Ordinary paused games still resume
normally; a blocked graphics gate starts a bounded manual retry, and a pending
plan is not restarted. Readiness still cannot be bypassed, and successful
preparation never automatically resumes. No button binding was added or changed.
Shell v220; no push, merge or deployment.

`js/input.js` preserves B/Menu's existing resume intent while routing it through
`retryGraphicsRestore`. Returning from Objectives or Technology Tree still
returns to pause first; a separate resume press is required to retry.
`graphicsRestorePending` in `js/engine-picture.js` now cancels preparation and
prediction belonging to the gate being abandoned. This drops its required
manifest and held readback source bytes on title/end/error/setup/campaign/lobby
or online transitions. Cancellation checks world identity: a replacement
world's newly queued preparation and prediction are preserved.

Verification:

- **95/95 targeted checks pass**, covering recovery/presets, pause extraction,
  RAF, sharp HUD, procedural/preparation, gamepad focus and repository evidence.
  Four new cases exercise all three resume buttons, menu-back boundaries,
  eight exit transitions with held source bytes, and replacement-world queues.
  Repeated resume during preparation preserves both job array and progress;
  the next explicit resume after readiness starts play. Normal pause controls
  retain their prior behaviour, with unchanged serialized match state.
- The first focused run passed 37/38. Its only failure was the old source-text
  assertion requiring unconditional B/Menu resume. It now requires the recovery
  check while retaining the same button pattern and return-to-play action.
- Quick source/graph/catalogue/art checks pass **5/5**. No new runtime file,
  dependency, standalone test file or graphics/picture setting was introduced.
- Native Skia: A, B and Menu recovery sequences compare **1,996,800 RGBA bytes**
  with **zero differences** using real four-team Militia art and alternating
  facings. Preparation creates at most four tints per callback. Each exit drops
  435,456 logically held source bytes to zero; a replacement world's new queue
  remains usable and creates four native tints on its first cold batch.
  Serialized world and game saves are unchanged. The normal A preference write
  is intentionally excluded from the game-save comparison and is not altered.
  Logical retention is not a measurement of garbage collection or GPU release.
- Fresh full suite: **1,801/1,801 passed**, all 290 standalone files, including
  **19 scripted campaign wins**, in 295.32s:
  `node --test tests/*.test.mjs`, `/tmp/tint-boundary-full.log`.
  Final repository inventory checks pass **5/5**. Existing browser
  failure-policy fixtures remain syntax-valid but unexecuted because of the
  established browser restriction. These are software/controller contracts,
  not physical Xbox parity or hardware stability measurements.

**Limits unchanged:** global graphics memory/creation limits, whole-scene native
readiness, full-sheet admission, diagnostic workspace exceptions, historical
mirror pixel acceptance and physical Xbox/WAN acceptance remain open. Offline
tint recovery does not change online authority, simulation timing, command/save
formats, artwork or sampling. The diagnostic tint cap remains off by default;
data-gated decode/ImageBitmap/worker phases stay deferred.

## 17 November 2026 — Reconstruct the lost batch and preserve offline matches on tint failure

Recovery implementation: local `1d00f4b5cbc9efc983e746e601265197095069de`.

**Recovery provenance:** the executor returned at clean local checkpoint
`8d1b480`, not the previously reported `3a90eb5`. Neither `0ea9b90` nor `3a90eb5`
exists in the recovered object database, reflog or cumulative patch. The exact
colour-error implementation, six tests and browser failure-policy probe were
reconstructed from this conversation's recorded edits as local `942e9fb`.
These are new commits, not recovered original commit objects. Earlier source
and patches survived; the lost batch's old test reports are historical evidence
only. Fresh results for the reconstructed code plus the new recovery work follow.

**PARTIAL recovery, offline only.** `CK_TEAM_TINT_UNAVAILABLE` still refuses
uncoloured source images in both native and full-sheet paths. In a live offline
match, the frame error boundary now routes that tag to `handleGraphicsTintFailure`
in `js/engine-picture.js`. It preserves the world and healthy cache entries,
clears held gameplay gestures, pauses, and blocks cold world/HUD drawing through
the existing restore gate. It records a separate tint-failure count, without
pretending a browser context loss happened. Shell v219; no push, merge or deploy.

The initial interruption cancels preparation/prediction and waits for an
explicit Resume action. It does not automatically retry. Resume re-plans native
roster preparation using the existing four-creation / soft-three-millisecond
allowance and residency checks. Completed preparation leaves the game paused;
a later explicit Resume starts play. Failed/truncated/nonresident preparation
stays blocked with retry/load/restart/exit paths intact. No lower-quality or
wrong-team artwork is submitted. New-world/title transitions release the gate.

The roster plan cannot cover every building or external full-sheet request.
If an uncovered request fails after a manual retry, it returns to the blocked
pause after one draw attempt rather than looping every frame. Actual browser
restoration retains its existing staged recovery path. Online tint failures,
unrelated errors and errors outside play/pause retain the ordinary error guard;
this change does not alter multiplayer authority or introduce online pausing.

The reconstructed full-sheet cache validates palette/source/dimensions/context,
rejects source aliases and releases failed construction. Background roster and
prediction workers consume only tagged errors and account late creations in
finally. Successful palette arithmetic, drawing, animation, sampling, picture
presets, simulation DT/clamp, saves and command formats are unchanged.

Verification:

- Reconstructed tint batch initially passed **82/82** scoped checks before the
  new recovery routing. Final expanded targeted suite passes **139/139**.
- Six reconstructed cases cover full-sheet failure/poisoning, palette/source/
  health boundaries, mandatory error handling, failed preparation budgets,
  speculative failure and unrelated-error propagation. Five additional cases
  cover actual offline draw failure, manual bounded retry/no automatic resume,
  failed retry with no loop, uncovered-artwork retry and online/world boundaries.
  The mandatory fatal-error case now explicitly tests online play. Assertions
  verify unchanged world/save data, selected Smooth preset and backing size,
  retained healthy art, blocked cold world/HUD, and zero fake context-loss count.
- Quick checks **5/5**; full **1,797/1,797** across all 290 standalone files,
  including **19 scripted campaign wins**, in 289.19s:
  `node --test tests/*.test.mjs`, `/tmp/manual-tint-full.log`.
- Native Skia: **three interruption/retry cycles**, **1,996,800 RGBA bytes**,
  **zero differences**. Real Militia art in four team palettes, alternating
  facings, stays identical after manual recovery. All previously used healthy
  canvases retain identity; the world and saved data stay unchanged; 17 total
  preparation callbacks create at most four tints each. All cycles remain
  paused, with three tint interruptions and zero context-loss events. This is
  software raster/ownership evidence, not measured browser/Xbox performance.
  The probe first accessed lexical teamColor as a property; evaluating it in
  its script scope corrected the probe without production changes.
- Reconstructed browser failure-policy modules pass syntax checks. Browser
  execution remains blocked by the established route restriction; no workaround
  was attempted. Physical Xbox/controller, WAN and large-scene acceptance remain
  unverified. The previous 84-comparison probe was not recreated or rerun here.

**Remaining limits:** only offline live matches use this manual recovery path.
The readiness plan verifies native roster residency, not every graphics class;
large/over-capacity rosters may remain paused. Full-sheet admission, complete
global memory/creation limits, diagnostic workspace exceptions and Phase 1
mirror acceptance remain open. The troop cap experiment remains off by default;
data-gated decode/ImageBitmap/worker phases remain deferred. Test duration and
successful recovery injection do not certify hardware stability or FPS.

## 16 November 2026 — Retire rejected native tints, readbacks and troop crops

Implementation: local `9fb52a2d6afa614b36fc7c7d98800558df356c89`.

**PARTIAL Phase 2, normal rendering path.** Failed native tint display canvases,
shared CPU readback canvases and troop crop canvases now retire through the
existing render lifetime. Failed preparation reverses published ownership and
accounted pixels without discarding healthy entries. Successful cached and
uncached return values retain their previous lifetime. Shell v217; no push,
merge or deployment.

`js/assets.js` owns `clearTeamFrameScratch`, which clears both the shared canvas
and its retained context by identity before scheduling release. Readback
construction/copy/read/clear/health exceptions and missing/lost contexts all pass
through `finally`; a loss observed after `getImageData` is rejected too. The next
request obtains a new canvas/context. A stale clear cannot remove a replacement.
`js/engine-picture.js` recovery now uses this same owner instead of separately
clearing canvas and context references.

Native display tint construction in `paintedTeamFrame` releases rejected
backings and rolls back global/pool ownership and accounted pixels by identity.
`troopFrameTexture` in `js/render-troops.js` does the same for crop construction,
including loss-listener registration failure after cache publication. Palette
math, anchors, mirror transforms, source sampling, existing far-zoom prefilter,
native pool sizes, prediction rules and the diagnostic overflow flag are unchanged.

**Important remaining failure contract:** ordinary native tint failure still
returns the original source atlas, as before. This batch makes allocation cleanup
safe; it does **not** establish exact team colour under allocation failure. The
opt-in overflow path retains its existing tagged error contract and remains off.
Failed crop construction still returns null to its existing direct-art path.
No automatic quality policy, simulation, save, command or control changes.

Verification:

- **135/135 targeted checks pass**, covering native tints/crops, preparation,
  working-set counts, recovery/presets, resources/buildings, RAF and inventory.
  Three new cases contain **32 injected failures**: 12 display failures across
  troop/building pools, eight shared readback failures, and 12 crop failures at
  native/existing half resolution. They cover null/throwing/lost contexts,
  copy/read/write/clear/health exceptions, post-operation loss and listener
  registration failure; healthy residency, nested release, clean retry, stale
  clear/loss ownership and pixel totals are verified. Existing oversized native
  frames and prediction controls remain green.
- Quick source/graph/catalogue/art gates pass **5/5**. No new runtime file,
  dependency or standalone test file; runtime inventory counts are unchanged.
- Native Skia against the previous assets/troop owners: **768 render
  comparisons**, **150,405,120 RGBA bytes**, **zero differences**, 1,532,292
  nontransparent samples. Three real troop kinds cover four states, four team
  palettes, two phases, two zooms, two DPRs and both facings, including the real
  base-atlas fallback where a motion pose is absent. Destinations are read after
  the draw lease closes. All **32 injected failures** also pass with native
  backing stores, unchanged residency/accounting and 1×1 rejected backings only
  after nested release; source pixels remain allocated at their original size.
- This is software raster/fault-injection evidence. Existing Chromium art and
  recovery probes remain available, but the established browser restriction
  still prevents execution. No GPU memory, browser-loss or Xbox FPS claim.
- Fresh full suite: **1,786/1,786 passed**, all 290 standalone files, including
  **19 scripted campaign wins**, in 231.44s:
  `node --test tests/*.test.mjs`, `/tmp/graphics-tint-reject-full.log`.
  Final repository inventory checks pass **5/5**. Test duration is not FPS.

**Still open:** full-sheet external tint paths, unusual exceptions in other
owners and diagnostic workspace construction need further audit. A complete
global memory budget/creation cap, exact-colour native failure policy, Phase 1
mirror acceptance, large-scene recovery and physical Xbox stability remain
unaccepted. Data-gated decode/ImageBitmap/worker phases remain deferred.

## 16 November 2026 — Roll back rejected building and resource cache surfaces

Implementation: local `43c4fb244c2107c6f350712be8489ee6fab9a4b5`.

**PARTIAL Phase 2, normal rendering path.** Building damage crops, existing
building LOD crops and static resource crops now retire rejected canvas backings
from `finally`. Null/throwing/lost contexts, failed source copies, damage-gradient
failure and failed loss-listener registration no longer abandon allocated
backing stores. Partial publication into cache indexes and pixel totals is
rolled back by canvas identity. Unrelated healthy entries remain resident.
Shell v216; no push, merge or deployment.

`damagedBuildingArtwork` and `buildingFrameTexture` in
`js/render-buildings.js`, and `paintedNodeTexture` in `js/render-resources.js`,
distinguish completed construction from accounted cache ownership. Resource
publication now accounts pixels before registering its loss listener; failure
removes both its per-source frame and global recency entries and reverses that
accounting. Completed results retain their existing lifetime, including valid
oversized damage artwork that is deliberately returned without caching.

Existing failure behaviour is preserved: damage preparation returns its incoming
descriptor, while failed building LOD/resource preparation returns null for the
existing original-art draw path. The change adds no fallback or quality policy.
Palette, damage/scaffold geometry, source sampling, dimensions, cache quotas,
controller actions, simulation, saves and network data are unchanged. Rejected
backings use the shared render lifetime, so nested draws remain safe and pending
bytes participate in the existing graphics estimate until final release.

Verification:

- **93/93 targeted checks pass** across damage, resource caching, construction,
  painted resources, procedural/preparation, recovery/presets, RAF and inventory.
  Two new test cases contain **19 failure scenarios**: seven damage, six building
  LOD and six resource cases. They check null/throwing contexts, pre/post-copy
  loss, throwing copy/gradient/registration, unchanged healthy residency and
  pixel counts, empty failed ownership, nested delayed release, successful retry
  and immunity to a late rejected-owner loss callback. Existing oversized damage
  coverage now explicitly verifies its returned backing survives batch release.
- Quick source/graph/catalogue/art gates pass **5/5**. No new runtime file,
  dependency or standalone test file; runtime inventory counts are unchanged.
- Native Skia against the previous building/resource owners: **306 pixel
  comparisons**, **124,305,408 RGBA bytes**, **zero differences**, with 6,443,908
  nontransparent samples. There are 288 building cases across four kinds, four
  team palettes, three damage stages, three scales and two DPRs, including the
  existing LOD and live damage effects; 18 resource cases cover all six original
  static resource crops at three display widths. A second native probe section
  passes all **19 injected failures**, checking unchanged residency/accounting,
  1×1 rejected backings after nested release and intact source images.
  The first probe contained an extra parenthesis; correcting that test-script
  syntax required no production change.
- Native pixels and injected exceptions do not establish real browser loss
  behaviour, GPU memory release or Xbox timings. Existing Chromium art fixtures
  remain available; the established browser restriction prevents execution.
- Fresh full suite: **1,783/1,783 passed**, all 290 standalone files, including
  **19 scripted campaign wins**, in 344.87s:
  `node --test tests/*.test.mjs`, `/tmp/graphics-rejected-full.log`.
  Final repository inventory checks pass **5/5**. Test duration is not FPS.

**Still open:** failed native tint/troop-crop construction and other unusual
ownership exits need further review. Cache quotas are not a complete memory
budget or global per-frame creation cap. Large-scene restore, Phase 1 mirror and
physical Xbox stability/FPS remain unaccepted; the troop cap experiment remains
off by default, and data-gated decode/ImageBitmap/worker phases remain deferred.

## 16 November 2026 — Protect procedural, fog and recovery source lifetimes

Implementation: local `23d88aca83d55d24a80be05eb6c32ca46ab78280`.

**PARTIAL Phase 2, normal rendering path.** Procedural sprite eviction/clear/loss
and fog-mask clear now use the shared outer-render-batch lifetime. Recovery's
remaining immediate backing-shrink helper also delegates to that lifetime.
Selected sources stay allocated until nested draws finish; outside a render
batch the same helper releases immediately. No default quality, artwork,
animation, sampling, cache quota or simulation rule changed. Shell v215;
no push, merge or deployment.

`js/render.js` owns an identity-safe `discardProceduralSprite` path and weakly
retained sprite contexts. A hit checks context health before reuse; an unhealthy
entry is removed and rebuilt, while late old-owner loss cannot remove its
replacement. Clear and quota pressure release cached backings. A failed/null/
lost context or throwing painter releases the rejected sprite in `finally`
and propagates the error instead of retaining a blank sprite. Successfully
returned oversized, uncached artwork retains its existing caller-owned lifetime.

Fog keeps its validated context with the mask, clears that reference alongside
the canvas and retires the old backing safely. Missing/lost retained contexts
discard the mask and use the existing direct fog painter. Geometry, alpha and
visibility thresholds are unchanged. Recovery in `js/engine-picture.js` now
uses the same release helper for remaining derived tint/scratch/atlas-team,
troop/resource and building backings instead of resizing them immediately.
Decoded source atlases are excluded as before. Cache ownership clears at once;
pending backing bytes remain visible in the existing deduplicated estimate.

Verification:

- **112/112 targeted checks pass** across procedural/tint preparation, fog,
  recovery/presets, RAF, sharp HUD, terrain, owner extraction and inventory.
  Six new cases cover procedural pressure/clear/oversized return values; health,
  replacement and late loss; rejected contexts/painter failure; actual nested
  recovery across ten derived backings; nested fog clear/late loss; and lost/
  unavailable retained fog contexts. The recovery case preserves source atlas
  dimensions and serialized world state, and checks pending surface ownership.
- The first focused run passed 63/65: two isolated fog fixtures omitted the
  shared lifetime dependency. They now load the actual production lifetime;
  coverage was preserved. The final expanded result above includes the fix.
- Quick source/graph/catalogue/art gates pass **5/5**. Script graph and existing
  standalone-file counts are unchanged; six cases extend existing test files.
- Native Skia against the previous render/recovery owners: **392 comparisons**,
  **76,769,280 RGBA bytes**, **zero differences**, 746,768 nontransparent output
  samples. There are 384 original procedural sprite comparisons across six
  representative unit kinds, four states, two frame indices, two palettes,
  both facings and two zoom/DPR settings. Each clears the procedural cache under
  two nested leases, draws the returned sprite and reads output after release.
  Eight fog cases cover two DPRs, subpixel offsets and diamond sizes, clearing
  a populated mask after its submitted draw. This is software pixel evidence,
  not browser/GPU release timing or an Xbox FPS result. The native fixture's
  initial attempt treated lexical `USZ` as a global property; evaluating it in
  its actual script scope corrected the probe without production changes.
- Existing Chromium probes now exercise procedural-owner discard and clear a
  submitted fog mask under an active draw lease. Changed browser modules pass
  syntax checks; execution remains blocked by the established browser restriction.
- Fresh full suite: **1,781/1,781 passed**, all 290 standalone files, including
  **19 scripted campaign wins**, in 339.71s:
  `node --test tests/*.test.mjs`, `/tmp/graphics-fallback-full.log`.
  Final repository inventory checks pass **5/5**. Test duration is not FPS.

**Remaining limits:** health checks add work to fallback cache hits; no target
device timing is available. Pending backing allocation can remain substantial
until a large batch ends. Oversized caller-owned returns, failed building/
resource allocation exits and remaining cached classes need further auditing.
Complete budgets/global creation caps, Phase 1 mirror acceptance, large-scene
recovery and physical Xbox stability remain open. The troop overflow experiment
remains off by default; data-gated later phases remain deferred.

## 16 November 2026 — Close terrain backing-store retirement gaps

Implementation: local `eb99109a10b39c2dfb6c3dc16fb8ba3bfa46b2c0`.

**PARTIAL Phase 2, normal rendering path.** Terrain blend pressure/clear/loss,
temporary blend layers, chunk eviction/replacement/loss, failed allocations and
viewport discard now use the existing shared graphics-surface lifetime. A
source stays drawable until the outermost render batch ends, then its backing
is reduced to 1×1. This replaces both reference-only drops and immediate chunk
shrinking. It changes no terrain artwork, geometry, sampling density or budgets.
The diagnostic troop overflow experiment stays off by default. Shell v214;
no push, merge or deployment.

`js/render-terrain.js` owns canonical `clearTerrainChunks`,
`discardTerrainChunk` and `discardTerrainViewport` operations. Loss handlers
check current ownership, so late events cannot remove a replacement. Blend
construction retires its temporary compositing layer in `finally`, including
failed context creation; unadmitted chunk/viewport surfaces are also retired.
`clearTerrainBlend` releases all owned blend backings. Discarded blend pixels
invalidate dependent chunks and flattened-view references as before.

`js/state.js` routes map resize through the terrain owner rather than clearing
its Map directly. `js/engine-picture.js` routes terrain recovery cleanup through
the same owner instead of immediately shrinking these sources. Successful
terrain-image replacement and failed terrain loading clear old derived terrain
surfaces. Source images, simulation state and saves are not modified by cleanup.
The existing lifetime's pending surfaces already participate in the deduplicated
memory estimate; retirement no longer hides these sources during a live batch.

Verification:

- **76/76 targeted checks pass** across terrain blending, chunk/viewport caches,
  palette ownership, painted environment, recovery, picture presets, RAF,
  sharp HUD and repository evidence. Five new cases cover blend LRU/temporary
  layer release; nested chunk replacement and late loss; panning eviction/map
  clear; actual `setSize` and graphics recovery; viewport loss and oversized
  fallback. Existing failed-context cases now assert release of unadmitted
  surfaces. Isolated terrain fixtures load the real shared lifetime; chunk
  extraction starts at its new owner helpers rather than omitting dependencies.
- Quick source/graph/catalogue/art checks: **5/5 passed**. No new runtime file or
  dependency; existing script/Markdown/test-file inventory counts are unchanged.
- Native Skia against the previous revision's terrain owner: **48 comparisons**,
  **30,081,024 RGBA bytes**, **zero differences**. Real painted terrain and
  unchanged procedural details cover two zooms, two DPRs, six camera locations
  including revisits, and moving/stationary viewport paths on a 128×128 map.
  Comparisons include 22,560,758 nonzero RGB components. Destinations are read
  after each draw batch closes. All **9,104 constructed candidate canvases**
  across the four scenario runs are 1×1 after canonical final cleanup; no pending
  retirements remain and the 1,536px source image is untouched. The harness
  deliberately holds canvas references to inspect backing dimensions; these
  counts do not measure garbage collection, process/GPU memory or FPS.
- Added `checkTerrainRetirement` to the existing Chromium battlefield fixture:
  it clears blend/chunk/viewport ownership under a draw lease, draws the old
  descriptors, then checks pixels and 1×1 release after the batch. It writes
  `terrain-retirement.json`. Both changed browser modules pass syntax checks;
  execution remains blocked by the established browser restriction.
- Fresh full suite: **1,775/1,775 passed**, all 290 standalone files, including
  **19 scripted campaign wins**, in 355.24s:
  `node --test tests/*.test.mjs`, `/tmp/graphics-terrain-full.log`.
  Final repository inventory checks pass **5/5**. Test duration is not FPS.

**Remaining limits:** retiring many blend layers at once can leave considerable
pending backing until a large render batch finishes. A global creation cap and
complete memory budget are not implemented by this change. Other graphics
classes' exceptional/recovery paths still need auditing. Browser release timing,
Phase 1 mirror acceptance, large-scene recovery and physical Xbox stability/FPS
remain unaccepted; no timing, quality, controller, save or network rule changed.
Data-gated decode/ImageBitmap/worker phases remain deferred.

## 16 November 2026 — Bound and reuse overflow pixels within a draw batch

Implementation: local `79f360d6f48cbf4b05658d5a89fed07a33e83cdd`.

**PARTIAL / diagnostic only, still off by default.** Repeated requests for the
same overflow colour/crop can now reuse private ImageData within the current
graphics batch. This reduces readback and pure-kernel work in the experiment;
it does not reduce temporary canvas writes, canvas resizing or retained cache
admissions. It does not establish an FPS improvement or complete a global cap.

The same 90-actor, 16-callback controlled workload now produces:

| Path | Retained tint creations | Peak cached creations per callback | Kernel calls | Readback pixels | Temporary canvas writes |
| --- | ---: | ---: | ---: | ---: | ---: |
| Normal path | 32 | 12 | 32 | 128 | 0 |
| Prior overflow, reuse disabled | 32 | 4 | 410 | 1,640 | 378 |
| Overflow with batch pixel reuse | 32 | 4 | 84 | 336 | 378 |

All requested colours and selected frame samples match. The new path records
326 reuse hits. Kernel calls are counted by wrapping the actual pure function,
independently checking trace-derived totals. It still performs more kernel work
than the normal path, and every overflow still executes `putImageData`; it
remains an opt-in test-match experiment. No ordinary-game setting changed.

`js/render-tint-workspace.js` owns an LRU of at most **16 entries / 4 MiB** of
logical held ImageData bytes. Keys reuse the canonical native-tint key, including
source image identity, palette, team, category and crop coordinates/dimensions.
Foot anchors remain descriptor metadata. Only privately read ImageData is held;
the mutable working buffer used by shared-source preparation is never retained.
Byte/entry pressure discards the least recently used pixels; oversized entries
are drawn normally without retention. There is no extra pixel-copy allocation
on admission. Release at the end of the outer graphics batch, explicit native
cache clear and graphics recovery all discard the held pixels; nested lease
ownership and existing deferred clear remain intact.

`graphicsSurfaceEstimate()` includes the held bytes exactly once, separately
from canvas backings and warm-up source bytes. Traces report reuse hits and peak
held bytes; the diagnostics row displays reuse. This is logical reachability
accounting, not a measured process/GPU memory ceiling: freshly read buffers and
discarded buffers awaiting garbage collection can also occupy memory. Shell
v213; no push, merge or deployment.

Verification:

- **130/130 targeted checks pass**, including three new cases for palette/frame/
  image boundaries, batch lifetime, byte/entry LRU pressure, oversized rejection,
  shared-buffer ownership and memory-estimate/recovery accounting. Existing
  exception/nesting, default-off, offline test-match gating, working-set,
  prediction, mirror, picture-preset and pause-menu checks remain green.
- `node scripts/run-checks.mjs --quick`: **5/5 passed**. Runtime counts remain
  62 browser scripts, 125 offline entries and 58 manifest images; no new file or
  dependency was added to the game. Three cases extend the existing test file.
- Native Skia: **384 comparisons**, **225,607,680 RGBA bytes**, **zero differences**,
  3,064,598 nontransparent samples. Three real troop kinds, four states, two
  phases, both mirror directions, two zooms and two DPRs compare ordinary
  painting against both prior overflow and reuse-enabled overflow. Each draw
  repeats four palettes three times within one batch; 1,536 reuse hits occur.
  Peak held pixel bytes are 1,357,520; every batch ends at zero. Destination
  bytes are read after source backing retirement. These are software pixel
  results, not browser/GPU/Xbox timings or historical mirror acceptance.
- The Chromium fixture now repeats each palette within a batch, checks reuse,
  the 4 MiB limit and zero held pixels afterward. Syntax validation passes;
  execution remains blocked by the established browser limitation.
- Fresh full suite: **1,770/1,770 passed**, all 290 standalone files, including
  **19 scripted campaign wins**, in 294.60s:
  `node --test tests/*.test.mjs`, `/tmp/graphics-pixel-reuse-full.log`.
  Five final repository inventory checks also pass. Test duration is not FPS.

**Still open:** the normal path already does less cold work in this control.
High-diversity/large-crop batches may exceed the temporary pixel LRU and regain
the prior recolouring cost. Temporary uploads/resizes remain unbounded, all
other cache classes still need a global creation cap and complete budget, and
large-scene restoration, Phase 1 mirror and physical Xbox acceptance remain
unaccepted. Simulation timing, commands, saves, controls, artwork, sampling and
user picture presets are unchanged. Data-gated later phases remain deferred.

## 16 November 2026 — Off-by-default draw-scoped tint cap experiment

**PARTIAL / diagnostic only.** An exact-colour overflow prototype limits native
unit tint cache admissions to four per trace callback. It does not limit total
tint operations or allocations. In a deterministic 90-actor, 16-callback mock,
peak retained tint creations per callback fall from 12 to 4, but total tint
operations rise from **32 to 410**: the same 32 retained creations plus 378
temporary recolourings. Colours and selected source frames match. This is an
unfavourable cold-workload trade-off, so the experiment is **off by default**.
It is not an accepted performance improvement or the requested global cap.
Implementation: local `0666550c585e933c54bc0aa4344ab39533293926`.

The pause menu exposes `Unit tint cap test` only in the bundled performance
test match. Activation requires that paused test match, offline play and no
active benchmark or surface lease. The setting is session-local, never saved
in world/picture preferences. Ordinary games and online draws retain the
existing path. Shell v212; no push, merge or deployment.

`js/render-tint-workspace.js` owns a depth-indexed temporary tint canvas and
half-resolution prefilter canvas. Actual unit drawing explicitly leases them
inside `try/finally`; nested draws receive different slots. Default asset
queries still return stable images. Temporary images bypass persistent crop
LRUs, preserving existing zoom/DPR/filter sampling without stale image-identity
hits. Transparent crop pixels are cleared on reuse. Outer graphics-batch
completion retires backing storage to 1×1; deferred clear respects live leases.
Canvas/context objects can be reused. The known-surface estimate includes these
surfaces once, and trace counters distinguish retained tints, temporary writes,
new surfaces, dimension changes and temporary peak pixels. Overflow failures
throw a tagged rendering error instead of showing the source team colour;
the ordinary path retains its previous failure contract.

Verification:

- Five quick source/graph/art gates pass. Targeted graphics/menu checks pass
  **127/127**; updated runtime-order/browser-foundation checks pass **18/18**.
- The first full run passed 1,765/1,767. Its only failures were two assertions
  that terrain immediately followed render.js; both now explicitly require the
  new workspace module between them. The fresh complete run of all 290 files
  passes **1,767/1,767**, including **19 scripted campaign wins**, in 293.52s:
  `node --test tests/*.test.mjs`, `/tmp/graphics-overflow-full-final.log`.
  Test duration is not rendering performance evidence. Final repository
  inventory checks also pass **5/5**.
- Native Skia: **385 rendering comparisons**, **377,452,800 RGBA bytes**, zero
  differences, with 2,740,394 nontransparent samples. Real Militia, Knight and
  Villager motion/base fallback crops cover four teams, animation states,
  phases, mirror directions, zoom, DPR, half-resolution filtering and nested
  leases. Forced overflow creates no retained tint entries or persistent crop
  entries. Temporary sources are retired before destination pixels are read.
  This compares two current painter paths, not the historical mirror baseline.
- Added a 32-case Chromium fixture producing `tint-overflow.json`; syntax checks
  pass. It remains **unexecuted** because the established browser route is
  blocked. Native software pixels do not establish Chromium/GPU/Xbox results.
- Five new Node cases cover repeated-work counts, palette/phase parity, nested
  and exceptional leases, deferred clear, actual unit-draw failure cleanup and
  test-match-only activation. Initial fixture corrections were a misspelled
  failure helper and an explicit paused-test setup; the native probe also
  needed the real base-atlas fallback for absent work animations. Production
  tint arithmetic was not altered to accommodate these controls.
- Runtime inventory: 62 production scripts, 49 core, 45 headless, 290 standalone
  test files, 43 Markdown files. The new module is in the canonical script graph
  and offline shell; no new standalone test file was added.

**Remaining limits:** the cap covers retained integer native unit tints only
when an explicitly leased draw opts in. Unscoped queries, full-sheet tinting,
building/resource/terrain/procedural caches, crop admission, source readbacks,
temporary writes/resizes and other allocations are not globally capped.
Per-batch backing retirement may add churn. A complete memory budget, large-scene
restore acceptance, Phase 1 mirror acceptance and physical Xbox stability/FPS
remain open. No automatic quality cuts, simulation timing, commands, save data
or controller mappings were changed. Data-gated decode/ImageBitmap/worker phases
remain deferred pending physical measurements.

## 16 November 2026 — Reclaim unused predictions before demanded tint frames

Native predictions now carry separate provenance until an ordinary or roster
lookup claims their pixels. Under quota pressure, eviction removes unclaimed
predictions before applying the existing LRU to the demanded working set.
Claiming a prediction preserves its canvas/pixels and restores ordinary LRU
ownership. Health/readiness inspection alone does not claim it. Shell v211;
no push, merge or deployment.

`js/assets.js` owns the extra index and pixel-subset accounting, including
identity-safe loss, eviction, promotion and clear paths. `js/render-effects.js`
marks only freshly created, retained prediction results. Building and troop
quotas remain separate and unchanged at 12/52 MiB. The speculative index creates
no native surface and its pixels are already included in the normal pool/memory
estimate, not counted twice. The HUD/trace distinguish held predictions,
claims and quota reclamations; general tint eviction counts still include every
quota eviction. Backing-store retirement still waits for the outer draw batch.

### Priority verification

- `node --test tests/*.test.mjs`: **1,762/1,762 passed**, all **290 standalone
  files**, zero failures/skips, 272.31 seconds, including **19 scripted campaign
  wins**. Tested implementation: `ca56c18fae2b3bb8bc7064ac15ec3e6798d1ef80`.
  Test duration is not rendering performance evidence.
- `node scripts/run-checks.mjs --quick`: **5/5 passed**.
- `node --test tests/lazy-procedural-sprite.test.mjs tests/series-s-xbox-picture-presets.test.mjs tests/team-frame-cache.test.mjs tests/troop-cache-working-set.test.mjs tests/particle-renderer-extraction.test.mjs tests/series-s-painted-troop-frame-cache.test.mjs tests/raf-gap-performance.test.mjs tests/pause-menu-extraction.test.mjs tests/series-s-sharp-hud-canvas.test.mjs tests/series-s-adaptive-picture-preset.test.mjs`:
  **117/117 passed**. Five new cases cover unused-first pressure, single claim/
  normal LRU promotion, mixed sizes and pool isolation, late loss/clear/oversized
  rejection, and actual prediction-worker tagging/consumption. Existing memory
  checks verify speculative bytes are a subset, not extra retained RGBA bytes.
  All eight pinned troop working-set counts remain unchanged.
- Initial expanded mock cases exposed the cache fixture's two-team palette;
  extending it to the game's four colours fixes those cases. Production tint
  arithmetic was unchanged. The final targeted result above includes the fix.
- Native Skia (`NODE_PATH="$CODEX_PRIMARY_RUNTIME_NODE_MODULES" node
  /tmp/graphics-priority-native.cjs`): 12 controlled pressure rounds, one real
  Militia motion crop × four palettes, an artificial three-frame troop quota.
  The previous-policy control uses the same pixel pipeline with speculative
  priority disabled, reproducing the former plain-LRU selection.

| Native pressure control | Used-frame recreations | Tint creations | Quota evictions |
| --- | ---: | ---: | ---: |
| No prediction | 0 | 36 | 0 |
| Prediction with prior plain LRU | 12 | 60 | 24 |
| Prediction with unused-first priority | 0 | 48 | 12 |

The new policy reclaims 12 unused hints. All **13,014,000 compared RGBA bytes**
match the prior policy, including 1,552,260 nontransparent samples; the
no-prediction control matches the same visible pixels too. These are native
software counts and pixel comparisons, not Chromium/Xbox timings or GPU memory.

Unused prediction still costs work: this deliberately adversarial stream needs
48 tint creations with priority versus 36 without prediction. Reclaimed hints
may also be needed later. This is a conservative working-set policy, not a
universal miss-rate/FPS improvement or a global creation cap. Mandatory native
misses, other cache classes, global budgeting, large-scene restore acceptance
and mirror/browser/physical Xbox gates remain open. No artwork, palette,
animation timing, simulation, controller or saved-state format was reduced.

The existing Chromium prediction fixture adds claim checks and a quota-pressure
pixel comparison. Its syntax and `git diff --check` pass; browser execution was
not attempted through the previously blocked route.
Repository inventory checks also pass **5/5** after current documentation updates;
runtime/test/Markdown file counts remain unchanged.

## 16 November 2026 — Prepare next animation frames from actual troop draws

Added bounded next-frame hints to the existing native preparation owner.
`drawUnit` opts into observation through `assetFrame`; previews and ordinary
atlas queries retain their existing default behavior. The hint uses the next
frame in the already-selected animation/direction list, including wraparound.
Preparation never calls `unitVisualPose` a second time, changes simulation time,
skips animation frames or substitutes another palette. Shell v210.

### Scheduling and limits

- `js/render-effects.js`: deduplicate at most **128 hints**, bound processing to
  **64 attempts**, reject hints last observed more than two trace sequences ago
  and validate world, source, animation, geometry and palette identity. Predictions
  are solo-play only; pause, online play and restore preparation exclude them.
  New games, world replacement, leaving play and world-cache restoration discard
  old hints. Hint records store source metadata, not unit entities or path/pose
  snapshots; the queue retains its source-world identity until cleared/drained.
- Roster preparation has priority. When it drains, prediction shares the same
  **four-new-native-tint allowance per normal `warm()` callback** and remaining
  **soft three-millisecond window**. Procedural work retains its existing time
  sharing. This is not an all-render or all-surface creation cap.
- Prediction admits only frames that fit currently unused troop/aggregate quota;
  it does not evict resident frames to admit a hint or increase the 52/12 MiB
  native tint quotas. Hints may become unused after a turn, stop or state change;
  occupied spare capacity can still affect later on-demand LRU pressure. No
  general reduction in total allocations or Xbox frame time is claimed.
- Both preparation paths share the immutable-source reset helper. Prediction's
  source buffers are local to its callback, not retained in the roster owner.
  The HUD/trace distinguish prediction creations, attempts, skipped work, pending
  hints and prediction cap hits. Mandatory on-demand tinting stays exact and is
  still uncapped. Restore gating and user-selected picture presets are retained.

### Verification for prediction

- `node --test tests/*.test.mjs` on local implementation
  `3f9fdee167476c11b89a1a27de40f7bc8189e099`: **1,757/1,757 passed** across
  all **290 standalone files**, zero failures/skips, 289.37 seconds, including
  **19 scripted campaign wins**. Test duration is not a rendering benchmark.
- `node scripts/run-checks.mjs --quick`: **5/5 passed**.
- `node --test tests/lazy-procedural-sprite.test.mjs tests/series-s-xbox-picture-presets.test.mjs tests/team-frame-cache.test.mjs tests/troop-cache-working-set.test.mjs tests/particle-renderer-extraction.test.mjs tests/series-s-painted-troop-frame-cache.test.mjs tests/raf-gap-performance.test.mjs tests/pause-menu-extraction.test.mjs tests/series-s-sharp-hud-canvas.test.mjs tests/series-s-adaptive-picture-preset.test.mjs`:
  **112/112 passed**. Seven new cases cover default-query exclusion, actual troop
  observation, unchanged pose history/world, shared allowance/time window, full
  pool behavior, bounded metadata/cache-hit work, stale hints, modes/world changes,
  selected direction and wraparound. The restore test also verifies hint cleanup.
- Deterministic counting mock, one newly observed kind × four teams, 24 callbacks:
  draw-time tint creations **32 → 4**, preparation creations **0 → 28**, total
  **32 → 32**, zero evictions, matching palette/pose samples. Instrumented source
  readback falls **128 → 44 pixels**. This is mock operation-count evidence.
- Native Skia (`NODE_PATH="$CODEX_PRIMARY_RUNTIME_NODE_MODULES" node
  /tmp/graphics-predict-native.cjs`), three real motion kinds × four teams,
  16 callbacks: draw-time tint creations **96 → 68**, preparation **0 → 28**,
  total **96 → 96**, zero evictions. Source readback pixels **4,868,496 →
  3,937,296**. All **38,947,968 compared RGBA bytes match**, including 5,012,456
  nontransparent samples and unchanged source geometry/anchors. Preparation peaks
  at four new tints; the **whole-callback native tint peak remains 12 → 12**.
  The global-cap acceptance gate is therefore still OPEN. Counts are not FPS.
- An initial metadata-work fixture used fractional phases over 200 frames and
  legitimately left one frame uncached through rounding. The cache-hit-only
  fixture now uses 256 exactly representable phase positions; production frame
  selection and prediction logic were not altered to accommodate the test.
- The existing Chromium runner now includes an exact native-pixel prediction
  comparison and `tint-prediction.json`. Browser fixture syntax and
  `git diff --check` pass; browser execution was not attempted through the
  previously blocked route. Phase 1 mirror and physical Xbox acceptance remain
  unverified. No push, merge or deployment.
- `node --test tests/repository-evidence-inventory.test.mjs`: **5/5 passed**
  after current inventory/journal maintenance. File counts remain unchanged.

## 16 November 2026 — Gate solo restoration on native roster residency

Solo world restoration now keeps both simulation and cold world/HUD drawing
blocked until the **loaded native troop plan** is complete and resident.
Preparation still creates at most four native tints per callback, using the
existing soft three-millisecond checks between jobs. Successful preparation
leaves the game paused; it never resumes automatically. User picture presets,
source dimensions, tint mathematics, fixed-step timing and controller mappings
are unchanged. Shell v209; no push, merge or deployment.

### Ownership and failure behavior

- `js/render-effects.js`: retain a bounded manifest of at most 512 selected jobs
  and its source-world identity. `rosterTintWarmupReadiness` requires a drained,
  untruncated plan, no failed/stale attempts, current image/animation/geometry/
  palette identity and a healthy correctly sized cached canvas for every job.
  Readiness creates no pixels and does not touch LRU ordering. A later eviction,
  changed palette, cancelled/replaced plan or invalidated source fails the check.
  Cancellation/replanning releases the old manifest and world reference.
- `js/assets.js`: the renderer and verifier share `healthyTeamFrame`; existing
  context-loss behavior and pinned creation/readback counts are preserved.
- `js/engine-picture.js` and `engine.js`: the solo gate owns the interrupted
  world. Checks before controls and after attempted resume prevent A, B, Menu
  or another mode change from stepping that world while preparation is pending
  or blocked. Simultaneous world/HUD loss still waits for the final restore.
  HUD-only loss preserves healthy caches; running multiplayer never uses this
  solo gate. Leaving/replacing the world releases its gate.
- `js/render.js` and `js/ui.js`: while gated, skip world drawing, normal HUD
  sprite requests and procedural preparation. Clear any stale sharp-HUD picture
  and show the existing pause menu with progress/failure text. Safe menus keep
  bounded native preparation alive. Resume retries a blocked plan; load,
  restart and exit remain available. There are no automatic retry loops.
- The trace records gate state/reason and required/resident counts. The final
  residency check scans at most the 512-job manifest; this bounded check is
  separate from the soft preparation time window, not a preemptible time cap.

**Important limitation:** an over-capacity/truncated roster remains paused;
retry cannot make it fit without changed circumstances. Load, restart or exit
are the available alternatives. This candidate therefore does not establish
successful recovery of the large Series S battle. It does not reduce artwork,
raise memory quotas or silently bypass readiness. Its manifest covers loaded,
live, ungarrisoned troop states 0–3; it does not establish readiness of buildings,
terrain, resource crops, corpse art, procedural fallback or future atlas loads.
Those can still create surfaces after the gate releases. Global creation caps,
whole-graphics budgeting, prediction and complete staged restoration remain
open. Phase 1 remains unaccepted; Chromium and physical Xbox remain unverified.

### Verification for the native gate

- `node --test tests/*.test.mjs` on local implementation
  `52969f6c39e7b452d5ceef24e03311723107351d`: **1,750/1,750 passed** across
  all **290 standalone files**, zero failures/skips, 269.08 seconds. All
  **19 scripted campaign missions win**. This is not hardware acceptance.
- `node scripts/run-checks.mjs --quick`: **5/5 passed**.
- `node --test tests/lazy-procedural-sprite.test.mjs tests/series-s-xbox-picture-presets.test.mjs tests/series-s-adaptive-picture-preset.test.mjs tests/team-frame-cache.test.mjs tests/troop-cache-working-set.test.mjs tests/series-s-canvas-pixel-test.test.mjs tests/pause-menu-extraction.test.mjs tests/front-end-screen-routing-ui-extraction.test.mjs tests/series-s-sharp-hud-canvas.test.mjs tests/series-s-auto-layer-benchmark.test.mjs`:
  **92/92 passed**. Six new behavioral cases cover health/residency, no pixel
  allocation/LRU movement, wrong-world/stale-source rejection, truncated/failed
  plans, pre/post-control guarding, skipped cold draws, retry and safe exit.
  An initial targeted fixture attempted to replace a const audio callback;
  it now disables sound normally. No production audio change was made.
- A native Skia probe (`NODE_PATH="$CODEX_PRIMARY_RUNTIME_NODE_MODULES" node
  /tmp/graphics-gate-native.cjs`) prepares three real motion kinds × four teams:
  **192 jobs, 192 resident**, no skips, 48 callbacks, maximum four creations,
  48 source reads / 144 reuses. Readiness allocates zero canvases; verification
  requests create zero additional tints. **41,441,904 RGBA bytes match exactly**.
  Shrinking one native cache canvas produces `missing`, with 191 resident.
  These are software counts/correctness checks, not browser or Xbox FPS.
- Existing pause-menu source assertions now require guarded Resume; controller
  mappings remain unchanged. Browser fixtures record native readiness and both
  successful and capacity-blocked large-scene restoration, retaining pre-loss
  artwork/terrain comparisons. Save comparison permits only the already-required
  diagnostic loss records. Browser fixture syntax and `git diff --check` pass;
  browser execution was not attempted through the previously blocked route.
- `node --test tests/repository-evidence-inventory.test.mjs`: **5/5 passed**
  after inventory/journal maintenance. Browser, core, headless and Markdown
  file counts remain unchanged.

## 15 November 2026 — Preserve chosen picture quality after context loss

Removed both automatic recovery quality cuts: the loss-count clamp in
`installCanvasRecovery` and the sustained-slow-frame `sampleGraphicsRecovery`
sampler/call site. `rs`, sharp-HUD selection and the canvas diagnostic row now
use the selected picture settings directly. The Original 100%, Balanced 75%,
Smooth 50% and expressly selected Adaptive preset algorithms are unchanged.
`GRAPHICS_RECOVERY.scale` remains 1 solely for existing diagnostic consumers;
it no longer controls backing pixels or HUD availability. Shell v208.

Loss counters, the four-slot diagnostic export, overlay, solo pause, accumulator
reset and natural Canvas2D restoration are retained. After the last outstanding
surface restores, a world loss clears derived surfaces and **restarts the solo
native roster plan**. Healthy HUD-only recovery retains world caches and the
existing preparation plan. Running multiplayer retains its simulation authority
and does not schedule solo preparation. Duplicate events do not reset the plan.

This is **partial Phase 6**, not a completed staged-restoration gate. Restarted
preparation still has the four-creation callback cap, but the subsequent world
draw can create additional missing surfaces. The pause remains manually resumable
before preparation drains. A drained/capacity-truncated plan is not a readiness
proof. Global creation caps, accounted global budgeting, verified roster residency
and the paused-until-ready restore gate remain open. Phase 1 remains unaccepted;
Phases 4/5 remain measurement-gated. No push, merge or deployment.

**Accepted trade-off:** with automatic scale cuts removed, stability depends on
the cache/recovery changes in Phases 1–5. The selected sharp HUD also remains
allocated after repeated losses. If loss continues, use Phase 0 records to
investigate its cause. No Xbox stability or FPS improvement is claimed here.

### Recovery verification

- Fresh `node --test tests/*.test.mjs` on local tested implementation/test
  revision `d9dff75ed9626579da9679b47789b445655170e0`: **1,744/1,744 passed**,
  all **290 standalone files**, zero failures/skips, 445.77 seconds, including
  **19 scripted campaign wins**. The earlier full run's obsolete assertion and
  its correction are recorded below. Test duration is not FPS evidence.
- `node scripts/run-checks.mjs --quick`: **5/5 passed**.
- `node --test tests/series-s-canvas-pixel-test.test.mjs tests/series-s-xbox-picture-presets.test.mjs tests/series-s-adaptive-picture-preset.test.mjs tests/troop-cache-working-set.test.mjs tests/lazy-procedural-sprite.test.mjs`:
  **52/52 passed**. Existing working-set creation/readback assertions pass.
- The preset test replaces old expectations of loss-driven/frame-time quality
  cuts with unchanged scale, DPR, selected preset, projection, world and saved
  data. All four selected presets survive three losses apiece; a real second
  mock canvas checks retained full-size sharp-HUD backing and visibility.
  Five repeated default-preset losses check counters and all four loss slots.
- New overlapping world/HUD events verify that cache clear/replanning waits
  for the final restore. The mock then prepares **16 native jobs in four
  callbacks of four**, without advancing world state or rewriting saves.
  These are mock operation counts, not browser/Xbox timing measurements.
- The adaptive test's call-site assertion changes because only its optional
  sampler remains in the frame loop. Its existing upscale/downscale behavior
  tests still pass. No user preset logic was rewritten.
- The first `node --test tests/*.test.mjs` run passed **1,743/1,744**, finding
  one additional old expectation in the canvas-pixel
  test: its source assertions still required the recovery clamp in the resize
  function and HUD label. Local `d9dff75` aligns those assertions with the
  selected scale; all four tests in that file pass in the extended targeted run.
- The first expanded targeted run caught a fixture problem: newly created
  mock canvases copied the world's event registration function. The test helper
  now gives derived canvases their own listener stub; the corrected run is the
  52/52 result above. No production workaround was added for this mock issue.
- `git diff --check` passed. Chromium and physical Xbox remain unverified; the
  blocked browser route was not retried.
- `node --test tests/repository-evidence-inventory.test.mjs`: **5/5 passed**
  after the current inventory/journal update. Runtime and Markdown file counts
  remain unchanged.

## 15 November 2026 — Share preparation readback across team palettes

Preparation now groups admitted jobs by source image and rectangle, reads that
rectangle once and reuses its original pixels for each selected team palette.
Admission still selects idle coverage before motion. Execution groups the
selected source rectangles together; it does not promise every idle frame will
finish before any motion frame. On-demand rendering keeps its existing path.

One source can remain between preparation callbacks. It holds an immutable RGBA
copy and a working ImageData buffer, reset before every team tint. The source is
validated against image identity, rectangle and buffer length before use.
Healthy tint cache hits perform no source read. Draining, cancellation, replanning
and graphics-cache reset release the source reference. The trace records source
reads/reuses and both buffers' retained byte lengths in the known-memory estimate.
These are CPU pixel buffers, not proof of GPU residency. Native tint quotas remain
52 MiB troops / 12 MiB buildings. Shell v207; no runtime dependency added.

### Verification for shared readback

- Five quick checks and **45/45 targeted graphics regressions pass**. Browser
  fixture syntax and `git diff --check` also pass.
- The first full run passed 1,741/1,742 assertions, including the scripted
  campaign victory matrix. Its only failure used an earlier version of the new
  memory test fixture. Supplying the complete warm-up fixture before querying
  the estimator fixes that case; the focused recheck passes.
- The fresh full rerun of `node --test tests/*.test.mjs` passes **1,742/1,742**
  assertions across all **290 standalone files**, zero failures/skips, 430.54
  seconds. All **19 scripted campaign missions win**. This tests local
  implementation commit `afd9c6e859fa037a97dfaaa516c8b0e7ed671878`; repository
  inventory checks also pass **5/5** after the documentation update.
- A real-artwork native Skia check (`node /tmp/graphics-shared-native.cjs`, with
  the installed runtime module path) covers three motion kinds × four teams:
  **192 jobs, 192 creations, 48 source reads and 144 source reuses**, no skips.
  Readback falls from 10,360,476 to **2,590,119 pixels (75% fewer)**. All
  **41,441,904 compared RGBA bytes match** independent per-team source reads;
  5,024,988 samples have nonzero alpha. Verification requests create zero new
  tints. The deterministic test clock produces 48 callbacks of four creations;
  this measures counts and correctness, not callback duration or FPS.
- New regression cases check reuse across one-creation callback boundaries,
  isolation of all four palettes, cache-hit bypass, invalid borrowed sources,
  cleanup and accounting of both buffers. The existing browser fixture records
  source reads/reuses and asserts zero retained source bytes when drained.
- Chromium and physical Xbox execution remain unavailable in this workspace;
  the previously blocked browser route was not retried. Browser pixel thresholds
  are unchanged and Phase 1 remains unaccepted.

**Still unfinished:** the four-creation cap is preparation-only. Normal rendering
can create more than four frames. Whole-render creation caps, a global graphics
budget, visible-pose prediction, projected multiplayer preparation, paused restore
readiness and removal of automatic recovery quality changes remain open.
No push, merge or deployment.

## 15 November 2026 — Bounded roster tint preparation

Added a capacity-aware preparation queue for loaded native troop frames.
**The four-creation limit applies to preparation callbacks, not all on-demand
rendering.** The hard whole-frame creation cap, restore-time paused-until-ready
gate and global graphics budget are still unfinished. Phase 1 mirror pixel
acceptance and physical Xbox performance remain OPEN. No push, merge or deploy.

### Behavior and ownership

- `js/render-effects.js`: `queueRosterTintWarmup` builds a finite plan from live,
  ungarrisoned roster `(kind,team)` pairs, including ship-art aliases. Duplicate
  pairs/atlas rectangles are deduplicated. Idle coverage comes first, followed
  by walking, attacking and working frames. Neutral/fractional/ineligible
  frames retain their existing normal-render path. Planning does no pixel reads
  or tint creation, and holds no simulation entity references.
- The plan admits at most **512 jobs**, inspects at most **8,192 frame records**
  and selects no more native pixels than the troop pool's admission quota.
  Over-capacity work is counted as skipped; it is not silently described as warm.
  `drained` means the queued attempts are finished, not that every possible pose
  is resident or that later drawing cannot evict prepared frames.
- `advanceRosterTintWarmup` creates at most **four native tint frames per call**
  and checks a **soft three-millisecond window between jobs**. A single tint
  cannot be preempted. Cache-hit/stale work is limited to 64 attempts per call,
  even with a non-advancing test clock. Invalid/zero budgets perform no work.
  Atlas/palette changes invalidate stale jobs; failures are counted rather than
  causing an infinite retry loop.
- The existing `queueWarm` hook schedules preparation at match start and saved
  game load. Atlas-index rebuilds replace the plan as relevant art becomes
  ready. In solo play/pause, `warm` shares the existing soft time window between
  native and procedural preparation. Other modes cancel unused native work.
  Dedicated projected-multiplayer preparation and incremental new-roster/visible
  next-pose prediction are not added by this batch.
- `js/assets.js`: `teamFrameCacheKey` is shared by preparation and the renderer.
  No duplicate key definition, changed tint math, reduced source resolution,
  wrong-palette placeholder or altered simulation step was introduced.
- The HUD/trace distinguish preparation creations, attempts, status, remaining
  jobs, skipped work and cap hits. On-demand cache misses still use the exact
  existing tint path and can exceed four creations in a rendered frame.
  This is not a claimed fix for restoration bursts. Shell v206; unchanged
  runtime script/image graph and no runtime dependency added.

### Verification

- `node scripts/run-checks.mjs`: **5/5 passed**.
- `node --test tests/lazy-procedural-sprite.test.mjs tests/particle-renderer-extraction.test.mjs tests/team-frame-cache.test.mjs tests/troop-cache-working-set.test.mjs`:
  **42/42 passed**. Six new behavioral cases cover active-team filtering,
  deduplication, four-creation clamping, warm cache hits, world immutability,
  quota overflow with correct full-resolution colour, clock/job-work limits,
  atlas/palette invalidation, allocation failures, metadata bounds, readiness
  re-planning, menu cancellation and the shared native/procedural time window.
- `node --test tests/*.test.mjs`: **1,739/1,739 passed** across all 290
  standalone files, 268.18 seconds, including **19 scripted campaign wins**.
  Test wall time is not a rendering benchmark.
- `node /tmp/graphics-warm-native.mjs`: installed native Skia, real motion atlases
  for three kinds × four teams. The plan contains **192 unique frames**, no
  skipped work, 192 prepared creations and no additional tint creation when
  those frames are subsequently requested. **41,441,904 native RGBA bytes match
  direct tinting exactly**. Two runs observed largest batches of two and three
  frames, both below the four-frame cap. The latest comparison contains
  5,024,988 nontransparent samples; callback count is not FPS evidence.
- Production/browser fixture syntax checks and `git diff --check` passed.

`tests/browser/frame-tints.mjs` adds a separate native-roster preparation check,
invoked by the existing Chromium runner with a `tint-warmup.json` report. The
older procedural-only readiness fixture now explicitly cancels native work so
its zero-tint assertion continues testing that separate responsibility. Existing
pixel tolerances are unchanged. Chromium execution remains unverified under the
previously documented access restrictions; no blocked route was retried.

Remaining work includes shared readback across active teams, prediction of the
next visible poses, a genuine all-render-creation cap, restoration staging and
its resume gate, and eventual browser/Series S measurements. Within-pool churn
still exists when a full working set cannot fit. No FPS gain, complete warm-up
coverage, black-screen repair or full Phase 2/3/6 acceptance is claimed.

## 15 November 2026 — Phase 2 tint-pool isolation and resource loss checks

Implemented separate native-frame tint pools on local `graphics-stability`:
**52 MiB for troops, 12 MiB for buildings**, retaining the original **64 MiB
combined live-tint cap**. Each pool has its own LRU; building pressure cannot
evict troop entries and troop pressure cannot evict building entries. This is
not a hard whole-game/native-memory cap and does not complete Phase 2's creation
cap or the later warm-up work. Nothing pushed, merged or deployed.

### Implementation

- `js/assets.js`: `TEAM_FRAME_GROUPS` owns the two recency queues, quotas,
  accounting and cumulative class counters. The existing `TEAM_FRAME_CACHE`
  remains the aggregate index/counter owner, sharing atlas IDs and readback
  scratch. Keys distinguish building and troop ownership even when an external
  pack aliases the same atlas rectangle across both classes. Cache hits touch
  only the owning pool's LRU. `removeTeamFrameEntry` atomically removes from
  both indexes, updates both pixel counters and retires the old backing store.
- `clearTeamFrameCache` is the common clear path for recovery and browser
  fixtures. It clears both pool indexes/counters together while preserving
  cumulative diagnostic counters, then retires the old derived canvases.
  Lost/late events cannot subtract a replacement's pixels. Frames exceeding
  their pool's admission capacity still return full-resolution, correctly
  tinted pixels without entering the cache; this does not impose a creation cap.
- `js/render-resources.js`: cached crops retain their original 2D context in a
  WeakMap. Hits check that context without reacquiring it. Loss detected before
  event delivery invalidates/retires the old crop and rebuilds on demand. A
  context already lost before drawing, or lost during copying, is never admitted
  as a blank cache entry; its unused backing is retired and the existing source
  fallback remains available. Late events cannot remove a replacement.
- The performance HUD and trace snapshots expose both pool usage/limits.
  Shell v205; no new runtime dependency, source image or script path.

### Quota evidence and limits

Tested candidate allocations with the real production counting fixture. The
initial **48/16 MiB** split caused 7,590 tint creations over 120 measured frames
in the dense 14-kind scene, versus 6,750 before isolation, so it was rejected.
**52/12, 56/8 and 60/4 MiB** splits retained 6,750 creations in that scene.
Selected 52/12 as the largest tested building reservation that avoided that
particular troop-only regression. These are provisional software quotas, not
device-tuned limits or measured FPS results.

All eight existing 3/6/9/14-kind, four-team, two-zoom/DPR fixtures keep their
prior creation, crop, readback and eviction counts at the selected allocation.
In particular, the 14-kind fixture still performs **6,750 tints and 360,533,280
readback pixels per 120 measured frames**. Isolation prevents cross-class
eviction; it does not solve the existing within-pool churn.

An independent real-atlas native Canvas comparison uses **12 frames, 60 troops,
32 building poses and four teams**. The deliberately small total tint cap is
8 MiB, partitioned 6/2 MiB in the new code; the former code uses its shared
8 MiB cap. Building churn forces **88 warmed troop tint recreations before
isolation versus 0 afterward**. Submitted troop/building images have **zero
differing channel samples**, with 1,379,352 nontransparent samples. This is a
synthetic native Skia correctness/count fixture, not Chromium, Xbox or a timing
measurement. Production quota ratios remain 52/12, not that forced test ratio.

### Tests

- `node scripts/run-checks.mjs`: **5/5 passed**.
- `node --test tests/team-frame-cache.test.mjs tests/troop-cache-working-set.test.mjs tests/series-s-resource-sprite-cache.test.mjs tests/series-s-xbox-picture-presets.test.mjs`:
  **47/47 passed**. Added two pool tests covering pressure in both directions,
  shared-rectangle ownership, total/pool accounting, loss/replacement, oversized
  admission and scoped clearing. Added a resource test covering pre-event loss,
  50 hits with one context acquisition, late events and creation-time loss.
- `node --test tests/*.test.mjs`: **1,733/1,733 passed** across all 290
  standalone files, 192.86 seconds, including **19 scripted campaign wins**.
- The working-set fixtures additionally assert that the aggregate pixel count
  equals the sum of pool counts, each within its own limit. All previously
  pinned tint/readback/crop counts remain unchanged at the chosen allocation.
- `node /tmp/graphics-quota-probe.mjs`: counting-only allocation sweep described
  above; it varies only the pool limits in isolated VM contexts.
- `node /tmp/graphics-pools-native.mjs`: independent mixed-scene comparison
  against `cd55437`; zero pixel differences and warmed troop creations 88 → 0,
  as described above. The same painter and tint arithmetic are used on both sides.
- `node --check tests/browser/frame-tints.mjs` and `git diff --check`: passed.

The browser tint/army fixtures now use the common clear function instead of
clearing only the aggregate Map; no pixel thresholds or warm-cache assertions
were relaxed. Browser/Xbox acceptance remains OPEN. Deferred retired surfaces,
crop/damage/LOD caches, scratch, fractional external-pack full-sheet tints and
decoded source atlases are not governed by this live-tint quota alone. A total
accounted budget, creation cap, staged warm-up and Phase 1 browser pixel proof
are still unfinished. No performance or black-screen fix is claimed.

## 15 November 2026 — Phase 2 surface lifetime portion verified in software

Continued with eviction/loss handling independently of the unaccepted mirror
candidate. **Phase 2 is PARTIAL**: separate soldier/building tint budgets, a total
accounted budget and a hard creation cap are not implemented. Phase 1 browser
pixel acceptance and physical Xbox stability remain OPEN. No push, merge or
deployment; no FPS or actual GPU-memory improvement is claimed.

### Lifetime and cache changes

- `js/render.js` owns `GRAPHICS_SURFACE_LIFETIME` and the begin/retire/end/flush
  helpers. Evicted canvases are retained until the outermost render batch ends,
  then resized to **1×1**, releasing their old backing dimensions promptly.
  Pending duplicate retirements are deduplicated; pending pixels, completed releases and
  release failures are counted. Source images are excluded. Outside an active
  batch, retirement releases immediately; render descriptors are not persistent
  assets and must not be reused after their batch has ended.
- Solo `drawWorld` and the projected map's `draw` wrap all render paths in
  `try/finally`. Early isolation returns and exceptions unwind the lifetime
  depth, so nested renders preserve outer descriptors and no retirement queue
  is carried into the next normal draw batch. Simulation and command processing
  are unchanged.
- Tint, troop-crop, resource-node, building-damage and building-LOD **LRU
  evictions** now retire their old canvases after subtracting the original pixel
  count. Full-sheet tint loss and lost readback scratch canvases also retire.
  Crop, node, damage and LOD canvases have identity-checked `contextlost`
  listeners: they invalidate only their own still-current cache entry, retain
  correct accounting and cannot delete a replacement on a late repeated event.
  Existing tint loss handlers use the same retirement path.
- `graphicsSurfaceEstimate` includes pending retired canvases, their byte count
  and release-failure count. Per-frame diagnostics add `surfaceReleases` and
  `releasePixels`; the HUD's `FREE` value shows current-frame releases.
  These remain known-surface estimates, not browser/driver memory measurements.
  Shell v204, unchanged script/asset graph and no runtime dependency added.

### Verification

- `node scripts/run-checks.mjs`: **5/5 passed**.
- `node --test tests/team-frame-cache.test.mjs tests/troop-cache-working-set.test.mjs tests/building-damage-art.test.mjs tests/series-s-painted-troop-frame-cache.test.mjs tests/series-s-resource-sprite-cache.test.mjs tests/xbox-render-layer-diagnosis.test.mjs tests/network-battlefield.test.mjs`:
  **90/90 passed**. Existing descriptor-lifetime tests now explicitly retain an
  active batch and assert 1×1 release after its end. Added tests cover nested
  batches, duplicate retirement, pending-byte accounting, failure recovery,
  derived-canvas loss/replacement/late events, and solo/projected exceptions.
  Original cache-budget, anchor, colour and world-state assertions remain.
- The deterministic 240-frame working-set fixtures retain their exact tint,
  crop, readback and eviction counts. Every batch now asserts an empty retired
  queue, zero pending pixels and release counts/pixels matching queued surfaces.
- `node --test tests/*.test.mjs`: **1,730/1,730 passed** across 290 standalone
  files, 187.80 seconds, including **19 scripted campaign wins**.
- `node /tmp/graphics-lifetime-native.mjs`: executes the new shared browser
  pixel fixture with the production lifetime owner on installed native Skia.
  A 32×24 source remains usable before/after retirement within a batch and is
  1×1 afterward. Previously submitted destination pixels retain **zero
  differences**, 1,536 nontransparent samples, zero pending surfaces, depth zero.
- `node /tmp/graphics-lifetime-churn.mjs`: independent old/new lifetime comparison
  against `068eca9`, using real motion atlases, the same candidate painter and
  tint kernel on both sides. **48 frames × 60 troops, four teams, 14 kinds**,
  idle/walk/attack, mirrored/forward and two zoom/DPR pairs. A deliberately small
  524,288-pixel tint budget forces repeated eviction: **4,140 releases, zero
  release failures, zero pixel differences**, 2,793,697 nontransparent samples.
  Every frame ends with no pending retired pixels. This is a native Canvas
  correctness stress fixture, **not Chromium, Xbox FPS or process-memory proof**.
- `node --check tests/browser/battlefield-art.mjs` and `git diff --check`: passed.

`tests/browser/frame-tints.mjs` exports the pixel-release fixture. The existing
Chromium artwork runner invokes it and writes `surface-lifetime.json` before the
still-strict mirror/tint comparison, so a later mirror failure will not discard
release evidence. It has not executed in Chromium here; earlier browser access
restrictions remain, and no blocked browser route was retried.

### Remaining risks and gates

The pending queue is bounded by a render batch's work, **not yet by a hard
per-frame creation cap**. A single very large batch can still create a burst.
Uncached oversized external-pack canvases and failed releases may still await
GC; release failures are observable. Source-image decode residency, driver
copies and actual native-memory growth are unknown. Event-driven resource loss
handling does not establish that every pre-event context-loss window is covered.
Use the unchanged Phase 0 hardware checklist for eventual Series S acceptance.
Neither this isolated release proof nor the tint proof accepts the mirrored
candidate, recovery changes, total budgets or the later measurement-gated phases.

## 15 November 2026 — Independent tint kernel verified; mirror gate still OPEN

Continued without Xbox access. Completed the independent pure-math portion of
Phase 3 while keeping the unaccepted Phase 1 raster change isolated from later
cache-policy repairs. This is **not** completion of Phase 3's prefetch, shared
readback or roster-warming work. No merge, push or deployment occurred.

### Tint change

`js/assets.js`: added pure in-place `tintPaintedPixels(pixels,color)` and made
both `paintedTeamFrame` and `paintedTeamImage` use it. It hoists the target RGB
channels and removes the inner three-channel loop. The blue-mask predicate,
light calculation, clamping, Uint8ClampedArray rounding and alpha bytes are
unchanged. Cache keys, limits, readback requests, creation rates and source
resolution selection are unchanged. Shell v203; no runtime dependency or
browser script added. No measured timing or FPS improvement is claimed.

`tests/team-frame-cache.test.mjs` now compares the actual production helper
against the frozen pre-extraction loop. Eight palettes × 2,621,440-byte seeded
buffers give **20,971,520 byte comparisons with zero differences**. Fixtures also
cover alpha 7/8/9, exact blue/red and blue/green predicate boundaries, the
1.25 ratio boundary, light clamps and black/white output. Every alpha byte is
asserted unchanged and the helper must mutate the supplied buffer in place.

An independent native Skia comparison holds the current painter constant and
changes only the old/new tint implementation. Across real atlas images for 14
kinds, four teams, idle/walk/attack, two animation phases and both zoom/DPR pairs,
**672 rendered comparisons have zero differing channel samples**. Both renders
contain visible art (1,784,996 nontransparent pixel samples). This verifies the
tint refactor on that backend; it does **not** accept Phase 1 or certify Chromium
or physical Xbox rendering.

### Why the native mirror probe was inconclusive

A separate primitive control on a real Militia crop found that native
`@napi-rs/canvas` high-quality **unmirrored 1:1 copying** changes pixels: maximum
channel delta 128, maximum alpha delta 16, 60,357 differing channel samples.
The corresponding reflected 1:1 copy has exactly those same delta/count values.
The old renderer makes this extra filtered copy; the candidate omits it. This
shows that the earlier native comparison includes an extra-copy filtering
confound, rather than independently proving a transform/anchor error. It does
not establish what Chromium does or waive the one-level acceptance threshold.

Corrected `tests/browser/frame-tints.mjs` so its legacy mirror reference uses
the actual original **high-quality nine-argument copy**, instead of the Canvas
default-quality five-argument shortcut. Added an unmirrored identity-copy control
and logs for both maximum deltas before assertions. The mirror acceptance
threshold remains **≤1 channel level**. No previously executed failing browser
test was relaxed; this fixture remains unexecuted here.

The alternate cloud browser could not reach the local test server (connection
refused). Observing its error tab was then denied by the browser URL policy;
that route was stopped without attempting a workaround. The local Chromium
singleton-socket restriction remains. Browser acceptance is still **OPEN**.

### Commands and results

- `node --test tests/team-frame-cache.test.mjs tests/troop-cache-working-set.test.mjs`:
  **22/22 passed**.
- The eight-file targeted command in the Phase 0 entry: **78/78 passed**.
- `node scripts/run-checks.mjs`: **5/5 passed**.
- `node /tmp/graphics-kernel-native-pixels.cjs`: **672/672 zero-difference tint-only comparisons**,
  against pre-refactor `88dfed8` assets code and the same painter on both sides;
  installed native Skia, not Chromium/Xbox.
- `node /tmp/graphics-raster-probe.cjs`: diagnostic-only copy-control measurements
  described above; no claim of browser acceptance.
- `node --check tests/browser/frame-tints.mjs` and `git diff --check`: passed.
- `node --test tests/*.test.mjs`: **1,723/1,723 passed** across all 290
  standalone files, 187.29 seconds, including **19 scripted campaign wins**.

The following entries retain the earlier checkpoint details. Phase 2 and the
remaining Phase 3/6 cache/recovery work are still unfinished; Phase 4/5 retain
their measurement gates. Phase 1 remains an unaccepted candidate.

## 15 November 2026 — Phase 1 shared-facing candidate: pixel acceptance OPEN

The owner authorized continuing without Xbox access after Phase 0. Implemented
the next repair on local `graphics-stability`; **this is an unaccepted candidate**,
not a release. Nothing was pushed, merged or deployed. Physical Xbox access is
not the current blocker: the required browser pixel gate has not passed.

### Changes and counted results

`js/render-troops.js`: `troopFrameTexture` no longer includes facing in its key,
creates no flipped canvas, and returns the same native tint for both facings.
The facing argument remains accepted for caller compatibility. `drawPaintedTroop`
keeps the forward direct path and uses its existing save/translate/scale/restore
path for left-facing troops, drawing from the shared source at the original foot
anchor. Tinting, simulation, source artwork and existing distant-zoom resolution
selection were not changed. Offline shell is v202.

Operation counts from the same deterministic Phase 0 fixture, per 120 measured
frames; these are **mock counts, not timing or native-memory measurements**:

| Zoom / DPR | Kinds per team | Crop creations before → candidate | Crop entries before → candidate |
|---|---:|---:|---:|
| 2.05 / 0.6 | 3 | 2,700 → 0 | 118 → 0 |
| 2.05 / 0.6 | 6 | 2,700 → 0 | 142 → 0 |
| 2.05 / 0.6 | 9 | 4,100 → 0 | 123 → 0 |
| 2.05 / 0.6 | 14 | 3,450 → 0 | 124 → 0 |
| 1.0 / 1.0 | 3 | 5,400 → 2,700 | 160 → 160 |
| 1.0 / 1.0 | 6 | 5,400 → 5,400 | 160 → 160 |
| 1.0 / 1.0 | 9 | 9,540 → 7,920 | 160 → 160 |
| 1.0 / 1.0 | 14 | 8,820 → 8,820 | 160 → 160 |

Tint creations, tint evictions and readback pixels are unchanged from the Phase 0
table. Native-resolution poses allocate zero second-layer crops, including while
tints churn. The pre-existing distant-zoom crop cache still churns in this dense
fixture; removing mirror duplication alone does not solve all cache pressure.

### Verification and unresolved pixel gate

- `node scripts/run-checks.mjs`: **5/5 passed**.
- The exact eight-file targeted command listed under Phase 0: **77/77 passed**.
- `node --test tests/series-s-painted-troop-frame-cache.test.mjs tests/troop-cache-working-set.test.mjs`:
  **26/26 passed** after updating the expected mirror-allocation behavior.
- `node --test tests/*.test.mjs`: **1,722/1,722 passed**, 187.36 seconds;
  all **19 scripted campaign wins** were included. No Xbox FPS claim follows.
- `CK_BROWSER_EXECUTABLE=/usr/bin/chromium node scripts/run-checks.mjs --browser`:
  **0/2 launched**; environment still denies Chromium's singleton socket.
- Additional temporary probe, `node /tmp/graphics-phase1-native-pixels.cjs`,
  compares the actual Phase 0 and candidate painters using installed native
  `@napi-rs/canvas`/Skia, real atlas images, 14 kinds, four teams, idle/walk/attack,
  two animation phases and both zoom/DPR pairs. **The pixel assertion failed**:
  672 comparisons, maximum channel difference 255, maximum alpha difference 16,
  3,121,349 differing channel samples. Both renders contain real visible art.
  A temporary destination-alignment experiment also failed and was not adopted.
  This backend is not Chromium or Xbox. Its result cannot certify or disprove
  Chromium equivalence, but is evidence against calling this change accepted.
- `git diff --check`: passed.

Updated `tests/series-s-painted-troop-frame-cache.test.mjs` to require shared
normal/left-facing canvases, no baked flip operations, the original foot-anchor
transform, unchanged distant-zoom dimensions and atlas fallback on crop failure.
Updated `troop-cache-working-set.test.mjs` to pin zero native crop allocations;
all tint/readback/budget assertions remain. Added an actual old-mirrored-copy
versus transformed-source comparison to `tests/browser/frame-tints.mjs`, across
motion atlases, four teams and three scales. It retains the **≤1 channel-level**
acceptance threshold; it has not executed here. No tolerance was relaxed to pass
the native probe, and no runtime dependency was added.

**Next engineering gate:** run the new browser comparison where Chromium can
launch, investigate any differing pixels and accept/revise Phase 1 before layering
cache-release/budget changes over it. Phases 2–7 are not implemented. Phase 4
ImageBitmap and Phase 5 decode experiments still require the specified evidence.
Existing automatic recovery-scale changes remain until Phase 6. Quality identity,
console stability and performance gains remain unverified.

## 15 November 2026 — Phase 0 graphics investigation gate

**Scope:** diagnostic instrumentation and fixtures only, based on `main` at
`9d431c1a201d52c58db1298cfce2677f1e230a6d`, on local branch `graphics-stability`.
No merge, push or deployment. At this checkpoint Phases 1–7 were unimplemented; the existing
automatic recovery scale changes are intentionally still present until Phase 6.
No improvement to FPS, native memory, pixel identity or Xbox stability is claimed.

### Implementation

- `js/assets.js`: `GRAPHICS_TRACE`, `resetGraphicsTraceFrame` and `traceAtlasDraw`
  observe successful tint creations, requested readback pixels and the first
  synchronous source draw for each atlas used by the tint path. First-draw time
  can include decoding/upload/submission; it is **not isolated decode time** and
  cannot detect a later browser-internal re-decode of the same image.
- `js/render-troops.js`: `troopFrameTexture` counts successful crop creations
  and crop-budget evictions. Tint-budget evictions are counted in
  `paintedTeamFrame`. Rendering and eviction policies are unchanged.
- `js/engine-picture.js`: `graphicsSurfaceEstimate` deduplicates known retained
  canvas references (world/HUD, scratch, tints, crops, fog, terrain, resources,
  damage/LOD and procedural sprites). Atlas RGBA bytes estimate all ready loaded
  atlas images; `touchedAtlasBytes` separately estimates images observed through
  the tint path. Browser-resident decoded bytes, evicted-but-uncollected surfaces,
  compositor allocations, non-atlas source images and driver copies are unknown.
  `nativeEstimateBytes` is a diagnostic estimate, never measured GPU memory.
- `engine.js`: reset counters at callback entry and capture a 120-frame ring in
  `finally`, including RAF, draw/unit/simulation/tick counts, visible/total units,
  buildings, zoom, DPR and scale. `traceMs` records snapshot overhead separately.
  The 30 Hz step, accumulator, delta clamp, commands and saves are unchanged.
- `persistGraphicsLoss` writes a chronological report before recovery can clear
  caches. Keys: `ck_graphics_loss_latest` and rotating slots
  `ck_graphics_loss_0` through `ck_graphics_loss_3`. Storage failures are caught.
  These records contain graphics counts/settings, not saved worlds or room data.
- `js/ui.js`: the optional performance HUD displays current-frame rates,
  first-draw time and previous-completed-frame retained surface estimates.
  `resetGraphicsDiagnostics` resets the ring/counters/atlas observations;
  existing cumulative tint counters remain intact. Offline shell is v201;
  no browser script, image, manifest or runtime dependency was added.

### Counting fixture evidence

`tests/troop-cache-working-set.test.mjs` uses the actual manifest, `assetFrame`,
`paintedTeamFrame` and `drawPaintedTroop`/`troopFrameTexture` with a counting canvas.
It runs 90 visible soldiers across four teams, rotating idle/walk/attack states,
approximately half mirrored, for 240 frames at 20 synthetic frames/second. The
first 120 frames warm up; the last 120 are counted. This dense deterministic mix
differs from the investigation's random mix; its counts are not interchangeable.
The pixel mock intentionally performs no recolour arithmetic or real rendering.

An independent run against unmodified `9d431c1` and this instrumentation produced
**identical before/after counts** in all eight cases below. Values are totals over
the 120 measured frames, **not milliseconds or Xbox measurements**.

| Zoom / DPR | Kinds per team | Tints before = after | Crops before = after | Readback pixels before = after |
|---|---:|---:|---:|---:|
| 2.05 / 0.6 | 3 | 0 | 2,700 | 0 |
| 2.05 / 0.6 | 6 | 5,400 | 2,700 | 270,500,160 |
| 2.05 / 0.6 | 9 | 6,750 | 4,100 | 353,608,030 |
| 2.05 / 0.6 | 14 | 6,750 | 3,450 | 360,533,280 |
| 1.0 / 1.0 | 3 | 0 | 5,400 | 0 |
| 1.0 / 1.0 | 6 | 5,400 | 5,400 | 270,500,160 |
| 1.0 / 1.0 | 9 | 6,750 | 9,540 | 353,608,030 |
| 1.0 / 1.0 | 14 | 6,750 | 8,820 | 360,533,280 |

During this measured window tint evictions equal tint creations and crop
evictions equal crop creations. Retained caches remain within their existing
16 Mpx tint and 6 Mpx / 160-entry crop limits. This proves baseline churn,
not the cause of the Xbox context losses or a native-memory leak.

### Test changes and execution

- Added ten behavioral/counting cases in `troop-cache-working-set.test.mjs`;
  the central focused selection includes this file. Tests pin exact counts,
  accounting, deterministic repetition, ring order/length, individual world/HUD
  loss reports, restricted storage and first-draw/surface estimates.
- `tests/raf-gap-performance.test.mjs`: updated the `finally` source assertion
  to require both the original loop timer and the new capture call. Fixed-step
  cadence and RAF scheduling assertions remain.
- `tests/series-s-xbox-picture-presets.test.mjs`: saves/settings snapshots exclude
  only the five exact diagnostic keys; added positive checks for the persisted
  loss ID and world flag. Every other storage write remains a failure. Existing
  automatic recovery scale tests are retained for the Phase 0 baseline.
- `tests/browser/large-army-tints.mjs`: preserves the ordinary warm-cache checks
  and adds 90-unit, four-team, 3/14-kind zoom-2.05/DPR-0.6 and 14-kind
  zoom-1/DPR-1 cases in both renderers, left/right facing, idle/walk/attack,
  per-frame creation/readback/eviction samples and p50/p95/p99 draw time.
  Timings include the fixture's synchronization readback, not presentation or FPS.
  High-working-set scenes report churn instead of asserting zero misses.
- README inventory increased from 289 to 290 standalone files. No existing
  test was deleted, and no production quality or simulation requirement changed.

Final execution on the local implementation tree:

| Command | Result |
|---|---|
| `node scripts/run-checks.mjs` | 5/5 quick gates passed, both runs |
| Targeted command below | Final 77/77 tests passed |
| `node --test tests/troop-cache-working-set.test.mjs` | 10/10 passed |
| `node --test tests/troop-cache-working-set.test.mjs tests/repository-evidence-inventory.test.mjs tests/raf-gap-performance.test.mjs tests/series-s-xbox-picture-presets.test.mjs` | 36/36 passed |
| `node --test tests/*.test.mjs` | Final 1,722/1,722 passed across all 290 standalone files, 185.96 seconds |
| `node /tmp/compare-graphics-counts.mjs` | All eight independent before/after mock comparisons identical; temporary comparison runner, no browser timings |
| `node scripts/run-checks.mjs --browser` | 0/2 launched: default Playwright browser missing |
| `CK_BROWSER_EXECUTABLE=/usr/bin/chromium node scripts/run-checks.mjs --browser` | 0/2 launched: environment denies Chromium socket creation |
| `CK_BROWSER_EXECUTABLE=/usr/bin/chromium node tests/browser/large-army-tints-runner.mjs` | Could not launch: Chromium socket restriction; first attempt also needed the preinstalled Playwright package made resolvable locally |
| `git diff --check` | Passed |

Exact targeted command:

```sh
node --test tests/series-s-painted-troop-frame-cache.test.mjs tests/team-frame-cache.test.mjs tests/raf-gap-performance.test.mjs tests/series-s-xbox-picture-presets.test.mjs tests/series-s-sharp-hud-canvas.test.mjs tests/series-s-canvas-pixel-test.test.mjs tests/series-s-auto-layer-benchmark.test.mjs tests/troop-cache-working-set.test.mjs
```

Earlier diagnostic runs exposed an incorrect new-fixture assumption that idle
art always has multiple frames (29/37 passed), then four old assertions requiring
the former exact `finally` spelling and zero diagnostic storage writes (73/77).
The first full run passed 1,717/1,722, with those same four and the README count
check failing. Corrected the fixture/assertions/inventory and reran the affected
tests and full suite to the passing totals above. No production recovery policy
was changed to satisfy an assertion.

The final full run includes `simulation-smoke.test.mjs` and all 19 isolated
scripted campaign outcomes, **19 wins / 0 defeats / 0 timeouts**. The previously
reported Mission 2 smoke failure did **not** reproduce. No separate
`--campaigns` or `--skirmishes` invocation was needed for this observation-only
phase; scripted campaign victories do not establish human/hardware acceptance.

Chromium attempts using `/usr/bin/chromium` fail at launch because the environment
denies its process-singleton socket (`Operation not permitted`). The default
Playwright browser is also absent. Neither browser fixture nor `frame-tints.mjs`
has executed here; browser pixels, timings and new-fixture assertions remain
**UNVERIFIED**. The pure tint-kernel replacement/test belongs to Phase 3 and is
not part of this diagnostic-only change.

### Series S checklist — STOP before Phase 1

Use the same local build, scene, picture preset, camera and zoom for comparisons.
This branch has not been published, so the current live site does not contain
these counters. Arrange a separately authorized test build before hardware use.

1. Record build SHA, Edge/Xbox versions, picture preset, backing dimensions,
   DPR, zoom, visible/total soldiers/buildings and loss count. Photograph the
   performance HUD; allow the fixture to warm before taking steady-state values.
2. In the 212-unit/240-building battle, capture UNIT ms / visible soldiers
   before the first loss, then after restoration at the same camera and preset.
   Also record recovery scale: the existing Phase 0 auto-scale may change it.
   A large rise on cache-hit frames points toward cached-draw/backend behavior;
   high creation/readback counts instead implicate render-path churn.
3. Record current-frame tint/crop creations, readback pixels, evictions,
   first-draw proxy, retained canvases/MiB and atlas-inclusive estimate while
   idle, moving, attacking and panning. Repeat 50/100/200 visible troops with
   1/2/4 teams and 3/6/9/14 kinds at zoom 0.65/1/2.05, DPR 1/0.6.
   Spikes on first atlas use warrant decode-path investigation; this proxy
   alone cannot prove re-decoding or GPU exhaustion.
4. Measure a building-heavy view with all 240 buildings visible. Record BLD ms,
   visible building count and soldier-cache churn to expose shared-cache pressure.
5. Before and after the first loss, compare `perfLayerMode` terrain/objects,
   `perfFlatField`, `perfUnitPass` sprites/ground/skip and the benchmark's
   Units-only stage. Record UNIT/DRAW/RAF GAP, plus simulation ms per tick.
   This separates sprite work from ground markings, terrain and presentation.
6. Preserve the latest report and four rotating loss records in that browser.
   If developer-console access is available, export
   `localStorage.getItem('ck_graphics_loss_latest')`; console access on Series S
   is not assumed. With controller-only access, photograph the new HUD lines;
   there is currently no controller-only JSON export screen.
7. Return these measurements before cache repairs. Final stability acceptance
   remains three separate 30-minute runs without context loss, stable memory
   estimates and later creation-cap checks. No Xbox FPS target has been reached
   or inferred from these mock counts.

## 5 November 2026 — Recover blank terrain transitions

This file is the **short current gate**, not the old chronological rendering journal. The [complete original historical report](https://github.com/johnstacey16-ui/crown-and-kingdoms/blob/763caa425a2684f4d79de1b2c21f14639aefb6d8/GRAPHICS_ACCEPTANCE.md), including dated Xbox photographs/readings, Chromium probes, artwork increments and source/CI provenance, is preserved in Git history. See [the archive index](docs/HISTORY.md).

## Required acceptance (not yet fully achieved)

1. **Original and readable:** preserve existing painted stone, gold, berries, terrain and unit/building art, plus known procedural fallbacks. Review game-play scale, clarity, faction/style differences, construction, damage, projectile and FX rendering against [the graphics checklist](docs/GRAPHICS_OVERHAUL_CHECKLIST.md) and [painted-art source](docs/PAINTED_ART.md).
2. **Real motion coverage:** dedicated independent facings, work/death animations, Elites, regional architecture and coherent age upgrades need more than a base or tinted sprite. New roster items also need fallback art and acceptance checks. See [motion notes](docs/PAINTED_MOTION.md) and [Elite art brief](docs/ELITE_ART_PRODUCTION.md).
3. **Offline and recovery:** generated atlases, WebP/manifest and `sw.js` shell must work offline, recover lost canvas textures and avoid blank/black transition/fog regions. Preserve cached-art integrity and save data. See [historical recovery evidence](docs/verification/canvas-recovery-2026-11-05.json), [terrain blend](docs/verification/terrain-blend-recovery-2026-11-05.json) and [fog profile](docs/verification/browser-fog-profile-2026-11-05.json).
4. **Measured performance:** compare repeatable 50/100/200-unit and large-battle scenes on a stable game revision, zoom, graphics scale and camera. Record FPS, draw/sim/RAF/compositor costs, object counts, terrain/fog and memory bounds; never promote simulated Node performance to hardware FPS. Refer to [performance audit](docs/PERFORMANCE_RENDER_AUDIT.md) and [ROADMAP.md](ROADMAP.md).
5. **Separate sign-off:** quick/focused source checks, actual Chromium browser screenshots/layout/art probes and **physical Xbox Series S Edge** clarity/FPS/controller checks are different gates. Browser or contract success is **not** physical hardware acceptance. Record each test with the commit SHA and observable evidence; see [professional acceptance](docs/PROFESSIONAL_QUALITY.md).

## How to verify

Use `node scripts/run-checks.mjs --quick` and the appropriate focused graphics tests; after installing the repository's pinned Playwright version run `node scripts/run-checks.mjs --browser`. `node scripts/run-checks.mjs --xbox-contracts` checks software/controller contracts, not a console. The graphics inventory is generated from `docs/graphics-inventory.json` via `node scripts/audit-graphics.mjs --check` where supported. Keep slow/hosted checks within the manual CI and free-hosting rules in [AGENTS.md](AGENTS.md).

**Status:** source inventory and historical browser experiments exist, but full original art, consistent physical Xbox rendering and whole-game visual quality remain **PARTIAL/UNVERIFIED** until tested on the exact accepted build.
