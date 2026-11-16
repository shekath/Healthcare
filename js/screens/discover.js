// Stage 2 — Discover: map home, search, refine, doctor list, facility, doctor profile.
import { state, commit, P, DEFAULT_FILTERS } from '../store.js';
import { t, L, num } from '../i18n.js';
import { icon } from '../icons.js';
import { SPECIALTIES, LANGS, doctorById, facilityById, DOCTORS } from '../data.js';
import {
  here, kmTo, fmtDist, driveMin, areaLabel, facilitiesNear, filterDoctors, activeFilterCount,
  searchAll, doctorsAtFacility, enrichDoctor, openInfo, fmtFee, langsLong, insName, acceptsInsurance,
  fmtNext, upcomingBookings, relDay, fmtTime, isBookable,
} from '../logic.js';
import {
  register, go, reset, back, esc, toast, appbar, tabbar, doctorCard, facilityCard, emptyState, avatar,
  seg, chip, registerGlobal, rerender, stackDepth, miniMap,
} from '../ui.js';

// ============================================================ 05 HOME MAP
const MAP_CHIPS = [['open', 'openNow'], ['er', 'emergency'], ['dental'], ['paeds'], ['cardio'], ['gp'], ['derm'], ['eye']];
const chipLabel = ([k, key]) => key ? t(key) : L(SPECIALTIES[k]);
let bannerDismissed = false;

function project(f, loc) {
  const kx = 111.32 * Math.cos(loc.lat * Math.PI / 180), ky = 110.57;
  return { dx: (f.lng - loc.lng) * kx, dy: (f.lat - loc.lat) * ky };
}

