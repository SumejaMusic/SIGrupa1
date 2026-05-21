# Sprint Backlog 9

> **Napomena:** Sprint 9 je proširen u odnosu na inicijalni plan. Uz originalne stavke (US-24, US-11, US-28, US-01, US-32) dodane su nove user storije (US-38 – US-42), ispravci bugova i dopune funkcionalnosti identificirane tokom prethodnih sprintova.

---

## Sprint cilj

Dovršiti panele za medicinsko osoblje i doktore u cijelosti, uvesti upravljanje profilima korisnika s ispravnim formatiranjem podataka, implementirati role-based pristup, riješiti identifikovane bugove te dodati nove funkcionalnosti za listu čekanja, ocjenjivanje doktora, deaktivaciju profila i grafički prikaz zauzetosti kabineta.

---

## Pregled stavki

| ID | Naziv | Tip | Član tima | Procjena (SP) |
|:---|:------|:----|:----------|:-------------|
| US-24 | Panel medicinskog osoblja | User Story |  | 5 |
| US-32 | Upload i evidencija laboratorijskih nalaza | User Story |  | 3 |
| US-11 | Dashboard za doktora – kompletna logika | User Story |  | 5 |
| US-28 | Označavanje hitnosti termina | User Story |  | 2 |
| US-01 | Historija pregleda korisnika | User Story |  | 3 |
| US-31-EXT | Označavanje pacijenta kao hronični bolesnik + SMS podsjetnik | Proširenje US-31 |  | 3 |
| US-36 | Role-based prijavljivanje na sistem | User Story |  | 5 |
| BUG-01 | Komentar bug u bazi | Bug fix |  | 2 |
| BUG-01 | Server | Bug fix |  | 2 |
| BUG-02 | Bug kod registracije – slanje verifikacijskog koda | Bug fix |  | 2 |
| BUG-03 | Profil korisnika – format datuma dd/mm/yyyy | Bug fix |  | 1 |
| US-38 | Lista čekanja za termine | Nova User Story |  | 5 |
| US-39 | Grafički prikaz zauzetosti specijalističkih kabineta | Nova User Story |  | 3 |
| US-40 | Zahtjev za deaktivaciju i anonimizaciju profila | Nova User Story |  | 5 |
| US-41 | Obavijest pacijentu o otkazanom/pomjerenom terminu | Nova User Story |  | 3 |
| US-42 | Anonimna ocjena i komentar na rad doktora | Nova User Story |  | 5 |
| US-43 | Profil korisnika – frontend + mapa | Nova User Story |  | 3 |
|  |Admin panela - osonovne funkcionalnsoti  | || ||1|

---

## Detalji stavki

---

### US-24 — Panel medicinskog osoblja *(dopunjeno)*
**Povezanost sa PB:** PB-11  
**Kao** medicinsko osoblje, **želim** imati panel sa svim terminima i alatima za upravljanje pregledima, **kako bih** mogao efikasno organizovati svakodnevni rad.

#### Acceptance Criteria

1. Kada je medicinsko osoblje prijavljeno, panel mora prikazati listu svih termina zakazanih za tekući dan.
2. Sistem mora omogućiti osoblju ručno kreiranje novog termina za pacijenta; po potvrdi, termin se odmah upisuje u bazu sa statusom `ZAKAZAN`.
3. Kada osoblje klikne na detalje termina, sistem prikazuje: ime i prezime pacijenta, broj telefona, vrstu pregleda i razlog posjete.
4. Polje za pretragu mora filtrirati termine po imenu pacijenta u realnom vremenu.
5. Sistem ne smije dozvoliti pacijentima pristup ovom panelu.
6. Panel mora prikazivati dugme **"Dodaj nalaz"** pored svakog termina sa statusom `ZAVRŠEN`.

#### Zadaci
- [ ] Implementirati endpoint `GET /staff/appointments/today`
- [ ] Implementirati dugme i modal za ručno kreiranje termina
- [ ] Prikaz detalja pacijenta u proširenom redu / bočnoj ploči
- [ ] Integracija dugmeta „Dodaj nalaz" sa US-32 komponentom
- [ ] Frontend: filtriranje po imenu u realnom vremenu
- [ ] Testovi: guard za rolu `MEDICINSKO_OSOBLJE`

