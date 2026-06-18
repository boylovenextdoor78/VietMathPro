import { evaluate } from 'mathjs';
import Decimal from 'decimal.js';

export class GeometryService {
  private static findRational(x: number, maxDenominator: number = 1000000): { p: number, q: number } | null {
    const eps = 1e-12;
    let m00 = 1, m01 = 0, m10 = 0, m11 = 1;
    let originalX = x;
    let cnt = 0;
    let val = x;
    while (cnt++ < 100) {
      let a = Math.floor(val);
      let abs_a = Math.abs(a);
      if (abs_a > 1e12 && cnt > 1) break;
      
      let n0 = m00 * a + m01;
      let n1 = m10 * a + m11;
      if (n1 > maxDenominator) break;
      
      m01 = m00;
      m00 = n0;
      m11 = m10;
      m10 = n1;
      
      if (Math.abs(originalX - m00 / m10) < eps) {
        return { p: m00, q: m10 };
      }
      
      let diff = val - a;
      if (Math.abs(diff) < 1e-12) {
        break;
      }
      val = 1.0 / diff;
    }
    return { p: m00, q: m10 };
  }

  private static simplifyRadicalOfFraction(p: number, q: number): { a: number, b: number, c: number } {
    let N = p * q;
    let factorA = 1;
    let remB = N;
    for (let i = 2; i * i <= remB; i++) {
      while (remB % (i * i) === 0) {
        factorA *= i;
        remB /= (i * i);
      }
    }
    const g = this.gcd(factorA, q);
    const finalA = factorA / g;
    const finalC = q / g;
    return { a: finalA, b: remB, c: finalC };
  }

  private static formatExactRadical(a: number, b: number, c: number): string {
    if (b === 1) {
      if (c === 1) return `${a}`;
      return `\\frac{${a}}{${c}}`;
    }
    let radicalStr = `\\sqrt{${b}}`;
    let numerator = a === 1 ? radicalStr : `${a}${radicalStr}`;
    if (c === 1) return numerator;
    return `\\frac{${numerator}}{${c}}`;
  }

  public static getExactDistanceAndDecimal(distSq: number): { exactLatex: string, decimal25: string } {
    if (isNaN(distSq) || distSq < 0) {
      return { exactLatex: "?", decimal25: "?" };
    }
    if (distSq === 0) {
      return { exactLatex: "0", decimal25: "0.0000000000000000000000000" };
    }
    
    const rational = this.findRational(distSq);
    if (rational && rational.q < 1000000 && Math.abs(distSq - rational.p / rational.q) < 1e-11) {
      const { a, b, c } = this.simplifyRadicalOfFraction(rational.p, rational.q);
      const exactLatex = this.formatExactRadical(a, b, c);
      
      let decString = "";
      try {
        Decimal.set({ precision: 50 });
        const d_a = new Decimal(a);
        const d_b = new Decimal(b);
        const d_c = new Decimal(c);
        const exact_decimal = d_a.mul(d_b.squareRoot()).div(d_c);
        decString = exact_decimal.toFixed(25);
      } catch (e) {
        const numVal = (a * Math.sqrt(b)) / c;
        decString = numVal.toFixed(25);
      }
      return { exactLatex, decimal25: decString };
    }
    
    const numVal = Math.sqrt(distSq);
    let decString = "";
    try {
      Decimal.set({ precision: 50 });
      const d_val = new Decimal(distSq);
      decString = d_val.squareRoot().toFixed(25);
    } catch (e) {
      decString = numVal.toFixed(25);
    }
    return { exactLatex: `${this.formatRadical(numVal)}`, decimal25: decString };
  }

  static parseValue(expr: string): number {
    if (!expr || expr.trim() === '') return 0;
    
    const processed = expr.trim().toLowerCase();
    const commonPrefixes = ["sq", "sqr", "si", "co", "ta", "lo", "ab"];
    if (commonPrefixes.some(p => processed === p)) return NaN;

    try {
      // Thay thế sqrt(b) thành sqrt(b) nếu người dùng nhập dạng b*sqrt(a)
      const cleanExpr = expr.replace(/(\d+)sqrt/g, '$1*sqrt');
      return evaluate(cleanExpr);
    } catch (e) {
      return NaN;
    }
  }

  static compareLines(l1: any, l2: any) {
    // Check if 2D General Form (ax + by + c = 0)
    if (l1.type === '2D' && l2.type === '2D') {
      const { a: a1, b: b1, c: c1 } = l1;
      const { a: a2, b: b2, c: c2 } = l2;

      const det = a1 * b2 - a2 * b1;
      if (Math.abs(det) < 1e-9) {
        const detAC = a1 * c2 - a2 * c1;
        const detBC = b1 * c2 - b2 * c1;
        if (Math.abs(detAC) < 1e-9 && Math.abs(detBC) < 1e-9) return "Trùng nhau (Coincident)";
        return "Song song (Parallel)";
      }
      
      const x = (b1 * c2 - b2 * c1) / det;
      const y = (c1 * a2 - c2 * a1) / det;
      return `Cắt nhau tại điểm M(${this.formatRadical(x)}; ${this.formatRadical(y)})`;
    }

    const p1 = [l1.a, l1.c, l1.e || 0];
    const v1 = [l1.b, l1.d, l1.f || 0];
    const p2 = [l2.a, l2.c, l2.e || 0];
    const v2 = [l2.b, l2.d, l2.f || 0];

    const cross = this.crossProduct(v1, v2);
    const isParallel = this.isZeroVector(cross);

    if (isParallel) {
      const p1p2 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
      const crossPoint = this.crossProduct(p1p2, v1);
      if (this.isZeroVector(crossPoint)) return "Trùng nhau (Coincident)";
      return "Song song (Parallel)";
    }

    const p1p2 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
    const tripleProduct = this.dotProduct(p1p2, cross);
    
    if (Math.abs(tripleProduct) < 1e-9) {
      // Intersecting in 3D
      const crossP1P2V2 = this.crossProduct(p1p2, v2);
      const t = this.dotProduct(crossP1P2V2, cross) / this.dotProduct(cross, cross);
      const intersectPoint = [
        p1[0] + t * v1[0],
        p1[1] + t * v1[1],
        p1[2] + t * v1[2]
      ];
      return `Cắt nhau tại điểm M(${this.formatRadical(intersectPoint[0])}; ${this.formatRadical(intersectPoint[1])}; ${this.formatRadical(intersectPoint[2])})`;
    }
    return "Chéo nhau (Skew)";
  }

