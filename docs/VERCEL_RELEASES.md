# Crown & Kingdoms — controlled Vercel releases

**Branch policy adopted 11 November 2026:** `development` is for daily commits and free GitHub Actions checks; `main` stays the GitHub default and the Vercel Production branch. The committed `vercel.json` uses `git.deploymentEnabled: { "development": false }` to block automatic preview **creation** on that branch rather than merely cancel the build. This is source-verified; the Vercel project's API isn't currently accessible to verify project-side behaviour. Do not claim quota savings until activity confirms it. Manual API/CLI deployments can bypass this Git integration setting.

**Normal release route:** Explicitly fetch and commit `development` (GitHub defaults to `main` when no branch/ref is given), validate the exact candidate with relevant quick/focused and acceptance gates, then merge the reviewed candidate into `main` with **one intentionally marked `[deploy]` commit** where practical. Preserve the existing main ignored-build gate, the ~weekly optional release cadence and the free-only hosting policy.

The repository's `vercel.json` configures an **Ignored Build Step**: `node scripts/vercel-deployment-gate.mjs`. This overrides the equivalent project-dashboard ignored-build command. Vercel runs this script on Git-backed deployments; the script first uses Vercel's `VERCEL_GIT_COMMIT_MESSAGE` system environment variable, falling back to `git log` for local checks.

- Ordinary work on `development` (gameplay, tests, docs, fixes) runs GitHub Actions but **does not create automatic Vercel deployments**; the older ignored-build gate still guards non-release `main` commits.
- To release an accepted version, include **`[deploy]`** in the commit message, e.g. `feat(campaign): finish mission fixes [deploy]`. The latest commit is released with all preceding commits. A deliberate empty release commit with `[deploy]` can also publish the already-tested current `main`.
- Vercel's Ignored Build Step uses **exit code 0 to skip** and **exit code 1 to build** (the inverse of what a typical command's success might suggest). Skipped Git events may still show a canceled deployment; they do not produce a new game build. Vercel may still count them toward deployment quotas.
- An urgent manual redeploy can bypass the ignored-build step from the deployment's **Redeploy** dialog by unchecking **Use project's Ignore Build Step**. Do not create paid resources or disable protection to do so.
- The script fails closed (skips) when the Git commit message cannot be read. It only gates Git deployments; it does not block separately initiated Vercel CLI or API deployments.

## Live release cadence and owner/agent workflow (agreed 9 November 2026)

**Target one tested Production release roughly weekly when the code is ready, not on an automatic timer.** The owner monitors Vercel account availability; a known platform rejection should be reported, but no agent quota query is required before a passing GitHub release. Avoid separate production builds for every fix. GitHub checks continue between releases.

| Work | Default action |
| --- | --- |
| Daily/ongoing game development | Commit to `development`, run quick/focused GitHub checks without a Vercel preview, and omit `[deploy]`. |
| Weekly release candidate | Review accumulated `development` changes, run relevant regressions and acceptance checks on the exact tree; keep `main` untouched if they fail. |
| Major finished feature or critical live bug | Release sooner **only after** suitable verification; record why this release breaks the weekly cadence. |
| Next Production release | Merge accepted `development` changes into `main` as a single `[deploy]` release commit when possible, then verify the live build. |
| After release | Verify Vercel Ready and correct public Production alias/SHA, run **bounded** browser/offline/artwork and relevant multiplayer/Xbox smoke, preserve rollback options, and record usage. |

### One-line release request

**Preferred shorthand to send in ChatGPT:**

```text
https://github.com/johnstacey16-ui/crown-and-kingdoms deploy
```

This means **"Deploy the latest tested Crown & Kingdoms to live"** and starts the entire guarded release workflow in that request; the owner **does not need to repeat the release request after tests**. This is a conversational instruction interpreted by the assistant using GitHub/Vercel tools, **not** a GitHub-native slash command, webhook or automatically running scheduled workflow. Do not treat merely mentioning the command in a planning/documentation conversation as a request to publish immediately. If required tests, resources, or access block release, report the blocker and leave Production unchanged.

The release request invokes these steps in order:

