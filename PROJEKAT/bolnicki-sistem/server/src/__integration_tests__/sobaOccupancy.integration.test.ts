import { describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import app from "../app.js";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

const tokenZaUlogu = (uloga: string) => jwt.sign(
  { id: 50, uloga },
  JWT_SECRET,
  { expiresIn: "1h" },
);

const danasKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const danasDatum = () => new Date(`${danasKey()}T00:00:00.000Z`);

const trenutnaMinuta = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

async function kreirajZauzetTerminUTekućemVremenu() {
  const sadaMinute = trenutnaMinuta();
  const vrijemePocetka = Math.max(0, sadaMinute - 5);

  await prisma.termin.create({
    data: {
      id: 100,
      idDoktor: 1,
      datum: danasDatum(),
      vrijeme: vrijemePocetka,
      opis: "Integracioni test - zauzet kabinet",
      status: "ZAKAZAN",
    },
  });

  await prisma.rezervacije.create({
    data: {
      id: 100,
      idTermina: 100,
      idPacijent: 1,
      idDoktor: 1,
      idTipPregleda: 1,
      hitnost: false,
      doktorRezervisao: true,
    },
  });
}

async function kreirajSlobodanTerminDanas() {
  await prisma.termin.create({
    data: {
      id: 101,
      idDoktor: 1,
      datum: danasDatum(),
      vrijeme: trenutnaMinuta() + 60,
      opis: "Integracioni test - slobodan termin",
      status: "SLOBODAN",
    },
  });
}

describe("GET /api/rooms/occupancy — US-39 zauzetost kabineta", () => {
  it("odbija zahtjev bez JWT tokena", async () => {
    const res = await request(app).get("/api/rooms/occupancy?date=today");

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("poruka");
  });

  it("odbija pacijenta jer samo medicinsko osoblje smije vidjeti zauzetost", async () => {
    const res = await request(app)
      .get("/api/rooms/occupancy?date=today")
      .set("Authorization", `Bearer ${tokenZaUlogu("PACIJENT")}`);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("poruka", "Nemate dozvolu za pristup ovom resursu.");
  });

  it("odbija doktora jer US-39 pripada panelu medicinskog osoblja", async () => {
    const res = await request(app)
      .get("/api/rooms/occupancy?date=today")
      .set("Authorization", `Bearer ${tokenZaUlogu("DOKTOR")}`);

    expect(res.status).toBe(403);
  });

  it("medicinskom osoblju vraća listu kabineta za tekući dan", async () => {
    await kreirajSlobodanTerminDanas();

    const res = await request(app)
      .get("/api/rooms/occupancy?date=today")
      .set("Authorization", `Bearer ${tokenZaUlogu("MEDICINSKO_OSOBLJE")}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      date: danasKey(),
      refreshIntervalSeconds: 60,
    });
    expect(Array.isArray(res.body.rooms)).toBe(true);

    const soba = res.body.rooms.find((room: any) => room.id === 1);
    expect(soba).toMatchObject({
      id: 1,
      naziv: "Ordinacija 1",
      status: "SLOBODAN",
      canAssignEmergency: true,
    });
    expect(soba.activeDoctor).toMatchObject({
      id: 1,
      ime: "Mirza",
      prezime: "Hodžić",
    });
    expect(soba.availableTerms[0]).toMatchObject({
      id: 101,
      doktorId: 1,
    });
  });

  it("označava kabinet crveno kada je termin trenutno u toku", async () => {
    await kreirajZauzetTerminUTekućemVremenu();

    const res = await request(app)
      .get("/api/rooms/occupancy?date=today")
      .set("Authorization", `Bearer ${tokenZaUlogu("MEDICINSKO_OSOBLJE")}`);

    expect(res.status).toBe(200);

    const soba = res.body.rooms.find((room: any) => room.id === 1);
    expect(soba).toMatchObject({
      status: "ZAUZET",
      canAssignEmergency: false,
    });
    expect(soba.currentAppointment).toMatchObject({
      id: 100,
      terminId: 100,
      doktor: {
        id: 1,
        ime: "Mirza",
        prezime: "Hodžić",
      },
      pacijent: {
        ime: "Amra",
        prezime: "Testić",
      },
    });
  });

  it("vraća 400 za neispravan format datuma", async () => {
    const res = await request(app)
      .get("/api/rooms/occupancy?date=23-05-2026")
      .set("Authorization", `Bearer ${tokenZaUlogu("MEDICINSKO_OSOBLJE")}`);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("poruka", "Neispravan format datuma. Koristite YYYY-MM-DD ili today.");
  });
});
