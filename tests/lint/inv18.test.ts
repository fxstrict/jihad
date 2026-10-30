import { describe, it, expect } from "vitest";
import { ESLint } from "eslint";
import { fileURLToPath } from "node:url";

/**
 * INV-18 (PHASE 1 §W.3): خدمات Google لا تُستدعى إلا داخل apps/script/src/{repositories,adapters}.
 * هذا الاختبار يشغّل ESLint الحقيقي بإعداد المشروع (eslint.config.mjs) على نصوص مخالفة ومسموحة،
 * ويثبت أن القاعدة ترفض المخالف وتقبل المسموح (لا مجرد وجود ملف الإعداد).
 */
const root = fileURLToPath(new URL("../../", import.meta.url));
const eslint = new ESLint({ cwd: root });

async function lint(code: string, filePath: string) {
  const [result] = await eslint.lintText(code, { filePath: `${root}${filePath}` });
  return result!.messages.filter((m) => m.severity === 2);
}

const SERVICES = ["SpreadsheetApp", "DriveApp", "CalendarApp", "GmailApp"] as const;

describe("INV-18: Google services only inside L1 (repositories/adapters)", () => {
  for (const svc of SERVICES) {
    it(`rejects direct ${svc} in a service file`, async () => {
      const errs = await lint(`export const x = ${svc}.getActive();`, "apps/script/src/services/Bad.ts");
      expect(errs.length).toBeGreaterThan(0);
      expect(errs[0]!.message).toContain("INV-18");
      expect(errs[0]!.message).toContain(svc);
    });

    it(`rejects globalThis.${svc} and globalThis["${svc}"] (bypass attempts)`, async () => {
      const dot = await lint(`export const x = globalThis.${svc};`, "apps/script/src/services/Bad.ts");
      const bracket = await lint(`export const x = globalThis["${svc}"];`, "apps/script/src/services/Bad.ts");
      expect(dot.length).toBeGreaterThan(0);
      expect(bracket.length).toBeGreaterThan(0);
    });
  }

  it("rejects a violation in Router.ts (top of the stack)", async () => {
    const errs = await lint(`export function h() { return SpreadsheetApp.openById("x"); }`, "apps/script/src/Router.ts");
    expect(errs.length).toBe(1);
  });

  it("accepts SpreadsheetApp inside repositories/", async () => {
    const errs = await lint(`export const x = SpreadsheetApp.getActive();`, "apps/script/src/repositories/SheetsRepository.ts");
    expect(errs).toEqual([]);
  });

  it("accepts Drive/Calendar/Gmail inside adapters/", async () => {
    for (const [svc, file] of [["DriveApp", "DriveAdapter"], ["CalendarApp", "CalendarAdapter"], ["GmailApp", "GmailAdapter"]] as const) {
      const errs = await lint(`export const x = ${svc}.foo();`, `apps/script/src/adapters/${file}.ts`);
      expect(errs).toEqual([]);
    }
  });

  it("accepts unrelated Apps Script globals (ContentService) in Router", async () => {
    const errs = await lint(`export const x = ContentService.createTextOutput("a");`, "apps/script/src/Router.ts");
    expect(errs).toEqual([]);
  });

  it("does not flag the real current sources of apps/script/src", async () => {
    const results = await eslint.lintFiles(["apps/script/src/**/*.ts"]);
    const errors = results.flatMap((r) => r.messages.filter((m) => m.severity === 2));
    expect(errors).toEqual([]);
  });
});
