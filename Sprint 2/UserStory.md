# User Story

## US-01
## Historija pregleda korisnika
### Opis

Kao pacijent, želim da mogu pregledati historiju svojih pregleda, kako bih imao uvid u prethodne termine i zdravstvene nalaze.

### Poslovna vrijednost:
Ovaj sistem omogućava kvalitetniju i uredniju evidenciju zdravstvenih podataka pacijenata, što uveliko olakšava svakodnevni rad. 
Na osnovu tako organizovanih informacija, doktori mogu lakše donositi informisane i preciznije odluke o liječenju. 
Pored toga, cijeli proces postaje transparentniji, a praćenje toka liječenja jednostavnije i pouzdanije.

### Prioritet:

Srednji (Medium)


### Pretpostavke:
- Sistem vodi evidenciju svih pregleda
- Pacijent ima kreiran nalog
### Otvorena pitanja:
- Koji detalji pregleda se prikazuju (samo datum ili datum i opis terapije)??
- Da li se prikazuju i otkazani termini?

## US-02
## Admin panel
### Opis

Kao administrator, želim da imam korisnički interfejs za administraciju, kako bih mogao upravljati korisnicima, terminima i resursima.

### Poslovna vrijednost:
Admin panel omogućava jednostavno praćenje i upravljanje svim aktivnostima unutar sistema, olakšavajući svakodnevni rad administrativnog osoblja. 
Takođe pruža pregled statistika i izvještaja, što pomaže u bržem donošenju odluka i boljoj koordinaciji timova.

### Prioritet:

Visok (High)


### Pretpostavke:
- Backend funkcionalnosti već postoje 
- Administrator ima pristup sistemu
### Otvorena pitanja:
- Koje funkcionalnosti treba prikazati u frontend panelu?
- Da li je potrebna autentifikacija za pristup panelu?

## US-03
## Login sistem
### Opis

Admin panel za registraciju pacijenata omogućava da se cijeli proces unosa novih pacijenata obavi brzo i pregledno. Osoblje može lako ažurirati podatke, pratiti historiju pacijenata i upravljati terminima, što pojednostavljuje administrativni posao i poboljšava organizaciju u klinici.


### Poslovna vrijednost:
Sistem je osmišljen tako da osigura visok nivo sigurnosti, čime se štite svi njegovi dijelovi od neovlaštenog pristupa. 
Istovremeno, korisnicima omogućava personalizovan pristup podacima, pa svako može vidjeti i koristiti informacije koje su relevantne upravo za njega. 
Poseban naglasak stavljen je na zaštitu osjetljivih medicinskih informacija, kako bi privatnost pacijenata bila u potpunosti očuvana.
### Prioritet:

Visok (High)


### Pretpostavke:
- Korisnici imaju kreirane naloge 
- Podaci su šifrovani i sigurni
### Otvorena pitanja:
Koliko pokušaja login-a je dozvoljeno prije blokade?
## US-04
## Admin panel - registracija pacijenta
### Opis

Kao administrator, želim da mogu registrovati nove pacijente, kako bi oni mogli koristiti sistem.
### Poslovna vrijednost:
Admin panel za registraciju pacijenata omogućava brzo i jednostavno dodavanje novih korisnika u sistem. 
Olakšava praćenje osnovnih podataka, termina i statusa pacijenata, čime administrativno osoblje štedi vrijeme i smanjuje mogućnost grešaka prilikom unosa informacija.

### Prioritet:

Visok (High)


### Pretpostavke:
- Administrator ima pristup admin panelu
- Sistem validira podatke unosa
### Otvorena pitanja:
- Koji su obavezni podaci za registraciju?

## US-05
## Pregled dostupnih resursa
### Opis

Kao pacijent, želim da vidim dostupne doktore i slobodne termine, kako bih odabrao najpogodniji termin za pregled.

### Poslovna vrijednost:
Sistem pruža jasan i pregledan uvid u raspored, čime se postiže veća transparentnost i lakše snalaženje. 
Na osnovu dostupnih informacija, pacijenti mogu jednostavnije donijeti odluke koje im najviše odgovaraju. 
Uz to, sam proces zakazivanja termina postaje brži i efikasniji, što olakšava organizaciju i pacijentima i osoblju.

### Prioritet:

Visok (High)


### Pretpostavke:
- Termini su definisani u sistemu
- Podaci o doktorima su dostupni
### Otvorena pitanja:
- Može li pacijent filtrirati po specijalizaciji doktora?
- Da li se prikazuje zauzetost termina u realnom vremenu?
##  US-06
## Rezervacija termina
### Opis

Kao pacijent, želim da mogu rezervisati termin kod doktora na osnovu dostupnog rasporeda, kako bih osigurao pravovremeni pregled bez čekanja.

### Poslovna vrijednost:
Korištenjem sistema omogućeno je jednostavno i brzo digitalno zakazivanje pregleda, bez potrebe za dodatnim procedurama ili čekanjem. Time se značajno smanjuje administrativno opterećenje, jer se veliki dio posla automatizuje. Kao rezultat toga, pacijenti imaju ugodnije iskustvo i veće zadovoljstvo uslugom.
### Prioritet:

Visok (High)


### Pretpostavke:
- Sistem već ima implementiran login
- Postoje dostupni termini
- Validacija sprječava duple rezervacije
### Otvorena pitanja:
- Da li pacijent može rezervisati više termina dnevno?
- Postoji li ograničenje po specijalisti?
- Kako se označavaju hitni termini?
## US-07
## Email potvrda o rezervaciji
### Opis

