# Under the hood

Karthik Voruganti’s portfolio: a single-viewport terminal and a C8 Z06 LT6-inspired cutaway. Five C++-style commands take the engine from ignition to an 8,600 RPM redline; a short pixel burst opens a component selector. One large component is displayed at a time, with an animated exit/entrance on each selection.

Open `index.html` directly, or serve this directory with any static HTTP server. There is no application build step and no runtime JavaScript dependency. Google Fonts is optional; system fonts provide a fallback.

## Controls

- Enter executes the next displayed command. The console button works with mouse and touch.
- Escape skips ignition. Replay ignition is available afterward; R also replays when focus is outside a control.
- Left/Up selects the previous component; Right/Down selects the next, wrapping at the ends. On-screen arrows, component tabs, and horizontal swipes provide equivalent controls.
- Tab reaches component selectors and links. Enter/Space activates a focused button.
- Sound is opt-in. The engine tone and a short voxel-style explosion are synthesized locally with Web Audio. The explosion is an original effect, not a bundled Minecraft recording; it follows the pixel burst and stops immediately on mute, replay, skip, or a hidden tab.
- Reduced-motion users start directly in inspection mode with immediate item changes and still mechanism images. Returning visits in the same tab also skip ignition.

The document never scrolls. Long descriptions and project details scroll inside the console. On narrow screens the engine sits above the console.

## Editing

`script.js` contains portfolio content in `parts`, commands and RPM targets in `commands`, and the interruptible component selector. `styles.css` defines the warm white startup and graphite inspection palettes, responsive layouts, and reduced-motion behavior.

`mechanics.js` supplies the shared crankpin positions and exact slider-crank equations. `engine-drawing.js` draws the exposed mechanism as crisp projected contours using Canvas2D at up to 2× display resolution. Each connecting rod has constant length and stays attached to its crankpin. Four shared crankpins use an up/down/down/up arrangement, with five main journals and two cylinder banks at 90°. The four-stroke firing sequence is **1–4–3–8–7–6–5–2**, with one ignition every 90° and one firing per cylinder every 720°. The blue crown and numbered sequence highlight the latest firing cylinder for 90°; they do not imply that the entire power stroke lasts only 90° or that ignition occurs at every top-dead-center event.

The visual runs in explicitly labeled slow motion so its sequence remains readable. Indicated RPM follows the terminal commands; it is not the animation playback rate. Combustion timing is idealized at TDC, without spark advance. Rod length, counterweight contours, bank offset, housings, ECU, and transmission are illustrative, not OEM measurements or factory CAD. The drawing verifies mechanical relationships without claiming manufacturing accuracy.

Sources: [Chevrolet's LT6 introduction and specifications](https://news.chevrolet.com/newsroom.detail.html/Pages/news/us/en/2021/oct/1026-corvette-z06.html) confirms the naturally aspirated 5.5L DOHC architecture, flat-plane crank, 8,600 RPM redline, split intake, and 4–2–1 headers. The [2026 Corvette owner manual, Technical Data / Engine Specifications](https://www.chevroleteurope.com/content/dam/chevrolet/eu/master/en/index/manuals-guides/documents/owner-manuals/2026/26_CHEV_Corvette_OM_en_GB_E_ECV8OBBE2608EN_2025SEP29.pdf) supplies the LT6 firing order.

Static component illustrations in `assets/engine` are generated from `tools/engine-model.js`, with dark faces and pale contour outlines. Headers join paired primaries into two secondary pipes before the final collector. Images are lossless 2400×1920 WebP. The opening, piston selector, and crankshaft selector use the live vector drawing; legacy engine/mechanism images and motion strips are not requested.

To regenerate artwork, run `npm run render:engine`. Three.js renders the geometry in a local headless browser; Sharp writes transparent WebP assets. Those tools are **development-only** and are never loaded by the public portfolio. Generated files are committed so deployment remains a plain static directory.

## Animation budget

- One component at rest; at most two image layers while switching. Rapid inputs discard stale transitions.
- Only the opening or the selected piston/crankshaft mechanism runs an animation-frame loop. Motion is time-based and follows the display refresh rate, with elapsed time bounded after interruptions. No sprite strips are decoded.
- Other components settle after their transform/opacity transition. Static inspection has no perpetual application animation-frame loop.
- Telemetry updates stop once RPM settles. The 64-particle explosion stops and clears itself in under a second.
- Animations pause when the tab is hidden. Reduced motion disables item movement, mechanism loops, and particles.

The résumé is `Karthik_Resume.pdf`. Update its file and the biography content together when needed.

## Verification

Install development tools with `npm ci`, then run `npm test` (`npm.cmd` in Windows PowerShell). Browser checks use an installed Google Chrome in headless mode. Set `PLAYWRIGHT_CHANNEL` to `msedge` to use Microsoft Edge instead.

The verification script checks constant rod length, equal piston stroke, combustion TDC, and exactly one firing per cylinder across a 720° cycle. It then starts an ephemeral local server and checks animated ignition through redline, all component panels, rapid item switching, bounded layers, idle rendering, absence of a public 3D runtime, keyboard navigation, skip/replay cancellation, returning visits, the résumé, portrait/landscape layouts, and reduced motion. Screenshots are written to the OS temporary directory under `kv-engine-verification`, not the repository.
