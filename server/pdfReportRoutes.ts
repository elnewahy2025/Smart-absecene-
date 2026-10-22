import express from 'express';
import fs from 'fs';
import rateLimit from 'express-rate-limit';

const IS_VERCEL = Boolean(process.env.VERCEL);

interface PdfReportRoutesDeps {
  app: express.Express;
  authenticateRequest: express.RequestHandler;
  requireRole: (allowedRoles: string[]) => express.RequestHandler;
  requireTenant: express.RequestHandler;
}

export function getSystemChromePath(): string | undefined {
  const candidates = [
    process.env.CHROME_BIN,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

export function registerPdfReportRoutes({ app, authenticateRequest, requireRole, requireTenant }: PdfReportRoutesDeps) {

// Chromium's sandbox is enabled by default. Some container hosts (e.g. hardened
// runtimes without user-namespace support) cannot start the sandboxed renderer;
// operators can opt out explicitly with PUPPETEER_NO_SANDBOX=true. Only the PDF
// renderer is affected, and only requests to the print stylesheet / webfonts are
// reachable from it (everything else is aborted).
async function launchPdfBrowser(executablePath: string | undefined) {
  // Serverless hosts ship no browser binary; use the packaged @sparticuz/chromium
  // build (already patched to run inside the function sandbox) with puppeteer-core.
  if (IS_VERCEL) {
    const chromiumModule: any = await import('@sparticuz/chromium');
    const chromium = chromiumModule.default ?? chromiumModule;
    const puppeteerCoreModule: any = await import('puppeteer-core');
    const puppeteerCore = puppeteerCoreModule.default ?? puppeteerCoreModule;

    return puppeteerCore.launch({
      args: [
        ...(Array.isArray(chromium.args) ? chromium.args : []),
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=medium',
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless ?? true,
    });
  }

  const disableSandbox = process.env.PUPPETEER_NO_SANDBOX === 'true';
  // Loaded lazily so serverless bundles (which never take this path) do not carry
  // the full puppeteer package with its bundled-browser downloader.
  const puppeteerModule: any = await import('puppeteer');
  const puppeteer = puppeteerModule.default ?? puppeteerModule;
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      ...(disableSandbox ? ['--no-sandbox', '--disable-setuid-sandbox'] : []),
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=medium',
    ],
  });
}

// Singleton browser instance pool to avoid expensive cold starts and high memory consumption
let sharedBrowserInstance: any = null;
let sharedBrowserLaunchPromise: Promise<any> | null = null;

async function getSharedPdfBrowser(executablePath: string | undefined) {
  if (sharedBrowserInstance) {
    try {
      if (sharedBrowserInstance.isConnected()) {
        return sharedBrowserInstance;
      }
    } catch {
      sharedBrowserInstance = null;
    }
  }

  if (!sharedBrowserLaunchPromise) {
    sharedBrowserLaunchPromise = launchPdfBrowser(executablePath)
      .then((browser) => {
        sharedBrowserInstance = browser;
        browser.on('disconnected', () => {
          sharedBrowserInstance = null;
          sharedBrowserLaunchPromise = null;
        });
        return browser;
      })
      .catch((err) => {
        sharedBrowserInstance = null;
        sharedBrowserLaunchPromise = null;
        throw err;
      });
  }

  return sharedBrowserLaunchPromise;
}

const pdfGenerateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: express.Request) => req.user?.uid || req.ip || 'anonymous',
  message: { error: 'PDF generation rate limit exceeded (max 10 requests per minute).' },
});

let activePdfRenders = 0;
const MAX_CONCURRENT_PDF_RENDERS = 2;

const escapeHtmlText = (value: unknown, fallback: string): string => {
  const text = typeof value === 'string' && value.trim() ? value : fallback;
  return text.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char] as string));
};

// Only the print stylesheet, the Arabic webfonts and data: documents are reachable
// from the renderer. file:// and internal network targets are aborted.
const isAllowedPdfRequest = (url: string): boolean =>
  url.startsWith('data:') ||
  url.startsWith('https://fonts.googleapis.com/') ||
  url.startsWith('https://fonts.gstatic.com/') ||
  url.startsWith('https://cdn.tailwindcss.com/');
/**
 * Native Vector PDF Generator Route with Full Arabic RTL Typography Support.
 * Uses headless Chromium / Puppeteer to guarantee true selectable text,
 * correct OpenType cursive letter shaping, Cairo/Amiri web fonts, and exact A4 formatting.
 * Mounted before auth/tenant middleware so it works universally across all subdomains.
 * Returns JSON with base64 encoded PDF to prevent Internet Download Manager (IDM) or proxy stream interception.
 */
