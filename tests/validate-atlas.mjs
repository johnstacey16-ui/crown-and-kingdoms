#!/usr/bin/env node
// Static regression check for local sprite-atlas metadata. No dependencies required.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const match = html.match(/<script[^>]*id=["']ck-assets["'][^>]*>([\\s\\S]*?)<\\/script>/i);
assert.ok(match, 'index.html must contain the ck-assets JSON manifest');
const pack = JSON.parse(match[1]);
assert.ok(Array.isArray(pack.atlases) && pack.atlases.length, 'asset manifest must contain at least one atlas');

let animations = 0;
let frames = 0;
for (const atlas of pack.atlases) {
  assert.ok(atlas && atlas.id && atlas.src && atlas.meta && atlas.meta.anims, 'atlas needs id, local src and animation metadata');
  assert.ok(atlas.src.startsWith('./assets/'), `atlas ${atlas.id} must use a repository-local asset`);
  const assetPath = resolve(root, atlas.src);
  assert.ok(existsSync(assetPath), `missing atlas asset: ${atlas.src}`);
  const svg = readFileSync(assetPath, 'utf8');
  const dimensions = svg.match(/<svg\\b[^>]*\\bwidth=["']([\\d.]+)["'][^>]*\\bheight=["']([\\d.]+)["']/i);
  assert.ok(dimensions, `atlas ${atlas.src} must expose explicit SVG width and height`);
  const width = Number(dimensions[1]);
  const height = Number(dimensions[2]);
  assert.ok(width > 0 && height > 0, `atlas ${atlas.src} has invalid dimensions`);

  for (const [key, animation] of Object.entries(atlas.meta.anims)) {
    animations++;
    assert.ok(animation && typeof animation === 'object', `invalid animation: ${key}`);
    assert.ok(Number.isFinite(animation.dur) && animation.dur > 0, `invalid frame duration: ${key}`);
    const lists = Array.isArray(animation.dirs) ? animation.dirs : [animation.frames];
    assert.ok(lists.length > 0, `animation has no direction lists: ${key}`);
    for (const list of lists) {
      assert.ok(Array.isArray(list) && list.length > 0, `empty animation frame list: ${key}`);
      for (const frame of list) {
        frames++;
        assert.ok(frame && [frame.x, frame.y, frame.w, frame.h, frame.ax, frame.ay].every(Number.isFinite), `invalid frame or anchor: ${key}`);
        assert.ok(frame.x >= 0 && frame.y >= 0 && frame.w > 0 && frame.h > 0, `negative or empty frame: ${key}`);
        assert.ok(frame.x + frame.w <= width + 0.01 && frame.y + frame.h <= height + 0.01, `frame outside ${atlas.src}: ${key}`);
      }
    }
  }
}
assert.ok(animations > 0 && frames > 0, 'atlas manifest contains no usable animation frames');
console.log(`Atlas validation passed: ${pack.atlases.length} atlas(es), ${animations} animation entries, ${frames} frame references.`);
