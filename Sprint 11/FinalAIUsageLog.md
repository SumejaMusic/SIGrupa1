# Final AI Usage Log

## 1. Uvod

Tokom razvoja Healthbook sistema korišteni su AI alati **Claude**, **ChatGPT**, **OpenAI Codex**, **Gemini**, **Google Antigravity** i **Perplexity AI**.

AI alati nisu korišteni kao zamjena za rad članova tima, već kao podrška pri planiranju, implementaciji, testiranju, deploymentu, sigurnosnoj analizi i dokumentovanju tehničkih odluka.

Svaki značajniji prijedlog generisan pomoću AI alata dodatno je analiziran, prilagođen postojećoj arhitekturi, Prisma shemi, REST API rutama, sigurnosnim pravilima, ulogama korisnika i zahtjevima sprintova. Tim nije automatski prihvatao generisana rješenja, već je procjenjivao njihovu ispravnost, složenost, sigurnost i usklađenost sa stvarnim stanjem projekta.

Detaljni pojedinačni zapisi o korištenju AI alata nalaze se u fajlu `AIUsageLog.md`.

---

## 2. Korišteni AI alati

| AI alat | Način korištenja |
|---|---|
| **Claude / Claude Code** | Generisanje backend i frontend rješenja, refaktorisanje, dijagnostika grešaka, testovi, deployment analiza, sigurnosne funkcionalnosti i dokumentacija |
| **ChatGPT** | Planiranje UI tokova, analiza bugova, pomoć pri povezivanju frontenda i backenda, objašnjenje arhitekture i prijedlozi ispravki |
| **OpenAI Codex / Codex 5.5** | Analiza postojećeg koda, implementacija bugfixeva, sigurnosne funkcionalnosti, provjera migracija, testova i NFR zahtjeva |
| **Gemini** | Pomoć pri testiranju, generisanju testnih scenarija, implementaciji SMS podsjetnika, audit log testova i analizi API ograničenja |
| **Google Antigravity** | Pomoć pri implementaciji resetovanja lozinke, validacije, email tokova i sigurnosnih mehanizama |
| **Perplexity AI** | Pomoć pri uvođenju JWT autentifikacije i zamjeni privremenih test funkcija stvarnim login tokom |

---

## 3. Za šta je AI korišten

AI alati korišteni su u više faza razvoja sistema.

### 3.1. Rezervacijski sistem i osnovna backend infrastruktura

AI je korišten za:

- analizu domenskog modela i identifikaciju nedostataka u entitetima;
- generisanje ruta, kontrolera i servisne logike za termine, doktore i rezervacije;
- implementaciju pravila za rezervaciju, otkazivanje i zaštitu od duplih rezervacija;
- korištenje Redis lock mehanizma za privremeno zaključavanje termina;
- seed podatke za lokalno testiranje;
- pomoć pri rješavanju TypeScript, Prisma, Node.js i ESM konfiguracionih problema.

Tim je prihvatio osnovnu strukturu ruta i kontrolera, ali je ručno prilagodio nazive fajlova, API prefikse, Prisma tipove i import putanje prema stvarnoj strukturi projekta.

### 3.2. Frontend za rezervacije i korisničke tokove

AI je korišten pri implementaciji:

- forme za rezervaciju termina;
- prikaza postojećih rezervacija korisnika;
- funkcionalnosti otkazivanja termina uz pravilo 24 sata;
- filtriranja doktora po odjelu;
- višekoračnih tokova rezervacije;
- prikaza i uređivanja korisničkog profila.

Tim je zadržao osnovnu UI strukturu, ali je uklonio nepotrebna polja, prilagodio forme sprint zahtjevima i uskladio frontend pozive sa stvarnim backend rutama.

### 3.3. Povezivanje frontenda i backenda te deployment

AI je korišten za dijagnostiku problema koji su se pojavljivali na Render deploymentu:

- prazni dropdown meniji zbog pogrešnih API putanja;
- CORS greške;
- 404 odgovori;
- oslanjanje na lokalni Vite proxy;
- konfiguracija `VITE_API_URL`;
- SPA redirect konfiguracija;
- Redis/Key Value URL podešavanja;
- build konfiguracija za Vite i TypeScript.

Prihvaćen je centralizovani API pristup preko konfigurabilnog backend URL-a, dok su odbačena rješenja koja su bila vezana samo za lokalno razvojno okruženje.

