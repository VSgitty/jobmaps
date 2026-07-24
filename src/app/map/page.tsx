'use client';

import { JobMap } from '@/maps/job-map';
import { Search, MapPin, Navigation, Car, Bike, Train, ChevronLeft, ExternalLink, Briefcase, Filter, CheckCircle2, Building2, Users, Award, Sparkles, Clock, X, Image as ImageIcon, User, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getJobCategory } from '@/lib/job-categories';
import { calculateJobAge } from '@/lib/job-age-utils';
import { getCompanyStyle } from '@/lib/company-color-utils';

// Type definitions for our jobs and routing
export type RouteMode = 'driving' | 'walking' | 'cycling' | 'transit';
export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface JobSource {
  name: string;
  url: string;
  isPrimary?: boolean;
}

export interface CommuteTimes {
  driving: number;
  transit: number;
  cycling: number;
  walking: number;
}

export interface CommuteCost {
  drivingMonthly: number;
  transitMonthly: number;
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
  sources?: JobSource[];
  published_date?: string;
  published_days_old?: number;
  location_precision?: 'exact' | 'approximate';
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
    transit?: string;
  };
  commute_times?: CommuteTimes;
  commute_cost?: CommuteCost;
  fit_score?: number;
  fit_reasons?: string[];
  homeoffice_option?: 'Remote' | 'Hybrid' | 'Vor Ort';
  employer_id?: string;
}

export interface GroupedEmployer {
  id: string;
  name: string;
  location_name: string;
  latitude: number;
  longitude: number;
  rating?: string;
  industry?: string;
  company_size?: string;
  minCommuteMins: number;
  jobs: Job[];
}

function getSalaryEstimate(title: string = '', type: string = ''): string {
  const t = title.toLowerCase();
  if (t.match(/software|developer|it|engineer|fullstack|cloud/)) {
    return '💶 55.000 € - 82.000 € / Jahr';
  }
  if (t.match(/pflege|arzt|medizin|mfa|krankenschwester/)) {
    return '💶 38.000 € - 52.000 € / Jahr';
  }
  if (t.match(/verkäufer|verkaeufer|filiale|kassierer|retail|supermarkt|einzelhandel|markt/)) {
    return type.includes('Teilzeit') || type.includes('Minijob') ? '💶 14,50 € - 18,00 € / Std.' : '💶 28.000 € - 38.000 € / Jahr';
  }
  if (t.match(/mechatroniker|monteur|elektroniker|mechaniker|handwerk/)) {
    return '💶 36.000 € - 48.000 € / Jahr';
  }
  if (t.match(/logistik|fahrer|lager|zusteller|postbote/)) {
    return '💶 26.000 € - 34.000 € / Jahr';
  }
  return '💶 Attraktives Gehalt nach Tarif';
}

