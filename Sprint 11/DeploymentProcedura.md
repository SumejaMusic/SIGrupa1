# Deployment procedura

## Svrha dokumenta
Ovaj dokument služi kao zvanični, detaljni vodič za instalaciju, lokalno pokretanje i produkcijski deployment aplikacije **SwiftMed**. 

Primarna svrha dokumenta je da omogući **bilo kojoj osobi** (profesoru, asistentu ili novom članu tima) da potpuno samostalno, prateći napisane korake "korak-po-korak", uspješno pokrene kompletan sistem na svom računaru – **bez potrebe za prethodnim poznavanjem koda ili dodatnim konsultacijama s autorima aplikacije**.

Dokument je strukturiran tako da eliminira pretpostavke. Sve komande, potrebne verzije alata, konfiguracijski fajlovi (environment varijable) i potencijalni problemi su eksplicitno navedeni i objašnjeni, čime se osigurava da svako može verifikovati ispravnost i funkcionalnost sistema na bilo kojoj mašini koja ispunjava osnovne tehničke preduvjete.

## Naziv i kratak opis aplikacije

### Naziv: SwiftMed — Sistem za rezervaciju bolnički termina

### Kratak opis
SwiftMed je web aplikacija zasnovana na **troslojnoj (three-tier) arhitekturi** (React 18 / Express 5 / PostgreSQL / Redis), dizajnirana za efikasno upravljanje medicinskim terminima i operacijama u bolničkom okruženju. Sistem je potpuno *stateless*, koristi JWT autentifikaciju i pruža visoku sigurnost kroz RBAC (Role-Based Access Control) model podijeljen na 5 korisničkih uloga.

---

### Pregled korisničkih uloga i ključnih funkcionalnosti

#### 1. Pacijent
* **Upravljanje terminima:** Pregled slobodnih termina, rezervacija (preventivni/kontrolni) uz privremeno zaključavanje termina na 2 minute radi sprječavanja duplih rezervacija, te otkazivanje vlastitih termina, pregled vlastitih rezervacija.
* **Lista čekanja:** Prijava na popunjene dane uz email i in-app notifikaciju ako se oslobodi mjesto.
* **Dokumentacija i profil:** Upload PDF nalaza, unos komentara, korištenje AI chatbota za opća pitanja, te slanje zahtjeva za deaktivaciju profila.

#### 2. Doktor
* **Rad s pacijentima:** Pregled historije bolesti, priloženih PDF nalaza i komentara, unos dijagnoza, recepata i generisanje PDF uputnica.
* **Upravljanje rasporedom:** Rezervacija u ime pacijenta, otkazivanje, premještanje termina i slanje zahtjeva adminu za produženje trajanja pregleda, označavanje pregleda kao hitan.
* **Recenzije:** Uvid u anonimne ocjene (1–5) i komentare pacijenata nakon obavljenog pregleda.

#### 3. Medicinsko osoblje
* **Operativno upravljanje:** Rezervacija i otkazivanje termina za pacijente (uz opciju označavanja *hitnih* slučajeva).
* **Pregledi i uvid:** Dnevni, sedmični i mjesečni prikaz svih rezervacija, upload nalaza i praćenje zauzetosti prostorija (sala, ordinacija).

#### 4. Administrator
* **Upravljanje sistemom:** Kompletna kontrola nad korisničkim profilima (uređivanje, dodjela uloga, promjena emaila, blokiranje i brisanje).
* **Nadzor i simulacija:** Pregled detaljnog audit loga i statistika sistema, pravo pristupa svim interfejsima (pacijent, doktor, medicinsko osoblje, vlasnik).

#### 5. Vlasnik (Menadžment/Vlasnik)
* **Analitika i moderacija:** Uvid u statistike termina po doktorima (aktivni, završeni, otkazani), pregled broja korisnika po ulogama, analiza zauzetosti sala i uklanjanje neprimjerenih recenzija.

---

### Ključne tehničke i sigurnosne komponente

* **Autentifikacija:** JWT tokeni (TTL 8h) s mehanizmom za automatsku odjavu po isteku sesije.
* **Zaštita od brute-force napada:** Automatsko zaključavanje naloga nakon 5 neuspjelih pokušaja prijave (otključavanje isključivo preko email linka).
* **Transakcijski servisi:** Verifikacioni kodovi s TTL od 15 minuta (putem Redisa); slanje obavijesti preko Resend (Email) i Twilio (SMS) API-ja.
* **Zaštita podataka:** AES-256 enkripcija za JMBG i broj zdravstvene knjižice, lozinke se hashiraju bcrypt algoritmom.
* **Nadzor akcija:** Globalna `AuditLog` tabela koja bilježi sve kritične akcije (prijave, izmjene podataka, deaktivacije) uz IP adresu i timestamp.

## Arhitektura sistema (Three-Tier Architecture)

Sistem SwiftMed koristi klasičnu **troslojnu (three-tier) arhitekturu**, koja osigurava jasnu podjelu odgovornosti (Separation of Concerns), visoku sigurnost i modularnost u razvoju. 

