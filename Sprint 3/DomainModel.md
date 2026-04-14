# Domain Model
## Sistem za upravljanje terminima

---

## 1. Uvod

Ovaj dokument opisuje domenski model informacionog sistema za upravljanje medicinskim terminima, rezervacijama i pacijentima u zdravstvenoj ustanovi. Model je izveden na osnovu dijagrama entiteta i veza (ER dijagram) i obuhvata sve ključne entitete, njihove atribute te poslovne veze između njih.

---

## 2. Glavni Entiteti

Sistem se sastoji od sljedećih **entiteta**:

| # | Entitet           | Opis                                                                 |
|---|-------------------|----------------------------------------------------------------------|
| 1 | 'Korisnik'        | Centralni entitet koji predstavlja sve korisnike sistema             |
| 2 | 'Pacijent'        | Osoba koja koristi zdravstvene usluge                                |
| 3 | 'Doktor'          | Liječnik koji pruža medicinske usluge                                |
| 4 | 'MediciskoOsoblje'| Medicinsko osoblje koje nije doktor (sestre, tehničari, itd.)        |
| 5 | 'Odjel'           | Organizaciona jedinica unutar zdravstvene ustanove                   |
| 6 | 'Termin'          | Slobodan vrijeme dostupno za zakazivanje                      |
| 7 | 'Rezervacije'     | Konkretan zakazani termin između pacijenta i doktora                 |
| 8 | 'Podsjetnik'      | Automatska notifikacija vezana za rezervaciju                        |
| 9 | 'AuditLog'        | Evidencija svih promjena i aktivnosti u sistemu                      |
| 10 | 'HistorijaPregleda'|Trajni zapis o svim obavljenim medicinskim intervencijama i dijagnozama|
|11 | 'RezervacijaSpecijaliste' | Rezervisanje termina od strane doktora |
---

## 3. Ključni Atributi po Entitetu

### 3.1 Korisnik
> Bazni entitet za autentikaciju i autorizaciju svih aktera u sistemu.

| Atribut               | Tip      | Napomena                          |
|-----------------------|----------|-----------------------------------|
| `ID`                  | int      | Primarni ključ                    |
| `JMBG`                | int      | Jedinstveni matični broj          |
| `Ime`                 | String   |                                   |
| `Prezime`             | String   |                                   |
| `DatumRođenja`        | Date     |                                   |
| `Email`               | String   | Kontakt i login                   |
| `PristupnaŠifra`      | int      | Hash lozinke                      |
| `BrojTelefona`        | int      |                                   |
| `DatumRegistracije`   | Date     |                                   |
| `BrojNeuspjelihPrijava` | int   | Za zaključavanje naloga           |
| `Uloga`               | String   | Npr. `admin`, `doktor`, `pacijent`|

---

### 3.2 Pacijent

| Atribut             | Tip     | Napomena                        |
|---------------------|---------|---------------------------------|
| `ID`                | int     | Primarni ključ                  |
| `IDKorisnik`        | int     | Strani ključ - Korisnik         |
| `IDTermin`          | int     | Strani ključ - Termin           |
| `BrojKnjžice`       | int     | Broj zdravstvene knjižice       |
| `HronicniBolesnik`  | boolean | Da li je pacijent hronični bolesnik |

---

### 3.3 Doktor

| Atribut              | Tip    | Napomena                        |
|----------------------|--------|---------------------------------|
| `ID`                 | int    | Primarni ključ                  |
| `IDKorisnik`         | int    | Strani ključ - Korisnik         |
| `IdOdjela`           | int    | Strani ključ - Odjel            |
| `RadnoVrijeme`       | int    |                                 |
| `BrojPregelda`       | int    | Ukupan broj pregleda            |
| `BrojLicence`        | int    | Licencni broj doktora           |
| `Specijalizacija`    | String | Npr. kardiologija, ortopedija   |
| `TrajanjePregelda`   | int    | Prosječno trajanje pregleda (min)|

---

### 3.4 MediciskoOsoblje

| Atribut        | Tip    | Napomena                   |
|----------------|--------|----------------------------|
| `ID`           | int    | Primarni ključ             |
| `IDKorisnik`   | int    | Strani ključ - Korisnik    |
| `IdOdjel`      | int    | Strani ključ - Odjel       |
| `Pozicija`     | String | Radno mjesto               |
| `RadnoVrijeme` | int    |                            |

---

### 3.5 Odjel

| Atribut  | Tip    | Napomena        |
|----------|--------|-----------------|
| `ID`     | int    | Primarni ključ  |
| `Naziv`  | String | Ime odjela      |
| `Opis`   | String |                 |

---

### 3.6 Termin

