// يبني مشروع Apps Script: يجمع src/ في ملف واحد IIFE، مع تضمين النواة المشتركة (@al-jihad/domain)
// مباشرة من مصدرها عبر alias — هذا هو المسار الوحيد لمشاركة Domain مع الخادم (ADR-024، مُصحَّح PHASE 2.1:
// لم يعد هناك بناء GAS منفصل داخل packages/domain ولا ملف shared/Domain.generated.js وسيط؛ esbuild وحده
// هو آلية "بناء آلي، لا كتابة Domain مرتين يدويًا" هنا).
// ثم يضيف Entry.js (الدوال العليا doGet/doPost التي يشترطها Apps Script) وappsscript.json.
import { build } from "esbuild";
import { mkdirSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const domainSrc = fileURLToPath(new URL("../../packages/domain/src/index.ts", import.meta.url));

await build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/Server.js",
  bundle: true,
  format: "iife",
  globalName: "JihadServer",
  target: "es2019",
  alias: { "@al-jihad/domain": domainSrc },
});

mkdirSync("dist", { recursive: true });
copyFileSync("entry/Entry.js", "dist/Entry.js");
copyFileSync("appsscript.json", "dist/appsscript.json");
console.log("script: build done -> dist/ (Server.js, Entry.js, appsscript.json)");
