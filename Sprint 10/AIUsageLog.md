
# AI Usage Log 

Ovaj dokument je kreiran s ciljem transparentnog praćenja i dokumentovanja uloge AI alata tokom rada na projektu.

| Stavka | Opis |
| :--- | :--- |
| **Datum** | |
| **Sprint broj** | |
| **Alat koji je korišten** | |
| **Svrha korištenja** | |
| **Kratak opis zadatka ili upita** | |
| **Šta je AI predložio ili generisao** | |
| **Šta je tim prihvatio** | |
| **Šta je tim izmijenio** | |
| **Šta je tim odbacio** | |
| **Rizici, problemi ili greške** | |
| **Ko je koristio alat** | |


# AI Usage Log

Ovaj dokument je kreiran s ciljem transparentnog praćenja i dokumentovanja uloge AI alata tokom rada na projektu.

---

## Unos 001 — Generisanje unit i integracionih testova

| Stavka | Opis |
| :--- | :--- |
| **Datum** | 28.04.2026 |
| **Sprint broj** | Sprint 5 |
| **Alat koji je korišten** | Claude (Anthropic) |
| **Svrha korištenja** | Automatizacija pisanja testova radi ubrzavanja razvoja i povećanja pokrivenosti koda |
| **Kratak opis zadatka ili upita** | AI je dobio zadatak da generiše unit testove za backend kontrolere i servisne funkcije, te integracione testove za API endpoint-e (rezervacije, termini, doktori) |
| **Šta je AI predložio ili generisao** | Unit testovi za kontrolere (`reservationController`, `terminController`) koristeći Vitest i mock Prisma klijent; integracioni testovi za REST API endpoint-e koristeći Supertest; test slučajevi za pozitivne i negativne scenarije (npr. kreiranje rezervacije, otkazivanje, validacija 24h pravila, provjera duplikata) |
| **Šta je tim prihvatio** | Strukturu testova, nazive test slučajeva, mock konfiguraciju za Prisma i Redis, te pokrivene scenarije za osnovne funkcionalnosti |
| **Šta je tim izmijenio** | Prilagođeni su određeni test podaci kako bi odgovarali stvarnoj bazi (ID-evi, nazivi polja u Prisma shemi), te su korigovani neki assertion-i koji nisu odgovarali stvarnom API odgovoru |
| **Šta je tim odbacio** | Pojedini edge case testovi koji su testirali funkcionalnosti još uvijek u razvoju (npr. autentifikacija, WebSocket eventi) |
| **Rizici, problemi ili greške** | AI je u nekim slučajevima generisao testove bazirane na pretpostavljenoj strukturi odgovora koja se razlikovala od stvarne implementacije — zahtijevalo je ručnu korekciju; mock objekti nisu uvijek bili usklađeni s trenutnom Prisma shemom |
| **Ko je koristio alat** | Amina Alispahić |
---
## Unos 002 — Izrada UI forme za rezervaciju 
| Stavka | Opis |
|:--- |:--- |
| **Datum** | 28.4.2026. |
| **Sprint broj** | 5 |
| **Alat koji je korišten** | ChatGPT |
| **Svrha korištenja** | Pomoć pri izradi UI-a, konkretno forme za rezervaciju i prikaza korisničkih rezervacija. |
| **Kratak opis zadatka/upita** | Izrada forme za rezervaciju sa osnovnim funkcionalnostima i prikaz već postojećih rezervacija korisnika. |
| **Šta je AI predložio** | Strukturu forme, potrebna polja (odabir doktora i termina, tip pregleda, hitnost i komentar) i način organizacije UI elemenata. |
| **Šta je tim prihvatio** | Osnovnu strukturu forme i ključna polja za rezervaciju. |
| **Šta je tim izmijenio** | Pojednostavljena forma (uklanjanje nepotrebnih polja). Uklonjen unos `idPacijenta` (dobija se na backendu). Dodano polje za odabir odjela radi filtriranja doktora. |
| **Šta je tim odbacio** | Dodatna polja poput hitnosti i komentara jer nisu bila prioritet u ovom sprintu. |
| **Uočeni rizici/problemi** | Neki prijedlozi nisu bili u skladu sa specifičnim zahtjevima sprinta, pa je bila potrebna ručna prilagodba i pojednostavljenje. |
| **Korisnik alata** | Merjem Milišić |



---

## Unos 003 — Razvoj Frontenda i Deployment na Render.com (Sveobuhvatna konfiguracija)

| Polje | Sadržaj |
|---|---|
| **Datum** | 30.04.2026. |
| **Sprint broj** | Sprint 5  |
| **Alat koji je korišten** | Gemini (Google) / Claude (Anthropic) |
| **Svrha korištenja** | Razvoj interaktivnog frontenda za "Moje rezervacije" i rješavanje kritičnih deployment problema na Render.com platformi. |
| **Kratak opis zadatka ili upita** | Implementacija frontenda za pregled i otkazivanje termina (pravilo 24h). Nakon implementacije, sistem nije radio u produkciji: dropdown meniji su bili prazni, javljale su se CORS greške i 404 status kodovi. Trebalo je konfigurisati komunikaciju između Vite frontenda i Express backenda na Renderu, uključujući Redis URL. |
| **Šta je AI predložio ili generisao** | **Frontend:** React komponentu `MojeRezervacije` sa logikom za provjeru vremena (`mozeSeOtkazati`) i API pozivima. **Deployment:** Dijagnostiku za ECONNREFUSED; CORS middleware konfiguraciju za Express sa produkcijskim URL-om; kreiranje `VITE_API_URL` env varijable i `config.ts` fajla; uputstvo za postavljanje Redis URL-a (Internal Redis URL format); kreiranje `_redirects` fajla za React Router SPA na Renderu; ispravku `tsconfig.json` i build skripti (`npm install --include=dev && npm run build`). |
| **Šta je tim prihvatio** | Kompletnu logiku frontenda za otkazivanje termina; CORS fix sa specifičnim origin-om; `VITE_API_URL` na Render dashboardu; `_redirects` fajl za Static Site; ispravku `tsconfig.app.json` (`noUnusedLocals: false`); Internal Redis URL format za Key Value servis. |
| **Šta je tim izmijenio** | Prilagođeni su svi `fetch` pozivi u `RezervacijaPacijent.tsx` i `MojeRezervacije.jsx` da koriste centralizovani `API_URL` prefiks umjesto hardkodiranih ili relativnih putanja. |
| **Šta je tim odbacio** | **Nginx proxy** konfiguraciju (nepotrebno za Render); **prebacivanje @types paketa** u `dependencies` (zadržani u `devDependencies` radi SE dobrih praksi, problem riješen preko `--include=dev` zastavice u build komandi). |
| **Rizici, problemi ili greške** | AI je inicijalno predložio prebacivanje `@types` u `dependencies`, što je tim prepoznao kao lošu praksu za veličinu produkcijskog builda. Render je preimenovao Redis u "Key Value" servis što je izazvalo inicijalnu zabunu oko URL formata. Također, Root Directory na Renderu je inicijalno bio pogrešno postavljen na server folder umjesto klijentskog. |
| **Ko je koristio alat** | Mušić Sumeja |

---


## Unos 004 — Povezivanje frontenda sa backend API-jem i deployment

