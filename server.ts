import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '25mb' }));

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

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    let systemInstruction = `أنت المساعد الذكي المعتمد لنظام الحضور والغياب المدرسي "مدرستي حضور". تجيب باللغة العربية بأسلوب تربوي محترف ودقيق، وتساعد المعلمين والإداريين وأولياء الأمور في فهم لوائح الغياب، والتعامل مع حالات الغياب المتكرر، وحلول تحسين الانضباط المدرسي.`;

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

    // Determine model cascade based on user preference
    const primaryModel = modelPreference === 'gemini-3.1-pro-preview' 
      ? 'gemini-3.1-pro-preview' 
      : modelPreference === 'gemini-3.1-flash-lite'
      ? 'gemini-3.1-flash-lite'
      : 'gemini-3.5-flash';

    const modelCandidates = [
      primaryModel,
      'gemini-3.5-flash',
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite'
    ].filter((v, i, a) => a.indexOf(v) === i);

    // Format chat history for generateContent
    const formattedContents = messages.map((m: { role: string; content: string }) => ({
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

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    // Clean base64 data prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const defaultPrompt = `أنت خبير التدقيق الجنائي المكتبي والتحقق من الوثائق والتقارير الطبية المدرسية بنظام "مدرستي حضور".
مهمتك فحص وتحليل صورة المستند المرفق بدقة متناهية، والتحقق من أصالته، ومطابقته لبيانات الطالب المقيد وتاريخ الغياب، ورصد وتنبيه لجنة التدقيق بأي تناقضات (Irregularities / Inconsistencies) أو شبهات تلاعب أو نقص في البيانات المعتمدة.

البيانات المرجعية للطالب وسجل الغياب بالمدرسة:
- اسم الطالب المقيد رسميًا: "${expectedStudentName || 'غير محدد'}"
- تاريخ الغياب المسجل بالمدرسة المطلوب تبريره: "${expectedAbsenceDate || 'غير محدد'}"
- المرحلة والصف الدراسي: "${studentGrade || 'غير محدد'}"

يرجى فحص التقرير بالكامل واستخراج البيانات بدقة، ثم مقارنتها بالبيانات المرجعية لرصد التناقضات، وإرجاع تقرير التدقيق بصيغة JSON حصراً بهذا المخطط الدقيق دون أي نصوص إضافية خارجه:
{
  "documentType": "تقرير طبي رسمي / إجازة مرضية / خطاب خطي من ولي الأمر / كشف حضور / غير معروف",
  "studentName": "اسم المريض أو الطالب المكتوب في التقرير أو غير محدد",
  "issuerName": "اسم المستشفى، المركز الصحي، أو العيادة المصدرة",
  "physicianName": "اسم الطبيب المعالج ورقم الترخيص إن وجد",
  "reportDate": "تاريخ الكشف أو إصدار التقرير",
  "datesCovered": "فترة الإجازة أو الراحة الموصى بها (من تاريخ ... إلى ...)",
  "durationDays": "عدد أيام الراحة الموصى بها كرقم أو نص",
  "reasonOrDiagnosis": "التشخيص الطبي أو سبب التقرير باختصار",
  "hasOfficialStampOrSignature": true,
  "verificationStatus": "verified" | "warning" | "irregular",
  "overallRiskLevel": "low" | "medium" | "high",
  "integrityScore": 95,
  "recommendedDecision": "قبول العذر" | "رفض العذر" | "طلب مراجعة ولي الأمر وإحضار الأصل",
  "decisionRationale": "السبب المباشر والمفصل للتوصية باللغة العربية",
  "checklist": {
    "nameMatch": {
      "passed": true,
      "details": "هل يطابق اسم الطالب المكتوب في التقرير اسم الطالب المقيد (${expectedStudentName || ''})؟"
    },
    "dateMatch": {
      "passed": true,
      "details": "هل يغطي تاريخ التقرير الطبي أو فترة الإجازة تاريخ الغياب المطلوب (${expectedAbsenceDate || ''})؟"
    },
    "stampPresent": {
      "passed": true,
      "details": "هل يحتوي المستند على ختم رسمي واضح للمنشأة الصحية أو توقيع معتمد؟"
    },
    "noTamperingDetected": {
      "passed": true,
      "details": "هل المستند سليم من علامات التعديل الرقمي أو اختلاف الخطوط أو القص واللصق؟"
    },
    "accreditedFacility": {
      "passed": true,
      "details": "هل المنشأة المصدرة مستشفى أو مركز رعاية صحية معتمد؟"
    },
    "durationReasonable": {
      "passed": true,
      "details": "هل مدة الإجازة الموصى بها متناسبة مع التشخيص وحالة الطالب؟"
    }
  },
  "irregularities": [
    {
      "type": "name_mismatch" | "date_mismatch" | "missing_stamp" | "tampering_suspected" | "illegible_content" | "duration_exceeded",
      "severity": "high" | "medium" | "low",
      "titleAr": "عنوان التناقض أو المخالفة المرصودة",
      "titleEn": "Title in English",
      "descriptionAr": "شرح تفصيلي للتناقض المرصود في المستند وتأثيره على قبول العذر",
      "suggestedAction": "الإجراء الإداري المقترح من لجنة التدقيق"
    }
  ],
  "confidenceScore": "عالية (95%) / متوسطة (70%) / منخفضة (35%)",
  "notesAndRecommendations": "ملاحظات إرشادية ختامية للجنة تدقيق الأعذار المدرسية",
  "extractedSummary": "ملخص شامل وموجز للمستند في سطرين"
}`;

    const promptText = promptCustom ? `${defaultPrompt}\n\nملاحظات إضافية وتفاصيل سياق: ${promptCustom}` : defaultPrompt;

    // Use fast gemini-3.8-flash as primary model with fallbacks
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
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
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
      // Fallback clean parsing
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedJson = JSON.parse(jsonMatch[0]);
      } else {
        parsedJson = { rawAnalysis: result.text };
      }
    }

    res.json({
      analysis: parsedJson,
      rawText: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (err: any) {
    console.error('Error in /api/analyze-image:', err);
    res.status(500).json({
      error: 'فشل في تحليل صورة المستند',
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
      ? anomalies.map((a: any) => `- [${a.severity}] ${a.titleAr}: ${a.descriptionAr} (المقياس: ${a.metric})`).join('\n')
      : 'لا توجد شذوذات غير اعتيادية مسجلة هذا الصباح.';

    const highRiskSummary = Array.isArray(highRiskStudents) && highRiskStudents.length > 0
      ? highRiskStudents.map((s: any) => `- الطالب: ${s.name} (${s.className}) | غياب: ${s.totalAbsences} يوم | مستوى الخطر: ${s.riskTier} | هاتف ولي الأمر: ${s.guardianPhone}`).join('\n')
      : 'لا يوجد طلاب جدد في النطاق الحرج حالياً.';

    const promptText = `أنت المستشار التنفيذي الأول لقيادة المدارس ونظم الحضور والغياب الذكية "مدرستي حضور".
المطلوب إعداد "موجز الإدارة الصباحي اليومي (Daily Executive Morning Briefing)" لمدير المدرسة ووكيل شؤون الطلاب، والذي يُرسل تلقائياً عبر البريد الإلكتروني في تمام الساعة 06:45 صباحاً قبل بدء الطابور المدرسي والحصة الأولى.

بيانات المدرسة واليوم:
- اسم المنشأة: ${tenantName}
- التاريخ: ${date}
- نسبة الحضور التراكمية: ${overallAttendanceRate}% (إجمالي الطلاب: ${totalStudents})
- شذوذات وتناقضات الحضور المرصودة:
${anomaliesSummary}
- الأعذار الطبية المعلقة بانتظار الاعتماد: ${pendingJustificationsCount} عذر (منها ${pendingIrregularCount} عذر مشبوه برصد تناقضات بالذكاء الاصطناعي)
- قائمة الطلاب المعرضين لخطر الحرمان / الإنذار النهائي:
${highRiskSummary}

قم بصياغة تقرير موجز تنفيذي مركز باللغة العربية الفصحى بصيغة JSON حصراً بهذا المخطط:
{
  "headline": "عنوان تنفيذي موجز وجذاب للنشرة الصباحية",
  "urgencyLevel": "critical" | "elevated" | "normal",
  "executiveSummary": "فقرة مكثفة (سطرين إلى 3 أسطر) تلخص حالة الانضباط، أهم المخاطر المرصودة اليوم، وتوجيه عام للإدارة قبل بداية اليوم الدراسي",
  "keyPriorities": [
    "الإجراء الإداري الأول العاجل قبل الحصة الأولى",
    "الإجراء الإداري الثاني",
    "الإجراء الإداري الثالث"
  ],
  "counselorDirectives": [
    "توجيه خاص للأخصائي الاجتماعي / الموجه الطلابي للمتابعة الميدانية اليوم",
    "توجيه للتواصل مع أولياء الأمور المعنيين"
  ]
}`;

    const modelCandidates = [
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
    ];

    const result = await callGeminiWithFallback(modelCandidates, {
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
          headline: `نشرة الصباح للانضباط المدرسي - ${tenantName}`,
          urgencyLevel: anomalies.length > 0 ? 'elevated' : 'normal',
          executiveSummary: result.text.slice(0, 300),
          keyPriorities: [
            'مراجعة كشوف الحضور غير المعتمدة من اليوم السابق قبل الحصة الأولى.',
            'التدقيق في الأعذار الطبية المعلقة خصوصاً الحالات ذات التناقضات.',
            'تواصل الموجه الطلابي مع أولياء أمور الطلاب متكرري الغياب (5+ أيام).',
          ],
          counselorDirectives: [
            'استدعاء الطلاب الذين تكرر غيابهم يومي الأربعاء والخميس.',
            'حصر الطلاب المتوقع وصولهم إلى حد الحرمان الوزاري.',
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
    // Graceful fallback response
    res.json({
      success: true,
      briefing: {
        headline: 'نشرة الصباح الإدارية للانضباط والحضور المدرسي',
        urgencyLevel: req.body?.anomalies?.length > 1 ? 'critical' : 'elevated',
        executiveSummary: `متابعة صباحية استباقية لبيانات الانضباط المدرسي. تم رصد ${req.body?.anomalies?.length || 0} حالة شذوذ تحتاج تدخلاً إدارياً مبكراً، مع وجود ${req.body?.pendingJustificationsCount || 0} أعذار طبية قيد التدقيق و${req.body?.highRiskStudents?.length || 0} طلاب في النطاق الحرج.`,
        keyPriorities: [
          'اعتماد كشوف الحضور المعلقة للشعب قبل انطلاق الحصة الأولى.',
          'فحص التقرير الطبي المشبوه واتخاذ القرار بالرفض أو طلب الأصل.',
          'تفعيل خطة المتابعة الهاتفية مع أولياء أمور الطلاب في فئة الحرمان.',
        ],
        counselorDirectives: [
          'إجراء المقابلات الإرشادية الفردية للطلاب في الشريحة الحمراء (8+ أيام غياب).',
          'توثيق الاتصالات المباشرة في السجل المهني للموجه الطلابي.',
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

    const dispatchId = `digest-dispatch-${Date.now()}`;
    const timestamp = new Date().toISOString();

    console.log(`[DAILY-EMAIL-DIGEST] Dispatching automated morning email digest "${subject}" to ${recipients.length} administrators:`, recipients);

    // In preview environment, we simulate enterprise SMTP/SendGrid/Gmail delivery
    res.json({
      success: true,
      dispatchId,
      dispatchedAt: timestamp,
      scheduledTime,
      recipientsCount: recipients.length,
      recipients,
      subject,
      status: 'delivered',
      message: `تم إرسال النشرة الصباحية اليومية بنجاح إلى ${recipients.length} من قيادات المدرسة عبر البريد الإلكتروني.`,
    });
  } catch (err: any) {
    console.error('Error dispatching daily email digest:', err);
    res.status(500).json({
      error: 'فشل في إرسال النشرة الصباحية',
      details: err?.message || 'Unknown error',
    });
  }
});

// 5. Health status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'Smart School Attendance System',
    timestamp: new Date().toISOString(),
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
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
