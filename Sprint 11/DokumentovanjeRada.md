# Dokumentovanje rada

## 1. Svrha projekta
SwiftMed je web aplikacija namijenjena zdravstvenim ustanovama koje svakodnevno upravljaju velikim brojem pacijenata, doktora i zakazanih pregleda. Svrha projekta je zamjena klasičnog, ručnog i često nepreciznog načina zakazivanja pregleda modernim digitalnim sistemom koji omogućava automatsko upravljanje terminima, pregled dostupnosti u realnom vremenu i smanjenje administrativnog opterećenja medicinskog osoblja.
Sistem je izgrađen kao centralizovana platforma za upravljanje terminima, gdje pacijenti mogu samostalno zakazivati preglede, dok doktori i administracija imaju potpun uvid u raspored i zauzetost termina. Arhitektura sistema omogućava jasno razdvajanje uloga korisnika, pri čemu svaki korisnik ima definisane dozvole i pristup samo onim funkcionalnostima koje su relevantne za njegovu ulogu.

Primarni cilj projekta je povećanje efikasnosti procesa zakazivanja i smanjenje grešaka kao što su duple rezervacije ili preklapanje termina. Sistem implementira validaciju dostupnosti u realnom vremenu, automatsko zaključavanje termina tokom rezervacije te pravila koja osiguravaju konzistentnost rasporeda. Na ovaj način omogućava se pouzdan i organizovan tok upravljanja medicinskim pregledima od inicijalne rezervacije pa sve do konačne evidencije zakazanog termina.
## 2. Problem koji sistem rješava
Zdravstvene ustanove svakodnevno upravljaju velikim brojem pacijenata, doktora i zakazanih pregleda, pri čemu se proces zakazivanja termina u mnogim slučajevima i dalje oslanja na polu-ručne ili nedovoljno optimizovane metode. Tradicionalni pristup rezervaciji termina često dovodi do neefikasnosti, grešaka i loše organizacije rasporeda.

Konkretni problemi koje ovaj sistem rješava su sljedeći:

**Duple rezervacije i konflikti u rasporedu** – jedan od najčešćih problema u klasičnim sistemima zakazivanja jeste preklapanje termina, gdje isti termin može biti dodijeljen više pacijenata ili se raspored doktora ne ažurira u realnom vremenu. Ovo dovodi do organizacionih problema, kašnjenja i nezadovoljstva pacijenata. Sistem rješava ovaj problem implementacijom centralizovane validacije koja u trenutku rezervacije provjerava dostupnost termina i sprječava konflikte.

**Neefikasan pregled dostupnih termina** – u tradicionalnom pristupu pacijenti ili administracija često nemaju jasan i ažuran uvid u slobodne termine doktora. Informacije su rasute ili se vode ručno, što otežava brzo donošenje odluke o zakazivanju. Ovaj sistem omogućava pregled dostupnosti u realnom vremenu, čime se proces zakazivanja značajno ubrzava.

**Visoko administrativno opterećenje osoblja** – medicinsko osoblje i administracija troše značajan dio vremena na telefonsko zakazivanje, ručno vođenje evidencije i ispravljanje grešaka u rasporedu. Ovakav način rada smanjuje efikasnost i povećava mogućnost propusta. Sistem automatizuje proces rezervacije i smanjuje potrebu za manuelnim intervencijama.

**Nedostatak jasne evidencije i praćenja termina** – u klasičnim sistemima često ne postoji centralizovana istorija zakazanih i odrađenih termina, što otežava praćenje aktivnosti pacijenata i doktora. Ovaj sistem uvodi strukturisanu evidenciju svih rezervacija, uključujući status termina i historiju promjena, čime se poboljšava preglednost i kontrola.

**Problemi u komunikaciji između pacijenata i zdravstvenog osoblja** – bez digitalnog sistema dolazi do nesporazuma oko termina, otkazivanja i promjena rasporeda. Sistem uvodi jasno definisane informacije o svakom terminu i omogućava transparentan prikaz statusa, čime se smanjuju greške u komunikaciji.

## 3. Glavne korisničke uloge
**Pacijent** predstavlja krajnjeg korisnika sistema koji koristi platformu za zakazivanje i praćenje svojih medicinskih pregleda. Pacijent ima mogućnost pregleda dostupnih termina, kreiranja rezervacija te uvida u historiju i status svojih zakazanih pregleda. Nakon prijave, pacijent se usmjerava na stranicu /moje-rezervacije, gdje može upravljati svim svojim aktivnim i prošlim terminima. Ova uloga nema pristup podacima drugih korisnika niti mogućnost upravljanja sistemskim parametrima.

**Doktor** je medicinski korisnik koji ima pristup terminima pacijenata koji su mu dodijeljeni. Doktor može pregledati svoj raspored, detalje zakazanih pregleda te informacije o pacijentima. Također ima mogućnost upravljanja statusom termina i dodavanja napomena vezanih za određene preglede. Početna stranica za doktora je /doktor-rezervacije, gdje dobija pregled svih relevantnih termina organizovanih po vremenu i statusu.

**Medicinsko osoblje** ima ulogu operativne podrške u okviru sistema i odgovorno je za pregled rasporeda, kontrolu termina i administrativne zadatke vezane za organizaciju pregleda. Ova uloga ima širi uvid u sistem u odnosu na pacijente, ali bez direktnog uticaja na medicinske odluke. Početna stranica za medicinsko osoblje je /osoblje-panel, gdje se prikazuju svi aktivni termini i rasporedi doktora.

**Administrator** ima najviši nivo ovlaštenja u sistemu i odgovoran je za cjelokupno upravljanje platformom. Administrator upravlja korisničkim nalozima, dodjeljuje uloge, kontroliše pristup sistemu i ima uvid u sve rezervacije i aktivnosti unutar aplikacije. Početna stranica za administratora je /admin, gdje se nalaze alati za konfiguraciju i upravljanje sistemom.

**Vlasnik** predstavlja ulogu fokusiranu na analitiku i strateški pregled sistema. Vlasnik nema operativni pristup rezervacijama, već koristi sistem za praćenje statistika, izvještaja i ključnih performansi sistema kao što su broj pregleda, zauzetost doktora i ukupna iskorištenost kapaciteta. Početna stranica za ovu ulogu je /menadzment, gdje se prikazuju agregirani podaci i poslovni izvještaji.
