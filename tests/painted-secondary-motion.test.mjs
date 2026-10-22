import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {headlessGame} from './helpers/headless-game.mjs';

const groups={
  ship:['fish','gal','trn','cog'],
  mounted:['mamel','mgd','cata','camel','conq','boyar','tarkan','huszar'],
  elephant:['eled','ele'],
  siege:['cart','ram','bomb','treb','mang','scor','wagon'],
  ranged:['jan','chuko','hcan','genoa','plumed'],
  foot:['king','gbeto']
};
const fullPainted=['mil','knight','vil','arc','xbow','spear','scout','skirm','mon','axe','lbow','woad','bers','saml','tk','huskarl','jaguar','kamayuk','shotel'];
function evaluator(){
  const {source,sandbox}=headlessGame();
  vm.createContext(sandbox);
  vm.runInContext(source+'\n;globalThis.evaluateSecondary=code=>eval(code)',sandbox);
  return sandbox.evaluateSecondary;
}
test('secondary motion explicitly covers all 28 remaining painted unit kinds with six family tempos',()=>{
  const run=evaluator(),kindList=Object.values(groups).flat();
  assert.equal(kindList.length,28);
  assert.equal(new Set(kindList).size,28);
  assert.equal(run('Object.keys(PAINT_SECONDARY).length'),28);
  for(const [group,kinds] of Object.entries(groups)){
    for(const kind of kinds)assert.equal(run(`PAINT_SECONDARY['${kind}']`),group);
  }
  for(const kind of fullPainted){
    assert.equal(run(`PAINT_SECONDARY['${kind}']`),undefined,'do not alter individually painted animations');
  }
  assert.equal(new Set([...kindList,...fullPainted]).size,47);
});
test('walking pose is repeatable, state-specific and varies over game time across all six families',()=>{
  const run=evaluator();
  for(const kind of Object.values(groups).flat()){
    const at0=run(`JSON.stringify(paintedSecondaryPose('${kind}',1,0))`);
    const at1=run(`JSON.stringify(paintedSecondaryPose('${kind}',1,.137))`);
    assert.notEqual(at0,at1,kind+' walk changes with time');
    assert.equal(at1,run(`JSON.stringify(paintedSecondaryPose('${kind}',1,.137))`));
    assert.equal(run(`paintedSecondaryPose('${kind}',0,.137)`),null);
    assert.equal(run(`paintedSecondaryPose('${kind}',3,.137)`),null);
  }
});
test('attack recoil uses real cooldown phase, pauses and recovers on each family',()=>{
  const run=evaluator();
  for(const kind of Object.values(groups).flat()){
    const start=run(`JSON.stringify(paintedSecondaryPose('${kind}',2,0,0))`);
    const end=run(`JSON.stringify(paintedSecondaryPose('${kind}',2,0,1))`);
    assert.notEqual(start,end,kind+' attack action releases recoil');
    assert.equal(start,run(`JSON.stringify(paintedSecondaryPose('${kind}',2,0,0))`));
    assert.equal(end,run(`JSON.stringify(paintedSecondaryPose('${kind}',2,99,1))`));
  }
  assert.equal(run("paintedSecondaryPose('not-a-unit',1,0)"),null);
  assert.equal(run("paintedSecondaryPose('camel',1,NaN)"),null);
});
test('solo and multiplayer renderers share the same presentation-only pose and preserve sixteen-frame precedence',()=>{
  const solo=readFileSync(new URL('../js/render.js',import.meta.url),'utf8');
  const network=readFileSync(new URL('../js/network-unit-map.js',import.meta.url),'utf8');
  assert.match(solo,/drawPaintedTroop\(X,af,sx,sy,af\.sc\*z,st,pose\.time,mirror,k,pose\.phase\)/);
  assert.match(network,/drawPaintedTroop\(context,sprite,footX,footY,scale,[^\n]*e\.kind,e\.pose\?\.phase\)/);
  assert.match(solo,/const motion=art\.animated\?null:paintedSecondaryPose/);
  const run=evaluator();
  run("seedOv=123456;start();mode='title';globalThis.a=addU(0,'camel',20,20)");
  const before=run('JSON.stringify(a)');
  const checksum=run('JSON.stringify(unitVisualPose(a,S.t))');
  for(let i=0;i<8;i++)run("paintedSecondaryPose(a.k,1,S.t+i/8)");
  assert.equal(run('JSON.stringify(a)'),before);
  assert.equal(run('JSON.stringify(unitVisualPose(a,S.t))'),checksum);
});
