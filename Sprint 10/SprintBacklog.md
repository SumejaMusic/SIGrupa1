
# Sprint Backlog — Sprint 10
 
**Fokus sprinta:** Implementacija admin i menadžment panela sa audit logom i statistikama, proširenje pacijentovog profila sa medicinskim podacima, uvođenje potvrde dolaska pacijenta u realnom vremenu te generisanje PDF uputnica od strane doktora za potrebe **Release 4**.

**Sprint Goal:** Izgradnja kompletnog administrativno-menadžerskog sloja sistema kroz admin panel sa audit logom, statistički modul sa CSV exportom i menadžment panel za nadzor resursa, uz istovremeno unapređenje korisničkog iskustva kroz proširenje pacijentovog medicinskog profila, potvrdu dolaska jednim klikom i generisanje PDF uputnica specijalistima.

---

## User storije i zadaci

| ID | User Story | Odgovorna osoba | Status | Napomena |
|----|------------|-----------------|--------|----------|
| US-18 | **Menadžment panel** — Kao administrativno osoblje zdravstvene ustanove, želim imati menadžment panel za nadzor sistema, kako bih mogao pratiti aktivnosti i resurse. |  | To Do | Kontrolna tabla sa prikazom ključnih metrika ustanove; pregled termina, aktivnosti medicinskog osoblja i zauzetosti resursa; intuitivan interfejs u skladu sa NFR-26 |
| US-33 | **Admin panel — backend funkcionalnosti** — Kao administrator, želim stabilne backend API rute i servise, kako bi se upravljanje korisnicima i promjene uloga sigurno i konzistentno upisivale u bazu podataka. | Hana Mahmutović | To Do | CRUD endpointi za upravljanje korisnicima i ulogama; validacija admin privilegija; RBAC zaštita svih admin ruta; validacija dozvoljenih uloga i obaveznih dodatnih podataka; odziv endpointa u skladu sa NFR-18 |
| US-34 | **Logovanje svih akcija u sistemu (audit log)** — Kao administrator, želim da sistem bilježi sve akcije i promjene unutar sistema, kako bih mogao pratiti i analizirati aktivnosti svih korisnika. | Amina Alispahić | To Do | Kreiranje tabele `audit_log` sa timestampom, korisnikom, tipom akcije i entitetom; prikaz audit loga u admin panelu sa filterima; zaštita loga od izmjena; integracija sa svim kritičnim operacijama |
| US-29 | **Statistika zdravstvene ustanove** — Kao uprava zdravstvene ustanove, želim pregled statistike zakazanih pregleda doktora, kako bih mogao analizirati podatke i planirati resurse. | Almedin Šehić | To Do | Grafički prikaz ključnih metrika (broj pregleda, opterećenost doktora, zauzetost kabineta); filtriranje po vremenskom periodu; odziv u skladu sa NFR-15 |
| US-30 | **Export statistike zakazanih pregleda u CSV formatu** — Kao uprava zdravstvene ustanove, želim eksportovati statistiku u CSV formatu, kako bih mogao pripremati izvještaje i donositi informisane odluke. | Merjem Milišić | To Do | Zavisnost: US-29; generisanje CSV fajla iz filtriranih podataka statistike; zaštita exporta prema NFR-01; osiguranje integriteta podataka pri istovremenom pristupu |
| US-40 | **Zahtjev za deaktivaciju i anonimizaciju profila (GDPR)** — Kao pacijent, želim podnijeti zahtjev za deaktivaciju profila i anonimizaciju mojih ličnih podataka u skladu sa zakonom o zaštiti podataka, kako bih mogao zahtijevati brisanje svojih informacija. | Lamija Halilović  | To Do | Forma za podnošenje zahtjeva u pacijentovom profilu; privremena deaktivacija bez kaskadnog brisanja medicinskih zapisa; pokretanje anonimizacije u skladu sa NFR-30 (rok 30 dana); čuvanje anonimizirane historije bolesti za medicinsko-pravni integritet |
| US-45 | **Potvrda dolaska pacijenta jednim klikom** — Kao medicinsko osoblje, želim moći potvrditi dolazak pacijenta jednim klikom u panelu, kako bi doktor vidio ko od zakazanih pacijenata čeka u čekaonici. | Hamya Husović | To Do | Dugme "Potvrdi dolazak" u panelu medicinskog osoblja; ažuriranje statusa termina u realnom vremenu putem WebSocket mehanizma; vizuelna indikacija čekaonice na doktorskom dashboardu; promjena statusa vidljiva u roku od 2 sekunde (NFR-16) |
| US-46 | **Proširenje medicinskog profila pacijenta** — Kao pacijent, želim da u svom profilu navedem poznate alergije, hronične bolesti, krvnu grupu, podatak o doniranju krvi i prethodne operacije, kako bi doktor imao ključne medicinske informacije odmah pri pregledu. | Hamza Husović | To Do | Proširenje tabele `pacijent` sa medicinskim atributima (krvna grupa, alergije, hronične bolesti, donacija krvi, prethodne operacije); forma za unos u pacijentovom profilu; prikaz medicinskih podataka u doktorovom pregledu pacijenta; zaštita pristupa prema NFR-01 |
| US-NEW | **Generisanje PDF uputnice specijalistu** — Kao doktor, želim generisati PDF uputnicu specijalistu direktno iz sistema tokom ili nakon pregleda, kako bi pacijent dobio formalan dokument za nastavak liječenja. | Sumeja Mušić | Done | Forma za unos podataka uputnice ; generisanje PDF dokumenta sa podacima pacijenta, doktora i razlogom upućivanja; preuzimanje i/ili slanje uputnice pacijentu |

