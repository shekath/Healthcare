// Doctor-side model for the demo dashboard: demo patients filling the slots the
// patient app shows as taken, real bookings made in the patient app, and the
// doctor's availability blocks. Everything is derived, so both sides agree.
import { state, commit } from './store.js';
import { doctorById, SLOT_TIMES, SPECIALTIES } from './data.js';
import { hash, rng, worksOn, isoDate, parseIso, toMin, nowMin, allBookings, blockFor, docSettings } from './logic.js';

// [en, ar, gender, birthYear, visitor?]
const POOL = [
  ['Mohammed Al Otaibi', 'محمد العتيبي', 'm', 1979], ['Nora Al Dosari', 'نورة الدوسري', 'f', 1991],
  ['Khalid Al Zahrani', 'خالد الزهراني', 'm', 1968], ['Reem Al Harbi', 'ريم الحربي', 'f', 1995],
  ['Saud Al Mutairi', 'سعود المطيري', 'm', 1983], ['Lama Al Shehri', 'لمى الشهري', 'f', 1988],
  ['Turki Al Qahtani', 'تركي القحطاني', 'm', 1975], ['Hessa Al Rashid', 'حصة الراشد', 'f', 1962],
  ['Fahad Al Ghamdi', 'فهد الغامدي', 'm', 1990], ['Maha Al Anazi', 'مها العنزي', 'f', 1984],
  ['Abdullah Al Subaie', 'عبدالله السبيعي', 'm', 1958], ['Sara Al Juhani', 'سارة الجهني', 'f', 1999],
  ['Omar Al Shamrani', 'عمر الشمراني', 'm', 1972], ['Haifa Al Malki', 'هيفاء المالكي', 'f', 1980],
  ['Yazeed Al Balawi', 'يزيد البلوي', 'm', 2001], ['Dalal Al Sahli', 'دلال السهلي', 'f', 1977],
  ['Nasser Al Yami', 'ناصر اليامي', 'm', 1966], ['Joud Al Asmari', 'جود الأسمري', 'f', 1993],
  ['Majed Al Shahrani', 'ماجد الشهراني', 'm', 1987], ['Amal Al Hazmi', 'أمل الحازمي', 'f', 1970],
  ['Bandar Al Ruwaili', 'بندر الرويلي', 'm', 1981], ['Shahad Al Khaldi', 'شهد الخالدي', 'f', 1997],
  ['Faisal Al Enezi', 'فيصل العنزي', 'm', 1964], ['Wafa Al Tamimi', 'وفاء التميمي', 'f', 1986],
  ['James Carter', 'جيمس كارتر', 'm', 1978, 1], ['Aisha Rahman', 'عائشة رحمن', 'f', 1985, 1],
  ['Muhammad Iqbal', 'محمد إقبال', 'm', 1974, 1], ['Maria Santos', 'ماريا سانتوس', 'f', 1992, 1],
  ['Priya Sharma', 'بريا شارما', 'f', 1989, 1], ['Omar Haddad', 'عمر حداد', 'm', 1983, 1],
  ['Lena Fischer', 'لينا فيشر', 'f', 1994, 1], ['Ahmad Fauzi', 'أحمد فوزي', 'm', 1969, 1],
];
const REASONS = [
  { en: 'Follow-up visit', ar: 'زيارة متابعة' }, { en: 'New consultation', ar: 'استشارة جديدة' },
  { en: 'Lab results review', ar: 'مراجعة نتائج المختبر' }, { en: 'Prescription renewal', ar: 'تجديد وصفة' },
  { en: 'Blood pressure check', ar: 'قياس ضغط الدم' }, { en: 'Second opinion', ar: 'رأي طبي ثانٍ' },
];

export const actingDoctor = () => doctorById(state.actingDoctor) || doctorById('hana');

