import { useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type { UputnicaData } from "../utils/uputnicaMapper";

export const useUputnicaPDF = () => {
  const templateRef = useRef<HTMLDivElement>(null);

  const generisiPDF = async (data: UputnicaData): Promise<Blob> => {
    const element = templateRef.current;
    if (!element) throw new Error("Template ref nije postavljen");

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const safeDate = data.datum.replace(/\./g, "-");
    const fileName = `Uputnica_${data.pacijent.prezime}_${safeDate}.pdf`;
    pdf.save(fileName);

    return pdf.output("blob");
  };

  return { templateRef, generisiPDF };
};
