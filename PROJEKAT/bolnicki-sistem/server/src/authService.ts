import { prisma } from "./lib/prisma.js";
import bcrypt from "bcrypt";
import { enkriptuj } from "./lib/encryption.js";
import crypto from "crypto";

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
    const postojiKnjizica = await prisma.pacijent.findUnique({ where: { brojKnjiziceHash } });
    if (postojiKnjizica) {
        throw { status: 409, poruka: "Broj zdravstvene knjižice je već registrovan." };
    }

    // hashiranje i enkripcija
    const hashovanaSifra = await bcrypt.hash(pristupnaSifra, 12);
    const enkriptovanJmbg = enkriptuj(jmbg);
    const enkriptovanBrojKnjizice = enkriptuj(brojKnjizice);

    // kreiranje korisnika i pacijenta u transakciji
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
                brojTelefona
            }
        });

        await tx.pacijent.create({
            data: {
                idKorisnik: korisnik.id,
                brojKnjizice: enkriptovanBrojKnjizice,
                brojKnjiziceHash,
            }
        });

        return korisnik;
    });

    return {
        id: noviKorisnik.id,
        ime: noviKorisnik.ime,
        prezime: noviKorisnik.prezime,
        email: noviKorisnik.email,
        uloga: noviKorisnik.uloga
    };
};