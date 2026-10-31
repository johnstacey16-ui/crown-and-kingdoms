/* Verify active browser/offline dependencies before deleting or moving files.
 * Inventory is not proof that an unreferenced file is unused. */
import {existsSync,readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export function inspectRuntimeGraph({html,serviceWorker,manifest,exists}){
 const errors=[],references=new Set();
 const required=['./','./index.html','./styles.css',
  './assets/atlas-manifest.json','./assets/art-revisions.json'];
 const scripts=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(m=>m[1]);
 const core=serviceWorker.match(/const CORE_ASSETS\s*=\s*\[([\s\S]*?)\];/);
 const cached=core?[...core[1].matchAll(/'(\.\/[^']*)'/g)].map(m=>m[1]):[];
 const images=[manifest?.terrain?.src,...(Array.isArray(manifest?.atlases)?manifest.atlases.map(a=>a?.src):[])];
 const safe=p=>typeof p==='string'&&/^\.\/[A-Za-z0-9._/-]*$/.test(p)&&!p.split('/').includes('..');
 if(!scripts.length)errors.push('No browser script references found');
 if(!core||!cached.length)errors.push('Missing or empty CORE_ASSETS list');
 if(!Array.isArray(manifest?.atlases)||!images.length)errors.push('Invalid atlas manifest');
 const duplicates=xs=>xs.filter((x,i)=>xs.indexOf(x)!==i);
 for(const p of duplicates(scripts))errors.push('Duplicate browser script: '+p);
 for(const p of duplicates(cached))errors.push('Duplicate cached path: '+p);
 const offline=new Set(cached);
 for(const p of [...required,...scripts,...images]){
  if(!safe(p)){errors.push('Unsafe/invalid runtime path: '+p);continue}
  references.add(p);
  if(!offline.has(p))errors.push('Runtime path absent from offline cache: '+p);
 }
 for(const p of cached){
  if(!safe(p)){errors.push('Unsafe cached path: '+p);continue}
  references.add(p);
 }
 for(const p of references)if(!exists(p))errors.push('Missing runtime file or directory: '+p);
 return {scripts,cached,images,errors};
}

function main(){
 const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
 const load=p=>readFileSync(resolve(root,p),'utf8');
 const result=inspectRuntimeGraph({
  html:load('index.html'),
  serviceWorker:load('sw.js'),
  manifest:JSON.parse(load('assets/atlas-manifest.json')),
  exists:p=>existsSync(resolve(root,p))
 });
 for(const message of result.errors)console.error('Runtime graph:',message);
 if(result.errors.length){process.exitCode=1;return}
 console.log('Runtime graph valid:',result.scripts.length,'browser scripts,',
  result.cached.length,'offline entries,',result.images.length,'manifest images');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
