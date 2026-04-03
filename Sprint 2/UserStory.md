# User Story

## US-01
## Historija pregleda korisnika
## Opis

Kao pacijent, želim da mogu pregledati historiju svojih pregleda, kako bih imao uvid u prethodne termine i zdravstvene nalaze.

## Poslovna vrijednost:
- Omogućava bolju evidenciju zdravstvenih podataka pacijenta
- Pomaže doktorima u donošenju informisanih odluka
- Poboljšava transparentnost i praćenje liječenja

## Prioritet:

Srednji (Medium)

## Pretpostavke i otvorena pitanja:
## Pretpostavke:
- Sistem vodi evidenciju svih pregleda
- Pacijent ima kreiran nalog
## Otvorena pitanja:
- Koji detalji pregleda se prikazuju (samo datum ili i opis terapije)?
- Da li se prikazuju i otkazani termini?

## US-02
## Admin panel
## Opis

Kao administrator, želim da imam korisnički interfejs za administraciju, kako bih mogao upravljati korisnicima, terminima i resursima.

## Poslovna vrijednost:
- Omogućava efikasno upravljanje sistemom
- Smanjuje potrebu za ručnim unosom podataka
- Povećava produktivnost administrativnog osoblja
## Prioritet:

Visok (High)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Backend funkcionalnosti već postoje (KAN-37)
- Administrator ima pristup sistemu
### Otvorena pitanja:
- Koje funkcionalnosti treba prikazati u frontend panelu?
- Da li je potrebna autentifikacija za pristup panelu?

## US-03
## Admin panel - registracija pacijenta
## Opis

Kao administrator, želim da mogu registrovati nove pacijente, kako bi oni mogli koristiti sistem.

## Poslovna vrijednost:
- Omogućava kontrolisan unos korisnika
- Povećava tačnost podataka
- Omogućava pacijentima pristup funkcionalnostima sistema
## Prioritet:

Visok (High)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Administrator ima pristup admin panelu
- Sistem validira podatke unosa
### Otvorena pitanja:
- Da li pacijent može samostalno registrovati nalog?
- Koji su obavezni podaci za registraciju?
## US-04
## Login sistem
## Opis

Kao pacijent ili doktor, želim da se mogu prijaviti u sistem koristeći svoje kredencijale, kako bih pristupio svojim funkcionalnostima.

## Poslovna vrijednost:
- Osigurava sigurnost sistema
- Omogućava personalizovan pristup podacima
- Štiti osjetljive medicinske informacije
## Prioritet:

Visok (High)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
Korisnici imaju kreirane naloge (KAN-10)
Podaci su šifrovani i sigurni
### Otvorena pitanja:
Da li je obavezna dvofaktorska autentifikacija (KAN-29)?
Koliko pokušaja login-a je dozvoljeno prije blokade (KAN-30)?
## US-05
## Pregled dostupnih resursa
## Opis

Kao pacijent, želim da vidim dostupne doktore i slobodne termine, kako bih odabrao najpogodniji termin za pregled.

## Poslovna vrijednost:
- Omogućava transparentnost rasporeda
- Olakšava donošenje odluka pacijentu
- Povećava efikasnost zakazivanja termina
## Prioritet:

Visok (High)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Termini su definisani u sistemu
- Podaci o doktorima su dostupni
### Otvorena pitanja:
- Može li pacijent filtrirati po specijalizaciji doktora?
- Da li se prikazuje zauzetost termina u realnom vremenu?
##  US-06
## Rezervacija termina
## Opis

Kao pacijent, želim da mogu rezervisati termin kod doktora na osnovu dostupnog rasporeda, kako bih osigurao pravovremeni pregled bez čekanja.

## Poslovna vrijednost:
- Omogućava digitalno zakazivanje pregleda
- Smanjuje administrativno opterećenje
- Povećava zadovoljstvo pacijenata
## Prioritet:

Visok (High)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Sistem već ima implementiran login (KAN-11)
- Postoje dostupni termini (KAN-12)
- Validacija sprječava duple rezervacije (KAN-19)
### Otvorena pitanja:
- Da li pacijent može rezervisati više termina dnevno?
- Postoji li ograničenje po specijalisti?
- Kako se označavaju hitni termini (KAN-33)?
## US-07
## Email potvrda o rezervaciji
## Opis

Kao pacijent, želim da dobijem email potvrdu nakon rezervacije termina, kako bih imao podsjetnik i dokaz zakazanog pregleda.

## Poslovna vrijednost:
- Smanjuje zaboravljanje termina
- Povećava pouzdanost sistema
- Poboljšava korisničko iskustvo
## Prioritet:

