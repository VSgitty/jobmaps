import { Header } from '@/components/layout/header';
import { BookOpen, FileText, Video, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function RessourcenPage() {
  const resources = [
    {
      category: "Guides & Best Practices",
      icon: <BookOpen className="w-6 h-6 text-primary" />,
      items: [
        { title: "Die perfekte Stellenanzeige schreiben", desc: "Tipps und Vorlagen für Inserate, die konvertieren." },
        { title: "Employer Branding Guide", desc: "Wie Sie Ihr Unternehmen als Top-Arbeitgeber positionieren." },
        { title: "Lokales Recruiting meistern", desc: "Strategien, um Kandidaten in Ihrer direkten Umgebung zu finden." }
      ]
    },
    {
      category: "Templates & Checklisten",
      icon: <FileText className="w-6 h-6 text-primary" />,
      items: [
        { title: "Checkliste: Onboarding neuer Mitarbeiter", desc: "Ein reibungsloser Start für neue Teammitglieder." },
        { title: "Interview-Leitfaden", desc: "Fragen und Struktur für erfolgreiche Vorstellungsgespräche." }
      ]
    },
    {
      category: "Webinare & Videos",
      icon: <Video className="w-6 h-6 text-primary" />,
      items: [
        { title: "JobMaps Plattform-Tour", desc: "Lernen Sie alle Funktionen kennen (15 Min)." },
        { title: "Recruiting-Trends 2026", desc: "Expertenpanel zu den wichtigsten Entwicklungen am Arbeitsmarkt." }
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-background font-sans text-text overflow-x-hidden">
      <Header />
      
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        
        <div className="relative z-10 max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-extrabold tracking-tight text-white mb-6">
              Ressourcen & Wissen
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Nutzen Sie unsere kostenlosen Leitfäden, Templates und Videos, um Ihr Recruiting auf das nächste Level zu heben.
            </p>
          </div>

          <div className="space-y-16 max-w-4xl mx-auto">
            {resources.map((section, i) => (
              <div key={i}>
                <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
                  {section.icon}
                  <h2 className="text-2xl font-bold text-white">{section.category}</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {section.items.map((item, j) => (
                    <Link key={j} href="#" className="group bg-surface/50 border border-white/10 rounded-2xl p-6 hover:border-primary/50 transition-colors block">
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                      <p className="text-white/60 mb-4">{item.desc}</p>
                      <div className="flex items-center gap-2 text-primary font-medium text-sm">
                        Ansehen <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}