import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const oldRunStatsStart = `  const runStats = () => {
    setLoading(true);
    try {
      // Filter rows that have at least X value
      const validRows = rows.filter(r => {
        const x = r.x.trim();
        const y = r.y.trim();
        if (isBivariate) {
          return x !== '' && !isNaN(parseFloat(x)) && y !== '' && !isNaN(parseFloat(y));
        }
        return x !== '' && !isNaN(parseFloat(x));
      });

      if (validRows.length === 0) throw new Error("Không có dữ liệu hợp lệ (Cần ít nhất 1 giá trị X)");`;

const newRunStatsStart = `  const runStats = () => {
    setLoading(true);
    try {
      const bigMath = math.create(math.all, { number: 'BigNumber', precision: 60 });
      
      let xValues: number[] = [];
      let yValues: number[] = [];
      let weightedData: [number, number][] = [];
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

      let groups: any[] = [];
      let currentCf = 0;
      let maxFreq = -1;
      let modalGroupIndex = -1;

      if (showGrouping) {
        const validRows = rows.filter(r => r.from && r.to && r.from.trim() !== '' && r.to.trim() !== '' && !isNaN(parseFloat(r.from)) && !isNaN(parseFloat(r.to)));
        if (validRows.length === 0) throw new Error("Không có dữ liệu nhóm hợp lệ");
        
        validRows.forEach((r, i) => {
          const L = parseFloat(r.from!);
          const U = parseFloat(r.to!);
          const fStr = r.f.trim();
          const count = showFreq ? Math.max(1, Math.round(parseFloat(fStr) || 1)) : 1;
          
          totalFreq += count;
          currentCf += count;
          rowCount++;
          
          groups.push({ range: \`[\${L} - \${U})\`, count, cf: currentCf, L, U });
          
          if (count > maxFreq) {
            maxFreq = count;
            modalGroupIndex = i;
          }
          
          const c = bigMath.divide(bigMath.add(L, U), 2);
          const bf = bigMath.bignumber(count);
          
          sumX = bigMath.add(sumX, bigMath.multiply(bf, c));
          sumX2 = bigMath.add(sumX2, bigMath.multiply(bf, bigMath.pow(c, 2)));
          sumX3 = bigMath.add(sumX3, bigMath.multiply(bf, bigMath.pow(c, 3)));
          sumX4 = bigMath.add(sumX4, bigMath.multiply(bf, bigMath.pow(c, 4)));
        });
      } else {
        const validRows = rows.filter(r => {
          const x = r.x.trim();
          const y = r.y.trim();
          if (isBivariate) {
            return x !== '' && !isNaN(parseFloat(x)) && y !== '' && !isNaN(parseFloat(y));
          }
          return x !== '' && !isNaN(parseFloat(x));
        });

        if (validRows.length === 0) throw new Error("Không có dữ liệu hợp lệ (Cần ít nhất 1 giá trị X)");
        rowCount = validRows.length;

        validRows.forEach(r => {
          const xStr = r.x.trim();
          const yStr = r.y.trim();
          const fStr = r.f.trim();
          
          const xNum = parseFloat(xStr);
          const yNum = parseFloat(yStr);
          const fNum = showFreq ? Math.max(1, Math.round(parseFloat(fStr) || 1)) : 1;
          
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
      }`;

content = content.replace(oldRunStatsStart, newRunStatsStart);

// Remove the old sum calculations that were after validRows.forEach
const oldSumsToRemove = `      // Expand data based on frequency
      let xValues: number[] = [];
      let yValues: number[] = [];
      let weightedData: [number, number][] = [];
      let totalFreq = 0;
      const rowCount = validRows.length;

      const bigMath = math.create(math.all, { number: 'BigNumber', precision: 60 });
      let sumX = bigMath.bignumber(0);
      let sumX2 = bigMath.bignumber(0);
      let sumX3 = bigMath.bignumber(0);
      let sumX4 = bigMath.bignumber(0);
      let sumY = bigMath.bignumber(0);
      let sumY2 = bigMath.bignumber(0);
      let sumXY = bigMath.bignumber(0);
      let sumX2Y = bigMath.bignumber(0);

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
        
        // Add to sums
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

      // Sort data for quartiles
      xValues.sort((a, b) => a - b);`;

content = content.replace(oldSumsToRemove, '');

