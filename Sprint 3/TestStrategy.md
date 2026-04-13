# Test Strategy

## Cilj testiranja  

| **Cilj testiranja** | **Kriterij uspjeha** |
|---------------------|--------------------------|
|Verifikacija da sistem ne dozvoljava neovlašten pristup podacima| NFR-01: Samo vlasnik i autorizovano medicinsko osoblje mogu pristupiti historiji pregleda pacijenta. NFR-06: Korisnik smije pristupiti samo funkcijama koje odgovaraju njegovoj ulozi. AC-02-01: Korisnik bez administratorskih ovlasti je automatski preusmjeren na login stranicu. AC-32-02: Sistem odbija zahtjev i vraća grešku ako uloga korisnika nije autorizovana za traženu akciju. AC-32-03: Doktor ima pristup samo terminima i historiji pacijenata koji su rezervisali pregled kod njega.|
|Verificirati da sistem ispravno autentificira korisnike i preusmjerava ih prema ulozi  | AC-04-01: Sistem provjerava podatke u bazi i dozvoljava pristup. AC-04-02: Pacijent je preusmjeren na profil, doktor na ljekarski dashboard. AC-04-03: Ako je korisnik aktivirao 2FA, sistem nakon ispravne lozinke traži unos sigurnosnog koda prije konačnog pristupa. AC-04-05: Sistem prikazuje opštu poruku "Pogrešan email ili lozinka" i ne precizira koji je od podataka pogrešan. NFR-07: Sistem mora implementirati kontrolu pristupa zasnovanu na ulogama (RBAC).|
| Ustanoviti da sistem blokira nalog nakon 5 neuspješnih pokušaja  prijave | AC-04-04: Sistem ne dozvoljava više od 5 neuspješnih pokušaja. AC-23-01: Nalog se automatski blokira. AC-23-02: Nakon 3. pokušaja prikazuje se upozorenje "Preostala su vam još 2 pokušaja". AC-23-03: Vlasniku se šalje email obavijest o blokiranju. AC-23-04: Administrator može ručno odblokiriti nalog iz admin panela prije isteka vremena blokade. NFR-05: Sistem mora blokirati korisnika nakon 5 neuspješnih pokušaja prijave.|
|Potvrditi da sistem automatski odjavi korisnika nakon 15 minuta neaktivnosti| AC-17-01: Nakon 15 minuta prikazuje se obavijest sa opcijama "Otkaži" i "Produži sesiju". AC-17-02: Korisnik je preusmjeren na login formu. AC-17-03: Kada korisnik klikne "Produži sesiju", tajmer neaktivnosti se resetuje na 0 i obavijest se zatvara bez prekida rada. AC-17-04: Kada korisnik klikne "Otkaži", sistem ga odmah odjavljuje i preusmjerava na login formu. AC-17-05: Sesija je poništena, pristup zaštićenim stranicama sa isteklom sesijom vraća korisnika na login. NFR-13: Sesija korisnika mora automatski isteći nakon perioda neaktivnosti. NFR-14: Pokušaj pristupa sa isteklim tokenom mora vraćati grešku 401.|
|Potvrditi da su osjetljivi podaci enkriptovani i heširani| AC-24-01: Osjetljivi podaci čuvaju se enkriptovani AES-256 algoritmom. AC-24-02: Lozinke su heširane, plain-text lozinka nije vidljiva ni administratoru. AC-24-03: Backup fajlovi su enkriptovani. NFR-04: Lozinke se moraju čuvati u hashiranom i sigurnom obliku. NFR-17: Medicinski dokumenti moraju biti sigurno i trajno pohranjeni te nedostupni bez autorizacije. NFR-24: Enkripcija se primjenjuje na JMBG, broj zdravstvene knjižice, dijagnoze, nalazi i medicinska historija.|
|Potvrditi da sistem sprječava duple rezervacije| AC-12-01: Sistem vrši provjeru preklapanja u trenutku klika na termin, prikazuje poruku "Već imate rezervisan termin u ovo vrijeme". Provjera se vrši i s terminima kod drugog doktora — sistem ne dozvoljava rezervaciju koja se preklapa s bilo kojim već potvrđenim terminom, bez obzira na doktora. AC-12-02: Termin se zaključava za korisnika čiji zahtjev prvi stigne, drugi korisnik dobija poruku "Žao nam je. Termin je već rezervisan. Molimo izaberite drugi". AC-06.1-06: Sistem ne dozvoljava pacijentu rezervaciju više od jednog termina kod istog doktora u istom danu te prikazuje poruku "Nije dozvoljeno rezervisati više termina kod istog doktora u istom danu!". NFR-22: Sistem mora zaključati termin na 2 minute tokom unosa podataka kako bi se sprječile duple rezervacije.|
|Potvrditi da sistem ispravno zaključava termin na 2 minute i oslobađa ga nakon 2 minute u slučaju da se termin ne potvrdi| AC-11-01: Nakon 2 minute bez potvrde termin dobija status slobodan, korisnik dobija poruku "Vrijeme za potvrdu termina je isteklo. Molimo Vas odaberite novi termin". AC-11-02: Sistem ne dozvoljava potvrdu bez popunjenih obaveznih polja, korisnik dobija poruku "Ne smijete rezervisati termin bez popunjavanja obaveznih polja!". AC-11 (granični slučaj): Ako korisnik klikne "Potvrdi" tačno u trenutku isteka 2 minute, sistem ga vraća na početni ekran s porukom o isteku vremena. NFR-22: Buffer zona od 2 minute je kritična tačka, u slučaju pada servera postoji rizik da se termin ne oslobodi na vrijeme.|
|Potvrditi da sistem ne dozvoljava otkazivanje termina od strane pacijenta 24 h prije| AC-09-01: Sistem mijenja status termina u "OTKAZAN" i odmah oslobađa mjesto u bazi kada pacijent uspješno otkaže termin. AC-09-02: Sistem ne dozvoljava pacijentu otkazivanje ako je do pregleda ostalo manje od 24h. AC-09-04: Prije otkazivanja sistem prikazuje upit "Da li ste sigurni da želite otkazati ovaj termin?" i ne dozvoljava slučajno otkazivanje jednim klikom. AC-15-03: Korisnik dobija poruku "Rezervaciju nije moguće otkazati 24h prije".|
| Potvrditi da medicinsko osoblje može otkazati termin bilo kad uz slanje obavijesti pacijentu| AC-08-01: Osoblje odabire termin i klikne "Otkaži", sistem oslobađa mjesto u bazi. AC-08-02: Medicinsko osoblje može otkazati termin samo prije početka pregleda. AC-08-03: Sistem automatski šalje email pacijentu sa informacijom o otkazivanju i kontakt telefonom. AC-08-04: Sistem traži potvrdu "Da li ste sigurni da želite otkazati ovaj termin?". AC-08-05: Otkazani termin se odmah prikazuje kao slobodan u kalendaru. NFR-11: Email mora sadržavati detalje otkazanog termina (datum, doktor).|
|Potvrditi da pacijent dobija podsjetnik 24 h prije termina |AC-07-01: Sistem automatski šalje email potvrdu pacijentu odmah nakon uspješne rezervacije. AC-07-02: Email sadrži tačan datum i vrijeme, ime i prezime doktora i naziv odjela. AC-07-03: Sistem šalje dodatni podsjetnik 24 sata prije termina. AC-07-04: Email sadrži link za otkazivanje ili pomjeranje termina.|
| Potvrditi da pacijent dobije email prilikom otkazivanja termina| AC-09-03: Sistem automatski šalje email potvrdu pacijentu kao dokaz da je termin uredno otkazan. AC-09-05: Otkazani termin se odmah prikazuje kao slobodan u realnom vremenu za sve ostale pacijente koji vrše pretragu. AC-09-06: Na ekranu se prikazuje poruka "Vaš termin je uspješno otkazan". NFR-11: Pacijent mora biti obaviješten o otkazivanju termina putem emaila.|
|Potvrditi ispravnost prikaza historije pregleda pacijenata prilikom sortiranja, prikaza detalja pregleda i otkazanih termina| AC-01-01: Termini su sortirani od najnovijeg ka najstarijem. AC-01-02: Prikazuju se osnovni podaci (datum, ljekar, odjel), opis terapije i nalazi. AC-01-03: Otkazani termini su označeni statusom "OTKAZAN". AC-01-04: Pacijent bez pregleda dobija poruku "Trenutno nemate zabilježenih pregleda u historiji". NFR-01: Pristup historiji pregleda dozvoljen je samo vlasniku naloga i autorizovanom medicinskom osoblju.|
|Potvrditi da audit log bilježi sve akcije korisnika sa tačnim podacima i da je dostupan samo administratoru| AC-18-01: Svaki zapis sadrži ID korisnika, vrstu akcije, naziv entiteta nad kojim je akcija izvršena, datum i vrijeme, stari i novi podatak pri svakoj izmjeni, uključujući neuspješne pokušaje prijave. AC-18-02: Samo administratori imaju pravo pregleda i mogu filtrirati zapise. AC-18-03: Podaci se čuvaju minimalno 12 mjeseci. AC-18-04: Zapisi nisu izmjenjivi ni od strane administratora. NFR-08: Svaki zapis mora sadržavati stari/novi podatak i vremensku oznaku.|
|Provjeriti ispravnost unosa, prikaza, brisanja i izmjene komentara| AC-19.1-01: Doktor ne smije imati pristup komentarima termina koji nisu njegovi. AC-19.1 (prazno stanje): Ako termin nema komentara, prikazuje se poruka "Nema komentara za ovaj termin". AC-19.2-01: Komentar je sačuvan i prikazan uz detalje rezervacije, sistem ne dozvoljava više od 255 karaktera. AC-19.2-02: Izmjena i brisanje su mogući samo prije pregleda i samo od strane osobe koja je unijela komentar ili administratora. AC-19.2 (opcionalno polje): Sistem mora dozvoliti rezervaciju termina i bez unosa komentara. AC-19.1-03: Komentari su vidljivi i doktoru i pacijentu u detaljima termina. AC-19.1-04: Prikazuju se tekst komentara, ime osobe i datum unosa.|
|Verificirati da li menadžment panel ispravno prikazuje kapacitet, zauzetost doktora i sala, rezervisane i otkazane termine| AC-16-01: Prikazuje se ukupan broj registrovanih korisnika i zakazanih termina. AC-16-02: Podaci se ažuriraju u realnom vremenu. AC-16-03: Sistem ne dozvoljava pristup menadžment panelu osobama koje nemaju ulogu administratora. AC-16-04: Prikazuje se broj korisnika po ulogama. AC-16-05: Prikazuje se broj zakazanih i slobodnih termina po doktoru i zauzetost sala. AC-16-06: Prikazuje se ko je i kada zakazao ili otkazao termin. AC-16-07: Administrator može eksportovati podatke o terminima za odabrani period u CSV formatu. NFR-16: Promjene moraju biti vidljive u roku od 2 sekunde.|
|Potvrditi ispravnost procesa resetovanja lozinke putem emaila uključujući validnost linka i limit pokušaja| AC-14-01: Link je jednokratan i ne može se ponovo koristiti. AC-14-02: Link je validan 10 minuta, istekli link prikazuje poruku "Link za resetovanje je istekao". AC-14-03: Može se generisati maksimalno 3 puta u sat vremena. AC-14-04: Unos nepostojećeg maila prikazuje neutralnu poruku. AC-14 (validacija formata): Kada korisnik unese neispravan format email adrese, sistem prikazuje upozorenje "Neispravan format mail adrese!". AC-14-05: Nova lozinka mora imati minimum 8 karaktera, jedno veliko slovo i jedan broj.|
|Potvrditi ispravnost označavanja hitnih termina| AC-25-01: Osoblje može označiti termin statusom "HITNO". AC-25-02: Hitni termini su označeni crvenom bojom na dashboardu doktora i admina. AC-25-03: Oznaka hitnosti može biti dodijeljena na osnovu pacijentovog opisa simptoma ili procjene sestre pri dolasku pacijenta. AC-25-04: Oznaka nije vidljiva pacijentu. AC-19.2-03: Samo doktor može označiti termin pod "HITNO".|
|Potvrditi da neuspješne operacije ne ostavljaju bazu u nekonzistentnom stanju| NFR-12: Sistem mora osigurati da se operacije izvršavaju bez djelimičnih zapisa. AC-31-03: Sistem ne dozvoljava upisivanje termina ako pacijent ili ljekar sa tim ID-em ne postoje. NFR-19: Baza mora osigurati konzistentnost i integritet podataka kroz ograničenja foreign key, unique i not null.|
|Potvrditi da se promjene u zauzetosti termina prikazuju u realnom vremenu bez kašnjenja| AC-05-04: Rezervisani termin više nije vidljiv kao slobodan za ostale pacijente. AC-08-05: Otkazani termin se odmah prikazuje kao slobodan. AC-09-05: Otkazani termin od strane pacijenta odmah postaje dostupan svim ostalim korisnicima. NFR-09: Otkazani termini moraju odmah postati dostupni drugim korisnicima. NFR-16: Promjene moraju biti vidljive u roku od 2 sekunde bez potrebe za ručnim osvježavanjem stranice.|
|Potvrditi da sistem osigurava 99% dostupnosti u toku radnog vremena klinike| NFR-25: Sistem mora biti dostupan najmanje 99% vremena u toku radnog vremena klinike.|
|Potvrditi slanje email obavijesti nakon uspješne rezervacije| AC-07-01: Sistem automatski šalje email potvrdu nakon rezervacije. AC-07-02: Email sadrži datum, vrijeme, ime doktora i naziv odjela. AC-07-04: Email sadrži link za otkazivanje ili pomjeranje termina. NFR-11: Pacijent mora biti obaviješten putem emaila — primjenjuje se i na potvrdu rezervacije.|
|Potvrditi ispravnost eksporta podataka u CSV formatu| AC-26.2-01: Sistem generiše CSV fajl za odabrani period na zahtjev. AC-26.2-02: Pristup je dozvoljen samo administratoru. AC-26.2-03: Podaci u CSV-u su identični onima u bazi. AC-26.2-04: Podaci su pravilno razdvojeni i formatirani.|
|Potvrditi da sistem odgovara u prihvatljivom vremenu pod normalnim i povećanim opterećenjem | NFR-03: Prijava korisnika mora biti završena u roku od maksimalno 2 sekunde. NFR-10: Otkazivanje termina mora biti završeno u roku od 2–3 sekunde. NFR-15: Dashboard sistema mora se učitati u roku od maksimalno 3 sekunde. NFR-18: Admin backend mora odgovarati u roku od 2 sekunde. NFR-20: Sistem mora omogućiti brze upite nad skupom od najmanje 50.000 zapisa u bazi podataka.|
 
