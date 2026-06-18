import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Rectangle, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Layers, MapPin, Globe, Compass, RefreshCw, ZoomIn } from 'lucide-react';

interface VN2000MapViewerProps {
  sheet: {
    scale: string;
    name: string;
    bounds: {
      latMin: number;
      latMax: number;
      lonMin: number;
      lonMax: number;
    };
    center: {
      lat: number;
      lon: number;
    };
    details?: string[];
  };
  latitude: number;
  longitude: number;
}

// Custom glowing red GPS icon
const redGPSIcon = L.divIcon({
  className: 'custom-gps-icon',
  html: `<div style="position: relative; display: flex; align-items: center; justify-content: center;">
           <span class="absolute w-6 h-6 rounded-full bg-red-500/30 animate-ping border border-red-500/50"></span>
           <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-white shadow-[0_0_8px_rgba(239,68,68,0.9)]"></span>
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Component to handle auto-centering and auto-zooming
function MapFocusHandler({ bounds }: { bounds: VN2000MapViewerProps['sheet']['bounds'] }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      const leafletBounds = L.latLngBounds(
        [bounds.latMin, bounds.lonMin],
        [bounds.latMax, bounds.lonMax]
      );
      map.fitBounds(leafletBounds, { padding: [50, 50], animate: true, duration: 1.2 });
    }
  }, [bounds, map]);

  return null;
}

export default function VN2000MapViewer({ sheet, latitude, longitude }: VN2000MapViewerProps) {
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'streets'>('dark');
  const [resetCounter, setResetCounter] = useState(0);

  // Define tile styles
  const tileUrls = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  };

  const attributions = {
    dark: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    satellite: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    streets: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  };

  const { bounds, center, name, scale } = sheet;

  // Force map invalidation on style/bounds changes or reset triggers
  const handleRecenter = () => {
    setResetCounter(prev => prev + 1);
  };

  return (
    <div className="bg-[#111] border border-[#333] p-4 space-y-4 rounded-sm">
      {/* Viewer Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#222] pb-3">
        <div>
          <span className="text-[10px] text-yellow-500 font-mono tracking-wider uppercase font-bold flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-yellow-500 animate-spin-slow" /> Trực quan địa lý (VN2000 Geographic Viewer)
          </span>
          <h4 className="text-sm font-bold text-gray-200 mt-1 font-mono flex items-center gap-2">
            Sheet: <span className="text-yellow-500">{name}</span>
            <span className="text-xs text-gray-400 font-normal">({scale})</span>
          </h4>
        </div>
        
        {/* Map style selection & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-sm overflow-hidden border border-[#333] bg-[#161616]">
            {(['dark', 'satellite', 'streets'] as const).map(style => (
              <button
                key={style}
                onClick={() => setMapStyle(style)}
                className={`px-2.5 py-1 text-[10px] uppercase font-bold font-mono transition-colors ${
                  mapStyle === style
                    ? 'bg-yellow-500 text-black'
                    : 'text-gray-400 hover:text-white hover:bg-[#222]'
                }`}
              >
                {style === 'dark' ? 'Dark' : style === 'satellite' ? 'Satellite' : 'Streets'}
              </button>
            ))}
          </div>

          <button
            onClick={handleRecenter}
            className="p-1 px-2.5 bg-[#1a1a1a]/80 border border-[#333] hover:border-yellow-500 text-gray-300 hover:text-yellow-500 transition-all rounded-sm flex items-center gap-1.5 text-[10px] font-mono font-bold"
            title="Recenter and Fit Map Bounds"
          >
            <RefreshCw className="w-3 h-3" /> Fit Bounds
          </button>
        </div>
      </div>

      {/* Map Element container */}
      <div className="relative h-[480px] w-full border border-[#222] rounded-sm overflow-hidden z-0 bg-[#0d0d0d]">
        <MapContainer
          center={[center.lat, center.lon]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution={attributions[mapStyle]}
            url={tileUrls[mapStyle]}
          />
          
          {/* True Geographic Scale Bounding Rectangle */}
          <Rectangle
            bounds={[
              [bounds.latMin, bounds.lonMin],
              [bounds.latMax, bounds.lonMax]
            ]}
            pathOptions={{
              color: '#ffffff',
              weight: 2,
              fillColor: '#ffffff',
              fillOpacity: 0.25
            }}
          >
            <Popup className="custom-leaflet-popup">
              <div className="font-mono text-xs text-gray-900 leading-normal p-1">
                <div className="font-bold text-yellow-600 border-b border-gray-200 pb-1 mb-1">MẢNH BẢN ĐỒ</div>
                <div><b>Ký hiệu:</b> {name}</div>
                <div><b>Tỷ lệ:</b> {scale}</div>
                <div className="mt-1 flex flex-col gap-0.5 border-t border-gray-100 pt-1 text-[10px] text-gray-600">
                  <div>B: {bounds.latMin.toFixed(5)}° → {bounds.latMax.toFixed(5)}°</div>
                  <div>L: {bounds.lonMin.toFixed(5)}° → {bounds.lonMax.toFixed(5)}°</div>
                </div>
              </div>
            </Popup>
          </Rectangle>

          {/* Active GPS coordinate indicator */}
          <Marker
            position={[latitude, longitude]}
            icon={redGPSIcon}
          >
            <Popup>
              <div className="font-mono text-xs text-gray-900 leading-normal p-1">
                <div className="font-bold text-red-600 border-b border-gray-200 pb-1 mb-1">TỌA ĐỘ TRA CỨU</div>
                <div><b>Vĩ độ (B):</b> {latitude.toFixed(6)}°</div>
                <div><b>Kinh độ (L):</b> {longitude.toFixed(6)}°</div>
                <div className="text-[10px] text-gray-500 mt-1 uppercase italic">Nằm trong mảnh {name}</div>
              </div>
            </Popup>
          </Marker>

          {/* Boundaries observer controller */}
          <MapFocusHandler bounds={bounds} />
        </MapContainer>

        {/* Legend overlays */}
        <div className="absolute bottom-3 left-3 bg-[#111]/90 backdrop-blur-sm border border-[#333] p-2.5 rounded-sm z-[1000] space-y-1.5 font-mono text-[9px] pointer-events-none shadow-lg max-w-[200px]">
          <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider pb-1 border-b border-[#222]">CHÚ GIẢI BẢN ĐỒ</div>
          <div className="flex items-center gap-2 text-gray-300">
            <span className="w-4 h-3 border border-white bg-white/20 inline-block shrink-0"></span>
            <span>Ranh giới mảnh ({name})</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <span className="w-3 h-3 rounded-full bg-red-500/80 border border-white inline-block shrink-0"></span>
            <span>Điểm tra cứu ({latitude.toFixed(4)}, {longitude.toFixed(4)})</span>
          </div>
        </div>

        {/* Coords quick check overlay */}
        <div className="absolute top-3 right-3 bg-[#111]/90 backdrop-blur-sm border border-[#333] px-3 py-2 rounded-sm z-[1000] text-right font-mono text-[10px] space-y-0.5 text-gray-400 pointer-events-none shadow-md">
          <div className="text-gray-500 text-[9px] uppercase font-bold">Boundary Info</div>
          <div>B_Max: <span className="text-[#a0a0a0] font-bold">{bounds.latMax.toFixed(5)}°</span></div>
          <div>B_Min: <span className="text-[#a0a0a0] font-bold">{bounds.latMin.toFixed(5)}°</span></div>
          <div>L_Min: <span className="text-[#a0a0a0] font-bold">{bounds.lonMin.toFixed(5)}°</span></div>
          <div>L_Max: <span className="text-[#a0a0a0] font-bold">{bounds.lonMax.toFixed(5)}°</span></div>
        </div>
      </div>

      {/* Geodesy Helper note */}
      <div className="bg-[#161616] border border-[#222] p-3 text-[11px] text-gray-400 font-sans leading-relaxed rounded-sm space-y-1">
        <p className="flex items-center gap-1.5 font-mono text-gray-300 text-xs font-bold">
          <Globe className="w-3.5 h-3.5 text-yellow-500" /> Hệ quy chiếu bản đồ Việt Nam VN-2000
        </p>
        <p>
          Bản đồ lưới chiếu côn đồng góc Lambert hai vĩ tuyến chuẩn (đối với bản đồ địa hình tỷ lệ lớn) hoặc lưới chiếu UTM tương đương được phân định ranh giới theo kinh-vĩ độ địa lý trực tiếp. Bản đồ này hiển thị trực tiếp ranh giới lý thuyết xác thực của mảnh trên nền địa hình tự nhiên của đất nước Việt Nam.
        </p>
      </div>
    </div>
  );
}