| Stavka | Opis |
| :--- | :--- |
| **Datum** | 29.04.2026. – 30.04.2026. |
| **Sprint broj** | Sprint 5 |
| **Alat koji je korišten** | ChatGPT / Codex |
| **Svrha korištenja** | Pomoć pri povezivanju frontend aplikacije sa backend API-jem i otklanjanju problema na deploymentu |
| **Kratak opis zadatka ili upita** | AI je dobio zadatak da analizira zašto frontend funkcionalnosti rade lokalno, ali ne rade na deploymentu, te da uskladi frontend API pozive sa backend rutama za doktore, termine i rezervacije |
| **Šta je AI predložio ili generisao** | Analizu uzroka problema, identifikaciju da frontend koristi relativne /api/... pozive koji rade lokalno preko Vite proxyja, ali ne i na Render deploymentu; generisan je centralni helper za API URL i izmjene u frontend komponentama da koriste VITE_API_URL |
| **Šta je tim prihvatio** | Prijedlog da se uvede centralizovan API pristup i da se svi relevantni frontend pozivi prema backendu preusmjere na konfigurabilni produkcijski backend URL |
| **Šta je tim izmijenio** | Ažurirani su frontend fetch pozivi u komponentama za doktore, moje rezervacije, rezervaciju pacijenta, panel doktora, panel osoblja i rezervaciju specijaliste; dodatno je definisana potreba za VITE_API_URL varijablom na deploymentu |
| **Šta je tim odbacio** | Nisu prihvaćena rješenja koja bi zadržala oslanjanje isključivo na lokalni Vite proxy, jer to nije odgovaralo produkcijskom okruženju |
| **Rizici, problemi ili greške** | Lokalno je aplikacija radila zbog proxy konfiguracije, dok je na deploymentu frontend slao zahtjeve na pogrešan server; bez pravilno postavljenog VITE_API_URL i novog deploya funkcionalnosti za doktore i rezervacije nisu radile |
| **Ko je koristio alat** | Hamza Husović i Kenan Hatibović |

## Unos 005 — Backend infrastruktura: rute i controlleri
 
| Stavka | Opis |
| :--- | :--- |
| **Datum** | 25.04.2026. |
| **Sprint broj** | Sprint 5 |
| **Alat koji je korišten** | Claude (Anthropic) |
| **Svrha korištenja** | Pomoć pri postavljanju backend infrastrukture za rezervacijski sistem: ispravke domenskog modela, generisanje ruta, controllera i seed fajla i unit testov |
| **Kratak opis zadatka ili upita** | AI je analizirao domenski model i uočio nedostatke, te generisao kompletnu backend strukturu za Sprint 5: rute za termine, rezervacije i doktore; controllere sa poslovnom logikom; seed fajl sa testnim podacima; unit testove; te pomogao pri rješavanju niza konfiguracionih problema vezanih za Node.js, Prismu, TypeScript i Redis |
| **Šta je AI predložio ili generisao** | Analizu domenskog modela i identifikaciju grešaka (`Termin` bez `idDoktor`, redundantni `IDTermin` na `Pacijent`, nepotpuni `StatusListeCekanja`); rute za `terminRoutes.ts`, `reservationRoutes.ts`, `doctorRoutes.ts` i centralni `router.ts`; controllere sa logikom za buffer zonu (Redis lock 2 min), zaštitu od duplih rezervacija, pravilo otkazivanja 24h; `prisma/seed.ts` sa testnim odjel, soba, doktor, pacijent i termini zapisima; mock auth middleware za testiranje bez sesija; unit testove za sve tri grupe ruta koristeći Jest i Supertest; ispravke `src/index.ts` i `tsconfig.json` |
| **Šta je tim prihvatio** | Identifikovane greške u domenskom modelu i predložene ispravke; strukturu ruta i controllera; tip `Int` za polje `vrijeme` u `Termin` entitetu (minute od ponoći); seed fajl za lokalno testiranje;  ispravke `src/index.ts` (redoslijed middlewarea, uklonjena redundantna Prisma instanca, ispravljena putanja routera); ažuriranje `tsconfig.json` sa `prisma/**/*` u `include` i `types: ["node"]`; preimenovanje `index.ts` u `router.ts` radi jasnoće |
| **Šta je tim izmijenio** | Nazivi fajlova prilagođeni konvenciji projekta (camelCase engleski stil: `terminRoutes.ts`, `doctorRoutes.ts`, `reservationRoutes.ts`); URL prefiksi zadržani na bosanskom jeziku (`/termini`, `/doktori`, `/rezervacije`); `ioredis` instaliran u `server/` folder umjesto glavnog foldera projekta; `new PrismaClient()` zadržan direktno u `seed.ts` umjesto importa singleton instance zbog izoliranosti skripte |
| **Šta je tim odbacio** | Ažuriranje Prisme na verziju 7.x — zadržana verzija 5.x radi stabilnosti; `@types/ioredis` paket — nepotreban jer `ioredis` 5.x ima ugrađene TypeScript tipove; mock auth middleware kao dugoročno rješenje, predlozene unit testove |
| **Rizici, problemi ili greške** | AI je inicijalno predložio `String` tip za polje `vrijeme` što je kasnije ispravno kao `Int`; inicijalni importi u rutama koristili su putanje bez `.js` ekstenzije što je uzrokovalo greške u ESM okruženju; `ioredis` je instaliran u pogrešnom (glavnom) folderu što je uzrokovalo grešku `Cannot find module`; VS Code Prisma ekstenzija prikazivala je lažne greške vezane za Prismu 7 iako je lokalno instalirana verzija 5.15.0; `rootDir` u `tsconfig.json` bio je u konfliktu sa `include` patternom za `prisma/` folder |
| **Ko je koristio alat** | Hana Mahmutović|

## Unos 006 — Backend za pacijenta i preuzimanje nalaza iz baze, generisanje frontenda

| Stavka | Opis |
| :--- | :--- |
| **Datum** | 02.05.2026. |
| **Sprint broj** | Sprint 6 |
| **Alat koji je korišten** | Claude (Anthropic)  |
| **Svrha korištenja** | Razvoj frontend komponenti i backend controllera u okviru projekta bolničkog sistema — modul za pacijente, nalaze |
| **Kratak opis zadatka ili upita** | Razvoj i ispravljanje `DoktorRezervacije.tsx`, `DoctorsSection.tsx`, integracija s backendom, navigacija kroz korake rezervacije (step1–step5). Generisanje backend controllera i frontend komponenti za: dohvatanje liste pacijenata (`getSviPacijenti`) kako doktor može odabrati pacijenta pri kreiranju rezervacije; dohvatanje historije pregleda po pacijentu (`getHistorijaPacijenta`), dohvatanje nalaza po pacijentu (`getNalaziZaPacijenta`) i po rezervaciji (`getNalaziZaRezervaciju`); preuzimanje/prikaz PDF nalaza (`getNalazPDF`) za doktora i pacijenta |
| **Šta je AI predložio ili generisao** | Backend (nalazController.ts / pacijentController.ts): `getNalaziZaPacijenta` — dohvata sve nalaze za pacijenta (bez `dokumentPDF` polja), sortirano po datumu; `getNalazPDF` — dohvata binarni PDF iz baze i šalje ga s ispravnim `Content-Type: application/pdf` i `Content-Disposition: inline` headerima; `getNalaziZaRezervaciju` — dohvata nalaz vezan za konkretnu rezervaciju kroz `historijaPregleda`; `getSviPacijenti` — dohvata sve pacijente s `korisnik` relacijom,; `getHistorijaPacijenta` — dohvata historiju pregleda s uključenim rezervacijama, terminima, doktorom i nalazima. Frontend: komponenta za prikaz liste pacijenata s odabirom pri doktorovoj rezervaciji, prikaz historije pregleda po pacijentu; prikaz i otvaranje PDF nalaza inline za doktora i pacijenta |
| **Šta je tim prihvatio** | Kompletan `nalazController.ts` s tri endpointa; `getSviPacijenti` s mapiranjem podataka, `getHistorijaPacijenta` s include lancima; frontend integracija za odabir pacijenta u doktorovom toku rezervacije; PDF prikaz |
| **Šta je tim izmijenio** | format za datum u `getHistorijaPacijenta` i `getNalaziZaPacijenta` jer se vrijeme nije ispravno formatiralo pri prikazu na frontendu |
| **Šta je tim odbacio** | Inicijalni prijedlog s `navDelta` varijablom za fix navigacije (iz prethodnog zadatka, zamijenjen direktnim pristupom u `goDay`) |
| **Rizici, problemi ili greške** | getNalaziZaRezervaciju vraća prazan niz ako nema historije, ali frontend mora biti spreman na oba slučaja ([] i [nalaz]) — nekonzistentan response shape može izazvati greške u prikazu |
| **Ko je koristio alat** | Amina Alispahić |
 
