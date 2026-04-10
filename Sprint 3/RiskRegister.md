| ID | Opis rizika | Uzrok | Vjerovatnoća | Uticaj | Prioritet rizika | Plan mitigacije | Odgovorna osoba ili uloga | Status |
|:---|:---|:---|:---|:---:|:---|:---|:---|:---|
| **RR-01** | Nedostupnost sistema | Pad servera ili hosting problem | Srednja | Visok | Visok | Monitoring, backup serveri | DevOps tim | Otvoren |
| **RR-02** | Gubitak podataka | Greška baze ili backup-a | Niska | Visok | Srednji | Redovan backup, test restore | Backend developer | Otvoren |
| **RR-03** | Greške u zakazivanju termina | Bug u logici sistema | Visoka | Srednji | Visok | Unit testovi, QA testiranje | QA tim | Otvoren |
| **RR-04** | Preopterećenje sistema | Veliki broj korisnika | Srednja | Visok | Visok | Skaliranje servera | DevOps tim | Otvoren |
| **RR-05** | Nestanak interneta | Mrežni problemi u bolnici | Niska | Srednji | Nizak | Offline mod ili retry mehanizam | IT podrška | Otvoren |
| **RR-06** | Loše korisničko iskustvo | Neintuitivan dizajn | Srednja | Srednji | Srednji | Feedback korisnika | Frontend developer | Otvoren |
| **RR-07** | Neusklađenost sa zakonima | Zakoni na nivou države ili lokalni zakoni | Niska | Visok | Srednji | Pravna provjera | Projekt menadžer | Otvoren |
| **RR-08** | Neovlašten pristup podacima | Slaba autentifikacija | Srednja | Visok | Visok | Enkripcija, 2FA, sigurnosni testovi | Security/Backend | Otvoren |
| **RR-09** | Neispravni podaci o pacijentima | Greška pri unosu podataka | Srednja | Visok | Visok | Validacija inputa | Frontend developer | Otvoren |
| **RR-10** | Dupli termini za iste pacijente | Loša logika zakazivanja | Srednja | Visok | Visok | Provjera konflikta termina u bazi | Backend developer | U toku |
| **RR-11** | Neautorizovan pristup admin panelu | Slaba zaštita admin naloga | Niska | Visok | Visok |  | Security tim | U toku |
| **RR-12** | Gubitak sesije korisnika | Isticanje session tokena | Srednja | Srednji | Srednji |  | Backend developer | Otvoren |
| **RR-13** | Konflikt u rasporedu doktora | Nema centralne provjere rasporeda | Srednja | Visok | Visok | Centralni scheduling sistem | Backend developer | Otvoren |
| **RR-14** | Neispravne obavijesti pacijentima | Pogrešni podaci u sistemu notifikacija | Niska | Srednji | Nizak | Logovanje i verifikacija poruka | QA tim | Identifikovan |
| **RR-15** | Kašnjenje notifikacija | Problem sa email/SMS servisom | Srednja | Srednji | Srednji | Retry mehanizam | Backend developer | Otvoren |
| **RR-16** | Pacijent se ne pojavi na termin | Pacijent zaboravi ili ne dobije obavijest | Srednja | Srednji | Srednji | SMS/email podsjetnici | Backend developer | Otvoren |
| **RR-17** | Doktor kasni ili nije dostupan | Promjene u rasporedu ili hitni slučajevi | Srednja | Visok | Visok | Dinamičko ažuriranje rasporeda ili zamjenski doktor | Projekt menadžer | Otvoren |
| **RR-18** | Pacijent ne razumije sistem | Nekomplikovan ili nejasan UI | Srednja | Srednji | Srednji | Jednostavan dizajn, upute i pomoć u aplikaciji | Frontend developer | Identifikovan |
| **RR-19** | Hitni slučajevi prekidaju zakazane termine | Neočekivani hitni medicinski slučajevi | Srednja | Visok | Visok | Prioritetni sistem termina, ručno upravljanje | Projekt menadžer | Otvoren |
| **RR-20** | Konflikt između više doktora za isti resurs (npr. sala ili oprema) | Loša koordinacija resursa | Niska | Visok | Srednji | Centralni sistem rezervacije resursa | Backend developer | Identifikovan |
