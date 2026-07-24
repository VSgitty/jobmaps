'use client';

import { Header } from '@/components/layout/header';
import { JobMap } from '@/maps/job-map';
import { MapPin, Navigation, Clock, Target, Eye, Star, TrendingUp, Building2, Users, Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [isGoLocating, setIsGoLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Animated counters state
  const [counts, setCounts] = useState({ jobs: 0, companies: 0, applicants: 0 });

  useEffect(() => {
    // Simple counter animation on mount
    const interval = setInterval(() => {
      setCounts(prev => ({
        jobs: prev.jobs < 124500 ? prev.jobs + 2500 : 124500,
        companies: prev.companies < 8500 ? prev.companies + 150 : 8500,
        applicants: prev.applicants < 450000 ? prev.applicants + 8500 : 450000,
      }));
    }, 20);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/map?q=${encodeURIComponent(searchQuery.trim())}`);
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
    <main className="min-h-screen bg-background font-sans selection:bg-primary/30 text-text overflow-x-hidden">
      <Header />
      
      {/* 1. HERO SECTION */}
      <section className="relative h-[90vh] min-h-[700px] flex items-center pt-16">
        {/* Background Map & Gradient Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 scale-105 pointer-events-none blur-[2px] opacity-40">
            <JobMap interactive={false} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 sm:px-12 flex flex-col lg:flex-row items-center gap-16">
          {/* Left: Text & CTA */}
          <div className="flex-1 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/80 mb-6 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Die Recruiting-Plattform der nächsten Generation</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
              Finde Arbeit, die <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                zu deinem Leben passt.
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-2xl leading-relaxed font-light">
              Kein langes Suchen mehr. Entdecke Top-Arbeitgeber direkt in deiner Nähe, vergleiche echte Pendelzeiten und finde deinen Traumjob auf der Karte.
            </p>

            {/* Smart Search Bar */}
            <form onSubmit={handleSearch} className="w-full max-w-2xl bg-surface/50 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 flex flex-col sm:flex-row items-center gap-3 shadow-2xl mb-8 transition-all hover:bg-surface/80 hover:border-white/20 focus-within:bg-surface focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
              <div className="flex-1 flex items-center px-4 w-full">
                <Search className="w-5 h-5 text-white/40 mr-3 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Job, Stadt, Firma oder Branche eingeben..." 
                  className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/40 font-medium text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-xl px-8 py-6 text-base font-bold shadow-lg transition-transform active:scale-95">
                Jobs finden
              </Button>
            </form>

            <div className="flex items-center gap-4 text-sm text-white/50 font-medium">
              <span>Oder direkt loslegen:</span>
              <Button 
                onClick={handleGoLocate}
                disabled={isGoLocating}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full px-5 py-2 h-auto text-xs font-bold flex items-center gap-2 transition-all active:scale-95 group"
              >
                {isGoLocating ? (
                  <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Navigation className="w-3.5 h-3.5 text-emerald-400 group-hover:animate-pulse" />
                    Jobs vor meiner Haustür
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right: Live Counters / Abstract Preview */}
          <div className="flex-1 w-full relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-emerald-500/20 blur-3xl rounded-full" />
            <div className="relative grid grid-cols-2 gap-4">
              <CounterCard icon={<Briefcase />} value={counts.jobs.toLocaleString('de-DE')} label="Offene Stellen" delay={0} />
              <CounterCard icon={<Building2 />} value={counts.companies.toLocaleString('de-DE')} label="Top Unternehmen" delay={100} />
              <CounterCard icon={<Users />} value={counts.applicants.toLocaleString('de-DE')} label="Aktive Bewerber" delay={200} />
              <div className="bg-gradient-to-br from-primary to-emerald-500 rounded-3xl p-6 flex flex-col justify-center text-white shadow-2xl transform translate-y-4 hover:-translate-y-1 transition-transform">
                <TrendingUp className="w-8 h-8 mb-4 opacity-80" />
                <div className="text-3xl font-black mb-1">+4.200</div>
                <div className="text-sm font-medium opacity-90">Neue Jobs heute</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LOGO CLOUD (Top Arbeitgeber) */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-sm text-white/50 uppercase tracking-widest font-bold whitespace-nowrap">
            Vertraut von Branchenführern
          </p>
          <div className="flex flex-wrap justify-center md:justify-end items-center gap-x-12 gap-y-8 opacity-40 grayscale contrast-200 hover:grayscale-0 transition-all duration-500">
            {/* Replace with real SVGs in production */}
            <span className="text-2xl font-black font-sans tracking-tight">SIEMENS</span>
            <span className="text-2xl font-black font-serif italic">BOSCH</span>
            <span className="text-2xl font-black tracking-widest">Allianz</span>
            <span className="text-2xl font-bold bg-white text-black px-2 rounded-sm">Lidl</span>
            <span className="text-2xl font-black tracking-tighter text-red-500">REWE</span>
          </div>
        </div>
      </section>

      {/* 3. WHY JOBMAPS (Features) */}
      <section className="py-32 relative">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Die Jobsuche, <span className="text-primary">neu gedacht.</span></h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">Vergiss unübersichtliche Listen. Wir bringen Jobs dorthin, wo sie hingehören: auf die Karte.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureBox 
              icon={<MapPin />}
              title="Kartenbasierte Suche"
              description="Sieh sofort, wo sich der Arbeitsplatz befindet. Kein Copy-Paste mehr in Google Maps nötig."
            />
            <FeatureBox 
              icon={<Clock />}
              title="Reale Pendelzeiten"
              description="Wir berechnen deinen täglichen Arbeitsweg mit Auto, Fahrrad oder ÖPNV exakt ab deiner Haustür."
            />
            <FeatureBox 
              icon={<Target />}
              title="One-Click Bewerbung"
              description="Lebenslauf hochladen und mit nur einem Klick bei hunderten von verifizierten Top-Arbeitgebern bewerben."
            />
          </div>
        </div>
      </section>

      {/* 4. FOOTER PREVIEW */}
      <footer className="border-t border-white/10 bg-card/50 pt-20 pb-10">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold text-xl tracking-tight">Job Maps</span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">
                Die moderne Recruiting-Plattform für Talente und Unternehmen, die zusammenpassen.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Für Bewerber</h4>
              <ul className="space-y-4 text-sm text-white/50">
                <li><Link href="#" className="hover:text-primary transition-colors">Jobsuche</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Gehaltsrechner</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Lebenslauf KI</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Karriere Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Für Arbeitgeber</h4>
              <ul className="space-y-4 text-sm text-white/50">
                <li><Link href="#" className="hover:text-primary transition-colors">Stellen schalten</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Preise & Pakete</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Talent Pool</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">API Integration</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Rechtliches</h4>
              <ul className="space-y-4 text-sm text-white/50">
                <li><Link href="#" className="hover:text-primary transition-colors">Impressum</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Datenschutz</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">AGB</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
            <p>© 2026 JobMaps Inc. Alle Rechte vorbehalten.</p>
            <div className="flex gap-4">
              <span>Made with ❤️ in Germany</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

// Subcomponents
function CounterCard({ icon, value, label, delay }: any) {
  return (
    <div 
      className="bg-surface/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex flex-col justify-center shadow-xl hover:-translate-y-1 transition-transform"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <div className="text-3xl font-black text-white mb-1">{value}</div>
      <div className="text-sm font-medium text-white/50">{label}</div>
    </div>
  );
}

function FeatureBox({ icon, title, description }: any) {
  return (
    <div className="bg-surface/30 border border-white/5 hover:border-primary/30 hover:bg-surface/50 p-10 rounded-[2rem] transition-all duration-300 group cursor-default">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      <p className="text-base text-white/60 leading-relaxed">{description}</p>
    </div>
  );
}

function Sparkles(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

function Briefcase(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <rect width="20" height="14" x="2" y="6" rx="2" />
    </svg>
  );
}

