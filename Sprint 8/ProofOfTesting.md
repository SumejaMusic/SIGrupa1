# Proof of Testing

# Testni slučajevi za module Rezervacija, Osoblje i Pregledi

**Moduli:** Rezervacije korisnika · Osoblje (termini i nalazi) · Pregledi  
**Verzija dokumenta:** 1.0  
**Test framework:** Vitest v4.1.5  
**Rezultat:** Uspješno

---

## 1. Unit testiranje — `reservationController_test.ts`

Unit testovi provjeravaju ponašanje funkcija `kreirajRezervaciju`, `getRezervacijeZaPacijenta`, `getRezervacijeZaDoktora`, `otkaziRezervacijuPacijent`, `otkaziRezervacijuOsoblje`, `dodajKomentar` i `getKomentari` na nivou kontrolera uz mockovanu Prisma bazu, mockovani Redis i mockovani email servis. Testovi ne koriste stvarnu bazu ni vanjsku infrastrukturu.

**Komanda:** `npm test -- --run src/__tests__/reservationController.test.ts`

| Grupa testova | Broj testova | Rezultat |
|---|---:|---|
| kreirajRezervaciju | 10 | Uspješno |
| getRezervacijeZaPacijenta | 4 | Uspješno |
| getRezervacijeZaDoktora | 5 | Uspješno |
| otkaziRezervacijuPacijent | 6 | Uspješno |
| otkaziRezervacijuOsoblje | 3 | Uspješno |
| dodajKomentar | 6 | Uspješno |
| getKomentari | 2 | Uspješno |
| **Ukupno** | **36** | **Uspješno** |

### 1.1 Tabela testnih slučajeva — `kreirajRezervaciju`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-RES-001 | Uspješno kreira rezervaciju i vraća je sa statusom 201 — US-06 AC1 | Mockovani pacijent, slobodan termin, Redis lock aktivan, transakcija uspješna | `terminId: 5`, `doktorId: 2`, `tipPregledaId: 1` | Status 201, vraćena rezervacija, `next` nije pozvan | Uspješno |
| UT-RES-002 | Briše Redis lock nakon uspješne rezervacije — NFR-22 | Mockovani pacijent, slobodan termin, transakcija uspješna | `terminId: 5`, `doktorId: 2` | `redisMock.del` pozvan sa ključem `"termin:lock:5"` | Uspješno |
| UT-RES-003 | Kreira rezervaciju sa komentarom — US-22 | Mockovani pacijent, slobodan termin, transakcija vraća komentar | `terminId: 5`, `komentar: "Imam bolove u srcu"` | Status 201, odgovor sadrži komentar | Uspješno |
| UT-RES-004 | Kreira rezervaciju bez komentara — US-22 AC1 | Mockovani pacijent, slobodan termin | `terminId: 5`, bez komentara | Status 201, odgovor sadrži `komentar: null` | Uspješno |
| UT-RES-005 | Vraća 404 kada profil pacijenta nije pronađen — US-06 | Pacijent ne postoji u mock bazi | `terminId: 5`, `doktorId: 2` | Status 404, poruka o grešci, `findFirst` na rezervaciji nije pozvan | Uspješno |
| UT-RES-006 | Vraća 409 za duplu rezervaciju — US-13 AC1 | Pacijent postoji, termin postoji, rezervacija za taj termin već postoji | `terminId: 5`, `doktorId: 2` | Status 409, poruka `"Rezervacija za ovaj termin već postoji."`, Redis nije pozvan | Uspješno |
| UT-RES-007 | Vraća 400 kada je odabrani termin u prošlosti | Termin u prošlosti, lažni sat postavljen na `2026-05-18T12:00:00Z` | `terminId: 5`, termin `datum: 2026-05-18`, `vrijeme: 600` | Status 400, poruka o terminu u prošlosti, `findFirst` i Redis nisu pozvani | Uspješno |
| UT-RES-008 | Poziva `next` pri Prisma grešci i ne vraća odgovor | `findFirst` baca grešku | `terminId: 5`, `doktorId: 2` | `next` pozvan sa greškom, `res.json` i `res.status` nisu pozvani | Uspješno |
| UT-RES-009 | Poziva `next` pri Redis grešci i ne vraća odgovor | `redisMock.get` baca grešku | `terminId: 5`, `doktorId: 2` | `next` pozvan sa greškom, odgovor nije vraćen | Uspješno |
| UT-RES-010 | Kreira rezervaciju sa `hitnost: false` kada hitnost nije poslana | Svi mock uslovi ispunjeni | `terminId: 5`, bez `hitnost` polja | Odgovor sadrži `hitnost: false` | Uspješno |
| UT-RES-011 | Ne briše Redis lock kada transakcija ne uspije | Transakcija baca grešku | `terminId: 5`, `doktorId: 2` | `redisMock.del` nije pozvan, `next` pozvan sa greškom | Uspješno |

