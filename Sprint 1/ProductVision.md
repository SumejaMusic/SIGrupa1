# Product vision

## Naziv projekta: 
Sistem za upravljanje bolničkim terminima

## Problem koji sistem rješava
Cilj našeg sistema je da se postojeće prakse koje su nepraktične za sve korisnike pojednostave. Klijenti prolaze kroz kompliciran proces zakazivanja termina i nemaju stalni uvid u svoje termine na jednom mjestu kroz jednostavan interface. Osim toga prolaze kroz suvišne dolaske u bolnicu, koji bi mogli biti izvedeni kroz online režim. Doktori u tom procesu provode dosta vremena na administrativnim poslovima, umjesto da posvete više vremena klijentima. Uz to, nemaju pregledan uvid u zakazane termine pregleda, a komunikacija sa specijalistima je spora. Menadžment bolnice nema jasnu sliku o tome koliko je bolnički kapacitet zaista iskorišten i da li je iskorišten efikasno.

Konkretni problemi

- Duple rezervacije usljed istovremenih zahtjeva više korisnika
- Neiskorištenost ljekarskih kapaciteta — ljekari imaju 8 sati rada, ali termini nisu optimalno raspoređeni
- Pacijenti kasno otkazuju ili uopće ne otkazuju termine, a niko drugi ne može iskoristiti slobodan slot
- Nema automatske obavijesti — ni pacijent ni ljekar ne dobijaju pravovremene podsjetnike
- Hronični bolesnici zaboravljaju zakazati redovne kontrole na vrijeme
- Termini kod specijalista su neorganizovani — pacijenti sami pokušavaju zakazati bez uputa ljekara opšte prakse
- Stariji pacijenti koji ne koriste internet ostaju bez pravovremenih informacija
- Privatnost medicinskih podataka nije adekvatno zaštićena u ručnim ili improvizovanim sistemima

Sve ovo rezultira preopterećenošću osoblja, nezadovoljnim pacijentima, izgubljenim terminima i lošim iskorištenjem resursa bolnice što u konačnici utiče na kvalitet zdravstvene zaštite.

## Ciljni korisnici
Ciljni korisnici sistema su doktori, klijenti, administratori i vlasnici.
- Klijenti (odnosno pacijenti) žele brzu rezervaciju, pregled svojih nalaza i historiju posjeta.
- Doktori žele mogućnost upravljanja svojim terminima, pregled postojećih nalaza, izdaju uputnica za specijaliste i potvrdu termina.
- Administrator treba imati mogućnost upravljanja bazom sistema i rješavanja tehničkih problema svih korisnika.
- Menadžment (odnosno vlasnici bolnice) ima mogućnost pregleda i praćenja statistike, kapaciteta i efikasnosti rada bolnice.

## Vrijednost sistema
### Za pacijenta
Umjesto čekanja na telefonu ili odlaska na šalter, pacijent u nekoliko klikova vidi slobodne termine, zakazuje pregled i dobija potvrdu na email. Ima uvid u svoju historiju posjeta i nalaze, a sistem ga podsjeća kada je vrijeme za kontrolu — posebno ako boluje od hronične bolesti.
### Za ljekara
Ljekar počinje radni dan sa jasnim pregledom rasporeda. Ne gubi vrijeme na administrativne pozive, može se fokusirati na pacijenta, a sistem mu omogućava pregled nalaza, izdavanje uputnica i zaključivanje termina direktno iz aplikacije.
### Za administraciju i vlasnika bolnice
Nema više ručne evidencije i grešaka. Vlasnik bolnice u realnom vremenu prati zauzetost kapaciteta, efikasnost odjela i iskorištenost ljekarskog radnog vremena od 8 sati — što omogućava bolje poslovne odluke.

## Scope MVP verzije
- Baza podataka korisnika (pacijenti i doktori sa ID-om)
- Login i registracija korisnika (povlačenje podataka pri rezervaciji)
- Pregled dostupnih doktora (padajuće liste ili pretraga) i prikaz njihovog kalendara/popunjenosti (8 sati rada)
- Osnovni sistem rezervacije (do 30-60 dana unaprijed) uz unos "razloga pregleda"
- Sistem zaključavanja termina na 2 minute (Buffer zona) dok pacijent unosi podatke kako bi se spriječile duple rezervacije
- Mogućnost otkazivanja termina (klijent na webu ili emailu, doktor u aplikaciji) uz pravilo "zabranjeno otkazivanje 24h prije"
- Automatska email potvrda o rezervaciji
- Pregled rasporeda (Dashboard) za doktora

