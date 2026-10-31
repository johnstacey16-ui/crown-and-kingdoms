/* Crown & Kingdoms — military armour-class and research damage bonuses.
 * Loaded after configuration/state and before the live simulation. The
 * original declarations remain global to preserve classic script semantics.
 */

// The spear-line's cavalry/camel/elephant bonuses increase at each upgrade.
// These are armor-class approximations for the currently modelled unit kinds.
// Other class interactions (ships, shock infantry and regional bonuses) stay
// tracked separately in the AoE2 DE parity roadmap.
const SPEAR_CAVALRY=new Set(['scout','knight','cata','boyar','tarkan','huszar','mgd','conq','wagon']);
const SPEAR_CAMELS=new Set(['camel','mamel']);
const SPEAR_ELEPHANTS=new Set(['ele','eled']);
function spearLineBonus(a,t){
 const key=t.k,alias=U[key]?.lk,tech=S.tech[a.t]||{};
 const tier=tech.halb?2:tech.pike?1:0;
 if(SPEAR_ELEPHANTS.has(key)||SPEAR_ELEPHANTS.has(alias))return [15,25,28][tier];
 if(SPEAR_CAMELS.has(key)||SPEAR_CAMELS.has(alias))return [12,18,26][tier];
 if(SPEAR_CAVALRY.has(key)||SPEAR_CAVALRY.has(alias))return [15,22,32][tier];
 return U.spear.bn?.[key]||U.spear.bn?.[alias]||0;
}
// Counter bonuses are attached to AoE2 armour classes, not broadly to
// villagers, siege and all ranged units. The compact roster still needs a
// complete class table (especially regional unique units) in a later audit.
const SKIRM_ARCHER_KINDS=new Set(['arc','xbow','lbow','skirm','genoa','plumed','chuko']);
const SKIRM_CAV_ARCHER_KINDS=new Set(['mgd','eled','wagon']);
// Pinned Camel and Heavy Camel combat bonuses share the existing cavalry classes.
const CAMEL_CAVALRY=new Set(['scout','knight','cata','boyar','tarkan','huszar','mgd','conq','wagon','ele','eled']);
const CAMEL_CLASS=new Set(['camel','mamel']);
function camelLineBonus(a,t){
 const key=t.k,alias=U[key]?.lk,heavy=!!S.tech[a.t]?.hcamel;
 if(CAMEL_CLASS.has(key)||CAMEL_CLASS.has(alias))return heavy?9:5;
 if(CAMEL_CAVALRY.has(key)||CAMEL_CAVALRY.has(alias))return heavy?18:9;
 return U.camel.bn?.[key]||U.camel.bn?.[alias]||0;
}
function scoutLineBonus(a,t){
 return t.k==='mon'?(S.tech[a.t]?.lcav?10:6):0;
}
function skirmisherBonus(a,t){
 const tech=S.tech[a.t]||{},elite=!!tech.elsk,k=t.k;
 if(k==='spear')return elite?4:3;
 if(SKIRM_ARCHER_KINDS.has(k))return elite?4:3;
 if(SKIRM_CAV_ARCHER_KINDS.has(k))return elite?2:0;
 if(k==='mamel')return 2;
 return 0;
}
// Source-backed Blacksmith melee bonuses: Forging +1, Iron Casting +1,
// Blast Furnace +2. Saved games from the current rules keep these flags.
function meleeResearchAttackBonus(tech){
 return (tech.forging?1:0)+(tech.ironCasting?1:0)+(tech.blastFurnace?2:0);
}
