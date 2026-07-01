import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const logoPath = path.resolve('src/assets/J.png');
const publicDir = path.resolve('public');
const iconsDir = path.resolve('public/icons');

// Create folders if they don't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateIcons() {
  console.log('Generating PWA icons from', logoPath);

  try {
    // 1. Generate Favicon
    await sharp(logoPath)
      .resize(48, 48)
      .toFile(path.join(publicDir, 'favicon.png'));
    console.log('Created favicon.png');

    // 2. Generate standard 192x192 icon
    await sharp(logoPath)
      .resize(192, 192)
      .toFile(path.join(iconsDir, 'icon-192.png'));
    console.log('Created icon-192.png');

    // 3. Generate standard 512x512 icon
    await sharp(logoPath)
      .resize(512, 512)
      .toFile(path.join(iconsDir, 'icon-512.png'));
    console.log('Created icon-512.png');

    // 4. Generate Maskable Icon (logo fits within 60% of size, centered on brand background #8f3bf6 or splash #F8FAFC)
    // We resize logo to 320x320 and compose it over a 512x512 background of color #F8FAFC
    const paddedLogo = await sharp(logoPath)
      .resize(320, 320)
      .toBuffer();

    await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 4,
        background: { r: 248, g: 250, b: 252, alpha: 1 } // #F8FAFC
      }
    })
      .composite([{ input: paddedLogo, gravity: 'center' }])
      .png()
      .toFile(path.join(iconsDir, 'icon-maskable.png'));
    console.log('Created icon-maskable.png');

    // 5. Generate Splash Screen Icon (similar to maskable, logo centered on #8f3bf6 background for splash screen contrast)
    const splashLogo = await sharp(logoPath)
      .resize(360, 360)
      .toBuffer();

    await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 4,
        background: { r: 143, g: 59, b: 246, alpha: 1 } // #8f3bf6 (primary brand color)
      }
    })
      .composite([{ input: splashLogo, gravity: 'center' }])
      .png()
      .toFile(path.join(iconsDir, 'splash.png'));
    console.log('Created splash.png');

    console.log('All PWA icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
