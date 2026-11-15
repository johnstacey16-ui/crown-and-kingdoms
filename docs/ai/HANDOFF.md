# Cross-assistant handoff — Claude + ChatGPT/Codex

This is a **short, replaceable working note** so either assistant can resume a session started by the other. It is not a second backlog or a record of test acceptance. [ROADMAP.md](../../ROADMAP.md) owns priorities and verified project status; [AGENTS.md](../../AGENTS.md) owns development rules. Git history retains older handoffs.

## Latest handoff

- **Date (UTC):** 2026-11-15
- **Agent:** ChatGPT (GitHub-connected)
- **Working branch:** `development`; `main` remains the protected release branch
- **Work:** Initialize a repo-native handoff protocol for ChatGPT/Codex and Claude, with no application, CI, hosting or gameplay changes
- **Confirmed:** Read the existing `development` branch agent rules and roadmap before establishing this note
- **Not run / not verified:** Game tests, CI, live deployment, physical Xbox, and any automatic integration with the ChatGPT or Claude web apps
- **Next action:** Read the latest `ROADMAP.md`, verify the current branch and commit, then continue its content-first implementation priority. Replace this *latest handoff* after the next meaningful work session, linking the relevant commit or pull request and actual test evidence.

## Contract for the next assistant

1. **Read before editing:** `AGENTS.md`, the top of `ROADMAP.md`, then this note; inspect relevant code and Git/CI evidence instead of trusting handoff claims.
2. **Work on `development`:** Sync the branch first, avoid overwriting another agent's unmerged work, and keep `main` and production untouched without the documented release gate.
3. **Write one compact update after real work:** Identify the assistant, date, branch, changed files/features, commit/PR (when available), exact checks actually executed and their outcomes, unverified items, blockers and the next useful step. **Replace** the previous latest handoff instead of appending a growing transcript.
4. **Never fabricate evidence:** Tests count only for the SHA/run actually checked; simulated, Chromium and physical Xbox results are distinct. Do not copy secrets, tokens or chat transcripts into Git.
5. **This is shared repository state, not automatic chat sync:** ChatGPT and Claude can collaborate when each has repository access and explicitly reads/writes this file. Their private conversations are not synchronized by these files.

Use existing dedicated audit, verification, build-journal and roadmap files for long-lived detail; keep this note brief.
