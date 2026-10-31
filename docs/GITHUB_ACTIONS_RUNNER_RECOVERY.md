# GitHub Actions startup failure: free-only recovery

**31 October 2026 update: Hosted source validation has recovered; the original runner-allocation cause remains unconfirmed. Full regression and Chromium acceptance still require independent green runs.**

[Validation run 41202652720](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41202652720) successfully started a hosted runner and completed the current `f7610b3` source/graphics checks plus **23/23** focused module and victory-mode tests. The original zero-step failures below remain unexplained. More recently, [validation 41203700936](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41203700936) passed 79/79 focused checks alongside source/graphics validation on `0b7d0e1`. Neither green validation certifies the more expensive weekly/manual full Node, campaign or Chromium workflows.

## What the repository actually shows

The private repository's latest failing code revision was `862d877`: [source validation](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41199152874), [regression and campaigns](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41199152934), and [Chromium](https://github.com/johnstacey16-ui/crown-and-kingdoms/actions/runs/41199152877). **Every job failed in about two seconds with `runner_id: 0`, no assigned runner and zero steps.** Logs return `BlobNotFound`. GitHub check runs advertise annotations, but the connector cannot read their text or the owner's billing/usage settings.

This failure is **before** game code, checkout, Node and Playwright execute. An account-level free-minute quota, budget/billing restriction, or backend runner-provisioning refusal is suspected; the **exact cause is not confirmed**. The GitHub Actions API returned at least 2,500 October runs in this repository, including 439 during 25–31 October. Those run counts alone do not prove billed minutes or a particular budget state.

## Owner-only diagnosis without paying

1. Sign in and open one of the failed job links. Inspect the job's **Annotations** for the exact reason; it may mention account billing or spending-limit restrictions.
2. Inspect [your GitHub billing and usage settings](https://github.com/settings/billing), **Actions usage**, account/payment status and the Actions **budget/stop-usage** restriction. Do not increase a budget or enable paid usage under the game's free-only rules.
3. If the included private-repo allowance is exhausted, either wait for the free allowance to reset or use the local Windows runner below. If usage is available but the scheduler still refuses jobs, [contact GitHub Support](https://support.github.com/) with the failed run URL and exact annotation. An account restriction cannot be repaired by editing YAML.
4. Only call hosted CI fixed when a new source-validation job actually starts, logs steps and passes; then dispatch the regression and browser workflows.

## $0 GitHub-hosted-minute fallback: private Windows self-hosted runner

A new [Free self-hosted game acceptance workflow](../.github/workflows/free-self-hosted-acceptance.yml) runs on the owner's own Windows x64 machine, not a GitHub-hosted runner.

1. Open **repository Settings → Actions → Runners → New self-hosted runner → Windows x64**.
2. Follow GitHub's *generated* download/configure commands on that PC and run `run.cmd` to listen for jobs. Do **not** share the short-lived registration token.
3. When the runner is online, open **Actions → Free self-hosted game acceptance → Run workflow**, choose `main` and `quick`, `regressions`, `graphics` or `full`. The `full` option runs 235+ standalone files, seeded AI, 19 campaigns, Chromium battlefield art and room layout.
4. Keep the runner private and restricted to trusted `main` code, since Actions runs arbitrary repository scripts. The owner's PC supplies electricity, disk and network. If GitHub has locked the entire Actions service, even self-hosted workflow dispatch may be blocked until Support resolves it.

**Local execution without Actions**, in a Git checkout with Node 22:

```powershell
node scripts/run-checks.mjs --full
npm install --no-save --package-lock=false playwright@1.56.1
npx playwright install chromium
node tests/browser/battlefield-art.mjs
node tests/browser/room-layout.mjs
```

## Hosted-cost safeguards

`Game validation` still runs on main source pushes (or manual dispatch) to catch basic failures as soon as hosted jobs resume. The full `Game regression checks` and `Battlefield browser graphics` workflows retain **all their existing assertions** but run **manually or once weekly (Sunday 07:00 UTC)** rather than after every small commit. This avoids rapidly exhausting the free hosted private-repo allowance; source changes should also be verified with `node scripts/run-checks.mjs --full` before acceptance. Once the account restriction and budget are understood, per-push full CI can be reconsidered.

Do not make this private game public or change account payment settings to solve CI without explicit authorization. Source/refactoring work, Xbox acceptance and live networking are **not** automatically verified by these workflow changes.

Official docs: [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) and [adding a self-hosted runner](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/add-runners).
