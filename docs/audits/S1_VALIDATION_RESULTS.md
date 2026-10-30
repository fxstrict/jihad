# S1 — نتائج التحقق (استعادة البناء وCI والنشر)

**التاريخ:** 2026-10-28 | **البيئة:** سحابة Claude (Node 22.23.4، npm 10.9.9) على نسخة نظيفة (بلا `node_modules` ولا `dist`) | **السجل الخام:** `docs/audits/evidence/s1_validation.log`
هذه نتائج **جديدة** شُغّلت على ملفات S1 الحالية، لا نسخ من سجلات سابقة.

## 1. جدول الفحوص

| الفحص | النتيجة | دليل مختصر | ملاحظات |
|---|---|---|---|
| `npm ci` من `package-lock.json` | PASS | exit 0 | lockfile v3؛ بعد `npm install --package-lock-only` لم يتغير (SHA-256 مطابق) → يطابق `package.json` وworkspaces |
| TypeScript typecheck (domain/web/portal/script) | PASS | exit 0 | `npm run typecheck` |
| `lint:boundaries` (dependency-cruiser) | PASS | 0 مخالفة (38 وحدة / 43 اعتمادية) | الرقم 38 لا يقارن بـ48 السابقة (نطاق الملفات مختلف بوجود `dist` آنذاك) |
| ESLint (INV-18) على `apps/script/src` | PASS | exit 0 على المصادر الحقيقية | ESLint 10.13 + flat config |
| Vitest | PASS | 3 ملفات / **61 اختبارًا** ناجحًا | 11 قديمة + 37 `studentRules` + 13 `INV-18` |
| ESLint يرفض المخالف ويقبل المسموح | PASS | `tests/lint/inv18.test.ts` | يرفض `SpreadsheetApp/DriveApp/CalendarApp/GmailApp` المباشر و`globalThis.X` و`globalThis["X"]` خارج L1؛ يقبلها داخل `repositories/` و`adapters/`؛ يقبل `ContentService` |
| فاعلية اختبارات `studentRules` (طفرات مؤقتة) | PASS | 4 طفرات، كلها كُشفت | إزالة قاعدة 400 للسنة الكبيسة، 15→16 رقمًا للهاتف، حذف فحص تاريخ الميلاد المستقبلي، السماح بـarchived→paused. أُعيد الملف مطابقًا للأصل |
| build domain / web / portal / script | PASS | exit 0 لكلٍّ | web precache 14 ملفًا، portal 8 |
| `verify:pwa` (web وportal، base `/`) | PASS | أيقونات 192/512/maskable موجودة بالحجم المعلن ومسجلة في `sw.js` | فحص ملفات الناتج فقط |
| بناء web بـ`VITE_BASE_PATH=/al-jihad/` + تحقق | PASS | start_url/scope و كل مراجع index.html تبدأ بـ`/al-jihad/` | محاكاة مسار GitHub Pages محليًا |
| اختبار سلبي للتحقق (base خاطئ / أيقونة محذوفة) | PASS | السكربت يفشل بالرسالة المتوقعة | أُجري يدويًا أثناء التطوير |
| تحليل YAML لـ`ci.yml` و`deploy-pages.yml` | PASS | `yaml.safe_load` | صحة التركيب فقط، لا تشغيل |
| بحث عن أسرار/مفاتيح في الحزمة | PASS | لا مطابقات (`BEGIN … PRIVATE`، `AKIA`، `ghp_`، `password=`) | |
| **GitHub Actions `ci.yml` فعليًا** | **BLOCKED** | لا مستودع «الجهاد» متاح في هذه الجلسة (`list_repos` فارغ) | الملف جاهز، لم يُشغَّل |
| **نشر GitHub Pages فعليًا** | **BLOCKED** | نفس السبب | لا رابط منشور |
| تثبيت التطبيق على Android (جهاز حقيقي) | NOT RUN | — | لم يُجرَّب أبدًا |
| `clasp push`، Playwright | NOT RUN | — | خارج S1 |

## 2. سجل الملفات (S1.0)

