import { vi, describe, it, expect } from "vitest";
// 1. Uvoziš prismaMock jer si ga tako nazvala u fajlu unutar __mocks__
import { prismaMock } from "../lib/__mocks__/prisma.js"; 
import {
  getSviDoktori,
  getDoktorById,
  getRasporedDoktora,
} from "../controllers/doctorController.js";


vi.mock("../lib/prisma.js");

const mockReqRes = (params = {}, query = {}) => ({
  req: { params, query } as any, //simulacija request 
  res: { //simulacija response
    json: vi.fn(),
    status: vi.fn().mockReturnThis(),
  } as any,
  next: vi.fn(),
});

describe("getSviDoktori", () => {
    //testiramo da li se vracaju ispravne vrijednosti i da li su sve prisutne
 it("vraća listu svih doktora kada nema filtera", async () => {
  // 1. Definišeš više doktora
  const lažniDoktori = [
    { id: 1, specijalizacija: "Kardiologija" },
    { id: 2, specijalizacija: "Neurologija" },
    { id: 3, specijalizacija: "Pedijatrija" }
  ];
  
  vi.mocked(prismaMock.doktor.findMany).mockResolvedValue(lažniDoktori as any);

  const { req, res, next } = mockReqRes({}, {});
  await getSviDoktori(req, res, next);

  // 2. Provjeravaš da li je res.json pozvan sa TAČNO tim nizom
  expect(res.json).toHaveBeenCalledWith(lažniDoktori);
  
  // Dodatna provjera (opcionalno): Provjeri da li niz ima tačno 3 elementa
  const pozvaniPodaci = vi.mocked(res.json).mock.calls[0][0];
  expect(pozvaniPodaci).toHaveLength(3);
  
  expect(next).not.toHaveBeenCalled();
});

it("ignoriše prazne stringove u query parametrima", async () => {
  vi.mocked(prismaMock.doktor.findMany).mockResolvedValue([]);

  // Simuliramo URL: /api/doktori?specijalizacija=
  const { req, res, next } = mockReqRes({}, { specijalizacija: "" });
  await getSviDoktori(req, res, next);

  // Provjeravamo da Prisma NIJE dobila filter za specijalizaciju
  expect(prismaMock.doktor.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        specijalizacija: undefined // jer prazan string "" u JS je 'falsy'
      })
    })
  );
});

//testiramo da li ispravno salje vrijednosti sa undefined u upitu
 it("ne šalje filtere u WHERE kada query parametri nisu zadani", async () => {
  vi.mocked(prismaMock.doktor.findMany).mockResolvedValue([]);

  const { req, res, next } = mockReqRes({}, {}); // Prazan query
  await getSviDoktori(req, res, next);

  // Provjeravamo tačno šta je poslano Prismi
  expect(prismaMock.doktor.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        specijalizacija: undefined,
        idOdjela: undefined
      }
    })
  );
});

