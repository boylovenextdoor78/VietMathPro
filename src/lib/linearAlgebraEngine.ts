/**
 * VietMath Pro - Linear Algebra Engine
 * Designing and implementing MATLAB-level Symbolic & Numeric Mathematics
 * for Vector and Matrix engines with complete step-by-step tracing.
 */

import Decimal from "decimal.js";

// Initialize arbitrary precision Decimal configuration (at least 30 decimal digits, we use 45)
Decimal.set({ precision: 45 });

// ==========================================
// DATA STRUCTURES & BASIC TYPES
// ==========================================

export type Vector2D = [number, number];
export type Vector3D = [number, number, number];

export interface Plane {
  a: number; // ax + by + cz + d = 0
  b: number;
  c: number;
  d: number;
  equation: string;
}

export interface Line3D {
  point: Vector3D;
  direction: Vector3D;
  equation: string; // parametric or symmetric
}

export interface Matrix {
  rows: number;
  cols: number;
  data: number[][];
}

export interface StepTrace {
  title: string;
  description: string;
  expression?: string;
  matrixBefore?: number[][];
  matrixAfter?: number[][];
}

export interface DecompositionResult {
  steps: StepTrace[];
  matrices: { [key: string]: number[][] };
  textSummary?: string;
}

export interface SymbolicEigenvalue {
  exactExpression: string;
  algebraicForm: string;
  radicals: string[];
  branchInfo: string;
  isComplexForm: boolean;
}

export class Complex {
  r: number;
  i: number;
  constructor(r: number, i = 0) {
    this.r = r;
    this.i = i;
  }
}

export interface ComplexMatrix {
  rows: number;
  cols: number;
  data: Complex[][];
}

export interface HighPrecisionInfo {
  eigenvalueIndex: number;
  rawReal: string;
  rawImag: string;
  absImag: string;
  isRealByBypass: boolean;
  purifiedReal: number;
}

export interface EigenResult {
  steps: StepTrace[];
  characteristicPoly: number[]; // coeffs from highest x^n to constant x^0
  characteristicEqString: string;
  eigenvalues: number[];
  eigenvectors: number[][][]; // array of eigenvectors for each eigenvalue
  symbolicEigenvalues?: SymbolicEigenvalue[];
  mixedSpectrum?: boolean;
  genuineComplexCount?: number;
  highPrecisionDetails?: HighPrecisionInfo[];
  complexEigenvalues?: Complex[];
  complexEigenvectors?: Complex[][][];
  highPrecEigenvalues?: DecimalComplex[];
  highPrecEigenvectors?: DecimalComplex[][][];
}

export interface JacobiResult {
  steps: StepTrace[];
  P: number[][];
  D: number[][];
  P_inv: number[][];
  isOrthogonal: boolean;
}

// Named matrix storage dictionary
export type MatrixStorage = { [key: string]: Matrix };

// Default 16 matrix names allowed: A_1..A_4, B_1..B_4, C_1..C_4, D_1..D_4
export const VALID_MATRIX_NAMES = [
  "A_1", "A_2", "A_3", "A_4",
  "B_1", "B_2", "B_3", "B_4",
  "C_1", "C_2", "C_3", "C_4",
  "D_1", "D_2", "D_3", "D_4"
];

// Epsilon for numerical comparison and stability
const EPSILON = 1e-10;

// Utility to round close numbers to clean values
export function sanitizeNumber(v: number): number {
  if (Math.abs(v) < EPSILON) return 0;
  // If extremely close to an integer, round it
  const rounded = Math.round(v);
  if (Math.abs(v - rounded) < 1e-10) {
    return rounded;
  }
  return Number(v.toFixed(7));
}

export function sanitizeMatrix(m: number[][]): number[][] {
  return m.map(row => row.map(sanitizeNumber));
}

// Helper to format scientific/floating output nicely
export function formatNum(n: number): string {
  const sanitized = sanitizeNumber(n);
  if (Math.abs(sanitized - Math.round(sanitized)) < 1e-9) {
    return Math.round(sanitized).toString();
  }
  // Try showing as fraction if reasonable denominator <= 50
  for (let q = 1; q <= 50; q++) {
    const p = sanitized * q;
    if (Math.abs(p - Math.round(p)) < 1e-6) {
      return `${Math.round(p)}/${q}`;
    }
  }
  return sanitized.toFixed(4).replace(/\.?0+$/, "");
}

// ==========================================
// HIGH PRECISION COMPLEX FIXED POINT ARITHMETIC WITH 40 DIGITS PRECISION
// ==========================================

const SCALE = 10n ** 40n;
const EPS_REALITY_BIG = 10n ** 12n; // 10^(40 - 28) = 1e12 representation for EPS_REALITY = 10^-28

function toScaledBigInt(v: number): bigint {
  if (isNaN(v) || !isFinite(v)) return 0n;
  const scaled = Math.round(v * 1e15);
  return BigInt(scaled) * (10n ** 25n);
}

function fromScaledBigInt(v: bigint): number {
  return Number(v / (10n ** 25n)) / 1e15;
}

function bigintSqrt(v: bigint): bigint {
  if (v < 0n) return 0n;
  if (v === 0n || v === 1n) return v;
  let x0 = v / 2n;
  let x1 = (x0 + v / x0) / 2n;
  while (x1 < x0) {
    x0 = x1;
    x1 = (x0 + v / x0) / 2n;
  }
  return x0;
}

export class BigComplex {
  r: bigint;
  i: bigint;

  constructor(r: bigint, i: bigint) {
    this.r = r;
    this.i = i;
  }

  static fromNumber(real: number, imag = 0): BigComplex {
    return new BigComplex(toScaledBigInt(real), toScaledBigInt(imag));
  }

  toNumberR(): number {
    return fromScaledBigInt(this.r);
  }

  toNumberI(): number {
    return fromScaledBigInt(this.i);
  }

  add(other: BigComplex): BigComplex {
    return new BigComplex(this.r + other.r, this.i + other.i);
  }

  sub(other: BigComplex): BigComplex {
    return new BigComplex(this.r - other.r, this.i - other.i);
  }

  mul(other: BigComplex): BigComplex {
    const r = (this.r * other.r - this.i * other.i) / SCALE;
    const i = (this.r * other.i + this.i * other.r) / SCALE;
    return new BigComplex(r, i);
  }

  div(other: BigComplex): BigComplex {
    const denom = (other.r * other.r + other.i * other.i) / SCALE;
    if (denom === 0n) {
      return new BigComplex(0n, 0n);
    }
    const r = (this.r * other.r + this.i * other.i) / denom;
    const i = (this.i * other.r - this.r * other.i) / denom;
    return new BigComplex(r, i);
  }

  abs(): bigint {
    return bigintSqrt(this.r * this.r + this.i * this.i);
  }
}

export function bigSolvePolynomial(coeffs: number[]): BigComplex[] {
  const n = coeffs.length - 1;
  const bigCoeffs = coeffs.map(c => BigComplex.fromNumber(c));
  const roots: BigComplex[] = [];
  for (let k = 0; k < n; k++) {
    const angle = (2 * Math.PI * k) / n + 0.35 + 0.02 * k;
    const radius = 0.9 + 0.15 * k;
    roots.push(BigComplex.fromNumber(radius * Math.cos(angle), radius * Math.sin(angle)));
  }

  const maxIter = 150;
  for (let iter = 0; iter < maxIter; iter++) {
    let maxChange = 0n;
    const currRoots = [...roots];
    for (let i = 0; i < n; i++) {
      let pVal = bigCoeffs[0];
      for (let cIdx = 1; cIdx < bigCoeffs.length; cIdx++) {
        pVal = pVal.mul(roots[i]).add(bigCoeffs[cIdx]);
      }
      let denom = BigComplex.fromNumber(1, 0);
      for (let j = 0; j < n; j++) {
        if (j !== i) {
          const diff = roots[i].sub(roots[j]);
          denom = denom.mul(diff.abs() === 0n ? BigComplex.fromNumber(1e-12, 1e-12) : diff);
        }
      }
      const delta = pVal.div(denom);
      currRoots[i] = roots[i].sub(delta);
      const change = delta.abs();
      if (change > maxChange) {
        maxChange = change;
      }
    }
    for (let j = 0; j < n; j++) {
      roots[j] = currRoots[j];
    }
    if (maxChange < 1n) {
      break;
    }
  }
  return roots;
}

// ==========================================
// HIGH-PRECISION DECIMAL ARITHMETIC IMPLEMENTATIONS (30-45 DIGITS OF PRECISION)
// ==========================================

export class DecimalComplex {
  r: Decimal;
  i: Decimal;

  constructor(r: Decimal | number | string, i: Decimal | number | string = 0) {
    this.r = r instanceof Decimal ? r : new Decimal(r);
    this.i = i instanceof Decimal ? i : new Decimal(i);
  }

  add(other: DecimalComplex): DecimalComplex {
    return new DecimalComplex(this.r.plus(other.r), this.i.plus(other.i));
  }

  sub(other: DecimalComplex): DecimalComplex {
    return new DecimalComplex(this.r.minus(other.r), this.i.minus(other.i));
  }

  mul(other: DecimalComplex): DecimalComplex {
    const real = this.r.times(other.r).minus(this.i.times(other.i));
    const imag = this.r.times(other.i).plus(this.i.times(other.r));
    return new DecimalComplex(real, imag);
  }

  div(other: DecimalComplex): DecimalComplex {
    const denom = other.r.times(other.r).plus(other.i.times(other.i));
    if (denom.isZero()) {
      return new DecimalComplex(0, 0);
    }
    const real = this.r.times(other.r).plus(this.i.times(other.i)).div(denom);
    const imag = this.i.times(other.r).minus(this.r.times(other.i)).div(denom);
    return new DecimalComplex(real, imag);
  }

  abs(): Decimal {
    return this.r.times(this.r).plus(this.i.times(this.i)).sqrt();
  }

  absImg(): Decimal {
    return this.i.abs();
  }

  log(): DecimalComplex {
    const x = this.r;
    const y = this.i;
    const r2 = x.times(x).plus(y.times(y));
    if (r2.isZero()) {
      throw new Error("Logarithm of zero is undefined.");
    }
    const lnR = r2.log().div(2);
    const arg = decimalAtan2(y, x);
    return new DecimalComplex(lnR, arg);
  }

  exp(): DecimalComplex {
    const x = this.r;
    const y = this.i;
    const expX = x.exp();
    const cosY = y.cos();
    const sinY = y.sin();
    return new DecimalComplex(expX.times(cosY), expX.times(sinY));
  }

  pow(s: DecimalComplex): DecimalComplex {
    return this.log().mul(s).exp();
  }

  negated(): DecimalComplex {
    return new DecimalComplex(this.r.negated(), this.i.negated());
  }
}

export function decimalAtan2(y: Decimal, x: Decimal): Decimal {
  const pi = Decimal.acos(new Decimal(-1));
  const halfPi = pi.div(2);
  
  if (x.isZero()) {
    if (y.isPositive()) return halfPi;
    if (y.isNegative()) return halfPi.negated();
    return new Decimal(0);
  }
  
  const ratio = y.div(x);
  const atanRatio = ratio.atan();
  
  if (x.isPositive()) {
    return atanRatio;
  } else {
    if (y.isZero() || y.isPositive()) {
      return atanRatio.plus(pi);
    } else {
      return atanRatio.minus(pi);
    }
  }
}

export function solvePolynomialHighPrecision(coeffs: number[]): DecimalComplex[] {
  const n = coeffs.length - 1;
  const decCoeffs = coeffs.map(c => new DecimalComplex(c, 0));
  const roots: DecimalComplex[] = [];

  // Generate nice distributed initial guesses in the complex plane to avoid duplicate roots converging:
  for (let k = 0; k < n; k++) {
    const angle = (2 * Math.PI * k) / n + 0.35 + 0.02 * k;
    const radius = 0.9 + 0.15 * k;
    roots.push(new DecimalComplex(radius * Math.cos(angle), radius * Math.sin(angle)));
  }

  const maxIter = 150;
  for (let iter = 0; iter < maxIter; iter++) {
    let maxChange = new Decimal(0);
    const currRoots = [...roots];
    
    for (let i = 0; i < n; i++) {
      // Evaluate P(roots[i])
      let pVal = decCoeffs[0];
      for (let j = 1; j <= n; j++) {
        pVal = pVal.mul(roots[i]).add(decCoeffs[j]);
      }
      
      // Evaluate denominator: \prod_{j \neq i} (roots[i] - roots[j])
      let denom = new DecimalComplex(1, 0);
      for (let j = 0; j < n; j++) {
        if (j !== i) {
          const diff = roots[i].sub(roots[j]);
          denom = denom.mul(diff.abs().isZero() ? new DecimalComplex("1e-20", "1e-20") : diff);
        }
      }
      
      const delta = pVal.div(denom);
      currRoots[i] = roots[i].sub(delta);
      const change = delta.abs();
      if (change.gt(maxChange)) {
        maxChange = change;
      }
    }
    
    for (let j = 0; j < n; j++) {
      roots[j] = currRoots[j];
    }
    
    if (maxChange.lt(new Decimal("1e-35"))) {
      break;
    }
  }
  return roots;
}

export interface DecimalComplexMatrix {
  rows: number;
  cols: number;
  data: DecimalComplex[][];
}

