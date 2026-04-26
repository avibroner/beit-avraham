const fs = require('fs');
const puppeteer = require('puppeteer');

async function renderPage(pageNum, output) {
  const html = `<!DOCTYPE html>
<html><head><script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.min.mjs" type="module"></script>
<style>body{margin:0;padding:0;background:#FF0080}canvas{display:block}</style>
</head><body>
<canvas id="c"></canvas>
<script type="module">
import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';
const pdfData = atob('__B64__');
const arr = new Uint8Array(pdfData.length);
for (let i=0; i<pdfData.length; i++) arr[i] = pdfData.charCodeAt(i);
const pdf = await pdfjsLib.getDocument({data: arr}).promise;
const page = await pdf.getPage(__PAGE__);
const viewport = page.getViewport({scale: 1.6});
const canvas = document.getElementById('c');
canvas.width = viewport.width;
canvas.height = viewport.height;
const ctx = canvas.getContext('2d');
await page.render({canvasContext: ctx, viewport: viewport}).promise;
window.__done = true;
</script></body></html>`;
  const pdfB64 = fs.readFileSync('C:/Projects/beit-avraham-site/dist/beit-avraham.pdf').toString('base64');
  fs.writeFileSync('C:/tmp/pdf-render.html', html.replace('__B64__', pdfB64).replace('__PAGE__', pageNum));
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1300, height: 1850 });
  await page.goto('file:///C:/tmp/pdf-render.html');
  await page.waitForFunction('window.__done === true');
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: output, fullPage: true });
  await browser.close();
}

(async () => {
  const total = parseInt(process.argv[2] || '12');
  for (let i = 1; i <= total; i++) {
    await renderPage(i, 'C:/tmp/pdf-p' + i + '.png');
    console.log('rendered page', i);
  }
})();
