/**
 * بوابة CHECK_INSTALLATION (PHASE 1 §H.2 / ADR-R01 / INV-58) — دالة نقية.
 * تحل CF-01: «Installation موجود + Bootstrap ناقص» حالة صريحة لا تُفسَّر أبدًا كمنظمة سليمة.
 */
export type BootstrapState =
  | "INSTALLATION_CREATED"
  | "ORG_BOUND"
  | "LICENSE_ACTIVATED"
  | "ORG_BOOTSTRAPPING"
  | "READY";

export interface InstallationRecord {
  installationId: string;
  bootstrapState: BootstrapState;
}

export type BootGate =
  | { branch: "FIRST_INSTALL" }
  | { branch: "FIRST_BOOTSTRAP_RESUME"; resumeFrom: Exclude<BootstrapState, "READY"> }
  | { branch: "STANDARD_DECISION" };

export function checkInstallation(installation: InstallationRecord | undefined): BootGate {
  if (!installation) return { branch: "FIRST_INSTALL" };
  if (installation.bootstrapState !== "READY") {
    return { branch: "FIRST_BOOTSTRAP_RESUME", resumeFrom: installation.bootstrapState };
  }
  return { branch: "STANDARD_DECISION" };
}

/**
 * B4 (§H.3): استئناف بعد اكتمال التنزيل فعليًا لكن قبل كتابة READY لا يحتاج إنترنت.
 * يعيد true فقط إذا كان الاستئناف من ORG_BOOTSTRAPPING وعلم coreTypesComplete صحيحًا.
 */
export function canFinishResumeOffline(state: BootstrapState, coreTypesComplete: boolean): boolean {
  return state === "ORG_BOOTSTRAPPING" && coreTypesComplete;
}
