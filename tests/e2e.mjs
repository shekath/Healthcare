// End-to-end smoke test for the QRIB prototype.
// Usage: serve the repo root (e.g. `python3 -m http.server 8080`) then
//   node tests/e2e.mjs [baseUrl] [screenshotDir]
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const BASE = process.argv[2] || 'http://localhost:8080/';
const SHOTS = process.argv[3] || null;
const problems = [];
let step = 0;

function check(cond, msg) {
  if (!cond) { problems.push(msg); console.log('  ✗', msg); } else console.log('  ✓', msg);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'], geolocation: { latitude: 51.5, longitude: -0.12 }, permissions: ['geolocation'] });
const page = await ctx.newPage();
page.on('console', m => {
  if (m.type() === 'error' || m.text().includes('[i18n] missing') || m.text().includes('Unhandled action')) problems.push('console: ' + m.text());
});
page.on('pageerror', e => problems.push('pageerror: ' + e.message));

const shot = async name => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${String(++step).padStart(2, '0')}-${name}.png` }); };
const screen = () => page.evaluate(() => window.QRIB.currentName());
const tap = async sel => { await page.locator(sel).first().click(); await page.waitForTimeout(350); };
const theme = () => page.evaluate(() => document.documentElement.dataset.theme);

await page.goto(BASE);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(500);

console.log('Entry & identity (traveler)');
check(await screen() === 'splash', 'app opens on splash');
check(await page.locator('.splash-svg').count() === 1, 'splash shows healthcare graphic');
await shot('splash');
await tap('text=Get started');
check(await screen() === 'signin', 'Get started → sign in');
check(await theme() === 'resident', 'resident theme by default');
check(await page.locator('[data-v="nafath"]').count() === 1, 'Nafath offered to residents');
await shot('signin-resident');
await tap('#trvToggle');
check(await theme() === 'traveler', 'traveler switch changes theme instantly');
check(await page.locator('#trvToggle[aria-checked="true"]').count() === 1, 'switch shows on');
check(await page.locator('[data-v="nafath"]').count() === 0, 'Nafath hidden for travelers');
await page.selectOption('#cc', '+44');
await page.fill('#phone', '12');
await tap('[data-act="send"]');
check(await page.locator('.helper.err').count() === 1, 'invalid phone shows error');
await page.fill('#phone', '7700900123');
await shot('signin');
await tap('[data-act="send"]');
check(await screen() === 'otp', 'OTP screen');
const code = (await page.locator('#otpNote b').innerText()).trim();
await page.locator('#otp').fill('0000' === code ? '1111' : '0000');
await page.waitForTimeout(500);
check(await page.locator('.otp.err').count() === 1, 'wrong OTP rejected');
await shot('otp-error');
await page.locator('#otp').fill(code);
await page.waitForTimeout(700);
check(await screen() === 'location', 'verified → location permission');
await shot('location');
await tap('[data-act="allow"]');
await page.waitForTimeout(800);
check(await screen() === 'map', 'GPS outside KSA falls back to a city and opens map');
const city = await page.evaluate(() => window.QRIB.state.loc.city);
check(city === 'makkah', 'traveler fallback city is Makkah (got ' + city + ')');
check(await page.locator('#sheet .card').count() > 0, 'nearby facilities listed');
check(await page.locator('#sheet .fcard .dir-btn').count() === await page.locator('#sheet .fcard').count(), 'every nearby card has a directions button');
await page.evaluate(() => { window.__opened = []; HTMLAnchorElement.prototype.click = function () { window.__opened.push(this.href); }; });
await tap('#sheet .fcard .dir-btn');
check(await screen() === 'map', 'directions button does not open the card');
check((await page.evaluate(() => window.__opened[0] || '')).includes('google.com/maps/dir'), 'directions button opens Google Maps');
check(await page.locator('.map-banner').count() === 1, 'visitor banner on map');
await shot('map-traveler');

console.log('Emergency');
await tap('[data-act="sos"]');
check(await page.locator('.overlay .call-num').count() >= 4, 'emergency numbers sheet');
await shot('sos');
await tap('.overlay [data-act="closeOverlay"]');

console.log('Account: switch to resident, change city');
await tap('.map-search .me');
check(await screen() === 'account', 'account screen');
await tap('[data-act="setMode"][data-v="resident"]');
check(await theme() === 'resident', 'switched back to resident theme');
await tap('[data-act="changeCity"]');
await tap('.overlay [data-v="riyadh"]');
await page.waitForTimeout(300);
check(await page.evaluate(() => window.QRIB.state.loc.city) === 'riyadh', 'city changed to Riyadh');
await tap('[data-act="back"]');
check(await screen() === 'map', 'back to map');
await shot('map-resident');
await tap('[data-act="chip"][data-v="er"]');
check(await page.locator('#sheet .card').count() > 0, 'emergency filter lists ERs');
await tap('#pins .pin[data-fid="kfsh"]');
check(await page.locator('#sheet .card.sel').count() === 1, 'pin tap highlights its card');
await tap('#pins .pin[data-fid="kfsh"]');
check(await screen() === 'facility', 'pin tap twice opens facility');
await shot('facility');
await tap('[data-act="back"]');

console.log('Search → filter → doctor list → profile');
await tap('[data-act="tab"][data-tab="search"]');
check(await screen() === 'search', 'search tab');
await page.fill('#q', 'cardio');
await page.waitForTimeout(300);
check(await page.locator('#results .card').count() >= 3, 'search results for cardio');
await shot('search');
await tap('#results [data-act="openSpec"][data-v="cardio"]');
check(await screen() === 'doctors', 'cardiology doctor list');
const n1 = await page.locator('.scroll .card').count();
await tap('[data-go="filter"]');
check(await screen() === 'filter', 'refine screen');
await tap('[data-act="fGender"][data-v="f"]');
const label = await page.locator('[data-act="fApply"]').innerText();
check(/Show \d+ doctor/.test(label), 'live count on apply button: ' + label);
await shot('filter');
await tap('[data-act="fApply"]');
const n2 = await page.locator('.scroll .card').count();
check(await screen() === 'doctors' && n2 < n1 && n2 > 0, `filter narrowed list ${n1} → ${n2}`);
await shot('doctors');
await tap('.scroll .card');
check(await screen() === 'doctor', 'doctor profile');
check(await page.locator('.minimap .pin').count() === 1, 'doctor profile map shows the address pin');
check(await page.locator('.map-card [data-act="dir"].btn-primary').count() === 1, 'doctor profile has a Get directions CTA');
await tap('[data-act="fav"]');
await shot('doctor');

console.log('Book');
await tap('.footbar [data-go="slots"]');
check(await screen() === 'slots', 'slot picker');
check(await page.locator('.slot.on').count() === 1, 'next available slot preselected');
await tap('.days .day:not(.full) >> nth=1');
await shot('slots');
const slotOk = await page.locator('.slot.on').count();
if (!slotOk) await tap('.slot:not([disabled])');
await tap('#confirmBtn');
await page.waitForTimeout(1000);
check(await screen() === 'confirmed', 'booking confirmed');
const ref = await page.locator('#ref').innerText();
check(/^QRB-\d{5}$/.test(ref), 'reference ' + ref);
await shot('confirmed');
await tap('[data-act="done"]');
check(await screen() === 'saved', 'done → saved');
check(await page.locator('[data-act="cancelBooking"]').count() === 1, 'upcoming booking listed');
check(await page.locator('.tab .badge').count() === 1, 'saved tab badge');
await shot('saved');
await tap('[data-act="savedTab"][data-v="fav"]');
check(await page.locator('.scroll .card').count() === 1, 'favourite saved');
await tap('[data-act="savedTab"][data-v="consulted"]');

console.log('Reports');
await tap('[data-act="tab"][data-tab="reports"]');
check(await page.locator('.tag-warn').count() >= 1, 'pending visit summary in reports');
await shot('reports');
await tap('[data-act="rf"][data-v="lab"]');
await tap('.scroll .card.tap');
check(await screen() === 'report', 'report detail');
check(await page.locator('table.res').count() === 1, 'lab table rendered');
await shot('report');
await tap('[data-act="back"]');

console.log('Cancel booking');
await tap('[data-act="tab"][data-tab="saved"]');
await tap('[data-act="cancelBooking"]');
await tap('[data-act="dlgOk"]');
check(await page.locator('[data-act="cancelBooking"]').count() === 0, 'booking cancelled');

console.log('Arabic / RTL');
await tap('[data-act="tab"][data-tab="map"]');
await tap('.map-search .me');
await tap('[data-act="setLang"][data-v="ar"]');
check(await page.evaluate(() => document.documentElement.dir) === 'rtl', 'RTL applied');
await tap('[data-act="back"]');
await shot('map-ar');
await tap('[data-act="tab"][data-tab="search"]');
await tap('[data-act="openSpec"][data-v="cardio"]');
await tap('.scroll .card');
await shot('doctor-ar');
await tap('.footbar [data-go="slots"]');
await shot('slots-ar');

console.log('Persistence');
await page.reload();
await page.waitForTimeout(600);
check(await screen() === 'map', 'session persists across reload');
check(await page.evaluate(() => document.documentElement.lang) === 'ar', 'language persists');

console.log('Traveler AR screenshots');
await tap('.map-search .me');
await tap('[data-act="setMode"][data-v="traveler"]');
await shot('account-traveler-ar');

await browser.close();
console.log(problems.length ? `\n${problems.length} problem(s):\n- ` + problems.join('\n- ') : '\nAll checks passed.');
process.exit(problems.length ? 1 : 0);