register('map', {
  edge: true,
  render: ctx => {
    const s = ctx.s;
    if (s.chip === undefined) s.chip = 'open';
    const loc = here();
    const list = facilitiesNear(s.chip);
    const nearby = list.filter(f => f.km <= 40);
    const shown = nearby.length ? nearby : list.slice(0, 4);
    const nOpen = nearby.filter(f => f.oi.open).length;
    const trv = state.mode === 'traveler';
    const up = upcomingBookings()[0];
    const pins = list.filter(f => f.km < 80).map(f => {
      const { dx, dy } = project(f, loc);
      const cls = f.id === s.sel ? 'sel' : '';
      const tone = !f.oi.open ? 'muted' : (s.chip === 'er' ? 'er' : (f.kind === 'clinic' ? 'alt' : ''));
      return `<button class="pin ${tone} ${cls}" data-act="pin" data-fid="${f.id}" data-dx="${dx}" data-dy="${dy}" aria-label="${esc(L(f))}"><b>+</b></button>`;
    }).join('');
    const initials = (state.session?.value || 'Q').replace(/[^A-Za-z؀-ۿ]/g, '').slice(0, 1).toUpperCase() || 'Q';
    return `<div class="body">
      <div class="map" id="map">
        <div class="map-layer" id="mapLayer">
          <div class="map-grid"></div>
          <div class="road h" style="top:calc(56% - 7px)"></div>
          <div class="road h thin" style="top:calc(56% - 190px)"></div>
          <div class="road h thin" style="top:calc(56% + 170px)"></div>
          <div class="road v" style="left:calc(50% - 60px)"></div>
          <div class="road v" style="left:calc(50% + 110px)"></div>
          <div class="road v thin" style="left:calc(50% - 230px)"></div>
          <div class="parcel" style="top:calc(56% - 160px);left:calc(50% - 175px);width:100px;height:140px"></div>
          <div class="parcel" style="top:calc(56% - 160px);left:calc(50% - 30px);width:120px;height:140px"></div>
          <div class="parcel" style="top:calc(56% + 20px);left:calc(50% - 175px);width:100px;height:130px"></div>
          <div class="parcel" style="top:calc(56% + 20px);left:calc(50% - 30px);width:120px;height:130px"></div>
          <div class="parcel" style="top:calc(56% + 20px);left:calc(50% + 140px);width:90px;height:130px"></div>
          <div class="parcel" style="top:calc(56% - 160px);left:calc(50% + 140px);width:90px;height:140px"></div>
        </div>
        <div id="pins">${pins}<div class="you" id="you" aria-label="You are here"></div></div>

        <div class="map-search">
          ${icon('search')}
          <button class="q" data-act="tab" data-tab="search">${esc(t('searchPh'))}</button>
          <button class="me" data-go="account" aria-label="${esc(t('account'))}">${esc(initials)}</button>
        </div>
        <div class="chips chips-scroll">${MAP_CHIPS.map(c => chip('chip', c[0], chipLabel(c), s.chip === c[0], c[0] === 'er' ? 'danger' : '')).join('')}</div>
        ${trv && !bannerDismissed ? `<div class="map-banner" role="note">${icon('plane')}<span>${esc(t('visitorBanner'))}</span><button data-act="dismissBanner" aria-label="${esc(t('close'))}">✕</button></div>` : ''}
        <button class="sos" data-act="sos">${icon('phone')}${esc(t('sos'))} · ${num(997)}</button>
        <div class="map-ctrls">
          <button data-act="zoom" data-v="1" aria-label="${esc(t('zoomIn'))}">${icon('plus')}</button>
          <button data-act="zoom" data-v="-1" aria-label="${esc(t('zoomOut'))}">${icon('minus')}</button>
          <button data-act="recenter" aria-label="${esc(t('recenter'))}">${icon('locate')}</button>
        </div>
      </div>

      <div class="sheet ${s.expanded ? 'expanded' : ''}" id="sheet">
        <button class="grab-hit" data-act="toggleSheet" aria-label="${esc(t('list'))}"><span class="grabber" style="margin:0 auto"></span></button>
        <div class="between" style="margin:6px 0 var(--sp-3)">
          <div class="grow">
            <div class="h2">${esc(t('nearbyCare'))}</div>
            <div class="xs">${esc(s.chip === 'open' ? t('nOpenNear', { n: nOpen, a: areaLabel() }) : t('nNear', { n: nearby.length, a: areaLabel() }))}</div>
          </div>
          <button class="btn btn-secondary btn-sm" data-act="toggleSheet">${esc(t(s.expanded ? 'map' : 'list'))}</button>
        </div>
        <div class="sheet-list stack" data-scroll-id="sheet">
          ${up ? `<button class="card tap" style="padding:var(--sp-3);background:var(--brand-50);border-color:var(--brand-100)" data-act="tab" data-tab="saved">
              <div class="row">${icon('calendar')}<div class="grow"><div class="sm strong" style="color:var(--brand-800)">${esc(t('upcomingBanner', { d: `${relDay(up.date)} ${fmtTime(up.time)}` }))}</div>
              <div class="xs" style="color:var(--brand-700)">${esc(L(doctorById(up.doctor).name))}</div></div><span class="sm brand-t strong">${esc(t('view'))}</span></div></button>` : ''}
          ${!nearby.length ? `<p class="xs">${esc(t('noNearby'))}</p>` : ''}
          ${shown.map(f => facilityCard(f, { sel: f.id === s.sel })).join('')}
        </div>
      </div>
      ${tabbar('map')}
    </div>`;
  },
  mount: ctx => {
    const s = ctx.s;
    const map = ctx.$('#map');
    const layer = ctx.$('#mapLayer');
    s.pan ??= { x: 0, y: 0 };
    const pins = [...ctx.$$('.pin')];
    const you = ctx.$('#you');
    if (!s.zoom) {
      // fit the nearest four facilities
      const W = map.clientWidth || 360, H = map.clientHeight || 400;
      const near = pins.map(p => Math.hypot(+p.dataset.dx, +p.dataset.dy)).sort((a, b) => a - b).slice(0, 4);
      const far = Math.max(0.8, near[near.length - 1] || 2);
      s.zoom = Math.min(160, Math.max(4, Math.min(W, H) * 0.28 / far));
    }
    const layout = () => {
      const W = map.clientWidth, H = map.clientHeight;
      const cx = W / 2 + s.pan.x, cy = H * 0.56 + s.pan.y;
      layer.style.transform = `translate(${s.pan.x}px, ${s.pan.y}px)`;
      you.style.left = cx + 'px'; you.style.top = cy + 'px';
      for (const p of pins) {
        const x = cx + (+p.dataset.dx) * s.zoom, y = cy - (+p.dataset.dy) * s.zoom;
        p.style.left = x + 'px'; p.style.top = y + 'px';
        p.hidden = x < -40 || y < -40 || x > W + 40 || y > H + 60;
      }
    };
    layout();
    ctx.s.layout = layout;

    // drag to pan, wheel to zoom
    let start = null, moved = false;
    const down = e => {
      if (e.target.closest('.map-search,.chips,.map-ctrls,.sos,.map-banner')) return;
      start = { x: e.clientX, y: e.clientY, px: s.pan.x, py: s.pan.y, id: e.pointerId }; moved = false;
    };
    const move = e => {
      if (!start) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      if (!moved) { try { map.setPointerCapture(start.id); } catch { /* */ } }
      moved = true; map.classList.add('dragging');
      s.pan = { x: start.px + dx, y: start.py + dy };
      layout();
    };
    const up = () => { start = null; map.classList.remove('dragging'); };
    const clickCap = e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } };
    const wheel = e => { e.preventDefault(); zoomBy(s, e.deltaY < 0 ? 1.2 : 1 / 1.2); layout(); };
    map.addEventListener('pointerdown', down);
    map.addEventListener('pointermove', move);
    map.addEventListener('pointerup', up);
    map.addEventListener('pointercancel', up);
    map.addEventListener('click', clickCap, true);
    map.addEventListener('wheel', wheel, { passive: false });
    const ro = new ResizeObserver(layout); ro.observe(map);
    return () => { ro.disconnect(); };
  },
  actions: {
    chip: (el, ev, ctx) => { ctx.s.chip = ctx.s.chip === el.dataset.v ? null : el.dataset.v; ctx.s.sel = null; ctx.rerender(); },
    pin: (el, ev, ctx) => {
      const id = el.dataset.fid;
      if (ctx.s.sel === id) { go('facility', { id }); return; }
      ctx.s.sel = id;
      ctx.$$('.pin.sel').forEach(p => p.classList.remove('sel'));
      el.classList.add('sel');
      ctx.$$('#sheet .card.sel').forEach(c => c.classList.remove('sel'));
      const card = ctx.$(`#sheet .card[data-fid="${id}"]`);
      if (card) { card.classList.add('sel'); card.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
      else go('facility', { id });
    },
    toggleSheet: (el, ev, ctx) => { ctx.s.expanded = !ctx.s.expanded; ctx.rerender(); },
    zoom: (el, ev, ctx) => { zoomBy(ctx.s, +el.dataset.v > 0 ? 1.5 : 1 / 1.5); ctx.s.layout?.(); },
    recenter: (el, ev, ctx) => { ctx.s.pan = { x: 0, y: 0 }; ctx.s.zoom = null; ctx.rerender(); },
    dismissBanner: (el, ev, ctx) => { bannerDismissed = true; ctx.rerender(); },
  },
});
function zoomBy(s, f) { s.zoom = Math.min(400, Math.max(1.5, s.zoom * f)); s.pan = { x: s.pan.x * f, y: s.pan.y * f }; }

