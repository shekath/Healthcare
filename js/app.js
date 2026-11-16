// QRIB — app bootstrap.
import { state, commit, onChange, resetAll, P } from './store.js';
import { t, num } from './i18n.js';
import { register, reset, back, bindEvents, registerGlobal, toast, closeOverlay, esc, currentName } from './ui.js';
import { applyTheme, applyLang, onShellChange, setLang, setMode, toggleLang } from './shell.js';
import { facilityById, doctorById } from './data.js';
import { directionsUrl, openExternal, slotsFor } from './logic.js';
import './screens/auth.js';
import './screens/discover.js';
import { downloadIcs } from './screens/booking.js';
import './screens/saved.js';
import './screens/reports.js';
import './screens/account.js';
import { switchUseCase } from './screens/doctor.js';

// ---------------------------------------------------------------- globals
registerGlobal('back', () => back());
registerGlobal('switchUseCase', () => switchUseCase());
registerGlobal('closeOverlay', () => closeOverlay());
registerGlobal('toggleLang', () => toggleLang());
registerGlobal('tab', el => reset(el.dataset.tab, el.classList.contains('q') ? { focus: true } : {}));
registerGlobal('dir', el => { const f = facilityById(el.dataset.fid); if (f) openExternal(directionsUrl(f)); });
registerGlobal('tel', el => { location.href = `tel:${el.dataset.tel}`; });
registerGlobal('ics', el => { const b = P().bookings.find(x => x.id === el.dataset.id); if (b) downloadIcs(b); });

// ---------------------------------------------------------------- status bar clock (framed preview only)
function tickClock() {
  const el = document.getElementById('sbTime');
  if (!el) return;
  const d = new Date();
  el.textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ---------------------------------------------------------------- demo panel (desktop)
function renderDemoPanel() {
  const host = document.getElementById('demoPanel');
  if (!host) return;
  const ar = state.lang === 'ar';
  const trv = state.mode === 'traveler';
  host.innerHTML = `
    <h1>QR<i>Ī</i>B</h1>
    <p>${ar ? 'نموذج أولي تفاعلي لتطبيق قريب — للمقيمين والمسافرين في المملكة. كل الشاشات تعمل ببيانات تجريبية محفوظة في هذا المتصفح.'
           : 'Working prototype of the QRIB mobile app for Saudi residents and travelers. Every screen is live, with demo data stored in this browser.'}</p>
    <div class="demo-card">
      <h3>${ar ? 'حالة الاستخدام' : 'Use case'}</h3>
      <div class="seg">
        <button class="${state.demoRole !== 'doctor' ? 'on' : ''}" data-demo="role" data-v="patient">${esc(t('ucPatient'))}</button>
        <button class="${state.demoRole === 'doctor' ? 'on' : ''}" data-demo="role" data-v="doctor">${esc(t('ucDoctor'))}</button>
      </div>
      <p>${ar ? 'الحجز في تطبيق المريض يظهر فورًا في جدول الطبيب، والأوقات التي يغلقها الطبيب تختفي من التطبيق.' : 'A booking made in the patient app appears in the doctor’s schedule; times the doctor blocks disappear from the patient app.'}</p>
    </div>
    <div class="demo-card" ${state.demoRole === 'doctor' ? 'hidden' : ''}>
      <h3>${ar ? 'نوع الملف' : 'Profile type'}</h3>
      <div class="seg">
        <button class="${!trv ? 'on' : ''}" data-demo="mode" data-v="resident">${esc(t('resident'))}</button>
        <button class="${trv ? 'on' : ''}" data-demo="mode" data-v="traveler">${esc(t('traveler'))}</button>
      </div>
      <p>${ar ? 'الأخضر للمقيمين، والتراكوتا الصحراوي للمسافرين.' : 'Green for residents, desert terracotta for travelers.'}</p>
    </div>
    <div class="demo-card">
      <h3>${ar ? 'اللغة' : 'Language'}</h3>
      <div class="seg">
        <button class="${!ar ? 'on' : ''}" data-demo="lang" data-v="en">English</button>
        <button class="${ar ? 'on' : ''}" data-demo="lang" data-v="ar">العربية</button>
      </div>
    </div>
    <div class="demo-card">
      <h3>${ar ? 'نصائح العرض' : 'Demo tips'}</h3>
      <p>${ar ? 'رمز التحقق يظهر على الشاشة وفي إشعار. الحجوزات تظهر في «المحفوظة» وملخص الزيارة في «التقارير».'
             : 'The OTP code is shown on screen and in a toast. Bookings appear under Saved, and a pending visit summary under Reports.'}</p>
      <button class="btn btn-ghost btn-sm" style="width:100%" data-demo="restart">${ar ? 'العودة إلى اختيار العرض' : 'Back to use-case chooser'}</button>
      <button class="btn btn-ghost btn-sm" style="width:100%" data-demo="reset">${esc(t('resetDemo'))}</button>
    </div>`;
}
function bindDemoPanel() {
  const host = document.getElementById('demoPanel');
  if (!host) return;
  host.addEventListener('click', e => {
    const b = e.target.closest('[data-demo]');
    if (!b) return;
    const a = b.dataset.demo;
    if (a === 'mode') { setMode(b.dataset.v); toast(t('switchedTo', { m: t(b.dataset.v === 'traveler' ? 'travelerMode' : 'residentMode') })); }
    if (a === 'lang') setLang(b.dataset.v);
    if (a === 'role') {
      state.demoRole = b.dataset.v; commit(); applyTheme();
      if (state.demoRole === 'doctor') reset('docHome');
      else reset(state.session && state.mode ? (state.loc ? 'map' : 'location') : 'splash');
    }
    if (a === 'restart') { state.session = null; state.demoRole = null; commit(); applyTheme(); reset('demo'); }
    if (a === 'reset') { resetAll(); commit(); location.reload(); }
  });
}

// ---------------------------------------------------------------- boot
function start() {
  applyLang();
  applyTheme();
  bindEvents(document.querySelector('.device'));
  bindDemoPanel();
  onShellChange(renderDemoPanel);
  onChange(renderDemoPanel);
  renderDemoPanel();
  tickClock(); setInterval(tickClock, 15000);

  if (!state.demoRole) reset('demo');
  else if (state.demoRole === 'doctor') reset('docHome');
  else if (state.session && state.mode) reset(state.loc ? 'map' : 'location');
  else reset('splash');

  window.addEventListener('offline', () => toast(t('offline'), 3500));

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && window.top === window.self) {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* optional */ });
  }
  // test / debugging hook
  window.QRIB = {
    state, reset, currentName,
    slotsFree: (id, iso) => { const sl = slotsFor(doctorById(id), iso); return [...sl.morning, ...sl.afternoon].filter(x => x.free).length; },
  };
}

start();
