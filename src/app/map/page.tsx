'use client';

import { JobMap } from '@/maps/job-map';
import { Search, MapPin, Navigation, Car, Bike, Train, ChevronLeft, Crosshair, ExternalLink, Briefcase, Filter, CheckCircle2, Building2, Users, Award, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getJobCategory } from '@/lib/job-categories';

// Type definitions for our jobs and routing
export type RouteMode = 'driving' | 'walking' | 'cycling' | 'transit';
export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Job {
  id: string;
  title: string;
  company_name: string;
  location_name: string;
  latitude: number;
  longitude: number;
  exact_distance?: number;
  distance?: number;
  distance_text?: string;
  type?: string;
  salary_min?: string;
  salary_max?: string;
  redirect_url?: string;
  published_date?: string;
  beruf?: string;
  rating?: string;
  company_size?: string;
  industry?: string;
  description?: string;
  images?: string[];
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  routes?: {
    driving?: string;
    cycling?: string;
    walking?: string;
  };
}

function MapViewContent() {
  const searchParams = useSearchParams();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [keywordQuery, setKeywordQuery] = useState('');
  const [jobType, setJobType] = useState('Alle');
  const [distance, setDistance] = useState(25);
  const [isLocating, setIsLocating] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [routeMode, setRouteMode] = useState<RouteMode>('driving');

  // Handle geolocation auto-detect or manual click
  const handleLocateMe = useCallback(() => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
            const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}`);
            const data = await res.json();
            const address = data.features?.[0]?.place_name || "Mein Standort";
            setUserLocation({ latitude, longitude, address });
            setSearchQuery(address);
          } catch {
            setUserLocation({ latitude, longitude, address: "Mein Standort" });
          }
          setIsLocating(false);
        },
        (error) => {
          console.warn("Geolocation warning:", error);
          setUserLocation({ latitude: 50.1109, longitude: 8.6821, address: 'Frankfurt am Main' });
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setUserLocation({ latitude: 50.1109, longitude: 8.6821, address: 'Frankfurt am Main' });
      setIsLocating(false);
    }
  }, []);

  // Request browser geolocation or geocode URL search query on mount
  useEffect(() => {
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');

    if (latParam && lonParam) {
      const latitude = parseFloat(latParam);
      const longitude = parseFloat(lonParam);
      if (!isNaN(latitude) && !isNaN(longitude)) {
        const setDirectGps = async () => {
          setIsLocating(true);
          try {
            const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
            const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}`);
            const data = await res.json();
            const address = data.features?.[0]?.place_name || "Vor deiner Haustür";
            setUserLocation({ latitude, longitude, address });
            setSearchQuery(address);
          } catch {
            setUserLocation({ latitude, longitude, address: "Vor deiner Haustür" });
          }
          setIsLocating(false);
        };
        setDirectGps();
        return;
      }
    }

    const qParam = searchParams.get('q') || searchParams.get('query') || searchParams.get('location') || '';
    if (qParam.trim()) {
      const initSearch = async () => {
        setIsLocating(true);
        try {
          const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
          const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(qParam.trim())}.json?country=DE,AT,CH&access_token=${token}`);
          const data = await res.json();
          if (data.features && data.features.length > 0) {
            const feat = data.features[0];
            const [longitude, latitude] = feat.center;
            setUserLocation({ latitude, longitude, address: feat.place_name });
            setSearchQuery(feat.place_name);
          } else {
            setKeywordQuery(qParam.trim());
            handleLocateMe();
          }
        } catch (e) {
          console.error("Geocoding URL parameter error:", e);
          setKeywordQuery(qParam.trim());
          handleLocateMe();
        }
        setIsLocating(false);
      };
      initSearch();
    } else {
      handleLocateMe();
    }
  }, [searchParams, handleLocateMe]);

  // Handle Location Search using Mapbox Geocoder
  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setIsLocating(true);
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?country=DE,AT,CH&access_token=${token}`);
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const [longitude, latitude] = data.features[0].center;
          setUserLocation({ latitude, longitude, address: data.features[0].place_name });
        } else {
          alert("Ort nicht gefunden.");
        }
      } catch (err) {
        console.error("Geocoding error", err);
      }
      setIsLocating(false);
    }
  };

  // Fetch real internet jobs when location, distance, keyword, or jobType changes
  useEffect(() => {
    if (userLocation) {
      const fetchRealJobs = async () => {
        setLoadingJobs(true);
        try {
          const params = new URLSearchParams({
            lat: userLocation.latitude.toString(),
            lon: userLocation.longitude.toString(),
            radius: distance.toString(),
            query: keywordQuery,
            jobType: jobType
          });
          const res = await fetch(`/api/jobs?${params.toString()}`);
          if (res.ok) {
            const data = await res.json();
            const raw = data.jobs || [];
            // Sort strictly by exact distance ascending
            raw.sort((a: Job, b: Job) => (a.exact_distance ?? a.distance ?? 0) - (b.exact_distance ?? b.distance ?? 0));
            setJobs(raw);
          }
        } catch (e) {
          console.error("Fehler beim Laden echter Jobs", e);
        }
        setLoadingJobs(false);
      };

      const timer = setTimeout(fetchRealJobs, 300);
      return () => clearTimeout(timer);
    }
  }, [userLocation, distance, keywordQuery, jobType]);

  const handleResetFilters = () => {
    setKeywordQuery('');
    setJobType('Alle');
    setDistance(25);
  };

  return (
    <main className="flex flex-col h-screen w-full bg-background overflow-hidden font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 z-50 shrink-0">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Job Maps</span>
          </Link>
          
          <div className="flex bg-surface rounded-md p-1 border border-border items-center gap-1">
            <Search className="w-4 h-4 text-secondary ml-2 shrink-0" />
            <input 
              type="text" 
              placeholder="Ort suchen (Enter)" 
              className="bg-transparent border-none outline-none text-sm text-text px-2 py-1.5 w-52 placeholder:text-secondary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
            <Button 
              type="button"
              onClick={handleLocateMe}
              disabled={isLocating}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-md px-3 py-1.5 h-auto text-xs font-bold flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
              title="Sofort GPS-Standort bestimmen und Jobs vor der Haustür anzeigen"
            >
              {isLocating ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="bg-white text-emerald-700 rounded-full w-4 h-4 flex items-center justify-center font-black text-[10px]">GO</span>
                  <Navigation className="w-3.5 h-3.5 text-white fill-white" />
                  <span className="hidden sm:inline">Haustür</span>
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-xs text-secondary hidden md:inline">
            Standort: <strong className="text-text">{userLocation?.address?.split(',')[0] || 'Frankfurt'}</strong>
          </span>
          <Button variant="ghost" size="icon" className="text-secondary rounded-full">
            <div className="w-8 h-8 bg-surface rounded-full border border-border overflow-hidden">
               <div className="w-full h-full bg-gradient-to-br from-primary to-accent" />
            </div>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar - Filters & List (Spacious & Modern) */}
        <aside className="w-[560px] xl:w-[620px] max-w-[50vw] h-full bg-card border-r border-border flex flex-col z-20 shadow-2xl shrink-0">
          {!selectedJob ? (
            <>
              {/* Filters Header */}
              <div className="p-4 border-b border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-text text-sm">
                    <Filter className="w-4 h-4 text-primary" /> Filter & Suche
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-primary text-xs h-7 px-2">
                    Zurücksetzen
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs text-secondary font-medium">Beruf oder Suchbegriff</label>
                    <div className="relative">
                      <Briefcase className="w-3.5 h-3.5 absolute left-3 top-2.5 text-secondary" />
                      <input 
                        type="text" 
                        placeholder="z.B. Software, Edeka, dm, Pflege, Verkäufer..." 
                        className="w-full bg-surface border border-border rounded-md pl-9 pr-3 py-1.5 text-xs text-text outline-none focus:border-primary"
                        value={keywordQuery}
                        onChange={(e) => setKeywordQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Category Quick Pills */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                    {[
                      { label: 'Alle', value: '' },
                      { label: '🛍️ Handel', value: 'Edeka' },
                      { label: '💻 IT', value: 'Software' },
                      { label: '🩺 Pflege', value: 'Pflege' },
                      { label: '🔧 Technik', value: 'Ingenieur' },
                      { label: '📦 Logistik', value: 'Lager' },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        onClick={() => setKeywordQuery(btn.value)}
                        className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border ${keywordQuery === btn.value ? 'bg-primary text-white border-primary font-bold' : 'bg-surface text-secondary border-border hover:border-primary/50'}`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-secondary font-medium">Arbeitszeit</label>
                      <select 
                        className="w-full bg-surface border border-border rounded-md px-2 py-1.5 text-xs text-text outline-none focus:border-primary"
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value)}
                      >
                        <option value="Alle">Alle Typen</option>
                        <option value="Vollzeit">Vollzeit</option>
                        <option value="Teilzeit">Teilzeit</option>
                        <option value="Minijob">Minijob</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs text-secondary font-medium">Radius</label>
                        <span className="text-xs text-primary font-bold">{distance} km</span>
                      </div>
                      <input 
                        type="range" 
                        className="w-full accent-primary h-1.5 bg-surface rounded-lg cursor-pointer" 
                        min="5" 
                        max="100" 
                        step="5"
                        value={distance} 
                        onChange={(e) => setDistance(Number(e.target.value))} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Job List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-secondary mb-1 font-medium">
                  <span className="flex items-center gap-1 font-semibold text-text">
                    📍 Nächstgelegene zuerst {jobs.length > 0 && `(${jobs.length})`}
                  </span>
                  {loadingJobs && <span className="text-primary animate-pulse font-semibold">Aktualisiere...</span>}
                </div>
                
                {loadingJobs && jobs.length === 0 && (
                  <div className="text-center py-12 text-secondary text-sm space-y-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <div>Suche reale Stellenanzeigen...</div>
                  </div>
                )}
                
                {!loadingJobs && jobs.length === 0 && (
                  <div className="text-center py-12 text-secondary text-sm bg-surface/50 rounded-xl p-6 border border-border">
                    <p className="font-semibold text-text mb-1">Keine Stellenangebote gefunden</p>
                    <p className="text-xs">Versuche den Suchbegriff oder den Radius zu vergrößern.</p>
                  </div>
                )}

                {jobs.map((job) => {
                  const cat = getJobCategory(job.title, job.company_name, job.beruf);
                  const CatIcon = cat.icon;
                  const isHovered = hoveredJobId === job.id;
                  const bgImage = job.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80';

                  return (
                    <div 
                      key={job.id}
                      className={`relative rounded-2xl p-4 cursor-pointer transition-all duration-200 shadow-md hover:shadow-2xl overflow-hidden border-2 group ${isHovered ? 'ring-2 ring-primary border-primary scale-[1.02]' : 'border-border/60 hover:border-primary/60'}`}
                      onClick={() => setSelectedJob(job)}
                      onMouseEnter={() => setHoveredJobId(job.id)}
                      onMouseLeave={() => setHoveredJobId(null)}
                    >
                      {/* Background Workplace Photo with Dark Gradient Overlay */}
                      <div className="absolute inset-0 z-0 pointer-events-none">
                        <img 
                          src={bgImage} 
                          alt={job.company_name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-25"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-card via-card/95 to-card/80" />
                      </div>

                      {/* Content Overlay */}
                      <div className="relative z-10 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span 
                            className="text-[11px] font-bold px-2.5 py-1 rounded-lg text-white flex items-center gap-1.5 shadow-sm"
                            style={{ backgroundColor: cat.color }}
                          >
                            <CatIcon className="w-3.5 h-3.5" />
                            {cat.name}
                          </span>
                          {(job.distance_text || job.distance !== undefined) && (
                            <span className="text-xs font-bold text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1 shadow-sm">
                              📍 {job.distance_text || `${job.distance} km`}
                            </span>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-text text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                            {job.title}
                          </h3>
                          <div className="text-xs text-secondary font-medium mt-0.5 flex items-center gap-1.5">
                            <span className="font-semibold text-text/90 truncate">{job.company_name}</span>
                            {job.rating && (
                              <span className="text-[10px] text-amber-400 font-bold bg-amber-500/15 px-1.5 py-0.5 rounded">
                                ⭐ {job.rating}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-xs text-secondary flex items-center justify-between pt-2 border-t border-border/40">
                          <div className="flex items-center gap-1 truncate max-w-[200px]">
                            <MapPin className="w-3 h-3 shrink-0 text-primary" /> 
                            <span className="truncate">{job.location_name}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {job.type || "Vollzeit"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            // Detail View
            <div className="flex flex-col h-full bg-card">
              <div className="p-3.5 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur shrink-0">
                <button 
                  onClick={() => setSelectedJob(null)} 
                  className="text-secondary hover:text-text transition-colors flex items-center gap-1.5 text-xs font-semibold"
                >
                  <ChevronLeft className="w-4 h-4 text-primary" /> Zurück zur Übersicht
                </button>
                {(() => {
                  const cat = getJobCategory(selectedJob.title, selectedJob.company_name, selectedJob.beruf);
                  return (
                    <span 
                      className="text-xs font-bold px-2.5 py-1 rounded-full text-white flex items-center gap-1 shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.name}
                    </span>
                  );
                })()}
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                {/* Company & Office Photo Gallery */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-secondary uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><ImageIcon className="w-4 h-4 text-primary" /> Einblicke & Arbeitsumgebung</span>
                    <span className="text-xs text-primary bg-primary/10 px-2.5 py-0.5 rounded-full font-bold">3 Galeriebilder</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
                    {(selectedJob.images && selectedJob.images.length > 0 ? selectedJob.images : [
                      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
                      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
                      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80'
                    ]).map((img, i) => (
                      <div key={i} className="snap-center shrink-0 w-64 h-36 rounded-2xl overflow-hidden border border-border relative group shadow-md">
                        <img src={img} alt={`Unternehmensbild ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90" />
                        <span className="absolute bottom-2.5 left-3 text-xs text-white font-semibold px-2 py-0.5 bg-black/50 rounded-lg backdrop-blur-md border border-white/10">
                          {i === 0 ? '🏢 Empfang & Büro' : i === 1 ? '👥 Team & Kultur' : '🚀 Arbeitsplatz'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Company Header Card */}
                <div className="bg-surface border border-border rounded-2xl p-5 space-y-4 relative overflow-hidden shadow-md">
                  <div className="flex items-start gap-4">
                    {(() => {
                      const cat = getJobCategory(selectedJob.title, selectedJob.company_name, selectedJob.beruf);
                      const CatIcon = cat.icon;
                      return (
                        <div 
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold shrink-0 shadow-xl border border-white/20"
                          style={{ backgroundColor: cat.color }}
                        >
                           <CatIcon className="w-7 h-7" />
                        </div>
                      );
                    })()}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-text text-base truncate">{selectedJob.company_name}</h3>
                        <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 shrink-0">
                          ⭐ {selectedJob.rating || '4.5'}
                        </span>
                      </div>
                      <p className="text-xs text-secondary truncate mt-0.5">{selectedJob.industry || 'Unternehmen & Arbeitgeber'}</p>
                      <div className="flex items-center gap-2 text-xs text-secondary mt-1.5">
                        <span className="flex items-center gap-1 font-medium"><Users className="w-3.5 h-3.5 text-primary" /> {selectedJob.company_size || '500+ Mitarbeiter'}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">{selectedJob.type || 'Vollzeit'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/50">
                    <h2 className="text-xl font-extrabold text-text leading-snug">{selectedJob.title}</h2>
                    <div className="flex items-center gap-2 text-xs text-secondary mt-2">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-medium text-text/90">{selectedJob.location_name}</span>
                      <span className="ml-auto font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg text-xs">
                        {selectedJob.distance_text || (selectedJob.distance !== undefined ? `${selectedJob.distance} km entfernt` : '')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description Paragraph */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-primary" /> Über das Unternehmen & die Stelle
                  </h3>
                  <p className="text-xs sm:text-sm text-text/85 leading-relaxed bg-surface/70 border border-border p-4 rounded-2xl">
                    {selectedJob.description || `Unser Partnerunternehmen ${selectedJob.company_name} sucht ab sofort Verstärkung für das Team in ${selectedJob.location_name}. Wir bieten ein hochmotiviertes Arbeitsumfeld, moderne Arbeitsmittel und hervorragende Perspektiven.`}
                  </p>
                </div>

                {/* Requirements / Criteria Section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Anforderungen & Kriterien
                  </h3>
                  <div className="bg-surface/70 border border-border rounded-2xl p-4 space-y-2.5">
                    {(selectedJob.requirements || [
                      'Abgeschlossene Ausbildung oder entsprechendes Studium',
                      'Mindestens 1-3 Jahre relevante Berufserfahrung',
                      'Selbstständige und strukturierte Arbeitsweise',
                      'Fließende Deutschkenntnisse in Wort und Schrift'
                    ]).map((req, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-text/90">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0 shadow-xs" />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Benefits Badges in 2 Columns */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Benefits & Vorteile
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {(selectedJob.benefits || [
                      'Flexible Arbeitszeiten & Homeoffice-Option',
                      '30 Tage Urlaub & Sonderurlaub',
                      'Attraktive Vergütung + Boni',
                      'JobRad-Leasing & ÖPNV-Zuschuss',
                      'Betriebliche Altersvorsorge & Weiterbildung'
                    ]).map((ben, i) => (
                      <div key={i} className="bg-surface border border-border/80 p-3 rounded-xl text-text/90 flex items-center gap-2.5 font-medium shadow-xs">
                        <Award className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-xs leading-snug">{ben}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Color-Coded Route & Travel Selector */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-secondary uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5 text-primary" /> Anfahrt & Route (ab deinem Standort)</span>
                  </div>

                  <div className="space-y-2">
                    <div 
                      onClick={() => setRouteMode('driving')}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${routeMode === 'driving' ? 'bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500 shadow-md' : 'bg-surface border-border hover:border-emerald-500/50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${routeMode === 'driving' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-emerald-400'}`}>
                          <Car className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-text">Auto / Pkw</div>
                          <div className="text-[10px] text-emerald-400 font-medium">Schnellste Straßenroute (Grün)</div>
                        </div>
                      </div>
                      <div className="font-bold text-sm text-emerald-400">{selectedJob.routes?.driving || '- Min'}</div>
                    </div>
                    
                    <div 
                      onClick={() => setRouteMode('cycling')}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${routeMode === 'cycling' ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500 shadow-md' : 'bg-surface border-border hover:border-amber-500/50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${routeMode === 'cycling' ? 'bg-amber-500 text-white' : 'bg-white/5 text-amber-400'}`}>
                          <Bike className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-text">Fahrrad / E-Bike</div>
                          <div className="text-[10px] text-amber-400 font-medium">Radweg-Netz (Gelb/Orange)</div>
                        </div>
                      </div>
                      <div className="font-bold text-sm text-amber-400">{selectedJob.routes?.cycling || '- Min'}</div>
                    </div>

                    <div 
                      onClick={() => setRouteMode('walking')}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${routeMode === 'walking' ? 'bg-purple-500/15 border-purple-500 ring-1 ring-purple-500 shadow-md' : 'bg-surface border-border hover:border-purple-500/50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${routeMode === 'walking' ? 'bg-purple-500 text-white' : 'bg-white/5 text-purple-400'}`}>
                          <Train className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-text">Zu Fuß / Fußgänger</div>
                          <div className="text-[10px] text-purple-400 font-medium">Direkte Fußgängerroute (Lila gepunktet)</div>
                        </div>
                      </div>
                      <div className="font-bold text-sm text-purple-400">{selectedJob.routes?.walking || '- Min'}</div>
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="pt-2 sticky bottom-0 bg-card py-3 border-t border-border">
                  <a href={selectedJob.redirect_url || '#'} target="_blank" rel="noopener noreferrer" className="block">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 py-5 rounded-xl font-bold shadow-xl text-sm">
                      Jetzt bewerben / Stelle aufrufen <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Map Area */}
        <div className="flex-1 relative">
          <JobMap 
            initialViewState={{ zoom: 11 }} 
            userLocation={userLocation}
            radiusKm={distance}
            jobs={jobs}
            selectedJob={selectedJob}
            onSelectJob={setSelectedJob}
            hoveredJobId={hoveredJobId}
            onHoverJob={setHoveredJobId}
            routeMode={routeMode}
          />
        </div>
      </div>
    </main>
  );
}

export default function MapView() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full bg-background flex flex-col items-center justify-center text-text gap-3 font-sans">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-secondary">Lade Job Map...</span>
      </div>
    }>
      <MapViewContent />
    </Suspense>
  );
}

