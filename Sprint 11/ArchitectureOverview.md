# SwiftMed — Arhitekturalni i tehnički pregled sistema

> **Bolnički sistem za upravljanje rezervacijama**  
> SI Grupa 1 · 2025/2026

---

## 1. Pregled sistema

SwiftMed je web aplikacija za upravljanje medicinskim terminima i rezervacijama u bolničkom okruženju. Sistem podržava pet korisničkih uloga sa različitim pravima pristupa i nudi funkcionalnosti od zakazivanja pregleda do analitičkih izvještaja.

### 1.1 Tehnološki stack

| Sloj | Tehnologije |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS 3 |
| Backend | Express 5, Node.js, TypeScript, tsx (runtime) |
| Baza podataka | PostgreSQL + Prisma ORM 5 |
| Cache / Queue | Redis (ioredis) |
| Real-time | Socket.io 4 (server + client) |
| Email | Resend API (nodemailer kao fallback) |
| SMS | Twilio |
| Deployment | Render (backend + frontend), PostgreSQL na cloudu |
| Testiranje | Vitest, Supertest (integracijski testovi) |

---

## 2. Arhitekturalni dijagram

Sistem koristi klasičnu troslojevnu (three-tier) arhitekturu: frontend SPA komunicira s REST API-em i WebSocket serverom, koji pristupa PostgreSQL bazi putem Prisma ORM-a.

```
┌─────────────────────────────────────────────────────┐
│                 BROWSER / KLIJENT                   │
│           React 18 + TypeScript + Vite              │
│  ┌──────────────┬──────────────┬───────────────────┐│
│  │   Stranice   │  Komponente  │ Hooks / Zustand /  ││
│  │   (Pages)    │              │   React Query      ││
│  └──────────────┴──────────────┴───────────────────┘│
│          Axios HTTP  +  Socket.io-client             │
└────────────────────────┬────────────────────────────┘
                         │  REST API  /  WebSocket
┌────────────────────────▼────────────────────────────┐
│                SERVER / BACKEND                     │
│           Express 5 + Node.js + TypeScript          │
│  ┌──────────────┬──────────────┬───────────────────┐│
│  │authMiddleware│autorizacija  │ rateLimitChat /    ││
│  │              │   (RBAC)     │   error MW         ││
│  ├──────────────┼──────────────┼───────────────────┤│
│  │  Routes 16+  │Controllers 18│    Services        ││
│  └──────────────┴──────────────┴───────────────────┘│
│                    Prisma ORM                        │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│                BAZA PODATAKA                        │
│                  PostgreSQL                         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                VANJSKI SERVISI                      │
│  Redis (ioredis) │ Resend (email) │ Twilio / Socket │
└─────────────────────────────────────────────────────┘
```

**Komunikacijski tok za tipičan zahtjev:**

1. Korisnik šalje HTTP zahtjev iz React aplikacije putem Axiosa na `/api/*` endpoint
2. `authMiddleware` validira JWT token iz `Authorization` headera
3. `autorizacija` middleware provjerava da li uloga korisnika ima pristup tom endpointu
4. Route prosljeđuje zahtjev odgovarajućem controlleru
5. Controller poziva Prisma metode za pristup PostgreSQL bazi
6. Odgovor se vraća kao JSON; greške hvata globalni error middleware u `app.ts`

---

## 3. Frontend

Frontend je React SPA sa Vite build toolom. Koristi React Router v7 za navigaciju i Zustand za globalni state (informacije o ulogovanom korisniku).

### 3.1 Struktura foldera

