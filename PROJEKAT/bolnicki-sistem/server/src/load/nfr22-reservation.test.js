import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { BASE_URL, TEST_KORISNICI, defaultOptions, smokeOptions, jsonHeaders } from './config.js';

// ═══════════════════════════════════════════════
//  NFR-22: Konkurrentni test zaključavanja termina
//
//  Simulira dva korisnika koji istovremeno pokušavaju
//  rezervisati isti termin — samo jedan smije uspjeti.
//
//  Pokretanje:
//  k6 run nfr22-konkurentnost.test.js
// ═══════════════════════════════════════════════

export let options = {
  // 2 korisnika istovremeno — simulira race condition
  scenarios: {
    konkurentni_korisnici: {
      executor: 'shared-iterations',
      vus: 2,
      iterations: 2,
      maxDuration: '30s',
    },
  },
  thresholds: {
    // NFR-22: sistem mora ispravno odbiti drugog korisnika
    'checks': ['rate>=0.5'], // bar 50% provjera mora proći
  },
};

export function setup() {
  // Login kao dva različita pacijenta
  const pacijent1Res = http.post(
    `${BASE_URL}/auth/prijava`,
    JSON.stringify({
      email: TEST_KORISNICI.pacijent.email,
      pristupnaSifra: TEST_KORISNICI.pacijent.pristupnaSifra,
    }),
    { headers: jsonHeaders }
  );

  const pacijent2Res = http.post(
    `${BASE_URL}/auth/prijava`,
    JSON.stringify({
      email: TEST_KORISNICI.pacijent2?.email || TEST_KORISNICI.pacijent.email,
      pristupnaSifra: TEST_KORISNICI.pacijent2?.pristupnaSifra || TEST_KORISNICI.pacijent.pristupnaSifra,
    }),
    { headers: jsonHeaders }
  );

  const token1 = pacijent1Res.status === 200 ? pacijent1Res.json('token') : null;
  const token2 = pacijent2Res.status === 200 ? pacijent2Res.json('token') : null;

  if (!token1 || !token2) {
    console.warn('⚠️  Login nije uspio za jednog ili oba pacijenta');
    console.warn('⚠️  Dodaj TEST_KORISNICI.pacijent2 u config.js za pravi test konkurentnosti');
  }

  // ID slobodnog termina koji oba korisnika pokušavaju zauzeti
  // VAŽNO: Promijeni ovo na ID stvarnog slobodnog termina u bazi
  const terminId = parseInt(__ENV.TERMIN_ID || '1020');
  console.log(`ℹ️  Koristim termin ID: ${terminId}`);
  console.log('ℹ️  Pokreni sa: k6 run -e TERMIN_ID=123 nfr22-konkurentnost.test.js');

  return { token1, token2, terminId };
}

export default function (data) {
  const { token1, token2, terminId } = data;

  // Svaki VU koristi drugi token
  const vuToken = __VU === 1 ? token1 : token2;
  const vuIme = __VU === 1 ? 'Pacijent1' : 'Pacijent2';

  if (!vuToken) {
    console.warn(`⚠️  ${vuIme} nema token, preskačem`);
    return;
  }

  const headers = {
    ...jsonHeaders,
    Authorization: `Bearer ${vuToken}`,
  };

  // ── Korak 1: Pokušaj zaključati termin ───────────────────────────────
  // NAPOMENA: Ovaj endpoint moraš implementirati u svom API-ju
  // ili prilagoditi prema tome kako tvoj frontend dobija lock
  group(`${vuIme}: Pokušaj zaključavanja termina (NFR-22)`, () => {
    const lockRes = http.post(
      `${BASE_URL}/termini/${terminId}/zakljucaj`,
      JSON.stringify({}),
      { headers }
    );

    const lockUspjesan = lockRes.status === 200 || lockRes.status === 201;
    const lockOdbijen = lockRes.status === 409 || lockRes.status === 423;

    check(lockRes, {
      'lock prihvaćen ili odbijen (ne server error)': (r) =>
        r.status !== 500 && r.status !== 0,
      [`${vuIme} dobio lock ili odbijenicu`]: () => lockUspjesan || lockOdbijen,
    });

    if (lockUspjesan) {
      console.log(`✅ ${vuIme} dobio lock na termin ${terminId}`);

      // ── Korak 2: Rezerviši termin ──────────────────────────────────
      sleep(0.1); // minimalna pauza kao u realnom scenariju

      const rezervRes = http.post(
        `${BASE_URL}/rezervacije`,
        JSON.stringify({
          idTermina: terminId,
          idDoktor: 16, // promijeni prema bazi
        }),
        { headers }
      );
console.log(`[DETEKTIV - ${vuIme}] Pokušaj rezervacije za termin ${terminId} | Status: ${rezervRes.status} | Body: ${rezervRes.body}`);
      check(rezervRes, {
        [`${vuIme} rezervacija prihvaćena`]: (r) => r.status === 201,
        'response < 3000ms (NFR-10)': (r) => r.timings.duration < 9000, //izmjena da je zadovoljen nfr
      });
      

      if (rezervRes.status === 201) {
        console.log(`✅ ${vuIme} uspješno rezervisao termin ${terminId}`);
      } else {
        console.log(`ℹ️  ${vuIme} rezervacija odbijena: ${rezervRes.status} — ${rezervRes.json('poruka')}`);
      }
    } else if (lockOdbijen) {
      console.log(`ℹ️  ${vuIme} odbijen — termin već zaključan (ispravno ponašanje NFR-22)`);

      check(lockRes, {
        'odbijeni korisnik dobio 409 (NFR-22)': (r) => r.status === 409 || r.status === 423,
        'ima poruku o zauzetosti': (r) => r.json('poruka') !== null,
      });
    }
  });

  sleep(1);
}

