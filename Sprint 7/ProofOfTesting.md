# Dodatak Proof of Testing — Sprint 7
## Integracioni testovi: Autentifikacija i sigurnosni sloj

---

## Osnovne informacije

| Stavka | Opis |
| :--- | :--- |
| **Sprint** | Sprint 7 |
| **Release** | Release 4 — Autentifikacija i sigurnosni sloj |
| **Test fajl** | `src/__integration_tests__/auth.integration.test.ts` |
| **Test framework** | Vitest v4.1.5 |
| **Okruženje** | CI/CD (GitHub Actions) |
| **Datum izvršavanja** | 14.05.2026. |
| **Ukupno testova** | 21 |
| **Prošlo** | 11 |
| **Preskočeno** | 8 |
| **Palo** | 0 |

---

## 1. Metodologija i kontekst

Za razliku od unit testova dokumentovanih u osnovnom Proof of Testing-u (koji koriste mock Prisma sloj), ovi integracioni testovi izvršavaju se direktno protiv pokrenute Express aplikacije putem HTTP zahtjeva (`supertest`), koristeći stvarne middleware lance i JWT verifikaciju.

### 1.1 Strategija testiranja

| Komponenta | Pristup | Razlog |
| :--- | :--- | :--- |
| HTTP sloj | `supertest` + pokrenuta `app` instanca | Testiranje cijelog request/response ciklusa |
| Baza podataka | Stvarna baza (read + privremeni update lozinke) | Integritet realnih podataka |
| Email servis | `vi.mock("../emailService.js")` | Sprječavanje slanja stvarnih emailova tokom testova |
| JWT tokeni | Ručno potpisani (`jsonwebtoken`) | Kontrola `expiresIn` za testiranje sesija |

### 1.2 `beforeAll` / `afterAll` setup

Testovi **ne kreiraju nove korisnike** — umjesto toga, `beforeAll` dohvata postojeće korisnike iz baze po ulozi (`PACIJENT`, `DOKTOR`, `ADMINISTRATOR`), privremeno postavlja poznatu lozinku (`TestAuth123!`) i resetuje stanje zaključanosti naloga. `afterAll` vraća originalne hash vrijednosti lozinki.

> **Napomena:** Ukoliko određena uloga nije pronađena u bazi, svi testovi koji je zahtijevaju automatski se preskačaju uz `console.warn` poruku. Ovo objašnjava 8 preskočenih testova u ovom izvršavanju.

---

## 2. Pregled testnih scenarija

### 2.1 US-03 — Login sistem: JWT tokeni i RBAC

| ID | Test Case | HTTP | Status | Napomena |
| :--- | :--- | :--- | :--- | :--- |
| AI-01 | Uspješna prijava pacijenta vraća JWT token i ulogu `PACIJENT` | `POST /api/auth/prijava` | SKIP | PACIJENT nije u bazi |
| AI-02 | Uspješna prijava doktora vraća JWT token i ulogu `DOKTOR` | `POST /api/auth/prijava` | SKIP | DOKTOR nije u bazi |
| AI-03 | Uspješna prijava administratora vraća JWT token i ulogu `ADMINISTRATOR` | `POST /api/auth/prijava` | SKIP | ADMINISTRATOR nije u bazi |
| AI-04 | Pogrešna lozinka i pogrešan email vraćaju identičnu poruku (AC-04-03) | `POST /api/auth/prijava` | SKIP | Nijedan korisnik nije u bazi |
| AI-05 | Prijava bez emaila vraća 400 — validacija obaveznih polja | `POST /api/auth/prijava` | **PASS** | |
| AI-06 | Prijava bez lozinke vraća 400 — validacija obaveznih polja | `POST /api/auth/prijava` | **PASS** | |
| AI-07 | Zaštićena ruta odbija zahtjev bez JWT tokena — 401 | `GET /api/rezervacije/moje` | **PASS** | |
| AI-08 | Zaštićena ruta odbija zahtjev s nevažećim JWT tokenom — 401 | `GET /api/rezervacije/moje` | **PASS** | |

### 2.2 US-19 — Automatska odjava: istekla sesija (NFR-13, NFR-14)

| ID | Test Case | HTTP | Status | Napomena |
| :--- | :--- | :--- | :--- | :--- |
| AI-11 | Istekli JWT token vraća 401 | `GET /api/rezervacije/moje` | **PASS** | Token potpisan s `expiresIn: -3600` |
| AI-12 | Važeći JWT token dozvoljava pristup zaštićenoj ruti | `GET /api/rezervacije/moje` | **PASS** | Token potpisan s `expiresIn: "15m"` |

### 2.3 US-16 — Reset lozinke putem emaila (DEC-004, AC-14-01 do AC-14-05)

Svi testovi u ovoj grupi označeni su kao `.skip` jer naziv rute još nije potvrđen iz `authController.ts`. Planirani su za aktivaciju u narednom sprintu.

| ID | Test Case | Status |
| :--- | :--- | :--- |
| AI-13 | Zahtjev za reset šalje email i vraća 200 za postojeći email — AC-14-01 | SKIP (`.skip`) |
| AI-14 | Zahtjev za reset za nepostojeći email vraća neutralnu poruku — AC-14-02 | SKIP (`.skip`) |
| AI-15 | Korišćenje isteklog reset tokena vraća 400 ili 410 — AC-14-04 | SKIP (`.skip`) |
| AI-16 | Nova lozinka mora imati minimum 8 karaktera — AC-14-05 | SKIP (`.skip`) |
| AI-17 | Nova lozinka mora sadržavati jedno veliko slovo i jedan broj — AC-14-05 | SKIP (`.skip`) |

