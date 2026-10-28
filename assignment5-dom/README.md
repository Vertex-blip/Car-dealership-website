# Apex Motors - Assignment 5

**Team:** Apex Motors

**Group:** SE-2507

**Members:** Arsen, Kuttibay, Farabi, Muhammad

An interactive dealership experience continuing the team's existing Apex Motors theme. This version uses plain HTML, CSS, and JavaScript, with local assets and no build step.

**Website:** https://vertex-blip.github.io/Car-dealership-website/assignment5-dom/

## Run the project

Open `index.html` in a modern browser. You can also serve the repository root with a static server and open `/assignment5-dom/`. No account, package installation, or API key is needed.

The booking flow is a local demonstration. Completing it displays a confirmation in the page; it does not make a real reservation or create an account. Personal details and passwords are not stored. Theme preferences and saved vehicle IDs may be stored locally when browser storage is available.

## What to try

1. Filter the vehicle collection, search, sort by price, and save vehicles.
2. Open a vehicle's details and switch gallery thumbnails. Close the dialog with its close button, Escape, or a click outside it.
3. Switch between day and night themes, choose a star rating, and reveal the dealership story.
4. Focus a navigation link, then use the arrow keys, Home, and End to move between links. Enter follows a link.
5. Complete the three-step booking preview. Try invalid values, go Back to check retained inputs, review your details, then confirm or reset.
6. Play the notification sound repeatedly. Playback restarts rather than overlapping.
7. Open and close FAQ answers, display the current time, and observe the live clock.

## Project structure

| Path | Purpose |
| --- | --- |
| `index.html` | Semantic page structure, forms, dialogs, and linked external scripts |
| `styles.css` | Responsive layouts, themes, component states, and animation |
| `js/data.js` | Vehicle objects, shared methods, and notification utility |
| `js/inventory.js` | Dynamic cards, filtering, sorting, saved vehicles, detail gallery |
| `js/experience.js` | Theme, keyboard navigation, sound, rating, story, FAQ, and clock |
| `js/booking.js` | Validated multi-step form, callbacks, review, reset, and confirmation |
| `images/` | Local images reused from the team's earlier project |
| `screenshots/` | Browser evidence and actual source-code screenshots used in the report |
| `tools/` | Reproducible verification and report-generation utilities |
| `Assignment-5-Report.pdf` | Task descriptions, implementation steps, screenshots, URL, and reflection |
| `REQUIREMENTS.md` | Requirement-to-feature checklist |
| `DEFENSE-GUIDE.md` | Kazakh walkthrough for the practice-lesson defense |

## Assignment choices

The brief offers alternatives. The style requirement is fulfilled by a day/night theme switch. Attribute manipulation is fulfilled by the image gallery; the story toggle and star rating provide additional examples. The callback requirement is fulfilled by the stateful multi-step form, so a network POST is not needed. A category filter implements the `switch` requirement.

See the PDF report and `REQUIREMENTS.md` for the complete mapping, and `screenshots/test-results.json` for recorded browser checks when present.

## Verification and deployment

The browser suite passed **47 behavior checks** in Chrome over HTTP, Edge over HTTP, and Chrome with a local file (**141/141 assertions**, no runtime or missing-resource errors). A separate check of the deployed GitHub Pages site passed **47/47** in Chrome at desktop and mobile sizes. Results are recorded in `screenshots/test-results.json` and `test-results-live.json`.

Application commit `2f6c319` was pushed to the shared `main` branch. GitHub Pages workflow `40733558563` completed successfully, and the deployed URL returned HTTP 200 with the expected page title. The final submission package also includes the report and evidence.

## Submission

Submit the **PDF report** and the **ZIP project archive** through the LMS. Every team member must submit individually and attend the defense. The supplied LMS screenshot shows **29 October 2026 at 14:00**; the LMS remains the source of truth for the deadline.

The defense is worth **40%** of the assignment. Each member should run all interactions, understand the code, and practise making a small change independently. The guide suggests defense leads without claiming that the suggested work has already been performed by those members.
