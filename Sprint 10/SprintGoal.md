# Sprint Goal 10 — Admin panel, statistike, menadžment i generisanje PDF uputnica

## Sprint cilj

Cilj Sprinta 10 je implementirati i stabilizirati kompletni administrativno-menadžerski sloj sistema kroz admin panel sa backend podrškom, menadžment panel za upravljanje zdravstvenom ustanovom, audit log, statistički modul sa mogućnošću exporta podataka, te GDPR modul za anonimizaciju korisničkih profila. Sprint obuhvata razvoj backend CRUD endpointa za upravljanje korisnicima i ulogama, implementaciju audit loga koji bilježi sve kritične akcije u sistemu, statistiku zakazanih pregleda sa export funkcionalnosti u CSV formatu, te izgradnju menadžment panela koji omogućava pregled i upravljanje ključnim podacima zdravstvene ustanove.

Pored administrativnih funkcionalnosti, sprint uvodi i tri značajna unapređenja korisničkog iskustva: potvrdu dolaska pacijenta jednim klikom u panelu medicinskog osoblja sa real-time ažuriranjem doktorovog dashboarda putem WebSocket mehanizma, proširenje medicinskog profila pacijenta sa krvnom grupom, alergijama, hroničnim bolestima, prethodnim operacijama i podatkom o doniranju krvi, te generisanje PDF uputnica specijalistima od strane doktora — funkcionalnost uvedena na osnovu odluke tima tokom sprinta (DEC-010).

Sve administrativne operacije moraju biti zaštićene RBAC mehanizmom, zapisi u audit logu moraju biti nepromjenjivi, a admin backend mora zadovoljiti definirane performansne zahtjeve. Korisnički interfejs administrativnih i menadžment panela mora biti intuitivan i u skladu sa NFR-26.

Sprint se smatra uspješnim kada su sve funkcionalnosti — **upravljanje korisnicima i ulogama → RBAC autorizacija → audit log** i **pregled statistike → export u CSV** i **GDPR deaktivacija → anonimizacija profila** i **potvrda dolaska → real-time ažuriranje čekaonice** i **medicinski profil pacijenta → prikaz doktoru** i **PDF uputnica generisana od strane doktora** — funkcionalne bez kritičnih grešaka i u skladu sa definisanim NFR zahtjevima.

---

## User storije u Sprintu 10

| ID | Naziv |
|----|-------|
| US-18 | Menadžment panel — pregled i upravljanje podacima zdravstvene ustanove |
| US-33 | Admin panel — backend funkcionalnosti i CRUD endpointi za upravljanje korisnicima i ulogama |
| US-34 | Logovanje svih akcija u sistemu (audit log) |
| US-29 | Statistika zdravstvene ustanove — pregled ključnih metrika |
| US-30 | Export statistike zakazanih pregleda u CSV formatu |
| US-40 | Zahtjev za deaktivaciju i anonimizaciju profila (GDPR) |
| US-45 | Potvrda dolaska pacijenta jednim klikom |
| US-46 | Proširenje medicinskog profila pacijenta |
| US-47 | Generisanje PDF uputnice specijalistu od strane doktora nakon pregleda |

---

## Relevantni NFR zahtjevi

| ID | Zahtjev |
|----|---------|
| NFR-01 | Samo ovlašteno medicinsko osoblje i administratori mogu pristupiti historiji pregleda pacijenta |
| NFR-06 | Korisnik smije pristupiti samo funkcijama koje odgovaraju njegovoj ulozi |
| NFR-07 | Sistem mora implementirati RBAC (Role-Based Access Control) |
| NFR-15 | Dashboard sistema mora se učitati u roku od maksimalno 3 sekunde |
| NFR-16 | Promjene rasporeda i statusa moraju biti vidljive u roku od 2 sekunde — WebSocket / Live Updates |
| NFR-18 | Admin backend mora odgovarati u roku od 2 sekunde |
| NFR-19 | Baza podataka mora osigurati konzistentnost i integritet podataka tokom svih administrativnih operacija |
| NFR-26 | Sistem mora imati intuitivan interfejs za upravljanje i rezervaciju termina |
| NFR-30 | Svi lični podaci pacijenata prilikom trajne anonimizacije moraju biti uklonjeni iz baze u roku od 30 dana (GDPR usklađenost) |

