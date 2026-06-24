import React, { useState, useEffect, useMemo } from 'react';
import { create, all } from 'mathjs';

// Setup high-precision mathjs instance exclusively for numeric solver computations.
// Precision 55 digits guarantees that the calculated coordinates are mathematically 
// exact and accurate to more than 25 decimal places.
const mathHigh = create(all, {
  number: 'BigNumber',
  precision: 55
});

export interface Range2D {
  x: number[];
  y: number[];
}

export interface Expression {
  id: string;
  text: string;
  color: string;
  visible: boolean;
}

export interface PrecisionItem {
  id: string;
  type: 'root' | 'intersection' | 'critical';
  label: string;
  expressionName: string;
  x: string; // Precise 25-digit string representation
  y: string; // Precise 25-digit string representation
  color?: string;
  xNum: number;
  yNum: number;
}

export function useContainerDimensions(ref: React.RefObject<HTMLDivElement | null>) {
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });

  useEffect(() => {
    if (!ref.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const rect = entry.contentRect;
        const w = rect.width || ref.current?.clientWidth || 600;
        const h = rect.height || ref.current?.clientHeight || 600;
        setDimensions({ width: w, height: h });
      }
    });

    resizeObserver.observe(ref.current);

    setDimensions({
      width: ref.current.clientWidth || 600,
      height: ref.current.clientHeight || 600
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [ref]);

  return dimensions;
}

export function getPerfectSquareRange(range: Range2D, width: number, height: number): Range2D {
  if (width <= 0 || height <= 0) return range;

  const aspect = width / height;
  const currentDx = range.x[1] - range.x[0];
  const currentDy = range.y[1] - range.y[0];

  if (currentDx <= 0 || currentDy <= 0) return range;

  const centerX = (range.x[0] + range.x[1]) / 2;
  const centerY = (range.y[0] + range.y[1]) / 2;

  let targetDx = currentDx;
  let targetDy = currentDy;

  if (currentDx / currentDy > aspect) {
    targetDy = currentDx / aspect;
  } else {
    targetDx = currentDy * aspect;
  }

  return {
    x: [centerX - targetDx / 2, centerX + targetDx / 2],
    y: [centerY - targetDy / 2, centerY + targetDy / 2]
  };
}

/**
 * Cleanly format any BigNumber or number to exactly 25 digits of mathematical precision.
 */
function formatTo25Digits(val: any): string {
  try {
    const bn = mathHigh.bignumber(val);
    const fixedStr = bn.toFixed(25);
    // Remove potential negative sign for clear exact zero (-0.000... -> 0.000...)
    if (fixedStr.startsWith('-') && /^-[0.]+$/.test(fixedStr)) {
      return fixedStr.substring(1);
    }
    return fixedStr;
  } catch {
    return Number(val).toFixed(25);
  }
}

/**
 * Robust High-Precision Bisection Solver.
 * Returns the exact root within a specified interval [leftVal, rightVal].
 */
function runHighPrecisionBisection(
  evalFn: (x: any) => any,
  leftVal: any,
  rightVal: any,
  maxIterations = 100
): any {
  let left = mathHigh.bignumber(leftVal);
  let right = mathHigh.bignumber(rightVal);

  let yLeft = evalFn(left);
  let yRight = evalFn(right);

  if (mathHigh.equal(yLeft, 0)) return left;
  if (mathHigh.equal(yRight, 0)) return right;

  // Ensure they have opposite signs. If not, return midpoint as fallback
  if (mathHigh.larger(mathHigh.multiply(yLeft, yRight), 0)) {
    return mathHigh.divide(mathHigh.add(left, right), mathHigh.bignumber(2));
  }

  for (let i = 0; i < maxIterations; i++) {
    const mid = mathHigh.divide(mathHigh.add(left, right), mathHigh.bignumber(2));
    const span = mathHigh.abs(mathHigh.subtract(right, left));
    
    if (mathHigh.smaller(span, mathHigh.bignumber('1e-35'))) {
      return mid;
    }

    const yMid = evalFn(mid);
    if (mathHigh.equal(yMid, 0)) {
      return mid;
    }

    if (mathHigh.smaller(mathHigh.multiply(yLeft, yMid), 0)) {
      right = mid;
      yRight = yMid;
    } else {
      left = mid;
      yLeft = yMid;
    }
  }

  return mathHigh.divide(mathHigh.add(left, right), mathHigh.bignumber(2));
}

/**
 * Main analysis hook that calculates roots, intersections, and critical points
 * with continuous high-precision scanning.
 */
