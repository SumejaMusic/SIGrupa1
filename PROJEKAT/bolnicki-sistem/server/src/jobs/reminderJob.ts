import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { sendSMS } from "../lib/smsService.js";; // Importuj naš novi servis

const prisma = new PrismaClient();

export const pokreniReminderJob = () => {
  // Svaki dan u 08:00 (za testiranje možeš ostaviti * * * * *)
  cron.schedule("* * * * *", async () => {
    try {
      console.log("Pokrenut daily reminder job...");
      const danas = new Date();
      danas.setHours(0, 0, 0, 0);

      const pacijenti = await prisma.pacijent.findMany({
        where: { hronicniBolesnik: true, reviewPeriodDays: { not: null } },
        include: { korisnik: true, rezervacije: { include: { termin: true } }, reminderLogs: true }
      });

      for (const pacijent of pacijenti) {
        if (!pacijent.reviewPeriodDays || !pacijent.zadnjiRutinskiPregledAt) continue;

        // Računanje datuma podsjetnika (7 dana prije isteka)
        const datumIsteka = new Date(pacijent.zadnjiRutinskiPregledAt);
        datumIsteka.setDate(datumIsteka.getDate() + pacijent.reviewPeriodDays);
        const datumPodsjetnika = new Date(datumIsteka);
        datumPodsjetnika.setDate(datumPodsjetnika.getDate() - 7);
        datumPodsjetnika.setHours(0, 0, 0, 0);

        if (danas.getTime() !== datumPodsjetnika.getTime()) continue;

        // Kriterij br. 3: Provjeri da li pacijent već ima zakazan termin
        const imaTermin = pacijent.rezervacije?.some(r => {
          if (!r.termin?.datum) return false;
          const d = new Date(r.termin.datum);
          return d >= danas && d <= datumIsteka;
        });
        if (imaTermin) continue;

        // Kriterij br. 2 & 4: Slanje i evidentiranje
        let kanali = [];
        const poruka = `Postovani ${pacijent.korisnik.ime}, podsjecamo Vas na rutinski pregled za 7 dana. Vas SwiftMed.`;

        // SMS Slanje (Kriterij br. 2)
        if (pacijent.korisnik.brojTelefona) {
          const smsUspjeh = await sendSMS(pacijent.korisnik.brojTelefona, poruka);
          if (smsUspjeh) kanali.push("SMS");
        }

        // Email Slanje (ovdje možeš dodati Nodemailer kasnije)
        if (pacijent.korisnik.email) {
          console.log(`Email simulacija poslana na: ${pacijent.korisnik.email}`);
          kanali.push("EMAIL");
        }

        if (kanali.length > 0) {
          await prisma.reminderLog.create({
            data: {
              idPacijent: pacijent.id,
              channel: kanali.join(" & "),
              status: "SENT",
              message: poruka
            }
          });
        }
      }
    } catch (error) {
      console.error("Greška u reminder job-u:", error);
    }
  });
};