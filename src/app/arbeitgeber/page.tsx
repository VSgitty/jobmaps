import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Building2, TrendingUp, Users, Target, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ArbeitgeberPage() {
  return (
    <main className="min-h-screen bg-background font-sans text-text overflow-x-hidden">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-emerald-400 mb-8 backdrop-blur-md">
            <Building2 className="w-4 h-4" />
            <span>JobMaps für Arbeitgeber</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-8">
            Die besten Talente finden,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
              bevor sie suchen.
            </span>
          </h1>
          
          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Erreichen Sie aktiv Jobsuchende in Ihrer Nähe. Veröffentlichen Sie Stellenangebote direkt auf der Karte und überzeugen Sie mit echten Pendelzeiten und Benefits.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 py-6 text-lg font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2 w-full sm:w-auto">
                Kostenlos starten
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/preise">
              <Button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl px-8 py-6 text-lg font-bold transition-all w-full sm:w-auto">
                Preise ansehen
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-surface/50 border-t border-white/5">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Warum JobMaps?</h2>
            <p className="text-white/60 max-w-2xl mx-auto">Vergessen Sie klassische Jobbörsen. Mit JobMaps präsentieren Sie Ihr Unternehmen dort, wo Bewerber wirklich suchen.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="bg-background border border-white/10 rounded-2xl p-8 hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
                In 3 Schritten zu <br />neuen Mitarbeitern
              </h2>
              
              <div className="space-y-6">
                {[
                  "Unternehmensprofil erstellen & Marke präsentieren",
                  "Stellenanzeigen direkt anlegen oder per Link importieren",
                  "Bewerbungen zentral im Dashboard verwalten"
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0 mt-1">
                      {i + 1}
                    </div>
                    <p className="text-lg text-white/80">{step}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link href="/register">
                  <Button className="bg-white text-background hover:bg-white/90 rounded-xl px-8 py-6 font-bold flex items-center gap-2">
                    Jetzt Profil anlegen
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="flex-1 w-full relative">
              {/* Abstract Dashboard Preview */}
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-surface to-background border border-white/10 shadow-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="space-y-4 relative z-10">
                  <div className="flex gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-white/5" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-white/10 rounded" />
                      <div className="h-3 w-24 bg-white/5 rounded" />
                    </div>
                  </div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-4 w-48 bg-white/10 rounded" />
                        <div className="h-3 w-32 bg-white/5 rounded" />
                      </div>
                      <div className="w-24 h-8 rounded-full bg-primary/20" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const features = [
  {
    icon: <Target className="w-6 h-6 text-primary" />,
    title: "Lokale Reichweite",
    description: "Ihre Stellenanzeigen werden genau den Kandidaten auf der Karte angezeigt, die in Ihrer Nähe suchen und realistische Pendelwege haben."
  },
  {
    icon: <Users className="w-6 h-6 text-primary" />,
    title: "Einfaches Bewerben",
    description: "Bewerber können sich mit nur einem Klick direkt über die Plattform bewerben. Senken Sie die Hürden und erhalten Sie mehr Rücklauf."
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-primary" />,
    title: "Smarte Analytics",
    description: "Behalten Sie den Überblick über Aufrufe, Klicks und Bewerbungen. Optimieren Sie Ihre Anzeigen basierend auf echten Daten."
  }
];
