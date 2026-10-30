import { deriveLessonId } from "@al-jihad/domain";
import { API_VERSION } from "./Config";

/**
 * L4: Router — نقطة الدخول فقط (§W.1). لا يعرف Sheets ولا أي خدمة Google للبيانات (§W.3).
 * الهيكل الحالي: ping يثبت أن النواة المشتركة تعمل حرفيًا على الخادم بنفس الشيفرة (ADR-010).
 */
function json(obj: unknown) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

export function handleGet(_e: unknown) {
  return json({ ok: true, apiVersion: API_VERSION });
}

export function handlePost(e: { postData?: { contents?: string } }) {
  let req: { op?: string } = {};
  try {
    req = JSON.parse(e.postData?.contents ?? "{}");
  } catch {
    return json({ ok: false, error: { code: "VALIDATION", retryable: false } });
  }
  if (req.op === "ping") {
    return json({ ok: true, apiVersion: API_VERSION, sharedDomainProof: deriveLessonId("demo-rule", "2026-09-27") });
  }
  return json({ ok: false, error: { code: "UNKNOWN_OP", retryable: false } });
}
