import * as fs from 'fs';

let content = fs.readFileSync('src/components/Mode22.tsx', 'utf-8');

const oldResultRender = `          <div className="bg-rose-600/10 border border-rose-500/20 rounded-xl p-6 text-center">
            <h3 className="font-serif italic text-xl text-rose-400 mb-2">Final Solution</h3>
            <p className="font-mono text-2xl break-all">{result.finalSolution}</p>
          </div>`;

const newResultRender = `          <div className="bg-rose-600/10 border border-rose-500/20 rounded-xl p-6 text-center">
            <h3 className="font-serif italic text-xl text-rose-400 mb-2">Final Solution</h3>
            <div className="font-mono text-2xl break-all leading-relaxed">
              {(() => {
                const rootMap = new Map<string, string>();
                result.criticalPoints.forEach(cp => {
                  const isDecimal = cp.exactVal && typeof cp.exactVal === 'object' && typeof cp.exactVal.toNumber === 'function';
                  const isNumber = typeof cp.exactVal === 'number' || typeof cp.val === 'number';
                  const fullVal = isDecimal ? cp.exactVal.toFixed(25) : isNumber ? (cp.exactVal || cp.val).toString() : cp.str;
                  rootMap.set(cp.str, fullVal);
                });

                const sortedRoots = Array.from(rootMap.keys()).sort((a, b) => b.length - a.length);
                
                if (sortedRoots.length === 0) {
                  return result.finalSolution;
                }

                const escapedRoots = sortedRoots.map(r => r.replace(/[.*+?^$\{()|[\\]\\\\]/g, '\\\\$&'));
                const regex = new RegExp(\`(\${escapedRoots.join('|')})\`, 'g');
                
                const parts = result.finalSolution.split(regex);
                
                return parts.map((part, i) => {
                  if (rootMap.has(part)) {
                    const fullVal = rootMap.get(part)!;
                    return (
                      <span key={i} className="group relative inline-block cursor-pointer mx-0.5" onClick={() => navigator.clipboard.writeText(fullVal)}>
                        <span className="border-b border-dashed border-rose-500/50 hover:text-rose-300 transition-colors">
                          {part}
                        </span>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                          <span className="bg-[#E4E3E0] text-[#141414] text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap font-bold">
                            {fullVal} (Click to copy)
                          </span>
                        </span>
                      </span>
                    );
                  }
                  return <span key={i}>{part}</span>;
                });
              })()}
            </div>
          </div>`;

content = content.replace(oldResultRender, newResultRender);

fs.writeFileSync('src/components/Mode22.tsx', content);
