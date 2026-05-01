import { Activity, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">SwiftMed</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500 max-w-xs">
              Moderna platforma za zakazivanje medicinskih pregleda. Brzo, sigurno i dostupno 24/7.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Platforma</h4>
            <ul className="space-y-2.5 text-sm">
              {['Kako funkcionira', 'Doktori', 'Odjeli', 'Rezervacije', 'Kontakt'].map((l) => (
                <li key={l}>
                  <a href="#" className="hover:text-white transition-colors duration-200">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Podrška</h4>
            <ul className="space-y-2.5 text-sm">
              {['Česta pitanja', 'Privatnost podataka', 'Uvjeti korištenja', 'Pristupačnost'].map((l) => (
                <li key={l}>
                  <a href="#" className="hover:text-white transition-colors duration-200">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Kontakt</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                +387 33 123 456
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                info@swiftmed.ba
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                Titova 12, 71000 Sarajevo
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-600">
            &copy; 2026 SwiftMed. Sva prava zadržana.
          </p>
          <p className="text-xs text-gray-600">
            Napravljeno s pažnjom za vaše zdravlje
          </p>
        </div>
      </div>
    </footer>
  );
}
