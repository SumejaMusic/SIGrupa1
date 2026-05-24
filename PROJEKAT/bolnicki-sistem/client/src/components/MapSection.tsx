import React from 'react';
import { MapPin } from 'lucide-react';

export default function MapSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Pronađite nas</h2>
          <p className="text-lg text-gray-600 flex items-center justify-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Titova 12, 71000 Sarajevo
          </p>
        </div>
        
        <div className="bg-white p-2 rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="relative w-full h-[400px] rounded-xl overflow-hidden">
            <iframe 
              title="Lokacija bolnice"
              width="100%" 
              height="100%" 
              frameBorder="0" 
              scrolling="no" 
              marginHeight={0} 
              marginWidth={0} 
              src="https://www.openstreetmap.org/export/embed.html?bbox=18.4051%2C43.8524%2C18.4211%2C43.8624&amp;layer=mapnik&amp;marker=43.8574%2C18.4131" 
              className="absolute top-0 left-0 w-full h-full"
            ></iframe>
          </div>
          <div className="mt-4 text-center">
            <a 
              href="https://www.openstreetmap.org/?mlat=43.8574&mlon=18.4131#map=16/43.8574/18.4131" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              Prikaži veću mapu
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
