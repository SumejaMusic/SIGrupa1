import { prisma } from "./lib/prisma.js";
import bcrypt from "bcrypt";
import { enkriptuj } from "./lib/encryption.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { redis } from "./lib/redis.js"; //zbog email verifikacije
import { posaljiVerifikacioniKod } from "./emailService.js";

const MAX_NEUSPJELIH_PRIJAVA = 5;
const GENERICKA_GRESKA_PRIJAVE = "Pogresan email ili lozinka.";
const PORUKA_ZAKLJUCAN_NALOG =
    "Nalog je zakljucan zbog vise neuspjesnih pokusaja prijave. Resetujte lozinku za povrat pristupa.";


const VERIFIKACIJA_TTL_SEKUNDI = 15 * 60; // Kod vrijedi 15 minuta
const MAX_VERIFIKACIJA_POKUSAJA = 5;

const greskaZakljucanogNaloga = () => ({
    status: 423,
    poruka: PORUKA_ZAKLJUCAN_NALOG,
    kod: "ACCOUNT_LOCKED"
});

const evidentirajNeuspjeluPrijavu = async (
    korisnik: {
        id: number;
        brojNeuspjelihPrijava: number;
        nalogZakljucan: boolean;
    },
    ipAdresa?: string
) => {
    const sada = new Date();
    const brojNeuspjelihPrijava = korisnik.brojNeuspjelihPrijava + 1;
    const nalogZakljucan = brojNeuspjelihPrijava >= MAX_NEUSPJELIH_PRIJAVA;

    await prisma.$transaction(async (tx) => {
        await tx.korisnik.update({
            where: { id: korisnik.id },
            data: {
                brojNeuspjelihPrijava,
                nalogZakljucan,
                vrijemeZakljucavanja: nalogZakljucan ? sada : null,
                zadnjiNeuspjeliPokusaj: sada
            }
        });

        await tx.auditLog.create({
            data: {
                idKorisnika: korisnik.id,
                tipAkcije: nalogZakljucan ? "LOGIN_NALOG_ZAKLJUCAN" : "LOGIN_NEUSPJESAN",
                izmenjenaTabela: "Korisnik",
                stariPodaci: JSON.stringify({
                    brojNeuspjelihPrijava: korisnik.brojNeuspjelihPrijava,
                    nalogZakljucan: korisnik.nalogZakljucan
                }),
                noviPodaci: JSON.stringify({
                    brojNeuspjelihPrijava,
                    nalogZakljucan
                }),
                ipAdresa
            }
        });
    });

    return { brojNeuspjelihPrijava, nalogZakljucan };
};

const resetujNeuspjelePrijave = async (
    korisnik: {
        id: number;
        brojNeuspjelihPrijava: number;
        nalogZakljucan: boolean;
    },
    ipAdresa?: string
) => {
    if (korisnik.brojNeuspjelihPrijava === 0 && !korisnik.nalogZakljucan) {
        return;
    }

    await prisma.$transaction(async (tx) => {
        await tx.korisnik.update({
            where: { id: korisnik.id },
            data: {
                brojNeuspjelihPrijava: 0,
                nalogZakljucan: false,
                vrijemeZakljucavanja: null,
                zadnjiNeuspjeliPokusaj: null
            }
        });

        await tx.auditLog.create({
            data: {
                idKorisnika: korisnik.id,
                tipAkcije: "LOGIN_USPJESAN_RESET_NEUSPJELIH_PRIJAVA",
                izmenjenaTabela: "Korisnik",
                stariPodaci: JSON.stringify({
                    brojNeuspjelihPrijava: korisnik.brojNeuspjelihPrijava,
                    nalogZakljucan: korisnik.nalogZakljucan
                }),
                noviPodaci: JSON.stringify({
                    brojNeuspjelihPrijava: 0,
                    nalogZakljucan: false
                }),
                ipAdresa
            }
        });
    });
};
const validacijaJMBG = (jmbg: string, datumRodjenja: Date): boolean => {
    if (!/^\d{13}$/.test(jmbg)) return false;

    const danJMBG = Number(jmbg.substring(0, 2));
    const mjesecJMBG = Number(jmbg.substring(2, 4));
    const godinaTriCifre = Number(jmbg.substring(4, 7));

    let godinaJMBG: number;
    if (godinaTriCifre <= 99) {
        godinaJMBG = 2000 + godinaTriCifre;
    } else {
        godinaJMBG = 1000 + godinaTriCifre;
    }

    const datumIzJMBG = new Date(godinaJMBG, mjesecJMBG - 1, danJMBG);

    if (
        datumIzJMBG.getFullYear() !== godinaJMBG ||
        datumIzJMBG.getMonth() !== mjesecJMBG - 1 ||
        datumIzJMBG.getDate() !== danJMBG
    ) return false;

    return (
        datumRodjenja.getFullYear() === godinaJMBG &&
        datumRodjenja.getMonth() === mjesecJMBG - 1 &&
        datumRodjenja.getDate() === danJMBG
    );
};

