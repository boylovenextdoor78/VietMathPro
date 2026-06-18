import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const oldGroupLoop = `        validRows.forEach((r, i) => {
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
          const bf = bigMath.bignumber(count);`;

const newGroupLoop = `        validRows.forEach((r, i) => {
          const L = bigMath.bignumber(r.from!);
          const U = bigMath.bignumber(r.to!);
          const fStr = r.f.trim();
          const count = showFreq ? Math.max(1, Math.round(parseFloat(fStr) || 1)) : 1;
          
          totalFreq += count;
          currentCf += count;
          rowCount++;
          
          const displayL = r.from!.length > 10 ? (Math.trunc(parseFloat(r.from!) * 1e7) / 1e7).toString() : r.from;
          const displayU = r.to!.length > 10 ? (Math.trunc(parseFloat(r.to!) * 1e7) / 1e7).toString() : r.to;
          
          groups.push({ range: \`[\${displayL} - \${displayU})\`, count, cf: currentCf, L, U });
          
          if (count > maxFreq) {
            maxFreq = count;
            modalGroupIndex = i;
          }
          
          const c = bigMath.divide(bigMath.add(L, U), 2);
          const bf = bigMath.bignumber(count);`;

content = content.replace(oldGroupLoop, newGroupLoop);

fs.writeFileSync('src/App.tsx', content);
