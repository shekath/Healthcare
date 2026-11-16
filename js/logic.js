// Domain logic: distance, opening hours, slot generation, filtering, formatting.
import { state, P } from './store.js';
import { DOCTORS, FACILITIES, SPECIALTIES, SLOT_TIMES, facilityById, doctorById, cityById, INSURERS, LANGS } from './data.js';
import { t, L, num, isAr } from './i18n.js';

// ---------- geo
export function haversine(a, b) {
  const R = 6371, rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export const here = () => state.loc || { lat: cityById('riyadh').lat, lng: cityById('riyadh').lng, city: 'riyadh' };
export const kmTo = f => haversine(here(), f);

export function fmtDist(km) {
  if (km < 1) return t('m', { n: Math.max(50, Math.round(km * 1000 / 50) * 50) });
  if (km < 10) return t('km', { n: Number(km.toFixed(1)) });
  return t('km', { n: Math.round(km).toLocaleString('en-US') });
}
export const driveMin = km => Math.max(2, Math.round(km * 3.5 + 2));

export function areaLabel() {
  const loc = here();
  if (loc.source === 'gps') {
    // nearest facility's area gives a human label
    const near = [...FACILITIES].sort((a, b) => haversine(loc, a) - haversine(loc, b))[0];
    return L(near.area);
  }
  return L(cityById(loc.city).area);
}

// ---------- time helpers
export const pad2 = n => String(n).padStart(2, '0');
export const isoDate = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const parseIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const toMin = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
export const nowMin = (d = new Date()) => d.getHours() * 60 + d.getMinutes();
export const fmtTime = hhmm => num(hhmm);

const locale = () => isAr() ? 'ar-SA-u-ca-gregory-nu-arab' : 'en-GB';
export function fmtDate(iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  try { return new Intl.DateTimeFormat(locale(), opts).format(parseIso(iso)); }
  catch { return iso; }
}
export const fmtDateLong = iso => fmtDate(iso, { weekday: 'long', day: 'numeric', month: 'long' });
export const fmtDateShort = iso => fmtDate(iso, { weekday: 'short', day: 'numeric', month: 'short' });
export const fmtWhen = (iso, time, fmt = fmtDateShort) => fmt(iso) + (isAr() ? '، ' : ', ') + fmtTime(time);
export const fmtMonth = iso => fmtDate(iso, { month: 'long', year: 'numeric' });
const AR_DAY = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
const EN_DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const dayAbbr = iso => (isAr() ? AR_DAY : EN_DAY)[parseIso(iso).getDay()];

export function relDay(iso) {
  const today = isoDate(new Date());
  const tm = new Date(); tm.setDate(tm.getDate() + 1);
  if (iso === today) return t('today');
  if (iso === isoDate(tm)) return t('tomorrow');
  return fmtDateShort(iso);
}

// ---------- opening hours
export function openInfo(f, d = new Date()) {
  if (!f.hours) return { open: true, label: t('open24') };
  const [o, c] = f.hours.map(toMin), n = nowMin(d);
  const open = n >= o && n < c;
  return { open, label: open ? t('closesAt', { t: fmtTime(f.hours[1]) }) : t('opensAt', { t: fmtTime(f.hours[0]) }) };
}

// ---------- deterministic slot generation
export function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t2 = Math.imul(seed ^ seed >>> 15, 1 | seed); t2 = t2 + Math.imul(t2 ^ t2 >>> 7, 61 | t2) ^ t2; return ((t2 ^ t2 >>> 14) >>> 0) / 4294967296; }; }

export const isBookable = doc => doc.spec !== 'emerg';

// ---------- doctor-side availability (shared by the patient app and the doctor dashboard)
export const docSettings = id => state.docSettings[id] || { accepting: true, blocks: [] };
export const isAccepting = id => docSettings(id).accepting !== false;
/** The block covering this slot, if the doctor has blocked it. */
export function blockFor(id, iso, time) {
  return docSettings(id).blocks.find(b => iso >= b.from && iso <= b.to && (b.allDay || (time >= b.start && time < b.end))) || null;
}
/** Bookings from every patient profile on this device (resident and traveler). */
export function allBookings() {
  return Object.entries(state.profiles).flatMap(([mode, p]) => (p.bookings || []).map(b => ({ ...b, mode, patient: p })));
}

