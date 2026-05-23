import { prisma } from "../lib/prisma.js";

const SYSTEM_PROMPT_BASE = `Ti si Healthbook asistent — AI pomoćnik ugrađen u sistem za online rezervaciju medicinskih termina. Odgovaraj isključivo na bosanskom/hrvatskom/srpskom jeziku. Budi prijatan, koncizan i stručan. Nikad ne izmišljaj funkcionalnosti koje ne postoje u sistemu.

FUNKCIONALNOSTI SISTEMA:

REZERVACIJA TERMINA:
- Pacijent mora biti prijavljen za rezervaciju
- Pretraga doktora po imenu, specijalizaciji ili odjelu
- Doktor opšte prakse: max 60 dana unaprijed
- Specijalisti: max 12 mjeseci unaprijed
- Zabranjena dupla rezervacija kod istog doktora isti dan
- Termin se zaključava 2 minute tokom popunjavanja forme
- Email potvrda se šalje odmah nakon rezervacije
- Podsjetnik 24h prije termina

OTKAZIVANJE TERMINA:
- Pacijent može otkazati ako ima više od 24h do termina
- Sekcija "Moji termini" → dugme "Otkaži" → potvrda
- Medicinsko osoblje može otkazati u ime pacijenta
- Pacijent dobiva email obavijest o otkazivanju
- Ako doktor pomjeri termin — pacijent dobiva obavijest s opcijom prihvatanja

ODABIR DOKTORA:
- Pretraga po imenu, specijalizaciji ili odjelu
- Interaktivni kalendar slobodnih/zauzetih termina
- Vidljive su prosječne ocjene i anonimni komentari pacijenata
- Termin kod specijaliste može rezervisati i porodični doktor za pacijenta

LISTA ČEKANJA:
- Ako nema slobodnih termina → opcija "Prijavi se na listu čekanja"
- Kad se termin oslobodi → email + in-app notifikacija
- 30 minuta za prihvatanje ponuđenog termina
- Može se ukloniti sa liste u svakom trenutku

NALOG I SIGURNOST:
- Registracija: ime, prezime, email, telefon (obavezna email verifikacija)
- Reset lozinke putem emaila (link važi 10 min, max 3x/sat)
- Lozinka: min 8 znakova, 1 veliko slovo, 1 broj
- Automatska odjava nakon 15 minuta neaktivnosti
- 2FA putem emaila (opcionalno, aktivira se u postavkama profila)
- Nalog se blokira nakon 5 neuspješnih pokušaja prijave

HISTORIJA I NALAZI:
- Sekcija "Historija" — svi prošli i otkazani termini
- PDF nalazi koje je dodalo medicinsko osoblje vidljivi uz svaki termin
- Komentari uz rezervaciju vidljivi doktoru i administratoru

HRONIČNI BOLESNICI:
- Doktor označava pacijenta atributom "hronični bolesnik"
- Sistem šalje podsjetnike 7 dana prije rutinskog pregleda
- Kanali: email i SMS (ako je unesen broj telefona)
- Nema podsjetnika ako pacijent već ima zakazan termin u periodu

OCJENJIVANJE DOKTORA:
- Nakon završenog pregleda → poziv na ocjenjivanje (1-5 zvjezdica + komentar)
- Ocjena je potpuno anonimna
- Max 500 znakova za komentar

DEAKTIVACIJA PROFILA:
- Zahtjev u Postavkama profila
- Obrađuje se u roku 30 dana
- Anonimizacija ličnih podataka uz čuvanje medicinskih zapisa

ULOGE U SISTEMU:
- PACIJENT: rezervacija, otkazivanje, historija, lista čekanja
- DOKTOR: kalendar, historija pacijenata, izmjena termina, upit za promjenu dužine
- MEDICINSKO_OSOBLJE: kreiranje/otkazivanje termina, upload nalaza, označavanje hitnosti
- ADMINISTRATOR: upravljanje svim korisnicima, radno vrijeme doktora, statistika, export

Ako pitanje nije vezano za ovaj sistem, ljubazno napomeni da ne možeš pomoći s tim i preporuči da korisnik kontaktira kliniku direktno.`;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface KorisnikKontekst {
  id: number;
  uloga: string;
}

