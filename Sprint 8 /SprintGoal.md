# Sprint 8 Goal — Paneli korisničkih uloga i role-based pristup

## Sprint cilj

Cilj Sprinta 8 je završiti personalizovane panele za sve korisničke uloge u sistemu te osigurati da prijavljivanje u sistem bude u potpunosti vezano za dodijeljenu ulogu korisnika. Sprint obuhvata dovršetak doktor panela sa kompletnim tokom rada uključujući dijagnoze i pregled pacijenata, implementaciju panela medicinskog osoblja sa mogućnošću označavanja hitnosti termina, te osnovnu funkcionalnost admin panela za dodjelu i upravljanje ulogama korisnika.

Na kraju sprinta, svaki korisnik sistema — pacijent, doktor, medicinsko osoblje i admin — prijavom dobija pristup isključivo funkcijama koje odgovaraju njegovoj ulozi (NFR-06, NFR-07). Admin može dodijeliti i promijeniti korisničke uloge putem admin panela, čime se zatvara krug koji je otvoren uvođenjem RBAC mehanizma u Sprintu 7. Doktor vidi dnevni i sedmični raspored te komentare uz termine, dok medicinsko osoblje upravlja aktivnim terminima i označava hitne slučajeve. Dashboard sistema se učitava u roku od 3 sekunde (NFR-15), a sve promjene rasporeda vidljive su u realnom vremenu (NFR-16). Uz razvoj novih funkcionalnosti, sprint obuhvata i rješavanje aktivnih bugova te integraciono testiranje svih implementiranih komponenti.

Sprint se smatra uspješnim kada je kompletan tok — **login → prepoznavanje uloge → pristup odgovarajućem panelu** — funkcionalan za sve četiri uloge bez neautorizovanog pristupa i bez kritičnih grešaka u sistemu.

> **Napomena o promjeni plana:** Osnovna funkcionalnost admin panela za dodjelu korisničkih uloga, prvobitno planirana kao dio Sprinta 10 (Release 4 — Autentikacija i sigurnost), premještena je u Sprint 8 kako bi RBAC mehanizam implementiran u Sprintu 7 bio u potpunosti operativan. Bez mogućnosti dodjele uloga korisnicima, role-based prijavljivanje i personalizovani paneli ne mogu biti validirani u integraciji. Ova odluka omogućava da Release 3 bude isporučen kao funkcionalno zaokružen inkrement.

---

## User storije u Sprintu 8

| ID | Naziv |
|----|-------|
| US-11 | Dashboard za doktora — pregled dnevnog i sedmičnog rasporeda |
| US-21 | Omogućavanje pregleda komentara termina (doktor) |
| US-17 | Rezervacija termina kod specijaliste putem doktora porodične medicine |
| US-24 | Panel medicinskog osoblja |
| US-28 | Označavanje hitnosti prijavljenog termina |
| US-02 | Admin panel — korisnički interfejs za administraciju (dodjela uloga) |
| US-33 | Admin panel — backend funkcionalnosti (dodjela uloga) |

> **Napomena:** US-01 (Historija pregleda korisnika), US-32 (Upload laboratorijskih nalaza od strane medicinskog osoblja) i US-23 (Vodič za korištenje stranice), koji su dio Release 3, planiraju se za Sprint 9. U ovom sprintu fokus je na funkcionalnostima koje su direktna zavisnost za validaciju role-based toka. Bugfixing i integraciono testiranje provode se kao prateće aktivnosti uz razvoj.

---

## Relevantni NFR zahtjevi

| ID | Zahtjev |
|----|---------|
| NFR-06 | Korisnik smije pristupiti samo funkcijama koje odgovaraju njegovoj ulozi |
| NFR-07 | Sistem mora implementirati RBAC (Role-Based Access Control) |
| NFR-01 | Samo vlasnik i autorizovano medicinsko osoblje mogu pristupiti historiji pregleda pacijenta |
| NFR-15 | Dashboard sistema mora se učitati u roku od maksimalno 3 sekunde |
| NFR-16 | Promjene rasporeda moraju biti vidljive u roku od 2 sekunde — WebSocket |
| NFR-26 | Sistem mora imati intuitivan interfejs za upravljanje i rezervaciju termina |

---

## Glavni rizici

| ID | Opis |
|----|------|
| RR-11 | Neautorizovan pristup admin panelu ako RBAC nije ispravno implementiran |
| RR-08 | Neovlašten pristup podacima usljed nepotpunog role-based routinga |
| RR-17 | Doktor kasni ili nije dostupan — potrebno dinamičko ažuriranje rasporeda |
| RR-19 | Hitni slučajevi prekidaju zakazane termine |
| RR-06 | Loše korisničko iskustvo usljed kompleksnosti interfejsa |

---

## Kriteriji prihvatanja sprinta

- [ ] Doktor panel je funkcionalan — pregled dnevnog i sedmičnog rasporeda, komentari uz termine i rezervacija kod specijaliste rade ispravno (US-11, US-21, US-17)
- [ ] Panel medicinskog osoblja je implementiran sa mogućnošću upravljanja aktivnim terminima i označavanja hitnosti (US-24, US-28)
- [ ] Admin može dodijeliti ili promijeniti ulogu korisnika (pacijent, doktor, medicinsko osoblje, admin) putem admin panela (US-02, US-33)
- [ ] Nakon prijave, korisnik je automatski preusmjeren na panel koji odgovara njegovoj ulozi (NFR-06, NFR-07)
- [ ] Samo ovlaštene uloge mogu pristupiti podacima pacijenta (NFR-01)
- [ ] Dashboard se učitava u roku od maksimalno 3 sekunde (NFR-15)
- [ ] Promjene rasporeda vidljive su u realnom vremenu putem WebSocket veze (NFR-16)
- [ ] Svi aktivni bugovi evidentirani iz prethodnih sprintova su riješeni ili kategorizirani po prioritetu
- [ ] Integraciono testiranje provedeno za sve panele i tok prijave — bez kritičnih grešaka
- [ ] Kompletan tok **login → uloga → panel** verificiran za sve četiri uloge bez neautorizovanog pristupa