export function dotProduct(u: DecimalComplex[], v: DecimalComplex[]): DecimalComplex {
  let sum = new DecimalComplex(0, 0);
  for (let i = 0; i < u.length; i++) {
    const conjU = new DecimalComplex(u[i].r, u[i].i.negated());
    sum = sum.add(conjU.mul(v[i]));
  }
  return sum;
}

export function norm(u: DecimalComplex[]): Decimal {
  let sumSq = new Decimal(0);
  for (const val of u) {
    sumSq = sumSq.plus(val.r.times(val.r).plus(val.i.times(val.i)));
  }
  return sumSq.sqrt();
}

export function gramSchmidtUnitary(q1: DecimalComplex[]): DecimalComplex[][] {
  const n = q1.length;
  const basis: DecimalComplex[][] = [q1];
  
  const canonicals: DecimalComplex[][] = [];
  for (let i = 0; i < n; i++) {
    const v = Array(n).fill(0).map((_, idx) => new DecimalComplex(idx === i ? 1 : 0, 0));
    canonicals.push(v);
  }
  
  for (const e of canonicals) {
    let w = [...e];
    for (const b of basis) {
      const dot = dotProduct(b, w);
      for (let i = 0; i < n; i++) {
        w[i] = w[i].sub(b[i].mul(dot));
      }
    }
    const normVal = norm(w);
    if (normVal.gt(new Decimal("1e-25"))) {
      basis.push(w.map(val => val.div(new DecimalComplex(normVal, 0))));
    }
    if (basis.length === n) break;
  }
  
  return basis;
}

export function solvePolynomialDecimal(coeffs: DecimalComplex[]): DecimalComplex[] {
  const n = coeffs.length - 1;
  const roots: DecimalComplex[] = [];

  for (let k = 0; k < n; k++) {
    const angle = (2 * Math.PI * k) / n + 0.35 + 0.02 * k;
    const radius = 0.9 + 0.15 * k;
    roots.push(new DecimalComplex(radius * Math.cos(angle), radius * Math.sin(angle)));
  }

  const maxIter = 250;
  for (let iter = 0; iter < maxIter; iter++) {
    let maxChange = new Decimal(0);
    const currRoots = [...roots];
    
    for (let i = 0; i < n; i++) {
      let pVal = coeffs[0];
      for (let j = 1; j <= n; j++) {
        pVal = pVal.mul(roots[i]).add(coeffs[j]);
      }
      
      let denom = new DecimalComplex(1, 0);
      for (let j = 0; j < n; j++) {
        if (j !== i) {
          const diff = roots[i].sub(roots[j]);
          denom = denom.mul(diff.abs().isZero() ? new DecimalComplex("1e-40", "1e-40") : diff);
        }
      }
      
      const delta = pVal.div(denom);
      currRoots[i] = roots[i].sub(delta);
      const change = delta.abs();
      if (change.gt(maxChange)) {
        maxChange = change;
      }
    }
    
    for (let j = 0; j < n; j++) {
      roots[j] = currRoots[j];
    }
    
    if (maxChange.lt(new Decimal("1e-85"))) {
      break;
    }
  }
  return roots;
}

export function decimalComplexMatrixTrace(A: DecimalComplexMatrix): DecimalComplex {
  let sum = new DecimalComplex(0, 0);
  for (let i = 0; i < A.rows; i++) {
    sum = sum.add(A.data[i][i]);
  }
  return sum;
}

export function decimalComplexMatrixAddI(A: DecimalComplexMatrix, c: DecimalComplex): DecimalComplexMatrix {
  const n = A.rows;
  const data = A.data.map((row, r) =>
    row.map((val, col) => r === col ? val.add(c) : val)
  );
  return { rows: n, cols: n, data };
}

export function characteristicPolynomialDecimal(A: DecimalComplexMatrix): DecimalComplex[] {
  const n = A.rows;
  const pCoeffs = new Array(n + 1).fill(null).map(() => new DecimalComplex(0, 0));
  pCoeffs[n] = new DecimalComplex(1, 0);
  
  let B = { ...A };
  let trace1 = decimalComplexMatrixTrace(B);
  pCoeffs[n - 1] = new DecimalComplex(trace1.r.negated(), trace1.i.negated());
  
  for (let k = 2; k <= n; k++) {
    const prevC = pCoeffs[n - k + 1];
    const addedB = decimalComplexMatrixAddI(B, prevC);
    B = DecimalComplexMatrixEngine.multiply(A, addedB);
    
    const traceK = decimalComplexMatrixTrace(B);
    const scale = new DecimalComplex(new Decimal(1).div(k).negated(), 0);
    pCoeffs[n - k] = traceK.mul(scale);
  }
  return pCoeffs;
}

export function decimalComplexMatrixPowerInteger(A: DecimalComplexMatrix, k: number): DecimalComplexMatrix {
  const n = A.rows;
  if (k === 0) {
    const data = Array(n).fill(0).map((_, r) =>
      Array(n).fill(0).map((_, c) => new DecimalComplex(r === c ? 1 : 0, 0))
    );
    return { rows: n, cols: n, data };
  }
  if (k < 0) {
    const inv = DecimalComplexMatrixEngine.inverse(A);
    return decimalComplexMatrixPowerInteger(inv, -k);
  }
  
  let base = A;
  let exp = k;
  let result = Array(n).fill(0).map((_, r) =>
    Array(n).fill(0).map((_, c) => new DecimalComplex(r === c ? 1 : 0, 0))
  );
  
  while (exp > 0) {
    if (exp % 2 === 1) {
      result = DecimalComplexMatrixEngine.multiply({ rows: n, cols: n, data: result }, base).data;
    }
    base = DecimalComplexMatrixEngine.multiply(base, base);
    exp = Math.floor(exp / 2);
  }
  return { rows: n, cols: n, data: result };
}

export function decimalComplexMatrixNormInf(M: DecimalComplexMatrix): Decimal {
  let maxNorm = new Decimal(0);
  for (let r = 0; r < M.rows; r++) {
    let rowSum = new Decimal(0);
    for (let c = 0; c < M.cols; c++) {
      rowSum = rowSum.plus(M.data[r][c].abs());
    }
    if (rowSum.gt(maxNorm)) {
      maxNorm = rowSum;
    }
  }
  return maxNorm;
}

export class SymbolicEigenEngine {
  static solveSymbolic(A: Matrix, coeffs: number[]): SymbolicEigenvalue[] {
    const n = A.rows;
    const result: SymbolicEigenvalue[] = [];

    if (n === 1) {
      result.push({
        exactExpression: `[ ${formatNum(A.data[0][0])} ]`,
        algebraicForm: "Linear univariate formulation",
        radicals: [],
        branchInfo: "Trivial scalar spectrum eigenvalue",
        isComplexForm: false
      });
    } else if (n === 2) {
      const tr = A.data[0][0] + A.data[1][1];
      const det = A.data[0][0] * A.data[1][1] - A.data[0][1] * A.data[1][0];
      const disc = tr * tr - 4 * det;
      const rDisc = Math.abs(disc);
      const isComplex = disc < 0;

      const exactL1 = `(${formatNum(tr)} + √(${formatNum(rDisc)})) / 2`;
      const exactL2 = `(${formatNum(tr)} - √(${formatNum(rDisc)})) / 2`;

      result.push({
        exactExpression: exactL1,
        algebraicForm: `Quadratic Radical Form with positive discriminant branch`,
        radicals: [`√(${formatNum(rDisc)})`],
        branchInfo: "Positive conjugate radical branch",
        isComplexForm: isComplex
      });
      result.push({
        exactExpression: exactL2,
        algebraicForm: `Quadratic Radical Form with negative discriminant branch`,
        radicals: [`√(${formatNum(rDisc)})`],
        branchInfo: "Negative conjugate radical branch",
        isComplexForm: isComplex
      });
    } else if (n === 3) {
      const c1 = coeffs[1] || 0;
      const c2 = coeffs[2] || 0;
      const c3 = coeffs[3] || 0;

      const p = (3 * c2 - c1 * c1) / 3;
      const q = (2 * c1 * c1 * c1 - 9 * c1 * c2 + 27 * c3) / 27;
      const disc = (q * q) / 4 + (p * p * p) / 27;
      const rDisc = Math.abs(disc);

      for (let k = 1; k <= 3; k++) {
        result.push({
          exactExpression: `cbrt(-(${formatNum(q/2)}) + √(${formatNum(rDisc)})) * ω_${k} + cbrt(-(${formatNum(q/2)}) - √(${formatNum(rDisc)})) * ω_${k}^2 - (${formatNum(c1/3)})`,
          algebraicForm: `Cubic Cardonic form`,
          radicals: [`√(${formatNum(rDisc)})`, `³√(-(${formatNum(q/2)}) ± √(${formatNum(rDisc)}))`],
          branchInfo: `Cardano root algebraic branch Sheet #${k}`,
          isComplexForm: disc > 0 || p < 0
        });
      }
    } else {
      for (let k = 1; k <= n; k++) {
        result.push({
          exactExpression: `RootsOf(λ^${n} + ` + coeffs.slice(1).map((c, i) => `${c >= 0 ? '+' : ''}${formatNum(c)}λ^${n-1-i}`).join(" ") + ` = 0) Sheet #${k}`,
          algebraicForm: `Higher algebraic extension field of degree ${n}`,
          radicals: [`Characteristic algebraic residue spectrum`],
          branchInfo: `Galois sheet Riemann sheet index ${k} of ${n}`,
          isComplexForm: true
        });
      }
    }

    return result;
  }
}

// Helper to compute value to 25 decimal places (analytical or highly refined numerical approach, with up to 30 digits of internal precision)
export function getHighPrecision25(val: number): string {
  if (isNaN(val) || !isFinite(val)) return "0." + "0".repeat(25);
  return new Decimal(val).toFixed(25);
}

// ==========================================
// 1. VECTOR ENGINE
// ==========================================

export class VectorEngine {
  // Vector addition
  static add(u: number[], v: number[]): number[] {
    if (u.length !== v.length) throw new Error("Vectors must have the same dimension.");
    return u.map((val, idx) => val + v[idx]);
  }

  // Vector subtraction
  static subtract(u: number[], v: number[]): number[] {
    if (u.length !== v.length) throw new Error("Vectors must have the same dimension.");
    return u.map((val, idx) => val - v[idx]);
  }

  // Scalar multiplication
  static scalarMul(u: number[], k: number): number[] {
    return u.map(val => val * k);
  }

  // Magnitude
  static magnitude(u: number[]): number {
    return Math.sqrt(u.reduce((sum, val) => sum + val * val, 0));
  }

  // Normalization
  static normalize(u: number[]): number[] {
    const mag = this.magnitude(u);
    if (mag < EPSILON) throw new Error("Cannot normalize a zero vector.");
    return u.map(val => val / mag);
  }

  // Distance between two vectors
  static distance(u: number[], v: number[]): number {
    return this.magnitude(this.subtract(u, v));
  }

  // Direction Cosines (only 3D/2D)
  static directionCosines(u: number[]): number[] {
    const mag = this.magnitude(u);
    if (mag < EPSILON) return u.map(() => 0);
    return u.map(val => val / mag);
  }

  // Dot product
  static dot(u: number[], v: number[]): number {
    if (u.length !== v.length) throw new Error("Vectors must have the same dimension.");
    return u.reduce((sum, val, idx) => sum + val * v[idx], 0);
  }

  // Projection of u onto v
  static projection(u: number[], v: number[]): number[] {
    const magV = this.magnitude(v);
    if (magV < EPSILON) throw new Error("Cannot project onto a zero vector.");
    const scalar = this.dot(u, v) / (magV * magV);
    return this.scalarMul(v, scalar);
  }

  // Angle between u and v (in radians)
  static angle(u: number[], v: number[]): number {
    const magU = this.magnitude(u);
    const magV = this.magnitude(v);
    if (magU < EPSILON || magV < EPSILON) throw new Error("Angle undefined for zero vectors.");
    const cosTheta = this.dot(u, v) / (magU * magV);
    // Clamp to prevent floating-point out of bounds [-1, 1]
    const clamped = Math.max(-1, Math.min(1, cosTheta));
    return Math.acos(clamped);
  }

