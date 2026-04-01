# ID Storyja: US-01
## Naziv storyja: Historija pregleda korisnika
## Opis

Kao pacijent, želim da mogu pregledati historiju svojih pregleda, kako bih imao uvid u prethodne termine i zdravstvene nalaze.

## Poslovna vrijednost:
Omogućava bolju evidenciju zdravstvenih podataka pacijenta
Pomaže doktorima u donošenju informisanih odluka
Poboljšava transparentnost i praćenje liječenja

## Prioritet:

Srednji (Medium)

## Pretpostavke i otvorena pitanja:
## Pretpostavke:
- Sistem vodi evidenciju svih pregleda
- Pacijent ima kreiran nalog
## Otvorena pitanja:
- Koji detalji pregleda se prikazuju (samo datum ili i opis terapije)?
- Da li se prikazuju i otkazani termini?

# ID Storyja: US-02
## Naziv storyja: Admin panel - frontend
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

# ID Storyja: US-03
## Naziv storyja: Admin panel - registracija pacijenta
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
# ID Storyja: US-04
## Naziv storyja: Login sistem
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
# ID Storyja: US-05
## Naziv storyja: Pregled dostupnih resursa
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
# ID Storyja: US-06
## Naziv storyja: Rezervacija termina
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
# ID Storyja: US-07
## Naziv storyja: Email potvrda o rezervaciji
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
# ID Storyja: US-08
## Naziv storyja: Otkazivanje termina (medicinsko osoblje)
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
# ID Storyja: US-09
## Naziv storyja: Otkazivanje termina (pacijent)
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
# ID Storyja: US-10
## Naziv storyja: Dashboard za doktora – pregled rasporeda
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



# ID Storyja: US-11
## Naziv storyja: Automatsko oslobađanje zaključanih termina
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
- Da li pacijent dobija obavijest o oslobađanju termina?
# ID Storyja: US-12
## Naziv storyja: Validacija i sprječavanje duplih rezervacija
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
# ID Storyja: US-13
## Naziv storyja: Upravljanje radnim vremenom doktora (admin)
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
# ID Storyja: US-14
## Naziv storyja: Reset lozinke putem emaila
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
# ID Storyja: US-15
## Naziv storyja: Rezervacija termina kod specijaliste putem doktora porodične medicine
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
# ID Storyja: US-16
## Naziv storyja: Menadžment panel
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
# ID Storyja: US-17
## Naziv storyja: Automatska odjava nakon perioda neaktivnosti (session timeout)
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
# ID Storyja: US-18
## Naziv storyja: Logovanje svih akcija u sistemu (audit log)
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
# ID Storyja: US-19
## Naziv storyja: Omogućavanje pregleda komentara prilikom zakazivanja termina
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
# ID Storyja: US-20
# Naziv storyja: Vodič za korištenje stranice
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

# ID Storyja: US-21

## Naziv storyja: Rezervacija termina

## Opis
Kao pacijent, želim da mogu rezervisati termin kod doktora na osnovu dostupnog rasporeda, kako bih osigurao pravovremeni pregled bez čekanja.
## Poslovna vrijednost:

Ova funkcionalnost predstavlja osnovu sistema jer:
- omogućava digitalno zakazivanje pregleda
- smanjuje administrativno opterećenje
- poboljšava organizaciju rada doktora
- povećava zadovoljstvo pacijenata

Bez ove funkcionalnosti sistem nema svoju ključnu svrhu.

## Prioritet:

Visok (High)

## Pretpostavke i otvorena pitanja:

### Pretpostavke:
- Sistem već ima implementiran login (KAN-11)
- Postoje dostupni termini (KAN-12)
- Validacija sprječava duple rezervacije (KAN-19)


### Otvorena pitanja:
- Da li pacijent može rezervisati više termina dnevno?
- Da li postoji ograničenje po specijalisti?
- Kako se označavaju hitni termini (KAN-33)?
