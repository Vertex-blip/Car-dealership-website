# Apex Motors Assignment 4

Team Apex Motors · Group SE-2507 · Arsen, Kuttibay, Farabi, Muhammad

This self-contained JavaScript exercise extends the team's earlier dealership projects. Open `index.html` directly in a current browser, or serve the repository and visit `/assignment4-javascript/`. No build step, package installation, account, or external CSS/JS service is required.

**Published project URL:** https://vertex-blip.github.io/Car-dealership-website/assignment4-javascript/

## Components and defense leads

| Lead | File | Feature | Main behavior to demonstrate |
| --- | --- | --- | --- |
| Kuttibay | `js/form-validation.js` | Account form validation | Required fields, email pattern, 8-character password, matching confirmation, inline errors |
| Farabi | `js/faq.js` | FAQ accordion | Default closed state, click to open/close, smooth CSS transition, `aria-expanded` |
| Arsen | `js/popup.js` | Contact pop-up | `<dialog>`, open button, close button, outside click, Escape, local validation |
| Muhammad | `js/experience.js` | Background and clock | Three-color cycle via `body.style.backgroundColor`; `Date`, readable formatting, 1-second refresh |

These are component assignments for the team's practice lesson. Each member should review, run, and be able to modify their component and explain how the other three work. See `DEFENSE-GUIDE.md` for a concise Kazakh walkthrough.

## Files

- `index.html` — all five tasks and four deferred JavaScript links; the footer names all four members.
- `styles.css` — dealership visual style, responsive layouts, form and dialog styling, FAQ transition.
- `js/` — four independent scripts aligned with the component leads above.
- `images/` — existing local Apex Motors brand and vehicle images.
- `screenshots/` — browser evidence for every task and mobile layout.
- `Assignment-4-Report.pdf` — task-by-task report with screenshots, process, team map, URL, and reflection.

## Verification

The forms are front-end demonstrations. They prevent browser submission and do not send or store personal data. The clock uses the viewer's device time zone. The project was exercised in Chrome and Edge at desktop size, and Chrome at a 390px mobile viewport. Checks covered invalid and valid form values, FAQ toggling, all three dialog dismissal methods, the color cycle, live clock updates, absence of page errors, and horizontal overflow.

All four team members must submit the report and ZIP archive individually through the LMS, and attend the practice-lesson defense.
