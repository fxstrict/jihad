import { canonicalEquals, type Json } from "./canonicalEquals";

/**
 * خطوة §G.4.2.b–d (بعد التأكد أن operationId غير موجود في _Ops):
 *   current == from → APPLIED (تعديل طازج)
 *   current == to   → NOOP_CONVERGED (تطابق قيمة نهائية بلا Provenance — ليس ALREADY_APPLIED)
 *   غير ذلك         → CONFLICT
 */
export type PatchVerdict = "APPLIED" | "NOOP_CONVERGED" | "CONFLICT";

export function classifyPatchField(current: Json | undefined, from: Json | undefined, to: Json | undefined): PatchVerdict {
  if (canonicalEquals(current, from)) return "APPLIED";
  if (canonicalEquals(current, to)) return "NOOP_CONVERGED";
  return "CONFLICT";
}
