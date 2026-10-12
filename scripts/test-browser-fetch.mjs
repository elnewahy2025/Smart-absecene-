import puppeteer from 'puppeteer';

async function testBrowserFetch() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  
  // Test directly with falah.localhost:3000
  await page.goto('http://falah.localhost:3000', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    try {
      const res = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          htmlContent: '<div dir="rtl"><h1>تجربة تقرير من المتصفح</h1><p>طالب حاضر ومعتمد</p></div>',
          title: 'تجربة',
          filename: 'test.pdf',
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let buffer;
      if (contentType.includes('application/json')) {
        const json = await res.json();
        const binary = atob(json.pdfBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        buffer = bytes.buffer;
      } else {
        buffer = await res.arrayBuffer();
      }

      const uint8 = new Uint8Array(buffer);
      const prefix = String.fromCharCode(...uint8.slice(0, 10));
      return {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        size: buffer.byteLength,
        prefix: prefix,
      };
    } catch (e) {
      return { error: e.message };
    }
  });

  console.log('Browser fetch result:', JSON.stringify(result, null, 2));
  await browser.close();
}

testBrowserFetch().catch(console.error);
