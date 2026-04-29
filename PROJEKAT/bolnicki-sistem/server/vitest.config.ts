import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/__integration_tests__/**'
    ]
  }
});