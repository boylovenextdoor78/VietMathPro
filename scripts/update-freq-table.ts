import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add fr and cumFr to groups in runStats
const oldGroupLoopEnd = `          sumX3 = bigMath.add(sumX3, bigMath.multiply(bf, bigMath.pow(c, 3))) as any;
          sumX4 = bigMath.add(sumX4, bigMath.multiply(bf, bigMath.pow(c, 4))) as any;
        });`;

const newGroupLoopEnd = `          sumX3 = bigMath.add(sumX3, bigMath.multiply(bf, bigMath.pow(c, 3))) as any;
          sumX4 = bigMath.add(sumX4, bigMath.multiply(bf, bigMath.pow(c, 4))) as any;
        });
        
        let currentCumFr = 0;
        groups.forEach(g => {
          g.fr = g.count / totalFreq;
          currentCumFr += g.fr;
          g.cumFr = currentCumFr;
        });`;

content = content.replace(oldGroupLoopEnd, newGroupLoopEnd);

// 2. Update the Frequency Table UI
const oldFreqTableUI = `                      <div className="flex justify-between border-b border-white/10 py-1 font-mono text-[9px] opacity-50">
                        <span>Khoảng giá trị</span>
                        <div className="flex gap-4">
                          <span>Tần số (f)</span>
                          <span>Tích lũy (cf)</span>
                        </div>
                      </div>
                      {results.groups.map((g: any, i: number) => (
                        <div key={i} className="flex justify-between border-b border-white/5 py-1">
                          <span className="opacity-50">{g.range}</span>
                          <div className="flex gap-8">
                            <span className="font-bold">{g.count}</span>
                            <span className="font-bold text-teal-400">{g.cf}</span>
                          </div>
                        </div>
                      ))}`;

const newFreqTableUI = `                      <div className="grid grid-cols-5 gap-2 border-b border-white/10 py-1 font-mono text-[9px] opacity-50 text-right">
                        <span className="text-left">Khoảng giá trị</span>
                        <span>f</span>
                        <span>fr</span>
                        <span>F (cf)</span>
                        <span>Fr</span>
                      </div>
                      {results.groups.map((g: any, i: number) => (
                        <div key={i} className="grid grid-cols-5 gap-2 border-b border-white/5 py-1 text-right font-mono text-[10px]">
                          <span className="opacity-50 text-left">{g.range}</span>
                          <span className="font-bold">{g.count}</span>
                          <span className="text-teal-200">{(g.fr * 100).toFixed(2)}%</span>
                          <span className="font-bold text-teal-400">{g.cf}</span>
                          <span className="text-teal-500">{(g.cumFr * 100).toFixed(2)}%</span>
                        </div>
                      ))}`;

content = content.replace(oldFreqTableUI, newFreqTableUI);

// 3. Add formatDisplay to the input values in the table
const oldInputFrom = `                            <input 
                              type="text"
                              value={row.from ?? ''}`;
const newInputFrom = `                            <input 
                              type="text"
                              value={row.from ? (row.from.length > 10 ? parseFloat(row.from).toFixed(7).replace(/\\.?0+$/, '') : row.from) : ''}`;

const oldInputTo = `                            <input 
                              type="text"
                              value={row.to ?? ''}`;
const newInputTo = `                            <input 
                              type="text"
                              value={row.to ? (row.to.length > 10 ? parseFloat(row.to).toFixed(7).replace(/\\.?0+$/, '') : row.to) : ''}`;

content = content.replace(oldInputFrom, newInputFrom);
content = content.replace(oldInputTo, newInputTo);

fs.writeFileSync('src/App.tsx', content);
