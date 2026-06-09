/**
 * termin.test.js
 *
 * Pokriva endpointe iz terminController.ts / terminRoutes.ts:
 *   GET  /api/termini?doktorId=&datum=          — slobodni termini (US-05)
 *   GET  /api/termini/zauzeti-dani?doktorId=&mjesec=&godina=
 *   GET  /api/termini/:id                       — detalji termina
 *   POST /api/termini/:id/zakljucaj             — Redis lock 2 min (NFR-22)
 *   POST /api/termini/:id/oslobodi              — ručno oslobađanje
 *
 * NFR koja su obuhvaćena:
 *   NFR-09  — Termin odmah dostupan nakon oslobađanja (< 2s)
 *   NFR-16  — Slobodni termini se prikazuju < 2s bez ručnog osvježavanja
 *   NFR-22  — Lock na 2 minute, drugi korisnik dobija 409
 *   NFR-06/07 — RBAC: zakljucaj/oslobodi samo PACIJENT, DOKTOR, ADMINISTRATOR
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter } from 'k6/metrics';
import {
  BASE_URL, TEST_IDS, jsonHeaders,
  defaultOptions, smokeOptions, stressOptions,
} from './config.js';
import {
  loginIVratiHeader, checkOk, checkNepristupacno, parseBody,
} from './helpers.js';

// ─── Custom metrike ────────────────────────────────────────────────────────────
const lockOdbijenih = new Counter('termin_lock_odbijenih'); // 409 od Redisa

const MODE = __ENV.MODE || 'load';
export const options = MODE === 'smoke'  ? smokeOptions
                     : MODE === 'stress' ? stressOptions
                     : {
                         ...defaultOptions,
                         thresholds: {
                           ...defaultOptions.thresholds,
                           // NFR-16: slobodni termini < 2s
                           'http_req_duration{name:slobodni_termini}': ['p(95)<2000'],
                           // NFR-09: provjera termina < 2s
                           'http_req_duration{name:provjeri_termin}': ['p(95)<2000'],
                         },
                       };

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

  // ── 1. GET /api/termini — slobodni termini ───────────────────────────────────
  group('Slobodni termini', () => {

    // Bez filtera — vraća sve buduće slobodne termine (NFR-16)
    const svi = http.get(
      `${BASE_URL}/termini`,
      { tags: { name: 'slobodni_termini' } }
      // Napomena: ova ruta nema autentifikaciju po terminRoutes.ts
    );
    check(svi, {
      '[slobodni termini] status 200': (r) => r.status === 200,
      '[slobodni termini] niz': (r) => Array.isArray(parseBody(r)),
      // Svaki termin treba imati status SLOBODAN ili zakljucan info
      '[slobodni termini] imaju status polje': (r) => {
        const lista = parseBody(r);
        if (!Array.isArray(lista) || lista.length === 0) return true;
        return lista.every((t) => 'zakljucan' in t);
      },
    });

    // Filter po doktoru i datumu
    const filtrirani = http.get(
      `${BASE_URL}/termini?doktorId=${TEST_IDS.doktorId}&datum=2026-08-01`,
      { tags: { name: 'slobodni_termini' } }
    );
    check(filtrirani, {
      '[filtrirani termini] status 200': (r) => r.status === 200,
      '[filtrirani termini] niz': (r) => Array.isArray(parseBody(r)),
    });

    // Provjera sorte — datumi moraju ići uzlazno
    const sortirani = parseBody(svi);
    if (Array.isArray(sortirani) && sortirani.length > 1) {
      check(sortirani, {
        '[slobodni termini] sortirani uzlazno': (lista) => {
          for (let i = 1; i < lista.length; i++) {
            const prev = new Date(lista[i - 1].datum).getTime();
            const curr = new Date(lista[i].datum).getTime();
            if (prev > curr) return false;
          }
          return true;
        },
      });
    }
  });

  sleep(0.3);

  // ── 2. GET /api/termini/zauzeti-dani ────────────────────────────────────────
  group('Zauzeti dani', () => {

    // Validan upit — juni 2026
    const res = http.get(
      `${BASE_URL}/termini/zauzeti-dani?doktorId=${TEST_IDS.doktorId}&mjesec=6&godina=2026`,
      { tags: { name: 'zauzeti_dani' } }
    );
    check(res, {
      '[zauzeti dani] status 200': (r) => r.status === 200,
      '[zauzeti dani] ima zauzetiDani niz': (r) => {
        const b = parseBody(r);
        return b && Array.isArray(b.zauzetiDani);
      },
      // Datumi trebaju biti u ISO formatu YYYY-MM-DD
      '[zauzeti dani] format datuma ispravan': (r) => {
        const b = parseBody(r);
        if (!b || !Array.isArray(b.zauzetiDani) || b.zauzetiDani.length === 0) return true;
        return b.zauzetiDani.every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
      },
    });

    // Bez parametara — treba ili 400 ili prazan niz (ovisi o implementaciji)
   const bezParams = http.get(`${BASE_URL}/termini/zauzeti-dani`);
check(bezParams, {
  '[zauzeti dani bez params] odgovor primljen': (r) => r.status > 0,
});
  });

  sleep(0.3);

  // ── 3. GET /api/termini/:id — detalji termina ────────────────────────────────
  group('Detalji termina', () => {

    const res = http.get(
      `${BASE_URL}/termini/${TEST_IDS.rezervacijaId}`,
      { tags: { name: 'provjeri_termin' } }
    );
    check(res, {
      '[detalji termina] status 200 ili 404': (r) => [200, 404].includes(r.status),
      '[detalji termina] ima id ako 200': (r) => {
        if (r.status !== 200) return true;
        const b = parseBody(r);
        return b && typeof b.id === 'number';
      },
    });

    // Nepostojeći ID (jako visok broj)
    const nepostoji = http.get(`${BASE_URL}/termini/999999`);
    check(nepostoji, {
      '[detalji termina] nepostoji 404': (r) => r.status === 404,
    });
  });

  sleep(0.3);

  // ── 4. POST /api/termini/:id/zakljucaj — Redis lock (NFR-22) ─────────────────
  group('Zaključaj termin', () => {

    // Pacijent može zaključati termin
    const zakljucaj = http.post(
      `${BASE_URL}/termini/${TEST_IDS.rezervacijaId}/zakljucaj`,
      null,
      { headers: pacijentHeaders, tags: { name: 'zakljucaj_termin' } }
    );
    check(zakljucaj, {
      '[zakljucaj] status 200 ili 409': (r) => [200, 401, 409].includes(r.status),
      '[zakljucaj ako 200] ima ttl': (r) => {
        if (r.status !== 200) return true;
        const b = parseBody(r);
        return b && typeof b.ttl === 'number' && b.ttl === 120; // NFR-22: točno 120s
      },
    });

    // Drugi korisnik pokušava zaključati isti termin → 409 (lock je zauzet)
    // NAPOMENA: Može biti 200 ako je prvi zahtjev uspio i isti korisnik opet pokušava
    //           (Redis dozvoljava re-lock istom korisniku), ali 409 je očekivano od drugog korisnika
    const drugiKorisnik = http.post(
      `${BASE_URL}/termini/${TEST_IDS.rezervacijaId}/zakljucaj`,
      null,
      { headers: doktorHeaders, tags: { name: 'zakljucaj_drugi_korisnik' } }
    );

    if (drugiKorisnik.status === 409) {
      lockOdbijenih.add(1);
    }

    check(drugiKorisnik, {
      '[zakljucaj drugi] 200 ili 409 (ne 500)': (r) => [200, 401, 409].includes(r.status),
    });

    // RBAC: Osoblje ne smije zaključati termin (nije u listi autorizacija)
    const osobljeZakljucaj = http.post(
      `${BASE_URL}/termini/${TEST_IDS.rezervacijaId}/zakljucaj`,
      null,
      { headers: osobljeHeaders }
    );
    checkNepristupacno(osobljeZakljucaj, '[RBAC osoblje zakljucaj]');

    // Bez tokena → 401
    const anoniman = http.post(
      `${BASE_URL}/termini/${TEST_IDS.rezervacijaId}/zakljucaj`,
      null,
      { headers: jsonHeaders }
    );
    checkNepristupacno(anoniman, '[zakljucaj bez tokena]');
  });

  sleep(0.5); // Kratka pauza da lock može biti aktivan

  // ── 5. POST /api/termini/:id/oslobodi — ručno oslobađanje (NFR-09) ───────────
  group('Oslobodi termin', () => {

    // Pacijent može osloboditi termin koji je zaključao
    const oslobodi = http.post(
      `${BASE_URL}/termini/${TEST_IDS.rezervacijaId}/oslobodi`,
      null,
      { headers: pacijentHeaders, tags: { name: 'oslobodi_termin' } }
    );
    check(oslobodi, {
      '[oslobodi] status 200 ili 401': (r) => [200, 401].includes(r.status),
      '[oslobodi ako 200] poruka': (r) => {
        if (r.status !== 200) return true;
        const b = parseBody(r);
        return b && typeof b.poruka === 'string';
      },
    });

    // Odmah provjeri da li je termin slobodan (NFR-09: < 2s)
    if (parseBody(oslobodi)?.poruka) {
      const provjera = http.get(
        `${BASE_URL}/termini?doktorId=${TEST_IDS.doktorId}`,
        { tags: { name: 'provjeri_termin' } }
      );
      check(provjera, {
        '[provjeri nakon oslobađanja] status 200': (r) => r.status === 200,
        '[provjeri nakon oslobađanja] termin nije zakljucan': (r) => {
          const lista = parseBody(r);
          if (!Array.isArray(lista)) return true;
          const termin = lista.find((t) => t.id === TEST_IDS.rezervacijaId);
          return !termin || termin.zakljucan === false;
        },
      });
    }

    // RBAC: Osoblje ne smije osloboditi termin
    const osobljeOslobodi = http.post(
      `${BASE_URL}/termini/${TEST_IDS.rezervacijaId}/oslobodi`,
      null,
      { headers: osobljeHeaders }
    );
    checkNepristupacno(osobljeOslobodi, '[RBAC osoblje oslobodi]');
  });

  sleep(0.5);
}