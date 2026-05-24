import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { sendSMS } from "../lib/smsService.js";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = new Resend(process.env.EMAIL_PASS);

export const pokreniReminderJob = () => {
  // Kuca svake minute za testiranje
  cron.schedule("* * * * *", async () => {
    try {
      console.log("Pokrenut reminder job provjere minuta...");

      // Uzimamo trenutno UTC vrijeme i brišemo sekunde/milisekunde
      const sadaUTC = new Date();
      sadaUTC.setUTCSeconds(0, 0);

      const pacijenti = await prisma.pacijent.findMany({
        where: { hronicniBolesnik: true, reviewPeriodDays: { not: null } },
        include: {
          korisnik: true,
          rezervacije: { include: { termin: true } },
          reminderLogs: true,
        },
      });

      console.log(`[DIAG] Pronađeno pacijenata (hronicni + reviewPeriodDays): ${pacijenti.length}`);
      for (const p of pacijenti) {
        console.log(`[DIAG]   - ${p.korisnik?.ime} | reviewPeriodDays: ${p.reviewPeriodDays} | zadnjiRutinskiPregledAt: ${p.zadnjiRutinskiPregledAt}`);
      }

      for (const pacijent of pacijenti) {
        if (!pacijent.reviewPeriodDays || !pacijent.zadnjiRutinskiPregledAt) {
          console.log(`[DIAG] Skip ${pacijent.korisnik?.ime}: reviewPeriodDays=${pacijent.reviewPeriodDays}, zadnjiRutinskiPregledAt=${pacijent.zadnjiRutinskiPregledAt}`);
          continue;
        }

        // Računanje datuma isteka u UTC-u
        const datumIsteka = new Date(pacijent.zadnjiRutinskiPregledAt);
        datumIsteka.setUTCDate(
          datumIsteka.getUTCDate() + pacijent.reviewPeriodDays
        );

        // TESTNI MODE: Podsjetnik 10 minuta prije isteka (umjesto 7 dana)
        const datumPodsjetnika = new Date(datumIsteka);
        datumPodsjetnika.setUTCMinutes(datumPodsjetnika.getUTCMinutes() - 10);
        datumPodsjetnika.setUTCSeconds(0, 0);

        console.log(
          `[DEBUG] Pacijent: ${pacijent.korisnik.ime} | SadaUTC: ${sadaUTC.toISOString()} | PodsjetnikUTC: ${datumPodsjetnika.toISOString()}`
        );

        if (sadaUTC.getTime() !== datumPodsjetnika.getTime()) continue;

        // Kriterij: Provjeri da li pacijent već ima zakazan termin
        const imaTermin = pacijent.rezervacije?.some((r) => {
          if (!r.termin?.datum) return false;
          const d = new Date(r.termin.datum);
          return d >= sadaUTC && d <= datumIsteka;
        });
        if (imaTermin) {
          console.log(
            `Pacijent ${pacijent.korisnik.ime} već ima zakazan termin, preskačem.`
          );
          continue;
        }

        let kanali = [];
        const poruka = `Postovani ${pacijent.korisnik.ime}, podsjecamo Vas na rutinski pregled za 7 dana. Vas SwiftMed.`;

        // SMS slanje
        if (pacijent.korisnik.brojTelefona) {
          const smsUspjeh = await sendSMS(
            pacijent.korisnik.brojTelefona,
            poruka
          );
          if (smsUspjeh) kanali.push("SMS");
        }

        // Email slanje putem Resend-a
        if (pacijent.korisnik.email) {
          try {
            const { error } = await resend.emails.send({
              from: "SwiftMed <onboarding@resend.dev>", // Resend besplatni sender
              to: ["musicsumjea98@gmail.com"],           // Override za testiranje
              subject: "SwiftMed – Podsjetnik za rutinski pregled",
              html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                  <h2 style="color: #2563eb;">SwiftMed Podsjetnik</h2>
                  <p>${poruka}</p>
                  <p style="color: #6b7280; font-size: 12px;">
                    Originalni email pacijenta: ${pacijent.korisnik.email}
                  </p>
                </div>
              `,
            });

            if (error) {
              console.error(
                `Greška pri slanju emaila za ${pacijent.korisnik.ime}:`,
                error
              );
            } else {
              console.log(
                `Email uspješno poslat na musicsumjea98@gmail.com (za pacijenta: ${pacijent.korisnik.ime})`
              );
              kanali.push("EMAIL");
            }
          } catch (emailError) {
            console.error("Resend greška:", emailError);
          }
        }

        // Evidentiranje u bazi
        if (kanali.length > 0) {
          await prisma.reminderLog.create({
            data: {
              idPacijent: pacijent.id,
              channel: kanali.join(" & "),
              status: "SENT",
              message: poruka,
            },
          });
          console.log(
            `ReminderLog kreiran za ${pacijent.korisnik.ime} | Kanali: ${kanali.join(", ")}`
          );
        }
      }
    } catch (error) {
      console.error("Greška u reminder job-u:", error);
    }
  });
};