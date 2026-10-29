"""Create the revised Assignment 5 report from current source and browser evidence.

Requires ReportLab and Pillow. Run after tools/verify.cjs captures fresh screenshots.
The PDF contains literal source excerpts, not illustrative replacement code.
"""
from pathlib import Path
from io import BytesIO
from xml.sax.saxutils import escape
import json
import textwrap
import hashlib

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
W, H = A4
MARGIN = 42
WIDTH = W - 2 * MARGIN
INK = colors.HexColor("#17201f")
ACCENT = colors.HexColor("#0078d6")
MUTED = colors.HexColor("#5c635f")
LINE = colors.HexColor("#dce0db")
BODY = ParagraphStyle("body", fontName="Arial", fontSize=9.2, leading=13.2, textColor=INK)
SMALL = ParagraphStyle("small", parent=BODY, fontSize=7.8, leading=10.4, textColor=MUTED)
LEAD = ParagraphStyle("lead", parent=BODY, fontSize=11.5, leading=16, textColor=MUTED)
EVIDENCE = set()
APPLICATION_JS = ["data.js", "theme-init.js", "site.js", "inventory.js", "booking.js", "gallery.js"]


def paragraph(c, text, x, y, width=WIDTH, style=BODY):
    item = Paragraph(text, style)
    _, height = item.wrap(width, H)
    item.drawOn(c, x, y - height)
    return y - height


def base(c, number, label):
    c.setFillColor(colors.white)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(ACCENT)
    c.rect(MARGIN, H - 32, 26, 3, fill=1, stroke=0)
    c.setFont("ArialBold", 8)
    c.drawString(MARGIN, H - 49, label.upper())
    c.setStrokeColor(LINE)
    c.line(MARGIN, 39, W - MARGIN, 39)
    c.setFillColor(MUTED)
    c.setFont("Arial", 7)
    c.drawString(MARGIN, 25, "Apex Motors | Arsen, Kuttibay, Farabi, Muhammad | SE-2507")
    c.drawRightString(W - MARGIN, 25, f"{number:02d}")


def title(c, value):
    c.setFillColor(INK)
    c.setFont("Georgia", 23)
    c.drawString(MARGIN, H - 81, value)
    return H - 100


def image_box(c, path, x, y, width, height, caption=""):
    if not path.is_file():
        raise FileNotFoundError(f"Missing current browser evidence: {path}")
    EVIDENCE.add(path.relative_to(ROOT).as_posix())
    with Image.open(path) as source:
        iw, ih = source.size
        buffer = BytesIO()
        if path.name.startswith("code-revised-"):
            source.convert("RGB").save(buffer, format="PNG")
        else:
            source.convert("RGB").save(buffer, format="JPEG", quality=91, subsampling=0)
        buffer.seek(0)
        scale = min(width / iw, height / ih)
        dw, dh = iw * scale, ih * scale
        c.setFillColor(colors.HexColor("#f8f9f6"))
        c.rect(x, y - height, width, height, fill=1, stroke=0)
        c.drawImage(ImageReader(buffer), x + (width - dw) / 2,
                    y - (height + dh) / 2, width=dw, height=dh, mask="auto")
    c.setStrokeColor(LINE)
    c.rect(x, y - height, width, height, fill=0, stroke=1)
    if caption:
        paragraph(c, escape(caption), x, y - height - 5, width, SMALL)


def source_excerpt(filename, needles, count, before=0):
    lines = (ROOT / filename).read_text(encoding="utf-8-sig").splitlines()
    if isinstance(needles, str):
        needles = [needles]
    index = next((i for needle in needles for i, line in enumerate(lines) if needle in line), None)
    if index is None:
        raise ValueError(f"Current source marker not found: {filename}: {needles}")
    start = max(0, index - before)
    return [(i + 1, lines[i]) for i in range(start, min(len(lines), start + count))]


