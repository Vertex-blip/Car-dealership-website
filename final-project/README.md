# Apex Motors — Final Project

A responsive car dealership website for visitors who want to explore a vehicle collection, compare driving styles, save favourites and prepare a vehicle inquiry. This continues the team's existing Apex Motors topic.

Team: Arsen, Kuttibay, Farabi and Muhammad. Group: SE-2507.

[Live website](https://vertex-blip.github.io/Car-dealership-website/final-project/) · [Repository source](https://github.com/Vertex-blip/Car-dealership-website/tree/main/final-project)

## Work division

| Member | Responsibility |
| --- | --- |
| Muhammad | Visual design, responsive layouts, light/dark styles. |
| Arsen | Account, log-in, profile and inquiry validation. |
| Farabi | Vehicle data, search/filter and public API integration. |
| Kuttibay | Content, photography organisation, usability testing and submission preparation. |

## Run locally

Open a terminal in this folder and run:

```sh
python -m http.server 4173
```

Then open <http://localhost:4173/>. VS Code Live Server is another option. Use the same address and port while testing so browser storage stays in the same origin. Internet access is needed for live API data.

If Python is managed with uv, run `uv run python -m http.server 4173` instead.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home, featured cars and collection overview. |
| `inventory.html` | Collection search, category filters, sorting and saved cars. |
| `showroom.html` | Vehicle photography and gallery controls. |
| `about.html` | Project story, team, FAQ search and rating. |
| `inquiry.html` | Validated inquiry steps, review, local save and confirmation. |
| `account.html` | Local sign-up and log-in simulation. |
| `profile.html` | Editable user details, saved cars, inquiry history and log-out. |
| `research.html` | Vehicle research using the public NHTSA vPIC API. |

## Main features

- Responsive layouts, keyboard-accessible controls and shared navigation.
- Light/dark preferences and saved vehicles persisted in `localStorage`.
- JavaScript form validation with visible field errors and `novalidate` forms.
- Simulated sign-up, credential checking and a profile page.
- Dynamic inventory and FAQ search, vehicle gallery, animations and feedback.
- Live vehicle reference data from the [official NHTSA vPIC API](https://vpic.nhtsa.dot.gov/api/), with loading and error feedback.

This is a frontend student project. Account information is stored in the browser for the assignment simulation; passwords are stored as salted PBKDF2 hashes. This is not production authentication. Use invented demo details and a password you do not use elsewhere. Inquiry submission saves browser-local inquiry history and does not contact a real dealership. Vehicle years and guide prices are illustrative project values.

## Structure

```text
final-project/
  *.html       Eight connected pages
  css/         Shared styles
  js/          Shared controls and page functionality
  images/      Vehicle and team photographs
  assets/      Supporting media and source records
  vendor/      Locally loaded library and licence
  docs/        Presentation plan and submission checklist
```

## Before submission

The final version is hosted at the live website linked above. The repository and live website addresses are recorded in `ApexMotors_SE2507_Links.txt` in the submission set. Each team member submits the ZIP, PDF report and TXT links file individually in Moodle's FINAL EXAM folder.

Use `docs/submission-checklist.md` for the three required submission files and `docs/presentation-plan.md` for the proposed 4:45 team demonstration. Backup images are in `docs/screenshots/`. Recorded local and hosted Chromium checks are in `docs/verification-summary.json`; rehearsal and Moodle submission remain team actions.
