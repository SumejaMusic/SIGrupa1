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

## 4. Glavne implementirane funkcionalnosti
### 4.1. Registracija i upravljanje korisnicima

SwiftMed sistem podržava centralizovani model upravljanja korisnicima u okviru zdravstvene ustanove, pri čemu se svi korisnici kreiraju i kontrolišu kroz definisane procese registracije i administracije. Pacijenti imaju mogućnost samostalne registracije putem javnog registracijskog endpointa, čime se automatski kreira korisnički nalog i inicijalni medicinski profil. Nakon registracije, sistem šalje verifikacioni email sa vremenski ograničenim linkom koji je neophodan za aktivaciju naloga.

Ostale korisničke uloge, uključujući doktore, medicinsko osoblje, administratore i menadžment, kreiraju se isključivo putem administratorskog panela. Administrator ima potpunu kontrolu nad korisničkim nalozima, uključujući dodjelu uloga, izmjenu podataka, blokiranje i reaktivaciju naloga. Sistem implementira sigurnosni mehanizam koji ograničava prijavu nakon određenog broja neuspješnih pokušaja, čime se sprječava neovlašten pristup.

### 4.2. Zakazivanje i upravljanje terminima

Centralna funkcionalnost sistema predstavlja upravljanje medicinskim terminima, koje omogućava pacijentima pregled dostupnih doktora i slobodnih termina u realnom vremenu. Proces zakazivanja implementiran je kao višekorak workflow koji vodi korisnika kroz izbor odjela, doktora, tipa pregleda, termina i konačnu potvrdu rezervacije.

Tokom procesa rezervacije sistem provodi automatsku validaciju dostupnosti termina kako bi se spriječilo preklapanje ili duple rezervacije. Svaki termin ima jasno definisan status koji se ažurira u realnom vremenu, čime se obezbjeđuje konzistentan prikaz rasporeda svim korisnicima sistema. Pacijenti imaju mogućnost otkazivanja budućih termina, pri čemu se status termina automatski ažurira i oslobađa za druge korisnike.

### 4.3. Upravljanje rasporedima doktora

Doktori u sistemu imaju pristup personalizovanom kalendaru koji prikazuje sve zakazane preglede, organizovane po dnevnom, sedmičnom i mjesečnom prikazu. Svaki termin sadrži detaljne informacije o pacijentu, tipu pregleda i statusu rezervacije.

Sistem omogućava doktorima da upravljaju tokom pregleda kroz ažuriranje statusa termina, kao i unos medicinskih podataka nakon završenog pregleda. U okviru završetka pregleda doktor unosi dijagnozu, terapiju i eventualne recepte, čime se formira kompletan medicinski zapis pacijenta. Nakon završetka, termin prelazi u finalni status i postaje dio trajne historije pregleda.

### 4.4. Administracija sistema i upravljanje resursima

Administratorski panel predstavlja centralnu tačku upravljanja sistemom i omogućava potpunu kontrolu nad korisnicima, terminima i organizacionim strukturama. Administrator ima mogućnost kreiranja i izmjene korisničkih naloga, upravljanja ulogama, kao i blokiranja pristupa sistemu.

Pored upravljanja korisnicima, administrator definiše i održava strukturu zdravstvene ustanove, uključujući odjele, rasporede doktora i osnovne sistemske konfiguracije. Također ima uvid u sve aktivne i završene termine, kao i mogućnost intervencije u slučaju konflikata ili nepravilnosti u rasporedu.

### 4.5. Medicinsko osoblje i operativni pregled

Medicinsko osoblje ima ulogu operativne podrške unutar sistema i koristi poseban panel za pregled svih zakazanih termina i rasporeda doktora. Ova uloga nema mogućnost direktnog mijenjanja medicinskih podataka ili upravljanja terminima, već služi za nadzor i logističku podršku.

Kroz svoj panel medicinsko osoblje može pratiti zauzetost resursa, pregledati raspored po odjelima i osigurati nesmetan tok rada unutar ustanove. Time se omogućava bolja koordinacija između različitih dijelova sistema.

### 4.6. Anonimno ocjenjivanje pregleda

