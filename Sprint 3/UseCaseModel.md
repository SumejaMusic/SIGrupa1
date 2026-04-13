# Use Case Model

## UC-01: Rezervacija termina kod doktora

### 1. Akter
**Pacijent**

### 2. Kratak opis
Proces omogućava pacijentu da pregleda slobodne termine kod izabranog doktora i izvrši digitalnu rezervaciju kako bi osigurao pregled bez čekanja.

### 3. Preduslovi
- Pacijent je uspješno prijavljen na sistem
- Postoje definisani slobodni termini u radnom vremenu doktora
- Pacijent nema već rezervisan termin u isto vrijeme kod drugog doktora

### 4. Glavni tok
1. Pacijent pretražuje doktore po imenu ili specijalnosti
2. Sistem prikazuje listu doktora
3. Pacijent bira doktora i sistem otvara njegov interaktivni kalendar
4. Pacijent bira slobodan termin
5. Sistem zaključava termin na 2 minute kako bi spriječio duple rezervacije
6. Pacijent popunjava obavezna polja i opcionalni komentar/napomenu
7. Pacijent klikne na **"Potvrdi"**
8. Sistem upisuje termin u bazu kao **"ZAKAZAN"** i šalje e-mail potvrdu

### 5. Alternativni tokovi

**A1: Termin je već zauzet**
Ako je drugi korisnik prvi kliknuo na termin, sistem prikazuje poruku:
> "Žao nam je. Termin je već rezervisan."

**A2: Istek vremena (međuspremnik)**
Ako pacijent ne potvrdi termin u roku od 2 minute, sistem oslobađa termin i vraća pacijenta na početni ekran uz poruku o isteku vremena.

**A3: Dupla rezervacija**
Ako pacijent već ima termin u to vrijeme, sistem blokira potvrdu uz poruku:
> "Već imate rezervisan termin u ovo vrijeme."

**A4: Neispravni podaci**
Ako pacijent ne popuni obavezna polja, sistem prikazuje upozorenje i ne dozvoljava čuvanje podataka.

### 6. Ishod
- Termin je evidentiran u bazi pod statusom **"ZAKAZAN"**
- Pacijent je primio e-mail sa detaljima (datum, vrijeme, doktor)
- Termin više nije vidljiv kao slobodan za druge korisnike

---

## UC-02: Prijava na sistem

### 1. Akter
**Korisnik** (Pacijent, Doktor, Medicinsko osoblje ili Administrator)

### 2. Kratak opis
Proces omogućava korisniku siguran pristup aplikaciji putem e-mail adrese i lozinke, uz opcionalnu dvofaktorsku autentifikaciju (2FA) za dodatnu zaštitu podataka.

### 3. Preduslovi
- Korisnik ima kreiran i aktivan nalog u bazi podataka
- Sistem je dostupan i funkcionalan (dostupnost 99%)
- Lozinka korisnika je prethodno heširana u bazi (AES-256)

### 4. Glavni tok
1. Korisnik unosi svoju e-mail adresu i lozinku na formi za prijavu
2. Sistem vrši validaciju formata e-mail adrese
3. Sistem provjerava unesene podatke u bazi
4. Sistem evidentira uspješnu prijavu u audit log
5. Sistem preusmjerava korisnika na odgovarajući kontrolni panel na osnovu njegove uloge
6. Prijava se završava

### 5. Alternativni tokovi

**A1: Pogrešni podaci**
Ako korisnik unese pogrešan e-mail ili lozinku, sistem prikazuje poruku:
> "Pogrešan e-mail ili lozinka."

**A2: Blokada naloga**
Ako korisnik unese pogrešnu lozinku 5 puta zaredom, sistem automatski blokira nalog i šalje e-mail obavještenje vlasniku.

**A3: Dvofaktorska autentifikacija (2FA)**
Ako korisnik ima aktiviran 2FA, sistem nakon ispravne lozinke šalje jednokratni kod na e-mail. Korisnik mora unijeti kod u roku od 5 minuta da bi pristupio aplikaciji.

**A4: Zaboravljena lozinka**
Korisnik bira opciju **"Zaboravljena lozinka"** i sistem mu šalje link za resetovanje koji važi 10 minuta.

**A5: Detekcija neobičnog ponašanja**
Na 3. neuspješnom pokušaju, sistem prikazuje upozorenje o preostala 2 pokušaja prije blokade.

### 6. Ishod
- Korisnik je uspješno autorizovan i ima pristup funkcijama koje odgovaraju njegovoj ulozi (RBAC)
- Kreirana je aktivna korisnička sesija koja će isteći nakon 15 minuta neaktivnosti
- U bazi je zabilježeno vrijeme i ID korisnika koji je pristupio sistemu

---

## UC-03: Reset lozinke

### 1. Akter
**Korisnik** (Pacijent, Doktor, Administrator)

### 2. Kratak opis
Proces omogućava korisniku da resetuje svoju lozinku putem 
email linka u slučaju da je zaboravi, uz vremensko ograničenje 
linka od 10 minuta i maksimalno 3 pokušaja u roku od sat vremena.

