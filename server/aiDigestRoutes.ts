import type { Express, Request, RequestHandler } from 'express';
import admin from 'firebase-admin';
import type { AuthenticatedUser } from './types';
import { sendSms, sendWhatsAppCloudMessage, sendEmail } from '../src/utils/messagingProviders';
import { callGeminiWithFallback } from './genaiClient';
import { createGatewayLoader } from './gatewayConfig';

export interface AiDigestRouteDeps {
  app: Express;
  requireRole: (allowedRoles: string[]) => RequestHandler;
  requireTenant: RequestHandler;
  resolveTargetTenantId: (req: Request, fallback?: string) => string;
  sanitizeText: (value: unknown, fallback?: string) => string;
  isPlatformOwner: (user: AuthenticatedUser | undefined) => boolean;
  tenantIdPattern: RegExp;
  defaultTenantId: string;
  isFirebaseAdminReady: () => boolean;
}

export function registerAiDigestRoutes({
  app,
  requireRole,
  requireTenant,
  resolveTargetTenantId,
  sanitizeText,
  isPlatformOwner,
  tenantIdPattern,
  defaultTenantId,
  isFirebaseAdminReady,
}: AiDigestRouteDeps) {
  const loadMessagingGatewayConfig = createGatewayLoader(isFirebaseAdminReady);

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
        ? anomalies.map((a: unknown) => {
            const item = a as { severity?: string; titleAr?: string; descriptionAr?: string };
            return `- [${item?.severity || 'info'}] ${sanitizeText(item?.titleAr, 'شذوذ')} : ${sanitizeText(item?.descriptionAr, 'لا يوجد وصف')}`;
          }).join('\n')
        : 'لا توجد شذوذات غير اعتيادية مسجلة هذا الصباح.';

      const highRiskSummary = Array.isArray(highRiskStudents) && highRiskStudents.length > 0
        ? highRiskStudents.map((s: unknown) => {
            const item = s as { name?: string; className?: string; totalAbsences?: number; riskTier?: string };
            return `- الطالب: ${sanitizeText(item?.name, 'طالب')} (${sanitizeText(item?.className, 'غير محدد')}) | غياب: ${Number(item?.totalAbsences || 0)} | مستوى الخطر: ${sanitizeText(item?.riskTier, 'غير محدد')}`;
          }).join('\n')
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

      const tenantId = resolveTargetTenantId(req);

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

      let briefingJson: Record<string, unknown> | null = null;
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Error generating daily AI briefing:', msg);
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
      const tenantId = resolveTargetTenantId(req);

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
    } catch (err: unknown) {
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
        const user = req.user;
        const requestedTenant =
          typeof req.body?.tenantId === 'string' ? req.body.tenantId.trim().toLowerCase() : '';
        if (isPlatformOwner(user) && requestedTenant && !tenantIdPattern.test(requestedTenant)) {
          return res.status(400).json({ success: false, error: 'Invalid tenantId.' });
        }
        const tenantId =
          isPlatformOwner(user) && requestedTenant
            ? requestedTenant
            : user?.tenantId || req.hostTenant?.tenantId || defaultTenantId;
        const { notifications: rawList, channel = 'WhatsApp' } = req.body;

        if (!rawList || !Array.isArray(rawList) || rawList.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Missing or empty notifications array payload.',
          });
        }

        // Every notification must belong to the tenant being dispatched for.
        const invalidTenantItem = rawList.find((n: unknown) => {
          const item = n as { tenantId?: string };
          return item?.tenantId && item.tenantId !== tenantId;
        }) as { tenantId?: string } | undefined;
        if (invalidTenantItem) {
          return res.status(403).json({
            success: false,
            error: `Cross-tenant dispatch forbidden. Item belongs to '${invalidTenantItem.tenantId}', but this dispatch targets '${tenantId}'.`,
          });
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

        const items = rawList.slice(0, 200) as Record<string, unknown>[];
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

        // Persist the gateway outcome so the outbox state survives a reload and is
        // consistent across staff devices. Admin SDK writes own a validated tenant.
        if (isFirebaseAdminReady() && results.length > 0) {
          try {
            const batch = admin.firestore().batch();
            for (const result of results) {
              const ref = admin.firestore().doc(`notification_outbox/${result.id}`);
              const storedSnap = await ref.get();
              if (!storedSnap.exists) continue;
              const stored = storedSnap.data() || {};
              if (stored.tenantId !== tenantId) continue;
              batch.set(
                ref,
                {
                  status: result.status === 'sent' ? 'sent' : result.status === 'failed' ? 'failed' : 'pending',
                  retryCount: admin.firestore.FieldValue.increment(1),
                  errorReason: result.errorReason || null,
                  sentAt: result.sentAt || null,
                  gatewayReceiptId: result.gatewayReceiptId || null,
                  gatewayProvider: result.gatewayProvider || null,
                  updatedAt: new Date().toISOString(),
                },
                { merge: true }
              );
            }
            await batch.commit();
          } catch (persistError: unknown) {
            const msg = persistError instanceof Error ? persistError.message : String(persistError);
            console.warn('[NOTIFICATIONS] Could not persist dispatch results:', msg);
          }
        }

        return res.status(200).json({
          success: true,
          gatewayConfigured: true,
          dispatched: receipts.length,
          failed: results.filter((r) => r.status === 'failed').length,
          manual: results.filter((r) => r.status === 'manual').length,
          receipts,
          results,
        });
      } catch (err: unknown) {
        console.error('[NOTIFICATIONS-DISPATCH-ERROR]', err);
        res.status(500).json({
          success: false,
          error: 'فشل في إرسال الإشعارات عبر بوابة المشغل',
          details: 'Internal error',
        });
      }
    }
  );

}