// ============================================================ SEARCH (tab)
function resultsHtml(q) {
  if (!q.trim()) {
    const rec = P().recent;
    return `
      ${rec.length ? `<div class="between"><span class="sec-h">${esc(t('recent'))}</span><button class="linkbtn" data-act="clearRecent">${esc(t('clear'))}</button></div>
        <div class="chips-row">${rec.map(r => `<button class="chip-f" data-act="useRecent" data-v="${esc(r)}">${esc(r)}</button>`).join('')}</div>` : ''}
      <div class="sec-h">${esc(t('specialties'))}</div>
      <div class="spec-grid">${Object.entries(SPECIALTIES).map(([k, sp]) => `
        <button class="spec" data-act="openSpec" data-v="${k}"><span class="ic">${icon(sp.icon)}</span>${esc(L(sp))}</button>`).join('')}
        <button class="spec" data-act="openSpec" data-v=""><span class="ic">${icon('user')}</span>${esc(t('allDoctors'))}</button>
      </div>`;
  }
  const r = searchAll(q);
  if (!r.doctors.length && !r.facilities.length && !r.specs.length) return emptyState('search', t('noResults', { q }), t('noResultsSub'));
  return `
    ${r.specs.length ? `<div class="chips-row">${r.specs.map(k => `<button class="chip-f on" data-act="openSpec" data-v="${k}">${esc(L(SPECIALTIES[k]))} →</button>`).join('')}</div>` : ''}
    ${r.doctors.length ? `<div class="sec-h">${esc(t('doctors'))} · ${num(r.doctors.length)}</div>${r.doctors.slice(0, 8).map(d => doctorCard(d)).join('')}` : ''}
    ${r.facilities.length ? `<div class="sec-h">${esc(t('facilities'))} · ${num(r.facilities.length)}</div>${r.facilities.slice(0, 6).map(f => facilityCard({ ...f, oi: openInfo(f), docs: DOCTORS.filter(d => d.facility === f.id) })).join('')}` : ''}`;
}
function remember(q) {
  q = q.trim(); if (!q) return;
  const p = P(); p.recent = [q, ...p.recent.filter(x => x !== q)].slice(0, 6); commit();
}

