import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  target: "node22",
  platform: "node",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  // shared is TypeScript source inside the monorepo, so bundle it into the build output
  noExternal: ["@agri/shared"],
});
