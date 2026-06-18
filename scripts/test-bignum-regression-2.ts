import * as math from 'mathjs';

const bigMath = math.create(math.all, { number: 'BigNumber', precision: 60 });

const n = bigMath.bignumber(3);
const sumX = bigMath.bignumber(6);
const sumX2 = bigMath.bignumber(14);
const sumY = bigMath.bignumber(12);
const sumXY = bigMath.bignumber(28);

const A = [
  [n, sumX],
  [sumX, sumX2]
];
const B = [sumY, sumXY];
const res = bigMath.lusolve(A, B);
console.log("lusolve raw:", JSON.stringify(res));