Srednji (Medium)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
### Pacijent ima validnu email adresu
- Rezervacija je uspješno izvršena
### Otvorena pitanja:
- Koji detalji se prikazuju u emailu?
- Da li se šalju i kasniji podsjetnici?
## US-08
## Otkazivanje termina (medicinsko osoblje)
## Opis

Kao medicinsko osoblje, želim da mogu otkazati termine pacijenata, kako bih oslobodio termine u slučaju promjena u rasporedu.

## Poslovna vrijednost:
- Omogućava fleksibilnost u rasporedu
- Pomaže u optimalnoj organizaciji termina
- Smanjuje neiskorištene termine
## Prioritet:

Nizak (Low)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Termin je već rezervisan
- Osoblje ima pristup panelu medicinskog osoblja (KAN-28)
### Otvorena pitanja:
- Koliko ranije se može izvršiti otkazivanje?
- Da li se šalje obavijest pacijentu?
## US-09
##  Otkazivanje termina (pacijent)
## Opis
Kao pacijent, želim da mogu otkazati svoj termin, kako bih oslobodio termin u slučaju spriječenosti.

## Poslovna vrijednost:
- Smanjuje broj neiskorištenih termina
- Omogućava bolju iskorištenost resursa
- Povećava fleksibilnost i zadovoljstvo pacijenata
## Prioritet:

Nizak (Low)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Termin je već rezervisan
- Sistem vodi evidenciju svih termina
### Otvorena pitanja:
- Koliko ranije pacijent može otkazati termin?
- Da li se šalje potvrda o otkazivanju?
##  US-10
## Dashboard za doktora – pregled rasporeda
## Opis

Kao doktor, želim da imam pregled svog dnevnog i sedmičnog rasporeda, kako bih efikasno organizovao svoje obaveze.

## Poslovna vrijednost:
- Omogućava bolju organizaciju rada
- Smanjuje greške u rasporedu
- Povećava produktivnost i planiranje radnog dana
## Prioritet:

Nizak (Low)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Termini su već definisani
- Doktor ima pristup svom panelu (KAN-28)
### Otvorena pitanja:
- Da li doktor može mijenjati termine?
- Da li vidi i historiju pregleda pacijenata?



## US-11
## Automatsko oslobađanje zaključanih termina
## Opis

Kao sistem, želim automatski osloboditi termine koji nisu potvrđeni u određenom vremenu, kako bi se povećila dostupnost termina za druge pacijente.

## Poslovna vrijednost:
- Povećava iskorištenost termina
- Smanjuje zastoje i neiskorištene resurse
- Olakšava rad administracije i medicinskog osoblja
## Prioritet:

Nizak (Low)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Postoje termini označeni kao “zaključani”
- Sistem prati status potvrđenosti termina
### Otvorena pitanja:
- Koliko vremena mora proći prije oslobađanja termina?

## US-12
## N Validacija i sprječavanje duplih rezervacija
## Opis

Kao sistem, želim spriječiti dupliranje termina u isto vrijeme za istog pacijenta, kako bih izbjegao konflikte i greške u rasporedu.

## Poslovna vrijednost:
- Osigurava tačnost evidencije termina
- Smanjuje administrativne greške
- Poboljšava iskustvo pacijenata i doktora
## Prioritet:

Visok (High)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Pacijenti mogu rezervisati termine online (KAN-06)
- Sistem prati sve postojeće rezervacije
### Otvorena pitanja:
- Da li se validacija odnosi i na specijaliste i porodične doktore?
- Šta se dešava ako pacijent pokuša rezervisati dupli termin?
## US-13
## Upravljanje radnim vremenom doktora (admin)
## Opis

Kao administrator, želim da mogu upravljati radnim vremenom doktora, kako bi se termini mogli pravilno planirati i zakazivati.

## Poslovna vrijednost:
- Omogućava bolju organizaciju rasporeda doktora
- Povećava iskorištenost resursa
- Smanjuje greške u zakazivanju
## Prioritet:

Visok (High)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Administrator ima pristup admin panelu (KAN-02)
- Doktor je registrovan u sistemu
### Otvorena pitanja:
- Da li doktor može sam mijenjati svoje radno vrijeme?
- Kako se tretiraju vanredni i hitni termini?
## US-14
##  Reset lozinke putem emaila
## Opis

Kao korisnik, želim da mogu resetovati lozinku putem emaila, kako bih mogao povratiti pristup svom nalogu ako zaboravim lozinku.