### 3.4. Medicinski nalazi, PDF dokumenti i email obavijesti

AI je korišten za:

- backend kontrolere za dohvat nalaza po pacijentu i rezervaciji;
- dohvat PDF nalaza iz baze ili storage sistema;
- ispravno slanje PDF sadržaja kroz HTTP response;
- frontend prikaz i otvaranje PDF dokumenata;
- email potvrde rezervacija;
- migraciju sa Nodemailer/Gmail SMTP pristupa na Resend API zbog ograničenja Render free plana;
- generisanje PDF uputnice specijalistu.

Tim je posebno prilagođavao sigurnosne detalje, format datuma, storage pristup i način otvaranja PDF-a tako da se zadrži `Authorization` header i izbjegne neovlašten pristup.

### 3.5. Autentifikacija, autorizacija i sigurnost

AI je korišten za implementaciju i provjeru:

- JWT login toka;
- `authMiddleware` provjere;
- prosljeđivanja tokena kroz `Authorization: Bearer` header;
- automatske odjave nakon neaktivnosti;
- WebSocket sinhronizacije logout događaja;
- RBAC sistema za uloge `ADMINISTRATOR`, `PACIJENT`, `DOKTOR`, `MEDICINSKO_OSOBLJE` i `VLASNIK`;
- zaštite ruta na backendu i frontendu;
- detekcije neobičnog ponašanja pri loginu;
- zaključavanja naloga nakon više neuspješnih pokušaja;
- resetovanja lozinke sigurnim tokenom;
- audit log zapisa za sigurnosno važne događaje;
- enkripcije osjetljivih medicinskih podataka.

Tim je prihvatio veći dio sigurnosne arhitekture, ali je dodatno uskladio nazive polja, poruke, migracije i kontrolerske provjere sa postojećim sistemom.

### 3.6. Testiranje i kvalitet koda

AI je korišten za:

- generisanje unit i integracionih testova;
- refaktorisanje postojećih Vitest i Supertest testova;
- mock konfiguraciju za Prisma i Redis;
- generisanje JWT tokena za testiranje različitih uloga;
- ispravku testova nakon promjena u migracijama;
- dinamički dohvat ID vrijednosti iz testne baze;
- pisanje testova za audit log, deaktivaciju naloga, medicinski profil i zauzetost kabineta.

Tim je prihvatio strukturu testova i dio scenarija, ali je često morao prilagođavati mock podatke, assertione, tokene i očekivane response strukture stvarnoj implementaciji.

### 3.7. Panel za medicinsko osoblje i liste čekanja

AI je korišten pri razvoju:

- panela za medicinsko osoblje;
- pretrage i prikaza termina;
- višekoračnog modala za zakazivanje;
- upload-a PDF nalaza;
- kalendarskog prikaza;
- otkazivanja i označavanja hitnih termina;
- liste čekanja za popunjene termine;
- obavještavanja sljedećeg pacijenta kada se termin oslobodi;
- Redis TTL i `setTimeout` mehanizma za istek ponuda.

Tim je odbacio cron job pristup za listu čekanja i prihvatio reaktivni pristup zasnovan na Redis TTL-u i servisnoj logici.

### 3.8. Admin, vlasnik i audit funkcionalnosti

AI je korišten za:

- admin panel za upravljanje korisnicima i ulogama;
- promjenu uloge korisnika uz Prisma transakcije i audit log;
- rasporede doktora i medicinskog osoblja;
- Kanban prikaz rasporeda;
- analitiku rezervacija;
- audit log pregled, filtriranje, paginaciju i formatiranje detalja akcije;
- vlasnički/menadžment panel za zauzetost sala, termine i recenzije;
- deaktivaciju i anonimizaciju korisničkih naloga.

Tim je prihvatio većinu arhitekturnih prijedloga, ali je ručno prilagođavao testne tokene, response strukture, nazive polja i validacije prema postojećem `authMiddleware` i UI potrebama.

### 3.9. AI funkcionalnosti unutar sistema

Pored korištenja AI alata tokom razvoja, u aplikaciju je dodan i Healthbook chatbot.

AI je korišten za:

- arhitekturu chat rute `/api/chat`;
- React chatbot komponente;
- system prompt na bosanskom jeziku;
- integraciju sa Gemini API-jem;
- backend queue za ograničavanje poziva;
- rate limiting za anonimne i prijavljene korisnike;
- mock mode za development;
- UX poruke tokom čekanja na odgovor.

