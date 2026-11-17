import {readFileSync} from 'node:fs';

// Cold-load browser checks must follow the actual pack as new art is added.
export const EXPECTED_ATLASES=JSON.parse(readFileSync(new URL('../../assets/atlas-manifest.json',import.meta.url),'utf8')).atlases.length;