Aplikacija radi na principu odvojenog klijenta i servera (Decoupled & Stateless), gdje se komunikacija odvija asinhrono putem REST API-ja (pomoću `Axios` klijenta) i WebSockets protokola za komunikaciju u realnom vremenu (Chatbot).

### 1. Prezentacijski sloj (Presentation Tier / Frontend)
**Lokacija izvršavanja:** Korisnički web browser.
* **Tehnologije:** React 18, TypeScript, Vite, Tailwind CSS.
* **Uloga:** Ovaj sloj je zadužen isključivo za korisnički interfejs (UI) i interakciju s korisnikom. Prima unos od korisnika, šalje zahtjeve backendu i renderuje primljene podatke.
* **Ključni elementi:** * `React Router v7` upravlja navigacijom na klijentu i zaštićenim rutama.
  * `Zustand` čuva globalno stanje aplikacije i stanje autentifikacije u memoriji.
  * `TanStack React Query` služi za keširanje serverskih odgovora, sinhronizaciju podataka i optimizaciju mrežnih zahtjeva.
  * **Modularne komponente i stranice:** Logika je podijeljena na višekratne komponente (npr. `CalendarView`, `AppointmentDetailModal`) i predefinirane rute unutar foldera `Stranice` (npr. `AdminPanel`, `MenadzmentPanel`, `ProfilePage`), dok se kompleksni proces rezervacije vodi kroz fazne korake (folder `klase` - `Step1` do `Step5`).
* **Sigurnosna napomena:** Ovaj sloj **nema direktan pristup bazi podataka** niti samostalno donosi konačne poslovne odluke. Sve akcije se validiraju na backendu.

### 2. Sloj poslovne logike (Application/Logic Tier / Backend)
**Lokacija izvršavanja:** Node.js okruženje (Render Cloud platforma).
* **Tehnologije:** Express, Node.js, TypeScript.
* **Uloga:** Ovaj sloj prima HTTP i WebSocket zahtjeve od prezentacijskog sloja, provjerava prava pristupa, izvršava kompleksnu poslovnu logiku i koordinira rad s vanjskim servisima i bazom podataka.
* **Ključni elementi:**
  * **Controllers & Services:** Arhitektura strogo odvaja transportni sloj (rute i kontroleri poput `patientController.ts`, `doctorController.ts`) od same poslovne logike koja je izolovana u servisima (`authService.ts`, `listaCekanjaService.ts`, `osobljeService.ts`).
  * **Middleware sistem:** `authMiddleware.ts` validira dolazne JWT tokene, dok `autorizacija.ts` implementira RBAC (Role-Based Access Control) provjeravajući uloge korisnika prije izvršavanja akcije. `rateLimitChat.ts` štiti integrisani chatbot sistem od zloupotrebe i DoS napada.
  * **Sigurnost podataka:** Enkripcija (AES-256) osjetljivih medicinskih i ličnih podataka (poput JMBG-a) i hashiranje lozinki (bcrypt) se vrše isključivo na ovom sloju prije slanja u bazu podataka kroz prilagođene middleware-e (`prismaEncryptionMiddleware.ts`).
  * **Pozadinski poslovi i eksterni servisi:** `node-cron` poslovi (unutar foldera `jobs/reminderJob.ts`) automatski okidaju slanje podsjetnika za termine preko eksternih komunikacijskih API-ja: Resend (Email) i Twilio (SMS), koristeći namjenske servise (`emailService.ts`, `smsService.ts`).

### 3. Sloj podataka (Data Tier / Database)
**Lokacija izvršavanja:** Cloud PostgreSQL (Neon Serverless) + Redis instanca.
* **Tehnologije:** PostgreSQL, Prisma ORM, Redis (ioredis).
* **Uloga:** Trajno (perzistentno) čuvanje podataka, održavanje referencijalnog integriteta (relacije, enumi, strani ključevi), brzo dohvaćanje podataka i keširanje kratkotrajnih informacija.
* **Ključni elementi:**
  * `PostgreSQL` čuva sve relacijske entitete sistema (Korisnici, Doktori, Odjeli, Termini, Rezervacije, kao i detaljnu historiju akcija kroz AuditLog).
  * `Prisma ORM` (`neon-schema.prisma`) djeluje kao siguran posrednik (interfejs) između backend koda i baze podataka, mapira objekte u SQL tabele i sprječava SQL Injection napade putem automatski parametrizovanih upita.
  * `Redis` služi kao brzi privremeni cache (in-memory data store) za pohranu verifikacionih kodova sa TTL (Time-To-Live) mehanizmom, upravljanje sesijama i sprječavanje duplih rezervacija sa TTL od 2 minute za unos podataka za rezervaciju.

# Tehnologije koje se koriste

## Backend (`server/`)

| Tehnologija | Verzija | Namjena |
|---|---|---|
| Node.js | 20.x LTS | JavaScript runtime okruženje |
| TypeScript | ^6.0 | Statičko tipiziranje |
| Express | ^5.2 | HTTP web framework |
| tsx | ^4.21 | TypeScript runtime za development (bez kompajliranja) |
| nodemon | ^3.1 | Automatski restart servera pri izmjenama |

