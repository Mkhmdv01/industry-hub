/* Industry Hub — pages. */
'use strict';

const catOpts = () => CATALOG.categories.map(c => [c, 'cat.' + c]);
const countryOpts = () => CATALOG.countries.map(c => [c, 'ctry.' + c]);
const companyOf = id => DB.get('companies', id);
const userCompany = uid => DB.myCompany(uid);
function requireLogin() { if (!App.user) { toast(t('auth.needLogin'), 'info'); go('#/login?next=' + encodeURIComponent(parseHash().path)); return false; } return true; }
function requireCo() { if (!requireLogin()) return false; if (!App.company) { toast(t('c.needCompany'), 'info'); go('#/onboarding'); return false; } return true; }

// ================= public =================
function pLanding(v) {
  const stats = { co: DB.all('companies').length, pr: DB.all('products', p => p.status === 'published').length, ver: DB.all('companies', c => c.verification === 'verified').length };
  v.innerHTML = `<section class="hero"><div><span class="pill">🧵 ${t('land.niche')}</span><h1>${t('land.title')}</h1><p>${t('land.sub')}</p>
    <div class="row"><a class="btn primary lg" href="#/register">${t('land.cta')}</a><a class="btn ghost lg" href="#/marketplace">${t('land.browse')}</a></div>
    <div class="hero-stats"><div><b>${stats.co}</b><span>${t('land.sCo')}</span></div><div><b>${stats.ver}</b><span>${t('land.sVer')}</span></div><div><b>${stats.pr}</b><span>${t('land.sPr')}</span></div></div></div>
    <div class="hero-card card"><h3>🎯 ${t('land.demoT')}</h3><p class="muted">${t('land.demo')}</p>${demoList()}</div></section>
    <section class="sec"><h2>${t('land.howT')}</h2><div class="steps4">${[1, 2, 3, 4].map(i => `<div class="card"><span class="num">${i}</span><h3>${t('land.h' + i)}</h3><p>${t('land.h' + i + 'd')}</p></div>`).join('')}</div></section>
    <section class="sec"><h2>${t('land.featT')}</h2><div class="grid3">${['f1', 'f2', 'f3', 'f4', 'f5', 'f6'].map((k, i) => `<div class="card feat"><span class="ico">${['🛡️', '🧭', '📦', '🤝', '💬', '🌐'][i]}</span><h3>${t('land.' + k)}</h3><p>${t('land.' + k + 'd')}</p></div>`).join('')}</div></section>
    <footer class="foot">© 2026 Industry Hub · <a href="#/help">${t('nav.help')}</a></footer>`;
  bindDemo(v);
}
function demoList() {
  const acc = [['admin@industryhub.uz', 'admin123', t('role.admin')], ['aziz@demo.uz', 'demo123', 'Namangan Textile'], ['dilnoza@demo.uz', 'demo123', 'Silk Road Garments'], ['sergey@demo.uz', 'demo123', 'Moscow Textile Trade']];
  return `<ul class="demo">${acc.map(a => `<li><button class="btn ghost sm" data-demo="${a[0]}|${a[1]}">${t('land.loginAs')}</button><div><b>${a[2]}</b><small>${a[0]} / ${a[1]}</small></div></li>`).join('')}</ul>`;
}
function bindDemo(v) {
  $$('[data-demo]', v).forEach(b => b.onclick = () => withLoading(b, async () => {
    const [e, p] = b.dataset.demo.split('|'); const u = await DB.login(e, p, false);
    if (u.lang) App.lang = u.lang; toast(t('auth.welcome', { name: u.name })); go(u.role === 'admin' ? '#/admin' : '#/dashboard');
  }));
}

function authForm(kind, query) {
  const reg = kind === 'register';
  return `<div class="auth"><div class="card auth-card">
    <h1>${reg ? t('auth.registerT') : t('auth.loginT')}</h1><p class="muted">${reg ? t('auth.registerD') : t('auth.loginD')}</p>
    ${reg ? `<div class="mini-steps"><span class="on">1. ${t('auth.s1')}</span><span>2. ${t('auth.s2')}</span><span>3. ${t('auth.s3')}</span></div>` : ''}
    <form id="af" novalidate>
      ${reg ? `<div class="field" data-field="name"><label class="f-label" for="a_name">${t('f.fullName')} <span class="req">*</span></label><input id="a_name" name="name" autocomplete="name" placeholder="${t('f.fullName.ex')}"><p class="f-err"></p></div>` : ''}
      <div class="field" data-field="email"><label class="f-label" for="a_email">${t('f.email')} <span class="req">*</span></label><input id="a_email" name="email" type="email" autocomplete="email" placeholder="${t('f.email.ex')}"><p class="f-err"></p></div>
      <div class="field" data-field="password"><label class="f-label" for="a_pass">${t('auth.password')} <span class="req">*</span></label><input id="a_pass" name="password" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" placeholder="••••••">${reg ? `<p class="f-help">${t('auth.passHelp')}</p>` : ''}<p class="f-err"></p></div>
      ${reg ? `<div class="field" data-field="password2"><label class="f-label" for="a_pass2">${t('auth.password2')} <span class="req">*</span></label><input id="a_pass2" name="password2" type="password" autocomplete="new-password"><p class="f-err"></p></div>
      <div class="field" data-field="agree"><label class="check"><input type="checkbox" name="agree"><span>${t('auth.agree')}</span></label><p class="f-err"></p></div>`
      : `<label class="check"><input type="checkbox" name="remember" checked><span>${t('auth.remember')}</span></label>`}
      <button class="btn primary block lg" type="submit">${reg ? t('auth.createAcc') : t('auth.login')}</button>
    </form>
    <p class="center">${reg ? t('auth.haveAcc') : t('auth.noAcc')} <a href="${reg ? '#/login' : '#/register'}${query.next ? '?next=' + encodeURIComponent(query.next) : ''}">${reg ? t('auth.login') : t('auth.register')}</a></p>
    </div>${reg ? '' : `<div class="card auth-demo"><h3>🎯 ${t('land.demoT')}</h3>${demoList()}</div>`}</div>`;
}
function formErrors(form, errs) {
  $$('.field', form).forEach(el => { const e = errs[el.dataset.field]; el.classList.toggle('err', !!e); const p = $('.f-err', el); if (p) p.textContent = e ? '⚠ ' + t(e) : ''; });
  const f = Object.keys(errs)[0]; if (f) { const i = $(`[name="${f}"]`, form); i && i.focus(); }
  return !f;
}
function pLogin(v, p, q) {
  v.innerHTML = authForm('login', q); bindDemo(v);
  const f = $('#af'); f.onsubmit = e => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(f)); const errs = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email || '')) errs.email = 'v.email';
    if (!d.password) errs.password = 'v.required';
    if (!formErrors(f, errs)) return;
    withLoading($('button[type=submit]', f), async () => {
      const u = await DB.login(d.email, d.password, !!d.remember);
      if (u.lang) App.lang = u.lang; toast(t('auth.welcome', { name: u.name }));
      go(q.next ? '#' + q.next : (u.role === 'admin' ? '#/admin' : '#/dashboard'));
    });
  };
}
function pRegister(v, p, q) {
  v.innerHTML = authForm('register', q);
  const f = $('#af'); f.onsubmit = e => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(f)); const errs = {};
    if (!d.name || d.name.trim().length < 3) errs.name = 'v.name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email || '')) errs.email = 'v.email';
    if (!d.password || d.password.length < 6 || !/\d/.test(d.password) || !/[a-zA-Z]/.test(d.password)) errs.password = 'v.password';
    if (d.password2 !== d.password) errs.password2 = 'v.password2';
    if (!d.agree) errs.agree = 'v.mustAgree';
    if (!formErrors(f, errs)) return;
    withLoading($('button[type=submit]', f), async () => {
      const u = await DB.register(d); DB.update('users', u.id, { lang: App.lang }); DB.startSession(u.id, true);
      DB.notify(u.id, 'n.welcome', {}, '#/onboarding');
      toast(t('auth.created')); go('#/onboarding');
    });
  };
}

