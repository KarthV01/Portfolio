const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const os = require("node:os");
const { chromium } = require("playwright");
const mechanics = require("../mechanics.js");
assert.deepEqual(mechanics.order, [1, 4, 3, 8, 7, 6, 5, 2]);
// Independent geometric invariants: fixed rod length, 80-unit stroke,
// and precisely one combustion TDC per cylinder over 720 degrees.
for (let n = 1; n <= 8; n++) {
  let min = Infinity,
    max = -Infinity,
    firingStarts = 0;
  let wasFiring = mechanics.cylinder(n, -0.001).firing;
  for (let degree = 0; degree < 720; degree++) {
    const p = mechanics.cylinder(n, (degree * Math.PI) / 180);
    assert.ok(
      Math.abs(
        Math.hypot(...p.wrist.map((v, i) => v - p.pin[i])) -
          mechanics.rodLength,
      ) < 1e-10,
    );
    const h = Math.hypot(p.wrist[0], p.wrist[1]);
    min = Math.min(min, h);
    max = Math.max(max, h);
    if (p.firing && !wasFiring) firingStarts++;
    wasFiring = p.firing;
  }
  assert.equal(firingStarts, 1);
  assert.ok(Math.abs(max - min - 0.8) < 1e-10);
  const tdc = mechanics.cylinder(n, (mechanics.order.indexOf(n) * Math.PI) / 2);
  assert.ok(Math.abs(Math.hypot(tdc.wrist[0], tdc.wrist[1]) - 1.9) < 1e-10);
}

// Verify the shipped static site; offline rendering tools must never reach visitors.
const root = path.resolve(__dirname, "..");
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".pdf": "application/pdf",
  ".webp": "image/webp",
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
  await page.addInitScript(() => {
    window.appFrameCount = 0;
    const original = window.requestAnimationFrame;
    window.requestAnimationFrame = function (callback) {
      return original.call(window, (time) => {
        window.appFrameCount++;
        callback(time);
      });
    };
  });
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));
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
        const before = await page
          .locator("#assembly")
          .getAttribute("data-phase");
        await page.waitForTimeout(900);
        assert.notEqual(
          await page.locator("#assembly").getAttribute("data-phase"),
          before,
        );
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
    await page.waitForFunction(
      () => document.getElementById("engine").dataset.switching === "false",
    );
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
      await page.waitForFunction(
        () => document.getElementById("engine").dataset.switching === "false",
      );
      assert.equal(await page.locator(".component-card").count(), 1);
      if (i === 2 || i === 3) {
        await page.waitForSelector(".mechanism-canvas");
        assert.equal(await page.locator(".mechanism-canvas").count(), 1);
      }
      if ([1, 2, 5].includes(i)) {
        await page.screenshot({
          path: path.join(artifacts, `component-${i}.png`),
        });
      }
    }
    // Rapid input must coalesce to the final selection without accumulating layers.
    await page.locator('[data-part="0"]').click();
    for (let i = 0; i < 11; i++) await page.keyboard.press("ArrowRight");
    await page.waitForFunction(
      () =>
        document.getElementById("engine").dataset.active === "crank" &&
        document.getElementById("engine").dataset.switching === "false",
    );
    assert.equal(await page.locator(".component-card").count(), 1);
    assert.equal(
      await page.locator('[data-part="3"]').getAttribute("aria-pressed"),
      "true",
    );
    await page.locator("#next-part").click();
    await page.waitForFunction(
      () =>
        document.getElementById("engine").dataset.active === "block" &&
        document.getElementById("engine").dataset.switching === "false",
    );
    assert.equal(await page.locator(".mechanism-canvas").count(), 0);
    await page.waitForFunction(
      () => document.getElementById("rpm").textContent === "0000",
    );
    const idleFrames = await page.evaluate(async () => {
      const start = window.appFrameCount;
      await new Promise((resolve) => setTimeout(resolve, 350));
      return window.appFrameCount - start;
    });
    assert.equal(
      idleFrames,
      0,
      "Static inspection should have no perpetual application render loop",
    );
    assert.ok(
      !requests.some((url) =>
        /three|render-scene|engine-model|esbuild/.test(url),
      ),
      "Offline renderer must not load in the portfolio",
    );
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
    await page.waitForFunction(
      () => document.getElementById("engine").dataset.switching === "false",
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
    await reduced.locator('[data-part="2"]').click();
    await reduced.waitForFunction(
      () => document.getElementById("engine").dataset.active === "pistons",
    );
    const stillPhase = await reduced
      .locator(".mechanism-canvas")
      .getAttribute("data-phase");
    await reduced.waitForTimeout(150);
    assert.equal(
      await reduced.locator(".mechanism-canvas").getAttribute("data-phase"),
      stillPhase,
    );
    await reduced.close();
    assert.deepEqual(errors, []);
    console.log(
      "PASS: V8 command sequence, animated item switching, rapid input, bounded layers, idle render budget, no 3D runtime, keyboard, skip/replay, résumé, responsive layouts, reduced motion.",
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
