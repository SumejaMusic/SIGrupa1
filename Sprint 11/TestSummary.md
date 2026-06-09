# 7. Test Summary / QA izvještaj

## 7.1. Uvod
U ovom sprintu sproveden je sveobuhvatan QA proces kako bi se osigurala stabilnost bolničkog sistema. Testiranje je podijeljeno u nekoliko nivoa, počevši od automatizovanih Unit i Integracionih testova, do naprednih testova performansi i sigurnosti.

---

## 7.2. Unit Testovi
Unit testovi su korišteni za provjeru izolovane logike svakog kontrolera i servisa. Ovim testovima potvrđujemo da osnovne funkcije sistema (poput validacije podataka i računanja termina) rade besprijekorno.

**Rezultati Unit testiranja (Vitest):**
*   **Test Suites (Fajlovi):** 14 prošlo
*   **Ukupno testova:** 319 prošlo
*   **Vrijeme izvršavanja:** 2.23 s
*   **Status:** ✅ 100% Pass

**Pokriveni moduli:**
- `adminController` (53 testa)
- `doctorController` (27 testova)
- `terminController` (31 test)
- `registration`, `authService`, `userProfile`, `auditLog` i drugi.

<img width="835" height="423" alt="{DEDF9838-1954-428F-B51C-0C6F06CCB72E}" src="https://github.com/user-attachments/assets/1d43c620-dccb-4df6-81b7-bd04a0436f78" />

---

## 7.3. Integracioni Testovi
Integracioni testovi provjeravaju saradnju između API endpointova i baze podataka. Ovi testovi osiguravaju da su kompleksni tokovi (poput rezervacije termina kroz više slojeva aplikacije) ispravno implementirani.

**Rezultati integracionog testiranja (Vitest):**
*   **Test Suites (Fajlovi):** 11 prošlo
*   **Ukupno testova:** 128 prošlo (9 skipped, 2 todo)
*   **Vrijeme izvršavanja:** 12.69 s
*   **Status:** ✅ Pass

<img width="797" height="166" alt="{EFA56DDB-1707-42C5-B8D8-05288B9E981F}" src="https://github.com/user-attachments/assets/66176693-d7a5-4942-9ed8-2a2c921b0fca" />

# 7.3.1. Edge Case i Concurrency Testovi

Pored standardnih integracionih testova, sprovedeni su dodatni testovi fokusirani na rubne slučajeve (*edge cases*), istovremene zahtjeve (*race conditions*) i djelimične zapise/transakcione greške. Cilj ovih testova bio je osigurati otpornost sistema na neispravne unose, konkurentni pristup resursima i neočekivane greške baze podataka ili Redis servisa.

### Rezultati testiranja (`edgeCases.test.ts`):
* **Ukupno testova:** 82 prošlo
* **Vrijeme izvršavanja:** 85 ms
* **Status:** ✅ 100% Pass

---

### Pokrivene kategorije testiranja

#### 1. Neispravni unosi (Input Validation)
Testirani su različiti scenariji nevalidnih zahtjeva i neispravnih podataka:
* Negativni i nepostojeći ID-evi (`terminId`, `doktorId`)
* Nedostajući parametri i *body* polja
* Nevalidni email formati i lozinke
* Neovlašten pristup (`401 Unauthorized`)
* Pokušaji pristupa tuđim rezervacijama (`403 Forbidden`)
* Validacija komentara, registracije i resetovanja lozinke

**Broj testova:** 51

#### 2. Istovremeni zahtjevi (Concurrency / Race Conditions)
Testirani su scenariji konkurentnog pristupa sistemu kako bi se spriječile duple rezervacije i konflikti nad terminima:
* Redis *lock* mehanizam za zaključavanje termina
* Dupla rezervacija istog termina
* Preklapanje termina kod različitih doktora
* Istekli ili nevalidni *lock*-ovi
* Istovremeno otkazivanje termina

**Broj testova:** 9

#### 3. Djelimični zapisi i rollback mehanizmi
Provjereno je ponašanje sistema u slučaju pada transakcije ili nepotpunih podataka:
* *Rollback* transakcija pri grešci baze
* *Cleanup* uploadovanih nalaza nakon neuspješne transakcije
* Propagacija Prisma i Redis grešaka putem `next()`
* *Fallback* ponašanje za obrisane korisnike u komentarima
* Validacija nepostojećih resursa (`404 Not Found`)

**Broj testova:** 22

---

## 7.4. Sigurnosno testiranje (Penetration Testing)
Sigurnosno testiranje je sprovedeno kako bi se identifikovale potencijalne ranjivosti sistema i osigurala zaštita osjetljivih podataka pacijenata.

*   **Alat:** OWASP ZAP 2.17.0
*   **Tester:** Hana Mahmutović
*   **Metoda:** Automatski scan + Manual Explore (Black Box)

### 7.4.1. Sažetak nalaza
Tokom testiranja nije pronađena nijedna kritična (High) ranjivost. Identifikovane su srednje i niske ranjivosti koje se primarno odnose na sigurnosne headere.

| Ozbiljnost | Broj nalaza | Status |
| :--- | :--- | :--- |
| 🔴 Visoka (High) | 0 | ✅ Sigurno |
| 🟠 Srednja (Medium) | 5 | Potrebno popraviti |
| 🟡 Niska (Low) | 5 | Preporučeno popraviti |

### 7.4.2. Ključne preporuke (Srednje ranjivosti)
1. **CSP Header:** Potrebno je postaviti Content Security Policy kako bi se spriječili XSS napadi.
2. **Anti-clickjacking:** Dodati `X-Frame-Options: DENY` u Express middleware.
3. **Session ID:** Socket.IO sesije se prenose u URL-u; preporučuje se isključivo korištenje WebSocket transporta.

---

## 7.5. RBAC Testiranje (Pristupna kontrola)
Ručno je testirana kontrola pristupa zasnovana na ulogama (Role-Based Access Control) pomoću Postman-a i JWT tokena.

**Rezultati matrice pristupa:**

| Endpoint | Pacijent | Doktor | Admin | Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET /api/admin/korisnici` | 🚫 403 | 🚫 403 | ✅ 200 | ✅ PASS |
| `GET /api/doktori` | ✅ 200 | ✅ 200 | ✅ 200 | ✅ PASS |
| `GET /api/odjeli` | ✅ 200 | ✅ 200 | ✅ 200 | ✅ PASS |

**Zaključak:** Sistem ispravno identifikuje korisničke uloge i onemogućava pacijentima pristup administrativnim podacima.

---

## 7.6. Poznati testni propusti i ograničenja
Na osnovu sigurnosnog skeniranja, identifikovani su sljedeći propusti koje je potrebno adresirati u narednim iteracijama:
- Nedostatak **HSTS** headera (Strict-Transport-Security).
- Nedostatak **Cache-Control** headera na API endpointima koji vraćaju medicinske podatke (rizik od keširanja na javnim računarima).
- Informacije o serveru su vidljive kroz `X-Powered-By: Express` header.

---


