/* Regression: old browser-cached CSS with newer FAQ HTML, then hashed-asset recovery.
   Run: node tools/verify-cache.cjs [http://127.0.0.1:8066/assignment6-jquery/] */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
let pw;
try { pw = require('playwright'); } catch { pw = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const root = path.resolve(__dirname, '..'), shots = path.join(root, 'screenshots');
const base = new URL(process.argv[2] || 'http://127.0.0.1:8066/assignment6-jquery/');
const staleCss = execFileSync('git', ['show', 'f627cf3:assignment6-jquery/styles.css'], { cwd: root, encoding: 'utf8' });
const priorHtml = execFileSync('git', ['show', '5addaea:assignment6-jquery/about.html'], { cwd: root, encoding: 'utf8' });
const results = [], errors = [];
let browser;
function check(label, passed, detail = '') { results.push({ label, passed: !!passed, detail }); assert.ok(passed, `${label}: ${detail}`); }
async function measure(page) {
  return page.locator('.faq-item').first().evaluate(item => {
    const question = item.querySelector('.faq-question'), summary = item.querySelector('summary'), icon = item.querySelector('.faq-icon');
    const style = getComputedStyle(question);
    return { transform: style.transform, fontSize: style.fontSize, color: style.color,
      summaryFont: getComputedStyle(summary).fontSize, summaryColor: getComputedStyle(summary).color,
      iconTransform: getComputedStyle(icon).transform, tag: question.tagName,
      overflow: document.documentElement.scrollWidth > innerWidth + 1 };
  });
}
(async () => {
  try {
    browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
    // Deterministically simulate a cached stylesheet response. No reload/cache assumptions.
    const staleContext = await browser.newContext({ viewport: { width: 1860, height: 1100 } });
    await staleContext.route('**/about.html', route => route.fulfill({ status: 200, contentType: 'text/html', body: priorHtml }));
    await staleContext.route('**/styles.css', route => route.fulfill({ status: 200, contentType: 'text/css', body: staleCss }));
    const oldPage = await staleContext.newPage();
    await oldPage.goto(new URL('about.html', base).href);
    await oldPage.locator('#faqSearch').fill('car');
    const reproduced = await measure(oldPage);
    check('Reproduced: new span question plus old CSS rotates and enlarges question', reproduced.transform !== 'none' && reproduced.fontSize === '24px', JSON.stringify(reproduced));
    await oldPage.locator('.faq-section').screenshot({ path: path.join(shots, 'qa-faq-stale-css-reproduced.png') });
    await staleContext.close();

    // Same stale response remains available at the old URL; new hashes must bypass it.
    const fixedContext = await browser.newContext({ viewport: { width: 1860, height: 1100 } });
    let staleHits = 0;
    await fixedContext.route('**/styles.css*', route => {
      if (!new URL(route.request().url()).searchParams.get('v')) {
        staleHits++;
        return route.fulfill({ status: 200, contentType: 'text/css', body: staleCss });
      }
      return route.continue();
    });
    const page = await fixedContext.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(new URL('about.html', base).href);
    check('Updated HTML references versioned main stylesheet', await page.locator('link[href^="styles.css?v="]').count() === 1);
    for (const width of [1860, 390]) {
      await page.setViewportSize({ width, height: width < 500 ? 844 : 1100 });
      await page.locator('#faqSearch').fill('car');
      const fixed = await measure(page);
      check(`Cached-old-CSS scenario: ${width}px question remains unrotated and inherits font/color`, fixed.transform === 'none' && fixed.fontSize === fixed.summaryFont && fixed.color === fixed.summaryColor && !fixed.overflow, JSON.stringify(fixed));
      check(`Cached-old-CSS scenario: ${width}px only expand icon rotates`, fixed.iconTransform !== 'none');
      check(`Cached-old-CSS scenario: ${width}px all five highlights remain visible`, await page.locator('.faq-item mark:visible').count() === 5);
      await page.locator('.faq-section').screenshot({ path: path.join(shots, `qa-faq-cache-fixed-${width}.png`) });
    }
    check('Updated references bypass stale unversioned stylesheet', staleHits === 0, `${staleHits} stale stylesheet responses used`);
    await fixedContext.close();

    const filePage = await browser.newPage();
    filePage.on('pageerror', error => errors.push(error.message));
    await filePage.goto(pathToFileURL(path.join(root, 'about.html')).href);
    await filePage.locator('#faqSearch').fill('car');
    const directFile = await measure(filePage);
    check('file:// opening resolves CSS/JS query hashes and search works', directFile.transform === 'none' && directFile.fontSize === directFile.summaryFont && await filePage.locator('.faq-item mark').count() === 5, JSON.stringify(directFile));
    check('No JavaScript errors in current cached/file scenarios', errors.length === 0, errors.join('\n'));
  } catch (error) {
    results.push({ label: 'Cache regression completed', passed: false, detail: error.stack });
    process.exitCode = 1;
  } finally {
    const report = { target: base.href, channel: 'chrome', timestamp: new Date().toISOString(), passed: results.filter(r => r.passed).length, total: results.length, errors, results };
    fs.writeFileSync(path.join(shots, 'test-results-cache.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    await browser?.close();
  }
})();
