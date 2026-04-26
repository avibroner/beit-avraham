const sharp = require('sharp');
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
const viewport = page.getViewport({scale: 2});
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
  await page.setViewport({ width: 1500, height: 2200 });
  await page.goto('file:///C:/tmp/pdf-render.html');
  await page.waitForFunction('window.__done === true');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: output, fullPage: true });
  await browser.close();
}

(async () => {
  await renderPage(2, 'C:/tmp/pdf-p2.png');  // origin story
  await renderPage(7, 'C:/tmp/pdf-p7.png');  // FAQ part 2 with CTA
  await renderPage(8, 'C:/tmp/pdf-p8.png');  // closing OR overflow

  // pixel analysis on page 2 to verify still 0% white strip
  for (const [name, file] of [['p2', 'C:/tmp/pdf-p2.png'], ['p7', 'C:/tmp/pdf-p7.png']]) {
    const img = sharp(file);
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    const sampleY = 400;
    const stride = info.channels;
    const row0 = sampleY * info.width * stride;
    let fX = -1, lX = -1;
    for (let x = 0; x < info.width; x++) {
      const i = row0 + x * stride;
      if (!(data[i] > 240 && data[i+1] < 30 && data[i+2] > 100)) {
        if (fX === -1) fX = x;
        lX = x;
      }
    }
    let firstWhite = -1;
    for (let x = fX; x <= lX; x++) {
      const i = row0 + x * stride;
      if (data[i] >= 252 && data[i+1] >= 252 && data[i+2] >= 252) {
        if (firstWhite === -1) firstWhite = x;
      }
    }
    const canvasWidth = lX - fX + 1;
    const whiteWidth = firstWhite !== -1 ? lX - firstWhite + 1 : 0;
    console.log(`${name}: canvas=${canvasWidth}px, white strip=${whiteWidth}px (${(whiteWidth/canvasWidth*100).toFixed(1)}%)`);
  }
})();