| Putanja | Sadržaj |
|---|---|
| `client/src/Stranice/` | Stranice po ulozi: AdminPanel, DoktorRezervacije, HomePage, MenadžmentPanel, PrijavaPage, RegistracijaPage, ProfilePage, ForgotPasswordPage, ResetPasswordPage, AnonimnaOcjenaPage, TabAuditLog |
| `client/src/components/` | UI komponente: Navbar, Sidebar, Layout, Modali (NewAppointment, Cancel, AppointmentDetail, UploadPdf), CalendarView, StatistikaDashboard, Chatbot, Uputnica komponente, TerminDetalj, DoctorsSection, te brojne sekcije landing stranice |
| `client/src/klase/` | Višekorišćene klase/pogledi za multi-step rezervaciju (Step1Odjeli → Step5Potvrda), DoctorPanel, StaffPanel, Laboratorija, MojeRezervacije, RezervacijaSpecijalista |
| `client/src/hooks/` | Custom React hookovi: `useAutoLogout` (automatska odjava), `useUputnicaPDF` (generisanje PDF uputnica) |
| `client/src/lib/` | `api.ts` — centralizovana Axios instanca sa interceptorima za JWT |
| `client/src/utils/` | `auth.ts` (JWT decode helper), `rezervacijeUtils.ts`, `uputnicaMapper.ts` |
| `client/src/types.ts` | Svi TypeScript interfejsi: Korisnik, Doktor, Pacijent, Termin, Rezervacije, Nalaz, OcjenaDoktora, itd. |

### 3.2 State management i HTTP

- **Zustand** store čuva podatke ulogovanog korisnika (id, uloga, token) u memoriji
- **Axios** instanca u `src/lib/api.ts` automatski dodaje `Authorization: Bearer <token>` header
- **TanStack React Query** koristi se za server-state i keširanje API odgovora
- **React Hook Form + Zod** za validaciju formi na klijentu
- **Socket.io-client** za Chatbot real-time komunikaciju

### 3.3 Routing i zaštita ruta

React Router v7 definira rute u `App.tsx`. Svaka zaštićena ruta provjerava ulogu korisnika iz Zustand storea; neovlašteni pristup preusmjerava na login stranicu.

| Ruta | Dozvoljene uloge |
|---|---|
| `/admin` | ADMINISTRATOR |
| `/menadžment` | VLASNIK, ADMINISTRATOR |
| `/doktor-rezervacije` | DOKTOR |
| `/moje-rezervacije` | PACIJENT |

---

## 4. Backend

Backend je Express 5 server sa TypeScript-om, pokrenut putem `tsx` runtime-a u development modu. Ulazna tačka je `src/index.ts` koji pokreće startup migracije i zatim startuje HTTP server.

### 4.1 Struktura foldera

| Putanja | Sadržaj |
|---|---|
| `server/src/app.ts` | Express aplikacija: CORS konfiguracija, JSON middleware, Socket.io setup, globalni error handler, test middleware (samo `NODE_ENV=test`) |
| `server/src/index.ts` | Entry point: startup migracije, pokretanje HTTP servera na `PORT` (default 5000) |
| `server/src/routes/router.ts` | Glavni router — registruje sve podrutere na `/api` prefiks (16+ modula) |
| `server/src/routes/` | Pojedinačni route fajlovi: authRoutes, doctorRoutes, reservationRoutes, terminRoutes, adminRoutes, vlasnikRoutes, listaCekanjaRoutes, recenzijaRoutes, chatRoutes, nalazRoutes, osobljeRoutes, sobaRoutes, odjelRoutes, userRoutes, pregledRoutes, tipPregledaRoutes |
| `server/src/controllers/` | 18+ controllera, jedan po domenu: authController, doctorController, reservationController, patientController, adminController, vlasnikController, nalazController, reminderController, deactivationController, OsobljeController, itd. |
| `server/src/middleware/` | `authMiddleware.ts` (JWT verifikacija), `autorizacija.ts` (RBAC), `rateLimitChats.ts` (rate limiting za chat) |
| `server/src/services/` | `authService.ts`, `chatService.ts`, `deactivationService.ts` — kompleksnija business logika odvojena od controllera |
| `server/src/lib/` | `prisma.ts` (singleton Prisma klijent), `redis.ts` (ioredis konekcija), `encryption.ts` (AES enkripcija za JMBG i broj knjižice), `auditLog.ts`, `currentPatient.ts` |
| `server/src/jobs/` | `reminderJob.ts` — node-cron scheduled job za slanje podsjetnika pacijentima |
| `server/src/emailService.ts` | Sve email funkcije putem Resend API-a: potvrda rezervacije, otkazivanje, reset lozinke, verifikacioni kod, poziv za ocjenu, obavijesti o deaktivaciji |
| `server/prisma/schema.prisma` | Prisma schema — definicija svih modela i enuma |
| `server/prisma/seed.ts` | Seed skripta za inicijalne podatke u bazi |

