// يتحقق من ناتج بناء PWA (مجلد dist) فعليًا:
//  1) manifest.webmanifest موجود وصالح JSON، ولكل أيقونة فيه ملف حقيقي داخل dist بالحجم المعلن.
//  2) أيقونة 192 وأيقونة 512 موجودتان على الأقل، وأيقونة maskable موجودة.
//  3) إن مُرِّر base (مثل /al-jihad/): start_url وscope يساويانه، وكل مسارات index.html المحلية تبدأ به.
//  4) sw.js موجود وقائمة precache تحوي الأيقونات.
// الاستخدام: node scripts/verify-pwa-assets.mjs <distDir> [base]
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const [distArg, base = "/"] = process.argv.slice(2);
if (!distArg) {
  console.error("usage: verify-pwa-assets.mjs <distDir> [base]");
  process.exit(2);
}
const dist = resolve(distArg);
const problems = [];
const fail = (m) => problems.push(m);

function pngSize(file) {
  const b = readFileSync(file);
  const sig = b.subarray(0, 8).toString("hex");
  if (sig !== "89504e470d0a1a0a") return null;
  return `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`;
}

const manifestPath = join(dist, "manifest.webmanifest");
if (!existsSync(manifestPath)) {
  console.error(`FAIL: ${manifestPath} not found`);
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) fail("manifest.icons is empty");
const sizes = new Set();
let hasMaskable = false;
for (const icon of manifest.icons ?? []) {
  if (/^(\/|https?:)/.test(icon.src)) fail(`icon src must be relative to base, got "${icon.src}"`);
  const file = join(dist, icon.src);
  if (!existsSync(file) || statSync(file).size === 0) { fail(`icon file missing/empty: ${icon.src}`); continue; }
  const actual = pngSize(file);
  if (actual === null) fail(`not a PNG: ${icon.src}`);
  else if (actual !== icon.sizes) fail(`size mismatch ${icon.src}: manifest ${icon.sizes}, file ${actual}`);
  if (icon.type !== "image/png") fail(`unexpected type for ${icon.src}: ${icon.type}`);
  sizes.add(icon.sizes);
  if (String(icon.purpose ?? "").includes("maskable")) hasMaskable = true;
}
for (const need of ["192x192", "512x512"]) if (!sizes.has(need)) fail(`manifest lacks a ${need} icon`);
if (!hasMaskable) fail("manifest lacks a maskable icon");

if (manifest.start_url !== undefined && manifest.start_url !== base) fail(`start_url "${manifest.start_url}" != base "${base}"`);
if (manifest.scope !== undefined && manifest.scope !== base) fail(`scope "${manifest.scope}" != base "${base}"`);
if (!manifest.name || !manifest.short_name) fail("manifest name/short_name missing");
if (!/^#[0-9a-fA-F]{6}$/.test(manifest.theme_color ?? "")) fail("manifest.theme_color missing or not #rrggbb (required for installability)");
if (!/^#[0-9a-fA-F]{6}$/.test(manifest.background_color ?? "")) fail("manifest.background_color missing or not #rrggbb");
if (manifest.display !== "standalone") fail("manifest.display must be standalone");
if (manifest.dir !== "rtl" || manifest.lang !== "ar") fail("manifest must be lang=ar dir=rtl");

const html = readFileSync(join(dist, "index.html"), "utf8");
const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]).filter((u) => !/^(https?:|data:|#)/.test(u));
for (const ref of refs) {
  if (!ref.startsWith(base)) fail(`index.html reference "${ref}" does not start with base "${base}"`);
  const rel = ref.startsWith(base) ? ref.slice(base.length) : ref.replace(/^\//, "");
  if (!existsSync(join(dist, rel))) fail(`index.html references missing file: ${ref}`);
}
if (!refs.some((r) => r.includes("apple-touch-icon"))) fail("index.html lacks apple-touch-icon link");

const swPath = join(dist, "sw.js");
if (!existsSync(swPath)) fail("sw.js missing");
else {
  const sw = readFileSync(swPath, "utf8");
  for (const icon of manifest.icons ?? []) if (!sw.includes(icon.src)) fail(`sw.js precache does not list ${icon.src}`);
}

if (problems.length) {
  console.error(`verify-pwa-assets FAIL (${dist}, base=${base}):`);
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}
console.log(`verify-pwa-assets OK: ${dist} base=${base} icons=[${[...sizes].join(", ")}] refs=${refs.length}`);
