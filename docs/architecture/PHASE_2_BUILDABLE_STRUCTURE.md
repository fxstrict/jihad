```text
PROJECT: الجهاد
DOCUMENT: PHASE 2 — BUILDABLE REPOSITORY & MODULE STRUCTURE
STATUS: ARCHITECTURE BLUEPRINT (PARTIAL — §9.1 items 1–2 of PHASE 1)
IMPLEMENTATION: SKELETON ONLY (no business/domain logic yet — see §5)
```

# PHASE 2 — البنية القابلة للبناء

هذا يغطي **بندين فقط** من قائمة PHASE 2 الكاملة في PHASE 1 (§9.1): **(1) الهيكل النهائي للمجلدات** و**(2) تفصيل وحدات Apps Script وحدود الاعتماد الآلية**. الباقي (الهوية البصرية الكاملة، نموذج التهديدات، استراتيجية الاختبار التفصيلية، Wizard الإعداد، ملفات ADR الفعلية) يبقى لاحقًا كما هو مؤجَّل في PHASE 1.

---

## 1. قرارات التقنية (ADR-022…025)

| ADR | القرار | البديل المرفوض | السبب |
|---|---|---|---|
| **ADR-022** | **TypeScript** في كل مكان (PWA + Apps Script)، **Vite** كأداة بناء للـPWA، **Preact** (لا React) للواجهة، **Tailwind CSS** للتصميم، **Vitest** للاختبارات الوحدوية/العقدية، **Playwright** لـE2E | React الكامل، أو بلا إطار عمل إطلاقًا | Preact ≈4KB (يخدم ميزانية أداء الأجهزة المتوسطة، §H.4 هدف الإقلاع)، بواجهة برمجية متوافقة مع React (سهل على أي مساعد/مطوّر)؛ TypeScript يجعل حدود الحقن بين الطبقات (§6 من PHASE 1) قابلة للتحقق **بالمُصرِّف نفسه** لا بالتوثيق فقط |
| **ADR-023** | **Monorepo بـnpm workspaces** (لا pnpm/turborepo): `packages/domain` (النواة النقية المشتركة، ADR-010) + `apps/web` (تطبيق المدرس) + `apps/portal` (بوابة الأهل، منفصلة تمامًا INV-28) + `apps/script` (مصدر Apps Script) | حزمة واحدة مسطَّحة، أو أدوات Monorepo أثقل | يحتاج Domain مشتركًا فعليًا بين وقتي تشغيل مختلفين (متصفح وApps Script V8)؛ npm workspaces كافٍ لحجم هذا المشروع بلا تعقيد إضافي |
| **ADR-024** | **`esbuild`** يبني `packages/domain` كحزمة ESM عادية (يستهلكها Vite في `apps/web`، وبوابة `apps/portal` لا تستهلكها إطلاقًا — INV-28)؛ **`apps/script` يبني نسخته الخاصة مباشرة من مصدر `packages/domain` عبر alias في esbuild** (بلا حاجة لملف وسيط مُولَّد منفصل — bundling إسبيلد نفسه هو آلية "بناء آلي بلا كتابة يدوية مزدوجة")، منتجًا حزمة IIFE واحدة (`dist/Server.js`) تشمل Domain والوحدات معًا؛ **`clasp`** (أداة Google الرسمية) لدفع/سحب مشروع Apps Script من نفس المستودع **(مُصحَّح PHASE 2.1: أُزيل مسار بناء GAS منفصل داخل `packages/domain` كان يُنتج قطعة غير مُستهلَكة فعليًا؛ التبسيط هذا خفض عدد آليات مشاركة Domain من اثنتين متعارضتين إلى واحدة فعلية)** | كتابة منطق Domain مرتين يدويًا لكل بيئة؛ أو الإبقاء على مسارَي بناء متوازيين لنفس الغرض (ما كان قائمًا قبل PHASE 2.1) | ADR-010 يتطلب أن تكون قواعد Domain **نفسها حرفيًا** على العميل والخادم؛ إعادة الكتابة اليدوية بالضبط ما يُنتج انحرافًا (الخطر R-07 في PHASE 1)؛ ووجود آليتين متوازيتين لنفس الهدف كان تعقيدًا زائدًا بلا فائدة (أحدهما ميت فعليًا) |
| **ADR-025** | **`dependency-cruiser`** (لا ESLint plugin مخصص) لتطبيق قواعد الاعتماد (§6 من PHASE 1) آليًا في CI: يفشل البناء إن استورد `ui` من `data` مباشرة، أو `domain` من أي شيء خارج نفسه، إلخ | الاعتماد على المراجعة اليدوية للـPull Requests فقط | `dependency-cruiser` يقرأ `tsconfig` نفسه ولا يحتاج ضبطًا مكررًا؛ يفشل البناء **آليًا** لا بعد نسيان بشري |

