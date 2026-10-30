import { canonicalize, type Json } from "./canonicalEquals";
import { sha1 } from "./sha1";
import { utf8Encode } from "./utf8";

/**
 * requestFingerprint (PHASE 1 §A.12 / §G.4 خطوة 2 / INV-61):
 * تجزئة قانونية لـ{entityType, entityId, opType, changes/payload}.
 * تُخزَّن في _Ops مع operationId؛ تطابقها شرط ALREADY_APPLIED،
 * وعدم تطابقها مع نفس operationId = IDEMPOTENCY_KEY_REUSE.
 * (SHA-1 هنا للبصمة لا للأمان.)
 */
export interface OperationIdentity {
  entityType: string;
  entityId: string;
  opType: "create" | "patch" | "delete" | "restore" | "command";
  body: Json; // changes أو payload
}

export function requestFingerprint(op: OperationIdentity): string {
  const canon = canonicalize({
    entityType: op.entityType,
    entityId: op.entityId,
    opType: op.opType,
    body: op.body,
  });
  return Array.from(sha1(utf8Encode(canon)), (x) => x.toString(16).padStart(2, "0")).join("");
}

export type IdempotencyVerdict = "NEW_OPERATION" | "ALREADY_APPLIED" | "IDEMPOTENCY_KEY_REUSE";

/** خطوة §G.4.2.a فقط: مقارنة الطلب الوارد بما هو مخزَّن في _Ops لنفس operationId. */
export function checkIdempotency(
  stored: { requestFingerprint: string } | undefined,
  incoming: OperationIdentity
): IdempotencyVerdict {
  if (!stored) return "NEW_OPERATION";
  return stored.requestFingerprint === requestFingerprint(incoming)
    ? "ALREADY_APPLIED"
    : "IDEMPOTENCY_KEY_REUSE";
}
