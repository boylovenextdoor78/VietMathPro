import React, { useState } from 'react';
import { BlockMath } from 'react-katex';

interface MathSymbInputPanelProps {
  onInsert: (query: string) => void;
}

export function MathSymbInputPanel({ onInsert }: MathSymbInputPanelProps) {
  const [activeTab, setActiveTab] = useState<'derivative' | 'integral' | 'fraction' | 'mixed' | 'power_roots' | 'abs'>('fraction');

  // Input States
  // Derivative
  const [derivFunc, setDerivFunc] = useState('sin(x)');
  const [derivVar, setDerivVar] = useState('x');
  const [derivOrder, setDerivOrder] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [derivPoint, setDerivPoint] = useState('');

  // Integral
  const [integFunc, setIntegFunc] = useState('x^2');
  const [integVar, setIntegVar] = useState('x');
  const [integLower, setIntegLower] = useState('');
  const [integUpper, setIntegUpper] = useState('');

  // Fraction
  const [fracNum, setFracNum] = useState('1');
  const [fracDen, setFracDen] = useState('x');

  // Mixed Number
  const [mixedWhole, setMixedWhole] = useState('2');
  const [mixedNum, setMixedNum] = useState('1');
  const [mixedDen, setMixedDen] = useState('3');

  // Power & Roots
  const [powRootsSubTab, setPowRootsSubTab] = useState<'power' | 'sqrt' | 'cbrt' | 'nroot'>('power');
  const [powerBase, setPowerBase] = useState('x');
  const [powerExp, setPowerExp] = useState('5');
  const [sqrtExpr, setSqrtExpr] = useState('x^2 + 1');
  const [cbrtExpr, setCbrtExpr] = useState('x^3 - 8');
  const [nrootN, setNrootN] = useState('4');
  const [nrootExpr, setNrootExpr] = useState('16');

  // Absolute Value
  const [absExpr, setAbsExpr] = useState('x^2 - 4');

  // LaTeX Preview Generators
  const getFractionLatex = () => `\\frac{${fracNum || '?'}}{${fracDen || '?'}}`;
  
  const getMixedLatex = () => `${mixedWhole || '?'}\\frac{${mixedNum || '?'}}{${mixedDen || '?'}}`;
  
  const getPowerLatex = () => `{${powerBase || '?'}}^{${powerExp || '?'}}`;
  
  const getSqrtLatex = () => `\\sqrt{${sqrtExpr || '?'}}`;
  
  const getCbrtLatex = () => `\\sqrt[3]{${cbrtExpr || '?'}}`;
  
  const getNrootLatex = () => `\\sqrt[${nrootN || '?'}] {${nrootExpr || '?'}}`;
  
  const getAbsLatex = () => `\\left| ${absExpr || '?'} \\right|`;

  const getDerivativeLatex = () => {
    const f = derivFunc || '?';
    const v = derivVar || 'x';
    const ord = derivOrder > 1 ? `^{${derivOrder}}` : '';
    const dOrd = derivOrder > 1 ? `^{${derivOrder}}` : '';
    if (derivPoint) {
      return `\\left. \\frac{d${dOrd}}{d ${v}${ord}} \\left( ${f} \\right) \\right|_{${v} = ${derivPoint}}`;
    }
    return `\\frac{d${dOrd}}{d ${v}${ord}} \\left( ${f} \\right)`;
  };

  const getIntegralLatex = () => {
    const f = integFunc || '?';
    const v = integVar || 'x';
    if (integLower || integUpper) {
      const l = integLower || '0';
      const u = integUpper || '\\infty';
      return `\\int_{${l}}^{${u}} {${f}} \\, d${v}`;
    }
    return `\\int {${f}} \\, d${v}`;
  };

  // Insertion handlers
  const handleInsertFraction = () => {
    onInsert(`(${fracNum || '1'})/(${fracDen || 'x'})`);
  };

  const handleInsertMixed = () => {
    onInsert(`(${mixedWhole || '2'})+(${mixedNum || '1'})/(${mixedDen || '3'})`);
  };

  const handleInsertPower = () => {
    onInsert(`(${powerBase || 'x'})^(${powerExp || '2'})`);
  };

  const handleInsertSqrt = () => {
    onInsert(`sqrt(${sqrtExpr || 'x'})`);
  };

  const handleInsertCbrt = () => {
    onInsert(`(${cbrtExpr || 'x'})^(1/3)`);
  };

  const handleInsertNroot = () => {
    onInsert(`(${nrootExpr || 'x'})^(1/(${nrootN || '2'}))`);
  };

  const handleInsertAbs = () => {
    onInsert(`Abs(${absExpr || 'x'})`);
  };

  const handleInsertDerivative = () => {
    const f = derivFunc || 'x';
    const v = derivVar || 'x';
    const ord = derivOrder;
    const pt = derivPoint.trim();
    if (pt) {
      onInsert(`subs(diff(${f}, ${v}, ${ord}), ${v}, ${pt})`);
    } else {
      onInsert(`diff(${f}, ${v}, ${ord})`);
    }
  };

  const handleInsertIntegral = () => {
    const f = integFunc || 'x';
    const v = integVar || 'x';
    const l = integLower.trim();
    const u = integUpper.trim();
    if (l || u) {
      onInsert(`integrate(${f}, ${v}, ${l || '0'}, ${u || 'oo'})`);
    } else {
      onInsert(`integrate(${f}, ${v})`);
    }
  };

  const tabs = [
    { id: 'fraction', label: '½ Phân Số' },
    { id: 'mixed', label: '2½ Hỗn Số' },
    { id: 'power_roots', label: 'xⁿ / √ Căn' },
    { id: 'abs', label: '|x| Trị Tuyệt Đối' },
    { id: 'derivative', label: 'df/dx Đạo Hàm' },
    { id: 'integral', label: '∫ Tích Phân' },
  ] as const;

  return (
    <div className="bg-[#FAF9F6] border-2 border-[#141414] p-3 sm:p-4 rounded shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] max-w-full mx-auto space-y-4">
      {/* Category Selection Tabs - Row */}
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[9px] uppercase font-black tracking-widest text-[#141414]/50">
          MẪU CHÈN TOÁN HỌC (WOLFRAM STYLE)
        </span>
        <div className="flex border-b border-[#141414] overflow-x-auto pb-1 gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1 text-[11px] font-mono tracking-wide font-bold transition-all border border-[#141414]/10 rounded whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#141414] text-white border-[#141414] shadow-sm'
                  : 'bg-white hover:bg-gray-100 text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Main Canvas */}
      <div className="bg-white border border-[#141414] p-3 rounded flex flex-col justify-between gap-4 minimal-height">
        
        {/* Inline Math Builders */}
        
        {/* FRACTION */}
        {activeTab === 'fraction' && (
          <div className="flex flex-col items-center justify-center p-3 py-4 bg-gray-50/50 border border-dashed border-gray-300 rounded gap-4">
            <div className="inline-flex flex-col items-center justify-center gap-1.5">
              {/* Numerator */}
              <input
                type="text"
                value={fracNum}
                onChange={e => setFracNum(e.target.value)}
                placeholder=" tử số "
                className="w-24 text-center p-1 border border-[#141414] font-mono text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded"
              />
              {/* Div Line */}
              <div className="w-28 border-t-2 border-[#141414]" />
              {/* Denominator */}
              <input
                type="text"
                value={fracDen}
                onChange={e => setFracDen(e.target.value)}
                placeholder=" mẫu số "
                className="w-24 text-center p-1 border border-[#141414] font-mono text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded"
              />
            </div>

            {/* LaTeX Live Formula Rendering */}
            <div className="text-center h-12 flex items-center justify-center select-none scale-105">
              <BlockMath math={getFractionLatex()} />
            </div>

            <button
              onClick={handleInsertFraction}
              className="px-6 py-1.5 bg-[#141414] text-white text-xs font-mono font-bold uppercase rounded border border-[#141414] hover:bg-gray-800 tracking-wider"
            >
              Chèn phân số
            </button>
          </div>
        )}

        {/* MIXED NUMBER */}
        {activeTab === 'mixed' && (
          <div className="flex flex-col items-center justify-center p-3 py-4 bg-gray-50/50 border border-dashed border-gray-300 rounded gap-4">
            <div className="inline-flex items-center justify-center gap-2">
              {/* Whole */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-mono opacity-40 uppercase mb-0.5">Phần nguyên</span>
                <input
                  type="text"
                  value={mixedWhole}
                  onChange={e => setMixedWhole(e.target.value)}
                  placeholder="2"
                  className="w-14 text-center p-1.5 border border-[#141414] font-mono text-base font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded"
                />
              </div>

              {/* Fraction Numerator over Denominator */}
              <div className="flex flex-col items-center justify-center gap-1">
                <input
                  type="text"
                  value={mixedNum}
                  onChange={e => setMixedNum(e.target.value)}
                  placeholder=" tử "
                  className="w-14 text-center p-1 border border-[#141414] font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded"
                />
                <div className="w-16 border-t-2 border-[#141414]" />
                <input
                  type="text"
                  value={mixedDen}
                  onChange={e => setMixedDen(e.target.value)}
                  placeholder=" mẫu "
                  className="w-14 text-center p-1 border border-[#141414] font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded"
                />
              </div>
            </div>

            {/* LaTeX Live Formula Rendering */}
            <div className="text-center h-12 flex items-center justify-center select-none scale-105">
              <BlockMath math={getMixedLatex()} />
            </div>

            <button
              onClick={handleInsertMixed}
              className="px-6 py-1.5 bg-[#141414] text-white text-xs font-mono font-bold uppercase rounded border border-[#141414] hover:bg-gray-800 tracking-wider"
            >
              Chèn hỗn số
            </button>
          </div>
        )}

        {/* POWER & ROOTS */}
        {activeTab === 'power_roots' && (
          <div className="space-y-4">
            {/* Sub navigation bar */}
            <div className="flex justify-center border-b border-gray-200 pb-1.5 gap-1 select-none">
              {(['power', 'sqrt', 'cbrt', 'nroot'] as const).map(sub => (
                <button
                  key={sub}
                  onClick={() => setPowRootsSubTab(sub)}
                  className={`px-2 py-0.5 text-[10px] font-mono border rounded ${
                    powRootsSubTab === sub
                      ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold'
                      : 'border-transparent text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {sub === 'power' && 'aᵇ Lũy Thừa'}
                  {sub === 'sqrt' && '√x Căn Hai'}
                  {sub === 'cbrt' && '∛x Căn Ba'}
                  {sub === 'nroot' && 'ⁿ√x Căn n'}
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center justify-center p-3 bg-gray-50/50 border border-dashed border-gray-300 rounded gap-4 min-h-[140px]">
              
              {/* Power */}
              {powRootsSubTab === 'power' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="inline-flex items-end justify-center gap-1">
                    {/* Base */}
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-mono opacity-40 uppercase mb-0.5">Cơ số (Base)</span>
                      <input
                        type="text"
                        value={powerBase}
                        onChange={e => setPowerBase(e.target.value)}
                        placeholder="x"
                        className="w-24 text-center p-1.5 border border-[#141414] font-mono text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded bg-white"
                      />
                    </div>
                    {/* Exponent */}
                    <div className="flex flex-col items-center -translate-y-2">
                      <span className="text-[9px] font-mono opacity-40 uppercase mb-0.5">Mũ (Exp)</span>
                      <input
                        type="text"
                        value={powerExp}
                        onChange={e => setPowerExp(e.target.value)}
                        placeholder="5"
                        className="w-12 text-center p-1 border border-[#141414] font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded bg-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="text-center h-12 flex items-center justify-center select-none scale-110">
                    <BlockMath math={getPowerLatex()} />
                  </div>

                  <button
                    onClick={handleInsertPower}
                    className="px-6 py-1.5 bg-[#141414] text-white text-xs font-mono font-bold uppercase rounded border border-[#141414] hover:bg-gray-800 tracking-wider"
                  >
                    Chèn lũy thừa
                  </button>
                </div>
              )}

              {/* Square Root */}
              {powRootsSubTab === 'sqrt' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="inline-flex items-center justify-center">
                    <span className="text-2xl font-serif italic text-gray-800 select-none mr-0.5 pt-1">√</span>
                    <div className="border-t-2 border-[#141414] pt-1.5 -ml-1">
                      <input
                        type="text"
                        value={sqrtExpr}
                        onChange={e => setSqrtExpr(e.target.value)}
                        placeholder="biểu thức"
                        className="w-36 text-center p-1 border border-[#141414] font-mono text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded bg-white"
                      />
                    </div>
                  </div>

                  <div className="text-center h-12 flex items-center justify-center select-none scale-110">
                    <BlockMath math={getSqrtLatex()} />
                  </div>

                  <button
                    onClick={handleInsertSqrt}
                    className="px-6 py-1.5 bg-[#141414] text-white text-xs font-mono font-bold uppercase rounded border border-[#141414] hover:bg-gray-800 tracking-wider"
                  >
                    Chèn căn bậc 2
                  </button>
                </div>
              )}

              {/* Cube Root */}
              {powRootsSubTab === 'cbrt' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="inline-flex items-start justify-center">
                    <sup className="text-[10px] font-mono pt-1 text-gray-600 select-none -mr-1 z-10 font-bold">3</sup>
                    <span className="text-2xl font-serif italic text-gray-800 select-none pt-2">√</span>
                    <div className="border-t-2 border-[#141414] pt-1.5 -ml-1 mt-2">
                      <input
                        type="text"
                        value={cbrtExpr}
                        onChange={e => setCbrtExpr(e.target.value)}
                        placeholder="biểu thức"
                        className="w-36 text-center p-1 border border-[#141414] font-mono text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded bg-white"
                      />
                    </div>
                  </div>

                  <div className="text-center h-12 flex items-center justify-center select-none scale-110">
                    <BlockMath math={getCbrtLatex()} />
                  </div>

                  <button
                    onClick={handleInsertCbrt}
                    className="px-6 py-1.5 bg-[#141414] text-white text-xs font-mono font-bold uppercase rounded border border-[#141414] hover:bg-gray-800 tracking-wider"
                  >
                    Chèn căn bậc 3
                  </button>
                </div>
              )}

              {/* n-th Root */}
              {powRootsSubTab === 'nroot' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="inline-flex items-start justify-center">
                    <div className="flex flex-col items-center pt-0.5">
                      <span className="text-[8px] font-mono opacity-40 uppercase">bậc n</span>
                      <input
                        type="text"
                        value={nrootN}
                        onChange={e => setNrootN(e.target.value)}
                        placeholder="n"
                        className="w-10 text-center p-0.5 border border-[#141414] font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded bg-white font-bold"
                      />
                    </div>
                    <span className="text-2xl font-serif italic text-gray-800 select-none pt-2.5 ml-0.5">√</span>
                    <div className="border-t-2 border-[#141414] pt-1.5 -ml-1 mt-3">
                      <input
                        type="text"
                        value={nrootExpr}
                        onChange={e => setNrootExpr(e.target.value)}
                        placeholder="biểu thức"
                        className="w-36 text-center p-1 border border-[#141414] font-mono text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded bg-white"
                      />
                    </div>
                  </div>

                  <div className="text-center h-12 flex items-center justify-center select-none scale-110">
                    <BlockMath math={getNrootLatex()} />
                  </div>

                  <button
                    onClick={handleInsertNroot}
                    className="px-6 py-1.5 bg-[#141414] text-white text-xs font-mono font-bold uppercase rounded border border-[#141414] hover:bg-gray-800 tracking-wider"
                  >
                    Chèn căn bậc n
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ABSOLUTE VALUE */}
        {activeTab === 'abs' && (
          <div className="flex flex-col items-center justify-center p-3 py-4 bg-gray-50/50 border border-dashed border-gray-300 rounded gap-4">
            <div className="inline-flex items-center justify-center gap-1.5">
              <span className="text-3xl font-light text-gray-400 select-none leading-none">|</span>
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-mono opacity-40 uppercase mb-0.5">Biểu thức (Expr)</span>
                <input
                  type="text"
                  value={absExpr}
                  onChange={e => setAbsExpr(e.target.value)}
                  placeholder="biểu thức"
                  className="w-44 text-center p-1 border border-[#141414] font-mono text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded"
                />
              </div>
              <span className="text-3xl font-light text-gray-400 select-none leading-none">|</span>
            </div>

            {/* LaTeX Live Formula Rendering */}
            <div className="text-center h-12 flex items-center justify-center select-none scale-105">
              <BlockMath math={getAbsLatex()} />
            </div>

            <button
              onClick={handleInsertAbs}
              className="px-6 py-1.5 bg-[#141414] text-white text-xs font-mono font-bold uppercase rounded border border-[#141414] hover:bg-gray-800 tracking-wider"
            >
              Chèn trị tuyệt đối
            </button>
          </div>
        )}

        {/* DERIVATIVE ASSISTANT */}
        {activeTab === 'derivative' && (
          <div className="flex flex-col p-3 bg-gray-50/50 border border-[#141414]/10 rounded gap-4">
            {/* Structural visual layout */}
            <div className="flex flex-col md:flex-row items-center gap-4 justify-center bg-white p-3 border border-[#141414]/10 rounded">
              
              {/* Operator */}
              <div className="inline-flex items-center gap-1">
                <div className="flex flex-col items-center">
                  <div className="flex items-center text-xs font-mono">
                    d{derivOrder > 1 && <sup className="text-[9px] scale-90">{derivOrder}</sup>}
                  </div>
                  <div className="w-10 border-t border-[#141414]" />
                  <div className="flex items-center text-xs font-mono">
                    d
                    <input
                      type="text"
                      value={derivVar}
                      onChange={e => setDerivVar(e.target.value)}
                      placeholder="x"
                      className="w-6 text-center text-xs font-mono p-0 border border-transparent font-bold focus:border-[#141414] focus:outline-none bg-yellow-50/50"
                    />
                    {derivOrder > 1 && <sup className="text-[9px] scale-90">{derivOrder}</sup>}
                  </div>
                </div>

                <span className="text-2xl font-light text-gray-400 ml-1 select-none">(</span>
                
                {/* Function f(x) */}
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-mono opacity-30 uppercase">HÀM SỐ F(X)</span>
                  <input
                    type="text"
                    value={derivFunc}
                    onChange={e => setDerivFunc(e.target.value)}
                    placeholder="sin(x)*e^x"
                    className="w-36 text-center p-1 border border-[#141414] font-mono text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded font-bold"
                  />
                </div>

                <span className="text-2xl font-light text-gray-400 select-none">)</span>

                {/* Point evaluation line */}
                <span className="text-2xl font-light text-gray-400 select-none ml-1">|</span>

                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-mono opacity-30 uppercase">TẠI ĐIỂM (TÙY CHỌN)</span>
                  <div className="flex items-center text-xs font-mono gap-0.5">
                    <span>{derivVar || 'x'} =</span>
                    <input
                      type="text"
                      value={derivPoint}
                      onChange={e => setDerivPoint(e.target.value)}
                      placeholder="bỏ trống"
                      className="w-12 text-center p-0.5 border border-[#141414] font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Order selector buttons */}
              <div className="flex items-center gap-1 border-l border-[#141414]/15 pl-4 flex-col">
                <span className="text-[8px] font-mono opacity-40 uppercase mb-1">Cấp đạo hàm</span>
                <div className="flex gap-1 select-none">
                  {[1, 2, 3, 4, 5].map(o => (
                    <button
                      key={o}
                      onClick={() => setDerivOrder(o as any)}
                      className={`w-7 h-7 rounded text-[11px] font-mono font-bold border transition-all ${
                        derivOrder === o
                          ? 'bg-[#141414] text-white border-[#141414] scale-105 shadow-sm'
                          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* LaTeX Live Formula Rendering */}
            <div className="text-center h-12 flex items-center justify-center select-none scale-105">
              <BlockMath math={getDerivativeLatex()} />
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleInsertDerivative}
                className="px-6 py-1.5 bg-[#141414] text-white text-xs font-mono font-bold uppercase rounded border border-[#141414] hover:bg-gray-800 tracking-wider"
              >
                Chèn đạo hàm
              </button>
            </div>
          </div>
        )}

        {/* INTEGRAL ASSISTANT */}
        {activeTab === 'integral' && (
          <div className="flex flex-col p-3 bg-gray-50/50 border border-[#141414]/10 rounded gap-4">
            {/* Structural visual layout */}
            <div className="flex items-center gap-3 justify-center bg-white p-3 border border-[#141414]/10 rounded">
              
              {/* Integral Icon and Bounds */}
              <div className="flex flex-col items-center">
                {/* Upper Bound */}
                <input
                  type="text"
                  value={integUpper}
                  onChange={e => setIntegUpper(e.target.value)}
                  placeholder="∞"
                  className="w-10 text-center text-[10px] p-0.5 border border-[#141414] font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded bg-indigo-50/30"
                />
                
                {/* Icon */}
                <span className="text-3xl font-serif italic text-gray-800 select-none leading-none my-0.5 pointer-events-none">∫</span>
                
                {/* Lower Bound */}
                <input
                  type="text"
                  value={integLower}
                  onChange={e => setIntegLower(e.target.value)}
                  placeholder="0"
                  className="w-10 text-center text-[10px] p-0.5 border border-[#141414] font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded bg-indigo-50/30"
                />
              </div>

              {/* Integrand Function */}
              <div className="flex flex-col items-start gap-0.5 flex-1 max-w-[170px]">
                <span className="text-[8px] font-mono opacity-30 uppercase pl-1">BIỂU THỨC TÍCH PHÂN (F(X))</span>
                <input
                  type="text"
                  value={integFunc}
                  onChange={e => setIntegFunc(e.target.value)}
                  placeholder="x^2"
                  className="w-full p-1.5 border border-[#141414] font-mono text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded font-bold"
                />
              </div>

              {/* Differential */}
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-mono opacity-30 uppercase">BIẾN SỐ</span>
                <div className="flex items-center text-sm font-bold font-mono">
                  <span>d</span>
                  <input
                    type="text"
                    value={integVar}
                    onChange={e => setIntegVar(e.target.value)}
                    placeholder="x"
                    className="w-6 text-center text-xs p-0 border border-transparent focus:border-[#141414] focus:outline-none font-bold bg-yellow-50/50"
                  />
                </div>
              </div>

            </div>

            <p className="text-[9px] font-mono text-gray-500 text-center italic bg-white/60 p-1 border border-gray-100 rounded leading-snug">
              💡 Bỏ trống hai cận để chèn tích phân bất định.
            </p>

            {/* LaTeX Live Formula Rendering */}
            <div className="text-center h-12 flex items-center justify-center select-none scale-105">
              <BlockMath math={getIntegralLatex()} />
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleInsertIntegral}
                className="px-6 py-1.5 bg-[#141414] text-white text-xs font-mono font-bold uppercase rounded border border-[#141414] hover:bg-gray-800 tracking-wider"
              >
                Chèn tích phân
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
