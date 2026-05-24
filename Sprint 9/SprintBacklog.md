# Sprint Backlog — Sprint 9

**Status:** Aktivan / Planiran  
**Trajanje:** 2 sedmice (10 radnih dana)  
**Fokus sprinta:** Proširenja osnovnih funkcionalnosti, stabilizacija kritičnih korisničkih panela (Pacijent, Doktor, Medicinsko osoblje) te implementacija napredne automatizacije (SMS/Email podsjetnici i liste čekanja) za potrebe **Release 3**.

---

##  Pregled korisničkih priča u Sprintu 9

| ID Priče | Povezanost sa PB | Naziv i kratki opis | Prioritet | Procjena (Story Points) |
|:---|:---|:---|:---:|:---:|
| **US-01** | PB-4 | **Historija pregleda korisnika**<br>Završetak frontenda, integracija preuzetih laboratorijskih nalaza i prikaz otkazanih termina sa posebnim statusom. | Srednji | 3 SP |
| **US-11** | PB-10 | **Dashboard za doktora – pregled rasporeda**<br>Kompletna poslovna logika za dnevni/sedmični prikaz, kalendarska integracija i filtriranje. | Srednji | 5 SP |
| **US-24** | PB-11 | **Panel medicinskog osoblja**<br>Dopuna kontrola za upravljanje, pretraga i ažuriranje statusa aktivnih pacijenata u realnom vremenu. | Visok | 5 SP |
| **US-28** | PB-11 | **Označavanje hitnosti prijavljenog termina**<br>Vizuelni indikatori (trijažne boje) na dashboardima za hitne slučajeve. | Srednji | 2 SP |
| **US-32** | PB-4 | **Upload i evidencija laboratorijskih nalaza**<br>Siguran upload PDF dokumenata od strane osoblja i njihovo vezivanje za istoriju bolesti. | Srednji | 5 SP |
| **US-31-EXT**| PB-7 | **Hronični bolesnici + SMS podsjetnik**<br>Logika označavanja pacijenata, cron-job za kalkulaciju perioda i integracija sa Infobip SMS API-jem. | Visok | 8 SP |
| **US-38** | PB-2 | **Lista čekanja za termine**<br>Sistem prijavljivanja na listu u slučaju popunjenosti i automatizovani sistem slanja linka sa prozorom od 30 min. | Srednji | 8 SP |
| **US-39** | PB-11 | **Grafički prikaz zauzetosti specijalističkih kabineta**<br>Grid/mrežni prikaz resursa u realnom vremenu sa automatskim osvježavanjem (WebSocket/Polling). | Srednji | 5 SP |
| **US-40** | PB-6 | **Zahtjev za deaktivaciju i anonimizaciju profila**<br>Implementacija GDPR procesa privremene deaktivacije i trajne anonimizacije ličnih podataka. | Visok | 5 SP |
| **US-41** | PB-1 | **Obavijest pacijentu o otkazanom/pomjerenom terminu**<br>Automatizovani email/in-app modalni prozor sa akcijama za prihvatanje ili odbijanje novog slota. | Visok | 5 SP |
| **US-42** | PB-10 | **Anonimna ocjena i komentar na rad doktora**<br>Sistem recenzija nakon završenog pregleda uz strogu bazu bez stranih ključeva prema pacijentu. | Srednji | 3 SP |
| **US-43** | PB-4 | **Profil korisnika**<br>Ažuriranje i standardizacija prikaza, zaključavanje email polja i implementacija popravke formata datuma (BUG-03). | Visok | 2 SP |

**Ukupan kapacitet sprinta:** 56 Story Points

---

##  Detaljna razrada zadataka (Tasks) po korisničkim pričama

