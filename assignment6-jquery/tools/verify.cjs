/* Real browser checks: node tools/verify.cjs [URL] [chrome|msedge].
   RESULT_NAME preserves separate evidence; CAPTURE_EVIDENCE=0 skips screenshots. */
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
let pw;
try { pw = require('playwright'); } catch { pw = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')); }
const root = path.resolve(__dirname, '..'), shots = path.join(root, 'screenshots');
const entry = process.argv[2] || pathToFileURL(path.join(root, 'index.html')).href;
const base = new URL('./', entry), channel = process.argv[3] || 'chrome';
const capture = process.env.CAPTURE_EVIDENCE !== '0', resultName = process.env.RESULT_NAME || 'test-results.json';
const results = [], errors = [], consoleMessages = [], requests = [], diagnostics = [];
let browser, page;
fs.mkdirSync(shots, { recursive: true });
function check(label, passed, detail = '') { results.push({ label, passed: !!passed, detail }); assert.ok(passed, `${label}: ${detail}`); }
async function visit(file = 'index.html') {
  await page.goto(new URL(file, base).href, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.jQuery && !!document.getElementById('scrollProgress'));
}
async function snap(name, selector) {
  if (!capture) return;
  if (selector) await page.locator(selector).scrollIntoViewIfNeeded();
  await page.waitForTimeout(180);
  await (selector ? page.locator(selector) : page).screenshot({ path: path.join(shots, name), animations: 'disabled' });
}
async function fillInquiry() {
  await page.locator('#fullName').fill('Apex QA');
  await page.locator('#email').fill('qa@example.com');
  await page.locator('#nextStep').click();
  await page.locator('#vehicle').selectOption('911');
  await page.locator('#message').fill('Please show the details of this car.');
  await page.locator('#nextStep').click();
}
async function verifyFaqHighlightLayout() {
  // A mark must remain inline inside the question, never become a flex item.
  // Check real text geometry so a visually broken layout cannot pass on mark count alone.
  for (const width of [1860, 1440, 390, 320]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    for (const theme of ['light', 'dark']) {
      if (await page.locator('html').getAttribute('data-theme') !== theme) {
        await page.locator('#themeToggle').click();
        await page.waitForTimeout(400);
      }
      for (const query of ['car', 'the', 'a car']) {
        await page.locator('#faqSearch').fill(query);
        const geometry = await page.locator('.faq-list').evaluate(list => {
          const issues = [], marks = [...list.querySelectorAll('mark.search-highlight')];
          const visibleMarks = marks.filter(mark => mark.getClientRects().length > 0);
          for (const summary of list.querySelectorAll('summary')) {
            const question = summary.querySelector('.faq-question'), icon = summary.querySelector('.faq-icon');
            if (!question || !icon || summary.children.length !== 2) {
              issues.push('Question text and icon must be two separate flex items.');
              continue;
            }
            if (getComputedStyle(question).transform !== 'none') issues.push('Question text is rotated.');
            if (summary.closest('details').open && getComputedStyle(icon).transform === 'none') issues.push('Open icon does not rotate.');
            for (const mark of question.querySelectorAll('mark')) {
              if (getComputedStyle(mark).display !== 'inline') issues.push('Highlight is not inline.');
              const before = document.createRange();
              before.setStart(question, 0);
              before.setEndBefore(mark);
              const prefixRects = [...before.getClientRects()].filter(rect => rect.width > 0);
              const prefix = prefixRects.at(-1), highlighted = mark.getClientRects()[0];
              if (prefix && highlighted && Math.abs(prefix.top - highlighted.top) < 3 && Math.abs(highlighted.left - prefix.right) > 8) {
                issues.push(`Unexpected ${Math.round(highlighted.left - prefix.right)}px gap before highlighted text.`);
              }
            }
          }
          return { issues, total: marks.length, visible: visibleMarks.length, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
        });
        check(`FAQ highlight layout: ${width}px ${theme}, "${query}"`, geometry.total > 1 && geometry.total === geometry.visible && !geometry.overflow && geometry.issues.length === 0, JSON.stringify(geometry));
      }
      await page.locator('#clearFaqSearch').click();
      check(`FAQ clear restores closed questions: ${width}px ${theme}`, await page.locator('.faq-item mark').count() === 0 && await page.locator('.faq-item[open]').count() === 0);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  if (await page.locator('html').getAttribute('data-theme') !== 'light') {
    await page.locator('#themeToggle').click();
    await page.waitForTimeout(400);
  }
  await page.locator('#faqSearch').fill('car');
  const firstSummary = page.locator('.faq-item summary').first();
  await firstSummary.focus();
  await page.keyboard.press('Enter');
  check('Highlighted FAQ: Enter closes the focused question', !(await page.locator('.faq-item').first().evaluate(e => e.open)));
  await page.keyboard.press('Space');
  check('Highlighted FAQ: Space reopens the focused question', await page.locator('.faq-item').first().evaluate(e => e.open));
  await snap('task-3-highlighting.png', '.faq-section');
}
(async () => {
  browser = await pw.chromium.launch({ channel, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  if (base.protocol !== 'file:') await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base.origin });
  page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => {
    if (m.type() === 'log') consoleMessages.push(m.text());
    if (m.type() === 'error') {
      if (/code.jquery.com/.test(m.location().url)) diagnostics.push(m.text());
      else errors.push(m.text());
    }
  });
  page.on('request', r => requests.push({ url: r.url(), method: r.method() }));
  page.on('response', r => { if (r.status() >= 400 && !r.url().includes('code.jquery.com')) errors.push(`${r.status()} ${r.url()}`); });
  try {
    const pages = ['index.html', 'inventory.html', 'showroom.html', 'about.html', 'inquiry.html'];
    for (const file of pages) {
      await visit(file);
      check(`${file}: jQuery 4 initialized`, await page.evaluate(() => jQuery.fn.jquery === '4.0.0'));
      check(`${file}: required CDN script is inside head`, await page.locator('head script[src="https://code.jquery.com/jquery-4.0.0.min.js"]').count() === 1);
      check(`${file}: one main and h1`, await page.locator('main').count() === 1 && await page.locator('h1').count() === 1);
      check(`${file}: current navigation points to page`, await page.locator('#assignmentNav [aria-current=page]').getAttribute('href') === file);
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
        check(`${file}: no horizontal overflow at ${width}px`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      }
    }
    check('Task 0: exact ready console message', consoleMessages.filter(m => m === 'jQuery is ready!').length >= 5);
    await visit();
    await snap('task-0-home.png');
    check('Task 4: progress starts at zero', Number(await page.locator('#scrollProgress').getAttribute('aria-valuenow')) === 0);
    await page.locator('[data-count-to]').first().scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.querySelectorAll('[data-count-to]')].every(e => Number(e.textContent.replace(/,/g, '')) === Number(e.dataset.countTo)));
    check('Task 5: counters finish at truthful 17 / 3 / 4 totals', JSON.stringify(await page.locator('[data-count-to]').allTextContents()) === JSON.stringify(['17', '3', '4']));
    await snap('task-5-counters.png', '.collection-stats');
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForFunction(() => Number(document.getElementById('scrollProgress').getAttribute('aria-valuenow')) === 100);
    check('Task 4: progress reaches 100 at page bottom', Number(await page.locator('#scrollProgress').getAttribute('aria-valuenow')) === 100);
    await snap('task-4-progress.png');
    await page.locator('#themeToggle').click();
    await visit('inventory.html');
    check('Existing appearance persists across pages', await page.locator('html').getAttribute('data-theme') === 'dark');
    await page.locator('#themeToggle').click();

    // Check actual network deferral before scrolling or taking full-page screenshots.
    const lastImage = page.locator('.vehicle-card img').last();
    const deferred = await lastImage.getAttribute('data-src');
    check('Task 9: offscreen card retains deferred real URL', !!deferred && (await lastImage.getAttribute('src')).includes('image-placeholder.svg'));
    const afterLoadRequests = requests.length;
    await lastImage.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => { const e = [...document.querySelectorAll('.vehicle-card img')].at(-1); return !e.hasAttribute('data-src') && e.complete && e.naturalWidth > 0; });
    check('Task 9: entering viewport assigns and decodes actual image', await lastImage.getAttribute('src') === deferred);
    check('Task 9: real deferred request occurs after scroll', requests.slice(afterLoadRequests).some(r => r.url.endsWith(deferred)));
    await snap('task-9-lazy.png');
    await visit('inventory.html');
    check('Collection retains all 17 cars', await page.locator('.vehicle-card').count() === 17);
    await page.locator('#vehicleSearch').fill('Porsche');
    check('Task 1: typing immediately filters to two Porsches', await page.locator('.vehicle-card').count() === 2);
    check('Task 3: each matching title highlights its search term', await page.locator('.vehicle-card .card-title mark').count() === 2);
    await page.keyboard.press('Escape');
    await snap('task-1-filter.png');
    await page.locator('#vehicleSearch').fill('Mercedes');
    check('Task 2: autocomplete displays three relevant options', await page.locator('#searchSuggestions [role=option]').count() === 3 && await page.locator('#searchSuggestions').isVisible());
    await snap('task-2-autocomplete.png');
    await page.keyboard.press('ArrowDown');
    const selectedId = await page.locator('#vehicleSearch').getAttribute('aria-activedescendant');
    check('Task 2: ArrowDown exposes active option', !!selectedId && await page.locator('#' + selectedId).getAttribute('aria-selected') === 'true');
    await page.keyboard.press('Enter');
    check('Task 2: Enter chooses suggestion and closes list', await page.locator('.vehicle-card').count() === 1 && await page.locator('#searchSuggestions').isHidden());
    await page.locator('#clearVehicleSearch').click();
    check('Task 1: clear restores complete collection', await page.locator('.vehicle-card').count() === 17);
    await page.locator('#vehicleSearch').fill('PORSCHE');
    check('Task 1: matching is case insensitive', await page.locator('.vehicle-card').count() === 2);
    await page.locator('#searchSuggestions [role=option]').last().click();
    check('Task 2: mouse selection chooses one car', await page.locator('.vehicle-card').count() === 1);
    await page.locator('#vehicleSearch').fill('<img src=x onerror=alert(1)>');
    check('Search treats HTML-like input as text', await page.locator('.vehicle-card').count() === 0 && await page.locator('#inventoryGrid img[src=x]').count() === 0);
    check('Task 1: no-match state offers readable feedback', (await page.locator('.inventory-empty').textContent()).length > 20);
    await page.locator('#clearVehicleSearch').click();
    await page.locator('[data-category=adventure]').click();
    check('Existing category filter returns two adventure cars', await page.locator('.vehicle-card').count() === 2);
    await page.locator('#vehicleSearch').fill('Porsche');
    check('Search combines with active category', await page.locator('.vehicle-card').count() === 0 && await page.locator('#searchSuggestions [role=option]').count() === 0);
    await page.locator('#clearVehicleSearch').click();
    await page.locator('[data-category=all]').click();
    await page.locator('#vehicleSort').selectOption('price-low');
    const sortedIds = await page.locator('.vehicle-card').evaluateAll(es => es.map(e => e.dataset.vehicleId));
    check('Existing sorting preserves numeric price order', await page.evaluate(ids => ids.every((id, i) => !i || Apex.vehicles.find(v => v.id === ids[i - 1]).price <= Apex.vehicles.find(v => v.id === id).price), sortedIds));
    await page.locator('[data-save-vehicle=solis]').click();
    check('Task 7: saving creates truthful notification', (await page.locator('#toastRegion .apex-toast').last().textContent()).includes('saved'));
    await snap('task-7-toast.png');
    await page.mouse.move(5, 5);
    await page.waitForFunction(() => !document.querySelector('#toastRegion .apex-toast'), { timeout: 7000 });
    check('Task 7: notification dismisses after delay', await page.locator('#toastRegion .apex-toast').count() === 0);
    await visit('inventory.html?saved=1');
    check('Saved car persists and saved URL filters correctly', await page.locator('.vehicle-card').count() === 1 && await page.locator('[data-save-vehicle=solis]').getAttribute('aria-pressed') === 'true');

    await visit('about.html');
    await page.locator('#faqSearch').fill('car');
    const expectedMarks = await page.locator('.faq-list').evaluate(e => (e.textContent.match(/car/gi) || []).length);
    check('Task 3: every FAQ occurrence is highlighted', await page.locator('.faq-item mark.search-highlight').count() === expectedMarks && expectedMarks > 1);
    check('Task 3: answers with matches automatically expand', await page.locator('.faq-item').evaluateAll(es => es.every(e => !e.querySelector('mark') || e.open)));
    await verifyFaqHighlightLayout();
    await page.locator('#faqSearch').fill('[');
    check('Task 3: regex punctuation is literal and safe', await page.locator('.faq-item mark').count() === 0 && (await page.locator('#faqSearchStatus').textContent()).includes('0 matches'));
    await page.locator('#clearFaqSearch').click();
    check('Task 3: clearing removes all generated marks', await page.locator('.faq-item mark').count() === 0);
    check('Original four team members retained', await page.locator('.team-card').count() === 4);

    await visit('inquiry.html');
    await page.locator('#nextStep').click();
    check('Invalid inquiry cannot advance or start spinner', await page.locator('#fullName').getAttribute('aria-invalid') === 'true' && await page.locator('.button-spinner').count() === 0);
    await fillInquiry();
    const submitLabel = (await page.locator('#submitInquiry').textContent()).trim();
    const postsBefore = requests.filter(r => r.method === 'POST').length;
    await page.locator('#submitInquiry').click();
    check('Task 6: submit shows spinner and Please wait', await page.locator('#submitInquiry .button-spinner').isVisible() && (await page.locator('#submitInquiry').innerText()).includes('Please wait'));
    check('Task 6: pending submit disabled and form busy', await page.locator('#submitInquiry').isDisabled() && await page.locator('#inquiryForm').getAttribute('aria-busy') === 'true');
    await page.evaluate(() => { document.getElementById('inquiryForm').requestSubmit(); document.getElementById('inquiryForm').requestSubmit(); });
    await snap('task-6-spinner.png');
    await page.locator('#inquirySuccess').waitFor({ state: 'visible' });
    check('Task 6: completed button restores label and enabled state', (await page.locator('#submitInquiry').textContent()).trim() === submitLabel && !(await page.locator('#submitInquiry').isDisabled()));
    check('Task 6: duplicate submissions produce one result', await page.locator('#completedInquiryPreview').count() === 1 && await page.locator('#copyInquiry').count() === 1);
    check('Inquiry result is honest and sends no network data', (await page.locator('#inquirySuccessText').textContent()).includes('no information was sent') && requests.filter(r => r.method === 'POST').length === postsBefore);
    const copyText = await page.locator('#completedInquiryPreview').innerText();
    await page.locator('#copyInquiry').click();
    await page.locator('#copyInquiry .copy-tooltip').waitFor({ state: 'visible' });
    check('Task 8: copy displays checkmark and tooltip', await page.locator('#copyInquiry .copy-icon').innerText() === '✓' && (await page.locator('#copyInquiry .copy-tooltip').innerText()).includes('Copied to clipboard'));
    if (base.protocol !== 'file:') check('Task 8: actual clipboard equals visible inquiry', (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n') === copyText.replace(/\r\n/g, '\n'));
    await snap('task-8-clipboard.png');
    await page.locator('#newInquiry').click();
    check('New inquiry clears personal input and old copy snapshot', await page.locator('#fullName').inputValue() === '' && await page.locator('#copyInquiry').count() === 0);
    await fillInquiry();
    await page.locator('#submitInquiry').click();
    await page.locator('#resetInquiry').click();
    await page.waitForTimeout(1500);
    check('Task 6: reset cancels pending completion', await page.locator('#inquirySuccess').isHidden() && await page.locator('#fullName').isVisible() && await page.locator('#fullName').inputValue() === '' && !(await page.locator('#submitInquiry').isDisabled()));

    await visit('showroom.html');
    await page.locator('#galleryNext').click();
    check('Original showroom next arrow changes image', (await page.locator('#galleryCount').innerText()).includes('02'));
    await page.locator('[data-gallery-src]').nth(2).click();
    check('Original showroom thumbnails select the correct image', await page.locator('#galleryMain').getAttribute('src') === await page.locator('[data-gallery-src]').nth(2).getAttribute('data-gallery-src'));
    await snap('page-showroom.png');
    await page.setViewportSize({ width: 390, height: 844 });
    await visit();
    await snap('page-mobile.png');
    await page.locator('#navToggle').click();
    check('Mobile menu opens', await page.locator('#navToggle').getAttribute('aria-expanded') === 'true');
    await page.keyboard.press('Escape');
    check('Escape closes mobile menu', await page.locator('#navToggle').getAttribute('aria-expanded') === 'false');

    // A separate context proves the CDN fallback instead of benefiting from cache.
    const offline = await browser.newContext({ reducedMotion: 'reduce' });
    await offline.route('https://code.jquery.com/**', route => route.abort());
    await offline.addInitScript(() => { Storage.prototype.getItem = () => { throw new DOMException('Blocked', 'SecurityError'); }; Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); }; });
    const fallback = await offline.newPage(), fallbackErrors = [];
    fallback.on('pageerror', e => fallbackErrors.push(e.message));
    await fallback.goto(new URL('inventory.html', base).href);
    await fallback.waitForFunction(() => !!window.jQuery && document.querySelectorAll('.vehicle-card').length === 17);
    await fallback.locator('#vehicleSearch').fill('Porsche');
    check('CDN blocked: local jQuery fallback supports live search', await fallback.locator('.vehicle-card').count() === 2);
    await fallback.locator('[data-save-vehicle="911"]').click();
    check('Blocked storage: saves remain usable with truthful feedback', await fallback.locator('[data-save-vehicle="911"]').getAttribute('aria-pressed') === 'true' && (await fallback.locator('#savedStatus').textContent()).includes('could not keep'));
    await fallback.goto(new URL('index.html', base).href);
    await fallback.locator('[data-count-to]').first().scrollIntoViewIfNeeded();
    await fallback.waitForFunction(() => [...document.querySelectorAll('[data-count-to]')].every(e => Number(e.textContent) === Number(e.dataset.countTo)));
    check('Reduced motion: counters resolve to their final values', await fallback.locator('[data-counted=true]').count() === 3 && fallbackErrors.length === 0, fallbackErrors.join('\n'));
    await offline.close();
    check('No authored JavaScript or resource errors', errors.length === 0, errors.join('\n'));
  } catch (e) {
    results.push({ label: 'Verification run completed', passed: false, detail: e.stack });
    await page?.screenshot({ path: path.join(shots, 'qa-failure.png') }).catch(() => {});
    process.exitCode = 1;
  } finally {
    const report = { target: entry, channel, timestamp: new Date().toISOString(), passed: results.filter(r => r.passed).length, total: results.length, errors, diagnostics, results };
    fs.writeFileSync(path.join(shots, resultName), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    await browser?.close();
  }
})();
