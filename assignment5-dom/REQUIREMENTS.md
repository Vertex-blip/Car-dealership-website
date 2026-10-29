# Assignment 5 requirement map

**Source:** Frontend Assignment 5 JS and DOM Manipulation (2).pdf, six pages.

**Team:** Apex Motors | **Group:** SE-2507 | **Members:** Arsen, Kuttibay, Farabi, Muhammad.

The brief requires an interactive application continuing the team's project. The revised implementation has five HTML pages. A single HTML file is not required. Examples and OR alternatives are distinguished from mandatory categories below.

| Brief requirement | Implementation and demonstration |
| --- | --- |
| Continue the previous theme and same team | Apex Motors dealership content, original names and portraits. |
| Select unique elements and groups | DOM selectors in `site.js`, `inventory.js` and `booking.js` select individual controls and navigation/filter groups. |
| Change content dynamically | Generated vehicle cards/result counts in `inventory.js`; inquiry review and feedback in `booking.js`. |
| Direct dynamic styling OR day/night | Both: shared theme toggle and generated background hues. `theme-init.js` restores preferences and `site.js` changes them. |
| Choose one content/attribute option | Both Read More on `about.html` (`style.display`) and thumbnail-driven main-image `src` changes on `showroom.html`. |
| Button using `addEventListener` | Collection filters, appearance buttons, Read More and inquiry controls. |
| Keyboard events and arrow navigation | ArrowLeft/Right/Up/Down move navigation focus, wrap at either end, and include a short sound. Enter activates the focused link. |
| Callback: async contact form OR multistep | Chosen multistep inquiry: Next/Back calls the step-display callback and preserves input values. |
| Meaningful `switch` | Category matching in `inventory.js`; keyboard handling also selects behavior from key input. |
| Objects and methods | The 17 vehicle objects in `data.js` contain shared properties and display/price methods. |
| Arrays and explicit loops | The shared 17-car array drives cards and inquiry choices through explicit iteration. |
| Higher-order function | Filtering receives a predicate; rendering/event registration uses array callbacks. |
| Sound effects without overlap | Shared sound handling stops an active sound before another starts; navigation/sound controls are user actions. |
| Event-triggered animation | Filtering, controls, form steps and gallery image changes respond visually; reduced-motion preferences are considered. |
| Separate HTML, CSS and JS | Five HTML pages, external stylesheet/scripts and local resources. |
| Readable functions and variables | Separate data, common controls, inventory, inquiry and image-gallery responsibilities. |
| Relevant theme, intuitive UX and engagement | High-resolution vehicle photography, consistent navigation, saved collection, thumbnail gallery, feedback, labels and responsive layouts. |
| Commit, push and redeploy | Completed: application commit `dfcfdf9481af`, successful Pages workflow `40892341554`, and 113/113 live checks at the original URL. `deployment.json` and `screenshots/test-results-live.json` record the release. |
| PDF report | Objective; team/members/group; task steps; source-code and webpage screenshots; URL; reflection. |
| Project ZIP | Standalone HTML/CSS/JS, local assets, report and current evidence; verified against disk. |
| Individual submission and defense | Every member submits both files and explains the implementation in the practice lesson. |

## Allowed alternatives in the original brief

- Styling: direct JavaScript style changes **OR** day/night. This version includes both.
- Content/attribute: Read More **OR** thumbnail-driven image source changes **OR** personalized greeting **OR** star rating **OR** fetched content. This project demonstrates Read More and thumbnail-driven source changes.
- Button: at least one suitable click action. Time, reset and loading more content are examples, not three separate obligations.
- Callback: asynchronous POST contact form **OR** multistep form with Next/Back and retained inputs. The multistep option does not require a backend.
- Switch: category/price filtering, news categories, time-based greeting and language selection are examples. Category filtering fits the dealership.

Saved vehicles, separate pages and the photographic showroom extend the experience. They do not replace the core DOM, event, callback and data requirements.

All required media and application resources are included locally. Vehicle years and guide prices are illustrative.

## Evaluation

| Criterion | Weight |
| --- | ---: |
| DOM manipulation and styling | 10% |
| Event handling | 10% |
| Data structures and functions | 10% |
| Sound effects | 5% |
| Animations | 5% |
| Clean code and structure | 5% |
| UX and engagement | 5% |
| Defense during practice lesson | 40% |
| Report | 10% |

Current verification is in `screenshots/test-results.json`. Historical results for another source version are not evidence for this build. The report describes the checked implementation and identifies publication status accurately.
