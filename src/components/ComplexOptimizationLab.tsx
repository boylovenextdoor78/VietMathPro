import React, { useState } from 'react';
import { BlockMath } from 'react-katex';

export default function ComplexOptimizationLab() {
  const [activeTab, setActiveTab] = useState('M1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const [naturalQuery, setNaturalQuery] = useState('');

  const difficultyLevels = ['Easy', 'Medium', 'Hard', 'Expert'];
  const [difficulty, setDifficulty] = useState('Medium');

  const handleSolve = async () => {
    if (!naturalQuery.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { solveComplexOptimization } = await import('../services/geminiMath');
      const data = await solveComplexOptimization(activeTab, naturalQuery, difficulty);
      if (data.error) throw new Error(data.error || 'Optimization error');
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const getPresets = (tabId: string) => {
    switch (tabId) {
      case 'M1': return ["Min |z-(2+i)| with |z-1|=3", "Max |z| with |z-2i|<=1"];
      case 'M2': return ["Min |z-1| + |z-2i| with Re(z)=0", "Max |z-2| + |z+2i| under |z|=1"];
      case 'M3': return ["Min |z-3+4i| under Re(z)=Im(z)", "Min |z| given z + conj(z) = 4"];
      case 'M4': return ["Max |z-1| given |z-i|=2", "Min |z-3| + |z-4i| under |z|=5"];
      case 'M5': return ["Min |z| with |z-1|+|z+1|=4", "Max Im(z) given ||z-2|-|z+2||=1"];
      case 'M6': return ["Min MA+MB where A(1), B(i), M(z) runs on real axis", "Max MA^2+MB^2 with M on |z|=1"];
      case 'M7': return ["Min |z-1| + |z-2| + |z-i|", "Min |z| + |z-1| + |z-i| + |z-1-i|"];
      case 'M8': return ["Min |z-1| + |1/z - 1| given |z|=1", "Max Re(z) subject to |z^2-z+1|<=1"];
      default: return [];
    }
  };

  const tabs = [
    { id: 'M1', label: 'Basic Distance' },
    { id: 'M2', label: 'Modulus Expression' },
    { id: 'M3', label: 'Linear Constraint' },
    { id: 'M4', label: 'Circle Constraint' },
    { id: 'M5', label: 'Ellipse / Hyperbola' },
    { id: 'M6', label: 'Triangle Geometry' },
    { id: 'M7', label: 'Multi-Point Sum' },
    { id: 'M8', label: 'Advanced Olympiad' },
  ];

  return (
    <div className="bg-[#141414] text-[#E4E3E0] p-6 border border-teal-500/30 shadow-lg shadow-teal-900/20 rounded-sm mt-4 font-mono">
      <div className="flex flex-wrap items-center justify-between mb-8 pb-4 border-b border-teal-500/20">
        <div>
          <h2 className="text-2xl italic font-serif text-teal-400">COMPLEX OPTIMIZATION LAB</h2>
          <p className="text-xs opacity-60 uppercase tracking-widest mt-1">Min/Max Optimization Engine</p>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-[#E4E3E0]/10 mb-6 font-mono text-xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 uppercase tracking-wide whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-teal-500/10 text-teal-300 border-b-2 border-teal-500 font-bold'
                : 'text-gray-400 hover:bg-white/5 hover:text-[#E4E3E0]'
            }`}
          >
            [{tab.id}] {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
           <label className="block text-[10px] uppercase tracking-widest opacity-50 mb-2">Preset Problems (THPTQG Focus)</label>
           <div className="flex flex-col gap-2 mb-4">
              {getPresets(activeTab).map((preset, idx) => (
                <button
                   key={idx}
                   onClick={() => setNaturalQuery(preset)}
                   className="text-left text-xs bg-[#E4E3E0]/10 hover:bg-[#E4E3E0]/20 p-2 border border-transparent hover:border-teal-400 transition-all font-serif italic"
                >
                  "{preset}"
                </button>
              ))}
           </div>
           
           <label className="block text-[10px] uppercase tracking-widest opacity-50 mb-2">Natural Problem Description</label>
           <textarea
             value={naturalQuery}
             onChange={(e) => setNaturalQuery(e.target.value)}
             className="w-full bg-[#E4E3E0] text-[#141414] p-4 text-sm outline-none font-serif resize-y"
             rows={4}
             placeholder="Nhập đề bài vào đây (VD: Tìm giá trị nhỏ nhất của |z| biết |z - 2 + i| = 3)"
           />

           <div className="flex justify-between items-center mt-4">
             <div className="flex gap-2">
                 {difficultyLevels.map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setDifficulty(lvl)}
                      className={`text-[9px] uppercase px-2 py-1 border transition-colors ${difficulty === lvl ? 'bg-teal-500 text-teal-950 border-teal-500 font-bold' : 'border-teal-500/30 text-teal-500/60 hover:bg-white/5'}`}
                    >
                      {lvl}
                    </button>
                 ))}
             </div>
             
             <div className="flex gap-2">
                 <button onClick={() => setNaturalQuery('')} className="px-4 py-2 border border-[#E4E3E0]/20 text-xs uppercase hover:bg-white/5 transition-colors">Clear</button>
                 <button onClick={handleSolve} disabled={loading || !naturalQuery.trim()} className="px-8 py-2 bg-teal-500 text-teal-950 font-bold uppercase text-xs hover:bg-teal-400 transition-colors disabled:opacity-50">
                    {loading ? 'Processing...' : 'Solve'}
                 </button>
             </div>
           </div>
        </div>

        <div className="border border-teal-500/20 bg-teal-900/10 p-4">
           <h3 className="text-[10px] uppercase tracking-widest text-teal-400 mb-4 border-b border-teal-500/20 pb-2">Optimization Engine Output</h3>
           
           {error && <div className="text-red-400 text-sm mb-4">{error}</div>}
           
           {!result && !error && !loading && (
              <div className="opacity-40 italic text-sm text-center mt-20">
                Awaiting problem description. Select a preset or type a custom problem.
              </div>
           )}

           {loading && (
              <div className="flex items-center justify-center h-full text-teal-400 animate-pulse text-xs uppercase tracking-widest gap-2">
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" /> Analyzing geometric constraints...
              </div>
           )}

           {result && (
              <div className="space-y-4">
                 <div className="bg-black/30 p-3">
                   <p className="text-[10px] uppercase text-teal-500/60 mb-1">1. Detected Type</p>
                   <p className="text-sm text-teal-200">{result.detected_type || 'Unknown'}</p>
                 </div>
                 <div className="bg-black/30 p-3">
                   <p className="text-[10px] uppercase text-amber-500/60 mb-1">2. Idea / Theorem Used</p>
                   <p className="text-sm font-serif italic text-[#E4E3E0]">{result.idea || 'Direct computation'}</p>
                 </div>
                 <div className="bg-teal-500/10 border border-teal-500/30 p-4">
                   <p className="text-[10px] uppercase text-teal-400 mb-2">3. Exact Result</p>
                   <div className="text-lg mb-2 overflow-x-auto overflow-y-hidden">
                      {result.latex_exact ? <BlockMath math={result.latex_exact} /> : <span className="font-serif block">{result.exact || 'N/A'}</span>}
                   </div>
                   {result.decimal_25 && (
                      <div className="mt-4 pt-4 border-t border-teal-500/20">
                         <p className="text-[10px] uppercase text-teal-500/60 mb-1">4. High-Precision (25 Digits)</p>
                         <p className="font-mono text-xs text-teal-300 break-all">{result.decimal_25}</p>
                      </div>
                   )}
                 </div>
                 {result.attained_at && (
                 <div className="bg-black/30 p-3 flex justify-between items-center">
                   <div>
                     <p className="text-[10px] uppercase text-teal-500/60 mb-1">5. Attained at z =</p>
                     <p className="text-sm font-mono text-teal-100">{result.attained_at}</p>
                   </div>
                 </div>
                 )}
                 {result.explanation && (
                 <div className="mt-4 p-4 border border-[#E4E3E0]/10 text-xs text-gray-400 leading-relaxed font-serif">
                   {result.explanation}
                 </div>
                 )}
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
