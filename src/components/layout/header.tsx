import Link from "next/link";
import { MapPin, Compass, Briefcase, Tag, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/60 backdrop-blur-xl border-b border-white/10 px-6 sm:px-10 py-3.5 transition-all">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-extrabold text-lg tracking-tight leading-none">JobMaps</span>
              <span className="text-[10px] text-blue-400 font-semibold tracking-widest uppercase">Germany</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-md">
            <Link href="/map" className="text-xs font-semibold px-4 py-1.5 rounded-full text-white bg-blue-600 shadow-md transition-all flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              Karte & Jobs
            </Link>
            <Link href="/arbeitgeber" className="text-xs font-medium px-4 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              Für Arbeitgeber
            </Link>
            <Link href="/preise" className="text-xs font-medium px-4 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Preise
            </Link>
            <Link href="/ressourcen" className="text-xs font-medium px-4 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Ressourcen
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 transition-colors">
            Anmelden
          </Link>
          <Link href="/map">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-5 py-2 text-xs font-bold shadow-lg shadow-blue-600/25 flex items-center gap-1.5 transition-all hover:scale-[1.02]">
              <span>Jobs entdecken</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
