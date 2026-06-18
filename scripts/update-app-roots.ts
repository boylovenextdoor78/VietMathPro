import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const oldRootsRender = `                    {(result.refinedRoots || result.roots).map((r: any, idx: number) => (
                      <div key={idx} className="p-3 border border-white/5 bg-white/5 space-y-1">
                        <div className="font-mono text-[8px] opacity-40 uppercase tracking-widest">x_{idx+1}</div>
                        <div className="font-serif italic text-sm">
                          {typeof r === 'number' ? formatRoot(r) : r}
                        </div>
                      </div>
                    ))}`;

const newRootsRender = `                    {(result.refinedRoots || result.roots).map((r: any, idx: number) => {
                      const isDecimal = typeof r === 'object' && r !== null && typeof r.toNumber === 'function';
                      const isNumber = typeof r === 'number';
                      const displayVal = isDecimal || isNumber ? formatRoot(r) : r;
                      const fullVal = isDecimal ? r.toFixed(25) : isNumber ? r.toString() : r;
                      
                      return (
                        <div key={idx} className="p-3 border border-white/5 bg-white/5 space-y-1" title={fullVal}>
                          <div className="font-mono text-[8px] opacity-40 uppercase tracking-widest">x_{idx+1}</div>
                          <div className="font-serif italic text-sm">
                            {displayVal}
                          </div>
                        </div>
                      );
                    })}`;

content = content.replace(oldRootsRender, newRootsRender);

fs.writeFileSync('src/App.tsx', content);
