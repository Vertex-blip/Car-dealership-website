"""Build the Assignment 5 report from the current source and verified screenshots.

Uses ReportLab and Pillow. Run after the browser evidence has been captured.
"""
from pathlib import Path
from xml.sax.saxutils import escape
from io import BytesIO
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
SHOTS = ROOT / "screenshots"
OUTPUT = ROOT / "Assignment-5-Report.pdf"
SITE = "https://vertex-blip.github.io/Car-dealership-website/assignment5-dom/"
REPO = "https://github.com/Vertex-blip/Car-dealership-website"
FONTS = Path("C:/Windows/Fonts")
for family, filename in [("Arial", "arial.ttf"), ("ArialBold", "arialbd.ttf"),
                         ("Georgia", "georgia.ttf"), ("Consolas", "consola.ttf")]:
    pdfmetrics.registerFont(TTFont(family, str(FONTS / filename)))

INK = colors.HexColor("#17191c")
NAVY = colors.HexColor("#1d2b3a")
COPPER = colors.HexColor("#9a603a")
MUTED = colors.HexColor("#5c5c59")
LINE = colors.HexColor("#ded8ce")
CREAM = colors.HexColor("#f5f0e7")
W, H = A4
MARGIN = 42
WIDTH = W - 2 * MARGIN
BODY = ParagraphStyle("body", fontName="Arial", fontSize=9.4, leading=13.5, textColor=INK)
SMALL = ParagraphStyle("small", parent=BODY, fontSize=8.0, leading=11.1, textColor=MUTED)
LEAD = ParagraphStyle("lead", parent=BODY, fontSize=11.3, leading=15.4, textColor=MUTED)


def paragraph(c, text, x, y, width=WIDTH, style=BODY):
    p = Paragraph(text, style)
    _, height = p.wrap(width, H)
    p.drawOn(c, x, y - height)
    return y - height


def base(c, number, label):
    c.setFillColor(colors.white)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setStrokeColor(LINE)
    c.line(MARGIN, 39, W - MARGIN, 39)
    c.setFillColor(MUTED)
    c.setFont("Arial", 7.0)
    c.drawString(MARGIN, 26, "Apex Motors · Arsen · Kuttibay · Farabi · Muhammad · SE-2507")
    c.drawRightString(W - MARGIN, 26, f"{number:02d}")
    c.setFillColor(COPPER)
    c.setFont("ArialBold", 8.2)
    c.drawString(MARGIN, H - 44, label.upper())


def title(c, text):
    c.setFillColor(NAVY)
    c.setFont("Georgia", 23)
    c.drawString(MARGIN, H - 77, text)
    return H - 94


def image_box(c, path, x, y, width, height, caption=""):
    if not path.is_file():
        raise FileNotFoundError(f"Missing actual screenshot: {path}")
    render_source = str(path)
    with Image.open(path) as source:
        iw, ih = source.size
        # Keep code screenshots lossless; compress photographic webpage evidence
        # inside the PDF while preserving its original PNG file in screenshots/.
        if path.suffix.lower() == ".png" and not path.name.startswith("code-"):
            buffer = BytesIO()
            source.convert("RGB").save(buffer, format="JPEG", quality=91, subsampling=0)
            buffer.seek(0)
            render_source = ImageReader(buffer)
    scale = min(width / iw, height / ih)
    dw, dh = iw * scale, ih * scale
    c.setFillColor(colors.white)
    c.rect(x, y - height, width, height, fill=1, stroke=0)
    c.drawImage(render_source, x + (width - dw) / 2, y - (height + dh) / 2,
                width=dw, height=dh, preserveAspectRatio=True, mask="auto")
    c.setStrokeColor(LINE)
    c.rect(x, y - height, width, height, fill=0, stroke=1)
    if caption:
        paragraph(c, escape(caption), x, y - height - 5, width, SMALL)


