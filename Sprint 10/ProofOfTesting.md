# Proof of Testing — Deactivation API & Anonymization Data Integrity

## Deaktivacija korisničkog naloga i anonimizacija podataka
**Modul:** Deaktivacija korisničkog naloga i anonimizacija podataka
**Verzija dokumenta:** 1.0
**API Endpointi:** `POST /users/:id/deactivation-request`, `PATCH /admin/deactivation-requests/:id`
**Test framework:** Vitest + Supertest
**Rezultat:** Uspješno — 4/4 testova prošlo

---

## 1. Opis testiranja

Testovi provjeravaju funkcionalnosti podnošenja zahtjeva za deaktivaciju korisničkog naloga, sprječavanje duplih zahtjeva, administrativno odobravanje/odbijanje zahtjeva i pokretanje procesa anonimizacije korisničkih podataka.

**Komanda:**
`npm test -- --run src/__tests__/deactivation.test.ts`

**Rezultat izvršavanja:**

* Test Files: 1 passed
* Tests: 4 passed
* Duration: 1.35s

---

## 2. Testni slučajevi

| ID testa | Naziv testa                                       | Očekivani rezultat                                        | Status   |
| -------- | ------------------------------------------------- | --------------------------------------------------------- | -------- |
| DT-001   | Kreiranje zahtjeva za deaktivaciju                | Status 201 i uspješna poruka o podnesenom zahtjevu        | Uspješno |
| DT-002   | Sprječavanje duplog aktivnog zahtjeva             | Status 409 i poruka o postojećem aktivnom zahtjevu        | Uspješno |
| DT-003   | Odobravanje zahtjeva i anonimizacija PII podataka | Status 200, pokrenuta Prisma transakcija za anonimizaciju | Uspješno |
| DT-004   | Odbijanje zahtjeva uz obrazloženje                | Status 200 i evidentirano obrazloženje odbijanja          | Uspješno |

---

## 3. Pregled rezultata po rutama

| Ruta                                     | Broj testova | Rezultat     |
| ---------------------------------------- | -----------: | ------------ |
| `POST /users/:id/deactivation-request`   |            2 | Uspješno     |
| `PATCH /admin/deactivation-requests/:id` |            2 | Uspješno     |
| **Ukupno**                               |        **4** | **Uspješno** |

---


**Konačni rezultat:** 4/4 testova uspješno prošlo.


---

## 1. Sažetak izvršenja (Executive Summary)

**Modul:** Administrativni panel (Audit Logs / Revizijski zapisnici)  
**Tehnološki stog:** Vitest, Supertest, Express.js, Prisma ORM, Docker (Testna baza)  
**Status:** 100% PROŠLO  
Svi testovi unutar paketa administrativnih funkcionalnosti za revizijske zapisnike su uspješno izvršeni. Ukupno je pokrenuto i prošlo **36 testnih scenarija** podijeljenih u dvije datoteke:
* **Unit testovi (`auditLog.unit.test.ts`):** 15 scenarija (Izolovani testovi logike formatiranja bez vanjskih zavisnosti).
* **Integracioni testovi (`auditLog.integration.test.ts`):** 21 scenario (Kompletni testovi API ruta sa upitima prema testnoj bazi u Dockeru i provjerom autorizacije kroz middleware).

| Kategorija / Testni fajl | Ukupno testova | Prošlo (Passed) | Palo (Failed) | Preskočeno (Skipped) | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Unit Testovi** (`auditLog.unit.test.ts`) | 15 | 15 | 0 | 0 | **USPIJEŠNO** |
| **Integracioni Testovi** (`auditLog.integration.test.ts`) | 21 | 21 | 0 | 0 | **USPIJEŠNO** |
| **UKUPNO** | **36** | **36** | **0** | **0** | **100% PROŠLO** |

---


# Proof of Testing - AuditLog

**Projekat:** Bolnički Informacioni Sistem  
**Modul:** Admin panel — *Audit Logs* 
**Tehnološki stog:** Vitest, Supertest, Express.js, Prisma ORM, Docker (Testna baza)  
**Status izvršenja:** 100% USPIJEŠNO  

---

## 1. Sažetak izvršenja (Executive Summary)

