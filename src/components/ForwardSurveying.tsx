import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Map, Compass, Crosshair, AlertTriangle, Plus, Trash2, ArrowRight, CheckCircle2, Calculator } from 'lucide-react';
import Decimal from 'decimal.js';

// Set precision high for geodetic calculations
Decimal.set({ precision: 70 });

const pi = new Decimal('3.1415926535897932384626433832795028419716939937510582097494459230781640628620899862803482534211706798214');
const RHO_SECONDS = new Decimal(648000).div(pi);

interface PointData {
  name: string;
  x: string;
  y: string;
}

interface Foresight {
  id: string;
  name: string;
  distance: string;
  angleD: string;
  angleM: string;
  angleS: string;
  turnType: 'right' | 'left';
  calcX?: string;
  calcY?: string;
  errorM?: string;
}

interface StationData {
  id: string;
  occupied: PointData;
  backsight: PointData;
  ms: string;
  mBeta: string;
  foresights: Foresight[];
}

export default function ForwardSurveying() {
  const [stations, setStations] = useState<StationData[]>([
    {
      id: 'st-1',
      occupied: { name: 'B', x: '', y: '' },
      backsight: { name: 'A', x: '', y: '' },
      ms: '2',
      mBeta: '3',
      foresights: [
        { id: 'fs-1', name: 'C', distance: '', angleD: '', angleM: '', angleS: '', turnType: 'right' }
      ]
    }
  ]);

  const [tolerance, setTolerance] = useState<string>('10'); // mm

  const calculateStation = (station: StationData): StationData => {
    try {
      const xA = new Decimal(station.backsight.x);
      const yA = new Decimal(station.backsight.y);
      const xB = new Decimal(station.occupied.x);
      const yB = new Decimal(station.occupied.y);
      const ms = new Decimal(station.ms);
      const mBeta = new Decimal(station.mBeta);

      // Alpha AB
      const dy = yB.minus(yA);
      const dx = xB.minus(xA);
      const alphaAB = Decimal.atan2(dy, dx);
      
      // Alpha BA
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
          
          // Normalize
          const twoPi = pi.times(2);
          alphaBC = alphaBC.mod(twoPi);
          if (alphaBC.isNegative()) alphaBC = alphaBC.plus(twoPi);

          const calcX = xB.plus(S.times(Decimal.cos(alphaBC)));
          const calcY = yB.plus(S.times(Decimal.sin(alphaBC)));

          // Error M = sqrt(ms^2 + (S * 1000 * mBeta / rho)^2)
          // Wait, S is in meters. S * 1000 is in mm.
          const s_mm = S.times(1000);
          const angularErrorTerm = s_mm.times(mBeta).div(RHO_SECONDS);
          const M = Decimal.sqrt(ms.pow(2).plus(angularErrorTerm.pow(2)));

          return {
            ...fs,
            calcX: calcX.toFixed(4),
            calcY: calcY.toFixed(4),
            errorM: M.toFixed(2)
          };
        } catch (e) {
          return fs;
        }
      });

      return { ...station, foresights: updatedForesights };
    } catch (e) {
      return station;
    }
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
      return {
        ...st,
        foresights: st.foresights.map(fs => fs.id === fsId ? { ...fs, [field]: value } : fs)
      };
    }));
  };

  const addForesight = (stationId: string) => {
    setStations(prev => prev.map(st => {
      if (st.id !== stationId) return st;
      const nextChar = String.fromCharCode(st.foresights.length > 0 ? st.foresights[st.foresights.length - 1].name.charCodeAt(0) + 1 : 67);
      return {
        ...st,
        foresights: [...st.foresights, {
          id: `fs-${Date.now()}`,
          name: nextChar,
          distance: '', angleD: '', angleM: '', angleS: '', turnType: 'right'
        }]
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
      ms: station.ms,
      mBeta: station.mBeta,
      foresights: [
        { id: `fs-${Date.now()}`, name: String.fromCharCode(fs.name.charCodeAt(0) + 1), distance: '', angleD: '', angleM: '', angleS: '', turnType: 'right' }
      ]
    };
    setStations(prev => [...prev, newStation]);
  };

  const checkCoordinates = (station: StationData, index: number) => {
    if (index === 0) {
      alert("This is the first station. No previous data to check against.");
      return;
    }
    const prevStation = stations[index - 1];
    const matchingFs = prevStation.foresights.find(fs => fs.name === station.occupied.name);
    
    if (!matchingFs || !matchingFs.calcX || !matchingFs.calcY) {
      alert(`Could not find calculated coordinates for point ${station.occupied.name} in the previous station.`);
      return;
    }

    const diffX = Math.abs(parseFloat(station.occupied.x) - parseFloat(matchingFs.calcX));
    const diffY = Math.abs(parseFloat(station.occupied.y) - parseFloat(matchingFs.calcY));
    
    if (diffX < 0.001 && diffY < 0.001) {
      alert(`✅ Coordinates match perfectly with previous calculation!\nCalculated: X=${matchingFs.calcX}, Y=${matchingFs.calcY}`);
    } else {
      alert(`❌ Coordinates mismatch!\nEntered: X=${station.occupied.x}, Y=${station.occupied.y}\nCalculated: X=${matchingFs.calcX}, Y=${matchingFs.calcY}\nDifference: dX=${diffX.toFixed(4)}, dY=${diffY.toFixed(4)}`);
    }
  };

  const removeStation = (id: string) => {
    setStations(prev => prev.filter(st => st.id !== id));
  };

  return (
    <div className="space-y-8">
      <div className="bg-[#1a1a1a] text-[#e0e0e0] p-6 rounded-sm border-l-4 border-yellow-500 shadow-xl font-mono">
        <div className="flex items-center gap-3 mb-4 border-b border-[#333] pb-4">
          <Crosshair className="w-8 h-8 text-yellow-500" />
          <div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-yellow-500">Topcon GM-Series Emulator</h2>
            <p className="text-xs text-gray-400">Forward Geodetic Calculation Module</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6 bg-[#2a2a2a] p-3 rounded-sm">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <div className="flex items-center gap-2 text-sm">
            <span>Tolerance (M) Threshold:</span>
            <input 
              type="number" 
              value={tolerance}
              onChange={(e) => setTolerance(e.target.value)}
              className="bg-[#111] border border-[#444] px-2 py-1 w-20 text-yellow-500 text-center focus:outline-none focus:border-yellow-500"
            />
            <span>mm</span>
          </div>
        </div>

        <div className="space-y-6">
          {stations.map((station, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={station.id} 
              className="bg-[#222] border border-[#333] rounded-sm overflow-hidden"
            >
              {/* Station Header */}
              <div className="bg-[#2a2a2a] p-3 flex justify-between items-center border-b border-[#333]">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-500 text-black font-bold px-2 py-1 text-xs">STN {index + 1}</div>
                  <span className="text-sm">OCC: {station.occupied.name} | BS: {station.backsight.name}</span>
                </div>
                {index > 0 && (
                  <button onClick={() => removeStation(station.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Base Points Input */}
                <div className="lg:col-span-4 space-y-4 border-r border-[#333] pr-6">
                  <h3 className="text-xs uppercase text-gray-400 font-bold tracking-wider mb-3">Base Coordinates</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-yellow-500">
                      <span>Backsight (BS)</span>
                      <input type="text" value={station.backsight.name} onChange={e => updateStation(station.id, 'backsight.name', e.target.value)} className="bg-transparent border-b border-[#444] w-12 text-right focus:outline-none focus:border-yellow-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-500">X (m)</label>
                        <input type="number" value={station.backsight.x} onChange={e => updateStation(station.id, 'backsight.x', e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" placeholder="0.000" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500">Y (m)</label>
                        <input type="number" value={station.backsight.y} onChange={e => updateStation(station.id, 'backsight.y', e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" placeholder="0.000" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-xs text-yellow-500">
                      <div className="flex items-center gap-2">
                        <span>Occupied (OCC)</span>
                        {index > 0 && (
                          <button 
                            onClick={() => checkCoordinates(station, index)}
                            className="bg-[#333] hover:bg-[#444] text-gray-300 px-2 py-0.5 rounded-sm flex items-center gap-1 text-[10px] transition-colors"
                            title="Check entered coordinates against previous calculation"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Check
                          </button>
                        )}
                      </div>
                      <input type="text" value={station.occupied.name} onChange={e => updateStation(station.id, 'occupied.name', e.target.value)} className="bg-transparent border-b border-[#444] w-12 text-right focus:outline-none focus:border-yellow-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-500">X (m)</label>
                        <input type="number" value={station.occupied.x} onChange={e => updateStation(station.id, 'occupied.x', e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" placeholder="0.000" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500">Y (m)</label>
                        <input type="number" value={station.occupied.y} onChange={e => updateStation(station.id, 'occupied.y', e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" placeholder="0.000" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#333]">
                    <h3 className="text-[10px] uppercase text-gray-500 mb-2">Instrument Errors</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-500">m_s (mm)</label>
                        <input type="number" value={station.ms} onChange={e => updateStation(station.id, 'ms', e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500">m_beta (")</label>
                        <input type="number" value={station.mBeta} onChange={e => updateStation(station.id, 'mBeta', e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Measurements */}
                <div className="lg:col-span-8">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs uppercase text-gray-400 font-bold tracking-wider">Foresight Measurements</h3>
                    <button onClick={() => addForesight(station.id)} className="text-xs flex items-center gap-1 bg-[#333] hover:bg-[#444] px-2 py-1 rounded-sm transition-colors">
                      <Plus className="w-3 h-3" /> Add Point
                    </button>
                  </div>

                  <div className="space-y-3">
                    {station.foresights.map((fs, idx) => {
                      const isErrorHigh = fs.errorM && parseFloat(fs.errorM) > parseFloat(tolerance || '9999');
                      
                      return (
                        <div key={fs.id} className="bg-[#1a1a1a] border border-[#333] p-3 relative group">
                          <div className="flex flex-wrap gap-4 items-end">
                            <div className="w-16">
                              <label className="text-[10px] text-gray-500 block mb-1">Point</label>
                              <input type="text" value={fs.name} onChange={e => updateForesight(station.id, fs.id, 'name', e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm text-center font-bold text-yellow-500 focus:outline-none focus:border-yellow-500" />
                            </div>
                            
                            <div className="w-24">
                              <label className="text-[10px] text-gray-500 block mb-1">Dist S (m)</label>
                              <input type="number" value={fs.distance} onChange={e => updateForesight(station.id, fs.id, 'distance', e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" placeholder="0.000" />
                            </div>

                            <div className="flex-1 min-w-[200px]">
                              <label className="text-[10px] text-gray-500 block mb-1">Angle Beta (D M S)</label>
                              <div className="flex gap-1">
                                <input type="number" value={fs.angleD} onChange={e => updateForesight(station.id, fs.id, 'angleD', e.target.value)} className="w-1/3 bg-[#111] border border-[#444] px-2 py-1 text-sm text-right focus:outline-none focus:border-yellow-500" placeholder="Deg" />
                                <input type="number" value={fs.angleM} onChange={e => updateForesight(station.id, fs.id, 'angleM', e.target.value)} className="w-1/3 bg-[#111] border border-[#444] px-2 py-1 text-sm text-right focus:outline-none focus:border-yellow-500" placeholder="Min" />
                                <input type="number" value={fs.angleS} onChange={e => updateForesight(station.id, fs.id, 'angleS', e.target.value)} className="w-1/3 bg-[#111] border border-[#444] px-2 py-1 text-sm text-right focus:outline-none focus:border-yellow-500" placeholder="Sec" />
                              </div>
                            </div>

                            <div className="w-24">
                              <label className="text-[10px] text-gray-500 block mb-1">Turn</label>
                              <select value={fs.turnType} onChange={e => updateForesight(station.id, fs.id, 'turnType', e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500">
                                <option value="right">Right (+)</option>
                                <option value="left">Left (-)</option>
                              </select>
                            </div>

                            {station.foresights.length > 1 && (
                              <button onClick={() => removeForesight(station.id, fs.id)} className="text-gray-600 hover:text-red-400 p-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Results Area */}
                          {fs.calcX && fs.calcY && (
                            <div className="mt-3 pt-3 border-t border-[#333] flex flex-wrap items-center justify-between gap-4 bg-[#111] p-2 rounded-sm">
                              <div className="flex gap-6">
                                <div>
                                  <span className="text-[10px] text-gray-500 mr-2">X:</span>
                                  <span className="text-green-400 font-bold">{fs.calcX}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-500 mr-2">Y:</span>
                                  <span className="text-green-400 font-bold">{fs.calcY}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-gray-500 mr-1">M:</span>
                                  <span className={`font-bold ${isErrorHigh ? 'text-red-500' : 'text-blue-400'}`}>{fs.errorM} mm</span>
                                  {isErrorHigh && <AlertTriangle className="w-3 h-3 text-red-500" />}
                                </div>
                              </div>
                              
                              <button 
                                onClick={() => createNextStation(station, fs)}
                                className="text-[10px] uppercase tracking-wider flex items-center gap-1 bg-yellow-500 text-black px-2 py-1 hover:bg-yellow-400 transition-colors"
                              >
                                Set as STN <ArrowRight className="w-3 h-3" />
                              </button>
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
    </div>
  );
}
