import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {updateArtRevisions,createArtRevisions} from '../scripts/build-art-revisions.mjs';
const root=new URL('../',import.meta.url),digest=data=>createHash('sha256').update(data).digest('hex');
function fixture(t){
 const dir=mkdtempSync(join(tmpdir(),'ck-art-revisions-')),base=pathToFileURL(dir+'/');t.after(()=>rmSync(dir,{recursive:true,force:true}));mkdirSync(new URL('assets/',base));
 const paths=['./','./engine.js','./assets/atlas-manifest.json','./assets/art-revisions.json','./assets/a.webp','./assets/b.webp'];
 writeFileSync(new URL('sw.js',base),"const ART_REVISION = '"+'0'.repeat(64)+"';\nconst CACHE_NAME='ck-shell-test-'+ART_REVISION;\nconst CORE_ASSETS = "+JSON.stringify(paths)+';');
 writeFileSync(new URL('assets/atlas-manifest.json',base),JSON.stringify({terrain:{src:paths[4]},atlases:[{src:paths[5]}]}));
 writeFileSync(new URL('assets/a.webp',base),'first artwork bytes');writeFileSync(new URL('assets/b.webp',base),'second artwork bytes');writeFileSync(new URL('engine.js',base),'original code');
 return base;
}
test('offline artwork revisions cover every active image and match actual source bytes',()=>{
 const catalog=JSON.parse(readFileSync(new URL('assets/art-revisions.json',root)));
 assert.equal(catalog.version,1);assert.ok(Object.keys(catalog.files).length>=56);
 for(const [path,sha]of Object.entries(catalog.files)){assert.match(path,/\.webp$/);assert.equal(digest(readFileSync(new URL(path,root))),sha)}
 assert.doesNotThrow(()=>updateArtRevisions({check:true}));
});
test('changing image bytes at the same URL invalidates the catalogue and worker revision, while code stays network-first',t=>{
 const base=fixture(t),first=updateArtRevisions({base}),worker=readFileSync(new URL('sw.js',base),'utf8');assert.ok(worker.includes(first.revision));
 writeFileSync(new URL('engine.js',base),'fresh code');assert.equal(createArtRevisions(base).revision,first.revision);assert.doesNotThrow(()=>updateArtRevisions({base,check:true}));
 writeFileSync(new URL('assets/a.webp',base),'replacement artwork at the same URL');assert.throws(()=>updateArtRevisions({base,check:true}),/stale/);
 const next=updateArtRevisions({base});assert.notEqual(next.revision,first.revision);assert.ok(readFileSync(new URL('sw.js',base),'utf8').includes(next.revision));assert.doesNotThrow(()=>updateArtRevisions({base,check:true}));
});
test('the catalogue rejects missing offline image coverage and traversal paths',t=>{
 const base=fixture(t),path=new URL('sw.js',base),source=readFileSync(path,'utf8');
 writeFileSync(path,source.replace(',"./assets/b.webp"',''));assert.throws(()=>createArtRevisions(base),/must match/);
 writeFileSync(path,source.replace('./assets/a.webp','../a.webp'));assert.throws(()=>createArtRevisions(base),/Invalid offline artwork path/);
});

test('archived painted-art checkpoint links are redirected and original authoring notes remain available',()=>{
 const retired={
  'PAINTED_INFANTRY.md':'PAINTED_ART.md',
  'PAINTED_RAIDERS.md':'PAINTED_ART.md',
  'PAINTED_RANGED.md':'PAINTED_ART.md',
  'PAINTED_RANGED_EXPANSION.md':'PAINTED_ART.md',
  'PAINTED_SUPPORT.md':'PAINTED_ART.md',
  'PAINTED_WARRIORS.md':'PAINTED_ART.md',
  'PAINTED_SECONDARY_MOTION.md':'PAINTED_MOTION.md',
  'PAINTED_HORSE_MOTION.md':'PAINTED_MOTION.md',
  'PAINTED_LIGHT_MISSILE_MOTION.md':'PAINTED_MOTION.md',
  'PAINTED_CIVIC_NAVAL_MOTION.md':'PAINTED_MOTION.md',
  'PAINTED_RANGED_AND_CAMEL_MOTION.md':'PAINTED_MOTION.md',
  'PAINTED_SIEGE_ELEPHANT_MOTION.md':'PAINTED_MOTION.md',
  'PAINTED_WILDLIFE_MOTION.md':'PAINTED_MOTION.md',
  'PAINTED_FISHTRAPS.md':'PAINTED_ENVIRONMENT.md',
  'PAINTED_HOUSE_AGES.md':'BUILDING_AGE_DETAILS.md',
  'PAINTED_TOWN_CENTRE_AGES.md':'BUILDING_AGE_DETAILS.md',
 };
 const folders=['./','./docs/','./docs/audits/','./server/'];
 const docs=folders.flatMap(dir=>readdirSync(new URL(dir,root))
  .filter(name=>name.endsWith('.md'))
  .map(name=>({path:dir+name,source:readFileSync(new URL(dir+name,root),'utf8')})));
 for(const [oldFile,newFile] of Object.entries(retired)){
  const slug=oldFile.replace('.md','').toLowerCase().replace(/_/g,'-');
  const source=readFileSync(new URL('docs/'+newFile,root),'utf8');
  assert.ok(source.includes('## Archived checkpoint: '+slug),
   'original art authoring and historical verification notes should be retained: '+oldFile);
  const broken=new RegExp('\\]\\([^\\n)]*'+oldFile.replace(/\\./g,'\\.')+'(?=[)#])');
  for(const file of docs)assert.doesNotMatch(file.source,broken,
   file.path+' still links to retired file '+oldFile);
 }
});
