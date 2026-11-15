# Apex Motors presentation plan

Target duration: **4:45**. Required window: 4:30–5:00; maximum: 5:00. The guideline deducts **2 points for every extra 30 seconds** and discourages finishing before 4:00.

## Work division and proposed speaking assignments

The team is Arsen, Kuttibay, Farabi and Muhammad, group SE-2507. The following implementation responsibilities are the approved work division for the final project. Speaking assignments are a suggested rehearsal plan.

| Member | Approved work division | Proposed presentation responsibility |
| --- | --- | --- |
| Muhammad | Visual design, responsive layouts, light/dark styles. | Demonstrate design, theme persistence and device layouts. |
| Arsen | Account, log-in, profile and inquiry validation. | Demonstrate authentication, inline errors, profile and inquiry. |
| Farabi | Vehicle data, search/filter and public API integration. | Demonstrate Collection, Showroom and the NHTSA model finder. |
| Kuttibay | Content, photography organisation, usability testing and submission preparation. | Introduce the team, topic and audience; conclude. |

Use the same approved work division in the PDF report. The character roles displayed on the About page are separate from this development work.

## Timed demonstration

| Time | Speaker | Show and explain |
| --- | --- | --- |
| 0:00–0:30 | Kuttibay | Introduce all four members and SE-2507. Explain that Apex Motors helps car enthusiasts explore an illustrative dealership collection and prepare inquiries. |
| 0:30–1:10 | Muhammad | On Home, describe the colour palette, typography and spacing. Toggle light/dark mode and navigate to show persistence. Use prepared desktop, tablet and mobile presets to show how navigation and cards adapt. Show a hover or button transition. |
| 1:10–1:50 | Farabi | Search Collection for a car, change a category, sort and save one vehicle. Open the Showroom and change the main image using thumbnails and controls. |
| 1:50–2:55 | Arsen | Open Account. Submit incomplete or invalid details to reveal friendly inline errors. Create the demo account below, show the profile, log out and log in again. Explain that this is a browser-storage simulation. |
| 2:55–3:30 | Arsen | Open Inquiry. Demonstrate an invalid email or phone, correct it, move through the steps and show the review. Submit to display the local confirmation and copy feedback. State that no real inquiry is sent. |
| 3:30–4:20 | Farabi | Open Model finder, select Porsche and 2024, then request live NHTSA vPIC reference data. Filter the returned models and follow a model's Collection search link. Point out the loading state and explain the error, saved-result and retry paths. Keep an offline screenshot ready. |
| 4:20–4:45 | Kuttibay | Summarise the eight connected pages, responsive design and useful JavaScript features. Suggest a future backend with real accounts, verified stock and secure inquiry delivery. Thank the audience. |

## Demo account and actions

Create this invented account during rehearsal and use the same browser origin during the live demonstration:

```text
Name: Apex Demo
Email: apex.demo@example.com
Phone: +77011234567
Password: ApexDemo2026!
```

1. Start from Home. Choose the opposite theme and move to Collection to demonstrate persistence.
2. Search `Mercedes`, apply a category or sorting option, save a result, then use the saved-cars view. Clear filters when finished.
3. On Account, first show a missing field, invalid email or weak password error. Correct the data and complete sign-up. If this email already exists, use the existing account for log-in or prepare a fresh invented email before the presentation.
4. Show the account details on Profile, log out, then log in with the credentials above. Do not display a real password.
5. On Inquiry, trigger an email or phone validation error, correct it and proceed to Review. Complete the local simulation and show the confirmation.
6. On Model finder, choose `Porsche` and `2024`, press `Explore models`, and filter the results by a model name. The verified local browser run returned eight Porsche models for 2024; live catalogue contents can change.

## Rehearsal and backup

- Open the final hosted site before speaking and confirm its pages, images and API request load.
- Keep desktop, tablet and mobile viewport presets ready; avoid spending the presentation adjusting developer tools.
- Rehearse all four handovers and use a visible timer. Aim for 4:45 to retain a 15-second margin.
- Capture backup screenshots or a short video of responsiveness, both themes, search, validation, profile and a successful API response. Label any backup as a recorded demonstration if used.
- Keep a local server ready for a hosting or connectivity problem. The live API still needs internet; use the recorded API evidence when offline.
- Present the finished website. Do not edit code live.

Preparation sources: the provided Final Project Presentation Guidelines, the earlier `endterm/Endterm-Report.pdf`, the approved final-project work division and the final local browser verification. Speaking roles remain a rehearsal suggestion; this document does not claim that deployment or rehearsals have already been completed.