Nakon završenog medicinskog pregleda, sistem automatski generiše jedinstveni anonimni link za ocjenjivanje doktora. Pacijent putem tog linka može ocijeniti kvalitet usluge koristeći sistem zvjezdica i opcionalni komentar.

Ocjenjivanje je potpuno anonimno, pri čemu doktor nema uvid u identitet pacijenta koji je ostavio ocjenu. Svaki link je vremenski ograničen i može se iskoristiti samo jednom, čime se osigurava validnost i integritet povratnih informacija.

### 4.7. Notifikacije i komunikacija

SwiftMed implementira sistem notifikacija koji omogućava pravovremeno informisanje korisnika o svim važnim događajima u sistemu. Notifikacije se generišu prilikom kreiranja, otkazivanja ili izmjene termina, kao i nakon završetka medicinskog pregleda.

Korisnici imaju pristup notifikacijskom centru gdje mogu pregledati sve poruke, označiti ih kao pročitane i navigirati direktno na povezane termine. Pored in-app notifikacija, sistem šalje i email obavijesti kako bi se osigurala dodatna pouzdanost komunikacije.

### 4.8. Sigurnosni mehanizmi sistema

Sistem implementira više nivoa sigurnosnih mehanizama kako bi se zaštitili korisnički podaci i spriječio neovlašten pristup. To uključuje email verifikaciju pri registraciji, kontrolu pristupa na osnovu korisničkih uloga, automatsku odjavu nakon perioda neaktivnosti i blokiranje naloga nakon sumnjivih aktivnosti.

Dodatno, svi osjetljivi podaci se obrađuju kroz server-side validaciju, čime se osigurava integritet podataka i sprječava manipulacija sa klijentske strane.

### 4.9. Pretraga i filtriranje podataka

Sistem omogućava napredno pretraživanje i filtriranje termina, doktora i korisnika, u zavisnosti od korisničke uloge. Administratori i medicinsko osoblje imaju pristup proširenim filterima koji uključuju pretragu po datumu, statusu termina, doktoru i odjelu.

Svi upiti su optimizovani kroz paginaciju rezultata, čime se osigurava visoke performanse sistema čak i pri velikom broju zapisa.

### 4.10. Izvještaji i pregled sistema

Menadžment u sistemu ima pristup agregiranim podacima i statističkim prikazima koji omogućavaju analizu rada zdravstvene ustanove. Ovi podaci uključuju broj zakazanih i završenih pregleda, zauzetost doktora, stopu otkazivanja i druge ključne metrike.

Podaci su prikazani kroz grafičke i tabelarne prikaze, čime se omogućava lakše donošenje odluka na osnovu stvarnih podataka iz sistema.

## 5. Pregled rada kroz sprintove

Razvoj SwiftMed sistema bio je organizovan kroz iterativni Scrum proces u kojem je svaki sprint imao jasno definisane ciljeve, fokus i isporuke, od inicijalne analize i planiranja do definisanja arhitekture i tehničkih temelja sistema.
### Sprint 1 — Analiza i planiranje
U Sprintu 1 fokus je bio na analizi problema i definisanju osnovnih projektnih artefakata. Tim je uspostavio zajedničko razumijevanje sistema kroz Product Vision, Stakeholder Map i Team Charter dokumente, čime su definisani ciljevi projekta, ključni akteri i pravila rada unutar tima. Također je kreiran inicijalni Product Backlog koji je sadržavao osnovne funkcionalne zahtjeve sistema, pri čemu je identifikovana određena neusklađenost između vizije i backloga, što je definisano kao osnova za dalju razradu.
### Sprint 2 — Razrada zahtjeva i prioriteta
Usmjeren na detaljnu razradu zahtjeva i njihovu prioritizaciju, kao i na definisanje sigurnosnih i nefunkcionalnih aspekata sistema. Sve backlog stavke su razrađene u user stories sa jasno definisanim acceptance kriterijima, čime je omogućena kasnija provjerljivost implementacije. Paralelno su definisani ključni nefunkcionalni zahtjevi poput sigurnosti, performansi i skalabilnosti. U ovoj fazi izrađen je Risk Register, izvršeno modeliranje domene i use case scenarija, te definisan osnovni arhitektonski pravac sistema zajedno sa Test Strategy dokumentom.
### Sprint 3 — Arhitektura sistema i tehnički setup
Sprint 3 predstavljao je tehničku i arhitektonsku konsolidaciju sistema. U ovoj fazi definisana je osnovna arhitektura aplikacije i uspostavljen tehnički skeleton projekta, zajedno sa strukturom repozitorija i standardima razvoja. Paralelno je izrađen Definition of Done dokument koji definiše kriterije kvaliteta za sve nivoe razvoja, kao i Initial Release Plan koji određuje prioritete i faze isporuke funkcionalnosti. Sprint je završen validacijom osnovnih projektnih odluka, čime je potvrđena spremnost sistema za prelazak u fazu implementacije.
### Sprint 4 — Tehnička stabilizacija i priprema za implementaciju
Sprint 4 je bio usmjeren na završno usklađivanje projektnih standarda i postavljanje stabilne osnove za početak implementacije sistema. U ovoj fazi definisan je Definition of Done dokument koji uvodi jasne kriterije završetka zadataka i user story-ja, čime se osigurava konzistentan kvalitet isporuke kroz sve naredne sprintove.
Pored toga, izrađen je Initial Release Plan koji organizuje razvoj funkcionalnosti po verzijama i definiše realne prioritete i vremenski okvir isporuke u skladu s kapacitetom tima i stanjem Product Backlog-a.

