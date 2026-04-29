import { execSync } from "child_process";

export async function setup() {
  console.log("\n🐳 Pokrećem test infrastrukturu...");

  // Pokreni Postgres i Redis kontejnere
  execSync(
    "docker compose -f docker-compose.test.yml up -d --wait",
    {
      // Putanja do korijena projekta gdje je docker-compose.test.yml
      cwd: process.cwd().includes("SERVER")
        ? process.cwd().replace(/SERVER.*/, "").replace(/\/$/, "")
        : process.cwd(),
      stdio: "inherit",
    }
  );

  console.log("✅ Docker kontejneri su spremni.");

  // Pokreni Prisma migracije na test bazi
  console.log("📦 Pokrećem Prisma migracije...");
  execSync("npx prisma migrate deploy", {
    env: {
      ...process.env,
      DATABASE_URL: "postgresql://testuser:testpass@localhost:5433/bolnica_test",
    },
    stdio: "inherit",
  });
  console.log("✅ Migracije završene.");

  // Pokreni seed
  console.log("🌱 Pokrećem seed...");
  execSync("npx prisma db seed", {
    env: {
      ...process.env,
      DATABASE_URL: "postgresql://testuser:testpass@localhost:5433/bolnica_test",
    },
    stdio: "inherit",
  });
  console.log("✅ Seed završen.\n");
}

export async function teardown() {
  console.log("\n🧹 Gasim test kontejnere...");
  execSync("docker compose -f docker-compose.test.yml down", {
    cwd: process.cwd().includes("SERVER")
      ? process.cwd().replace(/SERVER.*/, "").replace(/\/$/, "")
      : process.cwd(),
    stdio: "inherit",
  });
  console.log("✅ Kontejneri ugašeni.\n");
}