## Poslovna vrijednost:
- Povećava sigurnost korisničkog naloga
- Omogućava samostalno rješavanje problema sa loginom
- Smanjuje opterećenje podrške
## Prioritet:

Srednji (Medium)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Korisnik ima validnu email adresu
- Sistem može slati emailove
### Otvorena pitanja:
- Koliko dugo je reset link validan?
- Da li postoji limit pokušaja resetovanja?
## US-15
##  Rezervacija termina kod specijaliste putem doktora porodične medicine
## Opis

Kao pacijent, želim da moj porodični doktor može rezervisati termin kod specijaliste u moje ime, kako bih dobio bržu i koordiniranu medicinsku uslugu.

## Poslovna vrijednost:
- Omogućava koordinaciju između doktora
- Smanjuje vrijeme čekanja pacijenta
- Povećava efikasnost u sistemu zakazivanja
## Prioritet:

Visok (High)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Porodični doktor ima pristup sistemu
- Specijalista je registrovan u sistemu
### Otvorena pitanja:
- Da li pacijent dobija obavijest o rezervaciji?
- Može li pacijent potvrditi ili odbiti termin?
## US-16
## Menadžment panel
## Opis

Kao administrator, želim imati centralizovani menadžment panel za nadzor i upravljanje sistemom, kako bih mogao pratiti sve aktivnosti i resurse.

# Poslovna vrijednost:
- Omogućava centralizovanu kontrolu sistema
- Povećava efikasnost administracije
- Olakšava praćenje termina i aktivnosti korisnika
## Prioritet:

Visok (High)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Administrator ima pristup sistemu
- Panel prikazuje sve ključne informacije o korisnicima i terminima
### Otvorena pitanja:
- Koji podaci su prioritetni za prikaz?
- Da li se menadžment panel koristi i za izvještavanje?
## US-17
## Automatska odjava nakon perioda neaktivnosti (session timeout)
## Opis

Kao korisnik, želim da me sistem automatski odjavi nakon određenog vremena neaktivnosti, kako bi se povećala sigurnost mog naloga.

## Poslovna vrijednost:
- Povećava sigurnost podataka
- Smanjuje rizik od neovlaštenog pristupa
- Osigurava usklađenost sa sigurnosnim standardima
## Prioritet:

Visok (High)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Sistem prati aktivnosti korisnika
- Login funkcionalnost je implementirana
### Otvorena pitanja:
- Koliko minuta neaktivnosti pokreće timeout?
- Da li se korisniku prikazuje upozorenje prije odjave?
## US-18
## Logovanje svih akcija u sistemu (audit log)
## Opis

Kao administrator, želim da sistem bilježi sve akcije i promjene unutar sistema, kako bih mogao pratiti i analizirati aktivnosti korisnika.

## Poslovna vrijednost:
- Povećava sigurnost i transparentnost
- Omogućava reviziju i praćenje grešaka
- Pomaže u otkrivanju neovlaštenih aktivnosti
## Prioritet:

Visok (High)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Sistem prati sve CRUD akcije
- Administratori imaju pristup audit logu
### Otvorena pitanja:
- Koliko dugo se čuvaju podaci u audit logu?
- Ko sve ima pristup logovima?
## US-19
## Omogućavanje pregleda komentara prilikom zakazivanja termina
## Opis

Kao pacijent ili doktor, želim da mogu vidjeti napomene ili komentare vezane za termin, kako bih imao sve relevantne informacije prije pregleda.

## Poslovna vrijednost:
- Povećava kvalitet komunikacije
- Smanjuje nesporazume u zakazivanju
- Olakšava pripremu za pregled
## Prioritet:

Srednji (Medium)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Komentari se unose prilikom rezervacije termina
- Korisnici imaju pristup detaljima termina
### Otvorena pitanja:
- Ko može unositi komentare?
- Da li se komentari prikazuju samo doktoru ili i pacijentu?
## US-20
## Vodič za korištenje stranice
## Opis

Kao pacijent ili doktor, želim da imam interaktivno uputstvo ili dokumentaciju, kako bih znao kako koristiti sistem.

## Poslovna vrijednost:
- Pomaže korisnicima da brže nauče koristiti sistem
- Smanjuje potrebu za podrškom
- Poboljšava korisničko iskustvo
## Prioritet:

Nizak (Low)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Postoji osnovna dokumentacija sistema
- Sistem može prikazivati upute u interaktivnom formatu
### Otvorena pitanja:
- Da li vodič uključuje video tutorijale ili samo tekst?
- Da li se vodič ažurira automatski sa novim funkcionalnostima?


## US-21
##  Panel medicinskog osoblja
## Opis