Na tehničkom nivou uspostavljen je inicijalni skeleton sistema zajedno sa osnovnom strukturom repozitorija i dogovorenim pravilima rada unutar tima, čime je postavljena stabilna arhitektonska i organizaciona osnova za dalji razvoj.
Sprint je završen finalnom provjerom spremnosti projekta za implementaciju, pri čemu je potvrđeno da su svi ključni poslovni, tehnički i organizacioni elementi usklađeni i spremni za ulazak u narednu fazu razvoja.
### Sprint 5 — Implementacija osnovnog rezervacijskog sistema(Release 1)

Sprint 5 je bio usmjeren na implementaciju osnovnog end-to-end toka rezervacije termina i uspostavljanje prve funkcionalne verzije sistema. Cilj je bio omogućiti kompletan proces rezervacije od pregleda doktora i termina do kreiranja i otkazivanja rezervacija.

U ovoj fazi implementirane su ključne funkcionalnosti poput pregleda dostupnih doktora i termina, kreiranja rezervacije kroz definisani flow te otkazivanja termina od strane pacijenta. Uspostavljena je API komunikacija između frontend i backend dijela sistema, kao i osnovne CRUD operacije nad terminima i rezervacijama.
### Sprint 6 - Završetak Release 1 (Rezervacijski sistem)
U ovom sprintu fokus je bio na završetku kompletnog procesa rezervacije termina i stabilizaciji sistema za realnu upotrebu. Cilj je bio omogućiti pacijentu da u potpunosti prođe tok: pregled dostupnih doktora i termina, rezervacija, potvrda i otkazivanje, uz real-time ažuriranje i zaštitu od konflikata u podacima.
Poseban naglasak stavljen je na pouzdanost sistema (ACID transakcije), sprječavanje duplih rezervacija kroz buffer zonu, te real-time sinhronizaciju rasporeda.

#### Implementirane funkcionalnosti

U sprintu je uspješno isporučen kompletan rezervacijski sistem:

- pregled doktora i slobodnih termina u realnom vremenu
- kreiranje rezervacije uz validaciju i zaštitu od dupliranja
- otkazivanje termina (pacijent i medicinsko osoblje)
- komentar uz rezervaciju
- email potvrde (zamjena za Nodemailer implementirana kroz Resend)
- upload i pregled PDF nalaza
- WebSocket real-time ažuriranje rasporeda
- buffer zona od 2 minute za zaključavanje termina
- E2E testiranje kompletnog toka

### Sprint 7 — Autentifikacija i sigurnosni sloj (Release 4)

Implementiran kompletan sigurnosni sistem aplikacije: JWT login, RBAC, 2FA, enkripciju podataka i audit log. Sistem omogućava sigurno prijavljivanje, kontrolu pristupa po ulogama i zaštitu osjetljivih podataka.

