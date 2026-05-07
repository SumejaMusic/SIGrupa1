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

const resend = new Resend(process.env.RESEND_API_KEY);

export async function posaljiPotvrdurezerv(podaci: RezervacijaEmailPodaci): Promise<void> {
  const {
    pacijentEmail, pacijentIme, pacijentPrezime,
    doktorIme, doktorPrezime, doktorSpecijalizacija,
    datum, vrijeme, rezervacijaId,
    tipPregleda, komentar, hitnost,
  } = podaci;

  const formatiraniDatum = datum.toLocaleDateString('bs-BA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  await resend.emails.send({
    from: 'onboarding@resend.dev', // zamijeni sa svojom domenom kad verificiraš
    to: pacijentEmail,
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

  console.log(`✅ Potvrda rezervacije #${rezervacijaId} poslana na: ${pacijentEmail}`);
}
/*import nodemailer from 'nodemailer';
interface RezervacijaEmailPodaci {
  pacijentEmail: string;
  pacijentIme: string;
  pacijentPrezime: string;
  doktorIme: string;
  doktorPrezime: string;
  doktorSpecijalizacija: string;
  datum: Date;
  vrijeme: number; // tvoj Int format iz baze (npr. 830 = 08:30)
  rezervacijaId: number;
  tipPregleda?: string;
  komentar?: string;
  hitnost: boolean;
}

// Pretvara Int vrijeme (npr. 830) u string "08:30"
function formatVrijeme(v: number): string {
  const h = Math.floor(v / 60);
  const m = v % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export async function posaljiPotvrdurezerv(podaci: RezervacijaEmailPodaci): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const {
    pacijentEmail, pacijentIme, pacijentPrezime,
    doktorIme, doktorPrezime, doktorSpecijalizacija,
    datum, vrijeme, rezervacijaId,
    tipPregleda, komentar, hitnost,
  } = podaci;

  const formatiraniDatum = datum.toLocaleDateString('bs-BA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  await transporter.sendMail({
    from: `"Bolnički Sistem" <${process.env.EMAIL_USER}>`,
    to: pacijentEmail,
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

  console.log(`✅ Potvrda rezervacije #${rezervacijaId} poslana na: ${pacijentEmail}`);
}*/