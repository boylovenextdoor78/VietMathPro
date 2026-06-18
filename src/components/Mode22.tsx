import React, { useState } from 'react';
import { Calculator, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { solveGeneralInequality, GeneralInequationResult } from '../lib/generalInequation';

export function Mode22() {
  const [inputStr, setInputStr] = useState('');
  const [result, setResult] = useState<GeneralInequationResult | null>(null);
  const [error, setError] = useState('');

  const handleSolve = () => {
    setError('');
    setResult(null);
    try {
      if (!inputStr) {
        throw new Error("Vui lòng nhập bất phương trình.");
      }
      const res = solveGeneralInequality(inputStr);
      if (res.error) {
        setError(res.error);
      } else {
        setResult(res);
      }
    } catch (e: any) {
      setError(e.message || 'Lỗi cú pháp hoặc không thể giải.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-600/20 text-rose-500 mb-4">
          <Calculator className="w-8 h-8" />
        </div>
        <h2 className="font-serif italic text-4xl">General Inequation Solver</h2>
        <p className="font-mono text-xs opacity-50 mt-2">Solve general inequalities with nested absolute values and fractions</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
        <div className="space-y-2">
          <label className="font-mono text-xs opacity-50">
            Nhập bất phương trình (hỗ trợ abs(), sqrt(), phân thức, lồng nhau):
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              value={inputStr}
              onChange={(e) => setInputStr(e.target.value)}
              className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 font-mono text-sm focus:outline-none focus:border-rose-500 transition-colors"
              placeholder="VD: x*abs(x^2-abs(x-1))-x^3+3*x<0"
              onKeyDown={(e) => e.key === 'Enter' && handleSolve()}
            />
            <button
              onClick={handleSolve}
              className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-2 rounded-lg font-mono text-sm transition-colors flex items-center justify-center gap-2"
            >
              Solve <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 font-mono mt-2">
            Hỗ trợ các phép toán: +, -, *, /, ^, abs(x) hoặc |x|, sqrt(x).
            Tổng bậc đa thức không vượt quá 5.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="font-mono text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="font-serif italic text-xl mb-4">Sign Table & Intervals</h3>
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="p-2">Interval</th>
                    <th className="p-2 text-center">Thỏa mãn BPT?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {result.intervals.map((iv, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="p-2 whitespace-nowrap">
                        ({iv.startStr}, {iv.endStr})
                      </td>
                      <td className="p-2 text-center">
                        {iv.isSolution ? (
                          <span className="text-green-400 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Có
                          </span>
                        ) : (
                          <span className="text-red-400">Không</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-rose-600/10 border border-rose-500/20 rounded-xl p-6 text-center">
            <h3 className="font-serif italic text-xl text-rose-400 mb-2">Final Solution</h3>
            <div className="font-mono text-2xl break-all leading-relaxed">
              {(() => {
                const rootMap = new Map<string, string>();
                result.criticalPoints.forEach(cp => {
                  const isDecimal = cp.exactVal && typeof cp.exactVal === 'object' && typeof cp.exactVal.toNumber === 'function';
                  const isNumber = typeof cp.exactVal === 'number' || typeof cp.val === 'number';
                  const fullVal = isDecimal ? cp.exactVal.toFixed(25) : isNumber ? (cp.exactVal || cp.val).toString() : cp.str;
                  rootMap.set(cp.str, fullVal);
                });

                const sortedRoots = Array.from(rootMap.keys()).sort((a, b) => b.length - a.length);
                
                if (sortedRoots.length === 0) {
                  return result.finalSolution;
                }

                const escapedRoots = sortedRoots.map(r => r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
                const regex = new RegExp(`(${escapedRoots.join('|')})`, 'g');
                
                const parts = result.finalSolution.split(regex);
                
                return parts.map((part, i) => {
                  if (rootMap.has(part)) {
                    const fullVal = rootMap.get(part)!;
                    return (
                      <span key={i} className="group relative inline-block cursor-pointer mx-0.5" onClick={() => navigator.clipboard.writeText(fullVal)}>
                        <span className="border-b border-dashed border-rose-500/50 hover:text-rose-300 transition-colors">
                          {part}
                        </span>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                          <span className="bg-[#E4E3E0] text-[#141414] text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap font-bold">
                            {fullVal} (Click to copy)
                          </span>
                        </span>
                      </span>
                    );
                  }
                  return <span key={i}>{part}</span>;
                });
              })()}
            </div>
          </div>

          <div className="w-full pt-8 border-t border-white/10">
            <p className="text-[9px] font-mono opacity-40 uppercase tracking-widest mb-4">Roots (Critical Points)</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {result.criticalPoints.map((cp, idx) => {
                const isDecimal = cp.exactVal && typeof cp.exactVal === 'object' && typeof cp.exactVal.toNumber === 'function';
                const isNumber = typeof cp.exactVal === 'number' || typeof cp.val === 'number';
                const fullVal = isDecimal ? cp.exactVal.toFixed(25) : isNumber ? (cp.exactVal || cp.val).toString() : cp.str;
                
                return (
                  <div key={idx} className="p-3 border border-white/5 bg-white/5 space-y-1" title={fullVal}>
                    <div className="font-mono text-[8px] opacity-40 uppercase tracking-widest">x_{idx+1}</div>
                    <div className="font-serif italic text-sm">
                      {cp.str}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