### 3. Preduslovi
- Korisnik ima aktivan nalog u sistemu
- Korisnik ima validnu email adresu registrovanu u sistemu
- Sistem može slati emailove

### 4. Glavni tok
1. Korisnik klikne na opciju **"Zaboravljena lozinka"**
2. Korisnik unosi svoju email adresu
3. Sistem šalje link za resetovanje na korisnikov email
4. Korisnik klikne na link i unosi novu lozinku
5. Sistem bilježi novu lozinku i preusmjerava korisnika
   na formu za prijavu

### 5. Alternativni tokovi

**A1: Istekao link**
Ako je od slanja linka prošlo više od 10 minuta,
sistem prikazuje poruku:
> *"Link za resetovanje je istekao."*

**A2: Link već iskorišten**
Sistem ne dozvoljava ponovnu upotrebu linka koji
je već jednom iskorišten za resetovanje lozinke.

**A3: Prekoračen limit pokušaja**
Ako korisnik pokuša generisati link više od 3 puta
u roku od sat vremena, sistem blokira zahtjev uz poruku:
> *"Morate čekati 1h do sljedećeg pokušaja 
generisanja linka za promjenu lozinke."*

**A4: Email ne postoji u sistemu**
Ako korisnik unese email koji ne postoji u bazi,
sistem prikazuje neutralnu poruku:
> *"Link za resetovanje lozinke će biti poslan 
na Vašu mail adresu."*

**A5: Neispravan format email adrese**
Ako korisnik unese email u neispravnom formatu,
sistem prikazuje poruku:
> *"Neispravan format mail adrese!"*

**A6: Lozinka ne ispunjava sigurnosne zahtjeve**
Ako nova lozinka nema minimum 8 karaktera, najmanje
jedno veliko slovo i jedan broj, sistem blokira
čuvanje uz poruku o sigurnosnim zahtjevima.

### 6. Ishod
- Nova lozinka je sačuvana u sistemu
- Korisnik je preusmjeren na formu za prijavu
- Iskorišteni link više nije validan

---

## UC-04: Upravljanje radnim vremenom i dužinom termina

### 1. Akteri
- **Administrator** (Glavni akter koji vrši izmjene)
- **Doktor** (Sekundarni akter koji šalje upite za promjenu)

### 2. Kratak opis
Proces omogućava administratoru da definiše i mijenja radno vrijeme doktora, dok doktor može slati formalne upite za promjenu dužine trajanja pregleda kako bi se sistem uskladio sa stvarnim stanjem u ustanovi.

### 3. Preduslovi
- Administrator i doktor su prijavljeni na sistem sa odgovarajućim ulogama
- Doktor je prethodno registrovan u sistemu
- Sistem ima definisane trenutne termine i njihovo trajanje

### 4. Glavni tok
1. Administrator bira doktora iz liste registrovanih zaposlenika
2. Sistem prikazuje trenutni kalendar i radno vrijeme izabranog doktora
3. Administrator unosi novo radno vrijeme (početak i kraj smjene)
4. Sistem automatski provjerava da li u novom terminu već postoje rezervisani pacijenti
5. Administrator potvrđuje izmjene klikom na dugme **"Potvrdi"**
6. Sistem ažurira kalendar u realnom vremenu i on postaje vidljiv pacijentima
7. Sistem evidentira promjenu u audit log (ko je izmijenio i kada)

### 5. Alternativni tokovi

**A1: Postojeći zakazani termini**
Ako administrator pokuša promijeniti radno vrijeme u periodu u kojem već postoje zakazani pacijenti, sistem blokira akciju i prikazuje poruku:
> "Nije moguće promijeniti radno vrijeme. Doktor ima rezervisane termine u ovom periodu."

**A2: Upit doktora za promjenu dužine termina**
Doktor šalje upit za promjenu trajanja pregleda uz obrazloženje. Administrator prima obavještenje, pregleda upit i može ga odobriti ili odbiti.

**A3: Preklapanje kod promjene dužine**
Ako bi nova dužina termina (npr. sa 15 na 30 minuta) izazvala preklapanje sa već rezervisanim pacijentima, sistem ne dozvoljava promjenu.

**A4: Neovlašteni pristup**
Ako doktor pokuša direktno promijeniti svoje radno vrijeme (bez administratora), sistem mu to onemogućava.

### 6. Ishod
- Novo radno vrijeme je sačuvano u bazi podataka
- Kalendar doktora je ažuriran i dostupan pacijentima za nove rezervacije
- Doktor prima obavještenje o statusu svog upita (odobreno/odbijeno)

---

## UC-05: Dodavanje i pregled laboratorijskih nalaza

### 1. Akteri
- **Medicinsko osoblje** (glavni akter)
- **Doktor**
- **Pacijent**

### 2. Kratak opis
Proces omogućava medicinskom osoblju da u digitalni karton pacijenta doda laboratorijske nalaze u PDF formatu, čime se osigurava dostupnost relevantnih medicinskih podataka doktoru tokom pregleda.

