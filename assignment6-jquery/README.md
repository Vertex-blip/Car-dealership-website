# Apex Motors - Assignment 6: jQuery

**Team:** Apex Motors  
**Group:** SE-2507  
**Members:** Arsen, Kuttibay, Farabi, Muhammad

This continues the same photographic dealership from Assignment 5. Its five pages, 17-car collection, photographic showroom, saved cars, appearance controls and multistep inquiry remain available. The new features implement every numbered task in the Assignment 6 brief.

## Open and demonstrate

Extract the project ZIP and open `index.html`. No build or account is needed. The HTML loads jQuery 4.0.0 from the required CDN, with a bundled local fallback for offline use. All photographs, styles and application scripts are included. A static HTTP server is recommended for development and clipboard verification.

| Page | Assignment 6 demonstration |
| --- | --- |
| Home | Scroll progress and animated collection statistics; images load as they become visible. |
| Collection | Type a vehicle name to filter immediately, choose an autocomplete suggestion with mouse or keyboard, see highlighted matches, and save a car to receive a fading notification. |
| About | Search the FAQ to highlight every matching occurrence in its questions and answers. |
| Inquire | Try invalid details, then complete the three steps. Submit shows a spinner and disables repeated submissions before the local preview appears. Copy the preview to the clipboard. |
| Showroom | Explore the original photographic gallery with thumbnails, buttons and arrow keys. |

The inquiry is a classroom simulation: it sends no contact data, books no appointment and processes no payment. Its short delay demonstrates submission feedback. Use sample details during the defense. Vehicle prices and years are illustrative.

## Files

- `index.html`, `inventory.html`, `showroom.html`, `about.html`, `inquiry.html`: separate semantic pages.
- `styles.css`, `search.css`, `enhancements.css`: responsive appearance and new interaction states.
- `script.js`: jQuery ready setup and shared Assignment 6 interactions.
- `js/inventory.js`, `js/search.js`, `js/booking.js`: live collection search, safe highlighting and form behavior.
- `js/data.js`, `js/site.js`, `js/gallery.js`, `js/theme-init.js`: shared vehicle data and continuing site features.
- `vendor/`: bundled jQuery fallback and its license header.
- `images/`, `assets/`: local photographs, placeholder image, icons and sound.
- `screenshots/`: actual browser screenshots, source-code screenshots and verification records.
- `tools/verify.cjs`: browser verification using Playwright and installed Chrome.
- `tools/build_report.py`: creates the PDF from the current code and captured evidence.
- `REQUIREMENTS.md`: task-to-implementation map.
- `DEFENSE-GUIDE.md`: concise Kazakh demonstration and explanation guide.

## Verification

Run `node tools/verify.cjs http://127.0.0.1:PORT/assignment6-jquery/index.html`. The script checks user interactions, mobile layout, keyboard autocomplete, validation, duplicate-submit protection, clipboard, lazy loading and a blocked-CDN fallback. It records the tested address, timestamp and results in `screenshots/test-results.json`. For direct-file or live checks, set `RESULT_NAME` to a distinct filename to retain the other run's evidence.

Verification passed **122/122 local HTTP checks, 121/121 direct-file checks and 122/122 live website checks**, with zero authored JavaScript or resource errors. The direct-file run omits the secure-context clipboard readback assertion; copying feedback is still checked. The suite also exercises a blocked CDN, blocked storage, reduced-motion settings and FAQ text layout at four viewport widths in both themes. A focused FAQ regression passed **35/35 checks**; its record is `screenshots/test-results-faq-layout.json`.

Publication is confirmed by `deployment.json` and `screenshots/test-results-live.json`. Application commit: [`5addaea8368b`](https://github.com/Vertex-blip/Car-dealership-website/commit/5addaea8368b13645226a0e0673750d572ded38e). The [GitHub Pages workflow completed successfully](https://github.com/Vertex-blip/Car-dealership-website/actions/runs/41618450037), and the new Assignment 6 address was verified in Chrome.

**Assignment 6 address:** https://vertex-blip.github.io/Car-dealership-website/assignment6-jquery/

## Submission

Each member must submit the PDF report and complete project ZIP through the LMS and defend the work in the practice lesson. The screenshot provided with the task lists **5 November 2026, 14:00** as the deadline; use the LMS deadline if it changes. The defense contributes 40% of the grade, so every member should be able to explain and modify each feature.
