import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // "server-only" lança erro fora de Server Components; nos testes é um módulo vazio.
      "server-only": fileURLToPath(new URL("./src/testes/server-only-vazio.ts", import.meta.url)),
    },
  },
  test: {
    // Nenhum teste usa DOM; "node" evita subir o jsdom por arquivo (lento e sujeito a timeout no CI).
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