// Larger pool of one-off patients built from first and last names.
const FIRST = [
  ['Ahmed', 'أحمد', 'm'], ['Fatimah', 'فاطمة', 'f'], ['Sultan', 'سلطان', 'm'], ['Mashael', 'مشاعل', 'f'], ['Ibrahim', 'إبراهيم', 'm'],
  ['Asma', 'أسماء', 'f'], ['Hamad', 'حمد', 'm'], ['Ghada', 'غادة', 'f'], ['Rakan', 'راكان', 'm'], ['Arwa', 'أروى', 'f'],
  ['Mansour', 'منصور', 'm'], ['Hind', 'هند', 'f'], ['Ziyad', 'زياد', 'm'], ['Rawan', 'روان', 'f'], ['Talal', 'طلال', 'm'],
  ['Najla', 'نجلاء', 'f'], ['Waleed', 'وليد', 'm'], ['Abeer', 'عبير', 'f'], ['Meshari', 'مشاري', 'm'], ['Bushra', 'بشرى', 'f'],
];
const LAST = [
  ['Al Dossary', 'الدوسري'], ['Al Qahtani', 'القحطاني'], ['Al Ghamdi', 'الغامدي'], ['Al Harbi', 'الحربي'], ['Al Otaibi', 'العتيبي'],
  ['Al Shehri', 'الشهري'], ['Al Zahrani', 'الزهراني'], ['Al Mutairi', 'المطيري'], ['Al Anazi', 'العنزي'], ['Al Subaie', 'السبيعي'],
  ['Al Malki', 'المالكي'], ['Al Juhani', 'الجهني'], ['Al Shammari', 'الشمري'], ['Al Asmari', 'الأسمري'], ['Al Yami', 'اليامي'],
];
const REGULARS = 16;              // the first POOL entries are the clinic's regular, returning patients
const BIG = FIRST.length * LAST.length;

function person(idx) {
  if (idx < POOL.length) return POOL[idx];
  const i = idx - POOL.length;
  const f = FIRST[i % FIRST.length], l = LAST[Math.floor(i / FIRST.length) % LAST.length];
  return [`${f[0]} ${l[0]}`, `${f[1]} ${l[1]}`, f[2], 1950 + (hash('y' + i) % 55)];
}

function demoPatient(idx) {
  const [en, ar, g, by, visitor] = person(idx);
  const h = hash('p' + idx);
  return {
    key: 'd' + idx, name: { en, ar }, gender: g, age: new Date().getFullYear() - by, visitor: !!visitor,
    phone: visitor ? `+${[44, 92, 63, 91, 961, 49, 62][idx % 7]} ${String(h).slice(0, 3)} ${String(h).slice(3, 6)} ${String(h).slice(6, 9)}` : `+966 5${h % 10} ${String(h).slice(1, 4)} ${String(h).slice(4, 8)}`,
    demo: true,
  };
}
// About a quarter of visits are the doctor's regulars; the rest are mostly one-off patients
// (with occasional visitors from abroad), so "repeat" means something.
function pickPatient(docId, iso, time) {
  const h = hash(docId + iso + time + 'pt'), h2 = hash(h + docId);
  const roll = h % 100;
  if (roll < 24) return (h2 + hash(docId)) % REGULARS;                     // regulars, per doctor
  if (roll < 34) return REGULARS + (h2 % (POOL.length - REGULARS));        // visitors / occasional
  return POOL.length + ((h2 + hash(docId) * 7) % BIG);                     // one-off
}
function realPatient(mode, p) {
  const age = p.dob ? new Date().getFullYear() - +p.dob.slice(0, 4) : null;
  return { key: 'u-' + mode, name: { en: p.name || '—', ar: p.name || '—' }, gender: p.gender, age, visitor: mode === 'traveler',
    phone: state.session?.value || '', real: true, mode };
}

/**
 * One day of a doctor's schedule. Each slot is one of:
 * patient (demo or real booking), blocked, free, closed (not a working day / doctor paused).
 */
export function dayPlan(docId, iso) {
  const doc = doctorById(docId);
  const out = [];
  if (!worksOn(doc, parseIso(iso))) return out;
  const r = rng(hash(doc.id + iso));                     // same sequence as slotsFor()
  const real = allBookings().filter(b => b.doctor === docId && b.date === iso && b.status !== 'cancelled');
  const today = isoDate(new Date());
  const past = t => iso < today || (iso === today && toMin(t) < nowMin());
  for (const part of ['morning', 'afternoon']) {
    for (const time of SLOT_TIMES[part]) {
      const taken = r() <= 0.32;
      const b = real.find(x => x.time === time);
      const key = `${docId}|${iso}|${time}`;
      if (b) {
        out.push({ time, part, kind: 'patient', patient: realPatient(b.mode, b.patient), booking: b,
          visit: b.visit, reason: b.reason ? { en: b.reason, ar: b.reason } : null,
          status: b.status === 'completed' ? 'done' : (state.docMarks[key] || (past(time) ? 'due' : 'booked')), key });
      } else if (taken) {
        const idx = pickPatient(docId, iso, time);
        const h = hash(key);
        out.push({ time, part, kind: 'patient', patient: demoPatient(idx), visit: doc.video && h % 4 === 0 ? 'video' : 'inperson',
          reason: REASONS[h % REASONS.length], status: state.docMarks[key] || (past(time) ? 'done' : 'booked'), key });
      } else {
        const blk = blockFor(docId, iso, time);
        out.push({ time, part, kind: blk ? 'blocked' : (past(time) ? 'past' : 'free'), block: blk, key });
      }
    }
  }
  return out;
}

