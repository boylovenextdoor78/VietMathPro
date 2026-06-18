import * as fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf-8');

const startIdx = content.indexOf('const yMean = ss.mean(yValues);');
const endIdx = content.indexOf('// Grouping logic');

const replacement = `
        const bigData: [any, any][] = weightedData.map(([x, y]) => [bigMath.bignumber(x), bigMath.bignumber(y)]);
        const yMean = bigMath.divide(sumY, nBig);
        let ssTot = bigMath.bignumber(0);
        bigData.forEach(([x, y]) => {
           ssTot = bigMath.add(ssTot, bigMath.pow(bigMath.subtract(y, yMean), 2));
        });

        const solveLinearRegressionBig = (data: [any, any][]) => {
          let sumX = bigMath.bignumber(0);
          let sumY = bigMath.bignumber(0);
          let sumXY = bigMath.bignumber(0);
          let sumX2 = bigMath.bignumber(0);
          let n = bigMath.bignumber(data.length);
          data.forEach(([x, y]) => {
            sumX = bigMath.add(sumX, x);
            sumY = bigMath.add(sumY, y);
            sumXY = bigMath.add(sumXY, bigMath.multiply(x, y));
            sumX2 = bigMath.add(sumX2, bigMath.pow(x, 2));
          });
          const num = bigMath.subtract(bigMath.multiply(n, sumXY), bigMath.multiply(sumX, sumY));
          const den = bigMath.subtract(bigMath.multiply(n, sumX2), bigMath.pow(sumX, 2));
          let b = bigMath.bignumber(0);
          let a = bigMath.bignumber(0);
          if (!bigMath.equal(den, 0)) {
            b = bigMath.divide(num, den);
            a = bigMath.divide(bigMath.subtract(sumY, bigMath.multiply(b, sumX)), n);
          }
          return { a, b };
        };

        const solvePolynomialBig = (data: [any, any][], degree: number) => {
          const n = degree + 1;
          const A = Array(n).fill(0).map(() => Array(n).fill(bigMath.bignumber(0)));
          const B = Array(n).fill(bigMath.bignumber(0));

          for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
              let sum = bigMath.bignumber(0);
              for (let k = 0; k < data.length; k++) {
                sum = bigMath.add(sum, bigMath.pow(data[k][0], i + j));
              }
              A[i][j] = sum;
            }
            let sumY = bigMath.bignumber(0);
            for (let k = 0; k < data.length; k++) {
              sumY = bigMath.add(sumY, bigMath.multiply(data[k][1], bigMath.pow(data[k][0], i)));
            }
            B[i] = sumY;
          }
          try {
            const res = bigMath.lusolve(A, B);
            return res.map((row: any) => bigMath.bignumber(row[0]));
          } catch (e) {
            return Array(n).fill(bigMath.bignumber(0));
          }
        };

        const calcR2 = (data: [any, any][], predict: (x: any) => any) => {
          let ssRes = bigMath.bignumber(0);
          data.forEach(([x, y]) => {
            const yHat = predict(x);
            ssRes = bigMath.add(ssRes, bigMath.pow(bigMath.subtract(y, yHat), 2));
          });
          if (bigMath.equal(ssTot, 0)) return bigMath.bignumber(1);
          return bigMath.subtract(1, bigMath.divide(ssRes, ssTot));
        };

        let formulaNode: React.ReactNode = null;
        let coeffsObj: any = {};
        let r2 = bigMath.bignumber(0);
        let r = bigMath.bignumber(0);

        if (regressionType === 'linear') {
          const { a, b } = solveLinearRegressionBig(bigData);
          coeffsObj = { a, b };
          formulaNode = <span>y = <StatValue value={b}/>x + <StatValue value={a}/></span>;
          r2 = calcR2(bigData, (x) => bigMath.add(a, bigMath.multiply(b, x)));
          r = bigMath.sqrt(bigMath.max(0, r2));
          if (b < 0) r = bigMath.multiply(r, -1);
        } else if (regressionType === 'quadratic') {
          const c = solvePolynomialBig(bigData, 2);
          coeffsObj = { a: c[0], b: c[1], c: c[2] };
          formulaNode = <span>y = <StatValue value={c[2]}/>x² + <StatValue value={c[1]}/>x + <StatValue value={c[0]}/></span>;
          r2 = calcR2(bigData, (x) => bigMath.add(c[0], bigMath.add(bigMath.multiply(c[1], x), bigMath.multiply(c[2], bigMath.pow(x, 2)))));
          r = bigMath.sqrt(bigMath.max(0, r2));
        } else if (regressionType === 'cubic') {
          const c = solvePolynomialBig(bigData, 3);
          coeffsObj = { a: c[0], b: c[1], c: c[2], d: c[3] };
          formulaNode = <span>y = <StatValue value={c[3]}/>x³ + <StatValue value={c[2]}/>x² + <StatValue value={c[1]}/>x + <StatValue value={c[0]}/></span>;
          r2 = calcR2(bigData, (x) => bigMath.add(c[0], bigMath.add(bigMath.multiply(c[1], x), bigMath.add(bigMath.multiply(c[2], bigMath.pow(x, 2)), bigMath.multiply(c[3], bigMath.pow(x, 3))))));
          r = bigMath.sqrt(bigMath.max(0, r2));
        } else if (regressionType === 'quartic') {
          const c = solvePolynomialBig(bigData, 4);
          coeffsObj = { a: c[0], b: c[1], c: c[2], d: c[3], e: c[4] };
          formulaNode = <span>y = <StatValue value={c[4]}/>x⁴ + <StatValue value={c[3]}/>x³ + <StatValue value={c[2]}/>x² + <StatValue value={c[1]}/>x + <StatValue value={c[0]}/></span>;
          r2 = calcR2(bigData, (x) => bigMath.add(c[0], bigMath.add(bigMath.multiply(c[1], x), bigMath.add(bigMath.multiply(c[2], bigMath.pow(x, 2)), bigMath.add(bigMath.multiply(c[3], bigMath.pow(x, 3)), bigMath.multiply(c[4], bigMath.pow(x, 4)))))));
          r = bigMath.sqrt(bigMath.max(0, r2));
        } else if (regressionType === 'quintic') {
          const c = solvePolynomialBig(bigData, 5);
          coeffsObj = { a: c[0], b: c[1], c: c[2], d: c[3], e: c[4], f: c[5] };
          formulaNode = <span>y = <StatValue value={c[5]}/>x⁵ + <StatValue value={c[4]}/>x⁴ + <StatValue value={c[3]}/>x³ + <StatValue value={c[2]}/>x² + <StatValue value={c[1]}/>x + <StatValue value={c[0]}/></span>;
          r2 = calcR2(bigData, (x) => bigMath.add(c[0], bigMath.add(bigMath.multiply(c[1], x), bigMath.add(bigMath.multiply(c[2], bigMath.pow(x, 2)), bigMath.add(bigMath.multiply(c[3], bigMath.pow(x, 3)), bigMath.add(bigMath.multiply(c[4], bigMath.pow(x, 4)), bigMath.multiply(c[5], bigMath.pow(x, 5))))))));
          r = bigMath.sqrt(bigMath.max(0, r2));
        } else if (regressionType === 'hyperbolic') {
          const transformed = bigData.filter(([x]) => !bigMath.equal(x, 0)).map(([x, y]) => {
            return [bigMath.divide(1, x), bigMath.divide(1, bigMath.pow(x, 2)), y];
          });
          if (transformed.length < 3) throw new Error("Cần ít nhất 3 giá trị X khác 0 cho hồi quy Hyperbol");
          
          const n = transformed.length;
          const A = Array(3).fill(0).map(() => Array(3).fill(bigMath.bignumber(0)));
          const B = Array(3).fill(bigMath.bignumber(0));
          
          const basis = transformed.map(d => [bigMath.bignumber(1), d[0], d[1]]);
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              let sum = bigMath.bignumber(0);
              for (let k = 0; k < n; k++) sum = bigMath.add(sum, bigMath.multiply(basis[k][i], basis[k][j]));
              A[i][j] = sum;
            }
            let sumY = bigMath.bignumber(0);
            for (let k = 0; k < n; k++) sumY = bigMath.add(sumY, bigMath.multiply(transformed[k][2], basis[k][i]));
            B[i] = sumY;
          }
          
          let c = Array(3).fill(bigMath.bignumber(0));
          try {
            const sol = bigMath.lusolve(A, B);
            c = sol.map((row: any) => bigMath.bignumber(row[0]));
          } catch (e) {}
          
          coeffsObj = { a: c[0], b: c[1], c: c[2] };
          formulaNode = <span>y = <StatValue value={c[0]}/> + <StatValue value={c[1]}/>/x + <StatValue value={c[2]}/>/x²</span>;
          r2 = calcR2(bigData, (x) => bigMath.equal(x, 0) ? bigMath.bignumber(0) : bigMath.add(c[0], bigMath.add(bigMath.divide(c[1], x), bigMath.divide(c[2], bigMath.pow(x, 2)))));
          r = bigMath.sqrt(bigMath.max(0, r2));
        } else if (regressionType === 'root') {
          const transformed = bigData.filter(([x]) => x >= 0).map(([x, y]) => [bigMath.sqrt(x), y]);
          if (transformed.length < 2) throw new Error("Cần ít nhất 2 giá trị X ≥ 0 cho hồi quy Căn thức");
          const { a, b } = solveLinearRegressionBig(transformed as any);
          coeffsObj = { a, b };
          formulaNode = <span>y = <StatValue value={a}/> + <StatValue value={b}/>√x</span>;
          r2 = calcR2(bigData, (x) => x < 0 ? bigMath.bignumber(0) : bigMath.add(a, bigMath.multiply(b, bigMath.sqrt(x))));
          r = bigMath.sqrt(bigMath.max(0, r2));
        } else if (regressionType === 'inverse') {
          const transformed = bigData.filter(([x]) => !bigMath.equal(x, 0)).map(([x, y]) => [bigMath.divide(1, x), y]);
          if (transformed.length < 2) throw new Error("Cần ít nhất 2 giá trị X khác 0 cho hồi quy nghịch đảo");
          const { a, b } = solveLinearRegressionBig(transformed as any);
          coeffsObj = { a, b };
          formulaNode = <span>y = <StatValue value={a}/> + <StatValue value={b}/>/x</span>;
          r2 = calcR2(bigData, (x) => bigMath.equal(x, 0) ? bigMath.bignumber(0) : bigMath.add(a, bigMath.divide(b, x)));
          r = bigMath.sqrt(bigMath.max(0, r2));
        } else if (regressionType === 'logarithmic') {
          const transformed = bigData.filter(([x]) => x > 0).map(([x, y]) => [bigMath.log(x), y]);
          if (transformed.length < 2) throw new Error("Cần ít nhất 2 giá trị X > 0 cho hồi quy Logarit");
          const { a, b } = solveLinearRegressionBig(transformed as any);
          coeffsObj = { a, b };
          formulaNode = <span>y = <StatValue value={a}/> + <StatValue value={b}/>ln(x)</span>;
          r2 = calcR2(bigData, (x) => x <= 0 ? bigMath.bignumber(0) : bigMath.add(a, bigMath.multiply(b, bigMath.log(x))));
          r = bigMath.sqrt(bigMath.max(0, r2));
        } else if (regressionType === 'exponential') {
          const transformed = bigData.filter(([, y]) => y > 0).map(([x, y]) => [x, bigMath.log(y)]);
          if (transformed.length < 2) throw new Error("Cần ít nhất 2 giá trị Y > 0 cho hồi quy Mũ");
          const { a: lnA, b } = solveLinearRegressionBig(transformed as any);
          const a = bigMath.exp(lnA);
          coeffsObj = { a, b };
          formulaNode = <span>y = <StatValue value={a}/> * exp(<StatValue value={b}/>x)</span>;
          r2 = calcR2(bigData, (x) => bigMath.multiply(a, bigMath.exp(bigMath.multiply(b, x))));
          r = bigMath.sqrt(bigMath.max(0, r2));
        } else if (regressionType === 'power_base') {
          const transformed = bigData.filter(([, y]) => y > 0).map(([x, y]) => [x, bigMath.log(y)]);
          if (transformed.length < 2) throw new Error("Cần ít nhất 2 giá trị Y > 0 cho hồi quy Lũy thừa (Cơ số b)");
          const { a: lnA, b: lnB } = solveLinearRegressionBig(transformed as any);
          const a = bigMath.exp(lnA);
          const b = bigMath.exp(lnB);
          coeffsObj = { a, b };
          formulaNode = <span>y = <StatValue value={a}/> * <StatValue value={b}/>^x</span>;
          r2 = calcR2(bigData, (x) => bigMath.multiply(a, bigMath.pow(b, x)));
          r = bigMath.sqrt(bigMath.max(0, r2));
        } else if (regressionType === 'power_exp') {
          const transformed = bigData.filter(([x, y]) => x > 0 && y > 0).map(([x, y]) => [bigMath.log(x), bigMath.log(y)]);
          if (transformed.length < 2) throw new Error("Cần ít nhất 2 giá trị X, Y > 0 cho hồi quy Lũy thừa (Số mũ b)");
          const { a: lnA, b } = solveLinearRegressionBig(transformed as any);
          const a = bigMath.exp(lnA);
          coeffsObj = { a, b };
          formulaNode = <span>y = <StatValue value={a}/> * x^<StatValue value={b}/></span>;
          r2 = calcR2(bigData, (x) => x <= 0 ? bigMath.bignumber(0) : bigMath.multiply(a, bigMath.pow(x, b)));
          r = bigMath.sqrt(bigMath.max(0, r2));
        } else if (regressionType === 'logistic') {
          const transformed = bigData.filter(([, y]) => y > 0 && y < 1).map(([x, y]) => [x, bigMath.log(bigMath.subtract(bigMath.divide(1, y), 1))]);
          if (transformed.length < 2) throw new Error("Cần ít nhất 2 giá trị Y trong khoảng (0, 1) cho hồi quy Logistic");
          const { a: negA, b: negB } = solveLinearRegressionBig(transformed as any);
          const a = bigMath.multiply(negA, -1);
          const b = bigMath.multiply(negB, -1);
          coeffsObj = { a, b };
          formulaNode = <span>y = 1 / (1 + exp(-(<StatValue value={a}/> + <StatValue value={b}/>x)))</span>;
          r2 = calcR2(bigData, (x) => bigMath.divide(1, bigMath.add(1, bigMath.exp(bigMath.multiply(-1, bigMath.add(a, bigMath.multiply(b, x)))))));
          r = bigMath.sqrt(bigMath.max(0, r2));
        } else if (regressionType === 'quantile') {
          // Simple Median Regression (Quantile 0.5) using IRLS
          let b_q = bigMath.divide(sumY, nBig);
          let a_q = bigMath.bignumber(0);
          for (let iter = 0; iter < 10; iter++) {
            let sumW = bigMath.bignumber(0);
            let sumWX = bigMath.bignumber(0);
            let sumWY = bigMath.bignumber(0);
            let sumWXX = bigMath.bignumber(0);
            let sumWXY = bigMath.bignumber(0);
            
            bigData.forEach(([x, y]) => {
              const residual = bigMath.subtract(y, bigMath.add(bigMath.multiply(a_q, x), b_q));
              const absRes = bigMath.abs(residual);
              const w = bigMath.divide(1, bigMath.max(0.0001, absRes));
              sumW = bigMath.add(sumW, w);
              sumWX = bigMath.add(sumWX, bigMath.multiply(w, x));
              sumWY = bigMath.add(sumWY, bigMath.multiply(w, y));
              sumWXX = bigMath.add(sumWXX, bigMath.multiply(w, bigMath.pow(x, 2)));
              sumWXY = bigMath.add(sumWXY, bigMath.multiply(w, bigMath.multiply(x, y)));
            });
            
            const denom = bigMath.subtract(bigMath.multiply(sumW, sumWXX), bigMath.pow(sumWX, 2));
            if (bigMath.abs(denom) < 1e-10) break;
            a_q = bigMath.divide(bigMath.subtract(bigMath.multiply(sumW, sumWXY), bigMath.multiply(sumWX, sumWY)), denom);
            b_q = bigMath.divide(bigMath.subtract(bigMath.multiply(sumWXX, sumWY), bigMath.multiply(sumWX, sumWXY)), denom);
          }
          coeffsObj = { a: b_q, b: a_q };
          formulaNode = <span>y = <StatValue value={a_q}/>x + <StatValue value={b_q}/> (Hồi quy Trung vị)</span>;
          r2 = calcR2(bigData, (x) => bigMath.add(bigMath.multiply(a_q, x), b_q));
          r = bigMath.sqrt(bigMath.max(0, r2));
        } else if (regressionType === 'decision_tree') {
          // Keep standard numbers for decision tree
          const buildTree = (data: [number, number][], depth: number): any => {
            if (depth >= 3 || data.length < 5) return { pred: ss.mean(data.map(d => d[1])), count: data.length };
            let bestSplit = -1, minSSE = Infinity, bestL: [number, number][] = [], bestR: [number, number][] = [];
            const sorted = [...data].sort((a, b) => a[0] - b[0]);
            for (let i = 0; i < sorted.length - 1; i++) {
              const split = (sorted[i][0] + sorted[i+1][0]) / 2;
              const L = sorted.slice(0, i + 1), R = sorted.slice(i + 1);
              const sse = ss.sumSimple(L.map(d => Math.pow(d[1] - ss.mean(L.map(l => l[1])), 2))) +
                          ss.sumSimple(R.map(d => Math.pow(d[1] - ss.mean(R.map(r => r[1])), 2)));
              if (sse < minSSE) { minSSE = sse; bestSplit = split; bestL = L; bestR = R; }
            }
            if (bestSplit === -1) return { pred: ss.mean(data.map(d => d[1])), count: data.length };
            return { split: bestSplit, left: buildTree(bestL, depth + 1), right: buildTree(bestR, depth + 1) };
          };
          const tree = buildTree(weightedData, 0);
          const predict = (node: any, x: number): number => node.pred !== undefined ? node.pred : (x < node.split ? predict(node.left, x) : predict(node.right, x));
          formulaNode = <span>y = Tree(x) (Cây Quyết định)</span>;
          const ssRes = weightedData.reduce((acc, [x, y]) => acc + Math.pow(y - predict(tree, x), 2), 0);
          const ssTotNum = weightedData.reduce((acc, [x, y]) => acc + Math.pow(y - parseFloat(yMean.toString())), 0);
          r2 = bigMath.bignumber(1 - (ssRes / ssTotNum));
          r = bigMath.sqrt(bigMath.max(0, r2));
          coeffsObj = { tree };
          
          const getLeaves = (node: any, path: string = ""): any[] => {
            if (node.pred !== undefined) return [{ range: path || "Toàn bộ", count: node.count }];
            return [
              ...getLeaves(node.left, path + (path ? " & " : "") + \`x < \${node.split.toFixed(2)}\`),
              ...getLeaves(node.right, path + (path ? " & " : "") + \`x ≥ \${node.split.toFixed(2)}\`)
            ];
          };
          groups = getLeaves(tree);
        } else if (regressionType === 'random_forest') {
          const buildTree = (data: [number, number][], depth: number): any => {
            if (depth >= 3 || data.length < 5) return { pred: ss.mean(data.map(d => d[1])), count: data.length };
            let bestSplit = -1, minSSE = Infinity, bestL: [number, number][] = [], bestR: [number, number][] = [];
            const sorted = [...data].sort((a, b) => a[0] - b[0]);
            for (let i = 0; i < sorted.length - 1; i++) {
              const split = (sorted[i][0] + sorted[i+1][0]) / 2;
              const L = sorted.slice(0, i + 1), R = sorted.slice(i + 1);
              const sse = ss.sumSimple(L.map(d => Math.pow(d[1] - ss.mean(L.map(l => l[1])), 2))) +
                          ss.sumSimple(R.map(d => Math.pow(d[1] - ss.mean(R.map(r => r[1])), 2)));
              if (sse < minSSE) { minSSE = sse; bestSplit = split; bestL = L; bestR = R; }
            }
            if (bestSplit === -1) return { pred: ss.mean(data.map(d => d[1])), count: data.length };
            return { split: bestSplit, left: buildTree(bestL, depth + 1), right: buildTree(bestR, depth + 1) };
          };
          const forest = Array(10).fill(0).map(() => {
            const sample = Array(weightedData.length).fill(0).map(() => weightedData[Math.floor(Math.random() * weightedData.length)]);
            return buildTree(sample, 0);
          });
          const predict = (node: any, x: number): number => node.pred !== undefined ? node.pred : (x < node.split ? predict(node.left, x) : predict(node.right, x));
          const predForest = (x: number) => ss.mean(forest.map(t => predict(t, x)));
          formulaNode = <span>y = Forest(x) (Random Forest)</span>;
          const ssRes = weightedData.reduce((acc, [x, y]) => acc + Math.pow(y - predForest(x), 2), 0);
          const ssTotNum = weightedData.reduce((acc, [x, y]) => acc + Math.pow(y - parseFloat(yMean.toString())), 0);
          r2 = bigMath.bignumber(1 - (ssRes / ssTotNum));
          r = bigMath.sqrt(bigMath.max(0, r2));
          coeffsObj = { forest };

          const getLeaves = (node: any, path: string = ""): any[] => {
            if (node.pred !== undefined) return [{ range: path || "Toàn bộ", count: node.count }];
            return [
              ...getLeaves(node.left, path + (path ? " & " : "") + \`x < \${node.split.toFixed(2)}\`),
              ...getLeaves(node.right, path + (path ? " & " : "") + \`x ≥ \${node.split.toFixed(2)}\`)
            ];
          };
          groups = getLeaves(forest[0]);
        }

        bivariate = {
          type: regressionType,
          formulaNode,
          r,
          r2,
          coeffs: coeffsObj
        };
      }

      // Grouping logic
`;

const newContent = content.substring(0, startIdx) + replacement + content.substring(endIdx + 18);
fs.writeFileSync('src/App.tsx', newContent);
