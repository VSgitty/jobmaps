'use client';

import { JobMap } from '@/maps/job-map';
import { Header } from '@/components/layout/header';
import { Search, MapPin, Clock, Target, Eye, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isGoLocating, setIsGoLocating] = useState(false);

  const handleSearch = (queryStr?: string) => {
    const q = queryStr !== undefined ? queryStr : searchQuery;
    if (q.trim()) {
      router.push(`/map?q=${encodeURIComponent(q.trim())}`);
    } else {
      router.push('/map');
    }
  };

  const handleGoLocate = () => {
    setIsGoLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          router.push(`/map?lat=${latitude}&lon=${longitude}&located=true`);
        },
        (error) => {
          console.warn("Geolocation error on homepage:", error);
          setIsGoLocating(false);
          router.push('/map?locate=true');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsGoLocating(false);
      router.push('/map?locate=true');
    }
  };

  return (
    <main className="flex h-screen w-full bg-background overflow-hidden relative font-sans">
      <Header />
      
      {/* Background Map & Gradient */}
      <div className="absolute inset-0 z-0">
        <JobMap interactive={false} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05070A] via-[#05070A]/90 to-transparent pointer-events-none" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col justify-center h-full w-full max-w-[1400px] mx-auto px-8 lg:w-1/2">
        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] mb-6">
          Finde Arbeit, die<br />zu deinem Leben passt.
        </h1>
        <p className="text-lg lg:text-xl text-white/70 mb-10 max-w-xl leading-relaxed">
          Entdecke Arbeitgeber in deiner Umgebung, vergleiche Pendelzeiten und finde den Job, der wirklich zu deinem Alltag passt.
        </p>

        {/* Search Box & GO Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 max-w-2xl w-full mb-6">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            className="bg-white rounded-full p-2 flex items-center shadow-xl flex-1 w-full"
          >
            <div className="flex-1 flex items-center px-4">
              <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
              <input 
                type="text" 
                placeholder="Ort, Beruf oder Firma (z.B. Köln, Pflege...)" 
                className="w-full bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-500 font-medium text-sm sm:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3 h-auto text-sm sm:text-base font-semibold shrink-0"
            >
              Suchen
            </Button>
          </form>

          {/* GO Instant Doorstep Button */}
          <Button 
            type="button"
            onClick={handleGoLocate}
            disabled={isGoLocating}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full px-5 py-3.5 h-auto text-sm font-extrabold flex items-center gap-2 shadow-2xl shrink-0 transition-transform active:scale-95 cursor-pointer ring-2 ring-emerald-400/30"
            title="Sofort Standort bestimmen und Jobs direkt vor deiner Haustür anzeigen"
          >
            {isGoLocating ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="bg-white text-emerald-700 rounded-full w-6 h-6 flex items-center justify-center font-black text-xs shadow-sm">GO</span>
                <Navigation className="w-4 h-4 text-white fill-white" />
                <span className="whitespace-nowrap">Vor der Haustür</span>
              </>
            )}
          </Button>
        </div>

        {/* Popular Tags */}
        <div className="flex items-center gap-3 text-sm text-white/60 mb-16">
          <span>Beliebt:</span>
          <div className="flex gap-2">
            {['Pflege', 'Ingenieur', 'Vertrieb', 'IT', 'Mechatroniker'].map((tag) => (
              <span 
                key={tag} 
                onClick={() => handleSearch(tag)}
                className="px-3 py-1 rounded-full border border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Features & Trusted By */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-[1400px] mx-auto">
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10 border-b border-white/10">
            <FeatureCard 
              icon={<MapPin className="w-5 h-5" />}
              title="Jobs in deiner Nähe"
              description="Sieh auf einen Blick, welche Arbeitgeber in deiner Umgebung aktuell suchen."
            />
            <FeatureCard 
              icon={<Clock className="w-5 h-5" />}
              title="Pendelzeiten vergleichen"
              description="Vergleiche Anfahrtswege mit Auto, ÖPNV und spare Zeit im Alltag."
            />
            <FeatureCard 
              icon={<Target className="w-5 h-5" />}
              title="Arbeit, die zu dir passt"
              description="Finde Jobs, die zu deinem Lebensmodell, deinen Zielen und deiner Zeit passen."
            />
            <FeatureCard 
              icon={<Eye className="w-5 h-5" />}
              title="Transparente Einblicke"
              description="Echte Bewertungen, Gehälter und tiefe Einblicke zu Arbeitgebern."
            />
          </div>

          {/* Trusted By */}
          <div className="py-6 px-8 flex flex-col items-center justify-center">
            <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-6">
              Vertraut von tausenden Unternehmen und Millionen Jobsuchenden
            </p>
            <div className="flex items-center gap-12 opacity-50 grayscale contrast-100">
              {/* Dummy logos as text for now, can be replaced with SVGs */}
              <span className="text-xl font-bold font-sans">SIEMENS</span>
              <span className="text-xl font-bold font-serif italic">BOSCH</span>
              <span className="text-xl font-bold border-2 border-current px-2">DB</span>
              <span className="text-xl font-bold tracking-widest">Allianz</span>
              <span className="text-xl font-bold text-blue-500 lowercase">Lidl</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 lg:p-8 flex gap-4 hover:bg-white/5 transition-colors cursor-default">
      <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="text-white font-semibold mb-2">{title}</h3>
        <p className="text-sm text-white/60 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