register('search', {
  render: ctx => {
    const q = ctx.s.q || '';
    const n = activeFilterCount(state.filters);
    return `<div class="body">
      ${appbar({ back: false, big: true, title: t('searchTitle'), sub: t('searchSub'),
        right: `<button class="btn btn-secondary btn-sm" data-go="filter">${icon('filter')}${esc(t('filter'))}${n ? ` · ${num(n)}` : ''}</button>` })}
      <div class="pad" style="margin-bottom:var(--sp-3)">
        <div class="input">${icon('search')}
          <input id="q" type="search" enterkeyhint="search" autocomplete="off" placeholder="${esc(t('searchInputPh'))}" value="${esc(q)}" data-input="q" data-enter="submitQ" aria-label="${esc(t('search'))}">
          ${q ? `<button class="iconbtn" style="width:30px;height:30px;flex-basis:30px;border:0" data-act="clearQ" aria-label="${esc(t('clear'))}">${icon('close')}</button>` : ''}
        </div>
      </div>
      <div class="scroll pad stack" id="results" data-scroll-id="results">${resultsHtml(q)}</div>
      ${tabbar('search')}
    </div>`;
  },
  mount: ctx => { if (ctx.params.focus) { ctx.params.focus = false; setTimeout(() => ctx.$('#q')?.focus(), 300); } },
  inputs: {
    q: (el, ev, ctx) => {
      const had = !!ctx.s.q;
      ctx.s.q = el.value;
      if (had !== !!el.value) { ctx.rerender(); return; }   // toggles clear button
      ctx.$('#results').innerHTML = resultsHtml(el.value);
      ctx.$('#results').scrollTop = 0;
    },
  },
  actions: {
    submitQ: (el, ev, ctx) => { remember(ctx.s.q || ''); el.blur(); },
    clearQ: (el, ev, ctx) => { ctx.s.q = ''; ctx.rerender(); ctx.$('#q')?.focus(); },
    useRecent: (el, ev, ctx) => { ctx.s.q = el.dataset.v; ctx.rerender(); },
    clearRecent: (el, ev, ctx) => { P().recent = []; commit(); ctx.rerender(); },
  },
});

registerGlobal('openSpec', (el, ev, ctx) => {
  if (ctx?.def === undefined) { /* */ }
  if (ctx && ctx.s && ctx.s.q) remember(ctx.s.q);
  state.filters.spec = el.dataset.v || null;
  commit();
  go('doctors');
});

