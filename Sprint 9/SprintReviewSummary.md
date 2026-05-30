# Sprint Review Summary

Ovaj izvještaj sumira rezultate završenog sprinta, identifikuje isporučene vrijednosti i definiše korekcije plana na osnovu povratnih informacija.

---

## Sprint broj:
Sprint 9

---

## Planirani sprint goal:
Proširiti i stabilizirati korisničke panele implementirane u Sprintu 8 te uvesti naprednu automatizaciju kroz sisteme obavještavanja i upravljanje listama čekanja za potrebe Release 3. Sprint obuhvata unapređenje doktorskog dashboarda sa naprednom kalendarskom logikom, proširenje panela medicinskog osoblja sa trijažnim sistemom hitnosti i grafičkim prikazom zauzetosti kabineta u realnom vremenu, te implementaciju event-driven liste čekanja sa automatskim dodeljivanjem oslobođenih termina.

---

## Šta je završeno:

| ID | Naziv | Status |
|----|-------|--------|
| US-11 | Dashboard za doktora — napredna kalendarska logika sa filtriranjem i preuzimanjem rasporeda | Završeno |
| US-24 | Panel medicinskog osoblja — proširenje kontrola u realnom vremenu i optimizovana pretraga pacijenata |  Završeno |
| US-28 | Označavanje hitnosti termina — uvođenje `urgency_level` atributa i trijažnih boja |  Završeno |
| US-32 | Upload i evidencija laboratorijskih nalaza — sigurno skladište sa enkripcijom |  Završeno |
| US-31-EXT | Hronični bolesnici + SMS podsjetnik — Cron Job i Infobip integracija | Završeno |
| US-38 | Lista čekanja za termine — event-driven servis sa TTL tajmerom | Završeno |
| US-39 | Grafički prikaz zauzetosti specijalističkih kabineta — WebSocket/Polling | Završeno |
| US-40 | Zahtjev za deaktivaciju i anonimizaciju profila (GDPR) |  Završeno |
| US-41 | Obavijest pacijentu o otkazanom/pomjerenom terminu — email i in-app | Završeno |
| US-42 | Anonimna ocjena i komentar na rad doktora | Završeno |
| US-43 | Profil korisnika — standardizacija prikaza i read-only email polje | Završeno |
| US-44 | AI Chatbot asistent za korisnika | Završeno |
| US-02 | Admin panel — korisnički interfejs za upravljanje ulogama |  Završeno |
| US-33 | Admin panel — backend funkcionalnosti i CRUD endpointi za upravljanje ulogama |  Završeno |
| — | Unit i integraciono testiranje novih funkcionalnosti | Završeno |

---

## Šta nije završeno:

Sve planirane stavke Sprinta 9 su uspješno isporučene. Nije ostalo nedovršenih user storija niti tehničkog duga prenijetog u naredni sprint.

---

## Demonstrirane funkcionalnosti ili artefakti:

- **Doktorski dashboard** — prikazana napredna kalendarska logika sa filtriranjem termina po datumu, doktoru i statusu, te preuzimanje rasporeda
- **Panel medicinskog osoblja** — demonstrirani real-time kontrole, pretraga pacijenata po imenu, prezimenu i JMBG, te trijažni sistem bojanja prema `urgency_level`
- **Grafički prikaz zauzetosti kabineta** — prikazano ažuriranje putem WebSocket/Polling mehanizma u roku od 2 sekunde (NFR-16)
- **Upload laboratorijskih PDF nalaza** — demonstriran sigurni upload sa AES-256 enkripcijom i validacijom tipa fajla (NFR-31)
- **SMS podsjetnici za hronične bolesnike** — prikazan Cron Job koji šalje automatske Infobip SMS poruke bez duplikata (NFR-32)
- **Lista čekanja** — demonstrirano automatsko dodeljivanje oslobođenih termina uz TTL tajmer od 30 minuta
- **GDPR modul** — prikazana privremena deaktivacija profila i pokretanje anonimizacije bez kaskadnog brisanja medicinskih zapisa (NFR-30)
- **Obavijesti o promjeni termina** — prikazan email i in-app flow sa akcijama "Prihvati" i "Odbij"
- **Anonimni sistem ocjenjivanja** — demonstrirano slanje ocjene i komentara bez stranih ključeva prema pacijentu
- **AI Chatbot asistent** — prikazan odgovor na FAQ pitanja bez slanja ličnih podataka na eksterni API
- **Admin panel** — demonstrirano upravljanje korisnicima i ulogama integrisano sa RBAC sistemom

