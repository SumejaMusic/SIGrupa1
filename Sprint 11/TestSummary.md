# 7. Test Summary / QA izvještaj

## 7.1. Uvod
U ovom sprintu sproveden je sveobuhvatan QA proces kako bi se osigurala stabilnost bolničkog sistema. Testiranje je podijeljeno u nekoliko nivoa, počevši od automatizovanih Unit i Integracionih testova, do naprednih testova performansi i sigurnosti pod opterećenjem.

---

## 7.2. Unit Testovi
Unit testovi su korišteni za provjeru izolovane logike svakog kontrolera i servisa. Ovim testovima potvrđujemo da osnovne funkcije sistema (poput validacije podataka i računanja termina) rade besprijekorno u izolaciji.

| Metrika | Vrijednost |
| :--- | :--- |
| **Test Suites (Fajlovi)** | 14 prošlo |
| **Ukupno testova** | 319 prošlo |
| **Vrijeme izvršavanja** | 2.23 s |
| **Status** | ✅ **100% Pass** |

**Pokriveni moduli:**
- `adminController` (53 testa), `doctorController` (27 testova), `terminController` (31 test)
- `registration`, `authService`, `userProfile`, `auditLog` i drugi.

<img width="835" alt="Unit Test Results" src="https://github.com/user-attachments/assets/1d43c620-dccb-4df6-81b7-bd04a0436f78" />

---

## 7.3. Integracioni Testovi
Integracioni testovi provjeravaju saradnju između API endpointova i baze podataka. Ovi testovi osiguravaju da su kompleksni tokovi (poput rezervacije termina kroz više slojeva aplikacije) ispravno implementirani.

| Metrika | Vrijednost |
| :--- | :--- |
| **Test Suites (Fajlovi)** | 11 prošlo |
| **Ukupno testova** | 128 prošlo (9 skipped, 2 todo) |
| **Vrijeme izvršavanja** | 12.69 s |
| **Status** | ✅ **Pass** |

<img width="797" alt="Integration Test Results" src="https://github.com/user-attachments/assets/66176693-d7a5-4942-9ed8-2a2c921b0fca" />

### 7.3.1. Edge Case i Concurrency Testovi
Sprovedeni su dodatni testovi fokusirani na rubne slučajeve (*edge cases*), istovremene zahtjeve (*race conditions*) i transakcione rollback mehanizme.

*   **Ukupno testova:** 82 prošlo
*   **Vrijeme izvršavanja:** 85 ms
*   **Status:** ✅ **100% Pass**

#### Pokrivene kategorije:
1.  **Input Validation (51 test):** Negativni ID-evi, nevalidni emailovi, neovlašteni pristupi (401/403).
2.  **Concurrency (9 testova):** Redis *lock* mehanizam, sprječavanje duplih rezervacija, istovremeno otkazivanje.
3.  **Rollback & Integrity (22 testa):** Cleanup nakon grešaka, fallback za obrisane korisnike, validacija 404 Found.

---

## 7.4. Sigurnosno testiranje (Penetration Testing)
Sprovedeno radi identifikacije ranjivosti i zaštite osjetljivih podataka pacijenata.

*   **Alat:** OWASP ZAP 2.17.0
*   **Tester:** Hana Mahmutović
*   **Metoda:** Automatski scan + Manual Explore (Black Box)

### 7.4.1. Sažetak nalaza
| Ozbiljnost | Broj nalaza | Status |
| :--- | :--- | :--- |
| 🔴 Visoka (High) | 0 | ✅ Sigurno |
| 🟠 Srednja (Medium) | 5 | Potrebno popraviti |
| 🟡 Niska (Low) | 5 | Preporučeno popraviti |

### 7.4.2. Ključne preporuke (Medium)
1.  **CSP Header:** Postaviti Content Security Policy za sprječavanje XSS napada.
2.  **Anti-clickjacking:** Dodati `X-Frame-Options: DENY` u Express middleware.
3.  **Session ID:** Isključivo korištenje WebSocket transporta za Socket.IO sesije.

---

## 7.5. RBAC Testiranje (Pristupna kontrola)
Ručno testirana kontrola pristupa zasnovana na ulogama pomoću Postmana i JWT tokena.

