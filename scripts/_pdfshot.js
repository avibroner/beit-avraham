const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  const total = parseInt(process.argv[2] || '9');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  for (let i = 1; i <= total; i++) {
    const html = `<!DOCTYPE html>
<html><head>
<style>
  body{margin:0;padding:0;background:#222}
  iframe{display:block;border:0;width:100vw;height:100vh}
</style>
</head><body>
<iframe src="file:///C:/Projects/beit-avraham-site/dist/beit-avraham.pdf#page=${i}&toolbar=0&zoom=100"></iframe>
</body></html>`;
    fs.writeFileSync('C:/tmp/pdfshot.html', html);
    const p = await browser.newPage();
    await p.setViewport({ width: 700, height: 990 });
    await p.goto('file:///C:/tmp/pdfshot.html', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await p.screenshot({ path: `C:/tmp/pdf-shot-p${i}.png`, fullPage: false });
    await p.close();
    console.log('shot page', i);
  }
  await browser.close();
})();
