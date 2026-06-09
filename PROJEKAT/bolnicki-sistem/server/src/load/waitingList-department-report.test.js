import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, TEST_KORISNICI, TEST_IDS, defaultOptions, smokeOptions, jsonHeaders } from './config.js';

// ═══════════════════════════════════════════════
//  Lista čekanja, Nalazi, Odjeli
//
//  Pokretanje:
//  Smoke test: k6 run waitingList-department-report.test.js
//  Load test:  k6 run -e MODE=load waitingList-department-report.test.js
//
//  NFR-ovi:
//  NFR-01 — Pristup historiji samo ovlaštenim ulogama
//  NFR-06/07 — RBAC provjera
//  NFR-17 — Nalazi dostupni samo s autorizacijom
// ═══════════════════════════════════════════════

const mode = __ENV.MODE || 'smoke';
export let options = mode === 'load' ? defaultOptions : smokeOptions;

export function setup() {

  // Login pacijent
  const pacijentRes = http.post(
    `${BASE_URL}/auth/prijava`,
    JSON.stringify({
      email: TEST_KORISNICI.pacijent.email,
      pristupnaSifra: TEST_KORISNICI.pacijent.pristupnaSifra,
    }),
    { headers: jsonHeaders }
  );

  // Login admin
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
  const pacijentId = pacijentRes.status === 200 ? pacijentRes.json('korisnik.id') : null;

  if (!pacijentToken) console.warn('⚠️  Pacijent login nije uspio');
  if (!adminToken) console.warn('⚠️  Admin login nije uspio');

  // Dohvati ID pacijenta iz baze za nalaze
  const pacijentBazaId = TEST_IDS.pacijentId;
  if (pacijentToken) {
    const mojRezRes = http.get(`${BASE_URL}/rezervacije/moje`, {
      headers: { ...jsonHeaders, Authorization: `Bearer ${pacijentToken}` },
    });
    if (mojRezRes.status === 200) {
      const rezervacije = mojRezRes.json();
      if (Array.isArray(rezervacije) && rezervacije.length > 0) {
        pacijentBazaId = rezervacije[0].idPacijent;
        console.log(`✅ Pacijent baza ID: ${pacijentBazaId}`);
      }
    }
  }

  // Dohvati ID liste čekanja
  let listaCekanjaId = null;
  if (pacijentToken) {
    const listaRes = http.get(`${BASE_URL}/lista-cekanja/moja`, {
      headers: { ...jsonHeaders, Authorization: `Bearer ${pacijentToken}` },
    });
    if (listaRes.status === 200) {
      const lista = listaRes.json();
      if (Array.isArray(lista) && lista.length > 0) {
        listaCekanjaId = lista[0].id;
        console.log(`✅ Lista čekanja ID: ${listaCekanjaId}`);
      }
    }
  }

  return { pacijentToken, adminToken, pacijentId, pacijentBazaId, listaCekanjaId };
}

