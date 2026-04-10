| ID | Opis rizika | Uzrok | Vjerovatnoća | Uticaj | Prioritet rizika | Plan mitigacije | Odgovorna osoba ili uloga | Status |
|:---|:---|:---|:---|:---:|:---|:---|:---|:---|
| **RR-01** | Nedostupnost sistema | Pad servera ili hosting problem | Srednja | Visok | Visok | Monitoring, backup serveri | DevOps tim | Open |
| **RR-02** | Gubitak podataka | Greška baze ili backup-a | Niska | Visok | Srednji | Redovan backup, test restore | Backend developer | Open |
| **RR-03** | Greške u zakazivanju termina | Bug u logici sistema | Visoka | Srednji | Visok | Unit testovi, QA testiranje | QA tim | Open |
| **RR-04** | Preopterećenje sistema | Veliki broj korisnika | Srednja | Visok | Visok | Skaliranje servera | DevOps tim | Open |
| **RR-05** | Gubitak internet konekcije | Mrežni problemi u bolnici | Niska | Srednji | Nizak | Offline mod ili retry mehanizam | IT podrška | Open |
