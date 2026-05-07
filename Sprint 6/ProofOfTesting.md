## 1. Metodologija i Način Evidentiranja

U skladu sa definisanom Test Strategijom, rezultati su dokumentovani koristeći kombinaciju tehničkih asercija (Assertions) i vizuelnih dokaza (Screenshots).

### 1.1 Statusi testiranja
- ✅ **Uspješno (Passed):** Funkcionalnost radi prema Acceptance kriterijima.
- ❌ **Neuspješno (Failed):** Pronađena je greška ili odstupanje.

---

## 2. Detaljni prikaz Unit testova (Logic Validation)

### 2.1 Modul: doctorController.ts (100% Coverage)
Fokus: Pretraga, filtriranje doktora i ispravna konverzija tipova podataka.

| ID | Test Case | Opis provjere | Status |
| :--- | :--- | :--- | :--- |
| DR-01 | `getSviDoktori_BezFiltera` | Vraća kompletnu listu doktora iz baze | ✅ PASS |
| DR-02 | `getSviDoktori_FilterSpec` | Case-insensitive pretraga po specijalizaciji | ✅ PASS |
| DR-03 | `getSviDoktori_OdjelId` | Provjera konverzije stringa "2" u integer 2 za Prismu | ✅ PASS |
| DR-04 | `getDoktorById_Uspjeh` | Pronalazi doktora sa svim povezanim (include) podacima | ✅ PASS |
| DR-05 | `getDoktorById_NaN` | Poziva `next` s greškom ako ID nije broj | ✅ PASS |
| DR-06 | `getRaspored_Sortirano` | Provjera da su dani u sedmici sortirani rastuće (`asc`) | ✅ PASS |

### 2.2 emailService.ts (100% Coverage)
Fokus: Validacija automatizovanih obavijesti (US-31, US-08).

| ID | Test Case | Opis provjere | Status |
| :--- | :--- | :--- | :--- |
| EM-01 | `posaljiPotvrdu_HappyPath` | Slanje potvrde sa ispravnim podacima pacijenta | ✅ PASS |
| EM-02 | `vrijeme_Format_930` | Konverzija vremena iz 930 u "09:30" (Formatiranje) | ✅ PASS |
| EM-03 | `hitnost_True_Oznaka` | Provjera da li se u mailu vidi tag "Hitna rezervacija" | ✅ PASS |
| EM-04 | `komentar_Prikaz` | Prikazivanje napomene pacijenta u tijelu maila | ✅ PASS |
| EM-05 | `posaljiPodsjetnik_US31` | Slanje podsjetnika 24h prije termina (US-31) | ✅ PASS |

### 2.3 reservationController.ts (77.77% Coverage)
Fokus: Zakazivanje, otkazivanje i upravljanje komentarima (US-06, US-10, US-22).

| ID | Test Case | Opis provjere | Status |
| :--- | :--- | :--- | :--- |
| RS-01 | `kreirajRezervaciju_Success` | Uspješno kreiranje i brisanje Redis locka | ✅ PASS |
| RS-02 | `kreirajRezervaciju_Dupla` | Zabrana (409) ako rezervacija već postoji (US-13) | ✅ PASS |
| RS-03 | `kreirajRezervaciju_Proslost` | Zabrana zakazivanja termina u prošlosti (US-32) | ✅ PASS |
| RS-04 | `otkazi_Pacijent_24h` | Dozvoljeno otkazivanje više od 24h unaprijed | ✅ PASS |
| RS-05 | `otkazi_Pacijent_Zabrana` | Zabrana otkazivanja manje od 24h (US-10 AC2) | ✅ PASS |
| RS-06 | `otkazi_Osoblje_Email` | Osoblje otkazuje i pacijent dobija obavijest (US-28) | ✅ PASS |

### 2.4 terminController.ts (95.00% Coverage)
Fokus: Pretraga slobodnih termina i Concurrency (US-05, US-12).

| ID | Test Case | Opis provjere | Status |
| :--- | :--- | :--- | :--- |
| TR-01 | `getSlobodni_Status` | Vraća isključivo termine sa statusom "SLOBODAN" | ✅ PASS |
| TR-02 | `zaključajTermin_TTL` | Postavljanje Redis locka na tačno 120 sekundi | ✅ PASS |
| TR-03 | `zaključaj_DrugiKorisnik` | Zabrana locka ako je drugi korisnik već zauzeo (409) | ✅ PASS |
| TR-04 | `oslobodiTermin_Redis` | Uspješno brisanje locka iz Redis baze | ✅ PASS |

---


