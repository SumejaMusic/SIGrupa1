# Architecture Overview

Za arhitekturalni stil odabrana je monolitna arhitektura. Ovakav pristup odabran je iz razloga što je riječ o sistemu namijenjenom za jednu bolnicu, sa međusobno usko povezanim modulima, zbog čega kompleksnost mikroservisne arhitekture ne bi bila opravdana. 

Sistem je interno dizajniran kroz tri različita sloja:
1. Prezentacijski sloj (frontend), razvijen u Reactu, koji obuhvata korisnički interfejs kroz koji pacijenti, doktori, medicinsko osoblje i administrator pristupaju sistemu putem web preglednika
2. Poslovni sloj (backend), implementiran u Node.js/Express, koji je odgovoran za izvršavanje cjelokupne poslovne logike sistema, uključujući upravljanje rezervacijama, kontrolu pristupa zasnovanu na ulogama (RBAC), validaciju termina, i upravljanje sesijama putem JWT tokena
3. Sloj podataka (baza podataka), implementiran u PostgreSQL, koji osigurava trajno čuvanje i upravljanje podacima o korisnicima, terminima, i medicinskim podacima

Komunikacija između prezentacijskog i poslovnog sloja odvija se putem REST API-ja. Frontend šalje HTTP zahtjeve backendu, backend izvršava poslovnu logiku i komunicira sa bazom podataka te vraća odgovor frontendu. 

## Glavne komponente sistema

### Prezentacijski sloj
Frontend razvijen u Reactu, korisnički interfejs za sve uloge (pacijent, doktor, medicinsko osoblje, administrator) 

### Poslovni sloj
Modul za autentifikaciju i autorizaciju, modul za upravljanje terminima, modul za notifikacije, sigurnosni mehanizmi sistema, modul za upravljanje korisnicima i administraciju, modul za medicinske podatke i historiju pacijenata,
modul za menadžment i statistiku

### Sloj podataka
Relacijska baza podataka (PostgreSQL)

## Odgovornosti komponenti
**Frontend**: korisnički interfejs kroz koji pacijenti, doktori, medicinsko osoblje i administrator pristupaju sistemu putem web preglednika. Svaki korisnik vidi isključivo funkcije i podatke koji odgovaraju njegovoj ulozi.

**Modul za autentifikaciju i autorizaciju**: odgovoran je za registraciju i prijavu korisnika, dvofaktorsku autentifikaciju, automatsku odjavu nakon perioda neaktivnosti, reset lozinke putem emaila, blokiranje naloga nakon pet neuspješnih pokušaja prijave te kontrolu pristupa zasnovanu na ulogama gdje svaki korisnik ima pristup isključivo funkcijama koje odgovaraju njegovoj ulozi.

**Modul za upravljanje terminima**: odgovoran je za prikaz dostupnih doktora i termina, rezervaciju i otkazivanje termina od strane pacijenta i medicinskog osoblja.

**Modul za notifikacije**: odgovoran je za slanje email potvrde nakon uspješne rezervacije, obavještavanje pacijenata o otkazivanju termina te slanje automatskih podsjetnika pacijentima sa hroničnim oboljenjima. 

**Sigurnosni mehanizmi sistema**: odgovoran je za enkripciju osjetljivih zdravstvenih podataka, vođenje audit loga svih aktivnosti u sistemu, osiguranja integriteta podataka u bazi, te backup i oporavak podataka. 

**Modul za upravljanje korisnicima i administraciju**: odgovoran je za registraciju novih pacijenata i doktora od strane administratora, upravljanje korisničkim nalozima, i upravljanje radnim vremenom doktora.

**Modul za medicinske podatke i historiju pacijenata**: odgovoran je za čuvanje i prikaz historije pregleda pacijenata, upload i evidenciju nalaza u PDF formatu, omogućavanje uvida u napomene i komentare unesene prilikom zakazivanja termina, te označavanje hitnosti prijavljenog termina.

**Modul za menadžment i statistiku**: odgovoran je za prikaz statistika zakazanih pregleda, praćenje iskorištenosti kapaciteta i radnog vremena doktora, te export statistike u CSV formatu.

**Baza podataka**: omogućava trajno čuvanje podataka o korisnicima, terminima, nalazima. Ključni entiteti koje baza čuva su: korisnici (pacijenti, doktori, medicinsko osoblje, administrator) sa njihovim ulogama, termini sa vremenskim oznakama, doktori, te medicinski podaci pacijenata kao što su dijagnoza, medicinska historija i sl. Integritet podataka osiguran je primarnim i stranim ključima između entiteta, a osjetljivi medicinski podaci se čuvaju u enkriptovanom obliku. 

## Tok podataka i interakcija

### Autentifikacijski tok
1. Korisnik pristupa web aplikaciji putem prezentacijskog sloja
2. Korisnik unosi email i lozinku, frontend šalje POST zahtjev modulu za autentifikaciju
3. Modul za autentifikaciju provjerava postoji li korisnik u sloju podataka te upoređuje lozinku sa hashiranom vrijednošću
4. Ako podaci nisu ispravni, modul bilježi neuspješan pokušaj, nakon 5 neuspješnih pokušaja nalog se blokira
5. Ako su podaci ispravni i aktivirana je 2FA, modul za autentifikaciju poziva modul za notifikacije koji šalje jednokratni kod na korisnikov email
6. Nakon uspješne verifikacije, modul za autentifikaciju generiše JWT token i vraća ga frontendu
7. Frontend koristi token za autentifikaciju narednih zahtjeva
8. Nakon perioda neaktivnosti token ističe, modul za autentifikaciju poništava sesiju i frontend preusmjerava korisnika na stranicu za prijavu

