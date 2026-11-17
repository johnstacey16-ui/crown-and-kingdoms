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
