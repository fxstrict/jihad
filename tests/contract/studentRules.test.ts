import { describe, it, expect } from "vitest";
import {
  normalizeDigits,
  normalizePhone,
  validateStudentInput,
  canTransitionStudent,
  STUDENT_STATUSES,
  type StudentInput,
  type StudentStatus,
} from "../../packages/domain/src/index";

/**
 * اختبارات سلوكية لـ packages/domain/src/rules/studentRules.ts (PHASE 1 §A.1، §C.6).
 * القيم المتوقعة مشتقة من منطق الملف الفعلي (regex الهاتف، حدود الأطوال، isRealDate، جدول ALLOWED).
 */
const TODAY = "2026-10-28";
const ok = (input: StudentInput) => {
  const r = validateStudentInput(input, TODAY);
  if (!r.ok) throw new Error("expected ok, got " + JSON.stringify(r.errors));
  return r.value;
};
const errs = (input: StudentInput) => {
  const r = validateStudentInput(input, TODAY);
  if (r.ok) throw new Error("expected errors, got ok");
  return r.errors;
};

describe("normalizeDigits", () => {
  it("converts Arabic-Indic digits", () => expect(normalizeDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789"));
  it("converts Extended Arabic-Indic (Persian) digits", () => expect(normalizeDigits("۰۱۲۳۴۵۶۷۸۹")).toBe("0123456789"));
  it("handles mixed digits and leaves other characters untouched", () =>
    expect(normalizeDigits("+٢٠ 100-abc ١٢")).toBe("+20 100-abc 12"));
  it("returns empty string for empty input", () => expect(normalizeDigits("")).toBe(""));
});

describe("normalizePhone", () => {
  it("accepts an Egyptian mobile number", () => expect(normalizePhone("01012345678")).toBe("01012345678"));
  it("converts Arabic digits", () => expect(normalizePhone("٠١٠١٢٣٤٥٦٧٨")).toBe("01012345678"));
  it("keeps a leading + and strips spaces/dashes/parentheses/dots", () => {
    expect(normalizePhone("+20 100 123-4567")).toBe("+201001234567");
    expect(normalizePhone("(010) 1234.5678")).toBe("01012345678");
  });
  it("trims surrounding whitespace", () => expect(normalizePhone("  01012345678  ")).toBe("01012345678"));
  it("boundary: 7 digits accepted, 6 rejected", () => {
    expect(normalizePhone("1234567")).toBe("1234567");
    expect(normalizePhone("123456")).toBeNull();
  });
  it("boundary: 15 digits accepted, 16 rejected", () => {
    expect(normalizePhone("1".repeat(15))).toBe("1".repeat(15));
    expect(normalizePhone("1".repeat(16))).toBeNull();
  });
  it("rejects letters, empty, lone +, and + not at the start", () => {
    expect(normalizePhone("0101234abcd")).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("+")).toBeNull();
    expect(normalizePhone("010+1234567")).toBeNull();
    expect(normalizePhone("++201001234567")).toBeNull();
  });
});

describe("validateStudentInput — displayName", () => {
  it("required: empty and whitespace-only", () => {
    expect(errs({ displayName: "" }).displayName).toBe("required");
    expect(errs({ displayName: "   " }).displayName).toBe("required");
  });
  it("too_short: 1 char; boundary 2 chars OK", () => {
    expect(errs({ displayName: "ا" }).displayName).toBe("too_short");
    expect(ok({ displayName: "عم" }).displayName).toBe("عم");
  });
  it("too_long: 101 chars; boundary 100 OK", () => {
    expect(errs({ displayName: "ا".repeat(101) }).displayName).toBe("too_long");
    expect(ok({ displayName: "ا".repeat(100) }).displayName).toHaveLength(100);
  });
  it("trims and collapses inner whitespace", () =>
    expect(ok({ displayName: "  أحمد   محمد \t علي " }).displayName).toBe("أحمد محمد علي"));
});

describe("validateStudentInput — optional fields normalisation", () => {
  it("blank / whitespace / undefined / null optionals all become null", () => {
    const v = ok({
      displayName: "أحمد", phone: "  ", whatsapp: "", email: "   ", birthDate: "", studentCode: " ",
      schoolName: null, startedOn: undefined,
    });
    expect(v).toEqual({
      displayName: "أحمد", phone: null, whatsapp: null, email: null, birthDate: null,
      studentCode: null, schoolName: null, startedOn: null,
    });
  });
  it("normalises phone and whatsapp", () => {
    const v = ok({ displayName: "أحمد", phone: "٠١٠ ١٢٣٤ ٥٦٧٨", whatsapp: "+20 100 123 4567" });
    expect(v.phone).toBe("01012345678");
    expect(v.whatsapp).toBe("+201001234567");
  });
  it("invalid phone / whatsapp are reported separately", () => {
    const e = errs({ displayName: "أحمد", phone: "12", whatsapp: "abc" });
    expect(e.phone).toBe("invalid_phone");
    expect(e.whatsapp).toBe("invalid_phone");
  });
  it("trims code and school", () => {
    const v = ok({ displayName: "أحمد", studentCode: " S-001 ", schoolName: " مدرسة النور " });
    expect(v.studentCode).toBe("S-001");
    expect(v.schoolName).toBe("مدرسة النور");
  });
});

describe("validateStudentInput — email", () => {
  it("lower-cases a valid email", () => expect(ok({ displayName: "أحمد", email: "Ahmed@Example.COM" }).email).toBe("ahmed@example.com"));
  it("rejects missing @, missing domain dot, and inner spaces", () => {
    for (const email of ["ahmed.example.com", "ahmed@example", "a b@example.com", "@example.com"]) {
      expect(errs({ displayName: "أحمد", email }).email).toBe("invalid_email");
    }
  });
  it("length boundary: 254 accepted, 255 rejected", () => {
    const mk = (n: number) => "a".repeat(n - "@b.co".length) + "@b.co";
    expect(ok({ displayName: "أحمد", email: mk(254) }).email).toHaveLength(254);
    expect(errs({ displayName: "أحمد", email: mk(255) }).email).toBe("invalid_email");
  });
});

describe("validateStudentInput — dates", () => {
  it("accepts a real past birthDate and normalises Arabic digits", () => {
    expect(ok({ displayName: "أحمد", birthDate: "2010-05-17" }).birthDate).toBe("2010-05-17");
    expect(ok({ displayName: "أحمد", birthDate: "٢٠١٠-٠٥-١٧" }).birthDate).toBe("2010-05-17");
  });
  it("birthDate equal to today is allowed; tomorrow is future_date", () => {
    expect(ok({ displayName: "أحمد", birthDate: TODAY }).birthDate).toBe(TODAY);
    expect(errs({ displayName: "أحمد", birthDate: "2026-10-29" }).birthDate).toBe("future_date");
  });
  it("invalid formats and impossible dates", () => {
    for (const birthDate of ["abc", "2010/05/17", "2010-5-17", "2010-13-01", "2010-00-10", "2010-04-31", "2010-01-00"]) {
      expect(errs({ displayName: "أحمد", birthDate }).birthDate).toBe("invalid_date");
    }
  });
  it("leap-year rules: 2024 and 2000 have Feb 29; 2023 and 1900 do not", () => {
    expect(ok({ displayName: "أحمد", birthDate: "2024-02-29" }).birthDate).toBe("2024-02-29");
    expect(ok({ displayName: "أحمد", birthDate: "2000-02-29" }).birthDate).toBe("2000-02-29");
    expect(errs({ displayName: "أحمد", birthDate: "2023-02-29" }).birthDate).toBe("invalid_date");
    expect(errs({ displayName: "أحمد", birthDate: "1900-02-29" }).birthDate).toBe("invalid_date");
  });
  it("startedOn: validated as a real date but a future start date is allowed", () => {
    expect(ok({ displayName: "أحمد", startedOn: "2027-01-10" }).startedOn).toBe("2027-01-10");
    expect(errs({ displayName: "أحمد", startedOn: "2027-02-30" }).startedOn).toBe("invalid_date");
  });
});

describe("validateStudentInput — length limits and multiple errors", () => {
  it("studentCode: 30 OK, 31 too_long", () => {
    expect(ok({ displayName: "أحمد", studentCode: "c".repeat(30) }).studentCode).toHaveLength(30);
    expect(errs({ displayName: "أحمد", studentCode: "c".repeat(31) }).studentCode).toBe("too_long");
  });
  it("schoolName: 100 OK, 101 too_long", () => {
    expect(ok({ displayName: "أحمد", schoolName: "م".repeat(100) }).schoolName).toHaveLength(100);
    expect(errs({ displayName: "أحمد", schoolName: "م".repeat(101) }).schoolName).toBe("too_long");
  });
  it("reports all errors together and returns no value", () => {
    const r = validateStudentInput(
      { displayName: "", phone: "x", email: "bad", birthDate: "2999-01-01", startedOn: "nope", studentCode: "c".repeat(31) },
      TODAY,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors).toEqual({
        displayName: "required", phone: "invalid_phone", email: "invalid_email",
        birthDate: "future_date", startedOn: "invalid_date", studentCode: "too_long",
      });
    }
  });
  it("is pure: same input and same 'today' give identical results", () => {
    const input: StudentInput = { displayName: "أحمد", phone: "01012345678" };
    expect(validateStudentInput(input, TODAY)).toEqual(validateStudentInput(input, TODAY));
  });
});

