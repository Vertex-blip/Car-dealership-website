"""Create the plain Apex Motors student report with original-colour screenshots.

Requires reportlab and Pillow. Screenshots are read from docs/screenshots and
cropped without colour changes in WEB/tmp/plain-report-colour.
The PDF is written to WEB/final-submission unless --output is supplied.
Results are read from docs/verification-summary.json at build time.
Preparation and testing dates are intentionally omitted from the report.
Use --published only after the current hosted version has been verified.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


WORKSPACE = Path(__file__).resolve().parents[2]
PROJECT = WORKSPACE / "final-project"
WIDTH = A4[0] - 108
REPOSITORY = "https://github.com/Vertex-blip/Car-dealership-website"
LIVE = "https://vertex-blip.github.io/Car-dealership-website/final-project/"


def recorded_count(value):
    return value if type(value) is int and value >= 0 else None


def completed_audit(audit, name):
    entry = audit.get(name, {})
    return entry if isinstance(entry, dict) and entry.get("status") == "passed" else {}


def verification_paragraphs(record, published=False):
    """Describe recorded results; absent and pending optional audits stay omitted.

    Optional final_audit entries use status='passed' plus their own count fields:
    frontend: groups_passed, responsive_states, widths (a list)
    security: groups_passed, invalid_email_cases_passed
    api: cases_passed, live_makes_passed
    axe: states_checked, violations
    webkit: status='passed' records only a smoke check, not full certification.
    """
    browser = escape(str(record.get("browser", "the recorded browser")))
    main_groups = len(record.get("passed", []))
    first = (
        f"The {main_groups} main browser check groups passed locally in {browser}. "
        "They covered accounts, profile editing, inquiries, search, navigation, themes and the public API."
    )
    hosted_groups = recorded_count(record.get("hosted_check_groups_passed"))
    if published and record.get("published_site_verified") and hosted_groups:
        first += f" The {hosted_groups} hosted browser groups also passed."
    if record.get("errors") == [] and record.get("failures") == []:
        first += " No uncaught runtime errors or failed local files were recorded."
    paragraphs = [first]

    audit = record.get("final_audit", {})
    if not isinstance(audit, dict):
        audit = {}
    details = []
    frontend = completed_audit(audit, "frontend")
    groups = recorded_count(frontend.get("groups_passed"))
    states = recorded_count(frontend.get("responsive_states"))
    widths = frontend.get("widths", [])
    if groups:
        text = f"Frontend checks passed {groups} groups"
        if states:
            text += f" and {states} layout states"
        if isinstance(widths, list) and widths:
            text += f" at {len(widths)} widths"
        details.append(text + ".")
    security = completed_audit(audit, "security")
    groups = recorded_count(security.get("groups_passed"))
    emails = recorded_count(security.get("invalid_email_cases_passed"))
    if groups:
        text = f"Security checks passed {groups} groups"
        if emails:
            text += f" and {emails} invalid-email cases"
        details.append(text + ".")
    api = completed_audit(audit, "api")
    scenarios = recorded_count(api.get("cases_passed"))
    makes = recorded_count(api.get("live_makes_passed"))
    if scenarios:
        text = f"The API passed {scenarios} scenarios"
        if makes:
            text += f" and live requests for {makes} makes"
        details.append(text + ".")
    axe = completed_audit(audit, "axe")
    states = recorded_count(axe.get("states_checked"))
    violations = recorded_count(axe.get("violations"))
    if states and violations is not None:
        details.append(f"Axe reported {violations} violations across {states} checked states.")
    if completed_audit(audit, "webkit"):
        details.append("A separate WebKit smoke check also passed.")
    if details:
        paragraphs.append(" ".join(details))

    references = recorded_count(record.get("local_html_css_references_checked"))
    missing = recorded_count(record.get("missing_local_references"))
    navigation = recorded_count(record.get("local_navigation_targets_successful"))
    resources = []
    if references is not None and missing is not None:
        resources.append(f"The local file scan checked {references} HTML/CSS references and found {missing} missing targets.")
    if navigation is not None:
        resources.append(f"All {navigation} checked local navigation targets opened successfully.")
    if resources:
        paragraphs.append(" ".join(resources))
    return paragraphs


def register_fonts() -> None:
    font_dir = Path("C:/Windows/Fonts")
    fonts = (
        ("ReportText", "times.ttf", "Times-Roman"),
        ("ReportBold", "timesbd.ttf", "Times-Bold"),
        ("ReportItalic", "timesi.ttf", "Times-Italic"),
    )
    for name, filename, fallback in fonts:
        if (font_dir / filename).is_file():
            pdfmetrics.registerFont(TTFont(name, str(font_dir / filename)))
        else:
            pdfmetrics.registerFont(pdfmetrics.Font(name, fallback, "WinAnsiEncoding"))
    pdfmetrics.registerFontFamily(
        "ReportText", normal="ReportText", bold="ReportBold",
        italic="ReportItalic", boldItalic="ReportBold",
    )


def build_report(args) -> Path:
    register_fonts()
    temp = WORKSPACE / "tmp" / "plain-report-colour"
    temp.mkdir(parents=True, exist_ok=True)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    screenshots = args.screenshots.resolve()
    verification = json.loads(
        (PROJECT / "docs" / "verification-summary.json").read_text(encoding="utf-8")
    )
    if not verification.get("passed") or verification.get("errors") or verification.get("failures"):
        raise RuntimeError("The recorded local verification summary is missing or contains failures.")
    if args.published and (
        not verification.get("published_site_verified")
        or not recorded_count(verification.get("hosted_check_groups_passed"))
        or verification.get("hosted_errors")
        or verification.get("hosted_failures")
    ):
        raise RuntimeError("The recorded hosted verification summary is missing or contains failures.")
    example = verification.get("live_api_example", {})
    example_count = recorded_count(example.get("model_count"))
    if isinstance(example.get("make"), str) and recorded_count(example.get("year")) and example_count is not None:
        example_text = (
            f"The verified live request returned {example_count} "
            f"{escape(example['make'])} models for {example['year']}."
        )
    else:
        example_text = ""

    body = ParagraphStyle(
        "Body", fontName="ReportText", fontSize=12, leading=14.4,
        textColor=colors.black, alignment=TA_LEFT, spaceAfter=8,
    )
    heading = ParagraphStyle(
        "Heading", parent=body, fontName="ReportBold", fontSize=14,
        leading=17, spaceBefore=7, spaceAfter=9, keepWithNext=True,
    )
    report_title = ParagraphStyle(
        "ReportTitle", parent=heading, alignment=TA_CENTER,
        spaceBefore=0, spaceAfter=8,
    )
    information = ParagraphStyle(
        "Information", parent=body, alignment=TA_CENTER,
        leading=14.4, spaceAfter=14,
    )
    caption = ParagraphStyle(
        "Caption", parent=body, fontSize=11, leading=13.2,
        spaceBefore=5, spaceAfter=10,
    )
    links = ParagraphStyle(
        "Links", parent=body, fontSize=11, leading=13.2,
        spaceAfter=7, splitLongWords=True,
    )

    def p(text, style=body):
        return Paragraph(text, style)

    def h(number, text):
        return p(f"{number}. {text}", heading)

    def shot(name, width, height, top=0):
        """Preserve image proportions and original screenshot colours."""
        source = screenshots / name
        if not source.is_file():
            raise FileNotFoundError(f"Screenshot not found: {source}")
        with PILImage.open(source) as original:
            photograph = original.convert("RGB")
            source_width, source_height = photograph.size
            crop_height = min(round(height / width * source_width), source_height)
            crop_top = max(0, min(round(top / 1440 * source_width), source_height - crop_height))
            crop = photograph.crop((0, crop_top, source_width, crop_top + crop_height))
            destination = temp / f"{source.stem}-{int(width)}-{int(height)}-{int(top)}.png"
            crop.save(destination)
        return Image(str(destination), width=width, height=height)

    def figure(name, height, text, top=0):
        return KeepTogether([shot(name, WIDTH, height, top), p(text, caption)])

    story = [
        p("Apex Motors - Final Project Report", report_title),
        p("Group: SE-2507<br/>Team members: Arsen, Kuttibay, Farabi, Muhammad", information),
        h(1, "Project goal and description"),
        p("Apex Motors is a car dealership website. We continued the topic from our earlier assignments and expanded the project from five pages to eight connected pages. The website is intended for car enthusiasts and visitors who want to compare vehicles, save cars they like and prepare an inquiry."),
        p("The collection contains 17 sample vehicles. Visitors can search and filter the collection, view photographs in the showroom and find model names through a public vehicle API. The website uses HTML, CSS and JavaScript. Account data and inquiries are saved in the browser for the project demonstration."),
        h(2, "Work division"),
        p("<b>Muhammad:</b> visual design, responsive layouts and light/dark styles."),
        p("<b>Arsen:</b> sign-up, log-in, profile and inquiry form validation."),
        p("<b>Farabi:</b> vehicle data, search and filters, and public API integration."),
        p("<b>Kuttibay:</b> page content, photograph organisation, usability testing and submission preparation."),
        figure("index-desktop.png", 270, "Figure 1. The Home page of Apex Motors."),
        PageBreak(),
        h(3, "Website pages"),
        p("All eight pages use the same navigation and styles. The account link opens either the sign-in form or the visitor's profile, depending on the saved session."),
        p("<b>Home (index.html).</b> Introduces the project and shows featured cars, categories and collection counters."),
        p("<b>Collection (inventory.html).</b> Displays the vehicle cards. Visitors can search by name, use suggestions, select a category, change the sorting order and show only saved cars."),
        p("<b>Showroom (showroom.html).</b> Shows vehicle photographs. Thumbnails, previous/next buttons and keyboard arrows change the main photograph and caption."),
        p("<b>About (about.html).</b> Contains the project story and team members. It also includes FAQ search, expandable answers and a rating control."),
        p("<b>Inquiry (inquiry.html).</b> Uses Contact, Preferences and Review steps. After validation, the inquiry is saved locally and a confirmation is shown."),
        p("<b>Account (account.html).</b> Contains sign-up and log-in forms, password visibility controls and inline error messages."),
        p("<b>Profile (profile.html).</b> Shows the signed-in user's details, saved cars and inquiry history. Contact details can be edited, and the user can log out."),
        p("<b>Model finder (research.html).</b> Loads model names for a selected make and year. Visitors can filter these names and use a model to search the Collection."),
        figure("inventory-desktop.png", 185, "Figure 2. Collection search controls, filters and vehicle cards.", top=425),
        PageBreak(),
        h(4, "JavaScript functionality and form validation"),
        p("Sign-up validates the user's details and password confirmation. Passwords need at least eight characters with uppercase and lowercase letters, a number and a symbol. localStorage keeps the account record, using a salted PBKDF2 hash with 600,000 rounds. Log-in checks the credentials and opens Profile; guests are sent to Account. Return redirects are restricted to known pages within this project."),
        figure("profile-desktop.png", 171, "Figure 3. Profile details and cars saved by the demo user.", top=190),
        p("Every form uses novalidate. JavaScript applies practical email syntax checks, password rules and phone checks for 7 to 15 digits, with inline errors. Browser validation attributes are not the validation mechanism. Inquiries belong to account IDs rather than editable email addresses. Step changes keep the current inquiry values; changing accounts clears old drafts."),
        figure("inquiry-desktop.png", 162, "Figure 4. The first step of the Inquiry form.", top=435),
        p("Search, categories, sorting and the saved-only filter work together. Favourites are stored separately per account; signing in adopts the guest shortlist. FAQ search highlights matching text. A shared Content Security Policy restricts loaded scripts and resource origins, but browser-local accounts are a simulation, not a backend security boundary."),
        PageBreak(),
        h(5, "Public API integration"),
        p("The Model finder uses the public NHTSA vPIC API. A visitor chooses a make and model year, and fetch() with async/await requests model names in JSON format. The result names are sorted and displayed as cards. Each card links to a Collection search, so the API is connected to the main car browsing features."),
        figure("research-desktop.png", 254, "Figure 5. Porsche model names returned by the NHTSA API.", top=220),
        p("The page shows a loading message while the request is running. Network errors and requests that take too long produce an explanation and a Try again button. Successful results can be kept for 24 hours. If the live request fails, a matching saved result is clearly marked as saved data. The API supplies reference model names; it does not represent the dealership's stock or provide its prices."),
        p("The request uses the GetModelsForMakeYear endpoint with the selected make, model year and format=json. " + example_text),
        p('Official documentation: <link href="https://vpic.nhtsa.dot.gov/api/" color="blue"><u>https://vpic.nhtsa.dot.gov/api/</u></link>', links),
        h(6, "File organisation"),
        p("Each page has a separate HTML file. Shared styles are in css/, JavaScript is in js/, photographs are in images/, and supporting media and source information are in assets/. The local jQuery library and its licence are in vendor/. Shared vehicle data is used by the Collection and Inquiry pages. Comments explain the more complex storage, account and API code."),
        PageBreak(),
        h(7, "Design and responsiveness"),
        p("We kept the Endterm fonts, spacing and vehicle photographs. CSS Grid and Flexbox adapt the pages to desktop, tablet and mobile screens. The mobile menu opens through a button. Left/right arrow keys move between navigation links; Enter opens the selected page."),
        p("The light/dark switch and Appearance panel remember the mode and background tint across pages and reloads. Visitors can choose a tint, try a random colour or reset the background. Both modes keep text readable. Hover transitions, notifications and button loading states give feedback. Reduced-motion preferences are respected."),
    ]

    # Two ordinary screenshots, without frames, backgrounds or decorative rules.
    images = Table([[
        shot("index-dark.png", 360, 200),
        shot("account-mobile.png", 110, 282, top=480),
    ]], colWidths=[WIDTH - 120, 120], hAlign="LEFT")
    images.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.extend([
        KeepTogether([images, p("Figure 6. Dark mode on Home and the Account form on a mobile screen.", caption)]),
        h(8, "Testing, hosting and limitations"),
    ])
    story.extend(p(text) for text in verification_paragraphs(verification, args.published))
    status = "Live website" if args.published else "Website address (publication not verified)"
    story.extend([
        p(f'Repository: <link href="{REPOSITORY}" color="blue"><u>{REPOSITORY}</u></link>', links),
        p(f'{status}: <link href="{LIVE}" color="blue"><u>{LIVE}</u></link>', links),
        p("This is a frontend course project. Account data stays in the browser, inquiries are not sent to a real dealership, and vehicle prices are sample values. A future version could add a backend, verified inventory and real inquiry delivery."),
    ])

    def footer(canvas, document):
        canvas.saveState()
        canvas.setFillColor(colors.black)
        canvas.setFont("ReportText", 10)
        canvas.drawCentredString(A4[0] / 2, 28, str(document.page))
        canvas.restoreState()

    document = SimpleDocTemplate(
        str(args.output), pagesize=A4,
        leftMargin=54, rightMargin=54, topMargin=45, bottomMargin=45,
        title="Apex Motors - Final Project Report",
        author="Arsen, Kuttibay, Farabi, Muhammad - SE-2507",
        subject="Final project report",
    )
    document.build(story, onFirstPage=footer, onLaterPages=footer)
    return args.output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--screenshots", type=Path, default=PROJECT / "docs" / "screenshots")
    parser.add_argument("--output", type=Path, default=WORKSPACE / "final-submission" / "ApexMotors_SE2507_Report.pdf")
    parser.add_argument("--published", action="store_true")
    arguments = parser.parse_args()
    output = build_report(arguments)
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print(output)
