import * as math from 'mathjs';
import Decimal from 'decimal.js';
import { formatRoot } from './mathUtils';

export interface GeneralInequationResult {
  criticalPoints: { val: number, exactVal?: any, str: string }[];
  intervals: {
    startStr: string;
    endStr: string;
    isSolution: boolean;
  }[];
  finalSolution: string;
  error?: string;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b > 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

export function recognizeExact(val: number | Decimal): string {
  return formatRoot(val);
}

function checkDegree(expr: math.EvalFunction, xVal: number): number {
  try {
    const y1 = Math.abs(expr.evaluate({ x: xVal }));
    const y2 = Math.abs(expr.evaluate({ x: xVal * 2 }));
    if (typeof y1 !== 'number' || typeof y2 !== 'number' || isNaN(y1) || isNaN(y2) || y1 === 0) return 0;
    const ratio = y2 / y1;
    return Math.log2(ratio);
  } catch (e) {
    return 0;
  }
}

const mathBig = math.create(math.all, { number: 'BigNumber', precision: 30 });

function findRootsRobust(exprStr: string): any[] {
  const expr = math.compile(exprStr);
  const exprBig = mathBig.compile(exprStr);
  const roots: any[] = [];
  
  const searchIntervals = [
    { range: [-1000, 1000], step: 0.1 }
  ];
  
  for (const { range, step } of searchIntervals) {
    const N = Math.ceil((range[1] - range[0]) / step);
    
    let prevX = range[0];
    let prevY = NaN;
    try {
      const y = expr.evaluate({ x: prevX });
      if (typeof y === 'number' && !isNaN(y)) prevY = y;
    } catch (e) {}
    
    const h = 1e-6;
    const getDeriv = (x: number) => {
      try {
        const y1 = expr.evaluate({ x: x - h });
        const y2 = expr.evaluate({ x: x + h });
        if (typeof y1 !== 'number' || typeof y2 !== 'number' || isNaN(y1) || isNaN(y2)) return NaN;
        return (y2 - y1) / (2 * h);
      } catch (e) {
        return NaN;
      }
    };
    
    let prevDy = getDeriv(prevX);
    
    for (let i = 1; i <= N; i++) {
      const currX = range[0] + i * step;
      let currY = NaN;
      try {
        const y = expr.evaluate({ x: currX });
        if (typeof y === 'number' && !isNaN(y)) currY = y;
      } catch (e) {}
      
      // Check for crossing root
      if (!isNaN(prevY) && !isNaN(currY) && prevY * currY <= 0) {
        let a = prevX, b = currX;
        let yA = prevY;
        for (let iter = 0; iter < 60; iter++) {
          const mid = (a + b) / 2;
          try {
            const yMid = expr.evaluate({ x: mid });
            if (typeof yMid !== 'number' || isNaN(yMid)) break;
            if (yA * yMid <= 0) {
              b = mid;
            } else {
              a = mid; yA = yMid;
            }
          } catch (e) { break; }
        }
        const rootX = (a + b) / 2;
        try {
          const rootY = expr.evaluate({ x: rootX });
          if (typeof rootY === 'number' && !isNaN(rootY) && Math.abs(rootY) < 1e-2) {
            // Refine with Decimal
            let refined = new Decimal(rootX);
            const hBig = new Decimal('1e-15');
            for (let iter = 0; iter < 20; iter++) {
              try {
                const yBig = exprBig.evaluate({ x: mathBig.bignumber(refined.toString()) });
                const yPlus = exprBig.evaluate({ x: mathBig.bignumber(refined.plus(hBig).toString()) });
                const dyBig = yPlus.minus(yBig).div(hBig);
                if (dyBig.abs().lt(1e-25)) break;
                const delta = yBig.div(dyBig);
                refined = refined.minus(new Decimal(delta.toString()));
                if (delta.abs().lt(1e-25)) break;
              } catch (e) { break; }
            }
            roots.push(refined);
          }
        } catch (e) {}
      }
      
      // Check for extremum (touching root or corner)
      let currDy = getDeriv(currX);
      if (!isNaN(prevDy) && !isNaN(currDy) && prevDy * currDy <= 0) {
        let a = prevX, b = currX;
        let dyA = prevDy;
        for (let iter = 0; iter < 60; iter++) {
          const mid = (a + b) / 2;
          const dyMid = getDeriv(mid);
          if (isNaN(dyMid)) break;
          if (dyA * dyMid <= 0) {
            b = mid;
          } else {
            a = mid; dyA = dyMid;
          }
        }
        const extremumX = (a + b) / 2;
        try {
          const extremumY = expr.evaluate({ x: extremumX });
          if (typeof extremumY === 'number' && !isNaN(extremumY) && Math.abs(extremumY) < 1e-7) {
            // Refine with Decimal
            let refined = new Decimal(extremumX);
            const hBig = new Decimal('1e-15');
            for (let iter = 0; iter < 20; iter++) {
              try {
                const yBig = exprBig.evaluate({ x: mathBig.bignumber(refined.toString()) });
                const yPlus = exprBig.evaluate({ x: mathBig.bignumber(refined.plus(hBig).toString()) });
                const dyBig = yPlus.minus(yBig).div(hBig);
                if (dyBig.abs().lt(1e-25)) break;
                const delta = yBig.div(dyBig);
                refined = refined.minus(new Decimal(delta.toString()));
                if (delta.abs().lt(1e-25)) break;
              } catch (e) { break; }
            }
            roots.push(refined);
          }
        } catch (e) {}
      }
      
      prevX = currX;
      prevY = currY;
      prevDy = currDy;
    }
  }
  
  roots.sort((a: any, b: any) => {
    const aVal = typeof a === 'number' ? a : a.toNumber();
    const bVal = typeof b === 'number' ? b : b.toNumber();
    return aVal - bVal;
  });
  const uniqueRoots: any[] = [];
  for (const r of roots) {
    const rVal = typeof r === 'number' ? r : r.toNumber();
    if (uniqueRoots.length === 0) {
      uniqueRoots.push(r);
    } else {
      const last = uniqueRoots[uniqueRoots.length - 1];
      const lastVal = typeof last === 'number' ? last : last.toNumber();
      if (Math.abs(rVal - lastVal) > 1e-6) {
        uniqueRoots.push(r);
      }
    }
  }
  
  return uniqueRoots;
}

export function solveGeneralInequality(inputStr: string): GeneralInequationResult {
  const match = inputStr.match(/^(.*?)(<=|>=|<|>)(.*?)$/);
  if (!match) {
    throw new Error("Invalid inequality format. Must contain <, >, <=, or >=");
  }
  
  const lhsStr = match[1].trim();
  const sign = match[2].trim();
  const rhsStr = match[3].trim() || "0";
  
  let processedStr = `${lhsStr} - (${rhsStr})`;
  
  let resultStr = "";
  let absDepth = 0;
  for (let i = 0; i < processedStr.length; i++) {
    if (processedStr[i] === '|') {
      if (absDepth === 0) {
        resultStr += "abs(";
        absDepth++;
      } else {
        resultStr += ")";
        absDepth--;
      }
    } else {
      resultStr += processedStr[i];
    }
  }
  if (absDepth !== 0) {
    throw new Error("Unmatched absolute value pipes '|'");
  }
  
  const node = math.parse(resultStr);
  const compiled = node.compile();
  
  const deg1 = checkDegree(compiled, 1000);
  const deg2 = checkDegree(compiled, -1000);
  if (deg1 > 5.2 || deg2 > 5.2) {
    throw new Error("Bạn hãy tự giải tay để đưa về dạng trị tuyệt đối có bậc thấp hơn");
  }
  
  const subExprs: math.MathNode[] = [node];
  node.traverse((n: any) => {
    if (n.isFunctionNode && (n.fn.name === 'abs' || n.fn.name === 'sqrt')) {
      subExprs.push(n.args[0]);
    }
    if (n.isOperatorNode && n.op === '/') {
      subExprs.push(n.args[1]);
    }
  });
  
  const allRoots: any[] = [];
  for (const exprNode of subExprs) {
    const exprStr = exprNode.toString();
    const roots = findRootsRobust(exprStr);
    for (const r of roots) {
      allRoots.push(r);
    }
  }
  
  const sortedRoots = allRoots.sort((a: any, b: any) => {
    const aVal = typeof a === 'number' ? a : a.toNumber();
    const bVal = typeof b === 'number' ? b : b.toNumber();
    return aVal - bVal;
  });
  const uniqueRoots: any[] = [];
  for (const r of sortedRoots) {
    const rVal = typeof r === 'number' ? r : r.toNumber();
    if (uniqueRoots.length === 0) {
      uniqueRoots.push(r);
    } else {
      const last = uniqueRoots[uniqueRoots.length - 1];
      const lastVal = typeof last === 'number' ? last : last.toNumber();
      if (Math.abs(rVal - lastVal) > 1e-6) {
        uniqueRoots.push(r);
      }
    }
  }
  
  const criticalPoints = uniqueRoots.map(r => ({
    val: typeof r === 'number' ? r : r.toNumber(),
    exactVal: r,
    str: recognizeExact(r)
  }));
  
  const intervals = [];
  const validIntervals: {start: number, end: number, startStr: string, endStr: string}[] = [];
  const validPoints: number[] = [];
  
  const evaluateCondition = (x: number) => {
    try {
      let val = compiled.evaluate({ x });
      if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) return false;
      if (Math.abs(val) < 1e-9) val = 0;
      if (sign === '<') return val < 0;
      if (sign === '<=') return val <= 0;
      if (sign === '>') return val > 0;
      if (sign === '>=') return val >= 0;
      return false;
    } catch (e) {
      return false;
    }
  };
  