Kao pacijent, želim da dobijem email potvrdu nakon rezervacije termina, kako bih imao podsjetnik i dokaz zakazanog pregleda.

### Poslovna vrijednost:
Uvođenjem ovakvog rješenja znatno se smanjuje mogućnost da pacijenti zaborave zakazane termine, što doprinosi boljoj organizaciji. Istovremeno, sistem djeluje pouzdanije i stabilnije u svakodnevnom radu. Sve to zajedno utiče na pozitivnije korisničko iskustvo i lakše korištenje sistema.
### Prioritet:

Srednji (Medium)


## Pretpostavke:
- Pacijent ima validnu email adresu
- Rezervacija je uspješno izvršena
### Otvorena pitanja:
- Koji detalji se prikazuju u emailu?
- Da li se šalju i kasniji podsjetnici?
## US-08
## Otkazivanje termina (medicinsko osoblje)
## Opis

Kao medicinsko osoblje, želim da mogu otkazati termine pacijenata, kako bih oslobodio termine u slučaju promjena u rasporedu.

### Poslovna vrijednost:
Sistem omogućava veću fleksibilnost u rasporedu, prilagođavajući se potrebama i pacijenata i osoblja. To pomaže u optimalnoj organizaciji termina, tako da se vrijeme efikasno koristi. Kao dodatna prednost, smanjuje se broj neiskorištenih termina, čime cijeli proces postaje produktivniji i bolje koordiniran.

### Prioritet:

Nizak (Low)


### Pretpostavke:
- Termin je već rezervisan
- Osoblje ima pristup panelu medicinskog osoblja
### Otvorena pitanja:
- Koliko ranije se može izvršiti otkazivanje?
- Da li se šalje obavijest pacijentu?
## US-09
##  Otkazivanje termina (pacijent)
### Opis
Kao pacijent, želim da mogu otkazati svoj termin, kako bih oslobodio termin u slučaju spriječenosti.

### Poslovna vrijednost:
Ovaj sistem pomaže da se broj neiskorištenih termina značajno smanji, čime se resursi bolje raspoređuju i maksimalno iskorištavaju. Istovremeno, omogućava veću fleksibilnost u planiranju, što pozitivno utiče na zadovoljstvo pacijenata i olakšava njihovo iskustvo sa uslugom.

### Prioritet:

Nizak (Low)

### Pretpostavke:
- Termin je već rezervisan
- Sistem vodi evidenciju svih termina
### Otvorena pitanja:
- Koliko ranije pacijent može otkazati termin?
- Da li se šalje potvrda o otkazivanju?
##  US-10
## Dashboard za doktora – pregled rasporeda
### Opis

Kao doktor, želim da imam pregled svog dnevnog i sedmičnog rasporeda, kako bih efikasno organizovao svoje obaveze.

### Poslovna vrijednost:
Sistem doprinosi boljoj organizaciji svakodnevnog rada, jer pruža jasan pregled obaveza i zadataka. Time se značajno smanjuje mogućnost grešaka u rasporedu, a zaposlenima omogućava učinkovitije planiranje radnog dana. Kao rezultat, produktivnost raste, a radni proces postaje jednostavniji i pregledniji.

### Prioritet:

Nizak (Low)


### Pretpostavke:
- Termini su već definisani
- Doktor ima pristup svom panelu 
### Otvorena pitanja:
- Da li doktor može mijenjati termine?
- Da li vidi i historiju pregleda pacijenata?



## US-11
## Automatsko oslobađanje zaključanih termina
### Opis

Kao sistem, želim automatski osloboditi termine koji nisu potvrđeni u određenom vremenu, kako bi se povećila dostupnost termina za druge pacijente.

### Poslovna vrijednost:
Sistem omogućava bolje iskorištenje dostupnih termina, čime se smanjuju zastoji i neiskorišteni resursi. Time se rad administracije i medicinskog osoblja znatno olakšava, jer je organizacija procesa jasnija i efikasnija, što doprinosi glatkom funkcionisanju cijelog sistema.

### Prioritet:

Nizak (Low)


### Pretpostavke:
- Postoje termini označeni kao “zaključani”
- Sistem prati status potvrđenosti termina
### Otvorena pitanja:
- Koliko vremena mora proći prije oslobađanja termina?

## US-12
## Validacija i sprječavanje duplih rezervacija
### Opis

Kao sistem, želim spriječiti dupliranje termina u isto vrijeme za istog pacijenta, kako bih izbjegao konflikte i greške u rasporedu.

### Poslovna vrijednost:
Sistem osigurava preciznu evidenciju svih zakazanih termina, čime se značajno smanjuje mogućnost administrativnih grešaka. To ne samo da olakšava posao osoblju, već i poboljšava iskustvo pacijenata, koji imaju pouzdan uvid u svoje termine, kao i doktora, kojima je rad organizovan i pregledan.

### Prioritet:

Visok (High)

### Pretpostavke:
- Pacijenti mogu rezervisati termine online
- Sistem prati sve postojeće rezervacije
### Otvorena pitanja:
- Da li se validacija odnosi i na specijaliste i porodične doktore?
- Šta se dešava ako pacijent pokuša rezervisati dupli termin?
## US-13
## Upravljanje radnim vremenom doktora (admin)
### Opis

Kao administrator, želim da mogu upravljati radnim vremenom doktora, kako bi se termini mogli pravilno planirati i zakazivati.

