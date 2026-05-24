# Decision Log

Evidencija važnih projektnih, arhitektonskih i tehničkih odluka.

---

## DEC-001 — Odabir platforme za deployment

| Stavka | Opis |
| :--- | :--- |
| **ID odluke** | DEC-001 |
| **Datum** | 2.5.2026 |
| **Kratak naziv odluke** | Odabir platforme za deployment |
| **Opis problema ili pitanja** | Tim je trebao odlučiti na kojoj platformi hostovati backend i frontend aplikacije kako bi osigurao dostupnost i jednostavnost deployanja. |
| **Razmatrane opcije** | Render, Heroku, Railway, AWS, Vercel (samo frontend) |
| **Odabrana opcija** | Render (za backend i frontend) |
| **Razlog izbora** | Render nudi besplatni tier, automatski deployment iz GitHub repozitorija, podršku za Node.js i Static Sites, te jednostavnu konfiguraciju environment varijabli bez potrebe za kompleksnom infrastrukturom. |
| **Posljedice odluke** | Backend se deploya kao Web Service, frontend kao Static Site. Svaki servis dobiva poseban URL. CORS mora biti konfigurisan između ta dva URL-a. Besplatni tier može imati "cold start" kašnjenje. |
| **Status odluke** | Aktivna |

---

## DEC-002 — Odabir baze podataka — Neon (PostgreSQL)

| Stavka | Opis |
| :--- | :--- |
| **ID odluke** | DEC-002 |
| **Datum** | 2.5.2026 |
| **Kratak naziv odluke** | Odabir baze podataka — Neon (PostgreSQL) |
| **Opis problema ili pitanja** | Potrebna je pouzdana, cloud-hostovana baza podataka kompatibilna s Prisma ORM-om i dostupna bez troškova u razvojnoj fazi projekta. |
| **Razmatrane opcije** | Neon (PostgreSQL), Supabase, lokalni PostgreSQL, Render PostgreSQL |
| **Odabrana opcija** | Neon (PostgreSQL) |
| **Razlog izbora** | Neon pruža serverless PostgreSQL s besplatnim tierom, odličnom kompatibilnošću s Prisma ORM-om, automatskim skaliranjem i SSL konekcijom. Jednostavna integracija putem connection stringa. |
| **Posljedice odluke** | DATABASE_URL mora biti dodan kao environment varijabla na Renderu. Connection string mora sadržavati `?sslmode=require`. Baza je odvojena od aplikacijskog servera što olakšava održavanje. |
| **Status odluke** | Aktivna |

---

## DEC-003 — Hardkodirani korisnik umjesto autentifikacije

| Stavka | Opis |
| :--- | :--- |
| **ID odluke** | DEC-003 |
| **Datum** | 2.5.2026 |
| **Kratak naziv odluke** | Hardkodirani korisnik umjesto autentifikacije |
| **Opis problema ili pitanja** | Sistem zahtijeva identifikaciju trenutnog pacijenta za operacije poput kreiranja i pregleda rezervacija, ali login i registracija nisu implementirani u ovoj fazi razvoja. |
| **Razmatrane opcije** | Implementirati punu autentifikaciju (JWT/session), koristiti hardkodiranog test korisnika putem environment varijabli, privremeno preskočiti autorizaciju |
| **Odabrana opcija** | Hardkodirani korisnik |
| **Razlog izbora** | Omogućava razvoj i testiranje ostalih funkcionalnosti (rezervacije, termini, otkazivanje) bez blokiranja na neimplementiranom login sistemu. Pristup je kontrolisan — korisnik se dohvaća iz baze, nije fiksan u kodu. |
| **Posljedice odluke** | Svi API pozivi koji zahtijevaju pacijenta koriste ovog test korisnika. Ova odluka mora biti zamijenjena pravom autentifikacijom (JWT) u kasnijoj fazi. |
| **Status odluke** | Privremena — planirana zamjena implementacijom JWT autentifikacije |
---


## DEC-004 — Resend umjesto Nodemailer-a za slanje email notifikacija
 
