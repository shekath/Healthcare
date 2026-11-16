// Stage 3c — Reports list, report detail and export.
import { state, P } from '../store.js';
import { t, L, num } from '../i18n.js';
import { icon } from '../icons.js';
import { doctorById, facilityById } from '../data.js';
import { fmtDate, downloadFile } from '../logic.js';
import { register, esc, toast, appbar, tabbar, emptyState, chip, saveFile } from '../ui.js';

const TYPE = {
  visit: { ic: 'PDF', cls: '', filter: 'visits' },
  lab: { ic: 'LAB', cls: 'lab', filter: 'lab' },
  img: { ic: 'IMG', cls: 'img', filter: 'imaging' },
  vac: { ic: 'VAC', cls: 'vac', filter: 'vaccines' },
};
const TAG_CLS = { visitSummary: 'tag-brand', prescription: '', resultsReady: 'tag-info', awaitingVisit: 'tag-warn', vaccines: 'tag-gold' };

function byline(r) {
  const who = r.doctor ? L(doctorById(r.doctor).name) : (r.source ? L(r.source) : '');
  const where = r.type === 'lab' && r.facility ? L(facilityById(r.facility)) : who;
  return `${where} · ${fmtDate(r.date)}`;
}

function reportCard(r) {
  const ty = TYPE[r.type];
  return `<button class="card tap" data-go="report" data-id="${r.id}">
    <div class="rep">
      <div class="rep-ic ${ty.cls}">${ty.ic}</div>
      <div class="grow">
        <div class="h3" style="font-size:14px">${esc(L(r.title))}</div>
        <div class="xs" style="margin-top:2px">${esc(byline(r))}</div>
        <div class="row wrap" style="gap:5px;margin-top:8px">${r.tags.map(k => `<span class="tag ${TAG_CLS[k] || ''}">${esc(t(k))}</span>`).join('')}</div>
      </div>
    </div>
  </button>`;
}

const sorted = () => [...P().reports].sort((a, b) => b.date.localeCompare(a.date));

register('reports', {
  render: ctx => {
    const s = ctx.s;
    s.f ??= 'all';
    const all = sorted();
    const done = all.filter(r => !r.pending);
    const providers = new Set(done.map(r => r.facility || r.source?.en)).size;
    const since = done.length ? Math.min(...done.map(r => +r.date.slice(0, 4))) : new Date().getFullYear();
    const list = s.f === 'all' ? all : all.filter(r => TYPE[r.type].filter === s.f);
    const filters = [['all', 'all'], ['visits', 'visits'], ['lab', 'lab'], ['imaging', 'imaging']];
    if (all.some(r => r.type === 'vac')) filters.push(['vaccines', 'vaccines']);
    return `<div class="body">
      ${appbar({ back: false, big: true, title: t('reports'), sub: t('reportsSub') })}
      <div class="scroll pad stack" data-scroll-id="reports">
        <div class="card" style="background:var(--surface-brand-subtle);border-color:var(--brand-100)">
          <div class="between">
            <div>
              <div class="h3" style="font-size:14px;color:var(--brand-800)">${esc(done.length === 1 ? t('oneRecord') : t('nRecords', { n: done.length }))}</div>
              <div class="xs" style="color:var(--brand-700);margin-top:2px">${esc(t('acrossProviders', { n: providers, y: num(since) }))}</div>
            </div>
            <button class="btn btn-secondary btn-sm" data-act="exportAll" ${done.length ? '' : 'aria-disabled="true"'}>${icon('download')}${esc(t('export'))}</button>
          </div>
        </div>
        <div class="chips-scroll">${filters.map(([v, k]) => chip('rf', v, t(k), s.f === v)).join('')}</div>
        ${list.length ? list.map(reportCard).join('') : emptyState('file', t('noReports'), t('noReportsSub'))}
      </div>
      ${tabbar('reports')}
    </div>`;
  },
  actions: {
    rf: (el, ev, ctx) => { ctx.s.f = el.dataset.v; ctx.rerender(); },
    exportAll: () => {
      saveFile('QRIB-health-records.html', 'text/html', exportHtml(sorted().filter(r => !r.pending)), t('exported'));
    },
  },
});

