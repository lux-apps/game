import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const out = resolve(import.meta.dirname, "../contracts/out");

// `<File>.sol?artifact` imports what forge compiled from that source,
// contracts/out/<File>.sol/<File>.json, as { abi, bytecode };
// `?artifact=<Contract>` picks a contract not named after its file.
const artifact = {
  name: "artifact",
  enforce: "pre",
  load(id) {
    const [path, query = ""] = id.split("?");
    const params = new URLSearchParams(query);
    if (!path.endsWith(".sol") || !params.has("artifact")) return null;
    const file = basename(path);
    const json = `${out}/${file}/${params.get("artifact") || file.slice(0, -4)}.json`;
    if (!existsSync(json)) throw new Error(`${json} is missing: run forge build in contracts/`);
    this.addWatchFile(json);
    const { abi, bytecode } = JSON.parse(readFileSync(json, "utf8"));
    return `export const abi = ${JSON.stringify(abi)};\nexport const bytecode = ${JSON.stringify(bytecode.object)};\n`;
  },
};

export default defineConfig({
  plugins: [artifact, react()],
  // One .env at the repository root serves the client and the forge scripts.
  envDir: "..",
  build: { outDir: "build" },
});
