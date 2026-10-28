# Assignment 5 requirements

Team Apex Motors | SE-2507 | Arsen, Kuttibay, Farabi, Muhammad

The site uses one `index.html`, a custom stylesheet and three JavaScript files. Its visual design continues the team's Assignment 3 theme. All required interactions are directly available on this page.

| Requirement | Implementation and location |
| --- | --- |
| Continue the same team and project theme | Apex Motors colours, hero, cards, vehicle photographs and four team portraits |
| Select individual and grouped DOM elements | External scripts use element selectors and grouped navigation/category buttons |
| Update content dynamically | `#inventory` cards/count, `#interactive-tools` time/status, `#inquiry` review and confirmation |
| Modify styles directly OR use a day/night switch | Background button in `#interactive-tools` changes `document.body.style.backgroundColor` |
| Choose one content/attribute option | Read More in `#about` (Our approach) changes extra content's `style.display` |
| Button event listeners | Read More, category, time, sound, background and inquiry controls use `addEventListener` |
| Keyboard events and arrow-key menu navigation | The five anchor links support arrow-key focus movement with wraparound |
| Callback interaction: asynchronous OR multi-step form | `#inquiry` uses a three-step callback flow; Back retains the input values |
| Meaningful `switch` statement | `#inventory` category matching: all, touring, performance, adventure |
| Objects and methods | Vehicle objects hold card information and a method returns the displayed category/year label |
| Arrays and explicit loops | Three vehicles are stored in an array; `for...of` creates cards |
| Higher-order functions | `filter` receives a category predicate; `forEach` handles collections and listeners |
| User-triggered sound without overlap | `#interactive-tools` uses one audio player, paused and rewound before playback |
| Event-triggered animation | Inventory, content and form changes animate; reduced-motion preferences are respected |
| Separate HTML, CSS and JS | One HTML file, one custom stylesheet and three external deferred scripts |
| Readable, reusable functions and variables | Data, card rendering, category matching, validation, navigation, feedback and sound logic are separated |
| Relevant theme and intuitive UX | Dealership collection, inquiry, visible controls, labels, feedback, keyboard focus and responsive navigation |
| Commit, push and deploy | Application commit `4646afc`, successful GitHub Pages workflow `40744013953`, HTTP 200 and 77/77 live checks; recorded in the report |
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
