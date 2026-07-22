import Link from "next/link";
import { MapPin } from "lucide-react";
import { Button } from "../ui/button";

export function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6">
      <div className="flex items-center gap-12">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Job Maps</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-8">
          <Link href="#" className="text-sm font-medium text-white/90 hover:text-white transition-colors">Für Jobsuchende</Link>
          <Link href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Für Arbeitgeber</Link>
          <Link href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Preise</Link>
          <Link href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-1">
            Ressourcen
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-70">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <Link href="#" className="text-sm font-medium text-white hover:text-white/80 transition-colors">Login</Link>
        <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-6">
          Kostenlos starten
        </Button>
      </div>
    </header>
  );
}
