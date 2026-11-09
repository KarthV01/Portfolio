const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const os = require("node:os");
const { chromium } = require("playwright");

// Run with Playwright on NODE_PATH. No runtime dependencies or build step required.
const root = path.resolve(__dirname, "..");
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".pdf": "application/pdf",
};
const server = http.createServer((req, res) => {
  const file = path.resolve(
    root,
    "." + (req.url === "/" ? "/index.html" : req.url.split("?")[0]),
  );
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (error, data) => {
    if (error) return res.writeHead(404).end();
    res.setHeader(
      "Content-Type",
      types[path.extname(file)] || "application/octet-stream",
    );
    res.end(data);
  });
});

(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
    headless: true,
  });
  const url = `http://127.0.0.1:${server.address().port}`;
  const errors = [];
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  const artifacts = path.join(os.tmpdir(), "kv-engine-verification");
  fs.mkdirSync(artifacts, { recursive: true });
  try {
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(artifacts, "desktop-intro.png") });
    assert.equal(
      await page.locator("body").getAttribute("data-state"),
      "intro",
    );
    for (let step = 0; step < 5; step++) {
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        () => !document.getElementById("execute").disabled,
      );
      if (step === 0) {
        await page.waitForTimeout(900);
        await page.screenshot({
          path: path.join(artifacts, "desktop-running.png"),
        });
      }
    }
    assert.equal(
      await page.locator("body").getAttribute("data-state"),
      "inspecting",
    );
    assert.equal(await page.locator(".history-entry").count(), 5);
    await page.waitForTimeout(1600);
    await page.screenshot({
      path: path.join(artifacts, "desktop-exploded.png"),
    });
    for (let i = 0; i < 8; i++) {
      await page.locator(`[data-part="${i}"]`).click();
      assert.equal(
        await page.locator(`[data-part="${i}"]`).getAttribute("aria-pressed"),
        "true",
      );
      assert.ok(
        (await page.locator("#inspection h2").textContent()).length > 5,
      );
    }
    await page.locator('[data-part="6"]').click();
    await page.keyboard.press("ArrowUp");
    assert.notEqual(
      await page.locator("#part-label").textContent(),
      "Transmission",
    );
    assert.equal(
      (await page.request.get(url + "/Karthik_Resume.pdf")).status(),
      200,
    );
    await page.locator("body").click({ position: { x: 10, y: 130 } });
    const before = await page.locator("#part-label").textContent();
    await page.keyboard.press("ArrowUp");
    assert.notEqual(await page.locator("#part-label").textContent(), before);
    await page.locator("#replay").click();
    await page.locator("#execute").click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1000);
    assert.equal(
      await page.locator("body").getAttribute("data-state"),
      "inspecting",
    );
    assert.equal(await page.locator("#history").isHidden(), true);
    await page.reload();
    assert.equal(
      await page.locator("body").getAttribute("data-state"),
      "inspecting",
    );
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 375, height: 667 },
      { width: 844, height: 390 },
      { width: 1024, height: 768 },
    ]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(1500);
      await page.screenshot({
        path: path.join(artifacts, `${viewport.width}x${viewport.height}.png`),
      });
      const layout = await page.evaluate(() => {
        const terminal = document
          .querySelector(".terminal")
          .getBoundingClientRect();
        const footer = document
          .querySelector(".page-footer")
          .getBoundingClientRect();
        return {
          scrollWidth: document.documentElement.scrollWidth,
          width: innerWidth,
          top: terminal.top,
          bottom: terminal.bottom,
          footer: footer.top,
        };
      });
      assert.ok(layout.scrollWidth <= layout.width, JSON.stringify(layout));
      assert.ok(
        layout.top >= 0 && layout.bottom <= layout.footer,
        JSON.stringify(layout),
      );
      if (viewport.width < 760) {
        const gap = await page.evaluate(
          () =>
            document.querySelector(".terminal").getBoundingClientRect().top -
            document.querySelector("#component-nav").getBoundingClientRect()
              .bottom,
        );
        assert.ok(
          gap >= 0,
          "Mobile component navigation must not overlap the console: " + gap,
        );
      }
    }
    const reduced = await browser.newPage({ reducedMotion: "reduce" });
    await reduced.goto(url);
    assert.equal(
      await reduced.locator("body").getAttribute("data-state"),
      "inspecting",
    );
    assert.equal(await reduced.locator("#component-nav button").count(), 8);
    await reduced.close();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: command sequence, components, keyboard, skip race, replay, returning visit, résumé, responsive layouts, reduced motion.",
    );
    console.log("Screenshots: " + artifacts);
  } finally {
    await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  server.close();
  process.exitCode = 1;
});
