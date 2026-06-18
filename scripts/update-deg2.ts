import * as fs from 'fs';

let content = fs.readFileSync('src/lib/mathUtils.ts', 'utf-8');

const oldDeg2 = `  if (degree === 2) {
    const a = actualCoeffs[0];
    const b = actualCoeffs[1];
    const c = actualCoeffs[2];
    const delta = b * b - 4 * a * c;
    
    if (delta >= 0) {
      const r1 = (-b - Math.sqrt(delta)) / (2 * a);
      const r2 = (-b + Math.sqrt(delta)) / (2 * a);
      rootsRaw = [r1, r2];
    } else {
      rootsRaw = [];
    }
  } else if (degree >= 3) {`;

const newDeg2 = `  if (degree === 2) {
    Decimal.set({ precision: 30 });
    const a = new Decimal(actualCoeffs[0]);
    const b = new Decimal(actualCoeffs[1]);
    const c = new Decimal(actualCoeffs[2]);
    const delta = b.times(b).minus(a.times(c).times(4));
    
    if (delta.gte(0)) {
      const sqrtDelta = delta.sqrt();
      const r1 = b.negated().minus(sqrtDelta).dividedBy(a.times(2));
      const r2 = b.negated().plus(sqrtDelta).dividedBy(a.times(2));
      // We can just put them in rootsRaw as numbers to be refined, or as Decimals directly.
      // But the refinement loop expects objects with .re or numbers.
      // Let's just put them as numbers, the refinement loop will handle them.
      rootsRaw = [r1.toNumber(), r2.toNumber()];
    } else {
      rootsRaw = [];
    }
  } else if (degree >= 3) {`;

content = content.replace(oldDeg2, newDeg2);

fs.writeFileSync('src/lib/mathUtils.ts', content);
