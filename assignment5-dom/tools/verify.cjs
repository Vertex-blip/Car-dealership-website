/* Browser verification: node tools/verify.cjs [URL] [chrome|msedge].
   CAPTURE_EVIDENCE=0 skips screenshots; SMOKE_ONLY=1 checks page/file loading. */
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { pathToFileURL } = require("node:url");
let pw;
try {
  pw = require("playwright");
} catch {
  pw = require(
    path.join(
      process.env.USERPROFILE,
      ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
    ),
  );
}
const root = path.resolve(__dirname, ".."),
  shots = path.join(root, "screenshots");
const entry =
    process.argv[2] || pathToFileURL(path.join(root, "index.html")).href,
  base = new URL("./", entry);
const channel = process.argv[3] || "chrome",
  smoke = process.env.SMOKE_ONLY === "1",
  capture = process.env.CAPTURE_EVIDENCE !== "0";
const pages = [
  "index.html",
  "inventory.html",
  "showroom.html",
  "about.html",
  "inquiry.html",
];
const results = [],
  errors = [],
  requests = [],
  viewerDiagnostics = [];
let browser, page;
fs.mkdirSync(shots, { recursive: true });
function check(label, value, detail = "") {
  results.push({ label, passed: !!value, detail });
  assert.ok(value, `${label}: ${detail}`);
}
async function visit(file = "index.html") {
  await page.goto(new URL(file, base).href, { waitUntil: "load" });
}
async function snap(name, selector) {
  if (!capture || smoke) return;
  await page.locator("img").evaluateAll((imgs) =>
    Promise.all(
      imgs.map((i) => {
        i.loading = "eager";
        return i.decode().catch(() => {});
      }),
    ),
  );
  const target = selector ? page.locator(selector) : page;
  if (selector) await target.scrollIntoViewIfNeeded();
  await target.screenshot({
    path: path.join(shots, name),
    animations: "disabled",
  });
}

