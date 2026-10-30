/**
 * Ports (واجهات فقط) — Domain/Application لا يستدعيان الوقت أو العشوائية مباشرة (PHASE 1 §6.2).
 * التنفيذ في طبقة Infrastructure (apps/web/src/data/system.ts).
 */
export interface Clock {
  /** Instant الحالي بالميلي ثانية (UTC). */
  now(): number;
}

export interface IdGenerator {
  /** معرّف عميل جديد (UUIDv7: مرتّب زمنيًا، ADR-002). */
  newId(): string;
}