---

## 2. شجرة المستودع الكاملة (Monorepo)

```text
al-jihad/
├── package.json                    # npm workspaces: packages/*, apps/*
├── tsconfig.base.json              # إعدادات TS مشتركة (strict: true)
├── .gitignore                      # يستبعد: .env, apps/script/.clasp.json (سري), dist/, node_modules/
├── .dependency-cruiser.cjs         # قواعد الاعتماد الآلية (§6 PHASE 1 → CI)
├── README.md
├── CHANGELOG.md
│
├── docs/
│   ├── architecture/               # نسخ .md من PHASE 0/1/1.2/1.3/1.4 (هذه الوثائق نفسها)
│   ├── adr/                        # ADR-001…025 كل واحد ملف .md مستقل (لم تُنشأ بعد، PHASE 2 لاحق)
│   ├── audits/
│   └── runbooks/                   # Setup / Backup / Recovery (نص تشغيلي، لاحق)
│
├── schema/
│   └── entities/                   # Schema Registry: تعريف .json/.ts لكل كيان في §A
│                                    # (مصدر واحد يُشتق منه: مخازن IDB + أعمدة Sheets + مدققات Zod)
│
├── migrations/
│   ├── local/                      # ترحيلات IndexedDB (Meta وOrg، مرقّمة، §P.2)
│   └── remote/                     # ترحيلات Sheets (Expand→Migrate→Contract، §P.3)
│
├── packages/
│   └── domain/                     # ==== النواة المشتركة (ADR-010) — الأهم في هذا الهيكل ====
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── entities/           # تعريفات TS لكل كيان في §A (Student, Lesson, ScheduleRule...)
│       │   ├── value-objects/      # LocalDate, LocalTime, ZonedSchedule, Money (§S، §A.13)
│       │   ├── rules/              # قواعد نقية: canonicalEquals (§G.12.2), deriveId (§F.2.1),
│       │   │                       #   generateInstances (§F.2.4), stateMachines (Lesson §C.1...)
│       │   ├── ports/               # واجهات فقط (Clock, IdGenerator, Random) — لا تنفيذ
│       │   └── index.ts
│       ├── build.esm.mjs           # esbuild → dist/esm (يستهلكه apps/web عبر Vite)
│
├── apps/
│   ├── web/                        # ==== تطبيق المدرس (PWA) ====
│   │   ├── package.json
│   │   ├── vite.config.ts          # + vite-plugin-pwa (Manifest + Service Worker)
│   │   ├── tsconfig.json
│   │   ├── index.html
│   │   ├── public/
│   │   │   ├── manifest.webmanifest
│   │   │   └── icons/              # (فارغة الآن — الهوية البصرية لاحقًا، §X)
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── application/        # Use Cases + Unit of Work (§D.5) — يستدعي packages/domain
│   │       │   ├── bootstrap/       # ResumeFirstBootstrap, FirstInstallWizard (§H)
│   │       │   ├── lessons/         # ScheduleLesson, CompleteLesson, RescheduleLesson...
│   │       │   ├── students/        # CreateStudent, ArchiveStudent...
│   │       │   └── access-guard.ts  # AccessGrant (§H.3) — بوابة كل Use Case كاتب
│   │       ├── data/
│   │       │   ├── local-db/        # LocalDatabaseAdapter (IndexedDB)، meta.ts، org.ts (§D.1)
│   │       │   └── repositories/    # StudentRepository, LessonRepository... (عقد ثابت §D.4)
│   │       ├── sync/                # SyncCoordinator، Outbox، Cursor، Conflicts (§G)
│   │       ├── notifications/       # ReminderPlanner، ProviderRouter، Providers (§I)
│   │       ├── integrations/        # ApiClient (طلبات "بسيطة" بلا Preflight)، LicenseVerifier (§N)
│   │       ├── auth/                # AuthSession محلي، PIN، AccessGuard (§M)
│   │       ├── ui/                  # المكوّنات (Tokens ← Primitives ← Composites ← Features، §X)
│   │       ├── features/            # شاشات مركَّبة لكل نطاق (لوحة، طلاب، حصص، تقويم يومي...)
│   │       └── sw/                  # Service Worker (Cache فقط، INV-04 — لا منطق أعمال)
│   │
│   ├── portal/                     # ==== بوابة ولي الأمر — منفصلة تمامًا (INV-28) ====
│   │   ├── package.json
│   │   ├── vite.config.ts          # Service Worker مستقل، بناء مستقل، لا يستورد apps/web
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── api-client.ts       # يقرأ pv_* فقط عبر عقد ضيق (§L)
│   │   │   ├── local-cache/        # jihad_portal (قراءة فقط، آخر لقطة)
│   │   │   └── features/           # الأبناء، اليوم، السجل، الواجبات
│   │   └── (لا استيراد لـpackages/domain — منطق العرض فقط، §L.1)
│   │
│   └── script/                     # ==== مشروع Apps Script (الخادم) ====
│       ├── .clasp.json.example     # (الحقيقي محلي وسرّي، لا يُرفَع)
│       ├── appsscript.json
│       ├── build.mjs               # يبني src/index.ts + Domain (عبر alias مباشرة لمصدره) في IIFE واحد
│       └── src/                    # وحدات §W.1، كل وحدة ملف/مجلد مستقل، بحدود اعتماد §W.3
│           ├── Router.ts
│           ├── Auth.ts
│           ├── Authorization.ts
│           ├── Validation.ts
│           ├── Sync.ts             # WAL + committedRevision + _Ops (§E.4، §G.4)
│           ├── Projection.ts       # pv_* + طابور Calendar
│           ├── RateLimit.ts
│           ├── LicenseClient.ts
│           ├── Backup.ts
│           ├── Audit.ts
│           ├── Health.ts
│           ├── Config.ts
│           ├── Setup.ts
│           ├── repositories/
│           │   └── SheetsRepository.ts   # الوحيد الذي يعرف SpreadsheetApp (§W.3)
│           ├── adapters/
│           │   ├── DriveAdapter.ts
│           │   ├── CalendarAdapter.ts
│           │   └── GmailAdapter.ts
│
└── tests/
    ├── contract/                   # عقود Repository/API (تُشغَّل بـVitest)
    ├── sync/                       # Idempotency/Conflict/Offline (سيناريوهات BOOT/REM/SYNC/ORG)
    ├── migrations/fixtures/        # قواعد قديمة تُرقَّى وتُفحَص
    ├── sheets-encoding/            # اختبار قبول ترميز النصوص (§E.3، "2025/1234")
    └── e2e/                        # Playwright — يشمل محاكاة Offline (وضع الطيران)
```

