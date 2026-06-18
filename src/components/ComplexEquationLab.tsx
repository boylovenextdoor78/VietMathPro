import React, { useState } from 'react';
import { BlockMath } from 'react-katex';

export default function ComplexEquationLab() {
  const eqTypeOptions = [
    { value: 'A', label: '(A) Linear Mixed Conjugate: a*conj(z)+b*z+c=0', preset: { a: '2+i', b: '3-2i', c: '5', d: '' } },
    { value: 'B', label: '(B) Complex Quadratic: a*z^2+b*z+c=0', preset: { a: '1+i', b: '2-3i', c: '4', d: '' } },
    { value: 'C', label: '(C) Hybrid Quadratic-Conjugate: a*z^2+b*conj(z)+c*z+d=0', preset: { a: '1+i', b: '2-i', c: '3+4i', d: '1' } },
    { value: 'D', label: '(D) Complex Cubic: a*z^3+b*z^2+c*z+d=0', preset: { a: '1+i', b: '2-i', c: '3+4i', d: '5' } },
    { value: 'E', label: '(E) Locus & Intersection: a*z*conj(z)+b*z+c*conj(z)+d=0', preset: { a: '1', b: '1-i', c: '1+i', d: '-3' } },
  ];

  const [eqType, setEqType] = useState('A');
  const [a, setA] = useState(eqTypeOptions[0].preset.a);
  const [b, setB] = useState(eqTypeOptions[0].preset.b);
  const [c, setC] = useState(eqTypeOptions[0].preset.c);
  const [d, setD] = useState(eqTypeOptions[0].preset.d);

  const [eq2Type, setEq2Type] = useState('');
  const [eq2_p, setEq2_p] = useState('1');
  const [eq2_q, setEq2_q] = useState('1');
  const [eq2_r, setEq2_r] = useState('1');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('result');

  const [options, setOptions] = useState({
    exact: true,
    approx: true,
    derivation: true,
    geometry: true,
    polar: true,
    autoSimplify: true,
    rationalize: true,
    precision25: true,
    verifyRoots: true,
    smartFallback: true
  });

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setEqType(val);
    const preset = eqTypeOptions.find(o => o.value === val)?.preset;
    if (preset) {
      setA(preset.a); setB(preset.b); setC(preset.c); setD(preset.d);
    }
  };

  const [showValidation, setShowValidation] = useState(false);

  const calculate = async (bypassValidation = false) => {
    if (!bypassValidation) {
       if (eqType === 'A' && (!a || a.trim() === '' || a.trim() === '0')) {
          setShowValidation(true);
          return;
       }
       if (eqType === 'C' && (!b || b.trim() === '' || b.trim() === '0')) {
          setShowValidation(true);
          return;
       }
    }

    setShowValidation(false);
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/math/complex-solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: eqType, a, b, c, d, eq2Type, eq2_p, eq2_q, eq2_r, options })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Server error');
      }
      setResult(data);
      setActiveTab('result');
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#141414] text-[#E4E3E0] p-6 border border-[#141414] shadow-lg rounded-sm mt-4 font-mono">
      <div className="flex flex-wrap items-center justify-between mb-8 pb-4 border-b border-[#E4E3E0]/20">
        <div>
          <h2 className="text-2xl italic font-serif">COMPLEX EQUATION LAB</h2>
          <p className="text-xs opacity-50 uppercase tracking-widest mt-1">Production-Grade Complex System</p>
        </div>
      </div>

      {showValidation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#E4E3E0]/30 p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl italic font-serif mb-4 flex items-center gap-2">
              <span className="text-amber-500">⚠</span> Validation Rule
            </h3>
            <p className="text-sm opacity-80 mb-6">
              Phương trình loại này ({eqType === 'A' ? 'Linear Mixed Conjugate' : 'Hybrid Quadratic-Conjugate'})
              yêu cầu liên hợp phức nhưng hệ số conj(z) hiện tại đang bị trống hoặc bằng 0.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  if (eqType === 'A') setA('1');
                  if (eqType === 'C') setB('1');
                  setShowValidation(false);
                }}
                className="w-full text-left p-3 border border-[#E4E3E0]/20 hover:bg-[#E4E3E0] hover:text-[#141414] transition-colors text-xs font-mono uppercase tracking-widest"
              >
                1. Máy tự thêm conj(z) (hệ số = 1)
              </button>
              <button 
                onClick={() => {
                  setEqType('B');
                  // Move coefficients appropriately
                  if (eqType === 'A') {
                      setA(b); setB(c); setC('0'); 
                  } else if (eqType === 'C') {
                      // a*z^2 + c*z + d = 0 for C
                      setB(c); setC(d); setD('0');
                  }
                  setShowValidation(false);
                }}
                className="w-full text-left p-3 border border-[#E4E3E0]/20 hover:bg-[#E4E3E0] hover:text-[#141414] transition-colors text-xs font-mono uppercase tracking-widest"
              >
                2. Chuyển sang loại B (Complex Quadratic)
              </button>
              <button 
                onClick={() => {
                  setEqType('D');
                  setShowValidation(false);
                }}
                className="w-full text-left p-3 border border-[#E4E3E0]/20 hover:bg-[#E4E3E0] hover:text-[#141414] transition-colors text-xs font-mono uppercase tracking-widest"
              >
                3. Chuyển sang loại D (Complex Cubic)
              </button>
              <div className="pt-2 flex justify-end">
                <button onClick={() => setShowValidation(false)} className="text-xs uppercase tracking-widest opacity-50 hover:opacity-100">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <label className="block text-[10px] uppercase tracking-widest opacity-50 mb-2">Equation Type</label>
          <select 
            value={eqType} 
            onChange={handleTypeChange}
            className="w-full bg-[#E4E3E0] text-[#141414] p-2 text-sm outline-none"
          >
            {eqTypeOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest opacity-50 mb-1">a =</label>
              <input type="text" value={a} onChange={e => setA(e.target.value)} placeholder="e.g. 2+i" className="w-full bg-transparent border border-[#E4E3E0]/30 p-2 text-sm focus:border-[#E4E3E0] outline-none" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest opacity-50 mb-1">b =</label>
              <input type="text" value={b} onChange={e => setB(e.target.value)} placeholder="e.g. 3-2i" className="w-full bg-transparent border border-[#E4E3E0]/30 p-2 text-sm focus:border-[#E4E3E0] outline-none" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest opacity-50 mb-1">c =</label>
              <input type="text" value={c} onChange={e => setC(e.target.value)} placeholder="e.g. 5" className="w-full bg-transparent border border-[#E4E3E0]/30 p-2 text-sm focus:border-[#E4E3E0] outline-none" />
            </div>
            {(eqType === 'C' || eqType === 'D' || eqType === 'E') && (
            <div>
              <label className="block text-[10px] uppercase tracking-widest opacity-50 mb-1">d =</label>
              <input type="text" value={d} onChange={e => setD(e.target.value)} placeholder="e.g. sqrt(2)" className="w-full bg-transparent border border-[#E4E3E0]/30 p-2 text-sm focus:border-[#E4E3E0] outline-none" />
            </div>
            )}
            {eqType === 'E' && (
              <div className="col-span-2 mt-2">
                <label className="block text-[10px] uppercase tracking-widest text-teal-400 mb-1">EQ2: Intersection Equation (Optional)</label>
                <select value={eq2Type} onChange={e => setEq2Type(e.target.value)} className="w-full bg-[#141414] border border-teal-500/30 text-teal-100 p-2 text-sm outline-none mb-2">
                  <option value="">None (Locus / Circle Analyzer only)</option>
                  <option value="A">Linear: p*z+q*conj(z)+r=0</option>
                  <option value="B">Quadratic: p*z^2+q*z+r=0</option>
                </select>
                {eq2Type && (
                   <div className="grid grid-cols-3 gap-2">
                     <div><label className="block text-[10px] text-teal-400/50 mb-1">p =</label><input type="text" value={eq2_p} onChange={e => setEq2_p(e.target.value)} className="w-full bg-transparent border border-teal-500/30 p-1 text-sm text-teal-300 outline-none" /></div>
                     <div><label className="block text-[10px] text-teal-400/50 mb-1">q =</label><input type="text" value={eq2_q} onChange={e => setEq2_q(e.target.value)} className="w-full bg-transparent border border-teal-500/30 p-1 text-sm text-teal-300 outline-none" /></div>
                     <div><label className="block text-[10px] text-teal-400/50 mb-1">r =</label><input type="text" value={eq2_r} onChange={e => setEq2_r(e.target.value)} className="w-full bg-transparent border border-teal-500/30 p-1 text-sm text-teal-300 outline-none" /></div>
                   </div>
                )}
                <p className="text-[9px] opacity-50 mt-1 italic">Selecting a secondary equation opens Intersection Solver E.2 mode.</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-widest opacity-50 mb-2">Options</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(options).map(([k, v]) => (
              <label key={k} className="flex items-center space-x-2 text-xs hover:text-white cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={v} 
                  onChange={e => setOptions({...options, [k]: e.target.checked})}
                  className="accent-[#E4E3E0]" 
                />
                <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
              </label>
            ))}
          </div>
          <button 
            onClick={() => calculate()}
            disabled={loading}
            className="mt-6 w-full py-3 bg-[#E4E3E0] text-[#141414] font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Solving...' : 'Solve Equation'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 mb-6 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 border-t border-[#E4E3E0]/20 pt-6">
          <div className="flex flex-wrap gap-2 mb-6">
            {['result', 'derivation', 'geometry', 'matrix', 'numeric verify'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs uppercase tracking-widest transition-colors ${activeTab === tab ? 'bg-[#E4E3E0] text-[#141414]' : 'border border-[#E4E3E0]/20 hover:border-[#E4E3E0]'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="min-h-[300px]">
            {activeTab === 'result' && (
              <div>
                {result.locus_data && eqType === 'E' && (
                 <div className="mb-6">
                   <h3 className="text-sm font-mono uppercase tracking-widest text-teal-400 mb-2 mt-2">
                     - Locus Analyzer {eq2Type ? "(Equation 1)" : ""} -
                   </h3>
                   <div className="bg-teal-900/20 p-4 border border-teal-500/30">
                     {result.locus_data.type === 'circle' ? (
                        <>
                          <p className="text-sm">Circle Center: <strong>Point ({result.locus_data.center_x}, {result.locus_data.center_y})</strong></p>
                          <p className="text-sm mt-2">Squared Radius (R²): <strong>{result.locus_data.r_sq}</strong></p>
                          {parseFloat(result.locus_data.r_sq) < 0 ? (
                              <p className="text-red-400 text-xs mt-2 italic font-bold">R² &lt; 0: Imaginary circle (No solutions)</p>
                          ) : parseFloat(result.locus_data.r_sq) === 0 ? (
                              <p className="text-amber-400 text-xs mt-2 italic font-bold">R² = 0: Point circle (1 solution)</p>
                          ) : (
                              <p className="text-teal-400 text-xs mt-2 italic font-bold">R² &gt; 0: Real circle (Infinite solutions on the locus)</p>
                          )}
                        </>
                     ) : result.locus_data.type === 'line' ? (
                        <>
                          <p className="text-sm font-bold text-amber-400">Linear Locus Detected</p>
                          <p className="text-sm mt-2 font-mono">
                            ({result.locus_data.xc})*x + ({result.locus_data.yc})*y + ({result.locus_data.Mc}) = 0
                          </p>
                          <p className="text-teal-400 text-xs mt-2 italic font-bold">Real line (Infinite solutions on the locus)</p>
                        </>
                     ) : null}
                   </div>
                 </div>
                )}
                <h3 className="text-sm uppercase tracking-widest opacity-50 mb-4">Roots</h3>
                {result.latex_roots?.length === 0 ? (
                  <p className="italic opacity-80">No solution found.</p>
                ) : (
                  <div className="space-y-6">
                    {result.latex_roots?.map((latex: string, i: number) => (
                      <div key={i} className="p-4 bg-white/5 border border-white/10 overflow-x-auto text-lg hover:border-white/30 transition-colors">
                        <div className="text-[#E4E3E0]">
                          <BlockMath math={`z_{${i+1}} = ${latex}`} />
                        </div>
                        {result.decimal_roots?.[i] && (
                          <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-400 font-mono italic">
                            Decimal ≈ {result.decimal_roots[i]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'derivation' && (
              <div className="space-y-4 overflow-x-auto">
                <div className="p-4 bg-white/5 border border-white/10">
                  <h4 className="text-xs uppercase opacity-70 mb-2">1. Equation Type</h4>
                  <p className="text-sm">{(eqTypeOptions.find(o => o.value === eqType) || {}).label}</p>
                </div>
                {result.derivation?.expr && (
                <div className="p-4 bg-white/5 border border-white/10">
                  <h4 className="text-xs uppercase opacity-70 mb-2">2. Expand & Rewrite (z = x+iy)</h4>
                  <div className="text-sm break-all font-serif">
                    {result.derivation.expr}
                  </div>
                </div>
                )}
                {result.real_part && result.imag_part && (
                <div className="p-4 bg-white/5 border border-white/10">
                  <h4 className="text-xs uppercase opacity-70 mb-2">3. Solve Equation System</h4>
                  <div className="text-[#E4E3E0]">
                    <p className="mb-2 text-sm italic">F(x,y) = {result.real_part} = 0</p>
                    <p className="mb-2 text-sm italic">G(x,y) = {result.imag_part} = 0</p>
                    <p className="mt-4 text-xs opacity-70">
                      Using elimination / Gröbner basis or polynomial factorization to solve for x, y.
                    </p>
                  </div>
                </div>
                )}
              </div>
            )}

            {activeTab === 'geometry' && (
              <div className="p-4 bg-white/5 border border-white/10 text-center relative max-h-[400px] overflow-hidden">
                <svg width="400" height="400" className="mx-auto border border-white/20 bg-[#111]">
                  {/* Axis */}
                  <line x1="0" y1="200" x2="400" y2="200" stroke="rgba(255,255,255,0.2)" />
                  <line x1="200" y1="0" x2="200" y2="400" stroke="rgba(255,255,255,0.2)" />
                  <text x="380" y="190" fill="gray" fontSize="10">Re</text>
                  <text x="210" y="20" fill="gray" fontSize="10">Im</text>
                  <text x="202" y="212" fill="gray" fontSize="10">0</text>
                  
                  {/* Roots points */}
                  {(() => {
                    const points: {re: number, im: number, label: string}[] = [];
                    let maxScale = 1;

                    if (result.decimal_roots) {
                      result.decimal_roots.forEach((rootStr: string, i: number) => {
                        if (!rootStr) return;
                        const isPositive = rootStr.includes(" + ");
                        const parts = rootStr.split(isPositive ? " + " : " - ");
                        if (parts.length === 2) {
                          const re = parseFloat(parts[0]);
                          const imStr = parts[1].replace('i', '').trim();
                          const im = parseFloat(imStr) * (isPositive ? 1 : -1);
                          if (!isNaN(re) && !isNaN(im)) {
                            points.push({re, im, label: `z${i+1}`});
                            maxScale = Math.max(maxScale, Math.abs(re), Math.abs(im));
                          }
                        }
                      });
                    }

                    let locusData: any = null;
                    if (result.locus_data && eqType === 'E') {
                        locusData = result.locus_data;
                        if (locusData.type === 'circle') {
                            const r_sq = parseFloat(locusData.r_sq);
                            if (r_sq > 0) {
                                const r = Math.sqrt(r_sq);
                                const cx = parseFloat(locusData.center_x || "0");
                                const cy = parseFloat(locusData.center_y || "0");
                                maxScale = Math.max(maxScale, Math.abs(cx) + r, Math.abs(cy) + r);
                            }
                        } else if (locusData.type === 'line') {
                            const xc = parseFloat(locusData.xc || "0");
                            const yc = parseFloat(locusData.yc || "0");
                            const mc = parseFloat(locusData.Mc || "0");
                            if (!isNaN(xc) && !isNaN(yc)) {
                                if (Math.abs(xc) > 0.0001) maxScale = Math.max(maxScale, Math.abs(mc / xc));
                                if (Math.abs(yc) > 0.0001) maxScale = Math.max(maxScale, Math.abs(mc / yc));
                                maxScale = Math.max(maxScale, 10);
                            }
                        }
                    }

                    // We want maxScale to fit in ~160px (leaving 40px padding)
                    // So scaleFactor = 160 / maxScale
                    if (maxScale === 0) maxScale = 1;
                    const scaleFactor = 160 / maxScale;

                    let locusEl = null;
                    if (locusData) {
                        if (locusData.type === 'circle') {
                            const r_sq = parseFloat(locusData.r_sq);
                            if (r_sq > 0) {
                                const r = Math.sqrt(r_sq);
                                const cx = parseFloat(locusData.center_x || "0");
                                const cy = parseFloat(locusData.center_y || "0");
                                const svgCx = 200 + cx * scaleFactor;
                                const svgCy = 200 - cy * scaleFactor;
                                const svgR = r * scaleFactor;
                                locusEl = <circle cx={svgCx} cy={svgCy} r={svgR} stroke="#F59E0B" strokeWidth="2" fill="none" opacity="0.8" />;
                            }
                        } else if (locusData.type === 'line') {
                            const xc = parseFloat(locusData.xc || "0");
                            const yc = parseFloat(locusData.yc || "0");
                            const mc = parseFloat(locusData.Mc || "0");
                            const x1 = -maxScale * 2;
                            const x2 = maxScale * 2;
                            let y1, y2;
                            if (Math.abs(yc) > 0.0001) {
                                y1 = (-mc - xc * x1) / yc;
                                y2 = (-mc - xc * x2) / yc;
                                locusEl = (
                                    <line 
                                      x1={200 + x1 * scaleFactor} 
                                      y1={200 - y1 * scaleFactor} 
                                      x2={200 + x2 * scaleFactor} 
                                      y2={200 - y2 * scaleFactor} 
                                      stroke="#F59E0B" strokeWidth="2" opacity="0.8" 
                                    />
                                );
                            } else if (Math.abs(xc) > 0.0001) {
                                const x_val = -mc / xc;
                                locusEl = (
                                    <line 
                                      x1={200 + x_val * scaleFactor} 
                                      y1={0} 
                                      x2={200 + x_val * scaleFactor} 
                                      y2={400} 
                                      stroke="#F59E0B" strokeWidth="2" opacity="0.8" 
                                    />
                                );
                            }
                        }
                    }

                    return (
                      <>
                        {locusEl}
                        {points.map((p, i) => {
                          const cx = 200 + p.re * scaleFactor;
                          const cy = 200 - p.im * scaleFactor;
                          return (
                            <g key={i}>
                              <circle cx={cx} cy={cy} r="4" fill="#6EE7B7" />
                              <text x={cx+6} y={cy-6} fill="#6EE7B7" fontSize="10" className="font-mono">{p.label}</text>
                              <line x1="200" y1="200" x2={cx} y2={cy} stroke="#6EE7B7" strokeOpacity="0.5" strokeDasharray="2,2" />
                            </g>
                          )
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
            )}

            {activeTab === 'numeric verify' && (
              <div className="p-4 bg-white/5 border border-white/10">
                <p className="text-xs uppercase opacity-70 mb-4">Decimal Precision Export & Verification</p>
                {result.decimal_roots?.map((str: string, i: number) => (
                  <div key={i} className="mb-4">
                    <div className="text-white opacity-40 text-xs mb-1">z_{i+1} :</div>
                    <div className="font-mono text-sm break-all bg-[#111] p-3 border border-white/10 rounded-sm text-[#6EE7B7]">
                      {str || 'Exact form only (Unable to evalf 25)'}
                    </div>
                    {result.residuals?.[i] && (
                      <div className="text-[10px] mt-1 text-red-300 opacity-80">
                        * Residual |f(z)| = {result.residuals[i]} 
                        {parseFloat(result.residuals[i]) > 1e-10 && " (Warning: High residual)"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === 'matrix' && (
              <div className="p-4 bg-white/5 border border-white/10 overflow-x-auto">
                <p className="text-xs uppercase opacity-70 mb-4">Matrix Representation</p>
                {eqType === 'A' && result.matrix_data?.M ? (
                  <div className="flex items-center gap-4 text-sm font-serif">
                    <span className="text-2xl mr-2">[</span>
                    <div className="flex flex-col gap-2 items-center text-lg">
                       <div><span className="inline-block w-16 text-right">{result.matrix_data.M[0][0]}</span> <span className="inline-block w-16 text-right">{result.matrix_data.M[0][1]}</span></div>
                       <div><span className="inline-block w-16 text-right">{result.matrix_data.M[1][0]}</span> <span className="inline-block w-16 text-right">{result.matrix_data.M[1][1]}</span></div>
                    </div>
                    <span className="text-2xl ml-2">]</span>
                    <span className="text-2xl mr-2">[</span>
                    <div className="flex flex-col gap-2 items-center text-lg">
                       <div>x</div>
                       <div>y</div>
                    </div>
                    <span className="text-2xl ml-2">]</span>
                    <span className="mx-2">=</span>
                    <span className="text-2xl mr-2">[</span>
                    <div className="flex flex-col gap-2 items-center text-lg">
                       <div>{result.matrix_data.B[0]}</div>
                       <div>{result.matrix_data.B[1]}</div>
                    </div>
                    <span className="text-2xl ml-2">]</span>
                  </div>
                ) : (
                  <p className="opacity-70 italic text-sm text-center">Matrix representation is only available natively for Case A (Linear Mixed Conjugate). Other non-linear systems use Gröbner basis elimination.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
