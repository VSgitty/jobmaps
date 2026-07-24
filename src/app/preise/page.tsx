import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function PreisePage() {
  return (
    <main className="min-h-screen bg-background font-sans text-text overflow-x-hidden">
      <Header />
      
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        
        <div className="relative z-10 max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
              Transparente Preise.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                Ohne versteckte Kosten.
              </span>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Zahlen Sie nur für das, was Sie wirklich brauchen. Starten Sie kostenlos und skalieren Sie nach Ihrem Bedarf.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-surface/50 border border-white/10 rounded-3xl p-8 flex flex-col">
              <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
              <p className="text-white/60 mb-6">Für kleine Unternehmen</p>
              <div className="mb-8">
                <span className="text-5xl font-extrabold text-white">0€</span>
                <span className="text-white/60"> / Monat</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['1 aktives Stelleninserat', 'Unternehmensprofil', 'Basis Analytics', 'Email-Support'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/80">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl py-6 font-bold">
                  Kostenlos starten
                </Button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-b from-primary/20 to-surface border border-primary/50 rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-primary/20">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-primary text-white text-sm font-bold rounded-full">
                Am beliebtesten
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
              <p className="text-white/60 mb-6">Für wachsende Teams</p>
              <div className="mb-8">
                <span className="text-5xl font-extrabold text-white">149€</span>
                <span className="text-white/60"> / Monat</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  '10 aktive Stelleninserate', 
                  'Premium Unternehmensprofil', 
                  'Erweiterte Analytics', 
                  'Kandidaten-Matching',
                  'Priorisierter Support'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/80">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register?plan=pro">
                <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-6 font-bold">
                  Pro testen
                </Button>
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-surface/50 border border-white/10 rounded-3xl p-8 flex flex-col">
              <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
              <p className="text-white/60 mb-6">Für große Unternehmen</p>
              <div className="mb-8">
                <span className="text-5xl font-extrabold text-white">Individuell</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  'Unbegrenzte Inserate', 
                  'API & Integrationen', 
                  'ATS Import', 
                  'Custom Branding',
                  'Persönlicher Account Manager'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/80">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/kontakt">
                <Button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl py-6 font-bold">
                  Vertrieb kontaktieren
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}