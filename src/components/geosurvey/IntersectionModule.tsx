import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Crosshair, Save } from 'lucide-react';
import Decimal from 'decimal.js';
import { useProject } from './ProjectContext';

Decimal.set({ precision: 70 });
const pi = new Decimal('3.1415926535897932384626433832795028419716939937510582097494459230781640628620899862803482534211706798214');

export default function IntersectionModule() {
  const { addPoint } = useProject();
  const [pointA, setPointA] = useState({ name: 'A', x: '1000', y: '1000' });
  const [pointB, setPointB] = useState({ name: 'B', x: '2000', y: '1000' });
  const [obsA, setObsA] = useState({ type: 'angle', value: '45.0000' }); // angle or distance
  const [obsB, setObsB] = useState({ type: 'angle', value: '315.0000' });
  const [result, setResult] = useState<any>(null);

  const saveToMap = () => {
    let idA = '';
    let idB = '';
    if (pointA.name && pointA.x && pointA.y) {
      idA = addPoint({ 
        name: pointA.name, 
        x: parseFloat(pointA.x), 
        y: parseFloat(pointA.y), 
        source: 'Intersection',
        sourceMethod: 'Intersection Base A',
        precisionClass: 'Class I',
        adjusted: false,
        parentControls: [],
        observationsUsed: 0
      });
    }
    if (pointB.name && pointB.x && pointB.y) {
      idB = addPoint({ 
        name: pointB.name, 
        x: parseFloat(pointB.x), 
        y: parseFloat(pointB.y), 
        source: 'Intersection',
        sourceMethod: 'Intersection Base B',
        precisionClass: 'Class I',
        adjusted: false,
        parentControls: [],
        observationsUsed: 0
      });
    }
    if (result && result.x && result.y) {
      addPoint({ 
        name: 'Intersection Point', 
        x: parseFloat(result.x), 
        y: parseFloat(result.y), 
        source: 'Intersection',
        sourceMethod: 'Intersection Calculation',
        precisionClass: 'Computed',
        adjusted: false,
        parentControls: [idA, idB].filter(Boolean),
        observationsUsed: 2
      });
    }
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

  const calculateIntersection = () => {
    try {
      const xA = new Decimal(pointA.x);
      const yA = new Decimal(pointA.y);
      const xB = new Decimal(pointB.x);
      const yB = new Decimal(pointB.y);

      if (obsA.type === 'angle' && obsB.type === 'angle') {
        // Angular Intersection (Bearing-Bearing)
        const azA_deg = parseAngle(obsA.value);
        const azB_deg = parseAngle(obsB.value);
        
        const azA_rad = azA_deg.times(pi).div(180);
        const azB_rad = azB_deg.times(pi).div(180);

        // x = xA + sA * sin(azA)
        // y = yA + sA * cos(azA)
        // x = xB + sB * sin(azB)
        // y = yB + sB * cos(azB)
        
        // sA * sin(azA) - sB * sin(azB) = xB - xA
        // sA * cos(azA) - sB * cos(azB) = yB - yA

        const sinA = Decimal.sin(azA_rad);
        const cosA = Decimal.cos(azA_rad);
        const sinB = Decimal.sin(azB_rad);
        const cosB = Decimal.cos(azB_rad);

        const det = sinA.times(cosB.neg()).minus(cosA.times(sinB.neg()));
        
        if (det.abs().lt(1e-10)) {
          alert("Lines are parallel or nearly parallel. Cannot compute intersection.");
          return;
        }

        const dx = xB.minus(xA);
        const dy = yB.minus(yA);

        const sA = dx.times(cosB.neg()).minus(dy.times(sinB.neg())).div(det);
        
        const xP = xA.plus(sA.times(sinA));
        const yP = yA.plus(sA.times(cosA));

        setResult({
          type: 'Angular Intersection',
          x: xP.toFixed(4),
          y: yP.toFixed(4)
        });
      } else {
        alert("Only Angular Intersection is implemented in this preview.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 text-gray-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#222] border border-[#333] p-4 rounded-sm">
          <h3 className="text-xs uppercase text-yellow-500 font-bold tracking-wider mb-4 border-b border-[#333] pb-2">Point A</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Name</label>
              <input type="text" value={pointA.name} onChange={e => setPointA({...pointA, name: e.target.value})} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Easting (X)</label>
                <input type="number" value={pointA.x} onChange={e => setPointA({...pointA, x: e.target.value})} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Northing (Y)</label>
                <input type="number" value={pointA.y} onChange={e => setPointA({...pointA, y: e.target.value})} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Observation from A</label>
              <div className="flex gap-2">
                <select value={obsA.type} onChange={e => setObsA({...obsA, type: e.target.value})} className="bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500">
                  <option value="angle">Azimuth (DDD.MMSS)</option>
                  <option value="distance" disabled>Distance (m)</option>
                </select>
                <input type="number" value={obsA.value} onChange={e => setObsA({...obsA, value: e.target.value})} className="flex-1 bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#222] border border-[#333] p-4 rounded-sm">
          <h3 className="text-xs uppercase text-yellow-500 font-bold tracking-wider mb-4 border-b border-[#333] pb-2">Point B</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Name</label>
              <input type="text" value={pointB.name} onChange={e => setPointB({...pointB, name: e.target.value})} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Easting (X)</label>
                <input type="number" value={pointB.x} onChange={e => setPointB({...pointB, x: e.target.value})} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Northing (Y)</label>
                <input type="number" value={pointB.y} onChange={e => setPointB({...pointB, y: e.target.value})} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Observation from B</label>
              <div className="flex gap-2">
                <select value={obsB.type} onChange={e => setObsB({...obsB, type: e.target.value})} className="bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500">
                  <option value="angle">Azimuth (DDD.MMSS)</option>
                  <option value="distance" disabled>Distance (m)</option>
                </select>
                <input type="number" value={obsB.value} onChange={e => setObsB({...obsB, value: e.target.value})} className="flex-1 bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={calculateIntersection} className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 font-bold hover:bg-yellow-400 transition-colors rounded-sm text-sm">
          <Calculator className="w-4 h-4" /> Compute Intersection
        </button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1a1a1a] border border-[#333] p-6 rounded-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm uppercase text-white font-bold tracking-wider flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-yellow-500" /> Intersection Result
            </h3>
            <button onClick={saveToMap} className="flex items-center gap-2 bg-[#333] text-gray-300 px-3 py-1 text-xs uppercase tracking-wider hover:bg-[#444] transition-colors rounded-sm">
              <Save className="w-4 h-4" /> Save Points to Map
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#111] p-4 border border-[#222]">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Easting (X)</div>
              <div className="text-2xl font-mono text-green-400">{result.x}</div>
            </div>
            <div className="bg-[#111] p-4 border border-[#222]">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Northing (Y)</div>
              <div className="text-2xl font-mono text-green-400">{result.y}</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