#### Implementirano:
- JWT login sistem sa RBAC redirekcijom
- 2FA autentifikacija putem emaila
- reset lozinke (email link)
- automatska odjava zbog neaktivnosti
- blokiranje naloga nakon 5 neuspješnih pokušaja
- AES-256 enkripcija osjetljivih podataka + bcrypt hashiranje
- audit log svih akcija
- konfigurisan RBAC (4 uloge)
- kompletno testiran sigurnosni tok

### Sprint 8 — Personalizovani paneli i role routing


Završena implementacija korisničkih panela za sve uloge u sistemu te omogućena role-based routing nakon prijave, kako bi svaki korisnik bio automatski usmjeren na odgovarajući interfejs.
#### Implementirano
implementirana prijava korisnika (US-03)
- implementiran osnovni role-based routing nakon login-a
- postavljeni osnovni paneli za sve korisničke uloge (UI struktura)
- prikaz početne organizacije dashboarda za doktora i medicinsko osoblje
- pripremljena osnova za dalju nadogradnju funkcionalnih panela

#### Demonstrirane funkcionalnosti

- uspješna autentifikacija korisnika
- automatsko preusmjeravanje prema ulozi (role-based routing)
- prikaz svih korisničkih panela u osnovnoj verziji
- validna struktura frontenda spremna za dalju implementaciju logike
- 
### Sprint 9 — Proširenje sistema i automatizacija (Release 3)

U Sprintu 9 fokus je bio na proširenju korisničkih panela iz Sprinta 8 i uvođenju naprednih funkcionalnosti za automatizaciju sistema. Implementirani su dodatni moduli za doktore i medicinsko osoblje, lista čekanja, real-time prikaz podataka, SMS/email notifikacije, GDPR funkcionalnosti te AI chatbot asistent. Sprint je imao cilj da unaprijedi kompletan sistem i pripremi stabilan Release 3.

#### Završeno: 
- Proširen doktorski dashboard (kalendar, filteri, pregled rasporeda)
- Proširen panel medicinskog osoblja (real-time pretraga i trijaža hitnosti)
- Implementirano označavanje hitnosti termina (urgency level)
- Upload i evidencija laboratorijskih nalaza (sigurno skladištenje)
- SMS podsjetnici za hronične pacijente (cron job integracija)
- Lista čekanja sa automatskim dodjeljivanjem termina
- Real-time prikaz zauzetosti kabineta (WebSocket)
- GDPR modul (deaktivacija i anonimizacija profila)
- Obavijesti o promjeni termina (email + in-app)
- Sistem anonimnih ocjena i komentara
- AI chatbot asistent za korisnike
- Admin panel (frontend + backend upravljanje ulogama)
- Unit i integraciono testiranje svih novih funkcionalnosti

### Sprint 10
Sprint 10 bio je jedan od najobimnijih u projektu — svi planirani user storiji završeni su unutar sprinta, uključujući i tri nova user storija (US-45, US-46, US-NEW) koji nisu bili u originalnom backlogu.
Završeno je sljedeće:
- Implementiran admin panel za upravljanje korisnicima i ulogama (RBAC)
- Urađen audit log za praćenje svih sistemskih akcija
- Implementiran menadžment panel sa ključnim metrikama sistema
- Dodan statistički modul sa grafičkim prikazom i CSV exportom
- Implementirana GDPR funkcionalnost (deaktivacija i anonimizacija profila)
- Dodana potvrda dolaska pacijenta jednim klikom (real-time)
- Proširen medicinski profil pacijenta
- Implementirano generisanje PDF uputnica specijalistima

## 6. Šta je završeno, djelimično završeno ili nije završeno