Svi testni scenariji unutar administrativnog modula za reviziju su uspješno izvršeni i validirani. Ukupno je pokrenuto **36 automatizovanih testova** podijeljenih u dvije komplementarne cjeline:
* **Unit testovi (`auditLog.unit.test.ts`):** 15 scenarija koji izoluju i potvrđuju tačnost poslovne logike za formatiranje i tekstualno mapiranje sirovih JSON struktura.
* **Integracioni testovi (`auditLog.integration.test.ts`):** 21 scenario koji verifikuje cjelokupan HTTP životni ciklus (autentifikacija, RBAC autorizacija, kontroleri, paginacija i kompleksni upiti nad bazom podataka).

| Testni paket (Fajl) | Pokrenuto | Prošlo (Passed) | Palo (Failed) | Pokrivenost (Status) |
| :--- | :---: | :---: | :---: | :---: |
| **Unit Testovi** — `auditLog.unit.test.ts` | 15 | 15 | 0 | **100%** |
| **Integracioni Testovi** — `auditLog.integration.test.ts` | 21 | 21 | 0 | **100%** |
| **UKUPNO SEGMENT** | **36** | **36** | **0** | **USPIJEŠNO PROŠLO** |

---

## 2. Detaljni rezultati i specifikacije scenarija

### 2.1. Unit testovi: Formatiranje detalja akcija (`formatirajDetaljeAkcije`)
Provjera podsistema koji transformiše sirove zapise o aktivnostima u formate prilagođene ljudskom čitanju unutar administratorskog panela.

| ID | Kontekst (Cjelina) | Specifikacija ponašanja (Naziv testa) | Vrijeme | Status |
| :--- | :--- | :--- | :---: | :---: |
| UT-01 | `Zaštitni mehanizmi` | Treba da vrati *fallback* poruku ukoliko je proslijeđeni log `null` | 1ms | Passed |
| UT-02 | `Zaštitni mehanizmi` | Treba da vrati *fallback* poruku ukoliko je proslijeđeni log `undefined` | 0ms | Passed |
| UT-03 | `Nedostajući podaci` | Treba da prikaže samo ID korisnika ukoliko relacioni objekat korisnika nije dostupan | 0ms | Passed |
| UT-04 | `Promjena uloge` | Treba da generiše tekst koji sadrži ime korisnika, te staru i novu ulogu | 0ms | Passed |
| UT-05 | `Promjena uloge` | Treba da ispiše `NEPOZNATO` ako podaci o ulogama uopšte ne postoje u strukturi | 0ms | Passed |
| UT-06 | `Blokiranje naloga` | Treba da eksplicitno navede ključnu riječ `BLOKIRAO` i ime suspendovanog korisnika | 0ms | Passed |
| UT-07 | `Blokiranje naloga` | Treba da izvrši formatiranje bez bacanja greške čak i ako nedostaje ime korisnika | 1ms | Passed |
| UT-08 | `Deblokiranje naloga` | Treba da ispravno mapira akciju i sadrži ključnu riječ `ODBLOKIRAO` uz ime korisnika | 0ms | Passed |
| UT-09 | `Brisanje podataka` | Treba da ispiše tačan naziv pogođene tabele i serijalizovani sadržaj obrisanog zapisa | 0ms | Passed |
| UT-10 | `Ažuriranje (Update)` | Treba da detaljno mapira i prikaže konkretne izmjene kada su polja promijenjena | 0ms | Passed |
| UT-11 | `Ažuriranje (Update)` | Treba da vrati poruku o nepromijenjenim vrijednostima ukoliko su podaci identični | 0ms | Passed |
| UT-12 | `Ažuriranje (Update)` | Treba da uključi specifične ugniježđene `profilPodaci` u izlaznu poruku kada postoje | 0ms | Passed |
| UT-13 | `Ažuriranje (Update)` | Ne smije uključiti sistemski ključ `profilPodaci` direktno u sirovu listu izmjena | 0ms | Passed |
| UT-14 | `Unos/Izmjena (Upsert)` | Treba da prikaže naziv modifikovane tabele i serijalizovane parametre novog unosa | 0ms | Passed |
| UT-15 | `Nepoznate akcije` | Treba da generiše generički ispis koji sadrži sirovi naziv nepoznate akcije i tabele | 0ms | Passed |

### 2.2. Integracioni testovi: Preuzimanje revizijskih zapisa (`GET /admin/audit-logs`)
Verifikacija sigurnosnih protokola, ispravnosti API krajnje tačke (endpointa), mehanizama paginacije i robusnog serverskog filtriranja.

