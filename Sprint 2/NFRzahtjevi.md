# Non-Functional Requirements (NFR)

**Non-Functional Requirements (NFR)** predstavljaju skup zahtjeva koji definišu kvalitet sistema, a ne njegove funkcionalnosti. Dok **funkcionalni zahtjevi** opisuju šta sistem radi, **NFR** definišu kako sistem izvršava te funkcije.

U sistemu za zakazivanje medicinskih termina, **NFR zahtjevi** obuhvataju performanse, sigurnost, pouzdanost, skalabilnost i upotrebljivost. Oni osiguravaju da sistem radi brzo, sigurno i stabilno pod realnim opterećenjem korisnika.

Ovisno o kategoriji i prioritetu nefunkcionalnog zahtjeva, koriste se različite metode njihove provjere. To uključuje funkcionalno testiranje, nefunkcionalno testiranje, i testiranje prihvaćanja korisnika, odnosno user acceptance testing. Automatizirano funkcionalno testiranje može se provesti pomoću alata kao što su Selenium, JUnit, ili Cucumber. Nefunkcionalni testovi, poput testiranja performansi i sigurnosti, mogu se izvoditi pomoću alata kao što su JMeter i LoadRunner. Povratne informacije korisnika i evaluacija upotrebljivosti mogu se prikupljati pomoću alata poput SurveyMonkey ili UserTesting. 

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



## Lista Nefunkcionalnih zahtjeva za naš sistem

