import { Resend } from 'resend';

interface RezervacijaEmailPodaci {
  pacijentEmail: string;
  pacijentIme: string;
  pacijentPrezime: string;
  doktorIme: string;
  doktorPrezime: string;
  doktorSpecijalizacija: string;
  datum: Date;
  vrijeme: number;
  rezervacijaId: number;
  tipPregleda?: string;
  komentar?: string;
  hitnost: boolean;
}

function formatVrijeme(v: number): string {
  const h = Math.floor(v / 60);
  const m = v % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Formatira datum za email obavijesti u dd/mm/yyyy formatu.
 */
function formatDatumEmail(datum: Date): string {
  const d = String(datum.getUTCDate()).padStart(2, '0');
  const m = String(datum.getUTCMonth() + 1).padStart(2, '0');
  const y = datum.getUTCFullYear();
  return `${d}/${m}/${y}`;
}

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Missing API key. Pass it to the constructor `new Resend("re_123")`');
  }
  return new Resend(process.env.RESEND_API_KEY);
}

const TO_EMAIL = 'musicsumeja98@gmail.com';
const FROM_EMAIL = 'onboarding@resend.dev';

export async function posaljiPotvrdurezerv(podaci: RezervacijaEmailPodaci): Promise<void> {
  const {
    pacijentIme, pacijentPrezime,
    doktorIme, doktorPrezime, doktorSpecijalizacija,
    datum, vrijeme, rezervacijaId,
    tipPregleda, komentar, hitnost,
  } = podaci;

  const formatiraniDatum = formatDatumEmail(datum);

  const result = await getResend().emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    subject: `✅ Potvrda rezervacije #${rezervacijaId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        
        <div style="background-color: #1a73e8; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">✅ Potvrda rezervacije</h1>
          <p style="color: #cce3ff; margin: 6px 0 0;">Rezervacija #${rezervacijaId}</p>
        </div>

        ${hitnost ? `
        <div style="background-color: #fde8e8; border-left: 4px solid #e53e3e; padding: 12px 20px;">
          <strong style="color: #c53030;">🚨 Hitna rezervacija</strong>
        </div>` : ''}

        <div style="padding: 30px;">
          <p style="font-size: 16px;">Poštovani/a <strong>${pacijentIme} ${pacijentPrezime}</strong>,</p>
          <p style="color: #555;">Vaša rezervacija je uspješno kreirana. Detalji termina:</p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 12px 16px; border: 1px solid #dee2e6; font-weight: bold; width: 45%; color: #495057;">Doktor</td>
              <td style="padding: 12px 16px; border: 1px solid #dee2e6;">Dr. ${doktorIme} ${doktorPrezime}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; border: 1px solid #dee2e6; font-weight: bold; color: #495057;">Specijalizacija</td>
              <td style="padding: 12px 16px; border: 1px solid #dee2e6;">${doktorSpecijalizacija}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 12px 16px; border: 1px solid #dee2e6; font-weight: bold; color: #495057;">Datum</td>
              <td style="padding: 12px 16px; border: 1px solid #dee2e6;">${formatiraniDatum}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; border: 1px solid #dee2e6; font-weight: bold; color: #495057;">Vrijeme</td>
              <td style="padding: 12px 16px; border: 1px solid #dee2e6;">${formatVrijeme(vrijeme)} h</td>
            </tr>
            ${tipPregleda ? `
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 12px 16px; border: 1px solid #dee2e6; font-weight: bold; color: #495057;">Tip pregleda</td>
              <td style="padding: 12px 16px; border: 1px solid #dee2e6;">${tipPregleda}</td>
            </tr>` : ''}
            ${komentar ? `
            <tr>
              <td style="padding: 12px 16px; border: 1px solid #dee2e6; font-weight: bold; color: #495057;">Napomena</td>
              <td style="padding: 12px 16px; border: 1px solid #dee2e6;">${komentar}</td>
            </tr>` : ''}
          </table>

          <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 14px 16px; margin-top: 20px;">
            <strong>⚠️ Napomena:</strong> Molimo Vas da dođete <strong>10 minuta</strong> prije zakazanog termina.
            Ponesite ličnu kartu i zdravstvenu knjižicu.
          </div>
        </div>

        <div style="background-color: #f8f9fa; padding: 16px; text-align: center; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; color: #888; font-size: 13px;">
            © ${new Date().getFullYear()} Bolnički Sistem — Automatska obavijest, ne odgovarajte na ovaj email.
          </p>
        </div>
      </div>
    `,
  });

  if (result.error) {
    throw new Error(`Resend nije poslao potvrdu rezervacije: ${result.error.message}`);
  }

  console.log(`✅ Potvrda rezervacije #${rezervacijaId} poslana.`);
}