Kao medicinsko osoblje, želim da imam panel sa kontrolama za upravljanje pregledima i terminima pacijenata, kako bih mogao efikasno organizovati svoj rad.

## Poslovna vrijednost:
- Omogućava bolju organizaciju rada medicinskog osoblja
- Povećava produktivnost i smanjuje greške u rasporedu
- Omogućava praćenje historije pacijenata
## Prioritet:

Visok (High)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Medicinsko osoblje je registrovano i ima pristup sistemu
- Panel prikazuje relevantne termine i pacijente
### Otvorena pitanja:
- Da li panel uključuje opciju kreiranja novih termina?
- Koje informacije o pacijentu su prikazane?
## US-22
##  Two factor authentication
## Opis

Kao korisnik, želim da koristim dvofaktorsku autentifikaciju prilikom logina, kako bi moj nalog bio sigurniji.

## Poslovna vrijednost:
- Povećava sigurnost korisničkog naloga
- Smanjuje rizik od neovlaštenog pristupa
- Pomaže u zaštiti osjetljivih medicinskih podataka
## Prioritet:

Visok (High)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Korisnik ima aktivan email ili telefon za 2FA
- Login sistem je implementiran (KAN-11)
### Otvorena pitanja:
- Koji tip 2FA će se koristiti (SMS, email, aplikacija)?
- Da li je 2FA obavezna za sve korisnike ili opcionalna?
##  US-23
##   Detekcija neobičnog ponašanja - blokiranje naloga
## Opis

Kao sistem, želim automatski blokirati naloge nakon više neuspješnih pokušaja logina, kako bi zaštitio korisničke podatke.

## Poslovna vrijednost:
- Povećava sigurnost sistema
- Štiti osjetljive informacije pacijenata
- Smanjuje mogućnost neovlaštenog pristupa
## Prioritet:

Visok (High)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Login sistem prati broj neuspješnih pokušaja
- Korisnici imaju način da povrate pristup (KAN-21)
### Otvorena pitanja:
- Koliko pokušaja je dozvoljeno prije blokade?
- Da li se korisniku šalje upozorenje prije blokade?
## US-24
## Enkripcija osjetljivih podataka
## Opis

Kao sistem, želim da enkriptujem osjetljive zdravstvene podatke, kako bi zaštitio privatnost pacijenata i osigurao sigurnost informacija.

## Poslovna vrijednost:
- Povećava sigurnost podataka
- Omogućava usklađenost sa zakonima o zaštiti podataka
- Smanjuje rizik od curenja osjetljivih informacija
## Prioritet:

Visok (High)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Podaci pacijenata se čuvaju u bazi
- Sistem podržava enkripciju na nivou baze ili aplikacije
### Otvorena pitanja:
- Koji algoritam enkripcije će se koristiti?
- Da li se enkripcija primjenjuje i na backup-e?
##  US-25
## Označavanje hitnosti prijavljenog termina
## Opis

Kao administrator ili medicinsko osoblje, želim vizuelno označiti hitne pacijente u sistemu, kako bi prioritetni termini bili obrađeni odmah.

## Poslovna vrijednost:
- Omogućava pravovremenu obradu hitnih pacijenata
- Povećava efikasnost rada medicinskog osoblja
- Smanjuje rizik od propusta u hitnim slučajevima
## Prioritet:

Srednji (Medium)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Sistem prepoznaje urgentne slučajeve
- Korisnici imaju pristup vizuelnom označavanju
### Otvorena pitanja:
- Koji kriterijumi određuju hitnost?
- Da li pacijent vidi da je njegov termin označen kao hitan?
## US-26
## Export statistike zdravstvene ustanove
## Opis

Kao administrator, želim eksportovati statistiku zakazanih pregleda doktora u CSV formatu, kako bih mogao analizirati podatke i planirati resurse.

## Poslovna vrijednost:
- Omogućava bolju analizu podataka
- Pomaže u planiranju resursa i rasporeda
- Olakšava izvještavanje i donošenje odluka
## Prioritet:

Nizak (Low)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Podaci o terminima i doktorima su pohranjeni u bazi
- Sistem može generisati CSV fajl
### Otvorena pitanja:
- Da li se eksport vrši periodično ili na zahtjev?
- Ko ima pristup eksportovanim podacima?
## US-27
##  Automatski podsjetnik
## Opis

Kao pacijent, želim da sistem automatski šalje podsjetnike pacijentima sa hroničnim bolestima, kako bi se smanjila zaboravljena zakazivanja pregleda.

## Poslovna vrijednost:
- Povećava prisutnost pacijenata na terminima
- Poboljšava kontinuitet liječenja
- Smanjuje administrativni posao slanja podsjetnika ručno
## Prioritet:

