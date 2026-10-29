# Apex Motors - Assignment 5

**Team:** Apex Motors

**Group:** SE-2507

**Members:** Arsen, Kuttibay, Farabi, Muhammad

A photographic dealership website with 17 vehicles, separate HTML pages, shared CSS and JavaScript. The collection, showroom, inquiry and team have their own addresses. Navigation opens another page instead of scrolling through one long document.

## Open the project

Extract `Assignment-5-Project.zip`, open `Apex-Motors-Assignment-5`, then open `index.html` in a current desktop browser. Photographs, styles, scripts and sound are included locally. No installation, account or network service is required. For development, use an ordinary static HTTP server from this folder.

The inquiry is a classroom demonstration: it validates values and displays confirmation in the browser. It does not send contact details to a dealership. Use sample values.

## Pages and interactions

| Page | What to try |
| --- | --- |
| `index.html` | Explore the photographic Mercedes feature and follow the collection and showroom links. |
| `inventory.html` | Browse and filter 17 vehicles; save cars and use Saved to view the shortlist. |
| `inventory.html?saved=1` | Open the saved collection directly. |
| `showroom.html` | Choose thumbnails and use Previous/Next to explore the full-size photographic gallery. |
| `inquiry.html` | Complete Contact, Preferences and Review. Try errors, Next, Back, confirmation and Reset. |
| `about.html` | Meet the original team, expand Read More and explore the FAQ. |

Every page shares navigation and appearance controls. The theme button switches day/night. The background button generates another hue each time rather than cycling three fixed colors. Preferences follow navigation and survive reloads when browser storage is available.

Use Tab to reach navigation or press an arrow key when the page has focus. Right/Down moves forward and Left/Up backward, with wraparound and a short sound. Enter opens the focused page. Arrow navigation moves focus without scrolling the main content. Sound starts after a user action and can be muted. Reduced-motion preferences are respected.

## Photography and shared vehicle data

The home page uses high-resolution automotive photography. The showroom builds on that visual style with a full-size image, descriptive captions, thumbnails and previous/next controls. JavaScript updates the displayed image's `src` and `alt`, the caption and selected-thumbnail state. This directly demonstrates DOM attribute manipulation.

The collection contains the Mercedes and 16 other listings. The original image records now use the photographed vehicle names Hyundai Accent, Audi RS 6 Avant and Audi A5 Sportback. Years and prices are illustrative guide values for this classroom project, not verified sale offers.

## Source structure

- Five `.html` files contain page structure and semantic controls.
- `styles.css` contains responsive appearance and interaction states.
- `js/data.js` contains shared vehicle objects, methods and collection data.
- `js/theme-init.js` restores appearance preferences before the page is displayed.
- `js/site.js` handles navigation, audio, appearance controls, Read More, FAQ and shared animation.
- `js/inventory.js` creates cards, applies collection filters and manages saved vehicles.
- `js/booking.js` fills vehicle choices, validates the inquiry and navigates steps using a callback.
- `js/gallery.js` changes the photographic showroom's main image, caption and thumbnail state.
- `images/` and `assets/` contain local photography, provenance records, icons and sound.
- `screenshots/` contains browser evidence, source-code images and current verification.
- `tools/verify.cjs` checks the site; `tools/build_report.py` creates the report from current source and evidence; `tools/package_project.py` verifies ZIP contents.

## Assignment choices

The actual brief is **Frontend Assignment 5 JS and DOM Manipulation**. Its OR groups allow alternatives. This project implements dynamic styling and a day/night switch, provides both Read More and thumbnail-driven image changes for the content/attribute option, and uses a multistep inquiry for the callback option. Category filtering demonstrates `switch`; objects, an explicit loop and higher-order array functions demonstrate the data requirements. Sound and animation respond to user events.

The brief requires separation of HTML, CSS and JavaScript. It does not require all content to be in one HTML file. See `REQUIREMENTS.md` for the requirement map and `DEFENSE-GUIDE.md` for a Kazakh demonstration guide.

## Verification and publication

`screenshots/test-results.json` records checks against the revised local build. Read its checked address, browser, timestamp and results before referring to a pass count. Code and screenshots in the PDF come from the revised build.

**Publication address:** https://vertex-blip.github.io/Car-dealership-website/assignment5-dom/

The photographic revision is **published and verified at the same URL**. Application commit: [`dfcfdf9481af`](https://github.com/Vertex-blip/Car-dealership-website/commit/dfcfdf9481af9c3929c8a43a08d2f10e03ed6272). The [GitHub Pages workflow completed successfully](https://github.com/Vertex-blip/Car-dealership-website/actions/runs/40892341554).

Verification passed **113/113 local HTTP checks, 33/33 direct-file checks and 113/113 live website checks**. The current release record is `deployment.json`; the live target, application commit, workflow and browser results are in `screenshots/test-results-live.json`. The report and ZIP include this current publication evidence.

## Submission

Each member submits `Assignment-5-Report.pdf` and `Assignment-5-Project.zip` separately through the LMS by its current deadline and defends the work during the practice lesson. The defense is worth 40%; every member should understand the entire implementation and be able to make a small change.