### Baza podataka i cache

| Tehnologija | Verzija | Namjena |
|---|---|---|
| PostgreSQL | 15 | Relaciona baza podataka |
| Prisma ORM | ^5.22 | Pristup bazi, migracije, seed |
| ioredis | ^5.10 | Redis klijent — verifikacijski kodovi s TTL, sprječavanje duplih rezervacija sa TTL od 2 min |

### Autentifikacija i sigurnost

| Tehnologija | Verzija | Namjena |
|---|---|---|
| jsonwebtoken | ^9.0 | Generisanje i verifikacija JWT tokena (TTL 8h) |
| bcrypt | ^6.0 | Hashiranje lozinki (saltRounds = 12) |
| express-validator | ^7.3 | Server-side validacija zahtjeva |
| cookie-parser | ^1.4 | Parsiranje kolačića |

### Komunikacija i real-time

| Tehnologija | Verzija | Namjena |
|---|---|---|
| Socket.io | ^4.8 | WebSocket server - prikaz podataka u realnom vremenu |
| cors | ^2.8 | CORS middleware s eksplicitnom whitelist konfiguracijom |
| axios | ^1.16 | HTTP klijent za interne API pozive |

### Vanjski servisi

| Tehnologija | Verzija | Namjena |
|---|---|---|
| Resend | ^6.12 | Transakcijski emailovi (potvrde, reset lozinke, verifikacija) |
| Twilio | ^6.0 | SMS podsjetnici za pacijente |
| node-cron | ^4.2 | Scheduled job za automatsko slanje podsjetnika |

### Ostatak i pomoćne biblioteke

| Tehnologija | Verzija | Namjena |
|---|---|---|
| multer | ^2.1 | Upload PDF fajlova |
| json2csv | ^6.0 | CSV export izvještaja |
| xlsx | ^0.18 | Export Excel fajlova |
| dotenv | ^17.4 | Učitavanje environment varijabli |

### Development i testiranje (backend)

| Tehnologija | Verzija | Namjena |
|---|---|---|
| Vitest | ^4.1 | Unit i integracijski testovi |
| Supertest | ^7.2 | HTTP integracijski testovi |
| @vitest/coverage-v8 | ^4.1 | Coverage izvještaji |
| dotenv-cli | ^11.0 | Učitavanje `.env.test` za integracijske testove |
| Docker / docker-compose | — | Izolovano test okruženje (PostgreSQL 15 + Redis 7) |

---

## Frontend (`client/`)

| Tehnologija | Verzija | Namjena |
|---|---|---|
| React | ^18.3 | UI framework |
| TypeScript | ~5.6 | Statičko tipiziranje |
| Vite | ^5.4 | Build tool i dev server s proxy konfiguracijom |

### Routing i state management

| Tehnologija | Verzija | Namjena |
|---|---|---|
| React Router DOM | ^7.14 | Klijentski routing i zaštita ruta po ulozi |
| Zustand | ^5.0 | Globalni state — podaci o ulogovanom korisniku |
| TanStack React Query | ^5.99 | Server-state management i keširanje API odgovora |

### Forme i validacija

| Tehnologija | Verzija | Namjena |
|---|---|---|
| React Hook Form | ^7.76 | Upravljanje formama |
| Zod | ^4.4 | Schema validacija na klijentu |
| @hookform/resolvers | ^5.2 | Integracija Zod validatora s React Hook Formom |

### HTTP i real-time

| Tehnologija | Verzija | Namjena |
|---|---|---|
| axios | ^1.16 | HTTP klijent s JWT interceptorima |
| Socket.io-client | ^4.8 | WebSocket konekcija |
| jwt-decode | ^4.0 | Dekodiranje JWT tokena na klijentu |

### UI i stilizovanje

| Tehnologija | Verzija | Namjena |
|---|---|---|
| Tailwind CSS | ^3.4 | Utility-first CSS framework |
| Lucide React | ^1.11 | Ikone |
| React Big Calendar | ^1.19 | Kalendarski prikaz termina (dnevni, sedmični, mjesečni) |
| React Datepicker | ^9.1 | Odabir datuma |
| Recharts | ^3.8 | Grafovi i statistike u dashboardu |

### Generisanje dokumenata

| Tehnologija | Verzija | Namjena |
|---|---|---|
| jsPDF | ^4.2 | Generisanje PDF uputnica na klijentu |
| html2canvas | ^1.4 | Konverzija HTML sadržaja u canvas za PDF export |
| date-fns | ^4.1 | Formatiranje i manipulacija datumima |

---


## Deployment infrastruktura

| Komponenta | Platforma | Detalji |
|---|---|---|
| Backend | Render Web Service | Node.js 20|
| Frontend | Render Static Site | Vite build |
| Baza podataka | Neon | PostgreSQL 15, serverless cloud |
| Redis | Render Redis | TTL cache i rate limiting |

# Environment varijable

## Backend (`server/.env`)

Kreirati fajl `server/.env` sa sljedećim varijablama:

