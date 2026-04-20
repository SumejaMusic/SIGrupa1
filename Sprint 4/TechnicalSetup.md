## Branching strategy

Za branching strategiju odabran je GitHub Flow, iz razloga što je riječ o manjem razvojnom timu od osam članova, i radu organizovanom kroz redovne sedmične sprintove. GitHub Flow nudi jednostavnost i preglednost koja odgovara veličini i prirodi ovog projekta, te je idealan za kontinuirani razvoj i česte izmjene. 

GitFlow nije odabran jer uvodi složenu strukturu grana koja uključuje main, develop, feature, release i hotfix grane, te je prvenstveno namijenjen projektima sa paralelnim verzijama sistema i kompleksnijim procesom verzioniranja. Iako projekat sadrži planirane release faze razvoja, one predstavljaju logičke inkremente funkcionalnosti realizovane kroz sprintove, a ne zasebne verzije sistema koje zahtijevaju posebne release grane.

GitLab Flow nije odabran jer je dizajniran za projekte koji zahtijevaju održavanje više okruženja istovremeno, kao što su staging i production grane, ili više verzija aplikacije koje se paralelno razvijaju i održavaju. Budući da se radi o jednoj aplikaciji namijenjenoj jednoj bolnici sa jednim okruženjem za deployment, GitLab Flow bi uveo nepotrebnu kompleksnost bez ikakve koristi za ovaj projekt.

GitHub Flow je odabran jer pokriva sve potrebe ovog projekta, tj. svaka nova funkcionalnost razvija se na zasebnom branchu, te se nakon završetka i odobrenog reviewa mergea direktno u main koji je uvijek spreman za deployment.

### Osnovna struktura grana 

Struktura GitHub Flow sastoji se od dvije vrste grana: **main** grana, koja uvijek sadrži stabilan kod spreman za deployment, i **feature/bugfix** grana koje se kreiraju iz maina, na njima se implementiraju promjene, te se nakon završetka mergeaju nazad u main.

**Main branch**: Na njoj se uvijek nalazi kod koji je stabilan, testiran, i spreman za deployment. Direktno commitovanje na main branch nije dozvoljeno, već svaka nova funkcionalnost, ispravka greške, ili bilo kakva promjena idu na posebnu granu.
Na taj način main je uvijek zaštićen i spreman za deployment.

**Feature/bugfix branch**: Sve nove funkcionalnosti, ispravke grešaka, i poboljšanja implementiraju se na zasebnim granama koje se kreiraju iz main brancha. Ovaj pristup omogućava paralelan rad članova tima bez međusobnog ometanja i smanjuje rizik od konflikata na main grani.

### Proces rada

Način rada je sljedeći:

1.	Za svaki novi user story, bug fix ili bilo kakvu promjenu, kreirati novu granu iz maina
2.	Raditi commitove lokalno na tom branchu te ih pushati na remote repozitorij
3.	Kada je funkcionalnost završena ili spremna za pregled, otvoriti pull request prema main grani
4.	Drugi članovi tima vrše review
5.	Nakon odobrenja i prolaska provjera, grana se mergea u main
6.	Nakon mergea u main granu kod je spreman za deployment

Nova grana kreira se uvijek iz najnovije verzije main grane kako bi se izbjegle zastarjele izmjene. Za imenovanje grana koristi se standardizovana konvencija: feature/naziv-funkcionalnosti i bugfix/opis-greške.

Testovi se pišu na istom feature branchu zajedno sa kodom koji implementira funkcionalnost. Svaki feature branch treba sadržavati implementaciju i odgovarajuće testove, te se ne može mergeati nazad u main bez testova koji prolaze bez grešaka. 

**Pull request** otvara se u trenutku kada je funkcionalnost gotova i spremna za review. Review obavljaju drugi članovi tima koji nisu radili na implementaciji funkcionalnosti, te uključuje:

1. Provjeru ispravnosti i čitljivosti koda
2. Provjeru usklađenosti funkcionalnosti sa poslovnim zahtjevima sistema
3. Provjera sigurnosnih aspekata
4. Provjera eventualnih konflikata i nedosljednosti

