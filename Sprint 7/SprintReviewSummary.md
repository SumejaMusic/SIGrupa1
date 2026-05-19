# Sprint Review Summary

> Ovaj izvještaj sumira rezultate završenog sprinta, identifikuje isporučene vrijednosti i definiše korekcije plana na osnovu povratnih informacija.

---

## Sprint broj: Sprint 7

**Release:** Release 4 — Autentifikacija i sigurnosni sloj
**Tim:** Sumeja Mušić, Merjem Milišić, Hana Mahmutović, Hamza Husović, Kenan Hatibović, Amina Alispahić, Almedin Šehić, Lamija Halilović

---

## Planirani sprint goal

Implementirati kompletan sigurnosni sloj sistema — funkcionalan login sistem sa JWT tokenima, RBAC kontrolom pristupa, dvofaktorskom autentikacijom i enkripcijom osjetljivih zdravstvenih podataka.

Na kraju sprinta, korisnici (pacijenti, doktori, admini) mogu se sigurno prijaviti u sistem putem verificiranog identiteta, uz obaveznu dvofaktorsku autentikaciju putem emaila. RBAC mehanizam osigurava da svaki korisnik ima pristup isključivo resursima koji odgovaraju njegovoj ulozi. Lozinke se čuvaju u hashiranom obliku (bcrypt), sesija automatski ističe nakon perioda neaktivnosti (NFR-13), a sistem blokira korisnike nakon 5 neuspješnih pokušaja prijave (NFR-05). Svi osjetljivi zdravstveni podaci u bazi zaštićeni su AES-256 enkripcijom (NFR-24), a sve akcije u sistemu evidentirane su u audit log-u (NFR-08). Prijava korisnika mora biti završena u roku od 2 sekunde (NFR-03).

Sprint se smatra uspješnim kada je kompletni tok — **registracija → login → 2FA → RBAC pristup → automatska odjava** — provjeren u testnom okruženju bez grešaka u autentifikaciji i bez neautorizovanog pristupa resursima.

---

## Šta je završeno

| ID | Naziv | Status |
|----|-------|--------|
| US-03 | Login sistem (JWT tokeni + RBAC preusmjeravanje po ulogama) | Završeno |
| US-16 | Reset lozinke putem emaila (Resend servis) | Završeno |
| US-19 | Automatska odjava nakon perioda neaktivnosti | Završeno |
| US-25 | Two-Factor Authentication putem emaila | Završeno |
| US-26 | Detekcija neobičnog ponašanja — blokiranje naloga nakon neuspješnih pokušaja | Završeno |
| US-27 | Enkripcija osjetljivih podataka (AES-256 + bcrypt) | Završeno |
| US-20 | Logovanje svih akcija u sistemu — audit log | Završeno |
| — | Konfiguracija RBAC mehanizma sa četiri uloge | Završeno |
| — | Završno testiranje sigurnosnog sloja | Završeno |
| — | Pisanje Decision Log-a | Završeno |

---

## Šta nije završeno

Sve planirane stavke Sprinta 7 su završene. Nije bilo nedovršenih user storija ni tehničkih zadataka koji se prenose u naredni sprint.

---

## Demonstrirane funkcionalnosti i artefakti

- Kompletan tok — **registracija → login → 2FA → RBAC pristup → automatska odjava** — demonstriran i verificiran u testnom okruženju bez grešaka u autentifikaciji
- Login sistem sa JWT tokenima i preusmjeravanjem prema ulozi korisnika — verificirano
- Two-Factor Authentication putem emaila, kod validan 5 minuta — funkcionalno
- Automatska odjava nakon 15 minuta neaktivnosti sa upozorenjem 2 minute unaprijed (NFR-13, NFR-14) — verificirano
- Blokiranje naloga nakon 5 neuspješnih pokušaja prijave uz email notifikaciju (NFR-05) — verificirano
- AES-256 enkripcija osjetljivih zdravstvenih podataka i bcrypt heširanje lozinki (NFR-24, NFR-04) — verificirano
- RBAC mehanizam sa četiri odvojene uloge (PACIJENT, DOKTOR, MEDICINSKO_OSOBLJE, ADMINISTRATOR) — verificirano; svaka uloga ima pristup isključivo dozvoljenoj sadržini
- Audit log — bilježenje svih CRUD akcija i neuspješnih prijava; pristup samo administratoru (NFR-08) — funkcionalno
- Reset lozinke putem emaila (Resend servis) — funkcionalno; link validan 10 minuta, limit 3 pokušaja/h
- Decision Log predočen Product Owneru i prihvaćen

---

## Glavni problemi i blokeri

- **Privremeni prekid servera tokom demonstracije** — Tokom prezentacije, Render server se automatski isključio zbog ograničenja besplatnog tiera (server ulazi u "sleep" mode nakon perioda nekorištenosti). Kao posljedica, email za reset lozinke (US-16) nije bio isporučen u trenutku demonstracije. Funkcionalnost je ispravna i verificirana u testnom okruženju — radilo se isključivo o infrastrukturnom ograničenju besplatnog deploya, a ne o grešci u kodu. Dokumentovano kao poznato ograničenje trenutnog deployment okruženja (DEC-001).

---

## Ključne odluke donesene u sprintu

| ID | Odluka |
|----|--------|
| DEC-004 | Resend servis zadržan iz Sprinta 6 kao standardni email provajder za sve notifikacije u sigurnosnom sloju — reset lozinke, 2FA kodovi i upozorenja pri blokiranju naloga — bez dodatne konfiguracije |
| DEC-005 | Zamjena redoslijeda Sprinta 7 i Sprinta 10 potvrđena kao ispravna odluka — RBAC i enkripcija validirani su u kontekstu svih prethodno implementiranih modula, čime je smanjen tehnički dug integracije |

---

## Povratna informacija Product Ownera

- Product Owner je potvrdio da je **Release 4 uspješno završen** — sve planirane sigurnosne funkcionalnosti su implementirane i demonstrirane, a release je prihvaćen
- Privremeni ispad servera tokom demonstracije nije rezultovao odbijanjem releasea — Product Owner je prihvatio objašnjenje kao poznato infrastrukturno ograničenje besplatnog deployment tiera, a ne grešku u funkcionalnosti
- Prihvaćen je priloženi Decision Log, uključujući zadržavanje Resend servisa kao standardnog email provajdera
- Zajednički je donesena odluka o nastavku razvoja u Sprintu 8 — fokus na personalizovane panele za sve korisničke uloge i role-based routing

---

## Zaključak za naredni sprint

Sprint 7 uspješno je zaokružio Release 4. Sistem sada posjeduje potpuni sigurnosni perimetar — JWT autentifikacija, RBAC sa četiri uloge, 2FA, AES-256 enkripcija, bcrypt heširanje i audit log. Svi relevantni NFR zahtjevi su zadovoljeni.

Za Sprint 8 definisane su sljedeće smjernice:

- **Render "cold start" problem uzeti u obzir pri demonstracijama** — server treba biti aktiviran unaprijed prije svake prezentacije kako bi se izbjegao ispad tokom demonstracije
- **Nastaviti s ranim pokretanjem testiranja** — praksa iz Sprinta 7 (testiranje pokrenuto u prvoj polovini sprinta) pokazala se uspješnom i treba biti standardni obrazac za sve naredne sprintove
- **Eksplicitno planirati raspodjelu rada na sprint planiranju** — ujednačenost angažmana postignuta u Sprintu 7 treba biti formalizovana kroz eksplicitno mapiranje opterećenja po članu tima već na etapi planiranja