---

## Relevantni NFR zahtjevi

| ID | Zahtjev |
|----|---------|
| NFR-01 | Samo ovlašteno medicinsko osoblje i administratori mogu pristupiti historiji pregleda pacijenta |
| NFR-06 | Korisnik smije pristupiti samo funkcijama koje odgovaraju njegovoj ulozi |
| NFR-07 | Sistem mora implementirati RBAC (Role-Based Access Control) |
| NFR-15 | Dashboard sistema mora se učitati u roku od maksimalno 3 sekunde |
| NFR-16 | Promjene rasporeda i statusa moraju biti vidljive u roku od 2 sekunde — WebSocket / Live Updates |
| NFR-18 | Admin backend mora odgovarati u roku od 2 sekunde |
| NFR-19 | Baza podataka mora osigurati konzistentnost i integritet podataka tokom svih administrativnih operacija |
| NFR-26 | Sistem mora imati intuitivan interfejs za upravljanje i rezervaciju termina |
| NFR-30 | Svi lični podaci pacijenata prilikom trajne anonimizacije moraju biti uklonjeni iz baze u roku od 30 dana (GDPR usklađenost) |

---

## Glavni rizici

| ID | Opis |
|----|------|
| RR-06 | Loše korisničko iskustvo usljed kompleksnosti administrativnog i menadžment interfejsa |
| RR-09 | Neispravni podaci o pacijentima usljed greške pri unosu od strane administratora |
| RR-21 | Slučajno brisanje ili narušavanje integriteta medicinske historije prilikom izvršavanja skripte za GDPR anonimizaciju |
| RR-24 | Neažurni podaci o dostupnosti doktora koji mogu uzrokovati netačne statističke prikaze |
| RR-25 | Greške pri generisanju PDF uputnice usljed nepotpunih podataka o pacijentu ili specijalistu |
| RR-26 | Narušavanje integriteta exportovanih CSV podataka pri istovremenom pristupu više administratora |
| RR-27 | Race condition pri potvrdi dolaska pacijenta ako medicinsko osoblje i doktor istovremeno mijenjaju status termina |

---

## Decision Log

| ID | Odluka | Obrazloženje |
|----|--------|--------------|
| DL-10-01 | Uvršten novi user story US-NEW za generisanje PDF uputnice specijalistu od strane doktora | Identificirana potreba tokom Sprint 9 — doktori trebaju mogućnost kreiranja i slanja uputnica specijalistima direktno iz sistema nakon obavljenog pregleda |
| DL-10-02 | US-40 (GDPR anonimizacija) prebačen iz Sprint 9 u Sprint 10 scope | Radi ravnomjernijeg rasporeda i boljeg fokusa tima na GDPR kompleksnost uz audit log modul |

---

## Deliverable-i

- Kompletan menadžment panel sa pregledom ključnih metrika ustanove, aktivnosti osoblja i zauzetosti resursa.
- Admin backend sa CRUD endpointima za upravljanje korisnicima i ulogama, zaštićen RBAC mehanizmom i u skladu sa NFR-18.
- Funkcionalan audit log koji bilježi sve kritične akcije u sistemu sa mogućnošću pretrage i filtriranja u admin panelu.
- Statistički modul sa grafičkim prikazom opterećenja sistema i mogućnošću exporta u CSV formatu.
- GDPR modul koji omogućava pacijentu privremenu deaktivaciju i pokretanje anonimizacije bez kaskadnog brisanja medicinskih zapisa.
- Potvrda dolaska pacijenta jednim klikom u panelu medicinskog osoblja sa real-time ažuriranjem na doktorovom dashboardu.
- Prošireni medicinski profil pacijenta sa krvnom grupom, alergijama, hroničnim bolestima, podatkom o doniranju krvi i prethodnim operacijama.
- Funkcionalan modul za generisanje i preuzimanje PDF uputnice specijalistu direktno iz doktorovog interfejsa tokom pregleda.

---

## Sažetak sprinta

Sprint 10 zatvara ključni administrativno-upravljački sloj sistema neophodan za **Release 3**. Težište rada je na izgradnji stabilnih backend servisa za admin panel, implementaciji audit loga kao temelja sigurnosti i transparentnosti, te statističkom modulu koji upravi ustanove pruža uvid u podatke potrebne za planiranje resursa. Istovremeno, sprint donosi značajna unapređenja korisničkog iskustva — doktori dobijaju mogućnost generisanja PDF uputnica specijalistima direktno iz sistema, medicinsko osoblje potvrđuje dolazak pacijenata jednim klikom, a pacijenti proširuju vlastiti medicinski profil relevantnim zdravstvenim podacima. GDPR modul osigurava usklađenost sa zakonskim regulativama uz čuvanje medicinskog integriteta. Sprint uspješno gradi na temeljima postavljenim u Sprintu 9 i priprema sistem za finalne isporuke Release 3.

---

> **Napomena:** Ovaj Sprint Backlog je živi dokument i ažurira se kroz sprint. Svaki backlog item direktno je vezan za odgovarajući user story ili tehnički zadatak. Testiranje GDPR anonimizacije i audit log skripti nad bazom podataka mora se izvršiti u staging okruženju prije bilo kakve integracije u produkciju. Kolona "Odgovorna osoba" popunjava se na Sprint Planning sesiji.

**Release:** Release 3 — Admin panel, statistike, menadžment | **Sprint:** Sprint 10 | **Ključna isporuka:** Audit log, CSV export statistike, PDF uputnica, prošireni medicinski profil i potvrda dolaska pacijenta.
