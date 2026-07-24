"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import MapGL, { NavigationControl, Marker, ViewState, Source, Layer, MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Layers, User, Car, Bike, Bus, Navigation } from "lucide-react";
import { UserLocation, RouteMode, Job } from "../app/map/page";
import { getJobCategory, CategoryInfo } from "@/lib/job-categories";
import { calculateJobAge, JobAgeInfo } from "@/lib/job-age-utils";
import { getCompanyStyle, CompanyStyle } from "@/lib/company-color-utils";
import circle from '@turf/circle';
import Supercluster from 'supercluster';

const MAP_STYLES = {
  streets: "mapbox://styles/mapbox/streets-v12",      // Bunte Karte mit Geschäften
  dark: "mapbox://styles/mapbox/dark-v11",            // Dark Mode
  outdoors: "mapbox://styles/mapbox/outdoors-v12",    // Geländekarte
};

const getCompanyBrand = (name: string) => {
  if (!name) return null;
  const n = name.toLowerCase();
  if (n.includes('netto')) return { text: 'Netto', color: '#FFD100', textCol: 'text-black font-extrabold', font: 'text-[9px]' };
  if (n.includes('deutsche bahn') || n.includes(' db ') || n.startsWith('db ')) return { text: 'DB', color: '#FF0000', textCol: 'text-white' };
  if (n.includes('telekom')) return { text: 'T', color: '#E20074', textCol: 'text-white' };
  if (n.includes('siemens')) return { text: 'SIE', color: '#009999', textCol: 'text-white', font: 'text-[9px]' };
  if (n.includes('bosch')) return { text: 'BOS', color: '#ED0007', textCol: 'text-white', font: 'text-[9px]' };
  if (n.includes('edeka')) return { text: 'EDEKA', color: '#005CA9', textCol: 'text-yellow-400', font: 'text-[7px]' };
  if (n.includes('aldi')) return { text: 'ALDI', color: '#005CA9', textCol: 'text-white', font: 'text-[9px]' };
  if (n.includes('lidl')) return { text: 'Lidl', color: '#0050AA', textCol: 'text-yellow-400', font: 'text-[10px]' };
  if (n.includes('rewe')) return { text: 'REWE', color: '#CC071E', textCol: 'text-white', font: 'text-[9px]' };
  if (n.includes('penny')) return { text: 'PENNY', color: '#C8102E', textCol: 'text-white', font: 'text-[8px]' };
  if (n.includes('kaufland')) return { text: 'K', color: '#E3000F', textCol: 'text-white' };
  if (n.includes('dm-drogerie') || n.includes('dm ')) return { text: 'dm', color: '#003282', textCol: 'text-yellow-400' };
  if (n.includes('rossmann')) return { text: 'R', color: '#E3000F', textCol: 'text-white' };
  if (n.includes('allianz')) return { text: 'Allianz', color: '#003781', textCol: 'text-white', font: 'text-[8px]' };
  if (n.includes('k&s') || n.includes('gersprenz') || n.includes('senioren') || n.includes('pflege')) return { text: 'K&S', color: '#005b82', textCol: 'text-white', font: 'text-[10px]' };
  if (n.includes('diakonie')) return { text: 'Diakonie', color: '#005ca9', textCol: 'text-white', font: 'text-[8px]' };
  if (n.includes('caritas')) return { text: 'Caritas', color: '#E3000F', textCol: 'text-white', font: 'text-[8px]' };
  if (n.includes('dhl') || n.includes('deutsche post') || n.includes('postbote')) return { text: 'DHL', color: '#FFCC00', textCol: 'text-black font-extrabold', font: 'text-[9px]' };
  if (n.includes('volksbank') || n.includes('vr bank')) return { text: 'V', color: '#0061B5', textCol: 'text-orange-500' };
  if (n.includes('sparkasse')) return { text: 'S', color: '#FF0000', textCol: 'text-white' };
  return null;
};

interface JobMapProps {
  initialViewState?: Partial<ViewState>;
  interactive?: boolean;
  userLocation?: UserLocation | null;
  radiusKm?: number;
  jobs?: Job[];
  selectedJob?: Job | null;
  onSelectJob?: (job: Job | null) => void;
  hoveredJobId?: string | null;
  onHoverJob?: (jobId: string | null) => void;
  routeMode?: RouteMode;
  showDemoShowcase?: boolean;
  activeDemoMode?: RouteMode;
  onSearchThisArea?: (lat: number, lng: number) => void;
}

