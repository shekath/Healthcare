// Demo use-case chooser + doctor dashboard (schedule, patients, availability, profile).
// The chooser is a demo device only; it is not part of the patient app.
import { state, commit } from '../store.js';
import { t, L, num } from '../i18n.js';
import { icon } from '../icons.js';
import { DOCTORS, SLOT_TIMES, SPECIALTIES, doctorById, facilityById } from '../data.js';
import { isoDate, parseIso, fmtTime, fmtDate, fmtDateShort, dayAbbr, relDay, isAccepting, isBookable, toMin, nowMin } from '../logic.js';
import { register, reset, esc, toast, appbar, avatar, seg, openSheet, closeOverlay, confirmDialog, emptyState, chip } from '../ui.js';
import { applyTheme, setLang } from '../shell.js';
import { actingDoctor, dayPlan, scheduleDays, patientList, setAccepting, addBlock, removeBlock, activeBlocks, markSlot } from '../clinic.js';

// ============================================================ DEMO CHOOSER
export function switchUseCase() {
  state.demoRole = null;
  commit();
  applyTheme();
  reset('demo');
}

register('demo', {
  render: () => `<div class="body">
    <div class="scroll pad stack" style="gap:var(--sp-5);padding-top:var(--sp-6)">
      <div class="between">
        <span class="demo-tag">${icon('info')}${esc(t('demoOnly'))}</span>
        <button class="btn btn-ghost btn-sm" data-act="toggleLang">${esc(t('langToggle'))}</button>
      </div>
      <div>
        <div class="wordmark demo-wordmark" aria-label="QRIB">QR<i>Ī</i>B</div>
        <h2 class="h-display" style="margin-top:var(--sp-3)">${esc(t('demoTitle'))}</h2>
        <p class="body-t" style="margin-top:6px">${esc(t('demoSub'))}</p>
      </div>
      <button class="usecase uc-patient" data-act="pickRole" data-v="patient">
        <span class="uc-ic">${icon('user')}</span>
        <span class="grow"><span class="h3">${esc(t('ucPatient'))}</span><span class="sm">${esc(t('ucPatientSub'))}</span>
          <span class="uc-pts">${t('ucPatientPts').map(p => `<i>${esc(p)}</i>`).join('')}</span></span>
        <span class="chev">${icon('chev')}</span>
      </button>
      <button class="usecase uc-doctor" data-act="pickRole" data-v="doctor">
        <span class="uc-ic">${icon('stethoscope')}</span>
        <span class="grow"><span class="h3">${esc(t('ucDoctor'))}</span><span class="sm">${esc(t('ucDoctorSub'))}</span>
          <span class="uc-pts">${t('ucDoctorPts').map(p => `<i>${esc(p)}</i>`).join('')}</span></span>
        <span class="chev">${icon('chev')}</span>
      </button>
      <p class="xs" style="text-align:center;line-height:1.6">${esc(t('demoFoot'))}</p>
    </div>
  </div>`,
  actions: {
    pickRole: el => {
      state.demoRole = el.dataset.v;
      commit();
      applyTheme();
      if (state.demoRole === 'doctor') reset('docHome', {}, 'fwd');
      else if (state.session && state.mode) reset(state.loc ? 'map' : 'location', {}, 'fwd');
      else reset('splash', {}, 'fwd');
    },
  },
});

