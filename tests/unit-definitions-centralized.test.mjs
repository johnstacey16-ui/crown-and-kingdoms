import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {currentCivilizationRuntime} from '../scripts/check-civilization-catalogue.mjs';

const config=readFileSync(new URL('../js/config.js',import.meta.url),'utf8');
const engine=readFileSync(new URL('../engine.js',import.meta.url),'utf8');
const catalogue=currentCivilizationRuntime();

test('all 50 implemented troops are defined by config instead of late engine mutation',()=>{
 const units=vm.runInNewContext(config+'\n;U');
 assert.equal(Object.keys(units).length,50);
 assert.match(config,/Object\.assign\(U,\{conq:\{/);
 assert.doesNotMatch(engine,/Object\.assign\(U,\{/);
 for(const kind of ['conq','genoa','boyar','tarkan','huskarl','jaguar',
  'plumed','kamayuk','shotel','gbeto','wagon','huszar']){
  assert.ok(units[kind],'missing unique troop '+kind);
  assert.ok(Number.isFinite(units[kind].hp)&&units[kind].hp>0);
  assert.ok(Number.isFinite(units[kind].t)&&units[kind].t>0);
 }
});

test('all 26 castles retain their unique-unit definitions and technologies',()=>{
 assert.equal(catalogue.civilizations.length,26);
 for(const civ of catalogue.civilizations){
  assert.ok(catalogue.units[civ.uniqueUnit],civ.name+' lost castle troop');
  assert.equal(typeof civ.ut.fx,'function',civ.name+' lost unique technology');
 }
 assert.match(engine,/Object\.assign\(MA,\{boyar:3/);
 assert.match(engine,/Object\.assign\(PRA,\{boyar:3/);
});