## Unos 007 - Podrška za email i Render deploy

| Stavka | Opis |
| :--- | :--- |
| **Datum** | 07.05.2026. |
| **Sprint broj** | Sprint 6 |
| **Alat koji je korišten** | Claude |
| **Svrha korištenja** | Podrška pri integraciji slanja emailova i rješavanje problema s deployom na Render platformi |
| **Kratak opis zadatka ili upita** | 1. Konfiguracija Nodemailer + Gmail SMTP za slanje email potvrda rezervacija. 2. Dijagnosticiranje problema slanja maila nakon deploya na Render (free plan). 3. Migracija sa Nodemailer na Resend API. 4. Dobivanje i konfiguracija Resend API ključa. 5. Razumijevanje ograničenja Render free plana (SMTP blokada, domain restriction). |
| **Šta je AI predložio ili generisao** | 1. Dijagnoza: Render free plan blokira SMTP portove 465 i 587. 2. Alternativno rješenje: zamjena Nodemailer-a sa Resend bibliotekom (HTTPS API). 3. Kompletan refaktorisani TypeScript kod za funkciju `posaljiPotvrdurezerv`. 4. Upute za kreiranje Resend računa i generisanje API ključa. 5. Konfiguracija environment varijable `RESEND_API_KEY` umjesto `EMAIL_USER`/`EMAIL_PASS`. 6. Objašnjenje ograničenja testnog domena `onboarding@resend.dev`. 7. Rješenje za 502 grešku pri otvaranju PDF-a (`Buffer.from` + `res.end()`). |
| **Šta je tim prihvatio** | Migracija na Resend biblioteku, nova environment varijabla `RESEND_API_KEY` dodana na Render dashboardu, refaktorisani TypeScript kod za email notifikacije, dijagnoza uzroka 502 greške kod PDF endpointa. |
| **Šta je tim izmijenio** | Nije bilo značajnih izmjena — predloženi kod je prihvaćen u cijelosti. |
| **Šta je tim odbacio** | Stara Nodemailer konfiguracija (Gmail SMTP) i `EMAIL_USER`/`EMAIL_PASS` environment varijable — uklonjene s Rendera. |
| **Rizici, problemi ili greške** | 1. Resend free plan: slanje moguće samo na verificirani email bez vlastite domene. 2. API ključ je bio privremeno izložen u chat poruci — preporučeno premještanje u `.env`. 3. `onboarding@resend.dev` ograničen na testne svrhe — za produkciju potrebna vlastita domena. 4. 502 greška na PDF endpointu još u dijagnostičkoj fazi. |
| **Ko je koristio alat** |Mušić  Sumeja |

## Unos 008 - Implementacija resetovanja lozinke

| Stavka | Opis |
| :--- | :--- |
| **Datum** | 13.05.2026 |
| **Sprint broj** | 7 |
| **Alat koji je korišten** | Google Antigravity |
| **Svrha korištenja** | Pomoć pri implementaciji funkcionalnosti za resetovanje lozinke, validaciju podataka, sigurnosne mehanizme i slanje email obavijesti u bolničkom sistemu. |
| **Kratak opis zadatka ili upita** | Implementirana backend i frontend funkcionalnost za “Forgot Password” i “Reset Password”, uključujući generisanje sigurnog tokena, hashiranje tokena i lozinke, ograničavanje broja zahtjeva (rate limiting), validaciju lozinke, evidenciju u audit logu, email slanje preko Brevo/Resend/Nodemailer servisa i reset korisničkog naloga nakon blokade. |
| **Šta je AI predložio ili generisao** | AI je predložio strukturu Express ruta i kontrolera, korištenje `crypto.randomBytes` za generisanje tokena, hashiranje tokena i lozinke, Prisma transakcije za sigurnu obradu resetovanja, validaciju lozinke putem `express-validator`, generisanje HTML email template-a za reset lozinke i verifikaciju emaila, te fallback mehanizme za email servise (Brevo, Resend, Nodemailer). |
| **Šta je tim prihvatio** | Tim je prihvatio implementaciju sigurnog reset password toka, generisanje i validaciju tokena, rate limiting, audit log evidenciju, validaciju lozinke, frontend integraciju i email template-ove za reset lozinke i verifikaciju korisnika. |
| **Šta je tim izmijenio** | Tim je prilagodio poruke sistema na bosanskom jeziku, izmijenio email sadržaj i dizajn template-a, dodao lokalni fallback za razvojno okruženje, prilagodio konfiguraciju email providera i povezao reset lozinke sa otključavanjem korisničkog naloga. |
| **Šta je tim odbacio** | Odbijena je mogućnost prikazivanja različitih poruka za postojeće i nepostojeće korisnike radi sigurnosti sistema, kao i čuvanje običnog tokena u bazi podataka bez hashiranja. |
| **Rizici, problemi ili greške** | Problemi sa konfiguracijom email servisa u lokalnom okruženju, potreba za pravilnim `.env` konfiguracijama, mogućnost isteka tokena, problemi sa rate limiting testiranjem i potreba za sigurnim rukovanjem reset linkovima. |
| **Ko je koristio alat** | Lamija Halilović |

## Unos 009 — Enkripcija osjetljivih medicinskih podataka

| Stavka | Opis |
| :--- | :--- |
| **Datum** | 13.05.2026 |
| **Sprint broj** | Sprint 5 |
| **Alat koji je korišten** | Claude (Anthropic) |
| **Svrha korištenja** | Implementacija enkripcije osjetljivih medicinskih podataka (dijagnoza i medicinska istorija pacijenata) radi zaštite privatnosti i usklađenosti s regulativama |
| **Kratak opis zadatka ili upita** | AI je dobio zadatak da predloži i implementira mehanizam enkripcije za polja `dijagnoza` i `medicinaIstorija` u bazi podataka, koristeći Prisma middleware kako bi enkripcija/dekripcija bila transparentna za ostatak aplikacije |
| **Šta je AI predložio ili generisao** | Prisma middleware za automatsku enkripciju/dekripciju osjetljivih polja pri čitanju i pisanju; AES-256-GCM enkripciju putem Node.js `crypto` modula; upravljanje enkripcijskim ključevima putem environment varijabli; identifikaciju osjetljivih polja u Prisma shemi (`dijagnoza`, `medicinskaIstorija`); error handling za slučajeve neispravnog ključa ili oštećenih podataka |
| **Šta je tim prihvatio** | Kompletnu strukturu Prisma middleware-a; pristup pohrane ključa u `.env` fajlu; logiku automatske enkripcije pri kreiranju/ažuriranju i dekripcije pri čitanju zapisa |
| **Šta je tim izmijenio** | Nazivi polja su prilagođeni stvarnoj Prisma shemi projekta; dodata je dodatna provjera za `NULL` vrijednosti kako bi se spriječile greške na postojećim zapisima bez podataka; migracijska skripta je ručno prilagođena za postojeće podatke |
| **Šta je tim odbacio** | Prijedlog rotacije enkripcijskog ključa (key rotation) — funkcionalnost odgođena za kasniju fazu; automatsko logovanje svih dekripcijskih operacija zbog performansnih razloga |
| **Rizici, problemi ili greške** | AI inicijalno nije uzeo u obzir postojeće nešifrirane zapise u bazi — zahtijevalo je dodatnu migracijsku skriptu; jedan primjer koda koristio je zastarjeli Node.js `crypto` API koji je ručno ispravljen; potrebno je pažljivo upravljanje backup-om ključa kako bi se spriječio trajan gubitak podataka |
| **Ko je koristio alat** | Almedin Šehić |

