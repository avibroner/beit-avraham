const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  const html = `<!DOCTYPE html>
<html><head><script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.min.mjs" type="module"></script>
</head><body>
<pre id="out"></pre>
<script type="module">
import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';
const pdfData = atob('__B64__');
const arr = new Uint8Array(pdfData.length);
for (let i=0; i<pdfData.length; i++) arr[i] = pdfData.charCodeAt(i);
const pdf = await pdfjsLib.getDocument({data: arr}).promise;
let out = 'numPages=' + pdf.numPages + '\\n';
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const vp = page.getViewport({scale: 1});
  out += 'page ' + i + ': ' + vp.width.toFixed(1) + ' x ' + vp.height.toFixed(1) + ' (rotation=' + page.rotate + ')\\n';
}
document.getElementById('out').textContent = out;
window.__done = true;
</script></body></html>`;
  const pdfB64 = fs.readFileSync('C:/Projects/beit-avraham-site/dist/beit-avraham.pdf').toString('base64');
  fs.writeFileSync('C:/tmp/pdf-info.html', html.replace('__B64__', pdfB64));
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const p = await browser.newPage();
  await p.goto('file:///C:/tmp/pdf-info.html');
  await p.waitForFunction('window.__done === true');
  const txt = await p.evaluate(() => document.getElementById('out').textContent);
  console.log(txt);
  await browser.close();
})();
