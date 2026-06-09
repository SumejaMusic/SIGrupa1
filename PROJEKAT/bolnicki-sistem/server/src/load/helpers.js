// helpers.js — zajednički pomoćne funkcije za sve test fajlove

import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, TEST_KORISNICI, jsonHeaders } from './config.js';

/**
 * Prijavljuje korisnika i vraća Authorization header spreman za slanje.
 * Ako login ne uspije, test odmah pada.
 *
 * @param {string} uloga - 'admin' | 'pacijent' | 'doktor' | 'osoblje'
 * @returns {Object} - { Authorization: 'Bearer <token>' }
 */
export function loginIVratiHeader(uloga = 'osoblje') {
  const korisnik = TEST_KORISNICI[uloga];
  if (!korisnik) throw new Error(`Nepoznata uloga: ${uloga}`);

  const res = http.post(
  `${BASE_URL}/auth/prijava`,
    JSON.stringify({ email: korisnik.email, pristupnaSifra: korisnik.pristupnaSifra }),
    { headers: jsonHeaders, tags: { name: 'login' } }
  );

  const ok = check(res, {
    '[login] status 200': (r) => r.status === 200,
    '[login] token prisutan': (r) => {
      try { return !!JSON.parse(r.body).token; } catch { return false; }
    },
  });

  if (!ok) {
    console.error(`Login neuspješan za ulogu '${uloga}': ${res.status} ${res.body}`);
    return null;
  }

  const token = JSON.parse(res.body).token;
  return { Authorization: `Bearer ${token}`, ...jsonHeaders };
}

/**
 * Provjera standardnog uspješnog odgovora.
 */
export function checkOk(res, prefix = '') {
  return check(res, {
    [`${prefix} status 200`]: (r) => r.status === 200,
    [`${prefix} body nije prazan`]: (r) => r.body && r.body.length > 0,
  });
}

/**
 * Provjera 201 Created.
 */
export function check201(res, prefix = '') {
  return check(res, {
    [`${prefix} status 201`]: (r) => r.status === 201,
    [`${prefix} body nije prazan`]: (r) => r.body && r.body.length > 0,
  });
}

/**
 * Provjera da neautorizovan zahtjev vraća 401 ili 403.
 */
export function checkNepristupacno(res, prefix = '') {
  return check(res, {
    [`${prefix} odbijen (401/403)`]: (r) => r.status === 401 || r.status === 403,
  });
}

/**
 * Sigurno parsira JSON tijelo odgovora.
 * Vraća null ako parsing ne uspije (ne rušimo test).
 */
export function parseBody(res) {
  try { return JSON.parse(res.body); } catch { return null; }
}