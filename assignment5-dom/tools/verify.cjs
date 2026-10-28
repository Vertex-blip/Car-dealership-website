/* Verify the single-page Assignment 5 in a browser.
   node tools/verify.cjs [index URL] [chrome|msedge]
   CAPTURE_EVIDENCE=0 disables screenshots; TEST_RESULT_NAME chooses the result filename. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require(path.join(process.env.USERPROFILE || '', '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', 'playwright')); }
const project = path.resolve(__dirname, '..');
const input = process.argv[2] || pathToFileURL(path.join(project, 'index.html')).href;
const entry = input.endsWith('/') ? new URL('index.html', input).href : input;
const channel = process.argv[3] || 'chrome';
const fileMode = entry.startsWith('file:');
const capture = process.env.CAPTURE_EVIDENCE === '1' || (process.env.CAPTURE_EVIDENCE !== '0' && channel === 'chrome' && !fileMode);
const screenshots = path.join(project, 'screenshots');
const results = [], errors = [], externalRequests = [], frameworkRequests = [], submissions = [];
let browser, page;
fs.mkdirSync(screenshots, {recursive: true});

function check(label, passed, detail = '') {
  results.push({label, passed: Boolean(passed), detail});
  assert.ok(passed, `${label}${detail ? ': ' + detail : ''}`);
}

async function visit(query = '') {
  const url = new URL(entry);
  url.search = query;
  url.hash = '';
  await page.goto(url.href, {waitUntil: 'load', timeout: 60000});
  await page.locator('img').evaluateAll(images => Promise.all(images.map(image => {
    image.loading = 'eager';
    return image.decode();
  })));
}

async function snap(name, selector) {
  if (!capture) return;
  if (selector) {
    const target = page.locator(selector);
    await target.scrollIntoViewIfNeeded();
    await target.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    await target.screenshot({path: path.join(screenshots, name), animations: 'disabled'});
  } else await page.screenshot({path: path.join(screenshots, name), animations: 'disabled'});
}

async function hasOverflow() {
  return page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1
    || [...document.querySelectorAll('h1,h2,h3,p,article,input,select,textarea,button,img,nav')]
      .filter(element => !element.closest('.visually-hidden,.sr-only,.skip-link'))
      .some(element => {
        const rect = element.getBoundingClientRect();
        return rect.width > 1 && rect.height > 1 && (rect.left < -2 || rect.right > innerWidth + 2);
      }));
}

async function startContact(name = 'Assignment Test', email = 'student@example.com') {
  await page.locator('#fullName').fill(name);
  await page.locator('#email').fill(email);
  await page.locator('#nextStep').click();
}

async function readyToReview() {
  await startContact();
  await page.locator('#vehicle').selectOption('atlas');
  await page.locator('#budget').fill('18000000');
  await page.locator('#testDrive').check();
  await page.locator('#message').fill('A morning visit would be useful.');
  await page.locator('#nextStep').click();
}

(async () => {
  browser = await playwright.chromium.launch({channel, headless: true});
  const context = await browser.newContext({viewport: {width: 1440, height: 1000}});
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
  page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', item => { if (item.type() === 'error') errors.push(`${item.text()} ${item.location().url || ''}`.trim()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  page.on('request', request => {
    if (request.method() === 'POST') submissions.push(request.url());
    const url = new URL(request.url());
    if (/\/vendor\/|bootstrap(?:\.bundle)?(?:\.min)?\.(?:css|js)/i.test(url.pathname)) frameworkRequests.push(request.url());
    if (/^https?:/.test(request.url()) && (fileMode || url.origin !== new URL(entry).origin)) externalRequests.push(request.url());
  });
  try {
    await visit();
    const source = fs.readFileSync(path.join(project, 'index.html'), 'utf8');
    const pages = fs.readdirSync(project).filter(name => name.endsWith('.html'));
    check('One HTML page contains every assignment interaction', pages.length === 1 && pages[0] === 'index.html'
      && await page.locator('#inventoryGrid,#inquiryForm,#backgroundButton,#soundButton,#readMoreButton').count() === 5);
    check('No Bootstrap files, CDN, runtime or component attributes are used', !fs.existsSync(path.join(project, 'vendor'))
      && !/(?:bootstrap(?:\.min)?\.(?:css|js)|bootstrap\.bundle|cdn\.jsdelivr|data-bs-)/i.test(source)
      && await page.evaluate(() => typeof window.bootstrap === 'undefined'));
    check('HTML, CSS and JavaScript remain separated without inline authored behavior',
      !/<script\b(?![^>]*\bsrc\s*=)[^>]*>/i.test(source)
      && !/<[^>]+\s(?:style|on(?:click|submit|change|keydown|load))\s*=/i.test(source)
      && await page.locator('link[rel="stylesheet"]').count() > 0 && await page.locator('script[src]').count() >= 1);
    const links = await page.locator('#assignmentNav a').evaluateAll(items => items.map(item => item.getAttribute('href')));
    check('Five navigation links target sections of the same page', links.length === 5 && links.every(href => href.startsWith('#'))
      && await page.evaluate(hrefs => hrefs.every(href => document.getElementById(href.slice(1))), links));
    const footer = await page.locator('footer').textContent();
    check('The original group and four team names remain', ['SE-2507', 'Arsen', 'Kuttibay', 'Farabi', 'Muhammad'].every(text => footer.includes(text)));
    check('Every local image decodes', await page.locator('img').evaluateAll(images => images.every(image => image.naturalWidth > 0)));
    for (const width of [320, 390, 641, 768, 992, 1440]) {
      await page.setViewportSize({width, height: width < 500 ? 844 : 1000});
      check(`All single-page sections fit at ${width}px`, !await hasOverflow());
    }
    const visual = await page.evaluate(() => {
      const hero = document.querySelector('.hero-panel');
      return {heroWidth: hero.getBoundingClientRect().width, heroHeight: hero.getBoundingClientRect().height,
        background: getComputedStyle(document.body).backgroundColor,
        radius: getComputedStyle(document.querySelector('.card')).borderRadius,
        button: getComputedStyle(document.querySelector('.btn-primary')).backgroundColor,
        heading: getComputedStyle(hero.querySelector('h1')).fontFamily,
        text: hero.querySelector('h1').textContent};
    });
    check('Cream, copper, square cards and the Georgia hero preserve the original visual style',
      visual.background === 'rgb(245, 240, 231)' && visual.button === 'rgb(154, 96, 58)' && visual.radius === '0px'
      && visual.heading.includes('Georgia') && visual.text.includes('Considered cars.'), JSON.stringify(visual));
    check('The photographic hero remains full width with its original height', visual.heroWidth === 1440 && visual.heroHeight === 470, JSON.stringify(visual));
    await page.evaluate(() => scrollTo(0, 0));
    await snap('page-home.png');
    await page.evaluate(() => { window.__samePageMarker = 'still-here'; });
    const nav = page.locator('#assignmentNav a');
    for (let index = 0; index < links.length; index++) {
      await nav.nth(index).click();
      check(`Anchor ${links[index]} navigates without reloading`, new URL(page.url()).hash === links[index]
        && await page.evaluate(() => window.__samePageMarker === 'still-here'));
    }
    await nav.first().focus();
    for (const [key, expected] of [['ArrowRight', 1], ['ArrowLeft', 0], ['ArrowLeft', 4], ['ArrowDown', 0], ['ArrowUp', 4], ['Home', 0], ['End', 4]]) {
      await page.keyboard.press(key);
      check(`Menu ${key} focuses item ${expected + 1}`, await nav.nth(expected).evaluate(element => element === document.activeElement));
    }
    await page.evaluate(() => scrollTo(0, 0));
    await snap('page-keyboard.png');
    check('Read more begins hidden', !await page.locator('#readMoreContent').isVisible());
    await page.locator('#readMoreButton').click();
    check('Read more updates display, visibility and accessible state', await page.locator('#readMoreContent').isVisible()
      && await page.locator('#readMoreContent').evaluate(element => element.style.display === 'block')
      && await page.locator('#readMoreButton').getAttribute('aria-expanded') === 'true');
    await snap('page-story-expanded.png', '#about');
    await page.locator('#readMoreButton').click();
    check('Read less hides the same content', !await page.locator('#readMoreContent').isVisible()
      && await page.locator('#readMoreButton').getAttribute('aria-expanded') === 'false');
    check('The original three vehicle objects render as named cards',
      JSON.stringify(await page.locator('.vehicle-card h3').allTextContents()) === JSON.stringify(['Solis GT', 'Meridian S', 'Atlas X']));
    await snap('page-inventory.png', '#inventory');
    for (const [category, id] of [['touring', 'solis'], ['performance', 'meridian'], ['adventure', 'atlas']]) {
      await page.locator(`[data-category="${category}"]`).click();
      check(`${category} filters to its matching card with updated count/state`, await page.locator('.vehicle-card').count() === 1
        && await page.locator('.vehicle-card').getAttribute('data-vehicle-id') === id
        && (await page.locator('#inventoryCount').textContent()).includes('1 vehicle')
        && await page.locator(`[data-category="${category}"]`).getAttribute('aria-pressed') === 'true');
    }
    await snap('page-inventory-filtered.png', '#inventory');
    await page.locator('[data-category="all"]').click();
    check('All vehicles restores all cards with an event-triggered animation', await page.locator('.vehicle-card').count() === 3
      && await page.locator('#inventoryGrid').evaluate(element => element.getAnimations().length > 0));
    await page.waitForFunction(() => document.getElementById('inventoryGrid').getAnimations().length === 0);
    await page.emulateMedia({reducedMotion: 'reduce'});
    await page.locator('[data-category="touring"]').click();
    check('Reduced motion suppresses the JavaScript entrance animation', await page.locator('#inventoryGrid').evaluate(element => element.getAnimations().length === 0));
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.locator('[data-inquire="solis"]').click();
    check('A card preselects its car in the same-page inquiry', await page.locator('#vehicle').inputValue() === 'solis'
      && new URL(page.url()).hash === '#inquiry' && await page.evaluate(() => window.__samePageMarker === 'still-here'));
    await visit('vehicle=not-a-car');
    check('Unknown vehicle parameters are ignored', await page.locator('#vehicle').inputValue() === '');
    await page.locator('#nextStep').click();
    check('Blank contact values block progression with visible errors and focus', await page.locator('[data-inquiry-step="0"]').isVisible()
      && await page.locator('#fullNameError').isVisible() && await page.locator('#emailError').isVisible()
      && await page.locator('#fullName').evaluate(element => element === document.activeElement));
    await snap('page-form-errors.png', '.inquiry-panel');
    await page.locator('#fullName').fill('A');
    await page.locator('#email').fill('not-an-email');
    await page.locator('#nextStep').click();
    check('Short names and invalid email addresses are rejected', await page.locator('#fullName').getAttribute('aria-invalid') === 'true'
      && await page.locator('#email').getAttribute('aria-invalid') === 'true');
    await page.locator('#fullName').fill('Assignment Test');
    await page.locator('#email').fill('student@example.com');
    check('Corrected contact values clear obsolete validation feedback', (await page.locator('#formStatus').textContent()).trim() === '');
    await snap('page-form-contact.png', '.inquiry-panel');
    await page.locator('#nextStep').click();
    check('Valid contact values advance with synchronized progress', await page.locator('[data-inquiry-step="1"]').isVisible()
      && await page.locator('[data-step-label="1"]').getAttribute('aria-current') === 'step'
      && (await page.locator('#inquiryStepCount').textContent()).includes('Step 2'));
    await page.locator('#vehicle').selectOption('atlas');
    await page.locator('#budget').fill('-1');
    await page.locator('#nextStep').click();
    check('Negative budgets are rejected', await page.locator('#budget').getAttribute('aria-invalid') === 'true'
      && await page.locator('[data-inquiry-step="1"]').isVisible());
    await page.locator('#budget').fill('0');
    await page.locator('#nextStep').click();
    check('A zero budget is accepted', await page.locator('[data-inquiry-step="2"]').isVisible());
    await page.locator('#previousStep').click();
    await page.locator('#budget').fill('18000000.50');
    await page.locator('#replyPhone').check();
    check('Phone reply reveals and requires the phone input', await page.locator('#phoneField').isVisible()
      && await page.locator('#phone').getAttribute('required') !== null);
    await page.locator('#nextStep').click();
    check('A phone reply blocks an empty number', await page.locator('#phone').getAttribute('aria-invalid') === 'true');
    await page.locator('#phone').fill('123');
    await page.locator('#nextStep').click();
    check('A phone reply rejects fewer than seven digits', await page.locator('#phone').getAttribute('aria-invalid') === 'true');
    await page.locator('#replyEmail').check();
    check('Email reply hides phone validation and clears obsolete feedback', !await page.locator('#phoneField').isVisible()
      && await page.locator('#phone').isDisabled() && await page.locator('#phone').getAttribute('aria-invalid') === 'false'
      && (await page.locator('#formStatus').textContent()).trim() === '');
    await page.locator('#replyPhone').check();
    await page.locator('#phone').fill('+7 701 123 4567');
    await page.locator('#testDrive').check();
    await page.locator('#message').fill('A morning visit would be useful.');
    check('Corrected preference values clear obsolete validation feedback', (await page.locator('#formStatus').textContent()).trim() === '');
    for (const width of [320, 390]) {
      await page.setViewportSize({width, height: 844});
      check(`Preferences and conditional phone fit at ${width}px`, !await hasOverflow());
    }
    await page.setViewportSize({width: 1440, height: 1000});
    await snap('page-form-preferences.png', '.inquiry-panel');
    await page.locator('#previousStep').click();
    check('Back retains contact values', await page.locator('#fullName').inputValue() === 'Assignment Test'
      && await page.locator('#email').inputValue() === 'student@example.com');
    await page.locator('#nextStep').click();
    check('Returning to preferences retains all values and choices', await page.locator('#vehicle').inputValue() === 'atlas'
      && await page.locator('#budget').inputValue() === '18000000.50' && await page.locator('#replyPhone').isChecked()
      && await page.locator('#testDrive').isChecked() && await page.locator('#phone').inputValue() === '+7 701 123 4567'
      && await page.locator('#message').inputValue() === 'A morning visit would be useful.');
    await page.locator('#nextStep').click();
    const summary = await page.locator('#inquirySummary').textContent();
    check('Review displays the complete contact and preferences summary', await page.locator('[data-inquiry-step="2"]').isVisible()
      && ['Assignment Test', 'student@example.com', 'Atlas X', '18,000,000.5', '+7 701 123 4567', 'Interested', 'A morning visit would be useful.'].every(value => summary.includes(value)));
    await snap('page-form-review.png', '.inquiry-panel');
    await page.locator('#previousStep').click();
    await page.locator('#message').fill('Long-draft-' + 'x'.repeat(580));
    await page.locator('#nextStep').click();
    for (const width of [320, 390]) {
      await page.setViewportSize({width, height: 844});
      check(`Review wraps a long unbroken message at ${width}px`, !await hasOverflow());
    }
    await page.setViewportSize({width: 1440, height: 1000});
    await page.locator('#previousStep').click();
    await page.locator('#message').fill('A morning visit would be useful.');
    await page.locator('#nextStep').click();
    await page.locator('[data-category="all"]').click();
    await page.locator('[data-inquire="meridian"]').click();
    check('A different car returns to contact while preserving the draft', await page.locator('[data-inquiry-step="0"]').isVisible()
      && await page.locator('#vehicle').inputValue() === 'meridian' && await page.locator('#fullName').inputValue() === 'Assignment Test'
      && await page.locator('#phone').inputValue() === '+7 701 123 4567' && await page.locator('#message').inputValue() === 'A morning visit would be useful.');
    await page.locator('#nextStep').click();
    await page.locator('#nextStep').click();
    await page.locator('#email').evaluate(element => { element.value = 'stale-invalid-value'; });
    await page.locator('#submitInquiry').click();
    check('Confirmation revalidates earlier steps and focuses invalid values', await page.locator('[data-inquiry-step="0"]').isVisible()
      && await page.locator('#email').evaluate(element => element === document.activeElement));
    await page.locator('#email').fill('student@example.com');
    await page.locator('#fullName').fill('<b>Plain text</b>');
    await page.locator('#nextStep').click();
    await page.locator('#nextStep').click();
    check('Entered markup remains plain text instead of executable HTML', (await page.locator('#inquirySummary').textContent()).includes('<b>Plain text</b>')
      && await page.locator('#inquirySummary b').count() === 0);
    await page.locator('#resetInquiry').click();
    check('Reset from review clears draft values, choices, errors and step state', await page.locator('[data-inquiry-step="0"]').isVisible()
      && await page.locator('#fullName').inputValue() === '' && await page.locator('#email').inputValue() === ''
      && await page.locator('#vehicle').inputValue() === '' && await page.locator('#budget').inputValue() === ''
      && await page.locator('#message').inputValue() === '' && !await page.locator('#testDrive').isChecked()
      && await page.locator('#replyEmail').isChecked() && await page.locator('.is-invalid').count() === 0);
    await readyToReview();
    const urlBefore = page.url();
    await page.locator('#submitInquiry').click();
    check('A valid preview completes without reload or network submission', await page.locator('#inquirySuccess').isVisible()
      && page.url() === urlBefore && submissions.length === 0);
    check('Success clears personal details and private draft fields', await page.locator('#fullName').inputValue() === ''
      && await page.locator('#email').inputValue() === '' && await page.locator('#phone').inputValue() === ''
      && await page.locator('#message').inputValue() === '');
    await snap('page-form-success.png', '.inquiry-panel');
    await page.locator('[data-inquire="solis"]').click();
    check('A car inquiry after success starts clean with the new selected car', !await page.locator('#inquirySuccess').isVisible()
      && await page.locator('[data-inquiry-step="0"]').isVisible() && await page.locator('#vehicle').inputValue() === 'solis'
      && await page.locator('#email').inputValue() === '');
    await readyToReview();
    await page.locator('#submitInquiry').click();
    await page.locator('#newInquiry').click();
    check('New inquiry returns to a blank first step', await page.locator('[data-inquiry-step="0"]').isVisible()
      && !await page.locator('#inquirySuccess').isVisible() && await page.locator('#vehicle').inputValue() === '');
    await startContact();
    await page.locator('#budget').fill('-2');
    await page.locator('#nextStep').click();
    await page.locator('#resetInquiry').click();
    check('Reset from preferences clears displayed validation errors', await page.locator('[data-inquiry-step="0"]').isVisible()
      && await page.locator('#budget').inputValue() === '' && await page.locator('.is-invalid').count() === 0);
    const initialTime = await page.locator('#timeOutput').textContent();
    await page.locator('#timeButton').click();
    check('The time button displays a real formatted local time', (await page.locator('#timeOutput').textContent()) !== initialTime
      && /\d{2}:\d{2}:\d{2}/.test(await page.locator('#timeOutput').textContent()));
    await page.locator('#soundButton').click();
    await page.waitForFunction(() => window.Apex.sound.currentTime > 0);
    check('A user click decodes and advances the local audio file', await page.evaluate(() => Apex.sound.readyState >= 2 && Apex.sound.currentTime > 0 && Apex.sound.duration > 0));
    await page.evaluate(() => { for (let click = 0; click < 5; click++) document.getElementById('soundButton').click(); });
    await page.waitForFunction(() => document.getElementById('soundButton').dataset.audioState === 'ended');
    check('Rapid sound clicks reuse one player and avoid overlapping clips', await page.evaluate(() => __createdSounds.length === 1 && __createdSounds[0] === Apex.sound)
      && (await page.locator('#soundStatus').textContent()).includes('Notification played'));
    await snap('page-buttons-sound.png', '#interactive-tools');
    for (const [color, label] of [['rgb(255, 253, 249)', 'Paper'], ['rgb(233, 238, 242)', 'Soft blue'], ['rgb(245, 240, 231)', 'Cream']]) {
      await page.locator('#backgroundButton').click();
      await page.waitForFunction(expected => getComputedStyle(document.body).backgroundColor === expected, color);
      check(`Background control applies ${label} and updates its feedback`, await page.evaluate(expected => document.body.style.backgroundColor === expected, color)
        && (await page.locator('#backgroundStatus').textContent()).includes(label));
      if (label === 'Soft blue') await snap('page-background.png', '#inquiry');
    }
    check('All four original team portraits are present and decoded', await page.locator('#team img').count() === 4
      && await page.locator('#team img').evaluateAll(images => images.every(image => image.naturalWidth > 0)));
    await snap('page-team.png', '#team');
    await page.setViewportSize({width: 390, height: 844});
    await page.evaluate(() => scrollTo(0, 0));
    await page.locator('#navToggle').click();
    check('The custom mobile menu opens with synchronized expanded state', await page.locator('#navToggle').getAttribute('aria-expanded') === 'true'
      && await page.locator('#assignmentNav').evaluate(element => element.classList.contains('is-open')));
    await nav.first().focus();
    await page.keyboard.press('ArrowDown');
    check('Arrow navigation works inside the custom mobile menu', await nav.nth(1).evaluate(element => element === document.activeElement));
    await page.keyboard.press('Escape');
    check('Escape closes the custom menu and restores toggle focus', await page.locator('#navToggle').getAttribute('aria-expanded') === 'false'
      && !await page.locator('#assignmentNav').evaluate(element => element.classList.contains('is-open'))
      && await page.locator('#navToggle').evaluate(element => element === document.activeElement));
    await page.locator('#navToggle').click();
    await nav.nth(1).click();
    check('A mobile anchor closes navigation and reaches the same-page inventory', await page.locator('#navToggle').getAttribute('aria-expanded') === 'false'
      && new URL(page.url()).hash === '#inventory');
    await page.evaluate(() => scrollTo(0, 0));
    await snap('page-mobile.png');
    check('No external or framework network resources are requested', externalRequests.length === 0 && frameworkRequests.length === 0,
      [...externalRequests, ...frameworkRequests].join('\n'));
    check('All interactions complete without JavaScript or missing-resource errors', errors.length === 0, errors.join('\n'));
  } catch (error) {
    results.push({label: 'Run completed', passed: false, detail: error.stack});
    if (page) await page.screenshot({path: path.join(screenshots, 'failure.png')}).catch(() => {});
    process.exitCode = 1;
  } finally {
    const summary = {target: entry, channel, fileMode, viewports: [320, 390, 641, 768, 992, 1440], checks: results.length,
      passed: results.filter(result => result.passed).length, errors, externalRequests, frameworkRequests, submissions, results};
    const filename = process.env.TEST_RESULT_NAME || `test-results-${channel}${fileMode ? '-file' : ''}.json`;
    fs.writeFileSync(path.join(project, filename), JSON.stringify(summary, null, 2) + '\n');
    console.log(JSON.stringify({target: entry, channel, checks: summary.checks, passed: summary.passed, errors,
      failed: results.filter(result => !result.passed)}, null, 2));
    if (browser) await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