| ID | Kontekst (Cjelina) | Specifikacija ponašanja (Naziv testa) | Vrijeme | Status |
| :--- | :--- | :--- | :---: | :---: |
| IT-01 | `Sigurnost / RBAC` | Treba da odbije zahtjev sa `401 Unauthorized` ako nedostaje token u zaglavlju | 98ms | Passed |
| IT-02 | `Sigurnost / RBAC` | Treba da odbije zahtjev sa `401 Unauthorized` ako je proslijeđen nevažeći token | 52ms | Passed |
| IT-03 | `Sigurnost / RBAC` | Treba da zabrani pristup sa `403 Forbidden` korisnicima sa ulogom `PACIJENT` | 51ms | Passed |
| IT-04 | `Sigurnost / RBAC` | Treba da dozvoli potpun pristup sa `200 OK` korisnicima sa ulogom `ADMINISTRATOR` | 79ms | Passed |
| IT-05 | `Osnovne funkcije` | Treba da vrati prazan niz i brojač postavljen na 0 kada u bazi nema evidentiranih logova | 44ms | Passed |
| IT-06 | `Osnovne funkcije` | Treba da uspješno vrati kreirani zapis sa svim validnim pripadajućim poljima | 46ms | Passed |
| IT-07 | `Osnovne funkcije` | Treba da u sklopu svakog loga isporuči ispravno ugniježđen i spojen objekat korisnika | 49ms | Passed |
| IT-08 | `Osnovne funkcije` | Treba da hronološki sortira zapise tako da se najnovije akcije uvijek vraćaju prve | 49ms | Passed |
| IT-09 | `Paginacija` | Treba da striktno poštuje parametar `limit` i vrati tačan broj zapisa po stranici | 54ms | Passed |
| IT-10 | `Paginacija` | Treba da precizno izračuna ukupan broj stranica na osnovu količine podataka | 52ms | Passed |
| IT-11 | `Paginacija` | Treba da ispravno prebaci kontekst i dohvati preostale zapise za drugu stranicu | 51ms | Passed |
| IT-12 | `Paginacija` | Treba da osigura da metapodaci paginacije uvijek imaju konzistentnu strukturu u odgovoru | 44ms | Passed |
| IT-13 | `Filtriranje` | Treba da profilira i vrati isključivo zapise koji odgovaraju traženom `tipAkcije` | 47ms | Passed |
| IT-14 | `Filtriranje` | Treba da vrati praznu listu ukoliko se pretražuje nepostojeći ili nevalidan `tipAkcije` | 46ms | Passed |
| IT-15 | `Filtriranje` | Treba da restriktivno izoluje i vrati samo zapise vezane za specificiranu tabelu | 48ms | Passed |
| IT-16 | `Filtriranje` | Treba da izoluje istoriju aktivnosti i vrati logove isključivo za traženog korisnika | 47ms | Passed |
| IT-17 | `Vremensko filtriranje` | Treba da restriktivno vrati samo logove kreirane unutar opsega `datumOd` – `datumDo` | 47ms | Passed |
| IT-18 | `Vremensko filtriranje` | Treba da kroz filter `datumOd` uspješno eliminiše sve logove starije od tog datuma | 45ms | Passed |
| IT-19 | `Vremensko filtriranje` | Treba da kroz filter `datumDo` uspješno eliminiše sve logove novije od tog datuma | 56ms | Passed |
| IT-20 | `Napredno filtriranje` | Treba da kombinovanjem parametara akcije i korisnika vrati tačan presjek skupa | 46ms | Passed |
| IT-21 | `Napredno filtriranje` | Treba da kombinovanjem tipa akcije i vremenskog opsega isporuči precizno filtriran skup | 45ms | Passed |

---

## 3. Izolacija okruženja i integritet testova

* **Arhitekturalna izolacija:** Svaki integracioni test operiše u hermetički izolovanom stanju. Korištenjem `beforeEach` kuka vrši se ciljano pražnjenje tabele `AuditLog` prije izvršenja svake pojedinačne specifikacije. Time je eliminisana mogućnost međusobnog uticaja testova (*test leakage*) i garantovana idempotentnost.
* **Brzina i stabilnost:** Unit testovi pokazuju vrhunske performanse izvršavajući se trenutno (~0ms), dok se integracioni HTTP ciklusi stabilno izvršavaju u opsegu od ~40ms do ~90ms, dokazujući efikasnost indeksiranja nad testnom bazom.

---

## 4. Verifikacioni izvještaj iz terminala (Console Log Output)

