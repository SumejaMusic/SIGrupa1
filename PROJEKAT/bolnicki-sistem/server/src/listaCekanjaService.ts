import { prisma } from "./lib/prisma.js";
import { redis } from "./lib/redis.js";
import { io } from "./app.js";
import { posaljiWaitlistNotifikaciju } from "./emailService.js";

const WAITLIST_TTL_SECONDS = Number(process.env.WAITLIST_TTL_SECONDS ?? 120);

// ─── Prijava na listu čekanja ───────────────────────────────
export async function prijaviSeNaListuCekanja(
  pacijentId: number,
  doktorId: number,
  zeleniDatum: Date,
  prioritet?: string
) {
  const pocetak = new Date(zeleniDatum);
  pocetak.setUTCHours(0, 0, 0, 0);

  const kraj = new Date(zeleniDatum);
  kraj.setUTCHours(23, 59, 59, 999);

  const terminPostoji = await prisma.termin.findFirst({
    where: {
      idDoktor: doktorId,
      datum: { gte: pocetak, lte: kraj }
    }
  });

  if (!terminPostoji) {
    throw { status: 400, poruka: "Doktor ne radi taj dan." };
  }

  const slobodanTermin = await prisma.termin.findFirst({
    where: {
      idDoktor: doktorId,
      datum: { gte: pocetak, lte: kraj },
      status: "SLOBODAN"
    }
  });

  if (slobodanTermin) {
    throw { status: 400, poruka: "Postoje slobodni termini za taj dan. Zakažite direktno." };
  }

  const zapis = await prisma.listaCekanja.create({
    data: {
      idPacijent: pacijentId,
      idDoktor: doktorId,
      zeleniDatum: pocetak,
      prioritet: (prioritet as any) ?? "NORMALAN",
    }
  });

  return zapis;
}