### 1.2 Tabela testnih slučajeva — `getRezervacijeZaPacijenta`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-RES-012 | Vraća rezervacije za pacijenta poredane po datumu — US-01 AC1 | Pacijent postoji, mock vraća dvije rezervacije | Korisnik `id: 1`, uloga `PACIJENT` | `findMany` pozvan sa `orderBy: { datumKreiranja: "desc" }`, vraćene rezervacije | Uspješno |
| UT-RES-013 | Vraća prazan niz kada pacijent nema rezervacija | Pacijent postoji, mock vraća `[]` | Korisnik `id: 1`, uloga `PACIJENT` | Vraćen prazan niz, `next` nije pozvan | Uspješno |
| UT-RES-014 | Vraća 404 kada profil pacijenta nije pronađen | Pacijent ne postoji u mock bazi | Korisnik `id: 1` | Status 404, `findMany` nije pozvan | Uspješno |
| UT-RES-015 | Poziva `next` pri grešci i ne vraća odgovor | `findFirst` baca grešku | Korisnik `id: 1` | `next` pozvan sa greškom, odgovor nije vraćen | Uspješno |

### 1.3 Tabela testnih slučajeva — `getRezervacijeZaDoktora`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-RES-016 | Vraća rezervacije za doktora poredane po datumu — US-11 AC1 | Mock vraća dvije rezervacije | `doktorId: "3"` | `findMany` sa `where: { idDoktor: 3 }` i `orderBy: desc`, vraćene rezervacije | Uspješno |
| UT-RES-017 | Vraća prazan niz kada doktor nema rezervacija | Mock vraća `[]` | `doktorId: "999"` | Vraćen prazan niz, `findMany` pozvan sa ispravnim `idDoktor` | Uspješno |
| UT-RES-018 | Šalje ispravan `doktorId` u `where` klauzuli | Mock vraća rezervacije | `doktorId: "3"` | `findMany` pozvan sa `idDoktor: 3`, ne sa `idDoktor: 5` | Uspješno |
| UT-RES-019 | Konvertuje string `doktorId` u broj prije slanja Prismi | Mock vraća `[]` | `doktorId: "42"` | `findMany` pozvan sa `idDoktor: 42` (number, ne string) | Uspješno |
| UT-RES-020 | Poziva `next` pri grešci i ne vraća odgovor | `findMany` baca grešku | `doktorId: "3"` | `next` pozvan sa greškom, odgovor nije vraćen | Uspješno |

### 1.4 Tabela testnih slučajeva — `otkaziRezervacijuPacijent`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-RES-021 | Uspješno otkazuje rezervaciju više od 24h prije termina — US-10 AC1 | Pacijent postoji, rezervacija postoji sa terminom 48h unaprijed | `id: "1"` | Transakcija pozvana, vraćena poruka `"Rezervacija uspješno otkazana."` | Uspješno |
| UT-RES-022 | Vraća 404 kada rezervacija nije pronađena — US-10 | Mock vraća `null` za rezervaciju | `id: "999"` | Status 404, poruka `"Rezervacija nije pronađena."`, transakcija nije pozvana | Uspješno |
| UT-RES-023 | Zabranjuje otkazivanje manje od 24h prije termina — US-10 AC2 | Rezervacija s terminom 12h unaprijed | `id: "2"` | Status 400, poruka o zabrani otkazivanja, transakcija nije pozvana | Uspješno |
| UT-RES-024 | Zabranjuje otkazivanje tačno 24h ili manje — US-10 AC2 | Rezervacija s terminom tačno 24h minus 1 sekunda | `id: "3"` | Status 400, transakcija nije pozvana | Uspješno |
| UT-RES-025 | Zabranjuje otkazivanje termina koji je već prošao — US-10 AC2 | Rezervacija s terminom 24h u prošlosti | `id: "3"` | Status 400, poruka o zabrani otkazivanja | Uspješno |
| UT-RES-026 | Poziva `next` pri grešci i ne vraća odgovor | `findUnique` baca grešku | `id: "1"` | `next` pozvan sa greškom, odgovor nije vraćen | Uspješno |

