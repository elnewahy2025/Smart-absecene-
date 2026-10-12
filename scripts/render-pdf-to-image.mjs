import puppeteer from 'puppeteer';
import fs from 'fs';

async function main() {
  const pdfBytes = fs.readFileSync('full_attendance_report.pdf');
  const pdfBase64 = pdfBytes.toString('base64');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

  // Use PDF.js inside a page to render page 1 of the generated PDF
  const viewerHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <style>
          body { margin: 0; background: #e2e8f0; display: flex; justify-content: center; padding: 20px; }
          canvas { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); background: white; }
        </style>
      </head>
      <body>
        <canvas id="pdfCanvas"></canvas>
        <script>
          const rawData = atob("${pdfBase64}");
          const uint8Array = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; i++) {
            uint8Array[i] = rawData.charCodeAt(i);
          }

          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

          pdfjsLib.getDocument({ data: uint8Array }).promise.then(pdf => {
            console.log('PDF loaded, total pages:', pdf.numPages);
            window.__pdfPages = pdf.numPages;
            return pdf.getPage(1).then(page => {
              const viewport = page.getViewport({ scale: 1.5 });
              const canvas = document.getElementById('pdfCanvas');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              const ctx = canvas.getContext('2d');
              return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(() => {
                window.__pdfRendered = true;
              });
            });
          }).catch(err => {
            console.error('PDF.js render error:', err);
            window.__pdfError = err.message;
          });
        </script>
      </body>
    </html>
  `;

  await page.setContent(viewerHtml, { waitUntil: 'networkidle0' });

  await page.waitForFunction('window.__pdfRendered === true || window.__pdfError', { timeout: 15000 });

  const err = await page.evaluate('window.__pdfError');
  if (err) {
    throw new Error('PDF render failed: ' + err);
  }

  const pages = await page.evaluate('window.__pdfPages');
  console.log('PDF successfully validated and rendered with PDF.js! Total pages:', pages);

  const canvasHandle = await page.$('#pdfCanvas');
  if (canvasHandle) {
    await canvasHandle.screenshot({ path: 'pdf_page1_preview.png' });
    console.log('Saved pdf_page1_preview.png successfully!');
  }

  await browser.close();
}

main().catch(console.error);
