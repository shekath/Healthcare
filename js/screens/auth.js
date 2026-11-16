// Stage 1 — Entry and identity: sign in (with traveler switch), OTP, location.
import { state, commit, P } from '../store.js';
import { t, L, num } from '../i18n.js';
import { icon } from '../icons.js';
import { CITIES, COUNTRY_CODES, cityById } from '../data.js';
import { haversine } from '../logic.js';
import { register, go, reset, back, esc, toast, openSheet, closeOverlay, appbar } from '../ui.js';
import { applyTheme, toggleLang } from '../shell.js';

// ------------------------------------------------------------ 01 sign in (app entry)
// Opens the app. A switch picks Traveler mode, which changes the theme live.
const SA_RE = /^5\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(s) {
  if (s.method === 'email') return EMAIL_RE.test((s.email || '').trim()) ? null : t('errEmail');
  const digits = (s.phone || '').replace(/\D/g, '').replace(/^0+/, '');
  if (s.cc === '+966') return SA_RE.test(digits) ? null : t('errPhoneSa');
  return digits.length >= 6 && digits.length <= 14 ? null : t('errPhoneIntl');
}
function displayPhone(cc, raw) {
  const d = raw.replace(/\D/g, '').replace(/^0+/, '');
  if (cc === '+966' && d.length === 9) return `${cc} ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${cc} ${d.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
}

register('signin', {
  edge: true, onBrand: true,
  render: ctx => {
    const s = ctx.s;
    const trv = state.mode === 'traveler';
    s.method ??= 'phone';
    s.cc ??= '+966';
    const field = s.method === 'phone'
      ? `<div class="field">
          <label class="label" for="phone">${esc(t('mobileNumber'))}</label>
          <div class="input ${s.err ? 'err' : ''}" style="direction:ltr">
            <select class="prefix" id="cc" data-input="cc" aria-label="Country code">${COUNTRY_CODES.map(([c, iso]) => `<option value="${c}" ${c === s.cc ? 'selected' : ''}>${iso} ${c}</option>`).join('')}</select>
            <input id="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="${s.cc === '+966' ? '5X XXX XXXX' : 'Phone number'}" value="${esc(s.phone || '')}" data-input="phone" data-enter="send" style="text-align:left">
          </div>
          <span class="helper ${s.err ? 'err' : ''}" id="help">${esc(s.err || t(trv ? 'phoneHelpTrv' : 'phoneHelpRes'))}</span>
        </div>`
      : `<div class="field">
          <label class="label" for="email">${esc(t('emailAddress'))}</label>
          <div class="input ${s.err ? 'err' : ''}">
            <input id="email" type="email" inputmode="email" autocomplete="email" placeholder="name@example.com" value="${esc(s.email || '')}" data-input="email" data-enter="send" style="direction:ltr">
          </div>
          <span class="helper ${s.err ? 'err' : ''}" id="help">${esc(s.err || t('emailHelp'))}</span>
        </div>`;
    return `<div class="body">
      <div class="scroll" style="padding-bottom:0" data-scroll-id="login">
        <header class="login-hero">
          <div class="between">
            <div class="wordmark" aria-label="QRIB">QR<i>Ī</i>B</div>
            <button class="lang-pill" data-act="toggleLang">${esc(t('langToggle'))}</button>
          </div>
          <p class="hero-tag">${esc(t('appTagline'))}</p>
        </header>
        <div class="login-card stack">
          <button class="trv-toggle ${trv ? 'on' : ''}" role="switch" aria-checked="${trv}" data-act="toggleTraveler" id="trvToggle">
            <span class="ic">${icon('plane')}</span>
            <span class="grow"><span class="h3">${esc(t('imTraveler'))}</span><span class="xs">${esc(t(trv ? 'travelerOnSub' : 'travelerOffSub'))}</span></span>
            <span class="switch" aria-hidden="true"><i></i></span>
          </button>
          <div>
            <h2 class="h1">${esc(t('signIn'))}</h2>
            <p class="sm" style="margin-top:4px">${esc(s.method === 'email' ? t('emailHelp') : t('signInSub'))}</p>
          </div>
          <div class="seg" role="tablist">
            <button class="${s.method === 'phone' ? 'on' : ''}" data-act="method" data-v="phone">${esc(t('phone'))}</button>
            <button class="${s.method === 'email' ? 'on' : ''}" data-act="method" data-v="email">${esc(t('email'))}</button>
          </div>
          ${field}
          <button class="btn btn-primary" data-act="send" id="sendBtn">${esc(t('sendCode'))}</button>
          <div class="row" style="gap:var(--sp-3)"><span class="divider grow"></span><span class="xs">${esc(t('orContinue'))}</span><span class="divider grow"></span></div>
          <div class="row" style="gap:var(--sp-3)">
            ${trv ? '' : `<button class="btn btn-ghost" style="flex:1" data-act="sso" data-v="nafath">${esc(t('nafath'))}</button>`}
            <button class="btn btn-ghost" style="flex:1" data-act="sso" data-v="apple">Apple</button>
            <button class="btn btn-ghost" style="flex:1" data-act="sso" data-v="google">Google</button>
          </div>
          ${trv ? `<p class="xs" style="text-align:center;margin-top:-6px">${esc(t('nafathNote'))}</p>` : ''}
          <p class="xs" style="line-height:1.6;text-align:center">${esc(t('terms'))}</p>
          <p class="xs" style="text-align:center;color:var(--content-brand);font-weight:500">${icon('shield')} ${esc(t('licensedOnly'))}</p>
        </div>
      </div>
    </div>`;
  },
  mount: () => { if (!state.mode) { state.mode = 'resident'; applyTheme(); commit(); } },
  inputs: {
    phone: (el, ev, ctx) => { ctx.s.phone = el.value; clearErr(ctx); },
    email: (el, ev, ctx) => { ctx.s.email = el.value; clearErr(ctx); },
    cc: (el, ev, ctx) => { ctx.s.cc = el.value; ctx.s.err = null; ctx.rerender(); },
  },
  actions: {
    toggleTraveler: (el, ev, ctx) => {
      state.mode = state.mode === 'traveler' ? 'resident' : 'traveler';
      applyTheme();
      commit();
      ctx.s.err = null;
      ctx.rerender();
      ctx.$('#trvToggle')?.focus({ preventScroll: true });
    },
    method: (el, ev, ctx) => { ctx.s.method = el.dataset.v; ctx.s.err = null; ctx.rerender(); setTimeout(() => ctx.$('#phone,#email')?.focus(), 30); },
    send: (el, ev, ctx) => {
      const s = ctx.s;
      const err = validate(s);
      if (err) { s.err = err; ctx.rerender(); ctx.$('#phone,#email')?.focus(); return; }
      const value = s.method === 'email' ? s.email.trim() : displayPhone(s.cc, s.phone);
      go('otp', { method: s.method, value });
    },
    sso: (el) => {
      const p = el.dataset.v;
      if (p === 'nafath') {
        const n = 10 + Math.floor(Math.random() * 89);
        openSheet(`<div style="text-align:center;padding:12px 0 8px">
            <div style="width:92px;height:92px;border-radius:50%;margin:0 auto;display:grid;place-items:center;background:var(--brand-50);color:var(--brand-700);font-size:38px;font-weight:600">${num(n)}</div>
            <p class="body-t" style="margin-top:16px">${esc(t('nafathApprove', { n: num(n) }))}</p>
            <div class="row" style="justify-content:center;margin-top:16px;gap:10px"><span class="spinner" style="border-color:var(--brand-100);border-top-color:var(--brand-600)"></span><span class="sm">${esc(t('ssoSigning', { p: t('nafath') }))}</span></div>
          </div>`, {}, { title: t('nafath') });
        setTimeout(() => { if (closeOverlay()) completeLogin('nafath', `${t('nafath')} · 10XXXXXXXX`); }, 2600);
        return;
      }
      const name = p === 'apple' ? 'Apple' : 'Google';
      toast(t('ssoSigning', { p: name }), 1200);
      setTimeout(() => completeLogin(p, name), 1100);
    },
  },
});
function clearErr(ctx) {
  if (!ctx.s.err) return;
  ctx.s.err = null;
  ctx.$('.input')?.classList.remove('err');
  const h = ctx.$('#help');
  if (h) { h.classList.remove('err'); h.textContent = ctx.s.method === 'email' ? t('emailHelp') : t(state.mode === 'traveler' ? 'phoneHelpTrv' : 'phoneHelpRes'); }
}

export function completeLogin(method, value) {
  state.session = { method, value, at: Date.now() };
  P();
  commit();
  if (!state.loc) reset('location', {}, 'fwd');
  else reset('map', {}, 'fwd');
}

// ------------------------------------------------------------ 03 OTP
const EXPIRY = 5 * 60, RESEND = 30;
const mmss = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const msss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function newCode(s) {
  s.code = String(1000 + Math.floor(Math.random() * 9000));
  s.sentAt = Date.now();
  s.entered = '';
  s.err = false;
  setTimeout(() => toast(t('demoCode', { c: num(s.code) }), 4500), 600);
}

register('otp', {
  render: ctx => {
    const s = ctx.s, p = ctx.params;
    if (!s.code) newCode(s);
    const boxes = [0, 1, 2, 3].map(i => {
      const ch = s.entered[i];
      const cls = ch ? 'filled' : (i === s.entered.length ? 'caret' : '');
      return `<span class="${cls}">${ch ? esc(num(ch)) : ''}</span>`;
    }).join('');
    return `<div class="body">
      ${appbar()}
      <div class="scroll pad stack" style="gap:var(--sp-5)">
        <div>
          <h2 class="h-display">${esc(t('enterCode'))}</h2>
          <p class="body-t" style="margin-top:6px">${esc(t('sentTo'))} <b class="ltr-num" style="color:var(--content-primary);font-weight:600">${esc(p.value)}</b></p>
        </div>
        <label class="otp ${s.err ? 'err' : ''}" id="otpBox" aria-label="${esc(t('enterCode'))}">
          ${boxes}
          <input id="otp" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" maxlength="4" value="${esc(s.entered)}" data-input="otp" aria-label="${esc(t('enterCode'))}">
        </label>
        <div class="note info" id="otpNote">
          <span id="expiry">${esc(s.err ? t('wrongCode') : t('codeExpires', { t: num(mmss(EXPIRY)) }))}</span>
          <div class="xs" style="margin-top:6px;color:var(--info-600);opacity:.85">${esc(t('demo'))}: <b class="ltr-num">${esc(num(s.code))}</b></div>
        </div>
        <button class="btn btn-primary" data-act="verify" id="verifyBtn" ${s.entered.length === 4 ? '' : 'aria-disabled="true"'}>${esc(t('verify'))}</button>
        <div style="text-align:center">
          <span class="sm">${esc(t('didntGet'))}</span>
          <button class="linkbtn" data-act="resend" id="resend" disabled>${esc(t('resendIn', { t: num(msss(RESEND)) }))}</button>
        </div>
        <div class="divider" style="margin-top:var(--sp-2)"></div>
        <button class="btn btn-ghost" data-act="back">${esc(t(p.method === 'email' ? 'changeEmail' : 'changeNumber'))}</button>
      </div>
    </div>`;
  },
  mount: ctx => {
    const tick = () => {
      const el = (Date.now() - ctx.s.sentAt) / 1000 | 0;
      const left = Math.max(0, EXPIRY - el), rs = Math.max(0, RESEND - el);
      const ex = ctx.$('#expiry');
      if (ex && !ctx.s.err) ex.textContent = left ? t('codeExpires', { t: num(mmss(left)) }) : t('codeExpired');
      const r = ctx.$('#resend');
      if (r) { r.disabled = rs > 0; r.textContent = rs > 0 ? t('resendIn', { t: num(msss(rs)) }) : t('resend'); }
    };
    tick();
    const iv = setInterval(tick, 1000);
    setTimeout(() => ctx.$('#otp')?.focus({ preventScroll: true }), 320);
    return () => clearInterval(iv);
  },
  inputs: {
    otp: (el, ev, ctx) => {
      // accept Arabic-Indic digits too
      const v = el.value.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\D/g, '').slice(0, 4);
      ctx.s.entered = v; ctx.s.err = false;
      ctx.rerender();
      if (v.length === 4) setTimeout(() => verify(ctx), 180);
    },
  },
  actions: {
    verify: (el, ev, ctx) => verify(ctx),
    resend: (el, ev, ctx) => { newCode(ctx.s); toast(t('codeResent')); ctx.rerender(); },
  },
});
function verify(ctx) {
  const s = ctx.s;
  if (s.entered.length < 4 || s.verifying) return;
  const expired = (Date.now() - s.sentAt) / 1000 > EXPIRY;
  if (expired || s.entered !== s.code) {
    s.err = true; s.entered = '';
    ctx.rerender();
    if (expired) { const ex = ctx.$('#expiry'); if (ex) ex.textContent = t('codeExpired'); }
    return;
  }
  s.verifying = true;
  completeLogin(ctx.params.method, ctx.params.value);
}

// ------------------------------------------------------------ 04 location
const IN_KSA = ({ lat, lng }) => lat > 16 && lat < 32.6 && lng > 34.4 && lng < 56;

export function setCity(id, after) {
  const c = cityById(id);
  state.loc = { lat: c.lat, lng: c.lng, city: c.id, source: 'city' };
  commit();
  after?.();
}
export function chooseCitySheet(after) {
  const trv = state.mode === 'traveler';
  const order = trv ? ['makkah', 'madinah', 'riyadh', 'jeddah', 'alula', 'dammam'] : CITIES.map(c => c.id);
  openSheet(`<div class="list">${order.map(id => {
      const c = cityById(id);
      const on = state.loc?.city === id && state.loc?.source === 'city';
      return `<button class="li" data-act="pickCity" data-v="${id}"><span class="li-ic">${icon('pin')}</span>
        <span class="grow"><span class="h3" style="font-size:14px">${esc(L(c))}</span><br><span class="xs">${esc(L(c.area))}</span></span>
        ${on ? `<span class="brand-t">${icon('check')}</span>` : `<span class="chev">${icon('chev')}</span>`}</button>`;
    }).join('')}</div>`,
    { pickCity: el => { closeOverlay(); setCity(el.dataset.v, after); } },
    { title: t('chooseCity'), sub: t('chooseCitySub') });
}
export function useGps(after, btn) {
  const fallback = state.mode === 'traveler' ? 'makkah' : 'riyadh';
  const done = (msgKey) => {
    if (btn) { btn.disabled = false; btn.innerHTML = esc(t('allowLoc')); }
    toast(t(msgKey, { c: L(cityById(state.loc.city)) }), 3800);
    after?.();
  };
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="spinner"></span>${esc(t('locating'))}`; }
  if (!('geolocation' in navigator)) { setCity(fallback); return done('locDenied'); }
  let settled = false;
  const timer = setTimeout(() => { if (!settled) { settled = true; setCity(fallback); done('locDenied'); } }, 9000);
  navigator.geolocation.getCurrentPosition(pos => {
    if (settled) return; settled = true; clearTimeout(timer);
    const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    if (IN_KSA(p)) {
      const city = [...CITIES].sort((a, b) => haversine(p, a) - haversine(p, b))[0];
      state.loc = { ...p, city: city.id, source: 'gps' };
      commit();
      if (btn) { btn.disabled = false; }
      toast(t('locFound'));
      after?.();
    } else { setCity(fallback); done('locOutside'); }
  }, () => {
    if (settled) return; settled = true; clearTimeout(timer);
    setCity(fallback); done('locDenied');
  }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 });
}