# Unos 010 — Implementacija JWT autentifikacije (Login)

| Stavka | Opis |
|--------|------|
| **Datum** | 14.05.2026 |
| **Sprint broj** | 7 |
| **Alat koji je korišten** | Perplexity AI(Claude Sonnet) |
| **Svrha korištenja** | Pomoć pri implementaciji JWT autentifikacije i zamjeni privremenih test funkcija stvarnim login mehanizmom u bolničkom sistemu. |
| **Kratak opis zadatka ili upita** | AI je dobio zadatak da pomogne u zamjeni test funkcija poput `getCurrentPacijent` s pravim JWT token-based autentifikacijskim tokom, uključujući backend login endpoint, generisanje tokena i frontend integraciju s Vite + React aplikacijom. |
| **Šta je AI predložio ili generisao** | AI je predložio strukturu JWT login endpointa, middleware za verifikaciju tokena (`authMiddleware`), čuvanje tokena u `localStorage`, te zamjenu mock funkcija stvarnim token-based pristupom podacima prijavljenog korisnika. |
| **Šta je tim prihvatio** | JWT pristup za autentifikaciju, strukturu `authMiddleware`-a, čuvanje tokena u `localStorage` i prosljeđivanje tokena kroz `Authorization: Bearer` header. |
| **Šta je tim izmijenio** | Tim je prilagodio strukturu odgovora login endpointa postojećoj konvenciji projekta i uskladio nazive polja s Prisma shemom. |
| **Šta je tim odbacio** | Korištenje `httpOnly` cookie pristupa za čuvanje tokena, jer je tim ostao pri `localStorage` rješenju. |
| **Rizici, problemi ili greške** | Problemi s Prisma konfiguracijom i validacijom sheme nakon izmjena, te potreba za usklađivanjem frontend i backend tipova podataka pri radu s JWT tokenom. |
| **Ko je koristio alat** | Kenan Hatibović |

# Unos 011 — Implementacija automatske odjave nakon neaktivnosti
| Stavka | Opis |
| :--- | :--- |
| **Datum** | 14. 05. 2026. |
| **Sprint broj** | Sprint 7 |
| **Alat koji je korišten** | Claude |
| **Svrha korištenja** | Implementacija napredne sigurnosne logike: upravljanje sesijama, sinhronizacija tabova i autorizacija po ulogama. |
| **Kratak opis zadatka ili upita** | Implementacija automatske odjave nakon 15 min, WebSocket sinhronizacija sesija, te uvođenje Middleware zaštite za ograničavanje pristupa rutama na osnovu uloga (Doktor/Pacijent). |
| **Šta je AI predložio ili generisao** | Logiku za `useAutoLogout`, strukturu `AutoLogoutModal`, WebSocket emitere, te predložak Middleware funkcije za provjeru JWT tokena i `user.role` atributa pri svakom zahtjevu. |
| **Šta je tim prihvatio** | Upotrebu WebSocketa za logout, te strogu podjelu ruta (npr. `/doctor/*` rute dostupne samo sa `role: 'doctor'`). |
| **Šta je tim izmijenio** | Dodata je `dispatchEvent` logika za trenutni tab, te je implementirano automatsko preusmjeravanje (redirect) na login stranicu sa "return-to" parametrom ukoliko neprijavljeni korisnik pokuša pristupiti rezervacijama. |
| **Šta je tim odbacio** | Korištenje Local Storage-a za sesije i klijentsku provjeru uloga bez serverske verifikacije (zbog sigurnosnih propusta). |
| **Rizici, problemi ili greške** | Rizik od neovlaštenog pristupa riješen provjerom vlasništva nad resursom u kontrolerima. |
| **Ko je koristio alat** | Amina Alispahić |


# Unos 012 — Implementacija Detekcije neobičnog ponašanja 

| Stavka | Opis |
| :--- | :--- |
| **Datum** | 14.05.2026. |
| **Sprint broj** | Sprint 7 |
| **Alat koji je korišten** | Codex 5.5 |
| **Svrha korištenja** | Pomoć pri implementaciji sigurnosne funkcionalnosti US-26 — detekcija neobičnog ponašanja i blokiranje naloga nakon više neuspješnih pokušaja prijave |
| **Kratak opis zadatka ili upita** | AI je korišten za analizu postojećeg login sistema, Prisma šeme i backend strukture, te za implementaciju mehanizma koji prati neuspješne pokušaje prijave i automatski zaključava korisnički nalog nakon 5 neuspješnih pokušaja. |
| **Šta je AI predložio ili generisao** | 1. Dodavanje novih polja u model Korisnik: `nalogZakljucan`, `vrijemeZakljucavanja` i `zadnjiNeuspjeliPokusaj`. 2. Proširenje login logike tako da se broj neuspješnih pokušaja povećava nakon pogrešne lozinke. 3. Automatsko zaključavanje naloga nakon 5 pokušaja. 4. Vraćanje posebnog statusa za zaključan nalog. 5. Evidentiranje događaja u audit log. 6. Omogućavanje povratka pristupa kroz reset lozinke. |
| **Šta je tim prihvatio** | Logika blokiranja naloga nakon 5 neuspješnih pokušaja, resetovanje brojača nakon uspješne prijave, otključavanje naloga nakon resetovanja lozinke, dodavanje audit log zapisa i dodavanje testova za ovu funkcionalnost. |
| **Šta je tim izmijenio** | Prilagođeni su nazivi polja i poruke postojećem stilu projekta. Dodana je Prisma migracija za nova polja u bazi. Poboljšana je lokalna konfiguracija servera kroz `.env` i jasnije poruke za greške vezane za bazu i enkripcijski ključ. |
| **Šta je tim odbacio** | Nije prihvaćeno kompleksnije rješenje sa automatskim vremenskim otključavanjem naloga, jer je za ovaj zahtjev bilo dovoljno da korisnik povrati pristup putem resetovanja lozinke. |
| **Rizici, problemi ili greške** | 1. Lokalni server može prijaviti internu grešku ako baza nije dostupna ili ako nedostaje `MASTER_ENCRYPTION_KEY`. 2. AI je pomogao u dijagnostici problema i predložio jasnije error poruke. 3. Potrebno je paziti da se Prisma migracije pokrenu nad bazom koja se koristi lokalno ili na deploymentu. |
| **Ko je koristio alat** | Hamza Husović |

## Unos 013 - Implementacija RBAC za postojece funkcionalnosti

| Stavka | Opis |
| :--- | :--- |
| **Datum** | 19.05.2026. |
| **Sprint broj** | Sprint 8 |
| **Alat koji je korišten** | Claude (Opus) |
| **Svrha korištenja** | Razvoj i implementacija sigurnosnih mehanizama (autorizacije i kontrole pristupa) na backendu i frontendu. |
| **Kratak opis zadatka ili upita** | Implementacija RBAC (Role-Based Access Control) sistema za uloge: ADMINISTRATOR, PACIJENT, DOKTOR, MEDICINSKO_OSOBLJE i VLASNIK, uključujući zaštitu API ruta, pametno preusmjeravanje na frontendu i dinamički prikaz elemenata u navigaciji. |
| **Šta je AI predložio ili generisao** | Kreiranje tvorničke funkcije `autorizuj` kao Express middleware-a na backendu, uvođenje dinamičkog niza `allowedUloge` i funkcije `getDefaultRoute` unutar `ProtectedRoute` komponente na React frontendu, te prilagođavanje login logike i navigacijske trake za uslovno renderovanje dugmadi prema ulogama. |
| **Šta je tim prihvatio** | Kompletnu arhitekturu middleware-a sa statusnim kodovima 401 i 403, strukturu zaštićenih ruta na klijentu, automatsku WebSocket sinhronizaciju sesije (`LOGIN_SUCCESS`) nakon prijave, te vizuelno odvajanje admin opcija (ljubičasti akcenat) u navbaru. |
| **Šta je tim izmijenio** | Tip povratne vrijednosti funkcije `getUserRole` u auth utilitijima je proširen na opštiji `string | null` kako bi se mapirale novouvedene administratorske i osoblinske uloge bez striktnog ograničavanja na stare tipove. |
| **Šta je tim odbacio** | Prvobitnu logiku koja je u `ProtectedRoute` provjeravala samo pojedinačnu ulogu (`allowedUloga`), jer je bila nefleksibilna za rute kojima treba pristupiti više različitih rola istovremeno. |
| **Rizici, problemi ili greške** | Potencijalni sigurnosni rizik od propusta u zaštiti pojedinačnih API endpoints ako se izostavi middleware, što je eliminisano striktnim mapiranjem kroz `router.ts` i `reservationRoutes.ts`. Kod uspješno kompajlira na obje strane bez TypeScript grešaka. |
| **Ko je koristio alat** | Lamija Halilović |


