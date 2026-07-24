import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background font-sans text-text overflow-x-hidden flex flex-col">
      <Header />
      
      <section className="flex-1 flex items-center justify-center relative px-6 mt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        
        <div className="relative z-10 w-full max-w-md bg-surface/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Willkommen zurück</h1>
            <p className="text-white/60">Loggen Sie sich in Ihr JobMaps-Konto ein</p>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">E-Mail Adresse</label>
              <input 
                type="email" 
                placeholder="name@unternehmen.de" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-white/80">Passwort</label>
                <Link href="#" className="text-xs text-primary hover:underline">Passwort vergessen?</Link>
              </div>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <Button type="button" className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-6 font-bold mt-4">
              Einloggen
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-white/60 text-sm">
              Noch kein Konto? <Link href="/register" className="text-primary font-medium hover:underline">Kostenlos registrieren</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}