import * as fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf-8');

const startIdx = content.indexOf('const runStats = () => {');
const endIdx = content.indexOf('// Grouping logic');

const replacement = `const runStats = () => {
    setLoading(true);
    try {
      const bigMath = math.create(math.all, { number: 'BigNumber', precision: 60 });
      
      let nBig = bigMath.bignumber(0);
      let totalFreq = 0;
      let rowCount = 0;

      let sumX = bigMath.bignumber(0);
      let sumX2 = bigMath.bignumber(0);
      let sumX3 = bigMath.bignumber(0);
      let sumX4 = bigMath.bignumber(0);
      let sumY = bigMath.bignumber(0);
      let sumY2 = bigMath.bignumber(0);
      let sumXY = bigMath.bignumber(0);
      let sumX2Y = bigMath.bignumber(0);

      let meanX = bigMath.bignumber(0);
      let popVarX = bigMath.bignumber(0);
      let popStdX = bigMath.bignumber(0);
      let varX = bigMath.bignumber(0);
      let stdX = bigMath.bignumber(0);
      let minX = bigMath.bignumber(0);
      let maxX = bigMath.bignumber(0);
      let medianX = bigMath.bignumber(0);
      let q1X = bigMath.bignumber(0);
      let q3X = bigMath.bignumber(0);
      let quartileStepsX: string[] = [];
      let freqTableX: any[] = [];

      let meanY = bigMath.bignumber(0);
      let popVarY = bigMath.bignumber(0);
      let popStdY = bigMath.bignumber(0);
      let varY = bigMath.bignumber(0);
      let stdY = bigMath.bignumber(0);
      let minY = bigMath.bignumber(0);
      let maxY = bigMath.bignumber(0);
      let medianY = bigMath.bignumber(0);
      let q1Y = bigMath.bignumber(0);
      let q3Y = bigMath.bignumber(0);

      let bivariate: any = null;
      let groups: any[] = [];
      let groupedQuartiles: any = null;
      let modeX = bigMath.bignumber(0);
      let modeStepsX: string[] = [];
      let hasModeX = false;

      if (showGrouping) {
        // --- GROUPED DATA PROCESSING ---
        const validRows = rows.filter(r => r.x.trim() !== '' && r.y.trim() !== '');
        if (validRows.length === 0) throw new Error("Không có dữ liệu ghép nhóm hợp lệ (Cần nhập [From và To))");

        let currentCf = 0;
        let maxFreq = -1;
        let modalGroupIndex = -1;

        validRows.forEach((r, i) => {
          const lower = parseFloat(r.x);
          const upper = parseFloat(r.y);
          const freq = Math.max(0, Math.round(parseFloat(r.f) || 1));
          
          if (!isNaN(lower) && !isNaN(upper) && freq > 0) {
            currentCf += freq;
            groups.push({ 
              range: \`[\${lower} - \${upper})\`, 
              count: freq, 
              cf: currentCf, 
              L: lower, 
              U: upper 
            });
            totalFreq += freq;
            
            if (freq > maxFreq) {
              maxFreq = freq;
              modalGroupIndex = groups.length - 1;
            }
          }
        });

        if (groups.length === 0) throw new Error("Dữ liệu ghép nhóm không hợp lệ");

        rowCount = groups.length;
        nBig = bigMath.bignumber(totalFreq);

        groups.forEach(g => {
          const c = bigMath.divide(bigMath.add(g.L, g.U), 2);
          const f = bigMath.bignumber(g.count);
          sumX = bigMath.add(sumX, bigMath.multiply(f, c));
          sumX2 = bigMath.add(sumX2, bigMath.multiply(f, bigMath.pow(c, 2)));
          sumX3 = bigMath.add(sumX3, bigMath.multiply(f, bigMath.pow(c, 3)));
          sumX4 = bigMath.add(sumX4, bigMath.multiply(f, bigMath.pow(c, 4)));
        });

        meanX = bigMath.divide(sumX, nBig);
        const meanX2 = bigMath.pow(meanX, 2);
        popVarX = bigMath.subtract(bigMath.divide(sumX2, nBig), meanX2);
        popStdX = bigMath.sqrt(bigMath.max(0, popVarX));
        
        if (totalFreq > 1) {
          varX = bigMath.multiply(popVarX, bigMath.divide(nBig, bigMath.subtract(nBig, 1)));
          stdX = bigMath.sqrt(bigMath.max(0, varX));
        }

        minX = bigMath.bignumber(groups[0].L);
        maxX = bigMath.bignumber(groups[groups.length - 1].U);

        // Grouped data quartiles
        const calculateGroupedQ = (p: number) => {
          const target = (p * totalFreq) / 4;
          let currentCf = 0;
          for (let i = 0; i < groups.length; i++) {
            const prevCf = currentCf;
            currentCf += groups[i].count;
            if (currentCf >= target) {
              const L = groups[i].L;
              const U = groups[i].U;
              const h = U - L;
              const f = groups[i].count;
              if (f === 0) return null;
              const q = L + ((target - prevCf) / f) * h;
              return { value: bigMath.bignumber(q), group: groups[i].range, L, h, f, prevCf, target };
            }
          }
          return null;
        };

        const gQ1 = calculateGroupedQ(1);
        const gQ2 = calculateGroupedQ(2);
        const gQ3 = calculateGroupedQ(3);
        
        if (gQ1 && gQ2 && gQ3) {
          q1X = gQ1.value;
          medianX = gQ2.value;
          q3X = gQ3.value;
          
          groupedQuartiles = {
            q1: gQ1,
            q2: gQ2,
            q3: gQ3,
            steps: [
              \`Q1: Nhóm chứa Q1 là \${gQ1.group} (vị trí n/4 = \${gQ1.target.toFixed(2)}). Q1 = \${gQ1.L} + ((\${gQ1.target.toFixed(2)} - \${gQ1.prevCf}) / \${gQ1.f}) * \${gQ1.h.toFixed(2)} = \${gQ1.value.toFixed(4)}\`,
              \`Q2: Nhóm chứa Q2 là \${gQ2.group} (vị trí n/2 = \${gQ2.target.toFixed(2)}). Q2 = \${gQ2.L} + ((\${gQ2.target.toFixed(2)} - \${gQ2.prevCf}) / \${gQ2.f}) * \${gQ2.h.toFixed(2)} = \${gQ2.value.toFixed(4)}\`,
              \`Q3: Nhóm chứa Q3 là \${gQ3.group} (vị trí 3n/4 = \${gQ3.target.toFixed(2)}). Q3 = \${gQ3.L} + ((\${gQ3.target.toFixed(2)} - \${gQ3.prevCf}) / \${gQ3.f}) * \${gQ3.h.toFixed(2)} = \${gQ3.value.toFixed(4)}\`
            ]
          };
        }

        // Calculate Mode for grouped data
        if (modalGroupIndex !== -1) {
          const m_p = groups[modalGroupIndex].count;
          const m_prev = modalGroupIndex > 0 ? groups[modalGroupIndex - 1].count : 0;
          const m_next = modalGroupIndex < groups.length - 1 ? groups[modalGroupIndex + 1].count : 0;
          const L = groups[modalGroupIndex].L;
          const h = groups[modalGroupIndex].U - groups[modalGroupIndex].L;
          
          const denom = (m_p - m_prev) + (m_p - m_next);
          if (denom !== 0) {
            const mo = L + ((m_p - m_prev) / denom) * h;
            modeX = bigMath.bignumber(mo);
            hasModeX = true;
            modeStepsX = [
              \`Nhóm chứa mốt là \${groups[modalGroupIndex].range} với tần số lớn nhất m_p = \${m_p}\`,
              \`M_o = \${L} + ((\${m_p} - \${m_prev}) / ((\${m_p} - \${m_prev}) + (\${m_p} - \${m_next}))) * \${h.toFixed(2)} = \${mo.toFixed(4)}\`
            ];
          }
        }

      } else {
        // --- RAW DATA PROCESSING ---
        const validRows = rows.filter(r => {
          const x = r.x.trim();
          const y = r.y.trim();
          if (isBivariate) {
            return x !== '' && !isNaN(parseFloat(x)) && y !== '' && !isNaN(parseFloat(y));
          }
          return x !== '' && !isNaN(parseFloat(x));
        });

        if (validRows.length === 0) throw new Error("Không có dữ liệu hợp lệ (Cần ít nhất 1 giá trị X)");

        let xValues: number[] = [];
        let yValues: number[] = [];
        let weightedData: [number, number][] = [];
        rowCount = validRows.length;

        validRows.forEach(r => {
          const xStr = r.x.trim();
          const yStr = r.y.trim();
          const fStr = r.f.trim();
          
          const xNum = parseFloat(xStr);
          const yNum = parseFloat(yStr);
          const fNum = Math.max(1, Math.round(parseFloat(fStr) || 1));
          
          const bx = bigMath.bignumber(xStr);
          const by = isBivariate && yStr !== '' ? bigMath.bignumber(yStr) : null;
          const bf = bigMath.bignumber(fNum);
          
          totalFreq += fNum;
          
          sumX = bigMath.add(sumX, bigMath.multiply(bx, bf));
          sumX2 = bigMath.add(sumX2, bigMath.multiply(bigMath.pow(bx, 2), bf));
          sumX3 = bigMath.add(sumX3, bigMath.multiply(bigMath.pow(bx, 3), bf));
          sumX4 = bigMath.add(sumX4, bigMath.multiply(bigMath.pow(bx, 4), bf));

          if (isBivariate && by !== null) {
            sumY = bigMath.add(sumY, bigMath.multiply(by, bf));
            sumY2 = bigMath.add(sumY2, bigMath.multiply(bigMath.pow(by, 2), bf));
            sumXY = bigMath.add(sumXY, bigMath.multiply(bigMath.multiply(bx, by), bf));
            sumX2Y = bigMath.add(sumX2Y, bigMath.multiply(bigMath.multiply(bigMath.pow(bx, 2), by), bf));
          }

          for (let i = 0; i < fNum; i++) {
            xValues.push(xNum);
            if (isBivariate && !isNaN(yNum)) {
              yValues.push(yNum);
              weightedData.push([xNum, yNum]);
            }
          }
        });

        if (xValues.length === 0) throw new Error("Dữ liệu không hợp lệ");

        xValues.sort((a, b) => a - b);

        const freqMapX = new Map<number, number>();
        xValues.forEach(v => freqMapX.set(v, (freqMapX.get(v) || 0) + 1));
        const sortedUniqueX = Array.from(freqMapX.keys()).sort((a, b) => a - b);
        let cfX = 0;
        freqTableX = sortedUniqueX.map(x => {
          const f = freqMapX.get(x)!;
          cfX += f;
          return { x, f, cf: cfX };
        });

        const quartilesX = calculateQuartilesGDPT(xValues);
        medianX = bigMath.bignumber(quartilesX.q2);
        q1X = bigMath.bignumber(quartilesX.q1);
        q3X = bigMath.bignumber(quartilesX.q3);
        quartileStepsX = quartilesX.steps;

        nBig = bigMath.bignumber(totalFreq);
        meanX = bigMath.divide(sumX, nBig);
        
        const meanX2 = bigMath.pow(meanX, 2);
        popVarX = bigMath.subtract(bigMath.divide(sumX2, nBig), meanX2);
        popStdX = bigMath.sqrt(bigMath.max(0, popVarX));
        
        if (totalFreq > 1) {
          varX = bigMath.multiply(popVarX, bigMath.divide(nBig, bigMath.subtract(nBig, 1)));
          stdX = bigMath.sqrt(bigMath.max(0, varX));
        }

        minX = bigMath.bignumber(xValues[0]);
        maxX = bigMath.bignumber(xValues[xValues.length - 1]);

        if (isBivariate && yValues.length > 0) {
          yValues.sort((a, b) => a - b);
          const quartilesY = calculateQuartilesGDPT(yValues);
          medianY = bigMath.bignumber(quartilesY.q2);
          minY = bigMath.bignumber(yValues[0]);
          maxY = bigMath.bignumber(yValues[yValues.length - 1]);
          
          meanY = bigMath.divide(sumY, nBig);
          const meanY2 = bigMath.pow(meanY, 2);
          popVarY = bigMath.subtract(bigMath.divide(sumY2, nBig), meanY2);
          popStdY = bigMath.sqrt(bigMath.max(0, popVarY));
          
          if (totalFreq > 1) {
            varY = bigMath.multiply(popVarY, bigMath.divide(nBig, bigMath.subtract(nBig, 1)));
            stdY = bigMath.sqrt(bigMath.max(0, varY));
          }
          
          q1Y = bigMath.bignumber(quartilesY.q1);
          q3Y = bigMath.bignumber(quartilesY.q3);
        }

        if (isBivariate && weightedData.length >= 2) {
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
      }
`;

const newContent = content.substring(0, startIdx) + replacement + content.substring(endIdx + 18);
fs.writeFileSync('src/App.tsx', newContent);