### US-01: Historija pregleda korisnika
* **Task 01.1:** Kreiranje frontend komponenti za tablični i detaljni prikaz istorije na profilu pacijenta. *(FE)* — **1 SP**
* **Task 01.2:** Implementacija API endpointa `/api/v1/patients/me/history` sa paginacijom i filterom za status "OTKAZAN". *(BE)* — **1 SP**
* **Task 01.3:** Povezivanje detaljnog prikaza sa povezanim laboratorijskim nalazima (PDF). *(Full-Stack)* — **1 SP**

### US-11: Dashboard za doktora – pregled rasporeda
* **Task 11.1:** Implementacija kalendarskog interfejsa (dnevni/sedmični prikaz) za ljekara koristeći biblioteku kompatibilnu sa aplikacijom. *(FE)* — **2 SP**
* **Task 11.2:** Izrada backend servisa za preuzimanje rasporeda ljekara na osnovu ID-ja prijavljenog korisnika. *(BE)* — **2 SP**
* **Task 11.3:** Dodavanje filtera za brzu pretragu pacijenata unutar kalendarskog prikaza. *(FE)* — **1 SP**

### US-24: Panel medicinskog osoblja
* **Task 24.1:** Proširenje postojećeg panela sa novim akcijama (brzo otkazivanje, prosljeđivanje ljekaru, izmjena osnovnog statusa). *(FE)* — **2 SP**
* **Task 24.2:** Izrada optimizovanih SQL upita i API ruta za pretragu pacijenata po imenu, prezimenu ili JMBG-u unutar panela osoblja. *(BE)* — **2 SP**
* **Task 24.3:** Integracija vizuelnih notifikacija o dolasku pacijenta na prijem. *(FE)* — **1 SP**

### US-28: Označavanje hitnosti prijavljenog termina
* **Task 28.1:** Dodavanje atributa `urgency_level` (enum: LOW, MEDIUM, HIGH, EMERGENCY) u bazu podataka (tabela `appointments`). *(DB)* — **0.5 SP**
* **Task 28.2:** Implementacija trijažnih boja (zelena, žuta, crvena) u tabelama i kalendarima na panelu medicinskog osoblja i doktora. *(FE)* — **1 SP**
* **Task 28.3:** Izrada validacije koja sprječava neovlaštenu izmjenu nivoa hitnosti od strane pacijenta. *(BE)* — **0.5 SP**

### US-32: Upload i evidencija laboratorijskih nalaza
* **Task 32.1:** Kreiranje drag-and-drop komponente za upload fajlova na panelu medicinskog osoblja (restrikcija na `.pdf`, maksimalno 5MB). *(FE)* — **1.5 SP**
* **Task 32.2:** Konfiguracija sigurnog skladišta (AWS S3 ili lokalni zaštićeni volumen) i enkripcija datoteka u mirovanju. *(DevOps)* — **2 SP**
* **Task 32.3:** Kreiranje endpointa `/api/v1/appointments/{id}/attachments` i mapiranje u bazi podataka. *(BE)* — **1.5 SP**

### US-31-EXT: Označavanje pacijenta kao hronični bolesnik + SMS podsjetnik
* **Task 31.1:** Dodavanje polja `is_chronic` (boolean) i `routine_checkup_days` (int) u tabelu `patients`. *(DB)* — **1 SP**
* **Task 31.2:** Izrada klijenta i integracija eksternog Infobip SMS API gateway-a unutar aplikacije. *(BE)* — **2.5 SP**
* **Task 31.3:** Razvoj automatskog dnevnog posla (Cron Job / Worker) koji računa vremensku distancu od zadnjeg pregleda i identifikuje primaoce. *(BE)* — **3 SP**
* **Task 31.4:** Implementacija logike provere postojanja aktivnih termina kako bi se spriječilo dupliranje obavijesti. *(BE)* — **1.5 SP**