// VERIFIKACIJA EMAIL-a
export const verifikujEmailService = async (podaci: {
    email: string;
    kod: string;
    ipAdresa?: string;
}) => {
    const { email, kod, ipAdresa } = podaci;
 
    if (!email || !kod) {
        throw { status: 400, poruka: "Email i verifikacioni kod su obavezni." };
    }
 
    const korisnik = await prisma.korisnik.findUnique({ where: { email } });
    if (!korisnik) {
        throw { status: 401, poruka: "Nevažeći verifikacioni kod." };
    }
 
    if (korisnik.emailVerifikovan) {
        throw { status: 400, poruka: "Email je već verifikovan. Možete se prijaviti.", kod: "ALREADY_VERIFIED" };
    }
 
    const redisKey = `email-verifikacija:${korisnik.id}`;
    const redisPodaciStr = await redis.get(redisKey);
 
    if (!redisPodaciStr) {
        throw {
            status: 401,
            poruka: "Verifikacioni kod je istekao. Zatražite novi kod.",
            kod: "VERIFICATION_EXPIRED"
        };
    }
 
    const redisPodaci = JSON.parse(redisPodaciStr);
 
    // Provjeri broj pokušaja
    if (redisPodaci.pokusaji >= MAX_VERIFIKACIJA_POKUSAJA) {
        await redis.del(redisKey);
        throw {
            status: 429,
            poruka: "Previše neuspjelih pokušaja. Zatražite novi kod.",
            kod: "MAX_ATTEMPTS"
        };
    }
 
    const uneseniKodHash = crypto.createHash("sha256").update(kod).digest("hex");
 
    if (uneseniKodHash !== redisPodaci.kodHash) {
        redisPodaci.pokusaji += 1;
        const preostaloTTL = await redis.ttl(redisKey);
        await redis.setex(redisKey, preostaloTTL > 0 ? preostaloTTL : 1, JSON.stringify(redisPodaci));
 
        const preostalo = MAX_VERIFIKACIJA_POKUSAJA - redisPodaci.pokusaji;
        throw {
            status: 401,
            poruka: preostalo > 0
                ? `Pogrešan verifikacioni kod. Preostalo pokušaja: ${preostalo}.`
                : "Previše neuspjelih pokušaja. Zatražite novi kod.",
        };
    }
 
    // Kod je tačan — obriši iz Redis-a i označi email kao verifikovan
    await redis.del(redisKey);
 
    await prisma.$transaction(async (tx) => {
        await tx.korisnik.update({
            where: { id: korisnik.id },
            data: { emailVerifikovan: true },
        });
 
        await tx.auditLog.create({
            data: {
                idKorisnika: korisnik.id,
                tipAkcije: "EMAIL_VERIFIKOVAN",
                izmenjenaTabela: "Korisnik",
                stariPodaci: JSON.stringify({ emailVerifikovan: false }),
                noviPodaci: JSON.stringify({ emailVerifikovan: true }),
                ipAdresa,
            },
        });
    });
 
    return { uspjesno: true };
};

