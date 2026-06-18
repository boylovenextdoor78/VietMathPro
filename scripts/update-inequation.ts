import * as fs from 'fs';

let content = fs.readFileSync('src/lib/mathUtils.ts', 'utf-8');

// 1. Update formatRoot signature and logic
const oldFormatRoot = `export function formatRoot(val: number): string {
  const identified = identifyCanonical(val);
  if (identified) return identified;
  // Increase precision to 10 decimal places for non-canonical roots
  return val.toFixed(10).replace(/\\.?0+$/, "");
}`;

const newFormatRoot = `export function formatRoot(val: number | Decimal): string {
  const numVal = typeof val === 'number' ? val : val.toNumber();
  const identified = identifyCanonical(numVal);
  if (identified) return identified;
  
  if (typeof val !== 'number') {
    return val.toFixed(7).replace(/\\.?0+$/, "");
  }
  
  return val.toFixed(7).replace(/\\.?0+$/, "");
}`;

content = content.replace(oldFormatRoot, newFormatRoot);

// 2. Update solvePolynomialInequation to use Decimal for Newton refinement
const oldNewton = `    // Newton refinement for real root
    let refined = candidate;
    let f = 0;
    for (let i = 0; i < 40; i++) {
      f = 0;
      let df = 0;
      for (let j = 0; j <= degree; j++) {
        const term = Math.pow(refined, degree - j);
        f += actualCoeffs[j] * term;
        if (degree - j > 0) {
          df += (degree - j) * actualCoeffs[j] * Math.pow(refined, degree - j - 1);
        }
      }
      if (Math.abs(df) < 1e-18) break;
      const delta = f / df;
      refined -= delta;
      if (Math.abs(delta) < 1e-18) break;
    }
    
    // For multiple roots, f might not reach 1e-7 easily, but should be small.
    // Also consider roots with small imaginary parts as real candidates.
    if (Math.abs(f) < 1e-4 || imPart < 1e-3) {
      roots.push(refined);
    }`;

const newNewton = `    // Newton refinement for real root using Decimal for 25-digit precision
    Decimal.set({ precision: 30 });
    let refined = new Decimal(candidate);
    let fBig = new Decimal(0);
    for (let i = 0; i < 40; i++) {
      fBig = new Decimal(0);
      let dfBig = new Decimal(0);
      for (let j = 0; j <= degree; j++) {
        const term = refined.pow(degree - j);
        fBig = fBig.plus(term.times(actualCoeffs[j]));
        if (degree - j > 0) {
          dfBig = dfBig.plus(refined.pow(degree - j - 1).times(actualCoeffs[j]).times(degree - j));
        }
      }
      if (dfBig.abs().lt(1e-25)) break;
      const delta = fBig.dividedBy(dfBig);
      refined = refined.minus(delta);
      if (delta.abs().lt(1e-25)) break;
    }
    
    if (fBig.abs().lt(1e-4) || imPart < 1e-3) {
      roots.push(refined as any);
    }`;

content = content.replace(oldNewton, newNewton);

// 3. Update roots sorting and duplicate removal
const oldSort = `  roots.sort((a, b) => a - b);
  
  // Remove duplicates with a tolerance suitable for multiple roots
  const uniqueRoots: number[] = [];
  if (roots.length > 0) {
    uniqueRoots.push(roots[0]);
    for (let i = 1; i < roots.length; i++) {
      if (Math.abs(roots[i] - roots[i-1]) > 1e-3) {
        uniqueRoots.push(roots[i]);
      }
    }
  }`;

const newSort = `  roots.sort((a: any, b: any) => a.minus(b).toNumber());
  
  // Remove duplicates with a tolerance suitable for multiple roots
  const uniqueRoots: any[] = [];
  if (roots.length > 0) {
    uniqueRoots.push(roots[0]);
    for (let i = 1; i < roots.length; i++) {
      if (roots[i].minus(roots[i-1]).abs().toNumber() > 1e-3) {
        uniqueRoots.push(roots[i]);
      }
    }
  }`;

content = content.replace(oldSort, newSort);

// 4. Update check function
const oldCheck = `  const check = (x: number) => {
    const val = evalPoly(x);
    const eps = 1e-12;
    if (sign === ">") return val > eps;
    if (sign === ">=") return val > -eps;
    if (sign === "<") return val < -eps;
    if (sign === "<=") return val < eps;
    return false;
  };`;

const newCheck = `  const check = (x: any) => {
    let val = new Decimal(0);
    const xBig = new Decimal(x);
    for (let i = 0; i <= degree; i++) {
      val = val.plus(xBig.pow(degree - i).times(actualCoeffs[i]));
    }
    const eps = new Decimal('1e-12');
    if (sign === ">") return val.gt(eps);
    if (sign === ">=") return val.gt(eps.negated());
    if (sign === "<") return val.lt(eps.negated());
    if (sign === "<=") return val.lt(eps);
    return false;
  };`;

content = content.replace(oldCheck, newCheck);

// 5. Update testPoints generation
const oldTestPoints = `  if (uniqueRoots.length === 0) {
    testPoints.push(0);
  } else {
    testPoints.push(uniqueRoots[0] - 1);
    for (let i = 0; i < uniqueRoots.length - 1; i++) {
      testPoints.push((uniqueRoots[i] + uniqueRoots[i+1]) / 2);
    }
    testPoints.push(uniqueRoots[uniqueRoots.length - 1] + 1);
  }`;

const newTestPoints = `  if (uniqueRoots.length === 0) {
    testPoints.push(0);
  } else {
    testPoints.push(uniqueRoots[0].minus(1));
    for (let i = 0; i < uniqueRoots.length - 1; i++) {
      testPoints.push(uniqueRoots[i].plus(uniqueRoots[i+1]).dividedBy(2));
    }
    testPoints.push(uniqueRoots[uniqueRoots.length - 1].plus(1));
  }`;

content = content.replace(oldTestPoints, newTestPoints);

// 6. Update merged intervals checking
const oldMerged = `        if (Math.abs(current.end - next.start) < 1e-10) {`;
const newMerged = `        const currentEnd = typeof current.end === 'number' ? current.end : current.end.toNumber();
        const nextStart = typeof next.start === 'number' ? next.start : next.start.toNumber();
        if (Math.abs(currentEnd - nextStart) < 1e-10) {`;

content = content.replace(oldMerged, newMerged);

const oldMerged2 = `      if (merged.length === 2 && merged[0].start === -Infinity && merged[1].end === Infinity && Math.abs(merged[0].end - merged[1].start) < 1e-10) {`;
const newMerged2 = `      const m0End = typeof merged[0].end === 'number' ? merged[0].end : merged[0].end.toNumber();
      const m1Start = typeof merged[1].start === 'number' ? merged[1].start : merged[1].start.toNumber();
      if (merged.length === 2 && merged[0].start === -Infinity && merged[1].end === Infinity && Math.abs(m0End - m1Start) < 1e-10) {`;

content = content.replace(oldMerged2, newMerged2);

// 7. Update satisfyingRoots
const oldSatisfying = `const satisfyingRoots = isClosed ? uniqueRoots.filter(r => Math.abs(evalPoly(r)) < 1e-9) : [];`;
const newSatisfying = `const satisfyingRoots = isClosed ? uniqueRoots.filter(r => {
        let val = new Decimal(0);
        for (let i = 0; i <= degree; i++) {
          val = val.plus(r.pow(degree - i).times(actualCoeffs[i]));
        }
        return val.abs().lt(1e-9);
      }) : [];`;

content = content.replace(oldSatisfying, newSatisfying);

fs.writeFileSync('src/lib/mathUtils.ts', content);