## Unos 014 - Testiranje


| Stavka | Opis |
| :--- | :--- |
| **Datum** | 20. Maj 2026. |
| **Sprint broj** |Sprint 8 |
| **Alat koji je korišten** | Gemini (AI Collaborator) |
| **Svrha korištenja** | Refaktorisanje, ispravljanje i refaktorizacija integracijskih testova (Vitest + Supertest) |
| **Kratak opis zadatka ili upita** | Usklađivanje starih integracijskih testova za termine i rezervacije sa novim izmjenama u API backend kontrolerima (prelazak na snake_case ID-eve, nove rute za Redis lock i implementaciju JWT autorizacije). |
| **Šta je AI predložio ili generisao** | Kompletna dva testna fajla (`rezervacije.test.ts` i `termini.test.ts`). AI je spojio staru logiku sa novim zahtjevima, zamijenio `camelCase` ključeve sa bazi prilagođenim `idPrefiks` ključevima (`idTermina`, `idPacijent`), te generisao JWT tokene za simulaciju različitih uloga (Pacijent, Doktor, Admin). |
| **Šta je tim prihvatio** | * Zamjenu ručnog Redis postavljanja (`redis.setex`) sa stvarnim API pozivima ka rutama za zaključavanje.<br>* Strukturu payload-a koja koristi `idTermina`, `idDoktor`, `idPacijent`, i `idTipPregleda`.<br>* Nove rute `POST /api/termini/:id/lock` i `DELETE /api/termini/:id/unlock` umjesto starih `/zakljucaj` i `/oslobodi`. |
| **Šta je tim izmijenio** | Prilagođene su `expect` provjere kako bi hvatale dinamičke odgovore kontrolera (npr. provjera `response.body.locked` i fleksibilno hvatanje grešaka kroz `message` ili `poruka`). |
| **Šta je tim odbacio** | Odbačen je stari način slanja korisničkog ID-ja kroz custom header (`x-test-korisnik-id`) u korist standardnog `Authorization: Bearer <token>` i slanja `userId` unutar request body-ja. |
| **Rizici, problemi ili greške** | * **Rizik od trke (Race Condition):** Tokom paralelnog izvršavanja testova, fiksni ID-evi poput `TERMIN_ID = 1` mogu izazvati konflikte ako baza nije izolovana.<br>* **Problem:** Inkonzistentnost u imenovanju polja (camelCase vs. snake_case/id-prefiksa) između frontend specifikacije i Prisma modela, što je uspješno riješeno ovim refaktorom. |
| **Ko je koristio alat** |Mušić Sumeja |

## Unos 015 — Ispravka komentara rezervacije i zabrana rezervacije u prošlosti

| Stavka | Opis |
|:--- |:--- |
| **Datum** | 20.5.2026. |
| **Sprint broj** | Sprint 8 |
| **Alat koji je korišten** | Codex 5.5 |
| **Svrha korištenja** | Pomoć pri rješavanju merge konflikta i provjeri bugfix izmjena za komentare rezervacija i validaciju termina u prošlosti. |
| **Kratak opis zadatka/upita** | Potrebno je bilo spojiti granu sa `main`, zadržati postojeće funkcionalnosti sa `main` grane, sačuvati bugfix izmjene i provjeriti da sve radi nakon merge-a. |
| **Šta je AI predložio** | Rješavanje konflikata u frontend i backend fajlovima, zadržavanje novije strukture sa `main` grane i ponovno dodavanje bugfix logike za više komentara i blokiranje rezervacija u prošlosti. |
| **Šta je tim prihvatio** | Zadržavanje strukture sa `main` grane, očuvanje bugfix logike za više komentara, dodavanje provjere za rezervacije u prošlosti i sigurnosna provjera pristupa komentarima rezervacije. |
| **Šta je tim izmijenio** | Dodana je tabela `Komentar`, komentari se sada čuvaju kao zasebni zapisi, frontend prikazuje niz komentara, a backend koristi `prisma.komentar.create` umjesto prepisivanja postojećeg komentara. Dodana je validacija koja blokira rezervaciju termina u prošlosti. |
| **Šta je tim odbacio** | Direktno mijenjanje `main` grane i odbacivanje postojećih funkcionalnosti sa `main` grane. |
| **Uočeni rizici/problemi** | Merge konflikt je uključivao fajlove koji su refaktorisani na `main` grani, pa je bilo potrebno pažljivo spojiti postojeće funkcionalnosti sa novim bugfix izmjenama. |
| **Korisnik alata** | Hamza Husović i Kenan Hatibović |

## Unos 016 — Panel za medicinsko osoblje
| Stavka | Opis |
| :--- | :--- |
| Datum | 20.05.2026. |
| Sprint broj | Sprint 8 |
| Alat koji je korišten | Claude (Anthropic) — claude.ai |
| Svrha korištenja | Pomoć pri razvoju panela za medicinsko osoblje (frontend i backend) |
| Kratak opis zadatka ili upita | Razvoj kompletnog panela za medicinsko osoblje koji uključuje: prikaz i pretragu termina, zakazivanje novih termina kroz višekoračni modal, otkazivanje termina, označavanje hitnih termina, upload PDF nalaza uz rezervaciju, kalendarski prikaz (dnevni/sedmični/lista), te backend API endpoint-e i servisnu logiku |
| Šta je AI predložio ili generisao | Controller i service funkcije za upravljanje terminima i nalazima (`osobljeController.ts`, `osobljeService.ts`), Express rute (`osobljeRoutes.ts`), React komponente (`StaffPanel`, `NewAppointmentModal`, `AppointmentDetailModal`, `UploadPdfModal`, `CalendarView`, `CancelModal`), logiku za Redis lock pri rezervaciji, višekoračni modal s opcionalnim uploadom PDF nalaza kao 4. korak, automatski increment `brojPregleda` doktora u transakciji |
| Šta je tim prihvatio | Struktura komponenti i modala, logika filtriranja i prikaza termina po statusu, kalendarski prikaz s UTC normalizacijom datuma, višekoračni modal za zakazivanje, upload PDF nalaza, logika za otkazivanje s potvrdom, označavanje hitnih termina |
| Šta je tim izmijenio | Prisma upiti su morali biti ručno ispravljani — AI je generisao upite koji nisu odgovarali stvarnoj shemi baze; redoslijed Express ruta je morao biti ručno prilagođen jer je dolazilo do preklapanja parametara (npr. `/nalazi/:id/pdf` vs `/nalazi/:idRezervacije`); logika za JWT autorizaciju i slanje `Authorization` headera pri fetch pozivima je morala biti ručno dodana i provjeravana |
| Šta je tim odbacio | Prijedlog za `window.open()` za otvaranje PDF-a bez `Authorization` headera (zamijenjeno fetch + blob URL pristupom); inline prikaz hitnost checkboxa unutar modala (zamijenjeno automatskom logikom na osnovu tipa pregleda) |
| Rizici, problemi ili greške | AI je više puta generisao Prisma upite koji ne odgovaraju stvarnoj shemi (npr. nedostajuća obavezna polja `dijagnoza` i `terapija` pri kreiranju `HistorijaPregleda`); pogrešan redoslijed ruta uzrokovao `Cannot GET` greške; JWT token nije bio uključen u sve fetch pozive što je uzrokovalo 401 greške pri otvaranju PDF nalaza |
| Ko je koristio alat | Član tima zadužen za panel medicinskog osoblja (frontend + backend) |