describe("canTransitionStudent (PHASE 1 §C.6: active ⇄ paused → graduated → archived)", () => {
  it("no self-transitions", () => {
    for (const s of STUDENT_STATUSES) expect(canTransitionStudent(s, s)).toBe(false);
  });
  it("explicit in §C.6: active ⇄ paused, paused → graduated, graduated → archived", () => {
    expect(canTransitionStudent("active", "paused")).toBe(true);
    expect(canTransitionStudent("paused", "active")).toBe(true);
    expect(canTransitionStudent("paused", "graduated")).toBe(true);
    expect(canTransitionStudent("graduated", "archived")).toBe(true);
  });
  it("graduated cannot go back to paused", () => expect(canTransitionStudent("graduated", "paused")).toBe(false));
  it("archived can only be restored to active", () => {
    expect(canTransitionStudent("archived", "active")).toBe(true);
    for (const to of ["paused", "graduated"] as StudentStatus[]) expect(canTransitionStudent("archived", to)).toBe(false);
  });
  it("archiving is allowed from every non-archived state (documented in the source)", () => {
    for (const from of ["active", "paused", "graduated"] as StudentStatus[]) expect(canTransitionStudent(from, "archived")).toBe(true);
  });
  // Finding F-9: التنفيذ الحالي أوسع من نص §C.6 في active→graduated وgraduated→active وarchived→active.
  // نثبّت السلوك الحالي كما هو دون تعديل قواعد المجال، ونترك قرار تضييقه/توسيعه لمالك المنتج.
  it("current implementation also allows active→graduated, graduated→active (F-9, beyond §C.6 text)", () => {
    expect(canTransitionStudent("active", "graduated")).toBe(true);
    expect(canTransitionStudent("graduated", "active")).toBe(true);
  });
});
