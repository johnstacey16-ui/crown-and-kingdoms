import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reportRepositoryInventory} from '../scripts/report-repository-inventory.mjs';
import {checkPlan} from '../scripts/run-checks.mjs';

test('live repository counts come from files and the canonical browser script graph',()=>{
 const inventory=reportRepositoryInventory();
 assert.ok(inventory.standaloneRegressionFiles>200);
 assert.ok(inventory.productionScripts>30);
 assert.equal(inventory.headlessScripts,inventory.coreScripts-2,
  'headless source omits only browser UI and painted atlas loader');
 assert.equal(inventory.focusedFileCount,checkPlan('focused')[0].args.length);
 assert.ok(inventory.focusedFileCount<inventory.standaloneRegressionFiles,
  'focused checks cannot be mistaken for full standalone acceptance');
});

test('README current-tree inventory cannot drift from actual file counts',()=>{
 const inventory=reportRepositoryInventory();
 const readme=readFileSync(new URL('../README.md',import.meta.url),'utf8');
 const expected='**Current tree inventory:** '+inventory.standaloneRegressionFiles+
  ' standalone regression files, '+inventory.productionScripts+
  ' production browser scripts, '+inventory.coreScripts+
  ' core scripts, '+inventory.headlessScripts+
  ' headless scripts and '+inventory.markdownFiles+' Markdown documents.';
 assert.ok(readme.includes(expected),'Update the README current-tree inventory after adding/removing files: '+expected);
});

test('focused hosted selection runs real network authenticity and replay fixtures',()=>{
 const focused=new Set(checkPlan('focused')[0].args);
 for(const path of ['tests/network-sync-protocol.test.mjs',
  'tests/network-frame-replay.test.mjs','tests/network-command-uplink.test.mjs',
  'tests/network-sync-authority.test.mjs']){
  assert.ok(focused.has(path),'missing authenticated network regression in fast CI: '+path);
 }
});
