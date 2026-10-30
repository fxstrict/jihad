// يبني النواة كحزمة ESM عادية تستهلكها Vite في apps/web (ADR-024).
import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts"],
  outdir: "dist/esm",
  bundle: true,
  format: "esm",
  target: "es2020",
  sourcemap: true,
});
console.log("domain: ESM build done -> dist/esm");
