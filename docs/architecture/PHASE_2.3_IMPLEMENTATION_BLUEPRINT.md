# PHASE 2.3 — مخطط التنفيذ النهائي (Implementation Blueprint)

**المعرف:** ALJ-P2.3 | **التاريخ:** 2026-10-27 | **النطاق:** جرد فعلي + خطة استعادة البناء + تعريف أول نسخة تعمل + شرائح تنفيذ + معايير خروج.
**ما لا يفعله هذا الملف:** لا يعيد تصميم PHASE 0–2.2، ولا يغيّر schema أو API أو قرارًا معماريًا. **لا كود وظيفيًا هنا**؛ كل شريحة أدناه تنتهي بكود واختبار.

> التحقق من وجود 2.3 سابقة: **غير موجودة** في الحزمة المرفقة (لا تقرير 2.2 ولا 2.3 داخل `docs/architecture/` ولا في المرفقات). لذلك أُنجزت هنا مرة واحدة بنطاق ضيق. مرجع Phase 1 المرفق **مطابق بايتًا** لنسخة `docs/architecture/PHASE_1_FINAL_CONSOLIDATED.md` داخل الأرشيف (diff = لا فروق).

---

## 1. الجرد الفعلي (بتشغيل حقيقي، لا قراءة فقط)

**البيئة:** سحابة Claude (Node 22.23.4 / npm 10.9.9، سجل npm متاح) على نسخة معزولة من `al-jihad-wip.zip`. السجل الخام: `evidence/inventory_results.log`.

| الفحص | الأمر | النتيجة |
|---|---|---|
| تثبيت | `npm install` | ✅ 683 حزمة، 60 ثانية، **نُتج `package-lock.json` حقيقي** (lockfileVersion 3، 770 رابط كلها `registry.npmjs.org`) |
| typecheck ×4 | `tsc --noEmit -p` على domain/web/portal/script | ✅ exit 0 لكلٍّ منها |
| اختبارات | `vitest run` | ✅ 1 ملف، **11 اختبارًا ناجحًا** |
| بناء | `build:domain` / `build:web` / `build:portal` / `build:script` | ✅ الأربعة نجحت (web: JS ‏17.3KB، PWA precache 6 ملفات؛ script: `Server.js`+`Entry.js`+`appsscript.json`) |
| حدود الاعتماد | `lint:boundaries` | ✅ 0 مخالفة (48 وحدة / 43 اعتمادية) |
| ESLint (INV-18) | `npx eslint apps packages` | ❌ **لا يعمل** (انظر F-1) |

**الحكم:** هيكل PHASE 2 **يبني ويجتاز اختباراته فعلًا** في بيئة سحابية. ما لم يُجرَّب بعد: التشغيل في CI على GitHub، النشر الفعلي، التشغيل على Android، `clasp push`.

## 2. النتائج (Findings) — بالدليل والأثر وأقل إصلاح

