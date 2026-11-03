# Assignment 6 requirement map

Source: the supplied **Assignment 6 jQuery.pdf**. All numbered tasks 0-9 are required and implemented. Hints in the brief are examples of possible APIs, not restrictions on the solution.

Team: **Apex Motors** | Group: **SE-2507** | Members: **Arsen, Kuttibay, Farabi, Muhammad**.

| Requirement | Implementation | Demonstration |
| --- | --- | --- |
| Continue previous project and same team | Five Apex Motors pages, original 17 vehicles, team names and portraits | Navigate all five pages. |
| Task 0: jQuery CDN in head | Every page references `https://code.jquery.com/jquery-4.0.0.min.js`; local fallback supports offline use | Inspect the head and the console version. |
| Task 0: external ready handler | `script.js` uses `$(document).ready()` and prints `jQuery is ready!` | Open the browser console. |
| Task 1: real-time search/live filter | jQuery input handlers and filtering in `js/inventory.js` | Type Porsche; matching cards update without submitting or reloading. |
| Task 2: autocomplete | Accessible suggestion list with mouse and ArrowUp/ArrowDown/Enter/Escape handling | Type Mer, choose a suggestion and clear the search. |
| Task 3: search highlighting | `js/search.js` marks all matching text occurrences safely; catalog and FAQ use it | Search car in FAQ; clear to restore original text. |
| Task 4: colorful scroll progress | Shared gradient progress bar tracks document scroll and resize | Compare page top, middle and bottom. |
| Task 5: animated number counter | Home collection statistics count up when visible | Scroll to the statistics section; final totals match project facts. |
| Task 6: submit spinner | `js/booking.js` shows spinner and Please wait, disables submit, guards duplicate submits and restores normal state after a simulated delay | Submit a valid inquiry; reset while pending to test cancellation. |
| Task 7: temporary notification | Shared jQuery toast confirms saves and completed actions and fades out | Save a vehicle and wait for notification dismissal. |
| Task 8: clipboard button | Copy controls write actual snippet text, show a checkmark and Copied to clipboard tooltip only after success | Copy the completed inquiry preview and paste it. |
| Task 9: image lazy loading | Deferred images hold actual URLs in `data-src`; viewport checks assign `src` only when visible | Open Collection at the top, then scroll to its last vehicle. |
| Part 4: commit, push and redeploy | Published as a separate folder in the shared GitHub repository; application commit `f627cf31c678`, successful Pages workflow `41617306934` | `deployment.json` and `screenshots/test-results-live.json` record the release and 88/88 live checks. |
| PDF report | Objective, team, task steps, actual source and webpage screenshots, reflection, URL | `Assignment-6-Report.pdf`. |
| Complete project ZIP | HTML/CSS/JS, local assets, documentation and evidence | Extract and open `index.html`; no build needed. |

## Evaluation weights

| Criterion | Weight |
| --- | ---: |
| Search, suggestions and highlighting | 20% |
| Scroll progress, counters and spinner | 20% |
| Notifications, clipboard and lazy images | 10% |
| Defense | 40% |
| Report and deployment | 10% |

The implementation includes keyboard focus states, live feedback, reduced-motion support and resilient behavior if browser storage or the CDN is unavailable. These support the required tasks; they do not substitute for them. The inquiry remains an explicitly labeled browser-local simulation.
