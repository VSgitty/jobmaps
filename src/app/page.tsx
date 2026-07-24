'use client';

import { Header } from '@/components/layout/header';
import { JobMap } from '@/maps/job-map';
import { MapPin, Navigation, Clock, Target, TrendingUp, Building2, Users, Search, Car, Bike, Bus, Sparkles, ArrowRight, ShieldCheck, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [isGoLocating, setIsGoLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Record<string, unknown>[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Animated counters state
  const [counts, setCounts] = useState({ jobs: 0, companies: 0, applicants: 0 });

  useEffect(() => {
    // Counter animation on mount
    const interval = setInterval(() => {
      setCounts(prev => ({
        jobs: prev.jobs < 124500 ? prev.jobs + 2500 : 124500,
        companies: prev.companies < 8500 ? prev.companies + 150 : 8500,
        applicants: prev.applicants < 450000 ? prev.applicants + 8500 : 450000,
      }));
    }, 20);
    return () => clearInterval(interval);
  }, []);

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
    router.push(`/map?lat=${latitude}&lon=${longitude}&q=${encodeURIComponent(address)}`);
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/map?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleQuickSearch = (term: string) => {
    router.push(`/map?q=${encodeURIComponent(term)}`);
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
    <main className="min-h-screen bg-slate-950 font-sans selection:bg-blue-500/30 text-slate-100 overflow-x-hidden">
      <Header />
      
      {/* 1. HERO SECTION WITH VISIBLE LIVE MAP & FLOW OVERLAY */}
      <section className="relative min-h-[92vh] flex items-center pt-24 pb-16 overflow-hidden">
        {/* Live Interactive Background Map */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 scale-105 opacity-80 sm:opacity-85 brightness-[0.92] contrast-[1.08] saturate-[1.15]">
            <JobMap 
              interactive={false} 
              userLocation={{ latitude: 50.1109, longitude: 8.6821, address: 'Frankfurt am Main' }}
              selectedJob={{
                id: 'demo-1',
                latitude: 50.12,
                longitude: 8.67,
                title: 'Senior Software Engineer',
                company_name: 'Tech Corp Deutschland',
                location_name: 'Frankfurt am Main'
              }}
              routeMode="driving"
              radiusKm={15}
            />
          </div>
          {/* Flow transition overlay (Radial Vignette + Smooth Bottom Fade) */}
          <div className="absolute inset-0 map-flow-overlay pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-48 map-bottom-fade pointer-events-none" />
        </div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 sm:px-10 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          {/* Left Hero Content */}
          <div className="flex-1 flex flex-col items-start text-left max-w-2xl">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/70 border border-blue-500/30 text-xs font-semibold text-blue-300 mb-6 backdrop-blur-xl shadow-lg shadow-blue-950/50">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span>• Deutschlands 1. interaktive Job-Karte</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12] mb-6">
              Finde Arbeit, die <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
                exakt in dein Leben passt.
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-slate-300 mb-8 leading-relaxed font-normal backdrop-blur-md bg-slate-950/40 p-4 rounded-2xl border border-white/5">
              Entdecke Top-Arbeitgeber direkt in deiner Umgebung, vergleiche echte Pendelzeiten mit Auto, Fahrrad oder ÖPNV und starte mit nur einem Klick.
            </p>

            {/* Glass Search Bar */}
            <div className="w-full mb-6 relative">
              <form onSubmit={handleSearch} className="w-full bg-slate-900/80 backdrop-blur-2xl border border-slate-700/60 rounded-2xl p-2 flex flex-col sm:flex-row items-center gap-2 shadow-2xl shadow-black/60 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 transition-all">
                <div className="flex-1 flex items-center px-3.5 w-full relative">
                  <Search className="w-5 h-5 text-blue-400 mr-3 shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Job, Stadt, Firma oder Branche..." 
                    className="w-full bg-transparent border-none outline-none text-white placeholder:text-slate-400 font-medium text-sm sm:text-base py-2"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  />
                </div>
                <Button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-7 py-5 text-sm font-bold shadow-lg shadow-blue-600/30 transition-transform active:scale-95 shrink-0">
                  Jobs finden
                </Button>
              </form>

              {/* Autocomplete Dropdown */}
              {showDropdown && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-2 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">Vorschläge</div>
                    {suggestions.map((feat: any) => (
                      <button
                        key={feat.id}
                        type="button"
                        className="w-full text-left px-3 py-2.5 text-xs sm:text-sm text-slate-200 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-3 group"
                        onClick={() => handleSelectSuggestion(feat)}
                      >
                        <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="truncate">{feat.place_name as string}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Filter Chips & GPS Button */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
              <Button 
                onClick={handleGoLocate}
                disabled={isGoLocating}
                className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 rounded-full px-4 py-1.5 h-auto text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 mr-1"
              >
                {isGoLocating ? (
                  <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Navigation className="w-3.5 h-3.5 text-blue-400" />
                    Jobs in meiner Nähe
                  </>
                )}
              </Button>

              <span className="text-slate-500 hidden sm:inline">| Beliebt:</span>
              {['Frankfurt', 'München', 'Software', 'Pflege', 'Remote'].map((term) => (
                <button
                  key={term}
                  onClick={() => handleQuickSearch(term)}
                  className="px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white hover:border-blue-500/40 hover:bg-blue-950/40 transition-all text-xs"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Live Interactive Card Preview */}
          <div className="flex-1 w-full max-w-lg relative hidden lg:block">
            <div className="glass-card rounded-3xl p-6 shadow-2xl border border-slate-800/80 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug">Live Routing & Pendelzeiten</h3>
                    <p className="text-xs text-slate-400">Exakte Wege ab deiner Haustür</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  Echtzeit
                </span>
              </div>

              {/* Sample Job Card */}
              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 mb-4 hover:border-blue-500/40 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-0.5">Software & IT</div>
                    <div className="text-base font-extrabold text-white">Senior Fullstack Developer</div>
                    <div className="text-xs text-slate-400">Tech Corp Deutschland • Frankfurt am Main</div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
                    Vollzeit
                  </span>
                </div>

                {/* Pendelzeiten Grid */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-center">
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                    <Car className="w-3.5 h-3.5 text-blue-400 mx-auto mb-1" />
                    <div className="text-xs font-bold text-white">12 Min</div>
                    <div className="text-[10px] text-slate-400">Auto</div>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                    <Bus className="w-3.5 h-3.5 text-sky-400 mx-auto mb-1" />
                    <div className="text-xs font-bold text-white">18 Min</div>
                    <div className="text-[10px] text-slate-400">ÖPNV</div>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                    <Bike className="w-3.5 h-3.5 text-indigo-400 mx-auto mb-1" />
                    <div className="text-xs font-bold text-white">24 Min</div>
                    <div className="text-[10px] text-slate-400">Fahrrad</div>
                  </div>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 text-center">
                  <div className="text-lg font-black text-white">{counts.jobs.toLocaleString('de-DE')}</div>
                  <div className="text-[10px] text-slate-400 font-medium">Offene Jobs</div>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 text-center">
                  <div className="text-lg font-black text-white">{counts.companies.toLocaleString('de-DE')}</div>
                  <div className="text-[10px] text-slate-400 font-medium">Unternehmen</div>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 text-center">
                  <div className="text-lg font-black text-blue-400">+4.200</div>
                  <div className="text-[10px] text-slate-400 font-medium">Neu heute</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LOGO CLOUD (Top Arbeitgeber) */}
      <section className="py-10 border-y border-slate-800/80 bg-slate-900/40 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
            Top-Arbeitgeber auf der Karte
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
              Schluss mit unübersichtlichen Listen und falschen Entfernungen. Wir zeigen dir Stellenangebote exakt dort, wo sie wirklich sind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<MapPin className="w-6 h-6 text-blue-400" />}
              title="Kartenbasierte Übersicht"
              description="Sieh sofort auf der Karte, welche Unternehmen in deiner Nähe stellen besetzen. Keine ungenauen Entfernungsangaben mehr."
            />
            <FeatureCard 
              icon={<Clock className="w-6 h-6 text-sky-400" />}
              title="Exakte Pendelzeiten"
              description="Egal ob Auto, Fahrrad oder Bus & Bahn: Wir berechnen die echte Fahrtzeit ab deiner Adresse für ein entspanntes Pendeln."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6 text-indigo-400" />}
              title="Verifizierte Stellen"
              description="Direkte Verknüpfung mit der Bundesagentur für Arbeit und geprüften Arbeitgebern für echte, aktuelle Jobs."
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
                Die moderne Recruiting-Plattform für transparente Jobsuche und echte Nähe.
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
            <p>© 2026 JobMaps Deutschland. Alle Rechte vorbehalten.</p>
            <p>Made with ❤️ for Jobsuchende in Deutschland</p>
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


