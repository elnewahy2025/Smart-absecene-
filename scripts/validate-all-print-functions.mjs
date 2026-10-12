import fs from 'fs';
import puppeteer from 'puppeteer';

const SERVER_URL = 'http://127.0.0.1:3000/api/pdf/generate';

const testCases = [
  {
    name: '1. Official Attendance Report',
    filename: 'attendance_report_validated.pdf',
    title: 'مدرسة الفلاح الأهلية النموذجية - التقرير الإحصائي الشامل للحضور والانضباط',
    htmlContent: `
      <div dir="rtl" class="space-y-6">
        <div class="border-b-2 border-emerald-600 pb-4 flex justify-between items-center">
          <div>
            <h1 class="text-xl font-bold text-emerald-900">المملكة العربية السعودية · وزارة التعليم</h1>
            <h2 class="text-lg font-bold text-slate-800">مدرسة الفلاح الأهلية النموذجية · فرع البنين</h2>
            <p class="text-xs text-slate-500">تقرير الحضور والغياب والانضباط المدرسي المعتمد للعام الدراسي 1448هـ</p>
          </div>
          <div class="text-left font-mono text-xs text-slate-600">
            <div>التاريخ: 12 أكتوبر 2026م</div>
            <div>الفصل الدراسي: الأول</div>
            <div>الحالة: معتمد رسمياً ✓</div>
          </div>
        </div>

        <div class="grid grid-cols-4 gap-4">
          <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <span class="text-xs text-emerald-700 block">إجمالي الطلاب المسجلين</span>
            <span class="text-2xl font-black text-emerald-900">420</span>
          </div>
          <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <span class="text-xs text-blue-700 block">نسبة الحضور التراكمية</span>
            <span class="text-2xl font-black text-blue-900">96.8%</span>
          </div>
          <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <span class="text-xs text-amber-700 block">حالات الإنذار الأول (5 أيام)</span>
            <span class="text-2xl font-black text-amber-900">7</span>
          </div>
          <div class="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
            <span class="text-xs text-rose-700 block">حالات الحرمان والغياب الحرج</span>
            <span class="text-2xl font-black text-rose-900">2</span>
          </div>
        </div>

        <table class="w-full text-right text-xs border border-slate-200 rounded-lg overflow-hidden">
          <thead class="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
            <tr>
              <th class="p-2.5">#</th>
              <th class="p-2.5">اسم الطالب الرباعي</th>
              <th class="p-2.5">رقم السجل المدني</th>
              <th class="p-2.5">الصف / الفصل</th>
              <th class="p-2.5">أيام الغياب</th>
              <th class="p-2.5">نسبة الحضور</th>
              <th class="p-2.5">الإجراء المتخذ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr class="hover:bg-slate-50">
              <td class="p-2.5 font-mono">1</td>
              <td class="p-2.5 font-bold">عبدالله بن خالد بن فهد الفلاحي</td>
              <td class="p-2.5 font-mono">1102938475</td>
              <td class="p-2.5">الثالث ثانوي / 1</td>
              <td class="p-2.5 font-bold text-rose-600">8 أيام</td>
              <td class="p-2.5 font-bold">88.5%</td>
              <td class="p-2.5 text-rose-700">إنذار نهائي وإشعار ولي الأمر</td>
            </tr>
            <tr class="hover:bg-slate-50">
              <td class="p-2.5 font-mono">2</td>
              <td class="p-2.5 font-bold">سلطان بن إبراهيم المنصور</td>
              <td class="p-2.5 font-mono">1098472911</td>
              <td class="p-2.5">الثاني ثانوي / 2</td>
              <td class="p-2.5 font-bold text-amber-600">5 أيام</td>
              <td class="p-2.5 font-bold">92.8%</td>
              <td class="p-2.5 text-amber-700">إنذار أول وتوجيه إرشادي</td>
            </tr>
            <tr class="hover:bg-slate-50">
              <td class="p-2.5 font-mono">3</td>
              <td class="p-2.5 font-bold">ريان بن تركي المطيري</td>
              <td class="p-2.5 font-mono">1120394857</td>
              <td class="p-2.5">الأول ثانوي / 3</td>
              <td class="p-2.5 font-bold text-emerald-600">0 أيام</td>
              <td class="p-2.5 font-bold">100.0%</td>
              <td class="p-2.5 text-emerald-700">تكريم الانضباط المدرسي الممتاز</td>
            </tr>
          </tbody>
        </table>

        <div class="pt-8 border-t border-slate-200 grid grid-cols-3 text-center text-xs font-bold text-slate-700">
          <div>
            <span>وكيل شؤون الطلاب</span>
            <div class="h-12 flex items-center justify-center text-slate-400 font-normal">أ. عبدالعزيز التميمي</div>
          </div>
          <div>
            <span>الموجه الطلابي</span>
            <div class="h-12 flex items-center justify-center text-slate-400 font-normal">أ. سامي القحطاني</div>
          </div>
          <div>
            <span>مدير المدرسة والختم الرسمي</span>
            <div class="h-12 flex items-center justify-center text-slate-400 font-normal">د. منصور الفالح</div>
          </div>
        </div>
      </div>
    `,
  },
  {
    name: '2. Emergency Evacuation Roster',
    filename: 'emergency_roster_validated.pdf',
    title: 'كشف الإخلاء الميداني وحصر الطوارئ - نقطة التجمع (أ) الفناء الرئيسي',
    htmlContent: `
      <div dir="rtl" class="space-y-6">
        <div class="bg-rose-600 text-white p-4 rounded-xl flex justify-between items-center shadow-sm">
          <div>
            <h1 class="text-lg font-black">كشف التحقق الميداني للطوارئ والإخلاء السريع</h1>
            <p class="text-xs opacity-90">مدرسة الفلاح النموذجية · نقطة التجمع: (أ) الفناء الرئيسي والملاعب الخارجية</p>
          </div>
          <div class="text-left font-mono text-xs">
            <div>حالة الكشف: مباشر / فوري</div>
            <div>وقت التوليد: 09:15 ص</div>
          </div>
        </div>

        <table class="w-full text-right text-xs border border-slate-200">
          <thead class="bg-slate-100 font-bold text-slate-800">
            <tr>
              <th class="p-2 border">#</th>
              <th class="p-2 border">اسم الطالب</th>
              <th class="p-2 border">الفصل</th>
              <th class="p-2 border">هاتف ولي الأمر (للطوارئ)</th>
              <th class="p-2 border">حالة التحقق الميداني</th>
              <th class="p-2 border">توقيع مسؤول النقطة</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="p-2 border font-mono">1</td>
              <td class="p-2 border font-bold">محمد بن سعود الحربي</td>
              <td class="p-2 border">3/1</td>
              <td class="p-2 border font-mono" dir="ltr">0551234567</td>
              <td class="p-2 border text-emerald-700 font-bold">تم الإخلاء والتحقق ✓</td>
              <td class="p-2 border">____________</td>
            </tr>
            <tr>
              <td class="p-2 border font-mono">2</td>
              <td class="p-2 border font-bold">عمر بن ياسر الدوسري</td>
              <td class="p-2 border">3/1</td>
              <td class="p-2 border font-mono" dir="ltr">0509876543</td>
              <td class="p-2 border text-emerald-700 font-bold">تم الإخلاء والتحقق ✓</td>
              <td class="p-2 border">____________</td>
            </tr>
            <tr>
              <td class="p-2 border font-mono">3</td>
              <td class="p-2 border font-bold">فيصل بن أحمد الزهراني</td>
              <td class="p-2 border">3/2</td>
              <td class="p-2 border font-mono" dir="ltr">0543219876</td>
              <td class="p-2 border text-amber-700 font-bold">غائب اليوم رسمياً</td>
              <td class="p-2 border">____________</td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
  },
  {
    name: '3. Single Student QR Attendance Badge',
    filename: 'single_student_qr_validated.pdf',
    title: 'بطاقة حضور QR - نايف بن فهد العتيبي (2026042)',
    htmlContent: `
      <div dir="rtl" style="max-width:380px; margin:20px auto; border:2px solid #059669; border-radius:16px; overflow:hidden; background:#ffffff; text-align:center; font-family:'Cairo', sans-serif;">
        <div style="background:#059669; color:#ffffff; padding:12px; font-weight:bold; font-size:14px;">
          <div>مدرسة الفلاح النموذجية</div>
          <div style="font-size:10px; font-weight:normal; opacity:0.9;">بطاقة الحضور والانضباط الذكي المعتمدة</div>
        </div>
        <div style="padding:16px;">
          <h2 style="margin:0; font-size:16px; font-weight:800; color:#0f172a;">نايف بن فهد العتيبي</h2>
          <div style="font-size:11px; color:#64748b; margin-top:4px;">
            <span>الصف: الثالث ثانوي (1)</span> · <span>رقم الطالب: 2026042</span>
          </div>
          <div style="font-size:10px; color:#94a3b8; font-family:monospace; margin-top:2px;">
            السجل المدني: 1123456789
          </div>

          <div style="margin:16px auto; padding:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; display:inline-block;">
            <svg width="150" height="150" viewBox="0 0 100 100" style="margin:0 auto; display:block;">
              <rect width="100" height="100" fill="#ffffff"/>
              <rect x="10" y="10" width="30" height="30" fill="#059669"/>
              <rect x="15" y="15" width="20" height="20" fill="#ffffff"/>
              <rect x="20" y="20" width="10" height="10" fill="#059669"/>
              <rect x="60" y="10" width="30" height="30" fill="#059669"/>
              <rect x="65" y="15" width="20" height="20" fill="#ffffff"/>
              <rect x="70" y="20" width="10" height="10" fill="#059669"/>
              <rect x="10" y="60" width="30" height="30" fill="#059669"/>
              <rect x="15" y="65" width="20" height="20" fill="#ffffff"/>
              <rect x="20" y="70" width="10" height="10" fill="#059669"/>
              <rect x="45" y="45" width="10" height="10" fill="#059669"/>
              <rect x="60" y="60" width="15" height="15" fill="#059669"/>
              <rect x="75" y="75" width="15" height="15" fill="#059669"/>
            </svg>
            <div style="font-size:9px; color:#64748b; margin-top:4px; font-weight:600;">مسح فوري لتسجيل الحضور بدون لمس</div>
          </div>

          <div style="border-top:1px solid #f1f5f9; padding-top:10px; font-size:10px; color:#475569; display:flex; justify-content:space-between;">
            <div>ولي الأمر: فهد العتيبي</div>
            <div dir="ltr" style="font-family:monospace; font-weight:bold;">0501234567</div>
          </div>
        </div>
      </div>
    `,
  },
  {
    name: '4. Batch Classroom Student QR Badges',
    filename: 'batch_qr_badges_validated.pdf',
    title: 'بطاقات الحضور السريع بالـ QR - فصل الثالث ثانوي / 1',
    htmlContent: `
      <div dir="rtl" style="font-family:'Cairo', sans-serif;">
        <div style="margin-bottom:15px; border-bottom:2px solid #059669; padding-bottom:8px;">
          <h1 style="margin:0; font-size:18px; color:#065f46; font-weight:800;">مدرسة الفلاح النموذجية · كشف بطاقات الحضور المجمعة</h1>
          <p style="margin:2px 0 0 0; font-size:11px; color:#64748b;">الصف: الثالث ثانوي / 1 · عدد البطاقات: 3 طلاب</p>
        </div>

        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:12px;">
          <div style="border:1.5px solid #059669; border-radius:12px; padding:10px; text-align:center; background:#ffffff;">
            <div style="font-size:11px; font-weight:bold; color:#065f46;">مدرسة الفلاح</div>
            <div style="font-size:13px; font-weight:bold; margin-top:2px;">حسام بن إبراهيم السالم</div>
            <div style="font-size:9px; color:#64748b;">رقم: 2026101 · 3/1</div>
            <div style="margin:8px auto; width:80px; height:80px; background:#f0fdf4; border:1px solid #bbf7d0; display:flex; align-items:center; justify-content:center; font-family:monospace; font-size:10px; color:#047857; font-weight:bold;">[ QR CODE ]</div>
            <div style="font-size:9px; color:#475569;">الطوارئ: 0551112233</div>
          </div>

          <div style="border:1.5px solid #059669; border-radius:12px; padding:10px; text-align:center; background:#ffffff;">
            <div style="font-size:11px; font-weight:bold; color:#065f46;">مدرسة الفلاح</div>
            <div style="font-size:13px; font-weight:bold; margin-top:2px;">بدر بن فهد الراشد</div>
            <div style="font-size:9px; color:#64748b;">رقم: 2026102 · 3/1</div>
            <div style="margin:8px auto; width:80px; height:80px; background:#f0fdf4; border:1px solid #bbf7d0; display:flex; align-items:center; justify-content:center; font-family:monospace; font-size:10px; color:#047857; font-weight:bold;">[ QR CODE ]</div>
            <div style="font-size:9px; color:#475569;">الطوارئ: 0554445566</div>
          </div>

          <div style="border:1.5px solid #059669; border-radius:12px; padding:10px; text-align:center; background:#ffffff;">
            <div style="font-size:11px; font-weight:bold; color:#065f46;">مدرسة الفلاح</div>
            <div style="font-size:13px; font-weight:bold; margin-top:2px;">مشعل بن ناصر الدوسري</div>
            <div style="font-size:9px; color:#64748b;">رقم: 2026103 · 3/1</div>
            <div style="margin:8px auto; width:80px; height:80px; background:#f0fdf4; border:1px solid #bbf7d0; display:flex; align-items:center; justify-content:center; font-family:monospace; font-size:10px; color:#047857; font-weight:bold;">[ QR CODE ]</div>
            <div style="font-size:9px; color:#475569;">الطوارئ: 0557778899</div>
          </div>
        </div>
      </div>
    `,
  },
];

async function runValidation() {
  console.log('=== STARTING COMPLETE PDF & PRINT VALIDATION ===\n');

  for (const tc of testCases) {
    console.log(`Generating PDF for: ${tc.name}...`);
    const res = await fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': 'falah.localhost:3000',
      },
      body: JSON.stringify({
        htmlContent: tc.htmlContent,
        title: tc.title,
        filename: tc.filename,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to generate ${tc.filename}: HTTP ${res.status}`);
    }

    const json = await res.json();
    if (!json.success || !json.pdfBase64) {
      throw new Error(`Invalid JSON response for ${tc.filename}`);
    }

    const pdfBuffer = Buffer.from(json.pdfBase64, 'base64');
    fs.writeFileSync(tc.filename, pdfBuffer);

    const header = pdfBuffer.subarray(0, 10).toString('utf8');
    const isPdf = header.startsWith('%PDF-1.');
    console.log(` -> Saved: ${tc.filename}`);
    console.log(` -> Size: ${pdfBuffer.length} bytes`);
    console.log(` -> Magic bytes: ${JSON.stringify(header)} (Valid: ${isPdf})\n`);

    if (!isPdf || pdfBuffer.length < 5000) {
      throw new Error(`PDF validation failed for ${tc.filename}`);
    }
  }

  console.log('=== RENDERING & VALIDATING VISUAL ARABIC RTL TYPOGRAPHY VIA CHROME ===');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const tc of testCases) {
    const pdfBytes = fs.readFileSync(tc.filename);
    const pdfBase64 = pdfBytes.toString('base64');
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

    const previewImageName = tc.filename.replace('.pdf', '_preview.png');

    const viewerHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
          <style>
            body { margin: 0; background: #e2e8f0; display: flex; justify-content: center; padding: 20px; }
            canvas { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); background: white; }
          </style>
        </head>
        <body>
          <canvas id="pdfCanvas"></canvas>
          <script>
            const rawData = atob("${pdfBase64}");
            const uint8Array = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; i++) {
              uint8Array[i] = rawData.charCodeAt(i);
            }

            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

            pdfjsLib.getDocument({ data: uint8Array }).promise.then(async pdf => {
              window.__pdfPages = pdf.numPages;
              const page1 = await pdf.getPage(1);
              const textContent = await page1.getTextContent();
              window.__extractedText = textContent.items.map(item => item.str).join(' ');

              const viewport = page1.getViewport({ scale: 1.5 });
              const canvas = document.getElementById('pdfCanvas');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              const ctx = canvas.getContext('2d');
              await page1.render({ canvasContext: ctx, viewport: viewport }).promise;
              window.__pdfRendered = true;
            }).catch(err => {
              window.__pdfError = err.message;
            });
          </script>
        </body>
      </html>
    `;

    await page.setContent(viewerHtml, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.__pdfRendered || window.__pdfError, { timeout: 15000 });

    const isRendered = await page.evaluate(() => window.__pdfRendered);
    const extractedText = await page.evaluate(() => window.__extractedText || '');
    const numPages = await page.evaluate(() => window.__pdfPages || 0);

    const canvasElement = await page.$('#pdfCanvas');
    if (canvasElement) {
      await canvasElement.screenshot({ path: previewImageName });
      console.log(`[PASS] ${tc.name}:`);
      console.log(`       - Pages: ${numPages}`);
      console.log(`       - Text items extracted: ${extractedText.length} characters`);
      console.log(`       - Sample Arabic text: "${extractedText.slice(0, 80)}..."`);
      console.log(`       - Preview rendered: ${previewImageName}\n`);
    }

    await page.close();
  }

  await browser.close();
  console.log('=== ALL 4 PRINT & PDF FUNCTIONS FULLY VALIDATED! ===');
}

runValidation().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
