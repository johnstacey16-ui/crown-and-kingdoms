# Browser Runtime — Technical Notes

The primary project goals and completion criteria live in [AOE2_PARITY_ROADMAP.md](../AOE2_PARITY_ROADMAP.md).

## Current architecture

- `index.html` loads the game through classic browser scripts.
- `engine.js` coordinates the runtime; focused systems live in `js/`.
- `js/simulation.js` owns simulation stepping and gameplay updates.
- `js/ai.js` owns rival decision-making.
- `js/campaign.js` owns campaign objectives, events and progression.
- `js/render.js`, `js/ui.js` and `js/assets.js` handle world rendering, menus/HUD and optional local art assets.
- `js/input.js` handles controller input.
- `js/save.js` and `persistence.js` handle local save persistence.
- `multiplayer.js` contains the current multiplayer implementation.

## Change constraints

Preserve controller behaviour, save compatibility, simulation correctness and script load order. Update `index.html`, the service-worker cache, source checks and regression tests when adding or renaming runtime files.

## Verification

Run the automated checks listed in the README. Validate browser gameplay and physical Xbox Series S / Microsoft Edge performance separately; automated or Node-only results are not hardware measurements.
