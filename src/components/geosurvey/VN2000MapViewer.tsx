import React, { useEffect, useRef, useState } from 'react';
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

// Custom glowing red GPS icon using standard div icon
const redGPSIcon = L.divIcon({
  className: 'custom-gps-icon',
  html: `<div style="position: relative; display: flex; align-items: center; justify-content: center;">
           <span style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background-color: rgba(239, 68, 68, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; border: 1px solid rgba(239, 68, 68, 0.5);"></span>
           <span style="position: relative; display: inline-flex; border-radius: 50%; height: 14px; width: 14px; background-color: rgb(239, 68, 68); border: 2px solid white; box-shadow: 0 0 8px rgba(239, 68, 68, 0.9);"></span>
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export default function VN2000MapViewer({ sheet, latitude, longitude }: VN2000MapViewerProps) {
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'dark'>('streets');
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const rectangleRef = useRef<L.Rectangle | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

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

  // Re-fit map bounds
  const handleRecenter = () => {
    if (mapRef.current) {
      const leafletBounds = L.latLngBounds(
        [bounds.latMin, bounds.lonMin],
        [bounds.latMax, bounds.lonMax]
      );
      mapRef.current.fitBounds(leafletBounds, { padding: [50, 50], animate: true, duration: 1.2 });
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map state on prop changes
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not yet initialized
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [center.lat, center.lon],
        zoom: 12,
        zoomControl: true,
      });
    }

    const map = mapRef.current;

    // 1. Tile layer update
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    tileLayerRef.current = L.tileLayer(tileUrls[mapStyle], {
      attribution: attributions[mapStyle]
    }).addTo(map);

    // 2. Bounds rectangle update
    if (rectangleRef.current) {
      map.removeLayer(rectangleRef.current);
    }
    const leafletBounds = L.latLngBounds(
      [bounds.latMin, bounds.lonMin],
      [bounds.latMax, bounds.lonMax]
    );
    rectangleRef.current = L.rectangle(leafletBounds, {
      color: '#d97706',
      weight: 3,
      fillColor: '#d97706',
      fillOpacity: 0.2
    }).addTo(map);

    // Bind popup with correct markup and info
    rectangleRef.current.bindPopup(`
      <div style="font-family: monospace; font-size: 12px; color: #141414; line-height: 1.4; padding: 4px;">
        <div style="font-weight: bold; color: #b45309; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 4px;">MẢNH BẢN ĐỒ</div>
        <div><b>Ký hiệu:</b> ${name}</div>
        <div><b>Tỷ lệ:</b> ${scale}</div>
        <div style="margin-top: 4px; display: flex; flex-direction: column; gap: 2px; border-top: 1px solid #f3f4f6; padding-top: 4px; font-size: 10px; color: #4b5563;">
          <div>B: ${bounds.latMin.toFixed(5)}° → ${bounds.latMax.toFixed(5)}°</div>
          <div>L: ${bounds.lonMin.toFixed(5)}° → ${bounds.lonMax.toFixed(5)}°</div>
        </div>
      </div>
    `);

    // 3. Coordinate Marker update
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }
    markerRef.current = L.marker([latitude, longitude], {
      icon: redGPSIcon
    }).addTo(map);

    markerRef.current.bindPopup(`
      <div style="font-family: monospace; font-size: 12px; color: #141414; line-height: 1.4; padding: 4px;">
        <div style="font-weight: bold; color: #dc2626; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 4px;">TỌA ĐỘ TRA CỨU</div>
        <div><b>Vĩ độ (B):</b> ${latitude.toFixed(6)}°</div>
        <div><b>Kinh độ (L):</b> ${longitude.toFixed(6)}°</div>
        <div style="font-size: 10px; color: #6b7280; margin-top: 4px; text-transform: uppercase; font-style: italic;">Nằm trong mảnh ${name}</div>
      </div>
    `);

    // Auto fit bounds
    map.fitBounds(leafletBounds, { padding: [50, 50], animate: true, duration: 1.2 });

    // Handle initial resize rendering
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, [bounds, latitude, longitude, mapStyle, name, scale]);

  return (
    <div className="bg-white border-2 border-[#141414] p-4 space-y-4 rounded-sm shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] text-black">
      {/* Viewer Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b-2 border-[#141414] pb-3">
        <div>
          <span className="text-[10px] text-yellow-600 font-mono tracking-wider uppercase font-bold flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-yellow-600 animate-spin-slow" /> Trực quan địa lý (VN2000 Geographic Viewer)
          </span>
          <h4 className="text-sm font-bold text-black mt-1 font-mono flex items-center gap-2">
            Sheet: <span className="text-yellow-600">{name}</span>
            <span className="text-xs text-gray-500 font-normal">({scale})</span>
          </h4>
        </div>
        
        {/* Map style selection & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-sm overflow-hidden border-2 border-[#141414] bg-stone-100">
            {(['streets', 'satellite', 'dark'] as const).map(style => (
              <button
                key={style}
                onClick={() => { setMapStyle(style); }}
                className={`px-2.5 py-1 text-[10px] uppercase font-bold font-mono transition-colors cursor-pointer ${
                  mapStyle === style
                    ? 'bg-yellow-400 text-black border-r-2 last:border-r-0 border-[#141414]'
                    : 'text-gray-700 hover:text-black hover:bg-stone-200 border-r-2 last:border-r-0 border-[#141414]/30'
                }`}
              >
                {style === 'dark' ? 'Dark' : style === 'satellite' ? 'Satellite' : 'Streets'}
              </button>
            ))}
          </div>

          <button
            onClick={handleRecenter}
            className="p-1 px-2.5 bg-white border-2 border-[#141414] hover:bg-stone-100 text-black transition-all rounded-sm flex items-center gap-1.5 text-[10px] font-mono font-bold shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(20,20,20,1)] cursor-pointer"
            title="Recenter and Fit Map Bounds"
          >
            <RefreshCw className="w-3 h-3" /> Fit Bounds
          </button>
        </div>
      </div>

      {/* Map Element container with robust style height to prevent 0px rendering */}
      <div 
        ref={mapContainerRef} 
        style={{ height: '480px' }} 
        className="relative w-full border-2 border-[#141414] rounded-sm overflow-hidden z-0 bg-stone-50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]"
      />

      {/* Map Legend overlays */}
      <div className="flex flex-wrap gap-4 p-2 bg-stone-50 border-2 border-[#141414] rounded-sm text-[10px] font-mono">
        <div className="font-bold text-yellow-600 uppercase tracking-wider shrink-0 border-r-2 border-[#141414]/15 pr-3">CHÚ GIẢI BẢN ĐỒ:</div>
        <div className="flex items-center gap-2 text-gray-800">
          <span className="w-4 h-3 border border-yellow-600 bg-yellow-400/20 inline-block shrink-0"></span>
          <span>Ranh giới mảnh ({name})</span>
        </div>
        <div className="flex items-center gap-2 text-gray-800">
          <span className="w-3 h-3 rounded-full bg-red-500 border border-white inline-block shrink-0"></span>
          <span>Điểm tra cứu</span>
        </div>
      </div>

      {/* Geodesy Helper note */}
      <div className="bg-yellow-50 border-2 border-[#141414] p-3 text-[11px] text-gray-800 font-sans leading-relaxed rounded-sm space-y-1 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
        <p className="flex items-center gap-1.5 font-mono text-black text-xs font-bold">
          <Globe className="w-3.5 h-3.5 text-yellow-600" /> Hệ quy chiếu bản đồ Việt Nam VN-2000
        </p>
        <p>
          Bản đồ lưới chiếu côn đồng góc Lambert hai vĩ tuyến chuẩn (đối với bản đồ địa hình tỷ lệ lớn) hoặc lưới chiếu UTM tương đương được phân định ranh giới theo kinh-vĩ độ địa lý trực tiếp. Bản đồ này hiển thị trực tiếp ranh giới lý thuyết xác thực của mảnh trên nền địa hình tự nhiên của đất nước Việt Nam.
        </p>
      </div>
    </div>
  );
}