### 1.5 Tabela testnih slučajeva — `otkaziRezervacijuOsoblje`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-RES-027 | Uspješno otkazuje rezervaciju i vraća potvrdu — US-09 AC1 | Rezervacija postoji | `id: "1"` | Transakcija pozvana, vraćena poruka `"Rezervacija otkazana od strane osoblja."` | Uspješno |
| UT-RES-028 | Vraća 404 kada rezervacija nije pronađena — US-09 | Mock vraća `null` | `id: "999"` | Status 404, poruka `"Rezervacija nije pronađena."`, transakcija nije pozvana | Uspješno |
| UT-RES-029 | Poziva `next` pri grešci i ne vraća odgovor | `findUnique` baca grešku | `id: "1"` | `next` pozvan sa greškom, odgovor nije vraćen | Uspješno |

### 1.6 Tabela testnih slučajeva — `dodajKomentar`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-RES-030 | Uspješno dodaje novi komentar bez brisanja postojećih — US-22 AC1 | Rezervacija postoji, `komentar.create` vraća novi komentar | `id: "1"`, `komentar: "Imam alergiju na penicilin"` | Status 201, vraćen komentar sa poljem `autor`, `rezervacije.update` nije pozvan | Uspješno |
| UT-RES-031 | Vraća 400 kada je komentar prazan | Bez preduslova | `id: "1"`, `komentar: ""` | Status 400, poruka `"Komentar ne može biti prazan."`, baza nije pozvana | Uspješno |
| UT-RES-032 | Konvertuje string ID u broj prije slanja Prismi | Rezervacija postoji | `id: "42"`, `komentar: "Test komentar"` | `findUnique` pozvan sa `where: { id: 42 }` (number) | Uspješno |
| UT-RES-033 | Označava komentar doktora sa `jeDoktor: true` | Rezervacija postoji, korisnik je DOKTOR | `id: "1"`, `komentar: "Doktorska napomena"`, korisnik `uloga: "DOKTOR"` | `create` pozvan sa `jeDoktor: true`, odgovor sadrži `jeDoktor: true` | Uspješno |
| UT-RES-034 | Vraća 404 kada rezervacija nije pronađena | Mock vraća `null` | `id: "999"`, `komentar: "Test"` | Status 404, `komentar.create` nije pozvan | Uspješno |
| UT-RES-035 | Poziva `next` pri grešci i ne vraća odgovor | `komentar.create` baca grešku | `id: "1"`, `komentar: "Test"` | `next` pozvan sa greškom, odgovor nije vraćen | Uspješno |

### 1.7 Tabela testnih slučajeva — `getKomentari`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-RES-036 | Vraća sve komentare rezervacije sa ispravnim autorima | Rezervacija sa dva komentara (pacijent i doktor) | `id: "1"` | Vraćena lista komentara sa poljima `autor`, `datum` i `jeDoktor` | Uspješno |
| UT-RES-037 | Koristi stari komentar kao fallback za rezervacije prije migracije | Rezervacija sa praznom `komentari` listom i starim `komentar` poljem | `id: "1"` | Vraćen stari komentar kao prvi element liste sa `id: 1000` | Uspješno |

---

## 2. Unit testiranje — `osobljeController_test.ts`

Unit testovi provjeravaju ponašanje 19 kontroler funkcija u `osobljeController.ts`. Svi pozivi prema servisnom sloju su mockovani putem `vi.mock("../osobljeService.js")`, čime se testira isključivo logika kontrolera: validacija ulaznih podataka, mapiranje parametara i rukovanje greškama.

**Komanda:** `npm test -- --run src/__tests__/osobljeController.test.ts`

