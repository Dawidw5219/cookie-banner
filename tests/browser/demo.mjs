import { createServer } from "node:http";
import { readFile, access } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../example/dist/", import.meta.url));
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (!pathname.startsWith("/cookie-banner/")) {
      res.writeHead(404).end();
      return;
    }
    const file = resolve(
      root,
      pathname.slice("/cookie-banner/".length) || "index.html",
    );
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    const type =
      { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" }[
        extname(file)
      ] || "application/octet-stream";
    res.setHeader("Content-Type", `${type}; charset=utf-8`);
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
const chrome =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
let browser;
try {
  browser = await chromium.launch({
    executablePath: await access(chrome).then(
      () => chrome,
      () => undefined,
    ),
  });
  const page = await browser.newPage();
  const external = [],
    frames = [],
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) {
      external.push(url.href);
      return route.abort();
    }
    if (url.pathname.endsWith("/preview.html")) frames.push(url.href);
    return route.continue();
  });
  await page.goto(`${origin}/cookie-banner/`);
  await page.getByRole("button", { name: "Reject All", exact: true }).click();
  assert.equal(await page.locator("iframe[src]").count(), 0);
  assert.deepEqual(frames, []);
  await page
    .getByRole("button", { name: "Start local scanner", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add test data", exact: true })
    .click();
  const report = '[aria-label="Cookie scan report"]';
  await page.waitForFunction(
    (selector) =>
      document.querySelector(selector)?.textContent.includes("cb_demo_cookie"),
    report,
  );
  const scan = JSON.parse(await page.locator(report).innerText());
  assert(scan.sessionStorage.includes("cb_demo_storage"));
  assert(
    !JSON.stringify(scan).includes('"example"'),
    "Stored values must not appear in reports",
  );
  await page
    .getByRole("button", { name: "Remove test data", exact: true })
    .click();
  await page.waitForFunction(
    (selector) =>
      !document.querySelector(selector)?.textContent.includes("cb_demo_cookie"),
    report,
  );
  assert.equal(
    await page.evaluate(() => sessionStorage.getItem("cb_demo_storage")),
    null,
  );
  await page.getByRole("button", { name: "Stop scanner", exact: true }).click();
  await page
    .locator(".cb-content-placeholder")
    .first()
    .getByRole("button")
    .click();
  await page.waitForFunction(
    () => document.querySelectorAll("iframe[src]").length === 1,
  );
  assert.equal(frames.length, 1);
  assert(frames[0].endsWith("preview.html?provider=youtube"));
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth),
      width,
    );
  }
  await page
    .locator(".controls")
    .getByRole("button", { name: "Cookie preferences", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Cookie Preferences", exact: true })
    .waitFor();
  assert.equal(
    (await page.request.get(`${origin}/cookie-banner/privacy.html`)).status(),
    200,
  );
  assert.deepEqual(external, [], "The demo must not contact real providers");
  assert.deepEqual(errors, []);
  console.log(
    "PASS production demo: local simulations, no external requests, consent, synthetic scanner data and cleanup, mobile layout, privacy page.",
  );
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}
