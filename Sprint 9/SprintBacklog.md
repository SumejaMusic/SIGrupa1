# Sprint Backlog — Sprint 9

**Status:** Aktivan / Planiran  
**Trajanje:** 2 sedmice (10 radnih dana)  
**Fokus sprinta:** Proširenja osnovnih funkcionalnosti, stabilizacija kritičnih korisničkih panela (Pacijent, Doktor, Medicinsko osoblje) te implementacija napredne automatizacije (SMS/Email podsjetnici i liste čekanja) za potrebe **Release 3**.

**Sprint Goal:** Proširenje osnovnih funkcionalnosti aplikacije, stabilizacija kritičnih korisničkih panela (Pacijent, Doktor, Medicinsko osoblje) te implementacija napredne automatizacije kroz sisteme obavještavanja (SMS/Email) i upravljanje listama čekanja za potrebe **Release 3**.

---

## User storije i zadaci

| ID | User Story | Odgovorna osoba | Status | Napomena |
|----|------------|-----------------|--------|----------|
| US-11 | **Dashboard za doktora – pregled rasporeda** — Kao doktor, želim naprednu poslovnu logiku kalendara sa dnevnim i sedmičnim prikazom, kako bih efikasnije filtrirao i upravljao zakazanim terminima u realnom vremenu. | Merjem Milišić | Done | Kalendarska integracija; napredno filtriranje; izrada backend servisa za preuzimanje rasporeda |
| US-24 | **Panel medicinskog osoblja** — Kao medicinsko osoblje, želim dopunu kontrola za upravljanje pacijentima u realnom vremenu, kako bih brže pretraživala i ažurirala statuse aktivnih pacijenata na prijemu. | Amina Alispahić | Done | Pretraga po imenu/prezimenu/JMBG; brzo otkazivanje i prosljeđivanje ljekaru; vizuelne notifikacije |
| US-28 | **Označavanje hitnosti prijavljenog termina** — Kao medicinsko osoblje, želim uvođenje trijažnih boja na dashboardima, kako bi hitni slučajevi bili vizuelno istaknuti ljekarima i osoblju. | | Done | Zavisnost: US-24; uvođenje `urgency_level` atributa; trijažne boje (zelena, žuta, crvena); pacijent ne može sam mijenjati nivo |
| US-32 | **Upload i evidencija laboratorijskih nalaza** — Kao medicinsko osoblje, želim sigurno učitavati PDF nalaze i vezati ih za historiju bolesti pacijenta, kako bi bili dostupni ljekaru i pacijentu. |  | Done | Drag-and-drop komponenta (maks. 5MB); konfiguracija sigurnog skladišta (AWS S3/lokalno); enkripcija u mirovanju |
| US-31-EXT | **Hronični bolesnici + SMS podsjetnik** — Kao sistem, želim automatski identifikovati hronične pacijente i slati im SMS podsjetnike za redovne preglede, kako bi se osigurao kontinuitet liječenja. | Kenan Hatibović | Done | Polje `is_chronic` u bazi; integracija Infobip SMS API-ja; izrada Cron Job-a za kalkulaciju perioda; provjera duplih obavijesti |
| US-38 | **Lista čekanja za termine** — Kao pacijent, želim se prijaviti na listu čekanja za popunjene kabinete, kako bih automatski dobio ponudu za slobodan termin u slučaju otkazivanja. |  | Done | Kreiranje tabele `waiting_lists`; event-driven servis sa TTL tajmerom od 30 min; automatska eskalacija na sljedećeg korisnika |
| US-39 | **Grafički prikaz zauzetosti specijalističkih kabineta** — Kao medicinsko osoblje, želim mrežni prikaz zauzetosti kabineta u realnom vremenu, kako bih imala bolji uvid u slobodne resurse ustanove. |  | Done | Grid layout sa color-coding pravilima; WebSocket/Polling mehanizam (60s); brza dodjela hitnog slučaja klikom na kabinet |
| US-40 | **Zahtjev za deaktivaciju i anonimizaciju profila** — Kao pacijent, želim opciju privremene deaktivacije i trajne anonimizacije profila u skladu sa GDPR-om, kako bih upravljao svojim ličnim podacima. | | Done | Sekcija "Privatnost" na FE; admin panel kontrola za odobrenje |
| US-41 | **Obavijest pacijentu o otkazanom/pomjerenom terminu** — Kao pacijent, želim primiti email i in-app obavijest o promjeni termina, kako bih mogao odmah prihvatiti ili odbiti novi ponuđeni slot. |  | Done | Email šabloni sa dinamičkim linkovima; in-app login modal koji blokira interfejs; ažuriranje u `CONFIRMED` ili oslobađanje slota |
| US-42 | **Anonimna ocjena i komentar na rad doktora** — Kao pacijent, želim anonimno ocijeniti rad ljekara nakon pregleda, kako bih pružio iskrenu povratnu informaciju bez straha od narušavanja privatnosti. | Hamza Husić, Almedin Šehić | Done | Tabela `reviews` bez stranih ključeva prema pacijentu; forma sa zvijezdama (1-5) i tekstom; admin opcija za skrivanje vulgarnog sadržaja |
| US-43 | **Profil korisnika** — Kao korisnik, želim standardizovan prikaz profila sa zaštićenim email poljem i ispravnim prikazom datuma, kako bi moji podaci bili kozistentni i tačni. | Hamza Husković | Done | Postavljanje `email` polja u read-only status |
| US-44 | **AI Chatbot asistent za korisnika** — Kao korisnik, želim imati pristup pametnom chatbot asistentu unutar aplikacije, kako bih mogao brzo dobiti odgovore na FAQ pitanja, provjeriti radno vrijeme i saznati proceduru za naručivanje. | Mušić Sumeja| Done | Integracija eksternog LLM API-ja; predefinisani FAQ kontekst ustanove; osiguravanje privatnosti podataka (bez slanja ličnih podataka pacijenta na API) |
| US-02 | **Admin panel – korisnički interfejs za uloge** — Kao administrator, želim čist i pregledan interfejs unutar admin panela, kako bih mogao vizuelno upravljati korisnicima i vršiti dodjelu uloga. | Hana Mahmutović| Done | Korisnički interfejs za menadžment uloga; integracija sa role-based routingom;Prikaz nadolazećih izuzetaka doktora (bolovanje, godišnji, konferencija);  obim ograničen na upravljanje ulogama za Release 3 |
| US-33 | **Admin panel – backend funkcionalnosti za uloge** — Kao administrator, želim stabilne backend API rute i servise, kako bi se promjene uloga korisnika sigurno i konzistentno upisivale u bazu podataka. | Hana Mahmutović | Done | Validacija dozvoljenih uloga i obaveznih dodatnih podataka; validacija admin privilegija; ažuriranje korisničkih rola u bazi podataka unutar definisanog opsega; CRUD endpointovi za sedmične šablone doktora i medicinskog osoblja |

