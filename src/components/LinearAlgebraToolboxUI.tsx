import React, { useState } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import { evaluate } from 'mathjs';
import { 
  Calculator, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Minus, 
  Trash2, 
  Layers, 
  Grid3X3, 
  Sparkles, 
  RefreshCw, 
  HelpCircle,
  Play,
  Sigma,
  Activity
} from 'lucide-react';
import { 
  VectorEngine, 
  MatrixEngine, 
  RREFEngine, 
  DecompositionEngine, 
  EigenEngine, 
  JacobiDiagonalizer, 
  MatrixPowerEngine, 
  MatrixSymbolicParser, 
  VALID_MATRIX_NAMES, 
  MatrixStorage, 
  Matrix, 
  Complex,
  ComplexMatrixEngine,
  DecimalComplex,
  DecimalComplexMatrix,
  DecimalComplexMatrixEngine,
  formatNum, 
  sanitizeMatrix,
  getHighPrecision25
} from '../lib/linearAlgebraEngine';

export function LinearAlgebraToolboxUI() {
  const [activeTab, setActiveTab] = useState<'vector' | 'matrix' | 'calc' | 'decomp' | 'eigen' | 'power'>('vector');
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 1500);
  };

  // =========================================================================
  // VECTOR ENGINE STATE & UI - NEW 2D/3D ADVANCED CAS WORKSPACE
  // =========================================================================
  const [vectorDim, setVectorDim] = useState<'2D' | '3D'>('3D');

  // Vector slot declarations v1 - v5
  const [v1, setV1] = useState({ x: '1', y: '2', z: '3', active: true });
  const [v2, setV2] = useState({ x: '3', y: '-1', z: '2', active: true });
  const [v3, setV3] = useState({ x: '0', y: '5', z: '-2', active: true });
  const [v4, setV4] = useState({ x: '2', y: '2', z: '0', active: false });
  const [v5, setV5] = useState({ x: '-1', y: '4', z: '1', active: false });

  // Vector 6: Vector Ans
  const [vectorAns, setVectorAns] = useState<number[]>([1, -1, 4]);

  // Checkboxes for multi-addition or multi-subtraction
  const [selectedForMulti, setSelectedForMulti] = useState<{ [key: string]: boolean }>({
    v1: true,
    v2: true,
    v3: false,
    v4: false,
    v5: false
  });

  // Formula string input
  const [formulaInput, setFormulaInput] = useState('2 * v1 - 3 * v2 + Vector_Ans');

  // Vector multiplication operands (supports v1-v5 & Vector_Ans)
  const [multLeft, setMultLeft] = useState<string>('v1');
  const [multRight, setMultRight] = useState<string>('Vector_Ans');

  // Analytic tools operands
  const [analLeft, setAnalLeft] = useState<string>('v1');
  const [analRight, setAnalRight] = useState<string>('v2');

  const [tripleVecA, setTripleVecA] = useState<string>('v1');
  const [tripleVecB, setTripleVecB] = useState<string>('v2');
  const [tripleVecC, setTripleVecC] = useState<string>('v3');

  const [lcTarget, setLcTarget] = useState<string>('v3');
  const [lcBase1, setLcBase1] = useState<string>('v1');
  const [lcBase2, setLcBase2] = useState<string>('v2');

  // Points declarations P1 - P5
  const [p1, setP1] = useState({ x: '1', y: '2', z: '3' });
  const [p2, setP2] = useState({ x: '3', y: '1', z: '4' });
  const [p3, setP3] = useState({ x: '0', y: '-2', z: '1' });
  const [p4, setP4] = useState({ x: '2', y: '1', z: '0' });
  const [p5, setP5] = useState({ x: '-1', y: '3', z: '2' });

  // Points selection for calculation
  const [pointSelA, setPointSelA] = useState<string>('P1');
  const [pointSelB, setPointSelB] = useState<string>('P2');
  const [pointSelC, setPointSelC] = useState<string>('P3');

  // Outputs & Errors
  const [vecError, setVecError] = useState('');
  const [vecOutputHtml, setVecOutputHtml] = useState<React.ReactNode[]>([]);

  // Mathematical parser & numerical solvers
  const safeParseCoordinate = (val: string): number => {
    if (!val || val.trim() === '') return 0;
    try {
      const clean = val.trim().replace(/(\d+)sqrt/g, '$1*sqrt');
      const res = evaluate(clean);
      return typeof res === 'number' ? res : parseFloat(res);
    } catch (e) {
      return NaN;
    }
  };

  const getVectorActiveState = (name: string): boolean => {
    if (name === 'v1') return v1.active;
    if (name === 'v2') return v2.active;
    if (name === 'v3') return v3.active;
    if (name === 'v4') return v4.active;
    if (name === 'v5') return v5.active;
    if (name === 'Vector_Ans') return true;
    return false;
  };

  const getEvaluatedVector = (name: string): number[] => {
    let raw: number[] = [];
    if (name === 'v1') raw = [safeParseCoordinate(v1.x), safeParseCoordinate(v1.y), safeParseCoordinate(v1.z)];
    else if (name === 'v2') raw = [safeParseCoordinate(v2.x), safeParseCoordinate(v2.y), safeParseCoordinate(v2.z)];
    else if (name === 'v3') raw = [safeParseCoordinate(v3.x), safeParseCoordinate(v3.y), safeParseCoordinate(v3.z)];
    else if (name === 'v4') raw = [safeParseCoordinate(v4.x), safeParseCoordinate(v4.y), safeParseCoordinate(v4.z)];
    else if (name === 'v5') raw = [safeParseCoordinate(v5.x), safeParseCoordinate(v5.y), safeParseCoordinate(v5.z)];
    else if (name === 'Vector_Ans') raw = [...vectorAns];
    else throw new Error(`Không xác định được vector: ${name}`);

    for (const val of raw) {
      if (isNaN(val)) throw new Error(`Vector ${name} chứa dữ liệu/biểu thức không hợp lệ ở các tọa độ.`);
    }

    return vectorDim === '2D' ? raw.slice(0, 2) : raw;
  };

  // Rational continued fraction & Exact radical factorization engine (CAS-level Geometry Pro parity)
  const findRational = (x: number, maxDenominator: number = 1000000): { p: number, q: number } | null => {
    const eps = 1e-12;
    let m00 = 1, m01 = 0, m10 = 0, m11 = 1;
    let originalX = x;
    let cnt = 0;
    let val = x;
    while (cnt++ < 100) {
      let a = Math.floor(val);
      let abs_a = Math.abs(a);
      if (abs_a > 1e12 && cnt > 1) break;
      
      let n0 = m00 * a + m01;
      let n1 = m10 * a + m11;
      if (n1 > maxDenominator) break;
      
      m01 = m00;
      m00 = n0;
      m11 = m10;
      m10 = n1;
      
      if (Math.abs(originalX - m00 / m10) < eps) {
        return { p: m00, q: m10 };
      }
      
      let diff = val - a;
      if (Math.abs(diff) < 1e-12) {
        break;
      }
      val = 1.0 / diff;
    }
    return { p: m00, q: m10 };
  };

  const gcd = (a: number, b: number): number => {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      let t = b;
      b = a % b;
      a = t;
    }
    return a;
  };

  const simplifyRadicalOfFraction = (p: number, q: number): { a: number, b: number, c: number } => {
    let N = p * q;
    let factorA = 1;
    let remB = N;
    for (let i = 2; i * i <= remB; i++) {
      while (remB % (i * i) === 0) {
        factorA *= i;
        remB /= (i * i);
      }
    }
    const g = gcd(factorA, q);
    const finalA = factorA / g;
    const finalC = q / g;
    return { a: finalA, b: remB, c: finalC };
  };

  const formatExactRadical = (a: number, b: number, c: number): string => {
    if (b === 1) {
      if (c === 1) return `${a}`;
      return `\\frac{${a}}{${c}}`;
    }
    let radicalStr = `\\sqrt{${b}}`;
    let numerator = a === 1 ? radicalStr : `${a}${radicalStr}`;
    if (c === 1) return numerator;
    return `\\frac{${numerator}}{${c}}`;
  };

  const getExactDistanceAndDecimal = (distSq: number): { exactLatex: string, decimal25: string } => {
    if (isNaN(distSq) || distSq < 0) {
      return { exactLatex: "?", decimal25: "?" };
    }
    if (distSq === 0) {
      return { exactLatex: "0", decimal25: "0.0000000000000000000000000" };
    }
    
    const rational = findRational(distSq);
    if (rational && rational.q < 1000000 && Math.abs(distSq - rational.p / rational.q) < 1e-11) {
      const { a, b, c } = simplifyRadicalOfFraction(rational.p, rational.q);
      const exactLatex = formatExactRadical(a, b, c);
      let decString = "";
      try {
        decString = Math.sqrt(distSq).toFixed(25);
      } catch (e) {
        const numVal = (a * Math.sqrt(b)) / c;
        decString = numVal.toFixed(25);
      }
      return { exactLatex, decimal25: decString };
    }
    const numVal = Math.sqrt(distSq);
    return { exactLatex: `\\approx ${numVal.toFixed(4)}`, decimal25: numVal.toFixed(25) };
  };

  // Core functions
  const handleFormulaEvaluation = () => {
    setVecError('');
    setVecOutputHtml([]);
    try {
      const vars = ['Vector_Ans', 'v1', 'v2', 'v3', 'v4', 'v5'];
      const registry: Record<string, number[]> = {
        v1: getEvaluatedVector('v1'),
        v2: getEvaluatedVector('v2'),
        v3: getEvaluatedVector('v3'),
        v4: getEvaluatedVector('v4'),
        v5: getEvaluatedVector('v5'),
        Vector_Ans: [...vectorAns]
      };
      
      const dimCount = vectorDim === '2D' ? 2 : 3;
      const resultCoords: number[] = [];
      
      for (let d = 0; d < dimCount; d++) {
        let coordExpr = formulaInput;
        for (const vKey of vars) {
          const vec = registry[vKey];
          // If vector is not active or empty, default to zero
          const val = (vec && vec[d] !== undefined) ? vec[d] : 0;
          const regex = new RegExp(`\\b${vKey}\\b`, 'g');
          coordExpr = coordExpr.replace(regex, `(${val})`);
        }
        
        try {
          const evalRes = evaluate(coordExpr);
          if (typeof evalRes !== 'number' || isNaN(evalRes) || !isFinite(evalRes)) {
            throw new Error(`Độ phân giải tọa độ ${d === 0 ? 'X' : d === 1 ? 'Y' : 'Z'} không hợp lệ.`);
          }
          resultCoords.push(evalRes);
        } catch (err: any) {
          throw new Error(`Lỗi cú pháp tại tọa độ ${d === 0 ? 'X' : d === 1 ? 'Y' : 'Z'}: ${err.message}`);
        }
      }
      
      setVectorAns(resultCoords);
      const sumSq = resultCoords.reduce((acc, c) => acc + c*c, 0);
      const { exactLatex, decimal25 } = getExactDistanceAndDecimal(sumSq);
      const resultStr = `[${resultCoords.map(formatNum).join(', ')}]`;
      
      const output = (
        <div className="space-y-3.5 text-[#141414] text-xs font-mono" key="eval">
          <div className="flex justify-between items-center bg-purple-50 p-2 rounded border border-purple-200">
            <span className="font-bold text-purple-900 text-[10px] uppercase">GIẢI BIỂU THỨC</span>
            <span className="text-[10px] text-purple-700 bg-white px-1.5 py-0.5 rounded border border-purple-300">Đã cập nhật Ans</span>
          </div>

          <div className="p-3 bg-white border border-[#141414]/15 rounded-lg space-y-2">
            <p className="opacity-70 text-[10px] font-bold">BIỂU THỨC:</p>
            <p className="font-semibold text-xs leading-relaxed break-all bg-neutral-50 p-1.5 rounded select-all font-mono">
              {formulaInput}
            </p>
            <p className="opacity-70 text-[10px] font-bold mt-1">KẾT QUẢ:</p>
            <p className="font-extrabold text-sm text-[#141414] bg-neutral-50 px-2 py-1 rounded inline-block">
              {resultStr}
            </p>
          </div>

          <div className="p-3 bg-white border border-[#141414]/15 rounded-lg space-y-2 text-[11px]">
            <p className="font-bold text-[10px] opacity-70">PHÂN TÍCH ANS:</p>
            <div className="space-y-1">
              <div className="flex justify-between border-b border-neutral-100 pb-1">
                <span className="opacity-60 text-[10px]">Cơ sở i, j, k:</span>
                <span className="font-bold">
                  {vectorDim === '2D'
                    ? `${formatNum(resultCoords[0])}i ${resultCoords[1] >= 0 ? '+' : ''}${formatNum(resultCoords[1])}j`
                    : `${formatNum(resultCoords[0])}i ${resultCoords[1] >= 0 ? '+' : ''}${formatNum(resultCoords[1])}j ${resultCoords[2] >= 0 ? '+' : ''}${formatNum(resultCoords[2])}k`
                  }
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-1">
                <span className="opacity-60 text-[10px]">Độ dài symbolic:</span>
                <span className="font-extrabold text-[#141414] italic" style={{ color: '#141414' }}><InlineMath math={`${exactLatex}`} /></span>
              </div>
              <div className="space-y-1 pt-1">
                <span className="opacity-60 text-[9px] block">Khai triển decimal:</span>
                <input
                  type="text"
                  readOnly
                  value={decimal25.length > 15 ? decimal25.slice(0, 15) + "..." : decimal25}
                  className="w-full bg-neutral-50 px-1.5 py-0.5 border text-[10px] rounded font-mono select-all text-neutral-600 focus:outline-none"
                  title={decimal25}
                />
              </div>
            </div>
          </div>
        </div>
      );
      setVecOutputHtml([output]);
    } catch (err: any) {
      setVecError(err.message || "Lỗi phân tích biểu thức.");
    }
  };

  const handleMultiVectorOperation = (op: 'add' | 'subtract') => {
    setVecError('');
    setVecOutputHtml([]);
    try {
      const activeKeys = Object.keys(selectedForMulti).filter(key => selectedForMulti[key] && getVectorActiveState(key));
      if (activeKeys.length < 2) {
        throw new Error("Vui lòng kích hoạt và đánh dấu ít nhất 2 vector để tính cộng/trừ đồng loạt.");
      }

      const dimCount = vectorDim === '2D' ? 2 : 3;
      const registry: Record<string, number[]> = {};
      for (const k of activeKeys) {
        registry[k] = getEvaluatedVector(k);
      }

      const resultCoords: number[] = Array(dimCount).fill(0);
      const firstVec = registry[activeKeys[0]];
      for (let d = 0; d < dimCount; d++) {
        resultCoords[d] = firstVec[d];
      }

      for (let i = 1; i < activeKeys.length; i++) {
        const k = activeKeys[i];
        const vCoords = registry[k];
        for (let d = 0; d < dimCount; d++) {
          if (op === 'add') resultCoords[d] += vCoords[d];
          else resultCoords[d] -= vCoords[d];
        }
      }

      setVectorAns(resultCoords);
      const sumSq = resultCoords.reduce((acc, c) => acc + c*c, 0);
      const { exactLatex } = getExactDistanceAndDecimal(sumSq);
      const resultStr = `[${resultCoords.map(formatNum).join(', ')}]`;

      const output = (
        <div className="space-y-3.5 text-[#141414] text-xs font-mono" key="multi">
          <div className="flex justify-between items-center bg-teal-50 p-2 rounded border border-teal-200">
            <span className="font-bold text-teal-950 text-[10px] uppercase">Σ ĐỒNG LOẠT ({op === 'add' ? 'CỘNG' : 'TRỪ'})</span>
            <span className="text-[10px] text-teal-700 bg-white px-1.5 py-0.5 rounded border border-teal-300">Ans updated</span>
          </div>

          <div className="p-3 bg-white border border-[#141414]/15 rounded-lg space-y-1.5 text-[11px]">
            <p className="opacity-70 text-[10px] font-bold">CÁC VECTOR ĐÃ GHÉP:</p>
            <div className="bg-neutral-50 p-2 rounded space-y-1 text-[10px] border">
              {activeKeys.map((k, idx) => (
                <p key={idx} className="flex justify-between border-b border-neutral-100 last:border-0 pb-0.5">
                  <span className="font-bold">{k}</span>
                  <span className="text-neutral-500">[{registry[k].map(formatNum).join(', ')}]</span>
                </p>
              ))}
            </div>
            
            <p className="opacity-70 text-[10px] font-bold pt-1">TOẠ ĐỘ KẾT QUẢ:</p>
            <p className="font-extrabold text-sm text-[#141414] bg-neutral-50 px-2 py-1 rounded inline-block">
              {resultStr}
            </p>
            
            <div className="flex justify-between pt-1 text-[10px] border-t border-dashed mt-2">
              <span className="opacity-60">Độ dài:</span>
              <span className="font-extrabold text-[#141414] italic" style={{ color: '#141414' }}><InlineMath math={`${exactLatex}`} /></span>
            </div>
          </div>
        </div>
      );
      setVecOutputHtml([output]);
    } catch (err: any) {
      setVecError(err.message || "Lỗi xử lý phép tính đồng loạt.");
    }
  };

  const handleVectorMultiplication = (type: 'dot' | 'cross') => {
    setVecError('');
    setVecOutputHtml([]);
    try {
      const a = getEvaluatedVector(multLeft);
      const b = getEvaluatedVector(multRight);
      const dim = vectorDim;

      if (type === 'dot') {
        const value = a.reduce((sum, v, idx) => sum + v * b[idx], 0);
        const steps = a.map((v, idx) => `(${formatNum(v)})*(${formatNum(b[idx])})`).join('+');

        const magA = Math.sqrt(a.reduce((s, c) => s + c*c, 0));
        const magB = Math.sqrt(b.reduce((s, c) => s + c*c, 0));
        let angleText = "";
        if (magA > 1e-12 && magB > 1e-12) {
          const cosTheta = value / (magA * magB);
          const rad = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
          const deg = (rad * 180) / Math.PI;
          angleText = `cos(θ) ≈ ${cosTheta.toFixed(3)} => θ ≈ ${deg.toFixed(1)}°`;
        }

        const output = (
          <div className="space-y-3.5 text-[#141414] text-xs font-mono" key="dot">
            <div className="flex justify-between items-center bg-amber-50 p-2 rounded border border-amber-200">
              <span className="font-bold text-amber-950 text-[10px] uppercase">TÍCH VÔ HƯỚNG</span>
              <span className="text-[10px] text-amber-700 bg-white px-1.5 py-0.5 rounded border border-amber-300">A . B</span>
            </div>

            <div className="p-3 bg-white border border-[#141414]/15 rounded-lg space-y-2 text-[11px]">
              <p className="font-bold text-[10px] opacity-70">PHÉP TÍNH SỐ:</p>
              <p className="text-[10px] bg-neutral-50 p-1 rounded select-all font-mono border text-neutral-500 leading-tight">
                {multLeft} . {multRight} = {steps}
              </p>
              
              <div className="flex justify-between items-center pt-1.5 border-t border-neutral-100">
                <span className="opacity-60 text-[10px]">Scalar kết quả:</span>
                <span className="font-extrabold text-[#141414] text-sm">{formatNum(value)}</span>
              </div>

              {angleText && (
                <div className="bg-neutral-50 p-1.5 rounded border text-[9px] text-neutral-600 mt-1">
                  💡 {angleText}
                </div>
              )}
            </div>
          </div>
        );
        setVecOutputHtml([output]);
      } else {
        // Cross Product
        let crossRes: number[] = [];
        let stepsHtml: React.ReactNode = null;

        if (dim === '3D') {
          const cx = a[1]*b[2] - a[2]*b[1];
          const cy = a[2]*b[0] - a[0]*b[2];
          const cz = a[0]*b[1] - a[1]*b[0];
          crossRes = [cx, cy, cz];

          stepsHtml = (
            <div className="space-y-0.5 font-mono text-[10px] text-neutral-500 bg-neutral-50 p-1.5 rounded border leading-snug">
              <p>x: {formatNum(a[1])}*{formatNum(b[2])} - {formatNum(a[2])}*{formatNum(b[1])} = {formatNum(cx)}</p>
              <p>y: {formatNum(a[2])}*{formatNum(b[0])} - {formatNum(a[0])}*{formatNum(b[2])} = {formatNum(cy)}</p>
              <p>z: {formatNum(a[0])}*{formatNum(b[1])} - {formatNum(a[1])}*{formatNum(b[0])} = {formatNum(cz)}</p>
            </div>
          );
        } else {
          // 2D: det = a_x * b_y - a_y * b_x, stored as square-free 3D vector [0, 0, det]
          const det = a[0]*b[1] - a[1]*b[0];
          crossRes = [0, 0, det];

          stepsHtml = (
            <div className="bg-neutral-50 p-1.5 rounded border text-[10px] font-mono text-neutral-500 space-y-1 leading-snug">
              <p>Det(A, B) = {formatNum(a[0])}*{formatNum(b[1])} - {formatNum(a[1])}*{formatNum(b[0])} = {formatNum(det)}</p>
              <p className="text-[9px] italic text-neutral-400">* Đã mã hóa 3D [0, 0, {formatNum(det)}]</p>
            </div>
          );
        }

        setVectorAns(crossRes);
        const output = (
          <div className="space-y-3.5 text-[#141414] text-xs font-mono" key="cross">
            <div className="flex justify-between items-center bg-orange-50 p-2 rounded border border-orange-200">
              <span className="font-bold text-orange-950 text-[10px] uppercase">TÍCH CÓ HƯỚNG</span>
              <span className="text-[10px] text-orange-700 bg-white px-1.5 py-0.5 rounded border border-orange-300 font-bold">A x B</span>
            </div>

            <div className="p-3 bg-white border border-[#141414]/15 rounded-lg space-y-2 text-[11px]">
              <p className="font-bold text-[10px] opacity-70">PHÉP TÍNH TỪNG PHẦN:</p>
              {stepsHtml}
              
              <div className="border-t border-dashed pt-1.5 mt-2 flex flex-col gap-0.5">
                <span className="opacity-60 text-[10px]">Tọa độ kết quả:</span>
                <span className="font-extrabold text-rose-800 text-xs">[{crossRes.map(formatNum).join(', ')}]</span>
              </div>
            </div>
          </div>
        );
        setVecOutputHtml([output]);
      }
    } catch (err: any) {
      setVecError(err.message || "Lỗi thực thi phép nhân 2 vector.");
    }
  };

  const handleCalculateAngle = () => {
    setVecError('');
    setVecOutputHtml([]);
    try {
      const a = getEvaluatedVector(analLeft);
      const b = getEvaluatedVector(analRight);

      const dot = a.reduce((sum, v, i) => sum + v*b[i], 0);
      const sumASq = a.reduce((sum, v) => sum + v*v, 0);
      const sumBSq = b.reduce((sum, v) => sum + v*v, 0);
      const magA = Math.sqrt(sumASq);
      const magB = Math.sqrt(sumBSq);

      if (magA < 1e-12 || magB < 1e-12) {
        throw new Error("Một trong hai vector có độ dài bằng 0, không đồng dạng góc.");
      }

      const cosTheta = dot / (magA * magB);
      const rad = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
      const deg = (rad * 180) / Math.PI;

      const exactA = getExactDistanceAndDecimal(sumASq);
      const exactB = getExactDistanceAndDecimal(sumBSq);

      const output = (
        <div className="space-y-3.5 text-[#141414] text-xs font-mono" key="angle">
          <div className="flex justify-between items-center bg-neutral-100 p-2 rounded border border-neutral-300">
            <span className="font-bold text-neutral-800 text-[10px] uppercase">GÓC GIỮA THETA</span>
            <span className="text-[10px] text-neutral-600 bg-white px-1.5 py-0.5 rounded border border-neutral-300">θ</span>
          </div>

          <div className="p-3 bg-white border border-[#141414]/15 rounded-lg space-y-2 text-[11px]">
            <p className="font-bold text-[10px] opacity-70">CÔNG THỨC COSEN:</p>
            <div className="bg-neutral-50 p-1.5 rounded text-center border text-[10px]">
              <InlineMath math={`\\cos(\\theta) = \\frac{${formatNum(dot)}}{${exactA.exactLatex} \\cdot ${exactB.exactLatex}} \\approx ${cosTheta.toFixed(4)}`} />
            </div>
            
            <div className="border-t border-dashed mt-2 pt-2 space-y-1">
              <div className="flex justify-between">
                <span className="opacity-60 text-[10px]">Radian angle:</span>
                <span className="font-bold">{rad.toFixed(4)} rad</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-60 text-[10px]">Góc hệ độ:</span>
                <span className="font-extrabold text-sm text-rose-600">{deg.toFixed(1)}°</span>
              </div>
            </div>
          </div>
        </div>
      );
      setVecOutputHtml([output]);
    } catch (err: any) {
      setVecError(err.message || "Lỗi phân tích góc.");
    }
  };

  const handleCalculateProjection = () => {
    setVecError('');
    setVecOutputHtml([]);
    try {
      const a = getEvaluatedVector(analLeft);
      const b = getEvaluatedVector(analRight);

      const dot = a.reduce((sum, v, i) => sum + v*b[i], 0);
      const bSumSq = b.reduce((sum, v) => sum + v*v, 0);

      if (bSumSq < 1e-12) {
        throw new Error("Không thể thực hiện phép chiếu lên Vector 0.");
      }

      const scalar = dot / bSumSq;
      const projCoords = b.map(v => v * scalar);

      setVectorAns(projCoords);
      const output = (
        <div className="space-y-3.5 text-[#141414] text-xs font-mono" key="proj">
          <div className="flex justify-between items-center bg-blue-50 p-2 rounded border border-blue-200">
            <span className="font-bold text-blue-950 text-[10px] uppercase">HÌNH CHIẾU TRỰC GIAO</span>
            <span className="text-[10px] text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-300">proj_B(A)</span>
          </div>

          <div className="p-3 bg-white border border-[#141414]/15 rounded-lg space-y-2 text-[11px]">
            <p className="font-bold text-[10px] opacity-70">TỶ LỆ CO DÃN k:</p>
            <div className="bg-neutral-50 p-1 rounded text-center border text-[10px]">
              <InlineMath math={`k = \\frac{${formatNum(dot)}}{${formatNum(bSumSq)}} \\approx ${formatNum(scalar)}`} />
            </div>

            <div className="border-t border-dashed mt-2 pt-2">
              <span className="opacity-60 text-[10px] block mb-0.5">Tọa độ hình chiếu:</span>
              <span className="font-extrabold text-sm text-blue-900 bg-neutral-50 px-1.5 py-0.5 rounded inline-block">
                [{projCoords.map(formatNum).join(', ')}]
              </span>
            </div>
            <p className="text-[9px] text-neutral-400 italic mt-1">* Sinh lưu Vector_Ans</p>
          </div>
        </div>
      );
      setVecOutputHtml([output]);
    } catch (err: any) {
      setVecError(err.message || "Lỗi phân tích hình chiếu trực giao.");
    }
  };

  const handleCalculateCoplanarity = () => {
    setVecError('');
    setVecOutputHtml([]);
    try {
      if (vectorDim !== '3D') {
        throw new Error("Tích hỗn hợp kiểm tra đồng phẳng yêu cầu hệ khảo sát 3D không gian.");
      }

      const a = getEvaluatedVector(tripleVecA) as [number, number, number];
      const b = getEvaluatedVector(tripleVecB) as [number, number, number];
      const c = getEvaluatedVector(tripleVecC) as [number, number, number];

      const cpX = b[1]*c[2] - b[2]*c[1];
      const cpY = b[2]*c[0] - b[0]*c[2];
      const cpZ = b[0]*c[1] - b[1]*c[0];

      const trVal = a[0]*cpX + a[1]*cpY + a[2]*cpZ;
      const isCopl = Math.abs(trVal) < 1e-9;

      const output = (
        <div className="space-y-3.5 text-[#141414] text-xs font-mono" key="coplanar">
          <div className="flex justify-between items-center bg-indigo-50 p-2 rounded border border-indigo-200">
            <span className="font-bold text-indigo-950 text-[10px] uppercase">ĐỒNG PHẲNG 3D</span>
            <span className="text-[10px] text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-300">[A,B,C]</span>
          </div>

          <div className="p-3 bg-white border border-[#141414]/15 rounded-lg space-y-2 text-[11px]">
            <p className="font-bold text-[10px] opacity-70">TÍCH HỖN TẠP:</p>
            <div className="bg-neutral-50 p-1.5 rounded leading-relaxed border text-[10px] text-neutral-600">
              <p>B x C = [{formatNum(cpX)}, {formatNum(cpY)}, {formatNum(cpZ)}]</p>
              <p className="border-t mt-1 pt-1 font-bold">A . (B x C) = {formatNum(trVal)}</p>
            </div>

            <div className={`p-2 rounded border font-bold text-center text-[10.5px] mt-2 ${isCopl ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-amber-50 border-amber-300 text-amber-800'}`}>
              {isCopl ? '✓ ĐỒNG PHẲNG' : `✗ KHÔNG ĐỒNG PHẲNG (V = ${formatNum(Math.abs(trVal))})`}
            </div>
          </div>
        </div>
      );
      setVecOutputHtml([output]);
    } catch (err: any) {
      setVecError(err.message || "Lỗi phân tích tích hỗn tạp.");
    }
  };

  const handleCalculateBasisIndependence = () => {
    setVecError('');
    setVecOutputHtml([]);
    try {
      const dim = vectorDim;
      let det = 0;
      let isIndep = false;

      if (dim === '2D') {
        const a = getEvaluatedVector(tripleVecA);
        const b = getEvaluatedVector(tripleVecB);
        det = a[0]*b[1] - a[1]*b[0];
        isIndep = Math.abs(det) > 1e-9;
      } else {
        const a = getEvaluatedVector(tripleVecA);
        const b = getEvaluatedVector(tripleVecB);
        const c = getEvaluatedVector(tripleVecC);
        det = a[0]*(b[1]*c[2] - b[2]*c[1]) - b[0]*(a[1]*c[2] - a[2]*c[1]) + c[0]*(a[1]*b[2] - a[2]*b[1]);
        isIndep = Math.abs(det) > 1e-9;
      }

      const output = (
        <div className="space-y-3.5 text-[#141414] text-xs font-mono" key="basis">
          <div className="flex justify-between items-center bg-violet-50 p-2 rounded border border-violet-200">
            <span className="font-bold text-violet-950 text-[10px] uppercase">HỆ CƠ SỞ & ĐỘC LẬP</span>
            <span className="text-[10px] text-violet-700 bg-white px-1.5 py-0.5 rounded border border-violet-300">Det</span>
          </div>

          <div className="p-3 bg-white border border-[#141414]/15 rounded-lg space-y-2 text-[11px]">
            <p className="font-bold text-[10px] opacity-70">ĐỊNH THỨC MA TRẬN:</p>
            <div className="bg-neutral-50 p-1.5 rounded text-center border text-[11px] font-bold">
              Det = {formatNum(det)}
            </div>

            <div className={`p-2 rounded border font-bold text-center text-[10px] mt-2 ${isIndep ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
              {isIndep ? `✓ ĐỘC LẬP (Lập thành cơ sở R${dim === '2D' ? '²' : '³'})` : '✗ PHỤ THUỘC TUYẾN TÍNH'}
            </div>
          </div>
        </div>
      );
      setVecOutputHtml([output]);
    } catch (err: any) {
      setVecError(err.message || "Lỗi kiểm tra tính độc lập.");
    }
  };

  const handleCalculateLinearCombination = () => {
    setVecError('');
    setVecOutputHtml([]);
    try {
      const target = getEvaluatedVector(lcTarget);
      const b1 = getEvaluatedVector(lcBase1);
      const b2 = getEvaluatedVector(lcBase2);

      const denom = b1[0]*b2[1] - b1[1]*b2[0];
      if (Math.abs(denom) < 1e-12) {
        throw new Error(`Hai vector cơ sở [${lcBase1}, ${lcBase2}] cùng phương hoặc phụ thuộc tuyến tính, không thể dựng mặt phẳng.`);
      }

      const k1 = (target[0]*b2[1] - target[1]*b2[0]) / denom;
      const k2 = (b1[0]*target[1] - b1[1]*target[0]) / denom;

      if (vectorDim === '3D') {
        const checkZ = k1*b1[2] + k2*b2[2];
        if (Math.abs(checkZ - target[2]) > 1e-4) {
          throw new Error(`Không đồng phẳng! ${lcTarget} không thuộc phẳng của ${lcBase1} và ${lcBase2}.`);
        }
      }

      const output = (
        <div className="space-y-3.5 text-[#141414] text-xs font-mono" key="lc">
          <div className="flex justify-between items-center bg-teal-50 p-2 rounded border border-teal-200">
            <span className="font-bold text-teal-950 text-[10px] uppercase">BIỂU DIỄN TUYẾN TÍNH</span>
            <span className="text-[10px] text-teal-700 bg-white px-1.5 py-0.5 rounded border border-teal-300">k₁ & k₂</span>
          </div>

          <div className="p-3 bg-white border border-[#141414]/15 rounded-lg space-y-2 text-[11px]">
            <p className="font-bold text-[10px] opacity-70">PHƯƠNG TRÌNH BIỂU DIỄN:</p>
            <div className="bg-neutral-50 p-1.5 rounded text-center border text-[10px]">
              <InlineMath math={`\\mathbf{${lcTarget}} = k_1 \\mathbf{${lcBase1}} + k_2 \\mathbf{${lcBase2}}`} />
            </div>

            <div className="border-t border-dashed mt-2 pt-2 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="opacity-60">Hệ số k₁:</span>
                <span className="font-bold text-teal-900">{formatNum(k1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Hệ số k₂:</span>
                <span className="font-bold text-teal-900">{formatNum(k2)}</span>
              </div>
            </div>

            <div className="bg-teal-50 p-1 text-center rounded border border-teal-150 text-[10px] font-black text-teal-900 leading-tight mt-1">
              {lcTarget} = {formatNum(k1)}*{lcBase1} {k2 >= 0 ? '+' : ''} {formatNum(k2)}*{lcBase2}
            </div>
          </div>
        </div>
      );
      setVecOutputHtml([output]);
    } catch (err: any) {
      setVecError(err.message || "Không thể phân tích biểu diễn kết quả.");
    }
  };

  // Helper inside Points Area to parse dynamic input of coordinates for P1 - P5
  const getEvaluatedPoint = (name: string): number[] => {
    let pObj = p1;
    if (name === 'P2') pObj = p2;
    else if (name === 'P3') pObj = p3;
    else if (name === 'P4') pObj = p4;
    else if (name === 'P5') pObj = p5;

    const xVal = safeParseCoordinate(pObj.x);
    const yVal = safeParseCoordinate(pObj.y);
    const zVal = safeParseCoordinate(pObj.z);

    if (isNaN(xVal) || isNaN(yVal) || isNaN(zVal)) {
      throw new Error(`Tọa độ điểm ${name} chứa dữ liệu không hợp lệ.`);
    }
    return [xVal, yVal, zVal];
  };

  const formatTerm = (coef: number, variable: string, isFirst: boolean): string => {
    if (Math.abs(coef) < 1e-9) return '';
    let sign = coef > 0 ? ' + ' : ' - ';
    if (isFirst) {
      sign = coef > 0 ? '' : '-';
    }
    const absCoef = Math.abs(coef);
    const coefStr = Math.abs(absCoef - 1) < 1e-9 ? '' : formatNum(absCoef);
    return `${sign}${coefStr}${variable}`;
  };

  const handlePointsLineCalculation = () => {
    setVecError('');
    setVecOutputHtml([]);
    try {
      if (pointSelA === pointSelB) {
        throw new Error("Vui lòng chọn 2 điểm khác nhau để lập phương trình đường thẳng.");
      }
      const coordsA = getEvaluatedPoint(pointSelA);
      const coordsB = getEvaluatedPoint(pointSelB);

      const is3D = vectorDim === '3D';
      
      const dx = coordsB[0] - coordsA[0];
      const dy = coordsB[1] - coordsA[1];
      const dz = is3D ? coordsB[2] - coordsA[2] : 0;

      const normAB = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (normAB < 1e-12) {
        throw new Error("Hai điểm được chọn trùng nhau, không thể lập đường thẳng.");
      }

      let output: React.ReactNode;

      if (!is3D) {
        const A = -dy;
        const B = dx;
        const C = -(A * coordsA[0] + B * coordsA[1]);

        const simplify2DEq = (c1: number, c2: number, c3: number) => {
          const isInt = (n: number) => Math.abs(n - Math.round(n)) < 1e-9;
          if (isInt(c1) && isInt(c2) && isInt(c3)) {
            const gcd = (x: number, y: number): number => (!y ? x : gcd(y, x % y));
            const i1 = Math.round(c1);
            const i2 = Math.round(c2);
            const i3 = Math.round(c3);
            const common = Math.abs(gcd(gcd(i1, i2), i3));
            if (common > 1) {
              let f1 = i1 / common;
              let f2 = i2 / common;
              let f3 = i3 / common;
              if (f1 < 0 || (f1 === 0 && f2 < 0)) {
                f1 = -f1; f2 = -f2; f3 = -f3;
              }
              return { sa: f1, sb: f2, sc: f3 };
            }
          }
          if (c1 < 0 || (c1 === 0 && c2 < 0)) {
            return { sa: -c1, sb: -c2, sc: -c3 };
          }
          return { sa: c1, sb: c2, sc: c3 };
        };

        const { sa, sb, sc } = simplify2DEq(A, B, C);

        const buildGeneralForm = (sa: number, sb: number, sc: number) => {
          const partX = formatTerm(sa, 'x', true);
          const partY = formatTerm(sb, 'y', partX === '');
          const partC = sc === 0 ? '' : (sc > 0 ? ` + ${formatNum(sc)}` : ` - ${formatNum(Math.abs(sc))}`);
          return `${partX}${partY}${partC} = 0`;
        };

        const eqStr = buildGeneralForm(sa, sb, sc);

        output = (
          <div className="space-y-3.5 text-[#141414] text-xs font-mono" key="point-line-2d">
            <div className="flex justify-between items-center bg-teal-50 p-2 rounded border border-teal-200">
              <span className="font-bold text-teal-950 text-[10px] uppercase">ĐƯỜNG THẲNG 2D ({pointSelA}{pointSelB})</span>
              <span className="text-[10px] text-teal-700 bg-white px-1.5 py-0.5 rounded border border-teal-300">Eq Line</span>
            </div>

            <div className="p-3 bg-white border border-[#141414]/15 rounded-lg space-y-2 text-[11px]">
              <div className="space-y-1">
                <p><span className="opacity-60">Điểm A({pointSelA}):</span> <strong>[{formatNum(coordsA[0])}, {formatNum(coordsA[1])}]</strong></p>
                <p><span className="opacity-60">Điểm B({pointSelB}):</span> <strong>[{formatNum(coordsB[0])}, {formatNum(coordsB[1])}]</strong></p>
                <p><span className="opacity-60">Vectơ chỉ phương:</span> <InlineMath math={`\\vec{u} = (${formatNum(dx)}, ${formatNum(dy)})`} /></p>
                <p><span className="opacity-60">Vectơ pháp tuyến:</span> <InlineMath math={`\\vec{n} = (${formatNum(A)}, ${formatNum(B)})`} /></p>
              </div>

              <p className="font-bold text-[10px] opacity-70 border-t border-dashed mt-2 pt-2 uppercase">PHƯƠNG TRÌNH TỔNG QUÁT:</p>
              <div className="bg-neutral-50 p-2 rounded text-center border font-semibold text-sm">
                <InlineMath math={`${eqStr}`} />
              </div>
            </div>
          </div>
        );
      } else {
        const writeParametricEq = () => {
          const ptX = `${formatNum(coordsA[0])} ${dx >= 0 ? '+' : ''} ${formatNum(dx)}t`;
          const ptY = `${formatNum(coordsA[1])} ${dy >= 0 ? '+' : ''} ${formatNum(dy)}t`;
          const ptZ = `${formatNum(coordsA[2])} ${dz >= 0 ? '+' : ''} ${formatNum(dz)}t`;
          return { ptX, ptY, ptZ };
        };

        const { ptX, ptY, ptZ } = writeParametricEq();

        const hasSymmetric = Math.abs(dx) > 1e-9 && Math.abs(dy) > 1e-9 && Math.abs(dz) > 1e-9;
        const symmetricLatex = hasSymmetric 
          ? `\\frac{x - ${formatNum(coordsA[0])}}{${formatNum(dx)}} = \\frac{y - ${formatNum(coordsA[1])}}{${formatNum(dy)}} = \\frac{z - ${formatNum(coordsA[2])}}{${formatNum(dz)}}`
          : '';

        output = (
          <div className="space-y-3.5 text-[#141414] text-xs font-mono" key="point-line-3d">
            <div className="flex justify-between items-center bg-teal-50 p-2 rounded border border-teal-200">
              <span className="font-bold text-teal-950 text-[10px] uppercase">ĐƯỜNG THẲNG 3D ({pointSelA}{pointSelB})</span>
              <span className="text-[10px] text-teal-700 bg-white px-1.5 py-0.5 rounded border border-teal-300">Eq Line</span>
            </div>

            <div className="p-3 bg-white border border-[#141414]/15 rounded-lg space-y-2 text-[11px]">
              <div className="space-y-1">
                <p><span className="opacity-60">Điểm A({pointSelA}):</span> <strong>[{formatNum(coordsA[0])}, {formatNum(coordsA[1])}, {formatNum(coordsA[2])}]</strong></p>
                <p><span className="opacity-60">Điểm B({pointSelB}):</span> <strong>[{formatNum(coordsB[0])}, {formatNum(coordsB[1])}, {formatNum(coordsB[2])}]</strong></p>
                <p><span className="opacity-60">Vectơ chỉ phương:</span> <InlineMath math={`\\vec{u} = (${formatNum(dx)}, ${formatNum(dy)}, ${formatNum(dz)})`} /></p>
              </div>

              <p className="font-bold text-[10px] opacity-70 border-t border-dashed mt-2 pt-2 uppercase">PHƯƠNG TRÌNH THAM SỐ:</p>
              <div className="bg-neutral-50 p-2 rounded border grid grid-cols-1 gap-1 text-[11px] text-center">
                <div><InlineMath math={`x = ${ptX}`} /></div>
                <div><InlineMath math={`y = ${ptY}`} /></div>
                <div><InlineMath math={`z = ${ptZ}`} /></div>
              </div>

              <p className="font-bold text-[10px] opacity-70 border-t border-dashed mt-2 pt-2 uppercase">PHƯƠNG TRÌNH CHÍNH TẮC:</p>
              {hasSymmetric ? (
                <div className="bg-neutral-50 p-2 rounded text-center border text-[11px]">
                  <InlineMath math={`${symmetricLatex}`} />
                </div>
              ) : (
                <p className="text-[10px] text-orange-600 bg-orange-50 p-1.5 rounded border border-orange-200">
                  Không tồn tại phương trình chính tắc do có thành phần chỉ phương bằng 0.
                </p>
              )}
            </div>
          </div>
        );
      }

      setVecOutputHtml([output]);
    } catch (err: any) {
      setVecError(err.message || "Không thể tính phương trình đường thẳng.");
    }
  };

  const handlePointsPlaneCalculation = () => {
    setVecError('');
    setVecOutputHtml([]);
    try {
      if (vectorDim !== '3D') {
        throw new Error("Mặt phẳng chỉ xác định trong không gian 3D. Hãy chuyển hệ tọa độ sang 3D.");
      }
      if (pointSelA === pointSelB || pointSelA === pointSelC || pointSelB === pointSelC) {
        throw new Error("Vui lòng chọn 3 điểm phân biệt để lập phương trình mặt phẳng.");
      }

      const coordsA = getEvaluatedPoint(pointSelA);
      const coordsB = getEvaluatedPoint(pointSelB);
      const coordsC = getEvaluatedPoint(pointSelC);

      const u1 = coordsB[0] - coordsA[0];
      const u2 = coordsB[1] - coordsA[1];
      const u3 = coordsB[2] - coordsA[2];

      const v1 = coordsC[0] - coordsA[0];
      const v2 = coordsC[1] - coordsA[1];
      const v3 = coordsC[2] - coordsA[2];

      const nx = u2 * v3 - u3 * v2;
      const ny = u3 * v1 - u1 * v3;
      const nz = u1 * v2 - u2 * v1;

      const normN = Math.sqrt(nx*nx + ny*ny + nz*nz);
      if (normN < 1e-12) {
        throw new Error("3 điểm trùng lặp hoặc thẳng hàng, không thể xác định duy nhất mặt phẳng.");
      }

      const d = -(nx * coordsA[0] + ny * coordsA[1] + nz * coordsA[2]);

      const simplifyPlaneEq = (c1: number, c2: number, c3: number, c4: number) => {
        const isInt = (n: number) => Math.abs(n - Math.round(n)) < 1e-9;
        if (isInt(c1) && isInt(c2) && isInt(c3) && isInt(c4)) {
          const gcd = (x: number, y: number): number => (!y ? x : gcd(y, x % y));
          const i1 = Math.round(c1);
          const i2 = Math.round(c2);
          const i3 = Math.round(c3);
          const i4 = Math.round(c4);
          const common = Math.abs(gcd(gcd(gcd(i1, i2), i3), i4));
          if (common > 1) {
            let f1 = i1 / common;
            let f2 = i2 / common;
            let f3 = i3 / common;
            let f4 = i4 / common;
            if (f1 < 0 || (f1 === 0 && f2 < 0) || (f1 === 0 && f2 === 0 && f3 < 0)) {
              f1 = -f1; f2 = -f2; f3 = -f3; f4 = -f4;
            }
            return { sa: f1, sb: f2, sc: f3, sd: f4 };
          }
        }
        if (c1 < 0 || (c1 === 0 && c2 < 0) || (c1 === 0 && c2 === 0 && c3 < 0)) {
          return { sa: -c1, sb: -c2, sc: -c3, sd: -c4 };
        }
        return { sa: c1, sb: c2, sc: c3, sd: c4 };
      };

      const { sa, sb, sc, sd } = simplifyPlaneEq(nx, ny, nz, d);

      const buildPlaneGeneralForm = (sa: number, sb: number, sc: number, sd: number) => {
        const partX = formatTerm(sa, 'x', true);
        const partY = formatTerm(sb, 'y', partX === '');
        const partZ = formatTerm(sc, 'z', partX === '' && partY === '');
        const partD = sd === 0 ? '' : (sd > 0 ? ` + ${formatNum(sd)}` : ` - ${formatNum(Math.abs(sd))}`);
        return `${partX}${partY}${partZ}${partD} = 0`;
      };

      const eqStr = buildPlaneGeneralForm(sa, sb, sc, sd);

      const output = (
        <div className="space-y-3.5 text-[#141414] text-xs font-mono" key="point-plane">
          <div className="flex justify-between items-center bg-teal-50 p-2 rounded border border-teal-200">
            <span className="font-bold text-teal-950 text-[10px] uppercase">MẶT PHẲNG ({pointSelA}{pointSelB}{pointSelC})</span>
            <span className="text-[10px] text-teal-700 bg-white px-1.5 py-0.5 rounded border border-teal-300">Eq Plane</span>
          </div>

          <div className="p-3 bg-white border border-[#141414]/15 rounded-lg space-y-2 text-[11px]">
            <div className="space-y-1">
              <p><span className="opacity-60">Điểm A({pointSelA}):</span> <strong>[{formatNum(coordsA[0])}, {formatNum(coordsA[1])}, {formatNum(coordsA[2])}]</strong></p>
              <p><span className="opacity-60">Điểm B({pointSelB}):</span> <strong>[{formatNum(coordsB[0])}, {formatNum(coordsB[1])}, {formatNum(coordsB[2])}]</strong></p>
              <p><span className="opacity-60">Điểm C({pointSelC}):</span> <strong>[{formatNum(coordsC[0])}, {formatNum(coordsC[1])}, {formatNum(coordsC[2])}]</strong></p>
              <p><span className="opacity-60">Vectơ chỉ phương:</span></p>
              <div className="pl-3 space-y-0.5 text-[10px]">
                <div><InlineMath math={`\\vec{u}_1 = \\vec{${pointSelA}${pointSelB}} = (${formatNum(u1)}, ${formatNum(u2)}, ${formatNum(u3)})`} /></div>
                <div><InlineMath math={`\\vec{u}_2 = \\vec{${pointSelA}${pointSelC}} = (${formatNum(v1)}, ${formatNum(v2)}, ${formatNum(v3)})`} /></div>
              </div>
              <p className="pt-1"><span className="opacity-60">Pháp vectơ:</span> <InlineMath math={`\\vec{n} = (${formatNum(nx)}, ${formatNum(ny)}, ${formatNum(nz)})`} /></p>
            </div>

            <p className="font-bold text-[10px] opacity-70 border-t border-dashed mt-2 pt-2 uppercase">PHƯƠNG TRÌNH TỔNG QUÁT MẶT PHẲNG:</p>
            <div className="bg-neutral-50 p-2 rounded border font-semibold text-sm text-center">
              <InlineMath math={`${eqStr}`} />
            </div>
          </div>
        </div>
      );

      setVecOutputHtml([output]);
    } catch (err: any) {
      setVecError(err.message || "Không thể tính phương trình mặt phẳng.");
    }
  };

  const handlePointsClearAll = () => {
    setP1({ x: '0', y: '0', z: '0' });
    setP2({ x: '0', y: '0', z: '0' });
    setP3({ x: '0', y: '0', z: '0' });
    setP4({ x: '0', y: '0', z: '0' });
    setP5({ x: '0', y: '0', z: '0' });
    setVecOutputHtml([]);
    setVecError('');
  };

  // =========================================================================
  // MATRIX WORKSPACE STATE & STORAGE (Style Parser, Expr Evaluator)
  // =========================================================================
  const [matrixStorage, setMatrixStorage] = useState<MatrixStorage>({
    A_1: { rows: 2, cols: 2, data: [[1, 2], [3, 4]] },
    B_1: { rows: 2, cols: 2, data: [[5, 6], [7, 8]] }
  });

  const [activeWorkspaceMatrix, setActiveWorkspaceMatrix] = useState<string>('A_1');
  const [manualRows, setManualRows] = useState<number>(3);
  const [manualCols, setManualCols] = useState<number>(3);
  const [manualInputGrid, setManualInputGrid] = useState<string[][]>([
    ['1', '0', '2'],
    ['-1', '3', '0'],
    ['2', '1', '1']
  ]);
  const [bulkInputText, setBulkInputText] = useState('A_1=[1,2;3,4]');
  const [expressionInput, setExpressionInput] = useState('2 * A_1 + B_1^T');
  const [workspaceResultMatrix, setWorkspaceResultMatrix] = useState<Matrix | null>(null);
  const [workspaceTrace, setWorkspaceTrace] = useState<string[]>([]);
  const [workspaceError, setWorkspaceError] = useState('');

  // Handle resizing grid manually
  const resizeWorkspaceGrid = (newR: number, newC: number) => {
    const clampedR = Math.max(1, Math.min(15, newR));
    const clampedC = Math.max(1, Math.min(15, newC));
    setManualRows(clampedR);
    setManualCols(clampedC);
    
    // Create new cells preserving old
    const newGrid = Array(clampedR).fill(0).map((_, r) => {
      return Array(clampedC).fill(0).map((_, c) => {
        if (manualInputGrid[r] && manualInputGrid[r][c] !== undefined) {
          return manualInputGrid[r][c];
        }
        return '0';
      });
    });
    setManualInputGrid(newGrid);
  };

  // Save Grid to storage
  const saveGridToStorage = (targetName: string) => {
    setWorkspaceError('');
    try {
      const data = manualInputGrid.map(row => row.map(v => {
        const val = parseFloat(v);
        if (isNaN(val)) throw new Error("Ensure all cells contain valid numbers.");
        return val;
      }));
      const newMat = MatrixEngine.fromArray(data);
      setMatrixStorage(prev => ({
        ...prev,
        [targetName]: newMat
      }));
      setWorkspaceResultMatrix(newMat);
      setWorkspaceTrace([`Matrix ${targetName} saved successfully to active index.`]);
    } catch (err: any) {
      setWorkspaceError(err.message || "Failed to save matrix.");
    }
  };

  // Import via multiple styles matcher
  const handleBulkParse = () => {
    setWorkspaceError('');
    try {
      const parsed = MatrixSymbolicParser.parseUniversal(bulkInputText);
      setMatrixStorage(prev => ({
        ...prev,
        [parsed.name]: parsed.matrix
      }));
      setWorkspaceResultMatrix(parsed.matrix);
      setWorkspaceTrace([`Successfully parsed and stored in matrix: ${parsed.name}`]);
    } catch (err: any) {
      setWorkspaceError(err.message || "Syntax parse error. Please check formatting guidelines.");
    }
  };

  // Evaluate complex matrix actions
  const handleEvaluateExpression = () => {
    setWorkspaceError('');
    setWorkspaceResultMatrix(null);
    try {
      const evalRes = MatrixSymbolicParser.evaluateExpression(expressionInput, matrixStorage);
      setWorkspaceResultMatrix(evalRes.result);
      setWorkspaceTrace(evalRes.steps);
    } catch (err: any) {
      setWorkspaceError(err.message || "Failed to evaluate symbolic expression.");
    }
  };

  // =========================================================================
  // CLASSICAL CALCULATIONS (REF, RREF, Inverse, Det, Adj)
  // =========================================================================
  const [selectedCalcMatrix, setSelectedCalcMatrix] = useState<string>('A_1');
  const [calcResult, setCalcResult] = useState<{
    determinant?: number;
    trace?: number;
    adjugate?: Matrix;
    inverse?: Matrix;
    matrixName?: string;
  } | null>(null);
  const [reductionResult, setReductionResult] = useState<{
    refSteps?: any[];
    rrefSteps?: any[];
    targetREF?: Matrix;
    targetRREF?: Matrix;
  } | null>(null);
  const [calcError, setCalcError] = useState('');

  const calculateCoreOps = () => {
    setCalcError('');
    setCalcResult(null);
    setReductionResult(null);
    try {
      const target = matrixStorage[selectedCalcMatrix];
      if (!target) throw new Error(`Matrix ${selectedCalcMatrix} is empty.`);

      const isSq = target.rows === target.cols;
      let detVal: number | undefined;
      let trVal: number | undefined;
      let adjMat: Matrix | undefined;
      let invMat: Matrix | undefined;

      if (isSq) {
        detVal = MatrixEngine.determinant(target);
        trVal = MatrixEngine.trace(target);
        adjMat = MatrixEngine.adjugate(target);
        if (Math.abs(detVal) > 1e-10) {
          invMat = MatrixEngine.inverse(target);
        }
      }

      setCalcResult({
        determinant: detVal,
        trace: trVal,
        adjugate: adjMat,
        inverse: invMat,
        matrixName: selectedCalcMatrix
      });
    } catch (err: any) {
      setCalcError(err.message || "Calculation error.");
    }
  };

  const runRowReductions = () => {
    setCalcError('');
    setCalcResult(null);
    setReductionResult(null);
    try {
      const target = matrixStorage[selectedCalcMatrix];
      if (!target) throw new Error(`Matrix ${selectedCalcMatrix} is empty.`);

      const refSol = RREFEngine.computeREF(target);
      const rrefSol = RREFEngine.computeRREF(target);

      setReductionResult({
        refSteps: refSol.steps,
        rrefSteps: rrefSol.steps,
        targetREF: refSol.result,
        targetRREF: rrefSol.result
      });
    } catch (err: any) {
      setCalcError(err.message || "Row reduction error.");
    }
  };

  // =========================================================================
  // FACTORIZATIONS STATE & UI
  // =========================================================================
  const [selectedDecompMatrix, setSelectedDecompMatrix] = useState<string>('A_1');
  const [decompType, setDecompType] = useState<'LU' | 'LUP' | 'QR' | 'Cholesky' | 'SVD'>('LU');
  const [decompOutput, setDecompOutput] = useState<{
    matrices: { [key: string]: number[][] };
    steps: any[];
    summary: string;
  } | null>(null);
  const [decompError, setDecompError] = useState('');

  const runDecomposition = () => {
    setDecompError('');
    setDecompOutput(null);
    try {
      const target = matrixStorage[selectedDecompMatrix];
      if (!target) throw new Error("Select a valid matrix index.");

      let res: any;
      let summary = "";

      switch (decompType) {
        case 'LU':
          res = DecompositionEngine.lu(target);
          summary = "Doolittle LU Decomposition A = L * U (Requires square matrix with non-singular diagonal pivots. Complexity O(n³)).";
          break;
        case 'LUP':
          res = DecompositionEngine.lup(target);
          summary = "LUP Decomposition with partial row pivoting PA = LU (Handles arbitrary non-singular systems beautifully. Complexity O(n³)).";
          break;
        case 'QR':
          res = DecompositionEngine.qr(target);
          summary = "Orthonormal QR decomposition via stabilized Gram-Schmidt. A = Q * R where QᵀQ = I and R is Upper-Triangular. Complexity O(m*n²).";
          break;
        case 'Cholesky':
          res = DecompositionEngine.cholesky(target);
          summary = "Cholesky Decomposition A = L * Lᵀ. Applicable strictly to Square, Real-Symmetric, and Positive Definite matrices. Complexity O(n³ / 2).";
          break;
        case 'SVD':
          res = DecompositionEngine.svd(target);
          summary = "Singular Value Decomposition (SVD) A = U * Σ * Vᵀ via robust One-Sided Jacobi orthogonalization sweeps. Runs up to 15x15 size instantly.";
          break;
        default:
          break;
      }

      setDecompOutput({
        matrices: res.matrices,
        steps: res.steps,
        summary
      });
    } catch (err: any) {
      setDecompError(err.message || "Factorization failure.");
    }
  };

  // =========================================================================
  // EIGEN & JACOBI SWEEPS STATE & UI
  // =========================================================================
  const [selectedEigenMatrix, setSelectedEigenMatrix] = useState<string>('A_1');
  const [eigenOutput, setEigenOutput] = useState<any | null>(null);
  const [jacobiOutput, setJacobiOutput] = useState<any | null>(null);
  const [eigenError, setEigenError] = useState('');
  const [copiedMat, setCopiedMat] = useState<string | null>(null);

  const calculateEigenEngine = () => {
    setEigenError('');
    setEigenOutput(null);
    setJacobiOutput(null);
    try {
      const target = matrixStorage[selectedEigenMatrix];
      if (!target) throw new Error("Choose a populated matrix.");

      const analysis = EigenEngine.analyze(target);
      setEigenOutput(analysis);
    } catch (err: any) {
      setEigenError(err.message || "Eigen engine fails. Typically due to complex or non-square conditions.");
    }
  };

  const calculateJacobiDiagonalize = () => {
    setEigenError('');
    setEigenOutput(null);
    setJacobiOutput(null);
    try {
      const target = matrixStorage[selectedEigenMatrix];
      if (!target) throw new Error("Select a valid matrix index.");

      const jRes = JacobiDiagonalizer.diagonalize(target);
      setJacobiOutput(jRes);
    } catch (err: any) {
      setEigenError(err.message || "Jacobi error (must be square symmetric matrix).");
    }
  };

  // =========================================================================
  // MATRIX POWER STATE & UI
  // =========================================================================
  const [selectedPowerMatrix, setSelectedPowerMatrix] = useState<string>('A_1');
  const [powerExponent, setPowerExponent] = useState('3');
  const [fractionP, setFractionP] = useState('2');
  const [fractionQ, setFractionQ] = useState('3');
  const [mixedComplexMode, setMixedComplexMode] = useState<'complex' | 'real_schur' | 'educational'>('complex');
  const [powerOutput, setPowerOutput] = useState<{
    result: Matrix;
    highPrecResult?: DecimalComplex[][];
    steps?: any[];
    residualNorm?: string;
    detectedEigenvalues?: DecimalComplex[];
    isPrincipalBranch?: boolean;
  } | null>(null);
  const [powerError, setPowerError] = useState('');

  const handleCalculatePower = (type: 'integer' | 'fractional') => {
    setPowerError('');
    setPowerOutput(null);
    try {
      const target = matrixStorage[selectedPowerMatrix];
      if (!target) throw new Error("Choose valid matrix.");

      if (type === 'integer') {
        const k = parseInt(powerExponent);
        if (isNaN(k)) throw new Error("Enter an integer exponent.");
        const res = MatrixPowerEngine.powerInteger(target, k);
        setPowerOutput({ result: res });
      } else {
        const p = parseInt(fractionP);
        const q = parseInt(fractionQ);
        if (isNaN(p) || isNaN(q) || q <= 0) {
          throw new Error("Enter valid fractional integer parameters.");
        }
        const decompPow = MatrixPowerEngine.powerFractional(target, p, q, mixedComplexMode);
        setPowerOutput({
          result: decompPow.result,
          highPrecResult: decompPow.highPrecResult,
          steps: decompPow.steps,
          residualNorm: decompPow.residualNorm,
          detectedEigenvalues: decompPow.detectedEigenvalues,
          isPrincipalBranch: decompPow.isPrincipalBranch
        });
      }
    } catch (err: any) {
      setPowerError(err.message || "Power evaluation fails.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8" id="linear-algebra-suite">
      {/* Welcome Title */}
      <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="font-mono text-[10px] text-teal-400 uppercase tracking-widest border border-teal-400/30 px-2 py-0.5 rounded bg-teal-400/10">ADVANCED CAS MODULE</span>
          <h2 className="font-serif italic text-4xl mt-2">Vector & Linear Algebra Workspace</h2>
          <p className="font-mono text-xs opacity-50 mt-1">
            Mathematician Engine, matrix representations, decompositions (SVD, QR), eigensystems & fractional powers.
          </p>
        </div>
        <div className="flex gap-2 font-mono text-[10px] text-white/50 bg-[#141414] p-2 rounded border border-white/5">
          <Activity className="w-3 h-3 text-teal-400 animate-pulse" />
          <span>REAL-TIME COMPILER ACTIVE</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap border-2 border-[#141414] rounded-lg overflow-hidden bg-white shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
        {( [
          { id: 'vector', label: 'Vector & Geometry' },
          { id: 'matrix', label: 'Matrix Workspace' },
          { id: 'calc', label: '★ REF, RREF & Basic Ops' },
          { id: 'decomp', label: 'Decompositions (QR, SVD)' },
          { id: 'eigen', label: 'Eigen Engine & Jacobi' },
          { id: 'power', label: 'Matrix Powers' }
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[180px] px-4 py-3 font-mono text-xs uppercase tracking-wider transition-all duration-150 border-r border-b border-[#141414] last:border-r-0 ${
              activeTab === tab.id 
                ? 'bg-[#141414] text-white font-black shadow-inner' 
                : 'bg-[#F5F5F3] text-[#141414]/75 font-bold hover:bg-[#E4E3E0] hover:text-[#141414]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* =====================================================================
          VECTOR TAB VIEW
          ===================================================================== */}
      {activeTab === 'vector' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-[#141414]">
          <div className="lg:col-span-12 xl:col-span-10 space-y-6">
            
            {/* Dimension Selection and Control Panel */}
            <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-serif italic text-2xl font-black uppercase tracking-tight flex items-center gap-2 text-[#141414]">
                    VietMath Vector Workspace
                  </h3>
                  <p className="text-xs font-mono text-neutral-500 font-semibold">Đa véc-tơ khảo sát CAS & Đại số Máy tính</p>
                </div>
                
                {/* 2D/3D Selection */}
                <div className="flex border-2 border-black rounded bg-[#F5F5F3] p-1 font-mono text-xs font-extrabold shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
                  <button
                    onClick={() => setVectorDim('2D')}
                    className={`px-3 py-1.5 rounded transition-all ${vectorDim === '2D' ? 'bg-[#141414] text-white shadow' : 'text-[#141414] hover:bg-neutral-200'}`}
                  >
                    Hệ Plane 2D
                  </button>
                  <button
                    onClick={() => setVectorDim('3D')}
                    className={`px-3 py-1.5 rounded transition-all ${vectorDim === '3D' ? 'bg-[#141414] text-white shadow' : 'text-[#141414] hover:bg-neutral-200'}`}
                  >
                    Không gian 3D
                  </button>
                </div>
              </div>
            </div>

            {/* Vector Slots Container */}
            <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <div className="flex justify-between items-center border-b border-[#141414]/15 pb-2">
                <h4 className="font-serif italic text-lg font-black uppercase">Định nghĩa Vector hệ thống (V1 - V5)</h4>
                <span className="font-mono text-[10px] bg-neutral-150 border border-neutral-300 font-extrabold px-1.5 py-0.5 rounded bg-[#F5F5F3]">
                  Hệ tọa độ Descartes: [X, Y{vectorDim === '3D' ? ', Z' : ''}]
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Map renders v1-v5 vectors */}
                {(() => {
                  const keys = ['v1', 'v2', 'v3', 'v4', 'v5'];
                  return keys.map((key) => {
                    let state: { x: string; y: string; z: string; active: boolean };
                    let setState: React.Dispatch<React.SetStateAction<{ x: string; y: string; z: string; active: boolean }>>;
                    
                    if (key === 'v1') { state = v1; setState = setV1; }
                    else if (key === 'v2') { state = v2; setState = setV2; }
                    else if (key === 'v3') { state = v3; setState = setV3; }
                    else if (key === 'v4') { state = v4; setState = setV4; }
                    else { state = v5; setState = setV5; }

                    let evaluatedCoords: number[] = [];
                    let magnitudeLatex = "";
                    try {
                      evaluatedCoords = [
                        safeParseCoordinate(state.x),
                        safeParseCoordinate(state.y),
                        safeParseCoordinate(state.z)
                      ];
                      const activeCoords = vectorDim === '2D' ? evaluatedCoords.slice(0, 2) : evaluatedCoords;
                      const normSq = activeCoords.reduce((sum, c) => sum + c * c, 0);
                      magnitudeLatex = getExactDistanceAndDecimal(normSq).exactLatex;
                    } catch (e) {
                      magnitudeLatex = "?";
                    }

                    return (
                      <div key={key} className={`border-2 rounded-xl p-4 transition-all duration-200 ${state.active ? 'bg-white border-[#141414] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]' : 'bg-neutral-50 border-neutral-200 opacity-55'}`}>
                        <div className="flex justify-between items-center border-b border-neutral-200 pb-2 mb-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={state.active}
                              onChange={(e) => setState(prev => ({ ...prev, active: e.target.checked }))}
                              className="w-3.5 h-3.5 rounded border-2 border-black accent-black cursor-pointer"
                              id={`check-active-${key}`}
                            />
                            <label htmlFor={`check-active-${key}`} className="font-mono text-xs font-black uppercase cursor-pointer text-[#141414]">
                              v{key.slice(1)} ({key})
                            </label>
                          </div>
                          
                          {state.active && (
                            <div className="flex items-center gap-1" title="Đánh dấu để sử dụng tính cộng/trừ đồng loạt">
                              <input
                                type="checkbox"
                                checked={!!selectedForMulti[key]}
                                onChange={(e) => setSelectedForMulti(prev => ({ ...prev, [key]: e.target.checked }))}
                                className="w-3 h-3 rounded accent-teal-600 cursor-pointer"
                                id={`check-multi-${key}`}
                              />
                              <label htmlFor={`check-multi-${key}`} className="font-mono text-[9px] font-bold text-teal-800 cursor-pointer">
                                Đồng loạt
                              </label>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-0.5">
                            <span className="font-mono text-[9px] font-bold opacity-60 block text-center">X COORD</span>
                            <input
                              type="text"
                              disabled={!state.active}
                              value={state.x}
                              onChange={(e) => setState(prev => ({ ...prev, x: e.target.value }))}
                              placeholder="1"
                              className="w-full bg-[#F5F5F3] border-2 border-black rounded px-1 py-0.5 text-center font-mono text-xs text-[#141414] focus:outline-none focus:bg-white disabled:opacity-40"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-mono text-[9px] font-bold opacity-60 block text-center">Y COORD</span>
                            <input
                              type="text"
                              disabled={!state.active}
                              value={state.y}
                              onChange={(e) => setState(prev => ({ ...prev, y: e.target.value }))}
                              placeholder="2"
                              className="w-full bg-[#F5F5F3] border-2 border-black rounded px-1 py-0.5 text-center font-mono text-xs text-[#141414] focus:outline-none focus:bg-white disabled:opacity-40"
                            />
                          </div>
                          {vectorDim === '3D' && (
                            <div className="space-y-0.5">
                              <span className="font-mono text-[9px] font-bold opacity-60 block text-center">Z COORD</span>
                              <input
                                type="text"
                                disabled={!state.active}
                                value={state.z}
                                onChange={(e) => setState(prev => ({ ...prev, z: e.target.value }))}
                                placeholder="3"
                                className="w-full bg-[#F5F5F3] border-2 border-black rounded px-1 py-0.5 text-center font-mono text-xs text-[#141414] focus:outline-none focus:bg-white disabled:opacity-40"
                              />
                            </div>
                          )}
                        </div>

                        {state.active && magnitudeLatex && (
                          <div className="text-[10px] font-mono text-[#141414] border-t border-dashed border-gray-150 mt-2.5 pt-1.5 text-center flex items-center justify-center gap-1">
                            <span className="font-bold opacity-75 text-[9px]">NORM:</span>
                            <span className="bg-neutral-50 border border-neutral-200 px-1.5 py-0.5 rounded text-[11px] font-mono text-[#141414] font-extrabold" style={{ color: '#141414' }}>
                              <InlineMath math={`${magnitudeLatex}`} />
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Special Vector Ans slot (The 6th Vector) */}
            <div className="bg-teal-50/20 border-2 border-teal-600 rounded-xl p-5 space-y-3.5 shadow-[2px_2px_0px_0px_rgba(13,148,136,1)]">
              <div className="flex justify-between items-center border-b border-teal-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                  <h4 className="font-serif italic text-base font-black uppercase text-teal-950">Vector Ans (Vector số 6 - Kết quả gần nhất)</h4>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(`[${vectorAns.map(formatNum).join(', ')}]`, 'ans-val')}
                  className="px-2 py-0.5 bg-white hover:bg-neutral-100 border border-[#141414]/30 font-mono text-[9px] font-bold rounded shadow-[1px_1px_0px_0px_rgba(20,20,20,1)] transition-all"
                >
                  {copiedStates['ans-val'] ? 'Đã chép!' : 'Chép Tọa độ'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="space-y-0.5 bg-white p-2.5 rounded border border-teal-500/10">
                  <span className="opacity-60 block text-[9px] font-extrabold text-teal-950 uppercase">TỌA ĐỘ HIỆN TẠI</span>
                  <span className="font-black text-teal-900 text-sm">[{vectorAns.map(formatNum).join(', ')}]</span>
                </div>
                <div className="space-y-0.5 bg-white p-2.5 rounded border border-[#141414]/10">
                  <span className="opacity-60 block text-[9px] font-extrabold text-[#141414]/70 uppercase">ĐỘ DÀI SYMBOLIC</span>
                  <span className="font-extrabold text-[#141414] text-sm" style={{ color: '#141414' }}>
                    <InlineMath math={`\\|\\mathbf{Ans}\\| = ${getExactDistanceAndDecimal(vectorAns.reduce((acc, c) => acc + c*c, 0)).exactLatex}`} />
                  </span>
                </div>
                <div className="space-y-0.5 bg-white p-2.5 rounded border border-teal-500/10 flex flex-col justify-center">
                  <button
                    onClick={() => {
                      // Instantly append token to formula
                      setFormulaInput(prev => prev ? `${prev} + Vector_Ans` : 'Vector_Ans');
                    }}
                    className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white border border-teal-950 rounded font-mono text-[10px] font-black uppercase tracking-tight flex items-center justify-center gap-1 shadow-[1px_1px_0px_0px_rgba(20,20,20,1)]"
                  >
                    Ghép vào Biểu thức
                  </button>
                </div>
              </div>
            </div>

            {/* Operations and CAS Studio */}
            <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <h3 className="font-serif italic text-xl font-black border-b border-[#141414]/15 pb-2 uppercase tracking-wide">
                Bảng điều khiển Giải CAS Vector
              </h3>

              {/* Module 1: Arbitrary Expression Evaluator */}
              <div className="space-y-3 p-4 bg-[#F5F5F3] border-2 border-[#141414] rounded-lg">
                <div className="flex justify-between items-center">
                  <label className="font-mono text-xs font-black uppercase text-[#141414] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    Đánh giá biểu thức tùy ý (Tên Vector trực tiếp)
                  </label>
                  <span className="text-[10px] font-mono text-neutral-500 font-bold">Hỗ trợ: v1, v2, v3, v4, v5, Vector_Ans</span>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formulaInput}
                    onChange={(e) => setFormulaInput(e.target.value)}
                    placeholder="Ví dụ: 3 * v1 - 2 * v2 + Vector_Ans"
                    className="flex-1 bg-white border-2 border-[#141414] rounded px-3 py-2 font-mono text-xs text-[#141414] focus:outline-none"
                  />
                  <button
                    onClick={handleFormulaEvaluation}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white border-2 border-black font-mono text-xs font-black rounded shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-all flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    Tính toán
                  </button>
                </div>

                {/* Insertion Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1 items-center">
                  <span className="text-[10px] font-mono font-bold opacity-60 mr-1">Chèn nhanh:</span>
                  {['v1', 'v2', 'v3', 'v4', 'v5', 'Vector_Ans'].map(tk => (
                    <button
                      key={tk}
                      type="button"
                      disabled={tk !== 'Vector_Ans' && !getVectorActiveState(tk)}
                      onClick={() => setFormulaInput(prev => prev ? `${prev} + ${tk}` : tk)}
                      className="px-2 py-0.5 bg-white text-[10px] font-mono border-2 border-black/15 hover:border-black rounded text-zinc-950 font-bold disabled:opacity-40"
                    >
                      {tk}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormulaInput('')}
                    className="px-2 py-0.5 text-red-700 hover:bg-red-50 text-[10px] font-mono border border-red-300 rounded font-black"
                  >
                    Xóa sạch
                  </button>
                </div>
              </div>

              {/* Module 2: Multi-Vector Addition and Subtraction */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border-2 border-[#141414] rounded-lg space-y-3 bg-teal-50/10">
                  <h4 className="font-mono text-xs font-black uppercase text-teal-950">Phép Cộng/Trừ Đồng Loạt</h4>
                  <p className="text-[10px] font-mono opacity-65 leading-relaxed">
                    Tự động lấy tất cả các vector đã được đánh dấu tích "Đồng loạt" (tối thiểu 2) để tính gộp kết quả phân tích.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMultiVectorOperation('add')}
                      className="flex-1 py-2 bg-white hover:bg-teal-50 border-2 border-[#141414] font-mono text-[11px] font-black uppercase rounded shadow-[1.5px_1.5px_0px_0px_rgba(20,20,20,1)] flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Cộng đồng loạt (Σ)
                    </button>
                    <button
                      onClick={() => handleMultiVectorOperation('subtract')}
                      className="flex-1 py-2 bg-white hover:bg-teal-50 border-2 border-[#141414] font-mono text-[11px] font-black uppercase rounded shadow-[1.5px_1.5px_0px_0px_rgba(20,20,20,1)] flex items-center justify-center gap-1"
                    >
                      <Minus className="w-3.5 h-3.5" /> Trừ đồng loạt (-)
                    </button>
                  </div>
                </div>

                {/* Module 3: Vector Multiplication Pairwise */}
                <div className="p-4 border-2 border-[#141414] rounded-lg space-y-3 bg-amber-50/10">
                  <h4 className="font-mono text-xs font-black uppercase text-amber-950">Phép Nhân hai Vector bất kỳ</h4>
                  <p className="text-[10px] font-mono opacity-65">
                    Thực hiện nhân cặp tùy ý giữa hệ thống v1-v5 và cả Vector Ans (Ghi đè Vector Ans nếu là phân tích chéo).
                  </p>
                  <div className="flex gap-2 items-center">
                    <select
                      value={multLeft}
                      onChange={(e) => setMultLeft(e.target.value)}
                      className="flex-1 bg-white border-2 border-black rounded text-xs font-mono p-1"
                    >
                      {['v1', 'v2', 'v3', 'v4', 'v5', 'Vector_Ans'].map(o => (
                        <option key={o} value={o} disabled={o !== 'Vector_Ans' && !getVectorActiveState(o)}>{o}</option>
                      ))}
                    </select>
                    <span className="font-bold font-mono text-xs opacity-65">⊙</span>
                    <select
                      value={multRight}
                      onChange={(e) => setMultRight(e.target.value)}
                      className="flex-1 bg-white border-2 border-black rounded text-xs font-mono p-1"
                    >
                      {['v1', 'v2', 'v3', 'v4', 'v5', 'Vector_Ans'].map(o => (
                        <option key={o} value={o} disabled={o !== 'Vector_Ans' && !getVectorActiveState(o)}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVectorMultiplication('dot')}
                      className="flex-1 py-1.5 bg-white hover:bg-amber-50 border-2 border-[#141414] text-[10px] font-mono font-bold uppercase rounded shadow-[1.5px_1.5px_0px_0px_rgba(20,20,20,1)]"
                    >
                      Tích Vô hướng (.)
                    </button>
                    <button
                      onClick={() => handleVectorMultiplication('cross')}
                      className="flex-1 py-1.5 bg-white hover:bg-amber-50 border-2 border-[#141414] text-[10px] font-mono font-bold uppercase rounded shadow-[1.5px_1.5px_0px_0px_rgba(20,20,20,1)]"
                    >
                      Tích Có hướng (x)
                    </button>
                  </div>
                </div>
              </div>

              {/* Module 4: High-End Analytical Lab (Parity to Geometry Pro) */}
              <div className="p-4 border-2 border-[#141414] rounded-lg space-y-4 bg-zinc-50">
                <div className="border-b border-[#141414]/10 pb-1.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h4 className="font-mono text-xs font-black uppercase text-zinc-900 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-rose-500" />
                      Hồ sơ Hình Học Phân Tích (Geometry Pro Lab)
                    </h4>
                    <p className="text-[10px] font-mono opacity-60 leading-relaxed mt-0.5">
                      Tính năng giải tích mở rộng chuyên sâu cho từng đại lượng vector và các biến đổi không gian.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold bg-neutral-200 text-neutral-800 px-1.5 py-0.5 rounded border border-neutral-300">
                      HỆ HÌNH HỌC: {vectorDim}
                    </span>
                  </div>
                </div>

                {/* Points configuration editor */}
                <div className="bg-white border-2 border-[#141414]/10 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center pb-1 border-b border-dashed border-[#141414]/10">
                    <span className="font-mono text-[9.5px] font-black uppercase text-[#141414] flex items-center gap-1">
                      🎯 KHAI BÁO TỌA ĐỘ 5 ĐIỂM (P1 TỚI P5)
                    </span>
                    <button 
                      onClick={handlePointsClearAll}
                      type="button"
                      className="text-[9px] font-mono font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-0.5 rounded cursor-pointer transition-all"
                    >
                      Xóa toàn bộ điểm
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {['P1', 'P2', 'P3', 'P4', 'P5'].map((name) => {
                      const pObj = name === 'P1' ? p1 : name === 'P2' ? p2 : name === 'P3' ? p3 : name === 'P4' ? p4 : p5;
                      const setPObj = name === 'P1' ? setP1 : name === 'P2' ? setP2 : name === 'P3' ? setP3 : name === 'P4' ? setP4 : setP5;
                      return (
                        <div key={name} className="p-2 border border-[#141414]/10 bg-neutral-50/50 rounded space-y-1 hover:bg-neutral-50 transition-all">
                          <span className="font-mono text-[9px] font-black text-rose-950 uppercase block text-center border-b border-dashed border-[#141414]/5 pb-0.5">
                            Điểm {name}
                          </span>
                          <div className="grid grid-cols-3 gap-1">
                            <div>
                              <span className="font-mono text-[8px] opacity-50 block text-center">X</span>
                              <input 
                                type="text" 
                                value={pObj.x} 
                                onChange={(e) => setPObj(prev => ({ ...prev, x: e.target.value }))}
                                className="w-full bg-white border border-[#141414]/20 rounded text-center font-mono text-[10px] p-0.5 focus:outline-none focus:border-black"
                              />
                            </div>
                            <div>
                              <span className="font-mono text-[8px] opacity-50 block text-center">Y</span>
                              <input 
                                type="text" 
                                value={pObj.y} 
                                onChange={(e) => setPObj(prev => ({ ...prev, y: e.target.value }))}
                                className="w-full bg-white border border-[#141414]/20 rounded text-center font-mono text-[10px] p-0.5 focus:outline-none focus:border-black"
                              />
                            </div>
                            {vectorDim === '3D' ? (
                              <div>
                                <span className="font-mono text-[8px] opacity-50 block text-center">Z</span>
                                <input 
                                  type="text" 
                                  value={pObj.z} 
                                  onChange={(e) => setPObj(prev => ({ ...prev, z: e.target.value }))}
                                  className="w-full bg-white border border-[#141414]/20 rounded text-center font-mono text-[10px] p-0.5 focus:outline-none focus:border-black"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <span className="font-mono text-[8px] opacity-25 italic text-center block leading-none">N/A</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-5 pt-1">
                  {/* Pairwise analysis */}
                  <div className="space-y-2 border-r border-[#141414]/10 pr-2 last:border-r-0">
                    <span className="font-mono text-[10px] font-extrabold text-[#141414] uppercase block">1. Cặp Vector</span>
                    <div className="flex gap-2 items-center">
                      <select value={analLeft} onChange={(e) => setAnalLeft(e.target.value)} className="flex-1 min-w-0 bg-white border border-black rounded text-[11px] font-mono p-1">
                        {['v1', 'v2', 'v3', 'v4', 'v5', 'Vector_Ans'].map(v => (
                          <option key={v} value={v} disabled={v !== 'Vector_Ans' && !getVectorActiveState(v)}>{v}</option>
                        ))}
                      </select>
                      <span className="font-mono text-[9px] opacity-50 shrink-0">&</span>
                      <select value={analRight} onChange={(e) => setAnalRight(e.target.value)} className="flex-1 min-w-0 bg-white border border-black rounded text-[11px] font-mono p-1">
                        {['v1', 'v2', 'v3', 'v4', 'v5', 'Vector_Ans'].map(v => (
                          <option key={v} value={v} disabled={v !== 'Vector_Ans' && !getVectorActiveState(v)}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      <button onClick={handleCalculateAngle} className="w-full py-1 bg-white hover:bg-neutral-100 border border-black rounded font-mono text-[10px] font-bold text-center leading-snug">Góc giữa θ</button>
                      <button onClick={handleCalculateProjection} className="w-full py-1 bg-white hover:bg-neutral-100 border border-black rounded font-mono text-[10px] font-bold text-center leading-snug">Hình chiếu Proj_B(A)</button>
                    </div>
                  </div>

                  {/* 3-Way study (coplanar / independence) */}
                  <div className="space-y-2 border-r border-[#141414]/10 pr-2 last:border-r-0">
                    <span className="font-mono text-[10px] font-extrabold text-[#141414] uppercase block">2. Hệ 3 Vector</span>
                    <div className="flex gap-1.5 items-center">
                      {['A', 'B', 'C'].map((lbl, idx) => {
                        const val = idx === 0 ? tripleVecA : idx === 1 ? tripleVecB : tripleVecC;
                        const sVal = idx === 0 ? setTripleVecA : idx === 1 ? setTripleVecB : setTripleVecC;
                        return (
                          <select key={lbl} value={val} onChange={(e) => sVal(e.target.value)} className="flex-1 min-w-0 bg-white border border-black rounded text-[10.5px] font-mono p-0.5">
                            {['v1', 'v2', 'v3', 'v4', 'v5', 'Vector_Ans'].map(v => (
                              <option key={v} value={v} disabled={v !== 'Vector_Ans' && !getVectorActiveState(v)}>{v}</option>
                            ))}
                          </select>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      <button onClick={handleCalculateCoplanarity} disabled={vectorDim !== '3D'} className="w-full py-1 bg-white hover:bg-neutral-100 border border-black rounded font-mono text-[10px] font-bold text-center disabled:opacity-40 leading-snug">K.tra Đồng Phẳng (3D)</button>
                      <button onClick={handleCalculateBasisIndependence} className="w-full py-1 bg-white hover:bg-neutral-100 border border-black rounded font-mono text-[10px] font-bold text-center leading-snug">Hệ độc lập / Cơ sở</button>
                    </div>
                  </div>

                  {/* Linear Combination solver */}
                  <div className="space-y-2 border-r border-[#141414]/10 pr-2 last:border-r-0">
                    <span className="font-mono text-[10px] font-extrabold text-[#141414] uppercase block">3. Phối hợp Tuyến tính</span>
                    <div className="flex gap-1 items-center">
                      <select value={lcTarget} onChange={(e) => setLcTarget(e.target.value)} className="flex-1 min-w-0 bg-white border border-black rounded text-[10px] font-mono p-0.5">
                        {['v1', 'v2', 'v3', 'v4', 'v5', 'Vector_Ans'].map(v => (
                          <option key={v} value={v} disabled={v !== 'Vector_Ans' && !getVectorActiveState(v)}>{v}</option>
                        ))}
                      </select>
                      <span className="font-mono text-[9px] opacity-50 shrink-0">=</span>
                      <select value={lcBase1} onChange={(e) => setLcBase1(e.target.value)} className="flex-1 min-w-0 bg-white border border-black rounded text-[10px] font-mono p-0.5">
                        {['v1', 'v2', 'v3', 'v4', 'v5', 'Vector_Ans'].map(v => (
                          <option key={v} value={v} disabled={v !== 'Vector_Ans' && !getVectorActiveState(v)}>{v}</option>
                        ))}
                      </select>
                      <span className="font-mono text-[9px] opacity-50 shrink-0">+</span>
                      <select value={lcBase2} onChange={(e) => setLcBase2(e.target.value)} className="flex-1 min-w-0 bg-white border border-black rounded text-[10px] font-mono p-0.5">
                        {['v1', 'v2', 'v3', 'v4', 'v5', 'Vector_Ans'].map(v => (
                          <option key={v} value={v} disabled={v !== 'Vector_Ans' && !getVectorActiveState(v)}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <button onClick={handleCalculateLinearCombination} className="w-full py-1.5 bg-[#141414] text-white hover:bg-[#323232] rounded font-mono text-[10px] font-black uppercase text-center mt-1 leading-snug">Giải tổ hợp tuyến tính</button>
                  </div>

                  {/* Points Equation Solver */}
                  <div className="space-y-2">
                    <span className="font-mono text-[10px] font-extrabold text-[#141414] uppercase block">4. Điểm & Phương Trình</span>
                    <div className="flex gap-1 items-center justify-between">
                      <div className="flex-1 min-w-0 flex flex-col">
                        <span className="text-[8px] font-mono opacity-50 block text-center">ĐIỂM A</span>
                        <select value={pointSelA} onChange={(e) => setPointSelA(e.target.value)} className="bg-white border border-black rounded text-[10px] font-mono p-0.5 w-full text-center">
                          {['P1', 'P2', 'P3', 'P4', 'P5'].map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                      <span className="text-[9px] font-mono opacity-40 mt-3 shrink-0">&</span>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <span className="text-[8px] font-mono opacity-50 block text-center">ĐIỂM B</span>
                        <select value={pointSelB} onChange={(e) => setPointSelB(e.target.value)} className="bg-white border border-black rounded text-[10px] font-mono p-0.5 w-full text-center">
                          {['P1', 'P2', 'P3', 'P4', 'P5'].map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                      {vectorDim === '3D' && (
                        <>
                          <span className="text-[9px] font-mono opacity-40 mt-3 shrink-0">&</span>
                          <div className="flex-1 min-w-0 flex flex-col">
                            <span className="text-[8px] font-mono opacity-50 block text-center">ĐIỂM C</span>
                            <select value={pointSelC} onChange={(e) => setPointSelC(e.target.value)} className="bg-white border border-black rounded text-[10px] font-mono p-0.5 w-full text-center">
                              {['P1', 'P2', 'P3', 'P4', 'P5'].map(p => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button 
                        onClick={handlePointsLineCalculation} 
                        className="py-1 bg-white hover:bg-neutral-100 border border-black rounded font-mono text-[9px] font-bold text-center leading-tight sm:px-1"
                        title="Dựng phương trình đường thẳng qua hai điểm A, B"
                      >
                        Lập Đ.Thẳng
                      </button>
                      <button 
                        onClick={handlePointsPlaneCalculation} 
                        disabled={vectorDim !== '3D'}
                        className="py-1 bg-white hover:bg-neutral-100 border border-black rounded font-mono text-[9px] font-bold text-center disabled:opacity-40 leading-tight sm:px-1"
                        title="Dựng phương trình mặt phẳng qua ba điểm A, B, C (chỉ ở 3D)"
                      >
                        Lập M.Phẳng
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Outputs */}
          <div className="space-y-6 lg:col-span-12 xl:col-span-2">
            <div className="bg-white border-2 border-[#141414] rounded-xl p-4 min-h-[400px] flex flex-col justify-between shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] hover:shadow-[5px_5px_0px_0px_rgba(20,20,20,1)] transition-all">
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-[#141414]/15 pb-2">
                  <span className="font-mono text-[10px] uppercase font-black opacity-75 flex items-center gap-1.5">
                    <Sigma className="w-3.5 h-3.5 text-[#141414]" />
                    KẾT QUẢ KHẢO SÁT
                  </span>
                </div>

                {vecError && (
                  <div className="p-3 bg-red-150 border-2 border-red-600 text-red-950 font-mono font-black rounded text-xs leading-relaxed animate-shake">
                    ⚠️ {vecError}
                  </div>
                )}

                {vecOutputHtml.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <p className="font-mono text-xs opacity-40 italic">Chưa dựng phép tính phân giải nào.</p>
                    <p className="text-[10px] font-mono opacity-50 font-bold max-w-xs mx-auto">Hãy lựa chọn một phép tính vector ở bảng khảo sát bên trái để xem lời giải chi tiết.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vecOutputHtml}
                  </div>
                )}
              </div>
              <div className="border-t border-[#141414]/10 pt-4 text-[9px] font-mono text-neutral-500 font-bold">
                * Hỗ trợ giải thích symbolic phân phối căn thức thực và lũy thừa định mức tương thích với Advanced Math Engine.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MATRIX WORKSPACE TAB VIEW
          ===================================================================== */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-[#141414]">
          <div className="lg:col-span-2 space-y-6">
            {/* Set Values & Sizes */}
            <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="font-serif italic text-2xl font-black uppercase tracking-wide">Matrix Workspace</h3>
                <div className="flex items-center gap-2">
                  <label className="font-mono text-xs font-black uppercase">Select Index:</label>
                  <select
                    value={activeWorkspaceMatrix}
                    onChange={(e) => setActiveWorkspaceMatrix(e.target.value)}
                    className="bg-[#141414] text-white border-2 border-black rounded font-mono text-xs p-2 focus:outline-none"
                  >
                    {VALID_MATRIX_NAMES.map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid Dimensions */}
              <div className="flex flex-wrap gap-4 items-center bg-[#F5F5F3] p-4 rounded-lg border border-[#141414]/10 font-mono text-xs">
                <span className="font-black uppercase">Dimensions:</span>
                <input
                  type="number"
                  value={manualRows}
                  onChange={(e) => resizeWorkspaceGrid(parseInt(e.target.value) || 3, manualCols)}
                  className="w-16 bg-white border-2 border-[#141414] rounded px-2 py-1 font-mono text-xs text-center text-[#141414]"
                  min="1" max="15"
                />
                <span className="font-bold">x</span>
                <input
                  type="number"
                  value={manualCols}
                  onChange={(e) => resizeWorkspaceGrid(manualRows, parseInt(e.target.value) || 3)}
                  className="w-16 bg-white border-2 border-[#141414] rounded px-2 py-1 font-mono text-xs text-center text-[#141414]"
                  min="1" max="15"
                />
                <button
                  onClick={() => saveGridToStorage(activeWorkspaceMatrix)}
                  className="px-4 py-2 bg-[#141414] hover:bg-[#2e2e2e] text-white font-black font-mono text-[10px] uppercase tracking-wider rounded shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-all"
                >
                  Save Active Matrix to {activeWorkspaceMatrix}
                </button>
              </div>

              {/* Dynamic Interactive Input Grid */}
              <div className="border-2 border-[#141414] p-6 rounded-lg bg-[#F5F5F3] overflow-x-auto min-h-[160px] flex items-center justify-center">
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${manualCols}, minmax(40px, 1fr))` }}>
                  {manualInputGrid.slice(0, manualRows).map((row, rIdx) => (
                    row.slice(0, manualCols).map((cell, cIdx) => (
                      <input
                        key={`${rIdx}-${cIdx}`}
                        type="text"
                        value={cell}
                        onChange={(e) => {
                          const val = e.target.value;
                          const copy = [...manualInputGrid];
                          copy[rIdx][cIdx] = val;
                          setManualInputGrid(copy);
                        }}
                        className="w-14 h-9 bg-white border-2 border-[#141414] text-center text-xs font-mono text-[#141414] font-bold focus:outline-none focus:bg-amber-50 rounded"
                      />
                    ))
                  ))}
                </div>
              </div>
            </div>

            {/* Bulk Text Import styles */}
            <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-[#141414]/15 pb-2">
                <h3 className="font-serif italic text-xl font-black uppercase">Multi-Style Import Parser</h3>
                <span className="font-mono text-[10px] text-white bg-[#141414] px-2 py-0.5 rounded uppercase font-bold">MATLAB / PYTHON / NATLANG</span>
              </div>
              <textarea
                value={bulkInputText}
                onChange={(e) => setBulkInputText(e.target.value)}
                placeholder="Paste code or expressions e.g.&#10;A_1=[1,2;3,4]&#10;Let A_1 be [[1,2],[3,4]]&#10;Create a 3x3 matrix B_1 with rows 1 0 2, -1 3 0, 2 1 1"
                className="w-full h-24 bg-[#F5F5F3] border-2 border-[#141414] rounded p-3 font-mono text-xs text-[#141414] focus:outline-none focus:bg-white whitespace-pre"
              />
              <button 
                onClick={handleBulkParse}
                className="w-full py-2 bg-[#141414] hover:bg-[#2e2e2e] text-white font-bold font-mono text-xs uppercase tracking-wider rounded shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-all"
              >
                Parse & Store Matrix Block
              </button>
            </div>

            {/* Symbolic Algebra expression evaluator */}
            <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <h3 className="font-serif italic text-xl font-black uppercase">Symbolic Complex Expression Evaluator</h3>
              <p className="text-xs font-mono opacity-60">Compute complex algebraic chains. Uses stored matrix symbols (A_1..D_4):</p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={expressionInput}
                  onChange={(e) => setExpressionInput(e.target.value)}
                  placeholder="2 * A_1 + B_1^T"
                  className="flex-1 bg-[#F5F5F3] border-2 border-[#141414] rounded px-3 py-2 font-mono text-xs text-[#141414] focus:outline-none focus:bg-white"
                />
                <button
                  onClick={handleEvaluateExpression}
                  className="bg-[#141414] hover:bg-[#2e2e2e] text-white border-2 border-[#141414] px-6 py-2 rounded font-mono text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-all"
                >
                  Evaluate
                </button>
              </div>
              <p className="text-[10px] font-mono text-neutral-500 font-bold">Supports: transpose (^T or ^t), inverse (^-1), scalar multiplication, subtraction (-), and matrix power (^2).</p>
            </div>
          </div>

          {/* Selected Database & Evaluation Results */}
          <div className="space-y-6">
            <div className="bg-white border-2 border-[#141414] rounded-xl p-6 min-h-[400px] flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-[#141414]/15 pb-2">
                  <span className="font-mono text-xs uppercase font-black opacity-65">Stored Databases</span>
                  <Layers className="w-4 h-4 text-[#141414]" />
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
                  {VALID_MATRIX_NAMES.map(name => {
                    const exists = !!matrixStorage[name];
                    return (
                      <button
                        key={name}
                        onClick={() => {
                          const stored = matrixStorage[name];
                          if (stored) {
                            setManualRows(stored.rows);
                            setManualCols(stored.cols);
                            setManualInputGrid(stored.data.map(row => row.map(v => v.toString())));
                            setActiveWorkspaceMatrix(name);
                          }
                        }}
                        className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                          exists 
                            ? 'bg-[#141414] text-white border-2 border-[#141414] shadow-[1px_1px_0px_0px_rgba(20,20,20,1)]' 
                            : 'bg-[#F5F5F3] text-[#141414]/40 border-2 border-[#141414]/15 hover:border-[#141414]'
                        }`}
                      >
                        {name} {exists ? `(${matrixStorage[name].rows}x${matrixStorage[name].cols})` : ''}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-[#141414]/15 pt-4 space-y-4">
                  <span className="font-mono text-xs uppercase font-black opacity-65">Evaluation Results</span>
                  
                  {workspaceError && (
                    <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 rounded text-xs font-mono font-bold">
                      {workspaceError}
                    </div>
                  )}

                  {workspaceResultMatrix && (
                    <div className="space-y-3">
                      <p className="font-mono text-xs text-neutral-500 font-bold">Result Matrix ({workspaceResultMatrix.rows}x{workspaceResultMatrix.cols}):</p>
                      
                      <div className="p-4 bg-[#F5F5F3] rounded-lg border-2 border-[#141414] flex items-center justify-center">
                        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${workspaceResultMatrix.cols}, minmax(40px, 1fr))` }}>
                          {workspaceResultMatrix.data.map((row, rIdx) => (
                            row.map((cell, cIdx) => (
                              <div key={`${rIdx}-${cIdx}`} className="h-8 flex items-center justify-center bg-white border-2 border-[#141414] rounded font-mono text-xs text-[#141414] font-bold px-2 min-w-[3.5rem]">
                                {formatNum(cell)}
                              </div>
                            ))
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {workspaceTrace.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-mono text-[10px] text-neutral-500 uppercase font-bold">Calculation Steps:</p>
                      <div className="max-h-[160px] overflow-y-auto space-y-1 font-mono text-[10px] text-[#141414]">
                        {workspaceTrace.map((tr, idx) => (
                          <p key={idx} className="bg-[#F5F5F3] p-1.5 rounded border border-[#141414]/10 font-semibold">{tr}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          ROW REDUCTIONS TAB VIEW (REF/RREF)
          ===================================================================== */}
      {activeTab === 'calc' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] text-[#141414]">
              <h3 className="font-serif italic text-2xl font-black border-b border-[#141414]/15 pb-2 uppercase tracking-wide">
                ★ Calculations Panel
              </h3>
              
              <div className="flex flex-wrap gap-4 items-center bg-[#F5F5F3] p-4 rounded-lg border border-[#141414]/10">
                <div className="flex items-center gap-2">
                  <label className="font-mono text-xs font-black text-[#141414] uppercase">Select Matrix:</label>
                  <select
                    value={selectedCalcMatrix}
                    onChange={(e) => setSelectedCalcMatrix(e.target.value)}
                    className="bg-[#141414] text-white border-2 border-black rounded font-mono text-xs p-2 focus:outline-none"
                  >
                    {VALID_MATRIX_NAMES.map(n => (
                      matrixStorage[n] ? <option key={n} value={n} className="bg-[#141414] text-white">{n} ({matrixStorage[n].rows}x{matrixStorage[n].cols})</option> : null
                    ))}
                  </select>
                </div>

                <button 
                  onClick={calculateCoreOps} 
                  className="px-4 py-2.5 bg-[#141414] hover:bg-neutral-800 text-white font-extrabold font-mono text-xs uppercase tracking-wider rounded border-2 border-[#141414] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-yellow-400 font-extrabold">★</span> TÍNH DETERMINANT (ĐỊNH THỨC)
                </button>
                
                <button 
                  onClick={runRowReductions} 
                  className="px-4 py-2.5 bg-[#141414] hover:bg-neutral-800 text-white font-extrabold font-mono text-xs uppercase tracking-wider rounded border-2 border-[#141414] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-emerald-400 font-extrabold">★</span> BIẾN ĐỔI CHUẨN REF & RREF
                </button>
              </div>

              {calcError && (
                <div className="p-3 bg-red-500/10 border-2 border-red-500 text-red-600 rounded text-xs font-mono font-bold">
                  {calcError}
                </div>
              )}

              {/* Basic Output Results */}
              {calcResult && (
                <div className="space-y-6 p-6 bg-[#F5F5F3] rounded-xl border-2 border-[#141414] animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-[#141414]/10 pb-4">
                    <div className="p-4 bg-white border-2 border-[#141414] rounded-lg">
                      <p className="font-mono text-xs font-black text-[#141414] tracking-wider uppercase flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-400 border border-black inline-block" />
                        DETERMINANT (ĐỊNH THỨC SỐ):
                      </p>
                      <p className="font-mono text-2xl font-black mt-2 text-[#141414]">
                        {calcResult.determinant !== undefined ? (
                          <span className="underline decoration-yellow-400 decoration-4">
                            det({calcResult.matrixName}) = {formatNum(calcResult.determinant)}
                          </span>
                        ) : (
                          <span className="text-red-600 text-xs font-black uppercase">Undefined (Requires Square Matrix)</span>
                        )}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-white border-2 border-[#141414] rounded-lg">
                      <p className="font-mono text-xs font-black text-[#141414] tracking-wider uppercase flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-teal-400 border border-black inline-block" />
                        TRACE (VẾT ĐƯỜNG CHÉO):
                      </p>
                      <p className="font-mono text-2xl font-black mt-2 text-[#141414]">
                        {calcResult.trace !== undefined ? (
                          <span>tr({calcResult.matrixName}) = {formatNum(calcResult.trace)}</span>
                        ) : (
                          <span className="text-neutral-500 text-xs italic">Undefined</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {calcResult.inverse && (
                      <div className="space-y-2">
                        <p className="font-mono text-xs font-black text-[#141414] uppercase tracking-wider">
                          ★ MATRIX INVERSE (MA TRẬN NGHỊCH ĐẢO - A⁻¹):
                        </p>
                        <div className="p-4 bg-white border-2 border-[#141414] rounded flex justify-center">
                          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${calcResult.inverse.cols}, minmax(45px, 1fr))` }}>
                            {calcResult.inverse.data.map((row, rIdx) => (
                              row.map((cell, cIdx) => (
                                <div key={`${rIdx}-${cIdx}`} className="h-7 w-12 flex items-center justify-center bg-[#F5F5F3] rounded text-xs font-mono font-black text-[#141414] border border-[#141414]/20">
                                  {formatNum(cell)}
                                </div>
                              ))
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {calcResult.adjugate && (
                      <div className="space-y-2">
                        <p className="font-mono text-xs font-black text-[#141414] uppercase tracking-wider">
                          ★ ADJUGATE MATRIX (MA TRẬN PHỤ HỢP - adj(A)):
                        </p>
                        <div className="p-4 bg-white border-2 border-[#141414] rounded flex justify-center">
                          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${calcResult.adjugate.cols}, minmax(45px, 1fr))` }}>
                            {calcResult.adjugate.data.map((row, rIdx) => (
                              row.map((cell, cIdx) => (
                                <div key={`${rIdx}-${cIdx}`} className="h-7 w-12 flex items-center justify-center bg-[#F5F5F3] rounded text-xs font-mono font-black text-[#141414] border border-[#141414]/20">
                                  {formatNum(cell)}
                                </div>
                              ))
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Row Reduction step by step tracing UI */}
            {reductionResult && (
              <div className="space-y-6">
                {/* REF output summary */}
                <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] text-[#141414]">
                  <h4 className="font-mono uppercase font-black text-lg text-[#141414] tracking-tight flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-[#141414] text-white rounded text-xs font-black uppercase">REF</span>
                    MA TRẬN BẬC THANG / ROW ECHELON FORM (REF)
                  </h4>
                  
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {reductionResult.refSteps?.map((step: any, idx: number) => (
                      <div key={idx} className="border border-[#141414]/25 p-4 rounded-lg bg-[#F5F5F3] space-y-3 font-mono text-xs">
                        <div className="flex justify-between text-[11px] text-[#141414] font-black uppercase">
                          <span>{step.title}</span>
                          <span>BƯỚC CHUYỂN {idx + 1}</span>
                        </div>
                        <p className="text-[#141414]/80 font-bold">{step.description}</p>
                        
                        <div className="flex justify-center flex-wrap gap-6 items-center bg-white p-3 rounded border border-[#141414]/15">
                          {/* Grid layout */}
                          <div className="p-2 border border-[#141414]/10 rounded bg-[#F5F5F3]">
                            <span className="text-[9px] font-black block text-center mb-1 text-[#141414]/60 uppercase">BEFORE</span>
                            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${step.matrixBefore[0].length}, minmax(40px, 1fr))` }}>
                              {step.matrixBefore.map((row: any[]) => row.map((cell: any, cI: number) => (
                                <div key={cI} className="w-10 h-6 bg-white border border-[#141414]/20 rounded text-[10px] font-bold flex items-center justify-center text-[#141414]">
                                  {formatNum(cell)}
                                </div>
                              )))}
                            </div>
                          </div>
                          
                          <ArrowRight className="w-4 h-4 text-[#141414]" />
                          
                          <div className="p-2 border-2 border-[#141414] rounded bg-[#141414]">
                            <span className="text-[9px] font-black block text-center mb-1 text-white uppercase">AFTER</span>
                            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${step.matrixAfter[0].length}, minmax(40px, 1fr))` }}>
                              {step.matrixAfter.map((row: any[]) => row.map((cell: any, cI: number) => (
                                <div key={cI} className="w-10 h-6 bg-white text-[#141414] rounded text-[10px] font-black flex items-center justify-center border border-[#141414]">
                                  {formatNum(cell)}
                                </div>
                              )))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RREF output summary */}
                <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] text-[#141414]">
                  <h4 className="font-mono uppercase font-black text-lg text-[#141414] tracking-tight flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-[#141414] text-white rounded text-xs font-black uppercase">RREF</span>
                    BẬC THANG RÚT GỌN / ROW REDUCED ECHELON FORM (RREF)
                  </h4>
                  
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {reductionResult.rrefSteps?.map((step: any, idx: number) => (
                      <div key={idx} className="border border-[#141414]/25 p-4 rounded-lg bg-[#F5F5F3] space-y-3 font-mono text-xs">
                        <div className="flex justify-between text-[11px] text-[#141414] font-black uppercase">
                          <span>{step.title}</span>
                          <span>BƯỚC CHUYỂN {idx + 1}</span>
                        </div>
                        <p className="text-[#141414]/80 font-bold">{step.description}</p>
                        
                        <div className="flex justify-center flex-wrap gap-6 items-center bg-white p-3 rounded border border-[#141414]/15">
                          {/* Grid layout */}
                          <div className="p-2 border border-[#141414]/10 rounded bg-[#F5F5F3]">
                            <span className="text-[9px] font-black block text-center mb-1 text-[#141414]/60 uppercase">BEFORE</span>
                            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${step.matrixBefore[0].length}, minmax(40px, 1fr))` }}>
                              {step.matrixBefore.map((row: any[]) => row.map((cell: any, cI: number) => (
                                <div key={cI} className="w-10 h-6 bg-white border border-[#141414]/20 rounded text-[10px] font-bold flex items-center justify-center text-[#141414]">
                                  {formatNum(cell)}
                                </div>
                              )))}
                            </div>
                          </div>
                          
                          <ArrowRight className="w-4 h-4 text-[#141414]" />
                          
                          <div className="p-2 border-2 border-[#141414] rounded bg-[#141414]">
                            <span className="text-[9px] font-black block text-center mb-1 text-white uppercase">AFTER</span>
                            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${step.matrixAfter[0].length}, minmax(40px, 1fr))` }}>
                              {step.matrixAfter.map((row: any[]) => row.map((cell: any, cI: number) => (
                                <div key={cI} className="w-10 h-6 bg-white text-[#141414] rounded text-[10px] font-black flex items-center justify-center border border-[#141414]">
                                  {formatNum(cell)}
                                </div>
                              )))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-[#141414] border-2 border-black rounded-xl p-6 font-mono text-xs text-neutral-300 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <h4 className="text-white uppercase font-black border-b border-white/10 pb-2 mb-3 tracking-wider">REF vs RREF Definition</h4>
              <p className="leading-relaxed mb-4">
                <strong>REF (Row Echelon Form)</strong> transforms a matrix so that zero rows are at the bottom and pivots move strictly to the right in descending rows.
              </p>
              <p className="leading-relaxed border-t border-white/10 pt-4">
                <strong>RREF (Row Reduced Echelon Form)</strong> is unique and standardizes REF pivots to exactly 1, eliminating other non-zero column elements around pivots to reveal exact linear solutions and null space dimensions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          DECOMPOSITIONS TAB VIEW
          ===================================================================== */}
      {activeTab === 'decomp' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-[#141414]">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <h3 className="font-serif italic text-2xl font-black border-b border-[#141414]/15 pb-2 uppercase tracking-wide">Decompositions & Factorizations Panel</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="font-mono text-xs font-black uppercase">Select Matrix:</label>
                  <select
                    value={selectedDecompMatrix}
                    onChange={(e) => setSelectedDecompMatrix(e.target.value)}
                    className="w-full bg-[#F5F5F3] border-2 border-[#141414] rounded font-mono text-xs p-2 text-[#141414] focus:outline-none"
                  >
                    {VALID_MATRIX_NAMES.map(n => (
                      matrixStorage[n] ? <option key={n} value={n}>{n} ({matrixStorage[n].rows}x{matrixStorage[n].cols})</option> : null
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="font-mono text-xs font-black uppercase">Factorization Type:</label>
                  <select
                    value={decompType}
                    onChange={(e) => setDecompType(e.target.value as any)}
                    className="w-full bg-[#F5F5F3] border-2 border-[#141414] rounded font-mono text-xs p-2 text-[#141414] focus:outline-none"
                  >
                    <option value="LU">LU Decomposition (No Pivoting)</option>
                    <option value="LUP">LUP Decomposition (Partial Pivoting)</option>
                    <option value="QR">QR Orthogonal Factorization</option>
                    <option value="Cholesky">Cholesky Symmetric Root (LLᵀ)</option>
                    <option value="SVD">SVD (Singular Value Decomposition)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={runDecomposition}
                    className="w-full py-2 bg-[#141414] hover:bg-[#2e2e2e] text-white font-bold font-mono text-xs uppercase tracking-wide rounded border-2 border-[#141414] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:translate-y-0.5 transition-all"
                  >
                    Evaluate Factorization
                  </button>
                </div>
              </div>

              {decompError && (
                <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 rounded text-xs font-mono font-bold">
                  {decompError}
                </div>
              )}
            </div>

            {/* Decomp Results */}
            {decompOutput && (
              <div className="space-y-6">
                <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-[#141414]/15 pb-2">
                    <h4 className="font-serif italic text-lg font-black uppercase text-[#141414]">Calculated Matrices ({decompType}):</h4>
                    <span className="font-mono text-[10px] text-white bg-[#141414] px-2 py-0.5 rounded uppercase font-bold">{decompOutput.summary}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                    {Object.entries(decompOutput.matrices).map(([key, data]) => (
                      <div key={key} className="p-4 bg-[#F5F5F3] rounded border-2 border-[#141414] space-y-2">
                        <span className="font-mono text-xs uppercase text-[#141414] font-black">Factor Matrix: {key} ({data.length}x{data[0]?.length})</span>
                        <div className="flex justify-center bg-white p-3 rounded border-2 border-[#141414] overflow-x-auto">
                          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${data[0]?.length || 1}, minmax(35px, 1fr))` }}>
                            {data.map((row: any[], rI: number) => (
                              row.map((cell: any, cI: number) => (
                                <div key={`${rI}-${cI}`} className="h-7 w-12 flex items-center justify-center bg-[#F5F5F3] text-xs font-mono text-[#141414] font-bold border border-[#141414]/10 rounded">
                                  {formatNum(cell)}
                                </div>
                              ))
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* LU / LUP / QR Traced explanation if applicable */}
                <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                  <h4 className="font-serif italic text-lg font-black uppercase text-[#141414]">Decomposition Traces & Stability Notes:</h4>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 font-mono text-[11px] text-[#141414]">
                    {decompOutput.steps.map((st: any, idx: number) => (
                      <div key={idx} className="border border-[#141414]/10 p-2 bg-[#F5F5F3] rounded">
                        <span className="text-[#141414] font-black block bg-white border-b border-[#141414]/10 px-1">{st.title}</span>
                        <p className="mt-1 opacity-70 font-semibold">{st.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-[#141414] border-2 border-[#141414] rounded-xl p-6 font-mono text-xs text-neutral-300 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <h4 className="text-white uppercase font-black border-b border-white/10 pb-2 mb-3">Technical Dimensions Info</h4>
              <p className="leading-relaxed">
                <strong>QR (Gram-Schmidt)</strong> maps Columns onto orthogonal headers. Perfect for linear least square mappings.
              </p>
              <p className="leading-relaxed border-t border-white/10 pt-4 mt-4">
                <strong>SVD (Jacobi Method)</strong> solves columns alignment with eigenvalue shears. Essential for low-rank matrices approximation and principal components analysis.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          EIGEN & JACOBI TAB VIEW
          ===================================================================== */}
      {activeTab === 'eigen' && (
        <div className="w-full space-y-6 text-[#141414]">
            <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <h3 className="font-serif italic text-2xl font-black border-b border-[#141414]/15 pb-2 uppercase tracking-wide">Eigen Systems & Diagonalization</h3>
              
              <div className="flex flex-wrap gap-4 items-center bg-[#F5F5F3] p-4 rounded-lg border border-[#141414]/10">
                <div className="flex items-center gap-2">
                  <label className="font-mono text-xs font-black uppercase">Select Target Matrix:</label>
                  <select
                    value={selectedEigenMatrix}
                    onChange={(e) => setSelectedEigenMatrix(e.target.value)}
                    className="bg-[#141414] text-white border-2 border-black rounded font-mono text-xs p-2 focus:outline-none"
                  >
                    {VALID_MATRIX_NAMES.map(n => (
                      matrixStorage[n] ? <option key={n} value={n}>{n} ({matrixStorage[n].rows}x{matrixStorage[n].cols})</option> : null
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={calculateEigenEngine} className="px-4 py-2 bg-[#141414] hover:bg-[#2e2e2e] text-white font-black font-mono text-xs uppercase rounded border-2 border-[#141414] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-all">
                    Characteristic Roots
                  </button>
                  <button onClick={calculateJacobiDiagonalize} className="px-4 py-2 bg-white hover:bg-[#F5F5F3] text-[#141414] border-2 border-[#141414] font-black font-mono text-xs uppercase rounded shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-all">
                    Jacobi Sweep Form
                  </button>
                </div>
              </div>

              {eigenError && (
                <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 rounded text-xs font-mono font-bold">
                  {eigenError}
                </div>
              )}
            </div>

            {/* Output results for Eigen */}
            {eigenOutput && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                  <div className="border-b border-[#141414]/15 pb-2 flex justify-between items-center">
                    <h4 className="font-serif italic text-xl font-black uppercase">Characteristic Equation Polynomial:</h4>
                    <span className="font-mono text-[10px] text-white bg-[#141414] px-2 py-0.5 rounded uppercase font-bold">FADDEEV-LEVERRIER EQ</span>
                  </div>
                  <div className="p-4 bg-[#F5F5F3] border-2 border-[#141414] rounded text-center font-mono text-lg text-black font-bold">
                    {eigenOutput.characteristicEqString}
                  </div>
                </div>

                {eigenOutput.symbolicEigenvalues && eigenOutput.symbolicEigenvalues.length > 0 && (
                  <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                    <h4 className="font-serif italic text-xl font-black uppercase text-[#141414]">Exact Symbolic Root Sheets (Step 1):</h4>
                    <div className="space-y-2.5 font-mono text-xs">
                      {eigenOutput.symbolicEigenvalues.map((sym: any, sIdx: number) => (
                        <div key={sIdx} className="p-3 bg-[#F5F5F3] border border-[#141414]/10 rounded-lg flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span className="font-black text-xs text-teal-600">Sheet Branch #{sIdx + 1}: {sym.branchInfo}</span>
                            <span className="text-[10px] uppercase bg-[#141414] text-white px-2 py-0.5 rounded">{sym.algebraicForm}</span>
                          </div>
                          <p className="font-bold text-sm bg-white p-2 rounded border border-[#141414]/10 mt-1">{sym.exactExpression}</p>
                          {sym.radicals.length > 0 && (
                            <p className="text-[10px] text-neutral-500 font-bold mt-1">Radicals tracked: {sym.radicals.join(", ")}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {eigenOutput.highPrecisionDetails && (
                  <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                    <div className="border-b border-[#141414]/15 pb-2 flex justify-between items-center">
                      <h4 className="font-serif italic text-xl font-black uppercase text-[#141414]">High-Precision Audit Trail (Steps 2-4):</h4>
                      <span className="font-mono text-[9px] bg-teal-400 text-black font-black px-2 py-0.5 rounded uppercase">45D RESOLUTION</span>
                    </div>
                    <p className="font-mono text-[10px] opacity-60">
                      Showing 45-digit numerical evaluation of roots vs EPS_REALITY = 10^(-28) to decide Reality Bypass execution.
                    </p>
                    <div className="space-y-3 font-mono text-[11px]">
                      {eigenOutput.highPrecisionDetails.map((det: any, dIdx: number) => (
                        <div key={dIdx} className="p-4 rounded-lg border-2 border-[#141414] bg-[#F5F5F3] space-y-2.5">
                          <div className="flex justify-between items-center border-b border-[#141414]/10 pb-1.5">
                            <span className="font-black text-xs text-[#141414]">Eigenvalue λ_{det.eigenvalueIndex} Precision Assessment</span>
                            {det.isRealByBypass ? (
                              <span className="bg-emerald-500 text-white font-black text-[9px] px-2 py-0.5 rounded outline outline-1 outline-emerald-600">✓ REALITY BYPASS ACTIVE</span>
                            ) : (
                              <span className="bg-pink-600 text-white font-black text-[9px] px-2 py-0.5 rounded outline outline-1 outline-pink-700">⚔ GENUINE COMPLEX ROOT</span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <span className="block opacity-50 text-[10px] uppercase font-black">High-Precision Real Component (Re):</span>
                              <span className="block break-all bg-white p-1.5 border border-[#141414]/10 rounded font-bold font-mono text-xs">{det.rawReal}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="block opacity-50 text-[10px] uppercase font-black">High-Precision Imaginary Component (Im):</span>
                              <span className="block break-all bg-white p-1.5 border border-[#141414]/10 rounded font-bold font-mono text-xs">{det.rawImag}</span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-[#141414]/5 text-[10px]">
                            <div>
                              <span className="opacity-60 block font-bold uppercase">Imaginary Magnitude:</span>
                              <span className="font-bold text-xs font-mono block break-all text-neutral-800">{det.absImag}</span>
                            </div>
                            <div className="sm:text-right">
                              <span className="opacity-60 block font-bold uppercase">Decision Criteria:</span>
                              <span className="font-black block text-[#141414]">
                                {det.isRealByBypass ? (
                                  <span>|Im| &lt; 10⁻²⁸ (Plausibly Real)</span>
                                ) : (
                                  <span>|Im| ≥ 10⁻²⁸ (Genuinely Complex)</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* General Complex / Real Diagonalization Sheets (V D V⁻¹) */}
                {eigenOutput.complexEigenvalues && eigenOutput.complexEigenvalues.length > 0 && (() => {
                  const n = eigenOutput.complexEigenvalues.length;
                  const targetMat = matrixStorage[selectedEigenMatrix];
                  if (!targetMat) return null;
                  
                  // Setup High-Precision V
                  const V_highPrec: DecimalComplex[][] = Array(n).fill(0).map(() => Array(n).fill(0).map(() => new DecimalComplex(0, 0)));
                  let hasCompleteBasis = true;
                  for (let col = 0; col < n; col++) {
                    const vec = eigenOutput.highPrecEigenvectors?.[col]?.[0];
                    if (!vec) {
                      hasCompleteBasis = false;
                      break;
                    }
                    for (let row = 0; row < n; row++) {
                      V_highPrec[row][col] = vec[row];
                    }
                  }

                  let V_inv_comp: { rows: number; cols: number; data: DecimalComplex[][] } | null = null;
                  let inversionError = "";
                  if (hasCompleteBasis) {
                    try {
                      V_inv_comp = DecimalComplexMatrixEngine.inverse({ rows: n, cols: n, data: V_highPrec });
                    } catch (err: any) {
                      inversionError = err.message || "Transition matrix is singular (Defective eigenspace).";
                    }
                  }

                  const D_highPrec: DecimalComplex[][] = Array(n).fill(0).map((_, rI) => 
                    Array(n).fill(0).map((_, cI) => {
                      if (rI === cI) {
                        return eigenOutput.highPrecEigenvalues?.[rI] || new DecimalComplex(0, 0);
                      } else {
                        return new DecimalComplex(0, 0);
                      }
                    })
                  );

                  const getMatrixCopyText = (data: DecimalComplex[][]) => {
                    return "[" + data.map(row => 
                      row.map(c => {
                        const rStr = c.r.toFixed(25);
                        const iAbsStr = c.i.abs().toFixed(25);
                        if (c.i.abs().toNumber() < 1e-28) return rStr;
                        const sign = c.i.gte(0) ? "+" : "-";
                        return `${rStr}${sign}${iAbsStr}i`;
                      }).join(", ")
                    ).join("; ") + "]";
                  };

                  const handleCopyMatrix = (matData: DecimalComplex[][], name: string) => {
                    navigator.clipboard.writeText(getMatrixCopyText(matData));
                    setCopiedMat(name);
                    setTimeout(() => setCopiedMat(null), 1500);
                  };

                  return (
                    <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                      <div className="border-b border-[#141414]/15 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <h4 className="font-serif italic text-xl font-black uppercase text-[#141414]">Comprehensive Complex Diagonalization (V D V⁻¹):</h4>
                          <span className="font-mono text-[9px] bg-indigo-500 text-white font-black px-2 py-0.5 rounded uppercase mt-1 inline-block">EIGENSYSTEM STRUCTURAL SOLVER (25 DIGITS PRECISION)</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#141414]/50 italic">Double-click any cell to copy 25-digit value</span>
                      </div>
                      <p className="font-mono text-xs opacity-60">
                        Evaluates transition matrix <span className="font-bold">V</span> and complex eigenvalues <span className="font-bold">D</span> with 45-digit internal accuracy, truncated to 25 decimals. Verify the algebraic identity: <span className="font-bold">A = V · D · V⁻¹</span>
                      </p>

                      {!hasCompleteBasis ? (
                        <div className="p-3 bg-red-50 border-2 border-red-500 text-red-700 rounded text-xs font-mono font-bold">
                          Cannot compute diagonalization: Deficient eigenspace (number of linearly independent eigenvectors is less than {n}).
                        </div>
                      ) : inversionError ? (
                        <div className="p-3 bg-red-50 border-2 border-red-500 text-red-700 rounded text-xs font-mono font-bold">
                          Singular transition matrix: {inversionError}
                        </div>
                      ) : (
                        <div className="space-y-6 pt-2">
                          <div className="grid grid-cols-1 gap-6">
                            {/* Matrix V */}
                            <div className="p-4 bg-[#F5F5F3] rounded border-2 border-[#141414] space-y-2 font-mono">
                              <div className="flex justify-between items-center">
                                <span className="text-[#141414] font-black text-xs uppercase block">Transition Matrix V</span>
                                <button 
                                  onClick={() => handleCopyMatrix(V_highPrec, "V")}
                                  className="text-[9px] bg-teal-600 hover:bg-teal-700 hover:scale-105 transition-all text-white font-bold px-2 py-0.5 rounded uppercase cursor-pointer"
                                >
                                  {copiedMat === "V" ? "COPIED V!" : "COPY MATRIX V"}
                                </button>
                              </div>
                              <div className="flex justify-start bg-white p-3 rounded border-2 border-[#141414]/15 overflow-x-auto">
                                <div className="grid gap-1.5 mx-auto" style={{ gridTemplateColumns: `repeat(${n}, 150px)` }}>
                                  {V_highPrec.map((row, rI) => (
                                    row.map((cell, cI) => (
                                      <HighPrecisionCell key={`${rI}-${cI}`} value={cell} />
                                    ))
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Matrix D */}
                            <div className="p-4 bg-[#F5F5F3] rounded border-2 border-[#141414] space-y-2 font-mono">
                              <div className="flex justify-between items-center">
                                <span className="text-[#141414] font-black text-xs uppercase block">Diagonal Matrix D</span>
                                <button 
                                  onClick={() => handleCopyMatrix(D_highPrec, "D")}
                                  className="text-[9px] bg-purple-600 hover:bg-purple-700 hover:scale-105 transition-all text-white font-bold px-2 py-0.5 rounded uppercase cursor-pointer"
                                >
                                  {copiedMat === "D" ? "COPIED D!" : "COPY MATRIX D"}
                                </button>
                              </div>
                              <div className="flex justify-start bg-white p-3 rounded border-2 border-[#141414]/15 overflow-x-auto">
                                <div className="grid gap-1.5 mx-auto" style={{ gridTemplateColumns: `repeat(${n}, 150px)` }}>
                                  {Array(n).fill(0).map((_, rI) => (
                                    Array(n).fill(0).map((_, cI) => {
                                      const cell = rI === cI ? D_highPrec[rI][rI] : new DecimalComplex(0, 0);
                                      return (
                                        <HighPrecisionCell key={`${rI}-${cI}`} value={cell} isDiagonalZero={rI !== cI} />
                                      );
                                    })
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Matrix V^-1 */}
                            {V_inv_comp && (
                              <div className="p-4 bg-[#F5F5F3] rounded border-2 border-[#141414] space-y-2 font-mono">
                                <div className="flex justify-between items-center">
                                  <span className="text-[#141414] font-black text-xs uppercase block">Inverse V⁻¹</span>
                                  <button 
                                    onClick={() => handleCopyMatrix(V_inv_comp!.data, "V_inv")}
                                    className="text-[9px] bg-rose-600 hover:bg-rose-700 hover:scale-105 transition-all text-white font-bold px-2 py-0.5 rounded uppercase cursor-pointer"
                                  >
                                    {copiedMat === "V_inv" ? "COPIED V⁻¹!" : "COPY MATRIX V⁻¹"}
                                  </button>
                                </div>
                                <div className="flex justify-start bg-white p-3 rounded border-2 border-[#141414]/15 overflow-x-auto">
                                  <div className="grid gap-1.5 mx-auto" style={{ gridTemplateColumns: `repeat(${n}, 150px)` }}>
                                    {V_inv_comp.data.map((row, rI) => (
                                      row.map((cell, cI) => (
                                        <HighPrecisionCell key={`${rI}-${cI}`} value={cell} />
                                      ))
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Mathematical Proof Verification */}
                          {V_inv_comp && (() => {
                            // Compute V * D in Decimal precision
                            const VD_data: DecimalComplex[][] = Array(n).fill(0).map(() => Array(n).fill(0).map(() => new DecimalComplex(0, 0)));
                            for (let r = 0; r < n; r++) {
                              for (let c = 0; c < n; c++) {
                                const vCell = V_highPrec[r][c];
                                const dCell = D_highPrec[c][c];
                                VD_data[r][c] = vCell.mul(dCell);
                              }
                            }
                            const VD_comp = { rows: n, cols: n, data: VD_data };
                            
                            // Compute (V * D) * V^-1
                            const resComp = DecimalComplexMatrixEngine.multiply(VD_comp, V_inv_comp);
                            
                            // Compute legacy max difference from original matrix A (which is in standard float)
                            let maxDiff = 0;
                            for (let r = 0; r < n; r++) {
                              for (let c = 0; c < n; c++) {
                                const diffR = resComp.data[r][c].r.minus(targetMat.data[r][c]).toNumber();
                                const diffI = resComp.data[r][c].i.toNumber();
                                const dist = Math.sqrt(diffR * diffR + diffI * diffI);
                                if (dist > maxDiff) maxDiff = dist;
                              }
                            }

                            return (
                              <div className="bg-indigo-50/50 border-2 border-[#141414] rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-mono shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
                                <div className="space-y-1">
                                  <span className="font-black text-[#141414] block uppercase tracking-wider text-xs">Axiomatic Verification Result:</span>
                                  <p className="opacity-70 leading-tight font-medium">Reconstructing target matrix via <code className="font-extrabold bg-[#141414] text-white px-1.5 py-0.5 rounded text-[10px]">V · D · V⁻¹</code> proves diagonalization validity.</p>
                                </div>
                                <div className="p-2.5 bg-white border-2 border-[#141414] rounded text-right shrink-0">
                                  <span className="block text-[9px] text-[#141414] font-black uppercase">Identity Spectral residual (Decimal Delta):</span>
                                  <span className="text-xs font-black text-emerald-600 font-mono block mt-0.5">{maxDiff.toExponential(4)}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                  <h4 className="font-serif italic text-xl font-black uppercase text-[#141414]">Numerical Eigenvalues & Core Eigenvectors:</h4>
                  <div className="grid grid-cols-1 gap-4 font-mono text-xs">
                    {eigenOutput.eigenvalues.map((val: number, idx: number) => (
                      <div key={idx} className="border-2 border-[#141414] p-4 rounded bg-[#F5F5F3] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[#141414] block font-black text-sm">λ_{idx + 1} = {val.toFixed(6)}</span>
                          <span className="text-[10px] text-neutral-500 font-bold block">Solved via QR algorithm.</span>
                          <button
                            onClick={() => handleCopyText(getHighPrecision25(val), `lambda-${idx}`)}
                            className="px-2 py-1 bg-[#141414] text-white hover:bg-[#333333] border border-black rounded text-[10px] font-black uppercase transition-all flex items-center gap-1 shrink-0 mt-1"
                          >
                            {copiedStates[`lambda-${idx}`] ? '✓ Copied 25D!' : 'Copy 25D Precision'}
                          </button>
                        </div>
                        <div className="space-y-1 mt-2 md:mt-0">
                          <span className="text-[11px] text-[#141414] block font-black uppercase">EIGENVECTORS SUBSPACE (Orthobasis V):</span>
                          <div className="flex flex-wrap gap-2">
                            {eigenOutput.eigenvectors[idx]?.map((vec: number[], vI: number) => (
                              <div key={vI} className="px-3 py-2 bg-white text-[#141414] rounded border-2 border-[#141414] block">
                                <span className="font-black">v_{vI+1}:</span> [{vec.map(v => v.toFixed(6)).join(", ")}]
                                <button
                                  onClick={() => handleCopyText(`[${vec.map(v => getHighPrecision25(v)).join(", ")}]`, `vec-${idx}-${vI}`)}
                                  className="px-1.5 py-0.5 bg-[#141414] text-white hover:bg-[#333333] border border-black rounded text-[9px] font-black uppercase transition-all block text-center mt-1.5 w-full"
                                >
                                  {copiedStates[`vec-${idx}-${vI}`] ? '✓ Copied 25-Digit!' : 'Copy 25-Digit'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Output results for Jacobi Diagonalizer */}
            {jacobiOutput && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                  <h4 className="font-serif italic text-xl font-black uppercase text-[#141414]">Symmetric Jacobi Diagonalization:</h4>
                  <p className="font-mono text-xs opacity-60">Constructs Diagonal matrix D and Orthogonal basis P such that Pᵀ * A * P = D:</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                    <div className="p-4 bg-[#F5F5F3] rounded border-2 border-[#141414] space-y-2 font-mono">
                      <span className="text-[#141414] font-black text-xs uppercase block">Orthogonal Matrix P</span>
                      <div className="flex justify-center bg-white p-3 rounded border-2 border-[#141414]/15 overflow-x-auto">
                        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${jacobiOutput.P[0]?.length || 1}, minmax(35px, 1fr))` }}>
                          {jacobiOutput.P.map((row: any[], rI: number) => (
                            row.map((cell: any, cI: number) => (
                              <div key={`${rI}-${cI}`} className="h-7 w-12 flex items-center justify-center bg-[#F5F5F3] text-xs font-bold text-black border border-[#141414]/10 rounded">
                                {formatNum(cell)}
                              </div>
                            ))
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-[#F5F5F3] rounded border-2 border-[#141414] space-y-2 font-mono">
                      <span className="text-[#141414] font-black text-xs uppercase block">Diagonal Matrix D</span>
                      <div className="flex justify-center bg-white p-3 rounded border-2 border-[#141414]/15 overflow-x-auto">
                        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${jacobiOutput.D[0]?.length || 1}, minmax(35px, 1fr))` }}>
                          {jacobiOutput.D.map((row: any[], rI: number) => (
                            row.map((cell: any, cI: number) => (
                              <div key={`${rI}-${cI}`} className="h-7 w-12 flex items-center justify-center bg-[#F5F5F3] text-xs font-bold text-black border border-[#141414]/10 rounded">
                                {formatNum(cell)}
                              </div>
                            ))
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-[#F5F5F3] rounded border-2 border-[#141414] space-y-2 font-mono">
                      <span className="text-[#141414] font-black text-xs uppercase block">Inverse P⁻¹</span>
                      <div className="flex justify-center bg-white p-3 rounded border-2 border-[#141414]/15 overflow-x-auto">
                        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${jacobiOutput.P_inv[0]?.length || 1}, minmax(35px, 1fr))` }}>
                          {jacobiOutput.P_inv.map((row: any[], rI: number) => (
                            row.map((cell: any, cI: number) => (
                              <div key={`${rI}-${cI}`} className="h-7 w-12 flex items-center justify-center bg-[#F5F5F3] text-xs font-bold text-black border border-[#141414]/10 rounded">
                                {formatNum(cell)}
                              </div>
                            ))
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Jacobi active elimination rotation trace */}
                <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                  <h4 className="font-serif italic text-lg font-black uppercase text-[#141414]">Step-by-Step Jacobi Rotation Sweeps:</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 font-mono text-[11px] text-[#141414]">
                    {jacobiOutput.steps.map((st: any, idx: number) => (
                      <div key={idx} className="border border-[#141414]/10 p-2.5 bg-[#F5F5F3] rounded">
                        <span className="text-[#141414] font-black block bg-white border-b border-[#141414]/10 px-1">{st.title}</span>
                        <p className="mt-1 opacity-75 font-semibold">{st.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
        </div>
      )}

      {/* =====================================================================
          MATRIX POWERS TAB VIEW
          ===================================================================== */}
      {activeTab === 'power' && (
        <div className="w-full space-y-6 text-[#141414]">
          <div className="space-y-6">
            <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <h3 className="font-serif italic text-2xl font-black border-b border-[#141414]/15 pb-2 uppercase tracking-wide">Matrix Power & Exponentiation Engine</h3>
              
              <div className="flex gap-4 items-center bg-[#F5F5F3] p-4 rounded-lg border border-[#141414]/10">
                <label className="font-mono text-xs font-black uppercase text-[#141414]">Select Matrix:</label>
                <select
                  value={selectedPowerMatrix}
                  onChange={(e) => setSelectedPowerMatrix(e.target.value)}
                  className="bg-[#141414] text-white border-2 border-black rounded font-mono text-xs p-2 focus:outline-none"
                >
                  {VALID_MATRIX_NAMES.map(n => (
                    matrixStorage[n] ? <option key={n} value={n}>{n} ({matrixStorage[n].rows}x{matrixStorage[n].cols})</option> : null
                  ))}
                </select>
              </div>

              {/* Integer Powers layout */}
              <div className="space-y-4 pt-2">
                <span className="text-[#141414] font-black font-mono text-xs uppercase block">1. Evaluates Integer Power (A^k)</span>
                <div className="flex flex-wrap gap-4 items-end bg-[#F5F5F3] p-4 rounded-lg border border-[#141414]/10">
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] uppercase font-black">Exponent k:</label>
                    <input
                      type="number"
                      value={powerExponent}
                      onChange={(e) => setPowerExponent(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-24 bg-white border-2 border-[#141414] rounded px-3 py-1.5 font-mono text-xs focus:outline-none"
                    />
                  </div>
                  <button onClick={() => handleCalculatePower('integer')} className="px-4 py-2 bg-[#141414] hover:bg-[#2e2e2e] text-white font-black font-mono text-xs uppercase rounded border-2 border-[#141414] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-all">
                    Compute A^k (Square squaring)
                  </button>
                </div>
              </div>

              {/* Fractional Powers layout */}
              <div className="space-y-4 pt-4 border-t border-[#141414]/10">
                <span className="text-[#141414] font-black font-mono text-xs uppercase block">2. Evaluates Fractional Roots (A^(p/q))</span>
                <div className="flex flex-wrap gap-3 items-end bg-[#F5F5F3] p-4 rounded-lg border border-[#141414]/10">
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] uppercase font-black">Coeff p:</label>
                    <input
                      type="number"
                      value={fractionP}
                      onChange={(e) => setFractionP(e.target.value)}
                      className="w-16 bg-white border-2 border-[#141414] rounded px-2.5 py-1.5 font-mono text-xs focus:outline-none"
                    />
                  </div>
                  <span className="font-black pt-4 text-xs">/</span>
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] uppercase font-black font-semibold">Coeff q (Root):</label>
                    <input
                      type="number"
                      value={fractionQ}
                      onChange={(e) => setFractionQ(e.target.value)}
                      className="w-16 bg-white border-2 border-[#141414] rounded px-2.5 py-1.5 font-mono text-xs focus:outline-none"
                    />
                  </div>
                  <button onClick={() => handleCalculatePower('fractional')} className="px-4 py-2 bg-white hover:bg-[#F5F5F3] text-[#141414] border-2 border-[#141414] font-black font-mono text-xs uppercase rounded shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] transition-all">
                    Formulate A^(p/q)
                  </button>
                </div>

                {/* Mixed Spectrum Operations Mode */}
                <div className="space-y-2 pt-2">
                  <span className="text-[#141414] font-black font-mono text-[10px] uppercase block">Mixed-Spectrum Evaluation Mode (For Complex Roots)</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-[#F5F5F3] p-3 rounded-lg border border-[#141414]/10">
                    {[
                      { id: 'complex', label: 'Complex Mode', desc: 'Complex diagonalization & projection' },
                      { id: 'real_schur', label: 'Real Mode (Schur)', desc: 'Real Schur decomposition fallback' },
                      { id: 'educational', label: 'Educational Mode', desc: 'Detailed explanation of real failure' }
                    ].map((modeOpt) => (
                      <button
                        key={modeOpt.id}
                        type="button"
                        onClick={() => setMixedComplexMode(modeOpt.id as any)}
                        className={`p-2 rounded text-left border transition-all ${
                          mixedComplexMode === modeOpt.id
                            ? 'bg-[#141414] border-black text-white shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]'
                            : 'bg-white border-[#141414]/15 hover:bg-neutral-50 text-[#141414]'
                        }`}
                      >
                        <span className="block font-mono text-[10px] font-black uppercase">{modeOpt.label}</span>
                        <span className="block text-[9px] opacity-70 mt-0.5 leading-tight font-semibold">{modeOpt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {powerError && (
                <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 rounded text-xs font-mono font-bold">
                  {powerError}
                </div>
              )}
            </div>

            {/* Output view */}
            {powerOutput && (() => {
              const resultDecimalComplex: DecimalComplex[][] = powerOutput.highPrecResult || powerOutput.result.data.map(row =>
                row.map(cellVal => new DecimalComplex(cellVal, 0))
              );

              return (
                <div className="space-y-6">
                  <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                    <div className="border-b border-[#141414]/15 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h4 className="font-serif italic text-xl font-black uppercase text-[#141414]">Resulting Matrix:</h4>
                        {powerOutput.residualNorm ? (
                          <div className="flex flex-wrap gap-1.5 items-center mt-1">
                            <span className="font-mono text-[9px] bg-indigo-500 text-white font-black px-2 py-0.5 rounded uppercase">25-DIGIT PRECISION</span>
                            <span className="font-mono text-[9px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded uppercase">RESIDUAL: {powerOutput.residualNorm}</span>
                            {powerOutput.isPrincipalBranch && (
                              <span className="font-mono text-[9px] bg-teal-500 text-white font-black px-2 py-0.5 rounded uppercase">● PRINCIPAL BRANCH</span>
                            )}
                          </div>
                        ) : (
                          <span className="font-mono text-[9px] bg-indigo-500 text-white font-black px-2 py-0.5 rounded uppercase mt-1 inline-block">PRECISION POWER MATRIX (25 DIGITS PRECISION)</span>
                        )}
                      </div>
                      <button 
                        onClick={() => {
                          const getMatrixCopyTextLocal = (data: DecimalComplex[][]) => {
                            return "[" + data.map(row => 
                              row.map(c => {
                                const rStr = c.r.toFixed(25);
                                const iAbsStr = c.i.abs().toFixed(25);
                                if (c.i.abs().toNumber() < 1e-28) return rStr;
                                const sign = c.i.gte(0) ? "+" : "-";
                                return `${rStr}${sign}${iAbsStr}i`;
                              }).join(", ")
                            ).join("; ") + "]";
                          };
                          navigator.clipboard.writeText(getMatrixCopyTextLocal(resultDecimalComplex));
                          setCopiedMat("power_result");
                          setTimeout(() => setCopiedMat(null), 1500);
                        }}
                        className="text-[9px] bg-teal-600 hover:bg-teal-700 hover:scale-105 transition-all text-white font-bold px-2 py-0.5 rounded uppercase cursor-pointer"
                      >
                        {copiedMat === "power_result" ? "COPIED RESULT!" : "COPY MATRIX RESULT"}
                      </button>
                    </div>

                    <div className="flex justify-start bg-white p-3 rounded border-2 border-[#141414]/15 overflow-x-auto">
                      <div className="grid gap-1.5 mx-auto" style={{ gridTemplateColumns: `repeat(${powerOutput.result.cols}, 150px)` }}>
                        {resultDecimalComplex.map((row, rI) => (
                          row.map((cell, cI) => (
                            <HighPrecisionCell key={`${rI}-${cI}`} value={cell} />
                          ))
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Traced fraction diagonalization details */}
                  {powerOutput.steps && (
                    <div className="bg-white border-2 border-[#141414] rounded-xl p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                      <h4 className="font-serif italic text-lg font-black uppercase text-[#141414]">PDP⁻¹ Fractional Decompositions Traces:</h4>
                      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 font-mono text-[11px] text-[#141414]">
                        {powerOutput.steps.map((st: any, idx: number) => (
                          <div key={idx} className="border border-[#141414]/10 p-2 bg-[#F5F5F3] rounded">
                            <span className="text-[#141414] font-black block bg-white border-b border-[#141414]/10 px-1">{st.title}</span>
                            <p className="mt-1 opacity-70 font-semibold">{st.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

const getDecimalComplexCellParts = (c: DecimalComplex) => {
  const rStr = c.r.toFixed(25);
  const rParts = rStr.split('.');
  const realInteger = rParts[0];
  const realFractionClear = rParts[1].substring(0, 6);
  const realFractionFaint = rParts[1].substring(6);

  const isImagZero = c.i.abs().toNumber() < 1e-28;
  if (isImagZero) {
    return {
      realInteger,
      realFractionClear,
      realFractionFaint,
      hasImag: false,
      sign: "",
      imagInteger: "",
      imagFractionClear: "",
      imagFractionFaint: ""
    };
  }

  const iStr = c.i.abs().toFixed(25);
  const iParts = iStr.split('.');
  const imagInteger = iParts[0];
  const imagFractionClear = iParts[1].substring(0, 6);
  const imagFractionFaint = iParts[1].substring(6);
  const sign = c.i.gte(0) ? "+" : "-";

  return {
    realInteger,
    realFractionClear,
    realFractionFaint,
    imagInteger,
    imagFractionClear,
    imagFractionFaint,
    sign,
    hasImag: true
  };
};

function HighPrecisionCell({ value, isDiagonalZero = false }: { value: DecimalComplex, isDiagonalZero?: boolean }) {
  const [copied, setCopied] = useState(false);
  const parts = getDecimalComplexCellParts(value);

  const getFullCopyText = () => {
    const rPart = value.r.toFixed(25);
    const iAbsPart = value.i.abs().toFixed(25);
    if (value.i.abs().toNumber() < 1e-28) {
      return rPart;
    }
    const sign = value.i.gte(0) ? "+" : "-";
    return `${rPart} ${sign} ${iAbsPart}i`;
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(getFullCopyText());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isDiagonalZero) {
    return (
      <div className="h-12 w-[150px] flex items-center justify-center bg-[#F5F5F3] text-[9.5px] font-mono text-[#141414]/30 border border-[#141414]/5 rounded italic">
        0
      </div>
    );
  }

  return (
    <div 
      className="relative group/num flex items-center justify-center cursor-pointer font-mono select-none transition-all bg-[#F5F5F3] hover:bg-slate-100 border border-[#141414]/10 rounded h-12 w-[150px] text-center px-2"
      title="Click to copy 25-digit representation"
      onClick={handleCopy}
    >
      <span className="text-[10px] leading-tight whitespace-nowrap block truncate max-w-full">
        {/* Real Part with proportional border-b dashed */}
        <span className="border-b border-dashed border-[#141414]/30 pb-0.5 inline-block">
          <span className="font-bold text-[#141414]">
            {parts.realInteger}.{parts.realFractionClear}
          </span>

          {/* Imaginary Part */}
          {parts.hasImag && (
            <>
              <span className="font-bold text-indigo-600 px-[2px]">{parts.sign}</span>
              <span className="font-bold text-indigo-900">
                {parts.imagInteger}.{parts.imagFractionClear}
              </span>
              <span className="font-extrabold text-indigo-800 italic ml-[1px]">i</span>
            </>
          )}
        </span>
      </span>

      {/* Interactive, selectable hover tooltip with full 25-digit precision */}
      <div className="absolute bottom-[110%] left-1/2 transform -translate-x-1/2 mb-2 w-72 p-3 bg-[#141414] text-white rounded-lg shadow-xl pointer-events-auto opacity-0 group-hover/num:opacity-100 transition-opacity duration-150 z-50 text-[10px] text-left leading-relaxed font-mono hidden group-hover/num:block border border-white/20 select-text">
        <div className="border-b border-white/10 pb-1 mb-1.5 flex justify-between items-center text-indigo-400 font-extrabold uppercase tracking-wide text-[8px] pointer-events-none">
          <span>Full 25-Decimals Precision</span>
          <span className="text-[7.5px] text-white/50 lowercase bg-white/10 px-1 rounded">click cell to copy</span>
        </div>
        <div className="break-all text-neutral-200 space-y-1 select-text">
          <div className="hover:bg-white/5 p-1 rounded transition-colors select-text">
            <span className="text-emerald-400 font-bold select-none mr-1">Real:</span>
            <span className="font-mono select-all bg-black/40 px-1 py-0.5 rounded border border-white/5">{value.r.toFixed(25)}</span>
          </div>
          {parts.hasImag && (
            <div className="hover:bg-white/5 p-1 rounded transition-colors select-text">
              <span className="text-indigo-400 font-bold select-none mr-1">Imag:</span>
              <span className="font-mono select-all bg-black/40 px-1 py-0.5 rounded border border-white/5">{parts.sign} {value.i.abs().toFixed(25)}i</span>
            </div>
          )}
        </div>
      </div>

      {copied && (
        <span className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-[#141414] text-white text-[8px] px-1.5 py-0.5 rounded shadow pointer-events-none uppercase font-black tracking-wider z-20">
          Copied!
        </span>
      )}
    </div>
  );
}
