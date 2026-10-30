```text
PROJECT: الجهاد
DOCUMENT: PHASE 2.1 — GITHUB PAGES DEPLOYMENT READINESS & REPOSITORY PACKAGING
STATUS: TARGETED PHASE 2 SUBTASK — DEPLOYMENT INFRASTRUCTURE ONLY
BUSINESS LOGIC: NOT AUTHORIZED
```

# PHASE_2.1_GITHUB_DEPLOYMENT_REPORT

## A. Repository Structure

**نعم، `apps/web/index.html` هو المدخل الصحيح.** لا يوجد ولا يجب أن يوجد `index.html` في جذر المستودع — هذا مشروع Monorepo متعدد التطبيقات (`apps/web` للمدرس، `apps/portal` لولي الأمر، منفصلان تمامًا INV-28)، وGitHub Pages هنا **لا ينشر محتوى الجذر مباشرة**، بل ينشر **ناتج البناء** (`apps/web/dist`) عبر GitHub Actions. أُضيفت فقرة توضيحية بهذا النص حرفيًا إلى `README.md` (البند المطلوب في §15).

## B. GitHub Pages

`.github/workflows/deploy-pages.yml` (جديد) ينفّذ بالضبط التسلسل المطلوب:

```
checkout → setup-node (مع cache: npm) → npm ci → npm run build:domain → npm run build:web
   → نسخ dist/index.html إلى dist/404.html (SPA fallback) → configure-pages
   → upload-pages-artifact (path: apps/web/dist) → deploy-pages
```

يستخدم الطريقة الرسمية الحديثة (`actions/configure-pages` + `actions/upload-pages-artifact` + `actions/deploy-pages`)، **لا فرع `gh-pages` ولا Secrets** — صلاحية النشر من أذونات الـWorkflow نفسه (`pages: write`, `id-token: write`)، تمامًا كما طُلِب.

## C. Base Path

`apps/web/vite.config.ts` يقرأ الآن `const base = process.env.VITE_BASE_PATH ?? "/"` — **لا اسم مستودع مكتوب في الكود**. الـWorkflow يحسبه وقت البناء فقط:

```yaml
VITE_BASE_PATH: ${{ github.event.repository.name == format('{0}.github.io', github.repository_owner) && '/' || format('/{0}/', github.event.repository.name) }}
```

هذا يعمل تلقائيًا لكلا الحالتين المطلوبتين (`<user>.github.io/` كموقع جذر، أو `<user>.github.io/<repo>/` كموقع مشروع) **لأي اسم مستودع أو Fork بلا أي تعديل يدوي** — الاستثناء الوحيد (موقع المستخدم الجذري حيث اسم المستودع نفسه `<user>.github.io`) مُعالَج صراحة بإرجاع `/`.

## D. PWA

راجعت وصححت الحقول الأربعة التي طلبتَ التحقق منها تحديدًا:

| العنصر | قبل | بعد |
|---|---|---|
| `base` (Vite) | غير مضبوط (افتراضي `/`) | `process.env.VITE_BASE_PATH ?? "/"` |
| `manifest.start_url` | **`"/"` ثابتة (كانت ستكسر مواقع المشاريع)** | `base` (نفس المتغيّر) |
| `manifest.scope` | غير موجود إطلاقًا | `base` (أُضيف صراحة) |
| أصول JS/CSS/الأيقونات | — | Vite يبني كل مسارات `<script>`/`<link>` نسبةً إلى `base` تلقائيًا؛ لم يكن هذا يعمل بشكل صحيح على مواقع المشاريع طالما `base` غير مضبوط |
| Service Worker (نطاقه وتسجيله) | يعتمد على `base` غير المضبوط أصلًا | يتبع `base` المُصحَّح الآن (`vite-plugin-pwa` يشتق مسار الـSW وتسجيله من إعداد `base` في Vite) |
| Offline cache (`workbox.globPatterns`) | بلا تغيير، سليم أصلًا | لا علاقة له بـ`base` (أنماط ملفات لا مسارات) |

