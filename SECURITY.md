# Security reporting and multiplayer trust

Please **do not post exploitable vulnerabilities, access tokens, room secrets, private keys or personal data in public issues or discussions**. If GitHub private vulnerability reporting is enabled for this repository, use the repository's **Security → Report a vulnerability** flow; otherwise contact a repository maintainer through an existing private channel before disclosing technical details.

### Security-sensitive areas

- Treat browser packets, Supabase identity/session claims and save files as untrusted. The authenticated two-person WebRTC game mode is a **preview**. Host validation checks sender binding, team, ownership, visibility, legal commands, costs and sequence. A malicious browser host remains outside its anti-cheat guarantees.
- Do not introduce new permanent server infrastructure, paid TURN, paid Vercel plans or Railway deployment without owner approval. Never commit Vercel/Supabase credentials, bearer tokens, rooms/SDP secrets or production keys.
- Preserve `sw.js` restrictions against caching authenticated/private transport calls; keep offline art integrity and fail-safe worker upgrades intact.
- Adversarial protocol, replay, malformed save, concurrency, WAN reconnect and long-match tests are release gates for wider multiplayer, not optional polish.
- Report the affected commit/environment, the minimal reproduction and potential impact privately. Avoid sending live secrets as test evidence.

A public website or GitHub repository is **not** permission to reuse the game's original assets or source. No root redistributable licence has been selected by the owner.
