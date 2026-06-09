
# Sprint Review Summary

Ovaj izvještaj sumira rezultate završenog sprinta, identifikuje isporučene vrijednosti i definiše korekcije plana na osnovu povratnih informacija.

---

## Osnovne informacije

| Stavka | Opis |
| :--- | :--- |
| **Sprint** | Sprint 10 |
| **Release** | Release 4 — Admin panel, statistike, menadžment |
| **Datum review-a** | 02.06.2026. |
| **Tim** | Sumeja Mušić, Merjem Milišić, Hamza Husović, Kenan Hatibović, Amina Alispahić, Almedin Šehić, Lamija Halilović, Hana Mahmutović |

---

## Planirani sprint goal

Implementacija admin i menadžment panela sa audit logom i statistikama, proširenje pacijentovog profila sa medicinskim podacima, uvođenje potvrde dolaska pacijenta u realnom vremenu te generisanje PDF uputnica od strane doktora za potrebe Release 4.

---

## Šta je završeno

Sve planirane stavke iz Sprint Backloga su uspješno završene:

| ID | Naziv | Status |
|----|-------|--------|
| US-18 | Menadžment panel — kontrolna tabla sa ključnim metrikama, pregled termina i zauzetosti resursa | ✅ Završeno |
| US-33 | Admin panel — backend funkcionalnosti (CRUD korisnici, RBAC zaštita, validacija uloga) | ✅ Završeno |
| US-34 | Logovanje svih akcija u sistemu — audit log s filterima u admin panelu | ✅ Završeno |
| US-29 | Statistika zdravstvene ustanove — grafički prikaz metrika s filtriranjem po periodu | ✅ Završeno |
| US-30 | Export statistike u CSV formatu | ✅ Završeno |
| US-40 | Zahtjev za deaktivaciju i anonimizaciju profila (GDPR) | ✅ Završeno |
| US-45 | Potvrda dolaska pacijenta jednim klikom s real-time ažuriranjem putem WebSocket-a | ✅ Završeno |
| US-46 | Proširenje medicinskog profila pacijenta (krvna grupa, alergije, hronične bolesti, operacije) | ✅ Završeno |
| US-47 | Generisanje PDF uputnice specijalistu direktno iz doktorovog interfejsa | ✅ Završeno |

---

## Šta nije završeno

Sve planirane stavke su završene. Nema prenesenih stavki u naredni sprint.

---

## Demonstrirane funkcionalnosti i artefakti

Na sprint review sesiji demonstrirane su sljedeće funkcionalnosti:

- **Menadžment panel** — pregled ključnih metrika ustanove, aktivnosti medicinskog osoblja i zauzetosti resursa
- **Admin panel** — upravljanje korisnicima i ulogama s RBAC zaštitom, CRUD operacije nad korisničkim nalozima
- **Audit log** — prikaz svih kritičnih akcija u sistemu s mogućnošću pretrage i filtriranja po tipu akcije, korisniku i vremenskom periodu
- **Statistički modul** — grafički prikaz opterećenja sistema s exportom u CSV formatu
- **GDPR modul** — forma za podnošenje zahtjeva za deaktivaciju i anonimizaciju profila bez kaskadnog brisanja medicinskih zapisa
- **Potvrda dolaska** — dugme za potvrdu dolaska pacijenta jednim klikom u panelu medicinskog osoblja s real-time promjenom statusa na doktorovom dashboardu (WebSocket, vidljivo u roku od 2 sekunde)
- **Prošireni medicinski profil** — unos i prikaz krvne grupe, alergija, hroničnih bolesti, podatka o doniranju krvi i prethodnih operacija
- **PDF uputnica** — generisanje i preuzimanje formalne uputnice specijalistu direktno iz doktorovog interfejsa

---

## Glavni problemi i blokeri

- **Formatiranje datuma** — jedini tehnički problem tokom sprinta bio je vezan za prikaz datuma. Datumi su morali biti konvertovani u **UTC format** jer Render serveri rade u UTC vremenskoj zoni, što je uzrokovalo pomak pri prikazu termina. Problem je riješen konverzijom na frontendu pri prikazu podataka korisniku.

Nije bilo blokatora koji su ugrozili cilj sprinta.

---

## Ključne odluke donesene u sprintu

### DEC-010 — Uvođenje novih user storija u Sprint 10

| Stavka | Opis |
| :--- | :--- |
| **ID odluke** | DEC-010 |
| **Datum** | 30.05.2026. |
| **Naziv odluke** | Uvođenje novih funkcionalnosti u Sprint 10: generisanje PDF uputnice specijalistu, potvrda dolaska pacijenta jednim klikom i proširenje medicinskog profila pacijenta |
| **Opis problema** | Tokom Sprint 9 identificirane su tri funkcionalne potrebe koje nisu bile planirane u inicijalnom backlogu: (1) doktori trebaju moći kreirati i izdavati formalne uputnice specijalistima direktno iz sistema; (2) medicinsko osoblje nema način da jednim klikom potvrdi dolazak pacijenta i obavijesti doktora u realnom vremenu; (3) sistem ne pruža doktorima uvid u ključne medicinske podatke pacijenta pri pregledu. |
| **Odabrana opcija** | Sve tri funkcionalnosti uvrstiti u Sprint 10 kao samostalne user storije (US-45, US-46, US-47) |
| **Razlog izbora** | US-47 se direktno naslanja na infrastrukturu sigurnog storage modula iz Sprinta 9 (US-32). US-45 koristi WebSocket servis već planiran za Sprint 10 (NFR-16), čime se izbjegava dupliciranje implementacije. US-46 nadopunjuje prošireni profil pacijenta i direktno podržava medicinski integritet sistema. Uvođenje u Sprint 10 ne narušava planirani scope, a odgađanje bi stvorilo tehnički dug. |
| **Posljedice** | Tim implementira u Sprint 10: formu za uputnicu i PDF generisanje (US-47), dugme za potvrdu dolaska s WebSocket ažuriranjem (US-45), proširenje tabele pacijent s medicinskim atributima (US-46). |
| **Status** | Aktivna |

---

## Povratna informacija Product Ownera

Product Owner je bio zadovoljan svim demonstriranim funkcionalnostima i nije imao kritika na prezentovane isporuke. Sve demonstrirane stavke su prihvaćene bez zahtjeva za izmjenama.

---

## Zaključak za naredni sprint

Sprint 10 je bio produktivan. Sve planirane stavke su završene, a jedini tehnički problem (UTC format datuma) je riješen tokom sprinta. Tim treba nastaviti s ovakvim pristupom — ravnomjernom raspodjelom zadataka i ranim završavanjem planiranih funkcionalnosti, jer upravo taj način rada otvara prostor za kvalitetna unapređenja bez pritiska na rokove.