### 3. Preduslovi
- Medicinsko osoblje je prijavljeno na sistem
- Pacijent ima kreiran nalog i historiju pregleda
- Nalaz je pripremljen u PDF formatu

### 4. Glavni tok
1. Medicinsko osoblje pretražuje pacijenta po imenu ili ID-u
2. Otvara profil ili specifični termin pacijenta
3. Bira opciju **"Dodaj nalaz"**
4. Sistem otvara prozor za odabir datoteke
5. Korisnik bira PDF fajl i potvrđuje prijenos
6. Sistem vrši enkripciju fajla (AES-256) prije pohrane
7. Sistem povezuje nalaz sa historijom pregleda pacijenta
8. Sistem prikazuje poruku: **"Nalaz uspješno dodan."**

### 5. Alternativni tokovi

**A1: Pogrešan format fajla**
Ako korisnik pokuša dodati JPG ili Word dokument, sistem blokira prijenos i prikazuje poruku:
> "Dozvoljeni su samo PDF fajlovi."

**A2: Neovlašteni pristup**
Ako pacijent pokuša pristupiti tuđem nalazu, sistem odbija pristup na osnovu RBAC kontrole.

**A3: Prekid veze tokom prijenosa**
Ako dođe do prekida internetske veze, sistem osigurava da nema djelimičnih zapisa u bazi (povratak na prethodno stanje).

**A4: Pregled nalaza**
Kada doktor klikne na naziv nalaza, sistem dekriptuje fajl i otvara ga u novom tabu preglednika.

### 6. Ishod
- Laboratorijski nalaz je sigurno pohranjen u enkriptovanom obliku
- Nalaz je dostupan doktoru u sekciji **"Historija pregleda"**
- Pacijent može pregledati svoj nalaz putem korisničkog sučelja

---

## UC-06: Otkazivanje termina (medicinsko osoblje)

### 1. Akter
**Medicinsko osoblje**

### 2. Kratak opis
Proces omogućava medicinskom osoblju da otkaže već rezervisan termin pacijenta u slučaju promjena u rasporedu, uz automatsku obavijest pacijentu i trenutno oslobađanje termina u kalendaru.

### 3. Preduslovi
- Medicinsko osoblje je prijavljeno na sistem sa odgovarajućom ulogom
- Termin koji se otkazuje postoji u bazi i ima status **"ZAKAZAN"**
- Termin još nije počeo (otkazivanje je moguće samo prije samog pregleda)

### 4. Glavni tok
1. Medicinsko osoblje otvara panel i pretražuje listu zakazanih termina
2. Osoblje bira konkretan termin pacijenta koji želi otkazati
3. Osoblje klikne na opciju **"Otkaži"**
4. Sistem prikazuje upit za potvrdu: *"Da li ste sigurni da želite otkazati ovaj termin?"*
5. Osoblje potvrđuje akciju
6. Sistem mijenja status termina u **"OTKAZAN"** i oslobađa termin u bazi
7. Sistem automatski šalje e-mail obavijest pacijentu sa informacijom da je termin otkazan od strane bolnice i kontakt-telefonom za novi dogovor
8. Sistem evidentira akciju u audit log (ko je otkazao i kada)
9. Otkazani termin se odmah pojavljuje kao slobodan u kalendaru za ostale korisnike

### 5. Alternativni tokovi

**A1: Osoblje odustaje od otkazivanja**
Ako osoblje na upit za potvrdu klikne **"Ne"**, sistem odustaje od akcije i termin ostaje sa statusom "ZAKAZAN".

**A2: Termin je već u toku ili je prošao**
Ako je termin već počeo ili je prošao, sistem blokira akciju uz poruku:
> "Nije moguće otkazati termin koji je već u toku ili je prošao."

**A3: Greška pri slanju e-mail obavijesti**
Ako sistem ne može poslati e-mail pacijentu, termin se i dalje otkazuje, ali sistem bilježi grešku u logu i prikazuje upozorenje osoblju.

### 6. Ishod
- Termin je evidentiran u bazi sa statusom **"OTKAZAN"**
- Pacijent je obaviješten putem e-maila o otkazivanju
- Termin je vidljiv kao slobodan svim korisnicima u realnom vremenu
- Akcija je zabilježena u audit logu

---

## UC-07: Otkazivanje termina (pacijent)

### 1. Akter
**Pacijent**

### 2. Kratak opis
Proces omogućava pacijentu da samostalno otkaže svoj zakazani termin, uz uvjet da do pregleda ima više od 24 sata, nakon čega sistem šalje e-mail potvrdu i oslobađa termin za ostale korisnike.

### 3. Preduslovi
- Pacijent je prijavljen na sistem
- Pacijent ima termin sa statusom **"ZAKAZAN"**
- Do termina je ostalo **više od 24 sata**