| Grupa testova | Broj testova | Rezultat |
|---|---:|---|
| getDnevniTermini | 4 | Uspješno |
| pretragaTermina | 5 | Uspješno |
| getDetaljiTermina | 4 | Uspješno |
| otkaziTermin | 6 | Uspješno |
| kreirajTerminZaPacijenta | 5 | Uspješno |
| dodajNalaz | 5 | Uspješno |
| getNalaziPacijenta | 3 | Uspješno |
| getNalazPDF | 3 | Uspješno |
| getOtkazaniTermini | 4 | Uspješno |
| getHitniTermini | 3 | Uspješno |
| getZavrseniPregledi | 4 | Uspješno |
| postaviHitnost | 5 | Uspješno |
| getAllPacijenti / getAllDoktori / getAllOdjeli / getAllSobe / getAllTermini | 6 | Uspješno |
| getSlobodniTerminiDoktora | 3 | Uspješno |
| getTipoviPregleda | 2 | Uspješno |
| getSlobodniDatumiDoktora | 3 | Uspješno |
| **Ukupno** | **65** | **Uspješno** |

### 2.1 Tabela testnih slučajeva — `getDnevniTermini`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-OSB-001 | Vraća termine za proslijeđeni datum | Mock servis vraća jedan termin | `datum: "2026-05-17"` | Servis pozvan sa `Date` objektom, status 200, vraćeni termini | Uspješno |
| UT-OSB-002 | Koristi današnji datum kada datum nije proslijeđen | Mock servis vraća `[]` | Bez `datum` parametra | Servis pozvan sa `Date` objektom, status 200 | Uspješno |
| UT-OSB-003 | Vraća 400 za neispravan format datuma | Bez preduslova | `datum: "nije-datum"` | Status 400, poruka sadrži `"YYYY-MM-DD"`, servis nije pozvan | Uspješno |
| UT-OSB-004 | Poziva `next` pri grešci servisa | Servis baca grešku | `datum: "2026-05-17"` | `next` pozvan sa greškom, `res.json` nije pozvan | Uspješno |

### 2.2 Tabela testnih slučajeva — `pretragaTermina`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-OSB-005 | Vraća termine za ispravno ime | Mock servis vraća termine | `ime: "Amina"` | Servis pozvan sa `"Amina"`, status 200, vraćeni termini | Uspješno |
| UT-OSB-006 | Vraća 400 kada ime nije proslijeđeno | Bez preduslova | Bez `ime` parametra | Status 400, servis nije pozvan | Uspješno |
| UT-OSB-007 | Vraća 400 kada je ime kraće od 2 karaktera | Bez preduslova | `ime: "A"` | Status 400, poruka sadrži `"2 karaktera"`, servis nije pozvan | Uspješno |
| UT-OSB-008 | Trimuuje razmake iz query parametra | Mock servis vraća `[]` | `ime: "  Amina  "` | Servis pozvan sa `"Amina"` (bez razmaka) | Uspješno |
| UT-OSB-009 | Poziva `next` pri grešci servisa | Servis baca grešku | `ime: "Amina"` | `next` pozvan sa greškom | Uspješno |

### 2.3 Tabela testnih slučajeva — `getDetaljiTermina`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-OSB-010 | Vraća detalje rezervacije po ID-u | Mock servis vraća termin | `id: "1"` | Servis pozvan sa `1`, status 200, vraćen termin | Uspješno |
| UT-OSB-011 | Vraća 404 kada rezervacija ne postoji | Mock servis vraća `null` | `id: "999"` | Status 404, poruka `"Rezervacija nije pronađena."` | Uspješno |
| UT-OSB-012 | Vraća 400 za neispravan ID | Bez preduslova | `id: "abc"` | Status 400, servis nije pozvan | Uspješno |
| UT-OSB-013 | Poziva `next` pri grešci servisa | Servis baca grešku | `id: "1"` | `next` pozvan sa greškom | Uspješno |

