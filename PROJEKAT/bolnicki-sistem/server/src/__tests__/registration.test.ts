import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock } from "../lib/__mocks__/prisma.js";
import { registrujSe } from "../controllers/authController.js";

vi.mock("../lib/prisma.js");

// ──────────────────────────────────────────────────────────────────────────────
// Promijeni putanju ako se email servis nalazi negdje drugdje.
// ──────────────────────────────────────────────────────────────────────────────
vi.mock("../services/emailService.js", () => ({
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    sendEmail:             vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../lib/encryption.js", () => ({
    enkriptuj: vi.fn((vrijednost: string) => `enc:${vrijednost}`),
}));

vi.mock("bcrypt", () => ({
    default: {
        hash:    vi.fn(async (lozinka: string) => `hashed:${lozinka}`),
        compare: vi.fn(),
    },
}));

const validniPodaci = {
    ime: "Amina",
    prezime: "Hodžić",
    jmbg: "1101900123456",
    datumRodjenja: "1900-01-11",
    email: "amina@test.ba",
    pristupnaSifra: "Test@123",
    brojTelefona: "+38761123456",
    brojKnjizice: "123456789",
};

const napraviReqRes = (body: Record<string, unknown> = {}) => ({
    req: { body } as any,
    res: {
        status: vi.fn().mockReturnThis(),
        json:   vi.fn(),
    } as any,
    next: vi.fn(),
});

const ocekujGresku = (next: any, status?: number) => {
    expect(next).toHaveBeenCalled();

    if (status) {
        const greska = vi.mocked(next).mock.calls[0][0];
        expect(
            greska.status ?? greska.statusCode ?? greska.statusKod
        ).toBe(status);
    }
};

// Kreirana korisnik vrijednost koja se vraća iz transaction mocka
const mockKreiraniKorisnik = {
    id:      1,
    ime:     "Amina",
    prezime: "Hodžić",
    email:   "amina@test.ba",
    uloga:   "PACIJENT",
};

beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(null);
    vi.mocked(prismaMock.pacijent.findUnique).mockResolvedValue(null);

    // Prošireni tx mock — pokriva sve moguće operacije unutar transakcije
    vi.mocked(prismaMock.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
            korisnik: {
                create: vi.fn().mockResolvedValue(mockKreiraniKorisnik),
                update: vi.fn().mockResolvedValue(mockKreiraniKorisnik),
            },
            pacijent: {
                create: vi.fn().mockResolvedValue({ id: 1, korisnikId: 1 }),
                update: vi.fn().mockResolvedValue({ id: 1, korisnikId: 1 }),
            },
            // Pokriva tabelu za verifikacijske kodove (naziv prilagodi svom modelu)
            verifikacijaKod: {
                create: vi.fn().mockResolvedValue({ id: 1, kod: "123456" }),
                upsert: vi.fn().mockResolvedValue({ id: 1, kod: "123456" }),
            },
            emailVerifikacija: {
                create: vi.fn().mockResolvedValue({ id: 1, kod: "123456" }),
                upsert: vi.fn().mockResolvedValue({ id: 1, kod: "123456" }),
            },
        };

        return callback(tx);
    });
});

