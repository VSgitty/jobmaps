"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Map, { NavigationControl, Marker, ViewState, Source, Layer, MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Layers, User } from "lucide-react";
import { UserLocation, RouteMode, Job } from "../app/map/page";
import { getJobCategory } from "@/lib/job-categories";
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
  if (n.includes('deutsche bahn') || n === 'db') return { text: 'DB', color: '#FF0000', textCol: 'text-white' };
  if (n.includes('telekom')) return { text: 'T', color: '#E20074', textCol: 'text-white' };
  if (n.includes('siemens')) return { text: 'SIE', color: '#009999', textCol: 'text-white', font: 'text-[9px]' };
  if (n.includes('bosch')) return { text: 'BOS', color: '#ED0007', textCol: 'text-white', font: 'text-[9px]' };
  if (n.includes('edeka')) return { text: 'EDEKA', color: '#005CA9', textCol: 'text-yellow-400', font: 'text-[7px]' };
  if (n.includes('aldi')) return { text: 'ALDI', color: '#005CA9', textCol: 'text-white', font: 'text-[9px]' };
  if (n.includes('lidl')) return { text: 'Lidl', color: '#0050AA', textCol: 'text-yellow-400', font: 'text-[10px]' };
  if (n.includes('rewe')) return { text: 'REWE', color: '#CC071E', textCol: 'text-white', font: 'text-[9px]' };
  if (n.includes('kaufland')) return { text: 'K', color: '#E3000F', textCol: 'text-white' };
  if (n.includes('dm-drogerie') || n === 'dm') return { text: 'dm', color: '#003282', textCol: 'text-yellow-400' };
  if (n.includes('rossmann')) return { text: 'R', color: '#E3000F', textCol: 'text-white' };
  if (n.includes('allianz')) return { text: 'Allianz', color: '#003781', textCol: 'text-white', font: 'text-[8px]' };
  if (n.includes('k&s') || n.includes('senioren')) return { text: 'K&S', color: '#005b82', textCol: 'text-white', font: 'text-[10px]' };
  if (n.includes('diakonie')) return { text: 'Diakonie', color: '#005ca9', textCol: 'text-white', font: 'text-[8px]' };
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
  routeMode = 'driving'
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
      // User clicked away / deselected: smoothly return to 2D flat view (pitch: 0)
      prevSelectedJobIdRef.current = null;

      const targetCenter = userLocation 
        ? [userLocation.longitude, userLocation.latitude] 
        : mapRef.current.getCenter().toArray();

      const targetZoom = userLocation 
        ? Math.min(15, Math.max(9, 15.5 - Math.log2(radiusKm / 1.5)))
        : mapRef.current.getZoom();

      mapRef.current.easeTo({
        center: targetCenter as [number, number],
        zoom: targetZoom,
        pitch: 0,   // Return to normal 2D flat view
        bearing: 0, // Reset bearing to north
        duration: 900
      });
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
      radius: 35, // Reduced from 50 to show more individual markers sooner
      maxZoom: 15 // Clusters will break apart completely at zoom 15
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

        {/* Route Line with distinct transport mode colors & casing */}
        {routeData && (
          <Source id="route" type="geojson" data={{ type: 'Feature', properties: {}, geometry: routeData }}>
            <Layer
              id="route-line-casing"
              type="line"
              paint={{
                'line-color': '#000000',
                'line-width': 8,
                'line-opacity': 0.25
              }}
            />
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': routeMode === 'driving' ? '#10b981' : routeMode === 'cycling' ? '#f59e0b' : '#8b5cf6',
                'line-width': 5,
                'line-opacity': 0.9,
                'line-dasharray': routeMode === 'walking' ? [2, 1] : [1, 0]
              }}
            />
          </Source>
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
              >
                <div 
                  className="flex items-center justify-center bg-primary text-white rounded-full border-2 border-white shadow-xl cursor-pointer hover:scale-110 transition-transform font-bold text-sm"
                  style={{
                    width: `${35 + Math.min(pointCount / jobs.length, 1) * 20}px`,
                    height: `${35 + Math.min(pointCount / jobs.length, 1) * 20}px`,
                  }}
                >
                  {pointCount}
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



