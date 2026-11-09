# Crown & Kingdoms — controlled Vercel releases

The repository's `vercel.json` configures an **Ignored Build Step**: `node scripts/vercel-deployment-gate.mjs`. This overrides the equivalent project-dashboard ignored-build command. Vercel runs this script on Git-backed deployments; the script reads the current Git commit message.

- Ordinary work on `main` (gameplay, tests, docs, fixes) still commits and runs existing GitHub Actions, but **does not build or publish a new Vercel deployment**.
- To release an accepted version, include **`[deploy]`** in the commit message, e.g. `feat(campaign): finish mission fixes [deploy]`. The latest commit is released with all preceding commits. A deliberate empty release commit with `[deploy]` can also publish the already-tested current `main`.
- Vercel's Ignored Build Step uses **exit code 0 to skip** and **exit code 1 to build** (the inverse of what a typical command's success might suggest). Skipped Git events may still show a canceled deployment; they do not produce a new game build. Vercel may still count them toward deployment quotas.
- An urgent manual redeploy can bypass the ignored-build step from the deployment's **Redeploy** dialog by unchecking **Use project's Ignore Build Step**. Do not create paid resources or disable protection to do so.
- The script fails closed (skips) when the Git commit message cannot be read. It only gates Git deployments; it does not block separately initiated Vercel CLI or API deployments.

## Vercel account maintenance (owner action)

Because the connected Vercel integration could not resolve this project on 9 November 2026, retention and historical-deployment cleanup require the owner to use the dashboard. In **Crown & Kingdoms → Settings → Security → Deployment Retention Policy**, consider **14 days** for old Production, **7 days** for Preview, and **1 day** for Canceled and Errored deployments, subject to the durations actually offered by the dashboard. Save each policy. Vercel automatically protects the active Production deployment and recent Ready deployments; confirm the displayed exceptions before saving.

Check **Deployments** after the gate commit. A normal commit should be skipped; a later explicitly tagged `[deploy]` commit should build. In particular, verify that the Vercel project uses this repository's root directory, so it can find `vercel.json` and `scripts/vercel-deployment-gate.mjs`.

**Do not bulk-delete deployment history** before confirming the active Production alias and any rollback deployment are preserved. Vercel retains important aliases, and its retention policies automatically expire eligible history; let retention remove old deployments rather than deleting the project or storage manually.

GitHub Actions verification continues through `.github/workflows/game-validation.yml` and the weekly/manual workflows. Those are independent of the Vercel deploy gate.