```env
# ─── Baza podataka ───────────────────────────────────────────────────────────
# PostgreSQL connection string (Neon ili lokalni PostgreSQL)
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require&channel_binding=require"

# ─── JWT ─────────────────────────────────────────────────────────────────────
# Tajni ključ za potpisivanje JWT tokena (min. 32 karaktera, nasumičan string)
JWT_SECRET=

# ─── Enkripcija ──────────────────────────────────────────────────────────────
# AES-256 ključ za enkripciju JMBG i broja zdravstvene knjižice
# MORA biti tačno 64 hex karaktera (256 bita)
MASTER_ENCRYPTION_KEY=

# ─── Email (Resend) ───────────────────────────────────────────────────────────
# API ključ za Resend servis — https://resend.com/api-keys
RESEND_API_KEY=

```

### Opis varijabli

| Varijabla | Obavezna | Opis |
|---|---|---|
| `DATABASE_URL` | Da | PostgreSQL connection string. Za Neon mora sadržavati `sslmode=require`. |
| `JWT_SECRET` | Da | Tajni ključ za potpisivanje JWT tokena (TTL 8h). Koristiti nasumičan string od min. 32 karaktera. |
| `MASTER_ENCRYPTION_KEY` | Da | AES-256 ključ za enkripciju JMBG i broja zdravstvene knjižice. Mora biti tačno **64 hex karaktera**. Promjena ključa nakon upisivanja podataka u bazu uzrokuje grešku pri dekripciji. |
| `RESEND_API_KEY` | Da | API ključ za Resend email servis. Ključevi koji počinju s `re_test_` šalju emailove samo na verificirane adrese u Resend dashboardu. |
| `PORT` | Ne | Port na kojem se pokreće backend server. Ako nije postavljen, koristi se `5000`. |

---

## Backend test okruženje (`server/.env.test`)

Koristi se isključivo pri pokretanju integracijskim testova (`npm run test:integration`). Testovi koriste odvojenu bazu i Redis instancu pokrenute u Dockeru.

```env
NODE_ENV=test

# Docker test baza (docker-compose.test.yml)
DATABASE_URL="postgresql://testuser:testpass@localhost:5433/bolnica_test"

# Docker test Redis (docker-compose.test.yml)
REDIS_URL="redis://localhost:6380"

# ID korisnika koji se koristi u test zahtjevima umjesto JWT tokena
TEST_KORISNIK_ID=2

# AES-256 ključ (mora biti 64 hex karaktera)
MASTER_ENCRYPTION_KEY=

# JWT ključ (može biti jednostavan string za testove)
JWT_SECRET=test-secret
```

> **Napomena:** `NODE_ENV=test` aktivira middleware u `app.ts` koji čita `x-test-korisnik-id` header i simulira autentifikovanog korisnika bez pravog JWT tokena.

---

## Frontend (`client/.env`)

```env
# URL backenda na koji frontend šalje API zahtjeve
# Lokalno:    http://localhost:5000
# Produkcija: https://sigrupa1.onrender.com
VITE_API_URL=http://localhost:5000
```

### Opis varijabli

| Varijabla | Obavezna | Opis |
|---|---|---|
| `VITE_API_URL` | Da | Bazni URL backenda. U development modu Vite proxy prosljeđuje `/api` i `/socket.io` zahtjeve na ovaj URL. U produkcijskom buildu Axios šalje zahtjeve direktno na ovu adresu. |

> **Napomena:** Sve Vite env varijable moraju počinjati s prefiksom `VITE_` da bi bile dostupne u browser kodu. Varijable bez tog prefiksa nisu vidljive u frontend kodu.

---

## Generisanje sigurnih ključeva

```bash
# JWT_SECRET i REVIEW_TOKEN_SECRET (nasumičan 64-znakasti string)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# MASTER_ENCRYPTION_KEY (tačno 64 hex karaktera / 256 bita)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

# Lokalno pokretanje sistema

---

## Preduvjeti

- **Render GitHub App** mora biti instaliran i imati pristup repou  
  → GitHub → Settings → Applications → Render → Repository access → `SumejaMusic/SIGrupa1`

- **Auto-Deploy** mora biti postavljen na `On Commit` na oba servisa  
  → Render Dashboard → servis → Settings → Deploy → Auto-Deploy

### Konfiguracija servisa na Renderu

#### Backend (Web Service)

| Postavka | Vrijednost |
|---|---|
| Repository | `SumejaMusic/SIGrupa1` |
| Branch | `main` |
| Root Directory | `PROJEKAT/bolnicki-sistem/server` |
| Build Command | `npm install --include=dev && npx prisma generate && npm run build` |
| Start Command | `npm start` |
| Auto-Deploy | `On Commit` |

#### Frontend (Static Site)

| Postavka | Vrijednost |
|---|---|
| Repository | `SumejaMusic/SIGrupa1` |
| Branch | `main` |
| Root Directory | `PROJEKAT/bolnicki-sistem/client` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |
| Auto-Deploy | `On Commit` |



Prije pokretanja provjeriti da su instalirani sljedeći alati:

| Alat | Minimalna verzija | Provjera |
|---|---|---|
| Node.js | 20.x LTS | `node --version` |
| npm | 10.x | `npm --version` |
| Git | 2.x | `git --version` |
| Docker | 24.x | `docker --version` |
| Docker Compose | 2.x | `docker compose version` |

> Docker je potreban samo za pokretanje integracionih testova. Za lokalni razvoj baza i Redis mogu biti lokalno instalirani ili koristiti cloud instance (Neon).

---

## Pokretanje baze podataka

###  Cloud (Neon) 

1. Registrovati se na [neon.tech](https://neon.tech)
2. Kreirati novi projekt i bazu
3. Kopirati connection string u `server/.env` kao `DATABASE_URL`

Connection string ima format:
```
postgresql://USER:PASSWORD@ep-naziv-pooler.REGION.aws.neon.tech/DATABASE?sslmode=require&channel_binding=require
```

## Pokretanje backenda

```bash
# 1. Pozicionirati se u server direktorij
cd server

