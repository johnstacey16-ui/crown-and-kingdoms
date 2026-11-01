import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = name => readFileSync(new URL('../js/' + name + '.js', import.meta.url), 'utf8');
const sim = read('simulation'), resource = read('simulation-resource-routing'), logistics = read('simulation-logistics'), production = read('simulation-building-production'), policy = read('ai-policy'), campaign = read('campaign');
function section(source, from, to) {
 const start = source.indexOf(from), end = source.indexOf(to, start);
 assert.ok(start >= 0 && end > start);
 return source.slice(start, end);
}
function fixture() {
 const W = 24, H = 24, n = W * H;
 const S = { wt: new Uint8Array(n), g: new Uint8Array(n), gt: new Uint8Array(n),
  nd: Array(n).fill(null), us: [], bs: [], nodes: [], res: [{ w: 500 }] };
 // Use the real map/save representation: deep water ALSO sets the land grid.
 for (let y = 1; y < H - 1; y++) for (let x = 8; x < W - 1; x++) {
  S.wt[y * W + x] = S.g[y * W + x] = 1;
 }
 const ctx = vm.createContext({ W, H, S, window: {}, note() {},
  D8: [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]],
  PA: { pr: new Int32Array(n), g: new Float32Array(n), cl: new Int32Array(n), st: new Int32Array(n), v: 0 },
  U: { gal: { sh: 1 } },
 });
 vm.runInContext(read('pathfinding') + '\n' +
  section(logistics, 'function transportLandingRoute(', '\nfunction tickTrader(') + '\n' +
  section(production, 'function spawnPos(', '\nconst MILITARY_PRODUCTION_BUILDINGS=') + '\n' +
  section(resource, 'function deployFishTrap(', '\nfunction killNode(') + '\n' +
  section(policy, 'function aiDockWaterReach(', '\n// The first Feudal push') + '\n' +
  section(campaign, 'function campaignWaterRegions(', '\nfunction raid('), ctx);
 return { S, ctx, run: code => vm.runInContext(code, ctx) };
}

test('ships route on generated deep water while land units cannot', () => {
 const f = fixture();
 assert.ok(f.run('path({x:9.5,y:5.5,t:0,sh:1},gp(20.5,18.5,.6))').length > 10);
 assert.equal(f.run('path({x:9.5,y:5.5,t:0},gp(20.5,18.5,.6))'), null);
 // A full resource barrier must still prevent naval travel.
 for (let y=1; y<23; y++) f.S.nd[y*24+14] = { fi:1 };
 assert.equal(f.run('path({x:9.5,y:5.5,t:0,sh:1},gp(20.5,18.5,.6))'), null);
});

test('dock production spawns on deep water and respects unit/resource occupancy', () => {
 const f = fixture();
 const b = { k: 'dock', x: 6, y: 8, s: 2 };
 f.ctx.b = b;
 const spot = f.run('spawnPos(b)');
 assert.ok(spot && spot[0] >= 8);
 for(let y=7;y<=10;y++) f.S.nd[y*24+8] = { fi:1 };
 assert.equal(f.run('spawnPos(b)'), null);
 for(let y=7;y<=10;y++) { f.S.nd[y*24+8] = null; f.S.us.push({x:8.5,y:y+.5,hp:10}); }
 assert.equal(f.run('spawnPos(b)'), null);
});

test('dock connectivity and campaign fleets use real deep-water tiles', () => {
 const f = fixture();
 assert.equal(f.run('aiDockWaterReach(6,8)'), true);
 const spots = f.run('raidShipPositions({x:6,y:8,s:2},5,1)');
 assert.equal(spots.length, 5);
 for (const [x,y] of spots) assert.equal(f.S.wt[(y|0)*24+(x|0)],1);
 f.S.nd.fill({fi:1});
 assert.equal(f.run('aiDockWaterReach(6,8)'), false);
 assert.equal(f.run('raidShipPositions({x:6,y:8,s:2},5,1)').length, 0);
});

test('transport finds a real route from deep water to a dry beach', () => {
 const f = fixture();
 const landing = f.run("transportLandingRoute({k:'trn',x:18.5,y:10.5,t:0,sh:1},7.5,10.5)");
 assert.ok(landing && landing.route.length > 5);
 assert.equal(f.S.wt[landing.beach[1]*24+landing.beach[0]],0);
});

test('fish traps deploy on deep water, cost wood and block their occupied tile', () => {
 const f = fixture();
 assert.equal(f.run("deployFishTrap([{k:'fish',hp:40,t:0,x:10.5,y:10.5}])"),1);
 assert.equal(f.S.res[0].w,400);
 assert.equal(f.S.nodes.length,1);
 const trap = f.S.nodes[0];
 assert.equal(f.S.nd[trap.y*24+trap.x],trap);
 assert.equal(f.run(`path({x:${trap.x+.5},y:${trap.y+.5},t:0,sh:1},gp(20.5,18.5,.6))`),null);
});