// ================= dashboard =================
function checklist() {
  const u = App.user, co = App.company;
  const items = [
    ['acc', true, '#/settings'],
    ['co', !!co, '#/onboarding'],
    ['ver', co && co.verification === 'verified', '#/company'],
    ['prod', co && DB.all('products', x => x.companyId === co.id).length > 0, '#/products/new'],
    ['partner', co && DB.all('requests', r => r.fromCompanyId === co.id || r.toCompanyId === co.id).length > 0, '#/partners'],
    ['order', DB.all('orders', o => o.buyerId === u.id || o.sellerId === u.id).length > 0, '#/marketplace'],
  ];
  return items;
}
function pDashboard(v) {
  const u = App.user, co = App.company, cl = checklist(), done = cl.filter(x => x[1]).length;
  const next = cl.find(x => !x[1]);
  const myProducts = co ? DB.all('products', p => p.companyId === co.id).length : 0;
  const c = counts();
  const notifs = DB.all('notifs', n => n.userId === u.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const verCard = co ? `<div class="card ver-card s-${co.verification}"><h3>🛡️ ${t('ver.title')}</h3><p>${chip(co.verification, 'vs.')} ${verBadge(co)}</p><p class="muted">${t('ver.' + co.verification + '.d')}</p>
      ${co.verification === 'rejected' ? `<p class="reason"><b>${t('ver.reason')}:</b> ${esc(co.verifyNote)}</p><a class="btn primary sm" href="#/company/edit">${t('ver.resubmit')}</a>` : `<a class="btn ghost sm" href="#/company">${t('ver.view')}</a>`}</div>` : '';
  v.innerHTML = page({
    title: t('dash.hello', { name: u.name.split(' ')[0] }), guideKey: 'dashboard', noBack: true,
    body: `${next ? `<div class="card next-step"><div><small>${t('dash.nextT')}</small><h3>👉 ${t('dash.cl.' + next[0])}</h3><p>${t('dash.cl.' + next[0] + '.d')}</p></div><a class="btn primary" href="${next[2]}">${t('dash.doIt')}</a></div>` : `<div class="card next-step ok"><h3>🎉 ${t('dash.allDone')}</h3></div>`}
    <div class="grid-dash">
      <div class="card"><div class="row between"><h3>✅ ${t('dash.checklist')}</h3><b>${done}/${cl.length}</b></div><div class="bar"><span style="width:${(done / cl.length) * 100}%"></span></div>
        <ul class="checklist">${cl.map(([k, ok, h]) => `<li class="${ok ? 'ok' : ''}"><span>${ok ? '✔' : '○'}</span><a href="${h}">${t('dash.cl.' + k)}</a></li>`).join('')}</ul></div>
      ${verCard || `<div class="card notice"><h3>🏢 ${t('c.needCompanyT')}</h3><p>${t('c.needCompany')}</p><a class="btn primary" href="#/onboarding">${t('dash.registerCo')}</a></div>`}
    </div>
    <div class="tiles">
      <a class="tile" href="#/products"><b>${myProducts}</b><span>📦 ${t('dash.tProducts')}</span></a>
      <a class="tile" href="#/orders"><b>${c.orders || 0}</b><span>🧾 ${t('dash.tOrders')}</span></a>
      <a class="tile" href="#/requests"><b>${c.requests || 0}</b><span>📨 ${t('dash.tRequests')}</span></a>
      <a class="tile" href="#/messages"><b>${c.messages || 0}</b><span>💬 ${t('dash.tMessages')}</span></a>
    </div>
    <div class="grid-dash">
      <div class="card"><h3>⚡ ${t('dash.quick')}</h3><div class="quick">
        <a class="btn ghost" href="#/products/new">➕ ${t('nav.addProduct')}</a><a class="btn ghost" href="#/partners">🤝 ${t('nav.partners')}</a>
        <a class="btn ghost" href="#/marketplace">🛒 ${t('nav.marketplace')}</a><a class="btn ghost" href="#/orders/new">🧾 ${t('ord.new')}</a>
        <a class="btn ghost" href="#/messages">💬 ${t('nav.messages')}</a><a class="btn ghost" href="#/help">❓ ${t('nav.help')}</a></div></div>
      <div class="card"><div class="row between"><h3>🔔 ${t('dash.recent')}</h3><a href="#/notifications">${t('c.all')} →</a></div>
        ${notifs.length ? `<ul class="nlist">${notifs.map(nItem).join('')}</ul>` : `<p class="muted">${t('notif.empty')}</p>`}</div>
    </div>`,
  });
}

// ================= company =================
function validateStir(v, data) {
  if (!/^\d{9}$/.test(v)) return 'v.stirFormat';
  if (/^0/.test(v) || /^(\d)\1{8}$/.test(v)) return 'v.stirStart';
  const dup = DB.find('companies', c => c.stir === v && c.ownerId !== App.user.id);
  if (dup) return 'v.stirDuplicate';
  return null;
}
function companySteps() {
  return [
    { key: 'personal', fields: [
      { n: 'fullName', req: 1, minLen: 3, ac: 'name' }, { n: 'phone', type: 'tel', req: 1, ac: 'tel' },
      { n: 'email', type: 'email', req: 1, ac: 'email' }, { n: 'country', type: 'select', req: 1, opts: countryOpts() }, { n: 'city', req: 1 }] },
    { key: 'company', fields: [
      { n: 'name', req: 1, minLen: 2 }, { n: 'stir', req: 1, inputmode: 'numeric', maxLen: 9, validate: validateStir },
      { n: 'logo', type: 'image' }, { n: 'description', type: 'textarea', req: 1, minLen: 30 },
      { n: 'category', type: 'select', req: 1, opts: catOpts() }, { n: 'address', req: 1 }, { n: 'website', type: 'url' }] },
    { key: 'type', fields: [
      { n: 'businessType', type: 'cards', req: 1, opts: CATALOG.businessTypes.map(b => [b, 'bt.' + b, 'bt.' + b + '.d']) },
      { n: 'businessTypeOther', req: 1, showIf: d => d.businessType === 'other' }] },
    { key: 'details', fields: [
      { n: 'products', type: 'textarea', req: 1, minLen: 5, rows: 3 }, { n: 'capacity', req: 1 },
      { n: 'employees', type: 'select', req: 1, opts: CATALOG.employees.map(e => [e, null, e]) },
      { n: 'experience', type: 'number', req: 1, min: 0, max: 100 },
      { n: 'markets', type: 'chips', req: 1, opts: CATALOG.markets.map(m => [m, 'mk.' + m]) }] },
    { key: 'review', review: true },
  ];
}
function pCompanyWizard(v) {
  const u = App.user, co = App.company, edit = !!co;
  const initial = co ? Object.assign({}, co) : { fullName: u.name, email: u.email, country: 'Uzbekistan' };
  v.innerHTML = page({
    title: edit ? t('co.editT') : t('co.registerT'), crumbs: edit ? [[t('nav.company'), '#/company'], [t('c.edit')]] : [[t('co.registerT')]], guideKey: 'register',
    body: '<div id="wiz"></div>',
  });
  Wizard($('#wiz'), {
    wid: edit ? 'company-edit' : 'company', prefix: 'w.co.', steps: companySteps(), initial,
    submitLabel: edit ? t('co.saveChanges') : t('co.submit'), afterKey: 'w.co.after',
    onSubmit: async d => {
      const fields = ['fullName', 'phone', 'email', 'country', 'city', 'name', 'stir', 'logo', 'description', 'category', 'address', 'website', 'businessType', 'businessTypeOther', 'products', 'capacity', 'employees', 'experience', 'markets'];
      const rec = {}; fields.forEach(k => (rec[k] = d[k] == null ? '' : d[k]));
      if (validateStir(rec.stir)) throw new Error('stirInvalid');
      if (edit) {
        const reverify = co.stir !== rec.stir || co.name !== rec.name || co.verification === 'rejected';
        if (reverify) Object.assign(rec, { verification: 'pending', verifyNote: '', submittedAt: DB.now() });
        DB.update('companies', co.id, rec);
        if (reverify) DB.notifyAdmins('n.verifyNew', { company: rec.name }, '#/admin');
        toast(reverify ? t('co.updatedReverify') : t('co.updated'));
      } else {
        DB.insert('companies', Object.assign(rec, { ownerId: u.id, verification: 'pending', verifyNote: '', submittedAt: DB.now() }));
        DB.notifyAdmins('n.verifyNew', { company: rec.name }, '#/admin');
        DB.notify(u.id, 'n.submitted', { company: rec.name }, '#/company');
        toast(t('co.created'));
      }
      go('#/company');
    },
  });
}
function canSeeContacts(co) {
  const u = App.user; if (!u) return false;
  if (u.role === 'admin' || co.ownerId === u.id) return true;
  const mine = App.company; if (!mine) return false;
  return !!DB.find('requests', r => r.status === 'accepted' && ((r.fromCompanyId === mine.id && r.toCompanyId === co.id) || (r.toCompanyId === mine.id && r.fromCompanyId === co.id)));
}
function companyInfo(co, own) {
  const contacts = canSeeContacts(co);
  const products = DB.all('products', p => p.companyId === co.id && (own || p.status === 'published'));
  return `<div class="card co-head">${logoImg(co, 'logo lg')}<div class="grow"><h2>${esc(co.name)} ${verBadge(co)}</h2>
      <p class="muted">${tt('bt.', co.businessType)}${co.businessType === 'other' && co.businessTypeOther ? ' (' + esc(co.businessTypeOther) + ')' : ''} · ${tt('cat.', co.category)} · 📍 ${esc(co.city)}, ${tt('ctry.', co.country)}</p>
      <p>${esc(co.description)}</p></div></div>
    <div class="grid-dash">
      <div class="card"><h3>📋 ${t('co.details')}</h3><dl class="dl">
        <dt>${t('f.stir')}</dt><dd>${own || (App.user && App.user.role === 'admin') ? esc(co.stir) : maskStir(co.stir) + ` <small class="muted">🔒 ${t('co.hidden')}</small>`}</dd>
        <dt>${t('f.products')}</dt><dd>${esc(co.products)}</dd><dt>${t('f.capacity')}</dt><dd>${esc(co.capacity)}</dd>
        <dt>${t('f.employees')}</dt><dd>${esc(co.employees)}</dd><dt>${t('f.experience')}</dt><dd>${esc(co.experience)} ${t('c.years')}</dd>
        <dt>${t('f.markets')}</dt><dd>${(co.markets || []).map(m => `<span class="tag">${t('mk.' + m)}</span>`).join(' ')}</dd>
        ${co.website ? `<dt>${t('f.website')}</dt><dd><a href="${esc(/^https?:/.test(co.website) ? co.website : 'https://' + co.website)}" target="_blank" rel="noopener">${esc(co.website)}</a></dd>` : ''}</dl></div>
      <div class="card"><h3>📞 ${t('co.contacts')}</h3>${contacts ? `<dl class="dl"><dt>${t('f.fullName')}</dt><dd>${esc(co.fullName)}</dd><dt>${t('f.phone')}</dt><dd><a href="tel:${esc(co.phone)}">${esc(co.phone)}</a></dd><dt>${t('f.email')}</dt><dd><a href="mailto:${esc(co.email)}">${esc(co.email)}</a></dd><dt>${t('f.address')}</dt><dd>${esc(co.address)}</dd></dl>`
        : `<p class="muted">🔒 ${t('co.contactsLocked')}</p>`}</div>
    </div>
    <div class="card"><div class="row between"><h3>📦 ${t('co.products')} (${products.length})</h3>${own ? `<a class="btn primary sm" href="#/products/new">➕ ${t('nav.addProduct')}</a>` : ''}</div>
      ${products.length ? `<div class="pgrid">${products.map(pCard).join('')}</div>` : `<p class="muted">${t('co.noProducts')}</p>`}</div>`;
}
function pCompany(v) {
  const co = App.company;
  if (!co) { v.innerHTML = page({ title: t('nav.company'), guideKey: 'company', body: needCompanyBox() }); return; }
  v.innerHTML = page({
    title: t('nav.company'), crumbs: [[t('nav.company')]], guideKey: 'company',
    actions: `<a class="btn ghost" href="#/c/${co.id}">👁 ${t('co.publicView')}</a><a class="btn primary" href="#/company/edit">✏️ ${t('c.edit')}</a>`,
    body: `<div class="card ver-card s-${co.verification}"><div class="row between"><h3>🛡️ ${t('ver.title')}: ${chip(co.verification, 'vs.')}</h3>${verBadge(co)}</div>
        <p>${t('ver.' + co.verification + '.d')}</p>
        ${co.verification === 'rejected' ? `<p class="reason"><b>${t('ver.reason')}:</b> ${esc(co.verifyNote)}</p><a class="btn primary sm" href="#/company/edit">${t('ver.resubmit')}</a>` : ''}
        <ol class="ver-flow">${['submitted', 'review', 'decision'].map((k, i) => `<li class="${i === 0 || co.verification !== 'pending' ? 'ok' : i === 1 ? 'cur' : ''}">${t('ver.flow.' + k)}</li>`).join('')}</ol>
        <p class="muted small">ℹ️ ${t('ver.registryNote')}</p></div>
      ${companyInfo(co, true)}`,
  });
}
function pCompanyPublic(v, p) {
  const co = companyOf(p.id);
  if (!co) { pNotFound(v); return; }
  const own = App.user && co.ownerId === App.user.id;
  v.innerHTML = page({
    title: co.name, crumbs: [[t('nav.partners'), '#/partners'], [co.name]],
    actions: own ? `<a class="btn primary" href="#/company/edit">✏️ ${t('c.edit')}</a>` : `<button class="btn ghost" data-act="chat" data-user="${co.ownerId}">💬 ${t('c.message')}</button><button class="btn primary" data-act="partner" data-co="${co.id}">🤝 ${t('pr.send')}</button>`,
    body: companyInfo(co, own),
  });
}

// ================= products =================
function pCard(p) {
  const co = companyOf(p.companyId);
  return `<a class="pcard" href="#/p/${p.id}"><div class="pimg">${p.images && p.images[0] ? `<img src="${esc(p.images[0])}" alt="" loading="lazy">` : '<span>📦</span>'}${p.status !== 'published' ? `<span class="chip s-draft">${t('ps.' + p.status)}</span>` : ''}</div>
    <div class="pbody"><b>${esc(p.name)}</b><span class="price">${money(p.price, p.currency)} <small>/ ${t('unit.' + p.unit)}</small></span>
    <small class="muted">${t('f.moq')}: ${num(p.moq)} ${t('unit.' + p.unit)}</small>
    <small class="pco">${co ? esc(co.name) : ''} ${verBadge(co)}</small><small class="muted">📍 ${esc(p.city)}, ${tt('ctry.', p.country)}</small></div></a>`;
}
function productSteps() {
  return [
    { key: 'basic', fields: [{ n: 'pname', req: 1, minLen: 3, maxLen: 120 }, { n: 'pcategory', type: 'select', req: 1, opts: catOpts() }] },
    { key: 'images', fields: [{ n: 'images', type: 'images', req: 1, max: 4 }] },
    { key: 'desc', fields: [
      { n: 'pdescription', type: 'textarea', req: 1, minLen: 20 }, { n: 'composition', req: 1 },
      { n: 'density' }, { n: 'width' }, { n: 'color' }, { n: 'certificates' }] },
    { key: 'price', fields: [
      { n: 'price', type: 'number', req: 1, min: 0.01, step: '0.01' }, { n: 'currency', type: 'select', req: 1, opts: CATALOG.currencies.map(c => [c, null, c]) },
      { n: 'unit', type: 'select', req: 1, opts: CATALOG.units.map(x => [x, 'unit.' + x]) },
      { n: 'moq', type: 'number', req: 1, min: 1 },
      { n: 'stock', type: 'number', req: 1, min: 0, validate: (val, d) => (d.moq && val < d.moq ? 'v.stockMoq' : null) }] },
    { key: 'delivery', fields: [
      { n: 'delivery', type: 'cards', req: 1, opts: CATALOG.delivery.map(x => [x, 'dl.' + x, 'dl.' + x + '.d']) },
      { n: 'leadTime', type: 'number', req: 1, min: 1, max: 365 },
      { n: 'pcountry', type: 'select', req: 1, opts: countryOpts() }, { n: 'pcity', req: 1 }] },
    { key: 'review', review: true },
  ];
}
function pProductWizard(v, p) {
  const co = App.company;
  if (!co) { v.innerHTML = page({ title: t('nav.addProduct'), guideKey: 'product', body: needCompanyBox() }); return; }
  let prod = null;
  if (p.id) { prod = DB.get('products', p.id); if (!prod || prod.ownerId !== App.user.id) { v.innerHTML = page({ title: t('e.forbiddenT'), body: empty('🔒', t('e.forbidden')) }); return; } }
  const initial = prod ? { pname: prod.name, pcategory: prod.category, images: prod.images, pdescription: prod.description, composition: prod.composition, density: prod.density, width: prod.width, color: prod.color, certificates: prod.certificates, price: prod.price, currency: prod.currency, unit: prod.unit, moq: prod.moq, stock: prod.stock, delivery: prod.delivery, leadTime: prod.leadTime, pcountry: prod.country, pcity: prod.city }
    : { currency: 'USD', unit: 'meter', pcountry: co.country, pcity: co.city, pcategory: co.category, leadTime: 14 };
  v.innerHTML = page({
    title: prod ? t('prod.editT') : t('nav.addProduct'), crumbs: [[t('nav.myProducts'), '#/products'], [prod ? t('c.edit') : t('nav.addProduct')]], guideKey: 'product',
    body: (co.verification !== 'verified' ? `<div class="card notice warn small">⚠️ ${t('prod.unverifiedNote')}</div>` : '') + '<div id="wiz"></div>',
  });
  Wizard($('#wiz'), {
    wid: prod ? 'product-' + prod.id : 'product-new', prefix: 'w.pr.', steps: productSteps(), initial,
    submitLabel: prod ? t('co.saveChanges') : '🚀 ' + t('prod.publish'), afterKey: 'w.pr.after',
    onSubmit: async d => {
      const rec = { name: d.pname, category: d.pcategory, images: d.images, description: d.pdescription, composition: d.composition, density: d.density, width: d.width, color: d.color, certificates: d.certificates, price: d.price, currency: d.currency, unit: d.unit, moq: d.moq, stock: d.stock, delivery: d.delivery, leadTime: d.leadTime, country: d.pcountry, city: d.pcity };
      let r;
      if (prod) { r = DB.update('products', prod.id, rec); toast(t('prod.updated')); }
      else { r = DB.insert('products', Object.assign(rec, { companyId: co.id, ownerId: App.user.id, status: 'published', views: 0 })); toast(t('prod.published')); }
      go('#/p/' + r.id);
    },
  });
}
function pMyProducts(v) {
  const co = App.company;
  if (!co) { v.innerHTML = page({ title: t('nav.myProducts'), guideKey: 'myProducts', body: needCompanyBox() }); return; }
  const list = DB.all('products', p => p.companyId === co.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  v.innerHTML = page({
    title: t('nav.myProducts'), crumbs: [[t('nav.myProducts')]], guideKey: 'myProducts', actions: `<a class="btn primary" href="#/products/new">➕ ${t('nav.addProduct')}</a>`,
    body: list.length ? `<div class="card table-wrap"><table class="table"><thead><tr><th>${t('f.pname')}</th><th>${t('f.price')}</th><th>${t('f.stock')}</th><th>${t('c.status')}</th><th></th></tr></thead><tbody>
      ${list.map(p => `<tr><td><a href="#/p/${p.id}" class="tcell">${p.images && p.images[0] ? `<img src="${esc(p.images[0])}" alt="">` : ''}<span>${esc(p.name)}<small class="muted">${t('cat.' + p.category)}</small></span></a></td>
        <td>${money(p.price, p.currency)} / ${t('unit.' + p.unit)}</td><td>${num(p.stock)}</td><td>${chip(p.status, 'ps.')}</td>
        <td class="t-act"><a class="btn ghost sm" href="#/products/${p.id}/edit">✏️ ${t('c.edit')}</a>
        <button class="btn ghost sm" data-act="toggleProd" data-id="${p.id}">${p.status === 'published' ? '⏸ ' + t('prod.hide') : '▶ ' + t('prod.publish')}</button>
        <button class="btn ghost sm danger-t" data-act="delProd" data-id="${p.id}">🗑 ${t('c.delete')}</button></td></tr>`).join('')}</tbody></table></div>`
      : empty('📦', t('prod.none'), `<a class="btn primary" href="#/products/new">➕ ${t('nav.addProduct')}</a>`),
  });
}
ACTIONS.toggleProd = b => { const p = DB.get('products', b.dataset.id); if (!p || p.ownerId !== App.user.id) return; DB.update('products', p.id, { status: p.status === 'published' ? 'hidden' : 'published' }); toast(t('c.saved')); render(); };
ACTIONS.delProd = b => confirmBox(t('prod.delConfirm'), async () => { const p = DB.get('products', b.dataset.id); if (!p || p.ownerId !== App.user.id) throw new Error('forbidden'); DB.remove('products', p.id); toast(t('c.deleted')); if (parseHash().path.startsWith('/p/')) go('#/products'); else render(); });

function pMarket(v, p, q) {
  const f = { q: q.q || '', cat: q.cat || '', country: q.country || '', ver: q.ver === '1', sort: q.sort || 'new' };
  let list = DB.all('products', x => x.status === 'published');
  const cos = {}; DB.all('companies').forEach(c => (cos[c.id] = c));
  if (f.q) { const s = f.q.toLowerCase(); list = list.filter(x => (x.name + ' ' + x.description + ' ' + x.composition + ' ' + (cos[x.companyId] || {}).name).toLowerCase().includes(s)); }
  if (f.cat) list = list.filter(x => x.category === f.cat);
  if (f.country) list = list.filter(x => x.country === f.country);
  if (f.ver) list = list.filter(x => (cos[x.companyId] || {}).verification === 'verified');
  list.sort(f.sort === 'priceAsc' ? (a, b) => a.price - b.price : f.sort === 'priceDesc' ? (a, b) => b.price - a.price : (a, b) => b.createdAt.localeCompare(a.createdAt));
  v.innerHTML = page({
    title: t('nav.marketplace'), crumbs: [[t('nav.marketplace')]], guideKey: 'marketplace',
    actions: App.user ? `<a class="btn primary" href="#/products/new">➕ ${t('nav.addProduct')}</a>` : '',
    body: `<form class="card filters" id="mf">
      <input name="q" value="${esc(f.q)}" placeholder="🔎 ${t('mk.searchPh')}" aria-label="${t('c.search')}">
      <select name="cat" aria-label="${t('f.pcategory')}"><option value="">${t('mk.allCats')}</option>${catOpts().map(([c, k]) => `<option value="${c}" ${f.cat === c ? 'selected' : ''}>${t(k)}</option>`).join('')}</select>
      <select name="country" aria-label="${t('f.country')}"><option value="">${t('mk.allCountries')}</option>${countryOpts().map(([c, k]) => `<option value="${c}" ${f.country === c ? 'selected' : ''}>${t(k)}</option>`).join('')}</select>
      <select name="sort" aria-label="${t('mk.sort')}">${['new', 'priceAsc', 'priceDesc'].map(s => `<option value="${s}" ${f.sort === s ? 'selected' : ''}>${t('mk.sort.' + s)}</option>`).join('')}</select>
      <label class="check"><input type="checkbox" name="ver" value="1" ${f.ver ? 'checked' : ''}><span>✔ ${t('mk.verifiedOnly')}</span></label>
      <button class="btn primary" type="submit">${t('c.search')}</button></form>
      <p class="muted">${t('mk.found', { n: list.length })}</p>
      ${list.length ? `<div class="pgrid">${list.map(pCard).join('')}</div>` : empty('🔍', t('mk.none'), `<a class="btn ghost" href="#/marketplace">${t('c.reset')}</a>`)}`,
  });
  const form = $('#mf');
  form.onsubmit = e => { e.preventDefault(); const d = new URLSearchParams(); new FormData(form).forEach((val, k) => { if (val) d.set(k, val); }); go('#/marketplace' + (d.toString() ? '?' + d : '')); };
  $$('select,input[type=checkbox]', form).forEach(el => (el.onchange = () => form.requestSubmit()));
}
function pProduct(v, p) {
  const pr = DB.get('products', p.id);
  if (!pr || (pr.status !== 'published' && (!App.user || (pr.ownerId !== App.user.id && App.user.role !== 'admin')))) { pNotFound(v); return; }
  const co = companyOf(pr.companyId), own = App.user && pr.ownerId === App.user.id;
  const specs = [['f.pcategory', t('cat.' + pr.category)], ['f.composition', pr.composition], ['f.density', pr.density], ['f.width', pr.width], ['f.color', pr.color], ['f.certificates', pr.certificates],
    ['f.moq', num(pr.moq) + ' ' + t('unit.' + pr.unit)], ['f.stock', num(pr.stock) + ' ' + t('unit.' + pr.unit)], ['f.delivery', t('dl.' + pr.delivery)], ['f.leadTime', pr.leadTime + ' ' + t('c.days')], ['prod.location', `${pr.city}, ${t('ctry.' + pr.country)}`]].filter(x => x[1]);
  v.innerHTML = page({
    title: pr.name, crumbs: [[t('nav.marketplace'), '#/marketplace'], [pr.name]],
    actions: own ? `<a class="btn ghost" href="#/products/${pr.id}/edit">✏️ ${t('c.edit')}</a><button class="btn ghost danger-t" data-act="delProd" data-id="${pr.id}">🗑 ${t('c.delete')}</button>` : '',
    body: `<div class="prod">
      <div class="gallery card"><img id="gmain" src="${esc((pr.images || [])[0] || '')}" alt="${esc(pr.name)}">${(pr.images || []).length > 1 ? `<div class="gthumbs">${pr.images.map((s, i) => `<button data-g="${i}"><img src="${esc(s)}" alt=""></button>`).join('')}</div>` : ''}</div>
      <div class="card pinfo"><span class="tag">${t('cat.' + pr.category)}</span>${pr.status !== 'published' ? chip(pr.status, 'ps.') : ''}<h2>${esc(pr.name)}</h2>
        <p class="big-price">${money(pr.price, pr.currency)} <small>/ ${t('unit.' + pr.unit)}</small></p>
        <p>${esc(pr.description)}</p>
        ${own ? `<p class="muted">ℹ️ ${t('prod.ownNote')}</p>` : `<div class="pbtns"><a class="btn primary lg" href="#/orders/new?product=${pr.id}">🧾 ${t('prod.order')}</a>
          <button class="btn ghost" data-act="chat" data-user="${pr.ownerId}" data-product="${pr.id}">💬 ${t('prod.ask')}</button>
          <button class="btn ghost" data-act="partner" data-co="${pr.companyId}">🤝 ${t('pr.send')}</button></div>`}
        <a class="seller" href="#/c/${co.id}">${logoImg(co, 'logo sm')}<div><b>${esc(co.name)}</b> ${verBadge(co)}<small class="muted">${tt('bt.', co.businessType)} · ${esc(co.city)}</small></div><span>→</span></a>
      </div></div>
      <div class="card"><h3>📐 ${t('prod.specs')}</h3><dl class="dl">${specs.map(([k, val]) => `<dt>${t(k)}</dt><dd>${esc(val)}</dd>`).join('')}</dl></div>`,
  });
  $$('[data-g]', v).forEach(b => (b.onclick = () => ($('#gmain').src = pr.images[+b.dataset.g])));
}

// ================= partners =================
function pPartners(v, p, q) {
  const f = { cat: q.cat || '', country: q.country || '', city: q.city || '', type: q.type || '', need: q.need || '', ver: q.ver === '1' };
  let list = DB.all('companies', c => !App.user || c.ownerId !== App.user.id);
  if (f.cat) list = list.filter(c => c.category === f.cat);
  if (f.country) list = list.filter(c => c.country === f.country);
  if (f.city) list = list.filter(c => c.city.toLowerCase().includes(f.city.toLowerCase()));
  if (f.type) list = list.filter(c => c.businessType === f.type);
  if (f.ver) list = list.filter(c => c.verification === 'verified');
  if (f.need) { const s = f.need.toLowerCase().split(/\s+/).filter(w => w.length > 2); list = list.filter(c => { const txt = (c.products + ' ' + c.description + ' ' + c.name).toLowerCase(); return s.some(w => txt.includes(w)); }); }
  list.sort((a, b) => (b.verification === 'verified') - (a.verification === 'verified'));
  const examples = [['ex1', { cat: 'fabric', country: 'Uzbekistan', type: 'manufacturer' }], ['ex2', { cat: 'yarn', type: 'manufacturer', need: 'cotton yarn' }], ['ex3', { cat: 'garments', country: 'Uzbekistan', need: 'T-shirt' }], ['ex4', { type: 'wholesaler', country: 'Russia' }]];
  v.innerHTML = page({
    title: t('nav.partners'), crumbs: [[t('nav.partners')]], guideKey: 'partners',
    body: `<div class="card"><h3>🧭 ${t('ps.guidedT')}</h3><p class="muted">${t('ps.examplesT')}</p>
      <div class="ex-chips">${examples.map(([k, o]) => `<a class="ex-chip" href="#/partners?${new URLSearchParams(o)}">“${t('ps.' + k)}”</a>`).join('')}</div>
      <form id="pf" class="pf">
        <div class="field"><label class="f-label">1. ${t('ps.industry')}</label><select name="cat"><option value="">${t('mk.allCats')}</option>${catOpts().map(([c, k]) => `<option value="${c}" ${f.cat === c ? 'selected' : ''}>${t(k)}</option>`).join('')}</select></div>
        <div class="field"><label class="f-label">2. ${t('f.country')}</label><select name="country"><option value="">${t('mk.allCountries')}</option>${countryOpts().map(([c, k]) => `<option value="${c}" ${f.country === c ? 'selected' : ''}>${t(k)}</option>`).join('')}</select></div>
        <div class="field"><label class="f-label">${t('f.city')}</label><input name="city" value="${esc(f.city)}" placeholder="${t('f.city.ex')}"></div>
        <div class="field"><label class="f-label">3. ${t('ps.type')}</label><select name="type"><option value="">${t('ps.anyType')}</option>${CATALOG.businessTypes.map(b => `<option value="${b}" ${f.type === b ? 'selected' : ''}>${t('bt.' + b)}</option>`).join('')}</select></div>
        <div class="field wide"><label class="f-label">4. ${t('ps.need')}</label><input name="need" value="${esc(f.need)}" placeholder="${t('ps.needPh')}"><p class="f-help">${t('ps.needHelp')}</p></div>
        <label class="check"><input type="checkbox" name="ver" value="1" ${f.ver ? 'checked' : ''}><span>✔ ${t('mk.verifiedOnly')}</span></label>
        <div class="row"><button class="btn primary" type="submit">🔎 ${t('c.search')}</button><a class="btn ghost" href="#/partners">${t('c.reset')}</a></div>
      </form></div>
      <p class="muted">${t('ps.found', { n: list.length })}</p>
      ${list.length ? `<div class="colist">${list.map(c => `<div class="card co-row">${logoImg(c, 'logo sm')}<div class="grow"><a href="#/c/${c.id}"><b>${esc(c.name)}</b></a> ${verBadge(c)}
        <small class="muted">${tt('bt.', c.businessType)} · ${tt('cat.', c.category)} · 📍 ${esc(c.city)}, ${tt('ctry.', c.country)}</small><p>${esc(c.products)}</p></div>
        <div class="co-act"><a class="btn ghost sm" href="#/c/${c.id}">${t('ps.profile')}</a><button class="btn primary sm" data-act="partner" data-co="${c.id}">🤝 ${t('pr.send')}</button></div></div>`).join('')}</div>`
      : empty('🤷', t('ps.none'), `<a class="btn ghost" href="#/partners">${t('c.reset')}</a>`)}`,
  });
  const form = $('#pf');
  form.onsubmit = e => { e.preventDefault(); const d = new URLSearchParams(); new FormData(form).forEach((val, k) => { if (val) d.set(k, val); }); go('#/partners' + (d.toString() ? '?' + d : '')); };
}
ACTIONS.partner = b => {
  if (!requireCo()) return;
  const to = companyOf(b.dataset.co), me = App.company;
  if (!to) return;
  if (to.id === me.id) { toast(t('pr.self'), 'error'); return; }
  const ex = DB.find('requests', r => ((r.fromCompanyId === me.id && r.toCompanyId === to.id) || (r.fromCompanyId === to.id && r.toCompanyId === me.id)) && ['pending', 'accepted'].includes(r.status));
  if (ex) { toast(t(ex.status === 'accepted' ? 'pr.already' : 'pr.pendingExists'), 'info'); go('#/requests'); return; }
  openModal({
    title: t('pr.modalT', { company: to.name }), ok: t('pr.send'),
    body: `<p class="muted">${t('pr.modalD')}</p><div class="field" data-field="msg"><label class="f-label" for="prm">${t('pr.msg')} <span class="req">*</span></label>
      <textarea id="prm" rows="4" placeholder="${esc(t('pr.msgEx'))}"></textarea><p class="f-ex"><span>${t('w.example')}:</span> <em>${esc(t('pr.msgEx'))}</em> <button type="button" class="link" id="prfill">${t('w.useExample')}</button></p><p class="f-err"></p></div>`,
    onOk: w => {
      const m = $('#prm', w).value.trim();
      if (m.length < 10) { const fe = $('[data-field=msg]', w); fe.classList.add('err'); $('.f-err', fe).textContent = '⚠ ' + t('v.minLen', { n: 10 }); return false; }
      DB.insert('requests', { fromCompanyId: me.id, toCompanyId: to.id, fromUserId: App.user.id, toUserId: to.ownerId, message: m, status: 'pending' });
      DB.notify(to.ownerId, 'n.newRequest', { company: me.name }, '#/requests');
      toast(t('pr.sent')); render();
    },
  });
  setTimeout(() => { const fb = $('#prfill'); if (fb) fb.onclick = () => ($('#prm').value = t('pr.msgEx')); }, 0);
};
function pRequests(v, p, q) {
  const co = App.company;
  if (!co) { v.innerHTML = page({ title: t('nav.requests'), guideKey: 'requests', body: needCompanyBox() }); return; }
  const tab = q.tab === 'out' ? 'out' : 'in';
  const list = DB.all('requests', r => (tab === 'in' ? r.toCompanyId === co.id : r.fromCompanyId === co.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const inPending = DB.all('requests', r => r.toCompanyId === co.id && r.status === 'pending').length;
  v.innerHTML = page({
    title: t('nav.requests'), crumbs: [[t('nav.requests')]], guideKey: 'requests', actions: `<a class="btn primary" href="#/partners">🔎 ${t('nav.partners')}</a>`,
    body: `<div class="tabs"><a href="#/requests" class="${tab === 'in' ? 'on' : ''}">📥 ${t('pr.in')} ${inPending ? `<i class="cnt">${inPending}</i>` : ''}</a><a href="#/requests?tab=out" class="${tab === 'out' ? 'on' : ''}">📤 ${t('pr.out')}</a></div>
    ${list.length ? `<div class="colist">${list.map(r => { const other = companyOf(tab === 'in' ? r.fromCompanyId : r.toCompanyId); if (!other) return ''; return `<div class="card co-row">${logoImg(other, 'logo sm')}<div class="grow">
        <a href="#/c/${other.id}"><b>${esc(other.name)}</b></a> ${verBadge(other)} ${chip(r.status, 'rq.')}<small class="muted">${fmtTime(r.createdAt)} · ${tt('bt.', other.businessType)}</small><p class="quote">“${esc(r.message)}”</p></div>
        <div class="co-act">${tab === 'in' && r.status === 'pending' ? `<button class="btn primary sm" data-act="reqSet" data-id="${r.id}" data-s="accepted">✔ ${t('pr.accept')}</button><button class="btn ghost sm" data-act="reqSet" data-id="${r.id}" data-s="rejected">✕ ${t('pr.reject')}</button>` : ''}
        ${tab === 'out' && r.status === 'pending' ? `<button class="btn ghost sm" data-act="reqSet" data-id="${r.id}" data-s="cancelled">${t('pr.cancel')}</button>` : ''}
        ${r.status === 'accepted' ? `<button class="btn ghost sm" data-act="chat" data-user="${other.ownerId}">💬 ${t('c.message')}</button>` : ''}</div></div>`; }).join('')}</div>`
      : empty('📭', t(tab === 'in' ? 'pr.noneIn' : 'pr.noneOut'), `<a class="btn primary" href="#/partners">${t('nav.partners')}</a>`)}`,
  });
}
ACTIONS.reqSet = b => withLoading(b, async () => {
  const r = DB.get('requests', b.dataset.id), s = b.dataset.s, co = App.company;
  if (!r || r.status !== 'pending') throw new Error('stale');
  if (s === 'cancelled' ? r.fromCompanyId !== co.id : r.toCompanyId !== co.id) throw new Error('forbidden');
  DB.update('requests', r.id, { status: s });
  if (s !== 'cancelled') DB.notify(r.fromUserId, s === 'accepted' ? 'n.reqAccepted' : 'n.reqRejected', { company: co.name }, '#/requests?tab=out');
  toast(t('rq.done.' + s)); render();
});

// ================= messages =================
ACTIONS.chat = b => {
  if (!requireLogin()) return;
  const other = b.dataset.user; if (other === App.user.id) { toast(t('msg.self'), 'error'); return; }
  let cv = DB.find('convos', c => c.members.includes(App.user.id) && c.members.includes(other));
  if (!cv) cv = DB.insert('convos', { members: [App.user.id, other], lastAt: DB.now(), unread: {} });
  go('#/messages/' + cv.id + (b.dataset.product ? '?share=' + b.dataset.product : ''));
};
function convoTitle(cv) {
  const other = cv.members.find(x => x !== App.user.id); const u = DB.get('users', other); const co = userCompany(other);
  return { u, co, name: co ? co.name : u ? u.name : '?' };
}
let refreshThread = null;
function pMessages(v, p, q) {
  const me = App.user;
  const convos = DB.all('convos', c => c.members.includes(me.id)).sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  const cur = p.id ? DB.get('convos', p.id) : null;
  if (p.id && (!cur || !cur.members.includes(me.id))) { v.innerHTML = page({ title: t('e.forbiddenT'), body: empty('🔒', t('e.forbidden')) }); return; }
  const list = convos.map(c => { const ti = convoTitle(c); const last = DB.all('messages', m => m.convoId === c.id).pop(); const un = (c.unread || {})[me.id] || 0;
    return `<a href="#/messages/${c.id}" class="cv ${cur && cur.id === c.id ? 'on' : ''}">${logoImg(ti.co || { name: ti.name }, 'logo xs')}<div class="grow"><b>${esc(ti.name)}</b><small>${last ? esc((last.senderId === me.id ? t('msg.you') + ': ' : '') + (last.text || '📦 ' + t('msg.productShared'))).slice(0, 60) : t('msg.noMsgs')}</small></div>${un ? `<i class="cnt">${un}</i>` : ''}</a>`; }).join('');
  v.innerHTML = page({
    title: t('nav.messages'), crumbs: cur ? [[t('nav.messages'), '#/messages'], [convoTitle(cur).name]] : [[t('nav.messages')]], guideKey: 'messages',
    actions: `<a class="btn ghost" href="#/partners">✉️ ${t('msg.new')}</a>`,
    body: `<div class="chat card ${cur ? 'has-cur' : ''}"><div class="cv-list">${list || `<p class="muted pad">${t('msg.none')}</p>`}</div>
      <div class="thread">${cur ? `<div class="th-head"><a class="btn ghost sm mob-only" href="#/messages">←</a>${(() => { const ti = convoTitle(cur); return `${logoImg(ti.co || { name: ti.name }, 'logo xs')}<div><b>${esc(ti.name)}</b> ${verBadge(ti.co)}<small class="muted">${ti.u ? esc(ti.u.name) : ''}</small></div>${ti.co ? `<a class="btn ghost sm" href="#/c/${ti.co.id}">${t('ps.profile')}</a>` : ''}`; })()}</div>
        <div class="msgs" id="msgs" aria-live="polite"></div>
        <form class="composer" id="cmp"><button type="button" class="icon-btn" id="share" title="${t('msg.share')}" aria-label="${t('msg.share')}">📦</button>
          <textarea id="mtext" rows="1" placeholder="${t('msg.ph')}" aria-label="${t('msg.ph')}" maxlength="2000"></textarea><button class="btn primary" type="submit">${t('msg.send')} ➤</button></form>
        <p class="muted small pad">${t('msg.hint')}</p>`
      : `<div class="empty">${'💬'}<p>${t('msg.pick')}</p><p class="muted small">${t('msg.howStart')}</p></div>`}</div></div>`,
  });
  if (!cur) { refreshThread = null; return; }
  const box = $('#msgs');
  refreshThread = () => {
    const c = DB.get('convos', cur.id); if (!c) return;
    if ((c.unread || {})[me.id]) { const un = Object.assign({}, c.unread, { [me.id]: 0 }); DB.update('convos', c.id, { unread: un }); }
    const msgs = DB.all('messages', m => m.convoId === cur.id);
    box.innerHTML = msgs.length ? msgs.map(m => { const pr = m.productId ? DB.get('products', m.productId) : null;
      return `<div class="msg ${m.senderId === me.id ? 'me' : ''}">${m.text ? `<p>${esc(m.text)}</p>` : ''}${pr ? `<a class="msg-prod" href="#/p/${pr.id}">${pr.images && pr.images[0] ? `<img src="${esc(pr.images[0])}" alt="">` : ''}<span><b>${esc(pr.name)}</b><small>${money(pr.price, pr.currency)} / ${t('unit.' + pr.unit)} · ${t('f.moq')}: ${num(pr.moq)}</small></span></a>` : ''}<time>${fmtTime(m.createdAt)}</time></div>`; }).join('')
      : `<p class="muted center">${t('msg.first')}</p>`;
    box.scrollTop = box.scrollHeight;
    updateBadges();
  };
  refreshThread();
  const send = (text, productId) => {
    const c = DB.get('convos', cur.id); const other = c.members.find(x => x !== me.id);
    DB.insert('messages', { convoId: c.id, senderId: me.id, text, productId: productId || null });
    const prevUn = (c.unread || {})[other] || 0;
    DB.update('convos', c.id, { lastAt: DB.now(), unread: Object.assign({}, c.unread, { [other]: prevUn + 1 }) });
    if (!prevUn) DB.notify(other, 'n.newMessage', { name: App.company ? App.company.name : me.name }, '#/messages/' + c.id);
    refreshThread();
  };
  const ta = $('#mtext'), form = $('#cmp');
  ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
  form.onsubmit = e => { e.preventDefault(); const txt = ta.value.trim(); if (!txt) { ta.focus(); toast(t('msg.emptyErr'), 'error'); return; } send(txt); ta.value = ''; ta.focus(); };
  $('#share').onclick = () => {
    const mine = App.company ? DB.all('products', x => x.companyId === App.company.id && x.status === 'published') : [];
    const others = DB.all('products', x => x.status === 'published' && (!App.company || x.companyId !== App.company.id));
    const opt = arr => arr.map(x => `<label class="pick-item"><input type="radio" name="sp" value="${x.id}">${x.images && x.images[0] ? `<img src="${esc(x.images[0])}" alt="">` : ''}<span><b>${esc(x.name)}</b><small>${money(x.price, x.currency)} / ${t('unit.' + x.unit)}</small></span></label>`).join('');
    openModal({ title: t('msg.share'), ok: t('msg.send'), body: `<p class="muted">${t('msg.shareD')}</p>${mine.length ? `<h4>${t('msg.myProducts')}</h4>${opt(mine)}` : ''}<h4>${t('nav.marketplace')}</h4><div class="pick-list">${opt(others)}</div>`,
      onOk: w => { const s = $('input[name=sp]:checked', w); if (!s) { toast(t('v.choose'), 'error'); return false; } send('', s.value); toast(t('msg.shared')); } });
  };
  if (q.share) { const pr = DB.get('products', q.share); if (pr) ta.value = t('msg.aboutProduct', { name: pr.name }); ta.focus(); }
}

// ================= orders =================
function orderSteps(preId) {
  const me = App.user;
  const avail = () => DB.all('products', x => x.status === 'published' && x.ownerId !== me.id);
  return [
    { key: 'product', fields: [{ n: 'productId', type: 'productPick', req: 1, show: id => (DB.get('products', id) || {}).name || id,
      render: val => { const list = avail(); return `<input class="pick-search" type="search" placeholder="🔎 ${t('ord.searchPh')}" aria-label="${t('c.search')}"><div class="pick-list">${list.map(x => { const co = companyOf(x.companyId);
        return `<label class="pick-item ${val === x.id ? 'on' : ''}" data-s="${esc((x.name + ' ' + (co ? co.name : '')).toLowerCase())}"><input type="radio" name="productId" value="${x.id}" ${val === x.id ? 'checked' : ''}>${x.images && x.images[0] ? `<img src="${esc(x.images[0])}" alt="">` : ''}<span><b>${esc(x.name)}</b><small>${money(x.price, x.currency)} / ${t('unit.' + x.unit)} · ${t('f.moq')}: ${num(x.moq)} · ${co ? esc(co.name) : ''}</small></span></label>`; }).join('') || `<p class="muted">${t('mk.none')}</p>`}</div>`; } }] },
    { key: 'qty', extra: d => { const pr = DB.get('products', d.productId); return pr ? `<div class="card soft"><b>${esc(pr.name)}</b><p class="muted">${t('ord.priceInfo', { price: money(pr.price, pr.currency), unit: t('unit.' + pr.unit), moq: num(pr.moq), stock: num(pr.stock) })}</p><p class="total">${t('ord.total')}: <b id="otot">${d.qty ? money(pr.price * d.qty, pr.currency) : '—'}</b></p></div>` : ''; },
      fields: [{ n: 'qty', type: 'number', req: 1, min: 1, validate: (val, d) => { const pr = DB.get('products', d.productId); if (!pr) return 'v.choose'; if (val < pr.moq) return ['v.moq', { n: num(pr.moq) }]; if (val > pr.stock) return ['v.stock', { n: num(pr.stock) }]; return null; }, suffix: d => { const pr = DB.get('products', d.productId); return pr ? t('unit.' + pr.unit) : ''; } }] },
    { key: 'location', fields: [{ n: 'dcountry', type: 'select', req: 1, opts: countryOpts() }, { n: 'dcity', req: 1 }, { n: 'daddress', req: 1, minLen: 5 }] },
    { key: 'req', fields: [{ n: 'requirements', type: 'textarea', rows: 3 }, { n: 'desiredDate', type: 'date', validate: val => (val && val < new Date().toISOString().slice(0, 10) ? 'v.pastDate' : null) }] },
    { key: 'review', review: true },
    { key: 'submit', extra: d => { const pr = DB.get('products', d.productId); return pr ? `<div class="card soft"><p>${t('ord.summary', { qty: num(d.qty), unit: t('unit.' + pr.unit), name: pr.name, total: money(pr.price * d.qty, pr.currency) })}</p></div>` : ''; }, fields: [{ n: 'agree', type: 'checkbox', req: 1 }] },
  ];
}
function pOrderWizard(v, p, q) {
  const co = App.company;
  if (!co) { v.innerHTML = page({ title: t('ord.new'), guideKey: 'order', body: needCompanyBox() }); return; }
  const me = App.user;
  const initial = { dcountry: co.country, dcity: co.city, daddress: co.address };
  if (q.product) { const pr = DB.get('products', q.product); if (pr && pr.ownerId !== me.id) { initial.productId = pr.id; initial.qty = pr.moq; } }
  if (q.product) DB.clearDraft(me.id, 'order');
  v.innerHTML = page({ title: t('ord.new'), crumbs: [[t('nav.orders'), '#/orders'], [t('ord.new')]], guideKey: 'order', body: '<div id="wiz"></div>' });
  Wizard($('#wiz'), {
    wid: 'order', prefix: 'w.or.', steps: orderSteps(), initial, submitLabel: '📨 ' + t('ord.submit'), afterKey: 'w.or.after',
    onDraw: (d, root) => {
      const s = $('.pick-search', root);
      if (s) s.oninput = () => { const x = s.value.toLowerCase(); $$('.pick-item', root).forEach(el => (el.style.display = el.dataset.s.includes(x) ? '' : 'none')); };
      $$('.pick-item input', root).forEach(r => (r.onchange = () => { $$('.pick-item', root).forEach(el => el.classList.toggle('on', $('input', el).checked)); }));
    },
    onInput: (d, root) => { const el = $('#otot', root), pr = DB.get('products', d.productId); if (el && pr) el.textContent = d.qty ? money(pr.price * d.qty, pr.currency) : '—'; },
    onSubmit: async d => {
      const pr = DB.get('products', d.productId);
      if (!pr || pr.status !== 'published') throw new Error('productGone');
      const o = DB.insert('orders', { productId: pr.id, buyerId: me.id, buyerCompanyId: co.id, sellerId: pr.ownerId, sellerCompanyId: pr.companyId, productName: pr.name,
        qty: d.qty, unit: pr.unit, price: pr.price, currency: pr.currency, total: +(pr.price * d.qty).toFixed(2), country: d.dcountry, city: d.dcity, address: d.daddress,
        requirements: d.requirements || '', desiredDate: d.desiredDate || '', status: 'pending', history: [{ status: 'pending', at: DB.now(), by: me.id }] });
      DB.notify(pr.ownerId, 'n.newOrder', { product: pr.name }, '#/orders/' + o.id);
      toast(t('ord.created')); go('#/orders/' + o.id);
    },
  });
}
function pOrders(v, p, q) {
  const me = App.user; const tab = q.tab === 'sales' ? 'sales' : 'buy'; const st = q.status || '';
  let list = DB.all('orders', o => (tab === 'buy' ? o.buyerId === me.id : o.sellerId === me.id));
  const counts2 = {}; list.forEach(o => (counts2[o.status] = (counts2[o.status] || 0) + 1));
  if (st) list = list.filter(o => o.status === st);
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const salesPending = DB.all('orders', o => o.sellerId === me.id && o.status === 'pending').length;
  v.innerHTML = page({
    title: t('nav.orders'), crumbs: [[t('nav.orders')]], guideKey: 'orders', actions: `<a class="btn primary" href="#/orders/new">➕ ${t('ord.new')}</a>`,
    body: `<div class="tabs"><a href="#/orders" class="${tab === 'buy' ? 'on' : ''}">🛍 ${t('ord.buy')}</a><a href="#/orders?tab=sales" class="${tab === 'sales' ? 'on' : ''}">📥 ${t('ord.sales')} ${salesPending ? `<i class="cnt">${salesPending}</i>` : ''}</a></div>
      <div class="status-filter"><a href="#/orders?tab=${tab}" class="${!st ? 'on' : ''}">${t('c.all')}</a>${CATALOG.orderStatuses.map(s => `<a href="#/orders?tab=${tab}&status=${s}" class="${st === s ? 'on' : ''}">${t('st.' + s)} <small>${counts2[s] || 0}</small></a>`).join('')}</div>
      ${list.length ? `<div class="card table-wrap"><table class="table"><thead><tr><th>№</th><th>${t('f.pname')}</th><th>${tab === 'buy' ? t('ord.seller') : t('ord.buyer')}</th><th>${t('f.qty')}</th><th>${t('ord.total')}</th><th>${t('c.status')}</th><th>${t('c.date')}</th></tr></thead><tbody>
        ${list.map(o => { const other = companyOf(tab === 'buy' ? o.sellerCompanyId : o.buyerCompanyId); return `<tr class="click" data-href="#/orders/${o.id}"><td><a href="#/orders/${o.id}">#${o.id.slice(-6).toUpperCase()}</a></td><td>${esc(o.productName)}</td><td>${other ? esc(other.name) : '—'}</td><td>${num(o.qty)} ${t('unit.' + o.unit)}</td><td>${money(o.total, o.currency)}</td><td>${chip(o.status, 'st.')}</td><td>${fmtDate(o.createdAt)}</td></tr>`; }).join('')}</tbody></table></div>`
      : empty('🧾', t(tab === 'buy' ? 'ord.noneBuy' : 'ord.noneSales'), `<a class="btn primary" href="#/marketplace">${t('nav.marketplace')}</a>`)}`,
  });
  $$('tr.click', v).forEach(tr => (tr.onclick = e => { if (!e.target.closest('a')) go(tr.dataset.href); }));
}
const NEXT = { pending: ['accepted', 'cancelled'], accepted: ['processing', 'cancelled'], processing: ['shipped'], shipped: ['delivered'] };
function pOrder(v, p) {
  const me = App.user, o = DB.get('orders', p.id);
  if (!o) { pNotFound(v); return; }
  const isSeller = o.sellerId === me.id, isBuyer = o.buyerId === me.id;
  if (!isSeller && !isBuyer && me.role !== 'admin') { v.innerHTML = page({ title: t('e.forbiddenT'), body: empty('🔒', t('e.forbidden')) }); return; }
  const seller = companyOf(o.sellerCompanyId), buyer = companyOf(o.buyerCompanyId);
  let acts = [];
  if (isSeller) acts = NEXT[o.status] || [];
  else if (isBuyer) acts = o.status === 'pending' ? ['cancelled'] : o.status === 'shipped' ? ['delivered'] : [];
  const flow = ['pending', 'accepted', 'processing', 'shipped', 'delivered'];
  const idx = flow.indexOf(o.status);
  v.innerHTML = page({
    title: t('ord.title', { id: o.id.slice(-6).toUpperCase() }), crumbs: [[t('nav.orders'), '#/orders' + (isSeller ? '?tab=sales' : '')], ['#' + o.id.slice(-6).toUpperCase()]], guideKey: 'orderDetail',
    body: `<div class="card"><div class="row between"><h3>${t('c.status')}: ${chip(o.status, 'st.')}</h3><span class="muted">${isSeller ? t('ord.youSeller') : isBuyer ? t('ord.youBuyer') : t('role.admin')}</span></div>
      ${o.status === 'cancelled' ? `<p class="reason">✕ ${t('st.cancelled.d')}</p>` : `<ol class="timeline">${flow.map((s, i) => `<li class="${i < idx ? 'ok' : i === idx ? 'cur' : ''}"><span>${i <= idx ? '✓' : i + 1}</span><em>${t('st.' + s)}</em></li>`).join('')}</ol>`}
      <p class="muted">ℹ️ ${t('st.' + o.status + '.d')}</p>
      ${acts.length ? `<div class="row">${acts.map(s => `<button class="btn ${s === 'cancelled' ? 'ghost danger-t' : 'primary'}" data-act="orderSet" data-id="${o.id}" data-s="${s}">${t('ord.to.' + s)}</button>`).join('')}</div>` : ''}</div>
    <div class="grid-dash">
      <div class="card"><h3>📦 ${t('ord.details')}</h3><dl class="dl"><dt>${t('f.pname')}</dt><dd><a href="#/p/${o.productId}">${esc(o.productName)}</a></dd>
        <dt>${t('f.qty')}</dt><dd>${num(o.qty)} ${t('unit.' + o.unit)}</dd><dt>${t('f.price')}</dt><dd>${money(o.price, o.currency)} / ${t('unit.' + o.unit)}</dd>
        <dt>${t('ord.total')}</dt><dd><b>${money(o.total, o.currency)}</b></dd><dt>${t('ord.deliverTo')}</dt><dd>${esc(o.address)}, ${esc(o.city)}, ${tt('ctry.', o.country)}</dd>
        <dt>${t('f.requirements')}</dt><dd>${esc(o.requirements) || '—'}</dd><dt>${t('f.desiredDate')}</dt><dd>${o.desiredDate ? fmtDate(o.desiredDate) : '—'}</dd></dl></div>
      <div class="card"><h3>🤝 ${t('ord.parties')}</h3>
        <p><small class="muted">${t('ord.seller')}</small><br>${seller ? `<a href="#/c/${seller.id}">${esc(seller.name)}</a> ${verBadge(seller)}` : '—'}</p>
        <p><small class="muted">${t('ord.buyer')}</small><br>${buyer ? `<a href="#/c/${buyer.id}">${esc(buyer.name)}</a> ${verBadge(buyer)}` : '—'}</p>
        ${isSeller || isBuyer ? `<button class="btn ghost" data-act="chat" data-user="${isSeller ? o.buyerId : o.sellerId}">💬 ${t('ord.contact')}</button>` : ''}
        <h4>🕓 ${t('ord.history')}</h4><ul class="hist">${(o.history || []).map(h => `<li>${chip(h.status, 'st.')} <small class="muted">${fmtTime(h.at)}</small></li>`).join('')}</ul></div>
    </div>`,
  });
}
ACTIONS.orderSet = b => {
  const run = () => withLoading(b, async () => {
    const o = DB.get('orders', b.dataset.id), s = b.dataset.s, me = App.user;
    const isSeller = o.sellerId === me.id;
    const allowed = isSeller ? (NEXT[o.status] || []) : (o.status === 'pending' ? ['cancelled'] : o.status === 'shipped' ? ['delivered'] : []);
    if (!allowed.includes(s)) throw new Error('stale');
    if (s === 'accepted') { const pr = DB.get('products', o.productId); if (pr) { if (pr.stock < o.qty) throw new Error('noStock'); DB.update('products', pr.id, { stock: pr.stock - o.qty }); } }
    if (s === 'cancelled' && ['accepted'].includes(o.status)) { const pr = DB.get('products', o.productId); if (pr) DB.update('products', pr.id, { stock: pr.stock + o.qty }); }
    DB.update('orders', o.id, { status: s, history: (o.history || []).concat([{ status: s, at: DB.now(), by: me.id }]) });
    DB.notify(isSeller ? o.buyerId : o.sellerId, 'n.orderStatus', { product: o.productName, status: s }, '#/orders/' + o.id);
    toast(t('ord.changed', { status: t('st.' + s) })); render();
  });
  if (b.dataset.s === 'cancelled') confirmBox(t('ord.cancelConfirm'), async () => { run(); }); else run();
};

// ================= notifications =================
function nItem(n) {
  const params = Object.assign({}, n.params); if (params.status) params.status = t('st.' + params.status);
  return `<li class="${n.read ? '' : 'unread'}"><a href="${esc(n.link || '#/notifications')}" data-nid="${n.id}"><span class="dot"></span><span class="grow">${esc(t(n.key, params))}</span><small class="muted">${fmtTime(n.createdAt)}</small></a></li>`;
}
document.addEventListener('click', e => { const a = e.target.closest('[data-nid]'); if (a) { try { DB.update('notifs', a.dataset.nid, { read: true }); } catch (x) { /* ignore */ } } });
function pNotifs(v) {
  const me = App.user; const list = DB.all('notifs', n => n.userId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  v.innerHTML = page({
    title: t('nav.notifications'), crumbs: [[t('nav.notifications')]], guideKey: 'notifications',
    actions: list.length ? `<button class="btn ghost" data-act="readAll">✔ ${t('notif.readAll')}</button><button class="btn ghost" data-act="clearRead">🗑 ${t('notif.clear')}</button>` : '',
    body: list.length ? `<div class="card"><ul class="nlist big">${list.map(nItem).join('')}</ul></div>` : empty('🔕', t('notif.empty')),
  });
}
ACTIONS.readAll = () => { DB.all('notifs', n => n.userId === App.user.id && !n.read).forEach(n => DB.update('notifs', n.id, { read: true })); toast(t('c.saved')); render(); };
ACTIONS.clearRead = () => { DB.removeWhere('notifs', n => n.userId === App.user.id && n.read); toast(t('c.deleted')); render(); };

// ================= settings =================
function pSettings(v) {
  const u = App.user;
  v.innerHTML = page({
    title: t('nav.settings'), crumbs: [[t('nav.settings')]], guideKey: 'settings',
    body: `<div class="grid-dash">
      <div class="card"><h3>🌐 ${t('set.lang')}</h3><p class="muted">${t('set.langD')}</p><div class="cards">${LANGS.map(l => `<button class="opt-card ${l === App.lang ? 'on' : ''}" data-lang="${l}"><b>${{ uz: "O'zbekcha", en: 'English', ru: 'Русский' }[l]}</b><small>${l.toUpperCase()}</small></button>`).join('')}</div></div>
      <div class="card"><h3>👤 ${t('set.profile')}</h3><form id="sp"><div class="field" data-field="name"><label class="f-label" for="s_name">${t('f.fullName')} <span class="req">*</span></label><input id="s_name" name="name" value="${esc(u.name)}"><p class="f-err"></p></div>
        <div class="field"><label class="f-label">${t('f.email')}</label><input value="${esc(u.email)}" disabled><p class="f-help">${t('set.emailNote')}</p></div><button class="btn primary">${t('c.save')}</button></form></div>
      <div class="card"><h3>🔑 ${t('set.password')}</h3><form id="spw">
        <div class="field" data-field="old"><label class="f-label" for="s_old">${t('set.oldPass')} <span class="req">*</span></label><input id="s_old" type="password" name="old" autocomplete="current-password"><p class="f-err"></p></div>
        <div class="field" data-field="password"><label class="f-label" for="s_new">${t('set.newPass')} <span class="req">*</span></label><input id="s_new" type="password" name="password" autocomplete="new-password"><p class="f-help">${t('auth.passHelp')}</p><p class="f-err"></p></div>
        <div class="field" data-field="password2"><label class="f-label" for="s_new2">${t('auth.password2')} <span class="req">*</span></label><input id="s_new2" type="password" name="password2" autocomplete="new-password"><p class="f-err"></p></div>
        <button class="btn primary">${t('set.changePass')}</button></form></div>
      <div class="card"><h3>🗄 ${t('set.data')}</h3><p class="muted">${t('set.dataD')}</p><div class="row wrap">
        <button class="btn ghost" data-act="exportData">⬇️ ${t('set.export')}</button>
        <button class="btn ghost" data-act="resetData">♻️ ${t('set.reset')}</button>
        <button class="btn ghost danger-t" data-act="delAccount">🗑 ${t('set.delete')}</button></div></div>
    </div>`,
  });
  const sp = $('#sp'); sp.onsubmit = e => { e.preventDefault(); const n = sp.name.value.trim(); if (!formErrors(sp, n.length < 3 ? { name: 'v.name' } : {})) return;
    withLoading($('button', sp), async () => { DB.update('users', u.id, { name: n }); toast(t('c.saved')); render(); }); };
  const pw = $('#spw'); pw.onsubmit = e => { e.preventDefault(); const d = Object.fromEntries(new FormData(pw)); const errs = {};
    if (!d.old) errs.old = 'v.required';
    if (!d.password || d.password.length < 6 || !/\d/.test(d.password) || !/[a-zA-Z]/.test(d.password)) errs.password = 'v.password';
    if (d.password2 !== d.password) errs.password2 = 'v.password2';
    if (!formErrors(pw, errs)) return;
    withLoading($('button', pw), async () => { await DB.changePassword(u.id, d.old, d.password); pw.reset(); toast(t('set.passChanged')); }); };
}
ACTIONS.exportData = () => {
  const u = App.user; const co = App.company;
  const data = { user: { name: u.name, email: u.email, role: u.role }, company: co, products: co ? DB.all('products', p => p.companyId === co.id) : [],
    orders: DB.all('orders', o => o.buyerId === u.id || o.sellerId === u.id), requests: co ? DB.all('requests', r => r.fromCompanyId === co.id || r.toCompanyId === co.id) : [] };
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); a.download = 'industry-hub-my-data.json'; a.click();
  toast(t('set.exported'));
};
ACTIONS.resetData = () => confirmBox(t('set.resetConfirm'), async () => { await DB.reset(); toast(t('set.resetDone'), 'info'); go('#/'); });
ACTIONS.delAccount = () => confirmBox(t('set.deleteConfirm'), async () => {
  const u = App.user, co = App.company;
  if (u.role === 'admin' && DB.all('users', x => x.role === 'admin').length < 2) throw new Error('lastAdmin');
  if (co) { DB.removeWhere('products', p => p.companyId === co.id); DB.removeWhere('requests', r => r.fromCompanyId === co.id || r.toCompanyId === co.id); DB.remove('companies', co.id); }
  DB.removeWhere('drafts', d => d.userId === u.id); DB.removeWhere('notifs', n => n.userId === u.id); DB.logout(); DB.remove('users', u.id);
  toast(t('set.deleted'), 'info'); go('#/');
});

// ================= help =================
const HELP = [['register', '#/onboarding', '🏢'], ['verify', '#/company', '🛡️'], ['products', '#/products/new', '📦'], ['partners', '#/partners', '🤝'], ['orders', '#/orders/new', '🧾'], ['messages', '#/messages', '💬']];
function pHelp(v, p, q) {
  const s = (q.q || '').toLowerCase();
  const topics = HELP.filter(([k]) => !s || (t('help.' + k) + t('help.' + k + '.d') + t('help.' + k + '.steps')).toLowerCase().includes(s));
  const faqs = [1, 2, 3, 4, 5, 6, 7, 8].filter(i => !s || (t('faq.' + i + '.q') + t('faq.' + i + '.a')).toLowerCase().includes(s));
  v.innerHTML = page({
    title: t('nav.help'), crumbs: [[t('nav.help')]], guideKey: 'help',
    body: `<form class="card filters" id="hf"><input name="q" value="${esc(q.q || '')}" placeholder="🔎 ${t('help.searchPh')}" aria-label="${t('c.search')}"><button class="btn primary">${t('c.search')}</button></form>
      <h2>📚 ${t('help.tutorials')}</h2>${topics.length ? `<div class="grid3">${topics.map(([k, , ico]) => `<a class="card feat link-card" href="#/help/${k}"><span class="ico">${ico}</span><h3>${t('help.' + k)}</h3><p>${t('help.' + k + '.d')}</p><span class="more">${t('help.read')} →</span></a>`).join('')}</div>` : `<p class="muted">${t('help.none')}</p>`}
      <h2>❓ ${t('help.faq')}</h2><div class="card faq">${faqs.map(i => `<details><summary>${t('faq.' + i + '.q')}</summary><p>${t('faq.' + i + '.a')}</p></details>`).join('') || `<p class="muted">${t('help.none')}</p>`}</div>
      <div class="card notice"><h3>📬 ${t('help.contactT')}</h3><p>${t('help.contact')}</p></div>`,
  });
  const f = $('#hf'); f.onsubmit = e => { e.preventDefault(); const val = f.q.value.trim(); go('#/help' + (val ? '?q=' + encodeURIComponent(val) : '')); };
}
function pHelpTopic(v, p) {
  const h = HELP.find(x => x[0] === p.topic); if (!h) { pNotFound(v); return; }
  const [k, link, ico] = h; const steps = t('help.' + k + '.steps').split('|');
  v.innerHTML = page({
    title: ico + ' ' + t('help.' + k), crumbs: [[t('nav.help'), '#/help'], [t('help.' + k)]],
    body: `<div class="card"><p>${t('help.' + k + '.d')}</p><ol class="tutorial">${steps.map((s, i) => `<li><span>${i + 1}</span><p>${esc(s)}</p></li>`).join('')}</ol>
      <div class="row"><a class="btn primary" href="${App.user ? link : '#/register'}">${t('help.tryNow')} →</a><a class="btn ghost" href="#/help">${t('help.allTopics')}</a></div></div>
      <div class="card notice"><p>💡 ${t('help.' + k + '.tip')}</p></div>`,
  });
}

// ================= admin =================
function pAdmin(v, p, q) {
  const tab = q.tab || 'pending';
  const cos = DB.all('companies');
  const list = (tab === 'all' ? cos : tab === 'users' ? [] : cos.filter(c => c.verification === tab)).sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
  const users = DB.all('users');
  const st = { users: users.length, cos: cos.length, ver: cos.filter(c => c.verification === 'verified').length, pen: cos.filter(c => c.verification === 'pending').length, pr: DB.all('products').length, ord: DB.all('orders').length };
  v.innerHTML = page({
    title: t('nav.admin'), crumbs: [[t('nav.admin')]], guideKey: 'admin',
    body: `<div class="tiles six">${[['users', st.users, '👥'], ['cos', st.cos, '🏢'], ['ver', st.ver, '✔'], ['pen', st.pen, '⏳'], ['pr', st.pr, '📦'], ['ord', st.ord, '🧾']].map(([k, n, i]) => `<div class="tile"><b>${n}</b><span>${i} ${t('adm.s.' + k)}</span></div>`).join('')}</div>
      <div class="card notice small">ℹ️ ${t('ver.registryNote')}</div>
      <div class="tabs">${['pending', 'verified', 'rejected', 'all', 'users'].map(x => `<a href="#/admin?tab=${x}" class="${tab === x ? 'on' : ''}">${t('adm.tab.' + x)}${x === 'pending' && st.pen ? ` <i class="cnt">${st.pen}</i>` : ''}</a>`).join('')}</div>
      ${tab === 'users' ? `<div class="card table-wrap"><table class="table"><thead><tr><th>${t('f.fullName')}</th><th>${t('f.email')}</th><th>${t('adm.role')}</th><th>${t('nav.company')}</th><th></th></tr></thead><tbody>
        ${users.map(x => { const c = userCompany(x.id); return `<tr><td>${esc(x.name)}${x.blocked ? ` <span class="chip s-rejected">${t('adm.blocked')}</span>` : ''}</td><td>${esc(x.email)}</td><td>${t('role.' + x.role)}</td><td>${c ? `<a href="#/c/${c.id}">${esc(c.name)}</a>` : '—'}</td>
          <td class="t-act">${x.id === App.user.id ? `<small class="muted">${t('adm.you')}</small>` : `<button class="btn ghost sm" data-act="admRole" data-id="${x.id}">${x.role === 'admin' ? t('adm.makeUser') : t('adm.makeAdmin')}</button><button class="btn ghost sm ${x.blocked ? '' : 'danger-t'}" data-act="admBlock" data-id="${x.id}">${x.blocked ? t('adm.unblock') : t('adm.block')}</button>`}</td></tr>`; }).join('')}</tbody></table></div>`
      : list.length ? `<div class="colist">${list.map(c => { const owner = DB.get('users', c.ownerId); const dup = cos.filter(x => x.stir === c.stir).length > 1; return `<div class="card co-row">${logoImg(c, 'logo sm')}<div class="grow">
          <a href="#/c/${c.id}"><b>${esc(c.name)}</b></a> ${chip(c.verification, 'vs.')}
          <dl class="dl compact"><dt>${t('f.stir')}</dt><dd><code>${esc(c.stir)}</code> ${/^\d{9}$/.test(c.stir) ? `<span class="ok-t">✔ ${t('adm.formatOk')}</span>` : `<span class="danger-t">✕ ${t('v.stirFormat')}</span>`} ${dup ? `<span class="danger-t">⚠ ${t('v.stirDuplicate')}</span>` : ''}</dd>
          <dt>${t('adm.owner')}</dt><dd>${owner ? esc(owner.name) + ' · ' + esc(owner.email) : '—'}</dd><dt>${t('f.address')}</dt><dd>${esc(c.address)}, ${esc(c.city)}, ${tt('ctry.', c.country)}</dd>
          <dt>${t('adm.submitted')}</dt><dd>${fmtTime(c.submittedAt || c.createdAt)}</dd>${c.verifyNote ? `<dt>${t('ver.reason')}</dt><dd>${esc(c.verifyNote)}</dd>` : ''}</dl></div>
          <div class="co-act">${c.verification !== 'verified' ? `<button class="btn primary sm" data-act="admVerify" data-id="${c.id}">✔ ${t('adm.approve')}</button>` : ''}${c.verification !== 'rejected' ? `<button class="btn ghost sm danger-t" data-act="admReject" data-id="${c.id}">✕ ${c.verification === 'verified' ? t('adm.revoke') : t('adm.reject')}</button>` : ''}</div></div>`; }).join('')}</div>`
      : empty('🎉', t('adm.empty'))}`,
  });
}
ACTIONS.admVerify = b => withLoading(b, async () => {
  const c = DB.get('companies', b.dataset.id); if (App.user.role !== 'admin') throw new Error('forbidden');
  if (DB.all('companies', x => x.stir === c.stir && x.id !== c.id && x.verification === 'verified').length) throw new Error('stirTaken');
  DB.update('companies', c.id, { verification: 'verified', verifyNote: '', verifiedAt: DB.now(), verifiedBy: App.user.id });
  DB.notify(c.ownerId, 'n.verified', { company: c.name }, '#/company'); toast(t('adm.approved')); render();
});
ACTIONS.admReject = b => {
  const c = DB.get('companies', b.dataset.id);
  openModal({ title: t('adm.rejectT', { company: c.name }), ok: t('adm.reject'), danger: true,
    body: `<div class="field" data-field="r"><label class="f-label" for="rr">${t('ver.reason')} <span class="req">*</span></label><textarea id="rr" rows="3" placeholder="${esc(t('adm.reasonEx'))}"></textarea><p class="f-help">${t('adm.reasonHelp')}</p><p class="f-err"></p></div>`,
    onOk: w => { const r = $('#rr', w).value.trim(); if (r.length < 5) { const fe = $('[data-field=r]', w); fe.classList.add('err'); $('.f-err', fe).textContent = '⚠ ' + t('v.minLen', { n: 5 }); return false; }
      DB.update('companies', c.id, { verification: 'rejected', verifyNote: r }); DB.notify(c.ownerId, 'n.rejected', { company: c.name, reason: r }, '#/company'); toast(t('adm.rejected')); render(); } });
};
ACTIONS.admRole = b => withLoading(b, async () => { const x = DB.get('users', b.dataset.id); DB.update('users', x.id, { role: x.role === 'admin' ? 'user' : 'admin' }); toast(t('c.saved')); render(); });
ACTIONS.admBlock = b => withLoading(b, async () => { const x = DB.get('users', b.dataset.id); DB.update('users', x.id, { blocked: !x.blocked }); toast(t('c.saved')); render(); });

function pNotFound(v) { v.innerHTML = page({ title: t('e.404T'), body: empty('🧭', t('e.404'), `<a class="btn primary" href="${App.user ? '#/dashboard' : '#/'}">${t('nav.home')}</a>`) }); }

// ================= routes & boot =================
route('/', (v) => (App.user ? go('#/dashboard') : pLanding(v)), { pub: true });
route('/login', pLogin, { pub: true, guest: true });
route('/register', pRegister, { pub: true, guest: true });
route('/help', pHelp, { pub: true });
route('/help/:topic', pHelpTopic, { pub: true });
route('/marketplace', pMarket, { pub: true });
route('/p/:id', pProduct, { pub: true });
route('/c/:id', pCompanyPublic, { pub: true });
route('/dashboard', pDashboard);
route('/onboarding', (v) => (App.company ? go('#/company/edit') : pCompanyWizard(v)));
route('/company', pCompany);
route('/company/edit', (v) => (App.company ? pCompanyWizard(v) : go('#/onboarding')));
route('/products', pMyProducts);
route('/products/new', pProductWizard);
route('/products/:id/edit', pProductWizard);
route('/partners', pPartners);
route('/requests', pRequests);
route('/messages', pMessages);
route('/messages/:id', pMessages);
route('/orders', pOrders);
route('/orders/new', pOrderWizard);
route('/orders/:id', pOrder);
route('/notifications', pNotifs);
route('/settings', pSettings);
route('/admin', pAdmin, { admin: true });

(async function boot() {
  let l = null, saved = null; try { l = saved = localStorage.getItem('ih_lang'); } catch (e) { /* ignore */ }
  if (!l) { const n = (navigator.language || 'uz').slice(0, 2); l = LANGS.includes(n) ? n : 'uz'; }
  App.lang = l; document.documentElement.lang = l;
  await DB.init();
  const me = DB.me(); if (me && me.lang && !saved) App.lang = me.lang;
  render();
})();