// PONOVO POŠALJI VERIFIKACIONI KOD
// ═══════════════════════════════════════════════════════════════
export const ponovoPosaljiVerifikacijuService = async (podaci: {
    email: string;
    ipAdresa?: string;
}) => {
    const { email, ipAdresa } = podaci;
 
    const korisnik = await prisma.korisnik.findUnique({ where: { email } });
    if (!korisnik) {
        // Ne otkrivaj da korisnik ne postoji
        return { poslano: true };
    }
 
    if (korisnik.emailVerifikovan) {
        throw { status: 400, poruka: "Email je već verifikovan." };
    }
 
    // Rate limit: max 3 ponovnih slanja u 15 minuta
    const rateLimitKey = `verifikacija-resend:${korisnik.id}`;
    const resendCountStr = await redis.get(rateLimitKey);
    const resendCount = resendCountStr ? parseInt(resendCountStr, 10) : 0;
 
    if (resendCount >= 3) {
        throw {
            status: 429,
            poruka: "Previše zahtjeva za ponovnim slanjem. Pokušajte ponovo za 15 minuta.",
        };
    }
 
    const verifikacioniKod = crypto.randomInt(100000, 999999).toString();
    const kodHash = crypto.createHash("sha256").update(verifikacioniKod).digest("hex");
 
    const redisKey = `email-verifikacija:${korisnik.id}`;
    const redisPodaci = JSON.stringify({
        kodHash,
        pokusaji: 0,
        email: korisnik.email,
    });
 
    await redis.setex(redisKey, VERIFIKACIJA_TTL_SEKUNDI, redisPodaci);
 
    const ttl = await redis.ttl(rateLimitKey);
    const expiry = ttl > 0 ? ttl : 15 * 60;
    await redis.setex(rateLimitKey, expiry, (resendCount + 1).toString());
 
    await posaljiVerifikacioniKod(korisnik.email, korisnik.ime, verifikacioniKod);
 
    await prisma.auditLog.create({
        data: {
            idKorisnika: korisnik.id,
            tipAkcije: "VERIFIKACIONI_KOD_PONOVO_POSLAN",
            izmenjenaTabela: "Korisnik",
            noviPodaci: JSON.stringify({ pokusajSlanja: resendCount + 1 }),
            ipAdresa,
        },
    });
 
    return { poslano: true };
};
// REGISTRACIJA — IZMIJENJENO
// Sada nakon kreiranja naloga salje verifikacioni kod na email.
// Korisnik NE moze da se prijavi dok ne verifikuje email.
export const registracijaService = async (podaci: {
    jmbg: string;
    ime: string;
    prezime: string;
    datumRodjenja: string;
    email: string;
    pristupnaSifra: string;
    brojTelefona?: string;
    brojKnjizice: string;
}) => {
    const { jmbg, ime, prezime, datumRodjenja, email, pristupnaSifra, brojTelefona, brojKnjizice } = podaci;

    const datum = new Date(datumRodjenja + "T00:00:00");

    if (isNaN(datum.getTime())) {
        throw { status: 400, poruka: "Datum rođenja nije validan." };
    }

    const danas = new Date();
    danas.setHours(0, 0, 0, 0);
    if (datum > danas) {
        throw { status: 400, poruka: "Datum rođenja ne može biti u budućnosti." };
    }
    
    if (!validacijaJMBG(jmbg, datum)) {
        throw { status: 400, poruka: "JMBG koji ste unijeli nije validan." };
    }

    const regexSlova = /^[A-Za-zČĆŽŠĐčćžšđ\s-]+$/;
    if (!ime || !prezime) {
        throw { status: 400, poruka: "Ime i prezime su obavezni." };
    }
    if (!regexSlova.test(ime) || !regexSlova.test(prezime)) {
        throw { status: 400, poruka: "Ime i prezime mogu sadržavati samo slova." };
    }

    const regexTelefon = /^(\+387|0)\d{8,9}$/;
    if (brojTelefona && !regexTelefon.test(brojTelefona)) {
        throw { status: 400, poruka: "Broj telefona nije validan." };
    }

    if (!brojKnjizice) {
        throw { status: 400, poruka: "Broj zdravstvene knjižice je obavezan." };
    }

    if (!pristupnaSifra || pristupnaSifra.length < 8) {
        throw { status: 400, poruka: "Lozinka mora imati najmanje 8 karaktera." };
    }
    if (!/[A-Z]/.test(pristupnaSifra)) throw { status: 400, poruka: "Lozinka mora sadržavati veliko slovo." };
    if (!/[a-z]/.test(pristupnaSifra)) throw { status: 400, poruka: "Lozinka mora sadržavati malo slovo." };
    if (!/[0-9]/.test(pristupnaSifra)) throw { status: 400, poruka: "Lozinka mora sadržavati broj." };
    if (!/[^A-Za-z0-9]/.test(pristupnaSifra)) throw { status: 400, poruka: "Lozinka mora sadržavati specijalni karakter." };

    // provjera duplikata email
    const korisnikReg = await prisma.korisnik.findUnique({ where: { email } });
    if (korisnikReg) {
        throw { status: 409, poruka: "Korisnik sa ovim emailom je već registrovan." };
    }

    // provjera duplikata JMBG
    const jmbgHash = crypto.createHash("sha256").update(jmbg).digest("hex");
    const postojiJmbg = await prisma.korisnik.findUnique({ where: { jmbgHash } });
    if (postojiJmbg) {
        throw { status: 409, poruka: "Korisnik sa ovim JMBG je već registrovan." };
    }

    // provjera duplikata knjizice
    const brojKnjiziceHash = crypto.createHash("sha256").update(brojKnjizice).digest("hex");
    const postojiKnjizica = await prisma.pacijent.findUnique({ where: { brojKnjiziceHash: brojKnjiziceHash } });
    if (postojiKnjizica) {
        throw { status: 409, poruka: "Broj zdravstvene knjižice je već registrovan." };
    }

    // hashiranje i enkripcija
    const hashovanaSifra = await bcrypt.hash(pristupnaSifra, 12);
    const enkriptovanJmbg = enkriptuj(jmbg);
    const enkriptovanBrojKnjizice = enkriptuj(brojKnjizice);

    const noviKorisnik = await prisma.$transaction(async (tx) => {
    const korisnik = await tx.korisnik.create({
        data: {
            jmbg: enkriptovanJmbg,
            jmbgHash,
            ime,
            prezime,
            datumRodjenja: datum,
            email,
            pristupnaSifra: hashovanaSifra,
            brojTelefona,
            // NOVO: email nije verifikovan pri registraciji
            emailVerifikovan: false,
        }
    });

    await tx.pacijent.create({
        data: {
            idKorisnik: korisnik.id,   // ✅ korisnik.id, ne noviKorisnik.id!
            brojKnjizice: enkriptovanBrojKnjizice,   // ✅ koristi već enkriptovanu varijablu
            brojKnjiziceHash: brojKnjiziceHash,
        }
    });

    return korisnik;
});
// NOVO: Generiši verifikacioni kod i pošalji na email
    // ═══════════════════════════════════════════════════════════
    const verifikacioniKod = crypto.randomInt(100000, 999999).toString();
    const kodHash = crypto.createHash("sha256").update(verifikacioniKod).digest("hex");
 
    const redisKey = `email-verifikacija:${noviKorisnik.id}`;
    const redisPodaci = JSON.stringify({
        kodHash,
        pokusaji: 0,
        email: noviKorisnik.email,
    });
 
    await redis.setex(redisKey, VERIFIKACIJA_TTL_SEKUNDI, redisPodaci);
 
    await posaljiVerifikacioniKod(noviKorisnik.email, noviKorisnik.ime, verifikacioniKod);
 
    // Maskiraj email za prikaz
    const [localPart, domain] = noviKorisnik.email.split("@");
    const maskiran =
        localPart.length <= 2
            ? localPart[0] + "***"
            : localPart[0] + "***" + localPart[localPart.length - 1];
    const maskiraniEmail = `${maskiran}@${domain}`;
 
    return {
        id: noviKorisnik.id,
        ime: noviKorisnik.ime,
        prezime: noviKorisnik.prezime,
        email: noviKorisnik.email,
        uloga: noviKorisnik.uloga,
        // NOVO: signal frontendu da treba verifikacija
        emailVerifikacijaPotrebna: true,
        maskiraniEmail,
    };
};
export const prijavaService = async (podaci: {
    email: string;
    pristupnaSifra: string;
    ipAdresa?: string;
}) => {
    const { email, pristupnaSifra, ipAdresa } = podaci;

    if (!email || !pristupnaSifra) {
        throw { status: 400, poruka: "Email i lozinka su obavezni." };
    }

    // tražimo korisnika po emailu
    const korisnik = await prisma.korisnik.findUnique({ where: { email } });
    if (!korisnik) {
        throw { status: 401, poruka: GENERICKA_GRESKA_PRIJAVE };
    }

    if (korisnik.nalogZakljucan) {
        throw greskaZakljucanogNaloga();
    }

    // provjera lozinke
    const sifraIspravna = await bcrypt.compare(pristupnaSifra, korisnik.pristupnaSifra);
    if (!sifraIspravna) {
        const rezultat = await evidentirajNeuspjeluPrijavu(korisnik, ipAdresa);

        if (rezultat.nalogZakljucan) {
            throw greskaZakljucanogNaloga();
        }

        if (rezultat.brojNeuspjelihPrijava === MAX_NEUSPJELIH_PRIJAVA - 1) {
            throw {
                status: 401,
                poruka: `${GENERICKA_GRESKA_PRIJAVE} Preostao je jos 1 pokusaj prije blokade naloga.`,
                kod: "LOGIN_ATTEMPT_WARNING"
            };
        }

        throw { status: 401, poruka: GENERICKA_GRESKA_PRIJAVE };
    }
    //Provjeri da li je email verifikovan
    if (!korisnik.emailVerifikovan) {
        throw {
            status: 403,
            poruka: "Email adresa nije verifikovana. Provjerite email za verifikacioni kod.",
            kod: "EMAIL_NOT_VERIFIED",
            email: korisnik.email,
        };
    }

    await resetujNeuspjelePrijave(korisnik, ipAdresa);

    // generisanje JWT tokena
    const token = jwt.sign(
        { id: korisnik.id, uloga: korisnik.uloga },
        process.env.JWT_SECRET!,
        { expiresIn: "8h" }
    );

    return {
        id: korisnik.id,
        ime: korisnik.ime,
        prezime: korisnik.prezime,
        email: korisnik.email,
        uloga: korisnik.uloga,
        token
    };
};
