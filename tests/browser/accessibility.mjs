import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { chromium, firefox, webkit } from "playwright";
const root = process.cwd();
const axe = await readFile(
  new URL("../../node_modules/axe-core/axe.min.js", import.meta.url),
  "utf8",
);
const server = createServer(async (req, res) => {
  try {
    const u = new URL(req.url, "http://localhost");
    if (u.pathname.endsWith(".js")) {
      if (u.pathname.includes("..")) throw new Error("path");
      res.setHeader("Content-Type", "application/javascript");
      res.end(await readFile(root + "/dist" + u.pathname));
      return;
    }
    const cfg = {
      mode: "standalone",
      lang: "pl",
      variant: u.searchParams.get("variant") || "modal",
      controller: {
        name: u.searchParams.get("scenario") === "incomplete" ? "" : "Studio",
      },
      purposes: "Odtwarzanie filmów na żądanie.",
      noticeVersion: "a11y-1",
      privacyPolicyUrl: "/privacy",
      serviceDisclosures: {
        youtube: {
          description: "Wyświetlenie filmu.",
          privacyUrl: "https://policies.google.com/privacy",
          retention: "Sesja",
        },
      },
      services: [
        {
          id: "qa-frame",
          name: "Interaktywny widżet",
          description: "Interaktywna treść na żądanie.",
          privacyUrl: "https://widgets.test/privacy",
          retention: "Sesja",
          urls: ["https://widgets.test/"],
        },
      ],
      theme:
        u.searchParams.get("theme") === "dark"
          ? { background: "#111111", text: "#eeeeee", primary: "#80aaff" }
          : undefined,
    };
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(
      `<!doctype html><html lang="pl"><head><title>Test dostępności</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:16px system-ui;margin:24px;color:${cfg.theme?.text || "#1a1a1a"};background:${cfg.theme?.background || "white"}}main{max-width:700px;margin:auto}button,a{font:inherit}a{color:inherit}article{min-height:120vh}iframe[hidden]{display:none!important}</style></head><body><main><h1>Materiały filmowe</h1><button class="open-consent-settings" id="open">Ustawienia cookies</button><article><p>Treść strony.</p><iframe id="video" hidden title="Film" data-cb-service="youtube" data-cb-src="https://www.youtube.com/embed/a11y"></iframe><iframe id="widget" hidden title="Interaktywny widżet" data-cb-service="qa-frame" data-cb-src="https://widgets.test/embed"></iframe></article><a id="last" href="#open">Ostatni odnośnik strony</a></main><script type="module">import{initializeConsent}from'/native.js';await initializeConsent(${JSON.stringify(cfg)});</script></body></html>`,
    );
  } catch (e) {
    res.writeHead(404).end(String(e));
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = "http://127.0.0.1:" + server.address().port;
const engine = process.env.TEST_BROWSER || "chromium";
const browser = await { chromium, firefox, webkit }[engine].launch({
  ...(engine === "chromium"
    ? {
        executablePath:
          process.env.CHROME_PATH ||
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      }
    : {}),
  headless: true,
});
const results = [];
try {
  for (const variant of ["modal", "bar"])
    for (const theme of ["light", "dark"])
      for (const width of [320, 1280]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
        });
        const page = await context.newPage();
        let externalRequests = 0;
        await context.route("**/*", (r) => {
          if (new URL(r.request().url()).origin === base) return r.continue();
          externalRequests++;
          return r.fulfill({
            contentType: "text/html; charset=utf-8",
            body: '<!doctype html><html lang="pl"><title>Treść testowa</title><main><h1>Załadowany film lub widżet</h1><button>Odtwórz</button></main></html>',
          });
        });
        await page.goto(`${base}/?variant=${variant}&theme=${theme}`);
        await page.locator("#cookie-consent-host .cb-settings").waitFor();
        await page.evaluate(axe);
        const check = async (view) => {
          console.log(engine, variant, theme, width, view);
          const a = await page.evaluate(
            async () =>
              await axe.run(document, {
                runOnly: {
                  type: "tag",
                  values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
                },
              }),
          );
          results.push({
            engine,
            variant,
            theme,
            width,
            view,
            violations: a.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              help: v.help,
              nodes: v.nodes.map((n) => ({
                target: n.target,
                summary: n.failureSummary,
              })),
            })),
            incomplete: a.incomplete.map((v) => ({
              id: v.id,
              nodes: v.nodes.length,
            })),
          });
        };
        await check("banner");
        await page.locator("#cookie-consent-host .cb-settings").click();
        await page.getByRole("switch").first().waitFor();
        await check("preferences");
        const controls = await page
          .getByRole("dialog")
          .evaluate(
            (el) =>
              [
                ...el.querySelectorAll(
                  'button:not([disabled]),a[href],input:not([disabled]),[tabindex="0"]',
                ),
              ].filter((node) => node.getClientRects().length).length,
          );
        for (let step = 0; step < controls + 2; step++) {
          await page.keyboard.press("Tab");
          assert.equal(
            await page
              .getByRole("dialog")
              .evaluate((el) => el.contains(el.getRootNode().activeElement)),
            true,
          );
        }
        await page.keyboard.press("Shift+Tab");
        assert.equal(
          await page
            .getByRole("dialog")
            .evaluate((el) => el.contains(el.getRootNode().activeElement)),
          true,
        );

        await page.addStyleTag({
          content:
            "* {letter-spacing: .12em !important; word-spacing: .16em !important; line-height: 1.5 !important;} p {margin-bottom: 2em !important;}",
        });
        assert.equal(
          await page
            .getByRole("dialog")
            .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
          true,
        );
        await page.setViewportSize({ width, height: 320 });
        await page
          .getByRole("button", { name: "Odrzuć wszystkie", exact: true })
          .scrollIntoViewIfNeeded();
        await page.setViewportSize({ width, height: 900 });
        assert.equal(
          await page.locator("main").evaluate((el) => el.inert),
          true,
        );
        await page.keyboard.press("Tab");
        assert.equal(
          await page.evaluate(() => document.activeElement.id),
          "cookie-consent-host",
        );
        const label = await page.getByRole("dialog").getAttribute("aria-label");
        await page.keyboard.press("Escape");
        const escapeCloses = (await page.getByRole("dialog").count()) === 0;
        assert.equal(escapeCloses, true);
        assert.equal(
          await page.locator("main").evaluate((el) => el.inert),
          false,
        );
        await page.locator("#open").focus();
        await page.keyboard.press("Enter");
        await page.getByRole("dialog").waitFor();
        await page.keyboard.press("Escape");
        await page.waitForFunction(() => document.activeElement?.id === "open");
        assert.equal(
          await page
            .locator("#open")
            .evaluate((el) => el === document.activeElement),
          true,
        );
        assert.equal(
          await page.evaluate(() => localStorage.getItem("cb_consent_record")),
          null,
        );
        results.push({
          variant,
          theme,
          width,
          dialogLabel: label,
          escapeCloses,
        });
        assert.equal(externalRequests, 0, "no vendor request before a choice");
        const blockers = page.locator(".cb-content-placeholder");
        assert.equal(await blockers.count(), 2);
        await check("blocked-video-and-iframe");
        assert.match(await blockers.first().ariaSnapshot(), /button/);
        for (const control of await blockers
          .first()
          .locator("button,summary")
          .all()) {
          const size = await control.boundingBox();
          assert.ok(size.width >= 24 && size.height >= 24);
        }

        await blockers.first().locator("summary").focus();
        await page.keyboard.press("Enter");
        assert.equal(
          (await blockers.first().locator("details").getAttribute("open")) !==
            null,
          true,
        );
        await blockers.first().locator("button").focus();
        await page.keyboard.press("Space");
        await page.locator("#video").waitFor({ state: "visible" });
        assert.equal(
          await page
            .locator("#video")
            .evaluate((el) => document.activeElement === el),
          true,
          "focus follows the activated embed",
        );
        assert.equal(await blockers.count(), 1);
        await page
          .frameLocator("#video")
          .getByRole("button", { name: "Odtwórz" })
          .waitFor();
        await blockers.first().locator("button").focus();
        await page.keyboard.press("Enter");
        await page
          .frameLocator("#widget")
          .getByRole("button", { name: "Odtwórz" })
          .waitFor();
        assert.equal(await blockers.count(), 0);
        await check("loaded-video-and-iframe");
        await page.locator("#open").focus();
        await page.keyboard.press("Enter");
        const beforeWithdrawal = externalRequests;
        await Promise.all([
          page.waitForEvent("domcontentloaded"),
          page
            .getByRole("button", { name: "Odrzuć wszystkie", exact: true })
            .click(),
        ]);
        await page.locator(".cb-content-placeholder").first().waitFor();
        assert.equal(await blockers.count(), 2);
        assert.equal(
          externalRequests,
          beforeWithdrawal,
          "withdrawal reload must not request vendors",
        );
        await page.evaluate(axe);
        await check("withdrawn-video-and-iframe");

        if (variant === "bar") {
          await page.evaluate(() => localStorage.clear());
          await page.goto(`${base}/?variant=bar`);
          await page.locator("#cookie-consent-host .cb-settings").waitFor();
          const geometry = await page.evaluate(() => {
            const a = document.querySelector("#last");
            a.scrollIntoView();
            a.focus();
            const target = a.getBoundingClientRect();
            const h = document
              .querySelector("#cookie-consent-host")
              .shadowRoot.querySelector(".cb-bar-actions")
              .closest(".fixed")
              .getBoundingClientRect();
            return {
              focusedBottom: target.bottom,
              bannerTop: h.top,
              obscured: target.top >= h.top,
            };
          });
          assert.equal(geometry.obscured, false);
          results.push({ variant, theme, width, geometry });
        }
        await context.close();
      }
  for (const scenario of ["storage-error", "incomplete", "forced-colors"]) {
    if (scenario === "forced-colors" && engine !== "chromium") continue;
    const context = await browser.newContext({
      viewport: { width: 320, height: 600 },
      reducedMotion: "reduce",
      ...(scenario === "forced-colors" ? { forcedColors: "active" } : {}),
    });
    if (scenario === "storage-error")
      await context.addInitScript(() => {
        Storage.prototype.setItem = () => {
          throw new DOMException(
            "Disabled for accessibility QA",
            "QuotaExceededError",
          );
        };
      });
    let external = 0;
    await context.route("**/*", (route) => {
      if (new URL(route.request().url()).origin === base)
        return route.continue();
      external++;
      return route.abort();
    });
    const page = await context.newPage();
    await page.goto(`${base}/?scenario=${scenario}`);
    await page.getByRole("dialog").waitFor();
    await page.keyboard.press("Escape");
    const blocker = page.locator(".cb-content-placeholder").first();
    await blocker.locator("button").focus();
    if (scenario === "storage-error") {
      await page.keyboard.press("Enter");
      await blocker.getByRole("alert").waitFor();
      assert.equal(await page.locator("#video").getAttribute("src"), null);
      assert.equal(
        await blocker
          .locator("button")
          .evaluate((el) => el === document.activeElement),
        true,
      );
    } else if (scenario === "incomplete") {
      await page.keyboard.press("Enter");
      await page.getByRole("dialog").waitFor();
      assert.equal(
        await page
          .getByRole("button", { name: "Zaakceptuj wszystkie", exact: true })
          .isDisabled(),
        true,
      );
      await page.keyboard.press("Escape");
      await page.waitForFunction(() =>
        document.activeElement?.closest(".cb-content-placeholder"),
      );
    } else {
      assert.notEqual(
        await blocker
          .locator("button")
          .evaluate((el) => getComputedStyle(el).outlineStyle),
        "none",
      );
    }
    assert.equal(external, 0);
    await page.evaluate(axe);
    const audit = await page.evaluate(async () =>
      axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
        },
      }),
    );
    results.push({
      engine,
      scenario,
      violations: audit.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      incomplete: audit.incomplete.map((v) => v.id),
    });
    await context.close();
  }
  await writeFile(
    process.env.ACCESSIBILITY_REPORT ||
      `/tmp/cookie-banner-accessibility-${engine}.json`,
    JSON.stringify(results, null, 2),
  );
  assert.equal(results.flatMap((r) => r.violations || []).length, 0);
  console.log(
    JSON.stringify(
      results.map((r) => ({
        ...r,
        violations: r.violations?.map((v) => ({
          id: v.id,
          nodes: v.nodes.length,
        })),
        incomplete: undefined,
      })),
      null,
      2,
    ),
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
