import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useProject } from './ProjectContext';
import { convertToWGS84 } from '../../lib/epsgDefs';
import { Layers, Map, Settings2 } from 'lucide-react';

const createTriangleIcon = (name: string) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="position: relative; display: flex; align-items: center; justify-content: center;">
           <svg width="24" height="24" viewBox="0 0 24 24" style="filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.5));">
             <polygon points="12,2 22,20 2,20" fill="#ef4444" stroke="#000" stroke-width="2"/>
           </svg>
           <div style="position: absolute; top: 24px; left: 50%; transform: translateX(-50%); color: white; font-weight: bold; font-size: 12px; text-shadow: 1px 1px 2px black; white-space: nowrap;">${name}</div>
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const createTempStationIcon = (name: string) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="position: relative; display: flex; align-items: center; justify-content: center;">
           <svg width="20" height="20" viewBox="0 0 20 20" style="filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.5));">
             <circle cx="10" cy="10" r="8" fill="none" stroke="#eab308" stroke-width="2"/>
             <line x1="10" y1="0" x2="10" y2="20" stroke="#eab308" stroke-width="1"/>
             <line x1="0" y1="10" x2="20" y2="10" stroke="#eab308" stroke-width="1"/>
             <circle cx="10" cy="10" r="3" fill="#eab308" />
           </svg>
           <div style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); color: white; font-weight: bold; font-size: 12px; text-shadow: 1px 1px 2px black; white-space: nowrap;">${name}</div>
         </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const createCircleIcon = (name: string) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="position: relative; display: flex; align-items: center; justify-content: center;">
           <svg width="16" height="16" viewBox="0 0 16 16" style="filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.5));">
             <circle cx="8" cy="8" r="6" fill="#3b82f6" stroke="#000" stroke-width="2"/>
           </svg>
           <div style="position: absolute; top: 16px; left: 50%; transform: translateX(-50%); color: white; font-weight: bold; font-size: 12px; text-shadow: 1px 1px 2px black; white-space: nowrap;">${name}</div>
         </div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