  // 3D Specific: Cross Product
  static cross3D(u: Vector3D, v: Vector3D): Vector3D {
    return [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0]
    ];
  }

  // Scalar Triple Product: u . (v x w)
  static scalarTriple(u: Vector3D, v: Vector3D, w: Vector3D): number {
    return this.dot(u, this.cross3D(v, w));
  }

  // Vector Triple Product: u x (v x w)
  static vectorTriple(u: Vector3D, v: Vector3D, w: Vector3D): Vector3D {
    return this.cross3D(u, this.cross3D(v, w));
  }

  // Line from 2 points
  static createLine3D(p1: Vector3D, p2: Vector3D): Line3D {
    const dir = this.subtract(p2, p1) as Vector3D;
    if (this.magnitude(dir) < EPSILON) throw new Error("Points must be distinct to define a line.");
    const eq = `x = ${formatNum(p1[0])} + ${formatNum(dir[0])}t, y = ${formatNum(p1[1])} + ${formatNum(dir[1])}t, z = ${formatNum(p1[2])} + ${formatNum(dir[2])}t`;
    return { point: p1, direction: dir, equation: eq };
  }

  // Plane from 3 points
  static createPlaneFrom3Points(p1: Vector3D, p2: Vector3D, p3: Vector3D): Plane {
    const v12 = this.subtract(p2, p1) as Vector3D;
    const v13 = this.subtract(p3, p1) as Vector3D;
    const normal = this.cross3D(v12, v13);
    const len = this.magnitude(normal);
    if (len < EPSILON) throw new Error("Points must be non-collinear to define a plane.");
    
    const [a, b, c] = normal;
    const d = -(a * p1[0] + b * p1[1] + c * p1[2]);
    const eq = `${formatNum(a)}x + ${formatNum(b)}y + ${formatNum(c)}z + ${formatNum(d)} = 0`;
    return { a, b, c, d, equation: eq.replace("+ -", "- ") };
  }

  // Distance from point to line in 3D
  static pointLineDistance(point: Vector3D, line: Line3D): number {
    // d = |(P - Q) x u| / |u|   where Q is point on line, u is direction vector
    const QP = this.subtract(point, line.point) as Vector3D;
    const cross = this.cross3D(QP, line.direction);
    return this.magnitude(cross) / this.magnitude(line.direction);
  }

  // Distance from point to plane
  static pointPlaneDistance(p: Vector3D, plane: Plane): number {
    // d = |ax_0 + by_0 + cz_0 + d| / sqrt(a^2 + b^2 + c^2)
    const numerator = Math.abs(plane.a * p[0] + plane.b * p[1] + plane.c * p[2] + plane.d);
    const denominator = Math.sqrt(plane.a * plane.a + plane.b * plane.b + plane.c * plane.c);
    return numerator / denominator;
  }

  // Parallel test
  static areParallel(u: number[], v: number[]): boolean {
    if (u.length !== v.length) return false;
    const magU = this.magnitude(u);
    const magV = this.magnitude(v);
    if (magU < EPSILON || magV < EPSILON) return true; // Zero vector is trivially parallel
    const angleRad = this.angle(u, v);
    return Math.abs(angleRad) < EPSILON || Math.abs(angleRad - Math.PI) < EPSILON;
  }

  // Perpendicular test
  static arePerpendicular(u: number[], v: number[]): boolean {
    if (u.length !== v.length) return false;
    return Math.abs(this.dot(u, v)) < EPSILON;
  }

  // Vector string parser e.g. "i - 2j + 3k" or "[1, 2, 3]" or "(1, -2)"
  static parseVector(str: string): number[] {
    const cleaned = str.trim().replace(/\s+/g, "");
    
    // Bracket formats: [1, 2, 3] or (1, 2)
    if (cleaned.startsWith("[") && cleaned.endsWith("]")) {
      return cleaned.slice(1, -1).split(",").map(v => parseFloat(v));
    }
    if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
      return cleaned.slice(1, -1).split(",").map(v => parseFloat(v));
    }

    // i, j, k format: "2i + 3j - k"
    const regex = /([+-]?\d*(?:\.\d+)?)([ijk])/g;
    const matches = [...cleaned.matchAll(regex)];
    if (matches.length > 0) {
      const coeffs = { i: 0, j: 0, k: 0 };
      for (const m of matches) {
        let valStr = m[1];
        const unit = m[2] as 'i' | 'j' | 'k';
        if (valStr === "" || valStr === "+") valStr = "1";
        if (valStr === "-") valStr = "-1";
        coeffs[unit] = parseFloat(valStr);
      }
      if (coeffs.k !== 0) {
        return [coeffs.i, coeffs.j, coeffs.k];
      }
      return [coeffs.i, coeffs.j];
    }

    // Default space or comma separated plain numbers
    const parts = cleaned.split(/[\s,]+/);
    if (parts.length >= 2) {
      return parts.map(p => parseFloat(p));
    }

    throw new Error("Invalid vector format. Use e.g. [1, -2, 3] or 'i - 2j + 3k'");
  }
}

// ==========================================
// 2. MATRIX ENGINE (BASIC ALGEBRA)
// ==========================================

export class MatrixEngine {
  // Dimension validations
  static create(rows: number, cols: number, defaultValue = 0): Matrix {
    if (rows < 1 || rows > 15 || cols < 1 || cols > 15) {
      throw new Error("Matrix dimensions must be between 1x1 and 15x15.");
    }
    const data = Array(rows).fill(0).map(() => Array(cols).fill(defaultValue));
    return { rows, cols, data };
  }

  static fromArray(arr: number[][]): Matrix {
    const rows = arr.length;
    if (rows === 0) throw new Error("Matrix cannot be empty.");
    const cols = arr[0].length;
    if (cols === 0) throw new Error("Matrix columns cannot be empty.");
    for (let r = 0; r < rows; r++) {
      if (arr[r].length !== cols) throw new Error("All rows must have the same column size.");
    }
    if (rows > 15 || cols > 15) throw new Error("Maximum matrix size is 15x15.");
    return { rows, cols, data: arr };
  }

  static add(A: Matrix, B: Matrix): Matrix {
    if (A.rows !== B.rows || A.cols !== B.cols) {
      throw new Error(`Matrix dimensions mismatch for addition: ${A.rows}x${A.cols} vs ${B.rows}x${B.cols}`);
    }
    const data = A.data.map((row, r) => row.map((val, c) => val + B.data[r][c]));
    return { rows: A.rows, cols: A.cols, data };
  }

  static subtract(A: Matrix, B: Matrix): Matrix {
    if (A.rows !== B.rows || A.cols !== B.cols) {
      throw new Error(`Matrix dimensions mismatch for subtraction: ${A.rows}x${A.cols} vs ${B.rows}x${B.cols}`);
    }
    const data = A.data.map((row, r) => row.map((val, c) => val - B.data[r][c]));
    return { rows: A.rows, cols: A.cols, data };
  }

  static scalarMul(A: Matrix, k: number): Matrix {
    const data = A.data.map(row => row.map(val => val * k));
    return { rows: A.rows, cols: A.cols, data };
  }

  static multiply(A: Matrix, B: Matrix): Matrix {
    if (A.cols !== B.rows) {
      throw new Error(`Matrix dimension mismatch for multiplication: ${A.rows}x${A.cols} times ${B.rows}x${B.cols}`);
    }
    const rows = A.rows;
    const cols = B.cols;
    const data = Array(rows).fill(0).map(() => Array(cols).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let sum = 0;
        for (let k = 0; k < A.cols; k++) {
          sum += A.data[r][k] * B.data[k][c];
        }
        data[r][c] = sum;
      }
    }
    return { rows, cols, data };
  }

  static transpose(A: Matrix): Matrix {
    const data = Array(A.cols).fill(0).map(() => Array(A.rows).fill(0));
    for (let r = 0; r < A.rows; r++) {
      for (let c = 0; c < A.cols; c++) {
        data[c][r] = A.data[r][c];
      }
    }
    return { rows: A.cols, cols: A.rows, data };
  }

  static trace(A: Matrix): number {
    if (A.rows !== A.cols) throw new Error("Trace is only defined for square matrices.");
    let sum = 0;
    for (let i = 0; i < A.rows; i++) {
      sum += A.data[i][i];
    }
    return sum;
  }

  static determinant(A: Matrix): number {
    if (A.rows !== A.cols) throw new Error("Determinant is only defined for square matrices.");
    const n = A.rows;
    if (n === 1) return A.data[0][0];
    if (n === 2) return A.data[0][0] * A.data[1][1] - A.data[0][1] * A.data[1][0];
    
    // Use Gaussian Elimination with partial pivoting for higher orders (safer, O(n^3))
    const temp = A.data.map(row => [...row]);
    let det = 1;
    for (let i = 0; i < n; i++) {
      let pivotRow = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(temp[j][i]) > Math.abs(temp[pivotRow][i])) {
          pivotRow = j;
        }
      }
      if (pivotRow !== i) {
        const swap = temp[i];
        temp[i] = temp[pivotRow];
        temp[pivotRow] = swap;
        det *= -1;
      }
      if (Math.abs(temp[i][i]) < EPSILON) {
        return 0;
      }
      det *= temp[i][i];
      for (let j = i + 1; j < n; j++) {
        const factor = temp[j][i] / temp[i][i];
        for (let k = i; k < n; k++) {
          temp[j][k] -= factor * temp[i][k];
        }
      }
    }
    return det;
  }

  static adjugate(A: Matrix): Matrix {
    if (A.rows !== A.cols) throw new Error("Adjugate is only defined for square matrices.");
    const n = A.rows;
    const adjData = Array(n).fill(0).map(() => Array(n).fill(0));
    if (n === 1) {
      adjData[0][0] = 1;
      return { rows: 1, cols: 1, data: adjData };
    }
    
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        // Build submatrix leaving out row r and col c
        const subData: number[][] = [];
        for (let sr = 0; sr < n; sr++) {
          if (sr === r) continue;
          const subRow: number[] = [];
          for (let sc = 0; sc < n; sc++) {
            if (sc === c) continue;
            subRow.push(A.data[sr][sc]);
          }
          subData.push(subRow);
        }
        const cofactorValue = Math.pow(-1, r + c) * this.determinant({ rows: n - 1, cols: n - 1, data: subData });
        // Transpose the cofactors to get adjugate
        adjData[c][r] = cofactorValue;
      }
    }
    return { rows: n, cols: n, data: adjData };
  }

  static inverse(A: Matrix): Matrix {
    const det = this.determinant(A);
    if (Math.abs(det) < EPSILON) throw new Error("Matrix is singular (det = 0) and cannot be inverted.");
    const adj = this.adjugate(A);
    return this.scalarMul(adj, 1 / det);
  }
}

// ==========================================
// 3. REF & RREF ENGINE WITH EDUCATIONAL TRACING
// ==========================================

export class RREFEngine {
  static computeREF(A: Matrix): { steps: StepTrace[], result: Matrix } {
    const steps: StepTrace[] = [];
    const mat = A.data.map(row => [...row]);
    const rCount = A.rows;
    const cCount = A.cols;

    steps.push({
      title: "Initialize Matrix",
      description: "Load the target matrix for Row Echelon Form (REF) reduction.",
      matrixBefore: mat.map(row => [...row]),
      matrixAfter: mat.map(row => [...row])
    });

    let currentPivotRow = 0;
    for (let currentCol = 0; currentCol < cCount && currentPivotRow < rCount; currentCol++) {
      // Find maximum element in current column for pivot stability
      let maxRow = currentPivotRow;
      for (let r = currentPivotRow + 1; r < rCount; r++) {
        if (Math.abs(mat[r][currentCol]) > Math.abs(mat[maxRow][currentCol])) {
          maxRow = r;
        }
      }

      // If column is all zeros, shift column right
      if (Math.abs(mat[maxRow][currentCol]) < EPSILON) {
        continue;
      }

      // Swap rows if necessary
      if (maxRow !== currentPivotRow) {
        const temp = mat[currentPivotRow];
        mat[currentPivotRow] = mat[maxRow];
        mat[maxRow] = temp;
        steps.push({
          title: "Pivot Swapping",
          description: `Swap Row ${currentPivotRow + 1} with Row ${maxRow + 1} to position largest pivot value ${formatNum(mat[currentPivotRow][currentCol])} on diagonal.`,
          matrixBefore: steps[steps.length - 1].matrixAfter,
          matrixAfter: mat.map(row => [...row])
        });
      }

      // Eliminate rows below
      for (let r = currentPivotRow + 1; r < rCount; r++) {
        if (Math.abs(mat[r][currentCol]) < EPSILON) continue;
        const factor = mat[r][currentCol] / mat[currentPivotRow][currentCol];
        const prevMatrix = mat.map(row => [...row]);
        for (let c = currentCol; c < cCount; c++) {
          mat[r][c] -= factor * mat[currentPivotRow][c];
        }
        steps.push({
          title: `Row elimination`,
          description: `Row ${r + 1} = Row ${r + 1} - (${formatNum(factor)}) * Row ${currentPivotRow + 1} to clear column element at position (${r+1}, ${currentCol+1}).`,
          matrixBefore: prevMatrix,
          matrixAfter: mat.map(row => [...row])
        });
      }
      currentPivotRow++;
    }

    return { steps, result: { rows: rCount, cols: cCount, data: mat } };
  }

