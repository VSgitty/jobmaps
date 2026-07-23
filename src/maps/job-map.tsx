"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Map, { NavigationControl, Marker, ViewState, Source, Layer, Popup, MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Navigation, Layers } from "lucide-react";
import { UserLocation, RouteMode, Job } from "../app/map/page";
import { getJobCategory } from "@/lib/job-categories";
import circle from '@turf/circle';

const MAP_STYLES = {
  streets: "mapbox://styles/mapbox/streets-v12",      // Bunte Karte mit Geschäften
  dark: "mapbox://styles/mapbox/dark-v11",            // Dark Mode
  outdoors: "mapbox://styles/mapbox/outdoors-v12",    // Geländekarte
};

interface JobMapProps {
  initialViewState?: Partial<ViewState>;
  interactive?: boolean;
  userLocation?: UserLocation | null;
  radiusKm?: number;
  jobs?: Job[];
  selectedJob?: Job | null;
  onSelectJob?: (job: Job) => void;
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

  const [viewState, setViewState] = useState({
    longitude: 8.6821, // Frankfurt
    latitude: 50.1109,
    zoom: 10,
    ...initialViewState,
  });

  // Fly to user location ONLY on initial mount or location change
  const initialLocRef = useRef(true);
  useEffect(() => {
    if (userLocation && initialLocRef.current) {
      initialLocRef.current = false;
      setViewState(prev => ({
        ...prev,
        longitude: userLocation.longitude,
        latitude: userLocation.latitude,
        zoom: 12.5
      }));
    }
  }, [userLocation]);

  // Fly to selected job CLOSE-UP (zoom 14.8 - street level) without zooming out
  useEffect(() => {
    if (selectedJob) {
      setViewState(prev => ({
        ...prev,
        longitude: selectedJob.longitude,
        latitude: selectedJob.latitude,
        zoom: Math.max(prev.zoom, 14.8)
      }));
    }
  }, [selectedJob]);

  // Make Mapbox POIs / Shops semi-transparent on style load
  const handleMapLoad = () => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    try {
      if (map.getLayer('poi-label')) {
        map.setPaintProperty('poi-label', 'icon-opacity', 0.45);
        map.setPaintProperty('poi-label', 'text-opacity', 0.45);
      }
      if (map.getLayer('transit-label')) {
        map.setPaintProperty('transit-label', 'icon-opacity', 0.5);
        map.setPaintProperty('transit-label', 'text-opacity', 0.5);
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

  return (
    <div className="w-full h-full relative overflow-hidden bg-background">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
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
                <Navigation className="w-4 h-4 text-white" />
              </div>
            </div>
          </Marker>
        )}

        {/* Job Markers (Compact Icon Pins matching Sidebar Categories) */}
        {jobs.map((job) => {
          const isSelected = selectedJob?.id === job.id;
          const isHovered = currentHoveredJob?.id === job.id;
          const category = getJobCategory(job.title, job.company_name, job.beruf);
          const IconComp = category.icon;

          return (
            <Marker 
              key={job.id} 
              longitude={job.longitude} 
              latitude={job.latitude}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                if (onSelectJob) onSelectJob(job);
              }}
              style={{ zIndex: isSelected || isHovered ? 30 : 5 }}
            >
              <div 
                className={`relative transition-all duration-200 cursor-pointer ${isSelected || isHovered ? 'scale-125 z-30' : 'hover:scale-115'}`}
                onMouseEnter={() => {
                  setInternalHoveredJob(job);
                  if (onHoverJob) onHoverJob(job.id);
                }}
                onMouseLeave={() => {
                  setInternalHoveredJob(null);
                  if (onHoverJob) onHoverJob(null);
                }}
              >
                {/* Glowing ring on hover / selected */}
                {(isSelected || isHovered) && (
                  <div 
                    className="absolute -inset-1.5 rounded-full animate-pulse opacity-75 blur-xs"
                    style={{ backgroundColor: category.color }}
                  />
                )}

                {/* Compact Circular Icon Pin */}
                <div 
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white border-2 border-white shadow-xl transition-transform ${isSelected ? 'ring-4 ring-white/80 scale-110' : ''}`}
                  style={{ backgroundColor: category.color }}
                  title={`${job.company_name} - ${job.title}`}
                >
                  <IconComp className="w-4 h-4 drop-shadow-sm" />
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Hover / Selected Popup Card */}
        {currentHoveredJob && (
          <Popup
            longitude={currentHoveredJob.longitude}
            latitude={currentHoveredJob.latitude}
            closeButton={false}
            anchor="bottom"
            offset={20}
          >
            {(() => {
              const cat = getJobCategory(currentHoveredJob.title, currentHoveredJob.company_name, currentHoveredJob.beruf);
              const CatIcon = cat.icon;
              return (
                <div className="p-3 bg-card/95 backdrop-blur-md text-foreground rounded-xl shadow-2xl border border-border max-w-xs text-xs space-y-1 animate-in zoom-in-95">
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="px-2 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-1"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CatIcon className="w-3 h-3" />
                      {cat.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto font-medium">
                      {currentHoveredJob.distance !== undefined ? `${currentHoveredJob.distance} km` : ''}
                    </span>
                  </div>
                  <div className="font-bold text-foreground text-sm leading-tight line-clamp-2">
                    {currentHoveredJob.title}
                  </div>
                  <div className="text-muted-foreground font-semibold text-xs truncate">
                    {currentHoveredJob.company_name}
                  </div>
                </div>
              );
            })()}
          </Popup>
        )}
      </Map>
    </div>
  );
}