// ============================================================ 06 REFINE
const DIST = [[2, '2'], [5, '5'], [10, '10'], [25, '25'], [null, 'any']];
register('filter', {
  render: ctx => {
    const s = ctx.s;
    s.d ??= structuredClone(state.filters);
    const d = s.d;
    const count = filterDoctors(d).length;
    const ins = P().insurance;
    const specName = d.spec ? L(SPECIALTIES[d.spec]) : t('allSpecialties');
    const label = count === 0 ? t('showNone') : count === 1 ? t('showOne') : t('showN', { n: count });
    return `<div class="body">
      ${appbar({ title: t('refine'), sub: t('nearYou', { s: specName }) })}
      <div class="scroll pad stack" style="gap:var(--sp-5)" data-scroll-id="filter">
        <div class="field">
          <label class="label" for="spec">${esc(t('specialty'))}</label>
          <div class="input"><select id="spec" data-input="spec">
            <option value="">${esc(t('allSpecialties'))}</option>
            ${Object.entries(SPECIALTIES).map(([k, sp]) => `<option value="${k}" ${d.spec === k ? 'selected' : ''}>${esc(L(sp))}</option>`).join('')}
          </select></div>
        </div>
        <div class="field"><span class="label">${esc(t('distance'))}</span>
          <div class="chips-row">${DIST.map(([v, l]) => chip('fDist', v ?? '', l === 'any' ? t('any') : t('km', { n: +l }), d.maxKm === v)).join('')}</div></div>
        <div class="field"><span class="label">${esc(t('availability'))}</span>
          <div class="chips-row">${[['any', 'any'], ['today', 'today'], ['tomorrow', 'tomorrow'], ['week', 'thisWeek']].map(([v, k]) => chip('fAvail', v, t(k), d.avail === v)).join('')}</div></div>
        <div class="field"><span class="label">${esc(t('speaks'))}</span>
          <div class="chips-row">${Object.keys(LANGS).map(l => chip('fLang', l, L(LANGS[l]), d.langs.includes(l))).join('')}</div></div>
        <div class="field"><span class="label">${esc(t('gender'))}</span>
          ${seg('fGender', [['any', t('any')], ['f', t('female')], ['m', t('male')]], d.gender)}</div>
        <div class="field"><span class="label">${esc(t('visitType'))}</span>
          ${seg('fVisit', [['any', t('any')], ['inperson', t('inPerson')], ['video', t('video')]], d.visit)}</div>
        ${ins ? `<div class="field"><span class="label">${esc(t('insurance'))}</span>
          <div class="chips-row">${chip('fIns', '1', `${t('myInsurance')} · ${insName(ins)}`, d.myIns)}</div></div>` : ''}
      </div>
      <div class="footbar"><div class="row" style="gap:var(--sp-3)">
        <button class="btn btn-ghost" style="flex:0 0 110px" data-act="fReset">${esc(t('reset'))}</button>
        <button class="btn btn-primary grow" data-act="fApply" ${count ? '' : 'aria-disabled="true"'}>${esc(label)}</button>
      </div></div>
    </div>`;
  },
  inputs: { spec: (el, ev, ctx) => { ctx.s.d.spec = el.value || null; ctx.rerender(); } },
  actions: {
    fDist: (el, ev, ctx) => { ctx.s.d.maxKm = el.dataset.v ? +el.dataset.v : null; ctx.rerender(); },
    fAvail: (el, ev, ctx) => { ctx.s.d.avail = el.dataset.v; ctx.rerender(); },
    fLang: (el, ev, ctx) => { const L2 = ctx.s.d.langs, v = el.dataset.v; ctx.s.d.langs = L2.includes(v) ? L2.filter(x => x !== v) : [...L2, v]; ctx.rerender(); },
    fGender: (el, ev, ctx) => { ctx.s.d.gender = el.dataset.v; ctx.rerender(); },
    fVisit: (el, ev, ctx) => { ctx.s.d.visit = el.dataset.v; ctx.rerender(); },
    fIns: (el, ev, ctx) => { ctx.s.d.myIns = !ctx.s.d.myIns; ctx.rerender(); },
    fReset: (el, ev, ctx) => { ctx.s.d = { ...DEFAULT_FILTERS(), spec: ctx.s.d.spec }; ctx.rerender(); },
    fApply: (el, ev, ctx) => {
      state.filters = ctx.s.d; commit();
      if (ctx.params.from === 'doctors') back(); else { back(); go('doctors'); }
    },
  },
});

// ============================================================ 07 DOCTOR LIST
register('doctors', {
  render: () => {
    const f = state.filters;
    const list = filterDoctors(f);
    const n = activeFilterCount(f);
    const title = f.spec ? L(SPECIALTIES[f.spec]) : t('allDoctors');
    const sub = list.length === 1 ? t('oneDocNearest') : t('nDocsNearest', { n: list.length });
    return `<div class="body">
      ${appbar({ title, sub, right: `<button class="btn btn-secondary btn-sm" data-go="filter" data-p='{"from":"doctors"}'>${esc(t('filter'))}${n ? ` · ${num(n)}` : ''}</button>` })}
      ${n ? `<div class="pad between" style="margin:-6px 0 10px"><span class="xs">${esc(summary(f))}</span><button class="linkbtn" data-act="clearFilters">${esc(t('clearFilters'))}</button></div>` : ''}
      <div class="scroll pad stack" data-scroll-id="docs">
        ${list.length ? list.map(d => doctorCard(d)).join('') : emptyState('user', t('noDoctors'), t('noDoctorsSub'), `<button class="btn btn-secondary btn-sm" data-act="clearFilters">${esc(t('clearFilters'))}</button>`)}
      </div>
      ${tabbar('search')}
    </div>`;
  },
  actions: {
    clearFilters: (el, ev, ctx) => { state.filters = { ...DEFAULT_FILTERS(), spec: state.filters.spec }; commit(); ctx.rerender(); },
  },
});
function summary(f) {
  const parts = [];
  if (f.maxKm) parts.push(t('km', { n: f.maxKm }));
  if (f.avail !== 'any') parts.push(t({ today: 'today', tomorrow: 'tomorrow', week: 'thisWeek' }[f.avail]));
  if (f.langs.length) parts.push(f.langs.map(l => L(LANGS[l].short)).join('/'));
  if (f.gender !== 'any') parts.push(t(f.gender === 'f' ? 'female' : 'male'));
  if (f.visit !== 'any') parts.push(t(f.visit === 'video' ? 'video' : 'inPerson'));
  if (f.myIns) parts.push(insName(P().insurance));
  return parts.join(' · ');
}

