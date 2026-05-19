# Sprint Backlog
**Sprint Goal:** Završetak personalizovanih panela za sve korisničke uloge u sistemu — doktor panel sa kompletnim tokom rada, panel medicinskog osoblja sa označavanjem hitnosti, osnovna funkcionalnost admin panela za dodjelu i upravljanje korisničkim ulogama, te implementacija role-based routinga koji preusmjerava svakog korisnika na odgovarajući panel nakon prijave.

> **Napomena o promjeni plana:** Osnovna funkcionalnost admin panela za dodjelu korisničkih uloga (US-02, US-33), prvobitno planirana kao dio Sprinta 10 (Release 4 — Autentikacija i sigurnost), premještena je u Sprint 8 kako bi RBAC mehanizam implementiran u Sprintu 7 bio u potpunosti operativan. Bez mogućnosti dodjele uloga korisnicima, role-based prijavljivanje i personalizovani paneli ne mogu biti validirani u integraciji. Odluka dokumentovana u DEC-007.

---

## User storije i zadaci

| ID | User Story | Odgovorna osoba | Status | Napomena |
|----|------------|-----------------|--------|----------|
| US-11 | **Dashboard za doktora — pregled rasporeda** — Kao doktor, želim da imam pregled svog dnevnog i sedmičnog rasporeda, kako bih efikasno organizovao svoje obaveze i imao jasan uvid u zakazane termine pacijenata. | Merjem Milišić | To Do | Dnevni i sedmični prikaz; pregled historije pacijenta iz dashboarda; pomjeranje termina uz email notifikaciju (NFR-15, NFR-16) |
| US-21 | **Pregled komentara termina (doktor)** — Kao doktor, želim da mogu vidjeti napomene ili komentare vezane za termin, kako bih imao sve relevantne informacije prije pregleda. | Merjem Milišić | To Do | Zavisnost: US-11; komentari vidljivi i doktoru i pacijentu; prikaz uz detalje termina |
| US-17 | **Rezervacija termina kod specijaliste putem doktora porodične medicine** — Kao pacijent, želim da moj porodični doktor može rezervisati termin kod specijaliste u moje ime, kako bih dobio bržu i koordiniranu medicinsku uslugu. | Merjem Milišić | To Do | Zavisnost: US-11; email obavijest pacijentu; pacijent može otkazati termin ako je rok duži od 24h |
| US-24 | **Panel medicinskog osoblja** — Kao medicinsko osoblje, želim da imam panel sa kontrolama za upravljanje pregledima i terminima pacijenata, kako bih mogao efikasno organizovati svoj rad. | — (1–2 osobe) | To Do | Prikaz dnevnih termina; kreiranje termina; pretraga pacijenta; ograničenje pristupa — samo medicinsko osoblje i admin (NFR-01) |
| US-28 | **Označavanje hitnosti prijavljenog termina** — Kao medicinsko osoblje, želim vizuelno označiti hitne pacijente u sistemu, kako bi prioritetni termini bili obrađeni odmah. | — (1–2 osobe) | To Do | Zavisnost: US-24; oznaka "HITNO" vidljiva samo internom osoblju; crvena boja na dashboardu doktora i admina; pacijent ne vidi oznaku |
| US-02 | **Admin panel — korisnički interfejs za administraciju (dodjela uloga)** — Kao administrator, želim da imam korisnički interfejs za administraciju, kako bih mogao upravljati korisnicima, dodjeljivati i mijenjati uloge unutar sistema. | — (1–2 osobe) | To Do | Premješteno iz Sprinta 10 (DEC-007); fokus na dodjelu uloga (PACIJENT, DOKTOR, MEDICINSKO_OSOBLJE, ADMIN); sigurnost pristupa — samo admin (NFR-06, NFR-07) |
| US-33 | **Admin panel — backend funkcionalnosti (dodjela uloga)** — Kao backend developer, želim razviti backend funkcionalnosti za admin panel, kako bi administratori mogli upravljati korisnicima i njihovim ulogama putem REST API-ja. | — (1–2 osobe) | To Do | Zavisnost: US-02; REST API; validacija ulaznih podataka; zaštita ruta bez validnog tokena — greška "Pristup odbijen" (NFR-06, NFR-07) |
| — | **Role-based routing — preusmjeravanje korisnika prema ulozi** — Tehnički zadatak: Implementacija logike preusmjeravanja korisnika na odgovarajući panel (pacijent, doktor, medicinsko osoblje, admin) neposredno nakon uspješne prijave, na osnovu uloge dodijeljene u sistemu. | Lamija Halilović | To Do | Zavisnost: US-03 (Sprint 7) + US-02/US-33; preduslov za validaciju svih panela u integraciji (NFR-06, NFR-07) |
| — | **Rješavanje aktivnih bugova** — Tehnički zadatak: Identifikacija, analiza i otklanjanje grešaka evidentiranih iz prethodnih sprintova koje utiču na stabilnost ili korektnost rada sistema. | — (1 osoba) | To Do | Prioritizacija bugova po kritičnosti; bugovi koji blokiraju testiranje rješavaju se prvi; evidencija u projektnoj dokumentaciji |
| — | **Integraciono testiranje panela i role-based toka** — Tehnički zadatak: Funkcionalno i integraciono testiranje svih implementiranih panela i kompletnog toka login → uloga → panel za sve četiri uloge korisnika. | — (1 osoba) | To Do | Testiranje mora početi najkasnije sredinom sprinta; verifikacija da nijedna uloga nema pristup resursima koji nisu u njenoj nadležnosti (NFR-06, NFR-07) |

