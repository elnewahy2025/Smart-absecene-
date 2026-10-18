import express from 'express';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5050;
const SHARED_AUTH_VALUE = process.env.APP_AUTH_TOKEN || '';
const ALLOW_DEV_AUTH = process.env.ALLOW_DEV_AUTH === 'true' && process.env.NODE_ENV !== 'production';
const DEV_AUTH_ROLE = process.env.DEV_AUTH_ROLE || 'teacher';
const DEV_AUTH_TENANT = process.env.DEV_AUTH_TENANT || '';
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || '';
const PLATFORM_OWNER_EMAILS = (process.env.PLATFORM_OWNER_EMAILS || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

app.use(express.json({ limit: '25mb' }));

// --- Transport & header hardening (M-2) ---
// Trust proxy is opt-in. Unless TRUST_PROXY is configured, X-Forwarded-* headers are
// ignored entirely, so a client cannot spoof its own Host / school via those headers.
function parseTrustProxy(value?: string): boolean | number | string {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

const TRUST_PROXY = parseTrustProxy(process.env.TRUST_PROXY);
const TRUST_FORWARDED_HOST = TRUST_PROXY !== false;
app.set('trust proxy', TRUST_PROXY);

const GOOGLE_FONTS_STYLE = 'https://fonts.googleapis.com';
const GOOGLE_FONTS_FONT = 'https://fonts.gstatic.com';

app.use(
  helmet({
    // CSP is only enforced for the built SPA; Vite's dev server needs inline/eval scripts.
    contentSecurityPolicy: IS_PRODUCTION
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
    hsts: IS_PRODUCTION ? { maxAge: 15552000, includeSubDomains: true, preload: false } : false,
    referrerPolicy: { policy: 'no-referrer' },
  })
);

// Only honour X-Forwarded-Host when a trusted proxy is configured; otherwise use the real Host.
function getRequestHostname(req: express.Request): string {
  const forwarded = TRUST_FORWARDED_HOST ? req.get('x-forwarded-host') : undefined;
  return (forwarded || req.get('host') || req.hostname || '').toString();
}

import puppeteer from 'puppeteer';
import fs from 'fs';
import admin from 'firebase-admin';
import {
  getTenantApiKey,
  setTenantApiKey,
  removeTenantApiKey,
  getTenantAIConfig,
  maskApiKey,
} from './src/utils/tenantAISecrets';
import {
  sendSms,
  sendWhatsAppCloudMessage,
  sendEmail,
} from './src/utils/messagingProviders';
import type { SchoolMessagingGatewayConfig } from './src/types/attendance';
import { isPublicRoute } from './src/utils/routeAuth';

function getSystemChromePath(): string | undefined {
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

const pdfGenerateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: express.Request) => (req as any).user?.uid || req.ip || 'anonymous',
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
  let browser: any = null;
  try {
    const { htmlContent, title = 'تقرير الحضور والانضباط المدرسي', filename } = req.body;
    const safeTitle = escapeHtmlText(title, 'تقرير الحضور والانضباط المدرسي');

    if (!htmlContent) {
      return res.status(400).json({ error: 'htmlContent is required' });
    }

    const executablePath = getSystemChromePath();

    // Chromium's sandbox stays enabled. Container hosts must permit it (non-root
    // user with user namespaces); do not reintroduce --no-sandbox.
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=medium',
      ],
    });

    const page = await browser.newPage();
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
    } catch {}

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

    await browser.close();
    browser = null;

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
  } catch (err: any) {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
    console.error('[PDF_EXPORT_ERROR]', err);
    res.status(500).json({
      error: 'Failed to generate PDF document',
      details: 'Internal error',
    });
  } finally {
    activePdfRenders = Math.max(0, activePdfRenders - 1);
  }
});


// Initialize Firebase Admin SDK if credentials exist or default project is set
let firebaseAdminInitialized = false;
let adminKeyLoaded = false;
// True only when an explicit credential (inline or service-account file) was loaded,
// i.e. token verification can actually succeed. A project id alone can initialise the
// SDK but cannot verify ID tokens, so it must never be reported as ready.
let firebaseAdminReady = false;
try {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve(__dirname, 'serviceAccountKey.json');
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const inlineCredential = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
    ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
    : process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  let inlineServiceAccount: any = null;
  if (inlineCredential) {
    try {
      inlineServiceAccount = JSON.parse(inlineCredential);
      console.log('[AUTH] Firebase Admin credential loaded from environment.');
    } catch (parseError: any) {
      console.warn('[AUTH] FIREBASE_SERVICE_ACCOUNT_* is not valid JSON:', parseError?.message);
    }
  }

  if (inlineServiceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(inlineServiceAccount),
      projectId: inlineServiceAccount.project_id || projectId,
    });
    firebaseAdminInitialized = true;
    adminKeyLoaded = true;
    firebaseAdminReady = true;
    console.log('[AUTH] Firebase Admin initialized from environment credential.');
  } else if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id || projectId,
    });
    firebaseAdminInitialized = true;
    adminKeyLoaded = true;
    firebaseAdminReady = true;
    console.log('[AUTH] Firebase Admin initialized with service account key.');
  } else if (projectId) {
    admin.initializeApp({
      projectId,
    });
    firebaseAdminInitialized = true;
    console.warn(
      `[AUTH] Firebase Admin initialized with project ID only (${projectId}); no credential was loaded, so ID-token verification will fail. Set FIREBASE_SERVICE_ACCOUNT_BASE64 or GOOGLE_APPLICATION_CREDENTIALS.`
    );
  } else {
    console.warn('[AUTH] Firebase Admin SDK not initialized: No serviceAccountKey.json or FIREBASE_PROJECT_ID found.');
  }
} catch (adminErr: any) {
  console.warn('[AUTH] Warning initializing Firebase Admin:', adminErr?.message || adminErr);
}

import { resolveTenantFromHostname, setRuntimeDynamicTenants, setRuntimeTenantDocs } from './src/config/tenantRegistry';
import type { TenantDomainConfig } from './src/config/tenantRegistry';
import { getCountryPreset } from './src/config/countryPresets';

const getDynamicTenantsPath = () =>
  process.env.DYNAMIC_TENANTS_PATH || path.resolve(__dirname, 'src/config/dynamicTenants.json');

let dynamicTenantsMtime = 0;

// Applies tenants written to disk after module load, so provisioning takes effect
// without a restart. Cheap: one stat() per request, re-read only on mtime change.
let tenantDocsCache: TenantDomainConfig[] = [];
let tenantDocsLoadedAt = 0;
let tenantDocsLoading = false;

