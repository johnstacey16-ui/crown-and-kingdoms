import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ui = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const save = readFileSync(new URL('../js/save.js', import.meta.url), 'utf8');

test('load menu exposes one rolling autosave recovery action separately from manual slots', () => {
  assert.match(ui, /localStorage\.getItem\('ck_autosave'\)/);
  assert.match(ui, /Recover Autosave[\s\S]*?loadG\(true\)/);
  assert.match(ui, /const slotItems=\(\)=>\{const items=SI\.map\(/);
  assert.match(engine, /function openSlots\(m,back\)[\s\S]{0,220}restoreMissing\(\)/);
  assert.match(save, /const key=auto\?'ck_autosave':skey\(slot\)/);
});

test('browser roadmap records autosave as implemented but not fully verified', () => {
  const roadmap = readFileSync(new URL('../docs/BROWSER_TECH_ROADMAP.md', import.meta.url), 'utf8');
  assert.match(roadmap, /Implemented, automated verification pending/);
  assert.match(roadmap, /Periodic and pause\/blur-triggered autosaves are suppressed while multiplayer is running/);
  assert.match(roadmap, /storage-quota failures, interrupted writes, IndexedDB restore ordering and recovery through a live browser/);
});