| Endpoint | Pacijent | Doktor | Admin | Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET /api/admin/korisnici` | 🚫 403 | 🚫 403 | ✅ 200 | ✅ PASS |
| `GET /api/doktori` | ✅ 200 | ✅ 200 | ✅ 200 | ✅ PASS |
| `GET /api/odjeli` | ✅ 200 | ✅ 200 | ✅ 200 | ✅ PASS |

**Zaključak:** Sistem ispravno izoluje administrativne podatke od neovlaštenih uloga.

---

## 7.6. Poznati testni propusti i ograničenja
- Nedostatak **HSTS** headera (Strict-Transport-Security).
- Nedostatak **Cache-Control** headera na API endpointima sa medicinskim podacima.
- Vidljivost Express frameworka kroz `X-Powered-By` header.

---

## 7.7. Performansno testiranje (NFR-20)
Verifikacija brzine sistema nad velikim skupom podataka.

### 7.7.1. Seeding proces
Tabela `AuditLog` je napunjena sa **50.000 zapisa** koristeći Faker biblioteku.
-   **Trajanje unosa:** 49.902 sekunde.
-   **Status:** ✅ **USPJEŠNO**

### 7.7.2. Benchmark rezultati (EXPLAIN ANALYZE)
| Parametar | Rezultat |
| :--- | :--- |
| **Ukupan broj redova** | 50.000 |
| **Vrijeme izvršavanja upita** | **203.727 ms** |
| **Status zahtjeva NFR-20** | ✅ **ISPUNJENO** |

**Zaključak:** Baza podataka obrađuje kompleksne upite nad 50.000 zapisa u vremenu od **~200ms**, što potvrđuje visoku skalabilnost sistema.

**Dokazi (Terminal Seeding & Execution):**
<img width="931" alt="Performance Seeding" src="https://github.com/user-attachments/assets/9a9a0e9a-b915-42ba-b076-3221bac90f5f" />
<img width="1060" alt="Query Explain Analyze" src="https://github.com/user-attachments/assets/8e91343e-a0ad-47de-82ca-7cd54b2f77bf" />

---

## 7.8. Load i Stress testiranje (k6)
Izvršen set od 12 automatizovanih k6 scenarija za potvrdu stabilnosti pod opterećenjem.

### 7.8.1. Pregled modula i rezultata
| Modul (Skripta) | Fokus testiranja | Vrijeme odziva (avg) | Status |
| :--- | :--- | :--- | :--- |
| **Autentifikacija** | Login proces i JWT validacija | 269.25 ms | ✅ PASS |
| **Konkurencija** | Race Condition (istovremene rezervacije) | **30.22 ms** | ✅ PASS |
| **NFR-22 (Lock)** | Sprječavanje duplih rezervacija | 1.13 s | ✅ PASS |
| **Pacijenti** | **Privatnost:** Sakrivanje JMBG-a | 737.54 ms | ✅ PASS |
| **Pregledi** | Kreiranje nalaza i dijagnoza | 147.81 ms | ✅ PASS |
| **Osoblje (Staff)** | Dashboard i PDF nalazi | 638.48 ms | ✅ PASS |

### 7.8.2. Ključni nalazi NFR verifikacije
1.  **NFR-22:** Potvrđeno da Redis lock ispravno dodjeljuje pristup samo jednom pacijentu pri simultanom zahtjevu (409 Conflict za drugog).
2.  **Privatnost:** Testovi su potvrdili da osjetljivi podaci (JMBG) nisu izloženi u javnim API odgovorima.
3.  **Performanse:** Čak i pri simulaciji 20+ VUs, prosječno vrijeme odziva ostaje ispod **500ms** za većinu modula.

### 7.8.3. Vizuelni dokazi izvršavanja (k6 Logovi)
<img width="545" alt="k6 Result 1" src="https://github.com/user-attachments/assets/87091678-f14c-40f0-9266-ee3e5250c74a" />
<img width="824" alt="k6 Result 2" src="https://github.com/user-attachments/assets/54753976-06c1-43a0-b7a1-86b5fa0e2b06" />
<img width="825" alt="k6 Result 3" src="https://github.com/user-attachments/assets/f83c9b61-4c1e-41af-9a58-ebdadd0d110c" />
<img width="765" alt="k6 Result 4" src="https://github.com/user-attachments/assets/9bcc23fb-df6e-4940-9987-37c632aab74d" />
<img width="848" alt="k6 Result 5" src="https://github.com/user-attachments/assets/b5c4f4df-f94c-460e-9d73-f3297e71b984" />
<img width="405" alt="k6 Result 6" src="https://github.com/user-attachments/assets/0568a87e-4ca1-4d4c-8e6a-7aad00ca5189" />
<img width="582" alt="k6 Result 7" src="https://github.com/user-attachments/assets/a9d0a953-7294-4c4f-81c5-e73250a33046" />

---
**Zaključak:** Sistem u potpunosti ispunjava sve funkcionalne i nefunkcionalne (NFR) zahtjeve testirane u Sprintu 11.