def source_excerpt(filename, needle, count, before=0):
    lines = (ROOT / filename).read_text(encoding="utf-8-sig").splitlines()
    index = next((i for i, line in enumerate(lines) if needle in line), None)
    if index is None:
        raise ValueError(f"Source marker missing: {filename}: {needle}")
    start = max(0, index - before)
    return [(i + 1, lines[i]) for i in range(start, min(len(lines), start + count))]


def code_screenshot(name, specs):
    """Render literal current-source lines and their actual file/line numbers."""
    font = ImageFont.truetype(str(FONTS / "consola.ttf"), 26)
    heading_font = ImageFont.truetype(str(FONTS / "arialbd.ttf"), 24)
    rows = []
    for filename, needle, count, before in specs:
        rows.append(("heading", filename))
        for lineno, line in source_excerpt(filename, needle, count, before):
            wrapped = textwrap.wrap(line.expandtabs(2), width=91, replace_whitespace=False,
                                    drop_whitespace=False) or [""]
            rows.append(("code", f"{lineno:>3}  {wrapped[0]}"))
            rows.extend(("code", f"     {part}") for part in wrapped[1:])
    image = Image.new("RGB", (1510, 30 + 34 * len(rows)), "#faf8f4")
    draw = ImageDraw.Draw(image)
    y = 14
    for kind, value in rows:
        draw.text((22, y), value, font=heading_font if kind == "heading" else font,
                  fill="#9a603a" if kind == "heading" else "#17191c")
        y += 34
    path = SHOTS / f"code-{name}.png"
    image.save(path)
    return path


def feature(c, number, label, heading, intro, steps, screenshots, code_name, specs,
            web_height=215, code_height=255):
    base(c, number, label)
    y = title(c, heading)
    y = paragraph(c, intro, MARGIN, y) - 11
    for i, step in enumerate(steps, 1):
        y = paragraph(c, f"<b>{i}.</b> {step}", MARGIN, y) - 5
    y -= 4
    gap = 12
    width = (WIDTH - gap * (len(screenshots) - 1)) / len(screenshots)
    for i, (filename, caption) in enumerate(screenshots):
        image_box(c, SHOTS / filename, MARGIN + i * (width + gap), y, width,
                  web_height, caption)
    y -= web_height + 31
    code = code_screenshot(code_name, specs)
    image_box(c, code, MARGIN, y, WIDTH, code_height,
              "Actual source: " + ", ".join(dict.fromkeys(spec[0] for spec in specs)))
    if y - code_height - 25 < 47:
        raise ValueError(f"Page {number} overlaps the footer; reduce evidence height.")
    c.showPage()


def load_results():
    path = SHOTS / "test-results.json"
    if not path.is_file():
        raise FileNotFoundError("Capture and verify the updated site before building the report.")
    return json.loads(path.read_text(encoding="utf-8-sig"))


def result_text(results):
    if isinstance(results.get("checks"), int):
        runs = results.get("runs", [])
        suffix = f" across {len(runs)} browser runs" if runs else ""
        return (f"Recorded verification: {results.get('passed', 0)}/{results['checks']} checks passed"
                f"{suffix}; {len(results.get('errors', []))} runtime/resource errors.")
    return "Recorded browser checks are supplied in screenshots/test-results.json."