```bash
✓ src/__integration_tests__/auditLog.integration.test.ts (21 tests) 1156ms
   ✓ GET /admin/audit-logs — integracioni testovi (21)
     ✓ autorizacija (4)
       ✓ vraća 401 bez Authorization headera 98ms
       ✓ vraća 401 s neispravnim tokenom 52ms
       ✓ vraća 403 kad PACIJENT pokušava pristup 51ms
       ✓ vraća 200 za ADMIN token 79ms
     ✓ osnovna funkcionalnost (4)
       ✓ vraća praznu listu i ukupno=0 kad nema logova 44ms
       ✓ vraća kreiran log sa ispravnim poljima 46ms
       ✓ log u odgovoru sadrži ugniježđen korisnik objekat 49ms
       ✓ logovi su sortirani po vrijemeAkcije desc — najnoviji prvi 49ms
     ✓ paginacija (4)
       ✓ poštuje limit — vraća tačan broj zapisa po stranici 54ms
       ✓ ispravno računa ukupnoStranica 52ms
       ✓ vraća drugu stranicu s preostalim zapisima 51ms
       ✓ odgovor uvijek sadrži strukturu paginacije 44ms
     ✓ filter: tipAkcije (2)
       ✓ vraća samo logove s traženim tipAkcije 47ms
       ✓ vraća praznu listu za nepostojeći tipAkcije 46ms
     ✓ filter: izmenjenaTabela (1)
       ✓ vraća samo logove za traženu tabelu 48ms
     ✓ filter: idKorisnika (1)
       ✓ vraća samo logove za traženog korisnika 47ms
     ✓ filter: datum (datumOd / datumDo) (3)
       ✓ vraća samo logove unutar opsega datumOd–datumDo 47ms
       ✓ datumOd — ne vraća logove koji su stariji od datuma 45ms
       ✓ datumDo — ne vraća logove koji su noviji od datuma 56ms
     ✓ kombinovani filteri (2)
       ✓ tipAkcije + idKorisnika — vraća presječni skup 46ms
       ✓ tipAkcije + datum opseg — vraća tačno filtrirani rezultat 45ms

Test Files  1 passed (1)
     Tests  21 passed (21)
  Duration  11.70s

✓ src/__tests__/auditLog.unit.test.ts (15 tests) 5ms
   ✓ formatirajDetaljeAkcije (15)
     ✓ vraća fallback poruku kad je log null 1ms
     ✓ vraća fallback poruku kad je log undefined 0ms
     ✓ prikazuje ID korisnika kad korisnik objekat nije dostupan 0ms
     ✓ PROMJENA_ULOGE (2)
       ✓ sadrži staru i novu ulogu te ime korisnika 0ms
       ✓ prikazuje NEPOZNATO kad uloga nedostaje u stariPodaci i noviPodaci 0ms
     ✓ BLOKIRANJE_NALOGA (2)
       ✓ sadrži ključnu riječ BLOKIRAO i ime blokiranog korisnika 0ms
       ✓ radi i bez imena u noviPodaci (ne baca grešku) 1ms
     ✓ DEBLOKIRANJE_NALOGA (1)
       ✓ sadrži ključnu riječ ODBLOKIRAO i ime korisnika 0ms
     ✓ DELETE (1)
       ✓ sadrži naziv tabele i serijalizirane obrisane podatke 0ms
     ✓ UPDATE (4)
       ✓ prikazuje konkretne izmjene kad su polja promijenjena 0ms
       ✓ prikazuje poruku 'nisu mijenjane' kad su vrijednosti identične 0ms
       ✓ prikazuje profilPodaci unutar poruke kad postoje 0ms
       ✓ ne uključuje ključ profilPodaci u listu izmjena direktno 0ms
     ✓ UPSERT (1)
       ✓ sadrži naziv tabele i serijalizirane nove detalje 0ms
     ✓ nepoznata akcija (1)
       ✓ generički ispis sadrži naziv akcije i tabele 0ms
```
# Proof of Testing — VlasnikController

 
**Modul:** `vlasnikController.js`  
**Tip testova:** Unit testovi (Vitest) + Integracioni testovi (Supertest)

---

## 1. Pregled testnog pokrivanja

| Metoda kontrolera | Unit testovi | Integracioni testovi | Ukupno |
|---|---|---|---|
| `getTerminiDetalji` | 2 | 1 | 3 |
| `getSaleOccupancy` | 1 | 1 | 2 |
| `sakrijiRecenziju` | 3 | 2 | 5 |
| `getRecenzije` | 2 | 1 | 3 |
| **Ukupno** | **8** | **5** | **13** |

---

## 2. Unit testovi (`vlasnikController.unit.test.ts`)

