import * as fs from 'fs';

let content = fs.readFileSync('src/lib/mathUtils.ts', 'utf-8');

// 1. Fix roots type
content = content.replace('const roots: number[] = [];', 'const roots: any[] = [];');

// 2. Fix testPoints type
content = content.replace('const testPoints: number[] = [];', 'const testPoints: any[] = [];');

// 3. Fix activeIntervals type
content = content.replace(
  'const activeIntervals: {start: number, end: number, startClosed: boolean, endClosed: boolean}[] = [];',
  'const activeIntervals: {start: any, end: any, startClosed: boolean, endClosed: boolean}[] = [];'
);

// 4. Fix interval parts type checking for Infinity
const oldMergedEnd = `const m0End = typeof merged[0].end === 'number' ? merged[0].end : merged[0].end.toNumber();`;
const newMergedEnd = `const m0End = (typeof merged[0].end === 'number' || merged[0].end === Infinity || merged[0].end === -Infinity) ? merged[0].end : merged[0].end.toNumber();`;
content = content.replace(oldMergedEnd, newMergedEnd);

const oldMergedStart = `const m1Start = typeof merged[1].start === 'number' ? merged[1].start : merged[1].start.toNumber();`;
const newMergedStart = `const m1Start = (typeof merged[1].start === 'number' || merged[1].start === Infinity || merged[1].start === -Infinity) ? merged[1].start : merged[1].start.toNumber();`;
content = content.replace(oldMergedStart, newMergedStart);

const oldCurrentEnd = `const currentEnd = typeof current.end === 'number' ? current.end : current.end.toNumber();`;
const newCurrentEnd = `const currentEnd = (typeof current.end === 'number' || current.end === Infinity || current.end === -Infinity) ? current.end : current.end.toNumber();`;
content = content.replace(oldCurrentEnd, newCurrentEnd);

const oldNextStart = `const nextStart = typeof next.start === 'number' ? next.start : next.start.toNumber();`;
const newNextStart = `const nextStart = (typeof next.start === 'number' || next.start === Infinity || next.start === -Infinity) ? next.start : next.start.toNumber();`;
content = content.replace(oldNextStart, newNextStart);

fs.writeFileSync('src/lib/mathUtils.ts', content);
