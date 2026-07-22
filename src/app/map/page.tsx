'use client';

import { JobMap } from '@/maps/job-map';
import { Search, MapPin, Navigation, Car, Bike, Train, ChevronLeft, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';

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
  distance?: number;
  type?: string;
  salary_min?: string;
  salary_max?: string;
  redirect_url?: string;
  routes?: {
    driving?: string;
    cycling?: string;
    walking?: string;
  };
}

export default function MapView() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [distance, setDistance] = useState(25);
  const [isLocating, setIsLocating] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [routeMode, setRouteMode] = useState<RouteMode>('driving');

  // Handle geolocation
  const handleLocateMe = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get address (using Mapbox)
          try {
            const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`);
            const data = await res.json();
            const address = data.features[0]?.place_name || "Mein Standort";
            setUserLocation({ latitude, longitude, address });
            setSearchQuery(address);
          } catch {
            setUserLocation({ latitude, longitude, address: "Mein Standort" });
          }
          setIsLocating(false);
        },
        (error) => {
          console.error("Error locating:", error);
          alert("Standort konnte nicht ermittelt werden.");
          setIsLocating(false);
        }
      );
    } else {
      alert("Geolocation wird von diesem Browser nicht unterstützt.");
      setIsLocating(false);
    }
  };

  // Handle Search using Mapbox Geocoder
  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setIsLocating(true);
      try {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?country=DE,AT,CH&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`);
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

  // Fetch jobs when location changes
  useEffect(() => {
    if (userLocation) {
      const fetchRealJobs = async () => {
        setLoadingJobs(true);
        try {
          const res = await fetch(`/api/jobs?lat=${userLocation.latitude}&lon=${userLocation.longitude}&radius=${distance}`);
          if (res.ok) {
            const data = await res.json();
            setJobs(data.jobs);
          }
        } catch (e) {
          console.error("Fehler beim Laden echter Jobs", e);
        }
        setLoadingJobs(false);
      };
      fetchRealJobs();
    }
  }, [userLocation, distance]);

  return (
    <main className="flex flex-col h-screen w-full bg-background overflow-hidden font-sans">
      {/* Top Header - different from landing page */}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 z-50 shrink-0">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Job Maps</span>
          </Link>
          
          <div className="flex bg-surface rounded-md p-1 border border-border items-center">
            <Search className="w-4 h-4 text-secondary ml-3 shrink-0" />
            <input 
              type="text" 
              placeholder="Ort suchen (Enter)" 
              className="bg-transparent border-none outline-none text-sm text-text px-3 py-1.5 w-64 placeholder:text-secondary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-7 w-7 text-secondary hover:text-primary rounded-sm ${isLocating ? 'animate-pulse' : ''}`}
              onClick={handleLocateMe}
              title="Mein Standort"
            >
              <Crosshair className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-secondary rounded-full">
            <div className="w-8 h-8 bg-surface rounded-full border border-border overflow-hidden">
               {/* Avatar placeholder */}
               <div className="w-full h-full bg-gradient-to-br from-primary to-accent" />
            </div>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar - Filters & List */}
        <aside className="w-[400px] h-full bg-card border-r border-border flex flex-col z-20 shadow-xl">
          {!selectedJob ? (
            <>
              {/* Filters Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-text">Filter</h2>
                  <Button variant="ghost" size="sm" className="text-primary text-xs h-8">
                    Alle zurücksetzen
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-secondary font-medium">Beruf</label>
                    <select className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text outline-none focus:border-primary">
                      <option>Alle Berufe</option>
                      <option>Mechatroniker</option>
                      <option>Software Engineer</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-secondary font-medium">Entfernung</label>
                      <span className="text-xs text-text font-medium">{distance} km</span>
                    </div>
                    <input 
                      type="range" 
                      className="w-full accent-primary" 
                      min="1" 
                      max="100" 
                      value={distance} 
                      onChange={(e) => setDistance(Number(e.target.value))} 
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-secondary font-medium">Gehalt</label>
                      <span className="text-xs text-text font-medium">3.000 € - 6.000 €</span>
                    </div>
                    <input type="range" className="w-full" min="1" max="100" defaultValue="50" />
                  </div>
                </div>
              </div>

              {/* Job List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="text-xs text-secondary mb-2 font-medium">In dieser Gegend {jobs.length > 0 && `(${jobs.length})`}</div>
                
                {loadingJobs && (
                  <div className="text-center py-10 text-secondary text-sm">Suche nach echten Stellenanzeigen...</div>
                )}
                
                {!loadingJobs && jobs.length === 0 && (
                  <div className="text-center py-10 text-secondary text-sm">Keine Jobs in diesem Umkreis gefunden. (Bitte Standort setzen)</div>
                )}

                {jobs.map((job, idx) => (
                  <div 
                    key={idx}
                    className="bg-surface border border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="font-bold font-sans text-lg tracking-tight text-white/90">{job.company_name}</div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary">
                        <Navigation className="w-4 h-4" />
                      </Button>
                    </div>
                    <h3 className="font-semibold text-text text-base mb-1 line-clamp-1">{job.title}</h3>
                    <div className="text-sm text-secondary flex items-center gap-1 mb-3">
                      <MapPin className="w-3.5 h-3.5" /> {job.location_name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded font-medium">{job.type || "Vollzeit"}</span>
                      {job.distance && <span className="bg-white/5 text-secondary text-xs px-2 py-1 rounded">{Math.round(job.distance)} km</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            // Detail View
            <div className="flex flex-col h-full bg-card">
              <div className="p-4 border-b border-border flex items-center gap-3">
                <button onClick={() => setSelectedJob(null)} className="text-secondary hover:text-text transition-colors flex items-center gap-1 text-sm font-medium">
                  <ChevronLeft className="w-4 h-4" /> Zurück zur Karte
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mb-4">
                     <span className="font-bold text-black font-sans text-xs text-center">{selectedJob.company_name}</span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-text mb-1">{selectedJob.title}</h2>
                  <div className="flex items-center gap-2 text-sm text-secondary mb-6">
                    <span>{selectedJob.company_name}</span>
                    <span>•</span>
                    <span className="bg-green-500/10 text-green-500 px-2 py-0.5 rounded text-xs">{selectedJob.type || 'Vollzeit'}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-surface p-4 rounded-xl border border-border">
                      <div className="text-xs text-secondary mb-1">Gehalt</div>
                      <div className="font-semibold text-text">{selectedJob.salary_min ? `${selectedJob.salary_min} - ${selectedJob.salary_max}` : 'Keine Angabe'}</div>
                    </div>
                    <div className="bg-surface p-4 rounded-xl border border-border">
                      <div className="text-xs text-secondary mb-1">Entfernung</div>
                      <div className="font-semibold text-text">{selectedJob.distance ? `${Math.round(selectedJob.distance)} km` : '?'}</div>
                    </div>
                  </div>

                  <h3 className="font-semibold text-text mb-4">Route zum Job</h3>
                  <div className="space-y-3 mb-8">
                    <div 
                      onClick={() => setRouteMode('driving')}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${routeMode === 'driving' ? 'bg-primary/10 border-primary' : 'bg-surface border-border hover:border-primary/50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${routeMode === 'driving' ? 'bg-primary text-white' : 'bg-white/5 text-secondary'}`}><Car className="w-4 h-4" /></div>
                        <div>
                          <div className="text-sm font-medium text-text">Auto</div>
                          <div className="text-xs text-secondary">Schnellste Route</div>
                        </div>
                      </div>
                      <div className="font-semibold text-text">{selectedJob.routes?.driving || '- Min'}</div>
                    </div>
                    
                    <div 
                      onClick={() => setRouteMode('cycling')}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${routeMode === 'cycling' ? 'bg-primary/10 border-primary' : 'bg-surface border-border hover:border-primary/50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${routeMode === 'cycling' ? 'bg-primary text-white' : 'bg-white/5 text-secondary'}`}><Bike className="w-4 h-4" /></div>
                        <div>
                          <div className="text-sm font-medium text-text">Fahrrad</div>
                        </div>
                      </div>
                      <div className="font-semibold text-text">{selectedJob.routes?.cycling || '- Min'}</div>
                    </div>

                    <div 
                      onClick={() => setRouteMode('walking')}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${routeMode === 'walking' ? 'bg-primary/10 border-primary' : 'bg-surface border-border hover:border-primary/50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${routeMode === 'walking' ? 'bg-primary text-white' : 'bg-white/5 text-secondary'}`}><Train className="w-4 h-4" /></div>
                        <div>
                          <div className="text-sm font-medium text-text">Zu Fuß / Nahverkehr</div>
                        </div>
                      </div>
                      <div className="font-semibold text-text">{selectedJob.routes?.walking || '- Min'}</div>
                    </div>
                  </div>

                  <a href={selectedJob.redirect_url || '#'} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 py-6 rounded-xl">
                      <Navigation className="w-4 h-4" /> Job ansehen (Extern)
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Map Area */}
        <div className="flex-1 relative">
          {/* Top floating filters */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-card p-1.5 rounded-full shadow-lg border border-border">
            <Button variant="ghost" className="rounded-full px-4 text-sm bg-surface">Alle Berufe</Button>
            <Button variant="ghost" className="rounded-full px-4 text-sm text-secondary">Gespeicherte Jobs</Button>
            <Button variant="ghost" className="rounded-full px-4 text-sm text-secondary">Pendel-Analyse</Button>
            <Button variant="ghost" className="rounded-full px-4 text-sm text-secondary">Karriere-Radar</Button>
          </div>

          <JobMap 
            initialViewState={{ zoom: 11 }} 
            userLocation={userLocation}
            radiusKm={distance}
            jobs={jobs}
            selectedJob={selectedJob}
            onSelectJob={setSelectedJob}
            routeMode={routeMode}
          />
        </div>
      </div>
    </main>
  );
}
