import * as fs from 'fs';

let content = fs.readFileSync('src/lib/generalInequation.ts', 'utf-8');

// 1. Import Decimal
if (!content.includes("import Decimal from 'decimal.js';")) {
  content = content.replace("import * as math from 'mathjs';", "import * as math from 'mathjs';\nimport Decimal from 'decimal.js';");
}

// 2. Update recognizeExact to use formatRoot from mathUtils
if (!content.includes("import { formatRoot } from './mathUtils';")) {
  content = content.replace("import Decimal from 'decimal.js';", "import Decimal from 'decimal.js';\nimport { formatRoot } from './mathUtils';");
}

const oldRecognizeExact = `export function recognizeExact(val: number): string {
  if (Math.abs(Math.round(val) - val) < 1e-9) {
    return Math.round(val).toString();
  }
  
  // Try rational p/q
  for (let q = 1; q <= 1000; q++) {
    const p = Math.round(val * q);
    if (Math.abs(val * q - p) < 1e-9) {
      return \`\${p}/\${q}\`;
    }
  }
  
  // Try quadratic surd (p + sign * sqrt(q)) / r
  for (let r = 1; r <= 100; r++) {
    for (let p = -1000; p <= 1000; p++) {
      const sqrtTerm = val * r - p;
      const q = sqrtTerm * sqrtTerm;
      const roundQ = Math.round(q);
      if (Math.abs(q - roundQ) < 1e-8 && roundQ > 0) {
        const sign = sqrtTerm >= 0 ? "+" : "-";
        
        let outside = 1;
        let inside = roundQ;
        for (let i = 2; i * i <= inside; i++) {
          while (inside % (i * i) === 0) {
            outside *= i;
            inside /= (i * i);
          }
        }
        
        if (inside === 1) continue;
        
        const g = Math.abs(gcd(gcd(Math.abs(p), outside), Math.abs(r)));
        let p1 = p / g;
        let out1 = outside / g;
        let r1 = r / g;
        
        if (r1 < 0) {
          p1 = -p1;
          r1 = -r1;
        }
        
        let rad = out1 === 1 ? \`√\${inside}\` : \`\${out1}√\${inside}\`;
        
        let numStr = "";
        if (p1 === 0) {
          numStr = sign === "-" ? \`-\${rad}\` : rad;
        } else {
          if (sign === "+") {
            if (p1 < 0) numStr = \`\${rad} - \${Math.abs(p1)}\`;
            else numStr = \`\${p1} + \${rad}\`;
          } else {
            numStr = \`\${p1} - \${rad}\`;
          }
        }
        
        if (r1 === 1) return numStr;
        if (r1 === -1) return \`-(\${numStr})\`;
        return \`(\${numStr})/\${r1}\`;
      }
    }
  }
  
  return Number(val.toFixed(5)).toString();
}`;

const newRecognizeExact = `export function recognizeExact(val: number | Decimal): string {
  return formatRoot(val);
}`;

content = content.replace(oldRecognizeExact, newRecognizeExact);

// 3. Update findRootsRobust to refine roots with Decimal
const oldFindRootsRobust = `function findRootsRobust(expr: math.EvalFunction): number[] {`;
const newFindRootsRobust = `const mathBig = math.create(math.all, { number: 'BigNumber', precision: 30 });

function findRootsRobust(exprStr: string): any[] {
  const expr = math.compile(exprStr);
  const exprBig = mathBig.compile(exprStr);`;

content = content.replace(oldFindRootsRobust, newFindRootsRobust);

// 4. Update the return type of findRootsRobust and the array
content = content.replace(`const roots: number[] = [];`, `const roots: any[] = [];`);

// 5. Add refinement loop inside findRootsRobust
const oldRootPush1 = `        try {
          const rootY = expr.evaluate({ x: rootX });
          if (typeof rootY === 'number' && !isNaN(rootY) && Math.abs(rootY) < 1e-2) {
            roots.push(rootX);
          }
        } catch (e) {}`;

const newRootPush1 = `        try {
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
        } catch (e) {}`;

content = content.replace(oldRootPush1, newRootPush1);

const oldRootPush2 = `        try {
          const extremumY = expr.evaluate({ x: extremumX });
          if (typeof extremumY === 'number' && !isNaN(extremumY) && Math.abs(extremumY) < 1e-7) {
            roots.push(extremumX);
          }
        } catch (e) {}`;

const newRootPush2 = `        try {
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
        } catch (e) {}`;

content = content.replace(oldRootPush2, newRootPush2);

// 6. Update uniqueRoots logic
const oldUniqueRoots = `  roots.sort((a, b) => a - b);
  const uniqueRoots: number[] = [];
  for (const r of roots) {
    if (uniqueRoots.length === 0 || Math.abs(r - uniqueRoots[uniqueRoots.length - 1]) > 1e-6) {
      uniqueRoots.push(r);
    }
  }
  
  return uniqueRoots;`;

const newUniqueRoots = `  roots.sort((a: any, b: any) => {
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
  
  return uniqueRoots;`;

content = content.replace(oldUniqueRoots, newUniqueRoots);

// 7. Update solveGeneralInequality to pass exprStr to findRootsRobust
const oldFindRootsCall = `  for (const exprNode of subExprs) {
    const exprCompiled = exprNode.compile();
    const roots = findRootsRobust(exprCompiled);`;

const newFindRootsCall = `  for (const exprNode of subExprs) {
    const exprStr = exprNode.toString();
    const roots = findRootsRobust(exprStr);`;

content = content.replace(oldFindRootsCall, newFindRootsCall);

// 8. Update allRoots Set to Array
const oldAllRoots = `  const allRoots = new Set<number>();
  for (const exprNode of subExprs) {
    const exprStr = exprNode.toString();
    const roots = findRootsRobust(exprStr);
    for (const r of roots) {
      allRoots.add(r);
    }
  }
  
  const sortedRoots = Array.from(allRoots).sort((a, b) => a - b);
  const uniqueRoots: number[] = [];
  for (const r of sortedRoots) {
    if (uniqueRoots.length === 0 || Math.abs(r - uniqueRoots[uniqueRoots.length - 1]) > 1e-6) {
      uniqueRoots.push(r);
    }
  }`;

const newAllRoots = `  const allRoots: any[] = [];
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
  }`;

content = content.replace(oldAllRoots, newAllRoots);

// 9. Update criticalPoints type
const oldCriticalPoints = `  const criticalPoints = uniqueRoots.map(r => ({
    val: r,
    str: recognizeExact(r)
  }));`;

const newCriticalPoints = `  const criticalPoints = uniqueRoots.map(r => ({
    val: typeof r === 'number' ? r : r.toNumber(),
    exactVal: r,
    str: recognizeExact(r)
  }));`;

content = content.replace(oldCriticalPoints, newCriticalPoints);

// 10. Update GeneralInequationResult interface
const oldInterface = `export interface GeneralInequationResult {
  criticalPoints: { val: number, str: string }[];`;

const newInterface = `export interface GeneralInequationResult {
  criticalPoints: { val: number, exactVal?: any, str: string }[];`;

content = content.replace(oldInterface, newInterface);

fs.writeFileSync('src/lib/generalInequation.ts', content);