### 4.2 API rute — pregled modula

| Prefiks | Opis |
|---|---|
| `/api/auth` | Registracija, prijava, verifikacija emaila, reset lozinke, odjava |
| `/api/doktori` | CRUD doktori, rasporedi, izuzeci rasporeda, specijalizacije |
| `/api/termini` | Slobodni/zakazani termini, kreiranje termina po rasporedu |
| `/api/rezervacije` | Kreiranje, otkazivanje, završavanje rezervacija; komentari |
| `/api/appointments` | Veza termin-recenzija, upravljanje terminima doktora |
| `/api/reviews` | Recenzije (ocjene doktora), anonimna ocjena, skrivanje recenzija |
| `/api/lista-cekanja` | Waitlist — prijava, potvrda, odbijanje slobodnog termina |
| `/api/admin` | Administracija korisnika, audit log, deaktivacije, statistike |
| `/api/vlasnik` | Analitika, statistike termina, CSV export, korisnici po ulogama |
| `/api/pregledi` | Historija pregleda, dijagnoza, terapija, recepti |
| `/api/nalazi` | PDF nalazi — upload, preuzimanje, pregled po pacijentu/rezervaciji |
| `/api/users` | Profil korisnika, promjena lozinke, zahtjev za deaktivaciju |
| `/api/chat` | AI chatbot (Socket.io + HTTP), rate limiting, chat sugestije |
| `/api/osoblje` | Medicinsko osoblje, rasporedi osoblja |
| `/api/odjeli` | CRUD odjeli bolnice |
| `/api/rooms` | CRUD sobe/ordinacije/sale |
| `/api/tippregleda` | Tipovi pregleda (naziv, trajanje, zahtijeva salu) |
| `/api/pacijenti` | Lista pacijenata, historija, hronični bolesnici (zaštićeno) |
| `/api/reminder-logovi` | Logovi poslatih podsjetnika za admina i doktora |

---

## 5. Baza podataka

Baza podataka je PostgreSQL, kojoj se pristupa isključivo kroz Prisma ORM. Schema je definisana u `server/prisma/schema.prisma`.

### 5.1 Glavni modeli

