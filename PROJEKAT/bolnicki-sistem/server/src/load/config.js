// ═══════════════════════════════════════════════
//  KONFIGURACIJA — mijenjaj ovdje
// ═══════════════════════════════════════════════

export const BASE_URL = 'http://localhost:5000/api';

/*export const TEST_IDS = {
  doktorId:            1,
  pacijentId:          245,
  terminId:            1,
  rezervacijaId:       6,   // aktivna, buduća
  rezervacijaZaOcjenu: 2,   // završena, bez recenzije
  nalazId:             25,
  odjelId:             1,
  recenzijaId:         1,
};*/
export const TEST_IDS = {
  doktorId:            16,
  korisnikId:   245,
  pacijentId:          91,
  terminId:            1020,
  rezervacijaId:       6,   // aktivna, buduća
  rezervacijaZaOcjenu: 2,   // završena, bez recenzije
  nalazId:             25,
  odjelId:             5,
  recenzijaId:         1,
};
// Test korisnici — popuni sa stvarnim podacima iz baze
export const TEST_KORISNICI = {
  admin:    { email: 'emailprimjer5@gmail.com',       pristupnaSifra: 'Lozinka123!' },
  pacijent: { email: 'emailprimjer@gmail.com', pristupnaSifra: 'Lozinka123!' },
  pacijent2: { email: 'emailprimjer4@gmail.com', pristupnaSifra: 'Lozinka123!' },
  doktor:   { email: 'emailprimjer6@gmail.com',         pristupnaSifra: 'Lozinka123!' },
  osoblje:  { email: 'emailprimjer3@gmail.com',      pristupnaSifra: 'Lozinka123!' }, // ← DODAJ
};

export const defaultOptions = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '30s', target: 20 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    'http_req_duration{name:login}':           ['p(95)<2000'],
    'http_req_duration{name:otkazi_pacijent}': ['p(95)<3000'],
    'http_req_duration{name:provjeri_termin}': ['p(95)<2000'],
    'http_req_duration{name:dashboard}':       ['p(95)<5000'], // vlasnik dashboard je spor
    'http_req_duration{name:admin}':           ['p(95)<3000'], // realniji limit
    'http_req_duration': ['p(95)<10000'],
    'http_req_failed':                         ['rate<0.65'],
  },
};

export const smokeOptions = {
  vus: 1,
  iterations: 1,
};

export const stressOptions = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '30s', target: 50 },
    { duration: '10s', target: 100 },
    { duration: '20s', target: 0 },
  ],
};

export const jsonHeaders = {
  'Content-Type': 'application/json',
};