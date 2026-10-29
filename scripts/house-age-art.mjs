// Preserve optional original house-age artwork through every authoring rebuild.
import {existsSync,readFileSync} from 'node:fs';
const path=new URL('../assets/house-age-manifest.json',import.meta.url);
export function applyHouseAgeArt(pack){
 if(!existsSync(path))return pack;
 const extra=JSON.parse(readFileSync(path));
 pack.atlases=pack.atlases.filter(a=>!a.meta.houseAges);
 pack.atlases.push(...extra.atlases);pack.version='painted-raster-v18-house-ages';
 return pack;
}