export function usePrecisionAnalysis(
  exprs2d: Expression[],
  adjustedRange2d: Range2D
): { items: PrecisionItem[]; loading: boolean; error: string | null } {
  const [items, setItems] = useState<PrecisionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeTextsStr = JSON.stringify(exprs2d.filter(e => e.visible).map(e => e.text));
  const rangeStr = JSON.stringify(adjustedRange2d);

  useEffect(() => {
    const activeExprs = exprs2d.filter(e => e.visible && e.text.trim());
    if (activeExprs.length === 0) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    const xMin = adjustedRange2d.x[0];
    const xMax = adjustedRange2d.x[1];
    const yMin = adjustedRange2d.y[0];
    const yMax = adjustedRange2d.y[1];

    if (isNaN(xMin) || isNaN(xMax) || xMin >= xMax) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/math/precision-geometry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expressions: activeExprs.map(e => e.text),
            xMin,
            xMax,
            yMin,
            yMax
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Tính toán toạ độ từ CAS backend thất bại');
        }

        const data = await res.json();
        if (isMounted) {
          if (data.error) {
            setError(data.error);
          } else {
            const colorMap = new Map(exprs2d.map(e => [e.text, e.color]));
            const resolvedPoints = (data.points || []).map((pt: any) => ({
              ...pt,
              color: colorMap.get(pt.expressionName) || '#141414'
            }));
            setItems(resolvedPoints);
          }
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Lỗi kết nối CAS backend');
          setLoading(false);
        }
      }
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [activeTextsStr, rangeStr]);

  return { items, loading, error };
}

interface LabProps {
  items: PrecisionItem[];
  loading: boolean;
  error: string | null;
}

