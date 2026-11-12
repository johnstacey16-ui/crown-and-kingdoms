import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {headlessGame} from './helpers/headless-game.mjs';

function game(){
 const {source,sandbox}=headlessGame();vm.createContext(sandbox);
 const protocol=readFileSync(new URL('../js/network-sync.js',import.meta.url),'utf8');
 const host=readFileSync(new URL('../js/network-commands.js',import.meta.url),'utf8');
 vm.runInContext(source+'\n'+protocol+'\n'+host+'\nglobalThis.sightEval=code=>eval(code)',sandbox);
 const run=sandbox.sightEval;
 run("seedOv=411126;kingdoms=3;msz=0;startAge=2;startArmy=0;startRes=3;start();S.us=[];S.bs=[];S.nodes=[];S.rel=[];S.pj=[];S.nd.fill(null);S.g.fill(0);S.wt.fill(0);S.vs.fill(0);S.ex.fill(0);S.civ=[41,0,41];S.dip=createDiplomacy(3);globalThis.infantry=addU(1,'mil',24.5,24.5);globalThis.archer=addU(1,'arc',42.5,42.5)");
 return run;
}
test('Armenian team bonus grants +2 LoS to infantry without boosting archers, villagers or ships',()=>{
 const run=game();
 assert.equal(run("unitSight(infantry)"),8);
 assert.equal(run("unitSight(archer)"),8);
 run("S.dip[0][1]=S.dip[1][0]='ally'");
 assert.equal(run("unitSight(infantry)"),10);
 assert.equal(run("unitSight(archer)"),8);
 for(const kind of ['vil','gal','mon']){
  const unit=run("addU(1,'"+kind+"',50.5,50.5)");
  assert.equal(run("unitSight(S.us.find(u=>u.k==='"+kind+"'))"),kind==='vil'?4:kind==='mon'?11:8);
 }
});
test('Allied Armenian civilizations do not stack or leak across enemy diplomacy',()=>{
 const run=game();
 run("S.dip[0][1]=S.dip[1][0]='ally';S.dip[1][2]=S.dip[2][1]='ally'");
 assert.equal(run("unitSight(infantry)"),10,'the two Armenian allies deduplicate');
 run("S.dip[0][1]=S.dip[1][0]='enemy'");
 assert.equal(run("unitSight(infantry)"),10,'one remaining Armenian ally still grants +2');
 run("S.dip[2][1]=S.dip[1][2]='enemy'");
 assert.equal(run("unitSight(infantry)"),8,'breaking both alliances revokes the team sight');
});
test('Solo fog uses the same +2 infantry sight and withdraws it after alliance changes',()=>{
 const run=game();
 run("S.us=[infantry];S.dip[0][1]=S.dip[1][0]='ally';fog()");
 assert.equal(run("S.vs[24*W+34]"),1,'distance-10 tile is visible to Armenian-allied infantry');
 assert.equal(run("S.vs[24*W+35]"),0,'distance-11 tile stays undiscovered');
 run("S.dip[0][1]=S.dip[1][0]='enemy';fog()");
 assert.equal(run("S.vs[24*W+34]"),0,'breaking alliance immediately removes sight');
 assert.equal(run("S.ex[24*W+34]"),1,'explored history remains remembered but not currently visible');
});
test('Multiplayer host visibility uses the authoritative team/civ rules, not solo cached fog',()=>{
 const run=game();
 run("S.us=[infantry];S.dip[0][1]=S.dip[1][0]='ally';S.vs.fill(0);S.ex.fill(0)");
 assert.equal(run("CK_GAME_COMMANDS.visibility(S,1,W,H)[24*W+34]"),1);
 assert.equal(run("CK_GAME_COMMANDS.visibility(S,1,W,H)[24*W+35]"),0);
 run("S.dip[0][1]=S.dip[1][0]='enemy';");
 assert.equal(run("CK_GAME_COMMANDS.visibility(S,1,W,H)[24*W+34]"),0);
});
test('Infantry of Armenian civilization receives its own bonus with no allies',()=>{
 const run=game();
 run("S.civ[1]=41");
 assert.equal(run("unitSight(infantry)"),10);
});
test('Fresh save/load preserves the civilization and diplomacy that drive sight',()=>{
 const run=game();
 run("S.dip[0][1]=S.dip[1][0]='ally'");
 assert.equal(run("saveG(false,'armenian-team-vision')"),true);
 run("S.civ[0]=0;S.dip[0][1]=S.dip[1][0]='enemy'");
 assert.equal(run("loadG(false,'armenian-team-vision')"),true);
 assert.equal(run("S.civ[0]"),41);
 assert.equal(run("unitSight(S.us.find(u=>u.t===1&&u.k==='mil'))"),10);
});