/** Saudi working week Sun–Thu; some doctors also work Saturday. */
export function worksOn(doc, date) {
  const wd = date.getDay();
  if (wd === 5) return false;                       // Friday
  if (wd === 6) return hash(doc.id) % 2 === 0;      // Saturday for some
  return true;
}

export function slotsFor(doc, iso) {
  const date = parseIso(iso);
  const out = { morning: [], afternoon: [] };
  if (!isBookable(doc) || !worksOn(doc, date)) return out;
  const r = rng(hash(doc.id + iso));
  const today = isoDate(new Date()) === iso;
  const cutoff = nowMin() + 30;
  const taken = new Set(allBookings().filter(b => b.doctor === doc.id && b.date === iso && b.status !== 'cancelled').map(b => b.time));
  const accepting = isAccepting(doc.id);
  for (const part of ['morning', 'afternoon']) {
    for (const time of SLOT_TIMES[part]) {
      let free = r() > 0.32;
      if (today && toMin(time) <= cutoff) free = false;
      if (taken.has(time)) free = false;
      if (!accepting || blockFor(doc.id, iso, time)) free = false;
      out[part].push({ time, free });
    }
  }
  return out;
}

export function nextAvailable(doc, days = 14) {
  if (!isBookable(doc) || !isAccepting(doc.id)) return null;
  const d = new Date();
  for (let i = 0; i < days; i++) {
    const iso = isoDate(d);
    const s = slotsFor(doc, iso);
    const free = [...s.morning, ...s.afternoon].find(x => x.free);
    if (free) return { date: iso, time: free.time, inDays: i };
    d.setDate(d.getDate() + 1);
  }
  return null;
}
export const fmtNext = n => n ? `${relDay(n.date)} ${fmtTime(n.time)}` : t('noSlots');