---

## Relevantni NFR zahtjevi

| ID | Zahtjev |
|----|---------|
| NFR-01 | Samo vlasnik i autorizovano medicinsko osoblje mogu pristupiti historiji pregleda pacijenta |
| NFR-06 | Korisnik smije pristupiti samo funkcijama koje odgovaraju njegovoj ulozi |
| NFR-07 | Sistem mora implementirati RBAC (Role-Based Access Control) |
| NFR-16 | Promjene rasporeda moraju biti vidljive u roku od 2 sekunde — WebSocket / Live Updates |
| NFR-30 | Svi lični podaci pacijenata prilikom trajne anonimizacije moraju biti uklonjeni iz baze u roku od 30 dana (GDPR usklađenost) |
| NFR-31 | Prenos i skladištenje medicinske dokumentacije (PDF nalaza) mora biti kriptovano (AES-256) |
| NFR-32 | Vrijeme odziva za automatsko slanje SMS/Email notifikacija ne smije prelaziti 5 minuta od okidanja događaja |

---

## Glavni rizici

| ID | Opis |
|----|------|
| RR-20 | Kašnjenje ili neisporuka SMS poruka usljed problema na strani eksternog Infobip API gateway-a |
| RR-21 | Slučajno brisanje ili narušavanje integriteta medicinske historije prilikom izvršavanja skripte za GDPR anonimizaciju |
| RR-22 | Race condition situacije na listi čekanja ako dva pacijenta istovremeno pokušaju potvrditi isti oslobođeni termin |
| RR-23 | Preopterećenje baze podataka usljed čestih WebSocket / Polling zahtjeva za grafički prikaz zauzetosti kabineta |
| RR-24 | Sigurnosni propusti prilikom uploada fajlova (mogućnost uploada malicioznih skripti umjesto PDF dokumenata) |