| Model | Opis |
|---|---|
| `Korisnik` | Centralni entitet — autentifikacijski podaci, uloga (Uloga enum), zaštita od brute-force (`brojNeuspjelihPrijava`, `nalogZakljucan`), `emailVerifikovan` flag, audit logovi |
| `Pacijent` | Proširuje Korisnika: medicinski podaci (krvna grupa, alergije, hronične bolesti), `reviewPeriodDays`, veze na rezervacije i historiju pregleda |
| `Doktor` | Proširuje Korisnika: specijalizacija, trajanje pregleda, odjel, soba, rasporedi, izuzeci rasporeda, recepti |
| `MediciskoOsoblje` | Proširuje Korisnika: pozicija, radno vrijeme, odjel, rasporedi osoblja |
| `Termin` | Konkretni vremenski slot: datum, `vrijemeOd` (Int u minutama od ponoći), status (`SLOBODAN/ZAKAZAN/POTVRDJEN/OTKAZAN/NA_CEKANJU`), veza na doktora |
| `Rezervacije` | Veza pacijent-termin-doktor, hitnost, komentar, `datumOtkazivanja`, `zavrseno` flag; sadrži veze na historiju pregleda, recenziju, podsjetnik |
| `HistorijaPregleda` | Medicinska historija: dijagnoza, terapija, bilješke, veza na nalaz i recepte |
| `Recenzija` | Anonimna ocjena doktora (1–5), komentar, `sakriven` flag za moderaciju — mapirana na `reviews` tablicu |
| `ListaCekanja` | Waitlist sistem: prioritet (`HITAN/HRONICNI_BOLESNIK/NORMALAN`), status, rok potvrde |
| `AuditLog` | Zapis svih akcija: `tipAkcije`, `stariPodaci`/`noviPodaci` (JSON), `ipAdresa`, `vrijemeAkcije` |
| `PasswordResetToken` | Tokeni za reset lozinke s expiry i `tokenHash` |
| `ZahtjevDeaktivacije` | GDPR zahtjevi za brisanje naloga s admin workflow-om |
| `RasporedDoktora` | Sedmični raspored po danu: `vrijemeOd`/`vrijemeDo`, `aktivan` flag |
| `IzuzetakRasporeda` | Izuzeci (bolovanje, konferencija, godišnji): razlog enum, opcioni vremenski okvir |
| `Nalaz` | PDF nalazi priloženi uz pregled (`Bytes` polje u bazi) |
| `Recept` | Recepti izdata od doktora, vezani za historiju pregleda |
| `Komentar` | Komentari na rezervaciji — mogu pisati i doktor i pacijent |
| `Podsjetnik` | Evidencija poslatih podsjetnika (email/SMS) |
| `ReminderLog` | Log podsjetnika po kanalu i statusu za analitiku |

### 5.2 Enumi

| Enum | Vrijednosti |
|---|---|
| `Uloga` | `ADMINISTRATOR`, `PACIJENT`, `DOKTOR`, `MEDICINSKO_OSOBLJE`, `VLASNIK` |
| `StatusTermina` | `SLOBODAN`, `ZAKAZAN`, `POTVRDJEN`, `OTKAZAN`, `NA_CEKANJU` |
| `StatusListeCekanja` | `CEKA`, `OBAVIJESTEN`, `POTVRDJENO`, `ODBIJENO`, `ISTEKLO`, `OTKAZANO` |
| `Prioritet` | `HITAN`, `HRONICNI_BOLESNIK`, `NORMALAN` |
| `RazlogIzuzetka` | `BOLOVANJE`, `KONFERENCIJA`, `GODISNJI`, `ADMIN` |
| `TipSobe` | `ORDINACIJA`, `SALA`, `KABINET`, `LABORATORIJ` |
| `StatusSobe` | `AKTIVNA`, `NEAKTIVNA`, `U_RENOVACIJI` |
| `DanUSedmici` | `PONEDJELJAK`, `UTORAK`, `SRIJEDA`, `CETVRTAK`, `PETAK`, `SUBOTA`, `NEDJELJA` |

### 5.3 Osjetljivi podaci — enkripcija

JMBG i broj zdravstvene knjižice nikada se ne čuvaju u plaintextu:

- Enkriptovani **AES-256** algoritmom (`server/src/lib/encryption.ts`), čuvaju se u kolonama `jmbg` i `brojKnjizice`
- **SHA-256 hash** čuva se u `jmbgHash` i `brojKnjiziceHash` kolonama za provjeru duplikata bez dekripcije
- Lozinke se hashiraju **bcrypt** algoritmom sa `saltRounds = 12`

---

## 6. Vanjski servisi

