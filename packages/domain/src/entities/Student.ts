import type { BaseFields } from "./base";

/** PHASE 1 §A.1: Person كيان مستقل عن Student (الهوية البشرية ≠ الدور الأكاديمي). */
export interface Person extends BaseFields {
  displayName: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  /** تاريخ محلي YYYY-MM-DD (LocalDate، §S.1). */
  birthDate: string | null;
}

export type StudentStatus = "active" | "paused" | "graduated" | "archived";

/** PHASE 1 §A.1. المرحلة/الصف يأتيان لاحقًا عبر StudentEnrollment (شريحة الكتالوجات الأكاديمية). */
export interface Student extends BaseFields {
  personId: string;
  studentCode: string | null;
  schoolName: string | null;
  status: StudentStatus;
  startedOn: string | null;
}

export const STUDENT_STATUSES: readonly StudentStatus[] = ["active", "paused", "graduated", "archived"];
