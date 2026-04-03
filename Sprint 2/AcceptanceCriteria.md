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