function MapViewContent() {
  const searchParams = useSearchParams();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Record<string, unknown>[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [keywordQuery, setKeywordQuery] = useState('');
  const [jobType, setJobType] = useState('Alle');
  const [homeofficeFilter, setHomeofficeFilter] = useState('Alle');
  const [maxCommuteMins, setMaxCommuteMins] = useState(45);
  const [distance, setDistance] = useState(25);
  const [isLocating, setIsLocating] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [routeMode, setRouteMode] = useState<RouteMode>('driving');
  const [viewMode, setViewMode] = useState<'jobs' | 'employers'>('jobs');
  const [filterTypeMode, setFilterTypeMode] = useState<'radius' | 'commute'>('radius');
  const [activeMobileTab, setActiveMobileTab] = useState<'map' | 'list'>('map');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertEmail, setAlertEmail] = useState('');
  const [alertSavedSuccess, setAlertSavedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleSaveProfileAndAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const profile = {
      address: userLocation?.address || 'Frankfurt am Main',
      lat: userLocation?.latitude,
      lon: userLocation?.longitude,
      maxCommuteMins,
      routeMode,
      keywordQuery,
      homeofficeFilter,
      jobType,
      email: alertEmail,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('nearjobs_saved_profile', JSON.stringify(profile));
    setAlertSavedSuccess(true);
    setTimeout(() => setAlertSavedSuccess(false), 4000);
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/map?q=${encodeURIComponent(userLocation?.address || '')}&commute=${maxCommuteMins}&mode=${routeMode}&query=${encodeURIComponent(keywordQuery)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Computed filtered jobs based on Radius (Standard) or Pendelzeit & Homeoffice
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Age Filter: Strictly exclude jobs older than 40 days
      const daysOld = job.published_days_old ?? calculateJobAge(job.published_date).daysOld;
      if (daysOld > 40) return false;

      // Distance / Commute Filter
      let passesLocation = true;
      if (filterTypeMode === 'radius') {
        const distKm = job.exact_distance ?? job.distance ?? 0;
        passesLocation = distance >= 195 || distKm <= distance;
      } else {
        const commuteTime = job.commute_times?.[routeMode] ?? Math.round(((job.exact_distance ?? 1) / 40) * 60);
        passesLocation = maxCommuteMins >= 90 || commuteTime <= maxCommuteMins;
      }

      // Homeoffice Filter
      let passesHO = true;
      if (homeofficeFilter === 'Hybrid') {
        passesHO = job.homeoffice_option === 'Hybrid' || job.homeoffice_option === 'Remote';
      } else if (homeofficeFilter === 'Remote') {
        passesHO = job.homeoffice_option === 'Remote';
      } else if (homeofficeFilter === 'Vor Ort') {
        passesHO = job.homeoffice_option === 'Vor Ort';
      }

      return passesLocation && passesHO;
    });
  }, [jobs, filterTypeMode, distance, maxCommuteMins, routeMode, homeofficeFilter]);

  // Grouped Employers calculation for Employer Discovery Mode
  const groupedEmployers = useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      location_name: string;
      latitude: number;
      longitude: number;
      rating?: string;
      industry?: string;
      company_size?: string;
      minCommuteMins: number;
      jobs: Job[];
    }>();

    for (const job of filteredJobs) {
      const empId = job.employer_id || `${job.company_name}-${job.location_name}`;
      const commuteMins = job.commute_times?.[routeMode] ?? 15;
      if (map.has(empId)) {
        const existing = map.get(empId)!;
        existing.jobs.push(job);
        if (commuteMins < existing.minCommuteMins) {
          existing.minCommuteMins = commuteMins;
        }
      } else {
        map.set(empId, {
          id: empId,
          name: job.company_name,
          location_name: job.location_name,
          latitude: job.latitude,
          longitude: job.longitude,
          rating: job.rating,
          industry: job.industry,
          company_size: job.company_size,
          minCommuteMins: commuteMins,
          jobs: [job]
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.minCommuteMins - b.minCommuteMins);
  }, [filteredJobs, routeMode]);

  const handleSearchThisArea = async (lat: number, lng: number) => {
    setLoadingJobs(true);
    try {
      // Ensure userLocation is set if not already present
      if (!userLocation) {
        setUserLocation({ latitude: lat, longitude: lng, address: "Gewählter Standort" });
      }

      const searchOrigin = userLocation || { latitude: lat, longitude: lng };

      const params = new URLSearchParams({
        lat: searchOrigin.latitude.toString(),
        lon: searchOrigin.longitude.toString(),
        radius: distance.toString(),
        query: keywordQuery,
        jobType: jobType
      });
      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const raw = data.jobs || [];
        raw.sort((a: Job, b: Job) => (a.exact_distance ?? a.distance ?? 0) - (b.exact_distance ?? b.distance ?? 0));
        setJobs(raw);
      }
    } catch (err) {
      console.error("Area search error", err);
    }
    setLoadingJobs(false);
  };

  // Load search history on mount
  useEffect(() => {
    const saved = localStorage.getItem('jobmaps_history');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading history", e);
      }
    }
  }, []);

  const saveToHistory = (address: string) => {
    const newHistory = [address, ...searchHistory.filter(h => h !== address)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('jobmaps_history', JSON.stringify(newHistory));
  };

  // Fetch suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?country=DE,AT,CH&types=place,address,postcode&access_token=${token}`);
        const data = await res.json();
        setSuggestions(data.features || []);
      } catch (e) {
        console.error("Error fetching suggestions", e);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle Geolocation auto-detect or manual click
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
            const address = data.features?.[0]?.place_name || "Mein genauer Standort";
            setUserLocation({ latitude, longitude, address });
            setSearchQuery(address);
          } catch {
            setUserLocation({ latitude, longitude, address: "Mein genauer Standort" });
          }
          setIsLocating(false);
        },
        (error) => {
          console.warn("Geolocation error:", error);
          // Only fallback if we don't have a location yet
          setUserLocation(prev => prev || { latitude: 50.1109, longitude: 8.6821, address: 'Frankfurt am Main' });
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    } else {
      setUserLocation(prev => prev || { latitude: 50.1109, longitude: 8.6821, address: 'Frankfurt am Main' });
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

  const handleSelectSuggestion = (feature: Record<string, unknown>) => {
    const [longitude, latitude] = feature.center as [number, number];
    const address = feature.place_name as string;
    setUserLocation({ latitude, longitude, address });
    setSearchQuery(address);
    setSuggestions([]);
    setShowDropdown(false);
    saveToHistory(address);
  };

  const handleSelectHistory = async (address: string) => {
    setSearchQuery(address);
    setShowDropdown(false);
    setIsLocating(true);
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?country=DE,AT,CH&access_token=${token}`);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const feat = data.features[0];
        const [longitude, latitude] = feat.center;
        setUserLocation({ latitude, longitude, address: feat.place_name });
        setSearchQuery(feat.place_name);
      }
    } catch (err) {
      console.error("Geocoding error", err);
    }
    setIsLocating(false);
  };

  // Handle Location Search using Mapbox Geocoder
  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setIsLocating(true);
      setShowDropdown(false);
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?country=DE,AT,CH&access_token=${token}`);
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const feat = data.features[0];
          const [longitude, latitude] = feat.center;
          const address = feat.place_name;
          setUserLocation({ latitude, longitude, address });
          setSearchQuery(address); // Explicitly update input with cleaned address
          saveToHistory(address);
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
    setHomeofficeFilter('Alle');
    setMaxCommuteMins(90);
    setDistance(25);
  };

  return (
    <main className="flex flex-col h-screen w-full bg-background overflow-hidden font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 z-50 shrink-0 gap-4">
        <div className="flex items-center gap-6 flex-1 max-w-[65%]">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight hidden sm:inline">Job Maps</span>
          </Link>
          
          <div className="flex bg-surface rounded-md p-1 border border-border items-center gap-1 relative flex-1 w-full max-w-3xl">
            <Search className="w-4 h-4 text-secondary ml-2 shrink-0" />
            <div className="relative flex-1 w-full">
              <input 
                type="text" 
                placeholder="Ort suchen (Enter)" 
                className="bg-transparent border-none outline-none text-sm text-text px-2 py-1.5 w-full placeholder:text-secondary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              />
              
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary hover:text-text transition-colors p-1"
                  title="Eingabe löschen"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Autocomplete & History Dropdown */}
              {showDropdown && (suggestions.length > 0 || searchHistory.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
                  {suggestions.length > 0 ? (
                    <div className="p-2 space-y-1">
                      <div className="text-[10px] font-bold text-secondary uppercase px-2 py-1">Vorschläge</div>
                      {suggestions.map((feat: any) => (
                        <button
                          key={feat.id}
                          className="w-full text-left px-3 py-2 text-xs text-text hover:bg-surface rounded-lg transition-colors flex items-center gap-2 group"
                          onClick={() => handleSelectSuggestion(feat)}
                        >
                          <MapPin className="w-3 h-3 text-primary" />
                          <span className="truncate">{feat.place_name as string}</span>
                        </button>
                      ))}
                    </div>
                  ) : searchHistory.length > 0 ? (
                    <div className="p-2 space-y-1">
                      <div className="text-[10px] font-bold text-secondary uppercase px-2 py-1">Letzte Suchen</div>
                      {searchHistory.map((address, idx) => (
                        <button
                          key={idx}
                          className="w-full text-left px-3 py-2 text-xs text-text hover:bg-surface rounded-lg transition-colors flex items-center gap-2 group"
                          onClick={() => handleSelectHistory(address)}
                        >
                          <Clock className="w-3 h-3 text-secondary" />
                          <span className="truncate">{address}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
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

      {/* Mobile Top Navigation Switcher Bar */}
      <div className="lg:hidden flex items-center justify-between p-2 bg-card border-b border-border z-50 shrink-0 gap-2">
        <button 
          onClick={() => setActiveMobileTab('map')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeMobileTab === 'map' ? 'bg-primary text-white shadow-md' : 'text-secondary hover:text-text hover:bg-surface'}`}
        >
          <Compass className="w-4 h-4" /> 🗺️ Karte
        </button>
        <button 
          onClick={() => setActiveMobileTab('list')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeMobileTab === 'list' ? 'bg-primary text-white shadow-md' : 'text-secondary hover:text-text hover:bg-surface'}`}
        >
          <Briefcase className="w-4 h-4" /> 📋 Liste ({filteredJobs.length})
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar - Life-First Filters & Jobs / Employer View */}
        <aside className={`w-full lg:w-[560px] xl:w-[620px] lg:max-w-[50vw] h-full bg-card border-r border-border flex flex-col z-20 shadow-2xl shrink-0 ${activeMobileTab === 'list' ? 'flex w-full' : 'hidden lg:flex'}`}>
          {!selectedJob ? (
            <>
              {/* Dashboard Header */}
              <div className="p-4 border-b border-border space-y-3 bg-slate-950/40">
                <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 p-3.5 rounded-2xl border border-blue-500/25 space-y-2 shadow-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-white flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-blue-400" /> Dein persönlicher Arbeitsmarkt
                    </span>
                    <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                      Life-First Analytics
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] pt-1">
                    <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                      <div className="font-extrabold text-blue-400 text-xs">{groupedEmployers.length}</div>
                      <div className="text-slate-400 font-medium">Arbeitgeber</div>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                      <div className="font-extrabold text-emerald-400 text-xs">{filteredJobs.length}</div>
                      <div className="text-slate-400 font-medium">Offene Jobs</div>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                      <div className="font-extrabold text-amber-400 text-xs">
                        {filteredJobs.filter((j: Job) => (j.commute_times?.[routeMode] ?? 99) <= 20).length}
                      </div>
                      <div className="text-slate-400 font-medium">≤ 20 Min.</div>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                      <div className="font-extrabold text-purple-400 text-xs">
                        {filteredJobs.filter((j: Job) => j.homeoffice_option === 'Remote' || j.homeoffice_option === 'Hybrid').length}
                      </div>
                      <div className="text-slate-400 font-medium">Homeoffice</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-blue-500/20 flex items-center justify-between">
                    <button
                      onClick={() => setShowAlertModal(true)}
                      className="w-full bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-200 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <span>💾 Arbeitsmarkt speichern & Job-Alerts</span>
                    </button>
                  </div>
                </div>

                <div className="flex bg-surface rounded-xl p-1 border border-border gap-1">
                  <button
                    onClick={() => setViewMode('jobs')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${viewMode === 'jobs' ? 'bg-primary text-white shadow-sm' : 'text-secondary hover:text-text'}`}
                  >
                    <Briefcase className="w-3.5 h-3.5" /> Jobs ({filteredJobs.length})
                  </button>
                  <button
                    onClick={() => setViewMode('employers')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${viewMode === 'employers' ? 'bg-primary text-white shadow-sm' : 'text-secondary hover:text-text'}`}
                  >
                    <Building2 className="w-3.5 h-3.5" /> Arbeitgeber ({groupedEmployers.length})
                  </button>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-text text-xs">
                      <Filter className="w-3.5 h-3.5 text-primary" /> Pendelzeit, Verkehrsmittel & Filter
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-primary text-xs h-6 px-2">
                      Zurücksetzen
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <div className="relative">
                      <Briefcase className="w-3.5 h-3.5 absolute left-3 top-2.5 text-secondary" />
                      <input 
                        type="text" 
                        placeholder="Beruf, Firma oder Suchbegriff..." 
                        className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-text outline-none focus:border-primary"
                        value={keywordQuery}
                        onChange={(e) => setKeywordQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 bg-surface/60 p-3 rounded-xl border border-border/70">
                    {/* Toggle Button for KM Radius vs Pendelzeit */}
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 gap-1 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setFilterTypeMode('radius')}
                        className={`flex-1 py-1 px-2 rounded-md transition-all cursor-pointer ${filterTypeMode === 'radius' ? 'bg-blue-600 text-white shadow-sm font-extrabold' : 'text-slate-400 hover:text-white'}`}
                      >
                        📏 KM-Radius (Standard)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterTypeMode('commute')}
                        className={`flex-1 py-1 px-2 rounded-md transition-all cursor-pointer ${filterTypeMode === 'commute' ? 'bg-blue-600 text-white shadow-sm font-extrabold' : 'text-slate-400 hover:text-white'}`}
                      >
                        ⏱️ Pendelzeit (Min.)
                      </button>
                    </div>

                    {/* Active Filter Slider: Radius (KM) vs Pendelzeit (Min) */}
                    {filterTypeMode === 'radius' ? (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between items-center text-xs font-medium">
                          <span className="text-secondary flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-blue-400" /> Radius in KM:
                          </span>
                          <span className="text-blue-400 font-extrabold text-xs">
                            {distance >= 195 ? 'Deutschlandweit' : `${distance} km`}
                          </span>
                        </div>
                        <input 
                          type="range" 
                          className="w-full accent-blue-500 h-1.5 bg-surface rounded-lg cursor-pointer" 
                          min="5" 
                          max="200" 
                          step="5"
                          value={distance} 
                          onChange={(e) => setDistance(Number(e.target.value))} 
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                          <span>5 km</span>
                          <span>25 km</span>
                          <span>50 km</span>
                          <span>100 km</span>
                          <span>200 km</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between items-center text-xs font-medium">
                          <span className="text-secondary flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-400" /> Max. Pendelzeit:
                          </span>
                          <span className="text-blue-400 font-extrabold text-xs">
                            {maxCommuteMins >= 90 ? 'Alle Pendelzeiten' : `≤ ${maxCommuteMins} Minuten`}
                          </span>
                        </div>
                        <input 
                          type="range" 
                          className="w-full accent-blue-500 h-1.5 bg-surface rounded-lg cursor-pointer" 
                          min="10" 
                          max="90" 
                          step="5"
                          value={maxCommuteMins} 
                          onChange={(e) => setMaxCommuteMins(Number(e.target.value))} 
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                          <span>10m</span>
                          <span>20m</span>
                          <span>30m</span>
                          <span>45m</span>
                          <span>60m</span>
                          <span>90m+</span>
                        </div>
                      </div>
                    )}

                    {/* Verkehrsmittel Options (Always active so commute times are calculated) */}
                    <div className="grid grid-cols-4 gap-1 pt-1">
                      {[
                        { id: 'driving', label: 'Auto', icon: Car, color: 'text-blue-400' },
                        { id: 'transit', label: 'ÖPNV', icon: Train, color: 'text-purple-400' },
                        { id: 'cycling', label: 'Fahrrad', icon: Bike, color: 'text-amber-400' },
                        { id: 'walking', label: 'Zu Fuß', icon: Navigation, color: 'text-emerald-400' },
                      ].map(mode => {
                        const Icon = mode.icon;
                        const isActive = routeMode === mode.id;
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => setRouteMode(mode.id as RouteMode)}
                            className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${isActive ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm' : 'bg-surface border-border text-secondary hover:border-slate-700'}`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${mode.color}`} />
                            <span>{mode.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-secondary font-medium">Homeoffice / Präsenz</label>
                      <select 
                        className="w-full bg-surface border border-border rounded-lg px-2 py-1 text-xs text-text outline-none focus:border-primary"
                        value={homeofficeFilter}
                        onChange={(e) => setHomeofficeFilter(e.target.value)}
                      >
                        <option value="Alle">Alle Formen</option>
                        <option value="Hybrid">🏠 Hybrid (1-3 Tage)</option>
                        <option value="Remote">💻 100% Remote</option>
                        <option value="Vor Ort">🏢 Vor Ort</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-secondary font-medium">Arbeitszeit</label>
                      <select 
                        className="w-full bg-surface border border-border rounded-lg px-2 py-1 text-xs text-text outline-none focus:border-primary"
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value)}
                      >
                        <option value="Alle">Alle Typen</option>
                        <option value="Vollzeit">Vollzeit</option>
                        <option value="Teilzeit">Teilzeit</option>
                        <option value="Minijob">Minijob</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main List Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-secondary mb-1 font-medium">
                  <span className="flex items-center gap-1 font-semibold text-text">
                    📍 {viewMode === 'jobs' ? `Passende Stellen (${filteredJobs.length})` : `Arbeitgeber in der Nähe (${groupedEmployers.length})`}
                  </span>
                  {loadingJobs && <span className="text-primary animate-pulse font-semibold">Aktualisiere...</span>}
                </div>
                
                {loadingJobs && filteredJobs.length === 0 && (
                  <div className="text-center py-12 text-secondary text-sm space-y-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <div>Berechne deinen persönlichen Arbeitsmarkt...</div>
                  </div>
                )}
                
                {!loadingJobs && filteredJobs.length === 0 && (
                  <div className="text-center py-8 px-5 bg-blue-950/40 rounded-2xl border border-blue-500/30 space-y-3 animate-in fade-in">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
                      <Navigation className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <p className="font-extrabold text-white text-sm">Keine Treffer für deinen Pendelradius</p>
                      <p className="text-xs text-slate-400 mt-1">Erhöhe die maximale Pendelzeit auf 45-60 Minuten, um sofort passende Stellen in deiner Region zu sehen.</p>
                    </div>
                    <Button 
                      onClick={() => {
                        handleResetFilters();
                        setMaxCommuteMins(60);
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 cursor-pointer"
                    >
                      🔄 Pendelzeit-Filter erweitern (60 Min)
                    </Button>
                  </div>
                )}

                {/* VIEW MODE 1: JOBS LIST */}
                {viewMode === 'jobs' && filteredJobs.map((job: Job) => {
                  const cat = getJobCategory(job.title, job.company_name, job.beruf);
                  const companyStyle = getCompanyStyle(job.company_name);
                  const ageInfo = calculateJobAge(job.published_date, job.published_days_old);
                  const CatIcon = cat.icon;
                  const isHovered = hoveredJobId === job.id;
                  const bgImage = job.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80';
                  
                  const distKm = job.exact_distance ?? job.distance ?? 1;
                  const commuteMins = job.commute_times?.[routeMode] ?? Math.round((distKm / 40) * 60);
                  const salaryStr = getSalaryEstimate(job.title, job.type || '');
                  const fitScore = job.fit_score || 95;

                  return (
                    <div 
                      key={job.id}
                      className={`relative rounded-2xl p-4 cursor-pointer transition-all duration-300 shadow-md hover:shadow-2xl overflow-hidden border group ${isHovered ? 'ring-2 ring-primary border-primary bg-slate-900/95 scale-[1.02]' : 'border-slate-800 bg-slate-900/80 hover:border-primary/60 hover:bg-slate-900/90'}`}
                      style={{ borderLeftColor: companyStyle.hexColor, borderLeftWidth: '4px' }}
                      onClick={() => setSelectedJob(job)}
                      onMouseEnter={() => setHoveredJobId(job.id)}
                      onMouseLeave={() => setHoveredJobId(null)}
                    >
                      <div className="absolute inset-0 z-0 pointer-events-none">
                        <img 
                          src={bgImage} 
                          alt={job.company_name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-20"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-950/80" />
                      </div>

                      <div className="relative z-10 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span 
                            className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg text-white flex items-center gap-1.5 shadow-sm"
                            style={{ backgroundColor: cat.color }}
                          >
                            <CatIcon className="w-3.5 h-3.5 text-white" />
                            {cat.name}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {/* Job Age Status Badge (🟢, 🟡, 🟠, 🔴) */}
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 shadow-sm ${ageInfo.badgeBg} ${ageInfo.badgeBorder} ${ageInfo.badgeText}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${ageInfo.dotColor}`} />
                              <span>{ageInfo.label}</span>
                            </span>

                            <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 shadow-sm">
                              🎯 {fitScore}%
                            </span>

                            <span className="text-[11px] font-extrabold text-blue-300 bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1 shadow-sm">
                              {routeMode === 'driving' && <Car className="w-3 h-3 text-blue-400" />}
                              {routeMode === 'transit' && <Train className="w-3 h-3 text-purple-400" />}
                              {routeMode === 'cycling' && <Bike className="w-3 h-3 text-amber-400" />}
                              {routeMode === 'walking' && <Navigation className="w-3 h-3 text-emerald-400" />}
                              <span>{commuteMins} Min</span>
                              <span className="text-slate-500">•</span>
                              <span>{job.distance_text || `${distKm.toFixed(1)} km`}</span>
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-extrabold text-white text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-blue-400 transition-colors">
                            {job.title}
                          </h3>
                          <div className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-2">
                            <span className="font-bold text-slate-200 truncate max-w-[200px]" style={{ color: companyStyle.hexColor }}>{job.company_name}</span>
                            {job.rating && (
                              <span className="text-[10px] text-amber-400 font-extrabold bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/20 flex items-center gap-0.5">
                                ⭐ {job.rating}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                            {salaryStr}
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            {job.homeoffice_option && job.homeoffice_option !== 'Vor Ort' && (
                              <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-500/30">
                                🏠 {job.homeoffice_option}
                              </span>
                            )}
                            <span className="text-[10px] font-bold text-slate-300 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700/60">
                              {job.type || "Vollzeit"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-slate-400 flex items-center justify-between pt-2.5 border-t border-slate-800/80">
                          <div className="flex items-center gap-1 truncate max-w-[220px]">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-blue-400" /> 
                            <span className="truncate font-medium text-slate-300">{job.location_name}</span>
                          </div>

                          {job.sources && job.sources.length > 0 && (
                            <span className="text-[10px] font-bold text-blue-300 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded-full">
                              🔗 {job.sources.length === 1 ? job.sources[0].name : `${job.sources.length} Quellen`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* VIEW MODE 2: EMPLOYERS DISCOVERY MODE */}
                {viewMode === 'employers' && groupedEmployers.map((emp: GroupedEmployer) => {
                  const companyStyle = getCompanyStyle(emp.name);
                  return (
                    <div 
                      key={emp.id}
                      className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/60 rounded-2xl p-4 transition-all duration-300 hover:shadow-xl space-y-3 cursor-pointer group"
                      style={{ borderLeftColor: companyStyle.hexColor, borderLeftWidth: '4px' }}
                      onClick={() => {
                        if (emp.jobs[0]) {
                          setSelectedJob(emp.jobs[0]);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-extrabold text-sm shrink-0 shadow-inner" style={{ color: companyStyle.hexColor }}>
                            {companyStyle.shortLogo}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-white text-base group-hover:text-blue-400 transition-colors">
                              {emp.name}
                            </h3>
                            <p className="text-xs text-slate-400">{emp.industry || 'Unternehmen'}</p>
                          </div>
                        </div>

                        <span className="text-xs font-black bg-blue-500/20 text-blue-300 px-3 py-1 rounded-xl border border-blue-500/30 shrink-0">
                          {emp.jobs.length} {emp.jobs.length === 1 ? 'Stelle' : 'Stellen'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-slate-800">
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-blue-400" /> {emp.location_name}
                        </span>
                        <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                          ⏱️ ab {emp.minCommuteMins} Min. Pendelzeit
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {emp.jobs.slice(0, 4).map((j: Job) => {
                          const ageInfo = calculateJobAge(j.published_date, j.published_days_old);
                          return (
                            <div 
                              key={j.id} 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedJob(j);
                              }}
                              className="bg-slate-950/60 hover:bg-blue-950/40 p-2 rounded-xl border border-slate-800 hover:border-blue-500/40 flex items-center justify-between text-xs text-slate-200 transition-colors cursor-pointer"
                            >
                              <span className="font-semibold truncate max-w-[200px]">{j.title}</span>
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${ageInfo.badgeBg} ${ageInfo.badgeBorder} ${ageInfo.badgeText}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${ageInfo.dotColor}`} />
                                <span>{ageInfo.label}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : selectedJob ? (
            // Detail View
            <div className="flex flex-col h-full bg-card">
              <div className="p-3.5 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur shrink-0">
                <button 
                  onClick={() => setSelectedJob(null)} 
                  className="text-secondary hover:text-text transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
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

                {/* Commute & Route Times Section */}
                {(() => {
                  const distKm = selectedJob.exact_distance ?? selectedJob.distance ?? 1;
                  const drivingTime = selectedJob.routes?.driving || `${Math.max(1, Math.round((distKm / 50) * 60))} Min`;
                  const cyclingTime = selectedJob.routes?.cycling || `${Math.max(1, Math.round((distKm / 15) * 60))} Min`;
                  const walkingTime = selectedJob.routes?.walking || `${Math.max(1, Math.round((distKm / 5) * 60))} Min`;
                  const transitTime = `${Math.max(2, Math.round((distKm / 30) * 60 + 3))} Min`;

                  return (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                          <Navigation className="w-4 h-4 text-primary" /> Pendelzeit & Anfahrt (ab deinem Standort)
                        </h3>
                        <span className="text-[10px] text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">
                          📍 {distKm < 1 ? `${Math.max(10, Math.round(distKm * 1000))} m` : `${distKm.toFixed(1)} km`}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          onClick={() => setRouteMode('driving')}
                          className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${routeMode === 'driving' ? 'bg-primary/20 border-primary text-white shadow-md ring-1 ring-primary' : 'bg-surface border-border text-secondary hover:border-border/80 hover:text-text'}`}
                        >
                          <Car className="w-5 h-5 text-blue-400 mb-1" />
                          <span className="text-xs font-extrabold text-text">{drivingTime}</span>
                          <span className="text-[10px] font-medium opacity-80">Mit Auto</span>
                        </button>

                        <button
                          onClick={() => setRouteMode('transit')}
                          className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${routeMode === 'transit' ? 'bg-primary/20 border-primary text-white shadow-md ring-1 ring-primary' : 'bg-surface border-border text-secondary hover:border-border/80 hover:text-text'}`}
                        >
                          <Train className="w-5 h-5 text-sky-400 mb-1" />
                          <span className="text-xs font-extrabold text-text">{transitTime}</span>
                          <span className="text-[10px] font-medium opacity-80">Mit ÖPNV</span>
                        </button>

                        <button
                          onClick={() => setRouteMode('cycling')}
                          className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${routeMode === 'cycling' ? 'bg-primary/20 border-primary text-white shadow-md ring-1 ring-primary' : 'bg-surface border-border text-secondary hover:border-border/80 hover:text-text'}`}
                        >
                          <Bike className="w-5 h-5 text-indigo-400 mb-1" />
                          <span className="text-xs font-extrabold text-text">{cyclingTime}</span>
                          <span className="text-[10px] font-medium opacity-80">Mit Fahrrad</span>
                        </button>

                        <button
                          onClick={() => setRouteMode('walking')}
                          className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${routeMode === 'walking' ? 'bg-primary/20 border-primary text-white shadow-md ring-1 ring-primary' : 'bg-surface border-border text-secondary hover:border-border/80 hover:text-text'}`}
                        >
                          <Clock className="w-5 h-5 text-emerald-400 mb-1" />
                          <span className="text-xs font-extrabold text-text">{walkingTime}</span>
                          <span className="text-[10px] font-medium opacity-80">Zu Fuß</span>
                        </button>
                      </div>

                      {/* Live Detailed Commute Breakdown Card matching Landing Page Features */}
                      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
                        {routeMode === 'driving' && (
                          <div className="space-y-1.5 animate-in fade-in">
                            <div className="flex items-center justify-between font-bold text-white">
                              <span className="flex items-center gap-1.5 text-blue-400">
                                <Car className="w-4 h-4" /> Auto • Ampel- & Feierabendverkehr-Analyse
                              </span>
                              <span className="text-[10px] bg-blue-500/15 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/20">
                                Realtime
                              </span>
                            </div>
                            <p className="text-slate-300 leading-snug">
                              Echte Fahrtzeit <strong className="text-white">{drivingTime}</strong> ({distKm.toFixed(1)} km) inklusive Hauptstraßen-Ampelphasen und Berufsverkehrs-Prognose ab deiner Haustür.
                            </p>
                            <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400 font-semibold">
                              <span>🚦 Verkehrsfluss: Flüssig</span>
                              <span>•</span>
                              <span>🛣️ Hauptnetz</span>
                            </div>
                          </div>
                        )}

                        {routeMode === 'transit' && (
                          <div className="space-y-1.5 animate-in fade-in">
                            <div className="flex items-center justify-between font-bold text-white">
                              <span className="flex items-center gap-1.5 text-purple-400">
                                <Train className="w-4 h-4" /> ÖPNV • Live-Taktung & Haltestelle
                              </span>
                              <span className="text-[10px] bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20">
                                Bus & Bahn
                              </span>
                            </div>
                            <p className="text-slate-300 leading-snug">
                              Gesamtdauer <strong className="text-white">{transitTime}</strong>. Inklusive <strong className="text-white">3 Min. Fußweg</strong> zur nächsten Haltestelle.
                            </p>
                            <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400 font-semibold">
                              <span>⏱️ Taktung: Alle 10-15 Min.</span>
                              <span>•</span>
                              <span>🚉 1 Umstieg max.</span>
                            </div>
                          </div>
                        )}

                        {routeMode === 'cycling' && (
                          <div className="space-y-1.5 animate-in fade-in">
                            <div className="flex items-center justify-between font-bold text-white">
                              <span className="flex items-center gap-1.5 text-amber-400">
                                <Bike className="w-4 h-4" /> Fahrrad • Sichere & Grüne Radwege
                              </span>
                              <span className="text-[10px] bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/20">
                                CO2-Frei
                              </span>
                            </div>
                            <p className="text-slate-300 leading-snug">
                              Fahrzeit <strong className="text-white">{cyclingTime}</strong> ({distKm.toFixed(1)} km) über <strong className="text-white">85% grüne Radwege</strong> und ruhige Nebenstraßen.
                            </p>
                            <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400 font-semibold">
                              <span>🌳 Grüner Radweg</span>
                              <span>•</span>
                              <span>🔥 Ca. 110 kcal verbrannt</span>
                            </div>
                          </div>
                        )}

                        {routeMode === 'walking' && (
                          <div className="space-y-1.5 animate-in fade-in">
                            <div className="flex items-center justify-between font-bold text-white">
                              <span className="flex items-center gap-1.5 text-emerald-400">
                                <Clock className="w-4 h-4" /> Zu Fuß • Direkt vor deiner Haustür
                              </span>
                              <span className="text-[10px] bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                Nahbereich
                              </span>
                            </div>
                            <p className="text-slate-300 leading-snug">
                              Entspannter Fußweg von <strong className="text-white">{walkingTime}</strong> ({distKm < 1 ? `${Math.max(10, Math.round(distKm * 1000))} Metern` : `${distKm.toFixed(1)} km`}).
                            </p>
                            <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400 font-semibold">
                              <span>🚶 Ca. {Math.round(distKm * 1350)} Schritte</span>
                              <span>•</span>
                              <span>💡 Beleuchteter Gehweg</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

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

                {/* Available Sources & Direct Links */}
                <div className="space-y-2.5 pt-3 border-t border-border">
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4 text-blue-400" /> Verfügbare Quellen & Links ({selectedJob.sources?.length || 1})
                  </h3>
                  <div className="space-y-2">
                    {(selectedJob.sources || [{ name: 'Arbeitsagentur', url: selectedJob.redirect_url || 'https://www.arbeitsagentur.de/jobsuche/', isPrimary: true }]).map((src, i) => (
                      <a
                        key={i}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border hover:border-primary/60 transition-all group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-blue-400 group-hover:animate-ping" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-text group-hover:text-primary transition-colors">
                              {src.name}
                            </span>
                            <span className="text-[10px] text-secondary truncate max-w-[200px]">
                              {src.url}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-primary flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                          Aufrufen <ExternalLink className="w-3 h-3" />
                        </span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Main Apply Button */}
                <div className="pt-4 sticky bottom-0 bg-card py-3 border-t border-border mt-4">
                  <a href={selectedJob.redirect_url || selectedJob.sources?.[0]?.url || '#'} target="_blank" rel="noopener noreferrer" className="block">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 py-5 rounded-xl font-bold shadow-xl text-sm">
                      Jetzt bewerben / Stelle aufrufen <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          ) : null}
        </aside>

        {/* Map Area */}
        <div className={`flex-1 relative ${activeMobileTab === 'map' ? 'flex w-full h-full' : 'hidden lg:flex'}`}>
          {/* Top Center Map Filter Toggle */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-card/90 backdrop-blur-md border border-border p-1.5 rounded-2xl shadow-xl flex gap-1 animate-in fade-in slide-in-from-top-4">
            <button 
              onClick={() => setViewMode('jobs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${viewMode === 'jobs' ? 'bg-primary text-white shadow-md' : 'text-secondary hover:text-text hover:bg-surface'}`}
            >
              Aktuelle Stellen ({filteredJobs.length})
            </button>
            <button 
              onClick={() => setViewMode('employers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${viewMode === 'employers' ? 'bg-emerald-500 text-white shadow-md' : 'text-secondary hover:text-text hover:bg-surface'}`}
            >
              Arbeitgeber ({groupedEmployers.length})
            </button>
          </div>

          <JobMap 
            initialViewState={{ zoom: 11 }} 
            userLocation={userLocation}
            radiusKm={distance}
            jobs={filteredJobs}
            selectedJob={selectedJob}
            onSelectJob={setSelectedJob}
            hoveredJobId={hoveredJobId}
            onHoverJob={setHoveredJobId}
            routeMode={routeMode}
            onSearchThisArea={handleSearchThisArea}
          />

          {/* Floating Mobile Bottom Sheet Bar */}
          <div className="lg:hidden absolute bottom-4 left-4 right-4 z-40 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3 shadow-2xl backdrop-blur-xl space-y-2 animate-in slide-in-from-bottom-3">
            {selectedJob ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    🎯 {selectedJob.fit_score || 95}% Match
                  </span>
                  <button onClick={() => setSelectedJob(null)} className="text-xs text-slate-400 font-bold p-1 cursor-pointer">
                    Schließen ✕
                  </button>
                </div>
                <div className="font-extrabold text-white text-xs truncate">{selectedJob.title}</div>
                <div className="text-[11px] text-slate-300 flex items-center justify-between">
                  <span className="truncate max-w-[180px]">{selectedJob.company_name}</span>
                  <span className="font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                    🚗 {selectedJob.commute_times?.[routeMode] || 15} Min ({selectedJob.distance_text})
                  </span>
                </div>
                <Button 
                  onClick={() => setActiveMobileTab('list')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-xl shadow-md cursor-pointer"
                >
                  Vollständiges Profil öffnen
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
                    📍
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-white">{filteredJobs.length} Jobs in deiner Nähe</div>
                    <div className="text-[10px] text-slate-400">≤ {maxCommuteMins} Min. Pendelzeit</div>
                  </div>
                </div>
                <Button 
                  onClick={() => setActiveMobileTab('list')}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md cursor-pointer shrink-0"
                >
                  Liste anzeigen 📋
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mein Job-Radius Speicher- & Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowAlertModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Deinen Arbeitsmarkt speichern</h3>
                <p className="text-xs text-slate-400">Erhalte automatische Alerts, wenn neue Stellen in deinem Radius entstehen.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Aktuelle Konfiguration:</div>
              <div className="flex flex-wrap gap-2 text-slate-200 font-semibold">
                <span className="bg-blue-500/20 border border-blue-500/30 text-blue-300 px-2.5 py-1 rounded-lg">📍 {userLocation?.address?.split(',')[0] || 'Frankfurt'}</span>
                <span className="bg-purple-500/20 border border-purple-500/30 text-purple-300 px-2.5 py-1 rounded-lg">⏱️ Max. {maxCommuteMins} Min. ({routeMode})</span>
                {keywordQuery && <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-lg">🔎 {keywordQuery}</span>}
              </div>
            </div>

            <form onSubmit={handleSaveProfileAndAlert} className="space-y-3">
              <label className="text-xs font-bold text-slate-300">E-Mail für Benachrichtigungen (optional):</label>
              <input
                type="email"
                placeholder="deine.email@beispiel.de"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
              />

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  {alertSavedSuccess ? '✓ Erster Alert gespeichert!' : 'Speichern & Alert aktivieren'}
                </Button>
                <Button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 px-4 text-xs rounded-xl cursor-pointer"
                >
                  {copiedLink ? '✓ Link kopiert!' : '🔗 Link teilen'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
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

