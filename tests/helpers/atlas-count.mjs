import {readFileSync} from 'node:fs';

// Cold-load browser checks must follow the actual pack as new art is added.
const atlases=JSON.parse(readFileSync(new URL('../../assets/atlas-manifest.json',import.meta.url),'utf8')).atlases;
export const EXPECTED_ATLASES=atlases.length;
// The partial-image fixture aborts these URL families, not every meta.motion
// atlas (wildlife motion still loads). New static building art must still load.
export const EXPECTED_STATIC_ATLASES=atlases.filter(a=>!/^\.\/assets\/painted-(motion|elite)-/.test(a.src)).length;
