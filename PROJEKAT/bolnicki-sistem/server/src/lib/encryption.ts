import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

const getEncryptionKey = () => {
    const rawKey = process.env.MASTER_ENCRYPTION_KEY;

    if (!rawKey) {
        throw new Error(
            "Nedostaje MASTER_ENCRYPTION_KEY u .env fajlu. Generisite 32-byte hex kljuc i dodajte ga u server/.env."
        );
    }

    const key = Buffer.from(rawKey, "hex");
    if (key.length !== 32) {
        throw new Error("MASTER_ENCRYPTION_KEY mora biti 64 hex karaktera (32 bajta).");
    }

    return key;
};

export const enkriptuj = (tekst: string) : string => {
    const iv = crypto.randomBytes(12);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(
        ALGORITHM,
        key,
        iv
    );

    const enkriptovano = Buffer.concat([
        cipher.update(tekst, "utf8"),
        cipher.final()
    ]);

    const authTag = cipher.getAuthTag();
    return [
        iv.toString("hex"),
        authTag.toString("hex"),
        enkriptovano.toString("hex")
    ].join(":");
};

export const dekriptuj = (enkriptovanTekst: string): string => {
    const [ivHex, authTagHex, dataHex] = enkriptovanTekst.split(":");
    
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const data = Buffer.from(dataHex, "hex");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    decipher.setAuthTag(authTag);
    
    return Buffer.concat([
        decipher.update(data),
        decipher.final()
    ]).toString("utf8");
};
