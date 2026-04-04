# Acceptance Criteria


### ID Storyja: US-01
**Naziv:** Historija pregleda korisnika

---

1. **Prikaz liste termina:**
   - **Kada** je pacijent logovan na svoj nalog i uđe u sekciju "Historija", **ako** klikne na pregled termina, **tada** sistem mora izlistati sve njegove prošle preglede poredane po datumu (od najnovijeg ka najstarijem).

2. **Detalji pregleda:**
   - **Kada** pacijent odabere konkretan termin iz liste, **tada** sistem mora omogućiti prikaz osnovnih podataka (datum, ljekar, odjel) i tekstualni opis terapije/nalaza.

3. **Status otkazanih termina:**
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



### ID Storyja: US-06
**Naziv:** Rezervacija termina

---

1. **Glavni proces rezervacije:**
   - **Kada** je pacijent logovan i izabere slobodan termin iz kalendara, **ako** klikne na "Potvrdi", **tada** sistem mora taj termin upisati u bazu kao "ZAKAZAN".
     
2. **Potvrda rezervacije:**
   - **Korisnik treba dobiti** potvrdu na ekranu i na email odmah nakon što uspješno rezerviše termin, sa svim detaljima (vrijeme, doktor).
     
3. **Prikaz slobodnih mjesta:**
   - **Sistem mora omogućiti** da pacijent vidi samo one termine koji su u radnom vremenu doktora i koji već nisu zauzeti od strane nekog drugog pacijenta.
     
4. **Problem duplih rezervacija:**
   - **Sistem ne smije dozvoliti** da dva različita pacijenta rezervišu isti termin.
     
5. **Više termina dnevno (Otvoreno pitanje):**
   - **Sistem ne treba dozvoliti** pacijentu da rezerviše više od jednog termina kod istog doktora u jednom danu, da ne bi zauzimao mjesta drugima.
     


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
    - Sistem mora omogućiti zaključavanje termina u roku od 2 minute kako bi spriječio duple rezervacije (mozda izbaciti spominje se u US-11)
    - Sistem ne smije dozvoliti pacijentu rezervaciju termina koji se vremenski poklapa s bilo kojim već potvrđenim terminom, bez obzira na doktora
    - Sistem mora vršiti provjeru preklapanja termina u trenutku kada pacijent klikne na termin
    - Kada korisnik klikne na termin, ako u to vrijeme ima rezervisan termin kod drugog doktora, tada se korisniku prikazuje poruka "Već imate rezervisan termin u ovo vrijeme. Molimo Vas odaberite drugi termin ili otkažite termin koji se preklapa"
    - Sistem treba omogućiti pacijentu da rezerviše termin ako je otkazao termin sa kojim je postojalo preklapanje
    - Sistem mora potvrđene termine označiti kao zauzete i izbaciti ih iz liste ponuđenih slobodnih termina

2. **Rezervacija termina od strane dva ili više korisnika**  
   - Kada više korisnika želi rezervisati isti termin, tada se termin zaključava za korisnika čiji je zahtjev prvi stigao na server
   - Kada pacijent želi rezervisati termin, ako njegov zahtjev stigne na server poslije zahtjeva drugog pacijenta, tada pacijent dobija poruku na ekranu "Žao nam je. Termin je već rezervisan. Molimo izaberite drugi"
 
### ID Storyja: US-14
**Naziv:** Reset lozinke putem emaila

---
1. **Validni podaci i link**  
    - Kada korisnik klikne na link zaboravljena lozinka ispod forme za login, ako unese ispravan mail, tada sistem šalje link za resetovanje lozinke na email
    - Kada korisnik klikne na validan link za resetovanje lozinke i promjeni lozinku, tada sistem treba zabilježiti promijenjenu lozinku i preusmjeriti ga na login formu
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
**Naziv:** Pregled sistema i statistika

1. **Pregled sistema i statistika**  
   - Kada vlasnik ili menadžer pristupi dashboard-u, tada sistem treba prikazati sve dostpne statistike
   - Sistem mora omogućiti filtriranje podataka po vremenskom periodu
2. **Registrovani korisnici (Odgovor na otvoreno pitanje)**
    - Sistem mora omogućiti prikaz broja registorvanih korisnika po ulogama u sistemu

3. **Zakazani termini (Odgovor na otvoreno pitanje)**
    - Sistem mora omogućiti prikazivanje broja zakazanih termina po svakom doktoru
    - Sistem mora omogućiti prikazivanje broja slobodnih termina
    - Sistem mora omogućiti prikazivanje zauzetosti sala po terminima
4. **Aktivnost zaposlenih (Odgovor na otvoreno pitanje)**
    - Sistem mora prikazivati informaciju ko je zakazao termin i kada
    - Sistem mora prikazati informaciju ko je otkazao termin i kada
5. **Pravo pristupa**
    - Sistem ne smije dozvoliti pristup pregledu statistika korisnicima koji nemaju ulogu vlasnika ili menadžera
    
6. **Ažuriranje podataka podataka (Odgovor na otvoreno pitanje)**
   - Sistem mora omogućiti da se podaci ažuriraju svakih 5 minuta dok rezervacije kod specijaliste moraju biti ažurirane u realnom vremenu


### ID Storyja: US-17
**Naziv:** Automatska odjava

1. **Pokretanje timeout (Odgovor na otvoreno pitanje)**
    - Kada korisnik nije aktivan više od 15 minuta na svom korisničkom profilu, tada sistem treba da pokrene automatsku odjavu korisnika 
    - Korisnik treba dobiti obavijest na ekranu "Biti ćete odjavljeni s vašeg profila za 2 minute"
    - Korisnik na obavijesti koja se pojavi na ekranu mora imati 2 dugmeta sa opcijama "Otkaži" i "Produži sesiju"
2. **Odjava**
    - Sistem mora omogućiti preusmjeravanja korisnika na login formu nakon 15 minuta neaktivnosti
  
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





   



 