Tim je prihvatio kontrolisani backend pristup i queue mehanizam, ali je odbacio frontend retry pristup jer je nepotrebno povećavao broj zahtjeva i brže trošio Gemini kvotu.

### 3.10. Medicinski profil, hronični bolesnici i SMS podsjetnici

AI je korišten za:

- proširenje medicinskog profila pacijenta;
- dodavanje krvne grupe, alergija, hroničnih bolesti, doniranja krvi i prethodnih operacija;
- prikaz medicinskih podataka doktoru;
- NFR-01 provjeru pristupa;
- označavanje pacijenata kao hroničnih bolesnika;
- automatske SMS podsjetnike putem Infobip servisa;
- zapisivanje podsjetnika u `ReminderLog`.

Tim je prihvatio proširenje postojeće tabele `Pacijent`, a odbacio kreiranje posebne tabele jer za trenutni obim sistema nije bila potrebna dodatna složenost.

---

## 4. Šta je tim prihvatio

Tim je prihvatio AI prijedloge koji su bili usklađeni sa zahtjevima sistema, sigurnosnim pravilima i postojećom arhitekturom.

Najvažniji prihvaćeni prijedlozi su:

- struktura backend ruta i kontrolera za termine, doktore i rezervacije;
- Redis lock za privremeno zaključavanje termina;
- pravilo otkazivanja termina 24 sata prije termina;
- centralizovani `VITE_API_URL` pristup za frontend API pozive;
- CORS i Render deployment konfiguracija;
- `_redirects` fajl za SPA routing;
- backend kontroleri za pacijente, historiju pregleda i nalaze;
- inline prikaz PDF nalaza uz ispravne HTTP headere;
- migracija email servisa na Resend API;
- JWT autentifikacija i `Authorization: Bearer` tok;
- automatska odjava i WebSocket sinhronizacija logout događaja;
- RBAC middleware i zaštita ruta po ulogama;
- zaključavanje naloga nakon 5 neuspješnih pokušaja prijave;
- reset lozinke sigurnim tokenom i hashiranjem;
- audit log evidencija sigurnosnih događaja;
- AES-256-GCM enkripcija osjetljivih medicinskih podataka;
- profil korisnika sa validacijom datuma i telefona;
- panel za medicinsko osoblje;
- Redis TTL pristup za listu čekanja;
- admin panel za korisnike, uloge, rasporede i analitiku;
- audit log pregled sa filtriranjem, paginacijom i formatiranjem detalja;
- chatbot arhitektura sa backend queue mehanizmom;
- mock mode za chatbot u development okruženju;
- zauzetost kabineta i prikaz narednih slobodnih termina;
- status hroničnog bolesnika i SMS podsjetnici;
- PDF uputnica specijalistu;
- anonimizacija i deaktivacija korisničkih naloga;
- proširenje medicinskog profila pacijenta;
- unit i integracioni testovi za ključne module.

---

## 5. Šta je tim izmijenio

Većina AI prijedloga zahtijevala je prilagođavanje stvarnom projektu.

Tim je najčešće mijenjao:

- nazive fajlova, ruta, endpointa i metoda;
- nazive Prisma polja i relacija;
- `String`/`Int` tipove prema stvarnoj shemi baze;
- import putanje zbog ESM okruženja;
- API response strukture;
- testne podatke, ID vrijednosti i mock objekte;
- assertione u unit i integracionim testovima;
- CORS i deployment konfiguraciju za Render;
- način učitavanja API URL-a na frontendu;
- formatiranje datuma i vremena;
- UTC normalizaciju i timezone offset logiku;
- email sadržaj i tekstove poruka na bosanskom jeziku;
- reset password tok radi povezivanja sa otključavanjem naloga;
- validaciju telefonskog broja;
- rate limit vrijednosti za development;
- chatbot prompt i poruke čekanja;
- frontend otvaranje PDF-a kroz `fetch` i blob URL umjesto `window.open`;
- testove nakon uvođenja NFR-01 zaštite;
- `.gitignore` pravila za coverage i cache fajlove;
- migracije i Prisma resolve postupak za Neon bazu.

AI je često davao tehnički koristan početni pravac, ali je tim morao uskladiti rješenja sa postojećim kodom, stvarnom bazom, sprint zahtjevima i sigurnosnim ograničenjima.

