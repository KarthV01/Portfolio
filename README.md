# Under the hood

Karthik Voruganti’s portfolio: a single-viewport terminal and animated, side-elevation engine. Five C++-style commands take the engine from ignition to redline; a pixel-particle burst reveals eight selectable components representing motivation, education, experience, projects, skills, interests, résumé, and contact.

Open `index.html` directly, or serve this directory with any static HTTP server. There is no application build step and no runtime JavaScript dependency. Google Fonts is optional; system fonts provide a fallback.

## Controls

- Enter executes the next displayed command. The console button works with mouse and touch.
- Escape skips ignition. Replay ignition is available afterward; R also replays when focus is outside a control.
- Arrow keys navigate the exploded engine spatially. Component buttons, SVG parts, and swipes on the engine provide alternate navigation.
- Tab reaches component selectors and links. Enter/Space selects a focused part.
- Sound is opt-in. The engine tone is synthesized locally with Web Audio.
- Reduced-motion users start directly in inspection mode, without particles or floating motion. Returning visits in the same tab also skip ignition.

The document never scrolls. Long descriptions and project details scroll inside the console. On narrow screens the engine sits above the console.

## Editing

`script.js` contains portfolio content in `parts`, commands and RPM targets in `commands`, and procedural SVG geometry in `engineDrawing()`. Component `dx`/`dy` values determine the exploded arrangement. The animation shares one RPM value; the displayed mechanical cycle is slowed to remain legible. `styles.css` defines the warm white startup and graphite inspection palettes, responsive layouts, and reduced-motion behavior.

The résumé is `Karthik_Resume.pdf`. Update its file and the biography content together when needed.

## Verification

Install development tools with `npm ci`, then run `npm test` (`npm.cmd` in Windows PowerShell). Browser checks use an installed Google Chrome in headless mode. Set `PLAYWRIGHT_CHANNEL` to `msedge` to use Microsoft Edge instead.

The verification script starts an ephemeral local server and checks ignition through redline, all component panels, keyboard navigation, skip/replay cancellation, returning visits, the résumé, portrait/landscape layouts, and reduced motion. Screenshots are written to the OS temporary directory under `kv-engine-verification`, not the repository.