// Nedostaje KOMBINACIJA oba filtera
it("filtrira po specijalizaciji i odjelId istovremeno (precizna provjera)", async () => {
  // 1. Pripremamo bazu sa raznim slučajevima
  const sviDoktoriUBazi = [
    { id: 1, specijalizacija: "Kardiologija", idOdjela: 2 }, // PROLAZI
    { id: 2, specijalizacija: "Neurologija", idOdjela: 2 },  // PADA (pogrešna spec)
    { id: 3, specijalizacija: "Kardiologija", idOdjela: 5 }  // PADA (pogrešan odjel)
  ];

  // Simuliramo šta bi prava baza uradila (vratila bi samo prvog)
  const ocekivaniRezultat = [sviDoktoriUBazi[0]];
  
  vi.mocked(prismaMock.doktor.findMany).mockResolvedValue(ocekivaniRezultat as any);

  // 2. Šaljemo upit za Kardiologiju na odjelu 2
  const { req, res, next } = mockReqRes({}, { specijalizacija: "Kardiologija", odjelId: "2" });
  await getSviDoktori(req, res, next);

  // 3. Provjeravamo ulaz (šta je Prisma dobila)
  expect(prismaMock.doktor.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        specijalizacija: { contains: "Kardiologija", mode: "insensitive" },
        idOdjela: 2,
      })
    })
  );

  // 4. Provjeravamo izlaz (da li je korisnik dobio tačno ono što treba)
  expect(res.json).toHaveBeenCalledWith(ocekivaniRezultat);
  expect(vi.mocked(res.json).mock.calls[0][0]).toHaveLength(1);
});

  it("vraća prazan niz kada nema doktora", async () => {
    vi.mocked(prismaMock.doktor.findMany).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({}, {});
    await getSviDoktori(req, res, next);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("filtrira doktore po specijalizaciji", async () => {
    vi.mocked(prismaMock.doktor.findMany).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({}, { specijalizacija: "Kardiologija" });
    await getSviDoktori(req, res, next);

    expect(prismaMock.doktor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          specijalizacija: { contains: "Kardiologija", mode: "insensitive" },
        }),
      })
    );
  });

 it("filtrira doktore po odjelId (provjerava konverziju stringa i rezultat)", async () => {
  // 1. Simuliramo da u bazi imamo doktore sa raznih odjela
  const sviDoktoriUBazi = [
    { id: 1, ime: "Dr. Mujo", idOdjela: 2 },
    { id: 2, ime: "Dr. Suljo", idOdjela: 2 },
    { id: 3, ime: "Dr. Fata", idOdjela: 5 }, // Ovaj ne bi trebao biti u rezultatu
    { id: 4, ime: "Dr. Dzeko", idOdjela: 5 } // Ovaj ne bi trebao biti u rezultatu
  ];

  // Filtriramo ih ručno za potrebe mock-a (da simuliramo šta bi prava baza uradila)
  const filtriraniDoktori = sviDoktoriUBazi.filter(d => d.idOdjela === 2);
  
  vi.mocked(prismaMock.doktor.findMany).mockResolvedValue(filtriraniDoktori as any);

  // 2. Šaljemo "2" kao string (kao što dolazi iz URL-a)
  const { req, res, next } = mockReqRes({}, { odjelId: "2" });
  await getSviDoktori(req, res, next);

  // 3. PROVJERA 1: Da li je string "2" ispravno pretvoren u broj 2 za Prismu?
  expect(prismaMock.doktor.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        idOdjela: 2, // KLJUČNO: Provjeravamo da nije ostao string "2"
      }),
    })
  );

  // 4. PROVJERA 2: Da li je korisnik dobio samo doktore sa odjela 2?
  expect(res.json).toHaveBeenCalledWith(filtriraniDoktori);
  expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
    expect.objectContaining({ idOdjela: 2 })
  ]));
});

 it("poziva next s greškom kada baza podataka baci grešku", async () => {
  // 1. Priprema: Natjeramo Prismu da "pukne"
  const greška = new Error("DB greška");
  vi.mocked(prismaMock.doktor.findMany).mockRejectedValue(greška);

  const { req, res, next } = mockReqRes({}, {});
  
  // 2. Akcija
  await getSviDoktori(req, res, next);

  // 3. Provjera (Assert)
  // Provjeravamo da je greška proslijeđena Express error handleru
  expect(next).toHaveBeenCalledWith(greška);
  
  // KLJUČNI DODATAK: Provjeravamo da kontroler NIJE poslao odgovor korisniku
  // Ako je baza pukla, res.json se nikada ne smije izvršiti
  expect(res.json).not.toHaveBeenCalled();
});
});


describe("getSviDoktori - kombinacije filtera gdje jedna od vrijednosti ne postoji u bazi", () => {
  
  it("vraća prazan niz kada specijalizacija ne postoji", async () => {
    vi.mocked(prismaMock.doktor.findMany).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({}, { specijalizacija: "Nepostojeca" });
    await getSviDoktori(req, res, next);

    expect(res.json).toHaveBeenCalledWith([]);
    expect(prismaMock.doktor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          specijalizacija: { contains: "Nepostojeca", mode: "insensitive" },
        }),
      })
    );
  });

  it("vraća prazan niz kada odjelId ne postoji", async () => {
    vi.mocked(prismaMock.doktor.findMany).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({}, { odjelId: "999" });
    await getSviDoktori(req, res, next);

    expect(res.json).toHaveBeenCalledWith([]);
    expect(prismaMock.doktor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          idOdjela: 999,
        }),
      })
    );
  });

  it("vraća prazan niz kada ni specijalizacija ni odjelId ne postoje", async () => {
    vi.mocked(prismaMock.doktor.findMany).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({}, { specijalizacija: "Nepostojeca", odjelId: "999" });
    await getSviDoktori(req, res, next);

    expect(res.json).toHaveBeenCalledWith([]);
    expect(prismaMock.doktor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          specijalizacija: { contains: "Nepostojeca", mode: "insensitive" },
          idOdjela: 999,
        }),
      })
    );
  });

  it("vraća doktore kada specijalizacija postoji ali odjelId ne postoji", async () => {
    const lažniDoktori = [{ id: 1, specijalizacija: "Kardiologija" }];
    vi.mocked(prismaMock.doktor.findMany).mockResolvedValue(lažniDoktori as any);

    const { req, res, next } = mockReqRes({}, { specijalizacija: "Kardiologija", odjelId: "999" });
    await getSviDoktori(req, res, next);

    expect(res.json).toHaveBeenCalledWith(lažniDoktori);
    expect(prismaMock.doktor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          specijalizacija: { contains: "Kardiologija", mode: "insensitive" },
          idOdjela: 999,
        }),
      })
    );
  });

  it("vraća doktore kada odjelId postoji ali specijalizacija ne postoji", async () => {
    const lažniDoktori = [{ id: 2, specijalizacija: "Neurologija" }];
    vi.mocked(prismaMock.doktor.findMany).mockResolvedValue(lažniDoktori as any);

    const { req, res, next } = mockReqRes({}, { specijalizacija: "Nepostojeca", odjelId: "2" });
    await getSviDoktori(req, res, next);

    expect(res.json).toHaveBeenCalledWith(lažniDoktori);
    expect(prismaMock.doktor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          specijalizacija: { contains: "Nepostojeca", mode: "insensitive" },
          idOdjela: 2,
        }),
      })
    );
  });
});