## Poslovna vrijednost:
Naš sistem pomaže u efikasnijoj organizaciji rasporeda doktora, što omogućava optimalno korištenje dostupnih resursa. Istovremeno, smanjuje se rizik od grešaka prilikom zakazivanja, čime cijeli proces postaje pouzdaniji i pregledniji, a rad osoblja jednostavniji.

### Prioritet:

Visok (High)

### Pretpostavke:
- Administrator ima pristup admin panelu
- Doktor je registrovan u sistemu
### Otvorena pitanja:
- Da li doktor može sam mijenjati svoje radno vrijeme?
- Kako se tretiraju vanredni i hitni termini?
## US-14
##  Reset lozinke putem emaila
### Opis

Kao korisnik, želim da mogu resetovati lozinku putem emaila, kako bih mogao povratiti pristup svom nalogu ako zaboravim lozinku.

### Poslovna vrijednost:
Ovaj sistem značajno povećava sigurnost korisničkih naloga, štiteći ih od neovlaštenog pristupa. Korisnicima takođe omogućava samostalno rješavanje problema sa loginom, što čini korištenje praktičnijim i bržim. Kao rezultat, opterećenje službe za podršku se smanjuje, a proces postaje efikasniji za sve strane.

### Prioritet:

Srednji (Medium)


### Pretpostavke:
- Korisnik ima validnu email adresu
- Sistem može slati emailove
### Otvorena pitanja:
- Koliko dugo je reset link validan?
- Da li postoji limit pokušaja resetovanja?
## US-15
##  Rezervacija termina kod specijaliste putem doktora porodične medicine
### Opis

Kao pacijent, želim da moj porodični doktor može rezervisati termin kod specijaliste u moje ime, kako bih dobio bržu i koordiniranu medicinsku uslugu.

### Poslovna vrijednost:
Naš sistem olakšava koordinaciju između doktora, što omogućava bolje usklađivanje termina i zadataka. Time se smanjuje vrijeme čekanja pacijenata, a cijeli proces zakazivanja postaje efikasniji i pregledniji, čime se poboljšava iskustvo i osoblja i korisnika.

### Prioritet:

Visok (High)


### Pretpostavke:
- Porodični doktor ima pristup sistemu
- Specijalista je registrovan u sistemu
### Otvorena pitanja:
- Da li pacijent dobija obavijest o rezervaciji?
- Može li pacijent potvrditi ili odbiti termin?
## US-16
## Menadžment panel
### Opis

Kao administrator, želim imati centralizovani menadžment panel za nadzor i upravljanje sistemom, kako bih mogao pratiti sve aktivnosti i resurse.

# Poslovna vrijednost:
Centralizovana kontrola olakšava nadzor i upravljanje svim funkcijama, što značajno povećava efikasnost administrativnog osoblja. Istovremeno, praćenje termina i aktivnosti korisnika postaje preglednije, što pojednostavljuje organizaciju i omogućava brže reagovanje na potrebe pacijenata i osoblja.

### Prioritet:

Visok (High)


### Pretpostavke:
- Administrator ima pristup sistemu
- Panel prikazuje sve ključne informacije o korisnicima i terminima
### Otvorena pitanja:
- Koji podaci su prioritetni za prikaz?
- Da li se menadžment panel koristi i za izvještavanje?
## US-17
## Automatska odjava nakon perioda neaktivnosti (session timeout)
### Opis

Kao korisnik, želim da me sistem automatski odjavi nakon određenog vremena neaktivnosti, kako bi se povećala sigurnost mog naloga.

### Poslovna vrijednost:
Sigurnost podataka je znatno poboljšana, čime se smanjuje rizik od neovlaštenog pristupa i potencijalnih problema. Takođe, ovakav pristup osigurava da sve procedure budu u skladu sa važećim sigurnosnim standardima, što dodatno povećava pouzdanost i zaštitu informacija.

### Prioritet:

Visok (High)

### Pretpostavke:
- Sistem prati aktivnosti korisnika
- Login funkcionalnost je implementirana
### Otvorena pitanja:
- Koliko minuta neaktivnosti pokreće timeout?
- Da li se korisniku prikazuje upozorenje prije odjave?
## US-18
## Logovanje svih akcija u sistemu (audit log)
### Opis

Kao administrator, želim da sistem bilježi sve akcije i promjene unutar sistema, kako bih mogao pratiti i analizirati aktivnosti korisnika.

### Poslovna vrijednost:
Ovaj pristup doprinosi većoj sigurnosti i transparentnosti u radu, jer omogućava praćenje svih aktivnosti i reviziju eventualnih grešaka. Takođe, olakšava otkrivanje neovlaštenih radnji, čime se dodatno štite podaci i poboljšava kontrola nad procesima.

### Prioritet:

Visok (High)

### Pretpostavke:
- Sistem prati sve CRUD akcije
- Administratori imaju pristup audit logu
### Otvorena pitanja:
- Koliko dugo se čuvaju podaci u audit logu?
- Ko sve ima pristup logovima?
## US-19
## Omogućavanje pregleda komentara prilikom zakazivanja termina
### Opis

Kao pacijent ili doktor, želim da mogu vidjeti napomene ili komentare vezane za termin, kako bih imao sve relevantne informacije prije pregleda.

### Poslovna vrijednost:
Bolja komunikacija doprinosi jasnijem dogovoru između pacijenata i osoblja, čime se smanjuju nesporazumi prilikom zakazivanja termina. To također olakšava pripremu za pregled, jer su sve informacije dostupne na vrijeme i organizovane, što čini iskustvo ugodnijim i efikasnijim.

