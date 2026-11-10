# Figma game UI design and implementation contract

**Editable Figma file:** [Crown & Kingdoms — Game UI & Visual Design System](https://www.figma.com/design/xCa6EgkpRf0Y1zUxK1yRXD)  
**Created:** 10 November 2026. **Scope:** original interface and art-review design; no runtime, gameplay, save, networking or source-sprite replacement has been approved by creating these mockups.

## What's in the Figma file

| Page | Editable design work |
| --- | --- |
| 01 · Foundations | 20 medieval-dark colour variables, 12 layout variables, 7 text styles, a swatch/rules reference artboard, and reusable navigation-row variants, framed panel, resource chip and Xbox control hint components |
| 02 · Game Screens | Eight 1920×1080 artboards: title, skirmish setup, in-match HUD, campaign briefing, pause/options, multiplayer room, technology tree and save/load confirmation |
| 03 · Art Direction & QA | Four Elite unit equipment/silhouette **specification-only** cards and a separate art/UI/Xbox verification board |

Screen frames currently use editable Figma text, shapes, auto-layout containers and some component instances; the gameplay/map portions are explicitly **concept placeholders**, not exported screenshots or approved artwork. Sample resource numbers, mission objectives, names and configuration values are illustrative, not claims about a verified running game. The design file is a collaborative reference, not a packaged asset or automatically linked runtime UI.

## Code and design responsibilities

| Design concern | Authoritative code today | Safe implementation route |
| --- | --- | --- |
| Title, setup, campaign, save and pause menu | `js/ui-screens.js`, `js/menus.js`, `js/ui.js` | Match hierarchy, layout, focus/readability in Canvas2D only with behavioural tests |
| In-game resource bar, unit HUD, radial commands, minimap | `js/ui.js`, `js/ui-commands.js`, `js/minimap.js` | Preserve simulation, controller semantics and render ordering; benchmark new UI draws |
| Multiplayer room HTML overlay | `styles.css`, `multiplayer.js`, `js/network-lobby.js` | Consume `--ck-*` CSS variables; keep accessible input and error states |
| Controller input mappings and focused actions | `js/input.js`, `js/menus.js`, `XBOX_CONTROLLER_PARITY.md` | Design **describes**, never rewrites, mappings |
| Painted units/buildings | `assets/painted-*.webp`, manifests, renderer modules | Export original, approved individual art to established atlas/animation pipeline, **not** a flattened Figma screenshot |
| Offline rendering/cache | `assets/art-revisions.json`, `sw.js` | Regenerate only when actual assets or shell code change; do not infer tests from Figma |

## Tokens and accessibility

The design palette and spacing snapshot lives in [`docs/game-ui-tokens.json`](game-ui-tokens.json). The matching `--ck-*` declarations in [`styles.css`](../styles.css) preserve the current colours in DOM and focus treatments. **There is no live automatic sync between Figma, CSS and canvas drawing commands.** Updating a Figma variable requires a deliberate review of the JSON contract and affected code.

- Figma reference: 16:9 at 1920×1080, target 48 px TV safe edge, controller targets at least 48 px high, high-contrast labels, visible non-colour-only focus and discernible confirmation/danger states.
- Use real in-game font rendering, scaling, line length, D-pad order, hold/tap behaviour and Xbox control semantics when implementing, rather than hardcoding Figma's sample strings.
- Confirm at 1280×720, 1920×1080, variable UI scale, narrow mobile viewport, browser zoom and large-font/contrast settings. Maintain logical navigation and no cropped text.
- Keep an on-device Series S performance and readability gate. Figma screenshot QA or Chromium is **not** physical Xbox acceptance.

## Four Elite sprite briefs

The Art Direction page maps to [`docs/ELITE_ART_PRODUCTION.md`](ELITE_ART_PRODUCTION.md): Goth `huskarl`, Briton `lbow`, Mongol `mgd` and Frank `axe`. These are **visual planning cards only**, not finished base/Elite frames. Follow the original sprite workflow and preserve existing image and manifest bytes until real, licensed/original, visually verified replacement sheets exist.

## Change checklist

1. Inspect current `main`, existing Figma file and canonical UI owner before editing. Do not duplicate controls in a parallel runtime UI layer.
2. Design the change in an existing Figma artboard/component; reuse variables and preserve 48 px navigation/readability constraints.
3. Review implementation against actual game state and controller mapping; code review owns real strings and action semantics.
4. Change code in small verified slices. For DOM changes, check the JSON/CSS colour contract; for Canvas changes, run relevant `node scripts/run-checks.mjs --quick` and focused UI/controller tests.
5. For real sprite changes, run packer/manifest/art-revision validation, offline/reload, Chromium render checks, and physical Series S inspection as applicable.
6. Keep separate statuses for **design mockup**, **merged runtime implementation**, **validated browser**, and **accepted physical Xbox**. No paid Figma AI, export service or hosting feature is required by this workflow.

**Status as of this file:** Figma design reference created and CSS variables documented; **game screen visual redesign is not yet shipped**, and dedicated four-Elite sprite sheets remain outstanding. Routine commit intentionally contains no `[deploy]` trigger.
