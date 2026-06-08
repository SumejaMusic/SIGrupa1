# Release Notes
---

## 1. O ovoj verziji

Ovo su Release Notes za finalnu verziju SwiftMed sistema — bolničke web aplikacije za upravljanje medicinskim terminima i rezervacijama. Dokument opisuje što je stvarno isporučeno u finalnoj verziji, što je djelimično implementirano, što je planirano ali nije završeno, te poznata ograničenja i bugove.

Razvoj je trajao kroz Sprintove 5–12, podijeljeno u 5 releasea. Redosljed izvođenja releasea promijenjen je tokom razvoja: **R4 (Autentikacija i sigurnost) pomjeren je na Sprint 7**, ispred prvobitno planiranih R2 i R3, zbog zavisnosti cijelog sistema o autentifikaciji korisnika.

---

## 2. Što je uključeno u finalnu verziju

### 2.1 Potpuno završene funkcionalnosti

#### Rezervacija termina — R1 (Sprint 5–6)
- Pregled dostupnih doktora i slobodnih termina
- Multi-step tok rezervacije (odabir odjela → doktora → tipa pregleda → termina → potvrda)
- Zaštita od duplih rezervacija i kolizije termina (ACID transakcije)
- Automatsko oslobađanje nepotvrđenih termina
- Otkazivanje termina od strane pacijenta i medicinskog osoblja
- Komentari uz termin (vidljivi doktoru i pacijentu)
- Rezervacija kod specijaliste u ime pacijenta (od strane doktora opšte prakse)
- Lista čekanja (waitlist) s prioritetima — HITAN, HRONICNI_BOLESNIK, NORMALAN
- Email potvrda pri kreiranju rezervacije
- Email obavijest pri otkazivanju termina

#### Autentikacija i sigurnosni sloj — R4 (Sprint 7)
- Prijava korisnika s JWT tokenima (TTL 8 sati), preusmjeravanje prema ulozi
- Reset lozinke putem emaila (Resend servis, link validan 15 minuta)
- Automatska odjava nakon 15 minuta neaktivnosti uz upozorenje 2 minute unaprijed
- Dvofaktorska autentikacija (2FA) putem emaila — opcionalna za pacijente
- Blokiranje naloga nakon 5 neuspješnih pokušaja prijave uz email notifikaciju
- AES-256 enkripcija za JMBG i broj zdravstvene knjižice
- bcrypt hashiranje lozinki (salt rounds = 12)
- RBAC konfigurisan za četiri uloge: PACIJENT, DOKTOR, MEDICINSKO_OSOBLJE, ADMINISTRATOR
- Audit log svih CRUD akcija i neuspješnih prijava (s IP adresom i timestampom)

#### Paneli korisnika — R3 (Sprint 8)
- Doktorski dashboard — dnevni i sedmični pregled rasporeda
- Pregled komentara uz termine od strane doktora
- Panel medicinskog osoblja — dnevni termini, kreiranje termina, pretraga pacijenta
- Označavanje hitnosti termina ("HITNO") — vidljivo samo internom osoblju
- Role-based routing — automatsko preusmjeravanje na odgovarajući panel po prijavi

#### Admin panel — R2/Sprint 9–10
- Upravljanje korisnicima i ulogama (CRUD)
- Upravljanje radnim vremenom i rasporedima doktora
- Upravljanje izuzecima rasporeda (bolovanje, konferencija, godišnji odmor)
- Pregled i upravljanje zahtjevima za deaktivaciju naloga (GDPR modul)
- Audit log pregled u admin panelu s filterima

---

### 2.2 Djelimično završene funkcionalnosti

#### Medicinska historija pacijenta (PB-4)

**Završeno:**
- Historija pregleda — dijagnoza, terapija, bilješke, recepti
- Upload i preuzimanje PDF nalaza (do 5MB, enkriptovano)
- Prošireni medicinski profil pacijenta — krvna grupa, alergije, hronične bolesti, donacija krvi, prethodne operacije (implementirano u Sprint 10)

**Nije završeno:**
- Daljnja proširenja medicinskog profila ostavljena kao buduće proširenje

#### Notifikacije (PB-7)

**Završeno:**
- Email potvrda pri kreiranju rezervacije
- Email obavijest pri otkazivanju
- Email obavijest o promjenama rasporeda doktora (izuzeci)
- Email i in-app obavijest o otkazanom/pomjerenom terminu (s akcijama "Prihvati"/"Odbij")
- Email obavijest o slobodnom terminu s waitliste
- Poziv za anonimnu ocjenu nakon završenog pregleda
- Email obavijesti vezane za deaktivaciju naloga (potvrda zahtjeva, odluka admina)
- Podsjetnici za nadolazeće termine (node-cron scheduled job)
- SMS podsjetnik za hronične bolesnike (Twilio integracija, Sprint 9)

**Nije završeno:**
- US-31 — automatski podsjetnik specifično vezan za hronične bolesnike prema originalnoj specifikaciji iz R1; implementiran kao US-31-EXT u Sprint 9 ali u izmijenjenom obliku (Infobip → Twilio)

#### Panel doktora (PB-10)