// Now we need to update the quartile and stats calculation logic
// We'll replace everything from "// Frequency Table & Cumulative Frequency" up to "let meanY = ..."
const oldStatsCalc = `      // Frequency Table & Cumulative Frequency
      const freqMapX = new Map<number, number>();
      xValues.forEach(v => freqMapX.set(v, (freqMapX.get(v) || 0) + 1));
      const sortedUniqueX = Array.from(freqMapX.keys()).sort((a, b) => a - b);
      let cfX = 0;
      const freqTableX = sortedUniqueX.map(x => {
        const f = freqMapX.get(x)!;
        cfX += f;
        return { x, f, cf: cfX };
      });

      // GDPT 2018 Quartiles
      const quartilesX = calculateQuartilesGDPT(xValues);
      let medianX = bigMath.bignumber(quartilesX.q2);
      let q1X = bigMath.bignumber(quartilesX.q1);
      let q3X = bigMath.bignumber(quartilesX.q3);
      let quartileStepsX = quartilesX.steps;

      const nBig = bigMath.bignumber(totalFreq);
      let meanX = bigMath.divide(sumX, nBig);
      
      const meanX2 = bigMath.pow(meanX, 2);
      let popVarX = bigMath.subtract(bigMath.divide(sumX2, nBig), meanX2);
      let popStdX = bigMath.sqrt(bigMath.max(0, popVarX));
      
      let varX = bigMath.bignumber(0);
      let stdX = bigMath.bignumber(0);
      if (totalFreq > 1) {
        varX = bigMath.multiply(popVarX, bigMath.divide(nBig, bigMath.subtract(nBig, 1)));
        stdX = bigMath.sqrt(bigMath.max(0, varX));
      }

      let minX = bigMath.bignumber(xValues[0]);
      let maxX = bigMath.bignumber(xValues[xValues.length - 1]);`;

const newStatsCalc = `      let freqTableX: any[] | null = null;
      let medianX = bigMath.bignumber(0);
      let q1X = bigMath.bignumber(0);
      let q3X = bigMath.bignumber(0);
      let quartileStepsX: string[] = [];
      let groupedQuartiles: any = null;
      let modeX = bigMath.bignumber(0);
      let modeStepsX: string[] = [];
      let hasModeX = false;
      let minX = bigMath.bignumber(0);
      let maxX = bigMath.bignumber(0);

      const nBig = bigMath.bignumber(totalFreq);
      let meanX = bigMath.divide(sumX, nBig);
      const meanX2 = bigMath.pow(meanX, 2);
      let popVarX = bigMath.subtract(bigMath.divide(sumX2, nBig), meanX2);
      let popStdX = bigMath.sqrt(bigMath.max(0, popVarX));
      
      let varX = bigMath.bignumber(0);
      let stdX = bigMath.bignumber(0);
      if (totalFreq > 1) {
        varX = bigMath.multiply(popVarX, bigMath.divide(nBig, bigMath.subtract(nBig, 1)));
        stdX = bigMath.sqrt(bigMath.max(0, varX));
      }

      if (showGrouping) {
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
        minX = bigMath.bignumber(xValues[0]);
        maxX = bigMath.bignumber(xValues[xValues.length - 1]);

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
      }`;

content = content.replace(oldStatsCalc, newStatsCalc);

// Remove the old grouping logic that was after bivariate calculation
const oldGroupingLogic = `      // Grouping logic
      let modeX = bigMath.bignumber(0);
      let modeStepsX: string[] = [];
      let hasModeX = false;

      if (showGrouping && groupConfig.start && groupConfig.end) {
        const start = parseFloat(groupConfig.start);
        const end = parseFloat(groupConfig.end);
        let bins: number[] = [];

        if (groupConfig.step) {
          const step = parseFloat(groupConfig.step);
          for (let val = start; val <= end + 0.00001; val += step) {
            bins.push(val);
          }
        } else {
          const count = parseInt(groupConfig.count);
          const step = (end - start) / count;
          for (let i = 0; i <= count; i++) {
            bins.push(start + i * step);
          }
        }

        let currentCf = 0;
        let maxFreq = -1;
        let modalGroupIndex = -1;

        for (let i = 0; i < bins.length - 1; i++) {
          const lower = bins[i];
          const upper = bins[i+1];
          const count = xValues.filter(v => v >= lower && v < upper).length;
          const lastCount = i === bins.length - 2 ? xValues.filter(v => v === upper).length : 0;
          const totalCount = count + lastCount;
          currentCf += totalCount;
          groups.push({ range: \`[\${lower.toFixed(2)} - \${upper.toFixed(2)}]\`, count: totalCount, cf: currentCf, L: lower, U: upper });
          
          if (totalCount > maxFreq) {
            maxFreq = totalCount;
            modalGroupIndex = i;
          }
        }

        if (groups.length > 0) {
          // Override statistics with grouped data formulas
          let gSumX = bigMath.bignumber(0);
          let gSumX2 = bigMath.bignumber(0);
          let gSumX3 = bigMath.bignumber(0);
          let gSumX4 = bigMath.bignumber(0);
          
          groups.forEach(g => {
            const c = bigMath.divide(bigMath.add(g.L, g.U), 2);
            const f = bigMath.bignumber(g.count);
            gSumX = bigMath.add(gSumX, bigMath.multiply(f, c));
            gSumX2 = bigMath.add(gSumX2, bigMath.multiply(f, bigMath.pow(c, 2)));
            gSumX3 = bigMath.add(gSumX3, bigMath.multiply(f, bigMath.pow(c, 3)));
            gSumX4 = bigMath.add(gSumX4, bigMath.multiply(f, bigMath.pow(c, 4)));
          });

          sumX = gSumX;
          sumX2 = gSumX2;
          sumX3 = gSumX3;
          sumX4 = gSumX4;

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
        }
      }`;

content = content.replace(oldGroupingLogic, '');

fs.writeFileSync('src/App.tsx', content);
