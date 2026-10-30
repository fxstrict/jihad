/**
 * المقارنة القانونية (PHASE 1 §G.12.2) — تُستخدَم في:
 *   - تصادم الإنشاء الحتمي (CanonicalEquals(payload, R) ⇒ ALREADY_APPLIED)
 *   - حساب requestFingerprint (بصمة الطلب، §G.4 خطوة 2 / INV-61)
 *
 * القواعد: مفاتيح JSON بترتيب ثابت · null ≡ غياب الحقل · تطبيع Unicode NFC للنص
 * (الحروف العربية كما هي) · أرقام بلا تنسيق.
 */
export type Json = null | boolean | number | string | Json[] | { [k: string]: Json | undefined };

export function canonicalize(value: Json | undefined): string {
  if (value === undefined || value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value.normalize("NFC"));
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("non-finite number is not canonicalizable");
    return JSON.stringify(value);
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return `[${value.map((v) => canonicalize(v)).join(",")}]`;
  const keys = Object.keys(value)
    .filter((k) => value[k] !== undefined && value[k] !== null) // null ≡ غياب الحقل
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k.normalize("NFC"))}:${canonicalize(value[k])}`).join(",")}}`;
}

export function canonicalEquals(a: Json | undefined, b: Json | undefined): boolean {
  return canonicalize(a) === canonicalize(b);
}
