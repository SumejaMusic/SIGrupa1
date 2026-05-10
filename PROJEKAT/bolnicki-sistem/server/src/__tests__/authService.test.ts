import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcrypt";
import { prismaMock } from "../lib/__mocks__/prisma.js";
import { prijavaService } from "../authService.js";

vi.mock("../lib/prisma.js");
vi.mock("../lib/encryption.js", () => ({
  enkriptuj: (vrijednost: string) => `enc:${vrijednost}`,
}));

const ISPRAVNA_LOZINKA = "Ispravna123!";

const napraviKorisnika = async (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  jmbg: "enc-jmbg",
  jmbgHash: "jmbg-hash",
  ime: "Ana",
  prezime: "Test",
  datumRodjenja: new Date("1995-01-01"),
  email: "ana@test.ba",
  pristupnaSifra: await bcrypt.hash(ISPRAVNA_LOZINKA, 4),
  brojTelefona: null,
  datumRegistracije: new Date("2026-01-01"),
  brojNeuspjelihPrijava: 0,
  nalogZakljucan: false,
  vrijemeZakljucavanja: null,
  zadnjiNeuspjeliPokusaj: null,
  uloga: "PACIJENT",
  ...overrides,
});

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret";
  (prismaMock.$transaction as any).mockImplementation(async (callbackOrQueries: any) => {
    if (typeof callbackOrQueries === "function") {
      return callbackOrQueries(prismaMock);
    }

    return Promise.all(callbackOrQueries);
  });
});

describe("prijavaService - US-26 detekcija neobicnog ponasanja", () => {
  it("povecava broj neuspjelih prijava kada je lozinka pogresna", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(
      (await napraviKorisnika({ brojNeuspjelihPrijava: 2 })) as any
    );

    await expect(
      prijavaService({ email: "ana@test.ba", pristupnaSifra: "Pogresna123!" })
    ).rejects.toMatchObject({ status: 401 });

    expect(prismaMock.korisnik.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({
          brojNeuspjelihPrijava: 3,
          nalogZakljucan: false,
          zadnjiNeuspjeliPokusaj: expect.any(Date),
        }),
      })
    );
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipAkcije: "LOGIN_NEUSPJESAN",
          izmenjenaTabela: "Korisnik",
        }),
      })
    );
  });

  it("vraca upozorenje na cetvrtom neuspjelom pokusaju", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(
      (await napraviKorisnika({ brojNeuspjelihPrijava: 3 })) as any
    );

    await expect(
      prijavaService({ email: "ana@test.ba", pristupnaSifra: "Pogresna123!" })
    ).rejects.toMatchObject({
      status: 401,
      kod: "LOGIN_ATTEMPT_WARNING",
    });

    expect(prismaMock.korisnik.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          brojNeuspjelihPrijava: 4,
          nalogZakljucan: false,
        }),
      })
    );
  });

  it("zakljucava nalog na petom neuspjelom pokusaju", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(
      (await napraviKorisnika({ brojNeuspjelihPrijava: 4 })) as any
    );

    await expect(
      prijavaService({ email: "ana@test.ba", pristupnaSifra: "Pogresna123!" })
    ).rejects.toMatchObject({
      status: 423,
      kod: "ACCOUNT_LOCKED",
    });

    expect(prismaMock.korisnik.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({
          brojNeuspjelihPrijava: 5,
          nalogZakljucan: true,
          vrijemeZakljucavanja: expect.any(Date),
        }),
      })
    );
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipAkcije: "LOGIN_NALOG_ZAKLJUCAN",
        }),
      })
    );
  });

  it("odbija prijavu vec zakljucanog naloga", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(
      (await napraviKorisnika({
        brojNeuspjelihPrijava: 5,
        nalogZakljucan: true,
        vrijemeZakljucavanja: new Date("2026-05-10"),
      })) as any
    );

    await expect(
      prijavaService({ email: "ana@test.ba", pristupnaSifra: ISPRAVNA_LOZINKA })
    ).rejects.toMatchObject({
      status: 423,
      kod: "ACCOUNT_LOCKED",
    });

    expect(prismaMock.korisnik.update).not.toHaveBeenCalled();
  });

  it("resetuje broj neuspjelih prijava nakon uspjesne prijave", async () => {
    vi.mocked(prismaMock.korisnik.findUnique).mockResolvedValue(
      (await napraviKorisnika({ brojNeuspjelihPrijava: 2 })) as any
    );

    const rezultat = await prijavaService({
      email: "ana@test.ba",
      pristupnaSifra: ISPRAVNA_LOZINKA,
    });

    expect(rezultat).toEqual(
      expect.objectContaining({
        id: 1,
        email: "ana@test.ba",
        token: expect.any(String),
      })
    );
    expect(prismaMock.korisnik.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({
          brojNeuspjelihPrijava: 0,
          nalogZakljucan: false,
          vrijemeZakljucavanja: null,
          zadnjiNeuspjeliPokusaj: null,
        }),
      })
    );
  });
});
