/**
 * Client utility to generate and download native vector PDFs via the server's Puppeteer engine.
 * Ensures proper Arabic font embedding (Cairo, Amiri) and RTL shaping with selectable text.
 * Output is a real, standards-compliant vector PDF that opens reliably in all desktop and mobile browsers.
 */
import { authenticatedFetch } from '../lib/api';

export async function fetchNativePdfBlob(options: {
  htmlContent: string;
  title: string;
  filename: string;
}): Promise<Blob> {
  const response = await authenticatedFetch('/api/pdf/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      htmlContent: options.htmlContent,
      title: options.title,
      filename: options.filename,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Server PDF generation failed (${response.status}): ${errText}`);
  }

  // Handle JSON response with base64 encoded PDF payload (guarantees zero stream interception by IDM or proxies)
  const contentType = response.headers.get('content-type') || '';
  let buffer: ArrayBuffer;

  if (contentType.includes('application/json')) {
    const data = await response.json();
    if (!data.success || !data.pdfBase64) {
      throw new Error(data.error || 'Server returned invalid PDF payload.');
    }
    const binaryStr = window.atob(data.pdfBase64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    buffer = bytes.buffer;
  } else {
    buffer = await response.arrayBuffer();
  }

  if (!buffer || buffer.byteLength === 0) {
    throw new Error('Server returned an empty PDF stream.');
  }

  const uint8 = new Uint8Array(buffer);
  const headerStr = String.fromCharCode(...uint8.slice(0, 5));
  if (!headerStr.startsWith('%PDF')) {
    throw new Error(`Server returned non-PDF data: ${headerStr}`);
  }

  return new Blob([buffer], { type: 'application/pdf' });
}

/**
 * Fallback used when the server PDF engine is unavailable (local development
 * without a service account or Chromium, rate limits, busy engine). Renders the
 * same report HTML in a hidden iframe and opens the browser print dialog, where
 * "Save as PDF" produces the document.
 */
export function printHtmlFallback(options: { htmlContent: string; title: string }): boolean {
  if (typeof document === 'undefined') return false;

  const printDocument = `<!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${options.title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body {
            font-family: 'Cairo', 'Amiri', 'Segoe UI', Tahoma, Arial, sans-serif;
            direction: rtl;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color: #0f172a;
            background-color: #ffffff;
            padding: 0;
            margin: 0;
          }
          table { border-collapse: collapse; width: 100%; }
          .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
        </style>
      </head>
      <body>${options.htmlContent}</body>
    </html>`;

  try {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.srcdoc = printDocument;

    let printed = false;
    const triggerPrint = () => {
      if (printed) return;
      printed = true;
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Browser print fallback failed:', err);
      }
    };

    iframe.onload = () => setTimeout(triggerPrint, 400);
    document.body.appendChild(iframe);

    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch {}
    }, 120000);

    return true;
  } catch (err) {
    console.error('Browser print fallback could not be prepared:', err);
    return false;
  }
}

/**
 * Generates and downloads native vector PDF with selectable Arabic text and Cairo/Amiri fonts.
 */
export async function downloadNativePdfFromHtml(options: {
  htmlContent: string;
  title: string;
  filename: string;
}): Promise<boolean> {
  try {
    const pdfBlob = await fetchNativePdfBlob(options);
    const downloadUrl = window.URL.createObjectURL(pdfBlob);

    const safeFilename = options.filename.endsWith('.pdf')
      ? options.filename
      : `${options.filename}.pdf`;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = safeFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl);
    }, 60000);

    return true;
  } catch (err: any) {
    console.warn('Server vector PDF export unavailable, using browser print:', err);
    return printHtmlFallback(options);
  }
}

/**
 * Generates a clean vector Arabic PDF on the server and opens it directly for printing in an isolated frame/window.
 * This guarantees that printing never captures background webpage screenshots.
 */
export async function printNativePdfFromHtml(options: {
  htmlContent: string;
  title: string;
}): Promise<boolean> {
  try {
    const pdfBlob = await fetchNativePdfBlob({
      htmlContent: options.htmlContent,
      title: options.title,
      filename: 'document.pdf',
    });

    const blobUrl = window.URL.createObjectURL(pdfBlob);

    // Create an isolated hidden iframe with the vector PDF to trigger clean browser printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl;

    document.body.appendChild(iframe);

    let printed = false;
    const triggerPrint = () => {
      if (printed) return;
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        printed = true;
      } catch {
        window.open(blobUrl, '_blank');
        printed = true;
      }
    };

    iframe.onload = () => {
      setTimeout(triggerPrint, 400);
    };

    // Fallback if browser PDF plugin does not fire iframe onload event
    setTimeout(() => {
      if (!printed) {
        window.open(blobUrl, '_blank');
        printed = true;
      }
    }, 1200);

    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch {}
      window.URL.revokeObjectURL(blobUrl);
    }, 120000);

    return true;
  } catch (err: any) {
    console.warn('Server vector PDF print unavailable, using browser print:', err);
    return printHtmlFallback({ htmlContent: options.htmlContent, title: options.title });
  }
}
