/* Browser checks for the Assignment 3 continuation.
   node tools/verify.cjs [base URL] [chrome|msedge]
   CAPTURE_EVIDENCE=0 disables screenshots; TEST_RESULT_NAME chooses a result filename. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {pathToFileURL} = require('node:url');
let playwright;
try { playwright = require('playwright'); }
catch {
  playwright = require(path.join(process.env.USERPROFILE || '', '.cache', 'codex-runtimes',
    'codex-primary-runtime', 'dependencies', 'node', 'node_modules', 'playwright'));
}
const project = path.resolve(__dirname, '..');
const base = process.argv[2] || pathToFileURL(project + path.sep).href;
const channel = process.argv[3] || 'chrome';
const fileMode = base.startsWith('file:');
const capture = process.env.CAPTURE_EVIDENCE === '1'
  || (process.env.CAPTURE_EVIDENCE !== '0' && channel === 'chrome' && !fileMode);
const screenshots = path.join(project, 'screenshots');
const pages = ['index.html', 'typography-cards.html', 'grid-spacing.html', 'carousel.html',
  'bootstrap-cards.html', 'buttons.html', 'responsive-form.html', 'team-grid.html'];
const results = [];
const errors = [];
const externalRequests = [];
const submissions = [];
let browser;
let page;
fs.mkdirSync(screenshots, {recursive: true});

function check(label, passed, detail = '') {
  results.push({label, passed: Boolean(passed), detail});
  assert.ok(passed, `${label}${detail ? ': ' + detail : ''}`);
}

async function visit(name) {
  await page.goto(new URL(name, base).href, {waitUntil: 'load', timeout: 60000});
  await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
}

async function snap(name, selector, fullPage = false) {
  if (!capture) return;
  if (selector) {
    const target = page.locator(selector);
    await target.scrollIntoViewIfNeeded();
    await target.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    await target.screenshot({path: path.join(screenshots, name), animations: 'disabled'});
  } else {
    await page.screenshot({path: path.join(screenshots, name), fullPage, animations: 'disabled'});
  }
}

async function hasOverflow() {
  return page.evaluate(() => {
    const elements = document.querySelectorAll('h1,h2,h3,p,article,input,select,textarea,button,img,nav .container');
    return [...elements].filter(element => !element.closest('.visually-hidden,.visually-hidden-focusable'))
      .some(element => {
        const rect = element.getBoundingClientRect();
        return rect.width > 1 && rect.height > 1 && (rect.left < -2 || rect.right > innerWidth + 2);
      }) || document.documentElement.scrollWidth > innerWidth + 1;
  });
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
  page.on('console', entry => {
    if (entry.type() === 'error') errors.push(`${entry.text()} ${entry.location().url || ''}`.trim());
  });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  page.on('request', request => {
    if (request.method() === 'POST') submissions.push(request.url());
    if (/^https?:/.test(request.url()) && (fileMode || new URL(request.url()).origin !== new URL(base).origin)) {
      externalRequests.push(request.url());
    }
  });

  try {
    const referenceStyle = path.join(project, '..', 'assignment3-bootstrap', 'styles.css');
    if (fs.existsSync(referenceStyle)) {
      const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
      check('The original Assignment 3 stylesheet is preserved byte for byte',
        hash(referenceStyle) === hash(path.join(project, 'styles.css')));
    }
    for (const name of pages) {
      await page.setViewportSize({width: 1440, height: 1000});
      await visit(name);
      const links = await page.locator('#assignmentNav .nav-link').evaluateAll(items => items.map(item => item.getAttribute('href')));
      check(`${name}: all eight original navigation links remain`, JSON.stringify(links) === JSON.stringify(pages));
      const footer = await page.locator('footer').textContent();
      check(`${name}: group and all four team members remain`, ['SE-2507', 'Arsen', 'Kuttibay', 'Farabi', 'Muhammad'].every(text => footer.includes(text)));
      check(`${name}: all local images decode`, await page.locator('img').evaluateAll(images => images.every(image => image.naturalWidth > 0)));
      const source = fs.readFileSync(path.join(project, name), 'utf8');
      check(`${name}: authored HTML has no inline scripts, styles or event attributes`,
        !/<script\b(?![^>]*\bsrc\s*=)[^>]*>/i.test(source)
        && !/<[^>]+\s(?:style|on(?:click|submit|change|keydown|load))\s*=/i.test(source));
      for (const width of [320, 390, 641, 768, 992, 1440]) {
        await page.setViewportSize({width, height: width < 500 ? 844 : 1000});
        check(`${name}: no clipped content or horizontal overflow at ${width}px`, !await hasOverflow());
      }
    }

    await visit('index.html');
    const visual = await page.evaluate(() => ({
      navHeight: document.querySelector('.assignment-navbar').getBoundingClientRect().height,
      heroHeight: document.querySelector('.hero-panel').getBoundingClientRect().height,
      heroTop: document.querySelector('.hero-panel').getBoundingClientRect().top,
      background: getComputedStyle(document.body).backgroundColor,
      radius: getComputedStyle(document.querySelector('.card')).borderRadius,
      button: getComputedStyle(document.querySelector('.btn-primary')).backgroundColor,
      heading: getComputedStyle(document.querySelector('.hero-panel h1')).fontFamily,
      text: document.querySelector('.hero-panel h1').textContent
    }));
    check('Homepage keeps the original 66px navbar and 470px full-width hero',
      visual.navHeight === 66 && visual.heroHeight === 470 && visual.heroTop === 66, JSON.stringify(visual));
    check('Homepage keeps the original cream, copper, square cards and Georgia hero',
      visual.background === 'rgb(245, 240, 231)' && visual.button === 'rgb(154, 96, 58)'
      && visual.radius === '0px' && visual.heading.includes('Georgia') && visual.text.includes('Considered cars.'));
    await snap('page-home.png');
    const nav = page.locator('#assignmentNav .nav-link');
    await nav.first().focus();
    for (const [key, expected] of [['ArrowRight', 1], ['ArrowLeft', 0], ['ArrowLeft', 7],
      ['ArrowDown', 0], ['ArrowUp', 7], ['Home', 0], ['End', 7]]) {
      await page.keyboard.press(key);
      check(`Menu ${key} focuses item ${expected + 1}`, await nav.nth(expected).evaluate(element => element === document.activeElement));
    }
    await snap('page-keyboard.png');
    check('Read more begins hidden', !await page.locator('#readMoreContent').isVisible());
    await page.locator('#readMoreButton').click();
    check('Read more changes display, content visibility and expanded state',
      await page.locator('#readMoreContent').isVisible()
      && await page.locator('#readMoreContent').evaluate(element => element.style.display === 'block')
      && await page.locator('#readMoreButton').getAttribute('aria-expanded') === 'true');
    await snap('page-story-expanded.png', 'section[aria-labelledby="assignment-heading"]');
    await page.locator('#readMoreButton').click();
    check('Read less hides the same content again', !await page.locator('#readMoreContent').isVisible()
      && await page.locator('#readMoreButton').getAttribute('aria-expanded') === 'false');

    await visit('bootstrap-cards.html');
    check('The original three named inventory cards render from objects',
      JSON.stringify(await page.locator('.vehicle-card h2').allTextContents()) === JSON.stringify(['Solis GT', 'Meridian S', 'Atlas X']));
    await snap('page-inventory.png', 'main');
    for (const [category, id] of [['touring', 'solis'], ['performance', 'meridian'], ['adventure', 'atlas']]) {
      await page.locator(`[data-category="${category}"]`).click();
      check(`${category} filters to its matching card and updates count/state`,
        await page.locator('.vehicle-card').count() === 1
        && await page.locator('.vehicle-card').getAttribute('data-vehicle-id') === id
        && (await page.locator('#inventoryCount').textContent()).includes('1 vehicle')
        && await page.locator(`[data-category="${category}"]`).getAttribute('aria-pressed') === 'true');
    }
    await snap('page-inventory-filtered.png', 'main');
    await page.locator('[data-category="all"]').click();
    check('All vehicles restores three cards and triggers an entrance animation',
      await page.locator('.vehicle-card').count() === 3
      && await page.locator('#inventoryGrid').evaluate(element => element.getAnimations().length > 0));
    await page.waitForFunction(() => document.getElementById('inventoryGrid').getAnimations().length === 0);
    await page.emulateMedia({reducedMotion: 'reduce'});
    await page.locator('[data-category="touring"]').click();
    check('Reduced-motion mode disables the JavaScript entrance animation',
      await page.locator('#inventoryGrid').evaluate(element => element.getAnimations().length === 0));
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.locator('.vehicle-card a').click();
    await page.waitForURL('**/responsive-form.html?vehicle=solis');
    check('Ask about this car preselects the matching inquiry vehicle', await page.locator('#vehicle').inputValue() === 'solis');
    await visit('responsive-form.html?vehicle=not-a-car');
    check('Unknown vehicle query parameters are ignored', await page.locator('#vehicle').inputValue() === '');

    await page.locator('#nextStep').click();
    check('Blank contact details block progression with visible field errors',
      await page.locator('[data-inquiry-step="0"]').isVisible()
      && await page.locator('#fullNameError').isVisible() && await page.locator('#emailError').isVisible()
      && await page.locator('#fullName').evaluate(element => element === document.activeElement));
    await snap('page-form-errors.png', '.inquiry-panel');
    await page.locator('#fullName').fill('A');
    await page.locator('#email').fill('not-an-email');
    await page.locator('#nextStep').click();
    check('Short name and invalid email are rejected', await page.locator('#fullName').getAttribute('aria-invalid') === 'true'
      && await page.locator('#email').getAttribute('aria-invalid') === 'true');
    await page.locator('#fullName').fill('Assignment Test');
    await page.locator('#email').fill('student@example.com');
    check('Correcting contact errors clears obsolete validation feedback',
      (await page.locator('#formStatus').textContent()).trim() === '');
    await snap('page-form-contact.png', '.inquiry-panel');
    await page.locator('#nextStep').click();
    check('Valid contact details advance to preferences with matching progress',
      await page.locator('[data-inquiry-step="1"]').isVisible()
      && await page.locator('[data-step-label="1"]').getAttribute('aria-current') === 'step'
      && (await page.locator('#inquiryStepCount').textContent()).includes('Step 2'));
    await page.locator('#vehicle').selectOption('atlas');
    await page.locator('#budget').fill('-1');
    await page.locator('#nextStep').click();
    check('A negative budget is rejected', await page.locator('#budget').getAttribute('aria-invalid') === 'true'
      && await page.locator('[data-inquiry-step="1"]').isVisible());
    await page.locator('#budget').fill('0');
    await page.locator('#nextStep').click();
    check('Zero is accepted as a valid budget', await page.locator('[data-inquiry-step="2"]').isVisible());
    await page.locator('#previousStep').click();
    await page.locator('#budget').fill('18000000.50');
    await page.locator('#replyPhone').check();
    check('Phone reply reveals and requires a phone number', await page.locator('#phoneField').isVisible()
      && await page.locator('#phone').getAttribute('required') !== null);
    await page.locator('#nextStep').click();
    check('Phone reply blocks an empty phone number', await page.locator('#phone').getAttribute('aria-invalid') === 'true');
    await page.locator('#phone').fill('123');
    await page.locator('#nextStep').click();
    check('Phone reply rejects fewer than seven digits', await page.locator('#phone').getAttribute('aria-invalid') === 'true');
    await page.locator('#replyEmail').check();
    check('Email reply hides and disables phone validation cleanly', !await page.locator('#phoneField').isVisible()
      && await page.locator('#phone').isDisabled() && await page.locator('#phone').getAttribute('aria-invalid') === 'false'
      && (await page.locator('#formStatus').textContent()).trim() === '');
    await page.locator('#replyPhone').check();
    await page.locator('#phone').fill('+7 701 123 4567');
    await page.locator('#testDrive').check();
    await page.locator('#message').fill('A morning visit would be useful.');
    check('Correcting preference errors clears obsolete validation feedback',
      (await page.locator('#formStatus').textContent()).trim() === '');
    await snap('page-form-preferences.png', '.inquiry-panel');
    await page.locator('#previousStep').click();
    check('Back retains contact data', await page.locator('#fullName').inputValue() === 'Assignment Test'
      && await page.locator('#email').inputValue() === 'student@example.com');
    await page.locator('#nextStep').click();
    check('Returning to preferences retains every input and checkbox',
      await page.locator('#vehicle').inputValue() === 'atlas'
      && await page.locator('#budget').inputValue() === '18000000.50'
      && await page.locator('#replyPhone').isChecked() && await page.locator('#testDrive').isChecked()
      && await page.locator('#phone').inputValue() === '+7 701 123 4567'
      && await page.locator('#message').inputValue() === 'A morning visit would be useful.');
    await page.locator('#nextStep').click();
    const summary = await page.locator('#inquirySummary').textContent();
    check('Review displays contact, vehicle, decimal budget, reply, test-drive and message values',
      await page.locator('[data-inquiry-step="2"]').isVisible()
      && ['Assignment Test', 'student@example.com', 'Atlas X', '18,000,000.5', '+7 701 123 4567',
        'Interested', 'A morning visit would be useful.'].every(value => summary.includes(value)));
    await snap('page-form-review.png', '.inquiry-panel');
    await page.locator('#email').evaluate(element => { element.value = 'stale-invalid-value'; });
    await page.locator('#submitInquiry').click();
    check('Final submission revalidates earlier steps and returns to the invalid field',
      await page.locator('[data-inquiry-step="0"]').isVisible()
      && await page.locator('#email').evaluate(element => element === document.activeElement));
    await page.locator('#email').fill('student@example.com');
    await page.locator('#fullName').fill('<b>Plain text</b>');
    await page.locator('#nextStep').click();
    await page.locator('#nextStep').click();
    check('Entered markup remains plain text in the review',
      (await page.locator('#inquirySummary').textContent()).includes('<b>Plain text</b>')
      && await page.locator('#inquirySummary b').count() === 0);
    await page.locator('#resetInquiry').click();
    check('Reset from review clears all fields, errors and step state',
      await page.locator('[data-inquiry-step="0"]').isVisible()
      && await page.locator('#fullName').inputValue() === '' && await page.locator('#email').inputValue() === ''
      && await page.locator('#vehicle').inputValue() === '' && await page.locator('#budget').inputValue() === ''
      && await page.locator('#message').inputValue() === '' && !await page.locator('#testDrive').isChecked()
      && await page.locator('#replyEmail').isChecked() && await page.locator('.is-invalid').count() === 0);
    await readyToReview();
    const urlBefore = page.url();
    await page.locator('#submitInquiry').click();
    check('A valid inquiry completes locally without navigation or POST',
      await page.locator('#inquirySuccess').isVisible() && page.url() === urlBefore && submissions.length === 0);
    check('Success clears personal contact details and private draft fields',
      await page.locator('#fullName').inputValue() === '' && await page.locator('#email').inputValue() === ''
      && await page.locator('#phone').inputValue() === '' && await page.locator('#message').inputValue() === '');
    await snap('page-form-success.png', '.inquiry-panel');
    await page.locator('#newInquiry').click();
    check('New inquiry returns to a blank first step', await page.locator('[data-inquiry-step="0"]').isVisible()
      && !await page.locator('#inquirySuccess').isVisible() && await page.locator('#vehicle').inputValue() === '');
    await startContact();
    await page.locator('#budget').fill('-2');
    await page.locator('#nextStep').click();
    await page.locator('#resetInquiry').click();
    check('Reset from preferences clears a displayed validation error',
      await page.locator('[data-inquiry-step="0"]').isVisible()
      && await page.locator('#budget').inputValue() === '' && await page.locator('.is-invalid').count() === 0);

    await visit('buttons.html');
    const initialTime = await page.locator('#timeOutput').textContent();
    await page.locator('#timeButton').click();
    check('Time button updates the designated output with a real formatted time',
      (await page.locator('#timeOutput').textContent()) !== initialTime
      && /\d{2}:\d{2}:\d{2}/.test(await page.locator('#timeOutput').textContent()));
    await page.locator('#soundButton').click();
    await page.waitForFunction(() => window.Apex.sound.currentTime > 0, {timeout: 5000});
    check('A user click decodes and advances actual local audio', await page.evaluate(() =>
      Apex.sound.readyState >= 2 && Apex.sound.currentTime > 0 && Apex.sound.duration > 0));
    await page.evaluate(() => { for (let click = 0; click < 5; click++) document.getElementById('soundButton').click(); });
    await page.waitForFunction(() => document.getElementById('soundButton').dataset.audioState === 'ended');
    check('Rapid sound clicks reuse one player and complete without overlap or errors',
      await page.evaluate(() => __createdSounds.length === 1 && __createdSounds[0] === Apex.sound)
      && (await page.locator('#soundStatus').textContent()).includes('Notification played'));
    await snap('page-buttons-sound.png', 'main');
    for (const [color, label] of [['rgb(255, 253, 249)', 'Paper'], ['rgb(233, 238, 242)', 'Soft blue'], ['rgb(245, 240, 231)', 'Cream']]) {
      await page.locator('#backgroundButton').click();
      await page.waitForFunction(expected => getComputedStyle(document.body).backgroundColor === expected, color);
      check(`Background button applies ${label} directly and updates feedback`,
        await page.evaluate(expected => document.body.style.backgroundColor === expected, color)
        && (await page.locator('#backgroundStatus').textContent()).includes(label));
      if (label === 'Soft blue') await snap('page-background.png', 'main');
    }

    await visit('carousel.html');
    check('All nine original carousel slides and indicators remain',
      await page.locator('.carousel-item').count() === 9 && await page.locator('[data-bs-slide-to]').count() === 9);
    await page.locator('.carousel-control-next').click();
    await page.waitForFunction(() => [...document.querySelectorAll('.carousel-item')].findIndex(item => item.classList.contains('active')) === 1
      && !document.querySelector('.carousel-item-next,.carousel-item-prev'));
    check('Bootstrap carousel next control works', await page.locator('.carousel-item').nth(1).evaluate(element => element.classList.contains('active')));
    await page.locator('.carousel-control-prev').click();
    await page.waitForFunction(() => document.querySelector('.carousel-item').classList.contains('active')
      && !document.querySelector('.carousel-item-next,.carousel-item-prev'));
    check('Bootstrap carousel previous control works', await page.locator('.carousel-item').first().evaluate(element => element.classList.contains('active')));
    await page.locator('[data-bs-slide-to="8"]').click();
    await page.waitForFunction(() => [...document.querySelectorAll('.carousel-item')].findIndex(item => item.classList.contains('active')) === 8
      && !document.querySelector('.carousel-item-next,.carousel-item-prev'));
    check('Bootstrap carousel indicator selects the ninth photograph', await page.locator('[data-bs-slide-to="8"]').getAttribute('aria-current') === 'true');
    await page.locator('.carousel-control-next').focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => document.querySelector('.carousel-item').classList.contains('active')
      && !document.querySelector('.carousel-item-next,.carousel-item-prev'));
    check('Bootstrap carousel keyboard arrow wraps from last to first', await page.locator('.carousel-item').first().evaluate(element => element.classList.contains('active')));
    await snap('page-carousel.png', 'main');

    await visit('team-grid.html');
    check('All four original team portraits are present and decoded',
      await page.locator('.team-card img').count() === 4
      && await page.locator('.team-card img').evaluateAll(images => images.every(image => image.naturalWidth > 0)));
    await snap('page-team.png', 'main');
    await visit('typography-cards.html');
    await snap('page-typography.png', 'main');
    await visit('grid-spacing.html');
    await snap('page-grid.png', 'main');
    await visit('index.html');
    await page.setViewportSize({width: 390, height: 844});
    await page.locator('.navbar-toggler').click();
    await page.waitForFunction(() => document.getElementById('assignmentNav').classList.contains('show'));
    check('Local Bootstrap opens the mobile navigation with correct expanded state', await page.locator('.navbar-toggler').getAttribute('aria-expanded') === 'true');
    await nav.first().focus();
    await page.keyboard.press('ArrowDown');
    check('Arrow navigation also works inside the expanded mobile menu', await nav.nth(1).evaluate(element => element === document.activeElement));
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.getElementById('assignmentNav').classList.contains('show'));
    check('Escape closes mobile navigation and restores toggler focus',
      await page.locator('.navbar-toggler').getAttribute('aria-expanded') === 'false'
      && await page.locator('.navbar-toggler').evaluate(element => element === document.activeElement));
    await snap('page-mobile.png');
    check('No external network dependencies are requested', externalRequests.length === 0, externalRequests.join('\n'));
    check('All pages and interactions complete without JavaScript or resource errors', errors.length === 0, errors.join('\n'));
  } catch (error) {
    results.push({label: 'Run completed', passed: false, detail: error.stack});
    if (page) await page.screenshot({path: path.join(screenshots, 'failure.png'), fullPage: false}).catch(() => {});
    process.exitCode = 1;
  } finally {
    const summary = {target: base, channel, fileMode, viewports: [320, 390, 641, 768, 992, 1440],
      checks: results.length, passed: results.filter(result => result.passed).length,
      errors, externalRequests, submissions, results};
    const filename = process.env.TEST_RESULT_NAME || `test-results-${channel}${fileMode ? '-file' : ''}.json`;
    fs.writeFileSync(path.join(project, filename), JSON.stringify(summary, null, 2) + '\n');
    console.log(JSON.stringify({target: base, channel, checks: summary.checks, passed: summary.passed,
      errors, failed: results.filter(result => !result.passed)}, null, 2));
    if (browser) await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
