import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const oldQuartileSteps = `          groupedQuartiles = {
            q1: gQ1,
            q2: gQ2,
            q3: gQ3,
            steps: [
              \`Q1: Nhóm chứa Q1 là \${gQ1.group} (vị trí n/4 = \${gQ1.target.toFixed(2)}). Q1 = \${gQ1.L} + ((\${gQ1.target.toFixed(2)} - \${gQ1.prevCf}) / \${gQ1.f}) * \${gQ1.h.toFixed(2)} = \${gQ1.value.toFixed(4)}\`,
              \`Q2: Nhóm chứa Q2 là \${gQ2.group} (vị trí n/2 = \${gQ2.target.toFixed(2)}). Q2 = \${gQ2.L} + ((\${gQ2.target.toFixed(2)} - \${gQ2.prevCf}) / \${gQ2.f}) * \${gQ2.h.toFixed(2)} = \${gQ2.value.toFixed(4)}\`,
              \`Q3: Nhóm chứa Q3 là \${gQ3.group} (vị trí 3n/4 = \${gQ3.target.toFixed(2)}). Q3 = \${gQ3.L} + ((\${gQ3.target.toFixed(2)} - \${gQ3.prevCf}) / \${gQ3.f}) * \${gQ3.h.toFixed(2)} = \${gQ3.value.toFixed(4)}\`
            ]
          };`;

const newQuartileSteps = `          const formatDisp = (val: any) => {
            const str = bigMath.format(val, { notation: 'fixed', precision: 25 });
            const parts = str.split('.');
            if (parts.length === 1) return str;
            const truncated = parts[0] + '.' + parts[1].substring(0, 7);
            return truncated.replace(/\\.?0+$/, '');
          };
          groupedQuartiles = {
            q1: gQ1,
            q2: gQ2,
            q3: gQ3,
            steps: [
              \`Q1: Nhóm chứa Q1 là \${gQ1.group} (vị trí n/4 = \${gQ1.target}). Q1 = \${formatDisp(gQ1.L)} + ((\${gQ1.target} - \${gQ1.prevCf}) / \${gQ1.f}) * \${formatDisp(gQ1.h)} = \${formatDisp(gQ1.value)}\`,
              \`Q2: Nhóm chứa Q2 là \${gQ2.group} (vị trí n/2 = \${gQ2.target}). Q2 = \${formatDisp(gQ2.L)} + ((\${gQ2.target} - \${gQ2.prevCf}) / \${gQ2.f}) * \${formatDisp(gQ2.h)} = \${formatDisp(gQ2.value)}\`,
              \`Q3: Nhóm chứa Q3 là \${gQ3.group} (vị trí 3n/4 = \${gQ3.target}). Q3 = \${formatDisp(gQ3.L)} + ((\${gQ3.target} - \${gQ3.prevCf}) / \${gQ3.f}) * \${formatDisp(gQ3.h)} = \${formatDisp(gQ3.value)}\`
            ]
          };`;

content = content.replace(oldQuartileSteps, newQuartileSteps);

const oldMode = `        // Calculate Mode for grouped data
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
        }`;

const newMode = `        // Calculate Mode for grouped data
        if (modalGroupIndex !== -1) {
          const m_p = groups[modalGroupIndex].count;
          const m_prev = modalGroupIndex > 0 ? groups[modalGroupIndex - 1].count : 0;
          const m_next = modalGroupIndex < groups.length - 1 ? groups[modalGroupIndex + 1].count : 0;
          const L = groups[modalGroupIndex].L;
          const U = groups[modalGroupIndex].U;
          const h = bigMath.subtract(U, L);
          
          const d1 = m_p - m_prev;
          const d2 = m_p - m_next;
          
          if (d1 + d2 > 0) {
            const d1Big = bigMath.bignumber(d1);
            const dSumBig = bigMath.bignumber(d1 + d2);
            const mo = bigMath.add(L, bigMath.multiply(bigMath.divide(d1Big, dSumBig), h));
            modeX = mo as any;
            hasModeX = true;
            
            const formatDisp = (val: any) => {
              const str = bigMath.format(val, { notation: 'fixed', precision: 25 });
              const parts = str.split('.');
              if (parts.length === 1) return str;
              const truncated = parts[0] + '.' + parts[1].substring(0, 7);
              return truncated.replace(/\\.?0+$/, '');
            };
            
            modeStepsX = [
              \`Nhóm chứa mốt là \${groups[modalGroupIndex].range} với tần số lớn nhất m_p = \${m_p}\`,
              \`M_o = \${formatDisp(L)} + ((\${m_p} - \${m_prev}) / ((\${m_p} - \${m_prev}) + (\${m_p} - \${m_next}))) * \${formatDisp(h)} = \${formatDisp(mo)}\`
            ];
          }
        }`;

content = content.replace(oldMode, newMode);

fs.writeFileSync('src/App.tsx', content);