### 2.4 Tabela testnih slučajeva — `otkaziTermin`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-OSB-014 | Uspješno otkazuje termin kada je potvrda `true` | Mock servis vraća otkazan termin | `id: "1"`, `potvrda: true` | Servis pozvan sa `1`, status 200, vraćen rezultat | Uspješno |
| UT-OSB-015 | Vraća 400 kada potvrda nije `true` | Bez preduslova | `id: "1"`, `potvrda: false` | Status 400, poruka sadrži `"potvrda: true"`, servis nije pozvan | Uspješno |
| UT-OSB-016 | Vraća 400 kada potvrda nije proslijeđena | Bez preduslova | `id: "1"`, prazan body | Status 400, servis nije pozvan | Uspješno |
| UT-OSB-017 | Vraća 400 za neispravan ID | Bez preduslova | `id: "abc"`, `potvrda: true` | Status 400, servis nije pozvan | Uspješno |
| UT-OSB-018 | Vraća grešku sa statusom iz servis-a (409 već otkazan) | Servis baca `{ status: 409, poruka: "..." }` | `id: "1"`, `potvrda: true` | Status 409, poruka `"Termin je već otkazan."`, `next` nije pozvan | Uspješno |
| UT-OSB-019 | Poziva `next` za neočekivane greške | Servis baca `Error` objekt | `id: "1"`, `potvrda: true` | `next` pozvan sa greškom | Uspješno |

### 2.5 Tabela testnih slučajeva — `kreirajTerminZaPacijenta`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-OSB-020 | Uspješno kreira rezervaciju sa validnim podacima | Mock servis vraća rezervaciju, Redis lock slobodan | `idTermina: 5`, `idDoktor: 2`, `idPacijent: 3`, `idTipPregleda: 1` | Servis pozvan sa ispravnim parametrima, status 201 | Uspješno |
| UT-OSB-021 | Vraća 400 kada nedostaju obavezna polja | Bez preduslova | Samo `idDoktor: 2` | Status 400, poruka sadrži `"idTermina"`, servis nije pozvan | Uspješno |
| UT-OSB-022 | Vraća 409 kada je termin zaključan (Redis lock) | Redis `get` vraća `"osoblje"` (lock aktivan) | Validni body | Status 409, poruka sadrži `"procesu rezervacije"`, servis nije pozvan | Uspješno |
| UT-OSB-023 | Oslobađa Redis lock i poziva `next` kada servis baci grešku | Redis slobodan, servis baca `Error` | Validni body | `redis.del` pozvan, `next` pozvan sa greškom | Uspješno |
| UT-OSB-024 | Vraća grešku sa statusom iz servis-a | Servis baca `{ status: 400, poruka: "Termin nije slobodan." }` | Validni body | Status 400, poruka `"Termin nije slobodan."` | Uspješno |

### 2.6 Tabela testnih slučajeva — `dodajNalaz`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-OSB-025 | Uspješno dodaje nalaz | Mock servis vraća nalaz | `idRezervacije: "5"`, `naziv`, `opis`, `fajl`, `mimeType` | Servis pozvan sa `(5, ...)`, status 201, vraćen nalaz | Uspješno |
| UT-OSB-026 | Vraća 400 za neispravan ID rezervacije | Bez preduslova | `idRezervacije: "abc"` | Status 400, servis nije pozvan | Uspješno |
| UT-OSB-027 | Vraća 400 kada nedostaju obavezna polja (`naziv`, `fajl`, `mimeType`) | Bez preduslova | Samo `naziv: "Test"` | Status 400, poruka sadrži `"naziv"`, servis nije pozvan | Uspješno |
| UT-OSB-028 | Vraća grešku sa statusom iz servis-a | Servis baca `{ status: 400, poruka: "Nije PDF." }` | Validni body | Status 400, poruka `"Nije PDF."` | Uspješno |
| UT-OSB-029 | Poziva `next` za neočekivane greške | Servis baca `Error` objekt | Validni body | `next` pozvan sa greškom | Uspješno |

### 2.7 Tabela testnih slučajeva — `getNalaziPacijenta`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-OSB-030 | Vraća nalaze za pacijenta | Mock servis vraća listu nalaza | `idPacijenta: "3"` | Servis pozvan sa `3`, status 200, vraćeni nalazi | Uspješno |
| UT-OSB-031 | Vraća 400 za neispravan ID pacijenta | Bez preduslova | `idPacijenta: "abc"` | Status 400, servis nije pozvan | Uspješno |
| UT-OSB-032 | Poziva `next` pri grešci servisa | Servis baca grešku | `idPacijenta: "3"` | `next` pozvan sa greškom | Uspješno |

