// Global app state with localStorage persistence (fails soft in private
// mode / sandboxed frames). Each profile type keeps its own data.
import { seedReports, seedConsulted } from './data.js';

const KEY = 'qrib.v1';

export const DEFAULT_FILTERS = () => ({
  spec: null, maxKm: null, avail: 'any', langs: [], gender: 'any', visit: 'any', myIns: false,
});

function freshProfile(mode) {
  const now = Date.now();
  const iso = d => new Date(now - d * 864e5).toISOString().slice(0, 10);
  return {
    seeded: true,
    name: mode === 'traveler' ? 'Sarah Thompson' : 'Abdulaziz Al Shammari',
    gender: mode === 'traveler' ? 'f' : 'm',
    dob: mode === 'traveler' ? '1990-04-12' : '1986-09-03',
    insurance: mode === 'traveler' ? 'visit' : 'bupa',
    favourites: [],
    consulted: seedConsulted(mode).map(c => ({ doctor: c.doctor, date: iso(c.daysAgo) })),
    bookings: [],
    reports: seedReports(mode).map(r => { const { daysAgo, ...rest } = r; return { ...rest, date: iso(daysAgo) }; }),
    recent: [],
  };
}

function defaults() {
  return {
    lang: (navigator.language || 'en').toLowerCase().startsWith('ar') ? 'ar' : 'en',
    mode: null,            // 'resident' | 'traveler'
    session: null,         // { method, value }
    loc: null,             // { lat, lng, city, source }
    filters: DEFAULT_FILTERS(),
    profiles: {},
    demoRole: null,        // 'patient' | 'doctor' — demo chooser, not part of the app
    actingDoctor: 'hana',  // doctor dashboard identity
    docSettings: {},       // { [doctorId]: { accepting, blocks: [{ id, from, to, allDay, start, end, reason }] } }
    docMarks: {},          // { [doctorId|date|time]: 'done' | 'noshow' } for demo patients
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const s = JSON.parse(raw);
    return { ...defaults(), ...s, filters: { ...DEFAULT_FILTERS(), ...(s.filters || {}) } };
  } catch { return defaults(); }
}

export const state = load();

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
}

/** Current profile's data, seeded on first use. */
export function P() {
  const m = state.mode || 'resident';
  if (!state.profiles[m]) { state.profiles[m] = freshProfile(m); save(); }
  const p = state.profiles[m];
  if (p.name === undefined) {                    // data saved before names existed
    const f = freshProfile(m); p.name = f.name; p.gender = f.gender; p.dob = f.dob; save();
  }
  return p;
}

export function resetAll() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  const d = defaults();
  d.lang = state.lang;
  Object.keys(state).forEach(k => delete state[k]);
  Object.assign(state, d);
}

const listeners = new Set();
export const onChange = fn => (listeners.add(fn), () => listeners.delete(fn));
export function commit() { save(); listeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); }