### 4. Glavni tok
1. Pacijent otvara sekciju **"Moji termini"**
2. Sistem prikazuje listu svih pacijentovih zakazanih termina
3. Pacijent klikne na dugme **"Otkaži"** pored željenog termina
4. Sistem prikazuje upit: *"Da li ste sigurni da želite otkazati ovaj termin?"*
5. Pacijent potvrđuje akciju
6. Sistem mijenja status termina u **"OTKAZAN"** i oslobađa termin u bazi
7. Sistem šalje e-mail potvrdu pacijentu kao dokaz uspješnog otkazivanja
8. Sistem prikazuje poruku: *"Vaš termin je uspješno otkazan."*
9. Otkazani termin postaje odmah vidljiv kao slobodan svim ostalim korisnicima u realnom vremenu

### 5. Alternativni tokovi

**A1: Pacijent odustaje od otkazivanja**
Ako pacijent na upit za potvrdu klikne **"Ne"**, sistem odustaje i termin ostaje sa statusom "ZAKAZAN".

**A2: Vremensko ograničenje — manje od 24 sata**
Ako je do termina ostalo manje od 24 sata, sistem blokira akciju uz poruku:
> "Nije moguće otkazati termin koji počinje za manje od 24 sata. Kontaktirajte nas telefonom."

**A3: Greška pri slanju e-mail potvrde**
Ako sistem ne može poslati e-mail potvrdu, termin se i dalje otkazuje, ali sistem bilježi grešku u logu.

### 6. Ishod
- Termin ima status **"OTKAZAN"** u bazi
- Pacijent je primio e-mail potvrdu o otkazivanju
- Termin je vidljiv kao slobodan ostalim korisnicima u realnom vremenu

---

## UC-08: Automatsko oslobađanje zaključanih termina

### 1. Akter
**Sistem** (automatski proces — vremenski okidač)

### 2. Kratak opis
Sistem automatski oslobađa termine koji su privremeno zaključani tokom procesa rezervacije, a nisu potvrđeni u roku od 2 minute, te vraća pacijenta na početni ekran za odabir novog termina.

### 3. Preduslovi
- U bazi postoje termini sa statusom **"ZAKLJUČAN"**
- Sistem aktivno prati vrijeme zaključavanja svakog termina
- Definisan je vremenski limit od **2 minute** za potvrdu rezervacije

### 4. Glavni tok
1. Pacijent bira slobodan termin i sistem ga zaključava
2. Sistem počinje mjeriti vrijeme od trenutka zaključavanja
3. Pacijent popunjava obavezna polja i klikne na **"Potvrdi termin"** prije isteka 2 minute
4. Sistem potvrđuje rezervaciju i termin dobija status **"ZAKAZAN"**

### 5. Alternativni tokovi

**A1: Istek roka od 2 minute bez potvrde**
Ako pacijent nije kliknuo na "Potvrdi termin" u roku od 2 minute, sistem automatski mijenja status termina iz "ZAKLJUČAN" u "SLOBODAN", termin postaje vidljiv ostalim korisnicima, te sistem vraća pacijenta na početni ekran uz poruku:
> "Vrijeme za potvrdu termina je isteklo. Molimo Vas odaberite novi termin."

**A2: Potvrda u tačno 2 minute**
Ako pacijent klikne na "Potvrdi termin" u trenutku kada je nastupilo tačno 2 minute, sistem to tretira kao isteklo i vraća pacijenta na početni ekran uz istu poruku:
> "Vrijeme za potvrdu termina je isteklo. Molimo Vas odaberite novi termin."

**A3: Nepopunjena obavezna polja**
Ako pacijent pokuša potvrditi termin bez popunjenih obaveznih polja, sistem blokira potvrdu uz poruku:
> "Ne smijete rezervisati termin bez popunjavanja obaveznih polja!"

### 6. Ishod
- Termin je oslobođen i vidljiv kao **"SLOBODAN"** svim korisnicima
- Pacijent je vraćen na početni ekran za odabir novog termina
- Ako je termin potvrđen na vrijeme, status je **"ZAKAZAN"**

---

## UC-09: Pregled menadžment panela

### 1. Akter
**Administrator**

### 2. Kratak opis
Proces omogućava administratoru uvid u ključne metrike sistema u realnom vremenu — broj korisnika, zakazanih termina i zauzetost sala — uz mogućnost filtriranja podataka i izvoza u CSV format.

### 3. Preduslovi
- Administrator je prijavljen na sistem sa administratorskom ulogom
- Sistem sadrži podatke o korisnicima, terminima i salama

### 4. Glavni tok
1. Administrator pristupa menadžment panelu
2. Sistem provjerava ulogu korisnika i dozvoljava pristup
3. Sistem prikazuje ključne metrike u realnom vremenu:
   - Ukupan broj registrovanih korisnika po ulogama (doktor, pacijent, medicinsko osoblje, administrator)
   - Broj zakazanih i slobodnih termina po svakom doktoru
   - Zauzetost sala po terminima
   - Ko je zakazao termin i kada
   - Ko je otkazao termin i kada
