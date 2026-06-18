import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// We will replace assignments in the solvePolynomialBig and other regression functions
// Let's just do a global replace for the specific lines that are failing.

content = content.replace(/let sumX = bigMath\.bignumber\(0\);\n          let sumY = bigMath\.bignumber\(0\);\n          let sumXY = bigMath\.bignumber\(0\);\n          let sumX2 = bigMath\.bignumber\(0\);/g, 
  `let sumX: any = bigMath.bignumber(0);\n          let sumY: any = bigMath.bignumber(0);\n          let sumXY: any = bigMath.bignumber(0);\n          let sumX2: any = bigMath.bignumber(0);`);

content = content.replace(/let sumX2Y = bigMath\.bignumber\(0\);/g, `let sumX2Y: any = bigMath.bignumber(0);`);
content = content.replace(/let sumX3 = bigMath\.bignumber\(0\);/g, `let sumX3: any = bigMath.bignumber(0);`);
content = content.replace(/let sumX4 = bigMath\.bignumber\(0\);/g, `let sumX4: any = bigMath.bignumber(0);`);
content = content.replace(/let sumY2 = bigMath\.bignumber\(0\);/g, `let sumY2: any = bigMath.bignumber(0);`);
content = content.replace(/let sumLnX = bigMath\.bignumber\(0\);/g, `let sumLnX: any = bigMath.bignumber(0);`);
content = content.replace(/let sumLnY = bigMath\.bignumber\(0\);/g, `let sumLnY: any = bigMath.bignumber(0);`);
content = content.replace(/let sumLnX2 = bigMath\.bignumber\(0\);/g, `let sumLnX2: any = bigMath.bignumber(0);`);
content = content.replace(/let sumLnY2 = bigMath\.bignumber\(0\);/g, `let sumLnY2: any = bigMath.bignumber(0);`);
content = content.replace(/let sumXLnY = bigMath\.bignumber\(0\);/g, `let sumXLnY: any = bigMath.bignumber(0);`);
content = content.replace(/let sumLnXY = bigMath\.bignumber\(0\);/g, `let sumLnXY: any = bigMath.bignumber(0);`);
content = content.replace(/let sumLnXLnY = bigMath\.bignumber\(0\);/g, `let sumLnXLnY: any = bigMath.bignumber(0);`);
content = content.replace(/let sumInvX = bigMath\.bignumber\(0\);/g, `let sumInvX: any = bigMath.bignumber(0);`);
content = content.replace(/let sumInvX2 = bigMath\.bignumber\(0\);/g, `let sumInvX2: any = bigMath.bignumber(0);`);
content = content.replace(/let sumInvXY = bigMath\.bignumber\(0\);/g, `let sumInvXY: any = bigMath.bignumber(0);`);
content = content.replace(/let sumSqrtX = bigMath\.bignumber\(0\);/g, `let sumSqrtX: any = bigMath.bignumber(0);`);
content = content.replace(/let sumSqrtX2 = bigMath\.bignumber\(0\);/g, `let sumSqrtX2: any = bigMath.bignumber(0);`);
content = content.replace(/let sumSqrtXY = bigMath\.bignumber\(0\);/g, `let sumSqrtXY: any = bigMath.bignumber(0);`);

content = content.replace(/let a = bigMath\.bignumber\(0\);/g, `let a: any = bigMath.bignumber(0);`);
content = content.replace(/let b = bigMath\.bignumber\(0\);/g, `let b: any = bigMath.bignumber(0);`);
content = content.replace(/let c = bigMath\.bignumber\(0\);/g, `let c: any = bigMath.bignumber(0);`);
content = content.replace(/let d = bigMath\.bignumber\(0\);/g, `let d: any = bigMath.bignumber(0);`);

fs.writeFileSync('src/App.tsx', content);