  static comparePlaneSphere(p: any, s: any) {
    const denom = p.a**2 + p.b**2 + p.c**2;
    if (denom === 0) {
      return { 
        type: 'distance', 
        message: "Mặt phẳng không hợp lệ", 
        exactLatex: "?", 
        decimal25: "?" 
      };
    }
    
    const num = (p.a * s.x0 + p.b * s.y0 + p.c * s.z0 + p.d) ** 2;
    const distSq = num / denom;
    const { exactLatex: exactDist, decimal25: decDist } = this.getExactDistanceAndDecimal(distSq);
    
    // Projection center H of sphere center I onto plane P
    const k = -(p.a * s.x0 + p.b * s.y0 + p.c * s.z0 + p.d) / denom;
    const x_H = s.x0 + k * p.a;
    const y_H = s.y0 + k * p.b;
    const z_H = s.z0 + k * p.c;
    
    const exactX = this.formatRadical(x_H);
    const exactY = this.formatRadical(y_H);
    const exactZ = this.formatRadical(z_H);
    
    const latexX = this.radicalToLatex(exactX);
    const latexY = this.radicalToLatex(exactY);
    const latexZ = this.radicalToLatex(exactZ);
    
    Decimal.set({ precision: 50 });
    let decX = new Decimal(s.x0).add(new Decimal(k).mul(p.a)).toFixed(25).replace(/\.?0+$/, "");
    let decY = new Decimal(s.y0).add(new Decimal(k).mul(p.b)).toFixed(25).replace(/\.?0+$/, "");
    let decZ = new Decimal(s.z0).add(new Decimal(k).mul(p.c)).toFixed(25).replace(/\.?0+$/, "");
    
    if (!decX.includes('.')) decX += ".0000000000000000000000000"; else decX = decX.padEnd(decX.indexOf('.') + 26, '0');
    if (!decY.includes('.')) decY += ".0000000000000000000000000"; else decY = decY.padEnd(decY.indexOf('.') + 26, '0');
    if (!decZ.includes('.')) decZ += ".0000000000000000000000000"; else decZ = decZ.padEnd(decZ.indexOf('.') + 26, '0');

    const exactR = this.formatRadical(s.r);
    const latexR = this.radicalToLatex(exactR);
    const r_sq = s.r ** 2;
    const dist = Math.sqrt(distSq);
    
    if (Math.abs(dist - s.r) < 1e-8) {
      // Tangent
      return {
        type: 'distance',
        message: `Mặt phẳng P: ${p.a}x ${p.b >= 0 ? '+' : ''}${p.b}y ${p.c >= 0 ? '+' : ''}${p.c}z ${p.d >= 0 ? '+' : ''}${p.d} = 0 tiếp xúc với mặt cầu S tâm I(${this.formatRadical(s.x0)}; ${this.formatRadical(s.y0)}; ${this.formatRadical(s.z0)}) bán kính R = ${exactR} tại một điểm tiếp xúc duy nhất H:`,
        exactLatex: `d(I, P) = R = ${exactDist} \\implies H\\left(${latexX};\\ ${latexY};\\ ${latexZ}\\right)`,
        decimal25: `Khoảng cách d = ${decDist}\nĐiểm tiếp xúc H(${decX}; ${decY}; ${decZ})`
      };
    } else if (dist < s.r) {
      // Intersects in a circle
      const r_prime_sq = r_sq - distSq;
      const { exactLatex: exactRPrime, decimal25: decRPrime } = this.getExactDistanceAndDecimal(r_prime_sq);
      const { exactLatex: exactArea, decimal25: decArea } = this.getExactDistanceAndDecimal(r_prime_sq * r_prime_sq); // rough area calculation

      Decimal.set({ precision: 50 });
      let decAreaPiStr = new Decimal(r_prime_sq).toFixed(25).replace(/\.?0+$/, "");
      if (!decAreaPiStr.includes('.')) decAreaPiStr += ".0000000000000000000000000"; else decAreaPiStr = decAreaPiStr.padEnd(decAreaPiStr.indexOf('.') + 26, '0');

      return {
        type: 'distance',
        message: `Mặt phẳng P cắt mặt cầu S theo giao tuyến là một đường tròn thiết diện có tâm H (hình chiếu của I lên P) và bán kính r:`,
        exactLatex: `\\text{Tâm } H\\left(${latexX};\\ ${latexY};\\ ${latexZ}\\right), \\quad \\text{Bán kính } r = \\sqrt{R^2 - d^2} = ${exactRPrime}, \\quad \\text{Diện tích } S_{td} = ${this.radicalToLatex(this.formatRadical(r_prime_sq))}\\pi`,
        decimal25: `Tâm đường tròn H(${decX}; ${decY}; ${decZ})\nBán kính r = ${decRPrime}\nDiện tích thiết diện S = (${decAreaPiStr}) * π`
      };
    } else {
      // No intersection
      return {
        type: 'distance',
        message: `Mặt phẳng P không cắt mặt cầu S do khoảng cách d(I, P) > R:`,
        exactLatex: `d(I, P) = ${exactDist} > R = ${latexR} \\implies \\text{H hình chiếu gần nhất trên (P): } H\\left(${latexX};\\ ${latexY};\\ ${latexZ}\\right)`,
        decimal25: `Khoảng cách d = ${decDist} (lớn hơn R)\nHình chiếu của tâm lên mặt phẳng H(${decX}; ${decY}; ${decZ})`
      };
    }
  }

  static compareSpheres(s1: any, s2: any) {
    const dist = Math.sqrt((s1.x0 - s2.x0)**2 + (s1.y0 - s2.y0)**2 + (s1.z0 - s2.z0)**2);
    const rSum = s1.r + s2.r;
    const rDiff = Math.abs(s1.r - s2.r);
    
    const v1 = this.formatPiVolume(s1.r);
    const v2 = this.formatPiVolume(s2.r);
    const volInfo = `\nThể tích S1: ${v1}\nThể tích S2: ${v2}`;

    if (dist > rSum) return "Ngoài nhau" + volInfo;
    if (Math.abs(dist - rSum) < 1e-8) return "Tiếp xúc ngoài" + volInfo;
    if (dist < rSum && dist > rDiff) return "Cắt nhau (Thiết diện cắt là hình tròn trong không gian 3 chiều)" + volInfo;
    if (Math.abs(dist - rDiff) < 1e-8) return "Tiếp xúc trong" + volInfo;
    if (dist < rDiff) return "Chứa nhau" + volInfo;
    return "Trùng nhau" + volInfo;
  }

  static compareCircles(c1: any, c2: any) {
    const dist = Math.sqrt((c1.x0 - c2.x0)**2 + (c1.y0 - c2.y0)**2);
    const rSum = c1.r + c2.r;
    const rDiff = Math.abs(c1.r - c2.r);

    if (dist > rSum) return "Ngoài nhau";
    if (Math.abs(dist - rSum) < 1e-8) return "Tiếp xúc ngoài";
    if (dist < rSum && dist > rDiff) return "Cắt nhau";
    if (Math.abs(dist - rDiff) < 1e-8) return "Tiếp xúc trong";
    if (dist < rDiff) return "Chứa nhau";
    return "Trùng nhau";
  }

