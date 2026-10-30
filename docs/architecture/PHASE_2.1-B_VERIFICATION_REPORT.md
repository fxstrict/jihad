```text
PROJECT: الجهاد
DOCUMENT: PHASE 2.1-B — FINAL GITHUB REPOSITORY PACKAGING & BUILD VERIFICATION
STATUS: READ-ONLY VERIFICATION + MINIMAL REPO-HYGIENE CORRECTIONS ONLY
BUSINESS LOGIC: NOT AUTHORIZED
```

# PHASE_2.1-B_VERIFICATION_REPORT

فحصت **المستودع الفعلي على القرص**، لا التوثيق فقط، لكل بند طلبته. وجدت **مشكلتين حقيقيتين** (لا افتراضيتين) وأصلحتهما بأقل تعديل ممكن — موثَّقتان أدناه بالدليل الحرفي قبل أي تصحيح.

---

## Discrepancies Found (قبل أي تعديل)

| # | البند | التوثيق يدّعي | الواقع الفعلي على القرص | الحكم |
|---|---|---|---|---|
| D-1 | `CHANGELOG.md` | مذكور في شجرة `PHASE_2_BUILDABLE_STRUCTURE.md` كملف جذر قائم | **غير موجود فعليًا** (`ls CHANGELOG.md` ⇒ `No such file or directory`) | ✅ صُحِّح — أُنشئ ملف حد أدنى (تهيئة/توثيق تغييرات فقط، لا منطق) |
| D-2 | `cache: npm` في `.github/workflows/deploy-pages.yml` | يُفترَض أنه يُسرِّع `npm ci` | **`actions/setup-node@v4` مع `cache: npm` يتطلب `package-lock.json` موجودًا في المستودع ليبني مفتاح الـcache — ولا يوجد** (`package-lock.json` غائب، مؤكَّد أدناه). هذا كان سيُفشِل خطوة `Setup Node` فعليًا **على GitHub الحقيقي** (بيئة متصلة بالإنترنت، لا علاقة لهذا الخطأ بقيود شبكة هذه البيئة) عند أول تشغيل حقيقي للـWorkflow | ✅ صُحِّح — أُزيل `cache: npm` مؤقتًا مع تعليق يشرح متى يُعاد (بعد أول لقفل حزم حقيقي) |

**لا تناقضات أخرى وُجدت** بين التوثيق والملفات الفعلية لبقية البنود المطلوب فحصها (`apps/web/index.html`, `apps/portal/index.html`, `apps/web/vite.config.ts`, `apps/script/build.mjs`, `packages/domain/build.esm.mjs`) — كلها مطابقة لما وصفته الوثائق حرفيًا، مُتحقَّق منه بقراءة كل ملف كاملًا (لا تصفّح جزئي).

---

## A. Repository Verification

| Item | Status | Evidence |
|---|---|---|
| Monorepo structure | ✅ | `packages/domain`, `apps/{web,portal,script}`, `tests/{contract,sync,migrations/fixtures,sheets-encoding,e2e}` كلها موجودة فعليًا بالمحتوى المتوقَّع |
| `apps/web/index.html` | ✅ نقطة دخول Vite حقيقية | يحتوي `<script type="module" src="/src/main.tsx">` فعليًا (قُرِئ كاملًا) |
| `apps/portal/index.html` | ✅ نقطة دخول Vite حقيقية، مستقلة | نفس النمط، تطبيق منفصل تمامًا (`src/main.tsx` خاص به، لا يستورد `apps/web`) |
| Root `index.html` غائب عمدًا | ✅ صحيح معماريًا | `find . -maxdepth 1 -iname "index.html"` ⇒ لا نتيجة. لم يُضَف، ولن يُضاف (القرار موثَّق في README بالفقرة المطلوبة أصلًا من PHASE 2.1) |
| GitHub workflow | ✅ موجود، ومُصحَّح (D-2) | `.github/workflows/deploy-pages.yml` — تسلسل الخطوات مطابق تمامًا للمطلوب في §3 (انظر أدناه) |
| `.gitignore` | ✅ يغطي الحد الأدنى المطلوب بالضبط | `node_modules/`, `dist/`, `.env`/`.env.*`, `apps/script/.clasp.json` — كلها مؤكَّدة بقراءة الملف كاملًا؛ **لا يستثني ملفات مصدر لازمة للبناء** |
| Lockfile | 🔴 **غائب** | `ls package-lock.json` ⇒ `No such file or directory`؛ **لا يمكن توليده في هذه البيئة** (انظر §B وC.7 أدناه) — هذا هو المُعطِّل الحقيقي الوحيد لإعادة الإنتاج الكاملة لـCI حاليًا |
| Apps Script secret handling | ✅ سليم | `apps/script/.clasp.json` (الحقيقي) مُستبعَد في `.gitignore`؛ `apps/script/.clasp.json.example` موجود بقيمة placeholder فقط (`REPLACE_WITH_YOUR_APPS_SCRIPT_ID`) — لا Script ID ولا أسرار حقيقية |

