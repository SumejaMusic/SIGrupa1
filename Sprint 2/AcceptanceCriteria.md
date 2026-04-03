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
     