### Prioritet:

Srednji (Medium)


### Pretpostavke:
- Komentari se unose prilikom rezervacije termina
- Korisnici imaju pristup detaljima termina
### Otvorena pitanja:
- Ko može unositi komentare?
- Da li se komentari prikazuju samo doktoru ili i pacijentu?
## US-20
## Vodič za korištenje stranice
### Opis

Kao pacijent ili doktor, želim da imam interaktivno uputstvo ili dokumentaciju, kako bih znao kako koristiti sistem.

### Poslovna vrijednost:
Intuitivno dizajnirane funkcionalnosti pomažu korisnicima da brže savladaju rad sa sistemom, što smanjuje potrebu za dodatnom podrškom. Kao rezultat, iskustvo korištenja postaje jednostavnije i ugodnije, čime se povećava zadovoljstvo korisnika.

### Prioritet:

Nizak (Low)


### Pretpostavke:
- Postoji osnovna dokumentacija sistema
- Sistem može prikazivati upute u interaktivnom formatu
### Otvorena pitanja:
- Da li vodič uključuje video tutorijale ili samo tekst?
- Da li se vodič ažurira automatski sa novim funkcionalnostima?


## US-21
##  Panel medicinskog osoblja
### Opis

Kao medicinsko osoblje, želim da imam panel sa kontrolama za upravljanje pregledima i terminima pacijenata, kako bih mogao efikasno organizovati svoj rad.

### Poslovna vrijednost:
Bolja organizacija rada medicinskog osoblja omogućava učinkovitije planiranje i smanjuje greške u rasporedu. Uz to, moguće je pratiti historiju pacijenata, što olakšava donošenje informisanih odluka i doprinosi ukupnoj produktivnosti i kvalitetu pružene njege.

### Prioritet:

Visok (High)

### Pretpostavke:
- Medicinsko osoblje je registrovano i ima pristup sistemu
- Panel prikazuje relevantne termine i pacijente
### Otvorena pitanja:
- Da li panel uključuje opciju kreiranja novih termina?
- Koje informacije o pacijentu su prikazane?
## US-22
##  Two factor authentication
### Opis

Kao korisnik, želim da koristim dvofaktorsku autentifikaciju prilikom logina, kako bi moj nalog bio sigurniji.

### Poslovna vrijednost:
Povećana sigurnost korisničkih naloga smanjuje rizik od neovlaštenog pristupa, čime se štite osjetljivi medicinski podaci. Takav pristup dodatno osigurava privatnost pacijenata i povećava povjerenje u sistem.

### Prioritet:

Visok (High)

### Pretpostavke:
- Korisnik ima aktivan email ili telefon za 2FA
- Login sistem je implementiran 
### Otvorena pitanja:
- Koji tip 2FA će se koristiti (SMS, email, aplikacija)?
- Da li je 2FA obavezna za sve korisnike ili opcionalna?
##  US-23
##   Detekcija neobičnog ponašanja - blokiranje naloga
### Opis

Kao sistem, želim automatski blokirati naloge nakon više neuspješnih pokušaja logina, kako bi zaštitio korisničke podatke.

### Poslovna vrijednost:
Sistem je dizajniran da pruža visok nivo sigurnosti, čime se osjetljive informacije pacijenata dodatno štite. Istovremeno, značajno se smanjuje mogućnost neovlaštenog pristupa, što doprinosi pouzdanosti i sigurnosti cjelokupnog okruženja.

### Prioritet:

Visok (High)


### Pretpostavke:
- Login sistem prati broj neuspješnih pokušaja
- Korisnici imaju način da povrate pristup
### Otvorena pitanja:
- Koliko pokušaja je dozvoljeno prije blokade?
- Da li se korisniku šalje upozorenje prije blokade?
## US-24
## Enkripcija osjetljivih podataka
### Opis

Kao sistem, želim da enkriptujem osjetljive zdravstvene podatke, kako bi zaštitio privatnost pacijenata i osigurao sigurnost informacija.

### Poslovna vrijednost:
Povećana zaštita podataka osigurava da svi podaci budu sigurni i zaštićeni od neovlaštenog pristupa. Sistem takođe omogućava usklađenost sa zakonima o zaštiti podataka, što smanjuje rizik od curenja osjetljivih informacija i povećava povjerenje korisnika.

### Prioritet:

Visok (High)

### Pretpostavke:
- Podaci pacijenata se čuvaju u bazi
- Sistem podržava enkripciju na nivou baze ili aplikacije
### Otvorena pitanja:
- Koji algoritam enkripcije će se koristiti?
- Da li se enkripcija primjenjuje i na backup-e?
##  US-25
## Označavanje hitnosti prijavljenog termina
### Opis

Kao administrator ili medicinsko osoblje, želim vizuelno označiti hitne pacijente u sistemu, kako bi prioritetni termini bili obrađeni odmah.

## Poslovna vrijednost:
Sistem omogućava pravovremenu obradu hitnih pacijenata, što je ključno za njihovu sigurnost i zdravlje. Time se povećava efikasnost rada medicinskog osoblja, a rizik od propusta u urgentnim situacijama značajno se smanjuje, čime se poboljšava ukupna kvaliteta pružene njege.

### Prioritet:

Srednji (Medium)

