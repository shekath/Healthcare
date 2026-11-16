// Mini UI framework: stack router, delegated events, overlays, shared components.
import { state, P, commit } from './store.js';
import { t, L, num } from './i18n.js';
import { icon } from './icons.js';
import { SPECIALTIES } from './data.js';
import { fmtDist, fmtNext, langsShort, openInfo, upcomingBookings, downloadFile } from './logic.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ============================================================ router
const screens = {};
const stack = [];          // [{ name, params, s, scroll }]
let current = null;        // { def, entry, root, cleanup }
let guard = false;
const view = () => document.getElementById('view');

export const register = (name, def) => { screens[name] = def; };
export const currentName = () => current?.entry.name;
export const stackDepth = () => stack.length;

function ensureGuard() {
  if (stack.length > 1 && !guard) {
    try { history.pushState({ qrib: 1 }, ''); guard = true; } catch { /* sandboxed */ }
  }
}
window.addEventListener('popstate', () => {
  guard = false;
  if (closeOverlay()) { ensureGuard(); return; }
  if (stack.length > 1) { stack.pop(); show('back'); }
  ensureGuard();
});

export function go(name, params = {}) {
  saveScroll();
  stack.push({ name, params, s: {} });
  show('fwd');
  ensureGuard();
}
export function replace(name, params = {}) {
  stack.pop();
  stack.push({ name, params, s: {} });
  show('fade');
}
export function reset(name, params = {}, anim = 'fade') {
  stack.length = 0;
  stack.push({ name, params, s: {} });
  show(anim);
}
export function back() {
  if (closeOverlay()) return;
  if (stack.length > 1) { stack.pop(); show('back'); }
}

function saveScroll() {
  if (!current) return;
  const sc = {};
  current.root.querySelectorAll('[data-scroll-id]').forEach(el => { sc[el.dataset.scrollId] = el.scrollTop; });
  current.entry.scroll = sc;
}
function restoreScroll(root, entry) {
  if (!entry.scroll) return;
  root.querySelectorAll('[data-scroll-id]').forEach(el => {
    const v = entry.scroll[el.dataset.scrollId];
    if (v) el.scrollTop = v;
  });
}

function makeCtx(entry, def) {
  const ctx = {
    params: entry.params, s: entry.s, def,
    get root() { return current.root; },
    rerender: () => rerender(),
    $: sel => current.root.querySelector(sel),
    $$: sel => current.root.querySelectorAll(sel),
  };
  return ctx;
}

function show(anim) {
  closeOverlay();
  const entry = stack[stack.length - 1];
  const def = screens[entry.name];
  if (!def) { console.error('No screen', entry.name); return; }
  if (current?.cleanup) { try { current.cleanup(); } catch (e) { console.error(e); } }
  const old = current?.root;
  const root = document.createElement('section');
  root.className = 'screen' + (def.edge ? ' edge' : '');
  if (anim === 'fwd') root.classList.add('enter');
  else if (anim === 'back') root.classList.add('enter-back');
  else root.classList.add('enter-fade');
  root.dataset.screen = entry.name;
  const ctx = makeCtx(entry, def);
  current = { def, entry, root, ctx, cleanup: null };
  try { root.innerHTML = def.render(ctx); }
  catch (e) { console.error(e); root.innerHTML = `<div class="empty"><h3>${esc(t('genericErr'))}</h3></div>`; }
  view().appendChild(root);
  if (old) old.remove();
  restoreScroll(root, entry);
  setStatusbar(def);
  if (def.mount) { try { current.cleanup = def.mount(ctx) || null; } catch (e) { console.error(e); } }
  root.addEventListener('animationend', () => root.classList.remove('enter', 'enter-back', 'enter-fade'), { once: true });
}

export function rerender() {
  if (!current) return;
  const { def, entry, root, ctx } = current;
  saveScroll();
  const active = document.activeElement;
  const focusId = active && root.contains(active) ? active.id : null;
  const caret = focusId && active.selectionStart != null ? [active.selectionStart, active.selectionEnd] : null;
  if (current.cleanup) { try { current.cleanup(); } catch (e) { console.error(e); } }
  root.innerHTML = def.render(ctx);
  restoreScroll(root, entry);
  setStatusbar(def);
  if (def.mount) { try { current.cleanup = def.mount(ctx) || null; } catch (e) { console.error(e); } }
  if (focusId) {
    const el = root.querySelector('#' + CSS.escape(focusId));
    if (el) { el.focus({ preventScroll: true }); if (caret) try { el.setSelectionRange(...caret); } catch { /* */ } }
  }
}