| Stavka | Opis |
| :--- | :--- |
| **ID odluke** | DEC-004 |
| **Datum** |7.5.2026 |
| **Kratak naziv odluke** | Resend umjesto Nodemailer-a za slanje email notifikacija |
| **Opis problema ili pitanja** | Sistem zahtijeva slanje email notifikacija pacijentima (potvrda rezervacije, obavijest o otkazivanju), ali Nodemailer nije bilo moguće besplatno deployati u produkcijskom okruženju zbog ograničenja SMTP konfiguracije na hosting platformi. |
| **Razmatrane opcije** | Koristiti Nodemailer sa eksternim SMTP providerom (Gmail, Mailtrap), koristiti Resend kao alternativni email servis, koristiti SendGrid ili Mailgun |
| **Odabrana opcija** | Resend |
| **Razlog izbora** | Resend nudi besplatan tier koji je kompatibilan sa produkcijskim deploymentom, jednostavnu integraciju putem REST API-ja bez potrebe za SMTP konfiguracijom, te službeni Node.js SDK koji se lako uklapa u postojeću backend arhitekturu. Za razliku od Nodemailer-a, ne zahtijeva posebne dozvole ni konfiguraciju na nivou hosting platforme. |
| **Posljedice odluke** | Sve email notifikacije (potvrda rezervacije, obavijest o otkazivanju) šalju se putem Resend servisa. Aplikacija je zavisna od dostupnosti Resend API-ja — kašnjenja ili ispadi eksternog servisa mogu uticati na isporuku emailova (RR-15). API ključ mora biti pohranjen kao environment varijabla i ne smije biti izložen u kodu. |
| **Status odluke** | Aktivna — Resend ostaje primarni email servis za sve notifikacije u sistemu |

---
## DEC-005 — Promjena plana: Zamjena Sprinta 7 i Sprinta 10

| Stavka | Opis |
| :--- | :--- |
| **ID odluke** | DEC-002 |
| **Datum** | 15.5.2026 |
| **Kratak naziv odluke** | Zamjena redoslijeda Sprinta 7 i 10 (Prioritizacija Autentifikacije) |
| **Opis problema ili pitanja** | Utvrđeno je da dalji razvoj sistema bez implementirane autentifikacije otežava testiranje ključnih funkcionalnosti. Postojala je potreba da se Release 4 pomjeri ranije. |
| **Razmatrane opcije** | 1. Nastavak po originalnom planu (Autentifikacija u Sprintu 10).<br>2. Zamjena Sprinta 7 i Sprinta 10 (Autentifikacija u Sprintu 7). |
| **Odabrana opcija** | **Opcija 2:** Zamjena redoslijeda sprinteva |
| **Razlog izbora** | Zavisnost cijelog sistema o autentifikaciji korisnika je kritična. Release 4 (Autentifikacija) prelazi na Sprint 7 kako bi se osiguralo da **RBAC (Role-Based Access Control)** i **enkripcija** budu validovani u kontekstu svih prethodno implementiranih modula, čime se smanjuje tehnički dug i rizik integracije. |
| **Posljedice odluke** | Potrebno je ažurirati projektnu dokumentaciju i plan sprintova. Razvojni tim mora fokus prebaciti na sigurnosne protokole ranije nego što je planirano. Omogućava se ispravno testiranje autorizacijskih nivoa za sve buduće module. |
| **Status odluke** | **Aktivna** |
 
---

## DEC-006 — Prebacivanje funkcionalnosti automatskih podsjetnika u naredni sprint

| Stavka | Opis |
| :--- | :--- |
| **ID odluke** | DEC-006 |
| **Datum** | 15.5.2026 |
| **Kratak naziv odluke** | Prebacivanje US-31 u naredni sprint |
| **Opis problema ili pitanja** | Funkcionalnost automatskih email podsjetnika za pacijente sa hroničnim bolestima prvobitno je planirana za trenutni sprint, ali je procijenjeno da nije direktno povezana sa glavnim ciljevima i prioritetima ovog sprinta. |
| **Razmatrane opcije** | 1. Implementirati funkcionalnost u trenutnom sprintu.<br>7. Prebaciti funkcionalnost u naredni sprint gdje se tematski i tehnički bolje uklapa. |
| **Odabrana opcija** | **Opcija 2:** Prebacivanje funkcionalnosti u naredni sprint |
| **Razlog izbora** | Funkcionalnost se više uklapa u kontekst narednog sprinta koji uključuje dodatne notifikacijske i automatizovane procese. Također, implementacija zavisi od već stabilizovane autentifikacije i postojećeg Resend email servisa definisanog u DEC-004. Time se smanjuje rizik od preopterećenja trenutnog sprinta i omogućava fokus na prioritetnije korisničke zahtjeve. |
| **Posljedice odluke** | User Story **US-31 — Automatski podsjetnik za pacijente sa hroničnim bolestima** biće implementiran u narednom sprintu koristeći postojeći Resend servis i scheduler mehanizam za slanje podsjetnika 7 dana prije pregleda ili obnove terapije. Potrebno je ažurirati sprint backlog i plan implementacije. |
| **Status odluke** | Aktivna |

### Povezani User Story

| ID | Naziv | Status |
| :--- | :--- | :--- |
| US-31 | Automatski podsjetnik za pacijente sa hroničnim bolestima | Prebačeno u naredni sprint |

---
## DEC-007 — Prebacivanje osnovne funkcionalnosti admin panela u Sprint 9

