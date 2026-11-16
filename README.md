# QRIB — Health, wherever you stand

A working, installable mobile prototype of **QRIB**, a Saudi healthcare app for residents and travelers: find the nearest hospital, choose the right doctor, book in one tap.

It is built from the 12-screen design in [`docs/QRIB-UI-Screens.html`](docs/QRIB-UI-Screens.html) (DGA Platforms Code tokens, IBM Plex Sans Arabic, RTL-first). Every screen works, using demo data saved in the browser.

## Run it

No build step and no dependencies. Serve the folder over HTTP (ES modules don't load from `file://`):

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

- **On a phone:** open the URL on the same Wi-Fi (`http://<your-computer-ip>:8080`). It runs full-screen, and *Add to Home Screen* installs it as an app (PWA, works offline after the first load).
- **On a desktop:** the app shows inside a phone frame, with a demo panel beside it for switching Resident/Traveler, English/Arabic, and resetting the data.

## Demo: patient or doctor

The demo opens on a **Choose a use case** screen. It is labelled *Demo only* and is not part of the patient app.

- **Patient app:** everything described below.
- **Doctor dashboard:** what a doctor sees, in a clinician-blue theme with its own bottom tabs:
  - **Schedule:** today's numbers (patients, repeat patients, next patient) and a strip of working days with a count of appointments on each. Each slot shows the patient's name, age and gender, the reason for the visit, and tags: *New* / *Repeat · n visits*, *Visitor*, *Video*, and *QRIB app* for bookings made in the patient app. Tap a patient to mark them seen (with a visit note that becomes the patient's visit summary), mark a no-show, call them, or cancel. Tap a free slot to block it or the whole day.
  - **Patients:** every patient from the last 30 days and the next 14, with search and *All / Repeat / New* filters, and a visit history for each.
  - **Availability:** a switch to pause or resume all new bookings; quick blocks (rest of today, tomorrow, next week); and custom blocks for full days, a date range, or a time range across days, with an optional reason.
  - **Profile:** choose which doctor to act as, change the language, and switch use case.

Both sides share the same data on the device. A patient booking appears on that doctor's schedule under the patient's name. When the doctor blocks time or pauses bookings, those slots disappear from the patient's slot picker. When the doctor marks a visit as seen, the patient's pending report becomes a visit summary with the doctor's note. When the doctor cancels, the patient sees a notice in Saved.

You can switch use case from **Account** (patient), **Profile** (doctor), or the desktop demo panel.

## Resident vs Traveler

The app opens on a green splash screen, then the sign-in screen. On sign-in, an **“I’m a traveler / visitor”** switch at the top turns on Traveler mode, and the theme changes straight away:

| | Resident | Traveler |
|---|---|---|
| Theme | Saudi green (as designed, `#006C35`) | Desert terracotta (`#9A4419`), warm neutrals and a sand-coloured map |
| Sign-in | Phone, email, **Nafath**, Apple, Google | Phone with any country code, email, Apple, Google (no Nafath, since it is for citizens and residents only) |
| Insurance | Bupa, Tawuniya, MedGulf, GIG/AXA, Malath | Visit-visa insurance, international travel insurance |
| Extras | Full visit history | Visitor banner on the map, fees also shown in USD, tourist support line (930) in SOS, Makkah/Madinah/AlUla listed first, Umrah vaccine record |

You can switch later in **Account** (each profile keeps its own data). Every colour pairing meets WCAG AA.

## What works

**Entry and identity**
- **01** Splash: an illustrated healthcare graphic (map pin with a medical cross, heartbeat line, care icons) under a Saudi-green gradient overlay, with a language switch.
- **02** Sign in, with a brand header and the traveler switch. It has validation:
  - Saudi numbers must be `5XXXXXXXX`; international numbers 6–14 digits; email checked too.
  - SSO options are simulated, and Nafath shows a number-matching step.
- **03** OTP:
  - A 4-digit code is "sent" and shown in a toast and on screen.
  - Wrong codes shake and show an error; pasting and iOS one-time-code autofill work.
  - 5-minute expiry and 30-second resend timers.
- **04** Location:
  - Uses real GPS. If you're outside the Kingdom it falls back to Riyadh (residents) or Makkah (travelers).
  - You can pick one of 6 cities instead.

**Discover**
- **05** Map home:
  - Pins are placed from real coordinates around you. Drag to pan; zoom with the buttons or the mouse wheel; re-centre.
  - Filter chips: open now, emergency, and 6 specialties.
  - Tapping a pin highlights its card; tapping again opens the facility.
  - Every Nearby care card has its own directions button.
  - The bottom sheet expands. When you have a booking, a **Next visit** card leads it: a brand-coloured gradient with a sweeping shine, a light that follows your finger, a pulsing live dot and a live countdown ("in 3 h 47 min"). Tapping it opens Saved.
  - The SOS button opens emergency numbers (997, 911, 937, 999/930) and the nearest emergency department.
- Search across doctors, hospitals and specialties, in English or Arabic (Arabic search ignores diacritics and letter variants). Recent searches are kept, and there's a specialty grid.
- **06** Refine: specialty, distance, availability, languages, gender, visit type, and "accepts my insurance". The button shows a live "Show N doctors" count.
- **07** Doctor list, nearest first, with a summary of active filters. Filter is a floating button at the bottom, above the tab bar (also on Search).
- Facility page (not in the design): a map with the address pin, a bottom bar with Call and Get directions, opening hours, accepted insurers, call, directions, and its doctors.
- **08** Doctor profile:
  - Favourite toggle, credentials, languages and fee.
  - A map of the doctor's clinic with its address pin and your position.
  - A bottom action bar in thumb reach: Directions, Call, and a large primary **Book appointment** button.
  - Insurance coverage check.
  - Emergency doctors show walk-in, call-997 and directions buttons instead of a booking button.

**Book and keep**
- **09** Slot picker:
  - Uses the Saudi working week (Sun–Thu; some doctors also Sat).
  - Past slots and slots you've already booked are disabled; the next available slot is preselected.
  - Week paging, in-person or video visit, and an optional reason for the visit.
  - Shows who the visit is for. If no name is saved, the app asks for one before booking.
- **10** Confirmation:
  - Shows a `QRB-#####` reference.
  - Directions, and an `.ics` calendar file with a 1-hour reminder.
  - The doctor is added to Consulted.
- **11** Saved:
  - Upcoming bookings, with directions, calendar and cancel (asks to confirm).
  - Consulted doctors with *Book again*, and Favourites.
- **12** Reports:
  - Filter by visits, lab, imaging or vaccines.
  - A detail view for each record (lab table with high values flagged).
  - Share, download, or export all records as HTML.
  - Each new booking adds a pending visit summary.
- Account (fifth bottom tab): the patient's full name, gender and date of birth (editable; doctors see the name, age and phone), profile type, language, insurance, city/GPS, emergency numbers, privacy notice, sign out, reset demo data.

**Throughout:** full English/Arabic with RTL layout and Arabic-Indic digits (as in the design); data persists across reloads; the Android back button works; layout respects iPhone notch/safe areas; reduced-motion is respected.

## Project layout

```
index.html              app shell (phone frame on desktop, full screen on mobile)
css/app.css             design tokens + components (+ traveler theme overrides)
js/app.js               bootstrap, global actions, desktop demo panel
js/ui.js                stack router, delegated events, sheets/dialogs/toasts, shared components
js/shell.js             theme + language/direction switching
js/store.js             state + localStorage persistence (per-profile data)
js/i18n.js              English / Arabic strings
js/data.js              cities, facilities, doctors, specialties, seed reports
js/logic.js             distance, opening hours, slot generation, filtering, formatting, .ics
js/screens/*.js         auth, discover, booking, saved, reports, account
sw.js, manifest.webmanifest, icons/   PWA
tests/e2e.mjs           Playwright end-to-end test of the full flow
```

## Deploy

Pushing to `main` runs `.github/workflows/pages.yml`. It runs the end-to-end test, then publishes the folder to GitHub Pages. No build step is needed. All paths are relative, so the app works from the repository's Pages sub-path (`https://<owner>.github.io/<repo>/`), and it installs as a PWA from there.

GitHub Pages must be enabled once: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Test

With the server running:

```bash
node tests/e2e.mjs http://localhost:8080/ [screenshotDir]
```

This runs 40+ checks with Playwright on an emulated iPhone 13:
- the traveler and resident flows, through sign-in, OTP and location;
- the map, search, filters, booking and cancelling, and reports;
- Arabic/RTL and persistence.

It fails on any console error or missing translation.

## Demo data and production notes

- Facility names follow the design. Coordinates are approximate, and all doctors are fictional.
- Before going live, replace `js/data.js` with the MOH / SCFHS directory and booking APIs, real OTP (SMS) and Nafath integrations, and a PDPL-compliant backend hosted in the Kingdom.
- Nothing leaves the browser in this prototype.