## Unos 017— Lista čekanja za dane sa popunjenim terminima i implementacija obavijesti za članove liste čekanja

| Stavka | Opis |
| :--- | :--- |
| **Datum** | 24.05.2026. |
| **Sprint broj** | Sprint 9 |
| **Alat koji je korišten** | Claude (Anthropic) — claude.ai |
| **Svrha korištenja** | Pomoć pri dizajnu i implementaciji sistema liste čekanja (waitlist), ispravljanje integracijskih testova |
| **Kratak opis zadatka ili upita** | Implementacija waitlist sistema koji automatski obavještava sljedećeg pacijenta u redu kada se termin oslobodi|
| **Šta je AI predložio ili generisao** | AI je inicijalno predložio korištenje cron joba za periodičnu provjeru isteklih ponuda i obavještavanje sljedećeg pacijenta u redu. Također je generisao kompletan Proof of Testing dokument u Markdown formatu, PR opis sa objašnjenjem tokova liste čekanja, ispravke integracijskih testova (zamjena `/api/rezervacija` sa `/api/rezervacije`, dodavanje `afterEach` čišćenja u recenzija testovima, dinamičko dohvatanje `PACIJENT_ID` iz baze) i objašnjenje o filtriranju pacijenta koji je sam uzrokovao otkazivanje |
| **Šta je tim prihvatio** | Korištenje Redis TTL mehanizma za praćenje isteklih ponuda umjesto cron joba, korištenje `setTimeout` kao sigurnosnog mehanizma za okidanje provjere nakon isteka TTL-a, logika filtriranja pacijenta koji je uzrokovao otkazivanje kroz `uzrokovaoOtkazivanjePacijentId` parametar, Redis set `waitlist:pokusali:{terminId}` za praćenje pacijenata kojima je već ponuđen termin, struktura PR opisa i Proof of Testing dokumenta, ispravke putanja u integracijskim testovima |
| **Šta je tim izmijenio** | Umjesto cron joba primijenjen je kombinovani pristup: Redis TTL automatski istekne offer ključ nakon 2 minute, a `setTimeout` u servisu poziva `obradiOtkazivanje` nakon isteka kako sistem ne bi ostao zablokiran. Logika za slanje obavijesti i oslobađanje termina prilagođena je tako da uzima u obzir i pacijente koji su se prijavili na listu i imaju aktivne rezervacije kod istog doktora za isti dan |
| **Šta je tim odbacio** | Prijedlog korištenja cron joba jer bi zahtijevao dodatnu infrastrukturu i periodičko skeniranje baze, što je neefikasnije od reaktivnog pristupa temeljenog na Redis TTL-u i event-driven logici |
| **Rizici, problemi ili greške**  |
| **Ko je koristio alat** | Amina Alispahić |

## Unos 018 - Profil korisnika

| Stavka | Opis |
|:---|:---|
| **Datum** | 24.05.2026. |
| **Sprint broj** | Sprint 9 |
| **Alat koji je korišten** | Claude (Opus) |
| **Svrha korištenja** | Razvoj i implementacija funkcionalnosti korisničkog profila pacijenta na backendu i frontendu, uključujući uređivanje podataka i validaciju datuma. |
| **Kratak opis zadatka ili upita** | Implementacija stranice profila pacijenta sa prikazom osnovnih podataka (ime, prezime, email, telefon, datum rođenja), mogućnošću uređivanja svih podataka osim emaila, primjenom jedinstvenog formata datuma dd/mm/yyyy i podrškom za ažuriranje podataka putem PATCH endpointa. |
| **Šta je AI predložio ili generisao** | Kreiranje React komponente za profil sa edit modom i success/error state logikom, implementaciju PATCH /users/{id}/profile endpointa sa validacijom podataka, helper funkcije za formatiranje datuma prema BUG-03 zahtjevu, te prikaz notifikacije "Profil uspješno ažuriran" nakon uspješnog čuvanja izmjena. |
| **Šta je tim prihvatio** | Kompletan pristup organizaciji profil stranice sa odvojenim view i edit modom, validaciju formata datuma na backendu i frontendu, centralizovani date-formatting helper, te success/error state handling za korisničke akcije. |
| **Šta je tim izmijenio** | Prilagođena je validacija telefonskog broja kako bi podržavala različite formate unosa. |
| **Šta je tim odbacio** | Prvobitni prijedlog da se email uređuje direktno unutar profil forme, jer je odlučeno da promjena email adrese zahtijeva poseban verifikacijski flow radi sigurnosti korisničkog računa. |
| **Rizici, problemi ili greške** | Postojao je rizik od nekonzistentnog prikaza datuma između backend i frontend dijela sistema, što je riješeno uvođenjem zajedničkog helpera za formatiranje datuma. |
| **Ko je koristio alat** | Lamija Halilović |


## Unos 019 — Admin panel: korisnički interfejs i backend funkcionalnosti

| Stavka | Opis |
| :--- | :--- |
| **Datum** | 24.05.2026. |
| **Sprint broj** | Sprint 9 |
| **Alat koji je korišten** | Claude Code (claude-sonnet-4-6) |
| **Svrha korištenja** | Implementacija admin panel funkcionalnosti — frontend interfejs i backend API |
| **Kratak opis zadatka ili upita** | Implementirati kompletan admin panel s upravljanjem korisnicima i ulogama (US-02, US-33), rasporedom doktora i medicinskog osoblja s Kanban prikazom, upravljanjem odjelima i analitikom bukiranja. |
| **Šta je AI predložio ili generisao** | **Frontend:** Tab "Korisnici" s paginacijom, filterima i color-coded ulogama; modal za promjenu uloge s dinamičkim poljima; Kanban prikaz rasporeda po danima sedmice i Klasifikacija po odjelima; CRUD modali za šablone i izuzetke rasporeda; tab Analitika sa sedmičnim i mjesečnim statistikama. **Backend:** Endpoint `PATCH /api/admin/korisnici/:id/uloga` s Prisma transakcijom (promjena uloge + kreiranje profila + audit log); CRUD za `RasporedDoktora` i `RasporedOsoblja` s unique constraintom po osobi i danu; generisanje `Termin` zapisa iz šablona; endpoint za analitiku (broj rezervacija, otkazivanja, prosječno čekanje za hitne termine, agregacija po doktoru). |
| **Šta je tim prihvatio** | Kompletna implementacija frontenda i backenda kako je predložena |
| **Šta je tim izmijenio** | — |
| **Šta je tim odbacio** | — |
| **Rizici, problemi ili greške** | Migracija `20260524120000_redesign_raspored` uklonila je `datumOd`/`datumDo` iz `RasporedDoktora`, ali ovo nije odmah sinhronizovano sa `seed.ts` i `setupFiles.ts`, što je uzrokovalo pad integracionih testova u narednoj sesiji. |
| **Ko je koristio alat** | Hana Mahmutović |


---

## Unos 020 — Dijagnoza i ispravak integracionih testova

