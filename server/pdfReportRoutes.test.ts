import { describe, expect, it } from 'vitest';
import { isAllowedPdfRequest, sanitizePdfHtml } from './pdfReportRoutes';

describe('PDF renderer security hardening', () => {
  it('blocks file:, loopback, private IP, metadata, external hosts, and cdn.tailwindcss.com', () => {
    expect(isAllowedPdfRequest('file:///etc/passwd')).toBe(false);
    expect(isAllowedPdfRequest('http://127.0.0.1:8080/secret')).toBe(false);
    expect(isAllowedPdfRequest('http://localhost:5050/api/health')).toBe(false);
    expect(isAllowedPdfRequest('http://169.254.169.254/latest/meta-data/')).toBe(false);
    expect(isAllowedPdfRequest('http://10.0.0.1/admin')).toBe(false);
    expect(isAllowedPdfRequest('https://evil.example.com/payload.js')).toBe(false);
    expect(isAllowedPdfRequest('https://cdn.tailwindcss.com/')).toBe(false);
  });

  it('allows only data: documents and Google Fonts stylesheets/assets', () => {
    expect(isAllowedPdfRequest('data:text/html;charset=utf-8,hello')).toBe(true);
    expect(isAllowedPdfRequest('https://fonts.googleapis.com/css2?family=Cairo')).toBe(true);
    expect(isAllowedPdfRequest('https://fonts.gstatic.com/s/cairo/v1/font.woff2')).toBe(true);
  });

  it('strips script tags and inline event handlers from htmlContent', () => {
    const dirty = '<div onclick="alert(1)" onload=\'evil()\'>تقرير</div><script>fetch("http://127.0.0.1")</script>';
    const clean = sanitizePdfHtml(dirty);
    expect(clean).not.toContain('<script');
    expect(clean).not.toContain('onclick');
    expect(clean).not.toContain('onload');
    expect(clean).toContain('تقرير');
  });
});
