# Assignment 5 requirements

Team Apex Motors | SE-2507 | Arsen, Kuttibay, Farabi, Muhammad

The target is Assignment 5. The website continues the same eight-page Assignment 3 project and its existing appearance.

| Requirement | Where it is implemented |
| --- | --- |
| Continue the previous project with the same team and theme | Eight original pages, shared Bootstrap navbar/footer, original colours, layout and photographs |
| Select individual and grouped DOM elements | External scripts use `querySelector`, `querySelectorAll`, and element references |
| Change content dynamically | Filtered inventory, result count, current-time output, inquiry summary and confirmation |
| Modify styles directly OR day/night switch | Background button on `buttons.html` changes `document.body.style.backgroundColor` |
| Choose one content/attribute option | Read More on `index.html` changes the extra content's `style.display` |
| Button listeners | Read More, category, time, sound, background and form buttons use `addEventListener` |
| Keyboard events and arrow-key menu navigation | Shared navbar links move focus using arrows, with wraparound |
| Callback interaction: asynchronous form OR multi-step form | Three-step inquiry passes the step-display function as a callback and retains values on Back |
| Meaningful `switch` statement | Inventory category filtering: all, touring, performance, adventure |
| Objects and methods | Vehicle objects hold the displayed data and an object method returns a label |
| Arrays and explicit loops | Vehicle collection is an array; an explicit `for...of` loop creates cards |
| Higher-order functions | `filter` selects matching vehicles; callbacks and `forEach` process collections |
| User-triggered sound with no overlapping clips | Buttons page uses one reusable audio player, paused and rewound before playback |
| Event-triggered animation | Inventory and content/form state changes use transitions or transforms; reduced-motion preference is respected |
| HTML, CSS and JS separated | Original `styles.css`, separate `enhancements.css`, and external scripts; no inline event handlers or custom inline script blocks |
| Readable, reusable code | Named functions separate rendering, category selection, validation, step changes and sound |
| Theme integration and positive UX | Existing dealership site, working navigation, responsive cards, labels, feedback and keyboard focus |
| Commit, push and deploy | Application commit `7539d5e`, successful GitHub Pages workflow `40739785068`, HTTP 200 and 139/139 live checks; recorded in the report |
| PDF report | Team/group, objective, step-by-step tasks, actual code and resulting page screenshots, reflection and website URL |
| ZIP archive | Standalone project with local Bootstrap, images, sound, styles, scripts, report and evidence |
| Individual submission and defense | Each member submits PDF/ZIP and explains the work during the practice lesson |

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
