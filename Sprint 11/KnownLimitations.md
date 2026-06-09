# Poznata ograničenja i nedostaci sistema

**Projekat:** Bolnički informacioni sistem (SwiftMed / HealthBook)  
**Datum:** 09.06.2026.  
**Verzija dokumenta:** 1.0

---

## 1. Poznati bugovi

Trenutno nema evidentiranih poznatih bugova.

---

## 2. Tehnička ograničenja

### 2.1 Chat rate limiter je in-memory
- **Lokacija:** [rateLimitChat.ts](file:///c:/Users/DT%20User/Desktop/si/SIGrupa1/PROJEKAT/bolnicki-sistem/server/src/middleware/rateLimitChat.ts)
- **Opis:** Rate limiter za chat koristi in-memory `Map`, ne Redis. Limit od **2 poruke po satu** po korisniku se resetuje pri svakom restartu servera.
- **Uticaj:** Nizak do srednji — korisnik može zaobići limit restartom ili pri deploy-u nove verzije.

### 2.2 Gemini AI rate limiting (free tier)
- **Lokacija:** [chatService.ts](file:///c:/Users/DT%20User/Desktop/si/SIGrupa1/PROJEKAT/bolnicki-sistem/server/src/services/chatService.ts#L146-L166)
- **Opis:** Chatbot koristi Google Gemini API na **free tier-u** koji je ograničen na 2 zahtjeva po minutu. Implementiran je globalni semafor koji čeka 35 sekundi između zahtjeva. Ako više korisnika simultano koristi chat, svaki naredni zahtjev čeka u redu.
- **Uticaj:** Visok za korisničko iskustvo — chat može imati latenciju od 35+ sekundi po poruci u višekorisničkom scenariju.

### 2.3 Startup migracija koristi raw SQL
- **Lokacija:** [index.ts](file:///c:/Users/DT%20User/Desktop/si/SIGrupa1/PROJEKAT/bolnicki-sistem/server/src/index.ts#L29-L57)
- **Opis:** Tabela `RasporedOsoblja` se kreira putem raw SQL-a pri pokretanju servera, zaobilazeći Prisma migracije. Ovo može dovesti do nekonzistentnosti između Prisma sheme i stvarnog stanja baze.
- **Uticaj:** Srednji — funkcionira ali otežava upravljanje migracijama.

### 2.4 PDF upload izvan transakcije
- **Lokacija:** [reservationController.ts](file:///c:/Users/DT%20User/Desktop/si/SIGrupa1/PROJEKAT/bolnicki-sistem/server/src/controllers/reservationController.ts#L230-L301)
- **Opis:** Nalaz (PDF) se kreira **van Prisma transakcije** jer je upload PDF-a premašivao dužinu transakcije. Ako transakcija za kreiranje rezervacije padne, nalaz se briše ručno. Ovo nije atomično i može ostaviti siroče PDF zapise u bazi u slučaju greške.
- **Uticaj:** Nizak — ručni cleanup postoji ali nije 100% pouzdan.

### 2.5 Socket.io emisija bez autentifikacije
- **Lokacija:** [app.ts](file:///c:/Users/DT%20User/Desktop/si/SIGrupa1/PROJEKAT/bolnicki-sistem/server/src/app.ts#L75-L85)
- **Opis:** Socket.io server ne implementira autentifikaciju prilikom povezivanja klijenata. Svaki klijent se može spojiti i slušati sve emitovane događaje (npr. `termin-azuriran`, `waitlist-ponuda`).
- **Uticaj:** Srednji — svaki klijent vidi sve real-time ažuriranja za sve doktore/pacijente.

---

## 3. Sigurnosna ograničenja

### 3.1 JWT_SECRET koristi non-null assertion
- **Lokacija:** [authMiddleware.ts](file:///c:/Users/DT%20User/Desktop/si/SIGrupa1/PROJEKAT/bolnicki-sistem/server/src/middleware/authMiddleware.ts#L15)
- **Opis:** `process.env.JWT_SECRET!` koristi TypeScript non-null assertion. Ako `JWT_SECRET` nije postavljen u `.env`, server će pasti sa runtime greškom tek pri prvom pokušaju autentifikacije, ne pri pokretanju.
- **Uticaj:** Nizak — samo ako se zaboravi konfiguracija na novom environment-u.

### 3.2 CORS je konfigurisan za specifične origine
- **Lokacija:** [app.ts](file:///c:/Users/DT%20User/Desktop/si/SIGrupa1/PROJEKAT/bolnicki-sistem/server/src/app.ts#L36-L42)
- **Opis:** CORS dozvoljava samo `https://bolnicki-sistem-rezervacija.onrender.com` i `http://localhost:5173`. Ovo je sigurnosno korektno, ali znači da se API ne može koristiti sa drugih domena bez izmjene konfiguracije.

### 3.3 Test middleware u produkciji
- **Lokacija:** [app.ts](file:///c:/Users/DT%20User/Desktop/si/SIGrupa1/PROJEKAT/bolnicki-sistem/server/src/app.ts#L47-L58)
- **Opis:** Postoji middleware koji u test okruženju (`NODE_ENV === "test"`) dozvoljava postavljanje korisnika putem `x-test-korisnik-id` header-a bez autentifikacije. Ovo je zaštićeno provjerom `NODE_ENV`, tako da u produkciji neće biti aktivan.
- **Uticaj:** Nizak — zaštićen environment provjerom, ali postoji rizik ako se `NODE_ENV` pogrešno konfigurira.

### 3.4 Gemini API ključ u URL-u
- **Lokacija:** [chatService.ts](file:///c:/Users/DT%20User/Desktop/si/SIGrupa1/PROJEKAT/bolnicki-sistem/server/src/services/chatService.ts#L188)
- **Opis:** API ključ za Gemini se prosljeđuje kao query parametar u URL-u (`?key=${apiKey}`). Ovo je standardni pristup za Gemini API, ali znači da se ključ pojavljuje u server logovima ako se URL zahtjevi loguju.
- **Uticaj:** Nizak — ključ nije izložen klijentu jer se poziv vrši sa serverske strane.

### 3.5 Nema rate limiting-a na većini API ruta
- **Opis:** Rate limiting je implementiran samo za chat rutu. Ostale rute (prijava, registracija, reset lozinke, rezervacija) nemaju rate limiting na nivou API-ja. Zaštita od brute-force napada postoji na nivou korisničkog naloga (zaključavanje nakon 5 neuspjelih pokušaja), ali ne na nivou IP adrese za ostale rute.
- **Uticaj:** Srednji — teoretski omogućava DoS napade ili masovno slanje zahtjeva.

### 3.6 Anonimizacija podataka čuva medicinske zapise
- **Lokacija:** [deactivationService.ts](file:///c:/Users/DT%20User/Desktop/si/SIGrupa1/PROJEKAT/bolnicki-sistem/server/src/services/deactivationService.ts#L265-L391)
- **Opis:** Kada se korisnik deaktivira, lični podaci (ime, prezime, email, JMBG, broj knjižice) se anonimiziraju, ali medicinski zapisi (historija pregleda, recepti, dijagnoze) ostaju u bazi s vezom na anonimizirani profil. Ovo je **svjesna odluka** radi zakonske obaveze čuvanja medicinskih podataka.

---

## 4. Nedovršene funkcionalnosti

### 4.1 In-app notifikacije za listu čekanja
- **Opis:** Socket.io događaj `waitlist-ponuda` se emituje sa servera, ali **klijentska strana nema implementiran listener** koji bi prikazao in-app notifikaciju korisniku. Korisnik zavisi isključivo od email notifikacije.
- **Status:** Djelimično implementirano — server šalje, ali klijent ne sluša.

### 4.2 SMS podsjetnici za hronične bolesnike
- **Opis:** SMS servis (`smsService.ts`) je implementiran i integrisan u reminder job, ali **zahtijeva aktivan Infobip nalog** s ključem i base URL-om. Trenutno nije testiran u produkciji.
- **Status:** Implementirano ali nevalidano u produkciji.

### 4.3 Chatbot — `Chatbot` komponenta je van `Router`-a
- **Lokacija:** [App.tsx](file:///c:/Users/DT%20User/Desktop/si/SIGrupa1/PROJEKAT/bolnicki-sistem/client/src/App.tsx#L200-L209)
- **Opis:** `<Chatbot />` komponenta je renderovana izvan `<Router>` konteksta. Chatbot se prikazuje na svim stranicama, uključujući login i registraciju, što može biti nepoželjna funkcionalnost za neprijavljene korisnike.
- **Status:** Funkcionira, ali pristup za neprijavljene korisnike može biti ograničen samo na serverskoj strani.

---

## 5. Pretpostavke koje sistem pravi

### 5.1 Pretpostavka o formatu JMBG-a
- **Lokacija:** [authService.ts](file:///c:/Users/DT%20User/Desktop/si/SIGrupa1/PROJEKAT/bolnicki-sistem/server/src/authService.ts#L111-L138)
- **Opis:** Validacija JMBG-a pretpostavlja:
  - JMBG ima tačno 13 cifara.
  - Prve 7 cifara kodiraju datum rođenja (DD-MM-GGG).
  - Godina se interpretira kao `2000 + GGG` ako je `GGG <= 99`, inače `1000 + GGG`.
  - Datum rođenja iz JMBG-a mora odgovarati unesenom datumu rođenja.
- **Napomena:** Sistem ne provjerava regionalni dio (cifre 7-9) niti kontrolnu cifru (13. cifra) JMBG-a.

### 5.2 Pretpostavka o jednoinstrancionalnom deployment-u
- **Opis:** Sistem pretpostavlja da postoji samo **jedna instanca servera**. In-memory lock/Redis fallback, rate limiter za chat, te Gemini queue sve zavise od single-process modela. Horizontalno skaliranje (više instanci) bez vanjskog Redis-a dovelo bi do nekonzistentnog stanja.

### 5.3 Pretpostavka o UTC vremenskoj zoni
- **Opis:** Svi datumi i vremena se čuvaju i procesiraju u UTC-u. Klijent je odgovoran za konverziju u lokalnu vremensku zonu korisnika. Termini koriste `vrijeme` polje koje predstavlja **minute od ponoći** (npr. 540 = 09:00).

### 5.4 Pretpostavka o jednom doktoru po pacijentu po danu
- **Opis:** Sistem sprječava duplu rezervaciju kod **istog doktora istog dana**, ali dozvoljava rezervaciju kod **različitih doktora u isto vrijeme**. Provjera preklapanja (linija 158-174 u `reservationController.ts`) provjerava samo isti datum **i** isto vrijeme, ne vremenski opseg pregleda.

### 5.5 Pretpostavka o dostupnosti PostgreSQL-a
- **Opis:** Sistem pretpostavlja da je PostgreSQL baza dostupna pri pokretanju. Error handler u `app.ts` hvata Prisma greške `P1001` (baza nedostupna) i `P2022` (šema neusklađena), ali ovo je samo za graceful error poruke — sistem ne pokušava reconnect.

### 5.6 Pretpostavka o bosansko/hrvatskom/srpskom jeziku
- **Opis:** Svi korisnički interfejsi, API odgovori, email šabloni i chatbot su na bosanskom/hrvatskom/srpskom jeziku. Sistem ne podržava internacionalizaciju (i18n) niti promjenu jezika.

### 5.7 Pretpostavka o formatu broja telefona
- **Lokacija:** [authService.ts](file:///c:/Users/DT%20User/Desktop/si/SIGrupa1/PROJEKAT/bolnicki-sistem/server/src/authService.ts#L336-L339)
- **Opis:** Validacija broja telefona prihvata samo formate koji počinju sa `+387` ili `0`, praćeni 8-9 cifara. Ovo ograničava registraciju na korisnike sa brojevima iz Bosne i Hercegovine.

---

## 6. Dijelovi sistema koje ne treba predstavljati kao potpuno završene

### 6.1 Chatbot (AI asistent)
- **Status:** Funkcionalan ali **ograničen**.
- **Razlog:**
  - Koristi Gemini free tier sa ograničenjem od 2 req/min i obaveznim čekanjem od 35s između zahtjeva.
  - Chat rate limiter dozvoljava samo 2 poruke po satu po korisniku.
  - Chatbot je van `<Router>` konteksta i prikazuje se i za neprijavljene korisnike.
  - Nema perzistenciju chat historije — historija postoji samo u sesiji (klijent).

### 6.2 Lista čekanja (Waitlist)
- **Status:** Implementirana sa kompleksnom logikom, ali ima **edge case** osjetljivosti.
- **Razlog:**
  - Koristi `setTimeout` za automatski timeout ponude, što ne preživljava restart servera.
  - WAITLIST_TTL je konfigurisan na 120 sekundi (2 minute) umjesto zahtijevanih 30 minuta putem environment varijable.
  - In-app notifikacije za waitlist ponude nisu implementirane na klijentskoj strani.
  - Sistem koristi rekurzivnu logiku (`obradiOtkazivanje` poziva samu sebe) što može dovesti do dugačkih lanaca izvršavanja u edge slučajevima.

### 6.3 Real-time notifikacije (Socket.io)
- **Status:** Djelimično implementiran.
- **Razlog:**
  - Server emituje događaje (`termin-azuriran`, `waitlist-ponuda`), ali **nema autentifikaciju** na socket konekciji.
  - Emitovanje je uglavnom putem `io.emit()` (broadcast svima), umjesto ciljano pojedinim korisnicima/sobama.
  - Klijentska integracija sa socket događajima je ograničena.

### 6.4 Sistem za podsjetnik hroničnih bolesnika
- **Status:** Funkcionalan za demonstraciju, ali sa **testnim konfiguracijama**.
- **Razlog:**
  - Koristi intervale za testiranje (svaka minuta / 10 minuta) umjesto produkcijskih (dnevno / 7 dana).
  - Email se šalje na hardkodiranu adresu umjesto na email pacijenta.
  - SMS zavisi od nevalidiranog Infobip naloga.
  - Kreirana je zasebna PrismaClient instanca u `reminderJob.ts` umjesto korištenja zajedničke iz `lib/prisma.ts`.

### 6.5 Email sistem
- **Status:** Sve email funkcije rade ali sa **ograničenjima free tier-a**.
- **Razlog:**
  - Svi emailovi se šalju na jednu hardkodiranu adresu (`musicsumeja98@gmail.com`), ne na stvarne korisnike.
  - Sender domena je `onboarding@resend.dev` (Resend default), ne custom domena klinike.
  - Mock implementacija postoji za dummy API ključ (`re_123456789`).

### 6.6 Zaključavanje termina (Redis lock)
- **Status:** Implementirano ali sa **ograničenjima**.
- **Razlog:**
  - Lock traje fiksno 2 minute.
  - Ako korisnik napusti stranicu bez završetka rezervacije, termin ostaje zaključan 2 minute.
  - U in-memory fallback modu, lock se gubi pri restartu servera, što može dovesti do duplikata.

### 6.7 Vlasnik (VLASNIK) uloga
- **Status:** Registrovana u ruter-u i enum-u, ali funkcionalnost je uglavnom **identična administratoru**.
- **Razlog:**
  - Vlasnik koristi isti panel kao administrator (`/admin` ili `/menadzment`).
  - Specifične vlasničke funkcionalnosti (npr. finansijski izvještaji, strateško upravljanje) nisu implementirane.

### 6.8 Laboratorija stranica
- **Lokacija:** [Laboratorija.tsx](file:///c:/Users/DT%20User/Desktop/si/SIGrupa1/PROJEKAT/bolnicki-sistem/client/src/klase/Laboratorija.tsx)
- **Status:** Datoteka postoji (3 KB) ali **nije integrisana u ruting** — nema rutu u `App.tsx` koja vodi na ovu komponentu.

---

> **Napomena:** Ovaj dokument je kreiran analizom izvornog koda sistema. Sva navedena ograničenja su dokumentovana u svrhu transparentnosti i ne umanjuju nužno kvalitet implementiranih funkcionalnosti. Sistem je funkcionalan za demonstraciju i koristi se u kontekstu projektnog zadatka.
