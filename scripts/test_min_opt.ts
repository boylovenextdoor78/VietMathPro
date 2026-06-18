import { complex, abs, subtract, add, multiply } from 'mathjs';

function solveMin() {
  const num_theta = 50000;
  const center = complex(24/11, 4/11);
  const radius = Math.sqrt(185)/11;
  let min_val = Infinity;

  for (let i = 0; i < num_theta; i++) {
    const theta = (i / num_theta) * 2 * Math.PI;
    const offset = multiply(radius, complex(Math.cos(theta), Math.sin(theta))) as any;
    const z2 = add(center, offset);
    
    const B = add(multiply(4, z2), complex(-6, -1));
    const C = add(multiply(-3, z2), complex(0, -4));
    
    const a = Math.pow(abs(B) as number, 2);
    const b = 2 * ((B as any).re * (C as any).re + (B as any).im * (C as any).im);
    const c = Math.pow(abs(C) as number, 2) - 11;
    
    const delta = b*b - 4*a*c;
    if (delta >= 0) {
      const ts = [];
      const t1 = (-b + Math.sqrt(delta)) / (2*a);
      if (t1 >= 0) ts.push(t1);
      const t2 = (-b - Math.sqrt(delta)) / (2*a);
      if (t2 >= 0) ts.push(t2);
      
      for (const t of ts) {
        const z1 = multiply(t, B);
        const obj_z = add(multiply(5, z1), multiply(-1, z2));
        const obj_val = abs(add(obj_z, complex(-4, -3))) as number;
        if (obj_val < min_val) {
          min_val = obj_val;
        }
      }
    }
  }
  
  console.log("Numerical min:", min_val);
}
solveMin();
