# Acceptance Criteria

### ID Storyja: US-01
**Naziv:** Rezervacija termina

---

1. **Glavni proces rezervacije:**
   - **Kada** je pacijent logovan i izabere slobodan termin iz kalendara, **ako** klikne na "Potvrdi", **tada** sistem mora taj termin upisati u bazu kao "ZAKAZAN".
2. **Potvrda rezervacije:**
   - **Korisnik treba dobiti** potvrdu na ekranu i na email odmah nakon što uspješno rezerviše termin, sa svim detaljima (vrijeme, doktor).
3. **Prikaz slobodnih mjesta:**
   - **Sistem mora omogućiti** da pacijent vidi samo one termine koji su u radnom vremenu doktora i koji već nisu zauzeti od strane nekog drugog pacijenta.
4. **Problem duplih rezervacija:**
   - **Sistem ne smije dozvoliti** da dva različita pacijenta rezervišu isti termin.
5. **Više termina dnevno (Otvoreno pitanje):**
   - **Sistem ne treba dozvoliti** pacijentu da rezerviše više od jednog termina kod istog doktora u jednom danu, da ne bi zauzimao mjesta drugima.
     
