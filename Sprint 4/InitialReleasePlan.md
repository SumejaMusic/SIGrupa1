# Initial Release Plan

---

## 1. Uvod

Plan je zasnovan na svim dokumentima kreiranim tokom Sprintova 1–4: Product Vision, Product Backlog (PB-1 do PB-12), User Stories (US-01 do US-37), Nefunkcionalni zahtjevi (NFR-01 do NFR-26), Architecture Overview, Domain Model, Risk Register i Definition of Done.

Ukupni vremenski okvir projekta obuhvata Sprintove 5–13. Razvoj počinje Sprintom 5 (prvi funkcionalni inkrement) i traje do Sprinta 12 (finalna verzija sistema), dok je Sprint 13 rezervisan za završnu demonstraciju i odbranu.

Sistem je podijeljen na **5 releasea** koji odgovaraju logičkim skupinama funkcionalnosti. Svaki release isporučuje upotrebljiv i testabilan inkrement. Zavisnosti između releasea su čvrste, nije moguće raditi sljedeći release bez završetka prethodnog.

---

## 2. Pregled svih releasea

| Release | Naziv | Sprintovi | Ključna isporuka |
|:---:|:---|:---:|:---|
| **R0** | Projektna dokumentacija i tehnički temelji | Sprint 1–4 | Kompletna projektna dokumentacija, ER model, arhitektura sistema |
| **R1** | Autentikacija i sigurnost | Sprint 5 | Funkcionalan login sistem sa JWT tokenima, RBAC, 2FA i enkripcijom |
| **R2** | Administracija i upravljanje korisnicima | Sprint 6 | Admin panel za upravljanje korisnicima, doktorima i radnim vremenom |
| **R3** | Rezervacijski sistem | Sprint 7–8 | Funkcionalan end-to-end tok rezervacije i otkazivanja termina |
| **R4** | Paneli korisnika, medicinska historija i statistika | Sprint 9–10 | Personalizovani interfejsi za sve uloge, historija i izvještaji |
| **R5** | Stabilizacija, testiranje i finalna isporuka | Sprint 11–12 | Stabilizovan sistem, korisnička dokumentacija, release notes |

---

## 3. Detaljan opis releasea

---

### Release 0 - Projektna dokumentacija i tehnički temelji

**Obuhvaćeni sprintovi:** Sprint 1 - Sprint 4
**Ključna isporuka:** Kompletna projektna dokumentacija i postavljeni tehnički temelji sistema
**Zavisnosti:** Nema - polazna tačka projekta

**Deliverable-i:**
- Product Vision, Stakeholder mapa, Team Charter
- Product Backlog, Definition of Done, NFR zahtjevi
- Risk Register, Architecture Overview
- Domain Model, Use Case Model, ERD dijagram

**Realizovani User Storiji:**

| User Story | Naziv |
|:---|:---|
| US-34 | Kreirati ER model baze podataka |
| US-35 | Kreiranje baze podataka |
| US-36 | Definisanje prava pristupa bazi podataka |
| US-37 | Testiranje baze podataka |

**Glavni rizici:**
- RR-02: Gubitak podataka usljed greške baze ili backup-a
- RR-07: Neusklađenost sa zakonima o zaštiti podataka
- RR-22: Pogrešno dodijeljena korisnička uloga pri inicijalnom postavljanju

> **Sažetak:** Na kraju ovog releasea tim posjeduje kompletnu projektnu dokumentaciju i postavljenu infrastrukturu baze podataka. ER model je validiran (FK, unique, not null - NFR-19), razvojno okruženje je konfigurisano, a svi projektni artefakti su usvojeni od strane stakeholdera. Ovo je preduslov za sve naredne release.

---

### Release 1 - Autentikacija i sigurnost

**Obuhvaćeni sprintovi:** Sprint 5
**Ključna isporuka:** Funkcionalan login sistem sa JWT tokenima, RBAC kontrolom pristupa, dvofaktorskom autentikacijom i enkripcijom osjetljivih podataka
**Zavisnosti:** Release 0 mora biti završen. JWT i RBAC sistem su preduslov za sve ostale module jer svaki zahtjev mora biti autentikovan i autorizovan prema korisničkoj ulozi.