export default function LayoutModule() {
  const { points, lines, epsg } = useProject();
  const [mapPoints, setMapPoints] = useState<{ id: string, name: string, lat: number, lng: number, source: string, type?: string, isControl?: boolean }[]>([]);
  const [showSatellite, setShowSatellite] = useState(false);
  const [zoomTrigger, setZoomTrigger] = useState(0);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const pointsLayerRef = useRef<L.LayerGroup | null>(null);
  const linesLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    const converted = points.map(p => {
      const [lng, lat] = convertToWGS84(p.x, p.y, epsg);
      return { ...p, lat, lng };
    }).filter(p => !isNaN(p.lat) && !isNaN(p.lng) && p.lat !== 0 && p.lng !== 0);
    
    setMapPoints(converted);
  }, [points, epsg]);

  const positions = mapPoints.map(p => [p.lat, p.lng] as [number, number]);

  // Handle Zoom extents action
  const handleZoomExtents = () => {
    if (mapRef.current && positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
    }
  };

  // Clean up Leaflet Map instance on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync Leaflet layers
  useEffect(() => {
    if (!mapContainerRef.current || mapPoints.length === 0) return;

    // Initialize Map
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: positions[0] || [21.0285, 105.8542],
        zoom: 13,
      });
    }

    const map = mapRef.current;

    // 1. Tile layer style update
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const tileUrl = showSatellite 
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
      : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    
    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // 2. Lines layer update
    if (linesLayerRef.current) {
      map.removeLayer(linesLayerRef.current);
    }
    linesLayerRef.current = L.layerGroup().addTo(map);
    const linesGroup = linesLayerRef.current;

    lines.forEach(line => {
      const startPoint = mapPoints.find(p => p.id === line.startPointId);
      const endPoint = mapPoints.find(p => p.id === line.endPointId);
      if (!startPoint || !endPoint) return;

      const pos: [number, number][] = [[startPoint.lat, startPoint.lng], [endPoint.lat, endPoint.lng]];

      if (line.type === 'baseline') {
        L.polyline(pos, { color: '#000', weight: 6 }).addTo(linesGroup);
        L.polyline(pos, { color: '#eab308', weight: 2 }).addTo(linesGroup);
      } else if (line.type === 'traverse') {
        L.polyline(pos, { color: '#3b82f6', weight: 2, dashArray: "5, 5" }).addTo(linesGroup);
      } else {
        L.polyline(pos, { color: '#888', weight: 2 }).addTo(linesGroup);
      }
    });

    // 3. Points layer update
    if (pointsLayerRef.current) {
      map.removeLayer(pointsLayerRef.current);
    }
    pointsLayerRef.current = L.layerGroup().addTo(map);
    const pointsGroup = pointsLayerRef.current;

    mapPoints.forEach(p => {
      let icon;
      if (p.isControl) {
        icon = createTriangleIcon(p.name);
      } else if (p.source === 'Computed' || p.type === 'computed') {
        icon = createCircleIcon(p.name);
      } else {
        icon = createTempStationIcon(p.name);
      }

      const marker = L.marker([p.lat, p.lng], { icon }).addTo(pointsGroup);
      marker.bindPopup(`
        <div style="font-family: monospace; font-size: 12px; color: #141414; line-height: 1.4; padding: 4px;">
          <strong>${p.name}</strong><br/>
          Type: ${p.isControl ? 'Control Point' : (p.type === 'known' ? 'Temporary Station' : 'Computed Point')}<br/>
          Source: ${p.source}<br/>
          Lat: ${p.lat.toFixed(6)}<br/>
          Lng: ${p.lng.toFixed(6)}
        </div>
      `);
    });

    // Auto fit boundary of all elements
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
    }

    // Adjust leaflet size
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, [mapPoints, lines, showSatellite]);

  // Hook zoom extents button trigger to function
  useEffect(() => {
    if (zoomTrigger > 0) {
      handleZoomExtents();
    }
  }, [zoomTrigger]);

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="bg-[#222] border-2 border-[#141414] p-4 rounded-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-white shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
        <div>
          <h3 className="text-xs uppercase text-yellow-400 font-bold tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4" /> VIP Pro Layout Map
          </h3>
          <p className="text-[10px] text-gray-300 mt-1">
            Displaying {mapPoints.length} points converted from {epsg} to EPSG:4326
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-gray-300 uppercase tracking-wider font-bold">Map Style</label>
            <select 
              value={showSatellite ? 'satellite' : 'dark'} 
              onChange={e => setShowSatellite(e.target.value === 'satellite')}
              className="bg-[#111] border-2 border-[#141414] text-xs text-white px-2.5 py-1 focus:outline-none focus:border-yellow-400 rounded-sm"
            >
              <option value="dark">Dark Vector</option>
              <option value="satellite">Satellite</option>
            </select>
          </div>
          <div className="text-[10px] text-gray-300 flex items-center gap-3 font-mono">
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-500 border border-black" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div> Control</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-500 rounded-full border border-black"></div> Computed</span>
            <span className="flex items-center gap-1.5"><div className="w-4 h-1 bg-black border-y border-yellow-500"></div> Baseline</span>
          </div>
          <button 
            onClick={() => setZoomTrigger(prev => prev + 1)}
            className="bg-yellow-400 hover:bg-yellow-500 text-black px-3.5 py-1 text-xs font-bold border-2 border-[#141414] rounded-sm transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
          >
            Zoom Extents
          </button>
        </div>
      </div>

      <div className="flex-1 rounded-sm overflow-hidden border-2 border-[#141414] relative z-0 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
        {mapPoints.length > 0 ? (
          <div 
            ref={mapContainerRef} 
            style={{ height: '500px', width: '100%', background: '#111' }} 
          />
        ) : (
          <div className="h-[500px] flex items-center justify-center text-gray-500 bg-[#1a1a1a] border-2 border-[#141414]">
            <div className="text-center">
              <Map className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-bold text-sm text-gray-300">No valid points to display.</p>
              <p className="text-xs mt-2 text-gray-400">Calculate points in Forward, Inverse, Traverse, or Intersection modules.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
