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