4. Administrator filtrira podatke po željenom vremenskom periodu
5. Sistem ažurira prikaz prema odabranom filteru u realnom vremenu

### 5. Alternativni tokovi

**A1: Izvoz podataka u CSV**
Ako administrator želi izvesti podatke, bira željeni period i klikne na "Izvezi u CSV". Sistem generira CSV fajl sa podacima o terminima za odabrani period.

**A2: Neovlašteni pristup**
Ako korisnik bez administratorske uloge pokuša pristupiti panelu, sistem blokira pristup i preusmjerava ga na formu za prijavu.

**A3: Nema podataka za odabrani period**
Ako za odabrani vremenski period nema podataka, sistem prikazuje poruku:
> "Nema dostupnih podataka za odabrani period."

### 6. Ishod
- Administrator ima uvid u sve ključne metrike sistema u realnom vremenu
- Podaci su filtrirani prema odabranom vremenskom periodu
- CSV izvoz je generiran ako je zatražen

---

## UC-10: Pregled i upravljanje komentarima termina

### 1. Akteri
- **Doktor** (pregledava komentare)
- **Pacijent** (dodaje i mijenja komentare)

### 2. Kratak opis
Proces omogućava doktoru pregled komentara vezanih za njegov termin, dok pacijent i medicinsko osoblje mogu dodavati, mijenjati i brisati komentare prilikom zakazivanja termina, uz ograničenje od 255 znakova i zabranu izmjene nakon obavljenog pregleda.

### 3. Preduslovi
- Doktor i pacijent su prijavljeni na sistem
- Termin postoji u bazi sa statusom "ZAKAZAN"
- Korisnik ima pristup konkretnom terminu

### 4. Glavni tok
1. Doktor otvara detalje svog termina
2. Sistem provjerava da li termin pripada tom doktoru
3. Sistem prikazuje sve komentare vezane za termin uz:
   - Tekst komentara
   - Ime osobe koja je unijela komentar
   - Datum unosa
4. Doktor pregledava komentare prije pregleda

### 5. Alternativni tokovi

**A1: Termin nema komentara**
Ako uz termin nije unesen nijedan komentar, sistem prikazuje poruku:
> "Nema komentara za ovaj termin."

**A2: Pacijent dodaje komentar**
Pacijent otvara aktivnu rezervaciju, unosi napomenu u polje za komentar i klikne "Potvrdi". Sistem čuva komentar uz detalje rezervacije. Komentar je opcionalno polje.

**A3: Prekoračenje broja znakova**
Ako pacijent unese više od 255 znakova, sistem blokira unos uz poruku:
> "Prekoračili ste dozvoljeni broj znakova za ovo polje!"

**A4: Izmjena ili brisanje komentara**
Komentar može izmijeniti ili obrisati samo osoba koja ga je unijela ili administrator, ali isključivo prije obavljenog pregleda. Nakon pregleda sistem ne dozvoljava izmjenu ni brisanje.

**A5: Neovlašteni pristup komentarima**
Ako doktor pokuša pregledati komentare termina koji nije njegov, sistem blokira pristup.

### 6. Ishod
- Doktor ima uvid u sve relevantne komentare prije pregleda
- Komentar pacijenta je sačuvan uz detalje termina
- Izmjena ili brisanje je evidentirano u sistemu

---

## UC-11: Dvofaktorska autentifikacija (2FA)

### 1. Akter
**Korisnik** (Pacijent, Doktor, Administrator)

### 2. Kratak opis
Proces omogućava korisniku da aktivira i koristi dvofaktorsku autentifikaciju kao dodatni sloj zaštite naloga. Nakon ispravne lozinke, sistem šalje jednokratni kod na e-mail koji korisnik mora unijeti u roku od 5 minuta kako bi pristupio aplikaciji.

### 3. Preduslovi
- Korisnik ima aktivan nalog u sistemu
- Korisnik ima validnu e-mail adresu
- Sistem za prijavu je implementiran i funkcionalan
- Korisnik je aktivirao 2FA opciju u postavkama profila

### 4. Glavni tok
1. Korisnik uspješno unosi ispravnu e-mail adresu i lozinku
2. Sistem detektuje da korisnik ima aktiviran 2FA
3. Sistem automatski šalje jednokratni kod na korisnikov e-mail
4. Sistem prikazuje poruku korisniku: *"Sigurnosni kod je poslan na Vašu e-mail adresu. Molimo provjerite inbox prije nastavka."*
5. Korisnik unosi primljeni kod u predviđeno polje
6. Sistem provjerava ispravnost i valjanost koda
7. Sistem dozvoljava konačan pristup aplikaciji

### 5. Alternativni tokovi

**A1: Pogrešan kod**
Ako korisnik unese pogrešan kod, sistem ne dozvoljava pristup uz poruku:
> "Uneseni kod nije ispravan. Molimo pokušajte ponovo."