// Firestore is the tenant source of truth; the static registry is only a bootstrap fallback.
async function refreshTenantDocs(force = false): Promise<void> {
  if (!firebaseAdminReady || tenantDocsLoading) return;
  if (!force && Date.now() - tenantDocsLoadedAt < 30000) return;

  tenantDocsLoading = true;
  try {
    const snapshot = await admin.firestore().collection('tenants').get();
    tenantDocsCache = snapshot.docs.map((doc) => ({
      ...(doc.data() as any),
      tenantId: doc.id,
    })) as TenantDomainConfig[];
    setRuntimeTenantDocs(tenantDocsCache);
    tenantDocsLoadedAt = Date.now();
  } catch (error: any) {
    console.warn('[TENANTS] Could not load Firestore tenant registry:', error?.message || error);
  } finally {
    tenantDocsLoading = false;
  }
}
function refreshDynamicTenants(): void {
  const dynamicPath = getDynamicTenantsPath();
  try {
    const mtime = fs.statSync(dynamicPath).mtimeMs;
    if (mtime === dynamicTenantsMtime) return;
    const parsed = JSON.parse(fs.readFileSync(dynamicPath, 'utf8'));
    setRuntimeDynamicTenants(Array.isArray(parsed) ? parsed : []);
    dynamicTenantsMtime = mtime;
  } catch {
    // Keep the last known registry if the file is missing or unreadable.
  }
}
// Extract and resolve tenant from incoming Host / X-Forwarded-Host headers
const getRequestHostTenant = (req: express.Request) => {
  refreshDynamicTenants();
  void refreshTenantDocs();
  const host = getRequestHostname(req);
  return resolveTenantFromHostname(host);
};

// Resolve identity from verified, server-set claims only.
// Never from request headers: those are client-controlled.
const VALID_ROLES = new Set(['admin', 'registrar', 'teacher', 'parent', 'super_admin']);

const isPlatformOwner = (user: any): boolean =>
  Boolean(
    user &&
      (user.role === 'super_admin' ||
        (user.email_verified === true &&
          typeof user.email === 'string' &&
          PLATFORM_OWNER_EMAILS.includes(user.email.toLowerCase())))
  );

const resolveServerIdentity = (
  decoded: any
): { role: string; tenantId: string } | null => {
  // Claims are set only by the Admin SDK. The Firestore profile is intentionally
  // NOT trusted here: firestore.rules lets a user create their own profile with
  // an arbitrary role, which would turn self-signup into privilege escalation.
  const claimRole = typeof decoded?.role === 'string' ? decoded.role : '';
  const claimTenant = typeof decoded?.tenantId === 'string' ? decoded.tenantId : '';
  if (VALID_ROLES.has(claimRole) && claimTenant) {
    return { role: claimRole, tenantId: claimTenant };
  }
  return null;
};

const authenticateRequest = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const route = (req.path || '').toLowerCase();

  // Allow static assets, SPA pages, Vite HMR, and health checks freely
  if (isPublicRoute(route)) {
    return next();
  }

  // Domain-level verification: Block requests from unknown or inactive tenant domains
  const hostResolution = getRequestHostTenant(req);
  if (hostResolution.status === 'unknown_domain') {
    return res.status(404).json({
      error: `Unknown or unconfigured school domain: ${hostResolution.normalizedHostname}`,
      code: 'UNKNOWN_TENANT_DOMAIN',
    });
  }
  if (hostResolution.status === 'inactive_tenant') {
    return res.status(403).json({
      error: `School institution is currently inactive: ${hostResolution.normalizedHostname}`,
      code: 'INACTIVE_TENANT_DOMAIN',
    });
  }

  (req as any).hostTenant = hostResolution;

  const authHeader = req.get('authorization') || '';
  const bearerValue = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!bearerValue) {
    return res.status(401).json({ error: 'Unauthorized: bearer credential is required.' });
  }

  // Explicit local development credential. Disabled in production, and the role
  // and tenant come from the environment, never from client headers.
  if (ALLOW_DEV_AUTH && SHARED_AUTH_VALUE && bearerValue === SHARED_AUTH_VALUE) {
    const devRole = VALID_ROLES.has(DEV_AUTH_ROLE) ? DEV_AUTH_ROLE : 'teacher';
    (req as any).user = {
      uid: 'dev-user',
      email: 'dev@school.local',
      role: devRole,
      tenantId:
        DEV_AUTH_TENANT ||
        (hostResolution.status === 'resolved' ? hostResolution.tenantId : 'school-1'),
    };
    return next();
  }

  if (!firebaseAdminReady) {
    return res.status(503).json({
      error: 'Authentication is not configured on this server.',
      code: 'AUTH_NOT_CONFIGURED',
    });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(bearerValue);
    const identity = resolveServerIdentity(decoded);

    if (!identity) {
      return res.status(403).json({
        error: 'No role claim is assigned to this account. Run the claims backfill (scripts/backfill-user-claims.mjs).',
        code: 'NO_ROLE_ASSIGNED',
      });
    }

    (req as any).user = {
      ...decoded,
      role: identity.role,
      tenantId: identity.tenantId,
    };
    return next();
  } catch (verifyError: any) {
    console.warn('[AUTH] Credential verification failed:', verifyError?.code || verifyError?.message);
    return res.status(401).json({
      error: 'Unauthorized: invalid or expired credential.',
      code: 'INVALID_CREDENTIAL',
    });
  }
};

// RBAC middleware. `super_admin` is the only implicit pass; `admin` must be listed explicitly.
const requireRole = (allowedRoles: string[]) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: authentication required.' });
    }
    if (user.role === 'super_admin' || allowedRoles.includes(user.role)) {
      return next();
    }
    return res.status(403).json({
      error: `Forbidden: role '${user.role}' lacks required permissions. Allowed roles: [${allowedRoles.join(', ')}]`,
    });
  };
};

const requirePlatformOwner = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: authentication required.' });
  }
  if (!isPlatformOwner(user)) {
    return res.status(403).json({
      error: 'Forbidden: platform owner privileges are required.',
      code: 'PLATFORM_OWNER_REQUIRED',
    });
  }
  return next();
};

// Multi-Tenant Middleware: Validate domain and tenant isolation
const requireTenant = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as any).user;
  const hostTenant = (req as any).hostTenant;

  // 1. Enforce that if request came via a specific school domain, user must belong to that school
  if (hostTenant && hostTenant.status === 'resolved' && user) {
    if (!isPlatformOwner(user) && user.tenantId !== hostTenant.tenantId) {
      return res.status(403).json({
        error: `Forbidden: cross-tenant access denied. Your account belongs to '${user.tenantId}' but the request was made on '${hostTenant.config?.nameAr || hostTenant.tenantId}' domain.`,
        code: 'TENANT_DOMAIN_MISMATCH',
      });
    }
  }

  // 2. Enforce target payload tenantId matches user tenant (platform owners excepted)
  const targetTenantId = req.body?.tenantId || req.query?.tenantId;
  if (targetTenantId && user?.tenantId && !isPlatformOwner(user)) {
    if (targetTenantId !== user.tenantId) {
      return res.status(403).json({
        error: `Forbidden: multi-tenant violation. Tenant '${user.tenantId}' cannot perform actions for tenant '${targetTenantId}'.`,
      });
    }
  }
  next();
};// Rate limiters per endpoint (H2 requirement)
const apiHealthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests to health endpoint.' },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Chat rate limit exceeded (max 20 requests per minute). Please slow down.' },
});

const analyzeImageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Image analysis rate limit exceeded (max 10 requests per minute). Please slow down.' },
});

const dailyDigestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Daily digest rate limit exceeded. Please slow down.' },
});

const notificationDispatchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Notification dispatch rate limit exceeded. Please slow down.' },
});

app.use('/api/health', apiHealthLimiter);
app.use('/api/chat', chatLimiter);
app.use('/api/analyze-image', analyzeImageLimiter);
app.use('/api/daily-digest', dailyDigestLimiter);
app.use('/api/notifications', notificationDispatchLimiter);
app.use(authenticateRequest);
app.use(requireTenant);

// Initialize GoogleGenAI SDK with required telemetry header
const geminiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: geminiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const sanitizeText = (value: unknown, fallback = ''): string => {
  if (typeof value !== 'string') return fallback;
  return value.trim().slice(0, 4000);
};

const ensureJsonObject = (value: any, fallback: Record<string, any> = {}) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return fallback;
};

// Loads the per-school messaging gateway configuration from the admin-only
// settings_private/{tenantId} document. Returns null when the platform lacks
// privileged Firestore access or the school has not configured a gateway, so the
// caller can fail closed instead of pretending a message was sent.
async function loadMessagingGatewayConfig(
  tenantId: string
): Promise<SchoolMessagingGatewayConfig | null> {
  if (!firebaseAdminReady) return null;
  try {
    const snapshot = await admin.firestore().doc(`settings_private/${tenantId}`).get();
    if (!snapshot.exists) return null;
    const gateway = (snapshot.data() as any)?.messagingGateway;
    if (!gateway || typeof gateway !== 'object') return null;
    return gateway as SchoolMessagingGatewayConfig;
  } catch (error: any) {
    console.warn(`[GATEWAY:${tenantId}] Could not load messaging gateway config:`, error?.message || error);
    return null;
  }
}

// Helper to get GoogleGenAI client for a specific tenant or system default
function getGenAIClientForTenant(tenantId?: string): { client: GoogleGenAI; keySource: 'tenant' | 'system' | 'none' } {
  // 1. Check custom school/tenant API key (AES-256 decrypted)
  if (tenantId) {
    const customTenantKey = getTenantApiKey(tenantId);
    if (customTenantKey && customTenantKey.trim() !== '' && customTenantKey !== 'your-gemini-key-here') {
      return {
        client: new GoogleGenAI({
          apiKey: customTenantKey.trim(),
          httpOptions: { headers: { 'User-Agent': 'aistudio-build-tenant' } },
        }),
        keySource: 'tenant',
      };
    }
  }

  // 2. Fall back to system-wide default key from .env (Policy Option A)
  const defaultKey = process.env.GEMINI_API_KEY || '';
  if (defaultKey && defaultKey.trim() !== '' && defaultKey !== 'your-gemini-key-here') {
    return {
      client: new GoogleGenAI({
        apiKey: defaultKey.trim(),
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      }),
      keySource: 'system',
    };
  }

  return { client: ai, keySource: 'none' };
}

// Helper for model calling with per-tenant key and graceful fallback
async function callGeminiWithFallback(
  modelCandidates: string[],
  promptPayload: any,
  tenantId?: string
): Promise<{ text: string; modelUsed: string; keySource: 'tenant' | 'system' } | null> {
  const { client: activeAi, keySource } = getGenAIClientForTenant(tenantId);
  if (keySource === 'none') {
    return null;
  }

  let lastError: any = null;
  for (const model of modelCandidates) {
    try {
      const response = await activeAi.models.generateContent({
        model,
        ...promptPayload,
      });
      if (response && response.text) {
        return { text: response.text, modelUsed: model, keySource };
      }
    } catch (err: any) {
      console.warn(`[TENANT-AI:${tenantId || 'system'}] Model ${model} failed, trying next candidate. Error:`, err?.message || err);
      lastError = err;
    }
  }
  return null;
}

// 1. Multi-turn Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, role = 'counselor', modelPreference = 'gemini-3.5-flash' } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const cleanedMessages = messages
      .filter((m: any) => m && typeof m === 'object')
      .map((m: any) => ({
        role: sanitizeText(m.role, 'user'),
        content: sanitizeText(m.content, ''),
      }))
      .filter((m) => m.content.length > 0)
      .slice(0, 20);

    if (cleanedMessages.length === 0) {
      return res.status(400).json({ error: 'At least one valid message is required.' });
    }

    let systemInstruction = `أنت المساعد الذكي المعتمد لنظام الحضور والغياب المدرسي "مدرستي حضور". تجيب باللغة العربية بوضوح واحترافية.`;

    if (role === 'counselor') {
      systemInstruction = `أنت "الأخصائي الاجتماعي والمستشار المدرسي" لنظام الحضور المدرسي. 
تتخصص في:
1. دراسة أسباب الغياب المتكرر والهروب من الحصص واقتراح خطط علاجية تربوية تدريجية.
2. تفسير لوائح السلوك والمواظبة الوزارية وحساب نسب الحرمان والإنذارات الرسمية.
3. صياغة خطابات ودية واحترافية موجهة لأولياء الأمور لتعزيز الشراكة بين الأسرة والمدرسة.
أجب بتنظيم واضح، نقاط محددة، واقترح حلولاً عملية قابلة للتطبيق داخل المدرسة.`;
    } else if (role === 'teacher_fast') {
      systemInstruction = `أنت "مساعد المعلم السريع للحصص والصفوف".
مهمتك:
1. صياغة رسائل SMS سريعة وموجزة لأولياء الأمور لإبلاغهم بغياب أو تأخر الطالب دون انتهاك الخصوصية.
2. إعداد ملخصات سريعة لحالات حضور الفصل لحصة معينة.
3. تقديم نصائح فورية لإدارة وقت تفقد الحضور دون هدر وقت الحصة الدراسية.
اجعل إجاباتك موجزة وسريعة ونقطية ومباشرة.`;
    } else if (role === 'policy_analyst') {
      systemInstruction = `أنت "المحلل الإحصائي وخبير سياسات الانضباط المدرسي".
تتخصص في:
1. تحليل اتجاهات الغياب (غياب ما قبل الإجازات، غياب أيام محددة كالأحد أو الخميس، فصول ذات نسب غياب مرتفعة).
2. اقتراح مبادرات تشجيعية (جوائز الحضور المثالي، منافسات بين الفصول).
3. تقييم أثر الأعذار الطبية الوهمية والتحقق من مصداقيتها.
قدم تقارير تحليلية مبنية على البيانات والتفكير المنطقي المتعمق.`;
    }

    const primaryModel = modelPreference === 'gemini-3.1-pro-preview'
      ? 'gemini-3.1-pro-preview'
      : modelPreference === 'gemini-3.1-flash-lite'
        ? 'gemini-3.5-flash-lite'
        : 'gemini-3.5-flash';

    const modelCandidates = [
      primaryModel,
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.7-flash',
      'gemini-3.8-flash',
      'gemini-3.1-pro-preview',
    ].filter((v, i, a) => a.indexOf(v) === i);

    const formattedContents = cleanedMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const tenantId = (req as any).user?.tenantId || (req as any).hostTenant?.tenantId || DEFAULT_TENANT_ID;

    // Attempt Live Gemini call if API key exists (Tenant key takes priority, then system key)
    const liveResult = await callGeminiWithFallback(
      modelCandidates,
      {
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      },
      tenantId
    );

    if (liveResult && liveResult.text) {
      return res.json({
        reply: liveResult.text,
        modelUsed: liveResult.modelUsed,
        keySource: liveResult.keySource,
      });
    }

    return res.status(503).json({
      success: false,
      code: 'AI_UNAVAILABLE',
      error: 'The AI service is unavailable. No response was generated.',
    });
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    return res.status(502).json({
      success: false,
      code: 'AI_ERROR',
      error: 'The AI service failed to respond.',
    });
  }
});

