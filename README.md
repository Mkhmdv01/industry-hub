# Industry Hub — to'qimachilik sanoati uchun B2B platforma

**Industry Hub** to'qimachilik ishlab chiqaruvchilari, yetkazib beruvchilar, ulgurji savdogarlar va xaridorlarni bitta platformada bog'laydi. Kompaniya STIR orqali tasdiqlanadi, mahsulot joylaydi, hamkor topadi, yozishadi va buyurtma qabul qiladi. Har bir jarayon bosqichma-bosqich tushuntiriladi, interfeys 3 tilda ishlaydi: o'zbek, ingliz va rus.

> Yo'nalish: **to'qimachilik** (paxta tolasi → ip → mato → trikotaj → tayyor kiyim). Mahsulot formasida sohaga xos maydonlar bor: tarkib, zichlik (g/m²), eni, sertifikatlar (OEKO-TEX, BCI), MOQ.

## 🚀 Ishga tushirish

O'rnatish yoki build qilish shart emas, loyiha toza HTML/CSS/JavaScript'da yozilgan.

- **GitHub Pages:** Settings → Pages → Branch: `main` / root → Save. Bir daqiqadan so'ng sayt `https://<username>.github.io/<repo>/` manzilida ochiladi.
- **Lokal:** `index.html` faylini brauzerda oching yoki `python3 -m http.server` buyrug'ini ishga tushirib, `http://localhost:8000` manzilini oching.

## 🎯 Demo akkauntlar

| Rol | Email | Parol |
|---|---|---|
| Administrator | admin@industryhub.uz | admin123 |
| Ishlab chiqaruvchi (tasdiqlangan) | aziz@demo.uz | demo123 |
| Tikuv fabrikasi (tasdiqlangan) | dilnoza@demo.uz | demo123 |
| Ulgurji xaridor (kutilmoqda) | sergey@demo.uz | demo123 |
| Ip fabrikasi (tasdiqlangan) | bekzod@demo.uz | demo123 |

💡 **Jonli chat demosi:** ikkita brauzer oynasida ikki xil akkaunt bilan kiring. Xabarlar va bildirishnomalar boshqa oynada darhol paydo bo'ladi. Har bir oyna o'z sessiyasini saqlaydi.

## ✅ Texnik topshiriq bo'yicha bajarilganlar

| № | Talab | Qayerda |
|---|---|---|
| 1 | Bosqichma-bosqich yo'riqnoma: har bir sahifada 5 savol (Bu nima? Nima uchun? Nima kiritiladi? Qanday? Keyin nima?), "1/5-qadam" progress, Oldinga/Orqaga, "Saqlab, keyinroq davom etish" | Barcha sahifalar, `Wizard` dvigateli |
| 2 | Kompaniya ro'yxatdan o'tishi (5 qadam), oxirgi qadamda tekshirish va tahrirlash | `#/onboarding` |
| 3 | Mahsulot qo'shish (6 qadam), har bir maydon yonida misol va "Misolni qo'yish" tugmasi | `#/products/new` |
| 4 | Hamkor qidirish: soha, davlat/shahar, biznes turi, kalit so'z, tayyor misollar, profil, hamkorlik so'rovi | `#/partners`, `#/c/:id`, `#/requests` |
| 5 | Buyurtma (6 qadam) va statuslar: Kutilmoqda → Qabul qilindi → Jarayonda → Yuborildi → Yetkazildi / Bekor qilindi | `#/orders/new`, `#/orders/:id` |
| 6 | Xabarlar: suhbat boshlash, yuborish va qabul qilish, mahsulot kartasini ulashish, tarix | `#/messages` |
| 7 | Har bir formada label, placeholder-misol, izoh, `*` belgisi, validatsiya va tushunarli xato xabari | Barcha formalar |
| 8 | Yordam markazi: 6 ta qo'llanma, 8 ta FAQ, qidiruv | `#/help` |
| 9 | 12 ta alohida sahifa, breadcrumbs, Orqaga tugmasi, 404 sahifa | Yon menyu |
| 10 | 3 til (UZ/EN/RU): butun interfeys, maslahatlar, xatolar va bildirishnomalar | `i18n-*.js` |
| 11 | Yangi foydalanuvchi uchun "Keyingi qadam" kartasi va 6 bandlik checklist | Dashboard |
| 12 | Autentifikatsiya (SHA-256 + salt), CRUD, rollar (user/admin), validatsiya, loading/success/error holatlari, mobil moslik | `db.js`, `app.js` |
| ★ | **STIR tekshiruvi:** majburiy maydon, 9 raqam formati, dublikat tekshiruvi, statuslar (Kutilmoqda/Tasdiqlangan/Rad etilgan), admin tasdiqlaydi yoki sababini yozib rad etadi, "Tasdiqlangan kompaniya" belgisi, STIR yoki nom o'zgarsa qayta tekshiruv, boshqalarga STIR yashirilgan holda (30\*\*\*\*\*67), kontaktlar faqat hamkorlarga ochiq | Ro'yxat, Profil, Dashboard, `#/admin` |

## 🏗 Arxitektura

```
index.html
style.css            — dizayn, mobil moslik
i18n-en|uz|ru.js     — 3 tildagi lug'at (~710 kalit, har tilda to'liq)
db.js                — ma'lumotlar qatlami: CRUD, auth, sessiya, demo ma'lumotlar
app.js               — router, layout, i18n, Wizard dvigateli, toast/modal
pages.js             — barcha sahifalar va amallar
```

- **Ma'lumotlar bazasi:** hozir brauzerning `localStorage`'ida ishlaydi (kolleksiyalar: users, companies, products, requests, convos, messages, orders, notifs, drafts). `DB.all/get/insert/update/remove` API'si server bazasiga mos qilib yozilgan. Keyingi bosqichda **Supabase (PostgreSQL + Auth + Row Level Security)**ga UI'ni o'zgartirmasdan ko'chirish mumkin.
- **Xavfsizlik:** parollar SHA-256 + salt bilan saqlanadi, sahifa va amallarda rol tekshiriladi, foydalanuvchi kiritgan barcha matn HTML-escape qilinadi (XSS'dan himoya), STIR va kontaktlar ruxsat bo'yicha yashiriladi.
- **STIR integratsiyasi:** format va dublikat avtomatik tekshiriladi. Davlat reyestri (soliq.uz) bilan avtomatik tekshirish uchun rasmiy API ruxsati kerak, shu sababli hozir administrator tekshiradi. Integratsiya `validateStir` va `admVerify` funksiyalariga qo'shiladi.

## 🧪 Test

Barcha foydalanuvchi yo'llari Playwright (Chrome) bilan avtomatik tekshirildi: ro'yxatdan o'tish, STIR validatsiyasi, saqlash va davom etish, mahsulot e'lon qilish, qidiruv, hamkorlik so'rovi, buyurtma (Kutilmoqda → Yetkazildi), ikki oyna o'rtasida jonli chat, admin tasdiqlashi va rad etishi, rollar, til almashtirish, parol o'zgartirish va mobil ko'rinish. Konsolda xato yo'q.

---

## English summary

Industry Hub is a B2B platform for the **textile industry**. It covers a 5-step company registration with mandatory **STIR (TIN)** verification (format and duplicate checks, admin approval or rejection, "Verified Company" badge), a 6-step product wizard, guided partner search with partnership requests, a 6-step order wizard with status tracking, real-time messaging, notifications, a help center and an admin panel. Every page explains what it is, why it is needed, what to enter, how to complete it and what happens next. The UI is fully available in Uzbek, English and Russian. Run it by opening `index.html` or enabling GitHub Pages. Demo accounts are listed above.