| # | الخطورة | الدليل | الأثر | أقل إصلاح | الشريحة |
|---|---|---|---|---|---|
| F-1 | **عالية** | `eslint` ليس ضمن أي `devDependencies`؛ `.eslintrc.cjs` بصيغة قديمة فيفشل مع ESLint ≥9 (`couldn't find eslint.config.*`). لا سكربت `lint` في `package.json` | قيد **INV-18** (منع `SpreadsheetApp/DriveApp/...` خارج repositories/adapters) **غير مفروض آليًا** رغم أن README/CHANGELOG يوحيان بفرضه | إضافة `eslint@^8.57` كـdevDependency + سكربت `lint:eslint`؛ لا تغيير في القاعدة نفسها | S1 |
| F-2 | **عالية** | لا `package-lock.json` في المستودع؛ `deploy-pages.yml` ينفّذ `npm ci` (يفشل بلا lockfile) | **أول push إلى `main` سيفشل النشر** | التزام `package-lock.json` المرفق + إضافة `cache: npm` في الـWorkflow | S1 |
| F-3 | **عالية** | `manifest.icons = []` في `apps/web` و`apps/portal`؛ `public/icons/` فارغ | Chrome/Android **لن يعرض «تثبيت التطبيق»** → يخالف معيار قبول V1 رقم 2 | أيقونات 192/512 (+maskable) وتضمينها في manifest | S1 |
| F-4 | متوسطة | `studentRules.ts` (151 سطرًا: تطبيع الهاتف/الأرقام العربية/التحقق) **بلا أي اختبار**؛ `tests/contract/domain.test.ts` يغطي الهوية/Idempotency/البوابة فقط | قواعد تحقق المدخلات (ستُشارك مع الخادم) بلا حماية انحدار | اختبارات سلوكية للأرقام العربية، الهاتف، التواريخ، الحقول المطلوبة | S1 |
| F-5 | متوسطة | README يقول «21 فحصًا سلوكيًا»؛ الفعلي `vitest`: **11 اختبارًا** | ادعاء توثيقي لا يطابق التشغيل | تصحيح README بالرقم المُشغَّل فعلًا بعد S1 | S1 |
| F-6 | متوسطة | لا Workflow يشغّل الاختبارات/الحدود/typecheck؛ الموجود ينشر فقط | لا بوابة جودة قبل النشر | `ci.yml`: `npm ci` ← typecheck ← test ← lint:boundaries ← lint:eslint ← build:* على كل PR وpush | S1 |
| F-7 | معلوماتية | `jihad_meta` هي القاعدة الوحيدة؛ لا `jihad_org_<id>`؛ `StudentRepository` منفذ (Port) بلا تنفيذ؛ `main.tsx` يعرض JSON فقط | لا CRUD ولا تخزين بيانات منظمة | S2–S5 | S2+ |
| F-8 | معلوماتية | `apps/script` يدعم `ping` فقط؛ لا مصادقة/تفويض | **مقصود** — خارج نطاق V0.1؛ يُدخل قبل أي بيانات حقيقية (قاعدة الخطة §7) | المرحلة 11/12 | لاحقًا |

لا تناقض حقيقي مع PHASE 0–2.2 ظهر؛ كل ما سبق نقص تنفيذ لا خلل تصميم، فلا تُعاد فتح مرحلة مغلقة.

## 3. تعريف أول نسخة تعمل (V0.1 — «طالب واحد يبقى بعد إعادة الفتح»)

نسخة منشورة على GitHub Pages، يمكن تثبيتها على Android، وتحقق **حرفيًا** هذا السيناريو دون إنترنت بعد أول تحميل:

1. أول تشغيل ← معالج إعداد: اسم المنشأة + اسم المدرس ← `bootstrapState` يصل `READY` محليًا (بلا شبكة).
2. إضافة طالب (اسم، هاتف، مدرسة، كود اختياري) ← حفظ.
3. إغلاق التطبيق كليًا وإعادة فتحه ← الطالب موجود؛ البوابة لا تعيد المعالج ولا تنشئ منشأة ثانية.
4. تعديل الطالب وأرشفته ← يظهر/يختفي حسب فلتر «المؤرشف».
5. كل كتابة تنتج صف `sync_outbox` وصف `audit_logs` **في نفس المعاملة** (دون مزامنة فعلية بعد).

**خارج V0.1 صراحة:** المزامنة الفعلية، Apps Script الإنتاجي، المصادقة، الحصص، الأولياء، الترخيص.

## 4. الشرائح (كل شريحة: كود + اختبارات + دليل تشغيل)

كل شريحة تُسلَّم بسجل حسب §9 من الخطة الماستر، ولا تبدأ التالية قبل إغلاقها بدليل.

### S1 — استعادة البناء (المرحلة 3) — الخطر الأقل، القيمة الأعلى
- التزام `package-lock.json`؛ إضافة `cache: npm` في `deploy-pages.yml`.
- `eslint@^8.57` + سكربت `lint:eslint`؛ **اختبار سلبي**: ملف مؤقت يستدعي `SpreadsheetApp` خارج `repositories/` يجب أن يفشل.
- `ci.yml` (typecheck/test/boundaries/eslint/build).
- أيقونات PWA + manifest.
- اختبارات `studentRules` (≥ 12 حالة: أرقام عربية/فارسية، هاتف مصري `01xxxxxxxxx` و`+20`، بريد، تاريخ مستقبلي، طول الاسم، `duplicate`).
- **الخروج:** CI أخضر على GitHub فعليًا؛ `npm ci` ينجح من الصفر؛ اختبار ESLint السلبي يفشل كما يجب؛ نشر Pages ناجح + الرابط.

