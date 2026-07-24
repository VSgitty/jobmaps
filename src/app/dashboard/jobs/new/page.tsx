import { Button } from '@/components/ui/button';
import { ArrowLeft, Link as LinkIcon, Save, Play } from 'lucide-react';
import Link from 'next/link';

export default function NewJobPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/jobs" className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/60 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Neue Stellenanzeige erstellen</h2>
          <p className="text-white/60">Füllen Sie die Details manuell aus oder importieren Sie per Link.</p>
        </div>
      </div>

      {/* Import via Link Card */}
      <div className="bg-gradient-to-r from-primary/20 to-surface border border-primary/50 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Stellenanzeige importieren</h3>
              <p className="text-sm text-white/70">Fügen Sie einen Link (z.B. von Ihrer Karriereseite) ein und wir füllen die Felder automatisch aus.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <input 
              type="url" 
              placeholder="https://unternehmen.de/karriere/job-123" 
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
            />
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 font-bold whitespace-nowrap">
              Link analysieren
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-surface/50 border border-white/10 rounded-2xl p-8">
        <form className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2">1. Basisinformationen</h3>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-white/80 mb-1.5">Stellentitel *</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="z.B. Software Entwickler (m/w/d)" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Arbeitsort (Adresse) *</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="Straße, PLZ Stadt" />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Arbeitsmodell *</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary appearance-none">
                  <option>Vor Ort</option>
                  <option>Hybrid</option>
                  <option>100% Remote</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2">2. Details & Beschreibung</h3>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Stellenbeschreibung</label>
              <textarea rows={6} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary resize-y" placeholder="Beschreiben Sie die Rolle, Aufgaben und Anforderungen..."></textarea>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Gehaltsspanne (Optional)</label>
                <div className="flex gap-2 items-center">
                  <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="Von" />
                  <span className="text-white/40">-</span>
                  <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="Bis" />
                  <span className="text-white/60 ml-2">€ / Jahr</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Benefits</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary" placeholder="Mit Komma getrennt (z.B. Jobrad, Home Office)" />
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
            <Button type="button" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl px-6 py-5 font-medium flex items-center gap-2 w-full sm:w-auto">
              <Save className="w-4 h-4" /> Entwurf speichern
            </Button>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <Button type="button" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-8 py-5 font-bold flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-emerald-500/20">
                <Play className="w-4 h-4" /> Jetzt veröffentlichen
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}