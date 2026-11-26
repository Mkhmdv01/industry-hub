/* Industry Hub — core: i18n, helpers, layout, router, wizard engine. */
'use strict';

const App = { user: null, company: null, lang: 'uz', sidebar: false };
const LANGS = ['uz', 'en', 'ru'];

// ---------- i18n ----------
function t(k, p) {
  let s = (I18N[App.lang] && I18N[App.lang][k]);
  if (s == null) s = I18N.en[k];
  if (s == null) return k;
  if (p) s = s.replace(/\{(\w+)\}/g, (m, x) => (p[x] != null ? p[x] : ''));
  return s;
}
function setLang(l) {
  if (!LANGS.includes(l)) return;
  App.lang = l;
  try { localStorage.setItem('ih_lang', l); } catch (e) { /* ignore */ }
  document.documentElement.lang = l;
  if (App.user) { try { DB.update('users', App.user.id, { lang: l }); } catch (e) { /* ignore */ } }
  render();
}

// ---------- helpers ----------
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const locale = () => ({ uz: 'uz-UZ', en: 'en-GB', ru: 'ru-RU' }[App.lang]);
const fmtDate = iso => { try { return new Date(iso).toLocaleDateString(locale(), { day: '2-digit', month: 'short', year: 'numeric' }); } catch (e) { return iso; } };
const fmtTime = iso => { try { return new Date(iso).toLocaleString(locale(), { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso; } };
const num = n => Number(n || 0).toLocaleString(locale(), { maximumFractionDigits: 2 });
const money = (n, cur) => (cur === 'USD' ? '$' + num(n) : num(n) + ' ' + (cur === 'UZS' ? t('c.sum') : cur));
const tt = (prefix, v) => (v ? t(prefix + v) : '—');
function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
function back() { if (history.length > 1) history.back(); else go('#/dashboard'); }
function maskStir(s) { s = String(s || ''); return s.length === 9 ? s.slice(0, 2) + '*****' + s.slice(7) : '•••'; }
function errMsg(e) { const k = 'e.' + (e && e.message); const s = t(k); return s === k ? t('e.generic') : s; }

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = 'toast ' + type; el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.innerHTML = `<span>${type === 'error' ? '⚠️' : type === 'info' ? 'ℹ️' : '✅'}</span><p>${esc(msg)}</p>`;
  $('#toasts').append(el);
  setTimeout(() => el.classList.add('out'), 3400); setTimeout(() => el.remove(), 3800);
}
async function withLoading(btn, fn) {
  if (btn && btn.disabled) return;
  if (btn) { btn.disabled = true; btn.classList.add('loading'); }
  try { await sleep(280); await fn(); }
  catch (e) { if (t('e.' + e.message) === 'e.' + e.message) console.error(e); toast(errMsg(e), 'error'); }
  finally { if (btn && btn.isConnected) { btn.disabled = false; btn.classList.remove('loading'); } }
}
function openModal({ title, body, ok, cancel, danger, onOk, hideOk }) {
  const wrap = document.createElement('div'); wrap.className = 'modal-bg';
  wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" data-x aria-label="${t('c.close')}">✕</button></div>
    <div class="modal-body">${body}</div>
    <div class="modal-actions"><button class="btn ghost" data-x>${cancel || t('c.cancel')}</button>
    ${hideOk ? '' : `<button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${ok || t('c.ok')}</button>`}</div></div>`;
  document.body.append(wrap);
  const close = () => wrap.remove();
  wrap.addEventListener('click', e => { if (e.target === wrap || e.target.closest('[data-x]')) close(); });
  wrap.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  const okBtn = $('[data-ok]', wrap);
  if (okBtn) okBtn.onclick = () => withLoading(okBtn, async () => { const r = await onOk(wrap); if (r !== false) close(); });
  setTimeout(() => { const f = $('textarea,input,select', wrap) || okBtn; f && f.focus(); }, 30);
  return wrap;
}
const confirmBox = (text, onOk, danger = true) => openModal({ title: t('c.confirm'), body: `<p>${esc(text)}</p>`, ok: t('c.yes'), danger, onOk });

function readImage(file, max) {
  return new Promise((res, rej) => {
    if (!/^image\//.test(file.type)) return rej(new Error('imgType'));
    if (file.size > 8 * 1024 * 1024) return rej(new Error('imgSize'));
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const sc = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * sc)); c.height = Math.max(1, Math.round(img.height * sc));
        const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => rej(new Error('imgType')); img.src = fr.result;
    };
    fr.onerror = () => rej(new Error('imgType')); fr.readAsDataURL(file);
  });
}

// ---------- shared UI pieces ----------
function guide(key) {
  let closed = [];
  try { closed = JSON.parse(localStorage.getItem('ih_guide_closed') || '[]'); } catch (e) { /* ignore */ }
  const items = ['what', 'why', 'enter', 'how', 'after'];
  return `<details class="guide" data-guide="${key}" ${closed.includes(key) ? '' : 'open'}>
    <summary><span>💡 ${t('g.title')}</span><small>${t('g.toggle')}</small></summary>
    <ol class="guide-list">${items.map((i, n) => `<li><span class="gnum">${n + 1}</span><div><b>${t('g.q.' + i)}</b><p>${t('g.' + key + '.' + i)}</p></div></li>`).join('')}</ol>
  </details>`;
}
function page({ title, crumbs = [], guideKey, body, actions = '', noBack }) {
  return `<nav class="crumbs" aria-label="breadcrumb"><a href="${App.user ? '#/dashboard' : '#/'}">${t('nav.home')}</a>${crumbs.map(c =>
    ` <span class="sep">/</span> ${c[1] ? `<a href="${c[1]}">${esc(c[0])}</a>` : `<span aria-current="page">${esc(c[0])}</span>`}`).join('')}</nav>
  <div class="page-head">${noBack ? '' : `<button class="btn ghost sm" data-act="back">← ${t('c.back')}</button>`}
    <h1>${esc(title)}</h1><div class="head-actions">${actions}</div></div>
  ${guideKey ? guide(guideKey) : ''}${body}`;
}
const chip = (status, prefix) => `<span class="chip s-${esc(status)}">${t(prefix + status)}</span>`;
const verBadge = c => (c && c.verification === 'verified' ? `<span class="badge-ver" title="${t('vs.badgeTip')}">✔ ${t('vs.badge')}</span>` : '');
const empty = (icon, text, cta) => `<div class="empty"><div class="empty-ico">${icon}</div><p>${text}</p>${cta || ''}</div>`;
const logoImg = (c, cls = 'logo') => c && c.logo ? `<img class="${cls}" src="${esc(c.logo)}" alt="">` : `<div class="${cls} ph">${esc(((c && c.name) || '?').slice(0, 2).toUpperCase())}</div>`;
function needCompanyBox() {
  return `<div class="card notice"><h3>🏢 ${t('c.needCompanyT')}</h3><p>${t('c.needCompany')}</p><a class="btn primary" href="#/onboarding">${t('dash.registerCo')}</a></div>`;
}

// ---------- layout ----------
const NAV = [
  ['dashboard', '#/dashboard', '🏠'], ['company', '#/company', '🏢'], ['marketplace', '#/marketplace', '🛒'],
  ['addProduct', '#/products/new', '➕'], ['myProducts', '#/products', '📦'], ['partners', '#/partners', '🤝'],
  ['requests', '#/requests', '📨'], ['messages', '#/messages', '💬'], ['orders', '#/orders', '🧾'],
  ['notifications', '#/notifications', '🔔'], ['settings', '#/settings', '⚙️'], ['help', '#/help', '❓'],
];
function counts() {
  const u = App.user; if (!u) return {};
  const co = App.company;
  const c = {
    notifications: DB.all('notifs', n => n.userId === u.id && !n.read).length,
    messages: DB.all('convos', v => v.members.includes(u.id)).reduce((a, v) => a + ((v.unread || {})[u.id] || 0), 0),
    requests: co ? DB.all('requests', r => r.toCompanyId === co.id && r.status === 'pending').length : 0,
    orders: DB.all('orders', o => o.sellerId === u.id && o.status === 'pending').length,
  };
  if (u.role === 'admin') c.admin = DB.all('companies', x => x.verification === 'pending').length;
  return c;
}
function langSwitch() {
  return `<div class="lang" role="group" aria-label="${t('set.lang')}">${LANGS.map(l => `<button class="${l === App.lang ? 'on' : ''}" data-lang="${l}">${l.toUpperCase()}</button>`).join('')}</div>`;
}
function shell(path) {
  const u = App.user; const cnt = counts();
  const brand = `<a class="brand" href="${u ? '#/dashboard' : '#/'}"><span class="brand-ico">IH</span><span>Industry<b>Hub</b></span></a>`;
  if (!u) {
    return `<header class="top">${brand}<nav class="top-links"><a href="#/marketplace">${t('nav.marketplace')}</a><a href="#/help">${t('nav.help')}</a></nav>
      <div class="top-right">${langSwitch()}<a class="btn ghost sm" href="#/login">${t('auth.login')}</a><a class="btn primary sm" href="#/register">${t('auth.register')}</a></div></header>
      <main id="view" class="pub"></main>`;
  }
  const items = NAV.concat(u.role === 'admin' ? [['admin', '#/admin', '🛡️']] : []);
  const active = h => { const p = h.slice(1); return path === p || (p !== '/products' && p !== '/dashboard' && path.startsWith(p + '/')) || (p === '/products' && /^\/products\/[^/]+\/edit$/.test(path)); };
  return `<header class="top">
      <button class="icon-btn burger" data-act="menu" aria-label="${t('c.menu')}">☰</button>${brand}
      <div class="top-right">${langSwitch()}
        <a class="icon-btn bell" href="#/notifications" aria-label="${t('nav.notifications')}">🔔${cnt.notifications ? `<i>${cnt.notifications}</i>` : ''}</a>
        <div class="user-box"><span class="avatar">${esc(u.name.slice(0, 1).toUpperCase())}</span><span class="uname">${esc(u.name)}${u.role === 'admin' ? ' · ' + t('role.admin') : ''}</span>
          <button class="btn ghost sm" data-act="logout">${t('auth.logout')}</button></div>
      </div></header>
    <div class="layout ${App.sidebar ? 'side-open' : ''}">
      <aside class="side"><nav>${items.map(([k, h, ico]) => `<a href="${h}" class="${active(h) ? 'on' : ''}"><span class="ico">${ico}</span><span>${t('nav.' + k)}</span>${cnt[k] ? `<i class="cnt">${cnt[k]}</i>` : ''}</a>`).join('')}</nav>
        <div class="side-foot">${App.company ? `${logoImg(App.company, 'logo xs')}<div><b>${esc(App.company.name)}</b><small>${chip(App.company.verification, 'vs.')}</small></div>` : `<a href="#/onboarding" class="btn primary sm block">${t('dash.registerCo')}</a>`}</div>
      </aside>
      <div class="side-mask" data-act="menu"></div>
      <main id="view"></main>
    </div>`;
}

function updateBadges() {
  if (!App.user) return;
  const c = counts(); const all = NAV.concat([['admin', '#/admin']]);
  $$('.side nav a').forEach(a => {
    const k = (all.find(x => x[1] === a.getAttribute('href')) || [])[0];
    let i = $('.cnt', a);
    if (c[k]) { if (!i) { i = document.createElement('i'); i.className = 'cnt'; a.append(i); } i.textContent = c[k]; } else if (i) i.remove();
  });
  const bell = $('.bell'); if (bell) { let i = $('i', bell); if (c.notifications) { if (!i) { i = document.createElement('i'); bell.append(i); } i.textContent = c.notifications; } else if (i) i.remove(); }
}

// ---------- router ----------
const ROUTES = [];
function route(pattern, fn, opts = {}) {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (m, k) => { keys.push(k); return '([^/]+)'; }) + '$');
  ROUTES.push({ re, keys, fn, opts });
}
function parseHash() {
  const raw = (location.hash || '#/').slice(1) || '/';
  const [path, qs] = raw.split('?');
  const query = {}; new URLSearchParams(qs || '').forEach((v, k) => (query[k] = v));
  return { path: path || '/', query };
}
function refreshSession() {
  App.user = DB.me();
  if (App.user && App.user.blocked) { DB.logout(); App.user = null; }
  App.company = App.user ? DB.myCompany(App.user.id) : null;
}
function render() {
  refreshSession();
  const { path, query } = parseHash();
  let r = null, params = {};
  for (const x of ROUTES) { const m = path.match(x.re); if (m) { r = x; x.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1]))); break; } }
  if (!r) { r = { fn: pNotFound, opts: { pub: true } }; }
  if (!r.opts.pub && !App.user) { location.hash = '#/login?next=' + encodeURIComponent(path); return; }
  if (r.opts.guest && App.user) { location.hash = '#/dashboard'; return; }
  $$('.modal-bg').forEach(m => m.remove());
  $('#app').innerHTML = shell(path);
  const view = $('#view');
  if (r.opts.admin && (!App.user || App.user.role !== 'admin')) { view.innerHTML = page({ title: t('e.forbiddenT'), body: empty('🔒', t('e.forbidden')) }); return; }
  try { r.fn(view, params, query); }
  catch (e) { console.error(e); view.innerHTML = page({ title: t('e.genericT'), body: empty('⚠️', errMsg(e)) }); }
  view.focus && window.scrollTo(0, 0);
  document.title = ($('h1', view) ? $('h1', view).textContent + ' · ' : '') + 'Industry Hub';
}

// global delegated actions
const ACTIONS = {
  back: () => back(),
  menu: () => { App.sidebar = !App.sidebar; const l = $('.layout'); l && l.classList.toggle('side-open', App.sidebar); },
  logout: () => { DB.logout(); App.sidebar = false; toast(t('auth.loggedOut'), 'info'); go('#/'); },
};
document.addEventListener('click', e => {
  const l = e.target.closest('[data-lang]'); if (l) { setLang(l.dataset.lang); return; }
  const a = e.target.closest('[data-act]'); if (a && ACTIONS[a.dataset.act]) { e.preventDefault(); ACTIONS[a.dataset.act](a, e); return; }
  if (e.target.closest('.side a') && App.sidebar) App.sidebar = false;
});
document.addEventListener('toggle', e => {
  const d = e.target; if (!d.matches || !d.matches('details.guide')) return;
  let closed = []; try { closed = JSON.parse(localStorage.getItem('ih_guide_closed') || '[]'); } catch (x) { /* ignore */ }
  const k = d.dataset.guide; closed = closed.filter(x => x !== k); if (!d.open) closed.push(k);
  try { localStorage.setItem('ih_guide_closed', JSON.stringify(closed)); } catch (x) { /* ignore */ }
}, true);

// ---------- wizard engine ----------
/* cfg: { wid, prefix, steps, initial, submitLabel, afterKey, onSubmit(data), saveTo } */
function Wizard(root, cfg) {
  const u = App.user;
  const steps = cfg.steps;
  let step = 0, maxReached = 0, data = Object.assign({}, cfg.initial || {});
  const draft = DB.getDraft(u.id, cfg.wid);
  if (draft) {
    root.innerHTML = `<div class="card notice resume"><h3>💾 ${t('w.resumeT')}</h3><p>${t('w.resume', { step: Math.min(draft.step, steps.length - 1) + 1, total: steps.length, date: fmtTime(draft.updatedAt) })}</p>
      <div class="row"><button class="btn primary" data-r="go">${t('w.continue')}</button><button class="btn ghost" data-r="new">${t('w.startOver')}</button></div></div>`;
    $('[data-r="go"]', root).onclick = () => { data = Object.assign({}, data, draft.data); step = Math.min(draft.step, steps.length - 1); maxReached = step; draw(); };
    $('[data-r="new"]', root).onclick = () => { DB.clearDraft(u.id, cfg.wid); draw(); };
    return;
  }
  draw();

  function visible(f) { return !f.showIf || f.showIf(data); }
  function label(fd) { return t(fd.label || 'f.' + fd.n); }

  function fieldHtml(fd) {
    const n = fd.n, v = data[n], id = 'f_' + n;
    const lab = `<label class="f-label" for="${id}">${label(fd)} ${fd.req ? `<span class="req" aria-label="${t('w.required')}">*</span>` : `<span class="opt">(${t('w.optional')})</span>`}</label>`;
    const helpK = 'f.' + n + '.h', exK = 'f.' + n + '.ex';
    const help = t(helpK) !== helpK ? `<p class="f-help">${t(helpK)}</p>` : '';
    const exTxt = t(exK) !== exK ? t(exK) : '';
    const canFill = exTxt && ['text', 'email', 'tel', 'url', 'number', 'textarea', undefined].includes(fd.type);
    const ex = exTxt ? `<p class="f-ex"><span>${t('w.example')}:</span> <em>${esc(exTxt)}</em>${canFill ? ` <button type="button" class="link" data-fill="${n}">${t('w.useExample')}</button>` : ''}</p>` : '';
    const ph = exTxt ? ` placeholder="${esc(exTxt)}"` : '';
    const common = `id="${id}" name="${n}" ${fd.req ? 'aria-required="true"' : ''} aria-describedby="${id}_err"`;
    let input = '';
    switch (fd.type) {
      case 'textarea': input = `<textarea ${common} rows="${fd.rows || 4}"${ph} maxlength="${fd.maxLen || 2000}">${esc(v)}</textarea>`; break;
      case 'select': input = `<select ${common}><option value="">${t('w.choose')}</option>${fd.opts.map(([val, k, raw]) => `<option value="${esc(val)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(raw || t(k))}</option>`).join('')}</select>`; break;
      case 'cards': input = `<div class="cards" role="radiogroup">${fd.opts.map(([val, k, d]) => `<label class="opt-card ${v === val ? 'on' : ''}"><input type="radio" name="${n}" value="${val}" ${v === val ? 'checked' : ''} data-rerender><b>${t(k)}</b>${d ? `<small>${t(d)}</small>` : ''}</label>`).join('')}</div>`; break;
      case 'chips': input = `<div class="chips">${fd.opts.map(([val, k]) => `<label class="chip-opt"><input type="checkbox" name="${n}" value="${val}" ${(v || []).includes(val) ? 'checked' : ''}><span>${t(k)}</span></label>`).join('')}</div>`; break;
      case 'checkbox': input = `<label class="check"><input type="checkbox" ${common} ${v ? 'checked' : ''}><span>${t('f.' + n + '.text')}</span></label>`; break;
      case 'image': case 'images': {
        const list = fd.type === 'image' ? (v ? [v] : []) : (v || []);
        const max = fd.type === 'image' ? 1 : (fd.max || 4);
        input = `<div class="img-up">${list.map((src, i) => `<div class="thumb"><img src="${esc(src)}" alt=""><button type="button" class="icon-btn" data-rmimg="${n}:${i}" aria-label="${t('c.delete')}">✕</button></div>`).join('')}
          ${list.length < max ? `<label class="thumb add"><input type="file" accept="image/*" ${max > 1 ? 'multiple' : ''} data-img="${n}" hidden><span>📷<br>${t('w.upload')}</span></label>` : ''}</div>
          <p class="f-help">${t('w.imgHint', { max })}</p>`;
        break;
      }
      case 'productPick': input = fd.render(v); break;
      default: {
        const type = { email: 'email', tel: 'tel', url: 'url', number: 'number', date: 'date' }[fd.type] || 'text';
        input = `<input type="${type}" ${common} value="${esc(v)}"${ph}${fd.min != null ? ` min="${fd.min}"` : ''}${fd.max != null ? ` max="${fd.max}"` : ''}${fd.step ? ` step="${fd.step}"` : ''}${fd.maxLen ? ` maxlength="${fd.maxLen}"` : ''}${fd.inputmode ? ` inputmode="${fd.inputmode}"` : ''} autocomplete="${fd.ac || 'off'}">`;
      }
    }
    return `<div class="field ${fd.wide === false ? 'half' : ''}" data-field="${n}">${lab}${help}${input}${fd.type === 'checkbox' ? '' : ex}<p class="f-err" id="${id}_err" role="alert"></p></div>`;
  }

  function display(fd, v) {
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) return '<span class="muted">—</span>';
    switch (fd.type) {
      case 'select': { const o = fd.opts.find(x => String(x[0]) === String(v)); return esc(o ? (o[2] || t(o[1])) : v); }
      case 'cards': { const o = fd.opts.find(x => x[0] === v); return esc(o ? t(o[1]) : v); }
      case 'chips': return v.map(x => { const o = fd.opts.find(y => y[0] === x); return `<span class="tag">${esc(o ? t(o[1]) : x)}</span>`; }).join(' ');
      case 'checkbox': return v ? '✔' : '—';
      case 'image': return `<img class="rv-img" src="${esc(v)}" alt="">`;
      case 'images': return v.map(s => `<img class="rv-img" src="${esc(s)}" alt="">`).join('');
      case 'productPick': return esc(fd.show ? fd.show(v) : v);
      default: return esc(v) + (fd.suffix ? ' ' + esc(fd.suffix(data)) : '');
    }
  }
  function review() {
    return `<div class="review">${steps.map((s, i) => s.fields ? `<section class="rv-sec"><div class="rv-head"><h3>${i + 1}. ${t(cfg.prefix + s.key)}</h3><button type="button" class="btn ghost sm" data-wz-go="${i}">✏️ ${t('c.edit')}</button></div>
      <dl>${s.fields.filter(visible).map(fd => `<dt>${label(fd)}</dt><dd>${display(fd, data[fd.n])}</dd>`).join('')}</dl></section>` : '').join('')}</div>`;
  }

  function draw() {
    const s = steps[step], total = steps.length, last = step === total - 1;
    root.innerHTML = `<div class="wizard card">
      <div class="wz-top"><div class="wz-label">${t('w.stepOf', { n: step + 1, total })} — <b>${t(cfg.prefix + s.key)}</b></div><div class="wz-pct">${Math.round(((step + 1) / total) * 100)}%</div></div>
      <div class="wz-bar" role="progressbar" aria-valuemin="1" aria-valuemax="${total}" aria-valuenow="${step + 1}"><span style="width:${((step + 1) / total) * 100}%"></span></div>
      <ol class="wz-steps">${steps.map((x, i) => `<li class="${i < step ? 'done' : i === step ? 'cur' : ''}"><button type="button" data-wz-go="${i}" ${i > maxReached ? 'disabled' : ''}><span>${i < step ? '✓' : i + 1}</span><em>${t(cfg.prefix + x.key)}</em></button></li>`).join('')}</ol>
      <div class="wz-intro"><p>${t(cfg.prefix + s.key + '.d')}</p>${s.fields ? `<p class="legend"><span class="req">*</span> — ${t('w.required')}; (${t('w.optional')}) — ${t('w.optionalLegend')}</p>` : ''}</div>
      <form class="wz-form" novalidate>${s.extra ? s.extra(data) : ''}${s.review ? review() : s.fields.filter(visible).map(fieldHtml).join('')}</form>
      ${last ? `<p class="wz-after">ℹ️ <b>${t('w.afterT')}</b> ${t(cfg.afterKey)}</p>` : ''}
      <div class="wz-nav">
        ${step > 0 ? `<button type="button" class="btn ghost" data-wz="back">← ${t('c.back')}</button>` : '<span></span>'}
        <div class="wz-right"><button type="button" class="btn ghost" data-wz="save">💾 ${t('w.saveLater')}</button>
        ${last ? `<button type="button" class="btn primary" data-wz="submit">${cfg.submitLabel}</button>` : `<button type="button" class="btn primary" data-wz="next">${t('c.next')} →</button>`}</div>
      </div></div>`;
    bind();
  }

  function collect() {
    const s = steps[step]; if (!s.fields) return;
    const f = $('.wz-form', root);
    s.fields.forEach(fd => {
      if (!visible(fd)) return;
      const n = fd.n;
      switch (fd.type) {
        case 'cards': case 'productPick': { const c = $(`input[name="${n}"]:checked`, f); data[n] = c ? c.value : (fd.type === 'productPick' ? data[n] || '' : ''); break; }
        case 'chips': data[n] = $$(`input[name="${n}"]:checked`, f).map(x => x.value); break;
        case 'checkbox': { const c = $(`input[name="${n}"]`, f); data[n] = !!(c && c.checked); break; }
        case 'image': case 'images': break;
        case 'number': { const el = $(`[name="${n}"]`, f); if (el) data[n] = el.value === '' ? '' : Number(el.value); break; }
        default: { const el = $(`[name="${n}"]`, f); if (el) data[n] = el.value.trim(); }
      }
    });
  }
  function validateStep(i) {
    const s = steps[i], errs = {}; if (!s.fields) return errs;
    s.fields.forEach(fd => {
      if (!visible(fd)) return;
      const v = data[fd.n];
      const isEmpty = v == null || v === '' || v === false || (Array.isArray(v) && !v.length);
      if (isEmpty) { if (fd.req) errs[fd.n] = [fd.type === 'checkbox' ? 'v.mustAgree' : ['cards', 'select', 'chips', 'productPick'].includes(fd.type) ? 'v.choose' : 'v.required']; return; }
      if (fd.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) errs[fd.n] = ['v.email'];
      else if (fd.type === 'tel' && !/^\+?[\d\s\-()]{9,20}$/.test(v)) errs[fd.n] = ['v.phone'];
      else if (fd.type === 'url' && !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#].*)?$/i.test(v)) errs[fd.n] = ['v.url'];
      else if (fd.type === 'number' && (isNaN(v) || (fd.min != null && v < fd.min) || (fd.max != null && v > fd.max))) errs[fd.n] = ['v.range', { min: fd.min != null ? fd.min : '—', max: fd.max != null ? fd.max : '∞' }];
      else if (fd.minLen && String(v).length < fd.minLen) errs[fd.n] = ['v.minLen', { n: fd.minLen }];
      if (!errs[fd.n] && fd.validate) { const r = fd.validate(v, data); if (r) errs[fd.n] = Array.isArray(r) ? r : [r]; }
    });
    return errs;
  }
  function showErrors(errs, only) {
    $$('.field', root).forEach(el => {
      const n = el.dataset.field; if (only && n !== only) return;
      const e = errs[n]; el.classList.toggle('err', !!e);
      const p = $('.f-err', el); if (p) p.textContent = e ? '⚠ ' + t(e[0], e[1]) : '';
      const inp = $(`[name="${n}"]`, el); if (inp) inp.setAttribute('aria-invalid', e ? 'true' : 'false');
    });
  }
  function checkCurrent() {
    collect(); const errs = validateStep(step); showErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) { const el = $(`[data-field="${first}"]`, root); el && el.scrollIntoView({ behavior: 'smooth', block: 'center' }); const i = el && $('input,textarea,select', el); i && i.focus({ preventScroll: true }); toast(t('v.fixErrors'), 'error'); return false; }
    return true;
  }
  function save() { DB.saveDraft(u.id, cfg.wid, step, data); }
  function gotoStep(i) { step = i; maxReached = Math.max(maxReached, i); draw(); root.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

  function bind() {
    const form = $('.wz-form', root);
    form.addEventListener('submit', e => e.preventDefault());
    form.addEventListener('focusout', e => { if (!e.target.name) return; collect(); showErrors(validateStep(step), e.target.name); });
    form.addEventListener('input', e => { const fe = e.target.closest('.field'); if (fe && fe.classList.contains('err')) { collect(); showErrors(validateStep(step), fe.dataset.field); } if (cfg.onInput) { collect(); cfg.onInput(data, root); } });
    form.addEventListener('change', async e => {
      const el = e.target;
      if (el.matches('[data-rerender]')) { collect(); draw(); return; }
      if (el.matches('[data-img]')) {
        const n = el.dataset.img, fd = steps[step].fields.find(x => x.n === n);
        try {
          const files = Array.from(el.files || []);
          if (fd.type === 'image') { data[n] = await readImage(files[0], 320); }
          else { const cur = data[n] || []; const room = (fd.max || 4) - cur.length; if (files.length > room) toast(t('w.imgMax', { max: fd.max || 4 }), 'info'); const add = []; for (const f of files.slice(0, room)) add.push(await readImage(f, 900)); data[n] = cur.concat(add); }
          collect(); draw();
        } catch (err) { toast(errMsg(err), 'error'); }
      }
      if (cfg.onInput) { collect(); cfg.onInput(data, root); }
    });
    root.querySelectorAll('[data-rmimg]').forEach(b => b.onclick = () => { const [n, i] = b.dataset.rmimg.split(':'); collect(); if (Array.isArray(data[n])) data[n].splice(+i, 1); else data[n] = ''; draw(); });
    root.querySelectorAll('[data-fill]').forEach(b => b.onclick = () => { const n = b.dataset.fill; const el = $(`[name="${n}"]`, form); if (el) { el.value = t('f.' + n + '.ex'); el.dispatchEvent(new Event('input', { bubbles: true })); el.focus(); } });
    root.querySelectorAll('[data-wz-go]').forEach(b => b.onclick = () => { const i = +b.dataset.wzGo; if (i === step) return; if (i > step && !checkCurrent()) return; collect(); save(); gotoStep(i); });
    const btn = k => $(`[data-wz="${k}"]`, root);
    btn('back') && (btn('back').onclick = () => { collect(); save(); gotoStep(step - 1); });
    btn('next') && (btn('next').onclick = () => { if (!checkCurrent()) return; save(); gotoStep(step + 1); });
    btn('save').onclick = () => withLoading(btn('save'), async () => { collect(); save(); toast(t('w.saved')); go('#/dashboard'); });
    btn('submit') && (btn('submit').onclick = () => {
      if (!checkCurrent()) return;
      for (let i = 0; i < steps.length; i++) { const errs = validateStep(i); if (Object.keys(errs).length) { toast(t('v.fixStep', { n: i + 1 }), 'error'); gotoStep(i); setTimeout(() => showErrors(errs), 30); return; } }
      withLoading(btn('submit'), async () => { await cfg.onSubmit(data); DB.clearDraft(u.id, cfg.wid); });
    });
    if (cfg.onDraw) cfg.onDraw(data, root, step);
  }
}

// keep tabs in sync (e.g. two users logged in in two tabs → live messages)
window.addEventListener('storage', e => {
  if (e.key !== 'ih_db_v1') return;
  DB.reload();
  const a = document.activeElement;
  const typing = a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && a.type !== 'checkbox' && a.type !== 'radio'));
  const { path } = parseHash();
  if (path.startsWith('/messages/') && typeof refreshThread === 'function' && refreshThread) { refreshThread(); updateBadges(); return; }
  if (!typing && !$('.wizard') && !$('.modal-bg')) render(); else updateBadges();
});
window.addEventListener('hashchange', render);
