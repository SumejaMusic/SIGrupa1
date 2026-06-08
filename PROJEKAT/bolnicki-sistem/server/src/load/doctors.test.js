import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, TEST_KORISNICI, defaultOptions, smokeOptions, jsonHeaders } from './config.js';

// ═══════════════════════════════════════════════
//  Pokretanje:
//  Smoke test:  k6 run doktori.test.js
//  Load test:   k6 run -e MODE=load doktori.test.js
// ═══════════════════════════════════════════════

const mode = __ENV.MODE || 'smoke';
export let options = mode === 'load' ? defaultOptions : smokeOptions;

// ─────────────────────────────────────────────
//  SETUP — login i uzmi token
// ─────────────────────────────────────────────
export function setup() {
  // Login kao doktor
  const doktorLoginRes = http.post(
    `${BASE_URL}/auth/prijava`,
    JSON.stringify({
      email: TEST_KORISNICI.doktor.email,
      pristupnaSifra: TEST_KORISNICI.doktor.pristupnaSifra,
    }),
    { headers: jsonHeaders }
  );

  // Login kao admin
  const adminLoginRes = http.post(
    `${BASE_URL}/auth/prijava`,
    JSON.stringify({
      email: TEST_KORISNICI.admin.email,
      pristupnaSifra: TEST_KORISNICI.admin.pristupnaSifra,
    }),
    { headers: jsonHeaders }
  );

  const doktorToken = doktorLoginRes.status === 200 ? doktorLoginRes.json('token') : null;
  const adminToken = adminLoginRes.status === 200 ? adminLoginRes.json('token') : null;

  if (!doktorToken) console.warn('⚠️  Doktor login nije uspio');
  if (!adminToken) console.warn('⚠️  Admin login nije uspio');

  // Dohvati ID prvog doktora za testove koji ga trebaju
  const doktoriRes = http.get(`${BASE_URL}/doktori`, { headers: jsonHeaders });
  let prviDoktorId = 1; // fallback
  if (doktoriRes.status === 200) {
    const doktori = doktoriRes.json();
    if (Array.isArray(doktori) && doktori.length > 0) {
      prviDoktorId = doktori[0].id;
      console.log(`✅ Pronađen doktor ID: ${prviDoktorId}`);
    }
  }

  return { doktorToken, adminToken, prviDoktorId };
}

// ─────────────────────────────────────────────
//  GLAVNI TEST
// ─────────────────────────────────────────────
export default function (data) {
  const { doktorToken, adminToken, prviDoktorId } = data;

  const doktorHeaders = {
    ...jsonHeaders,
    Authorization: `Bearer ${doktorToken}`,
  };

  const adminHeaders = {
    ...jsonHeaders,
    Authorization: `Bearer ${adminToken}`,
  };

  // ── 1. GET /doktori — javna ruta, svi doktori ────────────
  group('GET /doktori - dohvati sve doktore', () => {
    const res = http.get(`${BASE_URL}/doktori`, { headers: jsonHeaders });

   
  

  
    check(res, {
      'status je 200': (r) => r.status === 200,
      'vraća niz': (r) => Array.isArray(r.json()),
      'response < 1500ms': (r) => r.timings.duration < 1500,
    });
  });

  sleep(0.5);

  // ── 2. GET /doktori?specijalizacija= — filter ─────────────
  group('GET /doktori - filter po specijalizaciji', () => {
    const res = http.get(`${BASE_URL}/doktori?specijalizacija=1`, {
      headers: jsonHeaders,
    });
console.log(`[DETEKTIV] GET /doktori | Status: ${res.status} | Body: ${res.body}`);
    check(res, {
      'status je 200': (r) => r.status === 200,
      'vraća niz': (r) => {
  try { return Array.isArray(r.json()); } catch { return false; }
},
    });
  });

  sleep(0.5);

  // ── 3. GET /doktori?odjelId= — filter po odjelu ──────────
  group('GET /doktori - filter po odjelu', () => {
    const res = http.get(`${BASE_URL}/doktori?odjelId=1`, {
      headers: jsonHeaders,
    });

    check(res, {
      'status je 200': (r) => r.status === 200,
      'vraća niz': (r) => Array.isArray(r.json()),
    });
  });

  sleep(0.5);

  // ── 4. GET /doktori/:id — detalji doktora ─────────────────
  group('GET /doktori/:id - detalji doktora', () => {
    const res = http.get(`${BASE_URL}/doktori/${prviDoktorId}`, {
      headers: jsonHeaders,
    });

    check(res, {
      'status je 200': (r) => r.status === 200,
      'ima id': (r) => r.json('id') !== null,
      'response < 1500ms': (r) => r.timings.duration < 1500,
    });
  });

  sleep(0.5);

  // ── 5. GET /doktori/:id — nepostojeći doktor ─────────────
  group('GET /doktori/:id - nepostojeći doktor', () => {
    const res = http.get(`${BASE_URL}/doktori/999999`, {
      headers: jsonHeaders,
    });

    check(res, {
      'status je 404': (r) => r.status === 404,
      'ima poruku': (r) => r.json('poruka') !== null,
    });
  });

  sleep(0.5);

  // ── 6. GET /doktori/:id/raspored — raspored doktora ──────
  group('GET /doktori/:id/raspored - raspored', () => {
    const res = http.get(`${BASE_URL}/doktori/${prviDoktorId}/raspored`, {
      headers: jsonHeaders,
    });

    check(res, {
      'status je 200': (r) => r.status === 200,
      'vraća niz': (r) => Array.isArray(r.json()),
      'response < 1000ms': (r) => r.timings.duration < 1000,
    });
  });

  sleep(0.5);

  // ── 7. GET /doktori/:id/reviews — zahtijeva auth ─────────
  group('GET /doktori/:id/reviews - sa tokenom', () => {
    if (!adminToken) {
      console.warn('⚠️  Preskačem — nema admin tokena');
      return;
    }

    const res = http.get(`${BASE_URL}/doktori/${prviDoktorId}/reviews`, {
      headers: adminHeaders,
    });

    check(res, {
      'status je 200 ili 404': (r) => r.status === 200 || r.status === 404,
      'response < 1000ms': (r) => r.timings.duration < 1000,
    });
  });

  sleep(0.5);

  // ── 8. GET /doktori/:id/reviews — bez tokena ─────────────
  group('GET /doktori/:id/reviews - bez tokena', () => {
    const res = http.get(`${BASE_URL}/doktori/${prviDoktorId}/reviews`, {
      headers: jsonHeaders,
    });

    check(res, {
      'status je 401': (r) => r.status === 401,
    });
  });

  sleep(1);
}

export function teardown(data) {
  console.log('✅ Doktori testovi završeni');
}