  static compareLineCircle(l: any, c: any) {
    if (l.type === '2D') {
      // Line: ax + by + c = 0
      const denom = l.a ** 2 + l.b ** 2;
      if (denom === 0) {
        return { type: 'distance', message: "Đường thẳng không hợp lệ.", exactLatex: "?", decimal25: "?" };
      }
      
      const num = (l.a * c.x0 + l.b * c.y0 + l.c) ** 2;
      const distSq = num / denom;
      const { exactLatex: exactDist, decimal25: decDist } = this.getExactDistanceAndDecimal(distSq);
      
      const xH = c.x0 - l.a * (l.a * c.x0 + l.b * c.y0 + l.c) / denom;
      const yH = c.y0 - l.b * (l.a * c.x0 + l.b * c.y0 + l.c) / denom;
      
      Decimal.set({ precision: 50 });
      const dDenom = new Decimal(l.a).pow(2).add(new Decimal(l.b).pow(2));
      const k = new Decimal(l.a * c.x0 + l.b * c.y0 + l.c).div(dDenom);
      
      let decH_x = new Decimal(c.x0).sub(new Decimal(l.a).mul(k)).toFixed(25).replace(/\.?0+$/, "");
      let decH_y = new Decimal(c.y0).sub(new Decimal(l.b).mul(k)).toFixed(25).replace(/\.?0+$/, "");
      
      if (!decH_x.includes('.')) decH_x += ".0000000000000000000000000"; else decH_x = decH_x.padEnd(decH_x.indexOf('.') + 26, '0');
      if (!decH_y.includes('.')) decH_y += ".0000000000000000000000000"; else decH_y = decH_y.padEnd(decH_y.indexOf('.') + 26, '0');

      const latexX_H = this.radicalToLatex(this.formatRadical(xH));
      const latexY_H = this.radicalToLatex(this.formatRadical(yH));

      const dist = Math.sqrt(distSq);
      if (Math.abs(dist - c.r) < 1e-8) {
        return {
          type: 'distance',
          message: `Đường thẳng L: ${l.a}x ${l.b >= 0 ? '+' : ''}${l.b}y ${l.c >= 0 ? '+' : ''}${l.c} = 0 tiếp xúc với đường tròn C tâm I(${this.formatRadical(c.x0)}, ${this.formatRadical(c.y0)}) bán kính R = ${this.formatRadical(c.r)} tại điểm tiếp xúc duy nhất M:`,
          exactLatex: `d(I, L) = R = ${exactDist} \\implies M\\left(${latexX_H};\\ ${latexY_H}\\right)`,
          decimal25: `K/c d = ${decDist}\nĐiểm tiếp xúc M(${decH_x}; ${decH_y})`
        };
      } else if (dist < c.r) {
        const h = Math.sqrt(c.r ** 2 - distSq);
        const dx = (l.b * h) / Math.sqrt(denom);
        const dy = (l.a * h) / Math.sqrt(denom);
        
        const x1 = xH + dx;
        const y1 = yH - dy;
        const x2 = xH - dx;
        const y2 = yH + dy;
        
        const latexX1 = this.radicalToLatex(this.formatRadical(x1));
        const latexY1 = this.radicalToLatex(this.formatRadical(y1));
        const latexX2 = this.radicalToLatex(this.formatRadical(x2));
        const latexY2 = this.radicalToLatex(this.formatRadical(y2));

        const dH = new Decimal(c.r).pow(2).sub(new Decimal(distSq)).squareRoot();
        const dDx = new Decimal(l.b).mul(dH).div(dDenom.squareRoot());
        const dDy = new Decimal(l.a).mul(dH).div(dDenom.squareRoot());
        
        let decX1 = new Decimal(xH).add(dDx).toFixed(25).replace(/\.?0+$/, "");
        let decY1 = new Decimal(yH).sub(dDy).toFixed(25).replace(/\.?0+$/, "");
        let decX2 = new Decimal(xH).sub(dDx).toFixed(25).replace(/\.?0+$/, "");
        let decY2 = new Decimal(yH).add(dDy).toFixed(25).replace(/\.?0+$/, "");
        
        if (!decX1.includes('.')) decX1 += ".0000000000000000000000000"; else decX1 = decX1.padEnd(decX1.indexOf('.') + 26, '0');
        if (!decY1.includes('.')) decY1 += ".0000000000000000000000000"; else decY1 = decY1.padEnd(decY1.indexOf('.') + 26, '0');
        if (!decX2.includes('.')) decX2 += ".0000000000000000000000000"; else decX2 = decX2.padEnd(decX2.indexOf('.') + 26, '0');
        if (!decY2.includes('.')) decY2 += ".0000000000000000000000000"; else decY2 = decY2.padEnd(decY2.indexOf('.') + 26, '0');

        return {
          type: 'distance',
          message: `Đường thẳng L cắt đường tròn C tại hai giao điểm phân biệt M1 và M2:`,
          exactLatex: `M_1\\left(${latexX1};\\ ${latexY1}\\right), \\quad M_2\\left(${latexX2};\\ ${latexY2}\\right), \\quad d(I, L) = ${exactDist}`,
          decimal25: `Giao điểm M1(${decX1}; ${decY1})\nGiao điểm M2(${decX2}; ${decY2})\nKhoảng cách d = ${decDist}`
        };
      } else {
        return {
          type: 'distance',
          message: `Đường thẳng L không cắt đường tròn C (do khoảng cách từ tâm đến đường thẳng lớn hơn bán kính R):`,
          exactLatex: `d(I, L) = ${exactDist} > R = ${this.radicalToLatex(this.formatRadical(c.r))} \\implies H\\text{ hình chiếu: } H\\left(${latexX_H};\\ ${latexY_H}\\right)`,
          decimal25: `K/c d = ${decDist}\nHình chiếu H(${decH_x}; ${decH_y})`
        };
      }
    }

    // Parametric Line: x = a + bt, y = c + dt
    const A = l.b ** 2 + l.d ** 2;
    if (A === 0) {
      return { type: 'distance', message: "Đường thẳng không hợp lệ.", exactLatex: "?", decimal25: "?" };
    }
    const B = 2 * (l.b * (l.a - c.x0) + l.d * (l.c - c.y0));
    const C = (l.a - c.x0) ** 2 + (l.c - c.y0) ** 2 - c.r ** 2;

    const delta = B ** 2 - 4 * A * C;
    
    const p0c = [c.x0 - l.a, c.y0 - l.c, 0];
    const v = [l.b, l.d, 0];
    const cross = this.crossProduct(p0c, v);
    const distSq = this.dotProduct(cross, cross) / this.dotProduct(v, v);
    const { exactLatex: exactDist, decimal25: decDist } = this.getExactDistanceAndDecimal(distSq);

    // Calculate projection H on line (closest to center)
    const tH = -(l.b * (l.a - c.x0) + l.d * (l.c - c.y0)) / A;
    const xH = l.a + l.b * tH;
    const yH = l.c + l.d * tH;
    const latexX_H = this.radicalToLatex(this.formatRadical(xH));
    const latexY_H = this.radicalToLatex(this.formatRadical(yH));

    Decimal.set({ precision: 50 });
    let decX_H = new Decimal(l.a).add(new Decimal(l.b).mul(tH)).toFixed(25).replace(/\.?0+$/, "");
    let decY_H = new Decimal(l.c).add(new Decimal(l.d).mul(tH)).toFixed(25).replace(/\.?0+$/, "");
    if (!decX_H.includes('.')) decX_H += ".0000000000000000000000000"; else decX_H = decX_H.padEnd(decX_H.indexOf('.') + 26, '0');
    if (!decY_H.includes('.')) decY_H += ".0000000000000000000000000"; else decY_H = decY_H.padEnd(decY_H.indexOf('.') + 26, '0');

    if (Math.abs(delta) < 1e-8) {
      const t = -B / (2 * A);
      const x = l.a + l.b * t;
      const y = l.c + l.d * t;
      const latexX = this.radicalToLatex(this.formatRadical(x));
      const latexY = this.radicalToLatex(this.formatRadical(y));

      let decX = new Decimal(l.a).add(new Decimal(l.b).mul(t)).toFixed(25).replace(/\.?0+$/, "");
      let decY = new Decimal(l.c).add(new Decimal(l.d).mul(t)).toFixed(25).replace(/\.?0+$/, "");
      if (!decX.includes('.')) decX += ".0000000000000000000000000"; else decX = decX.padEnd(decX.indexOf('.') + 26, '0');
      if (!decY.includes('.')) decY += ".0000000000000000000000000"; else decY = decY.padEnd(decY.indexOf('.') + 26, '0');

      return {
        type: 'distance',
        message: `Đường thẳng L tiếp xúc với đường tròn C:`,
        exactLatex: `d(I, L) = R = ${exactDist} \\implies M\\left(${latexX};\\ ${latexY}\\right) \\quad \\text{với } t = ${this.radicalToLatex(this.formatRadical(t))}`,
        decimal25: `K/c d = ${decDist}\nĐiểm tiếp xúc M(${decX}; ${decY})`
      };
    } else if (delta > 0) {
      const t1 = (-B + Math.sqrt(delta)) / (2 * A);
      const t2 = (-B - Math.sqrt(delta)) / (2 * A);
      const x1 = l.a + l.b * t1;
      const y1 = l.c + l.d * t1;
      const x2 = l.a + l.b * t2;
      const y2 = l.c + l.d * t2;

      const latexX1 = this.radicalToLatex(this.formatRadical(x1));
      const latexY1 = this.radicalToLatex(this.formatRadical(y1));
      const latexX2 = this.radicalToLatex(this.formatRadical(x2));
      const latexY2 = this.radicalToLatex(this.formatRadical(y2));

      const dA = new Decimal(A);
      const dB = new Decimal(B);
      const dC = new Decimal(C);
      const dDelta = dB.pow(2).sub(dA.mul(dC).mul(4));
      const dSqrtDelta = dDelta.squareRoot();
      const dT1 = dB.neg().add(dSqrtDelta).div(dA.mul(2));
      const dT2 = dB.neg().sub(dSqrtDelta).div(dA.mul(2));

      let decX1 = new Decimal(l.a).add(new Decimal(l.b).mul(dT1)).toFixed(25).replace(/\.?0+$/, "");
      let decY1 = new Decimal(l.c).add(new Decimal(l.d).mul(dT1)).toFixed(25).replace(/\.?0+$/, "");
      let decX2 = new Decimal(l.a).add(new Decimal(l.b).mul(dT2)).toFixed(25).replace(/\.?0+$/, "");
      let decY2 = new Decimal(l.c).add(new Decimal(l.d).mul(dT2)).toFixed(25).replace(/\.?0+$/, "");
      
      if (!decX1.includes('.')) decX1 += ".0000000000000000000000000"; else decX1 = decX1.padEnd(decX1.indexOf('.') + 26, '0');
      if (!decY1.includes('.')) decY1 += ".0000000000000000000000000"; else decY1 = decY1.padEnd(decY1.indexOf('.') + 26, '0');
      if (!decX2.includes('.')) decX2 += ".0000000000000000000000000"; else decX2 = decX2.padEnd(decX2.indexOf('.') + 26, '0');
      if (!decY2.includes('.')) decY2 += ".0000000000000000000000000"; else decY2 = decY2.padEnd(decY2.indexOf('.') + 26, '0');

      return {
        type: 'distance',
        message: `Đường thẳng L cắt đường tròn C tại hai điểm phân biệt M1 và M2:`,
        exactLatex: `M_1\\left(${latexX1};\\ ${latexY1}\\right) \\quad M_2\\left(${latexX2};\\ ${latexY2}\\right), \\quad d(I, L) = ${exactDist}`,
        decimal25: `Giao điểm M1(${decX1}; ${decY1})\nGiao điểm M2(${decX2}; ${decY2})\nKhoảng cách d = ${decDist}`
      };
    } else {
      return {
        type: 'distance',
        message: `Đường thẳng L không giao với đường tròn C:`,
        exactLatex: `d(I, L) = ${exactDist} > R = ${this.radicalToLatex(this.formatRadical(c.r))} \\implies H\\text{ hình chiếu: } H\\left(${latexX_H};\\ ${latexY_H}\\right)`,
        decimal25: `K/c d = ${decDist}\nHình chiếu H(${decX_H}; ${decY_H})`
      };
    }
  }