Grana se može mergeati nazad u main tek onda kada su ispunjeni sljedeći uslovi:

1. Funkcionalnost je u potpunosti implementirana
2. Review je uspješno završen i testiranje je prošlo bez grešaka
3. Nema neriješenih konflikata sa main granom

### Rješavanje konflikata

Konflikti nastaju kada dvije osobe istovremeno mijenjaju isti fajl. Kako bi se riješio konflikt, član tima lokalno povlači najnovije izmjene iz maina u svoj feature branch, ručno pregleda konfliktna mjesta i bira odgovarajuću verziju koda, nakon 
čega commituje i pusha razriješene promjene na repozitorij.

Važno je naglasiti da se konflikt uvijek rješava na feature branchu, nikada na mainu, jer je main uvijek zaštićen i niko ne pusha direktno na njega. 

Kako bi se konflikti sveli na minimum, preporučuje se svakodnevno povlačenje najnovijih izmjena iz main grane u svoj feature branch, čime se izbjegava nakupljanje većih razlika između grana.





##  Tehnički setup

### Pregled tech stacka

| Komponenta | Tehnologija | Verzija |
|------------|-------------|---------|
| Frontend | React.js + TypeScript | React 18.x |
| Frontend build alat | Vite | 5.x |
| Backend | Node.js + Express + TypeScript | Node 20 LTS, Express 4.x |
| Baza podataka | PostgreSQL | 16.x |
| ORM | Prisma | 5.x |
| Cache / Locks | Redis | 7.x |
| Autentifikacija | JWT + bcrypt | jsonwebtoken 9.x, bcrypt 5.x |
| Email servis | Nodemailer + SMTP | Nodemailer 6.x |
| Pohrana fajlova (PDF) | Cloudinary | SDK 2.x |
| Real-time komunikacija | Socket.io (WebSocket) | 4.x |
| Kontejnerizacija | Docker + Docker Compose | Docker 26.x |
| Web server / Proxy | Nginx | 1.26.x |
| CI/CD | GitHub Actions | — |

---

### Frontend — React + TypeScript

- **Programski jezik** — TypeScript (ES2022+)
- **Framework** — React 18 s funkcionalnim komponentama i Hooks-ima
- **Build alat** — Vite — brži od Create React App, nativan ESM support

#### Ključne biblioteke

| Biblioteka | Namjena |
|------------|---------|
| react-router-dom | Routing između stranica i zaštita ruta po ulogama (RBAC) |
| axios | HTTP klijent za komunikaciju s backend API-jem |
| @tanstack/react-query | Server state management, caching liste dostupnih termina |
| zustand | Lokalni UI state (odabrani termin, modali) |
| react-hook-form + zod | Upravljanje formama i validacija; zod schema dijeljena s backendom |
| tailwindcss | Utility-first CSS framework za responzivan dizajn |
| socket.io-client | WebSocket konekcija za real-time ažuriranje dostupnosti termina |
| date-fns | Rad sa datumima i kalendarom termina |
| react-big-calendar | Prikaz kalendara za doktore i termine |
| recharts | Grafici za statistiku (US-29, US-30) |
| jwt-decode | Čitanje JWT payload-a na klijentskoj strani |

---

###  Backend — Node.js + Express + TypeScript

- **Programski jezik** — TypeScript na Node.js 20 LTS
- **Framework** — Express 4.x — jasna organizacija kroz rute i middleware
- **ORM** — Prisma 5.x — type-safe pristup bazi, automatske migracije, čitljiva schema definicija

#### Ključne biblioteke

