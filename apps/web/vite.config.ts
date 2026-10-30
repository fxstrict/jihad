import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "node:url";

/**
 * مسار الأساس لنشر GitHub Pages (PHASE 2.1، §C من تقرير النشر):
 * - محلي / `apps.<org>.io` (نشر على جذر النطاق): يبقى "/" افتراضيًا.
 * - GitHub Pages لموقع مشروع (`https://<user>.github.io/<repo>/`): تُمرِّر أداة CI
 *   `VITE_BASE_PATH=/<repo>/` كمتغيّر بيئة وقت البناء فقط — لا اسم مستودع مكتوب هنا.
 * لا علاقة لهذا بمسارات التطبيق نفسه (لا Router بعد، §9 من نفس التقرير).
 */
const base = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  base,
  resolve: {
    alias: {
      // النواة المشتركة تُستهلَك من المصدر مباشرة (لا حاجة لبنائها أثناء التطوير)
      "@al-jihad/domain": fileURLToPath(new URL("../../packages/domain/src/index.ts", import.meta.url)),
    },
  },
  plugins: [
    preact(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/apple-touch-icon.png"],
      // Service Worker: caching فقط (INV-04) — لا منطق أعمال
      workbox: { globPatterns: ["**/*.{js,css,html,svg,png,webmanifest}"] },
      manifest: {
        name: "الجهاد",
        short_name: "الجهاد",
        lang: "ar",
        dir: "rtl",
        display: "standalone",
        // start_url/scope مشتقان من نفس base — لا "/" ثابتة تكسر مواقع المشاريع على GitHub Pages
        start_url: base,
        scope: base,
        background_color: "#ffffff",
        theme_color: "#0f766e",
        icons: [
          // مسارات نسبية (بلا "/" في البداية) فتُحَلّ نسبةً إلى base — تعمل تحت /<repo>/ على GitHub Pages
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
