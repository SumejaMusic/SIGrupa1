# Proof of Testing — Lista čekanja (Waitlist sistem)

**Modul:** Lista čekanja
**Verzija dokumenta:** 1.0
**API Endpointi:** `POST /api/lista-cekanja`, `POST /api/lista-cekanja/:id/potvrdi`, `POST /api/lista-cekanja/:id/odbij`, `DELETE /api/lista-cekanja/:id`, `GET /api/lista-cekanja/:id/pregled-potvrde`
**Test framework:** Vitest v4.1.5
**Rezultat:** Uspješno
- Unit testovi (servis): 11/11 prošlo
- Integracioni testovi (kontroler): 12/12 prošlo

---

## 1. Unit testiranje — `listaCekanjaService.test.ts`

Unit testovi provjeravaju poslovnu logiku servisa `listaCekanjaService.ts` u izolaciji, bez stvarne baze podataka, Redis instance ili Socket.IO konekcije. Koriste `vi.hoisted` za mockovanje Prisma klijenta, Redis klijenta, `io` objekta i email servisa prije nego što se moduli učitaju.

**Komanda:** `npm test -- --run src/__tests__/listaCekanjaService.test.ts`
**Rezultat:** Uspješno — 11/11 testova prošlo

### 1.1 Metodologija

| Komponenta | Pristup | Razlog |
| :--- | :--- | :--- |
| Prisma baza | `vi.hoisted` mock | Izolacija od stvarne baze |
| Redis | `vi.hoisted` mock | Kontrola TTL i offer ključeva |
| Socket.IO (`io`) | `vi.hoisted` mock | Sprječavanje stvarnih WebSocket emita |
| Email servis | `vi.mock` | Sprječavanje slanja stvarnih emailova |

---

### 1.2 Testni slučajevi — `prijaviSeNaListuCekanja`

| ID testa | Naziv testa | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|
| UT-WL-001 | Baca grešku ako doktor ne radi taj dan | `prismaMock.termin.findFirst` vraća `null` | Rejectuje sa `{ status: 400, poruka: "Doktor ne radi taj dan." }` | Uspješno |
| UT-WL-002 | Baca grešku ako postoje slobodni termini | `findFirst` vraća termin, drugi poziv vraća slobodan termin | Rejectuje sa `{ status: 400, poruka: "Postoje slobodni termini za taj dan. Zakažite direktno." }` | Uspješno |
| UT-WL-003 | Kreira zapis ako su svi termini zauzeti | `findFirst` vraća termin, drugi poziv vraća `null`, `create` vraća `{ id: 1 }` | `listaCekanja.create` pozvan jednom, vraćen objekt sa `id: 1` | Uspješno |

---

### 1.3 Testni slučajevi — `potvrdiWaitlistTermin`

| ID testa | Naziv testa | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|
| UT-WL-004 | Baca 404 ako zapis nije pronađen | `listaCekanja.findFirst` vraća `null` | Rejectuje sa `{ status: 404 }` | Uspješno |
| UT-WL-005 | Baca 410 ako je Redis offer istekao | `findFirst` vraća zapis, `redis.get` vraća `null` | Rejectuje sa `{ status: 410 }` | Uspješno |
| UT-WL-006 | Baca 409 ako termin nije NA_CEKANJU | `redis.get` vraća `"5"`, `termin.findUnique` vraća termin sa statusom `ZAKAZAN` | Rejectuje sa `{ status: 409 }` | Uspješno |

---

### 1.4 Testni slučajevi — `odbijWaitlistTermin`

| ID testa | Naziv testa | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|
| UT-WL-007 | Baca 404 ako zapis nije pronađen | `listaCekanja.findFirst` vraća `null` | Rejectuje sa `{ status: 404 }` | Uspješno |
| UT-WL-008 | Mijenja status u ODBIJENO i briše Redis offer | `findFirst` vraća zapis, `redis.get` vraća `null` | `listaCekanja.update` pozvan sa `{ status: "ODBIJENO" }`, `redis.del` pozvan sa `"waitlist:offer:1"` | Uspješno |

---

### 1.5 Testni slučajevi — `otkaziCekanje`

| ID testa | Naziv testa | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|
| UT-WL-009 | Baca 404 ako zapis nije aktivan | `listaCekanja.findFirst` vraća `null` | Rejectuje sa `{ status: 404 }` | Uspješno |
| UT-WL-010 | Mijenja status u OTKAZANO | `findFirst` vraća zapis sa statusom `CEKA` | `listaCekanja.update` pozvan sa `{ status: "OTKAZANO" }` | Uspješno |
| UT-WL-011 | Oslobađa termin ako je bio OBAVIJESTEN i nema drugih u redu | `findFirst` vraća zapis sa statusom `OBAVIJESTEN`, `redis.get` vraća `"5"`, `listaCekanja.count` vraća `0` | `termin.update` pozvan sa `{ status: "SLOBODAN", pacijent: { disconnect: true } }` | Uspješno |

---

### 1.6 Pregled rezultata po grupama