| Atribut      | Tip    | Napomena                              |
|--------------|--------|---------------------------------------|
| `ID`         | int    | Primarni ključ                        |
| `Datum`      | Date   |                                       |
| `Vrijeme`    | int    |                                       |
| `Opis`       | String | Napomena uz termin                    |
| `Potvrđen`   | String | Status potvrde                        |
| `Otkazivanje`| String | Razlog ili status otkazivanja         |

---

### 3.7 Rezervacije

| Atribut           | Tip     | Napomena                        |
|-------------------|---------|---------------------------------|
| `ID`              | int     | Primarni ključ                  |
| `IDTermina`       | int     | Strani ključ - Termin           |
| `IDPacijent`      | int     | Strani ključ - Pacijent         |
| `IDDoktor`        | int     | Strani ključ - Doktor           |
| `DokorRezervisao` | boolean | Da li je doktor inicirao        |
| `Komentar`        | String  |                                 |
| `Hitnost`         | boolean | Hitna intervencija              |
| `DAtumKreiranja`  | Date    |                                 |
| `DatumOtkazivanja`| Date    |                                 |
| `DoktorOtkazao`   | boolean |                                 |
| `Zavrseno`        | boolean | Da li je pregled završen        |

---

### 3.8 Podsjetnik

| Atribut          | Tip    | Napomena                        |
|------------------|--------|---------------------------------|
| `ID`             | int    | Primarni ključ                  |
| `IDPacijent`     | int    | Strani ključ - Pacijent         |
| `VrijemeTermina` | int    |                                 |
| `DatumTermina`   | Date   |                                 |
| `IDRezervacije`  | int    | Strani ključ - Rezervacije      |
| `DatumSlanja`    | Date   |                                 |
| `StatusSalanja`  | String | Npr. `poslano`, `čeka`, `greška`|
| `NačinSlanja`    | String | Npr. `email`, `SMS`             |

---

### 3.9 AuditLog

| Atribut             | Tip    | Napomena                         |
|---------------------|--------|----------------------------------|
| `ID`                | int    | Primarni ključ                   |
| `IDKorisnika`       | int    | Strani ključ - Korisnik          |
| `TipAkcije`         | String | Npr. `INSERT`, `UPDATE`, `DELETE`|
| `VrijemeAkcije`     | Date   |                                  |
| `StariPodaci`       | String | Prethodno stanje zapisa          |
| `NoviPodaci`        | String | Novo stanje zapisa               |
| `IzmenjenaTabela`   | String | Naziv izmijenjene tabele         |
| `IPAdresa`          | String | IP adresa korisnika              |


### 3.10 HistorijaPregleda
 
| Atribut          | Tip    |  Napomena                                        |
|------------------|--------|-------------------------------------------------|
| `ID`             | int    | Primarni ključ                                  |
| `IDPacijent`     | int    | Strani ključ - Pacijent     |
| `IDDoktor`       | int    | Strani ključ - Doktor     |
| `IDRezervacija`  | int    | Strani ključ - Rezervaijcije       |
| `DatumPregleda`  | Date   | Datum kada je pregled obavljen                  |
| `Dijagnoza`      | String | Medicinska dijagnoza                            |
| `Terapija`       | String | Propisana terapija ili lijek                    |
| `Biljeske`       | String | Dodatne napomene doktora                        |
 
---
 
### 3.11 RezervacijaSpecijalista
 
| Atribut           | Tip    | Napomena                                               |
|-------------------|--------|--------------------------------------------------------|
| `ID`              | int    | Primarni ključ                                         |
| `IDSpecijaliste`  | int    | Strani ključ - Doktor    |
| `IDDoktorOpste`   | int    | Strani ključ - Doktor              |
| `IDRezervacije`   | int    | Strani ključ - Rezervacije         |
| `RazlogPregleda`  | String | Medicinski razlog upućivanja specijalistu              |
 

---

## 4. Veze Između Entiteta

```
Korisnik ──────────── Pacijent          (1 : 1)   Korisnik ima jedan Pacijent profil
Korisnik ──────────── Doktor            (1 : 1)   Korisnik ima jedan Doktor profil
Korisnik ──────────── MediciskoOsoblje  (1 : 1)   Korisnik ima jedan profil osoblja
Korisnik ──────────── AuditLog          (1 : N)   Korisnik može imati više log zapisa
Odjel    ──────────── Doktor            (1 : N)   Odjel ima više doktora
Odjel    ──────────── MediciskoOsoblje  (1 : N)   Odjel ima više medicinskog osoblja
Pacijent ──────────── Rezervacije       (1 : N)   Pacijent može imati više rezervacija
Doktor   ──────────── Rezervacije       (1 : N)   Doktor može imati više rezervacija
Termin   ──────────── Rezervacije       (1 : N)   Termin može imati više rezervacija
Pacijent ──────────── Podsjetnik        (1 : N)   Pacijent prima više podsjetnika
Rezervacije ───────── Podsjetnik        (1 : 1)   Rezervacija ima jedan podsjetnik
Pacijent ──────────── Termin            (N : M)   Pacijent može imati više termina
Pacijent ──────────── HistorijaPregleda        (1 : N)   Pacijent ima više zapisa u historiji
Doktor   ──────────── HistorijaPregleda        (1 : N)   Doktor kreira više zapisa u historiji
Rezervacije ───────── HistorijaPregleda        (1 : 1)   Jedna rezervacija - jedan zapis historije
Doktor (specijalist)  ──── RezervacijaSpec.    (1 : N)   Specijalist prima više upućivanja
Doktor (opšti)        ──── RezervacijaSpec.    (1 : N)   Opšti doktor upućuje više pacijenata
Rezervacije ───────── RezervacijaSpecijalista  (1 : 1)   Jedna rezervacija - jedno upućivanje

```