Testovi koriste `prismaMock` (mockDeep Prisma klijent) i direktno pozivaju funkcije kontrolera bez HTTP sloja.

### 2.1 `getTerminiDetalji`

#### Test 1 — Kalkulacija lokalnog vremena i formatiranje datuma

**Opis:** Provjerava da li kontroler ispravno dodaje +2 sata na UTC vrijednost termina i formatira datum u `DD.MM.YYYY.` format.

**Ulazni podaci:**
- `vrijeme: 600` (600 minuta od ponoći = 10:00 UTC)
- `datum: 2026-06-01T00:00:00.000Z`

**Očekivani izlaz:**
```json
{
  "terminId": 1,
  "datum": "01.06.2026.",
  "vrijemePrikaz": "12:00",
  "status": "SLOBODAN"
}
```

**Rezultat:** ✅ PASS

---

#### Test 2 — Prepoznavanje statusa `OTKAZAN`

**Opis:** Provjerava da li kontroler prepisuje status u `OTKAZAN` kada rezervacija ima popunjen `datumOtkazivanja`, bez obzira na originalni status termina u bazi.

**Ulazni podaci:**
- `status: "ZAKAZAN"` u bazi
- Rezervacija sa `datumOtkazivanja: 2026-05-31T15:30:00.000Z`

**Očekivani izlaz:**
```json
{
  "status": "OTKAZAN",
  "rezervacijaId": 99,
  "zakazaoIme": "Adis",
  "otkazaoIme": "Adis"
}
```

**Rezultat:** ✅ PASS

---

### 2.2 `getSaleOccupancy`

#### Test 3 — Uklanjanje duplikata rezervacija

**Opis:** Provjerava da li kontroler koristi `Map` strukturu za deduplikaciju rezervacija koje se pojavljuju i direktno u sobi i kroz doktora/termine. Ukupan broj rezervacija mora biti 1, ne 2.

**Ulazni podaci:**
- Soba ID 10 sa rezervacijom ID 50 koja se pojavljuje duplo (jednom direktno, jednom kroz doktora)

**Očekivani izlaz:**
```json
{
  "sobaId": 10,
  "naziv": "Operaciona Sala 1",
  "ukupnoRezervacija": 1,
  "aktivnih": 1,
  "zavrsenih": 0,
  "otkazanih": 0
}
```

**Rezultat:** ✅ PASS

---

### 2.3 `sakrijiRecenziju`

#### Test 4 — Status 404 kada recenzija ne postoji

**Opis:** Provjerava da li kontroler vraća HTTP 404 i odgovarajuću poruku kada tražena recenzija nije pronađena u bazi.

**Mock:** `recenzija.findUnique` vraća `null`

**Očekivani odgovor:**
```json
{ "poruka": "Recenzija nije pronađena." }
```

**HTTP status:** `404`  
**Rezultat:** ✅ PASS

---

#### Test 5 — Status 400 kada je recenzija već sakrivena

**Opis:** Provjerava zaštitu od dvostrukog sakrivanja. Ako recenzija već ima `sakriven: true`, kontroler mora odbiti zahtjev.

**Mock:** `recenzija.findUnique` vraća objekat sa `sakriven: true`

**Očekivani odgovor:**
```json
{ "poruka": "Recenzija je već sakrivena." }
```

**HTTP status:** `400`  
**Rezultat:** ✅ PASS

---

#### Test 6 — Uspješno sakrivanje recenzije

**Opis:** Provjerava da li `update` upit u bazu šalje tačno `sakriven: true`, `sakrivenAt: Date` i `komentar: null` (brisanje teksta komentara).

**Mock:** `recenzija.findUnique` vraća `{ id: 12, sakriven: false }`

**Provjera Prisma poziva:**
```javascript
prismaMock.recenzija.update({
  where: { id: 12 },
  data: {
    sakriven: true,
    sakrivenAt: expect.any(Date),
    komentar: null
  }
})
```

**Rezultat:** ✅ PASS

---

### 2.4 `getRecenzije`

#### Test 7 — Paginirana lista recenzija

**Opis:** Provjerava da li kontroler ispravno računa `skip` i `take` vrijednosti na osnovu query parametara `stranica` i `limit`, te da li odgovor sadrži ispravan `paginacija` objekat.

**Query parametri:** `stranica=2`, `limit=10`

**Provjera Prisma poziva:**
```javascript
recenzija.findMany({ skip: 10, take: 10 })
```

**Rezultat:** ✅ PASS

---

#### Test 8 — Filter `samo_sa_komentarom`

