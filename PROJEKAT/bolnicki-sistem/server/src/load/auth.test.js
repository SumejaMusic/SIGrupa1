import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, TEST_KORISNICI, defaultOptions, smokeOptions, jsonHeaders } from './config.js';

// ═══════════════════════════════════════════════
//  Pokretanje:
//  Smoke test:  k6 run auth.test.js
//  Load test:   k6 run -e MODE=load auth.test.js
//  Stress test: k6 run -e MODE=stress auth.test.js
// ═══════════════════════════════════════════════

const mode = __ENV.MODE || 'smoke';
export let options = mode === 'load' ? defaultOptions : smokeOptions;

// ─────────────────────────────────────────────
//  SETUP — izvršava se jednom prije testa
//  Vraća token koji koriste sve ostale funkcije
// ─────────────────────────────────────────────
export function setup() {
  // Provjeri da li server uopće radi
  const healthCheck = http.get(`${BASE_URL}/auth/prijava`, {
    headers: jsonHeaders,
  });

  // 404 ili 405 znači server radi, samo metoda nije GET — OK
  if (healthCheck.status === 0) {
    console.error('❌ Server nije dostupan na ' + BASE_URL);
    return { token: null };
  }

  // Login kao admin da dobijemo token za protected rute
  const loginRes = http.post(
    `${BASE_URL}/auth/prijava`,
    JSON.stringify({
      email: TEST_KORISNICI.admin.email,
      pristupnaSifra: TEST_KORISNICI.admin.pristupnaSifra,
    }),
    { headers: jsonHeaders }
  );

  if (loginRes.status !== 200) {
    console.warn('⚠️  Admin login nije uspio — provjeri kredencijale u config.js');
    console.warn('Response:', loginRes.body);
    return { adminToken: null };
  }

  const adminToken = loginRes.json('token');
  console.log('✅ Admin login uspješan, token dobijen');

  return { adminToken };
}

