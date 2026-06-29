import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Plus, Trash2, Lock, Unlock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useProject } from './ProjectContext';

export default function ControlPointsModule() {
  const { points, addPoint, updatePoint, clearPoints } = useProject();
  
  const [newPoint, setNewPoint] = useState({ name: '', x: '', y: '', pointClass: 'I' });

  const handleAddControl = () => {
    if (newPoint.name && newPoint.x && newPoint.y) {
      addPoint({
        name: newPoint.name,
        x: parseFloat(newPoint.x),
        y: parseFloat(newPoint.y),
        source: 'Manual Control',
        type: 'known',
        isControl: true,
        locked: true,
        pointClass: newPoint.pointClass,
        sourceMethod: 'Manual Entry',
        precisionClass: 'Unverified',
        adjusted: false,
        parentControls: [],
        observationsUsed: 0
      });
      setNewPoint({ name: '', x: '', y: '', pointClass: 'I' });
    }
  };

  const toggleLock = (id: string, currentLocked: boolean) => {
    updatePoint(id, { locked: !currentLocked });
  };

  const toggleControl = (id: string, currentControl: boolean) => {
    updatePoint(id, { isControl: !currentControl, type: !currentControl ? 'known' : 'computed' });
  };

  const controlPoints = points.filter(p => p.isControl);
  const otherPoints = points.filter(p => !p.isControl);

  return (
    <div className="w-full flex flex-col space-y-4 text-black bg-white">
      <div className="bg-stone-100 border-2 border-[#141414] p-4 rounded-sm flex justify-between items-center shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
        <div>
          <h3 className="text-xs uppercase text-black font-bold tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-yellow-600" /> Control Point Manager
          </h3>
          <p className="text-[10px] text-black font-medium mt-1">
            Manage geodetic constraints, monuments, and survey anchors.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[10px] text-black font-bold">
            Total Controls: <span className="text-black font-bold">{controlPoints.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Add New Control Point */}
        <div className="bg-white border-2 border-[#141414] rounded-sm flex flex-col shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <div className="p-3 border-b-2 border-[#141414] bg-stone-100">
            <h4 className="text-xs font-bold text-black uppercase tracking-wider">Add Control Point</h4>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-[10px] text-black font-bold uppercase tracking-wider mb-1">Point Name / ID</label>
              <input 
                type="text" 
                value={newPoint.name}
                onChange={e => setNewPoint({...newPoint, name: e.target.value})}
                className="w-full max-w-[150px] bg-white border-2 border-[#141414] p-2 text-xs text-black font-bold focus:bg-yellow-50 focus:outline-none"
                placeholder="e.g. GPS-01"
              />
            </div>
            <div className="flex gap-2 max-w-[320px]">
              <div className="w-1/2">
                <label className="block text-[10px] text-black font-bold uppercase tracking-wider mb-1">X (Northing)</label>
                <input 
                  type="number" 
                  value={newPoint.x}
                  onChange={e => setNewPoint({...newPoint, x: e.target.value})}
                  className="w-full bg-white border-2 border-[#141414] p-2 text-xs text-black font-bold focus:bg-yellow-50 focus:outline-none"
                  placeholder="0.000"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-[10px] text-black font-bold uppercase tracking-wider mb-1">Y (Easting)</label>
                <input 
                  type="number" 
                  value={newPoint.y}
                  onChange={e => setNewPoint({...newPoint, y: e.target.value})}
                  className="w-full bg-white border-2 border-[#141414] p-2 text-xs text-black font-bold focus:bg-yellow-50 focus:outline-none"
                  placeholder="0.000"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-black font-bold uppercase tracking-wider mb-1">Control Class</label>
              <select
                value={newPoint.pointClass}
                onChange={e => setNewPoint({...newPoint, pointClass: e.target.value})}
                className="w-full max-w-[200px] bg-white border-2 border-[#141414] p-2 text-xs text-black font-bold focus:bg-yellow-50 focus:outline-none"
              >
                <option value="0">Class 0 (CORS/Base)</option>
                <option value="I">Class I</option>
                <option value="II">Class II</option>
                <option value="III">Class III</option>
                <option value="IV">Class IV</option>
                <option value="TC">Traverse Control (TC)</option>
              </select>
            </div>
            <button 
              onClick={handleAddControl}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 text-xs uppercase tracking-wider border-2 border-[#141414] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Control
            </button>
          </div>
        </div>

        {/* Control Points List */}
        <div className="md:col-span-2 bg-white border-2 border-[#141414] rounded-sm flex flex-col shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <div className="p-3 border-b-2 border-[#141414] bg-stone-100 flex justify-between items-center">
            <h4 className="text-xs font-bold text-black uppercase tracking-wider">Project Points Register</h4>
            <div className="text-[10px] text-black font-bold flex items-center gap-4">
              <span className="flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-yellow-600" /> Control</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-blue-600" /> Computed</span>
            </div>
          </div>
          
          <div className="p-2 bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] text-black font-bold uppercase tracking-wider border-b-2 border-[#141414]">
                  <th className="p-2">Status</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">X (N)</th>
                  <th className="p-2">Y (E)</th>
                  <th className="p-2">Class</th>
                  <th className="p-2">Provenance</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {points.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-black font-bold text-xs">
                      No points in project.
                    </td>
                  </tr>
                )}
                {points.map(p => (
                  <tr key={p.id} className="border-b border-[#141414] hover:bg-stone-50 transition-colors text-xs text-black">
                    <td className="p-2">
                      <button onClick={() => toggleControl(p.id, !!p.isControl)} className="focus:outline-none cursor-pointer">
                        {p.isControl ? (
                          <span title="Control Point"><ShieldAlert className="w-4 h-4 text-yellow-600" /></span>
                        ) : (
                          <span title="Computed/Temp Point"><CheckCircle2 className="w-4 h-4 text-blue-600" /></span>
                        )}
                      </button>
                    </td>
                    <td className="p-2 font-bold text-black">{p.name}</td>
                    <td className="p-2 text-black font-mono font-bold">{p.x.toFixed(4)}</td>
                    <td className="p-2 text-black font-mono font-bold">{p.y.toFixed(4)}</td>
                    <td className="p-2 text-black font-bold">{p.pointClass || '-'}</td>
                    <td className="p-2 text-[10px]">
                      <div className="text-black font-bold">{p.sourceMethod || p.source}</div>
                      <div className={`font-bold ${p.precisionClass === 'Unverified' ? 'text-red-600' : 'text-green-600'}`}>
                        {p.precisionClass || 'Unknown'}
                      </div>
                      <div className="text-black font-medium truncate max-w-[150px]" title={p.timestamp}>
                        {p.timestamp ? new Date(p.timestamp).toLocaleString() : ''}
                      </div>
                    </td>
                    <td className="p-2 text-right">
                      <button 
                        onClick={() => toggleLock(p.id, !!p.locked)}
                        className={`p-1 rounded-sm transition-colors ${p.locked ? 'text-red-600 hover:bg-red-100' : 'text-gray-600 hover:bg-gray-100'}`}
                        title={p.locked ? "Unlock coordinates" : "Lock coordinates"}
                      >
                        {p.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
