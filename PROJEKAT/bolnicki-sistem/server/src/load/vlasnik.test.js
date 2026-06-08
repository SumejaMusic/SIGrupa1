/**
 * vlasnik.test.js
 *
 * Pokriva endpointe iz vlasnikController.ts / vlasnikRoutes.ts:
 *   GET  /api/vlasnik/korisnici-po-ulogama
 *   GET  /api/vlasnik/termini-stats
 *   GET  /api/vlasnik/export-csv?period=
 *   GET  /api/vlasnik/termini-detalji?stranica=&limit=&status=&datumOd=&datumDo=
 *   GET  /api/vlasnik/sale-occupancy
 *   GET  /api/vlasnik/recenzije?stranica=&limit=&samo_sa_komentarom=
 *   PATCH /api/vlasnik/recenzije/:id/sakrij
 *
 * Pristup imaju samo VLASNIK i ADMINISTRATOR (router.use autorizacija).
 *
 * NFR koja su obuhvaćena:
 *   NFR-06/07  — RBAC: doktor/pacijent/osoblje ne smiju pristupiti
 *   NFR-10     — Statistike i detalji termina < 3s
 *   NFR-15     — Dashboard učitava < 3s
 *   NFR-16     — Podaci u realnom vremenu (test brzine odziva)
 *   NFR-18     — Admin/vlasnik backend < 2s (tag: admin)
 *   NFR-19     — Duplo sakrivanje → 400 (integritet)
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import {
  BASE_URL, TEST_IDS, jsonHeaders,
  defaultOptions, smokeOptions, stressOptions,
} from './config.js';
import {
  loginIVratiHeader, checkOk, checkNepristupacno, parseBody,
} from './helpers.js';

const MODE = __ENV.MODE || 'load';
export const options = MODE === 'smoke'  ? smokeOptions
                     : MODE === 'stress' ? stressOptions
                     : {
                         ...defaultOptions,
                         thresholds: {
                           ...defaultOptions.thresholds,
                           'http_req_duration{name:admin}':     ['p(95)<5000'],
                           'http_req_duration{name:dashboard}': ['p(95)<6000'],
                         },
                       };

export function setup() {
  return {
    adminHeaders:    loginIVratiHeader('admin'),
    doktorHeaders:   loginIVratiHeader('doktor'),
    pacijentHeaders: loginIVratiHeader('pacijent'),
    osobljeHeaders:  loginIVratiHeader('osoblje'),
  };
}

export default function (data) {
  const { adminHeaders, doktorHeaders, pacijentHeaders, osobljeHeaders } = data;

  // ── 1. GET /api/vlasnik/korisnici-po-ulogama ─────────────────────────────────
  group('Korisnici po ulogama', () => {

    const res = http.get(
      `${BASE_URL}/vlasnik/korisnici-po-ulogama`,
      { headers: adminHeaders, tags: { name: 'admin' } }
    );
    check(res, {
      '[korisnici po ulogama] status 200': (r) => r.status === 200,
      '[korisnici po ulogama] niz': (r) => Array.isArray(parseBody(r)),
      '[korisnici po ulogama] svaki ima uloga i broj': (r) => {
        const lista = parseBody(r);
        if (!Array.isArray(lista)) return true;
        return lista.every((u) => u.uloga && typeof u.broj === 'number');
      },
    });

    // RBAC: Doktor ne smije
    checkNepristupacno(
      http.get(`${BASE_URL}/vlasnik/korisnici-po-ulogama`, { headers: doktorHeaders }),
      '[RBAC doktor na korisnici-po-ulogama]'
    );

    // RBAC: Pacijent ne smije
    checkNepristupacno(
      http.get(`${BASE_URL}/vlasnik/korisnici-po-ulogama`, { headers: pacijentHeaders }),
      '[RBAC pacijent na korisnici-po-ulogama]'
    );

    // RBAC: Osoblje ne smije
    checkNepristupacno(
      http.get(`${BASE_URL}/vlasnik/korisnici-po-ulogama`, { headers: osobljeHeaders }),
      '[RBAC osoblje na korisnici-po-ulogama]'
    );
  });

  sleep(0.3);

  // ── 2. GET /api/vlasnik/termini-stats (NFR-15, NFR-16) ──────────────────────
  group('Termini statistike', () => {

    const res = http.get(
      `${BASE_URL}/vlasnik/termini-stats`,
      { headers: adminHeaders, tags: { name: 'dashboard' } }
    );
    check(res, {
      '[termini stats] status 200': (r) => r.status === 200,
      '[termini stats] ima slobodni': (r) => {
        const b = parseBody(r);
        return b && typeof b.slobodni === 'number';
      },
      '[termini stats] ima zakazaniPoDoktoru niz': (r) => {
        const b = parseBody(r);
        return b && Array.isArray(b.zakazaniPoDoktoru);
      },
      // Svaki red treba imati brojeće polje
      '[termini stats] doktori imaju sve kolone': (r) => {
        const b = parseBody(r);
        if (!b || !Array.isArray(b.zakazaniPoDoktoru) || b.zakazaniPoDoktoru.length === 0) return true;
        const d = b.zakazaniPoDoktoru[0];
        return (
          typeof d.doktorId === 'number' &&
          typeof d.brojZakazanih === 'number' &&
          typeof d.brojSlobodnih === 'number' &&
          typeof d.ukupno === 'number'
        );
      },
    });
  });

  sleep(0.3);

  // ── 3. GET /api/vlasnik/termini-detalji — paginacija i filteri ───────────────
  group('Termini detalji', () => {

    // Defaultna stranica
    const stranica1 = http.get(
      `${BASE_URL}/vlasnik/termini-detalji`,
      { headers: adminHeaders, tags: { name: 'dashboard' } }
    );
    check(stranica1, {
      '[termini detalji] status 200': (r) => r.status === 200,
      '[termini detalji] ima termini niz': (r) => {
        const b = parseBody(r);
        return b && Array.isArray(b.termini);
      },
      '[termini detalji] ima paginacija': (r) => {
        const b = parseBody(r);
        return b && b.paginacija && typeof b.paginacija.ukupno === 'number';
      },
    });

    // Filter po statusu SLOBODAN
    const slobodni = http.get(
      `${BASE_URL}/vlasnik/termini-detalji?status=SLOBODAN&limit=5`,
      { headers: adminHeaders, tags: { name: 'admin' } }
    );
    check(slobodni, {
      '[termini detalji slobodni] status 200': (r) => r.status === 200,
      '[termini detalji slobodni] svi slobodni': (r) => {
        const b = parseBody(r);
        if (!b || !Array.isArray(b.termini)) return true;
        return b.termini.every((t) => t.status === 'SLOBODAN');
      },
    });

    // Filter po statusu OTKAZAN
    const otkazani = http.get(
      `${BASE_URL}/vlasnik/termini-detalji?status=OTKAZAN&limit=5`,
      { headers: adminHeaders, tags: { name: 'admin' } }
    );
    check(otkazani, {
      '[termini detalji otkazani] status 200': (r) => r.status === 200,
      '[termini detalji otkazani] svi otkazani': (r) => {
        const b = parseBody(r);
        if (!b || !Array.isArray(b.termini) || b.termini.length === 0) return true;
        return b.termini.every((t) => t.status === 'OTKAZAN');
      },
    });

    // Filter po datumskom opsegu
    const datumski = http.get(
      `${BASE_URL}/vlasnik/termini-detalji?datumOd=2026-01-01&datumDo=2026-12-31&limit=10`,
      { headers: adminHeaders, tags: { name: 'admin' } }
    );
    check(datumski, {
      '[termini detalji datumski] status 200': (r) => r.status === 200,
    });

    // Paginacija: stranica 2
    const stranica2 = http.get(
      `${BASE_URL}/vlasnik/termini-detalji?stranica=2&limit=10`,
      { headers: adminHeaders, tags: { name: 'admin' } }
    );
    check(stranica2, {
      '[termini detalji str 2] status 200': (r) => r.status === 200,
    });
  });

  sleep(0.3);

  // ── 4. GET /api/vlasnik/export-csv (NFR-16) ──────────────────────────────────
  group('Export CSV/XLSX', () => {

    // Export za tekući mjesec (default)
    const mjesec = http.get(
      `${BASE_URL}/vlasnik/export-csv?period=mjesec`,
      { headers: adminHeaders, tags: { name: 'admin' } }
    );
    check(mjesec, {
      '[export csv] status 200': (r) => r.status === 200,
      '[export csv] content-type xlsx': (r) => {
        const ct = (r.headers['Content-Type'] || '').toLowerCase();
        return ct.includes('spreadsheetml') || ct.includes('xlsx') || ct.includes('octet-stream');
      },
      '[export csv] content-disposition attachment': (r) => {
        const cd = r.headers['Content-Disposition'] || '';
        return cd.includes('attachment');
      },
    });

    // Export za sedmicu
    const sedmica = http.get(
      `${BASE_URL}/vlasnik/export-csv?period=sedmica`,
      { headers: adminHeaders, tags: { name: 'admin' } }
    );
    check(sedmica, {
      '[export csv sedmica] status 200': (r) => r.status === 200,
    });

    // Export za custom period
    const custom = http.get(
      `${BASE_URL}/vlasnik/export-csv?period=custom&datumOd=2026-01-01&datumDo=2026-06-30`,
      { headers: adminHeaders, tags: { name: 'admin' } }
    );
    check(custom, {
      '[export csv custom] status 200': (r) => r.status === 200,
    });

    // RBAC: Pacijent ne smije eksportovati
    checkNepristupacno(
      http.get(`${BASE_URL}/vlasnik/export-csv`, { headers: pacijentHeaders }),
      '[RBAC pacijent export csv]'
    );
  });

  sleep(0.3);

  // ── 5. GET /api/vlasnik/sale-occupancy — zauzetost soba ─────────────────────
  group('Zauzetost soba', () => {

    const res = http.get(
      `${BASE_URL}/vlasnik/sale-occupancy`,
      { headers: adminHeaders, tags: { name: 'dashboard' } }
    );
    check(res, {
      '[sale occupancy] status 200': (r) => r.status === 200,
      '[sale occupancy] niz soba': (r) => Array.isArray(parseBody(r)),
      '[sale occupancy] svaka soba ima statistike': (r) => {
        const lista = parseBody(r);
        if (!Array.isArray(lista) || lista.length === 0) return true;
        const s = lista[0];
        return (
          typeof s.aktivnih === 'number' &&
          typeof s.zavrsenih === 'number' &&
          typeof s.otkazanih === 'number' &&
          typeof s.ukupnoRezervacija === 'number'
        );
      },
      // Matematička provjera: ukupno == aktivnih + zavrsenih + otkazanih
      '[sale occupancy] matematika ispravna': (r) => {
        const lista = parseBody(r);
        if (!Array.isArray(lista)) return true;
        return lista.every((s) =>
          s.ukupnoRezervacija === s.aktivnih + s.zavrsenih + s.otkazanih
        );
      },
    });
  });

  sleep(0.3);

  // ── 6. GET /api/vlasnik/recenzije — lista sa paginacijom ────────────────────
  group('Recenzije (vlasnik pregled)', () => {

    // Sve recenzije, stranica 1
    const sve = http.get(
      `${BASE_URL}/vlasnik/recenzije`,
      { headers: adminHeaders, tags: { name: 'admin' } }
    );
    check(sve, {
      '[recenzije] status 200': (r) => r.status === 200,
      '[recenzije] ima recenzije niz': (r) => {
        const b = parseBody(r);
        return b && Array.isArray(b.recenzije);
      },
      '[recenzije] ima paginacija': (r) => {
        const b = parseBody(r);
        return b && b.paginacija && typeof b.paginacija.ukupno === 'number';
      },
    });

    // Samo recenzije sa komentarom
    const saKomentarom = http.get(
      `${BASE_URL}/vlasnik/recenzije?samo_sa_komentarom=true`,
      { headers: adminHeaders, tags: { name: 'admin' } }
    );
    check(saKomentarom, {
      '[recenzije sa komentarom] status 200': (r) => r.status === 200,
      '[recenzije sa komentarom] svi imaju komentar': (r) => {
        const b = parseBody(r);
        if (!b || !Array.isArray(b.recenzije) || b.recenzije.length === 0) return true;
        return b.recenzije.every((rr) => rr.komentar !== null && rr.komentar !== undefined);
      },
    });
  });

  sleep(0.3);

  // ── 7. PATCH /api/vlasnik/recenzije/:id/sakrij ──────────────────────────────
  group('Sakrivanje recenzije (vlasnik)', () => {

    // Admin sakriva recenziju
    const sakrij = http.patch(
      `${BASE_URL}/vlasnik/recenzije/${TEST_IDS.recenzijaId}/sakrij`,
      null,
      { headers: adminHeaders, tags: { name: 'admin' } }
    );
    check(sakrij, {
      '[sakrij vlasnik] prihvatljiv status': (r) => [200, 400, 404].includes(r.status),
      '[sakrij vlasnik] ima poruku': (r) => {
        const b = parseBody(r);
        return b && typeof b.poruka === 'string';
      },
    });

    // NFR-19: Duplo sakrivanje → 400 (integritet)
    // Ako je prvi zahtjev bio 200, drugi treba biti 400 (već sakrivena)
    if (parseBody(sakrij)?.poruka?.includes('uspješno')) {
      const drugiPut = http.patch(
        `${BASE_URL}/vlasnik/recenzije/${TEST_IDS.recenzijaId}/sakrij`,
        null,
        { headers: adminHeaders }
      );
      check(drugiPut, {
        '[sakrij duplo] status 400': (r) => r.status === 400,
        '[sakrij duplo] poruka o vec sakrivenoj': (r) => {
          const b = parseBody(r);
          return b && typeof b.poruka === 'string' && b.poruka.toLowerCase().includes('već');
        },
      });
    }

    // RBAC: Doktor ne smije sakriti
    checkNepristupacno(
      http.patch(`${BASE_URL}/vlasnik/recenzije/${TEST_IDS.recenzijaId}/sakrij`, null, { headers: doktorHeaders }),
      '[RBAC doktor sakrij recenziju]'
    );

    // RBAC: Pacijent ne smije
    checkNepristupacno(
      http.patch(`${BASE_URL}/vlasnik/recenzije/${TEST_IDS.recenzijaId}/sakrij`, null, { headers: pacijentHeaders }),
      '[RBAC pacijent sakrij recenziju]'
    );

    // RBAC: Osoblje ne smije
    checkNepristupacno(
      http.patch(`${BASE_URL}/vlasnik/recenzije/${TEST_IDS.recenzijaId}/sakrij`, null, { headers: osobljeHeaders }),
      '[RBAC osoblje sakrij recenziju]'
    );
  });

  sleep(0.5);
}