| الملف | الحالة قبل | المشكلة | التعديل | جديد/معدل | التحقق |
|---|---|---|---|---|---|
| `package-lock.json` | غائب | `npm ci` في workflow النشر يفشل | توليد حقيقي بـnpm، مطابق للـworkspaces | جديد | `npm ci` PASS؛ لا فرق بعد `--package-lock-only` |
| `package.json` (جذر) | بلا eslint/typecheck/lint/build | ESLint غير مثبت | `eslint@^10`، `@typescript-eslint/parser@^8`، سكربتات `typecheck`/`lint`/`lint:eslint`/`build`/`verify:pwa`، `engines ≥ 20.19` | معدل | PASS |
| `.eslintrc.cjs` | صيغة قديمة لا يقرؤها ESLint ≥ 9 | INV-18 غير مفروض فعليًا | **استُبدل** بـ`eslint.config.mjs` (نفس القاعدة + تغطية التحايل بـglobalThis/الأقواس) | محذوف/استُبدل | `inv18.test.ts` PASS |
| `eslint.config.mjs` | — | — | قاعدة INV-18 على `apps/script/src/**` والاستثناء الوحيد `repositories/**` و`adapters/**` | جديد | PASS |
| `.dependency-cruiser.cjs` | تعليق يشير لـ`.eslintrc.cjs` | إشارة قديمة | تحديث التعليق فقط | معدل | PASS |
| `.github/workflows/ci.yml` | — | لا بوابة جودة | typecheck ← lint ← test ← build ← verify:pwa (+ مسار فرعي) | جديد | YAML صالح؛ **لم يُشغَّل على GitHub** |
| `.github/workflows/deploy-pages.yml` | `npm ci` بلا lockfile، Node 20، بلا cache | يفشل أول نشر | Node 22 + `cache: npm` + خطوة `verify-pwa-assets` بنفس `VITE_BASE_PATH`؛ باقي المنطق كما هو | معدل | YAML صالح؛ **لم يُشغَّل** |
| `apps/web/public/icons/*.png` (4) | مجلد فارغ | لا أيقونات | 192 / 512 / maskable-512 / apple-touch-180 (حرف «ج» على `#0f766e`) | جديد | `verify:pwa` PASS |
| `apps/portal/public/icons/*.png` (4) | غائب | لا أيقونات | نفس الأيقونات (البوابة معزولة، لا استيراد من web) | جديد | PASS |
| `apps/web/vite.config.ts` | `icons: []` | لا تثبيت على Android | 3 أيقونات بمسارات نسبية + `includeAssets` | معدل | PASS (تحت `/` و`/al-jihad/`) |
| `apps/portal/vite.config.ts` | `icons: []` | نفسه | نفسه | معدل | PASS |
| `apps/web/index.html`، `apps/portal/index.html` | بلا theme-color/أيقونات | — | `theme-color` + `apple-touch-icon` + `icon` بمسار `/icons/…` (يضيف Vite الـbase) | معدل | PASS |
| `scripts/verify-pwa-assets.mjs` | — | لا تحقق آلي من PWA | تحقق manifest/أيقونات/base/sw | جديد | PASS + سلبيان |
| `scripts/make-icons.py` | — | إعادة التوليد | سكربت Pillow | جديد | استُخدم للتوليد |
| `tests/contract/studentRules.test.ts` | غائب | `studentRules.ts` بلا اختبار | 37 اختبارًا سلوكيًا | جديد | PASS + 4 طفرات |
| `tests/lint/inv18.test.ts` | — | — | 13 اختبارًا | جديد | PASS |
| `README.md`، `CHANGELOG.md` | ادعاء «21 فحصًا» | لا يطابق الواقع | أوامر وأعداد فعلية (61 اختبارًا) وحالة GitHub/Android الصريحة | معدل | — |
| `packages/domain/**` | — | — | **لم يُعدَّل** (diff مطابق للأصل) | — | — |
| `docs/architecture/PHASE_2.3_IMPLEMENTATION_BLUEPRINT.md` | غير موجود في الأرشيف | — | نسخ من تسليم 2.3 | جديد | — |

## 3. المشكلات المُصلَحة (من Findings 2.3)
F-1 ESLint (مُصلَح ومختبر) · F-2 lockfile (مُصلَح محليًا؛ نجاح `npm ci` على GitHub لم يُتحقَّق) · F-3 الأيقونات (مُصلَح على مستوى الملفات؛ Android لم يُجرَّب) · F-4 اختبارات `studentRules` · F-5 README · F-6 ملف CI (جاهز، لم يُشغَّل).

## 4. المشكلات المتبقية
- **GitHub CI والنشر غير متحقَّق منهما** (لا وصول). معيار خروج S1 («CI أخضر على GitHub + نشر Pages») **لم يتحقق بعد**.
- **F-9 (جديد، قرار منتج):** `canTransitionStudent` أوسع من نص PHASE 1 §C.6 (`active ⇄ paused → graduated → archived`): يسمح أيضًا بـactive→graduated وgraduated→active وactive/paused→archived وarchived→active. لم يُعدَّل المجال؛ ثُبّت السلوك الحالي في الاختبارات ووُسم F-9. المطلوب قرار مالك المنتج: توسيع §C.6 رسميًا أو تضييق الكود.
- ESLint 10 يتطلب Node ≥ 20.19 (ضُبط `engines` وworkflows على Node 22).
- نشر Pages غير مشروط بنجاح `ci.yml` (workflowان مستقلان) — يمكن ربطهما لاحقًا.
- فحص `verify-pwa-assets` لا يغني عن اختبار «تثبيت» فعلي على Android.
