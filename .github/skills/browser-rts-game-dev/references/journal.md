# Living build journal — portable RTS development lessons

This is a **small, reusable engineering-method journal**, not a second roadmap, acceptance ledger or transcript archive. Current tasks and pass/fail status are in [ROADMAP.md](../../../../ROADMAP.md). The [complete original 2026-10-21 through 2026-11-14 journal](https://github.com/johnstacey16-ui/crown-and-kingdoms/blob/763caa425a2684f4d79de1b2c21f14639aefb6d8/.github/skills/browser-rts-game-dev/references/journal.md) remains recoverable in Git history; [docs/HISTORY.md](../../../../docs/HISTORY.md) indexes it. Consult the archive only to investigate the original engineering method or exact earlier SHA.

## Lessons retained

- **Canonical gameplay ownership:** describe civilization, unit, research, building, AI and command rules once; ensure authoritative host orders, controller menus, technology tree, production AI and save/load consult that same rule.
- **Cross-system feature slices:** make new civilizations or bonuses fully playable (UI, actual gameplay effects, AI, command validation, saves, tests and original/fallback visuals) before marking any content category complete.
- **Validation:** test on the exact code revision; quick/focused checks do not substitute for full regressions, seeded skirmishes, isolated 19-campaign simulations, Chromium or real Xbox Series S Edge.
- **Visual work:** use original sprites, real play-scale screenshots, explicit atlas/manifest and offline-cache tests; procedural art is fallback, not proof of full direction/work/death or Elite coverage.
- **Controller safety:** keep official default mappings consistent across UI, input, overlays, focus and automated software checks. Only physical hardware establishes Xbox responsiveness and FPS.
- **Security and saves:** validate all untrusted multiplayer commands at the authoritative receiver, preserve current-build save/load and deterministic game state, and avoid treating browser-host validation as full trusted-server security.
- **Free-only releases:** develop on `development`; run appropriate acceptance checks and use the explicit `[deploy]` gate before production `main`; never infer live production from a green commit or preview.

## Entry template for future substantial, verified method improvements

### YYYY-MM-DD — method or reusable lesson
- **Commit and test evidence:** SHA, actual command(s)/CI URL and result; state what was not checked.
- **What changed and what other developers should reuse:** one or two concise sentences describing the working approach, not a detailed feature status log.
- **Remaining limitations:** browser / hardware / network / art / release gates, where relevant.

Only add an entry when the **method or reusable technique changes**. Ordinary feature status belongs in the roadmap, commit and associated verification artifact. Keep the journal short; older detail is available from the frozen snapshot and Git log.

### 2026-11-17 — Graphics integration candidate
Local graphics history through `15257ee` records deferred backing retirement, exact-colour failures and explicit offline retry without changing simulation or lowering quality. The current graphics report retains detailed evidence; use Git history for the prior journal rather than restoring duplicated historical entries here. Integration with current development is being validated before the requested release; no production acceptance is implied.

### 2026-11-17 — Browser reflection is a separate sampling gate
Hosted Chromium on `82dbdfcf` found a 255-channel reflection delta while identity copying and native tint comparisons were exact. Restore bounded baked-facing sources when reflected transforms fail the original pixel contract; retain strict browser assertions and account for the extra crop work. The correction passed 71 targeted tests and five quick gates locally; hosted acceptance is pending and no console performance claim follows.

### 2026-11-17 — Dedicated Elite atlas integration
Following accepted production `6bdcba72`, add separate original Elite sheets rather than repainting a base unit in place. Carry researched appearance from the supplied multiplayer world, select art through a shared presentation helper, retain fallback and prepare the same variant in bounded tint warm-up. Keep base packers from dropping variant manifests. Reject clipped cell bounds during packing and retain prompts/provenance. Local checks passed five quick gates, 88 targeted tests and 1,741 focused assertions. Revision `94170754` passed [Chromium and Xbox software checks](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/44141722702), including 612 exact reflection comparisons, all four palettes and solo/map draw checks. Review the real contact sheet, and extend simulated missing-image routes when adding new filename families. Independent directions/deaths and physical Xbox acceptance remain separate.

### 2026-11-17 — Derive browser readiness from the art pack
Hosted `c96dfdc8` passed exact 624-way reflection sampling but secondary campaign scenes timed out on stale 61-atlas waits. Read the canonical manifest count once in a shared Node helper and pass it into each browser readiness predicate; never replace exact completion with a weaker nonzero check. New regional sheets also need activity-state lookup because they lack the older static base fallback. Source checks reject opaque backgrounds before packing. Physical Xbox and full browser acceptance remain separate.

The correction and three new ranged sheets at `aa3c850b` passed [hosted validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/44167377104): quick 5/5, focused 1,743, Chromium 2/2 and Xbox software 8/8, with 660 exact reflection comparisons. The rendered sheet was inspected; this does not establish independent facings, dedicated death art or physical Xbox acceptance.

### 2026-11-17 — Extend regional art through the shared pose pipeline
Infantry candidate `2814471d` reused the existing pose timing, all-team atlas lookup and procedural fallback for Serjeant, Obuch and Legionary; no gameplay animation timers were added. [Hosted evidence](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/44171016746) passed quick 5/5, focused 1,743, Chromium 2/2 and Xbox software 8/8, with 696 exact reflections. Inspect the packed in-game-scale contact sheet as well as the generated source. Physical Xbox, independent facings and dedicated death/Elite art remain separate.

### 2026-11-17 — Validate transformed unit appearances through real gameplay
At `e6c4862d`, use actual Konnik combat death and completed Flemish Revolution to verify the replacement unit kind selects its own painted frame, including an existing villager identity. Keep this in the existing motion regression rather than testing only catalogue metadata. [Hosted acceptance](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/44173684492) passed quick 5/5, focused 1,744, Chromium 2/2 and Xbox software 8/8, with 732 exact reflections; the new rendered poses were inspected. Dedicated work/death/Elite art and physical Xbox remain separate.

### 2026-11-17 — Reject faint source backdrops before atlas packing
Leitis source inspection initially passed the foreground-alpha threshold while retaining a low-alpha backdrop. Require a minimum genuinely zero-alpha area too; verify the original source is rejected and the corrected pale-horse source passes without deleting horse pixels. Cavalry candidate `61289a2f` passed [hosted checks](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/44178440070): quick 5/5, focused 1,744, Chromium 2/2 and Xbox software 8/8, including 768 exact reflections. The rendered horse sheet was inspected; physical Xbox, independent directions and dedicated death/Elite art remain separate.

### 2026-11-17 — Validate source briefs against runtime families
Check runtime unit flags before generating from a queued brief: Centurion is mounted and needs the cavalry envelope. The new `--mounted` source-check mode preserves multipart horse/rider pixels while retaining the stricter zero-alpha threshold; the original faint-background source fails and its corrected source passes. Imported candidate geometry alone is insufficient: run repository packing checks and inspect the actual browser render. Candidate `076af734` passed [hosted verification](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/44192717945), including 804 exact reflections, Chromium 2/2 and Xbox software 8/8; physical Xbox and full art coverage remain separate.

### 2026-11-17 — Keep complete cavalry silhouettes through source and browser review
For lance/feather silhouettes, check native cell margins before packing, preserve multipart details with cavalry padding, and inspect all eight attack phases in the real browser contact sheet. Do not weaken the alpha threshold to admit a faint generated backdrop; correct the source and recheck pale details. Candidate `8c98d474` passed quick 5/5, focused 1,748 and [hosted Chromium 2/2 plus Xbox software 8/8](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/44195750262), with 840 exact reflections; all 77 earlier atlas definitions were unchanged. Physical Xbox, independent directions and dedicated work/hit/death/remaining Elite art remain separate.

### 2026-11-17 — Keep authored ranged release separate from the live projectile
Kipchak and Arambai use the existing cooldown pose phase with the reviewed release at source cell 12; keep arrows/darts in the live projectile layer, and verify the hand/bow release rather than adding detached flying weapons to the sheet. Reject opaque source backgrounds and preserve pale horse pixels during correction. Candidate `0a35489c` passed quick 5/5, focused 1,748 and [hosted Chromium 2/2 plus Xbox software 8/8](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/44199776216), including 876 exact reflections; the rendered contact sheet was inspected and all 80 earlier atlas definitions were unchanged. Physical Xbox and full sprite-state coverage remain separate.

### 2026-11-17 — Review payload units without duplicating terminal effects
Author Flaming Camel as an unmanned payload carrier with live approach/brace activity frames; leave one-shot detonation to the existing simulation/FX layer and retain explicit death-art debt. Extend the existing camel browser fixture across all teams and save its contact sheet alongside horse evidence; preserve pale cloth/fur during alpha cleanup. Candidate `8f8aaa55` passed quick 5/5, focused 1,748 and [hosted Chromium 2/2 plus Xbox software 8/8](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/44202462799), with 912 exact reflections; rendered poses were inspected and all 83 earlier atlas definitions were unchanged. Physical Xbox and full sprite-state coverage remain separate.

### 2026-11-18 — Separate variant unit IDs from offline asset filenames
Keep the existing `rathaM` runtime/animation ID for mode switches and saves; map its file to lowercase `painted-motion-ratha-melee.webp` at the packer boundary so strict offline paths remain valid. Verify an ordinary atlas rebuild and real melee/ranged switches with unchanged net ID, health and position. Candidate `74a2ffec` passed quick 5/5, focused 1,749 and [hosted Chromium 2/2 plus Xbox software 8/8](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/44204844515), including 948 exact reflections; reviewed screenshots retain full chariot/elephant silhouettes, and all 86 earlier atlas definitions were unchanged. Physical Xbox and full sprite-state coverage remain separate.
