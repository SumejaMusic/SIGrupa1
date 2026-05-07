# Sprint 6 Goal — Rezervacijski sistem (Release 1 završnica)

## Sprint cilj

Cilj Sprinta 6 je dovršiti i stabilizovati kompletni tok rezervacije i otkazivanja termina, čime sistem postaje funkcionalno upotrebljiv za osnovno zakazivanje u kliničkom okruženju.

Na kraju sprinta, pacijent može pregledati dostupne doktore i slobodne termine u realnom vremenu, rezervisati termin uz automatsku zaštitu od duplih rezervacija putem buffer zone od 2 minute, dodati komentar uz rezervaciju, te otkazati termin uz poštovanje pravila o zabrani otkazivanja 24h unaprijed. Medicinsko osoblje ima iste mogućnosti otkazivanja. Sve promjene rasporeda vidljive su u realnom vremenu putem WebSocket veze (NFR-16), otkazani termini postaju dostupni u ≤2 sekunde (NFR-09), a svaki pacijent dobija email potvrdu putem Nodemailer-a. Sistem garantuje ACID konzistentnost (NFR-12) i sprječava race condition scenarije (RR-10).

Sprint se smatra uspješnim kada je end-to-end tok — **pregled → zakazivanje → potvrda → otkazivanje** — provjeren u testnom okruženju bez grešaka u zakazivanju i bez duplih rezervacija.

---

## User storije u Sprintu 6

| ID | Naziv |
|----|-------|
| US-05 | Pregled dostupnih resursa — doktori i slobodni termini |
| US-06 | Rezervacija termina na osnovu dostupnog rasporeda |
| US-07 | Rezervacija termina kod doktora po izboru pacijenta |
| US-13 | Validacija i sprječavanje duplih rezervacija |
| US-12 | Automatsko oslobađanje zaključanih termina — buffer zona |
| US-22 | Dodavanje komentara prilikom zakazivanja termina |
| US-09 | Otkazivanje termina od strane medicinskog osoblja |
| US-10 | Otkazivanje termina od strane pacijenta |
| US-08 | Email potvrda o rezervaciji |

> **Napomena:** US-15 (Upravljanje radnim vremenom doktora) i US-31 (Automatski podsjetnik za pacijente sa hroničnim bolestima) nisu obuhvaćeni ovim sprintom.

---

## Relevantni NFR zahtjevi

| ID | Zahtjev |
|----|---------|
| NFR-09 | Otkazani termini moraju odmah postati dostupni drugim korisnicima (≤2s) |
| NFR-10 | Otkazivanje termina mora biti završeno u roku od 2–3 sekunde |
| NFR-11 | Pacijent mora biti obaviješten o otkazivanju termina putem emaila |
| NFR-12 | Sistem mora osigurati da se operacije izvršavaju bez djelimičnih zapisa — ACID |
| NFR-16 | Promjene rasporeda moraju biti vidljive u roku od 2 sekunde — WebSocket |
| NFR-22 | Sistem mora zaključati termin na 2 minute tokom unosa podataka |
| NFR-25 | Sistem mora biti dostupan najmanje 99% vremena u toku radnog vremena klinike |

---

## Glavni rizici

| ID | Opis |
|----|------|
| RR-03 | Greške u logici zakazivanja termina |
| RR-10 | Dupli termini — race condition ako database locks nisu ispravno implementirani (NFR-22) |
| RR-13 | Konflikt u rasporedu doktora usljed nedostatka centralne provjere |
| RR-15 | Kašnjenje email notifikacija usljed problema sa eksternim servisom |
| RR-01 | Buffer zona — rizik od nezaključavanja termina u slučaju pada servera |

---

## Kriteriji prihvatanja sprinta

- [ ] Pacijent može pregledati dostupne doktore i slobodne termine u realnom vremenu
- [ ] Rezervacija termina funkcioniše uz buffer zonu od 2 minute (NFR-22)
- [ ] Sistem sprječava duple rezervacije bez race condition grešaka (RR-10)
- [ ] Nepotvrđeni termini se automatski oslobađaju po isteku buffer zone
- [ ] Pacijent i medicinsko osoblje mogu otkazati termin bilo kad
- [ ] Moguće je dodati komentar prilikom zakazivanja termina
- [ ] Pacijent prima email potvrdu putem Nodemailer-a
- [ ] Otkazani termini postaju dostupni u ≤2 sekunde (NFR-09)
- [ ] Promjene rasporeda vidljive su u realnom vremenu putem WebSocket veze (NFR-16)
- [ ] Sve operacije su ACID konzistentne (NFR-12)