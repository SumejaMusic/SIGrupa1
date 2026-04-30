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
| **Ko je koristio alat** | Hamza Husović |