---

### US-32 — Upload i evidencija laboratorijskih nalaza *(dodavanje PDF-a od medicinskog osoblja)*
**Povezanost sa PB:** PB-4  
**Kao** medicinsko osoblje, **želim** dodavati PDF nalaze u historiju pregleda pacijenta, **kako bi** svi podaci bili kompletni i dostupni za buduće preglede.

#### Acceptance Criteria

1. Kada osoblje odabere opciju „Dodaj nalaz" na profilu pacijenta, sistem mora prikazati formu za upload fajla.
2. Sistem ne smije dozvoliti upload formata koji nije PDF; poruka: `"Dozvoljeni su samo PDF fajlovi"`.
3. Po uspješnom uploadu, nalaz se trajno veže za historiju pacijenta i vidljiv je doktoru i pacijentu.
4. Klikom na naziv nalaza otvara se PDF u novom tabu preglednika.
5. Sistem mora evidentirati ko je i kada dodao nalaz (audit trail).

#### Zadaci
- [ ] Backend: endpoint `POST /patients/{id}/records` (multipart/form-data, samo PDF)
- [ ] Validacija MIME tipa na serveru (`application/pdf`)
- [ ] Pohrana fajla (cloud storage ili lokalno) i upis metapodataka u bazu
- [ ] Frontend: komponenta za upload s drag-and-drop
- [ ] Prikaz liste nalaza u sekciji „Historija pregleda"
- [ ] Testovi: nedozvoljeni formati, prazni fajlovi

---

### US-11 — Dashboard za doktora – kompletna logika *(završetak)*
**Povezanost sa PB:** PB-10  
**Kao** doktor, **želim** pregled dnevnog i sedmičnog rasporeda te pristup historiji pacijenata, **kako bih** efikasno organizovao obaveze.

#### Acceptance Criteria

1. Doktorov panel mora prikazivati dnevni i sedmični prikaz; klikom na „Sedmični prikaz" tabela se reorganizuje po danima.
2. Doktor može pomjeriti (izmijeniti) termin; pacijent automatski dobiva email obavijest o novom terminu.
3. Klikom na ime pacijenta u listi toga dana otvara se historija svih prethodnih pregleda i nalaza tog pacijenta.
4. Doktor vidi samo termine i historiju svojih pacijenata.
5. Hitni termini prikazuju se sa crvenim vizuelnim markerom.

#### Zadaci
- [ ] Implementirati dnevni/sedmični calendar view komponentu
- [ ] Endpoint `PATCH /appointments/{id}` – izmjena termina + email trigger
- [ ] Endpoint `GET /doctors/{id}/patients/{patientId}/history`
- [ ] Guard: doktor ne može vidjeti pacijente koji nisu rezervirali kod njega
- [ ] Integracija s US-28 (prikaz hitnosti crvenom bojom)
- [ ] E2E testovi kalendara
- [ ] Obrada pregleda dijagnoza, terpaija brisanje iz zakazanih korsinika 
---

### US-28 — Označavanje hitnosti termina
**Povezanost sa PB:** PB-11  
**Kao** medicinsko osoblje, **želim** vizualno označiti hitne pacijente, **kako bi** prioritetni termini bili obrađeni odmah.

#### Acceptance Criteria

1. Medicinsko osoblje i administrator mogu označiti termin statusom `HITNO` iz panela.
2. Hitni termini se prikazuju crvenom bojom na doktorovom i admin dashboardu.
3. Pacijent ne smije vidjeti internu oznaku hitnosti.
4. Sistem mora evidentirati ko je i kada dodao oznaku hitnosti.

#### Zadaci
- [ ] Endpoint `PATCH /appointments/{id}/urgency`
- [ ] Frontend: toggle za hitnost u detalju termina (samo osoblje/admin)
- [ ] CSS klasa / badge za prikaz crvene boje u tabelama
- [ ] Skrivanje oznake na pacijentovom prikazu

