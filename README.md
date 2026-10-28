# Apex Motors

Responsive dealership website by Team Apex Motors, Group SE-2507. The repository contains the framework-free Assignment 1/2 site at its root, the Bootstrap Assignment 3 in `assignment3-bootstrap/`, the JavaScript Assignment 4 in `assignment4-javascript/`, and the interactive Assignment 5 showroom in `assignment5-dom/`.

## Live websites

- **Assignment 5 (Advanced JavaScript and DOM):** https://vertex-blip.github.io/Car-dealership-website/assignment5-dom/
- **Midterm / Assignments 1–2:** https://vertex-blip.github.io/Car-dealership-website/
- **Assignment 3 (Bootstrap):** https://vertex-blip.github.io/Car-dealership-website/assignment3-bootstrap/
- **Assignment 4 (JavaScript):** https://vertex-blip.github.io/Car-dealership-website/assignment4-javascript/

## Run locally

Open `index.html` directly, or serve the repository root using any static file server. For example, with Python:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000/`. The root website uses only its own CSS and local image files; it does not use Bootstrap or a JavaScript framework. Assignment 3 intentionally loads Bootstrap 5.3.3 from jsDelivr and keeps its stylesheet, pages, images, screenshots, report, and ZIP inside `assignment3-bootstrap/`.

The contact forms are front-end demonstrations only: they validate in the browser and do not send or store personal information.

## Assignment submission files

The cumulative nine-page, framework-free website is packaged separately for Assignment 1 and Assignment 2. Each archive includes the same root HTML pages, stylesheet, local images, and README; neither contains the Bootstrap Assignment 3 folder or a nested archive.

- [Assignment 1 ZIP](https://github.com/Vertex-blip/Car-dealership-website/raw/main/submissions/Apex-Motors-Assignment-1.zip)
- [Assignment 2 ZIP](https://github.com/Vertex-blip/Car-dealership-website/raw/main/submissions/Apex-Motors-Assignment-2.zip)
- [Assignment 1 report PDF](https://github.com/Vertex-blip/Car-dealership-website/raw/main/submissions/Apex-Motors-Assignment-1-Report.pdf)
- [Assignment 2 report PDF](https://github.com/Vertex-blip/Car-dealership-website/raw/main/submissions/Apex-Motors-Assignment-2-Report.pdf)
- [Assignment 3 ZIP](https://github.com/Vertex-blip/Car-dealership-website/raw/main/assignment3-bootstrap/Assignment-3-Project.zip) — pages, assets, screenshots, and report

The Assignment 3 report is [available as a PDF](https://github.com/Vertex-blip/Car-dealership-website/raw/main/assignment3-bootstrap/Assignment-3-Report.pdf). Editable A1/A2 report HTML and captured page evidence are in `submissions/`.

## Root website pages

| Page | Purpose |
| --- | --- |
| `index.html` | Dealership home and featured vehicles |
| `inventory.html` | Responsive vehicle inventory |
| `vehicle-detail.html` | Vehicle specifications and test-drive links |
| `services.html` | Maintenance and ownership services |
| `financing.html` | Finance information and illustrative estimate |
| `compare.html` | Side-by-side vehicle comparison table |
| `showroom.html` | Responsive image gallery |
| `about.html` | Dealership story and supplied team portraits |
| `contact.html` | Accessible test-drive and contact form |

Shared root styles live in `css/style.css`; all root-site images, including the supplied logo and team portraits, are stored in `images/`. The main pages use responsive Flexbox and CSS Grid layouts, with the comparison table kept readable through horizontal scrolling on narrow screens.

## Midterm upload

Submit `Apex-Motors-Midterm-Project.zip` from `submissions/`. It contains the nine framework-free pages, shared stylesheet, local images, and this README. The clean upload excludes assignment reports and the separate Bootstrap exercise.

| Member | Page contributions |
| --- | --- |
| Farabi | `index.html`, `about.html` |
| Arsen | `inventory.html`, `vehicle-detail.html` |
| Kuttibay | `financing.html`, `contact.html` |
| Muhammad | `services.html`, `compare.html`, `showroom.html` |

## Assignment 3 contribution map

Each teammate is credited on the Assignment 3 pages and has two dedicated exercise pages:

| Member | Pages |
| --- | --- |
| Arsen | `carousel.html`, `bootstrap-cards.html` |
| Kuttibay | `buttons.html`, `responsive-form.html` |
| Farabi | `index.html`, `team-grid.html` |
| Muhammad | `typography-cards.html`, `grid-spacing.html` |

The matching project report and self-contained ZIP are in `assignment3-bootstrap/`. The team is **Arsen, Kuttibay, Farabi, and Muhammad**.

## Assignment 4 JavaScript

The standalone [`assignment4-javascript/`](assignment4-javascript/) site demonstrates required-field and password validation, a smooth FAQ accordion, an accessible contact pop-up, a cycling page background, and a live date/time display. Its four scripts map to the four team members. The folder includes the PDF report, screenshot evidence, a defense guide, and the project ZIP for individual LMS submission.

## Assignment 5: Advanced JavaScript and DOM

The [`assignment5-dom/`](assignment5-dom/) showroom continues the same team, theme, and original vehicle and member photographs. It adds object-driven vehicle cards, category/search/price/saved filters, an image gallery, day/night themes, arrow-key menu navigation, a callback-based three-step booking preview, ratings, sound without overlapping playback, and event-triggered animations. The project uses local assets and runs directly from `index.html` without a build step.

- [Live showroom](https://vertex-blip.github.io/Car-dealership-website/assignment5-dom/)
- [PDF report](assignment5-dom/Assignment-5-Report.pdf)
- [Project ZIP](assignment5-dom/Assignment-5-Project.zip)
- [Complete requirements map](assignment5-dom/REQUIREMENTS.md)
- [Kazakh defense guide](assignment5-dom/DEFENSE-GUIDE.md)

The booking form is a local coursework demonstration. It validates sample details without creating a real appointment or account. Browser verification evidence is included with the assignment.
