import { useState } from "react";
import { X, FileText, Loader2 } from "lucide-react";
import type { UputnicaData } from "../../utils/uputnicaMapper";
import { UputnicaTemplate } from "./UputnicaTemplate";
import { useUputnicaPDF } from "../../hooks/useUputnicaPDF";

interface Props {
  data: UputnicaData;
  onClose: () => void;
}

const SCALE = 0.53;
const TEMPLATE_W = 794;
const TEMPLATE_H = 1123;

export function UputnicaModal({ data, onClose }: Props) {
  const { templateRef, generisiPDF } = useUputnicaPDF();
  const [editableData, setEditableData] = useState<UputnicaData>(data);
  const [generisanje, setGenerisanje] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  const updatePregled = (field: string, value: string) => {
    setEditableData((prev) => ({
      ...prev,
      pregled: { ...prev.pregled, [field]: value },
    }));
  };

  const handleGenerisi = async () => {
    setGenerisanje(true);
    setGreska(null);
    try {
      await generisiPDF(editableData);
    } catch {
      setGreska("Greška pri generisanju PDF-a. Pokušajte ponovo.");
    } finally {
      setGenerisanje(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      {/* Skriveni template u punoj A4 veličini — koristi se za generisanje PDF-a */}
      <div style={{ position: "fixed", top: "-9999px", left: "-9999px", zIndex: -1 }}>
        <UputnicaTemplate ref={templateRef} data={editableData} />
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <FileText size={17} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Generiši uputnicu
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                {data.pacijent.ime} {data.pacijent.prezime} · Uputnica br.{" "}
                {data.brojUputnice}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* Tijelo — forma lijevo, pregled desno */}
        <div className="flex flex-1 overflow-hidden">

          {/* Lijevo: forma za uređivanje */}
          <div className="w-80 flex-shrink-0 overflow-y-auto p-5 border-r border-gray-100 space-y-4">

            {/* Pacijent — samo prikaz */}
            <div>
              <p
                className="text-gray-400 font-bold uppercase mb-2"
                style={{ fontSize: "9px", letterSpacing: "0.8px" }}
              >
                Pacijent
              </p>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="text-sm font-semibold text-gray-800">
                  {data.pacijent.ime} {data.pacijent.prezime}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  God. roj.: {data.pacijent.godinaRodjenja || "—"} ·{" "}
                  {data.pacijent.spol}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {data.pacijent.email}
                </div>
              </div>
            </div>

            {/* Klinički nalaz */}
            <div>
              <label
                className="text-gray-500 font-semibold block uppercase mb-1.5"
                style={{ fontSize: "9px", letterSpacing: "0.6px" }}
              >
                Klinički nalaz i razlog upućivanja
              </label>
              <textarea
                value={editableData.pregled.kliniNalaz}
                onChange={(e) => updatePregled("kliniNalaz", e.target.value)}
                rows={4}
                placeholder="Unesite klinički nalaz i razlog upućivanja..."
                className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 transition-all"
              />
            </div>

            {/* Dijagnoza */}
            <div>
              <label
                className="text-gray-500 font-semibold block uppercase mb-1.5"
                style={{ fontSize: "9px", letterSpacing: "0.6px" }}
              >
                Dijagnoza
              </label>
              <input
                value={editableData.pregled.dijagnoza}
                onChange={(e) => updatePregled("dijagnoza", e.target.value)}
                placeholder="Npr. Hipertenzija, J06, Diabetes mellitus..."
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 transition-all"
              />
            </div>

            {/* Specijalnost / Odjeljenje */}
            <div>
              <label
                className="text-gray-500 font-semibold block uppercase mb-1.5"
                style={{ fontSize: "9px", letterSpacing: "0.6px" }}
              >
                Specijalnost / Odjeljenje
              </label>
              <input
                value={editableData.pregled.uputnoOdjeljenje}
                onChange={(e) =>
                  updatePregled("uputnoOdjeljenje", e.target.value)
                }
                placeholder="Npr. Kardiologija, Ortopedija..."
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 transition-all"
              />
            </div>

            {/* Ustanova */}
            <div>
              <label
                className="text-gray-500 font-semibold block uppercase mb-1.5"
                style={{ fontSize: "9px", letterSpacing: "0.6px" }}
              >
                Ustanova
              </label>
              <input
                value={editableData.pregled.uputnaUstanova}
                onChange={(e) =>
                  updatePregled("uputnaUstanova", e.target.value)
                }
                placeholder="Npr. Klinički centar Sarajevo..."
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 transition-all"
              />
            </div>

            {/* Hitnost */}
            <div>
              <label
                className="text-gray-500 font-semibold block uppercase mb-2"
                style={{ fontSize: "9px", letterSpacing: "0.6px" }}
              >
                Hitnost
              </label>
              <div className="flex gap-2">
                {(["Redovna", "Hitna"] as const).map((h) => (
                  <button
                    key={h}
                    onClick={() => updatePregled("hitnost", h)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                      editableData.pregled.hitnost === h
                        ? h === "Hitna"
                          ? "bg-red-500 text-white border-red-500 shadow-sm"
                          : "bg-blue-500 text-white border-blue-500 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Napomena */}
            <div>
              <label
                className="text-gray-500 font-semibold block uppercase mb-1.5"
                style={{ fontSize: "9px", letterSpacing: "0.6px" }}
              >
                Napomena{" "}
                <span className="font-normal normal-case text-gray-400">
                  (opcionalno)
                </span>
              </label>
              <textarea
                value={editableData.pregled.napomena}
                onChange={(e) => updatePregled("napomena", e.target.value)}
                rows={2}
                placeholder="Dodatne napomene za specijalista..."
                className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-gray-50 transition-all"
              />
            </div>
          </div>

          {/* Desno: živi pregled dokumenta */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
            <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex-shrink-0">
              <p className="text-xs font-semibold text-gray-500">
                Pregled dokumenta
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-5 flex justify-center">
              <div
                style={{
                  width: `${Math.round(TEMPLATE_W * SCALE)}px`,
                  height: `${Math.round(TEMPLATE_H * SCALE)}px`,
                  overflow: "hidden",
                  flexShrink: 0,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
                  borderRadius: "2px",
                }}
              >
                <div
                  style={{
                    transform: `scale(${SCALE})`,
                    transformOrigin: "top left",
                    width: `${TEMPLATE_W}px`,
                  }}
                >
                  <UputnicaTemplate data={editableData} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
          <div>
            {greska ? (
              <p className="text-xs text-red-600 font-medium">{greska}</p>
            ) : (
              <p className="text-xs text-gray-400">
                PDF se preuzima u A4 formatu · pogledajte pregled desno
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-white transition-colors"
            >
              Zatvori
            </button>
            <button
              onClick={handleGenerisi}
              disabled={generisanje}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                generisanje
                  ? "bg-blue-400 text-white cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              }`}
            >
              {generisanje ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Generisanje...
                </>
              ) : (
                <>
                  <FileText size={14} /> Generiši i preuzmi PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