// 2. Image Analysis Endpoint (Analyze medical excuse letters, doctor notes, rosters)
app.post('/api/analyze-image', async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      expectedStudentName,
      expectedAbsenceDate,
      studentGrade,
      promptCustom,
    } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimeTypes.includes(String(mimeType))) {
      return res.status(400).json({ error: 'Unsupported mime type. Allowed: JPEG, PNG, WEBP, PDF' });
    }

    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9.+/-]+;base64,/, '');
    const MAX_BASE64_LENGTH = 7 * 1024 * 1024;
    if (cleanBase64.length < 100) {
      return res.status(400).json({ error: 'Image payload is empty or too short.' });
    }
    if (cleanBase64.length > MAX_BASE64_LENGTH) {
      return res.status(413).json({ error: 'Image payload exceeds maximum allowed size of 5 MB.' });
    }

    // Verify magic bytes from decoded binary header
    try {
      const headerBuffer = Buffer.from(cleanBase64.slice(0, 32), 'base64');
      const isJpeg = headerBuffer[0] === 0xff && headerBuffer[1] === 0xd8;
      const isPng = headerBuffer[0] === 0x89 && headerBuffer[1] === 0x50 && headerBuffer[2] === 0x4e && headerBuffer[3] === 0x47;
      const isPdf = headerBuffer[0] === 0x25 && headerBuffer[1] === 0x50 && headerBuffer[2] === 0x44 && headerBuffer[3] === 0x46;
      const isWebp = headerBuffer.slice(0, 4).toString('ascii') === 'RIFF' && headerBuffer.slice(8, 12).toString('ascii') === 'WEBP';

      if (!isJpeg && !isPng && !isPdf && !isWebp) {
        return res.status(400).json({ error: 'Invalid file content: signature does not match allowed image/pdf formats.' });
      }
    } catch {
      return res.status(400).json({ error: 'Corrupted or unreadable base64 payload.' });
    }

    const expectedStudent = sanitizeText(expectedStudentName, 'غير محدد');
    const expectedDate = sanitizeText(expectedAbsenceDate, 'غير محدد');
    const gradeText = sanitizeText(studentGrade, 'غير محدد');
    const customPrompt = sanitizeText(promptCustom, '');

    const defaultPrompt = `أنت خبير التدقيق الجنائي المكتبي والتحقق من الوثائق والتقارير الطبية المدرسية. قم بفحص العذر الطبي واستخراج البيانات بصيغة JSON.`;
    const promptText = customPrompt ? `${defaultPrompt}\n\nملاحظات إضافية وتفاصيل سياق: ${customPrompt}` : defaultPrompt;

    const modelCandidates = [
      'gemini-3.5-flash',
      'gemini-3.7-flash',
      'gemini-3.8-flash',
      'gemini-3.5-flash-lite',
    ];

    const tenantId = (req as any).user?.tenantId || (req as any).hostTenant?.tenantId || DEFAULT_TENANT_ID;

    const liveResult = await callGeminiWithFallback(
      modelCandidates,
      {
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            { text: promptText },
          ],
        },
        config: {
          responseMimeType: 'application/json',
        },
      },
      tenantId
    );

    if (liveResult && liveResult.text) {
      let parsedJson = null;
      try {
        parsedJson = JSON.parse(liveResult.text);
      } catch (parseErr) {
        const jsonMatch = liveResult.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedJson = JSON.parse(jsonMatch[0]);
        } else {
          parsedJson = { rawAnalysis: liveResult.text };
        }
      }

      return res.json({
        analysis: parsedJson,
        rawText: liveResult.text,
        modelUsed: liveResult.modelUsed,
      });
    }

    return res.status(503).json({
      success: false,
      code: 'AI_UNAVAILABLE',
      error: 'Document analysis is unavailable. The document was not analysed or approved.',
    });
  } catch (err: any) {
    console.error('Error in /api/analyze-image:', err);
    res.status(500).json({
      error: 'فشل في تحليل صورة المستند',
      details: 'Unknown error',
    });
  }
});