// ============================================================ FACILITY
register('facility', {
  render: ctx => {
    const f = facilityById(ctx.params.id);
    if (!f) return appbar() + emptyState('building', t('genericErr'), '');
    const km = kmTo(f), oi = openInfo(f);
    const docs = doctorsAtFacility(f.id);
    const ins = P().insurance;
    return `<div class="body">
      ${appbar()}
      <div class="scroll pad stack" style="gap:var(--sp-4)" data-scroll-id="fac">
        <div class="row" style="align-items:flex-start">
          ${avatar(f.short, f.tone, 'lg')}
          <div class="grow">
            <div class="h1">${esc(L(f))}</div>
            <div class="sm" style="margin-top:3px">${esc(L(f.type))}</div>
            <div class="row wrap" style="gap:5px;margin-top:8px">
              <span class="tag ${oi.open ? 'tag-open' : 'tag-closed'}">${esc(t(oi.open ? 'open' : 'closed'))} · ${esc(oi.label)}</span>
              ${f.er ? `<span class="tag tag-danger">${esc(t('emergency'))} · ${esc(t('open24'))}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="card map-card">
          ${miniMap(f, here())}
          <div class="map-card-body">
            <div class="between">
              <div><div class="h3" style="font-size:14px">${esc(L(f.area))}</div><div class="xs ltr-num" style="margin-top:2px">${esc(f.phone)}</div></div>
              <div style="text-align:end"><div class="dist">${esc(fmtDist(km))}</div><div class="xs">${esc(t('minDrive', { n: driveMin(km) }))}</div></div>
            </div>
            <div class="row" style="margin-top:var(--sp-3);gap:var(--sp-2)">
              <button class="btn btn-primary btn-sm grow" data-act="dir" data-fid="${f.id}">${icon('nav')}${esc(t('getDirections'))}</button>
              <button class="btn btn-ghost btn-sm" data-act="tel" data-tel="${f.phone}">${icon('phone')}${esc(t('callFacility'))}</button>
            </div>
          </div>
        </div>
        <div>
          <div class="h2" style="margin-bottom:8px">${esc(t('acceptedIns'))}</div>
          <div class="chips-row">${f.ins.map(k => `<span class="tag ${k === ins ? 'tag-brand' : ''}">${k === ins ? '✓ ' : ''}${esc(insName(k))}</span>`).join('')}</div>
        </div>
        <div class="divider"></div>
        <div class="h2">${esc(t('facilityDoctors'))} · ${num(docs.length)}</div>
        ${docs.map(d => doctorCard(d, { showFacility: false })).join('')}
      </div>
    </div>`;
  },
});

// ============================================================ 08 DOCTOR PROFILE
register('doctor', {
  render: ctx => {
    const base = doctorById(ctx.params.id);
    if (!base) return appbar() + emptyState('user', t('genericErr'), '');
    const d = enrichDoctor(base);
    const fav = P().favourites.includes(d.id);
    const ins = P().insurance;
    const covered = acceptsInsurance(d.f, ins);
    const bookable = isBookable(d);
    return `<div class="body">
      ${appbar({ right: `<button class="iconbtn ${fav ? 'on' : ''}" data-act="fav" data-id="${d.id}" aria-pressed="${fav}" aria-label="${esc(t('saved'))}">${icon(fav ? 'heartFill' : 'heart')}</button>` })}
      <div class="scroll pad stack" style="gap:var(--sp-4)" data-scroll-id="doc">
        <div class="row" style="align-items:flex-start">
          ${avatar(d.initials, d.tone, 'lg')}
          <div class="grow">
            <div class="row" style="gap:6px"><span class="h1">${esc(L(d.name))}</span>${d.verified ? `<span class="verified" title="${esc(t('licensed'))}"></span>` : ''}</div>
            <div class="sm" style="margin-top:3px">${esc(L(d.role))}</div>
            <div class="row wrap" style="gap:5px;margin-top:8px">
              <span class="tag tag-gold">★ ${num(d.rating)} · ${num(d.reviews)}</span>
              <span class="tag">${esc(t('years', { n: d.years }))}</span>
              ${d.video ? `<span class="tag tag-info">${icon('video')}${esc(t('videoVisit'))}</span>` : ''}
            </div>
          </div>
        </div>
<div class="card map-card">
          ${miniMap(d.f, here())}
          <div class="map-card-body">
            <button class="between" style="width:100%;background:none;border:0;text-align:start;padding:0" data-go="facility" data-id="${d.f.id}">
              <div class="grow"><div class="h3" style="font-size:14px">${esc(L(d.f))}</div><div class="xs" style="margin-top:2px">${esc(L(d.f.area))}</div></div>
              <div style="text-align:end"><div class="dist">${esc(fmtDist(d.km))}</div><div class="xs">${esc(t('minDrive', { n: driveMin(d.km) }))}</div></div>
            </button>
            <div class="row" style="gap:var(--sp-2);margin-top:var(--sp-3)">
              <button class="btn btn-primary btn-sm grow" data-act="dir" data-fid="${d.f.id}">${icon('nav')}${esc(t('getDirections'))}</button>
              <button class="btn btn-ghost btn-sm" data-act="tel" data-tel="${d.f.phone}" aria-label="${esc(t('callFacility'))}">${icon('phone')}</button>
            </div>
          </div>
        </div>
        ${ins && bookable ? `<div class="note ${covered ? 'brand' : 'warn'} row" style="gap:8px">${icon(covered ? 'shield' : 'info')}<span>${esc(t(covered ? 'coveredBy' : 'notCovered', { i: insName(ins) }))}</span></div>` : ''}
        ${!bookable ? `<div class="note danger row" style="gap:8px;align-items:flex-start">${icon('siren')}<span>${esc(state.lang === 'ar' ? 'قسم الطوارئ — لا حاجة لموعد. توجّه مباشرة، مفتوح ٢٤ ساعة. في الحالات المهددة للحياة اتصل بـ ٩٩٧.' : 'Emergency department — no appointment needed. Walk in, open 24 hours. For life-threatening cases call 997.')}</span></div>` : ''}
        <div>
          <div class="h2" style="margin-bottom:6px">${esc(t('credentials'))}</div>
          <p class="sm" style="line-height:1.65">${esc(L(d.credentials))}</p>
        </div>
        <div class="divider"></div>
        <div class="kv sm"><span>${esc(t('languages'))}</span><span>${esc(langsLong(d))}</span></div>
        <div class="kv sm"><span>${esc(t('fee'))}</span><span class="ltr-num">${esc(fmtFee(d))}</span></div>
        <div class="kv sm"><span>${esc(t('insurance'))}</span><span>${esc(d.f.ins.map(insName).join(state.lang === 'ar' ? '، ' : ', '))}</span></div>
      </div>
      <div class="footbar">
        ${bookable ? `
          <div class="between" style="margin-bottom:var(--sp-3)">
            <span class="xs">${esc(t('nextAvailable'))}</span>
            <span class="sm" style="font-weight:600;color:var(--content-brand)">${esc(fmtNext(d.next))}</span>
          </div>
          <button class="btn btn-primary" data-go="slots" data-id="${d.id}" ${d.next ? '' : 'aria-disabled="true"'}>${esc(t('bookAppt'))}</button>`
        : `<div class="row" style="gap:var(--sp-3)">
            <button class="btn btn-danger" style="flex:0 0 120px" data-act="tel" data-tel="997">${icon('phone')}${num(997)}</button>
            <button class="btn btn-primary grow" data-act="dir" data-fid="${d.f.id}">${icon('nav')}${esc(t('getDirections'))}</button></div>`}
      </div>
    </div>`;
  },
});

registerGlobal('fav', (el, ev, ctx) => {
  const p = P(), id = el.dataset.id;
  const on = p.favourites.includes(id);
  p.favourites = on ? p.favourites.filter(x => x !== id) : [id, ...p.favourites];
  commit();
  toast(t(on ? 'removedFav' : 'savedToFav'));
  ctx?.rerender();
});