describe("registrujSe - uspjesna registracija", () => {
    it("vraca 201 i registrovanog korisnika kada su podaci validni", async () => {
        const { req, res, next } = napraviReqRes(validniPodaci);

        await registrujSe(req, res, next);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                poruka:
                    "Korisnik uspješno registrovan. Provjerite email za verifikacioni kod.",
                email: "amina@test.ba",
                maskiraniEmail: "a***a@test.ba",
                emailVerifikacijaPotrebna: true,
                korisnik: expect.objectContaining({
                    id:      1,
                    ime:     "Amina",
                    prezime: "Hodžić",
                    email:   "amina@test.ba",
                    uloga:   "PACIJENT",
                    maskiraniEmail:           "a***a@test.ba",
                    emailVerifikacijaPotrebna: true,
                }),
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("dodjeljuje ulogu PACIJENT novom korisniku", async () => {
        const { req, res, next } = napraviReqRes(validniPodaci);

        await registrujSe(req, res, next);

        const odgovor = vi.mocked(res.json).mock.calls[0][0];

        expect(odgovor.korisnik.uloga).toBe("PACIJENT");
        expect(next).not.toHaveBeenCalled();
    });

    it("dozvoljava registraciju bez broja telefona", async () => {
        const { brojTelefona, ...podaciBezTelefona } = validniPodaci;
        const { req, res, next } = napraviReqRes(podaciBezTelefona);

        await registrujSe(req, res, next);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(next).not.toHaveBeenCalled();
    });
});

describe("registrujSe - validacija obaveznih polja", () => {
    it("vraca gresku kada ime nije poslano", async () => {
        const { req, res, next } = napraviReqRes({ ...validniPodaci, ime: "" });

        await registrujSe(req, res, next);

        ocekujGresku(next);
        expect(res.status).not.toHaveBeenCalledWith(201);
    });

    it("vraca gresku kada prezime nije poslano", async () => {
        const { req, res, next } = napraviReqRes({ ...validniPodaci, prezime: "" });

        await registrujSe(req, res, next);

        ocekujGresku(next);
        expect(res.status).not.toHaveBeenCalledWith(201);
    });

    it("vraca gresku kada lozinka nije poslana", async () => {
        const { req, res, next } = napraviReqRes({ ...validniPodaci, pristupnaSifra: "" });

        await registrujSe(req, res, next);

        ocekujGresku(next);
        expect(res.status).not.toHaveBeenCalledWith(201);
    });

    it("vraca gresku kada JMBG nije poslan", async () => {
        const { req, res, next } = napraviReqRes({ ...validniPodaci, jmbg: "" });

        await registrujSe(req, res, next);

        ocekujGresku(next);
        expect(res.status).not.toHaveBeenCalledWith(201);
    });

    it("vraca gresku kada broj knjizice nije poslan", async () => {
        const { req, res, next } = napraviReqRes({ ...validniPodaci, brojKnjizice: "" });

        await registrujSe(req, res, next);

        ocekujGresku(next);
        expect(res.status).not.toHaveBeenCalledWith(201);
    });
});

describe("registrujSe - validacija formata", () => {
    it("vraca gresku kada ime sadrzi brojeve", async () => {
        const { req, res, next } = napraviReqRes({ ...validniPodaci, ime: "Amina123" });

        await registrujSe(req, res, next);

        ocekujGresku(next);
        expect(res.status).not.toHaveBeenCalledWith(201);
    });

    it("vraca gresku kada JMBG nema 13 cifara", async () => {
        const { req, res, next } = napraviReqRes({ ...validniPodaci, jmbg: "12345" });

        await registrujSe(req, res, next);

        ocekujGresku(next);
        expect(res.status).not.toHaveBeenCalledWith(201);
    });

    it("vraca gresku kada JMBG ne odgovara datumu rodjenja", async () => {
        const { req, res, next } = napraviReqRes({
            ...validniPodaci,
            jmbg: "1101900123456",
            datumRodjenja: "2000-05-15",
        });

        await registrujSe(req, res, next);

        ocekujGresku(next);
        expect(res.status).not.toHaveBeenCalledWith(201);
    });

    it("vraca gresku kada je datum rodjenja u buducnosti", async () => {
        const { req, res, next } = napraviReqRes({
            ...validniPodaci,
            datumRodjenja: "2099-01-01",
            jmbg: "0101099123456",
        });

        await registrujSe(req, res, next);

        ocekujGresku(next);
        expect(res.status).not.toHaveBeenCalledWith(201);
    });

    it("vraca gresku kada lozinka nema veliko slovo", async () => {
        const { req, res, next } = napraviReqRes({ ...validniPodaci, pristupnaSifra: "test@123" });

        await registrujSe(req, res, next);

        ocekujGresku(next);
        expect(res.status).not.toHaveBeenCalledWith(201);
    });

    it("vraca gresku kada lozinka nema malo slovo", async () => {
        const { req, res, next } = napraviReqRes({ ...validniPodaci, pristupnaSifra: "TEST@123" });

        await registrujSe(req, res, next);

        ocekujGresku(next);
        expect(res.status).not.toHaveBeenCalledWith(201);
    });

    it("vraca gresku kada lozinka nema broj", async () => {
        const { req, res, next } = napraviReqRes({ ...validniPodaci, pristupnaSifra: "Test@abc" });

        await registrujSe(req, res, next);

        ocekujGresku(next);
        expect(res.status).not.toHaveBeenCalledWith(201);
    });

    it("vraca gresku kada lozinka nema specijalni karakter", async () => {
        const { req, res, next } = napraviReqRes({ ...validniPodaci, pristupnaSifra: "Test1234" });

        await registrujSe(req, res, next);

        ocekujGresku(next);
        expect(res.status).not.toHaveBeenCalledWith(201);
    });

    it("vraca gresku kada je lozinka kraca od 8 karaktera", async () => {
        const { req, res, next } = napraviReqRes({ ...validniPodaci, pristupnaSifra: "Te@1" });

        await registrujSe(req, res, next);

        ocekujGresku(next);
        expect(res.status).not.toHaveBeenCalledWith(201);
    });

    it("vraca gresku kada broj telefona nije u ispravnom formatu", async () => {
        const { req, res, next } = napraviReqRes({ ...validniPodaci, brojTelefona: "123abc" });

        await registrujSe(req, res, next);

        ocekujGresku(next);
        expect(res.status).not.toHaveBeenCalledWith(201);
    });
});

describe("registrujSe - provjera jedinstvenosti", () => {
    it("vraca gresku kada email vec postoji", async () => {
        vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValueOnce({
            id: 1,
            email: "amina@test.ba",
        } as any);

        const { req, res, next } = napraviReqRes(validniPodaci);

        await registrujSe(req, res, next);

        ocekujGresku(next);
        expect(res.status).not.toHaveBeenCalledWith(201);
    });

    it("vraca gresku kada JMBG vec postoji", async () => {
        vi.mocked(prismaMock.korisnik.findUnique)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ id: 2, jmbgHash: "jmbg-hash" } as any);

        const { req, res, next } = napraviReqRes(validniPodaci);

        await registrujSe(req, res, next);

        ocekujGresku(next);
        expect(res.status).not.toHaveBeenCalledWith(201);
    });

    it("vraca gresku kada broj knjizice vec postoji", async () => {
        vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(null);
        vi.mocked(prismaMock.pacijent.findUnique).mockResolvedValue({
            id: 2,
            brojKnjiziceHash: "broj-knjizice-hash",
        } as any);

        const { req, res, next } = napraviReqRes(validniPodaci);

        await registrujSe(req, res, next);

        ocekujGresku(next);
        expect(res.status).not.toHaveBeenCalledWith(201);
    });
});

describe("registrujSe - interna greska servera", () => {
    it("vraca gresku kada baza podataka baci neocekivanu gresku", async () => {
        vi.mocked(prismaMock.korisnik.findUnique).mockRejectedValue(
            new Error("Connection lost")
        );

        const { req, res, next } = napraviReqRes(validniPodaci);

        await registrujSe(req, res, next);

        ocekujGresku(next);
        expect(res.status).not.toHaveBeenCalledWith(201);
    });
});