| Stavka | Opis |
| :--- | :--- |
| **Datum** | 24.05.2026. |
| **Sprint broj** | Sprint 9 |
| **Alat koji je korišten** | Claude Code (claude-sonnet-4-6) |
| **Svrha korištenja** | Dijagnoza grešaka u integracionim testovima i ispravak; dokumentovanje implementiranih funkcionalnosti |
| **Kratak opis zadatka ili upita** | Utvrditi koji su integracioni testovi padali nakon izmjena u prethodnoj sesiji (dodavanje admin panel funkcionalnosti), pronaći uzroke i popraviti ih bez narušavanja logike. |
| **Šta je AI predložio ili generisao** | Analiza git historije i diff-ova identificirala tri uzroka pada testova: (1) `setupFiles.ts` referencira `datumOd` polje koje je migracija `20260524120000_redesign_raspored` uklonila, (2) `seed.ts` sadrži iste referentne greške i uzrokuje pad `globalSetup`-a, (3) `rezervacije.test.ts` koristi hardkodirani `STVARNI_KORISNIK_ID = 2`, ali seed kreira pacijenta tek nakon 6 doktora pa on dobija ID ≈ 7. Predložen i implementiran fix u `beforeAll` — dinamički dohvat stvarnog korisnik ID-a iz baze putem `prisma.korisnik.findUnique({ email: "musicsumeja98@gmail.com" })` umjesto hardkodiranog ID-a. |
| **Šta je tim prihvatio** | Fix u `rezervacije.test.ts` — dinamički lookup korisnik ID-a; analiza uzroka svih pada testova |
| **Šta je tim izmijenio** | Opis user storija je skraćen i preformulisan prema preferenci tima (bullet point format, suženiji backend opis) |
| **Šta je tim odbacio** | — |
| **Rizici, problemi ili greške** | Primarna greška nastala jer je migracija uklonila kolonu `datumOd` iz `RasporedDoktora`, ali `setupFiles.ts` i `seed.ts` nisu ažurirani u istom commitu — što je uzrokovalo pad cijele integracione test suite. |
| **Ko je koristio alat** | Hana Mahmutović |
---
## Unso 021 — Healthbook Chatbot

| Stavka | Opis |
| :--- | :--- |
| **Datum** |  23.05.2026. |
| **Sprint broj** | Sprint 9 |
| **Alat koji je korišten** | Claude (Anthropic) — claude.ai |
| **Svrha korištenja** | Dizajn arhitekture, generisanje koda i debugging AI chatbot funkcionalnosti za aplikaciju za rezervaciju medicinskih termina |
| **Kratak opis zadatka ili upita** | Tim je zatražio implementaciju AI chatbota koji korisnicima objašnjava kako se rezervišu termini i odgovara na pitanja vezana za sistem. Chatbot je trebalo integrisati u postojeću React + Node.js + PostgreSQL aplikaciju koristeći Gemini API (free tier). Tokom razvoja pojavili su se višestruki problemi s 429 greškama koje je trebalo dijagnosticirati i riješiti. |
| **Šta je AI predložio ili generisao** | • Kompletnu arhitekturu chatbota: Express ruta `/api/chat`, PostgreSQL tabele `chat_logs` i `chat_rate_limit`, React komponenta `Chatbot.tsx` s pratećim komponentama `ChatMessage.tsx` i `ChatSuggestions.tsx` • Detaljan system prompt na bosanskom jeziku s opisom svih funkcionalnosti Healthbook sistema (rezervacija, otkazivanje, lista čekanja, sigurnost, hronični bolesnici i dr.) • `fetchWithRetry` funkciju za frontend (koja je naknadno uklonjena) • `callGeminiSafe` queue funkciju na backendu s čekanjem od 35s između poziva • Rate limit middleware s razlikom između prijavljenih (50/sat) i anonimnih (10/sat) korisnika • Dijagnostiku 429 grešaka kroz analizu DevTools screenshotova i stack trace-ova • `waitTimer` mehanizam koji korisniku prikazuje "Malo gužve, čekam slobodan red..." tokom čekanja na Gemini odgovor • Mock mode (`MOCK_CHAT=true`) za development bez trošenja Gemini kvote • Kompletni implementacijski prompt u `.md` formatu spreman za Claude Code ili Cursor |
| **Šta je tim prihvatio** | • `chatFetch` (pojednostavljena verzija bez retry-ja) umjesto `fetchWithRetry` • `callGeminiSafe` backend queue s 35s intervalom između Gemini poziva • Dvostepeno parsiranje odgovora u `sendMessage`: prvo provjera 429 statusa, zatim JSON parsiranje • `waitMsg` state i timer za prikaz poruke čekanja korisniku • System prompt prilagođen Healthbook sistemu na bosanskom jeziku • Odvajanje queue logike u poseban servisni modul (`geminiQueue.js`) radi preživljavanja nodemon restarta • `MOCK_CHAT=true` env varijabla za development |
| **Šta je tim izmijenio** | • `fetchWithRetry` s retry logikom zamijenjen jednostavnim `chatFetch` — tim je shvatio da retry na frontendu multiplicira 429 greške umjesto da ih rješava • Timeout za `waitTimer` smanjen s 5s na 3s radi boljeg UX-a • System prompt dopunjen specifičnostima klinike koje AI nije poznavao (nazivi odjela, kontakt informacije) • Rate limit vrijednosti prilagođene stvarnim potrebama tima u dev okruženju (povećano s 20 na 200 za development) |
| **Šta je tim odbacio** | • Prijedlog migracije na Redis za rate limiting — tim je odlučio zadržati PostgreSQL rješenje koje ne zahtijeva dodatnu infrastrukturu • Migracija s Gemini na Anthropic API — tim želi ostati na Gemini free planu tokom faze učenja • Exponential backoff retry na frontendu — pokazalo se kontraproduktivnim jer troši Gemini kvotu brže |
| **Rizici, problemi ili greške** | • **Gemini free tier limit (2 req/min, 50 req/dan)** — glavna tehnička prepreka tokom razvoja; uzrokovala višestruke 429 greške • **nodemon resetuje `lastGeminiCall`** — in-memory varijabla se briše pri svakom restartu servera, što uzrokuje premature Gemini pozive; riješeno prebacivanjem u poseban modul • **`fetchWithRetry` multiplicirala greške** — originalna implementacija slala je 3 zahtjeva umjesto 1, što je trošilo kvotu 3× brže; uklonjena • **API ključ** — tim mora osigurati da `GEMINI_API_KEY` ostane isključivo na backendu i nikad ne dospije na frontend ili u Git repozitorij (dodati u `.gitignore`) • **Dnevna kvota** — free tier ima limit od 50 zahtjeva/dan što može biti nedovoljno za demo prezentaciju sprintova; preporučuje se pripremiti mock mode kao backup |
| **Ko je koristio alat** | Mušić Sumeja |


---

## Unos 022 — Ispravka grafičkog prikaza zauzetosti kabineta i hitne dodjele

| Stavka | Opis |
| :--- | :--- |
| **Datum** | 23.05.2026 |
| **Sprint broj** | Sprint 9 |
| **Alat koji je korišten** | Codex / ChatGPT |
| **Svrha korištenja** | Pomoć pri dijagnostici i ispravci funkcionalnosti grafičkog prikaza zauzetosti kabineta u panelu medicinskog osoblja, te dodavanje provjera kroz unit testove |
| **Kratak opis zadatka ili upita** | AI je korišten za analizu zašto klik na slobodan kabinet ne otvara formu za dodjelu hitnog slučaja, zašto modal prikazuje da nema slobodnih termina za brzu dodjelu, te zašto pretraga pacijenta ne pronalazi pacijente kada se ime/prezime unese bez dijakritičkih znakova |
| **Šta je AI predložio ili generisao** | Izmjenu frontend logike u `SekcijaZauzetostiKabineta.tsx` tako da se forma otvara za kabinete sa statusom `SLOBODAN`; normalizaciju pretrage pacijenata radi ignorisanja dijakritičkih znakova; proširenje backend servisa `sobaOccupancyService.ts` da uz današnje termine vrati i prve naredne slobodne termine za kabinet; dodatne unit testove za statuse kabineta, naredne slobodne termine, validaciju datuma i fallback slučajeve |
| **Šta je tim prihvatio** | Otvaranje forme klikom na slobodan kabinet, prikaz prvih slobodnih termina umjesto ograničenja samo na današnji dan, poboljšanu pretragu pacijenata i proširene backend unit testove za servis zauzetosti kabineta |
| **Šta je tim izmijenio** | Uklonjena je frontend test infrastruktura iz commita radi manjeg i čišćeg pull requesta; iz commita su uklonjeni generisani `coverage/` izvještaji i `node_modules/.vite` cache fajlovi, a dodana su `.gitignore` pravila da se ne prate ubuduće |
| **Šta je tim odbacio** | Commitovanje generisanih coverage HTML izvještaja, Vite/Vitest cache fajlova i nepotrebnih frontend test dependency izmjena u `package-lock.json` |
| **Rizici, problemi ili greške** | Slobodan kabinet može otvoriti formu i kada nema trenutno dostupnih termina, pa korisnik mora dobiti jasnu poruku ili naredne slobodne termine; potrebno je paziti da se workflow pokreće na ispravnom branchu i da se testovi pokreću iz `server` foldera ili preko GitHub Actions workflowa |
| **Ko je koristio alat** | Hamza Husović |

