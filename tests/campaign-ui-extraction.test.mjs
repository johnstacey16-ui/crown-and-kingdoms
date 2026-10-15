import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
const campaign = readFileSync(new URL('../js/campaign.js', import.meta.url), 'utf8');

test('campaign list, briefing and objective overlays are presentation-owned by js/ui.js', () => {
  assert.ok(html.indexOf('./js/ui.js') < html.indexOf('./js/campaign.js'));
  for (const name of ['cmpHud','cmpObj','wrapT','drawCamp','drawBrief']) {
    assert.ok(ui.includes('function '+name+'('), name+' must remain available in UI');
    assert.ok(!campaign.includes('function '+name+'('), name+' must not be duplicated in campaign logic');
  }
});

test('campaign data, progression, objective checks and controller handlers remain in js/campaign.js', () => {
  assert.match(campaign, /const CAMP=\[/);
  assert.match(campaign, /const CAMP_ARCS=\[/);
  assert.match(campaign, /function startScenario\(i\)\{/);
  assert.match(campaign, /function cmpTick\(dt\)\{/);
  assert.match(campaign, /const campItems=\(\)=>/);
  assert.match(campaign, /function campCtl\(\)\{/);
  assert.match(campaign, /function briefCtl\(\)\{/);
  assert.match(ui, /function cmpHud\(\)\{[\s\S]*?sc\.goals\.filter\(q=>!cmp\.d\[q\.id\]\)\.slice\(0,5\)/);
});
