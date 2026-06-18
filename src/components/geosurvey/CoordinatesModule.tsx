import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Settings, Search, Upload, Download, ArrowRight, Save, Crosshair, Globe, Layers, Calculator } from 'lucide-react';
import proj4 from 'proj4';
import Decimal from 'decimal.js';
import { VN_PROVINCES, getProj4String, ProvinceCRS, detectProvinceFromLon } from '../../lib/vn2000';
import { EPSG_OPTIONS } from '../../lib/epsgDefs';
import Papa from 'papaparse';

type TabId = 'vietnam' | 'survey' | 'advanced' | 'explorer';

export default function CoordinatesModule() {
  const [activeTab, setActiveTab] = useState<TabId>('vietnam');

  return (
    <div className="h-full flex flex-col space-y-4 text-gray-300">
      <div className="flex items-center gap-4 border-b border-[#333] pb-4">
        <button onClick={() => setActiveTab('vietnam')} className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'vietnam' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-gray-300'}`}>Vietnam Pro</button>
        <button onClick={() => setActiveTab('survey')} className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'survey' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-gray-300'}`}>Survey Mode (Batch)</button>
        <button onClick={() => setActiveTab('advanced')} className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'advanced' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-gray-300'}`}>Advanced</button>
        <button onClick={() => setActiveTab('explorer')} className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'explorer' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-500 hover:text-gray-300'}`}>CRS Explorer</button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'vietnam' && <VietnamProTab key="vietnam" />}
          {activeTab === 'survey' && <SurveyBatchTab key="survey" />}
          {activeTab === 'advanced' && <AdvancedTab key="advanced" />}
          {activeTab === 'explorer' && <CRSExplorerTab key="explorer" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function VietnamProTab() {
  const [inputMode, setInputMode] = useState<'wgs84_to_vn2000' | 'vn2000_to_wgs84'>('wgs84_to_vn2000');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [x, setX] = useState('');
  const [y, setY] = useState('');
  
  const [selectedProvince, setSelectedProvince] = useState<string>(VN_PROVINCES[1].id); // Default HCM
  const [zoneType, setZoneType] = useState<3 | 6>(3);
  
  const [result, setResult] = useState<any>(null);

  const landmarks = [
    {
      name: 'Mốc N00 HQV (Trụ sở Mới) 🇻🇳',
      desc: 'Viện Khoa học Đo đạc & Bản đồ (Trụ sở mới: 479 Hoàng Quốc Việt)',
      lat: '21.047039',
      lon: '105.783661',
      provinceCode: 'VN-HN'
    },
    {
      name: 'Mốc N00 HQV (Trụ sở Cũ) 🇻🇳',
      desc: 'Viện Khoa học Đo đạc & Bản đồ (Trụ sở cũ: 108 Hoàng Quốc Việt)',
      lat: '21.04929722',
      lon: '105.80509167',
      provinceCode: 'VN-HN'
    },
    {
      name: 'Điểm gốc VN-2000 Đồ Sơn',
      desc: 'Trạm Thủy triều Đồ Sơn, Hải Phòng',
      lat: '20.71072917',
      lon: '106.80413889',
      provinceCode: 'VN-HP'
    },
    {
      name: 'Mốc GPS 0001 Đất Mũi',
      desc: 'Mũi Cà Mau (Điểm cực Nam tổ quốc)',
      lat: '8.62500000',
      lon: '104.82194444',
      provinceCode: 'VN-CM'
    },
    {
      name: 'Mốc Lũng Cú Hà Giang',
      desc: 'Cột cờ Lũng Cú (Điểm cực Bắc tổ quốc)',
      lat: '23.38277778',
      lon: '105.32111111',
      provinceCode: 'VN-HG'
    }
  ];

  const loadLandmark = (lm: typeof landmarks[0]) => {
    setInputMode('wgs84_to_vn2000');
    setLat(lm.lat);
    setLon(lm.lon);
    setSelectedProvince(lm.provinceCode);
    
    try {
      const prov = VN_PROVINCES.find(p => p.id === lm.provinceCode);
      if (!prov) return;
      const projString = getProj4String(prov.cm, zoneType);
      const lngVal = parseFloat(lm.lon);
      const latVal = parseFloat(lm.lat);
      const [resX, resY] = proj4('EPSG:4326', projString, [lngVal, latVal]);
      setResult({ x: resX.toFixed(4), y: resY.toFixed(4), prov: prov.name, cm: prov.cm });
    } catch (e) {
      console.error(e);
    }
  };

  // Auto-detect province when lon changes
  useEffect(() => {
    if (inputMode === 'wgs84_to_vn2000' && lon) {
      const lonVal = parseFloat(lon);
      if (!isNaN(lonVal)) {
        const prov = detectProvinceFromLon(lonVal);
        if (prov) {
          setSelectedProvince(prov.id);
        }
      }
    }
  }, [lon, inputMode]);

  const handleConvert = () => {
    try {
      const prov = VN_PROVINCES.find(p => p.id === selectedProvince);
      if (!prov) return;

      const projString = getProj4String(prov.cm, zoneType);
      
      if (inputMode === 'wgs84_to_vn2000') {
        const lngVal = parseFloat(lon);
        const latVal = parseFloat(lat);
        if (isNaN(lngVal) || isNaN(latVal)) return;

        const [resX, resY] = proj4('EPSG:4326', projString, [lngVal, latVal]);
        setResult({ x: resX.toFixed(4), y: resY.toFixed(4), prov: prov.name, cm: prov.cm });
      } else {
        const xVal = parseFloat(x);
        const yVal = parseFloat(y);
        if (isNaN(xVal) || isNaN(yVal)) return;

        const [resLng, resLat] = proj4(projString, 'EPSG:4326', [xVal, yVal]);
        setResult({ lat: resLat.toFixed(8), lon: resLng.toFixed(8), prov: prov.name, cm: prov.cm });
      }
    } catch (e) {
      console.error(e);
      alert("Conversion error. Please check your inputs.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="bg-[#222] p-4 border border-[#333] rounded-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-yellow-500 uppercase flex items-center gap-2"><Globe className="w-4 h-4" /> VN Coordinate Intelligence Engine 2026</h3>
          <div className="flex gap-2 bg-[#111] p-1 rounded-sm border border-[#333]">
            <button onClick={() => setInputMode('wgs84_to_vn2000')} className={`px-3 py-1 text-xs uppercase ${inputMode === 'wgs84_to_vn2000' ? 'bg-yellow-500 text-black font-bold' : 'text-gray-400'}`}>WGS84 → VN2000</button>
            <button onClick={() => setInputMode('vn2000_to_wgs84')} className={`px-3 py-1 text-xs uppercase ${inputMode === 'vn2000_to_wgs84' ? 'bg-yellow-500 text-black font-bold' : 'text-gray-400'}`}>VN2000 → WGS84</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-[#1a1a1a] p-4 border border-[#333]">
              <h4 className="text-xs text-gray-500 uppercase mb-3">Target System</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Province / City (63 Provinces)</label>
                  <select value={selectedProvince} onChange={e => setSelectedProvince(e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-sm focus:border-yellow-500 outline-none">
                    {VN_PROVINCES.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (CM: {p.cm}°)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Zone Type</label>
                  <select value={zoneType} onChange={e => setZoneType(Number(e.target.value) as 3|6)} className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-sm focus:border-yellow-500 outline-none">
                    <option value={3}>3-Degree Zone (k=0.9999)</option>
                    <option value={6}>6-Degree Zone (k=0.9996)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] p-4 border border-[#333]">
              <h4 className="text-xs text-yellow-500 font-bold uppercase mb-3 tracking-wider flex items-center gap-1.5">
                🌟 Mốc Tọa độ Quốc gia & Landmark Tiêu biểu
              </h4>
              <div className="space-y-1.5">
                {landmarks.map((lm, i) => (
                  <button 
                    key={i} 
                    onClick={() => loadLandmark(lm)}
                    className="w-full text-left bg-[#111] border border-[#333] hover:border-yellow-500/50 hover:bg-yellow-500/5 p-2 rounded-sm transition-all focus:outline-none focus:border-yellow-500 text-xs"
                  >
                    <div className="font-bold text-gray-200 flex items-center justify-between">
                      <span>{lm.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-mono italic">
                        {parseFloat(lm.lat).toFixed(6)}, {parseFloat(lm.lon).toFixed(6)}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">{lm.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#1a1a1a] p-4 border border-[#333]">
              <h4 className="text-xs text-gray-500 uppercase mb-3">Input Coordinates</h4>
              {inputMode === 'wgs84_to_vn2000' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Latitude (Decimal Degrees)</label>
                    <input type="number" value={lat} onChange={e => setLat(e.target.value)} placeholder="e.g. 10.77689" className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-sm focus:border-yellow-500 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Longitude (Decimal Degrees)</label>
                    <input type="number" value={lon} onChange={e => setLon(e.target.value)} placeholder="e.g. 106.70198" className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-sm focus:border-yellow-500 outline-none font-mono" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Easting (X)</label>
                    <input type="number" value={x} onChange={e => setX(e.target.value)} placeholder="e.g. 600000.000" className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-sm focus:border-yellow-500 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Northing (Y)</label>
                    <input type="number" value={y} onChange={e => setY(e.target.value)} placeholder="e.g. 1190000.000" className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-sm focus:border-yellow-500 outline-none font-mono" />
                  </div>
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <button onClick={handleConvert} className="bg-yellow-500 text-black px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-yellow-400 transition-colors flex items-center gap-2">
                  <Calculator className="w-4 h-4" /> Convert Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1a1a1a] border border-green-900 p-6 rounded-sm">
          <h3 className="text-sm font-bold text-green-400 uppercase mb-4 flex items-center gap-2"><CheckCircleIcon /> Conversion Result</h3>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-[10px] text-gray-500 uppercase mb-1">System</div>
              <div className="text-sm font-bold text-white">VN-2000 {result.prov} (CM: {result.cm}°)</div>
            </div>
            {inputMode === 'wgs84_to_vn2000' ? (
              <>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase mb-1">Easting (X)</div>
                  <div className="text-xl font-mono text-yellow-500">{result.x} m</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase mb-1">Northing (Y)</div>
                  <div className="text-xl font-mono text-yellow-500">{result.y} m</div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase mb-1">Latitude</div>
                  <div className="text-xl font-mono text-yellow-500">{result.lat}°</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase mb-1">Longitude</div>
                  <div className="text-xl font-mono text-yellow-500">{result.lon}°</div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function CheckCircleIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
}

function SurveyBatchTab() {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>(VN_PROVINCES[1].id);
  const [zoneType, setZoneType] = useState<3 | 6>(3);
  const [inputMode, setInputMode] = useState<'wgs84_to_vn2000' | 'vn2000_to_wgs84'>('wgs84_to_vn2000');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data);
      }
    });
  };

  const handleBatchConvert = () => {
    const prov = VN_PROVINCES.find(p => p.id === selectedProvince);
    if (!prov) return;
    const projString = getProj4String(prov.cm, zoneType);

    const converted = csvData.map(row => {
      try {
        if (inputMode === 'wgs84_to_vn2000') {
          const lat = parseFloat(row.lat || row.Latitude || row.LAT);
          const lon = parseFloat(row.lon || row.lng || row.Longitude || row.LON);
          if (isNaN(lat) || isNaN(lon)) return { ...row, Error: 'Invalid Input' };
          const [x, y] = proj4('EPSG:4326', projString, [lon, lat]);
          return { ...row, Easting_X: x.toFixed(4), Northing_Y: y.toFixed(4) };
        } else {
          const x = parseFloat(row.x || row.Easting || row.X);
          const y = parseFloat(row.y || row.Northing || row.Y);
          if (isNaN(x) || isNaN(y)) return { ...row, Error: 'Invalid Input' };
          const [lon, lat] = proj4(projString, 'EPSG:4326', [x, y]);
          return { ...row, Latitude: lat.toFixed(8), Longitude: lon.toFixed(8) };
        }
      } catch (e) {
        return { ...row, Error: 'Conversion Failed' };
      }
    });

    const csv = Papa.unparse(converted);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `converted_${Date.now()}.csv`;
    link.click();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="bg-[#222] p-6 border border-[#333] rounded-sm text-center">
        <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Batch Coordinate Conversion</h3>
        <p className="text-sm text-gray-400 mb-6">Upload a CSV file containing coordinates to convert up to 1,000,000 points instantly.</p>
        
        <div className="flex justify-center gap-4 mb-6">
          <select value={selectedProvince} onChange={e => setSelectedProvince(e.target.value)} className="bg-[#111] border border-[#444] px-3 py-2 text-sm focus:border-yellow-500 outline-none">
            {VN_PROVINCES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={inputMode} onChange={e => setInputMode(e.target.value as any)} className="bg-[#111] border border-[#444] px-3 py-2 text-sm focus:border-yellow-500 outline-none">
            <option value="wgs84_to_vn2000">WGS84 to VN2000</option>
            <option value="vn2000_to_wgs84">VN2000 to WGS84</option>
          </select>
        </div>

        <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
        <label htmlFor="csv-upload" className="cursor-pointer inline-flex items-center gap-2 bg-[#333] text-white px-6 py-2 rounded-sm hover:bg-[#444] transition-colors">
          Select CSV File
        </label>

        {csvData.length > 0 && (
          <div className="mt-6 p-4 bg-[#1a1a1a] border border-[#333] text-left">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-green-400">Loaded {csvData.length} rows</span>
              <button onClick={handleBatchConvert} className="bg-yellow-500 text-black px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-yellow-400 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" /> Convert & Download
              </button>
            </div>
            <div className="overflow-x-auto max-h-40 custom-scrollbar">
              <table className="w-full text-xs text-left">
                <thead className="text-gray-500 uppercase bg-[#111]">
                  <tr>{Object.keys(csvData[0]).map(k => <th key={k} className="px-2 py-1">{k}</th>)}</tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-[#222]">
                      {Object.values(row).map((v: any, j) => <td key={j} className="px-2 py-1">{v}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvData.length > 5 && <div className="text-center text-xs text-gray-500 mt-2">... and {csvData.length - 5} more rows</div>}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AdvancedTab() {
  const [subTab, setSubTab] = useState<'7param' | 'ecef'>('7param');

  // 7-Parameter States
  const [dx, setDx] = useState('-191.90441429');
  const [dy, setDy] = useState('-39.30318279');
  const [dz, setDz] = useState('-111.45032835');
  const [rx, setRx] = useState('-0.00928836');
  const [ry, setRy] = useState('0.01975479');
  const [rz, setRz] = useState('-0.00427372');
  const [k, setK] = useState('1.000000252906278');

  const [cm, setCm] = useState('105.00');
  const [zoneType, setZoneType] = useState<3 | 6>(3);

  const [inputMode, setInputMode] = useState<'wgs84_to_local' | 'local_to_wgs84'>('wgs84_to_local');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [x, setX] = useState('');
  const [y, setY] = useState('');

  const [result, setResult] = useState<any>(null);

  // ECEF States
  const [ecefMode, setEcefMode] = useState<'blh_to_xyz' | 'xyz_to_blh'>('blh_to_xyz');
  const [bLat, setBLat] = useState('');
  const [lLon, setLLon] = useState('');
  const [hHeight, setHHeight] = useState('');
  const [ecefX, setEcefX] = useState('');
  const [ecefY, setEcefY] = useState('');
  const [ecefZ, setEcefZ] = useState('');
  const [ecefResult, setEcefResult] = useState<any>(null);

  const handleConvert = () => {
    try {
      // Calculate ppm from k: ppm = (k - 1) * 1000000
      const ppm = new Decimal(k).minus(1).times(1000000).toString();
      const towgs84 = `${dx},${dy},${dz},${rx},${ry},${rz},${ppm}`;
      
      const kProj = zoneType === 3 ? 0.9999 : 0.9996;
      const projString = `+proj=tmerc +lat_0=0 +lon_0=${cm} +k=${kProj} +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=${towgs84} +units=m +no_defs`;

      if (inputMode === 'wgs84_to_local') {
        const lngVal = parseFloat(lon);
        const latVal = parseFloat(lat);
        if (isNaN(lngVal) || isNaN(latVal)) return;

        const [resX, resY] = proj4('EPSG:4326', projString, [lngVal, latVal]);
        setResult({ x: resX.toFixed(4), y: resY.toFixed(4) });
      } else {
        const xVal = parseFloat(x);
        const yVal = parseFloat(y);
        if (isNaN(xVal) || isNaN(yVal)) return;

        const [resLng, resLat] = proj4(projString, 'EPSG:4326', [xVal, yVal]);
        setResult({ lat: resLat.toFixed(10), lon: resLng.toFixed(10) });
      }
    } catch (e) {
      console.error(e);
      alert("Conversion error. Please check your parameters.");
    }
  };

  const handleEcefConvert = () => {
    try {
      const a = new Decimal('6378137.0');
      const f = new Decimal('1').div('298.257223563');
      const b = a.times(new Decimal('1').minus(f));
      const e2 = new Decimal('1').minus(b.pow(2).div(a.pow(2)));
      const ep2 = a.pow(2).div(b.pow(2)).minus(1);
      const pi = new Decimal('3.1415926535897932384626433832795028419716939937510582097494459230781640628620899862803482534211706798214');

      if (ecefMode === 'blh_to_xyz') {
        const B = new Decimal(bLat || 0);
        const L = new Decimal(lLon || 0);
        const H = new Decimal(hHeight || 0);

        const latRad = B.times(pi).div(180);
        const lonRad = L.times(pi).div(180);
        
        const sinLat = Decimal.sin(latRad);
        const cosLat = Decimal.cos(latRad);
        const sinLon = Decimal.sin(lonRad);
        const cosLon = Decimal.cos(lonRad);

        const N = a.div(Decimal.sqrt(new Decimal('1').minus(e2.times(sinLat.pow(2)))));

        const X = N.plus(H).times(cosLat).times(cosLon);
        const Y = N.plus(H).times(cosLat).times(sinLon);
        const Z = N.times(new Decimal('1').minus(e2)).plus(H).times(sinLat);

        setEcefResult({ x: X.toFixed(4), y: Y.toFixed(4), z: Z.toFixed(4) });
      } else {
        const X = new Decimal(ecefX || 0);
        const Y = new Decimal(ecefY || 0);
        const Z = new Decimal(ecefZ || 0);

        const p = Decimal.sqrt(X.pow(2).plus(Y.pow(2)));
        const theta = Decimal.atan2(Z.times(a), p.times(b));
        
        const lonRad = Decimal.atan2(Y, X);
        
        const sinTheta3 = Decimal.sin(theta).pow(3);
        const cosTheta3 = Decimal.cos(theta).pow(3);
        
        const latRad = Decimal.atan2(
          Z.plus(ep2.times(b).times(sinTheta3)),
          p.minus(e2.times(a).times(cosTheta3))
        );

        const sinLat = Decimal.sin(latRad);
        const cosLat = Decimal.cos(latRad);
        
        const N = a.div(Decimal.sqrt(new Decimal('1').minus(e2.times(sinLat.pow(2)))));
        const H = p.div(cosLat).minus(N);

        const B = latRad.times(180).div(pi);
        const L = lonRad.times(180).div(pi);

        setEcefResult({ b: B.toFixed(10), l: L.toFixed(10), h: H.toFixed(4) });
      }
    } catch (e) {
      console.error(e);
      alert("Conversion error. Please check your inputs.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="flex gap-4 border-b border-[#333] pb-4">
        <button onClick={() => setSubTab('7param')} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${subTab === '7param' ? 'bg-[#333] text-yellow-500 rounded-sm' : 'text-gray-500 hover:text-gray-300'}`}>7-Parameter Projection</button>
        <button onClick={() => setSubTab('ecef')} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${subTab === 'ecef' ? 'bg-[#333] text-yellow-500 rounded-sm' : 'text-gray-500 hover:text-gray-300'}`}>ECEF (X,Y,Z) ↔ Geodetic (B,L,H)</button>
      </div>

      {subTab === '7param' && (
        <div className="bg-[#222] p-4 border border-[#333] rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-yellow-500 uppercase flex items-center gap-2"><Settings className="w-4 h-4" /> Advanced 7-Parameter Transform</h3>
            <div className="flex gap-2 bg-[#111] p-1 rounded-sm border border-[#333]">
              <button onClick={() => setInputMode('wgs84_to_local')} className={`px-3 py-1 text-xs uppercase ${inputMode === 'wgs84_to_local' ? 'bg-yellow-500 text-black font-bold' : 'text-gray-400'}`}>WGS84 → Local</button>
              <button onClick={() => setInputMode('local_to_wgs84')} className={`px-3 py-1 text-xs uppercase ${inputMode === 'local_to_wgs84' ? 'bg-yellow-500 text-black font-bold' : 'text-gray-400'}`}>Local → WGS84</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-[#1a1a1a] p-4 border border-[#333]">
                <h4 className="text-xs text-gray-500 uppercase mb-3">7-Parameter Bursa-Wolf (Exact Precision)</h4>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">ΔX (m)</label>
                    <input type="text" value={dx} onChange={e => setDx(e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-xs focus:border-yellow-500 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">ΔY (m)</label>
                    <input type="text" value={dy} onChange={e => setDy(e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-xs focus:border-yellow-500 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">ΔZ (m)</label>
                    <input type="text" value={dz} onChange={e => setDz(e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-xs focus:border-yellow-500 outline-none font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Rot X (")</label>
                    <input type="text" value={rx} onChange={e => setRx(e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-xs focus:border-yellow-500 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Rot Y (")</label>
                    <input type="text" value={ry} onChange={e => setRy(e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-xs focus:border-yellow-500 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Rot Z (")</label>
                    <input type="text" value={rz} onChange={e => setRz(e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-xs focus:border-yellow-500 outline-none font-mono" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Scale Factor (k)</label>
                  <input type="text" value={k} onChange={e => setK(e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-xs focus:border-yellow-500 outline-none font-mono" />
                </div>
              </div>

              <div className="bg-[#1a1a1a] p-4 border border-[#333]">
                <h4 className="text-xs text-gray-500 uppercase mb-3">Projection Parameters</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Central Meridian (CM)</label>
                    <input type="number" value={cm} onChange={e => setCm(e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-sm focus:border-yellow-500 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Zone Type</label>
                    <select value={zoneType} onChange={e => setZoneType(Number(e.target.value) as 3|6)} className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-sm focus:border-yellow-500 outline-none">
                      <option value={3}>3-Degree (k=0.9999)</option>
                      <option value={6}>6-Degree (k=0.9996)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-[#1a1a1a] p-4 border border-[#333]">
                <h4 className="text-xs text-gray-500 uppercase mb-3">Input Coordinates</h4>
                {inputMode === 'wgs84_to_local' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Latitude (Decimal Degrees)</label>
                      <input type="number" value={lat} onChange={e => setLat(e.target.value)} placeholder="e.g. 10.77689" className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-sm focus:border-yellow-500 outline-none font-mono" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Longitude (Decimal Degrees)</label>
                      <input type="number" value={lon} onChange={e => setLon(e.target.value)} placeholder="e.g. 106.70198" className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-sm focus:border-yellow-500 outline-none font-mono" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Easting (X)</label>
                      <input type="number" value={x} onChange={e => setX(e.target.value)} placeholder="e.g. 600000.000" className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-sm focus:border-yellow-500 outline-none font-mono" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Northing (Y)</label>
                      <input type="number" value={y} onChange={e => setY(e.target.value)} placeholder="e.g. 1190000.000" className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-sm focus:border-yellow-500 outline-none font-mono" />
                    </div>
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <button onClick={handleConvert} className="bg-yellow-500 text-black px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-yellow-400 transition-colors flex items-center gap-2">
                    <Calculator className="w-4 h-4" /> Calculate
                  </button>
                </div>
              </div>

              {result && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] border border-green-900 p-4 rounded-sm">
                  <h4 className="text-[10px] text-green-400 uppercase mb-3">Result</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {inputMode === 'wgs84_to_local' ? (
                      <>
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase mb-1">Easting (X)</div>
                          <div className="text-lg font-mono text-yellow-500">{result.x}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase mb-1">Northing (Y)</div>
                          <div className="text-lg font-mono text-yellow-500">{result.y}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase mb-1">Latitude</div>
                          <div className="text-lg font-mono text-yellow-500">{result.lat}°</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase mb-1">Longitude</div>
                          <div className="text-lg font-mono text-yellow-500">{result.lon}°</div>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === 'ecef' && (
        <div className="bg-[#222] p-4 border border-[#333] rounded-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-yellow-500 uppercase flex items-center gap-2"><Globe className="w-4 h-4" /> ECEF Cartesian ↔ Geodetic (WGS84)</h3>
            <div className="flex gap-2 bg-[#111] p-1 rounded-sm border border-[#333]">
              <button onClick={() => setEcefMode('blh_to_xyz')} className={`px-3 py-1 text-xs uppercase ${ecefMode === 'blh_to_xyz' ? 'bg-yellow-500 text-black font-bold' : 'text-gray-400'}`}>B,L,H → X,Y,Z</button>
              <button onClick={() => setEcefMode('xyz_to_blh')} className={`px-3 py-1 text-xs uppercase ${ecefMode === 'xyz_to_blh' ? 'bg-yellow-500 text-black font-bold' : 'text-gray-400'}`}>X,Y,Z → B,L,H</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-[#1a1a1a] p-4 border border-[#333]">
                <h4 className="text-xs text-gray-500 uppercase mb-3">Input Coordinates</h4>
                {ecefMode === 'blh_to_xyz' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Latitude B (Decimal Degrees)</label>
                      <input type="number" value={bLat} onChange={e => setBLat(e.target.value)} placeholder="e.g. 10.77689" className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-sm focus:border-yellow-500 outline-none font-mono" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Longitude L (Decimal Degrees)</label>
                      <input type="number" value={lLon} onChange={e => setLLon(e.target.value)} placeholder="e.g. 106.70198" className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-sm focus:border-yellow-500 outline-none font-mono" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Ellipsoidal Height H (m)</label>
                      <input type="number" value={hHeight} onChange={e => setHHeight(e.target.value)} placeholder="e.g. 15.500" className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-sm focus:border-yellow-500 outline-none font-mono" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">X (m)</label>
                      <input type="number" value={ecefX} onChange={e => setEcefX(e.target.value)} placeholder="e.g. -1800000.000" className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-sm focus:border-yellow-500 outline-none font-mono" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Y (m)</label>
                      <input type="number" value={ecefY} onChange={e => setEcefY(e.target.value)} placeholder="e.g. 6000000.000" className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-sm focus:border-yellow-500 outline-none font-mono" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Z (m)</label>
                      <input type="number" value={ecefZ} onChange={e => setEcefZ(e.target.value)} placeholder="e.g. 1100000.000" className="w-full bg-[#111] border border-[#444] px-2 py-1.5 text-sm focus:border-yellow-500 outline-none font-mono" />
                    </div>
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <button onClick={handleEcefConvert} className="bg-yellow-500 text-black px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-yellow-400 transition-colors flex items-center gap-2">
                    <Calculator className="w-4 h-4" /> Calculate
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {ecefResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111] border border-green-900 p-4 rounded-sm h-full flex flex-col justify-center">
                  <h4 className="text-[10px] text-green-400 uppercase mb-4">Result</h4>
                  <div className="space-y-4">
                    {ecefMode === 'blh_to_xyz' ? (
                      <>
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase mb-1">X (m)</div>
                          <div className="text-xl font-mono text-yellow-500">{ecefResult.x}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase mb-1">Y (m)</div>
                          <div className="text-xl font-mono text-yellow-500">{ecefResult.y}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase mb-1">Z (m)</div>
                          <div className="text-xl font-mono text-yellow-500">{ecefResult.z}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase mb-1">Latitude B</div>
                          <div className="text-xl font-mono text-yellow-500">{ecefResult.b}°</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase mb-1">Longitude L</div>
                          <div className="text-xl font-mono text-yellow-500">{ecefResult.l}°</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-500 uppercase mb-1">Ellipsoidal Height H (m)</div>
                          <div className="text-xl font-mono text-yellow-500">{ecefResult.h}</div>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function CRSExplorerTab() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="bg-[#222] p-4 border border-[#333] rounded-sm">
        <h3 className="text-sm font-bold text-yellow-500 uppercase mb-4 flex items-center gap-2"><Search className="w-4 h-4" /> CRS Database Explorer</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs text-gray-500 uppercase mb-2">Vietnam Systems (VN-2000)</h4>
            <div className="max-h-64 overflow-y-auto custom-scrollbar bg-[#1a1a1a] border border-[#333] p-2 space-y-1">
              {VN_PROVINCES.map(p => (
                <div key={p.id} className="text-xs p-2 hover:bg-[#222] cursor-pointer flex justify-between">
                  <span className="text-gray-300">{p.name}</span>
                  <span className="text-yellow-500 font-mono">CM: {p.cm}°</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs text-gray-500 uppercase mb-2">Global / US Systems</h4>
            <div className="max-h-64 overflow-y-auto custom-scrollbar bg-[#1a1a1a] border border-[#333] p-2 space-y-1">
              {EPSG_OPTIONS.map(opt => (
                <div key={opt.value} className="text-xs p-2 hover:bg-[#222] cursor-pointer flex justify-between">
                  <span className="text-gray-300">{opt.label}</span>
                  <span className="text-blue-400 font-mono">{opt.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