### Pretpostavke:
- Sistem prepoznaje urgentne slučajeve
- Korisnici imaju pristup vizuelnom označavanju
### Otvorena pitanja:
- Koji kriterijumi određuju hitnost?
- Da li pacijent vidi da je njegov termin označen kao hitan?
## US-26
## Export statistike zdravstvene ustanove
### Opis

Kao administrator, želim eksportovati statistiku zakazanih pregleda doktora u CSV formatu, kako bih mogao analizirati podatke i planirati resurse.

### Poslovna vrijednost:
Sistem omogućava detaljniju analizu podataka, što olakšava planiranje resursa i rasporeda. Takođe, pojednostavljuje pripremu izvještaja i pomaže u donošenju informisanih odluka, čime se povećava efikasnost i preglednost cjelokupnog procesa.

### Prioritet:

Nizak (Low)


### Pretpostavke:
- Podaci o terminima i doktorima su pohranjeni u bazi
- Sistem može generisati CSV fajl
### Otvorena pitanja:
- Da li se eksport vrši periodično ili na zahtjev?
- Ko ima pristup eksportovanim podacima?
## US-27
##  Automatski podsjetnik
### Opis

Kao pacijent, želim da sistem automatski šalje podsjetnike pacijentima sa hroničnim bolestima, kako bi se smanjila zaboravljena zakazivanja pregleda.

### Poslovna vrijednost:
Veća prisutnost pacijenata na zakazanim terminima doprinosi kontinuitetu liječenja i boljoj njezi. Istovremeno, smanjuje se administrativni posao jer više nije potrebno ručno slati podsjetnike, što olakšava rad osoblja i čini cijeli proces efikasnijim.

### Prioritet:

Nizak (Low)

### Pretpostavke:
- Pacijent ima označen atribut “hronični bolesnik”
- Sistem može slati emailove
### Otvorena pitanja:
- Koliko često se šalje podsjetnik?
- Da li se podsjetnik šalje i putem SMS-a?
## US-28
##  Upload i evidencija laboratorijskih nalaza
### Opis

Kao medicinsko osoblje, želim dodavati PDF nalaze ili vrijednosti u historiju pregleda pacijenata, kako bi podaci bili kompletni i dostupni za buduće preglede.

### Poslovna vrijednost:
Detaljna evidencija pacijenata omogućava doktorima precizniju analizu i praćenje razvoja bolesti, što doprinosi kvalitetnijem liječenju. Takođe, smanjuje se rizik od gubitka važnih podataka, čime se osigurava sigurnost i pouzdanost informacija.

### Prioritet:

Srednji (Medium)


### Pretpostavke:
- Pacijent ima nalaze spremne za upload
- Sistem omogućava sigurno pohranjivanje fajlova
### Otvorena pitanja:
- Koji tip fajlova je dozvoljen?
- Koliko dugo se čuvaju uploadovani fajlovi?
## US-29
## Admin panel - backend
### Opis

Kao backend developer, želim razviti backend funkcionalnosti za admin panel, kako bi administratori mogli upravljati korisnicima, terminima i resursima.

### Poslovna vrijednost:
Admin panel funkcioniše efikasno i omogućava jednostavno upravljanje svim funkcijama sistema. Uz to, sistem je skalabilan i može se lako prilagoditi rastućim potrebama, dok povećana sigurnost i kontrola nad podacima osiguravaju pouzdanost i zaštitu informacija.

### Prioritet:

Visok (High)

### Pretpostavke:
- Baza podataka je spremna 
- API-jevi za frontend su planirani
### Otvorena pitanja:
- Koje funkcionalnosti backend treba podržati prvo?
- Da li će biti REST ili GraphQL API?
## US-30
##  Kreirati ER model baze podataka
### Opis

Kao sistem dizajner, želim definisati entitete, atribute, relacije, primarne i strane ključeve, kako bi baza podataka bila pravilno strukturirana i spremna za implementaciju.

### Poslovna vrijednost:
Ove funkcionalnosti osiguravaju pravilno funkcionisanje sistema i pomažu u provjeri i validaciji poslovnih procesa. Time se značajno smanjuje rizik od grešaka prilikom implementacije baze podataka, čime se povećava pouzdanost i stabilnost cijelog sistema.


### Prioritet:

Visok (High)


### Pretpostavke:
- Postoji produkt backlog sa svim funkcionalnostima
- Sistemski zahtjevi su jasno definirani
### Otvorena pitanja:
- Koji tip baze podataka će se koristiti (SQL/NoSQL)?
- Da li će model podržavati buduća proširenja sistema?

## US-31
##  Kreiranje baze podataka
### Opis

Kao sistem administrator, želim implementirati bazu podataka u stvarnom okruženju, kako bi sistem mogao pohranjivati sve podatke pacijenata, termina i korisnika.

### Poslovna vrijednost:
Centralizovano čuvanje podataka omogućava da sve informacije budu na jednom mjestu, što olakšava pristup i upravljanje njima. Time se osigurava konzistentnost i integritet podataka, a sistem može nesmetano podržavati sve svoje funkcionalnosti, čineći rad pouzdanim i efikasnim.

### Prioritet:

Visok (High)

### Pretpostavke:
- ER model baze je definisan
- Sistemski zahtjevi su poznati
### Otvorena pitanja:
- Koji tip baze podataka se koristi (SQL/NoSQL)?
- Da li je potrebna replikacija za veću dostupnost?
## US-32
## Definisanje prava pristupa bazi podataka
### Opis

Kao administrator, želim implementirati autentifikaciju i autorizaciju za pristup podacima, kako bi se osigurala sigurnost i privatnost informacija.

