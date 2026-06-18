import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(/sum = bigMath\.add\(sum, bigMath\.pow\(data\[k\]\[0\], i \+ j\)\);/g, `sum = bigMath.add(sum, bigMath.pow(data[k][0], i + j)) as any;`);
content = content.replace(/sumY = bigMath\.add\(sumY, bigMath\.multiply\(data\[k\]\[1\], bigMath\.pow\(data\[k\]\[0\], i\)\)\);/g, `sumY = bigMath.add(sumY, bigMath.multiply(data[k][1], bigMath.pow(data[k][0], i))) as any;`);
content = content.replace(/return res\.map\(\(row: any\) => bigMath\.bignumber\(row\[0\]\)\);/g, `return res.map((row: any) => bigMath.bignumber(row[0])) as any;`);
content = content.replace(/return Array\(n\)\.fill\(bigMath\.bignumber\(0\)\);/g, `return Array(n).fill(bigMath.bignumber(0)) as any;`);
content = content.replace(/let ssRes = bigMath\.bignumber\(0\);/g, `let ssRes: any = bigMath.bignumber(0);`);
content = content.replace(/ssRes = bigMath\.add\(ssRes, bigMath\.pow\(bigMath\.subtract\(y, yHat\), 2\)\);/g, `ssRes = bigMath.add(ssRes, bigMath.pow(bigMath.subtract(y, yHat), 2)) as any;`);
content = content.replace(/if \(bigMath\.equal\(ssTot, 0\)\) return bigMath\.bignumber\(1\);/g, `if (bigMath.equal(ssTot, 0)) return bigMath.bignumber(1) as any;`);
content = content.replace(/return bigMath\.subtract\(1, bigMath\.divide\(ssRes, ssTot\)\);/g, `return bigMath.subtract(1, bigMath.divide(ssRes, ssTot)) as any;`);

content = content.replace(/let r2 = bigMath\.bignumber\(0\);/g, `let r2: any = bigMath.bignumber(0);`);
content = content.replace(/let r = bigMath\.bignumber\(0\);/g, `let r: any = bigMath.bignumber(0);`);

content = content.replace(/r2 = calcR2\(bigData, \(x\) => bigMath\.add\(a, bigMath\.multiply\(b, x\)\)\);/g, `r2 = calcR2(bigData, (x) => bigMath.add(a, bigMath.multiply(b, x)));`);
content = content.replace(/r = bigMath\.sqrt\(bigMath\.max\(0, r2\)\);/g, `r = bigMath.sqrt(bigMath.max(0, r2 as any) as any) as any;`);
content = content.replace(/if \(b < 0\) r = bigMath\.multiply\(r, -1\);/g, `if (b < 0) r = bigMath.multiply(r, -1) as any;`);

content = content.replace(/r2 = calcR2\(bigData, \(x\) => bigMath\.add\(c\[0\], bigMath\.add\(bigMath\.multiply\(c\[1\], x\), bigMath\.multiply\(c\[2\], bigMath\.pow\(x, 2\)\)\)\)\);/g, `r2 = calcR2(bigData, (x) => bigMath.add(c[0], bigMath.add(bigMath.multiply(c[1], x), bigMath.multiply(c[2], bigMath.pow(x, 2)))));`);
content = content.replace(/r2 = calcR2\(bigData, \(x\) => bigMath\.add\(c\[0\], bigMath\.add\(bigMath\.multiply\(c\[1\], x\), bigMath\.add\(bigMath\.multiply\(c\[2\], bigMath\.pow\(x, 2\)\), bigMath\.multiply\(c\[3\], bigMath\.pow\(x, 3\)\)\)\)\)\);/g, `r2 = calcR2(bigData, (x) => bigMath.add(c[0], bigMath.add(bigMath.multiply(c[1], x), bigMath.add(bigMath.multiply(c[2], bigMath.pow(x, 2)), bigMath.multiply(c[3], bigMath.pow(x, 3))))));`);
content = content.replace(/r2 = calcR2\(bigData, \(x\) => bigMath\.add\(c\[0\], bigMath\.add\(bigMath\.multiply\(c\[1\], x\), bigMath\.add\(bigMath\.multiply\(c\[2\], bigMath\.pow\(x, 2\)\), bigMath\.add\(bigMath\.multiply\(c\[3\], bigMath\.pow\(x, 3\)\), bigMath\.multiply\(c\[4\], bigMath\.pow\(x, 4\)\)\)\)\)\)\);/g, `r2 = calcR2(bigData, (x) => bigMath.add(c[0], bigMath.add(bigMath.multiply(c[1], x), bigMath.add(bigMath.multiply(c[2], bigMath.pow(x, 2)), bigMath.add(bigMath.multiply(c[3], bigMath.pow(x, 3)), bigMath.multiply(c[4], bigMath.pow(x, 4)))))));`);

content = content.replace(/r2 = calcR2\(logData, \(x\) => bigMath\.add\(a, bigMath\.multiply\(b, bigMath\.log\(x\)\)\)\);/g, `r2 = calcR2(logData, (x) => bigMath.add(a, bigMath.multiply(b, bigMath.log(x))));`);
content = content.replace(/r2 = calcR2\(expData, \(x\) => bigMath\.multiply\(a, bigMath\.exp\(bigMath\.multiply\(b, x\)\)\)\);/g, `r2 = calcR2(expData, (x) => bigMath.multiply(a, bigMath.exp(bigMath.multiply(b, x))));`);
content = content.replace(/r2 = calcR2\(abxData, \(x\) => bigMath\.multiply\(a, bigMath\.pow\(b, x\)\)\);/g, `r2 = calcR2(abxData, (x) => bigMath.multiply(a, bigMath.pow(b, x)));`);
content = content.replace(/r2 = calcR2\(powData, \(x\) => bigMath\.multiply\(a, bigMath\.pow\(x, b\)\)\);/g, `r2 = calcR2(powData, (x) => bigMath.multiply(a, bigMath.pow(x, b)));`);
content = content.replace(/r2 = calcR2\(invData, \(x\) => bigMath\.add\(a, bigMath\.divide\(b, x\)\)\);/g, `r2 = calcR2(invData, (x) => bigMath.add(a, bigMath.divide(b, x)));`);

fs.writeFileSync('src/App.tsx', content);
