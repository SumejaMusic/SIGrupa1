# Product vision

## Naziv projekta: 
Sistem za upravljanje bolnickim terminima

## Problem koji sistem rjesava
Cilj naseg sistema je da se postojece prakse koje su neprakticne za sve korisnike pojednostave. Klijenti prolaze kroz komplikovan proces zakazivanja termina i nemaju stalni uvid u svoje termine na jednom mjestu kroz jednostavan interface. Osim toga prolaze kroz suvisne dolaske u bolnicu, koji bi mogli biti izvedeni kroz online rezim. Doktori u tom procesu provode dosta vremena na administracijskim poslovima, umjesto da posvete vise vremena klijentima. Uz to, nemaju pregledan uvid u zakazane termine pregleda, a komunikacija sa specijalistima je spora. Menadzment bolnice nema jasnu sliku o tome koliko je bolnicki kapacitet zaista iskoristen i da li je iskoristen efikasno. 

## Ciljni korisnici
Ciljni korisnici sistema su doktori, klijenti, administratori i vlasnici.
Klijenti (odnosno pacijenti) zele brzu rezervaciju, pregled svojih nalaza i historiju posjeta.
Doktori zele mogucnost upravljanja svojim terminima, pregled postojecih nalaza, izdaju uputnica za specijaliste i potvrdu termina.
Administrator treba imati mogucnost upravljanja bazom sistema i rjesavanja tehnickih problema svih korisnika.
Menadzment (odnosno vlasnici bolnice) ima mogucnost pregleda i pracenja statistike, kapaciteta i efikasnosti rada bolnice.

## Vrijednost sistema
Sistem ima za cilj rijesiti prethodno navedene probleme. Klijenti ce imati pristup platformi preko koje moze jednostavno rezervisati termine i pregledati postojece. Doktorima ce administracijski poslovi biti olaksani i imat ce pregledniji uvid u postojece termine. Administratori nece morati voditi racuna o preklapanjima termina, jer ce sistem to raditi za njih. Menadzment ce imati uvid u statistiku sto ce pomoci u poboljsanju poslovanja bolnice, kao i pruzanju bolje usluge pacijentima.

## Scope MVP verzije
- Baza podataka korisnika (pacijenti i doktori sa ID-om)
- Login i registracija korisnika (povlacenje podataka pri rezervaciji)
- Pregled dostupnih doktora (padajuce liste ili pretraga) i prikaz njihovog kalendara/popunjenosti (8 sati rada)
- Osnovni sistem rezervacije (do 30-60 dana unaprijed) uz unos "razloga pregleda"
- Sistem zakljucavanja termina na 2 minute (Buffer zona) dok pacijent unosi podatke kako bi se sprijecile duple rezervacije
- Mogucnost otkazivanja termina (klijent na webu ili emailu, doktor u aplikaciji) uz pravilo "zabranjeno otkazivanje 24h prije"
- Automatska email potvrda o rezervaciji
- Pregled rasporeda (Dashboard) za doktora

## Sta ne ulazi u MVP
- Mogucnost da ljekar opste prakse direktno rezervise termin kod specijaliste za svog pacijenta
- Ocitavanje i pregled nalaza unutar sistema, te zakljucivanje termina sa medicinskim biljeskama
- Oznacavanje hitnosti slucaja i slanje obavijesti o hitnom stanju pacijenta
- SMS obavjestenja namijenjena starijim pacijentima koji ne koriste email aktivno
- Automatski podsjetnici za pacijente sa hronicnim bolestima bazirani na statistici sistema o optimalnom vremenu kontrole
- Obavjestenje pacijentu kada ljekar prebaci ili izmijeni termin
- Zauzetost kapaciteta, popunjenost ljekara po satnici, efikasnost odjela
- Zahtjev za posjet pacijentu na kucnoj adresi
- Srednjorocne rezervacije od 3 do 12 mjeseci unaprijed, namijenjene specijalistima
- Rezervacija termina putem glasa sa odgovorima iskljucivo DA, NE, ODUSTAJEM (putem AI asistenta, namijenjeno klijentima sa invaliditetom)

## Kljucna ogranicenja i pretpostavke
### Ogranicenja
### Tehnicka ogranicenja
Buffer zona od dvije minute je kriticna tacka, ako bi server imao problema u tom trenutku postoji rizik da se termin ili ne oslobodi na vrijeme ili da dodje do greske u rezervaciji.
Nije planirana mobilna aplikacija u MVP fazi, sto bi moglo biti ogranicenje za starije pacijente koji nemaju praksu koristenja weba.

### Ljudski faktor
Sistem ne moze dati garanciju da ce doktorni redovno azurirati termine ili unositi odredjene izmjene. Stariji pacijenti mozda nece biti u mogucnosti da samostalno koriste sistem.

### Pretpostavke
### O korisnicima
Pretpostavlja se da pacijenti imaju osnovni pristup internetu i email adresi, jer se cijeli sistem notifikacija i potvrda oslanja na email komunikaciju.
Pretpostavlja se da ljekari imaju osnovno digitalno znanje (ili da su spremni prisustvovati kratkoj edukaciji) i da su voljni koristiti aplikaciju umjesto papirnog ili telefonskog rasporeda.

### O organizaciji
Pretpostavlja se da bolnica ima administratora koji ce voditi i odrzavati bazu korisnika i dodavati nove ljekare, rjesavati tehnicke probleme i biti prva linija podrske.
Pretpostavlja se da menadzment bolnice podrzava digitalizaciju i da ce osigurati da osoblje prihvati novi nacin rada, jer bez toga sistem nece biti koristen bez obzira na tehnicku kvalitetu.
Pretpostavlja se da bolnica ima stabilnu internet infrastrukturu koja moze podrzati svakodnevno koristenje sistema.

### O podacima
Pretpostavlja se da podaci pacijenata (JMBG i broj knjizice) vec postoje u nekoj formi i da se mogu unijeti u sistem pri inicijalnom postavljanju.
Pretpostavlja se da su podaci tacni i azurirani obzirom da sistem ne moze funkcionisati pouzdano ako su osnovni podaci o pacijentima ili ljekarima netacni ili zastarjeli.

