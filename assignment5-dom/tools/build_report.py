"""Build the Assignment 5 report from the current source and verified screenshots.

Uses ReportLab and Pillow. Run after the browser evidence has been captured.
"""
from pathlib import Path
from xml.sax.saxutils import escape
from io import BytesIO
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
pdfmetrics.registerFontFamily("Arial", normal="Arial", bold="ArialBold",
                             italic="Arial", boldItalic="ArialBold")

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


def build():
    # Crop the real home screenshot to its navbar and original full-width hero.
    # Keep the uncropped browser evidence beside this report image.
    with Image.open(SHOTS / "page-home.png") as home:
        home.crop((0, 0, home.width, min(home.height, 550))).save(SHOTS / "report-home-hero.png")
    c = canvas.Canvas(str(OUTPUT), pagesize=A4)
    c.setTitle("Apex Motors - Assignment 5: JavaScript and DOM Manipulation")
    c.setAuthor("Team Apex Motors - SE-2507")
    c.setSubject("Single-page HTML, CSS and JavaScript project: implementation steps and evidence")

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
    y = paragraph(c, "A single-page dealership with DOM updates, event handling, "
                     "objects, arrays, callbacks, sound and animation.", MARGIN, H - 244,
                  style=LEAD) - 20
    image_box(c, SHOTS / "report-home-hero.png", MARGIN, y, WIDTH, 200,
              "The home page retains the cream/copper design and full-width vehicle hero.")
    y -= 231
    y = paragraph(c, "<b>Team:</b> Apex Motors &nbsp;&nbsp; <b>Group:</b> SE-2507<br/>"
                     "<b>Members:</b> Arsen, Kuttibay, Farabi, Muhammad<br/>"
                     "<b>Prepared:</b> 29 October 2026<br/>"
                     "<b>Build:</b> HTML, custom CSS and three JavaScript files", MARGIN, y) - 14
    y = paragraph(c, "<b>Objective.</b> Build a single-page dealership site with all required JavaScript "
                     "interactions directly available on the main page. Keep the team's familiar "
                     "colours, vehicle hero, cards and photographs.", MARGIN, y) - 12
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
            "Our approach contains Read More for the content-visibility option. Interactive tools "
            "provides a direct background-colour change for the dynamic-styling option.",
            ["Select the Read More button and extra text; attach a click listener.",
             "Change style.display and the button state to reveal or hide the extra content.",
             "Cycle a small array of colours and assign the selected colour to body.style.backgroundColor."],
            [("page-story-expanded.png", "Our approach: additional content revealed."),
             ("page-background.png", "Interactive tools: background changed by JavaScript.")],
            "dom-style", [("js/site.js", "readMoreContent.style.display = expanded", 9, 3),
                          ("js/site.js", "style.backgroundColor", 8, 4)],
            web_height=195, code_height=255)

    feature(c, 3, "02 · Data structures", "Objects, arrays and vehicle cards",
            "The eight-car collection retains the original three listings and adds Camaro, Huracan, "
            "Panamera, Expedition and LaFerrari. Cards use structured objects and local photographs.",
            ["Store each vehicle's name, category, photo and description in an object with a label method.",
             "Keep all eight vehicle objects in one array and create DOM cards in an explicit for...of loop.",
             "Read object properties and insert content with textContent rather than user-written HTML."],
            [("page-inventory.png", "Eight-car collection: first row shown; the result count covers all eight cars.")],
            "objects-loop", [("js/site.js", "label()", 6, 2),
                             ("js/site.js", "const vehicles = [", 2, 0),
                             ("js/site.js", "createVehicle('camaro'", 3, 0),
                             ("js/inventory.js", "for (const vehicle of selectedVehicles)", 2, 1)],
            web_height=215, code_height=245)

    feature(c, 4, "03 · Switch and higher-order functions", "Category filtering",
            "Category buttons filter the existing collection without a page reload. The result count "
            "and visible cards respond to the selected category.",
            ["Listen for category button clicks and read the selected category.",
             "Use a switch statement to choose the matching category condition.",
             "Pass that condition to filter, then render the resulting array and update the result count."],
            [("page-inventory-filtered.png", "Inventory: a selected category updates the collection.")],
            "switch-filter", [("js/inventory.js", "switch (", 12, 2),
                              ("js/inventory.js", "const selectedVehicles = vehicles.filter", 8, 2)],
            web_height=210, code_height=250)

    feature(c, 5, "04 · Optional addition: favorites", "Favorites saved in this browser",
            "Favorites extends the dealership theme with a personal shortlist. JavaScript updates "
            "each card's saved state and the Saved filter; localStorage retains vehicle IDs when available.",
            ["Use a card's Save button to add or remove that vehicle from the shortlist.",
             "Serialize saved IDs to localStorage and restore valid IDs when the page opens.",
             "Choose Saved to see the shortlist; show clear feedback for an empty list or unavailable storage."],
            [("page-favorites.png", "Inventory: saved vehicles selected with the Saved filter.")],
            "favorites", [("js/inventory.js", "const ids = JSON.parse", 4, 0),
                          ("js/inventory.js", "function storeSavedIds()", 9, 0),
                          ("js/inventory.js", "const wasSaved = savedIds.includes", 5, 0)],
            web_height=215, code_height=255)

    feature(c, 6, "05 · Event handling", "Button and keyboard events",
            "The five navigation links lead to sections on this page and support the required arrow-key "
            "focus movement. Buttons also update the page through event listeners.",
            ["Select the navigation links and register a keydown listener on the menu.",
             "Detect arrow keys, calculate the next or previous index with wraparound, and focus that link.",
             "Use the time button's click callback to show a newly formatted current time."],
            [("page-keyboard.png", "A menu link receives keyboard focus."),
             ("page-buttons-sound.png", "Interactive tools: working time and sound actions.")],
            "events", [("js/site.js", "keydown", 11, 0),
                       ("js/site.js", "links[next].focus", 3, 1),
                       ("js/site.js", "toLocaleTimeString", 5, 2)],
            web_height=195, code_height=255)

    feature(c, 7, "06 · Callback interaction", "One inquiry, three steps",
            "The multi-step form is the chosen callback option. The original inquiry fields are grouped "
            "into contact details, preferences, and review. Its eight vehicle choices come from the same collection array.",
            ["Keep the current step in state and validate it before moving forward.",
             "Pass the step-display function as a callback to the navigation function.",
             "Hide or reveal fieldsets without recreating their inputs, so Back retains entered values."],
            [("page-form-preferences.png", "Step 2: inquiry preferences."),
             ("page-form-review.png", "Inquiry: review before confirmation.")],
            "callback", [("js/booking.js", "function navigateStep", 11, 0),
                         ("js/booking.js", "function showStep", 4, 0),
                         ("js/booking.js", "const vehicleOptions = document.createDocumentFragment();", 8, 0)],
            web_height=200, code_height=260)

    feature(c, 8, "07 · Validation and feedback", "Validation, review and reset",
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

    feature(c, 9, "08 · Sound and animations", "Sound and event-triggered animation",
            "Sound and motion are attached to intentional user actions. The sound file is included "
            "locally and playback is reused instead of creating overlapping clips.",
            ["Load one Audio player and start it only after the notification button is clicked.",
             "Pause and rewind the player before each playback; report playback failures clearly.",
             "Animate content, inventory or form changes and respect the reduced-motion preference."],
            [("page-buttons-sound.png", "Interactive tools: user-triggered notification sound and feedback.")],
            "sound-animation", [("js/site.js", "new Audio", 12, 0),
                                ("js/site.js", "prefers-reduced-motion", 9, 2)],
            web_height=205, code_height=255)

    feature(c, 10, "09 · Structure and user experience", "One page, separate source files",
            "HTML, CSS and JavaScript are kept separate. All required features share one main page. "
            "The colour palette, hero, square cards and photographs continue the team's earlier design.",
            ["Link the custom stylesheet and three external deferred scripts from index.html.",
             "Use section anchors, visible labels, alternative text, keyboard focus and a custom mobile menu.",
             "Check every interaction and the four original team portraits at desktop and phone widths."],
            [("page-team.png", "The same four team members and portraits."),
             ("page-mobile.png", "Responsive main page at phone width.")],
            "structure", [("index.html", "styles.css", 8, 0),
                          ("styles.css", "--apex-ink", 9, 1)],
            web_height=205, code_height=230)

    base(c, 11, "10 · Testing, deployment and reflection")
    y = title(c, "Testing and reflection")
    y = paragraph(c, "We checked the following interactions in the browser:", MARGIN, y) - 12
    for heading, detail in [
        ("Collection and styling", "All eight cars appear; categories update the cards and result count. "
         "Read More reveals extra text, and the background button changes the page colour."),
        ("Favorites", "Save and remove update each card and the saved count. The Saved filter shows "
         "the shortlist, which is restored after a reload when browser storage is available."),
        ("Inquiry", "The vehicle choices match the collection. Next validates inputs, Back retains "
         "values, and review, confirmation and reset work through the three steps."),
        ("Keyboard and layout", "Arrow keys move focus between menu links. The mobile menu opens "
         "and closes, and the sections fit desktop and phone widths."),
        ("Sound and motion", "The notification button plays the local sound. Repeated clicks restart "
         "one player without overlapping clips, and content changes trigger animation.")
    ]:
        y = paragraph(c, f"&#8226; <b>{heading}.</b> {detail}", MARGIN, y) - 10
    y = paragraph(c, f'<b>Deployed website:</b><br/><link href="{SITE}" color="#77472b">{SITE}</link>',
                  MARGIN, y - 2) - 17
    y = paragraph(c, "<b>Challenges and solutions.</b> The cards and inquiry list must show the same "
                     "models, so both are generated from one vehicle array. Form validation checks the "
                     "current step and focuses its first invalid field before allowing the user to continue. "
                     "Storage access uses try...catch so Favorites remains usable on the open page if "
                     "the browser cannot save the shortlist.", MARGIN, y) - 14
    y = paragraph(c, "<b>Reflection.</b> A shared collection means adding a vehicle requires one data "
                     "entry to update both cards and form choices. Passing showStep as a callback separates "
                     "step navigation from display; hiding the existing fieldsets retains the entered values. "
                     "Saving vehicle IDs as JSON keeps the shortlist small, and checking restored IDs "
                     "against the collection prevents stale entries. Contact details remain outside this storage.",
                  MARGIN, y) - 14
    y = paragraph(c, "<b>Submission and defense.</b> Each member submits the PDF and ZIP individually "
                     "and explains the implementation during the practice lesson.", MARGIN, y)
    if y < 49:
        raise ValueError("Final page overlaps the footer.")
    c.showPage()
    c.save()
    print(f"Created {OUTPUT}")


if __name__ == "__main__":
    build()
