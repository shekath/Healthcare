// App shell: theme (resident / traveler), language & direction, demo panel hooks.
import { state, commit } from './store.js';
import { rerender } from './ui.js';

const hooks = new Set();
export const onShellChange = fn => hooks.add(fn);
const fire = () => hooks.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });

export function applyTheme() {
  const trv = state.mode === 'traveler';
  const doc = state.demoRole === 'doctor';
  document.documentElement.dataset.theme = doc ? 'doctor' : (state.demoRole && trv ? 'traveler' : 'resident');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = doc ? '#1B5A8A' : (trv ? '#9A4419' : '#006C35');
  fire();
}

export function applyLang() {
  const ar = state.lang === 'ar';
  document.documentElement.lang = ar ? 'ar' : 'en';
  document.documentElement.dir = ar ? 'rtl' : 'ltr';
  document.title = ar ? 'قريب — الصحة أينما كنت' : 'QRIB — Health, wherever you stand';
  fire();
}

export function setLang(lang) {
  state.lang = lang;
  commit();
  applyLang();
  rerender();
}
export const toggleLang = () => setLang(state.lang === 'ar' ? 'en' : 'ar');

export function setMode(mode) {
  state.mode = mode;
  commit();
  applyTheme();
  rerender();
}