---

## Relevantni NFR zahtjevi

| ID | Zahtjev |
|----|---------|
| NFR-06 | Korisnik smije pristupiti samo funkcijama koje odgovaraju njegovoj ulozi |
| NFR-07 | Sistem mora implementirati RBAC (Role-Based Access Control) |
| NFR-01 | Samo vlasnik i autorizovano medicinsko osoblje mogu pristupiti historiji pregleda pacijenta |
| NFR-15 | Dashboard sistema mora se učitati u roku od maksimalno 3 sekunde |
| NFR-16 | Promjene rasporeda moraju biti vidljive u roku od 2 sekunde — WebSocket |
| NFR-26 | Sistem mora imati intuitivan interfejs za upravljanje i rezervaciju termina |

---

## Glavni rizici

| ID | Opis |
|----|------|
| RR-11 | Neautorizovan pristup admin panelu ako RBAC nije ispravno implementiran |
| RR-08 | Neovlašten pristup podacima usljed nepotpunog role-based routinga |
| RR-17 | Doktor kasni ili nije dostupan — potrebno dinamičko ažuriranje rasporeda |
| RR-19 | Hitni slučajevi prekidaju zakazane termine |
| RR-06 | Loše korisničko iskustvo usljed kompleksnosti interfejsa |

---

## Deliverable-i

- Funkcionalan doktor panel — dnevni i sedmični pregled rasporeda, uvid u historiju pacijenta, pomjeranje termina uz email notifikaciju
- Pregled komentara uz termine vidljiv doktoru i pacijentu u okviru detalja termina
- Implementirana rezervacija termina kod specijaliste putem doktora porodične medicine sa email obavijesti pacijentu
- Funkcionalan panel medicinskog osoblja — dnevni termini, kreiranje termina, pretraga pacijenta
- Oznaka hitnosti termina ("HITNO") vidljiva isključivo internom osoblju; crvena vizuelna indikacija na dashboardu
- Admin panel (frontend + backend) za dodjelu i upravljanje korisničkim ulogama (PACIJENT, DOKTOR, MEDICINSKO_OSOBLJE, ADMINISTRATOR)
- Implementiran role-based routing — svaki korisnik automatski preusmjeren na odgovarajući panel po prijavi
- Riješeni aktivni bugovi iz prethodnih sprintova, kategorizirani po prioritetu
- Provedeno integraciono testiranje svih panela i role-based toka bez kritičnih grešaka
- Zadovoljeni svi relevantni NFR zahtjevi (NFR-01, NFR-06, NFR-07, NFR-15, NFR-16, NFR-26)

---

## Sažetak sprinta

Sprint 8 nadograđuje sigurnosni sloj iz Sprinta 7 dovođenjem RBAC mehanizma do pune operativnosti — svaka korisnička uloga sada dobija vlastiti panel i odgovarajući pristup. Doktor vidi dnevni i sedmični raspored, ima uvid u historiju pacijenata i može rezervisati termine kod specijaliste u njihovo ime. Medicinsko osoblje upravlja aktivnim terminima i označava hitne slučajeve. Admin putem panela dodjeljuje i mijenja uloge korisnicima, čime se zatvara krug koji je otvoren implementacijom autentifikacije. Role-based routing osigurava da se svaki korisnik automatski usmjeri na ispravnu destinaciju odmah nakon prijave. Uz razvoj novih funkcionalnosti, sprint obuhvata i otklanjanje aktivnih bugova te integraciono testiranje koje verificira kompletan tok za sve četiri uloge bez neautorizovanog pristupa.

---

> **Napomena:** Ovaj Sprint Backlog je živi dokument i ažurira se kroz sprint. Svaki backlog item direktno je vezan za odgovarajući user story ili tehnički zadatak. Testiranje integrisanog role-based toka mora početi najkasnije sredinom sprinta kako bi ostalo dovoljno vremena za eventualne ispravke. Kolona "Odgovorna osoba" popunjava se na Sprint Planning sesiji.

**Release:** Release 3 — Paneli korisnika, medicinska historija i statistika | **Sprint:** Sprint 8 | **Ključna isporuka:** Personalizovani paneli za sve korisničke uloge sa potpuno funkcionalnim role-based prijavljivanjem
