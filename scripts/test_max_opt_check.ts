import { complex, abs, subtract, add, multiply } from 'mathjs';

function solve() {
  const num_theta = 50000;
  const center = complex(24/11, 4/11);
  const radius = Math.sqrt(185)/11;
  let max_val = -Infinity;

  for (let i = 0; i < num_theta; i++) {
    const theta = (i / num_theta) * 2 * Math.PI;
    const offset = multiply(radius, complex(Math.cos(theta), Math.sin(theta))) as any;
    const z2 = add(center, offset);
    
    const B = add(multiply(4, z2), complex(-6, -1));
    const C = add(multiply(-3, z2), complex(0, -4));
    
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
        const obj_z = add(multiply(5, z1), multiply(-1, z2));
        const obj_val = abs(add(obj_z, complex(-4, -3))) as number;
        if (obj_val > max_val) {
          max_val = obj_val;
        }
      }
    }
  }
  return max_val;
}

console.log("Numerical max:", solve());
console.log("sqrt(11)+5 = ", Math.sqrt(11) + 5);
