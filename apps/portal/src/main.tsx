import { render } from "preact";

// هيكل فقط: قراءة فقط من pv_* لاحقًا عبر عقد ضيق (§L). لا منطق Domain هنا (INV-28).
render(<main style={{ padding: 24 }}><h1>الجهاد — بوابة أولياء الأمور</h1><p>هيكل فقط.</p></main>, document.getElementById("app")!);
