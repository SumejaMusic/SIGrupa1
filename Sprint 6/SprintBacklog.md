
# Sprint Backlog 

**Sprint Goal:** Dovršetak svih preostalih funkcionalnosti Release 1 — Rezervacijski sistem mora biti potpuno funkcionalan i spreman za upotrebu, uz implementaciju email notifikacija, zaštite od duplih rezervacija, pregleda rezervacija za doktore, te zadovoljavanje svih preostalih NFR zahtjeva.

---

## User storije i zadaci

| ID | User Story | Odgovorna osoba | Status | Napomena |
|----|-----------|-----------------|--------|----------|
| US-08 | **Email potvrda o rezervaciji** — Kao pacijent, želim da primim email potvrdu nakon rezervacije termina, kako bih imao dokaz i podsjetnik o zakazanom pregledu. | Sumeja Mušić, Almedin Šehić| To Do | Resend integracija; prebačeno iz Sprint 5; |
| US-12 | **Automatsko oslobađanje zaključanih termina — buffer zona** — Kao sistem, želim automatski osloboditi zaključane termine ako pacijent ne završi rezervaciju u roku od 2 minute, kako bih spriječio blokiranje dostupnih termina. | Hana Mahmutović | To Do | NFR-22; prebačeno iz Sprint 5 |
| US-13 | **Validacija i sprječavanje duplih rezervacija** — Kao sistem, želim da spriječim duple rezervacije (race condition), kako bi svaki termin bio dodijeljen isključivo jednom pacijentu. | Hamza Husović, Kenan Hatibović, Amina Alispahić | To Do | Database locks + ACID (NFR-12); prebačeno iz Sprint 5 |
| US-22 | **Dodavanje komentara prilikom zakazivanja termina** — Kao pacijent, želim da mogu dodati komentar ili napomenu pri zakazivanju termina, kako bih unaprijed informisao doktora o razlogu posjete. | Sumeja Mušić, Merjem Milišić, Hana Mahmutović | To Do | Frontend forma + backend; prebačeno iz Sprint 5 |
| US-15 | **Upravljanje radnim vremenom doktora — upit za promjenu dužine termina** — Kao doktor, želim da mogu uputiti upit za promjenu dužine termina, kako bi raspored bio prilagođen potrebama pregleda. | Merjem Milišić, Kenan Hatibović | To Do | Backend logika + frontend forma |
| US-31 | **Automatski podsjetnik za pacijente sa hroničnim bolestima** — Kao pacijent sa hroničnim oboljenjem, želim da primim automatski email podsjetnik o nadolazećem terminu, kako bih blagovremeno obavio kontrolni pregled. | Sumeja Mušić, Amina Alispahić | To Do | Nodemailer + planirani scheduler |
| US-32 | **Pregled rezervacija za doktora** — Kao doktor, želim da mogu pregledati sve rezervisane termine koji su zakazani kod mene, kako bih imao uvid u vlastiti raspored rada. | Merjem Milišić, Hana Mahmutović, Hamza Husović | To Do | Frontend pregled + backend API; prebačeno iz Sprint 5 |
| US-33 | **Upload i pregled PDF nalaza** — Kao pacijent, želim da mogu uploadati i pregledati PDF nalaze vezane za moj termin, kako bi doktor imao pristup relevantnoj medicinskoj dokumentaciji. | Merijem Milišić | To Do | File upload + storage + PDF pregled; prebačeno iz Sprint 5 |
| — | **Implementacija WebSocket-a — real-time vidljivost rasporeda** — Tehnički zadatak: Implementacija WebSocket veze kako bi promjene rasporeda bile vidljive svim korisnicima u realnom vremenu (≤2s). | Hamza Husović, Kenan Hatibović | To Do | NFR-16; Nije US iz backlog-a |
| — | **Završno testiranje end-to-end toka rezervacije** — Tehnički zadatak: Integraciono i E2E testiranje kompletnog toka rezervacije, otkazivanja i notifikacija kako bi sistem bio spreman za Release 1. | Kenan Htibović, Hamza Husović, Almedin Šehić | To Do | QA + integracioni testovi |
| — | **Pisanje Decision Log-a** — Tehnički zadatak: Dokumentovanje ključnih odluka donesenih tokom Sprint 6. | Amina Alispahić | To Do | Nije US iz backlog-a |

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
| RR-01 | Buffer zona — rizik od nezaključavanja termina u slučaju pada servera |
| RR-03 | Greške u logici zakazivanja termina |
| RR-10 | Dupli termini — race condition ako database locks nisu ispravno implementirani (NFR-22) |
| RR-13 | Konflikt u rasporedu doktora usljed nedostatka centralne provjere |
| RR-15 | Kašnjenje email notifikacija usljed problema sa eksternim servisom (Nodemailer) |

---

## Deliverable-i

- Implementiran pregled dostupnih doktora i slobodnih termina u realnom vremenu
- Funkcionalan tok rezervacije termina sa zaštitom od duplih rezervacija
- Mehanizam privremenog zaključavanja termina (buffer zona — 2 minute)
- Automatsko oslobađanje nepotvrđenih termina
- Funkcionalnost otkazivanja termina od strane pacijenta i medicinskog osoblja
- Mogućnost dodavanja komentara prilikom zakazivanja termina
- Email potvrda o rezervaciji putem Nodemailer-a
- Email notifikacija o otkazivanju termina
- Automatski podsjetnik za pacijente sa hroničnim oboljenjima
- Pregled rezervacija za doktora i medicinsko osoblje
- Upload i pregled PDF nalaza
- Implementirana autentifikacija (login i registracija)
- Real-time vidljivost promjena rasporeda (WebSocket)
- Zadovoljeni svi preostali NFR zahtjevi (NFR-09, NFR-10, NFR-11, NFR-12, NFR-16, NFR-22, NFR-25)

---

## Sažetak releasea

Ovo je završni sprint Release 1 — Rezervacijski sistem. Sprint 6 nadograđuje funkcionalni temelj iz Sprint 5 dodavanjem email notifikacija putem Nodemailer-a, zaštite od duplih rezervacija kroz database locks i ACID transakcije, te buffer zone za privremeno zaključavanje termina. Uvodi se autentifikacija koja zamjenjuje hardkodiranog korisnika, a pregled rezervacija postaje dostupan i medicinskom osoblju. Promjene rasporeda vidljive su u realnom vremenu putem WebSocket veze. Nakon ovog sprinta sistem je potpuno funkcionalan i spreman za produkcijsku upotrebu.

---

> **Napomena:** Ovaj Sprint Backlog je živi dokument i ažurira se kroz sprint. Svaki backlog item direktno je vezan za odgovarajući user story prema preporuci Product Ownera iz Sprint 5 Review-a.
>
> **Release:** Release 1 — Rezervacijski sistem | **Sprintovi:** Sprint 5 & Sprint 6 | **Ključna isporuka:** Funkcionalan end-to-end rezervacijski sistem spreman za upotrebu
