import { describe, it, expect } from "vitest";
import {
  deriveId, deriveLessonId, canonicalEquals, requestFingerprint, checkIdempotency,
  classifyPatchField, checkInstallation, canFinishResumeOffline,
} from "../../packages/domain/src/index";
import { uuidV5 } from "../../packages/domain/src/rules/deriveId";
import { sha1 } from "../../packages/domain/src/rules/sha1";
import { utf8Encode } from "../../packages/domain/src/rules/utf8";

const hex = (u: Uint8Array) => Array.from(u, (x) => x.toString(16).padStart(2, "0")).join("");

describe("primitives (test vectors)", () => {
  it("sha1 vectors", () => {
    expect(hex(sha1(utf8Encode("abc")))).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
    expect(hex(sha1(utf8Encode("")))).toBe("da39a3ee5e6b4b0d3255bfef95601890afd80709");
  });
  it("UUIDv5 RFC 4122 vector", () => {
    expect(uuidV5("python.org", "6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toBe("886313e1-3b8a-5372-9b90-0c9aee199e5d");
  });
});

describe("deterministic IDs (PHASE 1 §F.2)", () => {
  it("is deterministic and sensitive to occurrenceKey", () => {
    const a = deriveLessonId("AAAA-1111", "2026-09-27");
    expect(a).toBe(deriveLessonId("aaaa-1111", "2026-09-27"));
    expect(a).not.toBe(deriveLessonId("aaaa-1111", "2026-09-28"));
    expect(deriveId("lesson", ["x"])).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe("canonicalEquals (§G.12.2)", () => {
  it("key order, null==absent, NFC", () => {
    expect(canonicalEquals({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(canonicalEquals({ a: 1, b: null }, { a: 1 })).toBe(true);
    expect(canonicalEquals({ n: "e\u0301" }, { n: "\u00e9" })).toBe(true);
    expect(canonicalEquals({ a: 1 }, { a: 2 })).toBe(false);
  });
});

describe("idempotency (C-01 / INV-61)", () => {
  const op = (body: any, id = "S-1") => ({ entityType: "student", entityId: id, opType: "patch" as const, body });
  const P1 = { changes: [{ field: "phone", from: "010-1111", to: "010-2222" }] };
  const P2 = { changes: [{ field: "phone", from: "010-1111", to: "010-9999" }] };
  const stored = { requestFingerprint: requestFingerprint(op(P1)) };

  it("C-01-A same key + same request => ALREADY_APPLIED", () => expect(checkIdempotency(stored, op(P1))).toBe("ALREADY_APPLIED"));
  it("C-01-B same key + different payload => IDEMPOTENCY_KEY_REUSE", () => expect(checkIdempotency(stored, op(P2))).toBe("IDEMPOTENCY_KEY_REUSE"));
  it("same key + different entity => IDEMPOTENCY_KEY_REUSE", () => expect(checkIdempotency(stored, op(P1, "S-2"))).toBe("IDEMPOTENCY_KEY_REUSE"));
  it("absent => NEW_OPERATION", () => expect(checkIdempotency(undefined, op(P1))).toBe("NEW_OPERATION"));
  it("C-01-C / IDP-01 different ops, same final value => NOOP_CONVERGED", () =>
    expect(classifyPatchField("010-2222", "010-1111", "010-2222")).toBe("NOOP_CONVERGED"));
  it("APPLIED / CONFLICT", () => {
    expect(classifyPatchField("010-1111", "010-1111", "010-2222")).toBe("APPLIED");
    expect(classifyPatchField("010-5555", "010-1111", "010-2222")).toBe("CONFLICT");
  });
});

describe("bootstrap gate (CF-01 / INV-58)", () => {
  it("BOOT-01..05", () => {
    expect(checkInstallation(undefined)).toEqual({ branch: "FIRST_INSTALL" });
    for (const s of ["INSTALLATION_CREATED", "ORG_BOUND", "LICENSE_ACTIVATED", "ORG_BOOTSTRAPPING"] as const)
      expect(checkInstallation({ installationId: "i", bootstrapState: s })).toEqual({ branch: "FIRST_BOOTSTRAP_RESUME", resumeFrom: s });
    expect(checkInstallation({ installationId: "i", bootstrapState: "READY" })).toEqual({ branch: "STANDARD_DECISION" });
    expect(canFinishResumeOffline("ORG_BOOTSTRAPPING", true)).toBe(true);
    expect(canFinishResumeOffline("ORG_BOOTSTRAPPING", false)).toBe(false);
  });
});
