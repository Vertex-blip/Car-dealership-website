"""Build the seven-page final report from verified website screenshots.

Run from any directory with a Python environment containing reportlab and Pillow.
Screenshots default to docs/screenshots. The report is written outside the
website folder, into WEB/final-submission. Pass --published only after verifying
the final hosted URL; otherwise the report explicitly marks publication pending.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
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
NAVY = colors.HexColor("#172631")
GOLD = colors.HexColor("#9a6a35")
MUTED = colors.HexColor("#52606b")
PALE = colors.HexColor("#f3f0ea")
LINE = colors.HexColor("#dcdedc")
WIDTH = A4[0] - 88


def register_fonts() -> None:
    font_dir = Path("C:/Windows/Fonts")
    fonts = (("Apex", "arial.ttf", "Helvetica"), ("ApexBold", "arialbd.ttf", "Helvetica-Bold"), ("ApexItalic", "ariali.ttf", "Helvetica-Oblique"))
    for name, filename, fallback in fonts:
        if (font_dir / filename).is_file():
            pdfmetrics.registerFont(TTFont(name, str(font_dir / filename)))
        else:
            pdfmetrics.registerFont(pdfmetrics.Font(name, fallback, "WinAnsiEncoding"))
    pdfmetrics.registerFontFamily("Apex", normal="Apex", bold="ApexBold", italic="ApexItalic", boldItalic="ApexBold")


def styles():
    sheet = getSampleStyleSheet()
    definitions = {
        "Body": dict(fontName="Apex", fontSize=10, leading=14.1, textColor=NAVY, spaceAfter=8),
        "TitleApex": dict(fontName="ApexBold", fontSize=34, leading=39, textColor=NAVY, spaceAfter=6),
        "SubtitleApex": dict(fontName="Apex", fontSize=15, leading=20, textColor=MUTED, spaceAfter=14),
        "Kicker": dict(fontName="ApexBold", fontSize=9, leading=12, textColor=GOLD, spaceAfter=10),
        "HeadingApex": dict(fontName="ApexBold", fontSize=21, leading=25, textColor=NAVY, spaceAfter=13),
        "SectionApex": dict(fontName="ApexBold", fontSize=12, leading=16, textColor=NAVY, spaceBefore=5, spaceAfter=6),
        "CaptionApex": dict(fontName="ApexItalic", fontSize=8.2, leading=11.2, textColor=MUTED, spaceBefore=5, spaceAfter=11),
        "SmallApex": dict(fontName="Apex", fontSize=8.5, leading=12, textColor=MUTED, spaceAfter=7),
        "CellApex": dict(fontName="Apex", fontSize=9.1, leading=12.4, textColor=NAVY, spaceAfter=0),
        "CellHeadApex": dict(fontName="ApexBold", fontSize=9.1, leading=12.4, textColor=NAVY, spaceAfter=0),
        "CalloutApex": dict(fontName="Apex", fontSize=9.1, leading=13, textColor=NAVY, spaceAfter=0),
    }
    for name, settings in definitions.items():
        sheet.add(ParagraphStyle(name=name, alignment=TA_LEFT, **settings))
    return sheet


def build_report(args) -> Path:
    register_fonts()
    style = styles()
    screenshots = args.screenshots.resolve()
    temp = WORKSPACE / "tmp" / "report"
    temp.mkdir(parents=True, exist_ok=True)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    verification_file = PROJECT / "docs" / "verification-summary.json"
    verification = json.loads(verification_file.read_text(encoding="utf-8"))
    if len(verification.get("passed", [])) != 11 or verification.get("errors") or verification.get("failures"):
        raise RuntimeError("The expected clean final browser verification record is missing.")
    if args.published and (not verification.get("published_site_verified") or verification.get("hosted_check_groups_passed") != 11 or verification.get("hosted_errors") or verification.get("hosted_failures")):
        raise RuntimeError("The expected clean hosted browser verification record is missing.")

    def p(text, name="Body"):
        return Paragraph(text, style[name])

    def title(number, text):
        return [p(f"FINAL PROJECT / {number:02d}", "Kicker"), p(text, "HeadingApex")]

    def table(headers, rows, widths):
        data = [[p(escape(x), "CellHeadApex") for x in headers]]
        data.extend([[p(x, "CellApex") for x in row] for row in rows])
        result = Table(data, colWidths=widths, hAlign="LEFT", repeatRows=1)
        result.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), PALE),
            ("LINEBELOW", (0, 0), (-1, 0), 0.7, GOLD),
            ("LINEBELOW", (0, 1), (-1, -1), 0.4, LINE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 9),
            ("RIGHTPADDING", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        return result

    def shot(name, width, height, top=0):
        """Crop a readable detail without distorting the captured website."""
        source = screenshots / name
        if not source.is_file():
            raise FileNotFoundError(f"Verified screenshot required: {source}")
        with PILImage.open(source) as original:
            rgb = original.convert("RGB")
            source_width, source_height = rgb.size
            crop_height = min(round(height / width * source_width), source_height)
            crop_top = min(round(top / 1440 * source_width), source_height - crop_height)
            crop_top = max(0, crop_top)
            crop = rgb.crop((0, crop_top, source_width, crop_top + crop_height))
            destination = temp / f"{source.stem}-{int(width)}-{int(height)}-{int(top)}.jpg"
            crop.save(destination, quality=95, subsampling=0)
        return Image(str(destination), width=width, height=height)

    def figure(name, height, caption, top=0):
        return [shot(name, WIDTH, height, top), p(caption, "CaptionApex")]

    def callout(text):
        box = Table([[p(text, "CalloutApex")]], colWidths=[WIDTH])
        box.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), PALE),
            ("BOX", (0, 0), (-1, -1), 0.5, LINE),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("TOPPADDING", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ]))
        return box

    story = []
    story.extend([
        p("WEB TECHNOLOGIES / SE-2507 / 15 NOVEMBER 2026", "Kicker"),
        p("Apex Motors", "TitleApex"),
        p("Final Project Report", "SubtitleApex"),
        p("A responsive car dealership website for exploring a curated collection, saving favourite vehicles and preparing an inquiry. The final project continues the team's existing Apex Motors topic and expands the earlier five-page site into eight connected pages."),
        Spacer(1, 4),
    ])
    story.extend(figure("index-desktop.png", 282, "Figure 1. Home page, final local version. A restrained layout gives vehicle photography and clear calls to action priority."))
    story.extend([
        table(["Project", "Team"], [["Apex Motors<br/>Group SE-2507", "Arsen, Kuttibay, Farabi, Muhammad"]], [168, WIDTH - 168]),
        Spacer(1, 12),
        callout("<b>Scope:</b> HTML, CSS and JavaScript frontend with local account simulation, persistent preferences and a public vehicle API. The collection contains <b>17 illustrative vehicle records</b>. There is no dealership backend or real payment/inquiry delivery."),
        Spacer(1, 10),
        p("Prepared for the Final Project submission and five-minute team presentation.", "SmallApex"),
        PageBreak(),
    ])

    story.extend(title(2, "Purpose, team and page structure"))
    story.append(p("<b>Goal and audience.</b> Apex Motors serves car enthusiasts and visitors comparing vehicle styles. A visitor can discover a car, narrow the collection, keep a shortlist and prepare an inquiry. Model finder adds reference information relevant to the same car-shopping journey."))
    story.append(p("Approved work division", "SectionApex"))
    story.append(table(["Member", "Responsibility"], [
        ["Muhammad", "Visual design, responsive layouts, light/dark styles."],
        ["Arsen", "Account, log-in, profile and inquiry validation."],
        ["Farabi", "Vehicle data, search/filter and public API integration."],
        ["Kuttibay", "Content, photography organisation, usability testing and submission preparation."],
    ], [98, WIDTH - 98]))
    story.append(Spacer(1, 12))
    story.append(p("Eight connected pages", "SectionApex"))
    story.append(table(["Page / file", "Purpose and main functionality"], [
        ["Home<br/><b>index.html</b>", "Introduces the collection with featured vehicles, categories and data-based counters."],
        ["Collection<br/><b>inventory.html</b>", "Search, suggestions, category filters, sorting, empty results and persistent saved cars."],
        ["Showroom<br/><b>showroom.html</b>", "Vehicle photographs, thumbnails, captions, previous/next controls and keyboard navigation."],
        ["About<br/><b>about.html</b>", "Project story, four team members, searchable FAQ and interactive rating."],
        ["Inquiry<br/><b>inquiry.html</b>", "Contact details, vehicle preferences, JavaScript validation, review and local confirmation."],
        ["Account<br/><b>account.html</b>", "Sign-up and log-in forms, password visibility controls and inline validation."],
        ["Profile<br/><b>profile.html</b>", "Authenticated user details, editable contact information, saved cars, local inquiries and log-out."],
        ["Model finder<br/><b>research.html</b>", "Live model names by make/year, result filtering and links back to Collection search."],
    ], [126, WIDTH - 126]))
    story.append(PageBreak())

    story.extend(title(3, "Discovery, photography and interaction"))
    story.append(p("<b>Collection.</b> The 17 vehicle records share a consistent data structure. Search updates cards and result counts immediately; categories, sorting and the saved-only view work together. Saving a car updates the local shortlist. Model finder results can start a Collection search through the URL query."))
    story.extend(figure("inventory-desktop.png", 193, "Figure 2. Collection detail: clear search and filter controls lead into consistently styled vehicle cards.", top=425))
    story.append(p("<b>Showroom and About.</b> The gallery changes its photograph, caption and selected thumbnail together. Previous/next buttons and keyboard arrows offer alternative controls. About introduces the team and includes FAQ search and a rating interaction, keeping supporting content useful."))
    story.extend(figure("showroom-desktop.png", 212, "Figure 3. Showroom detail: large photography, concise labels and gallery controls support visual browsing.", top=397))
    story.append(p("<b>UI effects.</b> Hover transitions, button feedback, counters and save notifications communicate actions. Motion respects reduced-motion preferences. Shared navigation and reusable components keep the experience consistent across pages.", "SmallApex"))
    story.append(PageBreak())

    story.extend(title(4, "Accounts, profile and validated inquiries"))
    story.append(p("<b>Authentication simulation.</b> Sign-up validates name, email, phone, password complexity and confirmation. Passwords require at least eight characters with uppercase, lowercase, number and symbol. A salted PBKDF2 hash is stored in localStorage rather than the plain password. Log-in checks the stored credentials; a guest visiting Profile is redirected to Account."))
    story.extend(figure("profile-desktop.png", 180, "Figure 4. Profile detail: the signed-in visitor can review account details and saved activity.", top=190))
    story.append(p("<b>Profile continuity.</b> Validated contact editing, the saved shortlist and local inquiry history bring activity together. Log-out removes the session; storage errors receive readable feedback."))
    story.append(p("<b>Inquiry flow.</b> Contact, Preferences and Review form three clear steps. Data remains available when moving back; signed-in contact details can prefill the form. Required fields, email and phone formats are checked in JavaScript, with errors next to the relevant controls. All forms use <b>novalidate</b>; browser validation attributes are not the validation mechanism."))
    story.extend(figure("inquiry-desktop.png", 169, "Figure 5. Inquiry detail: a step indicator and focused form make the simulated process easy to follow.", top=435))
    story.append(callout("<b>Local demonstration:</b> submitting an inquiry saves a local record and confirmation; it does not send email or contact a real dealership. Account data and session state remain in this browser and origin. This is coursework authentication, not a production security system."))
    story.append(PageBreak())

    story.extend(title(5, "A public API that fits the project"))
    story.append(p("Model finder uses the <b>NHTSA vPIC public API</b> to retrieve vehicle model names for a selected make and model year. It complements the local curated Collection: API reference models are not presented as vehicles the dealership has in stock."))
    story.extend(figure("research-desktop.png", 269, "Figure 6. Model finder detail: make/year selection and live model results. The local browser verification returned eight Porsche models for 2024.", top=220))
    story.append(table(["Behaviour", "Implementation"], [
        ["Request", "fetch() with async/await; the JSON Results array supplies model names and IDs. Duplicate names are removed and results are sorted."],
        ["Loading and failure", "Visible status and busy feedback; a 15-second timeout; clear network/error text and a Try again action. A changed selection supersedes an older request."],
        ["Saved results", "Successful results are cached for up to 24 hours. If live access fails, a matching saved result is clearly labelled; cache size is bounded."],
        ["Useful next step", "Result filtering is immediate. Each model links to a Collection search, connecting external data to the website's main purpose."],
    ], [112, WIDTH - 112]))
    story.append(Spacer(1, 10))
    story.append(p("<b>Endpoint used</b><br/>GetModelsForMakeYear/make/{make}/modelyear/{year}?format=json", "SmallApex"))
    story.append(p('Official API documentation: <link href="https://vpic.nhtsa.dot.gov/api/" color="#9a6a35">https://vpic.nhtsa.dot.gov/api/</link>. Model catalogue data is external and can change. The request does not supply stock availability, pricing or photographs.', "SmallApex"))
    story.append(PageBreak())

    story.extend(title(6, "A consistent design on every screen"))
    story.append(p("<b>Design decisions.</b> A restrained palette, strong typography, consistent spacing and vehicle photography establish the dealership theme. Grid and flex layouts adapt the cards, forms and navigation. Light/dark colour variables preserve hierarchy, and the selected theme is retained across pages through localStorage."))
    design_detail = Table([
        [shot("index-dark.png", 333, 185, top=0)],
        [p("<b>Shared visual choices</b><br/>Serif display headings and clean body text.<br/>Photography-led layouts and restrained blue actions.<br/>Consistent surfaces, borders and spacing.<br/>Visible focus, field errors and progress feedback.", "SmallApex")],
    ], colWidths=[333])
    design_detail.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, 0), 0),
        ("TOPPADDING", (0, 1), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    preview = Table([[
        design_detail,
        shot("account-mobile.png", 153, 392, top=480),
    ]], colWidths=[WIDTH - 164, 164], hAlign="LEFT")
    preview.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(preview)
    story.append(p("Figure 7. Dark Home and mobile Account details demonstrate the shared design system at different sizes.", "CaptionApex"))
    story.append(p("<b>Responsive behaviour.</b> Wide layouts provide space for photography and controls. Smaller layouts stack content, adapt the collection grid and expose compact navigation. Form controls and text stay within the viewport. Desktop, tablet and mobile widths were included in the recorded Chromium run."))
    story.append(p("<b>Themes and interaction.</b> The same visual hierarchy is retained in both modes. Sampled body text, muted text, buttons and navigation met a contrast ratio of at least 4.5:1 in both themes. Focus feedback, readable errors and control labels support navigation; gallery arrows and search suggestions also have keyboard interactions."))
    story.append(p("<b>Code organisation.</b> HTML pages, shared CSS, JavaScript modules, photographs, support assets and the local library are separated into clear folders. Shared vehicle data supplies the collection and inquiry choices. Complex state, storage and API behaviour include explanatory comments."))
    story.append(PageBreak())

    story.extend(title(7, "Recorded checks and final delivery"))
    story.append(p("Recorded verification - 15 November 2026", "SectionApex"))
    story.append(table(["Coverage", "Recorded result"], [
        ["Functional browser checks", "11 check groups passed: guest access, validation, sign-up/hash/profile, collection/search, theme/gallery, inquiry, contact editing, navigation, live API and log-in/log-out."],
        ["Responsive layout", "Seven pages in a signed-in browser session at 320, 390, 768, 1024 and 1440 px, in both themes: no horizontal overflow. Sign-up widths were checked separately."],
        ["Runtime and resources", "Zero recorded JavaScript runtime errors and zero failed local resources in the verification run."],
        ["Independent review", "27 additional assertions passed: About disclosure, FAQ search/clear, rating persistence, clipboard, gallery keyboard/thumbnail behaviour, three sort orders and autocomplete keys."],
        ["Static paths and navigation", "283 local HTML/CSS references checked with zero missing targets; 44 unique local navigation targets returned successful HTTP responses."],
        ["External API", "The live NHTSA request returned eight Porsche models for 2024. Result filtering and links to Collection were exercised."],
        ["Hosted browser checks", "The same 11 scenario groups passed on the final hosted origin, including authentication, profile, inquiry, search, responsive themes and live API. Zero runtime errors and zero failed local resources were recorded."],
    ], [137, WIDTH - 137]))
    story.append(Spacer(1, 9))
    story.append(p("The original checks used http://127.0.0.1:4173/. The same 11 browser scenario groups were then repeated successfully at the final hosted address below. The additional 27 assertions and static/reference counts are local evidence. These results describe the observed build; external API availability and future site changes can vary.", "SmallApex"))
    story.append(p("<b>Browser scope:</b> local and hosted automated browser evidence is from Chromium. It does not claim Safari or Firefox certification.", "SmallApex"))
    story.append(p("Hosting and submission", "SectionApex"))
    live_status = "Verified final hosted website" if args.published else "Intended final website address (publication not yet verified)"
    story.append(p('Repository: <link href="https://github.com/Vertex-blip/Car-dealership-website" color="#9a6a35">github.com/Vertex-blip/Car-dealership-website</link><br/>' + live_status + ': <link href="https://vertex-blip.github.io/Car-dealership-website/final-project/" color="#9a6a35">vertex-blip.github.io/Car-dealership-website/final-project/</link>', "SmallApex"))
    story.append(p("<b>Future improvements:</b> a secure backend, verified inventory and genuine inquiry delivery. Presentation preparation and the ZIP/PDF/TXT submission checklist are included in docs/.", "SmallApex"))
    story.append(p("The submission set consists of ApexMotors_SE2507_FinalProject.zip, ApexMotors_SE2507_Report.pdf and ApexMotors_SE2507_Links.txt. Each team member submits all three files individually. The report PDF is separate from the website source folder.", "SmallApex"))

    def frame(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(NAVY)
        canvas.setFont("ApexBold", 9)
        canvas.drawString(44, A4[1] - 31, "APEX MOTORS")
        canvas.setFillColor(MUTED)
        canvas.setFont("Apex", 8)
        canvas.drawRightString(A4[0] - 44, A4[1] - 31, "FINAL PROJECT REPORT")
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.6)
        canvas.line(44, A4[1] - 40, A4[0] - 44, A4[1] - 40)
        canvas.line(44, 40, A4[0] - 44, 40)
        canvas.setFont("Apex", 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(44, 26, "SE-2507  |  15 November 2026")
        canvas.drawRightString(A4[0] - 44, 26, f"{doc.page} / 7")
        canvas.restoreState()

    document = SimpleDocTemplate(
        str(args.output), pagesize=A4, rightMargin=44, leftMargin=44,
        topMargin=58, bottomMargin=52, title="Apex Motors - Final Project Report",
        author="Arsen, Kuttibay, Farabi, Muhammad - SE-2507",
        subject="Responsive eight-page car dealership website final project",
    )
    document.build(story, onFirstPage=frame, onLaterPages=frame)
    return args.output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--screenshots", type=Path, default=PROJECT / "docs" / "screenshots")
    parser.add_argument("--output", type=Path, default=WORKSPACE / "final-submission" / "ApexMotors_SE2507_Report.pdf")
    parser.add_argument("--published", action="store_true")
    options = parser.parse_args()
    result = build_report(options)
    print(result)
