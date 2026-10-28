# Apex Motors - Assignment 5

**Team:** Apex Motors

**Group:** SE-2507

**Members:** Arsen, Kuttibay, Farabi, Muhammad

A single-page dealership project built with HTML, CSS and JavaScript. It keeps the cream and copper colours, Georgia hero heading, square vehicle cards and original photographs from Assignment 3. All Assignment 5 interactions are on the main page.

**Website:** https://vertex-blip.github.io/Car-dealership-website/assignment5-dom/

## Open the project

Extract the ZIP and open `index.html`. All styles, scripts, photographs and sound are local. No installation, account, API key or internet connection is needed.

The inquiry is a classroom preview. It validates sample values and displays a result locally; it does not send contact details to a server. Use sample details.

## Where to find each feature

| Section | Try this |
| --- | --- |
| [Our approach](https://vertex-blip.github.io/Car-dealership-website/assignment5-dom/#about) | Read More reveals and hides the extra text |
| [Inventory](https://vertex-blip.github.io/Car-dealership-website/assignment5-dom/#inventory) | Filter the three original cards and watch the result count change; use Save to build a shortlist and Saved to filter it |
| [Inquiry](https://vertex-blip.github.io/Car-dealership-website/assignment5-dom/#inquiry) | Complete contact details, preferences and review; try Next, Back, errors and Reset |
| [Interactive tools](https://vertex-blip.github.io/Car-dealership-website/assignment5-dom/#interactive-tools) | Change the background, display the current time and play the notification sound |
| [Team](https://vertex-blip.github.io/Car-dealership-website/assignment5-dom/#team) | The same four members and supplied photographs |
| Main navigation | Focus a link with Tab, then move between links with the arrow keys |

## Assignment choices

The brief offers alternatives. This project uses a direct JavaScript background-colour change for dynamic styling, Read More for the content-visibility option, and a three-step form for the callback option. Category filtering uses `switch`. The vehicle collection demonstrates objects, an object method, an array, an explicit loop, and higher-order functions.

Sound starts only after a user clicks. One audio player is stopped and restarted to prevent overlapping playback. Animations respond to actions and respect reduced-motion preferences.

Favorites is an optional addition to the assignment requirements. Each card has a Save button, and the Saved control filters the collection together with the selected category. JavaScript updates the heart, button state, count and feedback. Only known vehicle IDs are stored in this browser's `localStorage`; reloading restores the shortlist when storage is available. If storage is blocked, the shortlist works for the open page and a message explains that it could not be kept for the next visit.

## Files

- `index.html`: all visible sections and the inquiry form.
- `styles.css`: the complete responsive design and interaction states.
- `js/site.js`: shared data, navigation, Read More, background, time, sound and animation.
- `js/inventory.js`: card rendering, category filtering, Save buttons, the Saved filter and browser storage.
- `js/booking.js`: inquiry validation, step callbacks, review and reset.
- `images/` and `assets/`: local photographs, logo and notification sound.
- `screenshots/`: actual browser/source evidence and recorded verification.
- `tools/`: verification, report generation and packaging utilities.
- `Assignment-5-Report.pdf`: objective, task steps, code/page screenshots, verification, reflection and URL.
- `REQUIREMENTS.md`: requirement-to-feature map.
- `DEFENSE-GUIDE.md`: Kazakh explanation and demonstration sequence.

## Verification and deployment

The updated project passed **297/297 local checks**: 99 each in Chrome over HTTP, Edge over HTTP, and Chrome with a local file. The published version passed **99/99 live checks**. No runtime or resource errors were recorded. The local aggregate is in `screenshots/test-results.json`, with individual browser results in `test-results-chrome.json`, `test-results-msedge.json` and `test-results-chrome-file.json`. Checks include Favorites persistence, filtering and unavailable storage, and a runtime-data test proving cards are created by JavaScript from the vehicle array and object method.

`deployment.json` identifies published application commit `7946521`, successful Pages workflow `40754113629` and its HTTP result. `test-results-live.json` contains the live checks. Favorites, stricter email validation and the completed inquiry progress state are included in this deployed application version. The final submission commit adds the report, archive and current evidence.

## Submission and defense

Submit `Assignment-5-Report.pdf` and `Assignment-5-Project.zip` individually through the LMS. Every member must attend the defense and understand the whole project. The supplied LMS screenshot shows 29 October 2026, 14:00; check the LMS for the current deadline.

The defense is worth 40%. Run all interactions yourself and practise one small code change before the lesson.
