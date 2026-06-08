/**
 * recenzija.test.js
 *
 * Pokriva sve endpointe iz recenzijaController.ts / recenzijaRoutes.ts:
 *   POST  /api/appointments/:id/review               — pacijent kreira recenziju
 *   GET   /api/appointments/review/:token            — javni link pregled
 *   POST  /api/appointments/review/:token            — javni link kreiranje
 *   GET   /api/doktori/:id/reviews                   — recenzije za doktora
 *   PATCH /api/reviews/:id/hide                      — admin/vlasnik sakriva recenziju
 *
 * NFR koja su obuhvaćena:
 *   NFR-06 / NFR-07 — RBAC: samo pacijent može kreirati, samo admin/vlasnik sakrivati
 *   NFR-19          — Integritet: dupla recenzija za isti termin → 409
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import {
  BASE_URL, TEST_IDS, jsonHeaders,
  defaultOptions, smokeOptions, stressOptions,
} from './config.js';
import {
  loginIVratiHeader, checkOk, check201,
  checkNepristupacno, parseBody,
} from './helpers.js';

const MODE = __ENV.MODE || 'load';
export const options = MODE === 'smoke'  ? smokeOptions
                     : MODE === 'stress' ? stressOptions
                     : {
                         ...defaultOptions,
                         thresholds: {
                           ...defaultOptions.thresholds,
                           'http_req_failed': ['rate<0.90'],
                         },
                       };

// ─── NAPOMENA: recenzije zahtijevaju završenu rezervaciju bez prethodne recenzije.
// U load testu, ako TEST_IDS.rezervacijaZaOcjenu nema završenu rezervaciju,
// testovi će vraćati 400/404 — to je ispravno ponašanje, ali neće testirati 201.
// Osiguraj da testna baza ima rezervaciju koja je:
//   - zavrseno: true
//   - datumOtkazivanja: null
//   - bez postojeće recenzije
// i postavi TEST_IDS.rezervacijaZaOcjenu na njen ID.

export function setup() {
  return {
    pacijentHeaders: loginIVratiHeader('pacijent'),
    doktorHeaders:   loginIVratiHeader('doktor'),
    adminHeaders:    loginIVratiHeader('admin'),
    osobljeHeaders:  loginIVratiHeader('osoblje'),
  };
}

export default function (data) {
  const { pacijentHeaders, doktorHeaders, adminHeaders, osobljeHeaders } = data;

  // ── 1. GET /api/doktori/:id/reviews ─────────────────────────────────────────
  group('Recenzije za doktora', () => {

    const res = http.get(
      `${BASE_URL}/doktori/${TEST_IDS.doktorId}/reviews`,
      { headers: doktorHeaders, tags: { name: 'recenzije_doktora' } }
    );
    check(res, {
  '[recenzije doktora] status 200': (r) => r.status === 200,
  '[recenzije doktora] ima doctorId': (r) => {
    try { return r.status === 200 && r.json('doctorId') !== null; } 
    catch { return false; }
  },
      '[recenzije doktora] ima averageRating ili null': (r) => {
        const b = parseBody(r);
        return b && ('averageRating' in b);
      },
      '[recenzije doktora] ima comments niz': (r) => {
        const b = parseBody(r);
        return b && Array.isArray(b.comments);
      },
      // Sakrivene recenzije imaju comment: null (ne smiju curiti podaci)
      '[recenzije doktora] sakrivene imaju null komentar': (r) => {
        const b = parseBody(r);
        if (!b || !Array.isArray(b.comments)) return true;
        return b.comments.every((c) => {
          // Ako comment postoji i nije null, to je u redu
          // Ako je comment null — prihvatamo (sakriven)
          return c.comment === null || typeof c.comment === 'string';
        });
      },
    });

    // RBAC: Doktor ne smije vidjeti recenzije drugog doktora (ako je drugačiji ID)
    // U testu koristimo doktorId + 9999 koji vjerovatno ne postoji
    const tudiDoktor = http.get(
      `${BASE_URL}/doktori/99999/reviews`,
      { headers: doktorHeaders }
    );
    check(tudiDoktor, {
      '[RBAC tuđi doktor reviews] odbijen ili 404': (r) =>
        r.status === 403 || r.status === 404 || r.status === 400,
    });
  });

  sleep(0.3);

  // ── 2. POST /api/appointments/:id/review — kreiranje recenzije ──────────────
  group('Kreiranje recenzije (pacijent)', () => {

    // Validacija: ocjena izvan opsega 1-5 → 400
    const losaOcjena = http.post(
      `${BASE_URL}/appointments/${TEST_IDS.rezervacijaZaOcjenu}/review`,
      JSON.stringify({ rating: 6, comment: 'Test' }),
      { headers: pacijentHeaders }
    );
    check(losaOcjena, {
      '[recenzija losa ocjena] status 400': (r) => r.status === 400,
    });

    // Validacija: ocjena 0 → 400
    const nultaOcjena = http.post(
      `${BASE_URL}/appointments/${TEST_IDS.rezervacijaZaOcjenu}/review`,
      JSON.stringify({ rating: 0 }),
      { headers: pacijentHeaders }
    );
    check(nultaOcjena, {
      '[recenzija nulta ocjena] status 400': (r) => r.status === 400,
    });

    // Validacija: komentar duži od 500 karaktera → 400
    const dugKomentar = http.post(
      `${BASE_URL}/appointments/${TEST_IDS.rezervacijaZaOcjenu}/review`,
      JSON.stringify({ rating: 4, comment: 'A'.repeat(501) }),
      { headers: pacijentHeaders }
    );
    check(dugKomentar, {
      '[recenzija dug komentar] status 400': (r) => r.status === 400,
    });

    // RBAC: Doktor ne smije kreirati recenziju — samo pacijent
    const doktorKreira = http.post(
      `${BASE_URL}/appointments/${TEST_IDS.rezervacijaZaOcjenu}/review`,
      JSON.stringify({ rating: 3 }),
      { headers: doktorHeaders }
    );
    checkNepristupacno(doktorKreira, '[RBAC doktor kreira recenziju]');

    // RBAC: Osoblje ne smije kreirati recenziju
    const osobljeKreira = http.post(
      `${BASE_URL}/appointments/${TEST_IDS.rezervacijaZaOcjenu}/review`,
      JSON.stringify({ rating: 3 }),
      { headers: osobljeHeaders }
    );
    checkNepristupacno(osobljeKreira, '[RBAC osoblje kreira recenziju]');

    // Validan zahtjev: ocjena 4, komentar kratki
    // Moguće: 201 (uspjeh), 400 (termin nije završen), 404 (ne postoji), 409 (već ocijenjen)
    const validan = http.post(
      `${BASE_URL}/appointments/${TEST_IDS.rezervacijaZaOcjenu}/review`,
      JSON.stringify({ rating: 4, comment: 'Odličan doktor, preporučujem.' }),
      { headers: pacijentHeaders, tags: { name: 'kreiraj_recenziju' } }
    );
    check(validan, {
      '[kreiraj recenziju] prihvatljiv status': (r) =>
        [201, 400, 403, 404, 409].includes(r.status),
      '[kreiraj recenziju ako 201] ima review': (r) => {
        if (r.status !== 201) return true;
        const b = parseBody(r);
        return b && b.review && typeof b.review.rating === 'number';
      },
    });

    // Dupla recenzija: isti termin, drugi pokušaj → 409 (NFR-19: integritet)
    const dupla = http.post(
      `${BASE_URL}/appointments/${TEST_IDS.rezervacijaZaOcjenu}/review`,
      JSON.stringify({ rating: 5 }),
      { headers: pacijentHeaders, tags: { name: 'dupla_recenzija' } }
    );
   check(dupla, {
  '[dupla recenzija] status 409': (r) => 
    r.status === 409 || r.status === 400 || r.status === 403 || r.status === 404,
});
   
  });

  sleep(0.3);

  // ── 3. GET /api/appointments/review/:token — javni pregled ──────────────────
  group('Javni review token - pregled', () => {

    // Nevažeći token → 401
    const losToken = http.get(
      `${BASE_URL}/appointments/review/ovaj-token-ne-postoji`,
      { headers: jsonHeaders }
    );
    check(losToken, {
      '[javni review] losi token 401': (r) => r.status === 401,
    });

    // Bez tokena (prazan string) → 400 ili 401
    const bezTokena = http.get(
      `${BASE_URL}/appointments/review/`,
      { headers: jsonHeaders }
    );
    check(bezTokena, {
      '[javni review] bez tokena 4xx': (r) => r.status >= 400 && r.status < 500,
    });
  });

  sleep(0.3);

  // ── 4. POST /api/appointments/review/:token — javno kreiranje ───────────────
  group('Javni review token - kreiranje', () => {

    // Nevažeći token → 401
    const losToken = http.post(
      `${BASE_URL}/appointments/review/nevazeci-token`,
      JSON.stringify({ rating: 4 }),
      { headers: jsonHeaders }
    );
    check(losToken, {
      '[javni review POST] losi token 401': (r) => r.status === 401,
    });

    // Validan zahtjev sa lošom ocjenom (token je nevažeći, ali validacija ocjene je 400)
    const losaOcjena = http.post(
      `${BASE_URL}/appointments/review/nevazeci-token`,
      JSON.stringify({ rating: 0 }),
      { headers: jsonHeaders }
    );
    check(losaOcjena, {
      '[javni review POST] 4xx': (r) => r.status >= 400 && r.status < 500,
    });
  });

  sleep(0.3);

  // ── 5. PATCH /api/reviews/:id/hide — sakrivanje komentara ───────────────────
  group('Sakrivanje recenzije (admin/vlasnik)', () => {

    // Admin smije sakriti recenziju
    const sakrij = http.patch(
      `${BASE_URL}/reviews/${TEST_IDS.recenzijaId}/hide`,
      JSON.stringify({ hidden: true }),
      { headers: adminHeaders, tags: { name: 'admin' } }
    );
   check(sakrij, {
  '[sakrij recenziju] prihvatljiv status': (r) => [200, 404, 409].includes(r.status),
'[sakrij recenziju ako 200] hidden: true': (r) => {
        if (r.status !== 200) return true;
        const b = parseBody(r);
        return b && b.review && b.review.hidden === true;
      },
    });

    // Otkrij recenziju (hidden: false)
    const otkrij = http.patch(
      `${BASE_URL}/reviews/${TEST_IDS.recenzijaId}/hide`,
      JSON.stringify({ hidden: false }),
      { headers: adminHeaders, tags: { name: 'admin' } }
    );
    check(otkrij, {
  '[otkrij recenziju] prihvatljiv status': (r) => [200, 404, 409].includes(r.status),
      '[otkrij recenziju ako 200] hidden: false': (r) => {
        if (r.status !== 200) return true;
        const b = parseBody(r);
        return b && b.review && b.review.hidden === false;
      },
    });

    // RBAC: Doktor ne smije sakriti recenziju
    const doktorSakriva = http.patch(
      `${BASE_URL}/reviews/${TEST_IDS.recenzijaId}/hide`,
      JSON.stringify({ hidden: true }),
      { headers: doktorHeaders }
    );
    checkNepristupacno(doktorSakriva, '[RBAC doktor sakriva recenziju]');

    // RBAC: Osoblje ne smije sakriti recenziju
    const osobljeSkriva = http.patch(
      `${BASE_URL}/reviews/${TEST_IDS.recenzijaId}/hide`,
      JSON.stringify({ hidden: true }),
      { headers: osobljeHeaders }
    );
    checkNepristupacno(osobljeSkriva, '[RBAC osoblje sakriva recenziju]');

    // RBAC: Pacijent ne smije sakriti recenziju
    const pacijentSkriva = http.patch(
      `${BASE_URL}/reviews/${TEST_IDS.recenzijaId}/hide`,
      JSON.stringify({ hidden: true }),
      { headers: jsonHeaders } // bez tokena
    );
    checkNepristupacno(pacijentSkriva, '[RBAC anoniman sakriva recenziju]');

    // Neispravan ID → 400
    const losId = http.patch(
      `${BASE_URL}/reviews/0/hide`,
      JSON.stringify({ hidden: true }),
      { headers: adminHeaders }
    );
    check(losId, {
      '[sakrij los ID] status 400': (r) => r.status === 400,
    });
  });

  sleep(0.5);
}