# 2. Instalirati zavisnosti
npm install

# 3. Generisati Prisma klijent
npx prisma generate

# 4. Pokrenuti migracije
npx prisma migrate deploy

# 5. Pokrenuti seed (inicijalni podaci)
npx prisma db seed

# 6. Pokrenuti development server
npm run dev
```

Backend je dostupan na: `http://localhost:5000`

Uspješno pokretanje izgleda ovako u terminalu:
```
Server pokrenut na portu 5000
Baza podataka povezana
```

---

## Pokretanje frontenda

```bash
# 1. Pozicionirati se u client direktorij
cd client

# 2. Instalirati zavisnosti
npm install

# 3. Pokrenuti development server
npm run dev
```

Frontend je dostupan na: `http://localhost:5173`

> Vite automatski proksira `/api` i `/socket.io` zahtjeve na `http://localhost:5000` (konfigurisano u `vite.config.ts`), tako da backend mora biti pokrenut prije frontenda.

---

## Migracije i seed podaci

### Migracije

```bash
cd server

# Pokrenuti sve pending migracije (development i produkcija)
npx prisma migrate deploy

# Kreirati novu migraciju nakon izmjene schema.prisma (samo development)
npx prisma migrate dev --name naziv_migracije

# Resetovati bazu i primijeniti sve migracije iznova
#  BRIŠE SVE PODATKE — koristiti samo u developmentu
npx prisma migrate reset
```

### Seed — testni podaci

```bash
cd server

# Pokrenuti kompletan seed
npx prisma db seed
```

Seed kreira sljedeće testne korisnike:

| Uloga | Email | Lozinka |
|---|---|---|
| Doktor — Opća medicina | `doktor@test.com` | `Doktor123!` |
| Doktor — Pedijatrija | `doktor2@test.com` | `Doktor123!` |
| Doktor — Kardiologija | `doktor3@test.com` | `Doktor123!` |
| Doktor — Porodična medicina | `doktor4@test.com` | `Doktor123!` |
| Doktor — Ped. endokrinologija | `doktor5@test.com` | `Doktor123!` |
| Doktor — Interventna kardiologija | `doktor6@test.com` | `Doktor123!` |
| Doktor — Neurologija | `doktor7@test.com` | `Doktor123!` |
| Doktor — Ortopedija | `doktor8@test.com` | `Doktor123!` |
| Doktor — Ortopedska hirurgija | `doktor9@test.com` | `Doktor123!` |
| Pacijent | `musicsumeja98@gmail.com` | *(registracija bez lozinke — koristiti reset lozinke)* |

Seed takođe kreira:
- 5 odjela (Opća medicina, Pedijatrija, Kardiologija, Neurologija, Ortopedija)
- 5 ordinacija
- 3 tipa pregleda (Preventivni, Kontrolni, Hitni)
- Slobodne termine za sve doktore za narednih 6 dana

> Seed koristi `upsert` — može se pokrenuti više puta bez dupliranja podataka.

### Seed — administrator

Administrator se kreira zasebnom skriptom:

```bash
cd server
npx tsx prisma/seedAdmin.ts
```

| Uloga | Email | Lozinka |
|---|---|---|
| Administrator | `admin@klinika.ba` | `si@grupa1` |

---
### Pristup ostalim ulogama
| Uloga | Email | Lozinka |
|---|---|---|
|Vlasnik   | vlasnik@email.com | Lozinka123!
| Medicinsko osoblje | emailprimjer3@gmail.com | Lozinka123!
|Pacijent | aalispahic1@etf.unsa.ba  | Lozinka123!

## Pokretanje testova

### Unit testovi

Unit testovi ne zahtijevaju bazu ni Redis — pokretati ih direktno:

```bash
cd server

# Pokrenuti sve unit testove jednokratno
npm run test

# Pokrenuti u watch modu (automatski ponovo pri izmjenama)
npm run test:watch

# Generisati coverage izvještaj
npm run test:coverage
```

### Integracijski testovi

Integracijski testovi zahtijevaju odvojenu PostgreSQL bazu i Redis instancu pokrenute u Dockeru.

