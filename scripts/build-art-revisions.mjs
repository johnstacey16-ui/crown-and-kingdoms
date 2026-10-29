// Native Node tool: bind offline artwork reuse to actual source bytes.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import vm from 'node:vm';
const root=new URL('../',import.meta.url),hash=data=>createHash('sha256').update(data).digest('hex');
export function coreAssets(source){
 const match=source.match(/const CORE_ASSETS\s*=\s*(\[[\s\S]*?\]);/);if(!match)throw Error('Missing offline core asset list');
 const paths=vm.runInNewContext('('+match[1]+')',{}, {timeout:100});
 if(!Array.isArray(paths)||paths.some(p=>typeof p!=='string'))throw Error('Invalid offline core asset list');
 return Array.from(paths);
}
export function createArtRevisions(base=root){
 const source=readFileSync(new URL('sw.js',base),'utf8'),paths=coreAssets(source).filter(p=>p.endsWith('.webp')).sort();
 if(new Set(paths).size!==paths.length)throw Error('Duplicate offline artwork');
 for(const p of paths)if(!/^\.\/assets\/[a-z0-9-]+\.webp$/.test(p))throw Error('Invalid offline artwork path '+p);
 const pack=JSON.parse(readFileSync(new URL('assets/atlas-manifest.json',base))),active=new Set([pack.terrain.src,...pack.atlases.map(a=>a.src)]);
 if(active.size!==paths.length||paths.some(p=>!active.has(p)))throw Error('Offline artwork list must match the active atlas images and terrain');
 const files=Object.fromEntries(paths.map(p=>[p,hash(readFileSync(new URL(p,base)))]));
 return {version:1,revision:hash(JSON.stringify({version:1,files})),files};
}
export function updateArtRevisions({check=false,base=root}={}){
 const catalog=createArtRevisions(base),path=new URL('assets/art-revisions.json',base),worker=new URL('sw.js',base),source=readFileSync(worker,'utf8');
 const match=source.match(/const ART_REVISION = '([a-f0-9]{64})';/);if(!match)throw Error('Missing worker artwork revision');
 const text=JSON.stringify(catalog,null,2)+'\n';
 if(check){if(!existsSync(path)||readFileSync(path,'utf8')!==text||match[1]!==catalog.revision)throw Error('Artwork revisions are stale; run node scripts/build-art-revisions.mjs');}
 else{
  if(!existsSync(path)||readFileSync(path,'utf8')!==text)writeFileSync(path,text);
  if(match[1]!==catalog.revision)writeFileSync(worker,source.replace(/(const ART_REVISION = ')[a-f0-9]{64}(';)/,(_,a,b)=>a+catalog.revision+b));
 }
 return catalog;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const catalog=updateArtRevisions({check:process.argv.includes('--check')});console.log('Verified artwork revisions: '+Object.keys(catalog.files).length+' WebPs.');
}