def code_screenshot(name, specs):
    """Turn literal current code and actual line numbers into readable evidence."""
    font = ImageFont.truetype(str(FONTS / "consola.ttf"), 26)
    heading_font = ImageFont.truetype(str(FONTS / "arialbd.ttf"), 24)
    rows = []
    for filename, needles, count, before in specs:
        rows.append(("heading", filename))
        for lineno, line in source_excerpt(filename, needles, count, before):
            wrapped = textwrap.wrap(line.expandtabs(2), width=89,
                                    replace_whitespace=False, drop_whitespace=False) or [""]
            rows.append(("code", f"{lineno:>3}  {wrapped[0]}"))
            rows.extend(("code", "     " + part) for part in wrapped[1:])
    result = Image.new("RGB", (1510, 30 + 34 * len(rows)), "#f7f8f4")
    draw = ImageDraw.Draw(result)
    y = 14
    for kind, value in rows:
        draw.text((22, y), value, font=heading_font if kind == "heading" else font,
                  fill="#0078d6" if kind == "heading" else "#17201f")
        y += 34
    path = SHOTS / f"code-revised-{name}.png"
    result.save(path)
    return path


def feature(c, number, label, heading, intro, steps, screenshots, code_name, specs,
            web_height=190, code_height=235):
    base(c, number, label)
    y = paragraph(c, intro, MARGIN, title(c, heading)) - 10
    for i, step in enumerate(steps, 1):
        y = paragraph(c, f"<b>{i}.</b> {step}", MARGIN, y) - 5
    y -= 5
    gap = 12
    width = (WIDTH - gap * (len(screenshots) - 1)) / len(screenshots)
    for i, (filename, caption) in enumerate(screenshots):
        image_box(c, SHOTS / filename, MARGIN + i * (width + gap), y, width, web_height, caption)
    y -= web_height + 32
    source = code_screenshot(code_name, specs)
    image_box(c, source, MARGIN, y, WIDTH, code_height,
              "Current source: " + ", ".join(dict.fromkeys(spec[0] for spec in specs)))
    if y - code_height - 24 < 48:
        raise ValueError(f"Page {number} overlaps its footer; reduce evidence height.")
    c.showPage()


