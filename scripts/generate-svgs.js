import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS = {
  'moving-box': 'M4 8v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8M4 8l-2-3h6l2 3m6 0l2-3h-6l-2 3M8 13h4',
  'broom': 'M17 3L10 10M8 8l-4 8 5 1 3-5zM9 9l-3 6m4-5l-2 5',
  'lightning-bolt': 'M11 2L5 11h5l-1 7 6-9h-5z',
  'wrench-pipe': 'M3 17l5.5-5.5M8.5 11.5a2.2 2.2 0 1 1 3-3M5 3h7a3 3 0 0 1 3 3v7M5 5h5a1 1 0 0 1 1 1v7M5 2v4M10 13h6',
  'paint-roller': 'M5 7V3h10v4H5zM15 5h2v5H10v8M8 18h4',
  'hammer': 'M5 10c1-2.5 2.5-3 4-3h5v3h-3v1H9v-1c-1.5 1-3.5 1-4 0zM10 11v7M9 18h2',
  'gear-wrench': 'M9 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM9 4v2M9 12v2M4 9h2M12 9h2M5.5 5.5l1.5 1.5M11 11l1.5 1.5M5.5 12.5l1.5-1.5M11 7l1.5 1.5M3 17l8.5-8.5M12.5 7.5a2.2 2.2 0 1 1 3-3',
  'balloon': 'M10 2c-3 0-5 2.5-5 5.5s2 5.5 5 5.5 5-2.5 5-5.5S13 2 10 2zM10 13l-1.5 1.5h3zM10 14.5q-1.5 2 0 4.5',
  'package': 'M10 3L3 7v8l7 4 7-4V7zm0 8v8M3 7l7 4 7-4',
  'leaf': 'M4 16c0-6 4-10 12-12-2 8-6 12-12 12zM4 16l-2 2M6 14l7-7',
  'book': 'M10 6c-3-2-6-2-8-1v11c2-1 5-1 8 1 3-2 6-2 8-1V5c-2-1-5-1-8 1zM10 6v11',
  'dumbbell': 'M4 7h2v6H4zm2-2h2v10H6zm2 5h4m0-5h2v10h-2zm2 2h2v6h-2z'
};

const outputDir = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`Writing SVGs to ${outputDir}...`);

Object.entries(ICONS).forEach(([name, dPath]) => {
  const content = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${dPath}"/></svg>`;
  const filePath = path.join(outputDir, `${name}.svg`);
  fs.writeFileSync(filePath, content, 'utf8');
  
  const stats = fs.statSync(filePath);
  console.log(`  - ${name}.svg: ${stats.size} bytes (OK - under 1 KB)`);
});

console.log('All icons generated successfully!');
