import { forwardRef } from "react";
import type { UputnicaData } from "../../utils/uputnicaMapper";

interface Props {
  data: UputnicaData;
}

const labelStyle: React.CSSProperties = {
  fontSize: "9px",
  color: "#666",
  textTransform: "uppercase",
  letterSpacing: "0.4px",
  display: "block",
  marginBottom: "2px",
  fontWeight: "600",
};

const valueStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: "500",
  color: "#111",
  display: "block",
};

const sectionTitleStyle: React.CSSProperties = {
  fontWeight: "bold",
  fontSize: "9px",
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  borderBottom: "1px solid #333",
  paddingBottom: "3px",
  marginBottom: "8px",
};

const cellStyle: React.CSSProperties = {
  padding: "4px 14px 4px 0",
  verticalAlign: "top",
  width: "50%",
};

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <td style={cellStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value || "—"}</span>
    </td>
  );
}

function InfoCellFull({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td colSpan={2} style={{ ...cellStyle, width: "100%" }}>
        <span style={labelStyle}>{label}</span>
        <span style={valueStyle}>{value || "—"}</span>
      </td>
    </tr>
  );
}

export const UputnicaTemplate = forwardRef<HTMLDivElement, Props>(
  ({ data }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: "794px",
          minHeight: "1123px",
          padding: "57px 57px 57px 57px",
          backgroundColor: "#ffffff",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "12px",
          color: "#111",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "10px",
          }}
        >
          <div>
            <div
              style={{ fontWeight: "bold", fontSize: "13px", color: "#111" }}
            >
              {data.doktor.ustanova}
            </div>
            <div style={{ fontSize: "11px", marginTop: "4px", color: "#333" }}>
              Dr. {data.doktor.ime} {data.doktor.prezime}
            </div>
            {data.doktor.specijalizacija && (
              <div style={{ fontSize: "10px", color: "#555", marginTop: "2px" }}>
                {data.doktor.specijalizacija}
              </div>
            )}
            {data.doktor.licenca && (
              <div style={{ fontSize: "10px", color: "#555", marginTop: "1px" }}>
                Lic. br.: {data.doktor.licenca}
              </div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "24px",
                letterSpacing: "4px",
                color: "#111",
              }}
            >
              UPUTNICA
            </div>
            <div style={{ fontSize: "10px", marginTop: "4px", color: "#444" }}>
              Broj: {data.brojUputnice}
            </div>
            <div style={{ fontSize: "10px", marginTop: "2px", color: "#444" }}>
              Datum: {data.datum}
            </div>
          </div>
        </div>

        <hr
          style={{
            border: "none",
            borderTop: "2px solid #222",
            margin: "0 0 16px 0",
          }}
        />

        {/* Podaci o pacijentu */}
        <div style={sectionTitleStyle}>Podaci o pacijentu</div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "16px",
          }}
        >
          <tbody>
            <tr>
              <InfoCell
                label="Ime i prezime"
                value={`${data.pacijent.ime} ${data.pacijent.prezime}`}
              />
              <InfoCell
                label="Godina rođenja"
                value={
                  data.pacijent.godinaRodjenja
                    ? `${data.pacijent.godinaRodjenja}. god.`
                    : "—"
                }
              />
            </tr>
            <tr>
              <InfoCell label="JMBG / LBO" value={data.pacijent.jmbg} />
              <InfoCell label="Spol" value={data.pacijent.spol} />
            </tr>
            <InfoCellFull
              label="Email / Kontakt"
              value={`${data.pacijent.email}   ·   ${data.pacijent.telefon}`}
            />
          </tbody>
        </table>

        {/* Klinički nalaz */}
        <div style={sectionTitleStyle}>
          Klinički nalaz i razlog upućivanja
        </div>
        <div
          style={{
            border: "1px solid #bbb",
            borderRadius: "3px",
            padding: "10px 12px",
            minHeight: "90px",
            marginBottom: "16px",
            fontSize: "11px",
            whiteSpace: "pre-wrap",
            lineHeight: "1.65",
            color: "#111",
            backgroundColor: "#fafafa",
          }}
        >
          {data.pregled.kliniNalaz || "—"}
        </div>

        {/* Dijagnoza */}
        <div style={sectionTitleStyle}>Dijagnoza</div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "16px",
          }}
        >
          <tbody>
            <InfoCellFull label="Naziv dijagnoze" value={data.pregled.dijagnoza} />
          </tbody>
        </table>

        {/* Upućuje se kod */}
        <div style={sectionTitleStyle}>Upućuje se kod</div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "16px",
          }}
        >
          <tbody>
            <tr>
              <InfoCell
                label="Specijalnost / Odjeljenje"
                value={data.pregled.uputnoOdjeljenje}
              />
              <InfoCell label="Hitnost" value={data.pregled.hitnost} />
            </tr>
            <InfoCellFull label="Ustanova" value={data.pregled.uputnaUstanova} />
          </tbody>
        </table>

        {/* Napomena — prikazati samo ako postoji */}
        {data.pregled.napomena && (
          <>
            <div style={sectionTitleStyle}>Napomena</div>
            <div
              style={{
                border: "1px solid #bbb",
                borderRadius: "3px",
                padding: "8px 12px",
                marginBottom: "16px",
                fontSize: "11px",
                whiteSpace: "pre-wrap",
                color: "#444",
                backgroundColor: "#fafafa",
              }}
            >
              {data.pregled.napomena}
            </div>
          </>
        )}

        {/* Footer — pečat i potpis */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "48px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: "bold",
                marginBottom: "3px",
              }}
            >
              Dr. {data.doktor.ime} {data.doktor.prezime}
            </div>
            {data.doktor.specijalizacija && (
              <div
                style={{
                  fontSize: "10px",
                  color: "#555",
                  marginBottom: "2px",
                }}
              >
                {data.doktor.specijalizacija}
              </div>
            )}
            {data.doktor.licenca && (
              <div
                style={{
                  fontSize: "10px",
                  color: "#555",
                  marginBottom: "10px",
                }}
              >
                Licenca br.: {data.doktor.licenca}
              </div>
            )}
            <div
              style={{
                width: "160px",
                height: "65px",
                border: "1px solid #aaa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "2px",
              }}
            >
              <span
                style={{ fontSize: "9px", color: "#bbb", letterSpacing: "0.3px" }}
              >
                Pečat i potpis
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

UputnicaTemplate.displayName = "UputnicaTemplate";
