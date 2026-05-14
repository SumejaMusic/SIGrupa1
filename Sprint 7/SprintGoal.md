# Sprint 7 Goal — Autentifikacija i sigurnosni sloj

## Sprint cilj

Cilj Sprinta 7 je implementirati kompletan sigurnosni sloj sistema — funkcionalan login sistem sa JWT tokenima, RBAC kontrolom pristupa, dvofaktorskom autentikacijom i enkripcijom osjetljivih zdravstvenih podataka.

Na kraju sprinta, korisnici (pacijenti, doktori, admini) mogu se sigurno prijaviti u sistem putem verificiranog identiteta, uz obaveznu dvofaktorsku autentikaciju putem emaila. RBAC mehanizam osigurava da svaki korisnik ima pristup isključivo resursima koji odgovaraju njegovoj ulozi. Lozinke se čuvaju u hashiranom obliku (bcrypt), sesija automatski ističe nakon perioda neaktivnosti (NFR-13), a sistem blokira korisnike nakon 5 neuspješnih pokušaja prijave (NFR-05). Svi osjetljivi zdravstveni podaci u bazi zaštićeni su AES-256 enkripcijom (NFR-24), a sve akcije u sistemu evidentirane su u audit log-u (NFR-08). Prijava korisnika mora biti završena u roku od 2 sekunde (NFR-03).

Sprint se smatra uspješnim kada je kompletni tok — **registracija → login → 2FA → RBAC pristup → automatska odjava** — provjeren u testnom okruženju bez grešaka u autentifikaciji i bez neautorizovanog pristupa resursima.

> **Napomena o promjeni plana:** Sprint 7 i Sprint 10 su zamijenjeni mjesta zbog zavisnosti cijelog sistema o autentifikaciji korisnika. Release 4 (Autentifikacija) prelazi na Sprint 7 kako bi RBAC i enkripcija bili validovani u kontekstu svih prethodno implementiranih modula. US-31 (Automatski podsjetnik za pacijente sa hroničnim bolestima), prebačen iz Sprinta 6, biće adresiran u ovom sprintu kao zavisna stavka.

---

## User storije u Sprintu 7

| ID | Naziv |
|----|-------|
| US-03 | Login sistem |
| US-16 | Reset lozinke putem emaila |
| US-19 | Automatska odjava nakon perioda neaktivnosti |
| US-25 | Two-Factor Authentication |
| US-26 | Detekcija neobičnog ponašanja — blokiranje naloga nakon neuspješnih pokušaja |
| US-27 | Enkripcija osjetljivih podataka |
| US-20 | Logovanje svih akcija u sistemu — audit log |


> **Napomena:** Admin panel i menadžment panel sa svim njihovim mogućnostima, koji su prethodno bili planirani za Sprint 7, pomjereni su u kasniji sprint u skladu s novim redoslijedom releasea.

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
| NFR-24 | Sistem mora implementirati enkripciju za osjetljive zdravstvene podatke — AES-256 |

---

## Glavni rizici

| ID | Opis |
|----|------|
| RR-08 | Neovlašten pristup podacima usljed slabe autentikacije |
| RR-11 | Neautorizovan pristup admin panelu ako RBAC nije ispravno implementiran |
| RR-21 | Curenje medicinskih podataka pacijenata |
| RR-12 | Gubitak sesije korisnika usljed isteka session tokena |

---

## Kriteriji prihvatanja sprinta

- [ ] Korisnik se može prijaviti u sistem putem login forme (JWT tokeni)
- [ ] Prijava je završena u roku od 2 sekunde (NFR-03)
- [ ] Lozinke su pohranjene u hashiranom obliku — bcrypt (NFR-04)
- [ ] Sistem blokira korisnika nakon 5 neuspješnih pokušaja prijave (NFR-05)
- [ ] Reset lozinke funkcioniše putem emaila
- [ ] Two-Factor Authentication implementirana i verificirana putem emaila (NFR-23)
- [ ] RBAC je konfigurisan — pacijent, doktor i admin imaju odvojene nivoe pristupa (NFR-06, NFR-07)
- [ ] Sesija automatski ističe nakon perioda neaktivnosti (NFR-13)
- [ ] Nakon isteka sesije pristup prethodnim podacima je onemogućen (NFR-14)
- [ ] Osjetljivi zdravstveni podaci u bazi zaštićeni su AES-256 enkripcijom (NFR-24)
- [ ] Sve akcije u sistemu evidentirane su u audit log-u (NFR-08)

