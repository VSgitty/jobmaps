"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Map, { NavigationControl, Marker, ViewState, Source, Layer, MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Layers, User, Car, Bike, Bus, Navigation } from "lucide-react";
import { UserLocation, RouteMode, Job } from "../app/map/page";
import { getJobCategory, CategoryInfo } from "@/lib/job-categories";
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
  activeDemoMode
}: JobMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [routeData, setRouteData] = useState<GeoJSON.Geometry | null>(null);
  const [internalHoveredJob, setInternalHoveredJob] = useState<Job | null>(null);
  const [mapStyleKey, setMapStyleKey] = useState<'streets' | 'dark' | 'outdoors'>('streets');
  const [showStylePicker, setShowStyleKeyPicker] = useState(false);

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
        pitch: 20,
        bearing: 0,
        duration: 1200
      });
    }
  }, [userLocation, radiusKm, selectedJob]);

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
            pitch: 20,
            maxZoom: 15 // Don't zoom in *too* much if they are super close
          }
        );
      }
    } else if (!selectedJob && lastSelectedJobId.current) {
       lastSelectedJobId.current = null;
    }
  }, [selectedJob, userLocation]);

  // Camera transition: 3D tilt (pitch: 55) on selection, reset to 2D flat view (pitch: 0) on deselection
  const prevSelectedJobIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (selectedJob) {
      if (selectedJob.id !== prevSelectedJobIdRef.current) {
        prevSelectedJobIdRef.current = selectedJob.id;
        mapRef.current.flyTo({
          center: [selectedJob.longitude, selectedJob.latitude],
          zoom: 16,
          pitch: 55, // 3D tilt when clicking a job
          bearing: -15, // Subtle 3D perspective
          duration: 1100
        });
      }
    } else if (prevSelectedJobIdRef.current && !selectedJob) {
      // User clicked away / deselected: smoothly return to 2D flat view (pitch: 0) without zooming far away!
      prevSelectedJobIdRef.current = null;

      if (mapRef.current) {
        mapRef.current.easeTo({
          pitch: 0,   // Return to normal 2D flat view
          bearing: 0, // Reset bearing to north
          duration: 800
        });
      }
    }
  }, [selectedJob, userLocation, radiusKm]);

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
      maxZoom: 17 // Clusters will stay intact up to zoom 17 so identical addresses stay clean
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
    { mode: 'driving', name: 'Tech Corp', icon: Car, color: '#3b82f6', target: [8.6530, 50.1290] as [number, number], label: '12 Min • Auto (A66)' },
    { mode: 'transit', name: 'REWE Markt', icon: Bus, color: '#a855f7', target: [8.6940, 50.1060] as [number, number], label: '18 Min • ÖPNV (S1/S2)' },
    { mode: 'cycling', name: 'Bosch Tech', icon: Bike, color: '#f59e0b', target: [8.6510, 50.1120] as [number, number], label: '24 Min • Fahrrad (Radweg)' },
    { mode: 'walking', name: 'Allianz AG', icon: Navigation, color: '#10b981', target: [8.6790, 50.1130] as [number, number], label: '35 Min • Zu Fuß (1,9 km)' },
  ], []);

  return (
    <div className="w-full h-full relative overflow-hidden bg-background">
      <Map
        ref={mapRef}
        initialViewState={mapInitialViewState}
        onClick={() => {
          if (onSelectJob) {
            onSelectJob(null);
          }
        }}
        onMove={(evt) => {
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
        }}
        mapStyle={MAP_STYLES[mapStyleKey]}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
        minZoom={4}
        maxZoom={18}
        interactive={interactive}
        onLoad={handleMapLoad}
      >
        {interactive && <NavigationControl position="bottom-right" />}

        {/* Map Style Selector Button */}
        {interactive && (
          <div className="absolute top-4 right-4 z-20 flex flex-col items-end">
            <button 
              onClick={() => setShowStyleKeyPicker(!showStylePicker)}
              className="bg-card/90 backdrop-blur-md border border-border text-foreground hover:bg-card px-3 py-2 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 transition-all"
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
                  const expansionZoom = Math.min(
                    supercluster.getClusterExpansionZoom(cluster.id as number),
                    18
                  );
                  mapRef.current?.flyTo({
                    center: [longitude, latitude],
                    zoom: expansionZoom,
                    duration: 500
                  });
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
          const IconComp = category.icon;
          const bgColor = brand ? brand.color : category.color;

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

                {/* Compact Circular Icon Pin */}
                <div 
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white border-2 border-white shadow-xl transition-transform ${isSelected ? 'ring-4 ring-white/80 scale-110' : ''}`}
                  style={{ backgroundColor: bgColor }}
                  title={`${job.company_name} - ${job.title}`}
                >
                  {brand ? (
                    <span className={`font-black tracking-tighter drop-shadow-sm ${brand.font || 'text-[11px]'} ${brand.textCol}`}>
                      {brand.text}
                    </span>
                  ) : (
                    <IconComp className="w-4 h-4 drop-shadow-sm" />
                  )}
                </div>

                {/* Info Tooltip on Hover */}
                {isHovered && !isSelected && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-card/95 backdrop-blur-md border border-border px-3 py-2 rounded-xl shadow-2xl whitespace-nowrap z-50 animate-in fade-in slide-in-from-bottom-2 pointer-events-none min-w-[180px]">
                    <div className="text-[10px] font-bold text-primary uppercase tracking-tighter mb-0.5">{category.name}</div>
                    <div className="text-xs font-extrabold text-foreground leading-tight truncate">{job.title}</div>
                    <div className="text-[10px] text-foreground/70 font-medium">{job.company_name}</div>
                  </div>
                )}
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}



