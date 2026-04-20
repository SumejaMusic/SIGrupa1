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
| 12 | 'Nalaz'                   | Medicinski nalaz vezan za pregled pacijenta                           |
| 13 | 'Soba' | Fizički prostor (ordinacija, sala, kabinet) u zdravstvenoj ustanovi koji je dodijeljen doktoru tokom radnog vremena |
| 14 | 'RasporedDoktora'  | Definira dostupnost doktora po danima i smjenama                         |
| 15 | 'Recept'           | Medicinski recept izdat pacijentu nakon pregleda                         |
| 16 | 'ListaCekanja'     | Evidencija pacijenata koji čekaju slobodan termin kod doktora            |
| 17 | 'TipPregleda'      | Klasifikacija vrste pregleda ili intervencije                            |
 
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
| `Uloga`                 | **Uloga** | Enum tip – npr. `ADMINISTRATOR`, `DOKTOR`, `PACIJENT` |

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
| `IDRasporeda`  | int | Strani ključ - RasporedDoktora (aktivan raspored doktora) |
| `BrojPregelda`       | int    | Ukupan broj pregleda            |
| `BrojLicence`        | int    | Licencni broj doktora           |
| `Specijalizacija`    | String | Npr. kardiologija, ortopedija   |
| `TrajanjePregelda`   | int    | Prosječno trajanje pregleda (min)|
| `IDSobe` | int | Strani ključ - Soba (soba dodijeljena doktoru tokom radnog vremena) |

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
| `Status`  | **Status** | Enum tip – `ZAKAZAN`, `POTVRĐEN` ili `OTKAZAN`        |

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
| `IDSobe` | int | Strani ključ - Soba (soba u kojoj se pregled ili intervencija obavlja) |
| `IDTipPregleda` | int | Strani ključ - TipPregleda                                         |


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
| `Terapija`       | String | Kratki opis terapije – detalji se vode u entitetu `Recept`                    |
| `Biljeske`       | String | Dodatne napomene doktora                        |
| `IDNalaz`        | int  | Strani ključ - Nalaz                             |

 
---
 
### 3.11 RezervacijaSpecijalista
 
| Atribut           | Tip    | Napomena                                               |
|-------------------|--------|--------------------------------------------------------|
| `ID`              | int    | Primarni ključ                                         |
| `IDSpecijaliste`  | int    | Strani ključ - Doktor    |
| `IDDoktorOpste`   | int    | Strani ključ - Doktor              |
| `IDRezervacije`   | int    | Strani ključ - Rezervacije         |
| `RazlogPregleda`  | String | Medicinski razlog upućivanja specijalistu              |

### 3.12 Nalaz
 
| Atribut         | Tip    | Napomena                                              |
|-----------------|--------|-------------------------------------------------------|
| `ID`            | int    | Primarni ključ                                        |
| `Naziv`         | String | Naziv nalaza                                          |
| `VrijemeNalaza` | Date   | Datum i vrijeme izdavanja nalaza                      |
| `Opis`          | String | Opis ili detalji nalaza                               |
| `DokumentPDF`   | BYTEA  | Priloženi PDF dokument nalaza                         |

### 3.13 Soba

| Atribut        | Tip         | Napomena                                                         |
|----------------|-------------|------------------------------------------------------------------|
| `ID`           | int         | Primarni ključ                                                   |
| `Naziv`        | String      | Npr. "Ordinacija 1", "Operaciona sala A"                         |
| `Tip`          | **TipSobe** | Enum tip – `ORDINACIJA`, `SALA`, `KABINET`, `LABORATORIJ`        |
| `Sprat`        | int         | Na kom spratu se soba nalazi                                     |
| `Kapacitet`    | int         | Maksimalan broj osoba (relevantnо za sale)                       |
| `Opis`         | String      | Dodatne napomene o sobi                                          |
| `StatusSobe`   | **StatusSobe** | Enum tip – `AKTIVNA`, `NEAKTIVNA`, `U_RENOVACIJI`             |