| Grupa testova | Broj testova | Rezultat |
|---|---:|---|
| `prijaviSeNaListuCekanja` | 3 | Uspješno |
| `potvrdiWaitlistTermin` | 3 | Uspješno |
| `odbijWaitlistTermin` | 2 | Uspješno |
| `otkaziCekanje` | 3 | Uspješno |
| **Ukupno** | **11** | **Uspješno** |

---

## 2. Integracioni testovi — `listaCekanjaController.integration.test.ts`

Integracioni testovi provjeravaju HTTP sloj kontrolera `listaCekanjaController.ts` kroz stvarne HTTP zahtjeve putem `supertest`. Koriste mockovan servis i mockovan Prisma/Redis sloj kako bi se izolovao kontroler od poslovne logike i baze podataka. Auth middleware je mockovan da uvijek postavi `req.korisnik = { id: 1, uloga: "PACIJENT" }`.

**Komanda:** `npm test -- --run src/__integration_tests__/listaCekanjaController.integration.test.ts`
**Rezultat:** Uspješno — 12/12 testova prošlo

### 2.1 Metodologija

| Komponenta | Pristup | Razlog |
| :--- | :--- | :--- |
| HTTP sloj | `supertest` + Express app instanca | Testiranje request/response ciklusa kontrolera |
| Servis (`listaCekanjaService`) | `vi.mock` | Izolacija kontrolera od poslovne logike |
| Prisma | `vi.mock` | Kontrola rezultata upita za `pacijent.findFirst` |
| Redis | `vi.mock` | Kontrola offer ključeva |
| Auth middleware | `vi.mock` | Simulacija prijavljenog pacijenta bez JWT tokena |

---

### 2.2 Testni slučajevi — `POST /api/lista-cekanja`

| ID testa | Naziv testa | Zahtjev | Očekivani rezultat | Status |
|---|---|---|---|---|
| IT-WL-001 | Vraća 201 pri uspješnoj prijavi | `{ doktorId: 1, zeleniDatum: "2025-06-15" }` | Status 201, `poruka: "Uspješno prijavljeni na listu čekanja."` | Uspješno |
| IT-WL-002 | Vraća 400 ako nedostaje `doktorId` | `{ zeleniDatum: "2025-06-15" }` | Status 400 | Uspješno |
| IT-WL-003 | Vraća 404 ako pacijent nije pronađen | `pacijent.findFirst` vraća `null` | Status 404 | Uspješno |
| IT-WL-004 | Vraća 400 ako su slobodni termini dostupni | Servis baca `{ status: 400, poruka: "Postoje slobodni termini..." }` | Status 400, poruka sadrži `"slobodni termini"` | Uspješno |

---

### 2.3 Testni slučajevi — `POST /api/lista-cekanja/:id/potvrdi`

| ID testa | Naziv testa | Zahtjev | Očekivani rezultat | Status |
|---|---|---|---|---|
| IT-WL-005 | Vraća 200 pri uspješnoj potvrdi | `{ terminIdsZaBrisanje: [] }` | Status 200, `poruka: "Termin uspješno zakazan!"` | Uspješno |
| IT-WL-006 | Vraća 410 ako je rok istekao | Servis baca `{ status: 410 }` | Status 410 | Uspješno |
| IT-WL-007 | Proslijeđuje `terminIdsZaBrisanje` servisu | `{ terminIdsZaBrisanje: [5, 6] }` | `potvrdiWaitlistTermin` pozvan sa argumentima `(1, 1, [5, 6])` | Uspješno |

---

### 2.4 Testni slučajevi — `POST /api/lista-cekanja/:id/odbij`

| ID testa | Naziv testa | Zahtjev | Očekivani rezultat | Status |
|---|---|---|---|---|
| IT-WL-008 | Vraća 200 pri uspješnom odbijanju | Servis vraća `undefined` | Status 200, `poruka: "Termin odbijen. Ostajete u listi čekanja."` | Uspješno |
| IT-WL-009 | Vraća 404 ako zapis nije pronađen | Servis baca `{ status: 404 }` | Status 404 | Uspješno |

---

### 2.5 Testni slučajevi — `DELETE /api/lista-cekanja/:id`

| ID testa | Naziv testa | Zahtjev | Očekivani rezultat | Status |
|---|---|---|---|---|
| IT-WL-010 | Vraća 200 pri uspješnom otkazivanju | Servis vraća `undefined` | Status 200, `poruka: "Uspješno ste se uklonili sa liste čekanja."` | Uspješno |
| IT-WL-011 | Vraća 404 ako zapis nije aktivan | Servis baca `{ status: 404 }` | Status 404 | Uspješno |

---

### 2.6 Testni slučajevi — `GET /api/lista-cekanja/:id/pregled-potvrde`

