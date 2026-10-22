import type { Express, Request, RequestHandler } from 'express';
import { callGeminiWithFallback } from './genaiClient';

export interface AiChatRouteDeps {
  app: Express;
  requireRole: (allowedRoles: string[]) => RequestHandler;
  requireTenant: RequestHandler;
  resolveTargetTenantId: (req: Request, fallback?: string) => string;
  sanitizeText: (value: unknown, fallback?: string) => string;
}

export function registerAiChatRoutes({
  app,
  requireRole,
  requireTenant,
  resolveTargetTenantId,
  sanitizeText,
}: AiChatRouteDeps) {
  // 1. Multi-turn Chat Endpoint
  app.post('/api/chat', requireRole(['admin', 'registrar', 'super_admin']), requireTenant, async (req, res) => {
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

      const tenantId = resolveTargetTenantId(req);

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
  app.post('/api/analyze-image', requireRole(['admin', 'registrar', 'teacher']), async (req, res) => {
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

      const tenantId = resolveTargetTenantId(req);

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

}
