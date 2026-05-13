import { useState } from 'react';
import { Building2, UserCheck, Stethoscope, Calendar, CheckCircle2, Upload, MessageSquare, Clock, Check, FileText } from 'lucide-react';
import { useNavigate } from "react-router-dom";


const steps = [
  {
    icon: Building2,
    number: '01',
    title: 'Odaberite odjel',
    description: 'Pregledajte dostupne odjele bolnice i odaberite specijalizaciju koja odgovara Vašim potrebama.',
    color: 'from-blue-50 to-blue-100',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700',
    details: [
      { icon: FileText, text: 'Sve specijalizacije dostupne' },
      { icon: Clock, text: 'Vidi raspoloživost po odjelu' },
    ],
  },
  {
    icon: UserCheck,
    number: '02',
    title: 'Izaberite doktora',
    description: 'Pregledajte listu doktora sa fotografijama, imenima i specijalizacijama. Odaberite onoga u koga imate povjerenje.',
    color: 'from-teal-50 to-teal-100',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-700',
    details: [
      { icon: FileText, text: 'Biografija i iskustvo' },
      { icon: CheckCircle2, text: 'Recenzije i ocjene' },
    ],
  },
  {
    icon: Stethoscope,
    number: '03',
    title: 'Tip pregleda',
    description: 'Odaberite vrstu pregleda: preventivni pregled, hitni slučaj ili kontrolni pregled.',
    color: 'from-sky-50 to-sky-100',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-700',
    details: [
      { icon: CheckCircle2, text: 'Preventivni pregled' },
      { icon: Clock, text: 'Hitni ili kontrolni' },
    ],
  },
  {
    icon: Calendar,
    number: '04',
    title: 'Odaberite termin',
    description: 'Na interaktivnom kalendaru vidite slobodne termine. Priložite nalaze i dodajte komentar za doktora.',
    color: 'from-indigo-50 to-indigo-100',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-700',
    details: [
      { icon: Upload, text: 'Učitaj relevantne nalaze' },
      { icon: MessageSquare, text: 'Dodaj komentar za doktora' },
    ],
  },
  {
    icon: CheckCircle2,
    number: '05',
    title: 'Potvrda rezervacije',
    description: 'Kliknite "Rezerviši" i termin se automatski sprema u Vaše rezervacije. Primite potvrdu odmah.',
    color: 'from-green-50 to-green-100',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-700',
    details: [
      { icon: Check, text: 'Potvrda poslana email-om' },
      { icon: Calendar, text: 'Dodano u Vaše rezervacije' },
    ],
  },
];

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
const navigate = useNavigate();
  const CurrentIcon = steps[activeStep].icon;
  const currentDetails = steps[activeStep].details;

  return (
    <section className="py-24 bg-gray-50" id="kako-radi">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-blue-700 text-sm font-semibold tracking-widest uppercase mb-3">
            Kako funkcionira
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Rezervacija u 5 jednostavnih koraka
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Jednostavan proces koji vodi od odabira odjela do potvrde termina.
          </p>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Steps list */}
          <div className="lg:col-span-1 space-y-3">
            {steps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 transform ${
                  activeStep === idx
                    ? 'bg-white border-blue-500 shadow-lg'
                    : 'bg-white/50 border-transparent hover:bg-white hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${step.iconBg} flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                      activeStep === idx ? 'scale-110' : ''
                    }`}
                  >
                    <step.icon className={`w-5 h-5 ${step.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${
                      activeStep === idx ? 'text-blue-700' : 'text-gray-400'
                    }`}>
                      Korak {step.number}
                    </span>
                    <h3 className={`font-semibold text-sm ${
                      activeStep === idx ? 'text-gray-900' : 'text-gray-600'
                    }`}>
                      {step.title}
                    </h3>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2">
            <div key={activeStep} className="animate-fade-in">
              <div className={`bg-gradient-to-br ${steps[activeStep].color} rounded-3xl p-8 md:p-12 min-h-80 flex flex-col justify-between`}>
                {/* Top section */}
                <div>
                  <div className={`w-16 h-16 rounded-2xl ${steps[activeStep].iconBg} flex items-center justify-center mb-6 transform transition-transform duration-500 scale-100`}>
                    <CurrentIcon className={`w-8 h-8 ${steps[activeStep].iconColor}`} />
                  </div>

                  <h3 className="text-3xl font-bold text-gray-900 mb-3">
                    {steps[activeStep].title}
                  </h3>

                  <p className="text-gray-700 text-base leading-relaxed mb-8">
                    {steps[activeStep].description}
                  </p>
                </div>

                {/* Details list */}
                <div className="space-y-3">
                  {currentDetails.map((detail, idx) => {
                    const DetailIcon = detail.icon;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 animate-slide-in-left"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0">
                          <DetailIcon className="w-4 h-4 text-gray-700" />
                        </div>
                        <span className="text-gray-700 font-medium text-sm">{detail.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress indicators */}
        <div className="mt-12 flex justify-center gap-2">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeStep === idx
                  ? 'bg-blue-700 w-8'
                  : 'bg-gray-300 w-2 hover:bg-gray-400'
              }`}
              aria-label={`Go to step ${idx + 1}`}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 text-center">
        <button 
  onClick={() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Ako je prijavljen, ide na odjele
      navigate("/step1-odjeli");
    } else {
      // Ako nije prijavljen, ide na login
      navigate("/prijava");
    }
  }}
  className="cta-button inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-8 py-3.5 rounded-xl shadow-md"
>
  <Calendar className="w-5 h-5" />
  Počni sa rezervacijom
</button>
        </div>
      </div>
    </section>
  );
}
