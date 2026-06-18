import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
    <div className="h-full flex flex-col space-y-4">
      <div className="bg-[#222] border border-[#333] p-4 rounded-sm flex justify-between items-center">
        <div>
          <h3 className="text-xs uppercase text-yellow-500 font-bold tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Control Point Manager
          </h3>
          <p className="text-[10px] text-gray-400 mt-1">
            Manage geodetic constraints, monuments, and survey anchors.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[10px] text-gray-500">
            Total Controls: <span className="text-yellow-500 font-bold">{controlPoints.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden">
        {/* Add New Control Point */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-sm flex flex-col">
          <div className="p-3 border-b border-[#333] bg-[#222]">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Add Control Point</h4>
          </div>
          <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Point Name / ID</label>
              <input 
                type="text" 
                value={newPoint.name}
                onChange={e => setNewPoint({...newPoint, name: e.target.value})}
                className="w-full bg-[#111] border border-[#333] p-2 text-xs text-gray-300 focus:border-yellow-500 focus:outline-none"
                placeholder="e.g. GPS-01"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">X (Northing)</label>
                <input 
                  type="number" 
                  value={newPoint.x}
                  onChange={e => setNewPoint({...newPoint, x: e.target.value})}
                  className="w-full bg-[#111] border border-[#333] p-2 text-xs text-gray-300 focus:border-yellow-500 focus:outline-none"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Y (Easting)</label>
                <input 
                  type="number" 
                  value={newPoint.y}
                  onChange={e => setNewPoint({...newPoint, y: e.target.value})}
                  className="w-full bg-[#111] border border-[#333] p-2 text-xs text-gray-300 focus:border-yellow-500 focus:outline-none"
                  placeholder="0.000"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Control Class</label>
              <select
                value={newPoint.pointClass}
                onChange={e => setNewPoint({...newPoint, pointClass: e.target.value})}
                className="w-full bg-[#111] border border-[#333] p-2 text-xs text-gray-300 focus:border-yellow-500 focus:outline-none"
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
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-2 text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Control
            </button>
          </div>
        </div>

        {/* Control Points List */}
        <div className="md:col-span-2 bg-[#1a1a1a] border border-[#333] rounded-sm flex flex-col">
          <div className="p-3 border-b border-[#333] bg-[#222] flex justify-between items-center">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Project Points Register</h4>
            <div className="text-[10px] text-gray-500 flex items-center gap-4">
              <span className="flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-yellow-500" /> Control</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-blue-500" /> Computed</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b border-[#333]">
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
                    <td colSpan={7} className="p-8 text-center text-gray-600 text-xs">
                      No points in project.
                    </td>
                  </tr>
                )}
                {points.map(p => (
                  <tr key={p.id} className="border-b border-[#222] hover:bg-[#222] transition-colors text-xs">
                    <td className="p-2">
                      <button onClick={() => toggleControl(p.id, !!p.isControl)} className="focus:outline-none">
                        {p.isControl ? (
                          <span title="Control Point"><ShieldAlert className="w-4 h-4 text-yellow-500" /></span>
                        ) : (
                          <span title="Computed/Temp Point"><CheckCircle2 className="w-4 h-4 text-blue-500" /></span>
                        )}
                      </button>
                    </td>
                    <td className="p-2 font-bold text-gray-300">{p.name}</td>
                    <td className="p-2 text-gray-400 font-mono">{p.x.toFixed(4)}</td>
                    <td className="p-2 text-gray-400 font-mono">{p.y.toFixed(4)}</td>
                    <td className="p-2 text-gray-500">{p.pointClass || '-'}</td>
                    <td className="p-2 text-[10px]">
                      <div className="text-gray-400">{p.sourceMethod || p.source}</div>
                      <div className={`font-bold ${p.precisionClass === 'Unverified' ? 'text-red-400' : 'text-green-400'}`}>
                        {p.precisionClass || 'Unknown'}
                      </div>
                      <div className="text-gray-600 truncate max-w-[150px]" title={p.timestamp}>
                        {p.timestamp ? new Date(p.timestamp).toLocaleString() : ''}
                      </div>
                    </td>
                    <td className="p-2 text-right">
                      <button 
                        onClick={() => toggleLock(p.id, !!p.locked)}
                        className={`p-1 rounded-sm transition-colors ${p.locked ? 'text-red-400 hover:bg-red-400/10' : 'text-gray-500 hover:bg-gray-700'}`}
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