## Nivoi testiranja

| Nivo testiranja | Cilj | Odgovorna osoba | Alati | Frekvencija | Ulazni kriteriji | Izlazni kriteriji | Kriterij prihvaćanja |
|-----------------|------|-----------------|-------|-------------|------------------|-------------------|----------------------|
|Unit testiranje| Validacije podataka, vremenskih ograničenja (60 dana, 24h, 2 minute, 10 minuta), logike brojača neuspješnih pokušaja prijave, provjere preklapanja termina, heširanja lozinki i provjere uloga pri označavanju hitnosti termina| Programer| /|Pri svakoj izmjeni koda| Implementirana funkcionalnost, dostupan izvorni kod, definisani ulazni i očekivani izlazni podaci| Svi unit testovi prolaze, pokrivenost koda minimalno 60%, nema kritičnih grešaka u poslovnoj logici| 100% unit testova prolazi bez grešaka|
| Integraciono testiranje | API endpointi ispravno komuniciraju s bazom podataka, email servis šalje obavijesti nakon rezervacije i otkazivanja, audit log bilježi sve akcije s tačnim podacima | QA inženjer | Postman, Mailtrap | Nakon integracije novih komponenti i prije sistemskog testiranja | Uspješno završeno unit testiranje, dostupno testno okruženje s bazom podataka | Svi API endpointi vraćaju ispravne odgovore, email obavijesti isporučene s tačnim sadržajem | 95% integracionih testova prolazi, rezervacija, otkazivanje, login rade bez grešaka |
| Sistemsko testiranje | Verificirati kompletne end-to-end tokove kroz cijelu aplikaciju za sve 4 uloge: tok zakazivanja i otkazivanja termina, tok automatske odjave i blokiranja naloga, tok reset lozinke, tok označavanja hitnosti, tok upravljanja radnim vremenom, tok uploada nalaza, granične slučajeve duplih rezervacija i isteka zaključavanja termina | QA inženjer | Ručno testiranje prema testnim scenarijima (mozda koristiti Selenium)| Nakon završenog integracionog testiranja, prije ostalih vrsta testiranja | Uspješno završeno integraciono testiranje, stabilno testno okruženje, pripremljeni testni scenariji i podaci za sve uloge | Svi end-to-end scenariji su testirani, kritične funkcionalnosti rade ispravno za sve 4 uloge, granični slučajevi se obrađuju s ispravnim porukama | 95% sistemskih testova prolazi |
| UI testiranje | Verificirati ispravnost vizuelnog prikaza i korisničkog interfejsa: prikaz poruka greške na ispravnom mjestu, vizuelna razlika između slobodnih i zauzetih termina u kalendaru, crvena oznaka za hitne termine na dashboardu doktora i admina, preglednost dashboarda za svaku ulogu, prikaz statusa "OTKAZAN" u historiji pregleda, prikaz obavijesti pri automatskoj odjavi | QA inženjer | Ručno testiranje, Chrome DevTools | Nakon završenog sistemskog testiranja, paralelno sa sigurnosnim i testiranjem kompatibilnosti | Stabilno testno okruženje, završeno sistemsko testiranje, pripremljeni UI testni scenariji | Svi UI elementi prikazuju se ispravno, poruke su vidljive i jasne korisniku, boje i statusi odgovaraju specifikaciji | 90% UI testova prolazi, nema vizuelnih grešaka na kritičnim ekranima |
| Sigurnosno testiranje | Verificirati zaštitu sistema od neovlaštenog pristupa i izloženosti osjetljivih podataka: RBAC provjera za sve rute i uloge, provjera da istekla sesija vraća grešku 401, provjera da plain-text lozinka nije pohranjena ni izložena, provjera enkripcije osjetljivih podataka (AES-256), provjera da pacijent ne može pristupiti tuđoj historiji, provjera da blokirani nalog ne može pristupiti sistemu | QA inženjer | Postman, pregled baze podataka | Nakon završenog sistemskog testiranja | Završeno sistemsko testiranje, dostupni testni nalozi za sve 4 uloge, pristup bazi za provjeru pohrane podataka | Sve neautorizovane rute odbijaju zahtjeve, osjetljivi podaci su enkriptovani u bazi, plain-text lozinke nisu vidljive, istekle sesije ne dozvoljavaju pristup | Svi sigurnosni testovi prolaze — nula kritičnih sigurnosnih propusta |
| Testiranje performansi | Verificirati da sistem odgovara u prihvatljivom vremenu pod normalnim i povećanim opterećenjem: prijava korisnika završava u roku od 2 sekunde, dashboard se učitava u roku od 3 sekunde, otkazivanje termina završava u roku od 2-3 sekunde, admin backend odgovara u roku od 2 sekunde, promjene statusa termina vidljive su u roku od 2 sekunde, sistem ispravno obrađuje istovremene zahtjeve za isti termin | QA inženjer | JMeter | Nakon završenog sistemskog testiranja | Završeno sistemsko testiranje, testno okruženje s dovoljnim skupom podataka, definisani ciljevi performansi iz NFR-a | Sva mjerenja vremena odgovora unutar definisanih granica iz NFR-a, sistem ispravno obrađuje istovremene zahtjeve bez grešaka | 95% mjerenih zahtjeva zadovoljava definirane vremenske limite |
| Testiranje kompatibilnosti | Verificirati da svi ključni tokovi rade ispravno na podržanim browserima: login i preusmjeravanje, zakazivanje i otkazivanje termina, prikaz kalendara i dashboarda, upload PDF nalaza i export CSV-a — na Chrome, Firefox i Edge| QA inženjer | Ručno testiranje na Chrome, Firefox i Edge | Nakon završenog sistemskog testiranja, paralelno s UI testiranjem | Završeno sistemsko testiranje, dostupni browseri | Svi ključni tokovi rade ispravno na sva 3 browsera | 95% testiranih tokova prolazi na svim podržanim browserima i rezolucijama |
| User Acceptance testiranje | Potvrditi da sistem ispunjava poslovne zahtjeve iz perspektive krajnjih korisnika(administrator,doktor, menadžment, pacijent,ostalo medicinsko osoblje): pacijenti potvrđuju tok zakazivanja, otkazivanja i pregleda historije, doktori potvrđuju dashboard i upravljanje terminima, ostalo medicinsko osoblje potvrđuje panel i upload nalaza, administrator potvrđuje upravljanje korisnicima, audit log, menadžment panel i export CSV-a | QA inženjer (organizacija UAT i nadgledanje), krajnji korisnici(potvrda da funckipnalnosti zadovoljavaju njihove svakodnevne potrebe) i naručilac (daje finalno odobrenje) | Ručno testiranje prema UAT scenarijima, Google Sheet za bilježenje rezultata | Nakon završenog sistemskog, UI, sigurnosnog i testiranja performansi — neposredno prije produkcijskog puštanja | Završeni svi prethodni nivoi testiranja bez blokirajućih grešaka, pripremljeni UAT scenariji, obučeni učesnici, testno okruženje s realističnim podacima | Svi UAT scenariji su izvršeni za sve 4 uloge, korisnici potvrdili da sistem radi u skladu s očekivanjima, svi blokirajući i kritični defekti su riješeni | 90% UAT scenarija prolazi, naručilac potpisuje prihvatanje sistema |