def build():
    # Require current verification before authoring the final document.
    verification_path = SHOTS / "test-results.json"
    verification = json.loads(verification_path.read_text(encoding="utf-8"))
    EVIDENCE.add("screenshots/test-results.json")
    for name in ["test-results-chrome-file.json"]:
        path = SHOTS / name
        if not path.is_file():
            raise FileNotFoundError(f"Missing final verification evidence: {path}")
        EVIDENCE.add(path.relative_to(ROOT).as_posix())
    temporary_output = OUTPUT.with_name(".Assignment-5-Report.build.pdf")
    c = canvas.Canvas(str(temporary_output), pagesize=A4)
    c.setTitle("Apex Motors - Assignment 5: Advanced JavaScript and DOM Manipulation")
    c.setAuthor("Apex Motors: Arsen, Kuttibay, Farabi, Muhammad - SE-2507")
    c.setSubject("Five-page, 17-car photographic dealership: implementation, source and browser evidence")

    base(c, 1, "Web Technologies | Assignment 5")
    c.setFont("Georgia", 34)
    c.setFillColor(INK)
    c.drawString(MARGIN, H - 103, "Advanced JavaScript")
    c.drawString(MARGIN, H - 143, "and DOM Manipulation.")
    y = paragraph(c, "Apex Motors - 17 vehicles, high-resolution photography, an interactive "
                     "showroom gallery, inquiry and team page.", MARGIN, H - 165, style=LEAD) - 18
    image_box(c, SHOTS / "page-home.png", MARGIN, y, WIDTH, 250,
              "Current photographic home page. Navigation opens independent HTML pages.")
    y -= 280
    y = paragraph(c, "<b>Team:</b> Apex Motors &nbsp; <b>Group:</b> SE-2507<br/>"
                     "<b>Members:</b> Arsen, Kuttibay, Farabi, Muhammad<br/>"
                     "<b>Prepared:</b> 29 October 2026<br/>"
                     "<b>Build:</b> Five HTML pages, external CSS/JavaScript and local photographs, icons and sound.",
                  MARGIN, y) - 12
    y = paragraph(c, "<b>Objective.</b> Continue the team's automotive project with useful DOM "
                     "updates, event handling, callbacks, data structures, sound and event-triggered "
                     "animation. Replace section-only navigation with five connected pages while "
                     "keeping shared appearance settings and a consistent experience.", MARGIN, y) - 12
    y = paragraph(c, f'<b>Publication address:</b> <link href="{SITE}" color="#0078d6">{SITE}</link><br/>'
                     f'<b>Repository:</b> <link href="{REPO}" color="#0078d6">{REPO}</link><br/>'
                     "<b>Status:</b> Revised build checked locally; redeployment is pending unless "
                     "confirmed by the accompanying deployment record.", MARGIN, y, style=SMALL)
    if y < 53:
        raise ValueError("Cover content overlaps footer.")
    c.showPage()

    feature(c, 2, "01 | DOM selection and dynamic styling", "Day, night and changing color",
            "The shared controls select individual and grouped DOM elements. Theme changes "
            "update the page appearance; the background control generates new hues rather than "
            "cycling three presets. This implements both alternatives in the styling task.",
            ["Select appearance controls and attach click listeners in the shared script.",
             "Change theme attributes and CSS properties, then update button states and feedback.",
             "Store preferences and restore them before rendering the next page."],
            [("page-theme-dark.png", "Night appearance."),
             ("page-background.png", "A generated background hue.")],
            "theme", [("js/site.js", "function applyAppearance", 8, 0),
                      ("js/site.js", "function setTheme", 5, 0),
                      ("js/theme-init.js", ["localStorage", "getItem"], 5, 1)],
            web_height=180, code_height=235)

    feature(c, 3, "02 | Objects, methods, arrays and loops", "One collection, shared data",
            "Seventeen vehicle objects provide the names, categories, photographs and descriptions "
            "used throughout the site. One array keeps cards and inquiry choices synchronized. "
            "The original images use their photographed vehicle names; prices and years are illustrative.",
            ["Create vehicle objects with properties and a reusable display method.",
             "Iterate the collection explicitly to build cards and inquiry options.",
             "Insert dynamic text into DOM elements and update the visible result count."],
            [("page-inventory.png", "The 17-car collection, rendered from shared data.")],
            "data", [("js/data.js", ["label()", "label:", "createVehicle"], 4, 2),
                     ("js/data.js", "const vehicles = [", 3, 0),
                     ("js/inventory.js", ["for (const vehicle", "for (let", "for (const car"], 6, 1),
                     ("js/booking.js", ["vehicleOptions", "for (const vehicle"], 5, 0)],
            web_height=205, code_height=240)

    feature(c, 4, "03 | Switch and higher-order functions", "Filter and save a collection",
            "Category buttons apply user input to a switch statement and higher-order filtering. "
            "Saved vehicles extend the same collection without maintaining another set of cars.",
            ["Read the selected category and choose its condition with switch.",
             "Pass the matching function to filter and render the returned collection.",
             "Save vehicle IDs, update control states and restore the shortlist when storage is available."],
            [("page-inventory-filtered.png", "Category-filtered collection."),
             ("page-favorites.png", "Saved vehicles selected.")],
            "filter", [("js/inventory.js", "switch", 11, 1),
                       ("js/inventory.js", "const selectedVehicles =", 8, 1)],
            web_height=185, code_height=235)

    feature(c, 5, "04 | Button and keyboard events", "Navigation you can hear",
            "The five navigation links open different HTML pages. Arrow keys move focus through "
            "visible navigation controls with a short sound; Enter activates the focused link.",
            ["Register click and keydown listeners; ignore text-entry fields for page-level arrows.",
             "Use the direction to calculate the next index with wraparound.",
             "Focus the next control without scrolling, then play the navigation sound."],
            [("page-keyboard.png", "Visible keyboard focus on the shared navigation.")],
            "keyboard", [("js/site.js", "const nav =", 3, 0),
                         ("js/site.js", ["case 'ArrowRight'", 'case "ArrowRight"', "ArrowRight:"], 11, 2),
                         ("js/site.js", ["preventScroll", "links[next].focus", "items[next"], 4, 0)],
            web_height=190, code_height=245)

    feature(c, 6, "05 | Callback interaction", "One inquiry, three steps",
            "The selected callback alternative is a multistep form. Contact, Preferences and "
            "Review reuse the same inputs, so moving Back does not erase entered values.",
            ["Track the current step and validate it before a forward move.",
             "Pass the step-display function as a callback to the navigation function.",
             "Display the requested fieldset while retaining existing input state."],
            [("page-form-preferences.png", "Preferences step."),
             ("page-form-review.png", "Review before confirmation.")],
            "callback", [("js/booking.js", "function navigateStep", 10, 0),
                         ("js/booking.js", ["navigateStep(1,", "navigateStep(1,"], 4, 1),
                         ("js/booking.js", "function showStep", 4, 0)],
            web_height=180, code_height=245)

    feature(c, 7, "06 | Feedback and state", "Validate, review and reset",
            "The inquiry checks the current step, displays understandable errors and produces "
            "a local confirmation. It is a classroom preview and does not POST personal details.",
            ["Prevent default submission, show errors and focus the first invalid control.",
             "Build the review from current values, then show confirmation without reloading.",
             "Reset inputs, error messages and step state for a new inquiry."],
            [("page-form-errors.png", "Field validation feedback."),
             ("page-form-success.png", "Local confirmation.")],
            "validation", [("js/booking.js", ["function validateStep", "function validate"], 10, 0),
                           ("js/booking.js", ["function clearValues", "function reset"], 8, 0)],
            web_height=190, code_height=235)

    feature(c, 8, "07 | Sound and event-triggered animation", "Feedback you can see and hear",
            "Sound is triggered by deliberate user actions. The active sound is controlled to "
            "prevent overlapping playback. Gallery changes, collection filtering and form steps "
            "provide event-triggered visual feedback.",
            ["Create or reuse the shared audio resource and stop active playback before restarting.",
             "Connect user events to gallery, collection and form transitions.",
             "Respect reduced-motion preferences and provide a usable loading/fallback state."],
            [("page-tools.png", "Time and sound controls with visible user feedback.")],
            "motion", [("js/site.js", ["function stopSound", "new Audio", "AudioContext"], 6, 0),
                       ("js/site.js", "reducedMotion.matches", 11, 1),
                       ("js/inventory.js", "window.Apex.animate?.(grid)", 1, 0)],
            web_height=190, code_height=240)

    feature(c, 9, "08 | Content and attribute manipulation", "A gallery and a deeper story",
            "The photographic showroom changes the main image when a thumbnail or arrow is "
            "selected. Read More changes additional content's visibility. These implement two "
            "allowed alternatives from the brief's content and attribute task.",
            ["Select gallery controls and update the main image's src, alt and caption.",
             "Keep the selected thumbnail state synchronized with Previous and Next.",
             "Toggle Read More using style.display and communicate its expanded state."],
            [("page-showroom.png", "Thumbnail-driven photographic showroom."),
             ("page-story-expanded.png", "Additional story content expanded.")],
            "gallery-story", [("js/gallery.js", "image.src = selected.dataset.gallerySrc", 9, 2),
                              ("js/site.js", "readMoreContent.style.display = expanded", 9, 2)],
            web_height=195, code_height=235)

    feature(c, 10, "09 | Structure, theme and usability", "Five pages, one coherent site",
            "Structure, appearance and behavior are separated. The five pages share branding, "
            "navigation and preferences, with local resources and the team's original identities.",
            ["Link external styles and scripts; keep page-specific content in its own HTML file.",
             "Use labeled controls, meaningful alternative text and visible keyboard focus.",
             "Check desktop and phone layouts, navigation and the original four team portraits."],
            [("page-team.png", "Original team and dealership theme."),
             ("page-mobile.png", "Responsive phone layout.")],
            "structure", [("index.html", "styles.css", 9, 0),
                          ("styles.css", [":root{", ":root {"], 8, 0)],
            web_height=210, code_height=220)

    base(c, 11, "10 | Verification, release and reflection")
    y = title(c, "Testing and reflection")
    y = paragraph(c, "<b>Verification.</b> Current browser results are saved in "
                     "screenshots/test-results.json. The checks cover separate-page navigation, "
                     "collection filtering and saved state, appearance persistence, keyboard focus, "
                     "inquiry validation and step state, local resources and responsive layouts. "
                     "Use the recorded target and timestamp to identify the checked build.", MARGIN, y) - 14
    # Include concrete totals when the verifier uses its standard summary schema.
    if isinstance(verification, dict):
        totals = {key: verification[key] for key in ["passed", "failed", "total", "checks"]
                  if key in verification and isinstance(verification[key], (int, float, str))}
        if totals:
            summary = "; ".join(f"{key}: {value}" for key, value in totals.items())
            y = paragraph(c, "<b>Recorded result:</b> " + escape(summary), MARGIN, y) - 14
    file_checks = json.loads((SHOTS / "test-results-chrome-file.json").read_text(encoding="utf-8"))
    y = paragraph(c, f"<b>Additional runs:</b> Direct-file browser checks "
                     f"{file_checks.get('passed')}/{file_checks.get('total')}.", MARGIN, y) - 12
    for heading, detail in [
        ("DOM and events", "Appearance, Read More and filters update selected elements. "
         "Clicks and arrows call shared event handlers and maintain visible control states."),
        ("Data and callbacks", "One vehicle collection feeds cards and inquiry choices. "
         "Switch and higher-order filters process user input; the step callback separates navigation from display."),
        ("Sound and animation", "User actions start controlled audio and visual transitions. "
         "Reduced-motion behavior applies to interactive transitions."),
        ("Structure and UX", "Five independent pages use external CSS/JavaScript, a shared menu, "
         "local assets, labels, feedback and responsive layouts.")
    ]:
        y = paragraph(c, f"<b>{heading}.</b> {detail}", MARGIN, y) - 10
    y = paragraph(c, f'<b>Publication URL:</b><br/><link href="{SITE}" color="#0078d6">{SITE}</link><br/>'
                     "<b>Release status.</b> The revised source is locally verified. Committing, pushing "
                     "and redeploying it are still required unless deployment.json records a successful "
                     "release of this revised build. Historical live checks concern an earlier version.",
                  MARGIN, y - 2) - 14
    y = paragraph(c, "<b>Challenges and solutions.</b> Separate pages must share vehicle data and "
                     "appearance preferences, so common data and initialization are reused. Form steps "
                     "retain existing inputs to preserve state. Storage failures are handled so optional "
                     "persistence does not prevent interaction. The gallery reuses local photographs "
                     "and keeps its main image, caption and thumbnail state synchronized.",
                  MARGIN, y) - 12
    y = paragraph(c, "<b>Reflection.</b> Reusable data and functions reduce inconsistent content. "
                     "Keyboard focus, feedback and responsive testing matter as much as visual effects. "
                     "The photographic showroom extends the dealership theme while the core DOM tasks remain easy "
                     "to demonstrate and explain.", MARGIN, y) - 12
    y = paragraph(c, "<b>Submission and defense.</b> Every member submits the PDF and ZIP through "
                     "the LMS and defends the work in the practice lesson. Evaluation: DOM 10%, "
                     "events 10%, data/functions 10%, sound 5%, animation 5%, structure 5%, UX 5%, "
                     "defense 40%, report 10%. The deadline is the one currently shown in the LMS.", MARGIN, y)
    if y < 49:
        raise ValueError("Final page overlaps footer.")
    c.showPage()
    c.save()
    temporary_output.replace(OUTPUT)
    source_files = sorted([*ROOT.glob("*.html"), ROOT / "styles.css",
                           *[ROOT / "js" / name for name in APPLICATION_JS]])
    source_hashes = {path.relative_to(ROOT).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
                     for path in source_files}
    manifest = {"report": OUTPUT.name, "source_version": "revised-photographic",
                "files": sorted(EVIDENCE), "source_hashes": source_hashes,
                "publication_status": "pending-redeployment"}
    (SHOTS / "report-evidence.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Created {OUTPUT}")
    print(f"Evidence files: {len(EVIDENCE)}")


if __name__ == "__main__":
    build()
