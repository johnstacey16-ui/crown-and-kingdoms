import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const menus = readFileSync(new URL('../js/menus.js', import.meta.url), 'utf8');
const campaign = readFileSync(new URL('../js/campaign.js', import.meta.url), 'utf8');

test('shared title and generic list renderers have one owner in js/ui.js', () => {
  assert.ok(html.indexOf('./js/ui.js') < html.indexOf('./engine.js'));
  assert.match(ui, /function titleBg\(\)\{/);
  assert.match(ui, /function drawList\(title,items,idx,sub\)\{/);
  assert.doesNotMatch(engine, /function titleBg\(\)\{/);
  assert.doesNotMatch(engine, /function drawList\(title,items,idx,sub\)\{/);
  assert.match(ui, /function panel\(x,y,w,h\)\{/);
  assert.doesNotMatch(engine, /function panel\(x,y,w,h\)\{/);
});

test('title, options, campaign and save-slot screens continue using the shared renderers', () => {
  assert.match(menus, /function drawTitle\(\)\{titleBg\(\)/);
  assert.match(menus, /function drawSetup\(\)\{titleBg\(\);drawList\(/);
  assert.match(menus, /function drawOpts\(\)\{titleBg\(\);drawList\(/);
  assert.match(campaign, /function drawCamp\(\)\{titleBg\(\);drawList\(/);
  assert.match(campaign, /function drawBrief\(\)\{titleBg\(\)/);
  assert.match(ui, /function drawSlots\(\)\{titleBg\(\);drawList\(/);
});