| Biblioteka | Namjena |
|------------|---------|
| jsonwebtoken | Generisanje i verifikacija JWT access i refresh tokena |
| bcrypt | Hashiranje lozinki (cost factor: 12) |
| ioredis | Redis klijent — zaključavanje termina, JWT blacklist, rate limiting |
| helmet | Sigurnosni HTTP headeri (CSP, HSTS, X-Frame-Options...) |
| cors | Konfiguracija CORS whiteliste za dozvoljene origine |
| express-rate-limit | Zaštita od brute-force napada na auth endpointe |
| nodemailer | Slanje email notifikacija putem eksternog SMTP servisa |
| multer + cloudinary | Prijem i upload PDF laboratorijskih nalaza |
| socket.io | WebSocket server za real-time sinhronizaciju dostupnosti termina |
| zod | Validacija i parsiranje ulaznih podataka (schema dijeljena s frontendom) |
| prisma | ORM sa automatski generisanim TypeScript klijentom iz schema.prisma |
| node-cron | Cron jobovi (automatski podsjetnici, oslobađanje zaključanih termina) |
| winston | Strukturirano logovanje — audit log svih akcija u sistemu |
| dotenv | Upravljanje environment varijablama |

**Upravljanje ključevima za enkripciju:** Za enkripciju osjetljivih kolona (AES-256-GCM) koristi se Master Encryption Key koji se čuva isključivo kao environment varijabla na serveru. Ključ je fizički odvojen od baze podataka, što osigurava da su podaci nečitljivi čak i u slučaju potpunog curenja baze (SQL dump-a).

---

###  Baza podataka — PostgreSQL

| Konfiguracija | Detalji |
|---------------|---------|
| Verzija | PostgreSQL 16.x |
| ORM / Migration alat | Prisma — schema se definira u `prisma/schema.prisma` |
| Connection string | `DATABASE_URL` čuva se kao environment varijabla, nikad se ne commituje |
| Backup | Automatizovan dnevni backup — pg_dump ili upravljani servis |
| Mrežna izolacija | Baza nije izložena na internet — dostupna isključivo backendu unutar Docker mreže |
| Enkripcija podataka | Osjetljive kolone (JMBG, dijagnoza, historija) enkriptovane AES-256-GCM na aplikacijskom sloju |

 **Napomena:** U produkciji se preporučuje upravljani servis (Supabase free tier ili Neon) umjesto PostgreSQL Docker kontejnera — automatski backup, failover i patching su tada u nadležnosti provajdera.

**Strategija migracija (Prisma Workflow):** Izmjene na šemi baze vrše se isključivo putem Prisma migracija. U CI/CD pipeline-u koristi se komanda `npx prisma migrate deploy` koja sigurno primjenjuje nove migracije na produkcionu bazu bez rizika od gubitka podataka, osiguravajući da su kod i šema uvijek usklađeni.

---

###  Cache i session management — Redis

Verzija: Redis 7.x — Docker kontejner na aplikacijskom serveru, ili Upstash (serverless, besplatni tier). Redis se u sistemu koristi za tri konkretne namjene:

| Namjena | Opis implementacije |
|---------|---------------------|
| Zaključavanje termina | 2-minutni lock (TTL) za sprječavanje duplih rezervacija pri istovremenim zahtjevima više korisnika. Ključ: `lock:appointment:{id}` |
| JWT blacklist | Invalidacija tokena pri odjavi — token se dodaje u blacklist s TTL jednakim preostaloj validnosti, čime logout postaje trenutan |
| Rate limiting | Brojač neuspješnih login pokušaja po emailu — zaštita od brute-force napada, nalog se blokira nakon 5 uzastopnih neuspješnih pokušaja |

---

##  Kontejnerizacija — Docker

Svi servisi pokreću se u Docker kontejnerima orkestriranim s Docker Compose. Ovo osigurava konzistentnost između razvojnog i produkcijskog okruženja

###  Docker kontejneri

| Kontejner | Servis | Interni port | Opis |
|-----------|--------|-------------|------|
| 1 | Nginx | 80 / 443 | Reverse proxy i SSL terminacija — jedini servis izložen prema internetu |
| 2 | React (static) | 3000 | Statički build React aplikacije, serviran direktno Nginx-om |
| 3 | Node.js / Express | 4000 | Backend API, WebSocket server, cjelokupna poslovna logika |
| 4 | Redis | 6379 | Cache, zaključavanje termina, JWT blacklist — dostupan samo backendu |

Definicija u `docker-compose.yml`:

