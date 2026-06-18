import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add generateGroupTable function
const generateGroupTableFunc = `
  const generateGroupTable = () => {
    const bigMath25 = math.create(math.all, { number: 'BigNumber', precision: 25 });
    
    let boundaries: any[] = [];

    if (groupConfig.method === 'basic') {
      const start = parseFloat(groupConfig.start);
      const step = parseFloat(groupConfig.step);
      const count = parseInt(groupConfig.count);

      if (isNaN(start) || isNaN(step) || isNaN(count) || count <= 0 || step <= 0) {
        setError("Vui lòng nhập đúng Bắt đầu, Khoảng chia (>0) và Số nhóm (>0)");
        return;
      }

      let currentStart = bigMath25.bignumber(start);
      const bigStep = bigMath25.bignumber(step);
      
      boundaries.push(currentStart);
      for (let i = 0; i < count; i++) {
        currentStart = bigMath25.add(currentStart, bigStep) as any;
        boundaries.push(currentStart);
      }
    } else {
      // Decision Tree or Random Forest
      const rawData: number[] = [];
      rows.forEach(r => {
        if (r.x && r.x.trim() !== '') {
          const xVal = parseFloat(r.x);
          const fVal = r.f && r.f.trim() !== '' ? parseInt(r.f) : 1;
          if (!isNaN(xVal) && !isNaN(fVal) && fVal > 0) {
            for (let i = 0; i < fVal; i++) rawData.push(xVal);
          }
        }
      });

      if (rawData.length === 0) {
        setError("Vui lòng nhập dữ liệu gốc vào cột X trước khi ghép nhóm bằng Cây quyết định / Random Forest");
        return;
      }

      const maxDepth = parseInt(groupConfig.maxDepth) || 3;
      const minSamples = parseInt(groupConfig.minSamples) || 2;

      const getSplits = (data: number[], depth: number): number[] => {
        if (depth >= maxDepth || data.length < minSamples) return [];
        
        let bestSplit = -1;
        let minSSE = Infinity;
        
        const sorted = [...data].sort((a, b) => a - b);
        const uniqueVals = Array.from(new Set(sorted));
        
        if (uniqueVals.length < 2) return [];

        for (let i = 0; i < uniqueVals.length - 1; i++) {
          const split = (uniqueVals[i] + uniqueVals[i+1]) / 2;
          const L = sorted.filter(x => x < split);
          const R = sorted.filter(x => x >= split);
          
          if (L.length === 0 || R.length === 0) continue;

          const meanL = L.reduce((a, b) => a + b, 0) / L.length;
          const meanR = R.reduce((a, b) => a + b, 0) / R.length;
          
          const sseL = L.reduce((a, b) => a + Math.pow(b - meanL, 2), 0);
          const sseR = R.reduce((a, b) => a + Math.pow(b - meanR, 2), 0);
          const sse = sseL + sseR;
          
          if (sse < minSSE) {
            minSSE = sse;
            bestSplit = split;
          }
        }
        
        if (bestSplit === -1) return [];
        
        const L = sorted.filter(x => x < bestSplit);
        const R = sorted.filter(x => x >= bestSplit);
        
        return [
          bestSplit,
          ...getSplits(L, depth + 1),
          ...getSplits(R, depth + 1)
        ];
      };

      let splits: number[] = [];

      if (groupConfig.method === 'dt') {
        splits = getSplits(rawData, 0);
      } else if (groupConfig.method === 'rf') {
        const nEstimators = parseInt(groupConfig.nEstimators) || 10;
        const allSplits: number[] = [];
        for (let i = 0; i < nEstimators; i++) {
          const sample = Array.from({length: rawData.length}, () => rawData[Math.floor(Math.random() * rawData.length)]);
          allSplits.push(...getSplits(sample, 0));
        }
        
        if (allSplits.length > 0) {
           allSplits.sort((a, b) => a - b);
           const threshold = (Math.max(...rawData) - Math.min(...rawData)) / 20;
           let currentCluster = [allSplits[0]];
           const consensusSplits = [];
           for (let i = 1; i < allSplits.length; i++) {
             if (allSplits[i] - currentCluster[currentCluster.length - 1] < threshold) {
               currentCluster.push(allSplits[i]);
             } else {
               consensusSplits.push(currentCluster.reduce((a, b) => a + b, 0) / currentCluster.length);
               currentCluster = [allSplits[i]];
             }
           }
           consensusSplits.push(currentCluster.reduce((a, b) => a + b, 0) / currentCluster.length);
           splits = consensusSplits;
        }
      }

      splits = Array.from(new Set(splits)).sort((a, b) => a - b);
      
      const minVal = Math.min(...rawData);
      const maxVal = Math.max(...rawData);
      
      boundaries = [bigMath25.bignumber(minVal)];
      splits.forEach(s => {
        if (s > minVal && s < maxVal) boundaries.push(bigMath25.bignumber(s));
      });
      const padding = (maxVal - minVal) * 0.01 || 1;
      boundaries.push(bigMath25.bignumber(maxVal + padding));
    }

    const newRows = [];
    
    const rawData: number[] = [];
    rows.forEach(r => {
      if (r.x && r.x.trim() !== '') {
        const xVal = parseFloat(r.x);
        const fVal = r.f && r.f.trim() !== '' ? parseInt(r.f) : 1;
        if (!isNaN(xVal) && !isNaN(fVal) && fVal > 0) {
          for (let i = 0; i < fVal; i++) rawData.push(xVal);
        }
      }
    });

    const formatTruncate = (val: any) => {
      const str = bigMath25.format(val, { notation: 'fixed', precision: 25 });
      return str; // Keep 25 digits internally
    };

    for (let i = 0; i < boundaries.length - 1; i++) {
      const from = boundaries[i];
      const to = boundaries[i+1];
      
      let freq = 0;
      if (rawData.length > 0) {
         freq = rawData.filter(x => {
           const bx = bigMath25.bignumber(x);
           return bigMath25.largerEq(bx, from) && bigMath25.smaller(bx, to);
         }).length;
      }

      newRows.push({
        x: '', y: '', 
        f: freq > 0 ? freq.toString() : '1',
        from: formatTruncate(from),
        to: formatTruncate(to)
      });
    }
    
    while (newRows.length < maxRows) {
      newRows.push({ x: '', y: '', f: '1', from: '', to: '' });
    }

    setRows(newRows);
    setPendingGrouping(false);
    setError(null);
    setShowFreq(true); // Auto enable freq for grouped data
  };
`;

