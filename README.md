# Under the hood

Karthik Voruganti’s portfolio: a single-viewport terminal and a detailed, Ferrari 458-inspired naturally aspirated V8. Five C++-style commands take the engine from ignition to a 9,000 RPM redline; a short pixel burst opens a component selector. One large component is displayed at a time, with an animated exit/entrance on each selection.

Open `index.html` directly, or serve this directory with any static HTTP server. There is no application build step and no runtime JavaScript dependency. Google Fonts is optional; system fonts provide a fallback.

## Controls

- Enter executes the next displayed command. The console button works with mouse and touch.
- Escape skips ignition. Replay ignition is available afterward; R also replays when focus is outside a control.
- Left/Up selects the previous component; Right/Down selects the next, wrapping at the ends. On-screen arrows, component tabs, and horizontal swipes provide equivalent controls.
- Tab reaches component selectors and links. Enter/Space activates a focused button.
- Sound is opt-in. The engine tone is synthesized locally with Web Audio.
- Reduced-motion users start directly in inspection mode with immediate item changes and still mechanism images. Returning visits in the same tab also skip ignition.

The document never scrolls. Long descriptions and project details scroll inside the console. On narrow screens the engine sits above the console.

## Editing

`script.js` contains portfolio content in `parts`, commands and RPM targets in `commands`, and the interruptible component selector. `styles.css` defines the warm white startup and graphite inspection palettes, responsive layouts, and reduced-motion behavior.

The original engine artwork in `assets/engine` is generated from `tools/engine-model.js`. This is a stylized technical illustration inspired by the F136 engine architecture, not factory CAD or an engineering simulation. It has two banks of four cylinders, a flat-plane crank, twin overhead-cam housings, intake runners, and four-into-one headers per bank. There is no turbocharger. Reference: [Ferrari’s description of the 458 Italia and its 9,000 RPM V8](https://cdn.ferrari.com/cms/network/media/pdf/16_f-1_prospectus.pdf).

To regenerate artwork, run `npm run render:engine`. Three.js renders the geometry in a local headless browser; Sharp writes transparent WebP assets. Those tools are **development-only** and are never loaded by the public portfolio. Generated files are committed so deployment remains a plain static directory.

## Animation budget

- One component at rest; at most two image layers while switching. Rapid inputs discard stale transitions.
- Only pistons and crankshaft use motion strips: ten frames at 10 fps, each decoded strip approximately 7.4 MB. Only the selected mechanism is mounted.
- Other components settle after their transform/opacity transition. Static inspection has no perpetual application animation-frame loop.
- Telemetry updates stop once RPM settles. The 64-particle explosion stops and clears itself in under a second.
- Animations pause when the tab is hidden. Reduced motion disables item movement, mechanism loops, and particles.

The résumé is `Karthik_Resume.pdf`. Update its file and the biography content together when needed.

## Verification

Install development tools with `npm ci`, then run `npm test` (`npm.cmd` in Windows PowerShell). Browser checks use an installed Google Chrome in headless mode. Set `PLAYWRIGHT_CHANNEL` to `msedge` to use Microsoft Edge instead.

The verification script starts an ephemeral local server and checks ignition through redline, all component panels, rapid item switching, bounded image layers, idle rendering, absence of a public 3D runtime, keyboard navigation, skip/replay cancellation, returning visits, the résumé, portrait/landscape layouts, and reduced motion. Screenshots are written to the OS temporary directory under `kv-engine-verification`, not the repository.
