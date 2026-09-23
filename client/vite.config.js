import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // One .env at the repository root serves the client and the forge scripts.
  envDir: "..",
  build: { outDir: "build" },
});
