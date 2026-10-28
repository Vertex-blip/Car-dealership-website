/* End-to-end behavior checks. Install Playwright, then run:
   node tools/verify.cjs [URL] [chrome|msedge]
   Defaults to the self-contained local index.html file. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
let playwright;
try {
  playwright = require('playwright');
} catch {
  const bundled = path.join(process.env.USERPROFILE || '', '.cache', 'codex-runtimes',
    'codex-primary-runtime', 'dependencies', 'node', 'node_modules', 'playwright');
  playwright = require(bundled);
}
const project = path.resolve(__dirname, '..');
const target = process.argv[2] || pathToFileURL(path.join(project, 'index.html')).href;
const channel = process.argv[3] || 'chrome';
const fileMode = target.startsWith('file:');
const captureEvidence = process.env.CAPTURE_EVIDENCE === '1'
  || (process.env.CAPTURE_EVIDENCE !== '0' && channel === 'chrome' && !fileMode);
const evidence = path.join(project, 'screenshots');
fs.mkdirSync(evidence, { recursive: true });
const results = [];
const errors = [];
const check = (label, passed, detail = '') => {
  results.push({ label, passed: Boolean(passed), detail });
  assert.ok(passed, label + (detail ? ': ' + detail : ''));
};

(async () => {
  const browser = await playwright.chromium.launch({ channel, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => {
    const NativeAudio = window.Audio;
    window.__createdSounds = [];
    window.Audio = function (...args) {
      const sound = new NativeAudio(...args);
      window.__createdSounds.push(sound);
      return sound;
    };
    window.Audio.prototype = NativeAudio.prototype;
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', entry => { if (entry.type() === 'error') errors.push(entry.text()); });
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  const snap = async (name, selector) => {
    if (!captureEvidence) return;
    if (selector) {
      const element = page.locator(selector);
      await element.scrollIntoViewIfNeeded();
      await element.locator('img').evaluateAll(images => Promise.all(images.map(image => {
        image.loading = 'eager';
        return image.decode().catch(() => {});
      })));
      await element.screenshot({ path: path.join(evidence, name), animations: 'disabled' });
    } else {
      await page.screenshot({ path: path.join(evidence, name), animations: 'disabled' });
    }
  };
  try {
    await page.goto(target, { waitUntil: 'networkidle' });
    await page.locator('.vehicle-card').first().waitFor();
    check('Six vehicles render from the local data collection', await page.locator('.vehicle-card').count() === 6);
    check('All eagerly loaded images have valid pixels', await page.locator('img:not([loading="lazy"])').evaluateAll(images => images.every(image => !image.getAttribute('src') || image.complete && image.naturalWidth > 0)));
    check('Desktop page has no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await snap('01-home.png');

    const links = page.locator('#main-nav a');
    await links.first().focus();
    await page.keyboard.press('ArrowRight');
    check('ArrowRight moves menu focus forward', await links.nth(1).evaluate(element => element === document.activeElement));
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowLeft');
    check('ArrowLeft wraps menu focus to the last item', await links.last().evaluate(element => element === document.activeElement));
    await page.keyboard.press('Home');
    check('Home focuses the first menu item', await links.first().evaluate(element => element === document.activeElement));
    await snap('11-keyboard.png');

    await page.locator('[data-filter="suv"]').click();
    const suvCount = await page.locator('.vehicle-card').count();
    check('Category filter produces a smaller nonempty selection', suvCount > 0 && suvCount < 6);
    check('Filtering triggers an element animation', await page.locator('#vehicle-grid').evaluate(element => element.getAnimations().length > 0));
    await snap('02-inventory-filtered.png', '#collection');
    await page.locator('#vehicle-search').fill('no vehicle has this name');
    check('Search combines with category to show an honest empty state', await page.locator('.vehicle-card').count() === 0 && await page.locator('#empty-state').isVisible());
    await page.locator('#reset-filters').click();
    check('Reset filters restores the entire collection', await page.locator('.vehicle-card').count() === 6);
    await page.locator('#sort-select').selectOption('price-asc');
    const ascendingPrices = await page.locator('.vehicle-price').allTextContents();
    const numericPrices = ascendingPrices.map(value => Number(value.replace(/[^\d.]/g, '')));
    check('Price ascending sorts the actual rendered listings', numericPrices.every((value, index) => index === 0 || value >= numericPrices[index - 1]));
    await page.locator('#sort-select').selectOption('price-desc');
    const descendingPrices = (await page.locator('.vehicle-price').allTextContents()).map(value => Number(value.replace(/[^\d.]/g, '')));
    check('Price descending reverses the listing order', descendingPrices.every((value, index) => index === 0 || value <= descendingPrices[index - 1]));
    await page.locator('#sort-select').selectOption('featured');
    await page.locator('.save-button').first().click();
    await page.locator('#saved-only').check();
    check('Saved-only filter contains the saved vehicle', await page.locator('.vehicle-card').count() === 1);
    await page.locator('.save-button').first().click();
    check('Removing the last saved vehicle updates the empty state', await page.locator('.vehicle-card').count() === 0);
    await page.locator('#reset-filters').click();

    await page.locator('[data-view-car]').first().click();
    check('Vehicle details open in a modal dialog', await page.locator('#vehicle-dialog').evaluate(dialog => dialog.open));
    const initialSource = await page.locator('#detail-image').getAttribute('src');
    await page.locator('#detail-thumbnails button').nth(1).click();
    check('Thumbnail changes the main image source and meaningful alt', initialSource !== await page.locator('#detail-image').getAttribute('src') && Boolean(await page.locator('#detail-image').getAttribute('alt')));
    await snap('03-gallery.png', '#vehicle-dialog');
    await page.keyboard.press('Escape');
    check('Escape closes the dialog', !await page.locator('#vehicle-dialog').evaluate(dialog => dialog.open));

    const beforeTheme = await page.locator('html').getAttribute('data-theme');
    await page.locator('#theme-toggle').click();
    check('Theme control changes the page theme', await page.locator('html').getAttribute('data-theme') !== beforeTheme);
    await page.locator('[data-rating="4"]').click();
    check('Rating selection updates four stars and the status', await page.locator('[data-rating].is-selected').count() === 4 && /4/.test(await page.locator('#rating-status').textContent()));
    await snap('04-theme-rating.png', '#experience');
    await page.locator('#reset-rating').click();
    check('Rating reset clears the selected stars', await page.locator('[data-rating].is-selected').count() === 0);
    const changedTheme = await page.locator('html').getAttribute('data-theme');
    await page.reload({ waitUntil: 'networkidle' });
    check('Selected theme survives a page reload', await page.locator('html').getAttribute('data-theme') === changedTheme);
    await page.locator('#theme-toggle').click();

    await page.locator('#read-more').click();
    check('Read more reveals extra story content', await page.locator('#story-extra').isVisible());
    await snap('12-story-expanded.png', '#story');
    await page.locator('#read-more').click();
    check('Read more closes the extra content', !await page.locator('#story-extra').isVisible());
    const faq = page.locator('.faq-toggle').first();
    check('FAQs begin collapsed', await faq.getAttribute('aria-expanded') === 'false');
    await faq.click();
    check('FAQ click reveals its associated answer', await faq.getAttribute('aria-expanded') === 'true');
    await snap('13-faq-expanded.png', '#questions');
    await page.locator('#show-time').click();
    check('Time button displays a formatted current time', (await page.locator('#time-feedback').textContent()).trim().length > 0);
    const clock = await page.locator('#current-datetime').textContent();
    await page.waitForTimeout(1150);
    check('Live date and time advances', await page.locator('#current-datetime').textContent() !== clock);
    await page.locator('#sound-button').click();
    await page.waitForTimeout(80);
    check('User click decodes and starts actual audio playback', await page.evaluate(() => window.Apex.sound.readyState >= 2 && !window.Apex.sound.paused && window.Apex.sound.currentTime > 0));
    await page.locator('#sound-button').click();
    await page.locator('#sound-button').click();
    check('Rapid clicks reuse one audio player without overlapping clips', await page.evaluate(() => window.__createdSounds.length === 1 && window.__createdSounds.filter(sound => !sound.paused && !sound.ended).length <= 1));
    check('Sound button supplies playback feedback', (await page.locator('#sound-status').textContent()).trim().length > 0);
    await snap('09-sound-story-faq.png', '#experience');

    await page.locator('#team').scrollIntoViewIfNeeded();
    await page.locator('#team img').evaluateAll(images => Promise.all(images.map(image => {
      image.loading = 'eager';
      return image.decode().catch(() => {});
    })));
    check('All four supplied team portraits decode successfully', await page.locator('#team img').evaluateAll(images => images.length === 4 && images.every(image => image.naturalWidth > 0)));
    await snap('14-team.png', '#team');

    await page.locator('#booking-next').click();
    check('Invalid first step is blocked and identifies errors', await page.locator('[data-step="0"]').isVisible() && await page.locator('#booking-form [aria-invalid="true"]').count() > 0);
    await snap('05-booking-errors.png', '#booking');
    const today = await page.evaluate(() => {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    });
    await page.locator('#booking-vehicle').selectOption({ index: 1 });
    await page.locator('#booking-date').fill(today);
    await page.locator('#booking-time').selectOption({ index: 1 });
    await page.locator('#booking-next').click();
    check('Valid vehicle and date advance to contact step', await page.locator('[data-step="1"]').isVisible());
    await page.locator('#booking-next').click();
    check('Empty contact inputs are rejected', await page.locator('[data-step="1"]').isVisible() && await page.locator('#booking-email').getAttribute('aria-invalid') === 'true');
    await page.locator('#booking-name').fill('Assignment Test');
    await page.locator('#booking-email').fill('invalid-email');
    await page.locator('#booking-phone').fill('+7 701 123 4567');
    await page.locator('#booking-password').fill('short');
    await page.locator('#booking-confirm').fill('different');
    await page.locator('#booking-next').click();
    check('Email, short password and mismatched confirmation are rejected', await page.locator('#booking-email').getAttribute('aria-invalid') === 'true' && await page.locator('#booking-password').getAttribute('aria-invalid') === 'true' && await page.locator('#booking-confirm').getAttribute('aria-invalid') === 'true');
    await page.locator('#booking-email').fill('student@example.com');
    await page.locator('#booking-password').fill('DemoPassword12');
    await page.locator('#booking-confirm').fill('DemoPassword12');
    await snap('06-booking-contact.png', '#booking');
    await page.locator('#booking-back').click();
    check('Back navigation preserves the date and car', await page.locator('#booking-date').inputValue() === today && Boolean(await page.locator('#booking-vehicle').inputValue()));
    await page.locator('#booking-next').click();
    check('Returning to contact preserves entered values', await page.locator('#booking-email').inputValue() === 'student@example.com');
    await page.locator('#booking-next').click();
    check('Review shows safe summary with no password', await page.locator('[data-step="2"]').isVisible() && (await page.locator('#booking-summary').textContent()).includes('student@example.com') && !(await page.locator('#booking-summary').textContent()).includes('DemoPassword12'));
    await snap('07-booking-review.png', '#booking');
    await page.locator('#booking-submit').click();
    check('Review requires consent before completion', !await page.locator('#booking-success').isVisible());
    await page.locator('#booking-consent').check();
    const sameURL = page.url();
    await page.locator('#booking-submit').click();
    check('Successful demo completes without page reload', await page.locator('#booking-success').isVisible() && page.url() === sameURL);
    check('Sensitive password fields clear after completion', await page.locator('#booking-password').inputValue() === '' && await page.locator('#booking-confirm').inputValue() === '');
    await snap('08-booking-success.png', '#booking');
    await page.locator('#book-again').click();
    check('Book again returns to a blank first step', await page.locator('[data-step="0"]').isVisible() && await page.locator('#booking-date').inputValue() === '' && await page.locator('#booking-email').inputValue() === '');
    await page.locator('#booking-vehicle').selectOption({ index: 1 });
    await page.locator('#booking-reset').click();
    check('Reset clears the currently entered form values', await page.locator('#booking-vehicle').inputValue() === '');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => scrollTo(0, 0));
    await page.locator('#menu-toggle').click();
    check('Mobile menu opens with an expanded state', await page.locator('#menu-toggle').getAttribute('aria-expanded') === 'true');
    await page.locator('#main-nav a').first().click();
    check('Selecting mobile navigation closes the menu', await page.locator('#menu-toggle').getAttribute('aria-expanded') === 'false');
    check('Mobile page has no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.evaluate(() => scrollTo(0, 0));
    await snap('10-mobile.png');
    check('No browser JavaScript or missing-resource errors', errors.length === 0, errors.join('\n'));
  } catch (error) {
    results.push({ label: 'Run completed', passed: false, detail: error.stack });
    await page.screenshot({ path: path.join(evidence, 'failure.png'), fullPage: false }).catch(() => {});
    process.exitCode = 1;
  } finally {
    const summary = { target, channel, viewport: '1440x1000 and 390x844', checks: results.length,
      passed: results.filter(result => result.passed).length, errors, results };
    const resultName = process.env.TEST_RESULT_NAME || `test-results-${channel}${fileMode ? '-file' : ''}.json`;
    fs.writeFileSync(path.join(project, resultName), JSON.stringify(summary, null, 2) + '\n');
    console.log(JSON.stringify(summary, null, 2));
    await browser.close();
  }
})();