---

## Glavni problemi i blokeri:

- **Infobip API integracija** — nekonzistentna dokumentacija eksternog SMS API-ja uzrokovala je tehničke poteškoće i usporila implementaciju u prvim danima sprinta. Problem je riješen u potpunosti i nije ugrozio sprint cilj.
- **Sandbox testiranje SMS funkcionalnosti** — trajalo je duže od planiranog zbog ograničenja na strani eksternog servisa, što je povratno uticalo na testne cikluse.

---

## Ključne odluke donesene u sprintu:

- SMS notifikacije ostaju aktivne za sve tipove termina (zakazivanje, otkazivanje, podsjetnik 24h); email notifikacije zadržavaju se kao paralelni kanal radi pouzdanosti.
- Proširenje admin panela potvrđeno kao dio Release 3 deliverable-a — neće se pomjerati u Sprint 10.
- Verifikovano da sistem ispunjava NFR-16 (promjene rasporeda vidljive u roku od 2 sekunde) putem WebSocket mehanizma.
- Za buduće integracije s eksternim servisima utvrđena je praksa ranog pribavljanja sandbox okruženja i testnih API ključeva još u fazi planiranja.

---

## Povratna informacija Product Ownera:

Product Owner je izrazio visok stepen zadovoljstva količinom i kvalitetom isporučenog rada. Posebno je istaknuto da je tim isporučio znatno više od planiranog — ubačen je veći broj novih funkcionalnosti nego što je sprint inicijalno predviđao, što direktno smanjuje tehnički dug za naredne sprintove i ubrzava Release 3. Product Owner nema primjedbi na kvalitet implementacije i smatra sprint uspješnim u svim aspektima.

---

## Zaključak za naredni sprint:

Sprint 9 je jedan od najproduktivnijih sprintova u projektu. Rano završavanje jezgre koda omogućilo je timu prostor za dodavanje vrijednih funkcionalnosti bez vremenskog pritiska. Jedina tehnička teškoća — integracija Infobip SMS servisa — riješena je unutar sprinta i nije ugrozila isporuku. Ulazimo u Sprint 10 s čistom bazom koda, zadovoljenim svim relevantnim NFR zahtjevima (NFR-16, NFR-30, NFR-31, NFR-32) i motiviranim timom.

---
---

# Sprint Retrospective

---

## Osnovne informacije

| Stavka | Opis |
| :--- | :--- |
| **Sprint** | Sprint 9 |
| **Release** | Release 3 |
| **Sprint cilj** | Proširenje sistema sa SMS notifikacijama, listom čekanja, naprednim kalendarom, admin panelom, GDPR modulom, AI chatbotom i stabilizacijom svih korisničkih panela implementiranih u Sprintu 8 |
| **Tim** | Sumeja Mušić, Merjem Milišić, Hamza Husković, Kenan Hatibović, Amina Alispahić, Almedin Šehić, Lamija Halilović, Hana Mahmutović |

---

## Pregled završenih stavki

