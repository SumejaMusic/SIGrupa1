# Sprint Retrospective — Sprint 6
## Rezervacijski sistem (Release 1 završnica)

---

## Osnovne informacije

| Stavka | Opis |
| :--- | :--- |
| **Sprint** | Sprint 6 |
| **Release** | Release 1 — Rezervacijski sistem |
| **Sprint cilj** | Dovršetak svih preostalih funkcionalnosti Release 1 — potpuno funkcionalan i stabilan rezervacijski sistem spreman za upotrebu |
| **Tim** | Sumeja Mušić, Merjem Milišić, Hana Mahmutović, Hamza Husović, Kenan Hatibović, Amina Alispahić, Almedin Šehić, Lamija Halilović |

---

## Pregled završenih stavki

| ID | Naziv | Status |
|----|-------|--------|
| US-08 | Email potvrda o rezervaciji (Resend) |  Završeno |
| US-12 | Automatsko oslobađanje zaključanih termina — buffer zona | Završeno |
| US-13 | Validacija i sprječavanje duplih rezervacija | Završeno |
| US-22 | Dodavanje komentara prilikom zakazivanja termina | Završeno |
| US-32 | Pregled rezervacija za doktora | Završeno |
| US-33 | Upload i pregled PDF nalaza | Završeno |
| — | Implementacija WebSocket-a — real-time vidljivost rasporeda | Završeno |
| — | Završno testiranje end-to-end toka rezervacije | Završeno |
| — | Pisanje Decision Log-a |  Završeno |

### Stavke prebačene u naredni sprint

| ID | Naziv | Razlog |
|----|-------|--------|
| US-31 | Automatski podsjetnik za pacijente sa hroničnim bolestima | Implementacija zavisna od završetka autentifikacije korisnika; prebačeno u naredni sprint |
| US-15 | Upravljanje radnim vremenom doktora — upit za promjenu dužine termina | Nije obuhvaćeno ovim sprintom prema sprint cilju |

---

## Šta je išlo dobro

- **Stabilna backend arhitektura** — temelj postavljen u Sprint 5 omogućio je brzu implementaciju preostalih funkcionalnosti bez većih refaktoringa
- **Uspješna zamjena Nodemailer-a** — brza odluka o prelasku na Resend servis (DEC-004) otklonila je bloker i omogućila pravovremenu implementaciju email notifikacija
- **Zaštita od duplih rezervacija** — implementacija database locks i ACID transakcija uspješno je riješila RR-10 (race condition) bez vidljivih grešaka u testiranju
- **WebSocket integracija** — real-time vidljivost promjena rasporeda implementirana i verificirana u skladu s NFR-16 (≤2s)
- **Tim bolje strukturirao backlog** — za razliku od Sprint 5, svaki item u Sprint 6 backlogu direktno je vezan za user story, što je poboljšalo transparentnost i praćenje napretka
- **End-to-end tok verificiran** — kompletni tok pregled → zakazivanje → potvrda → otkazivanje provjeren u testnom okruženju bez grešaka

---

## Šta nije išlo dobro

- **Nodemailer nije bio deployabilan** — kasno otkriveno ograničenje hosting platforme uzrokovalo je nepotrebno ulaganje vremena u konfiguraciju koja se nije mogla koristiti; alternativa (Resend) pronađena tek tokom sprinta
- **US-31 nije završen** — automatski podsjetnik za pacijente sa hroničnim bolestima ostao je nedovršen zbog zavisnosti o autentifikaciji korisnika koja nije bila dovoljno rano identificirana kao preduslov
- **Zavisnosti između zadataka nisu bile dovoljno vidljive** — npr. US-31 je zavisan od autentifikacije, ali ova zavisnost nije bila eksplicitno navedena na početku sprinta
- **Neravnomjerna raspodjela zadataka** — određeni članovi tima imali su veće opterećenje usljed složenosti dodijeljenih user storija (WebSocket, database locks)
- **Testiranje provedeno pri kraju sprinta** — E2E testiranje počelo je prekasno, što je ostavilo malo prostora za eventualne ispravke

---

## Prijedlozi za poboljšanje

- **Ranije istraživati tehničke preduslove** — hosting i deployment ograničenja trebaju biti provjerena prije nego što se alat uvrsti u backlog (npr. analiza deployabilnosti Nodemailer-a trebala je biti provedena u Sprint 5)
- **Uravnoteženija raspodjela složenih zadataka** — kompleksni tehnički zadaci (WebSocket, ACID transakcije) trebaju biti parcirani ili dodijeljeni u parovima kako bi se izbjegao bottleneck
- **Pokretati E2E testove ranije** — integraciono testiranje trebalo bi početi najkasnije sredinom sprinta, a ne pred sam kraj

---

## Ključne odluke donesene u sprintu

| ID | Odluka |
|----|--------|
| DEC-004 | Resend korišten umjesto Nodemailer-a za slanje email notifikacija zbog nemogućnosti besplatnog deployanja Nodemailer-a na hosting platformi |

---

## Zaključak

Sprint 6 uspješno je zaokružio Release 1 — Rezervacijski sistem je funkcionalan, stabilan i spreman za upotrebu u kliničkom okruženju. Sve ključne funkcionalnosti rezervacije, otkazivanja, email notifikacija i real-time ažuriranja rasporeda su implementirane i verificirane. Jedina preostala stavka (US-31) nije bloker za Release 1 i biće adresirana u narednom sprintu zajedno s implementacijom autentifikacije kao njenog preduvjeta.

Najveća lekcija ovog sprinta je važnost ranog istraživanja tehničkih ograničenja i eksplicitnog mapiranja zavisnosti između zadataka na etapi planiranja.

---

> **Napomena:** Ovaj dokument sačinjen je na kraju Sprint 6 na osnovu sprint review-a, backlog-a i decision log-a. Prijedlozi za poboljšanje primjenjuju se počev od Sprint 7.