### 3.14 RasporedDoktora

| Atribut        | Tip              | Napomena                                                              |
|----------------|------------------|-----------------------------------------------------------------------|
| `ID`           | int              | Primarni ključ                                                        |
| `IDDoktor`     | int              | Strani ključ - Doktor                                                 |
| `DanUTjednu`   | **DanUSedmici**   | Enum tip – `PONEDJELJAK`, `UTORAK`,... |
| `VrijemeOd`    | Time             | Početak radnog vremena                                                |
| `VrijemeDo`    | Time             | Kraj radnog vremena                                                   |
| `DatumOd`      | Date             | Od kada vrijedi ovaj raspored                                         |
| `DatumDo`      | Date             | Do kada vrijedi ovaj raspored (null = bez ograničenja)                |
| `Aktivan`      | boolean          | Da li je raspored trenutno aktivan                                    |

### 3.15 Recept

| Atribut              | Tip    | Napomena                                              |
|----------------------|--------|-------------------------------------------------------|
| `ID`                 | int    | Primarni ključ                                        |
| `IDHistorijaPregleda`| int    | Strani ključ - HistorijaPregleda                      |
| `IDDoktor`           | int    | Strani ključ - Doktor (koji je propisao recept)       |
| `NazivLijeka`        | String | Ime lijeka ili preparata                              |
| `Doza`               | String | Npr. "500mg", "2x dnevno"                             |
| `Trajanje`           | int    | Trajanje terapije u danima                            |
| `Napomena`           | String | Posebne upute za uzimanje                             |
| `DatumIzdavanja`     | Date   | Datum izdavanja recepta                               |

### 3.16 ListaCekanja

| Atribut          | Tip                    | Napomena                                                      |
|------------------|------------------------|---------------------------------------------------------------|
| `ID`             | int                    | Primarni ključ                                                |
| `IDPacijent`     | int                    | Strani ključ - Pacijent                                       |
| `IDDoktor`       | int                    | Strani ključ - Doktor                                         |
| `DatumZahtjeva`  | Date                   | Kada je pacijent stavljen na listu čekanja                    |
| `Status`         | **StatusListeCekanja** | Enum tip – `CEKA`, `OBAVIJESTEN`        |
| `Prioritet`      | **Prioritet**          | Enum tip – `NORMALAN`, `HITAN`, `HRONICNI_BOLESNIK`           |
| `Napomena`       | String                 | Razlog ili dodatne informacije                                |

### 3.17 TipPregleda

| Atribut          | Tip    | Napomena                                                     |
|------------------|--------|--------------------------------------------------------------|
| `ID`             | int    | Primarni ključ                                               |
| `Naziv`          | String | Npr. "Preventivni pregled", "Kontrola", "Operacija"          |
| `Opis`           | String | Detaljan opis vrste pregleda                                 |
| `TrajanjeMInutа` | int    | Standardno trajanje ovog tipa pregleda u minutima            |
| `ZahtijevaSalu`  | boolean| Da li ovaj tip pregleda zahtijeva operacionu salu            |



---
Sistem koristi sljedeće enumeracijske tipove:

 ### 3.18 TipSobe
Definira tip fizičkog prostora u zdravstvenoj ustanovi.

| Vrijednost     | Opis                              |
|----------------|-----------------------------------|
| `ORDINACIJA`   | Standardna doktorska ordinacija   |
| `SALA`         | Operaciona ili intervencijska sala|
| `KABINET`      | Dijagnostički kabinet             |
| `LABORATORIJ`  | Laboratorijski prostor            |

---

### 3.19 StatusSobe
Definira trenutno stanje prostorije.