**⚠️ لم يُختبَر فعليًا بعد إنشاء ناتج مبني** (انظر §G) — هذا تصحيح تصميمي صحيح بناءً على فهم موثَّق لسلوك `vite-plugin-pwa` (يشتق `start_url`/`scope`/مسارات الأصول من `base`)، **لا نتيجة بناء فعلي مُشاهَدة**. أول تشغيل حقيقي لـ`npm run build:web` (محليًا أو في الـWorkflow نفسه) هو التحقق النهائي.

## E. Portal

**لم يُنشَر `apps/portal` ضمن هذه المهمة، كما طُلِب صراحة.** التوثيق المطلوب لاستراتيجية النشر المستقبلية:

- `apps/portal` تطبيق PWA **مستقل تمامًا** (بناء خاص، Service Worker خاص، لا يستورد `apps/web` ولا `packages/domain` — INV-28)، وليس جزءًا من هذا الـWorkflow إطلاقًا.
- **الخيار الأبسط لاحقًا:** Workflow ثانٍ منفصل (`deploy-portal-pages.yml`) بنفس النمط تمامًا (نفس البنية، `apps/portal/dist` بدل `apps/web/dist`) لكن **موقع GitHub Pages ثانٍ لا يمكن أن يتعايش تلقائيًا مع الأول على نفس المستودع** (GitHub Pages بيئة واحدة لكل مستودع افتراضيًا) — لذا الخيار الأنسب فعليًا هو أحد اثنين: **(أ)** مستودع GitHub منفصل لـ`apps/portal` (الأبسط، يطابق عزلها المعماري الكامل)، أو **(ب)** نشره كمسار فرعي ضمن نفس Pages Deployment (مثلًا `apps/web/dist` + نسخ `apps/portal/dist` إلى مسار فرعي `portal/` داخل نفس الـartifact قبل الرفع) — **هذا قرار PHASE 2.2 أو لاحق، غير محسوم هنا عمدًا**، لا حل مؤقت أُقحِم الآن لتفادي تعقيد غير مطلوب في هذه المهمة الضيقة.

## F. Apps Script

**كان هناك تناقض حقيقي، صُحِّح.** كشفتَ عنه بدقة: `PHASE_2_BUILDABLE_STRUCTURE.md` وصف مسارًا (نسخ ملف `shared/Domain.generated.js` من بناء GAS منفصل داخل `packages/domain`)، بينما الـskeleton الفعلي كان يبني عبر مسار مختلف كليًا (`esbuild` مع `alias` يُدرِج مصدر Domain مباشرة في حزمة `apps/script` بلا أي ملف وسيط) — **وملف `packages/domain/build.gas.mjs` كان فعليًا كودًا ميتًا** (نتاجه `dist/gas/Domain.generated.js` وحتى نسخته إلى `apps/script/src/shared/` لم يكن يستهلكهما أي شيء).

**القرار: الـskeleton الفعلي هو المعتمد** (esbuild bundling مباشر عبر alias، حزمة IIFE واحدة `dist/Server.js`) — لأنه أبسط (بلا ترتيب بناء بين حزمتين، بلا ملف وسيط) ويحقق ADR-024 بالكامل (مصدر Domain واحد، بناء آلي، لا كتابة يدوية مزدوجة). **التصحيحات المُطبَّقة:**

- حُذِف `packages/domain/build.gas.mjs` (كود ميت).
- `packages/domain/package.json`: `"build"` أصبح `"node build.esm.mjs"` فقط (بلا الخطوة الثانية الميتة).
- حُذِف مجلد `apps/script/src/shared/` الفارغ من الغرض.
- حُذِف السطر المرتبط في `.gitignore` (`apps/script/src/shared/Domain.generated.js`).
- `PHASE_2_BUILDABLE_STRUCTURE.md`: صُحِّح صف ADR-024 وشجرة المستودع (٣ مواضع) لتعكس الآلية الفعلية الوحيدة الآن.
- أُضيف تعليق توضيحي في `apps/script/build.mjs` نفسه يوثّق القرار مكان اتخاذه.

**النتيجة بعد التصحيح:** آلية واحدة فعلية لا اثنتان متعارضتان، ومُتحقَّق من عملها بإعادة `tsc --noEmit` على كل من `packages/domain` و`apps/script` بعد الحذف (كلاهما ناجح، §G).

## G. Build Results