---

## 6. Šta je tim odbacio

Tim je odbacio prijedloge koji su bili nepotrebno složeni, nedovoljno sigurni, neprikladni za Render okruženje ili neusklađeni sa postojećom arhitekturom.

| Odbačeni prijedlog | Razlog odbacivanja |
|---|---|
| Dodatna polja u formi za rezervaciju, poput hitnosti i komentara u ranom sprintu | Nisu bila prioritet i komplikovala su UI tok |
| Oslanjanje isključivo na lokalni Vite proxy | Nije radilo na produkcijskom Render deploymentu |
| Nginx proxy konfiguracija | Nepotrebna za Render setup |
| Prebacivanje `@types` paketa u `dependencies` | Zadržane su dobre prakse za produkcijski build |
| Prisma 7 upgrade | Tim je zadržao stabilnu Prisma 5.x verziju |
| `@types/ioredis` paket | Nepotreban jer `ioredis` već sadrži tipove |
| Mock auth middleware kao dugoročno rješenje | Zamijenjen stvarnim JWT tokom |
| Gmail SMTP/Nodemailer na Render free planu | SMTP portovi nisu pouzdano dostupni na Render free planu |
| Prikaz različitih poruka za postojeće i nepostojeće korisnike pri resetu lozinke | Sigurnosni rizik zbog otkrivanja korisničkih naloga |
| Čuvanje reset tokena u bazi bez hashiranja | Nedovoljno sigurno |
| Key rotation u prvoj verziji enkripcije | Odgođeno za kasniju fazu zbog složenosti |
| Automatsko logovanje svake dekripcije | Odbijeno zbog performansnih razloga |
| Klijentska provjera uloga bez serverske verifikacije | Nedovoljno sigurno |
| Automatsko vremensko otključavanje naloga | Reset lozinke je izabran kao kontrolisaniji tok |
| Stari custom header za testnog korisnika | Zamijenjen standardnim JWT tokenima u testovima |
| Direktno mijenjanje `main` grane tokom bugfixa | Tim je zadržao kontrolisan merge tok |
| `window.open()` za PDF nalaze bez `Authorization` headera | Moglo je zaobići autorizaciju |
| Cron job za listu čekanja | Redis TTL i event-driven pristup su efikasniji za ovaj sistem |
| Direktna izmjena emaila u profilu | Promjena emaila zahtijeva poseban verifikacijski tok |
| Redis za chatbot rate limiting u prvoj verziji | PostgreSQL rješenje je bilo dovoljno bez dodatne infrastrukture |
| Migracija chatbota sa Gemini na Anthropic API | Tim je ostao na Gemini free planu |
| Exponential backoff retry na frontendu za chatbot | Trošio je kvotu slanjem više zahtjeva |
| Hardkodirani backend URL-ovi | Zamijenjeni varijablama okruženja |
| Pohrana PDF uputnice kao BLOB u bazi | Odbijeno zbog performansi i zamijenjeno storage pristupom |
| Automatsko slanje PDF uputnice emailom | Odgođeno za kasniju fazu |
| QR kod na uputnici | Zahtijeva dodatnu sigurnosnu analizu |
| Enum za status zahtjeva za deaktivaciju | Procijenjen kao nepotreban za trenutni obim |
| Posebna tabela za medicinski profil | Postojeća tabela `Pacijent` bila je dovoljna |
| Mijenjanje produkcijskog endpointa samo da bi stari testovi prošli | Testovi su prilagođeni stvarnom ponašanju sistema |

---

## 7. Greške, rizici i ograničenja AI prijedloga

AI alati nisu uvijek davali rješenja koja su se mogla direktno koristiti.

Tokom razvoja identifikovani su sljedeći problemi i rizici.

### 7.1. Neusklađenost sa Prisma shemom

AI je povremeno generisao Prisma upite koji nisu odgovarali stvarnoj shemi baze. Primjeri uključuju pogrešne nazive polja, nedostajuća obavezna polja, pogrešne tipove i reference na kolone koje su uklonjene migracijama.

### 7.2. Neusklađenost frontenda i backenda

Postojao je rizik da frontend očekuje drugačiji response shape od onog koji backend stvarno vraća. To je uticalo na dropdown menije, PDF nalaze, rezervacije, komentare i testove koji su morali biti ručno prilagođeni.

