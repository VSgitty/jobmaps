import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-background font-sans text-text overflow-x-hidden flex flex-col">
      <Header />
      
      <section className="flex-1 flex items-center justify-center relative px-6 mt-20 mb-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-background to-background" />
        
        <div className="relative z-10 w-full max-w-lg bg-surface/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Kostenlos starten</h1>
            <p className="text-white/60">Erstellen Sie Ihr Arbeitgeberprofil in 2 Minuten</p>
          </div>

          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Vorname</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">Nachname</label>
                <input 
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Unternehmensname</label>
              <input 
                type="text" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Geschäftliche E-Mail</label>
              <input 
                type="email" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">Passwort</label>
              <input 
                type="password" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary focus:ring-offset-background" />
                <span className="text-sm text-white/60">
                  Ich stimme den <Link href="#" className="text-primary hover:underline">AGB</Link> und der <Link href="#" className="text-primary hover:underline">Datenschutzerklärung</Link> zu.
                </span>
              </label>
            </div>

            <Link href="/dashboard" className="block w-full">
              <Button type="button" className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-6 font-bold mt-4">
                Konto erstellen
              </Button>
            </Link>
          </form>

          <div className="mt-8 text-center">
            <p className="text-white/60 text-sm">
              Bereits registriert? <Link href="/login" className="text-primary font-medium hover:underline">Zum Login</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}