---

### US-01 — Historija pregleda korisnika
**Povezanost sa PB:** PB-4  
**Kao** pacijent, **želim** pregledati historiju svojih pregleda, **kako bih** imao uvid u prethodne termine i zdravstvene nalaze.

#### Acceptance Criteria

1. U sekciji „Historija" prikazuju se svi termini sortirani od najnovijeg ka najstarijem.
2. Detalji termina uključuju: datum, ljekar, odjel, opis terapije i PDF nalaze.
3. Otkazani termini vidljivi su u listi sa jasnom oznakom `OTKAZAN`.
4. Ako pacijent nema historije, prikazuje se: `"Trenutno nemate zabilježenih pregleda u historiji"`.

#### Zadaci
- [ ] Endpoint `GET /patients/{id}/appointments?status=all`
- [ ] Frontend: lista s filtrom po statusu
- [ ] Prikaz PDF nalaza unutar detalja termina
- [ ] Prazno stanje (empty state) komponenta

---

### US-31-EXT — Označavanje pacijenta kao hronični bolesnik + SMS podsjetnik
**Proširenje US-31** | **Povezanost sa PB:** PB-7  
**Kao** doktor, **želim** označiti pacijenta atributom „hronični bolesnik" i definisati period rutinskog pregleda, **kako bi** sistem automatski slao podsjetnike putem emaila i SMS-a.

#### Acceptance Criteria

1. Doktor može na profilu pacijenta uključiti toggle `Hronični bolesnik` i unijeti period rutinskog pregleda (u danima).
2. Sistem šalje podsjetnik 7 dana prije isteka perioda:
   - Email na registrovanu adresu.
   - **SMS na registrovani broj telefona ako je broj unesen u profil.**
3. Ako pacijent već ima zakazan termin u preporučenom periodu, sistem ne šalje podsjetnik.
4. Svaki poslani podsjetnik evidentira se s datumom i kanalom slanja (email/SMS).
5. Administrator može pregledati evidenciju podsjetnika po pacijentu.

#### Zadaci
- [ ] Dodati atribute `is_chronic` i `review_period_days` u tabelu pacijenata
- [ ] Scheduled job: dnevna provjera pacijenata kojima uskoro ističe period
- [ ] Integracija SMS providera (npr. Twilio) – slanje samo ako postoji `phone_number`
- [ ] Frontend: toggle i unos perioda u doktorovom panelu
- [ ] Tabela `reminder_log` (patient_id, sent_at, channel)
- [ ] Testovi: pacijent s terminom ne dobiva podsjetnik

---

### US-36 — Role-based prijavljivanje na sistem
**Povezanost sa PB:** PB-5  
**Kao** sistem, **želim** da korisnici po prijavi budu preusmjereni prema svojoj ulozi i da pristup stranicama bude kontrolisan po roli, **kako bi** svaki korisnik vidio samo ono što mu pripada.

#### Acceptance Criteria

1. Sistem razlikuje najmanje četiri uloge: `PACIJENT`, `DOKTOR`, `MEDICINSKO_OSOBLJE`, `ADMINISTRATOR`.
2. Po uspješnoj prijavi korisnik se preusmjerava na odgovarajući dashboard prema ulozi.
3. Pristup stranicama zaštićen je guard-om; neautorizovani zahtjev vraća grešku `403 Forbidden`.
4. Doktor ima pristup samo terminima i historiji svojih pacijenata.
5. Medicinsko osoblje može upravljati kalendarima svih ljekara.
6. Pacijent ne smije pristupiti admin, doktor niti staff panelu.

#### Zadaci
- [ ] Implementirati JWT claims s poljem `role`
- [ ] Route guards na frontendu po ulozi
- [ ] Middleware/guard na backendu za sve zaštićene rute
- [ ] Mapiranje rola na preusmjeravanja u login flow-u
- [ ] Testovi: svaka rola pokušava pristupiti zabranjenim rutama

---

### BUG-01 — Komentar bug u bazi
**Tip:** Bug fix | **Prioritet:** Visok