// 3. Daily Email Digest - AI Morning Executive Briefing Endpoint (Protected: Admin & Registrar)
app.post('/api/daily-digest/generate-briefing', requireRole(['admin', 'registrar']), requireTenant, async (req, res) => {
  try {
    const {
      tenantName = 'مدرسة الأندلس النموذجية',
      date = new Date().toISOString().split('T')[0],
      overallAttendanceRate = 94.5,
      totalStudents = 120,
      anomalies = [],
      pendingJustificationsCount = 2,
      pendingIrregularCount = 1,
      highRiskStudents = [],
    } = req.body;

    const anomaliesSummary = Array.isArray(anomalies) && anomalies.length > 0
      ? anomalies.map((a: any) => `- [${a.severity}] ${sanitizeText(a.titleAr, 'شذوذ')} : ${sanitizeText(a.descriptionAr, 'لا يوجد وصف')}`).join('\n')
      : 'لا توجد شذوذات غير اعتيادية مسجلة هذا الصباح.';

    const highRiskSummary = Array.isArray(highRiskStudents) && highRiskStudents.length > 0
      ? highRiskStudents.map((s: any) => `- الطالب: ${sanitizeText(s.name, 'طالب')} (${sanitizeText(s.className, 'غير محدد')}) | غياب: ${Number(s.totalAbsences || 0)} | مستوى الخطر: ${sanitizeText(s.riskTier, 'غير محدد')}`).join('\n')
      : 'لا يوجد طلاب جدد في النطاق الحرج حالياً.';

    const promptText = `أنت المستشار التنفيذي الأول لقيادة المدارس ونظم الحضور والغياب الذكية "مدرستي حضور".
المطلوب إعداد "موجز الإدارة الصباحي اليومي".

بيانات المدرسة واليوم:
- اسم المنشأة: ${sanitizeText(tenantName, 'مدرسة')}
- التاريخ: ${sanitizeText(date, new Date().toISOString().split('T')[0])}
- نسبة الحضور التراكمية: ${Number(overallAttendanceRate) || 0}% (إجمالي الطلاب: ${Number(totalStudents) || 0})
- شذوذات وتناقضات الحضور المرصودة:
${anomaliesSummary}
- الأعذار الطبية المعلقة بانتظار الاعتماد: ${Number(pendingJustificationsCount) || 0} عذر (منها ${Number(pendingIrregularCount) || 0} عذر مشبوه)
- قائمة الطلاب المعرضين لخطر الحرمان / الإنذار النهائي:
${highRiskSummary}

قم بصياغة تقرير موجز تنفيذي مركز باللغة العربية الفصحى بصيغة JSON حصراً بهذا المخطط:
{
  "headline": "عنوان تنفيذي موجز وجذاب",
  "urgencyLevel": "critical" | "elevated" | "normal",
  "executiveSummary": "فقرة مكثفة",
  "keyPriorities": ["الإجراء 1", "الإجراء 2", "الإجراء 3"],
  "counselorDirectives": ["التوجيه 1", "التوجيه 2"]
}
`;

    const tenantId = (req as any).user?.tenantId || (req as any).hostTenant?.tenantId || DEFAULT_TENANT_ID;

    const result = await callGeminiWithFallback(
      ['gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.8-flash'],
      {
        contents: {
          parts: [{ text: promptText }],
        },
        config: {
          responseMimeType: 'application/json',
        },
      },
      tenantId
    );

    if (!result || !result.text) {
      return res.status(503).json({
        success: false,
        code: 'AI_UNAVAILABLE',
        error: 'The AI morning briefing could not be generated. No briefing was produced.',
      });
    }

    let briefingJson: any = null;
    try {
      briefingJson = JSON.parse(result.text);
    } catch {
      const match = result.text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          briefingJson = JSON.parse(match[0]);
        } catch {
          briefingJson = null;
        }
      }
    }

    if (!briefingJson || typeof briefingJson !== 'object') {
      return res.status(502).json({
        success: false,
        code: 'AI_INVALID_RESPONSE',
        error: 'The AI provider returned a briefing that could not be parsed.',
      });
    }

    res.json({
      success: true,
      briefing: briefingJson,
      modelUsed: result.modelUsed,
    });
  } catch (err: any) {
    console.error('Error generating daily AI briefing:', err?.message || err);
    res.status(503).json({
      success: false,
      code: 'AI_UNAVAILABLE',
      error: 'The AI morning briefing is currently unavailable.',
      details: 'Unknown error',
    });
  }
});

