import { sha1 } from "./sha1";
import { utf8Encode } from "./utf8";

/**
 * مواصفة الهوية الحتمية (PHASE 1 §F.2.1، ADR-019):
 *   id = UUIDv5(NAMESPACE_JIHAD_V1, "<entityType>|<part1>|<part2>|…")
 *
 * تغيير NAMESPACE_JIHAD_V1 = توليد هوية جديدة لكل السجلات المشتقة = Migration موثَّقة (لا يحدث عرضًا).
 */
export const NAMESPACE_JIHAD_V1 = "6f0a3c52-4b1e-5a7d-9c2e-8d1f4a6b7c30";

function uuidToBytes(uuid: string): Uint8Array {
  const hex = uuid.replace(/-/g, "");
  if (hex.length !== 32) throw new Error(`invalid uuid: ${uuid}`);
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

function bytesToUuid(b: Uint8Array): string {
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** UUIDv5 قياسي (RFC 4122 §4.3): SHA-1 على (namespace || name)، ثم ضبط الإصدار والـvariant. */
export function uuidV5(name: string, namespace: string): string {
  const ns = uuidToBytes(namespace);
  const nm = utf8Encode(name);
  const data = new Uint8Array(ns.length + nm.length);
  data.set(ns);
  data.set(nm, ns.length);
  const hash = sha1(data).slice(0, 16);
  hash[6] = (hash[6]! & 0x0f) | 0x50;
  hash[8] = (hash[8]! & 0x3f) | 0x80;
  return bytesToUuid(hash);
}

/**
 * الأجزاء المسموحة: UUID بحروف صغيرة، تاريخ ISO YYYY-MM-DD، أعداد صحيحة، fireAtUtc كعدد صحيح.
 * ممنوع: نصوص حرة، أسماء، أوقات محلية غير قانونية (§F.2.1).
 */
export type IdPart = string | number;

export function deriveId(entityType: string, parts: IdPart[]): string {
  const canonicalName = [entityType, ...parts.map((p) => String(p))].join("|");
  return uuidV5(canonicalName, NAMESPACE_JIHAD_V1);
}

/** الحصة المولَّدة: lesson|<scheduleRuleId>|<occurrenceKey> (§F.2.2). */
export function deriveLessonId(scheduleRuleId: string, occurrenceKey: string): string {
  return deriveId("lesson", [scheduleRuleId.toLowerCase(), occurrenceKey]);
}