**A2: Istekao kod — više od 5 minuta**
Ako je od slanja koda prošlo više od 5 minuta, sistem automatski poništava kod i ne dozvoljava pristup uz poruku:
> "Sigurnosni kod je istekao. Molimo zatražite novi kod."

**A3: Aktivacija 2FA u postavkama profila**
Kada pacijent ode na "Postavke profila", sistem prikazuje prekidač za uključivanje ili isključivanje 2FA zaštite. Aktivacija je opcionalna i pacijent je sam bira.

**A4: Korisnik nema aktiviran 2FA**
Ako korisnik nema aktiviran 2FA, sistem preskače ovaj korak i direktno preusmjerava korisnika na odgovarajući kontrolni panel nakon ispravne lozinke.

### 6. Ishod
- Korisnik je uspješno autorizovan sa dva nivoa provjere
- Korisnička sesija je kreirana i aktivna
- Neuspješan pokušaj je evidentiran u audit logu

---

## UC-12: Rezervacija termina kod specijaliste od strane ljekara

### 1. Akteri
- **Ljekar porodične medicine** (Glavni akter)
- **Pacijent** (Korisnik usluge)

### 2. Kratak opis
Proces omogućava ljekaru porodične medicine da, tokom pregleda, direktno rezerviše termin kod specijaliste za svog pacijenta. Time se osigurava brža i koordinirana medicinska usluga te eliminiše potreba da pacijent samostalno traži termine.

### 3. Preduslovi
- Ljekar porodične medicine je prijavljen na sistem
- Pacijent je registrovan u sistemu i nalazi se na pregledu kod ljekara
- Specijalista je registrovan i ima definisano radno vrijeme

### 4. Glavni tok
1. Ljekar pristupa modulu za rezervacije
2. Ljekar pretražuje specijaliste prema odjelu ili imenu
3. Sistem prikazuje listu dostupnih specijalista i njihove kalendare
4. Ljekar bira slobodan termin u kalendaru specijaliste
5. Ljekar bira pacijenta (ime ili JMBG)
6. Ljekar klikne na **"Potvrdi rezervaciju"**
7. Sistem upisuje termin kao **"ZAKAZAN"**
8. Sistem šalje e-mail obavijest pacijentu
9. Sistem prikazuje poruku: *"Termin je uspješno rezervisan."*

### 5. Alternativni tokovi

**A1: Pacijent već ima termin kod tog specijaliste**
Ako pacijent već ima zakazan termin kod istog specijaliste u tom periodu, sistem blokira rezervaciju uz poruku upozorenja.

**A2: Otkazivanje termina od strane pacijenta**
Pacijent može naknadno otkazati termin putem svog profila, ali samo ako je do termina ostalo više od 24 sata.

**A3: Specijalista nema slobodnih termina**
Ako izabrani specijalista nema slobodnih termina, sistem nudi ljekaru listu других doktora iste specijalizacije.

**A4: Vremensko ograničenje rezervacije**
Ljekar može rezervisati termin do 12 mjeseci unaprijed.

### 6. Ishod
- Rezervacija je evidentirana u kalendaru specijaliste
- Pacijent je primio e-mail sa detaljima termina
- Termin više nije dostupan za druge korisnike

---

## UC-13: Pregled historije pregleda

### 1. Akter
**Pacijent**

### 2. Kratak opis
Proces omogućava pacijentu pregled kompletne historije svojih 
prošlih pregleda, uključujući detalje termina, opis terapije 
i laboratorijske nalaze, poredane od najnovijeg ka najstarijem.

### 3. Preduslovi
- Pacijent je prijavljen na sistem
- Sistem vodi evidenciju svih pregleda pacijenta
- Pacijent ima kreiran nalog u bazi

### 4. Glavni tok
1. Pacijent otvara sekciju **"Historija"**
2. Sistem dohvata sve prošle preglede pacijenta iz baze
3. Sistem prikazuje listu pregleda poredanih po datumu
   od najnovijeg ka najstarijem
4. Pacijent odabira konkretan pregled iz liste
5. Sistem prikazuje detalje odabranog pregleda:
   - Datum, ljekar i odjel
   - Tekstualni opis terapije
   - Laboratorijski nalazi ako postoje

### 5. Alternativni tokovi

**A1: Prazna historija**  
Ako pacijent nema nijedan prethodni pregled u bazi, 
sistem prikazuje poruku:
> *"Trenutno nemate zabilježenih pregleda u historiji."*

**A2: Otkazani termini**  
Otkazani termini su vidljivi u listi historije, ali su 
jasno označeni statusom **"OTKAZAN"** kako bi se 
razlikovali od obavljenih pregleda.

**A3: Neovlašteni pristup**  
Sistem ne dozvoljava pacijentu pregled historije 
drugog pacijenta.

### 6. Ishod
- Pacijent ima uvid u kompletnu historiju svojih pregleda
- Detalji svakog pregleda su dostupni na klik
- Otkazani termini su vidljivi ali jasno označeni

---

## UC-14: Označavanje hitnosti termina

### 1. Akter
**Medicinsko osoblje** (medicinska sestra, administrator)

