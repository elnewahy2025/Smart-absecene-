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
    console.error('Puppeteer vector PDF export failed:', err);
    alert(
      `تعذر إنشاء مستند PDF حالياً: ${err?.message || 'خطأ غير معروف'}.\nيرجى التأكد من تشغيل الخادم والمحاولة مرة أخرى.`
    );
    return false;
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
    console.error('Vector PDF print generation failed:', err);
    alert(`تعذر تجهيز مستند الطباعة: ${err?.message || 'خطأ غير معروف'}`);
    return false;
  }
}
