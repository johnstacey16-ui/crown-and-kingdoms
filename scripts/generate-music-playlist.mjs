import {readdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../assets/music/',import.meta.url));
async function scan(dir,prefix=''){
 const entries=await readdir(dir,{withFileTypes:true});
 const tracks=[];
 for(const e of entries.sort((a,b)=>a.name.localeCompare(b.name,'en',{numeric:true}))){
  if(e.name.startsWith('.'))continue;
  const relative=prefix+e.name;
  if(e.isDirectory())tracks.push(...await scan(join(dir,e.name),relative+'/'));
  else if(e.isFile()&&/\.(mp3|ogg|wav|m4a|aac|flac|opus)$/i.test(e.name))
   tracks.push(relative.split('/').map(encodeURIComponent).join('/'));
 }
 return tracks;
}
const tracks=await scan(root);
await writeFile(join(root,'playlist.json'),JSON.stringify({tracks},null,2)+'\n');
console.log('Soundtrack tracks:',tracks.length);