---

## 5. Poslovna Pravila

### 5.1 Autentikacija i Sigurnost
- Svaki akter u sistemu (doktor, pacijent, osoblje, admin) **mora imati korisnički nalog** u entitetu `Korisnik`.
- Polje `BrojNeuspjelihPrijava` koristi se za **blokiranje naloga** nakon određenog broja neuspješnih pokušaja prijave.
- Polje `Uloga` u `Korisnik` entitetu određuje **nivo pristupa** .
- Sve izmjene u sistemu **moraju biti logovane** u `AuditLog` sa IP adresom, vremenom i starim/novim podacima.

### 5.2 Zakazivanje Termina
- Termin postoji **nezavisno** od rezervacije – predstavlja slobodan vremenski slot.
- Rezervacija **spaja pacijenta, doktora i termin** u jednu cjelinu.
- Rezervaciju može inicirati i **doktor** (`DokorRezervisao = true`) i pacijent.
- Hitne rezervacije (`Hitnost = true`) trebaju imati **prioritet** u obradi.

### 5.3 Otkazivanje
- I doktor i pacijent mogu otkazati rezervaciju, što se bilježi odvojeno:
  - `DoktorOtkazao` – boolean flag za otkazivanje od strane doktora.
  - `DatumOtkazivanja` – datum otkazivanja.
  - `Otkazivanje` u `Termin` entitetu – razlog otkazivanja termina.

### 5.4 Podsjetnici
- Svaka rezervacija **može imati jedan podsjetnik** koji se šalje pacijentu.
- Podsjetnik sadrži informacije o načinu slanja (`email`, `SMS`) i statusu (`poslano`, `čeka`, `greška`).
- `DatumSlanja` bilježi kada je podsjetnik poslan.

### 5.5 Organizacijska Struktura
- Svaki **doktor pripada jednom odjelu**.
- Svako **medicinsko osoblje pripada jednom odjelu**.
- Odjel ima naziv i opis, što omogućava fleksibilno proširivanje strukture ustanove.

### 5.6 Pacijentski Podaci
- Polje `HronicniBolesnik` omogućava **prioritizaciju** pacijenata s hroničnim bolestima.
- `BrojKnjžice` je jedinstveni identifikator pacijenta unutar zdravstvenog sistema.
### 5.7 Historija Pregleda
- Nakon što je rezervacija označena kao `Zavrseno = true`, **mora se kreirati zapis** u `HistorijaPregleda`.
- Svaka rezervacija može imati **tačno jedan zapis** u historiji (1:1 veza).
- Polja `Dijagnoza`, `Terapija` i `Biljeske` čuvaju kompletnu medicinsku dokumentaciju pregleda.
- `HistorijaPregleda` je **read-only** nakon unosa – izmjene nisu dozvoljene bez posebnih ovlaštenja .

### 5.8 Rezervacija Specijaliste
- Upućivanje specijalistu inicira **isključivo opšti doktor** (`IDDoktorOpste`).
- Jedna rezervacija može rezultovati **tačno jednim upućivanjem** specijalistu (1:1 veza sa `Rezervacije`).
- `RazlogPregleda` je **obavezno polje** – upućivanje bez medicinskog razloga nije validno.
- `IDSpecijaliste` i `IDDoktorOpste` referišu isti entitet `Doktor`, ali s **različitim ulogama** u kontekstu upućivanja.

---

## 7. Zaključak

Predstavljeni domenski model pokriva sve ključne aspekte sistema za upravljanje medicinskim terminima:

- **Sigurnost** je osigurana kroz centralni `Korisnik` entitet i `AuditLog`.
- **Fleksibilnost** je postignuta odvajanjem `Termin`  od `Rezervacije` (zakazana posjeta).
- **Notifikacije** su modelovane kroz entitet `Podsjetnik` sa podrškom za više kanala slanja.
- **Organizacijska hijerarhija** je jasno definisana kroz entitet `Odjel`.

---
