# Decision Log

Evidencija važnih projektnih, arhitektonskih i tehničkih odluka.

---

## DEC-001 — Odabir platforme za deployment

| Stavka | Opis |
| :--- | :--- |
| **ID odluke** | DEC-001 |
| **Datum** | 2026 |
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
| **Datum** | 2026 |
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
| **Datum** | 2026 |
| **Kratak naziv odluke** | Hardkodirani korisnik umjesto autentifikacije |
| **Opis problema ili pitanja** | Sistem zahtijeva identifikaciju trenutnog pacijenta za operacije poput kreiranja i pregleda rezervacija, ali login i registracija nisu implementirani u ovoj fazi razvoja. |
| **Razmatrane opcije** | Implementirati punu autentifikaciju (JWT/session), koristiti hardkodiranog test korisnika putem environment varijabli, privremeno preskočiti autorizaciju |
| **Odabrana opcija** | Hardkodirani korisnik |
| **Razlog izbora** | Omogućava razvoj i testiranje ostalih funkcionalnosti (rezervacije, termini, otkazivanje) bez blokiranja na neimplementiranom login sistemu. Pristup je kontrolisan — korisnik se dohvaća iz baze, nije fiksan u kodu. |
| **Posljedice odluke** | Svi API pozivi koji zahtijevaju pacijenta koriste ovog test korisnika. Ova odluka mora biti zamijenjena pravom autentifikacijom (JWT) u kasnijoj fazi. |
| **Status odluke** | Privremena — planirana zamjena implementacijom JWT autentifikacije |

## DEC-004 — Resend umjesto Nodemailer-a za slanje email notifikacija
 
| Stavka | Opis |
| :--- | :--- |
| **ID odluke** | DEC-004 |
| **Datum** | 2026 |
| **Kratak naziv odluke** | Resend umjesto Nodemailer-a za slanje email notifikacija |
| **Opis problema ili pitanja** | Sistem zahtijeva slanje email notifikacija pacijentima (potvrda rezervacije, obavijest o otkazivanju), ali Nodemailer nije bilo moguće besplatno deployati u produkcijskom okruženju zbog ograničenja SMTP konfiguracije na hosting platformi. |
| **Razmatrane opcije** | Koristiti Nodemailer sa eksternim SMTP providerom (Gmail, Mailtrap), koristiti Resend kao alternativni email servis, koristiti SendGrid ili Mailgun |
| **Odabrana opcija** | Resend |
| **Razlog izbora** | Resend nudi besplatan tier koji je kompatibilan sa produkcijskim deploymentom, jednostavnu integraciju putem REST API-ja bez potrebe za SMTP konfiguracijom, te službeni Node.js SDK koji se lako uklapa u postojeću backend arhitekturu. Za razliku od Nodemailer-a, ne zahtijeva posebne dozvole ni konfiguraciju na nivou hosting platforme. |
| **Posljedice odluke** | Sve email notifikacije (potvrda rezervacije, obavijest o otkazivanju) šalju se putem Resend servisa. Aplikacija je zavisna od dostupnosti Resend API-ja — kašnjenja ili ispadi eksternog servisa mogu uticati na isporuku emailova (RR-15). API ključ mora biti pohranjen kao environment varijabla i ne smije biti izložen u kodu. |
| **Status odluke** | Aktivna — Resend ostaje primarni email servis za sve notifikacije u sistemu |
 