### Završeno
- Izrađen Definition of Done dokument.
- Izrađen Initial Release Plan.
- Postavljen tehnički skeleton sistema i struktura repozitorija.
- Implementiran pregled dostupnih doktora i slobodnih termina.
- Implementirano zakazivanje termina kod odabranog doktora.
- Implementirano otkazivanje termina od strane pacijenta i medicinskog osoblja.
- Implementirane email potvrde i obavijesti o rezervacijama.
- Uvedena zaštita od duplih rezervacija.
- Implementirana buffer zona za zaključavanje termina tokom rezervacije.
- Omogućeno dodavanje komentara prilikom zakazivanja termina.
- Implementiran pregled rezervacija za doktore.
- Omogućen upload i pregled PDF nalaza.
- Implementirano real-time ažuriranje rasporeda putem WebSocket tehnologije.
- Implementiran login sistem sa JWT autentifikacijom.
- Implementiran reset lozinke putem emaila.
- Implementirana dvofaktorska autentifikacija (2FA).
- Implementirana automatska odjava nakon perioda neaktivnosti.
- Implementirano blokiranje korisničkog računa nakon više neuspješnih prijava.
- Implementirana AES-256 enkripcija osjetljivih podataka i bcrypt zaštita lozinki.
- Implementiran audit log za praćenje aktivnosti korisnika.
- Implementiran role-based access control (RBAC) sistem.
- Razvijen dashboard za doktore sa pregledom rasporeda.
- Razvijen panel medicinskog osoblja.
- Implementiran sistem označavanja hitnosti termina.
- Implementirani SMS podsjetnici za pacijente.
- Implementirana lista čekanja za termine.
- Implementiran grafički prikaz zauzetosti kabineta u realnom vremenu.
- Implementirane email i in-app obavijesti o promjenama termina.
- Omogućeno anonimno ocjenjivanje i komentarisanje rada doktora.
- Implementiran korisnički profil sa pregledom podataka.
- Razvijen AI chatbot asistent.
- Implementiran admin panel za upravljanje korisnicima i ulogama.
- Implementiran menadžment panel sa ključnim statistikama ustanove.
- Implementiran statistički modul sa grafičkim prikazom podataka.
- Omogućen izvoz statističkih podataka u CSV format.
- Implementirana GDPR funkcionalnost za deaktivaciju i anonimizaciju korisničkih profila.
- Implementirana potvrda dolaska pacijenta jednim klikom.
- Proširen medicinski profil pacijenta.
- Implementirano generisanje PDF uputnica specijalistima.
- Provedeno unit, integraciono i end-to-end testiranje sistema.
### Djelimično završeno
Nema djelimično završenih stavki.
### Nije završeno
Sve stavke navedene u Product Backlog dokumentu su završene.

## 7. Glavne tehničke odluke
Tokom razvoja bolničkog informacionog sistema donesene su ključne arhitektonske i implementacijske odluke koje su formalizovane kroz Decision Log (DEC-001 do DEC-010). Ove odluke direktno utiču na sigurnost, skalabilnost i održavanje sistema.

### DEC-001 — Platforma za deployment
Za deployment sistema odabrana je Render platforma.
Odluka je donesena zbog jednostavne integracije sa GitHub repozitorijem, podrške za backend i frontend servise, te minimalnih zahtjeva za konfiguraciju infrastrukture.
- Backend se deploya kao Web Service
- Frontend kao Static Site
- Potrebna CORS konfiguracija između servisa
- Moguć “cold start” na free tier-u

---

### DEC-002 — Baza podataka (Neon PostgreSQL)
Kao primarna baza podataka odabran je Neon PostgreSQL.

Ovo rješenje omogućava serverless pristup bazi, jednostavnu integraciju sa ORM slojem i fleksibilno skaliranje.

- DATABASE_URL konfigurisan kroz environment varijable
- SSL konekcija obavezna (`sslmode=require`)
- Baza odvojena od aplikacionog sloja

---

### DEC-003 — Privremeni hardkodirani korisnik
Zbog nedostatka implementirane autentifikacije u ranoj fazi, uveden je privremeni testni korisnik.

Ova odluka je omogućila paralelni razvoj funkcionalnosti bez blokade sistema.

- Korisnik se dohvaća iz baze (nije hardkodiran u kodu)
- Odluka je privremena i zamjenjuje se JWT autentifikacijom

---

### DEC-004 — Email notifikacije putem Resend servisa
Za slanje email notifikacija odabran je Resend servis umjesto klasičnog SMTP pristupa.

Razlog je jednostavnija integracija i stabilniji rad u produkcijskom okruženju.

- Koristi se REST API umjesto SMTP konfiguracije
- API ključ se čuva u environment varijablama
- Zavisnost od eksternog servisa (moguća latencija)

---

### DEC-005 — Promjena redoslijeda sprintova (autentifikacija)
Autentifikacija i RBAC sistem pomjereni su ranije u razvoju.

