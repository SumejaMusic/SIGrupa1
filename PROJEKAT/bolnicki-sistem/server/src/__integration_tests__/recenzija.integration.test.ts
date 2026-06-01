import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import jwt, { type SignOptions } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import app from "../app.js";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";
const DOKTOR_ID = 1;
const PACIJENT_ID = 1;
const PACIJENT_KORISNIK_ID = 2;
const TIP_PREGLEDA_ID = 1;
const SOBA_ID = 1;

let PACIJENT_TOKEN: string;
let DOKTOR_TOKEN: string;

beforeAll(() => {
  PACIJENT_TOKEN = jwt.sign(
    { id: PACIJENT_KORISNIK_ID, uloga: "PACIJENT" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  DOKTOR_TOKEN = jwt.sign(
    { id: 1, uloga: "DOKTOR", doktorId: DOKTOR_ID },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
});

afterEach(async () => {
  terminCounter = 100;
  
  // Čišćenje recenzija i rezervacija (Usklađeno sa nazivima iz kontrolera)
  await prisma.recenzija.deleteMany({
    where: {
      rezervacija: {
        idTermina: { gt: 2 },
      },
    },
  });
  
  await prisma.recenzija.deleteMany({
    where: {
      rezervacija: {
        idTermina: { in: [1, 2] },
      },
    },
  });

  await prisma.rezervacija.deleteMany({
    where: { idTermina: { gt: 2 } },
  });

  await prisma.termin.deleteMany({
    where: { id: { gt: 2 } },
  });

  // Resetovanje seed termina na SLOBODAN
  await prisma.rezervacija.deleteMany({ where: { idTermina: { in: [1, 2] } } });
  await prisma.termin.updateMany({
    where: { id: { in: [1, 2] } },
    data: { status: "SLOBODAN" },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

function kreirajReviewToken(rezervacijaId: number, expiresIn: SignOptions["expiresIn"] = "30d") {
  return jwt.sign(
    { appointmentId: rezervacijaId, purpose: "appointment-review" },
    JWT_SECRET,
    { expiresIn }
  );
}

function kreirajPogresanToken(rezervacijaId: number) {
  return jwt.sign(
    { appointmentId: rezervacijaId, purpose: "wrong-purpose" },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

async function kreirajTermin(id: number, vrijeme = 600) {
  return prisma.termin.create({
    data: {
      id,
      idDoktor: DOKTOR_ID,
      datum: new Date("2030-06-01"),
      vrijeme,
      opis: `Termin ${id}`,
      status: "ZAKAZAN",
    },
  });
}

let terminCounter = 100;

async function kreirajRezervaciju(options: {
  idTermina?: number;
  vrijeme?: number;
  zavrseno?: boolean;
  otkazano?: boolean;
} = {}) {
  const idTermina = options.idTermina ?? terminCounter++;

  if (idTermina > 2) {
    await kreirajTermin(idTermina, options.vrijeme ?? 600);
  } else {
    await prisma.termin.update({
      where: { id: idTermina },
      data: { status: "ZAKAZAN" },
    });
  }

  return prisma.rezervacija.create({
    data: {
      idTermina,
      idPacijent: PACIJENT_ID,
      idDoktor: DOKTOR_ID,
      idSobe: SOBA_ID,
      idTipPregleda: TIP_PREGLEDA_ID,
      zavrseno: options.zavrseno ?? true,
      datumOtkazivanja: options.otkazano ? new Date("2030-06-01T08:00:00.000Z") : null,
      komentar: "Integracioni test recenzije",
    },
  });
}

describe("anonimne recenzije - integracioni tok", () => {
  it("javni token vraća podatke za formu bez otkrivanja pacijenta", async () => {
    const rezervacija = await kreirajRezervaciju();
    const token = kreirajReviewToken(rezervacija.id);

    const res = await request(app).get(`/api/appointments/review/${token}`);

    expect(res.status).toBe(200);
    expect(res.body.appointment).toMatchObject({
      id: rezervacija.id,
      doctorName: "Dr. Mirza Hodžić",
      completed: true,
      canceled: false,
      canReview: true,
      review: null,
    });
    expect(JSON.stringify(res.body)).not.toMatch(/swiftmed110|Amra|Testić|idPacijent|idKorisnik/i);
  });

  it("ne prihvata token sa pogrešnom svrhom", async () => {
    const rezervacija = await kreirajRezervaciju();
    const token = kreirajPogresanToken(rezervacija.id);

    const res = await request(app).get(`/api/appointments/review/${token}`);

    expect(res.status).toBe(401);
    expect(res.body.poruka).toBe("Link za ocjenu nije validan.");
  });

  it("ne prihvata istekao token", async () => {
    const rezervacija = await kreirajRezervaciju();
    const token = kreirajReviewToken(rezervacija.id, "-1s");

    const res = await request(app).post(`/api/appointments/review/${token}`).send({
      rating: 5,
      comment: "Odlican pregled.",
    });

    expect(res.status).toBe(401);
    expect(res.body.poruka).toBe("Link za ocjenu nije validan ili je istekao.");
  });

  it("sprema anonimnu ocjenu u reviews tabelu preko javnog email linka", async () => {
    const rezervacija = await kreirajRezervaciju();
    const token = kreirajReviewToken(rezervacija.id);

    const res = await request(app).post(`/api/appointments/review/${token}`).send({
      rating: 5,
      comment: "Iskreno dopao mi se doktor i dosao bih opet",
    });

    expect(res.status).toBe(201);
    expect(res.body.review).toMatchObject({
      rating: 5,
      comment: "Iskreno dopao mi se doktor i dosao bih opet",
    });

    const review = await prisma.recenzija.findUnique({
      where: { idRezervacije: rezervacija.id },
    });

    expect(review).toMatchObject({
      idRezervacije: rezervacija.id,
      ocjena: 5,
      komentar: "Iskreno dopao mi se doktor i dosao bih opet",
      sakriven: false,
    });
  });

  it("ne sprema podatke pacijenta u zapis recenzije", async () => {
    const rezervacija = await kreirajRezervaciju();
    const token = kreirajReviewToken(rezervacija.id);

    await request(app).post(`/api/appointments/review/${token}`).send({
      rating: 4,
      comment: "Vrlo profesionalno.",
    });

    const review = await prisma.recenzija.findUniqueOrThrow({
      where: { idRezervacije: rezervacija.id },
    });

    expect(Object.keys(review)).not.toContain("idPacijent");
    expect(Object.keys(review)).not.toContain("idKorisnik");
    expect(JSON.stringify(review)).not.toMatch(/swiftmed110|Amra|Testić/i);
  });

  it("nakon javne ocjene vlasnik/vodič vidi recenziju kroz novu getRecenzije rutu", async () => {
    const prva = await kreirajRezervaciju({ idTermina: 1, vrijeme: 600 });

    // Kreiramo recenziju putem javne rute
    await request(app).post(`/api/appointments/review/${kreirajReviewToken(prva.id)}`).send({
      rating: 4,
      comment: "Iskreno dopao mi se doktor i dosao bih opet",
    });

    // Pozivamo getRecenzije rutu iz vlasnikController-a
    const res = await request(app)
      .get("/api/vlasnik/recenzije")
      .query({ samo_sa_komentarom: "true" })
      .set("Authorization", `Bearer ${DOKTOR_TOKEN}`); // ili token vlasnika/admina zavisi od middleware-a

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("recenzije");
    expect(res.body).toHaveProperty("paginacija");
    expect(res.body.recenzije[0]).mock({
      ocjena: 4,
      komentar: "Iskreno dopao mi se doktor i dosao bih opet",
      sakriven: false,
    });
  });

  it("ne dozvoljava duplu ocjenu istog termina", async () => {
    const rezervacija = await kreirajRezervaciju();
    const token = kreirajReviewToken(rezervacija.id);

    await request(app).post(`/api/appointments/review/${token}`).send({ rating: 5 });
    const drugiPokusaj = await request(app).post(`/api/appointments/review/${token}`).send({ rating: 3 });

    const brojRecenzija = await prisma.recenzija.count({
      where: { idRezervacije: rezervacija.id },
    });

    expect(drugiPokusaj.status).toBe(409);
    expect(drugiPokusaj.body.poruka).toBe("Ovaj termin je već ocijenjen.");
    expect(brojRecenzija).toBe(1);
  });

  it("odbija ocjenu izvan raspona 1-5 i ne upisuje u bazu", async () => {
    const rezervacija = await kreirajRezervaciju();
    const token = kreirajReviewToken(rezervacija.id);

    const res = await request(app).post(`/api/appointments/review/${token}`).send({
      rating: 6,
      comment: "Neispravna ocjena.",
    });

    const brojRecenzija = await prisma.recenzija.count({
      where: { idRezervacije: rezervacija.id },
    });

    expect(res.status).toBe(400);
    expect(brojRecenzija).toBe(0);
  });

  it("odbija komentar duži od 500 znakova", async () => {
    const rezervacija = await kreirajRezervaciju();
    const token = kreirajReviewToken(rezervacija.id);

    const res = await request(app).post(`/api/appointments/review/${token}`).send({
      rating: 4,
      comment: "a".repeat(501),
    });

    expect(res.status).toBe(400);
    expect(res.body.poruka).toBe("Komentar ne smije imati više od 500 znakova.");
  });

  it("ne dozvoljava ocjenu pregleda koji nije završen", async () => {
    const rezervacija = await kreirajRezervaciju({ zavrseno: false });
    const token = kreirajReviewToken(rezervacija.id);

    const res = await request(app).post(`/api/appointments/review/${token}`).send({
      rating: 4,
    });

    expect(res.status).toBe(400);
    expect(res.body.poruka).toBe("Ocjenu možete ostaviti tek nakon završenog pregleda.");
  });

  it("ne dozvoljava ocjenu otkazanog pregleda", async () => {
    const rezervacija = await kreirajRezervaciju({ otkazano: true });
    const token = kreirajReviewToken(rezervacija.id);

    const res = await request(app).post(`/api/appointments/review/${token}`).send({
      rating: 4,
    });

    expect(res.status).toBe(400);
    expect(res.body.poruka).toBe("Nije moguće ocijeniti otkazani termin.");
  });

  it("postojeća zaštićena pacijent ruta i dalje sprema review u istu tabelu", async () => {
    const rezervacija = await kreirajRezervaciju();

    const res = await request(app)
      .post(`/api/appointments/${rezervacija.id}/review`)
      .set("Authorization", `Bearer ${PACIJENT_TOKEN}`)
      .send({
        rating: 3,
        comment: "Ocjena preko prijavljenog pacijenta.",
      });

    const review = await prisma.recenzija.findUnique({
      where: { idRezervacije: rezervacija.id },
    });

    expect(res.status).toBe(201);
    expect(review).toMatchObject({
      idRezervacije: rezervacija.id,
      ocjena: 3,
      komentar: "Ocjena preko prijavljenog pacijenta.",
    });
  });
});