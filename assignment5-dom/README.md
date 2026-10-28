# Apex Motors - Assignment 5

**Team:** Apex Motors

**Group:** SE-2507

**Members:** Arsen, Kuttibay, Farabi, Muhammad

This project continues the team's Assignment 3 website. It keeps the same eight pages, navigation, cream and copper colours, full-width vehicle hero, Bootstrap cards, and supplied photographs. Assignment 5 adds JavaScript interactions to those existing pages.

**Website:** https://vertex-blip.github.io/Car-dealership-website/assignment5-dom/

## Open the project

Extract the ZIP and open `index.html` in a browser. Bootstrap and all images, scripts, styles, and sound are included locally, so the project does not need an account, API key, installation, or internet connection.

The inquiry is a classroom preview. It checks sample values and displays a result on the page; it does not send an inquiry to a server. Use sample contact details.

## Pages and added interactions

| Page | Assignment 5 demonstration |
| --- | --- |
| `index.html` | Read More changes the visibility of extra content |
| `typography-cards.html` | Original responsive typography and CSS card layout |
| `grid-spacing.html` | Original Bootstrap grid and spacing examples |
| `carousel.html` | Original nine-image Bootstrap vehicle carousel |
| `bootstrap-cards.html` | Object-driven inventory cards, category filter, result updates |
| `buttons.html` | Current-time button, notification sound, background-colour button |
| `responsive-form.html` | Validated three-step inquiry with callbacks, Back, review, reset |
| `team-grid.html` | Original team and member photographs |
| All eight pages | Arrow-key navigation in the shared menu |

## Assignment choices

The brief offers alternatives. The project uses a direct JavaScript background-colour change for dynamic styling, Read More for the content-visibility option, and a multi-step form for the callback option. Category filtering uses a meaningful `switch` statement. Vehicle objects and their method, an array, an explicit loop, and higher-order functions drive the inventory.

Sound starts only after a user clicks its button. A single audio player is stopped and restarted to prevent overlapping playback. Animations respond to interactions and respect reduced-motion preferences.

## Files

- `styles.css`: the unchanged Assignment 3 stylesheet.
- `enhancements.css`: small additions for the new interactive states and reduced motion.
- `js/`: readable, separate JavaScript files for the shared interactions, inventory, and inquiry.
- `vendor/`: the local Bootstrap CSS and JavaScript bundle.
- `images/`: the vehicle and team photographs from Assignment 3.
- `assets/`: the notification sound.
- `screenshots/`: actual webpage and source-code evidence and recorded verification.
- `Assignment-5-Report.pdf`: objective, implementation steps, screenshots, verification, reflection, and website URL.
- `REQUIREMENTS.md`: requirement-to-feature map.
- `DEFENSE-GUIDE.md`: Kazakh explanation and demonstration sequence.

## Verification and deployment

The browser suite passed 139 checks in Chrome over HTTP, Edge over HTTP, and Chrome with a local file: **417/417 local checks**. A separate run of the published website passed **139/139 live checks**. There were no recorded runtime errors, missing-resource errors, external asset requests, or form POST requests. Results are included in `screenshots/test-results.json` and `test-results-live.json`.

Application commit `7539d5e` was pushed to the shared `main` branch. GitHub Pages workflow `40739785068` completed successfully, and the live site returned HTTP 200. `deployment.json` records the verified application deployment; the final submission commit also adds this report and archive.

## Submission and defense

Submit `Assignment-5-Report.pdf` and `Assignment-5-Project.zip` individually through the LMS. Every member must attend the defense and understand the whole project. The supplied LMS screenshot shows 29 October 2026, 14:00; check the LMS for the current deadline.

The defense is worth 40%. Run the interactions yourself, explain the relevant code, and practise one small change before the lesson.