// ------------------------------------------------------------ detail
function bodyHtml(r) {
  const b = r.body;
  if (b.kind === 'pending') return `<div class="note warn">${esc(t('pendingReport', { d: fmtDate(r.date) }))}</div>`;
  if (b.kind === 'visit') return `
    <div><div class="h2" style="margin-bottom:6px">${esc(t('summary'))}</div><p class="sm" style="line-height:1.65">${esc(L(b.summary))}</p></div>
    <div><div class="h2" style="margin-bottom:6px">${esc(t('diagnosis'))}</div><p class="sm strong">${esc(L(b.diagnosis))}</p></div>
    ${b.meds?.length ? `<div><div class="h2" style="margin-bottom:6px">${esc(t('medications'))}</div>
      <div class="stack" style="gap:8px">${b.meds.map(m => `<div class="card row" style="padding:10px 12px;gap:10px"><span class="rep-ic" style="width:32px;height:32px;flex-basis:32px">Rx</span><span class="sm strong">${esc(L(m))}</span></div>`).join('')}</div></div>` : ''}`;
  if (b.kind === 'lab') return `
    <div class="card"><table class="res">
      <thead><tr><th>${esc(t('test'))}</th><th>${esc(t('value'))}</th><th>${esc(t('range'))}</th></tr></thead>
      <tbody>${b.rows.map(x => `<tr><td>${esc(L(x.n))}</td>
        <td><span class="${x.f === 'h' ? 'flag-h' : 'flag-n'} ltr-num">${esc(x.v)}</span> <span class="xs ltr-num">${esc(x.u)}</span>${x.f === 'h' ? ` <span class="tag tag-danger" style="padding:1px 6px">${esc(t('high'))}</span>` : ''}</td>
        <td class="xs ltr-num">${esc(x.r)}</td></tr>`).join('')}</tbody>
    </table></div>`;
  if (b.kind === 'img') return `
    <div><div class="h2" style="margin-bottom:6px">${esc(t('findings'))}</div><p class="sm" style="line-height:1.65">${esc(L(b.findings))}</p></div>
    <div><div class="h2" style="margin-bottom:6px">${esc(t('impression'))}</div><p class="sm strong">${esc(L(b.impression))}</p></div>`;
  if (b.kind === 'vac') return `<div class="stack" style="gap:8px">${b.items.map(i => `
    <div class="card row" style="padding:12px;gap:10px;align-items:flex-start"><span class="rep-ic vac" style="width:34px;height:34px;flex-basis:34px">${icon('check')}</span>
    <div><div class="sm strong">${esc(L(i.name))}</div><div class="xs">${esc(L(i.note))}</div></div></div>`).join('')}</div>`;
  return '';
}