### S2 — قاعدة المنظمة المحلية (المرحلة 4-أ)
- `LocalDatabaseAdapter` (الوحيد الذي يعرف IndexedDB، INV-01) + فتح `jihad_org_<organizationId>` + Migration مرقّمة `001` تنشئ **فقط**: `persons, students (byPersonId u, byStatus, byCode u), sync_outbox, audit_logs, _migrations, _kv`.
- رفض `DB_NEWER_THAN_APP`؛ معالجة `onversionchange`/`blocked`؛ `navigator.storage.persist()`.
- اختبارات بـ`fake-indexeddb` تحت Vitest: إنشاء من الصفر، إعادة فتح، رفض قاعدة أحدث، تسجيل الترحيل في `_migrations`.
- **الخروج:** الاختبارات خضراء؛ لا وصول لـIndexedDB خارج `data/local-db` (يفرضه depcruise).

### S3 — Bootstrap محلي (المرحلة 4-ب)
- تنفيذ آلة `INSTALLATION_CREATED → ORG_BOUND → … → READY` محليًا باستخدام `checkInstallation/canFinishResumeOffline` الموجودتين (لا إعادة اختراع).
- Use Case `SetupOrganization`: Organization + Person + User(owner) + Installation في تسلسل **قابل للاستئناف** بعد انقطاع في أي نقطة.
- **الخروج:** اختبارات: قطع بعد كل حالة ثم الاستئناف يصل `READY` بلا تكرار منشأة؛ فتح ثانٍ لا ينشئ منشأة جديدة (معيار قبول V1 #1).

### S4 — Repository الطالب وUse Case (المرحلة 5-أ)
- تنفيذ `StudentRepository` (Port موجود) فوق Adapter؛ `commit(StudentChange)` معاملة `readwrite` واحدة تشمل `persons, students, sync_outbox, audit_logs` (§D.5).
- Use Cases: `CreateStudent`, `UpdateStudent` (يُنتج `FieldChange[]` + `requestFingerprint` عبر `classifyPatch`/`requestFingerprint` الموجودين), `ArchiveStudent`.
- `DuplicateStudentCodeError` عند خرق `byCode`؛ **الذرية**: فشل أي مخزن ⇒ لا أثر في الباقي (اختبار حقن فشل).
- **الخروج:** اختبارات: إنشاء ⇒ 1 person + 1 student + 1 outbox + 1 audit؛ تكرار الكود ⇒ لا كتابة جزئية؛ أرشفة ⇒ `deletedAt/status` دون حذف فعلي.

### S5 — شاشات الطلاب (المرحلة 5-ب)
- UI عربي RTL هاتف أولًا: قائمة، بحث، إضافة/تعديل، أرشفة؛ حالات تحميل/فراغ/خطأ؛ UI يستدعي Application فقط (depcruise يمنع غير ذلك).
- **لا نجاح زائف** عند فشل الحفظ (رسالة عربية واضحة).
- **الخروج:** اختبار E2E (Playwright، بيانات اصطناعية): إعداد ← إضافة ← إعادة تحميل ← ظهور ← أرشفة؛ ثم **اختبار يدوي على Android** موثق بخطوات.

## 5. قواعد تنفيذ لكل الشرائح
- بيانات اصطناعية فقط؛ لا أسرار ولا `.clasp.json` في المستودع.
- لا تغيير في Phase 1 (schema/ثوابت INV) دون تناقض موثق؛ أي ملاحظة تُسجَّل Finding أولًا.
- لا تُعلَن شريحة «مكتملة بدليل» إلا بأوامر ونتائج ورابط CI.
- لأن المستخدم يعمل من Android: كل خطوة رفع/تشغيل عبر GitHub (رفع ملفات من الهاتف + Actions)، لا Terminal محلي.

## 6. معايير خروج PHASE 2.3
- [x] وجود المرحلة السابقة مفحوص (غير موجودة) ✔ أُنجزت هنا.
- [x] جرد فعلي بأوامر ونتائج (§1) ✔
- [x] Findings موثقة بالدليل والأثر وأقل إصلاح (§2) ✔
- [x] تعريف V0.1 (§3) ✔
- [x] شرائح صغيرة بمعايير خروج قابلة للتحقق (§4) ✔
- [x] لا إعادة تصميم لـPHASE 0–2.2 ✔

**الحالة:** PHASE 2.3 **مغلقة تصميميًا** — الجاهزية للتنفيذ: **S1**.
**المهمة التالية الوحيدة:** S1 — استعادة البناء (إغلاق F-1…F-6)، ثم لا شيء قبل أن يكون CI أخضر.
