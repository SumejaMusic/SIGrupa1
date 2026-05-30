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