---

## Unos 023 — Implementacija statusa hroničnog bolesnika i automatskih SMS podsjetnika

| Stavka | Opis |
| :--- | :--- |
| **Datum** | 25.05.2026. |
| **Sprint broj** | Sprint 9 |
| **Alat koji je korišten** | Gemini |
| **Svrha korištenja** | Implementacija US-31-EXT: označavanje pacijenata hroničnim bolesnicima i automatizacija SMS podsjetnika putem Infobip servisa. |
| **Kratak opis zadatka ili upita** | Kreiranje UI elemenata u detaljima termina, proširenje TypeScript tipova, izrada backend PATCH rute, te konfiguracija cron job-a za slanje poruka. |
| **Šta je AI predložio ili generisao** | UI komponentu za TerminDetalj.tsx (toggle i input), logiku za računanje datuma podsjetnika u reminderJob.ts i integraciju za Infobip API. |
| **Šta je tim prihvatio** | Kompletan frontend toggle sistem, backend rutu `/pacijenti/:id/hronicni`, automatsko upisivanje u ReminderLog i korištenje .env varijabli. |
| **Šta je tim izmijenio** | Usklađivanje naziva polja sa Prisma šemom (hronicniBolesnik), dodavanje Bearer tokena u fetch pozive i normalizaciju UTC vremena. |
| **Šta je tim odbacio** | Prijedloge za hardkodirane URL adrese backenda u korist varijabli okruženja zbog ispravnog rada aplikacije na Renderu. |
| **Rizici, problemi ili greške** | Razlika u UTC vremenu servera i lokalnom vremenu korisnika (zahtijevalo setHours na nulu). Infobip Trial nalog dozvoljava slanje samo na verifikovane brojeve. |
| **Ko je koristio alat** | Kenan Hatibović|

# Unos 024 — AuditLog: korisnički interfejs i backend funkcionalnosti, pisanje integracionih i unit testova za auditLog

Ovaj dokument je kreiran s ciljem transparentnog praćenja i dokumentovanja uloge AI alata tokom rada na projektu.

| Stavka | Opis |
| :--- | :--- |
| **Datum** | 1. juni 2026. |
| **Sprint broj** | Sprint 10  |
| **Alat koji je korišten** | **Claude**, **Gemini**  |
| **Svrha korištenja** | Razvoj serverske logike, formatiranje JSON struktura, pisanje integracionih testova. |
| **Kratak opis zadatka ili upita** | Implementacija rute i dvije funkcije unutar administrativnog kontrolera za preuzimanje i prikazivanje detalja revizijskih zapisnika (`Audit Logs`). Generisanje pratećih automatizovanih testova |
| **Šta je AI predložio ili generisao** | 1. **Claude:** Pomogao u implementaciji dvije ključne funkcije u kontroleru: `getAuditLogs` (za preuzimanje, paginaciju i napredno filtriranje) i `formatirajDetaljeAkcije` (robusna pomoćna funkcija koja parsira kompleksne `stariPodaci`/`noviPodaci` JSON objekte i pretvara ih u tekst prilagođen ljudima).<br>2. **Gemini:** Generisao 36 automatizovanih testnih scenarija (15 unit i 21 integracioni test) te kreirao formalni QA izvještaj sa BDD nomenklaturom testova (koncept *"Treba da uradi X kada se desi Y"*). |
| **Šta je tim prihvatio** | * Od Claude-a: Arhitekturu kontrolera, SQL/Prisma logiku filtriranja datuma/tipova akcija, i sve rubne slučajeve (edge-cases) za parsiranje uloga, blokiranja i ažuriranja profila.<br>* Od Gemini-ja: Kompletnu strukturu testova, `beforeEach` strategiju izolacije baze podataka i prečišćene, profesionalne nazive testova za dokumentaciju. |
| **Šta je tim izmijenio** | Ručno su mapirani testni tokeni i `x-test-korisnik-id` zaglavlja u integracionim testovima kako bi se osiguralo da simulirani zahtjevi u potpunosti prolaze kroz postojeći `authMiddleware`. |
| **Šta je tim odbacio** | Prvobitne sirove opise testova koji su bili previše tehnički i nečitljivi za konačni izvještaj, te generičke fallback poruke koje nisu prepoznavale specifične tabele i akcije. |
| **Rizici, problemi ili greške** | *Kontekstualno usklađivanje:* Najveći izazov je bio osigurati da testni framework (Vitest) ispravno komunicira sa realnom testnom bazom u Dockeru bez ometanja globalnih seed podataka. Problem je riješen uvođenjem ciljanog čišćenja samo `AuditLog` tabele, što su alati uspješno predložili. |
| **Ko je koristio alat** | Amina Alispahić |

# AI Usage Log - Mendazment panel: pregled zauzetosti sala sakrivanje recenzija prikazivanje otkazanih, zakazanih i slobodnih termina i pisanje unit i integracionih testova

| Stavka | Opis |
| :--- | :--- |
| **Datum** | 01.06.2026. |
| **Sprint broj** | Sprint 10 |
| **Alat koji je korišten** | Claude (Anthropic) |
| **Svrha korištenja** | Podrška u razvoju backend kontrolera, pisanju testova i integraciji u frontend |
| **Kratak opis zadatka ili upita** | Implementacija četiri funkcije u `vlasnikController.ts`: `getTerminiDetalji`, `getSaleOccupancy`, `sakrijiRecenziju` i `getRecenzije`, te pisanje unit i integracionih testova |
| **Šta je AI predložio ili generisao** | Logiku filtriranja termina po statusu (SLOBODAN, OTKAZAN, ZAKAZAN/POTVRDJEN), konverziju UTC vremena u lokalno (+2h), deduplikaciju rezervacija putem `Map` strukture u `getSaleOccupancy`, validaciju u `sakrijiRecenziju` (404/400 provjere), paginacijsku logiku u `getRecenzije` |
| **Šta je tim prihvatio** | Cjelokupna logika svih četiri kontrolerskih funkcija, struktura Prisma upita sa `select`/`where`/`orderBy`, deduplikacija rezervacija u `getSaleOccupancy`, logika određivanja `stvarniStatus` u `getTerminiDetalji` |
| **Šta je tim izmijenio** | Testovi su samostalno napisani (unit i integracioni), frontend integracija je urađena samostalno; prilagođeni su nazivi polja i struktura odgovora prema potrebama UI-a |
| **Šta je tim odbacio** | — |
| **Rizici, problemi ili greške** | Timezone offset (+2h) je hardkodiran kao konstanta (`+ 120` minuta) umjesto dinamičke detekcije — potrebno pratiti pri prelasku na zimsko/ljetno računanje vremena |
| **Ko je koristio alat** | Amina Alispahić |
