# Sprint Review Summary

Ovaj izvještaj sumira rezultate završenog sprinta, identifikuje isporučene vrijednosti i definiše korekcije plana na osnovu povratnih informacija.

---

**Sprint broj:** Sprint 5

---

## Planirani sprint goal

Cilj ovog sprinta je uspostavljanje stabilnog i funkcionalnog temelja za **Release 1 – Rezervacijski sistem**, kroz implementaciju osnovnih poslovnih funkcionalnosti i tehničke infrastrukture potrebne za end-to-end tok rezervacije termina.

Fokus sprinta je na ispunjenju ključnih funkcionalnih zahtjeva sistema prije samog release-a, sa naglaskom na integraciju svih slojeva aplikacije (frontend, backend i baza podataka), te omogućavanje prvog djelimičnog deployment-a aplikacije.

---

## Šta je završeno

### Implementirane user storije

| ID | Naziv | Status |
|----|-------|--------|
| US-05 | Pregled dostupnih resursa — doktori i slobodni termini |  Završeno |
| US-06 | Rezervacija termina na osnovu dostupnog rasporeda |  Završeno |
| US-07 | Rezervacija termina kod doktora po izboru pacijenta |  Završeno |
| US-10 | Otkazivanje termina od strane pacijenta | Završeno |

### Tehnički zadaci

- Uspostavljena komunikacija između frontend i backend sloja (API integracija)
- Implementirane CRUD operacije nad terminima i rezervacijama
- Implementiran hardkodirani korisnik kao privremeno rješenje do uvođenja autentifikacije
- Postavljena osnovna backend arhitektura za upravljanje rezervacijama

---

## Šta nije završeno

| ID | Naziv | Razlog / Plan |
|----|-------|---------------|
| US-08 | Email potvrda o rezervaciji (Nodemailer) | Prebačeno u Sprint 6 |
| US-13 | Validacija i sprječavanje duplih rezervacija | Prebačeno u Sprint 6 |
| US-12 | Automatsko oslobađanje zaključanih termina — buffer zona | Prebačeno u Sprint 6 |
| US-09 | Otkazivanje termina od strane medicinskog osoblja | Prebačeno u Sprint 6 |
| US-22 | Dodavanje komentara prilikom zakazivanja termina | Prebačeno u Sprint 6 |
| — | Pregled rezervacija za doktora | Prebačeno u Sprint 6 |
| — | Upload i pregled PDF nalaza |  Prebačeno u Sprint 6 |
| — | Mail notifikacije o potvrdi rezervacije | Prebačeno u Sprint 6 |

### NFR zahtjevi

Sljedeći NFR zahtjevi nisu zadovoljeni u ovom sprintu i planirani su za Sprint 6:

- **NFR-09** — Otkazani termini dostupni u ≤2s
- **NFR-10** — Otkazivanje završeno u roku 2–3 sekunde
- **NFR-11** — Email obavijest pacijentu o otkazivanju
- **NFR-12** — ACID konzistentnost operacija
- **NFR-16** — Real-time vidljivost promjena rasporeda (WebSocket)
- **NFR-22** — Zaključavanje termina na 2 minute tokom unosa

---

## Demonstrirane funkcionalnosti

- Tok rezervacije termina: odabir odjela → odabir doktora → odabir tipa pregleda → odabir dostupnog termina
- Pregled vlastitih rezervacija od strane pacijenta
- Otkazivanje termina uz primijenjeno pravilo zabrane otkazivanja 24h prije termina

---

## Glavni problemi i blokeri

- Nedovoljna pokrivenost frontend sloja — tim se više fokusirao na backend implementaciju, što je rezultovalo jednostavnijim UI-em od planiranog
- Odsutnost autentifikacije — kao privremeno rješenje uveden je hardkodirani korisnik, što ograničava testiranje višekorisničkih scenarija
- Sprint backlog nije sadržavao konkretne user storije već samo generalne zadatke, što je otežalo praćenje napretka i procjenu dovršenosti

---

## Ključne odluke donesene u sprintu

- **Hardkodirani korisnik:** Donijeta je odluka da se privremeno koristi hardkodirani korisnik sve do implementacije modula za login i registraciju, kako se razvoj rezervacijskog sistema ne bi blokirao ovisnošću o autentifikaciji.
- **Prioritizacija backenda:** Tim je svjesno usmjerio kapacitete prema backend sloju i API integraciji kako bi se osigurao stabilan temelj za funkcionalan end-to-end tok u Sprint 6.

---

## Povratna informacija Product Ownera

Product Owner je pozitivno ocijenio prezentaciju i demonstrirane funkcionalnosti. Jedina navedena zamjerka odnosi se na strukturu sprint backloga — istaknuto je da backlog nije sadržavao konkretne user storije, već samo generalne zadatke, što otežava transparentnost i praćenje napretka. Preporuka za naredne sprintove je da svaki backlog item bude direktno vezan za odgovarajući user story.

---

## Zaključak za naredni sprint

Sprint 6 fokusiraće se na dovršetak svih preostalih funkcionalnosti Release 1 — rezervacijski sistem mora biti potpuno funkcionalan i spreman za upotrebu. Prioriteti su:

- Implementacija email notifikacija (potvrda rezervacije i otkazivanja) putem Nodemailer-a
- Zaštita od duplih rezervacija i implementacija buffer zone (NFR-22)
- Pregled rezervacija za doktora i medicinsko osoblje
- Zadovoljavanje svih preostalih NFR zahtjeva (NFR-09, NFR-10, NFR-11, NFR-12, NFR-16)
- Sprint backlog u Sprint 6 sadrži eksplicitno navedene user storije prema preporuci Product Ownera
 
  