### 7.3. Deployment rizici

Lokalno okruženje se razlikovalo od Render deploymenta. Lokalni Vite proxy je sakrivao probleme koji su se u produkciji pojavili kao pogrešne API putanje, CORS greške, 404 odgovori i neispravna Redis/Key Value konfiguracija.

### 7.4. Sigurnosni rizici

Posebna pažnja bila je potrebna kod:

- čuvanja JWT tokena;
- zaštite ruta po ulogama;
- resetovanja lozinke;
- zaključavanja naloga;
- slanja API ključeva;
- enkripcije medicinskih podataka;
- pristupa PDF nalazima;
- sprečavanja pristupa tuđim medicinskim podacima.

AI prijedlozi su morali biti dopunjeni serverskim provjerama vlasništva nad resursima i kontrolom pristupa.

### 7.5. Rizici testiranja

AI-generisani testovi mogli su davati netačne rezultate ako su koristili hardkodirane ID vrijednosti, zastarjele rute, pogrešne tokene ili mock podatke koji nisu odgovarali stvarnoj bazi. Nakon migracija bilo je potrebno ažurirati `seed.ts`, `setupFiles.ts` i integracione testove.

### 7.6. Rizici trećih servisa

Render, Resend, Gemini i Infobip uvodili su dodatna ograničenja:

- Render free plan nije pogodan za Gmail SMTP tok;
- Resend testni domen ograničava slanje bez vlastite domene;
- Gemini free tier ima niske limite zahtjeva;
- Infobip Trial nalog dozvoljava slanje samo na verifikovane brojeve.

Zbog toga su uvedeni fallback i mock modovi za razvoj i demo scenarije.

### 7.7. Rizici vremena, datuma i vremenskih zona

Kod termina, kalendara, SMS podsjetnika, zauzetosti sala i listi čekanja postojali su rizici zbog UTC vremena, lokalnog vremena i hardkodiranog `+2h` offseta. Ove dijelove treba posebno pratiti pri prelasku između ljetnog i zimskog računanja vremena.

### 7.8. Rizici AI chatbota

Kod Healthbook chatbota identifikovani su rizici:

- 429 greške zbog Gemini limita;
- frontend retry koji multiplicira zahtjeve;
- curenje API ključa ako bi se poziv radio sa frontenda;
- nedovoljna dnevna kvota za demo;
- potreba da system prompt bude usklađen sa stvarnim funkcionalnostima aplikacije.

Zbog toga je uveden backend queue, pojednostavljen frontend poziv i `MOCK_CHAT` način rada.

### 7.9. Rizici migracija i podataka

Migracije su zahtijevale posebnu pažnju jer su promjene u tabelama uticale na seed podatke, testove i postojeće zapise. Kod enkripcije je dodatni rizik bio postojanje nešifriranih historijskih zapisa i potreba za sigurnim čuvanjem enkripcijskog ključa.

---

## 8. Dijelovi sistema razvijeni uz AI pomoć koje tim mora posebno znati objasniti

Članovi tima trebaju razumjeti i samostalno objasniti sve dijelove sistema, a posebno module kod kojih su AI alati korišteni za značajniji dio planiranja, implementacije ili testiranja.

