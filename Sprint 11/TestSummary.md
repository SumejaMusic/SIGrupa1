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

---

