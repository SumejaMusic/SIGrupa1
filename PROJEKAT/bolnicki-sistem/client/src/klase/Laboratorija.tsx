import React, { useState } from "react";
import { Link } from "react-router-dom";
import {Upload, FileCheck, ArrowLeft } from "lucide-react";

const Laboratorija: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadSuccess, setIsUploadSuccess] = useState(false);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf") {
      alert("Dozvoljeni su samo PDF fajlovi.");
      return;
    }
    setIsUploadSuccess(true);
    setTimeout(() => setIsUploadSuccess(false), 3000);
  };

  return (
    <div className="lab-page">
      <div className="lab-container">

        <div className="navLinks">
          <Link to="/staff-panel" className="backLink">
            <ArrowLeft size={18} /> Nazad na panel
          </Link>
          <Link to="/" className="backLink">
            <ArrowLeft size={18} /> Nazad na početnu stranicu
          </Link>
        </div>

        <div className="lab-card">
          <h1 className="lab-title">Dodavanje laboratorijskog nalaza</h1>

          <form onSubmit={handleUpload} className="lab-form">
            <div className="lab-search-section">
              <label className="lab-label">
                Pretraži pacijenta (JMBG):
              </label>
              <div className="lab-input-wrapper">
                <input
                  type="text"
                  placeholder="Unesite podatke pacijenta..."
                  className="lab-input"
                />
              </div>
            </div>

            {/* UPLOAD */}
            <div className="lab-upload-box">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="lab-file-input"
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload" className="lab-upload-label">
                <Upload className="lab-upload-icon" size={40} />
                <p className="lab-upload-text">
                  {selectedFile ? selectedFile.name : "Kliknite za odabir PDF nalaza"}
                </p>
                <p className="lab-upload-hint">Maksimalna veličina: 5MB</p>
              </label>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              className={`lab-submit-button ${isUploadSuccess ? "success" : ""}`}
            >
              {isUploadSuccess ? "Nalaz uspješno dodan!" : "Potvrdi i pošalji"}
            </button>

            {/* SUCCESS */}
            {isUploadSuccess && (
              <div className="lab-success-message">
                <FileCheck size={20} />
                <span>Nalaz je sigurno pohranjen u sistem</span>
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
};

export default Laboratorija;