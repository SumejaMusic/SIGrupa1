import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import { redis } from "../lib/redis.js";

// ─── Test korisnici (moraju postojati u bazi) ─────────────────────────────
// Prilagoditi ID-eve prema stvarnim podacima u testnoj bazi
const PACIJENT_ID = "2";
const DOKTOR_ID = "3";
const OSOBLJE_ID = "4";
const ADMIN_ID = "5";

// ─── Test podaci (prilagoditi prema bazi) ─────────────────────────────────
const DOKTOR_ENTITY_ID = 1;         // id u tabeli doktor
const DOKTOR_KORISNIK_ID = 3;       // idKorisnik koji pripada DOKTOR_ENTITY_ID
const REZERVACIJA_PACIJENTA_ID = 1; // rezervacija koja pripada PACIJENT_ID
const REZERVACIJA_DRUGA_ID = 2;     // rezervacija koja NE pripada PACIJENT_ID
const TERMIN_ZA_ZAVRSETAK_ID = 1;   // termin sa statusom ZAKAZAN

// ════════════════════════════════════════════════════════════════════════════
// 1. TERMIN API — US-05, US-12, NFR-22
// ════════════════════════════════════════════════════════════════════════════

describe("GET /api/termini — US-05: Pregled slobodnih termina", () => {
  it("vraća slobodne termine za doktora i datum", async () => {
    const res = await request(app)
      .get("/api/termini")
      .query({ doktorId: DOKTOR_ENTITY_ID, datum: "2026-06-01" });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("vraća praznu listu za doktora koji nema termine", async () => {
    const res = await request(app)
      .get("/api/termini")
      .query({ doktorId: 99999 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("vraća termine bez filtera datuma (svi budući slobodni)", async () => {
    const res = await request(app)
      .get("/api/termini")
      .query({ doktorId: DOKTOR_ENTITY_ID });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("svaki termin ima obavezna polja (id, vrijeme, status, doktor)", async () => {
    const res = await request(app)
      .get("/api/termini")
      .query({ doktorId: DOKTOR_ENTITY_ID });

    expect(res.status).toBe(200);
    if (res.body.length > 0) {
      const termin = res.body[0];
      expect(termin).toHaveProperty("id");
      expect(termin).toHaveProperty("vrijeme");
      expect(termin).toHaveProperty("status");
      expect(termin).toHaveProperty("doktor");
      expect(termin).toHaveProperty("zakljucan");
    }
  });

  it("označava zaključan termin kao zakljucan=true (Redis lock — NFR-22)", async () => {
    const res = await request(app)
      .get("/api/termini")
      .query({ doktorId: DOKTOR_ENTITY_ID });

    if (res.body.length === 0) return;

    const terminId = res.body[0].id;
    await redis.setex(`termin:lock:${terminId}`, 120, "999");

    const res2 = await request(app)
      .get("/api/termini")
      .query({ doktorId: DOKTOR_ENTITY_ID });

    const zakljucan = res2.body.find((t: any) => t.id === terminId);
    expect(zakljucan).toBeDefined();
    expect(zakljucan.zakljucan).toBe(true);
    expect(zakljucan.zakljucaoKorisnikId).toBe(999);
    expect(zakljucan.preostaloSekundi).toBeGreaterThan(0);

    await redis.del(`termin:lock:${terminId}`);
  });

  it("termin koji nije zaključan ima zakljucan=false", async () => {
    const res = await request(app)
      .get("/api/termini")
      .query({ doktorId: DOKTOR_ENTITY_ID });

    if (res.body.length === 0) return;

    const slobodan = res.body.find((t: any) => !t.zakljucan);
    if (slobodan) {
      expect(slobodan.zakljucan).toBe(false);
      expect(slobodan.zakljucaoKorisnikId).toBeNull();
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("GET /api/termini/:id", () => {
  it("vraća termin po ID-u sa svim poljima", async () => {
    const res = await request(app).get("/api/termini/1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", 1);
    expect(res.body).toHaveProperty("status");
    expect(res.body).toHaveProperty("datum");
  });

  it("vraća 404 za nepostojeći termin", async () => {
    const res = await request(app).get("/api/termini/99999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("poruka");
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("POST /api/termini/:id/zakljucaj — US-12, NFR-22: Buffer zona 2 minute", () => {
  it("vraća 401 bez autentifikacije", async () => {
    const res = await request(app).post("/api/termini/1/zakljucaj");
    expect(res.status).toBe(401);
  });

  it("PACIJENT uspješno zaključava slobodan termin na 120 sekundi", async () => {
    await redis.del("termin:lock:1");

    const res = await request(app)
      .post("/api/termini/1/zakljucaj")
      .set("x-test-korisnik-id", PACIJENT_ID);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("poruka");
    expect(res.body).toHaveProperty("ttl", 120);

    const lock = await redis.get("termin:lock:1");
    expect(lock).toBe(PACIJENT_ID);

    await redis.del("termin:lock:1");
  });

  it("vraća 409 ako je termin zaključan od drugog korisnika", async () => {
    await redis.setex("termin:lock:1", 120, "999");

    const res = await request(app)
      .post("/api/termini/1/zakljucaj")
      .set("x-test-korisnik-id", PACIJENT_ID);

    expect(res.status).toBe(409);
    expect(res.body.poruka).toContain("zauzet");

    await redis.del("termin:lock:1");
  });

  it("isti korisnik može osvježiti vlastiti lock (idempotentno)", async () => {
    await redis.setex("termin:lock:1", 60, PACIJENT_ID);

    const res = await request(app)
      .post("/api/termini/1/zakljucaj")
      .set("x-test-korisnik-id", PACIJENT_ID);

    expect(res.status).toBe(200);
    expect(res.body.ttl).toBe(120);

    await redis.del("termin:lock:1");
  });

  it("DOKTOR može zaključati termin", async () => {
    await redis.del("termin:lock:1");

    const res = await request(app)
      .post("/api/termini/1/zakljucaj")
      .set("x-test-korisnik-id", DOKTOR_ID);

    expect(res.status).toBe(200);

    await redis.del("termin:lock:1");
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("POST /api/termini/:id/oslobodi — US-12", () => {
  it("uspješno oslobađa zaključan termin i briše Redis lock", async () => {
    await redis.setex("termin:lock:1", 120, PACIJENT_ID);

    const res = await request(app)
      .post("/api/termini/1/oslobodi")
      .set("x-test-korisnik-id", PACIJENT_ID);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("poruka");

    const lock = await redis.get("termin:lock:1");
    expect(lock).toBeNull();
  });

  it("oslobađanje već slobodnog termina vraća 200 (idempotentno)", async () => {
    const res = await request(app)
      .post("/api/termini/1/oslobodi")
      .set("x-test-korisnik-id", PACIJENT_ID);

    expect(res.status).toBe(200);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. DOKTOR API — US-05: Pregled i pretraga doktora
// ════════════════════════════════════════════════════════════════════════════

describe("GET /api/doktori — US-05: Pregled dostupnih doktora", () => {
  it("vraća listu svih doktora bez filtera", async () => {
    const res = await request(app).get("/api/doktori");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("svaki doktor ima obavezna polja (id, ime, prezime, specijalizacija)", async () => {
    const res = await request(app).get("/api/doktori");

    expect(res.status).toBe(200);
    if (res.body.length > 0) {
      const doktor = res.body[0];
      expect(doktor).toHaveProperty("id");
      expect(doktor).toHaveProperty("ime");
      expect(doktor).toHaveProperty("prezime");
      expect(doktor).toHaveProperty("specijalizacija");
      expect(doktor).toHaveProperty("trajanjePregleda");
    }
  });

  it("filtrira doktore po specijalizaciji (case-insensitive)", async () => {
    // Provjeri da filter radi — rezultat može biti prazan ako nema poklapanja
    const res = await request(app)
      .get("/api/doktori")
      .query({ specijalizacija: "kardiolog" });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((d: any) => {
      expect(d.specijalizacija.toLowerCase()).toContain("kardiolog");
    });
  });

  it("filtrira doktore po odjelId", async () => {
    const res = await request(app)
      .get("/api/doktori")
      .query({ odjelId: 1 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((d: any) => {
      expect(d.odjelId).toBe(1);
    });
  });

  it("vraća praznu listu za nepostojeći odjelId", async () => {
    const res = await request(app)
      .get("/api/doktori")
      .query({ odjelId: 99999 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("GET /api/doktori/:id — US-05: Detalji doktora", () => {
  it("vraća doktora po ID-u sa svim obaveznim poljima", async () => {
    const res = await request(app).get(`/api/doktori/${DOKTOR_ENTITY_ID}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", DOKTOR_ENTITY_ID);
    expect(res.body).toHaveProperty("specijalizacija");
    expect(res.body).toHaveProperty("korisnik");
    expect(res.body.korisnik).toHaveProperty("ime");
    expect(res.body.korisnik).toHaveProperty("prezime");
    expect(res.body.korisnik).toHaveProperty("email");
  });

  it("odgovor sadrži podatke o odjelu", async () => {
    const res = await request(app).get(`/api/doktori/${DOKTOR_ENTITY_ID}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("odjel");
    expect(res.body.odjel).toHaveProperty("id");
    expect(res.body.odjel).toHaveProperty("naziv");
  });

  it("vraća 404 za nepostojećeg doktora", async () => {
    const res = await request(app).get("/api/doktori/99999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("poruka");
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("GET /api/doktori/:id/raspored — US-05, US-06: Raspored doktora", () => {
  it("vraća listu rasporeda za doktora", async () => {
    const res = await request(app).get(`/api/doktori/${DOKTOR_ENTITY_ID}/raspored`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("svaki raspored ima obavezna polja (danUSedmici, vrijemeOd, vrijemeDo)", async () => {
    const res = await request(app).get(`/api/doktori/${DOKTOR_ENTITY_ID}/raspored`);

    expect(res.status).toBe(200);
    if (res.body.length > 0) {
      const raspored = res.body[0];
      expect(raspored).toHaveProperty("danUSedmici");
      expect(raspored).toHaveProperty("vrijemeOd");
      expect(raspored).toHaveProperty("vrijemeDo");
      expect(raspored).toHaveProperty("aktivan");
    }
  });

  it("vraća samo aktivne rasporede (Pravilo 5.11)", async () => {
    const res = await request(app).get(`/api/doktori/${DOKTOR_ENTITY_ID}/raspored`);

    expect(res.status).toBe(200);
    res.body.forEach((r: any) => {
      expect(r.aktivan).toBe(true);
    });
  });

  it("vraća praznu listu za doktora bez rasporeda", async () => {
    const res = await request(app).get("/api/doktori/99999/raspored");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. REZERVACIJA API — US-06, US-09, US-10, US-17, US-21, US-22
// ════════════════════════════════════════════════════════════════════════════

describe("GET /api/rezervacije/moje — Pregled rezervacija pacijenta", () => {
  it("vraća 401 bez autentifikacije", async () => {
    const res = await request(app).get("/api/rezervacije/moje");
    expect(res.status).toBe(401);
  });

  it("PACIJENT dobija listu svojih rezervacija", async () => {
    const res = await request(app)
      .get("/api/rezervacije/moje")
      .set("x-test-korisnik-id", PACIJENT_ID);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("svaka rezervacija ima obavezna polja", async () => {
    const res = await request(app)
      .get("/api/rezervacije/moje")
      .set("x-test-korisnik-id", PACIJENT_ID);

    expect(res.status).toBe(200);
    if (res.body.length > 0) {
      const rez = res.body[0];
      expect(rez).toHaveProperty("id");
      expect(rez).toHaveProperty("termin");
      expect(rez).toHaveProperty("doktor");
    }
  });

  it("MEDICINSKO_OSOBLJE NEMA pristup listi rezervacija pacijenta (RBAC — NFR-06)", async () => {
    const res = await request(app)
      .get("/api/rezervacije/moje")
      .set("x-test-korisnik-id", OSOBLJE_ID);

    expect(res.status).toBe(403);
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("GET /api/rezervacije/doktor/:doktorId — US-11: Dashboard doktora", () => {
  it("vraća 401 bez autentifikacije", async () => {
    const res = await request(app).get(`/api/rezervacije/doktor/${DOKTOR_ENTITY_ID}`);
    expect(res.status).toBe(401);
  });

  it("DOKTOR dobija listu svojih rezervacija", async () => {
    const res = await request(app)
      .get(`/api/rezervacije/doktor/${DOKTOR_ENTITY_ID}`)
      .set("x-test-korisnik-id", DOKTOR_ID);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("PACIJENT NEMA pristup rezervacijama doktora (RBAC — NFR-06)", async () => {
    const res = await request(app)
      .get(`/api/rezervacije/doktor/${DOKTOR_ENTITY_ID}`)
      .set("x-test-korisnik-id", PACIJENT_ID);

    expect(res.status).toBe(403);
  });

  it("svaka doktorova rezervacija sadrži podatke o pacijentu i terminu", async () => {
    const res = await request(app)
      .get(`/api/rezervacije/doktor/${DOKTOR_ENTITY_ID}`)
      .set("x-test-korisnik-id", DOKTOR_ID);

    expect(res.status).toBe(200);
    if (res.body.length > 0) {
      const rez = res.body[0];
      expect(rez).toHaveProperty("termin");
      expect(rez).toHaveProperty("pacijent");
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("PATCH /api/rezervacije/:id/otkazi/pacijent — US-10", () => {
  it("vraća 401 bez autentifikacije", async () => {
    const res = await request(app)
      .patch(`/api/rezervacije/${REZERVACIJA_PACIJENTA_ID}/otkazi/pacijent`);
    expect(res.status).toBe(401);
  });

  it("MEDICINSKO_OSOBLJE NEMA pristup ovoj ruti (RBAC — NFR-06)", async () => {
    const res = await request(app)
      .patch(`/api/rezervacije/${REZERVACIJA_PACIJENTA_ID}/otkazi/pacijent`)
      .set("x-test-korisnik-id", OSOBLJE_ID);

    expect(res.status).toBe(403);
  });

  it("vraća 403 ako pacijent pokušava otkazati tuđu rezervaciju", async () => {
    const res = await request(app)
      .patch(`/api/rezervacije/${REZERVACIJA_DRUGA_ID}/otkazi/pacijent`)
      .set("x-test-korisnik-id", PACIJENT_ID);

    // 403 (tuđa) ili 404 (ne postoji) — oboje su ispravni
    expect([403, 404]).toContain(res.status);
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("PATCH /api/rezervacije/:id/otkazi/osoblje — US-09, US-24", () => {
  it("vraća 401 bez autentifikacije", async () => {
    const res = await request(app)
      .patch(`/api/rezervacije/${REZERVACIJA_PACIJENTA_ID}/otkazi/osoblje`);
    expect(res.status).toBe(401);
  });

  it("PACIJENT NEMA pristup otkazivanju od strane osoblja (RBAC — NFR-06)", async () => {
    const res = await request(app)
      .patch(`/api/rezervacije/${REZERVACIJA_PACIJENTA_ID}/otkazi/osoblje`)
      .set("x-test-korisnik-id", PACIJENT_ID);

    expect(res.status).toBe(403);
  });

  it("vraća 404 za nepostojeću rezervaciju", async () => {
    const res = await request(app)
      .patch("/api/rezervacije/99999/otkazi/osoblje")
      .set("x-test-korisnik-id", OSOBLJE_ID);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("poruka");
  });

  it("MEDICINSKO_OSOBLJE ima pristup otkazivanju termina", async () => {
    const res = await request(app)
      .patch(`/api/rezervacije/${REZERVACIJA_PACIJENTA_ID}/otkazi/osoblje`)
      .set("x-test-korisnik-id", OSOBLJE_ID);

    // 200 (otkazano) ili 400 (već otkazano) — oba su ispravni odgovori
    expect([200, 400]).toContain(res.status);
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("PATCH /api/rezervacije/:id/komentar — US-22", () => {
  it("vraća 401 bez autentifikacije", async () => {
    const res = await request(app)
      .patch(`/api/rezervacije/${REZERVACIJA_PACIJENTA_ID}/komentar`)
      .send({ komentar: "Test komentar" });
    expect(res.status).toBe(401);
  });

  it("PACIJENT NEMA pristup ovom endpointu (RBAC — NFR-06)", async () => {
    const res = await request(app)
      .patch(`/api/rezervacije/${REZERVACIJA_PACIJENTA_ID}/komentar`)
      .set("x-test-korisnik-id", PACIJENT_ID)
      .send({ komentar: "Test komentar" });

    expect(res.status).toBe(403);
  });

  it("DOKTOR uspješno dodaje komentar uz rezervaciju", async () => {
    const res = await request(app)
      .patch(`/api/rezervacije/${REZERVACIJA_PACIJENTA_ID}/komentar`)
      .set("x-test-korisnik-id", DOKTOR_ID)
      .send({ komentar: "Pacijent alergičan na penicilin." });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("komentar", "Pacijent alergičan na penicilin.");
  });

  it("MEDICINSKO_OSOBLJE može dodati komentar", async () => {
    const res = await request(app)
      .patch(`/api/rezervacije/${REZERVACIJA_PACIJENTA_ID}/komentar`)
      .set("x-test-korisnik-id", OSOBLJE_ID)
      .send({ komentar: "Pacijent stigao na vrijeme." });

    expect(res.status).toBe(200);
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("GET /api/rezervacije/:id/komentari — US-21: Pregled komentara (doktor)", () => {
  it("vraća 401 bez autentifikacije", async () => {
    const res = await request(app)
      .get(`/api/rezervacije/${REZERVACIJA_PACIJENTA_ID}/komentari`);
    expect(res.status).toBe(401);
  });

  it("PACIJENT NEMA pristup komentarima putem ove rute (RBAC — NFR-06)", async () => {
    const res = await request(app)
      .get(`/api/rezervacije/${REZERVACIJA_PACIJENTA_ID}/komentari`)
      .set("x-test-korisnik-id", PACIJENT_ID);

    expect(res.status).toBe(403);
  });

  it("DOKTOR dobija listu komentara za termin", async () => {
    const res = await request(app)
      .get(`/api/rezervacije/${REZERVACIJA_PACIJENTA_ID}/komentari`)
      .set("x-test-korisnik-id", DOKTOR_ID);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("svaki komentar ima obavezna polja", async () => {
    const res = await request(app)
      .get(`/api/rezervacije/${REZERVACIJA_PACIJENTA_ID}/komentari`)
      .set("x-test-korisnik-id", DOKTOR_ID);

    expect(res.status).toBe(200);
    if (res.body.length > 0) {
      const komentar = res.body[0];
      expect(komentar).toHaveProperty("id");
      expect(komentar).toHaveProperty("tekst");
      expect(komentar).toHaveProperty("autor");
      expect(komentar).toHaveProperty("datum");
      expect(komentar).toHaveProperty("jeDoktor");
    }
  });

  it("vraća 404 za nepostojeću rezervaciju", async () => {
    const res = await request(app)
      .get("/api/rezervacije/99999/komentari")
      .set("x-test-korisnik-id", DOKTOR_ID);

    expect(res.status).toBe(404);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. PREGLED API — US-11: Završetak pregleda, historija
// ════════════════════════════════════════════════════════════════════════════

describe("POST /api/pregledi/:rezervacijaId/zavrsi — US-11", () => {
  it("vraća 401 bez autentifikacije", async () => {
    const res = await request(app)
      .post(`/api/pregledi/${TERMIN_ZA_ZAVRSETAK_ID}/zavrsi`)
      .send({ dijagnoza: "Grippe", terapija: "Odmor" });

    expect(res.status).toBe(401);
  });

  it("vraća 400 ako dijagnoza nedostaje", async () => {
    const res = await request(app)
      .post(`/api/pregledi/${TERMIN_ZA_ZAVRSETAK_ID}/zavrsi`)
      .set("x-test-korisnik-id", DOKTOR_ID)
      .send({ terapija: "Odmor i tekućine" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("poruka");
  });

  it("vraća 400 ako terapija nedostaje", async () => {
    const res = await request(app)
      .post(`/api/pregledi/${TERMIN_ZA_ZAVRSETAK_ID}/zavrsi`)
      .set("x-test-korisnik-id", DOKTOR_ID)
      .send({ dijagnoza: "Grippe" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("poruka");
  });

  it("vraća 404 za nepostojeću rezervaciju", async () => {
    const res = await request(app)
      .post("/api/pregledi/99999/zavrsi")
      .set("x-test-korisnik-id", DOKTOR_ID)
      .send({ dijagnoza: "Grippe", terapija: "Odmor" });

    expect(res.status).toBe(404);
  });

  it("DOKTOR uspješno završava pregled bez recepta", async () => {
    const res = await request(app)
      .post(`/api/pregledi/${TERMIN_ZA_ZAVRSETAK_ID}/zavrsi`)
      .set("x-test-korisnik-id", DOKTOR_ID)
      .send({ dijagnoza: "Akutni bronhitis", terapija: "Odmor i tekućine, Brufen 400mg" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("poruka");
    expect(res.body).toHaveProperty("historija");
    expect(res.body.historija).toHaveProperty("dijagnoza", "Akutni bronhitis");
  });

  it("DOKTOR uspješno završava pregled S receptom", async () => {
    const res = await request(app)
      .post(`/api/pregledi/${TERMIN_ZA_ZAVRSETAK_ID}/zavrsi`)
      .set("x-test-korisnik-id", DOKTOR_ID)
      .send({
        dijagnoza: "Bakterijska infekcija",
        terapija: "Antibiotici 7 dana",
        recept: {
          nazivLijeka: "Amoksicilin 500mg",
          doza: "3×1 tableta",
          trajanje: 7,
          napomena: "Uzimati uz obrok",
        },
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("recept");
    if (res.body.recept) {
      expect(res.body.recept).toHaveProperty("nazivLijeka");
      expect(res.body.recept).toHaveProperty("doza");
      expect(res.body.recept).toHaveProperty("trajanje", 7);
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────

describe("GET /api/pregledi/:rezervacijaId — Historija pregleda", () => {
  it("vraća 401 bez autentifikacije", async () => {
    const res = await request(app)
      .get(`/api/pregledi/${TERMIN_ZA_ZAVRSETAK_ID}`);
    expect(res.status).toBe(401);
  });

  it("vraća null ako historija pregleda ne postoji", async () => {
    const res = await request(app)
      .get("/api/pregledi/99999")
      .set("x-test-korisnik-id", DOKTOR_ID);

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it("DOKTOR dobija historiju pregleda sa receptima i nalazima", async () => {
    const res = await request(app)
      .get(`/api/pregledi/${TERMIN_ZA_ZAVRSETAK_ID}`)
      .set("x-test-korisnik-id", DOKTOR_ID);

    expect(res.status).toBe(200);
    if (res.body) {
      expect(res.body).toHaveProperty("dijagnoza");
      expect(res.body).toHaveProperty("terapija");
      expect(res.body).toHaveProperty("recepti");
      expect(Array.isArray(res.body.recepti)).toBe(true);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. RBAC — Role-based access control
// NFR-06: Pristup samo dozvoljenoj sadržini
// NFR-07: RBAC implementiran za sve uloge
// ════════════════════════════════════════════════════════════════════════════

describe("RBAC — Matrica pristupa po ulogama (NFR-06, NFR-07)", () => {
  it("neprijavljeni korisnik dobija 401 na zaštićenim rutama", async () => {
    const rute = [
      { method: "get",   path: "/api/rezervacije/moje" },
      { method: "post",  path: "/api/termini/1/zakljucaj" },
      { method: "patch", path: "/api/rezervacije/1/otkazi/pacijent" },
      { method: "patch", path: "/api/rezervacije/1/komentar" },
    ];

    for (const ruta of rute) {
      const res = await (request(app) as any)[ruta.method](ruta.path);
      expect(res.status).toBe(401);
    }
  });

  it("PACIJENT ne može pristupiti doktorskim rutama", async () => {
    const zabranjeneRute = [
      { method: "get",   path: `/api/rezervacije/doktor/${DOKTOR_ENTITY_ID}` },
      { method: "patch", path: "/api/rezervacije/1/komentar" },
      { method: "get",   path: "/api/rezervacije/1/komentari" },
      { method: "patch", path: "/api/rezervacije/1/otkazi/osoblje" },
    ];

    for (const ruta of zabranjeneRute) {
      const res = await (request(app) as any)
        [ruta.method](ruta.path)
        .set("x-test-korisnik-id", PACIJENT_ID);

      expect(res.status).toBe(403);
    }
  });

  it("MEDICINSKO_OSOBLJE ne može pristupiti rutama rezerviranim za pacijenta", async () => {
    const zabranjeneRute = [
      { method: "get",   path: "/api/rezervacije/moje" },
      { method: "patch", path: "/api/rezervacije/1/otkazi/pacijent" },
    ];

    for (const ruta of zabranjeneRute) {
      const res = await (request(app) as any)
        [ruta.method](ruta.path)
        .set("x-test-korisnik-id", OSOBLJE_ID);

      expect(res.status).toBe(403);
    }
  });

  it("ADMINISTRATOR ima pristup i doktorskim i pacijentskim rutama", async () => {
    const dozvoljeneRute = [
      { method: "get", path: "/api/rezervacije/moje" },
      { method: "get", path: `/api/rezervacije/doktor/${DOKTOR_ENTITY_ID}` },
      { method: "get", path: "/api/rezervacije/1/komentari" },
    ];

    for (const ruta of dozvoljeneRute) {
      const res = await (request(app) as any)
        [ruta.method](ruta.path)
        .set("x-test-korisnik-id", ADMIN_ID);

      // 200 (ok) ili 404 (ne postoji) — oba znače da je RBAC propustio zahtjev
      expect([200, 404]).toContain(res.status);
    }
  });
});

// ─── Čišćenje Redis ključeva nakon svih testova ────────────────────────────
afterAll(async () => {
  await redis.del("termin:lock:1");
  await redis.del("termin:lock:2");
});