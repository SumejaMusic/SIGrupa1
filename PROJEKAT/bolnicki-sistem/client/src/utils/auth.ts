export function getUserRole(): "doktor" | "pacijent" | null {
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