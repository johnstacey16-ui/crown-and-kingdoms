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
