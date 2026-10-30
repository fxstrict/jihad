# الجهاد — Teacher Management & Private Tutoring Platform

هيكل قابل للبناء (PHASE 2 §1–2). **لا منطق أعمال بعد** — هذا الهيكل يثبت أن الأدوات والحدود والخط المشترك (النواة → PWA + النواة → Apps Script) تعمل ميكانيكيًا.

المرجع المعماري الوحيد: `docs/architecture/PHASE_1_FINAL_CONSOLIDATED.md` (لا تعتمد نسخًا أقدم).

## التشغيل (يتطلب Node ≥ 20.19 واتصالًا بالإنترنت لأول تثبيت)

```bash
npm ci                   # تثبيت قابل للتكرار من package-lock.json (الملف مُلتزَم به ولا يُحذف)
npm run typecheck        # TypeScript strict لـdomain وweb وportal وscript
npm run lint             # حدود الاعتماد (dependency-cruiser) + ESLint لقيد INV-18
npm test                 # Vitest: اختبارات النواة وقواعد الطالب وقيد INV-18 (انظر الجدول أدناه)
npm run build            # يبني web وportal وscript
npm run verify:pwa       # يتحقق من manifest والأيقونات في apps/*/dist بعد البناء
npm run dev:web          # تطبيق المدرس  → http://localhost:5173
npm run dev:portal       # بوابة الأهل   → http://localhost:5174
npm run build:script     # يبني dist/ لمشروع Apps Script (Server.js + Entry.js + appsscript.json)
```

نشر Apps Script (اختياري لاحقًا): انسخ `apps/script/.clasp.json.example` إلى `.clasp.json` (سري، لا يُرفع)، ضع `scriptId`، ثم `npm run push --workspace=apps/script`.
اختبار الخادم بعد النشر: `POST {"op":"ping"}` يعيد `sharedDomainProof` = نفس المعرّف الحتمي الذي تعرضه واجهة `apps/web` (إثبات أن Domain واحد على الطرفين).

## النشر على GitHub Pages

`.github/workflows/deploy-pages.yml` يبني `apps/web` وينشر `apps/web/dist` تلقائيًا عند كل push إلى `main` (لا Secrets مطلوبة — صلاحية النشر من الـWorkflow نفسه). التفاصيل والتحقق الكامل في `docs/architecture/PHASE_2.1_GITHUB_DEPLOYMENT_REPORT.md`.

**لماذا لا يوجد `index.html` في جذر المستودع؟** `index.html` الخاص بتطبيق المدرس موجود داخل `apps/web` لأن المشروع Monorepo متعدد التطبيقات (`apps/web` للمدرس، `apps/portal` لولي الأمر، منفصلان تمامًا). لا يلزم وجود `index.html` في جذر المستودع. GitHub Pages ينشر ناتج البناء `apps/web/dist` بواسطة GitHub Actions، لا محتوى الجذر مباشرة.

## ما تم التحقق منه فعليًا وما لم يُتحقَّق منه

آخر تشغيل موثق: شريحة S1 (28 أكتوبر 2026) في بيئة Claude السحابية (Node 22، npm 10). التفاصيل في `docs/audits/S1_VALIDATION_RESULTS.md`.

| البند | الحالة |
|---|---|
| `npm ci` من `package-lock.json` | ✅ |
| typecheck (domain/web/portal/script) | ✅ |
| Vitest: **61 اختبارًا في 3 ملفات** — `domain.test.ts` (11: SHA-1/UUIDv5/الهوية الحتمية/Idempotency/Bootstrap gate)، `studentRules.test.ts` (37)، `inv18.test.ts` (13: ESLint يرفض استدعاء Google خارج L1 ويقبله داخل repositories/adapters) | ✅ |
| `dependency-cruiser` (حدود الاعتماد) + ESLint (INV-18) | ✅ |
| بناء domain/web/portal/script | ✅ |
| `verify:pwa`: manifest + أيقونات 192/512/maskable + مسارات تحت `/` وتحت `/al-jihad/` | ✅ (فحص ملفات الناتج فقط) |
| GitHub Actions (`ci.yml`) و نشر GitHub Pages الفعلي | ⚠️ **لم يُتحقَّق منهما** — لا يوجد وصول لمستودع GitHub من بيئة الإنشاء؛ الملفات جاهزة فقط |
| تثبيت التطبيق على Android فعليًا (جهاز حقيقي) | ⚠️ **لم يُجرَّب** |
| `clasp push`، Playwright | ⚠️ لم يُشغَّل |

## قواعد
- `packages/domain` نقي: لا I/O ولا DOM ولا Google (يفرضه `.dependency-cruiser.cjs`).
- `apps/portal` معزول تمامًا (INV-28).
- استدعاء `SpreadsheetApp/DriveApp/CalendarApp/GmailApp` مسموح فقط داخل `apps/script/src/{repositories,adapters}` (ESLint، INV-18).
