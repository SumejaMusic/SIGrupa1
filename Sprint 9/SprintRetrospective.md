# Sprint Retrospective 
---

## Osnovne informacije

| Stavka | Opis |
| :--- | :--- |
| **Sprint** | Sprint 9 |
| **Release** | Release 3 |
| **Sprint cilj** | Proširenje sistema sa SMS notifikacijama, historijom termina, filtriranjem, admin panela, stabilizacijom svih korisničkih panela implementiranih u Sprintu 8 i implementacija novih funkcionalnosti |
| **Tim** | Sumeja Mušić, Merjem Milišić, Hamza Husković, Kenan Hatibović, Amina Alispahić, Almedin Šehić, Lamija Halilović, Hana Mahmutović |

---

## Pregled završenih stavki

| ID | Naziv | Status |
|----|-------|--------|
| US-30 | SMS notifikacije za zakazane i otkazane termine | Završeno |
| US-32 | Automatski SMS podsjetnici 24h prije termina | Završeno |
| US-19 | Otkazivanje termina od strane pacijenta s potvrdom | Završeno |
| US-22 | Historija termina — pregled prethodnih posjeta iz pacijent panela | Završeno |
| US-25 | Filtriranje i pretraga termina po datumu, doktoru i statusu | Završeno |
| US-29 | Proširenje admin panela — upravljanje korisnicima i ulogama | Završeno |
| — | Optimizacija performansi dashboarda (verifikacija NFR-15) | Završeno |
| — | Unit i integraciono testiranje novih funkcionalnosti | Završeno |

---

## Šta je išlo dobro

- Osnovni dio koda završen ranije nego što je planirano, što je timu dalo prostor za implementaciju dodatnih funkcionalnosti bez vremenskog pritiska na kraju sprinta.
- Dosta novih funkcionalnosti ubačeno u sprint, što direktno doprinosi kvalitetu Release 5 i smanjuje tehnički dug za naredne sprintove.
- Tim je radio usklađeno — nije bilo internih nesuglasica ni komunikacijskih problema tokom sprinta.
- Svi članovi tima su aktivno doprinosili i preuzimali odgovornost za dodijeljene zadatke.
- SMS funkcionalnost je uspješno implementirana i testirana u potpunosti, uprkos manjim poteškoćama tokom integracije.

---

## Šta nije išlo dobro

- Integracija SMS provajdera izazvala je manje tehničke poteškoće — nekonzistentna dokumentacija eksternog API-ja usporila je implementaciju u prvim danima sprinta.
- Testiranje SMS funkcionalnosti u sandbox okruženju trajalo je duže od planiranog zbog ograničenja eksternog servisa.

---

## Prijedlozi za poboljšanje

- Za buduće integracije s eksternim servisima, unaprijed potvrditi sandbox okruženje i pribaviti testni API ključ još u fazi planiranja, a ne pri implementaciji.
- Nastaviti s praksom ranog završavanja jezgre koda — ostatak sprinta koristiti za dodatne funkcionalnosti i testiranje.
- Razmotriti uvođenje kratkog mid-sprint check-ina isključivo za identifikaciju tehničkih blokatora kako bi se rješavali pravovremeno.

---

## Ključne odluke donesene u sprintu

- SMS notifikacije ostaju aktivne za sve tipove termina (zakazivanje, otkazivanje, podsjetnik 24h); email notifikacije zadržavaju se kao paralelni kanal radi pouzdanosti.
- Proširenje admin panela potvrđeno kao dio Release 3 deliverable-a i neće se pomjerati u Sprint 10.
- Verifikovano da dashboard ispunjava NFR-15 (učitavanje ispod 3 sekunde) na osnovu performansnih testova provedenih tokom sprinta.

---

## Zaključak

Sprint 9 jedan je od produktivnijih sprintova u projektu. Rano završavanje jezgre koda omogućilo je timu da bez žurbe doda vrijedne funkcionalnosti i provede temeljno testiranje. Jedina tehnička teškoća — integracija SMS provajdera — riješena je u potpunosti i nije ugrozila sprint cilj. Tim je pokazao visok stepen samoodgovornosti, pozitivnu radnu atmosferu i jasnu usmjerenost prema kvalitetnom releaseu. Ulazimo u Sprint 10 s čistom bazom koda, zadovoljenim NFR zahtjevima i motiviranim timom.

---

> **Release:** Release 3 | **Sprint:** Sprint 9 | **Ključna isporuka:** SMS notifikacije, historija termina,  admin panel i stabilizacija korisničkih panela