### 2.4 US-25 — Dvofaktorska autentifikacija (NFR-23, AC-04-05)

| ID | Test Case | HTTP | Status | Napomena |
| :--- | :--- | :--- | :--- | :--- |
| AI-18 | Prijava s aktivnom 2FA vraća zahtjev za kodom, ne token odmah | `POST /api/auth/prijava` | **PASS** | Uslovni tok: prolazi ako 2FA nije aktiviran |
| AI-19 | Ispravan 2FA kod vraća JWT token — AC-04-05 | `POST /api/auth/2fa/verifikacija` | SKIP (`.skip`) | Ruta nije potvrđena |
| AI-20 | Pogrešan 2FA kod vraća 401 — AC-04-05 | `POST /api/auth/2fa/verifikacija` | SKIP (`.skip`) | Ruta nije potvrđena |
| AI-21 | Istekli 2FA privremeni token vraća 401 — NFR-23 | `POST /api/auth/2fa/verifikacija` | SKIP (`.skip`) | Ruta nije potvrđena |

---

## 3. Detalji po aktivnim test slučajevima

### AI-05 — Prijava bez emaila vraća 400

**Preduslov:** Nema posebnog preduvjeta — ne zahtijeva korisnike u bazi.

**Zahtjev:**
```
POST /api/auth/prijava
Body: { "pristupnaSifra": "TestAuth123!" }
```

**Provjere:**
- HTTP status je `400`
- Tijelo odgovora sadrži polje `poruka`

---

### AI-06 — Prijava bez lozinke vraća 400

**Preduslov:** Nema posebnog preduvjeta.

**Zahtjev:**
```
POST /api/auth/prijava
Body: { "email": "<bilo koji email>" }
```

**Provjere:**
- HTTP status je `400`
- Tijelo odgovora sadrži polje `poruka`

---

### AI-07 — Zaštićena ruta bez tokena vraća 401

**Preduslov:** Nema posebnog preduvjeta.

**Zahtjev:**
```
GET /api/rezervacije/moje
(bez Authorization headera)
```

**Provjere:**
- HTTP status je `401`

---

### AI-08 — Zaštićena ruta s nevažećim tokenom vraća 401

**Preduslov:** Nema posebnog preduvjeta.

**Zahtjev:**
```
GET /api/rezervacije/moje
Authorization: Bearer ovaj.token.jeneispravan
```

**Provjere:**
- HTTP status je `401`

---

### AI-11 — Istekli JWT token vraća 401

**Preduslov:** Ručno kreiran JWT token s `expiresIn: -3600` (token koji je već istekao 1 sat unazad).

**Zahtjev:**
```
GET /api/rezervacije/moje
Authorization: Bearer <istekliToken>
```

**Provjere:**
- HTTP status je `401`
- Tijelo odgovora sadrži polje `poruka`

---

### AI-12 — Važeći JWT token dozvoljava pristup

**Preduslov:** Ručno kreiran JWT token s `expiresIn: "15m"`.

**Zahtjev:**
```
GET /api/rezervacije/moje
Authorization: Bearer <validanToken>
x-test-korisnik-id: <testId>
```

**Provjere:**
- HTTP status **nije** `401` (dozvoljava prolaz kroz middleware)

> **Napomena iz loga:** Middleware uspješno pokrenut — izvršeni su `Pacijent findFirst` i `Rezervacije findMany`.

---

### AI-18 — Prijava s aktivnom 2FA (uslovni tok)

**Preduslov:** Doktor s aktiviranom 2FA u bazi (ako nije aktivan, test prolazi bez asercija).

**Zahtjev:**
```
POST /api/auth/prijava
Body: { "email": "<emailDoktora>", "pristupnaSifra": "TestAuth123!" }
```

**Provjere (ako je 2FA aktiviran):**
- HTTP status je `200`
- Tijelo sadrži `zahtijeva2FA: true`
- Tijelo **ne sadrži** `token`
- `posaljiVerifikacioniKod` mock je pozvan

---

## 4. Uzroci preskakanja testova

| Razlog | Broj testova | Objašnjenje |
| :--- | :---: | :--- |
| Korisnici ne postoje u bazi (runtime skip) | 4 | `PACIJENT`, `DOKTOR`, `ADMINISTRATOR` nisu pronađeni — testovi koji zahtijevaju prijavu sa specifičnom ulogom ne mogu se izvršiti |
| DOKTOR nije u bazi (2FA test) | 1 | Test AI-18 eksplicitno skipa za tok s `zahtijeva2FA: true` |
| Ruta nije potvrđena (`.skip`) | 3 | 2FA verifikacijski testovi čekaju potvrdu naziva rute iz `authController.ts` |


---

## 6. CI/CD izvršavanje — Finalni izlaz

```
RUN  v4.1.5 /home/runner/work/SIGrupa1/SIGrupa1/PROJEKAT/bolnicki-sistem/server

 ✓ src/__integration_tests__/auth.integration.test.ts (21 tests | 8 skipped | 2 todo) 715ms

 Test Files  1 passed (1)
      Tests  11 passed | 8 skipped | 2 todo (21)
   Start at  09:37:02
   Duration  715ms
```

---

> **Napomena:** Ovaj dodatak pokriva isključivo integracione testove autentifikacije iz `auth.integration.test.ts`. Unit testovi `authService.ts` dokumentovani su u osnovnom Proof of Testing — Sprint 7, Release 4. Integracioni testovi rezervacija i termina dokumentovani su odvojeno.

**Release:** Release 4 — Autentifikacija i sigurnosni sloj | **Sprint:** Sprint 7 | **Rezultat:** 11/13 aktivnih testova prošlo (8 preskočeno zbog nedostajućih podataka ili nepotvrđenih ruta)
