# Sprint Review Summary

> Ovaj izvještaj sumira rezultate završenog sprinta, identifikuje isporučene vrijednosti i definiše korekcije plana na osnovu povratnih informacija.

---

## Sprint broj: Sprint 6

**Release:** Release 1 — Rezervacijski sistem
**Tim:** Sumeja Mušić, Merjem Milišić, Hana Mahmutović, Hamza Husović, Kenan Hatibović, Amina Alispahić, Almedin Šehić, Lamija Halilović

---

## Planirani sprint goal

Dovršiti i stabilizovati kompletni tok rezervacije i otkazivanja termina, čime sistem postaje funkcionalno upotrebljiv za osnovno zakazivanje.

Na kraju sprinta, pacijent može pregledati dostupne doktore i slobodne termine u realnom vremenu, rezervisati termin uz automatsku zaštitu od duplih rezervacija putem buffer zone od 2 minute, dodati komentar uz rezervaciju, te otkazati termin uz poštovanje pravila o zabrani otkazivanja 24h unaprijed. Sve promjene rasporeda vidljive su u realnom vremenu putem WebSocket veze (NFR-16), a sistem garantuje ACID konzistentnost (NFR-12) i sprječava race condition scenarije (RR-10).

Sprint se smatra uspješnim kada je end-to-end tok — **pregled → zakazivanje → potvrda → otkazivanje** — provjeren u testnom okruženju bez grešaka i bez duplih rezervacija.

---

## Šta je završeno

| ID | Naziv | Status |
|----|-------|--------|
| US-05 | Pregled dostupnih resursa — doktori i slobodni termini | Završeno |
| US-06 | Rezervacija termina na osnovu dostupnog rasporeda |  Završeno |
| US-07 | Rezervacija termina kod doktora po izboru pacijenta |  Završeno |
| US-08 | Email potvrda o rezervaciji (Resend) |  Završeno |
| US-09 | Otkazivanje termina od strane medicinskog osoblja |  Završeno |
| US-10 | Otkazivanje termina od strane pacijenta |  Završeno |
| US-12 | Automatsko oslobađanje zaključanih termina — buffer zona | Završeno |
| US-13 | Validacija i sprječavanje duplih rezervacija |  Završeno |
| US-22 | Dodavanje komentara prilikom zakazivanja termina |  Završeno |
| US-32 | Pregled rezervacija za doktora |  Završeno |
| US-33 | Upload i pregled PDF nalaza |  Završeno |
| — | Implementacija WebSocket-a — real-time vidljivost rasporeda |  Završeno |
| — | Završno testiranje end-to-end toka rezervacije |  Završeno |
| — | Pisanje Decision Log-a |  Završeno |

---

## Šta nije završeno

| ID | Naziv | Razlog |
|----|-------|--------|
| US-31 | Automatski podsjetnik za pacijente sa hroničnim bolestima | Implementacija zavisna od završetka autentifikacije korisnika; zavisnost nije bila pravovremeno identificirana kao preduslov — prebačeno u budući sprint |


---

## Demonstrirane funkcionalnosti i artefakti

- Kompletni end-to-end tok — **pregled → zakazivanje → potvrda → otkazivanje** — demonstriran i verificiran u testnom okruženju bez grešaka
- Real-time ažuriranje rasporeda putem WebSocket veze (NFR-16, ≤2s) — verificirano
- Zaštita od duplih rezervacija putem database locks i ACID transakcija (NFR-12, RR-10) — bez grešaka u testiranju
- Email potvrda rezervacije putem Resend servisa (DEC-004) — funkcionalno
- Buffer zona od 2 minute za zaključavanje termina tokom unosa (NFR-22) — funkcionalno
- Upload i pregled PDF nalaza — funkcionalno
- Decision Log predočen Product Owneru i prihvaćen

---

## Glavni problemi i blokeri

- **Nodemailer nije bio deployabilan** — kasno otkriveno ograničenje hosting platforme uzrokovalo je nepotrebno ulaganje vremena; alternativa (Resend) pronađena tek tokom sprinta
- **US-31 ostao nedovršen** — zavisnost o autentifikaciji nije bila eksplicitno identificirana kao preduslov na početku sprinta
- **Nedovoljno vidljive zavisnosti između zadataka** — US-31 vezan za autentifikaciju, no ova veza nije bila mapirana u planiranju
- **Neravnomjerna raspodjela opterećenja** — određeni članovi tima imali su veće opterećenje zbog složenosti dodijeljenih zadataka (WebSocket, database locks)
- **E2E testiranje pokrenuto prekasno** — integraciono testiranje počelo je pri kraju sprinta, ostavljajući malo prostora za eventualne ispravke

---

## Ključne odluke donesene u sprintu

| ID | Odluka |
|----|--------|
| DEC-004 | Resend korišten umjesto Nodemailer-a za slanje email notifikacija zbog nemogućnosti besplatnog deployanja Nodemailer-a na hosting platformi. Product Owner je ovu odluku prihvatio kao prihvatljivu za trenutni prototip. |

---

## Povratna informacija Product Ownera

- Product Owner je potvrdio da je **Release 1 uspješno završen** — sistem za rezervacije ispravno izvršava rezervaciju i spreman je za upotrebu
- Prihvatio je priloženi Decision Log, uključujući zamjenu tehnologije (Resend umjesto Nodemailer-a) kao prihvatljivo tehničko rješenje za trenutni prototip
- Zajednički je donesena odluka o **nastavku razvoja** u sljedećem sprintu
- Razgovarano o unapređenju timskog rada, boljoj komunikaciji i načinima rješavanja konflikata u timu

---

## Zaključak za naredni sprint

Sprint 6 uspješno je zaokružio Release 1. Sistem za rezervacije je funkcionalan, stabilan i spreman za upotrebu.

Za Sprint 7 definisane su sljedeće smjernice:

- **Ranije istraživati tehnička ograničenja** — hosting i deployment analiza mora biti provedena prije uvrštavanja alata u backlog
- **E2E testiranje pokrenuti po mogućnosti sredinom sprinta**, a ne pri samom kraju
- **Uravnoteženija raspodjela složenih zadataka** — kompleksni tehnički zadaci trebaju biti parcirani ili dodijeljeni u parovima

