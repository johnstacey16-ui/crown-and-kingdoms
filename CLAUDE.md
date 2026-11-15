# Claude Code — Crown & Kingdoms

**Shared instructions, not a separate Claude roadmap.** Follow [AGENTS.md](AGENTS.md) for all coding, testing, security, cost and release rules. [ROADMAP.md](ROADMAP.md) is the single active project plan. Do not substitute this file or a conversation summary for verified repository state.

## Start every development session

1. Work from the current `development` branch, not default `main`. Pull/re-read its latest state; check for other agents' newer commits.
2. Read `AGENTS.md`, the starting-position and priority sections of `ROADMAP.md`, and [docs/ai/HANDOFF.md](docs/ai/HANDOFF.md). Verify any handoff claims against code, commit history and CI.
3. Continue the highest-priority meaningful work in `ROADMAP.md` without producing a second task plan. Use established tests and existing modules before adding new ones.

## End every meaningful development session

- Commit verified changes to `development` with a clear message; never publish a release without the existing `[deploy]` gate.
- Replace the latest entry in `docs/ai/HANDOFF.md` with what you changed, actual tested commands/results, relevant commit/PR links, outstanding problems and the next action. Update `ROADMAP.md` only when authoritative progress or priority truly changes.
- Do not claim ChatGPT has seen your work automatically: the next assistant must fetch and read the repository. Do not commit private conversations or credentials.

This enables collaboration through **shared GitHub files**; it does not bridge private Claude Chat or ChatGPT conversation memory by itself.