function setStatusbar(def) {
  const sb = document.getElementById('statusbar');
  if (sb) sb.classList.toggle('on-brand', !!def.onBrand);
}

// ============================================================ events
const globalActions = {};
export const registerGlobal = (name, fn) => { globalActions[name] = fn; };

function dispatch(name, el, ev) {
  const fromOverlay = el.closest('.overlay');
  if (fromOverlay && overlayActions?.[name]) return overlayActions[name](el, ev);
  const def = current?.def;
  if (!fromOverlay && def?.actions?.[name]) return def.actions[name](el, ev, current.ctx);
  if (globalActions[name]) return globalActions[name](el, ev, current?.ctx);
  if (def?.actions?.[name]) return def.actions[name](el, ev, current.ctx);
  console.warn('Unhandled action', name);
}

export function bindEvents(host) {
  host.addEventListener('click', ev => {
    const el = ev.target.closest('[data-act],[data-go]');
    if (!el || !host.contains(el)) {
      // tap on overlay backdrop closes it
      if (ev.target.classList?.contains('overlay') && !ev.target.dataset.sticky) closeOverlay();
      return;
    }
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    if (el.dataset.go) {
      ev.preventDefault();
      const params = el.dataset.p ? JSON.parse(el.dataset.p) : (el.dataset.id ? { id: el.dataset.id } : {});
      closeOverlay();
      go(el.dataset.go, params);
      return;
    }
    ev.preventDefault();
    dispatch(el.dataset.act, el, ev);
  });
  host.addEventListener('input', ev => {
    const el = ev.target;
    const name = el.dataset.input;
    if (!name) return;
    const def = current?.def;
    if (el.closest('.overlay') && overlayActions?.[name]) return overlayActions[name](el, ev);
    if (def?.inputs?.[name]) def.inputs[name](el, ev, current.ctx);
  });
  host.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') { if (closeOverlay()) ev.preventDefault(); return; }
    const el = ev.target;
    if ((ev.key === 'Enter' || ev.key === ' ') && el.getAttribute('role') === 'link' && el.dataset.go) {
      ev.preventDefault(); el.click(); return;
    }
    if (ev.key === 'Enter' && el.dataset.enter) {
      ev.preventDefault();
      dispatch(el.dataset.enter, el, ev);
    }
  });
  host.addEventListener('submit', ev => ev.preventDefault());
}

// ============================================================ overlays
let overlayEl = null, overlayActions = null, overlayResolve = null;

export function closeOverlay(result) {
  if (!overlayEl) return false;
  overlayEl.remove();
  overlayEl = null; overlayActions = null;
  if (overlayResolve) { const r = overlayResolve; overlayResolve = null; r(result); }
  return true;
}

/** Bottom sheet modal. actions: { name(el, ev) } handled while open. */
export function openSheet(html, actions = {}, { title, sub } = {}) {
  closeOverlay();
  const host = document.querySelector('.device');
  overlayEl = document.createElement('div');
  overlayEl.className = 'overlay';
  overlayEl.setAttribute('role', 'dialog');
  overlayEl.setAttribute('aria-modal', 'true');
  overlayEl.innerHTML = `<div class="modal">
    <div class="mhead"><div class="grabber"></div>
      ${title ? `<div class="between" style="align-items:flex-start"><div><div class="h2">${esc(title)}</div>${sub ? `<div class="xs" style="margin-top:2px">${esc(sub)}</div>` : ''}</div>
      <button class="iconbtn" data-act="closeOverlay" aria-label="${esc(t('close'))}">${icon('close')}</button></div>` : ''}
    </div>
    <div class="mbody">${html}</div></div>`;
  overlayActions = { closeOverlay: () => closeOverlay(), ...actions };
  host.appendChild(overlayEl);
  ensureOverlayGuard();
  setTimeout(() => overlayEl?.querySelector('button,input,[tabindex]')?.focus({ preventScroll: true }), 50);
  return new Promise(res => { overlayResolve = res; });
}

export function confirmDialog({ title, body, ok, cancel, danger }) {
  closeOverlay();
  const host = document.querySelector('.device');
  overlayEl = document.createElement('div');
  overlayEl.className = 'overlay center';
  overlayEl.setAttribute('role', 'alertdialog');
  overlayEl.innerHTML = `<div class="dialog">
    <div class="h2">${esc(title)}</div>
    ${body ? `<p class="body-t" style="margin-top:8px">${esc(body)}</p>` : ''}
    <div class="stack" style="margin-top:20px">
      <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="dlgOk">${esc(ok)}</button>
      <button class="btn btn-ghost" data-act="dlgCancel">${esc(cancel || t('cancel'))}</button>
    </div></div>`;
  return new Promise(res => {
    overlayResolve = res;
    overlayActions = { dlgOk: () => closeOverlay(true), dlgCancel: () => closeOverlay(false) };
    host.appendChild(overlayEl);
    ensureOverlayGuard();
    setTimeout(() => overlayEl?.querySelector('[data-act="dlgOk"]')?.focus(), 50);
  });
}
function ensureOverlayGuard() {
  if (!guard) { try { history.pushState({ qrib: 1 }, ''); guard = true; } catch { /* */ } }
}

