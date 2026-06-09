/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Edge-case testovi: neispravni unosi, istovremeni zahtjevi, djelimični zapisi
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { vi, describe, it, expect, beforeEach } from "vitest";
import { prismaMock } from "../lib/__mocks__/prisma.js";
import { redisMock } from "../lib/__mocks__/redis.js";
import {
  kreirajRezervaciju,
  getRezervacijeZaDoktora,
  otkaziRezervacijuPacijent,
  otkaziRezervacijuOsoblje,
  dodajKomentar,
  dodajKomentarDoktor,
  getKomentari,
  kreirajRezervacijuDoktor,
} from "../controllers/reservationController.js";
import {
  getSlobodniTermini,
  getTerminById,
  zaključajTermin,
  oslobodiTermin,
} from "../controllers/terminController.js";
import { registrujSe, prijaviSe, resetPassword, forgotPassword } from "../controllers/authController.js";
import { registracijaService, prijavaService } from "../authService.js";
import { prijavaNaListu } from "../controllers/listaCekanjaController.js";

// ─── Mockovi ──────────────────────────────────────────────────────────────
vi.mock("../app.js", () => ({
  io: { emit: vi.fn(), to: vi.fn(() => ({ emit: vi.fn() })) },
}));

vi.mock("../emailService.js", () => ({
  posaljiPotvrdurezerv: vi.fn().mockResolvedValue(undefined),
  posaljiOtkazivanjeRezerv: vi.fn().mockResolvedValue(undefined),
  posaljiVerifikacioniKod: vi.fn().mockResolvedValue(undefined),
  posaljiResetPasswordEmail: vi.fn().mockResolvedValue(undefined),
  posaljiWaitlistNotifikaciju: vi.fn().mockResolvedValue(undefined),
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendEmail: vi.fn().mockResolvedValue(undefined),
  default: { sendVerificationEmail: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("../lib/prisma.js");
vi.mock("../lib/redis.js");

vi.mock("../listaCekanjaService.js", () => ({
  obradiOtkazivanje: vi.fn().mockResolvedValue(undefined),
  prijaviSeNaListuCekanja: vi.fn().mockResolvedValue({ id: 1 }),
}));

vi.mock("multer", () => {
  const multerMock: any = () => ({
    single: () => (req: any, res: any, next: any) => next(),
    array: () => (req: any, res: any, next: any) => next(),
    fields: () => (req: any, res: any, next: any) => next(),
  });
  multerMock.memoryStorage = vi.fn(() => ({}));
  multerMock.diskStorage = vi.fn(() => ({}));
  return { default: multerMock, memoryStorage: multerMock.memoryStorage, diskStorage: multerMock.diskStorage };
});

vi.mock("../lib/encryption.js", () => ({
  enkriptuj: vi.fn((vrijednost: string) => `enc:${vrijednost}`),
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(async (lozinka: string) => `hashed:${lozinka}`),
    compare: vi.fn().mockResolvedValue(false),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: { sign: vi.fn(() => "mock-jwt-token") },
}));

// ─── Helperi ──────────────────────────────────────────────────────────────
const mockReqRes = (
  params: Record<string, any> = {},
  query: Record<string, any> = {},
  body: Record<string, any> = {},
  korisnik: { id: number; uloga: string; doktorId?: number } | null = { id: 1, uloga: "PACIJENT" }
) => ({
  req: { params, query, body, korisnik, ip: "127.0.0.1", socket: { remoteAddress: "127.0.0.1" } } as any,
  res: {
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  } as any,
  next: vi.fn(),
});

const pacijentMock = {
  id: 10,
  idKorisnik: 1,
  hronicniBolesnik: false,
  korisnik: { id: 1, email: "test@test.ba", ime: "Test", prezime: "Testić" },
};

const buduciTermin = () => ({
  id: 5,
  idDoktor: 2,
  status: "SLOBODAN",
  datum: new Date(Date.now() + 48 * 60 * 60 * 1000),
  vrijeme: 540,
});

beforeEach(() => {
  vi.resetAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════
//  1. NEISPRAVNI UNOSI (Input Validation Edge Cases)
// ═══════════════════════════════════════════════════════════════════════════
describe("NEISPRAVNI UNOSI", () => {
  // ─── kreirajRezervaciju ────────────────────────────────────────────────
  describe("kreirajRezervaciju — neispravni unosi", () => {
    it("vraća 400 za negativni terminId", async () => {
      const { req, res, next } = mockReqRes({}, {}, { terminId: -1, doktorId: 2 });
      await kreirajRezervaciju(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Nedostaju ispravni podaci za termin ili doktora." });
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 400 za terminId = 0", async () => {
      const { req, res, next } = mockReqRes({}, {}, { terminId: 0, doktorId: 2 });
      await kreirajRezervaciju(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 400 za terminId koji je decimalni broj", async () => {
      const { req, res, next } = mockReqRes({}, {}, { terminId: 3.14, doktorId: 2 });
      await kreirajRezervaciju(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 400 za doktorId koji je string koji nije broj", async () => {
      const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: "abc" });
      await kreirajRezervaciju(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 400 kada doktorId nedostaje potpuno", async () => {
      const { req, res, next } = mockReqRes({}, {}, { terminId: 5 });
      await kreirajRezervaciju(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 400 kada terminId nedostaje potpuno", async () => {
      const { req, res, next } = mockReqRes({}, {}, { doktorId: 2 });
      await kreirajRezervaciju(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 401 kada korisnik nije prijavljen (null)", async () => {
      const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: 2 }, null);
      await kreirajRezervaciju(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Niste prijavljeni." });
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 400 kada termin ne pripada doktoru", async () => {
      vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(pacijentMock as any);
      vi.mocked(prismaMock.termin.findUnique).mockResolvedValue({
        ...buduciTermin(),
        idDoktor: 99, // razlicit od poslanog doktorId=2
      } as any);

      const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: 2 });
      await kreirajRezervaciju(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Odabrani termin ne pripada izabranom doktoru." });
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 409 kada termin nije slobodan", async () => {
      vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(pacijentMock as any);
      vi.mocked(prismaMock.termin.findUnique).mockResolvedValue({
        ...buduciTermin(),
        status: "ZAKAZAN",
      } as any);

      const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: 2 });
      await kreirajRezervaciju(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Termin više nije slobodan." });
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ─── getRezervacijeZaDoktora — neispravni parametri ────────────────────
  describe("getRezervacijeZaDoktora — neispravni parametri", () => {
    it("vraća 400 za doktorId = 'NaN'", async () => {
      const { req, res, next } = mockReqRes({ doktorId: "NaN" });
      await getRezervacijeZaDoktora(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Neispravan ID doktora." });
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 400 za negativni doktorId", async () => {
      const { req, res, next } = mockReqRes({ doktorId: "-5" });
      await getRezervacijeZaDoktora(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 400 za doktorId = 0", async () => {
      const { req, res, next } = mockReqRes({ doktorId: "0" });
      await getRezervacijeZaDoktora(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 400 za prazan string doktorId", async () => {
      const { req, res, next } = mockReqRes({ doktorId: "" });
      await getRezervacijeZaDoktora(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ─── dodajKomentar — neispravni unosi ──────────────────────────────────
  describe("dodajKomentar — neispravni unosi", () => {
    it("vraća 400 kada komentar sadrži samo razmake", async () => {
      const { req, res, next } = mockReqRes({ id: "1" }, {}, { komentar: "   " });
      await dodajKomentar(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Komentar ne može biti prazan." });
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 400 kada komentar nije string (broj)", async () => {
      const { req, res, next } = mockReqRes({ id: "1" }, {}, { komentar: 12345 });
      await dodajKomentar(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 400 kada komentar je null", async () => {
      const { req, res, next } = mockReqRes({ id: "1" }, {}, { komentar: null });
      await dodajKomentar(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 400 kada polje komentar uopšte ne postoji u body-ju", async () => {
      const { req, res, next } = mockReqRes({ id: "1" }, {}, {});
      await dodajKomentar(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 401 kada korisnik nije prijavljen", async () => {
      const { req, res, next } = mockReqRes({ id: "1" }, {}, { komentar: "test" }, null);
      await dodajKomentar(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ─── dodajKomentarDoktor — neispravni unosi ────────────────────────────
  describe("dodajKomentarDoktor — neispravni unosi", () => {
    it("vraća 403 kada korisnik nije doktor", async () => {
      const { req, res, next } = mockReqRes({ id: "1" }, {}, { komentar: "Test" }, { id: 1, uloga: "PACIJENT" });
      await dodajKomentarDoktor(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Samo doktori mogu koristiti ovu rutu." });
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 400 za nevažeći ID rezervacije (0)", async () => {
      const { req, res, next } = mockReqRes({ id: "0" }, {}, { komentar: "Test" }, { id: 1, uloga: "DOKTOR" });
      await dodajKomentarDoktor(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Nevažeći ID rezervacije." });
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 400 za negativni ID rezervacije", async () => {
      const { req, res, next } = mockReqRes({ id: "-1" }, {}, { komentar: "Test" }, { id: 1, uloga: "DOKTOR" });
      await dodajKomentarDoktor(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 400 kada je komentar prazan", async () => {
      const { req, res, next } = mockReqRes({ id: "1" }, {}, { komentar: "" }, { id: 1, uloga: "DOKTOR" });
      await dodajKomentarDoktor(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Komentar ne može biti prazan." });
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 400 za komentarisanje otkazane rezervacije", async () => {
      vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
        id: 1,
        idDoktor: 2,
        datumOtkazivanja: new Date(),
        zavrseno: false,
        doktor: { idKorisnik: 1 },
        pacijent: { idKorisnik: 5 },
      } as any);

      const { req, res, next } = mockReqRes({ id: "1" }, {}, { komentar: "Test" }, { id: 1, uloga: "DOKTOR" });
      await dodajKomentarDoktor(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Nije moguće komentarisati otkazanu rezervaciju." });
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 400 za komentarisanje završene rezervacije", async () => {
      vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
        id: 1,
        idDoktor: 2,
        datumOtkazivanja: null,
        zavrseno: true,
        doktor: { idKorisnik: 1 },
        pacijent: { idKorisnik: 5 },
      } as any);

      const { req, res, next } = mockReqRes({ id: "1" }, {}, { komentar: "Test" }, { id: 1, uloga: "DOKTOR" });
      await dodajKomentarDoktor(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Nije moguće komentarisati završenu rezervaciju." });
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 403 kada doktor pokušava komentarisati tuđu rezervaciju", async () => {
      vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
        id: 1,
        idDoktor: 2,
        datumOtkazivanja: null,
        zavrseno: false,
        doktor: { idKorisnik: 99 }, // drugi doktor
        pacijent: { idKorisnik: 5 },
      } as any);

      const { req, res, next } = mockReqRes({ id: "1" }, {}, { komentar: "Test" }, { id: 1, uloga: "DOKTOR" });
      await dodajKomentarDoktor(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Nemate dozvolu za komentarisanje ove rezervacije." });
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ─── otkaziRezervacijuPacijent — neispravni unosi ──────────────────────
  describe("otkaziRezervacijuPacijent — neispravni unosi", () => {
    it("vraća 401 kada korisnik nije prijavljen", async () => {
      const { req, res, next } = mockReqRes({ id: "1" }, {}, {}, null);
      await otkaziRezervacijuPacijent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 403 kada pacijent pokušava otkazati tuđu rezervaciju", async () => {
      vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(pacijentMock as any);
      vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
        id: 1,
        idPacijent: 999, // tuđa rezervacija
        idTermina: 5,
        termin: { id: 5, datum: new Date(Date.now() + 48 * 60 * 60 * 1000) },
        pacijent: { korisnik: { email: "drugi@test.com" } },
      } as any);

      const { req, res, next } = mockReqRes({ id: "1" }, {}, {}, { id: 1, uloga: "PACIJENT" });
      await otkaziRezervacijuPacijent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Nemate dozvolu da otkažete ovu rezervaciju." });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ─── zaključajTermin — neispravni unosi ────────────────────────────────
  describe("zaključajTermin — neispravni unosi", () => {
    it("vraća 401 kada korisnik nije prijavljen", async () => {
      const { req, res, next } = mockReqRes({ id: "5" }, {}, {}, null);
      await zaključajTermin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Niste prijavljeni." });
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ─── Registracija — neispravni unosi ───────────────────────────────────
  describe("registracijaService — neispravni unosi", () => {
    it("baca grešku za nevalidan email format", async () => {
      await expect(
        registracijaService({
          ime: "Test",
          prezime: "Testić",
          jmbg: "1101900123456",
          datumRodjenja: "1900-01-11",
          email: "nevalidan-email",
          pristupnaSifra: "Test@123",
          brojKnjizice: "123456789",
        })
      ).rejects.toMatchObject({ status: 400, poruka: "Email nije validan." });
    });

    it("baca grešku za email bez @ znaka", async () => {
      await expect(
        registracijaService({
          ime: "Test",
          prezime: "Testić",
          jmbg: "1101900123456",
          datumRodjenja: "1900-01-11",
          email: "testtest.com",
          pristupnaSifra: "Test@123",
          brojKnjizice: "123456789",
        })
      ).rejects.toMatchObject({ status: 400, poruka: "Email nije validan." });
    });

    it("baca grešku za prazan JMBG", async () => {
      await expect(
        registracijaService({
          ime: "Test",
          prezime: "Testić",
          jmbg: "",
          datumRodjenja: "1900-01-11",
          email: "test@test.ba",
          pristupnaSifra: "Test@123",
          brojKnjizice: "123456789",
        })
      ).rejects.toMatchObject({ status: 400, poruka: "JMBG je obavezan." });
    });

    it("baca grešku za nevalidan datum rođenja (nije datum)", async () => {
      await expect(
        registracijaService({
          ime: "Test",
          prezime: "Testić",
          jmbg: "1101900123456",
          datumRodjenja: "nije-datum",
          email: "test@test.ba",
          pristupnaSifra: "Test@123",
          brojKnjizice: "123456789",
        })
      ).rejects.toMatchObject({ status: 400 });
    });

    it("baca grešku za datum rođenja u budućnosti", async () => {
      await expect(
        registracijaService({
          ime: "Test",
          prezime: "Testić",
          jmbg: "0101099123456",
          datumRodjenja: "2099-01-01",
          email: "test@test.ba",
          pristupnaSifra: "Test@123",
          brojKnjizice: "123456789",
        })
      ).rejects.toMatchObject({ status: 400 });
    });

    it("baca grešku za ime sa brojevima", async () => {
      await expect(
        registracijaService({
          ime: "Test123",
          prezime: "Testić",
          jmbg: "1101900123456",
          datumRodjenja: "1900-01-11",
          email: "test@test.ba",
          pristupnaSifra: "Test@123",
          brojKnjizice: "123456789",
        })
      ).rejects.toMatchObject({ status: 400 });
    });

    it("baca grešku za prezime sa specijalnim karakterima", async () => {
      await expect(
        registracijaService({
          ime: "Test",
          prezime: "Test!@#",
          jmbg: "1101900123456",
          datumRodjenja: "1900-01-11",
          email: "test@test.ba",
          pristupnaSifra: "Test@123",
          brojKnjizice: "123456789",
        })
      ).rejects.toMatchObject({ status: 400 });
    });

    it("baca grešku za nevalidan broj telefona", async () => {
      await expect(
        registracijaService({
          ime: "Test",
          prezime: "Testić",
          jmbg: "1101900123456",
          datumRodjenja: "1900-01-11",
          email: "test@test.ba",
          pristupnaSifra: "Test@123",
          brojTelefona: "invalid",
          brojKnjizice: "123456789",
        })
      ).rejects.toMatchObject({ status: 400, poruka: "Broj telefona nije validan." });
    });

    it("baca grešku za praznu lozinku", async () => {
      await expect(
        registracijaService({
          ime: "Test",
          prezime: "Testić",
          jmbg: "1101900123456",
          datumRodjenja: "1900-01-11",
          email: "test@test.ba",
          pristupnaSifra: "",
          brojKnjizice: "123456789",
        })
      ).rejects.toMatchObject({ status: 400 });
    });

    it("baca grešku za prazan broj knjižice", async () => {
      await expect(
        registracijaService({
          ime: "Test",
          prezime: "Testić",
          jmbg: "1101900123456",
          datumRodjenja: "1900-01-11",
          email: "test@test.ba",
          pristupnaSifra: "Test@123",
          brojKnjizice: "",
        })
      ).rejects.toMatchObject({ status: 400, poruka: "Broj zdravstvene knjižice je obavezan." });
    });
  });

  // ─── Prijava — neispravni unosi ────────────────────────────────────────
  describe("prijaviSe — neispravni unosi", () => {
    it("vraća 400 kada email nedostaje", async () => {
      const { req, res, next } = mockReqRes({}, {}, { pristupnaSifra: "Test@123" });
      await prijaviSe(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Email i lozinka su obavezni." });
    });

    it("vraća 400 kada lozinka nedostaje", async () => {
      const { req, res, next } = mockReqRes({}, {}, { email: "test@test.ba" });
      await prijaviSe(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("vraća 400 kada su oba polja prazna", async () => {
      const { req, res, next } = mockReqRes({}, {}, { email: "", pristupnaSifra: "" });
      await prijaviSe(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── resetPassword — neispravni unosi ──────────────────────────────────
  describe("resetPassword — neispravni unosi", () => {
    it("vraća 400 kada token nedostaje", async () => {
      const { req, res, next } = mockReqRes({}, {}, { newPassword: "Test@1234" });
      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Nedostaje token." });
    });

    it("vraća 400 kada nova lozinka ne ispunjava pravila (bez velikog slova)", async () => {
      const { req, res, next } = mockReqRes({}, {}, { token: "valid-token", newPassword: "test@123" });
      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Lozinka mora sadržavati veliko slovo." });
    });

    it("vraća 400 kada je lozinka prekratka", async () => {
      const { req, res, next } = mockReqRes({}, {}, { token: "valid-token", newPassword: "Te@1" });
      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Lozinka mora imati najmanje 8 karaktera." });
    });
  });

  // ─── kreirajRezervacijuDoktor — neispravni unosi ───────────────────────
  describe("kreirajRezervacijuDoktor — neispravni unosi", () => {
    it("vraća 400 za nedostajući idTermina", async () => {
      const { req, res, next } = mockReqRes({}, {}, { idPacijent: 10 }, { id: 1, uloga: "DOKTOR", doktorId: 2 });
      await kreirajRezervacijuDoktor(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Nedostaje ispravan idTermina." });
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 400 za nedostajući idPacijent", async () => {
      const { req, res, next } = mockReqRes({}, {}, { idTermina: 5 }, { id: 1, uloga: "DOKTOR", doktorId: 2 });
      await kreirajRezervacijuDoktor(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Nedostaje ispravan idPacijent." });
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 403 kada korisnik nema doktorId u tokenu", async () => {
      const { req, res, next } = mockReqRes({}, {}, { idTermina: 5, idPacijent: 10 }, { id: 1, uloga: "DOKTOR" });
      await kreirajRezervacijuDoktor(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 401 kada korisnik nije prijavljen", async () => {
      const { req, res, next } = mockReqRes({}, {}, { idTermina: 5, idPacijent: 10 }, null);
      await kreirajRezervacijuDoktor(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ─── prijavaNaListu — neispravni unosi ─────────────────────────────────
  describe("prijavaNaListu — neispravni unosi", () => {
    it("vraća 400 kada doktorId nedostaje", async () => {
      vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(pacijentMock as any);

      const { req, res, next } = mockReqRes({}, {}, { zeleniDatum: "2027-06-01" });
      await prijavaNaListu(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ poruka: "doktorId i zeleniDatum su obavezni." });
    });

    it("vraća 400 kada zeleniDatum nedostaje", async () => {
      vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(pacijentMock as any);

      const { req, res, next } = mockReqRes({}, {}, { doktorId: 2 });
      await prijavaNaListu(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("vraća 404 kada pacijent ne postoji", async () => {
      vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(null);

      const { req, res, next } = mockReqRes({}, {}, { doktorId: 2, zeleniDatum: "2027-06-01" });
      await prijavaNaListu(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Pacijent nije pronađen." });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  2. ISTOVREMENI ZAHTJEVI (Concurrency / Race Conditions)
// ═══════════════════════════════════════════════════════════════════════════
describe("ISTOVREMENI ZAHTJEVI", () => {
  // ─── Redis Lock za termine ─────────────────────────────────────────────
  describe("zaključajTermin — istovremeni zahtjevi", () => {
    it("vraća 409 kada drugi korisnik pokušava zaključati već zaključan termin", async () => {
      vi.mocked(redisMock.get).mockResolvedValue("99"); // drugi korisnik drži lock

      const { req, res, next } = mockReqRes({ id: "5" }, {}, {}, { id: 1, uloga: "PACIJENT" });
      await zaključajTermin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Termin je trenutno zauzet. Pokušajte ponovo." });
      expect(redisMock.setex).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("dozvoljava isti korisnik da produži lock", async () => {
      vi.mocked(redisMock.get).mockResolvedValue("1"); // isti korisnik
      vi.mocked(prismaMock.termin.findUnique).mockResolvedValue({ id: 5, idDoktor: 2 } as any);

      const { req, res, next } = mockReqRes({ id: "5" }, {}, {}, { id: 1, uloga: "PACIJENT" });
      await zaključajTermin(req, res, next);

      expect(redisMock.setex).toHaveBeenCalledWith("termin:lock:5", 120, "1");
      expect(res.json).toHaveBeenCalledWith({ poruka: "Termin uspješno zaključan.", ttl: 120 });
      expect(next).not.toHaveBeenCalled();
    });

    it("uspješno zaključava kada nema postojećeg locka", async () => {
      vi.mocked(redisMock.get).mockResolvedValue(null);
      vi.mocked(prismaMock.termin.findUnique).mockResolvedValue({ id: 5, idDoktor: 2 } as any);

      const { req, res, next } = mockReqRes({ id: "5" }, {}, {}, { id: 1, uloga: "PACIJENT" });
      await zaključajTermin(req, res, next);

      expect(redisMock.setex).toHaveBeenCalledWith("termin:lock:5", 120, "1");
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ poruka: "Termin uspješno zaključan." }));
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ─── Dupla rezervacija — race condition ────────────────────────────────
  describe("kreirajRezervaciju — dupla rezervacija (race condition)", () => {
    it("vraća 409 za duplu rezervaciju istog termina", async () => {
      vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(pacijentMock as any);
      vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(buduciTermin() as any);
      vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue({ id: 1 } as any); // duplikat

      const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: 2 });
      await kreirajRezervaciju(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija za ovaj termin već postoji." });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 409 kada postoji preklapanje sa drugim doktorom u isto vrijeme", async () => {
      vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(pacijentMock as any);
      vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(buduciTermin() as any);
      vi.mocked(prismaMock.rezervacije.findFirst)
        .mockResolvedValueOnce(null) // nema duplikata za isti termin
        .mockResolvedValueOnce({ id: 99 } as any); // preklapanje u isto vrijeme

      const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: 2 });
      await kreirajRezervaciju(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        poruka: "Već imate zakazan pregled u isto vrijeme kod drugog doktora."
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 409 kada Redis lock ne odgovara korisniku (tuđi lock)", async () => {
      vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(pacijentMock as any);
      vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(buduciTermin() as any);
      vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
      vi.mocked(redisMock.get).mockResolvedValue("999"); // tuđi lock

      const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: 2 });
      await kreirajRezervaciju(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Termin nije zaključan. Pokrenite proces ponovo." });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća 409 kada Redis lock ne postoji (istekao)", async () => {
      vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(pacijentMock as any);
      vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(buduciTermin() as any);
      vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
      vi.mocked(redisMock.get).mockResolvedValue(null); // lock istekao

      const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: 2 });
      await kreirajRezervaciju(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Termin nije zaključan. Pokrenite proces ponovo." });
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ─── Istovremeno otkazivanje ───────────────────────────────────────────
  describe("otkaziRezervacijuOsoblje — istovremeni zahtjevi", () => {
    it("vraća 400 za otkazivanje termina koji je već prošao", async () => {
      vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
        id: 1,
        idTermina: 5,
        termin: { id: 5, datum: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // prošlost
        pacijent: { korisnik: { email: "test@test.com" } },
        doktor: { korisnik: { ime: "Dr.", prezime: "Marić" }, specijalizacija: "Kardiologija" },
      } as any);

      const { req, res, next } = mockReqRes({ id: "1" });
      await otkaziRezervacijuOsoblje(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        poruka: "Nije moguće otkazati termin koji je već prošao."
      });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ─── Doktor pristupa tuđim rezervacijama ───────────────────────────────
  describe("getRezervacijeZaDoktora — provjera pristupa", () => {
    it("vraća 403 kada doktor pokušava pristupiti rezervacijama drugog doktora", async () => {
      vi.mocked(prismaMock.doktor.findUnique).mockResolvedValue({
        id: 3,
        idKorisnik: 99, // drugi doktor
      } as any);

      const { req, res, next } = mockReqRes(
        { doktorId: "3" },
        {},
        {},
        { id: 1, uloga: "DOKTOR" }
      );
      await getRezervacijeZaDoktora(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        poruka: "Nemate dozvolu za pregled rezervacija ovog doktora."
      });
      expect(prismaMock.rezervacije.findMany).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  3. DJELIMIČNI ZAPISI (Partial Records / Incomplete Data)
// ═══════════════════════════════════════════════════════════════════════════
describe("DJELIMIČNI ZAPISI", () => {
  // ─── Transakcija rollback pri grešci ───────────────────────────────────
  describe("kreirajRezervaciju — djelimični zapisi i rollback", () => {
    it("briše upload nalaza kada transakcija padne (cleanup na grešku)", async () => {
      vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(pacijentMock as any);
      vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(buduciTermin() as any);
      vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
      vi.mocked(redisMock.get).mockResolvedValue("1");

      // PDF upload kreiran, ali transakcija pada
      vi.mocked(prismaMock.nalaz.create).mockResolvedValue({ id: 42 } as any);
      vi.mocked(prismaMock.$transaction).mockRejectedValue(new Error("Transakcija pala"));
      vi.mocked(prismaMock.nalaz.delete).mockResolvedValue({} as any);

      const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: 2 });
      (req as any).file = {
        originalname: "test.pdf",
        buffer: Buffer.from("fake-pdf"),
        mimetype: "application/pdf",
      };

      await kreirajRezervaciju(req, res, next);

      // Nalaz koji je kreiran van transakcije treba biti obrisan
      expect(prismaMock.nalaz.delete).toHaveBeenCalledWith({ where: { id: 42 } });
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(res.status).not.toHaveBeenCalledWith(201);
    });

    it("propagira grešku čak i kad cleanup nalaza ne uspije", async () => {
      vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(pacijentMock as any);
      vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(buduciTermin() as any);
      vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
      vi.mocked(redisMock.get).mockResolvedValue("1");

      vi.mocked(prismaMock.nalaz.create).mockResolvedValue({ id: 42 } as any);
      vi.mocked(prismaMock.$transaction).mockRejectedValue(new Error("Transakcija pala"));
      vi.mocked(prismaMock.nalaz.delete).mockRejectedValue(new Error("Delete failed")); // cleanup fails

      const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: 2 });
      (req as any).file = {
        originalname: "test.pdf",
        buffer: Buffer.from("fake-pdf"),
        mimetype: "application/pdf",
      };

      await kreirajRezervaciju(req, res, next);

      // Originalna greška se propagira, ne greška od cleanup-a
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "Transakcija pala" }));
    });

    it("ne briše lock kada transakcija padne", async () => {
      vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(pacijentMock as any);
      vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(buduciTermin() as any);
      vi.mocked(prismaMock.rezervacije.findFirst).mockResolvedValue(null);
      vi.mocked(redisMock.get).mockResolvedValue("1");
      vi.mocked(prismaMock.$transaction).mockRejectedValue(new Error("DB timeout"));

      const { req, res, next } = mockReqRes({}, {}, { terminId: 5, doktorId: 2 });
      await kreirajRezervaciju(req, res, next);

      expect(redisMock.del).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  // ─── Nepotpuni podaci u bazi ───────────────────────────────────────────
  describe("getKomentari — nepotpuni zapisi", () => {
    it("vraća fallback autora kad korisnik nije pronađen (null)", async () => {
      vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
        id: 1,
        komentar: null,
        datumKreiranja: new Date("2026-05-18T08:00:00.000Z"),
        pacijent: { idKorisnik: 1, korisnik: { ime: "Ana", prezime: "Anić" } },
        doktor: { idKorisnik: 2 },
        komentari: [
          {
            id: 11,
            tekst: "Komentar bez korisnika",
            jeDoktor: false,
            datumKreiranja: new Date("2026-05-18T09:00:00.000Z"),
            korisnik: null, // korisnik obrisan ili anonimiziran
          },
        ],
      } as any);

      const { req, res, next } = mockReqRes({ id: "1" });
      await getKomentari(req, res, next);

      // Fallback na "Pacijent" umjesto null korisnika
      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 11,
          tekst: "Komentar bez korisnika",
          autor: "Pacijent", // fallback
          jeDoktor: false,
        }),
      ]);
      expect(next).not.toHaveBeenCalled();
    });

    it("prikazuje 'Doktor' kao fallback autora za komentar doktora bez korisnika", async () => {
      vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
        id: 1,
        komentar: null,
        pacijent: { idKorisnik: 1, korisnik: { ime: "Ana", prezime: "Anić" } },
        doktor: { idKorisnik: 2 },
        komentari: [
          {
            id: 12,
            tekst: "Doktorova napomena",
            jeDoktor: true,
            datumKreiranja: new Date("2026-05-18T10:00:00.000Z"),
            korisnik: null,
          },
        ],
      } as any);

      const { req, res, next } = mockReqRes({ id: "1" });
      await getKomentari(req, res, next);

      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({
          autor: "Doktor",
          jeDoktor: true,
        }),
      ]);
      expect(next).not.toHaveBeenCalled();
    });

    it("vraća prazan niz kada nema ni komentara ni starog komentara", async () => {
      vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
        id: 1,
        komentar: null,
        datumKreiranja: new Date(),
        pacijent: { idKorisnik: 1, korisnik: { ime: "Ana", prezime: "Anić" } },
        doktor: { idKorisnik: 2 },
        komentari: [],
      } as any);

      const { req, res, next } = mockReqRes({ id: "1" });
      await getKomentari(req, res, next);

      expect(res.json).toHaveBeenCalledWith([]);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ─── Djelimični podaci u registraciji ──────────────────────────────────
  describe("registracijaService — duplikati i djelimični podaci", () => {
    it("baca 409 za duplikat emaila", async () => {
      vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValueOnce({
        id: 1,
        email: "test@test.ba",
      } as any);

      await expect(
        registracijaService({
          ime: "Test",
          prezime: "Testić",
          jmbg: "1101900123456",
          datumRodjenja: "1900-01-11",
          email: "test@test.ba",
          pristupnaSifra: "Test@123",
          brojKnjizice: "123456789",
        })
      ).rejects.toMatchObject({
        status: 409,
        poruka: "Korisnik sa ovim emailom je već registrovan.",
      });
    });

    it("baca 409 za duplikat JMBG-a", async () => {
      vi.mocked(prismaMock.korisnik.findUnique)
        .mockResolvedValueOnce(null) // email ne postoji
        .mockResolvedValueOnce({ id: 2, jmbgHash: "hash" } as any); // JMBG postoji

      await expect(
        registracijaService({
          ime: "Test",
          prezime: "Testić",
          jmbg: "1101900123456",
          datumRodjenja: "1900-01-11",
          email: "novi@test.ba",
          pristupnaSifra: "Test@123",
          brojKnjizice: "123456789",
        })
      ).rejects.toMatchObject({
        status: 409,
        poruka: "Korisnik sa ovim JMBG je već registrovan.",
      });
    });

    it("baca 409 za duplikat broja knjižice", async () => {
      vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(null);
      vi.mocked(prismaMock.pacijent.findUnique).mockResolvedValue({
        id: 2,
        brojKnjiziceHash: "hash",
      } as any);

      await expect(
        registracijaService({
          ime: "Test",
          prezime: "Testić",
          jmbg: "1101900123456",
          datumRodjenja: "1900-01-11",
          email: "novi@test.ba",
          pristupnaSifra: "Test@123",
          brojKnjizice: "123456789",
        })
      ).rejects.toMatchObject({
        status: 409,
        poruka: "Broj zdravstvene knjižice je već registrovan.",
      });
    });
  });

  // ─── DB greške i neočekivani statusi ───────────────────────────────────
  describe("Propagacija DB grešaka (next poziv)", () => {
    it("getSlobodniTermini — propagira DB grešku putem next", async () => {
      const greska = new Error("Connection timeout");
      vi.mocked(prismaMock.termin.findMany).mockRejectedValue(greska);

      const { req, res, next } = mockReqRes({}, { doktorId: "2" });
      await getSlobodniTermini(req, res, next);

      expect(next).toHaveBeenCalledWith(greska);
      expect(res.json).not.toHaveBeenCalled();
    });

    it("getTerminById — propagira grešku putem next", async () => {
      const greska = new Error("Prisma error");
      vi.mocked(prismaMock.termin.findUnique).mockRejectedValue(greska);

      const { req, res, next } = mockReqRes({ id: "5" });
      await getTerminById(req, res, next);

      expect(next).toHaveBeenCalledWith(greska);
      expect(res.json).not.toHaveBeenCalled();
    });

    it("zaključajTermin — propagira Redis grešku putem next", async () => {
      const greska = new Error("Redis unavailable");
      vi.mocked(redisMock.get).mockRejectedValue(greska);

      const { req, res, next } = mockReqRes({ id: "5" }, {}, {}, { id: 1, uloga: "PACIJENT" });
      await zaključajTermin(req, res, next);

      expect(next).toHaveBeenCalledWith(greska);
      expect(res.json).not.toHaveBeenCalled();
    });

    it("oslobodiTermin — propagira Redis grešku putem next", async () => {
      const greska = new Error("Redis unavailable");
      vi.mocked(redisMock.del).mockRejectedValue(greska);

      const { req, res, next } = mockReqRes({ id: "5" });
      await oslobodiTermin(req, res, next);

      expect(next).toHaveBeenCalledWith(greska);
      expect(res.json).not.toHaveBeenCalled();
    });

    it("otkaziRezervacijuPacijent — propagira transakcijsku grešku", async () => {
      const greska = new Error("Deadlock detected");
      vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(pacijentMock as any);
      vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue({
        id: 1,
        idPacijent: 10,
        idTermina: 5,
        termin: { id: 5, datum: new Date(Date.now() + 48 * 60 * 60 * 1000) },
        pacijent: { korisnik: { email: "test@test.com" } },
      } as any);
      vi.mocked(prismaMock.$transaction).mockRejectedValue(greska);

      const { req, res, next } = mockReqRes({ id: "1" }, {}, {}, { id: 1, uloga: "PACIJENT" });
      await otkaziRezervacijuPacijent(req, res, next);

      expect(next).toHaveBeenCalledWith(greska);
    });
  });

  // ─── Nepostojeći resursi (404) ─────────────────────────────────────────
  describe("Nepostojeći resursi", () => {
    it("getTerminById — vraća 404 za nepostojeći termin", async () => {
      vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(null);

      const { req, res, next } = mockReqRes({ id: "99999" });
      await getTerminById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Termin nije pronađen." });
      expect(next).not.toHaveBeenCalled();
    });

    it("kreirajRezervaciju — vraća 404 za nepostojeći termin", async () => {
      vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(pacijentMock as any);
      vi.mocked(prismaMock.termin.findUnique).mockResolvedValue(null);

      const { req, res, next } = mockReqRes({}, {}, { terminId: 99999, doktorId: 2 });
      await kreirajRezervaciju(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Termin nije pronađen." });
      expect(next).not.toHaveBeenCalled();
    });

    it("dodajKomentar — vraća 404 za nepostojeću rezervaciju", async () => {
      vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(null);

      const { req, res, next } = mockReqRes({ id: "99999" }, {}, { komentar: "Test" });
      await dodajKomentar(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija nije pronađena." });
      expect(next).not.toHaveBeenCalled();
    });

    it("getKomentari — vraća 404 za nepostojeću rezervaciju", async () => {
      vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(null);

      const { req, res, next } = mockReqRes({ id: "99999" });
      await getKomentari(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija nije pronađena." });
      expect(next).not.toHaveBeenCalled();
    });

    it("otkaziRezervacijuPacijent — vraća 404 za nepostojeću rezervaciju", async () => {
      vi.mocked(prismaMock.pacijent.findFirst).mockResolvedValue(pacijentMock as any);
      vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(null);

      const { req, res, next } = mockReqRes({ id: "99999" }, {}, {}, { id: 1, uloga: "PACIJENT" });
      await otkaziRezervacijuPacijent(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija nije pronađena." });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("otkaziRezervacijuOsoblje — vraća 404 za nepostojeću rezervaciju", async () => {
      vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(null);

      const { req, res, next } = mockReqRes({ id: "99999" });
      await otkaziRezervacijuOsoblje(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija nije pronađena." });
      expect(next).not.toHaveBeenCalled();
    });

    it("dodajKomentarDoktor — vraća 404 za nepostojeću rezervaciju", async () => {
      vi.mocked(prismaMock.rezervacije.findUnique).mockResolvedValue(null);

      const { req, res, next } = mockReqRes({ id: "99999" }, {}, { komentar: "Test" }, { id: 1, uloga: "DOKTOR" });
      await dodajKomentarDoktor(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Rezervacija nije pronađena." });
      expect(next).not.toHaveBeenCalled();
    });

    it("kreirajRezervacijuDoktor — vraća 404 za nepostojećeg pacijenta", async () => {
      vi.mocked(prismaMock.pacijent.findUnique).mockResolvedValue(null);

      const { req, res, next } = mockReqRes(
        {},
        {},
        { idTermina: 5, idPacijent: 99999 },
        { id: 1, uloga: "DOKTOR", doktorId: 2 }
      );
      await kreirajRezervacijuDoktor(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ poruka: "Pacijent nije pronađen." });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
