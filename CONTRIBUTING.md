# Contributing to Crown & Kingdoms

The game is an **original**, controller-first Canvas2D RTS. Review [AGENTS.md](AGENTS.md), the [single active roadmap](ROADMAP.md), the [reusable skill](.github/skills/browser-rts-game-dev/SKILL.md) and [professional acceptance](docs/PROFESSIONAL_QUALITY.md) before making changes. This repository does **not** publish a licence granting third-party reuse; request permission before redistributing source or artwork.

- Use Node.js 22 or newer. The shipped game runs as plain HTML/classic JavaScript; source order in `index.html` is authoritative. No mandatory build/bundler is needed.
- Follow existing module ownership. Keep simulation deterministic, finite, seedable and separate from rendering. Authoritative rules must match controller UI, AI, saves and authenticated host commands.
- Run `node scripts/run-checks.mjs --quick` and `--focused` for gameplay/code changes. Add targeted behavioural tests and run full isolated regression, AI skirmishes, 19 campaign simulations, real Chromium and Xbox software contracts where risk warrants it.
- Original assets only. Track sprite source/provenance, named atlas frames, art digest, offline recovery and actual game-scale visuals. No copyrighted ripped images/music.
- Include current-build save/reload, invalid ownership/age/resources, enemy team, and command validation tests for research/production changes.
- Commit ordinary work to `development`, with non-force expected-head updates and quick/focused CI; preserve `main` for tested releases only. The development branch has no automatic Vercel preview. **Never include `[deploy]` in a routine commit**. Read [controlled releases](docs/VERCEL_RELEASES.md) before explicitly publishing.
- Link the exact tested SHA, checks and missing visual/human/Xbox acceptance. Don't claim a physical device pass from headless or browser tests.
- Update the [skill journal](.github/skills/browser-rts-game-dev/references/journal.md) with useful new methods rather than duplicating the roadmap.