**Opis problema:**  
Komentari vezani za termine ne upisuju se ispravno u bazu ili se ne dohvataju pri prikazu detalja termina.

#### Kriteriji prihvatanja (fix)

1. Komentar koji pacijent unese pri rezervaciji mora biti pohranjen u bazu i vidljiv doktoru i pacijentu u detaljima termina.
2. Svaki komentar prikazuje: tekst, ime unositelja i datum unosa.
3. Ako termin nema komentara, prikazuje se: `"Nema komentara za ovaj termin"`.

#### Zadaci
- [ ] Identificirati uzrok (FK constraint, null polje, ORM mapping)
- [ ] Napisati failing test koji reproducira bug
- [ ] Ispraviti migraciju/model/query
- [ ] Regresijski test: kreiranje termina s komentarom i bez

---

### BUG-02 — Bug kod registracije – slanje verifikacijskog koda
**Tip:** Bug fix | **Prioritet:** Visok

**Opis problema:**  
Korisnici mogu uspješno završiti registraciju čak i kada verifikacijski email kod nije poslan ili nije potvrđen, čime se zaobilazi verifikacija emaila.

#### Kriteriji prihvatanja (fix)

1. Sistem ne smije aktivirati nalog dok korisnik ne potvrdi email adresu putem verifikacijskog koda.
2. Ako kod nije poslan (SMTP greška), korisniku se prikazuje poruka o grešci i registracija ostaje na čekanju.
3. Nalog sa statusom `UNVERIFIED` nema pristup zaštićenim dijelovima sistema.

#### Zadaci
- [ ] Dodati provjeru `email_verified = true` u login flow-u
- [ ] Ispraviti uvjetni blok koji dozvoljava prolaz bez koda
- [ ] Implementirati retry mehanizam za slanje koda (ili jasnu grešku)
- [ ] Testovi: login sa neaktiviranim nalogom mora biti odbijen

---

### BUG-03 — Profil korisnika – format datuma dd/mm/yyyy
**Tip:** Bug fix | **Prioritet:** Srednji

**Opis problema:**  
Datumi (datum rođenja, datumi termina) prikazuju se u pogrešnom formatu (`yyyy-mm-dd` ili ISO string) umjesto lokalnog formata `dd/mm/yyyy`.

#### Kriteriji prihvatanja (fix)

1. Svi datumi vidljivi korisniku moraju biti prikazani u formatu `dd/mm/yyyy`.
2. Format se primjenjuje u: profilu pacijenta, listi termina, historiji pregleda i svim email obavijestima.
3. Interni format pohrane u bazi ostaje ISO 8601 (`yyyy-mm-dd`).

#### Zadaci
- [ ] Kreirati helper / date-formatting utility funkciju na frontendu
- [ ] Zamijeniti sve direktne prikaze datuma pozivom helpera
- [ ] Provjeriti i ispraviti formate u email template-ima

---

### US-38 — Lista čekanja za termine
**Povezanost sa PB:** Nova stavka  
**Kao** pacijent, **želim** da se prijavim na listu čekanja za određeni dan, **kako bi** me sistem obavijestio ako se neki termin oslobodi usljed otkazivanja.

#### Acceptance Criteria

1. Ako na odabranom danu kod željenog doktora nema slobodnih termina, pacijentu se nudi opcija „Prijavi se na listu čekanja".
2. Kada se termin oslobodi (otkazivanje), sistem automatski obavještava prvog pacijenta na listi putem emaila i notifikacije u aplikaciji.
3. Pacijent ima 30 minuta da prihvati ponuđeni termin; ako ne odgovori, termin se nudi sljedećem na listi.
4. Pacijent može u bilo kom trenutku ukloniti sebe sa liste čekanja.
5. Isti pacijent ne može biti na listi čekanja za isti dan i istog doktora više od jednom.

