import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Update DataRow interface
content = content.replace(
  /interface DataRow \{\n  x: string;\n  y: string;\n  f: string;\n\}/,
  `interface DataRow {\n  x: string;\n  y: string;\n  f: string;\n  from?: string;\n  to?: string;\n}`
);

// 2. Update initialRows
content = content.replace(
  /const initialRows = Array\(5\)\.fill\(null\)\.map\(\(\) => \(\{ x: '', y: '', f: '1' \}\)\);/,
  `const initialRows = Array(5).fill(null).map(() => ({ x: '', y: '', f: '1', from: '', to: '' }));`
);

// 3. Update groupConfig state
content = content.replace(
  /const \[groupConfig, setGroupConfig\] = useState\(\{ start: '', end: '', step: '', count: '5' \}\);/,
  `const [groupConfig, setGroupConfig] = useState({ start: '', step: '', count: '5' });`
);

// 4. Update updateRow
content = content.replace(
  /const updateRow = \(index: number, field: 'x' \| 'y' \| 'f', value: string\) => \{/,
  `const updateRow = (index: number, field: 'x' | 'y' | 'f' | 'from' | 'to', value: string) => {`
);
content = content.replace(
  /newRows\.push\(\{ x: '', y: '', f: '1' \}\);/,
  `newRows.push({ x: '', y: '', f: '1', from: '', to: '' });`
);

// 5. Update handleKeyDown
content = content.replace(
  /const handleKeyDown = \(e: React\.KeyboardEvent<HTMLInputElement>, index: number, field: 'x' \| 'y' \| 'f'\) => \{/,
  `const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number, field: 'x' | 'y' | 'f' | 'from' | 'to') => {`
);
const oldKeyLogic = `    let nextField = field;
    if (e.key === 'ArrowRight') {
      if (field === 'x' && isBivariate) nextField = 'y';
      else if (field === 'x' && !isBivariate && showFreq) nextField = 'f';
      else if (field === 'y' && showFreq) nextField = 'f';
    } else if (e.key === 'ArrowLeft') {
      if (field === 'f' && isBivariate) nextField = 'y';
      else if (field === 'f' && !isBivariate) nextField = 'x';
      else if (field === 'y') nextField = 'x';
    }`;
const newKeyLogic = `    let nextField = field;
    if (e.key === 'ArrowRight') {
      if (showGrouping) {
        if (field === 'from') nextField = 'to';
        else if (field === 'to' && showFreq) nextField = 'f';
      } else {
        if (field === 'x' && isBivariate) nextField = 'y';
        else if (field === 'x' && !isBivariate && showFreq) nextField = 'f';
        else if (field === 'y' && showFreq) nextField = 'f';
      }
    } else if (e.key === 'ArrowLeft') {
      if (showGrouping) {
        if (field === 'f') nextField = 'to';
        else if (field === 'to') nextField = 'from';
      } else {
        if (field === 'f' && isBivariate) nextField = 'y';
        else if (field === 'f' && !isBivariate) nextField = 'x';
        else if (field === 'y') nextField = 'x';
      }
    }`;
content = content.replace(oldKeyLogic, newKeyLogic);

// 6. Add generateGroupTable function
const generateGroupTableCode = `  const generateGroupTable = () => {
    const start = parseFloat(groupConfig.start);
    const step = parseFloat(groupConfig.step);
    const count = parseInt(groupConfig.count);
    
    if (!isNaN(start) && !isNaN(step) && !isNaN(count) && count >= 2 && count <= 20) {
      const newRows = [];
      for (let i = 0; i < count; i++) {
        newRows.push({
          x: '', y: '', f: '1',
          from: (start + i * step).toString(),
          to: (start + (i + 1) * step).toString()
        });
      }
      setRows(newRows);
    }
  };

  const calculateStats = () => {`;
content = content.replace(/  const calculateStats = \(\) => \{/, generateGroupTableCode);

fs.writeFileSync('src/App.tsx', content);