### Poslovna vrijednost:
Povećana zaštita osjetljivih podataka sprječava neovlašteni pristup i osigurava da informacije ostanu privatne. Sistem takođe omogućava kontrolu pristupa za različite tipove korisnika, čime se dodatno unapređuje sigurnost i organizacija rada.

### Prioritet:

Visok (High)

### Pretpostavke:
- Korisnici su registrovani u sistemu
- Sistem podržava različite uloge korisnika
### Otvorena pitanja:
- Koje uloge korisnika će biti definisane?
- Da li postoji centralizovana kontrola pristupa?
## US-33
## Testiranje baze podataka
### Opis

Kao QA inženjer, želim testirati bazu podataka da provjerim validnost podataka, veze između tabela i prava pristupa, kako bi sistem radio pouzdano.

### Poslovna vrijednost:
Ove funkcionalnosti garantuju da su podaci i veze u bazi ispravni, čime se smanjuje mogućnost grešaka u radu sistema. Kao rezultat, pouzdanost i kvalitet cijelog sistema značajno se povećavaju, što doprinosi sigurnijem i efikasnijem radu.

### Prioritet:

Visok (High)


### Pretpostavke:
- Baza podataka je kreirana i konfigurirana
- Prava pristupa su definisana
### Otvorena pitanja:
- Koje testove automatizirati, a koje ručno izvršiti?
- Kako dokumentovati rezultate testiranja?