export async function posaljiResetPasswordEmail(email: string, ime: string, token: string): Promise<void> {
  const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  const result = await getResend().emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    subject: 'Resetovanje lozinke',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        
        <div style="background-color: #1a73e8; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">🔐 Resetovanje lozinke</h1>
        </div>

        <div style="padding: 30px;">
          <p style="font-size: 16px;">Poštovani/a <strong>${ime}</strong>,</p>
          <p style="color: #555;">Zatražili ste resetovanje lozinke za Vaš račun na Bolničkom Sistemu.</p>
          <p style="color: #555;">Kliknite na dugme ispod kako biste postavili novu lozinku:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">Resetuj Lozinku</a>
          </div>

          <p style="color: #555;">Ili kopirajte i zalijepite sljedeći link u Vaš pretraživač:</p>
          <p style="word-break: break-all; color: #1a73e8;"><a href="${resetLink}">${resetLink}</a></p>

          <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 14px 16px; margin-top: 20px;">
            <strong>⚠️ Važno:</strong> Ovaj link je validan <strong>15 minuta</strong>.
            Ukoliko niste zatražili resetovanje lozinke, možete ignorisati ovaj email.
          </div>
        </div>

        <div style="background-color: #f8f9fa; padding: 16px; text-align: center; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; color: #888; font-size: 13px;">
            © ${new Date().getFullYear()} Bolnički Sistem — Automatska obavijest, ne odgovarajte na ovaj email.
          </p>
        </div>
      </div>
    `,
  });

  if (result.error) {
    throw new Error(`Resend nije poslao reset email: ${result.error.message}`);
  }

  console.log(`✅ Email za reset lozinke poslan.`);
}

export async function posaljiVerifikacioniKod(email: string, ime: string, kod: string): Promise<void> {
  const subject = `Potvrdite Vaš email — Kod: ${kod}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      
      <div style="background-color: #1a73e8; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">✉️ Potvrdite Vaš email</h1>
        <p style="color: #cce3ff; margin: 6px 0 0;">Dobrodošli u Bolnički Sistem</p>
      </div>

      <div style="padding: 30px;">
        <p style="font-size: 16px;">Poštovani/a <strong>${ime}</strong>,</p>
        <p style="color: #555;">Hvala Vam na registraciji! Unesite sljedeći kod da potvrdite Vašu email adresu:</p>

        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background-color: #f0f4ff; border: 2px solid #1a73e8; border-radius: 8px; padding: 20px 40px; letter-spacing: 8px; font-size: 36px; font-weight: bold; color: #1a73e8;">
            ${kod}
          </div>
        </div>

        <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 14px 16px; margin-top: 20px;">
          <strong>⚠️ Važno:</strong>
          <ul style="margin: 8px 0 0; padding-left: 20px; color: #555;">
            <li>Kod vrijedi <strong>15 minuta</strong>.</li>
            <li>Nikome ne dijelite ovaj kod.</li>
            <li>Ako niste kreirali nalog, ignorisite ovaj email.</li>
          </ul>
        </div>
      </div>

      <div style="background-color: #f8f9fa; padding: 16px; text-align: center; border-top: 1px solid #dee2e6;">
        <p style="margin: 0; color: #888; font-size: 13px;">
          © ${new Date().getFullYear()} Bolnički Sistem — Automatska obavijest, ne odgovarajte na ovaj email.
        </p>
      </div>
    </div>
  `;

  const result = await getResend().emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    subject,
    html,
  });

  if (result.error) {
    throw new Error(`Resend nije poslao verifikacioni email: ${result.error.message}`);
  }

  console.log(`✅ Verifikacioni kod poslan. (email: ${email}, kod: ${kod})`);
}

interface OtkazivanjeEmailPodaci {
  pacijentEmail: string;
  pacijentIme: string;
  pacijentPrezime: string;
  doktorIme: string;
  doktorPrezime: string;
  doktorSpecijalizacija: string;
  datum: Date;
  vrijeme: number;
  rezervacijaId: number;
}

export async function posaljiOtkazivanjeRezerv(podaci: OtkazivanjeEmailPodaci): Promise<void> {
  const {
    pacijentIme, pacijentPrezime,
    doktorIme, doktorPrezime, doktorSpecijalizacija,
    datum, vrijeme, rezervacijaId,
  } = podaci;

  const formatiraniDatum = formatDatumEmail(datum);

  const result = await getResend().emails.send({
    from: FROM_EMAIL,
    to: TO_EMAIL,
    subject: `Otkazivanje rezervacije #${rezervacijaId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        
        <div style="background-color: #e53e3e; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">❌ Rezervacija otkazana</h1>
          <p style="color: #fed7d7; margin: 6px 0 0;">Rezervacija #${rezervacijaId}</p>
        </div>

        <div style="padding: 30px;">
          <p style="font-size: 16px;">Poštovani/a <strong>${pacijentIme} ${pacijentPrezime}</strong>,</p>
          <p style="color: #555;">Obavještavamo Vas da je Vaša rezervacija otkazana od strane medicinskog osoblja. <strong>Doktor će Vam zakazati novi termin i dobićete potvrdu emailom.</strong></p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 12px 16px; border: 1px solid #dee2e6; font-weight: bold; width: 45%; color: #495057;">Doktor</td>
              <td style="padding: 12px 16px; border: 1px solid #dee2e6;">Dr. ${doktorIme} ${doktorPrezime}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; border: 1px solid #dee2e6; font-weight: bold; color: #495057;">Specijalizacija</td>
              <td style="padding: 12px 16px; border: 1px solid #dee2e6;">${doktorSpecijalizacija}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 12px 16px; border: 1px solid #dee2e6; font-weight: bold; color: #495057;">Datum</td>
              <td style="padding: 12px 16px; border: 1px solid #dee2e6;">${formatiraniDatum}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; border: 1px solid #dee2e6; font-weight: bold; color: #495057;">Vrijeme</td>
              <td style="padding: 12px 16px; border: 1px solid #dee2e6;">${formatVrijeme(vrijeme)} h</td>
            </tr>
          </table>

          <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 14px 16px; margin-top: 20px;">
            <strong>ℹ️ Napomena:</strong> Možete zakazati novi termin putem našeg sistema.
          </div>
        </div>

        <div style="background-color: #f8f9fa; padding: 16px; text-align: center; border-top: 1px solid #dee2e6;">
          <p style="margin: 0; color: #888; font-size: 13px;">
            © ${new Date().getFullYear()} Bolnički Sistem — Automatska obavijest, ne odgovarajte na ovaj email.
          </p>
        </div>
      </div>
    `,
  });

  if (result.error) {
    throw new Error(`Resend nije poslao email otkazivanja: ${result.error.message}`);
  }

  console.log(`✅ Email otkazivanja rezervacije #${rezervacijaId} poslan.`);
}