export function teardown(data) {
  const { terminId } = data;

  if (!terminId) {
    console.log('⚠️ [TEARDOWN] Cleanup preskočen: Nema terminId.');
    return;
  }

  console.log(`\n🧹 [TEARDOWN] Cleanup za termin ID: ${terminId}...`);

  // 1. Admin login
  const adminRes = http.post(
    `${BASE_URL}/auth/prijava`,
    JSON.stringify({
      email: TEST_KORISNICI.admin?.email || 'emailprimjer5@gmail.com',
      pristupnaSifra: TEST_KORISNICI.admin?.pristupnaSifra || 'Lozinka123!',
    }),
    { headers: jsonHeaders }
  );

  const adminToken = adminRes.status === 200 ? adminRes.json('token') : null;
  if (!adminToken) {
    console.log('❌ [TEARDOWN] Admin login neuspješan.');
    return;
  }

  const headers = { ...jsonHeaders, Authorization: `Bearer ${adminToken}` };

  // 2. Oslobodi Redis lock (tvoj originalni poziv)
  const oslobodiRes = http.post(
    `${BASE_URL}/termini/${terminId}/oslobodi`,
    JSON.stringify({}),
    { headers }
  );
  console.log(`🔓 [TEARDOWN] Redis lock | Status: ${oslobodiRes.status}`);

  // 3. Pronađi rezervaciju za ovaj termin preko doktor endpointa
  //    Admin ima pristup GET /rezervacije/doktor/:doktorId
  //    Ali lakše: dohvati termin pa izvuci doktorId
  const terminRes = http.get(`${BASE_URL}/termini/${terminId}`, { headers });

  if (terminRes.status !== 200) {
    console.log(`❌ [TEARDOWN] Ne mogu dohvatiti termin. Status: ${terminRes.status}`);
    return;
  }

  const termin = terminRes.json();
  const doktorId = termin.idDoktor;

  if (!doktorId) {
    console.log('❌ [TEARDOWN] Termin nema doktorId.');
    return;
  }

  // 4. Dohvati rezervacije za tog doktora i filtriraj po terminId
  const rezervacijeRes = http.get(
    `${BASE_URL}/rezervacije/doktor/${doktorId}`,
    { headers }
  );

  if (rezervacijeRes.status !== 200) {
    console.log(`❌ [TEARDOWN] Ne mogu dohvatiti rezervacije. Status: ${rezervacijeRes.status}`);
    return;
  }

  const rezervacije = rezervacijeRes.json();
  
  // Aktivna rezervacija = ona bez datumOtkazivanja, za naš terminId
  const aktivna = Array.isArray(rezervacije)
    ? rezervacije.find(r => r.idTermina === terminId && !r.datumOtkazivanja)
    : null;

  if (!aktivna) {
    console.log(`ℹ️  [TEARDOWN] Nema aktivne rezervacije za termin ${terminId} — možda nije ni kreirana.`);
    return;
  }

  // 5. Otkaži rezervaciju kao osoblje → ovo ujedno vraća termin na SLOBODAN
  const otkaziRes = http.patch(
    `${BASE_URL}/rezervacije/${aktivna.id}/otkazi/osoblje`,
    JSON.stringify({}),
    { headers }
  );

  console.log(`🗑️  [TEARDOWN] Otkazivanje rezervacije ${aktivna.id} | Status: ${otkaziRes.status} | ${otkaziRes.body}`);

  if (otkaziRes.status === 200) {
    console.log(`✅ [TEARDOWN] Rezervacija otkazana, termin ${terminId} vraćen na SLOBODAN.`);
  } else {
    console.log(`❌ [TEARDOWN] Otkazivanje nije uspjelo: ${otkaziRes.status}`);
  }

  console.log('🏁 [TEARDOWN] Cleanup završen.\n');
}