export function toast(msg, ms = 2800) {
  const host = document.getElementById('toasts');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = msg;
  host.appendChild(el);
  while (host.children.length > 2) host.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, ms);
}

// ============================================================ components
export function appbar({ back = true, title = '', sub = '', right = '', big = false } = {}) {
  return `<div class="appbar" ${big ? 'style="padding-top:var(--sp-4)"' : ''}>
    ${back ? `<button class="iconbtn back-arrow" data-act="back" aria-label="${esc(t('back'))}"></button>` : ''}
    <div class="grow">${title ? `<h2>${esc(title)}</h2>` : ''}${sub ? `<div class="sub">${esc(sub)}</div>` : ''}</div>
    ${right}
  </div>`;
}

const TABS = [
  ['map', 'map', 'map'],
  ['search', 'search', 'search'],
  ['saved', 'heart', 'saved'],
  ['reports', 'file', 'reports'],
];
export function tabbar(active) {
  const badge = upcomingBookings().length;
  return `<nav class="tabbar" role="tablist">${TABS.map(([id, ic, key]) => `
    <button class="tab ${active === id ? 'on' : ''}" role="tab" aria-selected="${active === id}" data-act="tab" data-tab="${id}">
      <span class="tab-ic">${icon(ic)}${id === 'saved' && badge ? `<span class="badge">${num(badge)}</span>` : ''}</span>
      <b>${esc(t(key))}</b></button>`).join('')}</nav>`;
}

export const avatar = (initials, tone = '', size = '') => `<div class="avatar ${tone} ${size}" aria-hidden="true">${esc(initials)}</div>`;

export function modeBadge() {
  const trv = state.mode === 'traveler';
  return `<span class="mode-badge">${icon(trv ? 'plane' : 'home')}${esc(t(trv ? 'travelerMode' : 'residentMode'))}</span>`;
}

export function doctorCard(d, { showFacility = true, extra = '' } = {}) {
  const sp = SPECIALTIES[d.spec];
  const nextTag = d.spec === 'emerg'
    ? `<span class="tag tag-danger">${esc(t('open24'))}</span>`
    : (d.next ? `<span class="tag tag-brand">${esc(fmtNext(d.next))}</span>` : `<span class="tag">${esc(t('noSlots'))}</span>`);
  return `<button class="card tap" data-go="doctor" data-id="${d.id}" ${d.next || d.spec === 'emerg' ? '' : 'style="opacity:.6"'}>
    <div class="row" style="align-items:flex-start">
      ${avatar(d.initials, d.tone)}
      <div class="grow">
        <div class="between">
          <div class="row grow" style="gap:5px"><span class="h3 ellipsis">${esc(L(d.name))}</span>${d.verified ? `<span class="verified" title="${esc(t('licensed'))}"></span>` : ''}</div>
          <span class="dist">${esc(fmtDist(d.km))}</span>
        </div>
        <div class="xs" style="margin-top:2px">${esc(L(d.role))} · ${esc(t('yrs', { n: d.years }))}</div>
        ${showFacility ? `<div class="xs ellipsis">${esc(L(d.f))}</div>` : ''}
        <div class="row wrap" style="gap:5px;margin-top:8px">
          ${nextTag}
          ${d.video ? `<span class="tag tag-info">${esc(t('videoVisit'))}</span>` : ''}
          <span class="tag">${esc(langsShort(d))}</span>
          <span class="tag tag-gold">★ ${num(d.rating)}</span>
          ${extra}
        </div>
      </div>
    </div>
  </button>`;
}

