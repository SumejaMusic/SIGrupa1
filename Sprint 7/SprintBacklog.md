# Sprint Backlog
**Sprint Goal:** Implementacija kompletnog sigurnosnog sloja sistema — funkcionalan login sistem sa JWT tokenima, RBAC kontrolom pristupa, dvofaktorskom autentikacijom i enkripcijom osjetljivih zdravstvenih podataka, čime sistem dobija uspostavljeni sigurnosni perimetar kao preduslov za sve naredne faze razvoja.

> **Napomena o promjeni plana:** Sprint 7 i Sprint 10 su zamijenjeni mjesta zbog zavisnosti cijelog sistema o autentifikaciji korisnika. Release 4 (Autentifikacija i sigurnosni sloj) prelazi na Sprint 7 kako bi RBAC i enkripcija bili validovani u kontekstu svih prethodno implementiranih modula. US-31 (Automatski podsjetnik za pacijente sa hroničnim bolestima), prebačen iz Sprinta 6, biće adresiran u ovom sprintu kao zavisna stavka čija je implementacija bila blokirana nedostatkom autentifikacije.

---

## User storije i zadaci

| ID | User Story | Odgovorna osoba | Status | Napomena |
|----|------------|-----------------|--------|----------|
| US-03 | **Login sistem** — Kao korisnik, želim da se mogu sigurno prijaviti u sistem putem email adrese i lozinke, kako bi moji podaci i osjetljive medicinske informacije bile zaštićene od neovlaštenog pristupa. | Kenan Hatibović, Almedin Šehić | To Do | JWT tokeni + RBAC preusmjeravanje po ulogama (NFR-03, NFR-04, NFR-05) |
| US-16 | **Reset lozinke putem emaila** — Kao korisnik, želim da mogu resetovati lozinku putem emaila, kako bih mogao povratiti pristup svom nalogu ako zaboravim lozinku. | Sumeja Mušić | To Do | Resend servis; link validan 10 min; limit 3 pokušaja/h (DEC-004) |
| US-19 | **Automatska odjava nakon perioda neaktivnosti** — Kao korisnik, želim da me sistem automatski odjavi nakon određenog vremena neaktivnosti, kako bi se povećala sigurnost mog naloga. | Lamija Halilović | To Do | Session timeout 15 min + upozorenje 2 min unaprijed (NFR-13, NFR-14) |
| US-25 | **Two-Factor Authentication** — Kao korisnik, želim da koristim dvofaktorsku autentifikaciju prilikom logina, kako bi moj nalog bio sigurniji od neovlaštenog pristupa. | Hana Mahmutović, Merjem Milišić | To Do | 2FA putem emaila; kod validan 5 min; opcionalno za pacijente (NFR-23) |
| US-26 | **Detekcija neobičnog ponašanja — blokiranje naloga** — Kao sistem, želim automatski blokirati naloge nakon više neuspješnih pokušaja logina, kako bi zaštitio korisničke podatke od neovlaštenog pristupa. | Amina Alispahić | To Do | Blokada nakon 5 pokušaja; upozorenje na 3. pokušaju; email notifikacija (NFR-05, RR-08) |
| US-27 | **Enkripcija osjetljivih podataka** — Kao sistem, želim da enkriptujem osjetljive zdravstvene podatke, kako bi zaštitio privatnost pacijenata i osigurao usklađenost sa standardima zaštite podataka. | Hamza Husović, Almedin Šehić | To Do | AES-256 enkripcija + bcrypt za lozinke + enkripcija backup fajlova (NFR-24, NFR-04) |
| US-20 | **Logovanje svih akcija u sistemu — audit log** — Kao administrator, želim da sistem bilježi sve akcije i promjene unutar sistema, kako bih mogao pratiti i analizirati aktivnosti svih korisnika u svrhu sigurnosti i transparentnosti. | Kenan Hatibović | To Do | CRUD akcije + neuspješni logini; čuvanje min. 12 mj; samo admin ima pristup (NFR-08) |
| US-31 | **Automatski podsjetnik za pacijente sa hroničnim bolestima** — Kao pacijent, želim da sistem automatski šalje email podsjetnike kada se aproximira period rutinskog pregleda ili obnove terapije, kako bi se smanjila zaboravljena zakazivanja. | Sumeja Mušić | To Do | Prebačeno iz Sprinta 6; implementacija sada moguća uz autentifikaciju; Resend servis; scheduler 7 dana prije (DEC-004) |
| — | **Konfiguracija RBAC mehanizma** — Tehnički zadatak: Implementacija i konfiguracija Role-Based Access Control mehanizma sa četiri uloge: PACIJENT, DOKTOR, MEDICINSKO_OSOBLJE, ADMINISTRATOR. | Kenan Hatibović, Hana Mahmutović | To Do | Zavisnost: US-03 mora biti završen; NFR-06, NFR-07 |
| — | **Završno testiranje sigurnosnog sloja** — Tehnički zadatak: Integraciono i E2E testiranje kompletnog toka autentifikacije, 2FA, RBAC-a i enkripcije kako bi sistem bio spreman za Release 4. | Kenan Hatibović, Hamza Husović, Almedin Šehić | To Do | QA + sigurnosni testovi; pokrenuti najkasnije sredinom sprinta |
| — | **Pisanje Decision Log-a** — Tehnički zadatak: Dokumentovanje ključnih tehničkih odluka donesenih tokom Sprinta 7. | Sumeja Mušić | To Do | Nije US iz backlog-a |

