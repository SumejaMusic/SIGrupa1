import { CalendarCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from "react-router-dom";
export default function CtaBanner() {
  const navigate = useNavigate();
  return (
    <section className="py-20 bg-gradient-to-r from-blue-800 via-blue-700 to-sky-600 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/5 border border-white/10" />
      <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-white/5 border border-white/10" />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-4xl font-bold text-white mb-4">
          Zakažite pregled danas
        </h2>
        <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
          Vaše zdravlje ne smije čekati. Odaberite doktora, termin i budite sigurni da ste na pravom putu.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
  onClick={() => navigate("/step1-odjeli")}
  className="cta-button inline-flex items-center justify-center gap-2.5 bg-white text-blue-800 font-bold px-8 py-3.5 rounded-xl shadow-lg hover:bg-blue-50"
>
  <CalendarCheck className="w-5 h-5" />
  Zakažite odmah
  <ArrowRight className="w-4 h-4" />
</button>
          <button
  onClick={() => document.getElementById("prednosti")?.scrollIntoView({ behavior: "smooth" })}
  className="cta-button inline-flex items-center justify-center gap-2.5 border-2 border-white/40 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all duration-200"
>
  Saznajte više
</button>
        </div>
      </div>
    </section>
  );
}
