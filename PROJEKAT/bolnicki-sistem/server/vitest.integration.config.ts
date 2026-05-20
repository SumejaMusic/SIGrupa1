import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Putanje do tvojih setup fajlova
    globalSetup: "./src/__integration_tests__/setup/globalSetup.ts",
    setupFiles: ["./src/__integration_tests__/setup/setupFiles.ts"],
    include: ["src/__integration_tests__/**/*.ts"],

    // RJEŠENJE ZA GREŠKU:
    // Umjesto 'threads', koristi 'pool' za izolaciju procesa
    pool: 'forks', 
    
    // Onemogućava pokretanje više test fajlova odjednom
    fileParallelism: false, 

    sequence: {
      // Osigurava da se testovi unutar jednog fajla izvršavaju redom
      concurrent: false, 
    },

    testTimeout: 30000,
    hookTimeout: 60000,
  },
});