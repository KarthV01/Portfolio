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
    "spark",
    "head",
    "block",
    "intake",
    "headers",
    "transmission",
    "ecu",
  ]) {
    await page.evaluate((id) => window.setPart(id), id);
    const data = await page.evaluate(() => window.captureFrame());
    await sharp(Buffer.from(data, "base64"))
      .webp({ lossless: true })
      .toFile(path.join(out, `${id}.webp`));
    console.log(`Rendered ${id}`);
  }
} finally {
  await browser.close();
  server.close();
}