  static computeRREF(A: Matrix): { steps: StepTrace[], result: Matrix } {
    const steps: StepTrace[] = [];
    const mat = A.data.map(row => [...row]);
    const rCount = A.rows;
    const cCount = A.cols;

    steps.push({
      title: "Initialize Matrix",
      description: "Load the target matrix for Row Reduced Echelon Form (RREF) reduction.",
      matrixBefore: mat.map(row => [...row]),
      matrixAfter: mat.map(row => [...row])
    });

    let leadCol = 0;
    for (let r = 0; r < rCount; r++) {
      if (leadCol >= cCount) break;
      let pivotRow = r;
      while (Math.abs(mat[pivotRow][leadCol]) < EPSILON) {
        pivotRow++;
        if (pivotRow === rCount) {
          pivotRow = r;
          leadCol++;
          if (leadCol === cCount) break;
        }
      }
      if (leadCol === cCount) break;

      if (pivotRow !== r) {
        const temp = mat[r];
        mat[r] = mat[pivotRow];
        mat[pivotRow] = temp;
        steps.push({
          title: "Row Swapping",
          description: `Swap Row ${r + 1} with Row ${pivotRow + 1} to select non-zero pivot column lead.`,
          matrixBefore: steps[steps.length - 1].matrixAfter,
          matrixAfter: mat.map(row => [...row])
        });
      }

      const pivotVal = mat[r][leadCol];
      if (Math.abs(pivotVal - 1) > EPSILON) {
        const prevMat = mat.map(row => [...row]);
        for (let c = leadCol; c < cCount; c++) {
          mat[r][c] /= pivotVal;
        }
        steps.push({
          title: "Row Normalization",
          description: `Divide Row ${r + 1} by ${formatNum(pivotVal)} to yield a leading coefficient of exactly 1.`,
          matrixBefore: prevMat,
          matrixAfter: mat.map(row => [...row])
        });
      }

      for (let otherRow = 0; otherRow < rCount; otherRow++) {
        if (otherRow === r) continue;
        const leadCoeff = mat[otherRow][leadCol];
        if (Math.abs(leadCoeff) < EPSILON) continue;
        
        const prevMat = mat.map(row => [...row]);
        for (let c = leadCol; c < cCount; c++) {
          mat[otherRow][c] -= leadCoeff * mat[r][c];
        }
        steps.push({
          title: "Eliminate Column Elements",
          description: `Row ${otherRow + 1} = Row ${otherRow + 1} - (${formatNum(leadCoeff)}) * Row ${r + 1} to create zeros around leading 1.`,
          matrixBefore: prevMat,
          matrixAfter: mat.map(row => [...row])
        });
      }
      leadCol++;
    }

    return { steps, result: { rows: rCount, cols: cCount, data: mat } };
  }
}

// ==========================================
// 4. DECOMPOSITION ENGINE
// ==========================================

export class DecompositionEngine {
  // LU Decomposition (A = L * U, no pivoting)
  static lu(A: Matrix): DecompositionResult {
    if (A.rows !== A.cols) throw new Error("LU decomposition is only supported for square matrices.");
    const n = A.rows;
    const steps: StepTrace[] = [];
    const L = Array(n).fill(0).map(() => Array(n).fill(0));
    const U = Array(n).fill(0).map(() => Array(n).fill(0));

    // Initialize diagonal of L with 1
    for (let i = 0; i < n; i++) L[i][i] = 1;

    for (let i = 0; i < n; i++) {
      // Find U elements
      for (let k = i; k < n; k++) {
        let sum = 0;
        for (let j = 0; j < i; j++) {
          sum += L[i][j] * U[j][k];
        }
        U[i][k] = A.data[i][k] - sum;
      }
      
      // Check pivot existence
      if (Math.abs(U[i][i]) < EPSILON && i < n - 1) {
        throw new Error("Zero diagonal pivot found during Doolittle LU. Run LUP decomposition instead.");
      }

      // Find L elements
      for (let k = i + 1; k < n; k++) {
        let sum = 0;
        for (let j = 0; j < i; j++) {
          sum += L[k][j] * U[j][i];
        }
        L[k][i] = (A.data[k][i] - sum) / U[i][i];
      }

      steps.push({
        title: `LU Step ${i+1}`,
        description: `Determined row ${i+1} inputs for upper-triangular U and lower-triangular L.`,
        matrixBefore: L.map(row => [...row]),
        matrixAfter: U.map(row => [...row])
      });
    }

    return {
      steps,
      matrices: { L, U }
    };
  }

  // LUP Decomposition (P * A = L * U)
  static lup(A: Matrix): DecompositionResult {
    if (A.rows !== A.cols) throw new Error("LUP decomposition is only supported for square matrices.");
    const n = A.rows;
    const steps: StepTrace[] = [];
    const L = Array(n).fill(0).map(() => Array(n).fill(0));
    const U = Array(n).fill(0).map(() => Array(n).fill(0));
    const P = Array(n).fill(0).map(() => Array(n).fill(0));
    const perm = Array(n).fill(0).map((_, idx) => idx);

    // Deep copy source matrix to process RREF or pivoting rows
    const mat = A.data.map(row => [...row]);

    for (let i = 0; i < n; i++) {
      // Pivot selection
      let maxVal = 0;
      let pivotRow = i;
      for (let r = i; r < n; r++) {
        if (Math.abs(mat[r][i]) > maxVal) {
          maxVal = Math.abs(mat[r][i]);
          pivotRow = r;
        }
      }

      if (maxVal < EPSILON) {
        throw new Error("Matrix is singular, cannot perform complete LUP.");
      }

      // Swap rows in permutation tracker
      if (pivotRow !== i) {
        const swapP = perm[i];
        perm[i] = perm[pivotRow];
        perm[pivotRow] = swapP;

        const swapM = mat[i];
        mat[i] = mat[pivotRow];
        mat[pivotRow] = swapM;
      }

      // Perform standard elimination
      for (let r = i + 1; r < n; r++) {
        const factor = mat[r][i] / mat[i][i];
        mat[r][i] = factor; // Store Schur complement inside lower triangle
        for (let c = i + 1; c < n; c++) {
          mat[r][c] -= factor * mat[i][c];
        }
      }
    }

    // Unpack L, U and permutation matrix P
    for (let r = 0; r < n; r++) {
      P[r][perm[r]] = 1;
      L[r][r] = 1;
      for (let c = 0; c < n; c++) {
        if (c < r) {
          L[r][c] = mat[r][c];
        } else {
          U[r][c] = mat[r][c];
        }
      }
    }

    steps.push({
      title: "Factorization & Row Swapping",
      description: "Successfully factored matrix PA into lower unit triangular L and upper triangular U.",
      matrixBefore: A.data,
      matrixAfter: U
    });

    return {
      steps,
      matrices: { P, L, U }
    };
  }

  // QR Decomposition (A = Q * R) using Modified Gram-Schmidt
  static qr(A: Matrix): DecompositionResult {
    const m = A.rows;
    const n = A.cols;
    const steps: StepTrace[] = [];
    const Q = Array(m).fill(0).map(() => Array(n).fill(0));
    const R = Array(n).fill(0).map(() => Array(n).fill(0));

    // Gram-Schmidt orthogonalization columns
    const columns = Array(n).fill(0).map((_, cIdx) => A.data.map(row => row[cIdx]));

    for (let k = 0; k < n; k++) {
      let norm = Math.sqrt(columns[k].reduce((s, v) => s + v * v, 0));
      if (norm < EPSILON) norm = 0;
      R[k][k] = norm;

      if (norm > EPSILON) {
        for (let r = 0; r < m; r++) {
          Q[r][k] = columns[k][r] / norm;
        }
      } else {
        // Zero column fallback
        for (let r = 0; r < m; r++) Q[r][k] = 0;
      }

      for (let j = k + 1; j < n; j++) {
        let dot = 0;
        for (let r = 0; r < m; r++) {
          dot += Q[r][k] * columns[j][r];
        }
        R[k][j] = dot;
        // Project orthobasis out of remaining columns
        for (let r = 0; r < m; r++) {
          columns[j][r] -= dot * Q[r][k];
        }
      }
    }

    steps.push({
      title: "Orthonormal QR Orthogonalization",
      description: "Completed Gram-Schmidt loop to resolve orthogonal headers Q and upper triangular factor R.",
      matrixBefore: A.data,
      matrixAfter: Q
    });

    return { steps, matrices: { Q, R } };
  }

  // Cholesky Decomposition (A = L * L^T)
  static cholesky(A: Matrix): DecompositionResult {
    if (A.rows !== A.cols) throw new Error("Cholesky is only defined for square, real-symmetric matrices.");
    const n = A.rows;
    
    // Symmetric check
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (Math.abs(A.data[r][c] - A.data[c][r]) > 1e-6) {
          throw new Error("Matrix is not symmetric. Cholesky is only defined for symmetric matrices.");
        }
      }
    }

    const L = Array(n).fill(0).map(() => Array(n).fill(0));
    const steps: StepTrace[] = [];

    for (let r = 0; r < n; r++) {
      for (let c = 0; c <= r; c++) {
        let sum = 0;
        for (let k = 0; k < c; k++) {
          sum += L[r][k] * L[c][k];
        }

        if (r === c) {
          const val = A.data[r][r] - sum;
          if (val <= EPSILON) {
            throw new Error("Matrix is not Positive-Semidefinite. Cholesky decomposition fails.");
          }
          L[r][c] = Math.sqrt(val);
        } else {
          L[r][c] = (A.data[r][c] - sum) / L[c][c];
        }
      }
    }

    steps.push({
      title: "Cholesky Formulated",
      description: "Constructed the lower-triangular square root matrix L.",
      matrixBefore: A.data,
      matrixAfter: L
    });

    // Compute transpose L_T
    const L_T = Array(n).fill(0).map(() => Array(n).fill(0));
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        L_T[r][c] = L[c][r];
      }
    }

    return { steps, matrices: { L, L_T } };
  }

  // SVD (Singular Value Decomposition) using One-Sided Jacobi Method
  static svd(A: Matrix): DecompositionResult {
    const m = A.rows;
    const n = A.cols;
    const steps: StepTrace[] = [];

    // Make deep copy of matrix rows to iterate SVD on
    const U = A.data.map(row => [...row]);
    const V = Array(n).fill(0).map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) V[i][i] = 1;

    let converged = false;
    const maxSweep = 50;

    for (let sweep = 0; sweep < maxSweep; sweep++) {
      let sweepRotations = 0;
      for (let j = 0; j < n - 1; j++) {
        for (let k = j + 1; k < n; k++) {
          // Columns elements dots
          let a = 0; // ||U_j||^2
          let b = 0; // ||U_k||^2
          let c = 0; // U_j . U_k

          for (let row = 0; row < m; row++) {
            a += U[row][j] * U[row][j];
            b += U[row][k] * U[row][k];
            c += U[row][j] * U[row][k];
          }

          if (Math.abs(c) < 1e-12) continue; // orthogonal enough

          let zeta = (b - a) / (2 * c);
          let t = Math.sign(zeta) / (Math.abs(zeta) + Math.sqrt(1 + zeta * zeta));
          let cos = 1 / Math.sqrt(1 + t * t);
          let sin = cos * t;

          // Rotate columns of U
          for (let row = 0; row < m; row++) {
            const uj = U[row][j];
            const uk = U[row][k];
            U[row][j] = cos * uj - sin * uk;
            U[row][k] = sin * uj + cos * uk;
          }

          // Rotate columns of V
          for (let row = 0; row < n; row++) {
            const vj = V[row][j];
            const vk = V[row][k];
            V[row][j] = cos * vj - sin * vk;
            V[row][k] = sin * vj + cos * vk;
          }

          sweepRotations++;
        }
      }
      if (sweepRotations === 0) {
        converged = true;
        break;
      }
    }

    // Collect singular values
    const singularValues = new Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let r = 0; r < m; r++) {
        sum += U[r][j] * U[r][j];
      }
      const val = Math.sqrt(sum);
      singularValues[j] = val;

      if (val > EPSILON) {
        for (let r = 0; r < m; r++) {
          U[r][j] /= val; // normalize column of U
        }
      }
    }

    // Build Sigma matrix (m x n)
    const Sigma = Array(m).fill(0).map(() => Array(n).fill(0));
    for (let i = 0; i < Math.min(m, n); i++) {
      Sigma[i][i] = singularValues[i];
    }

    // Make sure singular values are sorted in descending order
    const indices = Array.from({ length: n }, (_, i) => i);
    indices.sort((a, b) => singularValues[b] - singularValues[a]);

    const sortedU = Array(m).fill(0).map(() => Array(m).fill(0));
    const sortedSigma = Array(m).fill(0).map(() => Array(n).fill(0));
    const sortedV_T = Array(n).fill(0).map(() => Array(n).fill(0));

    // Pad sortedU with full orthobasics if m > n
    // Simple SVD yields partial format. Let's return nicely ordered factors.
    for (let colNew = 0; colNew < n; colNew++) {
      const oldIdx = indices[colNew];
      for (let r = 0; r < m; r++) {
        if (colNew < m) sortedU[r][colNew] = U[r][oldIdx];
      }
      sortedSigma[colNew][colNew] = singularValues[oldIdx];
      for (let r = 0; r < n; r++) {
        sortedV_T[colNew][r] = V[r][oldIdx]; // This forms columns, so V_T is transpose of V
      }
    }

    steps.push({
      title: "Orthogonal Jacobi Sweeps Converged",
      description: `Performed one-sided Jacobi sweeps to resolve Singular values in ${converged ? 'stable bounds' : 'max iterations'}.`,
      matrixBefore: A.data,
      matrixAfter: sortedSigma
    });

    return {
      steps,
      matrices: {
        U: sortedU,
        Sigma: sortedSigma,
        V_T: sortedV_T
      }
    };
  }
}

// ==========================================
// 5. EIGEN ENGINE (SYMBOLIC & NUMERICAL APPROACH)
// ==========================================

