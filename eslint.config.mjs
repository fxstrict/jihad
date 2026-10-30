/**
 * فرض INV-18 (PHASE 1 §W.3): لا استدعاء لخدمات Google (SpreadsheetApp/DriveApp/CalendarApp/GmailApp)
 * إلا داخل طبقة L1: apps/script/src/repositories و apps/script/src/adapters.
 *
 * dependency-cruiser يفحص رسم الاستيراد فقط، فهذا القيد (استخدام Globals) يُفرض هنا (ADR-025).
 * الصيغة flat config (ESLint ≥ 9) — حلّت محل .eslintrc.cjs القديم الذي لا يقرؤه ESLint ≥ 9 (Finding F-1).
 *
 * النطاق: apps/script/src/** فقط، والاستثناء الوحيد هو المجلدان المخصصان أعلاه (بلا أنماط أوسع).
 * القواعد تغطي: الإشارة المباشرة (SpreadsheetApp.x)، والوصول عبر globalThis/this/self/window، والوصول بالأقواس.
 */
import tsParser from "@typescript-eslint/parser";

const GOOGLE_SERVICES = [
  { name: "SpreadsheetApp", via: "repositories/SheetsRepository.ts" },
  { name: "DriveApp", via: "adapters/DriveAdapter.ts" },
  { name: "CalendarApp", via: "adapters/CalendarAdapter.ts" },
  { name: "GmailApp", via: "adapters/GmailAdapter.ts" },
];

const restrictedGlobals = GOOGLE_SERVICES.map(({ name, via }) => ({
  name,
  message: `INV-18: استدعِ ${name} عبر ${via} فقط (طبقة L1).`,
}));

const restrictedProperties = GOOGLE_SERVICES.flatMap(({ name, via }) =>
  ["globalThis", "self", "window", "this"].map((object) => ({
    object,
    property: name,
    message: `INV-18: استدعِ ${name} عبر ${via} فقط (طبقة L1).`,
  })),
);

const restrictedSyntax = GOOGLE_SERVICES.map(({ name, via }) => ({
  // globalThis["SpreadsheetApp"] وما يشبهه
  selector: `MemberExpression[computed=true] > Literal[value="${name}"]`,
  message: `INV-18: استدعِ ${name} عبر ${via} فقط (طبقة L1).`,
}));

export default [
  { ignores: ["**/dist/**", "**/node_modules/**"] },
  {
    files: ["apps/script/src/**/*.ts"],
    ignores: ["apps/script/src/repositories/**", "apps/script/src/adapters/**"],
    languageOptions: { parser: tsParser, ecmaVersion: 2020, sourceType: "module" },
    rules: {
      "no-restricted-globals": ["error", ...restrictedGlobals],
      "no-restricted-properties": ["error", ...restrictedProperties],
      "no-restricted-syntax": ["error", ...restrictedSyntax],
    },
  },
];