// 4. Daily Email Digest - Dispatch Endpoint (Protected: Admin & Registrar)
app.post('/api/daily-digest/dispatch', requireRole(['admin', 'registrar']), requireTenant, async (req, res) => {
  try {
    const { recipients = [], subject, htmlContent, scheduledTime = '06:45' } = req.body;
    const tenantId = (req as any).user?.tenantId || (req as any).hostTenant?.tenantId || DEFAULT_TENANT_ID;

    const validRecipients = Array.isArray(recipients)
      ? recipients.filter((r) => typeof r === 'string' && r.includes('@')).slice(0, 50)
      : [];

    if (validRecipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid email recipients were provided for the daily digest.',
      });
    }

    const safeSubject = sanitizeText(subject, 'Daily Digest');
    const safeHtml = typeof htmlContent === 'string' ? htmlContent.slice(0, 200000) : '';
    if (!safeHtml) {
      return res.status(400).json({ success: false, error: 'The daily digest email body is empty.' });
    }

    const gateway = await loadMessagingGatewayConfig(tenantId);
    if (!gateway || !gateway.emailEnabled || !gateway.emailProvider) {
      return res.status(503).json({
        success: false,
        code: 'EMAIL_NOT_CONFIGURED',
        error: 'No email transport is configured for this school. The daily digest was not sent.',
      });
    }

    const dispatchId = `digest-dispatch-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const outcome = await sendEmail({
      provider: gateway.emailProvider,
      to: validRecipients,
      subject: safeSubject,
      html: safeHtml,
      fromEmail: gateway.fromEmail,
      fromName: gateway.fromName,
      smtpHost: gateway.smtpHost,
      smtpPort: gateway.smtpPort,
      smtpSecure: gateway.smtpSecure,
      smtpUser: gateway.smtpUser,
      smtpPass: gateway.smtpPass,
      apiKey: gateway.emailApiKey,
    });

    if (!outcome.ok) {
      console.error(`[DAILY-EMAIL-DIGEST] Dispatch failed via ${gateway.emailProvider}:`, outcome.error);
      return res.status(502).json({
        success: false,
        code: 'EMAIL_DISPATCH_FAILED',
        error: outcome.error || 'The email provider rejected the daily digest.',
      });
    }

    console.log(`[DAILY-EMAIL-DIGEST] Dispatched "${safeSubject}" to ${validRecipients.length} recipients via ${outcome.provider}.`);

    res.json({
      success: true,
      dispatchId,
      dispatchedAt: timestamp,
      scheduledTime,
      recipientsCount: validRecipients.length,
      recipients: validRecipients,
      subject: safeSubject,
      status: 'delivered',
      provider: outcome.provider,
      receiptId: outcome.receiptId,
      message: `تم إرسال النشرة الصباحية اليومية بنجاح إلى ${validRecipients.length} من قيادات المدرسة عبر البريد الإلكتروني.`,
    });
  } catch (err: any) {
    console.error('Error dispatching daily email digest:', err);
    res.status(500).json({
      error: 'فشل في إرسال النشرة الصباحية',
      details: 'Unknown error',
    });
  }
});

/**
 * 4. Parent Communication & Notification Outbox Gateway Dispatch Route
 * Protected by RBAC: Only 'admin', 'registrar', and 'super_admin' can dispatch notifications.
 * Teachers and parents are strictly rejected with 403 Forbidden.
 * Enforces multi-tenant isolation against cross-tenant notification injection.
 */
app.post(
  '/api/notifications/dispatch',
  requireRole(['admin', 'registrar', 'super_admin']),
  requireTenant,
  async (req, res) => {
    try {
      const user = (req as any).user;
      const tenantId = user?.tenantId || (req as any).hostTenant?.tenantId || req.body?.tenantId || DEFAULT_TENANT_ID;
      const { notifications: rawList, channel = 'WhatsApp' } = req.body;

      if (!rawList || !Array.isArray(rawList) || rawList.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing or empty notifications array payload.',
        });
      }

      // Enforce multi-tenant safety: Ensure all notifications belong to the user's school (unless super_admin)
      if (user.role !== 'super_admin') {
        const invalidTenantItem = rawList.find((n: any) => n.tenantId && n.tenantId !== tenantId);
        if (invalidTenantItem) {
          return res.status(403).json({
            success: false,
            error: `Cross-tenant dispatch forbidden. Item belongs to '${invalidTenantItem.tenantId}', but authenticated user belongs to '${tenantId}'.`,
          });
        }
      }

      const gateway = await loadMessagingGatewayConfig(tenantId);
      if (!gateway) {
        return res.status(503).json({
          success: false,
          code: 'GATEWAY_NOT_CONFIGURED',
          error: 'No messaging gateway is configured. Notifications were not sent.',
        });
      }

      type ItemResult = {
        id: string;
        status: 'sent' | 'failed' | 'manual';
        gatewayReceiptId?: string;
        gatewayProvider?: string;
        sentAt?: string;
        errorReason?: string;
      };

      const items = rawList.slice(0, 200) as any[];
      const results: ItemResult[] = [];

      for (const raw of items) {
        const id = sanitizeText(raw?.id, '');
        const recipientPhone = sanitizeText(raw?.recipientPhone, '');
        const messageText = sanitizeText(raw?.messageText, '');
        const itemChannel: 'SMS' | 'WhatsApp' = raw?.channel === 'SMS' || channel === 'SMS' ? 'SMS' : 'WhatsApp';

        if (!id || !recipientPhone || !messageText) {
          results.push({ id: id || 'unknown', status: 'failed', errorReason: 'Notification is missing an id, recipient phone, or message body.' });
          continue;
        }

        if (itemChannel === 'SMS') {
          if (!gateway.enableSmsNotifications) {
            results.push({ id, status: 'failed', errorReason: 'SMS notifications are not enabled for this school.' });
            continue;
          }
          const outcome = await sendSms({
            provider: gateway.smsProvider,
            to: recipientPhone,
            body: messageText,
            senderId: gateway.smsSenderId,
            senderPhone: gateway.smsSenderPhone,
            apiKey: gateway.smsApiKey,
            apiSecret: gateway.smsApiSecret,
          });
          results.push(
            outcome.ok
              ? { id, status: 'sent', gatewayReceiptId: outcome.receiptId, gatewayProvider: outcome.provider, sentAt: new Date().toISOString() }
              : { id, status: 'failed', errorReason: outcome.error || 'SMS provider rejected the message.' }
          );
          continue;
        }

        // WhatsApp
        const mode = gateway.whatsappServiceMode || 'web_direct';
        if (mode !== 'cloud_api') {
          // WhatsApp Web direct mode is a real, human-in-the-loop send performed
          // from the outbox. It is intentionally not auto-dispatched here.
          results.push({
            id,
            status: 'manual',
            errorReason: 'WhatsApp Web direct mode: open the conversation from the outbox to send this message.',
          });
          continue;
        }
        if (!gateway.enableWhatsAppNotifications) {
          results.push({ id, status: 'failed', errorReason: 'WhatsApp notifications are not enabled for this school.' });
          continue;
        }
        const outcome = await sendWhatsAppCloudMessage({
          to: recipientPhone,
          body: messageText,
          phoneNumberId: gateway.whatsappPhoneNumberId,
          accessToken: gateway.whatsappApiToken,
        });
        results.push(
          outcome.ok
            ? { id, status: 'sent', gatewayReceiptId: outcome.receiptId, gatewayProvider: outcome.provider, sentAt: new Date().toISOString() }
            : { id, status: 'failed', errorReason: outcome.error || 'WhatsApp Cloud API rejected the message.' }
        );
      }

      const receipts = results
        .filter((r) => r.status === 'sent')
        .map((r) => ({ id: r.id, gatewayReceiptId: r.gatewayReceiptId, gatewayProvider: r.gatewayProvider, sentAt: r.sentAt }));

      return res.status(200).json({
        success: true,
        gatewayConfigured: true,
        dispatched: receipts.length,
        failed: results.filter((r) => r.status === 'failed').length,
        manual: results.filter((r) => r.status === 'manual').length,
        receipts,
        results,
      });
    } catch (err: any) {
      console.error('[NOTIFICATIONS-DISPATCH-ERROR]', err);
      res.status(500).json({
        success: false,
        error: 'فشل في إرسال الإشعارات عبر بوابة المشغل',
        details: 'Internal error',
      });
    }
  }
);

// 5. Tenant AI Configuration Management Endpoints (Protected: Admin Only)
// GET /api/tenant/ai-config - Returns sanitized metadata and masked key for the current school
app.get('/api/tenant/ai-config', requireRole(['admin']), requireTenant, (req, res) => {
  try {
    const tenantId = (req as any).user?.tenantId || (req as any).hostTenant?.tenantId || DEFAULT_TENANT_ID;
    const config = getTenantAIConfig(tenantId);
    res.json({
      success: true,
      config,
      systemHasFallbackKey: Boolean(process.env.GEMINI_API_KEY),
    });
  } catch (err: any) {
    console.error('Error fetching tenant AI config:', err);
    res.status(500).json({ error: 'Failed to fetch school AI configuration' });
  }
});

// POST /api/tenant/ai-config - Saves/encrypts school's custom Gemini API key with AES-256-GCM
app.post('/api/tenant/ai-config', requireRole(['admin']), requireTenant, async (req, res) => {
  try {
    const tenantId = (req as any).user?.tenantId || (req as any).hostTenant?.tenantId || DEFAULT_TENANT_ID;
    const { apiKey: newKey, preferredModel } = req.body;

    if (!newKey || typeof newKey !== 'string' || newKey.trim().length < 8) {
      return res.status(400).json({ error: 'مفتاح Gemini API غير صالح أو قصير جداً.' });
    }

    const savedConfig = setTenantApiKey(tenantId, newKey.trim(), preferredModel);
    console.log(`[TENANT-AI:${tenantId}] Successfully updated and encrypted Gemini API key with AES-256-GCM.`);

    res.json({
      success: true,
      message: 'تم حفظ وتشفير مفتاح Gemini الخاص بالمدرسة بنجاح بأعلى معايير الأمان (AES-256-GCM).',
      config: savedConfig,
    });
  } catch (err: any) {
    console.error('Error updating tenant AI config:', err);
    res.status(500).json({ error: 'Failed to save school AI configuration' });
  }
});

// DELETE /api/tenant/ai-config - Clears custom key (reverts to system trial key / fallback)
app.delete('/api/tenant/ai-config', requireRole(['admin']), requireTenant, (req, res) => {
  try {
    const tenantId = (req as any).user?.tenantId || (req as any).hostTenant?.tenantId || DEFAULT_TENANT_ID;
    removeTenantApiKey(tenantId);
    console.log(`[TENANT-AI:${tenantId}] Custom Gemini API key removed.`);

    res.json({
      success: true,
      message: 'تمت إزالة المفتاح الخاص بالمدرسة والرجوع للسياسة الافتراضية للنظام.',
      config: getTenantAIConfig(tenantId),
    });
  } catch (err: any) {
    console.error('Error removing tenant AI config:', err);
    res.status(500).json({ error: 'Failed to delete school AI configuration' });
  }
});

// POST /api/tenant/ai-config/test - Actively verifies connectivity to Google Gemini API
app.post('/api/tenant/ai-config/test', requireRole(['admin']), requireTenant, async (req, res) => {
  try {
    const tenantId = (req as any).user?.tenantId || (req as any).hostTenant?.tenantId || DEFAULT_TENANT_ID;
    const { testKey } = req.body;

    let keyToTest = (testKey && typeof testKey === 'string' && testKey.trim().length > 8)
      ? testKey.trim()
      : getTenantApiKey(tenantId) || process.env.GEMINI_API_KEY || '';

    if (!keyToTest) {
      return res.status(400).json({
        success: false,
        error: 'لا يوجد مفتاح مفحوص حالياً. يرجى إدخال المفتاح أولاً.',
      });
    }

    const testAi = new GoogleGenAI({
      apiKey: keyToTest,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build-test' } },
    });

    const testModels = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.7-flash', 'gemini-3.8-flash'];
    let lastError = null;

    for (const model of testModels) {
      try {
        const testRes = await testAi.models.generateContent({
          model,
          contents: 'مرحبا، تأكيد اتصال تجريبي بنظام حضور مدرستي',
        });
        if (testRes && testRes.text) {
          return res.json({
            success: true,
            status: 'verified',
            activeModel: model,
            maskedKey: maskApiKey(keyToTest),
            message: `تم التحقق بنجاح من اتصال المفتاح بخوادم Google Gemini (${model})!`,
          });
        }
      } catch (mErr: any) {
        lastError = mErr;
      }
    }

    res.status(400).json({
      success: false,
      status: 'failed',
      error: 'فشل التحقق من المفتاح من قِبل Google API',
      details: lastError?.message || 'Unknown verification error',
    });
  } catch (err: any) {
    console.error('Error in tenant ai test:', err);
    res.status(500).json({
      success: false,
      error: 'خطأ غير متوقع أثناء فحص المفتاح',
      details: 'Internal error',
    });
  }
});

app.get('/api/health', (req, res) => {
  let dynamicTenantsCount = 0;
  try {
    const dynamicPath = path.resolve(__dirname, 'src/config/dynamicTenants.json');
    if (fs.existsSync(dynamicPath)) {
      const list = JSON.parse(fs.readFileSync(dynamicPath, 'utf8'));
      dynamicTenantsCount = Array.isArray(list) ? list.length : 0;
    }
  } catch {}

  const chromePath = getSystemChromePath();

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.json({
    status: 'ok',
    appName: 'Smart School Attendance System',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    nodeVersion: process.version,
    memoryUsageMB: Math.round(process.memoryUsage().rss / (1024 * 1024)),
    services: {
      aiGemini: Boolean(geminiKey),
      pdfPuppeteer: Boolean(chromePath),
      firebaseAdmin: firebaseAdminReady,
      firebaseAdminInitialized,
      adminKeyLoaded,
      dynamicTenantsCount,
    },
  });
});

app.get('/api/readyz', (req, res) => {
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    requiresAuth: Boolean(SHARED_AUTH_VALUE),
  });
});

app.get('/api/tenant/resolve', async (req, res) => {
  refreshDynamicTenants();
  await refreshTenantDocs();
  const host = getRequestHostname(req);
  const resolution = resolveTenantFromHostname(host);
  res.json(resolution);
});

app.get('/api/tenants', async (req, res) => {
  try {
    await refreshTenantDocs();
    const dynamicPath = path.resolve(__dirname, 'src/config/dynamicTenants.json');
    let dynamicList: any[] = [];
    if (fs.existsSync(dynamicPath)) {
      dynamicList = JSON.parse(fs.readFileSync(dynamicPath, 'utf8'));
    }

    // Public projection: the pre-login tenant switcher only needs display fields.
    const mergedTenants = new Map<string, any>();
    for (const tenant of [...(Array.isArray(dynamicList) ? dynamicList : []), ...tenantDocsCache]) {
      if (tenant && tenant.tenantId) mergedTenants.set(tenant.tenantId, tenant);
    }

    const publicTenants = Array.from(mergedTenants.values()).map((tenant: any) => ({
      tenantId: typeof tenant?.tenantId === 'string' ? tenant.tenantId : '',
      subdomain: typeof tenant?.subdomain === 'string' ? tenant.subdomain : '',
      customDomains: Array.isArray(tenant?.customDomains)
        ? tenant.customDomains.filter((domain: any) => typeof domain === 'string').slice(0, 10)
        : [],
      nameAr: typeof tenant?.nameAr === 'string' ? tenant.nameAr.slice(0, 120) : '',
      nameEn: typeof tenant?.nameEn === 'string' ? tenant.nameEn.slice(0, 120) : '',
      logoText: typeof tenant?.logoText === 'string' ? tenant.logoText.slice(0, 8) : '',
      primaryColor: typeof tenant?.primaryColor === 'string' ? tenant.primaryColor : '',
      isActive: tenant?.isActive !== false,
    }));

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({ success: true, count: publicTenants.length, tenants: publicTenants });
  } catch (err: any) {
    console.error('[TENANTS-LIST-ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to read the tenant registry.' });
  }
});

app.post('/api/tenants/provision', requirePlatformOwner, async (req, res) => {
  try {
    const payload = req.body;
    const slugPattern = /^[a-z0-9][a-z0-9-]{2,31}$/;
    const hostPattern = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid tenant config payload' });
    }

    const tenantId = typeof payload.tenantId === 'string' ? payload.tenantId.trim().toLowerCase() : '';
    const subdomain = typeof payload.subdomain === 'string' ? payload.subdomain.trim().toLowerCase() : '';
    const nameAr = typeof payload.nameAr === 'string' ? payload.nameAr.trim().slice(0, 120) : '';

    if (!slugPattern.test(tenantId) || !slugPattern.test(subdomain) || !nameAr) {
      return res.status(400).json({
        success: false,
        error: 'tenantId and subdomain must be 3-32 lowercase letters, digits or hyphens; nameAr is required.',
      });
    }

    const customDomains = Array.isArray(payload.customDomains)
      ? payload.customDomains
          .filter((domain: unknown): domain is string => typeof domain === 'string' && hostPattern.test(domain))
          .map((domain: string) => domain.toLowerCase())
          .slice(0, 10)
      : [];

    const sanitized = {
      tenantId,
      subdomain,
      customDomains,
      nameAr,
      nameEn: typeof payload.nameEn === 'string' ? payload.nameEn.trim().slice(0, 120) : '',
      code: typeof payload.code === 'string' ? payload.code.trim().slice(0, 30) : '',
      cityAr: typeof payload.cityAr === 'string' ? payload.cityAr.trim().slice(0, 80) : '',
      cityEn: typeof payload.cityEn === 'string' ? payload.cityEn.trim().slice(0, 80) : '',
      academicYear: typeof payload.academicYear === 'string' ? payload.academicYear.trim().slice(0, 40) : '',
      currentTerm: typeof payload.currentTerm === 'string' ? payload.currentTerm.trim().slice(0, 60) : '',
      schoolType: typeof payload.schoolType === 'string' ? payload.schoolType.trim().slice(0, 20) : 'mixed',
      primaryColor: /^#[0-9a-fA-F]{6}$/.test(String(payload.primaryColor)) ? String(payload.primaryColor) : '#059669',
      logoText: typeof payload.logoText === 'string' ? payload.logoText.slice(0, 8) : '',
      isActive: payload.isActive !== false,
    };

    const dynamicPath = process.env.DYNAMIC_TENANTS_PATH || path.resolve(__dirname, 'src/config/dynamicTenants.json');
    let dynamicList: any[] = [];
    if (fs.existsSync(dynamicPath)) {
      try {
        dynamicList = JSON.parse(fs.readFileSync(dynamicPath, 'utf8'));
      } catch {}
    }

    const updated = [...dynamicList.filter((d: any) => d.tenantId !== sanitized.tenantId), sanitized];
    fs.writeFileSync(dynamicPath, JSON.stringify(updated, null, 2), 'utf8');
    dynamicTenantsMtime = 0;
    refreshDynamicTenants();
    if (firebaseAdminReady) {
      try {
        await admin.firestore().doc(`tenants/${sanitized.tenantId}`).set(sanitized, { merge: true });
        await refreshTenantDocs(true);
      } catch (error: any) {
        console.warn('[TENANTS] Could not persist the Firestore tenant document:', error?.message || error);
      }
    }
    console.log(`[TENANTS] Provisioned '${sanitized.tenantId}' by ${(req as any).user?.email || 'unknown'}`);
    res.json({ success: true, tenant: sanitized });
  } catch (err: any) {
    console.error('[TENANTS-PROVISION-ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to persist the tenant configuration.' });
  }
});
// Platform Owner: Intelligent & Verified Official Holidays Search Endpoint
app.post('/api/owner/holidays/search', requirePlatformOwner, async (req, res) => {
  try {
    const { country = 'المملكة العربية السعودية', academicYear = '2026-2027', tenantId } = req.body;
    const preset = getCountryPreset(country);

    // Try live AI search with Gemini if key available
    const { client: activeAi, keySource } = getGenAIClientForTenant(tenantId);
    let liveHolidays: any = null;
    let officialSource = `التقويم الرسمي المعتمد لـ (${preset.countryNameAr})`;

    if (keySource !== 'none') {
      try {
        const prompt = `أنت خبير تدقيق وتقويم رسمي معتمد لوزارات التعليم ومجالس الوزراء في الدول العربية والعالمية.
ابحث واستخرج التقويم الرسمي المعتمد لـ:
الدولة: ${country}
العام الدراسي: ${academicYear}

المطلوب: إرجاع قائمة العطلات الرسمية المعتمدة (الأعياد الدينية، الأيام الوطنية، إجازات منتصف ونهاية الفصول، ونهايات الأسبوع المطولة إن وجدت) مع التأكد التام من صحة التواريخ والأسماء.
أرجع الإجابة فقط بصيغة JSON نظيفة وصحيحة وبدون أي نصوص أخرى:
{
  "source": "اسم الوزارة أو الجهة الرسمية المصدرة للتقويم في هذه الدولة",
  "weekendDays": [5, 6],
  "ministryHeaderAr": "الترويسة الرسمية المعتمدة للوزارة والجهة التعليمية",
  "holidays": [
    {
      "id": "hol-unique-id",
      "nameAr": "اسم العطلة الرسمي بالعربية",
      "nameEn": "Official Holiday Name in English",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "type": "official",
      "notes": "تفاصيل وملاحظة الاعتماد الرسمي"
    }
  ]
}`;

        const modelCandidates = ['gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.8-flash'];
        for (const model of modelCandidates) {
          try {
            const aiRes = await activeAi.models.generateContent({
              model,
              contents: prompt,
            });
            if (aiRes?.text) {
              const cleaned = aiRes.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              const parsed = JSON.parse(cleaned);
              if (parsed && Array.isArray(parsed.holidays) && parsed.holidays.length > 0) {
                liveHolidays = parsed;
                officialSource = parsed.source || officialSource;
                break;
              }
            }
          } catch (modelErr) {
            // continue to next model
          }
        }
      } catch (aiErr) {
        console.warn('[HOLIDAY-SEARCH-AI] Gemini search fallback to preset:', aiErr);
      }
    }

    if (liveHolidays && liveHolidays.holidays) {
      return res.json({
        success: true,
        country: preset.countryNameAr,
        source: officialSource,
        verifiedBy: 'gemini_verified',
        weekendDays: liveHolidays.weekendDays || preset.defaultWeekendDays,
        ministryHeaderAr: liveHolidays.ministryHeaderAr || preset.ministryHeaderAr,
        holidays: liveHolidays.holidays.map((h: any, idx: number) => ({
          id: h.id || `hol-live-${Date.now()}-${idx}`,
          nameAr: h.nameAr || `إجازة ${idx + 1}`,
          nameEn: h.nameEn,
          startDate: h.startDate,
          endDate: h.endDate || h.startDate,
          type: h.type || 'official',
          notes: h.notes || `معتمد من ${officialSource}`,
        })),
      });
    }

    // Default high-accuracy fallback from verified countryPresets
    return res.json({
      success: true,
      country: preset.countryNameAr,
      source: `التقويم الرسمي المعتمد لوزارة التعليم - ${preset.countryNameAr}`,
      verifiedBy: 'official_preset',
      weekendDays: preset.defaultWeekendDays,
      ministryHeaderAr: preset.ministryHeaderAr,
      holidays: preset.officialHolidays,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to search holidays' });
  }
});

// Vite Middleware for Development / Static for Production
function serveStaticBundle() {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist/index.html'));
  });
}

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    serveStaticBundle();
  } else {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          watch: {
            ignored: ['**/*.docx', '**/*.vsdx', '**/*.xlsx', '**/*.pptx', '**/~$*', '**/*.pdf', '**/*.png', '**/*.jpg', '**/*.tmp', '**/*.log', '**/.git/**', '**/scratch/**'],
          },
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('Vite dev middleware unavailable; serving the static build from dist/ instead. Build the client with `npm run build` if dist/ is missing.', err instanceof Error ? err.message : err);
      serveStaticBundle();
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart School Attendance Server running on http://0.0.0.0:${PORT}`);
    if (!SHARED_AUTH_VALUE) {
      console.warn('Security warning: no shared bearer value is configured. Set APP_AUTH_TOKEN for local development only.');
    }
  });
}

// Only auto-start when executed directly (`node server.js` / `tsx server.ts`).
// Importing this module (e.g. from integration tests) must not bind a port.
const isDirectRun = (() => {
  try {
    return !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
  } catch {
    return false;
  }
})();

if (isDirectRun) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}

export { app, startServer };
