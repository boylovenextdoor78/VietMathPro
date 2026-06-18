import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Plus, Trash2, Calculator, Save } from 'lucide-react';
import Decimal from 'decimal.js';
import { useProject } from './ProjectContext';

Decimal.set({ precision: 70 });
const pi = new Decimal('3.1415926535897932384626433832795028419716939937510582097494459230781640628620899862803482534211706798214');

interface TraverseLeg {
  id: string;
  station: string;
  angle: string; // DDD.MMSS
  distance: string;
  m_s: string; // Distance precision (mm)
  m_beta: string; // Angular precision (seconds)
}

export default function TraverseModule() {
  const { addPoint, points, standardsPreset } = useProject();
  const [startPoint, setStartPoint] = useState({ name: 'BM1', x: '1000', y: '1000', azimuth: '45.0000' });
  const [legs, setLegs] = useState<TraverseLeg[]>([
    { id: 'leg-1', station: 'ST1', angle: '90.0000', distance: '100', m_s: '2', m_beta: '5' }
  ]);
  const [results, setResults] = useState<any[]>([]);
  const [networkStatus, setNetworkStatus] = useState<any>(null);

  const saveToMap = () => {
    let lastId = '';
    if (startPoint.name && startPoint.x && startPoint.y) {
      lastId = addPoint({ 
        name: startPoint.name, 
        x: parseFloat(startPoint.x), 
        y: parseFloat(startPoint.y), 
        source: 'Traverse',
        sourceMethod: 'Traverse Start',
        precisionClass: 'Class I',
        adjusted: false,
        parentControls: [],
        observationsUsed: 0
      });
    }
    results.forEach(r => {
      lastId = addPoint({ 
        name: r.station, 
        x: parseFloat(r.x), 
        y: parseFloat(r.y), 
        source: 'Traverse',
        sourceMethod: 'Traverse Leg',
        precisionClass: 'Computed',
        adjusted: false,
        parentControls: lastId ? [lastId] : [],
        observationsUsed: 2
      });
    });
  };

  const addLeg = () => {
    setLegs([...legs, { id: `leg-${Date.now()}`, station: `ST${legs.length + 1}`, angle: '', distance: '', m_s: '2', m_beta: '5' }]);
  };

  const removeLeg = (id: string) => {
    setLegs(legs.filter(l => l.id !== id));
  };

  const updateLeg = (id: string, field: string, value: string) => {
    setLegs(legs.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const parseAngle = (angleStr: string) => {
    if (!angleStr) return new Decimal(0);
    const parts = angleStr.split('.');
    const d = new Decimal(parts[0] || 0);
    const mStr = (parts[1] || '').padEnd(4, '0').substring(0, 2);
    const sStr = (parts[1] || '').padEnd(4, '0').substring(2, 4);
    const m = new Decimal(mStr);
    const s = new Decimal(sStr);
    return d.plus(m.div(60)).plus(s.div(3600));
  };

  const calculateTraverse = () => {
    try {
      let currentX = new Decimal(startPoint.x);
      let currentY = new Decimal(startPoint.y);
      let currentAzimuthDeg = parseAngle(startPoint.azimuth);

      const newResults = [];
      let cumulativeErrorSq = new Decimal(0);
      const RHO_SECONDS = new Decimal(648000).div(pi);

      // Network Intelligence Check
      const startIsControl = points.some(p => p.name === startPoint.name && p.isControl);
      let controlCount = startIsControl ? 1 : 0;
      let endIsControl = false;

      for (let i = 0; i < legs.length; i++) {
        const leg = legs[i];
        if (!leg.distance || !leg.angle) break;

        const isControl = points.some(p => p.name === leg.station && p.isControl);
        if (isControl) {
          controlCount++;
          if (i === legs.length - 1) endIsControl = true;
        }

        const angleDeg = parseAngle(leg.angle);
        const dist = new Decimal(leg.distance);
        const m_s = new Decimal(leg.m_s || '2').div(1000); // mm to m
        const m_beta = new Decimal(leg.m_beta || '5'); // seconds

        // Update azimuth (assuming angle to the right)
        currentAzimuthDeg = currentAzimuthDeg.plus(angleDeg).minus(180);
        if (currentAzimuthDeg.isNegative()) currentAzimuthDeg = currentAzimuthDeg.plus(360);
        if (currentAzimuthDeg.gte(360)) currentAzimuthDeg = currentAzimuthDeg.minus(360);

        const azimuthRad = currentAzimuthDeg.times(pi).div(180);

        const dx = dist.times(Decimal.sin(azimuthRad));
        const dy = dist.times(Decimal.cos(azimuthRad));

        currentX = currentX.plus(dx);
        currentY = currentY.plus(dy);

        // Error propagation: m_p^2 = m_s^2 + (S * m_beta / rho)^2
        const angularErrorTerm = dist.times(m_beta).div(RHO_SECONDS);
        const legErrorSq = m_s.pow(2).plus(angularErrorTerm.pow(2));
        cumulativeErrorSq = cumulativeErrorSq.plus(legErrorSq);
        const currentM_p = cumulativeErrorSq.sqrt();

        newResults.push({
          station: leg.station,
          azimuth: currentAzimuthDeg.toFixed(4),
          dx: dx.toFixed(4),
          dy: dy.toFixed(4),
          x: currentX.toFixed(4),
          y: currentY.toFixed(4),
          m_p: currentM_p.toFixed(4)
        });
      }
      
      setResults(newResults);

      // Determine Network Status
      let status = 'Open Traverse';
      let reliability = 'Moderate';
      let solver = 'Forward Propagation';

      if (controlCount >= 4) {
        status = 'Overconstrained Direct Sequence';
        reliability = 'Low (Invalid Topology)';
        solver = 'Requires Network Adjustment';
      } else if (startIsControl && endIsControl) {
        status = 'Double-ended Controlled Traverse';
        reliability = 'High';
        solver = 'Least Squares (Recommended) / Bowditch';
      } else if (startIsControl && controlCount === 1) {
        status = 'Hanging Traverse';
        reliability = 'Low';
      }

      setNetworkStatus({
        controls: controlCount,
        unknowns: legs.length - (controlCount - (startIsControl ? 1 : 0)),
        status,
        reliability,
        solver
      });

    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 text-gray-300">
      <div className="bg-[#222] border border-[#333] p-4 rounded-sm">
        <h3 className="text-xs uppercase text-yellow-500 font-bold tracking-wider mb-4 border-b border-[#333] pb-2">Starting Control</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Point Name</label>
            <input type="text" value={startPoint.name} onChange={e => setStartPoint({...startPoint, name: e.target.value})} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Easting (X)</label>
            <input type="number" value={startPoint.x} onChange={e => setStartPoint({...startPoint, x: e.target.value})} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Northing (Y)</label>
            <input type="number" value={startPoint.y} onChange={e => setStartPoint({...startPoint, y: e.target.value})} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Initial Azimuth (DDD.MMSS)</label>
            <input type="number" value={startPoint.azimuth} onChange={e => setStartPoint({...startPoint, azimuth: e.target.value})} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
          </div>
        </div>
      </div>

      <div className="bg-[#222] border border-[#333] p-4 rounded-sm">
        <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-2">
          <h3 className="text-xs uppercase text-yellow-500 font-bold tracking-wider">Traverse Legs</h3>
          <button onClick={addLeg} className="text-xs flex items-center gap-1 bg-[#333] hover:bg-[#444] px-2 py-1 rounded-sm transition-colors">
            <Plus className="w-3 h-3" /> Add Leg
          </button>
        </div>
        
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-[10px] text-gray-500 uppercase tracking-wider px-2">
            <div className="col-span-2">To Station</div>
            <div className="col-span-3">Angle Right (DDD.MMSS)</div>
            <div className="col-span-3">Distance (m)</div>
            <div className="col-span-1" title="Distance Error (mm)">m_s (mm)</div>
            <div className="col-span-2" title="Angular Error (seconds)">m_beta (")</div>
            <div className="col-span-1"></div>
          </div>
          
          {legs.map((leg, idx) => (
            <div key={leg.id} className="grid grid-cols-12 gap-2 items-center bg-[#1a1a1a] p-2 border border-[#333]">
              <div className="col-span-2">
                <input type="text" value={leg.station} onChange={e => updateLeg(leg.id, 'station', e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
              </div>
              <div className="col-span-3">
                <input type="number" value={leg.angle} onChange={e => updateLeg(leg.id, 'angle', e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" placeholder="e.g. 90.1530" />
              </div>
              <div className="col-span-3">
                <input type="number" value={leg.distance} onChange={e => updateLeg(leg.id, 'distance', e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
              </div>
              <div className="col-span-1">
                <input type="number" value={leg.m_s} onChange={e => updateLeg(leg.id, 'm_s', e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" placeholder="2" />
              </div>
              <div className="col-span-2">
                <input type="number" value={leg.m_beta} onChange={e => updateLeg(leg.id, 'm_beta', e.target.value)} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" placeholder="5" />
              </div>
              <div className="col-span-1 flex justify-center">
                <button onClick={() => removeLeg(leg.id)} className="text-gray-600 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-between items-center">
          {networkStatus && (
            <div className="text-[10px] text-gray-400 flex gap-4">
              <span>Status: <strong className={networkStatus.reliability === 'High' ? 'text-green-400' : 'text-yellow-500'}>{networkStatus.status}</strong></span>
              <span>Controls: <strong>{networkStatus.controls}</strong></span>
              <span>Solver: <strong>{networkStatus.solver}</strong></span>
            </div>
          )}
          <button onClick={calculateTraverse} className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 font-bold hover:bg-yellow-400 transition-colors rounded-sm text-sm ml-auto">
            <Calculator className="w-4 h-4" /> Compute Traverse
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1a1a1a] border border-[#333] p-4 rounded-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs uppercase text-white font-bold tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-yellow-500" /> Traverse Results
            </h3>
            <button onClick={saveToMap} className="flex items-center gap-2 bg-[#333] text-gray-300 px-3 py-1 text-xs uppercase tracking-wider hover:bg-[#444] transition-colors rounded-sm">
              <Save className="w-4 h-4" /> Save Points to Map
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase text-gray-500 bg-[#222] border-b border-[#333]">
                <tr>
                  <th className="px-4 py-2">Station</th>
                  <th className="px-4 py-2">Azimuth</th>
                  <th className="px-4 py-2">Δ Easting</th>
                  <th className="px-4 py-2">Δ Northing</th>
                  <th className="px-4 py-2 text-green-400">Easting (X)</th>
                  <th className="px-4 py-2 text-green-400">Northing (Y)</th>
                  <th className="px-4 py-2 text-red-400">m_p (m)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#222]">
                  <td className="px-4 py-2 font-bold text-yellow-500">{startPoint.name}</td>
                  <td className="px-4 py-2">-</td>
                  <td className="px-4 py-2">-</td>
                  <td className="px-4 py-2">-</td>
                  <td className="px-4 py-2 font-mono">{startPoint.x}</td>
                  <td className="px-4 py-2 font-mono">{startPoint.y}</td>
                  <td className="px-4 py-2 font-mono">0.0000</td>
                </tr>
                {results.map((r, i) => (
                  <tr key={i} className="border-b border-[#222] hover:bg-[#222]">
                    <td className="px-4 py-2 font-bold text-yellow-500">{r.station}</td>
                    <td className="px-4 py-2 font-mono">{r.azimuth}°</td>
                    <td className="px-4 py-2 font-mono">{r.dx}</td>
                    <td className="px-4 py-2 font-mono">{r.dy}</td>
                    <td className="px-4 py-2 font-mono text-green-400">{r.x}</td>
                    <td className="px-4 py-2 font-mono text-green-400">{r.y}</td>
                    <td className="px-4 py-2 font-mono text-red-400">±{r.m_p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
