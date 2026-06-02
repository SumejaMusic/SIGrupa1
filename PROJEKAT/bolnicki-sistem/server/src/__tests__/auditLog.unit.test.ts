/**
 * Unit testovi — formatirajDetaljeAkcije
 * Alat: Vitest
 */

import { describe, it, expect } from "vitest";
import { formatirajDetaljeAkcije } from "../controllers/adminController.js";

// ─── Bazni log objekat koji se override-uje po potrebi ───────────────────────

const bazniLog = {
  idKorisnika: 1,
  tipAkcije: "UPDATE",
  izmenjenaTabela: "Korisnik",
  vrijemeAkcije: new Date(),
  korisnik: { ime: "Admin", prezime: "Testović", uloga: "ADMIN" },
  stariPodaci: {},
  noviPodaci: {},
};

// ─────────────────────────────────────────────────────────────────────────────

describe("formatirajDetaljeAkcije", () => {

  // ── null / undefined guard ────────────────────────────────────────────────

  it("vraća fallback poruku kad je log null", () => {
    expect(formatirajDetaljeAkcije(null)).toBe("Nema podataka o akciji.");
  });

  it("vraća fallback poruku kad je log undefined", () => {
    expect(formatirajDetaljeAkcije(undefined)).toBe("Nema podataka o akciji.");
  });

  // ── Korisnik bez objekta (samo idKorisnika) ───────────────────────────────

  it("prikazuje ID korisnika kad korisnik objekat nije dostupan", () => {
    const log = {
      ...bazniLog,
      korisnik: null,
      tipAkcije: "DELETE",
      stariPodaci: { id: 5 },
    };
    const rezultat = formatirajDetaljeAkcije(log);
    expect(rezultat).toContain("1"); // idKorisnika
  });

  // ── PROMJENA_ULOGE ────────────────────────────────────────────────────────

  describe("PROMJENA_ULOGE", () => {
    it("sadrži staru i novu ulogu te ime korisnika", () => {
      const log = {
        ...bazniLog,
        tipAkcije: "PROMJENA_ULOGE",
        stariPodaci: { uloga: "PACIJENT" },
        noviPodaci: { uloga: "DOKTOR", ime: "Mirza", prezime: "Hodžić" },
      };
      const rezultat = formatirajDetaljeAkcije(log);
      expect(rezultat).toContain("PACIJENT");
      expect(rezultat).toContain("DOKTOR");
      expect(rezultat).toContain("Mirza");
      expect(rezultat).toContain("Hodžić");
    });

    it("prikazuje NEPOZNATO kad uloga nedostaje u stariPodaci i noviPodaci", () => {
      const log = {
        ...bazniLog,
        tipAkcije: "PROMJENA_ULOGE",
        stariPodaci: {},
        noviPodaci: {},
      };
      const rezultat = formatirajDetaljeAkcije(log);
      expect(rezultat).toContain("NEPOZNATO");
    });
  });

  // ── BLOKIRANJE_NALOGA ─────────────────────────────────────────────────────

  describe("BLOKIRANJE_NALOGA", () => {
    it("sadrži ključnu riječ BLOKIRAO i ime blokiranog korisnika", () => {
      const log = {
        ...bazniLog,
        tipAkcije: "BLOKIRANJE_NALOGA",
        stariPodaci: { nalogZakljucan: false },
        noviPodaci: { nalogZakljucan: true, ime: "Amra", prezime: "Testić" },
      };
      const rezultat = formatirajDetaljeAkcije(log);
      expect(rezultat).toContain("BLOKIRAO");
      expect(rezultat).toContain("Amra");
      expect(rezultat).toContain("Testić");
    });

    it("radi i bez imena u noviPodaci (ne baca grešku)", () => {
      const log = {
        ...bazniLog,
        tipAkcije: "BLOKIRANJE_NALOGA",
        stariPodaci: { nalogZakljucan: false },
        noviPodaci: { nalogZakljucan: true },
      };
      expect(() => formatirajDetaljeAkcije(log)).not.toThrow();
      expect(formatirajDetaljeAkcije(log)).toContain("BLOKIRAO");
    });
  });

  // ── DEBLOKIRANJE_NALOGA ───────────────────────────────────────────────────

  describe("DEBLOKIRANJE_NALOGA", () => {
    it("sadrži ključnu riječ ODBLOKIRAO i ime korisnika", () => {
      const log = {
        ...bazniLog,
        tipAkcije: "DEBLOKIRANJE_NALOGA",
        stariPodaci: { nalogZakljucan: true },
        noviPodaci: { nalogZakljucan: false, ime: "Amra", prezime: "Testić" },
      };
      const rezultat = formatirajDetaljeAkcije(log);
      expect(rezultat).toContain("ODBLOKIRAO");
      expect(rezultat).toContain("Amra");
    });
  });

  // ── DELETE ────────────────────────────────────────────────────────────────

  describe("DELETE", () => {
    it("sadrži naziv tabele i serijalizirane obrisane podatke", () => {
      const log = {
        ...bazniLog,
        tipAkcije: "DELETE",
        izmenjenaTabela: "Korisnik",
        stariPodaci: { id: 5, email: "brisan@test.com" },
        noviPodaci: {},
      };
      const rezultat = formatirajDetaljeAkcije(log);
      expect(rezultat).toContain("Korisnik");
      expect(rezultat).toContain("brisan@test.com");
    });
  });

  // ── UPDATE ────────────────────────────────────────────────────────────────

  describe("UPDATE", () => {
    it("prikazuje konkretne izmjene kad su polja promijenjena", () => {
      const log = {
        ...bazniLog,
        tipAkcije: "UPDATE",
        stariPodaci: { ime: "Staro", email: "staro@test.com" },
        noviPodaci: { ime: "Novo", email: "novo@test.com" },
      };
      const rezultat = formatirajDetaljeAkcije(log);
      expect(rezultat).toContain("Staro");
      expect(rezultat).toContain("Novo");
      expect(rezultat).toContain("staro@test.com");
      expect(rezultat).toContain("novo@test.com");
    });

    it("prikazuje poruku 'nisu mijenjane' kad su vrijednosti identične", () => {
      const log = {
        ...bazniLog,
        tipAkcije: "UPDATE",
        stariPodaci: { ime: "Isti" },
        noviPodaci: { ime: "Isti" },
      };
      const rezultat = formatirajDetaljeAkcije(log);
      expect(rezultat).toContain("vrijednosti polja nisu mijenjane");
    });

    it("prikazuje profilPodaci unutar poruke kad postoje", () => {
      const log = {
        ...bazniLog,
        tipAkcije: "UPDATE",
        stariPodaci: { ime: "Test" },
        noviPodaci: {
          ime: "Test",
          profilPodaci: { specijalizacija: "Kardiologija" },
        },
      };
      const rezultat = formatirajDetaljeAkcije(log);
      expect(rezultat).toContain("Kardiologija");
    });

    it("ne uključuje ključ profilPodaci u listu izmjena direktno", () => {
      const log = {
        ...bazniLog,
        tipAkcije: "UPDATE",
        stariPodaci: {},
        noviPodaci: { profilPodaci: { nesto: "vrijdnost" } },
      };
      const rezultat = formatirajDetaljeAkcije(log);
      // Ne smije biti u formatu "[profilPodaci]: sa ..."
      expect(rezultat).not.toMatch(/\[profilPodaci\]: sa/);
    });
  });

  // ── UPSERT ────────────────────────────────────────────────────────────────

  describe("UPSERT", () => {
    it("sadrži naziv tabele i serijalizirane nove detalje", () => {
      const log = {
        ...bazniLog,
        tipAkcije: "UPSERT",
        izmenjenaTabela: "RasporedDoktora",
        stariPodaci: {},
        noviPodaci: { idDoktor: 1, danUSedmici: "PONEDJELJAK" },
      };
      const rezultat = formatirajDetaljeAkcije(log);
      expect(rezultat).toContain("RasporedDoktora");
      expect(rezultat).toContain("PONEDJELJAK");
    });
  });

  // ── Default grana (nepoznata akcija) ──────────────────────────────────────

  describe("nepoznata akcija", () => {
    it("generički ispis sadrži naziv akcije i tabele", () => {
      const log = {
        ...bazniLog,
        tipAkcije: "CUSTOM_AKCIJA",
        izmenjenaTabela: "NekaTabela",
        stariPodaci: { a: 1 },
        noviPodaci: { b: 2 },
      };
      const rezultat = formatirajDetaljeAkcije(log);
      expect(rezultat).toContain("CUSTOM_AKCIJA");
      expect(rezultat).toContain("NekaTabela");
    });
  });
});