| ID testa | Naziv testa | Preduslovi | Očekivani rezultat | Status |
|---|---|---|---|---|
| IT-WL-012 | Vraća praznu listu ako nema Redis offer-a | `redis.get` vraća `null` | Status 200, `kasnijiTermini: []` | Uspješno |
| IT-WL-013 | Vraća listu kasnijih termina | `redis.get` vraća `"5"`, `termin.findUnique` vraća termin, `rezervacije.findMany` vraća jednu rezervaciju | Status 200, `kasnijiTermini` ima dužinu 1, `terminId: 20`, `doktorIme: "Dr. Marko Marković"` | Uspješno |

---

### 2.7 Pregled rezultata po grupama

| Grupa testova | Broj testova | Rezultat |
|---|---:|---|
| `POST /api/lista-cekanja` | 4 | Uspješno |
| `POST /api/lista-cekanja/:id/potvrdi` | 3 | Uspješno |
| `POST /api/lista-cekanja/:id/odbij` | 2 | Uspješno |
| `DELETE /api/lista-cekanja/:id` | 2 | Uspješno |
| `GET /api/lista-cekanja/:id/pregled-potvrde` | 2 | Uspješno |
| **Ukupno** | **13** | **Uspješno** |

---

## 3. Ukupni pregled

| Tip testiranja | Fajl | Testova | Rezultat |
|---|---|---:|---|
| Unit (servis) | `listaCekanjaService.test.ts` | 11 | Uspješno |
| Integracioni (kontroler) | `listaCekanjaController.integration.test.ts` | 13 | Uspješno |
| **Ukupno** | | **24** | **Uspješno** |

---

> **Napomena:** Integracioni testovi u ovom dokumentu testiraju HTTP/kontroler sloj sa mockovanim servisom i ne pokreću stvarnu bazu ni Redis. Potpuni end-to-end tok liste čekanja pokriven je kroz integracione testove u `listaCekanjaIntegration.test.ts` koji se izvršavaju protiv stvarne test baze i dokumentovani su odvojeno.

**Rezultat:** 24/24 testova prošlo 

---

## 4. Unit testiranje — `doctorController.test.ts`

Unit testovi provjeravaju poslovnu logiku kontrolera `doctorController.ts` u izolaciji. Koriste mockovan Prisma klijent i mock `req/res/next` objekte.

**Komanda:** `npm test -- --run src/__tests__/doctorController.test.ts`
**Rezultat:** Uspješno — 10/10 testova prošlo

### 4.1 Testni slučajevi — `dodajKomentarDoktor (doctorController)`

| ID testa | Naziv testa | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|
| UT-DC-001 | Uspješno dodaje komentar sa statusom 201 | Validan doktor (id: 2), rezervacija nije otkazana ni završena, `komentar.create` vraća objekt | Status 201, odgovor sadrži `tekst` i `jeDoktor: true` | Uspješno |
| UT-DC-002 | Vraća 401 kada korisnik nije prijavljen | `req.korisnik = undefined` | Status 401, `{ poruka: "Niste prijavljeni." }` | Uspješno |
| UT-DC-003 | Vraća 403 kada uloga nije DOKTOR | `req.korisnik.uloga = "PACIJENT"` | Status 403, `{ poruka: "Samo doktori mogu koristiti ovu rutu." }` | Uspješno |
| UT-DC-004 | Vraća 400 kada je komentar prazan | `body.komentar = ""` | Status 400, `{ poruka: "Komentar ne može biti prazan." }` | Uspješno |
| UT-DC-005 | Vraća 400 za neispravan ID rezervacije | `params.id = "abc"` | Status 400, `{ poruka: "Nevažeći ID rezervacije." }` | Uspješno |
| UT-DC-006 | Vraća 404 kada rezervacija nije pronađena | `rezervacije.findUnique` vraća `null` | Status 404, `{ poruka: "Rezervacija nije pronađena." }`, `komentar.create` nije pozvan | Uspješno |
| UT-DC-007 | Vraća 400 kada je rezervacija otkazana | `datumOtkazivanja` postavljen | Status 400, `{ poruka: "Nije moguće komentarisati otkazanu rezervaciju." }` | Uspješno |
| UT-DC-008 | Vraća 400 kada je rezervacija završena | `zavrseno: true` | Status 400, `{ poruka: "Nije moguće komentarisati završenu rezervaciju." }` | Uspješno |
| UT-DC-009 | Vraća 403 kada doktor pokušava komentarisati tuđu rezervaciju | `doktor.idKorisnik = 99` (drugi doktor) | Status 403, `{ poruka: "Nemate dozvolu za komentarisanje ove rezervacije." }` | Uspješno |
| UT-DC-010 | Poziva next pri DB grešci | `rezervacije.findUnique` baca grešku | `next` pozvan sa greškom, `res.json` i `res.status` nisu pozvani | Uspješno |

---

## 5. Unit testiranje — `reservationController.test.ts`

Unit testovi provjeravaju logiku kontrolera `reservationController.ts`. Koriste mockovan Prisma i Redis klijent, kao i mock email servis.

**Komanda:** `npm test -- --run src/__tests__/reservationController.test.ts`
**Rezultat:** Uspješno — 34/34 testova prošlo