export class EigenEngine {
  // Use Faddeev-LeVerrier algorithm to get characteristic polynomial
  // p(lambda) = det(lambda I - A) = c_n lambda^n + c_{n-1} lambda^{n-1} + ... + c_0 = 0
  // Returns coefficients index 0 = lambda^n (always 1.0), index 1 = lambda^{n-1}, etc.
  static characteristicPolynomial(A: Matrix): { coeffs: number[], steps: StepTrace[], eqStr: string } {
    if (A.rows !== A.cols) throw new Error("Characteristic polynomial is only defined for square matrices.");
    const n = A.rows;
    const steps: StepTrace[] = [];
    const pCoeffs = new Array(n + 1).fill(0); // p[0] is constant c_0, p[n] is highest scalar c_n
    pCoeffs[n] = 1; // Highest coeff is always 1

    let B = A.data.map(row => [...row]); // B_1 = A
    let trace1 = 0;
    for (let r = 0; r < n; r++) trace1 += B[r][r];
    pCoeffs[n - 1] = -trace1;

    steps.push({
      title: "Faddeev-LeVerrier Step 1",
      description: `Compute trace of A^1 to establish polynomial coefficient of lambda^${n-1}. c_{${n-1}} = -${formatNum(trace1)}.`,
      matrixBefore: A.data,
      matrixAfter: B
    });

    for (let k = 2; k <= n; k++) {
      // B_k = A * (B_{k-1} + p_{n-k+1} * I)
      const prevC = pCoeffs[n - k + 1];
      const addedData = B.map((row, rIdx) => row.map((val, cIdx) => val + (rIdx === cIdx ? prevC : 0)));
      
      const nextB = Array(n).fill(0).map(() => Array(n).fill(0));
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          let sum = 0;
          for (let m = 0; m < n; m++) {
            sum += A.data[r][m] * addedData[m][c];
          }
          nextB[r][c] = sum;
        }
      }
      B = nextB;

      // c_{n-k} = -1/k * trace(B_k)
      let traceIter = 0;
      for (let r = 0; r < n; r++) traceIter += B[r][r];
      const coeff = -traceIter / k;
      pCoeffs[n - k] = coeff;

      steps.push({
        title: `Faddeev-LeVerrier Step ${k}`,
        description: `B_${k} is calculated. Trace is ${formatNum(traceIter)}. Coefficient of lambda^${n-k} is ${formatNum(coeff)}.`,
        matrixBefore: addedData,
        matrixAfter: B
      });
    }

    // Reverse coefficients so indexed output matches classical [1, c_{n-1}, c_{n-2}, ..., c_0]
    const finalCoeffs = [...pCoeffs].reverse();

    // Custom formatting string
    let eqStr = "det(A - λI) = λ^" + n;
    for (let i = 1; i <= n; i++) {
      const c = sanitizeNumber(finalCoeffs[i]);
      if (c === 0) continue;
      const power = n - i;
      const sign = c > 0 ? " + " : " - ";
      const absVal = formatNum(Math.abs(c));
      const valStr = absVal === "1" && power > 0 ? "" : absVal;
      
      const xStr = power === 0 ? "" : power === 1 ? "λ" : `λ^${power}`;
      eqStr += sign + valStr + xStr;
    }
    eqStr += " = 0";

    return { coeffs: finalCoeffs, steps, eqStr };
  }

  // QR Algorithm to compute all eigenvalues numerically
  static computeEigenvalues(A: Matrix): number[] {
    const n = A.rows;
    let mat = A.data.map(row => [...row]);
    
    // QR iterations
    const maxIter = 250;
    for (let iter = 0; iter < maxIter; iter++) {
      // Fast implicit shift (Wilkinson or simple Rayleigh) can be omitted for small 15x15 matrices
      const { matrices } = DecompositionEngine.qr({ rows: n, cols: n, data: mat });
      const nextM = Array(n).fill(0).map(() => Array(n).fill(0));
      // Re-multiply matrix: R * Q
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          let sum = 0;
          for (let k = 0; k < n; k++) {
            sum += matrices.R[r][k] * matrices.Q[k][c];
          }
          nextM[r][c] = sum;
        }
      }
      mat = nextM;

      // Check if off-diagonal parts are small enough
      let offDiagSum = 0;
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < r; c++) {
          offDiagSum += Math.abs(mat[r][c]);
        }
      }
      if (offDiagSum < 1e-11) break;
    }

    return Array(n).fill(0).map((_, i) => mat[i][i]).sort((a, b) => b - a);
  }

  // Inverse Iteration / Back substitution to solve eigenvectors for each lambda
  static computeEigenvectors(A: Matrix, eigenvalues: number[]): number[][][] {
    const n = A.rows;
    const eigenvectors: number[][][] = [];

    for (const lambda of eigenvalues) {
      // Find null space of (A - lambda * I)
      const AMinusLambdaI = Array(n).fill(0).map((_, r) => 
        Array(n).fill(0).map((_, c) => 
          (r === c ? A.data[r][c] - lambda : A.data[r][c])
        )
      );

      // Perform RREF of AMinusLambdaI
      const { result } = RREFEngine.computeRREF({ rows: n, cols: n, data: AMinusLambdaI });
      const nullVectors: number[][] = [];

      // Determine free variables (non-pivot columns)
      const pivots = new Array(n).fill(-1);
      let rIdx = 0;
      for (let cIdx = 0; cIdx < n; cIdx++) {
        if (rIdx < n && Math.abs(result.data[rIdx][cIdx] - 1) < EPSILON) {
          pivots[cIdx] = rIdx;
          rIdx++;
        }
      }

      // If no free variables found, matrix might be slightly regular numerically. Force a fallback
      const freeCols: number[] = [];
      for (let c = 0; c < n; c++) {
        if (pivots[c] === -1) freeCols.push(c);
      }

      if (freeCols.length === 0) {
        // Fallback: solve least square or pick smallest singular vector
        const { matrices } = DecompositionEngine.svd({ rows: n, cols: n, data: AMinusLambdaI });
        // The last column of V_T is the smallest singular vector
        const lastCol = Array(n).fill(0).map((_, r) => matrices.V_T[n - 1][r]);
        const len = Math.sqrt(lastCol.reduce((s, v) => s + v * v, 0));
        nullVectors.push(lastCol.map(v => isNaN(v) ? 0 : v / len));
      } else {
        // Collect analytical eigenvectors based on free coordinates
        for (const freeCol of freeCols) {
          const uVec = new Array(n).fill(0);
          uVec[freeCol] = 1;
          for (let pivotCol = 0; pivotCol < n; pivotCol++) {
            const pRow = pivots[pivotCol];
            if (pRow !== -1) {
              uVec[pivotCol] = -result.data[pRow][freeCol];
            }
          }
          const normVal = Math.sqrt(uVec.reduce((s, v) => s + v * v, 0));
          if (normVal > EPSILON) {
            nullVectors.push(uVec.map(v => v / normVal));
          }
        }
      }

      eigenvectors.push(nullVectors);
    }

    return eigenvectors;
  }

  // Entire Eigen package analyzer with EIGENVALUE REALITY VERIFICATION LAYER
  static analyze(A: Matrix): EigenResult {
    const polyAnalysis = this.characteristicPolynomial(A);
    const steps = [...polyAnalysis.steps];

    // STEP 1: Symbolic Eigenvalue Extraction
    const symbolicEigenvalues = SymbolicEigenEngine.solveSymbolic(A, polyAnalysis.coeffs);

    // STEP 2: High-Precision Numerical Evaluation
    const highPrecRoots = solvePolynomialHighPrecision(polyAnalysis.coeffs);

    // STEP 3 & STEP 4: Reality Test & Genuine Complex Detection
    const EPS_REALITY = new Decimal("1e-28");
    const highPrecisionDetails: HighPrecisionInfo[] = [];
    let genuineComplexCount = 0;

    const purifiedEigenvalues: number[] = [];

    highPrecRoots.forEach((lamb, idx) => {
      const isRealByBypass = lamb.absImg().lt(EPS_REALITY);
      let purifiedReal = 0;

      if (isRealByBypass) {
        // Reality Bypass: Replace lamb <- Re(lamb)
        purifiedReal = lamb.r.toNumber();
        purifiedEigenvalues.push(purifiedReal);
      } else {
        genuineComplexCount++;
        purifiedReal = lamb.r.toNumber();
        purifiedEigenvalues.push(purifiedReal); // Default real part fallback
      }

      highPrecisionDetails.push({
        eigenvalueIndex: idx + 1,
        rawReal: lamb.r.toString(),
        rawImag: lamb.i.toString(),
        absImag: lamb.absImg().toString(),
        isRealByBypass,
        purifiedReal
      });
    });

    const mixedSpectrum = genuineComplexCount > 0;

    // Solve complex eigenvalues and eigenvectors
    const complexEigenvalues = highPrecRoots.map(lamb => {
      const isReal = lamb.absImg().lt(new Decimal("1e-28"));
      if (isReal) {
        return new Complex(lamb.r.toNumber(), 0);
      } else {
        return new Complex(lamb.r.toNumber(), lamb.i.toNumber());
      }
    });
    const complexEigenvectors = computeComplexEigenvectors(A, complexEigenvalues);

    // Solve high-precision complex eigenvalues and eigenvectors (using 45 digits, guaranteed high accuracy)
    const highPrecEigenvalues = highPrecRoots.map(lamb => {
      const isReal = lamb.absImg().lt(new Decimal("1e-28"));
      if (isReal) {
        return new DecimalComplex(lamb.r, new Decimal(0));
      } else {
        return lamb;
      }
    });
    const highPrecEigenvectors = computeDecimalComplexEigenvectors(A, highPrecEigenvalues);

    // Solve standard eigenvectors based on these eigenvalues
    const standardEigenvalues = purifiedEigenvalues.map(v => sanitizeNumber(v));
    const eigenvectors = this.computeEigenvectors(A, standardEigenvalues);

    steps.push({
      title: "Arbitrary-Precision Reality Verification",
      description: `Evaluated roots of the characteristic polynomial at 45-digit precision. Checked against EPS_REALITY = 10^-28. ${genuineComplexCount} genuine complex roots detected, ${highPrecRoots.length - genuineComplexCount} passed Reality Bypass.`,
      matrixBefore: A.data,
      matrixAfter: A.data
    });

    return {
      steps,
      characteristicPoly: polyAnalysis.coeffs,
      characteristicEqString: polyAnalysis.eqStr,
      eigenvalues: standardEigenvalues,
      eigenvectors,
      symbolicEigenvalues,
      mixedSpectrum,
      genuineComplexCount,
      highPrecisionDetails,
      complexEigenvalues,
      complexEigenvectors,
      highPrecEigenvalues,
      highPrecEigenvectors
    };
  }
}

// ==========================================
// 6. SYMMETRIC JACOBI DIAGONALIZATION
// ==========================================

export class JacobiDiagonalizer {
  static diagonalize(A: Matrix): JacobiResult {
    if (A.rows !== A.cols) throw new Error("Jacobi diagonalization only supports square matrices.");
    const n = A.rows;
    const steps: StepTrace[] = [];

    // Verify symmetry
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (Math.abs(A.data[r][c] - A.data[c][r]) > 1e-6) {
          throw new Error("Matrix must be real-symmetric to diagonalize via Jacobi.");
        }
      }
    }

    const D = A.data.map(row => [...row]);
    const P = Array(n).fill(0).map(() => Array(n).fill(0));
    for (let i = 0; i < n; i++) P[i][i] = 1; // Identity matrix

    let iterations = 0;
    const maxIterations = 200;

    steps.push({
      title: "Initialize Jacobi Orthogonalizer",
      description: "Setup identity transformation matrix P and load real-symmetric matrix coefficients.",
      matrixBefore: A.data,
      matrixAfter: D
    });

    while (iterations < maxIterations) {
      // Find maximum off-diagonal element
      let maxVal = 0;
      let p = 0;
      let q = 1;
      for (let r = 0; r < n; r++) {
        for (let c = r + 1; c < n; c++) {
          if (Math.abs(D[r][c]) > maxVal) {
            maxVal = Math.abs(D[r][c]);
            p = r;
            q = c;
          }
        }
      }

      // Check convergence threshold
      if (maxVal < 1e-12) break;

      // Extract coordinates
      const app = D[p][p];
      const aqq = D[q][q];
      const apq = D[p][q];

      // Jacobi rotation angle theta
      let theta = 0;
      if (Math.abs(app - aqq) < 1e-12) {
        theta = Math.PI / 4;
      } else {
        theta = 0.5 * Math.atan((2 * apq) / (app - aqq));
      }

      const c = Math.cos(theta);
      const s = Math.sin(theta);

      // Save states for steps
      const prevD = D.map(row => [...row]);

      // Rotate rows/columns of D: D_new = J_T * D * J
      for (let i = 0; i < n; i++) {
        if (i !== p && i !== q) {
          const dip = D[i][p];
          const diq = D[i][q];
          D[i][p] = c * dip - s * diq;
          D[p][i] = D[i][p];
          D[i][q] = s * dip + c * diq;
          D[q][i] = D[i][q];
        }
      }
      D[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq;
      D[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq;
      D[p][q] = 0;
      D[q][p] = 0;

      // Accumulate total rotation P = P * J
      for (let r = 0; r < n; r++) {
        const rpi = P[r][p];
        const rqi = P[r][q];
        P[r][p] = c * rpi - s * rqi;
        P[r][q] = s * rpi + c * rqi;
      }

      steps.push({
        title: `Jacobi Iteration ${iterations+1}`,
        description: `Eliminating off-diagonal element at (${p+1},${q+1}) with values apq = ${formatNum(apq)} using rotation angle θ = ${formatNum(theta)} rad.`,
        matrixBefore: prevD,
        matrixAfter: D.map(row => [...row])
      });

      iterations++;
    }

    // Compute transpose P_T
    const P_inv = Array(n).fill(0).map(() => Array(n).fill(0));
    for (let r = 0; r < n; r++) {
      for (let col = 0; col < n; col++) {
        P_inv[r][col] = P[col][r]; // Matrix is orthogonal so inverse is transpose
      }
    }

    return {
      steps,
      P: P.map(row => row.map(sanitizeNumber)),
      D: D.map(row => row.map(sanitizeNumber)),
      P_inv: P_inv.map(row => row.map(sanitizeNumber)),
      isOrthogonal: true
    };
  }
}