  static compareLinePlane(l: any, p: any) {
    const dot = p.a * l.b + p.b * l.d + p.c * l.f;
    const pos = p.a * l.a + p.b * l.c + p.c * l.e + p.d;

    if (Math.abs(dot) < 1e-9) {
      if (Math.abs(pos) < 1e-9) return "Đường thẳng nằm trong mặt phẳng";
      return "Đường thẳng song song với mặt phẳng";
    }
    
    const t = -pos / dot;
    const intersectPoint = [
      l.a + t * l.b,
      l.c + t * l.d,
      l.e + t * l.f
    ];
    return `Cắt nhau tại điểm M(${this.formatRadical(intersectPoint[0])}; ${this.formatRadical(intersectPoint[1])}; ${this.formatRadical(intersectPoint[2])})`;
  }

  static comparePointPlane(pt: any, p: any) {
    const denom = p.a**2 + p.b**2 + p.c**2;
    if (denom === 0) {
      return { 
        type: 'distance', 
        message: "Mặt phẳng không hợp lệ", 
        exactLatex: "?", 
        decimal25: "?" 
      };
    }
    
    const num = (p.a * pt.x + p.b * pt.y + p.c * pt.z + p.d) ** 2;
    const distSq = num / denom;
    const { exactLatex, decimal25 } = this.getExactDistanceAndDecimal(distSq);
    
    return {
      type: 'distance',
      message: `Khoảng cách từ điểm A(${this.formatRadical(pt.x)}; ${this.formatRadical(pt.y)}${pt.z !== undefined ? '; ' + this.formatRadical(pt.z) : ''}) đến mặt phẳng P: ${p.a}x ${p.b >= 0 ? '+' : ''}${p.b}y ${p.c >= 0 ? '+' : ''}${p.c}z ${p.d >= 0 ? '+' : ''}${p.d} = 0 là:`,
      exactLatex: `d(A, P) = ${exactLatex}`,
      decimal25
    };
  }

  static comparePointLine(pt: any, l: any) {
    if (l.type === '2D') {
      const denom = l.a ** 2 + l.b ** 2;
      if (denom === 0) {
        return { 
          type: 'distance', 
          message: "Đường thẳng không hợp lệ", 
          exactLatex: "?", 
          decimal25: "?" 
        };
      }
      
      const num = (l.a * pt.x + l.b * pt.y + l.c) ** 2;
      const distSq = num / denom;
      const { exactLatex, decimal25 } = this.getExactDistanceAndDecimal(distSq);
      
      return {
        type: 'distance',
        message: `Khoảng cách từ điểm A(${this.formatRadical(pt.x)}; ${this.formatRadical(pt.y)}) đến đường thẳng L: ${l.a}x ${l.b >= 0 ? '+' : ''}${l.b}y ${l.c >= 0 ? '+' : ''}${l.c} = 0 là:`,
        exactLatex: `d(A, L) = ${exactLatex}`,
        decimal25
      };
    } else {
      // 3D Point to Line
      const p0 = [l.a, l.c, l.e];
      const v = [l.b, l.d, l.f];
      const p = [pt.x, pt.y, pt.z];
      
      const vMag2 = this.dotProduct(v, v);
      if (vMag2 === 0) {
        return { 
          type: 'distance', 
          message: "Đường thẳng không hợp lệ", 
          exactLatex: "?", 
          decimal25: "?" 
        };
      }

      const p0p = [p[0] - p0[0], p[1] - p0[1], p[2] - p0[2]];
      const cross = this.crossProduct(p0p, v);
      const crossMag2 = this.dotProduct(cross, cross);
      const distSq = crossMag2 / vMag2;
      
      const { exactLatex, decimal25 } = this.getExactDistanceAndDecimal(distSq);
      
      return {
        type: 'distance',
        message: `Khoảng cách từ điểm A(${this.formatRadical(pt.x)}; ${this.formatRadical(pt.y)}; ${this.formatRadical(pt.z)}) đến đường thẳng L là:`,
        exactLatex: `d(A, L) = ${exactLatex}`,
        decimal25
      };
    }
  }

  static comparePoints(p1: any, p2: any, dimension: '2D' | '3D') {
    let distSq = 0;
    if (dimension === '2D') {
      distSq = (p1.x - p2.x)**2 + (p1.y - p2.y)**2;
      const { exactLatex, decimal25 } = this.getExactDistanceAndDecimal(distSq);
      return {
        type: 'distance',
        message: `Khoảng cách giữa hai điểm A(${this.formatRadical(p1.x)}; ${this.formatRadical(p1.y)}) và B(${this.formatRadical(p2.x)}; ${this.formatRadical(p2.y)}) là:`,
        exactLatex: `d(A, B) = ${exactLatex}`,
        decimal25
      };
    } else {
      distSq = (p1.x - p2.x)**2 + (p1.y - p2.y)**2 + (p1.z - p2.z)**2;
      const { exactLatex, decimal25 } = this.getExactDistanceAndDecimal(distSq);
      return {
        type: 'distance',
        message: `Khoảng cách giữa hai điểm A(${this.formatRadical(p1.x)}; ${this.formatRadical(p1.y)}; ${this.formatRadical(p1.z)}) và B(${this.formatRadical(p2.x)}; ${this.formatRadical(p2.y)}; ${this.formatRadical(p2.z)}) là:`,
        exactLatex: `d(A, B) = ${exactLatex}`,
        decimal25
      };
    }
  }

  public static radicalToLatex(expr: string): string {
    if (!expr) return "";
    let s = expr.trim();
    s = s.replace(/\*/g, '');
    if (s.includes('/')) {
      let isNegative = s.startsWith('-');
      if (isNegative) {
        s = s.substring(1);
      }
      const parts = s.split('/');
      let num = parts[0].trim();
      let den = parts[1].trim();
      if (num.startsWith('(') && num.endsWith(')')) {
        num = num.substring(1, num.length - 1);
      }
      if (den.startsWith('(') && den.endsWith(')')) {
        den = den.substring(1, den.length - 1);
      }
      num = num.replace(/sqrt\((\d+)\)/g, '\\sqrt{$1}');
      den = den.replace(/sqrt\((\d+)\)/g, '\\sqrt{$1}');
      return `${isNegative ? '-' : ''}\\frac{${num}}{${den}}`;
    }
    s = s.replace(/sqrt\((\d+)\)/g, '\\sqrt{$1}');
    return s;
  }

  private static formatLineCoord(p: number, v: number): string {
    const pStr = this.radicalToLatex(this.formatRadical(p));
    const vStr = this.radicalToLatex(this.formatRadical(v));
    if (Math.abs(v) < 1e-9) return pStr;
    const vTerm = (vStr === '1') ? 't' : (vStr === '-1' ? '-t' : `${vStr}t`);
    if (Math.abs(p) < 1e-9) return vTerm;
    const sign = (v > 0) ? '+' : '';
    return `${pStr} ${sign} ${vTerm}`;
  }

