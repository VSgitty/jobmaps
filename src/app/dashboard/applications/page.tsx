import { Search, Filter, Mail, Check, X, Clock } from 'lucide-react';

export default function ApplicationsPage() {
  const applications = [
    { id: 1, name: 'Anna Bauer', job: 'Senior Software Engineer (m/w/d)', status: 'new', date: 'Vor 2 Stunden', match: 95 },
    { id: 2, name: 'Jan Schmidt', job: 'Senior Software Engineer (m/w/d)', status: 'reviewing', date: 'Vor 1 Tag', match: 82 },
    { id: 3, name: 'Maria Lang', job: 'Marketing Manager', status: 'interview', date: 'Vor 3 Tagen', match: 88 },
    { id: 4, name: 'Thomas Müller', job: 'Sales Representative', status: 'rejected', date: 'Vor 5 Tagen', match: 45 },
  ];

  const statusConfig = {
    new: { label: 'Neu', bg: 'bg-amber-400/10', text: 'text-amber-400' },
    reviewing: { label: 'In Prüfung', bg: 'bg-blue-400/10', text: 'text-blue-400' },
    interview: { label: 'Interview', bg: 'bg-purple-400/10', text: 'text-purple-400' },
    rejected: { label: 'Abgesagt', bg: 'bg-white/10', text: 'text-white/60' },
    hired: { label: 'Eingestellt', bg: 'bg-emerald-400/10', text: 'text-emerald-400' },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Bewerbungen</h2>
        <p className="text-white/60">Verwalten Sie Ihre Kandidaten und kommunizieren Sie mit ihnen.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Nach Name oder Stelle suchen..." 
            className="w-full bg-surface border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-primary shadow-sm"
          />
        </div>
        <button className="bg-surface border border-white/10 hover:bg-white/5 text-white rounded-xl px-4 py-3 flex items-center gap-2 transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Kanban-style Columns could go here, but a list view is cleaner for a quick overview */}
        <div className="lg:col-span-3 space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-surface/50 border border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 hover:border-white/20 transition-all cursor-pointer group">
              {/* Avatar & Name */}
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/80 to-emerald-400/80 p-[1px] shrink-0">
                  <div className="w-full h-full bg-surface rounded-full flex items-center justify-center font-bold text-white text-lg">
                    {app.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{app.name}</h3>
                  <p className="text-white/60 text-sm">für {app.job}</p>
                </div>
              </div>

              {/* Match Score & Date */}
              <div className="flex flex-row sm:flex-col items-center sm:items-end gap-4 sm:gap-1 w-full sm:w-auto border-t sm:border-none border-white/10 pt-4 sm:pt-0">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${app.match > 80 ? 'bg-emerald-400' : app.match > 60 ? 'bg-amber-400' : 'bg-red-400'}`} 
                      style={{ width: `${app.match}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-white">{app.match}% Match</span>
                </div>
                <div className="flex items-center gap-1 text-white/40 text-xs">
                  <Clock className="w-3 h-3" />
                  {app.date}
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig[app.status as keyof typeof statusConfig].bg} ${statusConfig[app.status as keyof typeof statusConfig].text}`}>
                  {statusConfig[app.status as keyof typeof statusConfig].label}
                </span>

                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors" title="Nachricht senden">
                    <Mail className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-emerald-400/10 hover:bg-emerald-400/20 flex items-center justify-center text-emerald-400 transition-colors" title="Zusagen">
                    <Check className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-red-400/10 hover:bg-red-400/20 flex items-center justify-center text-red-400 transition-colors" title="Absagen">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}