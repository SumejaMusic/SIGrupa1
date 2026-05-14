# Proof of Testing

# Testni slučajevi za modul Registracije korisnika

**Modul:** Registracija korisnika  
**Verzija dokumenta:** 1.2 — Ažurirano nakon izvršenja unit testova  
**API Endpoint:** `POST /api/auth/registracija`  
**Test framework:** Vitest v4.1.5  
**Rezultat:** Uspješno  
- Unit testovi: 22/22 prošlo  

---

## 1. Unit testiranje

Unit testovi provjeravaju ponašanje funkcije `registrujSe` na nivou kontrolera/servisa uz mockovanu bazu podataka, mockovanu enkripciju i mockovano hashiranje lozinke. Testovi ne koriste stvarnu bazu, nego `prismaMock`, čime se izolovano provjerava validacija, dodjela uloge, provjera jedinstvenosti i obrada grešaka.

**Izvršeno:** 13.05.2026.  
**Komanda:** `npm test -- --run src/__tests__/registration.test.ts`  
**Rezultat:** Uspješno — 22/22 testova prošlo  
**Trajanje:** 882ms  

| ID testa | Nivo testiranja | Naziv testa | Preduslovi | Testni koraci | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|---|---|
| UT-REG-001 | Unit | Vraća 201 i registrovanog korisnika kada su podaci validni | Mockovana Prisma baza, validni podaci dostupni | Pozvati `registrujSe` sa validnim podacima | Validni podaci korisnika Amina Hodžić | Status 201, vraćen registrovani korisnik, poruka o uspješnoj registraciji i potrebi email verifikacije | Uspješno |
| UT-REG-002 | Unit | Dodjeljuje ulogu PACIJENT novom korisniku | Mockovana Prisma transakcija | Pozvati `registrujSe` i provjeriti odgovor | Validni podaci | Korisnik ima ulogu `PACIJENT` | Uspješno |
| UT-REG-003 | Unit | Dozvoljava registraciju bez broja telefona | Broj telefona je opciono polje | Pozvati `registrujSe` bez `brojTelefona` | Validni podaci bez telefona | Status 201, registracija uspješna | Uspješno |
| UT-REG-004 | Unit | Vraća grešku kada ime nije poslano | Funkcija dostupna | Pozvati `registrujSe` sa praznim imenom | `ime: ""` | Pozvan `next` sa greškom, registracija nije izvršena | Uspješno |
| UT-REG-005 | Unit | Vraća grešku kada prezime nije poslano | Funkcija dostupna | Pozvati `registrujSe` sa praznim prezimenom | `prezime: ""` | Pozvan `next` sa greškom | Uspješno |
| UT-REG-006 | Unit | Vraća grešku kada lozinka nije poslana | Funkcija dostupna | Pozvati `registrujSe` bez lozinke | `pristupnaSifra: ""` | Pozvan `next` sa greškom | Uspješno |
| UT-REG-007 | Unit | Vraća grešku kada JMBG nije poslan | Funkcija dostupna | Pozvati `registrujSe` bez JMBG-a | `jmbg: ""` | Pozvan `next` sa greškom | Uspješno |
| UT-REG-008 | Unit | Vraća grešku kada broj knjižice nije poslan | Funkcija dostupna | Pozvati `registrujSe` bez broja knjižice | `brojKnjizice: ""` | Pozvan `next` sa greškom | Uspješno |
| UT-REG-009 | Unit | Vraća grešku kada ime sadrži brojeve | Funkcija dostupna | Pozvati `registrujSe` sa neispravnim imenom | `ime: "Amina123"` | Pozvan `next` sa greškom | Uspješno |
| UT-REG-010 | Unit | Vraća grešku kada JMBG nema 13 cifara | Funkcija dostupna | Pozvati `registrujSe` sa kraćim JMBG-om | `jmbg: "12345"` | Pozvan `next` sa greškom | Uspješno |
| UT-REG-011 | Unit | Vraća grešku kada JMBG ne odgovara datumu rođenja | Funkcija dostupna | Poslati JMBG i datum koji se ne poklapaju | `jmbg: "1101900123456"`, `datumRodjenja: "2000-05-15"` | Pozvan `next` sa greškom | Uspješno |
| UT-REG-012 | Unit | Vraća grešku kada je datum rođenja u budućnosti | Funkcija dostupna | Poslati budući datum rođenja | `datumRodjenja: "2099-01-01"` | Pozvan `next` sa greškom | Uspješno |
| UT-REG-013 | Unit | Vraća grešku kada lozinka nema veliko slovo | Funkcija dostupna | Poslati lozinku bez velikog slova | `test@123` | Pozvan `next` sa greškom | Uspješno |
| UT-REG-014 | Unit | Vraća grešku kada lozinka nema malo slovo | Funkcija dostupna | Poslati lozinku bez malog slova | `TEST@123` | Pozvan `next` sa greškom | Uspješno |
| UT-REG-015 | Unit | Vraća grešku kada lozinka nema broj | Funkcija dostupna | Poslati lozinku bez broja | `Test@abc` | Pozvan `next` sa greškom | Uspješno |
| UT-REG-016 | Unit | Vraća grešku kada lozinka nema specijalni karakter | Funkcija dostupna | Poslati lozinku bez specijalnog karaktera | `Test1234` | Pozvan `next` sa greškom | Uspješno |
| UT-REG-017 | Unit | Vraća grešku kada je lozinka kraća od 8 karaktera | Funkcija dostupna | Poslati kratku lozinku | `Te@1` | Pozvan `next` sa greškom | Uspješno |
| UT-REG-018 | Unit | Vraća grešku kada broj telefona nije u ispravnom formatu | Funkcija dostupna | Poslati neispravan telefon | `123abc` | Pozvan `next` sa greškom | Uspješno |
| UT-REG-019 | Unit | Vraća grešku kada email već postoji | Mockovana baza vraća postojećeg korisnika | Pozvati `registrujSe` sa postojećim emailom | `amina@test.ba` | Pozvan `next` sa greškom | Uspješno |
| UT-REG-020 | Unit | Vraća grešku kada JMBG već postoji | Mockovana baza vraća postojećeg korisnika po JMBG hash-u | Pozvati `registrujSe` sa postojećim JMBG-om | `1101900123456` | Pozvan `next` sa greškom | Uspješno |
| UT-REG-021 | Unit | Vraća grešku kada broj knjižice već postoji | Mockovana baza vraća postojećeg pacijenta | Pozvati `registrujSe` sa postojećim brojem knjižice | `123456789` | Pozvan `next` sa greškom | Uspješno |
| UT-REG-022 | Unit | Vraća grešku kada baza podataka baci neočekivanu grešku | Mockovana Prisma baza baca grešku | Pozvati `registrujSe` dok baza vraća `Connection lost` | Validni podaci | Pozvan `next` sa greškom, registracija nije izvršena | Uspješno |

---

## Rezultati automatiziranih testova (Vitest)

### Unit testovi — `registration.test.ts`

**Datum izvršenja:** 13.05.2026.  
**Komanda:** `npm test -- --run src/__tests__/registration.test.ts`  
**Ukupno:** Uspješno — 22/22 prošlo  
**Trajanje:** 882ms  

| Grupa testova | Broj testova | Rezultat |
|---|---:|---|
| registrujSe — uspješna registracija | 3 | Uspješno |
| registrujSe — validacija obaveznih polja | 5 | Uspješno |
| registrujSe — validacija formata | 10 | Uspješno |
| registrujSe — provjera jedinstvenosti | 3 | Uspješno |
| registrujSe — interna greška servera | 1 | Uspješno |
| **Ukupno** | **22** | **Uspješno** |

---
## Dokaz izvršenja testova

![Rezultat unit testova](images/registration_unit_tests.png)
---

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
