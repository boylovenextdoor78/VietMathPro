import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const oldIntervalsRender = `                      {result.intervals.map((interval: any, i: number) => (
                        <div key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-sm font-mono text-xs">
                          {interval.startClosed ? '[' : '('}
                          {interval.start === -Infinity ? '-∞' : interval.start}
                          {', '}
                          {interval.end === Infinity ? '+∞' : interval.end}
                          {interval.endClosed ? ']' : ')'}
                        </div>
                      ))}`;

const newIntervalsRender = `                      {result.intervals.map((interval: any, i: number) => {
                        const startStr = interval.start === -Infinity ? '-∞' : formatRoot(interval.start);
                        const endStr = interval.end === Infinity ? '+∞' : formatRoot(interval.end);
                        return (
                          <div key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-sm font-mono text-xs">
                            {interval.startClosed ? '[' : '('}
                            {startStr}
                            {', '}
                            {endStr}
                            {interval.endClosed ? ']' : ')'}
                          </div>
                        );
                      })}`;

content = content.replace(oldIntervalsRender, newIntervalsRender);

fs.writeFileSync('src/App.tsx', content);