```yaml
services:
  nginx:    # Reverse proxy + React static files (port 80/443)
  backend:  # Node.js + Express API         (interni port 4000)
  redis:    # Cache, locks, JWT blacklist    (interni port 6379)
  db:       # PostgreSQL — samo lokalno razvoj (interni port 5432)
```

**Napomena:** U produkciji kontejner `db` se zamjenjuje upravljanim PostgreSQL servisom (Supabase / Neon). Redis i baza podataka nisu izloženi prema internetu — dostupni su isključivo unutar Docker interne mreže.

---

###  Nginx — web server i reverse proxy

Nginx ima dvije uloge u sistemu:

- **Reverse proxy** — prima sve dolazne HTTPS zahtjeve i prosljeđuje ih odgovarajućem servisu
- **Static file server** — servira React build (HTML, CSS, JS) direktno, bez Node.js servera za statičke fajlove

#### Routing logika

```
/            →  servira React SPA (index.html + statički assets)
/api/*       →  prosljeđuje na Node.js backend (port 4000)
/socket.io/* →  WebSocket proxy na backend
```

#### Sigurnosna konfiguracija

- SSL/TLS: Let's Encrypt certifikat, automatski obnavljan putem Certbota svakih 90 dana
- Nginx preusmjerava sav HTTP (port 80) saobraćaj na HTTPS (port 443)
- Sigurnosni headeri: HSTS, X-Frame-Options, X-Content-Type-Options, Content-Security-Policy

---

###  Mrežna topologija

Sve komponente komuniciraju unutar iste Docker mreže ili unutar privatne mreže VPS provajdera:

| Komponenta | Pristup izvana | Dostupna za |
|------------|---------------|-------------|
| Nginx | Da — portovi 80, 443 | Svi korisnici putem interneta |
| React (static) | Ne | Nginx kontejner |
| Node.js backend | Ne | Nginx kontejner (Docker mreža) |
| Redis | Ne | Isključivo backend kontejner (Docker mreža) |
| PostgreSQL (prod) | Ne | Isključivo backend putem DATABASE_URL |
| Cloudinary | Eksterni servis | Backend putem API ključeva (env varijable) |

---

##  Deployment 

###  Hosting — VPS

Za hosting sistema odabran je VPS (Virtual Private Server) na cloud-u. Ovo je optimalan balans između cijene, kontrole i jednostavnosti za naš projekt.
Nismo izabrali fozički server jer je visok trošak hardvera, potrebno je fizičko održavanje što je nepraktično. Nismo odabrali Managed cloud jer je ograničena kontrola, skuplji je pri rastu i postoje free tier ograničenja za produkciju.  
Naš izbor je **VPS (Hetzner / DigitalOcean)** zbog pune kontrole, niske cijene (4–10 EUR/mj.)i jer pruža dovoljno resursa za MVP


#### Specifikacije VPS-a

| Resurs | Vrijednost |
|--------|-----------|
| Operativni sistem | Ubuntu 24.04 LTS (podrška do 2029.) |
| CPU | 4 vCPU |
| RAM | 8 GB |
| SSD disk | 80 GB |
| Preporučeni provajderi | Hetzner Cloud, DigitalOcean Droplet, AWS Lightsail |

Jedan VPS je dovoljan za sve Docker kontejnere. Ne trebaju se zasebne VM-e za svaku komponentu — Docker kontejneri osiguravaju dovoljnu izolaciju uz mnogo manju kompleksnost upravljanja.

---

###  Pohrana fajlova (PDF nalazi)

Laboratorijski nalazi u PDF formatu (US-32) ne smiju se čuvati na VPS disku — nestali bi pri svakom ponovnom deploymentu. Koristi se cloud object storage kompatibilan s Cloudinary SDK-om.

| Aspekt | Rješenje |
|--------|---------|
| Servis | Cloudinary (SDK 2.x) |
| Tok uploada | Backend prima PDF zatim validira format onda šalje na Cloudinary i u bazi čuva URL |
| Dozvoljeni format | Isključivo PDF (validacija na backend sloju) |
| Trajnost | Fajlovi se čuvaju trajno dok je nalog aktivan |
| Pristup | Pacijent i doktor pristupaju putem sigurnog URL-a, PDF se otvara u novom tabu |

