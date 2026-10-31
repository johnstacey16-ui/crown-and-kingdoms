import test from 'node:test';
import assert from 'node:assert/strict';
import {runChokepoint} from '../scripts/stress-200.mjs';

test('200 formation-ordered units plan A* routes through a two-tile chokepoint',()=>{
 const r=runChokepoint({ticks:360});
 assert.equal(r.unitCount,200);
 assert.equal(r.closedRoute,true,'closing both passage tiles must disconnect the map');
 assert.equal(r.ordered,true);
 assert.equal(r.validRoutes,200,'all 200 soldiers must have reachable planned paths');
 assert.equal(r.planned.invalid,0);
 assert.ok(r.planned.formationOrders>=1);
 assert.equal(r.planned.formationUnits,200);
 assert.ok(r.planned.found>=200);
 assert.equal(r.invalidCoordinates,0,'movement must keep finite map-bounded coordinates');
 assert.equal(r.blockedCellUnits,0,'unit collision must not cross blocked wall cells');
 assert.ok(r.moved>100,'most soldiers should make measurable progress');
 assert.ok(r.crossed>0,'the choke must permit actual movement into the far side');
});

test('stress harness rejects misleading unit counts and invalid horizons',()=>{
 assert.throws(()=>runChokepoint({count:201}),/Expected 200 units/);
 assert.throws(()=>runChokepoint({ticks:2401}),/Expected 200 units/);
});
