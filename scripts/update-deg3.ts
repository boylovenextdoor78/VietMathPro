import * as fs from 'fs';

let content = fs.readFileSync('src/lib/mathUtils.ts', 'utf-8');

const oldDeg3 = `    if (currentCoeffs.length === 3) {
      const a = currentCoeffs[0];
      const b = currentCoeffs[1];
      const c = currentCoeffs[2];
      const delta = b * b - 4 * a * c;
      if (delta >= 0) {
        foundRoots.push((-b - Math.sqrt(delta)) / (2 * a));
        foundRoots.push((-b + Math.sqrt(delta)) / (2 * a));
      }
    } else if (currentCoeffs.length > 3) {`;

const newDeg3 = `    if (currentCoeffs.length === 3) {
      Decimal.set({ precision: 30 });
      const a = new Decimal(currentCoeffs[0]);
      const b = new Decimal(currentCoeffs[1]);
      const c = new Decimal(currentCoeffs[2]);
      const delta = b.times(b).minus(a.times(c).times(4));
      if (delta.gte(0)) {
        const sqrtDelta = delta.sqrt();
        foundRoots.push(b.negated().minus(sqrtDelta).dividedBy(a.times(2)).toNumber());
        foundRoots.push(b.negated().plus(sqrtDelta).dividedBy(a.times(2)).toNumber());
      }
    } else if (currentCoeffs.length > 3) {`;

content = content.replace(oldDeg3, newDeg3);

fs.writeFileSync('src/lib/mathUtils.ts', content);
