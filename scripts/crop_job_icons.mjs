import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join } from 'path';

const imagePath = 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\52c152e8-bc93-420d-8924-eb586c20fafe\\media__1782926476283.jpg';
const outputDir = 'f:\\jobink\\src\\assets\\job-icons';

try {
  mkdirSync(outputDir, { recursive: true });
} catch (e) {
  // directory exists
}

// Optimized crop bounds to extract the inner illustration (excluding card borders/whitespace)
const CARD_SIZE = 138;
const CELL_W = 170.5;
const CELL_H = 204.8;
const PADDING = 16;

const iconsList = [
  { name: 'office-shifting', r: 0, c: 0 },
  { name: 'house-shifting', r: 0, c: 1 },
  { name: 'package-loading', r: 0, c: 2 },
  { name: 'delivery', r: 0, c: 3 },
  
  { name: 'ac-repair', r: 1, c: 0 },
  { name: 'electrician', r: 1, c: 1 },
  { name: 'plumber', r: 1, c: 2 },
  { name: 'carpenter', r: 1, c: 3 },
  
  { name: 'painter', r: 2, c: 0 },
  { name: 'cleaning', r: 2, c: 1 },
  { name: 'deep-cleaning', r: 2, c: 2 },
  { name: 'laundry', r: 2, c: 3 },
  
  { name: 'cooking', r: 3, c: 0 },
  { name: 'gardener', r: 3, c: 1 },
  { name: 'pest-control', r: 3, c: 2 },
  { name: 'driver', r: 3, c: 3 },
  
  { name: 'security', r: 4, c: 0 },
  { name: 'helper', r: 4, c: 1 },
  { name: 'event-staff', r: 4, c: 2 },
  { name: 'elderly-care', r: 4, c: 3 }
];

async function cropIcons() {
  for (const item of iconsList) {
    const left = Math.round(item.c * CELL_W + PADDING);
    const top = Math.round(item.r * CELL_H + PADDING);

    const outputPath = join(outputDir, `${item.name}.webp`);

    console.log(`Cropping tighter ${item.name} from x:${left}, y:${top}`);
    
    await sharp(imagePath)
      .extract({ left, top, width: CARD_SIZE, height: CARD_SIZE })
      .resize(128, 128)
      .webp({ quality: 80, effort: 4 })
      .toFile(outputPath);
  }

  // Create default fallback (copy of helper.webp)
  const defaultSrc = join(outputDir, 'helper.webp');
  const defaultDest = join(outputDir, 'default.webp');
  await sharp(defaultSrc).toFile(defaultDest);
  console.log('Created borderless default.webp fallback.');
}

cropIcons()
  .then(() => console.log('All borderless icons cropped successfully!'))
  .catch(console.error);
