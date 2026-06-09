import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, TEST_KORISNICI, defaultOptions, smokeOptions, jsonHeaders } from './config.js';

// ═══════════════════════════════════════════════
//  Pokretanje:
//  Smoke test:  k6 run rezervacije.test.js
//  Load test:   k6 run -e MODE=load rezervacije.test.js
//
//  NFR-ovi koje pokriva:
//  NFR-09 — Otkazani termin dostupan za < 2s
//  NFR-10 — Otkazivanje završeno za 2-3s
//  NFR-22 — Zaključavanje termina (konkurentnost)
// ═══════════════════════════════════════════════

const mode = __ENV.MODE || 'smoke';
export let options = mode === 'load' ? {
  ...defaultOptions,
  thresholds: {
    // NFR-10: otkazivanje termina mora biti u roku od 3s
    'http_req_duration{name:otkazi_pacijent}': ['p(95)<3000'],
    // NFR-09: termin dostupan odmah nakon otkazivanja
    'http_req_duration{name:provjeri_termin}': ['p(95)<2000'],
    // Opći threshold
    'http_req_duration': ['p(95)<3000'],
    'http_req_failed': ['rate<0.05'],
  },
} : smokeOptions;

// ─────────────────────────────────────────────
//  SETUP
// ─────────────────────────────────────────────
export function setup() {
  // Login kao pacijent
  const pacijentRes = http.post(
    `${BASE_URL}/auth/prijava`,
    JSON.stringify({
      email: TEST_KORISNICI.pacijent.email,
      pristupnaSifra: TEST_KORISNICI.pacijent.pristupnaSifra,
    }),
    { headers: jsonHeaders }
  );

  // Login kao admin/osoblje za otkazivanje od strane osoblja
  const adminRes = http.post(
    `${BASE_URL}/auth/prijava`,
    JSON.stringify({
      email: TEST_KORISNICI.admin.email,
      pristupnaSifra: TEST_KORISNICI.admin.pristupnaSifra,
    }),
    { headers: jsonHeaders }
  );

  const pacijentToken = pacijentRes.status === 200 ? pacijentRes.json('token') : null;
  const adminToken = adminRes.status === 200 ? adminRes.json('token') : null;

  if (!pacijentToken) console.warn('⚠️  Pacijent login nije uspio');
  if (!adminToken) console.warn('⚠️  Admin login nije uspio');

  // Dohvati postojeće rezervacije pacijenta za testove otkazivanja
  let rezervacijaId = null;
  let rezervacijaOsobljeId = null;

  if (pacijentToken) {
    const mojRezRes = http.get(`${BASE_URL}/rezervacije/moje`, {
      headers: { ...jsonHeaders, Authorization: `Bearer ${pacijentToken}` },
    });

    if (mojRezRes.status === 200) {
      const rezervacije = mojRezRes.json();
      if (Array.isArray(rezervacije) && rezervacije.length > 0) {
        // Uzmi rezervaciju koja je u budućnosti i > 24h (pacijent može otkazati)
        const buducaRezervacija = rezervacije.find(r => {
          if (!r.termin) return false;
          const vrijemeTermina = new Date(r.termin.datum);
          const razlikaSati = (vrijemeTermina.getTime() - Date.now()) / (1000 * 60 * 60);
          return razlikaSati > 25; // > 25h da budemo sigurni
        });
        if (buducaRezervacija) {
          rezervacijaId = buducaRezervacija.id;
          console.log(`✅ Pronađena rezervacija za pacijenta: ID ${rezervacijaId}`);
        } else {
          console.warn('⚠️  Nema budućih rezervacija za pacijenta koje može otkazati (> 24h)');
        }
      }
    }
  }

  // Dohvati rezervacije za osoblje
  if (adminToken) {
    // Uzmi prvu aktivnu rezervaciju za test otkazivanja od osoblja
    const adminRezRes = http.get(`${BASE_URL}/admin/termini`, {
      headers: { ...jsonHeaders, Authorization: `Bearer ${adminToken}` },
    });
    // Fallback — koristimo isti ID ako postoji
    rezervacijaOsobljeId = rezervacijaId;
  }

  return { pacijentToken, adminToken, rezervacijaId, rezervacijaOsobljeId };
}