register('report', {
  render: ctx => {
    const r = P().reports.find(x => x.id === ctx.params.id);
    if (!r) return appbar() + emptyState('file', t('genericErr'), '');
    const d = r.doctor && doctorById(r.doctor), f = r.facility && facilityById(r.facility);
    return `<div class="body">
      ${appbar({ title: L(r.title), sub: fmtDate(r.date) })}
      <div class="scroll pad stack" style="gap:var(--sp-4)">
        <div class="card stack" style="gap:10px">
          ${d ? `<div class="kv sm"><span>${esc(t('doctor'))}</span><button class="linkbtn" data-go="doctor" data-id="${d.id}">${esc(L(d.name))}</button></div>` : ''}
          ${f ? `<div class="kv sm"><span>${esc(t('facility'))}</span><span>${esc(L(f))}</span></div>` : ''}
          ${r.source ? `<div class="kv sm"><span>${esc(t('report'))}</span><span>${esc(L(r.source))}</span></div>` : ''}
          <div class="kv sm"><span>${esc(t('date'))}</span><span>${esc(fmtDate(r.date))}</span></div>
          <div class="row wrap" style="gap:5px">${r.tags.map(k => `<span class="tag ${TAG_CLS[k] || ''}">${esc(t(k))}</span>`).join('')}</div>
        </div>
        ${bodyHtml(r)}
      </div>
      ${r.pending ? '' : `<div class="footbar"><div class="row" style="gap:var(--sp-3)">
        <button class="btn btn-ghost grow" data-act="shareRep">${icon('share')}${esc(t('share'))}</button>
        <button class="btn btn-primary grow" data-act="dlRep">${icon('download')}${esc(t('download'))}</button>
      </div></div>`}
    </div>`;
  },
  actions: {
    dlRep: (el, ev, ctx) => {
      const r = P().reports.find(x => x.id === ctx.params.id);
      saveFile(`QRIB-${r.id}.html`, 'text/html', exportHtml([r]), t('exported'));
    },
    shareRep: async (el, ev, ctx) => {
      const r = P().reports.find(x => x.id === ctx.params.id);
      const text = `${L(r.title)} — ${byline(r)}\n${plain(r)}`;
      try {
        if (navigator.share) { await navigator.share({ title: L(r.title), text }); return; }
        await navigator.clipboard.writeText(text); toast(t('copied'));
      } catch (e) { if (e?.name !== 'AbortError') toast(t('genericErr')); }
    },
  },
});

function plain(r) {
  const b = r.body;
  if (b.kind === 'visit') return `${L(b.summary)}\n${t('diagnosis')}: ${L(b.diagnosis)}`;
  if (b.kind === 'lab') return b.rows.map(x => `${L(x.n)}: ${x.v} ${x.u} (${x.r})`).join('\n');
  if (b.kind === 'img') return `${L(b.findings)}\n${L(b.impression)}`;
  if (b.kind === 'vac') return b.items.map(i => L(i.name)).join('\n');
  return '';
}

function exportHtml(reports) {
  const ar = state.lang === 'ar';
  const who = state.session?.value || '';
  return `<!doctype html><html lang="${ar ? 'ar' : 'en'}" dir="${ar ? 'rtl' : 'ltr'}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>QRIB — ${esc(t('reports'))}</title>
<style>body{font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif;color:#101A17;max-width:760px;margin:32px auto;padding:0 20px;line-height:1.6}
h1{color:#00381B;margin:0}h2{font-size:17px;margin:28px 0 4px}.m{color:#5A6A64;font-size:13px}
table{border-collapse:collapse;width:100%;font-size:14px}td,th{border-bottom:1px solid #E3E9E6;padding:6px 0;text-align:start}
.h{color:#A32A1E;font-weight:600}section{border:1px solid #E3E9E6;border-radius:12px;padding:4px 16px 14px;margin-top:14px}</style></head><body>
<h1>QRIB</h1><p class="m">${esc(t('reportsSub'))} · ${esc(who)} · ${esc(new Date().toLocaleString(ar ? 'ar-SA-u-ca-gregory' : 'en-GB'))}</p>
${reports.map(r => `<section><h2>${esc(L(r.title))}</h2><p class="m">${esc(byline(r))}</p>${
  r.body.kind === 'lab' ? `<table><tr><th>${esc(t('test'))}</th><th>${esc(t('value'))}</th><th>${esc(t('range'))}</th></tr>${r.body.rows.map(x => `<tr><td>${esc(L(x.n))}</td><td class="${x.f === 'h' ? 'h' : ''}">${esc(x.v)} ${esc(x.u)}</td><td>${esc(x.r)}</td></tr>`).join('')}</table>`
  : `<p>${esc(plain(r)).replace(/\n/g, '<br>')}</p>`}</section>`).join('')}
<p class="m" style="margin-top:32px">${esc(t('version'))}</p></body></html>`;
}
