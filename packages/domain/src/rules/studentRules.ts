import type { StudentStatus } from "../entities/Student";

/**
 * قواعد التحقق من مدخلات الطالب — نقية (لا I/O).
 * تُشارَك لاحقًا مع الخادم عبر نفس الحزمة (ADR-010).
 */
export interface StudentInput {
  displayName: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  birthDate?: string | null;
  studentCode?: string | null;
  schoolName?: string | null;
  startedOn?: string | null;
}

export type StudentFieldError =
  | "required"
  | "too_short"
  | "too_long"
  | "invalid_phone"
  | "invalid_email"
  | "invalid_date"
  | "future_date"
  | "duplicate";

export type StudentErrors = Partial<Record<keyof StudentInput, StudentFieldError>>;

export interface ValidStudent {
  displayName: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  birthDate: string | null;
  studentCode: string | null;
  schoolName: string | null;
  startedOn: string | null;
}

export type ValidationResult =
  | { ok: true; value: ValidStudent }
  | { ok: false; errors: StudentErrors };

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const EXT_ARABIC_INDIC = "۰۱۲۳۴۵۶۷۸۹";

/** يحوّل الأرقام العربية/الفارسية إلى لاتينية. */
export function normalizeDigits(s: string): string {
  let out = "";
  for (const ch of s) {
    const a = ARABIC_INDIC.indexOf(ch);
    const b = EXT_ARABIC_INDIC.indexOf(ch);
    out += a >= 0 ? String(a) : b >= 0 ? String(b) : ch;
  }
  return out;
}

/** ينظّف هاتفًا: يحذف المسافات والشرطات والأقواس، يُبقي + في البداية فقط. null إن غير صالح. */
export function normalizePhone(raw: string): string | null {
  const s = normalizeDigits(raw.trim()).replace(/[\s\-().]/g, "");
  if (!/^\+?\d{7,15}$/.test(s)) return null;
  return s;
}

function isRealDate(ymd: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return false;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1) return false;
  const dim = [31, y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return d <= dim[mo - 1]!;
}

const blankToNull = (v: string | null | undefined): string | null => {
  if (v === undefined || v === null) return null;
  const t = v.trim();
  return t === "" ? null : t;
};

/** @param todayYmd تاريخ اليوم المحلي YYYY-MM-DD (يُمرَّر من الخارج — Domain لا يقرأ الساعة). */
export function validateStudentInput(input: StudentInput, todayYmd: string): ValidationResult {
  const errors: StudentErrors = {};

  const name = (input.displayName ?? "").trim().replace(/\s+/g, " ");
  if (name === "") errors.displayName = "required";
  else if (name.length < 2) errors.displayName = "too_short";
  else if (name.length > 100) errors.displayName = "too_long";

  const phoneRaw = blankToNull(input.phone);
  let phone: string | null = null;
  if (phoneRaw !== null) {
    phone = normalizePhone(phoneRaw);
    if (phone === null) errors.phone = "invalid_phone";
  }

  const waRaw = blankToNull(input.whatsapp);
  let whatsapp: string | null = null;
  if (waRaw !== null) {
    whatsapp = normalizePhone(waRaw);
    if (whatsapp === null) errors.whatsapp = "invalid_phone";
  }

  const emailRaw = blankToNull(input.email);
  let email: string | null = null;
  if (emailRaw !== null) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) || emailRaw.length > 254) errors.email = "invalid_email";
    else email = emailRaw.toLowerCase();
  }

  const birthRaw = blankToNull(input.birthDate);
  let birthDate: string | null = null;
  if (birthRaw !== null) {
    const b = normalizeDigits(birthRaw);
    if (!isRealDate(b)) errors.birthDate = "invalid_date";
    else if (b > todayYmd) errors.birthDate = "future_date";
    else birthDate = b;
  }

  const startedRaw = blankToNull(input.startedOn);
  let startedOn: string | null = null;
  if (startedRaw !== null) {
    const s = normalizeDigits(startedRaw);
    if (!isRealDate(s)) errors.startedOn = "invalid_date";
    else startedOn = s;
  }

  const code = blankToNull(input.studentCode);
  if (code !== null && code.length > 30) errors.studentCode = "too_long";

  const school = blankToNull(input.schoolName);
  if (school !== null && school.length > 100) errors.schoolName = "too_long";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { displayName: name, phone, whatsapp, email, birthDate, studentCode: code, schoolName: school, startedOn },
  };
}

/** انتقالات حالة الطالب المسموحة (PHASE 1 §C.6). الأرشفة متاحة من أي حالة. */
const ALLOWED: Record<StudentStatus, StudentStatus[]> = {
  active: ["paused", "graduated", "archived"],
  paused: ["active", "graduated", "archived"],
  graduated: ["archived", "active"],
  archived: ["active"],
};

export function canTransitionStudent(from: StudentStatus, to: StudentStatus): boolean {
  return from !== to && ALLOWED[from].includes(to);
}
