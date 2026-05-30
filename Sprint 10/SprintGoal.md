
# Sprint 10 Goal — Admin panel, statistike, menadžment i generisanje PDF uputnica

## Sprint cilj

Cilj Sprinta 10 je implementirati i stabilizirati administrativne funkcionalnosti sistema kroz kompletan admin panel sa backend podrškom, menadžment panel za upravljanje zdravstvenom ustanovom, te statistički modul sa mogućnošću exporta podataka. Sprint obuhvata razvoj backend CRUD endpointa za upravljanje korisnicima i ulogama, implementaciju statistike zakazanih pregleda sa export funkcionalnosti u CSV formatu, te izgradnju menadžment panela koji omogućava pregled i upravljanje ključnim podacima zdravstvene ustanove.

Na kraju sprinta, sistem posjeduje funkcionalan modul za generisanje PDF uputnica specijalistima od strane doktora — nova funkcionalnost uvedena na osnovu odluke tima tokom sprinta. Sve administrativne operacije moraju biti zaštićene RBAC mehanizmom, a admin backend mora zadovoljiti definirane performansne zahtjeve. Korisnički interfejs administrativnih panela mora biti intuitivan i u skladu sa NFR-26.

Sprint se smatra uspješnim kada su sve administrativne funkcionalnosti — **upravljanje korisnicima i ulogama → RBAC autorizacija → audit log** i **pregled statistike → export u CSV → PDF uputnica generisana od strane doktora** — funkcionalne bez kritičnih grešaka i u skladu sa definisanim NFR zahtjevima.

---

## User storije u Sprintu 10

| ID | Naziv |
|----|-------|
| US-33 | Admin panel — backend funkcionalnosti i CRUD endpointi za upravljanje korisnicima i ulogama |
| US-18 | Menadžment panel — pregled i upravljanje podacima zdravstvene ustanove |
| US-29 | Statistika zdravstvene ustanove — pregled ključnih metrika |
| US-30 | Export statistike zakazanih pregleda u CSV formatu |
| US-NEW | Generisanje PDF uputnice specijalistu od strane doktora nakon pregleda |

---

## Relevantni NFR zahtjevi

| ID | Zahtjev |
|----|---------|
| NFR-01 | Samo ovlašteno medicinsko osoblje i administratori mogu pristupiti historiji pregleda pacijenta |
| NFR-15 | Dashboard sistema mora se učitati u roku od maksimalno 3 sekunde |
| NFR-18 | Admin backend mora odgovarati u roku od 2 sekunde |
| NFR-19 | Baza podataka mora osigurati konzistentnost i integritet podataka tokom svih administrativnih operacija |
| NFR-26 | Sistem mora imati intuitivan interfejs za upravljanje i rezervaciju termina |

---

## Glavni rizici

| ID | Opis |
|----|------|
| RR-09 | Neispravni podaci o pacijentima usljed greške pri unosu od strane administratora |
| RR-06 | Loše korisničko iskustvo usljed kompleksnosti administrativnog interfejsa |
| RR-24 | Neažurni podaci o dostupnosti doktora koji mogu uzrokovati netačne statističke prikaze |
| RR-25 | Greške pri generisanju PDF uputnice usljed nepotpunih podataka o pacijentu ili specijalistu |
| RR-26 | Narušavanje integriteta exportovanih CSV podataka pri istovremenom pristupu više administratora |

---

## Decision Log

| ID | Odluka | Obrazloženje |
|----|--------|--------------|
| DL-10-01 | Uvršten novi user story za generisanje PDF uputnice specijalistu od strane doktora | Identificirana potreba tokom Sprint 9 — doktori trebaju mogućnost kreiranja i slanja uputnica specijalistima direktno iz sistema nakon obavljenog pregleda |

---

## Kriteriji prihvatanja sprinta

- [ ] Admin backend funkcionalan je sa CRUD endpointima za upravljanje korisnicima i ulogama, a sve operacije zaštićene su RBAC mehanizmom (US-33, NFR-01)
- [ ] Menadžment panel prikazuje ključne podatke zdravstvene ustanove u realnom vremenu uz intuitivan interfejs (US-18, NFR-26)
- [ ] Statistički modul prikazuje tačne i ažurne metrike zakazanih pregleda i opterećenja sistema (US-29, NFR-15)
- [ ] Export statistike u CSV formatu funkcionalan je bez grešaka u integritetu podataka (US-30, NFR-19)
- [ ] Doktor može generisati i preuzeti PDF uputnicu specijalistu direktno iz sistema nakon pregleda (US-NEW, NFR-18)
- [ ] Admin backend odgovara u roku od 2 sekunde na sve zahtjeve (NFR-18)
- [ ] Dashboard se učitava u roku od maksimalno 3 sekunde uz zadovoljene performansne standarde (NFR-15)
- [ ] Svi relevantni NFR zahtjevi (NFR-01, NFR-15, NFR-18, NFR-19, NFR-26) su zadovoljeni i verifikovani testiranjem
