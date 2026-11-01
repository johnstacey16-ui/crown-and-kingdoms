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

test('active working documents keep one compact status and preserve the 48-task roadmap',()=>{
 const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const agents=read('AGENTS.md'),roadmap=read('ROADMAP.md');
 const inventory=read('docs/REFACTORING_INVENTORY.md');
 assert.ok(agents.length<16000,'AGENTS is operating instructions, not a duplicated release journal');
 assert.ok(roadmap.length<40000,'ROADMAP keeps the active task register, not repeated dated logs');
 assert.ok(inventory.length<20000,'The refactoring inventory must stay a concise current register');
 const ids=[...roadmap.matchAll(/^\\|\\s*(AUD-\\d{3})\\s*\\|/gm)].map(m=>m[1]);
 assert.deepEqual(ids,Array.from({length:48},(_,i)=>'AUD-'+String(i+1).padStart(3,'0')),
  'Historical prose may be consolidated, but none of the audited 48 tasks may disappear or change order');
 for(const text of [agents,roadmap,inventory])
  assert.match(text,/ef2a6356692626bd60900a60c9d3e42db94da694/,
   'Preserve a navigable revision containing the unabridged historical checkpoint log');
});
