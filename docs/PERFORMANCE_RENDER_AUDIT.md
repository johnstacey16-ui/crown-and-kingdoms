## Release evidence — 25 October 2026

The source-level fix was merged in [PR #56](https://github.com/johnstacey16-ui/crown-and-kingdoms/pull/56) at gameplay SHA `242b66948193a46f697a8772baaea3f1201fa7ee`. [PR 189 regression files, 19 campaigns and three AI seeds](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40170077859), [PR Chromium](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40170077819), [validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40170077875) all passed. On merged `main`, [regression/campaign/AI](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40170408502), [Chromium](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40170408454), [validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/40170408451) all passed.

Vercel accepted production deployment `dpl_As5NMW4ynB9qypiuaXPJkX3QnYam`, confirmed **READY**, active alias `crown-and-kingdoms.vercel.app`, and exactly the merged gameplay SHA at the time of verification. The prior daily deployment quota had cleared. Following documentation-only commits require a fresh check/deployment to keep production tracking latest `main`.

**Remaining user-hardware test:** reproduce the same Imperial-Age battle at matching browser resolution and game zoom, with the performance overlay on, and compare **FPS / draw ms / SIM ms**. No specific FPS gain is claimed from CI. If draw ms remains extreme, next profile painted building sprites, scaling and fog/terrain per-tile overlays without deleting visual assets.

---
# Renderer performance investigation — 25 October 2026

## Captured evidence

The user supplied a battlefield screenshot and seven 1080p recordings (roughly ten to eighteen seconds each), recorded from their running Crown & Kingdoms site. The screenshot's in-game performance overlay reads:

- **4 FPS**; **250.0 ms** frame interval.
- **78 units, 94 buildings**.
- Simulation **15.70 ms**, with sampled peak **166.70 ms**.
- Drawing **612.80 ms**, sampled peak **694.80 ms**.

Sampling methodology and timing windows for the HUD fields are not fully identical; the visible measurements are still enough to classify drawing as the dominant slowdown in that scene. No controlled same-hardware before/after benchmark has yet been collected. Do not claim 60 FPS or a specific percent improvement.

## Source-level cause

In `js/render.js` before this patch:

```js
function chunkOf(cx,cy) {
  // ... rasterizes an 8x8 terrain chunk to a 512x256 canvas ...
  TCH.set(key,c);
  if(TCH.size>48)TCH.delete(TCH.keys().next().value);
}
function drawChunks(x0,x1,y0,y1) {
  for(let cy=y0>>3;cy<=y1>>3;cy++)
    for(let cx=x0>>3;cx<=x1>>3;cx++) {
      const c=chunkOf(cx,cy);
      X.drawImage(c.cv,c.ox*zm-cam.x,c.oy*zm-cam.y,c.w*zm,c.h*zm);
    }
}
```

A rotated, isometric diamond viewport becomes an enclosing rectangle in world coordinates; many of the rectangular chunks are not visible on screen. Every miss calls `paintTile()` and `paintTileDetail()` on 64 cells. Over-large rectangular traversals evict necessary visible chunks from the fixed 48-entry LRU, sometimes before the next frame. At wide aspect ratios or low zoom, this results in sustained terrain canvas regeneration despite a stationary camera.

## Implemented fix

- Calculate each terrain chunk's projected canvas bounds using the existing `CKS=8`, `zoom`, camera offset, `CW` and `CH`, **before** calling `chunkOf()`.
- Skip projected rectangles that cannot intersect the screen. Keep the existing `drawImage` source and coordinates identical for visible chunks; no paint palette or artwork changes.
- Move LRU trimming to the end of the visible draw list, so a frame cannot evict other terrain it still needs to draw.
- Dynamically retain the number of visible chunks **plus 16 cached neighbors**, with a lower bound of **64**, a capped **320-chunk** panning budget and a strict floor of **all visible chunks** even on ultra-high-resolution displays (512 × 256 original backing pixels). This minimizes camera-pan misses while still bounding memory.
- Respect existing `TCH.clear()` calls on map size changes and painted terrain load. Do not change save files, map generation, fog, water, units, buildings or gameplay.

## Verification

Source-backed `tests/terrain-chunk-visible-cache.test.mjs` runs actual production `chunkOf` / `drawChunks` functions under a lightweight fake Canvas2D host and checks:

1. A 2560 × 1440 low-zoom isometric viewport has more than 48 visible chunks yet paints each only once, and creates none for the offscreen bounding rectangle.
2. A completely stationary view repaints **zero** terrain textures across thirty successive renders.
3. Camera pans reuse chunks and never exceed the configured max cache size.
4. 1280 × 720, 1920 × 1080, 2560 × 1440, 3840 × 2160, 5120 × 2880 and max zoom draw exactly the geometrically visible chunks with identical screen positions, dimensions and original backing sizes.
5. Explicit cache invalidation reliably regenerates terrain when required.

Passing CI proves cache correctness, not device FPS. Production deployment and a same-machine before/after frame-timing recording remain independent release/validation gates. Continue performance profiling for sprite drawing, asset-scale quality and Canvas compositing if the recorded draw time remains high.

