import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

function fixture(){
 const {source,sandbox,storage}=headlessGame();
 vm.createContext(sandbox);
 vm.runInContext(source+'\n'+
  readFileSync(new URL('../js/ui.js',import.meta.url),'utf8')+
  '\n;globalThis.evalGame=code=>eval(code)',sandbox);
 return {run:sandbox.evalGame,storage};
}
test('reduced cosmetic effects is offered in Options and Pause via the shared menu model',()=>{
 const {run,storage}=fixture();
 assert.equal(run('reducedCosmeticEffects'),false);
 const label="pmItems().find(x=>x.n==='Reduced cosmetic effects')";
 assert.equal(run(label+".v()"),'Off');
 assert.equal(run("optsItems().some(x=>x.n==='Reduced cosmetic effects')"),true);
 run(label+'.a()');
 assert.equal(run(label+'.v()'),'On');
 assert.equal(storage.get('ck_reduced_effects'),'1');
 run(label+'.l()');
 assert.equal(run(label+'.v()'),'Off');
 assert.equal(storage.get('ck_reduced_effects'),'0');
});
test('nonessential dust/smoke are filtered but combat effects still exist',()=>{
 const {run}=fixture();
 run("emit('dust',2,3,1);emit('smk',2,3,1);emit('spark',2,3,1)");
 assert.equal(run('PT.length'),3);
 const before=run('JSON.stringify(S)');
 run('toggleReducedCosmeticEffects()');
 run("emit('dust',2,3,10);emit('smk',2,3,10);emit('puff',2,3,10);emit('spark',2,3,1);emit('deb',2,3,1)");
 assert.equal(run('PT.length'),5);
 assert.equal(run('PT[0].k'),'dust','existing visual particles remain in storage until expiration');
 assert.equal(run('JSON.stringify(S)'),before,'visual preference cannot change game state');
});
test('reduced mode skips painting previously emitted ambient particles without modifying gameplay',()=>{
 const {run}=fixture();
 run("PT.push({k:'dust',x:1,y:1,z:0,t:0,l:1,r:2,c:'#fff'})");
 run("PT.push({k:'spark',x:1,y:1,z:0,t:0,l:1,r:2,c:'#fff'})");
 run('globalThis.arcs=0;const arc=X.arc;X.arc=function(...v){arcs++;return arc(...v)}');
 run('drawP()');
 assert.equal(run('arcs'),2);
 run('toggleReducedCosmeticEffects();arcs=0;drawP()');
 assert.equal(run('arcs'),1,'combat sparks still render');
});
