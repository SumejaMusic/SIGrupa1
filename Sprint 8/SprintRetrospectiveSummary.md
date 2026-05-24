
# Sprint Retrospective — Sprint 8
## Paneli korisničkih uloga i role-based pristup (Release 5)

---

## Osnovne informacije

| Stavka | Opis |
| :--- | :--- |
| **Sprint** | Sprint 8 |
| **Release** | Release 3 ( sa sprintom 9) — Paneli korisničkih uloga i role-based pristup |
| **Sprint cilj** | Završetak personalizovanih panela za sve korisničke uloge (pacijent, doktor, medicinsko osoblje, admin), integracija kompletnog toka (login → prepoznavanje uloge → panel) uz RBAC kontrolu pristupa, označavanje hitnosti termina i WebSocket ažuriranje u realnom vremenu |
| **Tim** | Sumeja Mušić, Merjem Milišić, Hana Mahmutović, Hamza Husović, Kenan Hatibović, Amina Alispahić, Almedin Šehić, Lamija Halilović |

---

## Pregled završenih stavki

| ID | Naziv | Status |
|----|-------|--------|
| US-11 | Dashboard za doktora — pregled dnevnog i sedmičnog rasporeda |  Završeno |
| US-21 | Omogućavanje pregleda komentara termina (doktor) |  Završeno |
| US-17 | Rezervacija termina kod specijaliste putem doktora porodične medicine |  Završeno |
| US-24 | Panel medicinskog osoblja |  Završeno |
| US-28 | Označavanje hitnosti prijavljenog termina |  Završeno |
| — | Automatsko preusmjeravanje na panel na osnovu uloge nakon prijave |  Završeno |
| — | Implementacija WebSocket veze za promjene rasporeda u realnom vremenu |  Završeno |
| — | Integraciono testiranje svih panela i toka prijave |  Završeno |
| — | Rješavanje i kategorizacija aktivnih bugova iz prethodnih sprintova |  Završeno |

---

## Šta je išlo dobro

- **Sve tehničke obaveze i funkcionalnosti su uspješno završene** — Unatoč izazovima tokom sprinta, sve planirane korisničke priče (US-11, US-21, US-17, US-24, US-28) su u potpunosti implementirane. Kompletan tok od prijave do preusmjeravanja na specifične panele funkcioniše bez kritičnih grešaka.
- **Uspješno zadovoljeni NFR zahtjevi za performanse i sigurnost** — Dashboard se učitava unutar definisanog roka od 3 sekunde (NFR-15), a WebSocket integracija omogućava trenutno osvježavanje rasporeda (NFR-16). RBAC mehanizam uspješno sprečava neautorizovan pristup podacima (NFR-06, NFR-07, NFR-01).
- **Efikasno upravljanje nepredviđenim izmjenama planova** — Tim je pokazao fleksibilnost i sposobnost brze adaptacije kada je došlo do promjene tehničkih planova tokom samog sprinta, osiguravajući da krajnji kvalitet isporuke ne bude ugrožen.

---

## Šta nije išlo dobro

- **Kašnjenje u realizaciji i kaskanje za planiranom dinamikom** — Tokom sprinta došlo je do neočekivanih zastoja, zbog čega je tim veći dio sprinta proveo "kaskajući" za inicijalno postavljenim rokovima. Ovo je uzrokovalo povećan pritisak u samoj završnici sprinta.
- **Neravnomjerna raspodjela rada među članovima tima** — Za razliku od prethodnog sprinta, u ovom sprintu je ponovo uočena neravnomjerna aktivnost. Pojedini članovi tima su podnijeli znatno veći teret kako bi se ispoštovali rokovi i završile sve preuzete obaveze, dok je doprinos drugih bio manji od očekivanog.
- **Kasna integracija komponenti** — Zbog kašnjenja u individualnim zadacima, integracija panela sa WebSocket-om i login sistemom ostavljena je za poslijednje dane sprinta, što je povećalo rizik od neuspjeha.

---

## Prijedlozi za poboljšanje

- **Stroga i proaktivna kontrola raspodjele posla** — Poučeni iskustvom iz ovog sprinta, tim se obavezuje da će u narednim sprintovima striktno pratiti angažman svih članova. Ravnomjerna raspodjela rada mora se definisati na planiranju i kontinuirano provjeravati na dnevnim sastancima (Daily Scrum) kako bi se teret iznio zajednički.
- **Poboljšanje procjene vremena (Estimation) i upravljanja rizicima** — Potrebno je realnije planirati kompleksnost zadataka, posebno onih koji uključuju real-time tehnologije poput WebSocketa, kako bi se izbjeglo kaskanje i stres u finišu sprinta.
- **Uvođenje ranijih internih rokova (Soft Deadlines)** — Postavljanje rokova za završetak pojedinačnih funkcionalnosti prije zvaničnog kraja sprinta omogućit će lakšu integraciju i spriječiti nagomilavanje posla u zadnjim danima.

---

## Ključne odluke donesene u sprintu

---

## Zaključak

Sprint 8 je uspješno isporučio dio za Release 3 — Paneli korisničkih uloga i role-based pristup. Iako su sve obaveze završene, a ključni kriteriji prihvatanja u potpunosti ispunjeni, sprint je bio izazovan zbog kašnjenja i izmjena planova. Glavna lekcija ovog sprinta leži u potrebi za boljim balansiranjem unutar tima; neravnomjeran rad je identifikovan kao problem koji se mora hitno ispraviti u predstojećem periodu. S tehničke strane, sistem je dobio ključnu nadogradnju u vidu operativnih panela za doktore i medicinsko osoblje, čime se zatvara važna faza razvoja aplikacije.

---
