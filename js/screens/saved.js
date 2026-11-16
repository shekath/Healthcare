// Stage 3b — Keep: Saved (consulted, favourites, upcoming bookings).
import { commit, P } from '../store.js';
import { t, L, num } from '../i18n.js';
import { icon } from '../icons.js';
import { doctorById, facilityById, SPECIALTIES } from '../data.js';
import { enrichDoctor, fmtDist, fmtDate, upcomingBookings, fmtWhen, relDay, fmtTime } from '../logic.js';
import { register, esc, toast, appbar, tabbar, avatar, emptyState, seg, confirmDialog } from '../ui.js';
import { downloadIcs } from './booking.js';

function upcomingCard(b) {
  const d = doctorById(b.doctor), f = facilityById(b.facility);
  const video = b.visit === 'video';
  return `<div class="card" style="border-color:var(--brand-100)">
    <div class="between" style="align-items:flex-start">
      <div>
        <div class="xs brand-t strong" style="text-transform:uppercase;letter-spacing:.4px">${esc(relDay(b.date))}</div>
        <div class="h2" style="margin-top:2px">${esc(fmtTime(b.time))}</div>
      </div>
      <span class="tag ${video ? 'tag-info' : 'tag-brand'}">${esc(video ? t('videoVisit') : t('inPerson'))}</span>
    </div>
    <div class="divider" style="margin:var(--sp-3) 0"></div>
    <button class="row" style="width:100%;background:none;border:0;padding:0;text-align:start" data-go="doctor" data-id="${d.id}">
      ${avatar(d.initials, d.tone, 'sm')}
      <div class="grow"><div class="h3 ellipsis">${esc(L(d.name))}</div><div class="xs ellipsis">${esc(video ? t('videoWhere') : L(f))}</div></div>
    </button>
    <div class="xs" style="margin-top:8px">${esc(t('reference'))}: <span class="ltr-num strong">${esc(b.ref)}</span> · ${esc(fmtWhen(b.date, b.time))}</div>
    <div class="row" style="gap:var(--sp-2);margin-top:var(--sp-3)">
      ${video ? '' : `<button class="btn btn-secondary btn-sm grow" data-act="dir" data-fid="${f.id}">${icon('nav')}${esc(t('getDirections'))}</button>`}
      <button class="btn btn-ghost btn-sm ${video ? 'grow' : ''}" data-act="ics" data-id="${b.id}" aria-label="${esc(t('addCalendar'))}">${icon('calendar')}${video ? esc(t('addCalendar')) : ''}</button>
      <button class="btn btn-danger-ghost btn-sm" data-act="cancelBooking" data-id="${b.id}">${esc(t('cancel'))}</button>
    </div>
  </div>`;
}

function savedDoctorCard(d, line) {
  return `<div class="card">
    <div class="row" style="align-items:flex-start">
      ${avatar(d.initials, d.tone)}
      <div class="grow">
        <button class="between" style="width:100%;background:none;border:0;padding:0;text-align:start" data-go="doctor" data-id="${d.id}">
          <div class="row grow" style="gap:5px"><span class="h3 ellipsis">${esc(L(d.name))}</span>${d.verified ? '<span class="verified"></span>' : ''}</div>
          <span class="dist">${esc(fmtDist(d.km))}</span>
        </button>
        <div class="xs" style="margin-top:2px">${esc(line)}</div>
        <div class="row" style="gap:var(--sp-2);margin-top:var(--sp-3)">
          ${d.spec === 'emerg' ? '' : `<button class="btn btn-secondary btn-sm" data-go="slots" data-id="${d.id}">${esc(t('bookAgain'))}</button>`}
          <button class="btn btn-ghost btn-sm" data-go="doctor" data-id="${d.id}">${esc(t('details'))}</button>
        </div>
      </div>
    </div>
  </div>`;
}

register('saved', {
  render: ctx => {
    const s = ctx.s;
    s.tab ??= 'consulted';
    const p = P();
    let body;
    if (s.tab === 'consulted') {
      const up = upcomingBookings();
      const list = p.consulted.map(c => ({ c, d: doctorById(c.doctor) })).filter(x => x.d);
      body = `
        ${up.length ? `<div class="sec-h">${esc(t('upcoming'))} · ${num(up.length)}</div>${up.map(upcomingCard).join('')}<div class="sec-h" style="margin-top:var(--sp-3)">${esc(t('consulted'))}</div>` : ''}
        ${list.length ? `<p class="xs">${esc(t('consultedSub'))}</p>` + list.map(({ c, d }) => savedDoctorCard(enrichDoctor(d), t('lastSeen', { s: L(SPECIALTIES[d.spec]), d: fmtDate(c.date) }))).join('')
          : emptyState('calendar', t('noConsulted'), t('noConsultedSub'), `<button class="btn btn-primary btn-sm" data-act="tab" data-tab="search">${esc(t('findDoctor'))}</button>`)}`;
    } else {
      const list = p.favourites.map(doctorById).filter(Boolean).map(enrichDoctor);
      body = list.length
        ? `<p class="xs">${esc(t('favSub'))}</p>` + list.map(d => savedDoctorCard(d, `${L(SPECIALTIES[d.spec])} · ${L(d.f)}`)).join('')
        : emptyState('heart', t('noFav'), t('noFavSub'), `<button class="btn btn-primary btn-sm" data-act="tab" data-tab="search">${esc(t('findDoctor'))}</button>`);
    }
    return `<div class="body">
      ${appbar({ back: false, big: true, title: t('saved') })}
      <div class="pad" style="margin-bottom:var(--sp-4)">${seg('savedTab', [['consulted', t('consulted')], ['fav', t('favourites')]], s.tab)}</div>
      <div class="scroll pad stack" data-scroll-id="saved-${s.tab}">${body}</div>
      ${tabbar('saved')}
    </div>`;
  },
  actions: {
    savedTab: (el, ev, ctx) => { ctx.s.tab = el.dataset.v; ctx.rerender(); },
    cancelBooking: async (el, ev, ctx) => {
      const p = P(), b = p.bookings.find(x => x.id === el.dataset.id);
      if (!b) return;
      const d = doctorById(b.doctor);
      const ok = await confirmDialog({
        title: t('cancelBooking'), body: t('cancelBody', { d: L(d.name), w: fmtWhen(b.date, b.time) }),
        ok: t('yesCancel'), cancel: t('keep'), danger: true,
      });
      if (!ok) return;
      b.status = 'cancelled';
      p.reports = p.reports.filter(r => r.booking !== b.id);
      // drop from Consulted if this booking was the only reason it is there
      const seenBefore = p.bookings.some(x => x.doctor === b.doctor && x.id !== b.id && x.status === 'booked');
      const seeded = p.reports.some(r => r.doctor === b.doctor);
      if (!seenBefore && !seeded) p.consulted = p.consulted.filter(c => c.doctor !== b.doctor);
      commit();
      toast(t('cancelled'));
      ctx.rerender();
    },
  },
});

export { downloadIcs };
