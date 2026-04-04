# Non-Functional Requirements (NFR)

**Non-Functional Requirements (NFR)** predstavljaju skup zahtjeva koji definišu kvalitet sistema, a ne njegove funkcionalnosti. Dok **funkcionalni zahtjevi** opisuju šta sistem radi, **NFR** definišu kako sistem izvršava te funkcije.

U sistemu za zakazivanje medicinskih termina, **NFR zahtjevi** obuhvataju performanse, sigurnost, pouzdanost, skalabilnost i upotrebljivost. Oni osiguravaju da sistem radi brzo, sigurno i stabilno pod realnim opterećenjem korisnika.

## Klasifikacija nefunkcionalnih zahtjeva

| Kategorija        | Opis                                                                |
|-------------------|---------------------------------------------------------------------|
| Performanse       | Definišu brzinu i odziv sistema (npr. vrijeme učitavanja stranica)  |
| Sigurnost         | Zaštita sistema od neovlaštenog pristupa i zloupotrebe              |
| Pouzdanost        | Stabilnost sistema i očuvanje podataka u slučaju greške             |
| Konzistentnost    | Osigurava da su podaci uvijek tačni i usklađeni                     |
| Skalabilnost      | Sposobnost sistema da radi pod većim brojem korisnika               |
| Upotrebljivost    | Koliko je sistem jednostavan i intuitivan za korištenje             |
| Privatnost        | Zaštita osjetljivih i ličnih podataka korisnika                     |
| Održivost         | Lakoća održavanja i proširenja sistema u budućnosti                 |

## Kategorije prioriteta

| Prioritet        | Opis                                                                       |
|------------------|----------------------------------------------------------------------------|
| Visoki (High)    | Kritične funkcionalnosti bez kojih sistem ne može raditi                   |
| Srednji (Medium) | Važne funkcionalnosti koje poboljšavaju sistem, ali nisu blokirajuće       |
| Niski (Low)      | Dodatne funkcionalnosti koje nisu neophodne za osnovni rad sistema         |



## Lista Nefunkcionalnih zahtjeva za nas sistem

| ID     | Naziv zahtjeva                                                                              | Kategorija     | Prioritet |
| ------ | ------------------------------------------------------------------------------------------- | -------------- | --------- |
| NFR-01 | Samo vlasnik i autorizovano medicinsko osoblje mogu pristupiti historiji pregleda pacijenta | Sigurnost      | Visok     |
| NFR-02 | Historija pregleda mora biti prikazana jednostavno i bez komplikovane navigacije            | Upotrebljivost | Srednji   |
| NFR-03 | Prijava korisnika mora biti završena u roku od maksimalno 2 sekunde                         | Performanse    | Visok     |
| NFR-04 | Lozinke se moraju čuvati u hashiranom i sigurnom obliku                                     | Sigurnost      | Visok     |
| NFR-05 | Sistem mora blokirati korisnika nakon 5 neuspješnih pokušaja prijave                        | Sigurnost      | Visok     |
| NFR-06 | Korisnik smije pristupiti samo funkcijama koje odgovaraju njegovoj ulozi                    | Sigurnost      | Visok     |
| NFR-07 | Sistem mora implementirati kontrolu pristupa zasnovanu na ulogama (RBAC)                    | Sigurnost      | Visok     |
| NFR-08 | Sve izmjene termina moraju biti evidentirane u audit log sistemu                            | Pouzdanost     | Visok     |
| NFR-09 | Otkazani termini moraju odmah postati dostupni drugim korisnicima                           | Konzistentnost | Visok     |
| NFR-10 | Otkazivanje termina mora biti završeno u roku od 2–3 sekunde                                | Performanse    | Srednji   |
| NFR-11 | Pacijent mora biti obaviješten o otkazivanju termina putem emaila                           | Pouzdanost     | Srednji   |
| NFR-12 | Sistem mora osigurati da se operacije izvršavaju bez djelimičnih zapisa                     | Pouzdanost     | Visok     |
| NFR-13 | Sesija korisnika mora automatski isteći nakon perioda neaktivnosti                          | Sigurnost      | Visok     |
| NFR-14 | Nakon isteka sesije korisniku mora biti onemogućen pristup prethodnim podacima              | Sigurnost      | Visok     |
| NFR-15 | Dashboard sistema mora se učitati u prihvatljivom vremenskom roku                                  | Performanse    | Visok     |
| NFR-16 | Promjene rasporeda doktora moraju biti vidljive u realnom vremenu                           | Konzistentnost | Visok     |
| NFR-17 | Medicinski dokumenti moraju biti sigurno i trajno pohranjeni                                | Pouzdanost     | Visok     |
| NFR-18 | Admin backend mora odgovarati u roku                                          | Performanse    | Visok     |
| NFR-19 | Baza podataka mora osigurati konzistentnost i integritet podataka                           | Pouzdanost     | Visok     |
| NFR-20 | Sistem mora omogućiti brze upite nad velikim skupom podataka                                | Performanse    | Srednji   |
| NFR-21 | Baza podataka mora biti dizajnirana u normalizovanom obliku                    | Skalabilnost   | Srednji   |
| NFR-22 | Sistem mora privremeno zaključati odabrani termin na 2 minute tokom unosa podataka kako bi se sprječile duple rezervacije | Konzistentnost | Visok | 
| NFR-23 | Sistem mora omogućiti two factor authentication kao dodatni sloj zaštite za korisnike | Sigurnost | Visok |
