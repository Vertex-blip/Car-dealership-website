# Assignment 5 requirements

Team Apex Motors | SE-2507 | Arsen, Kuttibay, Farabi, Muhammad

The site uses one `index.html`, a custom stylesheet and three JavaScript files. Its visual design continues the team's Assignment 3 theme. All required interactions are directly available on this page.

| Requirement | Implementation and location |
| --- | --- |
| Continue the same team and project theme | Apex Motors colours, hero, cards, vehicle photographs and four team portraits |
| Select individual and grouped DOM elements | `site.js`: `getElementById('assignmentNav')` and `navigation.querySelectorAll('.nav-link')`; `inventory.js` selects `[data-category]` buttons |
| Update content dynamically | `inventory.js`: `grid.replaceChildren(fragment)` and `count.textContent`; `booking.js`: summary elements use `textContent` |
| Modify styles directly OR use a day/night switch | Chosen direct-style option: `site.js` assigns `document.body.style.backgroundColor = color.value` in the background button callback |
| Choose one content/attribute option | Chosen Read More option: `site.js` assigns `readMoreContent.style.display = expanded ? 'block' : 'none'` and updates `aria-expanded` |
| Button event listeners | `site.js`: time/background/sound buttons use `addEventListener('click', ...)`; the time callback calls `new Date().toLocaleTimeString('en-GB')` |
| Keyboard events and arrow-key menu navigation | `site.js`: the navigation's `keydown` listener handles arrow keys in a `switch`, calculates a wrapped index and calls `links[next].focus()` |
| Callback interaction: asynchronous OR multi-step form | Chosen multi-step option: `booking.js` passes `showStep` to `navigateStep(1, showStep)`; `onStepChange(nextStep)` displays the step while existing inputs retain values |
| Meaningful `switch` statement | `inventory.js`: `matchesCategory(vehicle)` switches on the selected category and returns its vehicle-matching condition |
| Objects and methods | `site.js`: `createVehicle` returns objects with properties and `label()`; `inventory.js` displays `vehicle.label()` |
| Arrays and explicit loops | `site.js`: `vehicles` array; `inventory.js`: `for (const vehicle of selectedVehicles)` appends dynamically created cards |
| Higher-order functions | `inventory.js`: `vehicles.filter(matchesCategory)` receives a predicate function; `categoryButtons.forEach(...)` registers listeners |
| User-triggered sound without overlap | `site.js`: one `new Audio('assets/chime.wav')`; `playChime()` calls `pause()`, sets `currentTime = 0`, then awaits `play()` |
| Event-triggered animation | `site.js`: `Apex.animate` calls `element.animate(...)`; Read More, filtering and form steps trigger it; `prefers-reduced-motion` is checked |
| Separate HTML, CSS and JS | One HTML file, one custom stylesheet and three external deferred scripts |
| Readable, reusable functions and variables | Data, card rendering, category matching, validation, navigation, feedback and sound logic are separated |
| Relevant theme and intuitive UX | Dealership collection, inquiry, visible controls, labels, feedback, keyboard focus and responsive navigation |
| Optional Favorites addition | `inventory.js`: Save button delegation updates `savedIds`, button state and count; `readSavedIds`/`storeSavedIds` use JSON and `localStorage`; Saved filters the current category with empty-state and storage-failure feedback |
| Commit, push and deploy | `deployment.json` records the published application commit, Pages workflow and HTTP result; `test-results-live.json` applies to that recorded published version |
| PDF report | Objective, team/group, step-by-step tasks, actual code and resulting-page screenshots, reflection and URL |
| ZIP archive | Standalone project with HTML, CSS, JS, local assets, report and evidence |
| Individual submission and defense | Each student submits PDF/ZIP and explains the implementation during the practice lesson |

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
| Practice-lesson defense | 40% |
| Report | 10% |

The technical project and report demonstrate the implementation criteria. Each student's defense depends on their own explanation and response to the instructor's task.

The brief's OR groups require one chosen option per group. This implementation chooses direct style changes, Read More and a multi-step form. Favorites is extra functionality. For current verification totals and the checked target, read `screenshots/test-results.json` and the individual result records rather than treating earlier totals as results for a newer version.