**Deliverable-i:**
- Implementiran Auth servis (Login, Reset lozinke).
- Konfigurisan RBAC (Role-Based Access Control) mehanizam.
- Implementirana AES-256 enkripcija za osjetljive podatke u bazi.
- Integrisana 2FA (Two-Factor Authentication) putem emaila.
- Tehnička dokumentacija sigurnosnih protokola.

**Realizovani User Storiji:**

| User Story | Naziv | 
|:---|:---|
| US-03 | Login sistem |
| US-16 | Reset lozinke putem emaila | 
| US-19 | Automatska odjava nakon perioda neaktivnosti | 
| US-25 | Two factor authentication |
| US-26 | Detekcija neobičnog ponašanja - blokiranje naloga nakon neuspješnih pokušaja |
| US-27 | Enkripcija osjetljivih podataka |
| US-20 | Logovanje svih akcija u sistemu - audit log | 

**Relevantni NFR zahtjevi:**
- NFR-03: Prijava korisnika mora biti završena u roku od maksimalno 2 sekunde
- NFR-04: Lozinke se moraju čuvati u hashiranom obliku - bcrypt
- NFR-05: Sistem mora blokirati korisnika nakon 5 neuspješnih pokušaja prijave
- NFR-06: Korisnik smije pristupiti samo funkcijama koje odgovaraju njegovoj ulozi
- NFR-07: Sistem mora implementirati RBAC
- NFR-08: Sve izmjene moraju biti evidentirane u audit log sistemu
- NFR-13: Sesija korisnika mora automatski isteći nakon perioda neaktivnosti
- NFR-14: Nakon isteka sesije korisniku mora biti onemogućen pristup prethodnim podacima
- NFR-23: Sistem mora omogućiti two factor authentication
- NFR-24: Sistem mora implementirati enkripciju za osjetljive zdravstvene podatke

**Glavni rizici:**
- RR-08: Neovlašten pristup podacima usljed slabe autentikacije
- RR-11: Neautorizovan pristup admin panelu ako RBAC nije ispravno implementiran
- RR-21: Curenje medicinskih podataka pacijenata
- RR-12: Gubitak sesije korisnika usljed isteka session tokena

> **Sažetak:** Na kraju ovog releasea, sistem ima uspostavljen "sigurnosni perimetar". Korisnici mogu sigurno pristupiti sistemu, identiteti su verifikovani putem 2FA, a svi osjetljivi podaci u bazi su zaštićeni enkripcijom. Implementirani RBAC osigurava da korisnici (pacijenti, doktori, admini) imaju pristup samo onim resursima koji su im dodijeljeni, čime je stvorena stabilna osnova za razvoj funkcionalnosti iz narednih sprintova.

---

### Release 2 - Administracija i upravljanje korisnicima

**Obuhvaćeni sprintovi:** Sprint 6
**Ključna isporuka:** Admin panel za registraciju pacijenata i doktora, upravljanje radnim vremenom i rasporedom doktora, menadžment panel sa statistikama
**Zavisnosti:** Release 1 mora biti završen. CRUD operacije zahtijevaju funkcionalan JWT i RBAC sistem, bez autentikacije nije moguće razlikovati administratora od pacijenta.

| User Story | Naziv | 
|:---|:---|
| US-04 | Admin panel - registracija pacijenta | 
| US-14 | Upravljanje radnim vremenom doktora (admin) | 
| US-02 | Admin panel - korisnički interfejs za administraciju | 
| US-33 | Admin panel - backend funkcionalnosti |
| US-18 | Menadžment panel | 
| US-29 | Statistika zdravstvene ustanove (admin) |
| US-30 | Export statistike zakazanih pregleda u CSV formatu | 

