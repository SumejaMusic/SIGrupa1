# Sprint 9 Goal — Proširenje panela, automatizacija i stabilizacija sistema

## Sprint cilj

Cilj Sprinta 9 je proširiti i stabilizirati korisničke panele implementirane u Sprintu 8 te uvesti naprednu automatizaciju kroz sisteme obavještavanja i upravljanje listama čekanja za potrebe Release 3. Sprint obuhvata unapređenje doktorskog dashboarda sa naprednom kalendarskom logikom, proširenje panela medicinskog osoblja sa trijažnim sistemom hitnosti i grafičkim prikazom zauzetosti kabineta u realnom vremenu, te implementaciju event-driven liste čekanja sa automatskim dodeljivanjem oslobođenih termina.

Na kraju sprinta, sistem posjeduje funkcionalan modul za sigurni upload laboratorijskih PDF nalaza sa enkripcijom (NFR-31), potpuno integrisan Infobip SMS servis za automatske podsjetnike hroničnih bolesnika (NFR-32), te GDPR modul koji pacijentima omogućava privremenu deaktivaciju i trajnu anonimizaciju profila (NFR-30). Pored toga, sistem dobija AI chatbot asistenta za korisnike, anonimni sistem ocjenjivanja ljekara i dvosmjerne in-app i email obavijesti za otkazane i pomjerene termine. Sve promjene u rasporedu i zauzetosti kabineta vidljive su u realnom vremenu putem WebSocket mehanizma (NFR-16).

Sprint se smatra uspješnim kada su svi automatizovani procesi — **detekcija hroničnog bolesnika → kalkulacija perioda → slanje SMS podsjetnika** i **otkazivanje termina → notifikacija liste čekanja → potvrda novog termina** — funkcionalni bez kritičnih grešaka i u skladu sa definisanim NFR zahtjevima.

---

## User storije u Sprintu 9

| ID | Naziv |
|----|-------|
| US-11 | Dashboard za doktora — napredna kalendarska logika sa filtriranjem i preuzimanjem rasporeda |
| US-24 | Panel medicinskog osoblja — proširenje kontrola u realnom vremenu i optimizovana pretraga pacijenata |
| US-28 | Označavanje hitnosti termina — uvođenje `urgency_level` atributa i trijažnih boja |
| US-32 | Upload i evidencija laboratorijskih nalaza — sigurno skladište sa enkripcijom |
| US-31-EXT | Hronični bolesnici + SMS podsjetnik — Cron Job i Infobip integracija |
| US-38 | Lista čekanja za termine — event-driven servis sa TTL tajmerom |
| US-39 | Grafički prikaz zauzetosti specijalističkih kabineta — WebSocket/Polling |
| US-40 | Zahtjev za deaktivaciju i anonimizaciju profila (GDPR) |
| US-41 | Obavijest pacijentu o otkazanom/pomjerenom terminu — email i in-app |
| US-42 | Anonimna ocjena i komentar na rad doktora |
| US-43 | Profil korisnika — standardizacija prikaza i read-only email polje |
| US-44 | AI Chatbot asistent za korisnika |
| US-02 | Admin panel — korisnički interfejs za upravljanje ulogama |
| US-33 | Admin panel — backend funkcionalnosti i CRUD endpointi za upravljanje ulogama |

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

## Kriteriji prihvatanja sprinta

- [ ] Doktorski dashboard je unapređen — napredno filtriranje termina i kalendarska logika rade ispravno (US-11)
- [ ] Panel medicinskog osoblja proširen je kontrolama u realnom vremenu, pretraživanjem po imenu, prezimenu i JMBG te trijažnim bojama (US-24, US-28)
- [ ] Grafički prikaz zauzetosti specijalističkih kabineta ažurira se putem WebSocket/Polling mehanizma (US-39, NFR-16)
- [ ] Upload laboratorijskih PDF nalaza funkcionalan je sa enkripcijom na skladištu i validacijom tipa fajla (US-32, NFR-31)
- [ ] Cron Job za hronične bolesnike aktivno šalje SMS podsjetnike putem Infobip servisa bez duplih obavijesti (US-31-EXT, NFR-32)
- [ ] Lista čekanja automatski dodjeljuje oslobođene termine uz TTL tajmer od 30 minuta (US-38)
- [ ] GDPR modul omogućava privremenu deaktivaciju i pokretanje anonimizacije bez kaskadnog brisanja medicinskih zapisa (US-40, NFR-30)
- [ ] Pacijent prima email i in-app obavijest o promjeni termina sa akcijama "Prihvati" i "Odbij" (US-41)
- [ ] Anonimni sistem ocjenjivanja ljekara funkcionalan je bez stranih ključeva prema pacijentu (US-42)
- [ ] AI Chatbot asistent odgovara na FAQ pitanja bez slanja ličnih podataka pacijenta na eksterni API (US-44)
- [ ] Admin panel — korisnički interfejs i backend za upravljanje ulogama su funkcionalni i integrisani sa RBAC sistemom (US-02, US-33)
- [ ] Profil korisnika prikazuje email u read-only statusu, a datumi su standardizovani u formatu `dd/mm/yyyy` (US-43)
- [ ] Svi relevantni NFR zahtjevi (NFR-16, NFR-30, NFR-31, NFR-32) su zadovoljeni i verifikovani testiranjem