  static orthogonalProjection(obj1: any, obj2: any, dimension: '2D' | '3D') {
    let pt: any = null;
    let line: any = null;
    let plane: any = null;
    
    if (obj1 && (obj1.type === 'A' || (obj1.x !== undefined && obj1.y !== undefined))) {
      pt = obj1;
      if (obj2 && obj2.a !== undefined && obj2.b !== undefined && obj2.c !== undefined && obj2.d !== undefined) {
        plane = obj2;
      } else if (obj2 && obj2.a !== undefined && obj2.b !== undefined) {
        line = obj2;
      }
    } else if (obj2 && (obj2.type === 'A' || (obj2.x !== undefined && obj2.y !== undefined))) {
      pt = obj2;
      if (obj1 && obj1.a !== undefined && obj1.b !== undefined && obj1.c !== undefined && obj1.d !== undefined) {
        plane = obj1;
      } else if (obj1 && obj1.a !== undefined && obj1.b !== undefined) {
        line = obj1;
      }
    }
    
    if (!pt) {
      return {
        type: 'distance',
        message: "Tính năng hình chiếu vuông góc chỉ áp dụng cho Điểm và Đường thẳng, hoặc Điểm và Mặt phẳng!",
        exactLatex: "?",
        decimal25: "?"
      };
    }
    
    if (plane) {
      const denom = plane.a**2 + plane.b**2 + plane.c**2;
      if (denom === 0) {
        return { type: 'distance', message: "Mặt phẳng không hợp lệ.", exactLatex: "?", decimal25: "?" };
      }
      
      const k = -(plane.a * pt.x + plane.b * pt.y + plane.c * pt.z + plane.d) / denom;
      const x_H = pt.x + k * plane.a;
      const y_H = pt.y + k * plane.b;
      const z_H = pt.z + k * plane.c;
      
      const exactX = this.formatRadical(x_H);
      const exactY = this.formatRadical(y_H);
      const exactZ = this.formatRadical(z_H);
      
      const latexX = this.radicalToLatex(exactX);
      const latexY = this.radicalToLatex(exactY);
      const latexZ = this.radicalToLatex(exactZ);
      
      Decimal.set({ precision: 50 });
      let decX = new Decimal(pt.x).add(new Decimal(k).mul(plane.a)).toFixed(25).replace(/\.?0+$/, "");
      let decY = new Decimal(pt.y).add(new Decimal(k).mul(plane.b)).toFixed(25).replace(/\.?0+$/, "");
      let decZ = new Decimal(pt.z).add(new Decimal(k).mul(plane.c)).toFixed(25).replace(/\.?0+$/, "");
      
      if (!decX.includes('.')) decX += ".0000000000000000000000000"; else decX = decX.padEnd(decX.indexOf('.') + 26, '0');
      if (!decY.includes('.')) decY += ".0000000000000000000000000"; else decY = decY.padEnd(decY.indexOf('.') + 26, '0');
      if (!decZ.includes('.')) decZ += ".0000000000000000000000000"; else decZ = decZ.padEnd(decZ.indexOf('.') + 26, '0');

      return {
        type: 'distance',
        message: `Hình chiếu của điểm A(${this.formatRadical(pt.x)}; ${this.formatRadical(pt.y)}${pt.z !== undefined ? '; ' + this.formatRadical(pt.z) : ''}) lên mặt phẳng P: ${plane.a}x ${plane.b >= 0 ? '+' : ''}${plane.b}y ${plane.c >= 0 ? '+' : ''}${plane.c}z ${plane.d >= 0 ? '+' : ''}${plane.d} = 0 là:`,
        exactLatex: `H\\left(${latexX};\\ ${latexY};\\ ${latexZ}\\right)`,
        decimal25: `H(${decX}; ${decY}; ${decZ})`
      };
    }
    
    if (line) {
      if (line.type === '2D' || dimension === '2D') {
        const denom = line.a**2 + line.b**2;
        if (denom === 0) {
          return { type: 'distance', message: "Đường thẳng không hợp lệ.", exactLatex: "?", decimal25: "?" };
        }
        const k = -(line.a * pt.x + line.b * pt.y + line.c) / denom;
        const x_H = pt.x + k * line.a;
        const y_H = pt.y + k * line.b;
        
        const exactX = this.formatRadical(x_H);
        const exactY = this.formatRadical(y_H);
        
        const latexX = this.radicalToLatex(exactX);
        const latexY = this.radicalToLatex(exactY);
        
        Decimal.set({ precision: 50 });
        let decX = new Decimal(pt.x).add(new Decimal(k).mul(line.a)).toFixed(25).replace(/\.?0+$/, "");
        let decY = new Decimal(pt.y).add(new Decimal(k).mul(line.b)).toFixed(25).replace(/\.?0+$/, "");
        
        if (!decX.includes('.')) decX += ".0000000000000000000000000"; else decX = decX.padEnd(decX.indexOf('.') + 26, '0');
        if (!decY.includes('.')) decY += ".0000000000000000000000000"; else decY = decY.padEnd(decY.indexOf('.') + 26, '0');

        return {
          type: 'distance',
          message: `Hình chiếu của điểm A(${this.formatRadical(pt.x)}; ${this.formatRadical(pt.y)}) lên đường thẳng L: ${line.a}x ${line.b >= 0 ? '+' : ''}${line.b}y ${line.c >= 0 ? '+' : ''}${line.c} = 0 là:`,
          exactLatex: `H\\left(${latexX};\\ ${latexY}\\right)`,
          decimal25: `H(${decX}; ${decY})`
        };
      } else {
        const p0 = [line.a, line.c, line.e];
        const v = [line.b, line.d, line.f];
        const vMag2 = this.dotProduct(v, v);
        if (vMag2 === 0) {
          return { type: 'distance', message: "Đường thẳng không hợp lệ.", exactLatex: "?", decimal25: "?" };
        }
        
        const t = -(v[0] * (p0[0] - pt.x) + v[1] * (p0[1] - pt.y) + v[2] * (p0[2] - pt.z)) / vMag2;
        const x_H = p0[0] + t * v[0];
        const y_H = p0[1] + t * v[1];
        const z_H = p0[2] + t * v[2];
        
        const exactX = this.formatRadical(x_H);
        const exactY = this.formatRadical(y_H);
        const exactZ = this.formatRadical(z_H);
        
        const latexX = this.radicalToLatex(exactX);
        const latexY = this.radicalToLatex(exactY);
        const latexZ = this.radicalToLatex(exactZ);
        
        Decimal.set({ precision: 50 });
        let decX = new Decimal(p0[0]).add(new Decimal(t).mul(v[0])).toFixed(25).replace(/\.?0+$/, "");
        let decY = new Decimal(p0[1]).add(new Decimal(t).mul(v[1])).toFixed(25).replace(/\.?0+$/, "");
        let decZ = new Decimal(p0[2]).add(new Decimal(t).mul(v[2])).toFixed(25).replace(/\.?0+$/, "");
        
        if (!decX.includes('.')) decX += ".0000000000000000000000000"; else decX = decX.padEnd(decX.indexOf('.') + 26, '0');
        if (!decY.includes('.')) decY += ".0000000000000000000000000"; else decY = decY.padEnd(decY.indexOf('.') + 26, '0');
        if (!decZ.includes('.')) decZ += ".0000000000000000000000000"; else decZ = decZ.padEnd(decZ.indexOf('.') + 26, '0');

        return {
          type: 'distance',
          message: `Hình chiếu của điểm A(${this.formatRadical(pt.x)}; ${this.formatRadical(pt.y)}; ${this.formatRadical(pt.z)}) lên đường thẳng L:`,
          exactLatex: `H\\left(${latexX};\\ ${latexY};\\ ${latexZ}\\right)`,
          decimal25: `H(${decX}; ${decY}; ${decZ})`
        };
      }
    }
    
    return {
      type: 'distance',
      message: "Vui lòng chọn Điểm và Đường thẳng/Mặt phẳng tương ứng.",
      exactLatex: "?",
      decimal25: "?"
    };
  }