register('location', {
  render: () => `
    <div class="body" style="justify-content:space-between">
      <div class="scroll" style="padding-bottom:0">
        <div class="appbar" style="padding-top:var(--sp-6)"></div>
        <div class="pad">
          <div style="height:190px;border-radius:var(--r-lg);background:var(--brand-50);border:1px solid var(--brand-100);position:relative;overflow:hidden" aria-hidden="true">
            <div class="road h" style="top:70px;background:#fff;left:-10%;width:120%"></div>
            <div class="road v" style="left:120px;background:#fff;top:-10%;height:120%"></div>
            <div class="you" style="top:92px;left:122px;margin:0"></div>
            <div class="pin" style="top:34px;left:200px;margin:0"><b>+</b></div>
            <div class="pin alt" style="top:110px;left:60px;margin:0"><b>+</b></div>
          </div>
          <h2 class="h-display" style="margin-top:var(--sp-6)">${esc(t('locTitle'))}</h2>
          <p class="body-t" style="margin-top:var(--sp-3)">${esc(t('locBody'))}</p>
          <div class="card" style="margin-top:var(--sp-5);padding:var(--sp-3) var(--sp-4)"><p class="sm">${esc(t('locNote'))}</p></div>
        </div>
      </div>
      <div class="pad stack" style="padding-top:var(--sp-4);padding-bottom:max(var(--sp-8),calc(var(--safe-bottom) + 16px))">
        <button class="btn btn-primary" data-act="allow" id="allowBtn">${esc(t('allowLoc'))}</button>
        <button class="btn btn-ghost" data-act="city">${esc(t('enterCity'))}</button>
      </div>
    </div>`,
  actions: {
    allow: el => useGps(() => reset('map', {}, 'fwd'), el),
    city: () => chooseCitySheet(() => reset('map', {}, 'fwd')),
  },
});

export { toggleLang, back };
