# Sprint Retrospective — Sprint 7
## Autentifikacija i sigurnosni sloj (Release 4)

---

## Osnovne informacije

| Stavka | Opis |
| :--- | :--- |
| **Sprint** | Sprint 7 |
| **Release** | Release 4 — Autentifikacija i sigurnosni sloj |
| **Sprint cilj** | Implementacija kompletnog sigurnosnog sloja sistema — funkcionalan login sistem sa JWT tokenima, RBAC kontrolom pristupa, dvofaktorskom autentikacijom i enkripcijom osjetljivih zdravstvenih podataka |
| **Tim** | Sumeja Mušić, Merjem Milišić, Hana Mahmutović, Hamza Husović, Kenan Hatibović, Amina Alispahić, Almedin Šehić, Lamija Halilović |

---

## Pregled završenih stavki

| ID | Naziv | Status |
|----|-------|--------|
| US-03 | Login sistem (JWT tokeni + RBAC preusmjeravanje po ulogama) |  Završeno |
| US-16 | Reset lozinke putem emaila (Resend servis) |  Završeno |
| US-19 | Automatska odjava nakon perioda neaktivnosti |  Završeno |
| US-25 | Two-Factor Authentication putem emaila |  Završeno |
| US-26 | Detekcija neobičnog ponašanja — blokiranje naloga |  Završeno |
| US-27 | Enkripcija osjetljivih podataka (AES-256 + bcrypt) |  Završeno |
| US-20 | Audit log — logovanje svih akcija u sistemu |  Završeno |
| — | Konfiguracija RBAC mehanizma (4 uloge) |  Završeno |
| — | Završno testiranje sigurnosnog sloja |  Završeno |
| — | Pisanje Decision Log-a |  Završeno |

---

## Šta je išlo dobro

- **Ujednačen doprinos svih članova tima** — Ovaj sprint bio je obilježen svjesnim naporom tima da uravnoteži angažman svih članova. Kolege koje su u prethodnim sprintovima imale manji doprinos preuzele su veći dio odgovornosti i aktivno nadoknadile razliku — rezultat je bio najravnomjernija raspodjela rada do sada. Tim je ovo prepoznao kao pozitivnu prekretnicu u zajedničkoj dinamici.
- **Prva funkcionalna verzija gotova prije polovine sprinta** — Auth servis sa JWT tokenima i RBAC mehanizmom bio je funkcionalan već u prvoj polovini sprinta. To je timu dalo dovoljno vremena za integraciju preostalih sigurnosnih komponenti (2FA, enkripcija, audit log) bez žurbe, te za provođenje temeljnog testiranja bez vremenskog pritiska.
- **Sprint protekao bez stresa i blokatora** — Za razliku od prethodnih sprintova, Sprint 7 nije imao tehničkih blokatora niti neočekivanih zavisnosti koje bi ugrozile rokove. Timska komunikacija bila je proaktivna, a odluke donesene pravovremeno. Sigurnosno testiranje pokrenuto je u skladu s napomenom iz Sprint Backlog-a — znatno ranije nego u prethodnim sprintovima.
- **Svi NFR zahtjevi zadovoljeni** — Svih 10 relevantnih NFR zahtjeva (NFR-03 do NFR-24) verificirano je kroz integraciono i E2E testiranje. Posebno se ističe uspješna implementacija AES-256 enkripcije u kombinaciji s bcrypt hashiranjem lozinki, čime su riješeni rizici RR-08 i RR-21 koji su nosili visok prioritet.
- **Resend servis — iskorišteno znanje iz prethodnog sprinta** — Zahvaljujući odluci DEC-004 iz Sprint 6, implementacija email notifikacija (reset lozinke, 2FA kodovi, upozorenja pri blokiranju naloga) provedena je bez istraživačke faze. Tim je direktno primijenio već uspostavljeni Resend servis, čime je ušteđeno vrijedno razvojno vrijeme.

---

## Šta nije išlo dobro
-Sprint je protekao bez problema

---

## Prijedlozi za poboljšanje

- **Raspodjelu rada planirati eksplicitno na sprint planiranju** — Ujednačenost doprinosa u ovom sprintu nastala je reaktivno. U narednim sprintovima preporučuje se da se na etapi planiranja eksplicitno mapira opterećenje po članu tima, uzimajući u obzir aktivnost iz prethodnih sprintova — a ne tek po potrebi tokom izvođenja.
- **Dokumentovati odluke u trenutku donošenja** — Svaka tehnička ili arhitekturalna odluka trebala bi biti unesena u Decision Log odmah, a ne akumulirana za kraj sprinta. Preporučuje se kratka bilješka konteksta odmah nakon odluke, sa formalnim unosom u log narednog dana.
- **Nastaviti s ranim pokretanjem testiranja** — Praksa pokretanja sigurnosnih i integracijskih testova u prvoj polovini sprinta pokazala se izuzetno korisnom. Ovo treba postati standardni obrazac za sve naredne sprintove, naročito one koji uključuju kompleksne zavisnosti između modula.

---

## Ključne odluke donesene u sprintu

| ID | Odluka |
|----|--------|
| DEC-004 | Resend servis zadržan iz Sprint 6 kao standardni email provajder za sve notifikacije u sigurnosnom sloju (reset lozinke, 2FA kodovi, blokiranje naloga) |

---

## Zaključak

Sprint 7 uspješno je isporučio Release 4 — Autentifikacija i sigurnosni sloj. Sistem sada posjeduje potpuni sigurnosni perimetar: JWT autentifikacija, RBAC sa četiri uloge, dvofaktorska autentifikacija, AES-256 enkripcija, bcrypt heširanje i audit log. Svi relevantni NFR zahtjevi su zadovoljeni, a rizici visokog prioriteta (RR-08, RR-21) su mitigirani.

Ono što ovaj sprint posebno obilježava nije samo tehnički rezultat, već kvaliteta timske dinamike — ujednačen angažman, odsustvo blokatora i dovoljno vremena za temeljno testiranje stvorili su okruženje u kojem je tim radio smireno i fokusirano. Sigurnosni sloj uspostavljen u ovom sprintu postaje temelj za sve naredne faze razvoja sistema.

---

> **Napomena:** Ovaj dokument sačinjen je na kraju Sprint 7 na osnovu sprint review-a, backlog-a i decision log-a. Prijedlozi za poboljšanje primjenjuju se počev od Sprint 8. Posebno se naglašava da praksa eksplicitnog planiranja ravnomjerne raspodjele rada treba biti formalizovana u procesu sprint planiranja.

**Release:** Release 4 — Autentifikacija i sigurnosni sloj | **Sprint:** Sprint 7 | **Ključna isporuka:** Funkcionalan sigurnosni perimetar sa JWT, RBAC, 2FA i AES-256 enkripcijom
