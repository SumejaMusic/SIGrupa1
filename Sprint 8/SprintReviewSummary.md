# Sprint Review Summary

Ovaj izvještaj sumira rezultate završenog sprinta, identifikuje isporučene vrijednosti i definiše korekcije plana na osnovu povratnih informacija.

---

## Sprint broj

Sprint 8

---

## Planirani sprint goal

Završetak personalizovanih panela za sve korisničke uloge u sistemu — doktor panel sa kompletnim tokom rada, panel medicinskog osoblja sa označavanjem hitnosti i upravljanje korisničkim ulogama, te implementacija role-based routinga koji preusmjerava svakog korisnika na odgovarajući panel nakon prijave.

---

## Šta je završeno

| ID | Naziv | Napomena |
|----|-------|----------|
| US-03 | Prijava korisnika (login) | Funkcionisala je kako je predviđeno — korisnici su uspješno autentifikovani |
| — | Role-based routing — osnovna logika preusmjeravanja | Preusmjeravanje prema ulozi radilo je ispravno nakon prijave |

---

## Šta nije završeno

| ID | Naziv | Razlog |
|----|-------|--------|
| US-11 | Dashboard za doktora — pregled rasporeda | Funkcionalnost implementirana, ali nije radila zbog nemogućnosti pristupa serveru |
| US-21 | Pregled komentara termina (doktor) | Nije funkcionisalo — serverska greška blokirala pristup |
| US-17 | Rezervacija termina kod specijaliste putem doktora | Nije funkcionisalo — serverska greška blokirala pristup |
| US-24 | Panel medicinskog osoblja | Implementiran, ali panel nije bio klikabilan — nije moguća nikakva interakcija |
| US-28 | Označavanje hitnosti termina | Zavisnost od US-24 — nije funkcionisalo usljed iste greške |

---

## Demonstrirane funkcionalnosti ili artefakti

- Tok prijave korisnika — uspješna autentifikacija i role-based preusmjeravanje demonstrirani su i funkcionišu ispravno.
- Implementirani paneli prikazani su kao statični prikazi kako bi se pokazala struktura i dizajn, ali interaktivnost nije bila moguća zbog serverske greške.

---

## Glavni problemi i blokeri

- **Greška u kodu pred kraj sprinta** — Kritična greška uvedena neposredno pred kraj roka onemogućila je pristup serveru, što je blokiralo funkcionisanje većine implementiranih funkcionalnosti.
- **Nedovoljno vremena za dijagnozu i popravku** — Greška je otkrivena prekasno, bez dovoljno prostora za ispravljanje prije review sesije.
- **Panel medicinskog osoblja — problem klikabilnosti** — Pored serverske greške, panel medicinskog osoblja imao je zaseban UI problem koji je onemogućavao interakciju s komponentama.
- **Kasni deploy** — Integracija i deploy nisu provedeni dovoljno rano tokom sprinta, što je ostavilo premalo vremena za otkrivanje i rješavanje problema.

---

## Ključne odluke donesene u sprintu

- Sve nedovršene stavke iz Sprinta 8 prenose se u Sprint 9 kao prioritet.
- Ispravljanje serverske greške i osiguravanje stabilnog okruženja proglašeno je preduvjetom za nastavak razvoja.
- Dogovoreno je da se u narednom sprintu deploy provodi ranije kako bi ostalo dovoljno vremena za otkrivanje infrastrukturnih problema.

---

## Povratna informacija Product Ownera

Sprint nije ispunio postavljeni cilj. Jedina potpuno funkcionalna stavka je prijava korisnika i osnovna logika role-based routinga. Ostatak planiranih funkcionalnosti nije demonstriran u upotrebljivom stanju. Prioritet u narednom sprintu je ispravljanje blokatora i isporuka funkcionalnosti koje su bile planirane za Sprint 8.

---

## Zaključak za naredni sprint

Sprint 9 mora u prvom redu otkloniti serversku grešku i stabilizovati okruženje prije nastavka razvoja novih funkcionalnosti. Uvodi se pravilo ranijeg deploya — najkasnije sredinom sprinta — kako bi potencijalni infrastrukturni problemi bili otkriveni na vrijeme. Raspodjela zadataka bit će revidirana kako bi se smanjila koncentracija zavisnosti na jednoj osobi ili jednom dijelu sistema, a integracijsko testiranje mora početi ranije nego što je to bio slučaj u Sprintu 8.
