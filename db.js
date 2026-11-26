/* Industry Hub — data layer.
 * Browser database (localStorage) with CRUD, password hashing, sessions and seed data.
 * The API (all/get/insert/update/remove) is shaped so it can later be swapped
 * for a real backend (e.g. Supabase/PostgreSQL) without touching the UI code. */

const CATALOG = {
  categories: ['cotton', 'yarn', 'fabric', 'knitwear', 'garments', 'home', 'trims', 'equipment'],
  businessTypes: ['manufacturer', 'supplier', 'wholesaler', 'retailer', 'distributor', 'other'],
  countries: ['Uzbekistan', 'Kazakhstan', 'Kyrgyzstan', 'Tajikistan', 'Turkmenistan', 'Russia', 'Turkey', 'China', 'Germany', 'Other'],
  markets: ['uz', 'cis', 'ru', 'eu', 'tr', 'cn', 'me', 'us'],
  employees: ['1-10', '11-50', '51-200', '201-500', '500+'],
  units: ['meter', 'kg', 'piece', 'ton', 'roll'],
  currencies: ['USD', 'UZS'],
  delivery: ['pickup', 'seller', 'agreement'],
  orderStatuses: ['pending', 'accepted', 'processing', 'shipped', 'delivered', 'cancelled'],
};