**Korak 1 — Pokrenuti Docker kontejnere:**

```bash
cd server

docker compose -f docker-compose.test.yml up -d
```

Ovo pokreće:
- PostgreSQL 15 na portu `5433` (kontejner: `bolnica_postgres_test`)
- Redis 7 na portu `6380` (kontejner: `bolnica_redis_test`)

**Korak 2 — Provjeriti da su kontejneri zdravi:**

```bash
docker compose -f docker-compose.test.yml ps
```

Oba servisa trebaju imati status `healthy`.

**Korak 3 — Pokrenuti integracijske testove:**

```bash
npm run test:integration
```

Skripta automatski učitava `server/.env.test` i pokreće testove sekvencijalno (bez paralelizma) kako bi se izbjegla konfliktna stanja u bazi.

**Korak 4 — Ugasiti kontejnere nakon testiranja:**

```bash
docker compose -f docker-compose.test.yml down
```

**Sadržaj `server/.env.test`:**

```env
NODE_ENV=test
DATABASE_URL="postgresql://testuser:testpass@localhost:5433/bolnica_test"
REDIS_URL="redis://localhost:6380"
TEST_KORISNIK_ID=2
MASTER_ENCRYPTION_KEY=b273fca07b41387b72ef988af53bf5513f34edf921efd65fb43bed1c472e8a66
JWT_SECRET=test-secret
```

> `NODE_ENV=test` aktivira poseban middleware u `app.ts` koji čita `x-test-korisnik-id` header i simulira autentifikovanog korisnika bez pravog JWT tokena — omogućava testiranje zaštićenih endpointa bez generisanja pravih tokena.

### Pregled svih test skripti

| Skripta | Komanda | Opis |
|---|---|---|
| Unit testovi | `npm run test` | Jednokratno pokretanje svih unit testova |
| Watch mod | `npm run test:watch` | Automatski ponovo pokreće pri izmjenama |
| Coverage | `npm run test:coverage` | Generise coverage izvještaj u `coverage/` |
| Integracijski | `npm run test:integration` | Zahtijeva Docker kontejnere i `.env.test` |
| Integracijski watch | `npm run test:integration:watch` | Watch mod za integracijske testove |

# Upute za produkcijski ili cloud deployment
 
## CI/CD — automatski deploy na Render

Aplikacija koristi **Render GitHub App** integraciju za automatski deployment.
Svaki push na `main` granu automatski trigeruje rebuild i redeploy oba servisa.


# Link na deployment

Aplikacija je dostupna na sljedećim linkovima:

**Frontend (web aplikacija):**  https://bolnicki-sistem-rezervacija.onrender.com  

**Backend (API server):** https://sigrupa1.onrender.com

# Poznata ograničenja deploymenta

---

## 1. Render cold start (besplatni plan)

Backend deployan na Render besplatnom planu automatski se gasi nakon **15 minuta neaktivnosti**. Pri sljedećem zahtjevu server se mora ponovo pokrenuti, što može trajati **30–60 sekundi**. Za to vrijeme frontend može prikazivati grešku ili loading stanje.

**Rješenje za produkciju:** nadograditi na Render plaćeni plan (`Starter` ili viši) koji onemogućava automatsko gašenje servisa.

---

## 2. Nodemailer nije podržan na Renderu

Nodemailer za slanje emailova zahtijeva direktnu SMTP konekciju. Render blokira odlazni SMTP saobraćaj na standardnim portovima (25, 465, 587) iz sigurnosnih razloga, što onemogućava uspostavljanje SMTP konekcije s eksternim mail serverima.

Zbog toga je projekat prešao na **Resend** kao primarni email provider — Resend koristi HTTPS REST API umjesto SMTP-a, što je u potpunosti podržano na Renderu. Nodemailer ostaje u kodu kao fallback za lokalni development.

---

## 3. Emailovi se šalju samo na jednu adresu (Resend besplatni plan)

Resend besplatni plan dozvoljava slanje emailova isključivo na **jednu verificiranu email adresu** (adresu koja je registrovana u Resend dashboardu). Pokušaj slanja na bilo koju drugu adresu rezultira greškom ili tiho odbijenim emailom.

Ovo znači da u produkciji na besplatnom planu sve email obavijesti (potvrde rezervacija, reset lozinke, verifikacijski kodovi) stižu samo na tu jednu adresu, bez obzira na to koji korisnik akciju izvršava.

**Rješenje:** aktivirati Resend plaćeni plan i verificirati vlastitu domenu (npr. `no-reply@swiftmed.ba`), nakon čega je moguće slati emailove na bilo koju adresu.

---

## 4. Vremenska zona — UTC format

Render serveri rade u **UTC vremenskoj zoni**. Svi datumi i vremena koja se čuvaju u bazi ili koriste u logici backenda moraju biti u UTC formatu. Konverzija u lokalnu vremensku zonu (npr. UTC+2 za Bosnu i Hercegovinu) provodi se isključivo na frontendu pri prikazu podataka korisniku.

Pogrešno rukovanje vremenskim zonama može uzrokovati da termini budu prikazani s pomakom od 1–2 sata u odnosu na stvarno zakazano vrijeme.

