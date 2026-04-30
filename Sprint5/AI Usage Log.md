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
