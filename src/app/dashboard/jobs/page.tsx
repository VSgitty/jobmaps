import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Search, MoreVertical, MapPin, Eye, MousePointerClick, Calendar } from 'lucide-react';

export default function JobsPage() {
  const jobs = [
    { id: 1, title: 'Senior Software Engineer (m/w/d)', location: 'Frankfurt am Main', status: 'active', views: 342, clicks: 45, date: '12.07.2026' },
    { id: 2, title: 'Marketing Manager', location: 'Remote / Berlin', status: 'paused', views: 890, clicks: 112, date: '01.07.2026' },
    { id: 3, title: 'Sales Representative', location: 'München', status: 'active', views: 156, clicks: 23, date: '20.07.2026' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Stellenanzeigen</h2>
          <p className="text-white/60">Verwalten Sie Ihre offenen Positionen.</p>
        </div>
        <Link href="/dashboard/jobs/new">
          <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6">
            <Plus className="w-4 h-4 mr-2" />
            Neue Stelle anlegen
          </Button>
        </Link>
      </div>

      <div className="bg-surface/50 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Stellen durchsuchen..." 
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
            />
          </div>
          <select className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary appearance-none">
            <option value="all">Alle Status</option>
            <option value="active">Aktiv</option>
            <option value="paused">Pausiert</option>
            <option value="draft">Entwurf</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/80">
            <thead className="bg-white/5 text-white/60 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium">Stellentitel</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Performance</th>
                <th className="px-6 py-4 font-medium">Veröffentlicht</th>
                <th className="px-6 py-4 font-medium text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white mb-1">{job.title}</div>
                    <div className="flex items-center gap-1 text-white/50 text-xs">
                      <MapPin className="w-3 h-3" /> {job.location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      job.status === 'active' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-white/10 text-white/60'
                    }`}>
                      {job.status === 'active' ? 'Aktiv' : 'Pausiert'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1" title="Ansichten">
                        <Eye className="w-4 h-4 text-white/40" /> {job.views}
                      </div>
                      <div className="flex items-center gap-1" title="Klicks auf Bewerben">
                        <MousePointerClick className="w-4 h-4 text-white/40" /> {job.clicks}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/60">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-white/40" /> {job.date}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}