def build():
    results = load_results()
    # Crop the real home screenshot to its navbar and original full-width hero.
    # Keep the uncropped browser evidence beside this report image.
    with Image.open(SHOTS / "page-home.png") as home:
        home.crop((0, 0, home.width, min(home.height, 550))).save(SHOTS / "report-home-hero.png")
    c = canvas.Canvas(str(OUTPUT), pagesize=A4)
    c.setTitle("Apex Motors - Assignment 5: JavaScript and DOM Manipulation")
    c.setAuthor("Team Apex Motors - SE-2507")
    c.setSubject("Continuation of Assignment 3, implementation steps, code and webpage evidence")

    base(c, 1, "")
    c.drawImage(str(ROOT / "images/apex-motors-logo.png"), MARGIN, H - 118,
                width=180, height=57, preserveAspectRatio=True, mask="auto")
    c.setFillColor(COPPER)
    c.setFont("ArialBold", 8.2)
    c.drawString(MARGIN, H - 151, "WEB TECHNOLOGIES · ASSIGNMENT 5")
    c.setFillColor(NAVY)
    c.setFont("Georgia", 30)
    c.drawString(MARGIN, H - 189, "JavaScript and DOM")
    c.drawString(MARGIN, H - 225, "Manipulation.")
    y = paragraph(c, "Continue the Assignment 3 website with DOM updates, event handling, "
                     "objects, arrays, callbacks, sound and animation.", MARGIN, H - 244,
                  style=LEAD) - 20
    image_box(c, SHOTS / "report-home-hero.png", MARGIN, y, WIDTH, 200,
              "The updated home page keeps the original Bootstrap layout and vehicle hero.")
    y -= 231
    y = paragraph(c, "<b>Team:</b> Apex Motors &nbsp;&nbsp; <b>Group:</b> SE-2507<br/>"
                     "<b>Members:</b> Arsen, Kuttibay, Farabi, Muhammad<br/>"
                     "<b>Prepared:</b> 28 October 2026<br/>"
                     "<b>Build:</b> Bootstrap 5.3.3 and separate HTML, CSS and JavaScript", MARGIN, y) - 14
    y = paragraph(c, "<b>Objective.</b> Add the required JavaScript features to the team's existing "
                     "eight-page dealership site while retaining its navigation, colours, components "
                     "and photographs.", MARGIN, y) - 12
    y = paragraph(c, f'<b>Website:</b> <link href="{SITE}" color="#77472b">{SITE}</link><br/>'
                     f'<b>Repository:</b> <link href="{REPO}" color="#77472b">{REPO}</link>',
                  MARGIN, y, style=SMALL)
    if y < 155:
        raise ValueError("Cover text overlaps footer.")
    for i, name in enumerate(["Arsen", "Kuttibay", "Farabi", "Muhammad"]):
        center = MARGIN + WIDTH * (i + 0.5) / 4
        c.saveState()
        clip = c.beginPath()
        clip.circle(center, 110, 28)
        c.clipPath(clip, stroke=0, fill=0)
        portrait = ROOT / f"images/{name.lower()}.jpg"
        with Image.open(portrait) as source:
            iw, ih = source.size
        scale = max(56 / iw, 56 / ih)
        dw, dh = iw * scale, ih * scale
        c.drawImage(str(portrait), center - dw / 2, 110 - dh / 2,
                    width=dw, height=dh, preserveAspectRatio=False, mask="auto")
        c.restoreState()
        c.setFont("ArialBold", 8.5)
        c.setFillColor(INK)
        c.drawCentredString(center, 68, name)
    c.showPage()

    # Source markers below are checked against the final scripts before generation.
    feature(c, 2, "01 · DOM manipulation and styling", "DOM updates and styling",
            "The brief offers several alternatives. This project uses Read More for content visibility "
            "and a direct background-colour change for dynamic styling.",
            ["Select the Read More button and extra text; attach a click listener.",
             "Change style.display and the button state to reveal or hide the extra content.",
             "Cycle a small array of colours and assign the selected colour to body.style.backgroundColor."],
            [("page-story-expanded.png", "Home: additional content revealed."),
             ("page-background.png", "Buttons: background changed by JavaScript.")],
            "dom-style", [("js/site.js", "style.display", 9, 3),
                          ("js/site.js", "style.backgroundColor", 8, 4)],
            web_height=195, code_height=255)

    feature(c, 3, "02 · Data structures", "Objects, arrays and vehicle cards",
            "The three existing inventory cards are generated from structured vehicle data. "
            "The Bootstrap card layout and original photographs are retained.",
            ["Store each vehicle's name, category, photo and description in an object with a label method.",
             "Keep the vehicle objects in an array and create DOM cards in an explicit for...of loop.",
             "Read object properties and insert content with textContent rather than user-written HTML."],
            [("page-inventory.png", "Inventory: the original three cards, now rendered from objects.")],
            "objects-loop", [("js/site.js", "label()", 6, 2),
                             ("js/site.js", "const vehicles = [", 5, 0),
                             ("js/inventory.js", "for (const", 6, 2)],
            web_height=215, code_height=245)

    feature(c, 4, "03 · Switch and higher-order functions", "Category filtering",
            "Category buttons filter the existing collection without a page reload. The result count "
            "and visible cards respond to the selected category.",
            ["Listen for category button clicks and read the selected category.",
             "Use a switch statement to choose the matching category condition.",
             "Pass that condition to filter, then render the resulting array and update the result count."],
            [("page-inventory-filtered.png", "Inventory: a selected category updates the collection.")],
            "switch-filter", [("js/inventory.js", "switch (", 12, 2),
                              ("js/inventory.js", ".filter(", 8, 2)],
            web_height=210, code_height=250)

    feature(c, 5, "04 · Event handling", "Button and keyboard events",
            "The shared eight-link menu keeps normal link behaviour and adds the required arrow-key "
            "focus movement. Buttons also update the page through event listeners.",
            ["Select the navigation links and register a keydown listener on the menu.",
             "Detect arrow keys, calculate the next or previous index with wraparound, and focus that link.",
             "Use the time button's click callback to show a newly formatted current time."],
            [("page-keyboard.png", "A menu link receives keyboard focus."),
             ("page-buttons-sound.png", "Buttons: working time and sound actions.")],
            "events", [("js/site.js", "keydown", 11, 0),
                       ("js/site.js", "links[next].focus", 3, 1),
                       ("js/site.js", "toLocaleTimeString", 5, 2)],
            web_height=195, code_height=255)

    feature(c, 6, "05 · Callback interaction", "One inquiry, three steps",
            "The multi-step form is the chosen callback option. The original inquiry fields are grouped "
            "into contact details, preferences, and review.",
            ["Keep the current step in state and validate it before moving forward.",
             "Pass the step-display function as a callback to the navigation function.",
             "Hide or reveal fieldsets without recreating their inputs, so Back retains entered values."],
            [("page-form-preferences.png", "Step 2: inquiry preferences."),
             ("page-form-review.png", "Inquiry: review before confirmation.")],
            "callback", [("js/booking.js", "function navigateStep", 11, 0),
                         ("js/booking.js", "function showStep", 10, 0)],
            web_height=200, code_height=260)

    feature(c, 7, "06 · Validation and feedback", "Validation, review and reset",
            "The form checks required contact values and the user's preferences, then displays a local "
            "preview result. It does not send personal information to a server.",
            ["Prevent default submission, display field errors, and focus the first invalid control.",
             "Build the review from the entered values and show confirmation without reloading.",
             "Reset all fields, error messages, and step state when the user starts again."],
            [("page-form-errors.png", "Missing or invalid values receive clear feedback."),
             ("page-form-success.png", "A completed inquiry preview remains on the page.")],
            "validation-reset", [("js/booking.js", "function validate", 11, 0),
                                 ("js/booking.js", "function clearValues", 10, 0)],
            web_height=200, code_height=245)

    feature(c, 8, "07 · Sound and animations", "Sound and event-triggered animation",
            "Sound and motion are attached to intentional user actions. The sound file is included "
            "locally and playback is reused instead of creating overlapping clips.",
            ["Load one Audio player and start it only after the notification button is clicked.",
             "Pause and rewind the player before each playback; report playback failures clearly.",
             "Animate content, inventory or form changes and respect the reduced-motion preference."],
            [("page-buttons-sound.png", "Buttons: user-triggered notification sound and feedback.")],
            "sound-animation", [("js/site.js", "new Audio", 12, 0),
                                ("js/site.js", "prefers-reduced-motion", 9, 2)],
            web_height=205, code_height=255)

    feature(c, 9, "08 · Structure and user experience", "The same eight-page website",
            "HTML, CSS and JavaScript are kept separate. The original responsive pages, team photos, "
            "card layout, carousel, colours and shared navigation continue from Assignment 3.",
            ["Load the local Bootstrap files, shared stylesheet and external deferred scripts.",
             "Retain labels, alternative text, visible focus, a skip link and the mobile collapse menu.",
             "Check all eight pages and the four original team portraits at desktop and phone widths."],
            [("page-team.png", "The same four team members and portraits."),
             ("page-mobile.png", "Original responsive layout at phone width.")],
            "structure", [("index.html", "vendor/", 8, 0),
                          ("styles.css", "--apex-ink", 9, 1)],
            web_height=205, code_height=230)

    base(c, 10, "09 · Verification, deployment and reflection")
    y = title(c, "Verification and reflection")
    y = paragraph(c, result_text(results), MARGIN, y) - 13
    y = paragraph(c, "<b>Evidence.</b> Screenshots show the resulting pages; source screenshots use "
                     "literal current code with file names and line numbers. Browser results are stored "
                     "in screenshots/test-results.json.", MARGIN, y) - 13
    live_path = ROOT / "test-results-live.json"
    if live_path.is_file():
        live = json.loads(live_path.read_text(encoding="utf-8-sig"))
        y = paragraph(c, "<b>Live verification.</b> " + result_text(live), MARGIN, y) - 13
    deployment_path = ROOT / "deployment.json"
    if not deployment_path.is_file():
        deployment_path = ROOT / "reportdeploy.json"
    if deployment_path.is_file():
        deployment = json.loads(deployment_path.read_text(encoding="utf-8-sig"))
        y = paragraph(c, "<b>Deployment.</b> " + escape(deployment.get("summary", "")), MARGIN, y) - 13
    else:
        y = paragraph(c, f'<b>Published website:</b> <link href="{SITE}" color="#77472b">{SITE}</link><br/>'
                         "The project is committed to the shared repository and served through GitHub Pages.",
                      MARGIN, y) - 13
    for heading, detail in [
        ("DOM and styling", "Read More visibility, dynamic inventory text, result counts and background colour."),
        ("Events and data", "Click listeners, arrow-key focus, object methods, arrays, loops, filter and switch."),
        ("Inquiry", "Invalid values, Next and Back, retained values, review, confirmation and reset."),
        ("Sound, motion and layout", "Actual audio playback, repeated-click restart, transitions, offline assets and responsive pages.")
    ]:
        y = paragraph(c, f"<b>{heading}.</b> {detail}", MARGIN, y) - 10
    y = paragraph(c, "<b>Challenges and solutions.</b> A continuation needs to keep existing layout rules "
                     "while adding state changes. The scripts target small components and keep the Bootstrap "
                     "markup. Form steps can hide invalid controls, so validation identifies and focuses the "
                     "correct field before advancing. Repeated sound clicks are handled by restarting one player.",
                  MARGIN, y - 3) - 14
    y = paragraph(c, "<b>Reflection.</b> Reusable functions and structured vehicle data make the added features "
                     "easier to understand and change. Keeping the original pages also makes the connection "
                     "between Assignments 3 and 5 clear. The inquiry remains an honest local demonstration.",
                  MARGIN, y) - 14
    y = paragraph(c, "<b>Defense and submission.</b> Every member should explain the code and practise a small "
                     "change. The defense is worth 40%. Each student submits the PDF and ZIP individually and "
                     "attends the practice lesson. The supplied LMS screenshot shows 29 October 2026, 14:00; "
                     "check the LMS for the current deadline.", MARGIN, y)
    if y < 49:
        raise ValueError("Final page overlaps the footer.")
    c.showPage()
    c.save()
    print(f"Created {OUTPUT}")


if __name__ == "__main__":
    build()
