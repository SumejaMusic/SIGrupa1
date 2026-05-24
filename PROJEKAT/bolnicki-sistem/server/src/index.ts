process.on("uncaughtException", (err: any) => {
  console.error("GREŠKA:", err?.message || err);
  console.error("STACK:", err?.stack);
});


import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
//import { PrismaClient } from '@prisma/client';

import app, { httpServer } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { pokreniReminderJob } from "./jobs/reminderJob.js";


async function applyStartupMigrations() {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "RasporedOsoblja" (
      "id" SERIAL NOT NULL,
      "idOsoblje" INTEGER NOT NULL,
      "danUSedmici" "DanUSedmici" NOT NULL,
      "vrijemeOd" TIME(6) NOT NULL,
      "vrijemeDo" TIME(6) NOT NULL,
      "aktivan" BOOLEAN NOT NULL DEFAULT true,
      CONSTRAINT "RasporedOsoblja_pkey" PRIMARY KEY ("id")
    )
  `;
  await prisma.$executeRaw`
    CREATE UNIQUE INDEX IF NOT EXISTS "RasporedOsoblja_idOsoblje_danUSedmici_key"
    ON "RasporedOsoblja"("idOsoblje", "danUSedmici")
  `;
  await prisma.$executeRaw`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'RasporedOsoblja_idOsoblje_fkey'
      ) THEN
        ALTER TABLE "RasporedOsoblja"
          ADD CONSTRAINT "RasporedOsoblja_idOsoblje_fkey"
          FOREIGN KEY ("idOsoblje") REFERENCES "MediciskoOsoblje"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE;
      END IF;
    END $$
  `;
}
applyStartupMigrations().catch(e => console.error("Startup migration error:", e));
/*
dotenv.config();

const app = express();
//const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

//Ova linija registruje sve tvoje na server
// i dodaje /api prefiks svima. 
// Bez nje server ne zna da rute uopće postoje.
app.use("/api", routes); 

app.get('/', (req, res) => {
  res.send('Bolnički sistem API radi!');
process.on("unhandledRejection", (reason: any) => {
  console.error("UNHANDLED REJECTION:", reason);
});

const PORT = Number(process.env.PORT) || 5000;

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`http://localhost:${PORT}`);
  pokreniReminderJob();
});