  for (let i = 0; i <= criticalPoints.length; i++) {
    const start = i === 0 ? -Infinity : criticalPoints[i - 1].val;
    const end = i === criticalPoints.length ? Infinity : criticalPoints[i].val;
    const startStr = i === 0 ? "-∞" : criticalPoints[i - 1].str;
    const endStr = i === criticalPoints.length ? "∞" : criticalPoints[i].str;
    
    let mid = 0;
    if (start === -Infinity && end === Infinity) mid = 0;
    else if (start === -Infinity) mid = end - 10;
    else if (end === Infinity) mid = start + 10;
    else mid = (start + end) / 2;
    
    const isSolution = evaluateCondition(mid);
    intervals.push({ startStr, endStr, isSolution });
    
    if (isSolution) {
      validIntervals.push({ start, end, startStr, endStr });
    }
  }
  
  for (const cp of criticalPoints) {
    if (evaluateCondition(cp.val)) {
      validPoints.push(cp.val);
    }
  }
  
  const exactMap = new Map<number, string>();
  for (const cp of criticalPoints) {
    exactMap.set(Math.round(cp.val * 1e9) / 1e9, cp.str);
  }
  
  const formatExact = (val: number) => {
    const rounded = Math.round(val * 1e9) / 1e9;
    return exactMap.get(rounded) || Number(val.toFixed(5)).toString();
  };
  
