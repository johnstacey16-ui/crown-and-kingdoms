import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const source=readFileSync(new URL('../js/ui-commands.js',import.meta.url),'utf8');
const context=vm.createContext({});
vm.runInContext(source,context,{filename:'js/ui-commands.js'});
const commandArtKind=vm.runInContext('commandArtKind',context);
const drawCommandArt=vm.runInContext('drawCommandArt',context);

test('command wheel uses distinct original illustrated categories',()=>{
 const cases={
  'Lumber Camp':'wood','Farm':'food','Gold Mining Camp':'trade',
  'Stone Wall':'stone','House':'house','Archery Range':'bow',
  'Stable':'horse','Dock':'ship','Castle':'tower',
  'Monastery':'relic','Siege Workshop':'siege','Blacksmith':'forge',
  'Barracks':'shield','Build':'build','Unknown command':'command'
 };
 for(const [label,kind] of Object.entries(cases))assert.equal(commandArtKind(label),kind,label);
 assert.equal(commandArtKind(null),'command');
});

test('every command icon paints bounded, balanced Canvas2D geometry',()=>{
 const operations=new Map();
 for(const label of ['Lumber Camp','Farm','Stone Wall','Market','House','Archer','Scout Cavalry',
    'Fishing Ship','Watch Tower','Monk','Battering Ram','Blacksmith','Militia','Build','Unknown']){
  const calls=[];let depth=0;
  const g={};
  for(const op of ['save','restore','translate','scale','beginPath','moveTo','lineTo',
   'closePath','fill','stroke','fillRect','arc','quadraticCurveTo']){
   g[op]=(...args)=>{
    calls.push([op,...args]);
    if(op==='save')depth++;
    if(op==='restore')depth--;
    assert.ok(depth>=0,label+' negative canvas save depth');
    for(const value of args)assert.ok(Number.isFinite(value),label+' non-finite geometry');
   };
  }
  assert.equal(drawCommandArt(g,label,40,50,21),true);
  assert.equal(depth,0,label+' must restore canvas state');
  assert.ok(calls.some(c=>c[0]==='fill'||c[0]==='fillRect'),label+' must draw');
  operations.set(commandArtKind(label),JSON.stringify(calls));
 }
 assert.equal(new Set(operations.values()).size,operations.size,'distinct visual silhouettes');
});

test('invalid drawing coordinates do not mutate the target context',()=>{
 let count=0;const g={save(){count++}};
 assert.equal(drawCommandArt(g,'House',NaN,0,18),false);
 assert.equal(drawCommandArt(g,'House',0,Infinity,18),false);
 assert.equal(drawCommandArt(g,'House',0,0,0),false);
 assert.equal(drawCommandArt(null,'House',0,0,18),false);
 assert.equal(count,0);
});

test('compact and radial command wheels both draw the new icons',()=>{
 assert.match(source,/drawCommandArt\(X,it\.l,x\+30,yy\+22,20\)/);
 assert.match(source,/drawCommandArt\(X,it\.l,x-w\/2\+14,y-4,19\)/);
});
