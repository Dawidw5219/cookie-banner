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
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) {
      external.push(url.href);
      if (url.hostname === "www.youtube-nocookie.com")
        return route.fulfill({
          contentType: "text/html",
          body: "<!doctype html><title>Mock YouTube player</title>",
        });
      return route.abort();
    }
    return route.continue();
  });
  await page.goto(`${origin}/cookie-banner/`);
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  assert.equal(await dialog.getAttribute("aria-modal"), "true");
  assert.equal(
    await page.locator(".demo-options select").nth(0).inputValue(),
    "modal",
  );
  assert.equal(
    await page.locator(".demo-options select").nth(1).inputValue(),
    "equal",
  );
  const appearance = (button) =>
    button.evaluate((element) => {
      const style = getComputedStyle(element);
      return [
        style.backgroundColor,
        style.color,
        style.borderColor,
        style.fontWeight,
      ];
    });
  assert.deepEqual(
    await appearance(
      page.getByRole("button", { name: "Reject All", exact: true }),
    ),
    await appearance(
      page.getByRole("button", { name: "Accept All", exact: true }),
    ),
  );
  assert.deepEqual(external, [], "No provider requests before consent");
  await page.getByRole("button", { name: "Reject All", exact: true }).click();
  assert.equal(await page.locator("iframe[src]").count(), 0);
  assert.deepEqual(external, [], "No provider requests after refusal");
  await page.locator(".scanner-disclosure > summary").click();
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
  assert.equal(external.length, 1);
  assert.equal(
    external[0],
    "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ",
  );
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth),
      width,
    );
  }
  await page
    .locator(".article-footer")
    .getByRole("button", { name: "Cookie preferences", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Cookie Preferences", exact: true })
    .waitFor();
  assert.equal(
    (await page.request.get(`${origin}/cookie-banner/privacy.html`)).status(),
    200,
  );
  assert.equal(
    external.length,
    1,
    "Only the explicitly allowed video should load",
  );
  await page.keyboard.press("Escape");
  await page.locator(".demo-options > summary").click();
  await Promise.all([
    page.waitForURL((url) => url.searchParams.get("variant") === "bar"),
    page.getByLabel("Layout", { exact: true }).selectOption("bar"),
  ]);
  await page.getByRole("button", { name: "Reject All", exact: true }).waitFor();
  assert.equal(
    await page.evaluate(() => window.__cookieConsent.variant),
    "bar",
  );
  assert.equal(
    external.length,
    1,
    "Changing settings resets consent without reloading the provider",
  );
  await page.getByRole("button", { name: "Reject All", exact: true }).click();
  await page.locator(".demo-options > summary").click();
  await Promise.all([
    page.waitForURL((url) => url.searchParams.get("buttons") === "standard"),
    page.getByLabel("Decision buttons").selectOption("standard"),
  ]);
  await page.getByRole("button", { name: "Reject All", exact: true }).waitFor();
  assert.equal(
    await page.evaluate(() => window.__cookieConsent.buttonStyle),
    "standard",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS article demo: modal + equal defaults, no YouTube before consent/refusal, chosen video activation, local scanner, responsive layout and settings switches.",
  );
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
}