---

## Relevantni NFR zahtjevi

| ID | Zahtjev |
|----|---------|
| NFR-03 | Prijava korisnika mora biti završena u roku od maksimalno 2 sekunde |
| NFR-04 | Lozinke se moraju čuvati u hashiranom obliku — bcrypt |
| NFR-05 | Sistem mora blokirati korisnika nakon 5 neuspješnih pokušaja prijave |
| NFR-06 | Korisnik smije pristupiti samo funkcijama koje odgovaraju njegovoj ulozi |
| NFR-07 | Sistem mora implementirati RBAC (Role-Based Access Control) |
| NFR-08 | Sve izmjene moraju biti evidentirane u audit log sistemu |
| NFR-13 | Sesija korisnika mora automatski isteći nakon perioda neaktivnosti |
| NFR-14 | Nakon isteka sesije korisniku mora biti onemogućen pristup prethodnim podacima |
| NFR-23 | Sistem mora omogućiti Two-Factor Authentication |
| NFR-24 | Sistem mora implementirati AES-256 enkripciju za osjetljive zdravstvene podatke |

---

## Glavni rizici

| ID | Opis |
|----|------|
| RR-08 | Neovlašten pristup podacima usljed slabe autentikacije |
| RR-11 | Neautorizovan pristup admin panelu ako RBAC nije ispravno implementiran |
| RR-12 | Gubitak sesije korisnika usljed isteka session tokena |
| RR-21 | Curenje medicinskih podataka pacijenata usljed nedostatka ili greške u enkripciji |

---

## Deliverable-i

- Implementiran Auth servis — Login sa JWT tokenima i preusmjeravanjem prema ulozi korisnika
- Funkcionalan Reset lozinke putem emaila (Resend servis)
- Automatska odjava korisnika nakon 15 minuta neaktivnosti sa upozorenjem
- Implementirana Two-Factor Authentication putem emaila (opcionalna za pacijente)
- Blokiranje naloga nakon 5 neuspješnih pokušaja prijave uz email notifikaciju
- AES-256 enkripcija osjetljivih zdravstvenih podataka u bazi i backup fajlovima
- Bcrypt heširanje lozinki
- Konfigurisan RBAC mehanizam sa četiri uloge: PACIJENT, DOKTOR, MEDICINSKO_OSOBLJE, ADMINISTRATOR
- Implementiran audit log — bilježenje svih CRUD akcija i neuspješnih prijava
- Automatski email podsjetnik za pacijente sa hroničnim bolestima (US-31)
- Zadovoljeni svi relevantni NFR zahtjevi (NFR-03, NFR-04, NFR-05, NFR-06, NFR-07, NFR-08, NFR-13, NFR-14, NFR-23, NFR-24)
- Tehnička dokumentacija sigurnosnih protokola i Decision Log

---

## Sažetak releasea

Ovo je Sprint 7 — implementacija Release 4 (Autentifikacija i sigurnosni sloj), koji je pomjeren ispred prvobitno planiranih sprintova zbog zavisnosti cijelog sistema o autentifikaciji korisnika. Sprint 7 nadograđuje funkcionalni rezervacijski sistem iz Release 1 dodavanjem kompletnog sigurnosnog perimetra: korisnici se prijavljuju putem JWT tokena, identiteti se verifikuju dvofaktorskom autentikacijom, a pristup resursima kontroliše se RBAC mehanizmom sa četiri jasno razdvojene uloge. Svi osjetljivi zdravstveni podaci u bazi zaštićeni su AES-256 enkripcijom, lozinke se čuvaju u bcrypt hashiranom obliku, a svaka akcija u sistemu bilježi se u audit logu. Uz to, US-31 (Automatski podsjetnik za hronične bolesnike) — prebačen iz Sprinta 6 zbog zavisnosti o autentifikaciji — implementira se u ovom sprintu koristeći već uspostavljeni Resend servis. Nakon ovog sprinta sistem posjeduje stabilan i siguran identitetski sloj kao osnovu za sve naredne faze razvoja.

---

> **Napomena:** Ovaj Sprint Backlog je živi dokument i ažurira se kroz sprint. Svaki backlog item direktno je vezan za odgovarajući user story. Testiranje sigurnosnog sloja mora početi najkasnije sredinom sprinta kako bi ostalo dovoljno vremena za eventualne ispravke.

**Release:** Release 4 — Autentifikacija i sigurnosni sloj | **Sprint:** Sprint 7 | **Ključna isporuka:** Funkcionalan login sistem sa JWT tokenima, RBAC kontrolom pristupa, 2FA i enkripcijom osjetljivih podataka
