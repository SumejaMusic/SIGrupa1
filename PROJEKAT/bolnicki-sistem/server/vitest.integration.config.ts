import { defineConfig } from "vitest/config";

// Definišemo čistu konfiguraciju
const config = {
  test: {
    globalSetup: "./src/__integration_tests__/setup/globalSetup.ts",
    setupFiles: ["./src/__integration_tests__/setup/setupFiles.ts"],
    include: ["./src/__integration_tests__/**/*.test.ts"],

    // ── OVO GASI PARALELIZAM U VITEST 4 ─────────────────────────────
    pool: "forks",
    forks: {
      singleFork: true, // Izvršava fajl po fajl u jednom procesu
    },
    fileParallelism: false,
    // ────────────────────────────────────────────────────────────────

    sequence: {
      concurrent: false, // Strogo zabranjuje paralelno izvršavanje testova
    },

    testTimeout: 30000,
    hookTimeout: 60000,
  },
};

// Prosleđujemo je kroz 'as any' da TypeScript ne bi prigovarao
export default defineConfig(config as any);