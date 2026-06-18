import { solvePolynomialInequation, parseMath } from '../src/lib/mathUtils';

const coeffs = [parseMath("1/4"), 0, -3, 4, parseMath("-1.25")];
const res = solvePolynomialInequation(coeffs, ">=");

console.log("Symbolic:", res.symbolic);
console.log("Roots:", res.roots.map(r => r.toFixed(10)));
