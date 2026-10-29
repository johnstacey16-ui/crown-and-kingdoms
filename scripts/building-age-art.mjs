// Preserve optional original age architecture through every authoring rebuild.
import {existsSync,readFileSync} from 'node:fs';
const root=new URL('../assets/',import.meta.url);
export function applyBuildingAgeArt(pack){
 for(const [name,flag,version]of [['house-age-manifest.json','houseAges','painted-raster-v18-house-ages'],['town-centre-age-manifest.json','townCentreAges','painted-raster-v19-town-centre-ages']]){
  const path=new URL(name,root);if(!existsSync(path))continue;
  const extra=JSON.parse(readFileSync(path));pack.atlases=pack.atlases.filter(a=>!a.meta[flag]);pack.atlases.push(...extra.atlases);pack.version=version;
 }
 return pack;
}
