import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const persistence = fs.readFileSync(new URL('../persistence.js', import.meta.url), 'utf8');
const save = fs.readFileSync(new URL('../js/save.js', import.meta.url), 'utf8');
const engine = fs.readFileSync(new URL('../engine.js', import.meta.url), 'utf8');

test('deleting a manual save preserves the autosave and other slots', async () => {
 const data = new Map([['ck_save','old'],['ck_save2','keep'],['ck_autosave','recovery']]);
 const deleted = [];
 const localStorage = {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const context = {localStorage,window:{CK_STORAGE:{deleteSave:k=>{deleted.push(k);return Promise.resolve(true)}}},skey:n=>n?'ck_save'+(n+1):'ck_save',hs:1,note:()=>{}};
 const start = save.indexOf('function deleteSavedGame(');
 const end = save.indexOf('function validSavedProduction(',start);
 const del = vm.runInNewContext(save.slice(start,end)+';deleteSavedGame',context);
 assert.equal(del(0),true);
 assert.equal(data.has('ck_save'),false);
 assert.equal(data.get('ck_save2'),'keep');
 assert.equal(data.get('ck_autosave'),'recovery');
 assert.deepEqual(deleted,['ck_save']);
 assert.equal(del('auto'),true);
 assert.equal(data.has('ck_autosave'),false);
 assert.equal(data.get('ck_save2'),'keep');
 assert.deepEqual(deleted,['ck_save','ck_autosave']);
 assert.equal(del(9),false);
});

test('deletion markers survive unavailable IndexedDB and clear on new saves', async () => {
 const data = new Map();
 const localStorage = {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
 const window = {localStorage,indexedDB:null};
 vm.runInNewContext(persistence,{window,Promise,Set});
 assert.equal(await window.CK_STORAGE.deleteSave('ck_save'),false);
 assert.equal(data.get('ck_deleted_ck_save'),'1');
 window.CK_STORAGE.clearDeletionMarker('ck_save');
 assert.equal(data.has('ck_deleted_ck_save'),false);
 assert.equal(await window.CK_STORAGE.deleteSave('unexpected-key'),false);
});

test('autosave always uses its own rolling key, not the selected manual slot', () => {
 assert.match(save,/const key=auto\?'ck_autosave':skey\(slot\)/);
 assert.match(engine,/saveG\(true\)/);
 assert.match(engine,/lastAutoSaveAt=-60000;newGame\(\)/);
 assert.match(engine,/overwriteSlotTarget!==null/);
});