### 2. Kratak opis
Proces omogućava medicinskom osoblju da označi termin pacijenta 
statusom "HITNO" na osnovu procjene simptoma ili stanja pacijenta,
uz vizuelno isticanje hitnih termina crvenom bojom u panelima
doktora i administratora. Oznaka nije vidljiva pacijentu.

### 3. Preduslovi
- Medicinsko osoblje je prijavljeno na sistem
- Termin postoji u bazi sa statusom **"ZAKAZAN"**
- Osoblje ima pristup listi zakazanih termina

### 4. Glavni tok
1. Medicinsko osoblje otvara listu zakazanih termina u panelu
2. Osoblje bira konkretan termin pacijenta
3. Sistem prikazuje opciju **"Označi kao HITNO"**
4. Osoblje označava termin kao hitan na osnovu:
   - Pacijentovog opisa simptoma, ili
   - Vlastite procjene pri dolasku pacijenta
5. Sistem mijenja status termina u **"HITNO"**
6. Sistem vizuelno ističe red tog termina crvenom bojom
   na doktorovom i admin kontrol panelu

### 5. Alternativni tokovi

**A1: Uklanjanje oznake hitnosti**
Ako osoblje pogrešno označi termin kao hitan, može ukloniti
oznaku i sistem vraća termin u normalan prikaz bez crvene boje.

**A2: Pacijent pokušava vidjeti oznaku hitnosti**
Sistem ne prikazuje internu oznaku "HITNO" na pacijentovoj
strani aplikacije. Oznaka je vidljiva isključivo medicinskom
osoblju, doktorima i administratorima.

**A3: Neovlašteni pristup označavanju**
Sistem ne dozvoljava pacijentu da sam označi svoj termin
kao hitan.

### 6. Ishod
- Termin je označen statusom **"HITNO"** u bazi
- Red termina je vizuelno istaknut crvenom bojom na
  doktorovom i admin kontrol panelu
- Oznaka nije vidljiva pacijentu

---

## UC-15: Panel medicinskog osoblja

### 1. Akter
**Medicinsko osoblje**

### 2. Kratak opis
Proces omogućava medicinskom osoblju pregled svih termina 
zakazanih za tekući dan, ručno kreiranje novih termina, 
pretragu pacijenata te uvid u detalje svakog termina.

### 3. Preduslovi
- Medicinsko osoblje je prijavljeno na sistem
- Sistem sadrži podatke o terminima i pacijentima
- Panel prikazuje relevantne termine za tekući dan

### 4. Glavni tok
1. Medicinsko osoblje prijavljuje se i otvara svoj panel
2. Sistem prikazuje listu svih termina zakazanih za taj dan
3. Osoblje klikne na detalje konkretnog termina
4. Sistem prikazuje relevantne informacije o pacijentu:
   - Ime i prezime pacijenta
   - Broj telefona
   - Vrstu pregleda
   - Razlog posjete koji je pacijent naveo

### 5. Alternativni tokovi

**A1: Ručno kreiranje novog termina**
Ako pacijent zakaže termin telefonom, osoblje može ručno
kreirati novi termin. Kada osoblje unese podatke pacijenta
i izabere slobodan termin, sistem taj termin odmah upisuje
u bazu kao **"ZAKAZAN"**.

**A2: Pretraga pacijenta**
Kada osoblje unese ime pacijenta u polje za pretragu,
sistem filtrira listu i prikazuje samo termine vezane
za tog pacijenta.

**A3: Neovlašteni pristup**
Sistem ne dozvoljava pacijentima pristup ovom panelu.
Pristup je dozvoljen isključivo medicinskom osoblju
i administratorima.

### 6. Ishod
- Medicinsko osoblje ima pregled svih termina za tekući dan
- Novi termin je kreiran i vidljiv u sistemu ako je zatražen
- Pretraga pacijenta je izvršena uspješno

---

## UC-16: Registracija pacijenta

### 1. Akter
**Administrator**

### 2. Kratak opis
Proces omogućava administratoru da registruje novog pacijenta 
u sistem putem admin panela, uz validaciju obaveznih podataka
i automatsko dodjeljavanje uloge pacijenta u sistemu.

### 3. Preduslovi
- Administrator je prijavljen na sistem sa administratorskom ulogom
- Administrator ima pristup panelu za upravljanje pacijentima
- Sistem validira unesene podatke

### 4. Glavni tok
1. Administrator otvara panel za upravljanje pacijentima
2. Administrator klikne na dugme **"Novi pacijent"**
3. Sistem prikazuje formu za unos podataka
4. Administrator popunjava obavezna polja:
   - Ime i prezime
   - Validna email adresa
   - Broj telefona
5. Administrator klikne na **"Potvrdi"**
6. Sistem kreira novi profil u bazi i dodjeljuje mu ulogu **"PACIJENT"**
7. Sistem prikazuje poruku: *"Pacijent uspješno registrovan."*

### 5. Alternativni tokovi

