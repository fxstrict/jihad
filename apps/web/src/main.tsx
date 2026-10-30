import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { checkInstallation, deriveLessonId, type BootGate } from "@al-jihad/domain";
import { readInstallation } from "./data/local-db/meta";
import "./styles.css";

/** هيكل فقط: يثبت أن الخط يعمل (Domain المشترك ← PWA ← IndexedDB) — لا شاشات أعمال بعد. */
function App() {
  const [gate, setGate] = useState<BootGate | null>(null);

  useEffect(() => {
    // UI_READY لا ينتظر الشبكة (INV-11): قراءة محلية فقط
    readInstallation().then((inst) => setGate(checkInstallation(inst)));
  }, []);

  return (
    <main class="min-h-screen p-6 font-sans">
      <h1 class="text-3xl font-bold">الجهاد</h1>
      <p class="mt-2 text-slate-600">هيكل قابل للبناء — لا منطق أعمال بعد.</p>
      <section class="mt-6 rounded-xl border p-4">
        <h2 class="font-semibold">بوابة الإقلاع (CHECK_INSTALLATION)</h2>
        <pre dir="ltr" class="mt-2 text-sm">{gate ? JSON.stringify(gate) : "…"}</pre>
      </section>
      <section class="mt-4 rounded-xl border p-4">
        <h2 class="font-semibold">هوية حتمية من النواة المشتركة (§F.2)</h2>
        <pre dir="ltr" class="mt-2 text-sm">{deriveLessonId("demo-rule", "2026-09-27")}</pre>
      </section>
    </main>
  );
}

render(<App />, document.getElementById("app")!);
