/**
 * concurrency.test.js
 *
 * Testiranje istovremene rezervacije (Race condition) — NFR-22
 *
 * Simulira N VU-a koji u istom trenutku pokušavaju rezervisati isti termin.
 * Sistem mora:
 *   - Dozvoliti uspjeh samo jednom korisniku (201)
 *   - Svim ostalima vratiti 409 (Redis lock zauzet) ili 400 (termin zauzet)
 *   - NE smije biti nijedan 500 (server crash)
 *
 * Pokretanje:
 *   k6 run concurrency.test.js
 *
 * Preporučeni broj VU-a: 10 (dovoljno za provjeru lock mehanizma bez preopterećivanja)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';
import { BASE_URL, TEST_KORISNICI, defaultOptions, smokeOptions, jsonHeaders } from './config.js';
import { loginIVratiHeader, parseBody } from './helpers.js';

// ─── Custom metrike ────────────────────────────────────────────────────────────
const uspjesneRezervacije = new Counter('uspjesne_rezervacije');   // trebalo bi biti max 1
const odbijeneRezervacije  = new Counter('odbijene_rezervacije');  // 409 / 400
const serverGreske          = new Counter('server_greske');        // 500 — ne smije biti
const lockStopa             = new Rate('lock_stopa');              // postotak odbijenih

// ─── Opcije ─────────────────────────────────────────────────────────────────────
export const options = {
  // Svi VU-i startaju istovremeno — ovo je ključno za concurrency test
  scenarios: {
    simultaneous: {
      executor:         'shared-iterations',
      vus:              10,
      iterations:       10,
      maxDuration:      '30s',
      // gracefulStop osigurava da se sve iteracije završe
      gracefulStop:     '5s',
    },
  },
  thresholds: {
    // Nijedan 500 — NFR-12: baza ne smije biti u nekonzistentnom stanju
    'server_greske': ['count<1'],
    // Uspješnih rezervacija smije biti max 1 (lock mehanizam funkcioniše)
    // Ako je više od 1, znači da lock ne funkcioniše!
    'uspjesne_rezervacije': ['count<=1'],
    // Ukupno trajanje < 3s po zahtjevu (NFR-09, NFR-10)
    'http_req_duration{name:concurrency_rezervacija}': ['p(95)<3000'],
  },
};

// ─── Setup ────────────────────────────────────────────────────────────────────
export function setup() {
  // Svi VU-i koriste iste kredencijale (osoblje)
  const headers = loginIVratiHeader('osoblje');
  if (!headers) throw new Error('Setup neuspješan: ne mogu se prijaviti kao osoblje');
  return { headers };
}

// ─── Teardown — ispiši statistiku ─────────────────────────────────────────────
export function teardown() {
  console.log('══════════════════════════════════════════');
  console.log('  Concurrency test završen — provjeri metrike:');
  console.log('  uspjesne_rezervacije — mora biti <= 1');
  console.log('  odbijene_rezervacije — mora biti >= 9 (od 10)');
  console.log('  server_greske        — mora biti 0');
  console.log('══════════════════════════════════════════');
}

// ─── Test scenario ────────────────────────────────────────────────────────────
export default function (data) {
  const { headers } = data;

  // Svi VU-i gađaju ISTI termin
  const payload = JSON.stringify({
    doktorId:            1,
  pacijentId:          2,
  terminId:            1,
  rezervacijaId:       6,   // aktivna, buduća
  rezervacijaZaOcjenu: 2,   // završena, bez recenzije
  nalazId:             25,
  odjelId:             1,
  recenzijaId:         1,
  });

  const res = http.post(
    `${BASE_URL}/osoblje/termini`,
    payload,
    { headers, tags: { name: 'concurrency_rezervacija' } }
  );

  const status = res.status;

  if (status === 201) {
    uspjesneRezervacije.add(1);
    lockStopa.add(false); // nije odbijen
    console.log(`VU ${__VU} USPJEŠNO rezervisao termin.`);
  } else if (status === 409 || status === 400) {
    odbijeneRezervacije.add(1);
    lockStopa.add(true); // odbijen — ovo je ispravno ponašanje
  } else if (status >= 500) {
    serverGreske.add(1);
    console.error(`VU ${__VU} dobio 5xx: ${status} — ${res.body}`);
  }
console.log(`VU ${__VU} dobio status: ${status} — ${res.body}`);
  check(res, {
    // Samo 201 (uspjeh) ili 409/400 (lock/zauzet) — NIkada 500
    '[concurrency] prihvatljiv status': (r) =>
      r.status === 201 || r.status === 409 || r.status === 400,
    '[concurrency] nema 500': (r) => r.status !== 500,
    '[concurrency] brzi odgovor': (r) => r.timings.duration < 3000,
  });

  // Kratka pauza — simuliramo realni scenario gdje korisnici ne šalju u isti nanosekund
  sleep(0.05);
}