| Vrijednost      | Opis                                 |
|-----------------|--------------------------------------|
| `AKTIVNA`       | Soba je u upotrebi                   |
| `NEAKTIVNA`     | Soba privremeno nije u upotrebi      |
| `U_RENOVACIJI`  | Soba je van upotrebe zbog renovacije |

### 3.20 Uloga
 Definira moguće uloge korisnika u sistemu.
 
| Vrijednost           | Opis                                      |
|----------------------|-------------------------------------------|
| `ADMINISTRATOR`      | Administrator sistema                     |
| `PACIJENT`           | Pacijent                                  |
| `DOKTOR`             | Doktor                                    |
| `MEDICINSKO_OSOBLJE` | Medicinsko osoblje (sestre, tehničari...) |
| `VLASNIK`            | Vlasnik zdravstvene ustanove              |
 
---
 
### 3.21 Status
 Definira moguće statuse termina.
 
| Vrijednost  | Opis                          |
|-------------|-------------------------------|
| `ZAKAZAN`   | Termin je zakazan             |
| `POTVRĐEN`  | Termin je potvrđen/ zaključan         |
| `OTKAZAN`   | Termin je otkazan             |
 
---
### 3.22 DanUSedmici
Definira dane u sedmici za definisanje rasporeda doktora.

| Vrijednost    | Opis       |
|---------------|------------|
| `PONEDJELJAK` | Ponedjeljak|
| `UTORAK`      | Utorak     |
| `SRIJEDA`     | Srijeda    |
| `CETVRTAK`    | Četvrtak   |
| `PETAK`       | Petak      |
| `SUBOTA`      | Subota     |
| `NEDJELJA`    | Nedjelja   |

---

### 3.23 StatusListeCekanja
Definira stanje zahtjeva pacijenta na listi čekanja.

| Vrijednost     | Opis                                                      |
|----------------|-----------------------------------------------------------|
| `CEKA`         | Pacijent čeka slobodan termin                             |
| `OBAVIJESTEN`  | Pacijent je obaviješten o slobodnom terminu, čeka validaciju u tebli "Termin"               |


---

### 3.24 Prioritet
Definira prioritet pacijenta na listi čekanja.

| Vrijednost          | Opis                                                       |
|---------------------|------------------------------------------------------------|
| `HITAN`             | Pacijent zahtijeva hitnu medicinsku intervenciju           |
| `HRONICNI_BOLESNIK` | Pacijent boluje od hronične bolesti – povišen prioritet    |
| `NORMALAN`          | Standardni prioritet                                       |

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
Pacijent ──────────── Termin            (1 : N)   Pacijent može imati više termina
Pacijent ──────────── HistorijaPregleda        (1 : N)   Pacijent ima više zapisa u historiji
Doktor   ──────────── HistorijaPregleda        (1 : N)   Doktor kreira više zapisa u historiji
Rezervacije ───────── HistorijaPregleda        (1 : 1)   Jedna rezervacija - jedan zapis historije
Doktor (specijalist)  ──── RezervacijaSpec.    (1 : N)   Specijalist prima više upućivanja
Doktor (opšti)        ──── RezervacijaSpec.    (1 : N)   Opšti doktor upućuje više pacijenata
Rezervacije ───────── RezervacijaSpecijalista  (1 : 1)   Jedna rezervacija - jedno upućivanje
HistorijaPregleda ─── Nalaz                     (1 : N)   Jedan pregled može imati više nalaza
Soba     ──────────── Doktor            (1 : N)   Jedna soba može biti dodijeljena više doktora (u različitim smjenama)
Soba     ──────────── Rezervacije       (1 : N)   Jedna soba može biti lokacija za više rezervacija
Doktor          ──────────── RasporedDoktora    (1 : N)   Doktor ima više rasporeda (po danima/periodima)
HistorijaPregleda ────────── Recept             (1 : N)   Jedan pregled može imati više recepata
Pacijent        ──────────── ListaCekanja       (1 : N)   Pacijent može čekati kod više doktora
Doktor          ──────────── ListaCekanja       (1 : N)   Doktor može imati više pacijenata na listi čekanja
TipPregleda     ──────────── Rezervacije        (1 : N)   Jedan tip pregleda može biti vezan za više rezervacija

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
### 5.9 Nalaz
- Nalaz se kreira kao rezultat medicinskog pregleda i **vezan je za zapis u `HistorijaPregleda`**.
- Jedan pregled može imati **više nalaza** (npr. laboratorijski, radiološki).
- Polje `DokumentPDF` (tipa `BYTEA`) čuva binarni sadržaj PDF dokumenta nalaza.
- `VrijemeNalaza` bilježi tačan datum i vrijeme izdavanja nalaza.
### 5.10 Upravljanje Sobama
- Svaki doktor **mora imati dodijeljenu sobu** (`IDSobe`) tokom svog radnog vremena.
- Ista soba može biti dodijeljena **više doktora u različitim vremenskim intervalima** – sistem mora provjeriti konflikt zauzetosti sobe pri zakazivanju.
- Svaka rezervacija **sadrži informaciju o sobi** (`IDSobe`) kako bi pacijent znao gdje se pregled ili intervencija obavlja.
- Sobe sa statusom `NEAKTIVNA` ili `U_RENOVACIJI` **ne smiju biti dostupne** za dodjelu novim rezervacijama.
- Promjena sobe na rezervaciji mora biti **evidentirana u `AuditLog`**.

  ### 5.11 Raspored Doktora
