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
