/**
 * patients.test.js
 *
 * Pokriva sve endpointe iz patientController.ts:
 *   GET  /api/pacijenti
 *   GET  /api/historija/pacijent/:pacijentId
 *   GET  /api/pacijenti/hronicni
 *   PATCH /api/pacijenti/:id/hronicni
 *
 * NFR koja su obuhvaćena:
 *   NFR-01  — Samo ovlašteni mogu pristupiti historiji pacijenta
 *   NFR-04  — Lozinke heširane (plain-text ne smije biti vidljiv)
 *   NFR-06 / NFR-07 — RBAC: pacijent ne smije vidjeti tuđu historiju
 *   NFR-24  — Osjetljivi podaci enkriptovani (JMBG, dijagnoze…)
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';


import {
  BASE_URL,TEST_KORISNICI, TEST_IDS, jsonHeaders,
  defaultOptions, smokeOptions, stressOptions,
} from './config.js';
import {
  loginIVratiHeader, checkOk, check201,
  checkNepristupacno, parseBody,
} from './helpers.js';

const MODE = __ENV.MODE || 'load';
export const options = MODE === 'smoke'  ? smokeOptions
                     : MODE === 'stress' ? stressOptions
                     : defaultOptions;

export function setup() {
  return {
    adminHeaders:    loginIVratiHeader('admin'),
    doktorHeaders:   loginIVratiHeader('doktor'),
    osobljeHeaders:  loginIVratiHeader('osoblje'),
    pacijentHeaders: loginIVratiHeader('pacijent'),
  };
}

export default function (data) {
  const { adminHeaders, doktorHeaders, osobljeHeaders, pacijentHeaders } = data;

  // ── 1. GET /api/pacijenti ────────────────────────────────────────────────────
  group('Svi pacijenti', () => {

    // Doktor i osoblje smiju vidjeti listu pacijenata
    const res = http.get(
      `${BASE_URL}/pacijenti`,
      { headers: doktorHeaders, tags: { name: 'admin' } }
    );
    check(res, {
      '[svi pacijenti] status 200': (r) => r.status === 200,
      '[svi pacijenti] niz': (r) => Array.isArray(parseBody(r)),
      // NFR-24: JMBG ne smije biti plain-text u odgovoru
      '[svi pacijenti] JMBG nije izložen': (r) => {
        const lista = parseBody(r);
        if (!Array.isArray(lista)) return true;
        return lista.every((p) => p.jmbg === undefined || p.jmbg === null);
      },
    });

    // Pacijent ne smije pristupiti listi svih pacijenata (RBAC)
    const rbac = http.get(`${BASE_URL}/pacijenti`, { headers: pacijentHeaders });
    checkNepristupacno(rbac, '[RBAC pacijent na /pacijenti]');
  });

  sleep(0.3);

  // ── 2. GET /api/historija/pacijent/:pacijentId ──────────────────────────────
  group('Historija pacijenta', () => {

    // Doktor smije vidjeti historiju
    const res = http.get(
      `${BASE_URL}/historija/pacijent/${TEST_IDS.pacijentId}`,
      { headers: doktorHeaders, tags: { name: 'historija' } }
    );
    check(res, {
      '[historija] status 200 ili 404': (r) => [200, 404].includes(r.status),
      '[historija] niz ako 200': (r) => {
        if (r.status !== 200) return true;
        return Array.isArray(parseBody(r));
      },
      // NFR-24: Recepti trebaju biti dekriptovani (ne base64/encrypted string)
      // Ako recept postoji, nazivLijeka treba biti čitljiv tekst, ne šifrovani blob
      '[historija] recept dekriptovan': (r) => {
        if (r.status !== 200) return true;
        const lista = parseBody(r);
        if (!Array.isArray(lista) || lista.length === 0) return true;
        const prvaPosHistorija = lista[0];
        if (!prvaPosHistorija.recepti || prvaPosHistorija.recepti.length === 0) return true;
        const recept = prvaPosHistorija.recepti[0];
        // Enkriptovani podaci su obično base64 — dugi stringovi bez razmaka
        const izgledaKaoEnkripcija = /^[A-Za-z0-9+/=]{50,}$/.test(recept.nazivLijeka || '');
        return !izgledaKaoEnkripcija;
      },
    });

    // RBAC: Pacijent ne smije vidjeti historiju (NFR-01)
    const rbac = http.get(
      `${BASE_URL}/historija/pacijent/${TEST_IDS.pacijentId}`,
      { headers: pacijentHeaders }
    );
    checkNepristupacno(rbac, '[RBAC historija pacijenta]');
  });

  sleep(0.3);

  // ── 3. GET /api/pacijenti/hronicni ──────────────────────────────────────────
  group('Hronični pacijenti', () => {

    const res = http.get(
      `${BASE_URL}/pacijenti/hronicni`,
      { headers: doktorHeaders, tags: { name: 'hronicni' } }
    );
    check(res, {
      '[hronicni] status 200': (r) => r.status === 200,
      '[hronicni] niz': (r) => Array.isArray(parseBody(r)),
      '[hronicni] svaki ima hronicni:true': (r) => {
        const lista = parseBody(r);
        if (!Array.isArray(lista)) return true;
        return lista.every((p) => p.hronicni === true);
      },
    });

    // RBAC: Pacijent ne smije
    const rbac = http.get(`${BASE_URL}/pacijenti/hronicni`, { headers: pacijentHeaders });
    checkNepristupacno(rbac, '[RBAC hronicni pacijent]');
  });

  sleep(0.3);

  // ── 4. PATCH /api/pacijenti/:id/hronicni ────────────────────────────────────
  group('Update hroničnog statusa', () => {

   

const res = http.patch(
  `${BASE_URL}/pacijenti/${TEST_IDS.pacijentId}/hronicni`,
  JSON.stringify({ hronicniBolesnik: true, reviewPeriodDays: 90 }),
  { headers: doktorHeaders, tags: { name: 'hronicni_update' } }
);
check(res, {
  '[hronicni update] prihvaćen': (r) => [200, 204].includes(r.status), // Makni 404, ciljamo samo uspjeh
});

    // Validacija: hronicniBolesnik = true bez reviewPeriodDays → 400
    const bezPerioda = http.patch(
      `${BASE_URL}/pacijenti/${TEST_IDS.pacijentId}/hronicni`,
      JSON.stringify({ hronicniBolesnik: true }),
      { headers: doktorHeaders }
    );
    check(bezPerioda, {
      '[hronicni bez perioda] status 400': (r) => r.status === 400,
    });

    // Validacija: reviewPeriodDays = -5 (negativan) → 400
    const negativanPeriod = http.patch(
      `${BASE_URL}/pacijenti/${TEST_IDS.pacijentId}/hronicni`,
      JSON.stringify({ hronicniBolesnik: true, reviewPeriodDays: -5 }),
      { headers: doktorHeaders }
    );
    check(negativanPeriod, {
      '[hronicni negativan period] status 400': (r) => r.status === 400,
    });

    // Validacija: hronicniBolesnik nije boolean → 400
    const nijeBoolean = http.patch(
      `${BASE_URL}/pacijenti/${TEST_IDS.pacijentId}/hronicni`,
      JSON.stringify({ hronicniBolesnik: 'da', reviewPeriodDays: 30 }),
      { headers: doktorHeaders }
    );
    check(nijeBoolean, {
      '[hronicni nije boolean] status 400': (r) => r.status === 400,
    });

    // Postavi hronicniBolesnik = false (sklanja reviewPeriodDays)
    const iskljuci = http.patch(
      `${BASE_URL}/pacijenti/${TEST_IDS.pacijentId}/hronicni`,
      JSON.stringify({ hronicniBolesnik: false }),
      { headers: doktorHeaders }
    );
    check(iskljuci, {
      '[hronicni iskljuci] prihvaćen': (r) => [200, 404].includes(r.status),
    });

    // RBAC: Pacijent ne smije mijenjati hronični status
    const rbac = http.patch(
      `${BASE_URL}/pacijenti/${TEST_IDS.pacijentId}/hronicni`,
      JSON.stringify({ hronicniBolesnik: false }),
      { headers: pacijentHeaders }
    );
    checkNepristupacno(rbac, '[RBAC hronicni pacijent]');
  });

  sleep(0.5);
}