### 2.8 Tabela testnih slučajeva — `getNalazPDF`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-OSB-033 | Šalje PDF sa ispravnim headerima | Mock servis vraća nalaz sa `dokumentPDF` | `id: "1"` | `Content-Type: application/pdf`, `Content-Disposition` sa imenom fajla, `res.send` pozvan | Uspješno |
| UT-OSB-034 | Vraća 400 za neispravan ID | Bez preduslova | `id: "abc"` | Status 400, servis nije pozvan | Uspješno |
| UT-OSB-035 | Vraća grešku sa statusom iz servis-a | Servis baca `{ status: 404, poruka: "Nalaz nije pronađen." }` | `id: "1"` | Status 404, poruka `"Nalaz nije pronađen."` | Uspješno |

### 2.9 Tabela testnih slučajeva — `getOtkazaniTermini`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-OSB-036 | Vraća otkazane termine bez datuma (svi) | Mock servis vraća termine | Bez `datum` parametra | Servis pozvan sa `undefined`, status 200 | Uspješno |
| UT-OSB-037 | Vraća otkazane termine za datum u DD-MM-YYYY formatu | Mock servis vraća `[]` | `datum: "17-05-2026"` | Servis pozvan sa `Date` objektom | Uspješno |
| UT-OSB-038 | Vraća 400 za neispravan format datuma (YYYY-MM-DD umjesto DD-MM-YYYY) | Bez preduslova | `datum: "2026-05-17"` | Status 400, poruka sadrži `"DD-MM-YYYY"`, servis nije pozvan | Uspješno |
| UT-OSB-039 | Poziva `next` pri grešci servisa | Servis baca grešku | Bez parametara | `next` pozvan sa greškom | Uspješno |

### 2.10 Tabela testnih slučajeva — `getHitniTermini`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-OSB-040 | Vraća sve hitne termine | Mock servis vraća termine sa `hitnost: true` | Bez parametara | Servis pozvan, status 200, vraćeni termini | Uspješno |
| UT-OSB-041 | Vraća prazan niz kada nema hitnih termina | Mock servis vraća `[]` | Bez parametara | Status 200, vraćen prazan niz | Uspješno |
| UT-OSB-042 | Poziva `next` pri grešci servisa | Servis baca grešku | Bez parametara | `next` pozvan sa greškom | Uspješno |

### 2.11 Tabela testnih slučajeva — `getZavrseniPregledi`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-OSB-043 | Vraća sve završene preglede bez filtera | Mock servis vraća preglede | Bez parametara | Servis pozvan sa `undefined`, status 200 | Uspješno |
| UT-OSB-044 | Filtrira po `idPacijenta` kada je proslijeđen | Mock servis vraća `[]` | `idPacijenta: "5"` | Servis pozvan sa `5` | Uspješno |
| UT-OSB-045 | Vraća 400 za neispravan `idPacijenta` | Bez preduslova | `idPacijenta: "abc"` | Status 400, servis nije pozvan | Uspješno |
| UT-OSB-046 | Poziva `next` pri grešci servisa | Servis baca grešku | Bez parametara | `next` pozvan sa greškom | Uspješno |

### 2.12 Tabela testnih slučajeva — `postaviHitnost`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-OSB-047 | Uspješno postavlja hitnost na `true` | Mock servis vraća rezervaciju | `id: "1"`, `hitnost: true` | Servis pozvan sa `(1, true)`, status 200 | Uspješno |
| UT-OSB-048 | Uspješno postavlja hitnost na `false` | Mock servis vraća rezervaciju | `id: "1"`, `hitnost: false` | Servis pozvan sa `(1, false)`, status 200 | Uspješno |
| UT-OSB-049 | Vraća 400 kada hitnost nije boolean | Bez preduslova | `id: "1"`, `hitnost: "true"` (string) | Status 400, poruka sadrži `"boolean"`, servis nije pozvan | Uspješno |
| UT-OSB-050 | Vraća 400 za neispravan ID | Bez preduslova | `id: "abc"`, `hitnost: true` | Status 400, servis nije pozvan | Uspješno |
| UT-OSB-051 | Vraća grešku sa statusom iz servis-a | Servis baca `{ status: 404, poruka: "..." }` | `id: "1"`, `hitnost: true` | Status 404, poruka `"Rezervacija nije pronađena."` | Uspješno |