export function facilityCard(f, { sel = false } = {}) {
  const oi = f.oi || openInfo(f);
  const n = f.docs ? f.docs.length : 0;
  return `<div class="card tap fcard ${sel ? 'sel' : ''}" role="link" tabindex="0" data-go="facility" data-id="${f.id}" data-fid="${f.id}" aria-label="${esc(L(f))}">
    <div class="row" style="align-items:flex-start">
      ${avatar(f.short, f.tone)}
      <div class="grow">
        <div class="h3 ellipsis">${esc(L(f))}</div>
        <div class="xs ellipsis" style="margin-top:2px">${esc(L(f.type))} · ${esc(oi.label)}</div>
        <div class="row wrap" style="gap:5px;margin-top:7px">
          <span class="tag ${oi.open ? 'tag-open' : 'tag-closed'}">${esc(t(oi.open ? 'open' : 'closed'))}</span>
          ${f.er ? `<span class="tag tag-danger">${esc(t('emergency'))}</span>` : ''}
          ${n ? `<span class="tag">${esc(n === 1 ? t('oneDoctor') : t('nDoctors', { n }))}</span>` : ''}
        </div>
      </div>
      <div class="fcard-side">
        <span class="dist">${esc(fmtDist(f.km))}</span>
        <button class="dir-btn" data-act="dir" data-fid="${f.id}" aria-label="${esc(t('getDirections'))}: ${esc(L(f))}" title="${esc(t('getDirections'))}">${icon('nav')}</button>
      </div>
    </div>
  </div>`;
}

/** Static mini-map centred on a facility, with "you" when close enough. Tapping opens directions. */
export function miniMap(f, here) {
  const kx = 111.32 * Math.cos(here.lat * Math.PI / 180), ky = 110.57;
  const dx = (here.lng - f.lng) * kx, dy = (here.lat - f.lat) * ky;   // user relative to facility, km
  const km = Math.hypot(dx, dy);
  const scale = Math.min(70, Math.max(18, 110 / Math.max(km, 0.2)));
  const ux = dx * scale, uy = -dy * scale;
  const showYou = Math.abs(ux) < 165 && Math.abs(uy) < 62;
  return `<button class="minimap" data-act="dir" data-fid="${f.id}" aria-label="${esc(t('getDirections'))}: ${esc(L(f))}">
    <span class="map-grid"></span>
    <span class="road h" style="top:calc(58% - 7px)"></span>
    <span class="road v" style="left:calc(50% + 46px)"></span>
    <span class="road v thin" style="left:calc(50% - 120px)"></span>
    <span class="road h thin" style="top:18%"></span>
    <span class="parcel" style="top:24%;left:calc(50% - 100px);width:90px;height:30%"></span>
    <span class="parcel" style="top:24%;left:calc(50% + 70px);width:80px;height:30%"></span>
    <span class="parcel" style="top:68%;left:calc(50% - 30px);width:66px;height:26%"></span>
    ${showYou ? `<span class="you" style="left:calc(50% + ${ux.toFixed(1)}px);top:calc(58% + ${uy.toFixed(1)}px)"></span>` : ''}
    <span class="pin" style="left:50%;top:58%"><b>+</b></span>
    <span class="map-chip">${icon('pin')}${esc(L(f.area))}</span>
    <span class="map-chip end">${icon('nav')}${esc(t('openMaps'))}</span>
  </button>`;
}

export function emptyState(ic, title, sub, cta = '') {
  return `<div class="empty"><div class="ic">${icon(ic)}</div><h3>${esc(title)}</h3><p class="sm">${esc(sub)}</p>${cta ? `<div style="margin-top:18px;display:flex;justify-content:center">${cta}</div>` : ''}</div>`;
}

export function seg(name, options, value, extra = '') {
  return `<div class="seg" role="radiogroup" ${extra}>${options.map(([v, label]) =>
    `<button role="radio" aria-checked="${v === value}" class="${v === value ? 'on' : ''}" data-act="${name}" data-v="${v}">${esc(label)}</button>`).join('')}</div>`;
}

export function chip(act, v, label, on, cls = '') {
  return `<button class="chip-f ${on ? 'on' : ''} ${cls}" aria-pressed="${!!on}" data-act="${act}" data-v="${v}">${esc(label)}</button>`;
}

/** Download a file; where downloads are blocked, offer the content to copy instead. */
export function saveFile(name, mime, content, okMsg) {
  if (downloadFile(name, mime, content)) { toast(okMsg); return; }
  openSheet(`<p class="sm" style="margin-bottom:10px">${esc(t('copyInstead'))}</p>
    <textarea id="fileText" readonly style="width:100%;height:220px;border:1px solid var(--border-strong);border-radius:10px;padding:10px;font:12px/1.5 ui-monospace,Menlo,monospace;direction:ltr;resize:none">${esc(content)}</textarea>
    <button class="btn btn-primary" style="margin-top:12px" data-act="copyFile">${esc(t('copy'))}</button>`,
  {
    copyFile: async () => {
      const ta = document.getElementById('fileText');
      try { await navigator.clipboard.writeText(content); toast(t('copied')); }
      catch { ta.focus(); ta.select(); }
    },
  }, { title: name });
}

export { commit };