app.post(
  '/api/pdf/generate',
  (req, res, next) => { void authenticateRequest(req, res, next); },
  requireRole(['admin', 'registrar', 'teacher']),
  (req, res, next) => { requireTenant(req, res, next); },
  pdfGenerateLimiter,
  async (req, res) => {
  if (activePdfRenders >= MAX_CONCURRENT_PDF_RENDERS) {
    return res.status(503).json({
      error: 'PDF engine is busy. Please retry shortly.',
      code: 'PDF_ENGINE_BUSY',
    });
  }
  activePdfRenders++;
  let context: any = null;
  let page: any = null;
  try {
    const { htmlContent, title = 'تقرير الحضور والانضباط المدرسي', filename } = req.body;
    const safeTitle = escapeHtmlText(title, 'تقرير الحضور والانضباط المدرسي');

    if (!htmlContent) {
      return res.status(400).json({ error: 'htmlContent is required' });
    }

    const executablePath = getSystemChromePath();
    const browser = await getSharedPdfBrowser(executablePath);

    // Create an isolated ephemeral browser context for this request if supported,
    // ensuring complete isolation of memory, cookies, and local data between tenants.
    try {
      if (typeof browser.createBrowserContext === 'function') {
        context = await browser.createBrowserContext();
        page = await context.newPage();
      } else {
        page = await browser.newPage();
      }
    } catch {
      page = await browser.newPage();
    }

    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(20000);

    await page.setRequestInterception(true);
    page.on('request', (request: any) => {
      if (isAllowedPdfRequest(request.url())) {
        request.continue();
      } else {
        request.abort();
      }
    });

    // Construct self-contained document with Cairo/Amiri and local Arabic font fallbacks
    const fullHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>${safeTitle}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 10mm 12mm 10mm;
            }
            body {
              font-family: 'Cairo', 'Amiri', 'Segoe UI', Tahoma, Arial, sans-serif;
              direction: rtl;
              unicode-bidi: embed;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color: #0f172a;
              background-color: #ffffff;
              padding: 0;
              margin: 0;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            .break-inside-avoid {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body class="p-2 bg-white">
          ${htmlContent}
        </body>
      </html>
    `;

    await page.setContent(fullHtml, {
      waitUntil: 'domcontentloaded',
    });

    // Gracefully wait up to 3 seconds for Google Fonts, else proceed with system Arabic fonts
    try {
      await Promise.race([
        page.evaluateHandle('document.fonts.ready'),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    } catch (err) {
      console.warn('[PDF] Font readiness wait failed; continuing with system fonts:', err);
    }

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width: 100%; font-size: 8px; font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; direction: rtl; display: flex; justify-content: space-between; padding: 0 10mm; color: #64748b;">
          <span>نظام مدرستي الذكي للحضور والانضباط · وثيقة رسمية معتمدة</span>
          <span>صفحة <span class="pageNumber"></span> من <span class="totalPages"></span></span>
        </div>
      `,
      margin: {
        top: '10mm',
        bottom: '14mm',
        left: '10mm',
        right: '10mm',
      },
    });

    const rawFilename = (filename || `${title}.pdf`).replace(/[/\\\\?%*:|"<>]/g, '_');
    const cleanedAscii = rawFilename.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/^_+|_+$/g, '');
    const safeAscii = cleanedAscii && cleanedAscii !== '.pdf' ? cleanedAscii : 'attendance-report.pdf';
    const utf8Filename = encodeURIComponent(rawFilename);

    const buffer = Buffer.from(pdfBuffer);
    
    // Return base64 in JSON to guarantee 100% reliable reception across all environments and download managers
    res.json({
      success: true,
      pdfBase64: buffer.toString('base64'),
      filename: safeAscii,
      utf8Filename,
      size: buffer.length,
    });
  } catch (err: unknown) {
    console.error('[PDF_EXPORT_ERROR]', err);
    res.status(500).json({
      error: 'Failed to generate PDF document',
      details: 'Internal error',
    });
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (err) {
        console.warn('[PDF] Failed to close page:', err);
      }
    }
    if (context) {
      try {
        await context.close();
      } catch (err) {
        console.warn('[PDF] Failed to close browser context:', err);
      }
    }
    activePdfRenders = Math.max(0, activePdfRenders - 1);
  }
});
}