**Relevantni NFR zahtjevi:**
- NFR-01: Samo ovlašteno osoblje može pristupiti historiji pregleda pacijenta
- NFR-15: Dashboard sistema mora se učitati u roku od maksimalno 3 sekunde
- NFR-18: Admin backend mora odgovarati u roku od 2 sekunde
- NFR-19: Baza podataka mora osigurati konzistentnost i integritet podataka
- NFR-26: Sistem mora imati intuitivan interfejs za upravljanje i rezervaciju termina

**Glavni rizici:**
- RR-09: Neispravni podaci o pacijentima usljed greške pri unosu od strane administratora
- RR-06: Loše korisničko iskustvo usljed kompleksnosti interfejsa
- RR-24: Neažurni podaci o dostupnosti doktora

---

### Release 3 - Rezervacijski sistem

**Obuhvaćeni sprintovi:** Sprint 7 i Sprint 8
**Ključna isporuka:** Funkcionalan end-to-end tok rezervacije i otkazivanja termina sa zaštitom od duplih rezervacija i email notifikacijama
**Zavisnosti:** Release 2 mora biti završen. Rezervacijski sistem ne može funkcionisati bez prethodno kreiranog inventara: doktori, radna vremena i termini moraju postojati u bazi.

| User Story | Naziv                                                    |
| :--------- | :------------------------------------------------------- |
| US-05      | Pregled dostupnih resursa - doktori i slobodni termini   |
| US-06      | Rezervacija termina na osnovu dostupnog rasporeda        |
| US-07      | Rezervacija termina kod doktora po izboru pacijenta      |
| US-13      | Validacija i sprječavanje duplih rezervacija             |
| US-12      | Automatsko oslobađanje zaključanih termina - buffer zona |
| US-22      | Dodavanje komentara prilikom zakazivanja termina         |
| US-09      | Otkazivanje termina od strane medicinskog osoblja                     |
| US-10      | Otkazivanje termina od strane pacijenta                               |
| US-08      | Email potvrda o rezervaciji                                           |
| US-15      | Upravljanje radnim vremenom doktora - upit za promjenu dužine termina |
| US-31      | Automatski podsjetnik za pacijente sa hroničnim bolestima             |


**Relevantni NFR zahtjevi:**
- NFR-09: Otkazani termini moraju odmah postati dostupni drugim korisnicima (≤2s)
- NFR-10: Otkazivanje termina mora biti završeno u roku od 2–3 sekunde
- NFR-11: Pacijent mora biti obaviješten o otkazivanju termina putem emaila
- NFR-12: Sistem mora osigurati da se operacije izvršavaju bez djelimičnih zapisa - ACID
- NFR-16: Promjene rasporeda moraju biti vidljive u roku od 2 sekunde - WebSocket
- NFR-22: Sistem mora zaključati termin na 2 minute tokom unosa podataka
- NFR-25: Sistem mora biti dostupan najmanje 99% vremena u toku radnog vremena klinike


**Glavni rizici:**
- RR-03: Greške u logici zakazivanja termina
- RR-10: Dupli termini - race condition ako database locks nisu ispravno implementirani (NFR-22)
- RR-13: Konflikt u rasporedu doktora usljed nedostatka centralne provjere
- RR-15: Kašnjenje email notifikacija usljed problema sa eksternim servisom
- RR-01: Buffer zona - rizik od nezaključavanja termina u slučaju pada servera

> **Sažetak releasea:** Ovo je srž sistema. Pacijent pregledava slobodne termine i doktore, bira termin i zakazuje pregled. Sistem automatski blokira konfliktne rezervacije putem buffer zone (NFR-22). Otkazivanje je dostupno i pacijentu i medicinskom osoblju uz pravilo zabrane otkazivanja 24h prije termina. Pacijent prima email potvrdu putem Nodemailer-a, a promjene su vidljive u realnom vremenu putem WebSocket veze. Nakon ovog releasea sistem je funkcionalno upotrebljiv za osnovno zakazivanje termina.

---

### Release 4 - Paneli korisnika, medicinska historija i statistika

