import * as fs from 'fs';

let content = fs.readFileSync('src/lib/mathUtils.ts', 'utf-8');

const oldDeg1 = `  if (degree === 1) {
    const a = actualCoeffs[0];
    const b = actualCoeffs[1];
    const root = -b / a;
    const isGreater = sign.includes(">");
    const isClosed = sign.includes("=");
    const leftTrue = (a > 0 && !isGreater) || (a < 0 && isGreater);
    
    const rootStr = formatRoot(root);
    let symbolic = "";
    let intervals: any[] = [];
    
    if (leftTrue) {
      symbolic = \`x \${isClosed ? "≤" : "<"} \${rootStr}\`;
      intervals = [{ start: -Infinity, end: root, startClosed: false, endClosed: isClosed }];
    } else {
      symbolic = \`x \${isClosed ? "≥" : ">"} \${rootStr}\`;
      intervals = [{ start: root, end: Infinity, startClosed: isClosed, endClosed: false }];
    }
    
    return { roots: [root], symbolic, numeric: symbolic, intervals };
  }`;

const newDeg1 = `  if (degree === 1) {
    Decimal.set({ precision: 30 });
    const a = new Decimal(actualCoeffs[0]);
    const b = new Decimal(actualCoeffs[1]);
    const root = b.negated().dividedBy(a);
    const isGreater = sign.includes(">");
    const isClosed = sign.includes("=");
    const leftTrue = (actualCoeffs[0] > 0 && !isGreater) || (actualCoeffs[0] < 0 && isGreater);
    
    const rootStr = formatRoot(root);
    let symbolic = "";
    let intervals: any[] = [];
    
    if (leftTrue) {
      symbolic = \`x \${isClosed ? "≤" : "<"} \${rootStr}\`;
      intervals = [{ start: -Infinity, end: root, startClosed: false, endClosed: isClosed }];
    } else {
      symbolic = \`x \${isClosed ? "≥" : ">"} \${rootStr}\`;
      intervals = [{ start: root, end: Infinity, startClosed: isClosed, endClosed: false }];
    }
    
    return { roots: [root], symbolic, numeric: symbolic, intervals };
  }`;

content = content.replace(oldDeg1, newDeg1);

fs.writeFileSync('src/lib/mathUtils.ts', content);
