'use client';

import { Header } from '@/components/layout/header';
import { JobMap } from '@/maps/job-map';
import { MapPin, Navigation, Clock, Building2, Search, Compass, Car, Train, Bike, Briefcase, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [isGoLocating, setIsGoLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobQuery, setJobQuery] = useState('');
  const [maxCommute, setMaxCommute] = useState(30);
  const [transportMode, setTransportMode] = useState<'driving' | 'transit' | 'cycling' | 'walking'>('driving');
  const [suggestions, setSuggestions] = useState<Record<string, unknown>[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Fetch suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?country=DE,AT,CH&types=place,address,postcode&access_token=${token}`);
        const data = await res.json();
        setSuggestions(data.features || []);
      } catch (e) {
        console.error("Error fetching suggestions", e);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelectSuggestion = (feat: Record<string, unknown>) => {
    const [longitude, latitude] = feat.center as [number, number];
    const address = feat.place_name as string;
    setSearchQuery(address.split(',')[0]);
    setSelectedCoords({ lat: latitude, lon: longitude });
    setShowDropdown(false);
  };

  const handleGoLocate = () => {
    setIsGoLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
            const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}`);
            const data = await res.json();
            const address = data.features?.[0]?.place_name?.split(',')[0] || "Mein Standort";
            setSearchQuery(address);
            setSelectedCoords({ lat: latitude, lon: longitude });
          } catch {
            setSelectedCoords({ lat: latitude, lon: longitude });
            setSearchQuery("Mein Standort");
          }
          setIsGoLocating(false);
        },
        (error) => {
          console.warn("Geolocation error on homepage:", error);
          setIsGoLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsGoLocating(false);
    }
  };

  const handleLaunchPersonalMarket = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCoords) {
      params.set('lat', selectedCoords.lat.toString());
      params.set('lon', selectedCoords.lon.toString());
    }
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }
    if (jobQuery.trim()) {
      params.set('query', jobQuery.trim());
    }
    params.set('commute', maxCommute.toString());
    params.set('mode', transportMode);

    router.push(`/map?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-slate-950 font-sans selection:bg-blue-500/30 text-slate-100 overflow-x-hidden">
      <Header />
      
      {/* 1. HERO SECTION WITH VISIBLE LIVE MAP & LIFE-FIRST FLOW */}
      <section className="relative min-h-[92vh] flex items-center pt-24 pb-16 overflow-hidden">
        {/* Live Background Map */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 scale-105 opacity-85 sm:opacity-90 brightness-[0.95] contrast-[1.08] saturate-[1.15]">
            <JobMap 
              interactive={false} 
              userLocation={{ latitude: 50.1109, longitude: 8.6821, address: 'Frankfurt am Main' }}
              showDemoShowcase={true}
              radiusKm={15}
            />
          </div>
          <div className="absolute inset-0 map-flow-overlay pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-48 map-bottom-fade pointer-events-none" />
        </div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 sm:px-10 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          {/* Left Hero Content */}
          <div className="flex-1 flex flex-col items-start text-left max-w-2xl">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/70 border border-blue-500/30 text-xs font-semibold text-blue-300 mb-6 backdrop-blur-xl shadow-lg shadow-blue-950/50">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span>• Life-First Jobsuche</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.12] mb-6">
              Finde Arbeit, die <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
                exakt in dein Leben passt.
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-slate-300 mb-8 leading-relaxed font-medium">
              Finde nicht nur Jobs, sondern Arbeitsplätze und Arbeitgeber, die perfekt zu deinem Standort, deiner maximalen Pendelzeit und deinem Leben passen.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-8">
              <Link href="/map">
                <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-2xl px-8 py-6 text-base font-extrabold shadow-2xl shadow-blue-600/40 transition-transform active:scale-95 flex items-center gap-2.5 cursor-pointer border border-blue-400/30">
                  <span>Persönlichen Arbeitsmarkt anzeigen</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
              <span className="text-slate-400 font-bold">Top-Regionen:</span>
              {['Frankfurt', 'München', 'Darmstadt', 'Offenbach', 'Babenhausen'].map((term) => (
                <button
                  key={term}
                  onClick={() => router.push(`/map?q=${encodeURIComponent(term)}`)}
                  className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-slate-200 hover:text-white hover:border-blue-500/40 hover:bg-blue-950/60 transition-all text-xs cursor-pointer backdrop-blur-md"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. LOGO CLOUD (Top Arbeitgeber) */}
      <section className="py-10 border-y border-slate-800/80 bg-slate-900/40 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
            Top-Arbeitgeber auf deiner Karte
          </p>
          <div className="flex flex-wrap justify-center md:justify-end items-center gap-x-10 gap-y-6 text-slate-400 font-bold text-lg">
            <span className="hover:text-white transition-colors tracking-tight">SIEMENS</span>
            <span className="hover:text-white transition-colors italic font-serif">BOSCH</span>
            <span className="hover:text-white transition-colors tracking-widest">Allianz</span>
            <span className="bg-slate-800 text-white px-2.5 py-0.5 rounded text-base font-extrabold">Lidl</span>
            <span className="hover:text-white transition-colors tracking-tighter text-red-400">REWE</span>
            <span className="hover:text-white transition-colors tracking-tight">Deutsche Bahn</span>
          </div>
        </div>
      </section>

      {/* 3. WHY JOBMAPS (Features) */}
      <section className="py-24 relative">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Die Jobsuche, <span className="text-blue-400">neu gedacht.</span>
            </h2>
            <p className="text-base text-slate-400 leading-relaxed">
              Schluss mit unübersichtlichen Listen und falschen Entfernungen. Wir organisieren den Arbeitsmarkt um dein rechtes Leben herum.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<MapPin className="w-6 h-6 text-blue-400" />}
              title="Die Karte ist das Interface"
              description="Sieh sofort auf der interaktiven Karte, welche Unternehmen in deiner Nähe stellen besetzen. Keine ungenauen Entfernungsangaben mehr."
            />
            <FeatureCard 
              icon={<Clock className="w-6 h-6 text-sky-400" />}
              title="Echte Reale Pendelzeit"
              description="Egal ob Auto, Fahrrad oder Bus & Bahn: Wir berechnen die echte Fahrtzeit ab deiner Haustür für ein stressfreies Leben."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6 text-indigo-400" />}
              title="Arbeitgeber & Jobs"
              description="Entdecke nicht nur einzelne Stellen, sondern ganze Unternehmen und Standorte mit allen offenen Positionen auf einen Blick."
            />
          </div>
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-900/80 pt-16 pb-10">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-white font-extrabold text-lg tracking-tight">JobMaps</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dein persönlicher Arbeitsmarkt. Die Life-First Recruiting-Plattform für transparente Jobsuche und echte Nähe.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Für Jobsuchende</h4>
              <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
                <li><Link href="/map" className="hover:text-blue-400 transition-colors">Interaktive Karte</Link></li>
                <li><Link href="/map?type=Vollzeit" className="hover:text-blue-400 transition-colors">Vollzeit Jobs</Link></li>
                <li><Link href="/map?type=Teilzeit" className="hover:text-blue-400 transition-colors">Teilzeit & Minijobs</Link></li>
                <li><Link href="/map?type=Homeoffice" className="hover:text-blue-400 transition-colors">Remote & Homeoffice</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Für Arbeitgeber</h4>
              <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
                <li><Link href="/arbeitgeber" className="hover:text-blue-400 transition-colors">Stellen schalten</Link></li>
                <li><Link href="/preise" className="hover:text-blue-400 transition-colors">Preise & Pakete</Link></li>
                <li><Link href="/dashboard" className="hover:text-blue-400 transition-colors">Arbeitgeber Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Rechtliches</h4>
              <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Impressum</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">Datenschutz</Link></li>
                <li><Link href="#" className="hover:text-blue-400 transition-colors">AGB</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
            <p>© 2026 NearJobs / JobMaps. Alle Rechte vorbehalten.</p>
            <p>Dein persönlicher Arbeitsmarkt</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

// Subcomponents
function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-card glass-card-hover p-8 rounded-3xl cursor-default flex flex-col items-start text-left">
      <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 shadow-inner">
        {icon}
      </div>
      <h3 className="text-lg font-extrabold text-white mb-3">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}