// ============================================================ shared bits
const DTABS = [['docHome', 'calendar', 'drSchedule'], ['docPatients', 'user', 'drPatients'], ['docAvail', 'clock', 'drAvailability'], ['docProfile', 'stethoscope', 'drProfile']];
function docTabbar(active) {
  return `<nav class="tabbar" role="tablist">${DTABS.map(([id, ic, key]) => `
    <button class="tab ${active === id ? 'on' : ''}" role="tab" aria-selected="${active === id}" data-act="tab" data-tab="${id}">
      <span class="tab-ic">${icon(ic)}</span><b>${esc(t(key))}</b></button>`).join('')}</nav>`;
}
const nextSlotEnd = time => {
  const all = [...SLOT_TIMES.morning, ...SLOT_TIMES.afternoon];
  const i = all.indexOf(time);
  return i >= 0 && i < all.length - 1 ? all[i + 1] : '19:00';
};
const genderAge = p => [p.gender === 'f' ? t('female') : p.gender === 'm' ? t('male') : '', p.age ? t('ageY', { n: p.age }) : ''].filter(Boolean).join(' · ');
const initialsOf = n => n.replace(/^(Dr\.|د\.)\s*/, '').split(/\s+/).filter(w => !/^(Al|ال)$/.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const STATUS = {
  booked: ['tag-brand', 'drBooked'], due: ['tag-warn', 'drDue'], done: ['', 'drDone'], noshow: ['tag-danger', 'drNoShow'],
};

function patientTags(slot, info) {
  const p = slot.patient;
  return `${info ? (info.repeat ? `<span class="tag tag-gold">${esc(t('drRepeatN', { n: info.total }))}</span>` : `<span class="tag tag-info">${esc(t('drNew'))}</span>`) : ''}
    ${p.visitor ? `<span class="tag tag-warn">${icon('plane')}${esc(t('drVisitor'))}</span>` : ''}
    ${slot.visit === 'video' ? `<span class="tag tag-info">${icon('video')}${esc(t('video'))}</span>` : ''}
    ${p.real ? `<span class="tag tag-brand">${icon('check')}${esc(t('drViaApp'))}</span>` : ''}`;
}

// ============================================================ appointment sheet
function apptSheet(slot, iso, ctx) {
  const p = slot.patient;
  const info = patientList(state.actingDoctor).find(x => x.key === p.key);
  const st = STATUS[slot.status] || STATUS.booked;
  const open = slot.status === 'booked' || slot.status === 'due';
  openSheet(`
    <div class="row" style="align-items:flex-start">
      ${avatar(initialsOf(L(p.name)), p.visitor ? 'gold' : (p.real ? '' : 'info'), 'lg')}
      <div class="grow">
        <div class="h2">${esc(L(p.name))}</div>
        <div class="sm" style="margin-top:2px">${esc(genderAge(p))}</div>
        <div class="row wrap" style="gap:5px;margin-top:8px"><span class="tag ${st[0]}">${esc(t(st[1]))}</span>${patientTags(slot, info)}</div>
      </div>
    </div>
    <div class="card stack" style="gap:10px;margin-top:var(--sp-4)">
      <div class="kv sm"><span>${esc(t('when'))}</span><span>${esc(fmtDateShort(iso))} · ${esc(fmtTime(slot.time))}</span></div>
      <div class="kv sm"><span>${esc(t('visitType'))}</span><span>${esc(t(slot.visit === 'video' ? 'videoVisit' : 'inPerson'))}</span></div>
      ${slot.reason ? `<div class="kv sm"><span>${esc(t('drReason'))}</span><span>${esc(L(slot.reason))}</span></div>` : ''}
      ${p.phone ? `<div class="kv sm"><span>${esc(t('phone'))}</span><span class="ltr-num">${esc(p.phone)}</span></div>` : ''}
      ${slot.booking ? `<div class="kv sm"><span>${esc(t('reference'))}</span><span class="ltr-num">${esc(slot.booking.ref)}</span></div>` : ''}
      ${info ? `<div class="kv sm"><span>${esc(t('drVisits'))}</span><span>${esc(t('drVisitsSummary', { n: info.visits.length, u: info.upcoming.length }))}</span></div>` : ''}
    </div>
    ${open && slot.booking ? `<div class="field" style="margin-top:var(--sp-4)"><label class="label" for="drNote">${esc(t('drNote'))}</label>
      <textarea id="drNote" class="textarea" rows="3" placeholder="${esc(t('drNotePh'))}"></textarea></div>` : ''}
    <div class="stack" style="margin-top:var(--sp-4)">
      ${open ? `<div class="cta-bar">
          <button class="cta-icon" data-act="apNoShow" aria-label="${esc(t('drNoShow'))}">${icon('close')}<span>${esc(t('drNoShow'))}</span></button>
          ${p.phone ? `<button class="cta-icon" data-act="apCall" aria-label="${esc(t('call'))}">${icon('phone')}<span>${esc(t('call'))}</span></button>` : ''}
          <button class="btn btn-primary btn-lg grow" data-act="apDone">${icon('check')}${esc(t('drMarkDone'))}</button>
        </div>
        ${slot.booking ? `<button class="btn btn-danger-ghost" data-act="apCancel">${esc(t('drCancelAppt'))}</button>` : ''}`
      : (!slot.booking ? `<button class="btn btn-ghost" data-act="apUndo">${esc(t('drUndo'))}</button>` : '')}
    </div>`, {
    apDone: () => { markSlot(slot, 'done', document.getElementById('drNote')?.value); closeOverlay(); toast(t('drMarkedDone')); ctx.rerender(); },
    apNoShow: () => { markSlot(slot, 'noshow'); closeOverlay(); toast(t('drMarkedNoShow')); ctx.rerender(); },
    apUndo: () => { markSlot(slot, 'booked'); closeOverlay(); ctx.rerender(); },
    apCall: () => { location.href = `tel:${p.phone.replace(/\s/g, '')}`; },
    apCancel: async () => {
      const ok = await confirmDialog({ title: t('drCancelQ'), body: t('drCancelBody', { n: L(p.name) }), ok: t('drCancelAppt'), cancel: t('keep'), danger: true });
      if (!ok) return;
      markSlot(slot, 'cancel'); toast(t('drCancelled')); ctx.rerender();
    },
  }, { title: t('drAppointment') });
}

function freeSlotSheet(slot, iso, ctx) {
  const end = nextSlotEnd(slot.time);
  openSheet(`<p class="body-t">${esc(t('drFreeSlotBody', { d: fmtDateShort(iso), t: fmtTime(slot.time) }))}</p>
    <div class="stack" style="margin-top:var(--sp-4)">
      <button class="btn btn-primary btn-lg" data-act="blkOne">${icon('lock')}${esc(t('drBlockSlot'))}</button>
      <button class="btn btn-ghost" data-act="blkDay">${esc(t('drBlockDay'))}</button>
    </div>`, {
    blkOne: () => { addBlock(state.actingDoctor, { from: iso, to: iso, allDay: false, start: slot.time, end, reason: '' }); closeOverlay(); toast(t('drBlockedToast')); ctx.rerender(); },
    blkDay: () => { addBlock(state.actingDoctor, { from: iso, to: iso, allDay: true, reason: '' }); closeOverlay(); toast(t('drBlockedToast')); ctx.rerender(); },
  }, { title: t('drAvailableSlot') });
}

// ============================================================ SCHEDULE
register('docHome', {
  render: ctx => {
    const doc = actingDoctor(), s = ctx.s;
    const today = isoDate(new Date());
    const days = scheduleDays(doc.id, today, 6);
    s.day ??= days[0];
    if (s.showFree === undefined) s.showFree = true;
    const plan = dayPlan(doc.id, s.day);
    const pts = plan.filter(x => x.kind === 'patient' && x.status !== 'noshow');
    const list = patientList(doc.id);
    const byKey = new Map(list.map(x => [x.key, x]));
    const repeatToday = pts.filter(x => byKey.get(x.patient.key)?.repeat).length;
    const nowM = nowMin();
    const next = s.day === today ? pts.find(x => x.status === 'booked' && toMin(x.time) >= nowM) : pts.find(x => x.status === 'booked');
    const accepting = isAccepting(doc.id);
    const first = L(doc.name).split(' ').slice(0, 2).join(' ');
    const row = slot => {
      if (slot.kind === 'patient') {
        const info = byKey.get(slot.patient.key), st = STATUS[slot.status] || STATUS.booked;
        return `<button class="sched-row" data-act="openSlot" data-time="${slot.time}">
          <span class="sched-time">${esc(fmtTime(slot.time))}</span>
          <span class="sched-card ${slot.patient.real ? 'real' : ''} ${slot.status === 'done' || slot.status === 'noshow' ? 'muted' : ''}">
            <span class="between"><span class="h3 ellipsis">${esc(L(slot.patient.name))}</span><span class="tag ${st[0]}">${esc(t(st[1]))}</span></span>
            <span class="xs">${esc(genderAge(slot.patient))}${slot.reason ? ` · ${esc(L(slot.reason))}` : ''}</span>
            <span class="row wrap" style="gap:5px;margin-top:6px">${patientTags(slot, info)}</span>
          </span></button>`;
      }
      if (slot.kind === 'blocked') return `<button class="sched-row" data-act="openSlot" data-time="${slot.time}">
          <span class="sched-time">${esc(fmtTime(slot.time))}</span>
          <span class="sched-card blocked">${icon('lock')}<span class="grow">${esc(t('drBlocked'))}${slot.block.reason ? ` · ${esc(slot.block.reason)}` : ''}</span></span></button>`;
      if (!s.showFree || slot.kind === 'past') return '';
      return `<button class="sched-row" data-act="openSlot" data-time="${slot.time}">
          <span class="sched-time">${esc(fmtTime(slot.time))}</span>
          <span class="sched-card free">${icon('plus')}<span class="grow">${esc(accepting ? t('drOpenSlot') : t('drPausedSlot'))}</span></span></button>`;
    };
    const part = p => plan.filter(x => x.part === p).map(row).join('');
    return `<div class="body">
      ${appbar({ back: false, big: true, title: t('drHello', { n: first }), sub: L(facilityById(doc.facility)),
        right: `<button class="status-pill ${accepting ? 'on' : 'off'}" data-act="tab" data-tab="docAvail"><i></i>${esc(t(accepting ? 'drAccepting' : 'drPaused'))}</button>` })}
      <div class="scroll pad stack" data-scroll-id="dochome">
        <div class="stat-row">
          <div class="stat"><b>${num(pts.length)}</b><span>${esc(t(s.day === today ? 'drToday' : 'drThatDay'))}</span></div>
          <div class="stat"><b>${num(repeatToday)}</b><span>${esc(t('drRepeatPts'))}</span></div>
          <div class="stat wide"><b>${next ? esc(fmtTime(next.time)) : '—'}</b><span class="ellipsis">${next ? esc(L(next.patient.name)) : esc(t('drNoNext'))}</span></div>
        </div>
        <div class="days">${days.map(iso => {
          const n = dayPlan(doc.id, iso).filter(x => x.kind === 'patient' && x.status !== 'noshow').length;
          return `<button class="day ${iso === s.day ? 'on' : ''}" data-act="pickDay" data-v="${iso}" aria-pressed="${iso === s.day}">
            <div class="d">${esc(dayAbbr(iso))}</div><div class="n">${num(parseIso(iso).getDate())}</div><div class="day-count">${num(n)}</div></button>`;
        }).join('')}</div>
        <div class="between">
          <span class="h2">${esc(relDay(s.day))}</span>
          <button class="chip-f ${s.showFree ? 'on' : ''}" data-act="toggleFree" aria-pressed="${s.showFree}">${esc(t('drShowFree'))}</button>
        </div>
        ${plan.length ? `
          <div class="sec-h">${esc(t('morning'))}</div><div class="stack" style="gap:8px">${part('morning')}</div>
          <div class="sec-h">${esc(t('afternoon'))}</div><div class="stack" style="gap:8px">${part('afternoon')}</div>`
        : emptyState('calendar', t('drDayOff'), t('drDayOffSub'))}
      </div>
      ${docTabbar('docHome')}
    </div>`;
  },
  actions: {
    pickDay: (el, ev, ctx) => { ctx.s.day = el.dataset.v; ctx.rerender(); },
    toggleFree: (el, ev, ctx) => { ctx.s.showFree = !ctx.s.showFree; ctx.rerender(); },
    openSlot: (el, ev, ctx) => {
      const slot = dayPlan(state.actingDoctor, ctx.s.day).find(x => x.time === el.dataset.time);
      if (!slot) return;
      if (slot.kind === 'patient') apptSheet(slot, ctx.s.day, ctx);
      else if (slot.kind === 'free') freeSlotSheet(slot, ctx.s.day, ctx);
      else if (slot.kind === 'blocked') reset('docAvail');
    },
  },
});

// ============================================================ PATIENTS
register('docPatients', {
  render: ctx => {
    const s = ctx.s;
    s.f ??= 'all';
    const q = (s.q || '').trim().toLowerCase();
    const all = patientList(state.actingDoctor);
    const list = all.filter(p => (s.f === 'all' || (s.f === 'repeat' ? p.repeat : !p.repeat)) &&
      (!q || p.name.en.toLowerCase().includes(q) || p.name.ar.includes(q)));
    const nRepeat = all.filter(p => p.repeat).length;
    return `<div class="body">
      ${appbar({ back: false, big: true, title: t('drPatients'), sub: t('drPatientsSub', { n: all.length, r: nRepeat }) })}
      <div class="pad stack" style="gap:var(--sp-3);margin-bottom:var(--sp-3)">
        <div class="input">${icon('search')}<input id="pq" type="search" placeholder="${esc(t('drSearchPatients'))}" value="${esc(s.q || '')}" data-input="pq" autocomplete="off"></div>
        ${seg('pf', [['all', t('all')], ['repeat', t('drRepeat')], ['new', t('drNew')]], s.f)}
      </div>
      <div class="scroll pad stack" id="plist" data-scroll-id="docpts">${listHtml(list)}</div>
      ${docTabbar('docPatients')}
    </div>`;
  },
  inputs: { pq: (el, ev, ctx) => { ctx.s.q = el.value; ctx.rerender(); } },
  actions: {
    pf: (el, ev, ctx) => { ctx.s.f = el.dataset.v; ctx.rerender(); },
    openPatient: (el) => patientSheet(el.dataset.k),
  },
});
function listHtml(list) {
  if (!list.length) return emptyState('user', t('drNoPatients'), t('drNoPatientsSub'));
  return list.map(p => {
    const last = p.visits[0], up = p.upcoming[0];
    return `<button class="card tap" data-act="openPatient" data-k="${p.key}">
      <div class="row" style="align-items:flex-start">
        ${avatar(initialsOf(L(p.name)), p.visitor ? 'gold' : (p.real ? '' : 'info'))}
        <div class="grow">
          <div class="between"><span class="h3 ellipsis">${esc(L(p.name))}</span>
            ${p.repeat ? `<span class="tag tag-gold">${esc(t('drRepeatN', { n: p.total }))}</span>` : `<span class="tag tag-info">${esc(t('drNew'))}</span>`}</div>
          <div class="xs" style="margin-top:2px">${esc(genderAge(p))}${p.visitor ? ` · ${esc(t('drVisitor'))}` : ''}</div>
          <div class="row wrap" style="gap:5px;margin-top:8px">
            ${up ? `<span class="tag tag-brand">${icon('calendar')}${esc(relDay(up.date))}${up.slot ? ' ' + esc(fmtTime(up.slot.time)) : ''}</span>` : ''}
            ${last ? `<span class="tag">${esc(t('drLastVisit', { d: fmtDate(last.date, { day: 'numeric', month: 'short' }) }))}</span>` : ''}
            ${p.real ? `<span class="tag tag-brand">${icon('check')}${esc(t('drViaApp'))}</span>` : ''}
          </div>
        </div>
      </div></button>`;
  }).join('');
}
function patientSheet(key) {
  const p = patientList(state.actingDoctor).find(x => x.key === key);
  if (!p) return;
  const line = (v, upcoming) => `<div class="hist-row"><span class="hist-dot ${upcoming ? 'up' : ''}"></span>
    <span class="grow"><span class="sm strong">${esc(fmtDate(v.date))}${v.slot ? ` · ${esc(fmtTime(v.slot.time))}` : ''}</span><br>
    <span class="xs">${esc(v.slot?.reason ? L(v.slot.reason) : t('drVisit'))}${v.slot?.visit === 'video' ? ` · ${esc(t('video'))}` : ''}</span></span>
    <span class="tag ${upcoming ? 'tag-brand' : ''}">${esc(t(upcoming ? 'upcoming' : 'drDone'))}</span></div>`;
  openSheet(`
    <div class="row">${avatar(initialsOf(L(p.name)), p.visitor ? 'gold' : (p.real ? '' : 'info'), 'lg')}
      <div class="grow"><div class="h2">${esc(L(p.name))}</div><div class="sm">${esc(genderAge(p))}</div>
      <div class="xs ltr-num" style="margin-top:4px">${esc(p.phone)}</div></div></div>
    <div class="stat-row" style="margin-top:var(--sp-4)">
      <div class="stat"><b>${num(p.visits.length)}</b><span>${esc(t('drPastVisits'))}</span></div>
      <div class="stat"><b>${num(p.upcoming.length)}</b><span>${esc(t('upcoming'))}</span></div>
      <div class="stat"><b>${esc(t(p.repeat ? 'drRepeat' : 'drNew'))}</b><span>${esc(t('drPatientType'))}</span></div>
    </div>
    <div class="sec-h" style="margin-top:var(--sp-4)">${esc(t('drHistory'))}</div>
    <div>${p.upcoming.map(v => line(v, true)).join('')}${p.visits.map(v => line(v, false)).join('')}</div>`,
  {}, { title: t('drPatient') });
}

// ============================================================ AVAILABILITY
function fmtBlock(b) {
  const dates = b.from === b.to ? fmtDateShort(b.from) : `${fmtDate(b.from, { day: 'numeric', month: 'short' })} – ${fmtDate(b.to, { day: 'numeric', month: 'short' })}`;
  return `${dates} · ${b.allDay ? t('drAllDay') : `${fmtTime(b.start)}–${fmtTime(b.end)}`}`;
}
const TIME_OPTS = [...SLOT_TIMES.morning, ...SLOT_TIMES.afternoon];
const END_OPTS = [...TIME_OPTS.slice(1), '19:00'];

function blockForm(ctx, init = {}) {
  const today = isoDate(new Date());
  const f = { allDay: true, from: today, to: today, start: '09:00', end: '12:20', reason: '', ...init };
  const draw = (err = '') => openSheet(`
    <div class="stack" style="gap:var(--sp-4)">
      ${seg('bfType', [['day', t('drFullDays')], ['time', t('drTimeRange')]], f.allDay ? 'day' : 'time')}
      <div class="row" style="gap:var(--sp-3)">
        <div class="field grow"><label class="label" for="bfFrom">${esc(t('drFrom'))}</label><div class="input"><input id="bfFrom" type="date" min="${today}" value="${f.from}" data-input="bfFrom"></div></div>
        <div class="field grow"><label class="label" for="bfTo">${esc(t('drTo'))}</label><div class="input"><input id="bfTo" type="date" min="${today}" value="${f.to}" data-input="bfTo"></div></div>
      </div>
      ${f.allDay ? '' : `<div class="row" style="gap:var(--sp-3)">
        <div class="field grow"><label class="label" for="bfStart">${esc(t('drStartTime'))}</label><div class="input"><select id="bfStart" data-input="bfStart">${TIME_OPTS.map(x => `<option value="${x}" ${x === f.start ? 'selected' : ''}>${fmtTime(x)}</option>`).join('')}</select></div></div>
        <div class="field grow"><label class="label" for="bfEnd">${esc(t('drEndTime'))}</label><div class="input"><select id="bfEnd" data-input="bfEnd">${END_OPTS.map(x => `<option value="${x}" ${x === f.end ? 'selected' : ''}>${fmtTime(x)}</option>`).join('')}</select></div></div>
      </div>`}
      <div class="field"><label class="label" for="bfReason">${esc(t('drReasonOpt'))}</label><div class="input"><input id="bfReason" maxlength="60" value="${esc(f.reason)}" placeholder="${esc(t('drReasonPh'))}" data-input="bfReason"></div></div>
      ${err ? `<div class="note danger">${esc(err)}</div>` : `<div class="note info">${esc(t('drBlockNote'))}</div>`}
      <button class="btn btn-primary btn-lg" data-act="bfSave">${icon('lock')}${esc(t('drSaveBlock'))}</button>
    </div>`, {
    bfType: el => { f.allDay = el.dataset.v === 'day'; draw(); },
    bfFrom: el => { f.from = el.value; if (f.to < f.from) { f.to = f.from; const to = document.getElementById('bfTo'); if (to) to.value = f.to; } },
    bfTo: el => { f.to = el.value; },
    bfStart: el => { f.start = el.value; },
    bfEnd: el => { f.end = el.value; },
    bfReason: el => { f.reason = el.value; },
    bfSave: () => {
      if (!f.from || !f.to || f.to < f.from) return draw(t('drErrDates'));
      if (!f.allDay && toMin(f.end) <= toMin(f.start)) return draw(t('drErrTimes'));
      addBlock(state.actingDoctor, f.allDay ? { from: f.from, to: f.to, allDay: true, reason: f.reason.trim() }
        : { from: f.from, to: f.to, allDay: false, start: f.start, end: f.end, reason: f.reason.trim() });
      closeOverlay(); toast(t('drBlockedToast')); ctx.rerender();
    },
  }, { title: t('drBlockTime') });
  draw();
}

register('docAvail', {
  render: () => {
    const doc = actingDoctor(), on = isAccepting(doc.id);
    const blocks = activeBlocks(doc.id);
    return `<div class="body">
      ${appbar({ back: false, big: true, title: t('drAvailability'), sub: t('drAvailSub') })}
      <div class="scroll pad stack" data-scroll-id="docavail">
        <button class="trv-toggle ${on ? 'on' : ''}" role="switch" aria-checked="${on}" data-act="toggleAccept" id="acceptToggle">
          <span class="ic">${icon('calendar')}</span>
          <span class="grow"><span class="h3">${esc(t('drAcceptingTitle'))}</span><span class="xs">${esc(t(on ? 'drAcceptingOn' : 'drAcceptingOff'))}</span></span>
          <span class="switch" aria-hidden="true"><i></i></span>
        </button>
        <div class="sec-h">${esc(t('drQuickBlocks'))}</div>
        <div class="chips-row">
          ${chip('preset', 'rest', t('drRestOfToday'), false)}${chip('preset', 'tomorrow', t('tomorrow'), false)}${chip('preset', 'nextweek', t('nextWeek'), false)}${chip('preset', 'custom', t('drCustom'), false)}
        </div>
        <div class="sec-h">${esc(t('drBlockedTimes'))} · ${num(blocks.length)}</div>
        ${blocks.length ? blocks.map(b => `<div class="card row" style="padding:var(--sp-3) var(--sp-4)">
            <span class="rep-ic" style="background:var(--n-100);color:var(--n-700)">${icon('lock')}</span>
            <div class="grow"><div class="sm strong">${esc(fmtBlock(b))}</div>${b.reason ? `<div class="xs">${esc(b.reason)}</div>` : ''}</div>
            <button class="btn btn-danger-ghost btn-sm" data-act="unblock" data-id="${b.id}">${esc(t('drRemove'))}</button>
          </div>`).join('') : `<div class="note brand">${esc(t('drNoBlocks'))}</div>`}
      </div>
      <div class="footbar"><button class="btn btn-primary btn-lg" data-act="newBlock">${icon('lock')}${esc(t('drBlockTime'))}</button></div>
      ${docTabbar('docAvail')}
    </div>`;
  },
  actions: {
    toggleAccept: (el, ev, ctx) => {
      const on = !isAccepting(state.actingDoctor);
      setAccepting(state.actingDoctor, on);
      toast(t(on ? 'drResumedToast' : 'drPausedToast'));
      ctx.rerender();
    },
    newBlock: (el, ev, ctx) => blockForm(ctx),
    preset: (el, ev, ctx) => {
      const v = el.dataset.v, d = new Date(), today = isoDate(d);
      if (v === 'custom') return blockForm(ctx);
      if (v === 'rest') {
        const nm = nowMin();
        const start = TIME_OPTS.find(x => toMin(x) >= nm);
        if (!start) { toast(t('drNoSlotsLeft')); return; }
        addBlock(state.actingDoctor, { from: today, to: today, allDay: false, start, end: '19:00', reason: '' });
      } else if (v === 'tomorrow') {
        d.setDate(d.getDate() + 1);
        addBlock(state.actingDoctor, { from: isoDate(d), to: isoDate(d), allDay: true, reason: '' });
      } else if (v === 'nextweek') {
        const sun = new Date(d); sun.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
        const thu = new Date(sun); thu.setDate(sun.getDate() + 4);
        addBlock(state.actingDoctor, { from: isoDate(sun), to: isoDate(thu), allDay: true, reason: '' });
      }
      toast(t('drBlockedToast')); ctx.rerender();
    },
    unblock: (el, ev, ctx) => { removeBlock(state.actingDoctor, el.dataset.id); toast(t('drUnblockedToast')); ctx.rerender(); },
  },
});

// ============================================================ PROFILE
register('docProfile', {
  render: () => {
    const doc = actingDoctor(), f = facilityById(doc.facility);
    return `<div class="body">
      ${appbar({ back: false, big: true, title: t('drProfile') })}
      <div class="scroll pad stack" style="gap:var(--sp-4)">
        <div class="card row" style="align-items:flex-start">
          ${avatar(doc.initials, doc.tone, 'lg')}
          <div class="grow"><div class="h2">${esc(L(doc.name))}</div><div class="sm">${esc(L(doc.role))}</div>
            <div class="xs" style="margin-top:4px">${esc(L(f))} · ${esc(L(f.area))}</div>
            <div class="row wrap" style="gap:5px;margin-top:8px"><span class="tag tag-gold">★ ${num(doc.rating)} · ${num(doc.reviews)}</span><span class="tag">${esc(t('years', { n: doc.years }))}</span></div></div>
        </div>
        <div class="field"><span class="label">${esc(t('language'))}</span>${seg('drLang', [['en', 'English'], ['ar', 'العربية']], state.lang)}</div>
        <div class="sec-h">${esc(t('demo'))}</div>
        <div class="list">
          <button class="li" data-act="pickDoctor"><span class="li-ic">${icon('stethoscope')}</span><span class="grow">${esc(t('drActingAs'))}</span><span class="xs">${esc(L(doc.name))}</span><span class="chev">${icon('chev')}</span></button>
          <button class="li" data-act="switchUseCase"><span class="li-ic">${icon('refresh')}</span><span class="grow">${esc(t('switchUseCase'))}</span><span class="chev">${icon('chev')}</span></button>
        </div>
        <p class="xs" style="text-align:center">${esc(t('drDemoNote'))}</p>
      </div>
      ${docTabbar('docProfile')}
    </div>`;
  },
  actions: {
    drLang: el => setLang(el.dataset.v),
    pickDoctor: (el, ev, ctx) => openSheet(`<div class="list">${DOCTORS.filter(isBookable).map(d => `
        <button class="li" data-act="actAs" data-v="${d.id}">${avatar(d.initials, d.tone, 'sm')}
          <span class="grow"><span class="h3" style="font-size:14px">${esc(L(d.name))}</span><br><span class="xs">${esc(L(SPECIALTIES[d.spec]))} · ${esc(L(facilityById(d.facility)))}</span></span>
          ${d.id === state.actingDoctor ? `<span class="brand-t">${icon('check')}</span>` : ''}</button>`).join('')}</div>`,
      { actAs: b => { state.actingDoctor = b.dataset.v; commit(); closeOverlay(); toast(t('drNowActing', { n: L(doctorById(b.dataset.v).name) })); ctx.rerender(); } },
      { title: t('drActingAs') }),
  },
});
