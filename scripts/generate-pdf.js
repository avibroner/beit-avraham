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

// Header/Footer הוסרו: רוצים רקע קרם מלא מקצה לקצה בכל עמוד,
// וזה מצריך @page margin: 0 ב-CSS — מה שלא משאיר מקום ל-header/footer
// של Puppeteer. אם נצטרך מספרי עמודים בעתיד, אפשר להוסיף דרך CSS @page counter.

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
      displayHeaderFooter: false,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
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
