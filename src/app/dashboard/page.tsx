import { Eye, MousePointerClick, Users, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { label: "Aktive Stellen", value: "3", change: "+1", trend: "up", icon: <TrendingUp className="w-5 h-5 text-emerald-400" /> },
    { label: "Ansichten (30 Tage)", value: "1,245", change: "+12%", trend: "up", icon: <Eye className="w-5 h-5 text-blue-400" /> },
    { label: "Klicks auf Bewerben", value: "84", change: "+5%", trend: "up", icon: <MousePointerClick className="w-5 h-5 text-purple-400" /> },
    { label: "Neue Bewerbungen", value: "12", change: "-2", trend: "down", icon: <Users className="w-5 h-5 text-amber-400" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Willkommen zurück, Mustermann GmbH</h2>
          <p className="text-white/60">Hier ist ein Überblick über Ihre Recruiting-Aktivitäten.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-surface/50 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                {stat.icon}
              </div>
              <div className={`text-sm font-medium ${stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                {stat.change}
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-white/60 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Applications */}
        <div className="lg:col-span-2 bg-surface/50 border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Neueste Bewerbungen</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-400 p-[1px]">
                    <div className="w-full h-full bg-surface rounded-full flex items-center justify-center font-bold text-white">
                      {['AB', 'JS', 'ML'][i-1]}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{['Anna Bauer', 'Jan Schmidt', 'Maria Lang'][i-1]}</h4>
                    <p className="text-white/50 text-sm">für Software Entwickler (m/w/d)</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-400/10 text-amber-400">
                    Neu
                  </span>
                  <p className="text-white/40 text-xs mt-1">Vor {i * 2} Stunden</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-surface/50 border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Schnellzugriff</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-left">
              <span className="text-white font-medium">Stellenanzeige aus Link importieren</span>
              <span className="text-primary font-bold">→</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-left">
              <span className="text-white font-medium">Unternehmensprofil aktualisieren</span>
              <span className="text-primary font-bold">→</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-left">
              <span className="text-white font-medium">Rechnungen einsehen</span>
              <span className="text-primary font-bold">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}