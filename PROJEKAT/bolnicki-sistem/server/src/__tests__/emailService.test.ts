import { vi, describe, it, expect, beforeEach } from "vitest";

let sendMock: any;

vi.mock("resend", () => {
  sendMock = vi.fn().mockResolvedValue({ id: "test-id" });
  return {
    Resend: vi.fn(function() {
      return {
        emails: {
          send: sendMock,
        },
      };
    }),
  };
});

const { posaljiPotvrdurezerv, posaljiPodsjetnik } = await import("../emailService.js");

beforeEach(() => {
  sendMock.mockClear();
});

// ─────────────────────────────────────────────
// posaljiPotvrdurezerv
// ─────────────────────────────────────────────
describe("posaljiPotvrdurezerv", () => {
  const lažniPodaci = {
    pacijentEmail: "pacijent@test.com",
    pacijentIme: "Emir",
    pacijentPrezime: "Hadžić",
    doktorIme: "Ana",
    doktorPrezime: "Marić",
    doktorSpecijalizacija: "Kardiologija",
    datum: new Date("2025-06-15"),
    vrijeme: 930, // 09:30
    rezervacijaId: 42,
    hitnost: false,
    komentar: undefined,
  };

  // ─── HAPPY PATH ───────────────────────────────

  it("uspješno šalje email sa ispravnim podacima — happy path", async () => {
    await posaljiPotvrdurezerv(lažniPodaci);

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "pacijent@test.com",
        subject: "✅ Potvrda rezervacije #42",
      })
    );
  });

  it("email sadrži ime i prezime pacijenta u tijelu", async () => {
    await posaljiPotvrdurezerv(lažniPodaci);

    const poziv = sendMock.mock.calls[0][0];
    expect(poziv.html).toContain("Emir");
    expect(poziv.html).toContain("Hadžić");
  });

  it("email sadrži ime doktora i specijalizaciju", async () => {
    await posaljiPotvrdurezerv(lažniPodaci);

    const poziv = sendMock.mock.calls[0][0];
    expect(poziv.html).toContain("Ana");
    expect(poziv.html).toContain("Marić");
    expect(poziv.html).toContain("Kardiologija");
  });

  it("ispravno formatira vrijeme 930 u 09:30", async () => {
    await posaljiPotvrdurezerv({ ...lažniPodaci, vrijeme: 930 });

    const poziv = sendMock.mock.calls[0][0];
    expect(poziv.html).toContain("09:30");
  });

  it("ispravno formatira vrijeme 1400 u 14:00", async () => {
    await posaljiPotvrdurezerv({ ...lažniPodaci, vrijeme: 1400 });

    const poziv = sendMock.mock.calls[0][0];
    expect(poziv.html).toContain("14:00");
  });

  it("email sadrži broj rezervacije u subjectu i tijelu", async () => {
    await posaljiPotvrdurezerv({ ...lažniPodaci, rezervacijaId: 99 });

    const poziv = sendMock.mock.calls[0][0];
    expect(poziv.html).toContain("99");
    expect(poziv.subject).toContain("99");
  });

  // ─── HITNOST ──────────────────────────────────

  it("email sadrži oznaku hitnosti kada je hitnost: true", async () => {
    await posaljiPotvrdurezerv({ ...lažniPodaci, hitnost: true });

    const poziv = sendMock.mock.calls[0][0];
    expect(poziv.html).toContain("Hitna rezervacija");
  });

  it("email ne sadrži oznaku hitnosti kada je hitnost: false", async () => {
    await posaljiPotvrdurezerv({ ...lažniPodaci, hitnost: false });

    const poziv = sendMock.mock.calls[0][0];
    expect(poziv.html).not.toContain("Hitna rezervacija");
  });

  // ─── KOMENTAR ─────────────────────────────────

  it("email sadrži komentar kada je poslan", async () => {
    await posaljiPotvrdurezerv({
      ...lažniPodaci,
      komentar: "Imam alergiju na penicilin",
    });

    const poziv = sendMock.mock.calls[0][0];
    expect(poziv.html).toContain("Imam alergiju na penicilin");
  });

  it("email ne sadrži red komentara u tabeli kada komentar nije poslan", async () => {
    await posaljiPotvrdurezerv({ ...lažniPodaci, komentar: undefined });

    const poziv = sendMock.mock.calls[0][0];
    expect(poziv.html).not.toContain(">Napomena<");
  });

  // ─── TIP PREGLEDA ─────────────────────────────

  it("email sadrži tip pregleda kada je poslan", async () => {
    await posaljiPotvrdurezerv({ ...lažniPodaci, tipPregleda: "Internistički pregled" });

    const poziv = sendMock.mock.calls[0][0];
    expect(poziv.html).toContain("Internistički pregled");
  });

  it("email ne sadrži red tipa pregleda kada nije poslan", async () => {
    await posaljiPotvrdurezerv({ ...lažniPodaci, tipPregleda: undefined });

    const poziv = sendMock.mock.calls[0][0];
    expect(poziv.html).not.toContain("Tip pregleda");
  });

  // ─── ERROR HANDLING ───────────────────────────

  it("baca grešku kada send ne uspije — API greška", async () => {
    sendMock.mockRejectedValueOnce(new Error("API greška"));

    await expect(posaljiPotvrdurezerv(lažniPodaci)).rejects.toThrow("API greška");
  });

  it("sendMail se poziva tačno jednom po pozivu funkcije", async () => {
    await posaljiPotvrdurezerv(lažniPodaci);
    await posaljiPotvrdurezerv(lažniPodaci);

    expect(sendMock).toHaveBeenCalledTimes(2);
  });
});
// ─────────────────────────────────────────────
// posaljiPodsjetnik — US-31
// ─────────────────────────────────────────────
describe("posaljiPodsjetnik", () => {
  const lažniPodaci = {
    pacijentEmail: "pacijent@test.com",
    pacijentIme: "Emir",
    pacijentPrezime: "Hadžić",
    doktorIme: "Ana",
    doktorPrezime: "Marić",
    doktorSpecijalizacija: "Kardiologija",
    datum: new Date("2025-06-15"),
    vrijeme: 570, // 09:30
    rezervacijaId: 42,
    hitnost: false,
    komentar: undefined,
  };

  it("uspješno šalje podsjetnik email — US-31 happy path", async () => {
    await posaljiPodsjetnik(lažniPodaci);

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "pacijent@test.com",
        subject: "⏰ Podsjetnik: Vaš termin je sutra #42",
      })
    );
  });

  it("podsjetnik sadrži ime i prezime pacijenta", async () => {
    await posaljiPodsjetnik(lažniPodaci);

    const poziv = sendMock.mock.calls[0][0];
    expect(poziv.html).toContain("Emir");
    expect(poziv.html).toContain("Hadžić");
  });

  it("podsjetnik sadrži ime doktora i specijalizaciju", async () => {
    await posaljiPodsjetnik(lažniPodaci);

    const poziv = sendMock.mock.calls[0][0];
    expect(poziv.html).toContain("Ana");
    expect(poziv.html).toContain("Marić");
    expect(poziv.html).toContain("Kardiologija");
  });

  it("podsjetnik ispravno formatira vrijeme 570 u 09:30", async () => {
    await posaljiPodsjetnik({ ...lažniPodaci, vrijeme: 570 });

    const poziv = sendMock.mock.calls[0][0];
    expect(poziv.html).toContain("09:30");
  });

  it("podsjetnik sadrži broj rezervacije u subjectu", async () => {
    await posaljiPodsjetnik({ ...lažniPodaci, rezervacijaId: 77 });

    const poziv = sendMock.mock.calls[0][0];
    expect(poziv.subject).toContain("77");
  });

  it("baca grešku kada send ne uspije — US-31", async () => {
    sendMock.mockRejectedValueOnce(new Error("API greška"));

    await expect(posaljiPodsjetnik(lažniPodaci)).rejects.toThrow("API greška");
  });

  it("sendMail se poziva tačno jednom po pozivu — US-31", async () => {
    await posaljiPodsjetnik(lažniPodaci);

    expect(sendMock).toHaveBeenCalledTimes(1);
  });
});