### Tok rezervacije termina
1. Pacijent pristupa modulu za upravljanje terminima, frontend šalje GET zahtjev backendu koji dohvata listu dostupnih doktora i termina iz baze podataka
2. Pacijent odabira doktora, termin i unosi razlog pregleda, frontend šalje POST zahtjev backendu 
3. Modul za upravljanje terminima provjerava dostupnost i privremeno zaključava termin, tako da drugi korisnici ne mogu izvršiti rezervaciju u istom trenutku.
4. Nakon validacije podataka, rezervacija se pohranjuje u bazu podataka
5. Modul za sigurnost bilježi aktivnost u audit logu.
6. Backend poziva modul za notifikacije koji šalje email potvrdu pacijentu
7. Ako pacijent ne dovrši rezervaciju u roku od 2 minute, modul za upravljanje terminima automatski oslobađa zaključavanje u bazi podataka

### Tok slanja notifikacija
1. Okidač za notifikaciju nastaje kao rezultat akcije u sistemu, tj. uspješna rezervacija, otkazivanje termina ili automatski podsjetnik za hroničnog bolesnika
2. Backend prosljeđuje zahtjev modulu za notifikacije sa relevantnim podacima
3. Modul za notifikacije formira odgovarajući email sadržaj i šalje ga putem eksternog email servisa
4. U slučaju neuspjelog slanja, sistem bilježi grešku u audit logu

## Ključne tehničke odluke

**REST API za komunikaciju između slojeva**: komunikacija između prezentacijskog i poslovnog sloja odvija se putem REST API-ja, što osigurava jasno razdvajanje slojeva i omogućava jednostavno proširenje sistema u budućnosti. 

**React kao frontend framework**: za razvoj prezentacijskog sloja odabran je React zbog komponentne arhitekture pogodne za višerolni interfejs, te zaštite ruta zasnovane na ulogama putem React Routera.

**JWT tokeni za upravljanje sesijama**: JSON Web Tokeni omogućavaju stateless autentifikaciju, što znači da server ne mora čuvati stanje sesije, a svaki zahtjev nosi sve potrebne informacije za autorizaciju

**Kontrola pristupa zasnovana na ulogama (RBAC)**: svaki korisnik sistema ima dodijeljenu ulogu (pacijent, doktor, medicinsko osoblje, administrator) i može pristupiti isključivo funkcijama koje odgovaraju toj ulozi, čime se osigurava zaštita osjetljivih medicinskih podataka

**Hashiranje lozinki**: lozinke se nikada ne pohranjuju u plain-text obliku već kao jednosmjerni hash, čime se osigurava da čak ni administratori sistema ne mogu vidjeti originalne lozinke

**Dvofaktorska autentifikacija (2FA)**: dodatni sloj zaštite prilikom prijave, sistem šalje jednokratni kod na korisnikov mail

**Enkripcija osjetljivih zdravstvenih podataka**: svi osjetljivi podaci kao što su JMBG, broj zdravstvene knjižice, dijagnoza, i medicinska historija se enkriptuju prije pohrane u bazu podataka, čime se osigurava zaštita privatnosti pacijenata

**Audit log**: sve akcije i izmjene u sistemu se bilježe u audit logu pri čemu svaki zapis sadrži ID korisnika, tip akcije, stari i novi podatak, i vremensku oznaku, što je važno radi sigurnosti i transparentnosti, te u slučaju sigurnosnog incidenta ili spora pomoću audit loga moguće je rekonstruisati tok događaja.

**Automatska odjava nakon perioda neaktivnosti**: sesija korisnika automatski ističe nakon perioda neaktivnosti, čime se smanjuje rizik od neovlaštenog pristupa

**Zaključavanje termina na 2 minute**: kako bi se spriječile duple rezervacije pri istovremenim zahtjevima više korisnika, uvodi se mehanizam privremenog zaključavanja dok jedan korisnik dovršava rezervaciju

**Relacijska baza podataka (PostgreSQL)**: za pohranu podataka koristi se PostgreSQL, jer omogućava osiguravanje integriteta podataka putem primarnih i stranih ključeva, te podržava ACID transakcije neophodne za konzistentno zaključavanje termina

## Ograničenja i rizici arhitekture

**Buffer zona od 2 minute**: ukoliko server padne u trenutku dok je termin zaključan, postoji rizik da se zaključavanje ne oslobodi na vrijeme, što bi privremeno onemogućilo rezervaciju tog termina

**Ovisnost o eksternom mail servisu**: pouzdanost svih notifikacija direktno ovisi o dostupnosti eksternog servisa za slanje emailova, te u slučaju nedostupnosti tog servisa pacijenti ne dobivaju potvrde niti podsjetnike

**Skalabilnost monolitne arhitekture**: u slučaju značajnog porasta broja korisnika ili proširenja sistema na više bolnica, monolitna arhitektura mogla bi postati ograničavajuća

**Rizik prekida rada sistema tokom implementacije izmjena**: monolitne aplikacije deployaju se kao jedna cjelina, što znači da svaki restart sistema utiče na cijelu aplikaciju. To može rezultirati kratkotrajnim prekidom rada sistema, što direktno utiče na korisnike i dostupnost sistema u radnom vremenu klinike


## Otvorena pitanja

1. Koje metode dvofaktorske autentifikacije će biti podržane?
2. Potrebno je dodatno razmotriti način implementacije real-time ažuriranja rasporeda doktora?
3. Je li potrebno definisati fallback mehanizam u slučaju pada sistema tokom zaključavanja termina?
4. Koji eksterni email servis će biti korišten za slanje notifikacija?
5. Koji će biti maksimalni period čuvanja audit log zapisa?
6. Treba li backup baze biti automatizovan i koliko često?
7. Koji će biti period neaktivnosti nakon kojeg se sesija automatski gasi?
