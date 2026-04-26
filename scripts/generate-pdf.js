/**
 * generate-pdf.js
 * מייצר את מסמך המבוא של בית אברהם מתוך print/document.html.
 * הרצה: npm run pdf
 */

const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SOURCE_HTML = path.join(PROJECT_ROOT, 'print', 'document.html');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'dist');
const OUTPUT_PDF = path.join(OUTPUT_DIR, 'beit-avraham.pdf');

// פוטר עם מספור עמודים, רקע קרם כדי להישאר רציף עם שאר העמוד.
// ה-@page :first ב-CSS דואג שעמוד השער יישאר ללא פוטר ו-full-bleed.
const FOOTER_TEMPLATE = `
  <div style="font-size:8pt;width:100%;height:12mm;line-height:12mm;text-align:center;color:#6B5A4A;font-family:Heebo,sans-serif;background:#FAF7F0;margin:0;">
    עמוד <span class="pageNumber"></span> מתוך <span class="totalPages"></span>
  </div>
`;

async function generatePDF() {
  if (!fs.existsSync(SOURCE_HTML)) {
    console.error(`✗ לא נמצא קובץ המקור: ${SOURCE_HTML}`);
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('• פותח Chromium...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    const fileUrl = 'file:///' + SOURCE_HTML.replace(/\\/g, '/');
    console.log(`• טוען: ${fileUrl}`);
    await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60000 });

    // לוודא שכל הפונטים מ-Google Fonts הסתיימו לטעון לפני הרינדור
    console.log('• ממתין לפונטים...');
    await page.evaluate(() => document.fonts.ready);

    console.log('• מייצר PDF...');
    await page.pdf({
      path: OUTPUT_PDF,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: FOOTER_TEMPLATE,
    });

    const stats = fs.statSync(OUTPUT_PDF);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`✓ נוצר: ${OUTPUT_PDF}`);
    console.log(`  גודל: ${sizeMB} MB`);
  } finally {
    await browser.close();
  }
}

generatePDF().catch((err) => {
  console.error('✗ שגיאה ביצירת ה-PDF:', err);
  process.exit(1);
});
