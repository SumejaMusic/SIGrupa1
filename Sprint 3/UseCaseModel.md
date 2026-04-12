# Model slučajeva korištenja

## UC-01: Rezervacija termina kod doktora

### 1. Akter
**Pacijent**

### 2. Naziv slučaja korištenja
**Rezervacija termina kod doktora**

### 3. Kratak opis
Proces omogućava pacijentu da pregleda slobodne termine kod izabranog doktora i izvrši digitalnu rezervaciju kako bi osigurao pregled bez čekanja.

### 4. Preduslovi
- Pacijent je uspješno prijavljen na sistem
- Postoje definisani slobodni termini u radnom vremenu doktora
- Pacijent nema već rezervisan termin u isto vrijeme kod drugog doktora

### 5. Glavni tok
1. Pacijent pretražuje doktore po imenu ili specijalnosti
2. Sistem prikazuje listu doktora
3. Pacijent bira doktora i sistem otvara njegov interaktivni kalendar
4. Pacijent bira slobodan termin
5. Sistem zaključava termin na 2 minute kako bi spriječio duple rezervacije
6. Pacijent popunjava obavezna polja i opcionalni komentar/napomenu
7. Pacijent klikne na **"Potvrdi"**
8. Sistem upisuje termin u bazu kao **"ZAKAZAN"** i šalje e-mail potvrdu

### 6. Alternativni tokovi

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

### 7. Ishod
- Termin je evidentiran u bazi pod statusom **"ZAKAZAN"**
- Pacijent je primio e-mail sa detaljima (datum, vrijeme, doktor)
- Termin više nije vidljiv kao slobodan za druge korisnike

---

## UC-02: Prijava na sistem

### 1. Akter
**Korisnik** (Pacijent, Doktor, Medicinsko osoblje ili Administrator)

### 2. Naziv slučaja korištenja
**Prijava na sistem (Login)**

### 3. Kratak opis
Proces omogućava korisniku siguran pristup aplikaciji putem e-mail adrese i lozinke, uz opcionalnu dvofaktorsku autentifikaciju (2FA) za dodatnu zaštitu podataka.

### 4. Preduslovi
- Korisnik ima kreiran i aktivan nalog u bazi podataka
- Sistem je dostupan i funkcionalan (dostupnost 99%)
- Lozinka korisnika je prethodno heširana u bazi (AES-256)

### 5. Glavni tok
1. Korisnik unosi svoju e-mail adresu i lozinku na formi za prijavu
2. Sistem vrši validaciju formata e-mail adrese
3. Sistem provjerava unesene podatke u bazi
4. Sistem evidentira uspješnu prijavu u audit log
5. Sistem preusmjerava korisnika na odgovarajući kontrolni panel na osnovu njegove uloge
6. Prijava se završava

### 6. Alternativni tokovi

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

### 7. Ishod
- Korisnik je uspješno autorizovan i ima pristup funkcijama koje odgovaraju njegovoj ulozi (RBAC)
- Kreirana je aktivna korisnička sesija koja će isteći nakon 15 minuta neaktivnosti
- U bazi je zabilježeno vrijeme i ID korisnika koji je pristupio sistemu

---

## UC-03: Upravljanje radnim vremenom i dužinom termina

### 1. Akteri
- **Administrator** (Glavni akter koji vrši izmjene)
- **Doktor** (Sekundarni akter koji šalje upite za promjenu)

### 2. Naziv slučaja korištenja
**Upravljanje radnim vremenom i dužinom termina**

### 3. Kratak opis
Proces omogućava administratoru da definiše i mijenja radno vrijeme doktora, dok doktor može slati formalne upite za promjenu dužine trajanja pregleda kako bi se sistem uskladio sa stvarnim stanjem u ustanovi.

### 4. Preduslovi
- Administrator i doktor su prijavljeni na sistem sa odgovarajućim ulogama
- Doktor je prethodno registrovan u sistemu
- Sistem ima definisane trenutne termine i njihovo trajanje

### 5. Glavni tok
1. Administrator bira doktora iz liste registrovanih zaposlenika
2. Sistem prikazuje trenutni kalendar i radno vrijeme izabranog doktora
3. Administrator unosi novo radno vrijeme (početak i kraj smjene)
4. Sistem automatski provjerava da li u novom terminu već postoje rezervisani pacijenti
5. Administrator potvrđuje izmjene klikom na dugme **"Potvrdi"**
6. Sistem ažurira kalendar u realnom vremenu i on postaje vidljiv pacijentima
7. Sistem evidentira promjenu u audit log (ko je izmijenio i kada)

### 6. Alternativni tokovi

**A1: Postojeći zakazani termini**
Ako administrator pokuša promijeniti radno vrijeme u periodu u kojemu već postoje zakazani pacijenti, sistem blokira akciju i prikazuje poruku:
> "Nije moguće promijeniti radno vrijeme. Doktor ima rezervisane termine u ovom periodu."

**A2: Upit doktora za promjenu dužine termina**
Doktor šalje upit za promjenu trajanja pregleda uz obrazloženje. Administrator prima obavještenje, pregleda upit i može ga odobriti ili odbiti.

**A3: Preklapanje kod promjene dužine**
Ako bi nova dužina termina (npr. sa 15 na 30 minuta) izazvala preklapanje sa već rezervisanim pacijentima, sistem ne dozvoljava promjenu.

**A4: Neovlašteni pristup**
Ako doktor pokuša direktno promijeniti svoje radno vrijeme (bez administratora), sistem mu to onemogućava.

### 7. Ishod
- Novo radno vrijeme je sačuvano u bazi podataka
- Kalendar doktora je ažuriran i dostupan pacijentima za nove rezervacije
- Doktor prima obavještenje o statusu svog upita (odobreno/odbijeno)

---

## UC-04: Dodavanje i pregled laboratorijskih nalaza

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

## UC-05: Otkazivanje termina (medicinsko osoblje)

### 1. Akter
**Medicinsko osoblje**

### 2. Naziv slučaja korištenja
**Otkazivanje termina od strane medicinskog osoblja**

### 3. Kratak opis
Proces omogućava medicinskom osoblju da otkaže već rezervisan termin pacijenta u slučaju promjena u rasporedu, uz automatsku obavijest pacijentu i trenutno oslobađanje termina u kalendaru.

### 4. Preduslovi
- Medicinsko osoblje je prijavljeno na sistem sa odgovarajućom ulogom
- Termin koji se otkazuje postoji u bazi i ima status **"ZAKAZAN"**
- Termin još nije počeo (otkazivanje je moguće samo prije samog pregleda)

### 5. Glavni tok
1. Medicinsko osoblje otvara panel i pretražuje listu zakazanih termina
2. Osoblje odabira konkretan termin pacijenta koji želi otkazati
3. Osoblje klikne na opciju **"Otkaži"**
4. Sistem prikazuje upit za potvrdu: *"Da li ste sigurni da želite otkazati ovaj termin?"*
5. Osoblje potvrđuje akciju
6. Sistem mijenja status termina u **"OTKAZAN"** i oslobađa termin u bazi
7. Sistem automatski šalje e-mail obavijest pacijentu sa informacijom da je termin otkazan od strane bolnice i kontakt-telefonom za novi dogovor
8. Sistem evidentira akciju u audit log (ko je otkazao i kada)
9. Otkazani termin se odmah pojavljuje kao slobodan u kalendaru za ostale korisnike

### 6. Alternativni tokovi

**A1: Osoblje odustaje od otkazivanja**
Ako osoblje na upit za potvrdu klikne **"Ne"**, sistem odustaje od akcije i termin ostaje sa statusom "ZAKAZAN".

**A2: Termin je već u toku ili je prošao**
Ako je termin već počeo ili je prošao, sistem blokira akciju uz poruku:
> "Nije moguće otkazati termin koji je već u toku ili je prošao."

**A3: Greška pri slanju e-mail obavijesti**
Ako sistem ne može poslati e-mail pacijentu, termin se i dalje otkazuje, ali sistem bilježi grešku u logu i prikazuje upozorenje osoblju.

### 7. Ishod
- Termin je evidentiran u bazi sa statusom **"OTKAZAN"**
- Pacijent je obaviješten putem e-maila o otkazivanju
- Termin je vidljiv kao slobodan svim korisnicima u realnom vremenu
- Akcija je zabilježena u audit logu

---

## UC-06: Otkazivanje termina (pacijent)

### 1. Akter
**Pacijent**

### 2. Naziv slučaja korištenja
**Otkazivanje termina od strane pacijenta**

### 3. Kratak opis
Proces omogućava pacijentu da samostalno otkaže svoj zakazani termin, uz uvjet da do pregleda ima više od 24 sata, nakon čega sistem šalje e-mail potvrdu i oslobađa termin za ostale korisnike.

### 4. Preduslovi
- Pacijent je prijavljen na sistem
- Pacijent ima termin sa statusom **"ZAKAZAN"**
- Do termina je ostalo **više od 24 sata**

### 5. Glavni tok
1. Pacijent otvara sekciju **"Moji termini"**
2. Sistem prikazuje listu svih pacijentovih zakazanih termina
3. Pacijent klikne na dugme **"Otkaži"** pored željenog termina
4. Sistem prikazuje upit: *"Da li ste sigurni da želite otkazati ovaj termin?"*
5. Pacijent potvrđuje akciju
6. Sistem mijenja status termina u **"OTKAZAN"** i oslobađa termin u bazi
7. Sistem šalje e-mail potvrdu pacijentu kao dokaz uspješnog otkazivanja
8. Sistem prikazuje poruku: *"Vaš termin je uspješno otkazan."*
9. Otkazani termin postaje odmah vidljiv kao slobodan svim ostalim korisnicima u realnom vremenu

### 6. Alternativni tokovi

**A1: Pacijent odustaje od otkazivanja**
Ako pacijent na upit za potvrdu klikne **"Ne"**, sistem odustaje i termin ostaje sa statusom "ZAKAZAN".

**A2: Vremensko ograničenje — manje od 24 sata**
Ako je do termina ostalo manje od 24 sata, sistem blokira akciju uz poruku:
> "Nije moguće otkazati termin koji počinje za manje od 24 sata. Kontaktirajte nas telefonom."

**A3: Greška pri slanju e-mail potvrde**
Ako sistem ne može poslati e-mail potvrdu, termin se i dalje otkazuje, ali sistem bilježi grešku u logu.

### 7. Ishod
- Termin ima status **"OTKAZAN"** u bazi
- Pacijent je primio e-mail potvrdu o otkazivanju
- Termin je vidljiv kao slobodan ostalim korisnicima u realnom vremenu

---

## UC-07: Automatsko oslobađanje zaključanih termina

### 1. Akter
**Sistem** (automatski proces — vremenski okidač)

### 2. Naziv slučaja korištenja
**Automatsko oslobađanje zaključanih termina**

### 3. Kratak opis
Sistem automatski oslobađa termine koji su privremeno zaključani tokom procesa rezervacije, a nisu potvrđeni u roku od 2 minute, te vraća pacijenta na početni ekran za odabir novog termina.

### 4. Preduslovi
- U bazi postoje termini sa statusom **"ZAKLJUČAN"**
- Sistem aktivno prati vrijeme zaključavanja svakog termina
- Definisan je vremenski limit od **2 minute** za potvrdu rezervacije

### 5. Glavni tok
1. Pacijent odabira slobodan termin i sistem ga zaključava
2. Sistem počinje mjeriti vrijeme od trenutka zaključavanja
3. Pacijent popunjava obavezna polja i klikne na **"Potvrdi termin"** prije isteka 2 minute
4. Sistem potvrđuje rezervaciju i termin dobija status **"ZAKAZAN"**

### 6. Alternativni tokovi

**A1: Istek roka od 2 minute bez potvrde**
Ako pacijent nije kliknuo na "Potvrdi termin" u roku od 2 minute, sistem automatski mijenja status termina iz "ZAKLJUČAN" u "SLOBODAN", termin postaje vidljiv ostalim korisnicima, te sistem vraća pacijenta na početni ekran uz poruku:
> "Vrijeme za potvrdu termina je isteklo. Molimo Vas odaberite novi termin."

**A2: Potvrda u tačno 2 minute**
Ako pacijent klikne na "Potvrdi termin" u trenutku kada je nastupilo tačno 2 minute, sistem to tretira kao isteklo i vraća pacijenta na početni ekran uz istu poruku:
> "Vrijeme za potvrdu termina je isteklo. Molimo Vas odaberite novi termin."

**A3: Nepopunjena obavezna polja**
Ako pacijent pokuša potvrditi termin bez popunjenih obaveznih polja, sistem blokira potvrdu uz poruku:
> "Ne smijete rezervisati termin bez popunjavanja obaveznih polja!"

### 7. Ishod
- Termin je oslobođen i vidljiv kao **"SLOBODAN"** svim korisnicima
- Pacijent je vraćen na početni ekran za odabir novog termina
- Ako je termin potvrđen na vrijeme, status je **"ZAKAZAN"**

---

## UC-08: Pregled menadžment panela

### 1. Akter
**Administrator**

### 2. Naziv slučaja korištenja
**Pregled i upravljanje menadžment panelom**

### 3. Kratak opis
Proces omogućava administratoru uvid u ključne metrike sistema u realnom vremenu — broj korisnika, zakazanih termina i zauzetost sala — uz mogućnost filtriranja podataka i izvoza u CSV format.

### 4. Preduslovi
- Administrator je prijavljen na sistem sa administratorskom ulogom
- Sistem sadrži podatke o korisnicima, terminima i salama

### 5. Glavni tok
1. Administrator pristupa menadžment panelu
2. Sistem provjerava ulogu korisnika i dozvoljava pristup
3. Sistem prikazuje ključne metrike u realnom vremenu:
   - Ukupan broj registrovanih korisnika po ulogama (doktor, pacijent, medicinska sestra, administrator)
   - Broj zakazanih i slobodnih termina po svakom doktoru
   - Zauzetost sala po terminima
   - Ko je zakazao termin i kada
   - Ko je otkazao termin i kada
4. Administrator filtrira podatke po željenom vremenskom periodu
5. Sistem ažurira prikaz prema odabranom filteru u realnom vremenu

### 6. Alternativni tokovi

**A1: Izvoz podataka u CSV**
Ako administrator želi izvesti podatke, odabira željeni period i klikne na "Izvezi u CSV". Sistem generira CSV fajl sa podacima o terminima za odabrani period.

**A2: Neovlašteni pristup**
Ako korisnik bez administratorske uloge pokuša pristupiti panelu, sistem blokira pristup i preusmjerava ga na formu za prijavu.

**A3: Nema podataka za odabrani period**
Ako za odabrani vremenski period nema podataka, sistem prikazuje poruku:
> "Nema dostupnih podataka za odabrani period."

### 7. Ishod
- Administrator ima uvid u sve ključne metrike sistema u realnom vremenu
- Podaci su filtrirani prema odabranom vremenskom periodu
- CSV izvoz je generiran ako je zatražen

---

## UC-10: Pregled i upravljanje komentarima termina

### 1. Akteri
- **Doktor** (pregledava komentare)
- **Pacijent** (dodaje i mijenja komentare)

### 2. Naziv slučaja korištenja
**Pregled i upravljanje komentarima termina**

### 3. Kratak opis
Proces omogućava doktoru pregled komentara vezanih za njegov termin, dok pacijent i medicinsko osoblje mogu dodavati, mijenjati i brisati komentare prilikom zakazivanja termina, uz ograničenje od 255 znakova i zabranu izmjene nakon obavljenog pregleda.

### 4. Preduslovi
- Doktor i pacijent su prijavljeni na sistem
- Termin postoji u bazi sa statusom "ZAKAZAN"
- Korisnik ima pristup konkretnom terminu

### 5. Glavni tok
1. Doktor otvara detalje svog termina
2. Sistem provjerava da li termin pripada tom doktoru
3. Sistem prikazuje sve komentare vezane za termin uz:
   - Tekst komentara
   - Ime osobe koja je unijela komentar
   - Datum unosa
4. Doktor pregledava komentare prije pregleda

### 6. Alternativni tokovi

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

### 7. Ishod
- Doktor ima uvid u sve relevantne komentare prije pregleda
- Komentar pacijenta je sačuvan uz detalje termina
- Izmjena ili brisanje je evidentirano u sistemu

---

## UC-11: Dvofaktorska autentifikacija (2FA)

### 1. Akter
**Korisnik** (Pacijent, Doktor, Administrator)

### 2. Naziv slučaja korištenja
**Dvofaktorska autentifikacija (2FA)**

### 3. Kratak opis
Proces omogućava korisniku da aktivira i koristi dvofaktorsku autentifikaciju kao dodatni sloj zaštite naloga. Nakon ispravne lozinke, sistem šalje jednokratni kod na e-mail koji korisnik mora unijeti u roku od 5 minuta kako bi pristupio aplikaciji.

### 4. Preduslovi
- Korisnik ima aktivan nalog u sistemu
- Korisnik ima validnu e-mail adresu
- Sistem za prijavu je implementiran i funkcionalan
- Korisnik je aktivirao 2FA opciju u postavkama profila

### 5. Glavni tok
1. Korisnik uspješno unosi ispravnu e-mail adresu i lozinku
2. Sistem detektuje da korisnik ima aktiviran 2FA
3. Sistem automatski šalje jednokratni kod na korisnikov e-mail
4. Sistem prikazuje poruku korisniku: *"Sigurnosni kod je poslan na Vašu e-mail adresu. Molimo provjerite inbox prije nastavka."*
5. Korisnik unosi primljeni kod u predviđeno polje
6. Sistem provjerava ispravnost i valjanost koda
7. Sistem dozvoljava konačan pristup aplikaciji

### 6. Alternativni tokovi

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

### 7. Ishod
- Korisnik je uspješno autorizovan sa dva nivoa provjere
- Korisnička sesija je kreirana i aktivna
- Neuspješan pokušaj je evidentiran u audit logu

---

## UC-12: Rezervacija termina kod specijaliste od strane ljekara

### 1. Akteri
- **Ljekar porodične medicine** (Glavni akter)
- **Pacijent** (Korisnik usluge)

### 2. Naziv slučaja korištenja
**Rezervacija termina kod specijaliste putem porodičnog ljekara**

### 3. Kratak opis
Proces omogućava ljekaru porodične medicine da, tokom pregleda, direktno rezerviše termin kod specijaliste za svog pacijenta. Time se osigurava brža i koordinirana medicinska usluga te eliminiše potreba da pacijent samostalno traži termine.

### 4. Preduslovi
- Ljekar porodične medicine je prijavljen na sistem
- Pacijent je registrovan u sistemu i nalazi se na pregledu kod ljekara
- Specijalista je registrovan i ima definisano radno vrijeme

### 5. Glavni tok
1. Ljekar pristupa modulu za rezervacije
2. Ljekar pretražuje specijaliste prema odjelu ili imenu
3. Sistem prikazuje listu dostupnih specijalista i njihove kalendare
4. Ljekar bira slobodan termin u kalendaru specijaliste
5. Ljekar bira pacijenta (ime ili JMBG)
6. Ljekar klikne na **"Potvrdi rezervaciju"**
7. Sistem upisuje termin kao **"ZAKAZAN"**
8. Sistem šalje e-mail obavijest pacijentu
9. Sistem prikazuje poruku: *"Termin je uspješno rezervisan."*

### 6. Alternativni tokovi

**A1: Pacijent već ima termin kod tog specijaliste**
Ako pacijent već ima zakazan termin kod istog specijaliste u tom periodu, sistem blokira rezervaciju uz poruku upozorenja.

**A2: Otkazivanje termina od strane pacijenta**
Pacijent može naknadno otkazati termin putem svog profila, ali samo ako je do termina ostalo više od 24 sata.

**A3: Specijalista nema slobodnih termina**
Ako izabrani specijalista nema slobodnih termina, sistem nudi ljekaru listu drugih doktora iste specijalizacije.

**A4: Vremensko ograničenje rezervacije**
Ljekar može rezervisati termin do 12 mjeseci unaprijed.

### 7. Ishod
- Rezervacija je evidentirana u kalendaru specijaliste
- Pacijent je primio e-mail sa detaljima termina
- Termin više nije dostupan za druge korisnike