1. **Test first.** Inspect `main`, changes since the latest live revision and recent GitHub Actions. Run/verify suitable quick/focused regression gates, full standalone regressions, seeded AI, all 19 campaign simulations, Chromium and/or Xbox-contract software checks depending on changed code and risk. Use current-SHA evidence, repair any failures within scope, rerun affected tests, and do not publish if required gates remain red or unverified. Keep high-cost hosted checks purposeful and aligned to existing weekly/manual free-tier workflows.
2. **Release if accepted.** After required code/testing gates pass, commit one verified, non-force, expected-head `[deploy]` release on `main`. The owner monitors Vercel quota, billing, deployment status and rollback personally; those project-access or usage checks are **not** agent release gates. Never create paid resources or falsely claim a build succeeded.
3. **Check public evidence where available.** Inspect GitHub deployment statuses and the public game URL if accessible. If Vercel project API access or live revision verification is unavailable, explicitly mark deployment readiness/alias status **unverified**; do not imply an unseen Vercel Ready state.
4. **Smoke-test and report.** Run bounded production startup and changes-specific offline/art/multiplayer browser checks when possible; report actual deployed SHA, test results, public URL, bandwidth/storage observation and any unverified physical Xbox checks. Preserve rollback. Avoid repeated fresh-cache downloads.

**Equivalent longer request:** Say **"Deploy the latest tested Crown & Kingdoms to live."** The assistant should inspect actual GitHub branch state, run required tests, fix failures, and publish one expected-head `[deploy]` release commit after acceptance. Do not query Vercel quotas or require API access: the owner monitors Vercel personally. Successful publication still requires explicit evidence; a GitHub push alone is not proof of a Ready/live deployment.

### Release readiness and rollback checklist

1. **Confirm the exact release SHA and scope.** Review all changes since the last live release, GitHub checks and any existing regressions; distinguish test results for old SHAs from the candidate. Run `node scripts/run-checks.mjs --quick`, `--focused` and additional campaign, seeded AI, browser or full regression suites **as appropriate to the changed code**, with the existing expensive suites remaining weekly/manual. A required failing test is a release blocker. Hardware acceptance must not be inferred from Chromium/headless results.
2. **Vercel account status is owner-managed.** The owner handles bandwidth, storage, deployment quotas, billing, and any plan limits outside this agent workflow. The agent must preserve the existing free-only configuration and never attempt paid upgrades, quota overrides or repeat builds after reported platform failure. Missing Vercel API access alone does not block a tested GitHub release.
3. **Rollback monitoring is owner-managed.** Do not delete or overwrite existing production deployments; the owner retains access to Vercel's rollback controls. Record Git commit ancestry for safe code rollback.
4. **Publish once.** Use the intentional `[deploy]` commit, wait for a result, and verify the public Production alias actually points to the expected commit. If Vercel reports skipped/error/blocked, investigate and do **not** report a successful release.
5. **Smoke-test deliberately and minimally.** Check game startup, relevant changed gameplay, service-worker/offline artwork refresh and any affected multiplayer/controller behavior. A bounded live browser check is appropriate for a release; prefer local/headless/GitHub tests for routine iteration to avoid unnecessary repeated downloads.
6. **Usage review is the owner's responsibility.** Record release SHA, tests and public/GitHub evidence. Do not attempt Vercel project/usage API queries or require a quota screenshot.
7. **If the new live version fails**, stop further deployments, use Vercel's supported rollback/promote path to restore the known-good release if needed, then investigate and verify the fix before another `[deploy]`. Do not claim the rollback occurred without confirming the live alias.

## Vercel account maintenance (owner action)

**Verified saved 9 November 2026** in Vercel's team activity log: **14 days for Production**, **7 days for Preview** and **1 day for Canceled and Errored** deployments (reduced from one month). Use **Crown & Kingdoms → Settings → Security → Deployment Retention Policy** to review these settings in the future. The connected Vercel project/deployment APIs may still return 403/404, though team activity events and GitHub's Vercel status checks can provide partial verification. Vercel protects active Production and certain recent Ready deployments; retention does **not** guarantee immediate recovery of all occupied storage.

**Verified live skip behavior:** GitHub Vercel status checks for commits `91e819c`, `581432d`, `08ba974` and `a455cc5` report **Canceled by Ignored Build Step**. Explicit `[deploy]` publishing must still be verified on an actual planned release. Keep Vercel's project root aligned with this repository so `vercel.json` and `scripts/vercel-deployment-gate.mjs` remain discoverable.

**Do not bulk-delete deployment history** before confirming the active Production alias and any rollback deployment are preserved. Vercel retains important aliases, and its retention policies automatically expire eligible history; let retention remove old deployments rather than deleting the project or storage manually.

GitHub Actions verification continues through `.github/workflows/game-validation.yml` and the weekly/manual workflows. Those are independent of the Vercel deploy gate.