---

## 5. Neon besplatni plan — ograničenja

Neon besplatni plan ima dva ograničenja relevantna za produkcijski deployment:

- **Compute sati:** baza je aktivna maksimalno **100 sati mjesečno**. Nakon što se iscrpe sati, baza postaje nedostupna do početka sljedećeg obračunskog perioda.

**Rješenje za compute sate:** nadograditi na Neon plaćeni plan za produkcijsku upotrebu bez ograničenja aktivnosti.

---

## 6. PDF nalazi — čuvanje u bazi

PDF nalazi se čuvaju direktno u PostgreSQL bazi kao `Bytes` polje, a ne na eksternom file storage servisu. Ovo može uzrokovati povećanje veličine baze i usporavanje upita pri većem broju uploadovanih fajlova.

**Ograničenje:** Neon besplatni plan ima limit od **0.5 GB** prostora za bazu.

# Najčešći problemi pri pokretanju i njihova rješenja

# Struktura Projekta

Prikaz strukture foldera i fajlova bolničkog sistema (izuzimajući `node_modules`).

```text
SIGrupa1/
│
├── .github/
├── PROJEKAT/
│   └── bolnicki-sistem/
│       ├── .gitignore
│       ├── package.json
│       ├── package-lock.json
│       │
│       ├── client/
│       │   ├── .env
│       │   ├── .env.example
│       │   ├── .gitignore
│       │   ├── eslint.config.js
│       │   ├── index.html
│       │   ├── package.json
│       │   ├── package-lock.json
│       │   ├── postcss.config.js
│       │   ├── README.md
│       │   ├── tailwind.config.js
│       │   ├── tsconfig.app.json
│       │   ├── tsconfig.json
│       │   ├── tsconfig.node.json
│       │   ├── vite.config.ts
│       │   │
│       │   ├── public/
│       │   └── src/
│       │       ├── App.css
│       │       ├── App.tsx
│       │       ├── config.ts
│       │       ├── index.css
│       │       ├── main.tsx
│       │       ├── types.ts
│       │       ├── vite-env.d.ts
│       │       │
│       │       ├── assets/
│       │       │   └── react.svg
│       │       │
│       │       ├── components/
│       │       │   ├── Chatbot/
│       │       │   ├── uputnica/
│       │       │   ├── AppointmentDetailModal.tsx
│       │       │   ├── AutoLogoutModal.tsx
│       │       │   ├── BenefitsSection.tsx
│       │       │   ├── CalendarView.tsx
│       │       │   ├── CancelModal.tsx
│       │       │   ├── CtaBanner.tsx
│       │       │   ├── DoctorsSection.tsx
│       │       │   ├── Footer.tsx
│       │       │   ├── HeroSection.tsx
│       │       │   ├── HowItWorksSection.tsx
│       │       │   ├── Layout.tsx
│       │       │   ├── MapSection.tsx
│       │       │   ├── Navbar.tsx
│       │       │   ├── NewAppointmentModal.tsx
│       │       │   ├── SekcijaZauzetostiKabineta.tsx
│       │       │   ├── Sidebar.tsx
│       │       │   ├── StaffLayout.tsx
│       │       │   ├── StatistikaDashboard.tsx
│       │       │   ├── TerminDetalj.tsx
│       │       │   ├── TerminRed.tsx
│       │       │   ├── TopHeader.tsx
│       │       │   └── UploadPdfModal.tsx
│       │       │
│       │       ├── hooks/
│       │       │   ├── useAutoLogout.ts
│       │       │   └── useUputnicaPDF.ts
│       │       │
│       │       ├── klase/
│       │       │   ├── DoctorPanel.tsx
│       │       │   ├── Laboratorija.tsx
│       │       │   ├── MojeRezervacije.tsx
│       │       │   ├── RezervacijaSpecijalista.tsx
│       │       │   ├── StaffPanel.tsx
│       │       │   ├── Step1Odjeli.tsx
│       │       │   ├── Step2Doktori.tsx
│       │       │   ├── Step3TipPregleda.tsx
│       │       │   ├── Step4Termini.tsx
│       │       │   └── Step5Potvrda.tsx
│       │       │
│       │       ├── lib/
│       │       │   └── api.ts
│       │       │
│       │       ├── Stranice/
│       │       │   ├── AdminPanel.tsx
│       │       │   ├── AnonimnaOcjenaPage.tsx
│       │       │   ├── DoktorRezervacije.tsx
│       │       │   ├── ForgotPasswordPage.tsx
│       │       │   ├── HomePage.tsx
│       │       │   ├── MenadzmentPanel.tsx
│       │       │   ├── PrijavaPage.tsx
│       │       │   ├── ProfilePage.tsx
│       │       │   ├── RegistracijaPage.tsx
│       │       │   ├── ResetPasswordPage.tsx
│       │       │   └── TabAuditLog.tsx
│       │       │
│       │       └── utils/
│       │           ├── auth.ts
│       │           ├── rezervacijeUtils.ts
│       │           └── uputnicaMapper.ts
│       │
│       └── server/
│           ├── .env
│           ├── .env.test
│           ├── .gitignore
│           ├── dev-server.err.log
│           ├── dev-server.log
│           ├── docker-compose.test.yml
│           ├── neon-schema.prisma
│           ├── package.json
│           ├── package-lock.json
│           ├── README.md
│           ├── temp.sql
│           ├── test_output.txt
│           ├── test_output_2.txt
│           ├── tsconfig.json
│           ├── vitest.ci.config.ts
│           ├── vitest.config.ts
│           ├── vitest.integration.config.ts
│           │
│           ├── prisma/
│           └── src/
│               ├── app.ts
│               ├── authService.ts
│               ├── emailService.ts
│               ├── index.ts
│               ├── kreirajTerminZaPacijentomService.ts
│               ├── listaCekanjaService.ts
│               ├── osobljeService.ts
│               ├── sobaOccupancyService.ts
│               │
│               ├── controllers/
│               │   ├── adminController.ts
│               │   ├── authController.ts
│               │   ├── deactivationController.ts
│               │   ├── doctorController.ts
│               │   ├── listaCekanjaController.ts
│               │   ├── nalazController.ts
│               │   ├── odjelController.ts
│               │   ├── OsobljeController.ts
│               │   ├── patientController.ts
│               │   ├── Pregledcontroller.ts
│               │   ├── recenzijaController.ts
│               │   ├── reminderController.ts
│               │   ├── reservationController.ts
│               │   ├── sobaController.ts
│               │   ├── terminController.ts
│               │   ├── tipPregledaController.ts
│               │   ├── userController.ts
│               │   └── vlasnikController.ts
│               │
│               ├── jobs/
│               │   └── reminderJob.ts
│               │
│               ├── lib/
│               │   ├── auditLog.ts
│               │   ├── currentPatient.ts
│               │   ├── encryption.ts
│               │   ├── prisma.ts
│               │   ├── prismaEncryptionMiddleware.ts
│               │   ├── redis.ts
│               │   ├── smsService.ts
│               │   └── __mocks__/
│               │       ├── prisma.ts
│               │       └── redis.ts
│               │
│               ├── load/
│               ├── middleware/
│               │   ├── authMiddleware.ts
│               │   ├── autorizacija.ts
│               │   └── rateLimitChat.ts
│               │
│               ├── routes/
│               │   ├── adminRoutes.ts
│               │   ├── authRoutes.ts
│               │   ├── chat.ts
│               │   ├── doctorRoutes.ts
│               │   ├── listaCekanjaRoutes.ts
│               │   ├── nalazRoutes.ts
│               │   ├── odjelRoutes.ts
│               │   ├── osobljeRoutes.ts
│               │   ├── patientRoutes.ts
│               │   ├── pregledRoutes.ts
│               │   ├── recenzijaRoutes.ts
│               │   ├── reservationRoutes.ts
│               │   ├── router.ts
│               │   ├── sobaRoutes.ts
│               │   ├── terminRecenzijaRoutes.ts
│               │   ├── terminRoutes.ts
│               │   ├── tipPregledaRoutes.ts
│               │   ├── userRoutes.ts
│               │   └── vlasnikRoutes.ts
│               │
│               ├── scripts/
│               │   └── sendTestEmail.ts
│               │
│               ├── __integration_tests__/
│               │   ├── setup/
│               │   ├── auditLog.integration.test.ts
│               │   ├── auth.integration.test.ts
│               │   ├── doctor.integration.test.ts
│               │   ├── listaCekanjaIntegration.test.ts
│               │   ├── menadzment.integration.test.ts
│               │   ├── osoblje.integration.test.ts
│               │   ├── patientMedicalProfile.integration.test.ts
│               │   ├── recenzija.integration.test.ts
│               │   ├── rezervacije.test.ts
│               │   ├── sobaOccupancy.integration.test.ts
│               │   └── termin.integration.test.ts
│               │
│               └── __tests__/
│                   ├── adminController.test.ts
│                   ├── auditLog.unit.test.ts
│                   ├── authService.test.ts
│                   ├── deactivation.test.ts
│                   ├── doctorController.test.ts
│                   ├── listaCekanja.test.ts
│                   ├── menadzment.test.ts
│                   ├── osobljeController.test.ts
│                   ├── recenzijaController.test.ts
│                   ├── registration.test.ts
│                   ├── reservationController.test.ts
│                   ├── sobaOccupancyService.test.ts
│                   ├── terminController.test.ts
│                   └── userProfile.test.ts
│
├── Sprint 1/
├── Sprint 2/
├── Sprint 3/
├── Sprint 4/
├── Sprint 5/
├── Sprint 6/
├── Sprint 7/
├── Sprint 8/
├── Sprint 9/
├── Sprint 10/
├── Sprint 11/
├── .gitignore
└── README.md

## Napomena o monorepu

Pošto su frontend i backend u istom repou, svaki push na `main` trigeruje
build **oba** servisa, čak i ako je promijenjen samo jedan. Ovo je očekivano
ponašanje na besplatnom Render planu.
