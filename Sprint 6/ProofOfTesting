# Proof of Testing — Sprint 6

**Projekat:** Sistem za zakazivanje termina (SIGrupa1)  
**Datum:** 24.05.2024.  
**Alati:** Vitest, v8 Coverage, Prisma Mock, Redis Mock, Nodemailer, k6

---

## 1. Metodologija i Način Evidentiranja

U skladu sa definisanom Test Strategijom, rezultati su dokumentovani koristeći kombinaciju tehničkih asercija i vizuelnih dokaza.

### 1.1 Statusi testiranja
Svaki testni scenario može imati dva statusa:
- ✅ **Uspješno (Passed):** Funkcionalnost radi tačno onako kako je opisano u Acceptance kriterijima.
- ❌ **Neuspješno (Failed):** Pronađena je greška ili odstupanje od očekivanog ponašanja.

### 1.2 Dokumentovanje dokaza
Kao dokaz ispravnosti, u izvještaju su korišteni:
- **Kodne asercije:** Direktni ispisi iz Vitest-a koji potvrđuju očekivani ishod (npr. `expect(status).toBe(200)`).
- **Screenshots:** Snimke ekrana UI komponenti i terminala.
- **Ispisi iz baze/logova:** Potvrda upisa podataka (npr. Redis ključevi ili Prisma zapisi).

### 1.3 Standardi pisanja testova
- **AAA Obrazac:** Svi unit testovi su pisani u formatu *Arrange-Act-Assert* radi maksimalne čitljivosti.
- **Konvencija imenovanja:** Korišten je format `[Funkcionalnost]_[Scenario]_[OcekivaniIshod]` (npr. `getDoktorById_NepostojeciID_Vraca404`).

---

## 2. Pregled rezultata (Summary)

| Ukupno testova | Prošlo | Greške | Pokrivenost (Lines) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **111** | 111 | 0 | **82.08%** | **PROŠLO** ✅ |

---

## 3. Detaljni izvještaj po nivoima

### 3.1 Unit Testovi (Vitest)
Fokus na izolaciji logike kontrolera i servisa.

| ID | Modul / Kontroler | Opis provjere (primjeri) | Tehnički dokaz (Assertion) | Status |
| :--- | :--- | :--- | :--- | :--- |
| UT-01 | **Doctor Controller** | Provjera pretrage po odjelu | `expect(where.idOdjela).toBe(2)` | PASS |
| UT-02 | **Termin Controller** | Provjera postavljanja Redis locka | `redisMock.setex("key", 120, "1")` | PASS |
| UT-03 | **Email Service** | Formatiranje vremena u emailu | `expect(poziv.html).toContain("09:30")` | PASS |
| UT-04 | **Reservation Ctrl** | Zabrana rezervacije u prošlosti | `expect(res.status).toBe(400)` | PASS |

### 3.2 Korisničko prihvatno testiranje (UAT)
Ručna validacija kroz browser (Chrome) prema Acceptance kriterijima.

| ID | Scenario | Testni koraci | Očekivani rezultat | Status |
| :--- | :--- | :--- | :--- | :--- |
| UAT-01 | Zakazivanje termina | Odabir doktora -> Termin -> Potvrda | Rezervacija vidljiva u profilu | PASS |
| UAT-02 | Otkazivanje (<24h) | Pokušaj otkazivanja sutrašnjeg termina | Poruka o zabrani otkazivanja | PASS |

---

## 4. Analiza pokrivenosti (Code Coverage)
Izvještaj generisan pomoću `@vitest/coverage-v8`.

| Modul / Fajl | % Lines | % Branches | % Functions |
| :--- | :--- | :--- | :--- |
| **emailService.ts** | 100.00% | 100.00% | 100.00% |
| **doctorController.ts** | 100.00% | 100.00% | 100.00% |
| **terminController.ts** | 95.00% | 92.85% | 100.00% |
| **reservationController.ts**| 77.77% | 79.16% | 60.00% |

---

## 5. Evidencija pronađenih grešaka (Bug Log)

| Bug ID | Opis problema | Ozbiljnost | Status | Rješenje |
| :--- | :--- | :--- | :--- | :--- |
| **BG-01** | `getDoktorById` bacao NaN | Srednja | Riješeno | Dodan `parseInt` u kontroler. |
| **BG-02** | Redis lock nije brisan | Visoka | Riješeno | Dodana `try-finally` blokada. |

---

## 6. Zaključak
Proces dokumentovanja je sproveden transparentno, sa jasnom vezom između testova i zahtjeva korisnika. Visok stepen pokrivenosti kritičnih modula (100%) garantuje pouzdanost isporučenog koda.

---
**Dokazi (Screenshots):**
*(Ovdje priloži snimke terminala)*