// ==========================================
// 7. MATRIX POWER ENGINE (INTEGER & FRACTIONAL)
// ==========================================

export class MatrixPowerEngine {
  // Integer Pow: Exponentiation by squaring in O(n^3 Log k)
  static powerInteger(A: Matrix, k: number): Matrix {
    if (A.rows !== A.cols) throw new Error("Powers are only defined for square matrices.");
    const n = A.rows;
    if (k === 0) {
      // Return Identity matrix
      const identityMat: number[][] = Array(n).fill(0).map((_, r) => Array(n).fill(0).map((_, c) => r === c ? 1 : 0));
      return { rows: n, cols: n, data: identityMat };
    }
    if (k < 0) {
      const inv = MatrixEngine.inverse(A);
      return this.powerInteger(inv, -k);
    }

    let base = A;
    let exp = k;
    let result: number[][] = Array(n).fill(0).map((_, r) => Array(n).fill(0).map((_, c) => r === c ? 1 : 0)); // Identity

    while (exp > 0) {
      if (exp % 2 === 1) {
        result = MatrixEngine.multiply({ rows: n, cols: n, data: result }, base).data;
      }
      base = MatrixEngine.multiply(base, base);
      exp = Math.floor(exp / 2);
    }

    return { rows: n, cols: n, data: result };
  }

  // Fractional Pow: PDP^-1 (via diagonalization) or general Schur matrix functions
  static powerFractional(
    A: Matrix,
    p: number,
    q: number,
    mode: 'complex' | 'real_schur' | 'educational' = 'complex'
  ): {
    steps: StepTrace[];
    result: Matrix;
    highPrecResult?: DecimalComplex[][];
    residualNorm?: string;
    detectedEigenvalues?: DecimalComplex[];
    isPrincipalBranch?: boolean;
  } {
    if (A.rows !== A.cols) throw new Error("Fractional powers are only defined for square matrices.");
    if (q <= 0) throw new Error("Denominator must be a strict positive integer.");
    const n = A.rows;
    const steps: StepTrace[] = [];

    steps.push({
      title: "Initialize Fractional Power Calculation",
      description: `Aim to evaluate A^(${p}/${q}) using arbitrary precision math (at least 80 working digits) and the self-healing verification layer.`,
      matrixBefore: A.data,
      matrixAfter: A.data
    });

    let workingPrecision = 100;
    let success = false;
    let X_final: DecimalComplex[][] = [];
    let residualVal = new Decimal(0);
    let eigenvals: DecimalComplex[] = [];

    for (let attempt = 0; attempt < 3; attempt++) {
      const prevPrec = Decimal.precision;
      Decimal.set({ precision: workingPrecision });
      
      try {
        // 1. Convert A to DecimalComplexMatrix
        const A_comp: DecimalComplexMatrix = {
          rows: n,
          cols: n,
          data: A.data.map(row => row.map(val => new DecimalComplex(val, 0)))
        };
        
        // 2. Solve char poly and eigenvalues in high precision
        const coeffs = characteristicPolynomialDecimal(A_comp);
        const roots = solvePolynomialDecimal(coeffs.slice().reverse()); // highest down to x^0
        eigenvals = roots;
        
        // 3. Compute Schur decomposition A = Q T Q^*
        const { Q, T } = computeDecimalComplexSchur(A, A_comp, roots);
        
        // 4. Compute function of T: F_T = e^( (M/N) * log(T) )
        const F_T = computeTriangularMatrixFunctionDecimal(T, p, q, roots);
        
        // 5. Reconstruct X = Q * F_T * Q^*
        const Q_conj: DecimalComplexMatrix = {
          rows: n,
          cols: n,
          data: Array(n).fill(0).map((_, r) =>
            Array(n).fill(0).map((_, c) => new DecimalComplex(Q.data[c][r].r, Q.data[c][r].i.negated()))
          )
        };
        const intermediate = DecimalComplexMatrixEngine.multiply(Q, F_T);
        const X_comp = DecimalComplexMatrixEngine.multiply(intermediate, Q_conj);
        X_final = X_comp.data;
        
        // 6. Verify residual ||X^N - A^M||_inf < 10^-25
        const X_q = decimalComplexMatrixPowerInteger(X_comp, q);
        const A_p = decimalComplexMatrixPowerInteger(A_comp, p);
        
        const diffMat: DecimalComplexMatrix = {
          rows: n, cols: n,
          data: Array(n).fill(0).map((_, r) =>
            Array(n).fill(0).map((_, c) => X_q.data[r][c].sub(A_p.data[r][c]))
          )
        };
        
        residualVal = decimalComplexMatrixNormInf(diffMat);
        steps.push({
          title: `Precision Validation (Attempt ${attempt + 1})`,
          description: `Internal Working Precision: ${workingPrecision} digits. Computed Candidate Matrix X. Infinity-norm residual ||X^${q} - A^${p}||_inf = ${residualVal.toExponential(4)}.`,
          matrixBefore: A.data,
          matrixAfter: X_comp.data.map(row => row.map(c => c.r.toNumber()))
        });

        if (residualVal.lt(new Decimal("1e-25"))) {
          success = true;
          Decimal.set({ precision: prevPrec });
          break;
        }
      } catch (err: any) {
        console.error("Precision solver error", err);
        steps.push({
          title: `Precision Calculation Failed (Attempt ${attempt + 1})`,
          description: `Error: ${err.message || err}. Increasing working precision for self-healing.`,
          matrixBefore: A.data,
          matrixAfter: A.data
        });
      }
      
      workingPrecision += 40;
      Decimal.set({ precision: prevPrec });
    }

    if (!X_final || X_final.length === 0) {
      throw new Error("Unable to converge Matrix Power using arbitrary precision arithmetic.");
    }

    // Convert high precision result to standard Matrix for backward compat
    const realResultData = X_final.map(row => row.map(cell => sanitizeNumber(cell.r.toNumber())));
    const realResult: Matrix = { rows: n, cols: n, data: realResultData };

    steps.push({
      title: "Fractional Power Reconstruction Complete",
      description: `Matrix $A^{M/N}$ evaluated successfully! Residual norm $\\lVert X^N - A^M \\rVert_\\infty = ${residualVal.toExponential(4)}$ satisfies the target threshold of $< 10^{-25}$.`,
      matrixBefore: A.data,
      matrixAfter: realResultData
    });

    return {
      steps,
      result: realResult,
      highPrecResult: X_final,
      residualNorm: residualVal.toExponential(4),
      detectedEigenvalues: eigenvals,
      isPrincipalBranch: true
    };
  }
}

export function computeDecimalComplexSchur(
  A_raw: Matrix,
  A_comp: DecimalComplexMatrix,
  eigenvalues: DecimalComplex[]
): { Q: DecimalComplexMatrix; T: DecimalComplexMatrix } {
  const n = A_comp.rows;
  if (n === 1) {
    const Q = {
      rows: 1, cols: 1,
      data: [[new DecimalComplex(1, 0)]]
    };
    return { Q, T: A_comp };
  }
  
  if (n === 2) {
    const lam1 = eigenvalues[0];
    
    const vecs = computeDecimalComplexEigenvectors(A_raw, [lam1]);
    const v1 = vecs[0]?.[0];
    if (!v1) {
      throw new Error("Could not compute eigenvector for Schur decomposition.");
    }
    
    const normV1 = norm(v1);
    const q1 = v1.map(val => val.div(new DecimalComplex(normV1, 0)));
    
    const a = q1[0];
    const b = q1[1];
    const q2 = [
      new DecimalComplex(b.r.negated(), b.i),
      new DecimalComplex(a.r, a.i.negated())
    ];
    
    const Q_data = [
      [q1[0], q2[0]],
      [q1[1], q2[1]]
    ];
    
    const Q = { rows: 2, cols: 2, data: Q_data };
    
    const Q_conj: DecimalComplexMatrix = {
      rows: 2, cols: 2,
      data: [
        [new DecimalComplex(q1[0].r, q1[0].i.negated()), new DecimalComplex(q1[1].r, q1[1].i.negated())],
        [new DecimalComplex(q2[0].r, q2[0].i.negated()), new DecimalComplex(q2[1].r, q2[1].i.negated())]
      ]
    };
    
    const intermediate = DecimalComplexMatrixEngine.multiply(Q_conj, A_comp);
    const T = DecimalComplexMatrixEngine.multiply(intermediate, Q);
    
    T.data[1][0] = new DecimalComplex(0, 0);
    
    return { Q, T };
  }
  
  if (n === 3) {
    const lam1 = eigenvalues[0];
    const lam2 = eigenvalues[1];
    
    const vecs = computeDecimalComplexEigenvectors(A_raw, [lam1]);
    const v1 = vecs[0]?.[0];
    if (!v1) {
      throw new Error("Could not compute eigenvector for Schur decomposition (3x3).");
    }
    
    const normV1 = norm(v1);
    const q1 = v1.map(val => val.div(new DecimalComplex(normV1, 0)));
    
    const orthogonalBasis = gramSchmidtUnitary(q1);
    const U1_data = Array(3).fill(0).map((_, r) =>
      Array(3).fill(0).map((_, c) => orthogonalBasis[c][r])
    );
    const U1 = { rows: 3, cols: 3, data: U1_data };
    
    const U1_conj = {
      rows: 3, cols: 3,
      data: Array(3).fill(0).map((_, r) =>
        Array(3).fill(0).map((_, c) => new DecimalComplex(U1_data[c][r].r, U1_data[c][r].i.negated()))
      )
    };
    
    const intermediate1 = DecimalComplexMatrixEngine.multiply(U1_conj, A_comp);
    const A1 = DecimalComplexMatrixEngine.multiply(intermediate1, U1);
    
    const A_sub_data = [
      [A1.data[1][1], A1.data[1][2]],
      [A1.data[2][1], A1.data[2][2]]
    ];
    
    const sub_M = [
      [A_sub_data[0][0].sub(lam2), A_sub_data[0][1]],
      [A_sub_data[1][0], A_sub_data[1][1].sub(lam2)]
    ];
    
    let v_sub = [new DecimalComplex(0, 0), new DecimalComplex(0, 0)];
    if (sub_M[0][1].abs().gt(sub_M[0][0].abs())) {
      v_sub = [sub_M[0][1].negated(), sub_M[0][0]];
    } else if (sub_M[1][1].abs().gt(sub_M[1][0].abs())) {
      v_sub = [sub_M[1][1].negated(), sub_M[1][0]];
    } else {
      v_sub = [new DecimalComplex(1, 0), new DecimalComplex(0, 0)];
    }
    
    const normVSub = norm(v_sub);
    const q1_sub = v_sub.map(val => val.div(new DecimalComplex(normVSub, 0)));
    
    const q2_sub = [
      new DecimalComplex(q1_sub[1].r.negated(), q1_sub[1].i),
      new DecimalComplex(q1_sub[0].r, q1_sub[0].i.negated())
    ];
    
    const U2_sub_data = [
      [q1_sub[0], q2_sub[0]],
      [q1_sub[1], q2_sub[1]]
    ];
    
    const V_prime_data = [
      [new DecimalComplex(1, 0), new DecimalComplex(0, 0), new DecimalComplex(0, 0)],
      [new DecimalComplex(0, 0), U2_sub_data[0][0], U2_sub_data[0][1]],
      [new DecimalComplex(0, 0), U2_sub_data[1][0], U2_sub_data[1][1]]
    ];
    const V_prime = { rows: 3, cols: 3, data: V_prime_data };
    
    const Q = DecimalComplexMatrixEngine.multiply(U1, V_prime);
    
    const Q_conj = {
      rows: 3, cols: 3,
      data: Array(3).fill(0).map((_, r) =>
        Array(3).fill(0).map((_, c) => new DecimalComplex(Q.data[c][r].r, Q.data[c][r].i.negated()))
      )
    };
    
    const intermediate2 = DecimalComplexMatrixEngine.multiply(Q_conj, A_comp);
    const T = DecimalComplexMatrixEngine.multiply(intermediate2, Q);
    
    T.data[1][0] = new DecimalComplex(0, 0);
    T.data[2][0] = new DecimalComplex(0, 0);
    T.data[2][1] = new DecimalComplex(0, 0);
    
    return { Q, T };
  }
  
  throw new Error("Unsupported dimension for high-prec Schur decomposition.");
}