### 2.13 Tabela testnih slučajeva — Passthrough kontroleri

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-OSB-052 | `getAllPacijenti` vraća listu pacijenata | Mock servis vraća `[{ id: 1 }]` | Bez parametara | Status 200, vraćena lista | Uspješno |
| UT-OSB-053 | `getAllDoktori` vraća listu doktora | Mock servis vraća `[{ id: 2 }]` | Bez parametara | Status 200, vraćena lista | Uspješno |
| UT-OSB-054 | `getAllOdjeli` vraća listu odjela | Mock servis vraća odjele | Bez parametara | Status 200 | Uspješno |
| UT-OSB-055 | `getAllSobe` vraća listu soba | Mock servis vraća sobe | Bez parametara | Status 200 | Uspješno |
| UT-OSB-056 | `getAllTermini` vraća sve termine | Mock servis vraća termine | Bez parametara | Status 200 | Uspješno |
| UT-OSB-057 | `getAllPacijenti` poziva `next` pri grešci | Mock servis baca grešku | Bez parametara | `next` pozvan sa greškom | Uspješno |

### 2.14 Tabela testnih slučajeva — `getSlobodniTerminiDoktora`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-OSB-058 | Vraća slobodne termine za doktora i datum | Mock servis vraća termine | `idDoktor: "2"`, `datum: "2026-05-17"` | Servis pozvan sa `(2, "2026-05-17")`, status 200 | Uspješno |
| UT-OSB-059 | Vraća 400 kada datum nije proslijeđen | Bez preduslova | `idDoktor: "2"`, bez datuma | Status 400, poruka sadrži `"datum"`, servis nije pozvan | Uspješno |
| UT-OSB-060 | Poziva `next` pri grešci servisa | Servis baca grešku | `idDoktor: "2"`, `datum: "2026-05-17"` | `next` pozvan sa greškom | Uspješno |

### 2.15 Tabela testnih slučajeva — `getTipoviPregleda`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-OSB-061 | Vraća tipove pregleda | Mock servis vraća tipove | Bez parametara | Servis pozvan, vraćena lista tipova | Uspješno |
| UT-OSB-062 | Vraća grešku sa statusom iz servis-a | Servis baca `{ status: 500, poruka: "Greška." }` | Bez parametara | Status 500, poruka `"Greška."` | Uspješno |

### 2.16 Tabela testnih slučajeva — `getSlobodniDatumiDoktora`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-OSB-063 | Vraća slobodne datume za doktora | Mock servis vraća datume | `idDoktor: "2"` | Servis pozvan sa `2`, status 200, vraćeni datumi | Uspješno |
| UT-OSB-064 | Vraća 400 za neispravan ID doktora | Bez preduslova | `idDoktor: "abc"` | Status 400, servis nije pozvan | Uspješno |
| UT-OSB-065 | Poziva `next` pri grešci servisa | Servis baca grešku | `idDoktor: "2"` | `next` pozvan sa greškom | Uspješno |

---

## 3. Unit testiranje — `pregledController_test.ts`

Unit testovi provjeravaju ponašanje funkcija `zavrsiPregled` i `getPregled` u `pregledController.ts`. Testovi koriste mockovanu Prisma bazu (`prismaMock`) i mockovanu enkripciju (`dekriptuj`), čime se izolovano provjerava poslovna logika završetka pregleda, kreiranja historije, upravljanja receptima i dekriptovanja osjetljivih podataka.

**Komanda:** `npm test -- --run src/__tests__/pregledController.test.ts`

| Grupa testova | Broj testova | Rezultat |
|---|---:|---|
| zavrsiPregled | 7 | Uspješno |
| getPregled | 6 | Uspješno |
| **Ukupno** | **13** | **Uspješno** |

