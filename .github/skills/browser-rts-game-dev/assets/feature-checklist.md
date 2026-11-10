# Copyable RTS feature acceptance checklist

**Feature:** [name] · **Commit:** [SHA] · **Date:** [YYYY-MM-DD]

## Real gameplay
- [ ] Same legality/cost across controller/UI, AI, production and host
- [ ] Correct age/civ/owner/building/target and finite resource/time costs
- [ ] Wrong team, no budget, duplicate, stale and malformed orders rejected
- [ ] Correct numeric economy/combat/counters for existing and new units
- [ ] Current-build save/reload, no repeated buffs or corrupt state

## Original art and Xbox
- [ ] Original sprite sources/rights and readable base appearance
- [ ] Distinct Elite/age appearance if gameplay changes visual identity
- [ ] Idle, walk, attack, work, damage, death and facings inventoried
- [ ] Good anchors, team tint, fog, zoom and army readability
- [ ] Atlas manifest, procedural fallback, art hash and offline worker verified
- [ ] Chromium and real target-device FPS/focus checked or explicitly unverified

## Evidence
- [ ] Targeted + quick/focused tests linked to same SHA
- [ ] Full/AI/campaign/browser/network/physical hardware as risk requires
- [ ] Independent gameplay / graphics / network / hardware status
- [ ] Production SHA or explicitly not deployed
- [ ] Dated [journal entry](../references/journal.md) with transferable lesson and next gate