#### Zadaci
- [ ] Tabela `waiting_list` (patient_id, doctor_id, date, created_at, status)
- [ ] Endpoint `POST /waiting-list` i `DELETE /waiting-list/{id}`
- [ ] Trigger/event po otkazivanju termina – poziv waiting list servisa
- [ ] Email + in-app notifikacija s linkom za potvrdu
- [ ] Job: istek 30-minutnog prozora i prosljeđivanje sljedećem
- [ ] Frontend: prikaz opcije i upravljanje listom čekanja u profilu

---

### US-39 — Grafički prikaz zauzetosti specijalističkih kabineta
**Povezanost sa PB:** Nova stavka  
**Kao** medicinsko osoblje, **želim** vidjeti grafički prikaz zauzetosti specijalističkih kabineta, **kako bih** mogao ručno dodijeliti hitne slučajeve.

#### Acceptance Criteria

1. Panel osoblja mora sadržavati sekciju „Zauzetost kabineta" s prikazom za tekući dan.
2. Svaki kabinet/soba prikazuje se kao vizuelni blok s informacijom: naziv, aktivan doktor, termin u toku, sljedeći termin.
3. Slobodni kabineti označeni su zelenom, zauzeti crvenom, a uskoro zauzeti žutom bojom.
4. Osoblje može klikom na slobodan kabinet odmah otvoriti formu za dodjelu hitnog slučaja.
5. Prikaz se osvježava automatski svakih 60 sekundi.

#### Zadaci
- [ ] Endpoint `GET /rooms/occupancy?date=today`
- [ ] Frontend: grid/kartica komponenta za kabinete s color coding-om
- [ ] WebSocket ili polling (60s) za live refresh
- [ ] Modal za brzu dodjelu hitnog slučaja kabinetu
- [ ] Testovi: prikaz ispravnih statusa

---

### US-40 — Zahtjev za deaktivaciju i anonimizaciju profila
**Povezanost sa PB:** Nova stavka  
**Kao** pacijent, **želim** podnijeti zahtjev za deaktivaciju profila i anonimizaciju mojih ličnih podataka u skladu sa zakonom o zaštiti podataka, **kako bih** mogao zahtijevati brisanje svojih informacija.

#### Acceptance Criteria

1. U postavkama profila pacijent ima opciju „Zatraži deaktivaciju naloga".
2. Nakon podnošenja zahtjeva, pacijent dobiva email potvrdu da je zahtjev primljen i da će biti obrađen u roku od 30 dana.
3. Administrator vidi zahtjev u admin panelu i može ga odobriti ili odbiti uz obrazloženje.
4. Po odobrenju, sistem anonimizira lične podatke (ime, prezime, email, telefon zamijenjeni generičkim tokenima) i deaktivira nalog.
5. Medicinski podaci (historija termina, nalazi) čuvaju se u anonimizovanoj formi zbog zakonske obaveze.
6. Aktivni zakazani termini moraju biti otkazani prije deaktivacije; pacijent dobiva obavijest.

#### Zadaci
- [ ] Endpoint `POST /users/{id}/deactivation-request`
- [ ] Admin pregled i obrada zahtjeva u admin panelu
- [ ] Anonimizacija servis: nullify/replace PII polja
- [ ] Email workflow: potvrda zahtjeva → odluka admina → obavijest korisniku
- [ ] Guard: deaktivirani nalog ne može se prijaviti
- [ ] Testovi: podatkovni integritet nakon anonimizacije

---

### US-41 — Obavijest pacijentu o otkazanom/pomjerenom terminu
**Povezanost sa PB:** Nova stavka (vezano za US-09, US-11)  
**Kao** pacijent, **želim** dobiti email/notifikaciju ako doktor otkaže ili pomjeri moj termin, **kako bih** mogao planirati svoje vrijeme.

#### Acceptance Criteria

1. Kada doktor ili medicinsko osoblje otkaže termin, pacijent automatski dobiva email s informacijom: datum i vrijeme otkazanog termina, razlog (ako je naveden) i kontakt broj za zakazivanje novog.
2. Kada doktor pomjeri termin, pacijent dobiva email s prikazom starog i novog termina te opcijom potvrde ili odbijanja pomjerenog termina.
3. Pored emaila, pacijentu se prikazuje in-app notifikacija pri sljedećem logovanju.
4. Otkazani termin se odmah oslobađa u kalendaru bez obzira na obavijest.