---

## B. Build Verification

بيئة التنفيذ **بلا اتصال إنترنت — أُعيد التحقق فعليًا في هذه الجلسة بالذات**، لا نقلًا عن جلسة سابقة:

```
$ npm ci               → npm error [الأمر يتطلب package-lock.json موجودًا؛ EUSAGE]
$ npm view preact version → npm error code E403 — 403 Forbidden (سياسة الشبكة نفسها ترفض الوصول لسجل npm)
$ npm install --package-lock-only → npm error code E403 — نفس الرفض (dependency-cruiser كمثال)
```

| Command | Result |
|---|---|
| `npm ci` | **NOT EXECUTED** — REASON: لا `package-lock.json` في المستودع (EUSAGE)، ولا اتصال بسجل npm لإنشائه (E403) |
| `npm run build:domain` | **NOT EXECUTED** — REASON: يعتمد على `esbuild` (حزمة خارجية) غير مثبَّتة، والتثبيت يتطلب الشبكة أعلاه. **بديل نُفِّذ فعليًا بدلًا منه** (ليس بديلًا مطابقًا): `tsc --noEmit -p packages/domain/tsconfig.json` ⇒ **PASS** (Type-check الصارم فقط، لا حزمة فعلية) |
| `npm run build:web` | **NOT EXECUTED** — REASON: يعتمد على `vite`/`preact`/`tailwindcss` (حزم خارجية) غير مثبَّتة. **بديل نُفِّذ فعليًا**: فحص بنيوي كامل لـ`apps/web/vite.config.ts` (قراءة كاملة + فحص صياغة TS بمعزل عن حلّ الحزم `--noResolve`) ⇒ أخطاء `TS2307`/`TS2591` **فقط** (حزم غير مُثبَّتة)، **صفر أخطاء صياغة حقيقية** |
| `npm run lint:boundaries` | **NOT EXECUTED** — REASON: يعتمد على `dependency-cruiser` (حزمة خارجية) غير مثبَّتة |

**لا ادعاء نجاح لأي أمر من الأربعة أعلاه.** كل "PASS" مذكور في هذا التقرير (Type-check، فحص الصياغة، الاختبارات السلوكية) **نُفِّذ فعليًا وحرفيًا في هذه الجلسة** بأدوات متوفرة محليًا بلا حاجة لشبكة (`tsc` العام المثبَّت في الحاوية، `node`)، وهو **تحقق ثابت/تصميمي (static)، لا تحقق بناء فعلي (actual build)** — الفرق موثَّق صراحة كما طلبتَ في §C.

**أدلة التحقق الثابت الفعلي المُنفَّذ فعليًا في هذه الجلسة:**
- `tsc --noEmit -p packages/domain/tsconfig.json` ⇒ `DOMAIN_TYPECHECK: PASS`
- `tsc --noEmit -p apps/script/tsconfig.json` ⇒ `SCRIPT_TYPECHECK: PASS`
- تجميع `packages/domain` إلى CommonJS عبر `tsc` وتشغيله بـ`node` ضد **٢١ فحصًا سلوكيًا حقيقيًا** (متجهات SHA-1/UUIDv5 القياسية من RFC 4122، وسيناريوهات C-01-A/B/C وIDP-01 وBOOT-01…05 حرفيًا) ⇒ **كل الـ٢١ نجحت** (أُعيد تشغيلها الآن، لا نقلًا عن سجل سابق)

