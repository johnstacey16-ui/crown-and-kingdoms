# Living build journal — reusable lessons

After every substantial, verified feature, graphics, AI, networking or acceptance milestone, add one short entry. **This is a method/evidence log, not a second roadmap.**

## Template

```markdown
### YYYY-MM-DD — feature/system
**Tested SHA:** commit and CI link (or unverified).
**Change:** gameplay, graphics, source owners and why.
**Tests:** exact commands, pass/fail, unrun full/AI/campaign gates.
**Gameplay / graphics / network / hardware / production:** separate statuses.
**Portable lesson:** what a new game developer should repeat or avoid.
**Missing/next:** concrete visual/feature/device gate.
```

## Historical starting entries

### 2026-10-21–22 — Original sprites and first motion
**Evidence:** `docs/PAINTED_ART.md`, `docs/PAINTED_MOTION.md`. Original art perspective/scale, named sprites and first animation sequences established the visual language; full facing/Elite/death coverage remained incomplete. **Lesson:** plan art as game systems arrive.

### 2026-10-29 — Offline artwork integrity
**Evidence:** `docs/VERIFIED_ART_CACHE.md`. Revision hashes and verified service-worker upgrade kept prior valid offline art after failed installs. **Lesson:** cache integrity, fallback and worker tests are part of graphics delivery.

### 2026-11-02–09 — Crash, AI, campaign, CI and release discipline
**Evidence:** PRs #61–#64, `ROADMAP.md`, [9 November scripted matrix](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/42542326209), `docs/VERCEL_RELEASES.md`. **Lesson:** reproducible failures become regressions, expensive tests are purposeful and main ≠ live production.

### 2026-11-10 — Shared Elite upgrades
**Revisions:** [Goth `db26b474`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/db26b474e3f950c8b613290f51e9b42ef4909f71), [Briton/Mongol `515403cf`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/515403cf77e82c508f10fb77dbb6b39549583e24), [follow-up `629dd437`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/629dd437d9e6f056ffd2d1447506f975e84e8b1c).
**Changes:** shared legal research, Elite attack/health/armor/range/counters, AI, names, host options and current-build saves. Initial isolated-test dependency failure fixed on last commit.
**Tests:** [5/5 quick, 1,339/1,339 focused](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/42883636464) on `629dd437`; full/AI/campaign/physical Xbox unverified at this SHA.
**Status:** gameplay focused VERIFIED; distinct Elite sprites PARTIAL; WAN/physical Xbox UNVERIFIED; not intentionally released.
**Lesson:** generalize repeated gameplay rules, test isolated consumers, track original artwork acceptance separately.

### 2026-11-10 — Professional acceptance and visible Elite research (post-commit check)
**Sources:** `js/render-troops.js` now draws optional original Elite equipment cues for Huskarl/Longbowman/Mangudai, and `js/assets.js` constructs atlas descriptors without two object spreads. This is a low-allocation code change **without measured Xbox FPS improvement**; the cues are not dedicated painted Elite sprite sheets.
**Process:** [professional quality gates](../../../../docs/PROFESSIONAL_QUALITY.md), source-only readiness report, private security disclosure and contribution guidance formalise human, Xbox, balance and network acceptance without inventing pass results.
**Lesson:** treat a sprite/upgrade as complete only after real in-game rendering and hardware review; report script-counts and actual user/device quality separately. GitHub CI and physical measurements must be pinned to the resulting SHA; update this entry's evidence when the run finishes.

### 2026-11-10 — Accessibility option, peer review actions and verified CI
**Code:** [Elite render path + descriptor simplification `442295f`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/442295f210ec1a7fbaeb64c6cc2e21f763e23a9a), [source-based quality gates `8d988ac`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/8d988ac9324b2c334a2f2f2a0711b82d9c8c9e7b), [reduced effects `75c31e6`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/75c31e68b457904d80ff155962ec61c198405674), [fix `d223308`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/d2233085ec3e27a667dd50009120c6fd8ac843f6).
**Verified:** [5/5 quick and 1,348/1,348 focused](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/42896413631) at `d223308`; not full standalone, scripted campaigns, physical Xbox, human balance or actual WAN acceptance.
**Player impact:** toggle in Options/Pause saves a local choice, filters dust/smoke/puff emission and rendering, preserves combat sparks, projectiles, world resources and AI/saved match state. Dedicated Elite sprite sheets remain **open**; existing research accent overlays are interim.
**Tracking:** [Elite sprite art #97](https://github.com/johnstacey16-ui/crown-and-kingdoms/issues/97), [human campaign/balance #98](https://github.com/johnstacey16-ui/crown-and-kingdoms/issues/98), [Xbox accessibility #99](https://github.com/johnstacey16-ui/crown-and-kingdoms/issues/99), [WAN reconnect #100](https://github.com/johnstacey16-ui/crown-and-kingdoms/issues/100), [licensing #101](https://github.com/johnstacey16-ui/crown-and-kingdoms/issues/101), [maintainability #102](https://github.com/johnstacey16-ui/crown-and-kingdoms/issues/102) and [Vercel quotas #103](https://github.com/johnstacey16-ui/crown-and-kingdoms/issues/103). Historical Xbox/campaign issues #57/#93/#96 now distinguish older evidence from the latest tests.
**Reusable lesson:** make accessibility a local presentation-only preference, measure performance rather than claiming a win, and keep each quality gate tied to real evidence and a release revision.

### 2026-11-10 — Frankish Elite and repeatable original-art handoff
**Revision:** [`0b186c4`](https://github.com/johnstacey16-ui/crown-and-kingdoms/commit/0b186c4ddd758a05f2ccd2f4d6a21ba49b9b1ac4) with [5/5 quick and 1,351/1,351 focused tests](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/42902937483).
**Changes:** Frankish Bearded Axes +1 unit range; Elite Throwing Axeman +10 health, +1 attack, +1 pierce armour, +2 anti-infantry; generic second-unique technology AI priority, same faction/age/cost/host/saves and temporary research-dependent equipment visual.
**Acceptance:** gameplay focused VERIFIED; dedicated painted Elite frames, full regressions/campaigns, human balance, real WAN and physical Series S UNVERIFIED. Production unchanged.
**Reusable lesson:** artwork goes from Canva concept, Adobe cleanup and Figma visual review through original aligned frames and committed atlas manifest, then browser and real Xbox verification. Use [the four-Elite art handoff](../../../../docs/ELITE_ART_PRODUCTION.md); don't call a concept image a shipped sprite.
