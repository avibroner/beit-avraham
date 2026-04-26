/**
 * optimize-print-images.js
 * הופך את ה-PNGs המקוריים מ-images/ לגרסאות JPG דחוסות ב-print/assets/
 * כדי לשמור על גודל PDF סביר (~1-2MB) שמתאים ל-WhatsApp/Email.
 * הרצה: npm run optimize:images
 */

const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'images');
const OUT_DIR = path.join(PROJECT_ROOT, 'print', 'assets');

// אילו תמונות נכללות במסמך, ובאיזו רזולוציה.
// max-width בפיקסלים — מחושב כדי שב-300dpi יישאר חד באזור הסביר ב-A4 (170mm רוחב = ~2010px).
// משתמשים ב-1400px שזה איכותי לתצוגה במסך וגם בהדפסה ביתית.
const TARGETS = [
  { src: 'origin-story.png',   out: 'origin-story.jpg',   maxWidth: 800,  quality: 72 },
  { src: 'village-aerial.png', out: 'village-aerial.jpg', maxWidth: 1100, quality: 72 },
  { src: 'founder.png',        out: 'founder.jpg',        maxWidth: 400,  quality: 78 },
  { src: 'open-door.png',      out: 'open-door.jpg',      maxWidth: 900,  quality: 70 },
];

async function optimize() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  let totalBefore = 0;
  let totalAfter = 0;

  for (const t of TARGETS) {
    const srcPath = path.join(SRC_DIR, t.src);
    const outPath = path.join(OUT_DIR, t.out);

    if (!fs.existsSync(srcPath)) {
      console.warn(`⚠ דילוג — לא נמצא: ${srcPath}`);
      continue;
    }

    const beforeSize = fs.statSync(srcPath).size;
    totalBefore += beforeSize;

    await sharp(srcPath)
      .resize({ width: t.maxWidth, withoutEnlargement: true })
      .jpeg({ quality: t.quality, mozjpeg: true })
      .toFile(outPath);

    const afterSize = fs.statSync(outPath).size;
    totalAfter += afterSize;

    const beforeKB = (beforeSize / 1024).toFixed(0);
    const afterKB = (afterSize / 1024).toFixed(0);
    const ratio = ((1 - afterSize / beforeSize) * 100).toFixed(0);
    console.log(`✓ ${t.src} (${beforeKB}KB) → ${t.out} (${afterKB}KB · -${ratio}%)`);
  }

  const totalBeforeMB = (totalBefore / 1024 / 1024).toFixed(2);
  const totalAfterMB = (totalAfter / 1024 / 1024).toFixed(2);
  console.log(`\nסה״כ: ${totalBeforeMB}MB → ${totalAfterMB}MB`);
}

optimize().catch((err) => {
  console.error('✗ שגיאה באופטימיזציה:', err);
  process.exit(1);
});
