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
| NFR-01 | Samo vlasnik i autorizovano medicinsko osoblje mogu pristupiti historiji pregleda pacijenta | Sigurnost      | Visok     | Testiranje pristupa historiji pacijenta sa različitim korisničkim ulogama | Uloge: pacijent, doktor, admin. Sprečava neovlašten pristup osjetljivim podacima pacijenta | 
| NFR-02 | Historija pregleda mora biti prikazana jednostavno i bez komplikovane navigacije            | Upotrebljivost | Nizak   | Testiranje upotrebljivosti sa krajnjim korisnicima sistema, mjerenje broja klikova potrebnih za dolazak do historije | Historija mora biti dostupna u maksimalno 2 ili 3 klika od početne stranice | 
| NFR-03 | Prijava korisnika mora biti završena u roku od maksimalno 2 sekunde                         | Performanse    | Visok     | Testiranje performansi pomoću alata poput JMeter mjerenjem vremena prijave | - | 
| NFR-04 | Lozinke se moraju čuvati u hashiranom i sigurnom obliku                                     | Sigurnost      | Visok     | Pregled baze podataka, odnosno provjera jesu li lozinke u bazi pohranjene kao hash | Plain-text lozinka ne smije biti vidljiva nigdje u sistemu | 
| NFR-05 | Sistem mora blokirati korisnika nakon 5 neuspješnih pokušaja prijave                        | Sigurnost      | Visok     | Testiranje scenarija sa više neuspješnih prijava | Smanjuje rizik od brute force napada | 
| NFR-06 | Korisnik smije pristupiti samo funkcijama koje odgovaraju njegovoj ulozi                    | Sigurnost      | Visok     | Testiranje pristupa funkcijama za različite korisničke uloge | - |
| NFR-07 | Sistem mora implementirati kontrolu pristupa zasnovanu na ulogama (RBAC)                    | Sigurnost      | Visok     | Verifikacija RBAC modela kroz testne scenarije i kontrolu pristupa | - | 
| NFR-08 | Sve izmjene termina moraju biti evidentirane u audit log sistemu                            | Pouzdanost     | Visok     | Provjerom audit logova nakon izmjene termina | Svaki zapis u audit logu mora sadržavati: ID korisnika, tip akcije, stari/novi podatak i vremensku oznaku |
| NFR-09 | Otkazani termini moraju odmah postati dostupni drugim korisnicima                           | Konzistentnost | Srednji     | Otkazivanjem termina i trenutna provjera dostupnosti tog termina | Kašnjenje između otkazivanja i ponovne dostupnosti termina mora biti ispod 2 sekunde | 
| NFR-10 | Otkazivanje termina mora biti završeno u roku od 2–3 sekunde                                | Performanse    | Srednji   | Performans test otkazivanja termina mjerenjem vremena odziva | Mjerenje počinje od iniciranje otkazivanja do potvrde sistema | 
| NFR-11 | Pacijent mora biti obaviješten o otkazivanju termina putem emaila                           | Pouzdanost     | Srednji   | Testiranje otkazivanje termina i provjera je li mail isporučen na pacijentovu adresu, npr. pomoću email sandbox alata | Email mora sadržavati detalje otkazanog termina (datum, doktor)
| NFR-12 | Sistem mora osigurati da se operacije izvršavaju bez djelimičnih zapisa                     | Pouzdanost     | Visok     | Simulacijom namjernog prekida operacije u sredini izvršavanja i pregledom baze podataka nakon toga, nijedan djelimični zapis ne smije biti u bazi, i baza mora biti u identičnom stanju kao i prije pokretanja operacije | Osigurava da neuspješna operacija ne ostavi bazu u nekonzistentnom stanju | 
| NFR-13 | Sesija korisnika mora automatski isteći nakon perioda neaktivnosti                          | Sigurnost      | Visok     | Ostavljanjem sesije neaktivnom duže od definisanog perioda i provjera je li sesija automatski prekinuta | Period neaktivnosti mora biti jasno definisan u konfiguraciji sistema | 
| NFR-14 | Nakon isteka sesije korisniku mora biti onemogućen pristup prethodnim podacima              | Sigurnost      | Visok     | Testiranjem isteka sesije i pokušajem pristupa zaštićenim stranicama, u tom slučaju sistem zahtijeva ponovnu prijavu i pristup podacima je zabranjen | Pokušaj pristupa sa isteklim tokenom mora vraćati grešku 401 | 
| NFR-15 | Dashboard sistema mora se učitati u roku od maksimalno 3 sekunde                           | Performanse    | Visok     | Automatizovano testiranje performansi pomoću alata poput JMeter, mjeri se vrijeme učitavanja dashboarda pod normalnim i povećanim opterećenjem | - |
| NFR-16 | Promjene rasporeda doktora moraju biti vidljive u roku od 2 sekunde bez potrebe za ručnim osvježavanjem stranice | Konzistentnost | Visok     | Izmjenom rasporeda doktora i provjerom prikaza UI | Može se implementirati pomoću WebSocketa | 
| NFR-17 | Medicinski dokumenti moraju biti sigurno i trajno pohranjeni                                | Pouzdanost     | Visok     | Testiranje pohrane i backup mehanizama medicinskih dokumenata, testiranje oporavka dokumenata nakon simuliranog kvara, te provjera jesu li dokumenti dostupni bez autorizacije | Backup mora biti testiran na oporavak. Dokumenti ne smiju biti dostupni bez autorizacije | 
| NFR-18 | Admin backend mora odgovarati u roku od 2 sekunde                                       | Performanse    | Visok     | Automatizirano testiranje opterećenja admin backenda slanjem više zahtjeva za redom i mjerenjem vremena odgovora | - |
| NFR-19 | Baza podataka mora osigurati konzistentnost i integritet podataka                           | Pouzdanost     | Visok     | Testiranje integriteta podataka, npr. provjera unosa nevalidnih podataka, provjera ograničenja | Provjera ograničenja (constraints): foreign key, unique, not null i sl. | 
| NFR-20 | Sistem mora omogućiti brze upite nad velikim skupom podataka                                | Performanse    | Srednji   | Testiranje performansi upita nad velikim skupom podataka | Testiranje se vrši nad skupom od najmanje 50 000 zapisa u bazi podataka | 
| NFR-21 | Baza podataka mora biti dizajnirana u normalizovanom obliku                    | Skalabilnost   | Srednji   | Pregled dizajna baze podataka i normalizacije | Normalizacija poboljšava održavanje i performanse baze |
| NFR-22 | Sistem mora zaključati termin na 2 minute tokom unosa podataka kako bi se sprječile duple rezervacije | Konzistentnost | Visok | Simulacija dva istovremena korisnika koji pokušavaju rezervisati isti termin, provjerava se uspijeva li samo jedan i traje li zaključavanje odgovarajući vremenski period. Sistem mora omogućiti zaključavanje termina samo jednom korisniku čiji zahtjev prvi stigne na server, ostali dobijaju odgovarajuću poruku | Nakon isteka 2 minute bez završene rezervacije, zaključavanje se automatski oslobađa. Buffer zona od 2 minute je kritična tačka, jer u slučaju pada servera postoji rizik da se termin ne oslobodi na vrijeme | 
| NFR-23 | Sistem mora omogućiti two factor authentication kao dodatni sloj zaštite za korisnike | Sigurnost | Visok | Testiranje prijave sa aktiviranom 2FA, provjera da sistem traži 2FA | Podržane metode 2FA trebaju biti definisane (SMS, email kod i sl.) | 
| NFR-24 | Sistem mora implementirati enkripciju za osjetljive zdravstvene podatke | Sigurnost | Visok | Pregled koda i baze podataka, provjera jesu li osjetljiva polja enkriptovana u bazi | Enkripcija se primjenjuje na sve osjetljive podatke: JMBG, broj zdravstvene knjižice, dijagnoze, nalazi i medicinska historija |
| NFR-25 | Sistem mora biti dostupan najmanje 99% vremena u toku radnog vremena klinike | Pouzdanost | Visok | Praćenjem uptime kroz monitoring alate poput UptimeRobot | Planirani maintenance mora unaprijed biti najavljen korisnicima | 
| NFR-26 | Sistem mora imati intuitivan interfejs za upravljanje i rezervaciju termina | Upotrebljivost | Srednji | Testiranje interfejsa sa krajnjim korisnicima, mjerenje broja klikova potrebnih za rezervaciju | Rezervacija mora biti brza i jednostavna bez nepotrebnih koraka |