- Sistem **ne smije dozvoliti** kreiranje termina van vremenskog intervala definisanog u `RasporedDoktora`.
- Ako doktor nema aktivan raspored (`Aktivan = false`), njegovi termini **nisu dostupni** za zakazivanje.
- Promjena rasporeda mora biti **evidentirana u `AuditLog`** i ne smije uticati na već potvrđene rezervacije.
### 5.12 Recept
- Recept se kreira isključivo **nakon završenog pregleda** (`Zavrseno = true` na `Rezervacije`).
- Jedan pregled (`HistorijaPregleda`) može imati **više recepata** (za različite lijekove).
- Recept je **read-only** nakon izdavanja — izmjene nisu dozvoljene bez posebnih ovlaštenja, analogno pravilima za `HistorijaPregleda`.

### 5.13 Lista Čekanja
- Pacijent se automatski dodaje na listu čekanja kada **ne postoji slobodan termin** kod traženog doktora.
- Kada se oslobodi termin, sistem **automatski obavještava** prvog pacijenta na listi prema prioritetu (`HITAN` > `KRONICNI_BOLESNIK` > `NORMALAN`).
- Nakon što pacijent potvrdi termin, status u `ListaCekanja` mijenja se u `ZAKAZAN`.

### 5.14 Tip Pregleda
- Svaka rezervacija **mora imati definisan tip pregleda** (`IDTipPregleda` je obavezno polje).
- Ako `ZahtijevaSalu = true`, sistem provjerava **dostupnost sale** pri zakazivanju.
- `TrajanjeMInutа` iz `TipPregleda` koristi se kao **default vrijednost** trajanja termina ako nije ručno definirano.
---

## 7. Zaključak

Predstavljeni domenski model pokriva sve ključne aspekte sistema za upravljanje medicinskim terminima:

- **Sigurnost** je osigurana kroz centralni `Korisnik` entitet i `AuditLog`.
- **Fleksibilnost** je postignuta odvajanjem `Termin`  od `Rezervacije` (zakazana posjeta).
- **Notifikacije** su modelovane kroz entitet `Podsjetnik` sa podrškom za više kanala slanja.
- **Organizacijska hijerarhija** je jasno definisana kroz entitet `Odjel`.
- **Medicinska dokumentacija** je kompletirana entitetom `Nalaz` koji omogućava prilaganje PDF dokumenata uz preglede

---
