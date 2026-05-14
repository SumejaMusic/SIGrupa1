# Proof of Testing — Sprint 7
## Release 4: Autentifikacija i sigurnosni sloj
---

## Osnovne informacije

| Stavka | Opis |
| :--- | :--- |
| **Sprint** | Sprint 7 |
| **Release** | Release 4 — Autentifikacija i sigurnosni sloj |
| **Test framework** | Vitest v4.1.5 |
| **Okruženje** | CI/CD (GitHub Actions) |
| **Datum izvršavanja** | 14.05.2026. |
| **Ukupno testova** | 5 |
| **Prošlo** | 5  |
| **Palo** | 0  |

---

## 1. Metodologija i Način Evidentiranja

U skladu sa definisanom Test Strategijom, rezultati su dokumentovani koristeći tehničke asercije (Assertions) uz mock izolaciju Prisma sloja kako bi se testirala isključivo poslovna logika `authService.ts`, nezavisno od baze podataka.

### 1.1 Statusi testiranja

-  **Uspješno (Passed):** Funkcionalnost radi prema Acceptance kriterijima.
-  **Neuspješno (Failed):** Pronađena je greška ili odstupanje.

### 1.2 Mock strategija

| Komponenta | Mock | Razlog |
| :--- | :--- | :--- |
| `../lib/prisma.js` | `prismaMock` (vitest mock) | Izolacija od stvarne baze podataka |
| `../lib/encryption.js` | `enkriptuj: (v) => "enc:" + v` | Deterministično ponašanje enkripcije u testu |
| `process.env.JWT_SECRET` | `"test-secret"` | Kontrolisano potpisivanje JWT tokena |

---

## 2. Detaljni prikaz Unit testova

### 2.1 Modul: `authService.ts` — 100% Coverage

Fokus: Detekcija neobičnog ponašanja i blokiranje naloga — **US-26** (NFR-05, RR-08).

| ID | Test Case | Opis provjere | Pokriva | Status |
| :--- | :--- | :--- | :--- | :--- |
| AU-01 | `povecavaBrojNeuspjelih` | Povećava `brojNeuspjelihPrijava` pri pogrešnoj lozinci; audit log bilježi `LOGIN_NEUSPJESAN` | NFR-05 |  PASS |
| AU-02 | `upozorenje_CetvrtiPokusaj` | Na 4. neuspjelom pokušaju vraća `kod: "LOGIN_ATTEMPT_WARNING"` uz status 401 | US-26 AC2 |  PASS |
| AU-03 | `zakljucava_PetiPokusaj` | Na 5. pokušaju postavlja `nalogZakljucan: true` i bilježi `LOGIN_NALOG_ZAKLJUCAN` u audit logu | US-26 AC3, NFR-05 | PASS |
| AU-04 | `odbija_ZakljucanNalog` | Odbija svaki pokušaj prijave ako je `nalogZakljucan: true` (status 423, `ACCOUNT_LOCKED`) | US-26 AC4 | PASS |
| AU-05 | `resetuje_NakonUspjesnePrijave` | Resetuje `brojNeuspjelihPrijava` na `0` i vraća JWT token nakon ispravne lozinke | US-03, US-26 |  PASS |

---

## 3. Detalji po testu

### AU-01 — Povećavanje broja neuspjelih prijava

**Preduslov:** Korisnik ima `brojNeuspjelihPrijava: 2`, unosi pogrešnu lozinku.

**Provjere:**
- Service baca grešku sa `status: 401`
- `korisnik.update` pozvan sa `brojNeuspjelihPrijava: 3`, `nalogZakljucan: false`
- `auditLog.create` pozvan sa `tipAkcije: "LOGIN_NEUSPJESAN"`, `izmenjenaTabela: "Korisnik"`

---

### AU-02 — Upozorenje na četvrtom pokušaju

**Preduslov:** Korisnik ima `brojNeuspjelihPrijava: 3`, unosi pogrešnu lozinku.

**Provjere:**
- Service baca grešku sa `status: 401` i `kod: "LOGIN_ATTEMPT_WARNING"`
- `korisnik.update` pozvan sa `brojNeuspjelihPrijava: 4`, `nalogZakljucan: false`

---

### AU-03 — Zaključavanje naloga na petom pokušaju

**Preduslov:** Korisnik ima `brojNeuspjelihPrijava: 4`, unosi pogrešnu lozinku.

**Provjere:**
- Service baca grešku sa `status: 423` i `kod: "ACCOUNT_LOCKED"`
- `korisnik.update` pozvan sa `brojNeuspjelihPrijava: 5`, `nalogZakljucan: true`, `vrijemeZakljucavanja: Date`
- `auditLog.create` pozvan sa `tipAkcije: "LOGIN_NALOG_ZAKLJUCAN"`

---

### AU-04 — Odbijanje prijave zaključanog naloga

**Preduslov:** Korisnik ima `nalogZakljucan: true`, `vrijemeZakljucavanja` postavljeno, unosi ispravnu lozinku.

**Provjere:**
- Service baca grešku sa `status: 423` i `kod: "ACCOUNT_LOCKED"`
- `korisnik.update` **nije pozvan** — nalog se ne modificira

---

### AU-05 — Reset broja pokušaja nakon uspješne prijave

**Preduslov:** Korisnik ima `brojNeuspjelihPrijava: 2`, unosi ispravnu lozinku.

**Provjere:**
- Service vraća objekt sa `id`, `email` i `token` (validan JWT string)
- `korisnik.update` pozvan sa `brojNeuspjelihPrijava: 0`, `nalogZakljucan: false`, `vrijemeZakljucavanja: null`, `zadnjiNeuspjeliPokusaj: null`

---

## 4. CI/CD izvršavanje — Finalni izlaz

```
 RUN  v4.1.5

  src/__tests__/authService.test.ts (5 tests) 24ms

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  07:37:22
   Duration  707ms
```

---

> **Napomena:** Ovaj dokument pokriva isključivo testove implementirane u sklopu Sprint 7 — Release 4 (Autentifikacija i sigurnosni sloj). Testovi rezervacijskog sistema i termina dokumentovani su u Proof of Testing za Sprint 6.

**Release:** Release 4 — Autentifikacija i sigurnosni sloj | **Sprint:** Sprint 7 | **Rezultat:** 5/5 testova prošlo 

