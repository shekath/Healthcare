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

## Resident vs Traveler

Before sign-in, the user chooses **Saudi resident** or **Traveler / visitor**. The theme changes straight away:

| | Resident | Traveler |
|---|---|---|
| Theme | Saudi green (as designed, `#006C35`) | Desert terracotta (`#9A4419`), warm neutrals and a sand-coloured map |
| Sign-in | Phone, email, **Nafath**, Apple, Google | Phone with any country code, email, Apple, Google (no Nafath, since it is for citizens and residents only) |
| Insurance | Bupa, Tawuniya, MedGulf, GIG/AXA, Malath | Visit-visa insurance, international travel insurance |
| Extras | Full visit history | Visitor banner on the map, fees also shown in USD, tourist support line (930) in SOS, Makkah/Madinah/AlUla listed first, Umrah vaccine record |

You can switch later in **Account** (each profile keeps its own data). Every colour pairing meets WCAG AA.

## What works

**Entry and identity**
- **01** Splash, with a language switch.
- New profile-type step (Resident or Traveler).
- **02** Sign in, with validation:
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
  - The bottom sheet expands, and shows your next booking.
  - The SOS button opens emergency numbers (997, 911, 937, 999/930) and the nearest emergency department.
- Search across doctors, hospitals and specialties, in English or Arabic (Arabic search ignores diacritics and letter variants). Recent searches are kept, and there's a specialty grid.
- **06** Refine: specialty, distance, availability, languages, gender, visit type, and "accepts my insurance". The button shows a live "Show N doctors" count.
- **07** Doctor list, nearest first, with a summary of active filters.
- Facility page (not in the design): opening hours, accepted insurers, call, directions, and its doctors.
- **08** Doctor profile:
  - Favourite toggle, credentials, languages and fee.
  - Insurance coverage check, and directions (Google Maps).
  - Emergency doctors show walk-in, call-997 and directions buttons instead of a booking button.

**Book and keep**
- **09** Slot picker:
  - Uses the Saudi working week (Sun–Thu; some doctors also Sat).
  - Past slots and slots you've already booked are disabled; the next available slot is preselected.
  - Week paging, in-person or video visit, and an optional reason for the visit.
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
- Account: profile type, language, insurance, city/GPS, emergency numbers, privacy notice, sign out, reset demo data.

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