## Šta se testira na kojem nivou

| Funkcionalnost | Unit | Integraciono | Sistemsko | UI | Sigurnosno | Performanse | Kompatibilnost | UAT |
|---|---|---|---|---|---|---|---|---|
| Registracija pacijenta od strane admina | DA | DA | DA | DA | DA | NE | DA | DA |
| Validacija sigurnosti lozinke | DA | DA | DA | DA | DA | NE | NE | DA |
| Login / autentifikacija | DA | DA | DA | DA | DA | NE | DA | DA |
| Preusmjeravanje prema ulogama nakon logina | DA | DA | DA | DA | NE | NE | DA | DA |
| Dvofaktorska autentifikacija (2FA) | DA | DA | DA | DA | DA | NE | DA | DA |
| Reset lozinke putem emaila | DA | DA | DA | DA | DA | NE | DA | DA |
| Automatska odjava nakon 15 minuta neaktivnosti | DA | DA | DA | DA | DA | NE | NE | DA |
| Blokiranje naloga nakon 5 neuspješnih pokušaja | DA | DA | DA | DA | DA | NE | NE | DA |
| Detekcija neobičnog ponašanja | DA | DA | DA | NE | DA | NE | NE | DA |
| Pregled dostupnih doktora | DA | DA | DA | DA | NE | DA | DA | DA |
| Pretraga doktora (ime, specijalnost, odjel) | DA | DA | DA | DA | NE | DA | DA | DA |
| Prikaz kalendara doktora | DA | DA | DA | DA | NE | DA | DA | DA |
| Prikaz zauzetosti termina u realnom vremenu | DA | DA | DA | DA | NE | DA | NE | DA |
| Rezervacija termina (pacijent) | DA | DA | DA | DA | DA | DA | DA | DA |
| Rezervacija termina (medicinsko osoblje) | DA | DA | DA | DA | DA | NE | DA | DA |
| Zaključavanje termina na 2 minute | DA | DA | DA | NE | NE | DA | NE | NE |
| Ograničenje rezervacija (1 dnevno, 60 dana) | DA | DA | DA | NE | NE | NE | NE | DA |
| Izmjena termina od strane doktora | DA | DA | DA | DA | NE | NE | DA | DA |
| Otkazivanje termina od strane pacijenta | DA | DA | DA | DA | NE | NE | DA | DA |
| Otkazivanje termina od strane medicinskog osoblja | DA | DA | DA | DA | NE | NE | DA | DA |
| Zabrana otkazivanja 24 h prije termina | DA | DA | DA | NE | NE | NE | NE | DA |
| Obavijest pacijentu kada osoblje otkaže termin | NE | DA | DA | NE | NE | NE | NE | DA |
| Email potvrda o rezervaciji | NE | DA | DA | NE | NE | NE | NE | DA |
| Email podsjetnik 24h prije termina | NE | DA | DA | NE | NE | NE | NE | DA |
| Dashboard za doktora (dnevni/sedmični) | DA | DA | DA | DA | NE | DA | DA | DA |
| Historija pregleda (pacijent) | DA | DA | DA | DA | NE | NE | DA | DA |
| Historija pregleda (doktor) | DA | DA | DA | DA | DA | NE | DA | DA |
| Dodavanje komentara na termin | DA | DA | DA | DA | NE | NE | DA | DA |
| Izmjena i brisanje komentara | DA | DA | DA | DA | DA | NE | DA | DA |
| Označavanje hitnosti termina | DA | DA | DA | DA | NE | NE | DA | DA |
| Prikaz informacija o pacijentu u panelu osoblja | DA | DA | DA | DA | DA | NE | DA | DA |
| Upravljanje radnim vremenom doktora (admin) | DA | DA | DA | DA | NE | NE | DA | DA |
| Upit doktora za promjenu dužine termina | DA | DA | DA | DA | NE | NE | DA | DA |
| Odobravanje upita od strane admina | DA | DA | DA | DA | NE | NE | DA | DA |
| Obavijest doktoru o odobrenju/odbijanju upita | NE | DA | DA | DA | NE | NE | NE | DA |
| Admin panel (frontend) | DA | DA | DA | DA | DA | NE | DA | DA |
| Admin panel (backend / REST API) | DA | DA | DA | NE | DA | DA | NE | NE |
| Upravljanje korisnicima od strane admina | DA | DA | DA | DA | DA | NE | DA | DA |
| Filtriranje podataka po vremenskom periodu | DA | DA | DA | DA | NE | NE | DA | DA |
| Export statistike u CSV | NE | DA | DA | DA | DA | NE | DA | DA |
| Upload laboratorijskih nalaza (PDF) | DA | DA | DA | DA | DA | NE | DA | DA |
| Audit log (logovanje akcija) | DA | DA | DA | NE | DA | NE | NE | DA |
| Enkripcija osjetljivih podataka (AES-256) | NE | DA | DA | NE | DA | NE | NE | NE |
| Definisanje prava pristupa (RBAC) | DA | DA | DA | NE | DA | NE | NE | DA |
|Automatsko oslobađanje termina nakon 2 minute|DA| DA| DA | NE |NE |DA| NE| NE |
| Sprječavanje duplih rezervacija | DA | DA | DA | NE | NE | DA | NE | DA |

