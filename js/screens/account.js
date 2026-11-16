// Account & settings, plus the emergency sheet (global).
import { state, commit, P, resetAll } from '../store.js';
import { t, L, num } from '../i18n.js';
import { icon } from '../icons.js';
import { cityById, RESIDENT_INSURERS, TRAVELER_INSURERS } from '../data.js';
import { nearestEr, fmtDist, directionsUrl, openExternal, insName } from '../logic.js';
import { register, reset, esc, toast, appbar, seg, openSheet, closeOverlay, confirmDialog, registerGlobal, modeBadge } from '../ui.js';
import { setLang, setMode } from '../shell.js';
import { chooseCitySheet, useGps } from './auth.js';

const li = (act, ic, label, value = '', danger = false, extra = '') =>
  `<button class="li" data-act="${act}" ${extra}><span class="li-ic ${danger ? 'danger' : ''}">${icon(ic)}</span>
    <span class="grow" style="${danger ? 'color:var(--danger-600);font-weight:600' : ''}">${esc(label)}</span>
    ${value ? `<span class="xs" style="max-width:45%;text-align:end">${esc(value)}</span>` : ''}
    <span class="chev">${icon('chev')}</span></button>`;

register('account', {
  render: () => {
    const trv = state.mode === 'traveler';
    const loc = state.loc;
    const locLabel = loc ? (loc.source === 'gps' ? `GPS · ${L(cityById(loc.city))}` : L(cityById(loc.city))) : '—';
    const v = state.session?.value || '';
    const init = (v.replace(/[^A-Za-z؀-ۿ]/g, '').slice(0, 1) || 'Q').toUpperCase();
    return `<div class="body">
      ${appbar({ title: t('account') })}
      <div class="scroll pad stack" style="gap:var(--sp-4)">
        <div class="card row">
          <div class="avatar lg">${esc(init)}</div>
          <div class="grow">
            <div class="h2 ellipsis ltr-num" style="max-width:100%">${esc(v || t('profile'))}</div>
            <div class="xs" style="margin:3px 0 8px">${esc(t('signedInAs', { v: state.session?.method === 'email' ? t('email') : state.session?.method === 'phone' ? t('phone') : (state.session?.method || '').replace(/^./, c => c.toUpperCase()) }))}</div>
            ${modeBadge()}
          </div>
        </div>

        <div class="field"><span class="label">${esc(t('profileType'))}</span>
          ${seg('setMode', [['resident', t('resident')], ['traveler', t('traveler')]], trv ? 'traveler' : 'resident')}</div>
        <div class="field"><span class="label">${esc(t('language'))}</span>
          ${seg('setLang', [['en', 'English'], ['ar', 'العربية']], state.lang)}</div>

        <div class="sec-h">${esc(t('profile'))}</div>
        <div class="list">
          ${li('pickIns', 'card', t('myInsuranceL'), insName(P().insurance))}
          ${li('changeCity', 'pin', t('changeCity'), locLabel)}
          ${li('gps', 'locate', t('useGps'))}
        </div>

        <div class="sec-h">${esc(t('about'))}</div>
        <div class="list">
          ${li('sos', 'phone', t('emergencyNumbers'), num('997 · 911'))}
          ${li('privacy', 'lock', t('privacy'))}
          ${li('resetDemo', 'refresh', t('resetDemo'))}
          ${li('signOut', 'logout', t('signOut'), '', true)}
        </div>
        <p class="xs" style="text-align:center;margin-top:4px">${esc(t('version'))}</p>
      </div>
    </div>`;
  },
  actions: {
    setMode: (el) => {
      if (el.dataset.v === state.mode) return;
      setMode(el.dataset.v);
      toast(t('switchedTo', { m: t(el.dataset.v === 'traveler' ? 'travelerMode' : 'residentMode') }));
    },
    setLang: el => setLang(el.dataset.v),
    pickIns: (el, ev, ctx) => {
      const list = [...(state.mode === 'traveler' ? TRAVELER_INSURERS : RESIDENT_INSURERS), null];
      const cur = P().insurance;
      openSheet(`<div class="list">${list.map(k => `<button class="li" data-act="ins" data-v="${k ?? ''}">
          <span class="li-ic">${icon(k ? 'shield' : 'card')}</span><span class="grow">${esc(insName(k))}</span>
          ${k === cur ? `<span class="brand-t">${icon('check')}</span>` : ''}</button>`).join('')}</div>`,
        { ins: b => { P().insurance = b.dataset.v || null; commit(); closeOverlay(); ctx.rerender(); } },
        { title: t('myInsuranceL') });
    },
    changeCity: (el, ev, ctx) => chooseCitySheet(() => ctx.rerender()),
    gps: (el, ev, ctx) => useGps(() => ctx.rerender()),
    privacy: () => openSheet(`<p class="body-t">${esc(t('privacyBody'))}</p>`, {}, { title: t('privacy') }),
    signOut: async () => {
      if (!await confirmDialog({ title: t('signOutQ'), body: t('signOutBody'), ok: t('signOut'), danger: true })) return;
      state.session = null; commit();
      reset('signin');
    },
    resetDemo: async () => {
      if (!await confirmDialog({ title: t('resetQ'), body: t('resetBody'), ok: t('resetDemo'), danger: true })) return;
      resetAll(); commit();
      document.documentElement.dataset.theme = 'resident';
      location.reload();
    },
  },
});

// ------------------------------------------------------------ emergency sheet
export function openEmergency() {
  const er = nearestEr();
  const trv = state.mode === 'traveler';
  const row = (n, label) => `<div class="call-row"><span class="call-num ltr-num">${num(n)}</span><span class="grow sm strong">${esc(label)}</span>
    <button class="btn btn-danger btn-sm" data-act="tel" data-tel="${n}">${icon('phone')}${esc(t('call'))}</button></div>`;
  openSheet(`
    <div class="note danger" style="margin-bottom:8px">${esc(t('emergencySub'))}</div>
    ${row('997', t('redCrescent'))}
    ${row('911', t('unified'))}
    ${row('937', t('mohLine'))}
    ${trv ? row('930', t('tourismLine')) : row('999', t('police'))}
    ${er ? `<div class="sec-h" style="margin-top:14px">${esc(t('nearestEr'))}</div>
      <div class="card" style="margin-top:8px;padding:var(--sp-3)">
        <div class="between"><div class="grow"><div class="h3 ellipsis">${esc(L(er))}</div><div class="xs">${esc(L(er.area))} · ${esc(t('open24'))}</div></div><span class="dist">${esc(fmtDist(er.km))}</span></div>
        <div class="row" style="gap:8px;margin-top:10px">
          <button class="btn btn-primary btn-sm grow" data-act="erDir" data-fid="${er.id}">${icon('nav')}${esc(t('getDirections'))}</button>
          <button class="btn btn-ghost btn-sm" data-act="tel" data-tel="${er.phone}">${icon('phone')}</button>
        </div>
      </div>` : ''}`,
  {
    tel: el => { location.href = `tel:${el.dataset.tel}`; },
    erDir: () => openExternal(directionsUrl(er)),
  }, { title: t('emergencyTitle') });
}
registerGlobal('sos', () => openEmergency());