export function JobMap({ 
  initialViewState, 
  interactive = true,
  userLocation,
  radiusKm = 25,
  jobs = [],
  selectedJob,
  onSelectJob,
  hoveredJobId,
  onHoverJob,
  routeMode = 'driving',
  showDemoShowcase = false,
  activeDemoMode,
  onSearchThisArea
}: JobMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [routeData, setRouteData] = useState<GeoJSON.Geometry | null>(null);
  const [internalHoveredJob, setInternalHoveredJob] = useState<Job | null>(null);
  const [mapStyleKey, setMapStyleKey] = useState<'streets' | 'dark' | 'outdoors'>('streets');
  const [showStylePicker, setShowStyleKeyPicker] = useState(false);
  const [showAgeLegend, setShowAgeLegend] = useState(true);
  const [is3DMode, setIs3DMode] = useState(false);
  const [activeLocationPopup, setActiveLocationPopup] = useState<{ lat: number; lng: number; jobs: Job[] } | null>(null);

  const currentHoveredJob = useMemo(() => {
    if (hoveredJobId) {
      return jobs.find(j => j.id === hoveredJobId) || null;
    }
    return internalHoveredJob;
  }, [hoveredJobId, internalHoveredJob, jobs]);

  // Fetch routing data from Mapbox Directions API
  useEffect(() => {
    if (userLocation && selectedJob) {
      const fetchRoute = async () => {
        try {
          const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
          if (!token) return;
          const profile = routeMode === 'transit' ? 'walking' : routeMode;
          const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${userLocation.longitude},${userLocation.latitude};${selectedJob.longitude},${selectedJob.latitude}?geometries=geojson&access_token=${token}`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.routes && data.routes[0]) {
            setRouteData(data.routes[0].geometry);
          }
        } catch (e) {
          console.error("Error fetching route", e);
        }
      };
      fetchRoute();
    } else {
      setRouteData(null);
    }
  }, [userLocation, selectedJob, routeMode]);

  // Track current zoom for clustering purposes
  const [currentZoom, setCurrentZoom] = useState(initialViewState?.zoom || 11);
  const [bounds, setBounds] = useState<[number, number, number, number]>([-180, -85, 180, 85]);

  // Default initial configuration
  const mapInitialViewState = useMemo(() => ({
    longitude: 8.6821,
    latitude: 50.1109,
    zoom: 10,
    pitch: 0,
    bearing: 0,
    ...initialViewState
  }), []);

  // Track the last user location we flew to, to avoid flying back on every hover/re-render
  const lastFlewToLoc = useRef<string>("");

  // Fly to user location whenever it changes (e.g. from search or GPS)
  useEffect(() => {
    if (userLocation && !selectedJob) {
      const locKey = `${userLocation.latitude},${userLocation.longitude},${radiusKm}`;
      if (lastFlewToLoc.current === locKey) return;
      lastFlewToLoc.current = locKey;

      const calculatedZoom = Math.min(16, Math.max(9, 15.5 - Math.log2(radiusKm / 1.5)));
      
      mapRef.current?.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: calculatedZoom,
        pitch: is3DMode ? 20 : 0,
        bearing: 0,
        duration: 1200
      });
    }
  }, [userLocation, radiusKm, selectedJob, is3DMode]);

  // Frame the entire route when a job is selected
  const lastSelectedJobId = useRef<string | null>(null);
  useEffect(() => {
    if (selectedJob && userLocation && mapRef.current) {
      if (selectedJob.id !== lastSelectedJobId.current) {
        lastSelectedJobId.current = selectedJob.id;
        
        // Calculate bounding box that contains both user and job
        const minLng = Math.min(userLocation.longitude, selectedJob.longitude);
        const maxLng = Math.max(userLocation.longitude, selectedJob.longitude);
        const minLat = Math.min(userLocation.latitude, selectedJob.latitude);
        const maxLat = Math.max(userLocation.latitude, selectedJob.latitude);
        
        // Fit map bounds to show the whole route
        mapRef.current.fitBounds(
          [
            [minLng, minLat],
            [maxLng, maxLat]
          ],
          { 
            padding: { top: 100, bottom: 100, left: 350, right: 100 }, // Extra left padding for sidebar
            duration: 1200, 
            pitch: is3DMode ? 20 : 0,
            maxZoom: 15 // Don't zoom in *too* much if they are super close
          }
        );
      }
    } else if (!selectedJob && lastSelectedJobId.current) {
       lastSelectedJobId.current = null;
    }
  }, [selectedJob, userLocation, is3DMode]);

  // Camera transition: Optional 3D tilt ONLY when is3DMode is explicitly enabled by the user
  const prevSelectedJobIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (selectedJob) {
      if (selectedJob.id !== prevSelectedJobIdRef.current) {
        prevSelectedJobIdRef.current = selectedJob.id;
        mapRef.current.flyTo({
          center: [selectedJob.longitude, selectedJob.latitude],
          zoom: 16,
          pitch: is3DMode ? 55 : 0, // 2D flat view by default unless 3D mode is on
          bearing: is3DMode ? -15 : 0,
          duration: 1100
        });
      }
    } else if (prevSelectedJobIdRef.current && !selectedJob) {
      // User clicked away / deselected: return to 2D flat view (pitch: 0)
      prevSelectedJobIdRef.current = null;

      if (mapRef.current) {
        mapRef.current.easeTo({
          pitch: 0,   // Return to normal 2D flat view
          bearing: 0, // Reset bearing to north
          duration: 800
        });
      }
    }
  }, [selectedJob, userLocation, radiusKm, is3DMode]);

  // Make Mapbox POIs / Shops semi-transparent on style load
  const handleMapLoad = () => {
    if (!mapRef.current) return;
    const map = mapRef.current?.getMap();
    try {
      if (map && typeof map.getBounds === 'function') {
        const bounds = map.getBounds();
        if (bounds) {
          const boundsArray = bounds.toArray().flat() as [number, number, number, number];
          setBounds(boundsArray);
        }
        if (map.getLayer('poi-label')) {
          map.setPaintProperty('poi-label', 'icon-opacity', 0.45);
          map.setPaintProperty('poi-label', 'text-opacity', 0.45);
        }
        if (map.getLayer('transit-label')) {
          map.setPaintProperty('transit-label', 'icon-opacity', 0.5);
          map.setPaintProperty('transit-label', 'text-opacity', 0.5);
        }
      }
    } catch (e) {
      console.warn("Could not set POI layer opacity:", e);
    }
  };

  // Generate GeoJSON for radius circle
  const radarCircle = useMemo(() => {
    if (!userLocation) return null;
    try {
      const center = [userLocation.longitude, userLocation.latitude];
      const options = { steps: 64, units: 'kilometers' as const };
      return circle(center, radiusKm, options);
    } catch {
      return null;
    }
  }, [userLocation, radiusKm]);

  // Supercluster setup
  const supercluster = useMemo(() => {
    const sc = new Supercluster({
      radius: 40,
      maxZoom: 20 // Keep same-location building jobs grouped into a single brand badge at all zoom levels
    });

    const points = jobs.map(job => ({
      type: 'Feature' as const,
      properties: { 
        cluster: false, 
        jobId: job.id, 
        job: job,
        point_count: 0
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [job.longitude, job.latitude]
      }
    }));

    sc.load(points);
    return sc;
  }, [jobs]);

  const clusters = useMemo(() => {
    try {
      return supercluster.getClusters(bounds, Math.floor(currentZoom));
    } catch {
      return [];
    }
  }, [supercluster, currentZoom, bounds]);

  // Animation progress for vehicle icons in showcase mode
  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    if (!showDemoShowcase) return;
    let animFrame: number;
    let start = performance.now();
    const duration = 3200; // 3.2 seconds vehicle loop

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = (elapsed % duration) / duration;
      setAnimProgress(progress);
      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [showDemoShowcase]);

  const demoHomeCoord: [number, number] = useMemo(() => [8.6720, 50.1180], []);
  const demoTargets = useMemo(() => [
    { mode: 'driving', name: 'Tech Corp (Siemens)', icon: Car, color: '#3b82f6', target: [8.6250, 50.1450] as [number, number], label: '12 Min • Auto (A66)' },
    { mode: 'transit', name: 'REWE Logistik', icon: Bus, color: '#a855f7', target: [8.7220, 50.1280] as [number, number], label: '18 Min • ÖPNV (S1/S2)' },
    { mode: 'cycling', name: 'Bosch Center', icon: Bike, color: '#f59e0b', target: [8.6320, 50.0890] as [number, number], label: '24 Min • Fahrrad (Radweg)' },
    { mode: 'walking', name: 'Allianz AG', icon: Navigation, color: '#10b981', target: [8.6920, 50.1150] as [number, number], label: '35 Min • Zu Fuß (1,9 km)' },
  ], []);

  const [isLoupeActive, setIsLoupeActive] = useState(false);
  const [loupePoint, setLoupePoint] = useState<{ lat: number; lng: number } | null>(null);

  // Generate Lupe Detector Circle
  const loupeCircle = useMemo(() => {
    if (!loupePoint) return null;
    try {
      const center = [loupePoint.lng, loupePoint.lat];
      const options = { steps: 64, units: 'kilometers' as const };
      return circle(center, Math.min(radiusKm, 15), options);
    } catch {
      return null;
    }
  }, [loupePoint, radiusKm]);

  // Debounced auto-fetch on map drag / pan / zoom
  const mapMoveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMapMove = useCallback((evt: any) => {
    setCurrentZoom(evt.viewState.zoom);
    if (evt.target && typeof evt.target.getBounds === 'function') {
      try {
        const bounds = evt.target.getBounds();
        if (bounds) {
          const boundsArray = bounds.toArray().flat() as [number, number, number, number];
          setBounds(boundsArray);
        }
      } catch (e) {
        console.warn("Could not get bounds:", e);
      }
    }

    // Auto-search new viewport area when user pans/scrolls map
    if (interactive && onSearchThisArea && mapRef.current) {
      if (mapMoveTimerRef.current) clearTimeout(mapMoveTimerRef.current);
      mapMoveTimerRef.current = setTimeout(() => {
        try {
          const center = mapRef.current?.getCenter();
          if (center) {
            onSearchThisArea(center.lat, center.lng);
          }
        } catch (e) {
          console.warn("Auto map move fetch warning:", e);
        }
      }, 650);
    }
  }, [interactive, onSearchThisArea]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-background">
      <MapGL
        ref={mapRef}
        initialViewState={mapInitialViewState}
        onClick={(evt) => {
          if (isLoupeActive) {
            const lng = evt.lngLat.lng;
            const lat = evt.lngLat.lat;
            setLoupePoint({ lat, lng });
            if (onSearchThisArea) {
              onSearchThisArea(lat, lng);
            }
            return;
          }
          if (onSelectJob) {
            onSelectJob(null);
          }
        }}
        onMove={handleMapMove}
        mapStyle={MAP_STYLES[mapStyleKey]}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%", cursor: isLoupeActive ? 'crosshair' : 'default' }}
        minZoom={4}
        maxZoom={18}
        interactive={interactive}
        onLoad={handleMapLoad}
      >
        {interactive && <NavigationControl position="bottom-right" />}

        {/* Floating Lupe / Detector Tool Toggle Button */}
        {interactive && onSearchThisArea && (
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 items-start">
            <button
              onClick={() => setIsLoupeActive(!isLoupeActive)}
              className={`px-4 py-2 rounded-xl shadow-2xl text-xs font-black flex items-center gap-2 transition-all border active:scale-95 cursor-pointer backdrop-blur-md ${isLoupeActive ? 'bg-purple-600 text-white border-purple-400 ring-4 ring-purple-500/40 shadow-purple-600/30' : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-blue-400'}`}
            >
              <span className="text-sm">🔎</span>
              <span>{isLoupeActive ? 'Lupe-Detektor AKTIV 🎯' : 'Lupe / Bereichs-Detektor'}</span>
            </button>

            {isLoupeActive && (
              <div className="bg-purple-950/90 backdrop-blur-md border border-purple-500/50 text-purple-200 px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-2xl animate-in fade-in flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span>Tippe eine beliebige Stelle auf der Karte an, um dort nach Stellen zu suchen!</span>
              </div>
            )}
          </div>
        )}

        {/* Map Style & Optional 3D Selector Buttons */}
        {interactive && (
          <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
            <button 
              onClick={() => {
                const next3D = !is3DMode;
                setIs3DMode(next3D);
                mapRef.current?.easeTo({
                  pitch: next3D ? 55 : 0,
                  bearing: next3D ? -15 : 0,
                  duration: 800
                });
              }}
              className={`backdrop-blur-md border px-3 py-2 rounded-xl shadow-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${is3DMode ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/50' : 'bg-card/90 border-border text-foreground hover:bg-card'}`}
              title="Optional 3D-Kartenperspektive umschalten"
            >
              <span>{is3DMode ? '🧊 3D An' : '🗺️ 2D Flach'}</span>
            </button>

            <div className="flex flex-col items-end">
              <button 
                onClick={() => setShowStyleKeyPicker(!showStylePicker)}
                className="bg-card/90 backdrop-blur-md border border-border text-foreground hover:bg-card px-3 py-2 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                title="Kartenstil wählen"
              >
                <Layers className="w-4 h-4 text-primary" />
                <span>Karte: {mapStyleKey === 'streets' ? 'Bunt' : mapStyleKey === 'dark' ? 'Dunkel' : 'Gelände'}</span>
              </button>

              {showStylePicker && (
                <div className="mt-2 bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl p-2 flex flex-col gap-1 w-36 text-xs animate-in fade-in slide-in-from-top-2">
                  <button 
                    onClick={() => { setMapStyleKey('streets'); setShowStyleKeyPicker(false); }}
                    className={`px-3 py-1.5 rounded-lg text-left font-medium transition-colors ${mapStyleKey === 'streets' ? 'bg-primary text-white font-bold' : 'hover:bg-surface text-foreground'}`}
                  >
                    🎨 Bunt (Geschäfte)
                  </button>
                  <button 
                    onClick={() => { setMapStyleKey('dark'); setShowStyleKeyPicker(false); }}
                    className={`px-3 py-1.5 rounded-lg text-left font-medium transition-colors ${mapStyleKey === 'dark' ? 'bg-primary text-white font-bold' : 'hover:bg-surface text-foreground'}`}
                  >
                    🌙 Dark Mode
                  </button>
                  <button 
                    onClick={() => { setMapStyleKey('outdoors'); setShowStyleKeyPicker(false); }}
                    className={`px-3 py-1.5 rounded-lg text-left font-medium transition-colors ${mapStyleKey === 'outdoors' ? 'bg-primary text-white font-bold' : 'hover:bg-surface text-foreground'}`}
                  >
                    🌲 Gelände
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Radar Circle */}
        {radarCircle && (
          <Source id="radar" type="geojson" data={radarCircle}>
            <Layer
              id="radar-fill"
              type="fill"
              paint={{
                'fill-color': '#3b82f6',
                'fill-opacity': 0.08
              }}
            />
            <Layer
              id="radar-line"
              type="line"
              paint={{
                'line-color': '#3b82f6',
                'line-width': 2,
                'line-opacity': 0.6,
                'line-dasharray': [2, 2]
              }}
            />
          </Source>
        )}

        {/* Animated Lupe Detector Circle (Lupe / Detektor Tool) */}
        {loupeCircle && (
          <Source id="loupe-detector" type="geojson" data={loupeCircle}>
            <Layer
              id="loupe-fill"
              type="fill"
              paint={{
                'fill-color': '#a855f7',
                'fill-opacity': 0.18
              }}
            />
            <Layer
              id="loupe-line"
              type="line"
              paint={{
                'line-color': '#c084fc',
                'line-width': 3,
                'line-opacity': 0.9,
                'line-dasharray': [2, 2]
              }}
            />
          </Source>
        )}

        {loupePoint && (
          <Marker longitude={loupePoint.lng} latitude={loupePoint.lat}>
            <div className="relative flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
              <div className="w-16 h-16 rounded-full border-2 border-purple-400 bg-purple-500/20 animate-ping absolute" />
              <div className="px-3 py-1.5 rounded-full bg-purple-600 border-2 border-white text-white font-black text-xs shadow-2xl flex items-center gap-1.5 backdrop-blur-md">
                <span className="text-sm">🔎</span>
                <span>Job-Detektor</span>
              </div>
            </div>
          </Marker>
        )}

        {/* Showcase Demo Routes & Animated Vehicles */}
        {showDemoShowcase && (
          <>
            {/* Origin Home Marker */}
            <Marker longitude={demoHomeCoord[0]} latitude={demoHomeCoord[1]}>
              <div className="relative flex items-center justify-center group pointer-events-none z-30">
                <div className="absolute w-12 h-12 bg-blue-500/30 rounded-full animate-ping" />
                <div className="px-3.5 py-1.5 rounded-full bg-blue-600 border-2 border-white text-white font-black text-xs shadow-2xl flex items-center gap-1.5">
                  <span>🏠 Mein Zuhause</span>
                </div>
              </div>
            </Marker>

            {/* Glowing Demo Route Lines */}
            {demoTargets.map((t, idx) => {
              return (
                <Source key={`demo-src-${idx}`} type="geojson" data={{
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: [demoHomeCoord, t.target]
                  }
                }}>
                  <Layer
                    id={`demo-line-casing-${idx}`}
                    type="line"
                    paint={{
                      'line-color': '#000000',
                      'line-width': 8,
                      'line-opacity': 0.45
                    }}
                  />
                  <Layer
                    id={`demo-line-${idx}`}
                    type="line"
                    paint={{
                      'line-color': t.color,
                      'line-width': 5,
                      'line-opacity': 0.95,
                      'line-dasharray': t.mode === 'walking' ? [2, 1] : [1, 0]
                    }}
                  />
                </Source>
              );
            })}

            {/* Target Destination Badges */}
            {demoTargets.map((t, idx) => {
              return (
                <Marker key={`target-badge-${idx}`} longitude={t.target[0]} latitude={t.target[1]}>
                  <div className="flex flex-col items-center pointer-events-none transition-all duration-300 scale-110 opacity-100 z-30">
                    <div 
                      className="px-3.5 py-2 rounded-2xl border-2 border-white text-white shadow-2xl text-xs font-extrabold flex flex-col items-center text-center backdrop-blur-md"
                      style={{ backgroundColor: t.color }}
                    >
                      <span className="font-black text-white">{t.name}</span>
                      <span className="text-[10px] text-white/90 font-semibold">{t.label}</span>
                    </div>
                  </div>
                </Marker>
              );
            })}

            {/* Moving Animated Vehicle / Traveler Markers */}
            {demoTargets.map((t, idx) => {
              const curLng = demoHomeCoord[0] + (t.target[0] - demoHomeCoord[0]) * animProgress;
              const curLat = demoHomeCoord[1] + (t.target[1] - demoHomeCoord[1]) * animProgress;
              const IconComp = t.icon;

              return (
                <Marker key={`vehicle-${idx}`} longitude={curLng} latitude={curLat}>
                  <div className="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40">
                    <div className="absolute w-12 h-12 rounded-full animate-ping opacity-75" style={{ backgroundColor: `${t.color}60` }} />
                    <div 
                      className="px-3 py-1.5 rounded-full border-2 border-white text-white font-black text-xs shadow-2xl flex items-center gap-1.5 animate-bounce backdrop-blur-md"
                      style={{ backgroundColor: t.color }}
                    >
                      <IconComp className="w-4 h-4 text-white" />
                      <span className="text-xs font-extrabold">{t.label.split('•')[0].trim()}</span>
                    </div>
                  </div>
                </Marker>
              );
            })}
          </>
        )}

        {/* Active Route Line for Selected Job */}
        {selectedJob && userLocation && !showDemoShowcase && (
          <Source id="active-selected-route" type="geojson" data={{
            type: 'Feature',
            properties: {},
            geometry: routeData || {
              type: 'LineString',
              coordinates: [
                [userLocation.longitude, userLocation.latitude],
                [selectedJob.longitude, selectedJob.latitude]
              ]
            }
          }}>
            <Layer
              id="active-route-casing"
              type="line"
              paint={{
                'line-color': '#000000',
                'line-width': 8,
                'line-opacity': 0.35
              }}
            />
            <Layer
              id="active-route-line"
              type="line"
              paint={{
                'line-color': routeMode === 'driving' ? '#3b82f6' : routeMode === 'cycling' ? '#f59e0b' : routeMode === 'transit' ? '#a855f7' : '#10b981',
                'line-width': 5,
                'line-opacity': 0.95,
                'line-dasharray': routeMode === 'walking' ? [2, 1] : [1, 0]
              }}
            />
          </Source>
        )}

        {/* Moving Vehicle / Distance Indicator on Selected Route */}
        {selectedJob && userLocation && !showDemoShowcase && (
          <Marker 
            longitude={(userLocation.longitude + selectedJob.longitude) / 2} 
            latitude={(userLocation.latitude + selectedJob.latitude) / 2}
          >
            <div className="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40">
              <div className="px-3 py-1.5 rounded-full border-2 border-white text-white font-black text-xs shadow-2xl flex items-center gap-1.5 bg-blue-600 backdrop-blur-md animate-bounce">
                {routeMode === 'driving' && <Car className="w-4 h-4 text-white" />}
                {routeMode === 'transit' && <Bus className="w-4 h-4 text-white" />}
                {routeMode === 'cycling' && <Bike className="w-4 h-4 text-white" />}
                {routeMode === 'walking' && <Navigation className="w-4 h-4 text-white" />}
                <span className="text-[11px] font-extrabold text-white">
                  {selectedJob.distance_text || `${(selectedJob.exact_distance ?? selectedJob.distance ?? 1).toFixed(1)} km`}
                </span>
              </div>
            </div>
          </Marker>
        )}

        {/* User Location Pin */}
        {userLocation && (
          <Marker longitude={userLocation.longitude} latitude={userLocation.latitude}>
            <div className="relative flex items-center justify-center cursor-pointer group" title="Mein Standort">
              <div className="absolute w-12 h-12 bg-blue-500/30 rounded-full animate-ping" />
              <div className="w-8 h-8 bg-blue-600 rounded-full border-2 border-white shadow-2xl flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </Marker>
        )}

        {/* Job Clusters and Markers */}
        {clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count: pointCount, jobId, job } = cluster.properties;

          if (isCluster) {
            // Check if hoveredJobId is inside this cluster
            let isHoveredCluster = false;
            let clusterLeaves: any[] = [];
            try {
              clusterLeaves = supercluster.getLeaves(cluster.id as number, Infinity);
              if (hoveredJobId) {
                isHoveredCluster = clusterLeaves.some(leaf => leaf.properties?.jobId === hoveredJobId);
              }
            } catch {
              clusterLeaves = [];
            }

            // Clean company name helper
            const cleanCoName = (str: string = '') => str.toLowerCase().replace(/(gmbh|ag|se|co\.|kg|stiftung|e\.v\.|ltd|& co|deutschland|betrieb|niederlassung|ggmbh)/gi, '').replace(/[^a-z0-9]/gi, '').trim();

            // Check if all jobs in cluster belong to the same company
            const firstJob = clusterLeaves[0]?.properties?.job;
            const firstCompany = firstJob?.company_name || '';
            const firstClean = cleanCoName(firstCompany);
            
            const isSameCompany = firstClean.length >= 3 && clusterLeaves.every(leaf => {
              const leafClean = cleanCoName(leaf.properties?.job?.company_name || '');
              return leafClean.includes(firstClean) || firstClean.includes(leafClean);
            });

            const brand = (isSameCompany || firstCompany) ? getCompanyBrand(firstCompany) : null;
            
            // Extract top unique categories / brands inside this multi-company cluster
            const brandList: any[] = [];
            const catList: CategoryInfo[] = [];

            for (const leaf of clusterLeaves) {
              const j = leaf.properties?.job;
              if (j) {
                const b = getCompanyBrand(j.company_name);
                if (b && !brandList.some(x => x.text === b.text)) brandList.push(b);
                const c = getJobCategory(j.title, j.company_name, j.beruf);
                if (c && !catList.some(x => x.id === c.id)) catList.push(c);
              }
            }

            const uniqueBrands = brandList.slice(0, 2);
            const uniqueCats = catList.slice(0, 3);

            return (
              <Marker
                key={`cluster-${cluster.id}`}
                longitude={longitude}
                latitude={latitude}
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  const clusterJobs = clusterLeaves.map(leaf => leaf.properties?.job).filter(Boolean);
                  if (clusterJobs.length > 1 && currentZoom >= 14) {
                    setActiveLocationPopup({ lat: latitude, lng: longitude, jobs: clusterJobs });
                  } else if (clusterJobs.length > 1) {
                    const expansionZoom = Math.min(
                      supercluster.getClusterExpansionZoom(cluster.id as number),
                      18
                    );
                    mapRef.current?.flyTo({
                      center: [longitude, latitude],
                      zoom: expansionZoom,
                      duration: 500
                    });
                  } else if (firstJob && onSelectJob) {
                    onSelectJob(firstJob);
                  }
                }}
                style={{ zIndex: isHoveredCluster ? 100 : 20 }}
              >
                <div 
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-white shadow-2xl backdrop-blur-md cursor-pointer transition-all duration-300 group ${isHoveredCluster ? 'scale-125 z-50 ring-4 ring-blue-400 bg-blue-600' : 'bg-slate-900/95 hover:scale-110'}`}
                  style={{
                    backgroundColor: isHoveredCluster ? '#2563eb' : (isSameCompany && brand ? brand.color : undefined)
                  }}
                  title={isSameCompany ? `${firstCompany} (${pointCount} Stellen)` : `${pointCount} Stellen an diesem Ort`}
                >
                  {isHoveredCluster && (
                    <div className="absolute -inset-1 rounded-full bg-blue-500/50 animate-ping pointer-events-none" />
                  )}

                  {/* Brand / Multi-Category Preview Icons */}
                  {isSameCompany && brand ? (
                    <span className={`font-black tracking-tighter drop-shadow-sm ${brand.font || 'text-[11px]'} ${brand.textCol} bg-black/20 px-1.5 py-0.5 rounded-md`}>
                      {brand.text}
                    </span>
                  ) : uniqueBrands.length > 0 ? (
                    <div className="flex items-center -space-x-1.5">
                      {uniqueBrands.map((b, i) => (
                        <span key={i} className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[9px] border border-white ${b.textCol}`} style={{ backgroundColor: b.color }}>
                          {b.text.slice(0, 2)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center -space-x-1.5">
                      {uniqueCats.map((catItem, i) => {
                        const CatIconComp = catItem.icon;
                        return (
                          <div key={i} className="w-5 h-5 rounded-full flex items-center justify-center text-white border border-white shadow-xs" style={{ backgroundColor: catItem.color }}>
                            <CatIconComp className="w-3 h-3" />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <span className="text-xs font-black text-white whitespace-nowrap">
                    {isSameCompany ? `${pointCount} Stellen` : `${pointCount} Jobs`}
                  </span>
                </div>
              </Marker>
            );
          }

          // Individual Marker
          const isSelected = selectedJob?.id === jobId;
          const isHovered = hoveredJobId === jobId;
          const category = getJobCategory(job.title, job.company_name, job.beruf);
          const brand = getCompanyBrand(job.company_name);
          const companyStyle = getCompanyStyle(job.company_name);
          const ageInfo = calculateJobAge(job.published_date, job.published_days_old);
          const IconComp = category.icon;
          const bgColor = brand ? brand.color : companyStyle.hexColor;

          return (
            <Marker 
              key={`job-${jobId}`} 
              longitude={longitude} 
              latitude={latitude}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                if (onSelectJob) onSelectJob(job);
              }}
              style={{ zIndex: isSelected || isHovered ? 100 : 10 }}
            >
              <div 
                className={`relative transition-all duration-200 cursor-pointer ${isSelected || isHovered ? 'scale-125 z-50' : 'hover:scale-110'}`}
                onMouseEnter={() => {
                  if (onHoverJob) onHoverJob(jobId);
                }}
                onMouseLeave={() => {
                  if (onHoverJob) onHoverJob(null);
                }}
              >
                {/* Glowing ring on hover / selected */}
                {(isSelected || isHovered) && (
                  <div 
                    className="absolute -inset-1.5 rounded-full animate-pulse opacity-75 blur-xs"
                    style={{ backgroundColor: bgColor }}
                  />
                )}

                {/* Job Age Dot Badge (🟢, 🟡, 🟠, 🔴) - Punkt 1 & 3 */}
                <span 
                  className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 z-10 shadow-md ${ageInfo.dotColor} ${ageInfo.category === 'green' ? 'animate-pulse' : ''}`}
                  title={`Stelle veröffentlicht: ${ageInfo.label}`}
                />

                {/* Compact Circular Icon Pin */}
                <div 
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white border-2 border-white shadow-xl transition-transform ${isSelected ? 'ring-4 ring-white/80 scale-110' : ''}`}
                  style={{ backgroundColor: bgColor }}
                  title={`${job.company_name} - ${job.title} (${ageInfo.label})`}
                >
                  {brand ? (
                    <span className={`font-black tracking-tighter drop-shadow-sm ${brand.font || 'text-[11px]'} ${brand.textCol}`}>
                      {brand.text}
                    </span>
                  ) : (
                    <IconComp className="w-4 h-4 drop-shadow-sm" />
                  )}
                </div>

                {/* Glassmorphic Tooltip Card on Map Pin Hover */}
                {isHovered && !isSelected && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-slate-900/95 backdrop-blur-2xl border-2 p-3.5 rounded-2xl shadow-2xl z-[200] animate-in fade-in slide-in-from-bottom-2 pointer-events-none w-64 space-y-2" style={{ borderColor: companyStyle.hexColor }}>
                    {/* Category Pill + Job Age Pill */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md text-white flex items-center gap-1 shadow-sm" style={{ backgroundColor: category.color }}>
                        <IconComp className="w-3 h-3 text-white" />
                        {category.name}
                      </span>
                      
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${ageInfo.badgeBg} ${ageInfo.badgeBorder} ${ageInfo.badgeText}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${ageInfo.dotColor}`} />
                        <span>{ageInfo.label}</span>
                      </span>
                    </div>

                    {/* Title & Company */}
                    <div>
                      <div className="text-xs font-black text-white leading-snug line-clamp-2">{job.title}</div>
                      <div className="text-[11px] font-bold truncate mt-0.5" style={{ color: companyStyle.hexColor }}>{job.company_name}</div>
                    </div>

                    {/* Location Precision & Travel Time */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                      <span className="font-extrabold text-slate-300 flex items-center gap-1">
                        <Car className="w-3 h-3 text-blue-400" />
                        {job.distance_text || `${(job.exact_distance ?? job.distance ?? 1).toFixed(1)} km`}
                      </span>
                      
                      <span className="text-[9px] text-slate-400 font-bold bg-slate-800 px-1.5 py-0.5 rounded">
                        {job.location_precision === 'exact' ? '📍 Exakter Ort' : '📍 Ort ungefähr'}
                      </span>
                    </div>

                    {ageInfo.warningText && (
                      <div className="text-[10px] text-red-400 font-bold bg-red-950/60 p-1 rounded text-center border border-red-500/30">
                        {ageInfo.warningText}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Marker>
          );
        })}

        {/* Seamless Attached Multi-Job / Multi-Company Location Card Popup (Punkt 4, 5, 6 & 7) */}
        {activeLocationPopup && (
          <Marker longitude={activeLocationPopup.lng} latitude={activeLocationPopup.lat}>
            <div className="relative bottom-full left-1/2 -translate-x-1/2 mb-4 bg-slate-900/95 backdrop-blur-2xl border-2 border-blue-500/80 rounded-3xl p-4 shadow-2xl z-[300] w-80 max-h-96 overflow-y-auto animate-in fade-in zoom-in-95 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <span className="text-blue-400">📍</span>
                  <span>{activeLocationPopup.jobs.length} Stellen an diesem Ort</span>
                </span>
                <button
                  onClick={() => setActiveLocationPopup(null)}
                  className="text-slate-400 hover:text-white p-1 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Group jobs by company name */}
              {(() => {
                const groupedMap = new Map<string, { companyName: string; style: CompanyStyle; jobs: Job[] }>();
                for (const j of activeLocationPopup.jobs) {
                  const style = getCompanyStyle(j.company_name);
                  if (groupedMap.has(style.name)) {
                    groupedMap.get(style.name)!.jobs.push(j);
                  } else {
                    groupedMap.set(style.name, { companyName: j.company_name, style, jobs: [j] });
                  }
                }
                const groups = Array.from(groupedMap.values());

                return (
                  <div className="space-y-3">
                    {groups.map((grp, gIdx) => (
                      <div key={gIdx} className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 space-y-2" style={{ borderLeftColor: grp.style.hexColor, borderLeftWidth: '4px' }}>
                        <div className="flex items-center justify-between text-xs font-extrabold text-white">
                          <span className="truncate">{grp.companyName}</span>
                          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-bold">
                            {grp.jobs.length} {grp.jobs.length === 1 ? 'Stelle' : 'Stellen'}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {grp.jobs.map((jobItem) => {
                            const ageInfo = calculateJobAge(jobItem.published_date, jobItem.published_days_old);
                            return (
                              <div
                                key={jobItem.id}
                                onClick={() => {
                                  setActiveLocationPopup(null);
                                  if (onSelectJob) onSelectJob(jobItem);
                                }}
                                className="bg-slate-900/90 hover:bg-blue-950/60 p-2 rounded-xl border border-slate-800 hover:border-blue-500/50 cursor-pointer transition-all flex items-center justify-between text-xs text-slate-200 group"
                              >
                                <div className="truncate max-w-[180px] font-semibold group-hover:text-blue-300">
                                  {jobItem.title}
                                </div>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${ageInfo.badgeBg} ${ageInfo.badgeBorder} ${ageInfo.badgeText}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${ageInfo.dotColor}`} />
                                  <span>{ageInfo.label}</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </Marker>
        )}

        {/* Bottom Right Map Legend Component (Punkt 2) */}
        {interactive && (
          <div className="absolute bottom-6 right-4 sm:bottom-8 sm:right-6 z-30 flex flex-col items-end">
            {showAgeLegend ? (
              <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3 shadow-2xl space-y-2 text-xs text-slate-200 animate-in fade-in slide-in-from-bottom-2 w-48">
                <div className="flex items-center justify-between font-black text-white text-[11px] border-b border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Job-Alter Legende</span>
                  </span>
                  <button
                    onClick={() => setShowAgeLegend(false)}
                    className="text-slate-400 hover:text-white text-[10px] font-bold p-0.5 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-1.5 text-[11px] font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/30 shrink-0" />
                    <span>Unter 7 Tage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 ring-2 ring-yellow-500/30 shrink-0" />
                    <span>7–16 Tage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400 ring-2 ring-orange-500/30 shrink-0" />
                    <span>17–30 Tage</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/40 shrink-0" />
                    <span>Über 30 Tage (Mögl. veraltet)</span>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAgeLegend(true)}
                className="bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl shadow-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <span>🟢 Job-Alter Legende</span>
              </button>
            )}
          </div>
        )}
      </MapGL>
    </div>
  );
}



