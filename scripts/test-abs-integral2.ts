import nerdamer from 'nerdamer';
import 'nerdamer/Algebra.js';
import 'nerdamer/Calculus.js';
import 'nerdamer/Solve.js';
import * as math from 'mathjs';

const expr = 'abs(x^3-7*x+6-x(x-1)*(x-8))';
try {
  const res = nerdamer(`defint(${expr}, 2/3, 1, x)`);
  console.log("Nerdamer result:", res.toString());
} catch (e) {
  console.log("Error:", e);
}
