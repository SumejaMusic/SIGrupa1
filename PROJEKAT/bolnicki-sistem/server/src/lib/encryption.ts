import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

const key = Buffer.from(
    process.env.MASTER_ENCRYPTION_KEY!,
    "hex"
);

export const enkriptuj = (tekst: string) : string => {
    const iv = crypto.randomBytes(12);
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