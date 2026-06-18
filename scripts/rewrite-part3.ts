import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Replace the table header
const oldTableHeader = `                <tr>
                  <th className="p-2 text-left border-r border-white/10 w-12">STT</th>
                  <th className="p-2 text-left border-r border-white/10">Giá trị X</th>
                  {isBivariate && <th className="p-2 text-left border-r border-white/10">Giá trị Y</th>}
                  {showFreq && <th className="p-2 text-left">FREQ</th>}
                </tr>`;

const newTableHeader = `                <tr>
                  <th className="p-2 text-left border-r border-white/10 w-12">STT</th>
                  {showGrouping ? (
                    <>
                      <th className="p-2 text-left border-r border-white/10">[FROM</th>
                      <th className="p-2 text-left border-r border-white/10">TO)</th>
                    </>
                  ) : (
                    <th className="p-2 text-left border-r border-white/10">Giá trị X</th>
                  )}
                  {isBivariate && !showGrouping && <th className="p-2 text-left border-r border-white/10">Giá trị Y</th>}
                  {showFreq && <th className="p-2 text-left">FREQ</th>}
                </tr>`;

content = content.replace(oldTableHeader, newTableHeader);

// 2. Replace the table body
const oldTableBody = `                    <td className="p-0 border-r border-[#141414]/10">
                      <input 
                        type="text"
                        value={row.x}
                        onChange={(e) => updateRow(idx, 'x', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, 'x')}
                        data-row={idx}
                        data-col="x"
                        className="w-full p-2 bg-transparent focus:bg-white focus:ring-0 border-none font-mono"
                        style={{ fontSize: \`\${fontSize}px\` }}
                      />
                    </td>
                    {isBivariate && (
                      <td className="p-0 border-r border-[#141414]/10">
                        <input 
                          type="text"
                          value={row.y}
                          onChange={(e) => updateRow(idx, 'y', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, 'y')}
                          data-row={idx}
                          data-col="y"
                          className="w-full p-2 bg-transparent focus:bg-white focus:ring-0 border-none font-mono"
                          style={{ fontSize: \`\${fontSize}px\` }}
                        />
                      </td>
                    )}
                    {showFreq && (
                      <td className="p-0">
                        <input 
                          type="text"
                          value={row.x.trim() !== '' ? row.f : ''}
                          onChange={(e) => updateRow(idx, 'f', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, 'f')}
                          placeholder={row.x.trim() !== '' ? '1' : ''}
                          data-row={idx}
                          data-col="f"
                          className="w-full p-2 bg-transparent focus:bg-white focus:ring-0 border-none font-mono text-blue-600 font-bold"
                          style={{ fontSize: \`\${fontSize}px\` }}
                        />
                      </td>
                    )}`;

const newTableBody = `                    {showGrouping ? (
                      <>
                        <td className="p-0 border-r border-[#141414]/10">
                          <input 
                            type="text"
                            value={row.from ?? ''}
                            onChange={(e) => updateRow(idx, 'from', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx, 'from')}
                            data-row={idx}
                            data-col="from"
                            className="w-full p-2 bg-transparent focus:bg-white focus:ring-0 border-none font-mono"
                            style={{ fontSize: \`\${fontSize}px\` }}
                          />
                        </td>
                        <td className="p-0 border-r border-[#141414]/10">
                          <input 
                            type="text"
                            value={row.to ?? ''}
                            onChange={(e) => updateRow(idx, 'to', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx, 'to')}
                            data-row={idx}
                            data-col="to"
                            className="w-full p-2 bg-transparent focus:bg-white focus:ring-0 border-none font-mono"
                            style={{ fontSize: \`\${fontSize}px\` }}
                          />
                        </td>
                      </>
                    ) : (
                      <td className="p-0 border-r border-[#141414]/10">
                        <input 
                          type="text"
                          value={row.x}
                          onChange={(e) => updateRow(idx, 'x', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, 'x')}
                          data-row={idx}
                          data-col="x"
                          className="w-full p-2 bg-transparent focus:bg-white focus:ring-0 border-none font-mono"
                          style={{ fontSize: \`\${fontSize}px\` }}
                        />
                      </td>
                    )}
                    {isBivariate && !showGrouping && (
                      <td className="p-0 border-r border-[#141414]/10">
                        <input 
                          type="text"
                          value={row.y}
                          onChange={(e) => updateRow(idx, 'y', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, 'y')}
                          data-row={idx}
                          data-col="y"
                          className="w-full p-2 bg-transparent focus:bg-white focus:ring-0 border-none font-mono"
                          style={{ fontSize: \`\${fontSize}px\` }}
                        />
                      </td>
                    )}
                    {showFreq && (
                      <td className="p-0">
                        <input 
                          type="text"
                          value={((showGrouping && row.from?.trim() !== '') || (!showGrouping && row.x.trim() !== '')) ? row.f : ''}
                          onChange={(e) => updateRow(idx, 'f', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, 'f')}
                          placeholder={((showGrouping && row.from?.trim() !== '') || (!showGrouping && row.x.trim() !== '')) ? '1' : ''}
                          data-row={idx}
                          data-col="f"
                          className="w-full p-2 bg-transparent focus:bg-white focus:ring-0 border-none font-mono text-blue-600 font-bold"
                          style={{ fontSize: \`\${fontSize}px\` }}
                        />
                      </td>
                    )}`;

