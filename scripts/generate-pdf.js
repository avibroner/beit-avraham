/**
 * generate-pdf.js
 * מייצר את ה-PDF הרבני של בית אברהם מתוך print/rabbanim.html.
 * הרצה: npm run pdf
 */

const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SOURCE_HTML = path.join(PROJECT_ROOT, 'print', 'rabbanim.html');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'dist');
const OUTPUT_PDF = path.join(OUTPUT_DIR, 'beit-avraham-rabbanim.pdf');

const HEADER_TEMPLATE = `
  <div style="font-size:8pt;width:100%;text-align:center;color:#9B7B3D;font-family:Heebo,sans-serif;padding:0 15mm;">
    בית אברהם · בית אחד לשלושה דורות
  </div>
`;

const FOOTER_TEMPLATE = `
  <div style="font-size:8pt;width:100%;text-align:center;color:#6B5A4A;font-family:Heebo,sans-serif;padding:0 15mm;">
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
      headerTemplate: HEADER_TEMPLATE,
      footerTemplate: FOOTER_TEMPLATE,
      margin: { top: '15mm', right: '0mm', bottom: '15mm', left: '0mm' },
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
