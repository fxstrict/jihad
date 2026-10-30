# Changelog

يوثّق هذا الملف التغييرات الجوهرية على المستودع (لا على وثائق التصميم نفسها، الموثَّقة في `docs/architecture/`).

## [Unreleased]

### Added
- هيكل Monorepo أولي (`packages/domain`, `apps/web`, `apps/portal`, `apps/script`) — PHASE 2.
- نواة `packages/domain` مشتركة: هوية حتمية (UUIDv5)، مقارنة قانونية، بصمة طلب، بوابة إقلاع (CF-01) — مع اختبارات سلوكية (`tests/contract/domain.test.ts`).
- جاهزية نشر GitHub Pages: `.github/workflows/deploy-pages.yml`، مسار أساس (`base`) ديناميكي، SPA fallback — PHASE 2.1.

### Added (S1 — استعادة البناء)
- `package-lock.json` حقيقي مُلتزَم به؛ `deploy-pages.yml` يعمل بـ`npm ci` و`cache: npm` على Node 22.
- ESLint 10 (flat config في `eslint.config.mjs`) يفرض INV-18 على `apps/script/src` مع اختبار آلي يرفض المخالف ويقبل المسموح (`tests/lint/inv18.test.ts`).
- Workflow `ci.yml`: typecheck ← lint ← test ← build ← تحقق PWA (يشمل مسار فرعي `/al-jihad/`).
- أيقونات PWA (192/512/maskable + apple-touch) لـ`apps/web` و`apps/portal`، وربطها في manifest وفي `index.html`.
- `scripts/verify-pwa-assets.mjs` + سكربتات `typecheck`/`lint`/`build`/`verify:pwa` في الجذر.
- اختبارات `studentRules` (37 اختبارًا) — دون تعديل قواعد المجال.

### Fixed
- إزالة مسار بناء Apps Script المزدوج (Domain مرتين) — بقي مسار واحد فعلي عبر esbuild alias — PHASE 2.1.
- (S1-CLOSE) إضافة `theme_color`/`background_color` إلى manifest البوابة (كان تحذير PWA في البناء) وتشديد `verify-pwa-assets` لفرضهما.
- (S1) استبدال `.eslintrc.cjs` القديم (لا يقرؤه ESLint ≥ 9، فلم يكن INV-18 مفروضًا فعليًا) بـ`eslint.config.mjs`.
- تصحيح `manifest.start_url`/`scope` في `apps/web` لتتبع `base` الديناميكي بدل قيمة ثابتة — PHASE 2.1.