بيئة التنفيذ **بلا اتصال إنترنت** (مؤكَّد فعليًا: `npm ci` فشل بغياب `package-lock.json`، ومحاولة الوصول لسجل npm أعادت `403 Forbidden` من سياسة الشبكة نفسها — لا نتيجة زائفة). لذلك:

| Command | Result | Evidence |
|---|---|---|
| `npm ci` | 🔴 لم يُنفَّذ (يتطلب إنترنت لتثبيت الحزم لأول مرة؛ لا `package-lock.json` بعد) | محاولة فعلية أعادت خطأ registry `403` + `EUSAGE` (لا قفل حزم) |
| `npm test` (Vitest) | 🔴 لم يُنفَّذ (Vitest غير مثبَّت) | — لكن **السلوك المكافئ تمامًا** تم التحقق منه فعليًا: تجميع `packages/domain` عبر `tsc` العام المتاح في البيئة (بلا حاجة لـnpm install) وتشغيله بـ`node` مباشرة ضد ٢١ فحصًا سلوكيًا حقيقيًا — تشمل متجهات SHA-1/UUIDv5 القياسية (RFC 4122)، وسيناريوهات C-01-A/B وIDP-01 وBOOT-01…05 بالضبط. **كل الـ٢١ فحصًا نجحت** — أعيد تشغيلها بعد كل تعديل في هذه المهمة (آخر مرة عقب حذف `build.gas.mjs`) وبقيت ناجحة |
| `npm run build:web` | 🔴 لم يُنفَّذ (يحتاج `vite`/`preact`/`tailwindcss` مثبَّتة) | تحقق بديل: فحص بنية/صياغة `vite.config.ts` يدويًا سطرًا بسطر بعد التعديل — سليم، بلا تصريحات ناقصة |
| `npm run build:portal` | 🔴 لم يُنفَّذ (نفس السبب) | — |
| `npm run build:script` | 🔴 لم يُنفَّذ الأمر الكامل (يحتاج `esbuild` مثبَّتًا)، **لكن** `tsc --noEmit -p apps/script/tsconfig.json` **نُفِّذ فعليًا ونجح** (بعد إزالة الاعتماد على الملف المحذوف) | `SCRIPT_TYPECHECK_OK` |
| `npm run lint:boundaries` | 🔴 لم يُنفَّذ (يحتاج `dependency-cruiser` مثبَّتًا) | لم يُدَّعَ نجاحه |

**لا ادعاء بنجاح أي أمر لم يُشغَّل فعليًا، كما طُلِب صراحة.** كل ما يظهر "🟢/نُفِّذ فعليًا" أعلاه تم تشغيله حرفيًا في هذه الجلسة، بأدوات متاحة محليًا بلا شبكة (`tsc` العام، `node`)، لا محاكاة.

## H. Remaining Issues

- **لم يُختبَر بناء PWA فعليًا** (§D) — الفروض حول سلوك `vite-plugin-pwa` مع `base` غير الجذري صحيحة تصميميًا لكن غير مُشاهَدة في ناتج حقيقي؛ **أول `npm run build:web` الفعلي (محليًا أو عبر الـWorkflow) هو التحقق النهائي الحقيقي.**
- استراتيجية نشر `apps/portal` (§E) موثَّقة كخيارين لا كقرار نهائي — قرار مؤجَّل عمدًا، ليس نقصًا.
- الـSPA fallback (`404.html`) حل أدنى صحيح للوضع الحالي (صفحة واحدة بلا Router)؛ يحتاج مراجعة فعلية يوم يُضاف Router حقيقي لاحقًا (خارج نطاق هذه المهمة).

## I. Final Gate

```text
🟡 GITHUB DEPLOYMENT READY WITH CONDITIONS
```

**الشرط الوحيد:** تشغيل حقيقي واحد لـ`npm ci && npm run build:web` (محليًا، أو بترك الـWorkflow يعمل عند أول push) للتأكد أن ناتج `apps/web/dist/index.html` والأصول ومسارات الـmanifest/Service Worker تُحمَّل فعليًا تحت `base` غير الجذري كما صُمِّم — وهذا تحقق **لا يمكن إجراؤه في هذه البيئة بلا إنترنت**، لا ثغرة تصميمية معروفة.

**لا PHASE 2.2. لا Business Logic. لا UI. لا Sync. توقّف هنا.**
