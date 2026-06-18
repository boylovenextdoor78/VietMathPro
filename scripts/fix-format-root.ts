import * as fs from 'fs';

let content = fs.readFileSync('src/lib/mathUtils.ts', 'utf-8');

const oldFormatRoot = `export function formatRoot(val: number | Decimal): string {
  const numVal = typeof val === 'number' ? val : val.toNumber();
  const identified = identifyCanonical(numVal);
  if (identified) return identified;
  
  if (typeof val !== 'number') {
    return val.toFixed(7).replace(/\\.?0+$/, "");
  }
  
  return val.toFixed(7).replace(/\\.?0+$/, "");
}`;

const newFormatRoot = `export function formatRoot(val: number | Decimal): string {
  const numVal = typeof val === 'number' ? val : val.toNumber();
  const identified = identifyCanonical(numVal);
  if (identified) return identified;
  
  let str = typeof val === 'number' ? val.toFixed(7) : val.toFixed(7);
  if (str.includes('.')) {
    str = str.replace(/0+$/, '').replace(/\\.$/, '');
  }
  return str;
}`;

content = content.replace(oldFormatRoot, newFormatRoot);

fs.writeFileSync('src/lib/mathUtils.ts', content);
