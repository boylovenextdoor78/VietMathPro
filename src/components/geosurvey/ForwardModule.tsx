import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Crosshair, AlertTriangle, Plus, Trash2, ArrowRight, CheckCircle2, Save } from 'lucide-react';
import Decimal from 'decimal.js';
import { useProject } from './ProjectContext';

Decimal.set({ precision: 70 });
const pi = new Decimal('3.1415926535897932384626433832795028419716939937510582097494459230781640628620899862803482534211706798214');
const RHO_SECONDS = new Decimal(648000).div(pi);

interface PointData { name: string; x: string; y: string; }
interface Foresight {
  id: string; name: string; distance: string; angleD: string; angleM: string; angleS: string;
  turnType: 'right' | 'left'; calcX?: string; calcY?: string; errorM?: string;
}
interface StationData {
  id: string; occupied: PointData; backsight: PointData; ms: string; mBeta: string; foresights: Foresight[];
}

export default function ForwardModule() {
  const { addPoint, addLine, points } = useProject();
  const [stations, setStations] = useState<StationData[]>([
    {
      id: 'st-1',
      occupied: { name: 'B', x: '', y: '' },
      backsight: { name: 'A', x: '', y: '' },
      ms: '2', mBeta: '3',
      foresights: [{ id: 'fs-1', name: 'C', distance: '', angleD: '', angleM: '', angleS: '', turnType: 'right' }]
    }
  ]);

  const isControlPoint = (name: string) => {
    return points.some(p => p.name === name && p.isControl);
  };
  const [tolerance, setTolerance] = useState<string>('10');
  const [precisionMode, setPrecisionMode] = useState<'standard' | 'high' | 'engineering' | 'ultra'>('standard');

  const getPrecision = () => {
    switch (precisionMode) {
      case 'ultra': return { coord: 25, dist: 25, angle: 25 };
      case 'engineering': return { coord: 5, dist: 4, angle: 2 };
      case 'high': return { coord: 4, dist: 4, angle: 1 };
      case 'standard': default: return { coord: 3, dist: 3, angle: 0 };
    }
  };

  const calculateStation = (station: StationData): StationData => {
    try {
      const xA = new Decimal(station.backsight.x);
      const yA = new Decimal(station.backsight.y);
      const xB = new Decimal(station.occupied.x);
      const yB = new Decimal(station.occupied.y);
      const ms = new Decimal(station.ms);
      const mBeta = new Decimal(station.mBeta);

      const dy = yB.minus(yA);
      const dx = xB.minus(xA);
      const alphaAB = Decimal.atan2(dy, dx);
      
      let alphaBA = alphaAB.plus(pi);
      if (alphaBA.gte(pi.times(2))) alphaBA = alphaBA.minus(pi.times(2));

      const updatedForesights = station.foresights.map(fs => {
        if (!fs.distance || !fs.angleD) return fs;
        try {
          const S = new Decimal(fs.distance);
          const d = new Decimal(fs.angleD || 0);
          const m = new Decimal(fs.angleM || 0);
          const s = new Decimal(fs.angleS || 0);
          
          const totalSeconds = d.times(3600).plus(m.times(60)).plus(s);
          const betaRad = totalSeconds.div(RHO_SECONDS);

          let alphaBC = fs.turnType === 'right' ? alphaBA.plus(betaRad) : alphaBA.minus(betaRad);
          
          const twoPi = pi.times(2);
          alphaBC = alphaBC.mod(twoPi);
          if (alphaBC.isNegative()) alphaBC = alphaBC.plus(twoPi);

          const calcX = xB.plus(S.times(Decimal.cos(alphaBC)));
          const calcY = yB.plus(S.times(Decimal.sin(alphaBC)));

          const s_mm = S.times(1000);
          const angularErrorTerm = s_mm.times(mBeta).div(RHO_SECONDS);
          const M = Decimal.sqrt(ms.pow(2).plus(angularErrorTerm.pow(2)));

          const prec = getPrecision();
          return { ...fs, calcX: calcX.toFixed(prec.coord), calcY: calcY.toFixed(prec.coord), errorM: M.toFixed(2) };
        } catch (e) { return fs; }
      });

      return { ...station, foresights: updatedForesights };
    } catch (e) { return station; }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setStations(prev => prev.map(st => calculateStation(st)));
    }, 300);
    return () => clearTimeout(timer);
  }, [stations.map(s => JSON.stringify(s.occupied) + JSON.stringify(s.backsight) + s.ms + s.mBeta + JSON.stringify(s.foresights.map(f => f.distance + f.angleD + f.angleM + f.angleS + f.turnType))).join('|')]);

  const updateStation = (id: string, field: string, value: any) => {
    setStations(prev => prev.map(st => {
      if (st.id !== id) return st;
      if (field.includes('.')) {
        const [obj, prop] = field.split('.');
        return { ...st, [obj]: { ...(st as any)[obj], [prop]: value } };
      }
      return { ...st, [field]: value };
    }));
  };

  const updateForesight = (stationId: string, fsId: string, field: string, value: any) => {
    setStations(prev => prev.map(st => {
      if (st.id !== stationId) return st;
      return { ...st, foresights: st.foresights.map(fs => fs.id === fsId ? { ...fs, [field]: value } : fs) };
    }));
  };

  const addForesight = (stationId: string) => {
    setStations(prev => prev.map(st => {
      if (st.id !== stationId) return st;
      const nextChar = String.fromCharCode(st.foresights.length > 0 ? st.foresights[st.foresights.length - 1].name.charCodeAt(0) + 1 : 67);
      return {
        ...st,
        foresights: [...st.foresights, { id: `fs-${Date.now()}`, name: nextChar, distance: '', angleD: '', angleM: '', angleS: '', turnType: 'right' }]
      };
    }));
  };

  const removeForesight = (stationId: string, fsId: string) => {
    setStations(prev => prev.map(st => {
      if (st.id !== stationId) return st;
      return { ...st, foresights: st.foresights.filter(fs => fs.id !== fsId) };
    }));
  };

  const createNextStation = (station: StationData, fs: Foresight) => {
    if (!fs.calcX || !fs.calcY) return;
    const newStation: StationData = {
      id: `st-${Date.now()}`,
      occupied: { name: fs.name, x: fs.calcX, y: fs.calcY },
      backsight: { name: station.occupied.name, x: station.occupied.x, y: station.occupied.y },
      ms: station.ms, mBeta: station.mBeta,
      foresights: [{ id: `fs-${Date.now()}`, name: String.fromCharCode(fs.name.charCodeAt(0) + 1), distance: '', angleD: '', angleM: '', angleS: '', turnType: 'right' }]
    };
    setStations(prev => [...prev, newStation]);
  };

  const checkCoordinates = (station: StationData, index: number) => {
    if (index === 0) { alert("This is the first station. No previous data to check against."); return; }
    const prevStation = stations[index - 1];
    const matchingFs = prevStation.foresights.find(fs => fs.name === station.occupied.name);
    if (!matchingFs || !matchingFs.calcX || !matchingFs.calcY) {
      alert(`Could not find calculated coordinates for point ${station.occupied.name} in the previous station.`); return;
    }
    const diffX = Math.abs(parseFloat(station.occupied.x) - parseFloat(matchingFs.calcX));
    const diffY = Math.abs(parseFloat(station.occupied.y) - parseFloat(matchingFs.calcY));
    if (diffX < 0.001 && diffY < 0.001) {
      alert(`✅ Coordinates match perfectly with previous calculation!\nCalculated: X=${matchingFs.calcX}, Y=${matchingFs.calcY}`);
    } else {
      alert(`❌ Coordinates mismatch!\nEntered: X=${station.occupied.x}, Y=${station.occupied.y}\nCalculated: X=${matchingFs.calcX}, Y=${matchingFs.calcY}\nDifference: dX=${diffX.toFixed(4)}, dY=${diffY.toFixed(4)}`);
    }
  };

  const removeStation = (id: string) => { setStations(prev => prev.filter(st => st.id !== id)); };

  const saveToProject = (station: StationData, fs: Foresight) => {
    if (station.backsight.name && station.backsight.x && station.backsight.y) {
      const bsId = addPoint({ 
        name: station.backsight.name, 
        x: parseFloat(station.backsight.x), 
        y: parseFloat(station.backsight.y), 
        source: 'Control', 
        type: 'known',
        sourceMethod: 'Forward Survey (BS)',
        precisionClass: 'Class I',
        adjusted: false,
        parentControls: [],
        observationsUsed: 0
      });
      if (station.occupied.name && station.occupied.x && station.occupied.y) {
        const occId = addPoint({ 
          name: station.occupied.name, 
          x: parseFloat(station.occupied.x), 
          y: parseFloat(station.occupied.y), 
          source: 'Control', 
          type: 'known',
          sourceMethod: 'Forward Survey (OCC)',
          precisionClass: 'Class I',
          adjusted: false,
          parentControls: [bsId],
          observationsUsed: 1
        });
        addLine({ startPointId: bsId, endPointId: occId, type: 'baseline' });
        
        if (fs.name && fs.calcX && fs.calcY) {
          const fsId = addPoint({ 
            name: fs.name, 
            x: parseFloat(fs.calcX), 
            y: parseFloat(fs.calcY), 
            source: 'Forward', 
            type: 'computed',
            sourceMethod: 'Forward Intersection',
            precisionClass: 'Computed',
            adjusted: false,
            parentControls: [occId, bsId],
            observationsUsed: 2
          });
          addLine({ startPointId: occId, endPointId: fsId, type: 'traverse' });
        }
      }
    }
  };

  return (
    <div className="space-y-6 text-black">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-stone-100 p-3 rounded-sm border-2 border-[#141414] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
        <div className="flex items-center gap-4">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <div className="flex items-center gap-2 text-sm text-black font-bold">
            <span>Tolerance (M) Threshold:</span>
            <input type="number" value={tolerance} onChange={(e) => setTolerance(e.target.value)} className="bg-white border-2 border-[#141414] px-2 py-1 w-20 text-yellow-600 text-center focus:outline-none focus:bg-yellow-50" />
            <span>mm</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-black uppercase tracking-wider font-bold">Precision Mode</label>
          <select 
            value={precisionMode} 
            onChange={(e) => setPrecisionMode(e.target.value as any)}
            className="bg-white border-2 border-[#141414] text-xs text-black font-bold px-2 py-1 focus:outline-none focus:bg-yellow-50"
          >
            <option value="standard">Standard (0.001m)</option>
            <option value="high">High (0.0001m)</option>
            <option value="engineering">Engineering (0.00001m)</option>
            <option value="ultra">Ultra (25 digits)</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {stations.map((station, index) => (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={station.id} className="bg-white border-2 border-[#141414] rounded-sm overflow-hidden shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <div className="bg-stone-100 p-3 flex justify-between items-center border-b-2 border-[#141414]">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-400 text-black font-bold px-2 py-1 text-xs border-2 border-[#141414]">STN {index + 1}</div>
                <span className="text-sm text-black font-bold">OCC: {station.occupied.name} | BS: {station.backsight.name}</span>
              </div>
              {index > 0 && (
                <button onClick={() => removeStation(station.id)} className="text-red-600 hover:text-red-800 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>

            <div className="p-4 grid grid-cols-1 xl:grid-cols-12 gap-6 text-black bg-white">
              <div className="xl:col-span-4 space-y-4 border-b-2 xl:border-b-0 xl:border-r-2 border-[#141414] pb-6 xl:pb-0 pr-0 xl:pr-6">
                <h3 className="text-xs uppercase text-black font-bold tracking-wider mb-3">Base Coordinates</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-black font-bold max-w-[260px]">
                    <span className="flex items-center gap-1 text-[11px]">
                      Backsight (BS)
                      {isControlPoint(station.backsight.name) && <span className="w-3 h-3 bg-yellow-400 border border-[#141414] inline-block ml-1" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} title="Control Point"></span>}
                    </span>
                    <input type="text" value={station.backsight.name} onChange={e => updateStation(station.id, 'backsight.name', e.target.value)} className="bg-transparent border-b-2 border-[#141414] w-12 text-right focus:outline-none focus:bg-yellow-50 font-bold" />
                  </div>
                  <div className="flex gap-2 max-w-[260px]">
                    <div className="w-1/2"><label className="text-[9px] text-gray-500 font-bold block mb-0.5">X (m)</label><input type="number" value={station.backsight.x} onChange={e => updateStation(station.id, 'backsight.x', e.target.value)} className="w-full bg-white border-2 border-[#141414] px-1.5 py-0.5 text-xs font-bold text-black focus:outline-none focus:bg-yellow-50" placeholder="0.000" /></div>
                    <div className="w-1/2"><label className="text-[9px] text-gray-500 font-bold block mb-0.5">Y (m)</label><input type="number" value={station.backsight.y} onChange={e => updateStation(station.id, 'backsight.y', e.target.value)} className="w-full bg-white border-2 border-[#141414] px-1.5 py-0.5 text-xs font-bold text-black focus:outline-none focus:bg-yellow-50" placeholder="0.000" /></div>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-xs text-black font-bold max-w-[260px]">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px]">
                        Occupied (OCC)
                        {isControlPoint(station.occupied.name) && <span className="w-3 h-3 bg-yellow-400 border border-[#141414] inline-block ml-1" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} title="Control Point"></span>}
                      </span>
                      {index > 0 && (
                        <button onClick={() => checkCoordinates(station, index)} className="bg-stone-100 hover:bg-stone-200 text-black border border-[#141414] px-1.5 py-0.5 rounded-sm flex items-center gap-1 text-[9px] transition-all font-bold cursor-pointer" title="Check entered coordinates against previous calculation"><CheckCircle2 className="w-2.5 h-2.5" /> Check</button>
                      )}
                    </div>
                    <input type="text" value={station.occupied.name} onChange={e => updateStation(station.id, 'occupied.name', e.target.value)} className="bg-transparent border-b-2 border-[#141414] w-12 text-right focus:outline-none focus:bg-yellow-50 font-bold" />
                  </div>
                  <div className="flex gap-2 max-w-[260px]">
                    <div className="w-1/2"><label className="text-[9px] text-gray-500 font-bold block mb-0.5">X (m)</label><input type="number" value={station.occupied.x} onChange={e => updateStation(station.id, 'occupied.x', e.target.value)} className="w-full bg-white border-2 border-[#141414] px-1.5 py-0.5 text-xs font-bold text-black focus:outline-none focus:bg-yellow-50" placeholder="0.000" /></div>
                    <div className="w-1/2"><label className="text-[9px] text-gray-500 font-bold block mb-0.5">Y (m)</label><input type="number" value={station.occupied.y} onChange={e => updateStation(station.id, 'occupied.y', e.target.value)} className="w-full bg-white border-2 border-[#141414] px-1.5 py-0.5 text-xs font-bold text-black focus:outline-none focus:bg-yellow-50" placeholder="0.000" /></div>
                  </div>
                </div>
                <div className="pt-4 border-t-2 border-[#141414] max-w-[260px]">
                  <h3 className="text-[10px] uppercase text-black font-bold mb-2">Instrument Errors</h3>
                  <div className="flex gap-2">
                    <div className="w-1/2"><label className="text-[9px] text-gray-500 font-bold block mb-0.5">m_s (mm)</label><input type="number" value={station.ms} onChange={e => updateStation(station.id, 'ms', e.target.value)} className="w-full bg-white border-2 border-[#141414] px-1.5 py-0.5 text-xs font-bold text-black focus:outline-none focus:bg-yellow-50" /></div>
                    <div className="w-1/2"><label className="text-[9px] text-gray-500 font-bold block mb-0.5">m_beta (")</label><input type="number" value={station.mBeta} onChange={e => updateStation(station.id, 'mBeta', e.target.value)} className="w-full bg-white border-2 border-[#141414] px-1.5 py-0.5 text-xs font-bold text-black focus:outline-none focus:bg-yellow-50" /></div>
                  </div>
                </div>
              </div>

              <div className="xl:col-span-8">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs uppercase text-black font-bold tracking-wider">Foresight Measurements</h3>
                  <button onClick={() => addForesight(station.id)} className="text-xs flex items-center gap-1 bg-stone-100 border-2 border-[#141414] hover:bg-stone-200 px-2 py-1 rounded-sm transition-all text-black font-bold shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] cursor-pointer"><Plus className="w-3 h-3" /> Add Point</button>
                </div>
                <div className="space-y-3">
                  {station.foresights.map((fs, idx) => {
                    const isErrorHigh = fs.errorM && parseFloat(fs.errorM) > parseFloat(tolerance || '9999');
                    return (
                      <div key={fs.id} className="bg-stone-50 border-2 border-[#141414] p-3 relative group shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
                        <div className="flex flex-wrap gap-3 items-end">
                          <div className="w-[80px]">
                            <label className="text-[10px] text-black font-bold block mb-1">Point</label>
                            <input type="text" value={fs.name} onChange={e => updateForesight(station.id, fs.id, 'name', e.target.value)} className="w-full bg-white border-2 border-[#141414] px-1.5 py-0.5 text-xs text-center font-bold text-yellow-600 focus:outline-none focus:bg-yellow-50" />
                          </div>
                          <div className="w-[110px]">
                            <label className="text-[10px] text-black font-bold block mb-1">Dist S (m)</label>
                            <input type="number" value={fs.distance} onChange={e => updateForesight(station.id, fs.id, 'distance', e.target.value)} className="w-full bg-white border-2 border-[#141414] px-1.5 py-0.5 text-xs font-bold focus:outline-none focus:bg-yellow-50" placeholder="0.000" />
                          </div>
                          <div className="w-[180px]">
                            <label className="text-[10px] text-black font-bold block mb-1">Angle Beta (D M S)</label>
                            <div className="grid grid-cols-3 gap-0.5">
                              <input type="number" value={fs.angleD} onChange={e => updateForesight(station.id, fs.id, 'angleD', e.target.value)} className="min-w-0 w-full bg-white border-2 border-[#141414] px-1 py-0.5 text-xs font-bold text-right focus:outline-none focus:bg-yellow-50" placeholder="Deg" />
                              <input type="number" value={fs.angleM} onChange={e => updateForesight(station.id, fs.id, 'angleM', e.target.value)} className="min-w-0 w-full bg-white border-2 border-[#141414] px-1 py-0.5 text-xs font-bold text-right focus:outline-none focus:bg-yellow-50" placeholder="Min" />
                              <input type="number" value={fs.angleS} onChange={e => updateForesight(station.id, fs.id, 'angleS', e.target.value)} className="min-w-0 w-full bg-white border-2 border-[#141414] px-1 py-0.5 text-xs font-bold text-right focus:outline-none focus:bg-yellow-50" placeholder="Sec" />
                            </div>
                          </div>
                          <div className="w-[110px]">
                            <label className="text-[10px] text-black font-bold block mb-1" title="Quick parse format: DDD.MMSS (e.g. 125.0512 is 125°05'12&quot;)">Quick Input</label>
                            <input type="text" placeholder="125.0512" onBlur={(e) => {
                              const val = e.target.value;
                              if (!val) return;
                              const parts = val.split('.');
                              if (parts.length === 2) {
                                const d = parts[0];
                                const m = parts[1].substring(0, 2).padEnd(2, '0');
                                const s = parts[1].substring(2, 4).padEnd(2, '0');
                                updateForesight(station.id, fs.id, 'angleD', d);
                                updateForesight(station.id, fs.id, 'angleM', m);
                                updateForesight(station.id, fs.id, 'angleS', s);
                                e.target.value = '';
                              }
                            }} className="w-full bg-white border-2 border-[#141414] px-1.5 py-0.5 text-xs font-bold focus:outline-none focus:bg-yellow-50" />
                          </div>
                          <div className="w-[140px] flex gap-1.5 items-end">
                            <div className="flex-1">
                              <label className="text-[10px] text-black font-bold block mb-1">Turn</label>
                              <select value={fs.turnType} onChange={e => updateForesight(station.id, fs.id, 'turnType', e.target.value)} className="w-full bg-white border-2 border-[#141414] px-1.5 py-0.5 text-xs font-bold focus:outline-none focus:bg-yellow-50 text-black">
                                <option value="right">Right (+)</option>
                                <option value="left">Left (-)</option>
                              </select>
                            </div>
                            {station.foresights.length > 1 && (
                              <button onClick={() => removeForesight(station.id, fs.id)} className="text-gray-600 hover:text-red-600 p-1 border-2 border-[#141414] hover:bg-red-50 rounded-sm cursor-pointer mb-[1px]">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        {fs.calcX && fs.calcY && (
                          <div className="mt-3 pt-3 border-t-2 border-[#141414] flex flex-wrap items-center justify-between gap-4 bg-yellow-50 border-2 border-[#141414] p-2 rounded-sm shadow-[1px_1px_0px_0px_rgba(20,20,20,1)]">
                            <div className="flex gap-6">
                              <div><span className="text-[10px] text-black font-bold mr-2">X:</span><span className="text-green-700 font-bold font-mono">{fs.calcX}</span></div>
                              <div><span className="text-[10px] text-black font-bold mr-2">Y:</span><span className="text-green-700 font-bold font-mono">{fs.calcY}</span></div>
                              <div className="flex items-center gap-1"><span className="text-[10px] text-black font-bold mr-1">M:</span><span className={`font-bold font-mono ${isErrorHigh ? 'text-red-600' : 'text-blue-600'}`}>{fs.errorM} mm</span>{isErrorHigh && <AlertTriangle className="w-3 h-3 text-red-600 animate-pulse" />}</div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => saveToProject(station, fs)} className="text-[10px] uppercase tracking-wider flex items-center gap-1 bg-white text-black border-2 border-[#141414] px-2 py-1 hover:bg-stone-50 transition-all font-bold shadow-[1px_1px_0px_0px_rgba(20,20,20,1)] cursor-pointer"><Save className="w-3 h-3" /> Save to Map</button>
                              <button onClick={() => createNextStation(station, fs)} className="text-[10px] uppercase tracking-wider flex items-center gap-1 bg-yellow-400 border-2 border-[#141414] text-black px-2 py-1 hover:bg-yellow-500 transition-all font-bold shadow-[1px_1px_0px_0px_rgba(20,20,20,1)] cursor-pointer">Set as STN <ArrowRight className="w-3 h-3" /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
