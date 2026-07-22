"use client";

import { useState, useMemo, useEffect } from "react";
import Map, { NavigationControl, Marker, ViewState, Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTheme } from "next-themes";
import { Navigation } from "lucide-react";
import { UserLocation, RouteMode, Job } from "../app/map/page";
import circle from '@turf/circle';

// You can customize the styles
const MAP_STYLES = {
  dark: "mapbox://styles/mapbox/dark-v11",
  light: "mapbox://styles/mapbox/light-v11",
};

interface JobMapProps {
  initialViewState?: Partial<ViewState>;
  interactive?: boolean;
  userLocation?: UserLocation | null;
  radiusKm?: number;
  jobs?: Job[];
  selectedJob?: Job | null;
  onSelectJob?: (job: Job) => void;
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
  routeMode = 'driving'
}: JobMapProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [routeData, setRouteData] = useState<GeoJSON.Geometry | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch routing data from Mapbox Directions API
  useEffect(() => {
    if (userLocation && selectedJob) {
      const fetchRoute = async () => {
        try {
          const profile = routeMode === 'transit' ? 'walking' : routeMode; // Mapbox doesn't do transit out-of-the-box easily, fallback to walking or cycling
          const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${userLocation.longitude},${userLocation.latitude};${selectedJob.longitude},${selectedJob.latitude}?geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;
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

  const mapStyle = useMemo(() => {
    if (!mounted) return MAP_STYLES.dark; // default to dark
    return theme === "light" ? MAP_STYLES.light : MAP_STYLES.dark;
  }, [theme, mounted]);

  const [viewState, setViewState] = useState({
    longitude: 8.6821, // Frankfurt
    latitude: 50.1109,
    zoom: 9,
    ...initialViewState,
  });

  // Auto-fly to user location when it changes
  useEffect(() => {
    if (userLocation) {
      setViewState(prev => ({
        ...prev,
        longitude: userLocation.longitude,
        latitude: userLocation.latitude,
        zoom: 10
      }));
    }
  }, [userLocation]);

  // Generate GeoJSON for radius circle
  const radarCircle = useMemo(() => {
    if (!userLocation) return null;
    const center = [userLocation.longitude, userLocation.latitude];
    const options = { steps: 64, units: 'kilometers' as const };
    const circleData = circle(center, radiusKm, options);
    return circleData;
  }, [userLocation, radiusKm]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-background">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle={mapStyle}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
        minZoom={4}
        maxZoom={18}
        interactive={interactive}
      >
        {interactive && <NavigationControl position="bottom-right" />}

        {/* Radar Circle */}
        {radarCircle && (
          <Source id="radar" type="geojson" data={radarCircle}>
            <Layer
              id="radar-fill"
              type="fill"
              paint={{
                'fill-color': theme === 'light' ? '#3b82f6' : '#3b82f6',
                'fill-opacity': 0.1
              }}
            />
            <Layer
              id="radar-line"
              type="line"
              paint={{
                'line-color': '#3b82f6',
                'line-width': 2,
                'line-opacity': 0.5,
                'line-dasharray': [2, 2]
              }}
            />
          </Source>
        )}

        {/* Route Line */}
        {routeData && (
          <Source id="route" type="geojson" data={{ type: 'Feature', properties: {}, geometry: routeData }}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': '#10b981',
                'line-width': 4,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}

        {/* User Location */}
        {userLocation && (
          <Marker longitude={userLocation.longitude} latitude={userLocation.latitude}>
            <div className="relative flex items-center justify-center">
              <div className="absolute w-12 h-12 bg-blue-500/30 rounded-full animate-ping" />
              <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <Navigation className="w-3 h-3 text-white" />
              </div>
            </div>
          </Marker>
        )}

        {/* Job Markers */}
        {jobs.map((job) => {
          const isSelected = selectedJob?.id === job.id;
          return (
            <Marker 
              key={job.id} 
              longitude={job.longitude} 
              latitude={job.latitude}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                if (onSelectJob) onSelectJob(job);
              }}
              style={{ zIndex: isSelected ? 10 : 1 }}
            >
              <div className={`transition-all duration-300 cursor-pointer ${isSelected ? 'scale-125' : 'hover:scale-110'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg text-white font-bold text-xs ${isSelected ? 'bg-primary border-2 border-white' : 'bg-primary/80'}`}>
                  {job.company_name.charAt(0)}
                </div>
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}