  static intersection(obj1: any, obj2: any, dimension: '2D' | '3D') {
    if (!obj1 || !obj2) {
      return {
        type: 'distance',
        message: "Vui lòng chọn 2 đối tượng hợp lệ để tìm giao.",
        exactLatex: "?",
        decimal25: "?"
      };
    }

    // A. Plane & Sphere (or Sphere & Plane)
    const isPlane = (obj: any) => obj && obj.a !== undefined && obj.b !== undefined && obj.c !== undefined && obj.d !== undefined && obj.r === undefined;
    const isSphere = (obj: any) => obj && obj.x0 !== undefined && obj.y0 !== undefined && obj.z0 !== undefined && obj.r !== undefined;
    
    if ((isPlane(obj1) && isSphere(obj2)) || (isPlane(obj2) && isSphere(obj1))) {
      const plane = isPlane(obj1) ? obj1 : obj2;
      const sphere = isSphere(obj1) ? obj1 : obj2;
      return this.comparePlaneSphere(plane, sphere);
    }

    // B. Line & Sphere (or Sphere & Line)
    const isLine3D = (obj: any) => obj && obj.a !== undefined && obj.b !== undefined && obj.c !== undefined && obj.d !== undefined && obj.e !== undefined && obj.f !== undefined;
    if ((isLine3D(obj1) && isSphere(obj2)) || (isLine3D(obj2) && isSphere(obj1))) {
      const line = isLine3D(obj1) ? obj1 : obj2;
      const sphere = isSphere(obj1) ? obj1 : obj2;
      return this.compareLineSphere(line, sphere);
    }

    // C. Line & Circle (or Circle & Line)
    const isCircle = (obj: any) => obj && obj.x0 !== undefined && obj.y0 !== undefined && obj.r !== undefined && obj.z0 === undefined;
    const isLineAny = (obj: any) => obj && obj.a !== undefined && obj.b !== undefined;
    
    if ((isLineAny(obj1) && isCircle(obj2)) || (isLineAny(obj2) && isCircle(obj1))) {
      const line = isLineAny(obj1) ? obj1 : obj2;
      const circle = isCircle(obj1) ? obj1 : obj2;
      return this.compareLineCircle(line, circle);
    }

    // D. Line & Plane (or Plane & Line)
    if ((isLine3D(obj1) && isPlane(obj2)) || (isLine3D(obj2) && isPlane(obj1))) {
      const line = isLine3D(obj1) ? obj1 : obj2;
      const plane = isPlane(obj1) ? obj1 : obj2;
      
      const numVal = plane.a * line.a + plane.b * line.c + plane.c * line.e + plane.d;
      const denomVal = plane.a * line.b + plane.b * line.d + plane.c * line.f;
      
      if (Math.abs(denomVal) < 1e-9) {
        if (Math.abs(numVal) < 1e-9) {
          return {
            type: 'distance',
            message: "Đường thẳng nằm hoàn toàn trong mặt phẳng (vô số điểm chung):",
            exactLatex: "L \\subset P",
            decimal25: "Mọi điểm của đường thẳng đều thuộc mặt phẳng"
          };
        } else {
          return {
            type: 'distance',
            message: "Đường thẳng song song với mặt phẳng (không giao nhau):",
            exactLatex: "L \\parallel P \\implies L \\cap P = \\emptyset",
            decimal25: "Không có giao điểm"
          };
        }
      }
      
      const t = -numVal / denomVal;
      const x = line.a + t * line.b;
      const y = line.c + t * line.d;
      const z = line.e + t * line.f;
      
      const exactX = this.formatRadical(x);
      const exactY = this.formatRadical(y);
      const exactZ = this.formatRadical(z);
      
      const latexX = this.radicalToLatex(exactX);
      const latexY = this.radicalToLatex(exactY);
      const latexZ = this.radicalToLatex(exactZ);
      
      Decimal.set({ precision: 50 });
      let decNum = new Decimal(plane.a).mul(line.a).add(new Decimal(plane.b).mul(line.c)).add(new Decimal(plane.c).mul(line.e)).add(plane.d);
      let decDenom = new Decimal(plane.a).mul(line.b).add(new Decimal(plane.b).mul(line.d)).add(new Decimal(plane.c).mul(line.f));
      let dT = decNum.neg().div(decDenom);
      
      let decX = new Decimal(line.a).add(new Decimal(line.b).mul(dT)).toFixed(25).replace(/\.?0+$/, "");
      let decY = new Decimal(line.c).add(new Decimal(line.d).mul(dT)).toFixed(25).replace(/\.?0+$/, "");
      let decZ = new Decimal(line.e).add(new Decimal(line.f).mul(dT)).toFixed(25).replace(/\.?0+$/, "");
      
      if (!decX.includes('.')) decX += ".0000000000000000000000000"; else decX = decX.padEnd(decX.indexOf('.') + 26, '0');
      if (!decY.includes('.')) decY += ".0000000000000000000000000"; else decY = decY.padEnd(decY.indexOf('.') + 26, '0');
      if (!decZ.includes('.')) decZ += ".0000000000000000000000000"; else decZ = decZ.padEnd(decZ.indexOf('.') + 26, '0');
      
      return {
        type: 'distance',
        message: "Đường thẳng và mặt phẳng cắt nhau tại duy nhất điểm giao M:",
        exactLatex: `M\\left(${latexX};\\ ${latexY};\\ ${latexZ}\\right) \\quad \\text{với } t = ${this.radicalToLatex(this.formatRadical(t))}`,
        decimal25: `Giao điểm M(${decX}; ${decY}; ${decZ})`
      };
    }

    // 1. Two Planes (3D) -> return parametric equation of intersection line
    if (obj1 && obj2 && obj1.a !== undefined && obj1.b !== undefined && obj1.c !== undefined && obj1.d !== undefined &&
        obj2.a !== undefined && obj2.b !== undefined && obj2.c !== undefined && obj2.d !== undefined) {
      
      const n1 = [obj1.a, obj1.b, obj1.c];
      const n2 = [obj2.a, obj2.b, obj2.c];
      const u = this.crossProduct(n1, n2);
      
      if (this.isZeroVector(u)) {
        // Parallel or coincident
        const ratioA = obj2.a !== 0 ? obj1.a / obj2.a : (obj2.b !== 0 ? obj1.b / obj2.b : obj1.c / obj2.c);
        const ratioD = obj2.d !== 0 ? obj1.d / obj2.d : ratioA;
        if (Math.abs(ratioA - ratioD) < 1e-9) {
          return {
            type: 'distance',
            message: "Hai mặt phẳng trùng nhau, giao tuyến vô số.",
            exactLatex: "P_1 \\equiv P_2",
            decimal25: "Vô số điểm chung"
          };
        } else {
          return {
            type: 'distance',
            message: "Hai mặt phẳng song song, không có giao tuyến.",
            exactLatex: "P_1 \\cap P_2 = \\emptyset",
            decimal25: "Không có điểm chung"
          };
        }
      }
      
      // Select stable coordinate to set to zero
      let x0 = 0, y0 = 0, z0 = 0;
      let solved = false;
      
      const absUx = Math.abs(u[0]);
      const absUy = Math.abs(u[1]);
      const absUz = Math.abs(u[2]);
      
      if (absUz >= absUx && absUz >= absUy) {
        // Set z=0. Solve:
        // a1*x + b1*y + d1 = 0 => a1*x + b1*y = -d1
        // a2*x + b2*y + d2 = 0 => a2*x + b2*y = -d2
        const det = obj1.a * obj2.b - obj2.a * obj1.b;
        if (Math.abs(det) > 1e-9) {
          x0 = (obj1.b * obj2.d - obj2.b * obj1.d) / det;
          y0 = (obj1.d * obj2.a - obj2.d * obj1.a) / det;
          z0 = 0;
          solved = true;
        }
      }
      
      if (!solved && absUx >= absUy && absUx >= absUz) {
        // Set x=0. Solve:
        // b1*y + c1*z = -d1
        // b2*y + c2*z = -d2
        const det = obj1.b * obj2.c - obj2.b * obj1.c;
        if (Math.abs(det) > 1e-9) {
          x0 = 0;
          y0 = (obj1.c * obj2.d - obj2.c * obj1.d) / det;
          z0 = (obj1.d * obj2.b - obj2.d * obj1.b) / det;
          solved = true;
        }
      }
      
      if (!solved) {
        // Set y=0. Solve:
        // a1*x + c1*z = -d1
        // a2*x + c2*z = -d2
        const det = obj1.a * obj2.c - obj2.a * obj1.c;
        if (Math.abs(det) > 1e-9) {
          x0 = (obj1.c * obj2.d - obj2.c * obj1.d) / det;
          y0 = 0;
          z0 = (obj1.d * obj2.a - obj2.d * obj1.a) / det;
          solved = true;
        }
      }

      const eqX = this.formatLineCoord(x0, u[0]);
      const eqY = this.formatLineCoord(y0, u[1]);
      const eqZ = this.formatLineCoord(z0, u[2]);

      Decimal.set({ precision: 50 });
      let decX0 = new Decimal(x0).toFixed(25).replace(/\.?0+$/, "");
      let decY0 = new Decimal(y0).toFixed(25).replace(/\.?0+$/, "");
      let decZ0 = new Decimal(z0).toFixed(25).replace(/\.?0+$/, "");
      
      let decUx = new Decimal(u[0]).toFixed(25).replace(/\.?0+$/, "");
      let decUy = new Decimal(u[1]).toFixed(25).replace(/\.?0+$/, "");
      let decUz = new Decimal(u[2]).toFixed(25).replace(/\.?0+$/, "");

      if (!decX0.includes('.')) decX0 += ".0000000000000000000000000"; else decX0 = decX0.padEnd(decX0.indexOf('.') + 26, '0');
      if (!decY0.includes('.')) decY0 += ".0000000000000000000000000"; else decY0 = decY0.padEnd(decY0.indexOf('.') + 26, '0');
      if (!decZ0.includes('.')) decZ0 += ".0000000000000000000000000"; else decZ0 = decZ0.padEnd(decZ0.indexOf('.') + 26, '0');
      
      if (!decUx.includes('.')) decUx += ".0000000000000000000000000"; else decUx = decUx.padEnd(decUx.indexOf('.') + 26, '0');
      if (!decUy.includes('.')) decUy += ".0000000000000000000000000"; else decUy = decUy.padEnd(decUy.indexOf('.') + 26, '0');
      if (!decUz.includes('.')) decUz += ".0000000000000000000000000"; else decUz = decUz.padEnd(decUz.indexOf('.') + 26, '0');

      return {
        type: 'distance',
        message: "Phương trình giao tuyến của 2 mặt phẳng trong không gian 3D là:",
        exactLatex: `d: \\begin{cases} x = ${eqX} \\\\ y = ${eqY} \\\\ z = ${eqZ} \\end{cases}`,
        decimal25: `d: x = (${decX0}) + (${decUx})t, y = (${decY0}) + (${decUy})t, z = (${decZ0}) + (${decUz})t`
      };
    }

    // 2. Two Lines (2D/3D) -> return intersection point
    if (obj1 && obj2 && obj1.a !== undefined && obj1.b !== undefined && obj2.a !== undefined && obj2.b !== undefined) {
      if (dimension === '2D' && obj1.type === '2D' && obj2.type === '2D') {
        const { a: a1, b: b1, c: c1 } = obj1;
        const { a: a2, b: b2, c: c2 } = obj2;

        const det = a1 * b2 - a2 * b1;
        if (Math.abs(det) < 1e-9) {
          const detAC = a1 * c2 - a2 * c1;
          const detBC = b1 * c2 - b2 * c1;
          if (Math.abs(detAC) < 1e-9 && Math.abs(detBC) < 1e-9) {
            return {
              type: 'distance',
              message: "Hai đường thẳng trùng nhau.",
              exactLatex: "L_1 \\equiv L_2",
              decimal25: "Vô số giao điểm"
            };
          }
          return {
            type: 'distance',
            message: "Hai đường thẳng song song.",
            exactLatex: "L_1 \\parallel L_2",
            decimal25: "Không có giao điểm"
          };
        }
        
        const x = (b1 * c2 - b2 * c1) / det;
        const y = (c1 * a2 - c2 * a1) / det;
        
        const exactX = this.formatRadical(x);
        const exactY = this.formatRadical(y);
        
        const latexX = this.radicalToLatex(exactX);
        const latexY = this.radicalToLatex(exactY);
        
        Decimal.set({ precision: 50 });
        let decX = new Decimal(b1 * c2 - b2 * c1).div(new Decimal(det)).toFixed(25).replace(/\.?0+$/, "");
        let decY = new Decimal(c1 * a2 - c2 * a1).div(new Decimal(det)).toFixed(25).replace(/\.?0+$/, "");
        
        if (!decX.includes('.')) decX += ".0000000000000000000000000"; else decX = decX.padEnd(decX.indexOf('.') + 26, '0');
        if (!decY.includes('.')) decY += ".0000000000000000000000000"; else decY = decY.padEnd(decY.indexOf('.') + 26, '0');

        return {
          type: 'distance',
          message: `Giao điểm của 2 đường thẳng L1 và L2 trong mặt phẳng 2D là:`,
          exactLatex: `M\\left(${latexX};\\ ${latexY}\\right)`,
          decimal25: `M(${decX}; ${decY})`
        };
      } else {
        // 3D Lines
        const p1 = [obj1.a, obj1.c, obj1.e || 0];
        const v1 = [obj1.b, obj1.d, obj1.f || 0];
        const p2 = [obj2.a, obj2.c, obj2.e || 0];
        const v2 = [obj2.b, obj2.d, obj2.f || 0];

        const cross = this.crossProduct(v1, v2);
        const isParallel = this.isZeroVector(cross);

        if (isParallel) {
          const p1p2 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
          const crossPoint = this.crossProduct(p1p2, v1);
          if (this.isZeroVector(crossPoint)) {
            return { type: 'distance', message: "Hai đường thẳng trùng nhau.", exactLatex: "L_1 \\equiv L_2", decimal25: "Vô số giao điểm" };
          }
          return { type: 'distance', message: "Hai đường thẳng song song.", exactLatex: "L_1 \\parallel L_2", decimal25: "Không có giao điểm" };
        }

        const p1p2 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
        const tripleProduct = this.dotProduct(p1p2, cross);
        
        if (Math.abs(tripleProduct) < 1e-9) {
          const crossP1P2V2 = this.crossProduct(p1p2, v2);
          const t = this.dotProduct(crossP1P2V2, cross) / this.dotProduct(cross, cross);
          const x = p1[0] + t * v1[0];
          const y = p1[1] + t * v1[1];
          const z = p1[2] + t * v1[2];
          
          const exactX = this.formatRadical(x);
          const exactY = this.formatRadical(y);
          const exactZ = this.formatRadical(z);
          
          const latexX = this.radicalToLatex(exactX);
          const latexY = this.radicalToLatex(exactY);
          const latexZ = this.radicalToLatex(exactZ);
          
          Decimal.set({ precision: 50 });
          let decX = new Decimal(p1[0]).add(new Decimal(t).mul(v1[0])).toFixed(25).replace(/\.?0+$/, "");
          let decY = new Decimal(p1[1]).add(new Decimal(t).mul(v1[1])).toFixed(25).replace(/\.?0+$/, "");
          let decZ = new Decimal(p1[2]).add(new Decimal(t).mul(v1[2])).toFixed(25).replace(/\.?0+$/, "");
          
          if (!decX.includes('.')) decX += ".0000000000000000000000000"; else decX = decX.padEnd(decX.indexOf('.') + 26, '0');
          if (!decY.includes('.')) decY += ".0000000000000000000000000"; else decY = decY.padEnd(decY.indexOf('.') + 26, '0');
          if (!decZ.includes('.')) decZ += ".0000000000000000000000000"; else decZ = decZ.padEnd(decZ.indexOf('.') + 26, '0');

          return {
            type: 'distance',
            message: `Giao điểm của 2 đường thẳng L1 và L2 trong không gian 3D là:`,
            exactLatex: `M\\left(${latexX};\\ ${latexY};\\ ${latexZ}\\right)`,
            decimal25: `M(${decX}; ${decY}; ${decZ})`
          };
        }
        return {
          type: 'distance',
          message: "Hai đường thẳng chéo nhau (Skew lines) nên không có phương trình giao tuyến hay giao điểm chung.",
          exactLatex: "L_1 \\text{ chéo } L_2",
          decimal25: "Không có giao điểm"
        };
      }
    }

    return {
      type: 'distance',
      message: "Phương trình giao tuyến/Giao điểm chỉ áp dụng cho cặp (Mặt phẳng, Mặt phẳng) hoặc (Đường thẳng, Đường thẳng) hoặc một số cặp giao tuyến liên quan tương tự.",
      exactLatex: "?",
      decimal25: "?"
    };
  }