/** Working days starting at `from` (iso), count n. */
export function workingDays(doc, fromIso, n) {
  const d = parseIso(fromIso), out = [];
  let guard = 0;
  while (out.length < n && guard++ < 40) {
    if (worksOn(doc, d)) out.push(isoDate(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

// ---------- doctors & facilities
export function enrichDoctor(doc) {
  const f = facilityById(doc.facility);
  return { ...doc, f, km: kmTo(f), next: nextAvailable(doc) };
}
export function doctorsAtFacility(fid) {
  return DOCTORS.filter(d => d.facility === fid).map(enrichDoctor).sort((a, b) => (a.next ? a.next.inDays : 99) - (b.next ? b.next.inDays : 99));
}

export function acceptsInsurance(f, ins) { return !!ins && f.ins.includes(ins); }

export function filterDoctors(filters, q = '') {
  const ins = P().insurance;
  const query = normalize(q);
  return DOCTORS.map(enrichDoctor).filter(d => {
    if (filters.spec && d.spec !== filters.spec) return false;
    if (filters.maxKm && d.km > filters.maxKm) return false;
    if (filters.gender !== 'any' && d.gender !== filters.gender) return false;
    if (filters.langs.length && !filters.langs.some(l => d.langs.includes(l))) return false;
    if (filters.visit === 'video' && !d.video) return false;
    if (filters.myIns && !acceptsInsurance(d.f, ins)) return false;
    if (filters.avail !== 'any') {
      if (!d.next) return false;
      const lim = { today: 0, tomorrow: 1, week: 6 }[filters.avail];
      if (d.next.inDays > lim) return false;
    }
    if (query && !matchDoctor(d, query)) return false;
    return true;
  }).sort((a, b) => a.km - b.km);
}

export function activeFilterCount(f) {
  return (f.maxKm ? 1 : 0) + (f.avail !== 'any' ? 1 : 0) + (f.langs.length ? 1 : 0) +
    (f.gender !== 'any' ? 1 : 0) + (f.visit !== 'any' ? 1 : 0) + (f.myIns ? 1 : 0);
}

export function normalize(s) {
  return String(s || '').toLowerCase()
    .replace(/[ً-ْـ]/g, '')         // Arabic diacritics / tatweel
    .replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/\bdr\.?\s*/g, '').replace(/د\.\s*/g, '').replace(/\bal[\s-]/g, '').trim();
}
function matchDoctor(d, q) {
  const sp = SPECIALTIES[d.spec];
  const hay = normalize([d.name.en, d.name.ar, sp.en, sp.ar, sp.role, sp.kw, d.role.en, d.role.ar, d.f.en, d.f.ar].join(' '));
  return q.split(/\s+/).every(tok => hay.includes(tok));
}
export function searchAll(q) {
  const query = normalize(q);
  if (!query) return { doctors: [], facilities: [], specs: [] };
  const doctors = DOCTORS.map(enrichDoctor).filter(d => matchDoctor(d, query)).sort((a, b) => a.km - b.km);
  const facilities = FACILITIES.filter(f => normalize([f.en, f.ar, f.type.en, f.type.ar, f.area.en, f.area.ar].join(' ')).includes(query))
    .map(f => ({ ...f, km: kmTo(f) })).sort((a, b) => a.km - b.km);
  const specs = Object.entries(SPECIALTIES).filter(([, s]) => normalize([s.en, s.ar, s.kw, s.role].join(' ')).includes(query)).map(([k]) => k);
  return { doctors, facilities, specs };
}

export function facilitiesNear(chip) {
  return FACILITIES.map(f => ({ ...f, km: kmTo(f), oi: openInfo(f), docs: DOCTORS.filter(d => d.facility === f.id) }))
    .filter(f => {
      if (chip === 'open') return f.oi.open;
      if (chip === 'er') return f.er;
      if (chip) return f.docs.some(d => d.spec === chip);
      return true;
    })
    .sort((a, b) => a.km - b.km);
}
export function nearestEr() {
  return FACILITIES.filter(f => f.er).map(f => ({ ...f, km: kmTo(f) })).sort((a, b) => a.km - b.km)[0];
}

// ---------- money
export function fmtFee(doc) {
  if (!doc.fee[1]) return isAr() ? 'مجانًا في الطوارئ' : 'Free in emergencies';
  const [a, b] = doc.fee;
  let s = `SAR ${a}–${b}`;
  if (state.mode === 'traveler') s += ` (≈ USD ${Math.round(a / 3.75)}–${Math.round(b / 3.75)})`;
  return s;
}
export function feeFor(doc, visit) {
  const base = Math.round((doc.fee[0] + doc.fee[1]) / 2 / 10) * 10;
  return visit === 'video' ? Math.round(base * 0.8 / 10) * 10 : base;
}
export function fmtSar(v) {
  let s = `SAR ${v}`;
  if (state.mode === 'traveler') s += ` · ≈ USD ${Math.round(v / 3.75)}`;
  return s;
}

export const langsShort = d => d.langs.map(l => L(LANGS[l].short)).join(' · ');
export const langsLong = d => d.langs.map(l => L(LANGS[l])).join(isAr() ? '، ' : ', ');
export const insName = k => k ? L(INSURERS[k]) : t('none');

// ---------- bookings
export function makeRef() { return 'QRB-' + String(Math.floor(10000 + Math.random() * 89999)); }

export function upcomingBookings() {
  const now = new Date(), today = isoDate(now), n = nowMin(now);
  return P().bookings
    .filter(b => b.status === 'booked' && (b.date > today || (b.date === today && toMin(b.time) >= n - 30)))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

// ---------- links & files
export const directionsUrl = f => `https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}`;
export function openExternal(url) {
  // A real link click works in browsers, installed PWAs and sandboxed frames.
  const a = document.createElement('a');
  a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
  document.body.appendChild(a); a.click(); a.remove();
}
export const isEmbedded = () => { try { return window.top !== window.self; } catch { return true; } };

export function downloadFile(name, mime, content) {
  if (isEmbedded()) return false;   // sandboxed frames block downloads
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  } catch { return false; }
}

export function bookingIcs(b) {
  const doc = doctorById(b.doctor), f = facilityById(b.facility);
  const [y, m, d] = b.date.split('-').map(Number);
  const [hh, mm] = b.time.split(':').map(Number);
  const start = new Date(y, m - 1, d, hh, mm);
  const end = new Date(start.getTime() + 30 * 60000);
  const z = dt => dt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = s => String(s).replace(/([,;\\])/g, '\\$1');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//QRIB//Prototype//EN', 'BEGIN:VEVENT',
    `UID:${b.ref}@qrib.demo`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(start)}`, `DTEND:${z(end)}`,
    `SUMMARY:${esc(`${doc.name.en} — ${SPECIALTIES[doc.spec].en}`)}`,
    `LOCATION:${esc(b.visit === 'video' ? 'Video visit' : `${f.en}, ${f.area.en}`)}`,
    `DESCRIPTION:${esc(`QRIB booking ${b.ref}`)}`,
    'BEGIN:VALARM', 'TRIGGER:-PT60M', 'ACTION:DISPLAY', 'DESCRIPTION:Appointment reminder', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}
