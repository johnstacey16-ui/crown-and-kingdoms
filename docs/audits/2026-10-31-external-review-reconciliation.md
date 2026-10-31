# External AI review reconciliation — 31 October 2026

**Scope:** read-only verification of user-supplied DeepSeek, Kimi and Gemini audit claims against GitHub `main`, with a limited code/test hardening follow-up at `9a7442cd7d507f466dcfaaec5c362a9afe0481cf`. **This is not release acceptance or an independent hardware test.** Historic reports reflect the source SHA and timestamp they could see.

## Confirmed current evidence

- [GitHub compare dated audit baseline `3379744` with main](https://github.com/johnstacey16-ui/crown-and-kingdoms/compare/337974492df1ddfd5f9adb339b79855f005bd532...main) returned `status=ahead, behind_by=0`. [Compare Kimi/Gemini `2ca216b` to main](https://github.com/johnstacey16-ui/crown-and-kingdoms/compare/2ca216b2d8e7687afc718862ecc2a863aab209c7...main) likewise showed `behind_by=0` on 31 October. Both historical SHAs remain ancestors of main. This contradicts the report's categorical "history made unreachable" assertion; it does **not** prove no force-push ever occurred outside this evidence.
- [Current successful fast GitHub Actions 41214202628](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41214202628) completed checkout, Node, quick source/offline/civilization/atlas/graphics checks and focused game/controller/network tests. **194/194 focused tests passed**, and the 39 production scripts parsed successfully. Earlier jobs that failed before executing steps remain unexplained, not active evidence that every new hosted job fails.
- The executable `node scripts/report-repository-inventory.mjs` and `tests/repository-evidence-inventory.test.mjs` derive counts from the working tree and require README headline agreement. Current file counts following this reconciliation: **233** standalone `tests/*.test.mjs`, **39** production scripts, **26** core, **24** headless and **30** Markdown documents. Historical counts in dated audit sections are not current inventory statements.
- `data/civilizations.json` declares **26 partial medieval civilizations**, `return-of-rome` and `chronicles` rulesets missing, and incomplete regional unit access. This is not a complete Xbox AoE II DE or DLC catalogue.
- `tests/network-sync-protocol.test.mjs`, `tests/network-frame-replay.test.mjs`, `tests/network-command-uplink.test.mjs` and `tests/network-sync-authority.test.mjs` exercise sender binding, duplicate/gapped sequences, command validation, forged identities and deterministic seeded host/guest replay. These are executable protocol regression tests, **not** proof against arbitrary hostile peers or real network disruption.

## Assessments requiring qualification

1. **"Force-pushed main lost 3379744" — contradicted by ancestry.** Avoid treating any merge commit with the current tree as a destructive rewrite. Preserve these historical commits and continue using expected-head updates; GitHub currently reports main as not branch-protected, so enabling protection against force pushes still requires repository-admin access.
2. **"No security tests" — false as a categorical claim.** Authenticated network command and replay tests exist. Missing: comprehensive fuzzing, independent WAN game completion, reconnect and hidden-state-security acceptance.
3. **"All DLC complete/missing" — distinguish deliverables from incidental shared mechanics.** None of the full DLC rulesets or campaigns is accepted as complete. Some common game unit/civilization concepts overlap AoE II expansions; that is not a shipped DLC implementation.
4. **"Floating point implies desynchronization" — hypothesis, not proof.** Current simulation uses floating point. Deterministic host/guest replay tests exist, but cross-browser and throttle/reload equivalence has not been demonstrated. Do not mandate a fixed-point rewrite absent a reproducer.
5. **"No group coordination" — unproven.** Existing formation and group pathfinding metrics are present; real 200-plus-unit chokepoint clearance and physical Series S performance remain acceptance gaps.
6. **"~10% complete" — not an evidence-based engineering metric.** Do not put arbitrary completion percentages in release registers. Evaluate each of the 48 active `AUD-###` acceptance tasks and retained historical `CK-###` items instead.
7. **"CI 124/124 and 231 files" — formerly true snapshots, not current.** Current hosted 194/194 focused tests do not imply the 233 individual regression files, three seeded AI games, 19 missions or browser tests have passed on this revision.

## Next evidence milestones

1. Execute the free-only scheduled/manual `node scripts/run-checks.mjs --full` runner (five quick checks, 233 isolated standalone test files, three AI skirmishes and 19 campaigns) and capture its commit SHA plus failed-case inventory. `--full` **does not** imply Chromium: run `--browser` separately with an installed browser.
2. Add independent saved-game state-hash determinism checks and bounded 200-unit chokepoint/pathfinding performance experiments before rewriting arithmetic or large AI components.
3. Complete real Xbox Series S Edge controller, graphics and FPS sampling on hardware and an independent two-network full-match test. Only hardware/operator evidence can close these acceptance gates.
4. Keep source/asset refactoring and tests moving while maintaining free-only hosting, authenticated session authority, source-safe browser script loading and original resource artwork.

**Execution limitation at review time:** the available GitHub connector can inspect runs and write repository source but exposes no manual workflow-dispatch method. The local command environment cannot resolve github.com to clone the working tree. Therefore **the complete suite was not executed in this reconciliation**; no Chromium, physical Xbox or WAN success is implied.