| ID     | Opis zahtjeva                                                                               | Kategorija     | Prioritet | Kako će se provjeravati | Napomena |
| ------ | ------------------------------------------------------------------------------------------- | -------------- | --------- | ----------------------- | -------- | 
| NFR-01 | Samo vlasnik i autorizovano medicinsko osoblje mogu pristupiti historiji pregleda pacijenta | Sigurnost      | Visok     | Testiranje pristupa historiji pacijenta sa različitim korisničkim ulogama | 
| NFR-02 | Historija pregleda mora biti prikazana jednostavno i bez komplikovane navigacije            | Upotrebljivost | Srednji   | Testiranje upotrebljivosti sa krajnjim korisnicima sistema, mjerenje broja klikova potrebnih za dolazak do historije | 
| NFR-03 | Prijava korisnika mora biti završena u roku od maksimalno 2 sekunde                         | Performanse    | Visok     | Testiranje performansi pomoću alata poput JMeter mjerenjem vremena prijave | 
| NFR-04 | Lozinke se moraju čuvati u hashiranom i sigurnom obliku                                     | Sigurnost      | Visok     | Pregled baze podataka, odnosno provjera jesu li lozinke u bazi pohranjene kao hash | 
| NFR-05 | Sistem mora blokirati korisnika nakon 5 neuspješnih pokušaja prijave                        | Sigurnost      | Visok     | Testiranje scenarija sa više neuspješnih prijava | 
| NFR-06 | Korisnik smije pristupiti samo funkcijama koje odgovaraju njegovoj ulozi                    | Sigurnost      | Visok     | Testiranje pristupa funkcijama za različite korisničke uloge | 
| NFR-07 | Sistem mora implementirati kontrolu pristupa zasnovanu na ulogama (RBAC)                    | Sigurnost      | Visok     | Verifikacija RBAC modela kroz testne scenarije i kontrolu pristupa | 
| NFR-08 | Sve izmjene termina moraju biti evidentirane u audit log sistemu                            | Pouzdanost     | Visok     | Provjerom audit logova nakon izmjene termina | 
| NFR-09 | Otkazani termini moraju odmah postati dostupni drugim korisnicima                           | Konzistentnost | Visok     | Otkazivanjem termina i trenutna provjera dostupnosti tog termina | 
| NFR-10 | Otkazivanje termina mora biti završeno u roku od 2–3 sekunde                                | Performanse    | Srednji   | Performans test otkazivanja termina mjerenjem vremena odziva |
| NFR-11 | Pacijent mora biti obaviješten o otkazivanju termina putem emaila                           | Pouzdanost     | Srednji   | Testiranje otkazivanje termina i provjera je li mail isporučen na pacijentovu adresu, npr. pomoću email sandbox alata | 
| NFR-12 | Sistem mora osigurati da se operacije izvršavaju bez djelimičnih zapisa                     | Pouzdanost     | Visok     | Simulacijom namjernog prekida operacije u sredini izvršavanja i pregledom baze podataka nakon toga, nijedan djelimični zapis ne smije biti u bazi, i baza mora biti u identičnom stanju kao i prije pokretanja operacije | 
| NFR-13 | Sesija korisnika mora automatski isteći nakon perioda neaktivnosti                          | Sigurnost      | Visok     | Ostavljanjem sesije neaktivnom duže od definisanog perioda i provjera je li sesija automatski prekinuta |
| NFR-14 | Nakon isteka sesije korisniku mora biti onemogućen pristup prethodnim podacima              | Sigurnost      | Visok     | Testiranjem isteka sesije i pokušajem pristupa zaštićenim stranicama, u tom slučaju sistem zahtijeva ponovnu prijavu i pristup podacima je zabranjen |
| NFR-15 | Dashboard sistema mora se učitati u prihvatljivom vremenskom roku                              | Performanse    | Visok     | Automatizovano testiranje performansi pomoću alata poput JMeter, mjeri se vrijeme učitavanja dashboarda pod normalnim i povećanim opterećenjem | 
| NFR-16 | Promjene rasporeda doktora moraju biti vidljive u realnom vremenu                           | Konzistentnost | Visok     | Izmjenom rasporeda doktora i provjerom prikaza UI bez potrebe za ručnim osvježavanjem stranice | 
| NFR-17 | Medicinski dokumenti moraju biti sigurno i trajno pohranjeni                                | Pouzdanost     | Visok     | Testiranje pohrane i backup mehanizama medicinskih dokumenata, testiranje oporavka dokumenata nakon simuliranog kvara, te provjera jesu li dokumenti dostupni bez autorizacije | 
| NFR-18 | Admin backend mora odgovarati u roku                                          | Performanse    | Visok     | Automatizirano testiranje opterećenja admin backenda slanjem više zahtjeva za redom i mjerenjem vremena odgovora. U ovom slučaju potrebno je definisati prihvatljiv prag i potvrditi poštuje li se | 
| NFR-19 | Baza podataka mora osigurati konzistentnost i integritet podataka                           | Pouzdanost     | Visok     | Testiranje integriteta podataka, npr. provjera unosa nevalidnih podataka, provjera ograničenja (unique, null, foreign key itd)
| NFR-20 | Sistem mora omogućiti brze upite nad velikim skupom podataka                                | Performanse    | Srednji   | Testiranje performansi upita nad velikim skupom podataka | 
| NFR-21 | Baza podataka mora biti dizajnirana u normalizovanom obliku                    | Skalabilnost   | Srednji   | Pregled dizajna baze podataka i normalizacije | 
| NFR-22 | Sistem mora zaključati termin na 2 minute tokom unosa podataka kako bi se sprječile duple rezervacije | Konzistentnost | Visok | Simulacija dva istovremena korisnika koji pokušavaju rezervisati isti termin, provjerava se uspijeva li samo jedan i traje li zaključavanje odgovarajući vremenski period. Sistem mora omogućiti zaključavanje termina samo jednom korisniku čiji zahtjev prvi stigne na server, ostali dobijaju odgovarajuću poruku | 
| NFR-23 | Sistem mora omogućiti two factor authentication kao dodatni sloj zaštite za korisnike | Sigurnost | Visok | Testiranje prijave sa aktiviranom 2FA, provjera da sistem traži 2FA | 
| NFR-24 | Sistem mora implementirati enkripciju za osjetljive zdravstvene podatke | Sigurnost | Visok | Pregled koda i baze podataka, provjera jesu li osjetljiva polja enkriptovana u bazi | 