---

## Deliverable-i

- Funkcionalan frontend i backend za pregled historije bolesti, integrisan sa zaštićenim PDF laboratorijskim nalazima.
- Unapređen doktorski dashboard sa naprednim kalendarskim prikazom, filtriranjem i direktnim uvidom u raspored.
- Panel medicinskog osoblja proširen kontrolama u realnom vremenu i optimizovanom pretragom pacijenata (Ime, Prezime, JMBG).
- Trijažni sistem označavanja hitnosti (`urgency_level`) sa vizuelnim indikatorima u bojama na panelima osoblja i ljekara.
- Implementiran siguran modul za upload PDF nalaza do 5MB sa enkripcijom na skladištu (S3/lokalno).
- Potpuno funkcionalan Cron Job sistem za detekciju hroničnih bolesnika povezan sa Infobip SMS servisom za slanje podsjetnika.
- Automatizovana lista čekanja sa event-driven logikom slanja obavijesti i TTL ograničenjem od 30 minuta.
- Grafički mrežni prikaz (Grid) zauzetosti specijalističkih kabineta sa WebSocket/Polling osvježavanjem podataka.
- GDPR modul na profilu pacijenta za privremenu deaktivaciju i trajnu anonimizaciju podataka bez kaskadnog brisanja medicinskih zapisa.
- Sistem dvosmjernih in-app i email obavijesti za otkazane/pomjerene termine sa akcijama "Prihvati" i "Odbij".
- Anonimni sistem recenzija i ocjena ljekara (1-5 zvjezdica) koji garantuje privatnost pacijenta (bez stranih ključeva).
- Refaktorisan profil korisnika sa read-only email poljem i riješenim **BUG-03** (standardizovan lokalni prikaz datuma `dd/mm/yyyy`).

---

## Sažetak sprinta

Sprint 9 se fokusira na stabilizaciju i proširenje personalizovanih panela kroz uvođenje naprednih poslovnih logika i automatizacije neophodnih za **Release 3**. Težište rada je na integraciji eksternih komunikacijskih kanala (Infobip SMS gateway, Email podsjetnici) i rješavanju kritičnih arhitektonskih izazova kao što su event-driven liste čekanja i WebSocket osvježavanje zauzetosti specijalističkih kabineta u realnom vremenu. Velika pažnja posvećena je sigurnosti i zakonskim regulativama kroz implementaciju šifrovanog uploada laboratorijskih nalaza, trijažnog sistema hitnosti, te kompleksnog mehanizma za GDPR anonimizaciju korisničkih profila. Sprint uspješno zatvara i zaostale tehničke dugove poput standardizacije formata datuma (BUG-03), čime se osigurava stabilna i visoko funkcionalna cjelina spremna za isporuku.

---

> **Napomena:** Ovaj Sprint Backlog je živi dokument i ažurira se kroz sprint. Svaki backlog item direktno je vezan za odgovarajući user story ili tehnički zadatak. Testiranje GDPR anonimizacije i skripti nad bazom podataka mora se izvršiti u staging okruženju prije bilo kakve integracije. Kolona "Odgovorna osoba" popunjava se na Sprint Planning sesiji.

**Release:** Release 3 — Paneli korisnika, medicinska historija | **Sprint:** Sprint 9 | **Ključna isporuka:** Prošireni paneli sa automatizovanim podsjetnicima, listama čekanja u realnom vremenu.
