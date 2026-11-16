// Stage 3a — Book: slot picker and confirmation.
import { state, commit, P } from '../store.js';
import { t, L, num } from '../i18n.js';
import { icon } from '../icons.js';
import { doctorById, facilityById, SPECIALTIES } from '../data.js';
import {
  isoDate, workingDays, slotsFor, nextAvailable, fmtMonth, dayAbbr, fmtDateLong, fmtTime, feeFor, fmtSar,
  makeRef, bookingIcs, downloadFile, parseIso, fmtDateShort, isBookable, fmtWhen,
} from '../logic.js';
import { register, go, reset, replace, esc, toast, appbar, avatar, seg, emptyState, saveFile, editProfileSheet } from '../ui.js';

// ============================================================ 09 SLOT PICKER
register('slots', {
  render: ctx => {
    const d = doctorById(ctx.params.id);
    if (!d || !isBookable(d)) return appbar() + emptyState('calendar', t('noSlots'), '');
    const s = ctx.s;
    const today = isoDate(new Date());
    if (!s.init) {
      const n = nextAvailable(d);
      s.visit = 'inperson';
      s.weekStart = today;
      s.date = n ? n.date : today;
      s.time = n ? n.time : null;
      // make sure the next-available day is inside the first page
      const first = workingDays(d, today, 5);
      if (n && !first.includes(n.date)) s.weekStart = n.date;
      s.init = true;
    }
    const days = workingDays(d, s.weekStart, 5);
    if (!days.includes(s.date)) s.date = days[0];
    const slots = slotsFor(d, s.date);
    const anyFree = [...slots.morning, ...slots.afternoon].some(x => x.free);
    const fee = feeFor(d, s.visit);
    const dayBtn = iso => {
      const sl = slotsFor(d, iso);
      const full = ![...sl.morning, ...sl.afternoon].some(x => x.free);
      return `<button class="day ${iso === s.date ? 'on' : ''} ${full ? 'full' : ''}" data-act="pickDay" data-v="${iso}" aria-pressed="${iso === s.date}">
        <div class="d">${esc(dayAbbr(iso))}</div><div class="n">${num(parseIso(iso).getDate())}</div></button>`;
    };
    const slotGrid = list => `<div class="slots">${list.map(x =>
      `<button class="slot ${x.time === s.time ? 'on' : ''}" ${x.free ? '' : 'disabled'} data-act="pickTime" data-v="${x.time}" aria-pressed="${x.time === s.time}">${esc(fmtTime(x.time))}</button>`).join('')}</div>`;
    return `<div class="body">
      ${appbar({ title: t('chooseTime'), sub: L(d.name) })}
      <div class="scroll pad stack" style="gap:var(--sp-5)" data-scroll-id="slots">
        ${d.video ? seg('visit', [['inperson', t('inPerson')], ['video', t('videoVisit')]], s.visit) : ''}
        <div>
          <div class="between" style="margin-bottom:var(--sp-3)">
            <span class="h2">${esc(fmtMonth(s.date))}</span>
            <span class="row" style="gap:12px">
              ${s.weekStart > today ? `<button class="linkbtn" data-act="prevWeek">${esc(t('prevWeek'))}</button>` : ''}
              <button class="linkbtn" data-act="nextWeek">${esc(t('nextWeek'))}</button>
            </span>
          </div>
          <div class="days">${days.map(dayBtn).join('')}</div>
        </div>
        ${anyFree ? `
          <div><div class="h2" style="margin-bottom:var(--sp-3)">${esc(t('morning'))}</div>${slotGrid(slots.morning)}</div>
          <div><div class="h2" style="margin-bottom:var(--sp-3)">${esc(t('afternoon'))}</div>${slotGrid(slots.afternoon)}</div>`
        : `<div class="note info">${esc(t('noSlotsDay'))}</div>`}
        <div class="card row" style="padding:var(--sp-3) var(--sp-4)">
          <span class="li-ic" style="width:34px;height:34px;border-radius:9px;background:var(--brand-50);color:var(--brand-700);display:grid;place-items:center">${icon('user')}</span>
          <div class="grow"><div class="xs">${esc(t('patientLabel'))}</div><div class="sm strong">${esc(P().name || t('addYourName'))}</div></div>
          <button class="linkbtn" data-act="editPatient">${esc(t(P().name ? 'edit' : 'add'))}</button>
        </div>
        <div class="field">
          <div class="input"><input id="reason" maxlength="120" placeholder="${esc(t('reasonPh'))}" value="${esc(s.reason || '')}" data-input="reason"></div>
          <span class="helper">${esc(t('payAtClinic'))}</span>
        </div>
      </div>
      <div class="footbar">
        <div class="between" style="margin-bottom:var(--sp-3)">
          <span class="sm">${esc(s.time ? fmtWhen(s.date, s.time, fmtDateLong) : t('pickTime'))}</span>
          <span class="sm ltr-num" style="font-weight:600">${esc(fmtSar(fee))}</span>
        </div>
        <button class="btn btn-primary" data-act="confirm" id="confirmBtn" ${s.time ? '' : 'aria-disabled="true"'}>${esc(t('confirmBooking'))}</button>
      </div>
    </div>`;
  },
  inputs: { reason: (el, ev, ctx) => { ctx.s.reason = el.value; } },
  actions: {
    visit: (el, ev, ctx) => { ctx.s.visit = el.dataset.v; ctx.rerender(); },
    pickDay: (el, ev, ctx) => {
      ctx.s.date = el.dataset.v;
      const d = doctorById(ctx.params.id), sl = slotsFor(d, ctx.s.date);
      const first = [...sl.morning, ...sl.afternoon].find(x => x.free);
      ctx.s.time = first ? first.time : null;
      ctx.rerender();
    },
    pickTime: (el, ev, ctx) => { ctx.s.time = el.dataset.v; ctx.rerender(); },
    nextWeek: (el, ev, ctx) => {
      const d = doctorById(ctx.params.id);
      const days = workingDays(d, ctx.s.weekStart, 5);
      const nx = parseIso(days[days.length - 1]); nx.setDate(nx.getDate() + 1);
      ctx.s.weekStart = isoDate(nx); ctx.s.date = null; ctx.s.time = null;
      ctx.rerender();
    },
    prevWeek: (el, ev, ctx) => {
      const d = doctorById(ctx.params.id);
      const p = parseIso(ctx.s.weekStart); p.setDate(p.getDate() - 7);
      const today = isoDate(new Date());
      ctx.s.weekStart = isoDate(p) < today ? today : isoDate(p);
      ctx.s.date = workingDays(d, ctx.s.weekStart, 1)[0]; ctx.s.time = null;
      ctx.rerender();
    },
    editPatient: (el, ev, ctx) => editProfileSheet(() => ctx.rerender()),
    confirm: (el, ev, ctx) => {
      const s = ctx.s, d = doctorById(ctx.params.id);
      if (!s.time || s.busy) return;
      if (!P().name) { editProfileSheet(() => { ctx.rerender(); ctx.$('#confirmBtn')?.click(); }, { required: true }); return; }
      // re-check the slot is still free
      const sl = slotsFor(d, s.date);
      if (![...sl.morning, ...sl.afternoon].some(x => x.time === s.time && x.free)) { toast(t('genericErr')); ctx.rerender(); return; }
      s.busy = true;
      el.innerHTML = `<span class="spinner"></span>${esc(t('booking'))}`;
      el.setAttribute('aria-disabled', 'true');
      setTimeout(() => {
        const b = createBooking(d, s);
        replace('confirmed', { id: b.id });
      }, 750);
    },
  },
});

