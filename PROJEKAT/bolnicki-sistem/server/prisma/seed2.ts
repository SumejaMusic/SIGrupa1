import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("⏳ Kreiranje administratorskog naloga...\n");

  const hashJmbg = (jmbg: string) =>
    crypto.createHash("sha256").update(jmbg).digest("hex");

  const sifra = await bcrypt.hash("si@grupa1", 10);

  const admin = await prisma.korisnik.upsert({
    where: { email: "admin@klinika.ba" },
    update: {},
    create: {
      jmbg: "0000000000000",
      jmbgHash: hashJmbg("0000000000000"),
      ime: "Admin",
      prezime: "Sistem",
      datumRodjenja: new Date("1990-01-01"),
      email: "admin@klinika.ba",
      pristupnaSifra: sifra,
      emailVerifikovan: true,
      uloga: "ADMINISTRATOR",
    },
  });

  console.log("✅ Administrator kreiran!");
  console.log(`   Email: ${admin.email}`);
  console.log(`   Šifra: si@grupa1\n`);
}

main()
  .catch((e) => {
    console.error("❌ Greška:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });