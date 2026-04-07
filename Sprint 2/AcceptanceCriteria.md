# Acceptance Criteria


### ID Storyja: US-01
**Naziv:** Historija pregleda korisnika

---

1. **Prikaz liste termina:**
   - **Kada** je pacijent logovan na svoj nalog i uđe u sekciju "Historija", **ako** klikne na pregled termina, **tada** sistem mora izlistati sve njegove prošle preglede poredane po datumu (od najnovijeg ka najstarijem).

2. **Detalji pregleda (Odgovor na otvoreno pitanje):**
   - **Kada** pacijent odabere konkretan termin iz liste, **tada** sistem mora omogućiti prikaz osnovnih podataka (datum, ljekar, odjel), tekstualni opis terapije i prikaz nalaza.

3. **Status otkazanih termina (Odgovor na otvoreno pitanje):**
   - **Sistem treba omogućiti** da se u listi historije vide i oni termini koji su ranije otkazani, ali oni moraju biti jasno označeni statusom "OTKAZAN".

4. **Navigacija i prazna historija:**
   - **Ako** pacijent nema nijedan prethodni pregled u bazi, **tada** korisnik treba dobiti jasnu poruku na ekranu: "Trenutno nemate zabilježenih pregleda u historiji".
  


### ID Storyja: US-02
**Naziv:** Admin panel - frontend

---

1. **Sigurnost pristupa (Autentifikacija):**
   - **Kada** korisnik pokuša pristupiti stranici za administraciju, **ako** nije prijavljen sa nalogom koji ima administratorske ovlasti, **tada** ga sistem mora automatski preusmjeriti na login stranicu.

2. **Glavni dashboard (Statistika):**
   - **Korisnik (admin) treba dobiti** pregledan prikaz na početnoj strani panela koja sadrži osnovne informacije: ukupan broj registrovanih pacijenata i broj zakazanih termina za tekući dan.

3. **Upravljanje korisnicima:**
   - **Kada** je administrator u sekciji "Korisnici", **ako** klikne na ime pacijenta ili ljekara, **tada** sistem mora otvoriti formu koja omogućava izmjenu njihovih ličnih podataka i uloga.

4. **Pregled termina:**
   - **Sistem mora omogućiti** tabelarni prikaz svih rezervacija u bolnici, sa mogućnošću filtriranja po datumu, kako bi administrator mogao brzo provjeriti zauzeće kapaciteta.

5. **Pretraga:**
   - **Kada** admin unese ime pacijenta u polje za pretragu unutar panela, **tada** sistem mora odmah prikazati relevantne rezultate.



### ID Storyja: US-03
**Naziv:** Admin panel - registracija pacijenta

---

1. **Glavni proces registracije:**
   - **Kada** je administrator u panelu za upravljanje pacijentima, **ako** klikne na "Novi pacijent" i popuni sva polja, **tada** sistem mora kreirati novi profil u bazi i dodijeliti mu ulogu 'PACIJENT'.

2. **Obavezni podaci (Odgovor na otvoreno pitanje):**
   - **Sistem mora zahtijevati** unos sljedećih obaveznih polja: Ime, Prezime, Validna Email adresa i Broj telefona. Ako bilo koje od ovih polja ostane prazno, sistem ne smije dozvoliti spašavanje.

3. **Validacija email adrese:**
   - **Ako** administrator pokuša registrovati pacijenta sa emailom koji već postoji u bazi, **tada** sistem mora izbaciti upozorenje "Korisnik sa ovim emailom je već registrovan".

4. **Samostalna registracija (Odgovor na otvoreno pitanje):**
   - **Sistem mora omogućiti** pacijentu da se i samostalno registruje putem javne stranice za registraciju, ali administrator mora imati uvid u sve te profile unutar svog panela.

5. **Feedback poruka:**
   - **Korisnik (admin) treba dobiti** potvrdu na vrhu ekrana "Pacijent uspješno registrovan" odmah nakon što se podaci upišu u bazu.

  
### ID Storyja: US-04
**Naziv:** Login sistem

---

1. **Glavni proces prijave (Autentifikacija):**
   - **Kada** korisnik unese ispravnu email adresu i lozinku, **ako** klikne na dugme "Prijavi se", **tada** sistem mora provjeriti podatke u bazi i dozvoliti pristup aplikaciji.

2. **Preusmjeravanje prema ulogama:**
   - **Kada** se korisnik uspješno prijavi, **ako** ima ulogu 'PACIJENT', tada ga sistem vodi na njegov profil, a **ako** ima ulogu 'DOKTOR', tada ga sistem vodi na ljekarski dashboard.

3. **Dvofaktorska autentifikacija:**
   - **Ako** korisnik ima aktiviranu opciju dvofaktorske autentifikacije, **tada** sistem nakon ispravne lozinke mora zatražiti unos sigurnosnog koda prije nego što dozvoli konačan pristup podacima.

4. **Blokada nakon neuspješnih pokušaja:**
   - **Sistem ne smije dozvoliti** više od 5 neuspješnih pokušaja prijave zaredom za jedan nalog. **Ako** korisnik premaši ovaj limit, **tada** sistem mora privremeno blokirati pristup tom nalogu.

5. **Poruke o greškama:**
   - **Korisnik treba dobiti** opštu poruku "Pogrešan email ili lozinka" u slučaju netačnih podataka. Sistem ne smije precizirati koji je od ta dva podatka pogrešan iz sigurnosnih razloga.


### ID Storyja: US-05
**Naziv:** Pregled dostupnih resursa

---

1. **Filtriranje po specijalizaciji (Odgovor na otvoreno pitanje):**
   - **Kada** je pacijent na stranici za pregled resursa, **ako** izabere određenu specijalizaciju (npr. Kardiologija) iz filtera, **tada** sistem mora prikazati isključivo ljekare koji pripadaju tom odjelu.

2. **Prikaz ljekara:**
   - **Kada** pacijent otvori listu resursa, **tada** sistem mora izlistati sve dostupne ljekare sa njihovim osnovnim informacijama (ime, titula i slika) radi lakšeg prepoznavanja.

3. **Odabir ljekara i kalendara:**
   - **Kada** pacijent klikne na konkretnog ljekara, **tada** sistem mora otvoriti njegov interaktivni kalendar sa prikazom slobodnih i zauzetih termina.

4. **Zauzetost u realnom vremenu (Odgovor na otvoreno pitanje):**
   - **Sistem mora omogućiti** prikaz zauzeća termina u realnom vremenu. **Ako** je termin upravo rezervisan od strane drugog korisnika, on više ne smije biti vidljiv kao slobodan za ostale pacijente.

5. **Vizuelna razlika termina:**
   - **Korisnik treba dobiti** jasan vizuelni prikaz (npr. različite boje) između termina koji su slobodni za klik i onih koji su već popunjeni ili blokirani od strane administracije.



### ID Storyja: US-06.1
**Naziv:** Rezervacija termina

---
1. **Glavni proces rezervacije:**
   - **Kada** je pacijent logovan i izabere slobodan termin iz kalendara, **ako** unese potrebne podatke i klikne na "Potvrdi", **tada** sistem mora taj termin upisati u bazu kao "ZAKAZAN"
   - Sistem mora omogućiti pacijentu rezervaciju termina najviše 60 dana unaprijed kod doktora opšte prakse
   - Sistem mora omogućiti rezervaciju termina najviše 12 mjeseci unaprijed kod specijaliste
     
2. **Ograničenje po specijalisti (Odgovor na otvoreno pitanje)**  
   - Sistem ne smije dozvoliti rezervisanje više termina u istom danu za jednog pacijenta kod istog specijaliste
   - Sistem mora ukloniti termin koji je popunjen iz liste slobodnih termina
3. **Označavanje hitnih termina (Odgovor na otvoreno pitanje)**
    - Sistem mora omogućiti da su hitni termini označeni crvenom bojom na dashboard-u
    - Sistem mora omogućiti doktoru i medicinskom osoblju da termin označe kao hitan 
    - Sistem ne smije dozvoliti pacijentu da označi termin kao hitan
4. **Prikaz slobodnih mjesta:**
   - **Sistem mora omogućiti** da pacijent vidi samo one termine koji su u radnom vremenu doktora i koji već nisu zauzeti od strane nekog drugog pacijenta.
5. **Problem duplih rezervacija:**
   - **Sistem ne smije dozvoliti** da dva različita pacijenta rezervišu isti termin.
6. **Rezervacija više termina dnevno (Odgovor na otvoreno pitanje)**
      - **Sistem ne smije dozvoliti** pacijentu da rezerviše više od jednog termina kod istog doktora u jednom danu, da ne bi zauzimao mjesta drugima.
     - Kada pacijent pokuša rezervisati termin kod istog doktora u istom danu, tada se na ekranu pojavi obavijest "Nije dozvoljeno rezervisati više termina kod istog doktora u istom danu!"
    
### ID Storyja: US-06.2
**Naziv:** Rezervacija termina

---   
1. **Izbor doktora**
     - Kada je pacijent logovan i unese ime doktora ili odjel u polje za pretragu, ako sistem pronađe rezultate, tada sistem mora prikazati listu doktora koji odgovaraju unesenom pojmu
     - Kada pacijent odabere doktora iz liste, tada sistem mora prikazati njegov kalendar sa slobodnim terminima
     - Kada pacijent klikne na slobodan termin, tada sistem mora preusmjeriti pacijenta na formu za unos podataka i potvrdu rezervacije
     
2. **Pretraga doktora**
   - Sistem mora omogućiti pacijentu pretragu doktora po imenu, specijalnosti ili odjelu
   - Kada pacijent unese pojam koji ne postoji u sistemu, sistem mora prikazati poruku "Nije pronađen nijedan doktor"

3. **Prikaz informacija o doktoru (Odgovor na otvoreno pitanje)**
   - Sistem mora prikazati osnovne informacije o doktoru (ime, specijalnost, odjel, radno vrijeme)

4. **Odabir doktora i prikaz termina**
    - Kada pacijent odabere doktora, sistem mora prikazati njegov kalendar sa slobodnim i zauzetim terminima
   - Sistem mora omogućiti pacijentu da odabere slobodan termin iz kalendara odabranog doktora

5. **Ograničenje po specijalosti (Odgovor na otvoreno pitanje)**
    - Sistem mora omogućiti samo doktoru opšte prakse rezervaciju termina kod specijaliste za svog pacijenta

### ID Storyja: US-07
**Naziv:** Email potvrda o rezervaciji

---

1. **Automatsko slanje potvrde:**
   - **Kada** pacijent uspješno završi proces rezervacije, **tada** sistem mora automatski poslati email potvrdu na korisničku adresu.

2. **Sadržaj emaila (Odgovor na otvoreno pitanje):**
   - **Korisnik treba dobiti** u emailu sve ključne informacije o terminu: tačan datum i vrijeme, ime i prezime doktora, naziv odjela.

3. **Slanje naknadnih podsjetnika (Odgovor na otvoreno pitanje):**
   - **Sistem treba poslati** i dodatni podsjetnik 24 sata prije samog termina, kako bi se osiguralo da pacijent ne zaboravi na pregled.

4. **Link za otkazivanje/izmjenu:**
   - **Korisnik treba dobiti** link unutar emaila koji ga vodi direktno na opciju otkazivanja ili pomjeranja termina, u skladu sa pravilima poliklinike.



### ID Storyja: US-08
**Naziv:** Otkazivanje termina (medicinsko osoblje)

---

1. **Proces otkazivanja iz panela:**
   - **Kada** je medicinsko osoblje prijavljeno u svoj panel, **ako** odabere konkretan termin pacijenta i klikne na opciju "Otkaži", **tada** sistem mora osloboditi to mjesto u bazi.

2. **Vremensko ograničenje (Odgovor na otvoreno pitanje):**
   - **Sistem mora omogućiti** osoblju da otkaže termin prije samog pregleda.

3. **Obavijest pacijentu (Odgovor na otvoreno pitanje):**
   - **Kada** osoblje otkaže termin, **tada** sistem mora automatski poslati email obavijest pacijentu sa informacijom da je njegov termin otkazan od strane bolnice i ponuditi mu kontakt telefon za novi dogovor.

4. **Potvrda:**
   - **Sistem ne smije dozvoliti** slučajno otkazivanje jednim klikom. Prije finalnog oslobađanja termina, **osoblje treba dobiti** upit: "Da li ste sigurni da želite otkazati ovaj termin?".

5. **Ažuriranje kalendara:**
   - **Sistem mora osigurati** da se otkazani termin odmah nakon akcije osoblja prikaže kao slobodan u kalendaru za ostale korisnike koji vrše pretragu.


### ID Storyja: US-09
**Naziv:** Otkazivanje termina (pacijent)

---

1. **Glavni proces otkazivanja:**
   - **Kada** je pacijent u sekciji "Moji termini", **ako** klikne na dugme "Otkaži" pored zakazanog pregleda, **tada** sistem mora promijeniti status tog termina u "OTKAZAN" i odmah osloboditi to mjesto u bazi.

2. **Vremensko ograničenje (Odgovor na otvoreno pitanje):**
   - **Sistem ne smije dozvoliti** pacijentu da samostalno otkaže termin ako je do početka pregleda ostalo manje od 24 sata.

3. **Email potvrda o otkazivanju (Odgovor na otvoreno pitanje):**
   - **Kada** pacijent uspješno otkaže termin, **tada** sistem mora automatski poslati email potvrdu pacijentu kao dokaz da je termin uredno otkazan.

4. **Potvrda akcije:**
   - **Kada** pacijent klikne na opciju otkazivanja, **tada** sistem mora izbaciti upit: "Da li ste sigurni da želite otkazati ovaj termin?".

5. **Ažuriranje kalendara za ostale:**
   - **Sistem mora omogućiti** da se netom otkazani termin odmah prikaže kao slobodan u realnom vremenu za sve ostale pacijente koji u tom trenutku vrše pretragu slobodnih doktora.

6. **Feedback na ekranu:**
   - **Korisnik treba dobiti** jasnu poruku na ekranu: "Vaš termin je uspješno otkazan" odmah nakon što se akcija završi.


### ID Storyja: US-10
**Naziv:** Dashboard za doktora – pregled rasporeda

---

1. **Dnevni i sedmični prikaz:**
   - **Kada** je doktor na svom panelu (KAN-28), **ako** klikne na opciju "Sedmični prikaz", **tada** mu sistem mora prikazati tabelu sa svim terminima raspoređenim po danima u tekućoj sedmici.

2. **Mijenjanje termina (Odgovor na otvoreno pitanje):**
   - **Sistem mora omogućiti** doktoru da pomjeri (izmjeni) termin pacijenta ako dođe do neplaniranih promjena. **Kada** doktor izmijeni termin, **tada** pacijent mora automatski dobiti email obavijest o novom vremenu pregleda.

3. **Historija pregleda pacijenta (Odgovor na otvoreno pitanje):**
   - **Kada** doktor pregleda listu pacijenata za taj dan, **ako** klikne na ime pacijenta, **tada** mu sistem mora otvoriti uvid u historiju prethodnih dolazaka i nalaza tog pacijenta radi boljeg uvida u slučaj.


### ID Storyja: US-11
**Naziv:** Automatsko oslobađanje zaključanih termina

---

1. **Vrijeme otključavanja termina (Odgovor na otvoreno pitanje)**  
    - Kada termin dobije status "zaključan", ako pacijent ne klikne dugme za potvrdu termina u roku od 2 minute, tada termin dobije status slobodan
    - Kada prođe rok od 2 minute, ako pacijent nije kliknuo na dugme "Potvrdi termin", tada se pacijent vraća na početni ekran za izbor termina
    - Korisnik treba dobiti obavijest na ekranu "Vrijeme za potvrdu termina je isteklo. Molimo Vas odaberite novi termin" kada se vrati na početni ekran za izbor termina
   - Sistem mora omogućiti da, nakon 2 minute bez potvrde, termin bude ponovo vidljiv među slobodnim terminima
   - Kada korisnik klikne na dugme za potvrdu, ako je u tom trenutku nastupilo tačno 2 minute, tada se korisnik vraća na početni ekran gdje mu se prikaže poruka "Vrijeme za potvrdu termina je isteklo. Molimo Vas odaberite novi termin"

 2. **Unos podataka**
    - Sistem ne smije dozvoliti potvrdu termina ako pacijent nije popunio sva obavezna polja
    - Korisnik treba dobiti poruku "Ne smijete rezervisati termin bez popunjavanja obaveznih polja!" ako pokuša potvrditi termin bez unesenih podataka

### ID Storyja: US-12
**Naziv:** Validacija i sprječavanje duplih rezervacija

---

1. **Rezervacija termina (Odgovor na otvoreno pitanje)**   
    - Kada korisnik odabere termin, ako se ne preklapa ni sa jednom od postojećih rezervacija, tada se korisiku prikazuje forma za unos podataka i potvrdu termina
    - Sistem mora omogućiti zaključavanje termina u roku od 2 minute kako bi spriječio duple rezervacije 
    - Sistem ne smije dozvoliti pacijentu rezervaciju termina koji se vremenski poklapa s bilo kojim već potvrđenim terminom, bez obzira da li se radi o doktoru opšte prakse ili specijalisti
    - Sistem mora vršiti provjeru preklapanja termina u trenutku kada pacijent klikne na termin
    - Kada korisnik klikne na termin, ako u to vrijeme ima rezervisan termin kod drugog doktora, tada se korisniku prikazuje poruka "Već imate rezervisan termin u ovo vrijeme. Molimo Vas odaberite drugi termin ili otkažite termin koji se preklapa"
    - Sistem treba omogućiti pacijentu da rezerviše termin ako je otkazao termin sa kojim je postojalo preklapanje
    - Sistem mora potvrđene termine označiti kao zauzete i izbaciti ih iz liste ponuđenih slobodnih termina

2. **Rezervacija termina od strane dva ili više korisnika**  
   - Kada više korisnika želi rezervisati isti termin, tada se termin zaključava za korisnika čiji je zahtjev prvi stigao 
   - Kada pacijent želi rezervisati termin, ako njegov zahtjev stigne na server poslije zahtjeva drugog pacijenta, tada pacijent dobija poruku na ekranu "Žao nam je. Termin je već rezervisan. Molimo izaberite drugi"


### ID Storyja: US-13.1
**Naziv:** Upravljanje radnim vremenom doktora (admin)

---
1. **Dodavanje radnog vremena doktora**  
    - Kada je administrator logovan i odabere doktora iz sistema, ako unese radno vrijeme i klikne na dugme "Potvrdi", tada sistem mora sačuvati radno vrijeme i prikazati ga u kalendaru doktora
2. **Promjena radnog vremena**  
    - Sistem mora omogućiti administratoru izmjenu postojećeg radnog vremena doktora
    - Kada administrator izmijeni radno vrijeme,tada sistem mora odmah  ažurirati kalendar doktora
    - Sistem ne smije dozvoliti promjenu radnog vremena ako doktor ima već zakazane termine u tom periodu
    - Administrator mora dobiti obavijest "Nije moguće promijeniti radno vrijeme. Doktor ima rezervisane termine u ovom periodu"
3. **Pregled radnog vremena**
     - Sistem mora omogućiti administratoru pregled radnog vremena svih doktora
     - Sistem mora prikazati zauzete i slobodne termine u okviru radnog vremena svakog doktora
4. **Promjena radnog vremena od strane doktora**
    - Sistem ne smije dozvoliti doktoru da mijenja svoje radno vrijeme

### ID Storyja: US-13.2
**Naziv:** Upravljanje radnim vremenom doktora

---
1. **Slanje upita**  
   - Kada je doktor logovan i odabere opciju "Promjena dužine termina", ako unese željenu dužinu termina i razlog promjene i klikne dugme "Pošalji upit", tada sistem mora poslati upit administratoru 
   - Doktor treba dobiti obavijest na ekranu "Vaš upit je uspješno poslan"
2. **Odobravanje upita od strane admina (Odgovor na otvoreno pitanje)**  
      - Sistem mora omogućiti administratoru pregled svih pristiglih upita za promjenu dužine termina
      - Kada administrator odobri upit, sistem mora automatski ažurirati dužinu termina u kalendaru doktora
      - Kada administrator odbije upit, sistem mora zadržati postojeću dužinu termina
3. **Obavijesti o upitu (Odgovor na otvoreno pitanje)**
     - Kada administrator odobri ili odbije upit, sistem mora obavijestiti doktora putem obavijesti u sistemu
     - Kada pristigne novi upit, sistem mora obavijestiti administratora putem obavijesti u sistemu
4. **Preklapanje sa postojećim terminima**
    - Sistem ne smije dozvoliti promjenu dužine termina ako bi nova dužina uzrokovala preklapanje sa već zakazanim terminima


### ID Storyja: US-14
**Naziv:** Reset lozinke putem emaila

---
1. **Validni podaci i link**  
    - Kada korisnik klikne na link zaboravljena lozinka ispod forme za login, ako unese ispravan mail, tada sistem šalje link za resetovanje lozinke na email
    - Kada korisnik klikne na validan link za resetovanje lozinke i promijeni lozinku, tada sistem treba zabilježiti promijenjenu lozinku i preusmjeriti ga na login formu
    - Sistem ne smije dozvoliti ponovnu upotrebu linka za resetovanje nakon što je već iskorišten

 2. **Vrijeme validnosti linka ( Odgovor na otvoreno pitanje)**
    - Sistem mora omogućiti da link za resetovanje lozinke bude validan 10 minuta
    - Kada korisnik klikne na link za reset lozinke koji je istekao, tada korisnik dobiva obavijest "Link za resetovanje je istekao."
 3. **Limit pokušaja resetovanja (Odgovor na otvoreno pitanje)**  
     - Sistem treba omogućiti da korisnik može generisati link za resetovanje lozinke 3 puta u roku od sat vremena
     - Kada korisnik pokuša da generiše link za resetovanje poruke, ako je premašio 3 pokušaja, tada se korisniku na ekranu prikazuje poruka "Morate čekati 1h do sljedećeg pokušaja generisanja linka za promjenu lozinke"
     - Sistem ne smije dozvoliti generisanje linka za resetovanje više od 3 puta za bilo koji mail koji se unosi
4. **Unos e-maila**  
   - Kada korisnik unese mail koji ne postoji u sistemu, tada sistem prikazuje poruku na ekranu "Link za resetovanje lozinke će biti poslan na Vašu mail adresu"
   - Kada korisnik unese neispravan fomat mail adrese, tada sistem prikazuje upozorenje na ekranu "Neispravan format mail adrese!"
5. **Sigurnost lozinke**
   - Sistem ne smije dozvoliti postavljanje lozinke koja ima manje od 8 karaktera, nema bar jedno veliko slovo i barem 1 broj


### ID Storyja: US-15 
**Naziv:** Rezervacija termina kod specijaliste putem porodičnog doktora 

---
1. **Rezervacija termina**
   - Kada doktor pristupi rasporedu specijaliste i odabere slobodan termin, ako doktor putem pretrage pronađe pacijenta i odabere ga za rezervaciju termina na njegovo ime, tada sistem treba rezervisati termin za odabranog pacijenta i doktor dobija poruku na ekranu "Termin je uspješno rezervisan"
   - Sistem mora odmah izbaciti rezervisani termin sa liste slobodnih termina
2. **Obavijest o rezervaciji (Odgovor na otvoreno pitanje)**
   - Kada doktor rezerviše termin za pacijenta, pacijentu se šalje obavijest na mail o vremenu termina i podacima o specijalisti 

3. **Otkazivanje termina od strane pacijenta (Odgovor na otvoreno pitanje)**
   - Sistem mora omogućiti pacijentu da može odbiti termin koji je rezervisan na njegovo ime ako je rok duži od 24 h
   - Kada pacijent klikne opciju "Otkaži termin", tada sistem treba odmah osloboditi rezervisani termin 
   - Sistem ne smije dozvoliti otkazivanje rezervacije 24 h prije rezervisanog termina
   - Korisnik treba obavijest na ekranu "Rezervaciju nije moguće otkazati 24 h prije"


   
### ID Storyja: US-16
**Naziv:** Menadžment panel

---
1. **Prioritetni podaci za prikaz (Odgovor na otvoreno pitanje)**
    - Kada je administrator prijavljen, ako pristupi menadžment panelu, tada treba da mu se prikaže ukupan broj registrovanih korisnika, ukupan broj zakazanih termina, zauzetost sala
    - Sistem mora omogućiti filtriranje podataka po vremenskom periodu

2. **Ažuriranje podataka podataka**
   - Sistem mora omogućiti da se podaci ažuriraju u realnom vremenu

3. **Pravo pristupa**
    - Sistem ne smije dozvoliti pristup menadžment panelu osobama koje nemaju ulogu administratora
    
4. **Registrovani korisnici**
    - Sistem mora omogućiti prikaz broja registorvanih korisnika po ulogama u sistemu (doktor, pacijent, medicinska sestra,admin)

5. **Zakazani termini**
    - Sistem mora omogućiti prikazivanje broja zakazanih termina po svakom doktoru
    - Sistem mora omogućiti prikazivanje broja slobodnih termina
    - Sistem mora omogućiti prikazivanje zauzetosti sala po terminima
6. **Aktivnost zaposlenih**
    - Sistem mora prikazivati informaciju ko je zakazao termin i kada
    - Sistem mora prikazati informaciju ko je otkazao termin i kada
7. **Upotreba za izvještavanje (Odgovor na otvoreno pitanje)**
    - Sistem mora omogućiti administratoru eksportovanje podataka o terminima za odabrani period u CSV formatu



### ID Storyja: US-17
**Naziv:** Automatska odjava

---
1. **Pokretanje timeout (Odgovor na otvoreno pitanje)**
    - Kada korisnik nije aktivan više od 15 minuta na svom korisničkom profilu, tada sistem treba da pokrene automatsku odjavu korisnika 
    - Korisnik treba dobiti obavijest na ekranu "Biti ćete odjavljeni s vašeg profila za 2 minute"
    - Korisnik na obavijesti koja se pojavi na ekranu mora imati 2 dugmeta sa opcijama "Otkaži" i "Produži sesiju"
2. **Odjava**
    - Sistem mora omogućiti preusmjeravanja korisnika na login formu nakon 15 minuta neaktivnosti
 
3. **Produži sesiju**
    - Kada korisnik klikne na dugme "Produži sesiju", sistem treba resetovati tajmer neaktivnosti na 0 minuta
    - Obavijest se zatvara i korisnik nastavlja rad na istoj stranici bez prekida
 
4. **Otkaži sesiju**
    - Kada korisnik klikne na dugme "Otkaži", sistem treba odmah odjaviti korisnika
    - Sistem preusmjerava korisnika na login formu
 
5. **Sigurnost sesije**
    - Nakon automatske odjave, korisnička sesija mora biti poništena
    - Pokušaj pristupa zaštićenim stranicama s isteknutom sesijom mora rezultirati preusmjeravanjem na login formu
### ID Storyja: US-18
**Naziv:** Logovanje svih akcija u sistemu (audit log)

---
1. **Bilježenje akcija**
    - Sistem mora bilježiti sve CRUD akcije (kreiranje, čitanje, ažuriranje, brisanje) koje korisnici izvršavaju unutar sistema
    - Svaki zapis u audit logu mora sadržavati: ID korisnika, vrstu akcije, naziv entiteta nad kojim je akcija izvršena, datum i vrijeme akcije
    - Sistem mora bilježiti i neuspješne pokušaje prijave u sistem
 
2. **Pristup audit logu (Odgovor na otvoreno pitanje)**
    - Samo administratori sistema imaju pravo pregleda audit loga
    - Administratori mogu pretraživati i filtrirati zapise prema korisniku, vrsti akcije i vremenskom periodu
 
3. **Čuvanje podataka (Odgovor na otvoreno pitanje)**
    - Podaci u audit logu čuvaju se minimalno 12 mjeseci
    - Nakon isteka perioda čuvanja, podaci se automatski arhiviraju ili brišu u skladu s politikom privatnosti
 
4. **Integritet podataka**
    - Zapisi u audit logu ne smiju biti izmjenjivi ni od strane administratora
    - Sistem mora osigurati da se svaka akcija zabilježi u realnom vremenu, bez mogućnosti preskakanja zapisa

### ID Storyja: US-19.1
**Naziv:** Omogućavanje pregleda komentara termina

--- 
1. **Pregled komentara po terminu**  
    - Kada je doktor logovan i otvori detalje termina, tada sistem mora prikazati sve komentare vezane za taj termin
    - Sistem ne smije dozvoliti doktoru pregled komentara termina koji nisu njegov
2. **Unos komentara (Odgovor na otvoreno pitanje)**
    - Sistem mora omogućiti pacijentu i medicinskom osoblju unos komentara prilikom zakazivanja termina
    - Komentar je opcionalno polje prilikom kreiranja termina

3. **Pregled komentara (Odgovor na otvoreno pitanje)**
    - Sistem mora omogućiti da komentari budu vidljivi i doktoru i pacijentu
    - Komentari se prikazuju u okviru detalja termina na pregledu zakazanih termina
    - Korisnik mora biti prijavljen i imati pristup konkretnom terminu kako bi vidio komentare

4. **Prikaz detalja komentara**
    - Sistem mora prikazati komentar u detaljima termina uz informacije: tekst komentara, ime osobe koja je unijela komentar i datum unosa
    - Ukoliko termin nema komentara, u sekciji za komentare prikazuje se poruka "Nema komentara za ovaj termin"


### ID Storyja: US-19.2
**Naziv:** Omogućavanje dodavanje komentara prilikom zakazivanja termina

--- 
1. **Dodavanje komentara**  
    - Kada je pacijent logovan i odabere aktivnu rezervaciju, ako unese napomenu u polje za komentar i klikne "Potvrdi", tada sistem mora sačuvati napomenu i prikazati je uz detalje rezervacije
    - Sistem mora omogućiti pacijentu da rezerviše termin i bez unosa komentara
    - Sistem ne smije dozvoliti unos napomene sa više od 255 karaktera
    - Korisnik mora dobiti obavijest na ekranu o prekoračenju dozvoljenog broja karaktera "Prekoračili ste broj dozvoljenih karaktera za ovo polje!"
2. **Izmjena i brisanje komentara (Odgovor na otvoreno pitanje)**
    - Komentar može izmijeniti ili obrisati samo osoba koja ga je unijela ili administrator sistema
    - Sistem mora omogućiti izmjenu i brisanje komentara samo prije pregleda
    - Sistem ne smije dozvoliti izmjenu i brisanje komentara nakon pregleda

3. **Klasifikacija hitnosti (Odgovor na otvoreno pitanje)**  
   - Sistem mora omogućiti samo doktoru da označi termin pod "HITNO"

### ID Storyja: US-20
**Naziv:** Vodič za korištenje stranice

---
 1. **Sadržaj vodiča (Odgovor na otvoreno pitanje):**
   - **Kada** korisnik otvori vodič, **tada** sistem mora prikazati tekstualna uputstva sa pratećim slikama za sve ključne funkcije. Vodič ne treba sadržavati video tutorijale u ovoj fazi, već mora biti podijeljen na sekcije za pacijente i za doktore.

2. **Pristup vodiču sa svake stranice:**
   - **Kada** je korisnik na bilo kojoj stranici sistema, **ako** klikne na ikonu ili link za pomoć, **tada** se vodič mora otvoriti kao zasebna stranica (ili u novom tabu) bez prekidanja trenutnog rada korisnika.

3. **Navigacija (Skok na temu):**
   - **Korisnik treba dobiti** meni sa strane koji omogućava direktan "skok" na određenu sekciju vodiča (npr. "Kako rezervisati termin") bez potrebe za ručnim skrolovanjem kroz cijeli tekst.

4. **Ručno ažuriranje (Odgovor na otvoreno pitanje):**
   - **Sistem mora omogućiti** administratoru da ručno izmijeni vodič putem admin panela.

### ID Storyja: US-21 
**Naziv:** Panel medicinskog osoblja 
---
1. **Glavni prikaz termina:** 
   - **Kada** je medicinsko osoblje prijavljeno na sistem, **ako** otvori svoj panel, **tada** sistem mora prikazati listu svih termina zakazanih za taj dan
2. **Kreiranje novih termina (Odgovor na otvoreno pitanje):** 
   - **Sistem mora omogućiti** osoblju da ručno kreira novi termin za pacijenta (npr. u slučaju telefonske rezervacije). **Kada** osoblje unese podatke pacijenta i izabere slobodan termin, **tada** se taj termin mora odmah pojaviti u bazi kao "ZAKAZAN". 
3. **Prikaz informacija o pacijentu (Odgovor na otvoreno pitanje):** 
   - **Kada** osoblje klikne na detalje termina, **tada** sistem mora prikazati sljedeće relevantne informacije: Ime i prezime pacijenta, Broj telefona, Vrstu pregleda i Razlog posjete koji je pacijent naveo. 
4. **Brza pretraga i filtriranje:** 
   - **Kada** osoblje unese ime pacijenta u polje za pretragu, **tada** sistem mora filtrirati listu i prikazati samo termine vezane za tog specifičnog pacijenta. 
5. **Ograničenje pristupa:** - **Sistem ne smije dozvoliti** običnim pacijentima pristup ovom panelu. Pristup je dozvoljen isključivo medicinskom osoblju ili administrator.



### ID Storyja: US-22 
**Naziv:** Two factor authentication (2FA) 
--- 
1. **Slanje sigurnosnog koda (Tip 2FA):**
   - **Kada** korisnik unese ispravnu email adresu i lozinku, **ako** mu je uključena opcija 2FA, **tada** sistem mora automatski poslati email sa jednokratnim kodom na njegovu adresu. 
2. **Unos i potvrda koda:**
   - **Kada** korisnik dobije kod, **ako** ga ispravno unese u polje za potvrdu na ekranu, **tada** mu sistem mora dozvoliti konačan pristup aplikaciji. 
3. **Pogrešan ili istekao kod:**
   - **Sistem ne smije dozvoliti** prijavu ako je unijeti kod pogrešan. Takođe, kod mora biti nevažeći **ako** je od njegovog slanja prošlo više od 5 minuta (istekao kod). 
4. **Opcionalna vs Obavezna aktivacija (Odgovor na otvoreno pitanje):**
   - **Sistem mora omogućiti** pacijentima da sami biraju da li žele aktivirati 2FA na svom profilu (opcionalno). 
5. **Aktivacija 2FA opcije:**
    - **Kada** pacijent ode na "Postavke profila", **tada** korisnik treba dobiti opciju (toggle/prekidač) da uključi ili isključi 2FA zaštitu za svoj nalog. 
6. **Poruka o slanju koda:**
    - **Korisnik treba dobiti** jasnu informaciju na ekranu kako bi znao da treba provjeriti svoj inbox prije nastavka prijave.



### ID Storyja: US-23 
**Naziv:** Detekcija neobičnog ponašanja - blokiranje naloga
 --- 
1. **Limit pokušaja prijave (Odgovor na otvoreno pitanje):**
   - **Kada** bilo koji korisnik pokušava da se prijavi na sistem, **ako** unese pogrešnu lozinku 5 puta zaredom, **tada** sistem mora automatski blokirati taj nalog na neko vrijeme. 
2. **Upozorenje prije blokade (Odgovor na otvoreno pitanje):**
   - **Kada** se desi 3. neuspješan pokušaj prijave zaredom, **tada** korisnik treba dobiti jasno upozorenje na ekranu: "Preostala su vam još 2 pokušaja prije nego što nalog bude privremeno blokiran". 
3. **Obavijest vlasniku putem emaila:**
   - **Kada** nalog bude zvanično blokiran, **tada** sistem mora poslati automatski email vlasniku tog naloga sa informacijom da je zabilježen neobičan broj pokušaja prijave radi njegove sigurnosti. 
4. **Ručno odblokiranje (Admin):**
   - **Sistem mora omogućiti** administratoru da unutar admin panela vidi listu blokiranih korisnika i da ih ručno odblokira prije isteka vremena ako pacijent to zatraži (npr. putem telefona).



### ID Storyja: US-24
 **Naziv:** Enkripcija osjetljivih podataka
 --- 
1. **Enkripcija na nivou baze (Odgovor na otvoreno pitanje):
   - **Sistem mora osigurati** da se osjetljivi podaci pacijenata čuvaju isključivo u enkriptovanom obliku koristeći standardni **AES-256** algoritam 
2. **Heširanje lozinki:**
   - **Kada** korisnik kreira lozinku, **ako** sistem treba da je spasi u bazu, **tada** ona mora biti heširana tako da niko, pa ni administrator baze, ne može vidjeti lozinku u običnom tekstu. 
3. **Enkripcija backup fajlova (Odgovor na otvoreno pitanje):**
   - **Ako** sistem kreira automatsku rezervnu kopiju (backup) baze podataka, **tada** i taj backup fajl mora biti enkriptovan kao i aktivna baza. 

### ID Storyja: US-25
 **Naziv:** Označavanje hitnosti prijavljenog termina 
---
1. **Ručno označavanje hitnosti:**
   - **Kada** medicinska sestra ili administrator pregledaju listu zakazanih termina, **ako** odaberu određenog pacijenta, **tada** sistem mora ponuditi opciju da se taj termin označi statusom "HITNO". 
2. **Vizuelno isticanje u panelu:**
   - **Kada** je termin označen kao hitan, **tada** se taj cijeli red u tabeli na doktorovom i admin dashboardu mora obojiti u crvenu boju. 
3. **Kriteriji za hitnost (Odgovor na otvoreno pitanje):**
   - **Sistem treba omogućiti** osoblju da oznaku hitnosti dodijeli na osnovu pacijentovog opisa simptoma ili na osnovu procjene sestre prilikom dolaska pacijenta.
4. **Vidljivost za pacijenta (Odgovor na otvoreno pitanje):**
   - **Sistem ne smije prikazivati** internu oznaku "Hitno" na pacijentovoj strani aplikacije. Oznaka je namijenjena isključivo za internu organizaciju medicinskog osoblja. 

### ID Storyja: US-26.1
**Naziv:** Vizuelni pregled statistike (Admin)
---
1. **Nivoi prikaza (Odgovor na otvoreno pitanje):**
   - **Kada** administrator otvori stranicu sa statistikom, **ako** izabere filter, **tada** sistem mora omogućiti prikaz podataka na tri nivoa: za cijelu ustanovu, za određeni odjel ili za pojedinačnog ljekara.

2. **Grafički prikaz (Odgovor na otvoreno pitanje):**
   - **Sistem mora omogućiti** vizuelni prikaz putem jednostavnih grafikona (npr. linijski dijagram za trend rezervacija kroz mjesec) pored standardne tabelarne forme, radi lakše identifikacije "uskih grla".

3. **Ključne metrike (Odgovor na otvoreno pitanje):**
   - **Korisnik (admin) treba dobiti** uvid u sljedeće metrike: ukupan broj zakazanih termina, procenat otkazanih termina i prosječno vrijeme čekanja na slobodan termin kod određenog specijaliste.
  
### ID Storyja: US-26.2
**Naziv:** Export statistike u CSV (Uprava)
---
1. **Eksport na zahtjev (Odgovor na otvoreno pitanje):**
   - **Kada** menadžment odabere željeni period, **ako** klikne na dugme "Export u CSV", **tada** sistem mora generisati traženi CSV file.

2. **Kontrola pristupa (Odgovor na otvoreno pitanje):**
   - **Sistem ne smije dozvoliti** običnim korisnicima (pacijentima) pristup ovoj funkcionalnosti. Pravo pristupa imna administrator.

3. **Tačnost podataka:**
   - **Kada** se CSV fajl otvori, **tada** podaci u kolonama (ime ljekara, datum, status termina) moraju biti identični onima koji su pohranjeni u bazi podataka.

4. **Čitljivost fajla:**
   - **Sistem mora osigurati** da su podaci u CSV fajlu pravilno razdvojeni i formatirani.


### ID Storyja: US-27
**Naziv:** Automatski podsjetnik
--- 
1. **Slanje podsjetnika (Odgovor na otvoreno pitanje)**
    - Sistem automatski šalje podsjetnik pacijentima koji imaju označen atribut "hronični bolesnik" kada se približava period u kojem trebaju obaviti rutinski pregled ili produžiti terapiju
    - Podsjetnik se šalje 7 dana prije isteka perioda važenja terapije ili preporučenog datuma rutinskog pregleda
    - Podsjetnik se šalje putem emaila na adresu registrovanu u korisničkom profilu pacijenta
 
2. **Sadržaj podsjetnika**
    - Email podsjetnik mora sadržavati: ime i prezime pacijenta, razlog podsjetnika (produženje terapije ili rutinski pregled), preporučeni vremenski period u kojem pregled treba biti obavljen
    - Podsjetnik mora sadržavati poziv na akciju sa uputom kako zakazati termin putem sistema
 
3. **Uvjet slanja**
    - Sistem šalje podsjetnik samo ukoliko pacijent nema već zakazan termin u preporučenom periodu
    - Ukoliko pacijent zakaže termin nakon primljenog podsjetnika, sistem ne šalje dodatne podsjetnike za isti period

4. **Definisanje perioda pregleda**
    - Doktor sistema definišu period u kojem hronični pacijent treba obaviti rutinski pregled ili produžiti terapiju
    - Taj period se čuva u profilu pacijenta i na osnovu njega sistem automatski izračunava kada treba poslati podsjetnik
 
5. **Evidencija poslanih podsjetnika**
    - Sistem mora evidentirati svaki poslani podsjetnik s datumom i vremenom slanja
    - Administrator može pregledati evidenciju poslanih podsjetnika za svakog pacijenta

### ID Storyja: US-28
**Naziv:** Upload i evidencija laboratorijskih nalaza
---
1. **Glavni proces uploada:**
   - **Kada** je medicinsko osoblje na profilu pacijenta, **ako** odabere opciju "Dodaj nalaz" i izabere PDF fajl, **tada** sistem mora taj fajl spasiti u bazu i povezati ga sa historijom pacijenta.

2. **Dozvoljeni tipovi fajlova (Odgovor na otvoreno pitanje):**
   - **Sistem ne smije dozvoliti** upload bilo kojeg formata osim **PDF-a**. Ako korisnik pokuša dodati sliku ili Word dokument, tada sistem mora izbaciti poruku: "Dozvoljeni su samo PDF fajlovi".

3. **Trajanje čuvanja (Odgovor na otvoreno pitanje):**
   - **Sistem mora osigurati** da se svi uploadovani nalazi čuvaju trajno (dok je nalog aktivan), kako bi bili dostupni doktorima za sve buduće preglede pacijenta.

4. **Pregled nalaza:**
   - **Kada** pacijent ili doktor kliknu na naziv nalaza u istoriji, **tada** sistem mora otvoriti PDF dokument u novom tabu preglednika radi lakšeg čitanja.

### ID Storyja: US-29
**Naziv:** Admin panel - backend

---
1. **Izbor arhitekture (Odgovor na otvoreno pitanje):**
   - **Sistem mora implementirati** komunikaciju putem **REST API** standarda. Kada frontend pošalje zahtjev, backend mora vratiti odgovor isključivo u JSON formatu.

2. **Prioritetne funkcije (Odgovor na otvoreno pitanje):**
   - **Kao prioritet**, backend mora prvo podržati rute za prijavu (login) administratora i osnovno upravljanje (dodavanje/brisanje) doktorima i odjelima.

3. **Sigurnost administratorskih ruta:**
   - **Sistem ne smije dozvoliti** pristup backend rutama za administraciju bez validnog tokena. Ako običan pacijent pokuša pristupiti, **tada** backend mora vratiti grešku "Pristup odbijen".

4. **Validacija ulaznih podataka:**
   - **Kada** se šalju podaci na backend (npr. novi ljekar), **ako** neki obavezni podatak fali ili je u pogrešnom formatu, **tada** backend mora zaustaviti upis u bazu i vratiti jasnu poruku o grešci (npr. 400 Bad Request).

### ID Storyja: US-30
**Naziv:** Kreirati ER model baze podataka

---

1. **Tip baze podataka (Odgovor na otvoreno pitanje):**
   - **Sistem mora koristiti** relacijsku (**SQL**) bazu podataka kako bi se osigurala tačna povezanost pacijenata sa njihovim terminima.

2. **Struktura ključeva i relacija:**
   - **Kada se dizajniraju tabele**, **tada** svaka tabela mora imati svoj jedinstveni primarni ključ (PK), a sve veze moraju biti osigurane stranim ključevima (FK).

3. **Podrška za proširenja (Odgovor na otvoreno pitanje):**
   - **Model baze mora biti projektovan** tako da omogućava lako dodavanje novih modula u budućnosti bez potrebe za mijenjanjem osnovnih tabela korisnika i ljekara.

### ID Storyja: US-31 
**Naziv:** Kreiranje baze podataka 
--- 
1. **Izbor tipa baze podataka (Odgovor na otvoreno pitanje):**
   - **Sistem mora koristiti** relacijsku bazu podataka (SQL), kao što je PostgreSQL ili MySQL.
2. **Implementacija tabela:**
   - **Kada** administrator pokrene skripte za kreiranje baze, **tada** sistem mora uspješno generisati sve tabele, primarne ključeve (PK) i strane ključeve (FK).
3. **Integritet podataka:**
   - **Sistem ne smije dozvoliti** upisivanje termina u bazu ako pacijent ili ljekar sa tim ID-em ne postoje, čime se sprječava pojava nevažećih zapisa. 
4. **Dostupnost i Replikacija (Odgovor na otvoreno pitanje):**
   - **Za veću dostupnost sistema**, baza podataka mora vršiti automatski dnevni backup. U slučaju kvara na glavnom serveru, administrator mora biti u mogućnosti da povrati podatke iz zadnje kopije. 

### ID Storyja: US-32 
**Naziv:** Definisanje prava pristupa bazi podataka
 --- 
1. **Definisanje uloga (Odgovor na otvoreno pitanje):**
   - **Sistem mora omogućiti** razlikovanje najmanje četiri osnovne uloge korisnika: PACIJENT, DOKTOR, MEDICINSKO_OSOBLJE i ADMINISTRATOR. 
2. **Centralizovana kontrola pristupa (Odgovor na otvoreno pitanje):**
   - **Kada** korisnik pokuša pristupiti bilo kojem API endpointu ili stranici, **ako** njegova uloga nije autorizovana za tu akciju, **tada** sistem mora odbiti zahtjev i vratiti grešku. 
3. **Pristup doktora:**
   - **Kada** je doktor prijavljen na sistem, **tada** mu sistem mora omogućiti puni pristup terminima i historiji onih pacijenata koji su rezervisali pregled kod njega. 
4. **Pristup medicinskog osoblja:**
   - **Kada** član medicinskog osoblja otvori panel, **tada** mu sistem mora dozvoliti upravljanje kalendarima svih ljekara.

### ID Storyja: US-33
**Naziv:** Testiranje baze podataka
---
1. **Provjera integriteta podataka (Validnost):**
   - **Kada** QA inženjer unosi neispravne podatke u bazu (npr. pogrešan format datuma), **ako** baza odbije taj upis i izbaci grešku, **tada** je test validnosti podataka uspješan.

2. **Provjera prava pristupa:**
   - **Kada** se testiraju prava pristupa bazi, **ako** korisnik koji nema administratorske ovlasti ne može direktno pristupiti tabelama, **tada** je sigurnost baze potvrđena.

3. **Automatizacija vs Ručno testiranje (Odgovor na otvoreno pitanje):**
   - **Sistem mora omogućiti** automatsko testiranje integriteta podataka, dok se provjera prava pristupa i vizuelna provjera unosa vrši ručno od strane QA inženjera.

4. **Dokumentovanje rezultata (Odgovor na otvoreno pitanje):**
   - **Kada** je proces testiranja završen, **ako** su svi rezultati uredno upisani u QA izvještaj, **tada** je proces dokumentovanja rezultata završen.




   



 