Cilj odluke bio je omogućiti validaciju sigurnosnog modela prije razvoja kompleksnih modula.

- Smanjen tehnički dug
- Omogućeno testiranje RBAC sistema
- Bolja integracija sa svim modulima

---

### DEC-006 — Odgoda automatskih podsjetnika
Funkcionalnost automatskih notifikacija prebačena je u naredni sprint.

Razlog je bolja usklađenost sa notifikacionom arhitekturom i autentifikacijom.

---

### DEC-007 — Rani razvoj admin role management-a
Funkcionalnost dodjele uloga premještena je ranije u sprint planu.

Ovo je omogućilo validaciju RBAC sistema u realnim scenarijima.

---

### DEC-008 — Proširenje Sprinta 9
Sprint 9 je proširen dodatnim funkcionalnostima vezanim za analitiku, notifikacije i korisničko iskustvo.

- Lista čekanja za termine
- Anonimizacija korisnika
- Grafička analiza zauzetosti
- Chatbot integracija
- Napredne notifikacije

---

### DEC-010 — Proširenje Sprinta 10 (medicinske funkcionalnosti)
Sprint 10 proširen je funkcionalnostima koje direktno utiču na klinički rad sistema.

- PDF uputnice specijalistima
- Real-time potvrda dolaska pacijenta
- Prošireni medicinski profil pacijenta

---

## 8. Najveći problemi tokom razvoja i rješenja

Tokom razvoja sistema identifikovani su tehnički i organizacioni problemi koji su rješavani iterativno kroz refaktoring, izmjene arhitekture i optimizaciju workflow-a.

---

### Problem 1 — Neusklađenost backlog-a i zahtjeva
U ranoj fazi razvoja backlog nije bio u potpunosti usklađen sa stvarnim poslovnim zahtjevima.

Rješenje:
- Revidiran backlog
- Uvedeni jasni prioriteti (P1/P2/P3)
- Definisani detaljni acceptance kriteriji

---

### Problem 2 — Dupliranje termina
Pojavljivala se mogućnost duplog zakazivanja termina za istog doktora.

Rješenje:
- Server-side validacija dostupnosti
- Transakcioni pristup pri kreiranju termina
- Eliminacija race condition scenarija

---

### Problem 3 — Neusklađenost autorizacije
Frontend je skrivao funkcionalnosti, ali backend nije uvijek provodio iste provjere.

Rješenje:
- Backend postavljen kao jedini izvor istine
- Centralizovani authorization middleware

---

### Problem 4 — Nevalidne statusne tranzicije
Dozvoljene su bile neispravne promjene statusa u workflow-u.

Rješenje:
- Uveden centralni workflow servis
- Definisane validne tranzicije statusa

---

### Problem 5 — Performanse pri većem opterećenju
Došlo je do usporavanja sistema pri većem broju pacijenata i termina.

Rješenje:
- Implementirana paginacija
- Optimizacija SQL upita
- Indeksiranje ključnih kolona

---

### Problem 6 — Email notifikacije u production okruženju
SMTP konfiguracija nije bila stabilna na hosting platformi.

Rješenje:
- Migracija na Resend servis
- Eliminacija SMTP zavisnosti

---

## 9. Buduća unapređenja sistema

U slučaju nastavka razvoja sistema, fokus bi bio na skalabilnosti, automatizaciji i proširenju medicinskih funkcionalnosti.

---

## Kratkoročna unapređenja

- E2E testiranje kompletnog workflow-a (Playwright)
- Uvođenje code coverage praga u CI pipeline-u
- Napredni filteri za termine i pacijente
- Real-time notifikacije putem WebSocket sistema

---

## Arhitekturna unapređenja

- Migracija medicinskih dokumenata na S3/MinIO
- Uvođenje Redis cache sloja za optimizaciju performansi
- Asinhrona obrada notifikacija putem queue sistema
- Postepeni prelazak ka microservice arhitekturi

---

## Funkcionalna proširenja

- Mobilna aplikacija za pacijente i medicinsko osoblje
- Digitalni medicinski karton sa kompletnom historijom pregleda
- Integracija sa laboratorijskim sistemima
- Napredna analitika sistema (zauzetost, čekanja, statistika)
- Inteligentni chatbot za asistenciju pacijentima

