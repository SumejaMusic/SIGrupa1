import { Clock, CalendarDays, LayoutGrid, TrendingUp, ShieldCheck, Users } from 'lucide-react';

const benefits = [
  {
    icon: Clock,
    title: 'Ušteda vremena',
    description: 'Doktori i pacijenti više ne gube sate na telefonske rezervacije. Sve je dostupno 24/7 online.',
    forWhom: 'Za pacijente i doktore',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
  },
  {
    icon: CalendarDays,
    title: 'Lakše zakazivanje',
    description: 'Intuitivan kalendar slobodnih termina eliminira dvostruke rezervacije i preklapanja.',
    forWhom: 'Za pacijente',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
  },
  {
    icon: LayoutGrid,
    title: 'Organizacija medicinskog osoblja',
    description: 'Medicinsko osoblje ima jasan pregled rasporeda, pacijenata i sala u realnom vremenu.',
    forWhom: 'Za medicinsko osoblje',
    color: 'text-sky-700',
    bg: 'bg-sky-50',
  },
  {
    icon: TrendingUp,
    title: 'Uvid u zauzetost',
    description: 'Bolnica dobiva analitiku zauzetosti sala, doktora i odjela za bolje planiranje resursa.',
    forWhom: 'Za upravu',
    color: 'text-blue-800',
    bg: 'bg-blue-50',
  },
  {
    icon: ShieldCheck,
    title: 'Sigurnost podataka',
    description: 'Svi medicinski podaci i nalazi su zaštićeni i dostupni samo ovlaštenim osobama.',
    forWhom: 'Za sve korisnike',
    color: 'text-green-700',
    bg: 'bg-green-50',
  },
  {
    icon: Users,
    title: 'Bolji odnos doktor-pacijent',
    description: 'Doktori unaprijed vide nalaze i komentare pacijenta, pa je pregled fokusiraniji i kvalitetniji.',
    forWhom: 'Za doktore i pacijente',
    color: 'text-cyan-700',
    bg: 'bg-cyan-50',
  },
];

export default function BenefitsSection() {
  return (
    <section className="py-24 bg-white" id="prednosti">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block text-blue-700 text-sm font-semibold tracking-widest uppercase mb-3">
            Zašto SwiftMed
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Prednosti koje mijenjaju sistem
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Digitalizacija zakazivanja donosi konkretne prednosti svim učesnicima zdravstvenog sistema.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="benefit-card border border-gray-100 rounded-2xl p-7 shadow-sm cursor-default"
              >
                <div className={`w-12 h-12 rounded-xl ${b.bg} flex items-center justify-center mb-5`}>
                  <Icon className={`w-5 h-5 ${b.color}`} />
                </div>
                <span className={`text-xs font-semibold ${b.color} uppercase tracking-wide`}>{b.forWhom}</span>
                <h3 className="text-lg font-semibold text-gray-900 mt-1 mb-2">{b.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{b.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