### 3.1 Tabela testnih slučajeva — `zavrsiPregled`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-PRG-001 | Uspješno završava pregled bez recepta | Rezervacija postoji (`zavrseno: false`), transakcija kreira historiju | `rezervacijaId: "1"`, `dijagnoza: "Grip"`, `terapija: "Odmor i tekućine"` | `findUnique` pozvan sa `id: 1`, status 200, poruka `"Pregled uspješno završen."`, `next` nije pozvan | Uspješno |
| UT-PRG-002 | Uspješno završava pregled i kreira recept | Rezervacija postoji, transakcija kreira historiju i recept | `rezervacijaId: "1"`, `recept: { nazivLijeka: "Paracetamol", doza: "500mg", trajanje: 5 }` | `recept.create` pozvan sa ispravnim podacima, status 200, odgovor sadrži recept | Uspješno |
| UT-PRG-003 | Updateuje historiju ako već postoji (umjesto `create`) | Rezervacija ima postojeću historiju (`historija: { id: 10 }`) | `rezervacijaId: "1"`, validni body | `historijaPregleda.update` pozvan, `historijaPregleda.create` nije pozvan | Uspješno |
| UT-PRG-004 | Vraća 400 kada dijagnoza ili terapija nisu proslijeđeni | Bez preduslova | `rezervacijaId: "1"`, samo `dijagnoza: "Grip"` (bez terapije) | Status 400, poruka `"Dijagnoza i terapija su obavezni."`, baza nije pozvana | Uspješno |
| UT-PRG-005 | Vraća 404 kada rezervacija ne postoji | Mock vraća `null` za rezervaciju | `rezervacijaId: "999"`, validni body | Status 404, poruka `"Rezervacija nije pronađena."` | Uspješno |
| UT-PRG-006 | Ne kreira recept kada recept podaci nisu kompletni (nedostaje `trajanje`) | Rezervacija postoji, transakcija uspješna | `recept: { nazivLijeka: "Paracetamol", doza: "500mg" }` (bez `trajanje`) | `recept.create` nije pozvan | Uspješno |
| UT-PRG-007 | Poziva `next` pri grešci transakcije | Transakcija baca grešku | `rezervacijaId: "1"`, validni body | `next` pozvan sa greškom | Uspješno |
| UT-PRG-008 | Poziva `next` pri DB grešci na `findUnique` | `findUnique` baca grešku | `rezervacijaId: "1"`, validni body | `next` pozvan sa greškom, `res.json` nije pozvan | Uspješno |

### 3.2 Tabela testnih slučajeva — `getPregled`

| ID testa | Naziv testa | Preduslovi | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|---|
| UT-PRG-009 | Vraća historiju pregleda sa dekriptovanim receptima | Mock vraća historiju s receptom | `rezervacijaId: "1"` | `nazivLijeka` i `doza` su dekriptovani (`"decrypted:..."`) | Uspješno |
| UT-PRG-010 | Vraća `null` kada historija ne postoji (200 sa `null`) | Mock vraća `null` | `rezervacijaId: "1"` | `res.json` pozvan sa `null`, `res.status` nije pozvan (ne vraća 404) | Uspješno |
| UT-PRG-011 | Vraća nalaze zajedno sa historijom | Mock vraća historiju s jednim nalazom | `rezervacijaId: "1"` | Odgovor sadrži `nalaz` lista dužine 1 sa ispravnim `naziv` | Uspješno |
| UT-PRG-012 | Uključuje `recepti` i `nalaz` u Prisma upitu | Mock vraća `null` | `rezervacijaId: "1"` | `findUnique` pozvan sa `include: { recepti: true, nalaz: { select: ... } }` | Uspješno |
| UT-PRG-013 | Pravilno obrađuje recept bez napomene (`napomena: null`) | Mock vraća recept s `napomena: null` | `rezervacijaId: "1"` | `napomena` u odgovoru ostaje `null` (nije pokušana dekriptija) | Uspješno |
| UT-PRG-014 | Poziva `next` pri DB grešci | `findUnique` baca grešku | `rezervacijaId: "1"` | `next` pozvan sa greškom, `res.json` nije pozvan | Uspješno |

---

## Sumarni pregled svih testova

| Modul | Test fajl | Broj testova | Rezultat |
|---|---|---:|---|
| Rezervacije | `reservationController_test.ts` | 36 | Uspješno |
| Osoblje | `osobljeController_test.ts` | 65 | Uspješno |
| Pregledi | `pregledController_test.ts` | 13 | Uspješno |
| **Ukupno** | | **114** | **Uspješno** |