  let finalSolution = "";
  if (validIntervals.length === 0 && validPoints.length === 0) {
    finalSolution = "∅";
  } else if (validIntervals.length === 1 && validIntervals[0].start === -Infinity && validIntervals[0].end === Infinity) {
    finalSolution = "ℝ";
  } else {
    const combined: string[] = [];
    
    const allBoundaryPoints = new Set<number>();
    for (const v of validIntervals) {
      if (v.start !== -Infinity) allBoundaryPoints.add(Math.round(v.start * 1e9) / 1e9);
      if (v.end !== Infinity) allBoundaryPoints.add(Math.round(v.end * 1e9) / 1e9);
    }
    for (const p of validPoints) {
      if (p !== -Infinity && p !== Infinity) allBoundaryPoints.add(Math.round(p * 1e9) / 1e9);
    }
    const sortedBoundaries = Array.from(allBoundaryPoints).sort((a, b) => a - b);
    
    let currentStart = -Infinity;
    let currentStartStr = "-∞";
    let inInterval = false;
    
    if (sortedBoundaries.length > 0) {
      const firstPt = sortedBoundaries[0];
      const isFirstIntervalValid = validIntervals.some(v => v.start === -Infinity && v.end >= firstPt - 1e-7);
      if (isFirstIntervalValid) {
        inInterval = true;
      }
    } else {
      // No boundaries, but we already handled the R and empty cases
    }
    
    for (let i = 0; i < sortedBoundaries.length; i++) {
      const pt = sortedBoundaries[i];
      const ptStr = formatExact(pt);
      
      const nextPt = i < sortedBoundaries.length - 1 ? sortedBoundaries[i + 1] : Infinity;
      const mid = pt === -Infinity ? nextPt - 10 : (nextPt === Infinity ? pt + 10 : (pt + nextPt) / 2);
      
      const isPtValid = validPoints.some(p => Math.abs(p - pt) < 1e-7);
      const isNextIntervalValid = validIntervals.some(v => v.start <= pt + 1e-7 && v.end >= nextPt - 1e-7);
      
      if (!inInterval) {
        if (isPtValid && isNextIntervalValid) {
          inInterval = true;
          currentStart = pt;
          currentStartStr = ptStr;
        } else if (isPtValid && !isNextIntervalValid) {
          combined.push(`{${ptStr}}`);
        } else if (!isPtValid && isNextIntervalValid) {
          inInterval = true;
          currentStart = pt;
          currentStartStr = ptStr;
        }
      } else {
        if (isPtValid && isNextIntervalValid) {
          // continue
        } else if (isPtValid && !isNextIntervalValid) {
          inInterval = false;
          const startBracket = currentStart === -Infinity ? '(' : (validPoints.some(p => Math.abs(p - currentStart) < 1e-7) ? '[' : '(');
          combined.push(`${startBracket}${currentStartStr}, ${ptStr}]`);
        } else if (!isPtValid && isNextIntervalValid) {
          // This means the point is invalid, but the interval before and after are valid.
          // This splits the interval.
          const startBracket = currentStart === -Infinity ? '(' : (validPoints.some(p => Math.abs(p - currentStart) < 1e-7) ? '[' : '(');
          combined.push(`${startBracket}${currentStartStr}, ${ptStr})`);
          inInterval = true;
          currentStart = pt;
          currentStartStr = ptStr;
        } else if (!isPtValid && !isNextIntervalValid) {
          inInterval = false;
          const startBracket = currentStart === -Infinity ? '(' : (validPoints.some(p => Math.abs(p - currentStart) < 1e-7) ? '[' : '(');
          combined.push(`${startBracket}${currentStartStr}, ${ptStr})`);
        }
      }
    }
    
    if (inInterval) {
      combined.push(`${currentStart === -Infinity ? '(' : (validPoints.some(p => Math.abs(p - currentStart) < 1e-7) ? '[' : '(')}${currentStartStr}, ∞)`);
    }
    
    finalSolution = combined.join(" ∪ ");
  }
  
  return {
    criticalPoints,
    intervals,
    finalSolution
  };
}
