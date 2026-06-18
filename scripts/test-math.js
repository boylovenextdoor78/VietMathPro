function polyEval(coeffs, x) {
  let res = 0;
  let pow = 1;
  for (let i = 0; i < coeffs.length; i++) {
    res += coeffs[i] * pow;
    pow *= x;
  }
  return res;
}

function polyDeriv(coeffs) {
  if (coeffs.length <= 1) return [0];
  const res = [];
  for (let i = 1; i < coeffs.length; i++) {
    res.push(coeffs[i] * i);
  }
  return res;
}

function solveQuadratic(coeffs) {
  if (coeffs.length === 1) return [];
  if (coeffs.length === 2) {
    if (coeffs[1] === 0) return [];
    return [-coeffs[0] / coeffs[1]];
  }
  const [c, b, a] = coeffs;
  if (a === 0) {
    if (b === 0) return [];
    return [-c / b];
  }
  const delta = b * b - 4 * a * c;
  if (delta < -1e-9) return [];
  if (Math.abs(delta) < 1e-9) return [-b / (2 * a)];
  return [
    (-b - Math.sqrt(delta)) / (2 * a),
    (-b + Math.sqrt(delta)) / (2 * a)
  ];
}

function findRootsNumeric(coeffs) {
  let c = [...coeffs];
  while (c.length > 1 && Math.abs(c[c.length - 1]) < 1e-9) c.pop();
  
  if (c.length === 1) return [];
  if (c.length === 2) return [-c[0] / c[1]];
  if (c.length === 3) return solveQuadratic(c);
  
  const deriv = polyDeriv(c);
  const derivRoots = findRootsNumeric(deriv);
  
  const sortedDerivRoots = [...derivRoots].sort((a, b) => a - b);
  
  const testPts = [];
  if (sortedDerivRoots.length === 0) {
    testPts.push(-Infinity, Infinity);
  } else {
    testPts.push(-Infinity);
    testPts.push(...sortedDerivRoots);
    testPts.push(Infinity);
  }
  
  const roots = [];
  for (let i = 0; i < testPts.length - 1; i++) {
    const a = testPts[i];
    const b = testPts[i + 1];
    const root = findRootInInterval(c, a, b);
    if (root !== null) {
      roots.push(root);
    }
  }
  
  for (const dr of sortedDerivRoots) {
    if (Math.abs(polyEval(c, dr)) < 1e-9) {
      roots.push(dr);
    }
  }
  
  const uniqueRoots = [];
  roots.sort((a, b) => a - b);
  for (const r of roots) {
    if (uniqueRoots.length === 0 || Math.abs(r - uniqueRoots[uniqueRoots.length - 1]) > 1e-7) {
      uniqueRoots.push(r);
    }
  }
  
  return uniqueRoots;
}

function findRootInInterval(coeffs, a, b) {
  let x0 = a;
  let x1 = b;
  
  if (a === -Infinity) {
    x0 = b - 1;
    while (Math.sign(polyEval(coeffs, x0)) === Math.sign(polyEval(coeffs, b))) {
      x0 -= Math.abs(x0) * 2 + 1;
      if (x0 < -1e10) return null;
    }
  }
  if (b === Infinity) {
    x1 = a + 1;
    while (Math.sign(polyEval(coeffs, a)) === Math.sign(polyEval(coeffs, x1))) {
      x1 += Math.abs(x1) * 2 + 1;
      if (x1 > 1e10) return null;
    }
  }
  
  const y0 = polyEval(coeffs, x0);
  const y1 = polyEval(coeffs, x1);
  
  if (Math.abs(y0) < 1e-9) return null;
  if (Math.abs(y1) < 1e-9) return null;
  
  if (Math.sign(y0) === Math.sign(y1)) return null;
  
  let left = x0;
  let right = x1;
  for (let i = 0; i < 100; i++) {
    const mid = (left + right) / 2;
    const yMid = polyEval(coeffs, mid);
    if (Math.abs(yMid) < 1e-12) return mid;
    if (Math.sign(yMid) === Math.sign(polyEval(coeffs, left))) {
      left = mid;
    } else {
      right = mid;
    }
  }
  return (left + right) / 2;
}

// Test x^5 - 5x^3 + 4x = x(x^2-1)(x^2-4) = x(x-1)(x+1)(x-2)(x+2)
// roots: -2, -1, 0, 1, 2
// coeffs: [0, 4, 0, -5, 0, 1]
console.log(findRootsNumeric([0, 4, 0, -5, 0, 1]));