// ─── Poziva se kada pacijent otkaže termin ──────────────────
// ─── Poziva se kada pacijent otkaže termin ──────────────────
export async function obradiOtkazivanje(terminId: number) {
  console.log("📌 obradiOtkazivanje START, terminId:", terminId);

  const lockKey = `waitlist:processing:${terminId}`;
  const existingLock = await redis.get(lockKey);
  if (existingLock) {
    console.log(`⚠️  obradiOtkazivanje već u toku za termin ${terminId}, preskačem.`);
    return;
  }
  await redis.setex(lockKey, 30, "1");

  try {
    let termin = await prisma.termin.findUnique({
      where: { id: terminId },
      include: {
        doktor: {
          include: { korisnik: true }
        }
      }
    });

    if (!termin) {
      console.log("❌ Termin nije pronađen:", terminId);
      return;
    }

    if (!["NA_CEKANJU", "SLOBODAN"].includes(termin.status)) {
      console.log(`⚠️  Termin ${terminId} ima status ${termin.status}, preskačem.`);
      return;
    }

    const zeleniDatum = new Date(termin.datum);
    zeleniDatum.setUTCHours(0, 0, 0, 0);

    // Lazy evaluacija: provjeri da li je prethodno obaviještenom pacijentu istekao rok
    if (termin.status === "NA_CEKANJU") {
      const trenutnoObavijesteni = await prisma.listaCekanja.findFirst({
        where: {
          idDoktor: termin.idDoktor,
          zeleniDatum: zeleniDatum,
          status: "OBAVIJESTEN" as any
        }
      });

      if (trenutnoObavijesteni) {
        const imaAktivnuPonudu = await redis.get(`waitlist:offer:${trenutnoObavijesteni.id}`);

        if (!imaAktivnuPonudu) {
          console.log(`⏰ Rok je istekao za pacijenta na listi ID: ${trenutnoObavijesteni.id}. Vraćam na kraj reda.`);

          await prisma.listaCekanja.update({
            where: { id: trenutnoObavijesteni.id },
            data: {
              status: "CEKA" as any,
              datumZahtjeva: new Date(),
            }
          });

          await prisma.termin.update({
            where: { id: termin.id },
            data: { status: "SLOBODAN", pacijent: { disconnect: true } }
          });

          termin = { ...termin, status: "SLOBODAN" as any, pacijentId: null } as typeof termin;
        } else {
          console.log(`⏳ Pacijent na listi ID: ${trenutnoObavijesteni.id} još uvijek ima vremena za odgovor.`);
          return;
        }
      }
    }

    console.log("📌 Tražim sljedećeg pacijenta na listi za datum:", termin.datum);

    // Uzimamo pacijente koji aktivno čekaju
    const sviCekaju = await prisma.listaCekanja.findMany({
      where: {
        idDoktor: termin.idDoktor,
        zeleniDatum,
        status: "CEKA",
      },
      orderBy: [
        { prioritet: "asc" },
        { datumZahtjeva: "asc" },
      ],
      include: {
        pacijent: { include: { korisnik: true } }
      }
    });

    console.log("📌 Broj čekajućih sa statusom CEKA:", sviCekaju.length);

    const sljedeciURedu = sviCekaju.length > 0 ? sviCekaju[0] : null;

    if (!sljedeciURedu) {
      console.log(`ℹ️ Nema pacijenata sa statusom CEKA za termin ${terminId}. Provjeravam ima li aktivnih ponuda...`);

      // SIGURNOSNA PROVJERA: Da li postoji iko ko je trenutno "OBAVIJESTEN" za ovog doktora i ovaj dan?
      const imaLiAktivnihPonuda = await prisma.listaCekanja.findFirst({
        where: {
          idDoktor: termin.idDoktor,
          zeleniDatum,
          status: "OBAVIJESTEN" as any
        }
      });

      // Oslobađamo termin jer za NJEGA trenutno nema kandidata
      await prisma.termin.update({
        where: { id: terminId },
        data: { status: "SLOBODAN", pacijent: { disconnect: true } }
      });

      // 🔥 AKO NEMA NIKOG DA ČEKA I NIKO NIJE OBAVIJESTEN -> Lista je stvarno mrtva, gasi sve!
      if (!imaLiAktivnihPonuda) {
        const ocisceno = await prisma.listaCekanja.updateMany({
          where: {
            idDoktor: termin.idDoktor,
            zeleniDatum,
            status: { in: ["CEKA", "OBAVIJESTEN"] } as any
          },
          data: { status: "OTKAZANO" as any }
        });
        console.log(`🧹 Lista potpuno prazna i zatvorena. Otkazano preostalih zahtjeva: ${ocisceno.count}`);
      } else {
        console.log("⏳ Lista se ne zatvara jer još uvijek postoji pacijent koji razmatra ponudu za drugi termin.");
      }

      io.emit("termin-azuriran", { doktorId: termin.idDoktor, terminId, status: "SLOBODAN" });
      return;
    }

    // --- Slanje ponude sljedećem pacijentu (Tvoj postojeći kod) ---
    await prisma.termin.update({
      where: { id: terminId },
      data: { status: "NA_CEKANJU" as any }
    });

    await redis.setex(
      `waitlist:offer:${sljedeciURedu.id}`,
      WAITLIST_TTL_SECONDS,
      String(terminId)
    );

    await prisma.listaCekanja.update({
      where: { id: sljedeciURedu.id },
      data: { status: "OBAVIJESTEN" as any }
    });

    const korisnik = sljedeciURedu.pacijent.korisnik;
    try {
      await posaljiWaitlistNotifikaciju({
        pacijentEmail: korisnik.email,
        pacijentIme: korisnik.ime,
        pacijentPrezime: korisnik.prezime,
        doktorIme: `${termin.doktor.korisnik.ime} ${termin.doktor.korisnik.prezime}`,
        datum: termin.datum,
        vrijeme: termin.vrijeme,
        listaCekanjaId: sljedeciURedu.id,
        rokPotvrde: new Date(Date.now() + WAITLIST_TTL_SECONDS * 1000)
      });
      console.log("✅ Waitlist notifikacija poslana na:", korisnik.email);
    } catch (emailErr) {
      console.error("❌ Waitlist email nije poslan:", emailErr);
    }

    io.to(`pacijent:${sljedeciURedu.idPacijent}`).emit("waitlist-ponuda", {
      listaCekanjaId: sljedeciURedu.id,
      terminId,
      vrijeme: termin.vrijeme,
      datum: termin.datum,
      rokPotvrde: new Date(Date.now() + WAITLIST_TTL_SECONDS * 1000)
    });

    // 🔥 OSIGURAČ: Ako pacijent ignoriše i ništa ne klikne, ovaj tajmer će sam pokrenuti
    // provjeru nakon isteka vremena, tako da sistem ne stoji zaleđen!
    setTimeout(async () => {
      console.log(`🤖 Automatizacija: Provjeravam timeout za listu čekanja, termin: ${terminId}`);
      await obradiOtkazivanje(terminId).catch((e) => console.error("Greška u timeoutu:", e));
    }, (WAITLIST_TTL_SECONDS + 2) * 1000);

  } finally {
    await redis.del(lockKey);
  }
}
// ─── Pacijent potvrđuje ponuđeni termin ────────────────────
export async function potvrdiWaitlistTermin(
  listaCekanjaId: number,
  pacijentId: number
) {
  const zapis = await prisma.listaCekanja.findFirst({
    where: { id: listaCekanjaId, idPacijent: pacijentId, status: "OBAVIJESTEN" }
  });

  if (!zapis) {
    throw { status: 404, poruka: "Zapis nije pronađen ili ne pripada vašem nalogu." };
  }

  const terminIdStr = await redis.get(`waitlist:offer:${listaCekanjaId}`);
  if (!terminIdStr) {
    throw { status: 410, poruka: "Rok za potvrdu je istekao. Ponuda više nije dostupna." };
  }

  const terminId = Number(terminIdStr);

  const resultado = await prisma.$transaction(async (tx) => {
    const termin = await tx.termin.findUnique({ where: { id: terminId } });
    if (!termin || termin.status !== ("NA_CEKANJU" as any)) {
      throw { status: 409, poruka: "Termin više nije dostupan." };
    }

    const kasnijiTermini = await tx.rezervacije.findMany({
      where: {
        idPacijent: pacijentId,
        idDoktor: termin.idDoktor,
        datumOtkazivanja: null,
        zavrseno: false,
        termin: {
          datum: { gt: termin.datum }
        }
      },
      include: { termin: true }
    });

    await tx.termin.update({
      where: { id: terminId },
      data: { status: "ZAKAZAN", pacijent: { connect: { id: pacijentId } } }
    });

    const rezervacija = await tx.rezervacije.create({
      data: {
        idTermina: terminId,
        idPacijent: pacijentId,
        idDoktor: termin.idDoktor,
      }
    });

    // Trenutni zahtjev prelazi u POTVRDJENO
    await tx.listaCekanja.update({
      where: { id: listaCekanjaId },
      data: { status: "POTVRDJENO" as any }
    });

    // POPRAVLJENO: Automatski izbacujemo (otkazujemo) sve OSTALE njegove aktivne zahtjeve za taj specifičan dan
    await tx.listaCekanja.updateMany({
      where: {
        idPacijent: pacijentId,
        zeleniDatum: zapis.zeleniDatum,
        id: { not: listaCekanjaId },
        status: { in: ["CEKA", "OBAVIJESTEN"] }
      },
      data: { status: "OTKAZANO" as any }
    });

    for (const rez of kasnijiTermini) {
      await tx.rezervacije.update({
        where: { id: rez.id },
        data: { datumOtkazivanja: new Date() }
      });

      await tx.termin.update({
        where: { id: rez.idTermina },
        data: { status: "SLOBODAN", pacijent: { disconnect: true } }
      });
    }

    return {
      rezervacija,
      otkazaniTerminIds: kasnijiTermini.map((r) => r.idTermina),
    };
  });

  await redis.del(`waitlist:offer:${listaCekanjaId}`);

  for (const otkazaniTerminId of resultado.otkazaniTerminIds) {
    await obradiOtkazivanje(otkazaniTerminId).catch((err) =>
      console.error("❌ obradiOtkazivanje greška za termin", otkazaniTerminId, err)
    );
  }

  return resultado;
}

