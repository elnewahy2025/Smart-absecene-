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
    const { imageBase64, mimeType = 'image/jpeg', promptCustom } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    // Clean base64 data prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const defaultPrompt = `قم بتحليل هذا المستند المرفق (عذر طبي، تقرير مستشفى، خطاب ولي أمر، أو كشف مدرسي) بدقة عالية لدعم قرار لجنة الحضور والغياب المدرسية:
يرجى استخراج البيانات التالية بدقة وإرجاع النتيجة بصيغة JSON حصراً بهذا الهيكل:
{
  "documentType": "تقرير طبي / إجازة مرضية / خطاب خطي من ولي الأمر / كشف حضور / غير معروف",
  "studentName": "اسم الطالب المذكور في التقرير أو غير محدد",
  "issuerName": "اسم المستشفى، المركز الصحي، أو الطبيب المعالج والعيادة",
  "datesCovered": "تواريخ الإجازة أو الغياب (من تاريخ كذا إلى كذا)",
  "durationDays": "عدد الأيام الموصى بها إن وجدت كعدد صحيح أو نص",
  "reasonOrDiagnosis": "السبب المذكور أو التشخيص الطبي باختصار مع مراعاة الاحترام والخصوصية",
  "hasOfficialStampOrSignature": true,
  "confidenceScore": "نسبة الثقة في أصالة المستند وصلاحيته (عالية / متوسطة / منخفضة)",
  "recommendedDecision": "قبول العذر / رفض العذر / يحتاج مراجعة ولي الأمر",
  "notesAndRecommendations": "ملاحظات وتوصيات إرشادية للجنة تدقيق الأعذار المدرسية باللغة العربية",
  "extractedSummary": "ملخص شامل وموجز للمستند في سطرين"
}`;

    const promptText = promptCustom ? `${defaultPrompt}\n\nملاحظة إضافية من المستخدم: ${promptCustom}` : defaultPrompt;

    // Use gemini-3.1-pro-preview as specified, with graceful fallback to flash models
    const modelCandidates = [
      'gemini-3.1-pro-preview',
      'gemini-3.8-flash',
      'gemini-3.5-flash',
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

// 3. Health status
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
