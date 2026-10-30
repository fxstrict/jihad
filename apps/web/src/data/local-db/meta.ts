import type { InstallationRecord } from "@al-jihad/domain";

/**
 * قاعدة jihad_meta (PHASE 1 §D.1): اسم ثابت معروف قبل معرفة أي منظمة.
 * تحوي Installation (بما فيه bootstrapState — INV-58) والترخيص. هذه هي الطبقة الوحيدة التي تعرف IndexedDB (INV-01).
 * هيكل فقط الآن: متجر installation ومتجر kv؛ بقية المخازن تأتي مع ترحيلاتها المرقّمة (§P.2).
 */
const DB_NAME = "jihad_meta";
const META_DB_VERSION = 1; // إصدار مستقل عن قاعدة المنظمة (ORG_DB_VERSION)

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, META_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("installation")) db.createObjectStore("installation", { keyPath: "installationId" });
      if (!db.objectStoreNames.contains("_kv")) db.createObjectStore("_kv", { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function readInstallation(): Promise<InstallationRecord | undefined> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = db.transaction("installation", "readonly").objectStore("installation").getAll();
    req.onsuccess = () => resolve((req.result as InstallationRecord[])[0]);
    req.onerror = () => reject(req.error);
  });
}
