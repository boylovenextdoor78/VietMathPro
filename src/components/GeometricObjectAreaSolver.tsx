import { useState, useMemo } from 'react';
import Decimal from 'decimal.js';
import {
  Triangle as TriangleIcon,
  Circle as CircleIcon,
  Compass,
  Layers,
  RefreshCw,
  HelpCircle,
  Hash,
  LineChart,
  Grid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Angle Rounding & Balancer strictly as requested ---
const checkAndRoundAngle = (ang: Decimal): { rounded: boolean; val: Decimal } => {
  const roundedInt = ang.round();
  const diff = ang.minus(roundedInt).abs();
  
  // Method 1: Check absolute difference is extremely tiny (less than 1e-12)
  if (diff.lt('1e-12')) {
    return { rounded: true, val: roundedInt };
  }
  
  // Method 2: Check for 17 consecutive '9's or '0's anywhere in the string representation (stripping '.')
  const str = ang.toString().replace('.', '');
  if (/9{17,}/.test(str) || /0{17,}/.test(str)) {
    return { rounded: true, val: roundedInt };
  }
  
  // Method 3: Check if the fractional part starts with a long run of 9s or 0s
  const decimalPart = ang.toString().split('.')[1] || '';
  if (decimalPart.startsWith('999999999999999') || decimalPart.startsWith('000000000000000')) {
    return { rounded: true, val: roundedInt };
  }
  
  return { rounded: false, val: ang };
};

const adjustAnglesSum = (angleA: Decimal, angleB: Decimal, angleC: Decimal): { a: Decimal; b: Decimal; c: Decimal } => {
  const checkA = checkAndRoundAngle(angleA);
  const checkB = checkAndRoundAngle(angleB);
  const checkC = checkAndRoundAngle(angleC);

  const angles = [
    { index: 0, original: angleA, rounded: checkA.rounded, val: checkA.val },
    { index: 1, original: angleB, rounded: checkB.rounded, val: checkB.val },
    { index: 2, original: angleC, rounded: checkC.rounded, val: checkC.val },
  ];

  const roundedCount = angles.filter(a => a.rounded).length;

  if (roundedCount === 0) {
    // If none rounded specifically, make sure they still sum to exactly 180 (distribute any floating-point error)
    const currentSum = angleA.plus(angleB).plus(angleC);
    const diff = new Decimal(180).minus(currentSum);
    return { a: angleA, b: angleB, c: angleC.plus(diff) };
  }

  if (roundedCount === 3) {
    const sum = angles[0].val.plus(angles[1].val).plus(angles[2].val);
    const diff = new Decimal(180).minus(sum);
    if (!diff.isZero()) {
      let largestDiffIdx = 0;
      let maxFracDiff = new Decimal(-1);
      angles.forEach((ang, idx) => {
        const fracDiff = ang.original.minus(ang.val).abs();
        if (fracDiff.gt(maxFracDiff)) {
          maxFracDiff = fracDiff;
          largestDiffIdx = idx;
        }
      });
      angles[largestDiffIdx].val = angles[largestDiffIdx].val.plus(diff);
    }
    return {
      a: angles[0].val,
      b: angles[1].val,
      c: angles[2].val
    };
  }

  if (roundedCount === 2) {
    const roundedAngles = angles.filter(a => a.rounded);
    const nonRoundedAngle = angles.find(a => !a.rounded)!;
    
    nonRoundedAngle.val = new Decimal(180).minus(roundedAngles[0].val).minus(roundedAngles[1].val);
    
    const finalAngles = [new Decimal(0), new Decimal(0), new Decimal(0)];
    angles.forEach(item => {
      finalAngles[item.index] = item.val;
    });
    return { a: finalAngles[0], b: finalAngles[1], c: finalAngles[2] };
  }

  if (roundedCount === 1) {
    const roundedAngle = angles.find(a => a.rounded)!;
    const nonRounded = angles.filter(a => !a.rounded);

    const targetSumForNonRounded = new Decimal(180).minus(roundedAngle.val);
    const currentSumForNonRounded = nonRounded[0].original.plus(nonRounded[1].original);
    const diff = targetSumForNonRounded.minus(currentSumForNonRounded);

    const totalOriginalNonRounded = nonRounded[0].original.plus(nonRounded[1].original);
    if (totalOriginalNonRounded.isZero()) {
      nonRounded[0].val = diff.dividedBy(2);
      nonRounded[1].val = diff.dividedBy(2);
    } else {
      nonRounded[0].val = nonRounded[0].original.plus(diff.times(nonRounded[0].original).dividedBy(totalOriginalNonRounded));
      nonRounded[1].val = nonRounded[1].original.plus(diff.times(nonRounded[1].original).dividedBy(totalOriginalNonRounded));
    }

    const finalAngles = [new Decimal(0), new Decimal(0), new Decimal(0)];
    angles.forEach(item => {
      finalAngles[item.index] = item.val;
    });
    return { a: finalAngles[0], b: finalAngles[1], c: finalAngles[2] };
  }

  return { a: angleA, b: angleB, c: angleC };
};

// Utilities
const degToRad = (deg: Decimal): Decimal => deg.times(Decimal.acos(-1)).dividedBy(180);
const radToDeg = (rad: Decimal): Decimal => rad.times(180).dividedBy(Decimal.acos(-1));

const getTriangleClassification = (a: Decimal, b: Decimal, c: Decimal, angA: Decimal, angB: Decimal, angC: Decimal): string[] => {
  const classes: string[] = [];
  
  // Classification by side lengths
  const eps = 0.0001;
  const abDiff = a.minus(b).abs().toNumber();
  const bcDiff = b.minus(c).abs().toNumber();
  const acDiff = a.minus(c).abs().toNumber();
  
  const isEquilateral = (abDiff < eps && bcDiff < eps);
  const isIsosceles = !isEquilateral && (abDiff < eps || bcDiff < eps || acDiff < eps);

  if (isEquilateral) classes.push("Đều (Equilateral)");
  else if (isIsosceles) classes.push("Cân (Isosceles)");
  else classes.push("Thường (Scalene)");

  // Classification by angles
  const maxAng = Decimal.max(angA, angB, angC).toNumber();
  
  const hasRight = Math.abs(angA.toNumber() - 90) < eps || Math.abs(angB.toNumber() - 90) < eps || Math.abs(angC.toNumber() - 90) < eps;
  
  if (hasRight) {
    if (isIsosceles) {
      classes.push("Vuông cân (Right Isosceles)");
    } else {
      classes.push("Vuông (Right-angled)");
    }
  } else if (maxAng > 90.0001) {
    classes.push("Tù (Obtuse)");
  } else {
    classes.push("Nhọn (Acute)");
  }
  
  return classes;
};

export default function GeometricObjectAreaSolver() {
  const [activeTab, setActiveTab] = useState<'triangle' | 'points_centers' | 'interaction' | 'other_shapes'>('triangle');

  // Tab 1 state: Solver SSS/SAS/ASA/Coordinate
  const [triMode, setTriMode] = useState<'sss' | 'sas' | 'asa' | 'coords'>('sss');
  const [triInput, setTriInput] = useState<Record<string, string>>({
    sss_a: '3', sss_b: '4', sss_c: '5',
    sas_a: '10', sas_b: '12', sas_C: '60',
    asa_A: '45', asa_B: '60', asa_c: '8',
    coords_ax: '0', coords_ay: '0',
    coords_bx: '4', coords_by: '0',
    coords_cx: '0', coords_cy: '3',
  });
  const [triResult, setTriResult] = useState<any>(null);
  const [triError, setTriError] = useState<string | null>(null);

  // Tab 2 state: Centers & Radii
  const [centerMode, setCenterMode] = useState<'sss' | 'coords'>('coords');
  const [centerInput, setCenterInput] = useState<Record<string, string>>({
    sss_a: '6', sss_b: '8', sss_c: '10',
    coords_ax: '0', coords_ay: '0',
    coords_bx: '8', coords_by: '0',
    coords_cx: '2', coords_cy: '6',
  });
  const [centerResult, setCenterResult] = useState<any>(null);
  const [centerError, setCenterError] = useState<string | null>(null);

  // Tab 3 state: Interaction Circle-Triangle
  const [interInput, setInterInput] = useState<Record<string, string>>({
    tx: '0', ty: '0',
    ux: '10', uy: '0',
    vx: '0', vy: '10',
    cx: '3', cy: '3', cr: '2'
  });
  const [interResult, setInterResult] = useState<any>(null);

  // Tab 4 state: Other Shapes & Sector Tool
  const [sectorR, setSectorR] = useState<string>('5');
  const [sectorAlpha, setSectorAlpha] = useState<string>('90');
  const [sectorResult, setSectorResult] = useState<any>(null);

  // Helper clear action wrapper
  const handleClear = (tab: string) => {
    if (tab === 'triangle') {
      setTriResult(null);
      setTriError(null);
    } else if (tab === 'points_centers') {
      setCenterResult(null);
      setCenterError(null);
    } else if (tab === 'interaction') {
      setInterResult(null);
    } else if (tab === 'other_shapes') {
      setSectorResult(null);
    }
  };

  // --- SOLVE TRIANGLE (HERON & CLASSIFICATION) ---
  const solveTriangleTab1 = () => {
    setTriError(null);
    setTriResult(null);
    try {
      let a = new Decimal(0);
      let b = new Decimal(0);
      let c = new Decimal(0);
      let angleA = new Decimal(0);
      let angleB = new Decimal(0);
      let angleC = new Decimal(0);
      let ax = 0, ay = 0, bx = 0, by = 0, cx = 0, cy = 0;
      let hasCoords = false;

      if (triMode === 'sss') {
        a = new Decimal(triInput.sss_a || '0');
        b = new Decimal(triInput.sss_b || '0');
        c = new Decimal(triInput.sss_c || '0');

        if (a.lte(0) || b.lte(0) || c.lte(0)) {
          throw new Error("Tất cả các cạnh phải lớn hơn 0");
        }
        if (a.plus(b).lte(c) || a.plus(c).lte(b) || b.plus(c).lte(a)) {
          throw new Error("Không thỏa mãn bất đẳng thức tam giác (mỗi tổng 2 cạnh phải lớn hơn cạnh còn lại)");
        }

        // Cosine rule
        const cosA = b.pow(2).plus(c.pow(2)).minus(a.pow(2)).dividedBy(b.times(c).times(2));
        const cosB = a.pow(2).plus(c.pow(2)).minus(b.pow(2)).dividedBy(a.times(c).times(2));
        const cosC = a.pow(2).plus(b.pow(2)).minus(c.pow(2)).dividedBy(a.times(b).times(2));

        angleA = radToDeg(Decimal.acos(cosA));
        angleB = radToDeg(Decimal.acos(cosB));
        angleC = radToDeg(Decimal.acos(cosC));

      } else if (triMode === 'sas') {
        a = new Decimal(triInput.sas_a || '0');
        b = new Decimal(triInput.sas_b || '0');
        const Cdeg = new Decimal(triInput.sas_C || '0');

        if (a.lte(0) || b.lte(0)) {
          throw new Error("Cạnh phải lớn hơn 0");
        }
        if (Cdeg.lte(0) || Cdeg.gte(180)) {
          throw new Error("Góc phải lớn hơn 0° và nhỏ hơn 180°");
        }

        angleC = Cdeg;
        const radC = degToRad(angleC);
        
        // law of cosines for c
        const cSq = a.pow(2).plus(b.pow(2)).minus(a.times(b).times(2).times(Decimal.cos(radC)));
        if (cSq.lte(0)) throw new Error("Tính toán không hợp lệ, vui lòng kiểm tra lại");
        c = cSq.squareRoot();

        const cosA = b.pow(2).plus(c.pow(2)).minus(a.pow(2)).dividedBy(b.times(c).times(2));
        angleA = radToDeg(Decimal.acos(cosA));
        angleB = new Decimal(180).minus(angleA).minus(angleC);

      } else if (triMode === 'asa') {
        const Adeg = new Decimal(triInput.asa_A || '0');
        const Bdeg = new Decimal(triInput.asa_B || '0');
        c = new Decimal(triInput.asa_c || '0');

        if (c.lte(0)) throw new Error("Cạnh c phải lớn hơn 0");
        if (Adeg.lte(0) || Bdeg.lte(0) || Adeg.plus(Bdeg).gte(180)) {
          throw new Error("Tổng hai góc phải lớn hơn 0° và nhỏ hơn 180°");
        }

        angleA = Adeg;
        angleB = Bdeg;
        angleC = new Decimal(180).minus(angleA).minus(angleB);

        const radA = degToRad(angleA);
        const radB = degToRad(angleB);
        const radC = degToRad(angleC);

        a = c.times(Decimal.sin(radA)).dividedBy(Decimal.sin(radC));
        b = c.times(Decimal.sin(radB)).dividedBy(Decimal.sin(radC));

      } else if (triMode === 'coords') {
        ax = parseFloat(triInput.coords_ax || '0');
        ay = parseFloat(triInput.coords_ay || '0');
        bx = parseFloat(triInput.coords_bx || '0');
        by = parseFloat(triInput.coords_by || '0');
        cx = parseFloat(triInput.coords_cx || '0');
        cy = parseFloat(triInput.coords_cy || '0');

        hasCoords = true;

        const sideC = Decimal.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
        const sideB = Decimal.sqrt(Math.pow(ax - cx, 2) + Math.pow(ay - cy, 2));
        const sideA = Decimal.sqrt(Math.pow(bx - cx, 2) + Math.pow(by - cy, 2));

        if (sideA.lte(0) || sideB.lte(0) || sideC.lte(0)) {
          throw new Error("Tọa độ trùng nhau, không thể tạo tam giác");
        }

        a = sideA;
        b = sideB;
        c = sideC;

        if (a.plus(b).lte(c) || a.plus(c).lte(b) || b.plus(c).lte(a)) {
          throw new Error("3 điểm thẳng hàng hoặc không thể tạo thành tam giác");
        }

        const cosA = b.pow(2).plus(c.pow(2)).minus(a.pow(2)).dividedBy(b.times(c).times(2));
        const cosB = a.pow(2).plus(c.pow(2)).minus(b.pow(2)).dividedBy(a.times(c).times(2));
        const cosC = a.pow(2).plus(b.pow(2)).minus(c.pow(2)).dividedBy(a.times(b).times(2));

        angleA = radToDeg(Decimal.acos(cosA));
        angleB = radToDeg(Decimal.acos(cosB));
        angleC = radToDeg(Decimal.acos(cosC));
      }

      // --- Apply high precision adjustment & balancing ---
      const adjusted = adjustAnglesSum(angleA, angleB, angleC);
      angleA = adjusted.a;
      angleB = adjusted.b;
      angleC = adjusted.c;

      // Calculate perimeter and area using exact Heron formula: S = sqrt(p * (p-a) * (p-b) * (p-c))
      const perimeter = a.plus(b).plus(c);
      const semiPerimeter = perimeter.dividedBy(2);
      const areaSq = semiPerimeter.times(semiPerimeter.minus(a)).times(semiPerimeter.minus(b)).times(semiPerimeter.minus(c));
      
      if (areaSq.lte(0)) {
        throw new Error("Không thể tính diện tích (lỗi dưới căn Heron). Vui lòng kiểm tra lại kích thước tam giác");
      }
      
      const area = areaSq.squareRoot();
      const h_a = area.times(2).dividedBy(a);
      const h_b = area.times(2).dividedBy(b);
      const h_c = area.times(2).dividedBy(c);

      const classification = getTriangleClassification(a, b, c, angleA, angleB, angleC);

      // Generate standard planar coordinates if we don't have coordinates inputs (placed to view SVG)
      if (!hasCoords) {
        ax = 0; ay = 0;
        bx = c.toNumber(); by = 0;
        // Vertex C from angle A and side b
        const radAngleA = degToRad(angleA).toNumber();
        cx = b.toNumber() * Math.cos(radAngleA);
        cy = b.toNumber() * Math.sin(radAngleA);
      }

      setTriResult({
        sideA: a.toNumber(),
        sideB: b.toNumber(),
        sideC: c.toNumber(),
        angleA: angleA.toNumber(),
        angleB: angleB.toNumber(),
        angleC: angleC.toNumber(),
        perimeter: perimeter.toNumber(),
        semiPerimeter: semiPerimeter.toNumber(),
        area: area.toNumber(),
        h_a: h_a.toNumber(),
        h_b: h_b.toNumber(),
        h_c: h_c.toNumber(),
        coords: { ax, ay, bx, by, cx, cy },
        classification
      });
    } catch (err: any) {
      setTriError(err.message || "Lỗi xử lý tam giác");
    }
  };

  // --- SOLVE INCIRCLE & CIRCUMCIRCLE (TAB 2) ---
  const solveCenters = () => {
    setCenterError(null);
    setCenterResult(null);
    try {
      let a = new Decimal(0);
      let b = new Decimal(0);
      let c = new Decimal(0);
      let ax = 0, ay = 0, bx = 0, by = 0, cx = 0, cy = 0;

      if (centerMode === 'coords') {
        ax = parseFloat(centerInput.coords_ax || '0');
        ay = parseFloat(centerInput.coords_ay || '0');
        bx = parseFloat(centerInput.coords_bx || '0');
        by = parseFloat(centerInput.coords_by || '0');
        cx = parseFloat(centerInput.coords_cx || '0');
        cy = parseFloat(centerInput.coords_cy || '0');

        const d_c = Decimal.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
        const d_b = Decimal.sqrt(Math.pow(ax - cx, 2) + Math.pow(ay - cy, 2));
        const d_a = Decimal.sqrt(Math.pow(bx - cx, 2) + Math.pow(by - cy, 2));

        if (d_a.lte(0) || d_b.lte(0) || d_c.lte(0)) {
          throw new Error("Tọa độ trùng nhau, không thể tạo tam giác");
        }

        a = d_a;
        b = d_b;
        c = d_c;

        if (a.plus(b).lte(c) || a.plus(c).lte(b) || b.plus(c).lte(a)) {
          throw new Error("3 điểm thẳng hàng hoặc không tạo thành tam giác");
        }
      } else {
        // SSS
        a = new Decimal(centerInput.sss_a || '0');
        b = new Decimal(centerInput.sss_b || '0');
        c = new Decimal(centerInput.sss_c || '0');

        if (a.lte(0) || b.lte(0) || c.lte(0)) {
          throw new Error("Các cạnh phải lớn hơn 0");
        }
        if (a.plus(b).lte(c) || a.plus(c).lte(b) || b.plus(c).lte(a)) {
          throw new Error("Không thỏa mãn bất đẳng thức tam giác");
        }

        // Place on Cartesian plane
        ax = 0; ay = 0;
        bx = c.toNumber(); by = 0;
        // Law of Cosines for C
        const cosA = b.pow(2).plus(c.pow(2)).minus(a.pow(2)).dividedBy(b.times(c).times(2));
        const angleA = Decimal.acos(cosA);
        cx = b.toNumber() * Math.cos(angleA.toNumber());
        cy = b.toNumber() * Math.sin(angleA.toNumber());
      }

      // Perimeter & semiPerimeter
      const perimeter = a.plus(b).plus(c);
      const halfP = perimeter.dividedBy(2);
      const area = halfP.times(halfP.minus(a)).times(halfP.minus(b)).times(halfP.minus(c)).squareRoot();

      if (area.lte(0)) {
        throw new Error("Không thể lập tam giác có diện tích dương");
      }

      // 1. Incenter (Tâm nội tiếp)
      const incenterX = a.times(ax).plus(b.times(bx)).plus(c.times(cx)).dividedBy(perimeter).toNumber();
      const incenterY = a.times(ay).plus(b.times(by)).plus(c.times(cy)).dividedBy(perimeter).toNumber();
      
      // Inradius r
      const inradius = area.dividedBy(halfP).toNumber();

      // 2. Circumcenter (Tâm ngoại tiếp)
      const D_val = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
      if (Math.abs(D_val) < 0.000001) {
        throw new Error("Tam giác đặc biệt hay thẳng hàng, không thể tính đường tròn ngoại tiếp");
      }

      const sqA = ax*ax + ay*ay;
      const sqB = bx*bx + by*by;
      const sqC = cx*cx + cy*cy;

      const circumcenterX = ((sqA * (by - cy)) + (sqB * (cy - ay)) + (sqC * (ay - by))) / D_val;
      const circumcenterY = ((sqA * (cx - bx)) + (sqB * (ax - cx)) + (sqC * (bx - ax))) / D_val;

      // Circumradius R = (a*b*c) / 4S
      const circumradius = a.times(b).times(c).dividedBy(area.times(4)).toNumber();

      setCenterResult({
        coords: { ax, ay, bx, by, cx, cy },
        sides: { a: a.toNumber(), b: b.toNumber(), c: c.toNumber() },
        area: area.toNumber(),
        perimeter: perimeter.toNumber(),
        incenter: { x: incenterX, y: incenterY },
        inradius,
        circumcenter: { x: circumcenterX, y: circumcenterY },
        circumradius
      });
    } catch (err: any) {
      setCenterError(err.message || "Lỗi xử lý tâm đường tròn");
    }
  };

  // --- INTERACTION CIRCLE-TRIANGLE (TAB 3) ---
  const solveInteraction = () => {
    try {
      const ax = parseFloat(interInput.tx);
      const ay = parseFloat(interInput.ty);
      const bx = parseFloat(interInput.ux);
      const by = parseFloat(interInput.uy);
      const cx = parseFloat(interInput.vx);
      const cy = parseFloat(interInput.vy);

      const circleX = parseFloat(interInput.cx);
      const circleY = parseFloat(interInput.cy);
      const circleR = parseFloat(interInput.cr);

      if (circleR <= 0) {
        alert("Bán kính đường tròn phải lớn hơn 0");
        return;
      }

      // 1. Calculate side-lengths and areas using standard floats
      const cp = (p1x: number, p1y: number, p2x: number, p2y: number, p3x: number, p3y: number) => {
        return (p2x - p1x) * (p3y - p1y) - (p2y - p1y) * (p3x - p1x);
      };

      const dot = (p1x: number, p1y: number, p2x: number, p2y: number, p3x: number, p3y: number) => {
        return (p2x - p1x) * (p3x - p1x) + (p2y - p1y) * (p3y - p1y);
      };

      const sqDist = (p1x: number, p1y: number, p2x: number, p2y: number) => {
        return (p2x - p1x) * (p2x - p1x) + (p2y - p1y) * (p2y - p1y);
      };

      // Check if Circle Center is inside Triangle
      const cp1 = cp(ax, ay, bx, by, circleX, circleY);
      const cp2 = cp(bx, by, cx, cy, circleX, circleY);
      const cp3 = cp(cx, cy, ax, ay, circleX, circleY);

      const hasNeg = (cp1 < 0) || (cp2 < 0) || (cp3 < 0);
      const hasPos = (cp1 > 0) || (cp2 > 0) || (cp3 > 0);
      const isCenterInside = !(hasNeg && hasPos);

      // Check distance from Circle Center to each triangle segment
      const pointToSegmentDist = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
        const l2 = sqDist(x1, y1, x2, y2);
        if (l2 === 0) return Math.sqrt(sqDist(px, py, x1, y1));
        let t = dot(x1, y1, x2, y2, px, py) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.sqrt(sqDist(px, py, x1 + t * (x2 - x1), y1 + t * (y2 - y1)));
      };

      const distToAB = pointToSegmentDist(circleX, circleY, ax, ay, bx, by);
      const distToBC = pointToSegmentDist(circleX, circleY, bx, by, cx, cy);
      const distToCA = pointToSegmentDist(circleX, circleY, cx, cy, ax, ay);

      const minDistToBoundary = Math.min(distToAB, distToBC, distToCA);

      // Determine vertices distance to circle center
      const dUASq = sqDist(circleX, circleY, ax, ay);
      const dUBSq = sqDist(circleX, circleY, bx, by);
      const dUCSq = sqDist(circleX, circleY, cx, cy);

      const dUA = Math.sqrt(dUASq);
      const dUB = Math.sqrt(dUBSq);
      const dUC = Math.sqrt(dUCSq);

      const allVerticesInside = dUA < circleR && dUB < circleR && dUC < circleR;
      const allVerticesOutside = dUA > circleR && dUB > circleR && dUC > circleR;

      let positionType = "";
      if (allVerticesInside) {
        positionType = "Tam giác hoàn toàn NẰM TRONG đường tròn.";
      } else if (isCenterInside && minDistToBoundary > circleR) {
        positionType = "Đường tròn hoàn toàn NẰM TRONG tam giác.";
      } else if (allVerticesOutside && !isCenterInside && minDistToBoundary > circleR) {
        positionType = "Đường tròn và Tam giác HOÀN TOÀN TÁCH RỜI nhau (Không giao nhau).";
      } else {
        positionType = "Đường tròn và Tam giác CÓ CHỒNG LẤN & GIAO NHAU (Intersecting / Overlapping).";
      }

      setInterResult({
        coords: { ax, ay, bx, by, cx, cy, circleX, circleY, circleR },
        isCenterInside,
        distToAB, distToBC, distToCA,
        minDistToBoundary,
        positionType
      });
    } catch (e) {
      alert("Đầu vào không hợp lệ");
    }
  };

  // --- SOLVE OTHER SHAPES (CIRCLE SECTOR - TAB 4) ---
  const solveSector = () => {
    try {
      const radius = parseFloat(sectorR);
      const alpha = parseFloat(sectorAlpha);

      if (radius <= 0) {
        alert("Bán kính phải lớn hơn 0");
        return;
      }
      if (alpha <= 0 || alpha > 360) {
        alert("Góc ở tâm α phải nằm trong khoảng (0°, 360°]");
        return;
      }

      // High precision decimals
      const R = new Decimal(radius);
      const A = new Decimal(alpha);
      const pi = Decimal.acos(-1);

      // Area of circle sector: S = pi * R^2 * (alpha / 360)
      const area = pi.times(R.pow(2)).times(A.dividedBy(360));
      // Arc length: l = 2 * pi * R * (alpha / 360)
      const arcLength = pi.times(R.times(2)).times(A.dividedBy(360));
      // Total Perimeter: l + 2R
      const totalPerimeter = arcLength.plus(R.times(2));

      setSectorResult({
        radius: R.toNumber(),
        alpha: A.toNumber(),
        area: area.toNumber(),
        arcLength: arcLength.toNumber(),
        perimeter: totalPerimeter.toNumber()
      });
    } catch (e) {
      alert("Lỗi tính toán hình quạt");
    }
  };

  // --- SVG BOUNDING BOX AUTO RENDER CALCULATOR ---
  const renderSVGPoints = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return { viewBox: "0 0 100 100", ptsStr: "" };
    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const w = maxX - minX || 1;
    const h = maxY - minY || 1;

    // Add 25% margin padding
    const padding = Math.max(w, h) * 0.25 || 10;
    const viewX = minX - padding;
    const viewY = minY - padding;
    const viewW = w + padding * 2;
    const viewH = h + padding * 2;

    const viewBoxCoords = `${viewX} ${viewY} ${viewW} ${viewH}`;
    return {
      viewBox: viewBoxCoords,
      minX, maxX, minY, maxY,
      w, h
    };
  };

  const svgTriangleDetails = useMemo(() => {
    if (!triResult) return null;
    const { ax, ay, bx, by, cx, cy } = triResult.coords;
    // SVGs have inverted Y axis compared to traditional Cartesian plots, we multiply y by -1 to show vertices pointed upwards correctly
    const pts = [
      { x: ax, y: -ay },
      { x: bx, y: -by },
      { x: cx, y: -cy }
    ];
    const layout = renderSVGPoints(pts);

    return {
      pts,
      viewBox: layout.viewBox
    };
  }, [triResult]);

  const svgCentersDetails = useMemo(() => {
    if (!centerResult) return null;
    const { ax, ay, bx, by, cx, cy } = centerResult.coords;
    const pts = [
      { x: ax, y: -ay },
      { x: bx, y: -by },
      { x: cx, y: -cy },
      { x: centerResult.incenter.x, y: -centerResult.incenter.y },
      { x: centerResult.circumcenter.x, y: -centerResult.circumcenter.y }
    ];
    // Add points for bounding of circles as well
    const in_r = centerResult.inradius;
    const out_R = centerResult.circumradius;
    const ix = centerResult.incenter.x;
    const iy = -centerResult.incenter.y;
    const ox = centerResult.circumcenter.x;
    const oy = -centerResult.circumcenter.y;

    pts.push({ x: ix - in_r, y: iy - in_r });
    pts.push({ x: ix + in_r, y: iy + in_r });
    pts.push({ x: ox - out_R, y: oy - out_R });
    pts.push({ x: ox + out_R, y: oy + out_R });

    const layout = renderSVGPoints(pts);
    return {
      coords: { ax, ay: -ay, bx, by: -by, cx, cy: -cy },
      incenter: { x: ix, y: iy },
      circumcenter: { x: ox, y: oy },
      viewBox: layout.viewBox
    };
  }, [centerResult]);

  const svgInteractDetails = useMemo(() => {
    if (!interResult) return null;
    const { ax, ay, bx, by, cx, cy, circleX, circleY, circleR } = interResult.coords;
    const pts = [
      { x: ax, y: -ay },
      { x: bx, y: -by },
      { x: cx, y: -cy },
      { x: circleX, y: -circleY },
      { x: circleX - circleR, y: -circleY - circleR },
      { x: circleX + circleR, y: -circleY + circleR }
    ];
    const layout = renderSVGPoints(pts);
    return {
      coords: { ax, ay: -ay, bx, by: -by, cx, cy: -cy },
      circle: { x: circleX, y: -circleY, r: circleR },
      viewBox: layout.viewBox
    };
  }, [interResult]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" id="geom-container">
      {/* Title Header */}
      <div className="mb-8 text-center" id="geom-header">
        <h1 className="text-3xl font-sans font-bold tracking-tight text-white mb-2" id="geom-title">
          Giải Toán Hình Học 2D &amp; Heron Đa Năng
        </h1>
        <p className="text-neutral-400 text-sm max-w-2xl mx-auto" id="geom-subtitle">
          Công cụ giải chính xác các bài toán tam giác (Heron, góc bù trừ sai số), 
          tìm tọa độ và vẽ Tâm nội tiếp / ngoại tiếp, khảo sát tương tác đường tròn &amp; tam giác, và tính diện tích hình quạt.
        </p>
      </div>

      {/* Tabs list adjacent correctly */}
      <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-neutral-900/80 rounded-xl mb-8 max-w-3xl mx-auto border border-neutral-800" id="geom-tabs">
        <button
          id="tab-tri"
          onClick={() => setActiveTab('triangle')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 ${
            activeTab === 'triangle'
              ? 'bg-teal-500 text-neutral-950 font-bold shadow-lg shadow-teal-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <TriangleIcon className="w-4 h-4" />
          Giải Tam Giác &amp; Heron
        </button>

        <button
          id="tab-centers"
          onClick={() => setActiveTab('points_centers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 ${
            activeTab === 'points_centers'
              ? 'bg-teal-500 text-neutral-950 font-bold shadow-lg shadow-teal-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          Tâm &amp; Bán Kính Nội/Ngoại Tiếp
        </button>

        <button
          id="tab-inter"
          onClick={() => setActiveTab('interaction')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 ${
            activeTab === 'interaction'
              ? 'bg-teal-500 text-neutral-950 font-bold shadow-lg shadow-teal-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Tương Tác Tròn &amp; Tam Giác
        </button>

        <button
          id="tab-sector"
          onClick={() => setActiveTab('other_shapes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 ${
            activeTab === 'other_shapes'
              ? 'bg-teal-500 text-neutral-950 font-bold shadow-lg shadow-teal-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <CircleIcon className="w-4 h-4" />
          Quạt Tròn
        </button>
      </div>

      {/* Main Container Workspace */}
      <AnimatePresence mode="wait">
        {/* --- TAB 1: TRIANGLE HERON SOLVER --- */}
        {activeTab === 'triangle' && (
          <motion.div
            key="tab-triangle-solver"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-8"
            id="tab-tri-panel"
          >
            {/* Input Form Column */}
            <div className="md:col-span-5 bg-neutral-900 border border-neutral-800 rounded-2xl p-6" id="tri-inputs-box">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <SlidersIcon className="w-4 h-4 text-teal-400" /> Nhập thông số tam giác
              </h2>

              <div className="flex gap-1.5 p-1 bg-neutral-950 rounded-lg mb-6 border border-neutral-800" id="tri-modes">
                {(['sss', 'sas', 'asa', 'coords'] as const).map(m => (
                  <button
                    key={m}
                    id={`tri-mode-${m}`}
                    onClick={() => { setTriMode(m); handleClear('triangle'); }}
                    className={`flex-1 py-1.5 text-[10px] font-bold tracking-wide uppercase transition-all rounded-md ${
                      triMode === m ? 'bg-neutral-800 text-teal-400 border border-neutral-700/50' : 'text-neutral-500 hover:text-white'
                    }`}
                  >
                    {m === 'sss' ? 'Cạnh-Cạnh' : m === 'sas' ? 'Cạnh-Góc' : m === 'asa' ? 'Góc-Cạnh' : 'Tọa Độ'}
                  </button>
                ))}
              </div>

              {/* Dynamic Inputs depending on mode */}
              <div className="space-y-4 mb-6" id="tri-fields">
                {triMode === 'sss' && (
                  <>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Cạnh a:</label>
                      <input
                        id="input-sss-a"
                        type="number"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                        value={triInput.sss_a}
                        onChange={e => setTriInput({ ...triInput, sss_a: e.target.value })}
                        placeholder="Ví dụ: 3"
                        step="any"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Cạnh b:</label>
                      <input
                        id="input-sss-b"
                        type="number"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                        value={triInput.sss_b}
                        onChange={e => setTriInput({ ...triInput, sss_b: e.target.value })}
                        placeholder="Ví dụ: 4"
                        step="any"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Cạnh c:</label>
                      <input
                        id="input-sss-c"
                        type="number"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                        value={triInput.sss_c}
                        onChange={e => setTriInput({ ...triInput, sss_c: e.target.value })}
                        placeholder="Ví dụ: 5"
                        step="any"
                      />
                    </div>
                  </>
                )}

                {triMode === 'sas' && (
                  <>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Cạnh kề a:</label>
                      <input
                        id="input-sas-a"
                        type="number"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                        value={triInput.sas_a}
                        onChange={e => setTriInput({ ...triInput, sas_a: e.target.value })}
                        placeholder="Ví dụ: 10"
                        step="any"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Cạnh kề b:</label>
                      <input
                        id="input-sas-b"
                        type="number"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                        value={triInput.sas_b}
                        onChange={e => setTriInput({ ...triInput, sas_b: e.target.value })}
                        placeholder="Ví dụ: 12"
                        step="any"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Góc xen giữa C (Độ °):</label>
                      <input
                        id="input-sas-C"
                        type="number"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                        value={triInput.sas_C}
                        onChange={e => setTriInput({ ...triInput, sas_C: e.target.value })}
                        placeholder="Ví dụ: 60"
                        step="any"
                      />
                    </div>
                  </>
                )}

                {triMode === 'asa' && (
                  <>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Góc A (Độ °):</label>
                      <input
                        id="input-asa-A"
                        type="number"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                        value={triInput.asa_A}
                        onChange={e => setTriInput({ ...triInput, asa_A: e.target.value })}
                        placeholder="Ví dụ: 45"
                        step="any"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Góc B (Độ °):</label>
                      <input
                        id="input-asa-B"
                        type="number"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                        value={triInput.asa_B}
                        onChange={e => setTriInput({ ...triInput, asa_B: e.target.value })}
                        placeholder="Ví dụ: 60"
                        step="any"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Cạnh kề c:</label>
                      <input
                        id="input-asa-c"
                        type="number"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                        value={triInput.asa_c}
                        onChange={e => setTriInput({ ...triInput, asa_c: e.target.value })}
                        placeholder="Ví dụ: 8"
                        step="any"
                      />
                    </div>
                  </>
                )}

                {triMode === 'coords' && (
                  <div className="space-y-3">
                    <p className="text-xs text-neutral-500 font-medium">Toạ độ các đỉnh đỉnh A, B, C:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-neutral-400">Đỉnh A - X:</label>
                        <input
                          id="coord-ax"
                          type="number"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                          value={triInput.coords_ax}
                          onChange={e => setTriInput({ ...triInput, coords_ax: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-400">Đỉnh A - Y:</label>
                        <input
                          id="coord-ay"
                          type="number"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                          value={triInput.coords_ay}
                          onChange={e => setTriInput({ ...triInput, coords_ay: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-neutral-400">Đỉnh B - X:</label>
                        <input
                          id="coord-bx"
                          type="number"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                          value={triInput.coords_bx}
                          onChange={e => setTriInput({ ...triInput, coords_bx: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-400">Đỉnh B - Y:</label>
                        <input
                          id="coord-by"
                          type="number"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                          value={triInput.coords_by}
                          onChange={e => setTriInput({ ...triInput, coords_by: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-neutral-400">Đỉnh C - X:</label>
                        <input
                          id="coord-cx"
                          type="number"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                          value={triInput.coords_cx}
                          onChange={e => setTriInput({ ...triInput, coords_cx: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-400">Đỉnh C - Y:</label>
                        <input
                          id="coord-cy"
                          type="number"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                          value={triInput.coords_cy}
                          onChange={e => setTriInput({ ...triInput, coords_cy: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {triError && (
                <div className="bg-red-950/50 border border-red-800 text-red-300 text-xs px-3.5 py-2.5 rounded-lg mb-4" id="tri-error">
                  {triError}
                </div>
              )}

              <div id="tri-actions" className="flex gap-2">
                <button
                  id="btn-solve-triangle"
                  onClick={solveTriangleTab1}
                  className="flex-1 bg-teal-500 hover:bg-teal-400 text-neutral-950 font-bold py-2.5 rounded-lg text-xs transition-all duration-300"
                >
                  Giải Tam Giác
                </button>
                <button
                  onClick={() => handleClear('triangle')}
                  className="bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 p-2.5 rounded-lg text-xs"
                  title="Xoá kết quả"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Results Column */}
            <div className="md:col-span-7 space-y-6" id="tri-results">
              {!triResult ? (
                <div className="h-full min-h-[350px] flex flex-col items-center justify-center bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center" id="tri-blank-view">
                  <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-3">
                    <HelpCircle className="w-6 h-6 text-neutral-500" />
                  </div>
                  <p className="text-neutral-400 text-sm font-medium">Chưa có kết quả tam giác</p>
                  <p className="text-neutral-500 text-xs mt-1 max-w-sm">
                    Vui lòng bấm nút <strong>Giải Tam Giác</strong> để hiển thị thông số, diện tích Heron và phân loại góc cực chi tiết.
                  </p>
                </div>
              ) : (
                <div className="space-y-6" id="tri-resolved-view">
                  {/* Stats Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl" id="tri-res-area">
                      <p className="text-xs text-neutral-500 font-medium mb-1">Diện tích (Heron):</p>
                      <p className="text-xl font-mono font-bold text-teal-400 tracking-tight">
                        {triResult.area.toLocaleString('vi-VN', { maximumFractionDigits: 14 })}
                      </p>
                    </div>
                    <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl" id="tri-res-perimeter">
                      <p className="text-xs text-neutral-500 font-medium mb-1">Chu vi (2p):</p>
                      <p className="text-xl font-mono font-bold text-neutral-200">
                        {triResult.perimeter.toLocaleString('vi-VN', { maximumFractionDigits: 6 })}
                      </p>
                    </div>
                    <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl col-span-2 sm:col-span-1" id="tri-res-class">
                      <p className="text-xs text-neutral-500 font-medium mb-1">Loại tam giác:</p>
                      <div className="flex flex-wrap gap-1">
                        {triResult.classification.map((cls: string, i: number) => (
                          <span key={i} className="bg-teal-950 text-teal-300 text-[10px] px-1.5 py-0.5 rounded font-bold border border-teal-800">
                            {cls}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5" id="tri-res-params">
                    <h3 className="text-sm font-bold text-white mb-3">Thông số chi tiết tam giác</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs font-mono">
                      <div className="flex justify-between py-1 border-b border-neutral-800">
                        <span className="text-neutral-500 font-sans">Cạnh a:</span>
                        <span className="font-bold text-neutral-300">{triResult.sideA.toLocaleString('vi-VN', { maximumFractionDigits: 10 })}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-800">
                        <span className="text-neutral-500 font-sans">Độ lớn góc A:</span>
                        <span className="font-bold text-teal-400">{triResult.angleA.toLocaleString('vi-VN', { maximumFractionDigits: 14 })}°</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-800">
                        <span className="text-neutral-500 font-sans">Cạnh b:</span>
                        <span className="font-bold text-neutral-300">{triResult.sideB.toLocaleString('vi-VN', { maximumFractionDigits: 10 })}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-800">
                        <span className="text-neutral-500 font-sans">Độ lớn góc B:</span>
                        <span className="font-bold text-teal-400">{triResult.angleB.toLocaleString('vi-VN', { maximumFractionDigits: 14 })}°</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-800">
                        <span className="text-neutral-500 font-sans">Cạnh c:</span>
                        <span className="font-bold text-neutral-300">{triResult.sideC.toLocaleString('vi-VN', { maximumFractionDigits: 10 })}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-800">
                        <span className="text-neutral-500 font-sans">Độ lớn góc C:</span>
                        <span className="font-bold text-teal-400">{triResult.angleC.toNumber ? triResult.angleC.toNumber().toLocaleString('vi-VN', { maximumFractionDigits: 14 }) : triResult.angleC.toLocaleString('vi-VN', { maximumFractionDigits: 14 })}°</span>
                      </div>
                      
                      {/* Heights */}
                      <div className="flex justify-between py-1 border-b border-neutral-800">
                        <span className="text-neutral-400 font-sans">Đường cao h_a:</span>
                        <span className="font-bold text-neutral-300">{triResult.h_a.toLocaleString('vi-VN', { maximumFractionDigits: 6 })}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-800">
                        <span className="text-neutral-400 font-sans">Đường cao h_b:</span>
                        <span className="font-bold text-neutral-300">{triResult.h_b.toLocaleString('vi-VN', { maximumFractionDigits: 6 })}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-neutral-800 sm:col-span-2">
                        <span className="text-neutral-400 font-sans">Đường cao h_c:</span>
                        <span className="font-bold text-neutral-300">{triResult.h_c.toLocaleString('vi-VN', { maximumFractionDigits: 6 })}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-start gap-1 py-1 px-2 border border-neutral-800 rounded bg-neutral-950 text-[10px] text-neutral-400 leading-relaxed font-sans" id="tri-rounding-label">
                      <Hash className="w-3.5 h-3.5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span>Các góc được làm tròn về số nguyên nếu phần thập phân có hơn 17 chữ số toàn 9 hoặc 0 kề nhau. Sai số bù trừ cho góc còn lại sao cho tổng luôn đúng bằng 180°.</span>
                    </div>
                  </div>

                  {/* SVG Graphics Visualizer */}
                  {svgTriangleDetails && (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col items-center" id="tri-res-visual">
                      <p className="text-xs text-neutral-400 mb-3 font-semibold self-start flex items-center gap-2">
                        <Grid className="w-3.5 h-3.5 text-teal-400" /> Trực quan hóa hình học Tam giác giải được
                      </p>
                      <div className="w-full max-w-[320px] aspect-square bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden flex items-center justify-center p-4">
                        <svg viewBox={svgTriangleDetails.viewBox} className="w-full h-full">
                          <polygon
                            points={`${svgTriangleDetails.pts[0].x},${svgTriangleDetails.pts[0].y} ${svgTriangleDetails.pts[1].x},${svgTriangleDetails.pts[1].y} ${svgTriangleDetails.pts[2].x},${svgTriangleDetails.pts[2].y}`}
                            className="stroke-teal-400 stroke-[2] fill-teal-500/10"
                            strokeLinejoin="round"
                          />
                          {/* Label vertices */}
                          <text x={svgTriangleDetails.pts[0].x} y={svgTriangleDetails.pts[0].y + (svgTriangleDetails.pts[0].y > svgTriangleDetails.pts[2].y ? 15 : -10)} className="fill-white font-mono text-[12px] text-anchor-middle font-bold">A</text>
                          <text x={svgTriangleDetails.pts[1].x} y={svgTriangleDetails.pts[1].y + (svgTriangleDetails.pts[1].y > svgTriangleDetails.pts[2].y ? 15 : -10)} className="fill-white font-mono text-[12px] text-anchor-middle font-bold">B</text>
                          <text x={svgTriangleDetails.pts[2].x} y={svgTriangleDetails.pts[2].y + -10} className="fill-white font-mono text-[12px] text-anchor-middle font-bold">C</text>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* --- TAB 2: POINTS, INCENTER, CIRCUMCENTER (NEW MODULE PLACED CORRECTLY ADJACENT) --- */}
        {activeTab === 'points_centers' && (
          <motion.div
            key="tab-centers-solver"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-8"
            id="tab-centers-panel"
          >
            {/* Form Column */}
            <div className="md:col-span-5 bg-neutral-900 border border-neutral-800 rounded-2xl p-6" id="center-inputs-box">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Compass className="w-4 h-4 text-teal-400" /> Tâm &amp; Bán Kính Nội / Ngoại Tiếp
              </h2>

              <div className="flex gap-1.5 p-1 bg-neutral-950 rounded-lg mb-6 border border-neutral-800" id="center-modes">
                <button
                  id="btn-center-mode-coords"
                  onClick={() => { setCenterMode('coords'); handleClear('points_centers'); }}
                  className={`flex-1 py-1.5 text-[10px] font-bold tracking-wide uppercase transition-all rounded-md ${
                    centerMode === 'coords' ? 'bg-neutral-800 text-teal-400 border border-neutral-700/50' : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  Dùng Tọa độ đỉnh (Cartesian)
                </button>
                <button
                  id="btn-center-mode-sss"
                  onClick={() => { setCenterMode('sss'); handleClear('points_centers'); }}
                  className={`flex-1 py-1.5 text-[10px] font-bold tracking-wide uppercase transition-all rounded-md ${
                    centerMode === 'sss' ? 'bg-neutral-800 text-teal-400 border border-neutral-700/50' : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  Dùng Chiều dài cạnh SSS
                </button>
              </div>

              {/* Fields */}
              <div className="space-y-4 mb-6" id="center-fields">
                {centerMode === 'coords' ? (
                  <div className="space-y-3">
                    <p className="text-xs text-neutral-500 font-medium">Toạ độ đỉnh A, B, C của tam giác:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-neutral-400">Đỉnh A - X:</label>
                        <input
                          id="center-coords-ax"
                          type="number"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          value={centerInput.coords_ax}
                          onChange={e => setCenterInput({ ...centerInput, coords_ax: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-400">Đỉnh A - Y:</label>
                        <input
                          id="center-coords-ay"
                          type="number"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          value={centerInput.coords_ay}
                          onChange={e => setCenterInput({ ...centerInput, coords_ay: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-neutral-400">Đỉnh B - X:</label>
                        <input
                          id="center-coords-bx"
                          type="number"
                          className="w-full bg-neutral-950 border border-neutral-100/5 border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          value={centerInput.coords_bx}
                          onChange={e => setCenterInput({ ...centerInput, coords_bx: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-400">Đỉnh B - Y:</label>
                        <input
                          id="center-coords-by"
                          type="number"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          value={centerInput.coords_by}
                          onChange={e => setCenterInput({ ...centerInput, coords_by: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-neutral-400">Đỉnh C - X:</label>
                        <input
                          id="center-coords-cx"
                          type="number"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          value={centerInput.coords_cx}
                          onChange={e => setCenterInput({ ...centerInput, coords_cx: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-400">Đỉnh C - Y:</label>
                        <input
                          id="center-coords-cy"
                          type="number"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          value={centerInput.coords_cy}
                          onChange={e => setCenterInput({ ...centerInput, coords_cy: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Cạnh a:</label>
                      <input
                        id="center-sss-a"
                        type="number"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                        value={centerInput.sss_a}
                        onChange={e => setCenterInput({ ...centerInput, sss_a: e.target.value })}
                        placeholder="Ví dụ: 6"
                        step="any"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Cạnh b:</label>
                      <input
                        id="center-sss-b"
                        type="number"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                        value={centerInput.sss_b}
                        onChange={e => setCenterInput({ ...centerInput, sss_b: e.target.value })}
                        placeholder="Ví dụ: 8"
                        step="any"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Cạnh c:</label>
                      <input
                        id="center-sss-c"
                        type="number"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                        value={centerInput.sss_c}
                        onChange={e => setCenterInput({ ...centerInput, sss_c: e.target.value })}
                        placeholder="Ví dụ: 10"
                        step="any"
                      />
                    </div>
                  </>
                )}
              </div>

              {centerError && (
                <div className="bg-red-950/50 border border-red-800 text-red-300 text-xs px-3.5 py-2.5 rounded-lg mb-4" id="center-error">
                  {centerError}
                </div>
              )}

              <div id="center-actions" className="flex gap-2">
                <button
                  id="btn-solve-centers"
                  onClick={solveCenters}
                  className="flex-1 bg-teal-500 hover:bg-teal-400 text-neutral-950 font-bold py-2.5 rounded-lg text-xs transition-all duration-300"
                >
                  Tính Toán Tâm Tròn
                </button>
                <button
                  onClick={() => handleClear('points_centers')}
                  className="bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 p-2.5 rounded-lg text-xs"
                  title="Xoá kết quả"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Results Column */}
            <div className="md:col-span-7 space-y-6" id="center-results">
              {!centerResult ? (
                <div className="h-full min-h-[350px] flex flex-col items-center justify-center bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center" id="center-blank-view">
                  <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-3">
                    <Compass className="w-6 h-6 text-neutral-500" />
                  </div>
                  <p className="text-neutral-400 text-sm font-medium">Chưa có kết quả phân tích tâm</p>
                  <p className="text-neutral-500 text-xs mt-1 max-w-sm">
                    Nhập tham số tọa độ hoặc chiều dài 3 cạnh, sau đó nhấn <strong>Tính Toán Tâm Tròn</strong> để tìm tâm nội tiếp + tâm ngoại tiếp cực kỳ trực quan.
                  </p>
                </div>
              ) : (
                <div className="space-y-6" id="center-resolved-view">
                  {/* Results Data Box */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5" id="center-details-data">
                    <h3 className="text-sm font-bold text-white mb-4 border-b border-neutral-800 pb-2">
                      Tọa độ Tâm &amp; Kích thước Bán kính
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 font-mono text-xs">
                      {/* Incircle block */}
                      <div className="space-y-2 p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                        <div className="flex items-center gap-1.5 font-sans font-bold text-teal-400 text-xs mb-1">
                          <CircleIcon className="w-3.5 h-3.5 fill-teal-400/20" /> Đường tròn NỘI TIẾP (Incircle)
                        </div>
                        <div className="flex justify-between py-1 border-b border-neutral-900">
                          <span className="text-neutral-500 font-sans">Tâm I (x, y):</span>
                          <span className="font-bold text-neutral-200">
                            ({centerResult.incenter.x.toFixed(4)}, {centerResult.incenter.y.toFixed(4)})
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-neutral-500 font-sans">Bán kính r:</span>
                          <span className="font-bold text-teal-400">{centerResult.inradius.toFixed(6)}</span>
                        </div>
                      </div>

                      {/* Circumcircle block */}
                      <div className="space-y-2 p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                        <div className="flex items-center gap-1.5 font-sans font-bold text-teal-400 text-xs mb-1">
                          <CircleIcon className="w-3.5 h-3.5 fill-teal-400/10" /> Đường tròn NGOẠI TIẾP (Circumcircle)
                        </div>
                        <div className="flex justify-between py-1 border-b border-neutral-900">
                          <span className="text-neutral-500 font-sans">Tâm O (x, y):</span>
                          <span className="font-bold text-neutral-200">
                            ({centerResult.circumcenter.x.toFixed(4)}, {centerResult.circumcenter.y.toFixed(4)})
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-neutral-500 font-sans">Bán kính R:</span>
                          <span className="font-bold text-teal-400">{centerResult.circumradius.toFixed(6)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SVG Graphics Visualizer */}
                  {svgCentersDetails && (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col items-center" id="center-svg-card">
                      <p className="text-xs text-neutral-400 mb-3 font-semibold self-start flex items-center gap-2">
                        <Grid className="w-3.5 h-3.5 text-teal-400" /> Trực quan đường tròn Nội/Ngoại tiếp và Tâm tương ứng
                      </p>
                      
                      <div className="w-full max-w-[340px] aspect-square bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden flex items-center justify-center p-4">
                        <svg viewBox={svgCentersDetails.viewBox} className="w-full h-full">
                          {/* Triangle vertices */}
                          <polygon
                            points={`${svgCentersDetails.coords.ax},${svgCentersDetails.coords.ay} ${svgCentersDetails.coords.bx},${svgCentersDetails.coords.by} ${svgCentersDetails.coords.cx},${svgCentersDetails.coords.cy}`}
                            className="stroke-neutral-400 stroke-[1.5] fill-neutral-800/10"
                            strokeLinejoin="round"
                          />

                          {/* Incircle circle */}
                          <circle
                            cx={svgCentersDetails.incenter.x}
                            cy={svgCentersDetails.incenter.y}
                            r={centerResult.inradius}
                            className="stroke-teal-500 stroke-[1.5] fill-none"
                            strokeDasharray="4 4"
                          />
                          {/* Incenter dot */}
                          <circle cx={svgCentersDetails.incenter.x} cy={svgCentersDetails.incenter.y} r="3" className="fill-teal-400" />
                          <text x={svgCentersDetails.incenter.x + 5} y={svgCentersDetails.incenter.y + 12} className="fill-teal-300 font-mono text-[10px] font-bold">I (Nội tiếp)</text>

                          {/* Circumcircle circle */}
                          <circle
                            cx={svgCentersDetails.circumcenter.x}
                            cy={svgCentersDetails.circumcenter.y}
                            r={centerResult.circumradius}
                            className="stroke-amber-500 stroke-[1.5] fill-none"
                            strokeDasharray="3 3"
                          />
                          {/* Circumcenter dot */}
                          <circle cx={svgCentersDetails.circumcenter.x} cy={svgCentersDetails.circumcenter.y} r="3" className="fill-amber-400" />
                          <text x={svgCentersDetails.circumcenter.x + 5} y={svgCentersDetails.circumcenter.y - 5} className="fill-amber-300 font-mono text-[10px] font-bold">O (Ngoại tiếp)</text>

                          {/* Vertices label */}
                          <text x={svgCentersDetails.coords.ax} y={svgCentersDetails.coords.ay + (svgCentersDetails.coords.ay > svgCentersDetails.coords.cy ? 12 : -8)} className="fill-white font-mono text-[10px] text-anchor-middle font-bold">A</text>
                          <text x={svgCentersDetails.coords.bx} y={svgCentersDetails.coords.by + (svgCentersDetails.coords.by > svgCentersDetails.coords.cy ? 12 : -8)} className="fill-white font-mono text-[10px] text-anchor-middle font-bold">B</text>
                          <text x={svgCentersDetails.coords.cx} y={svgCentersDetails.coords.cy - 8} className="fill-white font-mono text-[10px] text-anchor-middle font-bold">C</text>
                        </svg>
                      </div>

                      <div className="flex gap-4 mt-3 text-[10px] block w-full justify-center">
                        <span className="flex items-center gap-1 text-teal-400"><span className="w-2 h-2 rounded-full bg-teal-500"></span> Tâm Nội tiếp I</span>
                        <span className="flex items-center gap-1 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Tâm Ngoại tiếp O</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* --- TAB 3: INTERACTION CIRCLE & TRIANGLE --- */}
        {activeTab === 'interaction' && (
          <motion.div
            key="tab-interaction"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-8"
            id="tab-inter-panel"
          >
            {/* Form Column */}
            <div className="md:col-span-5 bg-neutral-900 border border-neutral-800 rounded-2xl p-6" id="inter-inputs-box">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-400" /> Vị Trí Tương Đối Tròn &amp; Tam Giác
              </h2>

              <p className="text-xs text-neutral-400 mb-4 bg-neutral-950 p-2.5 rounded border border-neutral-800 leading-relaxed font-sans">
                Khảo sát chồng lấn &amp; quan hệ không gian giữa Đường tròn và Tam giác trong cùng một hệ tọa độ Descartes.
              </p>

              <div className="space-y-4 mb-6" id="inter-fields">
                <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/60 space-y-3">
                  <p className="text-xs text-teal-400 font-bold flex items-center gap-1">🔺 Tam giác (3 Đỉnh T, U, V)</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-neutral-400">Đỉnh T (x, y):</label>
                      <div className="flex gap-1">
                        <input type="number" className="w-1/2 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white" value={interInput.tx} onChange={e => setInterInput({...interInput, tx: e.target.value})} />
                        <input type="number" className="w-1/2 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white" value={interInput.ty} onChange={e => setInterInput({...interInput, ty: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400">Đỉnh U (x, y):</label>
                      <div className="flex gap-1">
                        <input type="number" className="w-1/2 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white" value={interInput.ux} onChange={e => setInterInput({...interInput, ux: e.target.value})} />
                        <input type="number" className="w-1/2 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white" value={interInput.uy} onChange={e => setInterInput({...interInput, uy: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-neutral-400">Đỉnh V (x, y):</label>
                    <div className="flex gap-1 w-1/2">
                      <input type="number" className="w-1/2 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white" value={interInput.vx} onChange={e => setInterInput({...interInput, vx: e.target.value})} />
                      <input type="number" className="w-1/2 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white" value={interInput.vy} onChange={e => setInterInput({...interInput, vy: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800/60 space-y-3">
                  <p className="text-xs text-teal-400 font-bold flex items-center gap-1">🟡 Đường tròn (Tâm C &amp; Bán kính cr)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-neutral-400">Tâm C - X:</label>
                      <input type="number" className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white" value={interInput.cx} onChange={e => setInterInput({...interInput, cx: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400">Tâm C - Y:</label>
                      <input type="number" className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white" value={interInput.cy} onChange={e => setInterInput({...interInput, cy: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400">Bán kính cr:</label>
                    <input type="number" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1" value={interInput.cr} onChange={e => setInterInput({...interInput, cr: e.target.value})} />
                  </div>
                </div>
              </div>

              <div id="inter-actions" className="flex gap-2">
                <button
                  id="btn-solve-inter"
                  onClick={solveInteraction}
                  className="flex-1 bg-teal-500 hover:bg-teal-400 text-neutral-950 font-bold py-2.5 rounded-lg text-xs transition-all duration-300"
                >
                  Xác Định Vị Trí
                </button>
                <button
                  onClick={() => handleClear('interaction')}
                  className="bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 p-2.5 rounded-lg text-xs"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Results Column */}
            <div className="md:col-span-7 space-y-6" id="inter-results">
              {!interResult ? (
                <div className="h-full min-h-[350px] flex flex-col items-center justify-center bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center" id="inter-blank-view">
                  <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-3">
                    <Layers className="w-6 h-6 text-neutral-500" />
                  </div>
                  <p className="text-neutral-400 text-sm font-medium">Chưa có kết quả tương quan</p>
                  <p className="text-neutral-500 text-xs mt-1 max-w-sm">
                    Thiết lập tọa độ tam giác cùng tâm/bán kính tròn, sau đó bấm <strong>Xác Định Vị Trí</strong> để kiểm tra quan hệ tương tác trực tiếp.
                  </p>
                </div>
              ) : (
                <div className="space-y-6" id="inter-resolved-view">
                  {/* Text Details */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5" id="inter-details-data">
                    <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider mb-1">Kết quả phân tích</p>
                    <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                      <LineChart className="w-4 h-4 text-teal-400" /> {interResult.positionType}
                    </h3>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="bg-neutral-950 px-3 py-2.5 border border-neutral-800 rounded-lg">
                        <span className="text-neutral-500">Khoảng cách tới cạnh TU:</span>
                        <span className="block font-bold text-neutral-200 mt-1">{interResult.distToAB.toFixed(4)}</span>
                      </div>
                      <div className="bg-neutral-950 px-3 py-2.5 border border-neutral-800 rounded-lg">
                        <span className="text-neutral-500">Khoảng cách tới cạnh UV:</span>
                        <span className="block font-bold text-neutral-200 mt-1">{interResult.distToBC.toFixed(4)}</span>
                      </div>
                      <div className="bg-neutral-950 px-3 py-2.5 border border-neutral-800 rounded-lg">
                        <span className="text-neutral-500">Khoảng cách tới cạnh VT:</span>
                        <span className="block font-bold text-neutral-200 mt-1">{interResult.distToCA.toFixed(4)}</span>
                      </div>
                      <div className="bg-neutral-950 px-3 py-2.5 border border-neutral-800 rounded-lg">
                        <span className="text-neutral-500">Khoảng cách biên cực tiểu:</span>
                        <span className="block font-bold text-teal-400 mt-1">{interResult.minDistToBoundary.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Graphics Visualizer */}
                  {svgInteractDetails && (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col items-center" id="inter-svg-card">
                      <p className="text-xs text-neutral-400 mb-3 font-semibold self-start flex items-center gap-2">
                        <Grid className="w-3.5 h-3.5 text-teal-400" /> Trực quan hệ tọa độ Descartes cho tương quan (Tròn &amp; Tam giác)
                      </p>
                      
                      <div className="w-full max-w-[340px] aspect-square bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden flex items-center justify-center p-4">
                        <svg viewBox={svgInteractDetails.viewBox} className="w-full h-full">
                          {/* Triangle vertices */}
                          <polygon
                            points={`${svgInteractDetails.coords.ax},${svgInteractDetails.coords.ay} ${svgInteractDetails.coords.bx},${svgInteractDetails.coords.by} ${svgInteractDetails.coords.cx},${svgInteractDetails.coords.cy}`}
                            className="stroke-neutral-300 stroke-[1.5] fill-neutral-800/15"
                            strokeLinejoin="round"
                          />

                          {/* Normal interaction circle */}
                          <circle
                            cx={svgInteractDetails.circle.x}
                            cy={svgInteractDetails.circle.y}
                            r={svgInteractDetails.circle.r}
                            className="stroke-teal-400 stroke-[2] fill-teal-500/10"
                          />

                          {/* Center circle */}
                          <circle cx={svgInteractDetails.circle.x} cy={svgInteractDetails.circle.y} r="3" className="fill-white" />
                          <text x={svgInteractDetails.circle.x + 5} y={svgInteractDetails.circle.y + 4} className="fill-neutral-300 font-mono text-[9px] font-bold">C</text>

                          {/* Vertices label */}
                          <text x={svgInteractDetails.coords.ax} y={svgInteractDetails.coords.ay + (svgInteractDetails.coords.ay > svgInteractDetails.coords.cy ? 12 : -8)} className="fill-teal-300 font-mono text-[9px] font-bold">T</text>
                          <text x={svgInteractDetails.coords.bx} y={svgInteractDetails.coords.by + (svgInteractDetails.coords.by > svgInteractDetails.coords.cy ? 12 : -8)} className="fill-teal-300 font-mono text-[9px] font-bold">U</text>
                          <text x={svgInteractDetails.coords.cx} y={svgInteractDetails.coords.cy - 8} className="fill-teal-300 font-mono text-[9px] font-bold">V</text>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* --- TAB 4: CIRCLE SECTOR (OTHER SHAPES) --- */}
        {activeTab === 'other_shapes' && (
          <motion.div
            key="tab-other-shapes"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-8"
            id="tab-sector-panel"
          >
            {/* Form Column */}
            <div className="md:col-span-5 bg-neutral-900 border border-neutral-800 rounded-2xl p-6" id="sector-inputs-box">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <CircleIcon className="w-4 h-4 text-teal-400" /> Diện Tích Hình Quạt Tròn
              </h2>

              <p className="text-xs text-neutral-400 mb-4 bg-neutral-950 p-2.5 rounded border border-neutral-800 leading-relaxed font-sans">
                Hình quạt tròn là phần của hình tròn giới hạn bởi hai bán kính và một cung tròn. Nhập bán kính R và số đo góc ở tâm α.
              </p>

              <div className="space-y-4 mb-6" id="sector-fields">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Bán kính R:</label>
                  <input
                    id="input-sector-r"
                    type="number"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                    value={sectorR}
                    onChange={e => setSectorR(e.target.value)}
                    placeholder="Ví dụ: 5"
                    step="any"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Góc ở tâm α (Độ °):</label>
                  <input
                    id="input-sector-alpha"
                    type="number"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                    value={sectorAlpha}
                    onChange={e => setSectorAlpha(e.target.value)}
                    placeholder="Ví dụ: 90"
                    step="any"
                  />
                </div>
              </div>

              <div id="sector-actions" className="flex gap-2">
                <button
                  id="btn-solve-sector"
                  onClick={solveSector}
                  className="flex-1 bg-teal-500 hover:bg-teal-400 text-neutral-950 font-bold py-2.5 rounded-lg text-xs transition-all duration-300"
                >
                  Tính Toán Quạt Tròn
                </button>
                <button
                  onClick={() => handleClear('other_shapes')}
                  className="bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 p-2.5 rounded-lg text-xs"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Results Column */}
            <div className="md:col-span-7 space-y-6" id="sector-results">
              {!sectorResult ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center" id="sector-blank-view">
                  <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mb-3">
                    <CircleIcon className="w-6 h-6 text-neutral-500" />
                  </div>
                  <p className="text-neutral-400 text-sm font-medium">Chưa có kết quả hình quạt</p>
                  <p className="text-neutral-500 text-xs mt-1 max-w-sm">
                    Nhập thông số và nhấn <strong>Tính Toán Quạt Tròn</strong> để tính diện tích cung quạt, chiều dài cung và chu vi tổng quát.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in" id="sector-resolved-view">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl" id="sector-res-area">
                      <p className="text-xs text-neutral-500 font-medium mb-1">Diện tích hình quạt S:</p>
                      <p className="text-2xl font-mono font-bold text-teal-400 tracking-tight">
                        {sectorResult.area.toLocaleString('vi-VN', { maximumFractionDigits: 10 })}
                      </p>
                    </div>
                    <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl" id="sector-res-arclen">
                      <p className="text-xs text-neutral-500 font-medium mb-1">Chiều dài cung l:</p>
                      <p className="text-2xl font-mono font-bold text-neutral-200">
                        {sectorResult.arcLength.toLocaleString('vi-VN', { maximumFractionDigits: 10 })}
                      </p>
                    </div>
                  </div>

                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5" id="sector-details-data">
                    <h3 className="text-sm font-bold text-white mb-3">Thông số liên kết</h3>
                    <div className="grid grid-cols-1 gap-y-2 text-xs font-mono">
                      <div className="flex justify-between py-1.5 border-b border-neutral-800">
                        <span className="text-neutral-500 font-sans">Bán kính R:</span>
                        <span className="font-bold text-neutral-300">{sectorResult.radius}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-neutral-800">
                        <span className="text-neutral-500 font-sans">Góc ở tâm α:</span>
                        <span className="font-bold text-neutral-300">{sectorResult.alpha}°</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-neutral-500 font-sans">Tổng chu vi hình quạt (l + 2R):</span>
                        <span className="font-bold text-teal-400">{sectorResult.perimeter.toLocaleString('vi-VN', { maximumFractionDigits: 10 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Sector Visualization */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col items-center" id="sector-svg-card">
                    <p className="text-xs text-neutral-400 mb-3 font-semibold self-start flex items-center gap-2">
                      <Grid className="w-3.5 h-3.5 text-teal-400" /> Bản vẽ trực quan hóa hình quạt tròn
                    </p>
                    
                    <div className="w-full max-w-[280px] aspect-square bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden flex items-center justify-center p-4">
                      {(() => {
                        const alphaRad = (sectorResult.alpha * Math.PI) / 180;
                        const r = 50; // visual radius
                        const cx = 50;
                        const cy = 50;
                        // Start point: cx + r, cy (0 rad)
                        // End point
                        const x2 = cx + r * Math.cos(alphaRad);
                        const y2 = cy - r * Math.sin(alphaRad); // invert y for SVG coordinate
                        const largeArc = sectorResult.alpha > 180 ? 1 : 0;
                        const dStr = `M ${cx} ${cy} L ${cx + r} ${cy} A ${r} ${r} 0 ${largeArc} 0 ${x2} ${y2} Z`;

                        return (
                          <svg viewBox="0 0 100 100" className="w-3/4 h-3/4">
                            <path
                              d={dStr}
                              className="stroke-teal-400 stroke-[1.5] fill-teal-500/10"
                            />
                            {/* Arc label */}
                            <text x={cx + 5} y={cy - 5} className="fill-white font-mono text-[9px] font-bold">R</text>
                            <text x={cx + r/2} y={cy + 10} className="fill-teal-300 font-mono text-[9px] font-bold">α = {sectorResult.alpha}°</text>
                          </svg>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple custom inline icons to replace missing lucide-react ones
function SlidersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="4" x1-axis="" y1="21" y2="14" />
      <line x1="4" y1="10" y2="3" />
      <line x1="12" y1="21" y2="12" />
      <line x1="12" y1="8" y2="3" />
      <line x1="20" y1="21" y2="16" />
      <line x1="20" y1="12" y2="3" />
      <line x1="2" y1="14" x2="6" y2="14" />
      <line x1="10" y1="8" x2="14" y2="8" />
      <line x1="18" y1="16" x2="22" y2="16" />
    </svg>
  );
}
