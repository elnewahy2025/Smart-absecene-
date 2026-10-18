import React from 'react';

interface SandboxedEmailHtmlProps {
  html: string;
  title?: string;
  className?: string;
  minHeight?: number;
}

/**
 * Renders untrusted digest HTML inside a fully sandboxed iframe.
 *
 * Digest bodies embed student names and AI-generated text, so they must never be
 * injected into the host document. An empty `sandbox` attribute disables scripts,
 * forms, top-level navigation and same-origin access, which neutralises stored XSS
 * without pulling in a sanitiser dependency.
 */
export const SandboxedEmailHtml: React.FC<SandboxedEmailHtmlProps> = ({
  html,
  title = 'Email digest preview',
  className,
  minHeight = 600,
}) => (
  <iframe
    title={title}
    srcDoc={html}
    sandbox=""
    referrerPolicy="no-referrer"
    loading="lazy"
    className={className}
    style={{ width: '100%', minHeight, height: minHeight, border: '0', background: '#ffffff' }}
  />
);
