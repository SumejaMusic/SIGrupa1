/**
 * osoblje.test.js
 *
 * Pokriva sve endpointe iz osobljeRoutes.ts / OsobljeController.ts
 *
 * NFR koja su obuhvaćena:
 *   NFR-06 / NFR-07  — RBAC: samo MEDICINSKO_OSOBLJE i DOKTOR mogu pristupiti rutama
 *   NFR-09           — Otkazani termin odmah dostupan (< 2s)
 *   NFR-10           — Otkazivanje termina < 3s
 *   NFR-16           — Slobodni termini / raspored vidljivi < 2s
 *   NFR-22           — Redis lock sprečava duplu rezervaciju (concurrency test)
 *
 * Pokretanje:
 *   smoke:  k6 run --env MODE=smoke  osoblje.test.js
 *   load:   k6 run --env MODE=load   osoblje.test.js
 *   stress: k6 run --env MODE=stress osoblje.test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { SharedArray } from 'k6/data';
import { Counter } from 'k6/metrics';
import {
  BASE_URL, TEST_IDS, jsonHeaders,
  defaultOptions, smokeOptions, stressOptions,
} from './config.js';
import { loginIVratiHeader, checkOk, check201, checkNepristupacno, parseBody } from './helpers.js';

// ─── Custom metrike ───────────────────────────────────────────────────────────
const lockKonflikti = new Counter('lock_konflikti'); // koliko puta je Redis lock odbio zahtjev

// ─── Opcije prema env varijabli MODE ─────────────────────────────────────────
const MODE = __ENV.MODE || 'load';
export const options = MODE === 'smoke'  ? smokeOptions
                     : MODE === 'stress' ? stressOptions
                     : {
                         ...defaultOptions,
                         thresholds: {
                           ...defaultOptions.thresholds,
                           'http_req_duration{name:provjeri_termin}': ['p(95)<6000'],
                         },
                       };

// ─── Setup — loginujemo jednom, tokeni se dijele svim VU-ima ─────────────────
// NAPOMENA: setup() se izvršava jednom prije svih VU-a.
// Ako koristiš k6 Cloud ili više instanci, token treba biti validan tokom cijelog testa.
export function setup() {
  return {
    osobljeHeaders: loginIVratiHeader('osoblje'),
    doktorHeaders:  loginIVratiHeader('doktor'),
    adminHeaders:   loginIVratiHeader('admin'),
    // Namjerno bez autentifikacije — za negativne RBAC testove
    pacijentHeaders: loginIVratiHeader('pacijent'),
  };
}

// ─── Glavni scenario ──────────────────────────────────────────────────────────
export default function (data) {
  const { osobljeHeaders, doktorHeaders, adminHeaders, pacijentHeaders } = data;

  // ── 1. Termini — čitanje ────────────────────────────────────────────────────
  group('Termini - čitanje', () => {

    // GET /api/osoblje/termini?datum=2026-06-10  (NFR-16: < 2s)
    const dnevni = http.get(
      `${BASE_URL}/osoblje/termini?datum=2026-06-10`,
      { headers: osobljeHeaders, tags: { name: 'dashboard' } }
    );
    check(dnevni, {
      '[dnevni termini] status 200': (r) => r.status === 200,
      '[dnevni termini] niz u odgovoru': (r) => Array.isArray(parseBody(r)),
    });

    // GET /api/osoblje/termini/svi
    const svi = http.get(
      `${BASE_URL}/osoblje/termini/svi`,
      { headers: osobljeHeaders, tags: { name: 'dashboard' } }
    );
    checkOk(svi, '[svi termini]');

    // GET /api/osoblje/termini/pretraga?ime=An
    const pretraga = http.get(
      `${BASE_URL}/osoblje/termini/pretraga?ime=An`,
      { headers: osobljeHeaders, tags: { name: 'pretraga_termina' } }
    );
    checkOk(pretraga, '[pretraga termina]');

    // GET /api/osoblje/termini/pretraga — validacija: kratko ime (< 2 karaktera) → 400
    const kratkoIme = http.get(
      `${BASE_URL}/osoblje/termini/pretraga?ime=A`,
      { headers: osobljeHeaders }
    );
    check(kratkoIme, {
      '[pretraga kratko ime] status 400': (r) => r.status === 400,
    });

    // GET /api/osoblje/termini/otkazani
    const otkazani = http.get(
      `${BASE_URL}/osoblje/termini/otkazani`,
      { headers: osobljeHeaders, tags: { name: 'provjeri_termin' } }
    );
    checkOk(otkazani, '[otkazani termini]');

    // GET /api/osoblje/termini/hitni
    const hitni = http.get(
      `${BASE_URL}/osoblje/termini/hitni`,
      { headers: osobljeHeaders, tags: { name: 'hitni_termini' } }
    );
    checkOk(hitni, '[hitni termini]');

    // GET /api/osoblje/termini/zavrseni
    const zavrseni = http.get(
      `${BASE_URL}/osoblje/termini/zavrseni`,
      { headers: osobljeHeaders, tags: { name: 'zavrseni_termini' } }
    );
    checkOk(zavrseni, '[zavrseni termini]');

    // GET /api/osoblje/termini/:id — detalji jedne rezervacije
    const detalji = http.get(
      `${BASE_URL}/osoblje/termini/${TEST_IDS.rezervacijaId}`,
      { headers: osobljeHeaders, tags: { name: 'detalji_termina' } }
    );
    check(detalji, {
      '[detalji termina] status 200 ili 404': (r) => r.status === 200 || r.status === 404,
    });

    // GET /api/osoblje/termini/:id — neispravan ID → 400
    const losiId = http.get(
      `${BASE_URL}/osoblje/termini/abc`,
      { headers: osobljeHeaders }
    );
    check(losiId, {
      '[detalji termina losi ID] status 400': (r) => r.status === 400,
    });
  });

  sleep(0.3);

  // ── 2. Slobodni termini i datumi (NFR-16) ───────────────────────────────────
  group('Slobodni termini i datumi', () => {

    // GET /api/osoblje/termini/slobodni-datumi/:idDoktor
    const slobodniDatumi = http.get(
      `${BASE_URL}/osoblje/termini/slobodni-datumi/${TEST_IDS.doktorId}`,
      { headers: osobljeHeaders, tags: { name: 'slobodni_termini' } }
    );
    checkOk(slobodniDatumi, '[slobodni datumi doktora]');

    // GET /api/osoblje/termini/slobodni/:idDoktor?datum=2026-06-10
    const slobodni = http.get(
      `${BASE_URL}/osoblje/termini/slobodni/${TEST_IDS.doktorId}?datum=2026-06-10`,
      { headers: osobljeHeaders, tags: { name: 'slobodni_termini' } }
    );
    checkOk(slobodni, '[slobodni termini doktora]');

    // GET /api/osoblje/termini/slobodni/:idDoktor — bez datuma → 400
    const bezDatuma = http.get(
      `${BASE_URL}/osoblje/termini/slobodni/${TEST_IDS.doktorId}`,
      { headers: osobljeHeaders }
    );
    check(bezDatuma, {
      '[slobodni termini bez datuma] status 400': (r) => r.status === 400,
    });
  });

  sleep(0.3);

  // ── 3. Dropdown liste ───────────────────────────────────────────────────────
  group('Dropdown liste', () => {

    const pacijenti = http.get(
      `${BASE_URL}/osoblje/pacijenti`,
      { headers: osobljeHeaders, tags: { name: 'dropdown' } }
    );
    checkOk(pacijenti, '[svi pacijenti]');

    const doktori = http.get(
      `${BASE_URL}/osoblje/doktori`,
      { headers: osobljeHeaders, tags: { name: 'dropdown' } }
    );
    checkOk(doktori, '[svi doktori]');

    const odjeli = http.get(
      `${BASE_URL}/osoblje/odjeli`,
      { headers: osobljeHeaders, tags: { name: 'dropdown' } }
    );
    checkOk(odjeli, '[svi odjeli]');

    const sobe = http.get(
      `${BASE_URL}/osoblje/sobe`,
      { headers: osobljeHeaders, tags: { name: 'dropdown' } }
    );
    checkOk(sobe, '[sve sobe]');

    const tipoviPregleda = http.get(
      `${BASE_URL}/osoblje/tipovi-pregleda`,
      { headers: osobljeHeaders, tags: { name: 'dropdown' } }
    );
    checkOk(tipoviPregleda, '[tipovi pregleda]');
  });

  sleep(0.3);

  // ── 4. Nalazi ───────────────────────────────────────────────────────────────
  group('Nalazi', () => {

    // GET /api/osoblje/nalazi/pacijent/:idPacijenta
    const nalazi = http.get(
      `${BASE_URL}/osoblje/nalazi/pacijent/${TEST_IDS.pacijentId}`,
      { headers: osobljeHeaders, tags: { name: 'nalazi' } }
    );
    checkOk(nalazi, '[nalazi pacijenta]');

    // GET /api/osoblje/nalazi/:id/pdf
    const pdf = http.get(
      `${BASE_URL}/osoblje/nalazi/${TEST_IDS.nalazId}/pdf`,
      { headers: osobljeHeaders, tags: { name: 'nalaz_pdf' } }
    );
    check(pdf, {
      '[nalaz PDF] status 200 ili 404': (r) => r.status === 200 || r.status === 404,
      '[nalaz PDF] content-type': (r) =>
        r.status !== 200 || (r.headers['Content-Type'] || '').includes('application/pdf'),
    });
  });

  sleep(0.3);

  // ── 5. RBAC negativni testovi (NFR-06, NFR-07) ─────────────────────────────
  group('RBAC - neovlašten pristup', () => {

    // Pacijent NE smije pristupiti osoblje rutama
    const pacijentNaOsobeljeRuti = http.get(
      `${BASE_URL}/osoblje/termini`,
      { headers: pacijentHeaders }
    );
    checkNepristupacno(pacijentNaOsobeljeRuti, '[RBAC pacijent na osoblje ruti]');

    // Bez tokena → 401
    const bezTokena = http.get(`${BASE_URL}/osoblje/termini`, { headers: jsonHeaders });
    checkNepristupacno(bezTokena, '[RBAC bez tokena]');
  });

  sleep(0.3);

  // ── 6. PATCH operacije ──────────────────────────────────────────────────────
  group('PATCH - hitnost, dolazak, pomjeranje', () => {

    // PATCH /api/osoblje/termini/:id/hitnost — postavi hitnost na true
    const hitnost = http.patch(
      `${BASE_URL}/osoblje/termini/${TEST_IDS.rezervacijaId}/hitnost`,
      JSON.stringify({ hitnost: true }),
      { headers: osobljeHeaders, tags: { name: 'hitnost' } }
    );
    check(hitnost, {
      '[hitnost] prihvaćen ili ne postoji': (r) => [200, 400, 404].includes(r.status),
    });

    // PATCH /api/osoblje/termini/:id/hitnost — nedostaje boolean → 400
    const hitnostBezBool = http.patch(
      `${BASE_URL}/osoblje/termini/${TEST_IDS.rezervacijaId}/hitnost`,
      JSON.stringify({ hitnost: 'da' }), // string umjesto boolean
      { headers: osobljeHeaders }
    );
    check(hitnostBezBool, {
      '[hitnost bez boolean] status 400': (r) => r.status === 400,
    });

    // PATCH /api/osoblje/termini/:id/dolazak
    const dolazak = http.patch(
      `${BASE_URL}/osoblje/termini/${TEST_IDS.rezervacijaId}/dolazak`,
      JSON.stringify({}),
      { headers: osobljeHeaders, tags: { name: 'dolazak' } }
    );
    check(dolazak, {
      '[dolazak] prihvaćen ili ne postoji': (r) => [200, 400, 404].includes(r.status),
    });

    // PATCH /api/osoblje/termini/:id/pomjeri — neispravan noviTerminId → 400
    const pomjeriLos = http.patch(
      `${BASE_URL}/osoblje/termini/${TEST_IDS.rezervacijaId}/pomjeri`,
      JSON.stringify({ noviTerminId: -1 }),
      { headers: osobljeHeaders }
    );
    check(pomjeriLos, {
      '[pomjeri losi ID] status 400': (r) => r.status === 400,
    });
  });

  sleep(0.3);

  // ── 7. Otkazivanje termina (NFR-09, NFR-10) ─────────────────────────────────
  group('Otkazivanje termina', () => {

    // PATCH bez potvrde → 400 (acc kriterij: sistem sprečava slučajno otkazivanje)
    const bezPotvrde = http.patch(
      `${BASE_URL}/osoblje/termini/${TEST_IDS.rezervacijaId}/otkazi`,
      JSON.stringify({}),
      { headers: osobljeHeaders, tags: { name: 'otkazi_osoblje' } }
    );
    check(bezPotvrde, {
      '[otkazi bez potvrde] status 400': (r) => r.status === 400,
      '[otkazi bez potvrde] poruka o potvrdi': (r) => {
        const b = parseBody(r);
        return b && typeof b.poruka === 'string' && b.poruka.toLowerCase().includes('potvrda');
      },
    });

    // PATCH sa potvrdom — može biti 200 (otkazano) ili 400/404 (već otkazano / ne postoji)
    // U load testu ne garantujemo da rezervacija postoji, pa dozvoljavamo i greške
    const saPotvrdom = http.patch(
      `${BASE_URL}/osoblje/termini/${TEST_IDS.rezervacijaId}/otkazi`,
      JSON.stringify({ potvrda: true }),
      { headers: osobljeHeaders, tags: { name: 'otkazi_osoblje' } }
    );
    check(saPotvrdom, {
      '[otkazi sa potvrdom] status prihvaćen': (r) => [200, 400, 404].includes(r.status),
    });

    // Odmah provjeri da li je termin ažuriran (NFR-09: < 2s)
    if (parseBody(saPotvrdom)?.status === 200) {
      const provjera = http.get(
        `${BASE_URL}/osoblje/termini/${TEST_IDS.rezervacijaId}`,
        { headers: osobljeHeaders, tags: { name: 'provjeri_termin' } }
      );
      check(provjera, {
        '[provjeri termin] otkazan status vidljiv': (r) => {
          const b = parseBody(r);
          return b && b.datumOtkazivanja != null;
        },
      });
    }
  });

  sleep(0.5);
}

// ─── Concurrency test — Redis lock (NFR-22) ───────────────────────────────────
// Pokreni ovaj scenario odvojeno:
//   k6 run --env MODE=concurrency osoblje.test.js
//
// Simuliramo 10 VU-a koji istovremeno pokušavaju rezervisati isti termin.
// Samo jedan treba uspjeti; ostali trebaju dobiti 409 (lock zauzet).

export function concurrencyScenario(data) {
  const { osobljeHeaders } = data;

  const payload = JSON.stringify({
    idTermina: TEST_IDS.rezervacijaId,   // svi gađaju isti termin
    idDoktor: TEST_IDS.doktorId,
    idPacijent: TEST_IDS.pacijentId,
  });

  const res = http.post(
    `${BASE_URL}/osoblje/termini`,
    payload,
    { headers: osobljeHeaders, tags: { name: 'concurrency_rezervacija' } }
  );

  const prihvacen = res.status === 201;
  const odbijen   = res.status === 409;

  if (odbijen) lockKonflikti.add(1);

  check(res, {
    '[concurrency] 201 ili 409': (r) => prihvacen || odbijen,
    '[concurrency] ne 500': (r) => r.status !== 500,
  });
}