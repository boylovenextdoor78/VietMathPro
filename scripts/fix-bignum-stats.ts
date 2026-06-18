import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const oldQuartile = `        // Grouped data quartiles
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
        };`;

const newQuartile = `        // Grouped data quartiles
        const calculateGroupedQ = (p: number) => {
          const target = (p * totalFreq) / 4;
          let currentCf = 0;
          for (let i = 0; i < groups.length; i++) {
            const prevCf = currentCf;
            currentCf += groups[i].count;
            if (currentCf >= target) {
              const L = groups[i].L;
              const U = groups[i].U;
              const h = bigMath.subtract(U, L);
              const f = groups[i].count;
              if (f === 0) return null;
              
              const targetDiff = bigMath.bignumber(target - prevCf);
              const fBig = bigMath.bignumber(f);
              const q = bigMath.add(L, bigMath.multiply(bigMath.divide(targetDiff, fBig), h));
              
              return { value: q, group: groups[i].range, L, h, f, prevCf, target };
            }
          }
          return null;
        };`;

content = content.replace(oldQuartile, newQuartile);

const oldMode = `        // Grouped data mode
        if (modalGroupIndex !== -1) {
          const L = groups[modalGroupIndex].L;
          const U = groups[modalGroupIndex].U;
          const h = U - L;
          const f_m = groups[modalGroupIndex].count;
          const f_m_minus_1 = modalGroupIndex > 0 ? groups[modalGroupIndex - 1].count : 0;
          const f_m_plus_1 = modalGroupIndex < groups.length - 1 ? groups[modalGroupIndex + 1].count : 0;
          
          const d1 = f_m - f_m_minus_1;
          const d2 = f_m - f_m_plus_1;
          
          if (d1 + d2 > 0) {
            const m = L + (d1 / (d1 + d2)) * h;
            modeX = bigMath.bignumber(m);
            hasModeX = true;
            modeStepsX = [
              \`Nhóm chứa mốt: \${groups[modalGroupIndex].range}\`,
              \`L (Giới hạn dưới) = \${L}\`,
              \`h (Độ rộng) = \${h}\`,
              \`f_m (Tần số nhóm mốt) = \${f_m}\`,
              \`f_{m-1} (Tần số nhóm trước) = \${f_m_minus_1}\`,
              \`f_{m+1} (Tần số nhóm sau) = \${f_m_plus_1}\`,
              \`d1 = f_m - f_{m-1} = \${d1}\`,
              \`d2 = f_m - f_{m+1} = \${d2}\`,
              \`M_o = L + (d1 / (d1 + d2)) * h = \${L} + (\${d1} / \${d1 + d2}) * \${h} = \${m.toFixed(4)}\`
            ];
          }
        }`;

const newMode = `        // Grouped data mode
        if (modalGroupIndex !== -1) {
          const L = groups[modalGroupIndex].L;
          const U = groups[modalGroupIndex].U;
          const h = bigMath.subtract(U, L);
          const f_m = groups[modalGroupIndex].count;
          const f_m_minus_1 = modalGroupIndex > 0 ? groups[modalGroupIndex - 1].count : 0;
          const f_m_plus_1 = modalGroupIndex < groups.length - 1 ? groups[modalGroupIndex + 1].count : 0;
          
          const d1 = f_m - f_m_minus_1;
          const d2 = f_m - f_m_plus_1;
          
          if (d1 + d2 > 0) {
            const d1Big = bigMath.bignumber(d1);
            const dSumBig = bigMath.bignumber(d1 + d2);
            const m = bigMath.add(L, bigMath.multiply(bigMath.divide(d1Big, dSumBig), h));
            modeX = m as any;
            hasModeX = true;
            
            const formatDisp = (val: any) => bigMath.format(val, { notation: 'fixed', precision: 7 }).replace(/\\.?0+$/, '');
            
            modeStepsX = [
              \`Nhóm chứa mốt: \${groups[modalGroupIndex].range}\`,
              \`L (Giới hạn dưới) = \${formatDisp(L)}\`,
              \`h (Độ rộng) = \${formatDisp(h)}\`,
              \`f_m (Tần số nhóm mốt) = \${f_m}\`,
              \`f_{m-1} (Tần số nhóm trước) = \${f_m_minus_1}\`,
              \`f_{m+1} (Tần số nhóm sau) = \${f_m_plus_1}\`,
              \`d1 = f_m - f_{m-1} = \${d1}\`,
              \`d2 = f_m - f_{m+1} = \${d2}\`,
              \`M_o = L + (d1 / (d1 + d2)) * h = \${formatDisp(L)} + (\${d1} / \${d1 + d2}) * \${formatDisp(h)} = \${formatDisp(m)}\`
            ];
          }
        }`;

content = content.replace(oldMode, newMode);

// Also need to fix the quartile steps formatting
const oldQSteps = `          groupedQuartiles = {
            steps: [
              \`Vị trí Q1: \${gQ1.target}\`,
              \`Nhóm chứa Q1: \${gQ1.group}\`,
              \`Q1 = \${gQ1.L} + ((\${gQ1.target} - \${gQ1.prevCf}) / \${gQ1.f}) * \${gQ1.h} = \${parseFloat(q1X.toString()).toFixed(4)}\`,
              \`\`,
              \`Vị trí Q2 (Trung vị): \${gQ2.target}\`,
              \`Nhóm chứa Q2: \${gQ2.group}\`,
              \`Q2 = \${gQ2.L} + ((\${gQ2.target} - \${gQ2.prevCf}) / \${gQ2.f}) * \${gQ2.h} = \${parseFloat(medianX.toString()).toFixed(4)}\`,
              \`\`,
              \`Vị trí Q3: \${gQ3.target}\`,
              \`Nhóm chứa Q3: \${gQ3.group}\`,
              \`Q3 = \${gQ3.L} + ((\${gQ3.target} - \${gQ3.prevCf}) / \${gQ3.f}) * \${gQ3.h} = \${parseFloat(q3X.toString()).toFixed(4)}\`
            ]
          };`;

const newQSteps = `          const formatDisp = (val: any) => bigMath.format(val, { notation: 'fixed', precision: 7 }).replace(/\\.?0+$/, '');
          groupedQuartiles = {
            steps: [
              \`Vị trí Q1: \${gQ1.target}\`,
              \`Nhóm chứa Q1: \${gQ1.group}\`,
              \`Q1 = \${formatDisp(gQ1.L)} + ((\${gQ1.target} - \${gQ1.prevCf}) / \${gQ1.f}) * \${formatDisp(gQ1.h)} = \${formatDisp(q1X)}\`,
              \`\`,
              \`Vị trí Q2 (Trung vị): \${gQ2.target}\`,
              \`Nhóm chứa Q2: \${gQ2.group}\`,
              \`Q2 = \${formatDisp(gQ2.L)} + ((\${gQ2.target} - \${gQ2.prevCf}) / \${gQ2.f}) * \${formatDisp(gQ2.h)} = \${formatDisp(medianX)}\`,
              \`\`,
              \`Vị trí Q3: \${gQ3.target}\`,
              \`Nhóm chứa Q3: \${gQ3.group}\`,
              \`Q3 = \${formatDisp(gQ3.L)} + ((\${gQ3.target} - \${gQ3.prevCf}) / \${gQ3.f}) * \${formatDisp(gQ3.h)} = \${formatDisp(q3X)}\`
            ]
          };`;

content = content.replace(oldQSteps, newQSteps);

fs.writeFileSync('src/App.tsx', content);