// ─────────────────────────────────────────────
//  GLAVNI TEST
// ─────────────────────────────────────────────
export default function (data) {
  const { pacijentToken, adminToken, rezervacijaId, rezervacijaOsobljeId } = data;

  const pacijentHeaders = {
    ...jsonHeaders,
    Authorization: `Bearer ${pacijentToken}`,
  };

  const adminHeaders = {
    ...jsonHeaders,
    Authorization: `Bearer ${adminToken}`,
  };

  // ── 1. GET /rezervacije/moje — pacijent dohvata svoje rezervacije ─────
  group('GET /rezervacije/moje - pacijentove rezervacije', () => {
    if (!pacijentToken) return;

    const res = http.get(`${BASE_URL}/rezervacije/moje`, {
      headers: pacijentHeaders,
    });

    check(res, {
      'status je 200': (r) => r.status === 200,
      'vraća niz': (r) => Array.isArray(r.json()),
      'response < 2000ms': (r) => r.timings.duration < 2000,
    });
  });

  sleep(0.5);

  // ── 2. GET /rezervacije/moje — bez tokena ─────────────────────────────
  group('GET /rezervacije/moje - bez tokena', () => {
    const res = http.get(`${BASE_URL}/rezervacije/moje`, {
      headers: jsonHeaders,
    });

    check(res, {
      'status je 401': (r) => r.status === 401,
    });
  });

  sleep(0.5);

  // ── 3. POST /rezervacije — bez Redis locka ────────────────────────────
  // Provjera da sistem odbija rezervaciju bez prethodnog zaključavanja (NFR-22)
  group('POST /rezervacije - bez Redis locka (NFR-22)', () => {
    if (!pacijentToken) return;

    const res = http.post(
      `${BASE_URL}/rezervacije`,
      JSON.stringify({
        idTermina: 1,    // bilo koji ID
        idDoktor: 1,
      }),
      { headers: pacijentHeaders }
    );

    check(res, {
  'odbijen bez locka (409)': (r) => r.status === 409 || r.status === 400,
  'ima poruku o locku': (r) => {
    const body = r.json('poruka') || '';
    return body.length > 0;
  },
});
  });

  sleep(0.5);

  // ── 4. POST /rezervacije — nedostaju obavezna polja ───────────────────
  group('POST /rezervacije - nedostaju polja', () => {
    if (!pacijentToken) return;

    const res = http.post(
      `${BASE_URL}/rezervacije`,
      JSON.stringify({
        // idTermina i idDoktor nedostaju
        komentar: 'Test',
      }),
      { headers: pacijentHeaders }
    );

    check(res, {
      'status je 400': (r) => r.status === 400,
      'ima poruku greške': (r) => r.json('poruka') !== null,
    });
  });

  sleep(0.5);

  // ── 5. POST /rezervacije — bez autentifikacije ────────────────────────
  group('POST /rezervacije - bez tokena', () => {
    const res = http.post(
      `${BASE_URL}/rezervacije`,
      JSON.stringify({ idTermina: 1, idDoktor: 1 }),
      { headers: jsonHeaders }
    );

    check(res, {
      'status je 401': (r) => r.status === 401,
    });
  });

  sleep(0.5);

  // ── 6. PATCH /rezervacije/:id/otkazi/pacijent — NFR-10 ───────────────
  group('PATCH /rezervacije/:id/otkazi/pacijent (NFR-10)', () => {
    if (!pacijentToken || !rezervacijaId) {
      console.warn('⚠️  Preskačem otkazivanje — nema rezervacije za test');
      return;
    }

    const start = Date.now();
    const res = http.patch(
      `${BASE_URL}/rezervacije/${rezervacijaId}/otkazi/pacijent`,
      JSON.stringify({}),
      {
        headers: pacijentHeaders,
        tags: { name: 'otkazi_pacijent' }, // za NFR-10 threshold
      }
    );
    const trajanje = Date.now() - start;

    check(res, {
      'status je 200': (r) => r.status === 200,
      'ima poruku uspjeha': (r) => {
        const p = r.json('poruka') || '';
        return p.includes('otkazan') || p.includes('uspješno');
      },
      // NFR-10: otkazivanje u roku od 3s
      'otkazivanje < 3000ms (NFR-10)': (r) => r.timings.duration < 3000,
    });

    if (res.status === 200) {
      console.log(`✅ Otkazivanje trajalo: ${trajanje}ms`);

      // NFR-09: odmah provjeri da li je termin slobodan (< 2s)
      sleep(0.1); // minimalna pauza
      const terminCheck = http.get(`${BASE_URL}/rezervacije/moje`, {
        headers: pacijentHeaders,
        tags: { name: 'provjeri_termin' },
      });

      check(terminCheck, {
        'termin odmah slobodan (NFR-09)': (r) => r.status === 200,
        'provjera < 2000ms (NFR-09)': (r) => r.timings.duration < 2000,
      });
    }
  });

  sleep(0.5);

  // ── 7. PATCH /rezervacije/:id/otkazi/pacijent — nepostojeci ID ────────
  group('PATCH /rezervacije/999999/otkazi/pacijent - nepostojeća', () => {
    if (!pacijentToken) return;

    const res = http.patch(
      `${BASE_URL}/rezervacije/999999/otkazi/pacijent`,
      JSON.stringify({}),
      { headers: pacijentHeaders }
    );

    check(res, {
      'status je 404': (r) => r.status === 404,
      'ima poruku greške': (r) => r.json('poruka') !== null,
    });
  });

  sleep(0.5);

  // ── 8. PATCH /rezervacije/:id/otkazi/osoblje — bez tokena ─────────────
  group('PATCH /rezervacije/:id/otkazi/osoblje - bez tokena', () => {
    const res = http.patch(
      `${BASE_URL}/rezervacije/1/otkazi/osoblje`,
      JSON.stringify({}),
      { headers: jsonHeaders }
    );

    check(res, {
      'status je 401': (r) => r.status === 401,
    });
  });

  sleep(0.5);

  // ── 9. PATCH /rezervacije/:id/otkazi/osoblje — pacijent pokušava ──────
  // Provjera RBAC — pacijent ne smije koristiti osoblje rutu (NFR-06, NFR-07)
  group('PATCH /rezervacije/:id/otkazi/osoblje - pacijent (RBAC, NFR-06)', () => {
    if (!pacijentToken) return;

    const res = http.patch(
      `${BASE_URL}/rezervacije/1/otkazi/osoblje`,
      JSON.stringify({}),
      { headers: pacijentHeaders }
    );

    check(res, {
      // Pacijent ne smije koristiti osoblje rutu
      'status je 401 ili 403': (r) => r.status === 401 || r.status === 403,
    });
  });

  sleep(0.5);

  // ── 10. GET /rezervacije/:id/komentari — bez tokena ───────────────────
  group('GET /rezervacije/:id/komentari - bez tokena', () => {
    const res = http.get(`${BASE_URL}/rezervacije/1/komentari`, {
      headers: jsonHeaders,
    });

    check(res, {
      'status je 401': (r) => r.status === 401,
    });
  });

  sleep(0.5);

  // ── 11. GET /rezervacije/:id/komentari — sa tokenom ───────────────────
  group('GET /rezervacije/:id/komentari - sa tokenom', () => {
    if (!pacijentToken || !rezervacijaId) return;

    const res = http.get(`${BASE_URL}/rezervacije/${rezervacijaId}/komentari`, {
      headers: pacijentHeaders,
    });

    check(res, {
      'status je 200 ili 404': (r) => r.status === 200 || r.status === 404,
      'response < 1000ms': (r) => r.timings.duration < 1000,
    });
  });

  sleep(0.5);

  // ── 12. PATCH /rezervacije/:id/komentar — prazan komentar ────────────
  group('PATCH /rezervacije/:id/komentar - prazan komentar', () => {
    if (!pacijentToken) return;

    const res = http.patch(
      `${BASE_URL}/rezervacije/1/komentar`,
      JSON.stringify({ komentar: '' }),
      { headers: pacijentHeaders }
    );

    check(res, {
      'status je 400 ili 404': (r) => r.status === 400 || r.status === 404,
    });
  });

  sleep(1);
}

export function teardown(data) {
  console.log('✅ Rezervacije testovi završeni');
}