export default function (data) {
  const { pacijentToken, adminToken, pacijentBazaId, listaCekanjaId } = data;

  const pacijentHeaders = { ...jsonHeaders, Authorization: `Bearer ${pacijentToken}` };
  const adminHeaders = { ...jsonHeaders, Authorization: `Bearer ${adminToken}` };

  // ══════════════════════════════════════════════
  //  ODJELI
  // ══════════════════════════════════════════════

  // ── 1. GET /odjeli — javna ruta ───────────────────────────────────────
  group('GET /odjeli - dohvati sve odjele (javna ruta)', () => {
    const res = http.get(`${BASE_URL}/odjeli`, { headers: jsonHeaders });

    check(res, {
      'status je 200': (r) => r.status === 200,
      'vraća niz': (r) => Array.isArray(r.json()),
      'response < 3000ms': (r) => r.timings.duration < 3000,  // promjena 
    });
  });

  sleep(0.5);

  // ══════════════════════════════════════════════
  //  NALAZI — NFR-01, NFR-17
  // ══════════════════════════════════════════════

  // ── 2. GET /nalazi/pacijent/:id — bez tokena (NFR-17) ─────────────────
  group('GET /nalazi/pacijent/:id - bez tokena (NFR-17)', () => {
    const res = http.get(`${BASE_URL}/nalazi/pacijent/1`, {
      headers: jsonHeaders,
    });

    check(res, {
      // Nalazi moraju biti zaštićeni — 401 bez tokena (NFR-17)
      'status je 401 (NFR-17)': (r) => r.status === 401,
    });
  });

  sleep(0.5);

  // ── 3. GET /nalazi/pacijent/:id — pacijent dohvata svoje nalaze ────────
  group('GET /nalazi/pacijent/:id - pacijent svoje nalaze (NFR-01)', () => {
    if (!pacijentToken || !pacijentBazaId) {
      console.warn('⚠️  Preskačem — nema pacijent tokena ili ID-a');
      return;
    }

    const res = http.get(`${BASE_URL}/nalazi/pacijent/${pacijentBazaId}`, {
      headers: pacijentHeaders,
    });

    check(res, {
      'status je 200': (r) => r.status === 200,
      'vraća niz': (r) => Array.isArray(r.json()),
      'response < 16000ms': (r) => r.timings.duration < 16000,
    });
  });

  sleep(0.5);

  // ── 4. GET /nalazi/pacijent/:id — pacijent tuđe nalaze (NFR-01, NFR-06) 
  group('GET /nalazi/pacijent/999999 - pacijent tuđe nalaze (NFR-01)', () => {
    if (!pacijentToken) return;

    const res = http.get(`${BASE_URL}/nalazi/pacijent/999999`, {
      headers: pacijentHeaders,
    });

    check(res, {
      // Pacijent ne smije vidjeti tuđe nalaze — 403 (NFR-01)
      'status je 403 (NFR-01)': (r) => r.status === 403,
      'ima poruku zabrane': (r) => r.json('poruka') !== null,
    });
  });

  sleep(0.5);

  // ── 5. GET /nalazi/pacijent/:id — admin može vidjeti (NFR-06) ─────────
  group('GET /nalazi/pacijent/:id - admin pristup (NFR-06)', () => {
    if (!adminToken || !pacijentBazaId) return;

    const res = http.get(`${BASE_URL}/nalazi/pacijent/${pacijentBazaId}`, {
      headers: adminHeaders,
    });

    check(res, {
      'status je 200 (admin ima pristup)': (r) => r.status === 200,
      'response < 1000ms': (r) => r.timings.duration < 1000,
    });
  });

  sleep(0.5);

  // ── 6. GET /nalazi/:id/pdf — bez tokena ───────────────────────────────
  group('GET /nalazi/:id/pdf - bez tokena (NFR-17)', () => {
    const res = http.get(`${BASE_URL}/nalazi/1/pdf`, {
      headers: jsonHeaders,
    });

    check(res, {
      'status je 401 (NFR-17)': (r) => r.status === 401,
    });
  });

  sleep(0.5);

  // ── 7. GET /nalazi/:id/pdf — nepostojeći nalaz ────────────────────────
  group('GET /nalazi/999999/pdf - nepostojeći nalaz', () => {
    if (!pacijentToken) return;

    const res = http.get(`${BASE_URL}/nalazi/999999/pdf`, {
      headers: pacijentHeaders,
    });

    check(res, {
      'status je 404': (r) => r.status === 404,
    });
  });

  sleep(0.5);

  // ── 8. GET /nalazi/rezervacija/:id — bez tokena ───────────────────────
  group('GET /nalazi/rezervacija/:id - bez tokena', () => {
    const res = http.get(`${BASE_URL}/nalazi/rezervacija/1`, {
      headers: jsonHeaders,
    });

    check(res, {
      'status je 401': (r) => r.status === 401,
    });
  });

  sleep(0.5);

  // ══════════════════════════════════════════════
  //  LISTA ČEKANJA
  // ══════════════════════════════════════════════

  // ── 9. GET /lista-cekanja/moja — bez tokena ───────────────────────────
  group('GET /lista-cekanja/moja - bez tokena', () => {
    const res = http.get(`${BASE_URL}/lista-cekanja/moja`, {
      headers: jsonHeaders,
    });

    check(res, {
      'status je 401': (r) => r.status === 401,
    });
  });

  sleep(0.5);

  // ── 10. GET /lista-cekanja/moja — pacijent dohvata svoju listu ────────
  group('GET /lista-cekanja/moja - pacijent', () => {
    if (!pacijentToken) return;

    const res = http.get(`${BASE_URL}/lista-cekanja/moja`, {
      headers: pacijentHeaders,
    });

    check(res, {
      'status je 200': (r) => r.status === 200,
      'vraća niz': (r) => Array.isArray(r.json()),
      'response < 1000ms': (r) => r.timings.duration < 1000,
    });
  });

  sleep(0.5);

  // ── 11. GET /lista-cekanja/moja — admin ne smije (RBAC, NFR-06) ───────
  group('GET /lista-cekanja/moja - admin (RBAC NFR-06)', () => {
    if (!adminToken) return;

    const res = http.get(`${BASE_URL}/lista-cekanja/moja`, {
      headers: adminHeaders,
    });

    check(res, {
      // Samo PACIJENT smije koristiti ovu rutu — admin dobija 403
      'admin dobija 403 (RBAC)': (r) => r.status === 403,
    });
  });

  sleep(0.5);

  // ── 12. POST /lista-cekanja — nedostaju polja ─────────────────────────
  group('POST /lista-cekanja - nedostaju polja', () => {
    if (!pacijentToken) return;

    const res = http.post(
      `${BASE_URL}/lista-cekanja`,
      JSON.stringify({
        // doktorId nedostaje
        zeleniDatum: '2026-08-01',
      }),
      { headers: pacijentHeaders }
    );

    check(res, {
      'status je 400': (r) => r.status === 400,
      'ima poruku greške': (r) => r.json('poruka') !== null,
    });
  });

  sleep(0.5);

  // ── 13. POST /lista-cekanja — bez tokena ──────────────────────────────
  group('POST /lista-cekanja - bez tokena', () => {
    const res = http.post(
      `${BASE_URL}/lista-cekanja`,
      JSON.stringify({ doktorId: 1, zeleniDatum: '2026-08-01' }),
      { headers: jsonHeaders }
    );

    check(res, {
      'status je 401': (r) => r.status === 401,
    });
  });

  sleep(0.5);

  // ── 14. POST /lista-cekanja — admin ne smije (RBAC) ───────────────────
  group('POST /lista-cekanja - admin (RBAC)', () => {
    if (!adminToken) return;

    const res = http.post(
      `${BASE_URL}/lista-cekanja`,
      JSON.stringify({ doktorId: 1, zeleniDatum: '2026-08-01' }),
      { headers: adminHeaders }
    );

    check(res, {
      'admin dobija 403 (RBAC)': (r) => r.status === 403,
    });
  });

  sleep(0.5);

  // ── 15. DELETE /lista-cekanja/:id — bez tokena ────────────────────────
  group('DELETE /lista-cekanja/:id - bez tokena', () => {
    const res = http.del(`${BASE_URL}/lista-cekanja/1`, null, {
      headers: jsonHeaders,
    });

    check(res, {
      'status je 401': (r) => r.status === 401,
    });
  });

  sleep(0.5);

  // ── 16. DELETE /lista-cekanja/:id — nepostojeći ID ───────────────────
  group('DELETE /lista-cekanja/999999 - nepostojeći', () => {
    if (!pacijentToken) return;

    const res = http.del(`${BASE_URL}/lista-cekanja/999999`, null, {
      headers: pacijentHeaders,
    });

    check(res, {
      'status je 404 ili 400': (r) => r.status === 404 || r.status === 400,
    });
  });

  sleep(0.5);

  // ── 17. GET /lista-cekanja/:id/pregled-potvrde — bez tokena ──────────
  group('GET /lista-cekanja/:id/pregled-potvrde - bez tokena', () => {
    const res = http.get(`${BASE_URL}/lista-cekanja/1/pregled-potvrde`, {
      headers: jsonHeaders,
    });

    check(res, {
      'status je 401': (r) => r.status === 401,
    });
  });

  sleep(0.5);

  // ── 18. GET /lista-cekanja/:id/pregled-potvrde — pacijent sa tokenom ──
  group('GET /lista-cekanja/:id/pregled-potvrde - pacijent', () => {
    if (!pacijentToken || !listaCekanjaId) {
      console.warn('⚠️  Preskačem — nema liste čekanja za test');
      return;
    }

    const res = http.get(
      `${BASE_URL}/lista-cekanja/${listaCekanjaId}/pregled-potvrde`,
      { headers: pacijentHeaders }
    );

    check(res, {
      'status je 200': (r) => r.status === 200,
      'ima kasnijeTermine': (r) => r.json('kasnijiTermini') !== null,
      'response < 1000ms': (r) => r.timings.duration < 1000,
    });
  });

  sleep(1);
}

export function teardown(data) {
  console.log('✅ Lista čekanja / Nalazi / Odjeli testovi završeni');
}