**Napomena:** Regresiono testiranje će se provoditi nakon svake izmjene u sistemu. Najbitnije funkcionalnosti za regresiono testiranje su: login, rezervacija termina, otkazivanje termina, email obavijesti i sprječavanje duplih rezervacija, jer su međusobno zavisne i promjena jedne može uticati na drugu.

## Veza sa acceptance kriterijima

| US | AC br. | ID testa | Opis TC |
| :--- | :---: | :--- | :--- |
| **US-01** | 1 | **TC-01-01** | **Preduslov:** Pacijent logovan. **Koraci:** Otvoriti sekciju 'Historija'. **Rezultat:** Termini izlistani hronološki (najnoviji na vrhu). |
| **US-01** | 2 | **TC-01-02** | **Preduslov:** Postoji nalaz. **Koraci:** Klik na završen termin. **Rezultat:** Prikazan datum, ljekar, odjel, opis terapije i PDF nalaz. |
| **US-01** | 3 | **TC-01-03** | **Preduslov:** Postoji otkazan termin. **Koraci:** Pregled liste. **Rezultat:** Otkazani termini jasno označeni statusom "OTKAZAN". |
| **US-01** | 4 | **TC-01-04** | **Preduslov:** Pacijent bez historije. **Koraci:** Otvoriti 'Historija'. **Rezultat:** Poruka: "Trenutno nemate zabilježenih pregleda u historiji". |
| **US-02** | 1 | **TC-02-01** | **Preduslov:** Korisnik nije admin. **Koraci:** Ručni unos URL-a za admin panel. **Rezultat:** Sistem preusmjerava na login stranicu. |
| **US-02** | 2 | **TC-02-02** | **Preduslov:** Admin logovan. **Koraci:** Otvoriti dashboard. **Rezultat:** Prikazan tačan broj pacijenata i današnjih termina iz baze. |
| **US-02** | 3 | **TC-02-03** | **Preduslov:** Lista korisnika. **Koraci:** Klik na korisnika, izmjena podataka. **Rezultat:** Promjena je uspješno spašena u SQL bazu podataka. |
| **US-02** | 4 | **TC-02-04** | **Preduslov:** Postoje termini. **Koraci:** Unijeti datum u filter termina. **Rezultat:** Tabela prikazuje samo rezervacije za taj datum. |
| **US-02** | 5 | **TC-02-05** | **Preduslov:** Admin panel. **Koraci:** Unos prezimena u pretragu. **Rezultat:** Sistem prikazuje pacijente koji imaju to prezime. |
| **US-03** | 1 | **TC-03-01** | **Preduslov:** Nalog aktivan. **Koraci:** Unos emaila i lozinke. **Rezultat:** Uspješna autentifikacija i ulaz u aplikaciju. |
| **US-03** | 2 | **TC-03-02** | **Preduslov:** Korisnik je ljekar. **Koraci:** Prijava. **Rezultat:** Sistem otvara ljekarski dashboard, ne pacijentov profil. |
| **US-03** | 3 | **TC-03-03** | **Preduslov:** 2FA aktivan. **Koraci:** Unos lozinke. **Rezultat:** Sistem traži 6-cifreni kod sa emaila prije konačnog pristupa. |
| **US-03** | 4 | **TC-03-04** | **Preduslov:** Login ekran. **Koraci:** 5 pogrešnih lozinki. **Rezultat:** Nalog privremeno blokiran; onemogućen login na 15 min. |
| **US-03** | 5 | **TC-03-05** | **Preduslov:** Pogrešan email. **Koraci:** Klik 'Prijavi se'. **Rezultat:** Poruka "Pogrešan email ili lozinka" bez detalja. |
| **US-04** | 1 | **TC-04-01** | **Preduslov:** Admin panel. **Koraci:** Klik na 'Novi pacijent', unos podataka. **Rezultat:** Novi profil sa ulogom 'PACIJENT' kreiran u bazi. |
| **US-04** | 2 | **TC-04-02** | **Preduslov:** Registracija. **Koraci:** Ostaviti polje email prazno. **Rezultat:** Sistem blokira spašavanje i označava polje kao obavezno. |
| **US-04** | 3 | **TC-04-03** | **Preduslov:** User postoji. **Koraci:** Pokušaj duple registracije. **Rezultat:** Poruka: "Korisnik sa ovim emailom je već registrovan". |
| **US-04** | 4 | **TC-04-04** | **Preduslov:** Javna stranica. **Koraci:** Pacijent se sam registruje. **Rezultat:** Admin vidi taj profil u svom panelu korisnika. |
| **US-04** | 5 | **TC-04-05** | **Preduslov:** Kraj unosa. **Koraci:** Provjera ekrana. **Rezultat:** Prikazana potvrda: "Pacijent uspješno registrovan". |
| **US-05** | 1 | **TC-05-01** | **Preduslov:** Pregled resursa. **Koraci:** Izbor odjela 'RTG'. **Rezultat:** Lista prikazuje isključivo ljekare sa RTG odjela. |
| **US-05** | 2 | **TC-05-02** | **Preduslov:** Lista ljekara. **Koraci:** Pregled informacija. **Rezultat:** Vidljivo ime, titula i slika svakog ljekara. |
| **US-05** | 3 | **TC-05-03** | **Preduslov:** Klik na ljekara. **Koraci:** Otvaranje kalendara. **Rezultat:** Prikazan interaktivni kalendar sa slobodnim slotovima. |
| **US-05** | 4 | **TC-05-04** | **Preduslov:** Dva korisnika. **Koraci:** Jedan potvrdi slot. **Rezultat:** Slot automatski postaje nevidljiv drugom korisniku (real-time). |
| **US-05** | 5 | **TC-05-05** | **Preduslov:** Kalendar. **Koraci:** Provjera boja. **Rezultat:** Jasna razlika između slobodnih, popunjenih i blokiranih slotova. |
| **US-06** | 1 | **TC-06-01** | **Preduslov:** Pacijent logovan. **Koraci:** Izbor termina i potvrda. **Rezultat:** Termin u bazi dobija status 'ZAKAZAN'. |
| **US-06** | 2 | **TC-06-02** | **Preduslov:** Opšta praksa. **Koraci:** Rezervacija za 65 dana. **Rezultat:** Sistem onemogućava izbor datuma preko 60 dana. |
| **US-06** | 3 | **TC-06-03** | **Preduslov:** Specijalista. **Koraci:** Rezervacija za 11 mjeseci. **Rezultat:** Sistem dozvoljava rezervaciju (limit 12 mjeseci). |
| **US-06** | 4 | **TC-06-04** | **Preduslov:** Kalendar. **Koraci:** Pregled slotova. **Rezultat:** Vidljivi samo termini unutar radnog vremena ljekara. |
| **US-06** | 5 | **TC-06-05** | **Preduslov:** Dva korisnika. **Koraci:** Istovremeni klik. **Rezultat:** Sistem prihvata samo jedan zahtjev (sprječavanje duplih). |
| **US-06** | 6 | **TC-06-06** | **Preduslov:** Pacijent ima termin. **Koraci:** Rezervacija drugog. **Rezultat:** Blokada uz poruku o limitu od jednog termina dnevno. |
| **US-07** | 1 | **TC-07-01** | **Preduslov:** Pretraga. **Koraci:** Unos dijela imena ljekara. **Rezultat:** Lista ljekara koji odgovaraju pojmu se ispravno ispisuje. |
| **US-07** | 2 | **TC-07-02** | **Preduslov:** Pogrešan unos. **Koraci:** Unos nepostojećeg pojma. **Rezultat:** Poruka: "Nije pronađen nijedan ljekar". |
| **US-07** | 3 | **TC-07-03** | **Preduslov:** Profil ljekara. **Koraci:** Pregled detalja. **Rezultat:** Vidljivo radno vrijeme i specijalnost ljekara. |
| **US-07** | 4 | **TC-07-04** | **Preduslov:** Izbor ljekara. **Koraci:** Klik na slobodan slot. **Rezultat:** Preusmjeravanje na formu za potvrdu rezervacije. |
| **US-07** | 5 | **TC-07-05** | **Preduslov:** Specijalista. **Koraci:** Pacijent bez uputnice zakazuje. **Rezultat:** Akcija dozvoljena samo ljekaru opšte prakse za pacijenta. |
| **US-08** | 1 | **TC-08-01** | **Preduslov:** Kraj rezervacije. **Koraci:** Provjera emaila. **Rezultat:** Potvrda poslata automatski na adresu pacijenta. |
| **US-08** | 2 | **TC-08-02** | **Preduslov:** Email primljen. **Koraci:** Pregled sadržaja. **Rezultat:** Email sadrži datum, vrijeme, ime ljekara i odjel. |
| **US-08** | 3 | **TC-08-03** | **Preduslov:** Dan prije. **Koraci:** Provjera inboxa. **Rezultat:** Podsjetnik poslat automatski 24 sata prije pregleda. |
| **US-08** | 4 | **TC-08-04** | **Preduslov:** Link u emailu. **Koraci:** Klik na link. **Rezultat:** Korisnik prebačen na opciju otkazivanja u aplikaciji. |
| **US-09** | 1 | **TC-09-01** | **Preduslov:** Sestra u panelu. **Koraci:** Klik 'Otkaži' na terminu. **Rezultat:** Mjesto u bazi oslobođeno; status promijenjen. |
| **US-09** | 2 | **TC-09-02** | **Preduslov:** Promjena plana. **Koraci:** Otkazivanje 10 min prije. **Rezultat:** Sistem dozvoljava osoblju otkazivanje bilo kada. |
| **US-09** | 3 | **TC-09-03** | **Preduslov:** Otkazano od osoblja. **Koraci:** Provjera emaila pacijenta. **Rezultat:** Pacijent obaviješten o otkazivanju od strane bolnice. |
| **US-09** | 4 | **TC-09-04** | **Preduslov:** Klik na 'Otkaži'. **Koraci:** Odgovor na upit. **Rezultat:** Sistem traži potvrdu: "Da li ste sigurni?" prije akcije. |
| **US-09** | 5 | **TC-09-05** | **Preduslov:** Termin otkazan. **Koraci:** Pretraga drugih. **Rezultat:** Otkazani termin odmah vidljiv kao slobodan u kalendaru. |
| **US-10** | 1 | **TC-10-01** | **Preduslov:** Profil pacijenta. **Koraci:** Klik na 'Otkaži'. **Rezultat:** Status termina postaje 'OTKAZAN'; slot oslobođen. |
| **US-10** | 2 | **TC-10-02** | **Preduslov:** Termin za 5h. **Koraci:** Pacijent pokuša otkazati. **Rezultat:** Blokada akcije zbog pravila od 24h. |
| **US-10** | 3 | **TC-10-03** | **Preduslov:** Pacijent otkazao. **Koraci:** Provjera emaila. **Rezultat:** Email potvrda o otkazivanju poslata trenutno. |
| **US-10** | 4 | **TC-10-04** | **Preduslov:** Klik na 'Otkaži'. **Koraci:** Provjera upita. **Rezultat:** Sistem traži potvrdu namjere prije brisanja. |
| **US-10** | 5 | **TC-10-05** | **Preduslov:** Otkazano. **Koraci:** Kalendar pretrage. **Rezultat:** Slot vidljiv kao slobodan za ostale korisnike. |
| **US-10** | 6 | **TC-10-06** | **Preduslov:** Akcija gotova. **Koraci:** Provjera interfejsa. **Rezultat:** Prikazana poruka: "Vaš termin je uspješno otkazan". |