  private static formatNum(n: number): string {
    if (isNaN(n)) return "?";
    try {
      const f = evaluate(`fraction(${n})`);
      if (f && f.d && f.d < 1000) {
        return f.n === 0 ? "0" : (f.d === 1 ? `${f.n * f.s}` : `${f.n * f.s}/${f.d}`);
      }
    } catch (e) {}
    
    // Fallback to 25 decimal places if not a simple fraction
    const s = n.toFixed(25);
    // Remove trailing zeros
    return s.replace(/\.?0+$/, "");
  }

  public static formatPiVolume(r: number): string {
    const r3 = r * r * r;
    const coeff = (4 * r3) / 3;
    
    // Try to format as a*sqrt(b)*pi/c
    const radicalPart = this.formatRadical(coeff);
    if (radicalPart.includes('sqrt') || radicalPart.includes('/')) {
      // If it's a complex radical or fraction, wrap it
      if (radicalPart.includes('/')) {
        const [num, den] = radicalPart.split('/');
        return `(${num}*π)/${den}`;
      }
      return `${radicalPart}*π`;
    }
    
    return `${radicalPart}*π`;
  }

  private static formatRadical(n: number): string {
    if (isNaN(n)) return "?";
    if (Math.abs(n) < 1e-9) return "0";
    
    const sign = n < 0 ? "-" : "";
    const absN = Math.abs(n);
    const n2 = absN * absN;
    try {
      const f = evaluate(`fraction(${n2})`);
      if (f && f.d && f.d < 10000) {
        const num = f.n * f.d;
        let simplifiedA = 1;
        let remainingB = num;
        for (let i = 2; i * i <= remainingB; i++) {
          while (remainingB % (i * i) === 0) {
            simplifiedA *= i;
            remainingB /= (i * i);
          }
        }
        
        const common = this.gcd(simplifiedA, f.d);
        const finalA = simplifiedA / common;
        const finalD = f.d / common;
        
        if (remainingB === 1) {
          const res = finalD === 1 ? `${finalA}` : `${finalA}/${finalD}`;
          return sign + res;
        } else {
          const partA = finalA === 1 ? "" : `${finalA}*`;
          const partSqrt = `sqrt(${remainingB})`;
          const res = finalD === 1 ? `${partA}${partSqrt}` : `(${partA}${partSqrt})/${finalD}`;
          return sign + res;
        }
      }
    } catch (e) {}
    
    return this.formatNum(n);
  }

  private static gcd(a: number, b: number): number {
    return b === 0 ? Math.abs(a) : this.gcd(b, a % b);
  }

