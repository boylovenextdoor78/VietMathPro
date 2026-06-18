import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const oldRender = `                  <div className="text-3xl md:text-4xl font-serif italic leading-relaxed">
                    {showNumeric ? result.numeric : result.symbolic}
                  </div>`;

const newRender = `                  <div className="text-3xl md:text-4xl font-serif italic leading-relaxed">
                    {(() => {
                      const displayStr = showNumeric ? result.numeric : result.symbolic;
                      const rootMap = new Map<string, string>();
                      const rootsList = result.refinedRoots || result.roots;
                      
                      if (!rootsList || rootsList.length === 0) return displayStr;
                      
                      rootsList.forEach((r: any) => {
                        const isDecimal = typeof r === 'object' && r !== null && typeof r.toNumber === 'function';
                        const isNumber = typeof r === 'number';
                        const shortVal = isDecimal || isNumber ? formatRoot(r) : r;
                        const fullVal = isDecimal ? r.toFixed(25) : isNumber ? r.toString() : r;
                        rootMap.set(shortVal, fullVal);
                      });

                      const sortedRoots = Array.from(rootMap.keys()).sort((a, b) => b.length - a.length);
                      if (sortedRoots.length === 0) return displayStr;

                      const escapedRoots = sortedRoots.map(r => r.replace(/[.*+?^$\{()|[\\]\\\\]/g, '\\\\$&'));
                      const regex = new RegExp(\`(\${escapedRoots.join('|')})\`, 'g');
                      
                      const parts = displayStr.split(regex);
                      
                      return parts.map((part: string, i: number) => {
                        if (rootMap.has(part)) {
                          const fullVal = rootMap.get(part)!;
                          return (
                            <span key={i} className="group relative inline-block cursor-pointer mx-0.5" onClick={() => navigator.clipboard.writeText(fullVal)}>
                              <span className="border-b border-dashed border-white/30 hover:text-rose-300 transition-colors">
                                {part}
                              </span>
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                <span className="bg-[#E4E3E0] text-[#141414] text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap font-bold font-sans not-italic">
                                  {fullVal} (Click to copy)
                                </span>
                              </span>
                            </span>
                          );
                        }
                        return <span key={i}>{part}</span>;
                      });
                    })()}
                  </div>`;

content = content.replace(oldRender, newRender);

fs.writeFileSync('src/App.tsx', content);