(async () => {
  browser = await pw.chromium.launch({ channel, headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") {
      const url = m.location().url;
      (url && /^https?:/.test(url) && new URL(url).origin !== base.origin
        ? viewerDiagnostics
        : errors
      ).push(m.text());
    }
  });
  page.on("response", (r) => {
    if (r.status() >= 400) {
      const embedded = !!r.request().frame()?.parentFrame();
      (embedded ? viewerDiagnostics : errors).push(`${r.status()} ${r.url()}`);
    }
  });
  page.on("request", (r) =>
    requests.push({
      url: r.url(),
      method: r.method(),
      embedded: !!r.frame()?.parentFrame(),
    }),
  );
  try {
    for (const file of pages) {
      await visit(file);
      check(
        `${file}: one main and h1`,
        (await page.locator("main").count()) === 1 &&
          (await page.locator("h1").count()) === 1,
      );
      const nav = await page
        .locator("#assignmentNav a")
        .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
      check(
        `${file}: five real navigation pages`,
        JSON.stringify(nav) === JSON.stringify(pages),
      );
      check(
        `${file}: current-page state`,
        (await page
          .locator("#assignmentNav [aria-current=page]")
          .getAttribute("href")) === file,
      );
      check(
        `${file}: photographs decode`,
        await page.locator("img").evaluateAll(async (images) => {
          await Promise.all(
            images.map((i) => {
              i.loading = "eager";
              return i.decode().catch(() => {});
            }),
          );
          return images.every((i) => i.naturalWidth > 0);
        }),
      );
      const source = fs.readFileSync(path.join(root, file), "utf8");
      check(
        `${file}: no 3D viewer or remote embeds`,
        !/Sketchfab|three\.min|<iframe|data-showroom|data-mercedes-stage|3D Studio/i.test(
          source,
        ),
      );
      check(
        `${file}: HTML/CSS/JS separated`,
        !/<script\b(?![^>]*\bsrc\s*=)[^>]*>/i.test(source) &&
          !/<[^>]+\s(?:style|onclick|onchange|onsubmit)\s*=/i.test(source),
      );
      if (!smoke)
        for (const width of [320, 390, 768, 992, 1440]) {
          await page.setViewportSize({
            width,
            height: width < 500 ? 844 : 1000,
          });
          const measure = await page.evaluate(() => ({
            scroll: document.documentElement.scrollWidth,
            offenders: [
              ...document.querySelectorAll(
                "h1,h2,p,article,input,select,button,img,nav",
              ),
            ]
              .filter((e) => {
                if (
                  e.closest(
                    '.visually-hidden,.skip-link,[hidden],[aria-hidden="true"],.gallery-thumbnails',
                  )
                )
                  return false;
                const r = e.getBoundingClientRect();
                return (
                  r.width > 1 &&
                  r.height > 1 &&
                  (r.left < -2 || r.right > innerWidth + 2)
                );
              })
              .map((e) => `${e.tagName}.${e.className}`)
              .slice(0, 5),
          }));
          check(
            `${file}: responsive at ${width}px`,
            measure.scroll <= width + 1 && !measure.offenders.length,
            JSON.stringify(measure),
          );
        }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    if (smoke) {
      await visit("showroom.html");
      check(
        "Local image gallery loads on file protocol",
        await page
          .locator("#galleryMain")
          .evaluate((image) => image.complete && image.naturalWidth > 0),
      );
    } else {
      await visit();
      await snap("page-home.png");
      await page.locator("body").click({ position: { x: 5, y: 200 } });
      const scroll = await page.evaluate(() => scrollY);
      await page.keyboard.press("ArrowRight");
      check(
        "Page-level arrow focuses next page",
        (await page.locator(":focus").getAttribute("href")) ===
          "inventory.html",
      );
      check(
        "Arrow navigation produces sound",
        await page.evaluate(
          () => Number(document.documentElement.dataset.soundPlays) > 0,
        ),
      );
      check(
        "Arrow navigation preserves scroll",
        (await page.evaluate(() => scrollY)) === scroll,
      );
      await page.keyboard.press("End");
      await page.keyboard.press("ArrowRight");
      check(
        "Arrow navigation wraps",
        (await page.locator(":focus").getAttribute("href")) === "index.html",
      );
      await page.keyboard.press("ArrowRight");
      await snap("page-keyboard.png");
      await page.keyboard.press("Enter");
      await page.waitForURL("**/inventory.html");
      check(
        "Enter opens a separate page",
        new URL(page.url()).pathname.endsWith("/inventory.html"),
      );
      await page.locator("#nextPage").click();
      await page.waitForURL("**/showroom.html");
      check(
        "Next-page button opens the photographic showroom",
        new URL(page.url()).pathname.endsWith("/showroom.html"),
      );
      await page.locator("#themeToggle").click();
      check(
        "Night mode changes theme",
        (await page.locator("html").getAttribute("data-theme")) === "dark",
      );
      await snap("page-theme-dark.png");
      await visit("inventory.html");
      check(
        "Theme persists across pages",
        (await page.locator("html").getAttribute("data-theme")) === "dark",
      );
      await page.locator("#themeToggle").click();
      await page.locator("#appearanceToggle").click();
      const colors = new Set();
      for (let i = 0; i < 10; i++) {
        await page.locator("#backgroundButton").click();
        colors.add(
          await page.evaluate(() => document.body.style.backgroundColor),
        );
      }
      check(
        "Background generates more than three colors",
        colors.size > 3,
        `${colors.size} colors`,
      );
      const bg = await page.evaluate(() => document.body.style.backgroundColor);
      await snap("page-background.png");
      await page.keyboard.press("Escape");
      check(
        "Appearance Escape closes and restores focus",
        (await page.locator("#appearancePanel").isHidden()) &&
          (await page
            .locator("#appearanceToggle")
            .evaluate((e) => e === document.activeElement)),
      );
      await visit("about.html");
      check(
        "Background persists across pages",
        (await page.evaluate(() => document.body.style.backgroundColor)) === bg,
      );
      await page.locator("#appearanceToggle").click();
      await page.locator("#backgroundReset").click();
      await page.keyboard.press("Escape");
      check(
        "Background reset restores default",
        await page.evaluate(() => !document.body.style.backgroundColor),
      );
      await visit("inventory.html");
      check(
        "Collection contains 17 cars",
        (await page.locator(".vehicle-card").count()) === 17,
      );
      check(
        "Objects have useful methods",
        await page.evaluate(() =>
          Apex.vehicles.every(
            (v) =>
              typeof v.label === "function" &&
              typeof v.formattedPrice === "function",
          ),
        ),
      );
      await snap("page-inventory.png");
      for (const [category, total] of [
        ["touring", 5],
        ["performance", 10],
        ["adventure", 2],
        ["all", 17],
      ]) {
        await page.locator(`[data-category="${category}"]`).click();
        check(
          `${category}: correct filtered cars`,
          (await page.locator(".vehicle-card").count()) === total,
        );
        if (category === "performance")
          await snap("page-inventory-filtered.png");
      }
      await page.locator("#vehicleSearch").fill("Porsche");
      check(
        "Search finds matching cars",
        (await page.locator(".vehicle-card").count()) === 2,
      );
      await page.locator("#vehicleSearch").fill("nothing matches");
      check(
        "Empty search gives feedback",
        (await page.locator(".vehicle-card").count()) === 0 &&
          !!(await page.locator(".inventory-empty").textContent()),
      );
      await page.locator("#vehicleSearch").fill("");
      await page.locator("#vehicleSort").selectOption("price-low");
      const sorted = await page
        .locator(".vehicle-card")
        .evaluateAll((items) => items.map((e) => e.dataset.vehicleId));
      check(
        "Price sorting orders displayed cars",
        await page.evaluate(
          (ids) =>
            ids.every(
              (id, i) =>
                i === 0 ||
                Apex.vehicles.find((v) => v.id === ids[i - 1]).price <=
                  Apex.vehicles.find((v) => v.id === id).price,
            ),
          sorted,
        ),
      );
      await page.locator('[data-save-vehicle="huracan"]').click();
      check(
        "Save updates state and count",
        (await page
          .locator('[data-save-vehicle="huracan"]')
          .getAttribute("aria-pressed")) === "true" &&
          (await page.locator("#savedCount").textContent()) === "1",
      );
      await page.reload();
      check(
        "Saved choice survives reload",
        (await page
          .locator('[data-save-vehicle="huracan"]')
          .getAttribute("aria-pressed")) === "true",
      );
      await visit("inventory.html?saved=1");
      check(
        "Saved URL opens shortlist",
        (await page.locator(".vehicle-card").count()) === 1,
      );
      await snap("page-favorites.png");
      await page.locator('[data-save-vehicle="huracan"]').click();
      check(
        "Removing last saved car shows empty state",
        (await page.locator(".vehicle-card").count()) === 0,
      );
      await visit("inventory.html?category=adventure");
      check(
        "Home category URL works",
        (await page.locator(".vehicle-card").count()) === 2,
      );
      await page.locator('[data-inquire="expedition"]').click();
      await page.waitForURL("**/inquiry.html?vehicle=expedition");
      check(
        "Car choice carries to inquiry page",
        (await page.locator("#vehicle").inputValue()) === "expedition",
      );
      check(
        "All 17 cars appear in inquiry",
        (await page.locator("#vehicle option").count()) === 18,
      );
      await page.locator("#nextStep").click();
      check(
        "Contact validation prevents advancing",
        (await page.locator("#fullName").getAttribute("aria-invalid")) ===
          "true" && (await page.locator('[data-inquiry-step="0"]').isVisible()),
      );
      await snap("page-form-errors.png");
      await page.locator("#fullName").fill("Apex QA");
      await page.locator("#email").fill("qa@example.com");
      await page.locator("#nextStep").click();
      await page.locator("#budget").fill("35000000");
      await page.locator("#replyPhone").check();
      await page.locator("#nextStep").click();
      check(
        "Phone preference validates phone",
        (await page.locator("#phone").getAttribute("aria-invalid")) === "true",
      );
      await page.locator("#phone").fill("+7 700 123 45 67");
      await page.locator("#testDrive").check();
      await page.locator("#message").fill("Interested in a closer look.");
      await snap("page-form-preferences.png");
      await page.locator("#previousStep").click();
      check(
        "Back preserves contact details",
        (await page.locator("#fullName").inputValue()) === "Apex QA",
      );
      await page.locator("#nextStep").click();
      check(
        "Next preserves preferences",
        (await page.locator("#budget").inputValue()) === "35000000" &&
          (await page.locator("#vehicle").inputValue()) === "expedition",
      );
      await page.locator("#nextStep").click();
      const summary = await page.locator("#inquirySummary").textContent();
      check(
        "Review reflects actual inputs",
        summary.includes("Apex QA") &&
          summary.includes("Ford Expedition") &&
          summary.includes("35,000,000") &&
          summary.includes("+7 700"),
      );
      await snap("page-form-review.png");
      const posts = requests.filter((r) => r.method === "POST").length;
      await page.locator("#submitInquiry").click();
      check(
        "Finish shows truthful local preview",
        (await page.locator("#inquirySuccess").isVisible()) &&
          (await page.locator("#inquirySuccessText").textContent()).includes(
            "no information was sent",
          ),
      );
      check(
        "Inquiry sends no network submission",
        requests.filter((r) => r.method === "POST").length === posts,
      );
      await snap("page-form-success.png");
      await page.locator("#newInquiry").click();
      check(
        "New inquiry clears entered data",
        (await page.locator("#fullName").inputValue()) === "" &&
          (await page.locator("#vehicle").inputValue()) === "",
      );
      await visit("about.html");
      check(
        "Four original team members retained",
        (await page.locator(".team-card").count()) === 4,
      );
      await snap("page-team.png", "#team");
      await page.locator("#readMoreButton").click();
      check(
        "Read More changes display and expanded state",
        (await page
          .locator("#readMoreContent")
          .evaluate((e) => e.style.display === "block")) &&
          (await page
            .locator("#readMoreButton")
            .getAttribute("aria-expanded")) === "true",
      );
      await snap("page-story-expanded.png", ".about-story");
      await page.locator("#readMoreButton").click();
      check(
        "Read More collapses again",
        await page.locator("#readMoreContent").isHidden(),
      );
      await page.locator('[data-rating="4"]').click();
      check(
        "Rating updates stars and feedback",
        (await page.locator('[data-rating][aria-pressed="true"]').count()) ===
          4 &&
          (await page.locator("#ratingStatus").textContent()).includes(
            "4 of 5",
          ),
      );
      await page.locator(".faq-item summary").first().click();
      check(
        "FAQ expands its content",
        await page
          .locator(".faq-item")
          .first()
          .evaluate((e) => e.open),
      );
      await page.locator("#timeButton").click();
      check(
        "Time button displays device time",
        /\d{2}:\d{2}:\d{2}/.test(
          await page.locator("#timeOutput").textContent(),
        ),
      );
      await page.locator("#soundButton").click();
      await page.waitForFunction(() => document.getElementById("soundStatus").textContent.includes("short studio chime"));
      check(
        "User-triggered chime plays",
        /short studio chime/.test(
          await page.locator("#soundStatus").textContent(),
        ),
      );
      await snap("page-tools.png", ".utility-strip");
      await page.locator("#soundToggle").click();
      check(
        "Mute state updates",
        (await page.locator("#soundToggle").getAttribute("aria-pressed")) ===
          "false",
      );
      const sound = await page.locator("html").getAttribute("data-sound-plays");
      await page.locator("#timeButton").click();
      check(
        "Muted actions stay quiet",
        (await page.locator("html").getAttribute("data-sound-plays")) === sound,
      );
      await page.locator("#soundToggle").click();
      await visit("showroom.html");
      const thumbnails = page.locator("[data-gallery-src]");
      const totalSlides = await thumbnails.count();
      check(
        "Photographic showroom has at least eight slides",
        totalSlides >= 8,
      );
      const firstSource = await thumbnails
        .first()
        .getAttribute("data-gallery-src");
      await page.locator("#galleryNext").click();
      check(
        "Next changes the photograph and counter",
        (await page.locator("#galleryMain").getAttribute("src")) !==
          firstSource &&
          (await page.locator("#galleryCount").textContent()).includes("02"),
      );
      await page.locator("#galleryPrevious").click();
      await page.locator("#galleryPrevious").click();
      check(
        "Previous wraps to last photograph",
        (await thumbnails.last().getAttribute("aria-pressed")) === "true",
      );
      await thumbnails.nth(2).click();
      check(
        "Thumbnail updates the actual image attribute",
        (await page.locator("#galleryMain").getAttribute("src")) ===
          (await thumbnails.nth(2).getAttribute("data-gallery-src")),
      );
      check(
        "Photo caption follows selected car",
        (await page.locator("#galleryCaption").textContent()) ===
          (await thumbnails.nth(2).getAttribute("data-gallery-title")),
      );
      await page.keyboard.press("End");
      check(
        "Gallery End selects last photograph",
        (await thumbnails.last().getAttribute("aria-pressed")) === "true",
      );
      await page.keyboard.press("Home");
      check(
        "Gallery Home returns to first photograph",
        (await thumbnails.first().getAttribute("aria-pressed")) === "true",
      );
      await page.locator("#galleryMain").evaluate((image) => image.decode());
      await snap("page-showroom.png");
      await page.setViewportSize({ width: 390, height: 844 });
      await visit();
      check(
        "Mobile menu begins collapsed",
        (await page.locator("#navToggle").getAttribute("aria-expanded")) ===
          "false",
      );
      await page.locator("#navToggle").click();
      check(
        "Mobile menu opens",
        (await page.locator("#navToggle").getAttribute("aria-expanded")) ===
          "true" &&
          (await page.locator("#assignmentNav a").first().isVisible()),
      );
      await page.keyboard.press("Escape");
      check(
        "Escape closes mobile menu",
        (await page.locator("#navToggle").getAttribute("aria-expanded")) ===
          "false",
      );
      await snap("page-mobile.png");
      const restricted = await browser.newContext({ reducedMotion: "reduce" });
      await restricted.addInitScript(() => {
        Storage.prototype.getItem = () => {
          throw new DOMException("Blocked", "SecurityError");
        };
        Storage.prototype.setItem = () => {
          throw new DOMException("Blocked", "SecurityError");
        };
      });
      const fallback = await restricted.newPage(),
        fallbackErrors = [];
      fallback.on("pageerror", (e) => fallbackErrors.push(e.message));
      await fallback.goto(new URL("inventory.html", base).href);
      await fallback.locator('[data-save-vehicle="911"]').click();
      check(
        "Blocked storage keeps saves usable",
        (await fallback
          .locator('[data-save-vehicle="911"]')
          .getAttribute("aria-pressed")) === "true" &&
          fallbackErrors.length === 0,
      );
      await restricted.close();
    }
    const external = requests.filter(
      (r) =>
        !r.embedded &&
        /^https?:/.test(r.url) &&
        (base.protocol === "file:" || new URL(r.url).origin !== base.origin),
    );
    check(
      "All photographs, scripts and styles load locally",
      external.length === 0,
      JSON.stringify(external),
    );
    check(
      "No authored-page script or resource errors",
      errors.length === 0,
      errors.join("\n"),
    );
  } catch (error) {
    results.push({
      label: "Run completed",
      passed: false,
      detail: error.stack,
    });
    await page
      .screenshot({ path: path.join(shots, "qa-failure.png") })
      .catch(() => {});
    process.exitCode = 1;
  } finally {
    const report = {
      target: entry,
      channel,
      mode: smoke ? "smoke" : "full",
      timestamp: new Date().toISOString(),
      passed: results.filter((r) => r.passed).length,
      total: results.length,
      errors,
      viewerDiagnostics,
      results,
    };
    fs.writeFileSync(
      path.join(
        shots,
        path.basename(process.env.TEST_RESULT_NAME || (smoke ? `test-results-${channel}-file.json` : "test-results.json")),
      ),
      JSON.stringify(report, null, 2),
    );
    console.log(
      JSON.stringify(
        {
          passed: report.passed,
          total: report.total,
          errors,
          viewerDiagnostics,
          failures: results.filter((r) => !r.passed),
        },
        null,
        2,
      ),
    );
    await browser?.close();
  }
})();