#### Zadaci
- [ ] Event emitter na `appointment.cancelled` i `appointment.rescheduled`
- [ ] Email template za otkazivanje (sa kontaktom) i pomjeranje (s linkovima za potvrdu/odbijanje)
- [ ] In-app notifikacija tabela / endpoint `GET /notifications`
- [ ] Endpoint `PATCH /appointments/{id}/reschedule-response` (potvrda/odbijanje)
- [ ] Testovi: provjera slanja emaila pri otkazivanju

---

### US-42 — Anonimna ocjena i komentar na rad doktora
**Povezanost sa PB:** Nova stavka  
**Kao** pacijent, **želim** da nakon završenog pregleda ostavim anonimnu ocjenu i kratak komentar na rad doktora, **kako bi** se unaprijedio kvalitet usluge.

#### Acceptance Criteria

1. Nakon što termin dobije status `ZAVRŠEN`, pacijentu se šalje poziv na ocjenjivanje (email ili in-app).
2. Pacijent može ostaviti ocjenu od 1 do 5 i opcionalni komentar (maks. 500 znakova).
3. Ocjena i komentar su anonimni – doktor ne vidi ko je ostavio ocjenu.
4. Svaki pacijent može ocijeniti isti termin samo jednom.
5. Doktor na svom dashboardu vidi prosječnu ocjenu i listu anonimnih komentara.
6. Administrator može moderisati (sakriti) komentare koji krše pravila.

#### Zadaci
- [ ] Tabela `reviews` (appointment_id, rating, comment, created_at) – bez FK na pacijenta u prikazu
- [ ] Endpoint `POST /appointments/{id}/review`
- [ ] Constraint: jedna ocjena po terminu
- [ ] Frontend: modal za ocjenjivanje (zvjezdice + textarea)
- [ ] Prikaz prosječne ocjene i komentara na doktorovom profilu
- [ ] Admin: endpoint `PATCH /reviews/{id}/hide`
- [ ] Testovi: anonimnost, jednoratnost ocjene

---

### US-43 — Profil korisnika – frontend + mapa
**Povezanost sa PB:** Nova stavka  
**Kao** korisnik, **želim** imati pregledan profil s osnovnim podacima i opcionalnom lokacijom/mapom, **kako bih** mogao upravljati informacijama i lakše pronaći zdravstvenu ustanovu.

#### Acceptance Criteria

1. Stranica profila pacijenta prikazuje: ime, prezime, email, telefon, datum rođenja (format `dd/mm/yyyy`) i adresu.
2. Korisnik može urediti sve podatke osim emaila (za promjenu emaila potreban je poseban verifikacijski flow).
3. Na profilu se prikazuje interaktivna mapa (OpenStreetMap / Google Maps embed) s lokacijom zdravstvene ustanove.
4. Svi datumi na profilu prikazuju se u formatu `dd/mm/yyyy` (fix iz BUG-03).
5. Po uspješnom čuvanju izmjena prikazuje se poruka: `"Profil uspješno ažuriran"`.

#### Zadaci
- [ ] Frontend: profil stranica s edit modom (React komponenta)
- [ ] Integracija mapa embeda (OpenStreetMap iframe ili Leaflet.js)
- [ ] Primjena date-formatting helpera (BUG-03)
- [ ] Endpoint `PATCH /users/{id}/profile` s validacijom
- [ ] Testovi: validacija formata datuma, success/error state

---

## Definicija gotovosti (Definition of Done)

- [ ] Kod pregledan (code review) i mergovan u `develop` granu
- [ ] Jedinični i integracijski testovi napisani i prolaze
- [ ] Bug fix verificiran regresijskim testom
- [ ] Endpoint dokumentovan u Swagger/OpenAPI
- [ ] Dizajn usklađen sa UX smjernicama projekta
- [ ] QA odobrio stavku na staging okruženju

---

*Dokument kreiran za Sprint 9 | Tim: Healthbook | Datum: 21.05.2026.*