## 3. حدود الاعتماد الآلية (يُطبَّقها `.dependency-cruiser.cjs`)

جدول §6 من PHASE 1 يتحول هنا إلى قواعد فعلية تفشل البناء عند خرقها:

| من | إلى (مسموح) | ممنوع |
|---|---|---|
| `apps/web/src/ui`, `features` | `application` فقط | `data`, `sync`, `integrations` مباشرة |
| `apps/web/src/application` | `packages/domain`, `data` (عبر Ports), `sync` (إدراج فقط) | استدعاء `ui`، وصول IndexedDB مباشر |
| `packages/domain` | لا شيء خارج نفسه | أي I/O، أي حزمة `apps/*` |
| `apps/web/src/sync` | `data`, `packages/domain` | `ui`، استدعاء Use Cases مباشرة (مبدأ PHASE 1: Sync يطبّق السحب عبر مسار مخصص لا عبر الاستخدام العادي) |
| `apps/script/src/*` (كل وحدة) | `Config` + خدمة Google الخاصة بها فقط | أي وحدة أخرى بلا إذن صريح في الجدول (§W.3 الأصلي، يُنسَخ حرفيًا كقواعد أداة) |
| `apps/portal` | لا شيء من `apps/web` أو `packages/domain` | (INV-28) |

## 4. اصطلاحات التسمية

- ملفات TS: `PascalCase.ts` للكيانات/الأصناف، `camelCase.ts` للدوال النقية.
- كل Use Case ملف مستقل باسم الفعل: `scheduleLesson.ts` لا `lessonService.ts` جامع (يمنع تكرار مشكلة `saveCase()` من الحسام، L-16).
- لا ملف Apps Script يتجاوز ~300 سطر؛ تجاوزه إشارة لتقسيمه.

## 5. ما هو "قابل للتشغيل" الآن، وما ليس كذلك

هذا الهيكل + السقالة المرفقة (§6) **يُشغَّل ويُبنى فعليًا** (يمكنك تشغيل `npm install && npm run dev`) — لكنه **هيكل فارغ من منطق الأعمال**: لا كيانات Domain كاملة بعد (فقط دالتان حقيقيتان من §F.2/§G.12.2 كإثبات مفهوم لخط أنابيب البناء المشترك)، لا شاشات فعلية (شاشة بيضاء بعنوان فقط)، لا Apps Script حقيقي (وحدة Router فارغة ترد "pong"). **هذا مقصود**: الهدف إثبات أن الأدوات والحدود والخط المشترك (Domain → PWA + Domain → Apps Script) تعمل ميكانيكيًا **قبل** كتابة أي منطق أعمال حقيقي — لا كتابة تطبيق كامل الآن.
