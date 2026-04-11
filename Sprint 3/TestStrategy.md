# Test Strategy

## Cilj testiranja  

| **Cilj testiranja** | **Kako se mjeri uspjeh** |
|---------------------|--------------------------|
|Verifikacija da sistem ne dozvoljava neovlašten pristup podacima| Korisnik bez odgovarajuće uloge ne može pristupiti odgovarajućim podacima, sistem ga preusmjerava na login|
|Potvrditi ispravnost rada sistema na različitim web preglednicima||
|Verificirati da sistem ispravno autentificira korisnike i preusmjerava ih prema ulozi  | |
| Ustanoviti da sistem blokira nalog nakon 5 neuspješnih pokušaja  prijave                                                                                          ||
|Potvrditi da sistem automatski odjavi korisnika nakon 15 minuta neaktivnosti||
|Potvrditi da su osjetljivi podaci enkriptovani  heshirani||
|Potvrditi da sistem sprječava duple rezervacije||
|Potvrditi da sistem ispravno zaključava termin na 2 minute i oslobađa ga nakon 2 minute u slučaju da se termin ne potvrdi||
|Potvrditi da sistem ne dozvoljava otkazivanje termina 24 h prije||
| Potvrditi da medicinsko osoblje može otkazati termin bilo kad uz slanje obavijesti pacijentu||
|Potvrditi da pacijent dobija podjsetnik 24 h prije termina ||
| Potvrditi da pacijent dobije email prilikom otkazivanja termina||
|Potvrditi ispravnost prikaza historije pregleda pacijenata prilikom sortiranja, prikaza detalja pregleda i otkazanih termina||
|Potvrditi da audit log bilježi sve akcije korisnika sa tačnim podacima i da je dostupan samo administratoru||
|Provjeriti ispravnost unosa, prikaza, brisanja i izmjene komentara||
|Verificirati da li menadžment panel ispravno prikazuje kapacitet, zauzetost doktora i sala, rezervisane i otkazane termine||
|Potvrditi ispravnost procesa resetovanja lozinke putem emaila uključujući validnost linka i limit pokušaja||
|Potvrditi ispravnost označavanja hitnih termina||
|Potvrditi da neuspješne operacije ne ostavljaju bazu u nekonzistentnom stanju||
|Potvrditi da se promjene u zauzetosti termina prikazuju u realnom vremenu bez kašenjenja||
|Potvrditi da sistem osigurava 99% dostupnosti u toku radnog vremena klinike||
|Potvrditi slanje email obaijesti nakon uspješne rezervacije||
|Potvrditi ispravnost eksporta podataka u CSV formatu||
|Potvrditi da sistem odgovara u prihvatljivom vremenu pod normalnim i povećanim opterećenjem ||
## Nivoi testiranja

| Nivo testiranja | Cilj | Odgovorna osoba | Alati | Frekvencija | Ulazni kriteriji | Izlazni kriteriji | Kriterij prihvaćanja |
|-----------------|------|-----------------|-------|-------------|------------------|-------------------|----------------------|

## Šta se testira na kojem nivou

| Funkcionalnost | Unit | Integraciono | Sistemsko | UI | Sigurnosno | Performanse | Kompatibilnost | UAT |
|---|---|---|---|---|---|---|---|---|

## Veza sa acceptance kriterijima

| Zahtjev | Acceptance Criteria ID (ili samo AC) | Test Case ID | Nivo testiranja | Status |
|---|---|---|---|---|

## Način evidentiranja rezultata testiranja 
| ID testa | Naziv / Opis testa | Ulazni podaci | Očekivani rezultat | Stvarni rezultat | Status | ID buga | Opis greške | Prioritet greške | Napomena |
|---|---|---|---|---|---|---|---|---|---|
| TC-01 |  |  |  |  |  |  |  |  |  |
| TC-02 |  |  |  |  |  |  |  |  |  |
| TC-03 |  |  |  |  |  |  |  |  |  |

## Glavni rizici kvaliteta

- Opis rizika: Kratak opis potencijalog problema  
- Vjerovatnoća (1-5): Koliko je vjerovatno da se rizik dogodi (1 = malo, 5 = sigurno).
- Uticaj (1-5): Koliko bi problem uticao na sistem (1 = minimalno, 5 = kritično).
- Nivo rizika (V * U): Proizvod vjerovatnoće i uticaja, od 1 do 25.
- Prioritet testiranja: Na osnovu nivoa rizika, određuje se prioritet (visoki/srednji/niski).
- Mjere ublažavanja: Konkretne akcije za smanjenje rizika


| ID rizika | Opis rizika | Vjerovatnoća (1-5) | Uticaj (1-5) | Nivo rizika (V×U) | Prioritet testiranja | Mjere ublažavanja |
|---|---|---|---|---|---|---|
| R-01 | | | | | | |