---

## CI/CD pipeline — GitHub Actions

Svaki merge u `main` granu automatski pokreće GitHub Actions workflow. Ovim se eliminira ručni deployment i smanjuje rizik od grešaka pri isporuci novih verzija.

| Korak | Opis |
|-------|------|
| 1. Checkout koda | Preuzimanje koda iz repozitorija |
| 2. Install dependencies | `npm ci` za backend i frontend (deterministična instalacija) |
| 3. Lint provjera | ESLint — provjera kvaliteta i konzistentnosti koda |
| 4. Unit testovi | Pokretanje testova, pipeline se zaustavlja pri neuspjehu |
| 5. Build Docker imagea | Multi-stage build — React build kopiran u Nginx image, backend image |
| 6. Push na registry | Push image-a na GitHub Container Registry (GHCR) s verzijskim tagom |
| 7. Deploy na VPS | SSH na VPS → `docker compose pull` → `docker compose up -d` |
| 8. Health check | Pipeline čeka HTTP 200 odgovor; pri neuspjehu automatski rollback |

###  Environment varijable i tajne

Sve osjetljive varijable čuvaju se kao GitHub Actions Secrets i nikad se ne nalaze u repozitoriju. Fajl `.env.example` dokumentuje koje varijable su potrebne (bez vrijednosti) i služi kao vodič za lokalno podešavanje.

| Varijabla | Opis |
|-----------|------|
| `DATABASE_URL` | PostgreSQL connection string (managed servis) |
| `JWT_SECRET` | Tajni ključ za potpisivanje JWT access tokena |
| `JWT_REFRESH_SECRET` | Tajni ključ za refresh tokene |
| `REDIS_URL` | Connection string za Redis instancu |
| `CLOUDINARY_API_KEY` | API ključ za Cloudinary file storage |
| `CLOUDINARY_API_SECRET` | API secret za Cloudinary |
| `SMTP_HOST / SMTP_USER / SMTP_PASS` | Konfiguracija eksternog SMTP servisa za email notifikacije |

---

##  Autentifikacija i sigurnost

###  JWT sesije — access i refresh token

Sistem koristi kombinovani pristup sa access i refresh tokenima za sigurno upravljanje sesijama:

| Mehanizam | Detalji |
|-----------|---------|
| Access token (JWT) | Kratko trajanje — 15 minuta. Šalje se u Authorization headeru svake zaštićene rute. |
| Refresh token | Duže trajanje — 7 dana. Čuva se u httpOnly cookie-ju (zaštita od XSS-a). |
| Obnavljanje tokena | Kada access token istekne, frontend tiho šalje refresh token za novi access token bez odjave. |
| JWT blacklist | Pri odjavi, refresh token se dodaje u Redis blacklist s odgovarajućim TTL-om. |
| Session timeout | Automatska odjava nakon 15 minuta neaktivnosti — token se poništava na serveru. |

---

###  Hashiranje lozinki

- bcrypt algoritam s cost factorom 12 — hash traje ~300 ms, što značajno otežava brute-force napad
- Lozinke se nikad ne loguju niti vraćaju u API odgovoru
- Poređenje lozinki isključivo putem `bcrypt.compare()` — originalna lozinka ostaje nepoznata čak i administratoru

---

###  Dvofaktorska autentifikacija (2FA)

2FA je opcionalna za pacijente, a može biti obavezna za administratore. Tok implementacije:

| Korak | Opis |
|-------|------|
| 1 | Korisnik unese ispravnu lozinku |
| 2 | Sistem generiše 6-cifreni numerički kod putem `crypto.randomInt(100000, 999999)` |
| 3 | Kod se sprema u Redis s TTL-om od 5 minuta (ključ: `2fa:{userId}`) |
| 4 | Nodemailer šalje kod na korisnikov email |
| 5 | Korisnik unese kod — sistem provjerava Redis |
| 6 | Nakon provjere, kod se briše iz Redisa — može se koristiti samo jednom |
