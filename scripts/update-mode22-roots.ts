import * as fs from 'fs';

let content = fs.readFileSync('src/components/Mode22.tsx', 'utf-8');

const oldResultRender = `          <div className="bg-rose-600/10 border border-rose-500/20 rounded-xl p-6 text-center">
            <h3 className="font-serif italic text-xl text-rose-400 mb-2">Final Solution</h3>
            <p className="font-mono text-2xl break-all">{result.finalSolution}</p>
          </div>
        </div>`;

const newResultRender = `          <div className="bg-rose-600/10 border border-rose-500/20 rounded-xl p-6 text-center">
            <h3 className="font-serif italic text-xl text-rose-400 mb-2">Final Solution</h3>
            <p className="font-mono text-2xl break-all">{result.finalSolution}</p>
          </div>

          <div className="w-full pt-8 border-t border-white/10">
            <p className="text-[9px] font-mono opacity-40 uppercase tracking-widest mb-4">Roots (Critical Points)</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {result.criticalPoints.map((cp, idx) => {
                const isDecimal = cp.exactVal && typeof cp.exactVal === 'object' && typeof cp.exactVal.toNumber === 'function';
                const isNumber = typeof cp.exactVal === 'number' || typeof cp.val === 'number';
                const fullVal = isDecimal ? cp.exactVal.toFixed(25) : isNumber ? (cp.exactVal || cp.val).toString() : cp.str;
                
                return (
                  <div key={idx} className="p-3 border border-white/5 bg-white/5 space-y-1" title={fullVal}>
                    <div className="font-mono text-[8px] opacity-40 uppercase tracking-widest">x_{idx+1}</div>
                    <div className="font-serif italic text-sm">
                      {cp.str}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>`;

content = content.replace(oldResultRender, newResultRender);

fs.writeFileSync('src/components/Mode22.tsx', content);
