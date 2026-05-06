import { vi, describe, it, expect, beforeEach } from "vitest";
import nodemailer from "nodemailer";

vi.mock("nodemailer");

const sendMailMock = vi.fn().mockResolvedValue({ messageId: "test-id" });

vi.mocked(nodemailer.createTransport).mockReturnValue({
  sendMail: sendMailMock,
} as any);

const { posaljiPotvrdurezerv, posaljiPodsjetnik } = await import("../emailService.js");

beforeEach(() => {
  sendMailMock.mockClear();
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

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "pacijent@test.com",
        subject: "✅ Potvrda rezervacije #42",
      })
    );
  });

  it("email sadrži ime i prezime pacijenta u tijelu", async () => {
    await posaljiPotvrdurezerv(lažniPodaci);

    const poziv = sendMailMock.mock.calls[0][0];
    expect(poziv.html).toContain("Emir");
    expect(poziv.html).toContain("Hadžić");
  });

  it("email sadrži ime doktora i specijalizaciju", async () => {
    await posaljiPotvrdurezerv(lažniPodaci);

    const poziv = sendMailMock.mock.calls[0][0];
    expect(poziv.html).toContain("Ana");
    expect(poziv.html).toContain("Marić");
    expect(poziv.html).toContain("Kardiologija");
  });

  it("ispravno formatira vrijeme 930 u 09:30", async () => {
    await posaljiPotvrdurezerv({ ...lažniPodaci, vrijeme: 930 });

    const poziv = sendMailMock.mock.calls[0][0];
    expect(poziv.html).toContain("09:30");
  });

  it("ispravno formatira vrijeme 1400 u 14:00", async () => {
    await posaljiPotvrdurezerv({ ...lažniPodaci, vrijeme: 1400 });

    const poziv = sendMailMock.mock.calls[0][0];
    expect(poziv.html).toContain("14:00");
  });

  it("email sadrži broj rezervacije u subjectu i tijelu", async () => {
    await posaljiPotvrdurezerv({ ...lažniPodaci, rezervacijaId: 99 });

    const poziv = sendMailMock.mock.calls[0][0];
    expect(poziv.html).toContain("99");
    expect(poziv.subject).toContain("99");
  });

  // ─── HITNOST ──────────────────────────────────

  it("email sadrži oznaku hitnosti kada je hitnost: true", async () => {
    await posaljiPotvrdurezerv({ ...lažniPodaci, hitnost: true });

    const poziv = sendMailMock.mock.calls[0][0];
    expect(poziv.html).toContain("Hitna rezervacija");
  });

  it("email ne sadrži oznaku hitnosti kada je hitnost: false", async () => {
    await posaljiPotvrdurezerv({ ...lažniPodaci, hitnost: false });

    const poziv = sendMailMock.mock.calls[0][0];
    expect(poziv.html).not.toContain("Hitna rezervacija");
  });

  // ─── KOMENTAR ─────────────────────────────────

  it("email sadrži komentar kada je poslan", async () => {
    await posaljiPotvrdurezerv({
      ...lažniPodaci,
      komentar: "Imam alergiju na penicilin",
    });

    const poziv = sendMailMock.mock.calls[0][0];
    expect(poziv.html).toContain("Imam alergiju na penicilin");
  });

  it("email ne sadrži red komentara u tabeli kada komentar nije poslan", async () => {
    await posaljiPotvrdurezerv({ ...lažniPodaci, komentar: undefined });

    const poziv = sendMailMock.mock.calls[0][0];
    expect(poziv.html).not.toContain(">Napomena<");
  });

  // ─── TIP PREGLEDA ─────────────────────────────

  it("email sadrži tip pregleda kada je poslan", async () => {
    await posaljiPotvrdurezerv({ ...lažniPodaci, tipPregleda: "Internistički pregled" });

    const poziv = sendMailMock.mock.calls[0][0];
    expect(poziv.html).toContain("Internistički pregled");
  });

  it("email ne sadrži red tipa pregleda kada nije poslan", async () => {
    await posaljiPotvrdurezerv({ ...lažniPodaci, tipPregleda: undefined });

    const poziv = sendMailMock.mock.calls[0][0];
    expect(poziv.html).not.toContain("Tip pregleda");
  });

  // ─── ERROR HANDLING ───────────────────────────

  it("baca grešku kada sendMail ne uspije — SMTP greška", async () => {
    sendMailMock.mockRejectedValueOnce(new Error("SMTP greška"));

    await expect(posaljiPotvrdurezerv(lažniPodaci)).rejects.toThrow("SMTP greška");
  });

  it("sendMail se poziva tačno jednom po pozivu funkcije", async () => {
    await posaljiPotvrdurezerv(lažniPodaci);
    await posaljiPotvrdurezerv(lažniPodaci);

    expect(sendMailMock).toHaveBeenCalledTimes(2);
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
    vrijeme: 930,
    rezervacijaId: 42,
    hitnost: false,
    komentar: undefined,
  };

  it("uspješno šalje podsjetnik email — US-31 happy path", async () => {
    await posaljiPodsjetnik(lažniPodaci);

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "pacijent@test.com",
        subject: "⏰ Podsjetnik: Vaš termin je sutra #42",
      })
    );
  });

  it("podsjetnik sadrži ime i prezime pacijenta", async () => {
    await posaljiPodsjetnik(lažniPodaci);

    const poziv = sendMailMock.mock.calls[0][0];
    expect(poziv.html).toContain("Emir");
    expect(poziv.html).toContain("Hadžić");
  });

  it("podsjetnik sadrži ime doktora i specijalizaciju", async () => {
    await posaljiPodsjetnik(lažniPodaci);

    const poziv = sendMailMock.mock.calls[0][0];
    expect(poziv.html).toContain("Ana");
    expect(poziv.html).toContain("Marić");
    expect(poziv.html).toContain("Kardiologija");
  });

  it("podsjetnik ispravno formatira vrijeme 930 u 09:30", async () => {
    await posaljiPodsjetnik({ ...lažniPodaci, vrijeme: 930 });

    const poziv = sendMailMock.mock.calls[0][0];
    expect(poziv.html).toContain("09:30");
  });

  it("podsjetnik sadrži broj rezervacije u subjectu", async () => {
    await posaljiPodsjetnik({ ...lažniPodaci, rezervacijaId: 77 });

    const poziv = sendMailMock.mock.calls[0][0];
    expect(poziv.subject).toContain("77");
  });

  it("baca grešku kada sendMail ne uspije — US-31", async () => {
    sendMailMock.mockRejectedValueOnce(new Error("SMTP greška"));

    await expect(posaljiPodsjetnik(lažniPodaci)).rejects.toThrow("SMTP greška");
  });

  it("sendMail se poziva tačno jednom po pozivu — US-31", async () => {
    await posaljiPodsjetnik(lažniPodaci);

    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });
});