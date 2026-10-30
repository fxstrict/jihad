import type { Json } from "../rules/canonicalEquals";
import type { Person, Student } from "../entities/Student";

/**
 * Port مخزن الطلاب — يملكه Domain (UI → Application → Domain → Ports → Infrastructure).
 * التنفيذ الفعلي (IndexedDB) في apps/web/src/data/repositories/StudentRepository.ts.
 */
export interface StudentView {
  student: Student;
  person: Person;
}

export interface FieldChange {
  field: string;
  from: Json | null;
  to: Json | null;
}

/** عملية Outbox مرشَّحة (PHASE 1 §A.12 SyncOperation). المخزن يضيف clientSeq/status/attempts ضمن نفس المعاملة (INV-22). */
export interface OperationDraft {
  operationId: string;
  entityType: "Person" | "Student";
  entityId: string;
  opType: "create" | "patch";
  changes: FieldChange[] | null;
  payload: Json | null;
  baseServerRevision: number;
  requestFingerprint: string;
  createdAt: number;
}

export interface AuditDraft {
  id: string;
  at: number;
  actorId: string;
  action: string;
  entityType: "Person" | "Student";
  entityId: string;
  changedFields: string[];
  correlationId: string;
}

/** وحدة كتابة ذرية واحدة (Unit of Work): كل ما فيها يُلتزَم معًا أو لا شيء (PHASE 1 §D.5). */
export interface StudentChange {
  person?: Person;
  student?: Student;
  operations: OperationDraft[];
  audit: AuditDraft[];
}

export interface ListOptions {
  includeArchived: boolean;
}

export interface ListResult {
  items: StudentView[];
  /** true إن قُطعت القائمة عند الحد الأقصى (الترقيم الكامل لاحقًا — INV-54). */
  truncated: boolean;
}

/** يُرمى عند خرق قيد فريد (studentCode). */
export class DuplicateStudentCodeError extends Error {
  constructor() {
    super("duplicate studentCode");
    this.name = "DuplicateStudentCodeError";
  }
}

export interface StudentRepository {
  list(options: ListOptions): Promise<ListResult>;
  get(studentId: string): Promise<StudentView | undefined>;
  commit(change: StudentChange): Promise<void>;
}
