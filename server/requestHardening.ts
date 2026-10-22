import express from 'express';
import helmet from 'helmet';

interface RequestHardeningOptions {
  isProduction: boolean;
}

let forwardedHostTrusted = false;

export function applyRequestHardening(app: express.Express, { isProduction }: RequestHardeningOptions): void {
  // Trust proxy is opt-in. Unless TRUST_PROXY is configured, X-Forwarded-* headers are
  // ignored entirely, so a client cannot spoof its own Host / school via those headers.
  const parseTrustProxy = (value?: string): boolean | number | string => {
    if (!value) return false;
    const trimmed = value.trim();
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (/^\d+$/.test(trimmed)) return Number(trimmed);
    return trimmed;
  };

  const trustProxy = parseTrustProxy(process.env.TRUST_PROXY);
  forwardedHostTrusted = trustProxy !== false;
  app.set('trust proxy', trustProxy);

  const GOOGLE_FONTS_STYLE = 'https://fonts.googleapis.com';
  const GOOGLE_FONTS_FONT = 'https://fonts.gstatic.com';

  app.use(
    helmet({
      // CSP is only enforced for the built SPA; Vite's dev server needs inline/eval scripts.
      contentSecurityPolicy: isProduction
        ? {
            useDefaults: true,
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'", GOOGLE_FONTS_STYLE],
              fontSrc: ["'self'", GOOGLE_FONTS_FONT, 'data:'],
              imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
              connectSrc: [
                "'self'",
                'https://*.googleapis.com',
                'https://*.google.com',
                'https://*.firebaseapp.com',
                'https://*.web.app',
                'https://*.firebaseio.com',
                'wss://*.firebaseio.com',
                'https://*.cloudfunctions.net',
                'https://identitytoolkit.googleapis.com',
                'https://securetoken.googleapis.com',
                'https://firestore.googleapis.com',
              ],
              frameSrc: ["'self'", 'https://*.firebaseapp.com'],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
              frameAncestors: ["'none'"],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
      // Allow Firebase popup/redirect OAuth to keep its opener relationship.
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      hsts: isProduction ? { maxAge: 15552000, includeSubDomains: true, preload: false } : false,
      referrerPolicy: { policy: 'no-referrer' },
    })
  );
}

export function getRequestHostname(req: express.Request): string {
  const forwarded = forwardedHostTrusted ? req.get('x-forwarded-host') : undefined;
  return (forwarded || req.get('host') || req.hostname || '').toString();
}