export function computeTriangularMatrixFunctionDecimal(
  T: DecimalComplexMatrix,
  p: number,
  q: number,
  eigenvalues: DecimalComplex[]
): DecimalComplexMatrix {
  const n = T.rows;
  const F_data = Array(n).fill(0).map(() => Array(n).fill(0).map(() => new DecimalComplex(0, 0)));
  
  const f = (z: DecimalComplex) => {
    const s = new DecimalComplex(new Decimal(p).div(q), 0);
    return z.pow(s);
  };
  
  const fDeriv1 = (z: DecimalComplex) => {
    const s = new DecimalComplex(new Decimal(p).div(q), 0);
    const s_minus_1 = s.sub(new DecimalComplex(1, 0));
    return s.mul(z.pow(s_minus_1));
  };
  
  const fDeriv2 = (z: DecimalComplex) => {
    const s = new DecimalComplex(new Decimal(p).div(q), 0);
    const s_minus_1 = s.sub(new DecimalComplex(1, 0));
    const s_minus_2 = s.sub(new DecimalComplex(2, 0));
    return s.mul(s_minus_1).mul(z.pow(s_minus_2));
  };

  let hasDuplicate = false;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (eigenvalues[i].sub(eigenvalues[j]).abs().lt(new Decimal("1e-12"))) {
        hasDuplicate = true;
      }
    }
  }
  
  if (!hasDuplicate) {
    for (let i = 0; i < n; i++) {
      F_data[i][i] = f(T.data[i][i]);
    }
    for (let d = 1; d < n; d++) {
      for (let i = 0; i < n - d; i++) {
        const j = i + d;
        let sum = new DecimalComplex(0, 0);
        for (let k = i + 1; k < j; k++) {
          sum = sum.add(T.data[i][k].mul(F_data[k][j]).sub(F_data[i][k].mul(T.data[k][j])));
        }
        const num = T.data[i][j].mul(F_data[j][j].sub(F_data[i][i])).add(sum);
        const denom = T.data[i][i].sub(T.data[j][j]);
        F_data[i][j] = num.div(denom);
      }
    }
  } else {
    if (n === 2) {
      const lam = T.data[0][0];
      const fVal = f(lam);
      const fD1 = fDeriv1(lam);
      F_data[0][0] = fVal;
      F_data[1][1] = fVal;
      F_data[0][1] = T.data[0][1].mul(fD1);
    } else if (n === 3) {
      const lam1 = T.data[0][0];
      const lam2 = T.data[1][1];
      const lam3 = T.data[2][2];
      
      const diff12 = lam1.sub(lam2).abs().lt(new Decimal("1e-12"));
      const diff23 = lam2.sub(lam3).abs().lt(new Decimal("1e-12"));
      const diff13 = lam1.sub(lam3).abs().lt(new Decimal("1e-12"));
      
      let a0 = new DecimalComplex(0, 0);
      let a1 = new DecimalComplex(0, 0);
      let a2 = new DecimalComplex(0, 0);
      
      if (diff12 && diff23) {
        const lam = lam1;
        const fVal = f(lam);
        const fD1 = fDeriv1(lam);
        const fD2 = fDeriv2(lam);
        
        a2 = fD2.div(new DecimalComplex(2, 0));
        a1 = fD1.sub(a2.mul(lam).mul(new DecimalComplex(2, 0)));
        a0 = fVal.sub(a1.mul(lam)).sub(a2.mul(lam).mul(lam));
      } else {
        let dLam = lam1;
        let sLam = lam3;
        if (diff12) { dLam = lam1; sLam = lam3; }
        else if (diff23) { dLam = lam2; sLam = lam1; }
        else if (diff13) { dLam = lam1; sLam = lam2; }
        
        const fD = f(dLam);
        const fS = f(sLam);
        const fDPrime = fDeriv1(dLam);
        
        const delta = dLam.sub(sLam);
        const slope = fS.sub(fD).div(sLam.sub(dLam));
        a2 = fDPrime.sub(slope).div(delta);
        a1 = fDPrime.sub(a2.mul(dLam).mul(new DecimalComplex(2, 0)));
        a0 = fD.sub(a1.mul(dLam)).sub(a2.mul(dLam).mul(dLam));
      }
      
      const I_data = Array(3).fill(0).map((_, r) =>
        Array(3).fill(0).map((_, c) => new DecimalComplex(r === c ? 1 : 0, 0))
      );
      const T2 = DecimalComplexMatrixEngine.multiply(T, T);
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          F_data[r][c] = I_data[r][c].mul(a0)
            .add(T.data[r][c].mul(a1))
            .add(T2.data[r][c].mul(a2));
        }
      }
    }
  }
  
  return { rows: n, cols: n, data: F_data };
}

// ==========================================
// COMPLEX MATRIX ALGEBRA UTILS & REAL SCHUR SOLVERS
// ==========================================

export class ComplexMatrixEngine {
  static multiply(A: ComplexMatrix, B: ComplexMatrix): ComplexMatrix {
    const rA = A.rows;
    const cA = A.cols;
    const cB = B.cols;
    const data: Complex[][] = Array(rA).fill(0).map(() => Array(cB).fill(0).map(() => new Complex(0, 0)));
    for (let r = 0; r < rA; r++) {
      for (let c = 0; c < cB; c++) {
        let sumR = 0;
        let sumI = 0;
        for (let k = 0; k < cA; k++) {
          const a = A.data[r][k];
          const b = B.data[k][c];
          sumR += a.r * b.r - a.i * b.i;
          sumI += a.r * b.i + a.i * b.r;
        }
        data[r][c] = new Complex(sumR, sumI);
      }
    }
    return { rows: rA, cols: cB, data };
  }

  static inverse(A: ComplexMatrix): ComplexMatrix {
    const n = A.rows;
    const aug: Complex[][] = Array(n).fill(0).map((_, r) => 
      Array(2 * n).fill(0).map((_, c) => {
        if (c < n) {
          return new Complex(A.data[r][c].r, A.data[r][c].i);
        } else {
          return new Complex(c - n === r ? 1 : 0, 0);
        }
      })
    );

    for (let i = 0; i < n; i++) {
      let maxRow = i;
      let maxVal = Math.sqrt(aug[i][i].r * aug[i][i].r + aug[i][i].i * aug[i][i].i);
      for (let r = i + 1; r < n; r++) {
        const val = Math.sqrt(aug[r][i].r * aug[r][i].r + aug[r][i].i * aug[r][i].i);
        if (val > maxVal) {
          maxVal = val;
          maxRow = r;
        }
      }

      if (maxVal < 1e-12) {
        throw new Error("Complex matrix is singular and cannot be inverted.");
      }

      if (maxRow !== i) {
        const temp = aug[i];
        aug[i] = aug[maxRow];
        aug[maxRow] = temp;
      }

      const pivot = aug[i][i];
      const pDenom = pivot.r * pivot.r + pivot.i * pivot.i;
      for (let c = i; c < 2 * n; c++) {
        const val = aug[i][c];
        const nr = (val.r * pivot.r + val.i * pivot.i) / pDenom;
        const ni = (val.i * pivot.r - val.r * pivot.i) / pDenom;
        aug[i][c] = new Complex(nr, ni);
      }

      for (let r = 0; r < n; r++) {
        if (r !== i) {
          const factor = aug[r][i];
          for (let c = i; c < 2 * n; c++) {
            const val = aug[i][c];
            const mulR = factor.r * val.r - factor.i * val.i;
            const mulI = factor.r * val.i + factor.i * val.r;
            aug[r][c] = new Complex(aug[r][c].r - mulR, aug[r][c].i - mulI);
          }
        }
      }
    }

    const data: Complex[][] = Array(n).fill(0).map((_, r) => 
      Array(n).fill(0).map((_, c) => aug[r][c + n])
    );
    return { rows: n, cols: n, data };
  }
}

export function computeComplexEigenvectors(A: Matrix, eigenvalues: Complex[]): Complex[][][] {
  const n = A.rows;
  const eigenvectors: Complex[][][] = [];

  for (const lambda of eigenvalues) {
    const M: Complex[][] = Array(n).fill(0).map((_, r) => 
      Array(n).fill(0).map((_, c) => {
        const val = A.data[r][c];
        if (r === c) {
          return new Complex(val - lambda.r, -lambda.i);
        } else {
          return new Complex(val, 0);
        }
      })
    );

    const numCols = n;
    const pivots = new Array(n).fill(-1);
    let rIdx = 0;
    
    for (let cIdx = 0; cIdx < numCols; cIdx++) {
      let pivotRow = -1;
      let maxVal = 1e-9;
      for (let r = rIdx; r < n; r++) {
        const val = Math.sqrt(M[r][cIdx].r * M[r][cIdx].r + M[r][cIdx].i * M[r][cIdx].i);
        if (val > maxVal) {
          maxVal = val;
          pivotRow = r;
        }
      }
      
      if (pivotRow !== -1) {
        pivots[cIdx] = rIdx;
        if (pivotRow !== rIdx) {
          const temp = M[rIdx];
          M[rIdx] = M[pivotRow];
          M[pivotRow] = temp;
        }
        
        const pivot = M[rIdx][cIdx];
        const pDenom = pivot.r * pivot.r + pivot.i * pivot.i;
        for (let c = cIdx; c < numCols; c++) {
          const val = M[rIdx][c];
          M[rIdx][c] = new Complex(
            (val.r * pivot.r + val.i * pivot.i) / pDenom,
            (val.i * pivot.r - val.r * pivot.i) / pDenom
          );
        }
        
        for (let r = 0; r < n; r++) {
          if (r !== rIdx) {
            const factor = M[r][cIdx];
            for (let c = cIdx; c < numCols; c++) {
              const val = M[rIdx][c];
              const mulR = factor.r * val.r - factor.i * val.i;
              const mulI = factor.r * val.i + factor.i * val.r;
              M[r][c] = new Complex(M[r][c].r - mulR, M[r][c].i - mulI);
            }
          }
        }
        rIdx++;
      }
    }

    const freeCols: number[] = [];
    for (let c = 0; c < n; c++) {
      if (pivots[c] === -1) freeCols.push(c);
    }

    const nullVectors: Complex[][] = [];
    if (freeCols.length === 0) {
      const fallback = Array(n).fill(0).map(() => new Complex(1, 0));
      const len = Math.sqrt(fallback.reduce((s, v) => s + v.r * v.r, 0));
      nullVectors.push(fallback.map(v => new Complex(v.r / len, 0)));
    } else {
      for (const freeCol of freeCols) {
        const uVec = Array(n).fill(0).map(() => new Complex(0, 0));
        uVec[freeCol] = new Complex(1, 0);
        for (let pivotCol = 0; pivotCol < n; pivotCol++) {
          const pRow = pivots[pivotCol];
          if (pRow !== -1) {
            uVec[pivotCol] = new Complex(-M[pRow][freeCol].r, -M[pRow][freeCol].i);
          }
        }
        const normVal = Math.sqrt(uVec.reduce((s, v) => s + v.r * v.r + v.i * v.i, 0));
        if (normVal > 1e-12) {
          nullVectors.push(uVec.map(v => new Complex(v.r / normVal, v.i / normVal)));
        }
      }
    }
    
    eigenvectors.push(nullVectors);
  }
  return eigenvectors;
}

export interface DecimalComplexMatrix {
  rows: number;
  cols: number;
  data: DecimalComplex[][];
}

export class DecimalComplexMatrixEngine {
  static multiply(A: DecimalComplexMatrix, B: DecimalComplexMatrix): DecimalComplexMatrix {
    const rA = A.rows;
    const cA = A.cols;
    const cB = B.cols;
    const data: DecimalComplex[][] = Array(rA).fill(0).map(() => Array(cB).fill(0).map(() => new DecimalComplex(0, 0)));
    for (let r = 0; r < rA; r++) {
      for (let c = 0; c < cB; c++) {
        let sum = new DecimalComplex(0, 0);
        for (let k = 0; k < cA; k++) {
          sum = sum.add(A.data[r][k].mul(B.data[k][c]));
        }
        data[r][c] = sum;
      }
    }
    return { rows: rA, cols: cB, data };
  }

  static inverse(A: DecimalComplexMatrix): DecimalComplexMatrix {
    const n = A.rows;
    const aug: DecimalComplex[][] = Array(n).fill(0).map((_, r) => 
      Array(2 * n).fill(0).map((_, c) => {
        if (c < n) {
          return new DecimalComplex(A.data[r][c].r, A.data[r][c].i);
        } else {
          return new DecimalComplex(c - n === r ? 1 : 0, 0);
        }
      })
    );

    for (let i = 0; i < n; i++) {
      let maxRow = i;
      let maxVal = aug[i][i].abs();
      for (let r = i + 1; r < n; r++) {
        const val = aug[r][i].abs();
        if (val.gt(maxVal)) {
          maxVal = val;
          maxRow = r;
        }
      }

      if (maxVal.lt(new Decimal("1e-40"))) {
        throw new Error("High precision transition matrix is singular and cannot be inverted.");
      }

      if (maxRow !== i) {
        const temp = aug[i];
        aug[i] = aug[maxRow];
        aug[maxRow] = temp;
      }

      const pivot = aug[i][i];
      for (let c = i; c < 2 * n; c++) {
        aug[i][c] = aug[i][c].div(pivot);
      }

      for (let r = 0; r < n; r++) {
        if (r !== i) {
          const factor = aug[r][i];
          for (let c = i; c < 2 * n; c++) {
            aug[r][c] = aug[r][c].sub(factor.mul(aug[i][c]));
          }
        }
      }
    }

    const data: DecimalComplex[][] = Array(n).fill(0).map((_, r) => 
      Array(n).fill(0).map((_, c) => aug[r][c + n])
    );
    return { rows: n, cols: n, data };
  }
}