### 5.1 Testni slučajevi — `pomjeriRezervaciju`

| ID testa | Naziv testa | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|
| UT-RC-001 | Uspješno pomjera rezervaciju i briše Redis lock (US-11) | Validan doktor, stara rezervacija i novi slobodni termin, Redis lock aktivan | `$transaction` pozvan, `redisMock.del("termin:lock:7")`, status 200 | Uspješno |
| UT-RC-002 | Šalje email pacijentu nakon uspješnog pomjeranja (US-11) | Isto kao UT-RC-001 | `posaljiPotvrdurezerv` pozvan sa `pacijentEmail: "test@test.com"` | Uspješno |
| UT-RC-003 | Vraća 401 kada korisnik nije prijavljen | `req.korisnik = undefined` | Status 401, `{ poruka: "Niste prijavljeni." }` | Uspješno |
| UT-RC-004 | Vraća 403 kada korisnik nema doktorId | `korisnik` bez `doktorId` | Status 403, `{ poruka: "Nemate dozvolu." }` | Uspješno |
| UT-RC-005 | Vraća 404 kada stara rezervacija nije pronađena | `rezervacije.findUnique` vraća `null` | Status 404, `termin.findUnique` nije pozvan | Uspješno |
| UT-RC-006 | Vraća 403 kada doktor pokušava pomjeriti tuđu rezervaciju | `idDoktor: 99` (drugi doktor) | Status 403, `{ poruka: "Nemate dozvolu za ovu rezervaciju." }` | Uspješno |
| UT-RC-007 | Vraća 404 kada novi termin nije pronađen | `termin.findUnique` vraća `null` | Status 404, `{ poruka: "Novi termin nije pronađen." }` | Uspješno |
| UT-RC-008 | Vraća 409 kada novi termin nije slobodan | `termin.status = "ZAKAZAN"` | Status 409, `{ poruka: "Novi termin više nije slobodan." }`, `redisMock.get` nije pozvan | Uspješno |
| UT-RC-009 | Vraća 409 kada termin nije zaključan u Redisu | `redisMock.get` vraća `null` | Status 409, `{ poruka: "Termin nije zaključan." }`, `$transaction` nije pozvan | Uspješno |
| UT-RC-010 | Vraća 409 kada je termin zaključan od drugog korisnika | `redisMock.get` vraća `"999"` | Status 409, `{ poruka: "Termin nije zaključan." }`, `$transaction` nije pozvan | Uspješno |
| UT-RC-011 | Ne briše Redis lock kada transakcija ne uspije | `$transaction` baca grešku | `redisMock.del` nije pozvan, `next` pozvan sa greškom | Uspješno |
| UT-RC-012 | Poziva next pri DB grešci | `rezervacije.findUnique` baca grešku | `next` pozvan sa greškom, `res.json` i `res.status` nisu pozvani | Uspješno |

### 5.2 Testni slučajevi — `kreirajRezervacijuDoktor`

| ID testa | Naziv testa | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|
| UT-RC-013 | Uspješno kreira rezervaciju sa statusom 201 | Validan doktor, pacijent i slobodni budući termin, Redis lock aktivan, transakcija uspješna | Status 201, vraćena rezervacija, `redisMock.del` pozvan | Uspješno |
| UT-RC-014 | Vraća 401 kada korisnik nije prijavljen | `req.korisnik = undefined` | Status 401, `{ poruka: "Niste prijavljeni." }` | Uspješno |
| UT-RC-015 | Vraća 403 kada korisnik nema doktorId | `korisnik` bez `doktorId` | Status 403, `{ poruka: "Nemate dozvolu za ovu akciju." }` | Uspješno |
| UT-RC-016 | Vraća 400 kada idTermina nedostaje ili je nevalidan | `body` bez `idTermina` | Status 400, `{ poruka: "Nedostaje ispravan idTermina." }` | Uspješno |
| UT-RC-017 | Vraća 400 kada idPacijent nedostaje ili je nevalidan | `body` bez `idPacijent` | Status 400, `{ poruka: "Nedostaje ispravan idPacijent." }` | Uspješno |
| UT-RC-018 | Vraća 404 kada pacijent nije pronađen | `pacijent.findUnique` vraća `null` | Status 404, `{ poruka: "Pacijent nije pronađen." }` | Uspješno |
| UT-RC-019 | Vraća 404 kada termin nije pronađen | `termin.findUnique` vraća `null` | Status 404, `{ poruka: "Termin nije pronađen." }` | Uspješno |
| UT-RC-020 | Vraća 409 kada termin nije slobodan | `termin.status = "ZAKAZAN"` | Status 409, `{ poruka: "Termin više nije slobodan." }` | Uspješno |
| UT-RC-021 | Vraća 400 kada je termin u prošlosti | `vi.useFakeTimers`, datum termina u prošlosti | Status 400, `{ poruka: "Nevalidna rezervacija: ne možete rezervisati termin u prošlosti." }` | Uspješno |
| UT-RC-022 | Vraća 409 za duplu rezervaciju | `rezervacije.findFirst` vraća postojeću rezervaciju | Status 409, `{ poruka: "Rezervacija za ovaj termin već postoji." }` | Uspješno |
| UT-RC-023 | Vraća 409 kada termin nije zaključan u Redisu | `redisMock.get` vraća `null` | Status 409, `{ poruka: "Termin nije zaključan. Pokrenite proces ponovo." }`, `$transaction` nije pozvan | Uspješno |
| UT-RC-024 | Briše Redis lock nakon uspješne rezervacije | Sve mock vrijednosti ispravne | `redisMock.del("termin:lock:5")` pozvan | Uspješno |
| UT-RC-025 | Poziva next pri DB grešci | `pacijent.findUnique` baca grešku | `next` pozvan sa greškom, `res.json` i `res.status` nisu pozvani | Uspješno |