### US-38: Lista čekanja za termine
* **Task 38.1:** Kreiranje baze/tabele `waiting_lists` sa pratećim relacijama i hronološkim logovanjem. *(DB)* — **1.5 SP**
* **Task 38.2:** Logika prepoznavanja popunjenosti termina i prikaz dugmeta "Prijavi se na listu" na korisničkom interfejsu. *(FE/BE)* — **2 SP**
* **Task 38.3:** Razvoj event-driven servisa koji pri otkazivanju termina šalje email prvom na listi čekanja i pokreće TTL (Time-To-Live) tajmer od 30 minuta. *(BE)* — **3 SP**
* **Task 38.4:** Logika automatske eskalacije: prebacivanje na status "ISTEKAO" i slanje ponude sljedećem na listi. *(BE)* — **1.5 SP**

### US-39: Grafički prikaz zauzetosti specijalističkih kabineta
* **Task 39.1:** Izrada grid layout-a sa karticama kabineta i primjena color-coding pravila (Zelena/Žuta/Crvena). *(FE)* — **2 SP**
* **Task 39.2:** Konfiguracija WebSocket servera (ili optimizovanog short-polling mehanizma na 60s) za slanje trenutnog stanja zauzetosti resursa. *(BE)* — **2 SP**
* **Task 39.3:** Integracija modalnog prozora za brzu dodjelu hitnog slučaja direktno klikom na slobodnu karticu kabineta. *(FE)* — **1 SP**

### US-40: Zahtjev za deaktivaciju i anonimizaciju profila
* **Task 40.1:** Kreiranje sekcije "Privatnost" na profilu korisnika sa opcijom pokretanja zahtjeva i prikazom zakonskog roka od 30 dana. *(FE)* — **1 SP**
* **Task 40.2:** Razvoj backend skripte/servisa za anonimizaciju: zamjena ličnih kolona u tabeli `users` generičkim tokenima (`USER_ANON_ID`), uz zadržavanje nepovezanih zapisa u medicinskim tabelama. *(BE/DB)* — **3 SP**
* **Task 40.3:** Dodavanje administrativne kontrole u menadžment panelu za verifikaciju i konačno odobrenje zahtjeva. *(FE/BE)* — **1 SP**

### US-41: Obavijest pacijentu o otkazanom/pomjerenom terminu
* **Task 41.1:** Izrada email šablona sa integrisanim dinamičkim linkovima/dugmadima za akcije "Prihvati" i "Odbij". *(BE)* — **1.5 SP**
* **Task 41.2:** Kreiranje in-app modalnog prozor koji blokira interfejs pacijenta pri loginu ukoliko postoji nepotvrđena izmjena termina. *(FE)* — **2 SP**
* **Task 41.3:** Obrada akcija pacijenta (prihvatanje ažurira termin u `CONFIRMED`, odbijanje oslobađa slot i šalje notifikaciju ljekaru). *(BE)* — **1.5 SP**

### US-42: Anonimna ocjena i komentar na rad doktora
* **Task 42.1:** Kreiranje nezavisne tabele `reviews` koja ne posjeduje relaciju (strani ključ) prema pacijentu, već isključivo prema ljekaru i šifrovanom ID-ju termina. *(DB)* — **1 SP**
* **Task 42.2:** Izrada forme za unos ocjene (zvijezde 1-5 i tekstualno polje do 500 karaktera) sa validacijom statusa termina `ZAVRŠEN`. *(FE)* — **1 SP**
* **Task 42.3:** Dodavanje opcije "Sakrij komentar" u menadžment panelu za moderaciju vulgarnog sadržaja. *(BE/FE)* — **1 SP**

### US-43: Profil korisnika
* **Task 43.1:** Refaktorisanje forme profila: postavljanje polja `email` u status *read-only* i dodavanje validacije formata za ostala polja. *(FE)* — **1 SP**
* **Task 43.2:** Primjena popravke iz **BUG-03**: implementacija helperskih funkcija na klijentu koje osiguravaju prikaz svih datuma isključivo u lokalnom formatu `dd/mm/yyyy`. *(FE)* — **1 SP**

---