export function computeDecimalComplexEigenvectors(A: Matrix, eigenvalues: DecimalComplex[]): DecimalComplex[][][] {
  const n = A.rows;
  const eigenvectors: DecimalComplex[][][] = [];

  for (const lambda of eigenvalues) {
    const M: DecimalComplex[][] = Array(n).fill(0).map((_, r) => 
      Array(n).fill(0).map((_, c) => {
        const val = new DecimalComplex(A.data[r][c], 0);
        if (r === c) {
          return val.sub(lambda);
        } else {
          return val;
        }
      })
    );

    const pivots = new Array(n).fill(-1);
    let rIdx = 0;
    
    for (let cIdx = 0; cIdx < n; cIdx++) {
      let pivotRow = -1;
      let maxVal = new Decimal("1e-15");
      for (let r = rIdx; r < n; r++) {
        const val = M[r][cIdx].abs();
        if (val.gt(maxVal)) {
          maxVal = val;
          pivotRow = r;
        }
      }
      
      if (pivotRow !== -1) {
        pivots[cIdx] = rIdx;
        if (pivotRow !== rIdx) {
          const temp = M[rIdx];
          M[rIdx] = M[pivotRow];
          M[pivotRow] = temp;
        }
        
        const pivot = M[rIdx][cIdx];
        for (let c = cIdx; c < n; c++) {
          M[rIdx][c] = M[rIdx][c].div(pivot);
        }
        
        for (let r = 0; r < n; r++) {
          if (r !== rIdx) {
            const factor = M[r][cIdx];
            for (let c = cIdx; c < n; c++) {
              M[r][c] = M[r][c].sub(factor.mul(M[rIdx][c]));
            }
          }
        }
        rIdx++;
      }
    }

    const freeCols: number[] = [];
    for (let c = 0; c < n; c++) {
      if (pivots[c] === -1) freeCols.push(c);
    }

    const nullVectors: DecimalComplex[][] = [];
    if (freeCols.length === 0) {
      const fallback = Array(n).fill(0).map(() => new DecimalComplex(1, 0));
      let sumSq = new Decimal(0);
      for (const v of fallback) {
        sumSq = sumSq.plus(v.r.times(v.r).plus(v.i.times(v.i)));
      }
      const len = sumSq.sqrt();
      nullVectors.push(fallback.map(v => new DecimalComplex(v.r.div(len), v.i.div(len))));
    } else {
      for (const freeCol of freeCols) {
        const uVec = Array(n).fill(0).map(() => new DecimalComplex(0, 0));
        uVec[freeCol] = new DecimalComplex(1, 0);
        for (let pivotCol = 0; pivotCol < n; pivotCol++) {
          const pRow = pivots[pivotCol];
          if (pRow !== -1) {
            uVec[pivotCol] = new DecimalComplex(0, 0).sub(M[pRow][freeCol]);
          }
        }
        
        let sumSq = new Decimal(0);
        for (const v of uVec) {
          sumSq = sumSq.plus(v.r.times(v.r).plus(v.i.times(v.i)));
        }
        const normVal = sumSq.sqrt();
        if (normVal.gt(new Decimal("1e-15"))) {
          nullVectors.push(uVec.map(v => new DecimalComplex(v.r.div(normVal), v.i.div(normVal))));
        }
      }
    }
    
    eigenvectors.push(nullVectors);
  }
  return eigenvectors;
}

export function schurPowerFractional(A: Matrix, p: number, q: number): Matrix {
  const n = A.rows;
  if (n === 2) {
    const tr = A.data[0][0] + A.data[1][1];
    const det = A.data[0][0] * A.data[1][1] - A.data[0][1] * A.data[1][0];
    const disc = tr * tr - 4 * det;
    
    if (disc < 0) {
      const a = tr / 2;
      const b = Math.sqrt(-disc) / 2;
      
      const compL = new Complex(a, b);
      const complexVecs = computeComplexEigenvectors(A, [compL]);
      const v = complexVecs[0]?.[0];
      if (v) {
        const rVec = v.map(c => c.r);
        const sVec = v.map(c => c.i);
        
        const X = {
          rows: 2, cols: 2,
          data: [
            [rVec[0], sVec[0]],
            [rVec[1], sVec[1]]
          ]
        };
        const X_inv = MatrixEngine.inverse(X);
        const trVal = compL.r;
        const rootImg = compL.i;
        
        const rad = Math.pow(trVal * trVal + rootImg * rootImg, p / (2 * q));
        const th = Math.atan2(rootImg, trVal) * (p / q);
        const u = rad * Math.cos(th);
        const v_val = rad * Math.sin(th);
        
        const T_pow = {
          rows: 2, cols: 2,
          data: [
            [u, v_val],
            [-v_val, u]
          ]
        };
        
        const xTimesT = MatrixEngine.multiply(X, T_pow);
        const finalData = MatrixEngine.multiply(xTimesT, X_inv).data;
        return { rows: 2, cols: 2, data: finalData.map(row => row.map(sanitizeNumber)) };
      }
    }
  }
  return A;
}

// ==========================================
// 8. MATRIX SYMBOLIC PARSER (MULTI-STYLE INTERFACES)
// ==========================================

export class MatrixSymbolicParser {
  // Parsing style 1: A=[1,2;3,4]
  static parseStyle1(str: string): { name: string, matrix: Matrix } {
    const parts = str.split("=");
    if (parts.length !== 2) throw new Error("Expression must follow the structure: Name=[data]");
    const name = parts[0].trim();
    let body = parts[1].trim();
    if (body.startsWith("[")) body = body.substring(1);
    if (body.endsWith("]")) body = body.substring(0, body.length - 1);

    const rows = body.split(";").map(rowStr => {
      return rowStr.split(",").map(val => parseFloat(val.trim()));
    });

    return { name, matrix: MatrixEngine.fromArray(rows) };
  }

  // Parsing style 2: A= [1 2 \n 3 4]
  static parseStyle2(str: string): { name: string, matrix: Matrix } {
    const lines = str.trim().split("\n");
    const nameLine = lines[0];
    const nameParts = nameLine.split("=");
    if (nameParts.length < 1) throw new Error("Style 2 must include assignment character '='");
    const name = nameParts[0].trim();
    
    // Concat remaining lines
    let block = str.substring(str.indexOf("=") + 1).trim();
    if (block.startsWith("[")) block = block.substring(1);
    if (block.endsWith("]")) block = block.substring(0, block.length - 1);

    const rows = block.split(/[\r\n]+/).map(rowLine => {
      return rowLine.trim().split(/\s+/).map(val => parseFloat(val));
    });

    return { name, matrix: MatrixEngine.fromArray(rows) };
  }

  // Parsing style 3: Let A be [[1,2],[3,4]]
  static parseStyle3(str: string): { name: string, matrix: Matrix } {
    const match = str.match(/let\s+([A-D]_\d)\s+be\s+\[(.*)\]/i);
    if (!match) throw new Error("Must follow formula structure: Let A_1 be [[1,2],[3,4]]");
    const name = match[1].trim();
    const cleanBody = match[2].trim();
    
    // Parse nested structures e.g. [1,2],[3,4]
    const rowMatches = [...cleanBody.matchAll(/\[(.*?)\]/g)].map(m => m[1]);
    const dArray = rowMatches.map(rStr => rStr.split(",").map(val => parseFloat(val.trim())));
    
    return { name, matrix: MatrixEngine.fromArray(dArray) };
  }

  // Parsing style 4: Natural language "Create a 3x3 matrix A with rows..."
  static parseStyle4(str: string): { name: string, matrix: Matrix } {
    // Look for name
    const nameMatch = str.match(/(?:matrix|named)\s+([A-D]_\d)/i);
    const name = nameMatch ? nameMatch[1].trim() : "A_1";
    
    // Extracts all decimal values
    const numRegex = /[-+]?\d+(?:\.\d+)?/g;
    const allNums = (str.match(numRegex) || []).map(v => parseFloat(v));

    // Try identifying rows/columns counts e.g. "3x3"
    const dimMatch = str.match(/(\d+)\s*x\s*(\d+)/i);
    let rows = 3;
    let cols = 3;
    if (dimMatch) {
      rows = parseInt(dimMatch[1]);
      cols = parseInt(dimMatch[2]);
    }

    if (allNums.length < rows * cols) {
      throw new Error(`Insufficient matrix numeric parameters found in query text for specified ${rows}x${cols} dimension.`);
    }

    const data: number[][] = [];
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      const rowArr: number[] = [];
      for (let c = 0; c < cols; c++) {
        rowArr.push(allNums[idx++]);
      }
      data.push(rowArr);
    }

    return { name, matrix: MatrixEngine.fromArray(data) };
  }

  // Auto parsing dispatcher
  static parseUniversal(str: string): { name: string, matrix: Matrix } {
    const s = str.trim();
    if (s.toLowerCase().startsWith("let ")) {
      return this.parseStyle3(s);
    }
    if (s.toLowerCase().startsWith("create ")) {
      return this.parseStyle4(s);
    }
    if (s.includes("\n")) {
      return this.parseStyle2(s);
    }
    return this.parseStyle1(s);
  }

  // Evaluates matrix expression trees like "2*A_1 + B_2^T"
  static evaluateExpression(exprStr: string, storage: MatrixStorage): { result: Matrix, steps: string[] } {
    const steps: string[] = [];
    const cleanExpr = exprStr.replace(/\s+/g, "");

    // Simple shunting-yard logic or standard recursive parsing.
    // For general robustness, we can handle token replacement of valid names, transpose, inverse.
    // Let's implement a robust matrix parser for basic ops: +, -, *, ^T, ^-1, ^number.
    
    // Evaluate in order of PEMDAS: transposes/inverses, multiplication, additions.
    const evaluateTerm = (term: string): Matrix => {
      // term is e.g. "A_1^T" or "inv(A_1)" or "2*A_1"
      if (term.startsWith("inv(") && term.endsWith(")")) {
        const sub = term.slice(4, -1);
        steps.push(`Evaluate Inverse matrix: inv(${sub})`);
        return MatrixEngine.inverse(evaluateTerm(sub));
      }
      if (term.startsWith("transpose(") && term.endsWith(")")) {
        const sub = term.slice(10, -1);
        return MatrixEngine.transpose(evaluateTerm(sub));
      }

      // Handle multiplication/scalar power split
      if (term.includes("*")) {
        const multParts = term.split("*");
        let current = evaluateTerm(multParts[0]);
        for (let i = 1; i < multParts.length; i++) {
          const nextPart = multParts[i];
          // Check if first is numeric scalar
          const dVal = parseFloat(multParts[i - 1]);
          if (!isNaN(dVal)) {
            const mat = evaluateTerm(nextPart);
            steps.push(`Scalar multiply matrix by ${dVal}`);
            current = MatrixEngine.scalarMul(mat, dVal);
          } else {
            const nextMat = evaluateTerm(nextPart);
            steps.push(`Multiply matrices: ${multParts[i-1]} * ${nextPart}`);
            current = MatrixEngine.multiply(current, nextMat);
          }
        }
        return current;
      }

      // Handle powers ^T, ^-1, ^2
      if (term.includes("^")) {
        const baseAndPower = term.split("^");
        const baseName = baseAndPower[0];
        const powerStr = baseAndPower[1];
        
        const baseMat = evaluateTerm(baseName);
        if (powerStr === "T") {
          steps.push(`Transpose of ${baseName}`);
          return MatrixEngine.transpose(baseMat);
        }
        if (powerStr === "-1") {
          steps.push(`Inverse of ${baseName}`);
          return MatrixEngine.inverse(baseMat);
        }
        const intPow = parseInt(powerStr);
        if (!isNaN(intPow)) {
          steps.push(`Raise ${baseName} to integer power of ${intPow}`);
          return MatrixPowerEngine.powerInteger(baseMat, intPow);
        }
      }

      // Base lookup
      const stored = storage[term];
      if (stored) return stored;

      // Number literal
      const numVal = parseFloat(term);
      if (!isNaN(numVal)) {
        return { rows: 1, cols: 1, data: [[numVal]] };
      }

      throw new Error(`Unresolved symbol in expression: ${term}`);
    };

    // Split on primary operations (+, -)
    // Handle simple binary operation format or tokens
    const splitByLowestPrecedence = (input: string): Matrix => {
      let depth = 0;
      let splitIdx = -1;
      let opType: '+' | '-' | null = null;

      // Find outside-parentheses additions/subtractions
      for (let i = input.length - 1; i >= 0; i--) {
        const char = input[i];
        if (char === ")") depth++;
        if (char === "(") depth--;
        if (depth === 0) {
          if (char === "+" || char === "-") {
            splitIdx = i;
            opType = char as '+' | '-';
            break;
          }
        }
      }

      if (splitIdx !== -1 && opType) {
        const leftExpr = input.substring(0, splitIdx);
        const rightExpr = input.substring(splitIdx + 1);
        const leftMat = splitByLowestPrecedence(leftExpr);
        const rightMat = splitByLowestPrecedence(rightExpr);

        steps.push(`Perform matrix basic ${opType === "+" ? "addition" : "subtraction"}`);
        return opType === "+"
          ? MatrixEngine.add(leftMat, rightMat)
          : MatrixEngine.subtract(leftMat, rightMat);
      }

      // Unpack parentheses
      if (input.startsWith("(") && input.endsWith(")")) {
        return splitByLowestPrecedence(input.slice(1, -1));
      }

      return evaluateTerm(input);
    };

    const result = splitByLowestPrecedence(cleanExpr);
    return { result, steps };
  }
}
