# Use Case Model

# UC-01: Rezervacija termina kod doktora

## 1. Akter
**Pacijent**

## 2. Naziv use case-a
**Rezervacija termina kod doktora**

## 3. Kratak opis
Proces omogućava pacijentu da pregleda slobodne termine kod izabranog doktora i izvrši digitalnu rezervaciju kako bi osigurao pregled bez čekanja.

## 4. Preduslovi
- Pacijent je uspješno prijavljen na sistem 
- Postoje definisani slobodni termini u radnom vremenu doktora
- Pacijent nema već rezervisan termin u isto vrijeme kod drugog doktora

## 5. Glavni tok
1. Pacijent pretražuje doktore po imenu ili specijalnosti  
2. Sistem prikazuje listu doktora  
3. Pacijent bira doktora i sistem otvara njegov interaktivni kalendar  
4. Pacijent bira slobodan termin  
5. Sistem zaključava termin na 2 minute kako bi spriječio duple rezervacije  
6. Pacijent popunjava obavezna polja i opcionalni komentar/napomenu  
7. Pacijent klikne na **"Potvrdi"**  
8. Sistem upisuje termin u bazu kao **"ZAKAZAN"** i šalje email potvrdu  

## 6. Alternativni tokovi

**A1: Termin je već zauzet**  
Ako je drugi korisnik prvi kliknuo na termin, sistem prikazuje poruku:  
> "Žao nam je. Termin je već rezervisan"

**A2: Istek vremena (Buffer zona)**  
Ako pacijent ne potvrdi termin u roku od 2 minute, sistem oslobađa termin i vraća pacijenta na početni ekran uz poruku o isteku vremena.

**A3: Dupla rezervacija**  
Ako pacijent već ima termin u to vrijeme, sistem blokira potvrdu uz poruku:  
> "Već imate rezervisan termin u ovo vrijeme"

**A4: Neispravni podaci**  
Ako pacijent ne popuni obavezna polja, sistem prikazuje upozorenje i ne dozvoljava spašavanje podataka.

## 7. Ishod
- Termin je evidentiran u bazi pod statusom **"ZAKAZAN"**  
- Pacijent je primio email sa detaljima (datum, vrijeme, doktor)  
- Termin više nije vidljiv kao slobodan za druge korisnike  

---

# UC-02: Prijava na sistem

## 1. Akter
**Korisnik** (Pacijent, Doktor, Medicinsko osoblje ili Administrator)

## 2. Naziv use case-a
**Prijava na sistem (Login)**

## 3. Kratak opis
Proces omogućava korisniku siguran pristup aplikaciji putem email adrese i lozinke, uz opcionalnu dvofaktorsku autentifikaciju (2FA) za dodatnu zaštitu podataka.

## 4. Preduslovi
- Korisnik ima kreiran i aktivan nalog u bazi podataka  
- Sistem je dostupan i funkcionalan (Uptime 99%)  
- Lozinka korisnika je prethodno heširana u bazi (AES-256)  

## 5. Glavni tok
1. Korisnik unosi svoju email adresu i lozinku na login formi  
2. Sistem vrši validaciju formata email adrese  
3. Sistem provjerava unesene podatke u bazi   
4. Sistem evidentira uspješnu prijavu u audit log  
5. Sistem preusmjerava korisnika na odgovarajući dashboard na osnovu njegove uloge  
6. Prijava se završava  

## 6. Alternativni tokovi

**A1: Pogrešni podaci**  
Ako korisnik unese pogrešan email ili lozinku, sistem prikazuje poruku:  
> "Pogrešan email ili lozinka"

**A2: Blokada naloga**  
Ako korisnik unese pogrešnu lozinku 5 puta zaredom, sistem automatski blokira nalog i šalje email obavještenja vlasniku.

**A3: Dvofaktorska autentifikacija (2FA)**  
Ako korisnik ima aktiviran 2FA, sistem nakon ispravne lozinke šalje jednokratni kod na email. Korisnik mora unijeti kod u roku od 5 minuta da bi pristupio aplikaciji.

**A4: Zaboravljena lozinka**  
Korisnik bira opciju **"Zaboravljena lozinka"** i sistem mu šalje link za resetovanje koji važi 10 minuta.

**A5: Detekcija neobičnog ponašanja**  
Na 3. neuspješnom pokušaju, sistem prikazuje upozorenje o preostala 2 pokušaja prije blokade.

## 7. Ishod
- Korisnik je uspješno autorizovan i ima pristup funkcijama koje odgovaraju njegovoj ulozi (RBAC)  
- Kreirana je aktivna korisnička sesija koja će isteći nakon 15 minuta neaktivnosti  
- U bazi je zabilježeno vrijeme i ID korisnika koji je pristupio sistemu 

---

# UC-03: Upravljanje radnim vremenom i dužinom termina

## 1. Akter
- **Administrator** (Glavni akter koji vrši izmjene)  
- **Doktor** (Sekundarni akter koji šalje upite za promjenu)  

## 2. Naziv use case-a
**Upravljanje radnim vremenom i dužinom termina**

## 3. Kratak opis
Proces omogućava administratoru da definiše i mijenja radno vrijeme doktora, dok doktor može slati formalne upite za promjenu dužine trajanja pregleda kako bi se sistem uskladio sa stvarnim stanjem u ustanovi.

## 4. Preduslovi
- Administrator i doktor su prijavljeni na sistem sa odgovarajućim ulogama  
- Doktor je prethodno registrovan u sistemu  
- Sistem ima definisane trenutne termine i njihovo trajanje  

## 5. Glavni tok
1. Administrator bira doktora iz liste registrovanih zaposlenika  
2. Sistem prikazuje trenutni kalendar i radno vrijeme izabranog doktora  
3. Administrator unosi novo radno vrijeme (početak i kraj smjene)  
4. Sistem automatski proverava da li u novom terminu već postoje rezervisani pacijenti  
5. Administrator potvrđuje izmjene klikom na dugme **"Potvrdi"**  
6. Sistem ažurira kalendar u realnom vremenu i on postaje vidljiv pacijentima  
7. Sistem evidentira promjenu u audit log (ko je izmijenio i kada)  

## 6. Alternativni tokovi

**A1: Postojeći zakazani termini**  
Ako administrator pokuša promijeniti radno vrijeme u periodu u kojem već postoje zakazani pacijenti, sistem blokira akciju i prikazuje poruku:  
> "Nije moguće promijeniti radno vrijeme. Doktor ima rezervisane termine u ovom periodu"

**A2: Upit doktora za promjenu dužine termina**  
Doktor šalje upit za promjenu trajanja pregleda uz obrazloženje. Administrator prima notifikaciju, pregleda upit i može ga odobriti ili odbiti.

**A3: Preklapanje kod promjene dužine**  
Ako bi nova dužina termina (npr. sa 15 na 30 minuta) izazvala preklapanje sa već rezervisanim pacijentima, sistem ne dozvoljava promjenu.

**A4: Neovlašteni pristup**  
Ako doktor pokuša direktno promijeniti svoje radno vrijeme (bez administratora), sistem mu to onemogućava.

## 7. Ishod
- Novo radno vrijeme je sačuvano u bazi podataka  
- Kalendar doktora je ažuriran i dostupan pacijentima za nove rezervacije  
- Doktor prima notifikaciju o statusu svog upita (odobreno/odbijeno)  

---