| Servis | Upotreba u sistemu |
|---|---|
| **Resend** | Primarni email provider. Šalje: potvrde rezervacije, obavijesti o otkazivanju, verifikacione kodove (6-cifre, TTL 15 min, max 5 pokušaja), reset lozinke linkove (TTL 15 min), pozive za anonimnu ocjenu (JWT token, TTL 30 dana), obavijesti o promjenama rasporeda i deaktivaciji naloga. Ima mock implementaciju za testne API ključeve. |
| **Twilio** | SMS podsjetnici za pacijente (opcionalno, uz email kanal) |
| **Redis** | (1) Čuvanje verifikacionih kodova s TTL za email verifikaciju i reset lozinke; (2) Rate limiting za chat endpoint (`rateLimitChats` middleware) |
| **Socket.io** | Real-time dvosmjerna komunikacija za Chatbot. Server konfigurisan u `app.ts`, klijent u `ChatService.ts` / Chatbot komponenti |
| **node-cron** | Scheduled job (`reminderJob.ts`) — periodično šalje podsjetike pacijentima za nadolazeće termine putem emaila ili SMS-a |
| **Render** | Cloud platforma za deployment. Frontend i backend deployani odvojeno; `CORS_ORIGIN` env varijabla konfigurira dozvoljeni origin |

---

## 7. Sigurnosne odluke

### 7.1 Autentifikacija i autorizacija

- **JWT tokeni** (`jsonwebtoken`): generišu se pri prijavi, sadrže `{ id, uloga, doktorId }`, TTL **8 sati**
- `authMiddleware.ts` verifikuje JWT iz `Authorization: Bearer <token>` headera na svakom zaštićenom endpointu
- `autorizacija.ts` je RBAC middleware koji prima listu dozvoljenih uloga — primjer:

```typescript
router.use(autentifikuj, autorizacija(["VLASNIK", "ADMINISTRATOR"]));
```

- Svaka ruta u `router.ts` eksplicitno navodi koje uloge imaju pristup

### 7.2 Zaštita od napada

| Prijetnja | Implementirana zaštita |
|---|---|
| **Brute-force login** | Nakon 5 neuspjelih prijava nalog se zaključava (`nalogZakljucan=true`). Reset moguć samo putem linka za reset lozinke. Svaki pokušaj bilježi se u `AuditLog` s IP adresom. |
| **Slaba lozinka** | Server-side validacija: min 8 znakova, veliko i malo slovo, broj, specijalni karakter |
| **Email spoofing / spam** | Email verifikacija pri registraciji (6-cifren kod u Redisu, TTL 15 min, max 5 pokušaja). Rate limit na ponovnom slanju koda (max 3 u 15 min). |
| **CORS** | Eksplicitna whitelist: Render domena i `localhost:5173`. `credentials: true` za cookie podršku. |
| **Chat abuse** | `rateLimitChats` middleware ograničava broj zahtjeva na `/api/chat` endpointu |
| **SQL injection** | Baza dostupna samo s backend servera; Prisma ORM sprječava SQL injection parametrizovanim upitima |
| **JMBG / lični podaci** | AES-256 enkripcija za JMBG i broj knjižice; nikada se ne loguju ni vraćaju API-em |
| **Praćenje akcija** | `AuditLog` tablica bilježi sve kritične akcije (prijave, promjene podataka, deaktivacije) s IP adresom i timestampom |

### 7.3 Test okruženje

`app.ts` sadrži poseban middleware aktivan isključivo kada je `NODE_ENV=test`. Čita `x-test-korisnik-id` header i setuje `req.korisnik` bez JWT verifikacije, omogućavajući integracijskim testovima simulaciju autentifikovanih korisnika bez pravih tokena.

---

## 8. Komunikacija između komponenti

### 8.1 Frontend → Backend (REST)

Sva HTTP komunikacija prolazi kroz Axios instancu u `client/src/lib/api.ts`. Instanca automatski:

- Dodaje `Authorization: Bearer <token>` header iz Zustand storea
- Prati `401` odgovore — automatski odjavljuje korisnika (`useAutoLogout` hook)

Primjeri URL konvencija:

