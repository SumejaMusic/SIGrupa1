
# Sprint Retrospective 

---

## Osnovne informacije

| Stavka | Opis |
| :--- | :--- |
| **Sprint** | Sprint 10 |
| **Release** | Release 4 |
| **Sprint cilj** | Izgradnja kompletnog administrativno-menadžerskog sloja sistema kroz admin panel sa audit logom, statistički modul sa CSV exportom i menadžment panel za nadzor resursa, uz unapređenje korisničkog iskustva kroz proširenje pacijentovog medicinskog profila, potvrdu dolaska jednim klikom i generisanje PDF uputnica specijalistima |
| **Tim** | Sumeja Mušić, Merjem Milišić, Hamza Husović, Kenan Hatibović, Amina Alispahić, Almedin Šehić, Lamija Halilović, Hana Mahmutović |

---

## Pregled završenih stavki

| ID | Naziv | Status |
|----|-------|--------|
| US-18 | Menadžment panel — kontrolna tabla sa ključnim metrikama ustanove | Završeno |
| US-33 | Admin panel — backend funkcionalnosti (CRUD, RBAC, validacija) | Završeno |
| US-34 | Logovanje svih akcija u sistemu (audit log) | Završeno |
| US-29 | Statistika zdravstvene ustanove — grafički prikaz metrika | Završeno |
| US-30 | Export statistike zakazanih pregleda u CSV formatu | Završeno |
| US-40 | Zahtjev za deaktivaciju i anonimizaciju profila (GDPR) | Završeno |
| US-45 | Potvrda dolaska pacijenta jednim klikom | Završeno |
| US-46 | Proširenje medicinskog profila pacijenta | Završeno |
| US-NEW | Generisanje PDF uputnice specijalistu | Završeno |

---

## Šta je išlo dobro

- Sprint 10 bio je jedan od najobimnijih u projektu — svi planirani user storiji završeni su unutar sprinta, uključujući i tri nova user storija (US-45, US-46, US-NEW) koji nisu bili u originalnom backlogu.
- Audit log i RBAC zaštita admin ruta implementirani su temeljito i ispunjavaju sve relevantne NFR zahtjeve (NFR-06, NFR-07, NFR-19), što postavlja čvrst sigurnosni temelj za Release 4.
- WebSocket mehanizam za real-time potvrdu dolaska pacijenta (US-45) uspješno je integriran i zadovoljava NFR-16 (promjena statusa vidljiva u roku od 2 sekunde).
- GDPR modul (US-40) implementiran je sa posebnom pažnjom na čuvanje medicinske historije — anonimizacija briše lične podatke bez kaskadnog brisanja medicinskih zapisa, što je bilo tehnički zahtjevno ali izvedeno ispravno.
- Generisanje PDF uputnica (US-NEW) je glatko integrirano u doktorov radni tok — tim je pronašao elegantno rješenje koje se naslanja na postojeću infrastrukturu iz US-32.
- Timska komunikacija i raspodjela zadataka bile su jasne i efikasne tokom cijelog sprinta.

---

## Šta nije išlo dobro

- Implementacija GDPR anonimizacije zahtijevala je dodatno testiranje u staging okruženju zbog osjetljivosti operacije nad bazom podataka, što je uzelo više vremena nego što je inicijalno planirano.
- Statistički modul (US-29) imao je manje poteškoće pri filtriranju podataka po vremenskim periodima — edge case-ovi vezani za prelaske između mjeseci zahtijevali su naknadnu doradu.
- Tri nova user storija (US-45, US-46, US-NEW) uvođena su u sprint bez prethodno definisanih acceptance criteria, što je u početku usporilo implementaciju dok se tim nije uskladio oko očekivanih ishoda.

---

## Prijedlozi za poboljšanje

- Za sve user storije koji se dodaju mid-sprint, obavezno definisati acceptance criteria prije nego što implementacija počne, a ne paralelno s njom.
- Uvesti obavezno testiranje GDPR i ostalih destruktivnih operacija isključivo u staging okruženju — formalizovati ovo kao procesno pravilo, a ne preporuku.
- Za naredne sprintove koji uključuju statistiku i izvještavanje, unaprijed identificirati granične slučajeve u podacima (edge cases) tokom faze planiranja.
- Nastaviti praksu temeljite code review procedure za sigurnosno osjetljive module (audit log, RBAC, GDPR).

---

## Ključne odluke donesene u sprintu

- US-47  zvanično uvršten u User Story dokument kao samostalan user story sa punim setom acceptance criteria.
- Odlučeno da PDF uputnica (US-47) koristi logo i zaglavlje zdravstvene ustanove kao standardni element svakog generisanog dokumenta.
- Potvrđeno da audit log podatke čuva minimalno 12 mjeseci, nakon čega se automatski arhiviraju u skladu sa politikom privatnosti (US-34).
- WebSocket servis implementiran za US-45 proglašen je zajedničkom infrastrukturom koja će se koristiti i u budućim real-time funkcionalnostima sistema.
- Verifikovano da admin backend ispunjava NFR-18 (odziv ispod 2 sekunde) na osnovu performansnih testova provedenih tokom sprinta.

---

## Zaključak

Sprint 10 uspješno zatvara administrativno-upravljački sloj sistema koji je bio neophodan za Release 4. Pored svih planiranih stavki, tim je implementirao i tri dodatne funkcionalnosti identificirane tokom sprinta — potvrdu dolaska pacijenta, proširenje medicinskog profila i generisanje PDF uputnica — čime je sprint premašio inicijalne ciljeve bez narušavanja kvaliteta. Jedine poteškoće bile su vezane za edge case-ove u statističkom modulu i dodatno testiranje GDPR operacija, no obje su riješene unutar sprinta. Sistem je sada opremljen sigurnim audit logom, RBAC zaštitom, CSV exportom statistike i GDPR usklađenošću, što ga priprema za produkcijsku upotrebu. Ulazimo u narednu fazu s kompletnom Release 4 bazom, zadovoljenim NFR zahtjevima i timom koji je pokazao sposobnost da isporuči i izvan planiranog scopea.

---

> **Release:** Release 4 | **Sprint:** Sprint 10 | **Ključna isporuka:** Audit log, menadžment panel, CSV export statistike, GDPR modul, PDF uputnica, prošireni medicinski profil i potvrda dolaska pacijenta
