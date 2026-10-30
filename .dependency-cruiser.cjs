/**
 * ينفّذ حدود الاعتماد الموصوفة في PHASE_1_FINAL_CONSOLIDATED.md §6 (ARCHITECTURAL BOUNDARIES)
 * وPHASE_2_BUILDABLE_STRUCTURE.md §3 كقواعد تفشل البناء آليًا، لا مراجعة يدوية فقط.
 */
module.exports = {
  forbidden: [
    {
      name: "domain-has-no-dependencies",
      comment: "packages/domain لا يعتمد على أي شيء خارج نفسه (لا I/O، لا DOM، لا Google APIs).",
      severity: "error",
      from: { path: "^packages/domain" },
      to: { pathNot: "^packages/domain" }
    },
    {
      name: "ui-cannot-reach-data-or-sync",
      comment: "UI/features تستدعي application فقط، لا data أو sync أو integrations مباشرة (INV-01/02).",
      severity: "error",
      from: { path: "^apps/web/src/(ui|features)" },
      to: { path: "^apps/web/src/(data|sync|integrations)" }
    },
    {
      name: "application-cannot-reach-ui",
      comment: "لا اعتماد عكسي: application لا يستورد ui.",
      severity: "error",
      from: { path: "^apps/web/src/application" },
      to: { path: "^apps/web/src/ui" }
    },
    {
      name: "sync-cannot-reach-ui-or-usecases",
      comment: "Sync يطبّق السحب عبر مسار مخصص، لا عبر استدعاء Use Cases العادية أو UI.",
      severity: "error",
      from: { path: "^apps/web/src/sync" },
      to: { path: "^apps/web/src/(ui|features|application/(?!apply-pulled-page))" }
    },
    {
      name: "portal-is-fully-isolated",
      comment: "بوابة ولي الأمر لا تعتمد على apps/web ولا على packages/domain (INV-28).",
      severity: "error",
      from: { path: "^apps/portal" },
      to: { path: "^(apps/web|packages/domain)" }
    }
    // ملاحظة: قيد "SheetsRepository هو المستدعي الوحيد لخدمات Google" (INV-18) هو تقييد على
    // استخدام Globals (SpreadsheetApp/DriveApp/...) لا على مخطط استيراد بين ملفات — dependency-cruiser
    // يفحص فقط رسم الاستيراد، فلا يمكنه فرض هذا. يُنفَّذ بدلًا منه عبر ESLint (eslint.config.mjs، قاعدة
    // no-restricted-globals على apps/script/src خارج repositories/adapters).
  ],
  options: {
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.base.json" },
    doNotFollow: { path: "node_modules" }
  }
};