**Obuhvaćeni sprintovi:** Sprint 9 i Sprint 10
**Ključna isporuka:** Personalizovani interfejsi za sve korisničke uloge, medicinska historija pacijenta sa nalazima, označavanje hitnosti, dashboard doktora i panel medicinskog osoblja
**Zavisnosti:** Release 3 mora biti završen. Paneli doktora i medicinskog osoblja direktno ovise o rezervacijskom toku koji mora biti testiran i stabilan.

| User Story | Naziv                                                                 |
| :--------- | :-------------------------------------------------------------------- |
| US-11      | Dashboard za doktora - pregled dnevnog i sedmičnog rasporeda          |
| US-21      | Omogućavanje pregleda komentara termina (doktor)                      |
| US-24      | Panel medicinskog osoblja                                             |
| US-28      | Označavanje hitnosti prijavljenog termina                             |
| US-17      | Rezervacija termina kod specijaliste putem doktora porodične medicine |
| US-01      | Historija pregleda korisnika                              |
| US-32      | Upload i evidencija laboratorijskih nalaza                |
| US-23      | Vodič za korištenje stranice - interaktivna dokumentacija |

**Relevantni NFR zahtjevi:**
- NFR-01: Samo vlasnik i autorizovano medicinsko osoblje mogu pristupiti historiji pregleda pacijenta
- NFR-02: Historija pregleda mora biti prikazana jednostavno, u maksimalno 2–3 klika
- NFR-15: Dashboard sistema mora se učitati u roku od maksimalno 3 sekunde
- NFR-16: Promjene rasporeda moraju biti vidljive u roku od 2 sekunde
- NFR-17: Medicinski dokumenti moraju biti sigurno i trajno pohranjeni
- NFR-20: Sistem mora omogućiti brze upite nad velikim skupom podataka (≥50 000 zapisa)
- NFR-26: Sistem mora imati intuitivan interfejs


**Glavni rizici:**
- RR-17: Doktor kasni ili nije dostupan - potrebno dinamičko ažuriranje rasporeda
- RR-19: Hitni slučajevi prekidaju zakazane termine
- RR-20: Konflikt između više doktora za isti resurs - sala ili oprema
- RR-06: Loše korisničko iskustvo usljed kompleksnosti interfejsa

> **Sažetak releasea:** Svaka korisnička uloga sada ima personalizovani interfejs. Doktor vidi dnevni i sedmični raspored te komentare uz termine. Medicinsko osoblje upravlja aktivnim terminima i označava hitne slučajeve. Pacijent pristupa potpunoj medicinskoj historiji i laboratorijskim nalazima u PDF formatu. Doktor opšte prakse može rezervisati termin kod specijaliste u ime pacijenta. Sistem je funkcionalno kompletan.

---

### Release 5 - Stabilizacija, testiranje i finalna isporuka

**Obuhvaćeni sprintovi:** Sprint 11 i Sprint 12
**Ključna isporuka:** Stabilizovan sistem, kompletna test evidencija, korisnička i tehnička dokumentacija, release notes
**Zavisnosti:** Releasi 1–4 moraju biti završeni. Stabilizacija i finalno testiranje direktno ovise o kompletnosti prethodnih inkremenata.

**Fokus aktivnosti:**
- Performansno testiranje pod opterećenjem - JMeter (NFR-03, NFR-10, NFR-15, NFR-18, NFR-20)
- Testiranje upita nad skupom od najmanje 50 000 zapisa u bazi (NFR-20)
- Sigurnosno testiranje - provjera RBAC scenarija, penetration testing (NFR-05, NFR-07, NFR-23)
- Uptime monitoring konfiguracija - UptimeRobot (NFR-25)
- Testiranje backup i disaster recovery mehanizama (NFR-17)
- Provjera edge caseova: neispravni unosi, istovremeni zahtjevi, djelimični zapisi (NFR-12)
- Lista poznatih ograničenja i tehničkog duga
- Plan završne demonstracije
- Finalni code review i provjera Definition of Done za sve User Storije
- Korisnička dokumentacija
- Tehnička dokumentacija
- Release Notes
- Ažuriranje svih obaveznih logova i artefakata - AI Usage Log, Decision Log
- Finalni kandidatski inkrement