### 5.3 Testni slučajevi — `dodajKomentarDoktor (reservationController)`

| ID testa | Naziv testa | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|
| UT-RC-026 | Uspješno dodaje komentar sa statusom 201 | Validan doktor (id: 2), `komentar.create` vraća objekt sa korisnik podacima | Status 201, odgovor sadrži `tekst`, `jeDoktor: true`, `autor: "Dr. Marić"` | Uspješno |
| UT-RC-027 | Vraća 403 kada uloga nije DOKTOR | `uloga: "PACIJENT"` | Status 403, `rezervacije.findUnique` nije pozvan | Uspješno |
| UT-RC-028 | Vraća 400 kada je komentar prazan | `body.komentar = ""` | Status 400, `{ poruka: "Komentar ne može biti prazan." }` | Uspješno |
| UT-RC-029 | Vraća 404 kada rezervacija nije pronađena | `rezervacije.findUnique` vraća `null` | Status 404, `komentar.create` nije pozvan | Uspješno |
| UT-RC-030 | Vraća 400 kada je rezervacija otkazana | `datumOtkazivanja` postavljen | Status 400, `komentar.create` nije pozvan | Uspješno |
| UT-RC-031 | Vraća 400 kada je rezervacija završena | `zavrseno: true` | Status 400, `komentar.create` nije pozvan | Uspješno |
| UT-RC-032 | Vraća 403 kada doktor komentariše tuđu rezervaciju | `doktor.idKorisnik = 99` | Status 403, `komentar.create` nije pozvan | Uspješno |
| UT-RC-033 | Poziva next pri DB grešci | `komentar.create` baca grešku | `next` pozvan sa greškom, `res.json` i `res.status` nisu pozvani | Uspješno |

### 5.4 Testni slučajevi — `otkaziRezervacijuOsoblje` (dodatni)

| ID testa | Naziv testa | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|
| UT-RC-034 | Vraća 400 kada je termin već prošao | Termin sa datumom u prošlosti (48h unazad) | Status 400, `{ poruka: "Nije moguće otkazati termin koji je već prošao." }`, `$transaction` nije pozvan | Uspješno |

---

## 6. Unit testiranje — `OsobljeController.test.ts`

Unit testovi provjeravaju HTTP kontroler sloj `OsobljeController.ts`. Servis je potpuno mockovan, a testovi verifikuju ispravno prosljeđivanje parametara servisu i rukovanje greškama.

**Komanda:** `npm test -- --run src/__tests__/OsobljeController.test.ts`
**Rezultat:** Uspješno — 34/34 testova prošlo

### 6.1 Testni slučajevi — `getDnevniTermini`

| ID testa | Naziv testa | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|
| UT-OC-001 | Vraća termine za zadani datum | `query.datum = "2026-05-18"`, servis vraća 2 termina | `getDnevniTerminiService` pozvan, status 200, lista termina | Uspješno |
| UT-OC-002 | Koristi danas kao datum ako datum nije poslan | `query = {}` | `getDnevniTerminiService` pozvan, status 200 | Uspješno |
| UT-OC-003 | Vraća 400 za neispravan format datuma | `query.datum = "nije-datum"` | Status 400, `{ poruka: "Neispravan format datuma. Koristite YYYY-MM-DD." }`, servis nije pozvan | Uspješno |
| UT-OC-004 | Poziva next pri grešci servisa | Servis baca grešku | `next` pozvan sa greškom, `res.json` nije pozvan | Uspješno |

### 6.2 Testni slučajevi — `pretragaTermina`

| ID testa | Naziv testa | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|
| UT-OC-005 | Vraća rezultate pretrage za validno ime | `query.ime = "Amina"`, servis vraća rezultat | `pretragaTerminaService("Amina")` pozvan, status 200 | Uspješno |
| UT-OC-006 | Vraća 400 kada ime nije poslano | `query = {}` | Status 400, poruka sadrži `"najmanje 2 karaktera"`, servis nije pozvan | Uspješno |
| UT-OC-007 | Vraća 400 kada je ime kraće od 2 karaktera | `query.ime = "A"` | Status 400, servis nije pozvan | Uspješno |
| UT-OC-008 | Poziva next pri grešci servisa | Servis baca grešku | `next` pozvan sa greškom | Uspješno |

