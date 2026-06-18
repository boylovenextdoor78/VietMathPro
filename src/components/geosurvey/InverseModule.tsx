import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, ArrowRight, Save } from 'lucide-react';
import Decimal from 'decimal.js';
import { useProject } from './ProjectContext';

Decimal.set({ precision: 70 });
const pi = new Decimal('3.1415926535897932384626433832795028419716939937510582097494459230781640628620899862803482534211706798214');

export default function InverseModule() {
  const { addPoint } = useProject();
  const [pointA, setPointA] = useState({ name: 'A', x: '', y: '', z: '' });
  const [pointB, setPointB] = useState({ name: 'B', x: '', y: '', z: '' });

  const savePoints = () => {
    if (pointA.name && pointA.x && pointA.y) {
      addPoint({ 
        name: pointA.name, 
        x: parseFloat(pointA.x), 
        y: parseFloat(pointA.y), 
        source: 'Inverse',
        sourceMethod: 'Manual Entry (Inverse)',
        precisionClass: 'Unverified',
        adjusted: false,
        parentControls: [],
        observationsUsed: 0
      });
    }
    if (pointB.name && pointB.x && pointB.y) {
      addPoint({ 
        name: pointB.name, 
        x: parseFloat(pointB.x), 
        y: parseFloat(pointB.y), 
        source: 'Inverse',
        sourceMethod: 'Manual Entry (Inverse)',
        precisionClass: 'Unverified',
        adjusted: false,
        parentControls: [],
        observationsUsed: 0
      });
    }
  };

  const calculateInverse = () => {
    if (!pointA.x || !pointA.y || !pointB.x || !pointB.y) return null;

    try {
      const xA = new Decimal(pointA.x);
      const yA = new Decimal(pointA.y);
      const xB = new Decimal(pointB.x);
      const yB = new Decimal(pointB.y);

      const dx = xB.minus(xA);
      const dy = yB.minus(yA);

      const hd = Decimal.sqrt(dx.pow(2).plus(dy.pow(2)));
      
      let azimuthRad = Decimal.atan2(dy, dx);
      const twoPi = pi.times(2);
      
      if (azimuthRad.isNegative()) azimuthRad = azimuthRad.plus(twoPi);
      
      const azimuthDeg = azimuthRad.times(180).div(pi);
      
      const d = azimuthDeg.floor();
      const m = azimuthDeg.minus(d).times(60).floor();
      const s = azimuthDeg.minus(d).times(60).minus(m).times(60);

      let quadrant = '';
      let bearingDeg = new Decimal(0);
      if (azimuthDeg.gte(0) && azimuthDeg.lt(90)) {
        quadrant = 'NE';
        bearingDeg = azimuthDeg;
      } else if (azimuthDeg.gte(90) && azimuthDeg.lt(180)) {
        quadrant = 'SE';
        bearingDeg = new Decimal(180).minus(azimuthDeg);
      } else if (azimuthDeg.gte(180) && azimuthDeg.lt(270)) {
        quadrant = 'SW';
        bearingDeg = azimuthDeg.minus(180);
      } else {
        quadrant = 'NW';
        bearingDeg = new Decimal(360).minus(azimuthDeg);
      }

      const bd = bearingDeg.floor();
      const bm = bearingDeg.minus(bd).times(60).floor();
      const bs = bearingDeg.minus(bd).times(60).minus(bm).times(60);

      let sd = null;
      let dz = null;
      let grade = null;

      if (pointA.z && pointB.z) {
        const zA = new Decimal(pointA.z);
        const zB = new Decimal(pointB.z);
        dz = zB.minus(zA);
        sd = Decimal.sqrt(hd.pow(2).plus(dz.pow(2)));
        if (!hd.isZero()) {
          grade = dz.div(hd).times(100);
        }
      }

      return {
        hd: hd.toFixed(4),
        azimuth: `${d}° ${m}' ${s.toFixed(2)}"`,
        bearing: `N ${bd}° ${bm}' ${bs.toFixed(2)}" ${quadrant.charAt(1)}`, // Simplified format
        sd: sd ? sd.toFixed(4) : '-',
        dz: dz ? dz.toFixed(4) : '-',
        grade: grade ? grade.toFixed(2) + '%' : '-'
      };
    } catch (e) {
      return null;
    }
  };

  const results = calculateInverse();

  return (
    <div className="space-y-6 text-gray-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#222] border border-[#333] p-4 rounded-sm">
          <h3 className="text-xs uppercase text-yellow-500 font-bold tracking-wider mb-4 border-b border-[#333] pb-2">Point 1 (From)</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Name</label>
              <input type="text" value={pointA.name} onChange={e => setPointA({...pointA, name: e.target.value})} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">X (Easting)</label>
                <input type="number" value={pointA.x} onChange={e => setPointA({...pointA, x: e.target.value})} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Y (Northing)</label>
                <input type="number" value={pointA.y} onChange={e => setPointA({...pointA, y: e.target.value})} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Z (Elev) - Opt</label>
                <input type="number" value={pointA.z} onChange={e => setPointA({...pointA, z: e.target.value})} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#222] border border-[#333] p-4 rounded-sm">
          <h3 className="text-xs uppercase text-yellow-500 font-bold tracking-wider mb-4 border-b border-[#333] pb-2">Point 2 (To)</h3>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Name</label>
              <input type="text" value={pointB.name} onChange={e => setPointB({...pointB, name: e.target.value})} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">X (Easting)</label>
                <input type="number" value={pointB.x} onChange={e => setPointB({...pointB, x: e.target.value})} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Y (Northing)</label>
                <input type="number" value={pointB.y} onChange={e => setPointB({...pointB, y: e.target.value})} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Z (Elev) - Opt</label>
                <input type="number" value={pointB.z} onChange={e => setPointB({...pointB, z: e.target.value})} className="w-full bg-[#111] border border-[#444] px-2 py-1 text-sm focus:outline-none focus:border-yellow-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {results && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1a1a1a] border border-[#333] p-6 rounded-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm uppercase text-white font-bold tracking-wider flex items-center gap-2">
              <Compass className="w-5 h-5 text-yellow-500" /> Inverse Results: {pointA.name} <ArrowRight className="w-4 h-4" /> {pointB.name}
            </h3>
            <button onClick={savePoints} className="flex items-center gap-2 bg-[#333] text-gray-300 px-3 py-1 text-xs uppercase tracking-wider hover:bg-[#444] transition-colors rounded-sm">
              <Save className="w-4 h-4" /> Save Points to Map
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="bg-[#111] p-4 border border-[#222]">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Horizontal Dist</div>
              <div className="text-xl font-mono text-green-400">{results.hd} <span className="text-xs text-gray-600">m</span></div>
            </div>
            <div className="bg-[#111] p-4 border border-[#222]">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Azimuth</div>
              <div className="text-xl font-mono text-blue-400">{results.azimuth}</div>
            </div>
            <div className="bg-[#111] p-4 border border-[#222]">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Quadrant Bearing</div>
              <div className="text-xl font-mono text-purple-400">{results.bearing}</div>
            </div>
            <div className="bg-[#111] p-4 border border-[#222]">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Slope Distance</div>
              <div className="text-xl font-mono text-gray-300">{results.sd} <span className="text-xs text-gray-600">m</span></div>
            </div>
            <div className="bg-[#111] p-4 border border-[#222]">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Height Diff (ΔZ)</div>
              <div className="text-xl font-mono text-gray-300">{results.dz} <span className="text-xs text-gray-600">m</span></div>
            </div>
            <div className="bg-[#111] p-4 border border-[#222]">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Grade</div>
              <div className="text-xl font-mono text-gray-300">{results.grade}</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