content = content.replace(oldTableBody, newTableBody);

// 3. Replace the Grouping Config UI
const oldGroupingConfig = `          {/* Grouping Config */}
          {showGrouping && (
            <div className="p-6 border border-[#141414] space-y-4 animate-in slide-in-from-top-2">
              <h3 className="font-mono text-[10px] uppercase tracking-widest opacity-40 flex items-center gap-2">
                <Settings2 className="w-3 h-3" />
                Cấu hình chia nhóm
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase opacity-50">Bắt đầu</label>
                  <input 
                    type="text"
                    placeholder="Min"
                    value={groupConfig.start}
                    onChange={e => setGroupConfig({...groupConfig, start: e.target.value})}
                    className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase opacity-50">Kết thúc</label>
                  <input 
                    type="text"
                    placeholder="Max"
                    value={groupConfig.end}
                    onChange={e => setGroupConfig({...groupConfig, end: e.target.value})}
                    className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase opacity-50">Khoảng chia (Step)</label>
                  <input 
                    type="text"
                    placeholder="Tùy chọn"
                    value={groupConfig.step}
                    onChange={e => setGroupConfig({...groupConfig, step: e.target.value})}
                    className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase opacity-50">Số nhóm (Count)</label>
                  <input 
                    type="text"
                    placeholder="Mặc định: 5"
                    value={groupConfig.count}
                    onChange={e => setGroupConfig({...groupConfig, count: e.target.value})}
                    className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                  />
                </div>
              </div>
            </div>
          )}`;

const newGroupingConfig = `          {/* Grouping Config */}
          {showGrouping && (
            <div className="p-6 border border-[#141414] space-y-4 animate-in slide-in-from-top-2">
              <h3 className="font-mono text-[10px] uppercase tracking-widest opacity-40 flex items-center gap-2">
                <Settings2 className="w-3 h-3" />
                Cấu hình chia nhóm
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase opacity-50">Bắt đầu</label>
                  <input 
                    type="text"
                    placeholder="Start"
                    value={groupConfig.start}
                    onChange={e => setGroupConfig({...groupConfig, start: e.target.value})}
                    onKeyDown={e => { if (e.key === 'Enter') generateGroupTable(); }}
                    className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase opacity-50">Khoảng chia</label>
                  <input 
                    type="text"
                    placeholder="Step"
                    value={groupConfig.step}
                    onChange={e => setGroupConfig({...groupConfig, step: e.target.value})}
                    onKeyDown={e => { if (e.key === 'Enter') generateGroupTable(); }}
                    className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase opacity-50">Số nhóm</label>
                  <select
                    value={groupConfig.count}
                    onChange={e => setGroupConfig({...groupConfig, count: e.target.value})}
                    onKeyDown={e => { if (e.key === 'Enter') generateGroupTable(); }}
                    className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0 bg-transparent"
                  >
                    {Array.from({length: 19}, (_, i) => i + 2).map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button 
                onClick={generateGroupTable}
                className="w-full p-2 bg-[#141414] text-white font-mono text-[10px] uppercase tracking-widest hover:bg-teal-900 transition-colors"
              >
                Tạo bảng ghép nhóm
              </button>
            </div>
          )}`;

content = content.replace(oldGroupingConfig, newGroupingConfig);

fs.writeFileSync('src/App.tsx', content);
