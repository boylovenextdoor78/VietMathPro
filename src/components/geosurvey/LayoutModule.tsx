import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useProject } from './ProjectContext';
import { convertToWGS84 } from '../../lib/epsgDefs';
import { Layers, Map, Settings2 } from 'lucide-react';

// Component to automatically adjust map bounds to fit all markers
const MapBounds = ({ markers, trigger }: { markers: [number, number][], trigger: number }) => {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
    }
  }, [markers, map, trigger]);
  return null;
};

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

  useEffect(() => {
    const converted = points.map(p => {
      const [lng, lat] = convertToWGS84(p.x, p.y, epsg);
      return { ...p, lat, lng };
    }).filter(p => !isNaN(p.lat) && !isNaN(p.lng) && p.lat !== 0 && p.lng !== 0);
    
    setMapPoints(converted);
  }, [points, epsg]);

  const positions = mapPoints.map(p => [p.lat, p.lng] as [number, number]);

  const renderLines = () => {
    return lines.map(line => {
      const startPoint = mapPoints.find(p => p.id === line.startPointId);
      const endPoint = mapPoints.find(p => p.id === line.endPointId);
      if (!startPoint || !endPoint) return null;

      const pos: [number, number][] = [[startPoint.lat, startPoint.lng], [endPoint.lat, endPoint.lng]];

      if (line.type === 'baseline') {
        return (
          <React.Fragment key={line.id}>
            <Polyline positions={pos} color="#000" weight={6} />
            <Polyline positions={pos} color="#eab308" weight={2} />
          </React.Fragment>
        );
      } else if (line.type === 'traverse') {
        return <Polyline key={line.id} positions={pos} color="#3b82f6" weight={2} dashArray="5, 5" />;
      }
      return <Polyline key={line.id} positions={pos} color="#888" weight={2} />;
    });
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="bg-[#222] border border-[#333] p-4 rounded-sm flex justify-between items-center">
        <div>
          <h3 className="text-xs uppercase text-yellow-500 font-bold tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4" /> VIP Pro Layout Map
          </h3>
          <p className="text-[10px] text-gray-400 mt-1">
            Displaying {mapPoints.length} points converted from {epsg} to EPSG:4326
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider">Map Style</label>
            <select 
              value={showSatellite ? 'satellite' : 'dark'} 
              onChange={e => setShowSatellite(e.target.value === 'satellite')}
              className="bg-[#111] border border-[#444] text-xs text-gray-300 px-2 py-1 focus:outline-none focus:border-yellow-500"
            >
              <option value="dark">Dark Vector</option>
              <option value="satellite">Satellite</option>
            </select>
          </div>
          <div className="text-[10px] text-gray-500 flex items-center gap-2">
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 border border-black" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div> Control</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-full border border-black"></div> Computed</span>
            <span className="flex items-center gap-1"><div className="w-4 h-1 bg-black border-y border-yellow-500"></div> Baseline</span>
          </div>
          <button 
            onClick={() => setZoomTrigger(prev => prev + 1)}
            className="bg-[#333] hover:bg-[#444] text-gray-300 px-3 py-1 text-xs rounded-sm transition-colors"
          >
            Zoom Extents
          </button>
        </div>
      </div>

      <div className="flex-1 rounded-sm overflow-hidden border border-[#333] relative z-0">
        {mapPoints.length > 0 ? (
          <MapContainer center={positions[0]} zoom={13} style={{ height: '100%', width: '100%', background: '#111' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url={showSatellite ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"}
            />
            {renderLines()}
            {mapPoints.map(p => {
              let icon;
              if (p.isControl) {
                icon = createTriangleIcon(p.name);
              } else if (p.source === 'Computed' || p.type === 'computed') {
                icon = createCircleIcon(p.name);
              } else {
                icon = createTempStationIcon(p.name);
              }

              return (
              <Marker 
                key={p.id} 
                position={[p.lat, p.lng]} 
                icon={icon}
              >
                <Popup>
                  <div className="text-black font-mono">
                    <strong>{p.name}</strong><br/>
                    Type: {p.isControl ? 'Control Point' : (p.type === 'known' ? 'Temporary Station' : 'Computed Point')}<br/>
                    Source: {p.source}<br/>
                    Lat: {p.lat.toFixed(6)}<br/>
                    Lng: {p.lng.toFixed(6)}
                  </div>
                </Popup>
              </Marker>
            )})}
            <MapBounds markers={positions} trigger={zoomTrigger} />
          </MapContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 bg-[#1a1a1a]">
            <div className="text-center">
              <Map className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No valid points to display.</p>
              <p className="text-xs mt-2 opacity-60">Calculate points in Forward, Inverse, Traverse, or Intersection modules.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