const DB = (() => {
  const KEY = 'ih_db_v1';
  const SKEY = 'ih_session';
  const COLS = ['users', 'companies', 'products', 'requests', 'convos', 'messages', 'orders', 'notifs', 'drafts'];
  let mem = null;          // in-memory fallback if localStorage is unavailable
  let state = null;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return mem ? mem[k] : null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { mem = mem || {}; mem[k] = v; return e.name !== 'QuotaExceededError'; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { if (mem) delete mem[k]; } },
  };

  function empty() { const s = { v: 1 }; COLS.forEach(c => (s[c] = [])); return s; }
  function load() {
    try { state = JSON.parse(store.get(KEY)); } catch (e) { state = null; }
    if (!state || !state.v) state = empty();
    COLS.forEach(c => { if (!Array.isArray(state[c])) state[c] = []; });
  }
  function persist() {
    const ok = store.set(KEY, JSON.stringify(state));
    if (!ok) throw new Error('storage');
  }
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const now = () => new Date().toISOString();
  const clone = o => JSON.parse(JSON.stringify(o));

  function all(col, fn) { const rows = state[col].map(clone); return fn ? rows.filter(fn) : rows; }
  function get(col, id) { const r = state[col].find(x => x.id === id); return r ? clone(r) : null; }
  function find(col, fn) { const r = state[col].find(fn); return r ? clone(r) : null; }
  function insert(col, obj) {
    const row = Object.assign({ id: uid(), createdAt: now(), updatedAt: now() }, obj);
    state[col].push(row); persist(); return clone(row);
  }
  function update(col, id, patch) {
    const i = state[col].findIndex(x => x.id === id);
    if (i < 0) throw new Error('notfound');
    state[col][i] = Object.assign({}, state[col][i], patch, { updatedAt: now() });
    persist(); return clone(state[col][i]);
  }
  function remove(col, id) { state[col] = state[col].filter(x => x.id !== id); persist(); }
  function removeWhere(col, fn) { state[col] = state[col].filter(x => !fn(x)); persist(); }

  async function hash(password, salt) {
    const text = salt + '::' + password;
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 5381; for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
    return 'x' + (h >>> 0).toString(16);
  }

  // ---------- auth ----------
  async function register({ name, email, password }) {
    email = email.trim().toLowerCase();
    if (find('users', u => u.email === email)) throw new Error('emailTaken');
    const salt = uid();
    return insert('users', { name: name.trim(), email, salt, pass: await hash(password, salt), role: 'user', lang: null });
  }
  async function login(email, password, remember) {
    email = email.trim().toLowerCase();
    const u = state.users.find(x => x.email === email);
    if (!u || u.pass !== await hash(password, u.salt)) throw new Error('badLogin');
    if (u.blocked) throw new Error('blocked');
    startSession(u.id, remember); return clone(u);
  }
  async function changePassword(userId, oldP, newP) {
    const u = state.users.find(x => x.id === userId);
    if (u.pass !== await hash(oldP, u.salt)) throw new Error('badPassword');
    const salt = uid(); update('users', userId, { salt, pass: await hash(newP, salt) });
  }
  // Session: per-tab (sessionStorage) so two users can be logged in in two tabs for demo;
  // "remember me" also keeps it in localStorage.
  const sess = {
    get() { try { return sessionStorage.getItem(SKEY); } catch (e) { return null; } },
    set(v) { try { sessionStorage.setItem(SKEY, v); } catch (e) { /* ignore */ } },
    del() { try { sessionStorage.removeItem(SKEY); } catch (e) { /* ignore */ } },
  };
  function logout() { const id = me() && me().id; sess.del(); if (store.get(SKEY) === id) store.del(SKEY); try { sessionStorage.setItem('ih_out', '1'); } catch (e) { /* ignore */ } }
  function me() {
    let out = false; try { out = sessionStorage.getItem('ih_out') === '1'; } catch (e) { /* ignore */ }
    const id = sess.get() || (out ? null : store.get(SKEY));
    return id ? get('users', id) : null;
  }
  function startSession(id, remember) {
    try { sessionStorage.removeItem('ih_out'); } catch (e) { /* ignore */ }
    sess.set(id); if (remember) store.set(SKEY, id);
  }
  function myCompany(userId) { return find('companies', c => c.ownerId === userId); }

  // ---------- notifications ----------
  function notify(userId, key, params, link) {
    if (!userId) return;
    insert('notifs', { userId, key, params: params || {}, link: link || '', read: false });
  }
  function notifyAdmins(key, params, link) { state.users.filter(u => u.role === 'admin').forEach(a => notify(a.id, key, params, link)); }

  // ---------- drafts (save progress) ----------
  function getDraft(userId, wid) { return find('drafts', d => d.userId === userId && d.wid === wid); }
  function saveDraft(userId, wid, step, data) {
    const d = getDraft(userId, wid);
    if (d) update('drafts', d.id, { step, data }); else insert('drafts', { userId, wid, step, data });
  }
  function clearDraft(userId, wid) { removeWhere('drafts', d => d.userId === userId && d.wid === wid); }

  // ---------- seed demo data ----------
  async function seed() {
    state = empty();
    const mk = async (name, email, pass, role) => {
      const salt = uid();
      return insert('users', { name, email, salt, pass: await hash(pass, salt), role, lang: null });
    };
    const admin = await mk('Admin', 'admin@industryhub.uz', 'admin123', 'admin');
    const u1 = await mk('Aziz Karimov', 'aziz@demo.uz', 'demo123', 'user');
    const u2 = await mk('Dilnoza Rahimova', 'dilnoza@demo.uz', 'demo123', 'user');
    const u3 = await mk('Sergey Ivanov', 'sergey@demo.uz', 'demo123', 'user');
    const u4 = await mk('Bekzod Tursunov', 'bekzod@demo.uz', 'demo123', 'user');

    const logo = (txt, color) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" rx="24" fill="${color}"/><text x="60" y="74" font-family="Arial" font-size="44" font-weight="700" fill="#fff" text-anchor="middle">${txt}</text></svg>`);
    const pic = (label, c1, c2) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"><defs><pattern id="p" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M0 8h16M8 0v16" stroke="${c2}" stroke-width="3" opacity=".35"/></pattern></defs><rect width="480" height="360" fill="${c1}"/><rect width="480" height="360" fill="url(#p)"/><text x="240" y="196" font-family="Arial" font-size="34" font-weight="700" fill="#fff" text-anchor="middle">${label}</text></svg>`);

    const base = (o) => Object.assign({ website: '', logo: '', verification: 'pending', verifyNote: '', submittedAt: now() }, o);
    const c1 = insert('companies', base({
      ownerId: u1.id, fullName: u1.name, phone: '+998 90 123 45 67', email: u1.email, country: 'Uzbekistan', city: 'Namangan',
      name: 'Namangan Textile LLC', stir: '305123456', logo: logo('NT', '#0f766e'), category: 'fabric', address: 'Namangan, Uychi street 12',
      description: 'Cotton fabric and knit fabric producer with a full dyeing line. Exports to CIS and Europe.',
      businessType: 'manufacturer', products: 'Cotton fabric, knit fabric (single jersey, interlock), dyed fabric',
      capacity: '300 000 meters / month', employees: '201-500', experience: 12, markets: ['uz', 'cis', 'eu'],
      verification: 'verified', verifiedAt: now() }));
    const c2 = insert('companies', base({
      ownerId: u2.id, fullName: u2.name, phone: '+998 91 222 33 44', email: u2.email, country: 'Uzbekistan', city: 'Tashkent',
      name: 'Silk Road Garments', stir: '306987654', logo: logo('SR', '#b45309'), category: 'garments', address: 'Tashkent, Chilonzor 7',
      description: 'Sewing factory: T-shirts, polo and children wear. Works on private label orders from 500 pcs.',
      businessType: 'manufacturer', products: 'T-shirts, polo shirts, kids wear', capacity: '40 000 pieces / month',
      employees: '51-200', experience: 7, markets: ['uz', 'ru', 'eu'], verification: 'verified', verifiedAt: now() }));
    const c3 = insert('companies', base({
      ownerId: u3.id, fullName: u3.name, phone: '+7 916 555 12 12', email: u3.email, country: 'Russia', city: 'Moscow',
      name: 'Moscow Textile Trade', stir: '207445566', logo: logo('MT', '#4338ca'), category: 'fabric', address: 'Moscow, Leninsky prospekt 40',
      description: 'Wholesale buyer and distributor of cotton fabrics and garments for retail chains in Russia.',
      businessType: 'wholesaler', products: 'Fabric and garment wholesale', capacity: '20 containers / year',
      employees: '11-50', experience: 9, markets: ['ru', 'cis'], verification: 'pending' }));
    const c4 = insert('companies', base({
      ownerId: u4.id, fullName: u4.name, phone: '+998 93 777 88 99', email: u4.email, country: 'Uzbekistan', city: 'Fergana',
      name: 'Fergana Yarn Mill', stir: '304111222', logo: logo('FY', '#be123c'), category: 'yarn', address: 'Fergana, Industrial zone 3',
      description: '100% cotton combed and carded yarn, Ne 20/1 – Ne 40/1. Uzbek cotton, own spinning.',
      businessType: 'manufacturer', products: 'Cotton yarn Ne 20/1, Ne 30/1, Ne 40/1', capacity: '600 tons / month',
      employees: '201-500', experience: 15, markets: ['uz', 'tr', 'cn', 'eu'], verification: 'verified', verifiedAt: now() }));

    const prod = (c, o) => insert('products', Object.assign({
      companyId: c.id, ownerId: c.ownerId, status: 'published', currency: 'USD', certificates: '', color: '', density: '', width: '',
      composition: '', delivery: 'agreement', leadTime: 14, country: c.country, city: c.city, views: 0 }, o));
    const p1 = prod(c1, { name: 'Cotton fabric (calico)', category: 'fabric', images: [pic('Cotton fabric', '#0f766e', '#ffffff')],
      description: 'Plain weave 100% cotton fabric, bleached or dyed. Suitable for bedding and shirts.',
      composition: '100% cotton', density: '140 g/m²', width: '220 cm', color: 'White, any Pantone', certificates: 'OEKO-TEX Standard 100',
      price: 5, unit: 'meter', moq: 100, stock: 50000, delivery: 'seller', leadTime: 10 });
    const p2 = prod(c1, { name: 'Single jersey knit fabric', category: 'knitwear', images: [pic('Single jersey', '#155e75', '#ffffff')],
      description: 'Combed cotton single jersey for T-shirts, open width.', composition: '95% cotton, 5% elastane', density: '180 g/m²',
      width: '180 cm', color: '30+ colors', price: 7.2, unit: 'kg', moq: 300, stock: 12000, leadTime: 12 });
    prod(c2, { name: 'Basic cotton T-shirt', category: 'garments', images: [pic('T-shirt', '#b45309', '#ffffff')],
      description: 'Unisex T-shirt, private label available, sizes XS–3XL.', composition: '100% cotton', density: '160 g/m²',
      color: 'Any', price: 3.4, unit: 'piece', moq: 500, stock: 20000, delivery: 'agreement', leadTime: 25 });
    prod(c4, { name: 'Cotton yarn Ne 30/1 combed', category: 'yarn', images: [pic('Yarn Ne 30/1', '#be123c', '#ffffff')],
      description: 'Ring spun combed cotton yarn for knitting. Uzbek cotton.', composition: '100% cotton', certificates: 'BCI, OEKO-TEX',
      price: 2.9, unit: 'kg', moq: 1000, stock: 250000, delivery: 'seller', leadTime: 7 });
    prod(c4, { name: 'Raw cotton fiber', category: 'cotton', images: [pic('Cotton fiber', '#9f1239', '#ffffff')],
      description: 'Medium staple cotton fiber, class 1-2.', composition: '100% cotton', price: 1650, unit: 'ton', moq: 20, stock: 800, leadTime: 20 });

    const r = insert('requests', { fromCompanyId: c2.id, toCompanyId: c1.id, fromUserId: u2.id, toUserId: u1.id,
      message: 'We need 20 000 m of single jersey monthly for our T-shirt line. Let us work together.', status: 'accepted' });
    insert('requests', { fromCompanyId: c3.id, toCompanyId: c1.id, fromUserId: u3.id, toUserId: u1.id,
      message: 'We are a wholesaler in Moscow and would like to become your distributor in Russia.', status: 'pending' });

    const cv = insert('convos', { members: [u1.id, u2.id], lastAt: now(), unread: { [u1.id]: 1, [u2.id]: 0 } });
    insert('messages', { convoId: cv.id, senderId: u2.id, text: 'Hello! Can you send a price for single jersey 180 g/m², 2 000 kg?' });
    insert('messages', { convoId: cv.id, senderId: u1.id, text: 'Hello Dilnoza! Yes, here is the product card:', productId: p2.id });
    insert('messages', { convoId: cv.id, senderId: u2.id, text: 'Thank you, we will place an order this week.' });

    insert('orders', { productId: p1.id, buyerId: u3.id, buyerCompanyId: c3.id, sellerId: u1.id, sellerCompanyId: c1.id,
      productName: p1.name, qty: 5000, unit: 'meter', price: 5, currency: 'USD', total: 25000, country: 'Russia', city: 'Moscow',
      address: 'Moscow, warehouse 4', requirements: 'Width 220 cm, white color, packed in rolls of 100 m.', desiredDate: '',
      status: 'pending', history: [{ status: 'pending', at: now() }] });

    notify(u1.id, 'n.newRequest', { company: c3.name }, '#/requests');
    notify(u1.id, 'n.newOrder', { product: p1.name }, '#/orders');
    notify(admin.id, 'n.verifyNew', { company: c3.name }, '#/admin');
    persist();
  }

  async function init() { load(); if (!state.users.length) await seed(); }
  async function reset() { store.del(SKEY); sess.del(); await seed(); }
  function exportAll() { return clone(state); }

  return { init, reload: load, startSession, reset, all, get, find, insert, update, remove, removeWhere, register, login, logout, me, myCompany,
    changePassword, notify, notifyAdmins, getDraft, saveDraft, clearDraft, exportAll, uid, now };
})();
