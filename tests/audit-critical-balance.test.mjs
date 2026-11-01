import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = readFileSync(new URL('../js/config.js', import.meta.url), 'utf8');
const simulation = readFileSync(new URL('../js/simulation-unit-behaviour.js', import.meta.url), 'utf8');
const engine = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
const roadmap = readFileSync(new URL('../AOE2_PARITY_ROADMAP.md', import.meta.url), 'utf8');

test('critical balance regressions from the parity audit stay corrected', () => {
  assert.match(config, /farm:\{n:'Farm',s:1,hp:480,cost:\{w:60\},bt:15\}/);
  assert.match(config, /needs:\['rng','stable','smith','market'\]/);
  assert.match(config, /treb:\{[^}]*minR:3/);
  assert.match(simulation, /const dist=d2\(u\.x,u\.y,tg\),minR=d\.minR\|\|0/);
  assert.match(simulation, /if\(minR&&dist<minR\)/);
  assert.ok(engine.includes("n:'Supremacy',cost:{f:300,g:250},t:50,age:2,fx:t=>{atkbF(t,'vil',6);hpbF(t,'vil',40)}"));
});

test('roadmap records source corrections without claiming live gameplay verification', () => {
  assert.match(roadmap, /Audit findings and implementation status/);
  assert.match(roadmap, /Xbox Series S \/ Edge performance/);
  assert.match(roadmap, /do not prove full mission playthroughs/);
});

