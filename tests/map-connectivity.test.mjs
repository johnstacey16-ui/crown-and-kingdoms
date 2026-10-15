import assert from 'node:assert/strict';
import { floodFill, connectedComponents, auditReachability, auditLandAndWater } from '../scripts/map-connectivity.mjs';

const grid = [
  ['L','L','W','W'],
  ['L','X','W','L'],
  ['L','L','W','L'],
  ['W','W','W','L']
];
const land = (_x, _y, cell) => cell === 'L';
const water = (_x, _y, cell) => cell === 'W';

assert.equal(floodFill(grid, {x:0,y:0}, (_x,_y,c) => c === 'L').cells.length, 5);
assert.equal(connectedComponents(grid, (_x,_y,c) => c === 'L').length, 2);
assert.equal(connectedComponents(grid, (_x,_y,c) => c === 'W').length, 1);
assert.equal(auditReachability(grid, {x:0,y:0}, [{x:2,y:1,label:'far shore'}], land).ok, false);
assert.equal(auditReachability(grid, {x:0,y:0}, [{x:2,y:1,label:'water cell'}], water).ok, false);

const mixed = auditLandAndWater(grid, {
  landStart: {x:0,y:0}, landTargets: [{x:0,y:2,label:'south village'}], isLand: land,
  waterStart: {x:2,y:0}, waterTargets: [{x:2,y:3,label:'harbour channel'}], isWater: water
});
assert.equal(mixed.ok, true);
assert.equal(auditReachability(grid, {x:0,y:0}, [{x:3,y:3,label:'isolated land'}], land).ok, false);
// Eight-way reachability must match A* and reject diagonal corner cutting.
const cornerTrap = [
  ['L','X'],
  ['X','L']
];
assert.equal(floodFill(cornerTrap, {x:0,y:0}, (_x,_y,c)=>c==='L', 8).cells.length, 1,
  'Diagonal neighbours separated by two blocked orthogonal cells are not reachable');
const openDiagonal = [
  ['L','L'],
  ['X','L']
];
assert.equal(floodFill(openDiagonal, {x:0,y:0}, (_x,_y,c)=>c==='L', 8).cells.length, 3,
  'A diagonal remains reachable when at least one orthogonal side is passable');
assert.deepEqual(floodFill([], {x:0,y:0}, land).cells, []);
console.log('map-connectivity: all connectivity assertions passed');
