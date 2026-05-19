export function getUserRole(): string | null {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    // JWT je base64url: header.payload.signature
    const payload = JSON.parse(atob(token.split(".")[1]));
    // Prilagodi naziv polja prema tvom backendu:
    return payload.role ?? payload.tip ?? payload.uloga ?? null;
  } catch {
    return null;
  }
}

export function isTokenValid(): boolean {
  try {
    const token = localStorage.getItem("token");
    if (!token) return false;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 > Date.now() : false;
  } catch {
    return false;
  }
}

export function handleExpiredSession(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("korisnik");
  window.dispatchEvent(new Event("istekla-sesija"));
  window.location.replace("/prijava");
}

export function getDoktorId(): string | null {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.doktorId?.toString() ?? null;
  } catch {
    return null;
  }
}

export function getDoktorIme(): string {
  try {
    const korisnik = localStorage.getItem("korisnik");
    if (!korisnik) return "Dr.";
    const parsed = JSON.parse(korisnik);
    const ime = parsed.ime ?? "";
    const prezime = parsed.prezime ?? "";
    if (!ime && !prezime) return "Dr.";
    return `Dr. ${ime} ${prezime}`;
  } catch {
    return "Dr.";
  }
}

export function odjava(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("korisnik");
  localStorage.removeItem("doctorPatient");
  localStorage.removeItem("doctorMode");
  window.location.replace("/prijava");
}