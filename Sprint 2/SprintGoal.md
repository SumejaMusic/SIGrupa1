# Sprint Goal – Sprint 2

## Sprint broj
Sprint 2

---

## Sprint cilj

Izgraditi sigurnu osnovu sistema kroz implementaciju autentifikacije, zaštite podataka i admin infrastrukture, kako bi korisnici mogli bezbjedno pristupiti sistemu, a administratori upravljati korisnicima i terminima.

---

## Ključne stavke koje tim želi završiti

- Funkcionalan login sistem sa zaštitom od zloupotrebe (blokada naloga, 2FA)
- Enkripcija osjetljivih podataka i sigurno čuvanje lozinki
- Kreiranje baze podataka sa definisanim pravima pristupa po ulogama (RBAC)
- Admin panel sa pregledom korisnika, termina i statistika
- Historija pregleda dostupna pacijentu
- Automatski podsjetnici za hronične bolesnike i označavanje hitnih termina

---

## Rizici i zavisnosti

- Login sistem mora biti završen prije implementacije 2FA i blokade naloga
- Baza podataka je preduvjet za sve ostale stavke u sprintu
- Nedostupnost email servisa (SMTP) blokira 2FA, podsjetnike i obavijesti o blokadi naloga
- Nedefinirane korisničke uloge mogu usporiti razvoj admin panela i kontrole pristupa