| Dio sistema | Šta je potrebno znati objasniti |
|---|---|
| **Rezervacijski sistem** | Rute, kontrolere, Redis lock, sprečavanje duplih rezervacija, pravilo 24h i validaciju termina u prošlosti |
| **Frontend rezervacije** | Formu rezervacije, filtriranje doktora po odjelu, prikaz mojih rezervacija i otkazivanje termina |
| **Deployment i API konfiguracija** | `VITE_API_URL`, CORS, Render Static Site/Backend setup, Redis URL i SPA `_redirects` |
| **Pacijenti i nalazi** | Dohvat pacijenata, historije pregleda, PDF nalaza i autorizovano otvaranje PDF dokumenata |
| **Email obavijesti** | Razlog migracije sa Nodemailer/Gmail SMTP na Resend API i ograničenja testnog domena |
| **JWT autentifikacija** | Login endpoint, token payload, `authMiddleware`, `Authorization` header i frontend čuvanje tokena |
| **RBAC** | Uloge, backend middleware, zaštićene frontend rute i razlika između 401 i 403 odgovora |
| **Automatska odjava** | Neaktivnost, WebSocket sinhronizacija tabova i redirect na login |
| **Reset lozinke i zaključavanje naloga** | Token, hashiranje, rate limiting, audit log, otključavanje naloga kroz reset lozinke |
| **Enkripcija medicinskih podataka** | AES-256-GCM, Prisma middleware, `.env` ključ, migracija postojećih zapisa i rizik gubitka ključa |
| **Testiranje** | Vitest, Supertest, mock Prisma/Redis, JWT tokeni u testovima, dinamički ID lookup i Docker zavisnosti |
| **Panel za medicinsko osoblje** | Kalendar, modal za zakazivanje, upload PDF nalaza, hitni termini i validacija ruta |
| **Lista čekanja** | Redis TTL, `setTimeout` sigurnosni mehanizam, obavještavanje sljedećeg pacijenta i filtriranje korisnika koji je otkazao termin |
| **Profil korisnika** | Uređivanje profila, validacija datuma i telefona, razlog zašto email nije direktno izmjenjiv |
| **Admin panel** | Upravljanje korisnicima, promjena uloga, rasporedi doktora/osoblja, analitika i audit log |
| **Audit log** | Filtriranje, paginacija, parsiranje `stariPodaci`/`noviPodaci` i čitljivo formatiranje akcija |
| **Vlasnički/menadžment panel** | Zauzetost sala, statusi termina, sakrivanje recenzija, paginacija i timezone ograničenja |
| **Healthbook chatbot** | Gemini API, backend queue, rate limiting, system prompt, mock mode i zaštita API ključa |
| **Hronični bolesnici i SMS podsjetnici** | PATCH ruta, `ReminderLog`, Infobip ograničenja i UTC normalizacija datuma |
| **PDF uputnica specijalistu** | Struktura dokumenta, HTML-to-PDF generisanje, storage pristup i razlog odbijanja BLOB pohrane |
| **Deaktivacija i anonimizacija naloga** | Anonimizacija ličnih podataka, admin odobravanje, notifikacije i testovi podatkovnog integriteta |
| **Medicinski profil pacijenta** | Nova polja u `Pacijent` modelu, validacija krvne grupe, prikaz doktoru i NFR-01 zaštita pristupa |

---

## 9. Način transparentnog i kritičkog korištenja AI alata

Tim je AI alate koristio transparentno i kritički:

1. svaki značajniji način korištenja AI alata evidentiran je u `AIUsageLog.md` fajlu;
2. za svaki unos dokumentovani su datum, sprint, alat, svrha, prijedlog AI-a, prihvaćene izmjene, odbačeni dijelovi i rizici;
3. AI prijedlozi nisu automatski kopirani u projekat;
4. generisani kod je pregledan i prilagođen postojećoj arhitekturi;
5. Prisma upiti su provjeravani prema stvarnoj shemi baze;
6. sigurnosne provjere su dodatno validirane kroz backend kontrolere i middleware;
7. frontend i backend su ručno usklađivani nakon AI prijedloga;
8. testovi su prilagođavani stvarnim rutama, tokenima, baznim podacima i response strukturama;
9. kompleksna rješenja su odbacivana kada nisu bila potrebna za obim sprinta;
10. deployment rješenja su validirana u stvarnom Render okruženju;
11. API ključevi i osjetljivi podaci tretirani su kao sigurnosni rizik;
12. odgovornost za konačna tehnička rješenja ostala je na članovima tima.

---

## 10. Zaključak

AI alati su značajno ubrzali istraživanje mogućih pristupa, pisanje početnih verzija koda, dijagnostiku grešaka, pripremu testova i dokumentovanje tehničkih odluka. Posebno su pomogli u modulima za rezervacije, autentifikaciju, RBAC, deployment, medicinske nalaze, admin panel, audit log, liste čekanja, chatbot i sigurnosne funkcionalnosti.

Međutim, konačne odluke nisu donosili AI alati. Tim je zadržao kontrolu nad arhitekturom, sigurnosnim pravilima, poslovnom logikom, strukturom baze, korisničkim interfejsom, deployment konfiguracijom i izborom tehnologija.

Prihvaćena su samo rješenja koja su nakon provjere bila opravdana i usklađena sa zahtjevima projekta. Prijedlozi koji su bili previše generički, nesigurni, nepotrebno složeni ili neusklađeni sa stvarnim stanjem sistema su izmijenjeni ili odbačeni.