### 6.3 Testni slučajevi — `getDetaljiTermina`

| ID testa | Naziv testa | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|
| UT-OC-009 | Vraća detalje rezervacije po ID-u | `params.id = "1"`, servis vraća rezervaciju | `getDetaljiTerminaService(1)` pozvan, status 200 | Uspješno |
| UT-OC-010 | Vraća 404 kada rezervacija nije pronađena | Servis vraća `null` | Status 404, `{ poruka: "Rezervacija nije pronađena." }` | Uspješno |
| UT-OC-011 | Vraća 400 za neispravan ID | `params.id = "abc"` | Status 400, `{ poruka: "Neispravan ID rezervacije." }`, servis nije pozvan | Uspješno |
| UT-OC-012 | Poziva next pri grešci servisa | Servis baca grešku | `next` pozvan sa greškom | Uspješno |

### 6.4 Testni slučajevi — `otkaziTermin`

| ID testa | Naziv testa | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|
| UT-OC-013 | Uspješno otkazuje termin sa potvrdom | `body.potvrda = true`, servis vraća poruku | `otkaziTerminService(1)` pozvan, status 200 | Uspješno |
| UT-OC-014 | Vraća 400 kada potvrda nije poslana | `body = {}` | Status 400, poruka sadrži `"potvrda"`, servis nije pozvan | Uspješno |
| UT-OC-015 | Vraća 400 za neispravan ID | `params.id = "abc"`, `body.potvrda = true` | Status 400, `{ poruka: "Neispravan ID rezervacije." }`, servis nije pozvan | Uspješno |
| UT-OC-016 | Prosljeđuje status grešku iz servisa (404) | Servis baca `{ status: 404, poruka: "Rezervacija nije pronađena." }` | Status 404, odgovarajuća poruka, `next` nije pozvan | Uspješno |
| UT-OC-017 | Prosljeđuje status grešku iz servisa (400 — već otkazana) | Servis baca `{ status: 400, poruka: "Rezervacija je već otkazana." }` | Status 400, `next` nije pozvan | Uspješno |
| UT-OC-018 | Poziva next pri neočekivanoj grešci | Servis baca `new Error("DB greška")` | `next` pozvan sa greškom, `res.json` nije pozvan | Uspješno |

### 6.5 Testni slučajevi — `kreirajTerminZaPacijenta`

| ID testa | Naziv testa | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|
| UT-OC-019 | Uspješno kreira termin i upravlja Redis lockom | Validna `body` polja, `redisMock.get` vraća `null` | `redisMock.setex("termin:lock:5", 30, "osoblje")`, servis pozvan, `redisMock.del("termin:lock:5")`, status 201 | Uspješno |
| UT-OC-020 | Vraća 400 kada nedostaju obavezna polja | `body = { idDoktor: 2 }` | Status 400, `{ poruka: "Obavezna polja: idTermina, idDoktor, idPacijent." }`, servis nije pozvan | Uspješno |
| UT-OC-021 | Vraća 409 kada je termin već zaključan | `redisMock.get` vraća `"osoblje"` | Status 409, `{ poruka: "Termin je trenutno u procesu rezervacije." }`, servis nije pozvan | Uspješno |
| UT-OC-022 | Briše Redis lock i poziva next kada servis baci grešku | Servis baca grešku | `redisMock.del("termin:lock:5")` pozvan, `next` pozvan sa greškom, `res.json` nije pozvan | Uspješno |
| UT-OC-023 | Prosljeđuje status grešku iz servisa (404) | Servis baca `{ status: 404, poruka: "Pacijent nije pronađen." }` | Status 404, odgovarajuća poruka, `next` nije pozvan | Uspješno |

### 6.6 Testni slučajevi — `getOtkazaniTermini`

| ID testa | Naziv testa | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|
| UT-OC-024 | Vraća otkazane termine bez filtera datuma | `query = {}` | `getOtkazaniTerminiService(undefined)` pozvan, status 200 | Uspješno |
| UT-OC-025 | Prihvata datum u formatu DD-MM-YYYY | `query.datum = "17-05-2026"` | `getOtkazaniTerminiService` pozvan sa `Date` objektom, status 200 | Uspješno |
| UT-OC-026 | Vraća 400 za neispravan format datuma | `query.datum = "2026-05-17"` (YYYY-MM-DD) | Status 400, `{ poruka: "Neispravan format datuma. Koristite DD-MM-YYYY." }`, servis nije pozvan | Uspješno |
| UT-OC-027 | Poziva next pri grešci servisa | Servis baca grešku | `next` pozvan sa greškom | Uspješno |

### 6.7 Testni slučajevi — `getHitniTermini`

