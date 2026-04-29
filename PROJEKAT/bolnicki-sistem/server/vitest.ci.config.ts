import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./src/__integration_tests__/setup/setupFiles.ts"],
    include: ["./src/__integration_tests__/**/*.test.ts"],
    pool: 'forks',
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});