Nizak (Low)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Pacijent ima označen atribut “hronični bolesnik”
- Sistem može slati emailove
### Otvorena pitanja:
- Koliko često se šalje podsjetnik?
- Da li se podsjetnik šalje i putem SMS-a?
## US-28
##  Upload i evidencija laboratorijskih nalaza
## Opis

Kao medicinsko osoblje, želim dodavati PDF nalaze ili vrijednosti u historiju pregleda pacijenata, kako bi podaci bili kompletni i dostupni za buduće preglede.

## Poslovna vrijednost:
- Omogućava detaljniju evidenciju pacijenata
- Pomaže doktorima u analizi i praćenju bolesti
- Smanjuje rizik od gubitka podataka
## Prioritet:

Srednji (Medium)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Pacijent ima nalaze spremne za upload
- Sistem omogućava sigurno pohranjivanje fajlova
### Otvorena pitanja:
- Koji tip fajlova je dozvoljen?
- Koliko dugo se čuvaju uploadovani fajlovi?
## US-29
## Admin panel - backend
## Opis

Kao backend developer, želim razviti backend funkcionalnosti za admin panel, kako bi administratori mogli upravljati korisnicima, terminima i resursima.

## Poslovna vrijednost:
- Omogućava efikasan rad admin panela
- Omogućava skalabilnost sistema
- Povećava sigurnost i kontrolu nad podacima
## Prioritet:

Visok (High)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Baza podataka je spremna (KAN-38, KAN-39)
- API-jevi za frontend su planirani
### Otvorena pitanja:
- Koje funkcionalnosti backend treba podržati prvo?
- Da li će biti REST ili GraphQL API?
## US-30
##  Kreirati ER model baze podataka
## Opis

Kao sistem dizajner, želim definisati entitete, atribute, relacije, primarne i strane ključeve, kako bi baza podataka bila pravilno strukturirana i spremna za implementaciju.

## Poslovna vrijednost:
- Omogućava ispravno funkcionisanje sistema
- Pomaže u validaciji poslovnih procesa
- Smanjuje rizik od grešaka pri implementaciji baze
## Prioritet:

Visok (High)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Postoji produkt backlog sa svim funkcionalnostima
- Sistemski zahtjevi su jasno definirani
### Otvorena pitanja:
- Koji tip baze podataka će se koristiti (SQL/NoSQL)?
- Da li će model podržavati buduća proširenja sistema?

## US-31
##  Kreiranje baze podataka
## Opis

Kao sistem administrator, želim implementirati bazu podataka u stvarnom okruženju, kako bi sistem mogao pohranjivati sve podatke pacijenata, termina i korisnika.

## Poslovna vrijednost:
- Omogućava centralizovano čuvanje podataka
- Osigurava konzistentnost i integritet podataka
- Podržava sve funkcionalnosti sistema
## Prioritet:

Visok (High)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- ER model baze je definisan (US-30)
- Sistemski zahtjevi su poznati
### Otvorena pitanja:
- Koji tip baze podataka se koristi (SQL/NoSQL)?
- Da li je potrebna replikacija za veću dostupnost?
## US-32
## Definisanje prava pristupa bazi podataka
## Opis

Kao administrator, želim implementirati autentifikaciju i autorizaciju za pristup podacima, kako bi se osigurala sigurnost i privatnost informacija.

## Poslovna vrijednost:
- Povećava sigurnost osjetljivih podataka
- Sprečava neovlašteni pristup
- Omogućava kontrolu pristupa različitim tipovima korisnika
## Prioritet:

Visok (High)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Korisnici su registrovani u sistemu
- Sistem podržava različite uloge korisnika
### Otvorena pitanja:
- Koje uloge korisnika će biti definisane?
- Da li postoji centralizovana kontrola pristupa?
## US-33
## Testiranje baze podataka
## Opis

Kao QA inženjer, želim testirati bazu podataka da provjerim validnost podataka, veze između tabela i prava pristupa, kako bi sistem radio pouzdano.

## Poslovna vrijednost:
- Osigurava ispravnost podataka i veza u bazi
- Sprečava greške u radu sistema
- Povećava pouzdanost i kvalitet sistema
## Prioritet:

Visok (High)

## Pretpostavke i otvorena pitanja:
### Pretpostavke:
- Baza podataka je kreirana i konfigurirana
- Prava pristupa su definisana
### Otvorena pitanja:
- Koje testove automatizirati, a koje ručno izvršiti?
- Kako dokumentovati rezultate testiranja?


