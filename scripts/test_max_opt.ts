import { complex, abs, subtract, add, multiply } from 'mathjs';

// Objective: Max |5*z1-z2-4-3i|
// Constraints:
// 1) |z1 - 3*z2 - 4i| = sqrt(11)
// 2) |z1| + sqrt(5)*|z2| = |z1 + 4*z2 - i - 6|

function solve() {
  let max_val = -Infinity;
  let best_z1 = null;
  let best_z2 = null;

  // Since z1, z2 have 4 dimensions, it's hard to grid search blindly.
  // Assume phase lock: z1 = t*(4*z2 - 6 - i), t >= 0
  // Then |z1 + 4z2 - 6 - i| = (t+1)|4z2 - 6 - i|.
  // And LHS = t|4z2 - 6 - i| + sqrt(5)|z2|.
  // So t|4z2-6-i| + sqrt(5)|z2| = (t+1)|4z2-6-i|
  // => sqrt(5)|z2| = |4z2-6-i|
  // This means z2 is on the circle Gamma: |4z2 - 6 - i| = sqrt(5)|z2|.
  
  // So z2 = center + radius * e^(i*theta)
  const center = complex(24/11, 4/11);
  const radius = Math.sqrt(185)/11;
  const num_theta = 20000;
  
  for (let i = 0; i < num_theta; i++) {
    const theta = (i / num_theta) * 2 * Math.PI;
    const offset = multiply(radius, complex(Math.cos(theta), Math.sin(theta))) as any;
    const z2 = add(center, offset);
    
    // Now find t >= 0 such that |z1 - 3z2 - 4i| = sqrt(11)
    // z1 = t*(4z2 - 6 - i)
    // Let B = 4z2 - 6 - i
    const B = add(multiply(4, z2), complex(-6, -1));
    
    // We want |t*B - 3z2 - 4i| = sqrt(11)
    // Let C = -3z2 - 4i
    const C = add(multiply(-3, z2), complex(0, -4));
    
    // |t*B + C|^2 = 11
    // t^2|B|^2 + 2t Re(B * conj(C)) + |C|^2 - 11 = 0
    // This is a quadratic in t.
    const B_abs_sq = Math.pow(abs(B) as number, 2);
    const C_abs_sq = Math.pow(abs(C) as number, 2);
    
    const re_B = (B as any).re;
    const im_B = (B as any).im;
    const re_C = (C as any).re;
    const im_C = (C as any).im;
    const Re_B_conj_C = re_B * re_C + im_B * im_C;
    
    const a = B_abs_sq;
    const b = 2 * Re_B_conj_C;
    const c = C_abs_sq - 11;
    
    const delta = b*b - 4*a*c;
    if (delta >= 0) {
      const t1 = (-b + Math.sqrt(delta)) / (2*a);
      const t2 = (-b - Math.sqrt(delta)) / (2*a);
      
      const ts = [];
      if (t1 >= 0) ts.push(t1);
      if (t2 >= 0) ts.push(t2);
      
      for (const t of ts) {
        const z1 = multiply(t, B);
        // calculate obj: |5z1 - z2 - 4 - 3i|
        const obj_z = add(multiply(5, z1), multiply(-1, z2));
        const obj_val = abs(add(obj_z, complex(-4, -3))) as number;
        if (obj_val > max_val) {
          max_val = obj_val;
          best_z1 = z1;
          best_z2 = z2;
        }
      }
    }
  }
  
  console.log("Numerical max:", max_val);
  console.log("z1:", best_z1 ? best_z1.toString() : null);
  console.log("z2:", best_z2 ? best_z2.toString() : null);
}

solve();
