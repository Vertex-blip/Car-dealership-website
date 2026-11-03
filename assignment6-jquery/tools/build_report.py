"""Generate the Assignment 6 PDF from literal current source and real browser evidence.
Run only after tools/verify.cjs succeeds. ReportLab + Pillow are required.
"""
from pathlib import Path
from xml.sax.saxutils import escape
import hashlib
import json
import textwrap
from PIL import Image, ImageDraw, ImageFont
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parents[1]
SHOTS = ROOT / 'screenshots'
OUTPUT = ROOT / 'Assignment-6-Report.pdf'
SITE = 'https://vertex-blip.github.io/Car-dealership-website/assignment6-jquery/'
REPO = 'https://github.com/Vertex-blip/Car-dealership-website'
FONTS = Path('C:/Windows/Fonts')
for name, file in [('Arial', 'arial.ttf'), ('ArialBold', 'arialbd.ttf'), ('Georgia', 'georgia.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(FONTS / file)))
pdfmetrics.registerFontFamily('Arial', normal='Arial', bold='ArialBold', italic='Arial', boldItalic='ArialBold')
W, H = A4
M = 42
WIDTH = W - 2 * M
INK = colors.HexColor('#18262a')
BLUE = colors.HexColor('#087fbd')
MUTED = colors.HexColor('#5a696d')
LIGHT = colors.HexColor('#edf3f4')
BODY = ParagraphStyle('body', fontName='Arial', fontSize=9.3, leading=13.5, textColor=INK)
SMALL = ParagraphStyle('small', parent=BODY, fontSize=7.7, leading=10.5, textColor=MUTED)
LEAD = ParagraphStyle('lead', parent=BODY, fontSize=12.5, leading=18, textColor=MUTED)
record = json.loads((SHOTS / 'test-results.json').read_text(encoding='utf-8'))
assert record['passed'] == record['total'] and not record['errors'], 'Current local verification must pass before report generation.'
deployment = json.loads((ROOT / 'deployment.json').read_text(encoding='utf-8')) if (ROOT / 'deployment.json').exists() else {}
live = json.loads((SHOTS / 'test-results-live.json').read_text(encoding='utf-8')) if (SHOTS / 'test-results-live.json').exists() else {}
published = (deployment.get('status') == 'published'
             and deployment.get('workflow_conclusion') == 'success'
             and deployment.get('site_url') == SITE
             and live.get('total', 0) > 0
             and live.get('passed') == live.get('total')
             and not live.get('errors')
             and live.get('timestamp', '') >= deployment.get('deployed_at', ''))
evidence = {}

def para(c, text, y, style=BODY, x=M, width=WIDTH):
    p = Paragraph(text, style)
    _, height = p.wrap(width, H)
    assert y - height >= 42, f'Paragraph overflow at y={y}: {text[:70]}'
    p.drawOn(c, x, y - height)
    return y - height - 8

def frame(c, section, number):
    c.setFillColor(INK)
    c.setFont('ArialBold', 9)
    c.drawString(M, H - 30, 'APEX / MOTORS')
    c.setFillColor(MUTED)
    c.setFont('Arial', 8)
    c.drawRightString(W - M, H - 30, 'ASSIGNMENT 6  /  JQUERY')
    c.setStrokeColor(colors.HexColor('#d9e3e5'))
    c.line(M, H - 41, W - M, H - 41)
    c.line(M, 32, W - M, 32)
    c.setFont('Arial', 7)
    c.drawString(M, 21, f'SE-2507  |  {section}')
    c.drawRightString(W - M, 21, f'{number:02d}')

def heading(c, eyebrow, title, number):
    frame(c, eyebrow, number)
    c.setFillColor(BLUE)
    c.setFont('ArialBold', 9)
    c.drawString(M, H - 66, eyebrow.upper())
    c.setFillColor(INK)
    c.setFont('Georgia', 25)
    c.drawString(M, H - 98, title)
    return H - 117

def picture(c, file, y, height=218, caption='', crop=None):
    image = Image.open(file)
    if crop:
        image = image.crop(crop)  # Enlarge a literal UI region; retain the untouched original evidence.
    iw, ih = image.size
    scale = min(WIDTH / iw, height / ih)
    dw, dh = iw * scale, ih * scale
    x = M + (WIDTH - dw) / 2
    c.setFillColor(LIGHT)
    c.roundRect(M, y - height, WIDTH, height, 5, fill=1, stroke=0)
    c.drawImage(ImageReader(image), x, y - (height + dh) / 2, width=dw, height=dh)
    evidence[file.name] = hashlib.sha256(file.read_bytes()).hexdigest()
    y -= height + 6
    if caption:
        y = para(c, escape(caption), y, SMALL)
    return y

def source_image(task, snippets):
    """Render exact source excerpts, retaining file names and real line numbers."""
    rows = []
    for name, anchor, count in snippets:
        lines = (ROOT / name).read_text(encoding='utf-8').splitlines()
        start = next(i for i, line in enumerate(lines) if anchor in line)
        rows.append(('title', f'{name}  |  lines {start + 1}-{min(len(lines), start + count)}'))
        excerpt = lines[start:start + count]
        indent = min((len(line) - len(line.lstrip()) for line in excerpt if line.strip()), default=0)
        for i, line in enumerate(excerpt, start + 1):
            content = line[indent:]
            wrapped = textwrap.wrap(content, width=103, replace_whitespace=False, drop_whitespace=False) or ['']
            for part, value in enumerate(wrapped):
                rows.append(('code', f'{i:>3}  {value}' if part == 0 else f'     {value}'))
    font = ImageFont.truetype(str(FONTS / 'consola.ttf'), 19)
    symbols = ImageFont.truetype(str(FONTS / 'seguisym.ttf'), 19)
    label = ImageFont.truetype(str(FONTS / 'arialbd.ttf'), 19)
    width = 1230
    height = 24 + sum(33 if kind == 'title' else 24 for kind, _ in rows)
    image = Image.new('RGB', (width, height), '#152327')
    draw = ImageDraw.Draw(image)
    y = 10
    for kind, text in rows:
        draw.text((18, y), text, font=label if kind == 'title' else font, fill='#77d3f2' if kind == 'title' else '#edf4f4')
        if kind == 'code':
            for index, character in enumerate(text):
                if ord(character) > 127:
                    left = 18 + draw.textlength(text[:index], font=font)
                    right = left + draw.textlength(character, font=font)
                    draw.rectangle((left, y, right, y + 23), fill='#152327')
                    draw.text((left, y), character, font=symbols, fill='#edf4f4')
        y += 33 if kind == 'title' else 24
    output = SHOTS / f'code-task-{task}.png'
    image.save(output)
    return output

TASKS = [
    dict(n=0, title='Ready for jQuery.', goal='Load the exact library required by the brief, then initialize interactions after the DOM is ready.', steps=[
        'Add the jQuery 4.0.0 CDN script to the head of all five HTML pages. Keep a local fallback for the downloadable ZIP.',
        'Load external script.js after the library. Place shared initialization inside $(document).ready().',
        'Print the exact message "jQuery is ready!". The browser checks confirm this message on every page and verify version 4.0.0.'
    ], shot='task-0-home.png', caption='Home page running with jQuery; the same setup is shared by all five pages.', snippets=[('index.html', 'https://code.jquery.com', 3), ('script.js', '$(document).ready', 4)]),
    dict(n=1, title='Search as you type.', goal='Filter the real 17-vehicle collection immediately, without reloading or submitting a search form.', steps=[
        'Listen to the search input with jQuery .on("input") so typing, pasting and clearing all update the collection.',
        'Combine the text query with the active category and saved-car state, then render the matching vehicle objects.',
        'Update the result count, highlight matching titles and show a useful empty state. Clearing restores all applicable cards.'
    ], shot='task-1-filter.png', caption='Typing Porsche displays the two matching vehicles and highlighted names.', snippets=[('js/inventory.js', 'const selectedVehicles =', 6), ('js/inventory.js', '$(searchInput).on("input"', 5)]),
    dict(n=2, title='Find the right name.', goal='Offer useful autocomplete suggestions while keeping the search usable with a keyboard and mouse.', steps=[
        'Build a maximum of six suggestions from the same vehicle data and active filters. Give each option a stable ID.',
        'Expose combobox, listbox and selected-option ARIA state. Arrow keys select; Enter accepts; Escape or Tab closes.',
        'A mouse click chooses the same suggestion. The selected full name fills the field and filters the cards immediately.'
    ], shot='task-2-autocomplete.png', caption='Three Mercedes suggestions appear beneath the active search field.', snippets=[('js/inventory.js', 'function showSuggestions()', 10), ('js/inventory.js', 'function selectSuggestion(index)', 7)]),
    dict(n=3, title='Make every match visible.', goal='Highlight all literal keyword occurrences in FAQ questions and answers, while preserving the original markup.', steps=[
        'Remove only previously generated mark elements, normalize text nodes, and escape regex metacharacters in the query.',
        'Walk eligible text nodes and wrap each match in a mark element. Keep the whole question in one text wrapper so highlighted fragments remain inline beside the separate icon.',
        'Open answers containing matches, announce the total and restore previous open states when the search is cleared.'
    ], shot='task-3-highlighting.png', caption='The FAQ shows all occurrences of car, including matches inside expanded answers.', snippets=[('js/search.js', 'const escaped =', 8), ('js/search.js', 'const mark = document.createElement', 6)]),
    dict(n=4, title='A sense of progress.', goal='Show a colorful reading progress bar that responds to scrolling, resizing and changes in page height.', steps=[
        'Insert a fixed gradient progress bar with an accessible 0-100 value on every page.',
        'Calculate scroll position divided by available scroll distance. Clamp the percentage and handle a page with no scrollable distance.',
        'Update width and aria-valuenow on scroll and resize; ResizeObserver also handles content height changes after filtering.'
    ], shot='task-4-progress.png', caption='At the bottom of the page the colored progress bar is completely filled.', snippets=[('script.js', 'function updateProgress()', 10)]),
    dict(n=5, title='Numbers with meaning.', goal='Animate real project statistics: 17 vehicles, three driving styles and four team members.', steps=[
        'Keep each final value in data-count-to and display a starting value of zero.',
        'Start a jQuery numeric animation when the statistics enter the viewport; update the displayed integer at each step.',
        'Finish on the exact target and mark the counter as counted so it runs once. Reduced-motion preference resolves immediately.'
    ], shot='task-5-counters.png', caption='The counters settle on factual collection and team totals.', snippets=[('script.js', 'function animateCounter(element)', 13)]),
    dict(n=6, title='Submit with confidence.', goal='Give clear feedback during a simulated form submission and prevent duplicate actions.', steps=[
        'Validate the existing three-step inquiry. A valid submit starts a 1.3-second classroom simulation.',
        'Show a spinner and Please wait, mark the form busy, disable submission and editing, and ignore repeated submits.',
        'Restore the original button state and show the local preview after completion. Reset cancels the pending timer and clears the form.'
    ], shot='task-6-spinner.png', caption='The pending inquiry shows Please wait and a visible spinner; the submit button is disabled.', snippets=[('js/booking.js', 'function startSubmit()', 13), ('js/booking.js', 'if (pending || form.hidden)', 1)]),
    dict(n=7, title='A small confirmation.', goal='Confirm actions with temporary notifications that appear smoothly and disappear automatically.', steps=[
        'Create toast content safely with jQuery and insert it into a polite live region.',
        'Fade in the message after saving a vehicle, copying text or completing an inquiry. Keep no more than three notifications.',
        'Fade out after 4.2 seconds or allow manual dismissal. Hover and focus pause the timer so the message can be read.'
    ], shot='task-7-toast.png', caption='Saving a vehicle produces a visible, truthful confirmation.', snippets=[('script.js', '$toast.find("p").text(message)', 9)]),
    dict(n=8, title='Copy it. Keep it.', goal='Copy the actual visible snippet and confirm success with a checkmark and tooltip.', steps=[
        'Read the text associated with the Copy button. Prefer navigator.clipboard.writeText in a secure context.',
        'If unavailable, attempt a selected-text copy fallback. Report failure clearly if copying is denied.',
        'Only after a successful write, replace the icon with a checkmark and show Copied to clipboard. Restore the button after a short delay.'
    ], shot='task-8-clipboard.png', caption='The completed inquiry preview can be copied; checkmark and tooltip confirm success.', snippets=[('script.js', 'await writeClipboard(value)', 9)]),
    dict(n=9, title='Load when it matters.', goal='Defer offscreen photographs until they enter the viewport, reducing unnecessary initial image requests.', steps=[
        'Keep the real image URL in data-src and use a local placeholder with fixed dimensions to avoid layout shifts.',
        'Observe images entering the viewport, then use jQuery .attr("src", source) to request the real image. New filtered cards are observed too.',
        'Unobserve loaded images and handle errors with the placeholder. A scroll/resize visibility check supports browsers without IntersectionObserver.'
    ], shot='task-9-lazy.png', caption='The last collection images load when scrolled into view; network checks confirm the request was deferred.', snippets=[('script.js', 'function loadImage(image)', 9), ('script.js', 'const imageObserver =', 3)]),
]

c = canvas.Canvas(str(OUTPUT), pagesize=A4)
c.setTitle('Apex Motors - Assignment 6: jQuery')
c.setAuthor('Apex Motors - Arsen, Kuttibay, Farabi, Muhammad - SE-2507')
frame(c, 'Project report', 1)
c.setFillColor(BLUE)
c.setFont('ArialBold', 10)
c.drawString(M, H - 80, 'CONTINUING THE APEX MOTORS EXPERIENCE')
c.setFillColor(INK)
c.setFont('Georgia', 37)
c.drawString(M, H - 131, 'Assignment 6.')
c.drawString(M, H - 178, 'jQuery, in motion.')
y = para(c, 'A polished dealership experience with live search, responsive feedback and purposeful interactions.', H - 200, LEAD)
y = picture(c, SHOTS / 'task-0-home.png', y - 10, 244)
y = para(c, '<b>Team:</b> Apex Motors &nbsp;&nbsp; <b>Group:</b> SE-2507<br/><b>Members:</b> Arsen, Kuttibay, Farabi, Muhammad', y - 14)
y = para(c, '<b>Objective.</b> Continue the existing dealership project and use jQuery to simplify DOM manipulation, event handling and animation. This report covers every numbered task from 0 to 9 and the deployment requirement.', y)
y = para(c, '<b>Scope.</b> Five linked HTML pages, the original 17-car collection, local photographs, shared JavaScript and responsive CSS. The inquiry is a browser-local demonstration and sends no personal data.', y)
y = para(c, '<b>Website:</b> <link href="' + SITE + '" color="#087fbd">' + SITE + '</link>', y, SMALL)
para(c, 'Prepared for the 5 November 2026 submission. Browser evidence is generated from the delivered source, with precise test records retained in screenshots/.', y, SMALL)
c.showPage()

for task in TASKS:
    y = heading(c, f'Task {task["n"]:02d}', task['title'], task['n'] + 2)
    y = para(c, escape(task['goal']), y)
    for number, step in enumerate(task['steps'], 1):
        y = para(c, f'<b>{number}.</b> {escape(step)}', y)
    crops = {6: (95, 260, 790, 585), 7: (940, 730, 1430, 990), 8: (105, 190, 785, 585)}
    y = picture(c, SHOTS / task['shot'], y - 2, 262 if task['n'] != 5 else 110, task['caption'], crops.get(task['n']))
    code = source_image(task['n'], task['snippets'])
    available = y - 67
    code_height = min(200, available)
    assert code_height >= 125, f'Not enough space for source evidence on task {task["n"]}'
    picture(c, code, y - 3, code_height, 'Literal source-code screenshot from the delivered project; line numbers identify the exact excerpt.')
    c.showPage()

y = heading(c, 'Part 4 / Publication', 'From project to live site.', 12)
y = para(c, '<b>1. Preserve the original.</b> Continue the existing shared repository in assignment6-jquery/; the Assignment 5 address remains available.', y)
y = para(c, '<b>2. Verify locally.</b> Run the browser suite against the static server. It checks all five pages, responsive widths, keyboard search, safe highlighting, notifications, clipboard, form lifecycle and actual image request deferral.', y)
y = para(c, '<b>3. Commit and publish.</b> Commit the Assignment 6 source and push the shared GitHub repository. GitHub Pages rebuilds the new folder.', y)
y = para(c, '<b>4. Verify the deployed site.</b> Repeat the browser suite against the live URL and retain the commit, workflow and live result in deployment.json and screenshots/test-results-live.json.', y)
y = para(c, '<b>Website:</b><br/><link href="' + SITE + '" color="#087fbd">' + SITE + '</link><br/><b>Repository:</b><br/><link href="' + REPO + '" color="#087fbd">' + REPO + '</link>', y)
if published:
    commit = deployment.get('application_commit') or deployment.get('commit_sha') or deployment.get('commit', 'See deployment.json')
    workflow = deployment.get('workflow_url', '')
    y = para(c, '<b>Publication status: verified live.</b><br/>Application commit: ' + escape(str(commit)) + (('<br/><link href="' + escape(workflow) + '" color="#087fbd">Successful GitHub Pages workflow</link>') if workflow else ''), y)
else:
    y = para(c, '<b>Publication status:</b> pending verified release evidence. The address above is the intended deployment address; it is not claimed as published by this report.', y)
y = para(c, '<b>Verification evidence</b>', y - 5)
for name, title in [('test-results.json', 'Local HTTP'), ('test-results-file.json', 'Direct-file'), ('test-results-live.json', 'Live GitHub Pages'), ('test-results-faq-layout.json', 'Focused FAQ layout regression')]:
    file = SHOTS / name
    if file.exists():
        r = json.loads(file.read_text(encoding='utf-8'))
        y = para(c, f'<b>{title}:</b> {r["passed"]}/{r["total"]} checks passed; {len(r.get("errors", []))} authored errors.<br/><font size="8">Checked {escape(r["timestamp"])}; browser: {escape(r["channel"])}.</font>', y)
y = para(c, '<b>Submission files.</b> Upload Assignment-6-Report.pdf and Assignment-6-Project.zip. The ZIP contains all pages, source scripts, styles, local assets, documentation and evidence. Each member submits separately in the LMS.', y)
para(c, '<b>Evaluation:</b> search 20%; engagement 20%; functionality 10%; defense 40%; report and deployment 10%. The implementation and report support the defense, which each member must perform personally.', y, SMALL)
c.showPage()

y = heading(c, 'Reflection / Defense', 'What we learned.', 13)
for title, body in [
    ('One state, consistent results', 'Live search must combine with category, saved-car and sorting controls. Suggestions use the same data and filters, so the dropdown does not promise a car that the current view excludes.'),
    ('Treat input as text', 'Search terms may contain regex characters or HTML-like strings. Escaping the regex and constructing text nodes prevents broken searches and unintended markup while preserving links and existing page structure.'),
    ('Make asynchronous work predictable', 'A disabled button alone does not cover programmatic or keyboard submits. A pending guard prevents duplicate work; restoring control states and cancelling the timer on reset prevents stale success messages.'),
    ('Measure performance behavior', 'Native loading hints do not prove a request was deferred. The implementation holds the URL in data-src, and browser evidence checks that an offscreen image requests its real source after scrolling into view.'),
    ('Design for different situations', 'Keyboard autocomplete, focus handling, live regions, reduced-motion behavior, a local jQuery fallback and storage-error feedback keep the experience usable beyond the default desktop path.'),
]:
    y = para(c, f'<b>{title}.</b> {body}', y)
y = picture(c, SHOTS / 'page-showroom.png', y - 3, 190, 'The photographic showroom and original dealership identity continue from Assignment 5.')
y = para(c, '<b>Defense preparation.</b> Demonstrate Tasks 0-9, explain .on(), .filter(), .text(), .attr(), .prop(), .animate() and .fadeOut(), then show the live URL. DEFENSE-GUIDE.md provides a Kazakh walkthrough and practice questions.', y)
para(c, '<b>Limits.</b> This static student site demonstrates local state and a simulated inquiry. It does not connect to a dealership backend, make real reservations or verify vehicle availability and prices.', y, SMALL)
c.save()
evidence['source_files'] = {p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in [ROOT / 'script.js', ROOT / 'js/inventory.js', ROOT / 'js/search.js', ROOT / 'js/booking.js', ROOT / 'about.html', ROOT / 'styles.css', ROOT / 'search.css']}
(SHOTS / 'report-evidence.json').write_text(json.dumps(evidence, indent=2), encoding='utf-8')
print(json.dumps({'output': str(OUTPUT), 'pages': 13, 'published': published, 'bytes': OUTPUT.stat().st_size}))
