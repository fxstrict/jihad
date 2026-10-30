import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { VitePWA } from "vite-plugin-pwa";

// بوابة ولي الأمر: بناء وService Worker مستقلان، لا استيراد من apps/web ولا packages/domain (INV-28)
export default defineConfig({
  plugins: [
    preact(),
    VitePWA({ registerType: "autoUpdate", manifest: { name: "الجهاد — أولياء الأمور", short_name: "الجهاد", lang: "ar", dir: "rtl", display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0f766e",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      includeAssets: ["icons/apple-touch-icon.png"],
    }),
  ],
});