| ID | Naziv Storya | Opis | Poslovna Vrijednost | Prioritet | Pretpostavke | Otvorena Pitanja | Veze / Zavisnosti |
|----|-------------|------|---------------------|-----------|--------------|------------------|-------------------|
| US-01 | Historija pregleda korisnika | Kao pacijent, želim da mogu pregledati historiju svojih pregleda, kako bih imao uvid u prethodne termine i zdravstvene nalaze. | Omogućava kvalitetniju evidenciju zdravstvenih podataka; doktori lakše donose informisane odluke; transparentnije praćenje liječenja. | Srednji | - Sistem vodi evidenciju svih pregleda; - Pacijent ima kreiran nalog | - Koji detalji pregleda se prikazuju? - Da li se prikazuju i otkazani termini? | US-03, US-06 |
| US-02 | Upravljanje sistemskim resursima | Kao administrator, želim da imam korisnički interfejs za administraciju, kako bih mogao upravljati korisnicima, terminima i resursima. | Jednostavno praćenje i upravljanje aktivnostima uz primjenu sistema kontrolisanih pristupnih prava | Visok | -Administrator ima kreiran i aktivan korisnički nalog u sistemu
-Sistem podržava definisane korisničke uloge
-Baza podataka sadrži osnovne entitete (korisnici, termini, resursi)
-Administrator ima ovlašten pristup svim administrativnim funkcijama
-Backend servis za upravljanje podacima je dostupan i funkcionalan | - Koje tačno funkcionalnosti su uključene u administrativni interfejs? | US-03, US-04, US-16, US-29 |
| US-03 | Login sistem | Kao korisnik, želim da se mogu sigurno prijaviti u sistem, kako bih pristupio personalizovanim i zaštićenim medicinskim podacima. | Visok nivo sigurnosti; personalizovan pristup podacima; zaštita osjetljivih medicinskih informacija. | Visok | - Korisnici imaju kreirane naloge; - Podaci su šifrovani i sigurni | - Koliko pokušaja login-a je dozvoljeno prije blokade? | US-14, US-17, US-22, US-23 |
| US-05 | Pregled dostupnih resursa | Kao pacijent, želim da vidim dostupne doktore i slobodne termine, kako bih odabrao najpogodniji termin za pregled. | Veća transparentnost rasporeda; pacijenti lakše donose odluke; brži proces zakazivanja. | Visok | - Termini su definisani u sistemu; - Podaci o doktorima su dostupni | - Da li se prikazuje zauzetost u realnom vremenu? | US-06, US-13 |
| US-06 | Rezervacija termina | Kao pacijent, želim da mogu rezervisati termin kod doktora na osnovu dostupnog rasporeda, kako bih osigurao pravovremeni pregled bez čekanja. | Jednostavno digitalno zakazivanje; smanjenje administrativnog opterećenja; veće zadovoljstvo pacijenata. | Visok | - Login je implementiran; - Postoje dostupni termini; - Validacija sprječava duple rezervacije | - Da li pacijent može rezervisati više termina dnevno? - Postoji li ograničenje? - Kako se označavaju hitni termini? | US-03, US-05, US-07, US-12 |
| US-07 | Email potvrda o rezervaciji | Kao pacijent, želim da dobijem email potvrdu nakon rezervacije termina, kako bih imao podsjetnik i dokaz zakazanog pregleda. | Smanjuje zaboravljanje termina; sistem djeluje pouzdanije; pozitivnije korisničko iskustvo. | Srednji | - Pacijent ima validnu email adresu; - Rezervacija je uspješno izvršena | - Koji detalji se prikazuju u emailu? - Da li se šalju i kasniji podsjetnici? | US-06, US-27 |
| US-08 | Otkazivanje termina (medicinsko osoblje) | Kao medicinsko osoblje, želim da mogu otkazati termine pacijenata, kako bih oslobodio termine u slučaju promjena u rasporedu. | Veća fleksibilnost u rasporedu; optimalna organizacija termina; smanjenje neiskorištenih termina. | Nizak | - Termin je već rezervisan; - Osoblje ima pristup panelu | - Koliko ranije se može izvršiti otkazivanje? - Da li se šalje obavijest pacijentu? | US-06, US-21 |
| US-09 | Otkazivanje termina (pacijent) | Kao pacijent, želim da mogu otkazati svoj termin, kako bih oslobodio termin u slučaju spriječenost dolaska. | Smanjenje neiskorištenih termina; bolje raspoređivanje resursa; veća fleksibilnost i zadovoljstvo pacijenata, kao i uposlenog osoblja. | Nizak | - Termin je već rezervisan; - Sistem vodi evidenciju svih termina | - Koliko ranije pacijent može otkazati termin? - Da li se šalje potvrda o otkazivanju? | US-06, US-03 |
| US-10 |Pregled rasporeda za doktora | Kao doktor, želim da imam pregled svog dnevnog i sedmičnog rasporeda, kako bih efikasno organizovao svoje obaveze. | Bolja organizacija svakodnevnog rada; smanjenje grešaka u rasporedu; veća produktivnost. | Nizak | - Termini su već definisani; - Doktor ima pristup svom panelu | - Da li doktor može mijenjati termine? - Da li vidi i historiju pregleda pacijenata? | US-13, US-21 |
| US-11 | Automatsko oslobađanje zaključanih termina | Kao sistem, želim automatski osloboditi termine koji nisu potvrđeni u određenom vremenu, kako bi se povećala dostupnost termina za druge pacijente. | Bolje iskorištenje termina; olakšava rad administracije i osoblja; efikasnije funkcionisanje sistema. | Nizak | - Postoje termini označeni kao "zaključani"; - Sistem prati status potvrđenosti | - Koliko vremena mora proći prije oslobađanja termina? | US-06, US-12 |
| US-12 | Validacija i sprječavanje duplih rezervacija | Kao sistem, želim spriječiti dupliranje termina u isto vrijeme za istog pacijenta, kako bih izbjegao konflikte i greške u rasporedu. | Precizna evidencija termina; smanjenje administrativnih grešaka; poboljšano iskustvo pacijenata i doktora. | Visok | - Pacijenti mogu rezervisati termine online; - Sistem prati sve postojeće rezervacije |  - Šta se dešava kod pokušaja duplog termina? | US-06, US-11 |
| US-14 | Reset lozinke putem emaila | Kao korisnik, želim da mogu resetovati lozinku putem emaila, kako bih mogao povratiti pristup svom nalogu ako zaboravim lozinku. | Povećana sigurnost naloga; samostalno rješavanje problema s loginom; smanjenje opterećenja podrške. | Srednji | - Korisnik ima validnu email adresu; - Sistem može slati emailove | - Koliko dugo je reset link validan? - Da li postoji limit pokušaja resetovanja? | US-03, US-23 |
| US-15 | Rezervacija termina kod specijaliste putem porodičnog doktora | Kao pacijent, želim da moj porodični doktor može rezervisati termin kod specijaliste u moje ime, kako bih dobio bržu i koordiniranu medicinsku uslugu. | Bolja koordinacija između doktora; smanjenje vremena čekanja; efikasniji proces zakazivanja. | Visok | - Porodični doktor ima pristup sistemu; - Specijalista je registrovan u sistemu | - Da li pacijent dobija obavijest o rezervaciji? - Može li pacijent potvrditi ili odbiti termin? | US-06, US-10, US-21 |
|US-16 | Pregled sistema i statistika | Kao odgovorna osoba ili vlasnik, želim da imam pregled ključnih statistika sistema (broj pacijenata, zakazanih termina, aktivnosti zaposlenih), kako bih mogao pratiti rad i donositi informisane odluke. | Omogućava bolji uvid u rad ustanove kroz statistike i analizu podataka, što doprinosi efikasnijem planiranju i organizaciji resursa. | Visok | - Korisnik sa menadžerskom ulogom ima pristup dashboardu; - Prikazuju se osnovne statistike sistema (termini, korisnici, aktivnosti) | - Koje tačno metrike su prioritetne? - Da li se podaci prikazuju u realnom vremenu ili periodično? | US-02, US-18, US-26 |
| US-17 | Automatska odjava | Kao korisnik, želim da me sistem automatski odjavi nakon određenog vremena neaktivnosti, kako bi se povećala sigurnost mog naloga. | Poboljšana sigurnost podataka; smanjen rizik od neovlaštenog pristupa; usklađenost sa sigurnosnim standardima. | Visok | - Sistem prati aktivnosti korisnika; - Login funkcionalnost je implementirana | - Koliko minuta neaktivnosti pokreće timeout? - Da li se prikazuje upozorenje prije odjave? | US-03, US-22, US-23 |
| US-18 | Logovanje svih akcija | Kao administrator, želim da sistem bilježi sve akcije i promjene unutar sistema, kako bih mogao pratiti i analizirati aktivnosti korisnika. | Veća sigurnost i transparentnost; lakše otkrivanje neovlaštenih radnji; bolja kontrola nad procesima. | Visok | - Sistem prati sve CRUD akcije; - Administratori imaju pristup audit logu | - Koliko dugo se čuvaju podaci u audit logu? - Ko sve ima pristup logovima? | US-02, US-16, US-32 |
| US-19 | Pregled komentara prilikom zakazivanja termina | Kao pacijent ili doktor, želim da mogu vidjeti napomene ili komentare vezane za termin, kako bih imao sve relevantne informacije prije pregleda. | Bolja komunikacija između pacijenata i osoblja; smanjenje nesporazuma; lakša priprema za pregled. | Srednji | - Komentari se unose prilikom rezervacije; - Korisnici imaju pristup detaljima termina | - Ko može unositi komentare? - Da li se komentari prikazuju samo doktoru ili i pacijentu? -POstoji li mogućnost odgovora na komentar?| US-06, US-21 |
| US-20 | Vodič za korištenje stranice | Kao pacijent ili doktor, želim da imam interaktivno uputstvo ili dokumentaciju, kako bih znao kako koristiti sistem. | Brže savladavanje sistema; smanjena potreba za podrškom; jednostavnije i ugodnije korisničko iskustvo. | Nizak | - Postoji osnovna dokumentacija; - Sistem može prikazivati upute u interaktivnom formatu | - Da li vodič uključuje video tutorijale ili samo tekst? - Da li se ažurira automatski? | – |
| US-21 | Panel medicinskog osoblja | Kao medicinsko osoblje, želim da imam panel sa kontrolama za upravljanje pregledima i terminima pacijenata, kako bih mogao efikasno organizovati svoj rad. | Bolja organizacija rada medicinskog osoblja; praćenje historije pacijenata; veća produktivnost i kvalitet njege. | Visok | - Medicinsko osoblje je registrovano i ima pristup sistemu; - Panel prikazuje relevantne termine i pacijente | - Da li panel uključuje opciju kreiranja novih termina? - Koje informacije o pacijentu su prikazane? | US-03, US-08, US-10, US-28 |
| US-22 | Two factor authentication (2FA) | Kao korisnik, želim da koristim dvofaktorsku autentifikaciju prilikom logina, kako bi moj nalog bio sigurniji. | Povećana sigurnost naloga; zaštita osjetljivih medicinskih podataka; veće povjerenje u sistem. | Visok | - Korisnik ima validan email ili broj telefona; - Sistem podržava login autentifikaciju | - Koji tip 2FA će se koristiti (SMS, email, aplikacija)? - Da li je 2FA obavezna ili opcionalna? | US-03, US-17, US-23 |
| US-23 | Detekcija neobičnog ponašanja| Kao sistem, želim automatski blokirati naloge nakon više neuspješnih pokušaja logina, kako bih zaštitio korisničke podatke. | Visok nivo sigurnosti; zaštita osjetljivih informacija pacijenata; smanjena mogućnost neovlaštenog pristupa. | Srednji | - Login sistem prati broj neuspješnih pokušaja; - Korisnici imaju način da povrate pristup | - Koliko pokušaja je dozvoljeno prije blokade? - Da li se šalje upozorenje prije blokade? | US-03, US-14, US-17 |
| US-24 | Enkripcija osjetljivih podataka | Kao sistem, želim da enkriptujem osjetljive zdravstvene podatke, kako bih zaštitio privatnost pacijenata i osigurao sigurnost informacija. | Povećana zaštita podataka; usklađenost sa zakonima o zaštiti podataka; smanjenje rizika od curenja informacija. | Visok | - Podaci pacijenata se čuvaju u bazi; - Sistem podržava enkripciju  | - Koji algoritam enkripcije će se koristiti? - Da li se enkripcija primjenjuje i na backup-e? | US-31, US-32, US-33 |
| US-25 | Označavanje hitnosti prijavljenog termina | Kao medicinsko osoblje, želim imati mogućnost označiti hitne pacijente u sistemu, kako bi prioritetni termini bili obrađeni odmah. | Pravovremena obrada hitnih pacijenata; povećana efikasnost medicinskog osoblja; smanjen rizik od propusta u urgentnim situacijama. | Srednji | - Sistem prepoznaje urgentne slučajeve; - Korisnici imaju pristup vizuelnom označavanju | - Koji kriterijumi određuju hitnost? - Da li pacijent vidi da je termin označen kao hitan? | US-06, US-21 |
| US-27 | Automatski podsjetnik | Kao pacijent, želim da sistem automatski šalje podsjetnike pacijentima sa hroničnim bolestima, kako bi se smanjila zaboravljena zakazivanja pregleda. | Veća prisutnost pacijenata na terminima; kontinuitet liječenja; smanjenje administrativnog posla. | Nizak | - Pacijent ima označen atribut "hronični bolesnik"; - Sistem može slati emailove | - Koliko često se šalje podsjetnik? - Da li se šalje i putem SMS-a? | US-07, US-06 |

| US-31 | Kreiranje baze podataka | Kao sistem administrator, želim implementirati bazu podataka u stvarnom okruženju, kako bi sistem mogao pohranjivati sve podatke pacijenata, termina i korisnika. | Centralizovano čuvanje podataka; konzistentnost i integritet podataka; pouzdano funkcionisanje sistema. | Visok | - ER model baze je definisan; - Sistemski zahtjevi su poznati | - Koji tip baze podataka se koristi? | US-30, US-32, US-33 |
| US-32 | Definisanje prava pristupa bazi podataka | Kao administrator, želim implementirati autentifikaciju i autorizaciju za pristup podacima, kako bi se osigurala sigurnost i privatnost informacija. | Povećana zaštita osjetljivih podataka; kontrola pristupa za različite tipove korisnika; unapređenje sigurnosti. | Visok | - Korisnici su registrovani u sistemu; - Sistem podržava različite uloge korisnika | - Koje uloge korisnika će biti definisane? - Da li postoji centralizovana kontrola pristupa? | US-31, US-24, US-03 |
|