| Stavka | Opis |
| :--- | :--- |
| **ID odluke** | DEC-007 |
| **Datum** | 18.5.2026 |
| **Kratak naziv odluke** | Prebacivanje dodjele korisničkih uloga iz Sprinta 10 u Sprint 8 |
| **Opis problema ili pitanja** | RBAC mehanizam implementiran u Sprintu 7 nije moguće u potpunosti validirati bez mogućnosti dodjele uloga korisnicima. Role-based prijavljivanje i personalizovani paneli (doktor, medicinsko osoblje, pacijent, admin) ne mogu biti testirani u integraciji dok admin nema mogućnost dodjele i upravljanja ulogama putem admin panela. |
| **Razmatrane opcije** | 1. Nastavak po originalnom planu — dodjela uloga ostaje u Sprintu 10 (Release 4).<br>2. Prebacivanje osnovne funkcionalnosti admin panela za dodjelu uloga u Sprint 9. |
| **Odabrana opcija** | **Opcija 2:** Prebacivanje dodjele korisničkih uloga u Sprint 9 |
| **Razlog izbora** | Dodjela uloga je direktna zavisnost za validaciju role-based toka prijave i personalizovanih panela koji su primarni cilj Sprinta 9. Bez ove funkcionalnosti, RBAC implementiran u Sprintu 7 ostaje nepotpun i netestiran u kontekstu ostatka sistema. Pomjeranjem ove funkcionalnosti smanjuje se tehnički dug i rizik integracije u kasnijim sprintovima. |
| **Posljedice odluke** | User Storiji **US-02** i **US-33** (Admin panel — korisnički interfejs i backend funkcionalnosti) implementiraju se u Sprintu 9 u obimu koji pokriva dodjelu i upravljanje ulogama korisnika. Preostale admin panel funkcionalnosti ostaju planirane prema originalnom redoslijedu. Potrebno je ažurirati sprint backlog i plan implementacije za Sprint 9 i Sprint 10. |
| **Status odluke** | Aktivna |

### Povezani User Storiji

| ID | Naziv | Status |
| :--- | :--- | :--- |
| US-02 | Admin panel — korisnički interfejs za administraciju (dodjela uloga) | Prebačeno u Sprint 9 |
| US-33 | Admin panel — backend funkcionalnosti (dodjela uloga) | Prebačeno u Sprint 9 |
---
## DEC-008 — Uvođenje novih korisničkih priča u Sprint 9 radi proširenja funkcionalnosti sistema

| Stavka | Opis |
| :--- | :--- |
| **ID odluke** | DEC-008 |
| **Datum** | 24.5.2026 |
| **Kratak naziv odluke** | Uvođenje novih korisničkih priča i proširenja (US-31-EXT do US-44) u Sprint 9 |
| **Opis problema ili pitanja** | Sa razvojem bolničkog sistema ("SwiftMed") pojavila se potreba za proširenjem postojećih modula i uvođenjem naprednih funkcionalnosti koje direktno utiču na automatizaciju obavijesti, analitiku, privatnost pacijenata i poboljšanje korisničkog iskustva. Kako bi se osigurao kontinuitet razvoja i pravovremena integracija, potrebno je formalno uvrstiti nove User Story-je u predstojeći Sprint 9 i alocirati ih razvojnim inženjerima. |
| **Razmatrane opcije** | 1. Odgoda implementacije novih funkcionalnosti za kasniju fazu (nakon isporuke osnovnih modula).<br>2. Paralelno uvođenje novih korisničkih priča direktno u opseg Sprinta 9 uz preraspodjelu razvojnih kapaciteta. |
| **Odabrana opcija** | **Opcija 2:** Integracija novih korisničkih priča i proširenja u Sprint 9 |
| **Razlog izbora** | Uvođenje ovih funkcionalnosti u Sprint 9 omogućava ranu validaciju ključnih sistema poput automatskih podsjetnika i integracije sa eksternim servisima (SMS/Resend), čime se izbjegava rizik integracije pred sam kraj projekta. Takođe, rješavaju se kritični zahtjevi privatnosti (anonimizacija i deaktivacija računa) te se podiže ukupni kvalitet sistema kroz uvođenje analitičkih prikaza i chatbota. |
| **Posljedice odluke** | Sprint backlog za Sprint 9 se proširuje i ažurira sa sljedećim korisničkim pričama i dodijeljenim resursima:<br><br>• **US-31-EXT:** Označavanje pacijenta kao hronični bolesnik + SMS podsjetnik (Proširenje US-31)<br>• **US-38:** Lista čekanja za termine• **US-39:** Grafički prikaz zauzetosti specijalističkih kabineta<br>• **US-40:** Zahtjev za deaktivaciju i anonimizaciju naloga*<br>• **US-41:** Obavijest pacijentu o otkazanom/pomjerenom terminu*<br>• **US-42:** Anonimna ocjena i komentar na rad doktora *<br>• **US-43:** Profil korisnika <br>• **US-44:** Implementacija pametnog chatbota<br><br>Potrebno je prilagoditi prioritetizaciju unutar tima. |
| **Status odluke** | Aktivna |

