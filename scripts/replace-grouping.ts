import * as fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf-8');

const startIdx = content.indexOf('// Grouping logic');
const endIdx = content.indexOf('setResults({');

const replacement = `
      // Grouping logic
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
      }

      `;

const newContent = content.substring(0, startIdx) + replacement + content.substring(endIdx);
fs.writeFileSync('src/App.tsx', newContent);