content = content.replace('const runStats = () => {', generateGroupTableFunc + '\n\n  const runStats = () => {');

// 2. Replace Grouping Config UI
const groupingConfigUI = `
          {/* Grouping Config */}
          {showGrouping && (
            <div className="p-6 border border-[#141414] space-y-4 animate-in slide-in-from-top-2">
              <h3 className="font-mono text-[10px] uppercase tracking-widest opacity-40 flex items-center gap-2">
                <Settings2 className="w-3 h-3" />
                Cấu hình chia nhóm
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-[9px] font-mono uppercase opacity-50">Phương pháp</label>
                  <select 
                    value={groupConfig.method}
                    onChange={e => setGroupConfig({...groupConfig, method: e.target.value})}
                    className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0 bg-white"
                  >
                    <option value="basic">Ghép nhóm căn bản</option>
                    <option value="dt">Cây quyết định (Decision Tree)</option>
                    <option value="rf">Random Forest</option>
                  </select>
                </div>

                {groupConfig.method === 'basic' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase opacity-50">Bắt đầu (Start)</label>
                      <input 
                        type="text"
                        placeholder="Giá trị bắt đầu"
                        value={groupConfig.start}
                        onChange={e => setGroupConfig({...groupConfig, start: e.target.value})}
                        className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase opacity-50">Khoảng cách (Dist)</label>
                      <input 
                        type="text"
                        placeholder="Khoảng cách"
                        value={groupConfig.step}
                        onChange={e => setGroupConfig({...groupConfig, step: e.target.value})}
                        className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase opacity-50">Số nhóm (Groups)</label>
                      <select 
                        value={groupConfig.count}
                        onChange={e => setGroupConfig({...groupConfig, count: e.target.value})}
                        className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0 bg-white"
                      >
                        {Array.from({length: 20}, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>{n} nhóm</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {(groupConfig.method === 'dt' || groupConfig.method === 'rf') && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase opacity-50">Max Depth</label>
                      <input 
                        type="number"
                        placeholder="3"
                        value={groupConfig.maxDepth}
                        onChange={e => setGroupConfig({...groupConfig, maxDepth: e.target.value})}
                        className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase opacity-50">Min Samples</label>
                      <input 
                        type="number"
                        placeholder="2"
                        value={groupConfig.minSamples}
                        onChange={e => setGroupConfig({...groupConfig, minSamples: e.target.value})}
                        className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                      />
                    </div>
                  </>
                )}

                {groupConfig.method === 'rf' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase opacity-50">N Estimators</label>
                    <input 
                      type="number"
                      placeholder="10"
                      value={groupConfig.nEstimators}
                      onChange={e => setGroupConfig({...groupConfig, nEstimators: e.target.value})}
                      className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                    />
                  </div>
                )}

                <div className="col-span-2 mt-2">
                  <button 
                    onClick={generateGroupTable}
                    className="w-full bg-[#141414] text-white p-2 font-mono text-xs uppercase tracking-widest hover:bg-black transition-colors"
                  >
                    Tạo bảng ghép nhóm
                  </button>
                </div>
              </div>
            </div>
          )}
`;

const oldGroupingConfigRegex = /\{\/\* Grouping Config \*\/\}.*?\{\/\* Results Display Area was moved up \*\/\}/s;
content = content.replace(oldGroupingConfigRegex, groupingConfigUI + '\n\n          {/* Results Display Area was moved up */}');

fs.writeFileSync('src/App.tsx', content);