---

## Glavni rizici

| ID | Opis |
|----|------|
| RR-06 | Loše korisničko iskustvo usljed kompleksnosti administrativnog i menadžment interfejsa |
| RR-09 | Neispravni podaci o pacijentima usljed greške pri unosu od strane administratora |
| RR-21 | Slučajno brisanje ili narušavanje integriteta medicinske historije prilikom izvršavanja skripte za GDPR anonimizaciju |
| RR-24 | Neažurni podaci o dostupnosti doktora koji mogu uzrokovati netačne statističke prikaze |
| RR-25 | Greške pri generisanju PDF uputnice usljed nepotpunih podataka o pacijentu ili specijalistu |
| RR-26 | Narušavanje integriteta exportovanih CSV podataka pri istovremenom pristupu više administratora |
| RR-27 | Race condition pri potvrdi dolaska pacijenta ako medicinsko osoblje i doktor istovremeno mijenjaju status termina |

---

## Decision Log

| ID | Odluka | Obrazloženje |
|----|--------|--------------|
| DL-10-01 | Uvršten novi user story US-NEW za generisanje PDF uputnice specijalistu od strane doktora | Identificirana potreba tokom Sprint 9 — doktori trebaju mogućnost kreiranja i slanja uputnica specijalistima direktno iz sistema nakon obavljenog pregleda |
| DL-10-02 | US-40 (GDPR anonimizacija) prebačen iz Sprint 9 u Sprint 10 scope | Radi ravnomjernijeg rasporeda i boljeg fokusa tima na GDPR kompleksnost uz audit log modul |
| DL-10-03 | Uvršten US-45 (Potvrda dolaska pacijenta) i US-46 (Proširenje medicinskog profila) kao novi user storiji u Sprint 10 | Identificirane funkcionalne potrebe koje koriste WebSocket infrastrukturu već planiranu za sprint, a direktno unapređuju korisničko iskustvo medicinskog osoblja i doktora |

---

## Kriteriji prihvatanja sprinta

- [ ] Admin backend funkcionalan je sa CRUD endpointima za upravljanje korisnicima i ulogama, a sve operacije zaštićene su RBAC mehanizmom (US-33, NFR-01, NFR-06, NFR-07)
- [ ] Menadžment panel prikazuje ključne podatke zdravstvene ustanove u realnom vremenu uz intuitivan interfejs (US-18, NFR-26)
- [ ] Audit log bilježi sve CRUD akcije u sistemu, zapisi su nepromjenjivi i dostupni isključivo administratorima (US-34, NFR-19)
- [ ] Statistički modul prikazuje tačne i ažurne metrike zakazanih pregleda i opterećenja sistema (US-29, NFR-15)
- [ ] Export statistike u CSV formatu funkcionalan je bez grešaka u integritetu podataka (US-30, NFR-19)
- [ ] Pacijent može podnijeti zahtjev za deaktivaciju profila, a anonimizacija se izvršava bez kaskadnog brisanja medicinske historije (US-40, NFR-30)
- [ ] Medicinsko osoblje može potvrditi dolazak pacijenta jednim klikom, a promjena statusa vidljiva je na doktorovom dashboardu u roku od 2 sekunde (US-45, NFR-16)
- [ ] Pacijent može unijeti medicinske podatke u profil, a doktor ih vidi pri pregledu uz zaštitu pristupa (US-46, NFR-01)
- [ ] Doktor može generisati i preuzeti PDF uputnicu specijalistu direktno iz sistema nakon pregleda (US-NEW, NFR-18)
- [ ] Admin backend odgovara u roku od 2 sekunde na sve zahtjeve (NFR-18)
- [ ] Dashboard se učitava u roku od maksimalno 3 sekunde uz zadovoljene performansne standarde (NFR-15)
- [ ] Svi relevantni NFR zahtjevi (NFR-01, NFR-06, NFR-07, NFR-15, NFR-16, NFR-18, NFR-19, NFR-26, NFR-30) su zadovoljeni i verifikovani testiranjem
