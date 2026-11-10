// Asset generation, not shipped to the browser. Run npm run render:engine.
import { build } from "esbuild";
import { chromium } from "playwright";
import sharp from "sharp";
import http from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "assets", "engine");
await mkdir(out, { recursive: true });
const bundle = await build({
  entryPoints: [path.join(root, "tools/render-scene.js")],
  bundle: true,
  write: false,
  format: "iife",
});
const server = http.createServer((req, res) => {
  if (req.url === "/scene.js") {
    res.setHeader("Content-Type", "text/javascript");
    res.end(bundle.outputFiles[0].text);
  } else {
    res.setHeader("Content-Type", "text/html");
    res.end(
      '<!doctype html><html><body style="margin:0"><script src="/scene.js"></script></body></html>',
    );
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage();
  page.on("pageerror", (error) => console.error(error));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.ready);
  for (const id of [
    "engine",
    "spark",
    "head",
    "pistons",
    "crank",
    "block",
    "intake",
    "headers",
    "transmission",
    "ecu",
  ]) {
    await page.evaluate((id) => window.setPart(id), id);
    const data = await page.evaluate(() => window.captureFrame());
    await sharp(Buffer.from(data, "base64"))
      .webp({ quality: 88, alphaQuality: 100 })
      .toFile(path.join(out, `${id}.webp`));
    console.log(`Rendered ${id}`);
  }
  // Small sprite strips animate only the two exposed mechanisms, at 10 fps.
  // Fixed frame size and bounded decoded memory: 10 * 480 * 384 * 4 = 7.4 MB each.
  for (const id of ["pistons", "crank"]) {
    await page.evaluate((id) => window.setPart(id), id);
    const composite = [];
    for (let i = 0; i < 10; i++) {
      const data = await page.evaluate(
        (phase) => window.captureFrame(phase),
        (i * Math.PI * 2) / 10,
      );
      const input = await sharp(Buffer.from(data, "base64"))
        .resize(480, 384)
        .png()
        .toBuffer();
      composite.push({ input, left: i * 480, top: 0 });
    }
    await sharp({
      create: {
        width: 4800,
        height: 384,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite(composite)
      .webp({ quality: 85, alphaQuality: 100 })
      .toFile(path.join(out, `${id}-motion.webp`));
    console.log(`Rendered ${id} motion strip`);
  }
} finally {
  await browser.close();
  server.close();
}