function createBooking(d, s) {
  const p = P();
  const b = {
    id: 'b' + Date.now().toString(36), ref: makeRef(), doctor: d.id, facility: d.facility,
    date: s.date, time: s.time, visit: s.visit, fee: feeFor(d, s.visit), reason: (s.reason || '').trim(),
    status: 'booked', createdAt: Date.now(), patientName: p.name,
  };
  p.bookings.push(b);
  // Consulted list (design: "Dr. Hana has been added to your Consulted list")
  p.consulted = [{ doctor: d.id, date: s.date }, ...p.consulted.filter(c => c.doctor !== d.id)];
  // Pending visit summary appears in Reports
  p.reports.unshift({
    id: 'rp-' + b.id, booking: b.id, type: 'visit', date: s.date, doctor: d.id, facility: d.facility, pending: true,
    title: { en: `${SPECIALTIES[d.spec].en} consultation`, ar: `استشارة ${SPECIALTIES[d.spec].ar}` },
    tags: ['awaitingVisit'], body: { kind: 'pending' },
  });
  commit();
  return b;
}

// ============================================================ 10 CONFIRMED
register('confirmed', {
  render: ctx => {
    const b = P().bookings.find(x => x.id === ctx.params.id);
    if (!b) return appbar() + emptyState('calendar', t('genericErr'), '');
    const d = doctorById(b.doctor), f = facilityById(b.facility);
    const video = b.visit === 'video';
    const firstName = L(d.name).split(' ').slice(0, 2).join(' ');
    return `<div class="body">
      <div class="scroll pad" style="padding-top:48px">
        <div class="success-mark" aria-hidden="true"></div>
        <h2 class="h-display" style="text-align:center;margin-top:var(--sp-6)">${esc(t('booked'))}</h2>
        <p class="body-t" style="text-align:center;margin-top:6px">${esc(t('reminderSet'))}</p>
        <div class="card" style="margin-top:var(--sp-6)">
          <div class="row" style="align-items:flex-start">
            ${avatar(d.initials, d.tone)}
            <div class="grow"><div class="h3">${esc(L(d.name))}</div><div class="xs" style="margin-top:2px">${esc(L(d.role))}</div></div>
          </div>
          <div class="divider" style="margin:var(--sp-4) 0"></div>
          <div class="kv sm" style="margin-bottom:var(--sp-3)"><span>${esc(t('when'))}</span><span class="strong">${esc(fmtWhen(b.date, b.time))}</span></div>
          <div class="kv sm" style="margin-bottom:var(--sp-3)"><span>${esc(t('where'))}</span><span class="strong">${esc(video ? t('videoWhere') : L(f))}</span></div>
          <div class="kv sm" style="margin-bottom:var(--sp-3)"><span>${esc(t('fee'))}</span><span class="strong ltr-num">${esc(fmtSar(b.fee))}</span></div>
          <div class="kv sm"><span>${esc(t('reference'))}</span><span class="strong ltr-num" id="ref">${esc(b.ref)}</span></div>
        </div>
        <div class="note brand" style="margin-top:var(--sp-3)">${esc(t('addedConsulted', { d: firstName }))}</div>
      </div>
      <div class="pad stack" style="padding-top:var(--sp-4);padding-bottom:max(var(--sp-6),calc(var(--safe-bottom) + 12px))">
        ${video ? `<button class="btn btn-primary" data-act="joinInfo">${icon('video')}${esc(t('videoVisit'))}</button>`
                : `<button class="btn btn-primary" data-act="dir" data-fid="${f.id}">${icon('nav')}${esc(t('getDirections'))}</button>`}
        <div class="row" style="gap:var(--sp-3)">
          <button class="btn btn-ghost grow" data-act="ics" data-id="${b.id}">${icon('calendar')}${esc(t('addCalendar'))}</button>
          <button class="btn btn-ghost" style="flex:0 0 96px" data-act="done">${esc(t('done'))}</button>
        </div>
      </div>
    </div>`;
  },
  actions: {
    joinInfo: () => toast(t('joinInfo'), 3500),
    done: () => reset('saved'),
  },
});

export function downloadIcs(b) {
  saveFile(`QRIB-${b.ref}.ics`, 'text/calendar', bookingIcs(b), t('calendarSaved'));
}
