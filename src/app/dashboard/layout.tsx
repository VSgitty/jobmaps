'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Settings, 
  Bell, 
  LogOut,
  MapPin,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: "Übersicht", href: "/dashboard" },
    { icon: <Briefcase className="w-5 h-5" />, label: "Stellenanzeigen", href: "/dashboard/jobs" },
    { icon: <Users className="w-5 h-5" />, label: "Bewerbungen", href: "/dashboard/applications" },
    { icon: <Settings className="w-5 h-5" />, label: "Unternehmensprofil", href: "/dashboard/profile" },
  ];

  return (
    <div className="min-h-screen bg-background font-sans text-text flex">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-white/10 hidden md:flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold tracking-tight">JobMaps</span>
          </Link>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-white/10">
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors font-medium">
            <LogOut className="w-5 h-5" />
            Ausloggen
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-background/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-40">
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          
          <div className="flex items-center gap-4">
            <Link href="/dashboard/jobs/new">
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-4 h-10 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Neue Stelle</span>
              </Button>
            </Link>
            <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-emerald-400 p-0.5">
              <div className="w-full h-full bg-surface rounded-full flex items-center justify-center text-sm font-bold text-white">
                M
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}