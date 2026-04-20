## Branching strategy

Za branching strategiju odabran je GitHub Flow, iz razloga što je riječ o manjem razvojnom timu od osam članova, i redovnim sedmičnim sprintovima. GitHub Flow nudi jednostavnost i preglednost koja odgovara veličini i prirodi ovog projekta, bez nepotrebne kompleksnosti koju bi donijele alternative poput GitFlowa, te je idealan za kontinuirani razvoj i česte izmjene. 

### Osnovna struktura grana 

Struktura GitHub Flow sastoji se od dvije vrste grana: **main** grana, koja uvijek sadrži stabilan kod spreman za deployment, i **feature/bugfix** grana koje se kreiraju iz maina, na njima se implementiraju promjene, te se nakon završetka mergeaju nazad u main.

**Main branch**: Na njoj se uvijek nalazi kod koji je stabilan, testiran, i spreman za deployment. Direktno commitovanje na main branch nije dozvoljeno, već svaka nova funkcionalnost, ispravka greške, ili bilo kakva promjena idu na posebnu granu.
Na taj način main je uvijek zaštićen i spreman za deployment.

**Feature/bugfix branch**: Sve nove funkcionalnosti, ispravke grešaka, i poboljšanja implementiraju se na zasebnim granama koje se kreiraju iz main brancha. Ovaj pristup omogućava paralelan rad članova tima bez međusobnog ometanja i smanjuje rizik od konflikata na main grani.

### Proces rada

Način rada je sljedeći:

1.	Za svaki novi user story, bug fix ili bilo kakvu promjenu, kreirati novu granu iz maina
2.	Raditi commitove lokalno na tom branchu te ih pushati na remote repozitorij
3.	Kada je funkcionalnost završena ili spremna za pregled, otvoriti pull request prema main grani
4.	Drugi članovi tima vrše review
5.	Nakon odobrenja i prolaska provjera, grana se mergea u main
6.	Nakon mergea u main granu kod je spreman za deployment

Nova grana kreira se uvijek iz najnovije verzije main grane kako bi se izbjegle zastarjele izmjene. Za imenovanje grana koristi se standardizovana konvencija: feature/naziv-funkcionalnosti i bugfix/opis-greške.

**Pull request** otvara se u trenutku kada je funkcionalnost gotova i spremna za review. Review obavljaju drugi članovi tima koji nisu radili na implementaciji funkcionalnosti, te uključuje:

1. Provjeru ispravnosti i čitljivosti koda
2. Provjeru usklađenosti funkcionalnosti sa poslovnim zahtjevima sistema
3. Provjera sigurnosnih aspekata
4. Provjera eventualnih konflikata i nedosljednosti

Grana se može mergeati nazad u main tek onda kada su ispunjeni sljedeći uslovi:

1. Funkcionalnost je u potpunosti implementirana
2. Review je uspješno završen i testiranje je prošlo bez grešaka
3. Nema neriješenih konflikata sa main granom

### Rješavanje konflikata

Konflikti nastaju kada dvije osobe istovremeno mijenjaju isti fajl. Kako bi se riješio konflikt, član tima lokalno povlači najnovije izmjene iz maina u svoj feature branch, ručno pregleda konfliktna mjesta i bira odgovarajuću verziju koda, nakon 
čega commituje i pusha razriješene promjene na repozitorij.

Važno je naglasiti da se konflikt uvijek rješava na feature branchu, nikada na mainu, jer je main uvijek zaštićen i niko ne pusha direktno na njega. 

Kako bi se konflikti sveli na minimum, preporučuje se svakodnevno povlačenje najnovijih izmjena iz main grane u svoj feature branch, čime se izbjegava nakupljanje većih razlika između grana.