| ID | Naziv | Status |
|----|-------|--------|
| US-11 | Dashboard za doktora — napredna kalendarska logika sa filtriranjem i preuzimanjem rasporeda |  Završeno |
| US-24 | Panel medicinskog osoblja — proširenje kontrola u realnom vremenu i optimizovana pretraga pacijenata |  Završeno |
| US-28 | Označavanje hitnosti termina — uvođenje `urgency_level` atributa i trijažnih boja | Završeno |
| US-32 | Upload i evidencija laboratorijskih nalaza — sigurno skladište sa enkripcijom |  Završeno |
| US-31-EXT | Hronični bolesnici + SMS podsjetnik — Cron Job i Infobip integracija | Završeno |
| US-38 | Lista čekanja za termine — event-driven servis sa TTL tajmerom | Završeno |
| US-39 | Grafički prikaz zauzetosti specijalističkih kabineta — WebSocket/Polling | Završeno |
| US-40 | Zahtjev za deaktivaciju i anonimizaciju profila (GDPR) |  Završeno |
| US-41 | Obavijest pacijentu o otkazanom/pomjerenom terminu — email i in-app | Završeno |
| US-42 | Anonimna ocjena i komentar na rad doktora | Završeno |
| US-43 | Profil korisnika — standardizacija prikaza i read-only email polje | Završeno |
| US-44 | AI Chatbot asistent za korisnika | Završeno |
| US-02 | Admin panel — korisnički interfejs za upravljanje ulogama | Završeno |
| US-33 | Admin panel — backend funkcionalnosti i CRUD endpointi za upravljanje ulogama | Završeno |
| — | Unit i integraciono testiranje novih funkcionalnosti |  Završeno |

---

## Šta je išlo dobro

- Osnovna jezgra koda završena ranije nego što je planirano, što je timu dalo prostor za implementaciju dodatnih funkcionalnosti bez vremenskog pritiska na kraju sprinta.
- Ubačen je značajan broj novih funkcionalnosti, što direktno doprinosi kvalitetu Release 3 i smanjuje tehnički dug za naredne sprintove.
- Tim je radio usklađeno — nije bilo internih nesuglasica ni komunikacijskih problema tokom sprinta.
- Svi članovi tima aktivno su doprinosili i preuzimali odgovornost za dodijeljene zadatke.
- SMS funkcionalnost uspješno je implementirana i testirana u potpunosti, uprkos manjim poteškoćama tokom integracije.

---

## Šta nije išlo dobro

- Integracija Infobip SMS provajdera izazvala je manje tehničke poteškoće — nekonzistentna dokumentacija eksternog API-ja usporila je implementaciju u prvim danima sprinta.
- Testiranje SMS funkcionalnosti u sandbox okruženju trajalo je duže od planiranog zbog ograničenja eksternog servisa.

---

## Prijedlozi za poboljšanje

- Za buduće integracije s eksternim servisima, unaprijed potvrditi sandbox okruženje i pribaviti testni API ključ još u fazi planiranja, a ne tek pri implementaciji.
- Nastaviti s praksom ranog završavanja jezgre koda — ostatak sprinta koristiti za dodatne funkcionalnosti i temeljito testiranje.
- Razmotriti uvođenje kratkog mid-sprint check-ina isključivo za identifikaciju tehničkih blokatora, kako bi se rješavali pravovremeno.

---

## Ključne odluke donesene u sprintu

- SMS notifikacije ostaju aktivne za sve tipove termina (zakazivanje, otkazivanje, podsjetnik 24h); email notifikacije zadržavaju se kao paralelni kanal radi pouzdanosti.
- Proširenje admin panela potvrđeno kao dio Release 3 deliverable-a i neće se pomjerati u Sprint 10.
- Verifikovano da sistem ispunjava NFR-16 (promjene rasporeda vidljive u roku od 2 sekunde) putem WebSocket mehanizma.

---

## Zaključak

Sprint 9 jedan je od najproduktivnijih sprintova u projektu. Rano završavanje jezgre koda omogućilo je timu da bez žurbe doda vrijedne funkcionalnosti i provede temeljno testiranje. Jedina tehnička teškoća — integracija Infobip SMS servisa — riješena je u potpunosti i nije ugrozila sprint cilj. Tim je pokazao visok stepen samoodgovornosti, pozitivnu radnu atmosferu i jasnu usmjerenost prema kvalitetnom releaseu. Ulazimo u Sprint 10 s čistom bazom koda, zadovoljenim svim NFR zahtjevima i motiviranim timom.

---

> **Release:** Release 3 | **Sprint:** Sprint 9 | **Ključna isporuka:** Napredni kalendar, trijažni sistem, lista čekanja, SMS/email notifikacije, GDPR modul, AI chatbot, admin panel i stabilizacija korisničkih panela