**Glavni rizici:**
- RR-04: Preopterećenje sistema pri velikom broju istovremenih korisnika
- RR-25: Prekoračenje budžeta usljed produženih rokova
- RR-18: Pacijent ne razumije sistem usljed kompleksnog interfejsa
- RR-14: Neispravne obavijesti pacijentima

> **Sažetak releasea:** Sprint 11 je posvećen stabilizaciji i testiranju. Sprint 12 zatvara projekat kompletnom dokumentacijom i finalnom verzijom sistema, spremnom za demonstraciju i odbranu.

---

## 4. Zavisnosti između releasea

| Release | Ovisi o | Razlog zavisnosti |
|:---:|:---|:---|
| **R1 - Sprint 5** | R0 (Sprint 1–4) | Tehnički temelji i baza podataka moraju biti postavljeni prije prvog commita poslovne logike |
| **R2 - Sprint 6** | R1 (Sprint 5) | CRUD operacije zahtijevaju funkcionalan JWT i RBAC sistem - bez autentikacije nije moguće razlikovati administratora od pacijenta |
| **R3 - Sprint 7–8** | R2 (Sprint 6) | Rezervacijski sistem ne može funkcionisati bez prethodno kreiranog inventara - doktori, radna vremena i termini moraju postojati u bazi |
| **R4 - Sprint 9–10** | R3 (Sprint 7–8) | Paneli doktora i medicinskog osoblja direktno ovise o rezervacijskom toku koji mora biti testiran i stabilan |
| **R5 - Sprint 11–12** | R4 (Sprint 9–10) | Stabilizacija i finalno testiranje ovise o kompletnosti svih prethodnih inkremenata |

---

## 5. Mapiranje ključnih NFR zahtjeva na release

| NFR ID | Opis (skraćeno) | Kategorija | Release |
|:---|:---|:---:|:---:|
| NFR-03 | Prijava korisnika ≤2 sekunde | Performanse | R1 |
| NFR-04, NFR-05 | Hashiranje lozinki, blokiranje naloga nakon 5 pokušaja | Sigurnost | R1 |
| NFR-06, NFR-07 | Pristup samo dozvoljenoj sadržini, RBAC | Sigurnost | R1 |
| NFR-08 | Audit log svih akcija | Pouzdanost | R1 |
| NFR-13, NFR-14 | Session timeout i redirect na login | Sigurnost | R1 |
| NFR-23, NFR-24 | 2FA i enkripcija osjetljivih podataka | Sigurnost | R1 |
| NFR-15 | Dashboard učitava se ≤3s | Performanse | R2 |
| NFR-18 | Admin backend odgovara ≤2s | Performanse | R2 |
| NFR-19 | Konzistentnost i integritet baze podataka | Pouzdanost | R2 |
| NFR-09 | Otkazani termin odmah dostupan (≤2s) | Konzistentnost | R3 |
| NFR-10 | Otkazivanje završeno ≤3s | Performanse | R3 |
| NFR-11 | Email obavijest o otkazivanju termina | Pouzdanost | R3 |
| NFR-12 | Atomičnost operacija - bez djelimičnih zapisa | Pouzdanost | R3 |
| NFR-16 | Real-time ažuriranje rasporeda - WebSocket | Konzistentnost | R3 |
| NFR-22 | Zaključavanje termina na 2 minute - buffer zona | Konzistentnost | R3 |
| NFR-01 | Pristup historiji samo ovlaštenim ulogama | Sigurnost | R4 |
| NFR-02 | Historija dostupna u ≤3 klika | Upotrebljivost | R4 |
| NFR-17 | Medicinski dokumenti sigurno pohranjeni | Pouzdanost | R4 |
| NFR-20 | Brzi upiti nad 50 000+ zapisa | Performanse | R5 |
| NFR-25 | Dostupnost sistema ≥99% radnog vremena | Pouzdanost | R5 |
| NFR-26 | Intuitivan interfejs - rezervacija bez nepotrebnih koraka | Upotrebljivost | R5 |