```
GET    /api/doktori                        — lista svih doktora
POST   /api/rezervacije                    — kreiranje rezervacije
PATCH  /api/vlasnik/recenzije/:id/sakrij   — skrivanje recenzije (VLASNIK/ADMIN)
GET    /api/nalazi/pacijent/:pacijentId     — nalazi za pacijenta
```

### 8.2 Real-time komunikacija (Socket.io)

Socket.io server inicijaliziran je u `app.ts` i exportovan kao `io` objekt:

- Klijent se konektuje putem `socket.io-client` i šalje poruke na chat namespace
- `ChatService.ts` na serveru obrađuje poruke i emituje odgovore
- Isti CORS origin policy važi i za WebSocket konekciju

### 8.3 Backend → vanjski servisi

- **Resend**: `emailService.ts` poziva Resend REST API za sve transakcijske emailove
- **Twilio**: SMS obavijesti putem Twilio SDK-a (`authController` / `reminderJob`)
- **Redis**: `ioredis` klijent (`server/src/lib/redis.ts`) za `get`/`set`/`setex`/`del`/`ttl` operacije
- **Prisma**: svi upiti bazi prolaze kroz singleton `PrismaClient` iz `server/src/lib/prisma.ts`

---

## 9. Gdje se nalazi ključni kod

| Funkcionalnost | Fajl / putanja |
|---|---|
| Autentifikacija (login/registracija) | `server/src/services/authService.ts` |
| JWT middleware | `server/src/middleware/authMiddleware.ts` |
| RBAC middleware | `server/src/middleware/autorizacija.ts` |
| Registracija svih API endpointa | `server/src/routes/router.ts` |
| Email (svi slučajevi) | `server/src/emailService.ts` |
| Enkripcija JMBG i knjižice | `server/src/lib/encryption.ts` |
| Redis klijent | `server/src/lib/redis.ts` |
| Prisma schema (modeli i baza) | `server/prisma/schema.prisma` |
| Express app konfiguracija | `server/src/app.ts` |
| Server entry point | `server/src/index.ts` |
| Axios instanca + interceptori | `client/src/lib/api.ts` |
| TypeScript interfejsi | `client/src/types.ts` |
| Globalni state (Zustand) | `client/src/utils/auth.ts` |
| Chatbot komponenta | `client/src/components/Chatbot/` |
| Scheduled job (podsjetnici) | `server/src/jobs/reminderJob.ts` |
| Socket.io setup | `server/src/app.ts` (`io`, `httpServer` export) |

---

## 10. Deployment

| Komponenta | Platforma / konfiguracija |
|---|---|
| **Backend** | Render Web Service — https://sigrupa1.onrender.com. Start komanda: `npm run build && npm start` (`prisma generate` + `tsc` + `node dist/src/index.js`). Port: env varijabla `PORT`, fallback `5000`. |
| **Frontend** | Render Static Site — https://bolnicki-sistem-rezervacija.onrender.com. Build: `tsc -b && vite build`. |
| **Baza** | PostgreSQL instanca na cloudu (Neon). Konekcija putem `DATABASE_URL` env varijable. |
| **Redis** | Redis instanca (Render Redis ili Upstash). Konekcija putem `REDIS_URL` env varijable. |

### Kritične environment varijable (server)

| Varijabla | Opis |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Tajni ključ za potpisivanje JWT tokena |
| `RESEND_API_KEY` | API ključ za Resend email servis |
| `REDIS_URL` | Redis connection string |
| `CORS_ORIGIN` | Dozvoljen frontend origin (npr. `https://bolnicki-sistem-rezervacija.onrender.com`) |
| `ENCRYPTION_KEY` | Ključ za AES enkripciju JMBG i knjižice |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `REVIEW_TOKEN_SECRET` | Tajni ključ za JWT tokene anonimnih recenzija |

---

*SwiftMed — Arhitekturalni pregled sistema*