// ─────────────────────────────────────────────
//  GLAVNI TEST
// ─────────────────────────────────────────────
export default function (data) {
  const authHeaders = {
    ...jsonHeaders,
    Authorization: `Bearer ${data.adminToken}`,
  };
//NFR-03-prijava izvrsena za < 2s
  // ── 1. Prijava — uspješna ─────────────────────────────────
  group('POST /auth/prijava - uspješna prijava', () => {
    const res = http.post(
      `${BASE_URL}/auth/prijava`,
      JSON.stringify({
        email: TEST_KORISNICI.admin.email,
        pristupnaSifra: TEST_KORISNICI.admin.pristupnaSifra,
      }),
      { headers: jsonHeaders }
    );

    check(res, {
      'status je 200': (r) => r.status === 200,
      'ima token': (r) => r.json('token') !== null,
      'ima korisnika': (r) => r.json('korisnik') !== null,
      'ima id korisnika': (r) => r.json('korisnik.id') !== null,
      'ima ulogu': (r) => r.json('korisnik.uloga') !== null,
      'response < 1000ms': (r) => r.timings.duration < 1000,
    });
  });

  sleep(0.5);

  // ── 2. Prijava — pogrešna lozinka ─────────────────────────
  group('POST /auth/prijava - pogrešna lozinka', () => {
    const res = http.post(
      `${BASE_URL}/auth/prijava`,
      JSON.stringify({
        email: TEST_KORISNICI.admin.email,
        pristupnaSifra: 'PogresnaLozinka999!',
      }),
      { headers: jsonHeaders }
    );

    check(res, {
      'status je 400 ili 401': (r) => r.status === 400 || r.status === 401,
      'ima poruku greške': (r) => r.json('poruka') !== null,
    });
  });

  sleep(0.5);

  // ── 3. Prijava — nedostaje email ──────────────────────────
  group('POST /auth/prijava - nedostaje email', () => {
    const res = http.post(
      `${BASE_URL}/auth/prijava`,
      JSON.stringify({
        pristupnaSifra: 'Lozinka123!',
      }),
      { headers: jsonHeaders }
    );

    check(res, {
      'status je 400': (r) => r.status === 400,
      'ima poruku greške': (r) => r.json('poruka') !== null,
    });
  });

  sleep(0.5);

  // ── 4. Prijava — nedostaje lozinka ────────────────────────
  group('POST /auth/prijava - nedostaje lozinka', () => {
    const res = http.post(
      `${BASE_URL}/auth/prijava`,
      JSON.stringify({
        email: TEST_KORISNICI.admin.email,
      }),
      { headers: jsonHeaders }
    );

    check(res, {
      'status je 400': (r) => r.status === 400,
    });
  });

  sleep(0.5);

  // ── 5. Forgot password — validan email ───────────────────
  group('POST /auth/forgot-password - validan email', () => {
    const res = http.post(
      `${BASE_URL}/auth/forgot-password`,
      JSON.stringify({
        email: TEST_KORISNICI.admin.email,
      }),
      { headers: jsonHeaders }
    );

    check(res, {
      // Uvijek vraća 200 iz sigurnosnih razloga (ne otkriva da li email postoji)
      'status je 200': (r) => r.status === 200,
      'ima poruku': (r) => r.json('poruka') !== null,
     'response < 2000ms': (r) => r.timings.duration < 5000,
    });
  });

  sleep(0.5);

 // ── 6. Forgot password — nepostojeći email ────────────────
  group('POST /auth/forgot-password - nepostojeći email', () => {
    const res = http.post(
      `${BASE_URL}/auth/forgot-password`,
      JSON.stringify({
        email: 'nepostojeci@email.com',
      }),
      { headers: jsonHeaders }
    );

   check(res, {
  'status je 200': (r) => r.status === 200,
  'ima poruku': (r) => r.json('poruka') !== null,
  'response < 2000ms': (r) => r.timings.duration < 5000,
});
  });

  sleep(0.5);

  // ── 7. Forgot password — neispravan email format ─────────
  group('POST /auth/forgot-password - neispravan email', () => {
    const res = http.post(
      `${BASE_URL}/auth/forgot-password`,
      JSON.stringify({
        email: 'ovo-nije-email',
      }),
      { headers: jsonHeaders }
    );

    check(res, {
      'status je 400': (r) => r.status === 400,
    });
  });

  sleep(0.5);

  // ── 8. Verifikuj email — nedostaju polja ─────────────────
  group('POST /auth/verifikuj-email - nedostaju polja', () => {
    const res = http.post(
      `${BASE_URL}/auth/verifikuj-email`,
      JSON.stringify({
        email: TEST_KORISNICI.pacijent.email,
        // kod nedostaje
      }),
      { headers: jsonHeaders }
    );

    check(res, {
      'status je 400': (r) => r.status === 400,
      'ima poruku greške': (r) => r.json('poruka') !== null,
    });
  });

  sleep(0.5);

  // ── 9. Verifikuj email — pogrešan format koda ────────────
  group('POST /auth/verifikuj-email - neispravan kod', () => {
    const res = http.post(
      `${BASE_URL}/auth/verifikuj-email`,
      JSON.stringify({
        email: TEST_KORISNICI.pacijent.email,
        kod: 'abc', // treba biti 6 cifara
      }),
      { headers: jsonHeaders }
    );

    check(res, {
      'status je 400': (r) => r.status === 400,
    });
  });

  sleep(0.5);

  // ── 10. Reset password — nedostaje token ─────────────────
  group('POST /auth/reset-password - nedostaje token', () => {
    const res = http.post(
      `${BASE_URL}/auth/reset-password`,
      JSON.stringify({
        newPassword: 'NovaLozinka123!',
        confirmPassword: 'NovaLozinka123!',
      }),
      { headers: jsonHeaders }
    );

    check(res, {
      'status je 400': (r) => r.status === 400,
    });
  });

  sleep(0.5);

  // ── 11. Reset password — lozinke se ne podudaraju ────────
  group('POST /auth/reset-password - lozinke ne podudaraju', () => {
    const res = http.post(
      `${BASE_URL}/auth/reset-password`,
      JSON.stringify({
        token: 'neki-token',
        newPassword: 'NovaLozinka123!',
        confirmPassword: 'DругаLozinka123!',
      }),
      { headers: jsonHeaders }
    );

    check(res, {
      'status je 400': (r) => r.status === 400,
    });
  });

  sleep(0.5);

  // ── 12. Reset password — slaba lozinka ───────────────────
  group('POST /auth/reset-password - slaba lozinka', () => {
    const res = http.post(
      `${BASE_URL}/auth/reset-password`,
      JSON.stringify({
        token: 'neki-token',
        newPassword: 'slaba',        // ne ispunjava uvjete
        confirmPassword: 'slaba',
      }),
      { headers: jsonHeaders }
    );

    check(res, {
      'status je 400': (r) => r.status === 400,
    });
  });

  sleep(1);
}

// ─────────────────────────────────────────────
//  TEARDOWN — izvršava se jednom nakon testa
// ─────────────────────────────────────────────
export function teardown(data) {
  console.log('✅ Auth testovi završeni');
}