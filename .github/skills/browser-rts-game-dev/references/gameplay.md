# Game architecture and end-to-end feature workflow

This project's browser scripts are classic globals loaded in `index.html` order, not ES modules. Use the same design contracts even if another game uses TypeScript or a different engine.

## Existing live owners

| Responsibility | Source |
| --- | --- |
| Boot and source graph | `index.html`, `engine.js`, `scripts/runtime-sources.mjs` |
| Unit, building, tech and age data | `js/config.js` (`U`, `B`, `TE`, `AG`) |
| Civilization identities, unique tech/Elite | `js/civilizations.js` (`CIV`) |
| Shared training and research entitlement | `js/kingdom.js` (`trOf` / `rsOf`) |
| Research, queues and application | `js/simulation-research.js`, `js/simulation-production-queues.js`, `js/simulation-building-updates.js` |
| Damage, pathing, economy | `js/simulation-combat-bonuses.js`, `js/simulation-unit-behaviour.js`, `js/simulation-logistics.js` |
| AI research and army/economy decisions | `js/ai-policy.js`, `js/ai-economy.js`, `js/ai-offence.js`, `js/ai-maritime.js`, `js/ai.js` |
| Gamepad/input and HUD | `js/input.js`, `js/input-selection.js`, `js/ui-commands.js`, `js/state.js` |
| Rendering and sprites | `js/render-*.js`, `js/assets.js` |
| Save state | `js/save.js`, `persistence.js` |
| Authenticated host commands | `js/network-commands.js`, `js/network-sync.js` |
| Catalog validation | `data/civilizations.json`, `scripts/check-civilization-catalogue.mjs` |

`data/civilizations.json` is currently a **validation inventory**, not the live rules engine. Stable civ IDs matter to saves/network; don't reorder them without a deliberate migration.

## New-feature algorithm

1. **Player contract:** action, controls, allowed civ/age/building/target, resource budget, duration, concrete effect, feedback and win/lose implications.
2. **One source:** search existing keys and legality/cost selectors before adding anything. The same options must govern player UI, AI and authoritative host.
3. **Safe deterministic simulation:** validate ownership, state, finite ranges and queues; keep fixed timestep and seeded randomness; do not trust arbitrary browser/client values.
4. **Complete effects:** existing and future units, combat classes, armour, attack, range, economy and real animation state. Changing text alone isn't a game feature.
5. **Persist/replicate:** current-build save/load, legal host packet sender/team/sequence/vision and bounded state.
6. **Pair original visuals:** correct base and Elite art, poses, atlas/worker updates and fallback as described in [graphics](graphics.md); mark missing states partial.
7. **Test positives and negatives:** no resources, wrong age/civ, enemy building, duplicate tech, real damage math, save/reload without doubling bonuses, AI and host options.
8. **Verify and record:** targeted + quick/focused, then risk-dependent AI/campaign/Chromium/Xbox. Commit on tested SHA and write [journal entry](journal.md).

## Worked example: data-driven Elite tech

Owning `CIV` entry optionally defines `elite` with unique key, name, resource `cost`, research time `t`, Imperial `age:3` and effects (`hpb`, `atkb`, `armor`, `bonus`, `range`). `TE` registration allows `rsOf` to offer the research only to that civ's Castle; human, AI and host use the same selector. Research checks affordability/queue; `upB` applies bonus HP to existing units and stores technology bonuses for new units. `unitName` and combat calculate effects per team without altering global unit defs or opponents. AI research priority considers real unit numbers.

Inspect `tests/castle-civilization-production.test.mjs`, `tests/civilization-catalogue-validation.test.mjs` and `tests/technology-tree-civilization-eligibility.test.mjs`. Validate a different civ **cannot** purchase or lose resources for someone else's Elite. Recheck current-build reload and target-class damage.

**HP research application:** `hpbF` changes the bonus ledger; it does not grant HP to existing units. Use a unique technology's shared `hpb`/`atkb` data when its effect is an additive unit-stat upgrade, so the production research-completion owner updates both current troops and future spawns. Derive percentage-of-base bonuses from canonical `U` stats. Validate data-only first technologies as real effects; reject empty, unknown, non-finite and negative maps. Test prior bonuses, full/wounded/dead/enemy troops, completion timing, repeat rejection, authorized host orders and current-build reload. Keep version-specific cost, age, armour and balance reconciliation separate from an HP-application repair.

**Weaker extra projectiles:** put the shot in the normal launch/collision path with a bounded secondary marker, rather than raising the primary attack. Preserve that marker in both save serialization and peer checksums; validate its type, attacker kind, source position, civilization/research and detached attacker reference on load. Keep its damage separate from primary upgrades/counters, preserve fixed-aim misses and normal hostility/death handling, and give it visible separation using existing original art. Test authorized host orders for both players, future units after reload, malformed saves and both rendering views. Exact source-game accuracy/costs remain a separate version-reconciliation gate.

**Unique range data and reference changes:** keep per-unit `rangeBonus` maps with each civilization's technology and use the shared, read-only `uniqueTechnologyRangeBonus(kind,team,world)` in combat. Validate bounded finite bonuses and known unit keys in both unique-tech slots, including data-only definitions. Require numeric civilization IDs and read research from the supplied world. Pin publisher reference dates/builds when reconciling costs and eligible units; a previously tested exclusion can become obsolete in a later patch. Test stand-ground firing beyond the old range, future units, wrong age/price/civ, host frames and reload, while recording unresolved research-time/full-version parity separately.

**Building-volley upgrades:** add full-strength extra arrows through the existing building attacker/projectile path, retaining ordinary collision, damage, visibility, saves and checksums. Fixed firing offsets can separate their visuals without additional RNG or a new projectile flag. Stack only the documented additional count with the game's existing base/garrison volley; do not silently claim baseline source-game firing parity. Test completion timing, cooldown, garrison stacking, future buildings after reload, hostile target changes, building/civ exclusion and authorized host research. Let AI value completed defensive buildings instead of an unrelated unique-unit army.

**Conditional incoming damage:** keep per-unit defensive amounts in unique-tech data and reuse the supplied-world reader rather than adding armour or attack callbacks. Classify mounted sources from canonical unit definitions/class membership, including detached projectile snapshots; do not require the shooter to remain alive. Apply flat reduction after ordinary attack/counter/armour calculation, before cover/elevation, with the ordinary minimum damage, while preserving unrelated fractional secondary hits. Validate bounded known-unit maps, test protected/unprotected targets and melee/ranged sources, actual airborne reloads, future units, host payment and AI beneficiary/threat scoring. Pin the reference build and keep special-interaction parity separate.

## Other game systems

**Economy:** gather, path/deposit, build, train, market, repair and trade share an authoritative resource ledger; failed orders cannot produce freebies. **Combat/pathing:** deterministic projectiles, minimum range, class counters, siege, splash, visibility, water navigation and formations. **AI:** decide from real known enemy/economy state and test seeds. **Campaign:** scripted victory/defeat and optional goals must be executable in isolated scenarios, not mere narration. **Multiplayer:** sender binding, team, ownership, visibility, resources, coordinate bounds and sequence are host validated; browser host is *not* trusted anti-cheat. **Save:** never serialize transient renderer caches; reject malformed current-build state.
