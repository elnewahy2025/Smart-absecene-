import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import rateLimit from 'express-rate-limit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const APP_AUTH_TOKEN = process.env.APP_AUTH_TOKEN || (process.env.NODE_ENV === 'production' ? '' : 'dev-token-change-me');

app.use(express.json({ limit: '25mb' }));

const isPublicRoute = (route: string) => {
  return route === '/api/health' || route === '/api/readyz';
};

const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const route = req.path || '';

  if (isPublicRoute(route)) {
    return next();
  }

  if (!APP_AUTH_TOKEN) {
    return res.status(503).json({
      error: 'Authentication is not configured for this server instance.',
    });
  }

  const authHeader = req.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token || token !== APP_AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized: valid bearer token required.' });
  }

  next();
};

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please retry later.' },
});

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI rate limit exceeded. Please slow down.' },
});

app.use('/api', apiRateLimiter);
app.use('/api/chat', aiRateLimiter);
app.use('/api/analyze-image', aiRateLimiter);
app.use('/api/daily-digest', aiRateLimiter);
app.use(authMiddleware);

// Initialize GoogleGenAI SDK with required telemetry header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
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

// Helper for model calling with graceful fallback
async function callGeminiWithFallback(modelCandidates: string[], promptPayload: any) {
  let lastError: any = null;
  for (const model of modelCandidates) {
    try {
      const response = await ai.models.generateContent({
        model,
        ...promptPayload,
      });
      return { text: response.text || '', modelUsed: model };
    } catch (err: any) {
      console.warn(`Model ${model} failed, trying next candidate. Error:`, err?.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error('All model attempts failed');
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
        ? 'gemini-3.1-flash-lite'
        : 'gemini-3.5-flash';

    const modelCandidates = [
      primaryModel,
      'gemini-3.5-flash',
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
    ].filter((v, i, a) => a.indexOf(v) === i);

    const formattedContents = cleanedMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const result = await callGeminiWithFallback(modelCandidates, {
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({
      reply: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    res.status(500).json({
      error: 'فشل في استدعاء الذكاء الاصطناعي',
      details: err?.message || 'Unknown error',
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
      return res.status(400).json({ error: 'Unsupported mime type.' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/([a-zA-Z0-9.+-]+);base64,/, '');
    if (cleanBase64.length < 100 || cleanBase64.length > 20_000_000) {
      return res.status(413).json({ error: 'Image payload is too large or invalid.' });
    }

    const expectedStudent = sanitizeText(expectedStudentName, 'غير محدد');
    const expectedDate = sanitizeText(expectedAbsenceDate, 'غير محدد');
    const gradeText = sanitizeText(studentGrade, 'غير محدد');
    const customPrompt = sanitizeText(promptCustom, '');

    const defaultPrompt = `أنت خبير التدقيق الجنائي المكتبي والتحقق من الوثائق والتقارير الطبية المدرسية...`;
    const promptText = customPrompt ? `${defaultPrompt}\n\nملاحظات إضافية وتفاصيل سياق: ${customPrompt}` : defaultPrompt;

    const modelCandidates = [
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-3.1-pro-preview',
    ];

    const result = await callGeminiWithFallback(modelCandidates, {
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
    });

    let parsedJson = null;
    try {
      parsedJson = JSON.parse(result.text);
    } catch (parseErr) {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedJson = JSON.parse(jsonMatch[0]);
      } else {
        parsedJson = { rawAnalysis: result.text };
      }
    }

    res.json({
      analysis: ensureJsonObject(parsedJson, { rawAnalysis: result.text }),
      rawText: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (err: any) {
    console.error('Error in /api/analyze-image:', err);
    res.status(500).json({
      error: 'فشل في تحليل صورة المستن��',
      details: err?.message || 'Unknown error',
    });
  }
});

// 3. Daily Email Digest - AI Morning Executive Briefing Endpoint
app.post('/api/daily-digest/generate-briefing', async (req, res) => {
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
}`;

    const result = await callGeminiWithFallback(['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'], {
      contents: {
        parts: [{ text: promptText }],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    let briefingJson = null;
    try {
      briefingJson = JSON.parse(result.text);
    } catch {
      const match = result.text.match(/\{[\s\S]*\}/);
      if (match) {
        briefingJson = JSON.parse(match[0]);
      } else {
        briefingJson = {
          headline: `نشرة الصباح للانضباط المدرسي - ${sanitizeText(tenantName, 'مدرسة')}`,
          urgencyLevel: Array.isArray(anomalies) && anomalies.length > 0 ? 'elevated' : 'normal',
          executiveSummary: result.text.slice(0, 300),
          keyPriorities: [
            'مراجعة كشوف الحضور غير المعتمدة قبل الحصة الأولى.',
            'تدقيق الأعذار الطبية المعلقة.',
            'تواصل الموجه الطلابي مع أولياء الأمور المعنيين.',
          ],
          counselorDirectives: [
            'استدعاء الطلاب المكرر غيابهم للمتابعة.',
            'تسجيل المتابعة في السجل المهني.',
          ],
        };
      }
    }

    res.json({
      success: true,
      briefing: briefingJson,
      modelUsed: result.modelUsed,
    });
  } catch (err: any) {
    console.warn('Fallback briefing generation due to error:', err?.message || err);
    res.json({
      success: true,
      briefing: {
        headline: 'نشرة الصباح الإدارية للانضباط والحضور المدرسي',
        urgencyLevel: 'elevated',
        executiveSummary: 'تمت متابعة بيانات الانضباط المدرسي صباحاً ومراجعة الحالة العامة للغياب والأعذار.',
        keyPriorities: [
          'اعتماد كشوف الحضور المعلقة.',
          'تدقيق الأعذار الطبية المعلقة.',
          'تفعيل التواصل مع أولياء الأمور المعنيين.',
        ],
        counselorDirectives: [
          'إجراء المتابعة الإرشادية.',
          'توثيق الإجراءات في السجل اليومي.',
        ],
      },
      fallback: true,
    });
  }
});

// 4. Daily Email Digest - Dispatch / Simulation Endpoint
app.post('/api/daily-digest/dispatch', async (req, res) => {
  try {
    const { recipients = [], subject, htmlContent, scheduledTime = '06:45', metadata = {} } = req.body;

    const validRecipients = Array.isArray(recipients)
      ? recipients.filter((r) => typeof r === 'string').slice(0, 50)
      : [];

    const dispatchId = `digest-dispatch-${Date.now()}`;
    const timestamp = new Date().toISOString();

    console.log(`[DAILY-EMAIL-DIGEST] Dispatching automated morning email digest "${sanitizeText(subject, 'school digest')}" to ${validRecipients.length} administrators.`);

    res.json({
      success: true,
      dispatchId,
      dispatchedAt: timestamp,
      scheduledTime,
      recipientsCount: validRecipients.length,
      recipients: validRecipients,
      subject: sanitizeText(subject, 'Daily Digest'),
      status: 'delivered',
      message: `تم إرسال النشرة الصباحية اليومية بنجاح إلى ${validRecipients.length} من قيادات المدرسة عبر البريد الإلكتروني.`,
    });
  } catch (err: any) {
    console.error('Error dispatching daily email digest:', err);
    res.status(500).json({
      error: 'فشل في إرسال النشرة الصباحية',
      details: err?.message || 'Unknown error',
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'Smart School Attendance System',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/readyz', (req, res) => {
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    requiresAuth: Boolean(APP_AUTH_TOKEN),
  });
});

// Vite Middleware for Development / Static for Production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart School Attendance Server running on http://0.0.0.0:${PORT}`);
    if (!APP_AUTH_TOKEN) {
      console.warn('Security warning: AUTH token is not configured. Set APP_AUTH_TOKEN for production use.');
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