| ID testa | Naziv testa | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|
| UT-OC-028 | Vraća listu hitnih termina | Servis vraća 1 hitni termin | `getHitniTerminiService` pozvan, status 200 | Uspješno |
| UT-OC-029 | Vraća prazan niz kada nema hitnih termina | Servis vraća `[]` | `res.json([])` pozvan, `next` nije pozvan | Uspješno |
| UT-OC-030 | Poziva next pri grešci servisa | Servis baca grešku | `next` pozvan sa greškom | Uspješno |

### 6.8 Testni slučajevi — `getZavrseniPregledi`

| ID testa | Naziv testa | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|
| UT-OC-031 | Vraća sve završene preglede bez filtera | `query = {}` | `getZavrseniPregledService(undefined)` pozvan, status 200 | Uspješno |
| UT-OC-032 | Filtrira završene preglede po idPacijenta | `query.idPacijenta = "5"` | `getZavrseniPregledService(5)` pozvan | Uspješno |
| UT-OC-033 | Vraća 400 za neispravan idPacijenta | `query.idPacijenta = "abc"` | Status 400, `{ poruka: "Neispravan ID pacijenta." }`, servis nije pozvan | Uspješno |
| UT-OC-034 | Poziva next pri grešci servisa | Servis baca grešku | `next` pozvan sa greškom | Uspješno |

### 6.9 Testni slučajevi — `postaviHitnost`

| ID testa | Naziv testa | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|
| UT-OC-035 | Uspješno mijenja hitnost rezervacije | `params.id = "1"`, `body.hitnost = true` | `postaviHitnostService(1, true)` pozvan, status 200 | Uspješno |
| UT-OC-036 | Vraća 400 kada hitnost nije boolean | `body.hitnost = "true"` (string) | Status 400, poruka sadrži `"boolean"`, servis nije pozvan | Uspješno |
| UT-OC-037 | Vraća 400 za neispravan ID | `params.id = "abc"` | Status 400, `{ poruka: "Neispravan ID rezervacije." }`, servis nije pozvan | Uspješno |
| UT-OC-038 | Prosljeđuje status grešku iz servisa (404) | Servis baca `{ status: 404 }` | Status 404, `next` nije pozvan | Uspješno |
| UT-OC-039 | Prosljeđuje status grešku iz servisa (400 — već hitna) | Servis baca `{ status: 400, poruka: "Rezervacija je već označena kao hitna." }` | Status 400, `next` nije pozvan | Uspješno |
| UT-OC-040 | Poziva next pri neočekivanoj grešci | Servis baca `new Error("DB greška")` | `next` pozvan sa greškom, `res.json` nije pozvan | Uspješno |

### 6.10 Testni slučajevi — `pomjeriTermin (osoblje)`

| ID testa | Naziv testa | Testni podaci | Očekivani rezultat | Status |
|---|---|---|---|---|
| UT-OC-041 | Uspješno pomjera termin | `params.id = "1"`, `body.noviTerminId = 7` | `pomjeriTerminService(1, 7)` pozvan, status 200 | Uspješno |
| UT-OC-042 | Vraća 400 za neispravan ID rezervacije | `params.id = "abc"` | Status 400, `{ poruka: "Neispravan ID rezervacije." }`, servis nije pozvan | Uspješno |
| UT-OC-043 | Vraća 400 za neispravan ID novog termina | `body.noviTerminId = "abc"` | Status 400, `{ poruka: "Neispravan ID novog termina." }`, servis nije pozvan | Uspješno |
| UT-OC-044 | Prosljeđuje status grešku iz servisa (404) | Servis baca `{ status: 404 }` | Status 404, `next` nije pozvan | Uspješno |
| UT-OC-045 | Prosljeđuje status grešku iz servisa (409) | Servis baca `{ status: 409, poruka: "Novi termin više nije slobodan." }` | Status 409, `next` nije pozvan | Uspješno |
| UT-OC-046 | Poziva next pri neočekivanoj grešci | Servis baca `new Error("DB greška")` | `next` pozvan sa greškom, `res.json` nije pozvan | Uspješno |

---

---

## 7. Integracioni testovi — `osoblje.integration.test.ts`

Integracioni testovi provjeravaju HTTP sloj ruta za medicinsko osoblje kroz stvarne HTTP zahtjeve koristeći `supertest`. Testovi koriste stvarnu Express aplikaciju, testnu bazu i Redis lockove kako bi simulirali realne scenarije rada osoblja sa terminima i rezervacijama.

**Komanda:** `npm test -- --run src/__integration_tests__/osoblje.integration.test.ts`
**Rezultat:** Uspješno — 15/15 testova prošlo

### 7.1 Metodologija

| Komponenta | Pristup | Razlog |
| :--- | :--- | :--- |
| HTTP sloj | `supertest` + Express app | Testiranje stvarnog request/response ciklusa |
| Prisma test baza | stvarni PrismaClient | Validacija promjena nad terminima i rezervacijama |
| Redis | stvarni Redis test lockovi | Testiranje zaključavanja termina |
| JWT autentifikacija | generisani test tokeni | Simulacija prijavljenog osoblja i pacijenta |
| Email servis | `vi.mock` | Sprječavanje stvarnog slanja emailova |

---