## Šta ne ulazi u MVP
- Mogućnost da ljekar opšte prakse direktno rezerviše termin kod specijaliste za svog pacijenta
- Očitavanje i pregled nalaza unutar sistema, te zaključivanje termina sa medicinskim bilješkama
- Označavanje hitnosti slučaja i slanje obavijesti o hitnom stanju pacijenta
- SMS obavještenja namijenjena starijim pacijentima koji ne koriste email aktivno
- Automatski podsjetnici za pacijente sa hroničnim bolestima bazirani na statistici sistema o optimalnom vremenu kontrole
- Obavještenje pacijentu kada ljekar prebaci ili izmijeni termin
- Zauzetost kapaciteta, popunjenost ljekara po satnici, efikasnost odjela
- Zahtjev za posjet pacijentu na kućnoj adresi
- Srednjoročne rezervacije od 3 do 12 mjeseci unaprijed, namijenjene specijalistima
- Rezervacija termina putem glasa sa odgovorima isključivo DA, NE, ODUSTAJEM (putem AI asistenta, namijenjeno klijentima sa invaliditetom)

## Ključna ograničenja i pretpostavke
## Ograničenja
### Tehnička ograničenja
Buffer zona od dvije minute je kritična tačka, ako bi server imao problema u tom trenutku postoji rizik da se termin ili ne oslobodi na vrijeme ili da dođe do greške u rezervaciji.
Nije planirana mobilna aplikacija u MVP fazi, što bi moglo biti ograničenje za starije pacijente koji nemaju praksu korištenja weba. Sistem je u potpunosti ovisan o stabilnoj internet konekciji. U slučaju prekida mreže u bolnici, doktori i administratori gube pristup rasporedu i rezervacijama u realnom vremenu. Ako je sistem hostovan na internom bolničkom serveru, planirani ili neplanirani zastoji direktno onemogućavaju zakazivanje termina, bez fallback opcije za korisnike. Sistem se oslanja isključivo na web preglednik, što znači da stariji ili nestandardni preglednici mogu uzrokovati probleme u prikazu ili funkcionalnosti.

### Poslovna ograničenja
Budžet za razvoj sistema je ograničen, što direktno utiče na opseg i dinamiku realizacije. Sistem obrađuje osjetljive lične i medicinske podatke pacijenata, što ga stavlja pod regulatorni okvir zaštite podataka. Prije puštanja sistema u rad možda će biti potrebno pribaviti određene dozvole ili prolaziti kroz interne bolničke procedure odobravanja, što može produžiti rok isporuke.

### Ljudski faktor
Sistem ne može dati garanciju da će doktori redovno ažurirati termine ili unositi određene izmjene. Stariji pacijenti možda neće biti u mogućnosti da samostalno koriste sistem. Administratori ili doktori mogu pogrešno unijeti podatke (npr. radno vrijeme, trajanje termina), što kaskadno utiče na sve rezervacije. Doktori ili osoblje mogu dijeliti login podatke između kolega radi praktičnosti, što narušava sigurnost i onemogućava tačno praćenje ko je šta uradio u sistemu.

## Pretpostavke
### O korisnicima
Pretpostavlja se da pacijenti imaju osnovni pristup internetu i email adresi, jer se cijeli sistem notifikacija i potvrda oslanja na email komunikaciju.
Pretpostavlja se da ljekari imaju osnovno digitalno znanje (ili da su spremni prisustvovati kratkoj edukaciji) i da su voljni koristiti aplikaciju umjesto papirnog ili telefonskog rasporeda.

### O organizaciji
Pretpostavlja se da bolnica ima administratora koji će voditi i održavati bazu korisnika i dodavati nove ljekare, rješavati tehničke probleme i biti prva linija podrške.
Pretpostavlja se da menadžment bolnice podržava digitalizaciju i da će osigurati da osoblje prihvati novi način rada, jer bez toga sistem neće biti korišten bez obzira na tehničku kvalitetu.
Pretpostavlja se da bolnica ima stabilnu internet infrastrukturu koja može podržati svakodnevno korištenje sistema.

### O podacima
Pretpostavlja se da podaci pacijenata (JMBG i broj knjižice) već postoje u nekoj formi i da se mogu unijeti u sistem pri inicijalnom postavljanju.
Pretpostavlja se da su podaci tačni i ažurirani obzirom da sistem ne može funkcionisati pouzdano ako su osnovni podaci o pacijentima ili ljekarima netačni ili zastarjeli.
