/**
 * الحقول الأساسية المشتركة لكل كيان مزامَن (PHASE 1 §4.2).
 * نقية: لا I/O. الأوقات Instant = ms منذ epoch (UTC).
 */
export interface BaseFields {
  id: string;
  organizationId: string;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
  updatedBy: string;
  /** 0 = لم يؤكَّد من الخادم بعد (PHASE 1 §4.2). يمنحه الخادم فقط. */
  serverRevision: number;
  /** Tombstone. null = غير محذوف. */
  deletedAt: number | null;
}