/** Working days for the schedule strip. */
export function scheduleDays(docId, fromIso, n) {
  const doc = doctorById(docId), d = parseIso(fromIso), out = [];
  let guard = 0;
  while (out.length < n && guard++ < 30) { if (worksOn(doc, d)) out.push(isoDate(d)); d.setDate(d.getDate() + 1); }
  return out;
}

/** Patients seen in the last 30 days and booked for the next 14, with visit counts. */
export function patientList(docId) {
  const doc = doctorById(docId);
  const map = new Map();
  const add = (pt, iso, slot) => {
    if (!map.has(pt.key)) map.set(pt.key, { ...pt, visits: [], upcoming: [] });
    const e = map.get(pt.key);
    const today = isoDate(new Date());
    if (iso < today || (slot && slot.status === 'done')) e.visits.push({ date: iso, slot });
    else e.upcoming.push({ date: iso, slot });
  };
  const d = new Date(); d.setDate(d.getDate() - 30);
  for (let i = 0; i < 45; i++) {
    const iso = isoDate(d);
    if (worksOn(doc, d)) for (const s of dayPlan(docId, iso)) if (s.kind === 'patient' && s.status !== 'noshow') add(s.patient, iso, s);
    d.setDate(d.getDate() + 1);
  }
  // Earlier visits from the patient app's history (e.g. "Consulted" seed data)
  for (const [mode, p] of Object.entries(state.profiles)) {
    for (const c of p.consulted || []) {
      if (c.doctor !== docId) continue;
      const pt = realPatient(mode, p);
      const known = map.get(pt.key);
      if (!known || !known.visits.some(v => v.date === c.date) && !known.upcoming.some(v => v.date === c.date)) add(pt, c.date, null);
    }
  }
  return [...map.values()].map(e => {
    e.visits.sort((a, b) => b.date.localeCompare(a.date));
    e.upcoming.sort((a, b) => (a.date + (a.slot?.time || '')).localeCompare(b.date + (b.slot?.time || '')));
    e.total = e.visits.length + e.upcoming.length;
    e.repeat = e.total > 1;
    return e;
  }).sort((a, b) => (b.upcoming.length ? 1 : 0) - (a.upcoming.length ? 1 : 0) || b.total - a.total);
}

// ---------- availability edits
function settings(docId) {
  if (!state.docSettings[docId]) state.docSettings[docId] = { accepting: true, blocks: [] };
  return state.docSettings[docId];
}
export function setAccepting(docId, on) { settings(docId).accepting = on; commit(); }
export function addBlock(docId, b) {
  settings(docId).blocks.push({ id: 'k' + Date.now().toString(36), ...b });
  settings(docId).blocks.sort((x, y) => (x.from + (x.start || '')).localeCompare(y.from + (y.start || '')));
  commit();
}
export function removeBlock(docId, id) { const s = settings(docId); s.blocks = s.blocks.filter(b => b.id !== id); commit(); }
export function activeBlocks(docId) {
  const today = isoDate(new Date());
  return docSettings(docId).blocks.filter(b => b.to >= today);
}

// ---------- appointment actions
export function markSlot(slot, status, note) {
  if (slot.booking) {
    const p = state.profiles[slot.booking.mode];
    const b = p.bookings.find(x => x.id === slot.booking.id);
    if (status === 'done') {
      b.status = 'completed';
      const doc = doctorById(b.doctor);
      const r = p.reports.find(x => x.booking === b.id);
      const text = (note || '').trim() || 'Seen in clinic. No further action needed.';
      if (r) {
        r.pending = false; r.tags = ['visitSummary'];
        r.body = { kind: 'visit', summary: { en: text, ar: text }, diagnosis: { en: SPECIALTIES[doc.spec].en + ' review', ar: 'مراجعة ' + SPECIALTIES[doc.spec].ar }, meds: [] };
      }
      p.consulted = [{ doctor: b.doctor, date: b.date }, ...p.consulted.filter(c => c.doctor !== b.doctor)];
    } else if (status === 'cancel') {
      b.status = 'cancelled'; b.cancelledBy = 'clinic';
      p.reports = p.reports.filter(x => x.booking !== b.id);
    } else state.docMarks[slot.key] = status;
  } else {
    if (status === 'booked') delete state.docMarks[slot.key]; else state.docMarks[slot.key] = status;
  }
  commit();
}