## Način evidentiranja rezultata testiranja 
| ID testa | Naziv / Opis testa | Ulazni podaci | Očekivani rezultat | Stvarni rezultat | Status | ID buga | Opis greške | Prioritet greške | Napomena |
|---|---|---|---|---|---|---|---|---|---|
| TC-01 |  |  |  |  |  |  |  |  |  |
| TC-02 |  |  |  |  |  |  |  |  |  |
| TC-03 |  |  |  |  |  |  |  |  |  |

## Glavni rizici kvaliteta

- **Opis rizika**: Kratak opis potencijalog problema  
- **Vjerovatnoća (1-5):** Koliko je vjerovatno da se rizik dogodi (1 = malo, 5 = sigurno).
- **Uticaj (1-5):** Koliko bi problem uticao na sistem (1 = minimalno, 5 = kritično).
- **Nivo rizika (V * U)**: Proizvod vjerovatnoće i uticaja, od 1 do 25.
- **Prioritet testiranja:** Na osnovu nivoa rizika, određuje se prioritet (visoki/srednji/niski).
- **Mjere ublažavanja:** Konkretne akcije za smanjenje rizika


| ID rizika | Opis rizika | Vjerovatnoća (1-5) | Uticaj (1-5) | Nivo rizika (V×U) | Prioritet testiranja | Mjere ublažavanja |
|---|---|---|---|---|---|---|
| R-01 | | | | | | |