// ─── Pacijent odbija ponuđeni termin ───────────────────────
export async function odbijWaitlistTermin(
  listaCekanjaId: number,
  pacijentId: number
) {
  const zapis = await prisma.listaCekanja.findFirst({
    where: { id: listaCekanjaId, idPacijent: pacijentId }
  });

  if (!zapis) {
    throw { status: 404, poruka: "Zapis nije pronađen ili ne pripada vašem nalogu." };
  }

  const terminIdStr = await redis.get(`waitlist:offer:${listaCekanjaId}`);

  // OVDJE OSTAJE "SOFT DELETE" (Samo mijenjamo status u ODBIJENO, podaci ostaju)
  await prisma.listaCekanja.update({
    where: { id: listaCekanjaId },
    data: { status: "ODBIJENO" as any }
  });

  await redis.del(`waitlist:offer:${listaCekanjaId}`);

  if (terminIdStr) {
    await obradiOtkazivanje(Number(terminIdStr));
  }
}

// ─── Pacijent odustaje od čekanja samoinicijativno ──────────
export async function otkaziCekanje(
  listaCekanjaId: number,
  pacijentId: number
) {
  const zapis = await prisma.listaCekanja.findFirst({
    where: {
      id: listaCekanjaId,
      idPacijent: pacijentId,
      status: { in: ["CEKA", "OBAVIJESTEN"] }
    }
  });

  if (!zapis) {
    throw { status: 404, poruka: "Zapis nije pronađen ili nije aktivan." };
  }

  await prisma.listaCekanja.update({
    where: { id: listaCekanjaId },
    data: { status: "OTKAZANO" as any }
  });

  if (zapis.status === "OBAVIJESTEN") {
    const terminIdStr = await redis.get(`waitlist:offer:${listaCekanjaId}`);
    await redis.del(`waitlist:offer:${listaCekanjaId}`);

    if (terminIdStr) {
      await prisma.termin.update({
        where: { id: Number(terminIdStr) },
        data: { status: "NA_CEKANJU" as any }
      }).catch(() => {});

      try {
        await obradiOtkazivanje(Number(terminIdStr));
      } catch (err) {
        console.error("❌ obradiOtkazivanje greška:", err);
        await prisma.termin.update({
          where: { id: Number(terminIdStr) },
          data: { status: "SLOBODAN", pacijent: { disconnect: true } }
        }).catch(() => {});
      }
    }
  }
}