  static compareLineSphere(l: any, s: any) {
    // Line: x = a+bt, y = c+dt, z = e+ft
    const A = l.b**2 + l.d**2 + l.f**2;
    if (A === 0) {
      return { type: 'distance', message: "Đường thẳng không hợp lệ.", exactLatex: "?", decimal25: "?" };
    }
    
    const dx = l.a - s.x0;
    const dy = l.c - s.y0;
    const dz = l.e - s.z0;
    
    const B = 2 * (l.b * dx + l.d * dy + l.f * dz);
    const C = dx**2 + dy**2 + dz**2 - s.r**2;
    const delta = B**2 - 4 * A * C;
    
    // Calculate projection H on line (closest to center)
    const tH = -(l.b * dx + l.d * dy + l.f * dz) / A;
    const xH = l.a + l.b * tH;
    const yH = l.c + l.d * tH;
    const zH = l.e + l.f * tH;
    
    const distSq = (xH - s.x0)**2 + (yH - s.y0)**2 + (zH - s.z0)**2;
    const { exactLatex: exactDist, decimal25: decDist } = this.getExactDistanceAndDecimal(distSq);
    
    const latexX_H = this.radicalToLatex(this.formatRadical(xH));
    const latexY_H = this.radicalToLatex(this.formatRadical(yH));
    const latexZ_H = this.radicalToLatex(this.formatRadical(zH));
    
    Decimal.set({ precision: 50 });
    let decX_H = new Decimal(l.a).add(new Decimal(l.b).mul(tH)).toFixed(25).replace(/\.?0+$/, "");
    let decY_H = new Decimal(l.c).add(new Decimal(l.d).mul(tH)).toFixed(25).replace(/\.?0+$/, "");
    let decZ_H = new Decimal(l.e).add(new Decimal(l.f).mul(tH)).toFixed(25).replace(/\.?0+$/, "");
    
    if (!decX_H.includes('.')) decX_H += ".0000000000000000000000000"; else decX_H = decX_H.padEnd(decX_H.indexOf('.') + 26, '0');
    if (!decY_H.includes('.')) decY_H += ".0000000000000000000000000"; else decY_H = decY_H.padEnd(decY_H.indexOf('.') + 26, '0');
    if (!decZ_H.includes('.')) decZ_H += ".0000000000000000000000000"; else decZ_H = decZ_H.padEnd(decZ_H.indexOf('.') + 26, '0');

    if (Math.abs(delta) < 1e-8) {
      const t = -B / (2 * A);
      const x = l.a + l.b * t;
      const y = l.c + l.d * t;
      const z = l.e + l.f * t;
      const latexX = this.radicalToLatex(this.formatRadical(x));
      const latexY = this.radicalToLatex(this.formatRadical(y));
      const latexZ = this.radicalToLatex(this.formatRadical(z));

      let decX = new Decimal(l.a).add(new Decimal(l.b).mul(t)).toFixed(25).replace(/\.?0+$/, "");
      let decY = new Decimal(l.c).add(new Decimal(l.d).mul(t)).toFixed(25).replace(/\.?0+$/, "");
      let decZ = new Decimal(l.e).add(new Decimal(l.f).mul(t)).toFixed(25).replace(/\.?0+$/, "");
      
      if (!decX.includes('.')) decX += ".0000000000000000000000000"; else decX = decX.padEnd(decX.indexOf('.') + 26, '0');
      if (!decY.includes('.')) decY += ".0000000000000000000000000"; else decY = decY.padEnd(decY.indexOf('.') + 26, '0');
      if (!decZ.includes('.')) decZ += ".0000000000000000000000000"; else decZ = decZ.padEnd(decZ.indexOf('.') + 26, '0');

      return {
        type: 'distance',
        message: `Đường thẳng L tiếp xúc với mặt cầu S tại duy nhất một điểm tiếp xúc M:`,
        exactLatex: `d(I, L) = R = ${exactDist} \\implies M\\left(${latexX};\\ ${latexY};\\ ${latexZ}\\right)`,
        decimal25: `Khoảng cách d = ${decDist}\nĐiểm tiếp xúc M(${decX}; ${decY}; ${decZ})`
      };
    } else if (delta > 0) {
      const t1 = (-B + Math.sqrt(delta)) / (2 * A);
      const t2 = (-B - Math.sqrt(delta)) / (2 * A);
      
      const x1 = l.a + l.b * t1;
      const y1 = l.c + l.d * t1;
      const z1 = l.e + l.f * t1;
      
      const x2 = l.a + l.b * t2;
      const y2 = l.c + l.d * t2;
      const z2 = l.e + l.f * t2;

      const latexX1 = this.radicalToLatex(this.formatRadical(x1));
      const latexY1 = this.radicalToLatex(this.formatRadical(y1));
      const latexZ1 = this.radicalToLatex(this.formatRadical(z1));
      
      const latexX2 = this.radicalToLatex(this.formatRadical(x2));
      const latexY2 = this.radicalToLatex(this.formatRadical(y2));
      const latexZ2 = this.radicalToLatex(this.formatRadical(z2));

      const dA = new Decimal(A);
      const dB = new Decimal(B);
      const dC = new Decimal(C);
      const dDelta = dB.pow(2).sub(dA.mul(dC).mul(4));
      const dSqrtDelta = dDelta.squareRoot();
      const dT1 = dB.neg().add(dSqrtDelta).div(dA.mul(2));
      const dT2 = dB.neg().sub(dSqrtDelta).div(dA.mul(2));

      let decX1 = new Decimal(l.a).add(new Decimal(l.b).mul(dT1)).toFixed(25).replace(/\.?0+$/, "");
      let decY1 = new Decimal(l.c).add(new Decimal(l.d).mul(dT1)).toFixed(25).replace(/\.?0+$/, "");
      let decZ1 = new Decimal(l.e).add(new Decimal(l.f).mul(dT1)).toFixed(25).replace(/\.?0+$/, "");
      
      let decX2 = new Decimal(l.a).add(new Decimal(l.b).mul(dT2)).toFixed(25).replace(/\.?0+$/, "");
      let decY2 = new Decimal(l.c).add(new Decimal(l.d).mul(dT2)).toFixed(25).replace(/\.?0+$/, "");
      let decZ2 = new Decimal(l.e).add(new Decimal(l.f).mul(dT2)).toFixed(25).replace(/\.?0+$/, "");
      
      if (!decX1.includes('.')) decX1 += ".0000000000000000000000000"; else decX1 = decX1.padEnd(decX1.indexOf('.') + 26, '0');
      if (!decY1.includes('.')) decY1 += ".0000000000000000000000000"; else decY1 = decY1.padEnd(decY1.indexOf('.') + 26, '0');
      if (!decZ1.includes('.')) decZ1 += ".0000000000000000000000000"; else decZ1 = decZ1.padEnd(decZ1.indexOf('.') + 26, '0');
      
      if (!decX2.includes('.')) decX2 += ".0000000000000000000000000"; else decX2 = decX2.padEnd(decX2.indexOf('.') + 26, '0');
      if (!decY2.includes('.')) decY2 += ".0000000000000000000000000"; else decY2 = decY2.padEnd(decY2.indexOf('.') + 26, '0');
      if (!decZ2.includes('.')) decZ2 += ".0000000000000000000000000"; else decZ2 = decZ2.padEnd(decZ2.indexOf('.') + 26, '0');

      return {
        type: 'distance',
        message: `Đường thẳng L cắt mặt cầu S tại hai giao điểm phân biệt M1 và M2:`,
        exactLatex: `M_1\\left(${latexX1};\\ ${latexY1};\\ ${latexZ1}\\right), \\quad M_2\\left(${latexX2};\\ ${latexY2};\\ ${latexZ2}\\right), \\quad d(I, L) = ${exactDist}`,
        decimal25: `Giao điểm M1(${decX1}; ${decY1}; ${decZ1})\nGiao điểm M2(${decX2}; ${decY2}; ${decZ2})\nKhoảng cách d = ${decDist}`
      };
    } else {
      return {
        type: 'distance',
        message: `Đường thẳng L không cắt mặt cầu S (do khoảng cách từ tâm đến đường thẳng lớn hơn bán kính mặt cầu):`,
        exactLatex: `d(I, L) = ${exactDist} > R = ${this.radicalToLatex(this.formatRadical(s.r))} \\implies H\\text{ hình chiếu: } H\\left(${latexX_H};\\ ${latexY_H};\\ ${latexZ_H}\\right)`,
        decimal25: `Khoảng cách d = ${decDist}\nHình chiếu H(${decX_H}; ${decY_H}; ${decZ_H})`
      };
    }
  }

  private static dotProduct(v1: number[], v2: number[]) {
    return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
  }

  private static crossProduct(v1: number[], v2: number[]) {
    return [
      v1[1] * v2[2] - v1[2] * v2[1],
      v1[2] * v2[0] - v1[0] * v2[2],
      v1[0] * v2[1] - v1[1] * v2[0]
    ];
  }

  private static isZeroVector(v: number[]) {
    return v.every(x => Math.abs(x) < 1e-9);
  }
}
