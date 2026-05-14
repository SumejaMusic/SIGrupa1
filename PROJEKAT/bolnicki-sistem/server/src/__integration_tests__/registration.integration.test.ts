import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import app from "../app.js";
import { PrismaClient } from "@prisma/client";

vi.mock("../emailService.js", () => ({
    sendVerificationEmail:     vi.fn().mockResolvedValue(undefined),
    sendEmail:                 vi.fn().mockResolvedValue(undefined),
    posaljiVerifikacioniKod:   vi.fn().mockResolvedValue(undefined),
    posaljiPotvrdurezerv:      vi.fn().mockResolvedValue(undefined),
    posaljiResetPasswordEmail: vi.fn().mockResolvedValue(undefined),
    default:                   { sendVerificationEmail: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("../lib/redis.js", () => ({
    redis: {
        setex:  vi.fn().mockResolvedValue("OK"),
        get:    vi.fn().mockResolvedValue(null),
        del:    vi.fn().mockResolvedValue(1),
        ttl:    vi.fn().mockResolvedValue(900),
        set:    vi.fn().mockResolvedValue("OK"),
        exists: vi.fn().mockResolvedValue(0),
    },
}));

const prisma = new PrismaClient();

// ─── helper: briše sve korisnike s prefiksom "registracija-test-" ────────────
async function ocistiTestKorisnike() {
    const korisnici = await prisma.korisnik.findMany({
        where:  { email: { startsWith: "registracija-test-" } },
        select: { id: true },
    });

    const ids = korisnici.map((k) => k.id);
    if (ids.length === 0) return;

    await prisma.pacijent.deleteMany({ where: { idKorisnik: { in: ids } } });
    await prisma.korisnik.deleteMany({ where: { id:          { in: ids } } });
}

// Čisti i PRIJE i POSLIJE — štiti od prljavog stanja iz prethodnog runa
beforeEach(async () => { await ocistiTestKorisnike(); });
afterEach(async ()  => { await ocistiTestKorisnike(); });

// ─── factory podataka ─────────────────────────────────────────────────────────
const validniPodaci = {
    ime:            "Amina",
    prezime:        "Hodžić",
    jmbg:           "1101900123456",
    datumRodjenja:  "1900-01-11",
    email:          "amina-integ@test.ba",
    pristupnaSifra: "Test@123",
    brojTelefona:   "+38761123456",
    brojKnjizice:   "INT-001",
};

// Timestamp + random sufiks — garantovana jedinstvenost čak i pri paralelnom pokretanju
const jedinstveniPodaci = (overrides = {}) => {
    const ts  = Date.now();
    const rnd = Math.floor(Math.random() * 1_000_000);
    const uid = `${ts}${rnd}`;           // ~19 cifara — dovoljno za prefiks

    return {
        ...validniPodaci,
        email:        `registracija-test-${uid}@test.ba`,
        // JMBG mora biti tačno 13 cifara — uzimamo posljednjih 13 iz uid-a
        jmbg:         uid.slice(-13),
        brojKnjizice: `INT-${uid}`,
        ...overrides,
    };
};

// ─── testovi ──────────────────────────────────────────────────────────────────

describe("POST /api/auth/registracija — uspješni scenariji", () => {
    it("registruje novog korisnika i vraća 201", async () => {
        const podaci = jedinstveniPodaci();

        const res = await request(app)
            .post("/api/auth/registracija")
            .send(podaci);

        console.log("STATUS:", res.status);
        console.log("BODY:",   JSON.stringify(res.body, null, 2));

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("poruka", "Korisnik uspješno registrovan. Provjerite email za verifikacioni kod.");
        expect(res.body).toHaveProperty("korisnik");
        expect(res.body.korisnik).toHaveProperty("id");
        expect(res.body.korisnik).toHaveProperty("ime",     podaci.ime);
        expect(res.body.korisnik).toHaveProperty("prezime", podaci.prezime);
        expect(res.body.korisnik).toHaveProperty("email",   podaci.email);
    });

    it("dodjeljuje ulogu PACIJENT novom korisniku", async () => {
        const podaci = jedinstveniPodaci();

        const res = await request(app)
            .post("/api/auth/registracija")
            .send(podaci);

        expect(res.status).toBe(201);
        expect(res.body.korisnik).toHaveProperty("uloga", "PACIJENT");
    });

    it("korisnik se stvarno upisuje u bazu — može se prijaviti", async () => {
        const podaci = jedinstveniPodaci();

        const regRes = await request(app)
            .post("/api/auth/registracija")
            .send(podaci);

        expect(regRes.status).toBe(201);

        // Ručno označavamo email kao verifikovan kako bi prijava prošla
        await prisma.korisnik.update({
            where: { email: podaci.email },
            data:  { emailVerifikovan: true },
        });

        const loginRes = await request(app)
            .post("/api/auth/prijava")
            .send({
                email:          podaci.email,
                pristupnaSifra: podaci.pristupnaSifra,
            });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body).toHaveProperty("token");
        expect(loginRes.body.korisnik).toHaveProperty("email", podaci.email);
        expect(loginRes.body.korisnik).toHaveProperty("uloga", "PACIJENT");
    });

    it("registruje korisnika bez broja telefona", async () => {
        const { brojTelefona, ...bezTelefona } = jedinstveniPodaci();

        const res = await request(app)
            .post("/api/auth/registracija")
            .send(bezTelefona);

        expect(res.status).toBe(201);
    });
});

describe("POST /api/auth/registracija — validacija polja", () => {
    it("vraća 400 kada ime nije poslano", async () => {
        const res = await request(app)
            .post("/api/auth/registracija")
            .send({ ...jedinstveniPodaci(), ime: "" });

        expect(res.status).toBe(400);
        expect(res.body.poruka).toMatch(/obavezn/i);
    });

    it("vraća 400 za ime sa brojevima", async () => {
        const res = await request(app)
            .post("/api/auth/registracija")
            .send({ ...jedinstveniPodaci(), ime: "Amina123" });

        expect(res.status).toBe(400);
        expect(res.body.poruka).toMatch(/slova/i);
    });

    it("vraća 400 kada je lozinka prekratka", async () => {
        const res = await request(app)
            .post("/api/auth/registracija")
            .send({ ...jedinstveniPodaci(), pristupnaSifra: "Ab@1" });

        expect(res.status).toBe(400);
        expect(res.body.poruka).toMatch(/8 karaktera/i);
    });

    it("vraća 400 za lozinku bez specijalnog karaktera", async () => {
        const res = await request(app)
            .post("/api/auth/registracija")
            .send({ ...jedinstveniPodaci(), pristupnaSifra: "Test1234" });

        expect(res.status).toBe(400);
        expect(res.body.poruka).toMatch(/specijalni/i);
    });

    it("vraća 400 kada broj knjižice nije poslan", async () => {
        const res = await request(app)
            .post("/api/auth/registracija")
            .send({ ...jedinstveniPodaci(), brojKnjizice: "" });

        expect(res.status).toBe(400);
        expect(res.body.poruka).toMatch(/knjižice/i);
    });

    it("vraća 400 za neispravan format broja telefona", async () => {
        const res = await request(app)
            .post("/api/auth/registracija")
            .send({ ...jedinstveniPodaci(), brojTelefona: "123abc" });

        expect(res.status).toBe(400);
        expect(res.body.poruka).toMatch(/telefon/i);
    });

    it("vraća 400 za datum rođenja u budućnosti", async () => {
        const res = await request(app)
            .post("/api/auth/registracija")
            .send({
                ...jedinstveniPodaci(),
                datumRodjenja: "2099-01-01",
                jmbg:          "0101099123456",
            });

        expect(res.status).toBe(400);
        expect(res.body.poruka).toMatch(/budućnost/i);
    });
});

describe("POST /api/auth/registracija — duplikati", () => {
    it("vraća 409 za duplikat email adrese", async () => {
        const podaci = jedinstveniPodaci();

        const res1 = await request(app)
            .post("/api/auth/registracija")
            .send(podaci);

        expect(res1.status).toBe(201);

        const res2 = await request(app)
            .post("/api/auth/registracija")
            .send({
                ...podaci,
                // email ostaje isti — testiramo duplikat
                jmbg:         jedinstveniPodaci().jmbg,
                brojKnjizice: `DUP-${Date.now()}`,
            });

        expect(res2.status).toBe(409);
        expect(res2.body.poruka).toMatch(/email/i);
    });

    it("vraća 409 za duplikat JMBG", async () => {
        const podaci = jedinstveniPodaci();

        const res1 = await request(app)
            .post("/api/auth/registracija")
            .send(podaci);

        expect(res1.status).toBe(201);

        const res2 = await request(app)
            .post("/api/auth/registracija")
            .send({
                ...podaci,
                // jmbg ostaje isti — testiramo duplikat
                email:        `registracija-test-dup-jmbg-${Date.now()}@test.ba`,
                brojKnjizice: `DUP-JMBG-${Date.now()}`,
            });

        expect(res2.status).toBe(409);
        expect(res2.body.poruka).toMatch(/JMBG/i);
    });

    it("vraća 409 za duplikat broja knjižice", async () => {
        const podaci = jedinstveniPodaci();

        const res1 = await request(app)
            .post("/api/auth/registracija")
            .send(podaci);

        expect(res1.status).toBe(201);

        const res2 = await request(app)
            .post("/api/auth/registracija")
            .send({
                ...podaci,
                // brojKnjizice ostaje isti — testiramo duplikat
                email: `registracija-test-dup-knjizica-${Date.now()}@test.ba`,
                jmbg:  jedinstveniPodaci().jmbg,
            });

        expect(res2.status).toBe(409);
        expect(res2.body.poruka).toMatch(/knjižice/i);
    });
});

describe("POST /api/auth/registracija — sigurnost", () => {
    it("ne vraća lozinku u odgovoru API-ja", async () => {
        const podaci = jedinstveniPodaci();

        const res = await request(app)
            .post("/api/auth/registracija")
            .send(podaci);

        expect(res.status).toBe(201);
        expect(res.body.korisnik).not.toHaveProperty("pristupnaSifra");
        expect(JSON.stringify(res.body)).not.toContain(podaci.pristupnaSifra);
    });

    it("ne vraća JMBG u odgovoru API-ja", async () => {
        const podaci = jedinstveniPodaci();

        const res = await request(app)
            .post("/api/auth/registracija")
            .send(podaci);

        expect(res.status).toBe(201);
        expect(res.body.korisnik).not.toHaveProperty("jmbg");
    });

    it("šalje Content-Type application/json", async () => {
        const podaci = jedinstveniPodaci();

        const res = await request(app)
            .post("/api/auth/registracija")
            .send(podaci);

        expect(res.headers["content-type"]).toMatch(/json/);
    });
});