**A1: Nepopunjena obavezna polja**
Ako administrator ostavi bilo koje obavezno polje prazno,
sistem ne dozvoljava čuvanje uz poruku upozorenja
pored nepopunjenog polja.

**A2: Email već postoji u bazi**
Ako administrator unese email koji već postoji u sistemu,
sistem blokira registraciju uz poruku:
> *"Korisnik sa ovim emailom je već registrovan."*

**A3: Samostalna registracija pacijenta**
Pacijent se može samostalno registrovati putem javne
stranice za registraciju. Administrator ima uvid u sve
takve profile unutar svog panela.

### 6. Ishod
- Novi profil pacijenta je kreiran u bazi sa ulogom **"PACIJENT"**
- Administrator je primio potvrdu o uspješnoj registraciji
- Pacijent može odmah koristiti sistem

---

## UC-17: Automatska odjava korisnika

### 1. Akter
**Sistem** (automatski proces — vremenski okidač)

### 2. Kratak opis
Sistem automatski odjavljuje korisnika nakon 15 minuta 
neaktivnosti radi zaštite podataka, uz prethodno upozorenje
sa opcijama produženja ili odustajanja od sesije.

### 3. Preduslovi
- Korisnik je prijavljen na sistem sa aktivnom sesijom
- Sistem prati aktivnost korisnika
- Definisan je vremenski limit neaktivnosti od **15 minuta**

### 4. Glavni tok
1. Korisnik je aktivan na sistemu
2. Sistem mjeri vrijeme neaktivnosti korisnika
3. Nakon 13 minuta neaktivnosti sistem prikazuje upozorenje:
   *"Biti ćete odjavljeni s vašeg profila za 2 minute."*
4. Sistem prikazuje dva dugmeta: **"Produži sesiju"** i **"Otkaži"**
5. Korisnik klikne na **"Produži sesiju"**
6. Sistem resetuje tajmer neaktivnosti na 0 minuta
7. Korisnik nastavlja rad bez prekida

### 5. Alternativni tokovi

**A1: Istek 15 minuta bez reakcije**
Ako korisnik ne reaguje na upozorenje i istekne 15 minuta,
sistem automatski odjavljuje korisnika, poništava sesiju
i preusmjerava ga na formu za prijavu.

**A2: Korisnik klikne "Otkaži"**
Ako korisnik klikne na dugme "Otkaži", sistem odmah
odjavljuje korisnika i preusmjerava ga na formu za prijavu.

**A3: Pokušaj pristupa sa isteklom sesijom**
Ako korisnik pokuša pristupiti zaštićenoj stranici
sa isteklom sesijom, sistem ga automatski preusmjerava
na formu za prijavu.

### 6. Ishod
- Korisnička sesija je poništena nakon isteka neaktivnosti
- Korisnik je preusmjeren na formu za prijavu
- Ako je sesija produžena, korisnik nastavlja rad normalno

---

## UC-18: Pregled audit loga

### 1. Akter
**Administrator**

### 2. Kratak opis
Proces omogućava administratoru pregled svih akcija koje su 
korisnici izvršili unutar sistema, uz mogućnost pretrage i 
filtriranja zapisa prema korisniku, vrsti akcije i vremenskom 
periodu. Zapisi nisu izmjenjivi ni od strane administratora.

### 3. Preduslovi
- Administrator je prijavljen na sistem sa administratorskom ulogom
- Sistem bilježi sve CRUD akcije u realnom vremenu
- Audit log sadrži zapise sa ID korisnika, vrstom akcije,
  nazivom entiteta, datumom i vremenom

### 4. Glavni tok
1. Administrator pristupa sekciji **"Audit log"**
2. Sistem provjerava ulogu korisnika i dozvoljava pristup
3. Sistem prikazuje listu svih zabilježenih akcija u sistemu
4. Administrator filtrira zapise po željenom kriteriju:
   - Po korisniku
   - Po vrsti akcije
   - Po vremenskom periodu
5. Sistem prikazuje filtrirane rezultate u realnom vremenu

### 5. Alternativni tokovi

**A1: Nema rezultata za odabrani filter**
Ako za odabrane kriterije nema zapisa, sistem prikazuje poruku:
> *"Nema pronađenih zapisa za odabrane kriterije."*

**A2: Pokušaj izmjene zapisa**
Sistem ne dozvoljava izmjenu ni brisanje zapisa u audit logu
ni od strane administratora. Zapisi su samo za čitanje.

**A3: Neovlašteni pristup**
Ako korisnik bez administratorske uloge pokuša pristupiti
audit logu, sistem blokira pristup i preusmjerava ga
na formu za prijavu.

**A4: Automatsko arhiviranje starih zapisa**
Zapisi stariji od 12 mjeseci se automatski arhiviraju
ili brišu u skladu sa politikom privatnosti sistema.

### 6. Ishod
- Administrator ima uvid u sve akcije korisnika u sistemu
- Filtrirani rezultati su prikazani prema odabranim kriterijima
- Integritet zapisa je očuvan — izmjena nije moguća