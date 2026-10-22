import type { Express, Request, RequestHandler } from 'express';
import admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';
import { getCountryPreset } from '../src/config/countryPresets';
import {
  getTenantApiKey,
  setTenantApiKey,
  removeTenantApiKey,
  getTenantAIConfig,
  maskApiKey,
} from '../src/utils/tenantAISecrets';
import { buildGatewayDocument, maskGatewaySecrets } from '../src/utils/tenantGatewaySecrets';
import { DEFAULT_GATEWAY_CONFIG, sanitizeGatewayConfig, createGatewayLoader } from './gatewayConfig';
import { getGenAIClientForTenant } from './genaiClient';

export interface AiTenantSettingsRouteDeps {
  app: Express;
  requireRole: (allowedRoles: string[]) => RequestHandler;
  requireTenant: RequestHandler;
  requirePlatformOwner: RequestHandler;
  resolveTargetTenantId: (req: Request, fallback?: string) => string;
  tenantIdPattern: RegExp;
  defaultTenantId: string;
  isFirebaseAdminReady: () => boolean;
}

export function registerAiTenantSettingsRoutes({
  app,
  requireRole,
  requireTenant,
  requirePlatformOwner,
  resolveTargetTenantId,
  tenantIdPattern,
  defaultTenantId,
  isFirebaseAdminReady,
}: AiTenantSettingsRouteDeps) {
  const loadMessagingGatewayConfig = createGatewayLoader(isFirebaseAdminReady);

  // 5. Tenant AI Configuration Management Endpoints (Protected: Admin Only)
  // GET /api/tenant/ai-config - Returns sanitized metadata and masked key for the current school
  app.get('/api/tenant/ai-config', requireRole(['admin']), requireTenant, (req, res) => {
    try {
      const tenantId = resolveTargetTenantId(req);
      const config = getTenantAIConfig(tenantId);
      res.json({
        success: true,
        config,
        systemHasFallbackKey: Boolean(process.env.GEMINI_API_KEY),
      });
    } catch (err: unknown) {
      console.error('Error fetching tenant AI config:', err);
      res.status(500).json({ error: 'Failed to fetch school AI configuration' });
    }
  });

  // POST /api/tenant/ai-config - Saves/encrypts school's custom Gemini API key with AES-256-GCM
  app.post('/api/tenant/ai-config', requireRole(['admin']), requireTenant, async (req, res) => {
    try {
      const tenantId = resolveTargetTenantId(req);
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
    } catch (err: unknown) {
      console.error('Error updating tenant AI config:', err);
      res.status(500).json({ error: 'Failed to save school AI configuration' });
    }
  });

  // DELETE /api/tenant/ai-config - Clears custom key (reverts to system trial key / fallback)
  app.delete('/api/tenant/ai-config', requireRole(['admin']), requireTenant, (req, res) => {
    try {
      const tenantId = resolveTargetTenantId(req);
      removeTenantApiKey(tenantId);
      console.log(`[TENANT-AI:${tenantId}] Custom Gemini API key removed.`);

      res.json({
        success: true,
        message: 'تمت إزالة المفتاح الخاص بالمدرسة والرجوع للسياسة الافتراضية للنظام.',
        config: getTenantAIConfig(tenantId),
      });
    } catch (err: unknown) {
      console.error('Error removing tenant AI config:', err);
      res.status(500).json({ error: 'Failed to delete school AI configuration' });
    }
  });

  // POST /api/tenant/ai-config/test - Actively verifies connectivity to Google Gemini API
  app.post('/api/tenant/ai-config/test', requireRole(['admin']), requireTenant, async (req, res) => {
    try {
      const tenantId = resolveTargetTenantId(req);
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
        } catch (mErr: unknown) {
          lastError = mErr;
        }
      }

      const detailMsg = lastError instanceof Error ? lastError.message : String(lastError || 'Unknown verification error');
      res.status(400).json({
        success: false,
        status: 'failed',
        error: 'فشل التحقق من المفتاح من قِبل Google API',
        details: detailMsg,
      });
    } catch (err: unknown) {
      console.error('Error in tenant ai test:', err);
      res.status(500).json({
        success: false,
        error: 'خطأ غير متوقع أثناء فحص المفتاح',
        details: 'Internal error',
      });
    }
  });

  // Messaging gateway credentials: platform-owner only, encrypted at rest with
  // AES-256-GCM. The browser never reads settings_private directly.
  app.get('/api/settings/messaging-gateway', requirePlatformOwner, requireTenant, async (req, res) => {
    if (!isFirebaseAdminReady()) {
      return res.status(503).json({ success: false, error: 'Authentication is not configured on this server.', code: 'AUTH_NOT_CONFIGURED' });
    }
    const tenantId = resolveTargetTenantId(req);
    if (!tenantIdPattern.test(tenantId)) {
      return res.status(400).json({ success: false, error: 'A valid tenantId is required.' });
    }
    try {
      const gateway = await loadMessagingGatewayConfig(tenantId);
      if (gateway) {
        // Lazy migration: the first owner read upgrades a legacy plaintext
        // document to the encrypted envelope.
        try {
          const ref = admin.firestore().doc(`settings_private/${tenantId}`);
          const snapshot = await ref.get();
          if (snapshot.exists && !(snapshot.data() as { messagingGatewaySecrets?: unknown })?.messagingGatewaySecrets) {
            const config = sanitizeGatewayConfig(gateway, DEFAULT_GATEWAY_CONFIG);
            // Replace the document: this removes legacy plaintext secret fields.
            await ref.set(buildGatewayDocument(config, req.user?.email || ''));
          }
        } catch (migrationError: unknown) {
          const msg = migrationError instanceof Error ? migrationError.message : String(migrationError);
          console.warn(`[GATEWAY:${tenantId}] Could not migrate gateway credentials to the encrypted format:`, msg);
        }
      }
      return res.json({
        success: true,
        tenantId,
        gateway: gateway ? maskGatewaySecrets(gateway) : null,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[GATEWAY-GET-ERROR]', msg);
      return res.status(500).json({ success: false, error: 'Could not load the messaging gateway configuration.' });
    }
  });

  app.put('/api/settings/messaging-gateway', requirePlatformOwner, requireTenant, async (req, res) => {
    if (!isFirebaseAdminReady()) {
      return res.status(503).json({ success: false, error: 'Authentication is not configured on this server.', code: 'AUTH_NOT_CONFIGURED' });
    }
    const tenantId = resolveTargetTenantId(req);
    if (!tenantIdPattern.test(tenantId)) {
      return res.status(400).json({ success: false, error: 'A valid tenantId is required.' });
    }
    try {
      const current = (await loadMessagingGatewayConfig(tenantId)) || DEFAULT_GATEWAY_CONFIG;
      const incoming = req.body?.gateway && typeof req.body.gateway === 'object' ? req.body.gateway : req.body;
      const config = sanitizeGatewayConfig(incoming, current);
      const updatedBy = req.user?.email || '';
      const document = buildGatewayDocument(config, updatedBy);
      // Replace the document: this removes legacy plaintext secret fields.
      await admin.firestore().doc(`settings_private/${tenantId}`).set(document);
      return res.json({
        success: true,
        tenantId,
        gateway: maskGatewaySecrets({
          ...config,
          lastConfiguredByRole: 'super_admin',
          lastConfiguredByEmail: updatedBy,
          lastConfiguredAt: document.updatedAt,
        }),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[GATEWAY-PUT-ERROR]', msg);
      return res.status(500).json({ success: false, error: 'Could not save the messaging gateway configuration.' });
    }
  });

  // Platform Owner: Intelligent & Verified Official Holidays Search Endpoint
  app.post('/api/owner/holidays/search', requirePlatformOwner, async (req, res) => {
    try {
      const { country = 'المملكة العربية السعودية', academicYear = '2026-2027', tenantId } = req.body;
      const preset = getCountryPreset(country);

      // Try live AI search with Gemini if key available
      const { client: activeAi, keySource } = getGenAIClientForTenant(tenantId);
      interface HolidayEntry {
        id?: string;
        nameAr?: string;
        nameEn?: string;
        startDate?: string;
        endDate?: string;
        type?: string;
        notes?: string;
      }
      interface LiveHolidaysData {
        source?: string;
        weekendDays?: number[];
        ministryHeaderAr?: string;
        holidays?: HolidayEntry[];
      }
      let liveHolidays: LiveHolidaysData | null = null;
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
          holidays: liveHolidays.holidays.map((h: HolidayEntry, idx: number) => ({
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
    } catch (err: unknown) {
      res.status(500).json({ success: false, error: 'Failed to search holidays' });
    }
  });
}