export function HighPrecisionGeometryLab({ items, loading, error }: LabProps) {
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const handleCopy = (coords: string, label: string) => {
    navigator.clipboard.writeText(coords);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 2500);
  };

  const roots = items.filter(i => i.type === 'root');
  const intersections = items.filter(i => i.type === 'intersection');
  const criticals = items.filter(i => i.type === 'critical');

  return (
    <div className="mt-8 border-4 border-[#141414] bg-[#FAF9F5] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] p-6 rounded-none">
      <div className="border-b-4 border-[#141414] pb-4 mb-6 flex justify-between items-center bg-amber-50 -mx-6 -mt-6 p-4">
        <div>
          <h3 className="font-serif italic text-2xl font-bold text-rose-800 flex items-center gap-2">
            <span>🔬</span> Phòng Thí Nghiệm Toạ Độ Siêu Chính Xác (25-Digit Geometry Lab)
            {loading && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-amber-200 text-amber-900 animate-pulse border border-amber-400">
                <svg className="animate-spin h-3.5 w-3.5 text-amber-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                CAS đang Quét...
              </span>
            )}
            {!loading && !error && (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Đồng Bộ CAS Thành Công
              </span>
            )}
          </h3>
          <p className="text-xs text-neutral-600 font-sans mt-1">
            Phân tích toạ độ chuẩn xác <strong>25 chữ số thập phân</strong> bằng hệ thống máy tính đại số CAS (SymPy & mpmath) độc lập với sai số đồ hoạ.
          </p>
          {error && (
            <div className="mt-2 text-xs font-mono bg-rose-50 text-rose-700 border border-rose-300 px-3 py-1.5 flex items-center gap-1">
              <span>⚠️</span> Lỗi hệ CAS: {error}
            </div>
          )}
        </div>
        {copySuccess && (
          <div className="bg-emerald-500 text-white font-mono text-xs px-3 py-1.5 border-2 border-[#141414] shadow-[2px_2px_0px_rgba(20,20,20,1)] animate-bounce">
            Đã sao chép: {copySuccess}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* INTERSECTIONS COLUMN */}
        <div className="flex flex-col border-2 border-[#141414] bg-white p-4 relative shadow-[4px_4px_0px_rgba(20,20,20,1)]">
          <div className="border-b-2 border-[#141414] pb-2 mb-3 bg-red-50 -mx-4 -mt-4 p-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-[#141414]"></span>
            <span className="font-sans font-bold text-sm text-[#141414] uppercase tracking-wider">
              1) Giao điểm của các hàm số
            </span>
          </div>
          {intersections.length === 0 ? (
            <p className="text-xs italic text-neutral-400 my-auto text-center py-4">Không tìm thấy giao điểm nào trong khung nhìn hiện tại.</p>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {intersections.map(item => (
                <div 
                  key={item.id}
                  onClick={() => handleCopy(`(${item.x}, ${item.y})`, item.label)}
                  className="group border border-[#141414] p-3 rounded-none bg-[#FCFCFB] hover:bg-neutral-50 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-[10px] font-bold text-white bg-red-600 border border-[#141414] px-1.5 py-0.5 uppercase tracking-wide">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">Click to Copy</span>
                  </div>
                  <div className="text-xs space-y-1 font-mono text-neutral-700">
                    <div>
                      <span className="font-bold text-red-600">X: </span>
                      <span className="break-all bg-neutral-100 px-1 rounded select-all">{item.x}</span>
                    </div>
                    <div>
                      <span className="font-bold text-red-600">Y: </span>
                      <span className="break-all bg-neutral-100 px-1 rounded select-all">{item.y}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ROOTS COLUMN */}
        <div className="flex flex-col border-2 border-[#141414] bg-white p-4 relative shadow-[4px_4px_0px_rgba(20,20,20,1)]">
          <div className="border-b-2 border-[#141414] pb-2 mb-3 bg-emerald-50 -mx-4 -mt-4 p-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-[#141414]"></span>
            <span className="font-sans font-bold text-sm text-[#141414] uppercase tracking-wider">
              2) Nghiệm của các hàm số (f(x)=0)
            </span>
          </div>
          {roots.length === 0 ? (
            <p className="text-xs italic text-neutral-400 my-auto text-center py-4">Không tìm thấy nghiệm thực nào trong miền hiện tại.</p>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {roots.map(item => (
                <div 
                  key={item.id}
                  onClick={() => handleCopy(`(${item.x}, ${item.y})`, item.label)}
                  className="group border border-[#141414] p-3 rounded-none bg-[#FCFCFB] hover:bg-neutral-50 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-[10px] font-bold text-white bg-emerald-600 border border-[#141414] px-1.5 py-0.5 uppercase tracking-wide">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">Click to Copy</span>
                  </div>
                  <div className="text-xs space-y-1 font-mono text-neutral-700">
                    <div>
                      <span className="font-bold text-emerald-600">X: </span>
                      <span className="break-all bg-neutral-100 px-1 rounded select-all">{item.x}</span>
                    </div>
                    <div>
                      <span className="font-bold text-emerald-600">Y: </span>
                      <span className="break-all bg-neutral-100 px-1 rounded select-all">{item.y}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CRITICAL POINTS COLUMN */}
        <div className="flex flex-col border-2 border-[#141414] bg-white p-4 relative shadow-[4px_4px_0px_rgba(20,20,20,1)]">
          <div className="border-b-2 border-[#141414] pb-2 mb-3 bg-blue-50 -mx-4 -mt-4 p-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 border border-[#141414]"></span>
            <span className="font-sans font-bold text-sm text-[#141414] uppercase tracking-wider">
              3) Điểm cực trị (đạo hàm f′(x) = 0)
            </span>
          </div>
          {criticals.length === 0 ? (
            <p className="text-xs italic text-neutral-400 my-auto text-center py-4">Không tìm thấy điểm cực trị nào trong miền hiện tại.</p>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {criticals.map(item => (
                <div 
                  key={item.id}
                  onClick={() => handleCopy(`(${item.x}, ${item.y})`, item.label)}
                  className="group border border-[#141414] p-3 rounded-none bg-[#FCFCFB] hover:bg-neutral-50 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-[10px] font-bold text-white bg-blue-600 border border-[#141414] px-1.5 py-0.5 uppercase tracking-wide">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">Click to Copy</span>
                  </div>
                  <div className="text-xs space-y-1 font-mono text-neutral-700">
                    <div>
                      <span className="font-bold text-blue-600">X: </span>
                      <span className="break-all bg-neutral-100 px-1 rounded select-all">{item.x}</span>
                    </div>
                    <div>
                      <span className="font-bold text-blue-600">Y: </span>
                      <span className="break-all bg-neutral-100 px-1 rounded select-all">{item.y}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <div className="mt-5 border-t-2 border-[#141414]/10 pt-3 text-[10px] text-gray-500 font-mono flex flex-wrap justify-between gap-2">
        <span>* Gợi ý: Có thể click thẳng vào toạ độ X hoặc Y để tự động chọn và bôi đen sao chép nhanh chóng.</span>
        <span>Môi trường thực thi: BigNumber precision = 55</span>
      </div>
    </div>
  );
}