---

## C. Generated Artifact Verification

**لم يُنتَج أي Artifact فعلي** (`build:web` لم يُنفَّذ، §B). لذلك: `apps/web/dist/index.html`, `assets/`, الـmanifest المُولَّد، وService Worker المُولَّد **لا وجود فعليًا لأي منها الآن** — لا شيء لفحصه كناتج بناء حقيقي. ما تحقَّق منه هذا التقرير بدلًا من ذلك هو **الإعداد المصدري** الذي سينتج عنه ذلك الناتج (مصدر `apps/web/vite.config.ts` نفسه، §D)، وهذا تحقق **مختلف نوعيًا**، مذكور بوضوح كذلك.

---

## D. GitHub Pages Verification

| الحالة | القيمة | الدليل |
|---|---|---|
| 1. GitHub-source-ready | ✅ **نعم** | البنية والملفات المصدرية كاملة وصحيحة بنيويًا (§A)، بعد إصلاح D-1/D-2 |
| 2. GitHub-Pages-configured | ✅ **نعم** | `.github/workflows/deploy-pages.yml` يتبع التسلسل المطلوب حرفيًا: `checkout → setup-node → npm ci → build:domain → build:web → نسخ 404.html → configure-pages → upload-pages-artifact(path: apps/web/dist) → deploy-pages`؛ ينشر `apps/web/dist` حصرًا، **لا** الجذر ولا `apps/web` الخام ولا `apps/portal` ولا `apps/script`؛ لا فرع `gh-pages` مُستخدَم (الآلية Actions + Pages Artifact فقط كما طُلِب) |
| 3. Actually-build-verified | 🔴 **لا** | لم يُنفَّذ `npm run build:web` فعليًا (بيئة بلا شبكة، §B) — **لم يُدَّعَ خلاف ذلك** |
| 4. Actually-deployed-verified | 🔴 **لا** | لا وصول لـGitHub Actions من هذه البيئة؛ لم يُنفَّذ ولم يُدَّعَ نشر فعلي |

**الأربعة مفصولة كما طُلِب — لا خلط بين "الجاهزية التصميمية" و"التحقق الفعلي".**

---

## E. Remaining Blockers

**عائق واحد حقيقي فقط** (لا عوائق مُختلَقة):

- **غياب `package-lock.json`** — يمنع `npm ci` من العمل (سواء هنا أو نظريًا في أي بيئة CI حتى تتوفر). **لا يمكن توليده في هذه الجلسة** لأن توليده (`npm install`) يتطلب نفس الوصول لسجل npm الذي رفضته سياسة الشبكة (`E403`) في كل محاولة. **الحل الوحيد الصحيح:** تشغيل `npm install` مرة واحدة في أي بيئة متصلة بالإنترنت (جهاز المطوّر، أو حتى Codespace/Actions نفسه بخطوة أولى مخصصة)، والتزام (`commit`) ملف `package-lock.json` الناتج. **لم أُغيِّر أي إصدار حزمة اصطناعيًا لتلفيق قفل وهمي**، كما طلبتَ صراحة.

لا عوائق أخرى — التصميم، البنية، حدود الاعتماد، ومعالجة الأسرار كلها سليمة ومُتحقَّق منها ثابتًا.

---

## F. Final Gate

```text
🟡 PHASE 2.1 READY WITH CONDITIONS
```

**الشرط الوحيد المتبقي (نفسه من PHASE 2.1، لم يتغيّر لأن طبيعته لا تتعلق بأي كود بل ببيئة التنفيذ):**

> شخص بإمكانه الوصول للإنترنت يُشغِّل `npm install` مرة واحدة في جذر المستودع، ويلتزم (`commit`) ملف `package-lock.json` الناتج، ثم يُعاد `cache: npm` إلى خطوة `Setup Node` في الـWorkflow (التعليق المتروك في الملف يشرح ذلك بدقة). بعدها فقط يصبح `npm ci` — وبالتبعية كل سلسلة البناء والنشر — قابلة للتنفيذ الفعلي والتحقق الحقيقي (الحالتان ٣ و٤ في القسم D).

**لا PHASE 2.2. لا Business Logic. لا UI. لا قرارات معمارية جديدة. توقّف هنا.**