**Završeno:**
- Dashboard s dnevnim i sedmičnim rasporedom, naprednim filtriranjem (Sprint 9)
- Pregled komentara uz termine
- Historija pregleda i unos dijagnoza, terapija, recepata
- Upravljanje rasporedima i izuzecima
- Rezervacija kod specijaliste u ime pacijenta

**Nije završeno:**
- Upit doktora za promjenu dužine termina (US-15) — planiran u R1, nije završen

#### Korisničko iskustvo (PB-12)

**Završeno:**
- AI chatbot asistent (Socket.io + LLM API integracija, rate limiting)

**Nije završeno:**
- Interaktivni vodič za nove korisnike (US-23)
- Korisnička dokumentacija unutar aplikacije

---

## 3. Što nije dio finalne isporuke

| Stavka | Planirano u | Razlog neisporuke |
|---|---|---|
| **Interaktivni vodič za korisnike (US-23)** | R3 | Niži prioritet, ostavljen za budući rad |
| **Upit doktora za promjenu dužine termina (US-15)** | R1 | Planiran u R1, nije implementiran ni u kasnijim sprintovima |
| **Uptime monitoring — UptimeRobot** | R5 | Planirano ali nije potvrđeno kao konfigurisano |

---

## 4. Poznata ograničenja

#### Email sistem — fiksna TO adresa
Resend API je konfigurisan s jednom fiksnom `TO_EMAIL` adresom (`musicsumeja98@gmail.com`). Svi emailovi iz sistema (potvrde rezervacija, verifikacioni kodovi, reset lozinke, notifikacije) idu na tu jednu adresu, **a ne na stvarne email adrese korisnika**. Ovo je ograničenje Resend free tier plana koji zahtijeva verifikovanu domenu za slanje na proizvoljne adrese.

#### Render free tier — "sleep" servisa
Backend je deployovan na Render free tier (`https://sigrupa1.onrender.com`). Servis se **"gasi" nakon 15 minuta neaktivnosti**, a prvi zahtjev nakon toga može trajati 30–60 sekundi dok se servis ponovo pokrene.

#### VLASNIK uloga
Tokom razvoja dodata je peta korisnička uloga **VLASNIK**, koja nije bila u originalnom planu (koji je predviđao četiri uloge). Ova uloga ima pristup analitičkim i statističkim endpointima (`/api/vlasnik`). Sva dokumentacija koja navodi četiri uloge je u tom dijelu zastarjela.

#### GDPR usklađenost
GDPR modul (ZahtjevDeaktivacije) je implementiran — pacijent može podnijeti zahtjev, admin ga odobrava ili odbija, te se šalju email obavijesti. Međutim, **potpuna GDPR usklađenost (anonimizacija u roku 30 dana, NFR-30) nije formalno validirana**.

---

## 5. Poznati bugovi

- **Email na fiksnu adresu** — sve notifikacije idu na jednu adresu umjesto na stvarnog korisnika (opisano u ograničenjima)
- **Render cold start** — prvi zahtjev nakon perioda neaktivnosti može biti spor (30–60s)
- **Startup migracije** — `index.ts` pokušava ručno kreirati `RasporedOsoblja` tablicu pri svakom pokretanju; u slučaju promjene Prisma scheme može uzrokovati konflikte
- **Socket.io na Render free tier** — WebSocket konekcije mogu biti nestabilne zbog timeout ograničenja besplatnog plana

---

## 6. Sažetak statusa po Product Backlog stavkama

| ID | Naziv | Planirani release | Finalni status |
|---|---|---|---|
| PB-1 | Upravljanje terminima | R1 | Done |
| PB-2 | Rezervacija termina | R1 | Done |
| PB-3 | Admin panel | R2 | Done |
| PB-4 | Medicinska historija pacijenta | R3 | Partially Done |
| PB-5 | Autentikacija i upravljanje sesijom | R4 | Done |
| PB-6 | Sigurnost i zaštita sistema | R4 | Done |
| PB-7 | Notifikacije | R1, R3 | Partially Done |
| PB-8 | Infrastruktura baze podataka | R0 | Done |
| PB-9 | Menadžment panel i izvještaji | R2 |  Done |
| PB-10 | Panel doktora | R3 | Partially Done |
| PB-11 | Panel medicinskog osoblja | R3 | Partially Done |
| PB-12 | Korisničko iskustvo | R3 | Partially Done |

---

## 7. Napomena o odstupanju od Initial Release Plana

Initial Release Plan predviđao je sigumost (R4) kao posljednji funkcionalni release (Sprint 10), a panele korisnika (R3) u Sprintovima 8–9. U stvarnom razvoju:

- **Sprint 7** — R4 (Autentikacija i sigurnost) pomjeren naprijed zbog zavisnosti sistema o autentifikaciji
- **Sprint 8** — R3 paneli (doktor, medicinsko osoblje, role-based routing)
- **Sprint 9** — Proširenja panela, chatbot, waitlist, SMS, recenzije
- **Sprint 10** — Admin panel, menadžment panel, statistike, CSV export, GDPR, PDF uputnica

Ova reorganizacija je bila svjesna odluka tima (DL-10-01, DL-10-02) i nije negativno utjecala na isporuku ključnih funkcionalnosti.

---