describe("getDoktorById", () => {
  it("uspješno pronalazi i vraća doktora po ID-u sa svim povezanim podacima", async () => {
  // 1. Priprema
  const lažniDoktor = { 
    id: 1, 
    specijalizacija: "Kardiologija",
    korisnik: { ime: "Mujo" }, 
    odjel: { naziv: "Kardiologija" } 
  };
  vi.mocked(prismaMock.doktor.findUnique).mockResolvedValue(lažniDoktor as any);
  const { req, res, next } = mockReqRes({ id: "1" });

  // 2. Akcija
  await getDoktorById(req, res, next);

  // 3. Provjera ULAZA (ID konverzija + Include)
  expect(prismaMock.doktor.findUnique).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { id: 1 },
      include: expect.objectContaining({
        korisnik: { select: expect.any(Object) }, // Provjeravaš da li si tražila korisnika
        odjel: true                              // Provjeravaš da li si tražila odjel
      })
    })
  );

  // 4. Provjera IZLAZA
  expect(res.json).toHaveBeenCalledWith(lažniDoktor);
  expect(next).not.toHaveBeenCalled();
});
it("poziva next s greškom kada je ID nevalidan (nije broj)", async () => {
  // 1. Natjeraj Prismu da baci grešku ako primi NaN
  // Ovo simulira kako bi se prava baza ponašala
  vi.mocked(prismaMock.doktor.findUnique).mockImplementation(({ where }: any) => {
    if (isNaN(where.id)) {
      return Promise.reject(new Error("Inconsistent query: NaN"));
    }
    return Promise.resolve(null);
  });

  const { req, res, next } = mockReqRes({ id: "abc" });
  
  await getDoktorById(req, res, next);

  // Sada će next() biti pozvan jer smo mi rekli mocku da "pukne" na NaN
  expect(next).toHaveBeenCalled();
  expect(res.json).not.toHaveBeenCalled();
});

  it("vraća 404 kada doktor ne postoji", async () => {
    vi.mocked(prismaMock.doktor.findUnique).mockResolvedValue(null);

    const { req, res, next } = mockReqRes({ id: "999" });
    await getDoktorById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ poruka: "Doktor nije pronađen." });
  });

  it("poziva next pri grešci", async () => {
    const greška = new Error("DB greška");
    vi.mocked(prismaMock.doktor.findUnique).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ id: "1" });
    await getDoktorById(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
  });
});

describe("getRasporedDoktora", () => {
  it("vraća samo aktivne rasporede za doktora", async () => {
    const lažniRaspored = [
      { id: 1, idDoktor: 1, danUSedmici: 1, aktivan: true },
    ];
    vi.mocked(prismaMock.rasporedDoktora.findMany).mockResolvedValue(lažniRaspored as any);

    const { req, res, next } = mockReqRes({ id: "1" });
    await getRasporedDoktora(req, res, next);

    expect(res.json).toHaveBeenCalledWith(lažniRaspored);
  });

  it("poziva findMany s aktivan: true", async () => {
    vi.mocked(prismaMock.rasporedDoktora.findMany).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({ id: "1" });
    await getRasporedDoktora(req, res, next);

    expect(prismaMock.rasporedDoktora.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          aktivan: true,
          idDoktor: 1,
        }),
      })
    );
  });

  it("vraća prazan niz kada doktor nema rasporeda", async () => {
    vi.mocked(prismaMock.rasporedDoktora.findMany).mockResolvedValue([]);

    const { req, res, next } = mockReqRes({ id: "1" });
    await getRasporedDoktora(req, res, next);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("poziva next pri grešci", async () => {
    const greška = new Error("DB greška");
    vi.mocked(prismaMock.rasporedDoktora.findMany).mockRejectedValue(greška);

    const { req, res, next } = mockReqRes({ id: "1" });
    await getRasporedDoktora(req, res, next);

    expect(next).toHaveBeenCalledWith(greška);
  });
  it("traži raspored sortiran po danima u sedmici", async () => {
  vi.mocked(prismaMock.rasporedDoktora.findMany).mockResolvedValue([]);

  const { req, res, next } = mockReqRes({ id: "1" });
  await getRasporedDoktora(req, res, next);

  expect(prismaMock.rasporedDoktora.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      orderBy: { danUSedmici: "asc" }
    })
  );
});
});