async function dohvatiPersonalniKontekst(korisnikId: number): Promise<string> {
  try {
    const korisnik = await prisma.korisnik.findUnique({
      where: { id: korisnikId },
      select: {
        ime: true,
        prezime: true,
        uloga: true,
        pacijentProfile: {
          select: {
            id: true,
            hronicniBolesnik: true,
          },
        },
      },
    });

    if (!korisnik) return "";

    let kontekst = `Korisnik koji razgovara s tobom:\n- Ime i prezime: ${korisnik.ime} ${korisnik.prezime}\n- Uloga u sistemu: ${korisnik.uloga}\n`;

    if (korisnik.pacijentProfile) {
      const termini = await prisma.termin.findMany({
        where: {
          pacijentId: korisnik.pacijentProfile.id,
          datum: { gte: new Date() },
          status: { notIn: ["SLOBODAN", "OTKAZAN"] },
        },
        include: {
          doktor: {
            include: {
              korisnik: { select: { ime: true, prezime: true } },
              odjel: { select: { naziv: true } },
            },
          },
        },
        orderBy: { datum: "asc" },
        take: 3,
      });

      if (termini.length > 0) {
        const listaTermina = termini
          .map((t) => {
            const datum = new Date(t.datum).toLocaleDateString("bs-BA");
            const sat = Math.floor(t.vrijeme / 60).toString().padStart(2, "0");
            const min = (t.vrijeme % 60).toString().padStart(2, "0");
            return `${datum} u ${sat}:${min} — Dr. ${t.doktor.korisnik.ime} ${t.doktor.korisnik.prezime} (${t.doktor.odjel.naziv})`;
          })
          .join("; ");
        kontekst += `- Nadolazeći termini: ${listaTermina}\n`;
      } else {
        kontekst += `- Nadolazeći termini: nema zakazanih termina\n`;
      }

      kontekst += `- Hronični bolesnik: ${korisnik.pacijentProfile.hronicniBolesnik ? "da" : "ne"}\n`;
    }

    return kontekst;
  } catch {
    return "";
  }
}

// Queue za Gemini free tier (2 req/min) — max 1 zahtjev svakih 35s
let lastGeminiCall = 0;
const GEMINI_INTERVAL_MS = 35_000;

async function callGeminiSafe(url: string, body: object): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastGeminiCall;

  if (elapsed < GEMINI_INTERVAL_MS) {
    const waitMs = GEMINI_INTERVAL_MS - elapsed;
    console.log(`[Gemini] Čekam ${Math.round(waitMs / 1000)}s zbog rate limita...`);
    await new Promise((r) => setTimeout(r, waitMs));
  }

  lastGeminiCall = Date.now();
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function pozoviChatAPI(
  message: string,
  history: ChatMessage[],
  korisnikKontekst?: KorisnikKontekst
): Promise<string> {
  let systemPrompt = SYSTEM_PROMPT_BASE;

  if (korisnikKontekst) {
    const personalniKontekst = await dohvatiPersonalniKontekst(korisnikKontekst.id);
    if (personalniKontekst) {
      systemPrompt = `${personalniKontekst}\n${SYSTEM_PROMPT_BASE}`;
    }
  }

  const geminiHistory = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const apiKey = process.env.GEMINI_API_KEY!;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

  const response = await callGeminiSafe(url, {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [...geminiHistory, { role: "user", parts: [{ text: message }] }],
    generationConfig: { maxOutputTokens: 1000 },
  });

  if (response.status === 429) {
    throw { status: 429, poruka: "Prekoračen limit zahtjeva prema AI usluzi.", kod: "AI_RATE_LIMIT" };
  }

  if (!response.ok) {
    const errBody = await response.text();
    console.error("Gemini API error:", response.status, errBody);
    throw { status: 500, poruka: "Greška pri pozivu AI asistenta.", kod: "AI_ERROR" };
  }

  const data = await response.json() as { candidates: { content: { parts: { text: string }[] } }[] };
  return data.candidates[0].content.parts[0].text;
}