**Opis:** Provjerava da li query parametar `samo_sa_komentarom=true` rezultuje ispravnim Prisma `where` filterom.

**Očekivani Prisma upit:**
```javascript
recenzija.findMany({
  where: { komentar: { not: null } }
})
```

**Rezultat:** ✅ PASS

---

## 3. Integracioni testovi (`vlasnikController.integration.test.ts`)

Testovi koriste `supertest` i Express aplikaciju sa stvarnim rutama. Provjeravaju cjelokupan HTTP sloj — parsiranje query stringa, routing, HTTP statusove i response body.

### 3.1 `GET /api/vlasnik/termini-detalji`

#### Test 9 — Mapiranje query parametara i paginacija

**Opis:** Provjerava da li su stringovi iz HTTP query stringa (`stranica`, `limit`) ispravno pretvoreni u brojeve i proslijeđeni Prismi kao `skip`/`take`.

**HTTP zahtjev:** `GET /api/vlasnik/termini-detalji?stranica=3&limit=15&status=SLOBODAN`

**Provjere:**
- HTTP status: `200`
- Response sadrži `termini` i `paginacija` ključeve
- `paginacija.stranica = 3`, `paginacija.limit = 15`
- Prisma primila `skip: 30` i `take: 15`

**Rezultat:** ✅ PASS

---

### 3.2 `GET /api/vlasnik/sale-occupancy`

#### Test 10 — Kalkulacija stanja soba kroz HTTP odgovor

**Opis:** End-to-end provjera: mock soba sa 2 rezervacije (1 završena, 1 aktivna) mora rezultovati ispravnim brojevima u JSON odgovoru.

**HTTP zahtjev:** `GET /api/vlasnik/sale-occupancy`

**Očekivani odgovor:**
```json
[{
  "sobaId": 1,
  "naziv": "Soba 101",
  "ukupnoRezervacija": 2,
  "aktivnih": 1,
  "zavrsenih": 1,
  "otkazanih": 0
}]
```

**Rezultat:** ✅ PASS

---

### 3.3 `PATCH /api/vlasnik/recenzije/:id/hide`

#### Test 11 — Uspješno sakrivanje kroz HTTP

**Opis:** Provjerava cjelokupan tok: HTTP PATCH zahtjev → kontroler → Prisma update → JSON odgovor sa porukom o uspjehu.

**HTTP zahtjev:** `PATCH /api/vlasnik/recenzije/42/hide`

**Provjere:**
- HTTP status: `200`
- Response: `{ "poruka": "Recenzija uspješno sakrivena." }`
- Prisma `update` pozvan sa `where: { id: 42 }`

**Rezultat:** ✅ PASS

---

#### Test 12 — Bad Request za već sakrivenu recenziju

**Opis:** Provjerava da HTTP sloj ispravno propagira 400 grešku i da se `update` nikada ne izvršava.

**HTTP zahtjev:** `PATCH /api/vlasnik/recenzije/42/hide`  
**Mock:** recenzija ima `sakriven: true`

**Provjere:**
- HTTP status: `400`
- Response: `{ "poruka": "Recenzija je već sakrivena." }`
- `prismaMock.recenzija.update` — **nije pozvan**

**Rezultat:** ✅ PASS

---

### 3.4 `GET /api/vlasnik/recenzije`

#### Test 13 — Query parametar `samo_sa_komentarom` kroz HTTP

**Opis:** End-to-end provjera da HTTP query string `samo_sa_komentarom=true` prođe kroz Express routing i dođe do Prisma `where` objekta u ispravnom obliku.

**HTTP zahtjev:** `GET /api/vlasnik/recenzije?samo_sa_komentarom=true`

**Provjera Prisma poziva:**
```javascript
recenzija.findMany({
  where: { komentar: { not: null } }
})
```

**HTTP status:** `200`  
**Rezultat:** ✅ PASS

---

## 4. Sažetak rezultata

| | Broj testova | Prošlo | Palo |
|---|---|---|---|
| Unit testovi | 8 | 8 | 0 |
| Integracioni testovi | 5 | 5 | 0 |
| **Ukupno** | **13** | **13** | **0** |

**Svi testovi su prošli. ✅**

---

## 5. Tehnički stack

| Komponenta | Tehnologija |
|---|---|
| Test framework | Vitest |
| HTTP testiranje | Supertest |
| Prisma mock | `mockDeep` (`vitest-mock-extended`) |
| Baza podataka (prod) | PostgreSQL via Prisma ORM |
| Jezik | TypeScript |