### 7.2 Testni slučajevi — `GET /api/osoblje/termini`

| ID testa | Naziv testa | Zahtjev | Očekivani rezultat | Status |
|---|---|---|---|---|
| IT-OS-001 | Vraća dnevne termine za današnji datum | `GET /api/osoblje/termini` | Status 200, vraćen niz termina | Uspješno |
| IT-OS-002 | Vraća 400 za neispravan format datuma | `datum=nije-datum` | Status 400, poruka sadrži `"datum"` | Uspješno |
| IT-OS-003 | Vraća termine za specifičan datum | `datum=2026-06-01` | Status 200, vraćen niz termina | Uspješno |

---

### 7.3 Testni slučajevi — `GET /api/osoblje/termini/pretraga`

| ID testa | Naziv testa | Zahtjev | Očekivani rezultat | Status |
|---|---|---|---|---|
| IT-OS-004 | Vraća rezultate za validno ime | `ime=An` | Status 200, vraćen niz rezultata | Uspješno |
| IT-OS-005 | Vraća 400 kada ime ima manje od 2 karaktera | `ime=A` | Status 400, poruka sadrži `"2 karaktera"` | Uspješno |
| IT-OS-006 | Vraća 400 kada ime nije poslano | bez query parametra | Status 400 | Uspješno |

---

### 7.4 Testni slučajevi — `GET /api/osoblje/termini/hitni`

| ID testa | Naziv testa | Zahtjev | Očekivani rezultat | Status |
|---|---|---|---|---|
| IT-OS-007 | Vraća listu hitnih termina | `GET /api/osoblje/termini/hitni` | Status 200, vraćen niz hitnih termina | Uspješno |

---

### 7.5 Testni slučajevi — `GET /api/osoblje/termini/otkazani`

| ID testa | Naziv testa | Zahtjev | Očekivani rezultat | Status |
|---|---|---|---|---|
| IT-OS-008 | Vraća sve otkazane termine bez filtera | bez query parametara | Status 200, vraćen niz termina | Uspješno |
| IT-OS-009 | Filtrira otkazane termine po datumu | `datum=01-06-2026` | Status 200, vraćen niz termina | Uspješno |
| IT-OS-010 | Vraća 400 za pogrešan format datuma | `datum=2026-06-01` | Status 400, poruka sadrži `"DD-MM-YYYY"` | Uspješno |

---

### 7.6 Testni slučajevi — `PATCH /api/osoblje/termini/:id/otkazi`

| ID testa | Naziv testa | Zahtjev | Očekivani rezultat | Status |
|---|---|---|---|---|
| IT-OS-011 | Osoblje uspješno otkazuje rezervaciju | Validna rezervacija + `{ potvrda: true }` | Status 200, termin vraćen na `SLOBODAN` | Uspješno |
| IT-OS-012 | Vraća 400 bez potvrde | Prazan body `{}` | Status 400, poruka sadrži `"potvrda"` | Uspješno |
| IT-OS-013 | Vraća 404 za nepostojeću rezervaciju | `id=99999` | Status 404 | Uspješno |

---

### 7.7 Testni slučajevi — `PATCH /api/osoblje/termini/:id/hitnost`

| ID testa | Naziv testa | Zahtjev | Očekivani rezultat | Status |
|---|---|---|---|---|
| IT-OS-014 | Uspješno mijenja hitnost rezervacije | `{ hitnost: true }` | Status 200, `hitnost: true` | Uspješno |
| IT-OS-015 | Vraća 400 kada hitnost nije boolean | `{ hitnost: "true" }` | Status 400, poruka sadrži `"boolean"` | Uspješno |
| IT-OS-016 | Vraća 404 za nepostojeću rezervaciju | `id=99999` | Status 404 | Uspješno |

---

### 7.8 Pregled rezultata po grupama

| Grupa testova | Broj testova | Rezultat |
|---|---:|---|
| `GET /api/osoblje/termini` | 3 | Uspješno |
| `GET /api/osoblje/termini/pretraga` | 3 | Uspješno |
| `GET /api/osoblje/termini/hitni` | 1 | Uspješno |
| `GET /api/osoblje/termini/otkazani` | 3 | Uspješno |
| `PATCH /api/osoblje/termini/:id/otkazi` | 3 | Uspješno |
| `PATCH /api/osoblje/termini/:id/hitnost` | 3 | Uspješno |
| **Ukupno** | **16** | **Uspješno** |

---

## 8. Ažurirani ukupni pregled

| Tip testiranja | Fajl | Testova | Rezultat |
|---|---|---:|---|
| Unit (kontroler) | `doctorController.test.ts` | 10 | Uspješno |
| Unit (kontroler) | `reservationController.test.ts` | 34 | Uspješno |
| Unit (kontroler) | `OsobljeController.test.ts` | 46 | Uspješno |
| Integracioni | `osoblje.integration.test.ts` | 16 | Uspješno |
| **Ukupno** | | **106** | **Uspješno** |

---

**Rezultat:** 106/106 testova prošlo
