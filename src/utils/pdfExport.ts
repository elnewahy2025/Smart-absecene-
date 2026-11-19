import { authenticatedFetch } from '../lib/api';

export async function fetchNativePdfBlob(options: {
  htmlContent: string;
  title: string;
  filename: string;
}): Promise<Blob> {
  const response = await authenticatedFetch('/api/pdf/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ htmlContent: options.htmlContent, title: options.title, filename: options.filename }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Server PDF generation failed (${response.status}): ${errText}`);
  }
  const contentType = response.headers.get('content-type') || '';
  let buffer: ArrayBuffer;
  if (contentType.includes('application/json')) {
    const data = await response.json();
    if (!data.success || !data.pdfBase64) throw new Error(data.error || 'Server returned invalid PDF payload.');
    const binaryStr = window.atob(data.pdfBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    buffer = bytes.buffer;
  } else {
    buffer = await response.arrayBuffer();
  }
  if (!buffer || buffer.byteLength === 0) throw new Error('Server returned an empty PDF stream.');
  const headerStr = String.fromCharCode(...new Uint8Array(buffer).slice(0, 5));
  if (!headerStr.startsWith('%PDF')) throw new Error(`Server returned non-PDF data: ${headerStr}`);
  return new Blob([buffer], { type: 'application/pdf' });
}

const escapeHtmlAttribute = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] as string);

/** Browser fallback with scripts, plugins, frames, and network connections disabled. */
export function printHtmlFallback(options: { htmlContent: string; title: string }): boolean {
  if (typeof document === 'undefined') return false;
  const safeTitle = escapeHtmlAttribute(options.title);
  const printDocument = `<!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'; img-src data: blob:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:">
        <title>${safeTitle}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: 'Cairo', 'Amiri', 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color: #0f172a; background-color: #fff; padding: 0; margin: 0; }
          table { border-collapse: collapse; width: 100%; }
          .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
        </style>
      </head>
      <body>${options.htmlContent}</body>
    </html>`;
  try {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('sandbox', 'allow-modals allow-same-origin');
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
      try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); }
      catch (err) { console.warn('Browser print fallback failed:', err); }
    };
    iframe.onload = () => window.setTimeout(triggerPrint, 400);
    document.body.appendChild(iframe);
    window.setTimeout(() => { try { iframe.remove(); } catch {} }, 120000);
    return true;
  } catch (err) {
    console.error('Browser print fallback could not be prepared:', err);
    return false;
  }
}

export async function downloadNativePdfFromHtml(options: { htmlContent: string; title: string; filename: string }): Promise<boolean> {
  try {
    const pdfBlob = await fetchNativePdfBlob(options);
    const downloadUrl = window.URL.createObjectURL(pdfBlob);
    const safeFilename = options.filename.endsWith('.pdf') ? options.filename : `${options.filename}.pdf`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = safeFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 60000);
    return true;
  } catch (err) {
    console.warn('Server vector PDF export unavailable, using browser print:', err);
    return printHtmlFallback(options);
  }
}

export async function printNativePdfFromHtml(options: { htmlContent: string; title: string }): Promise<boolean> {
  try {
    const pdfBlob = await fetchNativePdfBlob({ htmlContent: options.htmlContent, title: options.title, filename: 'document.pdf' });
    const blobUrl = window.URL.createObjectURL(pdfBlob);
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
      try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); printed = true; }
      catch { window.open(blobUrl, '_blank', 'noopener,noreferrer'); printed = true; }
    };
    iframe.onload = () => window.setTimeout(triggerPrint, 400);
    window.setTimeout(() => {
      if (!printed) { window.open(blobUrl, '_blank', 'noopener,noreferrer'); printed = true; }
    }, 1200);
    window.setTimeout(() => { iframe.remove(); window.URL.revokeObjectURL(blobUrl); }, 120000);
    return true;
  } catch (err) {
    console.warn('Server vector PDF print unavailable, using browser print:', err);
    return printHtmlFallback({ htmlContent: options.htmlContent, title: options.title });
  }
}
